"use server";

import { createClient } from "@/lib/supabaseServer";
import { createPartFromBase64, createUserContent, GoogleGenAI } from "@google/genai";
import { revalidatePath } from "next/cache";

const CAPTION_BUCKET = "captioned-images";
const FALLBACK_BUCKET = "avatars";
const ALLOWED_TYPES = new Set(["image/jpeg", "image/png", "image/webp", "image/gif"]);
const MAX_BYTES = 4.5 * 1024 * 1024;
const CANDIDATE_MODELS = [
  "gemini-3.8-flash",
  "gemini-3.7-flash",
  "gemini-3.6-flash",
  "gemini-3.5-flash",
  "gemini-3.5-flash-lite",
  "gemini-3.1-flash-lite",
];

function getAi() {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) return null;
  return new GoogleGenAI({ apiKey });
}

function parseCaption(raw: string) {
  const cleaned = raw.replace(/```json/gi, "").replace(/```/g, "").trim();
  try {
    const parsed = JSON.parse(cleaned) as { caption?: string };
    if (parsed.caption?.trim()) return parsed.caption.trim();
  } catch {
    // fall through to plain text
  }
  return cleaned.replace(/^["']|["']$/g, "").trim();
}

async function uploadToStorage(
  supabase: Awaited<ReturnType<typeof createClient>>,
  path: string,
  bytes: Buffer,
  contentType: string
) {
  const first = await supabase.storage.from(CAPTION_BUCKET).upload(path, bytes, {
    contentType,
    upsert: false,
  });
  if (!first.error) {
    const { data } = supabase.storage.from(CAPTION_BUCKET).getPublicUrl(path);
    return { bucket: CAPTION_BUCKET, imageUrl: data.publicUrl, storagePath: path };
  }

  const fallbackPath = path.startsWith("captioned/") ? path : `captioned/${path}`;
  const second = await supabase.storage.from(FALLBACK_BUCKET).upload(fallbackPath, bytes, {
    contentType,
    upsert: false,
  });
  if (second.error) {
    throw new Error(first.error.message || second.error.message);
  }
  const { data } = supabase.storage.from(FALLBACK_BUCKET).getPublicUrl(fallbackPath);
  return { bucket: FALLBACK_BUCKET, imageUrl: data.publicUrl, storagePath: fallbackPath };
}

export async function generateCaptionedImageAction(
  formData: FormData
): Promise<{ success: boolean; error?: string }> {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return { success: false, error: "Sign in with Google before you drop a photo." };
    }

    const file = formData.get("image");
    if (!(file instanceof File) || file.size === 0) {
      return { success: false, error: "Choose an image to caption." };
    }
    if (!ALLOWED_TYPES.has(file.type)) {
      return { success: false, error: "Use a JPEG, PNG, WebP, or GIF." };
    }
    if (file.size > MAX_BYTES) {
      return { success: false, error: "Keep the image under 4.5 MB." };
    }

    const ai = getAi();
    if (!ai) {
      return { success: false, error: "GEMINI_API_KEY is not configured on the server." };
    }

    const bytes = Buffer.from(await file.arrayBuffer());
    const prompt = `Look at this exact photograph. Write one caption that only works because of what is actually in the frame — a specific object, face, pose, setting, or accident of timing.

It must land as a joke or as painfully relatable humor. No generic lines that could sit on any photo. No hashtags, no quotation marks, no speaker labels.

Respond with JSON only:
{ "caption": "short caption, 12 words or fewer" }`;

    let response: { text?: string } | null = null;
    let lastError: unknown = null;

    for (const model of CANDIDATE_MODELS) {
      try {
        response = await ai.models.generateContent({
          model,
          contents: createUserContent([
            createPartFromBase64(bytes.toString("base64"), file.type),
            prompt,
          ]),
          config: {
            responseMimeType: "application/json",
          },
        });
        if (response?.text) break;
      } catch (err) {
        lastError = err;
      }
    }

    if (!response?.text) {
      const message = lastError instanceof Error ? lastError.message : "Gemini could not read the photo.";
      return { success: false, error: message };
    }

    const caption = parseCaption(response.text).slice(0, 280);
    if (!caption) {
      return { success: false, error: "The model returned an empty caption. Try another frame." };
    }

    await supabase.from("profiles").upsert({ id: user.id }, { onConflict: "id" });

    const ext = file.type.split("/")[1] || "jpg";
    const path = `${user.id}/${Date.now()}.${ext}`;
    const uploaded = await uploadToStorage(supabase, path, bytes, file.type);

    const { error: insertError } = await supabase.from("captioned_images").insert({
      user_id: user.id,
      storage_path: uploaded.storagePath,
      image_url: uploaded.imageUrl,
      caption,
    });

    if (insertError) {
      return {
        success: false,
        error: insertError.message.includes("captioned_images")
          ? "Database is missing captioned_images. Run supabase/schema.sql in the Supabase SQL editor."
          : `Database error: ${insertError.message}`,
      };
    }

    revalidatePath("/gallery");
    return { success: true };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Captioning failed.";
    return { success: false, error: message };
  }
}

export async function castVoteAction(
  imageId: string,
  voteValue: number
): Promise<{ success: boolean; error?: string }> {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return { success: false, error: "You must be signed in to vote." };
    }
    if (voteValue !== 1 && voteValue !== -1) {
      return { success: false, error: "Invalid vote." };
    }

    const { error } = await supabase.from("caption_votes").upsert(
      {
        image_id: imageId,
        user_id: user.id,
        vote_value: voteValue,
      },
      { onConflict: "image_id,user_id" }
    );

    if (error) {
      return { success: false, error: `Vote failed: ${error.message}` };
    }

    revalidatePath("/gallery");
    return { success: true };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to submit vote.";
    return { success: false, error: message };
  }
}

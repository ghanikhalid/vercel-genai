"use server";

import { createClient } from "@/lib/supabaseServer";
import { createPartFromBase64, createUserContent, GoogleGenAI } from "@google/genai";
import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";

const CAPTION_BUCKET = "captioned-images";
const FALLBACK_BUCKET = "avatars";
const ALLOWED_TYPES = new Set(["image/jpeg", "image/png", "image/webp", "image/gif"]);
const MAX_BYTES = 4.5 * 1024 * 1024;
const COOLDOWN_MS = 24 * 60 * 60 * 1000;

const CANDIDATE_MODELS = [
  "gemini-3.8-flash",
  "gemini-3.7-flash",
  "gemini-3.6-flash",
  "gemini-3.5-flash",
  "gemini-3.5-flash-lite",
  "gemini-3.1-flash-lite",
];

const COMEDIC_ANGLES = [
  "Write it as the unspoken inner monologue of the main subject or object in the frame.",
  "Frame it as an absurdly specific 'POV:' or 'Me when...' moment anchored to a detail in the photo.",
  "Zoom in on a subtle background detail, posture, or lighting quirk and make THAT the entire joke.",
  "Write it like a deadpan nature-documentary or museum-placard observation about what is happening.",
  "Contrast the vibe of the photo with a relatable everyday delusion (e.g., 'I have my life together').",
  "Treat the scene like a high-stakes movie screenshot for a completely mundane real-life problem.",
];

export interface DailyFortuneRecord {
  caption: string;
  prophecy: string;
  vibe_tag: string;
  lucky_stat: string;
  rolled_at: string;
}

const FORTUNE_THEMES = [
  {
    scenario: "Staring at a glowing laptop at 3 AM while clutching an oversized iced coffee",
    badge: "3:14 AM PRODUCTIVITY SPIRAL",
  },
  {
    scenario: "Sitting calmly in traffic while three minor schedule conflicts unfold at once",
    badge: "UNBOTHERED DELUSION MODE",
  },
  {
    scenario: "Explaining a wildly overcomplicated life plan as if it were a simple two-step errand",
    badge: "CEO OF OVERTHINKING",
  },
  {
    scenario: "Wearing noise-canceling headphones and politely ignoring 47 unread notifications",
    badge: "DO NOT DISTURB CHAMPION",
  },
  {
    scenario: "Checking a banking app right after justifying an artisanal $9 iced matcha",
    badge: "LITTLE TREAT ECONOMICS",
  },
  {
    scenario: "Walking down the street with main-character confidence despite forgetting why you left the house",
    badge: "MAIN CHARACTER SYNDROME",
  },
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
    upsert: true,
  });
  if (!first.error) {
    const { data } = supabase.storage.from(CAPTION_BUCKET).getPublicUrl(path);
    return { bucket: CAPTION_BUCKET, imageUrl: data.publicUrl, storagePath: path };
  }

  const fallbackPath = path.startsWith("captioned/") ? path : `captioned/${path}`;
  const second = await supabase.storage.from(FALLBACK_BUCKET).upload(fallbackPath, bytes, {
    contentType,
    upsert: true,
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

    // Fetch recent captions so re-uploading the same photo always produces a brand-new joke
    const { data: recentRows } = await supabase
      .from("captioned_images")
      .select("caption")
      .order("created_at", { ascending: false })
      .limit(12);

    const recentCaptions = (recentRows ?? [])
      .map((r) => r.caption)
      .filter(Boolean);

    const angle = COMEDIC_ANGLES[Math.floor(Math.random() * COMEDIC_ANGLES.length)];
    const variationToken = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

    const avoidBlock =
      recentCaptions.length > 0
        ? `\nIMPORTANT: Do NOT repeat or closely paraphrase any of these previously generated captions:\n${recentCaptions
            .map((c) => `- "${c}"`)
            .join("\n")}\nPick a completely different joke, detail, or angle.`
        : "";

    const bytes = Buffer.from(await file.arrayBuffer());
    const prompt = `Look at this exact photograph (variation seed: ${variationToken}). Write one fresh caption that only works because of what is actually in the frame — a specific object, face, pose, setting, or accident of timing.

Comedic direction for this take: ${angle}
${avoidBlock}

It must land as a sharp joke or painfully relatable humor. No generic lines that could sit on any photo. No hashtags, no quotation marks, no emojis, no speaker labels.

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
            temperature: 1.15,
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
    if (voteValue !== 1 && voteValue !== -1 && voteValue !== 0) {
      return { success: false, error: "Invalid vote." };
    }

    // Check if the user already has this exact vote — if so, or if voteValue === 0, remove the vote
    const { data: existingVote } = await supabase
      .from("caption_votes")
      .select("vote_value")
      .eq("image_id", imageId)
      .eq("user_id", user.id)
      .maybeSingle();

    if (voteValue === 0 || existingVote?.vote_value === voteValue) {
      const { error: deleteError } = await supabase
        .from("caption_votes")
        .delete()
        .eq("image_id", imageId)
        .eq("user_id", user.id);

      if (deleteError) {
        return { success: false, error: `Could not remove vote: ${deleteError.message}` };
      }

      revalidatePath("/gallery");
      return { success: true };
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

export async function rollDailyFortuneAction(): Promise<{
  success: boolean;
  error?: string;
  fortune?: DailyFortuneRecord;
  nextRollAt?: string;
}> {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return { success: false, error: "Sign in with Google to crack open today's meme fortune." };
    }

    const cookieStore = await cookies();
    const cookieKey = `prism_fortune_${user.id}`;

    let existingRoll: DailyFortuneRecord | null = null;
    const { data: dbRow, error: selectErr } = await supabase
      .from("daily_meme_fortunes")
      .select("caption, prophecy, vibe_tag, lucky_stat, rolled_at")
      .eq("user_id", user.id)
      .maybeSingle();

    if (!selectErr && dbRow) {
      existingRoll = dbRow as DailyFortuneRecord;
    } else {
      const rawCookie = cookieStore.get(cookieKey)?.value;
      if (rawCookie) {
        try {
          existingRoll = JSON.parse(rawCookie) as DailyFortuneRecord;
        } catch {
          existingRoll = null;
        }
      }
    }

    if (existingRoll?.rolled_at) {
      const elapsed = Date.now() - new Date(existingRoll.rolled_at).getTime();
      if (elapsed < COOLDOWN_MS) {
        const nextRollAt = new Date(new Date(existingRoll.rolled_at).getTime() + COOLDOWN_MS).toISOString();
        return {
          success: false,
          error: "Your daily meme cookie is already cracked! Come back when the 24-hour timer resets.",
          fortune: existingRoll,
          nextRollAt,
        };
      }
    }

    const ai = getAi();
    if (!ai) {
      return { success: false, error: "GEMINI_API_KEY is not configured on the server." };
    }

    const theme = FORTUNE_THEMES[Math.floor(Math.random() * FORTUNE_THEMES.length)];

    const textPrompt = `You are a razor-sharp, hilariously relatable fortune cookie oracle.
Today's relatable life mood for the user is: "${theme.scenario}".

Write a text-only meme headline and a daily fortune-cookie prophecy telling the user that THIS exact vibe is how their day is going to unfold today. Do not include any emojis.
Respond strictly in valid JSON with these exact keys:
{
  "caption": "Short punchy meme headline (max 12 words) that lands a joke on this mood, no emojis",
  "prophecy": "2 witty, relatable sentences predicting how their actual day today will mirror this exact energy in hilarious detail, no emojis.",
  "vibe_tag": "A 2-3 word all-caps aura label (e.g. CAFFEINATED HUBRIS), no emojis",
  "lucky_stat": "A funny stat for today (e.g. 94% CHANCE OF SIDE-EYE), no emojis"
}`;

    let parsedFortune: {
      caption?: string;
      prophecy?: string;
      vibe_tag?: string;
      lucky_stat?: string;
    } = {};

    for (const model of CANDIDATE_MODELS) {
      try {
        const res = await ai.models.generateContent({
          model,
          contents: textPrompt,
          config: {
            responseMimeType: "application/json",
            temperature: 1.1,
          },
        });
        if (res?.text) {
          const cleaned = res.text.replace(/```json/gi, "").replace(/```/g, "").trim();
          parsedFortune = JSON.parse(cleaned);
          if (parsedFortune.caption) break;
        }
      } catch {
        // try next model
      }
    }

    const caption = (
      parsedFortune.caption ||
      "ME PRETENDING MY 47 OPEN TABS ARE A CAREFULLY ENGINEERED SYSTEM"
    )
      .replace(/^["']|["']$/g, "")
      .slice(0, 280);

    const prophecy = (
      parsedFortune.prophecy ||
      "The universe has decided that today you will confidently improvise your way through three minor plot twists while holding an overpriced beverage. Embrace the chaos—your comedic timing will save you by 4 PM."
    ).slice(0, 400);

    const vibe_tag = (parsedFortune.vibe_tag || theme.badge).toUpperCase().slice(0, 48);
    const lucky_stat = (parsedFortune.lucky_stat || "88% UNBOTHERED ENERGY").toUpperCase().slice(0, 48);

    await supabase.from("profiles").upsert({ id: user.id }, { onConflict: "id" });

    const rolled_at = new Date().toISOString();
    const fortuneRecord: DailyFortuneRecord = {
      caption,
      prophecy,
      vibe_tag,
      lucky_stat,
      rolled_at,
    };

    const { error: upsertErr } = await supabase.from("daily_meme_fortunes").upsert(
      {
        user_id: user.id,
        ...fortuneRecord,
      },
      { onConflict: "user_id" }
    );

    if (upsertErr) {
      // Fallback if the user still has the older table with image_url NOT NULL
      await supabase.from("daily_meme_fortunes").upsert(
        {
          user_id: user.id,
          image_url: "",
          ...fortuneRecord,
        },
        { onConflict: "user_id" }
      );
    }

    cookieStore.set(cookieKey, JSON.stringify(fortuneRecord), {
      httpOnly: true,
      sameSite: "lax",
      maxAge: 60 * 60 * 24 * 7,
      path: "/",
    });

    revalidatePath("/dashboard");
    return {
      success: true,
      fortune: fortuneRecord,
      nextRollAt: new Date(new Date(rolled_at).getTime() + COOLDOWN_MS).toISOString(),
    };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Could not roll today's fortune.";
    return { success: false, error: message };
  }
}

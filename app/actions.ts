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

const IMAGE_MODELS = [
  "gemini-3.1-flash-image",
  "gemini-3.1-flash-lite-image",
  "gemini-3-pro-image",
  "gemini-2.5-flash-image",
];

export interface DailyFortuneRecord {
  image_url: string;
  caption: string;
  prophecy: string;
  vibe_tag: string;
  lucky_stat: string;
  rolled_at: string;
}

const MEME_ARCHETYPES = [
  {
    title: "Racoon holding iced coffee at 3 AM staring into a glowing laptop",
    scenePrompt:
      "A hilarious vibrant 3D Pixar-style illustration of an exhausted raccoon in a designer hoodie clutching an oversized iced coffee in front of a glowing laptop at 3 AM, dramatic neon studio lighting, expressive wide eyes, meme template aesthetic, no text in image.",
    theme: {
      bgA: "#ff2e93",
      bgB: "#5b2eff",
      accent: "#00f5d4",
      character: "🦝",
      prop: "🧋💻",
      badge: "3:14 AM PRODUCTIVITY SPIRAL",
    },
  },
  {
    title: "Golden retriever wearing sunglasses in a flaming convertible saying everything is fine",
    scenePrompt:
      "A glossy 3D render of an unbothered golden retriever wearing clout sunglasses sitting in a pink convertible while chaotic confetti and tiny cartoon flames swirl around in the background, bright saturated colors, funny meme vibe, no text in image.",
    theme: {
      bgA: "#ff7b00",
      bgB: "#ff0055",
      accent: "#ffee32",
      character: "🐕‍🦺",
      prop: "🕶️🔥",
      badge: "UNBOTHERED DELUSION MODE",
    },
  },
  {
    title: "Dramatic cat in a tiny business suit pointing at a chaotic conspiracy whiteboard",
    scenePrompt:
      "A funny hyper-detailed 3D studio portrait of a chubby orange cat wearing a tiny rumpled business suit, frantically gesturing with a laser pointer at a whiteboard covered in red yarn and sticky notes, colorful rim lighting, meme format, no text in image.",
    theme: {
      bgA: "#00bbf9",
      bgB: "#7b2cbf",
      accent: "#fee440",
      character: "🐱",
      prop: "📊🧶",
      badge: "CEO OF OVERTHINKING",
    },
  },
  {
    title: "Frog on a lily pad wearing noise-canceling headphones ignoring 47 unread messages",
    scenePrompt:
      "A sleek 3D illustration of a smug green frog lounging on a neon pool float wearing oversized silver noise-canceling headphones while floating notification bubbles bounce harmlessly off a forcefield, vibrant Apple-keynote lighting, no text in image.",
    theme: {
      bgA: "#00f5d4",
      bgB: "#2ec4b6",
      accent: "#ff5d8f",
      character: "🐸",
      prop: "🎧📵",
      badge: "DO NOT DISTURB CHAMPION",
    },
  },
  {
    title: "Hamster staring at a bank app after buying one $9 artisanal matcha",
    scenePrompt:
      "A comedic close-up 3D render of a tiny wide-eyed hamster holding a fancy green iced matcha latte while staring in shock at a glowing smartphone screen, dramatic cyan and magenta lighting, cinematic depth of field, no text in image.",
    theme: {
      bgA: "#8338ec",
      bgB: "#3a86ff",
      accent: "#b5f44a",
      character: "🐹",
      prop: "🍵💸",
      badge: "FINANCIALLY QUESTIONABLE VIBES",
    },
  },
  {
    title: "Pigeon in puffer jacket strutting through chaos like main character",
    scenePrompt:
      "A stylish 3D render of a New York pigeon wearing an iridescent holographic puffer jacket and tiny sneakers strutting confidently down a crosswalk while papers fly everywhere behind it, ultra-colorful studio lighting, no text in image.",
    theme: {
      bgA: "#f72585",
      bgB: "#4361ee",
      accent: "#4cc9f0",
      character: "🐦",
      prop: "🧥✨",
      badge: "MAIN CHARACTER SYNDROME",
    },
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

function escapeXml(str: string) {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

function buildVibrantMemeSvgBuffer(archetype: (typeof MEME_ARCHETYPES)[number]) {
  const { bgA, bgB, accent, character, prop, badge } = archetype.theme;
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 900 720" width="900" height="720">
  <defs>
    <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="${bgA}" />
      <stop offset="55%" stop-color="${bgB}" />
      <stop offset="100%" stop-color="#090b16" />
    </linearGradient>
    <radialGradient id="orb1" cx="22%" cy="24%" r="48%">
      <stop offset="0%" stop-color="${accent}" stop-opacity="0.72" />
      <stop offset="100%" stop-color="${accent}" stop-opacity="0" />
    </radialGradient>
    <radialGradient id="orb2" cx="80%" cy="72%" r="45%">
      <stop offset="0%" stop-color="#ffffff" stop-opacity="0.35" />
      <stop offset="100%" stop-color="#ffffff" stop-opacity="0" />
    </radialGradient>
    <linearGradient id="glass" x1="0%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" stop-color="#ffffff" stop-opacity="0.28" />
      <stop offset="100%" stop-color="#ffffff" stop-opacity="0.06" />
    </linearGradient>
  </defs>
  <rect width="900" height="720" fill="url(#bg)" />
  <circle cx="210" cy="180" r="320" fill="url(#orb1)" />
  <circle cx="720" cy="520" r="290" fill="url(#orb2)" />
  <g opacity="0.22" stroke="#ffffff" stroke-width="1.5" fill="none">
    <ellipse cx="450" cy="360" rx="370" ry="150" transform="rotate(-14 450 360)" />
    <ellipse cx="450" cy="360" rx="370" ry="150" transform="rotate(22 450 360)" />
  </g>
  <rect x="145" y="92" width="610" height="460" rx="46" fill="url(#glass)" stroke="#ffffff" stroke-opacity="0.4" stroke-width="2" />
  <rect x="250" y="122" width="400" height="42" rx="21" fill="#090b16" fill-opacity="0.55" stroke="${accent}" stroke-opacity="0.7" />
  <text x="450" y="149" text-anchor="middle" fill="${accent}" font-family="system-ui, -apple-system, sans-serif" font-size="16" font-weight="800" letter-spacing="3">${escapeXml(badge)}</text>
  <text x="415" y="370" text-anchor="middle" font-size="185">${character}</text>
  <text x="575" y="425" text-anchor="middle" font-size="92">${prop}</text>
</svg>`;
  return Buffer.from(svg, "utf-8");
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

    // Check existing roll in database (or fallback cookie if table isn't migrated yet)
    let existingRoll: DailyFortuneRecord | null = null;
    const { data: dbRow, error: selectErr } = await supabase
      .from("daily_meme_fortunes")
      .select("image_url, caption, prophecy, vibe_tag, lucky_stat, rolled_at")
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

    const archetype = MEME_ARCHETYPES[Math.floor(Math.random() * MEME_ARCHETYPES.length)];

    // 1. Generate humorous relatable caption + fortune-cookie prophecy for the user's day
    const textPrompt = `You are a chaotic, razor-sharp, hilariously relatable fortune cookie oracle.
Today's visual meme scene for the user is: "${archetype.title}".

Write a meme caption and a daily prophecy telling the user that THIS exact meme is how their day is going to unfold today.
Respond strictly in valid JSON with these exact keys:
{
  "caption": "Short punchy top/bottom style meme caption (max 11 words) that lands a joke on this scene",
  "prophecy": "2 witty, relatable sentences predicting how their actual day today will mirror this meme in hilarious detail.",
  "vibe_tag": "A 2-3 word all-caps aura label (e.g. CAFFEINATED HUBRIS)",
  "lucky_stat": "A funny stat for today (e.g. 94% CHANCE OF SIDE-EYE)"
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
      "ME PRETENDING MY 47 OPEN TABS ARE A SYSTEM"
    )
      .replace(/^["']|["']$/g, "")
      .slice(0, 280);

    const prophecy = (
      parsedFortune.prophecy ||
      "The universe has decided that today you will confidently improvise your way through three minor plot twists while holding an overpriced beverage. Embrace the chaos—your comedic timing will save you by 4 PM."
    ).slice(0, 400);

    const vibe_tag = (parsedFortune.vibe_tag || archetype.theme.badge).toUpperCase().slice(0, 48);
    const lucky_stat = (parsedFortune.lucky_stat || "88% UNBOTHERED ENERGY").toUpperCase().slice(0, 48);

    // 2. Try generating a custom AI meme illustration via Gemini image models; fallback to vibrant SVG art uploaded to Supabase Storage
    let imageBytes: Buffer | null = null;
    let mimeType = "image/png";
    let ext = "png";

    for (const imgModel of IMAGE_MODELS) {
      try {
        const imgRes: any = await ai.models.generateContent({
          model: imgModel,
          contents: archetype.scenePrompt,
        });
        const parts = imgRes?.candidates?.[0]?.content?.parts ?? [];
        const inlinePart = parts.find((p: any) => p?.inlineData?.data);
        if (inlinePart?.inlineData?.data) {
          imageBytes = Buffer.from(inlinePart.inlineData.data, "base64");
          mimeType = inlinePart.inlineData.mimeType || "image/png";
          ext = mimeType.split("/")[1] || "png";
          break;
        }
      } catch {
        // fallback if image model isn't enabled on this key
      }
    }

    if (!imageBytes) {
      imageBytes = buildVibrantMemeSvgBuffer(archetype);
      mimeType = "image/svg+xml";
      ext = "svg";
    }

    await supabase.from("profiles").upsert({ id: user.id }, { onConflict: "id" });

    const storagePath = `${user.id}/fortune-${Date.now()}.${ext}`;
    let imageUrl = "";
    try {
      const uploaded = await uploadToStorage(supabase, storagePath, imageBytes, mimeType);
      imageUrl = uploaded.imageUrl;
    } catch {
      imageUrl = `data:${mimeType};base64,${imageBytes.toString("base64")}`;
    }

    const rolled_at = new Date().toISOString();
    const fortuneRecord: DailyFortuneRecord = {
      image_url: imageUrl,
      caption,
      prophecy,
      vibe_tag,
      lucky_stat,
      rolled_at,
    };

    await supabase.from("daily_meme_fortunes").upsert(
      {
        user_id: user.id,
        ...fortuneRecord,
      },
      { onConflict: "user_id" }
    );

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

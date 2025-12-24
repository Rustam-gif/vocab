// Deploy: supabase functions deploy story-image --no-verify-jwt
// Required secrets: OPENAI_API_KEY, SUPABASE_SERVICE_ROLE_KEY
//
// Optional env/secrets:
// - STORY_IMAGE_MODEL=gpt-image-1-mini (default) or gpt-image-1
// - STORY_IMAGE_DEFAULT_STYLE=editorial
// - STORY_IMAGE_DEFAULT_QUALITY=medium   // low|medium|high
// - STORY_IMAGE_DEFAULT_SIZE=1024x1536   // 1024x1024|1024x1536|1536x1024|auto
// - STORY_IMAGE_CACHE_VERSION=3          // bump to force regen
// - STORY_IMAGE_OUTPUT_FORMAT=png        // png|jpeg|webp
// - STORY_IMAGE_TIMEOUT_MS=120000
// - STORY_IMAGE_RETURN_SIGNED_URL=0/1
// - STORY_IMAGE_SIGNED_URL_SECONDS=...

import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.48.0";

type StoryImageRequest = {
  phrase?: string;
  sense?: string;
  example?: string;
  style?: string;   // flat|editorial|comic|painterly|3d|photo
  quality?: string; // low|medium|high
  size?: string;    // 1024x1024|1024x1536|1536x1024|auto
};

type StoryImageResponse =
  | {
      status: "ok";
      url: string;
      cacheHit: boolean;
      key: string;
      storagePath: string;
      createdAt?: string | null;
      meta?: {
        model: string;
        style: string;
        quality: string;
        size: string;
        format: string;
      };
    }
  | { status: "error"; message: string; key?: string; hint?: string };

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "*",
  "Access-Control-Allow-Methods": "POST,GET,OPTIONS",
  "Content-Type": "application/json",
};

const STORY_IMAGES_BUCKET = Deno.env.get("STORY_IMAGES_BUCKET") || "story-images";
const STORY_IMAGES_TABLE = Deno.env.get("STORY_IMAGES_TABLE") || "story_images";
const STORY_IMAGE_CACHE_VERSION = Deno.env.get("STORY_IMAGE_CACHE_VERSION") || "2";

const OPENAI_API_KEY = Deno.env.get("OPENAI_API_KEY") || "";
const SUPABASE_URL = Deno.env.get("SUPABASE_URL") || "";
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";

// default cheaper model (you can flip back to gpt-image-1 if you want max quality)
const DEFAULT_MODEL = (Deno.env.get("STORY_IMAGE_MODEL") || "gpt-image-1-mini").trim();

const OUTPUT_FORMAT_RAW = (Deno.env.get("STORY_IMAGE_OUTPUT_FORMAT") || "png").toLowerCase();
const OUTPUT_FORMAT_ALLOWLIST = new Set(["png", "jpeg", "webp"]);
const OUTPUT_FORMAT = OUTPUT_FORMAT_ALLOWLIST.has(OUTPUT_FORMAT_RAW) ? OUTPUT_FORMAT_RAW : "png";
const OUTPUT_EXT = OUTPUT_FORMAT === "jpeg" ? "jpg" : OUTPUT_FORMAT;
const OUTPUT_MIME =
  OUTPUT_FORMAT === "jpeg" ? "image/jpeg" : OUTPUT_FORMAT === "webp" ? "image/webp" : "image/png";

const RETURN_SIGNED_URL = (Deno.env.get("STORY_IMAGE_RETURN_SIGNED_URL") || "") === "1";
const SIGNED_URL_SECONDS = (() => {
  const raw = Number(Deno.env.get("STORY_IMAGE_SIGNED_URL_SECONDS") || "");
  if (!Number.isFinite(raw) || raw <= 0) return 60 * 60 * 24 * 30;
  return Math.max(60, Math.min(raw, 60 * 60 * 24 * 365));
})();

const TIMEOUT_MS = (() => {
  const raw = Number(Deno.env.get("STORY_IMAGE_TIMEOUT_MS") || "");
  if (!Number.isFinite(raw) || raw <= 0) return 120_000; // 2 min default
  return Math.max(15_000, Math.min(raw, 180_000));
})();

const STYLE_ALLOWLIST = new Set(["flat", "editorial", "comic", "painterly", "3d", "photo"]);
const QUALITY_ALLOWLIST = new Set(["low", "medium", "high"]);
const SIZE_ALLOWLIST = new Set(["1024x1024", "1024x1536", "1536x1024", "auto"]);

const DEFAULT_STYLE = (Deno.env.get("STORY_IMAGE_DEFAULT_STYLE") || "editorial").toLowerCase();
const DEFAULT_QUALITY = (Deno.env.get("STORY_IMAGE_DEFAULT_QUALITY") || "medium").toLowerCase();
const DEFAULT_SIZE = (Deno.env.get("STORY_IMAGE_DEFAULT_SIZE") || "1024x1536").toLowerCase();

const normalize = (s: string) =>
  (s || "")
    .trim()
    .replace(/\s+/g, " ")
    .slice(0, 700);

const toHex = (bytes: ArrayBuffer) =>
  Array.from(new Uint8Array(bytes))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");

const sha256Hex = async (input: string) => {
  const data = new TextEncoder().encode(input);
  const hash = await crypto.subtle.digest("SHA-256", data);
  return toHex(hash);
};

const base64ToBytes = (b64: string) => {
  const binary = atob(b64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i += 1) bytes[i] = binary.charCodeAt(i);
  return bytes;
};

function pickStyle(raw?: string) {
  const s = normalize(raw || DEFAULT_STYLE).toLowerCase();
  return STYLE_ALLOWLIST.has(s) ? s : "editorial";
}

function pickQuality(raw?: string) {
  const q = normalize(raw || DEFAULT_QUALITY).toLowerCase();
  return QUALITY_ALLOWLIST.has(q) ? q : "medium";
}

function pickSize(raw?: string) {
  const z = normalize(raw || DEFAULT_SIZE).toLowerCase();
  // normalize common invalid sizes from UI (e.g. 768x1152) to closest portrait size
  if (!SIZE_ALLOWLIST.has(z)) return "1024x1536";
  return z;
}

const STYLE_PRESETS: Record<string, string[]> = {
  flat: [
    "Flat vector illustration, minimal, clean shapes, simple lighting, modern app illustration style.",
    "Simple background, clear subject, easy-to-read visual metaphor.",
  ],
  editorial: [
    "Editorial illustration, more detail, textured shading, richer lighting, crisp edges, modern magazine style.",
    "Balanced colors, not pastel-only, slightly higher contrast, more depth.",
  ],
  comic: [
    "Comic illustration style, bold outlines, expressive characters, dynamic scene, richer colors.",
    "Clean linework, clear action, no text bubbles.",
  ],
  painterly: [
    "Digital painting illustration, detailed, soft brush textures, cinematic lighting, more realistic proportions.",
    "More depth, more background context, still simple enough to understand instantly.",
  ],
  "3d": [
    "3D render illustration, soft studio lighting, detailed materials, Pixar-like but NOT any specific character.",
    "Clean scene, clear objects, high readability.",
  ],
  photo: [
    "Photorealistic scene, DSLR look, natural lighting, shallow depth of field.",
    "No brands, no logos, no readable text.",
  ],
};

const buildPrompt = (phrase: string, sense: string, example: string, style: string) => {
  const preset = STYLE_PRESETS[style] || STYLE_PRESETS.editorial;

  const rules = [
    "No text, no subtitles, no watermarks, no logos, no brand names, no UI elements.",
    "Portrait composition (9:16). Keep the main subject centered and clear.",
    "Illustrate the meaning/sense (what it *means*), not the literal words.",
  ];

  const phraseLine = `Phrase: "${phrase}".`;
  const senseLine = `Meaning/sense: "${sense}".`;
  const exampleLine = example ? `Example: "${example}".` : "";

  // extra disambiguation nudges
  const phraseNorm = phrase.toLowerCase().trim();
  const senseNorm = `${sense} ${example}`.toLowerCase();
  const avoid: string[] = [];

  if (phraseNorm === "make up" && /\b(invent|excuse|story|lie)\b/.test(senseNorm)) {
    avoid.push("Avoid cosmetics/makeup imagery.");
  }
  if (phraseNorm === "turn down" && /\b(reject|decline|refuse|offer|invitation)\b/.test(senseNorm)) {
    avoid.push("Avoid speakers/volume knobs/audio controls.");
  }
  if (phraseNorm === "look up" && /\b(dictionary|search|find|information)\b/.test(senseNorm)) {
    avoid.push("Show searching for info (dictionary/phone/search), not looking up at the sky.");
  }

  const avoidLine = avoid.length ? `Avoid: ${avoid.join(" ")}` : "";

  return [
    ...preset,
    ...rules,
    phraseLine,
    senseLine,
    exampleLine,
    avoidLine,
  ]
    .filter(Boolean)
    .join("\n");
};

const buildSafeFallbackPrompt = (phrase: string, sense: string) => {
  // used only if moderation blocks the main prompt
  return [
    "Abstract symbolic illustration, no people, no sensitive content, no text.",
    "Use simple objects/icons/metaphors to represent meaning.",
    "Portrait (9:16), clean background.",
    `Phrase: "${phrase}".`,
    `Meaning: "${sense}".`,
  ].join("\n");
};

const createSupabaseAdmin = () => {
  if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) return null;
  return createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, { global: { fetch } });
};

const ensureBucketExists = async (supabase: any) => {
  try {
    const { data, error } = await supabase.storage.listBuckets();
    if (error) return;
    const exists = Array.isArray(data) && data.some((b: any) => b?.id === STORY_IMAGES_BUCKET);
    if (exists) return;
    await supabase.storage.createBucket(STORY_IMAGES_BUCKET, { public: true });
  } catch {
    // best-effort only
  }
};

const getPublicOrSignedUrl = async (supabase: any, storagePath: string) => {
  if (RETURN_SIGNED_URL) {
    const { data } = await supabase.storage.from(STORY_IMAGES_BUCKET).createSignedUrl(storagePath, SIGNED_URL_SECONDS);
    if (data?.signedUrl) return data.signedUrl as string;
  }
  const { data } = supabase.storage.from(STORY_IMAGES_BUCKET).getPublicUrl(storagePath);
  return (data?.publicUrl || "") as string;
};

async function callOpenAIImage(opts: {
  model: string;
  prompt: string;
  size: string;
  quality: string;
  format: string;
  timeoutMs: number;
}) {
  const controller = new AbortController();
  const t = setTimeout(() => controller.abort(), opts.timeoutMs);

  try {
    const body: Record<string, any> = {
      model: opts.model,
      prompt: opts.prompt,
      size: opts.size,           // must be one of allowed values
      quality: opts.quality,     // low|medium|high
      output_format: opts.format // png|jpeg|webp
    };

    if (opts.format === "webp" || opts.format === "jpeg") {
      body.output_compression = 80;
    }

    const upstream = await fetch("https://api.openai.com/v1/images/generations", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${OPENAI_API_KEY}`,
      },
      body: JSON.stringify(body),
      signal: controller.signal,
    });

    const status = upstream.status;
    const bodyText = await upstream.text();

    if (!upstream.ok) {
      let parsed: any = null;
      try { parsed = JSON.parse(bodyText); } catch { /* ignore */ }

      const code = parsed?.error?.code || null;
      const message = parsed?.error?.message || bodyText?.slice(0, 300) || "OpenAI error";

      return {
        ok: false as const,
        status,
        code,
        message,
        raw: bodyText,
      };
    }

    let json: any = null;
    try { json = bodyText ? JSON.parse(bodyText) : null; } catch { json = null; }

    const b64 =
      (typeof json?.data?.[0]?.b64_json === "string" && json.data[0].b64_json) ||
      (typeof json?.data?.[0]?.b64 === "string" && json.data[0].b64) ||
      null;

    if (!b64) {
      return { ok: false as const, status: 502, code: "no_image", message: "OpenAI returned no image", raw: bodyText };
    }

    return { ok: true as const, b64 };
  } catch (err: any) {
    const msg = err?.name === "AbortError" ? "timeout" : (err?.message || String(err));
    return { ok: false as const, status: 504, code: "aborted", message: msg, raw: "" };
  } finally {
    clearTimeout(t);
  }
}

async function buildCacheKey(args: {
  phrase: string;
  sense: string;
  style: string;
  quality: string;
  size: string;
  model: string;
}) {
  const s = `${normalize(args.phrase)}|${normalize(args.sense)}|${args.style}|${args.quality}|${args.size}|${args.model}|v${STORY_IMAGE_CACHE_VERSION}|${OUTPUT_FORMAT}`;
  return await sha256Hex(s);
}

function readRequestFromGet(url: URL): StoryImageRequest {
  return {
    phrase: url.searchParams.get("phrase") || "",
    sense: url.searchParams.get("sense") || "",
    example: url.searchParams.get("example") || "",
    style: url.searchParams.get("style") || url.searchParams.get("sty") || "",
    quality: url.searchParams.get("quality") || "",
    size: url.searchParams.get("size") || "",
  };
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  if (req.method !== "POST" && req.method !== "GET") {
    return new Response(JSON.stringify({ status: "error", message: "Method Not Allowed" } satisfies StoryImageResponse), {
      status: 405,
      headers: corsHeaders,
    });
  }

  if (!OPENAI_API_KEY) {
    return new Response(JSON.stringify({ status: "error", message: "Missing OPENAI_API_KEY" } satisfies StoryImageResponse), {
      status: 500,
      headers: corsHeaders,
    });
  }

  const supabase = createSupabaseAdmin();
  if (!supabase) {
    return new Response(
      JSON.stringify({ status: "error", message: "Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY" } satisfies StoryImageResponse),
      { status: 500, headers: corsHeaders },
    );
  }

  let payload: StoryImageRequest;

  if (req.method === "GET") {
    payload = readRequestFromGet(new URL(req.url));
  } else {
    try {
      payload = (await req.json()) as StoryImageRequest;
    } catch {
      return new Response(JSON.stringify({ status: "error", message: "Invalid JSON body" } satisfies StoryImageResponse), {
        status: 400,
        headers: corsHeaders,
      });
    }
  }

  const phrase = normalize(payload?.phrase || "");
  const sense = normalize(payload?.sense || "");
  const example = normalize(payload?.example || "");

  const style = pickStyle(payload?.style);
  const quality = pickQuality(payload?.quality);
  const size = pickSize(payload?.size);
  const model = normalize(DEFAULT_MODEL);

  if (!phrase || phrase.length < 2) {
    return new Response(JSON.stringify({ status: "error", message: "phrase is required" } satisfies StoryImageResponse), {
      status: 400,
      headers: corsHeaders,
    });
  }
  if (!sense || sense.length < 3) {
    return new Response(JSON.stringify({ status: "error", message: "sense is required" } satisfies StoryImageResponse), {
      status: 400,
      headers: corsHeaders,
    });
  }

  const key = await buildCacheKey({ phrase, sense, style, quality, size, model });

  // 1) DB cache
  try {
    const { data, error } = await supabase
      .from(STORY_IMAGES_TABLE)
      .select("storage_path,created_at")
      .eq("key", key)
      .maybeSingle();

    if (!error && data?.storage_path) {
      const url = await getPublicOrSignedUrl(supabase, data.storage_path);
      if (url) {
        return new Response(
          JSON.stringify({
            status: "ok",
            url,
            cacheHit: true,
            key,
            storagePath: data.storage_path,
            createdAt: data.created_at ?? null,
            meta: { model, style, quality, size, format: OUTPUT_FORMAT },
          } satisfies StoryImageResponse),
          { status: 200, headers: corsHeaders },
        );
      }
    }
  } catch {
    // continue
  }

  await ensureBucketExists(supabase);

  // 2) Generate image
  const prompt = buildPrompt(phrase, sense, example, style);

  let gen = await callOpenAIImage({
    model,
    prompt,
    size,
    quality,
    format: OUTPUT_FORMAT,
    timeoutMs: TIMEOUT_MS,
  });

  // If blocked by moderation, retry once with an abstract safe prompt (often fixes “random blocks”)
  if (!gen.ok && gen.code === "moderation_blocked") {
    const safePrompt = buildSafeFallbackPrompt(phrase, sense);
    gen = await callOpenAIImage({
      model,
      prompt: safePrompt,
      size,
      quality,
      format: OUTPUT_FORMAT,
      timeoutMs: TIMEOUT_MS,
    });
  }

  if (!gen.ok) {
    console.error("[story-image] OpenAI error", { status: gen.status, code: gen.code, message: gen.message });
    return new Response(
      JSON.stringify({
        status: "error",
        message: "OpenAI image generation failed",
        key,
        hint:
          gen.code === "aborted"
            ? `Timeout. Increase STORY_IMAGE_TIMEOUT_MS (now ${TIMEOUT_MS}ms) or use quality=low/size=1024x1024.`
            : gen.message,
      } satisfies StoryImageResponse),
      { status: 502, headers: corsHeaders },
    );
  }

  const storagePath = `${style}/${quality}/${size}/${key}.${OUTPUT_EXT}`;
  const bytes = base64ToBytes(gen.b64);
  const blob = new Blob([bytes], { type: OUTPUT_MIME });

  // 3) Upload to storage
  try {
    const { error } = await supabase.storage.from(STORY_IMAGES_BUCKET).upload(storagePath, blob, {
      contentType: OUTPUT_MIME,
      cacheControl: "31536000",
      upsert: false,
    });

    // race = ok
    if (error && !(String(error?.message || "").toLowerCase().includes("already exists"))) {
      console.error("[story-image] upload failed", error);
      return new Response(JSON.stringify({ status: "error", message: "Upload failed", key } satisfies StoryImageResponse), {
        status: 500,
        headers: corsHeaders,
      });
    }
  } catch (err) {
    console.error("[story-image] upload threw", err);
    return new Response(JSON.stringify({ status: "error", message: "Upload failed", key } satisfies StoryImageResponse), {
      status: 500,
      headers: corsHeaders,
    });
  }

  // 4) DB cache write
  try {
    await supabase.from(STORY_IMAGES_TABLE).upsert(
      {
        key,
        phrase,
        sense,
        style,
        storage_path: storagePath,
      },
      { onConflict: "key" },
    );
  } catch (err) {
    console.error("[story-image] upsert failed", err);
  }

  const url = await getPublicOrSignedUrl(supabase, storagePath);
  if (!url) {
    return new Response(JSON.stringify({ status: "error", message: "Failed to build URL", key } satisfies StoryImageResponse), {
      status: 500,
      headers: corsHeaders,
    });
  }

  return new Response(
    JSON.stringify({
      status: "ok",
      url,
      cacheHit: false,
      key,
      storagePath,
      meta: { model, style, quality, size, format: OUTPUT_FORMAT },
    } satisfies StoryImageResponse),
    { status: 200, headers: corsHeaders },
  );
});
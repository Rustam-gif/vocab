import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.48.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "*",
  "Access-Control-Allow-Methods": "POST,OPTIONS",
  "Content-Type": "application/json",
};

const RECRAFT_API_KEY = Deno.env.get("RECRAFT_API_KEY");
const SUPABASE_URL = Deno.env.get("SUPABASE_URL") || "";
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";
const STORY_IMAGES_RECRAFT_TABLE = Deno.env.get("STORY_IMAGES_RECRAFT_TABLE") || "story_images_recraft";

const supabase =
  SUPABASE_URL && SUPABASE_SERVICE_ROLE_KEY
    ? createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, { global: { fetch } })
    : null;

const normalizeKeyPart = (s: string) =>
  (s || "")
    .trim()
    .toLowerCase()
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

/**
 * VERY SIMPLE, LOW-DETAIL SCENES
 * Simple = better memory
 */
const SCENES: Record<string, string> = {
  machine_failure: `
A simple illustration of a machine that stopped working.
One object only (car OR device).
One clear issue: smoke OR warning light.
No background clutter.
Flat shapes.
Low detail.
`,

  return_action: `
A person returning to a place.
One person.
One door OR path.
Calm neutral mood.
Simple shapes.
Minimal background.
`,

  interaction_problem: `
Two people facing each other.
One speaking, one refusing.
Simple indoor setting.
Clear hand gesture.
Low detail.
`,

  control_change: `
Two people near a desk or object.
One person leaving, another taking position.
Clear role change.
Simple composition.
Minimal background.
`,
};

/**
 * Phrase → scene mapping
 */
function pickScene(phrase: string): string {
  const p = phrase.toLowerCase();

  if (p.includes("break") || p.includes("stop working")) return "machine_failure";
  if (p.includes("come back") || p.includes("return")) return "return_action";
  if (p.includes("deal with")) return "interaction_problem";
  if (p.includes("take over")) return "control_change";

  return "interaction_problem";
}

serve(async (req) => {
  try {
    if (req.method === "OPTIONS") {
      return new Response("ok", { headers: corsHeaders });
    }

    if (req.method !== "POST") {
      return new Response(
        JSON.stringify({ image_url: null, error: "Method not allowed" }),
        { status: 405, headers: corsHeaders }
      );
    }

    let body: any = null;
    try {
      body = await req.json();
    } catch {
      return new Response(
        JSON.stringify({ image_url: null, error: "Invalid JSON body" }),
        { status: 400, headers: corsHeaders }
      );
    }

    const phrase = typeof body?.phrase === "string" ? body.phrase.trim() : "";
    const sense = typeof body?.sense === "string" ? body.sense.trim() : "";

    if (!phrase || !sense) {
      return new Response(
        JSON.stringify({ image_url: null, error: "phrase and sense are required" }),
        { status: 400, headers: corsHeaders }
      );
    }

    const cacheKey = await sha256Hex(`recraft:v1|${normalizeKeyPart(phrase)}|${normalizeKeyPart(sense)}`);

    if (supabase) {
      try {
        const { data, error } = await supabase
          .from(STORY_IMAGES_RECRAFT_TABLE)
          .select("image_url")
          .eq("key", cacheKey)
          .maybeSingle();

        const cached = !error && typeof data?.image_url === "string" ? data.image_url.trim() : "";
        if (cached) {
          return new Response(JSON.stringify({ image_url: cached }), { status: 200, headers: corsHeaders });
        }
      } catch (err) {
        console.error("[story-image-recraft] cache read failed", err);
      }
    }

    if (!RECRAFT_API_KEY) {
      return new Response(
        JSON.stringify({ image_url: null, error: "Missing RECRAFT_API_KEY" }),
        { status: 500, headers: corsHeaders }
      );
    }

    const sceneKey = pickScene(phrase);
    const scenePrompt = SCENES[sceneKey];

    const prompt = `
${scenePrompt}

Meaning to show:
"${sense}"

STRICT RULES:
- No text
- No letters
- No numbers
- No symbols
- No icons
- No UI
- No metaphors
- No surreal elements
- Educational illustration
- Low detail
- Clear composition
`;

    let recraftResponse: Response;
    try {
      recraftResponse = await fetch(
        "https://external.api.recraft.ai/v1/images/generations",
        {
          method: "POST",
          headers: {
            "Authorization": `Bearer ${RECRAFT_API_KEY}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            model: "recraftv3",
            style: "digital_illustration",
            prompt,
            size: "1024x1536",
            n: 1,
          }),
        }
      );
    } catch (err) {
      return new Response(
        JSON.stringify({
          image_url: null,
          error: "Recraft request failed",
          details: err?.message || String(err),
        }),
        { status: 502, headers: corsHeaders }
      );
    }

    if (!recraftResponse.ok) {
      const errorText = await recraftResponse.text();
      return new Response(
        JSON.stringify({ image_url: null, error: "Recraft failed", details: errorText }),
        { status: 502, headers: corsHeaders }
      );
    }

    const data = await recraftResponse.json();
    const imageUrl = data?.data?.[0]?.url;

    if (!imageUrl) {
      return new Response(
        JSON.stringify({ image_url: null, error: "No image returned from Recraft" }),
        { status: 500, headers: corsHeaders }
      );
    }

    if (supabase) {
      try {
        await supabase.from(STORY_IMAGES_RECRAFT_TABLE).upsert(
          {
            key: cacheKey,
            phrase,
            sense,
            image_url: imageUrl,
          },
          { onConflict: "key" }
        );
      } catch (err) {
        console.error("[story-image-recraft] cache write failed", err);
      }
    }

    return new Response(
      JSON.stringify({
        image_url: imageUrl,
      }),
      { status: 200, headers: corsHeaders }
    );
  } catch (err) {
    return new Response(
      JSON.stringify({
        image_url: null,
        error: "Unhandled error",
        details: err?.message || String(err),
      }),
      { status: 500, headers: corsHeaders }
    );
  }
});

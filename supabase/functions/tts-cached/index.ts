import { serve } from 'https://deno.land/std@0.224.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': '*',
  'Access-Control-Allow-Methods': 'POST,OPTIONS',
  'Content-Type': 'application/json',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method Not Allowed' }), {
      status: 405,
      headers: corsHeaders,
    });
  }

  const OPENAI_API_KEY = Deno.env.get('OPENAI_API_KEY');
  const SUPABASE_URL = Deno.env.get('SUPABASE_URL');
  const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

  if (!OPENAI_API_KEY || !SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
    return new Response(JSON.stringify({ error: 'Server misconfigured' }), {
      status: 500,
      headers: corsHeaders,
    });
  }

  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

  let payload: any;
  try {
    payload = await req.json();
  } catch {
    return new Response(JSON.stringify({ error: 'Invalid JSON body' }), {
      status: 400,
      headers: corsHeaders,
    });
  }

  const text = (payload?.text || '').trim();
  const voice = (payload?.voice || 'shimmer').trim();
  const rate = typeof payload?.rate === 'number' ? Math.max(0.25, Math.min(4.0, payload.rate)) : 1.0;

  if (!text) {
    return new Response(JSON.stringify({ error: 'text is required' }), {
      status: 400,
      headers: corsHeaders,
    });
  }

  // Create a stable cache key from text + voice + rate
  const cacheKey = await hashString(`${text}-${voice}-${rate}`);
  const fileName = `tts/${cacheKey}.mp3`;
  const bucketName = 'tts-cache';

  try {
    // Check if audio already exists in storage
    const { data: existingFile, error: checkError } = await supabase.storage
      .from(bucketName)
      .list('tts', {
        search: `${cacheKey}.mp3`,
      });

    if (existingFile && existingFile.length > 0) {
      // File exists, return signed URL
      const { data: urlData } = await supabase.storage
        .from(bucketName)
        .createSignedUrl(fileName, 3600); // 1 hour expiry

      if (urlData?.signedUrl) {
        console.log(`[TTS Cache] Hit: ${text.substring(0, 30)}...`);
        return new Response(
          JSON.stringify({ url: urlData.signedUrl, cached: true }),
          { status: 200, headers: corsHeaders }
        );
      }
    }

    // Cache miss - generate new TTS
    console.log(`[TTS Cache] Miss: Generating for "${text.substring(0, 30)}..."`);

    // Add spacing for clearer pronunciation at beginning and end
    const paddedText = `  ${text}  `;

    const ttsResponse = await fetch('https://api.openai.com/v1/audio/speech', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: 'tts-1',
        voice,
        input: paddedText,
        response_format: 'mp3',
        speed: 0.85,
      }),
    });

    if (!ttsResponse.ok) {
      const errText = await ttsResponse.text();
      console.error('[TTS Cache] OpenAI error:', errText);
      return new Response(JSON.stringify({ error: 'TTS generation failed' }), {
        status: ttsResponse.status,
        headers: corsHeaders,
      });
    }

    const audioBuffer = await ttsResponse.arrayBuffer();

    // Upload to Supabase Storage
    const { error: uploadError } = await supabase.storage
      .from(bucketName)
      .upload(fileName, audioBuffer, {
        contentType: 'audio/mpeg',
        upsert: true,
      });

    if (uploadError) {
      console.error('[TTS Cache] Upload error:', uploadError);
      return new Response(JSON.stringify({ error: 'Failed to cache audio' }), {
        status: 500,
        headers: corsHeaders,
      });
    }

    // Return signed URL
    const { data: urlData } = await supabase.storage
      .from(bucketName)
      .createSignedUrl(fileName, 3600);

    if (!urlData?.signedUrl) {
      return new Response(JSON.stringify({ error: 'Failed to generate URL' }), {
        status: 500,
        headers: corsHeaders,
      });
    }

    console.log(`[TTS Cache] Generated and cached: ${text.substring(0, 30)}...`);
    return new Response(
      JSON.stringify({ url: urlData.signedUrl, cached: false }),
      { status: 200, headers: corsHeaders }
    );
  } catch (error) {
    console.error('[TTS Cache] Unexpected error:', error);
    return new Response(JSON.stringify({ error: 'Unexpected server error' }), {
      status: 500,
      headers: corsHeaders,
    });
  }
});

// Helper to create a stable hash from a string
async function hashString(str: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(str);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('').substring(0, 16);
}

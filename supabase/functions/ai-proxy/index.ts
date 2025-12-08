import { serve } from 'https://deno.land/std@0.224.0/http/server.ts';

type Payload = {
  prompt?: string;
  context?: string;
  model?: string;
  temperature?: number;
  max_tokens?: number;
  messages?: any[];
  kind?: 'chat' | 'tts';
  // TTS specific
  input?: string;
  voice?: string;
  format?: 'mp3' | 'wav' | 'ogg' | 'flac';
  rate?: number;
};

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

  let payload: Payload;
  try {
    payload = await req.json();
  } catch {
    return new Response(JSON.stringify({ error: 'Invalid JSON body' }), {
      status: 400,
      headers: corsHeaders,
    });
  }

  const OPENAI_API_KEY = Deno.env.get('OPENAI_API_KEY');
  if (!OPENAI_API_KEY) {
    console.error('[ai-proxy] Missing OPENAI_API_KEY environment variable');
    return new Response(JSON.stringify({ error: 'Server misconfigured' }), {
      status: 500,
      headers: corsHeaders,
    });
  }

  const model = (payload?.model || 'gpt-4o-mini').trim();
  const temperature =
    typeof payload?.temperature === 'number' ? payload.temperature : 0.8;
  const maxTokens =
    typeof payload?.max_tokens === 'number' ? payload.max_tokens : 600;
  const kind = payload?.kind === 'tts' ? 'tts' : 'chat';

  if (kind === 'tts') {
    const input = (payload?.input || '').trim();
    if (!input) {
      return new Response(JSON.stringify({ error: 'input is required for TTS' }), {
        status: 400,
        headers: corsHeaders,
      });
    }
    const voice = (payload?.voice || 'verse').trim();
    const format = (payload?.format || 'mp3').trim() as 'mp3' | 'wav' | 'ogg' | 'flac';
    const speed = typeof payload?.rate === 'number' ? Math.max(0.25, Math.min(4.0, payload.rate)) : 1.0;

    try {
      const upstream = await fetch('https://api.openai.com/v1/audio/speech', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${OPENAI_API_KEY}`,
        },
        body: JSON.stringify({
          model: 'gpt-4o-mini-tts',
          voice,
          input,
          format,
          speed,
        }),
      });

      const audioBuffer = await upstream.arrayBuffer();
      const contentType = upstream.headers.get('Content-Type') || `audio/${format}`;

      if (!upstream.ok) {
        const errText = new TextDecoder().decode(audioBuffer);
        console.error('[ai-proxy] OpenAI TTS error', errText);
        return new Response(JSON.stringify({ error: errText || 'TTS failed' }), {
          status: upstream.status,
          headers: corsHeaders,
        });
      }

      // Base64 encode for safe JSON transport
      const base64Audio = arrayBufferToBase64(audioBuffer);
      return new Response(JSON.stringify({ audio: base64Audio, contentType }), {
        status: 200,
        headers: corsHeaders,
      });
    } catch (error) {
      console.error('[ai-proxy] Unexpected TTS error', error);
      return new Response(JSON.stringify({ error: 'Unexpected TTS server error' }), {
        status: 500,
        headers: corsHeaders,
      });
    }
  }

  let messages: any[] | undefined = Array.isArray(payload?.messages)
    ? payload.messages.filter(
        (m: any) =>
          !!m && typeof m.role === 'string' && typeof m.content !== 'undefined',
      )
    : undefined;

  const prompt = (payload?.prompt || '').trim();
  if (!messages || messages.length === 0) {
    if (!prompt) {
      return new Response(JSON.stringify({ error: 'prompt or messages required' }), {
        status: 400,
        headers: corsHeaders,
      });
    }
    messages = [
      {
        role: 'system',
        content:
          payload?.context?.trim() ||
          'You are a concise English vocabulary tutor. Keep responses short and structured.',
      },
      { role: 'user', content: prompt },
    ];
  }

  try {
    const upstream = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        model,
        temperature,
        max_tokens: maxTokens,
        messages,
      }),
    });

    const data = await upstream.json();

    if (!upstream.ok) {
      console.error('[ai-proxy] OpenAI error', data);
      return new Response(JSON.stringify({ error: data?.error || data }), {
        status: upstream.status,
        headers: corsHeaders,
      });
    }

    const content =
      data?.choices?.[0]?.message?.content?.trim?.() || '';

    return new Response(
      JSON.stringify({
        content,
        usage: data?.usage,
        id: data?.id,
      }),
      { status: 200, headers: corsHeaders },
    );
  } catch (error) {
    console.error('[ai-proxy] Unexpected error', error);
    return new Response(JSON.stringify({ error: 'Unexpected server error' }), {
      status: 500,
      headers: corsHeaders,
    });
  }
});

// Helpers
function arrayBufferToBase64(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';
  let result = '';
  let i = 0;

  while (i < bytes.length) {
    const a = bytes[i++] ?? 0;
    const b = bytes[i++] ?? 0;
    const c = bytes[i++] ?? 0;

    const triplet = (a << 16) | (b << 8) | c;
    result += chars[(triplet >> 18) & 63];
    result += chars[(triplet >> 12) & 63];
    result += chars[(triplet >> 6) & 63];
    result += chars[triplet & 63];
  }

  const padding = bytes.length % 3;
  if (padding === 1) {
    result = result.slice(0, -2) + '==';
  } else if (padding === 2) {
    result = result.slice(0, -1) + '=';
  }

  return result;
}

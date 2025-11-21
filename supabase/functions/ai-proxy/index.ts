import { serve } from 'https://deno.land/std@0.224.0/http/server.ts';

type ChatMessage = {
  role: 'system' | 'user' | 'assistant';
  content: string;
};

type Payload = {
  prompt?: string;
  context?: string;
  model?: string;
  temperature?: number;
  max_tokens?: number;
  messages?: ChatMessage[];
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

  let messages: ChatMessage[] | undefined = Array.isArray(payload?.messages)
    ? payload.messages.filter(
        (m): m is ChatMessage =>
          !!m && typeof m.role === 'string' && typeof m.content === 'string',
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

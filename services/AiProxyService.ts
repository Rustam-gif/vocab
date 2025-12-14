import { AI_PROXY_URL } from '../lib/appConfig';
import { SUPABASE_ANON_KEY } from '../lib/supabase';

type ChatMessage = {
  role: 'system' | 'user' | 'assistant';
  content: string;
};

type ProxyRequest = {
  prompt?: string;
  context?: string;
  model?: string;
  temperature?: number;
  maxTokens?: number;
  messages?: ChatMessage[];
};

type ProxyResponse = {
  content: string;
  id?: string;
  usage?: {
    prompt_tokens?: number;
    completion_tokens?: number;
    total_tokens?: number;
  };
};

class AiProxyService {
  private get baseUrl(): string {
    const url = AI_PROXY_URL?.trim();
    if (!url) {
      throw new Error(
        'AI_PROXY_URL is not configured. Set it in lib/appConfig.ts to your Supabase/Vercel function URL.',
      );
    }
    return url;
  }

  async complete(request: ProxyRequest, init?: { signal?: AbortSignal }): Promise<ProxyResponse> {
    const body = {
      prompt: request.prompt,
      context: request.context,
      model: request.model,
      temperature: request.temperature,
      max_tokens: request.maxTokens,
      messages: request.messages,
    };

    const res = await fetch(this.baseUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        apikey: SUPABASE_ANON_KEY,
        Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
      },
      body: JSON.stringify(body),
      signal: init?.signal,
    });

    if (!res.ok) {
      let detail = '';
      try {
        const data = await res.json();
        detail =
          typeof data?.error === 'string'
            ? data.error
            : JSON.stringify(data?.error || data);
      } catch {
        detail = res.statusText;
      }
      throw new Error(detail || 'AI proxy request failed');
    }

    const data = (await res.json()) as ProxyResponse;
    return {
      content: data?.content || '',
      id: data?.id,
      usage: data?.usage,
    };
  }
}

export const aiProxyService = new AiProxyService();
export type { ProxyRequest, ProxyResponse };

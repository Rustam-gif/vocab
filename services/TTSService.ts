// services/TTSService.ts
// Thin wrapper around OpenAI's Text-to-Speech endpoint using the gpt-4o-mini-tts model.

import { OPENAI_API_KEY, AI_PROXY_URL } from '../lib/appConfig';

export type TTSVoice =
  | 'alloy'
  | 'verse'
  | 'aria'
  | 'sage'
  | 'ballad'
  | 'vibrant'
  | 'calypso';

export interface TTSOptions {
  voice?: TTSVoice;
  // 0.25 - 4.0; we clamp to safe range
  rate?: number;
  // 'mp3' tends to be the most broadly supported for <audio>
  format?: 'mp3' | 'wav' | 'ogg' | 'flac';
}

const DEFAULT_VOICE: TTSVoice = 'verse';
const DEFAULT_FORMAT: TTSOptions['format'] = 'mp3';
const TTS_ENDPOINT = 'https://api.openai.com/v1/audio/speech';

function clamp(v: number, lo: number, hi: number) {
  return Math.max(lo, Math.min(hi, v));
}

export class TTSService {
  /**
   * Synthesize speech and return raw ArrayBuffer audio data.
   */
  async synthesizeToArrayBuffer(text: string, opts: TTSOptions = {}): Promise<{
    data: ArrayBuffer;
    contentType: string;
  }> {
    if (!text || !text.trim()) {
      throw new Error('TTS text is empty');
    }
    const voice = (opts.voice || DEFAULT_VOICE) as TTSVoice;
    const format = opts.format || DEFAULT_FORMAT;
    const speed = clamp(opts.rate ?? 1.0, 0.25, 4.0);

    // Prefer Supabase proxy when configured
    const proxyUrl = AI_PROXY_URL && AI_PROXY_URL.trim();
    if (proxyUrl) {
      const res = await fetch(proxyUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          kind: 'tts',
          voice,
          format,
          rate: speed,
          input: text,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data?.audio) {
        throw new Error(`TTS proxy failed (${res.status}): ${data?.error || 'no audio'}`);
      }
      const buf = base64ToArrayBuffer(String(data.audio));
      const ct = data.contentType || `audio/${format}`;
      return { data: buf, contentType: ct };
    }

    // Direct OpenAI fallback (requires client-side key)
    const apiKey = OPENAI_API_KEY && OPENAI_API_KEY.trim();
    if (!apiKey) {
      throw new Error('Missing OpenAI API key for TTS. Set OPENAI_API_KEY or AI_PROXY_URL.');
    }

    const body = {
      model: 'gpt-4o-mini-tts',
      voice,
      input: text,
      format,
      speed,
    } as const;

    const res = await fetch(TTS_ENDPOINT, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });

    if (!res.ok) {
      const errText = await res.text().catch(() => '');
      throw new Error(`TTS request failed (${(res as any).status || 0}): ${errText}`);
    }

    const buf = await res.arrayBuffer();
    const ct = res.headers.get('Content-Type') || `audio/${format}`;
    return { data: buf, contentType: ct };
  }
}

const ttsService = new TTSService();
export default ttsService;

function base64ToArrayBuffer(base64: string): ArrayBuffer {
  const clean = base64.replace(/[^A-Za-z0-9+/=]/g, '');
  const decode =
    typeof globalThis.atob === 'function'
      ? (b: string) => globalThis.atob(b)
      : (b: string) => {
          // Fallback for environments without atob
          // eslint-disable-next-line @typescript-eslint/no-var-requires
          const buf = require('buffer').Buffer;
          return buf.from(b, 'base64').toString('binary');
        };
  const binary = decode(clean);
  const len = binary.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i += 1) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes.buffer;
}

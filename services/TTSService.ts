// services/TTSService.ts
// Thin wrapper around OpenAI's Text-to-Speech endpoint using the gpt-4o-mini-tts model.

import { OPENAI_API_KEY } from '../lib/appConfig';

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

function ensureApiKey(): string {
  const key = OPENAI_API_KEY && OPENAI_API_KEY.trim();
  if (!key) {
    throw new Error(
      'Missing OpenAI API key for TTS. Set OPENAI_API_KEY in lib/appConfig.ts.'
    );
  }
  return key;
}

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
    const apiKey = ensureApiKey();
    const voice = (opts.voice || DEFAULT_VOICE) as TTSVoice;
    const format = opts.format || DEFAULT_FORMAT;
    const speed = clamp(opts.rate ?? 1.0, 0.25, 4.0);

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


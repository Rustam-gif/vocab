import ttsService from '../services/TTSService';
import type { TTSVoice } from '../services/TTSService';

export type SpeakOptions = {
  language?: string; // hint only; OpenAI voices are English-first today
  pitch?: number; // not supported by API; ignored
  rate?: number; // mapped to OpenAI speed (0.25–4.0)
  voice?: string; // expected to be like 'openai:verse' or raw voice name
  onDone?: () => void;
  onStopped?: () => void;
  onError?: (err?: any) => void;
};

type InternalAudio = HTMLAudioElement & { __ttsUrl?: string };
type NativeSound = { unloadAsync: () => Promise<void>; stopAsync?: () => Promise<void> } | null;

let currentAudio: InternalAudio | null = null;
let currentNativeSound: NativeSound = null;
let currentRNSound: any = null;

// WebView audio player for in-app playback
let webViewAudioPlayer: any = null;
export function setWebViewAudioPlayer(player: any) {
  webViewAudioPlayer = player;
}

function isBrowserAudioAvailable(): boolean {
  try {
    // @ts-ignore - Audio may not exist in RN native
    return typeof Audio !== 'undefined' && typeof URL !== 'undefined';
  } catch {
    return false;
  }
}

function resolveOpenAIVoice(voice?: string): import('../services/TTSService').TTSVoice | undefined {
  if (!voice) return 'shimmer'; // Default to shimmer
  // Allow identifiers like 'openai:shimmer' or plain 'shimmer'
  const v = voice.replace(/^openai:/i, '').toLowerCase();
  const allowed = new Set(['nova', 'shimmer', 'echo', 'onyx', 'fable', 'alloy', 'ash', 'sage', 'coral']);
  return (allowed.has(v) ? (v as any) : 'shimmer');
}

export async function speak(text: string, options: SpeakOptions = {}) {
  // Stop any current playback first
  stop();

  const voice = resolveOpenAIVoice(options.voice) || 'shimmer';
  const rate = typeof options.rate === 'number' ? options.rate : 1.0;

  // Use cached TTS endpoint with WebView playback
  try {
    const { SUPABASE_ANON_KEY } = require('../lib/supabase');

    console.log('[speech] Fetching cached TTS for:', text.substring(0, 30) + '...');
    const response = await fetch('https://auirkjgyattnvqaygmfo.supabase.co/functions/v1/tts-cached', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
        'apikey': SUPABASE_ANON_KEY
      },
      body: JSON.stringify({
        text,
        voice,
        rate
      })
    });

    if (!response.ok) {
      throw new Error(`TTS request failed: ${response.status}`);
    }

    const data = await response.json();

    if (data.url) {
      console.log('[speech] Playing cached TTS (cached:', data.cached + ')');

      // Use WebView player if available
      if (webViewAudioPlayer) {
        webViewAudioPlayer.play(data.url, () => {
          console.log('[speech] Audio playback completed');
          options.onDone?.();
        });
        return;
      }

      // Fallback: Try HTMLAudio for web
      if (isBrowserAudioAvailable()) {
        // @ts-ignore
        const audio: InternalAudio = new Audio(data.url);
        audio.addEventListener('ended', () => {
          options.onDone?.();
          cleanupAudio(audio);
        });
        audio.addEventListener('error', (e) => {
          console.error('[speech] Audio playback error:', e);
          options.onError?.(e);
          cleanupAudio(audio);
        });
        currentAudio = audio;
        await audio.play();
        return;
      }

      console.warn('[speech] No audio player available');
      options.onError?.(new Error('No audio player available'));
    } else {
      throw new Error('No URL in TTS response');
    }
  } catch (err) {
    console.error('[speech] TTS error:', err);
    options.onError?.(err);
  }
}

function cleanupAudio(a: InternalAudio | null) {
  if (!a) return;
  try {
    a.src = '';
    if (a.__ttsUrl) {
      // @ts-ignore
      URL.revokeObjectURL(a.__ttsUrl);
    }
  } catch {}
  if (currentAudio === a) currentAudio = null;
}

export function stop() {
  try {
    if (currentAudio) {
      currentAudio.pause();
      // Reset to start and cleanup
      try { currentAudio.currentTime = 0; } catch {}
      cleanupAudio(currentAudio);
    }
    if (currentNativeSound) {
      try { currentNativeSound.stopAsync?.(); } catch {}
      try { currentNativeSound.unloadAsync(); } catch {}
    }
    if (currentRNSound) {
      try { currentRNSound.stop?.(() => {}); } catch {}
      try { currentRNSound.release?.(); } catch {}
      currentRNSound = null;
    }
  } finally {
    currentAudio = null;
    currentNativeSound = null;
  }
}

// Minimal voice list to satisfy callers that probe for en-US
export async function getAvailableVoicesAsync(): Promise<Array<{ identifier: string; name: string; language: string }>> {
  return [
    { identifier: 'openai:shimmer', name: 'OpenAI Shimmer (en-US)', language: 'en-US' },
    { identifier: 'openai:alloy', name: 'OpenAI Alloy (en-US)', language: 'en-US' },
    { identifier: 'openai:nova', name: 'OpenAI Nova (en-US)', language: 'en-US' },
  ];
}

export default { speak, stop, getAvailableVoicesAsync };

// ---- helpers ----

function arrayBufferToBase64(buffer: ArrayBuffer): string {
  // Manual base64 encoder (no dependency on btoa/Buffer)
  const bytes = new Uint8Array(buffer);
  const len = bytes.length;
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=';
  let out = '';
  let i = 0;
  while (i < len) {
    const a = i < len ? bytes[i++] : 0;
    const b = i < len ? bytes[i++] : 0;
    const c = i < len ? bytes[i++] : 0;

    const triplet = (a << 16) | (b << 8) | c;
    out += chars[(triplet >> 18) & 0x3f];
    out += chars[(triplet >> 12) & 0x3f];
    out += i - 2 <= len ? chars[(triplet >> 6) & 0x3f] : '=';
    out += i - 1 <= len ? chars[triplet & 0x3f] : '=';
  }
  return out;
}

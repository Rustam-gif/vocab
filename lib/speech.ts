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

function isBrowserAudioAvailable(): boolean {
  try {
    // @ts-ignore - Audio may not exist in RN native
    return typeof Audio !== 'undefined' && typeof URL !== 'undefined';
  } catch {
    return false;
  }
}

function resolveOpenAIVoice(voice?: string): import('../services/TTSService').TTSVoice | undefined {
  if (!voice) return undefined;
  // Allow identifiers like 'openai:verse' or plain 'verse'
  const v = voice.replace(/^openai:/i, '').toLowerCase();
  const allowed = new Set(['alloy', 'verse', 'aria', 'sage', 'ballad', 'vibrant', 'calypso']);
  return (allowed.has(v) ? (v as any) : undefined);
}

export async function speak(text: string, options: SpeakOptions = {}) {
  // Stop any current playback first
  stop();

  const voice = resolveOpenAIVoice(options.voice) || 'verse';
  const rate = typeof options.rate === 'number' ? options.rate : 1.0;

  // Prefer high-quality online TTS (OpenAI) with native file playback
  try {
    // @ts-ignore – Platform available in RN
    const { Platform } = require('react-native');
    const isWeb = Platform?.OS === 'web';
    if (!isWeb) {
      // Prefer react-native-sound + react-native-fs if available (pure RN projects)
      try {
        const RNFS = require('react-native-fs');
        // Use local shim to avoid react-native-sound static getDirectories crash
        const Sound = require('./rnsound').default || require('./rnsound');
        if (RNFS?.CachesDirectoryPath && Sound) {
          // Avoid calling setCategory (RN 0.81 strict arg checks on NSNumber cause redbox
          // in react-native-sound when nullability isn't annotated). iOS plays fine without it.
          const { data } = await ttsService.synthesizeToArrayBuffer(text, { voice, rate, format: 'mp3' });
          const base64 = arrayBufferToBase64(data);
          const filePath = `${RNFS.CachesDirectoryPath}/tts_${Date.now()}.mp3`;
          await RNFS.writeFile(filePath, base64, 'base64');
          await new Promise<void>((resolve, reject) => {
            const s = new Sound(filePath, '', (error: any) => {
              if (error) { reject(error); return; }
              currentRNSound = s;
              try { console.log('[speech] backend: react-native-sound'); } catch {}
              s.play((success: boolean) => {
                if (success) options.onDone?.();
                s.release();
                if (currentRNSound === s) currentRNSound = null;
                // Best-effort cleanup file
                RNFS.unlink(filePath).catch(() => {});
                resolve();
              });
            });
          });
          return; // handled by RN Sound
        }
      } catch (e) {
        try {
          console.warn('[speech] react-native-sound or react-native-fs unavailable:',
            (e as any)?.message || e);
        } catch {}
      }

      // No native audio libs available; signal error explicitly
      options.onError?.(new Error('No native audio backend. Install react-native-sound + react-native-fs.'));
      return;
    }
  } catch (e) {
    // Fall through to web path
  }

  // Web/browser fallback using HTMLAudio
  if (!isBrowserAudioAvailable()) {
    console.warn('[speech] backend: none (no HTMLAudio). Install react-native-sound + react-native-fs for native playback.');
    options.onError?.(new Error('Audio playback not available'));
    return;
  }

  try {
    const { data, contentType } = await ttsService.synthesizeToArrayBuffer(text, {
      voice,
      rate,
      format: 'mp3',
    });

    const blob = new Blob([new Uint8Array(data)], { type: contentType || 'audio/mpeg' });
    // @ts-ignore - URL is available in browsers
    const url = URL.createObjectURL(blob);
    // @ts-ignore - Audio is available in browsers
    const audio: InternalAudio = new Audio(url);
    audio.__ttsUrl = url;
    try { console.log('[speech] backend: web HTMLAudio'); } catch {}
    audio.addEventListener('ended', () => {
      options.onDone?.();
      cleanupAudio(audio);
    });
    audio.addEventListener('error', (e) => {
      options.onError?.(e);
      cleanupAudio(audio);
    });
    currentAudio = audio;
    await audio.play().catch((err: any) => {
      options.onError?.(err);
      cleanupAudio(audio);
    });
  } catch (err) {
    console.warn('[speech] TTS synthesis failed:', err);
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
    { identifier: 'openai:verse', name: 'OpenAI Verse (en-US)', language: 'en-US' },
    { identifier: 'openai:alloy', name: 'OpenAI Alloy (en-US)', language: 'en-US' },
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

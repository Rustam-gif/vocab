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
          console.log('[speech] Starting TTS synthesis for:', text);
          const { data } = await ttsService.synthesizeToArrayBuffer(text, { voice, rate, format: 'mp3' });
          console.log('[speech] TTS synthesis complete, data size:', data.byteLength);
          const base64 = arrayBufferToBase64(data);
          const filePath = `${RNFS.CachesDirectoryPath}/tts_${Date.now()}.mp3`;
          await RNFS.writeFile(filePath, base64, 'base64');
          console.log('[speech] Audio file written to:', filePath);
          await new Promise<void>((resolve, reject) => {
            const s = new Sound(filePath, '', (error: any) => {
              if (error) {
                console.error('[speech] Sound load error:', error);
                reject(error);
                return;
              }
              currentRNSound = s;
              console.log('[speech] backend: react-native-sound, playing...');
              s.play((success: boolean) => {
                console.log('[speech] Playback finished, success:', success);
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
        console.warn('[speech] OpenAI TTS failed, trying native fallback:', (e as any)?.message || e);
        // Don't call onError yet - try fallbacks first
      }

      // Fallback to expo-speech (iOS native) if OpenAI TTS fails
      const usedExpoSpeech = await tryExpoSpeech(text, options);
      if (usedExpoSpeech) return;

      // Fallback to react-native-tts if expo-speech is unavailable
      const usedNativeTts = await tryNativeTTS(text, options);
      if (usedNativeTts) return;

      // No native audio libs available; signal error explicitly
      console.error('[speech] All TTS backends failed');
      options.onError?.(new Error('No TTS backend available.'));
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
async function tryExpoSpeech(text: string, options: SpeakOptions): Promise<boolean> {
  try {
    const Speech = require('expo-speech');
    if (!Speech || typeof Speech.speak !== 'function') {
      return false;
    }
    console.log('[speech] backend: expo-speech');
    await Speech.speak(text, {
      language: options.language || 'en-US',
      rate: options.rate || 1.0,
      pitch: options.pitch || 1.0,
      onDone: options.onDone,
      onStopped: options.onStopped,
      onError: options.onError,
    });
    return true;
  } catch {
    return false;
  }
}

async function tryNativeTTS(text: string, options: SpeakOptions): Promise<boolean> {
  try {
    // Dynamically require to avoid crashes if not installed on web
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const TTS = require('react-native-tts').default || require('react-native-tts');

    // Check if TTS module is available
    if (!TTS || typeof TTS.speak !== 'function') {
      console.log('[speech] react-native-tts not available');
      return false;
    }

    try { await TTS.stop(); } catch {}
    if (options.language) {
      try { await TTS.setDefaultLanguage(options.language); } catch {}
    }
    // react-native-tts uses 0.0-1.0 scale on iOS where 0.5 is normal
    // OpenAI uses 0.25-4.0 where 1.0 is normal
    // Convert: if input rate is ~1.0 (normal), use 0.5 for iOS
    const iosRate = typeof options.rate === 'number' ? options.rate * 0.5 : 0.5;
    const clampedRate = Math.max(0.3, Math.min(0.75, iosRate));
    try { await TTS.setDefaultRate(clampedRate); } catch {}

    if (typeof options.pitch === 'number') {
      const clamped = Math.max(0.5, Math.min(2.0, options.pitch));
      try { await TTS.setDefaultPitch(clamped); } catch {}
    }

    // Use event listeners for completion tracking
    // Supported events: tts-start, tts-finish, tts-pause, tts-resume, tts-progress, tts-cancel
    if (typeof TTS.addEventListener === 'function') {
      console.log('[speech] backend: react-native-tts');
      await new Promise<void>((resolve) => {
        const cleanup = (subs: Array<{ remove?: () => void }>) => {
          subs.forEach(sub => {
            try { sub?.remove?.(); } catch {}
          });
        };
        const finishSub = TTS.addEventListener('tts-finish', () => {
          options.onDone?.();
          cleanup([finishSub, cancelSub]);
          resolve();
        });
        const cancelSub = TTS.addEventListener('tts-cancel', () => {
          options.onStopped?.();
          cleanup([finishSub, cancelSub]);
          resolve();
        });
        TTS.speak(text);
      });
      return true;
    }

    // Simple mode without event listeners
    console.log('[speech] backend: react-native-tts (simple mode)');
    await TTS.speak(text);
    options.onDone?.();
    return true;
  } catch (err) {
    console.error('[speech] react-native-tts error:', err);
    return false;
  }
}

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

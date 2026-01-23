import { NativeModules, NativeEventEmitter, Platform } from 'react-native';

const RNSound = NativeModules.RNSound || {};
// Only create event emitter if native module exists to avoid simulator crash
const eventEmitter = NativeModules.RNSound ? new NativeEventEmitter(NativeModules.RNSound) : null;

// Get the main bundle path for iOS
const MainBundlePath = RNSound.MainBundlePath || '';

let nextKey = 1;

type OnError = (error: string | null, props?: { duration?: number; numberOfChannels?: number }) => void;

class Sound {
  private _filename: string;
  private _key: number;
  private _loaded = false;
  private _onPlaySub: any = null;

  constructor(filename: string, basePath?: string | OnError, onError?: OnError) {
    if (typeof basePath === 'function') {
      onError = basePath;
      basePath = undefined;
    }

    // For iOS, prepend main bundle path if no basePath provided
    let fullPath = filename;
    if (Platform.OS === 'ios') {
      if (basePath) {
        fullPath = `${basePath}/${filename}`;
      } else if (MainBundlePath) {
        fullPath = `${MainBundlePath}/${filename}`;
      }
    }

    this._filename = fullPath;
    this._key = nextKey++;

    console.log(`[Sound] Loading: ${fullPath}`);

    const opts: any = { speed: 1, loadSync: false };
    try {
      RNSound.prepare(
        this._filename,
        this._key,
        opts,
        (error: string | null, props?: { duration?: number; numberOfChannels?: number }) => {
          if (!error) {
            this._loaded = true;
            console.log(`[Sound] Loaded successfully: ${filename}`);
            if (eventEmitter) {
              this._onPlaySub = eventEmitter.addListener('onPlayChange', ({ isPlaying, playerKey }: any) => {
                // no-op; kept for compatibility
              });
            }
          } else {
            console.warn(`[Sound] Load error for ${filename}:`, error);
          }
          onError?.(error, props);
        }
      );
    } catch (e: any) {
      console.warn(`[Sound] Exception loading ${filename}:`, e);
      onError?.(e?.message || String(e));
    }
  }

  play(cb?: (success: boolean) => void) {
    if (!this._loaded) {
      cb?.(false);
      return this;
    }
    try {
      RNSound.play(this._key, (ok: boolean) => cb?.(ok));
    } catch {
      cb?.(false);
    }
    return this;
  }

  pause(cb?: () => void) {
    try { RNSound.pause(this._key, cb || (() => {})); } catch {}
    return this;
  }

  stop(cb?: () => void) {
    try { RNSound.stop(this._key, cb || (() => {})); } catch {}
    return this;
  }

  setVolume(volume: number) {
    try {
      RNSound.setVolume(this._key, Math.max(0, Math.min(1, volume)));
    } catch (e) {
      console.warn('[Sound] setVolume not supported:', e);
    }
    return this;
  }

  release() {
    try { RNSound.release(this._key); } catch {}
    try { this._onPlaySub?.remove?.(); } catch {}
    return this;
  }

  static setCategory(_value: string, _mixWithOthers = false) {
    // Disabled: native RNSound.setCategory has nullability issues causing crashes
    // Audio session is configured in AppDelegate.swift instead
  }

  static enableInSilenceMode(_enabled: boolean) {
    // Disabled: native method has nullability issues
    // Audio session is configured in AppDelegate.swift instead
  }
}

export default Sound;


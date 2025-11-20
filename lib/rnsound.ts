import { NativeModules, NativeEventEmitter, Platform } from 'react-native';

const RNSound = NativeModules.RNSound || {};
const eventEmitter = new NativeEventEmitter(NativeModules.RNSound);

let nextKey = 1;

type OnError = (error: string | null, props?: { duration?: number; numberOfChannels?: number }) => void;

class Sound {
  private _filename: string;
  private _key: number;
  private _loaded = false;
  private _onPlaySub: any = null;

  constructor(filename: string, _basePath?: string | OnError, onError?: OnError) {
    if (typeof _basePath === 'function') {
      onError = _basePath;
    }
    this._filename = filename;
    this._key = nextKey++;

    const opts: any = { speed: 1, loadSync: false };
    try {
      RNSound.prepare(
        this._filename,
        this._key,
        opts,
        (error: string | null, props?: { duration?: number; numberOfChannels?: number }) => {
          if (!error) {
            this._loaded = true;
            this._onPlaySub = eventEmitter.addListener('onPlayChange', ({ isPlaying, playerKey }: any) => {
              // no-op; kept for compatibility
            });
          }
          onError?.(error, props);
        }
      );
    } catch (e: any) {
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

  release() {
    try { RNSound.release(this._key); } catch {}
    try { this._onPlaySub?.remove?.(); } catch {}
    return this;
  }

  static setCategory(value: string, mixWithOthers = false) {
    try { RNSound.setCategory(value, mixWithOthers); } catch {}
  }

  static enableInSilenceMode(enabled: boolean) {
    try { RNSound.enableInSilenceMode(enabled); } catch {}
  }
}

export default Sound;


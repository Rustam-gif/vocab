import { NativeModules, Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

async function checkAsyncStorage(): Promise<string> {
  const nm = NativeModules as any;
  const hasModule = !!nm.RNCAsyncStorage;
  try {
    const key = '@hc.tmp';
    await AsyncStorage.setItem(key, '1');
    const v = await AsyncStorage.getItem(key);
    await AsyncStorage.removeItem(key);
    return hasModule && v === '1' ? 'ok' : `warn: module:${hasModule} roundtrip:${v}`;
  } catch (e) {
    return `error:${String(e)}`;
  }
}

function checkRandomValues(): string {
  try {
    // @ts-ignore
    const hasGRV = typeof globalThis?.crypto?.getRandomValues === 'function';
    if (!hasGRV) return 'missing';
    const arr = new Uint8Array(16);
    // @ts-ignore
    globalThis.crypto.getRandomValues(arr);
    const allZero = arr.every((b) => b === 0);
    return allZero ? 'all-zero' : 'ok';
  } catch (e) {
    return `error:${String(e)}`;
  }
}

async function checkSafeFetch(): Promise<string> {
  try {
    const res = await fetch('http://'); // invalid URL forces error path
    const status = (res as any)?.status ?? 'none';
    return status === 599 ? 'ok' : `status:${status}`;
  } catch (e) {
    return `threw:${String(e)}`;
  }
}

export async function runHealthCheck() {
  const isHermes = !!(global as any).HermesInternal;
  const results = {
    platform: Platform.OS,
    hermes: isHermes,
    asyncStorage: await checkAsyncStorage(),
    randomValues: checkRandomValues(),
    safeFetch: await checkSafeFetch(),
  };
  const ok = Object.values(results).every((v) => v === 'ios' || v === 'android' || v === true || v === 'ok');
  const tag = ok ? '[HealthCheck OK]' : '[HealthCheck WARN]';
  // Use console.warn to ensure visibility in dev console
  console.warn(tag, results);
}

export function installHealthCheck() {
  if (!__DEV__) return;
  if ((globalThis as any).__HC_INSTALLED__) return;
  (globalThis as any).__HC_INSTALLED__ = true;
  // Run shortly after startup so logs group near app launch
  setTimeout(() => {
    runHealthCheck().catch((e) => console.warn('[HealthCheck ERROR]', e));
  }, 250);
}


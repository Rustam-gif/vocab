import AsyncStorage from '@react-native-async-storage/async-storage';

const PREFIX = '@engniter.aiCache:';

type Entry<T> = { v: T; t: number };
const mem = new Map<string, Entry<any>>();

export async function getCached<T = any>(key: string, maxAgeMs = 1000 * 60 * 60 * 24 * 180): Promise<T | null> {
  const k = PREFIX + key;
  const now = Date.now();
  const m = mem.get(k);
  if (m && now - m.t <= maxAgeMs) return m.v as T;
  try {
    const raw = await AsyncStorage.getItem(k);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Entry<T>;
    if (now - parsed.t > maxAgeMs) return null;
    mem.set(k, parsed);
    return parsed.v;
  } catch {
    return null;
  }
}

export async function setCached<T = any>(key: string, value: T): Promise<void> {
  const k = PREFIX + key;
  const entry: Entry<T> = { v: value, t: Date.now() };
  mem.set(k, entry);
  try { await AsyncStorage.setItem(k, JSON.stringify(entry)); } catch {}
}

export default { getCached, setCached };


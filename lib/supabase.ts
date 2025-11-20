import 'react-native-url-polyfill/auto';
import 'react-native-get-random-values';
import AsyncStorage from '@react-native-async-storage/async-storage';
// Use the React Native/browser-friendly ESM build explicitly to avoid Metro
// resolving the Node CJS bundle (dist/main), which causes resolution errors.
import { createClient } from '@supabase/supabase-js/dist/module/index.js';

const supabaseUrl = 'https://auirkjgyattnvqaygmfo.supabase.co';
const supabaseAnonKey = 'sb_publishable_rLA39DG5pwlN9VZcA5jerg_q-WTqd0m';

// Use a fetch with a hard timeout so auth calls never hang the UI if network is blocked
const fetchWithTimeout: typeof fetch = (input: any, init?: any) => {
  const baseFetch: any = (globalThis as any).fetch;
  const timeoutMs = 12000; // 12s hard cap
  return Promise.race([
    baseFetch(input, init),
    new Promise((resolve) => {
      const mkFallback = () => {
        try {
          // Prefer a real Response when available
          // @ts-ignore
          return new Response(JSON.stringify({ error: 'timeout' }), {
            status: 598,
            headers: { 'Content-Type': 'application/json' },
          });
        } catch {
          return {
            ok: false,
            status: 598,
            headers: new Map([['Content-Type', 'application/json']]) as any,
            url: '',
            type: 'basic',
            redirected: false,
            statusText: 'Timeout',
            clone() { return this as any; },
            arrayBuffer: async () => new Uint8Array().buffer,
            blob: async () => ({} as any),
            formData: async () => ({} as any),
            json: async () => ({ error: 'timeout' }),
            text: async () => 'timeout',
          } as any;
        }
      };
      setTimeout(() => resolve(mkFallback()), timeoutMs);
    }),
  ]) as any;
};

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  global: { fetch: fetchWithTimeout },
  auth: {
    storage: AsyncStorage,
    // Disable background refresh to prevent hidden network calls that can
    // trigger 'Network request failed' overlays when offline.
    autoRefreshToken: false,
    persistSession: true,
    // No URL parsing in React Native
    detectSessionInUrl: false,
    flowType: 'pkce',
  },
});

// Hard local sign-out helper: clears any stored Supabase auth tokens from
// AsyncStorage to ensure the session does not reappear on next launch.
export async function localSignOutHard() {
  try {
    // Best effort: try local-scope signOut if supported by this SDK version
    try {
      await (supabase.auth as any).signOut?.({ scope: 'local' });
    } catch {}

    const keys = await AsyncStorage.getAllKeys();
    const projectRef = supabaseUrl.replace('https://', '').split('.')[0];
    const authTokenPrefix = `sb-${projectRef}-auth-token`;
    const toRemove = keys.filter(
      (k) =>
        k === authTokenPrefix ||
        k.startsWith(`${authTokenPrefix}`) ||
        k.includes('auth-token') ||
        k.toLowerCase().includes('supabase')
    );
    if (toRemove.length) await AsyncStorage.multiRemove(toRemove);
  } catch (e) {
    if (__DEV__) console.warn('[Auth] localSignOutHard warning:', e);
  }
}

export type SupabaseClient = typeof supabase;

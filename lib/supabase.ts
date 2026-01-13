import 'react-native-url-polyfill/auto';
import 'react-native-get-random-values';
import AsyncStorage from '@react-native-async-storage/async-storage';
// Use the RN-friendly entrypoint exposed by supabase-js
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://auirkjgyattnvqaygmfo.supabase.co';
const supabaseAnonKey =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImF1aXJramd5YXR0bnZxYXlnbWZvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTkzNDk4MjksImV4cCI6MjA3NDkyNTgyOX0.qeNfIsSgc_b8cD6qRGqw5FAf5iq89JEpdgyF2pvD3Kg';
export const SUPABASE_ANON_KEY = supabaseAnonKey;
export const SUPABASE_URL = supabaseUrl;

// iOS has a ~8KB limit on HTTP header fields
// JWT tokens exceeding this will be truncated, causing auth failures
const MAX_SAFE_TOKEN_LENGTH = 7500;

// Track if we've detected an oversized token
let tokenOversized = false;

/**
 * Check if a JWT token is likely to exceed iOS HTTP header limits
 */
export function isTokenOversized(token: string | null | undefined): boolean {
  if (!token) return false;
  return token.length > MAX_SAFE_TOKEN_LENGTH;
}

/**
 * Get whether we've detected an oversized token issue
 */
export function hasOversizedTokenIssue(): boolean {
  return tokenOversized;
}

/**
 * Mark that we've detected an oversized token
 */
export function markTokenOversized(): void {
  tokenOversized = true;
  console.warn('[Supabase] Token marked as oversized - some features may be limited');
}

// Use a fetch with a hard timeout so auth calls never hang the UI if network is blocked
// Also detect oversized Authorization headers
const fetchWithTimeout: typeof fetch = async (input: any, init?: any) => {
  const baseFetch: any = (globalThis as any).fetch;
  const timeoutMs = 12000; // 12s hard cap

  // Check for oversized Authorization header before making request
  const authHeader = init?.headers?.['Authorization'] || init?.headers?.authorization;
  if (authHeader && typeof authHeader === 'string') {
    const token = authHeader.replace(/^Bearer\s+/i, '');
    if (isTokenOversized(token)) {
      markTokenOversized();
      console.warn('[Supabase] Skipping request due to oversized token');
      // Return a synthetic error response instead of making the failing request
      try {
        return new Response(JSON.stringify({ error: 'Token too large', code: 'TOKEN_OVERSIZED' }), {
          status: 413,
          headers: { 'Content-Type': 'application/json' },
        });
      } catch {
        return {
          ok: false,
          status: 413,
          headers: new Map([['Content-Type', 'application/json']]) as any,
          url: '',
          type: 'basic',
          redirected: false,
          statusText: 'Token too large',
          clone() { return this as any; },
          arrayBuffer: async () => new Uint8Array().buffer,
          blob: async () => ({} as any),
          formData: async () => ({} as any),
          json: async () => ({ error: 'Token too large', code: 'TOKEN_OVERSIZED' }),
          text: async () => 'Token too large',
        } as any;
      }
    }
  }

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

// Monitor auth state changes for oversized tokens (log once)
let hasLoggedTokenWarning = false;
supabase.auth.onAuthStateChange((event, session) => {
  if (session?.access_token && isTokenOversized(session.access_token) && !hasLoggedTokenWarning) {
    hasLoggedTokenWarning = true;
    markTokenOversized();
    console.warn(
      `[Supabase] Token is ${session.access_token.length} chars (limit: ${MAX_SAFE_TOKEN_LENGTH}). ` +
      'Reduce user_metadata in Supabase dashboard to fix.'
    );
  }
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

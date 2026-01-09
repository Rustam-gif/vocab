// Critical polyfills must be loaded before anything else
import './lib/polyfills';
// Safe global fetch: prevent redbox on offline/connection errors
(() => {
  const originalFetch: typeof fetch | undefined = (globalThis as any).fetch?.bind(globalThis);
  if (!originalFetch) return;
  if ((globalThis as any).__SAFE_FETCH_INSTALLED__) return;
  (globalThis as any).__SAFE_FETCH_INSTALLED__ = true;
  (globalThis as any).fetch = (async (...args: any[]) => {
    try {
      return await (originalFetch as any)(...args);
    } catch (e) {
      if (__DEV__) {
        try {
          const input = args[0];
          const url = typeof input === 'string' ? input : (input?.url || String(input));
          console.warn('[SafeFetch] network error for:', url);
          console.warn('[SafeFetch] actual error:', e instanceof Error ? e.message : String(e));
        } catch {}
      }
      try {
        return new Response(JSON.stringify({ error: 'network_error' }), {
          status: 599,
          headers: { 'Content-Type': 'application/json' },
        });
      } catch {
        // Minimal fallback shape if Response is unavailable
        return {
          ok: false,
          status: 599,
          headers: new Map([['Content-Type', 'application/json']]) as any,
          url: '',
          type: 'basic',
          redirected: false,
          statusText: 'Network Error',
          clone() { return this as any; },
          arrayBuffer: async () => new Uint8Array().buffer,
          blob: async () => ({} as any),
          formData: async () => ({} as any),
          json: async () => ({ error: 'network_error' }),
          text: async () => 'network_error',
        } as any;
      }
    }
  }) as any;
})();
import { AppRegistry, Text, TextInput } from 'react-native';

// Global default font faces using local assets/fonts (linked via react-native.config.js)
Text.defaultProps = Text.defaultProps || {};
Text.defaultProps.style = [Text.defaultProps.style, { fontFamily: 'Ubuntu-Regular' }];

TextInput.defaultProps = TextInput.defaultProps || {};
TextInput.defaultProps.style = [TextInput.defaultProps.style, { fontFamily: 'Ubuntu-Regular' }];

import App from './App';
// Dev-only health diagnostics
import { installHealthCheck } from './lib/dev/healthCheck';

installHealthCheck();

AppRegistry.registerComponent('vocabworking', () => App);

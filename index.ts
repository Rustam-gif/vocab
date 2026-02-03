// Ensure gesture handler is initialized before any RN imports
import 'react-native-gesture-handler';
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

// Fix React Native blob responseType warnings
// React Native's Image component and other native modules try to use 'blob' responseType
// but RN doesn't support it, causing console spam. Patch XMLHttpRequest to ignore it.
(() => {
  const OriginalXHR = (globalThis as any).XMLHttpRequest;
  if (!OriginalXHR) return;

  const descriptor = Object.getOwnPropertyDescriptor(OriginalXHR.prototype, 'responseType');
  if (!descriptor) return;

  const originalSetter = descriptor.set;
  if (!originalSetter) return;

  // Patch the responseType setter to silently ignore 'blob'
  Object.defineProperty(OriginalXHR.prototype, 'responseType', {
    ...descriptor,
    set: function(value: any) {
      // Silently convert 'blob' to '' (default text response)
      if (value === 'blob') {
        value = '';
      }
      originalSetter.call(this, value);
    }
  });
})();

// Suppress benign system warnings that don't affect functionality
(() => {
  const originalWarn = console.warn;
  const originalLog = console.log;

  console.warn = function(...args: any[]) {
    const msg = String(args[0] || '');
    // Filter out benign Fabric/system warnings
    if (msg.includes('Could not locate shadow view') ||
        msg.includes('instanceHandle is null') ||
        msg.includes('UIScene') ||
        msg.includes('ShellSceneKit') ||
        msg.includes('ProfileActivation') ||
        msg.includes('ATAudioSessionClientImpl') ||
        msg.includes('activation failed')) {
      return; // Suppress these warnings
    }
    originalWarn.apply(console, args);
  };

  console.log = function(...args: any[]) {
    const msg = String(args[0] || '');
    // Filter out benign system logs
    if (msg.includes('unable to decode "ShellSceneKit') ||
        msg.includes('Could not decode object for setting') ||
        msg.includes('No value decoded for key')) {
      return; // Suppress these logs
    }
    originalLog.apply(console, args);
  };
})();

import { AppRegistry, Text } from 'react-native';

// Global default font faces using local assets/fonts (linked via react-native.config.js)
Text.defaultProps = Text.defaultProps || {};
Text.defaultProps.style = [Text.defaultProps.style, { fontFamily: 'Ubuntu-Regular' }];

// NOTE: Do NOT mutate TextInput.defaultProps globally - it corrupts iOS keyboard sessions
// TextInput font/styles must be set per-component

import App from './App';

// Dev-only health diagnostics - only import and run in development
if (__DEV__) {
  const { installHealthCheck } = require('./lib/dev/healthCheck');
  installHealthCheck();
}

AppRegistry.registerComponent('vocabworking', () => App);

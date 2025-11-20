// Ensure critical polyfills are loaded before any other imports that may
// rely on them (e.g. UUID/crypto inside supabase-js).
import 'react-native-url-polyfill/auto';

// Guarantee crypto.getRandomValues is present in all environments.
try {
  // @ts-ignore
  const hasGRV = typeof globalThis !== 'undefined' &&
    // @ts-ignore
    globalThis.crypto && typeof globalThis.crypto.getRandomValues === 'function';
  if (!hasGRV) {
    // Lazy-require so bundlers include the native module
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    require('react-native-get-random-values');
  }
} catch {
  try {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    require('react-native-get-random-values');
  } catch {}
}


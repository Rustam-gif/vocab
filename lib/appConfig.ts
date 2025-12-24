// Application config for AI features.
// All LLM calls are routed through the Supabase proxy; no direct OpenAI key
// is bundled in the client app.
export const OPENAI_API_KEY: string = '';

// Direct OpenAI chat completions endpoint
export const API_BASE_URL: string = 'https://api.openai.com/v1/chat/completions';
// Optional proxy (Supabase Edge / Vercel serverless). Leave blank to call OpenAI directly.
export const AI_PROXY_URL: string = 'https://auirkjgyattnvqaygmfo.supabase.co/functions/v1/ai-proxy';
// Backend base URL for app-specific endpoints (e.g., account deletion).
// For local development, this should point to your Node server (server/index.mjs).
// On device, replace with your deployed API URL.
export const BACKEND_BASE_URL: string = 'http://localhost:4000';

// When false, analytics/progress use local-only mode and do not attempt
// to read from Supabase on screen load (they still queue writes to sync later).
export const REMOTE_SYNC: boolean = false;

// App store identifiers for rating links (set your real IDs before shipping)
// iOS: numeric App Store ID like '1234567890'
export const APP_STORE_ID: string = '';
// Android: package name as seen on the Play Store
export const ANDROID_PACKAGE_NAME: string = 'com.rustikkarim.vocabworking';

// --- Daily news feed (user-provided API) ---
// Paste your news API key and base URL here. No bundled samples are used when a key is present.
// You can also inject via env (EXPO_PUBLIC_NEWS_API_KEY / NEWS_API_KEY and EXPO_PUBLIC_NEWS_API_URL / NEWS_API_URL).
export const NEWS_API_KEY: string =
  (typeof process !== 'undefined' && ((process as any).env?.EXPO_PUBLIC_NEWS_API_KEY || (process as any).env?.NEWS_API_KEY)) || 'a1d0e0f8f5704d3e94e522e561e2afae';
export const NEWS_API_URL: string =
  (typeof process !== 'undefined' && ((process as any).env?.EXPO_PUBLIC_NEWS_API_URL || (process as any).env?.NEWS_API_URL)) ||
  'https://auirkjgyattnvqaygmfo.supabase.co/functions/v1/news';

export const STORY_IMAGE_URL: string =
  (typeof process !== 'undefined' && ((process as any).env?.EXPO_PUBLIC_STORY_IMAGE_URL || (process as any).env?.STORY_IMAGE_URL)) ||
  'https://auirkjgyattnvqaygmfo.supabase.co/functions/v1/story-image-recraft';

// --- AI-generated productivity articles ---
export const PRODUCTIVITY_ARTICLES_URL: string =
  (typeof process !== 'undefined' && ((process as any).env?.EXPO_PUBLIC_PRODUCTIVITY_ARTICLES_URL || (process as any).env?.PRODUCTIVITY_ARTICLES_URL)) ||
  'https://auirkjgyattnvqaygmfo.supabase.co/functions/v1/productivity-articles';

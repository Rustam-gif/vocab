// Application config for AI features.
// For production, calls go directly to OpenAI over HTTPS (no localhost).
// Note: Mobile apps cannot fully hide API keys; prefer a proxy for real apps.
// You provided a test key; replace before shipping.

export const OPENAI_API_KEY: string = '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';

// Direct OpenAI chat completions endpoint
export const API_BASE_URL: string = 'https://api.openai.com/v1/chat/completions';
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

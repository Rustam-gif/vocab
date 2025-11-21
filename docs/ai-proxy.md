# AI Proxy Setup

Use this guide to hide your OpenAI key behind a serverless function. The repo now ships with a Supabase Edge Function (`supabase/functions/ai-proxy`) plus a client helper (`services/AiProxyService.ts`) that the mobile app can call.

## 1. Configure environment variables

Regardless of platform (Supabase Edge, Vercel, etc.) set these variables in the function runtime:

| Name | Description |
| ---- | ----------- |
| `OPENAI_API_KEY` | Your real OpenAI API key. **Do not** bundle this in the mobile app. |

## 2. Deploy on Supabase

1. Install the Supabase CLI if you have not already: `npm install -g supabase`.
2. Log in and link the project (`supabase login`, `supabase link --project-ref <project>`).
3. Deploy the function that already exists in this repo:

   ```bash
   supabase functions deploy ai-proxy
   ```

4. Set the environment variable for the function:

   ```bash
   supabase secrets set OPENAI_API_KEY=sk-...
   ```

5. Note the public URL: `https://<project>.functions.supabase.co/ai-proxy`.

## 3. Deploy on Vercel (alternative)

If you prefer Vercel, copy the logic from `supabase/functions/ai-proxy/index.ts` into `api/ai-proxy.ts` (Next.js) or `api/ai-proxy/route.ts` (App Router). Then set `OPENAI_API_KEY` inside the Vercel project settings.

## 4. Point the app to the proxy

1. Edit `lib/appConfig.ts` and set:

   ```ts
   export const AI_PROXY_URL = 'https://<project>.functions.supabase.co/ai-proxy';
   export const OPENAI_API_KEY = ''; // optional when proxying
   ```

2. The `AIService` now automatically prefers the proxy whenever `AI_PROXY_URL` is set. You can also use the helper directly:

   ```ts
   import { aiProxyService } from '../services/AiProxyService';

   const response = await aiProxyService.complete({
     prompt: 'Write a funny sentence using "serendipity".',
     context: 'You are a playful writing coach.',
   });

   console.log(response.content);
   ```

3. All existing story, translation, quiz, and IELTS helpers will route through the proxy once configured, so the OpenAI key no longer needs to ship with the mobile bundle.

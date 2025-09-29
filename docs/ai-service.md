# AI Service and OpenAI Key Setup

Never commit your OpenAI API key to the repo. This project is configured to use a small local proxy server so your key stays on the server side.

## 1) Set your server environment variable

Create a local shell env variable before running the server:

```bash
export OPENAI_API_KEY="your-real-openai-key"
```

You can also create a `.env` for your shell (zsh example) and source it, but do not commit it.

## 2) Start the proxy + Expo app together

```bash
npm run dev
```

This runs:
- `node server/index.mjs` on port 4000
- `expo start` for the mobile app

## 3) Point the app to the proxy

Set the client base URL in your shell before starting (or in your terminal session):

```bash
export EXPO_PUBLIC_API_BASE_URL="http://localhost:4000"
```

The client will first try `EXPO_PUBLIC_API_BASE_URL`. If not set, it will fall back to a direct OpenAI call which requires an API key exposed to the client (not recommended).

## 4) Do NOT paste keys into code or commits

- Never add your key to `services/AIService.ts`
- Never commit a `.env` file with secrets
- Use `OPENAI_API_KEY` only on the server process

## Endpoints

- `POST /api/openai/chat` — server-to-OpenAI proxy; request body mirrors OpenAI chat/completions fields used in this app.

## Troubleshooting

- If you see `Missing OPENAI_API_KEY on server`, ensure you exported the env var in the same terminal session running `npm run dev`.
- On iOS/Android devices, ensure the device can reach your computer via the `EXPO_PUBLIC_API_BASE_URL` host (replace `localhost` with your LAN IP).

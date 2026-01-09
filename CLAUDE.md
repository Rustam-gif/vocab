# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Engniter is a React Native vocabulary learning app (bare workflow, not Expo managed) with file-based routing via a custom expo-router shim.

## Development Environment

- **Platform**: React Native bare workflow (NOT Expo managed)
- **iOS Development**: Xcode + iOS Simulator
- **Build/Run**: Open `ios/` folder in Xcode and run from there, or use CLI commands below

## Build & Run Commands

```bash
# Start Metro bundler
npm run start

# Run on iOS (via CLI)
npm run ios

# Run on Android
npm run android

# Bundle iOS for release
npm run bundle:ios

# Run daily mission tests
npm run test:daily
```

## Architecture

### Navigation
- **Custom expo-router shim**: The app uses `lib/router.tsx` as a custom implementation (aliased via Metro config), not the npm expo-router package
- File-based routing in `app/` directory using `<Stack>` from the router shim
- Navigation via `useRouter()` hook from `expo-router` (resolves to the shim)

### State Management
- **Zustand store** (`lib/store.ts`): Central state for user, words, stories, exercises, analytics, progress, theme
- **AsyncStorage**: Persistence layer for all app data
- Store initializes services on app start via `initialize()` method

### Services Layer (`services/`)
- `VaultService.ts`: Vocabulary storage with SRS (spaced repetition), folders, word CRUD
- `AIService.ts` / `AiProxyService.ts`: AI-powered features via Supabase Edge Functions
- `ProgressService.ts`: XP, levels, exercise completion tracking
- `AnalyticsService.ts`: Usage analytics and exercise results
- `StoryGenerator.ts`: AI story generation with vocabulary
- `SubscriptionService.ts`: In-app purchase handling
- `dailyMission.ts`: Daily challenge logic

### Backend
- **Supabase** (`lib/supabase.ts`): Auth, database, Edge Functions
- Edge Functions in `supabase/functions/`: `ai-proxy`, `news`, `story-image`, `story-image-recraft`

### Key Directories
- `app/`: Screens and routes (file-based routing)
- `app/quiz/`: Quiz flow screens and exercise components
- `app/quiz/components/`: Exercise phase components (mcq, synonym, sentence-usage, etc.)
- `app/quiz/data/`: Static quiz data (levels, answers)
- `lib/`: Core utilities (store, supabase, theme, router shim)
- `services/`: Business logic services
- `types.ts`: TypeScript interfaces (Word, User, Story, etc.)

## Quiz Flow
Home → Level Select → Learn → Atlas Practice → Results

Exercise phases flow: WordIntro → MCQ → Synonym → Usage → MissingLetters

Each phase component accepts `onComplete` callback with score updates.

## Scoring System (Critical)
- Starting score: 100 points per practice session
- **Always deduct minimum 5 points for mistakes** across all exercise phases
- Score flows up from child components via callbacks

## Theme System
- Dark theme default: `#1E1E1E` background
- Orange accent: `#F2935C`
- Correct/success green: `#437F76`
- Muted text: `#9CA3AF`
- Theme toggle persisted via `@engniter.theme` AsyncStorage key

## Metro Configuration
Custom Metro config (`metro.config.cjs`) includes:
- SVG transformer for inline SVG imports
- Module aliases: `expo-router` → `lib/router`, `react-native-sound` → `lib/rnsound`, `lottie-react-native` → `lib/lottie-proxy`

## Animation Guidelines
- Prefer React Native's `Animated` API over heavy Lottie animations
- Use `Animated.timing` with easing for UI transitions
- Score animations: floating "-5" text with red color and fade-out

## Context Agent
Track architectural decisions:
```bash
node context-agent/contextAgent.mjs summary
node context-agent/contextAgent.mjs add decision "title" "description"
```

## Documentation Generation
```bash
npm run docgen
```
Auto-generates docs in `docs/` from code annotations using `@doc:` comments.

## Critical: App Entry Point (IMPORTANT!)

**WARNING**: The `app/_layout.tsx` file is **NOT USED**. Do not edit it expecting changes to take effect.

The actual app entry point is:
```
index.js → index.ts → App.tsx → RouterProvider (lib/router.tsx)
```

- `App.tsx` is the root component that renders the app
- `lib/router.tsx` is the custom router that handles navigation
- The `app/` directory contains screens but `_layout.tsx` is NOT the layout wrapper

### Where to Add Global Logic
- **Settings persistence**: `App.tsx` (loads/saves theme, language preferences)
- **Global state initialization**: `App.tsx` or `lib/store.ts`
- **Navigation wrapper**: `lib/router.tsx`

## AsyncStorage Persistence (iOS)

### Known Issue: SQLite WAL
On iOS, AsyncStorage uses SQLite with Write-Ahead Logging (WAL). If the app is force-closed before SQLite checkpoints, data can be lost.

### Solution Implemented
In `App.tsx`, settings are saved when the app goes to background:
```typescript
AppState.addEventListener('change', (nextState) => {
  if (nextState === 'background' || nextState === 'inactive') {
    // Save settings and flush caches
    await AsyncStorage.multiSet([...]);
    await AsyncStorage.multiGet([...]); // Force SQLite checkpoint
  }
});
```

### Storage Keys
- `@engniter.theme` - Theme preference ('light' | 'dark')
- `@engniter.langs` - Language preferences (JSON array)
- `@engniter.news.payload` - Cached news articles
- `@engniter.news.lastFetchedAt` - News cache timestamp
- `@engniter.productivity.articles.v3` - Productivity articles cache

## News & Articles System

### Architecture
1. **Primary**: Live news from Supabase Edge Function (`/functions/v1/news`)
2. **Fallback**: AI-generated productivity articles from Supabase Edge Function

### Server-Side Caching
The Supabase news function has its own 24-hour database cache. The app should **NOT** send `refresh=1` on every restart - this forces slow AI expansion and can timeout.

### Display Logic (app/index.tsx)
News and productivity articles are **interleaved** in the display list:
- Alternates: News → Productivity → News → Productivity
- Up to 12 articles total
- Deduplication by title

### Timeouts
- News fetch timeout: 60 seconds (increased from 20s due to AI expansion time)
- Controlled by AbortController in `refreshNewsFromApi()`

### Debugging News Issues
Check console logs for:
```
[news] Starting initial news fetch...
[news] Local cache result: ...
[news] Fetching from API...
[news] API fetch completed
[news] stats topics=... fetched=X after_filter=Y
```

If you see `[SafeFetch] actual error: Aborted` - the request timed out.
If you see `status 503` - the Supabase function timed out (likely doing AI expansion).

## SafeFetch Wrapper

Global fetch is wrapped in `index.ts` to prevent crashes on network errors:
- Catches all fetch errors
- Returns synthetic Response with status 599 on network failure
- Logs actual error message in dev: `[SafeFetch] actual error: <message>`

## Debugging Tips

### Metro Cache Issues
If code changes aren't taking effect:
```bash
kill -9 $(lsof -ti tcp:8081) || true
npx react-native start --reset-cache
```

### Check if Module is Loaded
Add at top of file (outside component):
```typescript
console.log('!!! MODULE_NAME LOADED !!!');
```
If you don't see this log, the file isn't being loaded by Metro.

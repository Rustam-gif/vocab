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

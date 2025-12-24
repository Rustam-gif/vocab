# PROJECT.md

> For developers and AI assistants working on this codebase.

---

## Overview

**App Name:** Vocabulary Builder (working name)

**Purpose:** A mobile app that helps users build and retain vocabulary through daily, low-friction practice sessions.

**Target Users:**
- Adults learning a foreign language
- Busy learners who prefer short, daily sessions
- Users who may start as guests before creating an account

---

## Core Philosophy

- **Simple UI** — No clutter, no distractions
- **Fast interactions** — Minimize taps and loading states
- **Lightweight learning** — Should feel manageable, not overwhelming
- **Consistency over intensity** — Daily practice with small batches

---

## What This App Is NOT

- Not a grammar course
- Not heavily gamified with animations
- Not aimed at children

---

## Technical Stack

| Layer | Technology |
|-------|------------|
| Framework | React Native (bare workflow, not Expo managed) |
| Language | TypeScript |
| Auth & Database | Supabase |
| State Management | Zustand |
| Local Storage | AsyncStorage |
| Routing | Custom expo-router shim (`lib/router.tsx`) |

---

## Architecture

### Directory Structure

```
app/                  # Screens (file-based routing)
  quiz/               # Quiz flow screens
    components/       # Exercise phase components
    data/             # Static quiz data
  placement/          # Placement test flow
lib/                  # Core utilities
  store.ts            # Zustand state store
  supabase.ts         # Supabase client
  router.tsx          # Custom router shim
  theme.ts            # Theme definitions
services/             # Business logic
  VaultService.ts     # Vocabulary storage + SRS
  ProgressService.ts  # XP and progress tracking
  AnalyticsService.ts # Usage analytics
  AIService.ts        # AI-powered features
types.ts              # TypeScript interfaces
```

### State Management

Central Zustand store (`lib/store.ts`) manages:
- `user` — Current user (null for guests)
- `words` — Vocabulary list
- `userProgress` — XP, levels, exercises completed
- `analytics` — Usage statistics
- `theme` — Light/dark mode

All state persists to AsyncStorage and syncs to Supabase when authenticated.

### Authentication

- **Provider:** Supabase (email/password)
- **Guest mode:** Fully supported — users can learn without an account
- **Guest-to-user upgrade:** Progress is preserved when signing up
- **Session storage:** AsyncStorage with PKCE flow

### Learning Model

- Vocabulary presented in small batches
- Daily review sessions
- Progress tracked locally first, synced when logged in
- SRS (spaced repetition) for review scheduling

---

## Key Flows

### Quiz Flow
```
Home → Level Select → Learn → Atlas Practice → Results
```

Exercise phases:
```
WordIntro → MCQ → Synonym → Usage → MissingLetters
```

### Authentication Flow
```
Guest Mode → (optional) Sign Up/Sign In → Sync Progress
```

---

## Data Models

### User
```typescript
interface User {
  id: string;
  name: string;
  email?: string;
  avatarId?: number;
  xp?: number;
  streak?: number;
  exercisesCompleted?: number;
}
```

### Word
```typescript
interface Word {
  id: string;
  word: string;
  definition: string;
  example: string;
  phonetics?: string;
  score: number;
  practiceCount: number;
  srs?: SrsState;
  folderId?: string;
}
```

---

## Development Commands

```bash
npm run start        # Start Metro bundler
npm run ios          # Run on iOS
npm run android      # Run on Android
npm run bundle:ios   # Bundle for iOS release
npm run test:daily   # Run daily mission tests
```

---

## Guidelines for Contributors

1. **Read before modifying** — Understand existing code before changing it
2. **Keep it simple** — Avoid over-engineering; solve the current problem
3. **No invented features** — Only implement what's specified
4. **Match existing patterns** — Follow conventions already in the codebase
5. **Minimal changes** — Don't refactor or "improve" unrelated code

---

## Assumptions

*None at this time. This document reflects the provided context.*

---

## Related Files

- `CLAUDE.md` — AI assistant instructions (build commands, architecture details)
- `APP_DESCRIPTION.md` — User-facing app description

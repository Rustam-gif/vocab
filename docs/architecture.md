# Architecture

Directories and files discovered under configured roots:
- app
  - _layout.tsx
  - index.tsx
  - journal.tsx
  - profile.tsx
  - stats.tsx
  - story-exercise.tsx
  - vault.tsx
- app/quiz
  - atlas-practice-integrated.tsx
  - atlas-results.tsx
  - index.tsx
  - learn.tsx
  - level-select.tsx
  - quiz-screen.tsx
  - word-intro.tsx
- app/quiz/components
  - SetCard.tsx
  - SuccessCelebration.tsx
  - WordIntro.tsx
  - dialogue-simple.tsx
  - mcq.tsx
  - missing-letters-simple.tsx
  - sentence-best.tsx
  - sentence-usage.tsx
  - synonym.tsx
  - word-intro.tsx
- app/quiz/data
  - levels.ts
  - sentence-best.ts
- lib
  - store.ts
- services
  - AIService.ts
  - AnalyticsService.ts
  - ProgressService.ts
  - VaultService.ts

## Build & Run
- package.json scripts:
  - start: expo start
  - android: expo run:android
  - ios: expo run:ios
  - web: expo start --web
  - docgen: node scripts/docgen.mjs
  - postinstall: node -e "try{require('fs').unlinkSync('node_modules/expo-router/ios/ExpoHead.podspec')}catch(e){}"

# Copilot Instructions: Engniter Vocabulary App

## Project Architecture
- **Platform**: React Native with Expo Router (~54), TypeScript
- **Navigation**: File-based routing (`app/` directory structure)
- **State**: Zustand store (`lib/store.ts`) + AsyncStorage for persistence
- **Services**: Modular services in `services/` (VaultService, AnalyticsService, etc.)
- **Theme**: Dark UI (#1E1E1E background, #F2935C accent, #437F76 correct green)

## Key Patterns & Conventions

### 1. Routing & Navigation
- Use Expo Router with file-based routing: `app/index.tsx`, `app/quiz/_layout.tsx`
- Navigation with `useRouter()` from `expo-router`
- Persistent level selection via AsyncStorage key: `@engniter.selectedLevel`
- Quiz flow: Home → Level Select → Learn → Atlas Practice → Results

### 2. Component Structure
- Screens in `app/` directory follow consistent layout patterns
- Components use SafeAreaView with dark theme colors
- Shared components in `app/quiz/components/` for exercise phases
- Each phase component accepts `onComplete` callback with score updates

### 3. Score System (Critical Rule)
- **Always deduct minimum 5 points for mistakes** across all exercise phases
- Starting score: 100 points per practice session
- Score flows up from child components via callbacks
- Animated score deductions show red floating "-5" text

### 4. State Management
- Zustand store in `lib/store.ts` for app-wide state
- AsyncStorage for user preferences and level selection
- Services handle business logic and data persistence
- Demo data in services (e.g., `VaultService.ts` has `DEMO_WORDS`)

### 5. Animation Patterns
- Use React Native's `Animated` API (compatible with Expo Go)
- Tab indicators use `Animated.timing` with easing
- Avoid heavy Lottie animations; prefer lightweight `Animated` solutions
- Score animations: floating "-5" with red color and fade-out

## Development Workflow

### Scripts & Commands
- `npm run start` - Start Expo development server
- `npm run docgen` - Generate documentation from code annotations
- `node context-agent/contextAgent.mjs summary` - View project context/decisions

### Documentation System
- Auto-generated docs in `docs/` via `scripts/docgen.mjs`
- Component docs use `@doc:` comments for enrichment
- Context agent tracks decisions in `context-agent/memory.json`

### Key Dependencies
- **expo-router**: File-based navigation
- **zustand**: State management
- **@react-native-async-storage/async-storage**: Persistence
- **react-native-reanimated**: Animations (bundled with Expo)
- **lucide-react-native**: Icons

## Integration Points
- **VaultService**: Manages vocabulary data with AsyncStorage
- **Level progression**: Persisted via `@engniter.selectedLevel` key
- **Exercise phases**: WordIntro → MCQ → Synonym → Usage → Letters
- **Score aggregation**: Flows from individual phases to results screen

## Style Guidelines
- Dark theme with #1E1E1E primary background
- Orange accent (#F2935C) for interactive elements
- Green (#437F76) for correct answers/success states
- Muted text (#9CA3AF) for secondary information
- Consistent padding and rounded corners (borderRadius: 12)

## Context Agent
- Product Manager persona tracks goals/decisions in `context-agent/memory.json`
- Run `node context-agent/contextAgent.mjs add decision "title" "description"` to log architectural decisions
- Documentation snapshots available in `docs/context-agent.md`
# XP and Progress System

## Overview
The app now has a comprehensive XP (Experience Points) and progression system that rewards users for completing exercises and maintaining learning streaks.

## How It Works

### 1. XP Rewards

#### Quiz Exercises
- **MCQ (Multiple Choice)**: 10 XP correct, 2 XP incorrect
- **Synonym**: 15 XP correct, 3 XP incorrect
- **Usage**: 20 XP correct, 4 XP incorrect
- **Letters**: 12 XP correct, 3 XP incorrect

#### Practice Exercises
- **Flashcards Know**: 8 XP
- **Flashcards Don't Know**: 2 XP
- **Word Sprint Correct**: 15 XP
- **Word Sprint Incorrect**: 3 XP

#### Story Exercises
- **Story Complete**: 50 XP
- **Story Perfect** (all blanks correct): 100 XP

#### Bonuses
- **Perfect Quiz** (100% accuracy on 5+ questions): +50 XP
- **Daily Login**: +5 XP
- **Streak Bonus**: +10 XP per day of streak (up to 10 days max)

### 2. Level System

**Formula**: `Level = floor(XP / 1000) + 1`

- **Level 1**: 0-999 XP
- **Level 2**: 1000-1999 XP
- **Level 3**: 2000-2999 XP
- **Level 4**: 3000-3999 XP
- And so on...

### 3. Streak System

- **Daily Login**: Opens the app and updates streak
- **Consecutive Days**: Each consecutive day increases the streak
- **Streak Broken**: Missing a day resets streak to 1
- **Streak Bonus**: Users with 3+ day streaks earn bonus XP on exercises

### 4. Stats Tracked

- **XP**: Total experience points earned
- **Level**: Current level based on XP
- **Exercises Completed**: Total number of exercises finished
- **Streak**: Current consecutive days of app usage
- **Total Words Learned**: Cumulative count of words practiced
- **Accuracy History**: Last 10 accuracy scores for analytics

### 5. Data Storage

#### Local Storage
- Progress is saved to `AsyncStorage` for offline access
- Key: `@user_progress`

#### Supabase (Cloud Sync)
- If user is logged in, progress syncs to `user_metadata.progress`
- Allows progress to persist across devices

### 6. Integration Points

#### When User Completes Exercise
```typescript
await ProgressService.recordExerciseCompletion(
  'mcq',           // exercise type
  8,               // correct count
  10,              // total count
  120              // time spent in seconds
);
```

This automatically:
- Calculates XP based on performance
- Applies bonuses (perfect score, streak)
- Updates user level
- Tracks accuracy
- Saves progress locally and to cloud

#### Manual XP Award
```typescript
await ProgressService.addXP(50, 'special_achievement');
```

### 7. Profile Display

The profile screen now shows:
- **Total XP**: Shows user's current XP and level
- **Exercises**: Total completed exercises
- **Day Streak**: Current consecutive days
- **XP Progress Bar**: Visual indicator of progress to next level

### 8. Example Progression

**Day 1** (First time user):
- Complete 1 MCQ quiz (8/10 correct): +82 XP (80 base + 2 participation)
- Complete 1 story: +50 XP
- Daily login bonus: +5 XP
- **Total**: 137 XP, Level 1, Streak: 1 day

**Day 2** (Returning user):
- Streak bonus active!
- Complete 1 perfect synonym quiz (10/10): +150 XP (base) + 50 XP (perfect) + 10 XP (streak) = +210 XP
- Complete flashcards (20 cards): ~120 XP
- Daily login: +5 XP
- **Total**: 472 XP, Level 1, Streak: 2 days

**Day 7** (Consistent user):
- With 7-day streak: +70 XP bonus per exercise!
- Complete word sprint (15/20): +255 XP
- Complete perfect story: +100 XP + 70 XP (streak) = +170 XP
- **Total**: 1500+ XP, Level 2, Streak: 7 days

### 9. Gamification Benefits

- **Motivation**: Clear goals and rewards
- **Habit Building**: Streak system encourages daily use
- **Achievement**: Level progression provides satisfaction
- **Fair System**: Even incorrect answers earn small XP (participation matters)
- **Balanced**: Perfect scores and streaks are rewarded significantly

### 10. Future Enhancements (Ideas)

- Achievements/Badges system
- Leaderboards
- Weekly XP challenges
- Special events with double XP
- Level-based unlocks (themes, features)
- XP multipliers for premium users

## Technical Implementation

### Service: `ProgressService.ts`
- Manages all XP calculations
- Handles streak tracking
- Persists progress to storage
- Syncs with Supabase

### Store Integration: `lib/store.ts`
- `userProgress`: Current progress state
- `loadProgress()`: Load progress on app start
- `updateProgress()`: Update progress manually

### Profile Display: `app/profile.tsx`
- Shows real-time XP, level, streak, exercises
- Uses `userProgress` from store
- Falls back to user metadata if store not loaded

---

**Created**: 2025-01-03
**Version**: 1.0
**Status**: Implemented and Active


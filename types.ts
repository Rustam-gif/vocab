/**
 * Type definitions for the Engniter vocabulary app
 */

export interface User {
  id: string;
  name: string;
  email?: string;
  level: string;
  streak: number;
  totalScore: number;
  joinedAt: Date;
}

export interface Word {
  id: string;
  word: string;
  definition: string;
  example: string;
  phonetics?: string;
  savedAt: Date;
  notes?: string;
  tags?: string[];
  score: number;
  practiceCount: number;
  correctCount: number;
  incorrectCount: number;
  exerciseStats: ExerciseStats;
  isWeak?: boolean;
  folderId?: string; // optional grouping
  srs?: SrsState; // spaced repetition metadata
}

export interface NewWordPayload {
  word: string;
  definition: string;
  example: string;
  phonetics?: string;
  notes?: string;
  tags?: string[];
  level?: string;
  category?: string;
  folderId?: string;
}

export interface ExerciseStats {
  [exerciseType: string]: {
    attempts: number;
    correct: number;
    lastAttempt: Date;
    averageTime: number;
  };
}

export interface ExerciseResult {
  wordId: string;
  exerciseType: string;
  correct: boolean;
  timeSpent: number;
  timestamp: Date;
  score?: number;
}

// Aggregated analytics snapshot used by Stats screen
export interface AnalyticsData {
  accuracyByType: Record<string, number>;
  accuracyTrend: Array<{ date: string; accuracy: number }>;
  overallAccuracy: number;
  streak: number;
  personalBest: number;
  timeTrend?: Array<{ date: string; seconds: number }>;
}

export interface ExercisePerformance {
  wordId: string;
  exerciseType: string;
  score: number;
  timeSpent: number;
  correct: boolean;
  timestamp: Date;
}

// Spaced Repetition SM-2-style state kept per word
export interface SrsState {
  easeFactor: number; // E-Factor (min 1.3)
  interval: number; // current interval in days
  repetition: number; // consecutive successful reviews
  dueAt: Date; // next scheduled review time
  lastReviewedAt?: Date;
  lapses: number; // number of times failed (<3 quality)
}

export interface Story {
  id: string;
  title: string;
  content: string;
  level: string;
  words: string[];
  createdAt: Date;
}

export interface Level {
  id: string;
  name: string;
  description: string;
  color: string;
  wordsCount: number;
  isUnlocked: boolean;
  progress: number;
}

export interface Quiz {
  id: string;
  level: string;
  words: Word[];
  score: number;
  completed: boolean;
  startedAt: Date;
  completedAt?: Date;
}

export interface ExerciseScore {
  total: number;
  breakdown: {
    wordIntro: number;
    mcq: number;
    synonym: number;
    usage: number;
    letters: number;
  };
}

export type ExerciseType = 'word-intro' | 'mcq' | 'synonym' | 'usage' | 'letters';
export type DifficultyLevel = 'beginner' | 'intermediate' | 'advanced';
export type PracticeMode = 'learn' | 'review' | 'test';
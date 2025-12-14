export type WordStatus = 'new' | 'learning' | 'review' | 'mastered';

export type QuestionType =
  | 'weak_word_mcq'
  | 'new_word_mcq'
  | 'story_mcq'
  | 'definition_mcq'
  | 'context_fill_blank'
  | 'usage_validation'
  | 'synonym_antonym'
  | 'rewrite_sentence'
  | 'story_context_mcq';

export type MissionStatus = 'not_started' | 'in_progress' | 'completed' | 'expired';

export interface Word {
  id: string;
  text: string;
  definition: string;
  exampleSentence?: string;
  difficulty?: number;
}

export interface UserWordState {
  userId: string;
  wordId: string;
  status: WordStatus;
  stage: number; // 0..6 spaced repetition stage
  strength: number; // 0..1 confidence
  lastSeenAt: string | null; // ISO date/time
  nextReviewAt: string | null; // ISO date/time
  totalCorrect: number;
  totalIncorrect: number;
}

export interface Mission {
  id: string;
  userId: string;
  date: string; // yyyy-mm-dd
  status: MissionStatus;
  numQuestions: number;
  xpReward: number;
  weakWordsCount: number;
  newWordsCount: number;
  createdAt: string;
  completedAt: string | null;
  correctCount: number;
}

export interface MissionQuestion {
  id: string;
  missionId: string;
  index: number; // 0-based position
  type: QuestionType;
  primaryWordId: string | null;
  extraWordIds: string[];
  prompt: string; // multi-line, first line is title
  options: string[];
  correctIndex: number;
  answered?: boolean;
}

export type MissionWithQuestions = { mission: Mission; questions: MissionQuestion[] };

export interface UserStats {
  userId: string;
  xp: number;
  streak: number;
  lastMissionDate: string | null;
  missionsCompleted: number;
}

export const REVIEW_INTERVALS_DAYS = [1, 2, 4, 7, 15, 30, 60];

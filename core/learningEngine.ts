import { REVIEW_INTERVALS_DAYS, UserWordState, WordStatus } from './dailyMissionTypes';

const clamp = (n: number, min: number, max: number) => Math.min(Math.max(n, min), max);

export const toDateKey = (d: Date) => d.toISOString().slice(0, 10);

export const addDays = (date: Date, days: number) => {
  const next = new Date(date);
  next.setDate(next.getDate() + days);
  return next;
};

export function updateUserWordStateAfterAnswer(state: UserWordState, wasCorrect: boolean, today: Date): UserWordState {
  const next: UserWordState = { ...state };

  if (wasCorrect) {
    next.totalCorrect += 1;
    next.stage = Math.min(next.stage + 1, REVIEW_INTERVALS_DAYS.length - 1);
    next.strength = clamp(next.strength + 0.15, 0, 1);
    if (next.status === 'new') next.status = 'learning';
    if (next.status === 'learning' && next.stage >= 2) next.status = 'review';
    if (next.status === 'review' && next.stage >= 5 && next.strength > 0.85) next.status = 'mastered';
  } else {
    next.totalIncorrect += 1;
    next.stage = Math.max(next.stage - 1, 0);
    next.strength = clamp(next.strength - 0.25, 0, 1);
    if (next.status === 'new') next.status = 'learning';
  }

  // Ensure status upgrades only when stage supports it
  if (next.status === 'learning' && wasCorrect && next.stage >= 2) next.status = 'review';

  const intervalDays = wasCorrect ? REVIEW_INTERVALS_DAYS[next.stage] : 1;
  const nextReview = addDays(today, intervalDays);
  next.nextReviewAt = nextReview.toISOString();
  next.lastSeenAt = today.toISOString();
  return next;
}

export function isWeakWord(state: UserWordState, today: Date): boolean {
  if (state.status === 'new') return false;
  const nextReviewAt = state.nextReviewAt ? new Date(state.nextReviewAt) : null;
  const todayStart = new Date(toDateKey(today));
  return (nextReviewAt ? nextReviewAt <= todayStart : false) || state.strength < 0.6;
}

export function sortWeakStates(states: UserWordState[]): UserWordState[] {
  return [...states].sort((a, b) => {
    if (a.strength !== b.strength) return a.strength - b.strength;
    const la = a.lastSeenAt ? new Date(a.lastSeenAt).getTime() : 0;
    const lb = b.lastSeenAt ? new Date(b.lastSeenAt).getTime() : 0;
    return la - lb;
  });
}

export function makeFreshUserWordState(userId: string, wordId: string, today: Date): UserWordState {
  return {
    userId,
    wordId,
    status: 'new',
    stage: 0,
    strength: 0.2,
    lastSeenAt: null,
    nextReviewAt: today.toISOString(),
    totalCorrect: 0,
    totalIncorrect: 0,
  };
}

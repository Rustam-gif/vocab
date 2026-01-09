import { supabase } from '../lib/supabase';

export type UserID = string;

export type WordRow = {
  id: number;
  term: string;
  part_of_speech?: string | null;
  difficulty_level: number;
  created_at: string;
};

export type UserVocabularyRow = {
  id: number;
  user_id: UserID;
  word_id: number;
  status: 'learning' | 'mastered' | 'review';
  times_seen: number;
  times_correct: number;
  times_wrong: number;
  next_review_date: string | null;
  updated_at: string;
  created_at: string;
};

export type ExerciseKind = 'multiple_choice' | 'fill_in_the_blank' | 'dialogue';
export type ExerciseRow = {
  id: number;
  kind: ExerciseKind;
  creator_id?: UserID | null;
  instructions?: string | null;
  created_at: string;
};

export type ExerciseUserRow = {
  id: number;
  exercise_id: number;
  user_id: UserID;
  completed: boolean;
  score?: number | null;
  time_spent_seconds: number;
  completed_at?: string | null;
};

export type UserProgressRow = {
  user_id: UserID;
  daily_xp: number;
  streak: number;
  total_words_mastered: number;
  time_spent: number;
  last_updated: string;
};

export type AIStoryRow = {
  id: number;
  user_id: UserID;
  story_text: string;
  metadata: Record<string, any>;
  created_at: string;
};

export type UserSettingsRow = {
  user_id: UserID;
  language_preference: string;
  dark_mode: boolean;
  notifications: boolean;
  difficulty_mode: 'easy' | 'medium' | 'hard';
  updated_at: string;
};

export type SubscriptionRow = {
  id: number;
  user_id: UserID;
  plan: 'free' | 'premium';
  valid_until: string | null;
  status: 'active' | 'canceled' | 'expired';
  created_at: string;
};

/* -------- Dictionary -------- */
export function fetchWordByTerm(term: string) {
  return supabase.from('words').select('*').eq('term', term).maybeSingle<WordRow>();
}

export function searchWords(q: string, limit = 20) {
  return supabase
    .from('words')
    .select('*')
    .ilike('term', `%${q}%`)
    .order('term', { ascending: true })
    .limit(limit) as any;
}

/* -------- User vocabulary -------- */
export function upsertUserVocabulary(userId: UserID, wordId: number, status: UserVocabularyRow['status']) {
  return supabase
    .from('user_vocabulary')
    .upsert({ user_id: userId, word_id: wordId, status })
    .select()
    .maybeSingle<UserVocabularyRow>();
}

export async function updateReviewResult(
  userId: UserID,
  wordId: number,
  wasCorrect: boolean,
  nextReviewDate?: string | null
) {
  const correctInc = wasCorrect ? 1 : 0;
  const wrongInc = wasCorrect ? 0 : 1;
  const rpc = await supabase.rpc('increment_vocab_stats', {
    p_user_id: userId,
    p_word_id: wordId,
    p_correct_inc: correctInc,
    p_wrong_inc: wrongInc,
    p_next_review: nextReviewDate ?? null,
  });
  // Fallback if the RPC is not deployed yet
  if (rpc.error && rpc.error.code === '42883') {
    return supabase
      .from('user_vocabulary')
      .upsert({
        user_id: userId,
        word_id: wordId,
        status: 'learning',
        times_seen: 1,
        times_correct: correctInc,
        times_wrong: wrongInc,
        next_review_date: nextReviewDate ?? null,
        updated_at: new Date().toISOString(),
      })
      .select()
      .maybeSingle<UserVocabularyRow>();
  }
  return rpc;
}

export function listUserVocabulary(userId: UserID, status?: UserVocabularyRow['status']) {
  const query = supabase.from('user_vocabulary').select('*').eq('user_id', userId);
  if (status) (query as any).eq('status', status);
  return query.order('updated_at', { ascending: false }) as any;
}

export function listDueReviews(userId: UserID, beforeDate: string, limit = 100) {
  return supabase
    .from('user_vocabulary')
    .select('*')
    .eq('user_id', userId)
    .lte('next_review_date', beforeDate)
    .order('next_review_date', { ascending: true })
    .limit(limit) as any;
}

/* -------- Exercises -------- */
export async function createExerciseWithWords(
  kind: ExerciseKind,
  instructions: string,
  wordIds: number[],
  creatorId?: UserID
) {
  const { data: exercise, error } = await supabase
    .from('exercises')
    .insert({ kind, instructions, creator_id: creatorId })
    .select()
    .maybeSingle<ExerciseRow>();
  if (error || !exercise) return { data: null, error };

  if (wordIds.length) {
    const rows = wordIds.map((word_id, idx) => ({
      exercise_id: exercise.id,
      word_id,
      position: idx + 1,
    }));
    const { error: ewError } = await supabase.from('exercise_words').insert(rows);
    if (ewError) return { data: exercise, error: ewError };
  }
  return { data: exercise, error: null };
}

export function markExerciseComplete(
  exerciseId: number,
  userId: UserID,
  score?: number,
  timeSpentSeconds?: number
) {
  const payload = {
    exercise_id: exerciseId,
    user_id: userId,
    completed: true,
    score: score ?? null,
    time_spent_seconds: timeSpentSeconds ?? 0,
    completed_at: new Date().toISOString(),
  };
  return supabase.from('exercise_users').upsert(payload).select().maybeSingle<ExerciseUserRow>();
}

export function listExercisesForUser(userId: UserID) {
  return supabase
    .from('exercise_users')
    .select('*, exercises(*)')
    .eq('user_id', userId)
    .order('completed_at', { ascending: false }) as any;
}

/* -------- Progress -------- */
export async function getProgress(userId: UserID) {
  return supabase.from('user_progress').select('*').eq('user_id', userId).maybeSingle<UserProgressRow>();
}

export async function bumpDailyXp(userId: UserID, xp: number, timeSpentSeconds: number) {
  const rpc = await supabase.rpc('add_xp_and_time', { p_user_id: userId, p_xp: xp, p_time: timeSpentSeconds });
  if (rpc.error && rpc.error.code === '42883') {
    const now = new Date().toISOString();
    return supabase
      .from('user_progress')
      .upsert({
        user_id: userId,
        daily_xp: xp,
        time_spent: timeSpentSeconds,
        last_updated: now,
      })
      .select()
      .maybeSingle<UserProgressRow>();
  }
  return rpc;
}

/* -------- AI stories -------- */
export async function saveStory(story_text: string, metadata: Record<string, any> = {}) {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session?.user?.id) {
    return { data: null, error: { code: 'NO_USER', message: 'Not authenticated' } };
  }

  if (__DEV__) {
    console.log('[saveStory] Attempting insert for user:', session.user.id);
  }

  const result = await supabase.from('ai_stories').insert({
    user_id: session.user.id,
    story_text,
    metadata,
  });

  if (__DEV__) {
    console.log('[saveStory] Insert result:', result.error ? result.error : 'success');
  }

  return result;
}

export function listStories(userId: UserID, limit = 20) {
  return supabase
    .from('ai_stories')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(limit) as any;
}

/* -------- Settings -------- */
export function getSettings(userId: UserID) {
  return supabase.from('user_settings').select('*').eq('user_id', userId).maybeSingle<UserSettingsRow>();
}

export function upsertSettings(userId: UserID, patch: Partial<UserSettingsRow>) {
  return supabase.from('user_settings').upsert({ user_id: userId, ...patch }).select().maybeSingle<UserSettingsRow>();
}

/* -------- Subscriptions -------- */
export function getSubscription(userId: UserID) {
  return supabase
    .from('subscriptions')
    .select('*')
    .eq('user_id', userId)
    .order('valid_until', { ascending: false })
    .limit(1)
    .maybeSingle<SubscriptionRow>();
}

export function setSubscription(userId: UserID, plan: SubscriptionRow['plan'], valid_until: string | null) {
  return supabase
    .from('subscriptions')
    .upsert({ user_id: userId, plan, valid_until })
    .select()
    .maybeSingle<SubscriptionRow>();
}

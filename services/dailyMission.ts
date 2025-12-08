import AsyncStorage from '@react-native-async-storage/async-storage';
import { levels } from '../app/quiz/data/levels';
import { Mission, MissionWithQuestions, UserStats, UserWordState, Word } from '../core/dailyMissionTypes';
import { isWeakWord, makeFreshUserWordState, sortWeakStates, toDateKey, updateUserWordStateAfterAnswer } from '../core/learningEngine';
import { planDailyMission } from '../core/missionPlanner';
import { ProgressService } from './ProgressService';
export type { Mission, MissionWithQuestions, MissionQuestion, UserWordState } from '../core/dailyMissionTypes';

const STORAGE_KEYS = {
  missions: '@engniter.dailyMissions',
  userWordStates: '@engniter.userWordStates',
  stats: '@engniter.dailyMissionStats',
  schema: '@engniter.dailyMissions.schemaVersion',
};

const MISSION_SCHEMA_VERSION = 2;
const missionCache: Map<string, MissionWithQuestions> = new Map();
const uwsCache: Map<string, Map<string, UserWordState>> = new Map();
const statsCache: Map<string, UserStats> = new Map();
let cachesLoaded = false;
const isDev = typeof __DEV__ !== 'undefined' ? __DEV__ : process.env.NODE_ENV !== 'production';

const nanoid = () => Math.random().toString(36).slice(2, 10);

// Load static word list from quiz levels (id = `${levelId}:${setId}:${word}`)
const allWords: Word[] = (() => {
  const bucket: Word[] = [];
  for (const lvl of levels) {
    for (const set of lvl.sets || []) {
      for (const w of set.words || []) {
        bucket.push({
          id: `${lvl.id}:${set.id}:${w.word}`,
          text: w.word,
          definition: w.definition,
          exampleSentence: w.example,
          difficulty: 1,
        });
      }
    }
  }
  return bucket;
})();

async function clearPersistentCaches() {
  await Promise.all([
    AsyncStorage.removeItem(STORAGE_KEYS.missions),
    AsyncStorage.removeItem(STORAGE_KEYS.userWordStates),
    AsyncStorage.removeItem(STORAGE_KEYS.stats),
    AsyncStorage.setItem(STORAGE_KEYS.schema, String(MISSION_SCHEMA_VERSION)),
  ]);
}

async function loadCaches() {
  try {
    const schemaRaw = await AsyncStorage.getItem(STORAGE_KEYS.schema);
    const schemaVersion = schemaRaw ? Number(schemaRaw) : 0;
    if (schemaVersion !== MISSION_SCHEMA_VERSION) {
      await clearPersistentCaches();
    }
    const [mRaw, uwsRaw, statsRaw] = await Promise.all([
      AsyncStorage.getItem(STORAGE_KEYS.missions),
      AsyncStorage.getItem(STORAGE_KEYS.userWordStates),
      AsyncStorage.getItem(STORAGE_KEYS.stats),
    ]);
    if (mRaw) {
      const parsed: any = JSON.parse(mRaw);
      Object.values(parsed || {}).forEach((entry: any) => {
        missionCache.set(entry.mission.id, {
          mission: entry.mission,
          questions: (entry.questions || []).map((q: any) => ({ ...q, answered: !!q.answered })),
        });
      });
    }
    if (uwsRaw) {
      const parsed = JSON.parse(uwsRaw);
      Object.keys(parsed || {}).forEach((userId) => {
        const map = new Map<string, UserWordState>();
        Object.values(parsed[userId] || {}).forEach((s: any) => {
          map.set(s.wordId, { ...s });
        });
        uwsCache.set(userId, map);
      });
    }
    if (statsRaw) {
      const parsed = JSON.parse(statsRaw);
      Object.keys(parsed || {}).forEach((userId) => {
        statsCache.set(userId, parsed[userId]);
      });
    }
  } catch (e) {
    console.warn('[dailyMission] failed to load caches', e);
  }
}

async function persistCaches() {
  try {
    const missionsObj: any = {};
    missionCache.forEach((value, key) => {
      missionsObj[key] = {
        mission: value.mission,
        questions: value.questions,
      };
    });

    const uwsObj: any = {};
    uwsCache.forEach((map, userId) => {
      uwsObj[userId] = {};
      map.forEach((v, wid) => {
        uwsObj[userId][wid] = v;
      });
    });

    const statsObj: any = {};
    statsCache.forEach((v, userId) => {
      statsObj[userId] = v;
    });

    await Promise.all([
      AsyncStorage.setItem(STORAGE_KEYS.missions, JSON.stringify(missionsObj)),
      AsyncStorage.setItem(STORAGE_KEYS.userWordStates, JSON.stringify(uwsObj)),
      AsyncStorage.setItem(STORAGE_KEYS.stats, JSON.stringify(statsObj)),
      AsyncStorage.setItem(STORAGE_KEYS.schema, String(MISSION_SCHEMA_VERSION)),
    ]);
  } catch (e) {
    console.warn('[dailyMission] failed to persist caches', e);
  }
}

async function ensureCachesLoaded() {
  if (cachesLoaded) return;
  await loadCaches();
  cachesLoaded = true;
}

function getExistingMission(userId: string, dateKey: string): MissionWithQuestions | null {
  for (const entry of missionCache.values()) {
    if (entry.mission.userId === userId && entry.mission.date === dateKey) {
      return entry;
    }
  }
  return null;
}

function shouldRegenerate(bundle: MissionWithQuestions): boolean {
  if (!bundle?.questions || bundle.questions.length < 5) return true;
  const hasStory = bundle.questions.some(q => q.type === 'story_mcq');
  return !hasStory;
}

function logMissionSummary(bundle: MissionWithQuestions, tag: 'existing' | 'new') {
  if (!isDev || !bundle) return;
  const counts = bundle.questions.reduce(
    (acc, q) => {
      if (q.type === 'weak_word_mcq') acc.review += 1;
      if (q.type === 'new_word_mcq') acc.newWords += 1;
      if (q.type === 'story_mcq') acc.story += 1;
      return acc;
    },
    { review: 0, newWords: 0, story: 0 }
  );
  console.log(
    `[dailyMission] ${tag} mission date=${bundle.mission.date} id=${bundle.mission.id} types=${bundle.questions
      .map(q => q.type)
      .join(',')} counts=${JSON.stringify(counts)}`
  );
}

function getUserWordState(userId: string, wordId: string): UserWordState | null {
  const map = uwsCache.get(userId);
  if (!map) return null;
  const state = map.get(wordId);
  return state ? { ...state } : null;
}

function upsertUserWordState(state: UserWordState) {
  const map = uwsCache.get(state.userId) ?? new Map<string, UserWordState>();
  map.set(state.wordId, state);
  uwsCache.set(state.userId, map);
}

function getUserWeakWords(userId: string, date: Date): UserWordState[] {
  const map = uwsCache.get(userId);
  if (!map) return [];
  const out: UserWordState[] = [];
  map.forEach((s) => {
    if (isWeakWord(s, date)) {
      out.push({ ...s });
    }
  });
  return sortWeakStates(out);
}

function getNewWordCandidates(userId: string): Word[] {
  const map = uwsCache.get(userId);
  return allWords.filter((w) => {
    if (!map) return true;
    const existing = map.get(w.id);
    return !existing || existing.status === 'new';
  });
}

async function updateUserStatsAfterMission(userId: string, mission: Mission) {
  const existing: UserStats = statsCache.get(userId) ?? {
    userId,
    xp: 0,
    streak: 0,
    lastMissionDate: null,
    missionsCompleted: 0,
  };
  const todayKey = mission.date;
  const lastDate = existing.lastMissionDate ? new Date(existing.lastMissionDate) : null;
  const today = new Date(todayKey);
  let streak = existing.streak || 0;
  if (!lastDate) {
    streak = 1;
  } else {
    const diff = Math.floor((today.getTime() - lastDate.getTime()) / (1000 * 60 * 60 * 24));
    if (diff === 0) {
      streak = Math.max(1, streak);
    } else if (diff === 1) {
      streak += 1;
    } else {
      streak = 1;
    }
  }

  const nextStats: UserStats = {
    ...existing,
    xp: existing.xp + mission.xpReward,
    streak,
    lastMissionDate: todayKey,
    missionsCompleted: (existing.missionsCompleted || 0) + 1,
  };
  statsCache.set(userId, nextStats);

  // Try to keep the global progress in sync (best-effort)
  try {
    await ProgressService.addXP(mission.xpReward, 'daily_mission');
    await ProgressService.updateStreak();
  } catch (e) {
    console.warn('[dailyMission] progress update failed (non-fatal)', e);
  }
}

export async function getTodayMissionForUser(userId: string, today: Date = new Date()): Promise<MissionWithQuestions> {
  await ensureCachesLoaded();
  const dateKey = toDateKey(today);
  const existing = getExistingMission(userId, dateKey);
  if (existing && !shouldRegenerate(existing)) {
    logMissionSummary(existing, 'existing');
    return existing;
  }

  const missionId = nanoid();
  const weakStates = getUserWeakWords(userId, today);
  const weakWords = weakStates
    .map((s) => allWords.find((w) => w.id === s.wordId))
    .filter(Boolean) as Word[];
  const newWordCandidates = getNewWordCandidates(userId);

  const plan = planDailyMission({
    userId,
    missionId,
    weakWords,
    newWords: newWordCandidates,
    wordsPool: allWords,
    today,
  });

  // Seed states for any words we have never seen
  plan.usedWordIds.forEach((wid) => {
    const existingState = getUserWordState(userId, wid);
    if (!existingState) {
      upsertUserWordState(makeFreshUserWordState(userId, wid, today));
    }
  });

  const questions = plan.questions.map((q) => ({ ...q, answered: false }));
  const bundle: MissionWithQuestions = { mission: plan.mission, questions };
  missionCache.set(missionId, bundle);
  await persistCaches();
  logMissionSummary(bundle, 'new');
  return missionCache.get(missionId)!;
}

export async function submitMissionAnswer(params: {
  missionId: string;
  questionId: string;
  chosenIndex: number;
  userId: string;
  answeredAt?: Date;
}): Promise<{ wasCorrect: boolean; mission: Mission; remaining: number }> {
  await ensureCachesLoaded();
  const answeredAt = params.answeredAt ?? new Date();
  const bundle = missionCache.get(params.missionId);
  if (!bundle) throw new Error('Mission not found');
  const question = bundle.questions.find((q) => q.id === params.questionId);
  if (!question) throw new Error('Question not found');

  const wasCorrect = question.correctIndex === params.chosenIndex;
  const wordIds = [question.primaryWordId, ...(question.extraWordIds || [])].filter(Boolean) as string[];

  wordIds.forEach((wid) => {
    const existing = getUserWordState(params.userId, wid) ?? makeFreshUserWordState(params.userId, wid, answeredAt);
    const updated = updateUserWordStateAfterAnswer(existing, wasCorrect, answeredAt);
    upsertUserWordState(updated);
  });

  question.answered = true;
  if (wasCorrect) bundle.mission.correctCount += 1;

  const answeredCount = bundle.questions.filter((q) => q.answered).length;
  const allAnswered = answeredCount >= bundle.questions.length;
  if (allAnswered) {
    bundle.mission.status = 'completed';
    bundle.mission.completedAt = answeredAt.toISOString();
    await updateUserStatsAfterMission(params.userId, bundle.mission);
  } else if (bundle.mission.status === 'not_started') {
    bundle.mission.status = 'in_progress';
  }

  await persistCaches();
  return {
    wasCorrect,
    mission: bundle.mission,
    remaining: bundle.questions.length - answeredCount,
  };
}

export async function resetMissionCachesForTesting() {
  missionCache.clear();
  uwsCache.clear();
  statsCache.clear();
  cachesLoaded = false;
  await clearPersistentCaches();
}

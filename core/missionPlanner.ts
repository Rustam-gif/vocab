import { Mission, MissionQuestion, MissionWithQuestions, QuestionType, Word } from './dailyMissionTypes';
import { toDateKey } from './learningEngine';

const pickRandom = <T>(arr: T[], count: number): T[] => {
  const copy = [...arr];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy.slice(0, count);
};

const buildMcqQuestion = (
  word: Word,
  type: QuestionType,
  missionId: string,
  index: number,
  wordsPool: Word[],
): MissionQuestion => {
  const distractors = pickRandom(wordsPool.filter(w => w.id !== word.id), 3);
  const optionsPool = pickRandom([{ text: word.definition, correct: true }, ...distractors.map(d => ({ text: d.definition, correct: false }))], 4);
  const correctIndex = optionsPool.findIndex(o => o.correct);
  return {
    id: `${missionId}:${word.id}:${index}`,
    missionId,
    index,
    type,
    primaryWordId: word.id,
    extraWordIds: [],
    prompt: `Word: ${word.text}\nChoose the best meaning.`,
    options: optionsPool.map(o => o.text),
    correctIndex: correctIndex === -1 ? 0 : correctIndex,
  };
};

const buildStoryQuestion = (
  missionId: string,
  index: number,
  words: Word[],
  wordsPool: Word[],
): MissionQuestion => {
  const chosen = pickRandom(words, Math.min(3, Math.max(2, words.length || 2)));
  const target = chosen[0] || words[0] || wordsPool[0];
  const distractors = pickRandom(wordsPool.filter(w => w.id !== target.id), 3);
  const storyLine = `When ${chosen.map(w => w.text).join(', ')} appeared in today’s practice, how would you use "${target.text}" here?`;
  const optionsPool = pickRandom([{ text: target.definition, correct: true }, ...distractors.map(d => ({ text: d.definition, correct: false }))], 4);
  const correctIndex = optionsPool.findIndex(o => o.correct);
  return {
    id: `${missionId}:story:${index}`,
    missionId,
    index,
    type: 'story_mcq',
    primaryWordId: target?.id ?? null,
    extraWordIds: chosen.map(w => w.id),
    prompt: `Mini story\n${storyLine}\nIn this story, what does "${target?.text}" most nearly mean?`,
    options: optionsPool.map(o => o.text),
    correctIndex: correctIndex === -1 ? 0 : correctIndex,
  };
};

export interface MissionPlanInput {
  userId: string;
  missionId: string;
  today?: Date;
  weakWords: Word[];
  newWords: Word[];
  wordsPool: Word[];
  targetQuestions?: number;
}

export interface MissionPlanResult extends MissionWithQuestions {
  weakWordsCount: number;
  newWordsCount: number;
  usedWordIds: string[];
}

export function planDailyMission(input: MissionPlanInput): MissionPlanResult {
  const {
    userId,
    missionId,
    weakWords,
    newWords,
    wordsPool,
    today = new Date(),
    targetQuestions = 5,
  } = input;

  const dateKey = toDateKey(today);
  const questions: MissionQuestion[] = [];
  const usedWordIds = new Set<string>();
  const targetWeak = 3;
  const targetNew = 1;
  const nonStorySlots = targetQuestions - 1;

  // Prioritize weak words
  const weakPicks = weakWords.slice(0, targetWeak);
  weakPicks.forEach((w, idx) => {
    questions.push(buildMcqQuestion(w, 'weak_word_mcq', missionId, idx, wordsPool));
    usedWordIds.add(w.id);
  });

  // Ensure at least one new word
  const remainingAfterWeak = Math.max(nonStorySlots - questions.length, 0);
  const baseNewCount = Math.min(targetNew, remainingAfterWeak, newWords.length);
  const newPicks = pickRandom(newWords, baseNewCount);
  newPicks.forEach((w, idx) => {
    const qIndex = questions.length + idx;
    questions.push(buildMcqQuestion(w, 'new_word_mcq', missionId, qIndex, wordsPool));
    usedWordIds.add(w.id);
  });

  // Fill remaining non-story slots with weak first, then new
  if (questions.length < nonStorySlots) {
    const fillerWeak = weakWords.filter(w => !usedWordIds.has(w.id)).slice(0, nonStorySlots - questions.length);
    fillerWeak.forEach((w, idx) => {
      const qIndex = questions.length + idx;
      questions.push(buildMcqQuestion(w, 'weak_word_mcq', missionId, qIndex, wordsPool));
      usedWordIds.add(w.id);
    });
  }

  if (questions.length < nonStorySlots) {
    const moreNew = newWords.filter(w => !usedWordIds.has(w.id)).slice(0, nonStorySlots - questions.length);
    moreNew.forEach((w, idx) => {
      const qIndex = questions.length + idx;
      questions.push(buildMcqQuestion(w, 'new_word_mcq', missionId, qIndex, wordsPool));
      usedWordIds.add(w.id);
    });
  }

  // Absolute fallback: fill with random words from pool to keep 4 non-story questions
  if (questions.length < nonStorySlots) {
    const filler = wordsPool.filter(w => !usedWordIds.has(w.id)).slice(0, nonStorySlots - questions.length);
    filler.forEach((w, idx) => {
      const qIndex = questions.length + idx;
      questions.push(buildMcqQuestion(w, 'weak_word_mcq', missionId, qIndex, wordsPool));
      usedWordIds.add(w.id);
    });
  }

  // Story uses today’s words, or fall back to pool
  const wordsForStory = Array.from(usedWordIds)
    .map(id => wordsPool.find(w => w.id === id))
    .filter(Boolean) as Word[];
  const storyWords = wordsForStory.length ? wordsForStory : pickRandom(wordsPool, Math.min(3, wordsPool.length));
  const storyQuestion = buildStoryQuestion(missionId, targetQuestions - 1, storyWords, wordsPool);

  // Shuffle non-story questions
  const nonStory = [...questions];
  for (let i = nonStory.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [nonStory[i], nonStory[j]] = [nonStory[j], nonStory[i]];
  }

  const ordered: MissionQuestion[] = [
    ...nonStory.map((q, idx) => ({ ...q, index: idx })),
    { ...storyQuestion, index: targetQuestions - 1 },
  ];

  const mission: Mission = {
    id: missionId,
    userId,
    date: dateKey,
    status: 'not_started',
    numQuestions: targetQuestions,
    xpReward: 60,
    weakWordsCount: ordered.filter(q => q.type === 'weak_word_mcq').length,
    newWordsCount: ordered.filter(q => q.type === 'new_word_mcq').length,
    createdAt: new Date().toISOString(),
    completedAt: null,
    correctCount: 0,
  };

  return {
    mission,
    questions: ordered,
    weakWordsCount: mission.weakWordsCount,
    newWordsCount: mission.newWordsCount,
    usedWordIds: Array.from(usedWordIds),
  };
}

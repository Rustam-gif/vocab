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

const escapeRegExp = (value: string): string => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

const normalizeWhitespace = (text: string): string => text.replace(/\s+/g, ' ').trim();

type SimplePos = 'verb' | 'noun' | 'adj' | 'adv' | 'other';

const inferPosFromDefinition = (definition: string): SimplePos => {
  const def = normalizeWhitespace(definition || '').toLowerCase();
  if (!def) return 'other';
  if (def.startsWith('to ')) return 'verb';
  if (def.startsWith('a ') || def.startsWith('an ') || def.includes('someone who') || def.includes('something that')) {
    return 'noun';
  }
  if (def.includes('able to') || def.startsWith('very ') || def.includes('used to describe') || def.includes('showing')) {
    return 'adj';
  }
  if (def.endsWith('ly')) return 'adv';
  return 'other';
};

const toLemma = (word: string): string => {
  let base = (word || '').toLowerCase().replace(/[^a-z]/g, '');
  const original = base;
  const strip = (suffix: string) => {
    if (base.endsWith(suffix) && base.length - suffix.length >= 4) {
      base = base.slice(0, -suffix.length);
    }
  };
  strip('ing');
  strip('ed');
  strip('es');
  strip('s');
  return base || original;
};

const isSameLemma = (a: Word, b: Word): boolean => toLemma(a.text) === toLemma(b.text);

const pickSimilarWords = (target: Word, pool: Word[], count: number): Word[] => {
  const cleaned = pool.filter(
    w => w.id !== target.id && !isSameLemma(w, target) && normalizeWhitespace(w.definition || '').length > 0,
  );
  if (!cleaned.length) return [];
  const targetPos = inferPosFromDefinition(target.definition || '');
  let candidates = cleaned;
  if (targetPos !== 'other') {
    const samePos = cleaned.filter(w => inferPosFromDefinition(w.definition || '') === targetPos);
    if (samePos.length >= count) {
      candidates = samePos;
    } else if (samePos.length > 0) {
      const extra = cleaned.filter(w => !samePos.includes(w));
      candidates = [...samePos, ...extra];
    }
  }
  return pickRandom(candidates, count);
};

const simplifyDefinition = (definition: string, maxLength = 120): string => {
  const clean = normalizeWhitespace(definition || '');
  if (clean.length <= maxLength) return clean;
  return `${clean.slice(0, maxLength - 1)}…`;
};

const getExampleSentence = (word: Word): string => {
  const existing = normalizeWhitespace(word.exampleSentence || '');
  if (existing) return existing;
  const pos = inferPosFromDefinition(word.definition || '');
  if (pos === 'verb') return `I need to ${word.text} this project before Friday.`;
  if (pos === 'noun') return `This ${word.text} helped me understand the lesson.`;
  if (pos === 'adj') return `It was a very ${word.text} day for everyone.`;
  if (pos === 'adv') return `She spoke ${word.text} during the meeting.`;
  return `I learned a new word: "${word.text}".`;
};

const buildDefinitionQuestion = (
  word: Word,
  missionId: string,
  index: number,
  wordsPool: Word[],
): MissionQuestion => {
  const distractors = pickSimilarWords(word, wordsPool, 3);
  const baseOptions = [
    { text: simplifyDefinition(word.definition || ''), correct: true },
    ...distractors.map(d => ({ text: simplifyDefinition(d.definition || ''), correct: false })),
  ];
  const optionsPool = pickRandom(baseOptions, Math.min(4, baseOptions.length));
  const correctIndex = optionsPool.findIndex(o => o.correct);
  return {
    id: `${missionId}:${word.id}:${index}:def`,
    missionId,
    index,
    type: 'definition_mcq',
    primaryWordId: word.id,
    extraWordIds: [],
    prompt: `Word: ${word.text}\nWhat does "${word.text}" most nearly mean?`,
    options: optionsPool.map(o => o.text),
    correctIndex: correctIndex === -1 ? 0 : correctIndex,
  };
};

const buildContextFillBlankQuestion = (
  word: Word,
  missionId: string,
  index: number,
  wordsPool: Word[],
): MissionQuestion => {
  const sentence = getExampleSentence(word);
  const pattern = new RegExp(`\\b${escapeRegExp(word.text)}\\b`, 'gi');
  let blanked = sentence.replace(pattern, '_____');
  if (blanked === sentence) {
    blanked = `${sentence} (_____)`;
  }
  const distractors = pickSimilarWords(word, wordsPool, 3);
  const baseOptions = [
    { text: word.text, correct: true },
    ...distractors.map(d => ({ text: d.text, correct: false })),
  ];
  const optionsPool = pickRandom(baseOptions, Math.min(4, baseOptions.length));
  const correctIndex = optionsPool.findIndex(o => o.correct);
  return {
    id: `${missionId}:${word.id}:${index}:ctx`,
    missionId,
    index,
    type: 'context_fill_blank',
    primaryWordId: word.id,
    extraWordIds: [],
    prompt: `Fill in the blank\n${blanked}\nWhich word best completes the sentence?`,
    options: optionsPool.map(o => o.text),
    correctIndex: correctIndex === -1 ? 0 : correctIndex,
  };
};

const buildUsageValidationQuestion = (
  word: Word,
  missionId: string,
  index: number,
  wordsPool: Word[],
): MissionQuestion => {
  const correctSentence = getExampleSentence(word);
  const distractorWords = pickSimilarWords(word, wordsPool, 2);
  const distractorSentences = distractorWords.map(d => {
    const base = getExampleSentence(d);
    const pattern = new RegExp(`\\b${escapeRegExp(d.text)}\\b`, 'gi');
    return base.replace(pattern, word.text);
  });
  const baseOptions = [
    { text: correctSentence, correct: true },
    ...distractorSentences.map(text => ({ text, correct: false })),
  ];
  const optionsPool = pickRandom(baseOptions, Math.min(3, baseOptions.length));
  const correctIndex = optionsPool.findIndex(o => o.correct);
  return {
    id: `${missionId}:${word.id}:${index}:usage`,
    missionId,
    index,
    type: 'usage_validation',
    primaryWordId: word.id,
    extraWordIds: [],
    prompt: `Usage check\nWhich sentence uses "${word.text}" in a natural way?`,
    options: optionsPool.map(o => o.text),
    correctIndex: correctIndex === -1 ? 0 : correctIndex,
  };
};

const buildSynonymAntonymQuestion = (
  word: Word,
  missionId: string,
  index: number,
  wordsPool: Word[],
): MissionQuestion => {
  const distractors = pickSimilarWords(word, wordsPool, 3);
  const baseOptions = [
    { text: simplifyDefinition(word.definition || ''), correct: true },
    ...distractors.map(d => ({ text: simplifyDefinition(d.definition || ''), correct: false })),
  ];
  const optionsPool = pickRandom(baseOptions, Math.min(4, baseOptions.length));
  const correctIndex = optionsPool.findIndex(o => o.correct);
  return {
    id: `${missionId}:${word.id}:${index}:syn`,
    missionId,
    index,
    type: 'synonym_antonym',
    primaryWordId: word.id,
    extraWordIds: [],
    prompt: `Closest meaning\nWhich option is closest in meaning to "${word.text}"?`,
    options: optionsPool.map(o => o.text),
    correctIndex: correctIndex === -1 ? 0 : correctIndex,
  };
};

const buildRewriteSentenceQuestion = (
  word: Word,
  missionId: string,
  index: number,
  wordsPool: Word[],
): MissionQuestion => {
  const idea = simplifyDefinition(word.definition || '');
  const correctSentence = getExampleSentence(word);
  const distractorWords = pickSimilarWords(word, wordsPool, 2);
  const distractorSentences = distractorWords.map(d => {
    const base = getExampleSentence(d);
    const pattern = new RegExp(`\\b${escapeRegExp(d.text)}\\b`, 'gi');
    return base.replace(pattern, word.text);
  });
  const baseOptions = [
    { text: correctSentence, correct: true },
    ...distractorSentences.map(text => ({ text, correct: false })),
  ];
  const optionsPool = pickRandom(baseOptions, Math.min(3, baseOptions.length));
  const correctIndex = optionsPool.findIndex(o => o.correct);
  return {
    id: `${missionId}:${word.id}:${index}:rewrite`,
    missionId,
    index,
    type: 'rewrite_sentence',
    primaryWordId: word.id,
    extraWordIds: [],
    prompt: `Rewrite the idea\nWhich sentence best expresses this idea using "${word.text}"?\n${idea}`,
    options: optionsPool.map(o => o.text),
    correctIndex: correctIndex === -1 ? 0 : correctIndex,
  };
};

const buildStoryContextQuestion = (
  missionId: string,
  index: number,
  todayWords: Word[],
  target: Word,
  wordsPool: Word[],
): MissionQuestion => {
  const companions = todayWords.filter(w => w.id !== target.id);
  const contextWords = pickRandom(companions, Math.min(2, companions.length));
  const mentionList = contextWords.length
    ? `${contextWords.map(w => `"${w.text}"`).join(', ')} and "${target.text}"`
    : `"${target.text}"`;
  const storyLine = `During your Daily Mission, you read a short story that used words like ${mentionList}. In one scene, a character relies on "${target.text}" to solve a problem.`;
  const questionLine = `In that story, what does "${target.text}" most nearly mean?`;
  const distractors = pickSimilarWords(target, wordsPool, 3);
  const baseOptions = [
    { text: simplifyDefinition(target.definition || ''), correct: true },
    ...distractors.map(d => ({ text: simplifyDefinition(d.definition || ''), correct: false })),
  ];
  const optionsPool = pickRandom(baseOptions, Math.min(4, baseOptions.length));
  const correctIndex = optionsPool.findIndex(o => o.correct);
  return {
    id: `${missionId}:story:${index}`,
    missionId,
    index,
    type: 'story_context_mcq',
    primaryWordId: target.id,
    extraWordIds: contextWords.map(w => w.id),
    prompt: `Short story\n${storyLine}\n${questionLine}`,
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

type SelectionBucket = 'weak' | 'new' | 'other';

interface SelectedWord {
  word: Word;
  bucket: SelectionBucket;
}

const selectMissionWords = (
  weakWords: Word[],
  newWords: Word[],
  wordsPool: Word[],
  totalSlots: number,
): SelectedWord[] => {
  const used = new Set<string>();
  const selected: SelectedWord[] = [];

  const pushWord = (word: Word, bucket: SelectionBucket) => {
    if (!word || used.has(word.id)) return;
    used.add(word.id);
    selected.push({ word, bucket });
  };

  const takeFrom = (source: Word[], count: number, bucket: SelectionBucket, random: boolean) => {
    if (count <= 0) return;
    const available = source.filter(w => !used.has(w.id));
    const picks = random ? pickRandom(available, count) : available.slice(0, count);
    picks.forEach(w => pushWord(w, bucket));
  };

  const minNew = newWords.length > 0 ? 1 : 0;
  const maxNew = Math.min(2, totalSlots);

  if (minNew > 0) {
    takeFrom(newWords, minNew, 'new', true);
  }

  let remaining = totalSlots - selected.length;
  const extraNew = Math.min(Math.max(maxNew - minNew, 0), remaining, Math.max(newWords.length - minNew, 0));
  if (extraNew > 0) {
    takeFrom(newWords, extraNew, 'new', true);
  }

  remaining = totalSlots - selected.length;
  if (remaining > 0 && weakWords.length) {
    const weakCount = Math.min(remaining, weakWords.length);
    takeFrom(weakWords, weakCount, 'weak', false);
  }

  remaining = totalSlots - selected.length;
  if (remaining > 0) {
    const poolCount = Math.min(remaining, wordsPool.length);
    takeFrom(wordsPool, poolCount, 'other', true);
  }

  return selected.slice(0, totalSlots);
};

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
  const totalSlots = Math.max(1, targetQuestions);
  const selections = selectMissionWords(weakWords, newWords, wordsPool, totalSlots);
  const wordsForQuestions = selections.map(s => s.word);
  const usedWordIds = new Set<string>(wordsForQuestions.map(w => w.id));

  const questions: MissionQuestion[] = [];

  if (wordsForQuestions[0]) {
    questions.push(buildDefinitionQuestion(wordsForQuestions[0], missionId, 0, wordsPool));
  }

  if (wordsForQuestions[1]) {
    questions.push(buildContextFillBlankQuestion(wordsForQuestions[1], missionId, 1, wordsPool));
  }

  if (wordsForQuestions[2]) {
    const word = wordsForQuestions[2];
    const useUsage = Math.random() < 0.6;
    const q = useUsage
      ? buildUsageValidationQuestion(word, missionId, 2, wordsPool)
      : buildSynonymAntonymQuestion(word, missionId, 2, wordsPool);
    questions.push(q);
  }

  if (wordsForQuestions[3]) {
    questions.push(buildRewriteSentenceQuestion(wordsForQuestions[3], missionId, 3, wordsPool));
  }

  if (wordsForQuestions[4]) {
    const storyTarget = wordsForQuestions[4];
    const todayWords = wordsForQuestions.slice(0, 4);
    questions.push(buildStoryContextQuestion(missionId, 4, todayWords, storyTarget, wordsPool));
  } else if (wordsForQuestions.length > 1) {
    const storyTarget = wordsForQuestions[wordsForQuestions.length - 1];
    const todayWords = wordsForQuestions.filter(w => w.id !== storyTarget.id);
    questions.push(buildStoryContextQuestion(missionId, questions.length, todayWords, storyTarget, wordsPool));
  }

  const ordered: MissionQuestion[] = questions.map((q, idx) => ({ ...q, index: idx }));

  const weakWordsCount = selections.filter(s => s.bucket === 'weak').length;
  const newWordsCount = selections.filter(s => s.bucket === 'new').length;

  const mission: Mission = {
    id: missionId,
    userId,
    date: dateKey,
    status: 'not_started',
    numQuestions: targetQuestions,
    xpReward: 60,
    weakWordsCount,
    newWordsCount,
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

import { levels } from '../app/quiz/data/levels';

export type Band = 'A1' | 'A2' | 'B1' | 'B2' | 'C1';

export type QuestionKind = 'definition' | 'synonym' | 'antonym' | 'context' | 'collocation';

export type PlacementItem = {
  id: string;
  word: string;
  band: Band;
  topic: string;
  kind: QuestionKind;
  prompt: string;
  options: string[]; // 4 options
  correctIndex: number;
  difficulty: number; // -2 to 2 scale matching ability
  meta?: { example?: string };
};

export type PlacementAnswer = {
  itemId: string;
  correct: boolean;
  chosen?: string;
  timestamp: Date;
  responseTime?: number; // ms
};

export type PlacementSession = {
  id: string;
  asked: string[];
  answers: PlacementAnswer[];
  ability: number; // -2 (A1) to 2 (C1) continuous scale
  confidence: number; // 0-1, how confident we are in the ability estimate
  consecutiveCorrect: number;
  consecutiveWrong: number;
  bandPerformance: Record<Band, { correct: number; total: number }>;
};

// Band to numeric difficulty mapping
const BAND_DIFFICULTY: Record<Band, number> = {
  A1: -2,
  A2: -1,
  B1: 0,
  B2: 1,
  C1: 2,
};

const bandToIndex = (b: Band): number => BAND_DIFFICULTY[b];
const indexToBand = (i: number): Band => {
  if (i <= -1.5) return 'A1';
  if (i <= -0.5) return 'A2';
  if (i <= 0.5) return 'B1';
  if (i <= 1.5) return 'B2';
  return 'C1';
};

// Map level.id to CEFR band with more granularity
const levelSetToBand = (levelId: string, setIndex: number): Band => {
  if (levelId === 'beginner') {
    return setIndex < 5 ? 'A1' : 'A2';
  }
  if (levelId === 'intermediate') return 'B1';
  if (levelId === 'upper-intermediate') return 'B2';
  if (levelId === 'advanced') return 'B2';
  return 'C1';
};

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

// Extended antonym map
const ANTONYM_MAP: Record<string, string> = {
  'wake up': 'sleep', sleep: 'wake up',
  hungry: 'full', full: 'hungry',
  hot: 'cold', cold: 'hot',
  happy: 'sad', sad: 'happy',
  friend: 'enemy', enemy: 'friend',
  buy: 'sell', sell: 'buy',
  open: 'close', close: 'open',
  start: 'stop', stop: 'start',
  begin: 'end', end: 'begin',
  teacher: 'student', student: 'teacher',
  help: 'harm', harm: 'help',
  easy: 'hard', hard: 'easy',
  fast: 'slow', slow: 'fast',
  big: 'small', small: 'big',
  tall: 'short', short: 'tall',
  young: 'old', old: 'young',
  rich: 'poor', poor: 'rich',
  strong: 'weak', weak: 'strong',
  light: 'dark', dark: 'light',
  love: 'hate', hate: 'love',
  win: 'lose', lose: 'win',
  push: 'pull', pull: 'push',
  arrive: 'leave', leave: 'arrive',
  remember: 'forget', forget: 'remember',
  increase: 'decrease', decrease: 'increase',
  accept: 'reject', reject: 'accept',
  succeed: 'fail', fail: 'succeed',
  improve: 'worsen', worsen: 'improve',
};

// Common collocations for context questions
const COLLOCATIONS: Record<string, string[]> = {
  make: ['a decision', 'a mistake', 'progress', 'an effort'],
  take: ['a break', 'a photo', 'notes', 'time'],
  do: ['homework', 'exercise', 'research', 'the dishes'],
  have: ['a meeting', 'a conversation', 'an idea', 'lunch'],
  get: ['started', 'better', 'ready', 'tired'],
};

export function buildBank(): PlacementItem[] {
  const pool: Array<{
    word: string;
    definition: string;
    synonyms: string[];
    example?: string;
    band: Band;
    topic: string;
    difficulty: number;
  }> = [];

  levels.forEach((lvl) => {
    (lvl.sets || []).forEach((set, setIdx) => {
      const band = levelSetToBand(lvl.id, Number(setIdx));
      const topic = set.title || lvl.name;
      const baseDifficulty = bandToIndex(band);

      (set.words || []).forEach((w, wordIdx) => {
        if (!w.word || !w.definition) return;
        const syns = Array.isArray((w as any).synonyms) ? (w as any).synonyms as string[] : [];
        // Add slight variation to difficulty within same band
        const difficultyVariation = (wordIdx % 5) * 0.1 - 0.2;
        pool.push({
          word: w.word,
          definition: w.definition,
          synonyms: syns,
          example: (w as any).example,
          band,
          topic,
          difficulty: baseDifficulty + difficultyVariation,
        });
      });
    });
  });

  const items: PlacementItem[] = [];

  pool.forEach((entry, idx) => {
    // Generate multiple question types per word for variety
    const questionTypes: QuestionKind[] = ['definition'];

    if (ANTONYM_MAP[entry.word.toLowerCase()]) {
      questionTypes.push('antonym');
    }
    if ((entry.synonyms || []).length > 0) {
      questionTypes.push('synonym');
    }
    if (entry.example) {
      questionTypes.push('context');
    }

    // Create at least one question per word
    const kind = questionTypes[Math.floor(Math.random() * questionTypes.length)];

    // Definition question - "What does X mean?"
    if (kind === 'definition') {
      const detectPos = (def: string): 'verb' | 'noun' | 'adj' | 'other' => {
        const s = def.trim().toLowerCase();
        if (s.startsWith('to ')) return 'verb';
        if (s.startsWith('a ') || s.startsWith('an ') || s.startsWith('the ')) return 'noun';
        return 'adj';
      };

      const targetPos = detectPos(entry.definition);
      const targetLen = entry.definition.trim().split(/\s+/).length;

      // Find distractors from similar difficulty level
      const candidates = pool.filter((p) =>
        p.word !== entry.word &&
        Math.abs(p.difficulty - entry.difficulty) <= 1.5
      );

      const ranked = candidates
        .map((p) => ({
          p,
          pos: detectPos(p.definition),
          len: p.definition.trim().split(/\s+/).length,
        }))
        .filter((x) => x.pos === targetPos)
        .map((x) => ({
          p: x.p,
          score: Math.abs(x.len - targetLen) + Math.random() * 0.5,
        }))
        .sort((a, b) => a.score - b.score)
        .map((x) => x.p)
        .slice(0, 10);

      const fallback = shuffle(candidates).slice(0, 10);
      const source = ranked.length >= 3 ? ranked : fallback;

      const distractorDefs = shuffle(source)
        .filter((o) => o.definition.toLowerCase() !== entry.definition.toLowerCase())
        .slice(0, 3)
        .map((o) => o.definition);

      if (distractorDefs.length < 3) return; // Skip if not enough distractors

      const options = shuffle([entry.definition, ...distractorDefs]);
      const correctIndex = options.findIndex((o) => o.toLowerCase() === entry.definition.toLowerCase());

      items.push({
        id: `pl-${idx}-${entry.word}-def`,
        word: entry.word,
        band: entry.band,
        topic: entry.topic,
        kind: 'definition',
        prompt: 'Which definition best matches the word?',
        options,
        correctIndex: Math.max(0, correctIndex),
        difficulty: entry.difficulty,
        meta: entry.example ? { example: entry.example } : undefined,
      });
    }

    // Antonym question
    if (kind === 'antonym') {
      const answer = ANTONYM_MAP[entry.word.toLowerCase()];
      if (!answer) return;

      const otherWords = shuffle(
        pool.filter((p) =>
          p.word.toLowerCase() !== entry.word.toLowerCase() &&
          p.word.toLowerCase() !== answer.toLowerCase() &&
          Math.abs(p.difficulty - entry.difficulty) <= 1
        )
      ).slice(0, 8);

      const distractors = shuffle(otherWords.map((o) => o.word)).slice(0, 3);
      if (distractors.length < 3) return;

      const options = shuffle([answer, ...distractors]);
      const correctIndex = options.findIndex((o) => o.toLowerCase() === answer.toLowerCase());

      items.push({
        id: `pl-${idx}-${entry.word}-ant`,
        word: entry.word,
        band: entry.band,
        topic: entry.topic,
        kind: 'antonym',
        prompt: 'Choose the opposite meaning',
        options,
        correctIndex: Math.max(0, correctIndex),
        difficulty: entry.difficulty + 0.3, // Antonyms slightly harder
        meta: entry.example ? { example: entry.example } : undefined,
      });
    }

    // Synonym question
    if (kind === 'synonym' && (entry.synonyms || []).length > 0) {
      const correct = entry.synonyms[0];
      const otherSyns = shuffle(
        pool
          .filter((p) => Math.abs(p.difficulty - entry.difficulty) <= 1)
          .flatMap((p) => p.synonyms || [])
          .filter((s) => s && s.toLowerCase() !== correct.toLowerCase())
      ).slice(0, 8);

      const distractors = shuffle(otherSyns).slice(0, 3);
      if (distractors.length < 3) return;

      const options = shuffle([correct, ...distractors]);
      const correctIndex = Math.max(0, options.findIndex((o) => o.toLowerCase() === correct.toLowerCase()));

      items.push({
        id: `pl-${idx}-${entry.word}-syn`,
        word: entry.word,
        band: entry.band,
        topic: entry.topic,
        kind: 'synonym',
        prompt: 'Choose the closest synonym',
        options,
        correctIndex,
        difficulty: entry.difficulty,
        meta: entry.example ? { example: entry.example } : undefined,
      });
    }

    // Context question - fill in the blank
    if (kind === 'context' && entry.example) {
      const example = entry.example;
      // Only if word appears in example
      const wordLower = entry.word.toLowerCase();
      const exampleLower = example.toLowerCase();

      if (exampleLower.includes(wordLower)) {
        const blankedExample = example.replace(
          new RegExp(entry.word, 'gi'),
          '_____'
        );

        const distractorWords = shuffle(
          pool
            .filter((p) =>
              p.word !== entry.word &&
              Math.abs(p.difficulty - entry.difficulty) <= 0.8
            )
            .map((p) => p.word)
        ).slice(0, 3);

        if (distractorWords.length >= 3) {
          const options = shuffle([entry.word, ...distractorWords]);
          const correctIndex = options.findIndex((o) => o.toLowerCase() === wordLower);

          items.push({
            id: `pl-${idx}-${entry.word}-ctx`,
            word: '_____',
            band: entry.band,
            topic: entry.topic,
            kind: 'context',
            prompt: 'Fill in the blank',
            options,
            correctIndex: Math.max(0, correctIndex),
            difficulty: entry.difficulty + 0.2, // Context slightly harder
            meta: { example: blankedExample },
          });
        }
      }
    }
  });

  return shuffle(items);
}

export function startSession(): PlacementSession {
  return {
    id: `session_${Date.now()}`,
    asked: [],
    answers: [],
    ability: 0, // Start at B1 (middle)
    confidence: 0,
    consecutiveCorrect: 0,
    consecutiveWrong: 0,
    bandPerformance: {
      A1: { correct: 0, total: 0 },
      A2: { correct: 0, total: 0 },
      B1: { correct: 0, total: 0 },
      B2: { correct: 0, total: 0 },
      C1: { correct: 0, total: 0 },
    },
  };
}

/**
 * Improved adaptive question selection using Maximum Information criterion
 * Selects questions that will give us the most information about the user's ability
 */
export function pickNextItem(
  bank: PlacementItem[],
  session: PlacementSession,
  forceBand?: Band
): PlacementItem | null {
  const unasked = bank.filter((i) => !session.asked.includes(i.id));
  if (!unasked.length) return null;

  // If forcing a band, prioritize that band
  if (forceBand) {
    const targetDifficulty = bandToIndex(forceBand);
    const bandItems = unasked.filter((i) => i.band === forceBand);

    if (bandItems.length > 0) {
      // Pick item closest to estimated ability within the band for maximum info
      const sorted = bandItems.sort((a, b) => {
        const aDiff = Math.abs(a.difficulty - session.ability);
        const bDiff = Math.abs(b.difficulty - session.ability);
        return aDiff - bDiff + (Math.random() * 0.2 - 0.1);
      });
      return sorted[0];
    }

    // Fallback to nearby bands
    const nearbyItems = unasked.filter((i) =>
      Math.abs(bandToIndex(i.band) - targetDifficulty) <= 1
    );
    if (nearbyItems.length > 0) {
      return nearbyItems[Math.floor(Math.random() * nearbyItems.length)];
    }
  }

  // Adaptive selection: pick items at or slightly above current ability
  // This maximizes information gain (items too easy or hard are less informative)
  const targetDifficulty = session.ability + 0.3; // Slightly challenging

  const scored = unasked.map((item) => {
    // Information function peaks when item difficulty matches ability
    const diffDelta = Math.abs(item.difficulty - targetDifficulty);

    // Prefer variety in question types
    const recentKinds = session.answers.slice(-5).map((a) => {
      const askedItem = bank.find((i) => i.id === a.itemId);
      return askedItem?.kind;
    });
    const kindBonus = recentKinds.includes(item.kind) ? 0.3 : 0;

    // Prefer variety in bands (don't ask same band repeatedly)
    const recentBands = session.answers.slice(-3).map((a) => {
      const askedItem = bank.find((i) => i.id === a.itemId);
      return askedItem?.band;
    });
    const bandPenalty = recentBands.filter((b) => b === item.band).length * 0.2;

    // Information score (lower is better)
    const score = diffDelta + kindBonus + bandPenalty + Math.random() * 0.15;

    return { item, score };
  });

  // Sort by score (lower is better) and pick best
  scored.sort((a, b) => a.score - b.score);
  return scored[0]?.item || null;
}

/**
 * Improved ability update using Bayesian-like estimation
 * Considers: correctness, item difficulty, response consistency
 */
export function updateAbility(
  session: PlacementSession,
  item: PlacementItem,
  correct: boolean,
  responseTime?: number
): void {
  const itemDifficulty = item.difficulty;
  const currentAbility = session.ability;

  // Track band performance
  session.bandPerformance[item.band].total += 1;
  if (correct) {
    session.bandPerformance[item.band].correct += 1;
  }

  // Track consecutive streaks
  if (correct) {
    session.consecutiveCorrect += 1;
    session.consecutiveWrong = 0;
  } else {
    session.consecutiveWrong += 1;
    session.consecutiveCorrect = 0;
  }

  // Calculate ability adjustment
  let delta = 0;

  if (correct) {
    // Correct answer: bigger boost if item was at or above current ability
    if (itemDifficulty >= currentAbility) {
      // Answered correctly on challenging item - good evidence of higher ability
      delta = 0.4 + (itemDifficulty - currentAbility) * 0.15;
    } else {
      // Correct on easy item - small boost
      delta = 0.15;
    }

    // Bonus for consecutive correct answers (consistent performance)
    if (session.consecutiveCorrect >= 3) {
      delta += 0.1;
    }

    // Fast correct answers suggest mastery (if response time provided)
    if (responseTime && responseTime < 5000) {
      delta += 0.1;
    }
  } else {
    // Wrong answer: bigger penalty if item was at or below current ability
    if (itemDifficulty <= currentAbility) {
      // Wrong on an "easy" item - evidence ability is lower
      delta = -0.4 - (currentAbility - itemDifficulty) * 0.15;
    } else {
      // Wrong on hard item - smaller penalty
      delta = -0.15;
    }

    // Extra penalty for consecutive wrong (struggling)
    if (session.consecutiveWrong >= 2) {
      delta -= 0.1;
    }
  }

  // Apply update with bounds
  session.ability = Math.max(-2, Math.min(2, currentAbility + delta));

  // Update confidence based on consistency
  const totalAnswers = session.answers.length + 1;
  const baseConfidence = Math.min(1, totalAnswers / 15); // Full confidence after ~15 questions

  // Reduce confidence if answers are inconsistent
  const recentCorrect = session.answers.slice(-5).filter((a) => a.correct).length;
  const consistencyBonus = Math.abs(recentCorrect - 2.5) < 1.5 ? 0 : -0.1;

  session.confidence = Math.max(0, Math.min(1, baseConfidence + consistencyBonus));
}

/**
 * Determine if we can stop early with high confidence
 */
export function canStopEarly(session: PlacementSession): boolean {
  // Need minimum questions
  if (session.answers.length < 10) return false;

  // High confidence
  if (session.confidence >= 0.85) return true;

  // Clear pattern: 3 wrong in a row at a band = found ceiling
  if (session.consecutiveWrong >= 3) return true;

  // Strong consistent performance
  if (session.consecutiveCorrect >= 5 && session.ability >= 1.5) return true;

  return false;
}

/**
 * Get recommended level from final ability score
 */
export function recommendedLevelFromAbility(ability: number): string {
  const band = indexToBand(ability);

  // Map bands to app levels
  switch (band) {
    case 'A1':
    case 'A2':
      return 'beginner';
    case 'B1':
      return 'intermediate';
    case 'B2':
      return 'upper-intermediate';
    case 'C1':
      return 'advanced';
    default:
      return 'intermediate';
  }
}

/**
 * Get detailed assessment results
 */
export function getAssessmentSummary(session: PlacementSession): {
  band: Band;
  level: string;
  ability: number;
  confidence: number;
  strengths: Band[];
  weaknesses: Band[];
  totalQuestions: number;
  correctRate: number;
} {
  const band = indexToBand(session.ability);
  const level = recommendedLevelFromAbility(session.ability);

  const totalCorrect = session.answers.filter((a) => a.correct).length;
  const totalQuestions = session.answers.length;
  const correctRate = totalQuestions > 0 ? totalCorrect / totalQuestions : 0;

  // Identify strengths and weaknesses
  const strengths: Band[] = [];
  const weaknesses: Band[] = [];

  (Object.keys(session.bandPerformance) as Band[]).forEach((b) => {
    const perf = session.bandPerformance[b];
    if (perf.total >= 2) {
      const rate = perf.correct / perf.total;
      if (rate >= 0.75) strengths.push(b);
      if (rate <= 0.4) weaknesses.push(b);
    }
  });

  return {
    band,
    level,
    ability: session.ability,
    confidence: session.confidence,
    strengths,
    weaknesses,
    totalQuestions,
    correctRate,
  };
}

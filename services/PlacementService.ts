import { levels } from '../app/quiz/data/levels';

export type Band = 'A1' | 'A2' | 'B1' | 'B2' | 'C1';

export type QuestionKind = 'definition' | 'synonym' | 'antonym';

export type PlacementItem = {
  id: string;
  word: string;
  band: Band;
  topic: string;
  kind: QuestionKind;
  prompt: string;
  options: string[]; // 4 options
  correctIndex: number;
  meta?: { example?: string };
};

export type PlacementAnswer = {
  itemId: string;
  correct: boolean;
  chosen?: string;
  timestamp: Date;
};

export type PlacementSession = {
  id: string;
  asked: string[];
  answers: PlacementAnswer[];
  ability: number; // -1=A2, 0=B1, 1=B2, 2=C1
};

// Map level.id to CEFR band
// We refine band based on level and set index for Beginner: early sets as A1
const levelSetToBand = (levelId: string, setIndex: number): Band => {
  if (levelId === 'beginner') {
    // Treat the first 5 beginner sets as A1, rest as A2
    return setIndex < 5 ? 'A1' : 'A2';
  }
  if (levelId === 'intermediate' || levelId === 'upper-intermediate') return 'B1';
  if (levelId === 'advanced') return 'B2';
  return 'C1';
};

const bandToIndex = (b: Band): number => ({ A1: -2, A2: -1, B1: 0, B2: 1, C1: 2 }[b]);
const indexToBand = (i: number): Band => (i <= -2 ? 'A1' : i <= -1 ? 'A2' : i <= 0 ? 'B1' : i === 1 ? 'B2' : 'C1');

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

// Simple antonym seed map for common words in the sets
const ANTONYM_MAP: Record<string, string> = {
  'wake up': 'sleep',
  sleep: 'wake up',
  hungry: 'full',
  hot: 'cold',
  cold: 'hot',
  happy: 'sad',
  friend: 'enemy',
  buy: 'sell',
  open: 'close',
  start: 'stop',
  teacher: 'student',
  help: 'harm',
  easy: 'hard',
  hard: 'easy',
};

function deriveForms(base: string): string[] {
  const w = base.trim();
  const out = new Set<string>();
  out.add(w);
  // basic verb-ish transforms
  if (/y$/.test(w) && !/[aeiou]y$/.test(w)) {
    out.add(w.replace(/y$/, 'ies')); // studies
    out.add(w.replace(/y$/, 'ied')); // studied
  } else if (/e$/.test(w)) {
    out.add(w + 's'); // likes
    out.add(w.replace(/e$/, 'ing')); // liking
    out.add(w + 'd'); // liked
  } else {
    out.add(w + 's');
    out.add(w + 'ing');
    out.add(w + 'ed');
  }
  return Array.from(out).slice(0, 4);
}

export function buildBank(): PlacementItem[] {
  const pool: Array<{ word: string; definition: string; synonyms: string[]; example?: string; band: Band; topic: string }>
    = [];
  levels.forEach((lvl) => {
    (lvl.sets || []).forEach((set, setIdx) => {
      const band = levelSetToBand(lvl.id, Number(setIdx));
      const topic = set.title || lvl.name;
      (set.words || []).forEach((w) => {
        if (!w.word || !w.definition) return;
        const syns = Array.isArray((w as any).synonyms) ? (w as any).synonyms as string[] : [];
        pool.push({ word: w.word, definition: w.definition, synonyms: syns, example: (w as any).example, band, topic });
      });
    });
  });
  // Create items with distractors from different words
  const items: PlacementItem[] = pool.map((entry, idx) => {
    // Randomly pick a kind that we can actually build
    const availableKinds: QuestionKind[] = ['definition'];
    if (ANTONYM_MAP[entry.word.toLowerCase()]) availableKinds.push('antonym');
    if ((entry.synonyms || []).length > 0) availableKinds.push('synonym');
    const kind = availableKinds[Math.floor(Math.random() * availableKinds.length)];

    // Definition MCQ
    if (kind === 'definition') {
      const detectPos = (def: string): 'verb'|'noun'|'adj'|'other' => {
        const s = def.trim().toLowerCase();
        if (s.startsWith('to ')) return 'verb';
        if (s.startsWith('a ') || s.startsWith('an ')) return 'noun';
        return 'adj';
      };
      const targetPos = detectPos(entry.definition);
      const targetLen = entry.definition.trim().split(/\s+/).length;
      const candidates = pool.filter((p) => p.word !== entry.word);
      const ranked = candidates
        .map((p) => ({ p, pos: detectPos(p.definition), len: p.definition.trim().split(/\s+/).length }))
        .filter((x) => x.pos === targetPos)
        .map((x) => ({ p: x.p, score: Math.abs(x.len - targetLen) + Math.random() * 0.3 }))
        .sort((a, b) => a.score - b.score)
        .map((x) => x.p)
        .slice(0, 12);
      const fallback = shuffle(pool.filter((p)=>p.word!==entry.word)).slice(0, 12);
      const source = ranked.length >= 3 ? ranked : fallback;
      const distractorDefs = shuffle(source)
        .filter((o) => o.definition.toLowerCase() !== entry.definition.toLowerCase())
        .slice(0, 3)
        .map((o) => o.definition);
      const options = shuffle([entry.definition, ...distractorDefs]);
      const correctIndex = options.findIndex((o) => o.toLowerCase() === entry.definition.toLowerCase());
      return {
        id: `pl-${idx}-${entry.word}-def`,
        word: entry.word,
        band: entry.band,
        topic: entry.topic,
        kind,
        prompt: 'Which definition best matches the word?',
        options,
        correctIndex: Math.max(0, correctIndex),
        meta: entry.example ? { example: entry.example } : undefined,
      };
    }

    // Antonym MCQ (word -> choose antonym)
    if (kind === 'antonym') {
      const answer = ANTONYM_MAP[entry.word.toLowerCase()];
      const others = shuffle(pool.filter((p) => p.word.toLowerCase() !== entry.word.toLowerCase() && p.word.toLowerCase() !== answer.toLowerCase())).slice(0, 8);
      const distractors = shuffle(others.map((o) => o.word)).slice(0, 3);
      const options = shuffle([answer, ...distractors]);
      const correctIndex = options.findIndex((o) => o.toLowerCase() === answer.toLowerCase());
      return {
        id: `pl-${idx}-${entry.word}-ant`,
        word: entry.word,
        band: entry.band,
        topic: entry.topic,
        kind,
        prompt: 'Choose the antonym (opposite meaning)',
        options,
        correctIndex: Math.max(0, correctIndex),
        meta: entry.example ? { example: entry.example } : undefined,
      };
    }

    // Synonym MCQ (word -> choose a synonym)
    const syn = (entry.synonyms || []).filter(Boolean);
    if (kind === 'synonym' && syn.length > 0) {
      const correct = syn[0];
      const otherSyns = shuffle(
        pool
          .flatMap((p) => p.synonyms || [])
          .filter((s) => s.toLowerCase() !== correct.toLowerCase())
      ).slice(0, 8);
      const distractors = shuffle(otherSyns).slice(0, 3);
      const options = shuffle([correct, ...distractors]);
      const correctIndex = Math.max(0, options.findIndex((o) => o.toLowerCase() === correct.toLowerCase()));
      return {
        id: `pl-${idx}-${entry.word}-syn`,
        word: entry.word,
        band: entry.band,
        topic: entry.topic,
        kind: 'synonym',
        prompt: 'Choose the closest synonym',
        options,
        correctIndex,
        meta: entry.example ? { example: entry.example } : undefined,
      };
    }

    // Default fallback to definition kind
    const others = shuffle(pool.filter((p) => p.word !== entry.word)).slice(0, 8);
    const distractors = shuffle(others.map((o) => o.definition)).slice(0, 3);
    const options = shuffle([entry.definition, ...distractors]);
    const correctIndex = options.findIndex((o) => o.toLowerCase() === entry.definition.toLowerCase());
    return {
      id: `pl-${idx}-${entry.word}-def`,
      word: entry.word,
      band: entry.band,
      topic: entry.topic,
      kind: 'definition',
      prompt: 'Which definition best matches the word?',
      options,
      correctIndex: Math.max(0, correctIndex),
      meta: entry.example ? { example: entry.example } : undefined,
    };
  });
  return items;
}

export function startSession(): PlacementSession {
  return {
    id: `session_${Date.now()}`,
    asked: [],
    answers: [],
    ability: 0, // start at B1
  };
}

export function pickNextItem(bank: PlacementItem[], session: PlacementSession, forceBand?: Band): PlacementItem | null {
  // Prefer items close to desired band (forced) or ability band and not asked yet
  const desiredBand = forceBand || indexToBand(Math.max(-2, Math.min(2, session.ability)));
  const unasked = bank.filter((i) => !session.asked.includes(i.id));
  if (!unasked.length) return null;
  // Filter by desired band first; if empty, allow nearby bands
  let candidates = unasked.filter((i) => i.band === desiredBand);
  if (!candidates.length) {
    candidates = unasked.filter((i) => Math.abs(bandToIndex(i.band) - bandToIndex(desiredBand)) <= 1);
  }
  const ranked = (candidates.length ? candidates : unasked)
    .map((i) => ({ i, d: Math.abs(bandToIndex(i.band) - (forceBand ? bandToIndex(forceBand) : session.ability)) + Math.random() * 0.1 }))
    .sort((a, b) => a.d - b.d)
    .map((x) => x.i);
  return ranked[0] || null;
}

export function updateAbility(session: PlacementSession, item: PlacementItem, correct: boolean) {
  // Simple step logic for MVP: move ability toward/away from item band
  const target = bandToIndex(item.band);
  const delta = correct ? Math.sign(target - session.ability) || 1 : -1;
  session.ability = Math.max(-1, Math.min(2, session.ability + delta));
}

export function recommendedLevelFromAbility(ability: number): string {
  const band = indexToBand(ability);
  if (band === 'A1' || band === 'A2') return 'beginner';
  if (band === 'B1') return 'intermediate';
  if (band === 'B2') return 'advanced';
  return 'advanced';
}

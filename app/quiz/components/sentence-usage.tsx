import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
  AccessibilityInfo,
  ViewStyle,
  TextStyle,
} from 'react-native';
import { Vibration } from 'react-native';
import { analyticsService } from '../../../services/AnalyticsService';
import { levels } from '../data/levels';
import AnimatedNextButton from './AnimatedNextButton';

const ACCENT_COLOR = '#F2935C';
const CORRECT_COLOR = '#437F76';
const INCORRECT_COLOR = '#924646';

interface SentenceUsageProps {
  setId: string;
  levelId: string;
  onPhaseComplete: (score: number, totalQuestions: number) => void;
  sharedScore: number;
  onScoreShare: (score: number) => void;
  wordRange?: { start: number; end: number };
}

interface UsageSentence {
  text: string;
  isCorrect: boolean;
}

interface UsageItem {
  id: string;
  word: string;
  ipa: string;
  sentences: UsageSentence[]; // For word-choice mode this holds word options
  prompt?: string; // When in word-choice mode, this is the sentence with a blank
  mode?: 'sentence' | 'word';
}

// Provide topic-aware distractor word pools for the word-choice Usage mode
function getWordChoicePools(setTitle: string) {
  const t = (setTitle || '').toLowerCase();

  // Intermediate Set 1: Personal Growth & Achievement
  if (t.includes('personal') || t.includes('growth') || t.includes('achievement')) {
    return {
      related: {
        verb: ['practice', 'persevere', 'achieve', 'improve', 'advance', 'develop', 'overcome', 'persist', 'strive', 'learn'],
        noun: ['goal', 'habit', 'effort', 'milestone', 'motivation', 'progress', 'growth', 'skill', 'success', 'plan'],
        adjective: ['motivated', 'resilient', 'diligent', 'consistent']
      },
      unrelated: {
        // Topic-adjacent but semantically different (still same POS)
        verb: ['organize', 'schedule', 'document', 'review', 'measure', 'coordinate', 'plan'],
        noun: ['schedule', 'deadline', 'meeting', 'report', 'policy', 'budget', 'routine', 'strategy', 'method', 'survey'],
        adjective: ['formal', 'strategic', 'ethical', 'measurable']
      }
    };
  }

  // Fallback generic pools
  return {
    related: {
      verb: ['compare', 'consider', 'describe', 'explain'],
      noun: ['context', 'topic', 'subject', 'concept', 'theme'],
      adjective: ['general', 'specific', 'common', 'typical']
    },
    unrelated: {
      verb: ['swim', 'bark', 'dig', 'sweep'],
      noun: ['airplane', 'lettuce', 'volcano', 'microscope', 'receipt'],
      adjective: ['spicy', 'metallic', 'dusty', 'bright']
    }
  };
}

function detectPartOfSpeech(word: string, definition: string, synonyms?: string[]): 'verb' | 'noun' | 'adjective' {
  const def = (definition || '').trim().toLowerCase();
  if (def.startsWith('to ')) return 'verb';
  const w = (word || '').toLowerCase();
  if (/tion$|ment$|ness$|ity$|ance$|ence$|ship$|hood$|ism$|ing$/.test(w)) return 'noun';
  if (/ful$|less$|ous$|ive$|al$|ic$|able$|ible$|ary$|ant$|ent$|y$/.test(w)) return 'adjective';
  // Heuristic via synonyms: if any synonym starts with 'to ', mark verb
  if ((synonyms || []).some(s => s.toLowerCase().startsWith('to '))) return 'verb';
  return 'noun';
}

// Exact Usage overrides (word-choice) per level/set/word
// Use when content owners specify the exact prompt and options
const USAGE_WORD_OVERRIDES: Record<string, Record<string, Record<string, { prompt: string; options: string[]; correct: string }>>> = {
  'upper-intermediate': {
    '4': {
      borrow: {
        prompt: 'You can … my umbrella if the rain starts again.',
        options: ['borrow', 'lend', 'explain', 'arrange'],
        correct: 'borrow',
      },
      lend: {
        prompt: 'Could you … me your charger for a few minutes?',
        options: ['lend', 'borrow', 'arrange', 'compare'],
        correct: 'lend',
      },
      compare: {
        prompt: 'We should … prices online before ordering new headphones.',
        options: ['compare', 'borrow', 'arrange', 'lend'],
        correct: 'compare',
      },
      explain: {
        prompt: 'Can you … how this app saves data securely?',
        options: ['explain', 'arrange', 'lend', 'compare'],
        correct: 'explain',
      },
      arrange: {
        prompt: "Let's … a call tomorrow to finalize the travel itinerary.",
        options: ['arrange', 'borrow', 'lend', 'explain'],
        correct: 'arrange',
      },
    },
    '5': {
      mitigate: {
        prompt: 'New safety guidelines aim to … risks during maintenance work.',
        options: ['mitigate', 'allocate', 'justify', 'implement'],
        correct: 'mitigate',
      },
      allocate: {
        prompt: 'The manager will … funds to departments after reviewing proposals.',
        options: ['allocate', 'implement', 'mitigate', 'justify'],
        correct: 'allocate',
      },
      justify: {
        prompt: 'You must … these costs before the auditor signs off.',
        options: ['justify', 'allocate', 'implement', 'mitigate'],
        correct: 'justify',
      },
      compromise: {
        prompt: 'After hours of debate, both sides agreed to … on payment.',
        options: ['compromise', 'allocate', 'implement', 'justify'],
        correct: 'compromise',
      },
      implement: {
        prompt: 'The city plans to … the new parking rules next month.',
        options: ['implement', 'justify', 'mitigate', 'allocate'],
        correct: 'implement',
      },
    },
    '6': {
      assess: {
        prompt: 'We need to … the proposal before allocating any funds.',
        options: ['assess', 'interpret', 'infer', 'reconcile'],
        correct: 'assess',
      },
      interpret: {
        prompt: 'Please … the results carefully before writing your discussion.',
        options: ['interpret', 'assess', 'infer', 'articulate'],
        correct: 'interpret',
      },
      infer: {
        prompt: 'From these data, we can … which factor mattered most.',
        options: ['infer', 'assess', 'interpret', 'reconcile'],
        correct: 'infer',
      },
      articulate: {
        prompt: 'Good presenters … their argument so listeners follow every step.',
        options: ['articulate', 'infer', 'assess', 'reconcile'],
        correct: 'articulate',
      },
      reconcile: {
        prompt: 'The committee met to … budget conflicts between departments.',
        options: ['reconcile', 'assess', 'articulate', 'interpret'],
        correct: 'reconcile',
      },
    },
    '7': {
      scrutinize: {
        prompt: 'The auditor will … each invoice before authorizing payment.',
        options: ['scrutinize', 'advocate', 'synthesize', 'undermine'],
        correct: 'scrutinize',
      },
      advocate: {
        prompt: 'Several organizations … immediate funding for community health programs.',
        options: ['advocate', 'scrutinize', 'synthesize', 'adhere'],
        correct: 'advocate',
      },
      synthesize: {
        prompt: 'The literature review must … findings from multiple reliable sources.',
        options: ['synthesize', 'advocate', 'undermine', 'adhere'],
        correct: 'synthesize',
      },
      undermine: {
        prompt: 'Public rumors may … confidence in the project’s leadership.',
        options: ['undermine', 'synthesize', 'adhere', 'advocate'],
        correct: 'undermine',
      },
      adhere: {
        prompt: 'All volunteers must … to safety rules during events.',
        options: ['adhere', 'advocate', 'scrutinize', 'undermine'],
        correct: 'adhere',
      },
    },
    '8': {
      assert: {
        prompt: 'The spokesperson chose to … that the decision was lawful.',
        options: ['assert', 'concede', 'imply', 'refute'],
        correct: 'assert',
      },
      concede: {
        prompt: 'Facing clear evidence, they finally … errors in the original report.',
        options: ['concede', 'assert', 'refute', 'outline'],
        correct: 'concede',
      },
      imply: {
        prompt: 'The review seems to … that the study’s sample was too small.',
        options: ['imply', 'assert', 'refute', 'outline'],
        correct: 'imply',
      },
      refute: {
        prompt: 'Independent tests could … the company’s claims about battery performance.',
        options: ['refute', 'assert', 'concede', 'imply'],
        correct: 'refute',
      },
      outline: {
        prompt: 'Before writing details, … the structure to guide your argument.',
        options: ['outline', 'assert', 'imply', 'refute'],
        correct: 'outline',
      },
    },
    '9': {
      contrast: {
        prompt: 'The report will … last year’s results with regional averages.',
        options: ['contrast', 'corroborate', 'hypothesize', 'constrain'],
        correct: 'contrast',
      },
      corroborate: {
        prompt: 'Lab tests should … the early results before publication.',
        options: ['corroborate', 'contrast', 'hypothesize', 'deviate'],
        correct: 'corroborate',
      },
      hypothesize: {
        prompt: 'Based on prior studies, we … a moderate improvement in outcomes.',
        options: ['hypothesize', 'corroborate', 'constrain', 'deviate'],
        correct: 'hypothesize',
      },
      constrain: {
        prompt: 'Resource shortages will … our timeline unless funding arrives soon.',
        options: ['constrain', 'hypothesize', 'deviate', 'contrast'],
        correct: 'constrain',
      },
      deviate: {
        prompt: 'If traffic worsens, we may … from our usual route.',
        options: ['deviate', 'contrast', 'constrain', 'corroborate'],
        correct: 'deviate',
      },
      },
    '10': {
      correlate: {
        prompt: 'The study aims to … sleep length with attention scores.',
        options: ['correlate', 'validate', 'compile', 'benchmark'],
        correct: 'correlate',
      },
      validate: {
        prompt: 'A second dataset can … the trend observed in small samples.',
        options: ['validate', 'correlate', 'benchmark', 'compile'],
        correct: 'validate',
      },
      compile: {
        prompt: 'The assistant will … sources into a single annotated bibliography.',
        options: ['compile', 'elucidate', 'validate', 'benchmark'],
        correct: 'compile',
      },
      elucidate: {
        prompt: 'Clear headings help … the logic behind your argument.',
        options: ['elucidate', 'compile', 'correlate', 'validate'],
        correct: 'elucidate',
      },
      benchmark: {
        prompt: 'We should … our results against last year’s top performers.',
        options: ['benchmark', 'validate', 'correlate', 'compile'],
        correct: 'benchmark',
      },
      },
    '11': {
      prioritize: {
        prompt: 'Given limited time, we should … the onboarding tasks first.',
        options: ['prioritize', 'negotiate', 'revise', 'forecast', 'coordinate'],
        correct: 'prioritize',
      },
      negotiate: {
        prompt: 'After reviewing the contract, we’ll … delivery dates with the supplier.',
        options: ['negotiate', 'prioritize', 'revise', 'forecast', 'coordinate'],
        correct: 'negotiate',
      },
      revise: {
        prompt: 'The editor asked us to … the abstract for precision.',
        options: ['revise', 'prioritize', 'negotiate', 'forecast', 'coordinate'],
        correct: 'revise',
      },
      forecast: {
        prompt: 'Using last year’s trends, we can … sales for winter.',
        options: ['forecast', 'prioritize', 'revise', 'negotiate', 'coordinate'],
        correct: 'forecast',
      },
      coordinate: {
        prompt: 'Someone must … volunteers so setup and cleanup finish on time.',
        options: ['coordinate', 'revise', 'negotiate', 'forecast', 'prioritize'],
        correct: 'coordinate',
      },
      },
    '12': {
      enforce: {
        prompt: 'Inspectors … safety rules during construction to prevent avoidable accidents.',
        options: ['enforce', 'comply', 'amend', 'disclose'],
        correct: 'enforce',
      },
      comply: {
        prompt: 'All suppliers must … with updated packaging standards this year.',
        options: ['comply', 'enforce', 'violate', 'disclose'],
        correct: 'comply',
      },
      violate: {
        prompt: 'Posting private data may … privacy laws in several countries.',
        options: ['violate', 'comply', 'amend', 'enforce'],
        correct: 'violate',
      },
      amend: {
        prompt: 'Lawmakers … the bill to include stronger environmental protections.',
        options: ['amend', 'disclose', 'enforce', 'comply'],
        correct: 'amend',
      },
      disclose: {
        prompt: 'Companies must … risks to investors before offering new shares.',
        options: ['disclose', 'amend', 'enforce', 'violate'],
        correct: 'disclose',
      },
      },
    '13': {
      curtail: {
        prompt: 'New policies aim to … spending without harming essential public services.',
        options: ['curtail', 'amplify', 'commence', 'conclude'],
        correct: 'curtail',
      },
      amplify: {
        prompt: 'Developers used caching to … performance during peak traffic hours.',
        options: ['amplify', 'curtail', 'rectify', 'conclude'],
        correct: 'amplify',
      },
      rectify: {
        prompt: 'Please … the figures before sending the quarterly report to clients.',
        options: ['rectify', 'commence', 'conclude', 'amplify'],
        correct: 'rectify',
      },
      commence: {
        prompt: 'Work will … at sunrise, when the site becomes safely accessible.',
        options: ['commence', 'conclude', 'curtail', 'rectify'],
        correct: 'commence',
      },
      conclude: {
        prompt: 'After weighing the evidence, the committee will … by midday.',
        options: ['conclude', 'commence', 'amplify', 'curtail'],
        correct: 'conclude',
      },
    },
  },
};

const ITEMS: UsageItem[] = [
  {
    id: 'wake-up',
    word: 'wake up',
    ipa: '/weɪk ʌp/',
    sentences: [
      { text: 'I … at seven o clock every morning.', isCorrect: true },
      { text: 'I … to school by bus every day.', isCorrect: false },
      { text: 'I … my homework after dinner today.', isCorrect: false },
      { text: 'I … breakfast with my family now.', isCorrect: false },
    ],
  },
  {
    id: 'eat',
    word: 'eat',
    ipa: '/iːt/',
    sentences: [
      { text: 'They … breakfast together every morning.', isCorrect: true },
      { text: 'They … their homework at the library.', isCorrect: false },
      { text: 'They … the violin before school today.', isCorrect: false },
      { text: 'They … television after work every day.', isCorrect: false },
    ],
  },
  {
    id: 'study',
    word: 'study',
    ipa: '/ˈstʌdi/',
    sentences: [
      { text: 'She likes to … English in the evening.', isCorrect: true },
      { text: 'She likes to … movies on weekends.', isCorrect: false },
      { text: 'She likes to … dinner with friends.', isCorrect: false },
      { text: 'She likes to … basketball after class.', isCorrect: false },
    ],
  },
  {
    id: 'exercise',
    word: 'exercise',
    ipa: '/ˈeksərsaɪz/',
    sentences: [
      { text: 'He goes to the gym to … regularly.', isCorrect: true },
      { text: 'He goes to the gym to … television.', isCorrect: false },
      { text: 'He goes to the gym to … breakfast.', isCorrect: false },
      { text: 'He goes to the gym to … friends.', isCorrect: false },
    ],
  },
  {
    id: 'sleep',
    word: 'sleep',
    ipa: '/sliːp/',
    sentences: [
      { text: 'Children need to … for many hours daily.', isCorrect: true },
      { text: 'Children need to … outside with their toys.', isCorrect: false },
      { text: 'Children need to … healthy food every day.', isCorrect: false },
      { text: 'Children need to … warm clothes in winter.', isCorrect: false },
    ],
  },
  {
    id: 'home',
    word: 'home',
    ipa: '/hoʊm/',
    sentences: [
      { text: 'I go to my … after school every day.', isCorrect: true },
      { text: 'I go to my … when I want to buy food.', isCorrect: false },
      { text: 'I go to my … to learn English and math.', isCorrect: false },
      { text: 'I go to my … to play with other children.', isCorrect: false },
    ],
  },
  {
    id: 'food',
    word: 'food',
    ipa: '/fuːd/',
    sentences: [
      { text: 'We eat healthy … at breakfast and dinner.', isCorrect: true },
      { text: 'We eat healthy … when we play outside.', isCorrect: false },
      { text: 'We eat healthy … to watch TV together.', isCorrect: false },
      { text: 'We eat healthy … when we sleep at night.', isCorrect: false },
    ],
  },
  {
    id: 'brother',
    word: 'brother',
    ipa: '/ˈbrʌðər/',
    sentences: [
      { text: 'My little … and I play games together.', isCorrect: true },
      { text: 'My little … and I eat lunch at school.', isCorrect: false },
      { text: 'My little … and I go to bed early.', isCorrect: false },
      { text: 'My little … and I watch TV after dinner.', isCorrect: false },
    ],
  },
  {
    id: 'family',
    word: 'family',
    ipa: '/ˈfæməli/',
    sentences: [
      { text: 'I love my … and we eat together daily.', isCorrect: true },
      { text: 'I love my … when I go to the store.', isCorrect: false },
      { text: 'I love my … to finish my homework today.', isCorrect: false },
      { text: 'I love my … at the park with my dog.', isCorrect: false },
    ],
  },
  {
    id: 'friend',
    word: 'friend',
    ipa: '/frend/',
    sentences: [
      { text: 'My best … and I walk to school together.', isCorrect: true },
      { text: 'My best … and I eat breakfast at home.', isCorrect: false },
      { text: 'My best … and I sleep for eight hours.', isCorrect: false },
      { text: 'My best … and I do homework every night.', isCorrect: false },
    ],
  },
];

interface OptionRow {
  text: string;
  isCorrect: boolean;
  key: string;
}

export default function SentenceUsageComponent({ setId, levelId, onPhaseComplete, sharedScore, onScoreShare, wordRange }: SentenceUsageProps) {
  // Decide mode: default sentence selection; for new Intermediate Set 1 use word-choice
  const wordChoiceMode = useMemo(() => {
    const lvl = levels.find(l => l.id === levelId);
    const st = lvl?.sets.find(s => s.id.toString() === setId);
    if (!lvl || !st) return false;
    const isIntermediateSet1 = lvl.id === 'intermediate' && String(st.id) === '1';
    const matchesTitle = typeof st.title === 'string' && /personal|growth|achievement/i.test(st.title);
    const isUpperIntermediateSet1 = lvl.id === 'upper-intermediate' && String(st.id) === '1';
    const hasWordOverrides = !!USAGE_WORD_OVERRIDES[levelId || '']?.[String(st.id)];
    return isIntermediateSet1 || matchesTitle || isUpperIntermediateSet1 || hasWordOverrides;
  }, [levelId, setId]);
  // Get words from levels data
  const itemsData = useMemo(() => {
    const level = levels.find(l => l.id === levelId);
    if (!level) return [];
    const set = level.sets.find(s => s.id.toString() === setId);
    if (!set || !set.words) return [];
    
    let words = set.words;
    if (wordRange) {
      words = words.slice(wordRange.start, wordRange.end);
    }

    // Helper to blank out the target word in a sentence
    const blankOutWord = (sentence: string, targetWord: string): string => {
      const s = sentence.trim();
      if (!s) return '…';
      
      // Try to find and replace the exact target word (case-insensitive)
      const regex = new RegExp(`\\b${targetWord.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'i');
      if (regex.test(s)) {
        return s.replace(regex, '…');
      }
      
      // If word not found exactly, try finding any form of it in the middle
      const tokens = s.match(/[A-Za-z'']+/g) || [];
      const targetLower = targetWord.toLowerCase();
      let foundIdx = tokens.findIndex(t => t.toLowerCase().includes(targetLower) || targetLower.includes(t.toLowerCase()));
      
      if (foundIdx === -1) {
        // Default to middle word
        foundIdx = Math.floor(tokens.length / 2);
      }
      
      // Replace the found token
      const tokenToReplace = tokens[foundIdx];
      const idx = s.indexOf(tokenToReplace);
      if (idx !== -1) {
        return s.slice(0, idx) + '…' + s.slice(idx + tokenToReplace.length);
      }
      
      return '…';
    };

    // Build items based on mode
    return words.map((w, wordIdx) => {
      if (wordChoiceMode) {
        // Word-choice mode: show a sentence with blank, options are words
        // Check for exact overrides first
        const level = levels.find(l => l.id === levelId);
        const set = level?.sets.find(s => s.id.toString() === setId);
        const ov = USAGE_WORD_OVERRIDES[levelId || '']?.[String(set?.id || '')]?.[w.word.toLowerCase()];
        const prompt = ov?.prompt || blankOutWord(w.example, w.word);
        const setTitle = set?.title ?? '';
        const pools = getWordChoicePools(setTitle);
        const pos = detectPartOfSpeech(w.word, w.definition, w.synonyms);
        const setWordsLower = new Set(words.map(sw => sw.word.toLowerCase()));

        // Build balance: two topic-related (same POS) + one unrelated (same POS)
        const relatedPool = (pools.related as any)[pos] as string[];
        const unrelatedPool = (pools.unrelated as any)[pos] as string[];

        const relatedCandidates = relatedPool.filter(r => !setWordsLower.has(r.toLowerCase()) && r.toLowerCase() !== w.word.toLowerCase());
        const unrelatedCandidates = unrelatedPool.filter(u => !setWordsLower.has(u.toLowerCase()));

        const pickRandom = <T,>(arr: T[], count: number): T[] => {
          return [...arr]
            .map(v => ({ v, s: Math.random() }))
            .sort((a, b) => a.s - b.s)
            .slice(0, count)
            .map(x => x.v);
        };

        const relatedDistractors = pickRandom(relatedCandidates, 2);
        const unrelatedDistractors = pickRandom(unrelatedCandidates, 1);
        const distractorWords: string[] = [...relatedDistractors, ...unrelatedDistractors];

        // Fallbacks to guarantee 3 options
        const GENERIC_RELATED = pos === 'verb' ? ['practice', 'strive', 'learn', 'improve'] : pos === 'adjective' ? ['motivated', 'resilient', 'diligent'] : ['goal', 'effort', 'milestone', 'plan'];
        const GENERIC_UNRELATED = pos === 'verb' ? ['sail', 'paint', 'bake'] : pos === 'adjective' ? ['salty', 'wooden', 'noisy'] : ['receipt', 'keyboard', 'airport'];
        while (distractorWords.length < 2) {
          const cand = pickRandom(
            GENERIC_RELATED.filter(r => r.toLowerCase() !== w.word.toLowerCase()),
            1
          )[0];
          if (cand && !distractorWords.includes(cand)) distractorWords.push(cand);
        }
        while (distractorWords.length < 3) {
          const cand = pickRandom(GENERIC_UNRELATED, 1)[0];
          if (cand && !distractorWords.includes(cand)) distractorWords.push(cand);
        }

        let sentences: UsageSentence[];
        if (ov?.options?.length === 4) {
          sentences = ov.options.map(opt => ({ text: opt, isCorrect: opt === ov.correct }));
        } else {
          sentences = [
            { text: w.word, isCorrect: true },
            { text: distractorWords[0] || 'avoid', isCorrect: false },
            { text: distractorWords[1] || 'improve', isCorrect: false },
            { text: distractorWords[2] || 'complain', isCorrect: false },
          ];
        }

        return {
          id: w.word,
          word: w.word,
          ipa: w.phonetic,
          sentences,
          prompt,
          mode: 'word',
        } as UsageItem;
      }

      // Default sentence-selection mode
      const correct = blankOutWord(w.example, w.word);
      const otherWords = words.filter((_, idx) => idx !== wordIdx);
      const distractors: string[] = [];
      const shuffled = otherWords
        .map(ow => ({ word: ow, sort: Math.random() }))
        .sort((a, b) => a.sort - b.sort)
        .map(x => x.word);
      for (const ow of shuffled) {
        if (distractors.length >= 3) break;
        const blanked = blankOutWord(ow.example, ow.word);
        if (blanked !== correct && !distractors.includes(blanked)) {
          distractors.push(blanked);
        }
      }
      if (distractors.length < 3) {
        const matchingItem = ITEMS.find(item => item.word.toLowerCase() === w.word.toLowerCase());
        if (matchingItem) {
          const fallbacks = matchingItem.sentences
            .filter(s => !s.isCorrect)
            .map(s => s.text);
          for (const fb of fallbacks) {
            if (distractors.length >= 3) break;
            if (fb !== correct && !distractors.includes(fb)) {
              distractors.push(fb);
            }
          }
        }
      }
      const GENERIC_FALLBACK = [
        'The … was very important yesterday.',
        'Everyone knows that … is essential.',
        'We should consider the … carefully.',
      ];
      for (let i = 0; distractors.length < 3 && i < GENERIC_FALLBACK.length; i++) {
        if (!distractors.includes(GENERIC_FALLBACK[i])) {
          distractors.push(GENERIC_FALLBACK[i]);
        }
      }
      const sentences: UsageSentence[] = [
        { text: correct, isCorrect: true },
        { text: distractors[0], isCorrect: false },
        { text: distractors[1], isCorrect: false },
        { text: distractors[2], isCorrect: false },
      ];
      return {
        id: w.word,
        word: w.word,
        ipa: w.phonetic,
        sentences,
        mode: 'sentence',
      } as UsageItem;
    });
  }, [setId, levelId, wordRange, wordChoiceMode]);

  const [index, setIndex] = useState(0);
  const [options, setOptions] = useState<OptionRow[]>([]);
  const [selected, setSelected] = useState<number | null>(null);
  const [revealed, setRevealed] = useState(false);
  const [correctCount, setCorrectCount] = useState(0);
  const [displayScore, setDisplayScore] = useState(sharedScore);
  const pendingScoreRef = useRef<number | null>(null);
  const deductionAnim = useRef(new Animated.Value(0)).current;
  const itemStartRef = useRef<number>(Date.now());

  const item = useMemo(() => itemsData[index], [itemsData, index]);

  useEffect(() => {
    const shuffled = item.sentences
      .map(sentence => ({ ...sentence, key: `${item.id}-${sentence.text}` }))
      .map(sentence => ({ ...sentence, sort: Math.random() }))
      .sort((a, b) => a.sort - b.sort)
      .map(({ sort, ...rest }) => rest);

    setOptions(shuffled);
    setSelected(null);
    setRevealed(false);
    itemStartRef.current = Date.now();
  }, [item]);

  useEffect(() => {
    setDisplayScore(sharedScore);
  }, [sharedScore]);

  useEffect(() => {
    if (pendingScoreRef.current !== null && pendingScoreRef.current !== sharedScore) {
      const next = pendingScoreRef.current;
      pendingScoreRef.current = null;
      onScoreShare(next);
    }
  }, [displayScore, onScoreShare, sharedScore]);

  const progress = index / itemsData.length;

  const handleSelect = (idx: number) => {
    if (revealed) return;
    setSelected(idx);
  };

  const handleSubmit = () => {
    if (selected === null || revealed) return;

    Vibration.vibrate(10);

    const chosen = options[selected];
    if (chosen.isCorrect) {
      setCorrectCount(prev => prev + 1);
      AccessibilityInfo.announceForAccessibility('Correct');
    } else {
      const correctSentence = options.find(o => o.isCorrect)?.text ?? '';
      AccessibilityInfo.announceForAccessibility(`Incorrect. Correct sentence is ${correctSentence}`);
      setDisplayScore(prev => {
        const next = Math.max(0, prev - 5);
        pendingScoreRef.current = next;
        return next;
      });
      triggerDeductionAnimation();
    }

    setRevealed(true);

    // Track analytics for this item
    try {
      const timeSpent = Math.max(0, Math.round((Date.now() - itemStartRef.current) / 1000));
      analyticsService.recordResult({
        wordId: item.word,
        exerciseType: 'usage',
        correct: chosen.isCorrect,
        timeSpent,
        timestamp: new Date(),
        score: chosen.isCorrect ? 1 : 0,
      });
    } catch {}
  };

  const handleNext = () => {
    if (!revealed) return;

    if (index === itemsData.length - 1) {
      onPhaseComplete(correctCount, itemsData.length);
    } else {
      setIndex(prev => prev + 1);
      itemStartRef.current = Date.now();
    }
  };

  const triggerDeductionAnimation = () => {
    deductionAnim.stopAnimation();
    deductionAnim.setValue(0);
    Animated.timing(deductionAnim, {
      toValue: 1,
      duration: 700,
      useNativeDriver: true,
    }).start();
  };

  const deductionOpacity = deductionAnim.interpolate({
    inputRange: [0, 0.2, 1],
    outputRange: [0, 1, 0],
  });
  const deductionTranslateY = deductionAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, -35],
  });

  return (
    <View style={styles.container}>
      <View style={styles.progressContainer}>
        <Text style={styles.progressText}>Word {index + 1} of {itemsData.length}</Text>
        <View style={styles.scoreWrapper}>
          <Animated.Text
            style={[
              styles.deductionText,
              {
                opacity: deductionOpacity,
                transform: [{ translateY: deductionTranslateY }],
              },
            ]}
          >
            -5
          </Animated.Text>
          <Text style={styles.scoreText}>{displayScore}</Text>
        </View>
      </View>
      <View style={styles.progressBar}>
        <View style={[styles.progressFill, { width: `${progress * 100}%` }]} />
      </View>

      <Text style={styles.headerText}>Natural Usage</Text>
      <Text style={styles.subHeaderText}>
        {item.mode === 'word' ? 'Select the word that correctly completes the sentence.' : 'Pick the sentence that uses the word correctly.'}
      </Text>

      {item.mode === 'word' ? (
        <View style={styles.promptHeader}>
          <Text style={styles.promptText}>{item.prompt}</Text>
        </View>
      ) : (
      <View style={styles.wordHeader}>
        <Text style={styles.wordText}>{item.word}</Text>
        <Text style={styles.ipaText}>{item.ipa}</Text>
      </View>
      )}

      <View style={styles.optionsWrapper}>
        {options.map((option, idx) => {
          const isSelected = selected === idx;
          const isCorrect = option.isCorrect;

          const cardStyle: ViewStyle[] = [styles.optionCard];
          const textStyle: TextStyle[] = [styles.optionText];

          if (!revealed && isSelected) {
            cardStyle.push(styles.cardSelected);
          }

          if (revealed && isSelected) {
            cardStyle.push(isCorrect ? styles.cardCorrect : styles.cardIncorrect);
          }

          if (revealed && !isSelected && isCorrect && selected !== null) {
            textStyle.push(styles.correctText);
          }

          return (
            <TouchableOpacity
              key={option.key}
              style={cardStyle}
              activeOpacity={0.85}
              onPress={() => handleSelect(idx)}
              disabled={revealed}
              accessibilityRole="button"
              accessibilityState={{ selected: isSelected }}
            >
              <Text style={textStyle}>{option.text}</Text>
            </TouchableOpacity>
          );
        })}
      </View>

      <View style={styles.footer}>
        <AnimatedNextButton
          onPress={!revealed ? handleSubmit : handleNext}
          disabled={!revealed && selected === null}
          label={revealed ? 'NEXT' : 'REVEAL'}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1E1E1E',
    paddingHorizontal: 20,
    paddingVertical: 24,
  },
  progressContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  progressText: {
    fontSize: 14,
    color: '#9CA3AF',
    fontWeight: '500',
  },
  scoreWrapper: {
    alignItems: 'center',
    justifyContent: 'flex-end',
    minWidth: 48,
  },
  deductionText: {
    position: 'absolute',
    top: -20,
    fontSize: 16,
    fontWeight: '600',
    color: '#F87171',
  },
  scoreText: {
    fontSize: 16,
    fontWeight: '600',
    color: ACCENT_COLOR,
  },
  progressBar: {
    height: 6,
    backgroundColor: '#2c2f2f',
    borderRadius: 3,
    overflow: 'hidden',
    marginBottom: 24,
  },
  progressFill: {
    height: '100%',
    backgroundColor: ACCENT_COLOR,
  },
  headerText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  subHeaderText: {
    color: '#9CA3AF',
    fontSize: 14,
    marginTop: 4,
  },
  wordHeader: {
    alignItems: 'center',
    marginTop: 24,
    marginBottom: 24,
  },
  wordText: {
    fontSize: 32,
    fontWeight: '700',
    color: '#fff',
  },
  ipaText: {
    fontSize: 16,
    color: '#9CA3AF',
    fontStyle: 'italic',
  },
  optionsWrapper: {
    gap: 12,
    flexGrow: 1,
  },
  optionCard: {
    backgroundColor: '#3A3A3A',
    borderRadius: 16,
    paddingVertical: 16,
    paddingHorizontal: 16,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  cardSelected: {
    borderWidth: 2,
    borderColor: ACCENT_COLOR,
  },
  optionText: {
    color: '#fff',
    fontSize: 16,
    lineHeight: 22,
  },
  cardCorrect: {
    backgroundColor: CORRECT_COLOR,
  },
  cardIncorrect: {
    backgroundColor: INCORRECT_COLOR,
  },
  correctText: {
    color: CORRECT_COLOR,
    fontWeight: '600',
  },
  promptHeader: {
    alignItems: 'center',
    marginTop: 24,
    marginBottom: 24,
    paddingHorizontal: 8,
  },
  promptText: {
    fontSize: 18,
    color: '#fff',
    textAlign: 'center',
    lineHeight: 26,
  },
  footer: {
    marginTop: 32,
    alignItems: 'center',
  },
  primaryButton: {
    backgroundColor: ACCENT_COLOR,
    borderRadius: 20,
    paddingVertical: 18,
    paddingHorizontal: 32,
    alignItems: 'center',
    minWidth: 160,
  },
  primaryButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  disabledButton: {
    opacity: 0.5,
  },
});

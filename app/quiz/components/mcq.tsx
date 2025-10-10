import React, { useState, useEffect, useRef } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  Animated, 
  Easing,
  Dimensions 
} from 'react-native';
import { ChevronRight } from 'lucide-react-native';
import { levels } from '../data/levels';
import { analyticsService } from '../../../services/AnalyticsService';
import AnimatedNextButton from './AnimatedNextButton';

interface MCQProps {
  setId: string;
  levelId: string;
  onPhaseComplete: (score: number, totalQuestions: number) => void;
  sharedScore: number;
  onScoreShare: (newScore: number) => void;
  wordRange?: { start: number; end: number };
}

interface Question {
  word: string;
  ipa: string;
  definition: string;
  example: string;
  options: string[];
  correctAnswer: number;
  synonyms: string[];
}

const { width: SCREEN_WIDTH } = Dimensions.get('window');

const shortenPhrase = (phrase: string): string => {
  let trimmed = phrase.trim();
  if (trimmed.toLowerCase().startsWith('to ')) {
    trimmed = trimmed.slice(3);
  }

  return trimmed.charAt(0).toUpperCase() + trimmed.slice(1);
};

// Per-set MCQ overrides to use EXACT options as provided by content owners
// Format: levelId -> setId -> word -> { correct, distractors }
const MCQ_OVERRIDES: Record<string, Record<string, Record<string, { correct: string; distractors: string[] }>>> = {
  intermediate: {
    '1': {
      agenda: {
        correct: 'List of meeting topics arranged for discussion',
        distractors: [
          'Time by which work must be completed',
          'General agreement reached by most participants overall',
          'Formal document summarizing decisions and action items',
        ],
      },
      deadline: {
        correct: 'Time by which work must be completed',
        distractors: [
          'List of meeting topics arranged for discussion',
          'General agreement reached by most participants overall',
          'Planned sequence outlining all topics for discussion',
        ],
      },
      escalate: {
        correct: 'To raise an issue to higher authority',
        distractors: [
          'To make something easier to fully understand',
          'To schedule tasks according to their priority',
          'To approve proposals after reviewing all details',
        ],
      },
      consensus: {
        correct: 'General agreement reached by most participants overall',
        distractors: [
          'List of meeting topics arranged for discussion',
          'Time by which work must be completed',
          'Written record summarizing decisions and action items',
        ],
      },
      clarify: {
        correct: 'To make something easier to fully understand',
        distractors: [
          'To raise an issue to higher authority',
          'To assign responsibilities to appropriate team members',
          'To announce schedule changes during weekly meetings',
        ],
      },
    },
  },
  'upper-intermediate': {
    '1': {
      fragile: {
        correct: 'Easily broken or damaged, requiring careful handling',
        distractors: [
          'Willing to give more than necessary',
          'Unwilling and hesitant to do something',
          'Full of energy and eager to participate',
        ],
      },
      generous: {
        correct: 'Willing to give more than necessary',
        distractors: [
          'Easily broken or damaged, requiring careful handling',
          'Unwilling and hesitant to do something',
          'Displaying modesty without seeking personal recognition',
        ],
      },
      reluctant: {
        correct: 'Unwilling and hesitant to do something',
        distractors: [
          'Willing to give more than necessary',
          'Slightly wet, often uncomfortably or unexpectedly',
          'Easily broken or damaged, requiring careful handling',
        ],
      },
      damp: {
        correct: 'Slightly wet, often uncomfortably or unexpectedly',
        distractors: [
          'Very old, belonging to a distant past',
          'Easily broken or damaged, requiring careful handling',
          'Extremely cold and unpleasantly bitter outside',
        ],
      },
      ancient: {
        correct: 'Very old, belonging to a distant past',
        distractors: [
          'Slightly wet, often uncomfortably or unexpectedly',
          'Willing to give more than necessary',
          'Extending over a very long time',
        ],
      },
    },
    '2': {
      predict: {
        correct: 'To say what will happen before',
        distractors: [
          'To keep away from something unpleasant',
          'To make something better in quality',
          'To make numbers rise over time',
        ],
      },
      avoid: {
        correct: 'To keep away from something unpleasant',
        distractors: [
          'To say what will happen before',
          'To make something better in quality',
          'To accept responsibility after causing problems',
        ],
      },
      improve: {
        correct: 'To make something better in quality',
        distractors: [
          'To keep away from something unpleasant',
          'To say what will happen before',
          'To reduce errors through repeated practice',
        ],
      },
      encourage: {
        correct: 'To give support that makes someone act',
        distractors: [
          'To say you are unhappy about something',
          'To make something better in quality',
          'To decide not to change a plan',
        ],
      },
      complain: {
        correct: 'To say you are unhappy about something',
        distractors: [
          'To give support that makes someone act',
          'To keep away from something unpleasant',
          'To promise you will finish a task',
        ],
      },
    },
    '4': {
      borrow: {
        correct: 'To take and use something temporarily',
        distractors: [
          'To give something temporarily to someone',
          'To ask for information during discussion politely',
          'To check facts carefully before writing',
        ],
      },
      lend: {
        correct: 'To give something temporarily to someone',
        distractors: [
          'To take and use something temporarily',
          'To examine similarities and differences between things',
          'To repeat instructions slowly for better understanding',
        ],
      },
      compare: {
        correct: 'To examine similarities and differences between things',
        distractors: [
          'To make an idea clear by describing',
          'To plan and organize details in order',
          'To judge quality using standard measurements carefully',
        ],
      },
      explain: {
        correct: 'To make an idea clear by describing',
        distractors: [
          'To plan and organize details in order',
          'To give something temporarily to someone',
          'To write ideas quickly without editing',
        ],
      },
      arrange: {
        correct: 'To plan and organize details in order',
        distractors: [
          'To take and use something temporarily',
          'To examine similarities and differences between things',
          'To confirm attendance and reserve necessary rooms',
        ],
      },
    },
    '5': {
      mitigate: {
        correct: 'To make a problem less severe or harmful',
        distractors: [
          'To assign resources or duties for particular purposes',
          'To put a plan or decision into effect',
          'To plan measures before problems potentially arise',
        ],
      },
      allocate: {
        correct: 'To assign resources or duties for particular purposes',
        distractors: [
          'To give reasons showing a decision is reasonable',
          'To put a plan or decision into effect',
          'To divide tasks fairly among available team members',
        ],
      },
      justify: {
        correct: 'To give reasons showing a decision is reasonable',
        distractors: [
          'To make a problem less severe or harmful',
          'To settle a disagreement by mutual concessions',
          'To explain actions so others accept them',
        ],
      },
      compromise: {
        correct: 'To settle a disagreement by mutual concessions',
        distractors: [
          'To assign resources or duties for particular purposes',
          'To give reasons showing a decision is reasonable',
          'To find middle ground after difficult negotiations',
        ],
      },
      implement: {
        correct: 'To put a plan or decision into effect',
        distractors: [
          'To make a problem less severe or harmful',
          'To assign resources or duties for particular purposes',
          'To carry out steps exactly as previously designed',
        ],
      },
    },
    '6': {
      assess: {
        correct: "To evaluate something's quality, value, or significance",
        distractors: [
          'To explain the meaning of something clearly',
          'To express ideas clearly in spoken words',
          'To summarize key points without detailed evaluation',
        ],
      },
      interpret: {
        correct: 'To explain the meaning of something clearly',
        distractors: [
          "To evaluate something's quality, value, or significance",
          'To reach a conclusion from available evidence',
          'To translate words into another language accurately',
        ],
      },
      infer: {
        correct: 'To reach a conclusion from available evidence',
        distractors: [
          "To evaluate something's quality, value, or significance",
          'To express ideas clearly in spoken words',
          'To guess randomly without considering any evidence',
        ],
      },
      articulate: {
        correct: 'To express ideas clearly in spoken words',
        distractors: [
          'To explain the meaning of something clearly',
          'To restore harmony by resolving differences',
          'To think quietly without sharing your opinions',
        ],
      },
      reconcile: {
        correct: 'To restore harmony by resolving differences',
        distractors: [
          "To evaluate something's quality, value, or significance",
          'To explain the meaning of something clearly',
          'To separate groups further by highlighting differences',
        ],
      },
    },
    '7': {
      scrutinize: {
        correct: 'To examine something carefully for detailed accuracy',
        distractors: [
          'To publicly support a cause or idea',
          'To combine parts into a coherent whole',
          'To summarize findings for a general audience',
        ],
      },
      advocate: {
        correct: 'To publicly support a cause or idea',
        distractors: [
          'To examine something carefully for detailed accuracy',
          'To stick firmly to rules or surfaces',
          'To announce updates during a public meeting',
        ],
      },
      synthesize: {
        correct: 'To combine parts into a coherent whole',
        distractors: [
          'To publicly support a cause or idea',
          'To weaken something gradually or secretly',
          'To separate elements for individual detailed study',
        ],
      },
      undermine: {
        correct: 'To weaken something gradually or secretly',
        distractors: [
          'To combine parts into a coherent whole',
          'To stick firmly to rules or surfaces',
          'To enforce standards through consistent daily checks',
        ],
      },
      adhere: {
        correct: 'To stick firmly to rules or surfaces',
        distractors: [
          'To weaken something gradually or secretly',
          'To examine something carefully for detailed accuracy',
          'To record outcomes using standardized reporting templates',
        ],
      },
    },
    '8': {
      assert: {
        correct: 'To state something confidently as true',
        distractors: [
          'To suggest something without stating it directly',
          'To describe main points in a summary',
          'To evaluate evidence supporting a particular conclusion',
        ],
      },
      concede: {
        correct: 'To admit something true after initial denial',
        distractors: [
          'To state something confidently as true',
          'To prove a statement or claim wrong',
          'To withdraw a claim to avoid conflict',
        ],
      },
      imply: {
        correct: 'To suggest something without stating it directly',
        distractors: [
          'To admit something true after initial denial',
          'To describe main points in a summary',
          'To connect ideas using clear transitions',
        ],
      },
      refute: {
        correct: 'To prove a statement or claim wrong',
        distractors: [
          'To suggest something without stating it directly',
          'To state something confidently as true',
          'To compare sources to reach a judgement',
        ],
      },
      outline: {
        correct: 'To describe main points in a summary',
        distractors: [
          'To admit something true after initial denial',
          'To prove a statement or claim wrong',
          'To compile references following the citation format',
        ],
      },
    },
    '8': {
      assert: {
        correct: 'To state something confidently as true',
        distractors: [
          'To suggest something without stating it directly',
          'To describe main points in a summary',
          'To evaluate evidence supporting a particular conclusion',
        ],
      },
      concede: {
        correct: 'To admit something true after initial denial',
        distractors: [
          'To state something confidently as true',
          'To prove a statement or claim wrong',
          'To withdraw a claim to avoid conflict',
        ],
      },
      imply: {
        correct: 'To suggest something without stating it directly',
        distractors: [
          'To admit something true after initial denial',
          'To describe main points in a summary',
          'To connect ideas using clear transitions',
        ],
      },
      refute: {
        correct: 'To prove a statement or claim wrong',
        distractors: [
          'To suggest something without stating it directly',
          'To state something confidently as true',
          'To compare sources to reach a judgement',
        ],
      },
      outline: {
        correct: 'To describe main points in a summary',
        distractors: [
          'To admit something true after initial denial',
          'To prove a statement or claim wrong',
          'To compile references following the citation format',
        ],
      },
    },
    '9': {
      contrast: {
        correct: 'To compare to show clear differences',
        distractors: [
          'To provide evidence that supports a claim',
          'To limit actions or growth by force',
          'To combine elements into one unified whole',
        ],
      },
      corroborate: {
        correct: 'To provide evidence that supports a claim',
        distractors: [
          'To compare to show clear differences',
          'To propose an explanation based on limited evidence',
          'To question claims by seeking counterevidence',
        ],
      },
      hypothesize: {
        correct: 'To propose an explanation based on limited evidence',
        distractors: [
          'To provide evidence that supports a claim',
          'To move away from an expected course',
          'To estimate roughly using partial information',
        ],
      },
      constrain: {
        correct: 'To limit actions or growth by force',
        distractors: [
          'To move away from an expected course',
          'To compare to show clear differences',
          'To prevent progress through strict regulations',
        ],
      },
      deviate: {
        correct: 'To move away from an expected course',
        distractors: [
          'To limit actions or growth by force',
          'To propose an explanation based on limited evidence',
          'To measure distance traveled along routes',
        ],
      },
      },
    '10': {
      correlate: {
        correct: 'To show a relationship between two variables',
        distractors: [
          'To confirm something is accurate or acceptable',
          'To collect information into an organized whole',
          'To analyze patterns without proving direct causation',
        ],
      },
      validate: {
        correct: 'To confirm something is accurate or acceptable',
        distractors: [
          'To show a relationship between two variables',
          'To measure performance against a defined standard',
          'To remove errors after testing and review',
        ],
      },
      compile: {
        correct: 'To collect information into an organized whole',
        distractors: [
          'To make something clear through thorough explanation',
          'To confirm something is accurate or acceptable',
          'To reorder items into a prioritized list',
        ],
      },
      elucidate: {
        correct: 'To make something clear through thorough explanation',
        distractors: [
          'To collect information into an organized whole',
          'To summarize briefly without extra detail',
          'To debate alternatives to reach a decision',
        ],
      },
      benchmark: {
        correct: 'To measure performance against a defined standard',
        distractors: [
          'To show a relationship between two variables',
          'To track progress over repeated time periods',
          'To allocate resources to priority tasks',
        ],
      },
      },
    '11': {
      prioritize: {
        correct: 'To arrange tasks by importance or urgency',
        distractors: [
          'To discuss terms to reach a fair agreement',
          'To organize people or tasks to work together',
          'To gather feedback from users after a release',
        ],
      },
      negotiate: {
        correct: 'To discuss terms to reach a fair agreement',
        distractors: [
          'To arrange tasks by importance or urgency',
          'To predict future events based on data',
          'To formally accept conditions without further changes',
        ],
      },
      revise: {
        correct: 'To update a text to improve clarity',
        distractors: [
          'To organize people or tasks to work together',
          'To arrange tasks by importance or urgency',
          'To summarize sources without changing original meaning',
        ],
      },
      forecast: {
        correct: 'To predict future events based on data',
        distractors: [
          'To arrange tasks by importance or urgency',
          'To organize people or tasks to work together',
          'To test ideas quickly with small samples',
        ],
      },
      coordinate: {
        correct: 'To organize people or tasks to work together',
        distractors: [
          'To update a text to improve clarity',
          'To discuss terms to reach a fair agreement',
          'To monitor progress using clear shared timelines',
        ],
      },
      },
    '12': {
      enforce: {
        correct: 'Ensure rules are obeyed through authority',
        distractors: [
          'Act according to rules, requests, or standards',
          'Break a rule, agreement, or legal requirement',
          'Apply penalties when procedures are ignored',
        ],
      },
      comply: {
        correct: 'Act according to rules, requests, or standards',
        distractors: [
          'Ensure rules are obeyed through authority',
          'Make previously hidden information publicly known',
          'Persuade others to accept your proposal fully',
        ],
      },
      violate: {
        correct: 'Break a rule, agreement, or legal requirement',
        distractors: [
          'Act according to rules, requests, or standards',
          'Make previously hidden information publicly known',
          'Disagree publicly without breaking any formal rule',
        ],
      },
      amend: {
        correct: 'Make changes to improve a text or law',
        distractors: [
          'Act according to rules, requests, or standards',
          'Break a rule, agreement, or legal requirement',
          'Translate documents for international review and distribution',
        ],
      },
      disclose: {
        correct: 'Make previously hidden information publicly known',
        distractors: [
          'Ensure rules are obeyed through authority',
          'Act according to rules, requests, or standards',
          'Summarize findings for a nontechnical audience',
        ],
      },
      },
    '13': {
      curtail: {
        correct: 'To reduce something in extent or amount',
        distractors: [
          'To make something stronger, louder, or greater',
          'To begin an activity, event, or process',
          'To temporarily pause progress without fully cancelling',
        ],
      },
      amplify: {
        correct: 'To make something stronger, louder, or greater',
        distractors: [
          'To reduce something in extent or amount',
          'To finish something or reach a decision',
          'To present an idea as completely finished',
        ],
      },
      rectify: {
        correct: 'To correct something by making necessary changes',
        distractors: [
          'To begin an activity, event, or process',
          'To finish something or reach a decision',
          'To join separate parts into one coherent whole',
        ],
      },
      commence: {
        correct: 'To begin an activity, event, or process',
        distractors: [
          'To finish something or reach a decision',
          'To correct something by making necessary changes',
          'To plan resources carefully before starting tasks',
        ],
      },
      conclude: {
        correct: 'To finish something or reach a decision',
        distractors: [
          'To begin an activity, event, or process',
          'To reduce something in extent or amount',
          'To continue discussing without closing the topic',
        ],
      },
    },
  },
};

// Count words in a phrase
const countWords = (text: string): number => (text.trim().match(/\S+/g) || []).length;

// Remove awkward trailing joiners to avoid cut-offs like "and"
const stripTrailingJoiners = (text: string): string => {
  const joiners = new Set(['and','or','to','of','in','with','for','by','at','on','from']);
  let parts = text.trim().split(/\s+/);
  while (parts.length && joiners.has(parts[parts.length - 1].toLowerCase())) {
    parts = parts.slice(0, -1);
  }
  return parts.join(' ');
};

// Heuristic part-of-speech detection based on definition/word/synonyms
const detectPartOfSpeech = (word: string, definition: string, synonyms?: string[]): 'verb' | 'noun' | 'adjective' => {
  const def = (definition || '').trim().toLowerCase();
  if (def.startsWith('to ')) return 'verb';
  const w = (word || '').toLowerCase();
  if (/tion$|ment$|ness$|ity$|ance$|ence$|ship$|hood$|ism$/.test(w)) return 'noun';
  if (/ful$|less$|ous$|ive$|al$|ic$|able$|ible$|ary$|ant$|ent$|y$/.test(w)) return 'adjective';
  if ((synonyms || []).some(s => (s || '').toLowerCase().startsWith('to '))) return 'verb';
  return 'noun';
};

// Topic-typed fallbacks for Intermediate Set 1 (Personal Growth & Achievement)
const typedFallbacks = (setTitle: string, pos: 'verb'|'noun'|'adjective'): string[] => {
  const t = (setTitle || '').toLowerCase();
  if (t.includes('personal') || t.includes('growth') || t.includes('achievement')) {
    if (pos === 'verb') {
      return [
        'To continue practicing with consistent effort',
        'To persevere despite difficulties and setbacks',
        'To develop skills through regular disciplined work',
        'To overcome barriers by sustained determination',
      ];
    }
    if (pos === 'adjective') {
      return [
        'Showing determination and strong motivation',
        'Being consistent with regular practice',
        'Feeling confident about personal improvement',
      ];
    }
    // noun
    return [
      'A personal milestone achieved after hard work',
      'A long term goal for continued growth',
      'A plan for improvement with clear steps',
    ];
  }
  // generic
  if (pos === 'verb') return ['To act differently in similar situations'];
  if (pos === 'adjective') return ['Showing a typical common quality'];
  return ['A general concept related to subject'];
};

export default function MCQComponent({ setId, levelId, onPhaseComplete, sharedScore, onScoreShare, wordRange }: MCQProps) {
  const [currentWordIndex, setCurrentWordIndex] = useState(0);
  const [displayScore, setDisplayScore] = useState(sharedScore);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [showFeedback, setShowFeedback] = useState(false);
  const [isCorrect, setIsCorrect] = useState(false);
  const [isAnswered, setIsAnswered] = useState(false);
  const [isProcessingNext, setIsProcessingNext] = useState(false);
  const [phaseCorrect, setPhaseCorrect] = useState(0);
  const pendingScoreRef = useRef<number | null>(null);
  const optionAnims = useRef<Animated.Value[]>([]);
  
  // Animation refs
  const fadeAnim = useRef(new Animated.Value(1)).current;
  const slideAnim = useRef(new Animated.Value(0)).current;
  const progressAnim = useRef(new Animated.Value(0)).current;
  const deductionAnim = useRef(new Animated.Value(0)).current;
  const questionStartRef = useRef<number>(Date.now());

  useEffect(() => {
    console.log('MCQComponent - useEffect triggered:', { setId, levelId });
    generateQuestions();
  }, [setId, levelId]);

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

  // Prepare bubble entrance animation for options whenever the question changes
  useEffect(() => {
    const opts = questions[currentWordIndex]?.options || [];
    optionAnims.current = opts.map(() => new Animated.Value(0));
    const anims = optionAnims.current.map((v, i) =>
      Animated.timing(v, {
        toValue: 1,
        duration: 360,
        delay: i * 60,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      })
    );
    if (anims.length) Animated.stagger(40, anims).start();
  }, [currentWordIndex, questions.length]);

  const generateQuestions = () => {
    console.log('MCQComponent - generateQuestions called with:', { setId, levelId, wordRange });
    
    const level = levels.find(l => l.id === levelId);
    console.log('MCQComponent - Found level:', level?.name);
    if (!level) return;

    const set = level.sets.find(s => s.id.toString() === setId);
    console.log('MCQComponent - Found set:', set?.title);
    if (!set || !set.words) return;

    // Apply word range if specified
    let words = set.words;
    if (wordRange) {
      words = words.slice(wordRange.start, wordRange.end);
      console.log('MCQComponent - Using word range:', wordRange, 'Words:', words.length);
    }

    // Clamp phrases to a concise, readable length without adding filler words.
    // Keeps meaning intact and avoids giving away the correct option by length.
    // Clamp all options to the SAME word count to avoid length clues
    const clampPhrase = (text: string, maxWords = 7): string => {
      let t = text.trim().replace(/[\s]+/g, ' ');
      // Strip trailing punctuation for consistency
      t = t.replace(/[.,;:!?]+$/g, '');
      const parts = t.split(' ');
      if (parts.length > maxWords) {
        t = parts.slice(0, maxWords).join(' ');
      }
      // Ensure first letter uppercase for display
      return t.charAt(0).toUpperCase() + t.slice(1);
    };

    const generatedQuestions: Question[] = words.map(word => {
      // Check for exact override first
      const override = MCQ_OVERRIDES[levelId || '']?.[String(set.id)]?.[word.word.toLowerCase()];
      if (override) {
        const allOptions = [override.correct, ...override.distractors];
        const shuffledOptions = allOptions
          .map(option => ({ option, sort: Math.random() }))
          .sort((a, b) => a.sort - b.sort)
          .map(({ option }) => option);
        const correctIndex = shuffledOptions.indexOf(override.correct);
        return {
          word: word.word,
          ipa: word.phonetic,
          definition: override.correct,
          example: word.example,
          options: shuffledOptions,
          correctAnswer: correctIndex,
          synonyms: word.synonyms || [],
        };
      }

      const shortDefinition = clampPhrase(shortenPhrase(word.definition));
      
      // Generate unique distractors by ensuring no duplicates
      const usedOptions = new Set<string>([shortDefinition]);
      const distractors: string[] = [];
      const types = ['opposite', 'similar', 'unrelated'];
      
      // Try to get 3 unique distractors
      let attempts = 0;
      const maxAttempts = 20; // Prevent infinite loop
      
      while (distractors.length < 3 && attempts < maxAttempts) {
        const type = types[distractors.length % types.length];
        const distractor = clampPhrase(generateDistractor(shortDefinition, type, word.word, set.title || ''));
        
        // Only add if unique
        if (!usedOptions.has(distractor)) {
          distractors.push(distractor);
          usedOptions.add(distractor);
        }
        attempts++;
      }
      
      // If we still don't have 3 unique distractors, generate generic ones
      const genericFallbacks = [
        'A completely different concept from topic',
        'Something unrelated to this subject area',
        'An alternative meaning in different context',
        'A separate term from another field',
        'A distinct definition for different purpose'
      ];
      
      for (const fallback of genericFallbacks) {
        if (distractors.length >= 3) break;
        if (!usedOptions.has(fallback)) {
          distractors.push(fallback);
          usedOptions.add(fallback);
        }
      }

      // Use definitions from other words in the same set (prefer same POS and similar length ±1)
      if (distractors.length < 3) {
        const baseLen = countWords(shortDefinition);
        const pos = detectPartOfSpeech(word.word, word.definition, word.synonyms);
        const others = words.filter(w => w.word !== word.word);
        for (const ow of others) {
          const oPos = detectPartOfSpeech(ow.word, ow.definition, ow.synonyms);
          if (oPos !== pos) continue;
          let d = clampPhrase(shortenPhrase(ow.definition));
          d = stripTrailingJoiners(d);
          const dl = countWords(d);
          if (dl >= baseLen - 1 && dl <= baseLen + 1 && !usedOptions.has(d)) {
            distractors.push(d);
            usedOptions.add(d);
          }
          if (distractors.length >= 3) break;
        }
      }
      
      const options = [shortDefinition, ...distractors];

      const shuffledOptions = [...options]
        .map(option => ({ option, sort: Math.random() }))
        .sort((a, b) => a.sort - b.sort)
        .map(({ option }) => option);
      const correctIndex = shuffledOptions.indexOf(shortDefinition);

      return {
        word: word.word,
        ipa: word.phonetic,
        definition: shortDefinition,
        example: word.example,
        options: shuffledOptions,
        correctAnswer: correctIndex,
        synonyms: word.synonyms || []
      };
    });

    setQuestions(generatedQuestions);
    // Initialize option animation values for the first question to avoid a flash
    const firstOptions = generatedQuestions[0]?.options || [];
    optionAnims.current = firstOptions.map(() => new Animated.Value(0));
    if (firstOptions.length) {
      const anims = optionAnims.current.map((v, i) =>
        Animated.timing(v, {
          toValue: 1,
          duration: 360,
          delay: i * 60,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        })
      );
      Animated.stagger(40, anims).start();
    }
    setDisplayScore(sharedScore);
    setPhaseCorrect(0);
    questionStartRef.current = Date.now();
  };

const getTopicDistracts = (setTitle: string) => {
  const title = setTitle.toLowerCase();
  
  // Daily Routines & Habits
  if (title.includes('daily') || title.includes('routine') || title.includes('habit')) {
    return {
      opposite: ['Stay sleeping without becoming conscious', 'Skip meals and remain hungry', 'Forget information you previously learned', 'Remain motionless without any activity'],
      similar: ['Open eyes and become conscious', 'Consume food for nutrition', 'Acquire knowledge through reading', 'Move body to stay healthy'],
      unrelated: ['Purchase items from retail stores', 'Communicate with other people verbally', 'View entertainment programs on television', 'Operate a vehicle for transportation']
    };
  }
  
  // Basic Needs & Family
  if (title.includes('family') || title.includes('need')) {
    return {
      opposite: ['Place visited only one time', 'Substances that cause illness harm', 'Unknown person never met before', 'Individuals without family connection together'],
      similar: ['Building where people reside permanently', 'Food consumed during the day', 'Person related by blood marriage', 'Individuals you deeply care about'],
      unrelated: ['Retail establishment for purchasing goods', 'Recreational activity for entertainment purposes', 'Motorized vehicle for travel transportation', 'Film watched for entertainment pleasure']
    };
  }
  
  // Education & Work
  if (title.includes('education') || title.includes('work')) {
    return {
      opposite: ['Learner who refuses to study', 'Item discarded into garbage disposal', 'Leisure time without work obligations', 'Remove content by deleting it'],
      similar: ['Professional who instructs students daily', 'Written materials containing words information', 'Responsibilities that require your completion', 'Create marks using writing tools'],
      unrelated: ['Meals consumed for nutrition energy', 'Activity played for fun enjoyment', 'Structure where families reside together', 'Transportation vehicle you operate daily']
    };
  }
  
  // Food & Cooking
  if (title.includes('food') || title.includes('cook')) {
    return {
      opposite: ['Make food cold using refrigeration', 'Discard food into the garbage', 'Avoid eating any meals today', 'Refuse to drink any liquids', 'Feel completely full after eating'],
      similar: ['Prepare meals for eating later', 'Consume food for nutrition energy', 'Drink beverages for hydration needs', 'Sample dishes to taste flavors', 'Desire meals when feeling hungry'],
      unrelated: ['Read books for knowledge information', 'Drive vehicles for transportation purposes', 'Watch shows for entertainment pleasure', 'Purchase clothes for wearing daily', 'Play games for fun enjoyment']
    };
  }
  
  // Free Time & Hobbies
  if (title.includes('free') || title.includes('hobby')) {
    return {
      opposite: ['Work hard without any rest', 'Complete silence without any sound', 'Ignore and avoid something completely', 'Speak words aloud to others', 'Remain still without any movement'],
      similar: ['Enjoy fun activities for pleasure', 'Sounds and songs creating music', 'Observe things carefully with attention', 'Study words to learn meanings', 'Move body through physical activity'],
      unrelated: ['Cook food in the kitchen', 'Buy things from retail stores', 'Visit doctor for health checkup', 'Drive car to different places', 'Clean house to remove dirt']
    };
  }
  
  // Technology & Internet
  if (title.includes('technology') || title.includes('internet')) {
    return {
      opposite: ['Paper and pen for writing', 'Physical letter sent through mail', 'Printed books stored in library', 'Printed photograph on physical paper', 'Work activities without entertainment fun'],
      similar: ['Electronic device for work tasks', 'Digital tool for communication purposes', 'Network system enabling online connection', 'Digital recording clip of content', 'Activity providing entertainment and enjoyment'],
      unrelated: ['Food items you consume daily', 'Clothing garments you wear regularly', 'Residential house where you live', 'Motorized car you drive places', 'Physical book you read content']
    };
  }
  
  // Shopping & Money
  if (title.includes('shop') || title.includes('money')) {
    return {
      opposite: ['Sell things to other people', 'Money owed as financial debt', 'Empty place with nothing inside', 'Free gift given without payment', 'Receive money from someone else'],
      similar: ['Purchase items from retail stores', 'Physical currency and paper bills', 'Commercial marketplace for buying goods', 'Financial cost or expense incurred', 'Spend money on various purchases'],
      unrelated: ['Study lessons to learn subjects', 'Cook food in the kitchen', 'Watch movies for entertainment pleasure', 'Play sports for physical activity', 'Read books for knowledge information']
    };
  }
  
  // Health & Body
  if (title.includes('health') || title.includes('body')) {
    return {
      opposite: ['Patient suffering from illness disease', 'State of feeling completely healthy', 'Mental thoughts and cognitive processes', 'Feeling of pleasure and happiness', 'Being sick with an illness'],
      similar: ['Healthcare professional treating patients daily', 'Experiencing illness or discomfort currently', 'Physical form and bodily structure', 'Physical discomfort causing pain hurt', 'Condition of being healthy well'],
      unrelated: ['Educator instructing students at school', 'Meals consumed for nutrition daily', 'Vehicle operated for transportation purposes', 'Activity played for entertainment fun', 'Written material read for information']
    };
  }
  
  // Weather & Nature
  if (title.includes('weather') || title.includes('nature')) {
    return {
      opposite: ['Celestial moon visible at night', 'Condition of being completely dry', 'Artificial structure made by humans', 'Temperature that is warm hot', 'Temperature that is cool cold'],
      similar: ['Bright celestial light in sky', 'Liquid water falling from clouds', 'Living plant that grows tall', 'Temperature that is not warm', 'Temperature that is very warm'],
      unrelated: ['Food items consumed for nutrition', 'Vehicles driven for transportation daily', 'Written materials read for information', 'Activities played for entertainment fun', 'Currency possessed for buying things']
    };
  }
  
  // Emotions & Personality
  if (title.includes('emotion') || title.includes('personality')) {
    return {
      opposite: ['Feeling sad and deeply unhappy', 'Feeling happy and full of joy', 'State of being calm peaceful', 'Acting mean and intentionally cruel', 'Behaving silly and acting foolish'],
      similar: ['Experiencing feelings of happiness joy', 'Experiencing feelings of sadness unhappiness', 'Experiencing anger and frustration feelings', 'Trait of being kind nice', 'Quality of being smart intelligent'],
      unrelated: ['Meals consumed for daily nutrition', 'Written materials read for knowledge', 'Vehicles driven for transportation purposes', 'Buildings where families live together', 'Activities played for fun entertainment']
    };
  }
  
  // Transportation & Travel
  if (title.includes('transport') || title.includes('travel')) {
    return {
      opposite: ['Two-wheeled bicycle you pedal ride', 'Small commercial van for transport', 'Move quickly by running fast', 'Remain at home without traveling', 'Ticket obtained without paying money'],
      similar: ['Motorized vehicle you drive daily', 'Large motorized vehicle for transport', 'Walk by moving on foot', 'Travel to a different place', 'Document allowing travel or entry'],
      unrelated: ['Meals consumed for nutrition daily', 'Written materials read for information', 'Films watched for entertainment pleasure', 'Activities played for fun enjoyment', 'Music listened to for pleasure']
    };
  }
  
  // Home & Furniture
  if (title.includes('home') || title.includes('furniture')) {
    return {
      opposite: ['Outdoor open space without walls', 'Bottom surface where you walk', 'Upright position while being vertical', 'Alert state of being awake', 'Vertical structure dividing rooms inside'],
      similar: ['Indoor space within a building', 'Horizontal surface that is flat', 'Furniture piece designed for sitting', 'Furniture designed for sleeping rest', 'Opening allowing entry into building'],
      unrelated: ['Meals consumed for nutrition daily', 'Vehicles driven for transportation purposes', 'Written materials read for information', 'Activities played for fun entertainment', 'Music listened to for pleasure']
    };
  }
  
  // Culture & Entertainment
  if (title.includes('culture') || title.includes('entertainment')) {
    return {
      opposite: ['Performance happening live in person', 'Communication using spoken verbal words', 'Responsibilities and tasks requiring effort', 'Text created through written communication', 'Educational session for learning instruction'],
      similar: ['Cinematic film shown for viewing', 'Musical composition creating pleasant sounds', 'Special event marking a celebration', 'Artistic work expressing creative ideas', 'Fictional story told through narrative'],
      unrelated: ['Meals consumed for nutrition daily', 'Vehicles driven for transportation purposes', 'Currency possessed for buying things', 'Clothing garments worn for protection', 'Tasks completed to earn income']
    };
  }
  
  // IELTS Topics
  if (title.includes('academic') || title.includes('lecture')) {
    return {
      opposite: ['An informal chat without structure', 'Ignoring all studies completely', 'Avoiding all deadlines regularly', 'Skipping all classes instead'],
      similar: ['A formal presentation to students', 'An educational task by teacher', 'A scholarly investigation of research', 'An academic period for studying', 'A time requirement for coursework'],
      unrelated: ['A sports competition between teams', 'A musical performance at hall', 'A cooking recipe for dinner', 'A travel destination for trip']
    };
  }
  
  if (title.includes('environment') || title.includes('climate')) {
    return {
      opposite: ['The purification of natural environment', 'Wasteful practices that damage ecosystem', 'A destroyed habitat with no wildlife', 'The absorption of gases naturally', 'Finite resources that cannot renew'],
      similar: ['The contamination of air by substances', 'Environmentally responsible behavior practices', 'A natural community of plants', 'Gas release into atmosphere', 'Replenishable sources that restore naturally'],
      unrelated: ['Business profits from transactions', 'Political elections for positions', 'Sports training for competitions', 'Musical instruments for performances']
    };
  }
  
  if (title.includes('technology') || title.includes('innovation')) {
    return {
      opposite: ['Natural materials that come from nature', 'Analog systems without digital components', 'Manual calculation done by hand', 'Human labor without machine assistance', 'Stagnation with no progress'],
      similar: ['A human-made product by people', 'An electronic system with components', 'A computing formula for operations', 'A mechanized process using systems', 'A major discovery that changes'],
      unrelated: ['Food recipes for cooking meals', 'Sports rules for competitive games', 'Art paintings displayed in museums', 'Travel routes for destinations']
    };
  }
  
  if (title.includes('health') || title.includes('medicine')) {
    return {
      opposite: ['A misdiagnosis by medical professional', 'A sign of wellness and health', 'The neglect of patient by provider', 'Causing disease through exposure', 'Vulnerability to illness and infection'],
      similar: ['Medical identification of condition', 'A health indicator showing condition', 'Medical intervention to treat condition', 'Disease avoidance through measures', 'Protection against infection illness'],
      unrelated: ['A business strategy for growth', 'A political debate between candidates', 'Sports performance in competition', 'A travel itinerary for planning']
    };
  }
  
  if (title.includes('business') || title.includes('econom')) {
    return {
      opposite: ['A loss of money from operations', 'The withdrawal of funds from account', 'Deflation of prices in economy', 'An employee working for wages', 'A seller of products to customers'],
      similar: ['Financial gain from business activities', 'Capital injection into venture', 'Price increases in economy', 'A business founder who starts company', 'A product buyer who purchases goods'],
      unrelated: ['Medical treatment for conditions', 'A sports competition between teams', 'An art exhibition in museum', 'Climate research on changes']
    };
  }
  
  if (title.includes('government') || title.includes('politic')) {
    return {
      opposite: ['The breaking of laws regulations', 'Dictatorship rule by single leader', 'Improvised decisions without planning', 'A single ruler with power', 'Peaceful inaction without response'],
      similar: ['Government rules and regulations', 'Elected governance by citizens', 'Strategic planning for goals', 'A legislative body that makes laws', 'An organized effort to achieve goals'],
      unrelated: ['Medical procedures for treatment', 'Sports training for performance', 'Food preparation for meals', 'Art techniques for expression']
    };
  }
  
  if (title.includes('media') || title.includes('communication')) {
    return {
      opposite: ['To receive signal privately without access', 'Entertainment fiction for purposes', 'Freedom of expression without restrictions', 'Factual information based on evidence', 'A news report about events'],
      similar: ['To transmit publicly to audience', 'News reporting about events', 'Content control over messages', 'Political messaging for purposes', 'An opinion article expressing views'],
      unrelated: ['Medical diagnosis of conditions', 'Sports equipment for training', 'Food nutrition for diet', 'Urban planning for development']
    };
  }
  
  if (title.includes('social') && title.includes('issue')) {
    return {
      opposite: ['Equality between different groups', 'Wealth and prosperity for citizens', 'Fair treatment without discrimination', 'Private charity from donors', 'Uniformity without cultural differences'],
      similar: ['Unfair disparity between groups', 'Extreme poorness and hardship', 'Unfair treatment based on prejudice', 'Government support for programs', 'Cultural variety and diversity'],
      unrelated: ['Technology innovation in systems', 'A sports competition between teams', 'Art creation for expression', 'Food production for industry']
    };
  }
  
  if (title.includes('arts') || title.includes('culture')) {
    return {
      opposite: ['An ugly and unpleasant expression', 'A private collection for enjoyment', 'Traditional and old practices', 'A modern invention without roots', 'Failure and disaster in work'],
      similar: ['A beautiful appearance of creation', 'Public display for viewing', 'Modern and current expression', 'Cultural tradition passed through generations', 'Excellent work of achievement'],
      unrelated: ['Medical treatment for conditions', 'A business transaction for purposes', 'Sports training for performance', 'A political debate between candidates']
    };
  }
  
  if (title.includes('science') || title.includes('research')) {
    return {
      opposite: ['A proven fact through evidence', 'Observation without scientific testing', 'A lack of proof for claims', 'A casual opinion without basis', 'A random approach without method'],
      similar: ['A testable theory that verified', 'A scientific test to prove', 'Supporting proof for findings', 'A detailed examination of data', 'A research approach using methods'],
      unrelated: ['Business profit from activities', 'A political campaign for purposes', 'Sports training for competitions', 'An art exhibition for display']
    };
  }
  
  if (title.includes('travel') || title.includes('tourism')) {
    return {
      opposite: ['An origin point where journey begins', 'A spontaneous trip without planning', 'A temporary shelter for stay', 'Hostility and rudeness from locals', 'A boring location with no attractions'],
      similar: ['A target location for destination', 'A planned schedule for itinerary', 'A lodging place for accommodation', 'Friendly service from staff', 'A tourist site with attractions'],
      unrelated: ['Medical diagnosis of conditions', 'Business profit from activities', 'Political policy for decisions', 'Scientific method for studies']
    };
  }
  
  if (title.includes('food') && title.includes('agriculture')) {
    return {
      opposite: ['Chemical and synthetic additives', 'Malnutrition from inadequate intake', 'The destruction of plants crops', 'Crop failure due to conditions', 'Wild animals living in nature'],
      similar: ['Natural and pure ingredients', 'A healthy diet with foods', 'Growing crops for production', 'Gathered produce from harvest', 'Farm animals raised for food'],
      unrelated: ['Political legislation for policies', 'Media broadcast for communication', 'A sports competition between teams', 'Urban planning for development']
    };
  }
  
  if (title.includes('urban') || title.includes('development')) {
    return {
      opposite: ['Basic amenities lacking infrastructure', 'A commercial district for activities', 'Rural countryside away from cities', 'Free-flowing traffic without congestion', 'Unrestricted building without regulations'],
      similar: ['City systems for infrastructure', 'Housing areas for development', 'City-related planning and management', 'Traffic crowding in areas', 'Land planning for projects'],
      unrelated: ['Medical treatment for conditions', 'Sports training for performance', 'Art creation for expression', 'Food nutrition for diet']
    };
  }
  
  if (title.includes('education') && title.includes('system')) {
    return {
      opposite: ['Random subjects without curriculum', 'A student-led approach without guidance', 'Illiteracy and inability to read', 'Academic training for studies', 'Ignoring evaluation of progress'],
      similar: ['Course content for curriculum', 'Teaching methods used by educators', 'Reading ability developed through practice', 'Job-related training for skills', 'Knowledge evaluation through methods'],
      unrelated: ['Sports performance in competitions', 'Business profit from activities', 'Medical treatment for conditions', 'A political campaign for purposes']
    };
  }
  
  if (title.includes('crime') || title.includes('law')) {
    return {
      opposite: ['A plaintiff or victim of act', 'Defense action to protect accused', 'An innocent finding by decision', 'Injustice and unfairness in system', 'Punishment only without programs'],
      similar: ['An accused person facing charges', 'Legal charges brought against defendant', 'A jury decision in trial', 'Fair treatment under system', 'Criminal reform through programs'],
      unrelated: ['Medical diagnosis of conditions', 'Sports training for performance', 'An art exhibition for display', 'Food cultivation for production']
    };
  }
  
  if (title.includes('psychology') || title.includes('behavior')) {
    return {
      opposite: ['Physical and bodily conditions', 'Discouragement and loss of motivation', 'Misunderstanding of concepts', 'Calmness and peaceful state', 'Fragility and emotional vulnerability'],
      similar: ['Mental processes of cognition', 'Inner drive and motivation', 'Personal understanding of concepts', 'Worry feeling and symptoms', 'Mental strength and resilience'],
      unrelated: ['Political legislation for policies', 'Business profit from activities', 'Sports equipment for training', 'Art materials for expression']
    };
  }
  
  if (title.includes('global') && title.includes('issue')) {
    return {
      opposite: ['Selfish and cruel behavior toward others', 'A settled resident living in home', 'Peace and harmony between nations', 'Abundance of food for people', 'A local outbreak affecting area'],
      similar: ['Compassionate aid for relief', 'A displaced person forced to leave', 'Serious disagreement between groups', 'Food shortage affecting people', 'A worldwide disease spreading countries'],
      unrelated: ['A sports competition between teams', 'An art exhibition for display', 'A business transaction for purposes', 'Technology innovation in systems']
    };
  }
  
  if (title.includes('sports') || title.includes('fitness')) {
    return {
      opposite: ['A weak and unfit condition', 'Exhaustion quickly from effort', 'Cooperation only without spirit', 'Fatigue and tiredness from activity', 'Failure and poor results'],
      similar: ['A physically strong condition', 'Prolonged capability for activity', 'A competitive event between teams', 'Physical energy for performance', 'Achievement level in competition'],
      unrelated: ['Medical diagnosis of conditions', 'A political debate between candidates', 'Art techniques for expression', 'Food recipes for meals']
    };
  }
  
  if (title.includes('finance') || title.includes('banking')) {
    return {
      opposite: ['A gift or donation without repayment', 'Debt or owing money to others', 'Liabilities owed by borrower', 'Unlimited spending without restrictions', 'Cash payment without terms'],
      similar: ['A property loan for purchase', 'Borrowing ability based on score', 'Owned property as asset', 'A spending plan for management', 'Money exchange for currencies'],
      unrelated: ['Medical treatment for conditions', 'Sports training for performance', 'Art creation for expression', 'A political campaign for purposes']
    };
  }
  
  if (title.includes('employment') || title.includes('career')) {
    return {
      opposite: ['A lack of skills for job', 'Demotion downward to position', 'Starting employment at level', 'Inefficiency in work performance', 'A competitor rival in industry'],
      similar: ['A job requirement for position', 'Career advancement to level', 'Leaving job for opportunity', 'Work efficiency in performance', 'A work partner for projects'],
      unrelated: ['Medical diagnosis of conditions', 'Sports performance in competition', 'An art exhibition for display', 'Food preparation for meals']
    };
  }

  // Office Communication Topics
  if (title.includes('meeting') || title.includes('discussion')) {
    return {
      opposite: ['Random informal chat without any structure or purpose', 'Starting the meeting without any prepared agenda plan', 'Completely ignoring all the topics on meeting agenda', 'Strong disagreement among all members of the group'],
      similar: ['A detailed schedule listing all meeting topics discussed', 'Written record of what was said in meeting', 'General agreement reached among all members of group', 'Careful consideration and discussion of important issues thoroughly'],
      unrelated: ['Medical treatment provided for patients at the hospital', 'Sports competition taking place between rival athletic teams', 'Art exhibition displaying paintings at the local gallery', 'Food preparation activities happening in the kitchen today']
    };
  }

  if (title.includes('email') || title.includes('correspondence')) {
    return {
      opposite: ['The sender of the message or email communication', 'Completely removing all files from the email message', 'Ignoring the message completely without any acknowledgment response', 'Holding back important information from all other people'],
      similar: ['The person who receives a message or email', 'A file that is sent along with email', 'Written communication that is exchanged between people regularly', 'To confirm receipt or recognition of something received'],
      unrelated: ['Sports training program designed for professional athletes today', 'Medical diagnosis of illness or disease by doctor', 'Art creation process for display at the gallery', 'Food cultivation activities for harvest in the field']
    };
  }

  if (title.includes('project') && title.includes('management')) {
    return {
      opposite: ['A minor setback or delay in the project', 'An intangible concept without any tangible outcome produced', 'An uninvolved person without any interest in project', 'To delay or completely halt the project progress'],
      similar: ['An important stage or event in the project', 'A tangible outcome that must be produced for project', 'A person with interest or concern in something', 'To put a plan or system into action'],
      unrelated: ['Medical treatment provided for various health conditions today', 'Sports performance taking place in the athletic games', 'Art techniques and methods used for painting pictures', 'Food nutrition information important for good health today']
    };
  }

  if (title.includes('report') || title.includes('documentation')) {
    return {
      opposite: ['A detailed explanation covering everything in the document', 'The main content section of the document itself', 'The original version without any changes or updates', 'The main text appearing on the page itself'],
      similar: ['A brief statement covering the main points only', 'Additional material included at end of document', 'A changed or updated version of the document', 'Additional information appearing at bottom of the page'],
      unrelated: ['Sports equipment and gear used for athletic training', 'Medical procedures performed for patients at the hospital', 'Art materials and supplies used for painting pictures', 'Food ingredients and items used for cooking meals']
    };
  }

  if (title.includes('presentation') || title.includes('speaking')) {
    return {
      opposite: ['The entire presentation shown all at once together', 'Keeping all materials away from the audience members', 'A device that records sound instead of images', 'To perform without any practice or preparation beforehand'],
      similar: ['A single page of a digital presentation displayed', 'Printed material that is given to the audience', 'A device that displays images on a screen', 'To practice something carefully before performing it publicly'],
      unrelated: ['Medical diagnosis of disease or illness by the doctor', 'Sports competition taking place between rival teams today', 'Food preparation activities for dinner in the kitchen', 'Art creation process for exhibition at the gallery']
    };
  }

  if (title.includes('team') && title.includes('collaboration')) {
    return {
      opposite: ['To work alone on project without any help', 'To keep all tasks to yourself without sharing', 'To make a process more difficult than necessary', 'Individual effort made without help from other people'],
      similar: ['To work jointly with others on a project', 'To assign tasks or responsibilities to other people', 'To make an action or process much easier', 'Combined power that is greater than individual parts'],
      unrelated: ['Medical treatment provided for illness at the hospital', 'Sports training and exercise for fitness and health', 'Art exhibition displaying works at the local museum', 'Food cultivation activities for growing crops in fields']
    };
  }

  if (title.includes('time') && title.includes('management')) {
    return {
      opposite: ['To ignore the importance of tasks without organizing', 'A random plan without any order or structure', 'To advance an event to an earlier time', 'To keep resources away from their intended purpose'],
      similar: ['To arrange tasks in order of their importance', 'A plan showing when things will happen or occur', 'To delay an event to a later time', 'To distribute resources for a particular purpose or goal'],
      unrelated: ['Medical procedures and treatments for good health today', 'Sports equipment and gear used for playing games', 'Art materials and supplies used for creative projects', 'Food preparation and cooking activities for making meals']
    };
  }

  if (title.includes('client') && title.includes('relation')) {
    return {
      opposite: ['To accept terms without any discussion or negotiation', 'A final decision made without any consideration given', 'A statement offering free service without any charge', 'An unfriendly relationship without any mutual understanding shown'],
      similar: ['To discuss terms to reach an agreement together', 'A formal suggestion or plan offered for consideration', 'A statement of the price for goods or services', 'A friendly relationship built on mutual understanding and trust'],
      unrelated: ['Medical diagnosis of patients at the hospital by doctor', 'Sports performance taking place in the competition today', 'Art techniques and methods used for painting pictures', 'Food cultivation activities for agriculture in the fields']
    };
  }

  if (title.includes('performance') || title.includes('feedback')) {
    return {
      opposite: ['To ignore the quality of something without assessment', 'Destructive feedback that does not help at all', 'Praise given without any evaluation or assessment done', 'Below the standards used for comparison and measurement'],
      similar: ['To assess the quality or performance of something', 'Helpful feedback that is intended to improve something', 'An assessment of the value or quality offered', 'A standard that is used for comparison purposes'],
      unrelated: ['Medical treatment provided for illness at the hospital', 'Sports equipment and gear used for training athletes', 'Art exhibition displaying works at the local gallery', 'Food preparation and cooking activities in the kitchen']
    };
  }

  if (title.includes('office') && title.includes('technology')) {
    return {
      opposite: ['A physical system used for operations and tasks', 'Hardware equipment and devices used by computers today', 'The point where users disconnect from the system', 'To separate different systems apart from each other'],
      similar: ['A digital system for running applications or services', 'Programs and applications that are used by computers', 'A point where users interact with the system', 'To combine different systems to work together effectively'],
      unrelated: ['Medical procedures and treatments performed for patients today', 'Sports performance taking place in the athletic games', 'Art creation process for display at the gallery', 'Food nutrition information important for good health today']
    };
  }

  if (title.includes('business') && title.includes('strategy')) {
    return {
      opposite: ['A vague wish without any specific plan to achieve', 'An old plan without any change or updates', 'A review of past events that already happened', 'A cooperative approach without any rivalry or competition'],
      similar: ['A specific goal that is planned to be achieved', 'A new plan or process to achieve something', 'A prediction of future trends or events coming', 'Related to rivalry between businesses or people competing'],
      unrelated: ['Medical diagnosis of illness or disease by the doctor', 'Sports training and exercise for athletes at gym', 'Art techniques and methods used for painting pictures', 'Food preparation and cooking activities for making meals']
    };
  }

  if (title.includes('workplace') && title.includes('polic')) {
    return {
      opposite: ['An informal suggestion without any rules or guidelines', 'Violation of the rules standards and regulations imposed', 'Public information that is available for everyone openly', 'Denial of permission that was requested by someone'],
      similar: ['Official procedure or system of rules to follow', 'Following rules regulations or standards that are established', 'Information that is meant to be kept secret', 'Official permission for something to happen or occur'],
      unrelated: ['Medical treatment provided for conditions at the hospital', 'Sports competition taking place between rival teams today', 'Art exhibition displaying paintings at the local gallery', 'Food cultivation activities for growing crops in fields']
    };
  }

  if (title.includes('professional') && title.includes('development')) {
    return {
      opposite: ['A student who is learning from the mentor', 'A presentation given without any training or preparation', 'Denial of skills knowledge or qualifications that exist', 'To downgrade skills or abilities to lower level'],
      similar: ['An experienced person who advises and guides others', 'A meeting organized for training or discussion purposes', 'Official recognition of skills or knowledge you have', 'To learn new skills or improve existing ones'],
      unrelated: ['Medical procedures and treatments performed for patients today', 'Sports performance taking place in the competition event', 'Art materials and supplies used for creative projects', 'Food preparation and cooking activities for making meals']
    };
  }

  if (title.includes('financial') && title.includes('term')) {
    return {
      opposite: ['A receipt for payment that was received from customer', 'Income that is earned from business operations today', 'Payment that is made to others for services', 'Profit not related to production or manufacturing activities'],
      similar: ['A document requesting payment for goods or services', 'Money that is spent for business purposes today', 'Repayment of money spent on business activities earlier', 'Ongoing business costs not directly related to production'],
      unrelated: ['Medical diagnosis of illness or disease by doctor', 'Sports training and exercise for fitness and health', 'Art exhibition displaying works at the local museum', 'Food cultivation activities for agriculture in the fields']
    };
  }

  if (title.includes('human') && title.includes('resource')) {
    return {
      opposite: ['To fire or dismiss employees from the company', 'To exclude employees from the company activities completely', 'To begin someone employment offered at the company', 'Disadvantages that are provided to employees by employer'],
      similar: ['To find and hire new employees for company', 'To integrate new employees into the company culture', 'To end someone employment at company unfortunately today', 'Additional advantages that are provided to employees regularly'],
      unrelated: ['Medical treatment and care provided for patients today', 'Sports equipment and gear used for playing games', 'Art techniques and methods used for painting pictures', 'Food nutrition information important for good health today']
    };
  }

  if (title.includes('marketing') || title.includes('sales')) {
    return {
      opposite: ['Random activities without any plan or strategy involved', 'A current customer who buys products from us', 'Rejection of potential buyers who are interested today', 'Efforts made to avoid customers and their business'],
      similar: ['Organized activities to promote a product or service', 'A potential customer who may buy products soon', 'Turning potential customers into actual buyers successfully today', 'Efforts to connect with potential customers or partners'],
      unrelated: ['Medical procedures and treatments for good health today', 'Sports performance taking place in the competition event', 'Art creation process for display at the gallery', 'Food preparation and cooking activities in the kitchen']
    };
  }

  if (title.includes('customer') && title.includes('service')) {
    return {
      opposite: ['A statement without any information provided to customer', 'Expression of satisfaction offered about the service received', 'Creation of a new problem instead of solution', 'To ignore problem to authority without taking action'],
      similar: ['A request for information about products or services', 'An expression of dissatisfaction about a service received', 'The solution to a problem or complaint raised', 'To refer a problem to a higher authority'],
      unrelated: ['Medical diagnosis of conditions or illness by doctor', 'Sports training and exercise for athletes at gym', 'Art exhibition displaying paintings at the local gallery', 'Food cultivation activities for growing crops in fields']
    };
  }

  if (title.includes('quality') || title.includes('standard')) {
    return {
      opposite: ['Violation of established rules and regulations that exist', 'An unofficial examination of records without proper authority', 'Perfection in a product without any faults', 'A detailed description of anything without specific focus'],
      similar: ['Following established rules and regulations that are set', 'An official examination of records or processes done', 'A fault or imperfection in a product found', 'A detailed description of requirements or standards needed'],
      unrelated: ['Medical treatment provided for illness at the hospital', 'Sports competition taking place between rival teams today', 'Art techniques and methods used for painting pictures', 'Food preparation and cooking activities for making meals']
    };
  }

  if (title.includes('remote') && title.includes('work')) {
    return {
      opposite: ['Existing in physical space rather than online environment', 'Inability to handle data or workload that exists', 'Happening at the same time instead of delayed', 'The state of being disconnected from networks today'],
      similar: ['Existing online rather than in physical space today', 'The capacity to handle data or workload effectively', 'Not happening at the same time as others', 'The state of being connected to networks properly'],
      unrelated: ['Medical procedures and treatments performed for patients today', 'Sports performance taking place in the athletic games', 'Art creation process for display at the gallery', 'Food nutrition information important for good health today']
    };
  }

  if (title.includes('leadership') || title.includes('management')) {
    return {
      opposite: ['Avoiding responsibility for decisions and actions taken today', 'To restrict authority from someone who needs it', 'Secretive communication and actions without openness or honesty', 'An unclear idea without any direction or goals'],
      similar: ['Being responsible for decisions and actions you take', 'To give authority or confidence to someone else', 'Open and honest communication and actions with others', 'A clear idea of future goals and direction'],
      unrelated: ['Medical diagnosis of illness or disease by doctor', 'Sports training and exercise for fitness and health', 'Art exhibition displaying works at the local museum', 'Food cultivation activities for agriculture in the fields']
    };
  }

  // Personal Growth & Achievement (Intermediate)
  if (title.includes('personal') || title.includes('growth') || title.includes('achievement')) {
    return {
    opposite: [
        'Giving up when tasks become slightly difficult',
        'Avoiding improvement and remaining exactly the same',
        'Making no effort toward goals or responsibilities',
        'Falling behind after neglecting regular practice consistently'
    ],
    similar: [
        'Making steady improvement through regular practice and feedback',
        'Reaching personal milestones while working toward long-term goals',
        'Setting clear objectives and tracking progress carefully',
        'Learning new skills by overcoming challenges gradually'
    ],
    unrelated: [
        'A separate side project with a different objective',
        'A certificate awarded after completing formal coursework successfully',
        'A motivational speech delivered to inspire the audience',
        'A peer feedback session about team communication skills'
      ]
    };
  }
  
  // Default fallback for quiz or unlisted topics
  return {
    opposite: ['Something different from topic', 'The reverse meaning of concept', 'An opposite action to behavior', 'A contrary thing to subject'],
    similar: ['Something similar to concept', 'A related concept within topic', 'A comparable thing to subject', 'A like action within category'],
    unrelated: ['Something unrelated to topic', 'A different topic from subject', 'Another subject outside category', 'A separate matter from field']
  };
};

const generateDistractor = (correctDef: string, type: string, wordContext: string, setTitle: string): string => {
  const topicDistracts = getTopicDistracts(setTitle);
  
  const distractors = {
    opposite: topicDistracts.opposite,
    similar: topicDistracts.similar,
    unrelated: topicDistracts.unrelated
  };

    const typeDistractors = distractors[type as keyof typeof distractors] || distractors.unrelated;
  const selected = typeDistractors[Math.floor(Math.random() * typeDistractors.length)];
  
  return selected;
  };

  const handleAnswerSelect = (answerIndex: number) => {
    if (isAnswered) return; // Prevent multiple selections

    setSelectedAnswer(answerIndex);
    setIsAnswered(true);
    const correct = answerIndex === questions[currentWordIndex].correctAnswer;
    setIsCorrect(correct);
    setShowFeedback(true);

    // Track analytics for this question
    try {
      const timeSpent = Math.max(0, Math.round((Date.now() - questionStartRef.current) / 1000));
      analyticsService.recordResult({
        wordId: questions[currentWordIndex]?.word || String(currentWordIndex + 1),
        exerciseType: 'mcq',
        correct,
        timeSpent,
        timestamp: new Date(),
        score: correct ? 1 : 0,
      });
    } catch {}

    if (correct) {
      setPhaseCorrect(prev => prev + 1);
    } else {
      setDisplayScore(prev => {
        const next = Math.max(0, prev - 5);
        pendingScoreRef.current = next;
        return next;
      });
      triggerDeductionAnimation();
    }
    setIsProcessingNext(false);
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

  const handleNextPress = () => {
    if (!isAnswered || isProcessingNext) return;
    setIsProcessingNext(true);

    if (currentWordIndex < questions.length - 1) {
      nextWord();
    } else {
      onPhaseComplete(phaseCorrect, questions.length);
    }
  };

  const nextWord = () => {
    const nextIndex = Math.min(currentWordIndex + 1, questions.length - 1);
    // Pre-create animation values for the next question before render
    const nextOpts = questions[nextIndex]?.options || [];
    optionAnims.current = nextOpts.map(() => new Animated.Value(0));
    setCurrentWordIndex(nextIndex);
    setSelectedAnswer(null);
    setShowFeedback(false);
    setIsAnswered(false);
    questionStartRef.current = Date.now();

    Animated.timing(progressAnim, {
      toValue: (currentWordIndex + 1) / questions.length,
      duration: 100,
      useNativeDriver: false,
    }).start(() => {
      setIsProcessingNext(false);
    });
  };

  if (questions.length === 0) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.loadingText}>Loading questions...</Text>
      </View>
    );
  }

  const currentQuestion = questions[currentWordIndex];
  const deductionOpacity = deductionAnim.interpolate({
    inputRange: [0, 0.2, 1],
    outputRange: [0, 1, 0],
  });
  const deductionTranslateY = deductionAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, -35],
  });

  const escapeRegExp = (value: string) => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

  const renderSentenceWithHighlight = (sentence: string, target: string) => {
    const escaped = escapeRegExp(target.trim());
    const segments = escaped.split(/\s+/);
    const pattern = segments
      .map((segment, index) => (index === segments.length - 1 ? `${segment}\\w*` : segment))
      .join('\\s+');
    const regex = new RegExp(pattern, 'gi');

    const parts: Array<{ text: string; highlight: boolean }> = [];
    let lastIndex = 0;
    let match: RegExpExecArray | null;

    while ((match = regex.exec(sentence)) !== null) {
      if (match.index > lastIndex) {
        parts.push({ text: sentence.slice(lastIndex, match.index), highlight: false });
      }
      parts.push({ text: match[0], highlight: true });
      lastIndex = regex.lastIndex;
    }

    if (lastIndex < sentence.length) {
      parts.push({ text: sentence.slice(lastIndex), highlight: false });
    }

    return parts.map((part, index) => (
      <Text key={`${part.text}-${index}`} style={part.highlight ? styles.highlightedWord : undefined}>
        {part.text}
      </Text>
    ));
  };

  return (
    <View style={styles.container}>
      {/* Header with Progress and Score */}
      <View style={styles.header}>
        <View style={styles.progressContainer}>
          <Text style={styles.progressText}>
            Word {currentWordIndex + 1} of {questions.length}
          </Text>
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
          <Animated.View 
            style={[
              styles.progressFill, 
              { 
                width: progressAnim.interpolate({
                  inputRange: [0, 1],
                  outputRange: ['0%', '100%'],
                  extrapolate: 'clamp',
                })
              }
            ]} 
          />
        </View>
      </View>

      <Animated.View 
        style={{
          flex: 1,
          opacity: fadeAnim,
          transform: [{ translateX: slideAnim }],
          paddingHorizontal: 20,
          paddingTop: 24,
        }}
      >
        <View style={styles.wordHeader}>
          <Text style={styles.wordText}>{currentQuestion.word}</Text>
          <Text style={styles.ipaText}>{currentQuestion.ipa}</Text>
          <Text style={styles.exampleInline}>
            {renderSentenceWithHighlight(currentQuestion.example, currentQuestion.word)}
          </Text>
        </View>

        <View style={styles.optionsContainer}>
          {currentQuestion.options.map((option, index) => {
            const isSelected = selectedAnswer === index;
            const isCorrectOption = index === currentQuestion.correctAnswer;
            // If an animated value hasn't been prepared yet, render visible (1) to avoid invisible options
            const v = optionAnims.current[index] || new Animated.Value(1);
            const scale = v.interpolate({ inputRange: [0, 0.7, 1], outputRange: [0.86, 1.06, 1] });
            const opacity = v.interpolate({ inputRange: [0, 1], outputRange: [0, 1] });
            const translateY = v.interpolate({ inputRange: [0, 1], outputRange: [10, 0] });

            return (
              <Animated.View
                key={index}
                style={{ width: '100%', marginBottom: 12, transform: [{ translateY }, { scale }], opacity }}
              >
                <TouchableOpacity
                style={[
                  styles.optionButton,
                  (showFeedback && index === currentQuestion.correctAnswer) && styles.correctOption,
                  (showFeedback && isSelected && !isCorrectOption) && styles.wrongOption,
                ]}
                onPress={() => handleAnswerSelect(index)}
                disabled={isAnswered}
              >
                  <Text style={styles.optionText}>
                  {option}
                </Text>
              </TouchableOpacity>
              </Animated.View>
            );
          })}
        </View>

        {isAnswered && (
          <AnimatedNextButton
            onPress={handleNextPress}
            disabled={isProcessingNext}
          />
        )}

      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1E1E1E',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#252525',
  },
  loadingText: {
    fontSize: 16,
    color: '#9CA3AF',
  },
  header: {
    paddingHorizontal: 20,
    paddingVertical: 16,
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
    color: '#F2935C',
  },
  progressBar: {
    height: 6,
    backgroundColor: '#333',
    borderRadius: 3,
    overflow: 'hidden',
    marginBottom: 24,
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#F2935C',
    borderRadius: 3,
  },
  wordHeader: {
    alignItems: 'center',
    marginBottom: 32,
  },
  wordText: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 8,
  },
  ipaText: {
    fontSize: 18,
    color: '#9CA3AF',
    fontStyle: 'italic',
  },
  exampleInline: {
    marginTop: 8,
    fontSize: 14,
    color: '#9CA3AF',
    fontStyle: 'italic',
    textAlign: 'center',
  },
  optionsContainer: {
    marginBottom: 20,
  },
  optionButton: {
    backgroundColor: '#3A3A3A',
    borderRadius: 12,
    paddingVertical: 18,
    paddingHorizontal: 20,
    marginBottom: 0,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    minHeight: 72,
  },
  correctOption: {
    backgroundColor: '#437F76',
  },
  wrongOption: {
    backgroundColor: '#924646',
  },
  optionText: {
    fontSize: 16,
    color: '#fff',
    flex: 1,
    fontWeight: '500',
    textAlignVertical: 'center',
  },
  highlightedWord: {
    fontWeight: 'bold',
    color: '#F2935C',
  },
  nextButton: {
    marginTop: 16,
    backgroundColor: '#F2935C',
    borderRadius: 20,
    paddingVertical: 18,
    paddingHorizontal: 32,
    alignItems: 'center',
    alignSelf: 'center',
    minWidth: 160,
  },
  nextButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  nextButtonDisabled: {
    opacity: 0.6,
  },
});

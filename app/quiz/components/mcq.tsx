import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
  Easing,
  Dimensions,
  ScrollView
} from 'react-native';
import { ChevronRight, Volume2, Lightbulb } from 'lucide-react-native';
import { speak, setWebViewAudioPlayer } from '../../../lib/speech';
import LottieView from 'lottie-react-native';
import AudioPlayer, { AudioPlayerRef } from '../../../components/AudioPlayer';
import { useAppStore } from '../../../lib/store';
import { getTheme } from '../../../lib/theme';
import { levels } from '../data/levels';
import { analyticsService } from '../../../services/AnalyticsService';
import { soundService } from '../../../services/SoundService';
import AnimatedNextButton from './AnimatedNextButton';

interface MCQProps {
  setId: string;
  levelId: string;
  onPhaseComplete: (score: number, totalQuestions: number) => void;
  hearts: number;
  onHeartLost: () => void;
  onCorrectAnswer?: () => void;
  onIncorrectAnswer?: () => void;
  wordRange?: { start: number; end: number };
  // Optional override list for dynamic quizzes not present in levels.ts
  wordsOverride?: Array<{ word: string; phonetic: string; definition: string; example: string; synonyms?: string[] }>;
  showUfoAnimation?: boolean;
  ufoAnimationKey?: number;
  hintsRemaining?: number;
  onHintUsed?: () => void;
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
// Tiny holder to access theme in inline style closures without rerender churn
const mcqThemeHack: { theme?: string; colors?: any } = {};

// Global-ish context for Advanced enforcement inside generator fallbacks
let __ADV_CTX: { isAdvanced: boolean; words: Array<{ word: string; definition: string }> } = {
  isAdvanced: false,
  words: [],
};

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
  // IELTS curated MCQs
  ielts: {
    '1': {
      fluctuate: {
        correct: 'To change level up and down frequently',
        distractors: [
          'To make or become steady and consistent',
          'To decrease gradually in amount or strength',
          'To rise suddenly and strongly in number',
        ],
      },
      stabilize: {
        correct: 'To make or become steady and consistent',
        distractors: [
          'To change level up and down frequently',
          'To stop rising and stay almost unchanged',
          'To rise suddenly and strongly in number',
        ],
      },
      decline: {
        correct: 'To decrease gradually in amount or strength',
        distractors: [
          'To rise suddenly and strongly in number',
          'To stop rising and stay almost unchanged',
          'To make or become steady and consistent',
        ],
      },
      surge: {
        correct: 'To rise suddenly and strongly in number',
        distractors: [
          'To decrease gradually in amount or strength',
          'To change level up and down frequently',
          'To stop rising and stay almost unchanged',
        ],
      },
      plateau: {
        correct: 'To stop rising and stay almost unchanged',
        distractors: [
          'To make or become steady and consistent',
          'To change level up and down frequently',
          'To decrease gradually in amount or strength',
        ],
      },
    },
    '2': {
      investigate: {
        correct: 'To examine carefully to discover facts',
        distractors: [
          'To judge quality or amount after review',
          'To give reasons to support a decision',
          'To put a plan or decision into action',
        ],
      },
      assess: {
        correct: 'To judge quality or amount after review',
        distractors: [
          'To examine carefully to discover facts',
          'To give reasons to support a decision',
          'To change something to improve or correct',
        ],
      },
      justify: {
        correct: 'To give reasons to support a decision',
        distractors: [
          'To change something to improve or correct',
          'To put a plan or decision into action',
          'To examine carefully to discover facts',
        ],
      },
      implement: {
        correct: 'To put a plan or decision into action',
        distractors: [
          'To examine carefully to discover facts',
          'To judge quality or amount after review',
          'To change something to improve or correct',
        ],
      },
      revise: {
        correct: 'To change something to improve or correct',
        distractors: [
          'To judge quality or amount after review',
          'To give reasons to support a decision',
          'To put a plan or decision into action',
        ],
      },
    },
  },
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
    '11': {
      warn: {
        correct: 'To tell about danger to prevent harm',
        distractors: [
          'To officially allow someone to do something',
          'To say something is not allowed officially',
          'To give suggestions to help someone’s decision',
        ],
      },
      permit: {
        correct: 'To officially allow someone to do something',
        distractors: [
          'To say something is not allowed officially',
          'To give suggestions to help someone’s decision',
          'To tell about danger to prevent harm',
        ],
      },
      forbid: {
        correct: 'To say something is not allowed officially',
        distractors: [
          'To give suggestions to help someone’s decision',
          'To officially allow someone to do something',
          'To tell about danger to prevent harm',
        ],
      },
      advise: {
        correct: 'To give suggestions to help someone’s decision',
        distractors: [
          'To say something is not allowed officially',
          'To tell about danger to prevent harm',
          'To officially allow someone to do something',
        ],
      },
      request: {
        correct: 'To politely ask for something from someone',
        distractors: [
          'To give suggestions to help someone’s decision',
          'To officially allow someone to do something',
          'To tell about danger to prevent harm',
        ],
      },
    },
    '12': {
      charge: {
        correct: 'To ask payment amount for a service',
        distractors: [
          'To give money back after a problem',
          'To send goods to a customer somewhere',
          'To follow progress or location over time',
        ],
      },
      refund: {
        correct: 'To give money back after a problem',
        distractors: [
          'To ask payment amount for a service',
          'To put a new thing instead of old',
          'To send goods to a customer somewhere',
        ],
      },
      replace: {
        correct: 'To put a new thing instead of old',
        distractors: [
          'To follow progress or location over time',
          'To give money back after a problem',
          'To send goods to a customer somewhere',
        ],
      },
      ship: {
        correct: 'To send goods to a customer somewhere',
        distractors: [
          'To ask payment amount for a service',
          'To follow progress or location over time',
          'To give money back after a problem',
        ],
      },
      track: {
        correct: 'To follow progress or location over time',
        distractors: [
          'To send goods to a customer somewhere',
          'To put a new thing instead of old',
          'To ask payment amount for a service',
        ],
      },
    },
    '13': {
      persuade: {
        correct: 'To make someone agree by giving reasons',
        distractors: [
          'To speak strongly because you disagree',
          'To answer after receiving a message',
          'To stop someone speaking for a moment',
        ],
      },
      argue: {
        correct: 'To speak strongly because you disagree',
        distractors: [
          'To make someone agree by giving reasons',
          'To stop someone speaking for a moment',
          'To say sorry for a mistake',
        ],
      },
      reply: {
        correct: 'To answer after receiving a message',
        distractors: [
          'To speak strongly because you disagree',
          'To say sorry for a mistake',
          'To stop someone speaking for a moment',
        ],
      },
      interrupt: {
        correct: 'To stop someone speaking for a moment',
        distractors: [
          'To say sorry for a mistake',
          'To make someone agree by giving reasons',
          'To answer after receiving a message',
        ],
      },
      apologize: {
        correct: 'To say sorry for a mistake',
        distractors: [
          'To answer after receiving a message',
          'To stop someone speaking for a moment',
          'To speak strongly because you disagree',
        ],
      },
    },
    '14': {
      reserve: {
        correct: 'To book something for your future use',
        distractors: [
          'To make a period or length longer',
          'To change to a better, newer level',
          'To decide an event will not happen',
        ],
      },
      extend: {
        correct: 'To make a period or length longer',
        distractors: [
          'To change to a better, newer level',
          'To decide an event will not happen',
          'To book something for your future use',
        ],
      },
      upgrade: {
        correct: 'To change to a better, newer level',
        distractors: [
          'To decide an event will not happen',
          'To book something for your future use',
          'To make a period or length longer',
        ],
      },
      cancel: {
        correct: 'To decide an event will not happen',
        distractors: [
          'To make a period or length longer',
          'To change to a better, newer level',
          'To book something for your future use',
        ],
      },
      reschedule: {
        correct: 'To change a planned time to another',
        distractors: [
          'To decide an event will not happen',
          'To make a period or length longer',
          'To change to a better, newer level',
        ],
      },
    },
    '15': {
      assemble: {
        correct: 'To put parts together to make something',
        distractors: [
          'To change slightly so it fits better',
          'To join two things so they work',
          'To fasten firmly so it stays safe',
        ],
      },
      adjust: {
        correct: 'To change slightly so it fits better',
        distractors: [
          'To put parts together to make something',
          'To fasten firmly so it stays safe',
          'To join two things so they work',
        ],
      },
      connect: {
        correct: 'To join two things so they work',
        distractors: [
          'To put parts together to make something',
          'To fasten firmly so it stays safe',
          'To change slightly so it fits better',
        ],
      },
      secure: {
        correct: 'To fasten firmly so it stays safe',
        distractors: [
          'To join two things so they work',
          'To change slightly so it fits better',
          'To put parts together to make something',
        ],
      },
      polish: {
        correct: 'To rub a surface until it shines',
        distractors: [
          'To put parts together to make something',
          'To join two things so they work',
          'To fasten firmly so it stays safe',
        ],
      },
    },
    '16': {
      order: {
        correct: 'To ask for food or items to buy',
        distractors: [
          'To give food or help to people',
          'To try small amount to check flavor',
          'To cut something into small pieces quickly',
        ],
      },
      serve: {
        correct: 'To give food or help to people',
        distractors: [
          'To ask for food or items to buy',
          'To move food around to mix evenly',
          'To cut something into small pieces quickly',
        ],
      },
      taste: {
        correct: 'To try small amount to check flavor',
        distractors: [
          'To cut something into small pieces quickly',
          'To give food or help to people',
          'To move food around to mix evenly',
        ],
      },
      chop: {
        correct: 'To cut something into small pieces quickly',
        distractors: [
          'To ask for food or items to buy',
          'To try small amount to check flavor',
          'To move food around to mix evenly',
        ],
      },
      stir: {
        correct: 'To move food around to mix evenly',
        distractors: [
          'To give food or help to people',
          'To try small amount to check flavor',
          'To cut something into small pieces quickly',
        ],
      },
    },
    '17': {
      worry: {
        correct: 'To feel anxious about possible problems',
        distractors: [
          'To make someone feel happier or hopeful',
          'To stop being angry about someone’s mistake',
          'To say good things about someone’s work',
        ],
      },
      cheer: {
        correct: 'To make someone feel happier or hopeful',
        distractors: [
          'To feel anxious about possible problems',
          'To say good things about someone’s work',
          'To feel sorry about something that happened',
        ],
      },
      forgive: {
        correct: 'To stop being angry about someone’s mistake',
        distractors: [
          'To make someone feel happier or hopeful',
          'To feel sorry about something that happened',
          'To say good things about someone’s work',
        ],
      },
      praise: {
        correct: 'To say good things about someone’s work',
        distractors: [
          'To feel anxious about possible problems',
          'To stop being angry about someone’s mistake',
          'To feel sorry about something that happened',
        ],
      },
      regret: {
        correct: 'To feel sorry about something that happened',
        distractors: [
          'To make someone feel happier or hopeful',
          'To say good things about someone’s work',
          'To stop being angry about someone’s mistake',
        ],
      },
    },
    '18': {
      heat: {
        correct: 'To make something warmer using energy',
        distractors: [
          'To remove water so something becomes dry',
          'To bend paper or cloth into layers',
          'To press clothes flat with a hot iron',
        ],
      },
      cool: {
        correct: 'To make something less warm or hot',
        distractors: [
          'To make something warmer using energy',
          'To remove water so something becomes dry',
          'To press clothes flat with a hot iron',
        ],
      },
      dry: {
        correct: 'To remove water so something becomes dry',
        distractors: [
          'To make something less warm or hot',
          'To bend paper or cloth into layers',
          'To press clothes flat with a hot iron',
        ],
      },
      fold: {
        correct: 'To bend paper or cloth into layers',
        distractors: [
          'To make something warmer using energy',
          'To remove water so something becomes dry',
          'To press clothes flat with a hot iron',
        ],
      },
      iron: {
        correct: 'To press clothes flat with a hot iron',
        distractors: [
          'To make something less warm or hot',
          'To remove water so something becomes dry',
          'To bend paper or cloth into layers',
        ],
      },
    },
    '19': {
      paint: {
        correct: 'To cover a surface with colored liquid',
        distractors: [
          'To make pictures using lines and shapes',
          'To sleep outside in tents for fun',
          'To move through water using arms and legs',
        ],
      },
      draw: {
        correct: 'To make pictures using lines and shapes',
        distractors: [
          'To move through water using arms and legs',
          'To cover a surface with colored liquid',
          'To sleep outside in tents for fun',
        ],
      },
      camp: {
        correct: 'To sleep outside in tents for fun',
        distractors: [
          'To make pictures using lines and shapes',
          'To walk long distances for exercise',
          'To move through water using arms and legs',
        ],
      },
      hike: {
        correct: 'To walk long distances for exercise',
        distractors: [
          'To cover a surface with colored liquid',
          'To move through water using arms and legs',
          'To sleep outside in tents for fun',
        ],
      },
      swim: {
        correct: 'To move through water using arms and legs',
        distractors: [
          'To make pictures using lines and shapes',
          'To walk long distances for exercise',
          'To cover a surface with colored liquid',
        ],
      },
    },
    '20': {
      'fill in': {
        correct: 'To complete a form by writing details',
        distractors: [
          'To send work or forms for approval',
          'To make a paper copy from digital files',
          'To write your name to show agreement',
        ],
      },
      submit: {
        correct: 'To send work or forms for approval',
        distractors: [
          'To write your name to show agreement',
          'To store documents in a specific place',
          'To complete a form by writing details',
        ],
      },
      print: {
        correct: 'To make a paper copy from digital files',
        distractors: [
          'To send work or forms for approval',
          'To store documents in a specific place',
          'To write your name to show agreement',
        ],
      },
      sign: {
        correct: 'To write your name to show agreement',
        distractors: [
          'To make a paper copy from digital files',
          'To store documents in a specific place',
          'To complete a form by writing details',
        ],
      },
      file: {
        correct: 'To store documents in a specific place',
        distractors: [
          'To send work or forms for approval',
          'To make a paper copy from digital files',
          'To write your name to show agreement',
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
    '14': {
      contemplate: {
        correct: 'To think about something deeply and carefully',
        distractors: [
          'To support or strengthen something already existing',
          'To respond with opposing argument or action',
          'To mention briefly without detailed supporting evidence',
        ],
      },
      bolster: {
        correct: 'To support or strengthen something already existing',
        distractors: [
          'To make something seem less important',
          'To draw out a response or reaction',
          'To reduce or limit intensity through caution',
        ],
      },
      downplay: {
        correct: 'To make something seem less important',
        distractors: [
          'To think about something deeply and carefully',
          'To support or strengthen something already existing',
          'To present information clearly with helpful emphasis',
        ],
      },
      counter: {
        correct: 'To respond with opposing argument or action',
        distractors: [
          'To draw out a response or reaction',
          'To make something seem less important',
          'To question politely without offering firm opposition',
        ],
      },
      elicit: {
        correct: 'To draw out a response or reaction',
        distractors: [
          'To respond with opposing argument or action',
          'To think about something deeply and carefully',
          'To store information safely for later retrieval',
        ],
      },
    },
    '15': {
      fluctuate: {
        correct: 'To change level frequently, rising and falling',
        distractors: [
          'To make or become steady and consistent',
          'To increase speed or rate of change',
          'To reach a stable level after growth',
        ],
      },
      stabilize: {
        correct: 'To make or become steady and consistent',
        distractors: [
          'To change level frequently, rising and falling',
          'To become worse in quality or condition',
          'To increase speed or rate of change',
        ],
      },
      accelerate: {
        correct: 'To increase speed or rate of change',
        distractors: [
          'To make or become steady and consistent',
          'To reach a stable level after growth',
          'To change level frequently, rising and falling',
        ],
      },
      deteriorate: {
        correct: 'To become worse in quality or condition',
        distractors: [
          'To make or become steady and consistent',
          'To increase speed or rate of change',
          'To reach a stable level after growth',
        ],
      },
      plateau: {
        correct: 'To reach a stable level after growth',
        distractors: [
          'To change level frequently, rising and falling',
          'To become worse in quality or condition',
          'To make or become steady and consistent',
        ],
      },
    },
    '16': {
      verify: {
        correct: 'Confirm truth or accuracy through careful checks',
        distractors: [
          'Improve something by making small precise changes',
          'Create or express an idea in detail',
          'Collect evidence from witnesses for legal cases',
        ],
      },
      refine: {
        correct: 'Improve something by making small precise changes',
        distractors: [
          'Confirm truth or accuracy through careful checks',
          'Find a way through a situation successfully',
          'Remove errors found during final quality checks',
        ],
      },
      formulate: {
        correct: 'Create or express an idea in detail',
        distractors: [
          'Confirm truth or accuracy through careful checks',
          'Explain or make clear using examples',
          'Summarize key ideas without detailed explanations',
        ],
      },
      illustrate: {
        correct: 'Explain or make clear using examples',
        distractors: [
          'Create or express an idea in detail',
          'Improve something by making small precise changes',
          'List features without providing specific real-world examples',
        ],
      },
      navigate: {
        correct: 'Find a way through a situation successfully',
        distractors: [
          'Confirm truth or accuracy through careful checks',
          'Create or express an idea in detail',
          'Delay action until better options appear later',
        ],
      },
    },
    '17': {
      alleviate: {
        correct: 'To make pain or problems less severe',
        distractors: [
          'To make a difficult situation even worse',
          'To describe something precisely and in detail',
          'To postpone action until circumstances significantly improve',
        ],
      },
      exacerbate: {
        correct: 'To make a difficult situation even worse',
        distractors: [
          'To make pain or problems less severe',
          'To help opposing sides reach an agreement',
          'To measure progress using carefully defined indicators',
        ],
      },
      ascertain: {
        correct: 'To find out something with reliable certainty',
        distractors: [
          'To describe something precisely and in detail',
          'To help opposing sides reach an agreement',
          'To guess likely outcomes without firm evidence',
        ],
      },
      delineate: {
        correct: 'To describe something precisely and in detail',
        distractors: [
          'To find out something with reliable certainty',
          'To make a difficult situation even worse',
          'To organize ideas into logical priority order',
        ],
      },
      mediate: {
        correct: 'To help opposing sides reach an agreement',
        distractors: [
          'To find out something with reliable certainty',
          'To make pain or problems less severe',
          'To enforce rules strictly without any exceptions',
        ],
      },
    },
    '18': {
      emphasize: {
        correct: 'To give special importance or extra attention',
        distractors: [
          'To accept or admit the truth of something',
          'To express doubt or challenge stated assumptions',
          'To summarize main points without detailed evidence',
        ],
      },
      acknowledge: {
        correct: 'To accept or admit the truth of something',
        distractors: [
          'To change to suit new conditions or uses',
          'To make up for loss or damage',
          'To repeat information without evaluating its accuracy',
        ],
      },
      adapt: {
        correct: 'To change to suit new conditions or uses',
        distractors: [
          'To give special importance or extra attention',
          'To accept or admit the truth of something',
          'To remove features that are no longer relevant',
        ],
      },
      compensate: {
        correct: 'To make up for loss or damage',
        distractors: [
          'To express doubt or challenge stated assumptions',
          'To give special importance or extra attention',
          'To provide extra resources to match new expectations',
        ],
      },
      question: {
        correct: 'To express doubt or challenge stated assumptions',
        distractors: [
          'To change to suit new conditions or uses',
          'To accept or admit the truth of something',
          'To collect statements supporting a particular conclusion',
        ],
      },
    },
    '19': {
      expedite: {
        correct: 'To make a process happen faster',
        distractors: [
          'To make progress difficult or slow',
          'To support and maintain rules or decisions',
          'To begin an activity or process',
        ],
      },
      hamper: {
        correct: 'To make progress difficult or slow',
        distractors: [
          'To make a process happen faster',
          'To argue or claim something is true',
          'To reduce something in extent or amount',
        ],
      },
      contend: {
        correct: 'To argue or claim something is true',
        distractors: [
          'To make a process happen faster',
          'To support and maintain rules or decisions',
          'To express doubt about accepted assumptions',
        ],
      },
      dispel: {
        correct: 'To make something disappear, especially doubts',
        distractors: [
          'To argue or claim something is true',
          'To make progress difficult or slow',
          'To gather and combine information coherently',
        ],
      },
      uphold: {
        correct: 'To support and maintain rules or decisions',
        distractors: [
          'To make something disappear, especially doubts',
          'To make a process happen faster',
          'To formally approve a plan after review',
        ],
      },
    },
    '20': {
      evaluate: {
        correct: 'Judge something’s value, quality, or effectiveness',
        distractors: [
          'Represent something in words, pictures, or symbols',
          'Publicly approve or support someone, product, or idea',
          'Collect information without forming any judgement or conclusion',
        ],
      },
      depict: {
        correct: 'Represent something in words, pictures, or symbols',
        distractors: [
          'Leave out something, either accidentally or deliberately',
          'Act against something; argue it should not happen',
          'Summarize events briefly without describing visual details',
        ],
      },
      omit: {
        correct: 'Leave out something, either accidentally or deliberately',
        distractors: [
          'Judge something’s value, quality, or effectiveness',
          'Include everything, even irrelevant or repeated information',
          'Record each detail carefully for future reference',
        ],
      },
      oppose: {
        correct: 'Act against something; argue it should not happen',
        distractors: [
          'Represent something in words, pictures, or symbols',
          'Publicly approve or support someone, product, or idea',
          'Consider both sides without taking a position',
        ],
      },
      endorse: {
        correct: 'Publicly approve or support someone, product, or idea',
        distractors: [
          'Leave out something, either accidentally or deliberately',
          'Criticize publicly to discourage others from participating',
          'Question claims to test their logical consistency',
        ],
      },
    },
    '21': {
      allege: {
        correct: 'To claim something as true without proof',
        distractors: [
          'To mention evidence as support in argument',
          'To encourage the development of something positive',
          'To present formal charges in a court',
        ],
      },
      cite: {
        correct: 'To mention evidence as support in argument',
        distractors: [
          'To claim something as true without proof',
          'To remove references during the final editing stage',
          'To list sources without evaluating their credibility',
        ],
      },
      foster: {
        correct: 'To encourage the development of something positive',
        distractors: [
          'To discourage someone from acting through fear',
          'To make something more varied in type',
          'To provide temporary resources during urgent emergencies',
        ],
      },
      deter: {
        correct: 'To discourage someone from acting through fear',
        distractors: [
          'To encourage the development of something positive',
          'To enforce rules strictly across all situations',
          'To block entry by installing stronger barriers',
        ],
      },
      diversify: {
        correct: 'To make something more varied in type',
        distractors: [
          'To mention evidence as support in argument',
          'To specialize narrowly in one chosen area',
          'To combine parts into one unified whole',
        ],
      },
    },
    '22': {
      investigate: {
        correct: 'To examine a subject carefully for facts',
        distractors: [
          'To reach a conclusion from available evidence',
          'To suggest possible explanations without certain proof',
          'To record results neatly in organized tables',
        ],
      },
      deduce: {
        correct: 'To reach a conclusion from available evidence',
        distractors: [
          'To examine a subject carefully for facts',
          'To suggest possible explanations without certain proof',
          'To compare cases and list main differences',
        ],
      },
      speculate: {
        correct: 'To suggest possible explanations without certain proof',
        distractors: [
          'To reach a conclusion from available evidence',
          'To gather opinions or data from many people',
          'To present tested claims with strong evidence',
        ],
      },
      probe: {
        correct: 'To explore something deeply to discover information',
        distractors: [
          'To examine a subject carefully for facts',
          'To gather opinions or data from many people',
          'To map findings onto a visual diagram',
        ],
      },
      survey: {
        correct: 'To gather opinions or data from many people',
        distractors: [
          'To explore something deeply to discover information',
          'To reach a conclusion from available evidence',
          'To distribute forms requesting signatures from neighbors',
        ],
      },
    },
    '23': {
      streamline: {
        correct: 'To simplify a process for greater efficiency',
        distractors: [
          'To make a task operate by itself',
          'To combine separate parts into one stronger whole',
          'To publish steps without enforcing consistent procedures',
        ],
      },
      automate: {
        correct: 'To make a task operate by itself',
        distractors: [
          'To simplify a process for greater efficiency',
          'To make procedures consistent according to set rules',
          'To repeat steps to improve each version',
        ],
      },
      consolidate: {
        correct: 'To combine separate parts into one stronger whole',
        distractors: [
          'To make a task operate by itself',
          'To repeat steps to improve each version',
          'To enforce formatting without checking actual outcomes',
        ],
      },
      standardize: {
        correct: 'To make procedures consistent according to set rules',
        distractors: [
          'To combine separate parts into one stronger whole',
          'To simplify a process for greater efficiency',
          'To measure outcomes without changing any inputs',
        ],
      },
      iterate: {
        correct: 'To repeat steps to improve each version',
        distractors: [
          'To simplify a process for greater efficiency',
          'To make procedures consistent according to set rules',
          'To make a task operate by itself',
        ],
      },
    },
    '24': {
      paraphrase: {
        correct: 'To express the same meaning using different words',
        distractors: [
          'To present main points briefly and clearly',
          'To add detail to explain more fully',
          'To refer indirectly without stating something directly',
        ],
      },
      summarize: {
        correct: 'To present main points briefly and clearly',
        distractors: [
          'To express the same meaning using different words',
          'To say something again for clarity',
          'To refer indirectly without stating something directly',
        ],
      },
      elaborate: {
        correct: 'To add detail to explain more fully',
        distractors: [
          'To present main points briefly and clearly',
          'To say something again for clarity',
          'To refer indirectly without stating something directly',
        ],
      },
      allude: {
        correct: 'To refer indirectly without stating something directly',
        distractors: [
          'To present main points briefly and clearly',
          'To express the same meaning using different words',
          'To add detail to explain more fully',
        ],
      },
      reiterate: {
        correct: 'To say something again for clarity',
        distractors: [
          'To refer indirectly without stating something directly',
          'To add detail to explain more fully',
          'To present main points briefly and clearly',
        ],
      },
    },
    '25': {
      authorize: {
        correct: 'To officially permit or approve an action',
        distractors: [
          'To formally forbid an action by rule',
          'To officially require that something be done',
          'To choose not to enforce a right',
        ],
      },
      prohibit: {
        correct: 'To formally forbid an action by rule',
        distractors: [
          'To officially require that something be done',
          'To choose not to enforce a right',
          'To officially permit or approve an action',
        ],
      },
      mandate: {
        correct: 'To officially require that something be done',
        distractors: [
          'To formally forbid an action by rule',
          'To choose not to enforce a right',
          'To free someone from a required duty',
        ],
      },
      exempt: {
        correct: 'To free someone from a required duty',
        distractors: [
          'To choose not to enforce a right',
          'To formally forbid an action by rule',
          'To officially permit or approve an action',
        ],
      },
      waive: {
        correct: 'To choose not to enforce a right',
        distractors: [
          'To officially require that something be done',
          'To formally forbid an action by rule',
          'To free someone from a required duty',
        ],
      },
    },
    '26': {
      invest: {
        correct: 'To commit money to earn future returns',
        distractors: [
          'To sell assets or withdraw from holdings',
          'To obtain needed goods or services',
          'To repay someone for incurred expenses',
        ],
      },
      divest: {
        correct: 'To sell assets or withdraw from holdings',
        distractors: [
          'To commit money to earn future returns',
          'To reduce financial risk by balancing positions',
          'To obtain needed goods or services',
        ],
      },
      procure: {
        correct: 'To obtain needed goods or services',
        distractors: [
          'To repay someone for incurred expenses',
          'To sell assets or withdraw from holdings',
          'To reduce financial risk by balancing positions',
        ],
      },
      reimburse: {
        correct: 'To repay someone for incurred expenses',
        distractors: [
          'To obtain needed goods or services',
          'To commit money to earn future returns',
          'To reduce financial risk by balancing positions',
        ],
      },
      hedge: {
        correct: 'To reduce financial risk by balancing positions',
        distractors: [
          'To sell assets or withdraw from holdings',
          'To repay someone for incurred expenses',
          'To commit money to earn future returns',
        ],
      },
    },
    '27': {
      deploy: {
        correct: 'To put a system or resource into use',
        distractors: [
          'To set options so something works correctly',
          'To find and fix problems in operation',
          'To return something to its previous state',
        ],
      },
      configure: {
        correct: 'To set options so something works correctly',
        distractors: [
          'To return something to its previous state',
          'To put a system or resource into use',
          'To find and fix problems in operation',
        ],
      },
      troubleshoot: {
        correct: 'To find and fix problems in operation',
        distractors: [
          'To make things happen at the same time',
          'To set options so something works correctly',
          'To return something to its previous state',
        ],
      },
      restore: {
        correct: 'To return something to its previous state',
        distractors: [
          'To put a system or resource into use',
          'To make things happen at the same time',
          'To find and fix problems in operation',
        ],
      },
      synchronize: {
        correct: 'To make things happen at the same time',
        distractors: [
          'To return something to its previous state',
          'To put a system or resource into use',
          'To set options so something works correctly',
        ],
      },
    },
    '28': {
      conserve: {
        correct: 'To protect and use resources carefully to last',
        distractors: [
          'To control activities through rules and oversight',
          'To support costs with money from authorities',
          'To encourage actions by offering benefits or rewards',
        ],
      },
      regulate: {
        correct: 'To control activities through rules and oversight',
        distractors: [
          'To limit what people can do legally',
          'To support costs with money from authorities',
          'To protect and use resources carefully to last',
        ],
      },
      subsidize: {
        correct: 'To support costs with money from authorities',
        distractors: [
          'To encourage actions by offering benefits or rewards',
          'To control activities through rules and oversight',
          'To limit what people can do legally',
        ],
      },
      incentivize: {
        correct: 'To encourage actions by offering benefits or rewards',
        distractors: [
          'To limit what people can do legally',
          'To support costs with money from authorities',
          'To protect and use resources carefully to last',
        ],
      },
      restrict: {
        correct: 'To limit what people can do legally',
        distractors: [
          'To control activities through rules and oversight',
          'To encourage actions by offering benefits or rewards',
          'To support costs with money from authorities',
        ],
      },
    },
    '29': {
      reassure: {
        correct: 'To comfort someone and reduce their anxiety',
        distractors: [
          'To understand and share another person’s feelings',
          'To face a difficult issue directly and firmly',
          'To make someone less likely to try',
        ],
      },
      empathize: {
        correct: 'To understand and share another person’s feelings',
        distractors: [
          'To comfort someone and reduce their anxiety',
          'To make someone less likely to try',
          'To respect and appreciate someone’s good qualities',
        ],
      },
      discourage: {
        correct: 'To make someone less likely to try',
        distractors: [
          'To face a difficult issue directly and firmly',
          'To comfort someone and reduce their anxiety',
          'To understand and share another person’s feelings',
        ],
      },
      confront: {
        correct: 'To face a difficult issue directly and firmly',
        distractors: [
          'To understand and share another person’s feelings',
          'To make someone less likely to try',
          'To comfort someone and reduce their anxiety',
        ],
      },
      admire: {
        correct: 'To respect and appreciate someone’s good qualities',
        distractors: [
          'To comfort someone and reduce their anxiety',
          'To face a difficult issue directly and firmly',
          'To understand and share another person’s feelings',
        ],
      },
    },
    '30': {
      curate: {
        correct: 'To select and organize content for an audience',
        distractors: [
          'To manage discussion and keep it respectful',
          'To add notes that explain or comment',
          'To transmit information widely by media channels',
        ],
      },
      moderate: {
        correct: 'To manage discussion and keep it respectful',
        distractors: [
          'To add notes that explain or comment',
          'To select and organize content for an audience',
          'To transmit information widely by media channels',
        ],
      },
      annotate: {
        correct: 'To add notes that explain or comment',
        distractors: [
          'To transmit information widely by media channels',
          'To manage discussion and keep it respectful',
          'To select and organize content for an audience',
        ],
      },
      broadcast: {
        correct: 'To transmit information widely by media channels',
        distractors: [
          'To add notes that explain or comment',
          'To select and organize content for an audience',
          'To manage discussion and keep it respectful',
        ],
      },
      caption: {
        correct: 'To add brief text describing an image',
        distractors: [
          'To transmit information widely by media channels',
          'To manage discussion and keep it respectful',
          'To select and organize content for an audience',
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

export default function MCQComponent({ setId, levelId, onPhaseComplete, hearts, onHeartLost, onCorrectAnswer, onIncorrectAnswer, wordRange, wordsOverride, showUfoAnimation, ufoAnimationKey = 0, hintsRemaining = 0, onHintUsed }: MCQProps) {
  const themeName = useAppStore(s => s.theme);
  const colors = getTheme(themeName);
  const isLight = themeName === 'light';
  const [currentWordIndex, setCurrentWordIndex] = useState(0);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [hiddenOptions, setHiddenOptions] = useState<number[]>([]); // Indices of options to hide when hint used
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [showFeedback, setShowFeedback] = useState(false);
  const [isCorrect, setIsCorrect] = useState(false);
  const [isAnswered, setIsAnswered] = useState(false);
  const [isProcessingNext, setIsProcessingNext] = useState(false);
  const [phaseCorrect, setPhaseCorrect] = useState(0);
  const optionAnims = useRef<Animated.Value[]>([]);
  const heartLostAnim = useRef(new Animated.Value(1)).current;

  // Animation refs
  const fadeAnim = useRef(new Animated.Value(1)).current;
  const slideAnim = useRef(new Animated.Value(0)).current;
  const progressAnim = useRef(new Animated.Value(0)).current;
  const questionStartRef = useRef<number>(Date.now());
  const mountFadeAnim = useRef(new Animated.Value(0)).current;
  const audioPlayerRef = useRef<AudioPlayerRef>(null);

  // Register AudioPlayer with speech module
  useEffect(() => {
    if (audioPlayerRef.current) {
      setWebViewAudioPlayer(audioPlayerRef.current);
    }
    return () => {
      setWebViewAudioPlayer(null);
    };
  }, []);

  // Fade in on mount
  useEffect(() => {
    Animated.timing(mountFadeAnim, {
      toValue: 1,
      duration: 400,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start();
  }, []);

  useEffect(() => {
    console.log('MCQComponent - useEffect triggered:', { setId, levelId, wordRange, hasOverride: !!wordsOverride });
    generateQuestions();
  }, [setId, levelId, wordRange?.start, wordRange?.end, wordsOverride && (wordsOverride as any).length]);

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
    
    const levelKey = String(levelId || '').toLowerCase();
    const level = levels.find(l => (l.id || '').toLowerCase() === levelKey) || levels.find(l => (l.name || '').toLowerCase() === levelKey);
    console.log('MCQComponent - Found level:', level?.name, 'levelId:', levelId, 'cefr:', level?.cefr);
    if (!level && !wordsOverride) return;

    const set = level?.sets.find(s => s.id.toString() === setId);
    console.log('MCQComponent - Found set:', set?.title);
    if (!wordsOverride && (!set || !set.words)) return;

    // Apply word range if specified
    let words = (wordsOverride as any) || set?.words || [];
    if (wordRange) {
      words = words.slice(wordRange.start, wordRange.end);
      console.log('MCQComponent - Using word range:', wordRange, 'Words:', words.length);
    }

    // Advanced/Beginner rule: use ONLY definitions from other words in the same set
    // as distractors (no made-up options). Each regular set has 5 words, so for
    // each question we have 4 candidate distractors from peer definitions.
    const cefrUpper = String(level?.cefr || '').toUpperCase();
    // Treat Proficient (C2) like Advanced for distractor rules
    const isAdvancedB2C1 =
      /advanced/i.test(String(levelId || '')) ||
      /advanced/i.test(String(level?.name || '')) ||
      cefrUpper.includes('B2-C1') ||
      cefrUpper.includes('C1+') ||
      cefrUpper.includes('C2') ||
      /proficient/i.test(String(level?.name || '')) ||
      String(level?.id || '').toLowerCase() === 'proficient';
    const isBeginnerA1A2 = /(^|\b)beginner(\b|$)/i.test(String(levelId || '')) || /(^|\b)beginner(\b|$)/i.test(String(level?.name || '')) || cefrUpper.includes('A1-A2') || cefrUpper.includes('A1') || cefrUpper.includes('A2');
    const isIntermediateB1 = (String(levelId || '').toLowerCase() === 'intermediate') || (String(level?.id || '').toLowerCase() === 'intermediate') || (String(level?.name || '').toLowerCase() === 'intermediate') || (cefrUpper === 'B1');
    const isUpperIntermediate = /upper.?intermediate/i.test(String(levelId || '')) || /upper.?intermediate/i.test(String(level?.name || '')) || /upper.?intermediate/i.test(String(level?.id || '')) || cefrUpper.includes('B1+') || cefrUpper === 'B2';
    // Use peer definitions for ALL levels
    if (isAdvancedB2C1 || isBeginnerA1A2 || isIntermediateB1 || isUpperIntermediate || true) {
      const mode = isAdvancedB2C1 ? 'Advanced' : isBeginnerA1A2 ? 'Beginner' : 'Intermediate';
      console.log(`MCQComponent - Using ${mode} peer-definition mode`);
      // Seed advanced context for any deeper fallback paths
      __ADV_CTX = { isAdvanced: true, words: (words as any[]).map(w => ({ word: w.word, definition: w.definition })) };
      const advQuestions: Question[] = words.map(w => {
        // Use the exact definitions as written in content for Advanced
        const correct = String(w.definition || '').trim();
        // Candidate distractors = definitions of other words in this set/range
        const candidates = (words as any[])
          .filter(x => x.word !== w.word)
          .map(x => String(x.definition || '').trim())
          .filter(d => d && d !== correct);
        // Deduplicate while preserving order
        const seen = new Set<string>();
        const unique = candidates.filter(d => {
          const key = d.toLowerCase();
          if (seen.has(key)) return false;
          seen.add(key);
          return true;
        });
        // Randomize and take 3
        const distractors = unique
          .map(option => ({ option, sort: Math.random() }))
          .sort((a, b) => a.sort - b.sort)
          .map(({ option }) => option)
          .slice(0, 3);
        console.log('MCQComponent - PEER word:', w.word, 'correct:', correct, 'peer distractors:', distractors);

        // Fallback (very rare: if fewer than 3 after dedupe), pad with any remaining uniques
        while (distractors.length < 3 && unique.length > distractors.length) {
          const next = unique[distractors.length];
          if (next && !distractors.includes(next) && next !== correct) distractors.push(next);
          else break;
        }

        const allOptions = [correct, ...distractors];
        const shuffledOptions = allOptions
          .map(option => ({ option, sort: Math.random() }))
          .sort((a, b) => a.sort - b.sort)
          .map(({ option }) => option);
        const correctIndex = shuffledOptions.indexOf(correct);

        return {
          word: w.word,
          ipa: w.phonetic,
          definition: correct,
          example: w.example,
          options: shuffledOptions,
          correctAnswer: correctIndex,
          synonyms: w.synonyms || [],
        } as Question;
      });

      setQuestions(advQuestions);
      // Clear context so it doesn't leak into non-advanced sets later
      __ADV_CTX = { isAdvanced: false, words: [] };
      // Initialize option animation values for the first question to avoid a flash
      const firstOptions = advQuestions[0]?.options || [];
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
      return;
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

    // Seed context for generic path too (defensive) - use peer definitions for ALL levels
    __ADV_CTX = { isAdvanced: true, words: (words as any[]).map(w => ({ word: w.word, definition: w.definition })) };
    const generatedQuestions: Question[] = words.map(word => {
      // Check for exact override first
      const override = set ? MCQ_OVERRIDES[levelId || '']?.[String(set.id)]?.[word.word.toLowerCase()] : undefined;
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
      let distractors: string[] = [];

      // Strong fallback for Advanced (B2–C1): prefer peer definitions from the same set
      const cefrUp2 = String(level?.cefr || '').toUpperCase();
      const isAdvancedLoose =
        /advanced/i.test(String(level?.id || '')) ||
        /advanced/i.test(level?.name || '') ||
        cefrUp2.includes('B2-C1') ||
        cefrUp2.includes('C1+') ||
        cefrUp2.includes('C2') ||
        /proficient/i.test(String(level?.name || '')) ||
        String(level?.id || '').toLowerCase() === 'proficient';
      const isBeginnerLoose = /(^|\b)beginner(\b|$)/i.test(String(level?.id || '')) || /(^|\b)beginner(\b|$)/i.test(level?.name || '') || cefrUp2.includes('A1') || cefrUp2.includes('A2');
      const isIntermediateLoose = (String(level?.id || '').toLowerCase() === 'intermediate') || (String(level?.name || '').toLowerCase() === 'intermediate') || (cefrUp2 === 'B1');
      if ((isAdvancedLoose || isBeginnerLoose || isIntermediateLoose) && set && Array.isArray(words) && words.length > 1) {
        const peerDefs = (words as any[])
          .filter(w => w.word !== word.word)
          .map(w => String(w.definition || '').trim())
          .filter(d => d && d.toLowerCase() !== shortDefinition.toLowerCase());
        const seenPeer = new Set<string>();
        const uniquePeers = peerDefs.filter(d => {
          const key = d.toLowerCase();
          if (seenPeer.has(key)) return false;
          seenPeer.add(key);
          return true;
        });
        distractors = uniquePeers
          .map(option => ({ option, sort: Math.random() }))
          .sort((a, b) => a.sort - b.sort)
          .map(({ option }) => option)
          .slice(0, 3);
        console.log('MCQComponent - ADV prefill peers for', word.word, ':', distractors);
      }
      const types = ['opposite', 'similar', 'unrelated'];
      
      // Try to get 3 unique distractors
      let attempts = 0;
      const maxAttempts = 20; // Prevent infinite loop
      
      while (distractors.length < 3 && attempts < maxAttempts) {
        const type = types[distractors.length % types.length];
        const setTitle = (set && (set as any).title) ? (set as any).title : '';
        const distractor = clampPhrase(
          generateDistractor(shortDefinition, type, word.word, setTitle)
        );
        
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
      
      // Final enforcement: for Advanced (B2–C1), ensure distractors are peer definitions
      if (isAdvancedLoose && set && Array.isArray(words) && words.length > 1) {
        const peerDefs = (words as any[])
          .filter(w => w.word !== word.word)
          .map(w => String(w.definition || '').trim())
          .filter(d => d && d.toLowerCase() !== shortDefinition.toLowerCase());
        const seen = new Set<string>();
        const uniquePeers = peerDefs.filter(d => {
          const key = d.toLowerCase();
          if (seen.has(key)) return false;
          seen.add(key);
          return true;
        });
        if (uniquePeers.length >= 3) {
          distractors = uniquePeers
            .map(option => ({ option, sort: Math.random() }))
            .sort((a, b) => a.sort - b.sort)
            .map(({ option }) => option)
            .slice(0, 3);
          console.log('MCQComponent - ADV final enforcement for', word.word, ':', distractors);
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
    // Clear context after generating
    __ADV_CTX = { isAdvanced: false, words: [] };
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

  // Upper-Intermediate B2 Level Topics

  // Descriptive & Attitudes
  if (title.includes('descriptive') || title.includes('attitudes') || title.includes('actions')) {
    return {
      opposite: [
        'To remain passive without taking any action',
        'To show indifference toward the outcome',
        'To avoid responsibility for decisions made',
        'To maintain the status quo without change'
      ],
      similar: [
        'To take initiative in addressing issues',
        'To demonstrate commitment to a goal',
        'To accept accountability for results',
        'To implement changes when necessary'
      ],
      unrelated: [
        'A recipe for preparing traditional cuisine',
        'A guideline for maintaining physical fitness',
        'A schedule for public transportation routes',
        'A manual for operating household appliances'
      ]
    };
  }

  // Decisions & Delivery
  if (title.includes('decision') || title.includes('delivery')) {
    return {
      opposite: [
        'To postpone making a choice indefinitely',
        'To withhold information from stakeholders',
        'To abandon a project before completion',
        'To ignore deadlines and schedules'
      ],
      similar: [
        'To reach a conclusion after consideration',
        'To provide results on time as promised',
        'To fulfill commitments and obligations',
        'To meet expectations consistently'
      ],
      unrelated: [
        'A technique for artistic expression',
        'A method for preserving food items',
        'A practice for meditation and relaxation',
        'A strategy for winning competitive games'
      ]
    };
  }

  // Compare & Explain
  if (title.includes('compare') || title.includes('explain') || title.includes('restate')) {
    return {
      opposite: [
        'To overlook differences between options',
        'To leave concepts unclear and confusing',
        'To misrepresent facts or information',
        'To complicate simple ideas unnecessarily'
      ],
      similar: [
        'To analyze similarities and differences',
        'To clarify meaning for better understanding',
        'To describe accurately using examples',
        'To simplify complex information clearly'
      ],
      unrelated: [
        'A tool for measuring physical distances',
        'A device for recording audio content',
        'A container for storing liquid beverages',
        'A vehicle for transporting heavy cargo'
      ]
    };
  }

  // Planning & Problem Solving & Coordination
  if (title.includes('planning') || title.includes('problem') || title.includes('coordination')) {
    return {
      opposite: [
        'To act without any prior preparation',
        'To ignore obstacles and difficulties',
        'To work independently without collaboration',
        'To react impulsively without strategy'
      ],
      similar: [
        'To organize activities in advance',
        'To find solutions to challenges faced',
        'To synchronize efforts with team members',
        'To anticipate potential issues proactively'
      ],
      unrelated: [
        'A performance for entertainment purposes',
        'A celebration marking special occasions',
        'A competition between athletic teams',
        'A gathering for social interaction'
      ]
    };
  }

  // Evaluation & Reasoning
  if (title.includes('evaluation') || title.includes('reasoning') || title.includes('evaluate')) {
    return {
      opposite: [
        'To accept claims without any analysis',
        'To make decisions based on emotion only',
        'To dismiss evidence without consideration',
        'To reach conclusions without justification'
      ],
      similar: [
        'To assess quality against set criteria',
        'To think logically about situations',
        'To weigh pros and cons carefully',
        'To support conclusions with valid arguments'
      ],
      unrelated: [
        'A routine for daily physical exercise',
        'A process for manufacturing products',
        'A procedure for medical examinations',
        'A system for organizing personal files'
      ]
    };
  }

  // Advocacy & Analysis & Claims
  if (title.includes('advocacy') || title.includes('analysis') || title.includes('claims') || title.includes('argument')) {
    return {
      opposite: [
        'To remain neutral without taking sides',
        'To accept information at face value',
        'To withdraw support from a cause',
        'To concede points without objection'
      ],
      similar: [
        'To support a position with conviction',
        'To examine data to draw conclusions',
        'To assert opinions based on evidence',
        'To defend ideas against criticism'
      ],
      unrelated: [
        'A method for preparing healthy meals',
        'A technique for landscaping gardens',
        'A practice for learning musical instruments',
        'A guide for planning vacation trips'
      ]
    };
  }

  // Evidence & Methods & Inquiry & Research
  if (title.includes('evidence') || title.includes('method') || title.includes('inquiry') || title.includes('research')) {
    return {
      opposite: [
        'To rely on assumptions without proof',
        'To use random approaches without structure',
        'To avoid asking questions about topics',
        'To accept results without verification'
      ],
      similar: [
        'To gather facts that support findings',
        'To follow systematic procedures carefully',
        'To investigate topics through questioning',
        'To study subjects using proven techniques'
      ],
      unrelated: [
        'A recipe for baking desserts at home',
        'A routine for morning skincare habits',
        'A schedule for weekly cleaning tasks',
        'A plan for organizing birthday parties'
      ]
    };
  }

  // Data & Clarity & Verify & Refine
  if (title.includes('data') || title.includes('clarity') || title.includes('verify') || title.includes('refine')) {
    return {
      opposite: [
        'To present information in confusing ways',
        'To accept data without checking accuracy',
        'To leave work in rough unfinished form',
        'To ignore errors and inconsistencies'
      ],
      similar: [
        'To organize information systematically',
        'To confirm facts through checking sources',
        'To improve quality through revisions',
        'To ensure accuracy in all details'
      ],
      unrelated: [
        'A game played for casual entertainment',
        'A show watched for relaxation time',
        'A hobby pursued during free hours',
        'A sport practiced for physical fitness'
      ]
    };
  }

  // Legal & Compliance & Authorize & Prohibit
  if (title.includes('legal') || title.includes('compliance') || title.includes('authorize') || title.includes('prohibit')) {
    return {
      opposite: [
        'To violate rules and regulations knowingly',
        'To act without proper permission granted',
        'To allow activities that are forbidden',
        'To ignore legal requirements completely'
      ],
      similar: [
        'To follow laws and established guidelines',
        'To grant official approval for actions',
        'To restrict activities that cause harm',
        'To ensure adherence to set standards'
      ],
      unrelated: [
        'A dish prepared for family dinner meals',
        'A trip planned for summer vacation time',
        'A song played at celebration events',
        'A book read for personal enjoyment'
      ]
    };
  }

  // Change & Correction & Trends
  if (title.includes('change') || title.includes('correction') || title.includes('trends') || title.includes('adapt')) {
    return {
      opposite: [
        'To maintain existing conditions unchanged',
        'To ignore mistakes without fixing them',
        'To resist new developments stubbornly',
        'To remain inflexible despite circumstances'
      ],
      similar: [
        'To modify approaches when needed',
        'To fix errors to improve results',
        'To recognize patterns over time periods',
        'To adjust behavior to new situations'
      ],
      unrelated: [
        'A tool used for home repair tasks',
        'A device for personal communication needs',
        'A product for cleaning household surfaces',
        'A machine for preparing food items'
      ]
    };
  }

  // Emphasis & Response & Resolve & Clarify
  if (title.includes('emphasis') || title.includes('response') || title.includes('resolve') || title.includes('clarify')) {
    return {
      opposite: [
        'To downplay the importance of issues',
        'To ignore communications completely',
        'To leave problems unsolved indefinitely',
        'To create confusion about meanings'
      ],
      similar: [
        'To highlight key points for attention',
        'To reply appropriately to inquiries',
        'To find solutions to disagreements',
        'To make meanings clear and understood'
      ],
      unrelated: [
        'A method for growing garden vegetables',
        'A process for developing photographs',
        'A technique for styling hair properly',
        'A practice for training pets at home'
      ]
    };
  }

  // Act & Uphold & Persuade & Influence
  if (title.includes('act') || title.includes('uphold') || title.includes('persuade') || title.includes('influence')) {
    return {
      opposite: [
        'To remain inactive despite circumstances',
        'To abandon principles under pressure',
        'To fail to convince others effectively',
        'To have no impact on outcomes'
      ],
      similar: [
        'To take steps toward achieving goals',
        'To maintain standards and values firmly',
        'To encourage others to accept views',
        'To affect decisions through actions'
      ],
      unrelated: [
        'A pattern for sewing clothing items',
        'A formula for mixing paint colors',
        'A diagram for assembling furniture pieces',
        'A chart for tracking weather conditions'
      ]
    };
  }

  // Process Improvement
  if (title.includes('process') || title.includes('improvement')) {
    return {
      opposite: [
        'To continue inefficient practices unchanged',
        'To reduce quality of work produced',
        'To complicate procedures unnecessarily',
        'To ignore feedback about performance'
      ],
      similar: [
        'To streamline workflows for efficiency',
        'To enhance quality of deliverables',
        'To simplify steps in procedures',
        'To incorporate suggestions for betterment'
      ],
      unrelated: [
        'A genre of music for listening pleasure',
        'A style of art for visual enjoyment',
        'A type of cuisine for dining experiences',
        'A form of dance for physical expression'
      ]
    };
  }

  // Finance & Procurement & Policy & Resources
  if (title.includes('finance') || title.includes('procurement') || title.includes('policy') || title.includes('resources')) {
    return {
      opposite: [
        'To waste funds without accountability',
        'To acquire items without proper approval',
        'To operate without established guidelines',
        'To deplete assets without replacement'
      ],
      similar: [
        'To manage budgets responsibly and carefully',
        'To obtain supplies through proper channels',
        'To follow organizational rules consistently',
        'To allocate assets based on priorities'
      ],
      unrelated: [
        'A routine for daily meditation practice',
        'A program for learning new languages',
        'A schedule for regular exercise sessions',
        'A plan for weekend leisure activities'
      ]
    };
  }

  // Deploy & Maintain
  if (title.includes('deploy') || title.includes('maintain')) {
    return {
      opposite: [
        'To keep systems offline and inactive',
        'To neglect equipment until it fails',
        'To remove features without replacement',
        'To abandon infrastructure without care'
      ],
      similar: [
        'To launch systems into active operation',
        'To preserve functionality through upkeep',
        'To ensure continuous service availability',
        'To support ongoing operational needs'
      ],
      unrelated: [
        'A recipe for making homemade desserts',
        'A guide for planning road trip routes',
        'A tutorial for crafting handmade items',
        'A manual for playing board games'
      ]
    };
  }

  // People & Emotions
  if (title.includes('people') || title.includes('emotion')) {
    return {
      opposite: [
        'To show no concern for others feelings',
        'To isolate oneself from social contact',
        'To suppress emotional expression entirely',
        'To disregard interpersonal relationships'
      ],
      similar: [
        'To demonstrate empathy toward others',
        'To build connections with colleagues',
        'To express feelings appropriately',
        'To value human interaction and bonds'
      ],
      unrelated: [
        'A formula for calculating measurements',
        'A system for organizing digital files',
        'A method for analyzing statistical data',
        'A process for testing software code'
      ]
    };
  }

  // Proficient/Elite C2 Level Topics
  if (title.includes('proficient') || title.includes('elite') || title.includes('precision') || title.includes('nuanced')) {
    return {
      opposite: [
        'To obscure or make something more confusing',
        'To diminish the significance of an achievement',
        'To abandon a position without justification',
        'To contradict previous statements entirely'
      ],
      similar: [
        'To articulate complex ideas with clarity',
        'To substantiate claims with evidence',
        'To synthesize information from multiple sources',
        'To evaluate critically before deciding'
      ],
      unrelated: [
        'A mundane task requiring minimal effort',
        'A recreational activity for leisure time',
        'A basic household item for daily use',
        'A common practice without significance'
      ]
    };
  }

  // Abstract concepts (for Abstract Nouns sets)
  if (title.includes('abstract') || title.includes('philosophy') || title.includes('logic')) {
    return {
      opposite: [
        'A tangible object that can be physically touched',
        'A state of complete certainty without doubt',
        'The abandonment of all ethical principles',
        'A simplistic view lacking depth or nuance'
      ],
      similar: [
        'A theoretical framework for understanding phenomena',
        'An intangible quality that cannot be measured',
        'A fundamental principle guiding behavior',
        'A complex notion requiring careful analysis'
      ],
      unrelated: [
        'A physical tool used for construction work',
        'A recipe for preparing a traditional dish',
        'A sports technique for improving performance',
        'A travel destination popular with tourists'
      ]
    };
  }

  // Argumentation and Debate (for Argumentation Verbs sets)
  if (title.includes('argument') || title.includes('debate') || title.includes('evaluative')) {
    return {
      opposite: [
        'To accept claims without any scrutiny',
        'To concede a point without resistance',
        'To withdraw from the discussion entirely',
        'To ignore evidence that contradicts beliefs'
      ],
      similar: [
        'To challenge assumptions with logic',
        'To defend a position with evidence',
        'To refute opposing arguments effectively',
        'To persuade others through reasoning'
      ],
      unrelated: [
        'To prepare ingredients for cooking meals',
        'To navigate through unfamiliar terrain safely',
        'To maintain equipment in working condition',
        'To organize files in alphabetical order'
      ]
    };
  }

  // Science and Research (for Science/Logic sets)
  if (title.includes('science') || title.includes('research') || title.includes('economics')) {
    return {
      opposite: [
        'To dismiss findings without investigation',
        'A random occurrence without any pattern',
        'An unsubstantiated claim lacking evidence',
        'A regression to earlier methods or practices'
      ],
      similar: [
        'To investigate phenomena systematically',
        'A predictable outcome based on variables',
        'A verified conclusion supported by data',
        'An advancement in methodology or technique'
      ],
      unrelated: [
        'A decorative item for aesthetic purposes',
        'A casual conversation among acquaintances',
        'A traditional ceremony marking occasions',
        'A recreational sport played for enjoyment'
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
  // Advanced enforcement: if advanced context is active, return peer definitions only
  if (__ADV_CTX.isAdvanced && __ADV_CTX.words.length) {
    const peers = __ADV_CTX.words
      .filter(w => (w.word || '').toLowerCase() !== (wordContext || '').toLowerCase())
      .map(w => String(w.definition || '').trim())
      .filter(d => d && d.toLowerCase() !== (correctDef || '').toLowerCase());
    if (peers.length) {
      const unique: string[] = [];
      const seen = new Set<string>();
      for (const d of peers) {
        const k = d.toLowerCase();
        if (!seen.has(k)) { seen.add(k); unique.push(d); }
      }
      if (unique.length) {
        return unique[Math.floor(Math.random() * unique.length)];
      }
    }
  }

  // Topic-based generic fallback (non-Advanced or if peers missing)
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

  const recordResult = useAppStore(s => s.recordExerciseResult);

  // Handle hint button - eliminate 2 wrong options
  const handleHint = () => {
    if (hintsRemaining <= 0 || isAnswered || hiddenOptions.length > 0) return;

    const currentQ = questions[currentWordIndex];
    if (!currentQ) return;

    // Find all wrong option indices
    const wrongIndices = currentQ.options
      .map((_, idx) => idx)
      .filter(idx => idx !== currentQ.correctAnswer);

    // Randomly select 2 wrong options to hide
    const shuffled = wrongIndices.sort(() => Math.random() - 0.5);
    const toHide = shuffled.slice(0, 2);

    setHiddenOptions(toHide);
    onHintUsed?.();
    try {
      soundService.playCorrectAnswer();
    } catch (e) {
      console.warn('[MCQ] Failed to play hint sound:', e);
    }
  };

  const handleAnswerSelect = (answerIndex: number) => {
    if (isAnswered) return; // Prevent multiple selections

    setSelectedAnswer(answerIndex);
    setIsAnswered(true);
    const correct = answerIndex === questions[currentWordIndex].correctAnswer;
    setIsCorrect(correct);
    setShowFeedback(true);

    // Play sound based on answer
    if (correct) {
      soundService.playCorrectAnswer();
    } else {
      soundService.playIncorrectAnswer();
    }

    // Track analytics for this question
    try {
      const timeSpent = Math.max(0, Math.round((Date.now() - questionStartRef.current) / 1000));
      recordResult({
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
      onCorrectAnswer?.();
    } else {
      // Lose a heart on wrong answer
      onHeartLost();
      onIncorrectAnswer?.();
      triggerHeartLostAnimation();
    }
    setIsProcessingNext(false);
  };

  const triggerHeartLostAnimation = () => {
    heartLostAnim.setValue(1.3);
    Animated.spring(heartLostAnim, {
      toValue: 1,
      friction: 3,
      tension: 100,
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
    setHiddenOptions([]); // Reset hidden options for next question
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
      <View style={[styles.loadingContainer, isLight && { backgroundColor: colors.background }]}>
        <LottieView
          source={require('../../../assets/lottie/loading.json')}
          autoPlay
          loop
          style={{ width: 140, height: 140 }}
        />
        <Text style={[styles.loadingText, isLight && { color: '#6B7280' }]}>Loading questions...</Text>
      </View>
    );
  }

  const currentQuestion = questions[currentWordIndex];

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
    <Animated.View style={[styles.container, isLight && { backgroundColor: colors.background }, { opacity: mountFadeAnim }]}>
      <AudioPlayer ref={audioPlayerRef} />

      {/* Compact Header with Progress and Hearts */}
      <View style={styles.topHeaderRow}>
        <View style={[styles.progressBarPill, isLight && { backgroundColor: '#E5E7EB' }]}>
          <Animated.View
            style={[
              styles.progressFillPill,
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
        <Animated.View style={[styles.heartsContainerSmall, { transform: [{ scale: heartLostAnim }] }]}>
          <View style={{ position: 'relative' }}>
            <LottieView
              source={require('../../../assets/lottie/learn/heart_away.lottie')}
              autoPlay={showUfoAnimation}
              loop={false}
              speed={1}
              style={{ width: 96, height: 96 }}
              key={showUfoAnimation ? 'playing' : 'idle'}
            />
            {showUfoAnimation && (
              <LottieView
                key={`ufo-${ufoAnimationKey}`}
                source={require('../../../assets/lottie/learn/Ufo_animation.lottie')}
                autoPlay
                loop={false}
                speed={2}
                style={{
                  width: 100,
                  height: 100,
                  position: 'absolute',
                  top: -30,
                  left: -2,
                }}
              />
            )}
          </View>
          <Text style={[styles.heartCount, { marginLeft: -30 }, isLight && { color: '#EF4444' }]}>{hearts}</Text>
        </Animated.View>
      </View>

      <Animated.View
        style={{
          flex: 1,
          opacity: fadeAnim,
          transform: [{ translateX: slideAnim }],
        }}
      >
        <ScrollView
          style={{ flex: 1 }}
          contentContainerStyle={{ paddingHorizontal: 20, paddingTop: 80, paddingBottom: 140 }}
          showsVerticalScrollIndicator={false}
          bounces={false}
        >
          <View style={styles.wordHeader}>
            <View style={styles.wordRow}>
              <Text style={[styles.wordText, isLight && { color: '#111827' }]}>{currentQuestion.word}</Text>
              <TouchableOpacity
                style={[styles.speakButtonInline, isLight && styles.speakButtonInlineLight]}
                onPress={() => {
                  // Ensure AudioPlayer is registered before speaking
                  if (audioPlayerRef.current) {
                    setWebViewAudioPlayer(audioPlayerRef.current);
                  }
                  speak(currentQuestion.word);
                }}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              >
                <Volume2 size={20} color={isLight ? '#0D3B4A' : '#B6E0E2'} />
              </TouchableOpacity>
            </View>
            <Text style={[styles.ipaText, isLight && { color: '#6B7280' }]}>{currentQuestion.ipa}</Text>
            <Text style={[styles.exampleInline, isLight && { color: '#6B7280' }]}>
              {renderSentenceWithHighlight(currentQuestion.example, currentQuestion.word)}
            </Text>
          </View>

          {/* Hint Button */}
          {hintsRemaining > 0 && !isAnswered && hiddenOptions.length === 0 && (
            <TouchableOpacity
              style={[styles.hintButton, isLight && styles.hintButtonLight]}
              onPress={handleHint}
              activeOpacity={0.7}
            >
              <Lightbulb size={16} color={isLight ? '#F59E0B' : '#FCD34D'} fill={isLight ? '#F59E0B' : '#FCD34D'} />
            </TouchableOpacity>
          )}

          <View style={styles.optionsContainer}>
            {currentQuestion.options.map((option, index) => {
              // Skip rendering if this option is hidden by hint
              if (hiddenOptions.includes(index)) {
                return null;
              }

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
                  style={{ width: '100%', marginBottom: 10, transform: [{ translateY }, { scale }], opacity }}
                >
                  <TouchableOpacity
                    style={[
                      styles.optionButton,
                      // Keep light card color even after feedback so unselected options don't darken
                      isLight && styles.optionLight,
                      (!showFeedback && isSelected) && (isLight ? styles.selectedOptionLight : styles.selectedOption),
                      (showFeedback && index === currentQuestion.correctAnswer) && (isLight ? styles.correctOptionLight : styles.correctOption),
                      (showFeedback && isSelected && !isCorrectOption) && (isLight ? styles.wrongOptionLight : styles.wrongOption),
                    ]}
                    onPress={() => handleAnswerSelect(index)}
                    disabled={isAnswered}
                  >
                    <Text style={[
                      styles.optionText,
                      isLight && { color: '#111827' },
                      (showFeedback && index === currentQuestion.correctAnswer) && { color: '#4ED9CB' },
                      (showFeedback && isSelected && !isCorrectOption) && { color: '#F25E86' },
                    ]}>
                      {option}
                    </Text>
                  </TouchableOpacity>
                </Animated.View>
              );
            })}
          </View>
        </ScrollView>

        {isAnswered && (
          <View style={styles.nextButtonContainer}>
            <AnimatedNextButton
              onPress={handleNextPress}
              disabled={isProcessingNext}
            />
          </View>
        )}
      </Animated.View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'transparent',
  },
  loadingText: {
    fontSize: 16,
    color: '#9CA3AF',
    fontFamily: 'Feather-Bold',
  },
  topHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-start',
    marginTop: 60,
    marginBottom: 8,
    gap: 12,
    paddingLeft: 56,
    paddingRight: 24,
    height: 24,
    overflow: 'visible',
    zIndex: 10,
  },
  progressBarPill: {
    flex: 1,
    height: 12,
    backgroundColor: '#2D4A66',
    borderRadius: 6,
    overflow: 'hidden',
    marginRight: 8,
  },
  progressFillPill: {
    height: '100%',
    backgroundColor: '#7AC231',
    borderRadius: 7,
  },
  heartsContainerSmall: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    overflow: 'visible',
    zIndex: 100,
  },
  heartEmoji: {
    fontSize: 18,
  },
  heartCount: {
    fontSize: 17,
    fontWeight: '700',
    color: '#EF4444',
    fontFamily: 'Feather-Bold',
  },
  header: {
    paddingHorizontal: 20,
    paddingVertical: 8,
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
    fontFamily: 'Feather-Bold',
  },
  scoreWrapper: {
    alignItems: 'center',
    justifyContent: 'flex-end',
    minWidth: 48,
  },
  heartsContainer: {
    flexDirection: 'row',
    gap: 2,
  },
  heartIcon: {
    fontSize: 18,
  },
  deductionText: {
    position: 'absolute',
    top: -20,
    fontSize: 16,
    fontWeight: '600',
    color: '#F87171',
    fontFamily: 'Feather-Bold',
  },
  scoreText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#F25E86',
    fontFamily: 'Feather-Bold',
  },
  progressBar: {
    height: 6,
    backgroundColor: '#243B53',
    borderRadius: 3,
    overflow: 'hidden',
    marginBottom: 24,
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#F25E86',
    borderRadius: 3,
  },
  wordHeader: {
    alignItems: 'center',
    marginBottom: 20,
  },
  wordRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  speakButtonInline: {
    padding: 8,
    borderRadius: 20,
    backgroundColor: 'rgba(182, 224, 226, 0.15)',
  },
  speakButtonInlineLight: {
    backgroundColor: 'rgba(13, 59, 74, 0.1)',
  },
  wordText: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#fff',
    fontFamily: 'Feather-Bold',
  },
  ipaText: {
    fontSize: 18,
    color: '#9CA3AF',
    fontStyle: 'italic',
    fontFamily: 'Feather-Bold',
    marginTop: 8,
  },
  exampleInline: {
    marginTop: 8,
    fontSize: 14,
    color: '#9CA3AF',
    fontStyle: 'italic',
    textAlign: 'center',
    fontFamily: 'Feather-Bold',
  },
  optionsContainer: {
    marginBottom: 12,
  },
  hintButton: {
    position: 'absolute',
    top: 20,
    right: 20,
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(251, 191, 36, 0.15)',
    borderRadius: 20,
    borderWidth: 1.5,
    borderColor: 'rgba(252, 211, 77, 0.4)',
    zIndex: 10,
  },
  hintButtonLight: {
    backgroundColor: 'rgba(251, 191, 36, 0.2)',
    borderColor: 'rgba(245, 158, 11, 0.5)',
  },
  nextButtonContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 20,
    paddingBottom: 50,
    paddingTop: 16,
    alignItems: 'center',
    backgroundColor: 'transparent',
  },
  optionButton: {
    backgroundColor: '#1B263B',
    borderRadius: 16,
    paddingVertical: 18,
    paddingHorizontal: 20,
    marginBottom: 0,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    minHeight: 72,
    borderWidth: 2,
    borderColor: 'rgba(78,217,203,0.06)',
    borderBottomWidth: 4,
    borderRightWidth: 4,
    borderBottomColor: 'rgba(78,217,203,0.1)',
    borderRightColor: 'rgba(78,217,203,0.08)',
  },
  // Light mode card color to match Learn cards
  optionLight: { backgroundColor: '#FFFFFF', borderWidth: 2, borderColor: 'rgba(78,217,203,0.3)', borderBottomWidth: 4, borderRightWidth: 4, borderBottomColor: 'rgba(78,217,203,0.4)', borderRightColor: 'rgba(78,217,203,0.35)' },
  // Brighter selected state before feedback (dark and light variants)
  selectedOption: { backgroundColor: 'rgba(242,94,134,0.08)', borderWidth: 2, borderColor: '#F25E86', borderBottomWidth: 4, borderRightWidth: 4, borderBottomColor: '#F25E86', borderRightColor: '#F25E86' },
  selectedOptionLight: { backgroundColor: 'rgba(242,94,134,0.05)', borderWidth: 2, borderColor: '#F25E86', borderBottomWidth: 4, borderRightWidth: 4, borderBottomColor: '#F25E86', borderRightColor: '#F25E86' },
  // Reveal states
  // Dark theme - teal for correct, pink for wrong
  correctOption: { backgroundColor: 'rgba(78,217,203,0.04)', borderColor: '#4ED9CB', borderWidth: 2, borderBottomWidth: 4, borderRightWidth: 4, borderBottomColor: '#4ED9CB', borderRightColor: '#4ED9CB' },
  wrongOption: { backgroundColor: 'rgba(242,94,134,0.04)', borderColor: '#F25E86', borderWidth: 2, borderBottomWidth: 4, borderRightWidth: 4, borderBottomColor: '#F25E86', borderRightColor: '#F25E86' },
  // Light theme - subtle tints
  correctOptionLight: { backgroundColor: 'rgba(78,217,203,0.03)', borderColor: '#4ED9CB', borderWidth: 2, borderBottomWidth: 4, borderRightWidth: 4, borderBottomColor: '#4ED9CB', borderRightColor: '#4ED9CB' },
  wrongOptionLight: { backgroundColor: 'rgba(242,94,134,0.03)', borderColor: '#F25E86', borderWidth: 2, borderBottomWidth: 4, borderRightWidth: 4, borderBottomColor: '#F25E86', borderRightColor: '#F25E86' },
  optionText: {
    fontSize: 16,
    color: '#fff',
    flex: 1,
    fontWeight: '500',
    textAlignVertical: 'center',
    fontFamily: 'Feather-Bold',
  },
  highlightedWord: {
    fontWeight: 'bold',
    color: '#F25E86',
    fontFamily: 'Feather-Bold',
  },
  nextButton: {
    marginTop: 16,
    backgroundColor: '#F25E86',
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
    fontFamily: 'Feather-Bold',
  },
  nextButtonDisabled: {
    opacity: 0.6,
  },
});

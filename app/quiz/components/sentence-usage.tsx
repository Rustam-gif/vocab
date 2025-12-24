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
  ScrollView,
} from 'react-native';
import { useAppStore } from '../../../lib/store';
import { getTheme } from '../../../lib/theme';
import { Vibration } from 'react-native';
import { analyticsService } from '../../../services/AnalyticsService';
import { levels } from '../data/levels';
import AnimatedNextButton from './AnimatedNextButton';

const ACCENT_COLOR = '#F8B070';
const CORRECT_COLOR = '#437F76';
const INCORRECT_COLOR = '#924646';

interface SentenceUsageProps {
  setId: string;
  levelId: string;
  onPhaseComplete: (score: number, totalQuestions: number) => void;
  sharedScore: number;
  onScoreShare: (score: number) => void;
  wordRange?: { start: number; end: number };
  wordsOverride?: Array<{ word: string; phonetic: string; definition: string; example: string; synonyms?: string[] }>;
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
  // IELTS curated word-choice usage overrides
  ielts: {
    '1': {
      fluctuate: {
        prompt: 'In small markets, demand can … within a week.',
        options: ['fluctuate', 'stabilize', 'decline', 'surge'],
        correct: 'fluctuate',
      },
      stabilize: {
        prompt: 'Extra supply could … prices before the summer season.',
        options: ['stabilize', 'fluctuate', 'plateau', 'surge'],
        correct: 'stabilize',
      },
      decline: {
        prompt: 'After the subsidy ended, sales began to …. ',
        options: ['decline', 'surge', 'plateau', 'stabilize'],
        correct: 'decline',
      },
      surge: {
        prompt: 'Tourist arrivals … after the new direct flight.',
        options: ['surge', 'decline', 'fluctuate', 'plateau'],
        correct: 'surge',
      },
      plateau: {
        prompt: 'After quick gains, test scores began to …. ',
        options: ['plateau', 'stabilize', 'fluctuate', 'decline'],
        correct: 'plateau',
      },
    },
    '2': {
      investigate: {
        prompt: 'Journalists … claims before publishing the feature story.',
        options: ['investigate', 'assess', 'justify', 'implement'],
        correct: 'investigate',
      },
      assess: {
        prompt: 'We must … risks before choosing a supplier.',
        options: ['assess', 'investigate', 'justify', 'revise'],
        correct: 'assess',
      },
      justify: {
        prompt: 'Can you … the budget increase for training?',
        options: ['justify', 'revise', 'implement', 'investigate'],
        correct: 'justify',
      },
      implement: {
        prompt: 'Teams will … the policy starting next quarter.',
        options: ['implement', 'investigate', 'assess', 'revise'],
        correct: 'implement',
      },
      revise: {
        prompt: 'We should … the schedule before publishing it.',
        options: ['revise', 'assess', 'justify', 'implement'],
        correct: 'revise',
      },
    },
  },
  intermediate: {
    '11': {
      warn: {
        prompt: 'Please … children about the deep water near the pier.',
        options: ['warn', 'permit', 'forbid', 'advise'],
        correct: 'warn',
      },
      permit: {
        prompt: 'This ticket will … you to enter after 6 p.m.',
        options: ['permit', 'warn', 'advise', 'forbid'],
        correct: 'permit',
      },
      forbid: {
        prompt: 'The museum will … food inside the main gallery rooms.',
        options: ['forbid', 'advise', 'warn', 'permit'],
        correct: 'forbid',
      },
      advise: {
        prompt: 'I can … you to start earlier and avoid the traffic.',
        options: ['advise', 'permit', 'forbid', 'warn'],
        correct: 'advise',
      },
      request: {
        prompt: 'Guests may … a late checkout if their flight is delayed.',
        options: ['request', 'permit', 'forbid', 'advise'],
        correct: 'request',
      },
    },
    '12': {
      charge: {
        prompt: 'Do they … extra if the delivery is after midnight?',
        options: ['charge', 'refund', 'ship', 'track'],
        correct: 'charge',
      },
      refund: {
        prompt: 'The company will … you within five days after approval.',
        options: ['refund', 'charge', 'replace', 'track'],
        correct: 'refund',
      },
      replace: {
        prompt: 'We should … the filter every six months for safety.',
        options: ['replace', 'track', 'refund', 'ship'],
        correct: 'replace',
      },
      ship: {
        prompt: 'We can … the replacement today if you confirm the address.',
        options: ['ship', 'replace', 'charge', 'track'],
        correct: 'ship',
      },
      track: {
        prompt: 'Use this link to … your order during international shipping.',
        options: ['track', 'ship', 'charge', 'refund'],
        correct: 'track',
      },
    },
    '13': {
      persuade: {
        prompt: 'Good examples can … people to support the new rules.',
        options: ['persuade', 'argue', 'reply', 'interrupt'],
        correct: 'persuade',
      },
      argue: {
        prompt: 'Let’s not … tonight; we can talk calmly tomorrow.',
        options: ['argue', 'apologize', 'reply', 'interrupt'],
        correct: 'argue',
      },
      reply: {
        prompt: 'I’ll … to your email once I finish lunch.',
        options: ['reply', 'argue', 'interrupt', 'apologize'],
        correct: 'reply',
      },
      interrupt: {
        prompt: 'It’s rude to … when someone is giving directions.',
        options: ['interrupt', 'reply', 'apologize', 'argue'],
        correct: 'interrupt',
      },
      apologize: {
        prompt: 'If you arrive late, please … to the instructor politely.',
        options: ['apologize', 'argue', 'reply', 'interrupt'],
        correct: 'apologize',
      },
    },
    '14': {
      reserve: {
        prompt: 'We should … a room with a quiet view of gardens.',
        options: ['reserve', 'extend', 'upgrade', 'cancel'],
        correct: 'reserve',
      },
      extend: {
        prompt: 'Could we … the deadline by two days if trains stop?',
        options: ['extend', 'reserve', 'upgrade', 'cancel'],
        correct: 'extend',
      },
      upgrade: {
        prompt: 'If seats are free, we might … to the quiet carriage.',
        options: ['upgrade', 'cancel', 'reserve', 'extend'],
        correct: 'upgrade',
      },
      cancel: {
        prompt: 'If the storm worsens, we must … the outdoor concert.',
        options: ['cancel', 'upgrade', 'extend', 'reserve'],
        correct: 'cancel',
      },
      reschedule: {
        prompt: 'If your train is late, we can … the meeting easily.',
        options: ['reschedule', 'upgrade', 'cancel', 'reserve'],
        correct: 'reschedule',
      },
    },
    '15': {
      assemble: {
        prompt: 'Let’s … the new table before guests arrive tonight.',
        options: ['assemble', 'adjust', 'connect', 'secure'],
        correct: 'assemble',
      },
      adjust: {
        prompt: 'Please … the mirror so it sits straight on wall.',
        options: ['adjust', 'assemble', 'secure', 'connect'],
        correct: 'adjust',
      },
      connect: {
        prompt: 'Once you … the speakers, test the sound with music.',
        options: ['connect', 'assemble', 'secure', 'adjust'],
        correct: 'connect',
      },
      secure: {
        prompt: 'Use cable ties to … the wires behind the desk.',
        options: ['secure', 'assemble', 'adjust', 'connect'],
        correct: 'secure',
      },
      polish: {
        prompt: 'After sanding, … the door to keep the finish smooth.',
        options: ['polish', 'connect', 'secure', 'adjust'],
        correct: 'polish',
      },
    },
    '16': {
      order: {
        prompt: 'We should … the meals now before the restaurant gets crowded.',
        options: ['order', 'serve', 'taste', 'chop', 'stir'],
        correct: 'order',
      },
      serve: {
        prompt: 'Please … the soup first while the bread finishes warming.',
        options: ['serve', 'order', 'chop', 'taste', 'stir'],
        correct: 'serve',
      },
      taste: {
        prompt: 'Could you … this soup and tell me if it’s spicy.',
        options: ['taste', 'chop', 'order', 'stir', 'serve'],
        correct: 'taste',
      },
      chop: {
        prompt: 'I’ll … the vegetables while you heat the pan gently.',
        options: ['chop', 'order', 'serve', 'taste', 'stir'],
        correct: 'chop',
      },
      stir: {
        prompt: 'Keep the sauce warm and … it every minute or two.',
        options: ['stir', 'order', 'serve', 'taste', 'chop'],
        correct: 'stir',
      },
    },
    '17': {
      worry: {
        prompt: 'Don’t … about delays; we still have plenty of time.',
        options: ['worry', 'cheer', 'forgive', 'praise', 'regret'],
        correct: 'worry',
      },
      cheer: {
        prompt: 'Funny stories always … the team after a long meeting.',
        options: ['cheer', 'worry', 'forgive', 'praise', 'regret'],
        correct: 'cheer',
      },
      forgive: {
        prompt: 'It’s hard to … quickly, but it helps everyone move forward.',
        options: ['forgive', 'worry', 'cheer', 'praise', 'regret'],
        correct: 'forgive',
      },
      praise: {
        prompt: 'Managers should … progress in public and give advice in private.',
        options: ['praise', 'worry', 'cheer', 'forgive', 'regret'],
        correct: 'praise',
      },
      regret: {
        prompt: 'I … not saving the document before the laptop died.',
        options: ['regret', 'praise', 'forgive', 'cheer', 'worry'],
        correct: 'regret',
      },
    },
    '18': {
      heat: {
        prompt: 'On cold mornings, we … the kitchen for breakfast.',
        options: ['heat', 'cool', 'dry', 'fold', 'iron'],
        correct: 'heat',
      },
      cool: {
        prompt: 'Let the pie … before slicing; the filling is still boiling.',
        options: ['cool', 'heat', 'fold', 'iron', 'dry'],
        correct: 'cool',
      },
      dry: {
        prompt: 'After washing the car, … the mirrors with a clean towel.',
        options: ['dry', 'heat', 'fold', 'cool', 'iron'],
        correct: 'dry',
      },
      fold: {
        prompt: 'After drying, … the shirts neatly and put them away.',
        options: ['fold', 'iron', 'cool', 'heat', 'dry'],
        correct: 'fold',
      },
      iron: {
        prompt: 'Can you … the shirt; it’s badly creased from travel.',
        options: ['iron', 'heat', 'fold', 'cool', 'dry'],
        correct: 'iron',
      },
    },
    '19': {
      paint: {
        prompt: 'Let’s … the chairs blue to match the kitchen wall.',
        options: ['paint', 'draw', 'camp', 'hike', 'swim'],
        correct: 'paint',
      },
      draw: {
        prompt: 'In the park, we … the trees and quiet lake.',
        options: ['draw', 'camp', 'paint', 'swim', 'hike'],
        correct: 'draw',
      },
      camp: {
        prompt: 'If it’s dry this weekend, we’ll … by the forest.',
        options: ['camp', 'paint', 'draw', 'hike', 'swim'],
        correct: 'camp',
      },
      hike: {
        prompt: 'Bring water if we … the hill trail after lunch.',
        options: ['hike', 'swim', 'paint', 'camp', 'draw'],
        correct: 'hike',
      },
      swim: {
        prompt: 'If the pool’s quiet, we’ll … for thirty relaxed minutes.',
        options: ['swim', 'paint', 'camp', 'draw', 'hike'],
        correct: 'swim',
      },
    },
    '20': {
      'fill in': {
        prompt: 'New starters must … their tax number on page two.',
        options: ['fill in', 'submit', 'print', 'sign', 'file'],
        correct: 'fill in',
      },
      submit: {
        prompt: 'Please … the report online instead of emailing the file.',
        options: ['submit', 'sign', 'print', 'file', 'fill in'],
        correct: 'submit',
      },
      print: {
        prompt: 'After I … the labels, please attach them to each box.',
        options: ['print', 'sign', 'file', 'fill in', 'submit'],
        correct: 'print',
      },
      sign: {
        prompt: 'The courier needs you to … here before releasing the parcel.',
        options: ['sign', 'submit', 'print', 'file', 'fill in'],
        correct: 'sign',
      },
      file: {
        prompt: 'When you … papers correctly, everyone finds information much faster.',
        options: ['file', 'print', 'sign', 'fill in', 'submit'],
        correct: 'file',
      },
    },
  },
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
    '14': {
      contemplate: {
        prompt: 'She paused to … moving abroad before signing the lease.',
        options: ['contemplate', 'bolster', 'downplay', 'counter'],
        correct: 'contemplate',
      },
      bolster: {
        prompt: 'New evidence will … their case before the review board.',
        options: ['bolster', 'contemplate', 'downplay', 'elicit'],
        correct: 'bolster',
      },
      downplay: {
        prompt: 'Officials tried to … delays during the press conference yesterday.',
        options: ['downplay', 'bolster', 'elicit', 'counter'],
        correct: 'downplay',
      },
      counter: {
        prompt: 'She … the claim with data from independent studies.',
        options: ['counter', 'bolster', 'contemplate', 'elicit'],
        correct: 'counter',
      },
      elicit: {
        prompt: 'The interviewer used open questions to … more detailed answers.',
        options: ['elicit', 'downplay', 'counter', 'bolster'],
        correct: 'elicit',
      },
    },
    '15': {
      fluctuate: {
        prompt: 'Currency values often … when investors react to breaking news.',
        options: ['fluctuate', 'stabilize', 'accelerate', 'plateau'],
        correct: 'fluctuate',
      },
      stabilize: {
        prompt: 'Better communication can … performance during stressful exam periods.',
        options: ['stabilize', 'fluctuate', 'deteriorate', 'accelerate'],
        correct: 'stabilize',
      },
      accelerate: {
        prompt: 'Targeted training can … progress for learners who practice consistently.',
        options: ['accelerate', 'plateau', 'stabilize', 'fluctuate'],
        correct: 'accelerate',
      },
      deteriorate: {
        prompt: 'Ignoring small leaks can … the entire roof structure.',
        options: ['deteriorate', 'stabilize', 'plateau', 'accelerate'],
        correct: 'deteriorate',
      },
      plateau: {
        prompt: 'Strength gains often … without new exercises or heavier loads.',
        options: ['plateau', 'accelerate', 'fluctuate', 'deteriorate'],
        correct: 'plateau',
      },
    },
    '16': {
      verify: {
        prompt: 'Independent labs … the findings before the paper is accepted.',
        options: ['verify', 'refine', 'illustrate', 'formulate'],
        correct: 'verify',
      },
      refine: {
        prompt: 'After user feedback, the team will … the onboarding flow.',
        options: ['refine', 'verify', 'navigate', 'illustrate'],
        correct: 'refine',
      },
      formulate: {
        prompt: 'Leaders should … a plan everyone understands and supports.',
        options: ['formulate', 'refine', 'navigate', 'verify'],
        correct: 'formulate',
      },
      illustrate: {
        prompt: 'Use a short story to … how the policy works.',
        options: ['illustrate', 'verify', 'navigate', 'refine'],
        correct: 'illustrate',
      },
      navigate: {
        prompt: 'With clear instructions, you can … the application process smoothly.',
        options: ['navigate', 'refine', 'formulate', 'illustrate'],
        correct: 'navigate',
      },
    },
    '17': {
      alleviate: {
        prompt: 'Simple breathing exercises can … stress during high-pressure interviews significantly.',
        options: ['alleviate', 'exacerbate', 'mediate', 'ascertain'],
        correct: 'alleviate',
      },
      exacerbate: {
        prompt: 'Cutting maintenance budgets could … safety problems over the next year.',
        options: ['exacerbate', 'alleviate', 'delineate', 'mediate'],
        correct: 'exacerbate',
      },
      ascertain: {
        prompt: 'Before making changes, we must … the root cause of failures.',
        options: ['ascertain', 'delineate', 'mediate', 'alleviate'],
        correct: 'ascertain',
      },
      delineate: {
        prompt: 'The handbook will … roles so teams avoid duplicated work.',
        options: ['delineate', 'ascertain', 'mediate', 'exacerbate'],
        correct: 'delineate',
      },
      mediate: {
        prompt: 'Human resources offered to … disputes during the merger talks.',
        options: ['mediate', 'exacerbate', 'alleviate', 'ascertain'],
        correct: 'mediate',
      },
    },
    '18': {
      emphasize: {
        prompt: 'Teachers … key steps so learners avoid common mistakes early.',
        options: ['emphasize', 'question', 'adapt', 'compensate'],
        correct: 'emphasize',
      },
      acknowledge: {
        prompt: 'He must … the error and apologize before submitting the revision.',
        options: ['acknowledge', 'adapt', 'question', 'compensate'],
        correct: 'acknowledge',
      },
      adapt: {
        prompt: 'Teams … quickly when tools change during tight project schedules.',
        options: ['adapt', 'emphasize', 'acknowledge', 'compensate'],
        correct: 'adapt',
      },
      compensate: {
        prompt: 'Extra training can … for limited experience in complex situations.',
        options: ['compensate', 'adapt', 'question', 'emphasize'],
        correct: 'compensate',
      },
      question: {
        prompt: 'Journalists … official statements when evidence appears inconsistent with sources.',
        options: ['question', 'emphasize', 'adapt', 'compensate'],
        correct: 'question',
      },
    },
    '19': {
      expedite: {
        prompt: 'Extra staff can … passport applications during peak travel season.',
        options: ['expedite', 'hamper', 'contend', 'uphold'],
        correct: 'expedite',
      },
      hamper: {
        prompt: 'Road closures … deliveries when storms hit remote mountain towns.',
        options: ['hamper', 'expedite', 'contend', 'uphold'],
        correct: 'hamper',
      },
      contend: {
        prompt: 'Several researchers … that the sample size was too small.',
        options: ['contend', 'expedite', 'hamper', 'dispel'],
        correct: 'contend',
      },
      dispel: {
        prompt: 'Honest updates can … fears after unexpected service interruptions.',
        options: ['dispel', 'contend', 'expedite', 'hamper'],
        correct: 'dispel',
      },
      uphold: {
        prompt: 'Judges must … the law even under intense public pressure.',
        options: ['uphold', 'expedite', 'hamper', 'dispel'],
        correct: 'uphold',
      },
    },
    '20': {
      evaluate: {
        prompt: 'We must … each option before choosing a final plan.',
        options: ['evaluate', 'depict', 'omit', 'oppose', 'endorse'],
        correct: 'evaluate',
      },
      depict: {
        prompt: 'The article will … everyday life in the coastal villages.',
        options: ['depict', 'evaluate', 'omit', 'oppose', 'endorse'],
        correct: 'depict',
      },
      omit: {
        prompt: 'For privacy, … names that could identify the participants.',
        options: ['omit', 'evaluate', 'depict', 'oppose', 'endorse'],
        correct: 'omit',
      },
      oppose: {
        prompt: 'Community groups will … the proposal at next week’s meeting.',
        options: ['oppose', 'depict', 'evaluate', 'omit', 'endorse'],
        correct: 'oppose',
      },
      endorse: {
        prompt: 'Several organizations will … the campaign once the results appear.',
        options: ['endorse', 'depict', 'evaluate', 'omit', 'oppose'],
        correct: 'endorse',
      },
    },
    '21': {
      allege: {
        prompt: 'Witnesses … the contract was altered after signatures without consent.',
        options: ['allege', 'cite', 'deter', 'diversify'],
        correct: 'allege',
      },
      cite: {
        prompt: 'Please … two studies to support your policy recommendation.',
        options: ['cite', 'allege', 'diversify', 'deter'],
        correct: 'cite',
      },
      foster: {
        prompt: 'After-school programs … resilience and teamwork among local teenagers.',
        options: ['foster', 'deter', 'allege', 'diversify'],
        correct: 'foster',
      },
      deter: {
        prompt: 'Strong lighting can … vandalism in poorly supervised car parks.',
        options: ['deter', 'foster', 'cite', 'allege'],
        correct: 'deter',
      },
      diversify: {
        prompt: 'Small exporters … products to reach markets beyond their region.',
        options: ['diversify', 'cite', 'allege', 'deter'],
        correct: 'diversify',
      },
    },
    '22': {
      investigate: {
        prompt: 'The committee will … the complaint before announcing any decision.',
        options: ['investigate', 'deduce', 'speculate', 'survey'],
        correct: 'investigate',
      },
      deduce: {
        prompt: 'From the patterns, we can … the likely cause.',
        options: ['deduce', 'investigate', 'speculate', 'probe'],
        correct: 'deduce',
      },
      speculate: {
        prompt: 'Without complete records, researchers can only … about motives.',
        options: ['speculate', 'deduce', 'survey', 'investigate'],
        correct: 'speculate',
      },
      probe: {
        prompt: 'Regulators may … the merger if prices suddenly climb.',
        options: ['probe', 'survey', 'deduce', 'speculate'],
        correct: 'probe',
      },
      survey: {
        prompt: 'The city plans to … residents about new transport options.',
        options: ['survey', 'investigate', 'probe', 'speculate'],
        correct: 'survey',
      },
    },
    '23': {
      streamline: {
        prompt: 'We should … approvals so small purchases don’t stall projects.',
        options: ['streamline', 'automate', 'consolidate', 'standardize'],
        correct: 'streamline',
      },
      automate: {
        prompt: 'We’ll … status emails so updates arrive without delays.',
        options: ['automate', 'streamline', 'iterate', 'consolidate'],
        correct: 'automate',
      },
      consolidate: {
        prompt: 'Let’s … similar tools so teams share one platform.',
        options: ['consolidate', 'iterate', 'automate', 'standardize'],
        correct: 'consolidate',
      },
      standardize: {
        prompt: 'We’ll … formatting so every report looks professional.',
        options: ['standardize', 'consolidate', 'automate', 'iterate'],
        correct: 'standardize',
      },
      iterate: {
        prompt: 'We should … until users complete tasks without help.',
        options: ['iterate', 'automate', 'consolidate', 'standardize'],
        correct: 'iterate',
      },
    },
    '24': {
      paraphrase: {
        prompt: 'In your report, … the idea to avoid plagiarism.',
        options: ['paraphrase', 'summarize', 'allude', 'reiterate'],
        correct: 'paraphrase',
      },
      summarize: {
        prompt: 'Before the Q&A, please … the key conclusions.',
        options: ['summarize', 'reiterate', 'allude', 'paraphrase'],
        correct: 'summarize',
      },
      elaborate: {
        prompt: 'The reviewer asked us to … on methods and limitations.',
        options: ['elaborate', 'summarize', 'reiterate', 'allude'],
        correct: 'elaborate',
      },
      allude: {
        prompt: 'Editorials sometimes … at motives without accusing anyone directly.',
        options: ['allude', 'paraphrase', 'summarize', 'reiterate'],
        correct: 'allude',
      },
      reiterate: {
        prompt: 'Before we finish, I’ll … the safety instructions.',
        options: ['reiterate', 'paraphrase', 'allude', 'elaborate'],
        correct: 'reiterate',
      },
    },
    '25': {
      authorize: {
        prompt: 'Only the director can … overtime during exam season.',
        options: ['authorize', 'mandate', 'prohibit', 'waive'],
        correct: 'authorize',
      },
      prohibit: {
        prompt: 'Regulations … parking here during emergency street repairs.',
        options: ['prohibit', 'authorize', 'exempt', 'waive'],
        correct: 'prohibit',
      },
      mandate: {
        prompt: 'The ministry will … audits for all large charities.',
        options: ['mandate', 'authorize', 'waive', 'prohibit'],
        correct: 'mandate',
      },
      exempt: {
        prompt: 'Students on scholarships are … from paying the application fee.',
        options: ['exempt', 'authorize', 'mandate', 'waive'],
        correct: 'exempt',
      },
      waive: {
        prompt: 'To help families, the clinic will … late payment charges.',
        options: ['waive', 'authorize', 'mandate', 'prohibit'],
        correct: 'waive',
      },
    },
    '26': {
      invest: {
        prompt: 'Many parents … early in their children’s training.',
        options: ['invest', 'divest', 'procure', 'reimburse'],
        correct: 'invest',
      },
      divest: {
        prompt: 'To reduce debt, the company will … two subsidiaries.',
        options: ['divest', 'invest', 'reimburse', 'hedge'],
        correct: 'divest',
      },
      procure: {
        prompt: 'The team must … parts locally to meet deadlines.',
        options: ['procure', 'reimburse', 'hedge', 'invest'],
        correct: 'procure',
      },
      reimburse: {
        prompt: 'HR will … staff after receipts are checked and approved.',
        options: ['reimburse', 'invest', 'procure', 'hedge'],
        correct: 'reimburse',
      },
      hedge: {
        prompt: 'Exporters … currency exposure when exchange rates swing sharply.',
        options: ['hedge', 'invest', 'divest', 'reimburse'],
        correct: 'hedge',
      },
    },
    '27': {
      deploy: {
        prompt: 'Once tests pass, we’ll … the patch during low traffic.',
        options: ['deploy', 'configure', 'troubleshoot', 'restore'],
        correct: 'deploy',
      },
      configure: {
        prompt: 'We need to … notifications for outages and slow responses.',
        options: ['configure', 'deploy', 'restore', 'troubleshoot'],
        correct: 'configure',
      },
      troubleshoot: {
        prompt: 'If errors appear, we first … before rolling back.',
        options: ['troubleshoot', 'deploy', 'synchronize', 'restore'],
        correct: 'troubleshoot',
      },
      restore: {
        prompt: 'A clean backup helped us … accounts within minutes.',
        options: ['restore', 'deploy', 'configure', 'troubleshoot'],
        correct: 'restore',
      },
      synchronize: {
        prompt: 'We must … data between phones and laptops nightly.',
        options: ['synchronize', 'restore', 'configure', 'deploy'],
        correct: 'synchronize',
      },
    },
    '28': {
      conserve: {
        prompt: 'Smart meters help households … energy during hot summers.',
        options: ['conserve', 'subsidize', 'regulate', 'restrict'],
        correct: 'conserve',
      },
      regulate: {
        prompt: 'New standards will … noise from factories near neighborhoods.',
        options: ['regulate', 'restrict', 'conserve', 'subsidize'],
        correct: 'regulate',
      },
      subsidize: {
        prompt: 'Grants can … upgrades to cleaner industrial equipment.',
        options: ['subsidize', 'regulate', 'restrict', 'conserve'],
        correct: 'subsidize',
      },
      incentivize: {
        prompt: 'Bonuses … teams to hit ambitious sustainability targets early.',
        options: ['incentivize', 'subsidize', 'regulate', 'restrict'],
        correct: 'incentivize',
      },
      restrict: {
        prompt: 'New bylaws … plastic bags at supermarkets and markets.',
        options: ['restrict', 'subsidize', 'regulate', 'conserve'],
        correct: 'restrict',
      },
    },
    '29': {
      reassure: {
        prompt: 'A quick message can … worried travelers during long delays.',
        options: ['reassure', 'empathize', 'confront', 'discourage'],
        correct: 'reassure',
      },
      empathize: {
        prompt: 'Counselors … with clients before discussing possible next steps.',
        options: ['empathize', 'confront', 'reassure', 'discourage'],
        correct: 'empathize',
      },
      discourage: {
        prompt: 'Harsh grades may … students who are still learning basics.',
        options: ['discourage', 'empathize', 'reassure', 'confront'],
        correct: 'discourage',
      },
      confront: {
        prompt: 'We must … the rumor before it spreads further.',
        options: ['confront', 'reassure', 'empathize', 'discourage'],
        correct: 'confront',
      },
      admire: {
        prompt: 'Young players … coaches who teach and mentor patiently.',
        options: ['admire', 'empathize', 'discourage', 'confront'],
        correct: 'admire',
      },
    },
    '30': {
      curate: {
        prompt: 'We should … sources carefully before publishing the newsletter.',
        options: ['curate', 'moderate', 'annotate', 'broadcast'],
        correct: 'curate',
      },
      moderate: {
        prompt: 'Please … the Q&A so everyone gets fair time.',
        options: ['moderate', 'annotate', 'broadcast', 'caption'],
        correct: 'moderate',
      },
      annotate: {
        prompt: 'Please … the slide deck with definitions for newcomers.',
        options: ['annotate', 'moderate', 'broadcast', 'curate'],
        correct: 'annotate',
      },
      broadcast: {
        prompt: 'We’ll … the keynote live across our social platforms.',
        options: ['broadcast', 'moderate', 'curate', 'caption'],
        correct: 'broadcast',
      },
      caption: {
        prompt: 'Remember to … charts so readers grasp the message immediately.',
        options: ['caption', 'broadcast', 'annotate', 'moderate'],
        correct: 'caption',
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

export default function SentenceUsageComponent({ setId, levelId, onPhaseComplete, sharedScore, onScoreShare, wordRange, wordsOverride }: SentenceUsageProps) {
  const recordResult = useAppStore(s => s.recordExerciseResult);
  const themeName = useAppStore(s => s.theme);
  const colors = getTheme(themeName);
  const isLight = themeName === 'light';
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
    // Use words override if provided (dynamic quiz). We still build the same
    // items structure as normal so the component logic remains consistent.
    if (wordsOverride && wordsOverride.length) {
      let words = wordsOverride;
      if (wordRange) {
        words = words.slice(wordRange.start, wordRange.end);
      }
      // Helper to blank out the target word in a sentence
      const blankOutWord = (sentence: string, targetWord: string): string => {
        const s = (sentence || '').trim();
        if (!s) return '…';
        const regex = new RegExp(`\\b${targetWord.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'i');
        if (regex.test(s)) return s.replace(regex, '…');
        const tokens = s.match(/[A-Za-z'']+/g) || [];
        const targetLower = targetWord.toLowerCase();
        let foundIdx = tokens.findIndex(t => t.toLowerCase().includes(targetLower) || targetLower.includes(t.toLowerCase()));
        if (foundIdx === -1) foundIdx = Math.floor(tokens.length / 2);
        const tokenToReplace = tokens[foundIdx];
        const idx = s.indexOf(tokenToReplace);
        return idx !== -1 ? s.slice(0, idx) + '…' + s.slice(idx + tokenToReplace.length) : '…';
      };

      return words.map((w, wordIdx) => {
        const correct = blankOutWord(w.example, w.word);
        const otherWords = words.filter((_, idx) => idx !== wordIdx);
        const distractors: string[] = [];
        const shuffled = otherWords
          .map(ow => ({ word: ow, sort: Math.random() }))
          .sort((a, b) => a.sort - b.sort)
          .map(x => x.word);
        for (const ow of shuffled) {
          if (distractors.length >= 3) break;
          const d = blankOutWord(ow.example, w.word);
          if (!distractors.includes(d) && d !== correct) distractors.push(d);
        }
        while (distractors.length < 3) distractors.push('…');
        const options = [correct, ...distractors]
          .map(o => ({ o, sort: Math.random() }))
          .sort((a, b) => a.sort - b.sort)
          .map(({ o }) => o);
        return {
          id: w.word,
          word: w.word,
          ipa: w.phonetic,
          sentences: options.map(text => ({ text, isCorrect: text === correct })),
        } as any;
      });
    }

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
      recordResult({
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
    <View style={[styles.container, isLight && { backgroundColor: colors.background }]}>
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ paddingBottom: 100 }}
        showsVerticalScrollIndicator={false}
        bounces={false}
      >
        <View style={styles.progressContainer}>
          <Text style={[styles.progressText, isLight && { color: '#6B7280' }]}>Word {index + 1} of {itemsData.length}</Text>
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
        <View style={[styles.progressBar, isLight && { backgroundColor: '#E5E7EB' }]}>
          <View style={[styles.progressFill, { width: `${progress * 100}%` }]} />
        </View>

        <Text style={[styles.headerText, isLight && { color: '#111827' }]}>Natural Usage</Text>
        <Text style={[styles.subHeaderText, isLight && { color: '#6B7280' }]}>
          {item.mode === 'word' ? 'Select the word that correctly completes the sentence.' : 'Pick the sentence that uses the word correctly.'}
        </Text>

        {item.mode === 'word' ? (
          <View style={styles.promptHeader}>
            <Text style={[styles.promptText, isLight && { color: '#111827' }]}>{item.prompt}</Text>
          </View>
        ) : (
          <View style={styles.wordHeader}>
            <Text style={[styles.wordText, isLight && { color: '#111827' }]}>{item.word}</Text>
            <Text style={[styles.ipaText, isLight && { color: '#6B7280' }]}>{item.ipa}</Text>
          </View>
        )}

        <View style={styles.optionsWrapper}>
          {options.map((option, idx) => {
            const isSelected = selected === idx;
            const isCorrect = option.isCorrect;

            const cardStyle: ViewStyle[] = [styles.optionCard];
            const textStyle: TextStyle[] = [styles.optionText, isLight && { color: '#111827' }];
            if (isLight) cardStyle.push(styles.optionLight);

            if (!revealed && isSelected) {
              cardStyle.push(styles.cardSelected);
            }

            if (revealed) {
              if (isCorrect) {
                // Always highlight the correct option with green background
                cardStyle.push(isLight ? styles.cardCorrectLight : styles.cardCorrect);
              } else if (isSelected) {
                // Selected but incorrect → red background
                cardStyle.push(isLight ? styles.cardIncorrectLight : styles.cardIncorrect);
              }
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
      </ScrollView>

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
    fontFamily: 'Ubuntu-Medium',
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
    fontFamily: 'Ubuntu-Bold',
  },
  scoreText: {
    fontSize: 16,
    fontWeight: '600',
    color: ACCENT_COLOR,
    fontFamily: 'Ubuntu-Bold',
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
    fontFamily: 'Ubuntu-Bold',
  },
  subHeaderText: {
    color: '#9CA3AF',
    fontSize: 14,
    marginTop: 4,
    fontFamily: 'Ubuntu-Regular',
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
    fontFamily: 'Ubuntu-Bold',
  },
  ipaText: {
    fontSize: 16,
    color: '#9CA3AF',
    fontStyle: 'italic',
    fontFamily: 'Ubuntu-Regular',
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
  optionLight: {
    backgroundColor: '#FFFFFF',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: '#FFFFFF',
  },
  cardSelected: {
    // Make selection clearer on dark cards
    borderWidth: 3,
    borderColor: ACCENT_COLOR,
  },
  optionText: {
    color: '#fff',
    fontSize: 16,
    lineHeight: 22,
    fontFamily: 'Ubuntu-Regular',
  },
  cardCorrect: {
    backgroundColor: CORRECT_COLOR,
  },
  cardIncorrect: {
    backgroundColor: INCORRECT_COLOR,
  },
  cardCorrectLight: {
    backgroundColor: '#A1BFBA',
  },
  cardIncorrectLight: {
    backgroundColor: '#C9A3A3',
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
    fontFamily: 'Ubuntu-Regular',
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
    fontFamily: 'Ubuntu-Bold',
  },
  disabledButton: {
    opacity: 0.5,
  },
});

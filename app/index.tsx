import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Image, Pressable, Animated, Platform, Linking, Modal, PanResponder, Dimensions, Alert, DeviceEventEmitter } from 'react-native';
import { InteractionManager } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import Svg, { Defs, LinearGradient as SvgLinearGradient, Rect, Stop, Pattern, Circle } from 'react-native-svg';
import { LinearGradient } from '../lib/LinearGradient';
import { Plus, Camera, Type, Flame, Clock, MessageSquare, XCircle, Search, Users, ShieldCheck, BookOpenCheck, Lightbulb, Globe, HeartPulse, Sparkles, Check, X } from 'lucide-react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useAppStore } from '../lib/store';
import { getTheme } from '../lib/theme';
import { getTodayMissionForUser, getMissionWordsByIds } from '../services/dailyMission';
import TranslationService from '../services/TranslationService';
// Lightweight entrance animation only — navigation slides handled by RouteRenderer
import OnboardingModal from './components/OnboardingModal';
// No focus animation hook needed
import { usePathname, useRouter } from 'expo-router';
import { Launch } from '../lib/launch';
import LottieView from 'lottie-react-native';
import LimitModal from '../lib/LimitModal';
import { APP_STORE_ID, ANDROID_PACKAGE_NAME, NEWS_API_KEY, NEWS_API_URL, AI_PROXY_URL, BACKEND_BASE_URL, STORY_IMAGE_URL, PRODUCTIVITY_ARTICLES_URL } from '../lib/appConfig';
import TopStatusPanel from './components/TopStatusPanel';
import SynonymMatch from './components/SynonymMatch';
import { SYNONYM_PREDEFINED } from './quiz/data/synonyms-answers';
import VaultService from '../services/VaultService';
import { aiProxyService } from '../services/AiProxyService';
import { getCached, setCached } from '../lib/aiCache';
import { supabase, SUPABASE_ANON_KEY } from '../lib/supabase';
import type { Word as MissionWord } from '../core/dailyMissionTypes';
import { getPhraseImageUrl, PHRASE_IMAGES } from './quiz/data/phrase-images';

const STORY_WORDS_DONE_KEY_PREFIX = '@engniter.storywords.done:';
const SYNONYM_MATCH_USED_WORDS_KEY = '@engniter.synonymMatch.usedWords';

// Predefined synonyms for common phrasal verbs and daily essentials
const PHRASAL_VERB_SYNONYMS: Record<string, string> = {
  'break down': 'malfunction',
  'give up': 'quit',
  'pick up': 'collect',
  'figure out': 'solve',
  'come up with': 'invent',
  'look after': 'care for',
  'put off': 'postpone',
  'turn down': 'reject',
  'get along': 'cooperate',
  'run out of': 'exhaust',
  'show up': 'arrive',
  'take off': 'depart',
  'work out': 'exercise',
  'hold on': 'wait',
  'carry on': 'continue',
  'call off': 'cancel',
  'set up': 'establish',
  'find out': 'discover',
  'bring up': 'mention',
  'look forward to': 'anticipate',
  'deal with': 'handle',
  'take over': 'assume control',
  'give back': 'return',
  'point out': 'indicate',
  'make up': 'invent',
  'turn up': 'appear',
  'back up': 'support',
  'cut down': 'reduce',
  'drop by': 'visit',
  'fall apart': 'collapse',
  'fill in': 'complete',
  'get over': 'recover',
  'go through': 'experience',
  'hang out': 'socialize',
  'keep up': 'maintain',
  'put up with': 'tolerate',
  'run into': 'encounter',
  'settle down': 'calm',
  'check in': 'register',
  'check out': 'examine',
  'clean up': 'tidy',
  'come back': 'return',
  'go on': 'continue',
  // Daily essentials
  'accomplish': 'achieve',
  'adapt': 'adjust',
  'afford': 'manage',
  'anticipate': 'expect',
  'appreciate': 'value',
  'approach': 'method',
  'arrange': 'organize',
  'assume': 'presume',
  'attempt': 'try',
  'avoid': 'evade',
  'benefit': 'advantage',
  'claim': 'assert',
  'concern': 'worry',
  'consider': 'think about',
  'convince': 'persuade',
  'crucial': 'vital',
  'decline': 'decrease',
  'delay': 'postpone',
  'efficient': 'effective',
  'emphasize': 'stress',
  'encounter': 'meet',
  'ensure': 'guarantee',
  'establish': 'create',
  'evaluate': 'assess',
  'extend': 'expand',
  'generate': 'produce',
  'implement': 'execute',
  'indicate': 'show',
  'maintain': 'keep',
  'obtain': 'get',
  'occur': 'happen',
  'participate': 'join',
  'perceive': 'see',
  'potential': 'possible',
  'require': 'need',
  'resolve': 'solve',
  'sufficient': 'enough',
};

// Helper to get synonym for a word
const getSynonymForWord = async (word: string): Promise<string | null> => {
  const normalized = word.toLowerCase().trim();

  // 1. Check phrasal verb synonyms first
  if (PHRASAL_VERB_SYNONYMS[normalized]) {
    return PHRASAL_VERB_SYNONYMS[normalized];
  }

  // 2. Check predefined synonyms
  if (SYNONYM_PREDEFINED[normalized]) {
    const correctSynonyms = SYNONYM_PREDEFINED[normalized].correct;
    if (correctSynonyms.length > 0) {
      return correctSynonyms[Math.floor(Math.random() * correctSynonyms.length)];
    }
  }

  // 3. Try AI generation for words without predefined synonyms
  try {
    const cacheKey = `synonym:${normalized}`;
    const cached = await getCached(cacheKey);
    if (cached) return cached as string;

    const response = await aiProxyService.sendRequest({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content: 'You are a vocabulary helper. Given a word or phrase, provide ONE simple synonym or equivalent expression. Reply with just the synonym, nothing else.',
        },
        {
          role: 'user',
          content: `Synonym for: ${word}`,
        },
      ],
      max_tokens: 20,
    });

    const synonym = response?.choices?.[0]?.message?.content?.trim().toLowerCase();
    if (synonym && synonym !== normalized && synonym.length < 30) {
      await setCached(cacheKey, synonym, 7 * 24 * 60 * 60 * 1000); // Cache for 7 days
      return synonym;
    }
  } catch (e) {
    console.log('[SynonymMatch] AI synonym generation failed:', e);
  }

  return null;
};

// Get words for SynonymMatch from vault by priority
const getSynonymMatchWordsFromVault = async (
  vaultWords: Array<{ id: string; word: string; folderId?: string }>,
  count: number = 4
): Promise<{ word: string; synonym: string }[]> => {
  console.log('[SynonymMatch] Starting vault word selection, total words:', vaultWords.length);

  // Get used word IDs to avoid repetition
  let usedWordIds: string[] = [];
  try {
    const raw = await AsyncStorage.getItem(SYNONYM_MATCH_USED_WORDS_KEY);
    usedWordIds = raw ? JSON.parse(raw) : [];
  } catch {}

  const usedSet = new Set(usedWordIds);

  // Priority order for folder sources
  const folderPriority = [
    VaultService.DEFAULT_FOLDER_SETS_ID,      // 1. Saved from Sets
    VaultService.DEFAULT_FOLDER_TRANSLATED_ID, // 2. Translated Words
    VaultService.DEFAULT_FOLDER_USER_ID,       // 3. My Saved Words (manual)
    VaultService.DEFAULT_FOLDER_DAILY_ID,      // 4. Daily Essentials
    VaultService.DEFAULT_FOLDER_PHRASAL_ID,    // 5. Common Phrasal Verbs
  ];

  const pairs: { word: string; synonym: string }[] = [];
  const newUsedIds: string[] = [];

  // Log folder distribution
  for (const fid of folderPriority) {
    const cnt = vaultWords.filter(w => w.folderId === fid).length;
    console.log(`[SynonymMatch] Folder ${fid}: ${cnt} words`);
  }

  // Collect words from each source in priority order
  for (const folderId of folderPriority) {
    if (pairs.length >= count) break;

    const sourceWords = vaultWords.filter(
      w => w.folderId === folderId && !usedSet.has(w.id)
    );

    console.log(`[SynonymMatch] Checking folder ${folderId}, found ${sourceWords.length} unused words`);

    // Shuffle source words for variety
    const shuffled = [...sourceWords].sort(() => Math.random() - 0.5);

    for (const w of shuffled) {
      if (pairs.length >= count) break;

      const synonym = await getSynonymForWord(w.word);
      console.log(`[SynonymMatch] Word "${w.word}" -> synonym: ${synonym || 'null'}`);
      if (synonym && synonym.toLowerCase() !== w.word.toLowerCase()) {
        pairs.push({ word: w.word, synonym });
        newUsedIds.push(w.id);
      }
    }
  }

  console.log(`[SynonymMatch] Found ${pairs.length} pairs:`, pairs);

  // If still not enough, reset used words and try again from all sources
  if (pairs.length < count && usedWordIds.length > 0) {
    usedSet.clear();
    for (const folderId of folderPriority) {
      if (pairs.length >= count) break;

      const sourceWords = vaultWords.filter(
        w => w.folderId === folderId && !newUsedIds.includes(w.id)
      );

      const shuffled = [...sourceWords].sort(() => Math.random() - 0.5);

      for (const w of shuffled) {
        if (pairs.length >= count) break;

        const synonym = await getSynonymForWord(w.word);
        if (synonym && synonym.toLowerCase() !== w.word.toLowerCase()) {
          pairs.push({ word: w.word, synonym });
          newUsedIds.push(w.id);
        }
      }
    }
  }

  // Save used word IDs (keep last 50 to avoid infinite growth)
  try {
    const updated = [...usedWordIds, ...newUsedIds].slice(-50);
    await AsyncStorage.setItem(SYNONYM_MATCH_USED_WORDS_KEY, JSON.stringify(updated));
  } catch {}

  return pairs;
};

// Story words with images - definitions for the 44 mapped phrases
// Example sentences use the exact phrasal verb form to ensure fill-in-blanks work correctly
const STORY_WORDS_DATA: Record<string, { definition: string; example: string }> = {
  'miss the bus': { definition: 'to arrive too late to catch the bus', example: 'If you miss the bus, you will have to walk.' },
  'pick up': { definition: 'to lift something from a surface', example: 'Please pick up that pen from the floor.' },
  'hand in': { definition: 'to submit work or documents', example: 'You need to hand in your report by Friday.' },
  'work on': { definition: 'to spend time doing or improving something', example: 'I need to work on my presentation tonight.' },
  'figure out': { definition: 'to understand or solve something', example: 'I need to figure out how this works.' },
  'make progress': { definition: 'to move forward or improve', example: 'We need to make progress on this project.' },
  'finish up': { definition: 'to complete something', example: 'Let me finish up this email first.' },
  'agree with': { definition: 'to have the same opinion as someone', example: 'I agree with your suggestion completely.' },
  'disagree with': { definition: 'to have a different opinion', example: 'I disagree with that proposal.' },
  'apologize': { definition: 'to say sorry for something', example: 'I apologize for the inconvenience.' },
  'thank someone': { definition: 'to express gratitude', example: 'I want to thank someone for helping me.' },
  'ask for help': { definition: 'to request assistance', example: 'Do not hesitate to ask for help.' },
  'come back': { definition: 'to return to a place', example: 'I will come back tomorrow morning.' },
  'leave early': { definition: 'to depart before the usual time', example: 'I need to leave early for my appointment.' },
  'show up': { definition: 'to arrive or appear', example: 'Please show up on time for the meeting.' },
  'stay in': { definition: 'to remain at home', example: 'I prefer to stay in on rainy days.' },
  'head out': { definition: 'to leave or depart', example: 'We should head out before traffic gets bad.' },
  'break down': { definition: 'to stop working (machine)', example: 'Cars can break down without warning.' },
  'fix': { definition: 'to repair something', example: 'Can you fix this broken chair?' },
  'deal with': { definition: 'to handle or manage', example: 'I will deal with this problem later.' },
  'avoid': { definition: 'to stay away from', example: 'I try to avoid junk food.' },
  'prevent': { definition: 'to stop something from happening', example: 'We must prevent this from happening again.' },
  'decide': { definition: 'to make a choice', example: 'I cannot decide which one to buy.' },
  'plan ahead': { definition: 'to prepare for the future', example: 'It is important to plan ahead for success.' },
  'change mind': { definition: 'to form a new opinion', example: 'People often change mind after reflection.' },
  'stick to': { definition: 'to continue doing something', example: 'We should stick to the original plan.' },
  'give up': { definition: 'to stop trying', example: 'Never give up on your dreams.' },
  'pay for': { definition: 'to give money in exchange', example: 'I will pay for dinner tonight.' },
  'run out of': { definition: 'to have no more of something', example: 'We cannot run out of supplies.' },
  'save money': { definition: 'to keep money for later', example: 'It is wise to save money for emergencies.' },
  'spend money': { definition: 'to use money to buy things', example: 'Do not spend money on unnecessary items.' },
  'afford': { definition: 'to have enough money for', example: 'I cannot afford a new car right now.' },
  'feel confident': { definition: 'to feel sure of yourself', example: 'I feel confident about the exam.' },
  'feel unsure': { definition: 'to feel uncertain', example: 'I feel unsure about my decision.' },
  'stay calm': { definition: 'to remain relaxed', example: 'Try to stay calm during the interview.' },
  'get stressed': { definition: 'to feel anxious or worried', example: 'I tend to get stressed before deadlines.' },
  'relax': { definition: 'to rest and feel calm', example: 'I like to relax on weekends.' },
  'at first': { definition: 'in the beginning', example: 'At first, it seemed difficult.' },
  'in the end': { definition: 'finally, after everything', example: 'In the end, everything worked out.' },
  'right away': { definition: 'immediately', example: 'I will do it right away.' },
  'for a while': { definition: 'for some time', example: 'I waited for a while before leaving.' },
  'on time': { definition: 'punctually, not late', example: 'The train arrived on time.' },
  'take over': { definition: 'to assume control', example: 'She will take over as manager next week.' },
  'be in charge': { definition: 'to be responsible for', example: 'Who will be in charge of the project?' },
};

// Get 5 story words with images for today (cycles through all 44 every ~9 days)
const getDailyStoryWordsWithImages = (): MissionWord[] => {
  const phrases = Object.keys(PHRASE_IMAGES);
  const totalPhrases = phrases.length; // 44
  const wordsPerDay = 5;

  // Calculate day index relative to a baseline (Dec 18, 2025 = day 0)
  const baseline = new Date('2025-12-18').getTime();
  const today = new Date();
  const dayIndex = Math.floor((today.getTime() - baseline) / (1000 * 60 * 60 * 24));

  // Calculate starting index for today (cycles through all phrases)
  // Day 0 = words 0-4, Day 1 = words 5-9, etc.
  const startIndex = (Math.max(0, dayIndex) * wordsPerDay) % totalPhrases;

  // Get 5 phrases starting from today's index (wraps around)
  const selected: string[] = [];
  for (let i = 0; i < wordsPerDay; i++) {
    const idx = (startIndex + i) % totalPhrases;
    selected.push(phrases[idx]);
  }

  return selected.map((phrase, idx) => {
    const data = STORY_WORDS_DATA[phrase] || { definition: '', example: '' };
    return {
      id: `story-img-${dayIndex}-${idx}`,
      text: phrase,
      definition: data.definition,
      exampleSentence: data.example,
      difficulty: 1,
    };
  });
};

// Minimal screen-focus animation handled inline on Home

const SELECTED_LEVEL_KEY = '@engniter.selectedLevel';

type QuizQuestion = {
  question: string;
  options: string[];
  correctIndex: number;
};

type NewsItem = {
  title: string;
  summary: string;
  vocab: { word: string; definition: string; translation?: string }[];
  image?: string;
  tag?: string;
  category?: string;
  tone?: string;
  vocabSource?: 'backend' | 'client' | 'fallback';
  cache_key?: string;
  cache_hit?: boolean;
  generated_at?: string;
  source_url?: string;
  hookTitle?: string;
  whyMatters?: string;
  quiz?: QuizQuestion[];
  keyTakeaways?: string[];
  dailyChallenge?: string;
};

type NewsTopicId = 'tech' | 'ai' | 'productivity' | 'startups' | 'learning' | 'language' | 'science';

type NewsPrefs = {
  topics: NewsTopicId[];
  hideSports: boolean;
};

// Module-level preloaded productivity articles cache for instant display
const PROD_CACHE_KEY = '@engniter.productivity.articles.v3';
let _preloadedProductivityArticles: NewsItem[] = [];
let _productivityPreloadPromise: Promise<NewsItem[]> | null = null;

// Start preloading productivity articles immediately when module loads
const preloadProductivityArticles = async (): Promise<NewsItem[]> => {
  try {
    const cached = await AsyncStorage.getItem(PROD_CACHE_KEY);
    if (cached) {
      const parsed = JSON.parse(cached);
      if (Array.isArray(parsed?.articles) && parsed.articles.length > 0) {
        _preloadedProductivityArticles = parsed.articles;
        return parsed.articles;
      }
    }
  } catch {}
  return [];
};

// Start preload immediately
_productivityPreloadPromise = preloadProductivityArticles();

// Fallback productivity/lifestyle articles when API doesn't return suitable content
const FALLBACK_PRODUCTIVITY_ARTICLES: NewsItem[] = [
  {
    title: 'The 2-Minute Rule: A Simple Trick to Stop Procrastinating',
    summary: 'If a task takes less than two minutes to complete, do it immediately. This simple rule from productivity expert David Allen helps you avoid the mental burden of small tasks piling up. The idea is that the time you spend thinking about and postponing these quick tasks often exceeds the time needed to just do them. Start with emails, dishes, or quick messages. Once you build this habit, you\'ll find your to-do list stays manageable and your mind stays clearer throughout the day.',
    vocab: [
      { word: 'procrastinating', definition: 'delaying or postponing tasks unnecessarily' },
      { word: 'mental burden', definition: 'stress caused by having to remember or think about something' },
      { word: 'manageable', definition: 'able to be controlled or dealt with easily' },
    ],
    image: 'https://images.unsplash.com/photo-1484480974693-6ca0a78fb36b?auto=format&fit=crop&w=1600&q=80',
    tag: 'Productivity',
    category: 'lifestyle',
  },
  {
    title: 'How to Build a Morning Routine That Actually Sticks',
    summary: 'The key to a successful morning routine isn\'t doing everything—it\'s doing a few things consistently. Start small: wake up at the same time daily, hydrate immediately, and spend 5-10 minutes on something that energizes you (exercise, reading, or journaling). Avoid checking your phone for the first 30 minutes. The goal is to create momentum before the day\'s demands take over. Remember, habits take about 66 days to form, so give yourself time and stay patient.',
    vocab: [
      { word: 'consistently', definition: 'doing something the same way over time' },
      { word: 'hydrate', definition: 'to drink water or other fluids' },
      { word: 'momentum', definition: 'the force that keeps something moving forward' },
    ],
    image: 'https://images.unsplash.com/photo-1506126613408-eca07ce68773?auto=format&fit=crop&w=1600&q=80',
    tag: 'Lifestyle',
    category: 'lifestyle',
  },
  {
    title: '5 Science-Backed Ways to Improve Your Focus',
    summary: 'Struggling to concentrate? Research shows these techniques actually work: First, work in 25-minute blocks (the Pomodoro Technique) followed by 5-minute breaks. Second, eliminate distractions by putting your phone in another room—out of sight, out of mind. Third, get enough sleep; even one hour less can reduce cognitive performance by 25%. Fourth, exercise regularly to boost brain-derived neurotrophic factor (BDNF). Finally, practice single-tasking instead of multitasking, which fragments your attention.',
    vocab: [
      { word: 'concentrate', definition: 'to focus all your attention on something' },
      { word: 'cognitive', definition: 'related to thinking and mental processes' },
      { word: 'fragments', definition: 'breaks into small, disconnected pieces' },
    ],
    image: 'https://images.unsplash.com/photo-1499750310107-5fef28a66643?auto=format&fit=crop&w=1600&q=80',
    tag: 'Focus',
    category: 'productivity',
  },
  {
    title: 'The Power of Saying No: Setting Healthy Boundaries',
    summary: 'Learning to say no is one of the most valuable life skills you can develop. It protects your time, energy, and mental health. Start by recognizing that every yes to something is a no to something else. Practice with low-stakes situations first. Use phrases like "I can\'t commit to that right now" or "That doesn\'t work for me." Remember: people who respect you will understand your boundaries. Those who don\'t were likely taking advantage of your availability.',
    vocab: [
      { word: 'boundaries', definition: 'limits that define acceptable behavior from others' },
      { word: 'commit', definition: 'to promise or dedicate yourself to something' },
      { word: 'availability', definition: 'the state of being free to do something' },
    ],
    image: 'https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?auto=format&fit=crop&w=1600&q=80',
    tag: 'Life Tips',
    category: 'lifestyle',
  },
  {
    title: 'How to Learn Anything Faster: The Feynman Technique',
    summary: 'Named after Nobel Prize-winning physicist Richard Feynman, this learning method involves four steps: Choose a concept and study it. Explain it in simple terms as if teaching a child. Identify gaps in your understanding and go back to the source material. Simplify further using analogies. This technique works because it forces active recall and exposes weak spots in your knowledge. It\'s more effective than passive re-reading and highlights what you truly understand versus what you\'ve merely memorized.',
    vocab: [
      { word: 'concept', definition: 'an idea or principle that explains something' },
      { word: 'analogies', definition: 'comparisons that explain something by showing how it\'s similar to something else' },
      { word: 'memorized', definition: 'learned something so you can remember it exactly' },
    ],
    image: 'https://images.unsplash.com/photo-1456513080510-7bf3a84b82f8?auto=format&fit=crop&w=1600&q=80',
    tag: 'Learning',
    category: 'education',
  },
  {
    title: 'Digital Minimalism: How to Reclaim Your Attention',
    summary: 'The average person spends over 4 hours daily on their smartphone. Digital minimalism is about being intentional with technology. Start by auditing your screen time and identifying time-wasting apps. Remove social media from your phone (you can still access it on desktop). Turn off non-essential notifications. Create phone-free zones in your home. Schedule specific times to check email rather than constantly monitoring it. The goal isn\'t to reject technology but to use it purposefully.',
    vocab: [
      { word: 'intentional', definition: 'done on purpose, with awareness and thought' },
      { word: 'auditing', definition: 'examining something carefully to understand it better' },
      { word: 'purposefully', definition: 'with a clear intention or goal in mind' },
    ],
    image: 'https://images.unsplash.com/photo-1512486130939-2c4f79935e4f?auto=format&fit=crop&w=1600&q=80',
    tag: 'Digital Life',
    category: 'lifestyle',
  },
  {
    title: 'The Art of Deep Work: How to Achieve More in Less Time',
    summary: 'Deep work, a term coined by Cal Newport, refers to focused, uninterrupted work on cognitively demanding tasks. To practice it: schedule dedicated blocks of 90 minutes to 2 hours. Work in a consistent location. Start with a ritual (same music, same drink) to signal your brain it\'s time to focus. Track your deep work hours weekly. Most knowledge workers only achieve 1-2 hours of deep work daily, so even small increases can dramatically boost your output and career advancement.',
    vocab: [
      { word: 'cognitively', definition: 'related to mental processes like thinking and reasoning' },
      { word: 'ritual', definition: 'a routine action done in a specific way' },
      { word: 'dramatically', definition: 'in a way that is sudden or significant' },
    ],
    image: 'https://images.unsplash.com/photo-1483058712412-4245e9b90334?auto=format&fit=crop&w=1600&q=80',
    tag: 'Productivity',
    category: 'productivity',
  },
  {
    title: 'Sleep Optimization: Small Changes for Better Rest',
    summary: 'Quality sleep is the foundation of productivity. Here are evidence-based improvements: Keep your bedroom cool (65-68°F/18-20°C). Stop screen use 1 hour before bed—blue light suppresses melatonin. Maintain consistent sleep and wake times, even on weekends. Limit caffeine after 2 PM, as its half-life is 5-6 hours. Avoid alcohol before bed; it disrupts REM sleep. Consider blackout curtains and white noise. Even implementing 2-3 of these changes can significantly improve sleep quality.',
    vocab: [
      { word: 'foundation', definition: 'the base or starting point that everything else depends on' },
      { word: 'suppresses', definition: 'stops or reduces something' },
      { word: 'disrupts', definition: 'interrupts the normal progress of something' },
    ],
    image: 'https://images.unsplash.com/photo-1541781774459-bb2af2f05b55?auto=format&fit=crop&w=1600&q=80',
    tag: 'Health',
    category: 'health',
  },
];

const NEWS_PREFS_KEY = '@engniter.news.prefs.v1';
const NEWS_DEFAULT_TOPICS: NewsTopicId[] = ['productivity', 'learning', 'language'];
const NEWS_TOPIC_OPTIONS: Array<{ id: NewsTopicId; label: string }> = [
  { id: 'tech', label: 'Technology' },
  { id: 'ai', label: 'AI' },
  { id: 'productivity', label: 'Productivity' },
  { id: 'startups', label: 'Startups' },
  { id: 'learning', label: 'Learning' },
  { id: 'language', label: 'Language' },
  { id: 'science', label: 'Science' },
];

const NEWS_TOPIC_KEYWORDS: Record<NewsTopicId, string[]> = {
  tech: [
    'technology',
    'tech',
    'software',
    'app',
    'apps',
    'tool',
    'tools',
    'cloud',
    'cybersecurity',
    'security',
    'data breach',
    'chip',
    'semiconductor',
    'smartphone',
    'iphone',
    'android',
    'microsoft',
    'google',
    'apple',
    'meta',
    'amazon',
  ],
  ai: [
    'ai',
    'artificial intelligence',
    'machine learning',
    'deep learning',
    'neural',
    'llm',
    'large language model',
    'chatbot',
    'openai',
    'chatgpt',
    'gpt',
    'generative',
  ],
  productivity: [
    'productivity',
    'how to',
    'tips',
    'guide',
    'advice',
    'life hack',
    'lifehack',
    'lifestyle',
    'self-help',
    'self help',
    'wellness',
    'mental health',
    'mindfulness',
    'meditation',
    'motivation',
    'career',
    'workplace',
    'management',
    'leadership',
    'remote work',
    'work from home',
    'time management',
    'focus',
    'workflow',
    'habits',
    'routine',
    'morning routine',
    'burnout',
    'stress',
    'balance',
    'work-life',
    'resume',
    'interview',
    'success',
    'goals',
    'planning',
    'organization',
    'declutter',
    'minimalism',
    'healthy',
    'fitness',
    'exercise',
    'sleep',
    'nutrition',
    'diet',
    'relationships',
    'communication',
    'confidence',
    'creativity',
    'inspiration',
  ],
  startups: [
    'startup',
    'startups',
    'founder',
    'funding',
    'venture',
    'seed round',
    'series a',
    'series b',
    'accelerator',
    'saas',
    'product launch',
    'growth',
  ],
  learning: [
    'learning',
    'self improvement',
    'self-improvement',
    'personal development',
    'personal growth',
    'study',
    'studying',
    'skills',
    'skill',
    'course',
    'training',
    'edtech',
    'education',
    'habit',
    'mindset',
    'growth mindset',
    'reading',
    'books',
    'book',
    'writing',
    'journaling',
    'brain',
    'memory',
    'cognitive',
    'intelligence',
    'smart',
    'clever',
    'knowledge',
    'wisdom',
    'lessons',
    'experience',
    'mistakes',
    'failure',
    'resilience',
    'discipline',
    'practice',
    'mastery',
    'beginner',
    'expert',
  ],
  language: [
    'language learning',
    'language',
    'linguistics',
    'vocabulary',
    'grammar',
    'pronunciation',
    'english',
    'bilingual',
    'translation',
    'duolingo',
  ],
  science: [
    'science',
    'research',
    'study',
    'scientists',
    'space',
    'nasa',
    'climate',
    'biology',
    'physics',
    'health',
  ],
};

const NEWS_SPORTS_STRONG_RE =
  /\b(nfl|nba|mlb|nhl|ncaaf|ncaa|super\s?bowl|world\s?cup|premier\s?league|champions\s?league|ufc|mma|formula\s?1|f1|football|soccer|tennis|golf|cricket|basketball|baseball|hockey)\b/i;
const NEWS_SPORTS_BETTING_RE =
  /\b(betting|sportsbook|odds|fantasy|parlay|wager|gambling)\b/i;
const NEWS_SPORTS_WEAK_TOKENS = new Set<string>([
  'team',
  'match',
  'playoffs',
  'tournament',
  'season',
  'league',
  'coach',
  'player',
  'score',
  'scored',
  'goal',
  'goals',
  'touchdown',
  'quarterback',
  'stadium',
]);

// Filters for low-value news (sports betting, financial trading)
// Keep it minimal - let the scoring system prefer productivity content
const NEWS_STRONG_BLACKLIST_RE =
  /\b(etf|exchange-traded fund|13f|stock holdings?|holdings report|acquires?\s+shares?|purchases?\s+shares?|buys?\s+shares?|coverage map|injury report|fantasy|sportsbook|odds|parlay|qb\b|wr\b|tight end|touchdowns?|touchdown)\b/i;
const NEWS_WEAK_BLACKLIST_RE =
  /\b(dividend|price target|analyst (upgrade|downgrade)|earnings call|quarterly earnings|shares? (rise|fall|jump|drop)|stock (surges?|plunges?)|press release|prnewswire)\b/i;

const isLowValueNews = (title: string, summary: string, category?: string) => {
  const text = `${title || ''} ${summary || ''} ${category || ''}`.trim();
  if (!text) return false;
  // Avoid broad matches like "Week" unless it's clearly the sports schedule pattern.
  if (/\bweek\s+\d+\b/i.test(text) && /\b(nfl|nba|mlb|nhl|football|soccer|coverage|schedule)\b/i.test(text)) {
    return true;
  }
  if (NEWS_STRONG_BLACKLIST_RE.test(text)) return true;
  return false;
};

const normalizeNewsText = (text: string) =>
  (text || '')
    .toLowerCase()
    .replace(/[\u2019’]/g, "'")
    .replace(/[^a-z0-9\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

const tokenizeNewsTitle = (title: string) => {
  const tokens = normalizeNewsText(title).split(' ').filter(Boolean);
  const stop = new Set<string>([
    'the',
    'a',
    'an',
    'and',
    'or',
    'to',
    'of',
    'in',
    'on',
    'for',
    'with',
    'from',
    'at',
    'by',
    'as',
    'is',
    'are',
    'was',
    'were',
    'be',
    'been',
    'it',
    'this',
    'that',
    'these',
    'those',
    'says',
    'say',
    'said',
    'report',
    'reports',
    'update',
    'live',
    'today',
    'new',
  ]);
  const out = new Set<string>();
  for (const t of tokens) {
    if (t.length < 3) continue;
    if (stop.has(t)) continue;
    out.add(t);
  }
  return out;
};

const normalizeNewsUrl = (raw: string) => {
  const s = (raw || '').trim();
  if (!s) return '';
  try {
    const u = new URL(s);
    ['utm_source', 'utm_medium', 'utm_campaign', 'utm_term', 'utm_content', 'fbclid', 'gclid'].forEach((p) =>
      u.searchParams.delete(p)
    );
    u.hash = '';
    u.hostname = u.hostname.toLowerCase();
    if (u.pathname !== '/' && u.pathname.endsWith('/')) u.pathname = u.pathname.slice(0, -1);
    return u.toString();
  } catch {
    return s;
  }
};

const jaccard = (a: Set<string>, b: Set<string>) => {
  if (!a.size || !b.size) return 0;
  let inter = 0;
  for (const x of a) if (b.has(x)) inter += 1;
  const union = a.size + b.size - inter;
  return union ? inter / union : 0;
};

const isSportsNews = (title: string, summary: string, category?: string) => {
  const cat = (category || '').toLowerCase();
  if (cat.includes('sport')) return true;
  const text = `${title || ''} ${summary || ''}`.trim();
  if (!text) return false;
  if (NEWS_SPORTS_STRONG_RE.test(text)) return true;
  if (NEWS_SPORTS_BETTING_RE.test(text)) return true;

  const tokens = normalizeNewsText(text).split(' ').filter(Boolean);
  let weakHits = 0;
  for (const t of tokens) {
    if (NEWS_SPORTS_WEAK_TOKENS.has(t)) weakHits += 1;
    if (weakHits >= 3) return true;
  }
  return false;
};

const keywordHits = (haystack: string, keywords: string[]) => {
  const text = (haystack || '').toLowerCase();
  let hits = 0;
  for (const k of keywords) {
    const kw = k.toLowerCase();
    if (!kw) continue;
    if (kw.length <= 3) {
      const re = new RegExp(`\\b${kw.replace(/[.*+?^${}()|[\\]\\\\]/g, '\\\\$&')}\\b`, 'i');
      if (re.test(text)) hits += 1;
    } else if (text.includes(kw)) {
      hits += 1;
    }
  }
  return hits;
};

const scoreNewsItemForTopics = (item: NewsItem, topics: NewsTopicId[]) => {
  const title = item?.title || '';
  const summary = item?.summary || '';
  const category = item?.category || '';
  const text = `${title} ${summary} ${category}`.toLowerCase();
  let score = 0;
  for (const t of topics) {
    const hits = keywordHits(text, NEWS_TOPIC_KEYWORDS[t] || []);
    if (hits <= 0) continue;
    score += hits * 6;
    // Prefer items that hit in the title.
    score += keywordHits(title.toLowerCase(), NEWS_TOPIC_KEYWORDS[t] || []) * 6;
  }
  // Quality boosts: "useful" topics for language learners.
  const boosts: Array<{ re: RegExp; titlePts: number; bodyPts: number }> = [
    { re: /\b(ai|artificial intelligence|llm|chatgpt|openai|gpt)\b/i, titlePts: 22, bodyPts: 10 },
    { re: /\b(productivity|workflow|habit|focus|time management)\b/i, titlePts: 18, bodyPts: 8 },
    { re: /\b(language learning|linguistics|vocabulary|grammar|pronunciation)\b/i, titlePts: 18, bodyPts: 8 },
    { re: /\b(startup|founder|funding|venture|seed round|series [ab])\b/i, titlePts: 14, bodyPts: 6 },
    { re: /\b(research|study|scientist|paper|breakthrough)\b/i, titlePts: 12, bodyPts: 6 },
    { re: /\b(tool|app|feature|update|launch|open source)\b/i, titlePts: 10, bodyPts: 4 },
  ];
  for (const b of boosts) {
    if (b.re.test(title)) score += b.titlePts;
    else if (b.re.test(text)) score += b.bodyPts;
  }

  // Penalties for spammy/low-value patterns.
  if (NEWS_WEAK_BLACKLIST_RE.test(text)) score -= 40;
  if (NEWS_STRONG_BLACKLIST_RE.test(text)) score -= 200;
  if (NEWS_SPORTS_STRONG_RE.test(text) || NEWS_SPORTS_BETTING_RE.test(text)) score -= 200;

  // Small nudge for explicit upstream categories.
  if (/(technology|tech)/i.test(category)) score += 8;
  if (/(education|learning)/i.test(category)) score += 4;
  if (/(science|research|space)/i.test(category)) score += 4;
  return score;
};

const buildNewsIncludeQuery = (topics: NewsTopicId[]) => {
  const wanted = topics.length ? topics : NEWS_DEFAULT_TOPICS;
  const seed: Record<NewsTopicId, string[]> = {
    tech: ['technology', 'software', 'cybersecurity'],
    ai: ['AI', 'machine learning', 'LLM'],
    productivity: ['productivity', 'career', 'workplace'],
    startups: ['startup', 'funding', 'venture capital'],
    learning: ['learning', 'self-improvement', 'study'],
    language: ['language learning', 'linguistics', 'vocabulary'],
    science: ['science', 'research', 'space'],
  };
  const terms: string[] = [];
  wanted.forEach((t) => {
    (seed[t] || []).forEach((s) => terms.push(s));
  });
  return Array.from(new Set(terms)).slice(0, 12).join(' OR ');
};

const buildNewsExcludeQuery = () =>
  [
    // Sports + betting
    'sports',
    'nfl',
    'nba',
    'mlb',
    'nhl',
    'football',
    'soccer',
    'tennis',
    'golf',
    'betting',
    'odds',
    'fantasy',
    'injury report',
    'coverage map',
    'qb',
    'wr',
    // Finance spam / holdings PR
    'etf',
    'stock holdings',
    'holdings report',
    'acquires shares',
    'purchases shares',
    'price target',
    'analyst upgrade',
    'analyst downgrade',
    // Low-value politics / gossip
    'reelection',
    'lawmakers',
    'senator',
    'celebrity',
    'gossip',
  ].join(' OR ');

const NEWS_DESIRED_COUNT = 10;

type NewsFilterStats = {
  fetched: number;
  afterFilter: number;
  afterDedupe: number;
  rendered: number;
};

const isSportsContent = (title: string, summary: string, category?: string) => {
  const cat = (category || '').toLowerCase();
  if (cat.includes('sport')) return true;
  const text = `${title || ''} ${summary || ''}`.trim();
  if (!text) return false;
  if (NEWS_SPORTS_STRONG_RE.test(text)) return true;
  if (NEWS_SPORTS_BETTING_RE.test(text)) return true;
  const tokens = normalizeNewsText(text).split(' ').filter(Boolean);
  let weakHits = 0;
  for (const t of tokens) {
    if (NEWS_SPORTS_WEAK_TOKENS.has(t)) weakHits += 1;
    if (weakHits >= 3) return true;
  }
  return false;
};

const newsArticleKey = (article: NewsItem) => {
  const title = normalizeNewsText(article.title || '');
  const source = normalizeNewsText(article.source_url || '');
  return `${title}::${source}`;
};

const dedupeNewsItems = (items: NewsItem[]) => {
  const seen = new Set<string>();
  const out: NewsItem[] = [];
  items.forEach((item) => {
    const key = newsArticleKey(item);
    if (seen.has(key)) return;
    seen.add(key);
    out.push(item);
  });
  return out;
};

const ensureMinimumNews = (primary: NewsItem[], fallback: NewsItem[], minCount: number) => {
  if (primary.length >= minCount) return primary;
  const filled = [...primary];
  const seen = new Set(primary.map((item) => newsArticleKey(item)));
  for (const article of fallback) {
    if (filled.length >= minCount) break;
    const key = newsArticleKey(article);
    if (seen.has(key)) continue;
    seen.add(key);
    filled.push(article);
  }
  return filled;
};

const refineNewsArticles = (
  articles: NewsItem[],
  topics: NewsTopicId[],
  hideSports: boolean
): { deduped: NewsItem[]; filtered: NewsItem[]; stats: NewsFilterStats } => {
  const stats: NewsFilterStats = { fetched: articles.length, afterFilter: 0, afterDedupe: 0, rendered: 0 };
  const filtered = articles.filter((item) => {
    if (!item || !item.title || !item.summary) return false;
    if (hideSports && isSportsContent(item.title, item.summary, item.category)) return false;
    if (isLowValueNews(item.title, item.summary, item.category)) return false;
    return true;
  });
  stats.afterFilter = filtered.length;
  const scored = filtered
    .map((item) => ({ item, score: scoreNewsItemForTopics(item, topics) }))
    .sort((a, b) => b.score - a.score)
    .map((entry) => entry.item);
  const deduped = dedupeNewsItems(scored);
  stats.afterDedupe = deduped.length;
  return { deduped, filtered, stats };
};

// Tag color mapping for article categories
const TAG_COLORS: Record<string, { bg: string; text: string }> = {
  productivity: { bg: '#5B8FA8', text: '#FFFFFF' },
  growth: { bg: '#5B8FA8', text: '#FFFFFF' },
  creativity: { bg: '#E8A85C', text: '#FFFFFF' },
  learning: { bg: '#6B9E78', text: '#FFFFFF' },
  wellness: { bg: '#7BCEC4', text: '#FFFFFF' },
  balance: { bg: '#7BCEC4', text: '#FFFFFF' },
  health: { bg: '#7BCEC4', text: '#FFFFFF' },
  'life tips': { bg: '#9B8DC4', text: '#FFFFFF' },
  lifetips: { bg: '#9B8DC4', text: '#FFFFFF' },
  live: { bg: '#E88B9C', text: '#FFFFFF' },
  motivation: { bg: '#E8A85C', text: '#FFFFFF' },
  tech: { bg: '#5B8FA8', text: '#FFFFFF' },
  technology: { bg: '#5B8FA8', text: '#FFFFFF' },
  business: { bg: '#6B7A8C', text: '#FFFFFF' },
  science: { bg: '#7BA3C4', text: '#FFFFFF' },
  entertainment: { bg: '#C47BA3', text: '#FFFFFF' },
  lifestyle: { bg: '#A8C47B', text: '#FFFFFF' },
  finance: { bg: '#5C8A6B', text: '#FFFFFF' },
  travel: { bg: '#5BACB8', text: '#FFFFFF' },
  food: { bg: '#E8A07B', text: '#FFFFFF' },
  sports: { bg: '#7B8CE8', text: '#FFFFFF' },
  politics: { bg: '#8B7A6B', text: '#FFFFFF' },
  world: { bg: '#6B8B9B', text: '#FFFFFF' },
  featured: { bg: '#E8A85C', text: '#FFFFFF' },
  article: { bg: '#9CA3AF', text: '#FFFFFF' },
};
const DEFAULT_TAG_COLOR = { bg: '#9CA3AF', text: '#FFFFFF' };

const getTagColor = (tag: string | undefined) => {
  if (!tag) return DEFAULT_TAG_COLOR;
  const normalized = tag.toLowerCase().trim();
  return TAG_COLORS[normalized] || DEFAULT_TAG_COLOR;
};

// Card color palettes - each palette has inner card gradient and outer container tint
// Inspired by podcast/article card designs where card color matches image vibe
type CardColorPalette = {
  light: { inner: [string, string]; outer: string };
  dark: { inner: [string, string]; outer: string };
};

const CARD_COLOR_PALETTES: CardColorPalette[] = [
  // Breaker Bay - teal for wellness, health (paled)
  { light: { inner: ['#8DC4B4', '#9DD4C4'], outer: '#E8F5F1' }, dark: { inner: ['#3A6B5A', '#4A7B6A'], outer: '#1A2E25' } },
  // Opal - sage/mint for nature, environment (paled)
  { light: { inner: ['#C4DAD4', '#D4EAE4'], outer: '#F0F6F4' }, dark: { inner: ['#5A7A72', '#6A8A82'], outer: '#1E2E2A' } },
  // Blue Bayoux - dark blue for tech, business (paled)
  { light: { inner: ['#7A9AAD', '#8AAABD'], outer: '#E8EEF2' }, dark: { inner: ['#2A4050', '#3A5060'], outer: '#1A2228' } },
  // Cyan/teal for motivation (paled)
  { light: { inner: ['#5AADB8', '#6ABDC8'], outer: '#E6F4F6' }, dark: { inner: ['#025A63', '#036A73'], outer: '#1A2A2C' } },
  // Flush Mahogany - red for live, creativity (paled)
  { light: { inner: ['#E8A0A0', '#F0B0B0'], outer: '#FCECEC' }, dark: { inner: ['#7A2A2A', '#8A3A3A'], outer: '#2A1A1A' } },
  // Pearl Bush - cream for lifestyle, food (paled)
  { light: { inner: ['#EDE5D8', '#F5EDE2'], outer: '#FAF8F4' }, dark: { inner: ['#7A7260', '#8A8270'], outer: '#2A2820' } },
  // Dusty rose for goals (paled)
  { light: { inner: ['#E8B4B5', '#F0C4C5'], outer: '#FAF0F0' }, dark: { inner: ['#7A4A4B', '#8A5A5B'], outer: '#2A2020' } },
  // Burnt Sienna - orange for growth (paled)
  { light: { inner: ['#F2A890', '#F8B8A0'], outer: '#FDF0EB' }, dark: { inner: ['#8A4A38', '#9A5A48'], outer: '#2A1E1A' } },
  // Sage grey-green for live (paled)
  { light: { inner: ['#B4C8C2', '#C4D8D2'], outer: '#F2F5F4' }, dark: { inner: ['#5A6B65', '#6A7B75'], outer: '#1E2422' } },
  // Light pink for finance (paled)
  { light: { inner: ['#F8C4C4', '#FCD4D4'], outer: '#FDF5F5' }, dark: { inner: ['#8A5A5A', '#9A6A6A'], outer: '#2A2020' } },
  // #F2C2D4 - soft pink for balance
  { light: { inner: ['#F2C2D4', '#F8D2E4'], outer: '#FDF8FA' }, dark: { inner: ['#8A6A7A', '#9A7A8A'], outer: '#2A2025' } },
  // #D97EB0 - vibrant pink for live news
  { light: { inner: ['#E9A8CB', '#F0B8D8'], outer: '#FDF0F7' }, dark: { inner: ['#9A5080', '#AA6090'], outer: '#2A1825' } },
  // #9D7CA6 - purple for live news (alternating)
  { light: { inner: ['#C4A8CB', '#D0B8D8'], outer: '#F8F0FC' }, dark: { inner: ['#6A5080', '#7A6090'], outer: '#201825' } },
];

// Map tags/categories to specific color palettes
// 0: Breaker Bay (teal) - wellness, health
// 1: Opal (sage) - nature, environment
// 2: Blue Bayoux (blue) - tech, business
// 3: #037F8C (cyan) - motivation
// 4: Flush Mahogany (red) - creativity
// 5: Pearl Bush (cream) - lifestyle, food
// 6: #d48384 (dusty rose) - goals
// 7: Burnt Sienna (orange) - growth
// 8: #8FA69F (sage grey) - live
// 9: #F2A2A2 (light pink) - finance
// 10: #F2C2D4 (soft pink) - balance
const TAG_TO_PALETTE_INDEX: Record<string, number> = {
  // Breaker Bay (teal) - wellness, health
  wellness: 0,
  health: 0,
  fitness: 0,
  // Opal (sage) - nature, environment
  nature: 1,
  environment: 1,
  sustainability: 1,
  // Blue Bayoux (blue) - tech, business
  productivity: 2,
  business: 2,
  technology: 2,
  tech: 2,
  learning: 2,
  education: 2,
  science: 2,
  // #037F8C (cyan) - motivation
  motivation: 3,
  'life tips': 3,
  lifetips: 3,
  // Flush Mahogany (red) - creativity
  creativity: 4,
  arts: 4,
  culture: 4,
  design: 4,
  // Pearl Bush (cream) - lifestyle, food
  lifestyle: 5,
  life: 5,
  food: 5,
  cooking: 5,
  recipes: 5,
  nutrition: 5,
  general: 5,
  news: 5,
  relationships: 5,
  // #d48384 (dusty rose) - goals
  goals: 6,
  // Burnt Sienna (orange) - growth
  growth: 7,
  transformation: 7,
  innovate: 7,
  // #D97EB0 (vibrant pink) - live
  live: 11,
  // #F2A2A2 (light pink) - finance
  finance: 9,
  // #F2C2D4 (soft pink) - balance
  balance: 10,
};

// Simple hash function for consistent color assignment
const simpleHash = (str: string): number => {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32-bit integer
  }
  return Math.abs(hash);
};

// Get card colors based on tag and title for consistent but varied coloring
// Pass index for alternating colors (e.g., live cards alternate between pink and purple)
const getCardColors = (tag: string | undefined, title: string | undefined, index?: number): CardColorPalette => {
  const normalizedTag = (tag || '').toLowerCase().trim();

  // Special handling for "live" tag - alternate between pink (11) and purple (12)
  if (normalizedTag === 'live' && index !== undefined) {
    return CARD_COLOR_PALETTES[index % 2 === 0 ? 11 : 12];
  }

  // First try to match by tag
  if (normalizedTag && TAG_TO_PALETTE_INDEX[normalizedTag] !== undefined) {
    return CARD_COLOR_PALETTES[TAG_TO_PALETTE_INDEX[normalizedTag]];
  }

  // Fall back to hash-based selection using title
  const hashInput = (title || normalizedTag || 'default').toLowerCase();
  const hash = simpleHash(hashInput);
  const paletteIndex = hash % CARD_COLOR_PALETTES.length;

  return CARD_COLOR_PALETTES[paletteIndex];
};

type HighlightPart = {
  key: string;
  text: string;
  highlighted: boolean;
  definition?: string;
};

const STORY_DURATION_MS = 6500;
const STORY_IMAGE_CACHE_VERSION = 7;
const STORY_GRADIENT_BACKGROUNDS = [
  // Tiny embedded PNG gradients (data URIs) so the fallback never depends on network and never renders black.
  'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAEAAAAIACAYAAAAyrmqbAAAELklEQVR4AeXBQRGAABADsW2nb/wbQBwqDiGb5Hm/Q6zILYdakVtwK3LLoVbkFtzGobYQzIrcgts41BbcitxyqBW5BbcitxxqRW7BbRxqC25FbsFtHGoLbkVuuWBW5BbcitxyqBW5BbdxqC24FbkFt3GoLbgVueVQK3ILbkVuHGoLboNgthxqRW7Brcgth1qRW3Abh9qCW5FbcBuH2oJbkVsOtSK34FbklgtmRW7BbRxqC25FbsFtHGoLbkVuOdSK3IJbkVsOtSK34DYOtQW3IrcQzMahtuBW5MahtuBW5BbcxqG24FbklkOtyC24FbnlUCtyC27jUFtwGwSzBbdxqC24FbnlUCtyC25FbjnUityC2zjUFtyK3ILbONQW3IrccsGsyC24FbnlUCtyC27jUFtwK3ILbuNQK3ILbuNQW3Arcgtu41BbcBsEs+VQK3ILbkVuOdSK3ILbONQW3Ircgts41BbcitxyqBW5Bbcitxxqg2C24DYOtQW3IrfgNg61BbcitxxqRW7Brcgth1qRW3Abh9qCW5EbBLPlUCtyC27jUFtwK3ILbuNQW3ArcsuhVuQW3IrccqgVuQW3cagtuA2C2YLbONQW3IrccqgVuQW3IrccakVuwW0cagtuRW7BbRxqC25FbjnUBsFswa3ILYdakVtwG4dakVtwK3LLoVbkFtzGobbgVuQW3MahtuA2CGbLoVbkFtyK3HKoFbkFt3GoLbgVuQW3wWFW5BbcitySw6zIFbkFt8FhtuBW5BbcBodZkVtwG0Ft4TArckVuwW1wmC24Fbkit3CYFbkFtxHUFg6zIlfkFtwGh9mCW5ErcguHWZFbcBtBbXCYLbgVuQW3wWG24FbkitzCYVbklqBW5AaH2YJbkVtwGxxmRW7BrcgtHGZFbglqRW5wmC24FbkFt8FhVuQW3IrcwmE2glqRW3AbHGYLbkWuyC0cZkVuwa3ILRxmI6gVuQW3wWG24FbkitzCYVbkFtyK3OAwW4JakVtwGxxmC25FrsgtHGZFbsGtyI0cZgtuRW7BbXCYFbkFtyK3cJgVuQW3IjdymC24FbkFt8FhVuQW3IrcwmFW5IrcgtvIYbbgVuQW3AaHWZFbcCtyC4dZkStyS1AbHGYLbkWuyC0cZkVuwa3IDQ6zBbcitwS1wWG24FbkitzCYVbkFtyK3OAwW3AbQW3BbXCYFbkFtyK3cJgVuQW3Ijc4zBbcRlBbcBscZkVuwa3ILRxmRa7ILbgNDrMFtxHUFtwGh1mRW3ArcguHWZErcgtug8NsCWpFrsgtHGZFbsGtyC0cZkWuyC24DQ6zJagVuSK3cJgVuQW3Ijc4zBbcityC28hhVuQW3IrcwmFW5BbcitzgMFtwK3ILbiOHWZFbcCtyC4dZkStyC26Dw2zBrcgtuI0cZkVuwa3ILRxmRe4HF0OSn/U9Z5IAAAAASUVORK5CYII=',
  'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAEAAAAIACAYAAAAyrmqbAAAEKElEQVR4AeXBARECMAwAsbRXJQjDLbqGkE/m8/s+YSvuGGUr7hhl97Qdo2zFHaPsPGnHKFtxxyhbcfe0HaNsxR2jbMUdo2zFHaNsxd0zylbcMcrOk7bijlG24o5RtuLuGWUr7hhlK+4YZSvuGGUrbsUdo+yetvNG2Yo7RtmKO0bZijtG2Yq7Z5StuBV3jLIVd4yyFXeMshV3742yFXeMshV3jLIVt+KOUbbi7hllK+4YZSvuGGUr7hhlK+68UXZP24o7RtmKO0bZijtG2Yo7Rtk9bccoW3HHKFtxK+4YZedJO0bZPW3HKFtxxyhbcccoW3HHKFtx97Qdo2zFHaNsxR2j7Dxpxyhbcccou6ftGGUrbsUdo2zFHaNsxR2j7J62Y5StuGOUnSftGGUr7hhlK+6etmOUrbhjlK24Y5StuGOUrbh7RtmKO0bZedJW3DHKVtwxylbcPaNsxR2jbMUdo2zFHaNsxa24e0bZijtvlK24Y5StuGOUrbhjlN3TdoyyFbfijlG24o5RtuKOUXZP23mjbMUdo2zFHaNsxa24Y5StuHtG2Yo7RtmKO0bZijtG2Yo7b5Td07bijlG24o5RtuKOUbbijlF2T9sxylbcMcpW3Io7Rtl50o5Rdk/bMcpW3DHKVtwxylbcMcpW3D1txyhbcccoW3HHKDtP2jHKVtw9o2zFHaNsxa24Y5StuGOUrbh7RtmKO0bZijtG2XnSjlG24lbcPaNsxR2jbMUdo2zFrbibJ23FHaNsxa24mydtxa24FXeMspsnbcWtuBW34m6etBV3jLIVt+JunrQVt+JW3DHKbp60FbfiVtyNtvOkrbhjlK24G23nSVtxK27F3Rhl50lbcStuxd1oO0/aijtG2Yq70XaetBW34m60HaPsPGkrbsXdaDtP2opbcccou9F2nrQVt+JW3I2280bZiltxK+5G23nSVtyKO0bZjbbzpK24FXejbcWdN8pW3Iq70bbizpO24lbcjVG24s6TtuJW3I22FXfeKFtxK+5G24o7T9qKu9F2jLIVd560FXejbcWdJ+0YZSvuRtuKO0/ailtxN9qOUXaetBW34m60rbjzpK24Y5TdaFtx50lbcTfaVtwxys6TtuJutK24FXeetBV3Y5StuBV3nrQVd6NtxR2j7DxpK+5G24pbcedJu9F2jLIVt+LOk3ajbcWtuGOUnSftRtuKW3HnSVtxN9qOUbbizpO24m60rbgVd94oW3E32lbcijtP2o22FXeMshV3nrQbbStuxa2480bZjbYVt+JW3HnSbrStuGOUrbjzpN1oW3ErbsWdN8putK24Fbfibp60FbfijlG24m6etBW34lbcedJujLIVt+JW3HnSbrStuBV3jLLzpN1oW3ErbsXdPGnHKFtxK27F3TxpK27FrbhjlN08aStuxf0BtoBnvLS46KgAAAAASUVORK5CYII=',
  'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAEAAAAIACAYAAAAyrmqbAAAEbElEQVR4AeXBQRECQBADsHSnGjCKel6HkCb5fT/PsDOuxLJ6pp1xZ1yJZWdcPdNKLDvjzrgzrl4sO+POuBLLzrh6pp1xJZadcWdcPdNKLDvj+mwrsayeaWfcGVdiWT3TzrgSy864M66eaSWWnXFnXIll9Uw74864EsvOuHqmlVh2xp1xZ1y9WHbGnXFnXIll9Uw740osO+POuHqmlVh2xp1xJZbVM+2MO+NKLDvj6plWYtkZd8adcX0vlp1xZ1yJZWdcPdPOuBLLzrh6ppVYdsadcWdcvVh2xp1xZ1yJZfVMO+NKLDvjzrh6ppVYdsadcSWW1TPtjDvjSiw74+qZVmLZGXfGnXH1YtkZd8aVWHbG1TPtjCux7Iw74+rFsjOuz7YzrsSyeqadcWdciWVnXD3TSiw74864M65eLDvjzrgSy+qZdsadcSWWnXH1TCux7Iw74864erHsjDvjSiw74+qZdsaVWHbGnXH1TCux7Iw740osq2faGXfGlVh2xtUzrcSyM+6M67OtXiw74864EsvOuHqmnXEllp1xZ1y9WHbGnXFnXIll9Uw740osO+PqmXbGlVh2xp1x9UwrseyMO+NKLKtn2hl3xpVYdsbVM63EsjPujDvj6sWyM+6MK7HsjKtn2hlXYtkZd8bVi2V9tp1xZ1yJZfVMO+NKLDvjzrh6ppVYdsadcWdcvVh2xp1xJZadcfVMO+NKLDvjzrh6seyMO+P6xLIzrsSyvsSyM65PLDvjSizrE8vOuD6x7IzrSywrseyM6xPLzrg+sazEsjOuTyyrmNYnlpVYdsb1iWVnXJ9YVmJZn22VWHbG9YllJZb12VZi2RnXJ5adcX2JZSWWnXF9YtkZ1yeWlVjWZ1sllp1xfWJZiWV9tpVYdsb1iWUllvXFtBLLzrg+sazEsj7bSizrs63Eskos67OtxLI+20osK7Gsz7YSy/psq8SyEsv6bCuxrM+2EsvOuD6xrMSyvphWYlmfbSWWlVjWZ1uJZX22lVhWiWV9tpVY1mdbiWUllvXZVmJZX0wrsaxPLDvjSizrs63Esj6x7IyrxLI+20os6xPLzrgSy/psK7Gsz7ZKLOsTy864Esv6bCuxrE8sO+NKLOuLaSWW9YllZ1yJZX22lVjWJ5adcX2JZWdciWV9YtkZ1yeWnXEllvUllp1xfWLZGVdiWZ9Ydsb1iWVnXCWW9YllZ1yfWHbG9YllZ1yJZX1iWcW0PrHsjCuxrE8sO+P6xLIzrsSyvsSyM65PLDvj+sSyEsvOuD6x7IzrSywrseyM6xPLzrg+sazEsjOuL7HsjOsTy0os67OtxLIzrk8sO+P6EstKLDvj+sSyM65PLCux7IzrE8sqpvWJZSWW9dlWYtkZ1yeWlVjWZ1sllp1xfWJZiWV9tpVYdsb1iWUllvXFtBLLzrg+sazEsj7bSizrs60Sy0os67OtxLI+20osO+P6xLISy/piWollZ1yfWFZiWZ9tJZb12VZiWSWW9dlWYlmfbSWW/QH/x6tKip1mLwAAAABJRU5ErkJggg==',
  'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAEAAAAIACAYAAAAyrmqbAAAD9UlEQVR4AeXBQRGAABADsW2nEvD/RAPuDiGb5PneQ6zILQSzIlfkBsFswW0caoNgtuBW5AbBbMGtyA2CWZFbcBsEsyK34DYIZuNQW3AbBLMiV+QWglmRK3ILwazIFbmFYFbkxqE2CGYLbkWuyC0EsyJX5AbBbMGtyA2C2YJbkRsXzBbcitwgmBW5BbdBMCtyC26DYFbkFtwGwWwcakVuIZgVuSK3EMyKXJFbCGZFrsgNgtmC2zjUBsFswa3IDYJZkVtwGwSzIrfgNghmRW7BbRDMxqFW5BaCWZErcgvBrMgVuYVgVuSK3CCYLbiNQ20QzBbcitwgmC24FblBMCtyC25FbhDMFtyK3LhgtuBW5AbBrMgtuA2CWZFbcBsEsyJX5BaC2TjUitxCMCtyRW4hmBW5IjcIZgtuRW4QzBbcity4YLbgVuQGwazILbgNglmRW3AbBLMit+A2CGbjUCtyC8GsyBW5hWBW5IrcIJgtuBW5QTBbcCty44LZgluRGwSzIrfgNghmRW7BbRDMityC2yCYjUOtyC24DYJZkVtwGwSzIrfgNghmRa7ILQSzcagVuYVgVuSK3CCYLbgVuUEwW3ArcoNgtuBW5MYFsyK34DYIZkVuwW0QzIrcgtsgmBW5IrcQzMahVuQWglmRK3ILwazIFblBMFtwK3KDYLbgVuTGBbMit+A2CGZFbsFtEMyK3ILbIJgVuSK3EMzGoVbkFoJZkStyC8GsyBW5IrfgVuSK3HKoFbkiV+QW3IpckStyC25FbhxqC25FrsgVuQW3IlfkFtyK3DjUityCW5ErckVuwa3IFbnlUCtyRa7ILbgVuSK34Fbkitw41BbcilyRK3ILbkWuyC24FblxqBW5BbciV+QW3IpckStyC27jUCtyRW7BrcgVuQW3IlfkitxyqBW5IrfgVuSKXJFbcCtyRW4cagtuRa7ILbgVuSJX5BbcxqFW5BbcilyRK3ILbkWuyBW55VArckVuwa3IFbkit+BW5IrccqgVuSJX5BbcilyRK3ILbkVuHGoLbkWuyBW5BbciV+QW3IrcONSK3IJbkStyRW7BrcgVueVQK3JFrsgtuBW5IrfgVuSK3DjUFtyKXJErcgtuRa7ILbgVuXGoFbkFtyJX5BbcilyRK3ILbuNQK3JFbsGtyBW5BbciV+SK3HKoFbkit+BW5IpckVtwK3JFbhxqC25FrsgtuBW5IlfkFtzGoVbkFtyKXJErcgtuRa7IFbnlUCtyRW7BrcgVuSK34FbkitxyqBW5IlfkFtyKXJErcgtuRW4cagtuRa7IFbkFtyJX5Bbcitw41IrcgluRK3JFbsGtyBW5BbdxqBW5IrfgVuR++3w2Ben6VEEAAAAASUVORK5CYII=',
  'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAEAAAAIACAYAAAAyrmqbAAAEkklEQVR4AeXBQRGAABADse1NLeDfEIr4FCGb5HufIXbIlQWzQ64QzMpQKwSzQ64smB1yZagVgtkhVxbMDrlCMCtD7ZArBLMy1ArB7JArC2aHXFkwO+QOubJgdsgVglkZaoVgdsiVoVYIZodcWTA75MqC2SFXCGZlqB1yhWBWhlohmB1yZcHskDvkyoLZIVcWzA65QjArQ60QzA65MtQKweyQKwtmh1whmJWhdsiVBbNDrhDMylArBLNDriyYHXKHXFkwO+QKwawMtUIwO+TKgtkhV4ZaIZgdcmXB7JArBLMy1A65QjArQ60QzA65smB2yJUFs0PukCsLZodcIZiVoVYIZodcGWqFYHbIlQWzQ64smB1yhWBWhtohVwhmZagVgtkhVxbMDrlDriyYHXJlweyQKwSzZqgVgtkhV4ZaIZgdcmXB7JArBLMy1A65smB2yBWCWRlqhWB2yJUFs0PukCsLZodcIZiVoVYIZodcWTA75MpQKwSzQ64smB1yhWBWhtohVwhmZagVgtkhVxbMDrmyYHbIHXJlweyQKwSzMtQKweyQK0OtEMwOubJgdsiVBbNDrhDMylA75ArBrAy1QjA75MqC2SF3yJUFs0OuLJgdcoVgVoZaIZgdcmWoFYLZIVcWzA65QjArQ+2QKwtmh1whmJWhVghmh1xZMDvkDrmyYHbIFYJZGWqFYHbIlQWzQ64MtUIwO+TKgtkhVwhmZagdcoVgVoZaIZgdcmXB7JArC2aH3CFXFswOuUIwK0OtEMwOuTLUCsHskCsLZodcRzDrglohmHW4FYJZh1sX1ArBrMOtEMw63LoEs0OuI5gdch3BrAS1jmDW4XbIdQlmh1xHMOtwKwSzLqh1BLNDriOYHXJdUOsIZodcRzA75LoEsw63QjDrcCsEsy6odQSzQ67DrRDMuqDWEcwOuY5gdsh1CWYdboVg1uF2yHUJZh1uhWDW4dYRzEpQ6whmh1xHMOtwKwlmHW6HXEcw63ArCWYdboVg1uHWJZgdch3B7JDrcOsSzA65jmB2yHUEsy6oFYJZh1tHMDvkugSzQ67DrSOYHXJdgtkh1xHMOtwKwawLaoVg1uH2A6X3/9b5H4tTAAAAAElFTkSuQmCC',
  'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAEAAAAIACAYAAAAyrmqbAAAEXklEQVR4AeXBARGAABDDsG43SZhFF4IeIU3yfO8hVuSWC2ZFbiGYFbnlUBsEswW3cagtBLMiNwhmy6FW5BaC2TjUFtwGwWzBbVwwK3ILboNgthxqRW4hmI1DbSGYFbkFt3HBrMgtBLNxqC24DYLZgts41BaCWZEbF8wW3IrcQjAbh9qC2yCYLYfaIJgtuBW5ccFswW0QzBbcxqG2EMyK3HKoDYJZkVsIZuNQW3AbBLPlUCtyC8GsyC0XzIpckVsumBW5BbdBMFsOtUEwW3Abh9ogmC24DYLZcqgVuYVgNg61BbdBMFtwGxfMityC2yCYLYdakVsIZuNQWwhmRa7ILRfMityC27hgtuA2CGYLbuNQWwhmRW5cMFtwK3ILwWwcagtug2C2HGqDYFbkFtzGBbMFtyK3XDArcgvBrMgth9ogmBW5BbdxwWzBbRDMlkOtyC0EsyI3LpgtuBW55YJZkVtwGwSz5VAbBLMFt3GoDYLZgluRWy6YFbmFYDYOtQW3QTArcssFsyK34DYIZsuhVuQWgtk41BaCWZErcssFsyK34DYumC24DYLZgts41AbBbMFtHGoLwazILQSzcagtuA2C2XKoDYJZkVtwGxfMFtyK3HLBrMgtBLMiNw61hWBW5BbcxgWzBbdBMFsOtSK3EMyK3DjUFoJZkVsumBW5BbdBMFsOtUEwK3LLoTYIZgtuRW65YFbkFoLZONQW3AbBrMgth9ogmC24jQtmC25FbiGYjUOtyC0EsyK3XDArcgtu44LZgtsgmC24jUNtEMwW3MahthDMilyRWzjMilyRWw61wWFW5BbcBodZkStyC26Dw6zILYdakRscZgtuRa7IDQ6zBbciNzjMFtzGoVbkFg6zIlfkitzCYVbkityC27jDrMgtuA0OsyK34FbkBodZkVtwG4fa4DBbcCtyRW7hMCtyRW5wmC24jUOtyC0cZkWuyC24DQ6zIlfkFtzGHWZFbsGtyA0OswW3Ijc4zIrcgluRG3eYLbgVuSK3cJgVuSJX5BYOsyI3DrWFw6zIFbkFt8FhVuSK3ILb4DAbh9qCW5EbHGYLbkVucJgVuQW3IjfuMFtwK3JFbuEwK3JFbsFtcJgVuSK33GFW5IrcgtvgMCtyC25FbnCYFbnlUCtyg8Nswa3IDQ6zBbciV+QGh9lyqBW5IrdwmBW5IrfgNjjMilyRW+4wK3JFbsFtcJgVuQW3Ijc4zIrccqgVucFhtuBW5AaH2YJbkStyg8NswW0cakVu4TArckVuwW1wmBW5IrdwmI1DrcgtuA0OsyK34FbkBofZgluRG4fa4DBbcCtyRW7hMCtyRW7hMCty41ArcguHWZErcgtug8OsyC24FbnBYTYOtQW3wWFW5BbcitzgMFtwK3JFbtxhtuBW5IrcwmFW5IrcwmFW5IrcONQWDrMiV+QW3AaHWZFbcCtyg8NsHGoLboPDrMgtuBW5wWG24Fbkity4w2zBrcgVuYXDrMj9eWCurRQDwxoAAAAASUVORK5CYII=',
  'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAEAAAAIACAYAAAAyrmqbAAAEMElEQVR4AeXBQRGAABADsW2nojCPL36HkE3yvN8htuA27jBbcFtwW3Abd5gtuC24LYfa4DBbcFsOtQW3wWG24LYcagtug8NsOdQW3IrcwmG2HGoLbkVuucNswW3BbRxqC4fZgtuC27jDbMFtwW0caguH2YLbgts41BYOswW35VArcguH2XKoLbgVuYXDbDnUFtyK3HKH2YJbkVtwW+4wW3ArcsuhtnCYLbgVueUOswW3BbdxqC0cZgtuy6FW5BYOswW3cagtuC0cZsuhVuQW3BYOs+VQK3ILbssdZgtuRW451BYOsyK34LbcYbbgVuSWQ23hMFtwK3LLobZwmC24jUNtwW3hMFsOtSK34LZwmI1DbcFtwW25w6zILbgtuC13mBW5BbflUFs4zIrccqgtHGYLbkVuOdQWDrMitxxqC24Lh1mRWw61BbeFw2wcagtuC27LHWZFbsFtwW3cYbbgtuC2HGqDw2zBbcFtOdQGh9mC23KoLRxmRW7BbTnUFg6zIrccagtug8NsOdQW3BbcBofZcqgtuC24jTvMFtwW3Bbcxh1mC24LbsuhNjjMFtyWQ63ILRxmC27LoTY4zBbclkNtwW1wmC24LYfagtvgMFsOtQW3IrfcYbbgtuBW5JY7zBbcFtzGobZwmC24LbiNQ23hMFtwWw61wWG24LYcakVu4TBbcFsOtSK3cJgth9qCW5FbOMyWQ23Brcgtd5gtuC24jUNt4TBbcCtyy6G2cJgtuI1DbcFt4TBbcBuH2sJhtuC2HGpFbuEwWw61IrfgtnCYLYdakVtwW+4wW3ArckWuyA0OsyJX5IpckRscZkWuyBW5Ijc4zIpckStyRW7hMCtyRa7IFbnBYVbkilyRK3JFbnCYFbkiV+SK3OAwK3JFrsgVucFhVuSKXJErcoPDrMgVuSJX5Irc4DArckWuyBW5hcOsyBW5IlfkBodZkStyRa7IDQ6zIlfkilyRGxxmRa7IFbkiV+QGh1mRK3JFrsgNDrMiV+SKXJEbHGZFrsgVuSK3cJgVuSJX5Irc4DArckWuyBW5Ijc4zIpckStyRW5wmBW5IlfkitzgMCtyRa7IFbnBYVbkilyRK3JFbnCYFbkiV+SK3HKHWZErckWuyA0OsyJX5IpckRscZkWuyBW5Ijc4zIpckStyRa7IDQ6zIlfkilyRGxxmRa7IFbkiNzjMilyRK3JFbuEwK3JFrsgVucFhVuSKXJErckVucJgVuSJX5Irc4DArckWuyBW5wWFW5IpckStyg8OsyBW5IlfkitzgMCtyRa7IFbmFw6zIFbkiV+QGh1mRK3JFrsgNDrMiV+SKXJEbHGZFrsgVuSJX5AaHWZErckWuyA0OsyJX5IpckRscZkWuyBW5IrdwmBW5IlfkitzgMCtyRa7IFbkiNzjMilyRK3JFbnCYFbki9wN8v8gIdCaPVQAAAABJRU5ErkJggg==',
  'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAEAAAAIACAYAAAAyrmqbAAAEEklEQVR4AeXBARGAABDDsP5ullCMN2wMIU3u/Z4h1uEW5Drcyg6zDrcg1+EW5DrcCodZh1sZah1uQa7DrXCYdbgFuQ63MtQ63AqHWYdbkOtwC3IdbmWodRxmQa7DLch1uAW5bodZkOtwC3IdbkGu4zALct1QC3IdbkGu4zALch1uQa4bakGu4zALch1uQa7DLch1Q61wmHW4BbkOtyDX4VZ2mHW4BbkOtyDX4VY4zDrcylDrcAtyHW6Fw6zDLch1uJWh1uEW5DoOsyDX4RbkOtzKUOs4zIJch1uQ63ALct0OsyDX4RbkOtyCXMdh1uFWhlqHW5DrcAtyHYdZkOtwK0Otwy3IdRxmQa7DLch1uJWh1nGYBbkOtyDX4Rbkuh1mQa7DLch1uAW5jsMsyHVDLch1uAW5DrfCYdbhFuS6oRbkOtwKh1mHW5DrcCtDrcOtcJh1uAW5Drcg1+FWdph1uAW5Drcg1+EW5DoOszLUOtyCXIdbkOs4zIJch1sZah1uQa7jMAtyHW5BrhtqQa7jMAtyHW5BrsMtyHVDrXCYdbgFuQ63INfhVjjMuqEW5DrcglyHW+Ew63DrcCtDrcMtyHUcZkGuwy3IdUMtyHUcZkGuwy3IdbgFuW6oFQ6zDrcg1+EW5DrcCodZN9SCXIdbkOtwKxxmHW5BrhtqQa7DrXCYdbgFuQ63MtQ63IJcx2EW5DrcglyHWxlqHYdZkOtwC3JBrnCYBbkgVzjMglyQC3Idh1kZakGucJgFuSAX5AqHWZALckGucJgFuSBXOMyCXJALch2HWZArQ61wmAW5IBfkCodZkAtyhcMsyAW5IFc4zIJckCscZkGuwy3IFQ6zMtSCXOEwC3JBLsgVDrMgF+SCXOEwC3JBrnCYBbkOtyBXOMyCXJArO8yCXJALcoXDLMgFucJhFuSCXJArHGZBrsOtcJgFuSAX5AqHWRlqQa5wmAW5IBfkCodZkAtyQa5wmAW5DrfCYRbkglyQKxxmQS7IlR1mQS7IBbnCYRbkglzhMAtyQS7IdRxmQS7IFQ6zIBfkglzhMAtyZagFucJhFuSCXOEwC3JBLsh1HGZBLsgVDrMgF+SCXOEwC3JBruwwC3JBLsgVDrMgF+QKh1mHW5ALcoXDLMgFucJhFuSCXJArHGZBrgy1IFc4zIJckCscZh1uQS7IFQ6zIBfkCodZkAtyQa5wmAW5IFc4zMpQC3JBrnCYBbkOt8JhFuSCXJArHGZBLsgVDrMgF+SCXOEwC3JlqAW5wmEW5DrcCodZkAtyQa5wmAW5IFc4zIJckAtyhcMsyAW5wmFWhlqQ63ArHGZBLsgVDrMgF+SCXOEwC3JBLsgVDrMgF+QKh1mQC3LdUCscZkEuyBUOsyAX5IJc4TALcj+5VsVt1OX5SwAAAABJRU5ErkJggg==',
];
const STORY_IMAGE_DEBUG_FLAG = 'STORY_IMAGE_DEBUG';

const stableHash32 = (input: string) => {
  // Deterministic 32-bit hash (for stable image selection).
  let h = 0;
  for (let i = 0; i < input.length; i += 1) {
    h = (h << 5) - h + input.charCodeAt(i);
    h |= 0;
  }
  return Math.abs(h);
};

const isStoryImageDebugEnabled = () => {
  if (__DEV__) return true;
  return (
    typeof globalThis !== 'undefined' &&
    Boolean((globalThis as any)?.[STORY_IMAGE_DEBUG_FLAG] === true)
  );
};

type StoryVisualTag =
  | 'abstract'
  | 'apology'
  | 'rejection'
  | 'search'
  | 'friendship'
  | 'responsibility'
  | 'learning'
  | 'idea'
  | 'recovery'
  | 'travel'
  | 'nature'
  | 'technology'
  | 'communication';

const STORY_BG_CACHE_VERSION = 3;
// Keep story image decisions effectively permanent to avoid accidental regeneration.
const STORY_BG_CACHE_TTL_MS = 1000 * 60 * 60 * 24 * 365 * 10;
// Used to safely recover from legacy cached "requested but no url" states during rollout.
const STORY_IMAGE_REQUEST_STATE_VERSION = 2;

const STORY_GRADIENT_SCHEMES: Array<{ colors: [string, string]; blob: string; accent: string }> = [
  { colors: ['#4C1D95', '#9333EA'], blob: 'rgba(236, 72, 153, 0.35)', accent: '#FDE68A' },
  { colors: ['#0F172A', '#2563EB'], blob: 'rgba(14, 165, 233, 0.35)', accent: '#C7D2FE' },
  { colors: ['#6D28D9', '#F472B6'], blob: 'rgba(236, 72, 153, 0.3)', accent: '#F8CFFF' },
  { colors: ['#047857', '#6EE7B7'], blob: 'rgba(16, 185, 129, 0.25)', accent: '#ECFCCB' },
  { colors: ['#1E3A8A', '#22D3EE'], blob: 'rgba(59, 130, 246, 0.35)', accent: '#E0F2FE' },
  { colors: ['#7C2D12', '#F97316'], blob: 'rgba(249, 115, 22, 0.25)', accent: '#FED7AA' },
];

const STORY_TAG_KEYWORDS: Record<StoryVisualTag, string[]> = {
  apology: ['make up', 'invent', 'excuse', 'apolog', 'story', 'sorry', 'confess'],
  rejection: ['turn down', 'reject', 'decline', 'refuse', 'no', 'denied', 'deny'],
  search: ['look up', 'search', 'find', 'investigate', 'dictionary', 'research', 'discover', 'lookup'],
  friendship: ['get along', 'friends', 'team', 'together', 'collaborat', 'relationship', 'support'],
  responsibility: ['take on', 'responsibility', 'task', 'project', 'duty'],
  learning: ['learn', 'study', 'lesson', 'education', 'class', 'practice', 'language'],
  idea: ['come up', 'think', 'idea', 'plan', 'create', 'invent'],
  recovery: ['get over', 'recover', 'heal', 'recovery', 'better', 'bounce back'],
  travel: ['trip', 'journey', 'travel', 'tour', 'route', 'flight'],
  nature: ['forest', 'river', 'mountain', 'wildlife', 'outdoor', 'weather', 'season'],
  technology: ['technology', 'tech', 'software', 'device', 'digital', 'app', 'computer'],
  communication: ['say', 'tell', 'speak', 'explain', 'talk', 'discuss'],
  abstract: [],
};

const STORY_PHRASE_OVERRIDES: Record<string, StoryVisualTag> = {
  'make up': 'apology',
  'turn down': 'rejection',
  'look up': 'search',
  'get along': 'friendship',
  'get over': 'recovery',
};

const STORY_TAG_ICON_META: Record<StoryVisualTag, { Icon: React.ComponentType<any>; color: string }> = {
  apology: { Icon: MessageSquare, color: '#FEE2E2' },
  rejection: { Icon: XCircle, color: '#FCA5A5' },
  search: { Icon: Search, color: '#c7d2fe' },
  friendship: { Icon: Users, color: '#A5F3FC' },
  responsibility: { Icon: ShieldCheck, color: '#C7F6D6' },
  learning: { Icon: BookOpenCheck, color: '#FDE68A' },
  idea: { Icon: Lightbulb, color: '#FCD34D' },
  recovery: { Icon: HeartPulse, color: '#FCA5A5' },
  travel: { Icon: Globe, color: '#A5F3FC' },
  nature: { Icon: Sparkles, color: '#C7F6D6' },
  technology: { Icon: Sparkles, color: '#DDD6FE' },
  communication: { Icon: MessageSquare, color: '#E0F2FE' },
  abstract: { Icon: Sparkles, color: '#FDE68A' },
};

type StoryBgCacheEntry = {
  tag: StoryVisualTag;
  gradientIndex: number;
  seed: string;
  imageUrl: string | null;
  imageRequested: boolean;
  imageRequestStateVersion: number;
};

const TEXT_CLEAN_RE = /[^a-z0-9\s]/g;
const normalizeStoryIntentText = (text: string) =>
  (text || '').toLowerCase().replace(TEXT_CLEAN_RE, ' ').replace(/\s+/g, ' ').trim();

const getVisualIntentTag = (phrase: string, definition: string, example: string): StoryVisualTag => {
  const normalized = normalizeStoryIntentText(`${phrase || ''} ${definition || ''} ${example || ''}`);
  const phraseKey = (phrase || '').toLowerCase().trim();
  if (phraseKey && STORY_PHRASE_OVERRIDES[phraseKey]) {
    const override = STORY_PHRASE_OVERRIDES[phraseKey];
    if (override === 'rejection' && /volume|music|sound|audio|speaker|loud/.test(phrase)) {
      return 'rejection';
    }
    if (override === 'apology' && /cosmetic|makeup|beauty/.test(normalized)) {
      return 'abstract';
    }
    return override;
  }

  for (const tag of Object.keys(STORY_TAG_KEYWORDS) as StoryVisualTag[]) {
    const keywords = STORY_TAG_KEYWORDS[tag];
    if (!keywords.length) continue;
    for (const keyword of keywords) {
      if (normalized.includes(keyword)) {
        return tag;
      }
    }
  }

  if (/(team|friend|together|relationship|collabor)/i.test(normalized)) return 'friendship';
  if (/(learn|study|lesson|language|practice)/i.test(normalized)) return 'learning';
  if (/(project|task|responsibility|duty)/i.test(normalized)) return 'responsibility';
  if (/(idea|plan|invent|create)/i.test(normalized)) return 'idea';
  if (/(travel|journey|trip|flight)/i.test(normalized)) return 'travel';
  if (/(health|wellness|recover|heal)/i.test(normalized)) return 'recovery';
  if (/(tech|software|computer|digital)/i.test(normalized)) return 'technology';
  return 'abstract';
};

const buildStoryBgSeed = (word: MissionWord | null | undefined) => {
  if (!word) return '';
  return [
    normalizeStoryIntentText(word.text || ''),
    normalizeStoryIntentText(word.definition || ''),
  ].join('|');
};

const buildStoryBgCacheKey = (seed: string) =>
  `story:bg:v${STORY_BG_CACHE_VERSION}:${stableHash32(seed)}`;

const getCachedStoryBg = async (word: MissionWord | null | undefined): Promise<StoryBgCacheEntry | null> => {
  if (!word) return null;
  const seed = buildStoryBgSeed(word);
  if (!seed) return null;
  const key = buildStoryBgCacheKey(seed);
  const cached = await getCached<any>(key, STORY_BG_CACHE_TTL_MS);
  if (!cached) return null;
  if (typeof cached?.tag !== 'string' || typeof cached?.gradientIndex !== 'number') return null;
  const imageUrlRaw = typeof cached?.imageUrl === 'string' ? cached.imageUrl.trim() : '';
  const cachedRequested = typeof cached?.imageRequested === 'boolean' ? cached.imageRequested : false;
  const cachedVersion = typeof cached?.imageRequestStateVersion === 'number' ? cached.imageRequestStateVersion : 0;

  const phrase = (word?.text || '').trim();
  const staticUrl = getPhraseImageUrl(phrase);
  if (staticUrl && !imageUrlRaw) {
    if (__DEV__ && isStoryImageDebugEnabled()) {
      console.log('[story:img] filled from static mapping', { phrase, cacheKey: key });
    }
    return {
      tag: cached.tag,
      gradientIndex: cached.gradientIndex,
      seed,
      imageUrl: staticUrl,
      imageRequested: true,
      imageRequestStateVersion: STORY_IMAGE_REQUEST_STATE_VERSION,
    };
  }

  // Allow exactly one recovery attempt if a previous build marked "requested" but stored no url,
  // and the request-state version is older than the current rollout.
  const needsRecovery = cachedRequested && !imageUrlRaw && cachedVersion < STORY_IMAGE_REQUEST_STATE_VERSION;
  if (__DEV__ && needsRecovery && isStoryImageDebugEnabled()) {
    console.log('[story:img] cache recovery (allow one retry)', {
      phrase: word?.text,
      sense: word?.definition,
      cacheKey: key,
      cachedVersion,
      currentVersion: STORY_IMAGE_REQUEST_STATE_VERSION,
    });
  }
  return {
    tag: cached.tag,
    gradientIndex: cached.gradientIndex,
    seed,
    imageUrl: imageUrlRaw ? imageUrlRaw : null,
    imageRequested: needsRecovery ? false : cachedRequested,
    imageRequestStateVersion: needsRecovery ? STORY_IMAGE_REQUEST_STATE_VERSION : (cachedVersion || STORY_IMAGE_REQUEST_STATE_VERSION),
  };
};

const setCachedStoryBg = async (word: MissionWord | null | undefined, entry: StoryBgCacheEntry) => {
  if (!word) return;
  const seed = buildStoryBgSeed(word);
  if (!seed) return;
  const key = buildStoryBgCacheKey(seed);
  await setCached(key, {
    tag: entry.tag,
    gradientIndex: entry.gradientIndex,
    imageUrl: entry.imageUrl,
    imageRequested: entry.imageRequested,
    imageRequestStateVersion: entry.imageRequestStateVersion || STORY_IMAGE_REQUEST_STATE_VERSION,
  });
};

const buildStoryBgEntry = (word: MissionWord | null | undefined): StoryBgCacheEntry => {
  const seed = buildStoryBgSeed(word) || `${word?.id || word?.text || 'story'}`;
  const tag = getVisualIntentTag(word?.text || '', word?.definition || '', word?.exampleSentence || '');
  const gradientIndex = Math.abs(stableHash32(`${seed}:${tag}`)) % STORY_GRADIENT_SCHEMES.length;
  // Pre-populate static image URL if available
  const phrase = (word?.text || '').trim();
  const staticUrl = getPhraseImageUrl(phrase);
  return {
    tag,
    gradientIndex,
    seed,
    imageUrl: staticUrl || null,
    imageRequested: !!staticUrl,
    imageRequestStateVersion: STORY_IMAGE_REQUEST_STATE_VERSION,
  };
};

type StoryImageRecraftApiResponse = {
  image_url: string | null;
  error?: string;
  details?: unknown;
};

const STORY_IMAGE_STYLE = 'flat';
const STORY_IMAGE_IN_FLIGHT = new Map<string, Promise<string | null>>();
const STORY_IMAGE_ATTEMPTED = new Set<string>();

const fetchStoryIllustrationUrl = async (word: MissionWord | null | undefined): Promise<string | null> => {
  const phrase = (word?.text || '').trim();
  const sense = (word?.definition || '').trim();
  if (!phrase || !sense) return null;

  // Use static phrase-image mapping first (when available)
  const staticUrl = getPhraseImageUrl(phrase);
  if (staticUrl) {
    if (__DEV__ && isStoryImageDebugEnabled()) {
      console.log('[story:img] static image match', { phrase, url: staticUrl });
    }
    return staticUrl;
  }

  const endpoint = (STORY_IMAGE_URL || '').trim();
  if (!endpoint) return null;

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 45_000);
  try {
    const res = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        apikey: SUPABASE_ANON_KEY,
        Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
      },
      body: JSON.stringify({ phrase, sense, style: STORY_IMAGE_STYLE }),
      signal: controller.signal,
    });

    const rawText = await res.text();
    let json: unknown = null;
    try {
      json = rawText ? JSON.parse(rawText) : null;
    } catch {}

    const parsed = (json || null) as Partial<StoryImageRecraftApiResponse> | null;
    if (__DEV__ && isStoryImageDebugEnabled()) {
      console.log('[story:img] story-image-recraft response', {
        phrase,
        sense,
        ok: res.ok,
        status: res.status,
        body: parsed ?? rawText,
      });
    }

    const imageUrl = typeof parsed?.image_url === 'string' ? parsed.image_url.trim() : '';
    if (imageUrl) {
      if (__DEV__ && isStoryImageDebugEnabled()) {
        console.log('[story:img] image_url found', { phrase, url: imageUrl });
      }
      return imageUrl;
    }

    if (__DEV__ && isStoryImageDebugEnabled()) {
      console.log('[story:img] image_url missing', { phrase, sense });
    }
    return null;
  } catch (err) {
    if (__DEV__ && isStoryImageDebugEnabled()) {
      console.log('[story:img] story-image-recraft fetch failed', {
        phrase,
        sense,
        error: (err as any)?.message || String(err),
      });
    }
    return null;
  } finally {
    clearTimeout(timeout);
  }
};

const getOrFetchStoryIllustrationUrl = async (
  word: MissionWord | null | undefined,
  bgCacheKey: string,
): Promise<string | null> => {
  if (!word) return null;
  if (STORY_IMAGE_ATTEMPTED.has(bgCacheKey)) {
    if (__DEV__ && isStoryImageDebugEnabled()) {
      console.log('[story:img] retry blocked', {
        cacheKey: bgCacheKey,
        phrase: word?.text,
        sense: word?.definition,
      });
    }
    return null;
  }
  if (STORY_IMAGE_IN_FLIGHT.has(bgCacheKey)) return (await STORY_IMAGE_IN_FLIGHT.get(bgCacheKey)) || null;
  STORY_IMAGE_ATTEMPTED.add(bgCacheKey);
  const p = fetchStoryIllustrationUrl(word).finally(() => {
    STORY_IMAGE_IN_FLIGHT.delete(bgCacheKey);
  });
  STORY_IMAGE_IN_FLIGHT.set(bgCacheKey, p);
  return (await p) || null;
};

const STORY_BACKGROUND_GRADIENT_ID = 'story-gradient';

const StoryBackground: React.FC<{ entry: StoryBgCacheEntry | null; children: React.ReactNode }> = React.memo(
  ({ entry, children }) => {
    const scheme = entry
      ? STORY_GRADIENT_SCHEMES[entry.gradientIndex % STORY_GRADIENT_SCHEMES.length]
      : STORY_GRADIENT_SCHEMES[0];
    const iconMeta = STORY_TAG_ICON_META[entry?.tag || 'abstract'] || STORY_TAG_ICON_META.abstract;
    const IconComponent = iconMeta.Icon;
    const imageUrl = (typeof entry?.imageUrl === 'string' ? entry.imageUrl : '').trim();
    const showTemplates = !imageUrl && !!entry && entry.imageRequested === false && entry.imageUrl === null;
    return (
      <View style={styles.storyViewerBackground}>
        {imageUrl ? (
          <Image
            source={{ uri: imageUrl }}
            style={StyleSheet.absoluteFillObject}
            resizeMode="contain"
            onError={(e) => {
              if (__DEV__ && isStoryImageDebugEnabled()) {
                console.log('[story:img] image render error', {
                  uri: imageUrl,
                  error: (e as any)?.nativeEvent?.error,
                });
              }
            }}
          />
        ) : showTemplates ? (
          <>
            <Svg style={StyleSheet.absoluteFill}>
              <Defs>
                <SvgLinearGradient id={STORY_BACKGROUND_GRADIENT_ID} x1="0%" y1="0%" x2="100%" y2="100%">
                  <Stop offset="0%" stopColor={scheme.colors[0]} />
                  <Stop offset="100%" stopColor={scheme.colors[1]} />
                </SvgLinearGradient>
              </Defs>
              <Rect x="0" y="0" width="100%" height="100%" fill={`url(#${STORY_BACKGROUND_GRADIENT_ID})`} />
            </Svg>
            <View style={[styles.storyBackgroundBlob, { backgroundColor: scheme.blob }]} />
            <View style={styles.storyBackgroundIconWrapper}>
              <IconComponent size={88} color={iconMeta.color} strokeWidth={2.5} />
            </View>
          </>
        ) : (
          <Svg style={StyleSheet.absoluteFill}>
            <Defs>
              <SvgLinearGradient id={STORY_BACKGROUND_GRADIENT_ID} x1="0%" y1="0%" x2="100%" y2="100%">
                <Stop offset="0%" stopColor={scheme.colors[0]} />
                <Stop offset="100%" stopColor={scheme.colors[1]} />
              </SvgLinearGradient>
            </Defs>
            <Rect x="0" y="0" width="100%" height="100%" fill={`url(#${STORY_BACKGROUND_GRADIENT_ID})`} />
          </Svg>
        )}
        {children}
      </View>
    );
  }
);

const buildHighlightParts = (
  rawText: string,
  vocabList: { word: string; definition?: string }[],
): HighlightPart[] => {
  const text = (rawText || '').toString();
  if (!text.trim() || !Array.isArray(vocabList) || !vocabList.length) {
    return [{ key: 'p-0', text, highlighted: false }];
  }

  const cleanWords = vocabList
    .map(v => (v.word || '').trim())
    .filter(Boolean);
  if (!cleanWords.length) {
    return [{ key: 'p-0', text, highlighted: false }];
  }

  const escaped = cleanWords.map(w => w.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'));
  const regex = new RegExp(`\\b(${escaped.join('|')})\\b`, 'gi');
  const parts = text.split(regex);

  const result: HighlightPart[] = [];
  parts.forEach((part, idx) => {
    if (!part) return;
    const isMatch = cleanWords.some(w => w.toLowerCase() === part.toLowerCase());
    if (isMatch) {
      const vocab = vocabList.find(v => (v.word || '').trim().toLowerCase() === part.trim().toLowerCase());
      result.push({
        key: `h-${idx}`,
        text: part,
        highlighted: true,
        definition: vocab?.definition,
      });
    } else {
      result.push({
        key: `t-${idx}`,
        text: part,
        highlighted: false,
      });
    }
  });

  return result.length ? result : [{ key: 'p-0', text, highlighted: false }];
};

export default function HomeScreen(props?: { preview?: boolean }) {
  const isPreview = !!(props as any)?.preview;
  const router = useRouter();
  const pathname = usePathname();
  const [storedLevel, setStoredLevel] = useState<string | null>(null);
  const [showOnboarding, setShowOnboarding] = useState(false);
  const theme = useAppStore(s => s.theme);
  const colors = getTheme(theme);
  const userProgress = useAppStore(s => s.userProgress);
  const loadProgress = useAppStore(s => s.loadProgress);
  const words = useAppStore(s => s.words);
  const insets = useSafeAreaInsets();
  const [missionLoading, setMissionLoading] = useState(false);
  const [missionSummary, setMissionSummary] = useState<null | {
    status: string;
    answered: number;
    total: number;
    correct: number;
    review: number;
    fresh: number;
    story: number;
    xpReward: number;
  }>(null);
  const todayKey = useMemo(() => new Date().toISOString().slice(0, 10), []);
  const storyWordsDoneKey = useMemo(() => `${STORY_WORDS_DONE_KEY_PREFIX}${todayKey}`, [todayKey]);
  const [storyWordsDoneForToday, setStoryWordsDoneForToday] = useState(false);
  // Home stays mounted even when another screen overlays it via our router.
  // Do not hide it here; RouteRenderer controls visibility to avoid flicker.
  const [storyWords, setStoryWords] = useState<MissionWord[]>([]);
  const [activeStoryIndex, setActiveStoryIndex] = useState<number | null>(null);
  const storyDetailAnim = useRef(new Animated.Value(0)).current;
  const [storyViewedMap, setStoryViewedMap] = useState<Record<string, boolean>>({});
  const storyViewedCount = useMemo(
    () => storyWords.reduce((acc, w) => acc + (w?.id && storyViewedMap[w.id] ? 1 : 0), 0),
    [storyWords, storyViewedMap],
  );
  const storyStartIndex = useMemo(() => {
    if (storyWordsDoneForToday) return 0;
    if (!storyWords.length) return 0;
    const idx = storyWords.findIndex(w => !storyViewedMap[w.id]);
    return idx === -1 ? 0 : idx;
  }, [storyWords, storyViewedMap, storyWordsDoneForToday]);
  const storyProgressRatio = useMemo(() => {
    if (storyWordsDoneForToday) return 1;
    if (!storyWords.length) return 0;
    return Math.max(0, Math.min(1, storyViewedCount / storyWords.length));
  }, [storyWordsDoneForToday, storyWords.length, storyViewedCount]);
  const storyCtaLabel = storyWordsDoneForToday ? 'Review' : storyViewedCount > 0 ? 'Continue' : 'Start';
  const [storyViewerVisible, setStoryViewerVisible] = useState(false);
  const [storyViewerBgEntry, setStoryViewerBgEntry] = useState<StoryBgCacheEntry | null>(null);
  const storyBgCacheRef = useRef<Record<string, StoryBgCacheEntry>>({});
  const storyProgressAnim = useRef(new Animated.Value(0)).current;
  const storyAnimRef = useRef<Animated.CompositeAnimation | null>(null);
  const storyProgressValueRef = useRef(0);
  const storyViewerVisibleRef = useRef(false);
	  const storyIndexRef = useRef(0);
	  const storyCountRef = useRef(0);
	  const storyIgnorePressRef = useRef(false);
	  const storyDebugChecksRanRef = useRef(false);
	  // Fill-in-blank exercise after story words
	  const [storyExerciseMode, setStoryExerciseMode] = useState(false);
	  const [exerciseQuestionIndex, setExerciseQuestionIndex] = useState(0);
	  const [exerciseScore, setExerciseScore] = useState(0);
	  const [exerciseAnswered, setExerciseAnswered] = useState(false);
	  const [exerciseSelectedAnswer, setExerciseSelectedAnswer] = useState<string | null>(null);
	  const [showStreakCelebrate, setShowStreakCelebrate] = useState(false);
	  const countAnim = useRef(new Animated.Value(0)).current;
	  const [displayCount, setDisplayCount] = useState(0);
	  // Synonym Match state
	  const synonymMatchDoneKey = useMemo(() => `@engniter.synonymMatch.done.${todayKey}`, [todayKey]);
	  const [synonymMatchDone, setSynonymMatchDone] = useState(false);
	  const [synonymMatchScore, setSynonymMatchScore] = useState<{ score: number; total: number } | null>(null);
	  const [synonymMatchWords, setSynonymMatchWords] = useState<{ word: string; synonym: string }[]>([]);
	  const [synonymMatchLoading, setSynonymMatchLoading] = useState(false);
	  const synonymMatchLoadedFromVault = useRef(false);

  const markStoryWordsDoneForToday = useCallback(async () => {
    try {
      await AsyncStorage.setItem(storyWordsDoneKey, '1');
    } catch {}
    setStoryWordsDoneForToday(true);
  }, [storyWordsDoneKey]);

  // Load daily story-words completion flag
  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const raw = await AsyncStorage.getItem(storyWordsDoneKey);
        if (!alive) return;
        setStoryWordsDoneForToday(raw === '1');
      } catch {
        if (!alive) return;
        setStoryWordsDoneForToday(false);
      }
    })();
    return () => {
      alive = false;
    };
  }, [storyWordsDoneKey]);

  // Load synonym match completion flag
  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const raw = await AsyncStorage.getItem(synonymMatchDoneKey);
        if (!alive) return;
        setSynonymMatchDone(raw === '1');
      } catch {
        if (!alive) return;
        setSynonymMatchDone(false);
      }
    })();
    return () => { alive = false; };
  }, [synonymMatchDoneKey]);

  // Load synonym match words from vault (try to replace defaults with vault words)
  useEffect(() => {
    if (synonymMatchDone) return;
    if (synonymMatchLoadedFromVault.current) return;
    if (!words || words.length === 0) return;

    synonymMatchLoadedFromVault.current = true;

    // Simple direct approach - get words from daily and phrasal folders
    const dailyWords = words.filter(w => w.folderId === 'folder-daily-default');
    const phrasalWords = words.filter(w => w.folderId === 'folder-phrasal-default');
    const allSourceWords = [...dailyWords, ...phrasalWords];

    // Shuffle for variety
    const shuffled = [...allSourceWords].sort(() => Math.random() - 0.5);

    const pairs: { word: string; synonym: string }[] = [];
    for (const w of shuffled) {
      if (pairs.length >= 4) break;
      const syn = PHRASAL_VERB_SYNONYMS[w.word.toLowerCase()];
      if (syn) {
        pairs.push({ word: w.word, synonym: syn });
      }
    }

    if (pairs.length >= 4) {
      setSynonymMatchWords(pairs);
    }
    // If not enough pairs, keep the default fallback words
  }, [synonymMatchDone, words.length]);

  useEffect(() => {
    storyViewerVisibleRef.current = storyViewerVisible;
  }, [storyViewerVisible]);

  useEffect(() => {
    storyCountRef.current = storyWords.length;
  }, [storyWords.length]);

  useEffect(() => {
    if (activeStoryIndex != null) storyIndexRef.current = activeStoryIndex;
  }, [activeStoryIndex]);

  // Prefetch story backgrounds as soon as words load, so the viewer doesn't flash unrelated fallbacks.
  useEffect(() => {
    if (!storyWords.length) return;
    let cancelled = false;
    const words = storyWords.slice(0, 5);

	    (async () => {
	      for (let idx = 0; idx < words.length; idx += 1) {
	        if (cancelled) break;
	        const word = words[idx];
	        const seed = buildStoryBgSeed(word) || String(word?.id || word?.text || idx);
	        const cacheKey = buildStoryBgCacheKey(seed);
	        const existing = storyBgCacheRef.current[cacheKey];
	        if (existing) {
	          if (!existing.imageUrl && !existing.imageRequested) {
	            void (async () => {
	              const url = await getOrFetchStoryIllustrationUrl(word, cacheKey);
	              const current = storyBgCacheRef.current[cacheKey] || existing;
	              const updated: StoryBgCacheEntry = { ...current, imageUrl: url || null, imageRequested: true };
	              storyBgCacheRef.current[cacheKey] = updated;
	              try {
	                await setCachedStoryBg(word, updated);
	              } catch {}
	            })();
	          } else if (!existing.imageUrl && existing.imageRequested) {
	            if (__DEV__ && isStoryImageDebugEnabled()) {
	              console.log('[story:img] retry blocked (already requested)', { cacheKey, phrase: word?.text });
	            }
	          }
	          continue;
	        }

	        let entry: StoryBgCacheEntry | null = null;
	        try {
	          const persisted = await getCachedStoryBg(word);
	          if (persisted && !cancelled) entry = persisted;
	        } catch {}

	        if (cancelled) break;
	        if (!entry) entry = buildStoryBgEntry(word);
	        storyBgCacheRef.current[cacheKey] = entry;
	        try {
	          await setCachedStoryBg(word, entry);
	        } catch {}

	        if (!entry.imageUrl && !entry.imageRequested) {
	          void (async () => {
	            const url = await getOrFetchStoryIllustrationUrl(word, cacheKey);
	            const current = storyBgCacheRef.current[cacheKey] || entry;
	            const updated: StoryBgCacheEntry = { ...current, imageUrl: url || null, imageRequested: true };
	            storyBgCacheRef.current[cacheKey] = updated;
	            try {
	              await setCachedStoryBg(word, updated);
	            } catch {}
	          })();
	        } else if (!entry.imageUrl && entry.imageRequested) {
	          if (__DEV__ && isStoryImageDebugEnabled()) {
	            console.log('[story:img] retry blocked (already requested)', { cacheKey, phrase: word?.text });
	          }
	        }
	      }
	    })();

    return () => {
      cancelled = true;
    };
  }, [storyWords]);

  // Dev sanity check: ensure key tags are stable for ambiguous phrases.
  useEffect(() => {
    if (!__DEV__) return;
    if (!isStoryImageDebugEnabled()) return;
    if (storyDebugChecksRanRef.current) return;
    storyDebugChecksRanRef.current = true;

    const cases: Array<{ phrase: string; definition: string; example: string; expectTag: StoryVisualTag }> = [
      {
        phrase: 'make up',
        definition: 'to invent an excuse or story',
        example: 'He made up an excuse for being late.',
        expectTag: 'apology',
      },
      {
        phrase: 'turn down',
        definition: 'to reject an offer',
        example: 'I turned down the job offer.',
        expectTag: 'rejection',
      },
      {
        phrase: 'look up',
        definition: 'to search for information',
        example: 'I looked up the word in the dictionary.',
        expectTag: 'search',
      },
      {
        phrase: 'get along',
        definition: 'to enjoy a friendly relationship',
        example: 'They get along well with their neighbors.',
        expectTag: 'friendship',
      },
      {
        phrase: 'get over',
        definition: 'to recover from illness or sad experience',
        example: 'She got over the flu quickly.',
        expectTag: 'recovery',
      },
    ];

    for (const test of cases) {
      const entry = buildStoryBgEntry({
        text: test.phrase,
        definition: test.definition,
        exampleSentence: test.example,
      } as MissionWord);
      if (entry.tag !== test.expectTag) {
        console.warn('[story:debug] unexpected tag', {
          phrase: test.phrase,
          definition: test.definition,
          example: test.example,
          expected: test.expectTag,
          got: entry.tag,
        });
      }
      console.log('[story:debug] tag', { phrase: test.phrase, tag: entry.tag });
    }
  }, []);
	  // FAB menu
	  const [menuOpen, setMenuOpen] = useState(false);
	  const menuAnim = useRef(new Animated.Value(0)).current;
  // Daily sign-up nudge
  const user = useAppStore(s => s.user);
  const [showSignupNudge, setShowSignupNudge] = useState(false);
  // Daily rating nudge
  const [showRateNudge, setShowRateNudge] = useState(false);

  // Theme-aware Lottie adjustments (dark mode: lighten + thicken strokes)
  const lottieDarkCache = useRef<WeakMap<any, any>>(new WeakMap()).current;
  const adjustLottieForDark = (src: any) => {
    try {
      const clone = JSON.parse(JSON.stringify(src));
      const lighten = (v: number, amt = 0.25) => Math.max(0, Math.min(1, v + (1 - v) * amt));
      const bumpWidth = (w: any): any => {
        const scale = 1.5; // approx +0.5–1px at 24–32px
        if (typeof w === 'number') return Math.max(0, w * scale);
        if (w && typeof w.k === 'number') return { ...w, k: Math.max(0, w.k * scale) };
        if (w && Array.isArray(w.k)) {
          return {
            ...w,
            k: w.k.map((kf: any) =>
              kf && kf.s && typeof kf.s[0] === 'number'
                ? { ...kf, s: [Math.max(0, kf.s[0] * scale)] }
                : kf
            ),
          };
        }
        return w;
      };
      const lightenColor = (c: any): any => {
        const lift = (arr: number[]) => {
          const [r, g, b, a = 1] = arr;
          return [lighten(r), lighten(g), lighten(b), a];
        };
        if (Array.isArray(c)) return lift(c);
        if (c && Array.isArray(c.k)) {
          // keyframes or direct RGBA
          if (typeof c.k[0] === 'number') return { ...c, k: lift(c.k as number[]) };
          return {
            ...c,
            k: c.k.map((kf: any) =>
              kf && kf.s && Array.isArray(kf.s)
                ? { ...kf, s: lift(kf.s as number[]) }
                : kf
            ),
          };
        }
        if (c && typeof c.k === 'object' && Array.isArray(c.k.s)) {
          return { ...c, k: { ...c.k, s: lightenColor(c.k.s) } };
        }
        return c;
      };
      const visitShapes = (arr: any[]) => {
        if (!Array.isArray(arr)) return;
        arr.forEach((s) => {
          if (!s || typeof s !== 'object') return;
          if (s.ty === 'st') {
            if (s.w !== undefined) s.w = bumpWidth(s.w);
            if (s.c !== undefined) s.c = lightenColor(s.c);
          }
          if (Array.isArray((s as any).it)) visitShapes((s as any).it);
        });
      };
      const visitLayers = (layers: any[]) => {
        if (!Array.isArray(layers)) return;
        layers.forEach((l) => {
          if (Array.isArray(l.shapes)) visitShapes(l.shapes);
        });
      };
      visitLayers(clone.layers || []);
      const assets = clone.assets || [];
      assets.forEach((a: any) => { if (Array.isArray(a.layers)) visitLayers(a.layers); });
      return clone;
    } catch {
      return src;
    }
  };
  const themedLottie = (src: any) => {
    const isLight = theme === 'light';
    if (isLight || !src) return src;
    const cached = lottieDarkCache.get(src);
    if (cached) return cached;
    const adj = adjustLottieForDark(src);
    lottieDarkCache.set(src, adj);
    return adj;
  };

  const streakCount = userProgress?.streak || 0;
  const missionStatus = missionSummary?.status;
  const missionAnswered = missionSummary?.answered ?? 0;
  const missionTotal = missionSummary?.total ?? 5;
  const missionCorrect = missionSummary?.correct ?? 0;
  const missionXP = missionSummary?.xpReward ?? 60;
	  const missionComposition = missionSummary
	    ? `${missionSummary.review} review · ${missionSummary.fresh} new · ${missionSummary.story} story`
	    : null;
	  const fallbackNewsImage = 'https://images.unsplash.com/photo-1520607162513-77705c0f0d4a?auto=format&fit=crop&w=1600&q=80';
	  const languagePrefs = useAppStore(s => s.languagePreferences);
	  const primaryLang = (languagePrefs?.[0] || '').toLowerCase();
	  const [newsPrefs, setNewsPrefs] = useState<NewsPrefs>(() => ({ topics: NEWS_DEFAULT_TOPICS, hideSports: true }));
	  const newsPrefsFromStorageRef = useRef(false);
	  const newsPrefsRefreshTimerRef = useRef<any>(null);
	  const newsHookReqIdRef = useRef(0);
	  const newsHookInFlightRef = useRef<Record<string, boolean>>({});
	  const [newsFontScale, setNewsFontScale] = useState<0 | 1 | 2>(1); // 0=small,1=medium,2=large
	  const [newsOverrideList, setNewsOverrideList] = useState<NewsItem[] | null>(null);
	  const [newsList, setNewsList] = useState<NewsItem[]>([]);
	  const [newsStatus, setNewsStatus] = useState<string>('');
	  // Initialize with preloaded articles for instant display (no delay)
	  const [productivityArticles, setProductivityArticles] = useState<NewsItem[]>(() => _preloadedProductivityArticles);
	  const productivityFetchedRef = useRef(false);

	  // Ensure preloaded productivity articles are applied immediately
	  useEffect(() => {
	    if (_productivityPreloadPromise) {
	      _productivityPreloadPromise.then(articles => {
	        if (articles.length > 0 && productivityArticles.length === 0) {
	          setProductivityArticles(articles);
	        }
	      });
	    }
	  }, []);
	  // Use live news when configured; disable cache read/write in dev to avoid loops
	  const newsConfigured = Boolean(NEWS_API_URL || BACKEND_BASE_URL || NEWS_API_KEY);
	  const [newsMenuOpen, setNewsMenuOpen] = useState(false);
  const [, setNewsLoading] = useState(false);
  const [newsModalVisible, setNewsModalVisible] = useState(false);
  const newsModalAnim = useRef(new Animated.Value(0)).current;
  const newsDrag = useRef(new Animated.Value(0)).current;
  const heroScrollX = useRef(new Animated.Value(0)).current;
  const [newsCardWidth, setNewsCardWidth] = useState(0);
  const NEWS_CAROUSEL_HORIZONTAL_PADDING = 16;
  const closeNewsModalRef = useRef<() => void>(() => {});
  const newsPan = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: (_, gestureState) => Math.abs(gestureState.dy) > 6,
      onPanResponderGrant: () => {
        newsDrag.setValue(0);
      },
      onPanResponderMove: (_, gestureState) => {
        const dy = Math.max(0, gestureState.dy);
        newsDrag.setValue(dy);
      },
      onPanResponderRelease: (_, gestureState) => {
        const dy = Math.max(0, gestureState.dy);
        if (dy > 80) {
          closeNewsModalRef.current();
        } else {
          Animated.spring(newsDrag, { toValue: 0, useNativeDriver: true, bounciness: 0 }).start();
        }
      },
      onPanResponderTerminate: () => {
        Animated.spring(newsDrag, { toValue: 0, useNativeDriver: true, bounciness: 0 }).start();
      },
    })
  ).current;
  const [newsModalArticle, setNewsModalArticle] = useState<NewsItem | null>(null);
  const [modalHighlightParts, setModalHighlightParts] = useState<HighlightPart[] | null>(null);
  // Vocab preview before reading
  const [vocabPreviewVisible, setVocabPreviewVisible] = useState(false);
  const [vocabPreviewArticle, setVocabPreviewArticle] = useState<NewsItem | null>(null);
  const [vocabPreviewIndex, setVocabPreviewIndex] = useState(0);
  const [vocabPreviewFlipped, setVocabPreviewFlipped] = useState(false);
  const [vocabPreviewLoading, setVocabPreviewLoading] = useState(false);
  const vocabCardAnim = useRef(new Animated.Value(0)).current;
  // Article reader customization
  const [articleFontSize, setArticleFontSize] = useState(17);
  const [articleBgColor, setArticleBgColor] = useState<'default' | 'sepia' | 'dark' | 'black'>('default');
  const [articleSettingsOpen, setArticleSettingsOpen] = useState(false);
  const ARTICLE_SETTINGS_KEY = '@engniter.article.settings';
  // Load article settings from storage
  useEffect(() => {
    (async () => {
      try {
        const raw = await AsyncStorage.getItem(ARTICLE_SETTINGS_KEY);
        if (raw) {
          const settings = JSON.parse(raw);
          if (settings.fontSize) setArticleFontSize(settings.fontSize);
          if (settings.bgColor) setArticleBgColor(settings.bgColor);
        }
      } catch {}
    })();
  }, []);
  // Save article settings when changed
  const saveArticleSettings = async (fontSize: number, bgColor: string) => {
    try {
      await AsyncStorage.setItem(ARTICLE_SETTINGS_KEY, JSON.stringify({ fontSize, bgColor }));
    } catch {}
  };
  const getArticleBgStyle = () => {
    switch (articleBgColor) {
      case 'sepia': return { backgroundColor: '#F5F0E1' };
      case 'dark': return { backgroundColor: '#1E3A5F' };
      case 'black': return { backgroundColor: '#0D0D0D' };
      default: return theme === 'light' ? { backgroundColor: '#FFFFFF' } : { backgroundColor: '#1E1E1E' };
    }
  };
  const getArticleTextColor = () => {
    switch (articleBgColor) {
      case 'sepia': return '#3D3D3D';
      case 'dark': return '#E5E7EB';
      case 'black': return '#E5E7EB';
      default: return theme === 'light' ? '#374151' : '#D1D5DB';
    }
  };
  // Quiz state
  const [quizStarted, setQuizStarted] = useState(false);
  const [quizCurrentQ, setQuizCurrentQ] = useState(0);
  const [quizAnswers, setQuizAnswers] = useState<(number | null)[]>([]);
  const [quizShowResult, setQuizShowResult] = useState(false);
  // Vocab translations toggle in article
  const [showVocabTranslations, setShowVocabTranslations] = useState(true);
  const quizOptionAnims = useRef([new Animated.Value(0), new Animated.Value(0), new Animated.Value(0), new Animated.Value(0)]).current;
  const quizCorrectAnim = useRef(new Animated.Value(0)).current;
  const quizWrongAnim = useRef(new Animated.Value(0)).current;
  const quizProgressAnim = useRef(new Animated.Value(0)).current;
  const quizConfettiAnim = useRef(new Animated.Value(0)).current;
  const newsFetchStarted = useRef(false);
  const initRanRef = useRef(false);
  const missionFetchKeyRef = useRef<string | null>(null);
  const NEWS_CACHE_VERSION = 'v12-24h-refresh';
  const addVaultWord = useAppStore(s => s.addWord);
  const getVaultFolders = useAppStore(s => s.getFolders);
  const createVaultFolder = useAppStore(s => s.createFolder);

  useEffect(() => {
    (async () => {
      try {
        const raw = await AsyncStorage.getItem(NEWS_PREFS_KEY);
        if (!raw) return;
        const parsed = JSON.parse(raw);
        const rawTopics = Array.isArray(parsed?.topics) ? parsed.topics.filter((t: any) => typeof t === 'string') : [];
        const topics = rawTopics.map((t: string) => {
          if (t === 'business') return 'startups';
          if (t === 'education') return 'learning';
          return t;
        });
        const hideSports = typeof parsed?.hideSports === 'boolean' ? parsed.hideSports : true;
        const validated = (topics as string[]).filter((t) => NEWS_TOPIC_OPTIONS.some((o) => o.id === t)) as NewsTopicId[];
        newsPrefsFromStorageRef.current = true;
        setNewsPrefs({ topics: validated.length ? validated : NEWS_DEFAULT_TOPICS, hideSports });
      } catch {}
    })();
  }, []);

  const updateNewsPrefs = useCallback((updater: (prev: NewsPrefs) => NewsPrefs) => {
    newsPrefsFromStorageRef.current = true;
    setNewsPrefs((prev) => {
      const next = updater(prev);
      try {
        AsyncStorage.setItem(NEWS_PREFS_KEY, JSON.stringify(next)).catch(() => {});
      } catch {}
      return next;
    });
  }, []);

  const toggleNewsTopic = useCallback((id: NewsTopicId) => {
    updateNewsPrefs((prev) => {
      const current = Array.isArray(prev.topics) ? prev.topics : [];
      const has = current.includes(id);
      const nextTopics = has ? current.filter((t) => t !== id) : [...current, id];
      const order = NEWS_TOPIC_OPTIONS.map((o) => o.id);
      const deduped = Array.from(new Set(nextTopics)).filter((t) => order.includes(t));
      deduped.sort((a, b) => order.indexOf(a) - order.indexOf(b));
      return { ...prev, topics: deduped.length ? (deduped as NewsTopicId[]) : NEWS_DEFAULT_TOPICS };
    });
  }, [updateNewsPrefs]);

  const toggleHideSports = useCallback(() => {
    updateNewsPrefs((prev) => ({ ...prev, hideSports: !prev.hideSports }));
  }, [updateNewsPrefs]);

	  const displayListMemo = useMemo(() => {
	    const base = newsOverrideList || newsList;
	    const effectiveTopics = newsPrefs.topics && newsPrefs.topics.length ? newsPrefs.topics : NEWS_DEFAULT_TOPICS;

	    const fetched = Array.isArray(base) ? base.length : 0;
	    let removedByBlacklist = 0;
	    const filtered = (Array.isArray(base) ? base : []).filter((item) => {
	      if (!item) return false;
	      const title = (item.title || '').trim();
	      const summary = (item.summary || '').trim();
	      if (!title && !summary) return false;
	      if (newsPrefs.hideSports && isSportsNews(title, summary, item.category)) return false;
	      if (isLowValueNews(title, summary, item.category)) {
	        removedByBlacklist += 1;
	        return false;
	      }
	      return true;
	    });
	    const afterSports = filtered.length;

	    const scored = filtered
	      .map((item) => ({ item, score: scoreNewsItemForTopics(item, effectiveTopics) }))
      .sort((a, b) => {
        if (b.score !== a.score) return b.score - a.score;
        return (a.item.title || '').localeCompare(b.item.title || '');
      });

    const topicMatched = scored.filter((s) => s.score > 0);
    const pool = topicMatched.length >= 6 ? topicMatched : scored;
    const afterTopic = topicMatched.length;

	    const seenKeys = new Set<string>();
	    const seenUrls = new Set<string>();
	    const usedImages = new Set<string>();
    const keywordFallbacks: { match: RegExp; url: string }[] = [
      { match: /(war|military|conflict|coup)/i, url: 'https://images.unsplash.com/photo-1476611338391-6f395a0ebc71?auto=format&fit=crop&w=1200&q=80' },
      { match: /(politics|president|election|government|policy)/i, url: 'https://images.unsplash.com/photo-1529429617124-aee1711c2c57?auto=format&fit=crop&w=1200&q=80' },
      { match: /(business|economy|market|finance|company|stock)/i, url: 'https://images.unsplash.com/photo-1520607162513-77705c0f0d4a?auto=format&fit=crop&w=1200&q=80' },
      { match: /(travel|tourism|flight|airline|airport|train|transport)/i, url: 'https://images.unsplash.com/photo-1502920514313-52581002a659?auto=format&fit=crop&w=1200&q=80' },
      { match: /(tech|technology|ai|software|device|internet)/i, url: 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?auto=format&fit=crop&w=1200&q=80' },
      { match: /(health|medical|doctor|virus|covid|hospital)/i, url: 'https://images.unsplash.com/photo-1582719478185-2cf4c2c8c9a3?auto=format&fit=crop&w=1200&q=80' },
      { match: /(sports|game|match|league|champion|football|basketball|ufc)/i, url: 'https://images.unsplash.com/photo-1505761671935-60b3a7427bad?auto=format&fit=crop&w=1200&q=80' },
      { match: /(space|science|nasa|astronomy|stars)/i, url: 'https://images.unsplash.com/photo-1446776811953-b23d57bd21aa?auto=format&fit=crop&w=1200&q=80' },
      { match: /(world|city|street|people|culture)/i, url: 'https://images.unsplash.com/photo-1467269204594-9661b134dd2b?auto=format&fit=crop&w=1200&q=80' },
    ];
    const genericFallbacks = [
      'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=1200&q=80',
      'https://images.unsplash.com/photo-1504384308090-c894fdcc538d?auto=format&fit=crop&w=1200&q=80',
      'https://images.unsplash.com/photo-1487412720507-e7ab37603c6f?auto=format&fit=crop&w=1200&q=80',
      'https://images.unsplash.com/photo-1487058792275-0ad4aaf24ca7?auto=format&fit=crop&w=1200&q=80',
    ];

    const unique: NewsItem[] = [];
    const titleTokenSets: Set<string>[] = [];
    let fallbackIdx = 0;

	    for (const { item } of pool) {
	      const title = (item.title || '').trim();
	      const summary = (item.summary || '').trim();
	      const url = normalizeNewsUrl(item.source_url || '');
	      const normTitle = title.toLowerCase();
	      const normSummary = summary.toLowerCase().slice(0, 120);

	      const key =
	        normTitle === 'daily update'
	          ? `${normTitle}|${normSummary}`
	          : normTitle;
	      if (seenKeys.has(key)) continue;
	      if (url) {
	        if (seenUrls.has(url)) continue;
	        seenUrls.add(url);
	      }

	      if (title) {
	        const toks = tokenizeNewsTitle(title);
	        let tooSimilar = false;
        for (const prev of titleTokenSets) {
          if (jaccard(prev, toks) >= 0.82) {
            tooSimilar = true;
            break;
          }
        }
        if (tooSimilar) continue;
        titleTokenSets.push(toks);
      }

	      seenKeys.add(key);

	      let image = item.image || '';
      if (!image || usedImages.has(image)) {
        const match = keywordFallbacks.find(k => k.match.test(item.title || '') || k.match.test(item.summary || ''));
        image = match ? match.url : genericFallbacks[fallbackIdx % genericFallbacks.length];
        fallbackIdx += 1;
        while (usedImages.has(image)) {
          image = genericFallbacks[fallbackIdx % genericFallbacks.length];
          fallbackIdx += 1;
        }
      }

	      usedImages.add(image);
	      unique.push({ ...item, image });
	      if (unique.length >= 12) break;
	    }

      // Mix news and productivity articles (interleaved)
      const prodArticles = [...productivityArticles];
      const apiArticles = [...unique]; // Save API/news articles
      const combinedTitles = new Set<string>();
      const combined: NewsItem[] = [];

      // Interleave: alternate between news and productivity
      let newsIdx = 0;
      let prodIdx = 0;
      while (combined.length < 12 && (newsIdx < apiArticles.length || prodIdx < prodArticles.length)) {
        // Add a news article
        while (newsIdx < apiArticles.length && combined.length < 12) {
          const article = apiArticles[newsIdx++];
          const title = (article.title || '').toLowerCase();
          if (!combinedTitles.has(title)) {
            combined.push(article);
            combinedTitles.add(title);
            break; // Move to productivity
          }
        }
        // Add a productivity article
        while (prodIdx < prodArticles.length && combined.length < 12) {
          const article = prodArticles[prodIdx++];
          const title = (article.title || '').toLowerCase();
          if (!combinedTitles.has(title)) {
            combined.push(article);
            combinedTitles.add(title);
            break; // Move back to news
          }
        }
      }

      // Replace unique with combined list
      unique.length = 0;
      unique.push(...combined.slice(0, 12));

	    const topKeywordCandidates = ['ai', 'startup', 'productivity', 'workflow', 'language', 'linguistics', 'study', 'research', 'tool', 'app'];
	    const topKeywordCounts: Record<string, number> = {};
	    for (const it of unique) {
	      const blob = `${it.title || ''} ${it.summary || ''}`.toLowerCase();
	      for (const k of topKeywordCandidates) {
	        if (blob.includes(k)) topKeywordCounts[k] = (topKeywordCounts[k] || 0) + 1;
	      }
	    }
	    const topKeywords = Object.entries(topKeywordCounts)
	      .sort((a, b) => b[1] - a[1])
	      .slice(0, 5)
	      .map(([k]) => k);

	    return {
	      items: unique,
	      debug: {
	        fetched,
	        afterSports,
	        afterTopic,
	        afterDedupe: unique.length,
	        removedByBlacklist,
	        topKeywords,
	        topics: effectiveTopics,
	        hideSports: newsPrefs.hideSports,
	        pool: pool === scored ? 'relaxed' : 'topic',
	      },
	    };
	  }, [newsOverrideList, newsList, newsPrefs, productivityArticles]);

	  useEffect(() => {
	    if (!__DEV__) return;
	    console.log('[news]', {
	      topics: displayListMemo.debug.topics,
	      hideSports: displayListMemo.debug.hideSports,
	      fetched: displayListMemo.debug.fetched,
	      kept: displayListMemo.debug.afterDedupe,
	      removed_by_blacklist: displayListMemo.debug.removedByBlacklist,
	      pool: displayListMemo.debug.pool,
	      top_keywords: displayListMemo.debug.topKeywords,
	    });
	  }, [
	    displayListMemo.debug.fetched,
	    displayListMemo.debug.afterSports,
	    displayListMemo.debug.afterTopic,
	    displayListMemo.debug.afterDedupe,
	    displayListMemo.debug.removedByBlacklist,
	    displayListMemo.debug.pool,
	    displayListMemo.debug.hideSports,
	    displayListMemo.debug.topics.join(','),
	    displayListMemo.debug.topKeywords?.join?.(','),
	  ]);

  const displayList = displayListMemo.items;

  const carouselNews = displayList && displayList.length ? displayList.slice(0, 10) : [];
  const carouselPageWidth = newsCardWidth > 0 ? newsCardWidth : 0;
  const slideWidth = carouselPageWidth > 0
    ? Math.max(0, carouselPageWidth - NEWS_CAROUSEL_HORIZONTAL_PADDING * 2)
    : 0;

  const extendSummary = (rawContent: string, rawDescription: string, title: string) => {
    const clean = (txt: string) =>
      (txt || '')
        .replace(/\s*\[\+\d+\s*chars?\]/gi, '')
        .replace(/\s+/g, ' ')
        .trim();

    const content = clean(rawContent);
    const desc = clean(rawDescription);
    const segments = [content, desc].filter(Boolean);

    // Merge content + description, drop duplicate sentences.
    const sentences: string[] = [];
    const seen = new Set<string>();
    segments.forEach(seg => {
      seg.split(/(?<=[.!?])\s+/).forEach(s => {
        const sentence = s.trim();
        if (!sentence) return;
        const key = sentence.toLowerCase();
        if (seen.has(key)) return;
        seen.add(key);
        sentences.push(sentence);
      });
    });

    const body = (sentences.length ? sentences.join(' ') : title || 'A brief news update.').trim();
    const words = body.split(/\s+/).filter(Boolean);

    // Do not fabricate length; just trim to a safe upper bound.
    const maxWords = 1200;
    return cleanRepeatingNoise(words.slice(0, maxWords).join(' '));
  };

  const wordCount = (text: string) => (text || '').trim().split(/\s+/).filter(Boolean).length;

  const clampArticleLength = (text: string) => {
    const clean = (text || '').replace(/\s+/g, ' ').trim();
    if (!clean) return '';
    const words = clean.split(/\s+/).filter(Boolean);
    // Cap around ~330 words to keep the article concise in-app.
    return words.slice(0, 340).join(' ');
  };

  const cleanRepeatingNoise = (text: string) => {
    let t = (text || '').replace(/\s+/g, ' ').trim();
    t = t.replace(/(only available in paid plans[\s.,;:-]*)+/gi, 'Only available in paid plans ');
    const sentences = t.split(/(?<=[.!?])\s+/).map(s => s.trim()).filter(Boolean);
    if (!sentences.length) return clampArticleLength(t);
    const seen = new Set<string>();
    const uniq = sentences.filter(s => {
      const key = s.toLowerCase();
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
    return clampArticleLength(uniq.join(' ') || t);
  };

  const ensureArticleLength = (text: string, minWords = 220) => {
    const clamped = cleanRepeatingNoise(text);
    const words = clamped.split(/\s+/).filter(Boolean);
    if (!words.length) return '';
    // Keep the cleaned text; do not hard-cap to minWords so longer articles remain intact (up to clampArticleLength).
    return clamped;
  };

  // Trust backend summaries; never rewrite on the client.
  const shouldUseAiArticle = (_article: NewsItem) => false;

  const buildAiArticle = async (article: NewsItem): Promise<string | null> => {
    if (!AI_PROXY_URL) return null;
    const headline = (article.title || '').trim();
    if (!headline) return null;
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 14000);
    try {
      const resp = await aiProxyService.complete({
        model: 'gpt-4o-mini',
        temperature: 0.3,
        maxTokens: 2300,
        messages: [
          {
            role: 'system',
            content: `
You are a news writer. Your job is to reconstruct concise, natural, journalistic articles
using ONLY the headline and partial summary provided. 

Rules:
- Write 250–320 words.
- Keep it factual and neutral.
- Expand logically using world knowledge, without inventing specific fake facts.
- Add context, background, expert reactions, and implications.
- Use 3–5 short paragraphs separated by blank lines.
- Never repeat the headline.
- Make it feel like a real AP/Reuters article.
            `,
          },
          {
            role: 'user',
            content: `
HEADLINE:
${headline}

KNOWN TEXT:
${(article.summary || '').trim() || '(none)'}

TASK:
Write a concise news article (250–320 words) based on the headline and known text.
Keep it journalistic. Expand context naturally using your knowledge of the topic.
Avoid fiction and avoid specific unverifiable claims.
            `,
          },
        ],
      }, { signal: controller.signal });
      const raw = (resp?.content || '').trim();
      let cleaned = clampArticleLength(raw);
      if (wordCount(cleaned) < 230) {
        try {
          const extend = await aiProxyService.complete({
            model: 'gpt-4o-mini',
            temperature: 0.3,
            maxTokens: 2300,
            messages: [
              { role: 'system', content: 'You extend news articles. Keep them factual, neutral, and 260–330 words. Use short paragraphs separated by blank lines. Return only the article body as plain text (no markdown).' },
              { role: 'user', content: `Extend this article to 260–330 words without changing facts:\n\n${cleaned || raw}` },
            ],
          }, { signal: controller.signal });
          const extended = (extend?.content || '').trim();
          const extendedClean = clampArticleLength(extended);
          if (wordCount(extendedClean) >= 230) cleaned = extendedClean;
        } catch {}
      }
      cleaned = ensureArticleLength(cleaned);
      if (!cleaned) return null;
      if (wordCount(cleaned) < 200) return null;
      return cleaned;
    } catch (e) {
      if (__DEV__) console.warn('AI article generation failed or timed out', e);
      return null;
    } finally {
      clearTimeout(timer);
    }
  };

  const vocabFromTitle = (title: string) => {
    const rawTokens = (title || '')
      .split(/\s+/)
      .map(t => t.replace(/[“”"']/g, '').trim())
      .filter(Boolean);

    if (!rawTokens.length) return [];

    // For longer titles we typically have a name or location first.
    // Skip the first 1–2 tokens so vocab focuses on content words.
    const startIndex = rawTokens.length >= 5 ? 2 : rawTokens.length >= 4 ? 1 : 0;
    const cleaned: string[] = [];

    for (let i = startIndex; i < rawTokens.length; i += 1) {
      const token = rawTokens[i];
      const clean = token.replace(/[^a-zA-Z-]/g, '');
      if (!clean) continue;
      const lower = clean.toLowerCase();
      // Skip very short/weak words in the fallback vocab.
      if (lower.length < 4) continue;
      // Ensure uniqueness case-insensitively.
      if (cleaned.some(w => w.toLowerCase() === lower)) continue;
      cleaned.push(clean);
      if (cleaned.length >= 5) break;
    }

    // Fallback: if everything was filtered out (e.g., very short title),
    // keep the first few cleaned tokens.
    const finalWords =
      cleaned.length > 0
        ? cleaned
        : rawTokens
            .map(t => t.replace(/[^a-zA-Z-]/g, ''))
            .filter(Boolean)
            .slice(0, 5);

    return finalWords.map(word => ({
      word,
      definition: 'Key word from headline',
    }));
  };

  const parseJsonArray = (raw: string): any[] | null => {
    if (!raw) return null;
    try {
      const parsed = JSON.parse(raw);
      return Array.isArray(parsed) ? parsed : null;
    } catch {}
    const start = raw.indexOf('[');
    const end = raw.lastIndexOf(']');
    if (start >= 0 && end > start) {
      try {
        const parsed = JSON.parse(raw.slice(start, end + 1));
        return Array.isArray(parsed) ? parsed : null;
      } catch {}
    }
    return null;
  };

  const buildAiVocab = async (article: NewsItem): Promise<{ word: string; definition: string; translation?: string }[] | null> => {
    if (!AI_PROXY_URL) return null;
    const target = primaryLang && primaryLang !== 'en' ? primaryLang : 'English';
    try {
      // Hard timeout to avoid locking the UI if the proxy is slow
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), 6000);
      const resp = await aiProxyService.complete({
        model: 'gpt-4o-mini',
        temperature: 0.4,
        maxTokens: 200,
        messages: [
          { role: 'system', content: 'You are a concise news vocabulary helper who returns clean JSON arrays.' },
          {
            role: 'user',
            content:
              `Headline: ${article.title}\n` +
              `Summary: ${article.summary.slice(0, 800)}\n` +
              `Return a JSON array of 5 items, each with keys: word, definition, translation. ` +
              `Words should come from the headline/summary, skip names unless widely known. ` +
              `Definitions must be in simple English. If translation is provided, it must be in ${target}.` ,
          },
        ],
      }, { signal: controller.signal });
      clearTimeout(timer);
      const content = resp?.content || '';
      const arr = parseJsonArray(typeof content === 'string' ? content : JSON.stringify(content));
      if (!arr) return null;
      const normalized = arr
        .map((item: any) => {
          const word = String(item?.word || '').trim();
          const definition = String(item?.definition || '').trim();
          const translation = String(item?.translation || '').trim();
          if (!word || !definition) return null;
          return {
            word,
            definition,
            translation: translation && target !== 'English' ? translation : undefined,
          };
        })
        .filter(Boolean) as { word: string; definition: string; translation?: string }[];
      return normalized.slice(0, 5);
    } catch (e) {
      if (__DEV__) console.warn('AI vocab enrichment failed or timed out', e);
      return null;
    }
  };

	  const translateVocabWithVault = async (
	    vocab: { word: string; definition: string; translation?: string }[],
	    targetLang: string
	  ): Promise<{ word: string; definition: string; translation?: string }[]> => {
    const lang = (targetLang || '').toLowerCase();
    if (!lang || lang === 'en') return vocab;
    try {
      const translated = await Promise.all(
        vocab.map(async (item) => {
          if (!item.word) return item;
          try {
            const t = await TranslationService.translate(item.word, lang);
            const translation = t?.translation?.trim();
            if (translation) return { ...item, translation };
          } catch {}
          return item;
        })
      );
      return translated;
    } catch {
      return vocab;
	    }
	  };

	  type NewsHook = { hookTitle: string; whyMatters: string };
	  const NEWS_HOOK_CACHE_TTL_MS = 1000 * 60 * 60 * 24;
	  const NEWS_HOOK_CACHE_VERSION = 1;

	  const buildNewsHookSeed = (article: NewsItem) =>
	    normalizeNewsUrl(article.source_url || '') || (article.cache_key || '').trim() || (article.title || '').trim();

	  const buildNewsHookCacheKey = (article: NewsItem) =>
	    `news:hook:v${NEWS_HOOK_CACHE_VERSION}:${stableHash32(buildNewsHookSeed(article) || article.title || '')}`;

	  const parseJsonObject = (raw: string): Record<string, any> | null => {
	    if (!raw) return null;
	    const s = raw.trim();
	    if (s.startsWith('{') && s.endsWith('}')) {
	      try {
	        const parsed = JSON.parse(s);
	        return parsed && typeof parsed === 'object' && !Array.isArray(parsed) ? parsed : null;
	      } catch {}
	    }
	    const start = s.indexOf('{');
	    const end = s.lastIndexOf('}');
	    if (start >= 0 && end > start) {
	      try {
	        const parsed = JSON.parse(s.slice(start, end + 1));
	        return parsed && typeof parsed === 'object' && !Array.isArray(parsed) ? parsed : null;
	      } catch {}
	    }
	    return null;
	  };

	  const buildNewsHookFallback = (article: NewsItem): NewsHook => {
	    const title = (article.title || 'Daily update').replace(/\s+/g, ' ').trim();
	    const blob = `${title} ${(article.summary || '').slice(0, 240)}`.toLowerCase();
	    let why = 'A quick, useful update for learning-focused readers.';
	    if (/\b(ai|llm|chatgpt|openai|gpt)\b/i.test(blob)) why = 'Shows what’s changing in AI tools—and what to watch next.';
	    else if (/\b(productivity|workflow|habit|focus|time management)\b/i.test(blob))
	      why = 'Practical ideas you can apply to work and study today.';
	    else if (/\b(language learning|linguistics|vocabulary|grammar|pronunciation)\b/i.test(blob))
	      why = 'Useful context for improving language and communication skills.';
	    else if (/\b(startup|founder|funding|venture|seed round|series [ab])\b/i.test(blob))
	      why = 'Signals where new products and careers may be heading.';
	    else if (/\b(research|study|scientist|paper|breakthrough)\b/i.test(blob))
	      why = 'A learning-friendly summary of what the latest research suggests.';

	    const hookTitle = title.length <= 70 ? title : `${title.slice(0, 67).trimEnd()}…`;
	    return { hookTitle, whyMatters: why };
	  };

	  const getCachedNewsHook = async (article: NewsItem): Promise<NewsHook | null> => {
	    const key = buildNewsHookCacheKey(article);
	    const cached = await getCached<any>(key, NEWS_HOOK_CACHE_TTL_MS);
	    const hookTitle = typeof cached?.hookTitle === 'string' ? cached.hookTitle.trim() : '';
	    const whyMatters = typeof cached?.whyMatters === 'string' ? cached.whyMatters.trim() : '';
	    if (!hookTitle || !whyMatters) return null;
	    return { hookTitle, whyMatters };
	  };

	  const fetchAiNewsHook = async (article: NewsItem): Promise<NewsHook | null> => {
	    if (!AI_PROXY_URL) return null;
	    const seed = buildNewsHookSeed(article);
	    if (!seed) return null;

	    const cacheKey = buildNewsHookCacheKey(article);
	    const cached = await getCached<any>(cacheKey, NEWS_HOOK_CACHE_TTL_MS);
	    if (cached?.hookTitle && cached?.whyMatters) return { hookTitle: cached.hookTitle, whyMatters: cached.whyMatters };

	    const title = (article.title || '').trim();
	    if (!title) return null;
	    const summary = (article.summary || '').replace(/\s+/g, ' ').trim();
	    const clippedSummary = summary.split(/\s+/).slice(0, 90).join(' ');

	    const controller = new AbortController();
	    const timer = setTimeout(() => controller.abort(), 9000);
	    try {
	      const resp = await aiProxyService.complete(
	        {
	          model: 'gpt-4o-mini',
	          temperature: 0.35,
	          maxTokens: 200,
	          messages: [
	            {
	              role: 'system',
	              content:
	                'You write honest, curiosity-driving headlines for language learners. ' +
	                'Return JSON only: {"hookTitle": string, "whyMatters": string}. ' +
	                'Constraints: hookTitle <= 70 chars, whyMatters is ONE sentence <= 110 chars. ' +
	                'No emojis, no quotes, no clickbait, no exaggeration.',
	            },
	            {
	              role: 'user',
	              content:
	                `ORIGINAL HEADLINE:\n${title}\n\n` +
	                `SUMMARY (may be partial):\n${clippedSummary || '(none)'}\n\n` +
	                `Return JSON only.`,
	            },
	          ],
	        },
	        { signal: controller.signal }
	      );
	      const obj = parseJsonObject(resp?.content || '');
	      const hookTitleRaw = typeof obj?.hookTitle === 'string' ? obj.hookTitle.trim() : '';
	      const whyRaw = typeof obj?.whyMatters === 'string' ? obj.whyMatters.trim() : '';
	      if (!hookTitleRaw || !whyRaw) return null;

	      const hookTitle = hookTitleRaw.length <= 70 ? hookTitleRaw : `${hookTitleRaw.slice(0, 67).trimEnd()}…`;
	      const whyMatters = whyRaw.length <= 110 ? whyRaw : `${whyRaw.slice(0, 107).trimEnd()}…`;
	      const out = { hookTitle, whyMatters };
	      await setCached(cacheKey, out);
	      return out;
	    } catch {
	      return null;
	    } finally {
	      clearTimeout(timer);
	    }
	  };

	  const enrichArticleWithAi = useCallback(async (article: NewsItem): Promise<NewsItem> => {
	    const summary = ensureArticleLength(article.summary || article.title || '', 150);
	    let vocabSource: 'backend' | 'client' | 'fallback' | undefined = article.vocabSource;
	    let vocab: { word: string; definition: string; translation?: string }[] =
      Array.isArray(article.vocab) && article.vocab.length
        ? article.vocab
        : vocabFromTitle(article.title);
    if (!vocabSource) {
      vocabSource = Array.isArray(article.vocab) && article.vocab.length ? 'backend' : 'fallback';
    }
	    const targetLang = primaryLang && primaryLang !== 'en' ? primaryLang : '';
	    if (targetLang) {
	      vocab = await translateVocabWithVault(vocab, targetLang);
	    }
	    const cachedHook = await getCachedNewsHook(article);
	    const hook = cachedHook || buildNewsHookFallback(article);
	    return { ...article, summary, vocab, vocabSource, hookTitle: hook.hookTitle, whyMatters: hook.whyMatters };
	  }, [primaryLang]);

	  const applyNewsHookToLists = useCallback((seed: string, hook: NewsHook) => {
	    if (!seed) return;
	    setNewsOverrideList((prev) =>
	      prev ? prev.map((a) => (buildNewsHookSeed(a) === seed ? { ...a, ...hook } : a)) : prev
	    );
	    setNewsList((prev) =>
	      Array.isArray(prev) ? prev.map((a) => (buildNewsHookSeed(a) === seed ? { ...a, ...hook } : a)) : prev
	    );
	    setNewsModalArticle((prev) => (prev && buildNewsHookSeed(prev) === seed ? { ...prev, ...hook } : prev));
	  }, []);

	  const scheduleNewsHookPrefetch = useCallback(
	    (articles: NewsItem[]) => {
	      if (!AI_PROXY_URL) return;
	      const list = Array.isArray(articles) ? articles : [];
	      if (!list.length) return;
	      const reqId = (newsHookReqIdRef.current += 1);
	      const candidates = list.slice(0, 10);

	      // Background best-effort: keep concurrency low to avoid rate limits.
	      InteractionManager.runAfterInteractions(() => {
	        (async () => {
	          let cursor = 0;
	          const concurrency = 2;
	          const workers = Array.from({ length: concurrency }).map(async () => {
	            while (cursor < candidates.length && newsHookReqIdRef.current === reqId) {
	              const a = candidates[cursor++];
	              const seed = buildNewsHookSeed(a);
	              if (!seed) continue;
	              if (newsHookInFlightRef.current[seed]) continue;
	              if (await getCachedNewsHook(a)) continue; // already cached
	              newsHookInFlightRef.current[seed] = true;
	              try {
	                const hook = await fetchAiNewsHook(a);
	                if (!hook) continue;
	                if (newsHookReqIdRef.current !== reqId) return;
	                applyNewsHookToLists(seed, hook);
	              } finally {
	                delete newsHookInFlightRef.current[seed];
	              }
	            }
	          });
	          await Promise.all(workers);
	        })().catch(() => {});
	      });
	    },
	    [applyNewsHookToLists]
	  );

	  const loadCachedNews = async (): Promise<{ articles: NewsItem[]; status: string } | null> => {
	    try {
	      const raw = await AsyncStorage.getItem('@engniter.news.payload');
	      if (!raw) return null;
      const parsed = JSON.parse(raw);
      if (!Array.isArray(parsed?.articles) || parsed.articles.length === 0) return null;

      // Check cache version - if outdated, clear and force refresh
      if (parsed.version !== NEWS_CACHE_VERSION) {
        await AsyncStorage.removeItem('@engniter.news.payload');
        await AsyncStorage.removeItem('@engniter.news.lastFetchedAt');
        return null;
      }

      // Check if cache is still fresh (less than 24 hours old)
      const lastFetched = await AsyncStorage.getItem('@engniter.news.lastFetchedAt');
      if (lastFetched) {
        const fetchedTime = new Date(lastFetched).getTime();
        const now = Date.now();
        const TWENTY_FOUR_HOURS = 24 * 60 * 60 * 1000;
        if (now - fetchedTime > TWENTY_FOUR_HOURS) {
          // Cache expired - clear it and return null to force fresh fetch
          await AsyncStorage.removeItem('@engniter.news.payload');
          await AsyncStorage.removeItem('@engniter.news.lastFetchedAt');
          return null;
        }
      }

      return { articles: parsed.articles, status: parsed.status || 'Live feed (cached)' };
    } catch {}
    return null;
  };

  // Fetch AI-generated productivity articles from Supabase function
  const fetchProductivityArticles = useCallback(async () => {
    // Cache already loaded at module level for instant display
    // Just check if we need to refresh from API
    let forceRefresh = false;
    try {
      const cached = await AsyncStorage.getItem(PROD_CACHE_KEY);
      if (cached) {
        const parsed = JSON.parse(cached);
        if (Array.isArray(parsed?.articles) && parsed.articles.length > 0) {
          // Update state if not already set (module preload should have done this)
          if (productivityArticles.length === 0) {
            setProductivityArticles(parsed.articles);
          }

          // Check if cache is from today (UTC) and less than 12 hours old
          const fetchedAt = parsed.fetchedAt ? new Date(parsed.fetchedAt) : null;
          if (fetchedAt) {
            const now = new Date();
            const fetchedDate = fetchedAt.toISOString().slice(0, 10);
            const todayDate = now.toISOString().slice(0, 10);
            const ageMs = now.getTime() - fetchedAt.getTime();

            // If same day AND less than 12 hours old, use cache
            if (fetchedDate === todayDate && ageMs < 12 * 60 * 60 * 1000) {
              return; // Use cached articles, don't refetch
            }
            // Otherwise, mark for refresh
            forceRefresh = true;
          } else {
            forceRefresh = true;
          }
        }
      } else {
        forceRefresh = true;
      }
    } catch {
      forceRefresh = true;
    }

    if (!PRODUCTIVITY_ARTICLES_URL) {
      // No URL configured - just return (don't use fallback)
      return;
    }

    try {
      // Add refresh=1 parameter if cache is stale or from a previous day
      const fetchUrl = forceRefresh
        ? `${PRODUCTIVITY_ARTICLES_URL}${PRODUCTIVITY_ARTICLES_URL.includes('?') ? '&' : '?'}refresh=1`
        : PRODUCTIVITY_ARTICLES_URL;
      const response = await fetch(fetchUrl, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
      });

      if (!response.ok) {
        console.warn('[productivity] Failed to fetch:', response.status);
        // Don't use fallback - just return
        return;
      }

      const data = await response.json();
      const articles = Array.isArray(data?.articles) ? data.articles : [];

      if (articles.length > 0) {
        // Map to NewsItem format including quiz, takeaways, and challenge
        const mapped: NewsItem[] = articles.map((a: any) => ({
          title: a.title || 'Productivity Tip',
          summary: a.summary || '',
          vocab: Array.isArray(a.vocab) ? a.vocab : [],
          image: a.image || 'https://images.unsplash.com/photo-1484480974693-6ca0a78fb36b?auto=format&fit=crop&w=1600&q=80',
          tag: a.tag || 'Productivity',
          category: a.category || 'lifestyle',
          quiz: Array.isArray(a.quiz) ? a.quiz : [],
          keyTakeaways: Array.isArray(a.keyTakeaways) ? a.keyTakeaways : [],
          dailyChallenge: a.dailyChallenge || '',
        }));
        setProductivityArticles(mapped);
        // Cache locally with versioned key
        try {
          await AsyncStorage.setItem(PROD_CACHE_KEY, JSON.stringify({
            articles: mapped,
            fetchedAt: new Date().toISOString(),
          }));
        } catch {}
      }
      // Don't fall back to hardcoded articles - just wait for API
    } catch (err) {
      console.warn('[productivity] Fetch error:', err);
      // Don't fall back to hardcoded articles - leave empty until API works
    }
  }, [productivityArticles.length]);

  // Fetch productivity articles on mount
  useEffect(() => {
    if (productivityFetchedRef.current) return;
    productivityFetchedRef.current = true;
    fetchProductivityArticles();
  }, [fetchProductivityArticles]);

  const refreshNewsFromApi = useCallback(async () => {
    if (!newsConfigured) {
      setNewsStatus('Curated articles');
      // Don't use fallback articles - wait for productivity articles from API
      setNewsOverrideList([]);
      setNewsList([]);
      setNewsLoading(false);
      if (__DEV__) console.warn('News feed not configured — waiting for productivity articles');
      return;
    }

    // Point to backend cache endpoint (preferred). If NEWS_API_URL is set, use that as an override.
    // IMPORTANT: Never fallback to localhost in production - it causes UI freezes.
    const backendBase = (BACKEND_BASE_URL || '').replace(/\/$/, '');
    const baseTargetUrl =
      NEWS_API_URL && NEWS_API_URL.trim().length > 0
        ? NEWS_API_URL.trim()
        : backendBase
          ? `${backendBase}/api/news`
          : ''; // Empty string will skip fetch if no valid URL

    // Skip fetch if no valid URL configured (prevents localhost connection attempts in production)
    if (!baseTargetUrl) {
      setNewsLoading(false);
      if (__DEV__) console.warn('[news] No valid news URL configured, skipping fetch');
      return;
    }

	    // Let the server handle caching - it has its own 24-hour database cache.
	    // Only force refresh if user explicitly requests it (e.g., pull-to-refresh).
	    // This avoids slow full refreshes on every app restart when local AsyncStorage is empty.
	    const forceRefresh = false; // Server-side cache handles freshness
	    const targetUrl = baseTargetUrl;
	    const topics = newsPrefs.topics && newsPrefs.topics.length ? newsPrefs.topics : NEWS_DEFAULT_TOPICS;
	    const include = buildNewsIncludeQuery(topics);
	    const exclude = newsPrefs.hideSports ? buildNewsExcludeQuery() : '';
	    let requestUrl = targetUrl;
	    try {
	      const u = new URL(targetUrl);
      u.searchParams.set('limit', '30');
	      if (include) u.searchParams.set('include', include);
	      if (exclude) u.searchParams.set('exclude', exclude);
	      u.searchParams.set('hideSports', newsPrefs.hideSports ? '1' : '0');
	      u.searchParams.set('topics', topics.join(','));
	      requestUrl = u.toString();
	    } catch {}

	    try {
	      setNewsLoading(true);
	      setNewsStatus('Loading live news…');
      const controller = new AbortController();
      // Reduced timeout to 20s to prevent UI freezing on slow networks
      // If server is slow, we'll show cached content instead
      const timer = setTimeout(() => controller.abort(), 20000);
      let res: Response | null = null;
	      try {
	        // Try POST first to force a fresh refresh on the Supabase function
	        res = await fetch(requestUrl, {
	          method: 'POST',
	          headers: {
	            'Content-Type': 'application/json',
	          },
	          signal: controller.signal,
	        });
        if (!res.ok && res.status === 405) {
          throw new Error('fallback-get');
        }
	      } catch (err) {
	        // Fallback to GET if POST is not allowed
	        res = await fetch(requestUrl, {
	          method: 'GET',
	          headers: {
	            'Content-Type': 'application/json',
	          },
	          signal: controller.signal,
	        });
      } finally {
        clearTimeout(timer);
      }
      if (!res.ok) {
        if (res.status === 401 || res.status === 403) throw new Error('auth');
        if (res.status === 429) throw new Error('rate-limit');
        throw new Error(`status ${res.status}`);
      }
      const data = await res.json();
      if (data && typeof data.status === 'string' && data.status !== 'ok' && data.status !== 'stale') {
        throw new Error(`api-status ${data.status}`);
      }
      let normalized: NewsItem[] = [];

      const articlesRaw = (data as any)?.results || (data as any)?.articles || data;
      const articles = Array.isArray(articlesRaw) ? articlesRaw : [];

      if (articles.length) {
        normalized = articles.slice(0, 30).map((a: any) => {
		          const title = a?.title || a?.description || 'Daily update';
	          const source_url = typeof a?.source_url === 'string'
	            ? a.source_url
	            : typeof a?.link === 'string'
	              ? a.link
	              : typeof a?.url === 'string'
	                ? a.url
	                : '';
	          // NewsData.io returns content/description/image_url; NewsAPI returns content/description/urlToImage.
	          // Prefer description (NewsData provides clean sentences) then summary/title
	          const backendSummary = typeof a?.summary === 'string' ? a.summary : '';
          const summaryText =
            a?.description ||
            backendSummary ||
            a?.summary ||
            a?.content ||
            a?.title ||
            '';
          const baseContent = summaryText;
          const baseDescription = summaryText;
          const summary = backendSummary
            ? backendSummary
            : extendSummary(baseContent, baseDescription, title);
          const backendVocab = Array.isArray(a?.vocab) ? a.vocab : null;
          const vocab = backendVocab && backendVocab.length ? backendVocab : vocabFromTitle(title);
	          const vocabSource: 'backend' | 'fallback' =
	            backendVocab && backendVocab.length ? 'backend' : 'fallback';
	          const categoryRaw = a?.category;
	          const category = Array.isArray(categoryRaw)
	            ? String(categoryRaw[0] || '')
	            : typeof categoryRaw === 'string'
	              ? categoryRaw
	              : '';
	          const tone = typeof a?.tone === 'string' ? a.tone : 'neutral';
		          return {
		            title,
		            summary,
		            vocab,
		            vocabSource,
		            cache_key: a?.cache_key,
		            cache_hit: a?.cache_hit,
		            generated_at: a?.generated_at,
		            source_url,
		            category: category || undefined,
		            tone,
		            image: a?.image || a?.image_url || a?.urlToImage || fallbackNewsImage,
		            tag: 'Live',
		          } as NewsItem;
		        });
	      } else if (data?.title && data?.summary) {
        const backendVocab = Array.isArray(data.vocab) ? data.vocab : null;
        const vocab = backendVocab && backendVocab.length ? backendVocab : vocabFromTitle(data.title);
	        const vocabSource: 'backend' | 'fallback' =
	          backendVocab && backendVocab.length ? 'backend' : 'fallback';
	        const categoryRaw = (data as any)?.category;
	        const category = Array.isArray(categoryRaw)
	          ? String(categoryRaw[0] || '')
	          : typeof categoryRaw === 'string'
	            ? categoryRaw
	            : '';
	        const tone = typeof (data as any)?.tone === 'string' ? (data as any).tone : 'neutral';
		        normalized = [{
		          title: data.title,
		          summary: extendSummary(
		            data.summary || (data as any)?.content || (data as any)?.full_content || '',
		            data.summary || '',
		            data.title
		          ),
		          vocab,
		          vocabSource,
		          cache_key: (data as any)?.cache_key,
		          cache_hit: (data as any)?.cache_hit,
		          generated_at: (data as any)?.generated_at,
		          source_url: (data as any)?.source_url,
		          category: category || undefined,
		          tone,
		          image: (data as any)?.image || (data as any)?.image_url || fallbackNewsImage,
		          tag: 'Live',
		        }];
		      }

      if (normalized.length > 0) {
        const { deduped, filtered, stats } = refineNewsArticles(normalized, topics, newsPrefs.hideSports);
        const ensured = ensureMinimumNews(deduped, filtered, NEWS_DESIRED_COUNT);
        const finalArticles = ensured.slice(0, Math.min(NEWS_DESIRED_COUNT, ensured.length));
        stats.rendered = finalArticles.length;
        if (__DEV__) {
          console.log(
            '[news] stats',
            `topics=${topics.join(',')}`,
            `fetched=${stats.fetched}`,
            `after_filter=${stats.afterFilter}`,
            `after_dedupe=${stats.afterDedupe}`,
            `rendered=${stats.rendered}`
          );
        }
        if (finalArticles.length) {
          const enriched = await Promise.all(finalArticles.map(enrichArticleWithAi));
          setNewsOverrideList(enriched);
          setNewsList(enriched);
          setNewsStatus(data.status === 'stale' ? 'Live feed (cached)' : 'Live feed');
          scheduleNewsHookPrefetch(enriched);
          // Persist latest payload; we no longer gate network requests on this
          try {
            const nowIso = new Date().toISOString();
            await AsyncStorage.multiSet([
              ['@engniter.news.lastFetchedAt', nowIso],
              ['@engniter.news.lastDate', nowIso.slice(0, 10)], // legacy key, safe to keep
              ['@engniter.news.payload', JSON.stringify({ version: NEWS_CACHE_VERSION, status: data.status, articles: enriched })],
            ]);
          } catch {}
        } else {
          const cached = await loadCachedNews();
          if (cached) {
            setNewsOverrideList(cached.articles);
            setNewsList(cached.articles);
            setNewsStatus(cached.status || 'Live feed (cached)');
            scheduleNewsHookPrefetch(cached.articles);
          } else {
            // Don't use fallback - wait for productivity articles from API
            setNewsOverrideList([]);
            setNewsList([]);
            setNewsStatus('Loading articles...');
          }
        }
      } else {
	        // No articles returned: attempt stale cache before showing curated content
	        const cached = await loadCachedNews();
	        if (cached) {
	          setNewsOverrideList(cached.articles);
	          setNewsList(cached.articles);
	          setNewsStatus(cached.status || 'Live feed (cached)');
	          scheduleNewsHookPrefetch(cached.articles);
	        } else {
	          // Don't use fallback - wait for productivity articles from API
	          setNewsOverrideList([]);
	          setNewsList([]);
	          setNewsStatus('Loading articles...');
	        }
      }
    } catch (e) {
      const msg = (e as Error)?.message || '';
      if (msg.includes('rate-limit')) {
        setNewsStatus('Loading articles...');
      } else if (msg.includes('auth')) {
        setNewsStatus('Loading articles...');
	      } else {
	        // Try stale cache before showing curated content
	        const cached = await loadCachedNews();
	        if (cached) {
	          setNewsOverrideList(cached.articles);
	          setNewsList(cached.articles);
	          setNewsStatus(cached.status || 'Live feed (cached)');
	          scheduleNewsHookPrefetch(cached.articles);
	          setNewsLoading(false);
	          return;
	        }
        setNewsStatus('Loading articles...');
      }
      // Don't use fallback - wait for productivity articles from API
      setNewsOverrideList([]);
      setNewsList([]);
      if (__DEV__) console.warn('News fetch failed, waiting for productivity articles', e);
	    } finally {
	      setNewsLoading(false);
	    }
	  }, [newsConfigured, BACKEND_BASE_URL, NEWS_API_URL, fallbackNewsImage, enrichArticleWithAi, newsPrefs, scheduleNewsHookPrefetch]);

	  useEffect(() => {
	    if (!newsConfigured) return;
	    if (!newsPrefsFromStorageRef.current) return;
      console.log('[news] newsPrefs changed, scheduling refresh in 650ms');
	    try {
	      if (newsPrefsRefreshTimerRef.current) clearTimeout(newsPrefsRefreshTimerRef.current);
	    } catch {}
	    newsPrefsRefreshTimerRef.current = setTimeout(() => {
        console.log('[news] newsPrefs refresh triggered');
	      refreshNewsFromApi().catch((e) => console.log('[news] newsPrefs refresh error:', e));
	    }, 650);
	    return () => {
	      try {
	        if (newsPrefsRefreshTimerRef.current) clearTimeout(newsPrefsRefreshTimerRef.current);
	      } catch {}
	    };
	  }, [newsPrefs, newsConfigured, refreshNewsFromApi]);

  useEffect(() => {
    if (newsFetchStarted.current) {
      console.log('[news] Skipping fetch - already started');
      return;
    }
    newsFetchStarted.current = true;
    console.log('[news] Starting initial news fetch...');

    // Use InteractionManager to defer heavy operations until after render
    const task = InteractionManager.runAfterInteractions(async () => {
      // 1) Show any cached payload immediately so the UI is never empty
      try {
        const cached = await loadCachedNews();
        console.log('[news] Local cache result:', cached ? `${cached.articles.length} articles` : 'null');
        if (cached) {
          setNewsOverrideList(cached.articles);
          setNewsList(cached.articles);
          setNewsStatus(cached.status || 'Live feed (cached)');
          scheduleNewsHookPrefetch(cached.articles);
        }
      } catch (e) {
        console.log('[news] Cache load error:', e);
      }
      // 2) Always ask the backend for the latest feed; if it has fresher
      //    data than the cache, it will be returned and replace the list.
      // Use a shorter timeout for initial fetch to prevent long freezes
      try {
        console.log('[news] Fetching from API...');
        await refreshNewsFromApi();
        console.log('[news] API fetch completed');
      } catch (e) {
        console.log('[news] API fetch error:', e);
      }
    });

    return () => task.cancel();
  }, [refreshNewsFromApi, scheduleNewsHookPrefetch]);

  let missionSubtitle = 'A 5-question sprint to refresh your words.';
  let missionCta = 'Start Mission';
  const missionIsCompleted = missionStatus === 'completed';
  if (missionLoading) {
    missionSubtitle = 'Loading mission…';
    missionCta = 'Loading…';
  } else if (missionIsCompleted) {
    missionSubtitle = `Completed: ${missionCorrect}/${missionTotal} correct`;
    missionCta = 'View results';
  } else if (missionStatus === 'in_progress') {
    missionSubtitle = `Continue: ${missionAnswered}/${missionTotal} questions completed`;
    missionCta = 'Continue Mission';
  }
  

  useEffect(() => {
    if (initRanRef.current) return;
    initRanRef.current = true;
    (async () => {
      const level = await AsyncStorage.getItem(SELECTED_LEVEL_KEY);
      if (level) setStoredLevel(level);
      const done = await AsyncStorage.getItem('@engniter.onboarding_done_v1');
      setShowOnboarding(!done);
      try { await loadProgress(); } catch {}
    })();
  }, []);

  // Load today's mission summary for the home card without blocking the screen
  useEffect(() => {
    let alive = true;
    const userId = user?.id || 'local-user';
    if (pathname && pathname !== '/') return;
    if (missionFetchKeyRef.current === userId) return;
    missionFetchKeyRef.current = userId;

    // Use InteractionManager to defer mission loading until after initial render
    const task = InteractionManager.runAfterInteractions(async () => {
      const dailyStoryWords = getDailyStoryWordsWithImages();
      if (alive) {
        setStoryWords(dailyStoryWords);
        setActiveStoryIndex(dailyStoryWords.length ? 0 : null);
        setStoryViewedMap({});
        storyDetailAnim.setValue(0);
        if (dailyStoryWords.length) {
          Animated.timing(storyDetailAnim, { toValue: 1, duration: 220, useNativeDriver: true }).start();
        }
      }
      try {
        setMissionLoading(true);
        const res = await getTodayMissionForUser(userId);
        if (!alive || !res) return;
        const answered = res.questions.filter(q => q.answered).length;
        const total = res.questions.length || 5;
        const review = res.mission.weakWordsCount ?? 0;
        const fresh = res.mission.newWordsCount ?? 0;
        const story = res.questions.filter(q => q.type === 'story_mcq' || q.type === 'story_context_mcq').length;
        setMissionSummary({
          status: res.mission.status,
          answered,
          total,
          correct: res.mission.correctCount || 0,
          review,
          fresh,
          story,
          xpReward: res.mission.xpReward || 60,
        });
      } catch (e) {
        console.warn('load mission summary failed', e);
      } finally {
        if (alive) setMissionLoading(false);
      }
    });

    return () => {
      alive = false;
      task.cancel();
    };
  }, [user?.id, pathname]);

  const stopStoryAutoAdvance = useCallback(() => {
    try {
      storyAnimRef.current?.stop();
    } catch {}
    storyAnimRef.current = null;
  }, []);

  const closeStoryViewer = useCallback(() => {
    stopStoryAutoAdvance();
    storyViewerVisibleRef.current = false;
    storyIgnorePressRef.current = false;
    storyProgressValueRef.current = 0;
    try {
      storyProgressAnim.stopAnimation(() => {});
      storyProgressAnim.setValue(0);
    } catch {}
    setStoryViewerVisible(false);
    // Reset exercise state
    setStoryExerciseMode(false);
    setExerciseQuestionIndex(0);
    setExerciseScore(0);
    setExerciseAnswered(false);
    setExerciseSelectedAnswer(null);
  }, [stopStoryAutoAdvance, storyProgressAnim]);

  const goToNextStory = useCallback(() => {
    const count = Math.max(0, storyCountRef.current || storyWords.length);
    const nextIndex = (storyIndexRef.current || 0) + 1;
    if (!count || nextIndex >= count) {
      // Show exercise instead of closing
      stopStoryAutoAdvance();
      setStoryExerciseMode(true);
      setExerciseQuestionIndex(0);
      setExerciseScore(0);
      setExerciseAnswered(false);
      setExerciseSelectedAnswer(null);
      return;
    }
    storyIndexRef.current = nextIndex;
    setActiveStoryIndex(nextIndex);
  }, [storyWords.length, stopStoryAutoAdvance]);

  const startStoryAutoAdvance = useCallback((fromProgress = 0) => {
    if (!storyViewerVisibleRef.current) return;
    stopStoryAutoAdvance();

    const safeFrom = Math.max(0, Math.min(1, fromProgress || 0));
    storyProgressAnim.setValue(safeFrom);

    const remainingMs = Math.max(120, Math.round(STORY_DURATION_MS * (1 - safeFrom)));
    const anim = Animated.timing(storyProgressAnim, {
      toValue: 1,
      duration: remainingMs,
      useNativeDriver: false,
    });
    storyAnimRef.current = anim;
    anim.start(({ finished }) => {
      if (!finished) return;
      if (!storyViewerVisibleRef.current) return;
      storyProgressValueRef.current = 0;
      goToNextStory();
    });
  }, [goToNextStory, stopStoryAutoAdvance, storyProgressAnim]);

  const goToPrevStory = useCallback(() => {
    const prevIndex = (storyIndexRef.current || 0) - 1;
    if (prevIndex < 0) {
      storyProgressValueRef.current = 0;
      storyProgressAnim.setValue(0);
      startStoryAutoAdvance(0);
      return;
    }
    storyIndexRef.current = prevIndex;
    setActiveStoryIndex(prevIndex);
  }, [startStoryAutoAdvance, storyProgressAnim]);

  const pauseStoryAutoAdvance = useCallback(() => {
    stopStoryAutoAdvance();
    try {
      storyProgressAnim.stopAnimation((v) => {
        storyProgressValueRef.current = typeof v === 'number' ? v : 0;
      });
    } catch {
      storyProgressValueRef.current = 0;
    }
  }, [stopStoryAutoAdvance, storyProgressAnim]);

  const resumeStoryAutoAdvance = useCallback(() => {
    if (!storyViewerVisibleRef.current) return;
    const from = Math.max(0, Math.min(1, storyProgressValueRef.current || 0));
    startStoryAutoAdvance(from);
  }, [startStoryAutoAdvance]);

	  const openStoryViewer = useCallback((index = 0) => {
	    if (!(user && (user as any)?.id)) {
	      setShowSignupNudge(true);
	      return;
	    }
		    const count = storyWords.length;
		    if (!count) return;
		    const safeIndex = Math.max(0, Math.min(count - 1, index));

    storyCountRef.current = count;
    storyIndexRef.current = safeIndex;
    storyViewerVisibleRef.current = true;
    storyIgnorePressRef.current = false;
    storyProgressValueRef.current = 0;
    storyProgressAnim.setValue(0);

	    setActiveStoryIndex(safeIndex);
	    setStoryViewerVisible(true);
		  }, [storyProgressAnim, storyWords.length, user]);

		  const openStoryQuiz = useCallback(() => {
		    if (!(user && (user as any)?.id)) {
		      setShowSignupNudge(true);
		      return;
		    }
		    if (!storyWords.length) return;
		    stopStoryAutoAdvance();
		    setStoryExerciseMode(true);
		    setExerciseQuestionIndex(0);
	    setExerciseScore(0);
	    setExerciseAnswered(false);
	    setExerciseSelectedAnswer(null);
	    openStoryViewer(storyStartIndex);
		  }, [openStoryViewer, stopStoryAutoAdvance, storyStartIndex, storyWords.length, user]);

	  useEffect(() => {
	    if (!storyViewerVisible) return;
	    if (storyExerciseMode) return;
	    // restart timer on each story
	    storyProgressValueRef.current = 0;
	    storyProgressAnim.setValue(0);
	    startStoryAutoAdvance(0);
	    return () => {
	      stopStoryAutoAdvance();
	    };
	  }, [storyViewerVisible, storyExerciseMode, activeStoryIndex, startStoryAutoAdvance, stopStoryAutoAdvance, storyProgressAnim]);

  useEffect(() => {
    if (!storyViewerVisible) return;
    const idx = activeStoryIndex ?? 0;
    const word = storyWords[idx];
    if (word?.id) {
      setStoryViewedMap(prev => (prev[word.id] ? prev : { ...prev, [word.id]: true }));
    }
  }, [storyViewerVisible, activeStoryIndex, storyWords]);

	  useEffect(() => {
	    if (!storyViewerVisible) return;
	    const count = storyWords.length;
	    if (!count) return;
	    let cancelled = false;

	    const idx = Math.max(0, Math.min(count - 1, activeStoryIndex ?? 0));
	    const word = storyWords[idx] || null;
	    const seed = buildStoryBgSeed(word) || String(word?.id || word?.text || idx);
	    const cacheKey = buildStoryBgCacheKey(seed);

	    const cached = storyBgCacheRef.current[cacheKey];
	    const fallbackEntry = cached || buildStoryBgEntry(word);
	    storyBgCacheRef.current[cacheKey] = fallbackEntry;
	    setStoryViewerBgEntry(fallbackEntry);

	    (async () => {
	      try {
	        const persisted = await getCachedStoryBg(word);
	        if (cancelled) return;

	        const base = persisted || fallbackEntry;
	        if (persisted) {
	          storyBgCacheRef.current[cacheKey] = persisted;
	          setStoryViewerBgEntry(persisted);
	        } else {
	          await setCachedStoryBg(word, fallbackEntry);
	        }

	        const current = storyBgCacheRef.current[cacheKey] || base;
	        if (!current.imageUrl && !current.imageRequested) {
	          const url = await getOrFetchStoryIllustrationUrl(word, cacheKey);
	          const updated: StoryBgCacheEntry = { ...current, imageUrl: url || null, imageRequested: true };
	          storyBgCacheRef.current[cacheKey] = updated;
	          if (!cancelled) {
	            try {
	              const liveIdx = Math.max(
	                0,
	                Math.min((storyWords.length || 1) - 1, storyIndexRef.current || 0),
	              );
	              const liveWord = storyWords[liveIdx];
	              const liveSeed = buildStoryBgSeed(liveWord) || String(liveWord?.id || liveWord?.text || liveIdx);
	              const liveKey = buildStoryBgCacheKey(liveSeed);
	              if (liveKey === cacheKey) setStoryViewerBgEntry(updated);
	            } catch {}
	          }
	          try {
	            await setCachedStoryBg(word, updated);
	          } catch {}
	        } else if (!current.imageUrl && current.imageRequested) {
	          if (__DEV__ && isStoryImageDebugEnabled()) {
	            console.log('[story:img] retry blocked (already requested)', { cacheKey, phrase: word?.text });
	          }
	        }

	        if (__DEV__ && isStoryImageDebugEnabled()) {
	          const active = storyBgCacheRef.current[cacheKey] || base;
	          console.log('[story:img]', {
	            tag: active.tag,
	            gradient: active.gradientIndex,
	            phrase: word?.text,
	            seed: active.seed,
	            cacheKey,
	            cacheHit: Boolean(persisted),
	            hasImage: Boolean(active.imageUrl),
	          });
	        }
	      } catch {}
	    })();

	    return () => {
	      cancelled = true;
	    };
	  }, [storyViewerVisible, activeStoryIndex, storyWords]);

  const onStoryViewerPress = useCallback((e: any) => {
    if (storyIgnorePressRef.current) return;
    const screenW = Dimensions.get('window').width || 1;
    const x = e?.nativeEvent?.locationX ?? screenW;
    if (x < screenW * 0.33) goToPrevStory();
    else goToNextStory();
  }, [goToNextStory, goToPrevStory]);

  const onStoryViewerLongPress = useCallback(() => {
    storyIgnorePressRef.current = true;
    pauseStoryAutoAdvance();
  }, [pauseStoryAutoAdvance]);

  const onStoryViewerPressOut = useCallback(() => {
    if (!storyIgnorePressRef.current) return;
    resumeStoryAutoAdvance();
    setTimeout(() => {
      storyIgnorePressRef.current = false;
    }, 0);
  }, [resumeStoryAutoAdvance]);

  // Show a once‑per‑day sign‑up prompt 2 minutes after app launch (only if not signed in)
  useEffect(() => {
    if (isPreview) return;
    let cancelled = false;
    let t: any;
    let unsub: any;
    const schedule = () => {
      // wait 2 minutes after launch completes
      const startTimer = () => {
        try { if (t) clearTimeout(t); } catch {}
        t = setTimeout(async () => {
          if (cancelled) return;
          if (showOnboarding) return; // don't interrupt onboarding
          const u = useAppStore.getState().user;
          if (u && (u as any)?.id) return; // already signed in
          try {
            const today = new Date().toISOString().slice(0,10);
            const key = '@engniter.nudge.signup.date';
            const last = await AsyncStorage.getItem(key);
            if (last !== today) {
              setShowSignupNudge(true);
              await AsyncStorage.setItem(key, today);
            }
          } catch {}
        }, 120000);
      };
      if (Launch.isDone()) startTimer();
      else unsub = Launch.onDone(startTimer);
    };
    // Only schedule if not signed in right now
    if (!(user && (user as any)?.id)) schedule();
    return () => {
      cancelled = true;
      try { if (t) clearTimeout(t); } catch {}
      try { unsub && unsub(); } catch {}
    };
  }, [isPreview, showOnboarding, user && (user as any)?.id]);

  // Show a once‑per‑day rating prompt 3 minutes after launch (don’t stack with sign‑up modal)
  useEffect(() => {
    if (isPreview) return;
    let cancelled = false;
    let t: any;
    let unsub: any;
    const schedule = () => {
      const startTimer = () => {
        try { if (t) clearTimeout(t); } catch {}
        t = setTimeout(async () => {
          if (cancelled) return;
          if (showOnboarding) return;
          if (showSignupNudge) return; // avoid stacking prompts
          try {
            const now = new Date();
            const monthKey = now.toISOString().slice(0,7); // YYYY-MM
            const key = '@engniter.nudge.rate.month';
            const last = await AsyncStorage.getItem(key);
            if (last !== monthKey) {
              setShowRateNudge(true);
              await AsyncStorage.setItem(key, monthKey);
            }
          } catch {}
        }, 180000);
      };
      if (Launch.isDone()) startTimer();
      else unsub = Launch.onDone(startTimer);
    };
    schedule();
    return () => {
      cancelled = true;
      try { if (t) clearTimeout(t); } catch {}
      try { unsub && unsub(); } catch {}
    };
  }, [isPreview, showOnboarding, showSignupNudge]);

  // Derive integer for count animation
  useEffect(() => {
    const id = countAnim.addListener(({ value }) => setDisplayCount(Math.round(value)));
    return () => { try { countAnim.removeListener(id); } catch {} };
  }, [countAnim]);

  // Decide whether to show a daily streak celebration when streak value is available
  useEffect(() => {
    (async () => {
      const streak = Number(userProgress?.streak || 0);
      if (!streak || streak <= 0) return;
      const todayKey = new Date().toISOString().slice(0,10);
      const shown = await AsyncStorage.getItem('@engniter.streak_celebrate_date');
      const lastValRaw = await AsyncStorage.getItem('@engniter.streak_celebrate_value');
      const lastVal = lastValRaw ? Number(lastValRaw) : 0;
      // Show if not shown today AND streak has advanced or we never stored it
      if (shown !== todayKey && streak >= Math.max(1, lastVal)) {
        setShowStreakCelebrate(true);
        countAnim.setValue(0);
        Animated.timing(countAnim, { toValue: streak, duration: 900, useNativeDriver: false }).start();
      }
    })();
  }, [userProgress?.streak]);

  const openMenu = () => {
    setMenuOpen(true);
    try {
      menuAnim.setValue(0);
      Animated.timing(menuAnim, { toValue: 1, duration: 180, useNativeDriver: true }).start();
    } catch {}
  };

  const closeMenu = () => {
    try {
      Animated.timing(menuAnim, { toValue: 0, duration: 140, useNativeDriver: true }).start(() => setMenuOpen(false));
    } catch {
      setMenuOpen(false);
    }
  };

  const handleQuizSession = useCallback(() => {
    if (storedLevel) {
      router.push(`/quiz/learn?level=${storedLevel}`);
    } else {
      router.push('/quiz/level-select');
    }
  }, [router, storedLevel]);

  const updateStoredLevel = async () => {
    const level = await AsyncStorage.getItem(SELECTED_LEVEL_KEY);
    if (level) setStoredLevel(level);
  };

  useEffect(() => {
    updateStoredLevel();
  }, []);

  // Listen for level selection events from placement/level-select screens
  useEffect(() => {
    const listener = DeviceEventEmitter.addListener('LEVEL_SELECTED', (level: string) => {
      if (level) setStoredLevel(level);
    });
    return () => listener.remove();
  }, []);

  // Organized sections with softer colors
  const accent = '#187486';
  /// Use theme background (light: #F8F9FB, dark: #1E1E1E)
  const background = theme === 'light' ? '#F8F9FB' : '#1E1E1E';
  const homeIcons = {
    vault: require('../assets/homepageicons/11.png'),
    quiz: require('../assets/homepageicons/12.png'),
    story: require('../assets/homepageicons/13.png'),
    ielts: require('../assets/homepageicons/14.png'),
    account: require('../assets/homepageicons/15.png'),
  } as const;

  const navItems = useMemo(() => [
    {
      key: 'vault',
      title: 'Vault',
      icon: homeIcons.vault,
      onPress: () => router.push('/vault'),
    },
    {
      key: 'quiz',
      title: 'Quiz',
      icon: homeIcons.quiz,
      onPress: handleQuizSession,
    },
    {
      key: 'story',
      title: 'Story',
      icon: homeIcons.story,
      onPress: () => router.push('/story/StoryExercise'),
    },
    {
      key: 'ielts',
      title: 'IELTS',
      icon: homeIcons.ielts,
      onPress: () => router.push('/ielts'),
    },
    {
      key: 'account',
      title: 'Account',
      icon: homeIcons.account,
      onPress: () => router.push('/profile'),
    },
  ], [handleQuizSession, router]);

  const [activeNav, setActiveNav] = useState<string>('quiz');


  const sections = useMemo(() => [
    {
      title: 'Learning Tools',
      items: [
        {
          title: 'Vault',
          subtitle: 'Manage your vocabulary',
          icon: homeIcons.vault,
          color: accent,
          onPress: () => router.push('/vault'),
        },
        {
          title: 'Quiz Session',
          subtitle: '5-word practice session',
          icon: homeIcons.quiz,
          color: accent,
          onPress: handleQuizSession,
        },
        {
          title: 'Story Exercise',
          subtitle: 'Fill-in-the-blanks with pill UI',
          icon: homeIcons.story,
          color: accent,
          onPress: () => router.push('/story/StoryExercise'),
        },
        {
          title: 'IELTS',
          subtitle: 'Writing, Reading, Vocabulary',
          icon: homeIcons.ielts,
          color: accent,
          onPress: () => router.push('/ielts'),
        },
      ],
    },
    {
      title: 'Progress',
      items: [
        {
          title: 'Journal',
          subtitle: 'Track your learning journey',
          icon: homeIcons.account,
          color: accent,
          onPress: () => router.push('/journal'),
        },
        {
          title: 'Analytics',
          subtitle: 'View your progress',
          icon: homeIcons.account,
          color: accent,
          onPress: () => router.push('/stats'),
        },
      ],
    },
    {
      title: 'Account',
      items: [
        {
          title: 'Profile',
          subtitle: 'Manage your account',
          icon: homeIcons.account,
          color: accent,
          onPress: () => router.push('/profile'),
        },
      ],
    },
  ], [accent, handleQuizSession, homeIcons.account, homeIcons.ielts, homeIcons.quiz, homeIcons.story, homeIcons.vault, router]);

  // No PNG prefetch — icons are Lottie.

  // Run Lottie icons only once per app session, right after launch overlay completes
  const [playIcons, setPlayIcons] = useState<boolean>(!(globalThis as any).__HOME_ICON_ANIMS_RAN);
  useEffect(() => {
    if ((globalThis as any).__HOME_ICON_ANIMS_RAN) {
      setPlayIcons(false);
      return;
    }
    const start = () => {
      (globalThis as any).__HOME_ICON_ANIMS_RAN = true;
      setPlayIcons(true);
    };
    if (Launch.isDone()) {
      start();
      return;
    }
    const unsub = Launch.onDone(start);
    return () => { try { unsub(); } catch {} };
  }, []);

  // Track per-icon finish to swap to static PNG afterward in this mount
  const [iconDone, setIconDone] = useState<Record<string, boolean>>({});
  const onIconFinish = (key: string) => {
    setIconDone(prev => (prev[key] ? prev : { ...prev, [key]: true }));
  };

  const [scrolled, setScrolled] = useState(false);
  const [headerHeight, setHeaderHeight] = useState(0);
  const isLight = theme === 'light';
  const primaryArticle = carouselNews[0] || null;
  const modalArticle = newsModalArticle || primaryArticle || null;
  const sheetArticle = modalArticle || (displayList && displayList[0]) || null;
  const normalizedStatus = (newsStatus || '').trim();
  const displayNewsStatus =
    normalizedStatus && normalizedStatus.toLowerCase() !== 'ok' ? normalizedStatus : '';
  const heroTag = (primaryArticle?.tag || (normalizedStatus.toLowerCase().includes('live') ? 'Live' : 'Feature')).toUpperCase();
  const storyProgressWidth = useMemo(
    () => storyProgressAnim.interpolate({ inputRange: [0, 1], outputRange: ['0%', '100%'] }),
    [storyProgressAnim]
  );
  const currentStory = (activeStoryIndex != null ? storyWords[activeStoryIndex] : storyWords[0]) || null;

  const saveWordToVault = useCallback(
    async (word: string, definition?: string) => {
      const cleanedWord = (word || '').trim();
      if (!cleanedWord) return;
      const cleanedDefinition = (definition || '').trim() || cleanedWord;

      try {
        let userId: string | null = null;
        try {
          const { data } = await supabase.auth.getSession();
          userId = data?.session?.user?.id ?? null;
        } catch {
          userId = null;
        }

        if (!userId) {
          Alert.alert('Sign in required', 'Sign in to save words to your Vault.');
          return;
        }

        // Prevent duplicates per-user in Supabase
        let alreadySaved = false;
        try {
          const { data: existing, error: existingError } = await supabase
            .from('user_words')
            .select('id')
            .eq('user_id', userId)
            .ilike('word', cleanedWord)
            .maybeSingle();
          if (!existingError && existing) {
            alreadySaved = true;
          }
        } catch {
          // If duplicate check fails, continue with local save and best-effort remote insert
        }

        if (alreadySaved) {
          Alert.alert('Already saved', 'This word is already in your Vault.');
          return;
        }

        // Insert into Supabase (best-effort)
        let remoteOk = true;
        try {
          const { error: insertError } = await supabase.from('user_words').insert({
            user_id: userId,
            word: cleanedWord,
            definition: cleanedDefinition,
            source: 'news',
            created_at: new Date().toISOString(),
          });
          if (insertError) {
            remoteOk = false;
            console.warn('Failed to insert user_words row:', insertError);
          }
        } catch {
          remoteOk = false;
          console.warn('Failed to insert user_words row (exception)');
        }

        // Also store in local Vault so the word appears in the app immediately
        let localOk = false;
        try {
          const folders = getVaultFolders?.() || [];
          const NEWS_FOLDER_TITLE = 'News Vocabulary';
          const existing = folders.find(f => /news\s+vocab/i.test(f.title));
          let folderId = existing?.id;

          if (!folderId) {
            try {
              const created = await createVaultFolder?.(NEWS_FOLDER_TITLE);
              folderId = created?.id || folders[0]?.id;
            } catch (e) {
              console.warn('Failed to create News Vocabulary folder:', e);
              folderId = folders[0]?.id;
            }
          }

          await addVaultWord?.({
            word: cleanedWord,
            definition: cleanedDefinition,
            example: cleanedDefinition,
            folderId,
            source: 'news',
          } as any);
          localOk = true;
        } catch (e) {
          console.warn('Failed to save word to local vault:', e);
        }

        if (localOk) {
          Alert.alert('Saved to Vault!', `"${cleanedWord}" has been saved.`);
        } else {
          Alert.alert('Something went wrong', 'Something went wrong, try again.');
        }
      } catch (error) {
        console.error('saveWordToVault failed:', error);
        Alert.alert('Something went wrong', 'Something went wrong, try again.');
      }
    },
    [addVaultWord, getVaultFolders, createVaultFolder]
  );

  const renderHighlightedText = (
    text: string,
    vocabList: { word: string; definition?: string }[],
    props: any,
    highlightStyle?: any,
    onWordPress?: (word: string, definition?: string) => void
  ) => {
    const parts = buildHighlightParts(text, vocabList);
    return (
      <Text {...props} allowFontScaling={false}>
        {parts.map(part =>
          part.highlighted ? (
            <Text
              key={part.key}
              style={[{ fontWeight: '800', color: '#F8B070' }, highlightStyle]}
              onPress={() => onWordPress?.(part.text, part.definition)}
            >
              {part.text}
            </Text>
          ) : (
            <Text key={part.key}>{part.text}</Text>
          )
        )}
      </Text>
    );
  };

  const openNewsModalDirect = (article: NewsItem) => {
    setNewsModalArticle(article);
    setNewsModalVisible(true);
    newsModalAnim.setValue(0);
    newsDrag.setValue(0);
    Animated.timing(newsModalAnim, { toValue: 1, duration: 220, useNativeDriver: true }).start();

    const summaryWords = wordCount(article.summary || '');
    if (summaryWords < 40) {
      (async () => {
        try {
          const enriched = await enrichArticleWithAi(article);
          setNewsModalArticle(enriched);
          setNewsOverrideList(prev =>
            prev ? prev.map(a => (a.title === article.title ? enriched : a)) : prev
          );
          setNewsList(prev =>
            prev ? prev.map(a => (a.title === article.title ? enriched : a)) : prev
          );
        } catch {
          // best-effort enrichment; ignore failures
        }
      })();
    }
  };

  // Get language display name
  const getLanguageName = (code: string): string => {
    const names: Record<string, string> = {
      es: 'Spanish', fr: 'French', de: 'German', it: 'Italian', pt: 'Portuguese',
      ru: 'Russian', zh: 'Chinese', ja: 'Japanese', ko: 'Korean', ar: 'Arabic',
      tr: 'Turkish', uz: 'Uzbek', hi: 'Hindi', bn: 'Bengali', vi: 'Vietnamese',
      th: 'Thai', pl: 'Polish', nl: 'Dutch', sv: 'Swedish', cs: 'Czech',
      el: 'Greek', he: 'Hebrew', id: 'Indonesian', ms: 'Malay', ro: 'Romanian',
      uk: 'Ukrainian', hu: 'Hungarian', fi: 'Finnish', da: 'Danish', no: 'Norwegian',
      ak: 'Akan', tw: 'Twi', ee: 'Ewe', ha: 'Hausa', yo: 'Yoruba', ig: 'Igbo',
      sw: 'Swahili', am: 'Amharic', zu: 'Zulu', xh: 'Xhosa', af: 'Afrikaans',
    };
    return names[code] || code;
  };

  // Enrich vocab with examples and synonyms for preview
  const enrichVocabForPreview = async (
    vocab: { word: string; definition: string; translation?: string }[],
    targetLang: string
  ): Promise<{ word: string; definition: string; translation?: string; example?: string; synonyms?: string }[]> => {
    const langName = getLanguageName(targetLang);

    try {
      const enriched = await Promise.all(
        vocab.map(async (item) => {
          if (!item.word) return item;
          try {
            // Get translation
            const t = await TranslationService.translate(item.word, targetLang);
            const translation = t?.translation?.trim() || '';

            // Generate example and synonyms using AI in one call
            let example = '';
            let synonyms = '';

            if (AI_PROXY_URL) {
              try {
                const response = await aiProxyService.complete({
                  model: 'gpt-4o-mini',
                  messages: [
                    {
                      role: 'user',
                      content: `For the English word "${item.word}" (meaning: ${item.definition}):

1. Give me 2 English synonyms (just the words, comma-separated)
2. Write a simple example sentence in ${langName} that uses the ${langName} equivalent of this word

Format your response EXACTLY like this:
SYNONYMS: word1, word2
EXAMPLE: [sentence in ${langName}]`
                    }
                  ],
                  maxTokens: 150,
                });

                const content = response?.content?.trim() || '';

                // Parse the response
                const synonymsMatch = content.match(/SYNONYMS:\s*(.+?)(?:\n|$)/i);
                const exampleMatch = content.match(/EXAMPLE:\s*(.+?)(?:\n|$)/i);

                if (synonymsMatch) synonyms = synonymsMatch[1].trim();
                if (exampleMatch) example = exampleMatch[1].trim();
              } catch (e) {
                console.log('AI enrichment error:', e);
              }
            }

            return { ...item, translation, example, synonyms };
          } catch {
            return item;
          }
        })
      );
      return enriched;
    } catch {
      return vocab;
    }
  };

  // Open article directly (vocab preview removed)
  const openNewsModal = async (article: NewsItem) => {
    openNewsModalDirect(article);
  };

  const vocabPreviewNext = () => {
    const vocabWords = vocabPreviewArticle?.vocab?.slice(0, 5) || [];
    if (vocabPreviewIndex < vocabWords.length - 1) {
      // Animate out
      Animated.timing(vocabCardAnim, { toValue: 1, duration: 150, useNativeDriver: true }).start(() => {
        setVocabPreviewIndex(prev => prev + 1);
        setVocabPreviewFlipped(false);
        vocabCardAnim.setValue(0);
      });
    } else {
      // All words reviewed, open article
      const articleToOpen = vocabPreviewArticle;
      setVocabPreviewVisible(false);
      setVocabPreviewArticle(null);
      setVocabPreviewIndex(0);
      setVocabPreviewFlipped(false);
      setVocabPreviewLoading(false);
      if (articleToOpen) {
        setTimeout(() => openNewsModalDirect(articleToOpen), 100);
      }
    }
  };

  const vocabPreviewSkip = () => {
    const articleToOpen = vocabPreviewArticle;
    setVocabPreviewVisible(false);
    setVocabPreviewArticle(null);
    setVocabPreviewIndex(0);
    setVocabPreviewFlipped(false);
    setVocabPreviewLoading(false);
    if (articleToOpen) {
      setTimeout(() => openNewsModalDirect(articleToOpen), 100);
    }
  };

  const vocabPreviewFlip = () => {
    setVocabPreviewFlipped(prev => !prev);
  };

  const closeNewsModal = () => {
    setArticleSettingsOpen(false);
    Animated.timing(newsModalAnim, { toValue: 0, duration: 180, useNativeDriver: true }).start(() => {
      newsDrag.setValue(0);
      setNewsModalVisible(false);
      setModalHighlightParts(null);
      // Reset quiz state
      setQuizStarted(false);
      setQuizCurrentQ(0);
      setQuizAnswers([]);
      setQuizShowResult(false);
      // Reset vocab preview state
      setVocabPreviewArticle(null);
      setVocabPreviewIndex(0);
      setVocabPreviewFlipped(false);
      setVocabPreviewLoading(false);
    });
  };
  // Keep ref updated for PanResponder
  closeNewsModalRef.current = closeNewsModal;

  // Quiz helper functions
  const resetQuizAnims = () => {
    quizOptionAnims.forEach(a => a.setValue(0));
    quizCorrectAnim.setValue(0);
    quizWrongAnim.setValue(0);
  };

  const startQuiz = () => {
    setQuizStarted(true);
    setQuizCurrentQ(0);
    setQuizAnswers([]);
    setQuizShowResult(false);
    resetQuizAnims();
    // Stagger animate options in
    quizOptionAnims.forEach((anim, i) => {
      setTimeout(() => {
        Animated.spring(anim, { toValue: 1, useNativeDriver: true, friction: 6 }).start();
      }, i * 100);
    });
    Animated.timing(quizProgressAnim, { toValue: 1 / (newsModalArticle?.quiz?.length || 3), duration: 300, useNativeDriver: false }).start();
  };

  const handleQuizAnswer = (selectedIndex: number) => {
    const quiz = newsModalArticle?.quiz;
    if (!quiz || quizCurrentQ >= quiz.length) return;

    const currentQuestion = quiz[quizCurrentQ];
    const isCorrect = selectedIndex === currentQuestion.correctIndex;

    // Animate feedback
    if (isCorrect) {
      Animated.sequence([
        Animated.timing(quizCorrectAnim, { toValue: 1, duration: 150, useNativeDriver: true }),
        Animated.timing(quizCorrectAnim, { toValue: 0, duration: 150, useNativeDriver: true }),
      ]).start();
    } else {
      Animated.sequence([
        Animated.timing(quizWrongAnim, { toValue: 1, duration: 100, useNativeDriver: true }),
        Animated.timing(quizWrongAnim, { toValue: -1, duration: 100, useNativeDriver: true }),
        Animated.timing(quizWrongAnim, { toValue: 0, duration: 100, useNativeDriver: true }),
      ]).start();
    }

    const newAnswers = [...quizAnswers, selectedIndex];
    setQuizAnswers(newAnswers);

    // Move to next question or show results
    setTimeout(() => {
      if (quizCurrentQ + 1 >= quiz.length) {
        setQuizShowResult(true);
        // Confetti animation for good score
        const correctCount = newAnswers.filter((ans, idx) => ans === quiz[idx].correctIndex).length;
        if (correctCount >= quiz.length - 1) {
          Animated.loop(
            Animated.sequence([
              Animated.timing(quizConfettiAnim, { toValue: 1, duration: 500, useNativeDriver: true }),
              Animated.timing(quizConfettiAnim, { toValue: 0, duration: 500, useNativeDriver: true }),
            ]),
            { iterations: 3 }
          ).start();
        }
      } else {
        setQuizCurrentQ(q => q + 1);
        resetQuizAnims();
        // Animate new options in
        quizOptionAnims.forEach((anim, i) => {
          setTimeout(() => {
            Animated.spring(anim, { toValue: 1, useNativeDriver: true, friction: 6 }).start();
          }, i * 80);
        });
        // Update progress bar
        Animated.timing(quizProgressAnim, { toValue: (quizCurrentQ + 2) / quiz.length, duration: 300, useNativeDriver: false }).start();
      }
    }, 600);
  };

  const getQuizScore = () => {
    const quiz = newsModalArticle?.quiz || [];
    return quizAnswers.filter((ans, idx) => ans === quiz[idx]?.correctIndex).length;
  };

  useEffect(() => {
    if (!newsModalArticle) {
      setModalHighlightParts(null);
      return;
    }
    try {
      const parts = buildHighlightParts(newsModalArticle.summary, newsModalArticle.vocab || []);
      setModalHighlightParts(parts);
    } catch (e) {
      if (__DEV__) console.warn('Failed to build highlight parts for news modal', e);
      setModalHighlightParts(null);
    }
  }, [newsModalArticle]);

  // If the modal is opened before an article is set, fall back to the first available article.
  useEffect(() => {
    if (newsModalVisible && !newsModalArticle && primaryArticle) {
      setNewsModalArticle(primaryArticle);
    }
  }, [newsModalVisible, newsModalArticle, primaryArticle]);

  return (
    <SafeAreaView edges={['left','right']} style={[styles.container, { backgroundColor: background }] }>
      {/* Dotted background pattern */}
      <View style={styles.dotContainer} pointerEvents="none">
        {Array.from({ length: 40 }).map((_, rowIndex) => (
          <View key={rowIndex} style={styles.dotRow}>
            {Array.from({ length: 15 }).map((_, colIndex) => (
              <View
                key={colIndex}
                style={[
                  styles.dot,
                  { backgroundColor: theme === 'light' ? '#D4D4D4' : '#333333' }
                ]}
              />
            ))}
          </View>
        ))}
      </View>

      {/* Fixed top bar; background becomes translucent only after scrolling */}
      <TopStatusPanel
        floating
        includeTopInset
        scrolled={scrolled}
        onHeight={setHeaderHeight}
        isPreview={isPreview}
      />

      <ScrollView
        style={[styles.scrollView, { backgroundColor: 'transparent' }]}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[
          styles.scrollContent,
          { paddingTop: Math.max(0, (headerHeight ? headerHeight + 6 : insets.top + 48)) },
        ]}
        // Avoid background flicker during navigation/transitions
        removeClippedSubviews={false}
        onScroll={({ nativeEvent }) => {
          const y = nativeEvent.contentOffset?.y || 0;
          const next = y > 2;
          if (next !== scrolled) setScrolled(next);
        }}
        scrollEventThrottle={16}
      >
        {/* Header is fixed above — list starts below */}

	        {!!storyWords.length && (
	          <View style={[
	            styles.storyWordsCard,
	            theme === 'light' && styles.storyWordsCardLight,
	            storyWordsDoneForToday && { paddingTop: 40 },
	          ]}>
	            <View style={styles.missionHeader}>
	              <View style={{ flex: 1 }}>
	                <Text style={[styles.missionTitle, theme === 'light' && styles.missionTitleLight]}>
	                  Story Words
	                </Text>
	                <Text style={[styles.missionSubtitle, theme === 'light' && styles.missionSubtitleLight]}>
	                  {storyWordsDoneForToday ? 'Done for today.' : '5 words · 5 questions'}
	                </Text>
	                <View style={styles.missionPillsRow}>
                  <View style={[styles.timePill, theme === 'light' && styles.timePillLight]}>
                    <Clock size={14} color={theme === 'light' ? '#0D3B4A' : '#4ED9CB'} />
                    <Text style={[styles.timePillText, theme === 'light' && styles.timePillTextLight]}>≈ 3 min</Text>
                  </View>
                  {storyWordsDoneForToday ? (
                    <View
                      style={[
                        styles.streakPill,
                        { backgroundColor: 'rgba(78,217,203,0.18)' },
                      ]}
                    >
                      <Check size={12} color="#4ED9CB" strokeWidth={3} />
                      <Text style={[styles.streakPillText, { color: '#4ED9CB', marginLeft: 4 }]}>Completed</Text>
                    </View>
                  ) : (
                    <View
                      style={[
                        styles.streakPill,
                        {
                          backgroundColor:
                            theme === 'light' ? 'rgba(242,94,134,0.16)' : 'rgba(242,94,134,0.12)',
                        },
                      ]}
                    >
                      <Text style={[styles.streakPillText, { color: '#F25E86' }]}>Daily exercise</Text>
                    </View>
                  )}
                </View>
              </View>
		              {storyWordsDoneForToday && (
		                <LottieView
		                  source={require('../assets/lottie/storywords/donefortoday.json')}
		                  autoPlay
		                  loop={false}
		                  style={{ position: 'absolute', right: -20, top: -40, width: 150, height: 110, transform: [{ scaleX: -1 }] }}
		                />
	              )}
	            </View>

	            {!storyWordsDoneForToday && (
	              <View style={styles.missionProgressRow}>
	                <Text style={[styles.missionProgressText, theme === 'light' && styles.missionProgressTextLight]}>
	                  {`${storyViewedCount}/${storyWords.length} viewed`}
	                </Text>
                <View style={[styles.missionProgressBar, theme === 'light' && styles.missionProgressBarLight]}>
                  <View style={[styles.missionProgressFill, { width: `${Math.round(storyProgressRatio * 100)}%` }]} />
                </View>
              </View>
            )}

            <View style={styles.missionActions}>
              <TouchableOpacity
                activeOpacity={0.9}
                style={[styles.storyWordsCta, { alignItems: 'center' }]}
                onPress={() => openStoryViewer(storyStartIndex)}
              >
                <Text style={styles.storyWordsCtaText}>{storyCtaLabel}</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* Synonym Match Exercise */}
        {!synonymMatchDone && !synonymMatchLoading && synonymMatchWords.length > 0 && (
          <View style={[styles.synonymMatchCard, theme === 'light' && styles.synonymMatchCardLight]}>
            <View style={styles.synonymMatchHeader}>
              <Text style={[styles.synonymMatchTitle, theme === 'light' && styles.synonymMatchTitleLight]}>
                Match Synonyms
              </Text>
              <Text style={[styles.synonymMatchSubtitle, theme === 'light' && styles.synonymMatchSubtitleLight]}>
                Tap cards to match words with their synonyms
              </Text>
            </View>
            <SynonymMatch
              words={synonymMatchWords}
              isDarkMode={theme === 'dark'}
              onComplete={async (score, total) => {
                setSynonymMatchScore({ score, total });
                setSynonymMatchDone(true);
                try {
                  await AsyncStorage.setItem(synonymMatchDoneKey, '1');
                } catch {}
              }}
            />
          </View>
        )}

        {/* Synonym Match Loading */}
        {!synonymMatchDone && synonymMatchLoading && (
          <View style={[styles.synonymMatchCard, theme === 'light' && styles.synonymMatchCardLight]}>
            <View style={styles.synonymMatchHeader}>
              <Text style={[styles.synonymMatchTitle, theme === 'light' && styles.synonymMatchTitleLight]}>
                Match Synonyms
              </Text>
              <Text style={[styles.synonymMatchSubtitle, theme === 'light' && styles.synonymMatchSubtitleLight]}>
                Loading words from your vault...
              </Text>
            </View>
          </View>
        )}

        {/* Synonym Match Completed */}
        {synonymMatchDone && synonymMatchScore && (
          <View style={[styles.synonymMatchDoneCard, theme === 'light' && styles.synonymMatchDoneCardLight]}>
            <Check size={20} color="#10B981" />
            <Text style={[styles.synonymMatchDoneText, theme === 'light' && styles.synonymMatchDoneTextLight]}>
              Synonym Match Complete! Score: {synonymMatchScore.score}/{synonymMatchScore.total}
            </Text>
          </View>
        )}

        {/* Daily News */}
        <View
          style={[styles.newsCard, theme === 'light' && styles.newsCardLight]}
          onLayout={e => {
            const w = e.nativeEvent.layout.width || 0;
            if (!w) return;
            if (Math.abs(w - newsCardWidth) > 0.5) setNewsCardWidth(w);
          }}
        >
	          <View style={{ paddingHorizontal: NEWS_CAROUSEL_HORIZONTAL_PADDING }}>
	            <View style={styles.newsHeaderRow}>
	              <View style={{ flex: 1 }}>
	                <Text style={[styles.newsLabel, theme === 'light' && styles.newsLabelLight]}>Daily Articles</Text>
	                {displayNewsStatus ? (
	                  <Text style={[styles.newsStatus, theme === 'light' && styles.newsStatusLight]}>
	                    {displayNewsStatus}
	                  </Text>
	                ) : null}
	              </View>
		            </View>
		          </View>

		          {/* Magazine-style article layout */}

	          {carouselNews.length > 0 && (
            <View style={{ marginTop: 12, paddingHorizontal: 8 }}>
              {/* Featured Hero Article - Compact overlay style */}
              {carouselNews[0] && (
                <TouchableOpacity
                  activeOpacity={0.9}
                  onPress={() => openNewsModal(carouselNews[0])}
                  style={{ marginBottom: 12 }}
                >
                  <View
                    style={[
                      styles.magazineHeroCard,
                      theme === 'light' && styles.magazineHeroCardLight,
                    ]}
                  >
                    <Image
                      source={{ uri: carouselNews[0].image || fallbackNewsImage }}
                      style={styles.magazineHeroImage}
                    />
                    {/* Dark gradient overlay for text readability */}
                    <View style={styles.magazineHeroGradientOverlay} />
                    {/* Content positioned at bottom of image */}
                    <View style={styles.magazineHeroOverlayContent}>
                      <View style={[styles.magazineTag, { marginBottom: 8, backgroundColor: getTagColor(carouselNews[0].tag).bg }]}>
                        <Text style={[styles.magazineTagText, { color: getTagColor(carouselNews[0].tag).text }]}>
                          {(carouselNews[0].tag || 'Featured').toUpperCase()}
                        </Text>
                      </View>
                      <Text
                        style={[
                          styles.magazineHeroTitle,
                          { color: '#FFFFFF' },
                          newsFontScale === 2 && { fontSize: 20 },
                          newsFontScale === 0 && { fontSize: 16 },
                        ]}
                        numberOfLines={2}
                      >
                        {carouselNews[0].hookTitle || carouselNews[0].title}
                      </Text>
                      {!!carouselNews[0].vocab?.length && (
                        <View style={styles.magazineVocabRow}>
                          {carouselNews[0].vocab.slice(0, 3).map((v, i) => (
                            <View key={`hero-vocab-${i}`} style={[styles.magazineVocabChip, { backgroundColor: 'rgba(255,255,255,0.2)' }]}>
                              <Text style={[styles.magazineVocabText, { color: '#FFFFFF' }]}>{v.word}</Text>
                            </View>
                          ))}
                        </View>
                      )}
                    </View>
                  </View>
                </TouchableOpacity>
              )}

              {/* Two Medium Cards Side by Side */}
              {carouselNews.length > 1 && (
                <View style={styles.magazineDualRow}>
                  {carouselNews.slice(1, 3).map((item, idx) => {
                    const palette = getCardColors(item.tag, item.title, idx + 1);
                    const accentColor = theme === 'light' ? palette.light.inner[0] : palette.dark.inner[0];
                    return (
                      <TouchableOpacity
                        key={`dual-${idx}`}
                        activeOpacity={0.9}
                        onPress={() => openNewsModal(item)}
                        style={[styles.magazineDualCardWrap, {
                          shadowColor: '#000',
                          shadowOpacity: 0.08,
                          shadowRadius: 8,
                          shadowOffset: { width: 0, height: 2 },
                          elevation: 3,
                        }]}
                      >
                        <View
                          style={[
                            styles.magazineDualCard,
                            theme === 'light' && styles.magazineDualCardLight,
                            { borderBottomWidth: 4, borderBottomColor: accentColor },
                          ]}
                        >
                          {/* Image at top */}
                          <View style={{ padding: 10, paddingBottom: 0 }}>
                            <Image
                              source={{ uri: item.image || fallbackNewsImage }}
                              style={{ width: '100%', height: 110, borderRadius: 10 }}
                            />
                          </View>
                          <View style={styles.magazineDualContent}>
                            <View style={[styles.magazineSmallTag, { backgroundColor: getTagColor(item.tag).bg }]}>
                              <Text style={[styles.magazineSmallTagText, { color: getTagColor(item.tag).text }]}>
                                {item.tag || 'Article'}
                              </Text>
                            </View>
                            <Text
                              style={[
                                styles.magazineDualTitle,
                                { color: theme === 'light' ? '#111827' : '#F3F4F6' },
                                newsFontScale === 2 && { fontSize: 15 },
                                newsFontScale === 0 && { fontSize: 12 },
                              ]}
                              numberOfLines={2}
                            >
                              {item.hookTitle || item.title}
                            </Text>
                            {!!item.vocab?.length && (
                              <Text style={[styles.magazineDualVocab, { color: theme === 'light' ? '#6B7280' : '#9CA3AF' }]}>
                                {item.vocab.slice(0, 2).map(v => v.word).join(' · ')}
                              </Text>
                            )}
                          </View>
                        </View>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              )}

              {/* Compact List of Remaining Articles */}
              {carouselNews.length > 3 && (
                <View style={{ marginTop: 12 }}>
                  {carouselNews.slice(3, 8).map((item, idx) => {
                    const palette = getCardColors(item.tag, item.title, idx + 3);
                    const accentColor = theme === 'light' ? palette.light.inner[0] : palette.dark.inner[0];
                    return (
                      <TouchableOpacity
                        key={`list-${idx}`}
                        activeOpacity={0.9}
                        onPress={() => openNewsModal(item)}
                        style={{
                          marginBottom: 10,
                          shadowColor: '#000',
                          shadowOpacity: 0.06,
                          shadowRadius: 6,
                          shadowOffset: { width: 0, height: 2 },
                          elevation: 2,
                        }}
                      >
                        <View
                          style={[
                            styles.magazineListCard,
                            theme === 'light' && styles.magazineListCardLight,
                            { borderLeftWidth: 4, borderLeftColor: accentColor },
                          ]}
                        >
                          <View style={styles.magazineListContent}>
                            <View style={[styles.magazineSmallTag, { backgroundColor: getTagColor(item.tag).bg, alignSelf: 'flex-start' }]}>
                              <Text style={[styles.magazineSmallTagText, { color: getTagColor(item.tag).text }]}>
                                {item.tag || 'Article'}
                              </Text>
                            </View>
                            <Text
                              style={[
                                styles.magazineListTitle,
                                { color: theme === 'light' ? '#111827' : '#F3F4F6' },
                                newsFontScale === 2 && { fontSize: 16 },
                                newsFontScale === 0 && { fontSize: 13 },
                              ]}
                              numberOfLines={2}
                            >
                              {item.hookTitle || item.title}
                            </Text>
                            {!!item.vocab?.length && (
                              <View style={{ flexDirection: 'row', gap: 6, marginTop: 4 }}>
                                {item.vocab.slice(0, 2).map((v, vi) => (
                                  <Text key={`list-vocab-${vi}`} style={[styles.magazineListVocab, { color: theme === 'light' ? '#6B7280' : '#9CA3AF' }]}>
                                    {v.word}
                                  </Text>
                                ))}
                              </View>
                            )}
                          </View>
                          {/* Image on the right */}
                          <Image
                            source={{ uri: item.image || fallbackNewsImage }}
                            style={styles.magazineListImage}
                          />
                        </View>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              )}

            </View>
          )}
        </View>

	        <Modal
	          visible={storyViewerVisible}
	          transparent
	          statusBarTranslucent
          presentationStyle="overFullScreen"
          animationType="fade"
          onRequestClose={closeStoryViewer}
        >
          <View style={styles.storyViewerOverlay}>
            {!storyExerciseMode ? (
              <Pressable
                style={styles.storyViewerPressable}
                onPress={onStoryViewerPress}
                onLongPress={onStoryViewerLongPress}
                onPressOut={onStoryViewerPressOut}
                delayLongPress={220}
              >
                  <StoryBackground entry={storyViewerBgEntry}>
                    <View style={styles.storyViewerShade} />
                    <View style={[styles.storyViewerTop, { paddingTop: insets.top + 10 }]}>
                      <View style={styles.storyViewerProgressRow}>
                      {storyWords.map((w, i) => {
                        const isDone = activeStoryIndex != null && i < activeStoryIndex;
                        const isActive = activeStoryIndex === i;
                        const width = isDone ? '100%' : isActive ? storyProgressWidth : '0%';
                        return (
                          <View key={w.id || `bar-${i}`} style={styles.storyViewerProgressTrack}>
                            <Animated.View style={[styles.storyViewerProgressFill, { width }]} />
                          </View>
                        );
                      })}
                    </View>
                    <TouchableOpacity
                      onPress={closeStoryViewer}
                      style={[styles.storyViewerCloseBtn, { top: insets.top + 6 }]}
                      hitSlop={{ top: 10, right: 10, bottom: 10, left: 10 }}
                    >
                      <Text style={styles.storyViewerCloseText}>×</Text>
                    </TouchableOpacity>
                  </View>

                  <View style={[styles.storyViewerBottom, { paddingBottom: insets.bottom + 28 }]}>
                    {currentStory && (
                      <View style={styles.storyViewerCard}>
                        <Text style={styles.storyViewerWord}>{currentStory.text}</Text>
                        <Text style={styles.storyViewerDefinition}>{currentStory.definition}</Text>
                        {!!currentStory.exampleSentence && (
                          <Text style={styles.storyViewerExample}>{currentStory.exampleSentence}</Text>
                        )}
                      </View>
                    )}
                    <Text style={styles.storyViewerHint}>
                      Tap right to continue · Tap left to go back · Hold to pause
                    </Text>
                  </View>
                  </StoryBackground>
              </Pressable>
            ) : (
              /* Fill-in-Blank Exercise UI */
              (() => {
                const totalQuestions = storyWords.length;
                const isComplete = exerciseQuestionIndex >= totalQuestions;
                const currentWord = storyWords[exerciseQuestionIndex];
                const displayQuestionNumber = Math.min(exerciseQuestionIndex + 1, totalQuestions || 1);

                // Generate sentence with blank - handles verb conjugations
                const getSentenceWithBlank = (word: MissionWord) => {
                  const example = word?.exampleSentence || '';
                  const phrase = word?.text || '';
                  if (!example || !phrase) return '______';

                  // Build flexible regex that handles verb conjugations
                  // Split phrase into words
                  const words = phrase.split(/\s+/);
                  if (words.length === 0) return example;

                  // For phrasal verbs like "miss the bus", create pattern that matches:
                  // "miss/missed/misses/missing the bus"
                  const firstWord = words[0];
                  const restOfPhrase = words.slice(1).join('\\s+');

                  // Create verb variations pattern
                  const verbBase = firstWord.replace(/(e)?$/, ''); // Remove trailing 'e' for base
                  const verbPattern = `${firstWord}|${verbBase}ed|${verbBase}s|${verbBase}es|${verbBase}ing|${firstWord}ed|${firstWord}s|${firstWord}ing`;

                  // Build full pattern
                  const fullPattern = restOfPhrase
                    ? `(${verbPattern})\\s+${restOfPhrase}`
                    : `(${verbPattern})`;

                  try {
                    const regex = new RegExp(fullPattern, 'gi');
                    const result = example.replace(regex, '______');
                    // If no replacement was made, try a simpler approach
                    if (result === example) {
                      // Try matching just the key words
                      const simplePattern = words.map(w => {
                        const base = w.replace(/(e)?$/, '');
                        return `${w}|${base}ed|${base}s|${base}es|${base}ing|${w}ed|${w}s|${w}ing`;
                      }).join('\\s+');
                      const simpleRegex = new RegExp(simplePattern, 'gi');
                      return example.replace(simpleRegex, '______');
                    }
                    return result;
                  } catch {
                    // Fallback: simple replacement
                    const escaped = phrase.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
                    return example.replace(new RegExp(escaped, 'gi'), '______');
                  }
                };

                // Shuffle array helper with better randomization
                const shuffleArray = <T,>(arr: T[], seed: number): T[] => {
                  const result = [...arr];
                  for (let i = result.length - 1; i > 0; i--) {
                    const j = Math.floor(Math.abs(Math.sin(seed * (i + 1) * 9301 + 49297) % 233280) / 233280 * (i + 1));
                    [result[i], result[j]] = [result[j], result[i]];
                  }
                  return result;
                };

                // Get answer options (all 5 words shuffled)
                const getAnswerOptions = () => {
                  const phrases = storyWords.map(w => w.text);
                  return shuffleArray(phrases, exerciseQuestionIndex * 7 + 13);
                };

                const options = !isComplete ? getAnswerOptions() : [];
                const correctAnswer = currentWord?.text || '';

                const handleAnswerSelect = (answer: string) => {
                  if (exerciseAnswered) return;
                  setExerciseSelectedAnswer(answer);
                  setExerciseAnswered(true);
                  if (answer.toLowerCase() === correctAnswer.toLowerCase()) {
                    setExerciseScore(prev => prev + 1);
                  }
                };

                const handleNextQuestion = () => {
                  const nextIndex = exerciseQuestionIndex + 1;
                  setExerciseQuestionIndex(nextIndex);
                  setExerciseAnswered(false);
                  setExerciseSelectedAnswer(null);
                  if (nextIndex >= totalQuestions) {
                    void markStoryWordsDoneForToday();
                  }
                };

                const progressPercent = ((exerciseQuestionIndex) / totalQuestions) * 100;

                // Get the image URL for the correct answer phrase
                const answerImageUrl = getPhraseImageUrl(correctAnswer);

                // Dark mode colors - matching app design
                const isDark = theme === 'dark';
                const colors = {
                  bg: isDark ? '#121315' : '#F8F8F8',
                  headerBg: isDark ? '#1E2124' : '#FFFFFF',
                  headerBorder: isDark ? '#2A3033' : '#E5DED3',
                  closeBtn: isDark ? '#9CA3AF' : '#6B7280',
                  progressBg: isDark ? '#262D30' : '#E5DED3',
                  progressFill: '#F8B070',
                  counterText: isDark ? '#9CA3AF' : '#6B7280',
                  cardBg: isDark ? '#1E2124' : '#FFFFFF',
                  questionText: isDark ? '#E5E7EB' : '#111827',
                  answerBg: isDark ? '#262D30' : '#FBF8F4',
                  answerBorder: isDark ? '#353D42' : '#E5DED3',
                  answerText: isDark ? '#E5E7EB' : '#374151',
                  correctBg: isDark ? 'rgba(124,231,160,0.15)' : '#DCFCE7',
                  correctBorder: '#7CE7A0',
                  correctText: isDark ? '#7CE7A0' : '#166534',
                  incorrectBg: isDark ? 'rgba(239,68,68,0.15)' : '#FEE2E2',
                  incorrectBorder: '#EF4444',
                  incorrectText: isDark ? '#EF4444' : '#DC2626',
                  dimmedBg: isDark ? '#121315' : '#F8F8F8',
                  dimmedText: isDark ? '#6B7280' : '#9CA3AF',
                  resultTitle: isDark ? '#E5E7EB' : '#111827',
                  resultSubtitle: isDark ? '#9CA3AF' : '#6B7280',
                  divider: isDark ? '#353D42' : '#E5DED3',
                  emojiCircleBgGood: isDark ? 'rgba(124,231,160,0.2)' : '#DCFCE7',
                  emojiCircleBgWarn: isDark ? 'rgba(248,176,112,0.2)' : '#FEF3C7',
                };

                return (
                  <View style={{ flex: 1, backgroundColor: colors.bg }}>
                    {/* Header */}
                    <View style={{
                      paddingTop: insets.top + 12,
                      paddingHorizontal: 16,
                      paddingBottom: 16,
                      backgroundColor: colors.headerBg,
                      borderBottomWidth: 1,
                      borderBottomColor: colors.headerBorder,
                    }}>
                      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                        <TouchableOpacity
                          onPress={closeStoryViewer}
                          hitSlop={{ top: 10, right: 10, bottom: 10, left: 10 }}
                        >
                          <Text style={{ fontSize: 28, color: colors.closeBtn, fontWeight: '300' }}>×</Text>
                        </TouchableOpacity>

                        {/* Progress bar */}
                        <View style={{ flex: 1, marginHorizontal: 16 }}>
                          <View style={{
                            height: 8,
                            backgroundColor: colors.progressBg,
                            borderRadius: 4,
                            overflow: 'hidden',
                          }}>
                            <View style={{
                              height: '100%',
                              width: `${((exerciseQuestionIndex + (exerciseAnswered ? 1 : 0)) / totalQuestions) * 100}%`,
                              backgroundColor: colors.progressFill,
                              borderRadius: 4,
                            }} />
                          </View>
                        </View>

                        <Text style={{ fontSize: 15, color: colors.counterText, fontWeight: '600' }}>
                          {displayQuestionNumber}/{totalQuestions}
                        </Text>
                      </View>
                    </View>

                    {!isComplete ? (
                      <View style={{ flex: 1 }}>
                        <ScrollView
                          style={{ flex: 1 }}
                          contentContainerStyle={{ paddingBottom: exerciseAnswered ? 0 : insets.bottom + 20 }}
                          showsVerticalScrollIndicator={false}
                        >
                          {/* Image hint card */}
                          {answerImageUrl && (
                            <View style={{
                              margin: 16,
                              borderRadius: 16,
                              overflow: 'hidden',
                              backgroundColor: colors.cardBg,
                              shadowColor: '#000',
                              shadowOffset: { width: 0, height: 2 },
                              shadowOpacity: isDark ? 0.3 : 0.08,
                              shadowRadius: 8,
                              elevation: 3,
                            }}>
                              <Image
                                source={{ uri: answerImageUrl }}
                                style={{ width: '100%', height: 160 }}
                                resizeMode="cover"
                              />
                            </View>
                          )}

                          {/* Question */}
                          <View style={{ paddingHorizontal: 20, marginBottom: 20 }}>
                            <Text style={{
                              color: colors.questionText,
                              fontSize: 20,
                              lineHeight: 30,
                              textAlign: 'center',
                              fontWeight: '600',
                            }}>
                              {getSentenceWithBlank(currentWord)}
                            </Text>
                          </View>

                          {/* Answer options */}
                          <View style={{ paddingHorizontal: 20, flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', marginBottom: 16 }}>
                            {options.map((opt, idx) => {
                              const isSelected = exerciseSelectedAnswer === opt;
                              const isCorrect = opt.toLowerCase() === correctAnswer.toLowerCase();

                              let bgColor = colors.answerBg;
                              let borderColor = colors.answerBorder;
                              let textColor = colors.answerText;

                              if (exerciseAnswered) {
                                if (isCorrect) {
                                  bgColor = colors.correctBg;
                                  borderColor = colors.correctBorder;
                                  textColor = colors.correctText;
                                } else if (isSelected && !isCorrect) {
                                  bgColor = colors.incorrectBg;
                                  borderColor = colors.incorrectBorder;
                                  textColor = colors.incorrectText;
                                } else {
                                  bgColor = colors.answerBg;
                                  borderColor = colors.answerBorder;
                                  textColor = colors.dimmedText;
                                }
                              }

                              return (
                                <View key={`${opt}-${idx}`} style={{ width: '47%', marginBottom: 12 }}>
                                  <TouchableOpacity
                                    onPress={() => handleAnswerSelect(opt)}
                                    disabled={exerciseAnswered}
                                    activeOpacity={0.7}
                                    style={{
                                      width: '100%',
                                      backgroundColor: bgColor,
                                      borderRadius: 10,
                                      paddingVertical: 24,
                                      paddingHorizontal: 10,
                                      justifyContent: 'center',
                                      alignItems: 'center',
                                      borderWidth: 2,
                                      borderColor,
                                      minHeight: 88,
                                    }}
                                  >
                                    <Text style={{
                                      color: textColor,
                                      fontSize: 15,
                                      fontWeight: '600',
                                      textAlign: 'center',
                                    }}>
                                      {opt}
                                    </Text>
                                  </TouchableOpacity>
                                </View>
                              );
                            })}
                          </View>
                        </ScrollView>

	                        {/* Feedback & Next button - fixed at bottom */}
	                        {exerciseAnswered && (
	                          <View style={{
	                            backgroundColor: exerciseSelectedAnswer?.toLowerCase() === correctAnswer.toLowerCase() ? '#437F76' : '#DC2626',
	                            paddingTop: 16,
	                            paddingBottom: insets.bottom + 16,
	                            paddingHorizontal: 16,
	                          }}>
                              <LottieView
                                source={
                                  exerciseSelectedAnswer?.toLowerCase() === correctAnswer.toLowerCase()
                                    ? require('../assets/lottie/storywords/success.json')
                                    : require('../assets/lottie/storywords/notbad.json')
                                }
                                autoPlay
                                loop={false}
                                style={{ width: 220, height: 70, alignSelf: 'center', marginTop: -6, marginBottom: -6 }}
                              />
                              {exerciseSelectedAnswer?.toLowerCase() !== correctAnswer.toLowerCase() && (
                                <Text style={{
                                  color: 'rgba(255,255,255,0.92)',
                                  fontSize: 14,
                                  fontWeight: '700',
                                  textAlign: 'center',
                                  marginBottom: 8,
                                }}>
                                  Answer: {correctAnswer}
                                </Text>
                              )}
	                            <TouchableOpacity
	                              onPress={handleNextQuestion}
	                              activeOpacity={0.9}
	                              style={{
	                                backgroundColor: isDark ? '#1E2124' : '#FFFFFF',
                                paddingVertical: 14,
                                borderRadius: 12,
                                marginTop: exerciseSelectedAnswer?.toLowerCase() === correctAnswer.toLowerCase() ? 12 : 4,
                              }}
                            >
                              <Text style={{
                                color: exerciseSelectedAnswer?.toLowerCase() === correctAnswer.toLowerCase() ? '#7CE7A0' : '#EF4444',
                                fontSize: 15,
                                fontWeight: '700',
                                textAlign: 'center',
                              }}>
                                {exerciseQuestionIndex + 1 < totalQuestions ? 'CONTINUE' : 'SEE RESULTS'}
                              </Text>
                            </TouchableOpacity>
                          </View>
                        )}
                      </View>
	                    ) : (
	                      /* Results Screen */
	                      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', padding: 24, backgroundColor: colors.bg }}>
	                        <LottieView
	                          source={
	                            exerciseScore >= totalQuestions * 0.6
	                              ? require('../assets/lottie/storywords/success.json')
	                              : require('../assets/lottie/storywords/notbad.json')
	                          }
	                          autoPlay
	                          loop={false}
	                          style={{ width: 280, height: 110, marginBottom: 10 }}
	                        />

	                        <Text style={{
	                          fontSize: 16,
	                          color: isDark ? '#9CA3AF' : '#6B7280',
	                          textAlign: 'center',
	                          marginBottom: 24,
	                        }}>
	                          You got {exerciseScore} out of {totalQuestions} questions right
	                        </Text>

	                        {/* Score display */}
                        <View style={{
                          flexDirection: 'row',
                          backgroundColor: isDark ? '#1E2124' : '#FFFFFF',
                          borderRadius: 16,
                          padding: 20,
                          marginBottom: 32,
                          borderWidth: 1,
                          borderColor: isDark ? '#2A3033' : '#E5DED3',
                          shadowColor: '#000',
                          shadowOffset: { width: 0, height: 4 },
                          shadowOpacity: isDark ? 0.25 : 0.08,
                          shadowRadius: 12,
                          elevation: 4,
                        }}>
                          <View style={{ alignItems: 'center', paddingHorizontal: 24 }}>
                            <Text style={{ fontSize: 32, fontWeight: '700', color: '#7CE7A0' }}>{exerciseScore}</Text>
                            <Text style={{ fontSize: 13, color: isDark ? '#9CA3AF' : '#6B7280', marginTop: 4 }}>Correct</Text>
                          </View>
                          <View style={{ width: 1, backgroundColor: isDark ? '#353D42' : '#E5DED3' }} />
                          <View style={{ alignItems: 'center', paddingHorizontal: 24 }}>
                            <Text style={{ fontSize: 32, fontWeight: '700', color: '#EF4444' }}>{totalQuestions - exerciseScore}</Text>
                            <Text style={{ fontSize: 13, color: isDark ? '#9CA3AF' : '#6B7280', marginTop: 4 }}>Incorrect</Text>
                          </View>
                        </View>

                        <TouchableOpacity
                          onPress={closeStoryViewer}
                          activeOpacity={0.9}
                          style={{
                            backgroundColor: '#F8B070',
                            paddingVertical: 16,
                            paddingHorizontal: 48,
                            borderRadius: 14,
                            shadowColor: '#F8B070',
                            shadowOffset: { width: 0, height: 4 },
                            shadowOpacity: 0.3,
                            shadowRadius: 8,
                          }}
                        >
                          <Text style={{
                            color: '#0D1117',
                            fontSize: 16,
                            fontWeight: '800',
                            textAlign: 'center',
                          }}>
                            CONTINUE
                          </Text>
                        </TouchableOpacity>
                      </View>
                    )}
                  </View>
                );
              })()
            )}
          </View>
	        </Modal>

	        <Modal visible={newsMenuOpen} transparent animationType="fade" onRequestClose={() => setNewsMenuOpen(false)}>
	          <View style={styles.newsModalOverlay}>
	            <TouchableOpacity style={styles.newsModalBackdrop} activeOpacity={1} onPress={() => setNewsMenuOpen(false)} />
	            <View style={[styles.newsModalSheet, theme === 'light' && styles.newsModalSheetLight, { maxHeight: Dimensions.get('window').height * 0.7 }]}>
	              <View style={[styles.newsModalHandle, theme === 'light' && styles.newsModalHandleLight]} />
	              <TouchableOpacity
	                onPress={() => setNewsMenuOpen(false)}
	                style={{ position: 'absolute', top: 8, right: 8, padding: 4, zIndex: 2, backgroundColor: 'transparent' }}
	                hitSlop={{ top: 8, right: 8, bottom: 8, left: 8 }}
	              >
	                <Text style={{ fontSize: 18, fontWeight: '800', color: theme === 'light' ? '#0D3B4A' : '#E5E7EB' }}>×</Text>
	              </TouchableOpacity>

	              <Text style={[styles.newsSettingsLabel, theme === 'light' && styles.newsSettingsLabelLight]}>Topics</Text>
	              <View style={styles.newsControlsRow}>
	                {NEWS_TOPIC_OPTIONS.map((opt) => {
	                  const active = (newsPrefs.topics && newsPrefs.topics.length ? newsPrefs.topics : NEWS_DEFAULT_TOPICS).includes(opt.id);
	                  return (
	                    <TouchableOpacity
	                      key={opt.id}
	                      activeOpacity={0.9}
	                      onPress={() => toggleNewsTopic(opt.id)}
	                      style={[
	                        styles.newsChip,
	                        theme === 'light' && styles.newsChipLight,
	                        active && styles.newsChipActive,
	                        theme === 'light' && active && styles.newsChipActiveLight,
	                      ]}
	                    >
	                      <Text style={[styles.newsChipText, active && styles.newsChipTextActive]}>{opt.label}</Text>
	                    </TouchableOpacity>
	                  );
	                })}
	              </View>

	              <Text style={[styles.newsSettingsLabel, theme === 'light' && styles.newsSettingsLabelLight]}>Filters</Text>
	              <View style={styles.newsControlsRow}>
	                <TouchableOpacity
	                  activeOpacity={0.9}
	                  onPress={toggleHideSports}
	                  style={[
	                    styles.newsChip,
	                    theme === 'light' && styles.newsChipLight,
	                    newsPrefs.hideSports && styles.newsChipActive,
	                    theme === 'light' && newsPrefs.hideSports && styles.newsChipActiveLight,
	                  ]}
	                >
	                  <Text style={[styles.newsChipText, newsPrefs.hideSports && styles.newsChipTextActive]}>
	                    Hide sports
	                  </Text>
	                </TouchableOpacity>
	              </View>

	              <TouchableOpacity
	                onPress={() => setNewsMenuOpen(false)}
	                activeOpacity={0.85}
	                style={[
	                  styles.missionPrimary,
	                  { marginTop: 14, alignSelf: 'stretch', alignItems: 'center' },
	                ]}
	              >
	                <Text style={styles.missionPrimaryText}>Done</Text>
	              </TouchableOpacity>
	            </View>
	          </View>
	        </Modal>

        {/* Vocab Preview Modal */}
        <Modal visible={vocabPreviewVisible} transparent animationType="fade" onRequestClose={vocabPreviewSkip}>
          <View style={[styles.vocabPreviewOverlay, theme === 'light' && styles.vocabPreviewOverlayLight]}>
            <SafeAreaView style={styles.vocabPreviewSafeArea}>
              {/* Close button */}
              <TouchableOpacity onPress={vocabPreviewSkip} style={styles.vocabPreviewCloseBtn}>
                <X size={24} color={theme === 'light' ? '#374151' : '#9CA3AF'} />
              </TouchableOpacity>

              {/* Header with article info */}
              <View style={styles.vocabPreviewHeaderNew}>
                <View style={[styles.vocabPreviewBadge, { backgroundColor: getTagColor(vocabPreviewArticle?.tag).bg }]}>
                  <Text style={[styles.vocabPreviewBadgeText, { color: getTagColor(vocabPreviewArticle?.tag).text }]}>
                    {vocabPreviewArticle?.tag || 'Article'}
                  </Text>
                </View>
                <Text style={[styles.vocabPreviewArticleTitle, theme === 'light' && { color: '#111827' }]} numberOfLines={2}>
                  {vocabPreviewArticle?.hookTitle || vocabPreviewArticle?.title}
                </Text>
              </View>

              {/* Progress bar */}
              <View style={styles.vocabPreviewProgressContainer}>
                <View style={[styles.vocabPreviewProgressBg, theme === 'light' && { backgroundColor: '#E5E7EB' }]}>
                  <View
                    style={[
                      styles.vocabPreviewProgressFill,
                      { width: `${((vocabPreviewIndex + 1) / (vocabPreviewArticle?.vocab?.slice(0, 5).length || 1)) * 100}%` },
                    ]}
                  />
                </View>
                <Text style={[styles.vocabPreviewProgressText, theme === 'light' && { color: '#6B7280' }]}>
                  {vocabPreviewIndex + 1} / {vocabPreviewArticle?.vocab?.slice(0, 5).length || 0}
                </Text>
              </View>

              {/* Flashcard */}
              {(() => {
                const currentWord = vocabPreviewArticle?.vocab?.slice(0, 5)[vocabPreviewIndex];
                if (!currentWord) return null;
                return (
                  <Animated.View
                    style={[
                      styles.vocabPreviewCardNew,
                      theme === 'light' && styles.vocabPreviewCardNewLight,
                      {
                        opacity: vocabCardAnim.interpolate({ inputRange: [0, 1], outputRange: [1, 0] }),
                        transform: [
                          { scale: vocabCardAnim.interpolate({ inputRange: [0, 1], outputRange: [1, 0.95] }) },
                          { translateX: vocabCardAnim.interpolate({ inputRange: [0, 1], outputRange: [0, -30] }) },
                        ],
                      },
                    ]}
                  >
                    <TouchableOpacity activeOpacity={1} onPress={vocabPreviewFlip} style={styles.vocabPreviewCardTouchable}>
                      {!vocabPreviewFlipped ? (
                        <View style={styles.vocabPreviewCardFront}>
                          <Text style={[styles.vocabPreviewWordNew, theme === 'light' && { color: '#111827' }]}>
                            {currentWord.word}
                          </Text>
                          <View style={styles.vocabPreviewTapHint}>
                            <View style={[styles.vocabPreviewTapIcon, theme === 'light' && { backgroundColor: '#E5E7EB' }]}>
                              <Text style={{ fontSize: 16 }}>👆</Text>
                            </View>
                            <Text style={[styles.vocabPreviewTapText, theme === 'light' && { color: '#9CA3AF' }]}>
                              Tap to reveal meaning
                            </Text>
                          </View>
                        </View>
                      ) : (
                        <ScrollView
                          style={styles.vocabPreviewCardBackScroll}
                          contentContainerStyle={styles.vocabPreviewCardBack}
                          showsVerticalScrollIndicator={false}
                        >
                          <Text style={[styles.vocabPreviewWordBack, theme === 'light' && { color: '#437F76' }]}>
                            {currentWord.word}
                          </Text>

                          {/* Synonyms */}
                          {(currentWord as any).synonyms && (
                            <Text style={[styles.vocabPreviewSynonyms, theme === 'light' && { color: '#9CA3AF' }]}>
                              ≈ {(currentWord as any).synonyms}
                            </Text>
                          )}

                          <View style={[styles.vocabPreviewDivider, theme === 'light' && { backgroundColor: '#E5E7EB' }]} />

                          {/* Definition */}
                          <Text style={[styles.vocabPreviewDefinitionNew, theme === 'light' && { color: '#374151' }]}>
                            {currentWord.definition}
                          </Text>

                          {/* Translation & Example combined */}
                          {currentWord.translation && (
                            <View style={[styles.vocabPreviewTranslationBox, theme === 'light' && styles.vocabPreviewTranslationBoxLight]}>
                              <Text style={[styles.vocabPreviewTranslationLabel, theme === 'light' && styles.vocabPreviewTranslationLabelLight]}>Translation</Text>
                              <Text style={[styles.vocabPreviewTranslationNew, theme === 'light' && styles.vocabPreviewTranslationNewLight]}>
                                {currentWord.translation}
                              </Text>
                              {/* Loading indicator for enrichment */}
                              {vocabPreviewLoading && !(currentWord as any).example && (
                                <Text style={[styles.vocabPreviewLoadingInBox, theme === 'light' && { color: '#9CA3AF' }]}>
                                  Loading example...
                                </Text>
                              )}
                              {/* Example in same box */}
                              {(currentWord as any).example && (
                                <View style={[styles.vocabPreviewExampleInBox, theme === 'light' && styles.vocabPreviewExampleInBoxLight]}>
                                  <Text style={[styles.vocabPreviewExampleLabelInBox, theme === 'light' && styles.vocabPreviewExampleLabelInBoxLight]}>Example</Text>
                                  <Text style={[styles.vocabPreviewExampleTextInBox, theme === 'light' && styles.vocabPreviewExampleTextInBoxLight]}>
                                    "{(currentWord as any).example}"
                                  </Text>
                                </View>
                              )}
                            </View>
                          )}
                        </ScrollView>
                      )}
                    </TouchableOpacity>
                  </Animated.View>
                );
              })()}

              {/* Bottom actions */}
              <View style={styles.vocabPreviewBottomActions}>
                <TouchableOpacity
                  style={[styles.vocabPreviewSkipBtnNew, theme === 'light' && { borderColor: '#D1D5DB', backgroundColor: '#FFFFFF' }]}
                  onPress={vocabPreviewSkip}
                >
                  <Text style={[styles.vocabPreviewSkipTextNew, theme === 'light' && { color: '#6B7280' }]}>
                    Skip to Article
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.vocabPreviewNextBtn}
                  onPress={vocabPreviewNext}
                >
                  <Text style={styles.vocabPreviewNextBtnText}>
                    {vocabPreviewIndex < (vocabPreviewArticle?.vocab?.slice(0, 5).length || 0) - 1
                      ? 'Got it!'
                      : 'Start Reading →'}
                  </Text>
                </TouchableOpacity>
              </View>
            </SafeAreaView>
          </View>
        </Modal>

	        <Modal visible={newsModalVisible} transparent animationType="none" onRequestClose={closeNewsModal}>
	          <View style={styles.newsModalOverlay}>
	            <TouchableOpacity style={styles.newsModalBackdrop} activeOpacity={1} onPress={() => { setArticleSettingsOpen(false); closeNewsModal(); }} />
	            <Animated.View
              style={[
                styles.newsModalSheet,
                theme === 'light' && styles.newsModalSheetLight,
                getArticleBgStyle(),
                {
                  opacity: newsModalAnim,
                  transform: [
                    {
                      translateY: Animated.add(
                        newsModalAnim.interpolate({ inputRange: [0, 1], outputRange: [40, 0] }),
                        newsDrag
                      ),
                    },
                  ],
                  height: Dimensions.get('window').height * 0.9,
                },
              ]}
            >
              <View {...newsPan.panHandlers} style={{ paddingVertical: 12, alignItems: 'center', marginBottom: 4 }}>
                <View style={[styles.newsModalHandle, { marginBottom: 0 }, articleBgColor === 'sepia' ? { backgroundColor: '#C9B99A' } : (articleBgColor === 'dark' || articleBgColor === 'black') ? { backgroundColor: '#4B5563' } : theme === 'light' ? styles.newsModalHandleLight : null]} />
              </View>
              {/* Text Settings Button */}
              <TouchableOpacity
                onPress={() => setArticleSettingsOpen(!articleSettingsOpen)}
                style={{ position: 'absolute', top: 8, right: 44, padding: 6, zIndex: 3, backgroundColor: 'transparent' }}
                hitSlop={{ top: 8, right: 8, bottom: 8, left: 8 }}
              >
                <Text style={{ fontSize: 16, fontWeight: '700', color: articleBgColor === 'sepia' ? '#5D4E37' : (articleBgColor === 'dark' || articleBgColor === 'black') ? '#E5E7EB' : theme === 'light' ? '#0D3B4A' : '#E5E7EB' }}>Aa</Text>
              </TouchableOpacity>
              {/* Settings Popup */}
              {articleSettingsOpen && (
                <View style={{
                  position: 'absolute',
                  top: 40,
                  right: 12,
                  backgroundColor: articleBgColor === 'sepia' ? '#FAF7F0' : (articleBgColor === 'dark' || articleBgColor === 'black') ? '#2A2A2A' : theme === 'light' ? '#FFFFFF' : '#2A2A2A',
                  borderRadius: 16,
                  padding: 16,
                  zIndex: 100,
                  shadowColor: '#000',
                  shadowOffset: { width: 0, height: 4 },
                  shadowOpacity: 0.25,
                  shadowRadius: 12,
                  elevation: 8,
                  width: 240,
                }}>
                  {/* Background Color Options */}
                  <View style={{ flexDirection: 'row', justifyContent: 'space-around', marginBottom: 20 }}>
                    {(['default', 'sepia', 'dark', 'black'] as const).map((bg) => {
                      const bgColors = { default: theme === 'light' ? '#FFFFFF' : '#1E1E1E', sepia: '#F5F0E1', dark: '#1E3A5F', black: '#0D0D0D' };
                      const isSelected = articleBgColor === bg;
                      return (
                        <TouchableOpacity
                          key={bg}
                          onPress={() => {
                            setArticleBgColor(bg);
                            saveArticleSettings(articleFontSize, bg);
                          }}
                          style={{
                            width: 44,
                            height: 44,
                            borderRadius: 22,
                            backgroundColor: bgColors[bg],
                            borderWidth: isSelected ? 3 : 1,
                            borderColor: isSelected ? '#3B82F6' : '#9CA3AF',
                          }}
                        />
                      );
                    })}
                  </View>
                  {/* Font Size Slider */}
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                    <Text style={{ fontSize: 14, fontWeight: '600', color: articleBgColor === 'sepia' ? '#5D4E37' : (articleBgColor === 'dark' || articleBgColor === 'black') ? '#E5E7EB' : theme === 'light' ? '#374151' : '#E5E7EB' }}>Aa</Text>
                    <View style={{ flex: 1, height: 4, backgroundColor: articleBgColor === 'sepia' ? '#D4C9B5' : (articleBgColor === 'dark' || articleBgColor === 'black') ? '#4B5563' : theme === 'light' ? '#E5E7EB' : '#4B5563', borderRadius: 2 }}>
                      <View style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: `${((articleFontSize - 14) / 10) * 100}%`, backgroundColor: '#3B82F6', borderRadius: 2 }} />
                      <View
                        style={{
                          position: 'absolute',
                          left: `${((articleFontSize - 14) / 10) * 100}%`,
                          top: -8,
                          width: 20,
                          height: 20,
                          borderRadius: 10,
                          backgroundColor: '#FFFFFF',
                          marginLeft: -10,
                          shadowColor: '#000',
                          shadowOffset: { width: 0, height: 2 },
                          shadowOpacity: 0.2,
                          shadowRadius: 4,
                          elevation: 4,
                        }}
                      />
                    </View>
                    <Text style={{ fontSize: 20, fontWeight: '700', color: articleBgColor === 'sepia' ? '#5D4E37' : (articleBgColor === 'dark' || articleBgColor === 'black') ? '#E5E7EB' : theme === 'light' ? '#374151' : '#E5E7EB' }}>Aa</Text>
                  </View>
                  {/* Slider Touch Area */}
                  <View
                    style={{ marginTop: -20, height: 40, marginHorizontal: 26 }}
                    onStartShouldSetResponder={() => true}
                    onMoveShouldSetResponder={() => true}
                    onResponderMove={(e) => {
                      const { locationX } = e.nativeEvent;
                      const width = 240 - 52 - 32; // container width - padding - Aa labels
                      const percent = Math.max(0, Math.min(1, locationX / width));
                      const newSize = Math.round(14 + percent * 10);
                      setArticleFontSize(newSize);
                    }}
                    onResponderRelease={() => {
                      saveArticleSettings(articleFontSize, articleBgColor);
                    }}
                  />
                  {/* Reset Button */}
                  <TouchableOpacity
                    onPress={() => {
                      setArticleFontSize(17);
                      setArticleBgColor('default');
                      saveArticleSettings(17, 'default');
                    }}
                    style={{ alignSelf: 'center', marginTop: 12 }}
                  >
                    <Text style={{ color: '#3B82F6', fontWeight: '600', fontSize: 14 }}>Reset to default</Text>
                  </TouchableOpacity>
                </View>
              )}
              <TouchableOpacity
                onPress={() => { setArticleSettingsOpen(false); closeNewsModal(); }}
                style={{ position: 'absolute', top: 8, right: 8, padding: 4, zIndex: 2, backgroundColor: 'transparent' }}
                hitSlop={{ top: 8, right: 8, bottom: 8, left: 8 }}
              >
                <Text style={{ fontSize: 18, fontWeight: '800', color: articleBgColor === 'sepia' ? '#5D4E37' : (articleBgColor === 'dark' || articleBgColor === 'black') ? '#E5E7EB' : theme === 'light' ? '#0D3B4A' : '#E5E7EB' }}>×</Text>
              </TouchableOpacity>
              {sheetArticle && (
                <ScrollView
                  showsVerticalScrollIndicator
                  bounces
                  scrollEventThrottle={16}
                  contentContainerStyle={{
                    paddingBottom: insets.bottom + 60,
                    paddingHorizontal: 10,
                  }}
                >
	                  <Image source={{ uri: sheetArticle.image || fallbackNewsImage }} style={styles.newsModalImage} />
	                  <View style={styles.newsModalTagRow}>
	                    <Text style={[styles.newsModalTag, { backgroundColor: getTagColor(sheetArticle.tag).bg, color: getTagColor(sheetArticle.tag).text }]}>{(sheetArticle.tag || 'Story').toUpperCase()}</Text>
	                  </View>
	                  <Text style={[styles.newsModalTitle, { color: articleBgColor === 'sepia' ? '#3D3D3D' : (articleBgColor === 'dark' || articleBgColor === 'black') ? '#E5E7EB' : theme === 'light' ? '#0D3B4A' : '#E5E7EB' }]}>
	                    {sheetArticle.hookTitle || sheetArticle.title}
	                  </Text>
	                  <Text
	                    style={[styles.newsModalSummary, { fontSize: articleFontSize, lineHeight: articleFontSize * 1.6, color: getArticleTextColor() }]}
	                    allowFontScaling={false}
	                    ellipsizeMode="clip"
                  >
                    {(modalHighlightParts && modalHighlightParts.length
                      ? modalHighlightParts
                      : buildHighlightParts(sheetArticle.summary, sheetArticle.vocab)
                    ).map((part) =>
                      part.highlighted ? (
                        <Text
                          key={part.key}
                          style={[
                            { fontWeight: '800', color: articleBgColor === 'sepia' ? '#B45309' : '#F8B070' },
                          ]}
                          onPress={() => {
                            const word = part.text;
                            const definition = part.definition;
                            Alert.alert(
                              word,
                              'Save to Vault?',
                              [
                                { text: 'Cancel', style: 'cancel' },
                                {
                                  text: 'Save',
                                  onPress: () => {
                                    saveWordToVault(word, definition);
                                  },
                                },
                              ],
                              { cancelable: true }
                            );
                          }}
                        >
                          {part.text}
                        </Text>
                      ) : (
                        <Text key={part.key}>{part.text}</Text>
                      )
                    )}
                  </Text>
                  {!!sheetArticle.vocab?.length && (
                    <View style={[styles.newsGlossary, { backgroundColor: articleBgColor === 'sepia' ? 'rgba(180,160,130,0.15)' : (articleBgColor === 'dark' || articleBgColor === 'black') ? 'rgba(255,255,255,0.05)' : theme === 'light' ? 'rgba(0,0,0,0.03)' : 'rgba(255,255,255,0.05)' }]}>
                      <View style={styles.vocabHeaderRow}>
                        <Text style={[styles.newsGlossaryTitle, { color: articleBgColor === 'sepia' ? '#5D4E37' : (articleBgColor === 'dark' || articleBgColor === 'black') ? '#E5E7EB' : theme === 'light' ? '#0D3B4A' : '#E5E7EB' }]}>Vocabulary</Text>
                        {sheetArticle.vocab.some(v => v.translation) && (
                          <TouchableOpacity
                            onPress={() => setShowVocabTranslations(!showVocabTranslations)}
                            style={[
                              styles.vocabTranslationToggle,
                              { backgroundColor: showVocabTranslations ? (articleBgColor === 'sepia' ? 'rgba(180,83,9,0.15)' : 'rgba(248,176,112,0.15)') : 'transparent' },
                              { borderColor: articleBgColor === 'sepia' ? 'rgba(180,83,9,0.3)' : 'rgba(248,176,112,0.3)' }
                            ]}
                            activeOpacity={0.7}
                          >
                            <Text style={[styles.vocabTranslationToggleText, { color: articleBgColor === 'sepia' ? '#B45309' : '#F8B070' }]}>
                              {showVocabTranslations ? 'Hide' : 'Show'} translations
                            </Text>
                          </TouchableOpacity>
                        )}
                      </View>
                      {sheetArticle.vocab.map((item, vocabIndex) => (
                        <Text key={`${item.word || 'word'}-${vocabIndex}`} style={[styles.newsGlossaryItem, { color: getArticleTextColor(), fontSize: 15 }]}>
                          <Text style={{ fontWeight: '700' }}>{item.word}</Text> — {item.definition}
                          {showVocabTranslations && !!item.translation && (
                            <Text style={{ color: articleBgColor === 'sepia' ? '#B45309' : '#F8B070' }}> ({item.translation})</Text>
                          )}
                        </Text>
                      ))}
                    </View>
                  )}

                  {/* Key Takeaways */}
                  {!!sheetArticle.keyTakeaways?.length && (
                    <View style={[styles.newsGlossary, { marginTop: 16, backgroundColor: articleBgColor === 'sepia' ? 'rgba(180,160,130,0.15)' : (articleBgColor === 'dark' || articleBgColor === 'black') ? 'rgba(255,255,255,0.05)' : theme === 'light' ? 'rgba(0,0,0,0.03)' : 'rgba(255,255,255,0.05)' }]}>
                      <Text style={[styles.newsGlossaryTitle, { color: articleBgColor === 'sepia' ? '#5D4E37' : (articleBgColor === 'dark' || articleBgColor === 'black') ? '#E5E7EB' : theme === 'light' ? '#0D3B4A' : '#E5E7EB' }]}>Key Takeaways</Text>
                      {sheetArticle.keyTakeaways.map((takeaway, idx) => (
                        <View key={`takeaway-${idx}`} style={{ flexDirection: 'row', marginTop: 8, alignItems: 'flex-start' }}>
                          <Text style={{ color: articleBgColor === 'sepia' ? '#B45309' : '#F8B070', fontSize: 14, marginRight: 8 }}>✦</Text>
                          <Text style={[styles.newsGlossaryItem, { flex: 1, fontSize: 15, marginTop: 0, color: getArticleTextColor() }]}>
                            {takeaway}
                          </Text>
                        </View>
                      ))}
                    </View>
                  )}

                  {/* Daily Challenge */}
                  {!!sheetArticle.dailyChallenge && (
                    <View style={[
                      styles.newsGlossary,
                      { marginTop: 16, backgroundColor: articleBgColor === 'sepia' ? 'rgba(180,83,9,0.1)' : (articleBgColor === 'dark' || articleBgColor === 'black') ? 'rgba(248,176,112,0.08)' : theme === 'light' ? 'rgba(248,176,112,0.12)' : 'rgba(248,176,112,0.08)' }
                    ]}>
                      <Text style={[styles.newsGlossaryTitle, { color: articleBgColor === 'sepia' ? '#B45309' : '#F8B070' }]}>
                        🎯 Today's Challenge
                      </Text>
                      <Text style={[styles.newsGlossaryItem, { fontSize: 15, marginTop: 8, color: getArticleTextColor() }]}>
                        {sheetArticle.dailyChallenge}
                      </Text>
                    </View>
                  )}

                  {/* Comprehension Quiz */}
                  {!!sheetArticle.quiz?.length && (
                    <View style={[styles.newsGlossary, { marginTop: 16, backgroundColor: articleBgColor === 'sepia' ? 'rgba(180,160,130,0.15)' : (articleBgColor === 'dark' || articleBgColor === 'black') ? 'rgba(255,255,255,0.05)' : theme === 'light' ? 'rgba(0,0,0,0.03)' : 'rgba(255,255,255,0.05)' }]}>
                      {!quizStarted ? (
                        <>
                          <Text style={[styles.newsGlossaryTitle, { color: articleBgColor === 'sepia' ? '#5D4E37' : (articleBgColor === 'dark' || articleBgColor === 'black') ? '#E5E7EB' : theme === 'light' ? '#0D3B4A' : '#E5E7EB' }]}>
                            🧠 Comprehension Quiz
                          </Text>
                          <Text style={[styles.newsGlossaryItem, { fontSize: 14, marginTop: 4, opacity: 0.7, color: getArticleTextColor() }]}>
                            Test your understanding with {sheetArticle.quiz.length} questions
                          </Text>
                          <TouchableOpacity
                            onPress={startQuiz}
                            activeOpacity={0.8}
                            style={{
                              marginTop: 16,
                              backgroundColor: '#F8B070',
                              paddingVertical: 14,
                              paddingHorizontal: 24,
                              borderRadius: 12,
                              alignItems: 'center',
                            }}
                          >
                            <Text style={{ color: '#1E1E1E', fontWeight: '700', fontSize: 16 }}>Start Quiz</Text>
                          </TouchableOpacity>
                        </>
                      ) : quizShowResult ? (
                        <>
                          <Animated.View style={{ alignItems: 'center', opacity: quizConfettiAnim.interpolate({ inputRange: [0, 1], outputRange: [1, 1.2] }) }}>
                            <Text style={{ fontSize: 48, marginBottom: 12 }}>
                              {getQuizScore() === sheetArticle.quiz.length ? '🎉' : getQuizScore() >= sheetArticle.quiz.length - 1 ? '👏' : '📚'}
                            </Text>
                            <Text style={[styles.newsGlossaryTitle, { textAlign: 'center', color: articleBgColor === 'sepia' ? '#5D4E37' : (articleBgColor === 'dark' || articleBgColor === 'black') ? '#E5E7EB' : theme === 'light' ? '#0D3B4A' : '#E5E7EB' }]}>
                              {getQuizScore() === sheetArticle.quiz.length ? 'Perfect Score!' : getQuizScore() >= sheetArticle.quiz.length - 1 ? 'Great Job!' : 'Keep Learning!'}
                            </Text>
                            <Text style={[styles.newsGlossaryItem, { fontSize: 20, marginTop: 8, fontWeight: '700', color: getArticleTextColor() }]}>
                              {getQuizScore()} / {sheetArticle.quiz.length}
                            </Text>
                          </Animated.View>
                          <TouchableOpacity
                            onPress={startQuiz}
                            activeOpacity={0.8}
                            style={{
                              marginTop: 20,
                              backgroundColor: theme === 'light' ? 'rgba(13,59,74,0.1)' : 'rgba(255,255,255,0.1)',
                              paddingVertical: 12,
                              paddingHorizontal: 24,
                              borderRadius: 10,
                              alignItems: 'center',
                            }}
                          >
                            <Text style={{ color: articleBgColor === 'sepia' ? '#5D4E37' : (articleBgColor === 'dark' || articleBgColor === 'black') ? '#E5E7EB' : theme === 'light' ? '#0D3B4A' : '#E5E7EB', fontWeight: '600', fontSize: 15 }}>Try Again</Text>
                          </TouchableOpacity>
                        </>
                      ) : (
                        <>
                          {/* Progress bar */}
                          <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 16 }}>
                            <View style={{ flex: 1, height: 4, backgroundColor: articleBgColor === 'sepia' ? 'rgba(0,0,0,0.1)' : (articleBgColor === 'dark' || articleBgColor === 'black') ? 'rgba(255,255,255,0.1)' : theme === 'light' ? 'rgba(0,0,0,0.1)' : 'rgba(255,255,255,0.1)', borderRadius: 2 }}>
                              <Animated.View
                                style={{
                                  width: quizProgressAnim.interpolate({ inputRange: [0, 1], outputRange: ['0%', '100%'] }),
                                  height: '100%',
                                  backgroundColor: articleBgColor === 'sepia' ? '#B45309' : '#F8B070',
                                  borderRadius: 2,
                                }}
                              />
                            </View>
                            <Text style={{ color: articleBgColor === 'sepia' ? '#6B6B6B' : (articleBgColor === 'dark' || articleBgColor === 'black') ? '#9CA3AF' : theme === 'light' ? '#6B7280' : '#9CA3AF', fontSize: 12, marginLeft: 8 }}>
                              {quizCurrentQ + 1}/{sheetArticle.quiz.length}
                            </Text>
                          </View>

                          {/* Question */}
                          <Animated.View
                            style={{
                              transform: [
                                { translateX: quizWrongAnim.interpolate({ inputRange: [-1, 0, 1], outputRange: [-8, 0, 8] }) },
                                { scale: quizCorrectAnim.interpolate({ inputRange: [0, 1], outputRange: [1, 1.02] }) },
                              ],
                            }}
                          >
                            <Text style={[styles.newsGlossaryTitle, { fontSize: 17, lineHeight: 24, color: articleBgColor === 'sepia' ? '#5D4E37' : (articleBgColor === 'dark' || articleBgColor === 'black') ? '#E5E7EB' : theme === 'light' ? '#0D3B4A' : '#E5E7EB' }]}>
                              {sheetArticle.quiz[quizCurrentQ]?.question}
                            </Text>
                          </Animated.View>

                          {/* Options */}
                          <View style={{ marginTop: 16 }}>
                            {sheetArticle.quiz[quizCurrentQ]?.options.map((option, optIdx) => {
                              const answered = quizAnswers.length > quizCurrentQ;
                              const isSelected = answered && quizAnswers[quizCurrentQ] === optIdx;
                              const isCorrect = optIdx === sheetArticle.quiz![quizCurrentQ].correctIndex;
                              const showCorrect = answered && isCorrect;
                              const showWrong = answered && isSelected && !isCorrect;

                              return (
                                <Animated.View
                                  key={`opt-${optIdx}`}
                                  style={{
                                    opacity: quizOptionAnims[optIdx],
                                    transform: [
                                      { translateY: quizOptionAnims[optIdx].interpolate({ inputRange: [0, 1], outputRange: [20, 0] }) },
                                    ],
                                  }}
                                >
                                  <TouchableOpacity
                                    onPress={() => !answered && handleQuizAnswer(optIdx)}
                                    activeOpacity={answered ? 1 : 0.7}
                                    style={{
                                      marginTop: 10,
                                      paddingVertical: 14,
                                      paddingHorizontal: 16,
                                      borderRadius: 10,
                                      backgroundColor: showCorrect
                                        ? 'rgba(67,127,118,0.2)'
                                        : showWrong
                                        ? 'rgba(239,68,68,0.15)'
                                        : articleBgColor === 'sepia'
                                        ? 'rgba(93,78,55,0.08)'
                                        : (articleBgColor === 'dark' || articleBgColor === 'black')
                                        ? 'rgba(255,255,255,0.06)'
                                        : theme === 'light'
                                        ? 'rgba(13,59,74,0.06)'
                                        : 'rgba(255,255,255,0.06)',
                                      borderWidth: 2,
                                      borderColor: showCorrect
                                        ? '#437F76'
                                        : showWrong
                                        ? '#EF4444'
                                        : 'transparent',
                                    }}
                                  >
                                    <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                                      <View
                                        style={{
                                          width: 24,
                                          height: 24,
                                          borderRadius: 12,
                                          backgroundColor: showCorrect
                                            ? '#437F76'
                                            : showWrong
                                            ? '#EF4444'
                                            : articleBgColor === 'sepia'
                                            ? 'rgba(93,78,55,0.15)'
                                            : (articleBgColor === 'dark' || articleBgColor === 'black')
                                            ? 'rgba(255,255,255,0.1)'
                                            : theme === 'light'
                                            ? 'rgba(13,59,74,0.1)'
                                            : 'rgba(255,255,255,0.1)',
                                          alignItems: 'center',
                                          justifyContent: 'center',
                                          marginRight: 12,
                                        }}
                                      >
                                        <Text
                                          style={{
                                            color: showCorrect || showWrong ? '#FFFFFF' : articleBgColor === 'sepia' ? '#5D4E37' : (articleBgColor === 'dark' || articleBgColor === 'black') ? '#E5E7EB' : theme === 'light' ? '#0D3B4A' : '#E5E7EB',
                                            fontSize: 12,
                                            fontWeight: '600',
                                          }}
                                        >
                                          {showCorrect ? '✓' : showWrong ? '✗' : String.fromCharCode(65 + optIdx)}
                                        </Text>
                                      </View>
                                      <Text
                                        style={{
                                          flex: 1,
                                          color: articleBgColor === 'sepia' ? '#5D4E37' : (articleBgColor === 'dark' || articleBgColor === 'black') ? '#E5E7EB' : theme === 'light' ? '#0D3B4A' : '#E5E7EB',
                                          fontSize: 15,
                                          lineHeight: 21,
                                        }}
                                      >
                                        {option}
                                      </Text>
                                    </View>
                                  </TouchableOpacity>
                                </Animated.View>
                              );
                            })}
                          </View>
                        </>
                      )}
                    </View>
                  )}
                </ScrollView>
              )}
                          </Animated.View>
          </View>
        </Modal>

        {/* Bottom spacing for FAB (respect safe-area) */}
        <View style={{ height: 8 }} />
      </ScrollView>

      {/* Floating Action Button */}
      {!isPreview && (
        <TouchableOpacity
          style={[styles.fab, { bottom: Math.max(48, insets.bottom + 52) }]}
          onPress={() => (menuOpen ? closeMenu() : openMenu())}
          activeOpacity={0.8}
        >
          <Plus size={24} color="#FFFFFF" />
        </TouchableOpacity>
      )}


      {menuOpen && !isPreview && (
        <>
          <TouchableOpacity style={styles.menuOverlay} activeOpacity={1} onPress={closeMenu} />
          <Animated.View
            style={[
              styles.menuCard,
              theme === 'light' && styles.menuCardLight,
              {
                opacity: menuAnim,
                transform: [
                  { scale: menuAnim.interpolate({ inputRange: [0, 1], outputRange: [0.96, 1] }) },
                  { translateY: menuAnim.interpolate({ inputRange: [0, 1], outputRange: [8, 0] }) },
                ],
              },
            ]}
          >
            <TouchableOpacity
              style={styles.menuItem}
              onPress={() => { closeMenu(); try { router.push('/scan-words'); } catch {} }}
            >
              <Camera size={18} color={theme === 'light' ? '#0F766E' : '#B6E0E2'} />
              <Text style={[styles.menuText, theme === 'light' && styles.menuTextLight]}>Scan Words</Text>
            </TouchableOpacity>
            <View style={styles.menuDivider} />
            <TouchableOpacity
              style={styles.menuItem}
              onPress={() => { closeMenu(); try { router.push('/vault?add=1'); } catch {} }}
            >
              <Type size={18} color={theme === 'light' ? '#7C3AED' : '#C4B5FD'} />
              <Text style={[styles.menuText, theme === 'light' && styles.menuTextLight]}>Add Manually</Text>
            </TouchableOpacity>
          </Animated.View>
        </>
      )}

      {/* Onboarding */}
	      {!isPreview && (
	      <OnboardingModal
	        visible={showOnboarding}
	        theme={theme}
	        onClose={async (next) => {
	          try { await AsyncStorage.setItem('@engniter.onboarding_done_v1', '1'); } catch {}
	          if (next === 'profile') {
	            try { router.replace('/profile'); } catch {}
	            // Small delay before hiding modal to prevent flash
	            setTimeout(() => setShowOnboarding(false), 100);
	            return;
	          }
          // Navigate first, then hide modal to prevent flash of home screen
          try { router.replace('/placement/level-select'); } catch {}
          setTimeout(() => setShowOnboarding(false), 100);
        }}
      />)}

      {/* Daily streak celebration (once per day) */}
      {showStreakCelebrate && !isPreview && (
        <View style={styles.celebrateOverlay}>
          <LinearGradient
            colors={theme === 'light' ? ['#FFFFFF', '#F8F9FA'] : ['#2A2D2E', '#1A1C1D']}
            style={[styles.celebrateCard]}
            start={{ x: 0, y: 0 }}
            end={{ x: 0, y: 1 }}
          >
            {/* Decorative glow */}
            <View style={styles.celebrateGlow} pointerEvents="none" />

            {/* Flame animation */}
            <View style={styles.celebrateFlameWrap}>
              <LottieView source={require('../assets/lottie/flame.json')} autoPlay loop style={{ width: 120, height: 120 }} />
            </View>

            {/* Streak count */}
            <View style={styles.celebrateCountWrap}>
              <Text style={[styles.celebrateCount, theme === 'light' && styles.celebrateCountLight]}>{displayCount}</Text>
            </View>
            <Text style={[styles.celebrateLabel, theme === 'light' && styles.celebrateLabelLight]}>Day Streak</Text>

            {/* Week progress */}
            <View style={styles.celebrateWeekRow}>
              {['M', 'T', 'W', 'T', 'F', 'S', 'S'].map((day, idx) => {
                const streakCount = userProgress?.streak || 0;
                const todayIdx = new Date().getDay();
                const adjustedTodayIdx = todayIdx === 0 ? 6 : todayIdx - 1;
                const isCompleted = idx <= adjustedTodayIdx && idx >= adjustedTodayIdx - (streakCount - 1);
                const isToday = idx === adjustedTodayIdx;
                return (
                  <View key={idx} style={[styles.celebrateDayCol]}>
                    <Text style={[styles.celebrateDayLabel, theme === 'light' && { color: '#6B7280' }]}>{day}</Text>
                    <View style={[
                      styles.celebrateDayDot,
                      isCompleted && styles.celebrateDayDotActive,
                      isToday && styles.celebrateDayDotToday,
                    ]}>
                      {isCompleted && <Text style={styles.celebrateDayCheck}>✓</Text>}
                    </View>
                  </View>
                );
              })}
            </View>

            <Text style={[styles.celebrateHint, theme === 'light' && styles.celebrateHintLight]}>
              You're on fire! Keep practicing daily.
            </Text>

            <TouchableOpacity
              style={styles.celebrateBtn}
              onPress={async () => {
                setShowStreakCelebrate(false);
                try {
                  const todayKey = new Date().toISOString().slice(0,10);
                  await AsyncStorage.multiSet([
                    ['@engniter.streak_celebrate_date', todayKey],
                    ['@engniter.streak_celebrate_value', String(userProgress?.streak || 0)],
                  ]);
                } catch {}
              }}
              activeOpacity={0.8}
            >
              <LinearGradient
                colors={['#4ED9CB', '#3BB8AC']}
                style={styles.celebrateBtnGradient}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
              >
                <Text style={styles.celebrateBtnText}>Continue</Text>
              </LinearGradient>
            </TouchableOpacity>
          </LinearGradient>
        </View>
      )}

      {/* Three‑finger gesture handled on SafeAreaView; no overlay catcher */}

      <LimitModal
        visible={showSignupNudge}
        title="Create your account"
        message={'It takes about 1 minute. Back up your words, sync across devices, and keep your progress safe.'}
        onClose={() => setShowSignupNudge(false)}
        onSubscribe={() => { setShowSignupNudge(false); try { router.push('/profile'); } catch {} }}
        primaryText="Sign up"
        secondaryText="Not now"
      />

      <LimitModal
        visible={showRateNudge}
        title="Enjoying Vocadoo?"
        message={'Please take a moment to rate us on the app store — it really helps!'}
        onClose={() => setShowRateNudge(false)}
        onSubscribe={async () => {
          setShowRateNudge(false);
          try {
            if (Platform.OS === 'ios') {
              if (APP_STORE_ID) {
                await Linking.openURL(`itms-apps://itunes.apple.com/app/id${APP_STORE_ID}?action=write-review`);
              } else {
                await Linking.openURL('https://apps.apple.com');
              }
            } else {
              const pkg = ANDROID_PACKAGE_NAME || 'com.rustikkarim.vocabworking';
              try { await Linking.openURL(`market://details?id=${pkg}`); }
              catch { await Linking.openURL(`https://play.google.com/store/apps/details?id=${pkg}`); }
            }
          } catch {}
        }}
        primaryText="Rate now"
        secondaryText="Not now"
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1E1E1E',
  },
  dotContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    flexDirection: 'column',
    paddingTop: 16,
    paddingLeft: 16,
  },
  dotRow: {
    flexDirection: 'row',
    marginBottom: 22,
  },
  dot: {
    width: 2,
    height: 2,
    borderRadius: 1,
    marginRight: 22,
    opacity: 0.7,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 120,
  },
  header: {
    paddingHorizontal: 16,
    paddingTop: 32,
    paddingBottom: 24,
  },
  title: {
    fontSize: 37,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 8,
    fontFamily: 'Ubuntu-Bold',
  },
  subtitle: {
    fontSize: 15,
    color: '#9CA3AF',
    lineHeight: 24,
    fontFamily: 'Ubuntu-Regular',
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6B7280',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 12,
    marginHorizontal: 12,
    fontFamily: 'Ubuntu-Medium',
  },
  sectionTitleLight: {
    color: '#4B5563',
  },
  storyWordsCard: {
    marginHorizontal: 16,
    marginBottom: 12,
    padding: 16,
    borderRadius: 16,
    backgroundColor: '#1F1F1F',
    borderWidth: 3,
    borderColor: '#1A1A1A',
    shadowColor: '#000',
    shadowOpacity: 0.4,
    shadowRadius: 0,
    shadowOffset: { width: 2, height: 3 },
    elevation: 5,
  },
  storyWordsCardLight: {
    backgroundColor: '#FFFFFF',
    borderColor: '#1A1A1A',
    shadowColor: '#000',
    shadowOpacity: 0.15,
    shadowRadius: 0,
    shadowOffset: { width: 2, height: 3 },
    elevation: 4,
  },
  storyViewedLabel: {
    fontSize: 12,
    color: '#9CA3AF',
    fontFamily: 'Ubuntu-Medium',
  },
  storyViewedLabelLight: {
    color: '#6B7280',
  },
  storyBubble: {
    minWidth: 80,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 999,
    backgroundColor: '#111827',
    borderWidth: 1,
    borderColor: '#374151',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.25,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 3 },
    elevation: 5,
  },
  storyBubbleLight: {
    backgroundColor: '#F3E8FF',
    borderColor: '#DDD6FE',
    shadowColor: '#4B5563',
    shadowOpacity: 0.18,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 3 },
    elevation: 4,
  },
  storyBubbleText: {
    color: '#F9FAFB',
    fontSize: 14,
    fontWeight: '800',
    fontFamily: 'Ubuntu-Bold',
  },
  storyBubbleTextLight: {
    color: '#111827',
  },
  storyDetailCard: {
    marginTop: 10,
    marginHorizontal: 16,
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderRadius: 14,
    backgroundColor: '#111827',
  },
  storyDetailCardLight: {
    backgroundColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOpacity: 0.12,
    shadowRadius: 9,
    shadowOffset: { width: 0, height: 4 },
    elevation: 5,
  },
  storyDetailWord: {
    fontSize: 17,
    fontWeight: '800',
    color: '#F9FAFB',
    marginBottom: 4,
    fontFamily: 'Ubuntu-Bold',
  },
  storyDetailWordLight: {
    color: '#0D3B4A',
  },
  storyDetailDefinition: {
    fontSize: 14,
    color: '#E5E7EB',
    marginBottom: 6,
    fontFamily: 'Ubuntu-Regular',
  },
  storyDetailDefinitionLight: {
    color: '#4B5563',
  },
  storyDetailExample: {
    fontSize: 14,
    color: '#9CA3AF',
    fontStyle: 'italic',
    fontFamily: 'Ubuntu-Regular',
  },
  storyDetailExampleLight: {
    color: '#6B7280',
  },
  storyViewerOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.92)',
  },
  storyViewerPressable: {
    flex: 1,
  },
  storyViewerBackground: {
    flex: 1,
    justifyContent: 'space-between',
  },
  storyBackgroundBlob: {
    position: 'absolute',
    width: 220,
    height: 220,
    borderRadius: 120,
    top: '8%',
    right: -50,
    opacity: 0.35,
    transform: [{ rotate: '18deg' }],
  },
  storyBackgroundIconWrapper: {
    position: 'absolute',
    top: '28%',
    left: '50%',
    marginLeft: -44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  storyViewerShade: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.35)',
  },
  storyViewerTop: {
    paddingHorizontal: 12,
    paddingRight: 56,
    paddingBottom: 14,
  },
  storyViewerProgressRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  storyViewerProgressTrack: {
    flex: 1,
    height: 3,
    borderRadius: 999,
    backgroundColor: 'rgba(255,255,255,0.35)',
    overflow: 'hidden',
  },
  storyViewerProgressFill: {
    height: '100%',
    backgroundColor: '#FFFFFF',
    borderRadius: 999,
  },
  storyViewerCloseBtn: {
    position: 'absolute',
    right: 12,
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: 'rgba(0,0,0,0.35)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  storyViewerCloseText: {
    color: '#FFFFFF',
    fontSize: 22,
    fontWeight: '800',
  },
  storyViewerBottom: {
    paddingHorizontal: 16,
    paddingTop: 12,
  },
  storyViewerCard: {
    backgroundColor: 'rgba(17,24,39,0.72)',
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.14)',
  },
  storyViewerWord: {
    fontSize: 32,
    fontWeight: '900',
    color: '#FFFFFF',
    marginBottom: 8,
    fontFamily: 'Ubuntu-Bold',
  },
  storyViewerDefinition: {
    fontSize: 16,
    lineHeight: 22,
    color: 'rgba(255,255,255,0.92)',
    fontFamily: 'Ubuntu-Regular',
  },
  storyViewerExample: {
    marginTop: 10,
    fontSize: 15,
    lineHeight: 21,
    color: 'rgba(255,255,255,0.82)',
    fontStyle: 'italic',
    fontFamily: 'Ubuntu-Regular',
  },
  storyViewerHint: {
    marginTop: 12,
    textAlign: 'center',
    fontSize: 12,
    color: 'rgba(255,255,255,0.75)',
    fontFamily: 'Ubuntu-Medium',
  },
  card: {
    backgroundColor: '#2C2C2C',
    marginHorizontal: 12,
    marginBottom: 8,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#333',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.12,
    shadowRadius: 5,
    elevation: 4,
  },
  // Grid tiles
  gridWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
  },
  gridItem: {
    width: '48%',
  },
  tile: {
    width: '100%',
    height: 190,
    backgroundColor: '#2C2C2C',
    borderRadius: 18,
    marginBottom: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#333',
    shadowColor: '#000',
    shadowOpacity: 0.14,
    shadowRadius: 7,
    shadowOffset: { width: 0, height: 4 },
    elevation: 4,
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  tileLight: {
    backgroundColor: '#FFFFFF',
    borderColor: '#E5E7EB',
    // stronger drop shadow in light mode (iOS)
    shadowColor: '#000',
    shadowOpacity: 0.18,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 7 },
    // stronger drop shadow in light mode (Android)
    elevation: 10,
  },
  tileIcon: { width: 120, height: 120, alignSelf: 'center', opacity: 0.82 },
  iconShadowWrap: {
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.24,
    shadowRadius: 7,
    shadowOffset: { width: 0, height: 4 },
    elevation: 6,
    borderRadius: 14,
    padding: 2,
  },
  // Make tile titles use the same font style as list titles
  tileTitle: {
    color: '#FFFFFF',
    fontWeight: '800',
    fontSize: 18,
    textAlign: 'center',
    marginTop: 8,
    width: '100%',
    flexWrap: 'wrap',
    fontFamily: 'Ubuntu-Bold',
  },
  cardContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 10,
  },
  cardLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  iconContainer: {
    width: 96,
    height: 96,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 6,
    marginLeft: 0,
    shadowColor: '#000',
    shadowOpacity: 0.22,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 4 },
    elevation: 6,
  },
  homeIcon: {
    width: 88,
    height: 88,
    alignSelf: 'center',
    opacity: 0.82,
  },
  cardText: {
    flex: 1,
  },
  cardTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 2,
    fontFamily: 'Ubuntu-Bold',
  },
  cardTitleLight: { color: '#111827' },
  cardSubtitle: {
    fontSize: 13,
    color: '#9CA3AF',
    lineHeight: 18,
    fontFamily: 'Ubuntu-Regular',
  },
  cardSubtitleLight: { color: '#4B5563' },
  missionCard: {
    marginHorizontal: 16,
    marginBottom: 12,
    padding: 16,
    borderRadius: 14,
    backgroundColor: 'transparent',
  },
  missionCardLight: {
    backgroundColor: '#FFFFFF',
  },
  missionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 4,
    fontFamily: 'Feather-Bold',
  },
  missionTitleLight: { color: '#111827' },
  missionSubtitle: {
    fontSize: 14,
    color: '#9CA3AF',
    lineHeight: 18,
    fontFamily: 'Feather-Bold',
  },
  missionSubtitleLight: { color: '#6B7280' },
  missionHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: 12,
  },
  missionPillsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 6,
  },
  timePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
    backgroundColor: 'rgba(78,217,203,0.15)',
  },
  timePillText: {
    color: '#4ED9CB',
    fontWeight: '700',
    fontSize: 12,
    fontFamily: 'Feather-Bold',
  },
  timePillLight: {
    backgroundColor: 'rgba(78,217,203,0.12)',
  },
  timePillTextLight: {
    color: '#0D3B4A',
  },
  streakPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
    backgroundColor: 'rgba(242,94,134,0.12)',
    alignSelf: 'flex-start',
  },
  streakPillText: {
    color: '#F25E86',
    fontWeight: '700',
    fontSize: 12,
    fontFamily: 'Feather-Bold',
  },
  missionSteps: {
    marginTop: 12,
    gap: 8,
  },
  missionStep: {
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 10,
    backgroundColor: 'rgba(255,255,255,0.06)',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  missionStepLight: {
    backgroundColor: '#F9F1E7',
  },
  missionStepLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  missionStepIconWrap: {
    width: 28,
    height: 28,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.12)',
  },
  missionStepTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 2,
    fontFamily: 'Ubuntu-Bold',
  },
  missionStepTitleLight: { color: '#0D3B4A' },
  missionStepDesc: {
    fontSize: 13,
    color: '#E5E7EB',
    lineHeight: 17,
    fontFamily: 'Ubuntu-Regular',
  },
  missionStepDescLight: { color: '#4B5563' },
  missionProgressRow: {
    marginTop: 10,
    gap: 6,
  },
  missionProgressText: {
    fontSize: 12,
    color: '#9CA3AF',
    fontFamily: 'Feather-Bold',
  },
  missionProgressTextLight: { color: '#6B7280' },
  missionProgressBar: {
    height: 6,
    backgroundColor: '#333',
    borderRadius: 999,
    overflow: 'hidden',
  },
  missionProgressBarLight: {
    backgroundColor: '#E5E7EB',
  },
  missionProgressFill: {
    height: '100%',
    backgroundColor: '#F25E86',
    borderRadius: 999,
  },
  storyWordsCta: {
    backgroundColor: '#F25E86',
    paddingVertical: 10,
    paddingHorizontal: 32,
    borderRadius: 20,
    borderWidth: 3,
    borderColor: '#1A1A1A',
    shadowColor: '#000',
    shadowOpacity: 0.5,
    shadowRadius: 0,
    shadowOffset: { width: 2, height: 3 },
    elevation: 5,
  },
  storyWordsCtaText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
    fontFamily: 'Feather-Bold',
  },
  rewardStrip: {
    marginTop: 10,
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 12,
    backgroundColor: 'rgba(24,116,134,0.16)',
  },
  rewardStripLight: {
    backgroundColor: 'rgba(24,116,134,0.12)',
  },
  rewardText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#E5E7EB',
    fontFamily: 'Ubuntu-Medium',
  },
  rewardTextLight: { color: '#0D3B4A' },
  missionDoneForTodayRow: {
    marginTop: 10,
    alignItems: 'center',
  },
  missionDoneForTodayAnim: {
    width: 180,
    height: 52,
  },
  missionActions: {
    marginTop: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-start',
    gap: 10,
  },
  missionPrimary: {
    backgroundColor: '#F8B070',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 12,
  },
  missionPrimaryText: {
    color: '#0D3B4A',
    fontWeight: '700',
    fontSize: 14,
    fontFamily: 'Ubuntu-Bold',
  },
  missionSecondary: {
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.4)',
  },
  missionSecondaryLight: {
    borderColor: '#187486',
  },
  missionSecondaryText: {
    color: '#FFFFFF',
    fontWeight: '600',
    fontSize: 14,
    fontFamily: 'Ubuntu-Medium',
  },
  missionSecondaryTextLight: { color: '#187486' },
  missionHelper: {
    marginTop: 8,
    fontSize: 12,
    color: '#E5E7EB',
    fontFamily: 'Ubuntu-Regular',
  },
  missionHelperLight: { color: '#4B5563' },
  // Synonym Match styles
  synonymMatchCard: {
    marginHorizontal: 16,
    marginTop: 12,
    marginBottom: 16,
    paddingVertical: 16,
    paddingHorizontal: 16,
    borderRadius: 16,
    backgroundColor: '#1F1F1F',
    borderWidth: 3,
    borderColor: '#1A1A1A',
    shadowColor: '#000',
    shadowOpacity: 0.4,
    shadowRadius: 0,
    shadowOffset: { width: 2, height: 3 },
    elevation: 5,
  },
  synonymMatchCardLight: {
    backgroundColor: '#FFFFFF',
    borderColor: '#1A1A1A',
    shadowOpacity: 0.15,
  },
  synonymMatchHeader: {
    marginBottom: 16,
  },
  synonymMatchTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#E5E7EB',
    marginBottom: 4,
    fontFamily: 'Feather-Bold',
  },
  synonymMatchTitleLight: {
    color: '#111827',
  },
  synonymMatchSubtitle: {
    fontSize: 13,
    color: '#9CA3AF',
    fontFamily: 'Feather-Bold',
  },
  synonymMatchSubtitleLight: {
    color: '#6B7280',
  },
  synonymMatchDoneCard: {
    marginHorizontal: 16,
    marginBottom: 16,
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 14,
    backgroundColor: 'rgba(78,217,203,0.12)',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  synonymMatchDoneCardLight: {
    backgroundColor: 'rgba(78,217,203,0.12)',
  },
  synonymMatchDoneText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#4ED9CB',
    fontFamily: 'Feather-Bold',
  },
  synonymMatchDoneTextLight: {
    color: '#0D3B4A',
  },
  newsCard: {
    marginHorizontal: 16,
    marginBottom: 16,
    paddingVertical: 14,
    paddingHorizontal: 0,
    borderRadius: 14,
    backgroundColor: 'transparent',
    gap: 10,
  },
  newsCardLight: {
    backgroundColor: 'transparent',
    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    elevation: 3,
  },
  newsHeaderRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 10 },
  newsLabel: { fontSize: 12, fontWeight: '700', color: '#9CA3AF', textTransform: 'uppercase', letterSpacing: 0.6, fontFamily: 'Ubuntu-Bold' },
  newsLabelLight: { color: '#4B5563' },
  newsTitle: { marginTop: 4, fontSize: 18, fontWeight: '800', color: '#E5E7EB', fontFamily: 'Ubuntu-Bold' },
  newsTitleLight: { color: '#0D3B4A' },
  newsWhyMatters: { marginTop: 2, fontSize: 12, fontWeight: '700', color: '#F8B070', fontFamily: 'Ubuntu-Medium' },
  newsWhyMattersLight: { color: '#9A3412' },
  newsSummary: { marginTop: 6, fontSize: 17, lineHeight: 26, color: '#D1D5DB', fontFamily: 'Ubuntu-Regular' },
  newsSummaryLight: { color: '#374151' },
  newsGlossary: { marginTop: 12, padding: 10, borderRadius: 12, backgroundColor: 'rgba(255,255,255,0.04)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)', gap: 6 },
  newsGlossaryLight: { backgroundColor: '#F8FAFC', borderColor: '#E5E7EB' },
  newsGlossaryTitle: { fontSize: 12, fontWeight: '700', color: '#9CA3AF', textTransform: 'uppercase', letterSpacing: 0.5, fontFamily: 'Ubuntu-Bold' },
  newsGlossaryTitleLight: { color: '#6B7280' },
  vocabHeaderRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 },
  vocabTranslationToggle: { paddingHorizontal: 10, paddingVertical: 5, borderRadius: 8, borderWidth: 1 },
  vocabTranslationToggleText: { fontSize: 11, fontWeight: '600', fontFamily: 'Ubuntu-Medium' },
  newsGlossaryItem: { fontSize: 13, color: '#D1D5DB', lineHeight: 18, fontFamily: 'Ubuntu-Regular' },
  newsGlossaryItemLight: { color: '#4B5563' },
  newsControlsRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 6, flexWrap: 'wrap' },
  newsChip: { paddingHorizontal: 8, paddingVertical: 6, borderRadius: 10, borderWidth: 1, borderColor: 'rgba(255,255,255,0.2)', backgroundColor: 'rgba(255,255,255,0.08)' },
  newsChipLight: { borderColor: '#E5E7EB', backgroundColor: '#F3F4F6' },
  newsChipActive: { borderColor: '#F8B070', backgroundColor: 'rgba(248,176,112,0.2)' },
  newsChipActiveLight: { borderColor: '#F8B070', backgroundColor: 'rgba(248,176,112,0.15)' },
  newsChipText: { fontSize: 11, fontWeight: '700', color: '#D1D5DB' },
  newsChipTextActive: { color: '#0D3B4A' },
  newsStatus: { marginTop: 6, fontSize: 11, color: '#9CA3AF', fontFamily: 'Ubuntu-Medium' },
  newsStatusLight: { color: '#6B7280' },
  newsSettingsBtn: { paddingHorizontal: 10, paddingVertical: 6, borderRadius: 10, borderWidth: 1, borderColor: 'rgba(255,255,255,0.2)' },
  newsSettingsBtnLight: { borderColor: '#E5E7EB', backgroundColor: '#F9FAFB' },
  newsSettingsBtnActive: { borderColor: '#F8B070', backgroundColor: 'rgba(248,176,112,0.15)' },
  newsSettingsIcon: { fontSize: 16, fontWeight: '800', color: '#E5E7EB' },
  newsSettingsIconLight: { color: '#0D3B4A' },
  newsSettingsText: { fontSize: 12, fontWeight: '800', color: '#E5E7EB', fontFamily: 'Ubuntu-Bold' },
  newsSettingsTextLight: { color: '#0D3B4A' },
  newsSettingsCard: { marginTop: 8, padding: 10, borderRadius: 12, backgroundColor: 'rgba(255,255,255,0.06)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.12)', gap: 6 },
  newsSettingsCardLight: { backgroundColor: '#F8FAFC', borderColor: '#E5E7EB' },
  newsSettingsLabel: { fontSize: 11, fontWeight: '700', color: '#9CA3AF', textTransform: 'uppercase', letterSpacing: 0.4, marginTop: 4, fontFamily: 'Ubuntu-Bold' },
  newsSettingsLabelLight: { color: '#6B7280' },
  newsHeroShell: { marginTop: 8, borderRadius: 14, backgroundColor: 'rgba(255,255,255,0.03)', overflow: 'hidden', padding: 10, gap: 10 },
  newsHeroShellLight: { backgroundColor: '#F9FAFB' },
  newsHeroImageWrap: { height: 180, borderRadius: 12, overflow: 'hidden', position: 'relative' },
  newsHeroImageWrapLight: {},
  newsHeroImage: { width: '100%', height: '100%' },
  newsHeroOverlay: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.25)' },
  newsHeroBadgeRow: { position: 'absolute', top: 10, left: 10, flexDirection: 'row', alignItems: 'center', gap: 8 },
  newsHeroBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12, backgroundColor: '#F8B070', color: '#0D3B4A', fontWeight: '800', fontSize: 11 },
  newsHeroBadgeLight: { backgroundColor: '#FDE9D9', color: '#0D3B4A' },
  newsHeroBadgeMuted: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12, backgroundColor: 'rgba(15,26,36,0.55)', color: '#E5E7EB', fontWeight: '700', fontSize: 11 },
  newsHeroBadgeMutedLight: { backgroundColor: 'rgba(255,255,255,0.9)', color: '#0D3B4A' },
  newsHeroStatusPill: { position: 'absolute', bottom: 10, left: 10, paddingHorizontal: 12, paddingVertical: 6, borderRadius: 999, backgroundColor: 'rgba(13,59,74,0.85)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.15)' },
  newsHeroStatusPillLight: { backgroundColor: 'rgba(255,255,255,0.92)', borderColor: '#E5E7EB' },
  newsHeroStatusText: { color: '#E5E7EB', fontWeight: '700', fontSize: 12 },
  newsHeroStatusTextLight: { color: '#0D3B4A' },
  newsHeroContent: { paddingTop: 8, gap: 6 },
  // Generic text-only toggle (used for "Close" in the news modal and inline links)
  newsToggleBtn: {
    marginTop: 6,
    alignSelf: 'flex-start',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 10,
    backgroundColor: 'transparent',
  },
  newsToggleText: { color: '#F8B070', fontWeight: '700', fontSize: 12 },
  newsToggleTextLight: { color: '#0D3B4A' },
  newsToggleInline: { marginTop: 2 },
  newsCarouselSection: { marginTop: 14, gap: 8 },
  newsPreviewCard: { width: 220, height: 150, borderRadius: 14, overflow: 'hidden', backgroundColor: '#111827', borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)' },
  newsPreviewCardLight: { backgroundColor: '#FFFFFF', borderColor: '#E5E7EB' },
  newsPreviewImage: { width: '100%', height: '100%', position: 'absolute', top: 0, left: 0 },
  newsPreviewOverlay: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.28)' },
  newsPreviewCopy: { position: 'absolute', left: 10, right: 10, bottom: 10, gap: 4 },
  newsPreviewTag: { color: '#F8B070', fontWeight: '800', fontSize: 11 },
  newsPreviewTagLight: { color: '#9A3412' },
  newsPreviewTitle: { color: '#FFFFFF', fontWeight: '800', fontSize: 14, fontFamily: 'Ubuntu-Bold' },
  newsPreviewTitleLight: { color: '#0D3B4A' },
  newsPreviewSummary: { color: '#E5E7EB', fontSize: 12, lineHeight: 16, fontFamily: 'Ubuntu-Regular' },
  newsPreviewSummaryLight: { color: '#374151' },
  newsExtraList: { marginTop: 14, gap: 10 },
  newsExtraRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 10, padding: 10, borderRadius: 12, backgroundColor: 'rgba(255,255,255,0.05)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.12)' },
  newsExtraRowLight: { backgroundColor: '#F8FAFC', borderColor: '#E5E7EB' },
  newsExtraThumb: { width: 64, height: 64, borderRadius: 12, backgroundColor: '#111827' },
  newsExtraTitle: { fontSize: 14, fontWeight: '800', color: '#E5E7EB', fontFamily: 'Ubuntu-Bold' },
  newsExtraTitleLight: { color: '#0D3B4A' },
  newsExtraSummary: { fontSize: 13, lineHeight: 18, color: '#D1D5DB', fontFamily: 'Ubuntu-Regular' },
  newsExtraSummaryLight: { color: '#4B5563' },
  newsModalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.35)', justifyContent: 'flex-end' },
  newsModalBackdrop: { flex: 1 },
  newsModalSheet: { backgroundColor: '#1E1E1E', borderTopLeftRadius: 18, borderTopRightRadius: 18, padding: 18, paddingBottom: 0, maxHeight: '98%' },
  newsModalSheetLight: { backgroundColor: '#FFFFFF' },
  newsModalHandle: { width: 42, height: 4, borderRadius: 999, alignSelf: 'center', backgroundColor: '#4B5563', marginBottom: 12 },
  newsModalHandleLight: { backgroundColor: '#E5E7EB' },
  newsModalImage: { width: '100%', height: 180, borderRadius: 12, marginBottom: 12 },
  newsModalTagRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 6 },
  newsModalTag: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12, backgroundColor: '#F8B070', color: '#0D3B4A', fontWeight: '800', fontSize: 12 },
  newsModalTagMuted: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12, backgroundColor: 'rgba(255,255,255,0.08)', color: '#E5E7EB', fontWeight: '700', fontSize: 12 },
  newsModalTitle: { fontSize: 20, fontWeight: '800', color: '#E5E7EB', fontFamily: 'Ubuntu-Bold', marginTop: 4 },
  newsModalTitleLight: { color: '#0D3B4A' },
  newsModalOriginalTitle: { marginTop: 6, fontSize: 12, color: '#9CA3AF', fontFamily: 'Ubuntu-Medium' },
  newsModalOriginalTitleLight: { color: '#6B7280' },
  newsModalWhy: { marginTop: 8, fontSize: 14, lineHeight: 19, color: '#E5E7EB', opacity: 0.9, fontFamily: 'Ubuntu-Regular' },
  newsModalWhyLight: { color: '#374151' },
  newsModalSummary: { marginTop: 8, fontSize: 17, lineHeight: 27, color: '#D1D5DB', fontFamily: 'Ubuntu-Regular', flexShrink: 1, width: '100%', flexWrap: 'wrap' },
  newsModalSummaryLight: { color: '#374151' },
  offerRow: {
    marginTop: 8,
    gap: 6,
  },
  offerCountdownPill: {
    alignSelf: 'flex-start',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 10,
    backgroundColor: 'rgba(124,231,160,0.14)',
  },
  offerCountdownText: {
    color: '#0b1a2d',
    fontWeight: '700',
    fontSize: 12,
  },
  offerPriceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  offerOldPrice: {
    textDecorationLine: 'line-through',
    color: '#6B7280',
    fontSize: 14,
  },
  offerNewPrice: {
    color: '#0b1a2d',
    fontSize: 16,
    fontWeight: '800',
  },
  cardLight: {
    backgroundColor: '#FFFFFF',
    borderColor: '#FFFFFF',
    // stronger drop shadow in light mode (iOS)
    shadowColor: '#000',
    shadowOpacity: 0.12,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 6 },
    // stronger drop shadow in light mode (Android)
    elevation: 6,
  },
  bottomSpacing: {
    height: 64,
  },
  fab: {
    position: 'absolute',
    bottom: 50,
    right: 24,
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: '#88BBF5',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.25,
    shadowRadius: 6,
    elevation: 6,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    marginBottom: 8,
  },
  headerArea: {
    width: '100%',
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 10,
  },
  streakPillInline: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 16,
    minHeight: 26,
    backgroundColor: 'rgba(26,32,36,0.9)',
    borderWidth: 1,
    borderColor: 'rgba(248,176,112,0.35)',
    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
  },
  streakPillLight: { backgroundColor: '#FFF7ED', borderColor: '#FBD38D' },
  streakText: { color: '#FFFFFF', fontWeight: '800', fontSize: 14 },
  streakTextLight: { color: '#0D3B4A' },

  subBtnInline: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    minHeight: 30,
    backgroundColor: '#B6E0E2',
    borderWidth: 1,
    borderColor: '#93CBD0',
    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
  },
  subBtnLight: { backgroundColor: '#B6E0E2', borderColor: '#7FB2B6' },
  subBtnText: { color: '#0D3B4A', fontWeight: '800', fontSize: 14 },
  offerBtnInline: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    minHeight: 24,
    backgroundColor: '#7CE7A0',
    borderWidth: 1,
    borderColor: '#5FC789',
    shadowColor: '#7CE7A0',
    shadowOpacity: 0.2,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
  },
  offerBtnText: { color: '#0b1a2d', fontWeight: '800', fontSize: 11 },
  headerRightRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  // Header icon pill (for Tiles/List toggle)
  headerIconBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 12, paddingVertical: 6, borderRadius: 16, minHeight: 30, backgroundColor: '#CCE2FC', borderWidth: 1, borderColor: '#B3D6FA', shadowColor: '#000', shadowOpacity: 0.06, shadowRadius: 6, shadowOffset: { width: 0, height: 2 } },
  headerIconBtnLight: { backgroundColor: '#CCE2FC', borderColor: '#B3D6FA' },
  // Translate pill (pink)
  translateBtnInline: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 12, paddingVertical: 6, borderRadius: 16, minHeight: 30, backgroundColor: '#F09898', borderWidth: 1, borderColor: '#E08181', shadowColor: '#000', shadowOpacity: 0.06, shadowRadius: 6, shadowOffset: { width: 0, height: 2 } },
  translateBtnLight: { backgroundColor: '#F09898', borderColor: '#E08181' },

  // FAB menu
  menuOverlay: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 },
  menuCard: {
    position: 'absolute',
    right: 24,
    bottom: 96,
    backgroundColor: '#2C2C2C',
    borderRadius: 12,
    paddingVertical: 8,
    minWidth: 180,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 12,
  },
  menuCardLight: { backgroundColor: '#FFFFFF', borderWidth: StyleSheet.hairlineWidth, borderColor: '#E5E7EB' },
  menuItem: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: 12, paddingVertical: 10 },
  menuText: { color: '#E5E7EB', fontFamily: 'Ubuntu-Medium' },
  menuTextLight: { color: '#111827' },
  menuDivider: { height: StyleSheet.hairlineWidth, backgroundColor: 'rgba(255,255,255,0.15)' },

  // Celebration overlay
  celebrateOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  celebrateCard: {
    width: '90%',
    maxWidth: 380,
    borderRadius: 28,
    alignItems: 'center',
    paddingVertical: 32,
    paddingHorizontal: 24,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(78, 217, 203, 0.2)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 16 },
    shadowOpacity: 0.4,
    shadowRadius: 32,
    elevation: 16,
  },
  celebrateGlow: {
    position: 'absolute',
    top: -100,
    left: '50%',
    marginLeft: -150,
    width: 300,
    height: 300,
    borderRadius: 150,
    backgroundColor: 'rgba(78, 217, 203, 0.06)',
  },
  celebrateFlameWrap: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: 'transparent',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  celebrateCountWrap: {
    marginTop: 8,
  },
  celebrateCount: { fontSize: 72, color: '#F8B070', fontWeight: '900', lineHeight: 80 },
  celebrateCountLight: { color: '#E06620' },
  celebrateLabel: { color: '#9CA3AF', fontWeight: '700', fontSize: 16, textTransform: 'uppercase', letterSpacing: 2, marginTop: -4 },
  celebrateLabelLight: { color: '#6B7280' },
  celebrateWeekRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 20,
    gap: 8,
  },
  celebrateDayCol: {
    alignItems: 'center',
    gap: 6,
  },
  celebrateDayLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#6B7280',
  },
  celebrateDayDot: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderWidth: 1.5,
    borderColor: 'rgba(255,255,255,0.08)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  celebrateDayDotActive: {
    backgroundColor: 'rgba(78, 217, 203, 0.15)',
    borderColor: 'rgba(78, 217, 203, 0.4)',
  },
  celebrateDayDotToday: {
    backgroundColor: '#4ED9CB',
    borderColor: '#4ED9CB',
    shadowColor: '#4ED9CB',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
  },
  celebrateDayCheck: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  celebrateHint: { marginTop: 20, color: '#9CA3AF', textAlign: 'center', fontSize: 15, lineHeight: 22 },
  celebrateHintLight: { color: '#6B7280' },
  celebrateBtn: { marginTop: 24, borderRadius: 16, overflow: 'hidden' },
  celebrateBtnGradient: {
    paddingHorizontal: 48,
    paddingVertical: 16,
    alignItems: 'center',
  },
  celebrateBtnText: { color: '#FFFFFF', fontWeight: '800', fontSize: 17, letterSpacing: 0.5 },
  navBar: { paddingHorizontal: 12, gap: 10 },
  navItem: { paddingVertical: 10, paddingHorizontal: 12, borderRadius: 14, backgroundColor: '#2A3033', borderWidth: 1, borderColor: '#364147', marginRight: 10, alignItems: 'center', width: 84 },
  navItemLight: { backgroundColor: '#E9F4F1', borderColor: '#D7E7E2' },
  navIconWrap: { width: 42, height: 42, borderRadius: 12, backgroundColor: 'rgba(255,255,255,0.18)', alignItems: 'center', justifyContent: 'center', marginBottom: 6 },
  navIcon: { width: 28, height: 28 },
  navLabel: { color: '#E5E7EB', fontWeight: '700', fontSize: 12, textAlign: 'center' },
  navLabelLight: { color: '#0D3B4A' },

  // Magazine-style article layout
  magazineHeroCard: {
    borderRadius: 16,
    overflow: 'hidden',
    backgroundColor: '#1A1A1A',
    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 6 },
    elevation: 6,
    height: 200,
  },
  magazineHeroCardLight: {
    backgroundColor: '#FFFFFF',
    shadowOpacity: 0.1,
  },
  magazineHeroImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
    position: 'absolute',
  },
  magazineHeroGradient: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: '100%',
    backgroundColor: 'rgba(255,255,255,0.55)',
  },
  magazineHeroGradientOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: '100%',
    backgroundColor: 'rgba(0,0,0,0.45)',
    borderRadius: 16,
  },
  magazineHeroOverlayContent: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 14,
  },
  magazineTag: {
    backgroundColor: '#F8B070',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
    alignSelf: 'flex-start',
  },
  magazineTagLight: {
    backgroundColor: '#F8B070',
  },
  magazineTagText: {
    color: '#0D3B4A',
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  magazineHeroTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: '#0D3B4A',
    lineHeight: 22,
    textShadowColor: 'rgba(0, 0, 0, 0.5)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },
  magazineHeroSummary: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.8)',
    lineHeight: 18,
    marginTop: 4,
  },
  magazineVocabRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginTop: 8,
  },
  magazineVocabChip: {
    backgroundColor: 'rgba(13,59,74,0.12)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  magazineVocabText: {
    color: '#0D3B4A',
    fontSize: 11,
    fontWeight: '700',
  },
  magazineDualRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 4,
  },
  magazineDualCardWrap: {
    flex: 1,
  },
  magazineDualCard: {
    borderRadius: 16,
    backgroundColor: '#1E1E1E',
    overflow: 'hidden',
  },
  magazineDualCardLight: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderBottomWidth: 4,
  },
  magazineDualImage: {
    width: '100%',
    height: 100,
    borderRadius: 10,
    resizeMode: 'cover',
    marginHorizontal: 10,
    marginTop: 10,
    alignSelf: 'center',
  },
  magazineDualContent: {
    padding: 12,
  },
  magazineSmallTag: {
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 5,
    marginBottom: 6,
  },
  magazineSmallTagText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  magazineDualTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#FFFFFF',
    lineHeight: 18,
  },
  magazineDualTitleLight: {
    color: '#111827',
  },
  magazineDualVocab: {
    fontSize: 11,
    color: 'rgba(255,255,255,0.6)',
    marginTop: 6,
  },
  magazineListCard: {
    flexDirection: 'row',
    borderRadius: 14,
    backgroundColor: '#1E1E1E',
    minHeight: 120,
    overflow: 'hidden',
    borderTopLeftRadius: 2,
    borderBottomLeftRadius: 2,
  },
  magazineListCardLight: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderLeftWidth: 4,
  },
  magazineListImage: {
    width: 130,
    height: '100%',
    borderTopRightRadius: 14,
    borderBottomRightRadius: 14,
    resizeMode: 'cover',
  },
  magazineListContent: {
    flex: 1,
    paddingVertical: 12,
    paddingLeft: 14,
    paddingRight: 8,
    justifyContent: 'center',
  },
  magazineListTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FFFFFF',
    lineHeight: 19,
    marginTop: 4,
  },
  magazineListTitleLight: {
    color: '#111827',
  },
  magazineListVocab: {
    fontSize: 11,
    color: 'rgba(255,255,255,0.55)',
    fontWeight: '600',
  },

  // Vocab Preview Modal Styles - Full screen elegant design
  vocabPreviewOverlay: {
    flex: 1,
    backgroundColor: '#1A1A1A',
  },
  vocabPreviewOverlayLight: {
    backgroundColor: '#F5F5F5',
  },
  vocabPreviewSafeArea: {
    flex: 1,
    paddingHorizontal: 24,
  },
  vocabPreviewCloseBtn: {
    alignSelf: 'flex-end',
    padding: 8,
    marginTop: 8,
  },
  vocabPreviewHeaderNew: {
    alignItems: 'center',
    marginTop: 8,
    marginBottom: 24,
  },
  vocabPreviewBadge: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 20,
    marginBottom: 12,
  },
  vocabPreviewBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
  vocabPreviewArticleTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#9CA3AF',
    textAlign: 'center',
    paddingHorizontal: 20,
    lineHeight: 22,
    fontFamily: 'Ubuntu-Medium',
  },
  vocabPreviewProgressContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 32,
  },
  vocabPreviewProgressBg: {
    flex: 1,
    height: 6,
    backgroundColor: '#2A2A2A',
    borderRadius: 3,
    overflow: 'hidden',
  },
  vocabPreviewProgressFill: {
    height: '100%',
    backgroundColor: '#437F76',
    borderRadius: 3,
  },
  vocabPreviewProgressText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#6B7280',
    minWidth: 36,
    textAlign: 'right',
  },
  vocabPreviewCardNew: {
    flex: 1,
    backgroundColor: '#252525',
    borderRadius: 28,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: '#333',
  },
  vocabPreviewCardNewLight: {
    backgroundColor: '#FFFFFF',
    borderColor: '#E5E7EB',
  },
  vocabPreviewCardTouchable: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  vocabPreviewCardFront: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  vocabPreviewWordNew: {
    fontSize: 42,
    fontWeight: '800',
    color: '#FFFFFF',
    textAlign: 'center',
    marginBottom: 40,
    fontFamily: 'Ubuntu-Bold',
  },
  vocabPreviewTapHint: {
    alignItems: 'center',
    gap: 8,
  },
  vocabPreviewTapIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#333',
    alignItems: 'center',
    justifyContent: 'center',
  },
  vocabPreviewTapText: {
    fontSize: 13,
    color: '#6B7280',
    fontFamily: 'Ubuntu-Regular',
  },
  vocabPreviewCardBackScroll: {
    flex: 1,
    width: '100%',
  },
  vocabPreviewCardBack: {
    alignItems: 'center',
    paddingVertical: 8,
  },
  vocabPreviewWordBack: {
    fontSize: 28,
    fontWeight: '700',
    color: '#437F76',
    textAlign: 'center',
    marginBottom: 4,
    fontFamily: 'Ubuntu-Bold',
  },
  vocabPreviewSynonyms: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
    marginBottom: 12,
    fontFamily: 'Ubuntu-Regular',
    fontStyle: 'italic',
  },
  vocabPreviewDivider: {
    width: 60,
    height: 3,
    backgroundColor: '#333',
    borderRadius: 2,
    marginBottom: 16,
  },
  vocabPreviewDefinitionNew: {
    fontSize: 17,
    fontWeight: '500',
    color: '#E5E7EB',
    textAlign: 'center',
    lineHeight: 26,
    paddingHorizontal: 8,
    fontFamily: 'Ubuntu-Medium',
  },
  vocabPreviewTranslationBox: {
    marginTop: 16,
    paddingHorizontal: 20,
    paddingVertical: 14,
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderRadius: 14,
    width: '100%',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
  },
  vocabPreviewTranslationBoxLight: {
    backgroundColor: 'rgba(0,0,0,0.03)',
    borderColor: 'rgba(0,0,0,0.06)',
  },
  vocabPreviewTranslationLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: 'rgba(255,255,255,0.45)',
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 4,
    textAlign: 'center',
  },
  vocabPreviewTranslationLabelLight: {
    color: '#9CA3AF',
  },
  vocabPreviewTranslationNew: {
    fontSize: 18,
    color: '#FFFFFF',
    fontWeight: '600',
    textAlign: 'center',
    fontFamily: 'Ubuntu-Medium',
  },
  vocabPreviewTranslationNewLight: {
    color: '#374151',
  },
  vocabPreviewLoadingInBox: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.5)',
    textAlign: 'center',
    marginTop: 12,
    fontStyle: 'italic',
  },
  vocabPreviewExampleInBox: {
    marginTop: 14,
    paddingTop: 14,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.1)',
  },
  vocabPreviewExampleInBoxLight: {
    borderTopColor: 'rgba(0,0,0,0.08)',
  },
  vocabPreviewExampleLabelInBox: {
    fontSize: 10,
    fontWeight: '700',
    color: 'rgba(255,255,255,0.45)',
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 6,
    textAlign: 'center',
  },
  vocabPreviewExampleLabelInBoxLight: {
    color: '#9CA3AF',
  },
  vocabPreviewExampleTextInBox: {
    fontSize: 15,
    color: 'rgba(255,255,255,0.85)',
    lineHeight: 22,
    fontStyle: 'italic',
    fontFamily: 'Ubuntu-Regular',
    textAlign: 'center',
  },
  vocabPreviewExampleTextInBoxLight: {
    color: '#4B5563',
  },
  vocabPreviewExampleBox: {
    marginTop: 16,
    paddingHorizontal: 16,
    paddingVertical: 14,
    backgroundColor: '#2A2A2A',
    borderRadius: 14,
    width: '100%',
    borderWidth: 1,
    borderColor: '#333',
  },
  vocabPreviewExampleLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: '#6B7280',
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 6,
  },
  vocabPreviewExampleText: {
    fontSize: 15,
    color: '#D1D5DB',
    lineHeight: 22,
    fontStyle: 'italic',
    fontFamily: 'Ubuntu-Regular',
  },
  vocabPreviewLoadingBox: {
    marginTop: 16,
    paddingVertical: 12,
  },
  vocabPreviewLoadingText: {
    fontSize: 13,
    color: '#6B7280',
    textAlign: 'center',
    fontFamily: 'Ubuntu-Regular',
  },
  vocabPreviewBottomActions: {
    flexDirection: 'row',
    gap: 12,
    paddingBottom: 16,
  },
  vocabPreviewSkipBtnNew: {
    flex: 1,
    paddingVertical: 16,
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: '#333',
    alignItems: 'center',
    justifyContent: 'center',
  },
  vocabPreviewSkipTextNew: {
    fontSize: 15,
    fontWeight: '600',
    color: '#9CA3AF',
    fontFamily: 'Ubuntu-Medium',
  },
  vocabPreviewNextBtn: {
    flex: 1.5,
    paddingVertical: 16,
    borderRadius: 16,
    backgroundColor: '#437F76',
    alignItems: 'center',
    justifyContent: 'center',
  },
  vocabPreviewNextBtnText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
    fontFamily: 'Ubuntu-Bold',
  },

});

import Constants from 'expo-constants';
import { Platform } from 'react-native';
import aiService from './AIService';

export type StoryLevel = 'Beginner' | 'Intermediate' | 'Advanced';

export interface StoryGenerationOptions {
  words: string[];
  level: StoryLevel;
  genre: string;
  tone: string;
}

export interface GeneratedStory {
  storyWithBlanks: string;
  rawStory: string;
}

const OPENAI_ENDPOINT = 'https://api.openai.com/v1/chat/completions';
const MODEL = 'gpt-4o';

const DEFAULT_PORT = '4000';
const API_PORT =
  (process.env.EXPO_PUBLIC_API_PORT as string | undefined) ||
  ((Constants as any)?.expoConfig?.extra?.API_PORT as string | undefined) ||
  DEFAULT_PORT;

function sanitizeBase(base: string | null): string | null {
  if (!base) return null;
  try {
    const u = new URL(base);
    const host = u.hostname;
    // On physical devices, localhost is the device itself (not the dev machine)
    if (Constants.isDevice && (host === 'localhost' || host === '127.0.0.1')) {
      return null;
    }
    // Android emulator needs 10.0.2.2 to access host machine
    if (!Constants.isDevice && Platform.OS === 'android' && (host === 'localhost' || host === '127.0.0.1')) {
      return base.replace(host, '10.0.2.2');
    }
    return base;
  } catch {
    return base;
  }
}

function getApiBaseUrl(): string | null {
  const fromEnv = (process.env.EXPO_PUBLIC_API_BASE_URL as string | undefined) || null;
  if (fromEnv) return sanitizeBase(fromEnv.replace(/\/$/, ''));

  const anyC: any = Constants as any;
  const candidates: Array<string | undefined> = [
    anyC?.expoConfig?.hostUri,
    anyC?.expoConfig?.debuggerHost,
    anyC?.manifest?.debuggerHost,
    anyC?.manifest2?.extra?.expoClient?.hostUri,
    anyC?.expoGoConfig?.hostUri,
    anyC?.expoGoConfig?.debuggerHost,
  ];

  const parseHost = (raw: string): string | null => {
    try {
      const withoutScheme = raw.includes('://') ? raw.split('://')[1] : raw;
      const firstSegment = withoutScheme.split('/')[0];
      const hostPart = firstSegment.split(':')[0];
      if (!hostPart) return null;
      if (Platform.OS === 'android' && (hostPart === 'localhost' || hostPart === '127.0.0.1')) {
        return '10.0.2.2';
      }
      return hostPart;
    } catch {
      return null;
    }
  };

  for (const cand of candidates) {
    if (typeof cand === 'string' && cand.length) {
      const host = parseHost(cand);
      if (host) return sanitizeBase(`http://${host}:${API_PORT}`);
    }
  }

  const extra = (Constants?.expoConfig?.extra as Record<string, string> | undefined) || undefined;
  const fromExtra = extra?.API_BASE_URL || null;
  if (fromExtra) return sanitizeBase(fromExtra.replace(/\/$/, ''));

  if (__DEV__ && !Constants.isDevice) {
    const simulatorHost = Platform.OS === 'android' ? '10.0.2.2' : 'localhost';
    return sanitizeBase(`http://${simulatorHost}:${API_PORT}`);
  }

  return null;
}

function getApiKey(): string {
  const fromEnv = process.env.EXPO_PUBLIC_OPENAI_API_KEY || process.env.OPENAI_API_KEY;
  const fromConstants = (Constants?.expoConfig?.extra as Record<string, string> | undefined)?.OPENAI_API_KEY;
  const key = fromEnv || fromConstants;
  if (!key) {
    throw new Error('Missing OpenAI API key. Set EXPO_PUBLIC_OPENAI_API_KEY in your environment or app config.');
  }
  return key;
}

function escapeRegExp(s: string) {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function makeRaw(contentWithMarkup: string): string {
  return contentWithMarkup.replace(/\*\*([\s\S]+?)\*\*/g, '$1');
}

function makeStoryWithBlanks(contentWithMarkup: string, words: string[]): string {
  const targets = words.map(w => w.trim()).filter(Boolean);

  // First, try to blank out the explicitly marked tokens (**word**), in order of appearance
  let blankIndex = 0;
  const assigned = new Map<string, number>(); // normalized word -> BLANK_#

  const replaced = contentWithMarkup.replace(/\*\*([\s\S]+?)\*\*/g, (full, inner) => {
    const norm = String(inner).trim().toLowerCase();
    const matched = targets.find(w => w.toLowerCase() === norm);
    if (!matched) {
      // Not a target word (unexpected). Remove bold.
      return inner;
    }
    if (!assigned.has(norm)) {
      blankIndex += 1;
      assigned.set(norm, blankIndex);
    }
    const idx = assigned.get(norm)!;
    return `[[BLANK_${idx}]]`;
  });

  // If no blanks were created (model forgot to bold), fall back to replacing plain words sequentially
  if (blankIndex === 0) {
    let out = contentWithMarkup;
    for (let i = 0; i < targets.length; i++) {
      const w = targets[i];
      const re = new RegExp(`\\b${escapeRegExp(w)}\\b`, 'i');
      out = out.replace(re, () => `[[BLANK_${i + 1}]]`);
    }
    return out.replace(/\*\*([\s\S]+?)\*\*/g, '$1'); // strip any leftover bold
  }

  // Clean any leftover unmatched bold markup
  return replaced.replace(/\*\*/g, '');
}

export async function generateStory(options: StoryGenerationOptions): Promise<GeneratedStory> {
  const words = options.words.slice(0, 5).map(w => w.trim()).filter(Boolean);
  if (words.length !== 5) {
    throw new Error('Please provide exactly five words.');
  }

  // Map level to AI difficulty; keep a medium length for readability
  const difficulty =
    options.level === 'Beginner' ? 'easy' : options.level === 'Intermediate' ? 'medium' : 'hard';
  const length: 'short' | 'medium' | 'long' = 'medium';

  const story = await aiService.generateStory(
    words.map((w, idx) => ({ id: String(idx + 1), word: w, definition: '', example: '' })),
    {
      genre: (options.genre?.toLowerCase?.() as any) || 'adventure',
      difficulty: difficulty as any,
      length,
      tone: (options.tone?.toLowerCase?.() as any) || 'casual',
    }
  );

  const rawStory = makeRaw(story.content || '');
  const storyWithBlanks = makeStoryWithBlanks(story.content || '', words);

  return { rawStory, storyWithBlanks };
}

export default {
  generateStory,
};

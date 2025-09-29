import Constants from 'expo-constants';
import { Platform } from 'react-native';

const DEFAULT_PORT = '4000';
const API_PORT =
  (process.env.EXPO_PUBLIC_API_PORT as string | undefined) ||
  ((Constants as any)?.expoConfig?.extra?.API_PORT as string | undefined) ||
  DEFAULT_PORT;

const OPENAI_BASE_URL = 'https://api.openai.com/v1';
const OPENAI_MODEL = 'gpt-4o-mini';

function getApiBaseUrl(): string | null {
  // 1) Prefer public env var (baked at build time)
  const fromEnv = (process.env.EXPO_PUBLIC_API_BASE_URL as string | undefined) || null;
  if (fromEnv) return fromEnv.replace(/\/$/, '');

  // 2) Try to infer a LAN host from Expo fields (works better for physical devices)
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
      // Strip scheme if present (e.g., exp://, http://)
      const withoutScheme = raw.includes('://') ? raw.split('://')[1] : raw;
      const firstSegment = withoutScheme.split('/')[0];
      const hostPart = firstSegment.split(':')[0];
      if (!hostPart) return null;
      // Android emulator cannot reach localhost of host machine directly
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
      if (host) return `http://${host}:${API_PORT}`;
    }
  }

  // 3) Prefer expo extra config (often localhost; best for simulators)
  const extra = (Constants?.expoConfig?.extra as Record<string, string> | undefined) || undefined;
  const fromExtra = extra?.API_BASE_URL || null;
  if (fromExtra) return fromExtra.replace(/\/$/, '');

  // 4) Simulator-friendly fallback; avoid on real devices
  if (__DEV__ && !Constants.isDevice) {
    const simulatorHost = Platform.OS === 'android' ? '10.0.2.2' : 'localhost';
    return `http://${simulatorHost}:${API_PORT}`;
  }

  return null;
}

let loggedBaseOnce = false;

export interface Word {
  id: string;
  word: string;
  definition: string;
  example: string;
}

export interface Story {
  id: string;
  title: string;
  content: string;
}

class AIService {
  private apiKey: string | null = null;

  constructor() {
    this.apiKey = this.resolveApiKey();
  }

  setApiKey(key: string) {
    this.apiKey = key;
  }

  private resolveApiKey(): string | null {
    const fromEnv = process.env.EXPO_PUBLIC_OPENAI_API_KEY || process.env.OPENAI_API_KEY;
    const fromConfig = (Constants?.expoConfig?.extra as Record<string, string> | undefined)?.OPENAI_API_KEY;
    return fromEnv || fromConfig || null;
  }

  private ensureApiKey() {
    if (!this.apiKey) {
      this.apiKey = this.resolveApiKey();
    }
    if (!this.apiKey) {
      throw new Error('Missing OpenAI API key. Prefer using a proxy by setting EXPO_PUBLIC_API_BASE_URL (or extra.API_BASE_URL) to your server (e.g., http://<host>:4000). If you must call OpenAI directly, set EXPO_PUBLIC_OPENAI_API_KEY or OPENAI_API_KEY.');
    }
  }

  private async callOpenAI(payload: {
    messages: Array<{ role: 'system' | 'user' | 'assistant'; content: string }>;
    temperature?: number;
    top_p?: number;
    presence_penalty?: number;
    frequency_penalty?: number;
    max_tokens?: number;
  }) {
    // If a backend API base URL is available (env/extra/dev fallback), use it to keep the key server-side.
    const base = getApiBaseUrl();
    if (base) {
      if (__DEV__ && !loggedBaseOnce) {
        console.log('[AIService] Using proxy base URL:', base);
        loggedBaseOnce = true;
      }
      const resp = await fetch(`${base.replace(/\/$/, '')}/api/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ model: OPENAI_MODEL, ...payload }),
      });
      if (!resp.ok) {
        const text = await resp.text();
        throw new Error(`Proxy API error (${resp.status}): ${text}`);
      }
      const data = await resp.json();
      const content: string | undefined = data?.content;
      if (!content) throw new Error('Proxy API returned empty content.');
      return content.trim();
    }

    // Fallback: direct call (NOT recommended for production as it exposes the key to the client bundle).
    if (__DEV__) {
      console.warn('[AIService] No proxy base URL detected. Falling back to direct OpenAI call.');
    }
    this.ensureApiKey();
    const response = await fetch(`${OPENAI_BASE_URL}/chat/completions`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${this.apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ model: OPENAI_MODEL, ...payload }),
    });

    if (!response.ok) {
      const errorBody = await response.text();
      throw new Error(`OpenAI API error (${response.status}): ${errorBody}`);
    }

    const data = await response.json();
    const content: string | undefined = data?.choices?.[0]?.message?.content;
    if (!content) throw new Error('OpenAI API returned an empty response.');
    return content.trim();
  }

  async getWordDefinition(word: string): Promise<{
    definition: string;
    example: string;
    phonetics?: string;
  } | null> {
    try {
      const response = await this.callOpenAI({
        messages: [
          {
            role: 'system',
            content:
              'You are an English vocabulary expert. Always respond with JSON: {"definition": string, "example": string, "phonetics": string?}. The definition must be concise, the example should be practical, and phonetics is optional.',
          },
          {
            role: 'user',
            content: `Provide a clear definition, example sentence, and phonetics (if available) for the word "${word}".`,
          },
        ],
        temperature: 0.2,
        max_tokens: 400,
      });

      const parsed = JSON.parse(response);
      return {
        definition: parsed.definition,
        example: parsed.example,
        phonetics: parsed.phonetics,
      };
    } catch (error) {
      console.error('Failed to fetch word definition:', error);
      return null;
    }
  }

  async generateStory(
    words: Word[],
    customization?: {
      genre: 'sci-fi' | 'romance' | 'adventure' | 'mystery' | 'fantasy' | 'comedy' | 'drama';
      difficulty: 'easy' | 'medium' | 'hard';
      length: 'short' | 'medium' | 'long';
      tone?: 'playful' | 'dramatic' | 'serious' | 'humorous' | 'wistful';
    }
  ): Promise<Story> {
    const genre = customization?.genre ?? 'fantasy';
    const difficulty = customization?.difficulty ?? 'medium';
    const tone = customization?.tone ?? (genre === 'comedy' ? 'humorous' : 'dramatic');
    const length = customization?.length ?? 'medium';

    const lengthDescription = {
      short: 'roughly one hundred and thirty words across two to three paragraphs',
      medium: 'roughly one hundred and eighty words across three paragraphs',
      long: 'roughly two hundred and ten words across three to four paragraphs',
    }[length];

    const difficultyDescription = {
      easy: 'Use CEFR A1–A2 English with clear language, simple sentence structures, and direct vocabulary choices.',
      medium: 'Use varied sentence structures and rich but accessible vocabulary.',
      hard: 'Use sophisticated sentence structures and advanced vocabulary while staying coherent.',
    }[difficulty];

    const narrativeVoices = [
      'first-person diary entry written the night it happened',
      'third-person omniscient narrator with lyrical flair',
      'close third-person limited viewpoint that tracks the protagonist’s senses',
      'epistolary format composed of dispatches between characters',
      'oral history interview transcript stitched together',
      'dramatic radio broadcast with present-tense urgency'
    ];
    const structuralFlavors = [
      'three-act arc with an unexpected reversal in the middle',
      'nonlinear timeline that jumps between two contrasting moments',
      'mystery structure where clues surface gradually',
      'travelogue that charts distinct locations each paragraph',
      'character study that pivots on an internal dilemma revealed late',
      'high-stakes mission log noted hour by hour'
    ];
    const settingAngles = [
      'remote natural landscape far from any city',
      'speculative world detail that could only exist in this genre',
      'tight-knit community with distinct cultural rituals',
      'historical era rendered with sensory specifics',
      'unusual workplace or craft setting that shapes the stakes',
      'intimate domestic space transformed by an extraordinary event'
    ];

    const selectedVoice = narrativeVoices[Math.floor(Math.random() * narrativeVoices.length)];
    const selectedStructure = structuralFlavors[Math.floor(Math.random() * structuralFlavors.length)];
    const selectedSetting = settingAngles[Math.floor(Math.random() * settingAngles.length)];

    const vocabularyList = words
      .map((w, index) => `${index + 1}. ${w.word} — ${w.definition || 'no definition provided'}`)
      .join('\n');

    const systemPrompt = `You are a master storyteller who writes vivid, original narratives on demand. Always respond with valid JSON using the structure:\n{\n  "id": string,\n  "title": string,\n  "content": string\n}\nRules:\n1. Produce a ${lengthDescription} story that feels unmistakably ${tone} in tone and sits firmly in the ${genre} genre.\n2. Naturally weave each supplied vocabulary word exactly once, wrapping the word in double asterisks (e.g., **word**) so it is easy to spot.\n3. Craft a unique plot with sensory detail, emotional stakes, and at least one surprising twist—avoid formulaic openings or endings.\n4. Vary sentence length and rhythm to keep the narrative lively.\n5. Never add commentary outside the JSON fields.`;

    const userPrompt = `Vocabulary to include:\n${vocabularyList}\n\nDifficulty guidance: ${difficultyDescription}\nTone: ${tone}.\nGenre cues: ${genre}. Include world-specific flavor and conflict resolution.\nNarrative voice directive: ${selectedVoice}.\nStructural directive: ${selectedStructure}.\nSetting directive: ${selectedSetting}.\nHard bans: do not open with phrases like "In the heart of" or "In the dimly lit"; avoid recycled urban reconciliation tropes; ensure the core conflict, imagery, and resolution feel distinct from contemporary city romances.\nWrite the story now.`;

    try {
      const response = await this.callOpenAI({
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt },
        ],
        temperature: 0.88,
        top_p: 0.9,
        presence_penalty: 0.55,
        frequency_penalty: 0.3,
        max_tokens: 1600,
      });

      const parsed = JSON.parse(response);
      if (!parsed?.content) {
        throw new Error('Story response missing content');
      }

      return {
        id: parsed.id || `story_${Date.now()}`,
        title: parsed.title || `${genre[0].toUpperCase() + genre.slice(1)} Tale`,
        content: parsed.content,
      };
    } catch (error) {
      console.error('Error generating story via OpenAI:', error);
      throw error;
    }
  }
}

export const aiService = new AIService();
export default aiService;

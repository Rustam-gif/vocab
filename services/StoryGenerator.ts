import Constants from 'expo-constants';
import { Platform } from 'react-native';

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
const MODEL = 'gpt-4o-mini';

const DEFAULT_PORT = '4000';
const API_PORT =
  (process.env.EXPO_PUBLIC_API_PORT as string | undefined) ||
  ((Constants as any)?.expoConfig?.extra?.API_PORT as string | undefined) ||
  DEFAULT_PORT;

function getApiBaseUrl(): string | null {
  const fromEnv = (process.env.EXPO_PUBLIC_API_BASE_URL as string | undefined) || null;
  if (fromEnv) return fromEnv.replace(/\/$/, '');

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
      if (host) return `http://${host}:${API_PORT}`;
    }
  }

  const extra = (Constants?.expoConfig?.extra as Record<string, string> | undefined) || undefined;
  const fromExtra = extra?.API_BASE_URL || null;
  if (fromExtra) return fromExtra.replace(/\/$/, '');

  if (__DEV__ && !Constants.isDevice) {
    const simulatorHost = Platform.OS === 'android' ? '10.0.2.2' : 'localhost';
    return `http://${simulatorHost}:${API_PORT}`;
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

const SYSTEM_PROMPT = `You are a creative storyteller for a vocabulary learning app. Always respond with valid JSON following this schema:
{
  "raw_story": "the complete story using the supplied words",
  "story_with_blanks": "the same story where each supplied word is replaced by [[BLANK_#]] in order"
}

Rules:
1. Produce a short story of about two hundred words that uses all supplied vocabulary words exactly as provided.
2. The narrative must match the requested level, genre, and tone.
3. In raw_story, keep the words visible exactly as given.
4. In story_with_blanks, replace the words in the order they appear with [[BLANK_1]] ... [[BLANK_5]].
5. Do not add any extra keys, commentary, or Markdown.`;

export async function generateStory(options: StoryGenerationOptions): Promise<GeneratedStory> {
  if (options.words.length !== 5) {
    throw new Error('Exactly five words are required to generate a story.');
  }

  // Prefer backend proxy to avoid exposing client-side keys
  const base = getApiBaseUrl();
  const wordsList = options.words.map((word, idx) => `${idx + 1}. ${word}`).join('\n');
  const levelInstruction =
    options.level === 'Beginner'
      ? 'Use CEFR A2-B1 vocabulary with short sentences.'
      : options.level === 'Intermediate'
      ? 'Use CEFR B1-B2 vocabulary with varied sentence structures.'
      : 'Use CEFR C1-C2 vocabulary with rich and varied sentences.';

  const userPrompt = `Words to use (exact form):\n${wordsList}\n\nLevel: ${options.level}\nInstructions: ${levelInstruction}\nGenre: ${options.genre}\nTone: ${options.tone}\n\nWrite a cohesive story of roughly two hundred words. Use each word naturally. After writing the story, replace each vocabulary word with [[BLANK_1]] ... [[BLANK_5]] in the order they appeared. Ensure the surrounding context gives strong hints for the missing word. Avoid using numerals.`;

  // If proxy base URL is available, go through server
  if (base) {
    const resp = await fetch(`${base.replace(/\/$/, '')}/api/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: MODEL,
        temperature: 0.8,
        messages: [
          { role: 'system', content: SYSTEM_PROMPT },
          { role: 'user', content: userPrompt },
        ],
      }),
    });

    const data = await resp.json();
    if (!resp.ok) {
      throw new Error(`Story generation failed: ${resp.status} ${JSON.stringify(data)}`);
    }

    const content: string | undefined = data?.content;
    if (!content) {
      throw new Error('Story generation returned an empty response from proxy.');
    }

    let parsed: { raw_story: string; story_with_blanks: string } | null = null;
    try {
      parsed = JSON.parse(content);
    } catch (err) {
      const match = content.match(/\{[\s\S]*\}/);
      if (match) {
        parsed = JSON.parse(match[0]);
      }
    }

    if (!parsed?.raw_story || !parsed?.story_with_blanks) {
      throw new Error('Story generation returned unexpected content.');
    }

    return {
      storyWithBlanks: parsed.story_with_blanks.trim(),
      rawStory: parsed.raw_story.trim(),
    };
  }

  // Fallback: direct OpenAI call requiring client key
  const apiKey = getApiKey();
  const response = await fetch(OPENAI_ENDPOINT, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: MODEL,
      temperature: 0.8,
      messages: [
        { role: 'system', content: SYSTEM_PROMPT },
        { role: 'user', content: userPrompt },
      ],
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Story generation failed: ${response.status} ${errorText}`);
  }

  const data = await response.json();
  const content: string | undefined = data?.choices?.[0]?.message?.content;
  if (!content) {
    throw new Error('Story generation returned an unexpected response.');
  }

  let parsed: { raw_story: string; story_with_blanks: string } | null = null;

  try {
    parsed = JSON.parse(content);
  } catch (err) {
    const match = content.match(/\{[\s\S]*\}/);
    if (match) {
      parsed = JSON.parse(match[0]);
    }
  }

  if (!parsed?.raw_story || !parsed?.story_with_blanks) {
    throw new Error('Story generation returned unexpected content.');
  }

  return {
    storyWithBlanks: parsed.story_with_blanks.trim(),
    rawStory: parsed.raw_story.trim(),
  };
}

export default {
  generateStory,
};

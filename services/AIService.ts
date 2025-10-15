// aiService.ts
import Constants from 'expo-constants';
import { Platform } from 'react-native';

const DEFAULT_PORT = '4000';
const API_PORT =
  (process.env.EXPO_PUBLIC_API_PORT as string | undefined) ||
  ((Constants as any)?.expoConfig?.extra?.API_PORT as string | undefined) ||
  DEFAULT_PORT;

const OPENAI_BASE_URL = 'https://api.openai.com/v1';
const OPENAI_MODEL = 'gpt-4o';

function sanitizeBase(base: string | null): string | null {
  if (!base) return null;
  try {
    const u = new URL(base);
    const host = u.hostname;
    // Physical devices cannot reach localhost/127.0.0.1 of the dev machine
    if (Constants.isDevice && (host === 'localhost' || host === '127.0.0.1')) {
      return null; // force fallback (direct API or other configured host)
    }
    // Android emulator uses 10.0.2.2 to reach host's localhost
    if (!Constants.isDevice && Platform.OS === 'android' && (host === 'localhost' || host === '127.0.0.1')) {
      return base.replace(host, '10.0.2.2');
    }
    return base;
  } catch {
    return base;
  }
}

function getApiBaseUrl(): string | null {
  // 1) Prefer public env var (baked at build time)
  const fromEnv = (process.env.EXPO_PUBLIC_API_BASE_URL as string | undefined) || null;
  if (fromEnv) return sanitizeBase(fromEnv.replace(/\/$/, ''));

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

  // 3) Prefer expo extra config (often localhost; best for simulators)
  const extra = (Constants?.expoConfig?.extra as Record<string, string> | undefined) || undefined;
  const fromExtra = extra?.API_BASE_URL || null;
  if (fromExtra) return sanitizeBase(fromExtra.replace(/\/$/, ''));

  // 4) Simulator-friendly fallback; avoid on real devices
  if (__DEV__ && !Constants.isDevice) {
    const simulatorHost = Platform.OS === 'android' ? '10.0.2.2' : 'localhost';
    return sanitizeBase(`http://${simulatorHost}:${API_PORT}`);
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

/* ---------------- JSON parsing (robust to fences / smart quotes) ---------------- */
function parseJSONLoose(text: string): any {
  if (!text) throw new Error('Empty response');
  let s = String(text).trim();
  const fence = s.match(/```(?:json)?\s*([\s\S]*?)```/i);
  if (fence) s = fence[1].trim();
  s = s
    .replace(/\uFEFF/g, '')
    .replace(/[\u200B-\u200D]/g, '')
    .replace(/[\u201C\u201D]/g, '"')
    .replace(/[\u2018\u2019]/g, "'");
  try {
    return JSON.parse(s);
  } catch {
    const m = s.match(/\{[\s\S]*\}/);
    if (m) return JSON.parse(m[0]);
    throw new Error('Failed to parse JSON content');
  }
}

/* ---------------- Text normalization & dedupe ---------------- */
function normalizeForCompare(s: string): string {
  return s
    .normalize('NFKC')
    .replace(/\uFEFF/g, '')
    .replace(/[\u200B-\u200D]/g, '')
    .replace(/[\u201C\u201D]/g, '"')
    .replace(/[\u2018\u2019]/g, "'")
    .replace(/\s+/g, ' ')
    .trim()
    .toLowerCase();
}

// RN/Hermes-safe sentence splitter (no lookbehind)
function splitIntoSentences(paragraph: string): string[] {
  const p = paragraph.replace(/\s+/g, ' ').trim();
  const out: string[] = [];
  let cur = '';
  const closing = `"'’”)]}`;
  for (let i = 0; i < p.length; i++) {
    const ch = p[i];
    cur += ch;
    if (ch === '.' || ch === '!' || ch === '?') {
      let j = i + 1;
      while (j < p.length && closing.includes(p[j])) {
        cur += p[j];
        i = j;
        j++;
      }
      out.push(cur.trim());
      cur = '';
    }
  }
  if (cur.trim()) out.push(cur.trim());
  return out;
}

function reflowParagraphs(raw: string): string[] {
  let s = raw
    .replace(/\r\n/g, '\n')
    .replace(/\uFEFF/g, '')
    .replace(/[\u200B-\u200D]/g, '')
    .replace(/[\u201C\u201D]/g, '"')
    .replace(/[\u2018\u2019]/g, "'");

  let paras = s
    .split(/\n{2,}/)
    .map(p =>
      p
        .replace(/[ \t]*\n[ \t]*/g, ' ')
        .replace(/\s+([,;:!?\.])/g, '$1')
        .replace(/([,;:!?\.])\s+/g, '$1 ')
        .trim()
    )
    .filter(Boolean);

  // Merge paragraphs that end mid-sentence
  let i = 0;
  while (i < paras.length - 1) {
    const endsWithPunct = /[.!?]["')\]]?$/.test(paras[i]);
    if (!endsWithPunct) {
      paras[i] = `${paras[i]} ${paras[i + 1]}`.replace(/\s+/g, ' ').trim();
      paras.splice(i + 1, 1);
    } else {
      i++;
    }
  }

  // Keep at most 3 paragraphs; merge extras into previous
  while (paras.length > 3) {
    const last = paras.pop()!;
    paras[paras.length - 1] = `${paras[paras.length - 1]} ${last}`.replace(/\s+/g, ' ').trim();
  }

  return paras;
}

/**
 * Collapse duplicates:
 * - Always removes **contiguous exact duplicates** (A A) — fixes the “every sentence repeats twice” symptom.
 * - Removes global exact duplicates too.
 * - Does NOT use fuzzy matching (so we won't eat near-matches).
 * - Keeps one copy even if the sentence includes a target word.
 */
function collapseDuplicateSentences(paragraphs: string[]): string[] {
  const seen = new Set<string>();
  const cleaned: string[] = [];

  for (const p of paragraphs) {
    const sentences = splitIntoSentences(p);
    const out: string[] = [];
    let prevNorm = '';

    for (let s of sentences) {
      s = s.replace(/\s+/g, ' ').trim();
      if (!s) continue;
      const norm = normalizeForCompare(s);

      // Drop contiguous duplicate
      if (norm === prevNorm) continue;

      // Drop global exact duplicates (keep first occurrence only)
      if (seen.has(norm)) continue;

      out.push(s);
      prevNorm = norm;
      seen.add(norm);
    }

    if (out.length) cleaned.push(out.join(' '));
  }

  return cleaned;
}

function finalizeStoryContent(input: string): string {
  const paras = reflowParagraphs(input);
  const deduped = collapseDuplicateSentences(paras)
    .map(p => p.replace(/\s+/g, ' ').trim())
    .filter(Boolean);

  if (!deduped.length) {
    return input
      .replace(/\r\n/g, '\n')
      .replace(/[ \t]*\n[ \t]*/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
  }

  // Ensure single blank line separation only (no content steering)
  const joined = deduped.join('\n\n').trim();
  return joined;
}

/* ---------------- Service ---------------- */
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
    if (!this.apiKey) this.apiKey = this.resolveApiKey();
    if (!this.apiKey) {
      throw new Error(
        'Missing OpenAI API key. Prefer using a proxy by setting EXPO_PUBLIC_API_BASE_URL (or extra.API_BASE_URL) to your server (e.g., http://<host>:4000). If you must call OpenAI directly, set EXPO_PUBLIC_OPENAI_API_KEY or OPENAI_API_KEY.'
      );
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

      const parsed = parseJSONLoose(response);
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
      tone?: 'casual' | 'playful' | 'dramatic' | 'serious' | 'humorous' | 'wistful';
    }
  ): Promise<Story> {
    const genre = customization?.genre ?? 'adventure';
    const difficulty = customization?.difficulty ?? 'easy';
    const tone = customization?.tone ?? 'casual';
    const length = customization?.length ?? 'short';

    // Light variation to avoid repeating the same protagonist setup across stories
    const namePool = [
      'Ava', 'Leo', 'Maya', 'Noah', 'Zara', 'Luca', 'Iris', 'Kai', 'Nora', 'Sami',
      'Aisha', 'Mina', 'Hugo', 'Aria', 'Juno', 'Omar', 'Lena', 'Yara', 'Niko', 'Indra'
    ];
    const perspective: 'first-person' | 'third-person' = Math.random() < 0.5 ? 'first-person' : 'third-person';
    const protagonist = namePool[Math.floor(Math.random() * namePool.length)];

    const lengthDescription = {
      short: '80–110 words',
      medium: '120–160 words',
      long: '180–230 words',
    }[length];

    const maxTokens = {
      short: 450,
      medium: 700,
      long: 950,
    }[length];

    const difficultyRule = {
      easy: 'CEFR A1–A2: very short, simple sentences, mostly present tense, everyday words.',
      medium: 'CEFR B1: varied but clear sentences, accessible vocabulary.',
      hard: 'CEFR B2–C1: more complex sentences and richer vocabulary, but still coherent.',
    }[difficulty];

    const targetWords = words.slice(0, 5).map(w => (w.word || '').trim()).filter(Boolean);
    const targetList = targetWords.join('\n');

    const SYSTEM_PROMPT = `Return ONLY valid JSON (no markdown, no backticks):
{
  "id": string,
  "title": string,
  "content": string
}

Requirements (keep it natural and varied):
- Use EACH target word EXACTLY ONCE and wrap each as **word** (this is mandatory so the app can blank them out).
- Do NOT put a target word in the very first or the very last sentence.
- Write a coherent short story (free style, any perspective), in plain prose.
- Avoid clichés and stock openings. Specifically, do NOT use phrases like "in the heart of", "once upon a time", "at the edge of", "nestled in", or similar formulaic openers.
- Vary sentence openings and structure; prefer concrete, sensory details over generic scene-setters.
- Do NOT use placeholder names like Tom, John, Mary, or Jane.
- If you use a character name, use the one provided in the user message only, at most twice; otherwise prefer pronouns.
- No lists, headings, or meta commentary.
`;

    const USER_PROMPT = `Target words (wrap as **word**, use once each):
${targetList}

Genre: ${genre}
Tone: ${tone}
Length: ${lengthDescription} (roughly; do not pad).
Level: ${difficultyRule}
Perspective: ${perspective}${perspective === 'third-person' ? `\nProtagonist name: ${protagonist} (use this name at most twice; then switch to pronouns).` : `\nDo not use any first names; keep the narrator unnamed.`}
Return only the JSON object.`;

    try {
      const response = await this.callOpenAI({
        messages: [
          { role: 'system', content: SYSTEM_PROMPT },
          { role: 'user', content: USER_PROMPT },
        ],
        temperature: 0.8,
        top_p: 0.95,
        presence_penalty: 0.85,
        frequency_penalty: 0.35,
        max_tokens: maxTokens,
      });

      const parsed = parseJSONLoose(response);
      if (!parsed?.content) {
        throw new Error('Story response missing content');
      }

      // Fix broken lines and collapse duplicates (formatting only)
      const cleaned = finalizeStoryContent(String(parsed.content || ''));

      return {
        id: parsed.id || `story_${Date.now()}`,
        title: parsed.title || `${genre[0].toUpperCase() + genre.slice(1)} Tale`,
        content: cleaned,
      };
    } catch (error) {
      // Do not use any local templates; surface the error to the caller
      console.warn('Error generating story via OpenAI:', error);
      throw error;
    }
  }
}

export const aiService = new AIService();
export default aiService;

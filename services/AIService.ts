// aiService.ts
// No platform-specific networking anymore; direct HTTPS to OpenAI
import { OPENAI_API_KEY as CFG_OPENAI_API_KEY, API_BASE_URL as CFG_API_BASE_URL, AI_PROXY_URL as CFG_AI_PROXY_URL } from '../lib/appConfig';
import RNFS from 'react-native-fs';
import { getCached, setCached } from '../lib/aiCache';
import { aiProxyService } from './AiProxyService';

const OPENAI_MODEL = 'gpt-4o-mini';

function getApiBaseUrl(): string {
  // Always use the configured HTTPS endpoint for production safety.
  // If empty, default to OpenAI's chat completions endpoint.
  const configured = (CFG_API_BASE_URL && CFG_API_BASE_URL.trim()) || '';
  return configured || 'https://api.openai.com/v1/chat/completions';
}

//

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
    const fromGlobal = (globalThis as any).__OPENAI_API_KEY as string | undefined;
    const fromConfig = (CFG_OPENAI_API_KEY && CFG_OPENAI_API_KEY.trim()) || '';
    const fromEnv = process.env.EXPO_PUBLIC_OPENAI_API_KEY || process.env.OPENAI_API_KEY;
    return fromGlobal || fromConfig || fromEnv || null;
  }

  private ensureApiKey() {
    if (!this.apiKey) this.apiKey = this.resolveApiKey();
    if (!this.apiKey) {
      throw new Error(
        'Missing OpenAI API key. For direct calls, set OPENAI_API_KEY (or EXPO_PUBLIC_OPENAI_API_KEY) or edit lib/appConfig.ts.'
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
    model?: string; // optional override per-call
  }) {
    const proxyUrl = (CFG_AI_PROXY_URL && CFG_AI_PROXY_URL.trim()) || '';
    if (proxyUrl) {
      const proxyResponse = await aiProxyService.complete({
        messages: payload.messages,
        model: payload.model || OPENAI_MODEL,
        temperature: payload.temperature,
        maxTokens: payload.max_tokens,
      });
      const content = proxyResponse?.content?.trim();
      if (!content) throw new Error('AI proxy returned an empty response.');
      return content;
    }

    const endpoint = getApiBaseUrl();
    this.ensureApiKey();
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${this.apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ model: payload.model || OPENAI_MODEL, ...payload }),
    });

    if (!response.ok) {
      // Safe fetch wrapper returns 599 on offline; map to friendly error
      const errorBody = await response.text().catch(() => '');
      const status = (response as any)?.status ?? 0;
      if (status === 599) throw new Error('Network unavailable. Please check your connection.');
      throw new Error(`OpenAI API error (${status}): ${errorBody}`);
    }

    const data = await response.json();
    const content: string | undefined = data?.choices?.[0]?.message?.content;
    if (!content) throw new Error('OpenAI API returned an empty response.');
    return content.trim();
  }

  /**
   * Vision OCR using an inexpensive OpenAI model (gpt-4o-mini).
   * This mirrors the original direct-OpenAI implementation that
   * worked well before the Supabase proxy was added: single pass,
   * JSON-only, no forced guesses.
   */
  async ocrImageWords(localUri: string): Promise<string[]> {
    try {
      let path = localUri;
      if (path.startsWith('file://')) path = path.replace('file://', '');
      const base64 = await RNFS.readFile(path, 'base64');
      const dataUri = `data:image/jpeg;base64,${base64}`;

      const payload: any = {
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content:
              'You are an OCR engine. Extract only English words from the image. Return ONLY a JSON array of lowercase words (e.g., ["feedback","visual"]). Ignore numbers, punctuation, and non-words. Deduplicate and keep at most 200 items. Do not include any commentary or markdown.',
          },
          {
            role: 'user',
            content: [
              { type: 'text', text: 'Return only JSON array of unique lowercase words.' },
              { type: 'image_url', image_url: { url: dataUri } as any },
            ] as any,
          } as any,
        ] as any,
        temperature: 0,
        max_tokens: 200,
      } as any;

      // Always go through the Supabase proxy (callOpenAI).
      const content = await this.callOpenAI(payload);

      try {
        console.log('[OCR] raw content snippet:', String(content || '').slice(0, 200));
      } catch {}

      if (!content) return [];
      let words: string[] = [];
      try {
        const parsed = parseJSONLoose(content);
        if (Array.isArray(parsed)) {
          words = parsed.map((s) => String(s).toLowerCase());
        }
      } catch {
        // If JSON parsing fails, treat as no words rather than guessing.
        words = [];
      }
      return words.slice(0, 200);
    } catch (e) {
      console.warn('AI OCR failed:', e);
      throw e;
    }
  }

  /**
   * Translate a single English word to `targetLang` with aggressive caching.
   * - Returns a lowercase translation string (best single-word equivalent).
   * - Caches results in memory + AsyncStorage for 180 days.
   */
  async translateWord(word: string, targetLang: string): Promise<string | null> {
    const w = (word || '').trim().toLowerCase();
    if (!w) return null;
    const lang = (targetLang || 'ru').trim().toLowerCase();
    const cacheKey = `translate:${lang}:${encodeURIComponent(w)}`;
    const cached = await getCached<string>(cacheKey);
    if (cached) return cached;

    try {
      const content = await this.callOpenAI({
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content:
              'You are a precise bilingual dictionary. Return ONLY JSON: {"translation": string}. Use the most common single-word translation in the target language. Lowercase. No examples or extra fields.',
          },
          {
            role: 'user',
            content: `Translate the English word "${w}" into ${lang}. Return JSON only.`,
          },
        ],
        temperature: 0,
        max_tokens: 60,
      });
      const parsed = parseJSONLoose(content);
      const t = String(parsed?.translation || '').trim().toLowerCase();
      if (!t) return null;
      await setCached(cacheKey, t);
      return t;
    } catch (e) {
      console.warn('translateWord failed:', e);
      return null;
    }
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

  /**
   * Fetch multiple candidate senses for a word so users can choose a specific meaning.
   * Returns up to 5 concise senses with optional part of speech and example.
   */
  async getWordMeanings(word: string): Promise<Array<{ pos?: string; definition: string; example?: string }>> {
    try {
      const response = await this.callOpenAI({
        messages: [
          {
            role: 'system',
            content:
              'You are a precise dictionary assistant. Return ONLY JSON for multiple senses of a word. Keep each definition short and clear. Provide at most ONE sense per part of speech among: noun, verb, adjective, adverb. If a part of speech does not apply, omit it. Use the key "pos" with one of exactly: noun | verb | adjective | adverb | other. Do not include markdown or commentary.',
          },
          {
            role: 'user',
            content:
              `Return ONLY a JSON array: [ { pos: 'noun|verb|adjective|adverb|other', definition: string, example?: string }, ... ] for the word "${word}". At most one item per part of speech (noun, verb, adjective, adverb). If none fit, include a single 'other'. Keep definitions brief; examples should be practical.`,
          },
        ],
        temperature: 0.2,
        max_tokens: 500,
      });

      const parsed = parseJSONLoose(response);
      const arr: any[] = Array.isArray(parsed)
        ? parsed
        : Array.isArray(parsed?.senses)
          ? parsed.senses
          : [];
      // Normalize part-of-speech labels
      const normalizePos = (s?: string): string => {
        const t = (s || '').toString().trim().toLowerCase();
        if (!t) return 'other';
        if (/(^|\W)(v|verb|phrasal\s*verb)(\W|$)/.test(t)) return 'verb';
        if (/(^|\W)(n|noun)(\W|$)/.test(t)) return 'noun';
        if (/(^|\W)(adj|adjective)(\W|$)/.test(t)) return 'adjective';
        if (/(^|\W)(adv|adverb)(\W|$)/.test(t)) return 'adverb';
        return 'other';
      };

      const cleanedAll = arr
        .map((it) => ({
          pos: normalizePos(it?.pos),
          definition: String(it?.definition || '').trim(),
          example: it?.example ? String(it.example).trim() : undefined,
        }))
        .filter((it) => it.definition);

      // Keep at most one per POS in preferred order
      const preferred: Array<'noun' | 'verb' | 'adjective' | 'adverb' | 'other'> = ['noun', 'verb', 'adjective', 'adverb', 'other'];
      const seen = new Set<string>();
      const deduped: Array<{ pos?: string; definition: string; example?: string }> = [];
      for (const p of preferred) {
        const first = cleanedAll.find((x) => x.pos === p);
        if (first && !seen.has(p)) {
          deduped.push(first);
          seen.add(p);
        }
      }
      return deduped;
    } catch (error) {
      console.warn('Failed to fetch meanings:', error);
      return [];
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
      let response: string;
      try {
        // Prefer GPT-5 mini for story generation
        response = await this.callOpenAI({
          model: 'gpt-5-mini',
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
      } catch (primaryErr: any) {
        // Fallback to default model if GPT-5 mini is unavailable
        console.warn('Story generation with gpt-5-mini failed; falling back to default model.', primaryErr);
        response = await this.callOpenAI({
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
      }

      const parsed = parseJSONLoose(response);
      if (!parsed?.content) {
        throw new Error('Story response missing content');
      }

      // Fix broken lines and collapse duplicates (formatting only)
      let cleaned = finalizeStoryContent(String(parsed.content || ''));

      // Post-process: enforce that each target word appears exactly once wrapped as **word**
      const esc = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      const ensureBoldOnce = (text: string): { text: string; ok: boolean } => {
        let out = text;
        let ok = true;
        for (const w of targetWords) {
          const reBold = new RegExp(`\\*\\*${esc(w)}\\*\\*`, 'gi');
          const matches = out.match(reBold) || [];
          if (matches.length === 0) {
            // Try to find an unbolded occurrence to wrap
            const rePlain = new RegExp(`\\b${esc(w)}\\b`, 'i');
            if (rePlain.test(out)) {
              out = out.replace(rePlain, (m) => `**${m.toLowerCase()}**`);
            } else {
              ok = false; // missing entirely
            }
          } else if (matches.length > 1) {
            // Unbold all but the first occurrence
            let seen = 0;
            out = out.replace(reBold, (m) => {
              seen += 1;
              return seen === 1 ? m : m.replace(/\*\*/g, '');
            });
          }
        }
        return { text: out, ok };
      };

      let enforced = ensureBoldOnce(cleaned);
      if (!enforced.ok) {
        // One light repair pass with the model to include any missing target words
        try {
          const missing = targetWords.filter(w => !new RegExp(`\\*\\*${esc(w)}\\*\\*`, 'i').test(enforced.text) && !new RegExp(`\\b${esc(w)}\\b`, 'i').test(enforced.text));
          const repair = await this.callOpenAI({
            model: 'gpt-4o-mini',
            messages: [
              { role: 'system', content: 'Return ONLY JSON: {"content": string}. You will minimally revise a story so that each target word appears exactly once wrapped as **word**. Keep length and tone similar.' },
              { role: 'user', content: `Story to repair:\n\n${cleaned}\n\nMissing target words (wrap them exactly once): ${missing.join(', ')}. Return only the JSON object.` },
            ],
            temperature: 0.4,
            max_tokens: 500,
          });
          const repaired = parseJSONLoose(repair);
          if (repaired?.content) {
            cleaned = finalizeStoryContent(String(repaired.content));
            enforced = ensureBoldOnce(cleaned);
          }
        } catch {}
      }

      cleaned = enforced.text;

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

  /* ---------------- IELTS: Writing Grader (LLM with deterministic fallback) ---------------- */
  private sanitizeHtml(input: string): string {
    return String(input || '')
      .replace(/<script[\s\S]*?<\/script>/gi, ' ')
      .replace(/<style[\s\S]*?<\/style>/gi, ' ')
      .replace(/<[^>]+>/g, ' ')
      .replace(/&[a-z#0-9]+;/gi, ' ')
      .replace(/\s+/g, ' ')
      .trim();
  }

  private countWords(text: string): number {
    const s = String(text || '')
      .toLowerCase()
      .replace(/[\u201C\u201D]/g, '"')
      .replace(/[\u2018\u2019]/g, "'")
      .replace(/[^a-zA-Z0-9\s'-]/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
    if (!s) return 0;
    return s.split(/\s+/).length;
  }

  private computeBand(sub: { task_response: number; coherence: number; lexical: number; grammar: number }): number {
    const clamp = (n: number) => Math.max(0, Math.min(9, n));
    const w = 0.30 * clamp(sub.task_response) + 0.25 * clamp(sub.coherence) + 0.25 * clamp(sub.lexical) + 0.20 * clamp(sub.grammar);
    return Math.round(w * 10) / 10;
  }

  private ruleScoreWriting(student: string, prompt: string) {
    const text = this.sanitizeHtml(student);
    const wordCount = this.countWords(text);

    // Simple keyword coverage from prompt
    const kws = Array.from(new Set((prompt.toLowerCase().match(/[a-z]{5,}/g) || []).slice(0, 10)));
    const hit = kws.filter(k => new RegExp(`\\b${k}\\b`, 'i').test(text)).length;
    const coverage = kws.length ? hit / kws.length : 0.6;

    // Cohesion signals
    const signals = ['however','moreover','therefore','in addition','furthermore','for example','for instance','on the other hand','consequently','thus','nevertheless'];
    const cohHits = signals.reduce((acc, s) => acc + (new RegExp(`\\b${s}\\b`, 'i').test(text) ? 1 : 0), 0);
    const paraCount = (text.match(/\n\n/g) || []).length + 1;

    // Lexical variety via type-token ratio (rough)
    const tokens = text.toLowerCase().replace(/[^a-z\s]/g, ' ').split(/\s+/).filter(Boolean);
    const types = new Set(tokens).size;
    const ttr = tokens.length ? types / tokens.length : 0;

    // Grammar proxy: commas and common mistakes
    const commaRuns = (text.match(/,\s*,/g) || []).length;
    const doubleSpaces = (text.match(/\s{2,}/g) || []).length;
    const articleIssues = (text.match(/\b(a|an|the)\s+(a|an|the)\b/gi) || []).length;
    const errorScore = commaRuns + doubleSpaces + articleIssues;

    // Map heuristics to 0–9
    const task_response = Math.max(0, Math.min(9, Math.round((coverage * 6 + (wordCount >= 250 ? 3 : wordCount >= 180 ? 2 : 1)) * 10) / 10));
    const coherence = Math.max(0, Math.min(9, Math.round(((cohHits >= 4 ? 7 : cohHits >= 2 ? 6 : 5) + (paraCount >= 4 ? 1 : 0)) * 10) / 10));
    const lexical = Math.max(0, Math.min(9, Math.round(((ttr > 0.6 ? 7 : ttr > 0.5 ? 6 : 5)) * 10) / 10));
    const grammar = Math.max(0, Math.min(9, Math.round(((errorScore === 0 ? 7 : errorScore < 3 ? 6 : 5)) * 10) / 10));

    const subs = { task_response, coherence, lexical, grammar } as const;
    const band_estimate = this.computeBand(subs);

    // Minimal tips and replacements
    const action_tips = [
      'Strengthen topic sentences',
      'Vary linking devices',
      'Replace vague verbs with precise ones',
    ];
    const phrase_replacements = [
      { original: 'a lot of', suggestions: ['many', 'numerous', 'a large number of'] },
      { original: 'very important', suggestions: ['crucial', 'vital', 'pivotal'] },
      { original: 'make more', suggestions: ['increase', 'boost', 'raise'] },
    ];

    return { band_estimate, subscores: subs, word_count: wordCount, action_tips, phrase_replacements, fallback: true };
  }

  async gradeWriting(input: {
    task_type: string;
    prompt_text: string;
    student_text: string;
    prompt_id?: string;
    elapsed_seconds?: number;
  }): Promise<{
    band_estimate: number;
    subscores: { task_response: number; coherence: number; lexical: number; grammar: number };
    word_count: number;
    action_tips: string[];
    phrase_replacements: Array<{ original: string; suggestions: string[] }>;
    fallback: boolean;
    latency_ms: number;
  }> {
    const start = Date.now();
    const student = this.sanitizeHtml(input.student_text || '');
    const wordCount = this.countWords(student);
    const timeoutMs = 10000;
    const mode = (process.env.EXPO_PUBLIC_GRADER_MODE || 'llm').toLowerCase();

    const doFallback = () => {
      const fb = this.ruleScoreWriting(student, input.prompt_text || '');
      return {
        band_estimate: fb.band_estimate,
        subscores: fb.subscores,
        word_count: fb.word_count,
        action_tips: fb.action_tips,
        phrase_replacements: fb.phrase_replacements,
        fallback: true,
        latency_ms: Date.now() - start,
      } as const;
    };

    if (mode !== 'llm') return doFallback();

    try {
      const controller = new Promise<string>((resolve, reject) => {
        this.callOpenAI({
          model: OPENAI_MODEL,
          messages: [
            {
              role: 'system',
              content:
                'You are an IELTS Writing examiner. Grade deterministically. Output ONLY valid JSON with keys band_estimate, subscores{task_response,coherence,lexical,grammar}, word_count, action_tips[3], phrase_replacements(up to 6 each with suggestions[<=3]). Weights: 30/25/25/20. 1 decimal band. No extra text.',
            },
            {
              role: 'user',
              content:
                `task_type: ${input.task_type}\nprompt_id: ${input.prompt_id || ''}\nprompt_text: ${input.prompt_text}\nstudent_text: ${student}\nReturn JSON only.`,
            },
          ],
          temperature: 0,
          max_tokens: 800,
        })
          .then(resolve)
          .catch(reject);
        setTimeout(() => reject(new Error('timeout')), timeoutMs);
      });

      const content = await controller;
      const parsed = parseJSONLoose(content);
      const subs = {
        task_response: Number(parsed?.subscores?.task_response ?? 0),
        coherence: Number(parsed?.subscores?.coherence ?? 0),
        lexical: Number(parsed?.subscores?.lexical ?? 0),
        grammar: Number(parsed?.subscores?.grammar ?? 0),
      };
      const band = this.computeBand(subs);
      return {
        band_estimate: Number.isFinite(parsed?.band_estimate) ? Number(parsed.band_estimate) : band,
        subscores: subs,
        word_count: wordCount,
        action_tips: Array.isArray(parsed?.action_tips) ? parsed.action_tips.slice(0, 3).map(String) : [],
        phrase_replacements: Array.isArray(parsed?.phrase_replacements)
          ? parsed.phrase_replacements.slice(0, 6).map((p: any) => ({
              original: String(p?.original || ''),
              suggestions: Array.isArray(p?.suggestions) ? p.suggestions.slice(0, 3).map(String) : [],
            }))
          : [],
        fallback: false,
        latency_ms: Date.now() - start,
      };
    } catch (e) {
      console.warn('gradeWriting LLM failed, using fallback:', e);
      return doFallback();
    }
  }

  /* ---------------- IELTS: Reading scorer (deterministic) ---------------- */
  private lemma(s: string): string {
    const t = (s || '').toLowerCase().trim();
    // stripped endings basic
    const rules: Array<[RegExp, string]> = [
      [/ies$/i, 'y'],
      [/ves$/i, 'f'],
      [/ing$/i, ''],
      [/ed$/i, ''],
      [/s$/i, ''],
    ];
    let out = t.replace(/[^a-z]/g, '');
    for (const [re, rep] of rules) out = out.replace(re, rep);
    return out;
  }

  private summarySynonyms = new Map<string, string[]>([
    ['biodiversity', ['diversity']],
    ['crop', ['harvest', 'produce']],
    ['yields', ['output', 'production']],
    ['accept', ['tolerate', 'embrace', 'approve']],
  ]);

  private matchSynonym(student: string, gold: string): boolean {
    const s = this.lemma(student);
    const g = this.lemma(gold);
    if (!s || !g) return false;
    if (s === g) return true;
    const alts = this.summarySynonyms.get(g) || [];
    return alts.some((a) => this.lemma(a) === s);
  }

  async gradeReading(input: {
    passage: string;
    questions: Array<{ id: string | number; type: string; stem?: string; options?: string[]; answer: any; student: any; snippet?: string; rationale?: string }>;
  }): Promise<{
    score_total: number;
    score_max: number;
    percent: number;
    items: Array<{ id: string | number; correct: boolean; correct_answer: any; student: any; snippet?: string; rationale?: string }>;
    fallback: boolean;
    latency_ms: number;
  }> {
    const start = Date.now();
    const items = [] as Array<{ id: string | number; correct: boolean; correct_answer: any; student: any; snippet?: string; rationale?: string }>;
    for (const q of input.questions || []) {
      let correct = false;
      const type = (q.type || '').toLowerCase();
      if (type === 'summary_completion') {
        const gold = Array.isArray(q.answer) ? q.answer : [q.answer];
        correct = gold.some((g) => this.matchSynonym(String(q.student || ''), String(g || '')));
      } else if (type === 'tfng') {
        correct = String(q.student || '').trim().toUpperCase() === String(q.answer || '').trim().toUpperCase();
      } else if (type === 'mcq_inference' || type === 'match_heading' || type === 'skim_scan' || type === 'vocab_in_context' || type === 'opinion_evidence') {
        correct = String(q.student || '').trim().toLowerCase() === String(q.answer || '').trim().toLowerCase();
      } else {
        // default strict compare
        correct = String(q.student || '').trim().toLowerCase() === String(q.answer || '').trim().toLowerCase();
      }
      items.push({ id: q.id, correct, correct_answer: q.answer, student: q.student, snippet: q.snippet, rationale: q.rationale });
    }
    const score_total = items.filter((i) => i.correct).length;
    const score_max = items.length;
    const percent = score_max ? Math.round((score_total / score_max) * 100) : 0;
    return { score_total, score_max, percent, items, fallback: false, latency_ms: Date.now() - start };
  }

  // IELTS Writing Task 2 rich grader (JSON with annotations). Deterministic LLM with fallback.
  async gradeIELTSWritingTask2Rich(input: {
    prompt_text: string;
    student_answer: string;
    word_count: number;
  }): Promise<{
    band_estimate: number;
    subscores: { task_response: number; coherence: number; lexical: number; grammar: number };
    word_count: number;
    annotated_html: string;
    corrections: Array<{ loc: string; original: string; correction: string; type: 'grammar'|'vocab'|'cohesion'|'punctuation'|'register'; reason: string; confidence: 'high'|'med'|'low' }>;
    suggested_replacements: Array<{ original: string; alternatives: string[] }>;
    three_tips: string[];
    rewrite_example?: string;
    fallback: boolean;
    latency_ms: number;
  }> {
    const start = Date.now();
    const prompt_text = this.sanitizeHtml(input.prompt_text || '');
    const student_answer = this.sanitizeHtml(input.student_answer || '');
    const wc = Number.isFinite(input.word_count) && input.word_count > 0 ? Math.round(input.word_count) : this.countWords(student_answer);

    const SYSTEM = 'You are an expert IELTS Writing Task 2 assessor. Return ONLY one valid JSON object as the answer. No markdown, no commentary.';
    const USER = [
      'You will be given three inputs and must evaluate the essay and return ONLY JSON matching this schema.',
      'Required output JSON keys and formats:',
      '- band_estimate: float 0.0–9.0, 1 decimal (weighted by rubric).',
      '- subscores: floats 0.0–9.0 for task_response, coherence, lexical, grammar.',
      '- word_count: integer.',
      '- annotated_html: minimal HTML with <p> and <mark class="error" data-correction=".." data-reason=".." data-confidence="high|med|low">original</mark>.',
      '- corrections: up to 20 objects { loc:"P#S#", original, correction, type:"grammar|vocab|cohesion|punctuation|register", reason:"<=12 words", confidence:"high|med|low" }.',
      '- suggested_replacements: up to 6 objects { original, alternatives:[opt1,opt2,opt3] }.',
      '- three_tips: exactly 3 short actionable tips (<=12 words).',
      '- rewrite_example: optional full rewrite string.',
      'Rubric & rules:',
      '- Weights: task_response 30%, coherence 25%, lexical 25%, grammar 20%; band_estimate is weighted average rounded to 1 decimal.',
      '- Reasons/tips succinct (<=12 words).',
      '- Confidence: high for clear grammar errors; med for style/word-choice; low for optional rewrites.',
      '- annotated_html must reflect corrections with accurate data-correction and data-reason.',
      '- Do not invent facts; only reference student text.',
      'Inputs:',
      `- prompt_text: ${prompt_text}`,
      `- student_answer: ${student_answer}`,
      `- word_count: ${wc}`,
      'Return JSON only.',
    ].join('\n');

    try {
      const content = await this.callOpenAI({
        model: OPENAI_MODEL,
        messages: [
          { role: 'system', content: SYSTEM },
          { role: 'user', content: USER },
        ],
        temperature: 0,
        max_tokens: 1400,
      });
      const parsed = parseJSONLoose(content);
      const subs = {
        task_response: Number(parsed?.subscores?.task_response ?? 0),
        coherence: Number(parsed?.subscores?.coherence ?? 0),
        lexical: Number(parsed?.subscores?.lexical ?? 0),
        grammar: Number(parsed?.subscores?.grammar ?? 0),
      };
      const computedBand = this.computeBand(subs);
      return {
        band_estimate: Number.isFinite(parsed?.band_estimate) ? Number(parsed.band_estimate) : computedBand,
        subscores: subs,
        word_count: Number.isFinite(parsed?.word_count) ? Number(parsed.word_count) : wc,
        annotated_html: String(parsed?.annotated_html || `<p>${student_answer}</p>`),
        corrections: Array.isArray(parsed?.corrections) ? parsed.corrections.slice(0, 20) : [],
        suggested_replacements: Array.isArray(parsed?.suggested_replacements) ? parsed.suggested_replacements.slice(0, 6) : [],
        three_tips: Array.isArray(parsed?.three_tips) ? parsed.three_tips.slice(0, 3) : [],
        rewrite_example: parsed?.rewrite_example ? String(parsed.rewrite_example) : undefined,
        fallback: false,
        latency_ms: Date.now() - start,
      };
    } catch (e) {
      console.warn('gradeIELTSWritingTask2Rich LLM failed, using fallback:', e);
      const fb = this.ruleScoreWriting(student_answer, prompt_text);

      // Heuristic annotation
      const paragraphs = student_answer.split(/\n{2,}/).map(p => p.trim()).filter(Boolean);
      const corrections: Array<{ loc: string; original: string; correction: string; type: any; reason: string; confidence: any }> = [];
      const mark = (pi: number, si: number, original: string, correction: string, type: any, reason: string, confidence: any) => {
        if (corrections.length >= 20) return;
        corrections.push({ loc: `P${pi + 1}S${si + 1}`, original, correction, type, reason, confidence });
      };
      const splitSents = (p: string) => p.replace(/\s+/g, ' ').split(/(?<=[.!?])\s+/).filter(Boolean);
      let annotated = '';
      for (let pi = 0; pi < paragraphs.length; pi++) {
        const sents = splitSents(paragraphs[pi]);
        const ms = sents.map((s, si) => {
          let out = s;
          out = out.replace(/\balot\b/gi, (m) => { mark(pi, si, 'alot', 'a lot', 'vocab', 'misspelling', 'high'); return `<mark class="error" data-correction="a lot" data-reason="misspelling" data-confidence="high">${m}</mark>`; });
          out = out.replace(/\bvery\s+very\b/gi, (m) => { mark(pi, si, m, 'very', 'lexical', 'redundant intensifier', 'med'); return `<mark class="error" data-correction="very" data-reason="redundant intensifier" data-confidence="med">${m}</mark>`; });
          out = out.replace(/\bkind of\b/gi, (m) => { mark(pi, si, m, 'somewhat', 'register', 'vague phrase', 'low'); return `<mark class="error" data-correction="somewhat" data-reason="vague phrase" data-confidence="low">${m}</mark>`; });
          return out;
        });
        annotated += `<p>${ms.join(' ')}</p>`;
      }

      return {
        band_estimate: fb.band_estimate,
        subscores: fb.subscores,
        word_count: wc,
        annotated_html: annotated || `<p>${student_answer}</p>`,
        corrections,
        suggested_replacements: [
          { original: 'a lot of', alternatives: ['many', 'numerous', 'a large number of'] },
          { original: 'very very', alternatives: ['extremely', 'highly', 'particularly'] },
          { original: 'kind of', alternatives: ['somewhat', 'relatively', 'to some extent'] },
        ],
        three_tips: [
          'Use precise academic collocations',
          'Add clear topic sentences',
          'Check articles and verb forms',
        ],
        fallback: true,
        latency_ms: Date.now() - start,
      };
    }
  }
}

export const aiService = new AIService();
export default aiService;

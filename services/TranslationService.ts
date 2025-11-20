import AsyncStorage from '@react-native-async-storage/async-storage';
import { OPENAI_API_KEY, API_BASE_URL } from '../lib/appConfig';
import { LANG_NAME_MAP } from '../lib/languages';

// Name map imported from centralized catalog

export type Translation = {
  lang: string; // e.g., 'ru'
  word: string;
  translation: string;
  synonyms: string[];
  example?: string; // backward-compat
  examples?: string[]; // up to 3 example sentences
  examplesEn?: string[]; // English examples using the original word
  examplesBilingual?: { en: string; target: string }[]; // paired examples
};

const CACHE_KEY = '@engniter.translation.cache.v1';

class TranslationServiceClass {
  private cache: Record<string, Translation> = {};
  private loaded = false;

  private async ensureLoaded() {
    if (this.loaded) return;
    try {
      const raw = await AsyncStorage.getItem(CACHE_KEY);
      this.cache = raw ? JSON.parse(raw) : {};
    } catch {}
    this.loaded = true;
  }

  private makeKey(word: string, lang: string) {
    return `${lang.toLowerCase()}::${word.toLowerCase()}`;
  }

  async translate(word: string, lang: string): Promise<Translation | null> {
    await this.ensureLoaded();
    const key = this.makeKey(word, lang);
    const hit = this.cache[key];
    if (hit) return hit;

    try {
      const target = LANG_NAME_MAP[lang?.toLowerCase?.() || ''] || lang;
      const prompt = `You are a translation assistant. Translate the English word strictly to ${target}.
Return ONLY a valid JSON object with these keys:
  translation: string
  synonyms: string[] (3-6 items)
  examples_en: string[] (exactly 3 short, natural English sentences using the original English word)
  examples_target: string[] (exactly 3 short, natural sentences in ${target} using the translated word)
Also include a legacy alias key examples equal to examples_target for backward compatibility.
No markdown, no commentary. Word: "${word}"`;

      const resp = await fetch(API_BASE_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${OPENAI_API_KEY}`,
        },
        body: JSON.stringify({
          model: 'gpt-4o-mini',
          messages: [
            { role: 'system', content: 'You are a translation assistant.' },
            { role: 'user', content: prompt },
          ],
          temperature: 0.2,
          response_format: { type: 'json_object' },
        }),
      });
      const json = await resp.json();
      const content = json?.choices?.[0]?.message?.content || '';
      let data: any = null;
      try {
        data = typeof content === 'string' ? JSON.parse(content) : content;
      } catch {
        // Try to extract JSON substring as fallback
        const start = content.indexOf('{');
        const end = content.lastIndexOf('}');
        if (start >= 0 && end > start) {
          try { data = JSON.parse(content.slice(start, end + 1)); } catch {}
        }
      }
      if (!data || !data.translation) return null;
      const exTarget: string[] = Array.isArray(data.examples_target)
        ? data.examples_target.filter(Boolean).slice(0, 3)
        : (Array.isArray(data.examples) ? data.examples.filter(Boolean).slice(0, 3) : []);
      const exEn: string[] = Array.isArray(data.examples_en)
        ? data.examples_en.filter(Boolean).slice(0, 3)
        : [];
      const out: Translation = {
        lang,
        word,
        translation: String(data.translation || '').trim(),
        synonyms: Array.isArray(data.synonyms) ? data.synonyms.slice(0, 8) : [],
        example: String(data.example || '').trim(),
        examples: exTarget,
        examplesEn: exEn,
        examplesBilingual: Array.isArray(data.examples_bilingual)
          ? data.examples_bilingual
              .map((p: any) => ({ en: String(p?.en || ''), target: String(p?.target || '') }))
              .filter(p => p.en || p.target)
              .slice(0, 3)
          : undefined,
      };
      this.cache[key] = out;
      try { await AsyncStorage.setItem(CACHE_KEY, JSON.stringify(this.cache)); } catch {}
      return out;
    } catch (e) {
      return null;
    }
  }

  // Translate FROM a non‑English language INTO English
  async translateToEnglish(word: string, sourceLang: string): Promise<Translation | null> {
    await this.ensureLoaded();
    const key = `to-en:${(sourceLang || '').toLowerCase()}::${word.toLowerCase()}`;
    const hit = this.cache[key];
    if (hit) return hit;

    try {
      const sourceName = LANG_NAME_MAP[sourceLang?.toLowerCase?.() || ''] || sourceLang;
      const prompt = `You are a translation assistant. Translate the ${sourceName} word strictly to English.
Return ONLY a valid JSON object with these keys:
  translation: string             // the English translation
  synonyms: string[] (3-6 items)  // English synonyms
  examples_en: string[] (exactly 3 short, natural English sentences using the translated English word)
  examples_target: string[] (exactly 3 short, natural sentences in ${sourceName} using the original word)
Also include a legacy alias key examples equal to examples_target for backward compatibility.
No markdown, no commentary. Word: "${word}"`;

      const resp = await fetch(API_BASE_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${OPENAI_API_KEY}`,
        },
        body: JSON.stringify({
          model: 'gpt-4o-mini',
          messages: [
            { role: 'system', content: 'You are a translation assistant.' },
            { role: 'user', content: prompt },
          ],
          temperature: 0.2,
          response_format: { type: 'json_object' },
        }),
      });
      const json = await resp.json();
      const content = json?.choices?.[0]?.message?.content || '';
      let data: any = null;
      try {
        data = typeof content === 'string' ? JSON.parse(content) : content;
      } catch {
        const start = content.indexOf('{');
        const end = content.lastIndexOf('}');
        if (start >= 0 && end > start) {
          try { data = JSON.parse(content.slice(start, end + 1)); } catch {}
        }
      }
      if (!data || !data.translation) return null;
      const exTarget: string[] = Array.isArray(data.examples_target)
        ? data.examples_target.filter(Boolean).slice(0, 3)
        : (Array.isArray(data.examples) ? data.examples.filter(Boolean).slice(0, 3) : []);
      const exEn: string[] = Array.isArray(data.examples_en)
        ? data.examples_en.filter(Boolean).slice(0, 3)
        : [];
      const out: Translation = {
        lang: 'en',
        word,
        translation: String(data.translation || '').trim(),
        synonyms: Array.isArray(data.synonyms) ? data.synonyms.slice(0, 8) : [],
        example: String(data.example || '').trim(),
        examples: exTarget,        // source-language examples
        examplesEn: exEn,          // English examples
        examplesBilingual: Array.isArray(data.examples_bilingual)
          ? data.examples_bilingual
              .map((p: any) => ({ en: String(p?.en || ''), target: String(p?.target || '') }))
              .filter(p => p.en || p.target)
              .slice(0, 3)
          : undefined,
      };
      this.cache[key] = out;
      try { await AsyncStorage.setItem(CACHE_KEY, JSON.stringify(this.cache)); } catch {}
      return out;
    } catch (e) {
      return null;
    }
  }
}

export const TranslationService = new TranslationServiceClass();
export default TranslationService;

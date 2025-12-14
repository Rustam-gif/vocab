import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Image, Animated, Platform, Linking, Modal, PanResponder, Dimensions, Alert } from 'react-native';
import { InteractionManager } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { Plus, Camera, Type, Flame, Clock } from 'lucide-react-native';
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
import { APP_STORE_ID, ANDROID_PACKAGE_NAME, NEWS_API_KEY, NEWS_API_URL, AI_PROXY_URL, BACKEND_BASE_URL } from '../lib/appConfig';
import TopStatusPanel from './components/TopStatusPanel';
import { aiProxyService } from '../services/AiProxyService';
import { supabase } from '../lib/supabase';
import type { Word as MissionWord } from '../core/dailyMissionTypes';
// Minimal screen-focus animation handled inline on Home

const SELECTED_LEVEL_KEY = '@engniter.selectedLevel';

type NewsItem = {
  title: string;
  summary: string;
  vocab: { word: string; definition: string; translation?: string }[];
  image?: string;
  tag?: string;
  category: 'technology' | 'world' | 'business';
  tone: 'positive' | 'negative';
  vocabSource?: 'backend' | 'client' | 'fallback';
  cache_key?: string;
  cache_hit?: boolean;
  generated_at?: string;
};

type HighlightPart = {
  key: string;
  text: string;
  highlighted: boolean;
  definition?: string;
};

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
  // Home stays mounted even when another screen overlays it via our router.
  // Do not hide it here; RouteRenderer controls visibility to avoid flicker.
  const [storyWords, setStoryWords] = useState<MissionWord[]>([]);
  const [activeStoryIndex, setActiveStoryIndex] = useState<number | null>(null);
  const storyDetailAnim = useRef(new Animated.Value(0)).current;
  const [storyViewedMap, setStoryViewedMap] = useState<Record<string, boolean>>({});
  const [showStreakCelebrate, setShowStreakCelebrate] = useState(false);
  const countAnim = useRef(new Animated.Value(0)).current;
  const [displayCount, setDisplayCount] = useState(0);
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
  const [newsCategory, setNewsCategory] = useState<'technology' | 'world' | 'business'>('technology');
  const [newsTone, setNewsTone] = useState<'positive' | 'negative'>('positive');
  const [newsFontScale, setNewsFontScale] = useState<0 | 1 | 2>(1); // 0=small,1=medium,2=large
  const [newsOverrideList, setNewsOverrideList] = useState<NewsItem[] | null>(null);
  const [newsList, setNewsList] = useState<NewsItem[]>([]);
  const [newsStatus, setNewsStatus] = useState<string>('Loading live news…');
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
  const newsPan = useRef(
    PanResponder.create({
      onMoveShouldSetPanResponder: (_, gestureState) => Math.abs(gestureState.dy) > 6,
      onPanResponderMove: (_, gestureState) => {
        const dy = Math.max(0, gestureState.dy);
        newsDrag.setValue(dy);
      },
      onPanResponderRelease: (_, gestureState) => {
        const dy = Math.max(0, gestureState.dy);
        if (dy > 120) {
          closeNewsModal();
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
  const newsFetchStarted = useRef(false);
  const initRanRef = useRef(false);
  const missionFetchKeyRef = useRef<string | null>(null);
  const NEWS_CACHE_VERSION = 'v11-12h';
  const addVaultWord = useAppStore(s => s.addWord);
  const getVaultFolders = useAppStore(s => s.getFolders);
  const createVaultFolder = useAppStore(s => s.createFolder);

  const displayList = useMemo(() => {
    const base = newsOverrideList || newsList;
    const seenKeys = new Set<string>();
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
    let fallbackIdx = 0;

    for (const item of base) {
      const title = (item.title || '').trim();
      const summary = (item.summary || '').trim();
      if (!title && !summary) continue;
      const normTitle = title.toLowerCase();
      const normSummary = summary.toLowerCase().slice(0, 120);
      // In almost all cases, deduplicate purely by title (so the same
      // headline only appears once). For generic fallback titles like
      // "Daily update", also include a slice of the summary so we can
      // still show different topics when the source omits titles.
      const key =
        normTitle === 'daily update'
          ? `${normTitle}|${normSummary}`
          : normTitle;
      if (seenKeys.has(key)) continue;
      seenKeys.add(key);
      let image = item.image || '';
      // If image missing or already used, pick a keyword-based fallback; if still used, rotate generic fallbacks.
      if (!image || usedImages.has(image)) {
        const match = keywordFallbacks.find(k => k.match.test(item.title || '') || k.match.test(item.summary || ''));
        image = match ? match.url : genericFallbacks[fallbackIdx % genericFallbacks.length];
        fallbackIdx += 1;
        // ensure uniqueness across list
        while (usedImages.has(image)) {
          image = genericFallbacks[fallbackIdx % genericFallbacks.length];
          fallbackIdx += 1;
        }
      }
      usedImages.add(image);
      unique.push({ ...item, image });
      if (unique.length >= 12) break;
    }
    return unique;
  }, [newsOverrideList, newsList]);

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
    // Do not artificially extend by repeating sentences; short but clean is better
    // than looping the same text to hit a word target.
    if (words.length <= minWords) return clamped;
    return words.slice(0, minWords).join(' ');
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

  const enrichArticleWithAi = async (article: NewsItem): Promise<NewsItem> => {
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
    return { ...article, summary, vocab, vocabSource };
  };

  const loadCachedNews = async (): Promise<{ articles: NewsItem[]; status: string } | null> => {
    try {
      const raw = await AsyncStorage.getItem('@engniter.news.payload');
      if (!raw) return null;
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed?.articles) && parsed.articles.length > 0) {
        return { articles: parsed.articles, status: parsed.status || 'Live feed (cached)' };
      }
    } catch {}
    return null;
  };

  const refreshNewsFromApi = useCallback(async () => {
    if (!newsConfigured) {
      setNewsStatus('Live feed unavailable');
      setNewsOverrideList(null);
      setNewsList([]);
      setNewsLoading(false);
      if (__DEV__) console.warn('News feed not configured — skipping fetch');
      return;
    }

    // Point to backend cache endpoint (preferred). If NEWS_API_URL is set, use that as an override.
    const backendBase = (BACKEND_BASE_URL || '').replace(/\/$/, '');
    const baseTargetUrl =
      NEWS_API_URL && NEWS_API_URL.trim().length > 0
        ? NEWS_API_URL.trim()
        : `${backendBase || 'http://localhost:4000'}/api/news`;
    // Use the same cache-friendly endpoint in dev and production.
    // If you ever need to force a refresh from the Supabase function,
    // call it with ?refresh=1 from a separate debug path.
    const targetUrl = baseTargetUrl;

    try {
      setNewsLoading(true);
      setNewsStatus('Loading live news…');
      const controller = new AbortController();
      // Allow more time for AI-expanded responses coming from the function.
      const timer = setTimeout(() => controller.abort(), 20000);
      let res: Response | null = null;
      try {
        // Try POST first to force a fresh refresh on the Supabase function
        res = await fetch(targetUrl, {
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
        res = await fetch(targetUrl, {
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
        normalized = articles.slice(0, 10).map((a: any) => {
          const title = a?.title || a?.description || 'Daily update';
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
          return {
            title,
            summary,
            vocab,
            vocabSource,
            cache_key: a?.cache_key,
            cache_hit: a?.cache_hit,
            generated_at: a?.generated_at,
            category: newsCategory,
            tone: newsTone,
            image: a?.image || a?.image_url || a?.urlToImage || fallbackNewsImage,
            tag: 'Live',
          } as NewsItem;
        });
      } else if (data?.title && data?.summary) {
        const backendVocab = Array.isArray(data.vocab) ? data.vocab : null;
        const vocab = backendVocab && backendVocab.length ? backendVocab : vocabFromTitle(data.title);
        const vocabSource: 'backend' | 'fallback' =
          backendVocab && backendVocab.length ? 'backend' : 'fallback';
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
          category: newsCategory,
          tone: newsTone,
          image: (data as any)?.image || (data as any)?.image_url || fallbackNewsImage,
          tag: 'Live',
        }];
      }

      if (normalized.length > 0) {
        const enriched = await Promise.all(normalized.map(enrichArticleWithAi));
        setNewsOverrideList(enriched);
        setNewsList(enriched);
        setNewsStatus(data.status === 'stale' ? 'Live feed (cached)' : 'Live feed');
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
        // No articles returned: attempt stale cache before showing unavailable
        const cached = await loadCachedNews();
        if (cached) {
          setNewsOverrideList(cached.articles);
          setNewsList(cached.articles);
          setNewsStatus(cached.status || 'Live feed (cached)');
        } else {
          setNewsOverrideList(null);
          setNewsList([]);
          setNewsStatus('Live feed unavailable');
        }
      }
    } catch (e) {
      const msg = (e as Error)?.message || '';
      if (msg.includes('rate-limit')) {
        setNewsStatus('Live feed unavailable (rate limited)');
      } else if (msg.includes('auth')) {
        setNewsStatus('Live feed unavailable (server auth)');
      } else {
        // Try stale cache before giving up
        const cached = await loadCachedNews();
        if (cached) {
          setNewsOverrideList(cached.articles);
          setNewsList(cached.articles);
          setNewsStatus(cached.status || 'Live feed (cached)');
          setNewsLoading(false);
          return;
        }
        setNewsStatus('Live feed unavailable');
      }
      setNewsOverrideList(null);
      setNewsList([]);
      if (__DEV__) console.warn('News fetch failed', e);
    } finally {
      setNewsLoading(false);
    }
  }, [NEWS_API_URL, newsCategory, newsTone, NEWS_API_KEY, fallbackNewsImage, enrichArticleWithAi]);

  useEffect(() => {
    if (newsFetchStarted.current) return;
    newsFetchStarted.current = true;
    (async () => {
      // 1) Show any cached payload immediately so the UI is never empty
      try {
        const cached = await loadCachedNews();
        if (cached) {
          setNewsOverrideList(cached.articles);
          setNewsList(cached.articles);
          setNewsStatus(cached.status || 'Live feed (cached)');
        }
      } catch {}
      // 2) Always ask the backend for the latest feed; if it has fresher
      //    data than the cache, it will be returned and replace the list.
      try {
        await refreshNewsFromApi();
      } catch {}
    })();
  }, [refreshNewsFromApi]);

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

  // Load today’s mission summary for the home card without blocking the screen
  useEffect(() => {
    let alive = true;
    const userId = user?.id || 'local-user';
    if (pathname && pathname !== '/') return;
    if (missionFetchKeyRef.current === userId) return;
    missionFetchKeyRef.current = userId;
    (async () => {
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
        const idSet = new Set<string>();
        res.questions.forEach(q => {
          if (q.primaryWordId) idSet.add(q.primaryWordId);
          (q.extraWordIds || []).forEach(id => {
            if (id) idSet.add(id);
          });
        });
        const ids = Array.from(idSet).slice(0, 5);
        if (ids.length) {
          try {
            const words = await getMissionWordsByIds(ids);
            if (alive) {
              setStoryWords(words);
              setActiveStoryIndex(words.length ? 0 : null);
              const firstId = words[0]?.id;
              if (firstId) {
                setStoryViewedMap(prev => (prev[firstId] ? prev : { ...prev, [firstId]: true }));
              }
              storyDetailAnim.setValue(0);
              if (words.length) {
                Animated.timing(storyDetailAnim, { toValue: 1, duration: 220, useNativeDriver: true }).start();
              }
            }
          } catch (err) {
            if (__DEV__) console.warn('failed to load story words', err);
          }
        } else if (alive) {
          setStoryWords([]);
          setActiveStoryIndex(null);
          setStoryViewedMap({});
        }
      } catch (e) {
        console.warn('load mission summary failed', e);
      } finally {
        if (alive) setMissionLoading(false);
      }
    })();
    return () => {
      alive = false;
    };
  }, [user?.id, pathname]);

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

  // Organized sections with softer colors
  const accent = '#187486';
  // Use theme background (light: #F8F8F8, dark: #1E1E1E)
  const background = theme === 'light' ? '#F8F8F8' : '#1E1E1E';
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
  const normalizedStatus = (newsStatus || '').trim();
  const displayNewsStatus =
    normalizedStatus && normalizedStatus.toLowerCase() !== 'ok' ? normalizedStatus : '';
  const heroTag = (primaryArticle?.tag || (normalizedStatus.toLowerCase().includes('live') ? 'Live' : 'Feature')).toUpperCase();

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

  const openNewsModal = (article: NewsItem) => {
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

  const closeNewsModal = () => {
    Animated.timing(newsModalAnim, { toValue: 0, duration: 180, useNativeDriver: true }).start(() => {
      newsDrag.setValue(0);
      setNewsModalVisible(false);
      setModalHighlightParts(null);
    });
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

  return (
    <SafeAreaView edges={['left','right']} style={[styles.container, { backgroundColor: background }] }>
      {/* Fixed top bar; background becomes translucent only after scrolling */}
      <TopStatusPanel
        floating
        includeTopInset
        scrolled={scrolled}
        onHeight={setHeaderHeight}
        isPreview={isPreview}
      />

      <ScrollView
        style={[styles.scrollView, { backgroundColor: background }]}
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

        {/* Today’s Mission */}
        <View style={[styles.missionCard, theme === 'light' && styles.missionCardLight]}>
          <View style={styles.missionHeader}>
            <View style={{ flex: 1 }}>
              <Text style={[styles.missionTitle, theme === 'light' && styles.missionTitleLight]}>Today’s Mission</Text>
              <Text style={[styles.missionSubtitle, theme === 'light' && styles.missionSubtitleLight]}>
                {missionSubtitle}
              </Text>
              <View style={styles.missionPillsRow}>
                <View style={styles.timePill}>
                  <Clock size={14} color={'#0D3B4A'} />
                  <Text style={styles.timePillText}>≈ 5–10 min</Text>
                </View>
              </View>
            </View>
            <View style={styles.streakPill}>
              <Flame size={14} color={'#F8B070'} />
              <Text style={styles.streakPillText}>Streak: {streakCount} days</Text>
            </View>
          </View>
        <View style={[styles.rewardStrip, theme === 'light' && styles.rewardStripLight, { marginTop: 12 }]}>
          <Text style={[styles.rewardText, theme === 'light' && styles.rewardTextLight]}>
            Reward: +{missionXP} XP · Streak: {streakCount} day{streakCount === 1 ? '' : 's'}
          </Text>
        </View>
          {!!missionComposition && !missionIsCompleted && (
            <Text style={[styles.missionHelper, theme === 'light' && styles.missionHelperLight, { marginTop: 6 }]}>
              {missionComposition}
            </Text>
          )}
          <View style={styles.missionActions}>
            {missionIsCompleted ? (
              <>
                <TouchableOpacity
                  activeOpacity={0.9}
                  style={styles.missionPrimary}
                  onPress={() => {
                    router.push('/quiz/learn');
                  }}
                  disabled={missionLoading}
                >
                  <Text style={styles.missionPrimaryText}>Continue studying</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  activeOpacity={0.9}
                  style={[styles.missionSecondary, theme === 'light' && styles.missionSecondaryLight]}
                  onPress={() => {
                    router.push('/mission');
                  }}
                  disabled={missionLoading}
                >
                  <Text style={[styles.missionSecondaryText, theme === 'light' && styles.missionSecondaryTextLight]}>
                    View results
                  </Text>
                </TouchableOpacity>
              </>
            ) : (
              <TouchableOpacity
                activeOpacity={0.9}
                style={styles.missionPrimary}
                onPress={() => {
                  router.push('/mission');
                }}
                disabled={missionLoading}
              >
                <Text style={styles.missionPrimaryText}>{missionCta}</Text>
              </TouchableOpacity>
            )}
          </View>
          {!missionIsCompleted && (
            <Text style={[styles.missionHelper, theme === 'light' && styles.missionHelperLight]}>
              You can exit anytime.
            </Text>
          )}
        </View>

        {!!storyWords.length && (
          <View style={{ marginTop: 4, marginBottom: 12 }}>
            <View
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'space-between',
                paddingHorizontal: 16,
                marginBottom: 8,
              }}
            >
              <Text style={[styles.sectionTitle, theme === 'light' && styles.sectionTitleLight]}>
                Story words
              </Text>
              <Text
                style={[
                  styles.storyViewedLabel,
                  theme === 'light' && styles.storyViewedLabelLight,
                ]}
              >
                {Object.keys(storyViewedMap).filter(id => storyViewedMap[id]).length}/{storyWords.length} viewed
              </Text>
            </View>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={{ paddingHorizontal: 12, paddingBottom: 4 }}
            >
              {storyWords.map((w, index) => {
                const viewed = !!storyViewedMap[w.id];
                const isActive = index === activeStoryIndex;
                const scale =
                  isActive && storyWords.length
                    ? storyDetailAnim.interpolate({
                        inputRange: [0, 1],
                        outputRange: [1, 1.06],
                      })
                    : 1;
                return (
                  <TouchableOpacity
                    key={w.id}
                    activeOpacity={0.9}
                    onPress={() => {
                      setActiveStoryIndex(index);
                      setStoryViewedMap(prev => (prev[w.id] ? prev : { ...prev, [w.id]: true }));
                      storyDetailAnim.setValue(0);
                      Animated.timing(storyDetailAnim, {
                        toValue: 1,
                        duration: 200,
                        useNativeDriver: true,
                      }).start();
                    }}
                    style={{ marginRight: 10 }}
                  >
                    <Animated.View
                      style={[
                        styles.storyBubble,
                        theme === 'light' && styles.storyBubbleLight,
                        {
                          opacity: viewed ? 1 : 0.9,
                          transform: [{ scale }],
                        },
                      ]}
                    >
                      <Text
                        numberOfLines={1}
                        style={[
                          styles.storyBubbleText,
                          theme === 'light' && styles.storyBubbleTextLight,
                        ]}
                      >
                        {w.text}
                      </Text>
                    </Animated.View>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
            {activeStoryIndex != null && storyWords[activeStoryIndex] && (
              <Animated.View
                style={[
                  styles.storyDetailCard,
                  theme === 'light' && styles.storyDetailCardLight,
                  {
                    opacity: storyDetailAnim,
                    transform: [
                      {
                        translateY: storyDetailAnim.interpolate({
                          inputRange: [0, 1],
                          outputRange: [8, 0],
                        }),
                      },
                    ],
                  },
                ]}
              >
                <Text
                  style={[
                    styles.storyDetailWord,
                    theme === 'light' && styles.storyDetailWordLight,
                  ]}
                >
                  {storyWords[activeStoryIndex].text}
                </Text>
                <Text
                  style={[
                    styles.storyDetailDefinition,
                    theme === 'light' && styles.storyDetailDefinitionLight,
                  ]}
                >
                  {storyWords[activeStoryIndex].definition}
                </Text>
                {!!storyWords[activeStoryIndex].exampleSentence && (
                  <Text
                    style={[
                      styles.storyDetailExample,
                      theme === 'light' && styles.storyDetailExampleLight,
                    ]}
                  >
                    {storyWords[activeStoryIndex].exampleSentence}
                  </Text>
                )}
              </Animated.View>
            )}
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
                <Text style={[styles.newsLabel, theme === 'light' && styles.newsLabelLight]}>Daily News</Text>
                {displayNewsStatus ? (
                  <Text style={[styles.newsStatus, theme === 'light' && styles.newsStatusLight]}>
                    {displayNewsStatus}
                  </Text>
                ) : null}
              </View>
            </View>
          </View>

          {/* Settings removed */}

          {carouselNews.length > 0 && carouselPageWidth > 0 && slideWidth > 0 && (
            <View style={{ marginTop: 8 }}>
              <Animated.ScrollView
                horizontal
                pagingEnabled
                snapToInterval={carouselPageWidth}
                snapToAlignment="start"
                decelerationRate="fast"
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={{ paddingHorizontal: 0 }}
                style={{ marginTop: 4 }}
                onScroll={Animated.event(
                  [{ nativeEvent: { contentOffset: { x: heroScrollX } } }],
                  { useNativeDriver: false }
                )}
                scrollEventThrottle={16}
              >
                {carouselNews.map((item, idx) => (
                  <TouchableOpacity
                    key={`${item.title}-${idx}-hero`}
                    activeOpacity={0.9}
                    onPress={() => openNewsModal(item)}
                  >
                    <View style={{ width: slideWidth, marginHorizontal: NEWS_CAROUSEL_HORIZONTAL_PADDING }}>
                      <View
                        style={[
                          styles.newsHeroShell,
                          theme === 'light' && styles.newsHeroShellLight,
                          {
                            shadowColor: '#000',
                            shadowOpacity: 0.08,
                            shadowRadius: 10,
                            shadowOffset: { width: 0, height: 6 },
                            elevation: 4,
                          },
                        ]}
                      >
                        <View style={[styles.newsHeroImageWrap, theme === 'light' && styles.newsHeroImageWrapLight]}>
                          <Image source={{ uri: item.image || fallbackNewsImage }} style={styles.newsHeroImage} />
                          <View style={styles.newsHeroOverlay} />
                          <View style={styles.newsHeroBadgeRow}>
                            <Text style={[styles.newsHeroBadge, theme === 'light' && styles.newsHeroBadgeLight]}>
                              {(item.tag || 'Live').toUpperCase()}
                            </Text>
                          </View>
                          {displayNewsStatus ? (
                            <View
                              style={[
                                styles.newsHeroStatusPill,
                                theme === 'light' && styles.newsHeroStatusPillLight,
                              ]}
                            >
                              <Text
                                style={[
                                  styles.newsHeroStatusText,
                                  theme === 'light' && styles.newsHeroStatusTextLight,
                                ]}
                              >
                                {displayNewsStatus}
                              </Text>
                            </View>
                          ) : null}
                        </View>
                        <View style={styles.newsHeroContent}>
                          <Text
                            style={[
                              styles.newsTitle,
                              theme === 'light' && styles.newsTitleLight,
                              newsFontScale === 2 && { fontSize: 20 },
                              newsFontScale === 0 && { fontSize: 16 },
                            ]}
                            numberOfLines={3}
                          >
                            {item.title}
                          </Text>
                        {renderHighlightedText(
                          item.summary,
                          item.vocab,
                          {
                            style: [
                              styles.newsSummary,
                              theme === 'light' && styles.newsSummaryLight,
                              newsFontScale === 2 && { fontSize: 19, lineHeight: 30 },
                              newsFontScale === 0 && { fontSize: 15, lineHeight: 23 },
                            ],
                            numberOfLines: 3,
                          },
                        )}
                          {!!item.vocab?.length && (
                            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 8 }}>
                              {item.vocab.slice(0, 5).map((v, vocabIndex) => (
                                <View
                                  key={`${v.word || 'word'}-${vocabIndex}`}
                                  style={{
                                    backgroundColor: 'rgba(255,255,255,0.16)',
                                    borderRadius: 8,
                                    paddingHorizontal: 8,
                                    paddingVertical: 4,
                                  }}
                                >
                                  <Text style={{ color: '#FFFFFF', fontWeight: '700' }}>{v.word}</Text>
                                </View>
                              ))}
                            </View>
                          )}
                          <Text
                            style={[
                              styles.newsToggleText,
                              theme === 'light' && styles.newsToggleTextLight,
                              styles.newsToggleInline,
                            ]}
                          >
                            Tap to open
                          </Text>
                        </View>
                      </View>
                    </View>
                  </TouchableOpacity>
                ))}
              </Animated.ScrollView>
              <View style={{ flexDirection: 'row', justifyContent: 'center', marginTop: 10, gap: 6, paddingBottom: 24 }}>
                {carouselNews.map((_, i) => {
                  const interval = carouselPageWidth;
                  const inputRange = [(i - 1) * interval, i * interval, (i + 1) * interval];
                  const dotOpacity = heroScrollX.interpolate({
                    inputRange,
                    outputRange: [0.35, 1, 0.35],
                    extrapolate: 'clamp',
                  });
                  const dotScale = heroScrollX.interpolate({
                    inputRange,
                    outputRange: [0.9, 1.25, 0.9],
                    extrapolate: 'clamp',
                  });
                  return <Animated.View key={`hero-dot-${i}`} style={{ width: 10, height: 10, borderRadius: 5, backgroundColor: '#0D6174', opacity: dotOpacity, transform: [{ scale: dotScale }] }} />;
                })}
              </View>
            </View>
          )}
        </View>

        <Modal visible={newsModalVisible} transparent animationType="none" onRequestClose={closeNewsModal}>
          <View style={styles.newsModalOverlay}>
            <TouchableOpacity style={styles.newsModalBackdrop} activeOpacity={1} onPress={closeNewsModal} />
            <Animated.View
              style={[
                styles.newsModalSheet,
                theme === 'light' && styles.newsModalSheetLight,
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
                  maxHeight: Dimensions.get('window').height * 0.88,
                },
              ]}
            >
              <View style={[styles.newsModalHandle, theme === 'light' && styles.newsModalHandleLight]} />
              <TouchableOpacity
                onPress={closeNewsModal}
                style={{ position: 'absolute', top: 8, right: 8, padding: 4, zIndex: 2, backgroundColor: 'transparent' }}
                hitSlop={{ top: 8, right: 8, bottom: 8, left: 8 }}
              >
                <Text style={{ fontSize: 18, fontWeight: '800', color: theme === 'light' ? '#0D3B4A' : '#E5E7EB' }}>×</Text>
              </TouchableOpacity>
              {newsModalArticle && (
                <ScrollView
                  showsVerticalScrollIndicator
                  bounces
                  scrollEventThrottle={16}
                  contentContainerStyle={{ paddingBottom: 32 }}
                >
                  <Image source={{ uri: newsModalArticle.image || fallbackNewsImage }} style={styles.newsModalImage} />
                  <View style={styles.newsModalTagRow}>
                    <Text style={styles.newsModalTag}>{(newsModalArticle.tag || 'Story').toUpperCase()}</Text>
                  </View>
                  <Text
                    style={[styles.newsModalSummary, theme === 'light' && styles.newsModalSummaryLight]}
                    allowFontScaling={false}
                  >
                    {(modalHighlightParts && modalHighlightParts.length
                      ? modalHighlightParts
                      : buildHighlightParts(newsModalArticle.summary, newsModalArticle.vocab)
                    ).map((part) =>
                      part.highlighted ? (
                        <Text
                          key={part.key}
                          style={[
                            { fontWeight: '800', color: '#F8B070' },
                            theme === 'light' && { color: '#9A3412' },
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
                  <View style={[styles.newsGlossary, theme === 'light' && styles.newsGlossaryLight]}>
                    <Text style={[styles.newsGlossaryTitle, theme === 'light' && styles.newsGlossaryTitleLight]}>Vocabulary</Text>
                    {newsModalArticle.vocab.map((item, vocabIndex) => (
                      <Text key={`${item.word || 'word'}-${vocabIndex}`} style={[styles.newsGlossaryItem, theme === 'light' && styles.newsGlossaryItemLight, { fontSize: 15 }]}>
                        <Text style={{ fontWeight: '700' }}>{item.word}</Text> — {item.definition}
                        {!!item.translation && (
                          <Text style={{ color: theme === 'light' ? '#9A3412' : '#F8B070' }}> ({item.translation})</Text>
                        )}
                      </Text>
                    ))}
                  </View>
                </ScrollView>
              )}
              <TouchableOpacity onPress={closeNewsModal} activeOpacity={0.8} style={[styles.newsToggleBtn, { alignSelf: 'stretch', marginTop: 12, alignItems: 'center' }]}>
                <Text style={[styles.newsToggleText, theme === 'light' && styles.newsToggleTextLight]}>Close</Text>
              </TouchableOpacity>
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
        onClose={async () => {
          setShowOnboarding(false);
          try { await AsyncStorage.setItem('@engniter.onboarding_done_v1', '1'); } catch {}
          // Immediately guide first‑time users to Placement intro explaining the test
          try { router.push('/placement'); } catch {}
        }}
      />)}

      {/* Daily streak celebration (once per day) */}
      {showStreakCelebrate && !isPreview && (
        <View style={styles.celebrateOverlay}>
          <View style={[styles.celebrateCard, theme === 'light' && styles.celebrateCardLight]}> 
            <LottieView source={require('../assets/lottie/flame.json')} autoPlay loop style={{ width: 140, height: 140 }} />
            <Text style={[styles.celebrateCount, theme === 'light' && styles.celebrateCountLight]}>{displayCount}</Text>
            <Text style={[styles.celebrateLabel, theme === 'light' && styles.celebrateLabelLight]}>day streak</Text>
            <Text style={[styles.celebrateHint, theme === 'light' && styles.celebrateHintLight]}>Keep it up — practice again tomorrow!</Text>
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
            >
              <Text style={styles.celebrateBtnText}>Awesome</Text>
            </TouchableOpacity>
          </View>
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
    fontFamily: 'Ubuntu-Bold',
  },
  missionTitleLight: { color: '#0D3B4A' },
  missionSubtitle: {
    fontSize: 14,
    color: '#E5E7EB',
    lineHeight: 18,
    fontFamily: 'Ubuntu-Regular',
  },
  missionSubtitleLight: { color: '#4B5563' },
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
    backgroundColor: '#FDE9D9',
  },
  timePillText: {
    color: '#0D3B4A',
    fontWeight: '700',
    fontSize: 12,
    fontFamily: 'Ubuntu-Bold',
  },
  streakPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
    backgroundColor: 'rgba(24,116,134,0.12)',
    alignSelf: 'flex-start',
  },
  streakPillText: {
    color: '#187486',
    fontWeight: '700',
    fontSize: 12,
    fontFamily: 'Ubuntu-Bold',
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
    color: '#E5E7EB',
    fontFamily: 'Ubuntu-Medium',
  },
  missionProgressTextLight: { color: '#4B5563' },
  missionProgressBar: {
    height: 6,
    backgroundColor: 'rgba(255,255,255,0.16)',
    borderRadius: 999,
    overflow: 'hidden',
  },
  missionProgressFill: {
    height: '100%',
    backgroundColor: '#F8B070',
    borderRadius: 999,
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
  newsCard: {
    marginHorizontal: 16,
    marginBottom: 16,
    paddingVertical: 14,
    paddingHorizontal: 0,
    borderRadius: 14,
    backgroundColor: 'transparent',
    gap: 10,
  },
  newsCardLight: { backgroundColor: '#FFFFFF' },
  newsHeaderRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 10 },
  newsLabel: { fontSize: 12, fontWeight: '700', color: '#9CA3AF', textTransform: 'uppercase', letterSpacing: 0.6, fontFamily: 'Ubuntu-Bold' },
  newsLabelLight: { color: '#4B5563' },
  newsTitle: { marginTop: 4, fontSize: 18, fontWeight: '800', color: '#E5E7EB', fontFamily: 'Ubuntu-Bold' },
  newsTitleLight: { color: '#0D3B4A' },
  newsSummary: { marginTop: 6, fontSize: 17, lineHeight: 26, color: '#D1D5DB', fontFamily: 'Ubuntu-Regular' },
  newsSummaryLight: { color: '#374151' },
  newsGlossary: { marginTop: 12, padding: 10, borderRadius: 12, backgroundColor: 'rgba(255,255,255,0.04)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)', gap: 6 },
  newsGlossaryLight: { backgroundColor: '#F8FAFC', borderColor: '#E5E7EB' },
  newsGlossaryTitle: { fontSize: 12, fontWeight: '700', color: '#9CA3AF', textTransform: 'uppercase', letterSpacing: 0.5, fontFamily: 'Ubuntu-Bold' },
  newsGlossaryTitleLight: { color: '#6B7280' },
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
  newsModalSheet: { backgroundColor: '#1E1E1E', borderTopLeftRadius: 18, borderTopRightRadius: 18, padding: 18, paddingBottom: 28, maxHeight: '98%' },
  newsModalSheetLight: { backgroundColor: '#FFFFFF' },
  newsModalHandle: { width: 42, height: 4, borderRadius: 999, alignSelf: 'center', backgroundColor: '#4B5563', marginBottom: 12 },
  newsModalHandleLight: { backgroundColor: '#E5E7EB' },
  newsModalImage: { width: '100%', height: 180, borderRadius: 12, marginBottom: 12 },
  newsModalTagRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 6 },
  newsModalTag: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12, backgroundColor: '#F8B070', color: '#0D3B4A', fontWeight: '800', fontSize: 12 },
  newsModalTagMuted: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12, backgroundColor: 'rgba(255,255,255,0.08)', color: '#E5E7EB', fontWeight: '700', fontSize: 12 },
  newsModalTitle: { fontSize: 20, fontWeight: '800', color: '#E5E7EB', fontFamily: 'Ubuntu-Bold', marginTop: 4 },
  newsModalTitleLight: { color: '#0D3B4A' },
  newsModalSummary: { marginTop: 8, fontSize: 17, lineHeight: 27, color: '#D1D5DB', fontFamily: 'Ubuntu-Regular' },
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
    backgroundColor: 'rgba(0,0,0,0.35)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  celebrateCard: {
    width: '90%',
    maxWidth: 420,
    borderRadius: 16,
    backgroundColor: '#1E1E1E',
    alignItems: 'center',
    paddingVertical: 24,
    paddingHorizontal: 16,
  },
  celebrateCardLight: { backgroundColor: '#FFFFFF' },
  celebrateCount: { fontSize: 64, color: '#F8B070', fontWeight: '900', marginTop: 6 },
  celebrateCountLight: { color: '#E06620' },
  celebrateLabel: { color: '#E5E7EB', fontWeight: '800', marginTop: -6, textTransform: 'lowercase' },
  celebrateLabelLight: { color: '#111827' },
  celebrateHint: { marginTop: 12, color: '#9CA3AF', textAlign: 'center' },
  celebrateHintLight: { color: '#6B7280' },
  celebrateBtn: { marginTop: 16, backgroundColor: '#F8B070', paddingHorizontal: 18, paddingVertical: 10, borderRadius: 12 },
  celebrateBtnText: { color: '#0D3B4A', fontWeight: '800' },
  navBar: { paddingHorizontal: 12, gap: 10 },
  navItem: { paddingVertical: 10, paddingHorizontal: 12, borderRadius: 14, backgroundColor: '#2A3033', borderWidth: 1, borderColor: '#364147', marginRight: 10, alignItems: 'center', width: 84 },
  navItemLight: { backgroundColor: '#E9F4F1', borderColor: '#D7E7E2' },
  navIconWrap: { width: 42, height: 42, borderRadius: 12, backgroundColor: 'rgba(255,255,255,0.18)', alignItems: 'center', justifyContent: 'center', marginBottom: 6 },
  navIcon: { width: 28, height: 28 },
  navLabel: { color: '#E5E7EB', fontWeight: '700', fontSize: 12, textAlign: 'center' },
  navLabelLight: { color: '#0D3B4A' },
  
});

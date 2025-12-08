import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Image, Animated, Platform, Linking, Modal } from 'react-native';
import { InteractionManager } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { Plus, Camera, Type, Flame, Clock } from 'lucide-react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useAppStore } from '../lib/store';
import { getTheme } from '../lib/theme';
import { getTodayMissionForUser } from '../services/dailyMission';
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
// Minimal screen-focus animation handled inline on Home

const SELECTED_LEVEL_KEY = '@engniter.selectedLevel';

type NewsItem = {
  title: string;
  summary: string;
  vocab: { word: string; definition: string }[];
  image?: string;
  tag?: string;
  category: 'technology' | 'world' | 'business';
  tone: 'positive' | 'negative';
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
  const [newsModalArticle, setNewsModalArticle] = useState<NewsItem | null>(null);
  const newsFetchStarted = useRef(false);
  const initRanRef = useRef(false);
  const missionFetchKeyRef = useRef<string | null>(null);

  const displayList = useMemo(() => {
    const base = newsOverrideList || newsList;
    const seenTitles = new Set<string>();
    const fallbackImages = [
      'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=1200&q=80',
      'https://images.unsplash.com/photo-1504384308090-c894fdcc538d?auto=format&fit=crop&w=1200&q=80',
      'https://images.unsplash.com/photo-1451187580459-43490279c0fa?auto=format&fit=crop&w=1200&q=80',
      'https://images.unsplash.com/photo-1487412720507-e7ab37603c6f?auto=format&fit=crop&w=1200&q=80',
      'https://images.unsplash.com/photo-1487058792275-0ad4aaf24ca7?auto=format&fit=crop&w=1200&q=80',
      'https://images.unsplash.com/photo-1472214103451-9374bd1c798e?auto=format&fit=crop&w=1200&q=80',
      'https://images.unsplash.com/photo-1520607162513-77705c0f0d4a?auto=format&fit=crop&w=1200&q=80',
    ];
    const unique: NewsItem[] = [];
    let fallbackIdx = 0;

    for (const item of base) {
      const key = (item.title || '').trim().toLowerCase();
      if (!key || seenTitles.has(key)) continue;
      seenTitles.add(key);
      let image = item.image || '';
      if (!image) {
        image = fallbackImages[fallbackIdx % fallbackImages.length];
        fallbackIdx += 1;
      }
      unique.push({ ...item, image });
      if (unique.length >= 12) break;
    }
    return unique;
  }, [newsOverrideList, newsList]);

  const displayNews = displayList && displayList.length ? displayList[0] : null;
  const extraNews = displayNews ? displayList.slice(1, 9) : [];

  const extendSummary = (raw: string, title: string) => {
    const safe = (raw || '').trim() || title || 'A brief news update.';
    const filler =
      ' Analysts add that the situation is still developing, and officials promise more updates later. ' +
      'Local voices note both challenges and opportunities as plans move forward. ' +
      'Experts remind readers to follow verified sources and to look for context instead of headlines alone.';
    let words = safe.split(/\s+/);
    if (words.length < 150) {
      const needed = 150 - words.length;
      const fillerWords = filler.repeat(3).split(/\s+/).slice(0, needed + 40);
      words = words.concat(fillerWords);
    }
    if (words.length > 230) words = words.slice(0, 230);
    return words.join(' ');
  };

  const vocabFromTitle = (title: string) =>
    (title || '')
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 5)
      .map(w => ({ word: w.replace(/[^a-zA-Z]/g, ''), definition: 'Key word from headline' }));

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

  const buildAiVocab = async (article: NewsItem): Promise<{ word: string; definition: string }[] | null> => {
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
          const def = translation && target !== 'English'
            ? `${definition} (${target}: ${translation})`
            : definition;
          return { word, definition: def };
        })
        .filter(Boolean) as { word: string; definition: string }[];
      return normalized.slice(0, 5);
    } catch (e) {
      if (__DEV__) console.warn('AI vocab enrichment failed or timed out', e);
      return null;
    }
  };

  const enrichArticleWithAi = async (article: NewsItem): Promise<NewsItem> => {
    const aiVocab = await buildAiVocab(article);
    const vocab = (aiVocab && aiVocab.length) ? aiVocab : (article.vocab?.length ? article.vocab : vocabFromTitle(article.title));
    return { ...article, vocab };
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
    const targetUrl =
      NEWS_API_URL && NEWS_API_URL.trim().length > 0
        ? NEWS_API_URL.trim()
        : `${backendBase || 'http://localhost:4000'}/api/news`;

    try {
      setNewsLoading(true);
      setNewsStatus('Loading live news…');
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), 8000);
      const res = await fetch(targetUrl, {
        headers: {
          'Content-Type': 'application/json',
        },
        signal: controller.signal,
      });
      clearTimeout(timer);
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

      const articles = Array.isArray((data as any)?.articles) ? (data as any).articles : Array.isArray((data as any)) ? (data as any) : [];

      if (articles.length) {
        normalized = articles.slice(0, 10).map((a: any) => {
          const title = a?.title || a?.description || 'Daily update';
          const baseSummary = a?.content || a?.description || '';
          return {
            title,
            summary: extendSummary(baseSummary, title),
            vocab: vocabFromTitle(title),
            category: newsCategory,
            tone: newsTone,
            image: a?.urlToImage || fallbackNewsImage,
            tag: 'Live',
          } as NewsItem;
        });
      } else if (data?.title && data?.summary) {
        normalized = [{
          title: data.title,
          summary: extendSummary(data.summary, data.title),
          vocab: Array.isArray(data.vocab) ? data.vocab : vocabFromTitle(data.title),
          category: newsCategory,
          tone: newsTone,
          image: (data as any)?.image || fallbackNewsImage,
          tag: 'Live',
        }];
      }

      if (normalized.length > 0) {
        const enriched = await Promise.all(normalized.map(enrichArticleWithAi));
        setNewsOverrideList(enriched);
        setNewsList(enriched);
        setNewsStatus(data.status === 'stale' ? 'Live feed (cached)' : 'Live feed');
      } else {
        setNewsOverrideList(null);
        setNewsList([]);
        setNewsStatus('Live feed unavailable');
      }
    } catch (e) {
      const msg = (e as Error)?.message || '';
      if (msg.includes('rate-limit')) {
        setNewsStatus('Live feed unavailable (rate limited)');
      } else if (msg.includes('auth')) {
        setNewsStatus('Live feed unavailable (server auth)');
      } else {
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
    const task = InteractionManager.runAfterInteractions(() => {
      refreshNewsFromApi().catch(() => {});
    });
    return () => {
      try { task?.cancel && task.cancel(); } catch {}
    };
  }, [refreshNewsFromApi]);

  let missionSubtitle = 'A 5-question sprint to refresh your words.';
  let missionCta = 'Start Mission';
  if (missionLoading) {
    missionSubtitle = 'Loading mission…';
    missionCta = 'Loading…';
  } else if (missionStatus === 'completed') {
    missionSubtitle = `Completed: ${missionCorrect}/${missionTotal} correct · Streak: ${streakCount} day${streakCount === 1 ? '' : 's'}`;
    missionCta = 'View Results';
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
        const review = res.questions.filter(q => q.type === 'weak_word_mcq').length;
        const fresh = res.questions.filter(q => q.type === 'new_word_mcq').length;
        const story = res.questions.filter(q => q.type === 'story_mcq').length;
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
  const background = colors.background;
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
  const categoryLabel = displayNews?.category === 'technology'
    ? 'Tech'
    : displayNews?.category === 'world'
      ? 'World'
      : displayNews?.category === 'business'
        ? 'Business'
        : 'Today';
  const toneLabel = displayNews?.tone === 'negative' ? 'Serious' : displayNews?.tone === 'positive' ? 'Positive' : 'Neutral';
  const heroTag = (displayNews?.tag || (newsStatus.toLowerCase().includes('live') ? 'Live' : 'Feature')).toUpperCase();
  const heroImage = displayNews?.image || fallbackNewsImage;
  const mainPreviewLines = newsFontScale === 2 ? 4 : newsFontScale === 0 ? 2 : 3;

  const renderHighlightedText = (
    text: string,
    vocabList: { word: string }[],
    props: any,
    highlightStyle?: any
  ) => {
    const cleanWords = (vocabList || []).map(v => (v.word || '').trim()).filter(Boolean);
    if (!cleanWords.length) return <Text {...props}>{text}</Text>;
    const escaped = cleanWords.map(w => w.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'));
    const regex = new RegExp(`\\b(${escaped.join('|')})\\b`, 'gi');
    const parts = text.split(regex);
    return (
      <Text {...props}>
        {parts.map((part, idx) => {
          const match = cleanWords.some(w => w.toLowerCase() === part.toLowerCase());
          if (match) {
            return (
              <Text key={idx} style={[{ fontWeight: '800', color: '#F8B070' }, highlightStyle]}>
                {part}
              </Text>
            );
          }
          return <Text key={idx}>{part}</Text>;
        })}
      </Text>
    );
  };

  const openNewsModal = (article: NewsItem) => {
    setNewsModalArticle(article);
    setNewsModalVisible(true);
    newsModalAnim.setValue(0);
    Animated.timing(newsModalAnim, { toValue: 1, duration: 220, useNativeDriver: true }).start();
  };

  const closeNewsModal = () => {
    Animated.timing(newsModalAnim, { toValue: 0, duration: 180, useNativeDriver: true }).start(() => setNewsModalVisible(false));
  };

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
          {!!missionComposition && (
            <Text style={[styles.missionHelper, theme === 'light' && styles.missionHelperLight, { marginTop: 6 }]}>
              {missionComposition}
            </Text>
          )}
          <View style={styles.missionActions}>
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
          </View>
          <Text style={[styles.missionHelper, theme === 'light' && styles.missionHelperLight]}>You can exit anytime.</Text>
        </View>

        {/* Daily News */}
        <View style={[styles.newsCard, theme === 'light' && styles.newsCardLight]}>
          <View style={styles.newsHeaderRow}>
            <View style={{ flex: 1 }}>
              <Text style={[styles.newsLabel, theme === 'light' && styles.newsLabelLight]}>Daily News</Text>
              <Text style={[styles.newsStatus, theme === 'light' && styles.newsStatusLight]}>{newsStatus}</Text>
            </View>
            <TouchableOpacity
              onPress={() => setNewsMenuOpen(o => !o)}
              activeOpacity={0.8}
              style={[
                styles.newsSettingsBtn,
                theme === 'light' && styles.newsSettingsBtnLight,
                newsMenuOpen && styles.newsSettingsBtnActive,
              ]}
            >
              <Text style={[styles.newsSettingsIcon, theme === 'light' && styles.newsSettingsIconLight]}>⋯</Text>
            </TouchableOpacity>
          </View>

          {newsMenuOpen && (
            <View style={[styles.newsSettingsCard, theme === 'light' && styles.newsSettingsCardLight]}>
              <Text style={[styles.newsSettingsLabel, theme === 'light' && styles.newsSettingsLabelLight]}>Category</Text>
              <View style={styles.newsControlsRow}>
                {(['technology', 'world', 'business'] as const).map(cat => (
                  <TouchableOpacity
                    key={cat}
                    onPress={() => setNewsCategory(cat)}
                    style={[
                      styles.newsChip,
                      newsCategory === cat && styles.newsChipActive,
                      theme === 'light' && styles.newsChipLight,
                      theme === 'light' && newsCategory === cat && styles.newsChipActiveLight,
                    ]}
                  >
                    <Text style={[styles.newsChipText, newsCategory === cat && styles.newsChipTextActive]}>
                      {cat === 'technology' ? 'Tech' : cat === 'world' ? 'World' : 'Business'}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              <Text style={[styles.newsSettingsLabel, theme === 'light' && styles.newsSettingsLabelLight]}>Tone</Text>
              <View style={styles.newsControlsRow}>
                {(['positive', 'negative'] as const).map(tone => (
                  <TouchableOpacity
                    key={tone}
                    onPress={() => setNewsTone(tone)}
                    style={[
                      styles.newsChip,
                      newsTone === tone && styles.newsChipActive,
                      theme === 'light' && styles.newsChipLight,
                      theme === 'light' && newsTone === tone && styles.newsChipActiveLight,
                    ]}
                  >
                    <Text style={[styles.newsChipText, newsTone === tone && styles.newsChipTextActive]}>
                      {tone === 'positive' ? 'Positive' : 'Negative'}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              <Text style={[styles.newsSettingsLabel, theme === 'light' && styles.newsSettingsLabelLight]}>Size</Text>
              <View style={styles.newsControlsRow}>
                {([0, 1, 2] as const).map(size => (
                  <TouchableOpacity
                    key={size}
                    onPress={() => setNewsFontScale(size)}
                    style={[
                      styles.newsChip,
                      newsFontScale === size && styles.newsChipActive,
                      theme === 'light' && styles.newsChipLight,
                      theme === 'light' && newsFontScale === size && styles.newsChipActiveLight,
                    ]}
                  >
                    <Text style={[styles.newsChipText, newsFontScale === size && styles.newsChipTextActive]}>
                      {size === 0 ? 'S' : size === 1 ? 'M' : 'L'}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          )}

          {displayNews && (
            <>
              <View style={[styles.newsHeroShell, theme === 'light' && styles.newsHeroShellLight]}>
                <View style={[styles.newsHeroImageWrap, theme === 'light' && styles.newsHeroImageWrapLight]}>
                  <Image source={{ uri: heroImage }} style={styles.newsHeroImage} />
                  <View style={styles.newsHeroOverlay} />
                  <View style={styles.newsHeroBadgeRow}>
                    <Text style={[styles.newsHeroBadge, theme === 'light' && styles.newsHeroBadgeLight]}>{heroTag}</Text>
                    <Text style={[styles.newsHeroBadgeMuted, theme === 'light' && styles.newsHeroBadgeMutedLight]}>{categoryLabel} · {toneLabel}</Text>
                  </View>
                  <View style={[styles.newsHeroStatusPill, theme === 'light' && styles.newsHeroStatusPillLight]}>
                    <Text style={[styles.newsHeroStatusText, theme === 'light' && styles.newsHeroStatusTextLight]}>{newsStatus}</Text>
                  </View>
                </View>

                <TouchableOpacity activeOpacity={0.9} onPress={() => openNewsModal(displayNews)} style={styles.newsHeroContent}>
                  <Text style={[
                    styles.newsTitle,
                    theme === 'light' && styles.newsTitleLight,
                    newsFontScale === 2 && { fontSize: 20 },
                    newsFontScale === 0 && { fontSize: 16 },
                  ]}>
                    {displayNews.title}
                  </Text>
                  {renderHighlightedText(
                    displayNews.summary,
                    displayNews.vocab,
                    {
                      style: [
                        styles.newsSummary,
                        theme === 'light' && styles.newsSummaryLight,
                        newsFontScale === 2 && { fontSize: 15, lineHeight: 22 },
                        newsFontScale === 0 && { fontSize: 13, lineHeight: 19 },
                      ],
                      numberOfLines: mainPreviewLines,
                    },
                  )}
                  <Text style={[styles.newsToggleText, theme === 'light' && styles.newsToggleTextLight, styles.newsToggleInline]}>
                    Tap to open
                  </Text>
                </TouchableOpacity>
              </View>

              <View style={[styles.newsGlossary, theme === 'light' && styles.newsGlossaryLight]}>
                <Text style={[styles.newsGlossaryTitle, theme === 'light' && styles.newsGlossaryTitleLight]}>Vocabulary</Text>
                {(displayNews.vocab || []).map(item => (
                  <Text
                    key={item.word}
                    style={[
                      styles.newsGlossaryItem,
                      theme === 'light' && styles.newsGlossaryItemLight,
                      newsFontScale === 2 && { fontSize: 13 },
                      newsFontScale === 0 && { fontSize: 11 },
                    ]}
                  >
                    <Text style={{ fontWeight: '700' }}>{item.word}</Text> — {item.definition}
                  </Text>
                ))}
              </View>

              {!!extraNews.length && (
                <View style={styles.newsCarouselSection}>
                  <Text style={[styles.newsLabel, theme === 'light' && styles.newsLabelLight]}>Headline previews</Text>
                  <ScrollView
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    contentContainerStyle={{ gap: 12, paddingVertical: 4, paddingRight: 4 }}
                    style={{ marginTop: 10 }}
                  >
                    {extraNews.map((n, idx) => (
                      <TouchableOpacity
                        key={`${n.title}-${idx}-preview`}
                    activeOpacity={0.9}
                    onPress={() => openNewsModal(n)}
                  >
                    <View style={[styles.newsPreviewCard, theme === 'light' && styles.newsPreviewCardLight]}>
                      <Image source={{ uri: n.image || fallbackNewsImage }} style={styles.newsPreviewImage} />
                      <View style={styles.newsPreviewOverlay} />
                      <View style={styles.newsPreviewCopy}>
                        <Text style={[styles.newsPreviewTag, theme === 'light' && styles.newsPreviewTagLight]}>{(n.tag || 'Story').toUpperCase()}</Text>
                        <Text style={[styles.newsPreviewTitle, theme === 'light' && styles.newsPreviewTitleLight, { color: '#FFFFFF', textShadowColor: 'rgba(0,0,0,0.4)', textShadowRadius: 6 }]} numberOfLines={3}>{n.title}</Text>
                      </View>
                    </View>
                  </TouchableOpacity>
                ))}
              </ScrollView>
                </View>
              )}

              {!!extraNews.length && (
                <View style={styles.newsExtraList}>
                  <Text style={[styles.newsLabel, theme === 'light' && styles.newsLabelLight]}>More news</Text>
                  {extraNews.map((n, idx) => {
                    return (
                      <TouchableOpacity
                        key={`${n.title}-${idx}`}
                        activeOpacity={0.9}
                        onPress={() => openNewsModal(n)}
                        style={[styles.newsExtraRow, theme === 'light' && styles.newsExtraRowLight]}
                      >
                        <Image source={{ uri: n.image || fallbackNewsImage }} style={styles.newsExtraThumb} />
                        <View style={{ flex: 1, gap: 4 }}>
                          <Text style={[styles.newsExtraTitle, theme === 'light' && styles.newsExtraTitleLight]} numberOfLines={3}>{n.title}</Text>
                          <Text style={[styles.newsToggleText, theme === 'light' && styles.newsToggleTextLight, styles.newsToggleInline]}>
                            Open story
                          </Text>
                        </View>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              )}
            </>
          )}
        </View>

        <Modal visible={newsModalVisible} transparent animationType="none" onRequestClose={closeNewsModal}>
          <View style={styles.newsModalOverlay}>
            <TouchableOpacity style={styles.newsModalBackdrop} activeOpacity={1} onPress={closeNewsModal} />
            <Animated.View
              style={[
                styles.newsModalSheet,
                theme === 'light' && styles.newsModalSheetLight,
                { opacity: newsModalAnim, transform: [{ translateY: newsModalAnim.interpolate({ inputRange: [0, 1], outputRange: [40, 0] }) }] },
              ]}
            >
              <View style={[styles.newsModalHandle, theme === 'light' && styles.newsModalHandleLight]} />
              {newsModalArticle && (
                <ScrollView showsVerticalScrollIndicator={false} style={{ maxHeight: 480 }}>
                  <Image source={{ uri: newsModalArticle.image || fallbackNewsImage }} style={styles.newsModalImage} />
                  <View style={styles.newsModalTagRow}>
                    <Text style={styles.newsModalTag}>{(newsModalArticle.tag || 'Story').toUpperCase()}</Text>
                    <Text style={styles.newsModalTagMuted}>{(newsModalArticle.category || categoryLabel)} · {(newsModalArticle.tone || toneLabel)}</Text>
                  </View>
                  <Text style={[styles.newsModalTitle, theme === 'light' && styles.newsModalTitleLight]}>{newsModalArticle.title}</Text>
                  {renderHighlightedText(
                    newsModalArticle.summary,
                    newsModalArticle.vocab,
                    { style: [styles.newsModalSummary, theme === 'light' && styles.newsModalSummaryLight] },
                    { color: '#F97316' }
                  )}
                  <View style={[styles.newsGlossary, theme === 'light' && styles.newsGlossaryLight]}>
                    <Text style={[styles.newsGlossaryTitle, theme === 'light' && styles.newsGlossaryTitleLight]}>Vocabulary</Text>
                    {newsModalArticle.vocab.map(item => (
                      <Text key={item.word} style={[styles.newsGlossaryItem, theme === 'light' && styles.newsGlossaryItemLight]}>
                        <Text style={{ fontWeight: '700' }}>{item.word}</Text> — {item.definition}
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
    paddingBottom: 32,
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
    backgroundColor: '#0D3B4A',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
  },
  missionCardLight: {
    backgroundColor: '#FFFFFF',
    borderColor: '#E5DED3',
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
    padding: 14,
    borderRadius: 14,
    backgroundColor: '#0D3B4A',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    gap: 10,
  },
  newsCardLight: { backgroundColor: '#FFFFFF', borderColor: '#E5DED3' },
  newsHeaderRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 10 },
  newsLabel: { fontSize: 12, fontWeight: '700', color: '#9CA3AF', textTransform: 'uppercase', letterSpacing: 0.6, fontFamily: 'Ubuntu-Bold' },
  newsLabelLight: { color: '#4B5563' },
  newsTitle: { marginTop: 4, fontSize: 18, fontWeight: '800', color: '#E5E7EB', fontFamily: 'Ubuntu-Bold' },
  newsTitleLight: { color: '#0D3B4A' },
  newsSummary: { marginTop: 6, fontSize: 14, lineHeight: 21, color: '#D1D5DB', fontFamily: 'Ubuntu-Regular' },
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
  newsHeroShell: { marginTop: 8, borderRadius: 14, borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)', backgroundColor: 'rgba(255,255,255,0.03)', overflow: 'hidden', padding: 10, gap: 10 },
  newsHeroShellLight: { backgroundColor: '#F9FAFB', borderColor: '#E5E7EB' },
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
  newsToggleBtn: { marginTop: 6, alignSelf: 'flex-start', paddingHorizontal: 10, paddingVertical: 6, borderRadius: 10, backgroundColor: 'rgba(255,255,255,0.08)' },
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
  newsModalSheet: { backgroundColor: '#1E1E1E', borderTopLeftRadius: 18, borderTopRightRadius: 18, padding: 18, paddingBottom: 28 },
  newsModalSheetLight: { backgroundColor: '#FFFFFF' },
  newsModalHandle: { width: 42, height: 4, borderRadius: 999, alignSelf: 'center', backgroundColor: '#4B5563', marginBottom: 12 },
  newsModalHandleLight: { backgroundColor: '#E5E7EB' },
  newsModalImage: { width: '100%', height: 180, borderRadius: 12, marginBottom: 12 },
  newsModalTagRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 6 },
  newsModalTag: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12, backgroundColor: '#F8B070', color: '#0D3B4A', fontWeight: '800', fontSize: 12 },
  newsModalTagMuted: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12, backgroundColor: 'rgba(255,255,255,0.08)', color: '#E5E7EB', fontWeight: '700', fontSize: 12 },
  newsModalTitle: { fontSize: 20, fontWeight: '800', color: '#E5E7EB', fontFamily: 'Ubuntu-Bold', marginTop: 4 },
  newsModalTitleLight: { color: '#0D3B4A' },
  newsModalSummary: { marginTop: 8, fontSize: 14, lineHeight: 22, color: '#D1D5DB', fontFamily: 'Ubuntu-Regular' },
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

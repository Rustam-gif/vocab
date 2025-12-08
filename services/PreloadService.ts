import AsyncStorage from '@react-native-async-storage/async-storage';
import { InteractionManager, Image } from 'react-native';
import { useAppStore } from '../lib/store';
import { getCached, setCached } from '../lib/aiCache';
import { ProgressService } from './ProgressService';
import SetProgressService from './SetProgressService';
import { SubscriptionService } from './SubscriptionService';
import { supabase } from '../lib/supabase';

// Local static content
import { levels as LEVELS } from '../app/quiz/data/levels';

const SELECTED_LEVEL_KEY = '@engniter.selectedLevel';

// TTLs
const TTL = {
  profileMs: 12 * 60 * 60 * 1000, // 12h
  nextExerciseMs: 2 * 60 * 60 * 1000, // 2h (recompute fairly often)
};

type NextExerciseHint = {
  levelId: string;
  setId: string | number;
  title: string;
  wordsPreview?: Array<{ word: string }>; // tiny preview to avoid bloating cache
};

const keys = {
  profile: 'profile.v1',
  levels: 'levels.v1',
  nextExercise: (levelId: string) => `nextExercise.v1:${levelId}`,
};

function now() { return Date.now(); }

export class PreloadService {
  static started = false;

  // Entry point for Router to call on every route change
  static async preloadForRoute(pathname: string) {
    // Always kick essential preloads once
    if (!PreloadService.started) {
      PreloadService.started = true;
      PreloadService.essential().catch(() => {});
    }

    // Home: just warm icons; defer everything else to when user actually navigates
    if (pathname === '/') {
      PreloadService.prewarmIcons();
      return;
    }

    if (pathname.startsWith('/quiz')) {
      PreloadService.preloadLevels();
      PreloadService.preloadNextExercise();
      return;
    }

    if (pathname.startsWith('/vault')) {
      // Vault uses only local data; make sure it's initialized
      try { await useAppStore.getState().loadWords(); } catch {}
      PreloadService.prewarmFolderIcons();
      return;
    }

    if (pathname.startsWith('/ielts')) {
      PreloadService.prewarmIeltsIcons();
      return;
    }
  }

  // Essential boot items: theme is handled in store.initialize; we hydrate profile and levels silently
  static async essential() {
    // Defer heavy work until gestures settle
    try {
      (InteractionManager as any).runAfterInteractions?.(() => {
        // Keep startup light but make sure vault words are ready soon.
        PreloadService.prewarmIcons();
        try { useAppStore.getState().loadWords(); } catch {}
        try { SetProgressService.initialize().catch(() => {}); } catch {}
      });
    } catch {
      PreloadService.prewarmIcons();
      try { await useAppStore.getState().loadWords(); } catch {}
      try { await SetProgressService.initialize(); } catch {}
    }
  }

  // Profile: return cached immediately and refresh in background
  static async preloadProfile() {
    try {
      const cached = await getCached<any>(keys.profile, TTL.profileMs);
      if (cached) {
        useAppStore.getState().setUser(cached);
      }
    } catch {}

    // Background refresh from Supabase auth and progress
    try {
      const [{ data }, progress] = await Promise.all([
        supabase.auth.getUser().catch(() => ({ data: { user: null } } as any)),
        ProgressService.getProgress().catch(() => null as any),
      ]);
      const u = (data as any)?.user;
      if (!u) return;
      const displayName = u?.user_metadata?.full_name ?? u?.email ?? 'Vocabulary Learner';
      const avatarId = u?.user_metadata?.avatar_id;
      const profile = {
        id: u.id,
        name: displayName,
        email: u.email ?? undefined,
        avatar: avatarId && avatarId >= 1 && avatarId <= 6 ? `avatar_${avatarId}` : (u?.user_metadata?.avatar_url || 'avatar_1'),
        avatarId,
        xp: progress?.xp ?? u?.user_metadata?.progress?.xp ?? 0,
        streak: progress?.streak ?? u?.user_metadata?.progress?.streak ?? 0,
        exercisesCompleted: progress?.exercisesCompleted ?? u?.user_metadata?.progress?.exercisesCompleted ?? 0,
        createdAt: u.created_at,
      };
      useAppStore.getState().setUser(profile as any);
      await setCached(keys.profile, profile);
    } catch {}
  }

  // Levels list: local static, but cache so it can be read synchronously elsewhere
  static async preloadLevels() {
    try {
      await setCached(keys.levels, LEVELS);
      // Optionally expose to store for quick access
      // We avoid adding extra state shape; callers can read via aiCache
    } catch {}
  }

  // Next exercise: compute from active level + set progress
  static async preloadNextExercise() {
    try {
      await SetProgressService.initialize();
      const stored = await AsyncStorage.getItem(SELECTED_LEVEL_KEY);
      const levelId = stored || LEVELS[0]?.id || null;
      if (!levelId) return;
      const level = LEVELS.find(l => l.id === levelId) || LEVELS[0];
      if (!level) return;
      const list = level.sets || [];
      // First set that is not completed; if the immediate next is a recap quiz with no words, still fine
      let target = list[0];
      for (let i = 0; i < list.length; i++) {
        const s = list[i];
        const flags = SetProgressService.getSetFlags(level.id, s.id);
        if (!flags.completed) { target = s as any; break; }
      }
      const hint: NextExerciseHint = {
        levelId: level.id,
        setId: target?.id,
        title: String((target as any)?.title || 'Set'),
        wordsPreview: Array.isArray((target as any)?.words) ? (target as any).words.slice(0, 5).map((w: any) => ({ word: w.word })) : undefined,
      };
      useAppStore.getState().setCurrentExercise?.(hint as any);
      await setCached(keys.nextExercise(level.id), { hint, t: now() });
    } catch {}
  }

  // Icons are local; resolve asset URIs to warm packager cache
  static prewarmIcons() {
    if ((globalThis as any).__ICONS_WARMED__) return;
    (globalThis as any).__ICONS_WARMED__ = true;
    try {
      const sources: any[] = [
        require('../assets/homepageicons/11.png'),
        require('../assets/homepageicons/12.png'),
        require('../assets/homepageicons/13.png'),
        require('../assets/homepageicons/14.png'),
        require('../assets/homepageicons/15.png'),
      ];
      sources.forEach((s) => { try { void s; } catch {} });
    } catch {}
  }

  static prewarmFolderIcons() {
    if ((globalThis as any).__FOLDER_ICONS_WARMED__) return;
    (globalThis as any).__FOLDER_ICONS_WARMED__ = true;
    try {
      const a = require('../assets/foldericons/add_folder.json');
      const b = require('../assets/foldericons/foldericon.json');
      void a; void b;
    } catch {}
  }

  static prewarmIeltsIcons() {
    if ((globalThis as any).__IELTS_ICONS_WARMED__) return;
    (globalThis as any).__IELTS_ICONS_WARMED__ = true;
    try {
      const a = require('../assets/homepageicons/IELTS_icons/writing_icon.json');
      const b = require('../assets/homepageicons/IELTS_icons/reading_icon.json');
      const c = require('../assets/homepageicons/IELTS_icons/vocabulary_icon.json');
      void a; void b; void c;
    } catch {}
  }

  // Preload heavy dependencies used by Story Exercise so the overlay can open instantly
  static async preloadStoryExercise() {
    try {
      // Ensure vault words are loaded (StoryExercise uses them for picking)
      try { await useAppStore.getState().loadWords(); } catch {}
      // Prime subscription lock state so StoryExercise doesn't have to await it on first open
      try { await SubscriptionService.getStatus(); } catch {}
    } catch {}
  }

  // Preload all Lottie JSON once at startup and optionally force native parsing by
  // mounting hidden LottieView instances. This runs once per app session.
  static preloadAllAnimationsOnce() {
    if ((globalThis as any).__LOTTIE_ALL_PRELOADED__) return;
    (globalThis as any).__LOTTIE_ALL_PRELOADED__ = true;
    try {
      const folders = [
        require('../assets/foldericons/add_folder.json'),
        require('../assets/foldericons/foldericon.json'),
      ];
      const misc = [
        // Home profile icon (animated)
        (() => { try { return require('../assets/homepageicons/profile_icon.json'); } catch { return null as any; } })(),
        require('../assets/lottie/10_Second_Timer.json'),
        require('../assets/lottie/analytics.json'),
        require('../assets/lottie/bell_notification.json'),
        require('../assets/lottie/Bestseller.json'),
        require('../assets/lottie/Book.json'),
        require('../assets/lottie/Bookmark.json'),
        require('../assets/lottie/Check.json'),
        require('../assets/lottie/Checkmark.json'),
        require('../assets/lottie/Clock_timer.json'),
        require('../assets/lottie/completed.json'),
        require('../assets/lottie/flame.json'),
        require('../assets/lottie/flame_streak.json'),
        require('../assets/lottie/growth_progress.json'),
        require('../assets/lottie/HandSwipe.json'),
        require('../assets/lottie/launch.json'),
        require('../assets/lottie/loading_colour.json'),
        require('../assets/lottie/loading.json'),
        require('../assets/lottie/LoadingDots.json'),
        require('../assets/lottie/magic_sparkles.json'),
        require('../assets/lottie/next_button.json'),
        require('../assets/lottie/OCR_Scan.json'),
        require('../assets/lottie/penguin_jump.json'),
        require('../assets/lottie/Penguin.json'),
        require('../assets/lottie/se_animation.json'),
        require('../assets/lottie/Success.json'),
        require('../assets/lottie/success1.json'),
        require('../assets/lottie/white_arrowdown.json'),
      ];
      const all = [...folders, ...misc].filter(Boolean);
      (globalThis as any).__LOTTIE_JSON_POOL__ = all;
    } catch {}
  }

  // Preload and cache local PNG assets once per session
  static preloadImagesOnce() {
    if ((globalThis as any).__IMAGES_PRELOADED__) return;
    (globalThis as any).__IMAGES_PRELOADED__ = true;
    try {
      const list: number[] = [
        // Home icons
        require('../assets/homepageicons/11.png'),
        require('../assets/homepageicons/12.png'),
        require('../assets/homepageicons/13.png'),
        require('../assets/homepageicons/14.png'),
        require('../assets/homepageicons/15.png'),
        // Level icons
        require('../assets/levelicons/beginner.png'),
        require('../assets/levelicons/intermediate.png'),
        require('../assets/levelicons/upper-intermediate.png'),
        require('../assets/levelicons/advanced.png'),
        require('../assets/levelicons/proficient.png'),
        require('../assets/levelicons/ielts-vocabulary.png'),
        // Extra level/special icons when present
        (() => { try { return require('../assets/levelicons/office-communication.png'); } catch { return null as any; } })(),
        (() => { try { return require('../assets/levelicons/phrasal-verbs.png'); } catch { return null as any; } })(),
        // Wordset thumbnails
        require('../assets/wordset_icons/quiz.png'),
        require('../assets/wordset_icons/weather-nature.png'),
        require('../assets/wordset_icons/food-cooking.png'),
        require('../assets/wordset_icons/culture-entertainment.png'),
        require('../assets/wordset_icons/transportation-travel.png'),
        // Folder icons
        require('../assets/foldericons/add_folder.png'),
        require('../assets/foldericons/foldericon.png'),
        // Avatars used in Profile
        require('../assets/prof-pictures/cartoon-1.png'),
        require('../assets/prof-pictures/cartoon-2.png'),
        require('../assets/prof-pictures/cartoon-3.png'),
        require('../assets/prof-pictures/cartoon-4.png'),
        require('../assets/prof-pictures/cartoon-5.png'),
        require('../assets/prof-pictures/cartoon-6.png'),
        // App icons / splash
        require('../assets/icon.png'),
        require('../assets/adaptive-icon.png'),
        require('../assets/splash-icon.png'),
      ].filter(Boolean) as number[];

      list.forEach((resId) => {
        try {
          const resolved = Image.resolveAssetSource(resId as any);
          const uri = resolved?.uri;
          if (uri) Image.prefetch(uri).catch(() => {});
        } catch {}
      });
    } catch {}
  }
}

export default PreloadService;

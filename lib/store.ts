import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Appearance } from 'react-native';
import { getTheme, ThemeName } from './theme';
import { Word, User, Story, ExerciseResult, NewWordPayload } from '../types';
import { vaultService } from '../services/VaultService';
import { analyticsService } from '../services/AnalyticsService';
import { ProgressService } from '../services/ProgressService';
import { engagementTrackingService } from '../services/EngagementTrackingService';

interface AppState {
  // User state
  user: User | null;
  setUser: (user: User | null) => void;
  
  // Vault state
  words: Word[];
  loading: boolean;
  loadWords: () => Promise<void>;
  addWord: (word: NewWordPayload) => Promise<Word | null>;
  updateWord: (id: string, updates: Partial<Word>) => Promise<void>;
  deleteWord: (id: string) => Promise<void>;
  searchWords: (query: string) => Word[];
  getFolders: () => { id: string; title: string; createdAt: string }[];
  createFolder: (title: string) => Promise<{ id: string; title: string; createdAt: string } | null>;
  moveWordToFolder: (wordId: string, folderId?: string) => Promise<boolean>;
  deleteFolder: (folderId: string) => Promise<boolean>;
  getDueWords: (limit?: number, folderId?: string) => Word[];
  gradeWordSrs: (wordId: string, quality: number) => Promise<Word | null>;
  resetSrs: (folderId?: string) => Promise<void>;
  
  // Story state
  currentStory: Story | null;
  setCurrentStory: (story: Story | null) => void;
  savedStories: Story[];
  loadStories: () => Promise<void>;
  saveStory: (story: Story) => Promise<void>;
  deleteStory: (id: string) => Promise<void>;
  
  // Exercise state
  currentExercise: any;
  setCurrentExercise: (exercise: any) => void;
  exerciseResults: ExerciseResult[];
  recordExerciseResult: (result: ExerciseResult) => Promise<void>;
  
  // Analytics state
  analytics: any;
  loadAnalytics: () => Promise<void>;
  
  // Progress/XP state
  userProgress: any;
  loadProgress: () => Promise<void>;
  updateProgress: (xp: number, exercisesCompleted?: number) => Promise<void>;
  
  // Preferences
  languagePreferences: string[]; // e.g., ['ru']
  setLanguagePreferences: (langs: string[]) => Promise<void>;
  
  // Theme
  theme: ThemeName;
  setTheme: (t: ThemeName) => Promise<void>;
  toggleTheme: () => Promise<void>;
  
  // Initialize app
  initialize: () => Promise<void>;
}

export const useAppStore = create<AppState>((set, get) => ({
  // User state
  user: null,
  setUser: (user) => set({ user }),
  
  // Vault state
  words: [],
  loading: false,
  loadWords: async () => {
    const state = get();
    if (Array.isArray(state.words) && state.words.length > 0) {
      // Already loaded in this session; avoid re-initializing from storage.
      return;
    }
    set({ loading: true });
    try {
      await vaultService.initialize();
      const words = vaultService.getAllWords();
      set({ words });
    } catch (error) {
      console.error('Failed to load words:', error);
    } finally {
      set({ loading: false });
    }
  },
  addWord: async (wordData: NewWordPayload) => {
    try {
      const newWord = await vaultService.addWord(wordData);
      if (newWord) {
        set(state => ({ words: [...state.words, newWord] }));
        // Track word saved event
        engagementTrackingService.trackEvent('word_saved', null, {
          word: newWord.word,
          folderId: newWord.folderId,
        });
      }
      return newWord;
    } catch (error) {
      console.error('Failed to add word:', error);
      return null;
    }
  },
  updateWord: async (id, updates) => {
    try {
      const updatedWord = await vaultService.updateWord(id, updates);
      if (updatedWord) {
        set(state => ({
          words: state.words.map(word => 
            word.id === id ? updatedWord : word
          )
        }));
      }
    } catch (error) {
      console.error('Failed to update word:', error);
    }
  },
  deleteWord: async (id) => {
    try {
      // Get word before deleting for tracking
      const wordToDelete = get().words.find(w => w.id === id);
      const success = await vaultService.deleteWord(id);
      if (success) {
        set(state => ({
          words: state.words.filter(word => word.id !== id)
        }));
        // Track word deleted event
        engagementTrackingService.trackEvent('word_deleted', null, {
          word: wordToDelete?.word,
        });
      }
    } catch (error) {
      console.error('Failed to delete word:', error);
    }
  },
  searchWords: (query) => {
    return vaultService.searchWords(query);
  },
  getFolders: () => vaultService.getFolders(),
  getDueWords: (limit, folderId) => vaultService.getDueWords(limit, folderId),
  gradeWordSrs: async (wordId, quality) => {
    try {
      const updated = await vaultService.gradeWordSrs(wordId, quality);
      if (updated) {
        const words = get().words.map(w => (w.id === updated.id ? updated : w));
        set({ words });
      }
      return updated;
    } catch (e) {
      console.error('Failed to grade SRS:', e);
      return null;
    }
  },
  resetSrs: async (folderId) => {
    try {
      await vaultService.resetSrs(folderId);
      const words = vaultService.getAllWords();
      set({ words });
    } catch (e) {
      console.error('Failed to reset SRS:', e);
    }
  },
  createFolder: async (title) => {
    try {
      const folder = await vaultService.createFolder(title);
      return folder;
    } catch (e) {
      console.error('Failed to create folder:', e);
      return null;
    }
  },
  moveWordToFolder: async (wordId, folderId) => {
    try {
      return await vaultService.moveWordToFolder(wordId, folderId);
    } catch (e) {
      console.error('Failed to move word:', e);
      return false;
    }
  },
  deleteFolder: async (folderId) => {
    try {
      return await vaultService.deleteFolder(folderId);
    } catch (e) {
      console.error('Failed to delete folder:', e);
      return false;
    }
  },
  
  // Story state
  currentStory: null,
  setCurrentStory: (story) => set({ currentStory: story }),
  savedStories: [],
  loadStories: async () => {
    try {
      const raw = await AsyncStorage.getItem('@engniter.stories');
      if (!raw) {
        set({ savedStories: [] });
        return;
      }
      const parsed = JSON.parse(raw) as any[];
      const stories = Array.isArray(parsed)
        ? parsed.map((s) => ({
            ...s,
            createdAt: s.createdAt ? new Date(s.createdAt) : new Date(),
          }))
        : [];
      set({ savedStories: stories });
    } catch (error) {
      console.error('Failed to load stories:', error);
      set({ savedStories: [] });
    }
  },
  saveStory: async (story) => {
    try {
      const state = get();
      const next = [...state.savedStories, story];
      set({ savedStories: next });
      try {
        await AsyncStorage.setItem(
          '@engniter.stories',
          JSON.stringify(
            next.map((s) => ({
              ...s,
              // Persist as ISO strings for safety
              createdAt: s.createdAt instanceof Date ? s.createdAt.toISOString() : s.createdAt,
            }))
          )
        );
      } catch (e) {
        console.warn('Failed to persist stories:', e);
      }
    } catch (error) {
      console.error('Failed to save story:', error);
    }
  },
  deleteStory: async (id) => {
    try {
      const state = get();
      const next = state.savedStories.filter(s => s.id !== id);
      set({ savedStories: next });
      try {
        await AsyncStorage.setItem(
          '@engniter.stories',
          JSON.stringify(
            next.map((s) => ({
              ...s,
              createdAt: s.createdAt instanceof Date ? s.createdAt.toISOString() : s.createdAt,
            }))
          )
        );
      } catch (e) {
        console.warn('Failed to persist stories after delete:', e);
      }
    } catch (error) {
      console.error('Failed to delete story:', error);
    }
  },
  
  // Exercise state
  currentExercise: null,
  setCurrentExercise: (exercise) => set({ currentExercise: exercise }),
  exerciseResults: [],
  recordExerciseResult: async (result) => {
    try {
      await analyticsService.recordResult(result);
      try {
        // Update per-word mastery stats in the vault so "Words Learned" can reflect
        // total corrects across all exercise types.
        await vaultService.recordPracticeResult(result.wordId, {
          scoreChange: result.correct ? 2 : 0,
          correct: result.correct,
          exerciseType: result.exerciseType,
        });
      } catch (e) {
        console.warn('recordPracticeResult failed:', e);
      }
      set(state => ({
        exerciseResults: [...state.exerciseResults, result]
      }));
    } catch (error) {
      console.error('Failed to record exercise result:', error);
    }
  },
  
  // Analytics state
  analytics: null,
  loadAnalytics: async () => {
    try {
      // Ensure analytics are initialized (idempotent)
      await analyticsService.initialize();
      const analytics = analyticsService.getAnalyticsData();
      set({ analytics });
    } catch (error) {
      console.error('Failed to load analytics:', error);
    }
  },
  
  // Progress/XP state
  userProgress: null,
  loadProgress: async () => {
    try {
      const progress = await ProgressService.getProgress();
      set({ userProgress: progress });
    } catch (error) {
      console.error('Failed to load progress:', error);
    }
  },
  
  // Preferences
  languagePreferences: [],
  setLanguagePreferences: async (langs: string[]) => {
    console.log('[Store] Saving language preferences:', langs);
    set({ languagePreferences: langs });
    try {
      await AsyncStorage.setItem('@engniter.langs', JSON.stringify(langs));
      console.log('[Store] Language preferences saved successfully');
    } catch (e) {
      console.error('[Store] Failed to save language preferences:', e);
    }
  },
  updateProgress: async (xp, exercisesCompleted) => {
    try {
      const progress = await ProgressService.getProgress();
      if (exercisesCompleted) {
        progress.exercisesCompleted = exercisesCompleted;
      }
      progress.xp = xp;
      progress.level = Math.floor(xp / 1000) + 1;
      await ProgressService.saveProgress();
      set({ userProgress: progress });
    } catch (error) {
      console.error('Failed to update progress:', error);
    }
  },
  
  // Theme: always default to dark for first-time users
  theme: 'dark' as ThemeName,
  setTheme: async (t: ThemeName) => {
    console.log('[Store] Setting theme:', t);
    set({ theme: t });
    try {
      await AsyncStorage.setItem('@engniter.theme', t);
      console.log('[Store] Theme saved successfully');
    } catch (e) {
      console.error('[Store] Failed to save theme:', e);
    }
  },
  toggleTheme: async () => {
    const next = get().theme === 'dark' ? 'light' : 'dark';
    console.log('[Store] Toggling theme to:', next);
    set({ theme: next });
    try {
      await AsyncStorage.setItem('@engniter.theme', next);
      console.log('[Store] Theme saved successfully');
    } catch (e) {
      console.error('[Store] Failed to save theme:', e);
    }
  },
  
  // Initialize app
  initialize: async () => {
    console.log('[Store] Initializing app...');

    // Diagnostic: Check if AsyncStorage persists across restarts
    const PERSIST_TEST_KEY = '@engniter.persist_test';
    try {
      const existingTest = await AsyncStorage.getItem(PERSIST_TEST_KEY);
      const now = new Date().toISOString();
      if (existingTest) {
        console.log('[Store] PERSIST TEST: Previous value found:', existingTest, '- Storage IS persisting!');
      } else {
        console.log('[Store] PERSIST TEST: No previous value - this is first launch or storage was cleared');
      }
      await AsyncStorage.setItem(PERSIST_TEST_KEY, now);
      console.log('[Store] PERSIST TEST: Saved new timestamp:', now);
    } catch (e) {
      console.error('[Store] PERSIST TEST FAILED:', e);
    }

    const normalizeTheme = (raw: any): ThemeName | null => {
      if (raw === 'light' || raw === 'dark') return raw;
      if (typeof raw === 'string') {
        const lower = raw.toLowerCase();
        if (lower === 'light' || lower === 'dark') return lower as ThemeName;
      }
      return null;
    };

    const normalizeLangs = (raw: any): string[] => {
      if (Array.isArray(raw)) return raw.filter(l => typeof l === 'string');
      if (typeof raw === 'string' && raw.trim()) return [raw.trim()];
      return [];
    };

    // Hydrate persisted preferences before any other state to avoid flashes.
    // If storage is missing/empty, keep whatever is already in memory instead of resetting.
    let themePref: ThemeName | null = null;
    let langs: string[] | null = null;
    try {
      const storedTheme = await AsyncStorage.getItem('@engniter.theme');
      console.log('[Store] Raw stored theme from AsyncStorage:', JSON.stringify(storedTheme));
      const parsedTheme = normalizeTheme(storedTheme);
      if (parsedTheme) themePref = parsedTheme;
      console.log('[Store] Parsed theme preference:', themePref);
    } catch (err) {
      console.warn('[Store] failed to read saved theme', err);
    }

    try {
      const s = await AsyncStorage.getItem('@engniter.langs');
      console.log('[Store] Raw stored langs from AsyncStorage:', JSON.stringify(s));
      const parsed = s ? JSON.parse(s) : [];
      const normalized = normalizeLangs(parsed);
      if (normalized.length) langs = normalized;
      console.log('[Store] Parsed language preferences:', langs);
    } catch (err) {
      console.warn('[Store] failed to read saved langs', err);
    }

    // Apply prefs immediately, but only overwrite when we actually have a value from storage.
    set(state => {
      // Fallback to dark if nothing persisted
      const fallbackTheme: ThemeName = state.theme || 'dark';
      return {
        ...state,
        theme: themePref ?? fallbackTheme,
        languagePreferences: langs ?? state.languagePreferences,
      };
    });

    // Initialize services independently so one failure does not prevent prefs hydration.
    let words: Word[] = [];
    let analytics: any = null;
    let userProgress: any = null;

    try {
      await vaultService.initialize();
      words = vaultService.getAllWords();
    } catch (err) {
      console.error('[Store] vault init failed', err);
    }

    try {
      await analyticsService.initialize();
      analytics = analyticsService.getAnalyticsData();
    } catch (err) {
      console.error('[Store] analytics init failed', err);
    }

    try {
      await ProgressService.initialize();
      userProgress = await ProgressService.getProgress();
    } catch (err) {
      console.error('[Store] progress init failed', err);
      // Fall back to previous state if available
      userProgress = get().userProgress || userProgress;
    }

    console.log('[Store] Setting state - theme:', themePref, 'langs:', langs);
    set({
      words,
      analytics,
      userProgress,
      theme: themePref ?? get().theme,
      languagePreferences: langs ?? get().languagePreferences,
    });
  },
}));

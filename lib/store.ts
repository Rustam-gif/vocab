import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Appearance } from 'react-native';
import { getTheme, ThemeName } from './theme';
import { Word, User, Story, ExerciseResult, NewWordPayload } from '../types';
import { vaultService } from '../services/VaultService';
import { analyticsService } from '../services/AnalyticsService';
import { ProgressService } from '../services/ProgressService';

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
      const success = await vaultService.deleteWord(id);
      if (success) {
        set(state => ({
          words: state.words.filter(word => word.id !== id)
        }));
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
      // In a real app, this would load from storage
      set({ savedStories: [] });
    } catch (error) {
      console.error('Failed to load stories:', error);
    }
  },
  saveStory: async (story) => {
    try {
      set(state => ({
        savedStories: [...state.savedStories, story]
      }));
    } catch (error) {
      console.error('Failed to save story:', error);
    }
  },
  
  // Exercise state
  currentExercise: null,
  setCurrentExercise: (exercise) => set({ currentExercise: exercise }),
  exerciseResults: [],
  recordExerciseResult: async (result) => {
    try {
      await analyticsService.recordResult(result);
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
  
  // Theme
  theme: 'dark',
  setTheme: async (t: ThemeName) => {
    try {
      await AsyncStorage.setItem('@engniter.theme', t);
    } catch {}
    set({ theme: t });
  },
  toggleTheme: async () => {
    const next = get().theme === 'dark' ? 'light' : 'dark';
    try {
      await AsyncStorage.setItem('@engniter.theme', next);
    } catch {}
    set({ theme: next });
  },
  
  // Initialize app
  initialize: async () => {
    try {
      await Promise.all([
        vaultService.initialize(),
        analyticsService.initialize(),
        ProgressService.initialize(),
      ]);
      
      const words = vaultService.getAllWords();
      const analytics = analyticsService.getAnalyticsData();
      const userProgress = await ProgressService.getProgress();
      // Load theme preference
      let themePref: ThemeName | null = null;
      try {
        const stored = await AsyncStorage.getItem('@engniter.theme');
        if (stored === 'light' || stored === 'dark') themePref = stored;
      } catch {}
      if (!themePref) {
        const sys = Appearance.getColorScheme();
        themePref = sys === 'light' ? 'light' : 'dark';
      }
      
      set({ words, analytics, userProgress, theme: themePref });
    } catch (error) {
      console.error('Failed to initialize app:', error);
    }
  },
}));

import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase } from '../lib/supabase';
import { REMOTE_SYNC } from '../lib/appConfig';

const PROGRESS_KEY = '@user_progress';
const PENDING_REMOTE_KEY = '@user_progress_pending_remote';

export interface UserProgress {
  xp: number;
  level: number;
  exercisesCompleted: number;
  lastActiveDate: string; // ISO date string
  streak: number;
  totalWordsLearned: number;
  accuracyHistory: number[]; // last 10 accuracy scores
}

// XP Rewards for different activities
export const XP_REWARDS = {
  // Quiz exercises
  MCQ_CORRECT: 10,
  MCQ_INCORRECT: 2,
  SYNONYM_CORRECT: 15,
  SYNONYM_INCORRECT: 3,
  USAGE_CORRECT: 20,
  USAGE_INCORRECT: 4,
  LETTERS_CORRECT: 12,
  LETTERS_INCORRECT: 3,
  
  // Practice exercises
  FLASHCARD_KNOW: 8,
  FLASHCARD_DONT_KNOW: 2,
  WORD_SPRINT_CORRECT: 15,
  WORD_SPRINT_INCORRECT: 3,
  
  // Story exercises
  STORY_COMPLETE: 50,
  STORY_PERFECT: 100, // All blanks correct
  
  // Bonuses
  PERFECT_QUIZ: 50, // 100% accuracy
  DAILY_LOGIN: 5,
  STREAK_BONUS: 10, // Per day of streak
};

class ProgressServiceClass {
  private progress: UserProgress | null = null;
  
  private async getStorageKey(): Promise<string> {
    try {
      const { data } = await supabase.auth.getSession();
      const uid = data?.session?.user?.id || 'guest';
      return `${PROGRESS_KEY}:${uid}`;
    } catch {
      return `${PROGRESS_KEY}:guest`;
    }
  }
  private async getPendingKey(): Promise<string> {
    try {
      const { data } = await supabase.auth.getSession();
      const uid = data?.session?.user?.id || 'guest';
      return `${PENDING_REMOTE_KEY}:${uid}`;
    } catch {
      return `${PENDING_REMOTE_KEY}:guest`;
    }
  }

  async initialize(): Promise<void> {
    try {
      // Local-first when REMOTE_SYNC is false. This avoids overwriting local
      // progress with stale Supabase metadata during development or offline use.
      if (!REMOTE_SYNC) {
        const { data } = await supabase.auth.getSession();
        const uid = data?.session?.user?.id || null;
        const key = await this.getStorageKey();
        let stored = await AsyncStorage.getItem(key);
        if (stored) {
          this.progress = JSON.parse(stored);
        } else {
          // Guest: migrate legacy unscoped key if present; signed-in users start fresh
          if (!uid) {
            const legacy = await AsyncStorage.getItem(PROGRESS_KEY);
            if (legacy) {
              this.progress = JSON.parse(legacy);
              await AsyncStorage.setItem(key, legacy);
              await AsyncStorage.removeItem(PROGRESS_KEY);
            } else {
              this.progress = this.getDefaultProgress();
              try { await AsyncStorage.setItem(key, JSON.stringify(this.progress)); } catch {}
            }
          } else {
            this.progress = this.getDefaultProgress();
            try { await AsyncStorage.setItem(key, JSON.stringify(this.progress)); } catch {}
          }
        }
      } else {
        // Remote-enabled: prefer remote if present, otherwise local
        const { data: { user } } = await supabase.auth.getUser();
        if (user?.user_metadata?.progress) {
          this.progress = user.user_metadata.progress as UserProgress;
          try { await AsyncStorage.setItem(await this.getStorageKey(), JSON.stringify(this.progress)); } catch {}
        } else {
          const stored = await AsyncStorage.getItem(await this.getStorageKey());
          this.progress = stored ? JSON.parse(stored) : this.getDefaultProgress();
        }
      }

      // Update streak on launch (idempotent per day)
      await this.updateStreak();

      // Try to flush any pending remote writes (best-effort)
      try { await this.flushPendingRemote(); } catch {}
    } catch (error) {
      console.error('Failed to initialize ProgressService:', error);
      this.progress = this.getDefaultProgress();
    }
  }

  private getDefaultProgress(): UserProgress {
    return {
      xp: 0,
      level: 1,
      exercisesCompleted: 0,
      lastActiveDate: new Date().toISOString().split('T')[0],
      streak: 1,
      totalWordsLearned: 0,
      accuracyHistory: [],
    };
  }

  async getProgress(): Promise<UserProgress> {
    if (!this.progress) {
      await this.initialize();
    }
    return this.progress!;
  }

  private calculateLevel(xp: number): number {
    // Level formula: Level = floor(XP / 1000) + 1
    // Level 1: 0-999 XP
    // Level 2: 1000-1999 XP
    // Level 3: 2000-2999 XP, etc.
    return Math.floor(xp / 1000) + 1;
  }

  async addXP(amount: number, source: string = 'exercise'): Promise<{ 
    xpGained: number; 
    newXP: number; 
    oldLevel: number; 
    newLevel: number; 
    leveledUp: boolean;
  }> {
    const progress = await this.getProgress();
    const oldLevel = progress.level;
    const oldXP = progress.xp;
    
    progress.xp += amount;
    progress.level = this.calculateLevel(progress.xp);
    
    const leveledUp = progress.level > oldLevel;
    
    await this.saveProgress();
    
    console.log(`[ProgressService] +${amount} XP from ${source}. Total: ${progress.xp} XP, Level ${progress.level}`);
    
    return {
      xpGained: amount,
      newXP: progress.xp,
      oldLevel,
      newLevel: progress.level,
      leveledUp,
    };
  }

  async recordExerciseCompletion(
    exerciseType: string,
    correctCount: number,
    totalCount: number,
    timeSpent: number // in seconds
  ): Promise<{ xpGained: number; leveledUp: boolean; newLevel: number }> {
    const progress = await this.getProgress();
    const oldLevel = progress.level;
    
    // Calculate accuracy
    const accuracy = totalCount > 0 ? (correctCount / totalCount) * 100 : 0;
    
    // Track accuracy history (keep last 10)
    progress.accuracyHistory.push(accuracy);
    if (progress.accuracyHistory.length > 10) {
      progress.accuracyHistory.shift();
    }
    
    // Calculate XP based on performance
    let xpGained = 0;
    
    // Base XP for correct answers
    xpGained += correctCount * this.getBaseXPForExercise(exerciseType, true);
    
    // Small XP for incorrect (for participation)
    const incorrectCount = totalCount - correctCount;
    xpGained += incorrectCount * this.getBaseXPForExercise(exerciseType, false);
    
    // Perfect bonus
    if (accuracy === 100 && totalCount >= 5) {
      xpGained += XP_REWARDS.PERFECT_QUIZ;
    }
    
    // Streak bonus
    if (progress.streak >= 3) {
      xpGained += Math.min(progress.streak, 10) * XP_REWARDS.STREAK_BONUS;
    }
    
    // Update progress
    progress.xp += xpGained;
    progress.level = this.calculateLevel(progress.xp);
    progress.exercisesCompleted += 1;
    progress.totalWordsLearned += totalCount;
    
    const leveledUp = progress.level > oldLevel;
    
    await this.saveProgress();
    
    console.log(`[ProgressService] Exercise completed: ${exerciseType}, ${correctCount}/${totalCount} correct, +${xpGained} XP`);
    
    return {
      xpGained,
      leveledUp,
      newLevel: progress.level,
    };
  }

  private getBaseXPForExercise(exerciseType: string, isCorrect: boolean): number {
    const type = exerciseType.toLowerCase();
    
    if (type.includes('mcq')) return isCorrect ? XP_REWARDS.MCQ_CORRECT : XP_REWARDS.MCQ_INCORRECT;
    if (type.includes('synonym')) return isCorrect ? XP_REWARDS.SYNONYM_CORRECT : XP_REWARDS.SYNONYM_INCORRECT;
    if (type.includes('usage')) return isCorrect ? XP_REWARDS.USAGE_CORRECT : XP_REWARDS.USAGE_INCORRECT;
    if (type.includes('letters')) return isCorrect ? XP_REWARDS.LETTERS_CORRECT : XP_REWARDS.LETTERS_INCORRECT;
    if (type.includes('sprint')) return isCorrect ? XP_REWARDS.WORD_SPRINT_CORRECT : XP_REWARDS.WORD_SPRINT_INCORRECT;
    if (type.includes('flashcard')) return isCorrect ? XP_REWARDS.FLASHCARD_KNOW : XP_REWARDS.FLASHCARD_DONT_KNOW;
    if (type.includes('story')) return XP_REWARDS.STORY_COMPLETE;
    
    // Default
    return isCorrect ? 10 : 2;
  }

  async updateStreak(): Promise<void> {
    const progress = await this.getProgress();
    const today = new Date().toISOString().split('T')[0];
    const lastActive = new Date(progress.lastActiveDate);
    const todayDate = new Date(today);
    
    const daysDiff = Math.floor((todayDate.getTime() - lastActive.getTime()) / (1000 * 60 * 60 * 24));
    
    if (daysDiff === 0) {
      // Same day, no change
      return;
    } else if (daysDiff === 1) {
      // Consecutive day, increase streak
      progress.streak += 1;
      progress.lastActiveDate = today;
      
      // Daily login bonus
      await this.addXP(XP_REWARDS.DAILY_LOGIN, 'daily_login');
    } else {
      // Streak broken, reset to 1
      progress.streak = 1;
      progress.lastActiveDate = today;
    }
    
    await this.saveProgress();
  }

  async saveProgress(): Promise<void> {
    if (!this.progress) return;
    
    try {
      // Save to local storage
      await AsyncStorage.setItem(await this.getStorageKey(), JSON.stringify(this.progress));
      
      // Save to Supabase if logged in
      const { data: { user } } = REMOTE_SYNC ? await supabase.auth.getUser() : await supabase.auth.getSession().then(r => ({ data: { user: r.data?.session?.user || null } as any }));
      if (user && REMOTE_SYNC) {
        try {
          await supabase.auth.updateUser({ data: { progress: this.progress } });
          // Clear any pending if this succeeds
          await AsyncStorage.removeItem(await this.getPendingKey());
        } catch (e) {
          // Queue for later sync
          await AsyncStorage.setItem(await this.getPendingKey(), JSON.stringify(this.progress));
          console.warn('[ProgressService] queued progress for remote sync (offline?)');
        }
      }
    } catch (error) {
      console.error('Failed to save progress:', error);
    }
  }

  private async flushPendingRemote(): Promise<void> {
    if (!REMOTE_SYNC) return; // Do not attempt remote flush if remote sync disabled
    const pending = await AsyncStorage.getItem(await this.getPendingKey());
    if (!pending) return;
    try {
      const parsed = JSON.parse(pending);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      await supabase.auth.updateUser({ data: { progress: parsed } });
      await AsyncStorage.removeItem(await this.getPendingKey());
      console.log('[ProgressService] pending progress synced.');
    } catch (e) {
      // Keep pending for next attempt
      console.warn('[ProgressService] still pending sync:', e);
    }
  }

  async resetProgress(): Promise<void> {
    this.progress = this.getDefaultProgress();
    await this.saveProgress();
  }

  // After sign-in, prefer remote progress if available and persist locally.
  async refreshFromRemote(): Promise<void> {
    try {
      if (!REMOTE_SYNC) {
        // In local-only mode, switch storage context to the current user
        const { data } = await supabase.auth.getSession();
        const uid = data?.session?.user?.id || null;
        const key = await this.getStorageKey();
        let stored = await AsyncStorage.getItem(key);
        if (!stored) {
          // Only migrate legacy unscoped data for guest (not for signed-in users)
          if (!uid) {
            const legacy = await AsyncStorage.getItem(PROGRESS_KEY);
            if (legacy) {
              stored = legacy;
              await AsyncStorage.setItem(key, legacy);
              await AsyncStorage.removeItem(PROGRESS_KEY);
            }
          }
        }
        this.progress = stored ? JSON.parse(stored) : this.getDefaultProgress();
        await AsyncStorage.setItem(key, JSON.stringify(this.progress));
        return;
      }
      const { data: { user } } = await supabase.auth.getUser();
      const remote = user?.user_metadata?.progress as UserProgress | undefined;
      if (!remote) return;
      let local: UserProgress | null = null;
      try {
        const stored = await AsyncStorage.getItem(await this.getStorageKey());
        if (stored) local = JSON.parse(stored);
      } catch {}
      const next = remote || local || this.getDefaultProgress();
      this.progress = next;
      try { await AsyncStorage.setItem(await this.getStorageKey(), JSON.stringify(next)); } catch {}
    } catch (e) {
      // offline or auth error — ignore
    }
  }

  // Get current stats for display
  getStats() {
    if (!this.progress) return null;
    
    const avgAccuracy = this.progress.accuracyHistory.length > 0
      ? this.progress.accuracyHistory.reduce((a, b) => a + b, 0) / this.progress.accuracyHistory.length
      : 0;
    
    return {
      xp: this.progress.xp,
      level: this.progress.level,
      exercisesCompleted: this.progress.exercisesCompleted,
      streak: this.progress.streak,
      totalWordsLearned: this.progress.totalWordsLearned,
      averageAccuracy: Math.round(avgAccuracy),
    };
  }
}

export const ProgressService = new ProgressServiceClass();

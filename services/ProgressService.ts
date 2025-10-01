import AsyncStorage from '@react-native-async-storage/async-storage';

export interface UserProgress {
  totalSets: number;
  completedSets: number;
  totalPoints: number;
  currentLevel: string;
  unlockedSets: string[];
  completedSetsList: string[];
  streak: number;
  lastActivity: Date;
}

export interface SetProgress {
  setId: string;
  completed: boolean;
  score: number;
  attempts: number;
  bestScore: number;
  lastAttempt: Date;
  unlocked: boolean;
}

class ProgressService {
  private static instance: ProgressService;
  private progress: UserProgress | null = null;
  private setProgress: Map<string, SetProgress> = new Map();

  static getInstance(): ProgressService {
    if (!ProgressService.instance) {
      ProgressService.instance = new ProgressService();
    }
    return ProgressService.instance;
  }

  async initialize(): Promise<void> {
    try {
      await this.loadProgress();
      await this.loadSetProgress();
      
      // If no progress exists, create default
      if (!this.progress) {
        await this.createDefaultProgress();
      }
    } catch (error) {
      console.error('Failed to initialize progress service:', error);
      await this.createDefaultProgress();
    }
  }

  private async createDefaultProgress(): Promise<void> {
    this.progress = {
      totalSets: 100,
      completedSets: 0,
      totalPoints: 0,
      currentLevel: 'Beginner',
      unlockedSets: ['set-1'], // First set is always unlocked
      completedSetsList: [],
      streak: 0,
      lastActivity: new Date(),
    };

    // Initialize first set as unlocked
    this.setProgress.set('set-1', {
      setId: 'set-1',
      completed: false,
      score: 0,
      attempts: 0,
      bestScore: 0,
      lastAttempt: new Date(),
      unlocked: true,
    });

    await this.saveProgress();
    await this.saveSetProgress();
  }

  private async loadProgress(): Promise<void> {
    try {
      const progressData = await AsyncStorage.getItem('user_progress');
      if (progressData) {
        const parsed = JSON.parse(progressData);
        this.progress = {
          ...parsed,
          lastActivity: new Date(parsed.lastActivity || new Date()),
        };
      }
    } catch (error) {
      console.error('Failed to load progress:', error);
      this.progress = null;
    }
  }

  private async loadSetProgress(): Promise<void> {
    try {
      const setProgressData = await AsyncStorage.getItem('set_progress');
      if (setProgressData) {
        const data = JSON.parse(setProgressData);
        this.setProgress = new Map();
        Object.entries(data).forEach(([key, value]) => {
          const setProgress = value as SetProgress;
          this.setProgress.set(key, {
            ...setProgress,
            lastAttempt: new Date(setProgress.lastAttempt || new Date()),
          });
        });
      }
    } catch (error) {
      console.error('Failed to load set progress:', error);
      this.setProgress = new Map();
    }
  }

  private async saveProgress(): Promise<void> {
    if (this.progress) {
      try {
        await AsyncStorage.setItem('user_progress', JSON.stringify(this.progress));
      } catch (error) {
        console.error('Failed to save progress:', error);
      }
    }
  }

  private async saveSetProgress(): Promise<void> {
    try {
      const data = Object.fromEntries(this.setProgress);
      await AsyncStorage.setItem('set_progress', JSON.stringify(data));
    } catch (error) {
      console.error('Failed to save set progress:', error);
    }
  }

  async getProgress(): Promise<UserProgress | null> {
    return this.progress;
  }

  async getSetProgress(setId: string): Promise<SetProgress | null> {
    return this.setProgress.get(setId) || null;
  }

  async completeSet(setId: string, score: number, totalQuestions: number): Promise<void> {
    if (!this.progress) return;

    const key = String(setId);
    const altKey = key.startsWith('set-') ? key : `set-${key}`;

    const percentage = (score / totalQuestions) * 100;
    const points = Math.round(percentage * 1.2); // Bonus points for higher scores

    // Update set progress
    const existing = this.setProgress.get(key) || this.setProgress.get(altKey);
    const progressKey = existing ? existing.setId : key;

    const setProgress = existing || {
      setId: progressKey,
      completed: false,
      score: 0,
      attempts: 0,
      bestScore: 0,
      lastAttempt: new Date(),
      unlocked: true,
    };

    setProgress.attempts += 1;
    setProgress.score = score;
    setProgress.lastAttempt = new Date();
    setProgress.bestScore = Math.max(setProgress.bestScore, score);

    if (percentage >= 60) {
      setProgress.completed = true;
      
      // Update user progress
      if (!this.progress.completedSetsList.includes(setId)) {
        this.progress.completedSetsList.push(setId);
        this.progress.completedSets += 1;
        this.progress.totalPoints += points;
        this.progress.streak += 1;
      }

      // Unlock next set
      await this.unlockNextSet(setId);
    } else {
      // Reset streak if failed
      this.progress.streak = 0;
    }

    this.progress.lastActivity = new Date();
    this.setProgress.set(progressKey, setProgress);
    // Ensure both key formats resolve to the same data
    if (progressKey !== key) {
      this.setProgress.set(key, { ...setProgress, setId: key });
    }
    if (progressKey !== altKey) {
      this.setProgress.set(altKey, { ...setProgress, setId: altKey });
    }

    await this.saveProgress();
    await this.saveSetProgress();
  }

  private async unlockNextSet(currentSetId: string): Promise<void> {
    if (!this.progress) return;

    // Simple unlocking logic - unlock next set
    const setNumber = parseInt(currentSetId.split('-')[1]);
    const nextSetId = `set-${setNumber + 1}`;

    if (!this.progress.unlockedSets.includes(nextSetId)) {
      this.progress.unlockedSets.push(nextSetId);
      
      // Initialize next set progress
      this.setProgress.set(nextSetId, {
        setId: nextSetId,
        completed: false,
        score: 0,
        attempts: 0,
        bestScore: 0,
        lastAttempt: new Date(),
        unlocked: true,
      });
    }
  }

  async isSetUnlocked(setId: string): Promise<boolean> {
    if (!this.progress) return false;
    return this.progress.unlockedSets.includes(setId);
  }

  async isSetCompleted(setId: string): Promise<boolean> {
    const setProgress = this.setProgress.get(setId);
    return setProgress?.completed || false;
  }

  async getStreak(): Promise<number> {
    return this.progress?.streak || 0;
  }

  async getTotalPoints(): Promise<number> {
    return this.progress?.totalPoints || 0;
  }

  async getCompletedSets(): Promise<string[]> {
    return this.progress?.completedSetsList || [];
  }

  async resetProgress(): Promise<void> {
    this.progress = null;
    this.setProgress.clear();
    await AsyncStorage.removeItem('user_progress');
    await AsyncStorage.removeItem('set_progress');
    await this.createDefaultProgress();
  }
}

export default ProgressService;

import AsyncStorage from '@react-native-async-storage/async-storage';

const STORAGE_KEY = '@engniter.setProgress.v1';

export type SetProgressStatus = 'not_started' | 'in_progress' | 'completed';

export interface SetProgress {
  status: SetProgressStatus;
  lastPhase?: number; // 0..N-1 where the user stopped; next phase index to attempt
  score?: number; // last achieved score (0..100)
  updatedAt: string; // ISO string
}

type ProgressDB = Record<string, Record<string | number, SetProgress>>; // levelId -> setId -> progress

class SetProgressServiceClass {
  private db: ProgressDB = {};
  private ready = false;
  private saveTimer: any = null;

  async initialize(): Promise<void> {
    if (this.ready) return;
    try {
      const raw = await AsyncStorage.getItem(STORAGE_KEY);
      this.db = raw ? JSON.parse(raw) : {};
    } catch (e) {
      this.db = {};
      console.error('[SetProgressService] Failed to load progress:', e);
    } finally {
      this.ready = true;
    }
  }

  private async save(): Promise<void> {
    try {
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(this.db));
    } catch (e) {
      console.error('[SetProgressService] Failed to save progress:', e);
    }
  }

  private scheduleSave() {
    if (this.saveTimer) return;
    this.saveTimer = setTimeout(() => {
      this.saveTimer = null;
      this.save().catch(() => {});
    }, 400);
  }

  // Force immediate save (for use before navigation)
  async flushSave(): Promise<void> {
    if (this.saveTimer) {
      clearTimeout(this.saveTimer);
      this.saveTimer = null;
    }
    await this.save();
  }

  private ensurePath(levelId: string, setId: string | number) {
    if (!this.db[levelId]) this.db[levelId] = {};
    if (!this.db[levelId][setId]) {
      this.db[levelId][setId] = {
        status: 'not_started',
        lastPhase: 0,
        score: undefined,
        updatedAt: new Date().toISOString(),
      };
    }
  }

  get(levelId: string, setId: string | number): SetProgress | null {
    const lvl = this.db[levelId];
    const entry = lvl ? lvl[setId] : undefined;
    return entry ? { ...entry } : null;
  }

  async markInProgress(levelId: string, setId: string | number, lastPhase: number = 0): Promise<void> {
    await this.initialize();
    this.ensurePath(levelId, setId);
    const existing = this.db[levelId][setId];
    // Do not override a completed status
    if (existing.status === 'completed') return;
    this.db[levelId][setId] = {
      ...existing,
      status: 'in_progress',
      lastPhase,
      updatedAt: new Date().toISOString(),
    };
    this.scheduleSave();
  }

  async markCompleted(levelId: string, setId: string | number, score: number): Promise<void> {
    await this.initialize();
    this.ensurePath(levelId, setId);
    this.db[levelId][setId] = {
      status: 'completed',
      lastPhase: undefined,
      score: Math.max(0, Math.round(score)),
      updatedAt: new Date().toISOString(),
    };
    this.scheduleSave();
  }

  // Reset progress for a specific set (mark as not started)
  async resetSet(levelId: string, setId: string | number): Promise<void> {
    await this.initialize();
    if (this.db[levelId] && this.db[levelId][setId]) {
      this.db[levelId][setId] = {
        status: 'not_started',
        lastPhase: 0,
        score: undefined,
        updatedAt: new Date().toISOString(),
      };
      this.scheduleSave();
    }
  }

  // Reset all progress for an entire level
  async resetLevel(levelId: string): Promise<void> {
    await this.initialize();
    if (this.db[levelId]) {
      for (const setId of Object.keys(this.db[levelId])) {
        this.db[levelId][setId] = {
          status: 'not_started',
          lastPhase: 0,
          score: undefined,
          updatedAt: new Date().toISOString(),
        };
      }
      this.scheduleSave();
    }
  }

  // Convenience to read UI flags for a list item
  getSetFlags(levelId: string, setId: string | number): { completed: boolean; inProgress: boolean; score?: number } {
    const p = this.get(levelId, setId);
    return {
      completed: p?.status === 'completed',
      inProgress: p?.status === 'in_progress',
      score: p?.score,
    };
  }
}

export const SetProgressService = new SetProgressServiceClass();
export default SetProgressService;

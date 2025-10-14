import AsyncStorage from '@react-native-async-storage/async-storage';
import { ExerciseResult, AnalyticsData } from '../types';
import { vaultService } from './VaultService';
import { supabase } from '../lib/supabase';

const ANALYTICS_KEY = 'vocab_analytics';
const ANALYTICS_BACKUP_KEY = 'vocab_analytics_backup';

class AnalyticsService {
  private results: ExerciseResult[] = [];
  private initInFlight: boolean = false;
  private inited: boolean = false;

  async initialize() {
    if (this.inited || this.initInFlight) return;
    this.initInFlight = true;
    // Always prefer local data; treat network as best‑effort
    let local: ExerciseResult[] = [];
    try {
      const stored = await AsyncStorage.getItem(ANALYTICS_KEY);
      local = stored ? this.normalize(JSON.parse(stored)) : [];
      if (!local.length) {
        const backup = await AsyncStorage.getItem(ANALYTICS_BACKUP_KEY);
        const backupArr = backup ? this.normalize(JSON.parse(backup)) : [];
        if (backupArr.length) {
          console.warn('Analytics: recovered from backup store');
          local = backupArr;
          await AsyncStorage.setItem(ANALYTICS_KEY, JSON.stringify(local));
        }
      }
    } catch (e) {
      // Use warn to avoid red error overlay during dev
      console.warn('Analytics: failed to read local cache', e);
      local = [];
    }

    let user: any = null;
    let remote: ExerciseResult[] = [];
    try {
      const resp = await supabase.auth.getUser();
      user = resp?.data?.user ?? null;
      remote = (user?.user_metadata?.analytics ? this.normalize(user.user_metadata.analytics) : []) as ExerciseResult[];
    } catch (e) {
      // Do not wipe local data if network/auth fails
      console.warn('Analytics: skipped remote merge (offline or auth issue)');
      remote = [];
    }

    const merged = this.mergeResults(local, remote);
    this.results = merged.length === 0 && local.length > 0 ? local : merged;

    // Persist back to local; remote update is best‑effort
    try {
      const json = JSON.stringify(this.results);
      await AsyncStorage.setItem(ANALYTICS_KEY, json);
      // keep synchronized backup to guard against accidental clears across updates
      await AsyncStorage.setItem(ANALYTICS_BACKUP_KEY, json);
    } catch (e) {
      console.warn('Analytics: failed to write local cache', e);
    }
    if (user) {
      try {
        await supabase.auth.updateUser({ data: { analytics: this.results } });
      } catch (e) {
        // Ignore; keep local copy
        console.warn('Analytics: failed to sync to remote, kept local');
      }
    }
    this.inited = true;
    this.initInFlight = false;
  }

  private async saveResults(force = false) {
    try {
      if (!force) {
        // Do not overwrite non-empty local history with empty results by accident
        const existingRaw = await AsyncStorage.getItem(ANALYTICS_KEY);
        const existing: ExerciseResult[] = existingRaw ? this.normalize(JSON.parse(existingRaw)) : [];
        if (existing.length > 0 && this.results.length === 0) {
          console.warn('Analytics: skipped writing empty history over existing data');
          return;
        }
      }
      await AsyncStorage.setItem(ANALYTICS_KEY, JSON.stringify(this.results));
      // Also persist to Supabase per-account storage when logged in
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        await supabase.auth.updateUser({ data: { analytics: this.results } });
      }
    } catch (error) {
      // Network can be unavailable (simulators/offline). Log as warn to avoid dev overlay.
      console.warn('Analytics: save skipped (offline):', error);
    }
  }

  async recordResult(result: ExerciseResult) {
    this.results.push(result);
    await this.saveResults();
  }

  // Count exercises done today and overall (all time)
  getTodayAndTotalCounts(): { today: number; total: number } {
    const total = this.results.length;
    const todayStr = new Date().toISOString().split('T')[0];
    const today = this.results.filter(r => new Date(r.timestamp).toISOString().split('T')[0] === todayStr).length;
    return { today, total };
  }

  // Best streak across all-time: most consecutive days with at least one correct answer
  getRecordStreak(): number {
    if (!this.results.length) return 0;
    const byDay: Record<string, { correct: number; total: number }> = {};
    this.results.forEach(r => {
      const day = new Date(r.timestamp).toISOString().split('T')[0];
      byDay[day] = byDay[day] || { correct: 0, total: 0 };
      byDay[day].total += 1;
      if (r.correct) byDay[day].correct += 1;
    });

    const days = Object.keys(byDay)
      .sort(); // ascending YYYY-MM-DD order

    let record = 0;
    let current = 0;
    let prevDate: Date | null = null;
    for (const dayStr of days) {
      const hasCorrect = byDay[dayStr].correct > 0;
      const date = new Date(dayStr + 'T00:00:00Z');
      const isConsecutive = prevDate ? (date.getTime() - prevDate.getTime() === 24 * 60 * 60 * 1000) : false;

      if (hasCorrect) {
        current = isConsecutive ? current + 1 : 1;
        record = Math.max(record, current);
      } else {
        current = 0; // break streak on a day with no correct answers
      }
      prevDate = date;
    }
    return record;
  }

  getAnalyticsData(): AnalyticsData {
    const now = new Date();
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    
    // Filter results from last 30 days
    const recentResults = this.results.filter(
      result => new Date(result.timestamp) >= thirtyDaysAgo
    );

    // Calculate accuracy by exercise type (ensure all main types show up even if 0)
    const accuracyByType: Record<string, number> = {};
    const baseTypes = ['mcq', 'synonym', 'usage', 'letters', 'sprint'];
    const exerciseTypes = [...new Set([...baseTypes, ...recentResults.map(r => r.exerciseType)])];
    
    exerciseTypes.forEach(type => {
      const typeResults = recentResults.filter(r => r.exerciseType === type);
      const correctCount = typeResults.filter(r => r.correct).length;
      accuracyByType[type] = typeResults.length > 0 
        ? Math.round((correctCount / typeResults.length) * 100) 
        : 0;
    });

    // Calculate accuracy trend (last 7 days) and time spent per day
    const accuracyTrend = [] as Array<{ date: string; accuracy: number }>;
    const timeTrend = [] as Array<{ date: string; seconds: number }>;
    for (let i = 6; i >= 0; i--) {
      const date = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
      const dayStart = new Date(date.getFullYear(), date.getMonth(), date.getDate());
      const dayEnd = new Date(dayStart.getTime() + 24 * 60 * 60 * 1000);
      
      const dayResults = recentResults.filter(
        result => {
          const resultDate = new Date(result.timestamp);
          return resultDate >= dayStart && resultDate < dayEnd;
        }
      );
      
      const dayAccuracy = dayResults.length > 0 
        ? Math.round((dayResults.filter(r => r.correct).length / dayResults.length) * 100)
        : 0;
      const daySeconds = dayResults.reduce((sum, r) => sum + Math.max(0, Number(r.timeSpent || 0)), 0);
      
      accuracyTrend.push({
        date: dayStart.toISOString().split('T')[0],
        accuracy: dayAccuracy,
      });
      timeTrend.push({
        date: dayStart.toISOString().split('T')[0],
        seconds: daySeconds,
      });
    }

    // Calculate overall accuracy
    const totalCorrect = recentResults.filter(r => r.correct).length;
    const overallAccuracy = recentResults.length > 0 
      ? Math.round((totalCorrect / recentResults.length) * 100)
      : 0;

    // Calculate streak (consecutive days with at least one correct answer)
    let streak = 0;
    const uniqueDays = [...new Set(
      recentResults.map(r => 
        new Date(r.timestamp).toISOString().split('T')[0]
      )
    )].sort().reverse();

    for (const day of uniqueDays) {
      const dayResults = recentResults.filter(
        r => new Date(r.timestamp).toISOString().split('T')[0] === day
      );
      if (dayResults.some(r => r.correct)) {
        streak++;
      } else {
        break;
      }
    }

    // Calculate personal best (highest single-day accuracy)
    const dailyAccuracy: Record<string, number> = {};
    recentResults.forEach(result => {
      const day = new Date(result.timestamp).toISOString().split('T')[0];
      if (!dailyAccuracy[day]) {
        dailyAccuracy[day] = 0;
      }
    });

    Object.keys(dailyAccuracy).forEach(day => {
      const dayResults = recentResults.filter(
        r => new Date(r.timestamp).toISOString().split('T')[0] === day
      );
      const correctCount = dayResults.filter(r => r.correct).length;
      dailyAccuracy[day] = dayResults.length > 0 
        ? Math.round((correctCount / dayResults.length) * 100)
        : 0;
    });

    const personalBest = Math.max(...Object.values(dailyAccuracy), 0);

    // --- Extended insights ---
    // Per-word performance
    const perWordMap = new Map<string, { attempts: number; correct: number }>();
    recentResults.forEach(r => {
      const key = (r.wordId || '').toString().toLowerCase();
      if (!key) return;
      const s = perWordMap.get(key) || { attempts: 0, correct: 0 };
      s.attempts += 1;
      if (r.correct) s.correct += 1;
      perWordMap.set(key, s);
    });
    const weakWords = Array.from(perWordMap.entries())
      .map(([word, s]) => ({ word, attempts: s.attempts, accuracy: s.attempts ? Math.round((s.correct / s.attempts) * 100) : 0 }))
      .filter(w => w.attempts >= 2)
      .sort((a, b) => a.accuracy - b.accuracy)
      .slice(0, 10);

    // Tag stats (using vault metadata)
    let tagStats: Array<{ tag: string; attempts: number; correct: number }> = [];
    try {
      // Ensure vault is initialized if not
      const words = vaultService.getAllWords();
      const byWord = new Map<string, string[]>(); // word -> tags
      words.forEach(w => byWord.set(w.word.toLowerCase(), Array.isArray(w.tags) ? w.tags : []));
      const tagMap = new Map<string, { attempts: number; correct: number }>();
      recentResults.forEach(r => {
        const w = (r.wordId || '').toString().toLowerCase();
        const tags = byWord.get(w) || [];
        tags.forEach(tag => {
          const s = tagMap.get(tag) || { attempts: 0, correct: 0 };
          s.attempts += 1;
          if (r.correct) s.correct += 1;
          tagMap.set(tag, s);
        });
      });
      tagStats = Array.from(tagMap.entries()).map(([tag, s]) => ({ tag, attempts: s.attempts, correct: s.correct }));
    } catch {}
    const tagStatsOut = tagStats
      .map(t => ({ tag: t.tag, attempts: t.attempts, accuracy: t.attempts ? Math.round((t.correct / t.attempts) * 100) : 0 }))
      .sort((a, b) => a.accuracy - b.accuracy);

    // Time-of-day and day-of-week accuracy
    const buckets: Record<string, { a: number; c: number }> = {
      morning: { a: 0, c: 0 }, // 6-12
      afternoon: { a: 0, c: 0 }, // 12-17
      evening: { a: 0, c: 0 }, // 17-22
      night: { a: 0, c: 0 }, // 22-6
    };
    const dow: Record<string, { a: number; c: number }> = { Sun:{a:0,c:0}, Mon:{a:0,c:0}, Tue:{a:0,c:0}, Wed:{a:0,c:0}, Thu:{a:0,c:0}, Fri:{a:0,c:0}, Sat:{a:0,c:0} };
    recentResults.forEach(r => {
      const d = new Date(r.timestamp);
      const h = d.getHours();
      const b = h >= 6 && h < 12 ? 'morning' : h >= 12 && h < 17 ? 'afternoon' : h >= 17 && h < 22 ? 'evening' : 'night';
      buckets[b].a += 1; if (r.correct) buckets[b].c += 1;
      const day = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'][d.getDay()];
      dow[day].a += 1; if (r.correct) dow[day].c += 1;
    });
    const timeOfDayAccuracy = Object.fromEntries(Object.entries(buckets).map(([k,v]) => [k, v.a ? Math.round((v.c/v.a)*100) : 0]));
    const dayOfWeekAccuracy = Object.fromEntries(Object.entries(dow).map(([k,v]) => [k, v.a ? Math.round((v.c/v.a)*100) : 0]));

    // --- SRS health from vault ---
    let srsHealth: AnalyticsData['srsHealth'] | undefined = undefined;
    try {
      const words = vaultService.getAllWords();
      const now = new Date();
      const overdueBuckets: Record<string, number> = { today: 0, '1-3d': 0, '4-7d': 0, '8+d': 0 };
      let efSum = 0, efCount = 0;
      let intervalSum = 0, intervalCount = 0;
      const stages: Record<string, number> = { rep0: 0, rep1: 0, rep2: 0, 'rep3-5': 0, 'rep6+': 0 };
      const lapsesList: Array<{ word: string; lapses: number }> = [];
      words.forEach(w => {
        const s = w.srs;
        if (!s) return;
        // Overdue bucket
        const dueAt = s.dueAt ? new Date(s.dueAt) : now;
        const deltaDays = Math.floor((now.getTime() - dueAt.getTime()) / (1000 * 60 * 60 * 24));
        if (deltaDays <= 0) overdueBuckets.today += 1;
        else if (deltaDays <= 3) overdueBuckets['1-3d'] += 1;
        else if (deltaDays <= 7) overdueBuckets['4-7d'] += 1;
        else overdueBuckets['8+d'] += 1;

        // Ease factor & interval
        if (s.easeFactor) { efSum += s.easeFactor; efCount += 1; }
        if (typeof s.interval === 'number') { intervalSum += s.interval; intervalCount += 1; }

        // Stage distribution by repetition count
        const r = s.repetition ?? 0;
        if (r <= 0) stages.rep0 += 1;
        else if (r === 1) stages.rep1 += 1;
        else if (r === 2) stages.rep2 += 1;
        else if (r <= 5) stages['rep3-5'] += 1;
        else stages['rep6+'] += 1;

        // Lapses list
        lapsesList.push({ word: w.word, lapses: s.lapses ?? 0 });
      });
      lapsesList.sort((a, b) => b.lapses - a.lapses);
      srsHealth = {
        overdueBuckets,
        avgEaseFactor: efCount ? Math.round((efSum / efCount) * 100) / 100 : 0,
        avgInterval: intervalCount ? Math.round((intervalSum / intervalCount) * 10) / 10 : 0,
        stageDistribution: stages,
        topLapses: lapsesList.filter(x => x.lapses > 0).slice(0, 10),
      };
    } catch {}

    // Recommendations
    const recommendations: Array<{ kind: string; text: string }> = [];
    const overdueTotal = srsHealth ? Object.values(srsHealth.overdueBuckets).reduce((a, b) => a + b, 0) : 0;
    if (overdueTotal > 0) recommendations.push({ kind: 'srs', text: `Review ${overdueTotal} due words now to reduce backlog.` });
    if ((weakWords?.length || 0) > 0) recommendations.push({ kind: 'weak', text: `Drill weakest words: ${weakWords!.slice(0,3).map(w=>w.word).join(', ')}.` });
    if ((tagStatsOut?.length || 0) > 0) recommendations.push({ kind: 'topic', text: `Focus on topic: ${tagStatsOut[0].tag} (lowest accuracy).` });

    return {
      accuracyByType,
      accuracyTrend,
      overallAccuracy,
      streak,
      personalBest,
      timeTrend,
      weakWords,
      tagStats: tagStatsOut,
      timeOfDayAccuracy,
      dayOfWeekAccuracy,
      srsHealth,
      recommendations,
    };
  }

  getExerciseStats() {
    const totalExercises = this.results.length;
    const correctExercises = this.results.filter(r => r.correct).length;
    const totalScore = this.results.reduce((sum, r) => sum + r.score, 0);
    const averageScore = totalExercises > 0 ? totalScore / totalExercises : 0;

    return {
      totalExercises,
      correctExercises,
      totalScore,
      averageScore: Math.round(averageScore * 100) / 100,
    };
  }

  clearData() {
    this.results = [];
    return this.saveResults(true);
  }

  // --- helpers ---
  private normalize(arr: any[]): ExerciseResult[] {
    if (!Array.isArray(arr)) return [] as ExerciseResult[];
    return arr.map((r) => ({
      ...r,
      timestamp: r.timestamp instanceof Date ? r.timestamp : new Date(r.timestamp),
    }));
  }

  private mergeResults(a: ExerciseResult[], b: ExerciseResult[]): ExerciseResult[] {
    const keyOf = (r: ExerciseResult) => `${r.wordId}|${r.exerciseType}|${new Date(r.timestamp).toISOString()}`;
    const map = new Map<string, ExerciseResult>();
    [...a, ...b].forEach((r) => {
      const k = keyOf(r);
      if (!map.has(k)) map.set(k, r);
    });
    // Sort by timestamp ascending for stable processing
    return Array.from(map.values()).sort((x, y) => new Date(x.timestamp).getTime() - new Date(y.timestamp).getTime());
  }
}

export const analyticsService = new AnalyticsService();

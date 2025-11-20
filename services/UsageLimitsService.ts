import AsyncStorage from '@react-native-async-storage/async-storage';
import SubscriptionService from './SubscriptionService';

type Feature = 'translate' | 'story' | 'scan';

const BASE = {
  translate: { daily: 5, daysCap: 3 },
  story: { daily: 10 },
  scan: { daily: 5 },
} as const;

const STORY_TOTAL_KEY = '@engniter.usage.story.total.v1';
const STORY_FREE_TOTAL = 5;

const TRIAL_KEY = '@engniter.trial.startAt';

function todayKey(): string {
  const d = new Date();
  return d.toISOString().slice(0, 10); // YYYY-MM-DD
}

async function ensureTrialStartExists() {
  try {
    const cur = await AsyncStorage.getItem(TRIAL_KEY);
    if (!cur) await AsyncStorage.setItem(TRIAL_KEY, String(Date.now()));
  } catch {}
}

async function isTrialBoostActive(): Promise<boolean> {
  try {
    let raw = await AsyncStorage.getItem(TRIAL_KEY);
    if (!raw) {
      await ensureTrialStartExists();
      raw = await AsyncStorage.getItem(TRIAL_KEY);
    }
    const t = raw ? parseInt(raw, 10) : Date.now();
    const elapsed = Date.now() - t;
    const sevenDays = 7 * 24 * 60 * 60 * 1000;
    return elapsed < sevenDays;
  } catch { return false; }
}

async function dailyCountKey(feature: Feature): Promise<string> {
  return `@engniter.usage.${feature}.count:${todayKey()}`;
}

async function getDailyCount(feature: Feature): Promise<number> {
  try {
    const raw = await AsyncStorage.getItem(await dailyCountKey(feature));
    return raw ? Math.max(0, parseInt(raw, 10)) : 0;
  } catch { return 0; }
}

async function setDailyCount(feature: Feature, value: number): Promise<void> {
  try { await AsyncStorage.setItem(await dailyCountKey(feature), String(Math.max(0, Math.floor(value)))); } catch {}
}

const TRANSLATE_DAYS_KEY = '@engniter.usage.translate.days.v1';
async function getTranslateDays(): Promise<Set<string>> {
  try {
    const raw = await AsyncStorage.getItem(TRANSLATE_DAYS_KEY);
    const arr: string[] = raw ? JSON.parse(raw) : [];
    return new Set(arr);
  } catch { return new Set(); }
}
async function setTranslateDays(s: Set<string>): Promise<void> {
  try { await AsyncStorage.setItem(TRANSLATE_DAYS_KEY, JSON.stringify(Array.from(s).slice(-30))); } catch {}
}

async function getStoryTotalCount(): Promise<number> {
  try {
    const raw = await AsyncStorage.getItem(STORY_TOTAL_KEY);
    return raw ? Math.max(0, parseInt(raw, 10)) : 0;
  } catch { return 0; }
}

async function setStoryTotalCount(value: number): Promise<void> {
  try {
    await AsyncStorage.setItem(STORY_TOTAL_KEY, String(Math.max(0, Math.floor(value))));
  } catch {}
}

async function incrementStoryTotalCount(): Promise<void> {
  const current = await getStoryTotalCount();
  await setStoryTotalCount(current + 1);
}

export type LimitCheck = {
  ok: boolean;
  remaining: number; // remaining today (>=0)
  limit: number; // daily limit applied
  reason?: 'daily' | 'daysCap' | 'subscribe';
  subscribed: boolean;
};

async function getLimitsFor(feature: Feature): Promise<{ daily: number; daysCap?: number; subscribed: boolean; trialBoost: boolean }>
{
  const status = await SubscriptionService.getStatus().catch(() => ({ active: false } as any));
  const subscribed = !!status?.active;
  const trialBoost = !subscribed && (await isTrialBoostActive());
  const base = BASE[feature];
  const daily = Math.max(1, Math.floor(base.daily * (trialBoost ? 2 : 1)));
  return { daily, daysCap: (base as any).daysCap, subscribed, trialBoost };
}

export const UsageLimitsService = {
  async check(feature: Feature): Promise<LimitCheck> {
    const { daily, daysCap, subscribed } = await getLimitsFor(feature);
    if (subscribed) return { ok: true, remaining: Number.MAX_SAFE_INTEGER, limit: daily, subscribed };
    let storyRemaining = Number.MAX_SAFE_INTEGER;
    if (feature === 'story') {
      const total = await getStoryTotalCount();
      const remainingFree = Math.max(0, STORY_FREE_TOTAL - total);
      storyRemaining = remainingFree;
      if (remainingFree <= 0) {
        return {
          ok: false,
          remaining: 0,
          limit: STORY_FREE_TOTAL,
          reason: 'subscribe',
          subscribed,
        };
      }
    }
    const count = await getDailyCount(feature);
    if (count >= daily) return { ok: false, remaining: 0, limit: daily, reason: 'daily', subscribed };
    if (feature === 'translate' && daysCap != null) {
      const days = await getTranslateDays();
      const today = todayKey();
      const hasToday = days.has(today);
      const usedDays = days.size;
      if (!hasToday && usedDays >= daysCap) {
        return { ok: false, remaining: daily - count, limit: daily, reason: 'daysCap', subscribed };
      }
    }
    const remainingDaily = Math.max(0, daily - count);
    const remaining = feature === 'story' ? Math.min(remainingDaily, storyRemaining) : remainingDaily;
    const limit = feature === 'story' ? Math.min(daily, STORY_FREE_TOTAL) : daily;
    return { ok: true, remaining, limit, subscribed };
  },

  async bump(feature: Feature, subscribed = false): Promise<void> {
    const c = await getDailyCount(feature);
    await setDailyCount(feature, c + 1);
    if (feature === 'translate') {
      const days = await getTranslateDays();
      days.add(todayKey());
      await setTranslateDays(days);
    }
    if (feature === 'story' && !subscribed) {
      await incrementStoryTotalCount();
    }
  },

  async checkAndBump(feature: Feature): Promise<LimitCheck> {
    const res = await this.check(feature);
    if (res.ok) await this.bump(feature, res.subscribed);
    return res;
  },
};

export default UsageLimitsService;

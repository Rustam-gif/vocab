import { Platform, Alert, Linking } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Optional native notifier (if project integrates a notifications library)
let RNPush: any = null;
try {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  RNPush = require('react-native-push-notification');
} catch {}

export type ReminderFrequency = 1 | 3 | 5;

const PREF_ENABLED = '@engniter.notify.enabled';
const PREF_FREQ = '@engniter.notify.freq';
const PREF_START_H = '@engniter.notify.startH';
const PREF_END_H = '@engniter.notify.endH';

const MESSAGES: string[] = [
  'Quick win? 5 minutes improves your streak ✨',
  'Your words miss you. Learn 3 now! 📚',
  'Small steps today build fluency tomorrow 💪',
  'Practice moment: one story or 5 words 🔁',
  'You’re close to your next milestone. Keep going! 🔥',
];

function pickMessage(i: number): string {
  return MESSAGES[i % MESSAGES.length];
}

function dailySlots(freq: ReminderFrequency): number[] {
  // return minutes-from-midnight for each reminder
  if (freq === 1) return [19 * 60]; // 19:00
  if (freq === 3) return [10 * 60, 15 * 60, 20 * 60 + 30]; // 10:00, 15:00, 20:30
  return [8 * 60, 11 * 60 + 30, 15 * 60, 18 * 60 + 30, 21 * 60]; // 5x
}

function nextDateForMinutes(minutes: number): Date {
  const now = new Date();
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  d.setMinutes(minutes);
  if (d <= now) {
    d.setDate(d.getDate() + 1); // schedule next day if time passed
  }
  return d;
}

async function cancelAllNative() {
  try { RNPush?.cancelAllLocalNotifications?.(); } catch {}
}

export const NotificationService = {
  async getSettings(): Promise<{ enabled: boolean; freq: ReminderFrequency; startH?: number; endH?: number }> {
    const enabledRaw = await AsyncStorage.getItem(PREF_ENABLED);
    const freqRaw = await AsyncStorage.getItem(PREF_FREQ);
    const enabled = enabledRaw === '1';
    const freq = (freqRaw === '3' ? 3 : freqRaw === '5' ? 5 : 1) as ReminderFrequency;
    const startH = parseInt((await AsyncStorage.getItem(PREF_START_H)) || '10', 10);
    const endH = parseInt((await AsyncStorage.getItem(PREF_END_H)) || '22', 10);
    return { enabled, freq, startH, endH };
  },

  async setSettings(opts: { enabled?: boolean; freq?: ReminderFrequency; startH?: number; endH?: number }) {
    if (opts.enabled != null) await AsyncStorage.setItem(PREF_ENABLED, opts.enabled ? '1' : '0');
    if (opts.freq != null) await AsyncStorage.setItem(PREF_FREQ, String(opts.freq));
    if (opts.startH != null) await AsyncStorage.setItem(PREF_START_H, String(Math.max(0, Math.min(23, opts.startH))));
    if (opts.endH != null) await AsyncStorage.setItem(PREF_END_H, String(Math.max(0, Math.min(23, opts.endH))));
  },

  async requestPermission(): Promise<boolean> {
    try {
      if (RNPush?.requestPermissions) {
        const res = await RNPush.requestPermissions();
        return !!res?.alert || !!res; // iOS returns object, Android true
      }
    } catch {}
    // Fallback: assume allowed while in-app for demo
    return true;
  },

  async scheduleAll(freq: ReminderFrequency) {
    const enabledRaw = await AsyncStorage.getItem(PREF_ENABLED);
    const enabled = enabledRaw === '1';
    if (!enabled) return;
    // Clear existing
    await cancelAllNative();

    const slots = dailySlots(freq);
    let i = 0;
    for (const m of slots) {
      const fireDate = nextDateForMinutes(m);
      const message = pickMessage(i++);
      if (RNPush) {
        try {
          RNPush.localNotificationSchedule?.({
            channelId: 'engniter-reminders',
            title: 'Practice Reminder',
            message,
            date: fireDate,
            allowWhileIdle: true,
            repeatType: 'day',
            playSound: false,
            importance: 3,
          });
        } catch (e) {
          console.warn('Failed to schedule native notification', e);
        }
      } else {
        // In-app lightweight fallback (only while app is open)
        const ms = fireDate.getTime() - Date.now();
        setTimeout(() => {
          try { Alert.alert('Practice Reminder', message); } catch {}
        }, Math.max(1000, ms));
      }
    }
  },

  /**
   * Schedule N reminders evenly distributed between [startH, endH] local time.
   */
  async scheduleWindow(count: number, startH: number, endH: number) {
    const enabledRaw = await AsyncStorage.getItem(PREF_ENABLED);
    const enabled = enabledRaw === '1';
    if (!enabled) return;
    await cancelAllNative();
    try { RNPush?.createChannel?.({ channelId: 'engniter-reminders', channelName: 'Practice Reminders', importance: 3, vibrate: false }); } catch {}
    const ok = await this.requestPermission();
    if (!ok) return;
    // Persist window
    await AsyncStorage.setItem(PREF_START_H, String(startH));
    await AsyncStorage.setItem(PREF_END_H, String(endH));
    const minH = Math.max(0, Math.min(23, Math.min(startH, endH)));
    const maxH = Math.max(0, Math.min(23, Math.max(startH, endH)));
    const startM = minH * 60;
    const endM = maxH * 60;
    let span = endM - startM;
    if (span <= 0) {
      // If window collapsed to a single hour, spread the reminders over the next hour
      span = 60;
    }
    const n = Math.max(1, Math.min(10, Math.round(count)));
    for (let i = 0; i < n; i++) {
      const frac = n === 1 ? 0.5 : (i + 0.5) / n; // midpoints of segments
      const mins = Math.round(startM + frac * span);
      const fireDate = nextDateForMinutes(mins);
      const message = pickMessage(i);
      if (RNPush) {
        try {
          RNPush.localNotificationSchedule?.({
            channelId: 'engniter-reminders',
            title: 'Practice Reminder',
            message,
            date: fireDate,
            allowWhileIdle: true,
            repeatType: 'day',
            playSound: false,
            importance: 3,
          });
        } catch (e) {
          console.warn('Failed to schedule window notification', e);
        }
      }
    }
  },

  async enable(enabled: boolean) {
    await AsyncStorage.setItem(PREF_ENABLED, enabled ? '1' : '0');
    if (enabled) {
      try {
        RNPush?.createChannel?.({ channelId: 'engniter-reminders', channelName: 'Practice Reminders', importance: 3, vibrate: false });
      } catch {}
      const ok = await this.requestPermission();
      if (!ok) return;
      const s = await this.getSettings();
      await this.scheduleAll(s.freq);
    } else {
      await cancelAllNative();
    }
  },

  /**
   * Open the OS settings page for this app so the user can allow notifications.
   * Falls back gracefully if not supported.
   */
  async openSystemNotificationSettings() {
    try {
      // React Native >=0.63 supports this and opens the app's settings page
      await Linking.openSettings();
      return true;
    } catch {}
    try {
      if (Platform.OS === 'ios') {
        await Linking.openURL('app-settings:');
        return true;
      }
    } catch {}
    return false;
  },

  async previewOnce() {
    const msg = pickMessage(Math.floor(Math.random() * MESSAGES.length));
    if (RNPush) {
      try {
        RNPush.createChannel?.({ channelId: 'engniter-reminders', channelName: 'Practice Reminders', importance: 4 });
        RNPush.localNotificationSchedule?.({
          channelId: 'engniter-reminders',
          title: 'Practice Reminder',
          message: msg,
          date: new Date(Date.now() + 2500),
          allowWhileIdle: true,
          priority: 'high',
          importance: 4,
          playSound: false,
        });
        return;
      } catch (e) {
        console.warn('Preview notification failed:', e);
      }
    }
    Alert.alert('Enable system notifications', 'Install and configure push notifications to preview the OS banner.');
  },

  /**
   * Back-compat helper used by App.tsx to ensure a single daily reminder exists
   * (default 19:00). Respects the user enable/disable preference.
   */
  async ensureDailyReminder(hour = 19, minute = 0) {
    const enabledRaw = await AsyncStorage.getItem(PREF_ENABLED);
    const enabled = enabledRaw === '1';
    if (!enabled) return;
    try { RNPush?.createChannel?.({ channelId: 'engniter-reminders', channelName: 'Practice Reminders', importance: 3, vibrate: false }); } catch {}
    const ok = await this.requestPermission();
    if (!ok) return;
    // Schedule a single daily event
    const now = new Date();
    const d = new Date();
    d.setHours(hour, minute, 0, 0);
    if (d <= now) d.setDate(d.getDate() + 1);
    const message = pickMessage(Math.floor(Math.random() * MESSAGES.length));
    if (RNPush) {
      try {
        RNPush.localNotificationSchedule?.({
          channelId: 'engniter-reminders',
          title: 'Practice Reminder',
          message,
          date: d,
          allowWhileIdle: true,
          repeatType: 'day',
          playSound: false,
          importance: 3,
        });
      } catch (e) {
        console.warn('Failed to schedule daily reminder:', e);
      }
    }
  },
};

export default NotificationService;

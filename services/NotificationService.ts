import { Platform, Alert, Linking } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Optional native notifier (if project integrates a notifications library)
let RNPush: any = null;
try {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  RNPush = require('react-native-push-notification');
} catch {}

export type ReminderFrequency = 1 | 2 | 3 | 5;

const PREF_ENABLED = '@engniter.notify.enabled';
const PREF_FREQ = '@engniter.notify.freq';
const PREF_START_H = '@engniter.notify.startH';
const PREF_END_H = '@engniter.notify.endH';
const DAILY_GOAL_KEY = '@engniter.onboarding.dailyGoal';
const TODAY_WORDS_KEY = '@engniter.progress.wordsToday';
const TODAY_DATE_KEY = '@engniter.progress.todayDate';

const MESSAGES: string[] = [
  'Quick win? 5 minutes improves your streak ✨',
  'Your words miss you. Learn 3 now! 📚',
  'Small steps today build fluency tomorrow 💪',
  'Practice moment: one story or 5 words 🔁',
  'You are close to your next milestone. Keep going! 🔥',
];

// Personalized messages based on daily goal and progress
const getPersonalizedMessage = async (): Promise<string> => {
  try {
    const [goalResult, wordsResult, dateResult] = await AsyncStorage.multiGet([
      DAILY_GOAL_KEY,
      TODAY_WORDS_KEY,
      TODAY_DATE_KEY,
    ]);

    const dailyGoal = goalResult[1] ? parseInt(goalResult[1], 10) : 10;
    const today = new Date().toISOString().split('T')[0];
    const savedDate = dateResult[1];

    // Check if today's data is current
    let wordsToday = 0;
    if (savedDate === today) {
      wordsToday = wordsResult[1] ? parseInt(wordsResult[1], 10) : 0;
    }

    const remaining = Math.max(0, dailyGoal - wordsToday);
    const percent = Math.round((wordsToday / dailyGoal) * 100);

    // Calculate estimated time based on 1 word = ~30 seconds average
    const mins = Math.ceil(remaining * 0.5);

    // Choose message based on progress
    if (wordsToday >= dailyGoal) {
      // Goal completed - congratulations!
      const congratsMessages = [
        'Amazing! You hit your daily goal! Keep the momentum going tomorrow',
        'Goal crushed! You are building an impressive vocabulary',
        'Champion! Daily goal complete. Rest up for tomorrow',
      ];
      return congratsMessages[Math.floor(Math.random() * congratsMessages.length)];
    } else if (wordsToday === 0) {
      // Not started
      const startMessages = [
        `Time for your daily vocabulary boost! ${dailyGoal} words waiting`,
        `Start your day with ${dailyGoal} new words. Just ${mins} minutes!`,
        'Fresh words await! Begin your learning streak today',
      ];
      return startMessages[Math.floor(Math.random() * startMessages.length)];
    } else if (percent >= 75) {
      // Almost there
      return `Almost there! Just ${remaining} more words to hit your goal`;
    } else if (percent >= 50) {
      // Halfway
      return `Halfway done! ${remaining} words left. You've got this!`;
    } else {
      // In progress
      const progressMessages = [
        `${remaining} words left today! Just ${mins} more minutes`,
        `You are ${percent}% done with today's goal! Keep going`,
        `Quick session? ${remaining} words to complete your daily goal`,
      ];
      return progressMessages[Math.floor(Math.random() * progressMessages.length)];
    }
  } catch (e) {
    // Fallback to default message
    return MESSAGES[Math.floor(Math.random() * MESSAGES.length)];
  }
};

function pickMessage(i: number): string {
  return MESSAGES[i % MESSAGES.length];
}

function dailySlots(freq: ReminderFrequency): number[] {
  // return minutes-from-midnight for each reminder
  if (freq === 1) return [19 * 60]; // 19:00
  if (freq === 2) return [10 * 60, 19 * 60]; // 10:00, 19:00
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
    // Default to enabled if never set (first launch)
    const enabled = enabledRaw === null ? true : enabledRaw === '1';
    // Default to 2 notifications per day
    const freq = (freqRaw === '1' ? 1 : freqRaw === '3' ? 3 : freqRaw === '5' ? 5 : 2) as ReminderFrequency;
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
    // Default to enabled if never set (first launch)
    const enabled = enabledRaw === null ? true : enabledRaw === '1';
    if (!enabled) return;
    // Clear existing
    await cancelAllNative();

    const slots = dailySlots(freq);
    let i = 0;
    for (const m of slots) {
      const fireDate = nextDateForMinutes(m);
      // Use personalized message for first slot, fallback for others
      const message = i === 0 ? await getPersonalizedMessage() : pickMessage(i);
      i++;
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
        setTimeout(async () => {
          try {
            const personalizedMsg = await getPersonalizedMessage();
            Alert.alert('Practice Reminder', personalizedMsg);
          } catch {}
        }, Math.max(1000, ms));
      }
    }
  },

  /**
   * Schedule N reminders evenly distributed between [startH, endH] local time.
   */
  async scheduleWindow(count: number, startH: number, endH: number) {
    const enabledRaw = await AsyncStorage.getItem(PREF_ENABLED);
    // Default to enabled if never set (first launch)
    const enabled = enabledRaw === null ? true : enabledRaw === '1';
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
   * Initialize notifications on app startup.
   * On first launch: enables notifications and schedules 2x daily (10:00 and 19:00).
   * On subsequent launches: respects user preferences and reschedules.
   */
  async initialize() {
    const enabledRaw = await AsyncStorage.getItem(PREF_ENABLED);
    const freqRaw = await AsyncStorage.getItem(PREF_FREQ);

    // First launch: set defaults and enable
    if (enabledRaw === null) {
      await AsyncStorage.setItem(PREF_ENABLED, '1');
      await AsyncStorage.setItem(PREF_FREQ, '2');
      console.log('[Notifications] First launch - enabling with 2x daily');
    }

    const settings = await this.getSettings();
    if (!settings.enabled) {
      console.log('[Notifications] Disabled by user');
      return;
    }

    // Create channel (Android)
    try {
      RNPush?.createChannel?.({
        channelId: 'engniter-reminders',
        channelName: 'Practice Reminders',
        importance: 3,
        vibrate: false,
        soundName: 'default',
      });
    } catch {}

    // Request permission
    const ok = await this.requestPermission();
    if (!ok) {
      console.log('[Notifications] Permission denied');
      return;
    }

    // Schedule notifications based on frequency (default 2x daily)
    await this.scheduleAll(settings.freq);
    console.log(`[Notifications] Scheduled ${settings.freq}x daily reminders`);
  },

  /**
   * Back-compat helper - now just calls initialize()
   */
  async ensureDailyReminder(_hour = 19, _minute = 0) {
    await this.initialize();
  },
};

export default NotificationService;

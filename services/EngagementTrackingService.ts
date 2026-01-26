import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase, SUPABASE_ANON_KEY, SUPABASE_URL } from '../lib/supabase';
import 'react-native-get-random-values';
import { v4 as uuidv4 } from 'uuid';

// Storage keys
const EVENTS_KEY = '@engniter.engagement.events';
const USER_ID_KEY = '@engniter.engagement.userId';

// Session timeout: 60 seconds
const SESSION_TIMEOUT_MS = 60 * 1000;

// Max local storage (keep small to prevent lag)
const MAX_LOCAL_EVENTS = 100;

// Sync every N events while app is active (in addition to background sync)
const SYNC_EVERY_N_EVENTS = 50;

// Time-based batching: sync every 60 seconds
const SYNC_INTERVAL_MS = 60 * 1000;

export interface EngagementEvent {
  event_id: string;
  user_id: string;
  user_email: string | null;
  session_id: string;
  event_name: string;
  screen_name: string | null;
  timestamp: string;
  metadata?: Record<string, any>;
}

export type EventName =
  | 'app_open'
  | 'app_background'
  | 'app_close'
  | 'screen_view'
  | 'button_click'
  | 'exercise_start'
  | 'exercise_complete'
  | 'quiz_started'
  | 'quiz_completed'
  | 'word_saved'
  | 'word_deleted'
  | 'word_reviewed'
  | 'story_started'
  | 'story_completed'
  | 'level_started'
  | 'level_completed'
  | 'set_started'
  | 'set_completed';

class EngagementTrackingService {
  private userId: string | null = null;
  private userEmail: string | null = null;
  private sessionId: string | null = null;
  private lastEventTime = 0;
  private events: EngagementEvent[] = [];
  private initialized = false;
  private isSyncing = false;
  private eventsSinceLastSync = 0;
  private syncTimer: NodeJS.Timeout | null = null;
  private lastSyncTime = 0;

  /* ---------------- INIT ---------------- */

  async initialize(): Promise<void> {
    if (this.initialized) return;

    try {
      const storedUserId = await AsyncStorage.getItem(USER_ID_KEY);
      const { data: { session } } = await supabase.auth.getSession();

      if (session?.user?.id) {
        this.userId = session.user.id;
        this.userEmail = session.user.email || null;
        await AsyncStorage.setItem(USER_ID_KEY, this.userId);
        // Note: sync uses anon key, not user token, so no need to disable based on token size
      } else if (storedUserId) {
        this.userId = storedUserId;
      } else {
        this.userId = uuidv4();
        await AsyncStorage.setItem(USER_ID_KEY, this.userId);
      }

      const storedEvents = await AsyncStorage.getItem(EVENTS_KEY);
      if (storedEvents) {
        this.events = JSON.parse(storedEvents);
      }

      this.initialized = true;
      console.log('[Engagement] Initialized with user_id:', this.userId);

      // Start time-based sync timer if we have pending events
      if (this.events.length > 0) {
        this.startSyncTimer();
      }
    } catch (e) {
      console.warn('[Engagement] Init failed:', e);
    }
  }

  /* ---------------- TIMER ---------------- */

  private startSyncTimer() {
    // Don't start a new timer if one is already running
    if (this.syncTimer) return;

    this.syncTimer = setTimeout(() => {
      this.syncTimer = null;
      if (this.events.length > 0) {
        this.syncToRemote();
      }
    }, SYNC_INTERVAL_MS);
  }

  private stopSyncTimer() {
    if (this.syncTimer) {
      clearTimeout(this.syncTimer);
      this.syncTimer = null;
    }
  }

  /* ---------------- SESSION ---------------- */

  private startSession() {
    this.sessionId = uuidv4();
    this.lastEventTime = Date.now();
    console.log('[Engagement] New session started:', this.sessionId);
  }

  private endSession() {
    this.sessionId = null;
    console.log('[Engagement] Session ended');
  }

  private ensureSession() {
    const now = Date.now();

    if (!this.sessionId || now - this.lastEventTime > SESSION_TIMEOUT_MS) {
      this.startSession();
    }

    this.lastEventTime = now;
  }

  /* ---------------- TRACKING ---------------- */

  async trackEvent(
    eventName: EventName,
    screenName: string | null = null,
    metadata?: Record<string, any>
  ): Promise<void> {
    if (!this.initialized) {
      await this.initialize();
    }

    if (eventName === 'app_open') {
      this.startSession();
      // Sync any pending events from previous session on app open
      if (this.events.length > 0) {
        this.syncToRemote();
      }
    } else if (eventName !== 'app_background' && eventName !== 'app_close') {
      this.ensureSession();
    }

    if (!this.userId || !this.sessionId) return;

    const event: EngagementEvent = {
      event_id: uuidv4(),
      user_id: this.userId,
      user_email: this.userEmail,
      session_id: this.sessionId,
      event_name: eventName,
      screen_name: screenName,
      timestamp: new Date().toISOString(),
      metadata,
    };

    this.events.push(event);
    this.events = this.events.slice(-MAX_LOCAL_EVENTS);
    this.eventsSinceLastSync++;

    // Don't await - save in background to prevent lag
    AsyncStorage.setItem(EVENTS_KEY, JSON.stringify(this.events)).catch(() => {});

    // Start timer for time-based batching (if not already running)
    if (this.events.length === 1) {
      this.startSyncTimer();
    }

    // Sync immediately on background/close OR when reaching batch size
    const shouldSyncNow =
      eventName === 'app_background' ||
      eventName === 'app_close' ||
      this.eventsSinceLastSync >= SYNC_EVERY_N_EVENTS;

    if (shouldSyncNow) {
      this.stopSyncTimer(); // Cancel timer since we're syncing now
      this.syncToRemote();
      if (eventName === 'app_background' || eventName === 'app_close') {
        this.endSession();
      }
    }
  }

  async trackScreenView(screen: string) {
    await this.trackEvent('screen_view', screen);
  }

  /* ---------------- SYNC ---------------- */

  private async syncToRemote(): Promise<void> {
    if (this.events.length === 0 || this.isSyncing) return;

    this.isSyncing = true;
    console.log('[Engagement] Starting batch sync of', this.events.length, 'events');

    // Normalize events - ensure all have same keys for Supabase bulk insert
    const eventsToSync = this.events.map(e => ({
      event_id: e.event_id,
      user_id: e.user_id,
      user_email: e.user_email ?? null,
      session_id: e.session_id,
      event_name: e.event_name,
      screen_name: e.screen_name ?? null,
      timestamp: e.timestamp,
      metadata: e.metadata ?? null,
    }));

    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 8_000);

      const response = await fetch(`${SUPABASE_URL}/rest/v1/engagement_events`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          apikey: SUPABASE_ANON_KEY,
          Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
          Prefer: 'resolution=merge-duplicates',
        },
        body: JSON.stringify(eventsToSync),
        signal: controller.signal,
      });

      clearTimeout(timeout);

      if (!response.ok) {
        const text = await response.text();
        console.warn('[Engagement] Sync failed:', response.status, text);
        return;
      }

      // Clear synced events to prevent duplicates and reduce storage
      this.events = [];
      this.eventsSinceLastSync = 0;
      this.lastSyncTime = Date.now();
      AsyncStorage.setItem(EVENTS_KEY, '[]').catch(() => {});

      console.log('[Engagement] Synced', eventsToSync.length, 'events (cleared local)');
    } catch (e: any) {
      if (e?.name === 'AbortError') {
        console.warn('[Engagement] Sync timed out');
      } else {
        console.warn('[Engagement] Sync error:', e);
      }
      // Keep events on failure - will retry next time
      // Restart timer to retry later
      if (this.events.length > 0) {
        this.startSyncTimer();
      }
    } finally {
      this.isSyncing = false;
    }
  }

  /* ---------------- LOGIN ---------------- */

  async onUserLogin(userId: string, email?: string) {
    this.userId = userId;
    this.userEmail = email || null;
    await AsyncStorage.setItem(USER_ID_KEY, userId);

    this.events = this.events.map(e => ({
      ...e,
      user_id: userId,
      user_email: email || null,
    }));

    await AsyncStorage.setItem(EVENTS_KEY, JSON.stringify(this.events));
    console.log('[Engagement] Migrated events to logged-in user');
  }
}

export const engagementTrackingService = new EngagementTrackingService();
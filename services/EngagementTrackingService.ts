import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase, SUPABASE_ANON_KEY, SUPABASE_URL, isTokenOversized } from '../lib/supabase';
import 'react-native-get-random-values';
import { v4 as uuidv4 } from 'uuid';

// Storage keys
const EVENTS_KEY = '@engniter.engagement.events';
const USER_ID_KEY = '@engniter.engagement.userId';

// Session timeout: 60 seconds
const SESSION_TIMEOUT_MS = 60 * 1000;

// Max local storage
const MAX_LOCAL_EVENTS = 1000;

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
  private syncDisabled = false;

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

        if (session.access_token && isTokenOversized(session.access_token)) {
          console.warn('[Engagement] Oversized token → remote sync disabled');
          this.syncDisabled = true;
        }
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
    } catch (e) {
      console.warn('[Engagement] Init failed:', e);
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

    await AsyncStorage.setItem(EVENTS_KEY, JSON.stringify(this.events));

    console.log('[Engagement] Event tracked:', eventName, screenName);

    // 🔥 ONLY sync when app leaves foreground
    if (eventName === 'app_background' || eventName === 'app_close') {
      await this.syncToRemote();
      this.endSession();
    }
  }

  async trackScreenView(screen: string) {
    await this.trackEvent('screen_view', screen);
  }

  /* ---------------- SYNC ---------------- */

  private async syncToRemote(): Promise<void> {
    if (this.syncDisabled || this.events.length === 0) return;

    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 10_000);

      const response = await fetch(`${SUPABASE_URL}/rest/v1/engagement_events`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          apikey: SUPABASE_ANON_KEY,
          Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
          Prefer: 'resolution=merge-duplicates',
        },
        body: JSON.stringify(this.events),
        signal: controller.signal,
      });

      clearTimeout(timeout);

      if (!response.ok) {
        const text = await response.text();
        console.warn('[Engagement] Sync failed:', response.status, text);
        return;
      }

      console.log('[Engagement] Synced', this.events.length, 'events');
    } catch (e: any) {
      if (e?.name === 'AbortError') {
        console.warn('[Engagement] Sync timed out');
      } else {
        console.warn('[Engagement] Sync error:', e);
      }
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
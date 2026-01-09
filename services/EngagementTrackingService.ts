import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase } from '../lib/supabase';
import 'react-native-get-random-values';
import { v4 as uuidv4 } from 'uuid';

// Storage keys
const EVENTS_KEY = '@engniter.engagement.events';
const USER_ID_KEY = '@engniter.engagement.userId';
const SESSION_ID_KEY = '@engniter.engagement.sessionId';

// Session timeout: 60 seconds of inactivity
const SESSION_TIMEOUT_MS = 60 * 1000;

// Max time per screen (cap for analysis)
const MAX_SCREEN_TIME_MS = 5 * 60 * 1000; // 5 minutes

export interface EngagementEvent {
  event_id: string;
  user_id: string;
  user_email: string | null;
  session_id: string;
  event_name: string;
  screen_name: string | null;
  timestamp: string; // ISO string
  metadata?: Record<string, any>;
}

export type EventName =
  | 'app_open'
  | 'app_background'
  | 'app_close'
  | 'screen_view'
  | 'button_click'
  // Exercise events
  | 'exercise_start'
  | 'exercise_complete'
  | 'quiz_started'
  | 'quiz_completed'
  // Word events
  | 'word_saved'
  | 'word_deleted'
  | 'word_reviewed'
  // Story events
  | 'story_started'
  | 'story_completed'
  // Learning events
  | 'level_started'
  | 'level_completed'
  | 'set_started'
  | 'set_completed';

class EngagementTrackingService {
  private userId: string | null = null;
  private userEmail: string | null = null;
  private sessionId: string | null = null;
  private lastEventTime: number = 0;
  private events: EngagementEvent[] = [];
  private initialized = false;
  private syncInProgress = false;

  /**
   * Initialize the tracking service
   * - Loads or creates user_id
   * - Starts a new session
   */
  async initialize(): Promise<void> {
    if (this.initialized) return;

    try {
      // Load or create user_id
      let storedUserId = await AsyncStorage.getItem(USER_ID_KEY);

      // Check if user is logged in via Supabase
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user?.id) {
        // Use Supabase user ID and email if logged in
        this.userId = session.user.id;
        this.userEmail = session.user.email || null;
        await AsyncStorage.setItem(USER_ID_KEY, this.userId);
      } else if (storedUserId) {
        // Use stored anonymous ID
        this.userId = storedUserId;
        this.userEmail = null;
      } else {
        // Create new anonymous ID
        this.userId = uuidv4();
        this.userEmail = null;
        await AsyncStorage.setItem(USER_ID_KEY, this.userId);
      }

      // Load cached events
      const storedEvents = await AsyncStorage.getItem(EVENTS_KEY);
      if (storedEvents) {
        this.events = JSON.parse(storedEvents);
      }

      this.initialized = true;
      console.log('[Engagement] Initialized with user_id:', this.userId);
    } catch (e) {
      console.warn('[Engagement] Failed to initialize:', e);
    }
  }

  /**
   * Start a new session
   * Called on app_open
   */
  startSession(): void {
    this.sessionId = uuidv4();
    this.lastEventTime = Date.now();
    console.log('[Engagement] New session started:', this.sessionId);
  }

  /**
   * End current session
   * Called on app_background or app_close
   */
  endSession(): void {
    this.sessionId = null;
    console.log('[Engagement] Session ended');
  }

  /**
   * Check if session has timed out and start new one if needed
   */
  private checkSessionTimeout(): void {
    const now = Date.now();
    if (this.sessionId && (now - this.lastEventTime) > SESSION_TIMEOUT_MS) {
      // Session timed out, start new one
      console.log('[Engagement] Session timed out, starting new one');
      this.startSession();
    } else if (!this.sessionId) {
      // No active session, start one
      this.startSession();
    }
    this.lastEventTime = now;
  }

  /**
   * Track an event
   */
  async trackEvent(
    eventName: EventName,
    screenName: string | null = null,
    metadata?: Record<string, any>
  ): Promise<void> {
    if (!this.initialized) {
      await this.initialize();
    }

    // Handle session lifecycle
    if (eventName === 'app_open') {
      this.startSession();
    } else if (eventName === 'app_background' || eventName === 'app_close') {
      // Track the event first, then end session
    } else {
      this.checkSessionTimeout();
    }

    if (!this.userId || !this.sessionId) {
      console.warn('[Engagement] Cannot track event without user_id or session_id');
      return;
    }

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
    console.log('[Engagement] Event tracked:', eventName, screenName);

    // Save locally
    await this.saveLocally();

    // End session after tracking background/close
    if (eventName === 'app_background' || eventName === 'app_close') {
      this.endSession();
    }

    // Try to sync to remote (non-blocking)
    this.syncToRemote();
  }

  /**
   * Convenience method for tracking screen views
   */
  async trackScreenView(screenName: string): Promise<void> {
    await this.trackEvent('screen_view', screenName);
  }

  /**
   * Save events locally
   */
  private async saveLocally(): Promise<void> {
    try {
      // Keep only last 1000 events locally to prevent storage bloat
      const eventsToSave = this.events.slice(-1000);
      await AsyncStorage.setItem(EVENTS_KEY, JSON.stringify(eventsToSave));
    } catch (e) {
      console.warn('[Engagement] Failed to save locally:', e);
    }
  }

  /**
   * Sync events to Supabase
   * Events are inserted into the 'engagement_events' table
   */
  private async syncToRemote(): Promise<void> {
    if (this.syncInProgress || this.events.length === 0) return;
    this.syncInProgress = true;

    try {
      // Get events that haven't been synced (last 50)
      const eventsToSync = this.events.slice(-50);

      const { error } = await supabase
        .from('engagement_events')
        .upsert(eventsToSync, { onConflict: 'event_id' });

      if (error) {
        // Table might not exist yet - that's okay, events are stored locally
        if (!error.message?.includes('does not exist')) {
          console.warn('[Engagement] Sync error:', error.message);
        }
      } else {
        console.log('[Engagement] Synced', eventsToSync.length, 'events');
      }
    } catch (e) {
      // Offline or network error - events are stored locally
      console.warn('[Engagement] Sync failed (offline?):', e);
    } finally {
      this.syncInProgress = false;
    }
  }

  /**
   * Get current user ID
   */
  getUserId(): string | null {
    return this.userId;
  }

  /**
   * Get current session ID
   */
  getSessionId(): string | null {
    return this.sessionId;
  }

  /**
   * Get all stored events (for analysis)
   */
  getEvents(): EngagementEvent[] {
    return [...this.events];
  }

  /**
   * Calculate time spent per screen from events
   */
  getTimePerScreen(): Record<string, number> {
    const timePerScreen: Record<string, number> = {};

    for (let i = 0; i < this.events.length - 1; i++) {
      const current = this.events[i];
      const next = this.events[i + 1];

      if (current.event_name === 'screen_view' && current.screen_name) {
        const duration = new Date(next.timestamp).getTime() - new Date(current.timestamp).getTime();
        // Cap at max screen time
        const cappedDuration = Math.min(duration, MAX_SCREEN_TIME_MS);

        if (cappedDuration > 0) {
          timePerScreen[current.screen_name] = (timePerScreen[current.screen_name] || 0) + cappedDuration;
        }
      }
    }

    return timePerScreen;
  }

  /**
   * Get quit points (last screen before app_background/app_close)
   */
  getQuitPoints(): Record<string, number> {
    const quitPoints: Record<string, number> = {};

    for (let i = 0; i < this.events.length; i++) {
      const event = this.events[i];

      if (event.event_name === 'app_background' || event.event_name === 'app_close') {
        // Find the last screen_view before this event in the same session
        for (let j = i - 1; j >= 0; j--) {
          const prev = this.events[j];
          if (prev.session_id !== event.session_id) break;

          if (prev.event_name === 'screen_view' && prev.screen_name) {
            quitPoints[prev.screen_name] = (quitPoints[prev.screen_name] || 0) + 1;
            break;
          }
        }
      }
    }

    return quitPoints;
  }

  /**
   * Get session durations
   */
  getSessionDurations(): Array<{ session_id: string; duration_ms: number; event_count: number }> {
    const sessions: Record<string, { events: EngagementEvent[] }> = {};

    for (const event of this.events) {
      if (!sessions[event.session_id]) {
        sessions[event.session_id] = { events: [] };
      }
      sessions[event.session_id].events.push(event);
    }

    return Object.entries(sessions).map(([session_id, data]) => {
      const events = data.events.sort((a, b) =>
        new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
      );

      if (events.length < 2) {
        return { session_id, duration_ms: 0, event_count: events.length };
      }

      const firstTime = new Date(events[0].timestamp).getTime();
      const lastTime = new Date(events[events.length - 1].timestamp).getTime();

      return {
        session_id,
        duration_ms: lastTime - firstTime,
        event_count: events.length,
      };
    });
  }

  /**
   * Get engagement summary
   */
  getSummary(): {
    totalSessions: number;
    avgSessionDuration: number;
    totalTimeSpent: number;
    topQuitScreens: Array<{ screen: string; count: number }>;
    timePerScreen: Record<string, number>;
  } {
    const sessionDurations = this.getSessionDurations();
    const quitPoints = this.getQuitPoints();
    const timePerScreen = this.getTimePerScreen();

    const totalSessions = sessionDurations.length;
    const totalTimeSpent = sessionDurations.reduce((sum, s) => sum + s.duration_ms, 0);
    const avgSessionDuration = totalSessions > 0 ? totalTimeSpent / totalSessions : 0;

    const topQuitScreens = Object.entries(quitPoints)
      .map(([screen, count]) => ({ screen, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);

    return {
      totalSessions,
      avgSessionDuration,
      totalTimeSpent,
      topQuitScreens,
      timePerScreen,
    };
  }

  /**
   * Clear all tracking data (for privacy/opt-out)
   */
  async clearData(): Promise<void> {
    this.events = [];
    this.sessionId = null;
    await AsyncStorage.multiRemove([EVENTS_KEY, SESSION_ID_KEY]);
    console.log('[Engagement] Data cleared');
  }

  /**
   * Update user ID and email when user logs in
   */
  async onUserLogin(supabaseUserId: string, email?: string): Promise<void> {
    const oldUserId = this.userId;
    this.userId = supabaseUserId;
    this.userEmail = email || null;
    await AsyncStorage.setItem(USER_ID_KEY, supabaseUserId);

    // Optionally: migrate events from anonymous ID to logged-in ID
    if (oldUserId && oldUserId !== supabaseUserId) {
      this.events = this.events.map(e => ({
        ...e,
        user_id: supabaseUserId,
        user_email: email || null,
      }));
      await this.saveLocally();
      console.log('[Engagement] Migrated events to logged-in user');
    }
  }
}

export const engagementTrackingService = new EngagementTrackingService();

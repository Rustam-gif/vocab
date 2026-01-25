import React, { useEffect, useRef, useState } from 'react';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { RouterProvider, RouteRenderer } from './lib/router';
import LottieView from 'lottie-react-native';
import { View, StyleSheet, Platform, TextInput, AppState, AppStateStatus, InteractionManager, Keyboard, Dimensions } from 'react-native';
import { useAppStore } from './lib/store';
import { getTheme, ThemeName } from './lib/theme';
import { Launch } from './lib/launch';
import NotificationService from './services/NotificationService';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { debouncedStorage } from './lib/debouncedStorage';
import { engagementTrackingService } from './services/EngagementTrackingService';
import { AppReadyProvider } from './lib/AppReadyContext';
import { TextInputGateProvider } from './lib/TextInputGate';
import { soundService } from './services/SoundService';
import { newsPrefetchService } from './services/NewsPrefetchService';
import { premiumStatusService } from './services/PremiumStatusService';
import PersonalizedOnboarding from './components/PersonalizedOnboarding';

// CRITICAL: Workaround for iOS UIEmojiSearchOperations deadlock
// iOS's keyboard session can become corrupted if a TextInput is destroyed during keyboard transition.
// This can cause the UI thread to deadlock while JS remains alive.
// We defensively dismiss the keyboard when the app becomes active to clear any stale sessions.
if (Platform.OS === 'ios') {
  let lastActiveTime = 0;
  AppState.addEventListener('change', (state) => {
    if (state === 'active') {
      const now = Date.now();
      // If returning from background after more than 100ms, dismiss keyboard to clear stale sessions
      if (now - lastActiveTime > 100) {
        Keyboard.dismiss();
      }
      lastActiveTime = now;
    }
  });
}

console.log('=== APP.TSX MODULE LOADED ===');

// NOTE: Do NOT mutate TextInput.defaultProps globally.
// This corrupts iOS RTIInputSystemClient keyboard sessions, causing UI thread deadlock.
// Apply keyboardAppearance per-component instead.

export default function App() {
  const themeName = useAppStore(s => s.theme);
  const [prefsLoaded, setPrefsLoaded] = useState(false);
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [onboardingChecked, setOnboardingChecked] = useState(false);

  // Extra safety: dismiss any phantom keyboard session a few seconds after launch
  useEffect(() => {
    if (Platform.OS !== 'ios') return;
    const timer = setTimeout(() => {
      try {
        Keyboard.dismiss();
        console.log('=== SAFETY DISMISS AFTER LAUNCH ===');
      } catch {}
    }, 2500);
    return () => clearTimeout(timer);
  }, []);

  // Initialize sound service
  useEffect(() => {
    soundService.initialize().catch((e) => {
      console.warn('[App] Failed to initialize sounds:', e);
    });
  }, []);

  // Load persisted settings on startup BEFORE rendering
  useEffect(() => {
    const loadSettings = async () => {
      console.log('=== LOADING SETTINGS FROM ASYNCSTORAGE ===');
      try {
        const [themeResult, langsResult, onboardingResult] = await AsyncStorage.multiGet([
          '@engniter.theme',
          '@engniter.langs',
          '@engniter.onboarding.completed',
        ]);
        const savedTheme = themeResult[1];
        const savedLangs = langsResult[1];
        const onboardingCompleted = onboardingResult[1] === 'true';
        console.log('=== LOADED FROM STORAGE === theme:', savedTheme, 'langs:', savedLangs, 'onboarding:', onboardingCompleted);

        if (savedTheme === 'light' || savedTheme === 'dark') {
          const currentTheme = useAppStore.getState().theme;
          if (savedTheme !== currentTheme) {
            console.log('=== APPLYING SAVED THEME ===', savedTheme);
            useAppStore.setState({ theme: savedTheme as ThemeName });
          }
        }

        if (savedLangs) {
          try {
            const langs = JSON.parse(savedLangs);
            if (Array.isArray(langs) && langs.length > 0) {
              console.log('=== APPLYING SAVED LANGS ===', langs);
              useAppStore.setState({ languagePreferences: langs });
            }
          } catch {}
        }

        // Show onboarding if not completed
        if (!onboardingCompleted) {
          setShowOnboarding(true);
        }
        setOnboardingChecked(true);
      } catch (e) {
        console.error('=== FAILED TO LOAD SETTINGS ===', e);
        setOnboardingChecked(true);
      }
      setPrefsLoaded(true);
    };
    loadSettings();

    // Initialize engagement tracking and track app_open
    engagementTrackingService.initialize().then(() => {
      engagementTrackingService.trackEvent('app_open');

      // Prefetch news in background on app launch
      newsPrefetchService.prefetchIfNeeded().catch((e) => {
        console.log('[App] News prefetch error:', e);
      });

      // Prefetch premium status in background on app launch
      premiumStatusService.prefetchIfNeeded().then((status) => {
        // Update store with refreshed status
        if (status !== undefined) {
          useAppStore.getState().loadPremiumStatus();
        }
      }).catch((e) => {
        console.log('[App] Premium status prefetch error:', e);
      });
    });
  }, []);

  // Save settings and flush caches when app goes to background
  // This ensures SQLite WAL checkpoints before force-close
  const appStateRef = useRef(AppState.currentState);
  useEffect(() => {
    const handleAppStateChange = async (nextState: AppStateStatus) => {
      const previousState = appStateRef.current;
      appStateRef.current = nextState;

      // Track app_background when going to background
      if (nextState === 'background' || nextState === 'inactive') {
        engagementTrackingService.trackEvent('app_background');

        const { theme, languagePreferences } = useAppStore.getState();
        console.log('=== SAVING ON BACKGROUND ===', { theme, languagePreferences });
        try {
          // Flush all pending debounced writes first
          await debouncedStorage.flush();
          console.log('=== DEBOUNCED STORAGE FLUSHED ===');

          // Save settings
          await AsyncStorage.multiSet([
            ['@engniter.theme', theme],
            ['@engniter.langs', JSON.stringify(languagePreferences || [])],
          ]);
          // Force read of news cache keys to trigger SQLite checkpoint
          await AsyncStorage.multiGet([
            '@engniter.news.payload',
            '@engniter.news.lastFetchedAt',
            '@engniter.productivity.articles.v3',
          ]);
          console.log('=== ALL DATA FLUSHED ON BACKGROUND ===');
        } catch (e) {
          console.error('=== FAILED TO SAVE ON BACKGROUND ===', e);
        }
      }

      // Track app_open when returning from background
      if (nextState === 'active' && (previousState === 'background' || previousState === 'inactive')) {
        engagementTrackingService.trackEvent('app_open');
      }
    };

    const subscription = AppState.addEventListener('change', handleAppStateChange);
    return () => subscription?.remove();
  }, []);
  const colors = getTheme(themeName);
  const [showLaunch, setShowLaunch] = useState(true);
  const launchRef = useRef<LottieView>(null);
  const fallbackTimerRef = useRef<NodeJS.Timeout | null>(null);
  const fastTimerRef = useRef<NodeJS.Timeout | null>(null);
  const finishedRef = useRef(false);

  // Fast safety: hide overlay shortly after mount even if the animation never fires
  useEffect(() => {
    fastTimerRef.current = setTimeout(() => {
      if (finishedRef.current) return;
      finishedRef.current = true;
      setShowLaunch(false);
      try { Launch.markDone(); } catch {}
    }, 3000) as any;
    return () => { if (fastTimerRef.current) clearTimeout(fastTimerRef.current); };
  }, []);

  // Fallback: hide overlay if animation never finishes (e.g., 8s)
  useEffect(() => {
    fallbackTimerRef.current = setTimeout(() => {
      setShowLaunch(false);
      if (!finishedRef.current) {
        finishedRef.current = true;
        try { Launch.markDone(); } catch {}
      }
    }, 8000) as any;
    return () => { if (fallbackTimerRef.current) clearTimeout(fallbackTimerRef.current); };
  }, []);

  // Initialize notifications (2x daily by default: 10:00 and 19:00)
  useEffect(() => {
    NotificationService.initialize().catch(() => {});
  }, []);


  // Handle onboarding completion
  const handleOnboardingComplete = () => {
    setShowOnboarding(false);
  };

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider
        initialMetrics={{
          insets: { top: 59, bottom: 34, left: 0, right: 0 },
          frame: { x: 0, y: 0, width: Dimensions.get('window').width, height: Dimensions.get('window').height },
        }}
      >
        <TextInputGateProvider>
          <AppReadyProvider>
            <RouterProvider>
              <RouteRenderer />
            {/* No custom keyboard accessory; use native keyboard UI */}

            {/* Personalized Onboarding overlay - shows after launch animation */}
            {!showLaunch && onboardingChecked && showOnboarding && (
              <View style={styles.onboardingOverlay}>
                <PersonalizedOnboarding onComplete={handleOnboardingComplete} />
              </View>
            )}

            {/* Launch animation overlay */}
            {showLaunch && (
              <View
                style={[styles.launchOverlay, themeName === 'light' && { backgroundColor: colors.background }]}
                pointerEvents="none"
              >
                <LottieView
                  ref={launchRef}
                  source={require('./assets/lottie/launch.json')}
                  autoPlay
                  loop={false}
                  speed={0.7}
                  onError={() => {
                    if (finishedRef.current) return;
                    finishedRef.current = true;
                    setShowLaunch(false);
                    try { Launch.markDone(); } catch {}
                  }}
                  onAnimationFinish={() => {
                    if (finishedRef.current) return;
                    finishedRef.current = true;
                    if (fallbackTimerRef.current) clearTimeout(fallbackTimerRef.current);
                    setTimeout(() => {
                      setShowLaunch(false);
                      try { Launch.markDone(); } catch {}
                    }, 2000);
                  }}
                  style={styles.launchLottie}
                />
              </View>
            )}

            </RouterProvider>
          </AppReadyProvider>
        </TextInputGateProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  launchOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: '#0D1B2A',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 9999,
  },
  launchLottie: {
    width: 220,
    height: 220,
  },
  onboardingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 9998,
  },
});

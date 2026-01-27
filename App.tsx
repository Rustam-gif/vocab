import React, { useEffect, useRef, useState } from 'react';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { RouterProvider, RouteRenderer } from './lib/router';
import LottieView from 'lottie-react-native';
import { View, Text, StyleSheet, Platform, TextInput, AppState, AppStateStatus, InteractionManager, Keyboard, Dimensions, Animated } from 'react-native';
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
  const launchFadeAnim = useRef(new Animated.Value(0)).current;
  const textBrightnessAnim = useRef(new Animated.Value(0)).current;

  // Create animated values for stars (20 stars)
  const starAnims = useRef(
    Array.from({ length: 20 }, () => new Animated.Value(0))
  ).current;

  // Generate random star positions once
  const stars = useRef(
    Array.from({ length: 20 }, () => ({
      size: 2 + Math.random() * 3,
      top: Math.random() * Dimensions.get('window').height,
      left: Math.random() * Dimensions.get('window').width,
    }))
  ).current;

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
  const hasVerifiedOnStartup = useRef(false);

  // Verify subscription on initial app startup (cold start)
  useEffect(() => {
    const verifyOnStartup = async () => {
      if (hasVerifiedOnStartup.current) return;
      hasVerifiedOnStartup.current = true;

      // Wait a bit for app to fully initialize
      await new Promise(resolve => setTimeout(resolve, 1000));

      try {
        const SubscriptionService = require('./services/SubscriptionService').default;
        const { premiumStatusService } = require('./services/PremiumStatusService');
        const { DeviceEventEmitter } = require('react-native');

        console.log('[App] Verifying subscription on startup...');
        const status = await SubscriptionService.verifySubscription();
        console.log('[App] Subscription verified on startup:', status.active ? 'Premium' : 'Free');

        // Update premium status cache and store
        await premiumStatusService.refresh();
        await useAppStore.getState().refreshPremiumStatus();

        // Notify all screens
        DeviceEventEmitter.emit('PREMIUM_STATUS_CHANGED', status.active);
      } catch (e) {
        console.error('[App] Failed to verify subscription on startup:', e);
      }
    };

    verifyOnStartup();
  }, []);

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

        // Verify subscription status with App Store/Play Store
        // This ensures expired subscriptions are detected and premium access is revoked
        // Note: SubscriptionService handles simulator detection internally
        try {
          const SubscriptionService = require('./services/SubscriptionService').default;
          const { premiumStatusService } = require('./services/PremiumStatusService');
          const { DeviceEventEmitter } = require('react-native');

          const previousStatus = useAppStore.getState().premiumStatus;
          const status = await SubscriptionService.verifySubscription();
          console.log('[App] Subscription verified on foreground:', status.active ? 'Premium' : 'Free');

          // Update premium status cache and store
          await premiumStatusService.refresh();
          await useAppStore.getState().refreshPremiumStatus();

          // Notify all screens if status changed
          if (previousStatus !== status.active) {
            console.log(`[App] Subscription status changed: ${previousStatus ? 'Premium' : 'Free'} → ${status.active ? 'Premium' : 'Free'}`);
            DeviceEventEmitter.emit('PREMIUM_STATUS_CHANGED', status.active);
          }
        } catch (e) {
          console.error('[App] Failed to verify subscription on foreground:', e);
        }
      }
    };

    const subscription = AppState.addEventListener('change', handleAppStateChange);
    return () => subscription?.remove();
  }, []);
  const colors = getTheme(themeName);
  const [showLaunch, setShowLaunch] = useState(true);
  const [appReady, setAppReady] = useState(false);
  const launchRef = useRef<LottieView>(null);
  const fallbackTimerRef = useRef<NodeJS.Timeout | null>(null);
  const fastTimerRef = useRef<NodeJS.Timeout | null>(null);
  const finishedRef = useRef(false);

  // Delay app content rendering to prevent flash before launch animation
  useEffect(() => {
    const timer = setTimeout(() => {
      setAppReady(true);
    }, 300); // Small delay to ensure launch overlay renders first
    return () => clearTimeout(timer);
  }, []);

  // Fade in the launch screen on mount
  useEffect(() => {
    Animated.timing(launchFadeAnim, {
      toValue: 1,
      duration: 400,
      useNativeDriver: true,
    }).start();
  }, [launchFadeAnim]);

  // Light up the Stellar text immediately
  useEffect(() => {
    Animated.timing(textBrightnessAnim, {
      toValue: 1,
      duration: 800,
      useNativeDriver: false,
    }).start();
  }, [textBrightnessAnim]);

  // Animate stars with twinkling effect
  useEffect(() => {
    starAnims.forEach((anim) => {
      const animate = () => {
        Animated.sequence([
          Animated.timing(anim, {
            toValue: 1,
            duration: 1000 + Math.random() * 1000,
            useNativeDriver: true,
          }),
          Animated.timing(anim, {
            toValue: 0.3,
            duration: 1000 + Math.random() * 1000,
            useNativeDriver: true,
          }),
        ]).start(() => animate());
      };

      // Start each star with a random delay
      setTimeout(() => animate(), Math.random() * 2000);
    });
  }, [starAnims]);

  // Auto-close launch screen after 2 seconds with fade-out
  useEffect(() => {
    fastTimerRef.current = setTimeout(() => {
      if (finishedRef.current) return;
      finishedRef.current = true;

      // Fade out before closing
      Animated.timing(launchFadeAnim, {
        toValue: 0,
        duration: 400,
        useNativeDriver: true,
      }).start(() => {
        setShowLaunch(false);
        try { Launch.markDone(); } catch {}
      });
    }, 2000) as any;
    return () => { if (fastTimerRef.current) clearTimeout(fastTimerRef.current); };
  }, [launchFadeAnim]);

  // Fallback: hide overlay if animation never finishes (e.g., 4s)
  useEffect(() => {
    fallbackTimerRef.current = setTimeout(() => {
      if (!finishedRef.current) {
        finishedRef.current = true;

        // Fade out before closing
        Animated.timing(launchFadeAnim, {
          toValue: 0,
          duration: 400,
          useNativeDriver: true,
        }).start(() => {
          setShowLaunch(false);
          try { Launch.markDone(); } catch {}
        });
      }
    }, 4000) as any;
    return () => { if (fallbackTimerRef.current) clearTimeout(fallbackTimerRef.current); };
  }, [launchFadeAnim]);

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
              {/* Render app content only after small delay to prevent flash */}
              {appReady ? (
                <RouteRenderer />
              ) : (
                <View style={{ flex: 1, backgroundColor: colors.background }} />
              )}
            {/* No custom keyboard accessory; use native keyboard UI */}

            {/* Personalized Onboarding overlay - shows after launch animation */}
            {!showLaunch && onboardingChecked && showOnboarding && (
              <View style={styles.onboardingOverlay}>
                <PersonalizedOnboarding onComplete={handleOnboardingComplete} />
              </View>
            )}

            {/* Launch animation overlay */}
            {showLaunch && (
              <Animated.View
                style={[
                  styles.launchOverlay,
                  {
                    opacity: launchFadeAnim,
                    transform: [
                      {
                        translateY: launchFadeAnim.interpolate({
                          inputRange: [0, 1],
                          outputRange: [20, 0],
                        }),
                      },
                    ],
                  },
                ]}
                pointerEvents="none"
              >
                {/* Animated stars background */}
                {starAnims.map((anim, index) => {
                  const star = stars[index];
                  return (
                    <Animated.View
                      key={index}
                      style={{
                        position: 'absolute',
                        top: star.top,
                        left: star.left,
                        width: star.size,
                        height: star.size,
                        borderRadius: star.size / 2,
                        backgroundColor: '#FFFFFF',
                        opacity: anim,
                      }}
                    />
                  );
                })}

                {/* UFO Animation with moving lines */}
                <LottieView
                  key="launch-ufo-animation"
                  ref={launchRef}
                  source={require('./assets/lottie/Onboarding/race_ufo.json')}
                  autoPlay={true}
                  loop={false}
                  speed={1}
                  resizeMode="contain"
                  __bypassGate={true}
                  __gateMode="none"
                  onError={(error) => {
                    console.log('Lottie error:', error);
                    if (finishedRef.current) return;
                    finishedRef.current = true;
                    setShowLaunch(false);
                    try { Launch.markDone(); } catch {}
                  }}
                  style={styles.launchUfo}
                />

                {/* Stellar Text with glow effect - starts dark and lights up */}
                <View style={styles.stellarTextContainer}>
                  <Animated.Text
                    style={[
                      styles.stellarText,
                      {
                        color: textBrightnessAnim.interpolate({
                          inputRange: [0, 1],
                          outputRange: ['#1A1A2E', '#FFFFFF'],
                        }),
                        textShadowColor: textBrightnessAnim.interpolate({
                          inputRange: [0, 1],
                          outputRange: ['rgba(78, 217, 203, 0)', 'rgba(78, 217, 203, 0.25)'],
                        }),
                      },
                    ]}
                  >
                    Stellar
                  </Animated.Text>
                </View>
              </Animated.View>
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
  launchUfo: {
    width: 280,
    height: 280,
    marginBottom: -20,
  },
  stellarTextContainer: {
    padding: 20,
  },
  stellarText: {
    fontSize: 46,
    fontWeight: '700',
    fontFamily: 'Feather-Bold',
    letterSpacing: 4,
    textTransform: 'uppercase',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 12,
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

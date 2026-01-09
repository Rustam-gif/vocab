import React, { useEffect, useRef, useState } from 'react';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { RouterProvider, RouteRenderer } from './lib/router';
import LottieView from 'lottie-react-native';
import { View, StyleSheet, Platform, TextInput, AppState, AppStateStatus } from 'react-native';
import { useAppStore } from './lib/store';
import { getTheme, ThemeName } from './lib/theme';
import { Launch } from './lib/launch';
import NotificationService from './services/NotificationService';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { engagementTrackingService } from './services/EngagementTrackingService';

console.log('=== APP.TSX MODULE LOADED ===');

export default function App() {
  const themeName = useAppStore(s => s.theme);
  const [prefsLoaded, setPrefsLoaded] = useState(false);

  // Load persisted settings on startup BEFORE rendering
  useEffect(() => {
    const loadSettings = async () => {
      console.log('=== LOADING SETTINGS FROM ASYNCSTORAGE ===');
      try {
        const [themeResult, langsResult] = await AsyncStorage.multiGet(['@engniter.theme', '@engniter.langs']);
        const savedTheme = themeResult[1];
        const savedLangs = langsResult[1];
        console.log('=== LOADED FROM STORAGE === theme:', savedTheme, 'langs:', savedLangs);

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
      } catch (e) {
        console.error('=== FAILED TO LOAD SETTINGS ===', e);
      }
      setPrefsLoaded(true);
    };
    loadSettings();

    // Initialize engagement tracking and track app_open
    engagementTrackingService.initialize().then(() => {
      engagementTrackingService.trackEvent('app_open');
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

  // Schedule daily streak reminder at 7 PM local time
  useEffect(() => {
    NotificationService.ensureDailyReminder(19, 0).catch(() => {});
  }, []);


  return (
    <SafeAreaProvider>
      <RouterProvider>
        <RouteRenderer />
        {/* No custom keyboard accessory; use native keyboard UI */}
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
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  launchOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: '#121415',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 9999,
  },
  launchLottie: {
    width: 220,
    height: 220,
  },
  // (no keyboard accessory styles)
});

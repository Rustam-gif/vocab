import React, { useEffect, useRef, useState } from 'react';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { Text, TextInput, View, StyleSheet, InteractionManager } from 'react-native';
// Fonts are bundled locally from assets/fonts and linked via react-native.config.js
import { useAppStore } from '../lib/store';
import { getTheme } from '../lib/theme';
import LottieView from 'lottie-react-native';
import { Launch } from '../lib/launch';
import { usePathname } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { ThemeName } from '../lib/theme';

export default function RootLayout() {
  // No runtime font loading needed; fonts are available by name (e.g., 'Ubuntu-Regular').
  const themeName = useAppStore(s => s.theme);
  const languagePreferences = useAppStore(s => s.languagePreferences);
  const initializeApp = useAppStore(s => s.initialize);
  const setTheme = useAppStore(s => s.setTheme);
  const setLanguagePreferences = useAppStore(s => s.setLanguagePreferences);
  const [showLaunch, setShowLaunch] = useState(true);
  const launchRef = useRef<LottieView>(null);
  const fallbackTimerRef = useRef<NodeJS.Timeout | null>(null);
  const finishedRef = useRef(false);
  const [prefsHydrated, setPrefsHydrated] = useState(false);
  // Global short loading overlay on route changes
  const [routeLoading, setRouteLoading] = useState(false);
  const path = usePathname();
  const firstPathRef = useRef<string | null>(null);

  // Apply a global font family across the app after fonts load
  useEffect(() => {
    Text.defaultProps = Text.defaultProps || {};
    Text.defaultProps.style = [Text.defaultProps.style, { fontFamily: 'Ubuntu-Regular' }];

    TextInput.defaultProps = TextInput.defaultProps || {};
    TextInput.defaultProps.style = [TextInput.defaultProps.style, { fontFamily: 'Ubuntu-Regular' }];
    // Disable predictive text and auto-correction globally unless explicitly overridden
    if (TextInput.defaultProps.autoCorrect === undefined) TextInput.defaultProps.autoCorrect = false as any;
    if (TextInput.defaultProps.spellCheck === undefined) TextInput.defaultProps.spellCheck = false as any;
    if (TextInput.defaultProps.autoCapitalize === undefined) TextInput.defaultProps.autoCapitalize = 'none' as any;
    if (TextInput.defaultProps.autoComplete === undefined) TextInput.defaultProps.autoComplete = 'off' as any;
  }, []);

  // Initialize services (vault, analytics, progress) once on app start
  // Use InteractionManager to defer heavy work until after animations complete
  useEffect(() => {
    let cancelled = false;
    let interactionHandle: any;
    const hydratePrefsThenInit = async () => {
      try {
        const [storedTheme, storedLangs] = await AsyncStorage.multiGet(['@engniter.theme', '@engniter.langs']);
        const themeVal = storedTheme?.[1];
        const langsVal = storedLangs?.[1];
        if (!cancelled) {
          if (themeVal && (themeVal === 'light' || themeVal === 'dark') && themeVal !== themeName) {
            await setTheme(themeVal as ThemeName);
          }
          if (langsVal) {
            try {
              const parsed = JSON.parse(langsVal);
              if (Array.isArray(parsed) && JSON.stringify(parsed) !== JSON.stringify(languagePreferences)) {
                await setLanguagePreferences(parsed.filter((l: any) => typeof l === 'string'));
              }
            } catch {}
          }
        }
      } catch (err) {
        console.warn('[RootLayout] hydrate prefs failed', err);
      } finally {
        if (!cancelled) setPrefsHydrated(true);
      }

      interactionHandle = InteractionManager.runAfterInteractions(() => {
        initializeApp().catch(() => {});
      });
    };

    hydratePrefsThenInit();
    return () => {
      cancelled = true;
      if (interactionHandle) interactionHandle.cancel();
    };
  }, [initializeApp, languagePreferences, setLanguagePreferences, setTheme, themeName]);

  const initialSyncRef = useRef(false);
  useEffect(() => {
    if (initialSyncRef.current) return;
    initialSyncRef.current = true;
    let cancelled = false;
    const syncSettings = async () => {
      try {
        const storedTheme = await AsyncStorage.getItem('@engniter.theme');
        if (!cancelled && storedTheme && (storedTheme === 'light' || storedTheme === 'dark') && storedTheme !== themeName) {
          await setTheme(storedTheme as ThemeName);
        }
      } catch (error) {
        console.warn('[RootLayout] Failed to sync theme from storage', error);
      }
      try {
        const rawLangs = await AsyncStorage.getItem('@engniter.langs');
        if (cancelled || !rawLangs) return;
        const parsed = JSON.parse(rawLangs);
        if (!Array.isArray(parsed)) return;
        const currentLangs = useAppStore.getState().languagePreferences || [];
        const normalized = parsed.filter((l: any) => typeof l === 'string');
        const isEqual =
          normalized.length === currentLangs.length &&
          normalized.every((v, idx) => v === currentLangs[idx]);
        if (!isEqual) {
          await setLanguagePreferences(normalized);
        }
      } catch (error) {
        console.warn('[RootLayout] Failed to sync language preferences', error);
      }
    };
    syncSettings();
    return () => {
      cancelled = true;
    };
  }, [setTheme, setLanguagePreferences, themeName]);

  // Fallback: hide overlay if animation never finishes (e.g., 8s)
  useEffect(() => {
    fallbackTimerRef.current = setTimeout(() => setShowLaunch(false), 8000) as any;
    return () => { if (fallbackTimerRef.current) clearTimeout(fallbackTimerRef.current); };
  }, []);

  // Always persist latest prefs in case a caller forgot to write them.
  useEffect(() => {
    AsyncStorage.setItem('@engniter.theme', themeName).catch((err) => {
      console.warn('[RootLayout] failed to persist theme', err);
    });
  }, [themeName]);

  useEffect(() => {
    try {
      const payload = Array.isArray(languagePreferences) ? languagePreferences : [];
      AsyncStorage.setItem('@engniter.langs', JSON.stringify(payload)).catch((err) => {
        console.warn('[RootLayout] failed to persist langs', err);
      });
    } catch (err) {
      console.warn('[RootLayout] failed to serialize langs', err);
    }
  }, [languagePreferences]);

  // Show a brief loading overlay on some route changes (skip when navigating to or from Home)
  useEffect(() => {
    if (firstPathRef.current === null) {
      firstPathRef.current = path;
      return;
    }
    const prev = firstPathRef.current;
    firstPathRef.current = path;
    const skip = path === '/' || prev === '/';
    if (skip) return; // avoid dimming over Home to reduce perceived flicker
    setRouteLoading(true);
    const t = setTimeout(() => setRouteLoading(false), 380);
    return () => clearTimeout(t);
  }, [path]);

  return prefsHydrated ? (
    <>
      {/* Theme-aware status bar */}
      <StatusBar style={themeName === 'light' ? 'dark' : 'light'} />
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: getTheme(themeName).background },
          // Default: no transition animations across the app
          animation: 'none',
        }}
      >
        <Stack.Screen name="index" options={{ headerShown: false }} />
        <Stack.Screen name="vault" options={{ title: 'Vault' }} />
        <Stack.Screen name="vault-word" options={{ title: 'Word' }} />
        <Stack.Screen name="vault/word/[id]" options={{ title: 'Word' }} />
        <Stack.Screen name="quiz" options={{ headerShown: false }} />
        {/**
         * Story screens: slide in like a card so Home stays visible beneath
         * and is not reloaded when going back. We override the default
         * no-animation behavior only for this route.
         */}
        <Stack.Screen
          name="story"
          options={{
            headerShown: false,
            animation: 'slide_from_right',
            gestureEnabled: true,
          }}
        />
        <Stack.Screen name="placement" options={{ headerShown: false }} />
        <Stack.Screen name="story-exercise" options={{ title: 'Story Exercise' }} />
        <Stack.Screen name="journal" options={{ title: 'Journal' }} />
        <Stack.Screen name="stats" options={{ title: 'Progress' }} />
        <Stack.Screen name="profile" options={{ title: 'Profile' }} />
        <Stack.Screen name="settings/index" options={{ title: 'Settings' }} />
      </Stack>

      {showLaunch && (
        <View
          style={[
            styles.launchOverlay,
            themeName === 'light' && { backgroundColor: getTheme(themeName).background },
          ]}
          pointerEvents="none"
        >
          <LottieView
            ref={launchRef}
            source={require('../assets/lottie/launch.json')}
            autoPlay
            loop={false}
            speed={0.7}
            // Delay 2 seconds after the animation finishes before showing home
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

      {routeLoading && !showLaunch && (
        <View
          style={[
            styles.routeOverlay,
          ]}
          pointerEvents="none"
        >
          <LottieView
            source={require('../assets/lottie/loading.json')}
            autoPlay
            loop
            // Play at a gentle speed matching the screenshot feel
            speed={1}
            style={{ width: 200, height: 200, alignSelf: 'center' }}
          />
          <Text style={[styles.routeText, themeName === 'light' && { color: '#6B7280' }]}>Loading...</Text>
        </View>
      )}
    </>
  ) : (
    // Render nothing until prefs hydrate to avoid flashing the wrong theme
    <View style={{ flex: 1, backgroundColor: getTheme(themeName).background }} />
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
  routeOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'flex-end',
    paddingBottom: 80,
    zIndex: 999,
    // Softer dim to minimize visual flash
    backgroundColor: 'rgba(0,0,0,0.14)',
  },
  routeText: {
    textAlign: 'center',
    color: '#9CA3AF',
    fontSize: 16,
    marginTop: 6,
  },
});

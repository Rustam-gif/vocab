import React, { useEffect, useRef, useState } from 'react';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { RouterProvider, RouteRenderer } from './lib/router';
import LottieView from 'lottie-react-native';
import { View, StyleSheet, Platform, TextInput } from 'react-native';
import { useAppStore } from './lib/store';
import { getTheme } from './lib/theme';
import { Launch } from './lib/launch';
import NotificationService from './services/NotificationService';

export default function App() {
  const themeName = useAppStore(s => s.theme);
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

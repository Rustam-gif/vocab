import React, { useEffect, useRef, useState } from 'react';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { Text, TextInput, View, StyleSheet } from 'react-native';
import { useFonts } from 'expo-font';
import {
  Ubuntu_400Regular,
  Ubuntu_500Medium,
  Ubuntu_700Bold,
} from '@expo-google-fonts/ubuntu';
import { useAppStore } from '../lib/store';
import { getTheme } from '../lib/theme';
import LottieView from 'lottie-react-native';
import { Launch } from '../lib/launch';

export default function RootLayout() {
  const [fontsLoaded] = useFonts({
    Ubuntu_400Regular,
    Ubuntu_500Medium,
    Ubuntu_700Bold,
  });
  const themeName = useAppStore(s => s.theme);
  const initializeApp = useAppStore(s => s.initialize);
  const [showLaunch, setShowLaunch] = useState(true);
  const launchRef = useRef<LottieView>(null);
  const fallbackTimerRef = useRef<NodeJS.Timeout | null>(null);
  const finishedRef = useRef(false);

  // Apply a global font family across the app after fonts load
  useEffect(() => {
    if (!fontsLoaded) return;
    Text.defaultProps = Text.defaultProps || {};
    Text.defaultProps.style = [Text.defaultProps.style, { fontFamily: 'Ubuntu_400Regular' }];

    TextInput.defaultProps = TextInput.defaultProps || {};
    TextInput.defaultProps.style = [TextInput.defaultProps.style, { fontFamily: 'Ubuntu_400Regular' }];
  }, [fontsLoaded]);

  // Initialize services (vault, analytics, progress) once on app start
  useEffect(() => {
    initializeApp().catch(() => {});
  }, [initializeApp]);

  // Fallback: hide overlay if animation never finishes (e.g., 8s)
  useEffect(() => {
    if (!fontsLoaded) return;
    fallbackTimerRef.current = setTimeout(() => setShowLaunch(false), 8000) as any;
    return () => {
      if (fallbackTimerRef.current) clearTimeout(fallbackTimerRef.current);
    };
  }, [fontsLoaded]);

  if (!fontsLoaded) {
    return (
      <>
        <StatusBar style={themeName === 'light' ? 'dark' : 'light'} />
        <View style={{ flex: 1, backgroundColor: getTheme(themeName).background }} />
      </>
    );
  }

  return (
    <>
      {/* Theme-aware status bar */}
      <StatusBar style={themeName === 'light' ? 'dark' : 'light'} />
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: getTheme(themeName).background },
          animation: 'simple_push',
          animationTypeForReplace: 'pop',
        }}
      >
        <Stack.Screen name="index" options={{ headerShown: false }} />
        <Stack.Screen name="vault" options={{ title: 'Vault' }} />
        <Stack.Screen name="quiz" options={{ headerShown: false }} />
        <Stack.Screen name="story" options={{ headerShown: false }} />
        <Stack.Screen name="placement" options={{ headerShown: false }} />
        <Stack.Screen name="story-exercise" options={{ title: 'Story Exercise' }} />
        <Stack.Screen name="journal" options={{ title: 'Journal' }} />
        <Stack.Screen name="stats" options={{ title: 'Progress' }} />
        <Stack.Screen name="profile" options={{ title: 'Profile' }} />
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
    </>
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
});

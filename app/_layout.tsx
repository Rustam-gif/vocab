import React, { useEffect } from 'react';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { Text, TextInput, View } from 'react-native';
import { useFonts } from 'expo-font';
import {
  Ubuntu_400Regular,
  Ubuntu_500Medium,
  Ubuntu_700Bold,
} from '@expo-google-fonts/ubuntu';
import { useAppStore } from '../lib/store';
import { getTheme } from '../lib/theme';

export default function RootLayout() {
  const [fontsLoaded] = useFonts({
    Ubuntu_400Regular,
    Ubuntu_500Medium,
    Ubuntu_700Bold,
  });
  const themeName = useAppStore(s => s.theme);

  // Apply a global font family across the app after fonts load
  useEffect(() => {
    if (!fontsLoaded) return;
    Text.defaultProps = Text.defaultProps || {};
    Text.defaultProps.style = [Text.defaultProps.style, { fontFamily: 'Ubuntu_400Regular' }];

    TextInput.defaultProps = TextInput.defaultProps || {};
    TextInput.defaultProps.style = [TextInput.defaultProps.style, { fontFamily: 'Ubuntu_400Regular' }];
  }, [fontsLoaded]);

  if (!fontsLoaded) {
    return (
      <>
        <StatusBar style="light" />
        <View />
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
    </>
  );
}

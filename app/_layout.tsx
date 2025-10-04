import React, { useEffect } from 'react';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { Text, TextInput } from 'react-native';

export default function RootLayout() {
  // Apply a global font family across the app
  useEffect(() => {
    // Ensure all Text components default to Josefin Sans
    Text.defaultProps = Text.defaultProps || {};
    Text.defaultProps.style = [
      // keep any existing default style
      Text.defaultProps.style,
      { fontFamily: 'Josefin Sans' },
    ];

    // And TextInput (so inputs match as well)
    TextInput.defaultProps = TextInput.defaultProps || {};
    TextInput.defaultProps.style = [
      TextInput.defaultProps.style,
      { fontFamily: 'Josefin Sans' },
    ];
  }, []);

  return (
    <>
      <StatusBar style="light" />
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: '#1E1E1E' },
        }}
      >
        <Stack.Screen name="index" options={{ headerShown: false }} />
        <Stack.Screen name="vault" options={{ title: 'Vault' }} />
        <Stack.Screen name="quiz" options={{ headerShown: false }} />
        <Stack.Screen name="story" options={{ headerShown: false }} />
        <Stack.Screen name="story-exercise" options={{ title: 'Story Exercise' }} />
        <Stack.Screen name="journal" options={{ title: 'Journal' }} />
        <Stack.Screen name="stats" options={{ title: 'Progress' }} />
        <Stack.Screen name="profile" options={{ title: 'Profile' }} />
      </Stack>
    </>
  );
}

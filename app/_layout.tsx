import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';

export default function RootLayout() {
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
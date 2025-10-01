/**
 * Story Section Layout
 * 
 * Layout wrapper for story-related screens
 */

import { Stack } from 'expo-router';

export default function StoryLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: '#1E1E1E' },
        animation: 'slide_from_right',
      }}
    >
      <Stack.Screen 
        name="StoryExercise" 
        options={{
          title: 'Story Exercise',
          gestureEnabled: true,
        }}
      />
    </Stack>
  );
}
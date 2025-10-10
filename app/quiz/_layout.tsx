import { Stack } from 'expo-router';

export default function QuizLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        animation: 'simple_push',
        // Ensure replace() uses a back/pop animation so it feels like navigating back
        animationTypeForReplace: 'pop',
      }}
    />
  );
}

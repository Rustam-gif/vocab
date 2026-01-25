import React from 'react';
import { View, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { useAppStore } from '../../lib/store';
import { getTheme } from '../../lib/theme';

export default function QuizIndex() {
  const router = useRouter();

  React.useEffect(() => {
    // Redirect immediately without delay
    router.replace('/quiz/level-select');
  }, [router]);

  const theme = useAppStore(s => s.theme);
  const colors = getTheme(theme);

  // Return minimal UI (this should rarely/never be seen due to immediate redirect)
  return (
    <View style={[styles.container, { backgroundColor: colors.background }]} />
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#1B263B', justifyContent: 'center', alignItems: 'center' },
});

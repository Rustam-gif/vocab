import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { useAppStore } from '../../lib/store';
import { getTheme } from '../../lib/theme';
import LottieView from 'lottie-react-native';

export default function QuizIndex() {
  const router = useRouter();

  React.useEffect(() => {
    // Small delay to ensure navigation is ready
    const timer = setTimeout(() => {
      router.replace('/quiz/level-select');
    }, 100);

    return () => clearTimeout(timer);
  }, [router]);

  const theme = useAppStore(s => s.theme);
  const colors = getTheme(theme);
  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <LottieView
        source={require('../../assets/lottie/loading.json')}
        autoPlay
        loop
        style={{ width: 140, height: 140 }}
      />
      <Text style={[styles.text, theme === 'light' && { color: '#6B7280', marginTop: 12 }]}>Loading Quiz...</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#1B263B', justifyContent: 'center', alignItems: 'center' },
  text: { color: '#fff', fontSize: 16 },
});

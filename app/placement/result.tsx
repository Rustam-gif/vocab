import React, { useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';

const SELECTED_LEVEL_KEY = '@engniter.selectedLevel';

export default function PlacementResult() {
  const router = useRouter();
  const { levelId, ability, early, q } = useLocalSearchParams<{ levelId?: string; ability?: string; early?: string; q?: string }>();
  const recommended = levelId || 'intermediate';

  useEffect(() => {
    // Persist recommended level
    AsyncStorage.setItem(SELECTED_LEVEL_KEY, recommended).catch(() => {});
  }, [recommended]);

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.card}>
        <Text style={styles.title}>Your Recommended Level</Text>
        <Text style={styles.level}>{labelFor(recommended)}</Text>
        <Text style={styles.caption}>You can change it anytime in Learn.</Text>
        {early === '1' ? (
          <Text style={[styles.caption, { color: '#F2AB27' }]}>We stopped early after 3 incorrect answers in a row (at question {q || '–'}). Try a quick review, then continue in Learn.</Text>
        ) : null}
        <View style={styles.row}>
          <Text style={styles.kvKey}>Estimated ability</Text>
          <Text style={styles.kvVal}>{Number(ability ?? '0').toFixed(1)}</Text>
        </View>
        <TouchableOpacity style={styles.cta} onPress={() => router.replace(`/quiz/learn?level=${recommended}`)}>
          <Text style={styles.ctaText}>Continue to Learn</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.link} onPress={() => router.replace('/placement/test')}>
          <Text style={styles.linkText}>Retake Test</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

function labelFor(id: string) {
  switch (id) {
    case 'beginner':
      return 'Beginner (A1–A2)';
    case 'intermediate':
      return 'Intermediate (B1)';
    case 'advanced':
      return 'Advanced (B2–C1)';
    default:
      return id;
  }
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#1E1E1E', padding: 20, justifyContent: 'center' },
  card: { backgroundColor: '#2C2C2C', borderRadius: 16, padding: 20, borderWidth: 1, borderColor: '#333' },
  title: { color: '#9CA3AF', fontWeight: '700', marginBottom: 8 },
  level: { color: '#fff', fontSize: 22, fontWeight: '800' },
  caption: { color: '#9CA3AF', marginTop: 4, marginBottom: 12 },
  row: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 10 },
  kvKey: { color: '#9CA3AF' },
  kvVal: { color: '#E5E7EB', fontWeight: '700' },
  cta: { backgroundColor: '#F2935C', marginTop: 8, borderRadius: 12, paddingVertical: 14, alignItems: 'center' },
  ctaText: { color: '#fff', fontWeight: '800' },
  link: { marginTop: 10, alignItems: 'center' },
  linkText: { color: '#9CA3AF' },
});

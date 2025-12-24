import React, { useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { levels } from '../quiz/data/levels';
import { SetProgressService } from '../../services/SetProgressService';
import { useAppStore } from '../../lib/store';

const SELECTED_LEVEL_KEY = '@engniter.selectedLevel';
const HIGHEST_LEVEL_KEY = '@engniter.highestLevel';

export default function PlacementResult() {
  const router = useRouter();
  const { levelId, ability, confidence, band, early, q } = useLocalSearchParams<{ levelId?: string; ability?: string; confidence?: string; band?: string; early?: string; q?: string }>();
  const recommended = levelId || 'intermediate';
  const themeName = useAppStore(s => s.theme);
  const isLight = themeName === 'light';

  useEffect(() => {
    // Persist recommended level
    AsyncStorage.setItem(SELECTED_LEVEL_KEY, recommended).catch(() => {});
    // Update highest achieved core level
    (async () => {
      try {
        const coreOrder = ['beginner', 'intermediate', 'upper-intermediate', 'advanced', 'advanced-plus', 'proficient'];
        const weight = (id?: string) => {
          const i = id ? coreOrder.indexOf(id) : -1;
          return i >= 0 ? i : -1;
        };
        const existing = await AsyncStorage.getItem(HIGHEST_LEVEL_KEY);
        const currentW = weight(recommended);
        const existingW = weight(existing || undefined);
        if (currentW >= 0 && currentW > existingW) {
          await AsyncStorage.setItem(HIGHEST_LEVEL_KEY, recommended);
        }

        // Mark all lower core levels as completed so users don't have to replay them.
        // Example: If recommended is B1 (intermediate), mark Beginner as completed.
        await SetProgressService.initialize();
        const recIndex = coreOrder.indexOf(recommended);
        if (recIndex > 0) {
          const toComplete = coreOrder.slice(0, recIndex);
          for (const lvlId of toComplete) {
            const lvl = levels.find(l => l.id === lvlId);
            if (!lvl) continue;
            for (const s of lvl.sets) {
              try { await SetProgressService.markCompleted(lvl.id, s.id, 100); } catch {}
            }
          }
        }
      } catch {}
    })();
  }, [recommended]);

  return (
    <SafeAreaView style={[styles.container, isLight && styles.containerLight]}>
      <View style={[styles.card, isLight && styles.cardLight]}>
        <Text style={[styles.title, isLight && styles.titleLight]}>Your Recommended Level</Text>
        <Text style={[styles.level, isLight && styles.levelLight]}>{labelFor(recommended)}</Text>
        <Text style={[styles.caption, isLight && styles.captionLight]}>You can change it anytime in Learn.</Text>
        {early === '1' ? (
          <Text style={[styles.caption, isLight && styles.captionLight, { color: '#F8B070' }]}>Test ended early at question {q || '–'}. Your level has been determined with high confidence.</Text>
        ) : null}
        {band ? (
          <View style={styles.row}>
            <Text style={[styles.kvKey, isLight && styles.kvKeyLight]}>CEFR Band</Text>
            <Text style={[styles.kvVal, isLight && styles.kvValLight, { color: bandColor(band) }]}>{band}</Text>
          </View>
        ) : null}
        <View style={styles.row}>
          <Text style={[styles.kvKey, isLight && styles.kvKeyLight]}>Ability Score</Text>
          <Text style={[styles.kvVal, isLight && styles.kvValLight]}>{Number(ability ?? '0').toFixed(1)}</Text>
        </View>
        {confidence ? (
          <View style={styles.row}>
            <Text style={[styles.kvKey, isLight && styles.kvKeyLight]}>Confidence</Text>
            <Text style={[styles.kvVal, isLight && styles.kvValLight]}>{Math.round(Number(confidence) * 100)}%</Text>
          </View>
        ) : null}
        <TouchableOpacity style={styles.cta} onPress={() => router.replace(`/quiz/learn?level=${recommended}`)}>
          <Text style={styles.ctaText}>Continue to Learn</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.link} onPress={() => router.replace('/placement/test')}>
          <Text style={[styles.linkText, isLight && styles.linkTextLight]}>Retake Test</Text>
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
    case 'upper-intermediate':
      return 'Upper Intermediate (B2)';
    case 'advanced':
      return 'Advanced (B2–C1)';
    default:
      return id;
  }
}

function bandColor(band: string): string {
  switch (band) {
    case 'A1':
      return '#64B5F6';
    case 'A2':
      return '#81C784';
    case 'B1':
      return '#FFCA28';
    case 'B2':
      return '#F8B070';
    case 'C1':
      return '#E57373';
    default:
      return '#E5E7EB';
  }
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#1E1E1E', padding: 20, justifyContent: 'center' },
  containerLight: { backgroundColor: '#F8F8F8' },
  card: { backgroundColor: '#2C2C2C', borderRadius: 16, padding: 20, borderWidth: 1, borderColor: '#333' },
  cardLight: { backgroundColor: '#FFFFFF', borderColor: '#E5E7EB' },
  title: { color: '#9CA3AF', fontWeight: '700', marginBottom: 8 },
  titleLight: { color: '#6B7280' },
  level: { color: '#fff', fontSize: 22, fontWeight: '800' },
  levelLight: { color: '#111827' },
  caption: { color: '#9CA3AF', marginTop: 4, marginBottom: 12 },
  captionLight: { color: '#6B7280' },
  row: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 10 },
  kvKey: { color: '#9CA3AF' },
  kvKeyLight: { color: '#6B7280' },
  kvVal: { color: '#E5E7EB', fontWeight: '700' },
  kvValLight: { color: '#111827', fontWeight: '700' },
  cta: { backgroundColor: '#F8B070', marginTop: 8, borderRadius: 12, paddingVertical: 14, alignItems: 'center' },
  ctaText: { color: '#fff', fontWeight: '800' },
  link: { marginTop: 10, alignItems: 'center' },
  linkText: { color: '#9CA3AF' },
  linkTextLight: { color: '#374151' },
});

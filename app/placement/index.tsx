import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { LinearGradient } from '../../lib/LinearGradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useAppStore } from '../../lib/store';

export default function PlacementIntro() {
  const router = useRouter();
  const themeName = useAppStore(s => s.theme);
  const isLight = themeName === 'light';
  return (
    <SafeAreaView style={[styles.container, isLight && styles.containerLight]}>
      <View style={[styles.card, isLight && styles.cardLight]}>
        <Text style={[styles.title, isLight && styles.titleLight]}>Placement Test</Text>
        <Text style={[styles.subtitle, isLight && styles.subtitleLight]}>
          A short adaptive check that tunes Vocadoo to your current English level so your learning feels just right.
        </Text>
        <View style={[styles.infoBox, isLight && styles.infoBoxLight]}>
          <Text style={[styles.infoRow, isLight && styles.infoRowLight]}>• About 8–12 minutes</Text>
          <Text style={[styles.infoRow, isLight && styles.infoRowLight]}>• Multiple‑choice, clear examples</Text>
          <Text style={[styles.infoRow, isLight && styles.infoRowLight]}>• You can stop anytime</Text>
        </View>
        <View style={styles.chipsRow}>
          <View style={[styles.chip, isLight && styles.chipLight]}><Text style={[styles.chipText, isLight && styles.chipTextLight]}>8–12 min</Text></View>
          <View style={[styles.chip, isLight && styles.chipLight]}><Text style={[styles.chipText, isLight && styles.chipTextLight]}>Multiple choice</Text></View>
          <View style={[styles.chip, isLight && styles.chipLight]}><Text style={[styles.chipText, isLight && styles.chipTextLight]}>Skip anytime</Text></View>
        </View>
        <TouchableOpacity onPress={() => router.replace('/placement/test')} activeOpacity={0.9}>
          <LinearGradient colors={['#1a8d87', '#3cb4ac']} start={{x:0,y:0}} end={{x:1,y:1}} style={styles.cta}>
            <Text style={styles.ctaText}>Start Test</Text>
          </LinearGradient>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#121415', padding: 20, justifyContent: 'center' },
  containerLight: { backgroundColor: '#F8F8F8' },
  card: { backgroundColor: 'rgba(44,47,47,0.9)', borderRadius: 18, padding: 22, borderWidth: StyleSheet.hairlineWidth, borderColor: '#3d474b', shadowColor: '#000', shadowOpacity: 0.35, shadowRadius: 16, shadowOffset: { width: 0, height: 12 }, elevation: 8 },
  cardLight: { backgroundColor: '#FFFFFF', borderColor: '#E5E7EB', shadowOpacity: 0.15 },
  title: { color: '#fff', fontSize: 22, fontWeight: '900', marginBottom: 8 },
  titleLight: { color: '#111827' },
  subtitle: { color: '#9CA3AF', fontSize: 14, lineHeight: 22 },
  subtitleLight: { color: '#4B5563' },
  infoBox: { marginTop: 10, backgroundColor: '#263033', borderRadius: 12, padding: 12, borderWidth: StyleSheet.hairlineWidth, borderColor: '#334146' },
  infoBoxLight: { backgroundColor: '#F3EDE5', borderColor: '#E5E7EB' },
  infoRow: { color: '#CBD5E1', fontSize: 12, marginVertical: 2 },
  infoRowLight: { color: '#4B5563' },
  chipsRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 12, flexWrap: 'wrap' },
  chip: { paddingHorizontal: 10, paddingVertical: 6, borderRadius: 12, backgroundColor: 'rgba(255,255,255,0.06)', borderWidth: StyleSheet.hairlineWidth, borderColor: 'rgba(255,255,255,0.12)' },
  chipLight: { backgroundColor: '#E9E6E0', borderColor: '#D7D3CB' },
  chipText: { color: '#CBD5E1', fontSize: 12, fontWeight: '700' },
  chipTextLight: { color: '#374151' },
  cta: { marginTop: 18, paddingVertical: 14, borderRadius: 12, alignItems: 'center' },
  ctaText: { color: '#fff', fontWeight: '800' },
});

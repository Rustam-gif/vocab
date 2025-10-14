import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';

export default function PlacementIntro() {
  const router = useRouter();
  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.card}>
        <Text style={styles.title}>Placement Test</Text>
        <Text style={styles.subtitle}>
          A quick check to tailor your level. Multiple‑choice. Skip anytime.
        </Text>
        <View style={styles.chipsRow}>
          <View style={styles.chip}><Text style={styles.chipText}>8–12 min</Text></View>
          <View style={styles.chip}><Text style={styles.chipText}>Multiple choice</Text></View>
          <View style={styles.chip}><Text style={styles.chipText}>Skip anytime</Text></View>
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
  card: { backgroundColor: 'rgba(44,47,47,0.9)', borderRadius: 18, padding: 22, borderWidth: StyleSheet.hairlineWidth, borderColor: '#3d474b', shadowColor: '#000', shadowOpacity: 0.35, shadowRadius: 16, shadowOffset: { width: 0, height: 12 }, elevation: 8 },
  title: { color: '#fff', fontSize: 22, fontWeight: '900', marginBottom: 8 },
  subtitle: { color: '#9CA3AF', fontSize: 14, lineHeight: 22 },
  chipsRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 12, flexWrap: 'wrap' },
  chip: { paddingHorizontal: 10, paddingVertical: 6, borderRadius: 12, backgroundColor: 'rgba(255,255,255,0.06)', borderWidth: StyleSheet.hairlineWidth, borderColor: 'rgba(255,255,255,0.12)' },
  chipText: { color: '#CBD5E1', fontSize: 12, fontWeight: '700' },
  cta: { marginTop: 18, paddingVertical: 14, borderRadius: 12, alignItems: 'center' },
  ctaText: { color: '#fff', fontWeight: '800' },
});

import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';

export default function PlacementIntro() {
  const router = useRouter();
  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.card}>
        <Text style={styles.title}>Placement Test</Text>
        <Text style={styles.subtitle}>
          We’ll ask up to 12 short questions to estimate your level and tailor your practice.
          You can always skip with “I don’t know”.
        </Text>
        <View style={styles.bullets}>
          <Text style={styles.bullet}>• About 8–12 minutes</Text>
          <Text style={styles.bullet}>• Mix of multiple‑choice prompts</Text>
          <Text style={styles.bullet}>• No pressure—no red marks during the test</Text>
        </View>
        <TouchableOpacity style={styles.cta} onPress={() => router.replace('/placement/test')}>
          <Text style={styles.ctaText}>Start Test</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#1E1E1E', padding: 20, justifyContent: 'center' },
  card: { backgroundColor: '#2C2C2C', borderRadius: 16, padding: 20, borderWidth: 1, borderColor: '#333' },
  title: { color: '#fff', fontSize: 20, fontWeight: '800', marginBottom: 8 },
  subtitle: { color: '#9CA3AF', fontSize: 14, lineHeight: 20 },
  bullets: { marginTop: 12, gap: 4 },
  bullet: { color: '#9CA3AF', fontSize: 13 },
  cta: { marginTop: 16, backgroundColor: '#F2935C', paddingVertical: 14, borderRadius: 12, alignItems: 'center' },
  ctaText: { color: '#fff', fontWeight: '700' },
});

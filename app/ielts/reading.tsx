import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAppStore } from '../../lib/store';
import { getTheme } from '../../lib/theme';
import { useRouter } from 'expo-router';

export default function IELTSReading() {
  const router = useRouter();
  const theme = useAppStore(s => s.theme);
  const colors = getTheme(theme);
  const isLight = theme === 'light';
  return (
    <SafeAreaView style={[styles.page, { backgroundColor: colors.background }]}>
      <View style={styles.headerRow}>
        <Text style={[styles.title, isLight && { color: '#111827' }]}>IELTS Reading</Text>
        <TouchableOpacity accessibilityLabel="Close" onPress={() => router.back()} style={styles.closeBtn}>
          <Text style={[styles.closeTxt, isLight && { color: '#111827' }]}>✕</Text>
        </TouchableOpacity>
      </View>
      <Text style={[styles.hint, isLight && { color: '#6B7280' }]}>Coming soon</Text>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  page: { flex: 1, padding: 16 },
  headerRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  title: { fontSize: 22, fontWeight: '800', color: '#E5E7EB' },
  hint: { marginTop: 8, color: '#9CA3AF' },
  closeBtn: { padding: 6, paddingHorizontal: 10, borderRadius: 10 },
  closeTxt: { fontSize: 18, color: '#E5E7EB' },
});

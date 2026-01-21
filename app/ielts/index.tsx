import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { ChevronRight } from 'lucide-react-native';
import LottieView from 'lottie-react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useAppStore } from '../../lib/store';
import { getTheme } from '../../lib/theme';
import TopStatusPanel from '../components/TopStatusPanel';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function IELTSHome() {
  const router = useRouter();
  const theme = useAppStore(s => s.theme);
  const colors = getTheme(theme);
  const isLight = theme === 'light';
  const insets = useSafeAreaInsets();
  const [panelHeight, setPanelHeight] = useState(0);
  const contentTop = Math.max(0, panelHeight ? panelHeight - 48 : insets.top + 2);
  return (
    <SafeAreaView style={[styles.page, { backgroundColor: colors.background }]}>
      <TopStatusPanel
        floating
        includeTopInset
        onHeight={setPanelHeight}
      />
      <View style={[styles.content, { paddingTop: contentTop }]}>
        <View style={styles.row}>
          <TouchableOpacity style={[styles.card, isLight && styles.cardLight, isLight && styles.cardLightShadow]} activeOpacity={0.9} onPress={() => router.push('/ielts/writing')}>
            <View style={styles.cardTile}>
              <LottieView
                source={require('../../assets/homepageicons/IELTS_icons/writing_icon.json')}
                autoPlay
                loop={false}
                __stableKey="ielts-icon:writing"
                style={{ width: 120, height: 120, opacity: 0.9 }}
              />
              <Text style={[styles.cardTitle, isLight && { color: '#111827' }]}>Writing</Text>
              <Text style={[styles.cardHint, isLight && { color: '#6B7280' }]}>Task 1 & 2</Text>
            </View>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.card, isLight && styles.cardLight, isLight && styles.cardLightShadow]} activeOpacity={0.9} onPress={() => router.push('/ielts/reading')}>
            <View style={styles.cardTile}>
              <LottieView
                source={require('../../assets/homepageicons/IELTS_icons/reading_icon.json')}
                autoPlay
                loop={false}
                __stableKey="ielts-icon:reading"
                style={{ width: 120, height: 120, opacity: 0.9 }}
              />
              <Text style={[styles.cardTitle, isLight && { color: '#111827' }]}>Reading</Text>
              <Text style={[styles.cardHint, isLight && { color: '#6B7280' }]}>Timed sets</Text>
            </View>
          </TouchableOpacity>
        </View>
        <View style={styles.row}>
          <TouchableOpacity style={[styles.card, isLight && styles.cardLight, isLight && styles.cardLightShadow]} activeOpacity={0.9} onPress={() => router.push('/ielts/vocabulary')}>
            <View style={styles.cardTile}>
              <LottieView
                source={require('../../assets/homepageicons/IELTS_icons/vocabulary_icon.json')}
                autoPlay
                loop={false}
                __stableKey="ielts-icon:vocabulary"
                style={{ width: 120, height: 120, opacity: 0.9 }}
              />
              <Text style={[styles.cardTitle, isLight && { color: '#111827' }]}>Vocabulary</Text>
              <Text style={[styles.cardHint, isLight && { color: '#6B7280' }]}>In-context</Text>
            </View>
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  page: { flex: 1 },
  content: { flex: 1, paddingHorizontal: 16 },
  headerRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  title: { fontSize: 24, fontWeight: '800', color: '#E5E7EB' },
  subtitle: { marginTop: 4, color: '#9CA3AF' },
  closeBtn: { padding: 6, paddingHorizontal: 10, borderRadius: 10 },
  closeTxt: { fontSize: 18, color: '#E5E7EB' },
  row: { flexDirection: 'row', gap: 12, marginTop: 18, justifyContent: 'space-between' },
  card: { width: '48%', height: 190, backgroundColor: '#243B53', borderRadius: 18, padding: 16, borderWidth: 1, borderColor: '#243B53', shadowColor: '#000', shadowOpacity: 0.14, shadowRadius: 7, shadowOffset: { width: 0, height: 4 }, elevation: 4 },
  cardLight: { backgroundColor: '#FFFFFF', borderColor: '#E5E7EB' },
  cardLightShadow: { shadowColor: '#000', shadowOpacity: 0.10, shadowRadius: 16, shadowOffset: { width: 0, height: 8 }, elevation: 8 },
  cardRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  cardTile: { flex: 1, alignItems: 'center', justifyContent: 'space-between', paddingVertical: 8 },
  leadIcon: { width: 96, height: 96, alignItems: 'center', justifyContent: 'center', marginRight: 6 },
  leadIconLight: { },
  leadIconWriting: { },
  leadIconReading: { },
  leadIconVocab: { },
  leadIconPlain: { backgroundColor: 'transparent', borderWidth: 0 },
  leadEmoji: { fontSize: 18 },
  cardTitle: { fontSize: 17, fontWeight: '700', color: '#E5E7EB' },
  cardHint: { marginTop: 4, color: '#9CA3AF', fontSize: 13 },
  chevronPill: { width: 32, height: 32, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  chevronPillLight: { backgroundColor: '#EEF2F7', borderWidth: 1, borderColor: '#E5E7EB' },
  chevronPillDark: { backgroundColor: '#0D1B2A', borderWidth: 1, borderColor: '#2D4A66' },
});

import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
  Easing,
  DeviceEventEmitter,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useAppStore } from '../../lib/store';
import { ChevronLeft } from 'lucide-react-native';

type LevelOption = {
  id: 'beginner' | 'intermediate' | 'advanced';
  title: string;
  cefr: string;
  description: string;
  emoji: string;
};

const levelOptions: LevelOption[] = [
  { id: 'beginner', title: 'Beginner', cefr: 'A1-A2', description: 'Just starting to learn English', emoji: '🌱' },
  { id: 'intermediate', title: 'Intermediate', cefr: 'B1-B2', description: 'Can hold everyday conversations', emoji: '📚' },
  { id: 'advanced', title: 'Advanced', cefr: 'C1+', description: 'Fluent in most situations', emoji: '🎯' },
];

export default function PlacementLevelSelect() {
  const router = useRouter();
  const themeName = useAppStore(s => s.theme);
  const isLight = themeName === 'light';

  const fadeIn = useRef(new Animated.Value(0)).current;
  const slideUp = useRef(new Animated.Value(40)).current;
  const cardAnims = useRef(levelOptions.map(() => new Animated.Value(0))).current;

  useEffect(() => {
    DeviceEventEmitter.emit('NAV_VISIBILITY', 'hide');
    return () => DeviceEventEmitter.emit('NAV_VISIBILITY', 'show');
  }, []);

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeIn, { toValue: 1, duration: 500, useNativeDriver: true }),
      Animated.timing(slideUp, { toValue: 0, duration: 500, easing: Easing.out(Easing.back(1.2)), useNativeDriver: true }),
    ]).start();

    cardAnims.forEach((anim, index) => {
      Animated.timing(anim, {
        toValue: 1,
        duration: 400,
        delay: 200 + index * 100,
        easing: Easing.out(Easing.back(1.5)),
        useNativeDriver: true,
      }).start();
    });
  }, [cardAnims, fadeIn, slideUp]);

  const handleSelectLevel = (level: 'beginner' | 'intermediate' | 'advanced') => {
    router.push({ pathname: '/placement/word-test', params: { selectedLevel: level } });
  };

  return (
    <View style={[styles.container, isLight && styles.containerLight]}>
      <SafeAreaView style={styles.safe}>
        <Animated.View style={[styles.header, { opacity: fadeIn, transform: [{ translateY: slideUp }] }]}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
            <ChevronLeft size={24} color={isLight ? '#111827' : '#E5E7EB'} />
          </TouchableOpacity>
          <Text style={[styles.headerTitle, isLight && styles.headerTitleLight]}>What's your level?</Text>
          <View style={{ width: 24 }} />
        </Animated.View>

        <Animated.Text style={[styles.subtitle, isLight && styles.subtitleLight, { opacity: fadeIn, transform: [{ translateY: slideUp }] }]}>
          Choose the level that best describes you. We'll verify with a quick word check.
        </Animated.Text>

        <View style={styles.cardsContainer}>
          {levelOptions.map((level, index) => {
            const scale = cardAnims[index].interpolate({ inputRange: [0, 1], outputRange: [0.8, 1] });
            return (
              <Animated.View key={level.id} style={{ opacity: cardAnims[index], transform: [{ scale }] }}>
                <TouchableOpacity onPress={() => handleSelectLevel(level.id)} activeOpacity={0.85} style={[styles.card, isLight && styles.cardLight]}>
                  <Text style={styles.emoji}>{level.emoji}</Text>
                  <View style={styles.cardContent}>
                    <View style={styles.cardHeader}>
                      <Text style={[styles.cardTitle, isLight && styles.cardTitleLight]}>{level.title}</Text>
                      <View style={[styles.cefrBadge, isLight && styles.cefrBadgeLight]}>
                        <Text style={[styles.cefrText, isLight && styles.cefrTextLight]}>{level.cefr}</Text>
                      </View>
                    </View>
                    <Text style={[styles.cardDesc, isLight && styles.cardDescLight]}>{level.description}</Text>
                  </View>
                  <ChevronLeft size={20} color={isLight ? '#9CA3AF' : '#6B7280'} style={{ transform: [{ rotate: '180deg' }] }} />
                </TouchableOpacity>
              </Animated.View>
            );
          })}
        </View>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#1E1E1E' },
  containerLight: { backgroundColor: '#F8F8F8' },
  safe: { flex: 1, padding: 20 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 },
  headerTitle: { fontSize: 22, fontWeight: '800', color: '#E5E7EB', fontFamily: 'Ubuntu-Bold' },
  headerTitleLight: { color: '#111827' },
  backBtn: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center', borderRadius: 12, borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)' },
  subtitle: { fontSize: 14, color: '#9CA3AF', marginBottom: 16, fontFamily: 'Ubuntu-Regular' },
  subtitleLight: { color: '#4B5563' },
  cardsContainer: { gap: 12, marginTop: 12 },
  card: { flexDirection: 'row', alignItems: 'center', padding: 16, borderRadius: 14, backgroundColor: '#2A2D2D', borderWidth: 1, borderColor: 'rgba(255,255,255,0.06)' },
  cardLight: { backgroundColor: '#FFFFFF', borderColor: '#E5E7EB', shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 8, elevation: 2 },
  emoji: { fontSize: 28, marginRight: 12 },
  cardContent: { flex: 1, gap: 4 },
  cardHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  cardTitle: { fontSize: 18, fontWeight: '800', color: '#E5E7EB', fontFamily: 'Ubuntu-Bold' },
  cardTitleLight: { color: '#111827' },
  cefrBadge: { paddingHorizontal: 10, paddingVertical: 6, borderRadius: 12, backgroundColor: 'rgba(255,255,255,0.08)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.12)' },
  cefrBadgeLight: { backgroundColor: '#F3F4F6', borderColor: '#E5E7EB' },
  cefrText: { fontSize: 12, fontWeight: '700', color: '#E5E7EB', fontFamily: 'Ubuntu-Bold' },
  cefrTextLight: { color: '#111827' },
  cardDesc: { fontSize: 13, color: '#9CA3AF', fontFamily: 'Ubuntu-Regular' },
  cardDescLight: { color: '#4B5563' },
});

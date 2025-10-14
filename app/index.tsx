import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Image, Animated, Easing } from 'react-native';
import { Asset } from 'expo-asset';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Plus, ChevronRight } from 'lucide-react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFocusEffect } from '@react-navigation/native';
import { useAppStore } from '../lib/store';
import { getTheme } from '../lib/theme';
import { Launch } from '../lib/launch';

const SELECTED_LEVEL_KEY = '@engniter.selectedLevel';

export default function HomeScreen() {
  const router = useRouter();
  const [storedLevel, setStoredLevel] = useState<string | null>(null);
  const theme = useAppStore(s => s.theme);
  const colors = getTheme(theme);

  useEffect(() => {
    AsyncStorage.getItem(SELECTED_LEVEL_KEY).then(level => {
      if (level) setStoredLevel(level);
    });
  }, []);

  const handleQuizSession = () => {
    if (storedLevel) {
      router.push(`/quiz/learn?level=${storedLevel}`);
    } else {
      router.push('/quiz/level-select');
    }
  };

  const updateStoredLevel = async () => {
    const level = await AsyncStorage.getItem(SELECTED_LEVEL_KEY);
    if (level) setStoredLevel(level);
  };

  useFocusEffect(
    useCallback(() => {
      updateStoredLevel();
    }, [])
  );

  // Organized sections with softer colors
  const accent = '#187486';
  const background = colors.background;

  const sections = [
    {
      title: 'Learning Tools',
      items: [
        {
          title: 'Vault',
          subtitle: 'Manage your vocabulary',
          icon: require('../assets/homepageicons/vault.png'),
          color: accent,
          onPress: () => router.push('/vault'),
        },
        {
          title: 'Quiz Session',
          subtitle: '5-word practice session',
          icon: require('../assets/homepageicons/quiz-session.png'),
          color: accent,
          onPress: handleQuizSession,
        },
        {
          title: 'Story Exercise',
          subtitle: 'Fill-in-the-blanks with pill UI',
          icon: require('../assets/homepageicons/story-exercise.png'),
          color: accent,
          onPress: () => router.push('/story/StoryExercise'),
        },
      ],
    },
    {
      title: 'Progress',
      items: [
        {
          title: 'Journal',
          subtitle: 'Track your learning journey',
          icon: require('../assets/homepageicons/journal.png'),
          color: accent,
          onPress: () => router.push('/journal'),
        },
        {
          title: 'Analytics',
          subtitle: 'View your progress',
          icon: require('../assets/homepageicons/analytics.png'),
          color: accent,
          onPress: () => router.push('/stats'),
        },
      ],
    },
    {
      title: 'Account',
      items: [
        {
          title: 'Profile',
          subtitle: 'Manage your account',
          icon: require('../assets/homepageicons/profile.png'),
          color: accent,
          onPress: () => router.push('/profile'),
        },
      ],
    },
  ];

  // Preload home icons to avoid decode jank during the entrance animation
  useEffect(() => {
    const mods = sections.flatMap(s => s.items.map(i => i.icon));
    try { Asset.loadAsync(mods as any); } catch {}
  }, []);

  // Smooth, GPU-driven timeline animation (one driver for all cards)
  const totalItems = useMemo(() => sections.reduce((acc, s) => acc + s.items.length, 0), [sections]);
  const timelineRef = useRef(new Animated.Value(0));
  const [animSeed, setAnimSeed] = useState(0);

  const runEntrance = useCallback(() => {
    // Reset timeline
    timelineRef.current.stopAnimation();
    timelineRef.current.setValue(0);
    // Duration scales with number of items; keep frame-friendly easing
    const duration = 300 + Math.max(0, totalItems - 1) * 60; // ~60ms per card
    Animated.timing(timelineRef.current, {
      toValue: 1,
      duration,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start();
  }, [totalItems]);

  useEffect(() => {
    // If launch overlay already finished, run immediately; otherwise wait for it.
    if (Launch.isDone()) {
      runEntrance();
      return;
    }
    const unsub = Launch.onDone(() => runEntrance());
    return unsub;
  }, [runEntrance]);

  // Extra safety: kick off a run ~2.5s after mount in case launch event missed
  // Removed extra fallback run (caused redundant animations)

  // Re-run animation when returning to Home
  useFocusEffect(
    useCallback(() => {
      // re-run entrance when returning
      const t = setTimeout(() => runEntrance(), 50);
      return () => clearTimeout(t);
    }, [runEntrance])
  );

  const getFlatIndex = (sectionIdx: number, itemIdx: number) => {
    let idx = 0;
    for (let i = 0; i < sectionIdx; i++) idx += sections[i].items.length;
    return idx + itemIdx;
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: background }] }>
      <ScrollView
        style={[styles.scrollView, { backgroundColor: background }]}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
        removeClippedSubviews
      >
        {/* Header removed per request */}

        {/* Sections */}
        {sections.map((section, sectionIndex) => (
          <View key={sectionIndex} style={styles.section}>
            <Text style={styles.sectionTitle}>{section.title}</Text>
            {section.items.map((item, itemIndex) => {
              const flatIdx = getFlatIndex(sectionIndex, itemIndex);
              const step = 1 / Math.max(1, totalItems);
              const start = flatIdx * step;
              const end = Math.min(1, start + step * 0.9);
              const mid = (start + end) / 2;
              const opacity = timelineRef.current.interpolate({ inputRange: [start, end], outputRange: [0, 1], extrapolate: 'clamp' });
              const scale = timelineRef.current.interpolate({ inputRange: [start, mid, end], outputRange: [0.96, 1.04, 1], extrapolate: 'clamp' });
              return (
                <Animated.View
                  key={itemIndex}
                  style={{
                    transform: [{ scale }],
                    opacity,
                    backfaceVisibility: 'hidden',
                    renderToHardwareTextureAndroid: true,
                    shouldRasterizeIOS: true,
                  }}
                >
                  <TouchableOpacity
                    style={[styles.card, theme === 'light' && styles.cardLight]}
                    onPress={item.onPress}
                    activeOpacity={0.7}
                  >
                    <View style={styles.cardContent}>
                      <View style={styles.cardLeft}>
                        <View style={styles.iconContainer}>
                          <Image
                            source={item.icon}
                            style={styles.homeIcon}
                            resizeMode="contain"
                          />
                        </View>
                        <View style={styles.cardText}>
                          <Text style={[styles.cardTitle, theme === 'light' && styles.cardTitleLight]}>{item.title}</Text>
                          <Text style={[styles.cardSubtitle, theme === 'light' && styles.cardSubtitleLight]}>{item.subtitle}</Text>
                        </View>
                      </View>
                      <ChevronRight size={20} color="#187486" />
                    </View>
                  </TouchableOpacity>
                </Animated.View>
              );
            })}
          </View>
        ))}

        {/* Bottom spacing for FAB */}
        <View style={styles.bottomSpacing} />
      </ScrollView>

      {/* TEMP: Placement Test button (remove later) */}
      <TouchableOpacity style={styles.devBtn} onPress={() => router.push('/placement')}>
        <Text style={styles.devBtnText}>Placement</Text>
      </TouchableOpacity>

      {/* Floating Action Button */}
      <TouchableOpacity
        style={styles.fab}
        onPress={() => router.push('/vault')}
        activeOpacity={0.8}
      >
        <Plus size={24} color="#FFFFFF" />
      </TouchableOpacity>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1E1E1E',
  },
  
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 32,
  },
  header: {
    paddingHorizontal: 16,
    paddingTop: 32,
    paddingBottom: 24,
  },
  title: {
    fontSize: 37,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 8,
    fontFamily: 'Ubuntu_700Bold',
  },
  subtitle: {
    fontSize: 15,
    color: '#9CA3AF',
    lineHeight: 24,
    fontFamily: 'Ubuntu_400Regular',
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6B7280',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 12,
    marginHorizontal: 12,
    fontFamily: 'Ubuntu_500Medium',
  },
  card: {
    backgroundColor: '#2C2C2C',
    marginHorizontal: 12,
    marginBottom: 8,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#333',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
  },
  cardContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 10,
  },
  cardLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  iconContainer: {
    width: 72,
    height: 72,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 6,
    marginLeft: 0,
  },
  homeIcon: {
    width: 64,
    height: 64,
    alignSelf: 'center',
  },
  cardText: {
    flex: 1,
  },
  cardTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 2,
    fontFamily: 'Ubuntu_700Bold',
  },
  cardTitleLight: { color: '#111827' },
  cardSubtitle: {
    fontSize: 13,
    color: '#9CA3AF',
    lineHeight: 18,
    fontFamily: 'Ubuntu_400Regular',
  },
  cardSubtitleLight: { color: '#4B5563' },
  cardLight: {
    backgroundColor: '#F9F1E7',
    borderColor: '#F9F1E7',
  },
  bottomSpacing: {
    height: 64,
  },
  fab: {
    position: 'absolute',
    bottom: 24,
    right: 24,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#187486',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  devBtn: {
    position: 'absolute',
    bottom: 24,
    left: 24,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 12,
    backgroundColor: '#374151',
    borderWidth: 1,
    borderColor: '#4B5563',
  },
  devBtnText: { color: '#E5E7EB', fontWeight: '700' },
});

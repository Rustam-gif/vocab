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
  {
    id: 'beginner',
    title: 'Beginner',
    cefr: 'A1-A2',
    description: 'Just starting to learn English',
    emoji: '🌱',
  },
  {
    id: 'intermediate',
    title: 'Intermediate',
    cefr: 'B1-B2',
    description: 'Can hold everyday conversations',
    emoji: '📚',
  },
  {
    id: 'advanced',
    title: 'Advanced',
    cefr: 'C1+',
    description: 'Fluent in most situations',
    emoji: '🎯',
  },
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
    // Entry animations
    Animated.parallel([
      Animated.timing(fadeIn, {
        toValue: 1,
        duration: 500,
        useNativeDriver: true,
      }),
      Animated.timing(slideUp, {
        toValue: 0,
        duration: 500,
        easing: Easing.out(Easing.back(1.2)),
        useNativeDriver: true,
      }),
    ]).start();

    // Staggered card animations
    cardAnims.forEach((anim, index) => {
      Animated.timing(anim, {
        toValue: 1,
        duration: 400,
        delay: 200 + index * 100,
        easing: Easing.out(Easing.back(1.5)),
        useNativeDriver: true,
      }).start();
    });
  }, []);

  const handleSelectLevel = (level: 'beginner' | 'intermediate' | 'advanced') => {
    router.push({
      pathname: '/placement/word-test',
      params: { selectedLevel: level },
    });
  };

  return (
    <View style={[styles.container, isLight && styles.containerLight]}>
      <SafeAreaView style={styles.safe}>
        {/* Header */}
        <Animated.View
          style={[
            styles.header,
            { opacity: fadeIn, transform: [{ translateY: slideUp }] },
          ]}
        >
          <TouchableOpacity
            onPress={() => router.back()}
            style={styles.backBtn}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <ChevronLeft size={24} color={isLight ? '#111827' : '#E5E7EB'} />
          </TouchableOpacity>
          <Text style={[styles.headerTitle, isLight && styles.headerTitleLight]}>
            What's your level?
          </Text>
          <View style={{ width: 24 }} />
        </Animated.View>

        {/* Subtitle */}
        <Animated.Text
          style={[
            styles.subtitle,
            isLight && styles.subtitleLight,
            { opacity: fadeIn, transform: [{ translateY: slideUp }] },
          ]}
        >
          Choose the level that best describes you. We'll verify with a quick word check.
        </Animated.Text>

        {/* Level Cards */}
        <View style={styles.cardsContainer}>
          {levelOptions.map((level, index) => {
            const scale = cardAnims[index].interpolate({
              inputRange: [0, 1],
              outputRange: [0.8, 1],
            });

            return (
              <Animated.View
                key={level.id}
                style={{
                  opacity: cardAnims[index],
                  transform: [{ scale }],
                }}
              >
                <TouchableOpacity
                  onPress={() => handleSelectLevel(level.id)}
                  activeOpacity={0.85}
                  style={[styles.card, isLight && styles.cardLight]}
                >
                  <Text style={styles.emoji}>{level.emoji}</Text>
                  <View style={styles.cardContent}>
                    <View style={styles.cardHeader}>
                      <Text style={[styles.cardTitle, isLight && styles.cardTitleLight]}>
                        {level.title}
                      </Text>
                      <View style={[styles.cefrBadge, isLight && styles.cefrBadgeLight]}>
                        <Text style={[styles.cefrText, isLight && styles.cefrTextLight]}>
                          {level.cefr}
                        </Text>
                      </View>
                    </View>
                    <Text style={[styles.cardDesc, isLight && styles.cardDescLight]}>
                      {level.description}
                    </Text>
                  </View>
                  <ChevronLeft
                    size={20}
                    color={isLight ? '#9CA3AF' : '#6B7280'}
                    style={{ transform: [{ rotate: '180deg' }] }}
                  />
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
  container: {
    flex: 1,
    backgroundColor: '#1E1E1E',
  },
  containerLight: {
    backgroundColor: '#F8F8F8',
  },
  safe: {
    flex: 1,
    padding: 20,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  backBtn: {
    padding: 4,
  },
  headerTitle: {
    color: '#fff',
    fontSize: 22,
    fontWeight: '600',
    fontFamily: 'Ubuntu-Medium',
  },
  headerTitleLight: {
    color: '#111827',
  },
  subtitle: {
    color: '#9CA3AF',
    fontSize: 15,
    lineHeight: 22,
    textAlign: 'center',
    marginBottom: 32,
    paddingHorizontal: 10,
    fontFamily: 'Ubuntu-Medium',
  },
  subtitleLight: {
    color: '#6B7280',
  },
  cardsContainer: {
    gap: 16,
  },
  card: {
    backgroundColor: '#2A2D2D',
    borderRadius: 16,
    padding: 18,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.06)',
  },
  cardLight: {
    backgroundColor: '#FFFFFF',
    borderColor: '#E5E7EB',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  emoji: {
    fontSize: 36,
    marginRight: 14,
  },
  cardContent: {
    flex: 1,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 4,
  },
  cardTitle: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
    fontFamily: 'Ubuntu-Medium',
  },
  cardTitleLight: {
    color: '#111827',
  },
  cefrBadge: {
    backgroundColor: '#437F76',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  cefrBadgeLight: {
    backgroundColor: 'rgba(67, 127, 118, 0.15)',
  },
  cefrText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
    fontFamily: 'Ubuntu-Medium',
  },
  cefrTextLight: {
    color: '#437F76',
  },
  cardDesc: {
    color: '#9CA3AF',
    fontSize: 14,
    fontFamily: 'Ubuntu-Medium',
  },
  cardDescLight: {
    color: '#6B7280',
  },
});

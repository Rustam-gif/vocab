import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  DeviceEventEmitter,
  Animated,
  Easing,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { levels } from '../quiz/data/levels';
import { SetProgressService } from '../../services/SetProgressService';
import { useAppStore } from '../../lib/store';
import { LinearGradient } from '../../lib/LinearGradient';
import { getVisibleLevels } from './diagnostic-words';

const SELECTED_LEVEL_KEY = '@engniter.selectedLevel';
const HIGHEST_LEVEL_KEY = '@engniter.highestLevel';
const PLACEMENT_LEVEL_KEY = '@engniter.placementLevel';

export default function PlacementResult() {
  const router = useRouter();
  const params = useLocalSearchParams<{
    // New flow params
    selectedLevel?: string;
    determinedLevel?: string;
    appLevel?: string;
    knownCount?: string;
    totalCount?: string;
    // Legacy params (for old test.tsx if still used)
    levelId?: string;
    ability?: string;
    confidence?: string;
    band?: string;
    early?: string;
    q?: string;
  }>();

  const themeName = useAppStore(s => s.theme);
  const isLight = themeName === 'light';

  // Animation refs
  const fadeIn = useRef(new Animated.Value(0)).current;
  const slideUp = useRef(new Animated.Value(40)).current;
  const scaleAnim = useRef(new Animated.Value(0.8)).current;
  const pulse = useRef(new Animated.Value(1)).current;

  // Determine which flow we're using
  const isNewFlow = !!params.determinedLevel;

  // Extract values based on flow
  const determinedLevel = params.determinedLevel || 'beginner';
  const appLevel = params.appLevel || params.levelId || 'beginner';
  const knownCount = parseInt(params.knownCount || '0', 10);
  const totalCount = parseInt(params.totalCount || '12', 10);

  useEffect(() => {
    // Entry animations
    Animated.parallel([
      Animated.timing(fadeIn, {
        toValue: 1,
        duration: 600,
        useNativeDriver: true,
      }),
      Animated.timing(slideUp, {
        toValue: 0,
        duration: 600,
        easing: Easing.out(Easing.back(1.2)),
        useNativeDriver: true,
      }),
      Animated.spring(scaleAnim, {
        toValue: 1,
        friction: 8,
        tension: 40,
        useNativeDriver: true,
      }),
    ]).start();

    // Pulse animation for button
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, {
          toValue: 1.03,
          duration: 800,
          easing: Easing.out(Easing.quad),
          useNativeDriver: true,
        }),
        Animated.timing(pulse, {
          toValue: 1,
          duration: 800,
          easing: Easing.inOut(Easing.quad),
          useNativeDriver: true,
        }),
      ])
    ).start();
  }, []);

  useEffect(() => {
    // Persist recommended level
    AsyncStorage.setItem(SELECTED_LEVEL_KEY, appLevel).catch(() => {});

    // Store placement level for filtering
    if (isNewFlow) {
      AsyncStorage.setItem(PLACEMENT_LEVEL_KEY, determinedLevel).catch(() => {});
    }

    // Update highest achieved core level and mark lower levels as completed
    (async () => {
      try {
        const coreOrder = [
          'beginner',
          'intermediate',
          'upper-intermediate',
          'advanced',
          'advanced-plus',
          'proficient',
        ];
        const weight = (id?: string) => {
          const i = id ? coreOrder.indexOf(id) : -1;
          return i >= 0 ? i : -1;
        };
        const existing = await AsyncStorage.getItem(HIGHEST_LEVEL_KEY);
        const currentW = weight(appLevel);
        const existingW = weight(existing || undefined);
        if (currentW >= 0 && currentW > existingW) {
          await AsyncStorage.setItem(HIGHEST_LEVEL_KEY, appLevel);
        }

        // Mark all lower core levels as completed
        await SetProgressService.initialize();
        const recIndex = coreOrder.indexOf(appLevel);
        if (recIndex > 0) {
          const toComplete = coreOrder.slice(0, recIndex);
          for (const lvlId of toComplete) {
            const lvl = levels.find(l => l.id === lvlId);
            if (!lvl) continue;
            for (const s of lvl.sets) {
              try {
                await SetProgressService.markCompleted(lvl.id, s.id, 100);
              } catch {}
            }
          }
        }
      } catch {}
    })();
  }, [appLevel, determinedLevel, isNewFlow]);

  const handleContinue = () => {
    DeviceEventEmitter.emit('NAV_VISIBILITY', 'show');
    DeviceEventEmitter.emit('LEVEL_SELECTED', appLevel);
    router.replace('/');
  };

  const handleRetake = () => {
    router.replace('/placement/level-select');
  };

  const levelLabel = getLevelLabel(determinedLevel);
  const levelEmoji = getLevelEmoji(determinedLevel);

  return (
    <View style={[styles.container, isLight && styles.containerLight]}>
      <SafeAreaView style={styles.safe}>
        <Animated.View
          style={[
            styles.content,
            {
              opacity: fadeIn,
              transform: [{ translateY: slideUp }, { scale: scaleAnim }],
            },
          ]}
        >
          {/* Emoji */}
          <Text style={styles.emoji}>{levelEmoji}</Text>

          {/* Title */}
          <Text style={[styles.title, isLight && styles.titleLight]}>
            Your Level
          </Text>

          {/* Level */}
          <Text style={[styles.level, isLight && styles.levelLight]}>
            {levelLabel}
          </Text>

          {/* Stats */}
          {isNewFlow && (
            <View style={[styles.statsCard, isLight && styles.statsCardLight]}>
              <View style={styles.statRow}>
                <Text style={[styles.statLabel, isLight && styles.statLabelLight]}>
                  Words Known
                </Text>
                <Text style={[styles.statValue, isLight && styles.statValueLight]}>
                  {knownCount} / {totalCount}
                </Text>
              </View>
              <View style={styles.statRow}>
                <Text style={[styles.statLabel, isLight && styles.statLabelLight]}>
                  Starting Level
                </Text>
                <Text style={[styles.statValue, isLight && styles.statValueLight]}>
                  {appLevel.charAt(0).toUpperCase() + appLevel.slice(1).replace('-', ' ')}
                </Text>
              </View>
            </View>
          )}

          {/* Message */}
          <Text style={[styles.message, isLight && styles.messageLight]}>
            {getMessage(determinedLevel)}
          </Text>

          {/* CTA Button */}
          <TouchableOpacity onPress={handleContinue} activeOpacity={0.9}>
            <Animated.View style={{ transform: [{ scale: pulse }] }}>
              <LinearGradient
                colors={isLight ? ['#F8B070', '#F2935C'] : ['#7CE7A0', '#1a8d87']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.cta}
              >
                <Text style={styles.ctaText}>Start Learning</Text>
              </LinearGradient>
            </Animated.View>
          </TouchableOpacity>

          {/* Retake link */}
          <TouchableOpacity onPress={handleRetake} style={styles.retakeBtn}>
            <Text style={[styles.retakeText, isLight && styles.retakeTextLight]}>
              Retake Assessment
            </Text>
          </TouchableOpacity>
        </Animated.View>
      </SafeAreaView>
    </View>
  );
}

function getLevelLabel(level: string): string {
  switch (level) {
    case 'beginner':
      return 'Beginner';
    case 'intermediate':
      return 'Intermediate';
    case 'advanced':
      return 'Advanced';
    default:
      return level.charAt(0).toUpperCase() + level.slice(1);
  }
}

function getLevelEmoji(level: string): string {
  switch (level) {
    case 'beginner':
      return '🌱';
    case 'intermediate':
      return '📚';
    case 'advanced':
      return '🎯';
    default:
      return '🚀';
  }
}

function getMessage(level: string): string {
  switch (level) {
    case 'beginner':
      return "Great start! We'll begin with foundational vocabulary to build your confidence.";
    case 'intermediate':
      return "Nice! You have a solid foundation. We'll help you expand to conversational fluency.";
    case 'advanced':
      return "Impressive! You have strong vocabulary. We'll focus on advanced and nuanced words.";
    default:
      return "Let's get started with vocabulary practice!";
  }
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
    justifyContent: 'center',
    padding: 24,
  },
  content: {
    alignItems: 'center',
  },
  emoji: {
    fontSize: 64,
    marginBottom: 16,
  },
  title: {
    color: '#9CA3AF',
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
    fontFamily: 'Ubuntu-Medium',
  },
  titleLight: {
    color: '#6B7280',
  },
  level: {
    color: '#fff',
    fontSize: 36,
    fontWeight: '600',
    marginBottom: 24,
    fontFamily: 'Ubuntu-Medium',
  },
  levelLight: {
    color: '#111827',
  },
  statsCard: {
    backgroundColor: '#2A2D2D',
    borderRadius: 16,
    padding: 16,
    width: '100%',
    marginBottom: 24,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.06)',
  },
  statsCardLight: {
    backgroundColor: '#FFFFFF',
    borderColor: '#E5E7EB',
  },
  statRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
  },
  statLabel: {
    color: '#9CA3AF',
    fontSize: 14,
    fontFamily: 'Ubuntu-Medium',
  },
  statLabelLight: {
    color: '#6B7280',
  },
  statValue: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
    fontFamily: 'Ubuntu-Medium',
  },
  statValueLight: {
    color: '#111827',
  },
  message: {
    color: '#9CA3AF',
    fontSize: 15,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 32,
    paddingHorizontal: 20,
    fontFamily: 'Ubuntu-Medium',
  },
  messageLight: {
    color: '#6B7280',
  },
  cta: {
    paddingVertical: 16,
    paddingHorizontal: 48,
    borderRadius: 14,
    alignItems: 'center',
  },
  ctaText: {
    color: '#0D1117',
    fontWeight: '600',
    fontSize: 17,
    fontFamily: 'Ubuntu-Medium',
  },
  retakeBtn: {
    marginTop: 20,
    padding: 12,
  },
  retakeText: {
    color: '#9CA3AF',
    fontSize: 14,
    fontWeight: '600',
    fontFamily: 'Ubuntu-Medium',
  },
  retakeTextLight: {
    color: '#6B7280',
  },
});

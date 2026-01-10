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
import LottieView from 'lottie-react-native';
import { useAppStore } from '../../lib/store';

const SELECTED_LEVEL_KEY = '@engniter.selectedLevel';
const HIGHEST_LEVEL_KEY = '@engniter.highestLevel';
const PLACEMENT_LEVEL_KEY = '@engniter.placementLevel';

const ACCENT_ORANGE = '#F2935C';
const ACCENT_PINK = '#F25E86';
const BG_DARK = '#1E1E1E';

export default function PlacementResult() {
  const router = useRouter();
  const params = useLocalSearchParams<{
    selectedLevel?: string;
    determinedLevel?: string;
    appLevel?: string;
    knownCount?: string;
    totalCount?: string;
    levelId?: string;
    ability?: string;
    confidence?: string;
    band?: string;
    early?: string;
    q?: string;
  }>();

  // Keep hook count consistent
  const _theme = useAppStore(s => s.theme);

  // Animation refs
  const fadeIn = useRef(new Animated.Value(0)).current;
  const slideUp = useRef(new Animated.Value(40)).current;
  const scaleAnim = useRef(new Animated.Value(0.8)).current;
  const pulse = useRef(new Animated.Value(1)).current;

  const isNewFlow = !!params.determinedLevel;
  const determinedLevel = params.determinedLevel || 'beginner';
  const appLevel = params.appLevel || params.levelId || 'beginner';
  const knownCount = parseInt(params.knownCount || '0', 10);
  const totalCount = parseInt(params.totalCount || '12', 10);

  useEffect(() => {
    // Hide nav bar on this screen
    DeviceEventEmitter.emit('NAV_VISIBILITY', 'hide');

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
  }, []);

  useEffect(() => {
    AsyncStorage.setItem(SELECTED_LEVEL_KEY, appLevel).catch(() => {});

    if (isNewFlow) {
      AsyncStorage.setItem(PLACEMENT_LEVEL_KEY, determinedLevel).catch(() => {});
    }

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
    // Navigate to the learn screen instead of home
    router.replace('/quiz/learn');
  };

  return (
    <View style={styles.container}>
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
          {/* Success Icon */}
          <View style={styles.iconWrap}>
            <LottieView
              source={require('../../assets/lottie/success1.json')}
              autoPlay
              loop={false}
              style={styles.successAnimation}
            />
          </View>

          {/* Motivational Title */}
          <Text style={styles.title}>You're All Set!</Text>

          {/* Motivational Message */}
          <Text style={styles.subtitle}>
            Your personalized learning path is ready
          </Text>

          {/* Encouragement */}
          <View style={styles.encouragementCard}>
            <Text style={styles.encouragementText}>
              We've customized your vocabulary journey based on your responses.
              Every expert was once a beginner — let's start building your word power!
            </Text>
          </View>

          {/* Stats hint */}
          <View style={styles.statsHint}>
            <Text style={styles.statsHintText}>
              You recognized <Text style={styles.statsHighlight}>{knownCount}</Text> out of {totalCount} words
            </Text>
          </View>

          {/* CTA Button */}
          <TouchableOpacity onPress={handleContinue} activeOpacity={0.9} style={styles.ctaWrap}>
            <View style={styles.cta}>
              <Text style={styles.ctaText}>Start Learning</Text>
            </View>
          </TouchableOpacity>
        </Animated.View>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: BG_DARK,
  },
  safe: {
    flex: 1,
    justifyContent: 'center',
    padding: 24,
  },
  content: {
    alignItems: 'center',
  },
  iconWrap: {
    width: 140,
    height: 140,
    marginBottom: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  successAnimation: {
    width: 140,
    height: 140,
  },
  title: {
    color: '#F9FAFB',
    fontSize: 32,
    fontWeight: '700',
    marginBottom: 8,
    letterSpacing: -0.5,
  },
  subtitle: {
    color: ACCENT_ORANGE,
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 32,
  },
  encouragementCard: {
    backgroundColor: 'rgba(242, 147, 92, 0.08)',
    borderWidth: 1,
    borderColor: 'rgba(242, 147, 92, 0.15)',
    borderRadius: 16,
    padding: 20,
    marginBottom: 24,
  },
  encouragementText: {
    color: '#D1D5DB',
    fontSize: 15,
    textAlign: 'center',
    lineHeight: 24,
  },
  statsHint: {
    marginBottom: 32,
  },
  statsHintText: {
    color: '#6B7280',
    fontSize: 14,
  },
  statsHighlight: {
    color: ACCENT_ORANGE,
    fontWeight: '700',
  },
  ctaWrap: {
    width: '100%',
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: ACCENT_PINK,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
  },
  cta: {
    paddingVertical: 18,
    alignItems: 'center',
    borderRadius: 16,
    backgroundColor: ACCENT_PINK,
  },
  ctaText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 18,
    letterSpacing: 0.3,
  },
});

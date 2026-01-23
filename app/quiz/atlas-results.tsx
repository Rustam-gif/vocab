import React, { useEffect, useMemo, useRef, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Animated, Platform, DeviceEventEmitter } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { ProgressService } from '../../services/ProgressService';
import { useAppStore } from '../../lib/store';
import { levels } from './data/levels';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from '../../lib/LinearGradient';
import ReactNativeHapticFeedback from '../../lib/haptics';
import LottieView from 'lottie-react-native';

// Colors matching Learn section
const DARK_BG = '#1B263B';
const TOTAL_HEARTS = 5;

// Haptic feedback helper with intensity levels
const triggerHaptic = (type: 'pop' | 'medium' | 'heavy' | 'success' | 'soft' = 'pop') => {
  if (Platform.OS !== 'ios') return;
  const options = { enableVibrateFallback: false, ignoreAndroidSystemSettings: false };
  try {
    switch (type) {
      case 'pop':
        ReactNativeHapticFeedback.trigger('impactLight', options);
        break;
      case 'medium':
        ReactNativeHapticFeedback.trigger('impactMedium', options);
        break;
      case 'heavy':
        ReactNativeHapticFeedback.trigger('impactHeavy', options);
        break;
      case 'success':
        ReactNativeHapticFeedback.trigger('notificationSuccess', options);
        break;
      case 'soft':
        ReactNativeHapticFeedback.trigger('selection', options);
        break;
    }
  } catch {}
};

export default function AtlasResults() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { loadProgress } = useAppStore();
  const themeName = useAppStore(s => s.theme);
  const isLight = themeName === 'light';
  const { score, totalQuestions, setId, levelId, hearts: heartsParam, exerciseType } = useLocalSearchParams<{
    score?: string;
    totalQuestions?: string;
    setId?: string;
    levelId?: string;
    hearts?: string;
    exerciseType?: string;
  }>();

  // Parse hearts from params (default to 5 if not provided)
  const heartsRemaining = useMemo(() => {
    const parsed = parseInt(heartsParam || '5', 10);
    return Number.isNaN(parsed) ? 5 : Math.max(0, Math.min(5, parsed));
  }, [heartsParam]);

  // Simple fade-in animation
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.8)).current;

  // Heart animations - one animated value per heart
  const heartAnims = useRef(
    Array(5).fill(0).map(() => ({
      opacity: new Animated.Value(0),
      scale: new Animated.Value(0),
    }))
  ).current;

  useEffect(() => {
    // Main screen fade-in
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 400,
        useNativeDriver: true,
      }),
      Animated.spring(scaleAnim, {
        toValue: 1,
        friction: 8,
        tension: 40,
        useNativeDriver: true,
      }),
    ]).start();

    // Staggered heart animations - pop in one after another
    const heartAnimations = heartAnims.slice(0, heartsRemaining).map((anim, index) =>
      Animated.sequence([
        Animated.delay(800 + index * 200), // Start after screen appears, 200ms between each heart
        Animated.parallel([
          Animated.timing(anim.opacity, {
            toValue: 1,
            duration: 300,
            useNativeDriver: true,
          }),
          Animated.spring(anim.scale, {
            toValue: 1,
            friction: 6,
            tension: 60,
            useNativeDriver: true,
          }),
        ]),
      ])
    );

    Animated.parallel(heartAnimations).start();

    // Celebration haptic pattern - victory sequence!
    // Extended and intense celebration for completing the quiz
    const hapticPattern = [
      // Phase 1: Victory announcement (0-600ms)
      { delay: 0, type: 'heavy' as const },
      { delay: 150, type: 'medium' as const },
      { delay: 300, type: 'heavy' as const },
      { delay: 450, type: 'medium' as const },
      { delay: 600, type: 'heavy' as const },

      // Phase 2: Celebration pulse (900-1800ms)
      { delay: 900, type: 'medium' as const },
      { delay: 1050, type: 'pop' as const },
      { delay: 1200, type: 'medium' as const },
      { delay: 1350, type: 'pop' as const },
      { delay: 1500, type: 'medium' as const },
      { delay: 1650, type: 'heavy' as const },

      // Phase 3: Building excitement (2000-3000ms)
      { delay: 2000, type: 'pop' as const },
      { delay: 2150, type: 'medium' as const },
      { delay: 2300, type: 'pop' as const },
      { delay: 2450, type: 'medium' as const },
      { delay: 2600, type: 'heavy' as const },
      { delay: 2800, type: 'medium' as const },

      // Phase 4: Fireworks burst (3200-4200ms)
      { delay: 3200, type: 'medium' as const },
      { delay: 3350, type: 'heavy' as const },
      { delay: 3500, type: 'medium' as const },
      { delay: 3650, type: 'heavy' as const },
      { delay: 3800, type: 'medium' as const },
      { delay: 3950, type: 'heavy' as const },
      { delay: 4100, type: 'heavy' as const },

      // Phase 5: Grand finale (4400-5500ms)
      { delay: 4400, type: 'heavy' as const },
      { delay: 4550, type: 'heavy' as const },
      { delay: 4700, type: 'heavy' as const },
      { delay: 4900, type: 'heavy' as const },
      { delay: 5100, type: 'heavy' as const },
      { delay: 5300, type: 'success' as const },
    ];

    const timeouts = hapticPattern.map(({ delay, type }) =>
      setTimeout(() => triggerHaptic(type), delay)
    );

    return () => timeouts.forEach(t => clearTimeout(t));
  }, [fadeAnim, scaleAnim, heartsRemaining, heartAnims]);

  const handleDone = async () => {
    console.log('[Results] 🎯 handleDone called with levelId:', levelId, 'setId:', setId);

    try {
      const correct = parseInt(score || '0', 10);
      const total = parseInt(totalQuestions || '0', 10);
      const type = exerciseType || 'mcq';

      if (total > 0) {
        const result = await ProgressService.recordExerciseCompletion(
          type,
          correct,
          total,
          0
        );

        console.log(`[Results] XP Awarded: +${result.xpGained} XP (Level ${result.newLevel})`);
        await loadProgress();
      }
    } catch (error) {
      console.error('[Results] Failed to award XP:', error);
    }

    // Emit event to trigger spacecraft animation on Learn screen
    if (setId) {
      DeviceEventEmitter.emit('SPACECRAFT_ANIMATE', { setId: String(setId) });
      console.log('[Results] ✅ Emitted SPACECRAFT_ANIMATE event for setId:', setId);
    }

    // Navigate back to existing Learn screen (avoid unmounting)
    router.back();
  };

  const getSuccessMessage = () => {
    if (heartsRemaining === TOTAL_HEARTS) return 'Perfect!';
    if (heartsRemaining >= 4) return 'Excellent!';
    if (heartsRemaining >= 3) return 'Well Done!';
    if (heartsRemaining >= 2) return 'Good Job!';
    if (heartsRemaining >= 1) return 'Keep Going!';
    return 'Try Again!';
  };

  const renderHearts = () => {
    // Show exactly heartsRemaining number of hearts with staggered animation
    const hearts = [];
    for (let i = 0; i < heartsRemaining; i++) {
      hearts.push(
        <Animated.View
          key={i}
          style={{
            opacity: heartAnims[i].opacity,
            transform: [{ scale: heartAnims[i].scale }],
          }}
        >
          <LottieView
            source={require('../../assets/lottie/learn/hearts_result.json')}
            autoPlay
            loop={false}
            style={{ width: 180, height: 180, marginHorizontal: -55 }}
          />
        </Animated.View>
      );
    }
    return hearts;
  };

  // Background gradient colors
  const gradientColors = isLight
    ? ['#FFFFFF', '#F5F5F5', '#EBEBEB']
    : ['#1B263B', '#1B263B', '#0D1B2A'];

  return (
    <View style={[styles.container, isLight && styles.containerLight]}>
      {/* Background fill for notch */}
      <View style={{ position: 'absolute', top: 0, left: 0, right: 0, height: insets.top, backgroundColor: isLight ? '#FFFFFF' : '#1B263B' }} />

      <LinearGradient
        colors={gradientColors}
        start={{ x: 0.5, y: 0 }}
        end={{ x: 0.5, y: 1 }}
        style={styles.gradient}
      >
        <Animated.View
          style={[
            styles.content,
            { opacity: fadeAnim, transform: [{ scale: scaleAnim }] }
          ]}
        >
          {/* Finish animation */}
          <View style={styles.checkSection}>
            <LottieView
              source={require('../../assets/lottie/learn/finish.lottie')}
              autoPlay
              loop={false}
              style={{ width: 220, height: 220 }}
            />
          </View>

          {/* Success message */}
          <Text style={[styles.successMessage, isLight && styles.successMessageLight]}>
            {getSuccessMessage()}
          </Text>

          {/* Words Mastered - redesigned */}
          <View style={styles.wordsMasteredContainer}>
            <Text style={[styles.wordsMasteredNumber, isLight && styles.wordsMasteredNumberLight]}>
              5
            </Text>
            <Text style={[styles.wordsMasteredLabel, isLight && styles.wordsMasteredLabelLight]}>
              New Words Mastered
            </Text>
          </View>

          {/* Hearts display - no background card */}
          <View style={styles.heartsContainer}>
            <View style={styles.heartsRow}>
              {renderHearts()}
            </View>
          </View>

          {/* Buttons */}
          <View style={styles.buttonsContainer}>
            {/* Continue button */}
            <TouchableOpacity
              style={styles.continueButton}
              onPress={handleDone}
              activeOpacity={0.8}
            >
              <Text style={styles.continueButtonText}>CONTINUE</Text>
            </TouchableOpacity>
          </View>
        </Animated.View>
      </LinearGradient>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: DARK_BG,
  },
  containerLight: {
    backgroundColor: '#F8F8F8',
  },
  gradient: {
    flex: 1,
  },
  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
  },

  // Finish animation section
  checkSection: {
    width: 220,
    height: 220,
    marginBottom: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },

  // Success message
  successMessage: {
    fontSize: 32,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 16,
    textAlign: 'center',
    fontFamily: 'Ubuntu-Bold',
  },
  successMessageLight: {
    color: '#1B263B',
  },

  // Words Mastered - redesigned
  wordsMasteredContainer: {
    alignItems: 'center',
    marginBottom: 32,
  },
  wordsMasteredNumber: {
    fontSize: 56,
    fontWeight: '700',
    color: '#4ED9CB',
    fontFamily: 'Ubuntu-Bold',
    marginBottom: 4,
  },
  wordsMasteredNumberLight: {
    color: '#437F76',
  },
  wordsMasteredLabel: {
    fontSize: 18,
    fontWeight: '600',
    color: 'rgba(255, 255, 255, 0.9)',
    fontFamily: 'Ubuntu-Medium',
  },
  wordsMasteredLabelLight: {
    color: '#1B263B',
  },

  // Hearts container - no background
  heartsContainer: {
    alignItems: 'center',
    marginBottom: 48,
  },
  heartsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  heartsLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: 'rgba(255,255,255,0.7)',
    textAlign: 'center',
    fontFamily: 'Ubuntu-Medium',
  },
  heartsLabelLight: {
    color: '#6B7280',
  },

  // Buttons container
  buttonsContainer: {
    width: '100%',
    alignItems: 'center',
    gap: 16,
  },

  // Continue button
  continueButton: {
    paddingHorizontal: 48,
    paddingVertical: 16,
    borderRadius: 25,
    backgroundColor: '#F25E86',
    borderWidth: 3,
    borderColor: '#0D1B2A',
    shadowColor: '#000',
    shadowOffset: { width: 2, height: 3 },
    shadowOpacity: 0.4,
    shadowRadius: 0,
    elevation: 5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  continueButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
    letterSpacing: 1.5,
    fontFamily: 'Ubuntu-Bold',
  },
});

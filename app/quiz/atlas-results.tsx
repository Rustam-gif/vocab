import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { View, Text, StyleSheet, SafeAreaView, TouchableOpacity, Animated, Easing } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import LottieView from 'lottie-react-native';
import { BookOpen, CheckCircle } from 'lucide-react-native';
import { ProgressService } from '../../services/ProgressService';
import { useAppStore } from '../../lib/store';
import { levels } from './data/levels';

const ACCENT = '#F8B070';
const CORRECT_COLOR = '#437F76';
const HEART_COLOR = '#E53935';
const TOTAL_HEARTS = 5;

export default function AtlasResults() {
  const router = useRouter();
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

  // Animation values for each heart
  const heartAnims = useRef(
    Array.from({ length: TOTAL_HEARTS }, () => ({
      scale: new Animated.Value(0),
      opacity: new Animated.Value(0),
    }))
  ).current;
  const [showDoneButton, setShowDoneButton] = useState(false);
  const [hideLottie, setHideLottie] = useState(false);
  const [heartsAnimated, setHeartsAnimated] = useState(false);
  const scaleAnim = useRef(new Animated.Value(0)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;
  const buttonsOpacity = useRef(new Animated.Value(0)).current;
  const buttonsTranslateY = useRef(new Animated.Value(8)).current;
  const lottieRef = useRef<LottieView>(null);
  const lottieStarted = useRef(false);
  const playLottieFromStart = useCallback(() => {
    // Ensure we start exactly at frame 0 every time and only once
    if (lottieStarted.current) return;
    lottieStarted.current = true;
    try {
      lottieRef.current?.reset?.();
      // Defer to next frame to ensure layout is ready
      requestAnimationFrame(() => {
        // Play full animation from start; no hard-coded end frame
        lottieRef.current?.play?.();
      });
    } catch {}
  }, []);

  // Animate hearts appearing one by one with bounce effect
  const animateHearts = useCallback(() => {
    if (heartsAnimated) return;
    setHeartsAnimated(true);

    // Staggered animation for each heart
    const animations = heartAnims.map((anim, index) => {
      const isActive = index < heartsRemaining;
      return Animated.sequence([
        Animated.delay(index * 150), // Stagger each heart
        Animated.parallel([
          Animated.spring(anim.scale, {
            toValue: isActive ? 1 : 0.8,
            friction: 4,
            tension: 100,
            useNativeDriver: true,
          }),
          Animated.timing(anim.opacity, {
            toValue: 1,
            duration: 200,
            useNativeDriver: true,
          }),
        ]),
        // Extra bounce for active hearts
        ...(isActive ? [
          Animated.sequence([
            Animated.timing(anim.scale, {
              toValue: 1.2,
              duration: 150,
              easing: Easing.out(Easing.cubic),
              useNativeDriver: true,
            }),
            Animated.timing(anim.scale, {
              toValue: 1,
              duration: 150,
              easing: Easing.out(Easing.cubic),
              useNativeDriver: true,
            }),
          ]),
        ] : []),
      ]);
    });

    Animated.parallel(animations).start();
  }, [heartAnims, heartsRemaining, heartsAnimated]);

  useEffect(() => {
    // Start animation immediately
    const sequence = Animated.parallel([
      Animated.timing(scaleAnim, {
        toValue: 1,
        duration: 1170,
        easing: Easing.out(Easing.back(1.1)),
        useNativeDriver: true,
      }),
      Animated.timing(opacityAnim, {
        toValue: 1,
        duration: 1170,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
    ]);

    // Reset visibility/animation states on enter
    setHideLottie(false);
    lottieStarted.current = false;
    setHeartsAnimated(false);
    // Reset heart animations
    heartAnims.forEach(anim => {
      anim.scale.setValue(0);
      anim.opacity.setValue(0);
    });

    sequence.start(() => {
      // Start from the beginning reliably
      playLottieFromStart();
      // Fallback: if Lottie never calls onAnimationFinish (e.g., device glitch), reveal UI anyway
      const fallback = setTimeout(() => {
        setHideLottie(true);
        setShowDoneButton(true);
        animateHearts();
      }, 2500);
      return () => clearTimeout(fallback);
    });

    return () => {
      // Cleanup animation state so next mount is fresh
      try { lottieRef.current?.reset?.(); } catch {}
    };
  }, [scaleAnim, opacityAnim, playLottieFromStart, heartAnims, animateHearts]);

  // Animate buttons in smoothly once they are revealed
  useEffect(() => {
    if (showDoneButton) {
      buttonsOpacity.setValue(0);
      buttonsTranslateY.setValue(8);
      Animated.parallel([
        Animated.timing(buttonsOpacity, {
          toValue: 1,
          duration: 280,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),
        Animated.timing(buttonsTranslateY, {
          toValue: 0,
          duration: 280,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [showDoneButton, buttonsOpacity, buttonsTranslateY]);

  const handleDone = async () => {
    // Award XP for quiz completion
    try {
      const correct = parseInt(score || '0', 10);
      const total = parseInt(totalQuestions || '0', 10);
      const type = exerciseType || 'mcq'; // Default to MCQ if not specified
      
      if (total > 0) {
        const result = await ProgressService.recordExerciseCompletion(
          type,
          correct,
          total,
          0 // Time tracking can be added later
        );
        
        console.log(`[Quiz Results] XP Awarded: +${result.xpGained} XP (Level ${result.newLevel})`);
        if (result.leveledUp) {
          console.log(`🎉 Level Up! Now Level ${result.newLevel}`);
        }
        
        // Refresh progress display
        await loadProgress();
      }
    } catch (error) {
      console.error('Failed to award XP:', error);
    }

    // Go to Learn section for the same level; replace history to avoid back to results
    if (levelId) {
      router.replace(`/quiz/learn?level=${levelId}`);
    } else {
      router.replace('/');
    }
  };

  // Compute the words for this set; handles both static sets and dynamically generated quiz sets
  const resolveWordsForSet = useCallback(() => {
    if (!levelId || !setId) return [] as any[];
    const level = levels.find(l => l.id === levelId);
    if (!level) return [] as any[];
    const set = level.sets.find(s => String(s.id) === String(setId));
    if (set?.words?.length) return set.words;

    // Dynamically inserted recap quizzes (quiz-1, quiz-2, ...)
    if (!/^quiz-\d+$/.test(String(setId))) return [] as any[];
    const baseSets = level.sets.filter(s => {
      const n = Number(s.id);
      const dropFirstTen = level.id === 'upper-intermediate' ? (isNaN(n) || n > 10) : true;
      return dropFirstTen && (s as any).type !== 'quiz';
    });
    const groupIndex = Math.max(1, parseInt(String(setId).split('-')[1], 10));
    const start = (groupIndex - 1) * 4;
    const group = baseSets.slice(start, start + 4);
    const words: any[] = [];
    group.forEach(g => {
      words.push(...(g.words || []).slice(0, 5));
    });
    return words;
  }, [levelId, setId]);

  const handleCreateStory = () => {
    // Use ALL words from the set; trim, filter empties, and de-duplicate
    const words = resolveWordsForSet();
    if (!words.length) return;

    const wordsToUse = Array.from(
      new Set(
        words
          .map(w => (typeof w.word === 'string' ? w.word.trim() : ''))
          .filter(Boolean)
      )
    );
    
    // Navigate to story exercise with words as query params.
    // Pass source so Back from Story goes Home instead of returning to Results.
    router.push({
      pathname: '/story/StoryExercise',
      params: { words: wordsToUse.join(','), from: 'results' }
    });
  };

  return (
    <SafeAreaView style={[styles.container, isLight && styles.containerLight]}>
      <View style={styles.content}>
        {!hideLottie ? (
          <Animated.View
            style={[
              styles.animationWrapper,
              {
                transform: [
                  {
                    scale: scaleAnim.interpolate({
                      inputRange: [0, 1],
                      outputRange: [0.45, 1],
                    }),
                  },
                ],
                opacity: opacityAnim,
              },
            ]}
          >
            <LottieView
              ref={lottieRef}
              source={require('../../assets/lottie/Check.json')}
              autoPlay={false}
              loop={false}
              style={styles.lottieAnimation}
              speed={0.6}
              resizeMode="contain"
              onLayout={playLottieFromStart}
              onAnimationFinish={() => {
                setHideLottie(true);
                setShowDoneButton(true);
                animateHearts();
              }}
            />
          </Animated.View>
        ) : (
          <Animated.View
            style={[
              styles.animationWrapper,
              {
                transform: [
                  {
                    scale: scaleAnim.interpolate({
                      inputRange: [0, 1],
                      outputRange: [0.45, 1],
                    }),
                  },
                ],
                opacity: opacityAnim,
              },
            ]}
          >
            <CheckCircle size={72} color={CORRECT_COLOR} />
          </Animated.View>
        )}
        <View style={styles.heartsSection}>
          <View style={styles.heartsRow}>
            {heartAnims.map((anim, index) => {
              const isActive = index < heartsRemaining;
              return (
                <Animated.Text
                  key={index}
                  style={[
                    styles.heartIcon,
                    {
                      opacity: anim.opacity,
                      transform: [{ scale: anim.scale }],
                    },
                    !isActive && styles.heartLost,
                  ]}
                >
                  {isActive ? '❤️' : '🤍'}
                </Animated.Text>
              );
            })}
          </View>
          <Text style={[styles.heartsLabel, isLight && styles.heartsLabelLight]}>
            {heartsRemaining === TOTAL_HEARTS
              ? 'Perfect! All Hearts!'
              : heartsRemaining > 0
              ? `${heartsRemaining} Heart${heartsRemaining !== 1 ? 's' : ''} Remaining`
              : 'No Hearts Left'}
          </Text>
        </View>
        <View style={styles.buttonContainer}>
          {showDoneButton ? (
            <Animated.View
              style={[
                styles.buttonsAnimated,
                { opacity: buttonsOpacity, transform: [{ translateY: buttonsTranslateY }] },
              ]}
            >
              <TouchableOpacity style={styles.primaryButton} onPress={handleDone}>
                <Text style={[styles.primaryButtonText, isLight && { color: '#111827' }]}>Done</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.storyButton} onPress={handleCreateStory}>
                <BookOpen size={22} color={isLight ? '#111827' : '#FFFFFF'} />
                <Text style={[styles.storyButtonText, isLight && { color: '#111827' }]}>Create Story with These Words</Text>
              </TouchableOpacity>
            </Animated.View>
          ) : (
            // Render invisible buttons to reserve exact layout space and prevent content shift
            <View style={styles.ghostContainer} pointerEvents="none">
              <View style={[styles.primaryButton, styles.ghost]}>
                <Text style={[styles.primaryButtonText, styles.ghostText]}>Done</Text>
              </View>
              <View style={[styles.storyButton, styles.ghost]}>
                <BookOpen size={22} color="#FFFFFF" />
                <Text style={[styles.storyButtonText, styles.ghostText]}>Create Story with These Words</Text>
              </View>
            </View>
          )}
        </View>
      </View>
    </SafeAreaView>
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
  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 18,
    paddingHorizontal: 32,
  },
  animationWrapper: {
    width: 110,
    height: 110,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  lottieAnimation: {
    width: 110,
    height: 110,
  },
  heartsSection: {
    alignItems: 'center',
    marginTop: 24,
    gap: 12,
  },
  heartsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  heartIcon: {
    fontSize: 36,
  },
  heartLost: {
    opacity: 0.5,
  },
  heartsLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: ACCENT,
    textAlign: 'center',
  },
  heartsLabelLight: {
    color: '#e28743',
  },
  buttonContainer: {
    marginTop: 94,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 16,
    width: '100%',
  },
  ghostContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    gap: 16,
    width: '100%',
  },
  buttonsAnimated: {
    alignItems: 'center',
    justifyContent: 'center',
    gap: 16,
    width: '100%',
  },
  ghost: {
    opacity: 0,
  },
  ghostText: {
    color: 'transparent',
  },
  primaryButton: {
    backgroundColor: ACCENT,
    paddingVertical: 16,
    paddingHorizontal: 32,
    borderRadius: 18,
    minWidth: 200,
    alignItems: 'center',
  },
  primaryButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  storyButton: {
    backgroundColor: '#437F76',
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 18,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    minWidth: 280,
    shadowColor: '#437F76',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  storyButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#FFFFFF',
  },
});

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { View, Text, StyleSheet, SafeAreaView, TouchableOpacity, Animated, Easing } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import LottieView from 'lottie-react-native';
import { BookOpen, CheckCircle } from 'lucide-react-native';
import { ProgressService } from '../../services/ProgressService';
import { useAppStore } from '../../lib/store';
import { levels } from './data/levels';

const ACCENT = '#F2935C';
const CORRECT_COLOR = '#437F76';

export default function AtlasResults() {
  const router = useRouter();
  const { loadProgress } = useAppStore();
  const { score, totalQuestions, setId, levelId, points, exerciseType } = useLocalSearchParams<{
    score?: string;
    totalQuestions?: string;
    setId?: string;
    levelId?: string;
    points?: string;
    exerciseType?: string;
  }>();

  const numericPoints = useMemo(() => {
    const parsedPoints = parseInt(points || '', 10);
    if (!Number.isNaN(parsedPoints)) return Math.max(0, parsedPoints);
    const correct = parseInt(score || '0', 10);
    const total = parseInt(totalQuestions || '0', 10);
    if (Number.isNaN(correct) || Number.isNaN(total) || total === 0) return Math.max(0, correct * 20);
    return Math.max(0, Math.round((correct / total) * 100));
  }, [points, score, totalQuestions]);

  const [displayPoints, setDisplayPoints] = useState(0);
  const [showDoneButton, setShowDoneButton] = useState(false);
  const [hideLottie, setHideLottie] = useState(false);
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

  useEffect(() => {
    setDisplayPoints(0);
    const target = Math.round(numericPoints);
    const step = target > 0 ? Math.max(1, Math.ceil(target / 40)) : 1;
    const interval = setInterval(() => {
      setDisplayPoints(prev => {
        const next = Math.min(prev + step, target);
        if (next >= target) {
          clearInterval(interval);
        }
        return next;
      });
    }, 20);
    return () => clearInterval(interval);
  }, [numericPoints]);

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

    sequence.start(() => {
      // Start from the beginning reliably
      playLottieFromStart();
    });
    
    return () => {
      // Cleanup animation state so next mount is fresh
      try { lottieRef.current?.reset?.(); } catch {}
    };
  }, [scaleAnim, opacityAnim, playLottieFromStart]);

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

  const handleCreateStory = () => {
    // Find the set and extract words
    if (!setId || !levelId) return;
    
    const level = levels.find(l => l.id === levelId);
    if (!level) return;
    
    const set = level.sets.find(s => String(s.id) === String(setId));
    if (!set || !set.words || set.words.length === 0) return;

    // Use ALL words from the set; trim, filter empties, and de-duplicate
    const wordsToUse = Array.from(
      new Set(
        set.words
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
    <SafeAreaView style={styles.container}>
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
        <View style={styles.scoreSection}>
          <Text style={styles.pointsText}>{displayPoints}</Text>
          <Text style={styles.label}>Score Achieved</Text>
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
                <Text style={styles.primaryButtonText}>Done</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.storyButton} onPress={handleCreateStory}>
                <BookOpen size={22} color="#FFFFFF" />
                <Text style={styles.storyButtonText}>Create Story with These Words</Text>
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
  label: {
    fontSize: 14,
    color: '#9CA3AF',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  pointsText: {
    fontSize: 38,
    fontWeight: '700',
    color: ACCENT,
  },
  scoreSection: {
    alignItems: 'center',
    marginTop: 24,
    gap: 8,
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

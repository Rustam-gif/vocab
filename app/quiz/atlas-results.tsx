import React, { useEffect, useMemo, useRef, useState } from 'react';
import { View, Text, StyleSheet, SafeAreaView, TouchableOpacity, Animated, Easing } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import LottieView from 'lottie-react-native';
import ProgressService from '../../services/ProgressService';

const ACCENT = '#F2935C';
const CORRECT_COLOR = '#437F76';

export default function AtlasResults() {
  const router = useRouter();
  const { score, totalQuestions, setId, levelId, points } = useLocalSearchParams<{
    score?: string;
    totalQuestions?: string;
    setId?: string;
    levelId?: string;
    points?: string;
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
  const scaleAnim = useRef(new Animated.Value(0)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;
  const lottieRef = useRef<LottieView>(null);

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
    
    sequence.start(() => {
      lottieRef.current?.reset?.();
      lottieRef.current?.play?.();
    });
    
    // Show Done button after 2 seconds
    const buttonTimer = setTimeout(() => {
      setShowDoneButton(true);
    }, 2000);
    
    return () => clearTimeout(buttonTimer);
  }, [scaleAnim, opacityAnim]);

  const handleDone = async () => {
    // Save the score to ProgressService
    if (setId) {
      try {
        const progressService = ProgressService.getInstance();
        await progressService.initialize();
        const bestScore = Math.round(Math.max(0, Math.min(100, numericPoints)));
        await progressService.completeSet(
          setId,
          bestScore,
          100
        );
        console.log('Score saved:', { setId, score: bestScore });
      } catch (error) {
        console.error('Failed to save score:', error);
      }
    }

    // Navigate back to learn screen
    if (levelId) {
      router.replace(`/quiz/learn?level=${levelId}`);
    } else {
      router.replace('/');
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
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
            style={styles.lottieOverlay}
            speed={0.6}
          />
        </Animated.View>
        <View style={styles.scoreSection}>
          <Text style={styles.pointsText}>{displayPoints}</Text>
          <Text style={styles.label}>Score Achieved</Text>
        </View>
        <View style={styles.buttonContainer}>
          {showDoneButton ? (
            <TouchableOpacity style={styles.primaryButton} onPress={handleDone}>
              <Text style={styles.primaryButtonText}>Done</Text>
            </TouchableOpacity>
          ) : (
            <View style={styles.buttonPlaceholder} />
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
  },
  lottieOverlay: {
    ...StyleSheet.absoluteFillObject,
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
  },
  buttonPlaceholder: {
    height: 50,
    width: 100,
    opacity: 0,
  },
  primaryButton: {
    backgroundColor: ACCENT,
    paddingVertical: 16,
    paddingHorizontal: 32,
    borderRadius: 18,
  },
  primaryButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
});

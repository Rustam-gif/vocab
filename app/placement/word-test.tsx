import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Dimensions,
  DeviceEventEmitter,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useAppStore } from '../../lib/store';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  runOnJS,
  interpolate,
  Extrapolate,
} from 'react-native-reanimated';
import { Gesture, GestureDetector, GestureHandlerRootView } from 'react-native-gesture-handler';
import { DiagnosticWord, getShuffledWords, calculateLevel, mapToAppLevel } from './diagnostic-words';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const SWIPE_THRESHOLD = SCREEN_WIDTH * 0.25;

export default function WordTest() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const selectedLevel = (params.selectedLevel as string) || 'beginner';

  const themeName = useAppStore(s => s.theme);
  const isLight = themeName === 'light';

  const [words] = useState<DiagnosticWord[]>(() => getShuffledWords());
  const [currentIndex, setCurrentIndex] = useState(0);
  const [knownWords, setKnownWords] = useState<DiagnosticWord[]>([]);
  const [isAnimating, setIsAnimating] = useState(false);

  // Animation values
  const translateX = useSharedValue(0);
  const translateY = useSharedValue(0);
  const cardOpacity = useSharedValue(1);
  const scale = useSharedValue(1);

  useEffect(() => {
    DeviceEventEmitter.emit('NAV_VISIBILITY', 'hide');
    return () => DeviceEventEmitter.emit('NAV_VISIBILITY', 'show');
  }, []);

  const goToResult = useCallback((known: DiagnosticWord[]) => {
    const determinedLevel = calculateLevel(known);
    const appLevel = mapToAppLevel(determinedLevel);

    router.replace({
      pathname: '/placement/result',
      params: {
        selectedLevel,
        determinedLevel,
        appLevel,
        knownCount: known.length.toString(),
        totalCount: words.length.toString(),
      },
    });
  }, [router, selectedLevel, words.length]);

  const handleSwipeComplete = useCallback((direction: 'left' | 'right') => {
    const currentWord = words[currentIndex];

    let newKnownWords = knownWords;
    if (direction === 'right') {
      // User knows this word
      newKnownWords = [...knownWords, currentWord];
      setKnownWords(newKnownWords);
    }

    if (currentIndex >= words.length - 1) {
      // Last card - go to results
      goToResult(direction === 'right' ? newKnownWords : knownWords);
    } else {
      // Next card
      setCurrentIndex(prev => prev + 1);
      // Reset animation values for next card
      translateX.value = 0;
      translateY.value = 0;
      cardOpacity.value = 1;
      scale.value = 1;
      setIsAnimating(false);
    }
  }, [currentIndex, words, knownWords, goToResult, translateX, translateY, cardOpacity, scale]);

  const panGesture = Gesture.Pan()
    .enabled(!isAnimating)
    .onUpdate((event) => {
      translateX.value = event.translationX;
      translateY.value = event.translationY * 0.5;
      scale.value = interpolate(
        Math.abs(event.translationX),
        [0, SCREEN_WIDTH / 2],
        [1, 0.95],
        Extrapolate.CLAMP
      );
    })
    .onEnd((event) => {
      if (Math.abs(event.translationX) > SWIPE_THRESHOLD) {
        // Swipe completed
        const direction = event.translationX > 0 ? 'right' : 'left';
        setIsAnimating(true);

        translateX.value = withTiming(
          direction === 'right' ? SCREEN_WIDTH * 1.5 : -SCREEN_WIDTH * 1.5,
          { duration: 300 },
          () => {
            runOnJS(handleSwipeComplete)(direction);
          }
        );
        cardOpacity.value = withTiming(0, { duration: 250 });
      } else {
        // Return to center
        translateX.value = withSpring(0, { damping: 15, stiffness: 150 });
        translateY.value = withSpring(0, { damping: 15, stiffness: 150 });
        scale.value = withSpring(1, { damping: 15, stiffness: 150 });
      }
    });

  const cardStyle = useAnimatedStyle(() => {
    const rotate = interpolate(
      translateX.value,
      [-SCREEN_WIDTH / 2, 0, SCREEN_WIDTH / 2],
      [-15, 0, 15],
      Extrapolate.CLAMP
    );

    return {
      transform: [
        { translateX: translateX.value },
        { translateY: translateY.value },
        { rotate: `${rotate}deg` },
        { scale: scale.value },
      ],
      opacity: cardOpacity.value,
    };
  });

  const knowLabelStyle = useAnimatedStyle(() => {
    const opacity = interpolate(
      translateX.value,
      [0, SWIPE_THRESHOLD],
      [0, 1],
      Extrapolate.CLAMP
    );
    return { opacity };
  });

  const dontKnowLabelStyle = useAnimatedStyle(() => {
    const opacity = interpolate(
      translateX.value,
      [-SWIPE_THRESHOLD, 0],
      [1, 0],
      Extrapolate.CLAMP
    );
    return { opacity };
  });

  const currentWord = words[currentIndex];
  const progress = ((currentIndex + 1) / words.length) * 100;

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <View style={[styles.container, isLight && styles.containerLight]}>
        <SafeAreaView style={styles.safe}>
          {/* Progress */}
          <View style={styles.progressContainer}>
            <Text style={[styles.progressText, isLight && styles.progressTextLight]}>
              {currentIndex + 1} / {words.length}
            </Text>
            <View style={[styles.progressBar, isLight && styles.progressBarLight]}>
              <View
                style={[
                  styles.progressFill,
                  isLight && styles.progressFillLight,
                  { width: `${progress}%` },
                ]}
              />
            </View>
          </View>

          {/* Instructions */}
          <Text style={[styles.instructions, isLight && styles.instructionsLight]}>
            Do you know this word?
          </Text>

          {/* Card */}
          <View style={styles.cardContainer}>
            <GestureDetector gesture={panGesture}>
              <Animated.View style={[styles.card, isLight && styles.cardLight, cardStyle]}>
                {/* Know label */}
                <Animated.View style={[styles.swipeLabel, styles.knowLabel, knowLabelStyle]}>
                  <Text style={styles.knowLabelText}>I KNOW</Text>
                </Animated.View>

                {/* Don't Know label */}
                <Animated.View style={[styles.swipeLabel, styles.dontKnowLabel, dontKnowLabelStyle]}>
                  <Text style={styles.dontKnowLabelText}>DON'T KNOW</Text>
                </Animated.View>

                <Text style={[styles.word, isLight && styles.wordLight]}>
                  {currentWord?.word}
                </Text>
                <Text style={[styles.phonetic, isLight && styles.phoneticLight]}>
                  {currentWord?.phonetic}
                </Text>

                <View style={styles.divider} />

                <Text style={[styles.definition, isLight && styles.definitionLight]}>
                  {currentWord?.definition}
                </Text>
              </Animated.View>
            </GestureDetector>
          </View>

          {/* Swipe hints */}
          <View style={styles.hintsContainer}>
            <View style={styles.hint}>
              <Text style={[styles.hintArrow, { color: '#EF4444' }]}>{'<'}</Text>
              <Text style={[styles.hintText, isLight && styles.hintTextLight]}>Don't Know</Text>
            </View>
            <View style={styles.hint}>
              <Text style={[styles.hintText, isLight && styles.hintTextLight]}>I Know</Text>
              <Text style={[styles.hintArrow, { color: '#10B981' }]}>{'>'}</Text>
            </View>
          </View>
        </SafeAreaView>
      </View>
    </GestureHandlerRootView>
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
  progressContainer: {
    marginBottom: 20,
  },
  progressText: {
    color: '#9CA3AF',
    fontSize: 14,
    fontWeight: '600',
    textAlign: 'center',
    marginBottom: 8,
    fontFamily: 'Ubuntu-Medium',
  },
  progressTextLight: {
    color: '#6B7280',
  },
  progressBar: {
    height: 6,
    backgroundColor: '#2A2D2D',
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressBarLight: {
    backgroundColor: '#E5E7EB',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#437F76',
    borderRadius: 3,
  },
  progressFillLight: {
    backgroundColor: '#437F76',
  },
  instructions: {
    color: '#fff',
    fontSize: 22,
    fontWeight: '600',
    textAlign: 'center',
    marginBottom: 24,
    fontFamily: 'Ubuntu-Medium',
  },
  instructionsLight: {
    color: '#111827',
  },
  cardContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  card: {
    width: SCREEN_WIDTH - 60,
    backgroundColor: '#2A2D2D',
    borderRadius: 20,
    padding: 32,
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
  swipeLabel: {
    position: 'absolute',
    top: 24,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 3,
  },
  knowLabel: {
    right: 20,
    borderColor: '#10B981',
    transform: [{ rotate: '15deg' }],
  },
  knowLabelText: {
    color: '#10B981',
    fontSize: 18,
    fontWeight: '900',
  },
  dontKnowLabel: {
    left: 20,
    borderColor: '#EF4444',
    transform: [{ rotate: '-15deg' }],
  },
  dontKnowLabelText: {
    color: '#EF4444',
    fontSize: 18,
    fontWeight: '900',
  },
  word: {
    color: '#fff',
    fontSize: 42,
    fontWeight: '600',
    marginTop: 40,
    marginBottom: 8,
    fontFamily: 'Ubuntu-Medium',
  },
  wordLight: {
    color: '#111827',
  },
  phonetic: {
    color: '#9CA3AF',
    fontSize: 18,
    marginBottom: 24,
    fontFamily: 'Ubuntu-Medium',
  },
  phoneticLight: {
    color: '#6B7280',
  },
  divider: {
    width: 60,
    height: 3,
    backgroundColor: '#437F76',
    borderRadius: 2,
    marginBottom: 24,
  },
  definition: {
    color: '#D1D5DB',
    fontSize: 16,
    textAlign: 'center',
    lineHeight: 24,
    fontFamily: 'Ubuntu-Medium',
  },
  definitionLight: {
    color: '#4B5563',
  },
  hintsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  hint: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  hintArrow: {
    fontSize: 24,
    fontWeight: '900',
  },
  hintText: {
    color: '#9CA3AF',
    fontSize: 14,
    fontWeight: '600',
  },
  hintTextLight: {
    color: '#6B7280',
  },
});

import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Dimensions,
  DeviceEventEmitter,
  Animated,
  PanResponder,
  Easing,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { DiagnosticWord, getShuffledWords, calculateLevel, mapToAppLevel } from './diagnostic-words';
import { useAppStore } from '../../lib/store';
import LottieView from 'lottie-react-native';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');
const CARD_W = Math.min(340, SCREEN_WIDTH - 40);
const CARD_H = Math.min(400, Math.round(SCREEN_HEIGHT * 0.45));
const SWIPE_THRESHOLD = 80;

// Colors matching Learn section
const ACCENT_ORANGE = '#FE9602';
const ACCENT_TEAL = '#4ED9CB';
const ACCENT_GREEN = '#4ADE80';
const ACCENT_RED = '#F87171';
const BG_DARK = '#1E1E1E';
const CARD_BORDER = 'rgba(78, 217, 203, 0.35)';

export default function WordTest() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const selectedLevel = (params.selectedLevel as string) || 'beginner';

  // Keep hook count consistent
  const _theme = useAppStore(s => s.theme);

  const [words] = useState<DiagnosticWord[]>(() => getShuffledWords());
  const [currentIndex, setCurrentIndex] = useState(0);
  const [knownWords, setKnownWords] = useState<DiagnosticWord[]>([]);
  const [showCoach, setShowCoach] = useState(true);

  // Animation values
  const panX = useRef(new Animated.Value(0)).current;
  const cardOpacity = useRef(new Animated.Value(1)).current;
  const nextCardScale = useRef(new Animated.Value(0.95)).current;
  const nextCardTranslateY = useRef(new Animated.Value(15)).current;

  useEffect(() => {
    DeviceEventEmitter.emit('NAV_VISIBILITY', 'hide');
    return () => DeviceEventEmitter.emit('NAV_VISIBILITY', 'show');
  }, []);

  // Coach overlay timer
  useEffect(() => {
    if (!showCoach) return;
    const timer = setTimeout(() => setShowCoach(false), 3000);
    return () => clearTimeout(timer);
  }, [showCoach]);

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
      newKnownWords = [...knownWords, currentWord];
      setKnownWords(newKnownWords);
    }

    if (currentIndex >= words.length - 1) {
      goToResult(direction === 'right' ? newKnownWords : knownWords);
    } else {
      setCurrentIndex(prev => prev + 1);
      panX.setValue(0);
      cardOpacity.setValue(1);
      nextCardScale.setValue(0.95);
      nextCardTranslateY.setValue(15);
    }
  }, [currentIndex, words, knownWords, goToResult, panX, cardOpacity, nextCardScale, nextCardTranslateY]);

  const handleSwipeCompleteRef = useRef(handleSwipeComplete);
  useEffect(() => {
    handleSwipeCompleteRef.current = handleSwipeComplete;
  }, [handleSwipeComplete]);

  const panResponder = useMemo(
    () =>
      PanResponder.create({
        onStartShouldSetPanResponder: () => true,
        onMoveShouldSetPanResponder: (_, g) => Math.abs(g.dx) > Math.abs(g.dy) && Math.abs(g.dx) > 8,
        onPanResponderMove: (_, g) => {
          panX.setValue(g.dx);
          const progress = Math.min(Math.abs(g.dx) / SWIPE_THRESHOLD, 1);
          nextCardScale.setValue(0.95 + progress * 0.05);
          nextCardTranslateY.setValue(15 - progress * 15);
        },
        onPanResponderRelease: (_, g) => {
          const goLeft = g.dx <= -SWIPE_THRESHOLD;
          const goRight = g.dx >= SWIPE_THRESHOLD;

          if (!goLeft && !goRight) {
            Animated.spring(panX, { toValue: 0, useNativeDriver: true, friction: 6 }).start();
            Animated.spring(nextCardScale, { toValue: 0.95, useNativeDriver: true }).start();
            Animated.spring(nextCardTranslateY, { toValue: 15, useNativeDriver: true }).start();
            return;
          }

          const toValue = goLeft ? -SCREEN_WIDTH * 1.5 : SCREEN_WIDTH * 1.5;
          Animated.parallel([
            Animated.timing(panX, {
              toValue,
              duration: 250,
              easing: Easing.out(Easing.cubic),
              useNativeDriver: true,
            }),
            Animated.timing(cardOpacity, {
              toValue: 0,
              duration: 200,
              useNativeDriver: true,
            }),
            Animated.spring(nextCardScale, { toValue: 1, useNativeDriver: true }),
            Animated.spring(nextCardTranslateY, { toValue: 0, useNativeDriver: true }),
          ]).start(() => {
            handleSwipeCompleteRef.current(goRight ? 'right' : 'left');
          });
        },
        onPanResponderTerminate: () => {
          Animated.spring(panX, { toValue: 0, useNativeDriver: true }).start();
        },
      }),
    [panX, cardOpacity, nextCardScale, nextCardTranslateY]
  );

  const currentWord = words[currentIndex];
  const nextWord = currentIndex + 1 < words.length ? words[currentIndex + 1] : null;
  const progress = (currentIndex + 1) / words.length;

  const cardRotate = panX.interpolate({
    inputRange: [-SCREEN_WIDTH / 2, 0, SCREEN_WIDTH / 2],
    outputRange: ['-10deg', '0deg', '10deg'],
    extrapolate: 'clamp',
  });

  const knowLabelOpacity = panX.interpolate({
    inputRange: [0, SWIPE_THRESHOLD],
    outputRange: [0, 1],
    extrapolate: 'clamp',
  });

  const dontKnowLabelOpacity = panX.interpolate({
    inputRange: [-SWIPE_THRESHOLD, 0],
    outputRange: [1, 0],
    extrapolate: 'clamp',
  });

  return (
    <View style={styles.container}>
      <SafeAreaView style={styles.safe}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Word Check</Text>
          <Text style={styles.headerProgress}>{currentIndex + 1}/{words.length}</Text>
        </View>

        {/* Progress Bar */}
        <View style={styles.progressBarBg}>
          <View style={[styles.progressBarFill, { width: `${progress * 100}%` }]} />
        </View>

        {/* Instructions */}
        <Text style={styles.instructions}>Do you know this word?</Text>

        {/* Cards Stack */}
        <View style={styles.cardContainer}>
          {/* Next Card (behind) */}
          {nextWord && (
            <Animated.View
              style={[
                styles.nextCardWrap,
                {
                  transform: [
                    { scale: nextCardScale },
                    { translateY: nextCardTranslateY },
                  ],
                },
              ]}
            >
              <View style={styles.nextCard}>
                <Text style={styles.nextCardWord}>{nextWord.word}</Text>
              </View>
            </Animated.View>
          )}

          {/* Current Card */}
          <Animated.View
            style={[
              styles.cardOuter,
              {
                opacity: cardOpacity,
                transform: [
                  { translateX: panX },
                  { rotate: cardRotate },
                ],
              },
            ]}
            {...panResponder.panHandlers}
          >
            <View style={styles.card}>
              {/* Know label */}
              <Animated.View style={[styles.swipeLabel, styles.knowLabel, { opacity: knowLabelOpacity }]}>
                <Text style={styles.knowLabelText}>KNOW</Text>
              </Animated.View>

              {/* Don't Know label */}
              <Animated.View style={[styles.swipeLabel, styles.dontKnowLabel, { opacity: dontKnowLabelOpacity }]}>
                <Text style={styles.dontKnowLabelText}>SKIP</Text>
              </Animated.View>

              <Text style={styles.word}>{currentWord?.word}</Text>
              <Text style={styles.phonetic}>{currentWord?.phonetic}</Text>

              <View style={styles.divider} />

              <Text style={styles.definition}>{currentWord?.definition}</Text>

              {/* Coach overlay */}
              {showCoach && (
                <View style={styles.coachWrap} pointerEvents="none">
                  <LottieView
                    source={require('../../assets/lottie/HandSwipe.json')}
                    autoPlay
                    loop
                    style={styles.coachAnimation}
                  />
                </View>
              )}
            </View>
          </Animated.View>
        </View>

        {/* Swipe hints */}
        <View style={styles.hintsContainer}>
          <View style={styles.hintLeft}>
            <Text style={styles.hintArrowLeft}>←</Text>
            <Text style={styles.hintTextLeft}>Skip</Text>
          </View>
          <View style={styles.hintRight}>
            <Text style={styles.hintTextRight}>Know</Text>
            <Text style={styles.hintArrowRight}>→</Text>
          </View>
        </View>
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
    paddingHorizontal: 20,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 16,
  },
  headerTitle: {
    color: '#F9FAFB',
    fontSize: 22,
    fontWeight: '700',
    fontFamily: 'Ubuntu-Bold',
  },
  headerProgress: {
    color: ACCENT_ORANGE,
    fontSize: 17,
    fontWeight: '700',
    fontFamily: 'Ubuntu-Bold',
  },
  progressBarBg: {
    height: 5,
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 3,
    marginBottom: 24,
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: ACCENT_ORANGE,
    borderRadius: 3,
  },
  instructions: {
    color: '#9CA3AF',
    fontSize: 16,
    fontWeight: '500',
    textAlign: 'center',
    marginBottom: 20,
    fontFamily: 'Ubuntu-Medium',
  },
  cardContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  nextCardWrap: {
    position: 'absolute',
    width: CARD_W,
    height: CARD_H,
  },
  nextCard: {
    width: CARD_W,
    height: CARD_H,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#252829',
    opacity: 0.5,
    borderWidth: 2,
    borderColor: 'rgba(78, 217, 203, 0.15)',
  },
  nextCardWord: {
    color: '#4B5563',
    fontSize: 28,
    fontWeight: '700',
    fontFamily: 'Feather-Bold',
  },
  cardOuter: {
    width: CARD_W,
    height: CARD_H,
    borderRadius: 20,
    shadowColor: ACCENT_TEAL,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 16,
    elevation: 10,
  },
  card: {
    width: CARD_W,
    height: CARD_H,
    borderRadius: 20,
    padding: 32,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#2A2D2E',
    borderWidth: 2,
    borderColor: CARD_BORDER,
  },
  swipeLabel: {
    position: 'absolute',
    top: 20,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 2,
  },
  knowLabel: {
    right: 20,
    borderColor: ACCENT_GREEN,
    backgroundColor: 'rgba(74, 222, 128, 0.1)',
    transform: [{ rotate: '10deg' }],
  },
  knowLabelText: {
    color: ACCENT_GREEN,
    fontSize: 16,
    fontWeight: '800',
    letterSpacing: 1,
    fontFamily: 'Ubuntu-Bold',
  },
  dontKnowLabel: {
    left: 20,
    borderColor: ACCENT_RED,
    backgroundColor: 'rgba(248, 113, 113, 0.1)',
    transform: [{ rotate: '-10deg' }],
  },
  dontKnowLabelText: {
    color: ACCENT_RED,
    fontSize: 16,
    fontWeight: '800',
    letterSpacing: 1,
    fontFamily: 'Ubuntu-Bold',
  },
  word: {
    color: '#F9FAFB',
    fontSize: 36,
    fontWeight: '700',
    marginBottom: 8,
    letterSpacing: -0.5,
    textAlign: 'center',
    fontFamily: 'Feather-Bold',
  },
  phonetic: {
    color: '#6B7280',
    fontSize: 16,
    fontStyle: 'italic',
    marginBottom: 28,
    fontFamily: 'Feather-Bold',
  },
  divider: {
    width: 50,
    height: 3,
    backgroundColor: ACCENT_ORANGE,
    borderRadius: 2,
    marginBottom: 28,
  },
  definition: {
    color: '#9CA3AF',
    fontSize: 17,
    textAlign: 'center',
    lineHeight: 26,
    paddingHorizontal: 12,
    fontFamily: 'Feather-Bold',
  },
  coachWrap: {
    position: 'absolute',
    bottom: 24,
    left: 0,
    right: 0,
    alignItems: 'center',
  },
  coachAnimation: {
    width: 80,
    height: 80,
  },
  hintsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingBottom: 24,
    paddingTop: 12,
  },
  hintLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  hintRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  hintArrowLeft: {
    color: ACCENT_RED,
    fontSize: 24,
    fontWeight: '600',
  },
  hintArrowRight: {
    color: ACCENT_GREEN,
    fontSize: 24,
    fontWeight: '600',
  },
  hintTextLeft: {
    color: '#6B7280',
    fontSize: 14,
    fontWeight: '600',
    fontFamily: 'Ubuntu-Medium',
  },
  hintTextRight: {
    color: '#6B7280',
    fontSize: 14,
    fontWeight: '600',
    fontFamily: 'Ubuntu-Medium',
  },
});

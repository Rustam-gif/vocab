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
  TouchableOpacity,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { DiagnosticWord, getShuffledWords, calculateLevel, mapToAppLevel } from './diagnostic-words';
import { useAppStore } from '../../lib/store';
import LottieView from 'lottie-react-native';
import { X, CheckCircle2 } from 'lucide-react-native';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');
const CARD_W = Math.min(340, SCREEN_WIDTH - 48);
const CARD_H = Math.min(420, Math.round(SCREEN_HEIGHT * 0.48));
const SWIPE_THRESHOLD = 70;

// Colors matching app theme
const ACCENT_ORANGE = '#F8B070';
const ACCENT_TEAL = '#4ED9CB';
const ACCENT_PINK = '#F25E86';
const BG_DARK = '#1E1E1E';

export default function WordTest() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const selectedLevel = (params.selectedLevel as string) || 'beginner';
  const isRetake = params.retake === 'true';

  // Keep hook count consistent
  const _theme = useAppStore(s => s.theme);

  // Use detailed test (36 words) for retake, quick test (18 words) for initial
  const [words] = useState<DiagnosticWord[]>(() => getShuffledWords(isRetake));
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
    const determinedLevel = calculateLevel(known, words);
    const appLevel = mapToAppLevel(determinedLevel);

    router.replace({
      pathname: '/placement/result',
      params: {
        selectedLevel,
        determinedLevel,
        appLevel,
        knownCount: known.length.toString(),
        totalCount: words.length.toString(),
        isRetake: isRetake ? 'true' : 'false',
      },
    });
  }, [router, selectedLevel, words, isRetake]);

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

  const handleClose = useCallback(() => {
    router.back();
  }, [router]);

  return (
    <View style={styles.container}>
      <SafeAreaView style={styles.safe}>
        {/* Header */}
        <View style={styles.header}>
          {isRetake ? (
            <TouchableOpacity style={styles.closeBtn} onPress={handleClose}>
              <X size={20} color="#FFFFFF" />
            </TouchableOpacity>
          ) : (
            <View style={{ width: 40 }} />
          )}
          <View style={styles.headerCenter}>
            <Text style={styles.headerTitle}>{isRetake ? 'Level Retest' : 'Word Check'}</Text>
            <Text style={styles.headerSubtitle}>{currentIndex + 1} of {words.length}</Text>
          </View>
          <View style={{ width: 40 }} />
        </View>

        {/* Progress Bar */}
        <View style={styles.progressBarBg}>
          <Animated.View style={[styles.progressBarFill, { width: `${progress * 100}%` }]} />
        </View>

        {/* Swipe hints at top */}
        <View style={styles.swipeHintsTop}>
          <View style={styles.hintLeft}>
            <X size={16} color={ACCENT_PINK} />
            <Text style={[styles.hintText, { color: ACCENT_PINK }]}>Don't know</Text>
          </View>
          <Text style={styles.instructions}>Swipe the card</Text>
          <View style={styles.hintRight}>
            <Text style={[styles.hintText, { color: ACCENT_TEAL }]}>I know</Text>
            <CheckCircle2 size={16} color={ACCENT_TEAL} />
          </View>
        </View>

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
              {/* Know overlay */}
              <Animated.View style={[styles.feedbackOverlay, styles.feedbackKnow, { opacity: knowLabelOpacity }]}>
                <View style={[styles.feedbackBadge, styles.feedbackBadgeKnow]}>
                  <CheckCircle2 size={28} color="#FFFFFF" />
                  <Text style={styles.feedbackBadgeText}>I know!</Text>
                </View>
              </Animated.View>

              {/* Don't Know overlay */}
              <Animated.View style={[styles.feedbackOverlay, styles.feedbackDont, { opacity: dontKnowLabelOpacity }]}>
                <View style={[styles.feedbackBadge, styles.feedbackBadgeDont]}>
                  <X size={28} color="#FFFFFF" />
                  <Text style={styles.feedbackBadgeText}>Learning</Text>
                </View>
              </Animated.View>

              <View style={styles.cardContent}>
                <Text style={styles.cardLabel}>VOCABULARY</Text>
                <Text style={styles.word}>{currentWord?.word}</Text>
                <Text style={styles.phonetic}>{currentWord?.phonetic}</Text>

                <View style={styles.divider} />

                <Text style={styles.definition}>{currentWord?.definition}</Text>
              </View>

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

        {/* Bottom stats */}
        <View style={styles.statsRow}>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{knownWords.length}</Text>
            <Text style={styles.statLabel}>Known</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{currentIndex - knownWords.length}</Text>
            <Text style={styles.statLabel}>Learning</Text>
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
    paddingVertical: 12,
  },
  headerCenter: {
    alignItems: 'center',
  },
  headerTitle: {
    color: '#F9FAFB',
    fontSize: 20,
    fontWeight: '700',
    fontFamily: 'Feather-Bold',
  },
  headerSubtitle: {
    color: ACCENT_ORANGE,
    fontSize: 14,
    fontWeight: '600',
    fontFamily: 'Ubuntu-Medium',
    marginTop: 2,
  },
  closeBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#2A2D2E',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#1A1A1A',
  },
  progressBarBg: {
    height: 6,
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 3,
    marginBottom: 16,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: ACCENT_ORANGE,
    borderRadius: 3,
  },
  swipeHintsTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 4,
    marginBottom: 16,
  },
  instructions: {
    color: '#6B7280',
    fontSize: 13,
    fontWeight: '500',
    textAlign: 'center',
    fontFamily: 'Ubuntu-Medium',
  },
  hintLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  hintRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  hintText: {
    fontSize: 13,
    fontWeight: '600',
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
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#232627',
    borderWidth: 3,
    borderColor: '#1A1A1A',
  },
  nextCardWord: {
    color: 'rgba(255,255,255,0.3)',
    fontSize: 26,
    fontWeight: '700',
    fontFamily: 'Feather-Bold',
  },
  cardOuter: {
    width: CARD_W,
    height: CARD_H,
    borderRadius: 22,
    shadowColor: '#000',
    shadowOffset: { width: 2, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 0,
    elevation: 10,
  },
  card: {
    width: CARD_W,
    height: CARD_H,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#2A2D2E',
    borderWidth: 3,
    borderColor: '#1A1A1A',
    overflow: 'hidden',
  },
  cardContent: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 28,
  },
  cardLabel: {
    color: 'rgba(255,255,255,0.4)',
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 2,
    marginBottom: 16,
    fontFamily: 'Ubuntu-Bold',
  },
  feedbackOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 10,
  },
  feedbackKnow: {
    backgroundColor: 'rgba(78, 217, 203, 0.3)',
  },
  feedbackDont: {
    backgroundColor: 'rgba(242, 94, 134, 0.3)',
  },
  feedbackBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 50,
    gap: 8,
    shadowColor: '#000',
    shadowOpacity: 0.3,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 8,
  },
  feedbackBadgeKnow: {
    backgroundColor: ACCENT_TEAL,
  },
  feedbackBadgeDont: {
    backgroundColor: ACCENT_PINK,
  },
  feedbackBadgeText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '700',
    fontFamily: 'Ubuntu-Bold',
  },
  word: {
    color: '#FFFFFF',
    fontSize: 34,
    fontWeight: '700',
    marginBottom: 8,
    letterSpacing: -0.5,
    textAlign: 'center',
    fontFamily: 'Feather-Bold',
  },
  phonetic: {
    color: '#6B7280',
    fontSize: 15,
    fontStyle: 'italic',
    marginBottom: 24,
    fontFamily: 'Ubuntu-Medium',
  },
  divider: {
    width: 60,
    height: 3,
    backgroundColor: ACCENT_ORANGE,
    borderRadius: 2,
    marginBottom: 24,
  },
  definition: {
    color: '#9CA3AF',
    fontSize: 16,
    textAlign: 'center',
    lineHeight: 24,
    paddingHorizontal: 8,
    fontFamily: 'Ubuntu-Medium',
  },
  coachWrap: {
    position: 'absolute',
    bottom: 20,
    left: 0,
    right: 0,
    alignItems: 'center',
  },
  coachAnimation: {
    width: 90,
    height: 90,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 20,
    gap: 32,
  },
  statItem: {
    alignItems: 'center',
  },
  statValue: {
    color: '#FFFFFF',
    fontSize: 24,
    fontWeight: '700',
    fontFamily: 'Ubuntu-Bold',
  },
  statLabel: {
    color: '#6B7280',
    fontSize: 13,
    fontWeight: '500',
    fontFamily: 'Ubuntu-Medium',
    marginTop: 2,
  },
  statDivider: {
    width: 1,
    height: 36,
    backgroundColor: 'rgba(255,255,255,0.1)',
  },
});

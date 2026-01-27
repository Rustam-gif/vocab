import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
  Easing,
  Dimensions,
} from 'react-native';
import { Lightbulb } from 'lucide-react-native';
import { useAppStore } from '../../../lib/store';
import { getTheme } from '../../../lib/theme';
import { soundService } from '../../../services/SoundService';
import { levels } from '../data/levels';
import AnimatedNextButton from './AnimatedNextButton';
import LottieView from 'lottie-react-native';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const CARD_GAP = 16;
const CARD_WIDTH = (SCREEN_WIDTH - 48 - CARD_GAP) / 2;
const CARD_HEIGHT = 100;

interface OddOneOutProps {
  setId: string;
  levelId: string;
  onPhaseComplete: (score: number, totalQuestions: number) => void;
  hearts: number;
  onHeartLost: () => void;
  onCorrectAnswer?: () => void;
  onIncorrectAnswer?: () => void;
  wordRange?: { start: number; end: number };
  wordsOverride?: Array<{ word: string; phonetic: string; definition: string; example: string; synonyms?: string[] }>;
  showUfoAnimation?: boolean;
  ufoAnimationKey?: number;
  hintsRemaining?: number;
  onHintUsed?: () => void;
}

interface QuestionData {
  options: string[];
  oddOneIndex: number; // Index of the different/odd word
  targetWord: string; // The word whose synonyms are shown
}

export default function OddOneOutComponent({
  setId,
  levelId,
  onPhaseComplete,
  hearts,
  onHeartLost,
  onCorrectAnswer,
  onIncorrectAnswer,
  wordRange,
  wordsOverride,
  showUfoAnimation,
  ufoAnimationKey = 0,
  hintsRemaining = 0,
  onHintUsed,
}: OddOneOutProps) {
  const recordResult = useAppStore(s => s.recordExerciseResult);
  const themeName = useAppStore(s => s.theme);
  const colors = getTheme(themeName);
  const [hintUsed, setHintUsed] = useState(false); // Track if hint was used for current question
  const isLight = themeName === 'light';

  // Stabilize wordsOverride to prevent unnecessary re-renders
  const wordsOverrideRef = useRef(wordsOverride);
  useEffect(() => {
    wordsOverrideRef.current = wordsOverride;
  }, [wordsOverride && wordsOverride.length]);
  const stableWordsOverride = wordsOverrideRef.current;

  // Generate questions from words data
  const questions = useMemo(() => {
    let words: any[] = [];

    if (stableWordsOverride && stableWordsOverride.length) {
      words = stableWordsOverride;
      if (wordRange) {
        words = words.slice(wordRange.start, wordRange.end);
      }
    } else {
      const level = levels.find(l => l.id === levelId);
      if (!level) return [];
      const set = level.sets.find(s => s.id.toString() === setId);
      if (!set || !set.words) return [];
      words = set.words;
      if (wordRange) {
        words = words.slice(wordRange.start, wordRange.end);
      }
    }

    if (words.length < 2) return [];

    // First, collect all valid words (those with at least 3 synonyms)
    const validWords = words.filter(w => (w.synonyms || []).length >= 3);
    if (validWords.length === 0) return [];

    // Build a pool of ALL unique odd word candidates (main words from the set)
    // Each word in the set can be an "odd one out" for questions about other words
    const oddWordPool: string[] = [];
    const addedToPool = new Set<string>();

    for (const w of words) {
      const wordLower = w.word.toLowerCase();
      if (!addedToPool.has(wordLower)) {
        oddWordPool.push(w.word);
        addedToPool.add(wordLower);
      }
    }

    // Shuffle the pool
    oddWordPool.sort(() => Math.random() - 0.5);

    // Build questions - one per valid word
    const result: QuestionData[] = [];
    let poolIndex = 0;

    for (let i = 0; i < validWords.length; i++) {
      const targetWord = validWords[i];
      const synonyms = targetWord.synonyms || [];

      // Pick 3 synonyms for the "same" group
      const shuffledSynonyms = [...synonyms]
        .sort(() => Math.random() - 0.5)
        .slice(0, 3);

      // Find an odd word from the pool that's NOT in our synonyms and NOT the target word
      let oddWord: string | null = null;
      const startPoolIndex = poolIndex;

      // Search through the pool for a valid odd word
      do {
        const candidate = oddWordPool[poolIndex % oddWordPool.length];
        const candidateLower = candidate.toLowerCase();

        // Check if this candidate is valid (not the target word and not in synonyms)
        const isTargetWord = candidateLower === targetWord.word.toLowerCase();
        const isInSynonyms = shuffledSynonyms.some(s => s.toLowerCase() === candidateLower);

        if (!isTargetWord && !isInSynonyms) {
          oddWord = candidate;
          // Remove from pool so it can't be used again
          oddWordPool.splice(poolIndex % oddWordPool.length, 1);
          break;
        }

        poolIndex++;
      } while (poolIndex - startPoolIndex < oddWordPool.length && oddWordPool.length > 0);

      // If no odd word found from main words, use a synonym from another word
      if (!oddWord) {
        for (const other of words) {
          if (other.word === targetWord.word) continue;
          const otherSynonyms = other.synonyms || [];
          for (const syn of otherSynonyms) {
            const synLower = syn.toLowerCase();
            if (!shuffledSynonyms.some(s => s.toLowerCase() === synLower) &&
                synLower !== targetWord.word.toLowerCase()) {
              oddWord = syn;
              break;
            }
          }
          if (oddWord) break;
        }
      }

      // Final fallback
      if (!oddWord) {
        oddWord = 'different';
      }

      // Combine and shuffle
      const allOptions = [...shuffledSynonyms, oddWord];
      const shuffledOptions: { word: string; isOdd: boolean }[] = allOptions
        .map((word, idx) => ({ word, isOdd: idx === 3 }))
        .sort(() => Math.random() - 0.5);

      const oddOneIndex = shuffledOptions.findIndex(o => o.isOdd);

      result.push({
        options: shuffledOptions.map(o => o.word),
        oddOneIndex,
        targetWord: targetWord.word,
      });
    }

    return result;
  }, [setId, levelId, wordRange?.start, wordRange?.end, stableWordsOverride]);

  const [currentIndex, setCurrentIndex] = useState(0);
  const [selected, setSelected] = useState<number | null>(null);
  const [revealed, setRevealed] = useState(false);
  const [correctCount, setCorrectCount] = useState(0);
  const heartLostAnim = useRef(new Animated.Value(1)).current;
  const itemStartRef = useRef<number>(Date.now());
  const mountFadeAnim = useRef(new Animated.Value(0)).current;
  // Initialize card animations with 0 from the start to prevent flash
  const cardAnims = useRef<Animated.Value[]>([
    new Animated.Value(0),
    new Animated.Value(0),
    new Animated.Value(0),
    new Animated.Value(0),
  ]).current;

  // Fade in on mount
  useEffect(() => {
    Animated.timing(mountFadeAnim, {
      toValue: 1,
      duration: 400,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start();
  }, []);

  // Animate cards when question changes
  useEffect(() => {
    // Reset animations
    cardAnims.forEach(anim => anim.setValue(0));

    // Stagger entrance
    const animations = cardAnims.map((anim, i) =>
      Animated.timing(anim, {
        toValue: 1,
        duration: 300,
        delay: i * 80,
        easing: Easing.out(Easing.back(1.5)),
        useNativeDriver: true,
      })
    );

    Animated.stagger(60, animations).start();

    setSelected(null);
    setRevealed(false);
    itemStartRef.current = Date.now();
  }, [currentIndex]);

  const currentQuestion = questions[currentIndex];
  const progress = questions.length > 0 ? currentIndex / questions.length : 0;

  const triggerHeartLostAnimation = () => {
    heartLostAnim.setValue(1.3);
    Animated.spring(heartLostAnim, {
      toValue: 1,
      friction: 3,
      tension: 100,
      useNativeDriver: true,
    }).start();
  };

  const handleSelect = (idx: number) => {
    if (revealed) return;
    setSelected(idx);
  };

  const handleSubmit = () => {
    if (selected === null || revealed) return;

    const isCorrect = selected === currentQuestion.oddOneIndex;

    if (isCorrect) {
      setCorrectCount(prev => prev + 1);
      soundService.playCorrectAnswer();
      onCorrectAnswer?.();
    } else {
      onHeartLost();
      onIncorrectAnswer?.();
      triggerHeartLostAnimation();
      soundService.playIncorrectAnswer();
    }

    setRevealed(true);

    // Track analytics
    try {
      const timeSpent = Math.max(0, Math.round((Date.now() - itemStartRef.current) / 1000));
      recordResult({
        wordId: currentQuestion.targetWord,
        exerciseType: 'odd-one-out',
        correct: isCorrect,
        timeSpent,
        timestamp: new Date(),
        score: isCorrect ? 1 : 0,
      });
    } catch {}
  };

  const handleNext = () => {
    if (!revealed) return;

    if (currentIndex === questions.length - 1) {
      onPhaseComplete(correctCount, questions.length);
    } else {
      setCurrentIndex(prev => prev + 1);
      setHintUsed(false); // Reset hint for next question
    }
  };

  // Handle hint button - highlight the correct answer
  const handleHint = () => {
    if (hintsRemaining <= 0 || revealed || hintUsed) return;

    setHintUsed(true);
    onHintUsed?.();
    soundService.playCorrectAnswer();
  };

  const handlePrimary = () => {
    if (!revealed) {
      if (selected === null) return;
      handleSubmit();
    } else {
      handleNext();
    }
  };

  if (questions.length === 0) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={styles.loadingContainer}>
          <Text style={[styles.loadingText, isLight && { color: '#6B7280' }]}>
            No questions available
          </Text>
        </View>
      </View>
    );
  }

  return (
    <Animated.View style={[styles.container, isLight && { backgroundColor: colors.background }, { opacity: mountFadeAnim }]}>
      {/* Header with progress and hearts */}
      <View style={styles.topHeaderRow}>
        <View style={[styles.progressBarPill, isLight && { backgroundColor: '#E5E7EB' }]}>
          <View style={[styles.progressFillPill, { width: `${progress * 100}%` }]} />
        </View>
        <Animated.View style={[styles.heartsContainerSmall, { transform: [{ scale: heartLostAnim }] }]}>
          <View style={{ position: 'relative' }}>
            <LottieView
              source={require('../../../assets/lottie/learn/heart_away.lottie')}
              autoPlay={showUfoAnimation}
              loop={false}
              speed={1}
              style={{ width: 96, height: 96 }}
              key={showUfoAnimation ? 'playing' : 'idle'}
            />
            {showUfoAnimation && (
              <LottieView
                key={`ufo-${ufoAnimationKey}`}
                source={require('../../../assets/lottie/learn/Ufo_animation.lottie')}
                autoPlay
                loop={false}
                speed={2}
                style={{
                  width: 100,
                  height: 100,
                  position: 'absolute',
                  top: -20,
                  left: 0,
                }}
              />
            )}
          </View>
          <Text style={[styles.heartCount, { marginLeft: -30 }, isLight && { color: '#EF4444' }]}>{hearts}</Text>
        </Animated.View>
      </View>

      {/* Title */}
      <View style={styles.titleContainer}>
        <Text style={[styles.titleText, isLight && { color: '#111827' }]}>
          Which one doesn't belong?
        </Text>
      </View>

      {/* Hint Button */}
      {hintsRemaining > 0 && !revealed && !hintUsed && (
        <TouchableOpacity
          style={[styles.hintButton, isLight && styles.hintButtonLight]}
          onPress={handleHint}
          activeOpacity={0.7}
        >
          <Lightbulb size={16} color={isLight ? '#F59E0B' : '#FCD34D'} fill={isLight ? '#F59E0B' : '#FCD34D'} />
        </TouchableOpacity>
      )}

      {/* 2x2 Grid of cards */}
      <View style={styles.gridContainer}>
        {/* First row */}
        <View style={styles.gridRow}>
          {currentQuestion.options.slice(0, 2).map((word, idx) => {
            const isSelected = selected === idx;
            const isOdd = idx === currentQuestion.oddOneIndex;
            const anim = cardAnims[idx];

            let cardStyle: any[] = [styles.card, isLight && styles.cardLight];

            // Show hint highlight on correct answer if hint was used
            if (hintUsed && !revealed && isOdd) {
              cardStyle.push(styles.cardHint);
            }
            let textStyle: any[] = [styles.cardText, isLight && styles.cardTextLight];

            if (!revealed && isSelected) {
              cardStyle = [...cardStyle, styles.cardSelected, isLight && styles.cardSelectedLight];
            }

            if (revealed) {
              if (isOdd) {
                cardStyle = [...cardStyle, isLight ? styles.cardCorrectLight : styles.cardCorrect];
              } else if (isSelected) {
                cardStyle = [...cardStyle, isLight ? styles.cardIncorrectLight : styles.cardIncorrect];
              }
            }

            return (
              <Animated.View
                key={idx}
                style={{
                  opacity: anim,
                  transform: [{ scale: anim.interpolate({ inputRange: [0, 1], outputRange: [0.85, 1] }) }],
                }}
              >
                <TouchableOpacity
                  style={cardStyle}
                  onPress={() => handleSelect(idx)}
                  disabled={revealed}
                  activeOpacity={0.9}
                >
                  <Text style={textStyle}>{word}</Text>
                </TouchableOpacity>
              </Animated.View>
            );
          })}
        </View>
        {/* Second row */}
        <View style={styles.gridRow}>
          {currentQuestion.options.slice(2, 4).map((word, i) => {
            const idx = i + 2;
            const isSelected = selected === idx;
            const isOdd = idx === currentQuestion.oddOneIndex;
            const anim = cardAnims[idx];

            let cardStyle: any[] = [styles.card, isLight && styles.cardLight];

            // Show hint highlight on correct answer if hint was used
            if (hintUsed && !revealed && isOdd) {
              cardStyle.push(styles.cardHint);
            }
            let textStyle: any[] = [styles.cardText, isLight && styles.cardTextLight];

            if (!revealed && isSelected) {
              cardStyle = [...cardStyle, styles.cardSelected, isLight && styles.cardSelectedLight];
            }

            if (revealed) {
              if (isOdd) {
                cardStyle = [...cardStyle, isLight ? styles.cardCorrectLight : styles.cardCorrect];
              } else if (isSelected) {
                cardStyle = [...cardStyle, isLight ? styles.cardIncorrectLight : styles.cardIncorrect];
              }
            }

            return (
              <Animated.View
                key={idx}
                style={{
                  opacity: anim,
                  transform: [{ scale: anim.interpolate({ inputRange: [0, 1], outputRange: [0.85, 1] }) }],
                }}
              >
                <TouchableOpacity
                  style={cardStyle}
                  onPress={() => handleSelect(idx)}
                  disabled={revealed}
                  activeOpacity={0.9}
                >
                  <Text style={textStyle}>{word}</Text>
                </TouchableOpacity>
              </Animated.View>
            );
          })}
        </View>
      </View>

      {/* Footer with button */}
      <View style={styles.footer}>
        <AnimatedNextButton
          onPress={handlePrimary}
          disabled={!revealed && selected === null}
          label={revealed ? 'NEXT' : 'CHECK'}
        />
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'transparent',
    paddingHorizontal: 20,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 16,
    color: '#9CA3AF',
    fontFamily: 'Feather-Bold',
  },
  topHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-start',
    marginTop: 0,
    marginBottom: 8,
    gap: 12,
    paddingLeft: 36,
    paddingRight: 24,
    minHeight: 48,
    overflow: 'visible',
    zIndex: 10,
  },
  progressBarPill: {
    flex: 1,
    height: 12,
    backgroundColor: '#2D4A66',
    borderRadius: 6,
    overflow: 'hidden',
    marginRight: 8,
  },
  progressFillPill: {
    height: '100%',
    backgroundColor: '#7AC231',
    borderRadius: 7,
  },
  heartsContainerSmall: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    overflow: 'visible',
    zIndex: 100,
  },
  heartCount: {
    fontSize: 17,
    fontWeight: '700',
    color: '#EF4444',
    fontFamily: 'Feather-Bold',
  },
  titleContainer: {
    alignItems: 'center',
    marginTop: 16,
    marginBottom: 32,
  },
  titleText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#FFFFFF',
    fontFamily: 'Feather-Bold',
    textAlign: 'center',
  },
  hintButton: {
    position: 'absolute',
    top: 120,
    left: 20,
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(251, 191, 36, 0.15)',
    borderRadius: 20,
    borderWidth: 1.5,
    borderColor: 'rgba(252, 211, 77, 0.4)',
    zIndex: 10,
  },
  hintButtonLight: {
    backgroundColor: 'rgba(251, 191, 36, 0.2)',
    borderColor: 'rgba(245, 158, 11, 0.5)',
  },
  cardHint: {
    borderColor: '#4ED9CB',
    borderWidth: 3,
    shadowColor: '#4ED9CB',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.5,
    shadowRadius: 8,
    elevation: 8,
  },
  gridContainer: {
    flex: 1,
    justifyContent: 'center',
    gap: CARD_GAP + 8,
    paddingHorizontal: 16,
  },
  gridRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: CARD_GAP,
  },
  card: {
    width: CARD_WIDTH,
    height: CARD_HEIGHT,
    backgroundColor: '#1B263B',
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: '#0D1B2A',
    borderBottomWidth: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 0,
    elevation: 5,
  },
  cardLight: {
    backgroundColor: '#FFFFFF',
    borderColor: '#D1D5DB',
  },
  cardSelected: {
    backgroundColor: '#4A4A4A',
    borderColor: '#F25E86',
    transform: [{ translateY: 2 }],
    borderBottomWidth: 4,
  },
  cardSelectedLight: {
    backgroundColor: '#FFF0F3',
    borderColor: '#F25E86',
  },
  cardCorrect: {
    backgroundColor: '#2D4A66',
    borderColor: '#4ED9CB',
  },
  cardCorrectLight: {
    backgroundColor: '#E6FAF8',
    borderColor: '#4ED9CB',
  },
  cardIncorrect: {
    backgroundColor: '#5A2D3A',
    borderColor: '#F25E86',
  },
  cardIncorrectLight: {
    backgroundColor: '#FFF0F3',
    borderColor: '#F25E86',
  },
  cardText: {
    fontSize: 22,
    fontWeight: '700',
    color: '#FFFFFF',
    fontFamily: 'Feather-Bold',
    textAlign: 'center',
    paddingHorizontal: 16,
  },
  cardTextLight: {
    color: '#111827',
  },
  footer: {
    marginTop: 'auto',
    paddingTop: 24,
    paddingBottom: 50,
    alignItems: 'center',
  },
});

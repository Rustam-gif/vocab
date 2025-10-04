import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
  AccessibilityInfo,
  ViewStyle,
  TextStyle,
} from 'react-native';
import { Vibration } from 'react-native';
import { analyticsService } from '../../../services/AnalyticsService';

const ACCENT_COLOR = '#F2935C';
const CORRECT_COLOR = '#437F76';
const INCORRECT_COLOR = '#924646';

interface SentenceUsageProps {
  setId: string;
  levelId: string;
  onPhaseComplete: (score: number, totalQuestions: number) => void;
  sharedScore: number;
  onScoreShare: (score: number) => void;
}

interface UsageSentence {
  text: string;
  isCorrect: boolean;
}

interface UsageItem {
  id: string;
  word: string;
  ipa: string;
  sentences: UsageSentence[];
}

const ITEMS: UsageItem[] = [
  {
    id: 'home',
    word: 'home',
    ipa: '/hoʊm/',
    sentences: [
      { text: 'I go to my … after school every day.', isCorrect: true },
      { text: 'I go to my … when I want to buy food.', isCorrect: false },
      { text: 'I go to my … to learn English and math.', isCorrect: false },
      { text: 'I go to my … to play with other children.', isCorrect: false },
    ],
  },
  {
    id: 'food',
    word: 'food',
    ipa: '/fuːd/',
    sentences: [
      { text: 'We eat healthy … at breakfast and dinner.', isCorrect: true },
      { text: 'We eat healthy … when we play outside.', isCorrect: false },
      { text: 'We eat healthy … to watch TV together.', isCorrect: false },
      { text: 'We eat healthy … when we sleep at night.', isCorrect: false },
    ],
  },
  {
    id: 'brother',
    word: 'brother',
    ipa: '/ˈbrʌðər/',
    sentences: [
      { text: 'My little … and I play games together.', isCorrect: true },
      { text: 'My little … and I eat lunch at school.', isCorrect: false },
      { text: 'My little … and I go to bed early.', isCorrect: false },
      { text: 'My little … and I watch TV after dinner.', isCorrect: false },
    ],
  },
  {
    id: 'family',
    word: 'family',
    ipa: '/ˈfæməli/',
    sentences: [
      { text: 'I love my … and we eat together daily.', isCorrect: true },
      { text: 'I love my … when I go to the store.', isCorrect: false },
      { text: 'I love my … to finish my homework today.', isCorrect: false },
      { text: 'I love my … at the park with my dog.', isCorrect: false },
    ],
  },
  {
    id: 'friend',
    word: 'friend',
    ipa: '/frend/',
    sentences: [
      { text: 'My best … and I walk to school together.', isCorrect: true },
      { text: 'My best … and I eat breakfast at home.', isCorrect: false },
      { text: 'My best … and I sleep for eight hours.', isCorrect: false },
      { text: 'My best … and I do homework every night.', isCorrect: false },
    ],
  },
];

interface OptionRow {
  text: string;
  isCorrect: boolean;
  key: string;
}

export default function SentenceUsageComponent({ onPhaseComplete, sharedScore, onScoreShare }: SentenceUsageProps) {
  const [index, setIndex] = useState(0);
  const [options, setOptions] = useState<OptionRow[]>([]);
  const [selected, setSelected] = useState<number | null>(null);
  const [revealed, setRevealed] = useState(false);
  const [correctCount, setCorrectCount] = useState(0);
  const [displayScore, setDisplayScore] = useState(sharedScore);
  const pendingScoreRef = useRef<number | null>(null);
  const deductionAnim = useRef(new Animated.Value(0)).current;
  const itemStartRef = useRef<number>(Date.now());

  const item = useMemo(() => ITEMS[index], [index]);

  useEffect(() => {
    const shuffled = item.sentences
      .map(sentence => ({ ...sentence, key: `${item.id}-${sentence.text}` }))
      .map(sentence => ({ ...sentence, sort: Math.random() }))
      .sort((a, b) => a.sort - b.sort)
      .map(({ sort, ...rest }) => rest);

    setOptions(shuffled);
    setSelected(null);
    setRevealed(false);
    itemStartRef.current = Date.now();
  }, [item]);

  useEffect(() => {
    setDisplayScore(sharedScore);
  }, [sharedScore]);

  useEffect(() => {
    if (pendingScoreRef.current !== null && pendingScoreRef.current !== sharedScore) {
      const next = pendingScoreRef.current;
      pendingScoreRef.current = null;
      onScoreShare(next);
    }
  }, [displayScore, onScoreShare, sharedScore]);

  const progress = index / ITEMS.length;

  const handleSelect = (idx: number) => {
    if (revealed) return;
    setSelected(idx);
  };

  const handleSubmit = () => {
    if (selected === null || revealed) return;

    Vibration.vibrate(10);

    const chosen = options[selected];
    if (chosen.isCorrect) {
      setCorrectCount(prev => prev + 1);
      AccessibilityInfo.announceForAccessibility('Correct');
    } else {
      const correctSentence = options.find(o => o.isCorrect)?.text ?? '';
      AccessibilityInfo.announceForAccessibility(`Incorrect. Correct sentence is ${correctSentence}`);
      setDisplayScore(prev => {
        const next = Math.max(0, prev - 5);
        pendingScoreRef.current = next;
        return next;
      });
      triggerDeductionAnimation();
    }

    setRevealed(true);

    // Track analytics for this item
    try {
      const timeSpent = Math.max(0, Math.round((Date.now() - itemStartRef.current) / 1000));
      analyticsService.recordResult({
        wordId: item.word,
        exerciseType: 'usage',
        correct: chosen.isCorrect,
        timeSpent,
        timestamp: new Date(),
        score: chosen.isCorrect ? 1 : 0,
      });
    } catch {}
  };

  const handleNext = () => {
    if (!revealed) return;

    if (index === ITEMS.length - 1) {
      onPhaseComplete(correctCount, ITEMS.length);
    } else {
      setIndex(prev => prev + 1);
      itemStartRef.current = Date.now();
    }
  };

  const triggerDeductionAnimation = () => {
    deductionAnim.stopAnimation();
    deductionAnim.setValue(0);
    Animated.timing(deductionAnim, {
      toValue: 1,
      duration: 700,
      useNativeDriver: true,
    }).start();
  };

  const deductionOpacity = deductionAnim.interpolate({
    inputRange: [0, 0.2, 1],
    outputRange: [0, 1, 0],
  });
  const deductionTranslateY = deductionAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, -35],
  });

  return (
    <View style={styles.container}>
      <View style={styles.progressContainer}>
        <Text style={styles.progressText}>Word {index + 1} of {ITEMS.length}</Text>
        <View style={styles.scoreWrapper}>
          <Animated.Text
            style={[
              styles.deductionText,
              {
                opacity: deductionOpacity,
                transform: [{ translateY: deductionTranslateY }],
              },
            ]}
          >
            -5
          </Animated.Text>
          <Text style={styles.scoreText}>{displayScore}</Text>
        </View>
      </View>
      <View style={styles.progressBar}>
        <View style={[styles.progressFill, { width: `${progress * 100}%` }]} />
      </View>

      <Text style={styles.headerText}>Natural Usage</Text>
      <Text style={styles.subHeaderText}>Pick the sentence that uses the word correctly.</Text>

      <View style={styles.wordHeader}>
        <Text style={styles.wordText}>{item.word}</Text>
        <Text style={styles.ipaText}>{item.ipa}</Text>
      </View>

      <View style={styles.optionsWrapper}>
        {options.map((option, idx) => {
          const isSelected = selected === idx;
          const isCorrect = option.isCorrect;

          const cardStyle: ViewStyle[] = [styles.optionCard];
          const textStyle: TextStyle[] = [styles.optionText];

          if (!revealed && isSelected) {
            cardStyle.push(styles.cardSelected);
          }

          if (revealed && isSelected) {
            cardStyle.push(isCorrect ? styles.cardCorrect : styles.cardIncorrect);
          }

          if (revealed && !isSelected && isCorrect && selected !== null) {
            textStyle.push(styles.correctText);
          }

          return (
            <TouchableOpacity
              key={option.key}
              style={cardStyle}
              activeOpacity={0.85}
              onPress={() => handleSelect(idx)}
              disabled={revealed}
              accessibilityRole="button"
              accessibilityState={{ selected: isSelected }}
            >
              <Text style={textStyle}>{option.text}</Text>
            </TouchableOpacity>
          );
        })}
      </View>

      <View style={styles.footer}>
        {!revealed ? (
          <TouchableOpacity
            style={[styles.primaryButton, selected === null && styles.disabledButton]}
            disabled={selected === null}
            onPress={handleSubmit}
          >
            <Text style={styles.primaryButtonText}>Reveal</Text>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity style={styles.primaryButton} onPress={handleNext}>
            <Text style={styles.primaryButtonText}>
              {index === ITEMS.length - 1 ? 'Finish' : 'Next'}
            </Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1E1E1E',
    paddingHorizontal: 20,
    paddingVertical: 24,
  },
  progressContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  progressText: {
    fontSize: 14,
    color: '#9CA3AF',
    fontWeight: '500',
  },
  scoreWrapper: {
    alignItems: 'center',
    justifyContent: 'flex-end',
    minWidth: 48,
  },
  deductionText: {
    position: 'absolute',
    top: -20,
    fontSize: 16,
    fontWeight: '600',
    color: '#F87171',
  },
  scoreText: {
    fontSize: 16,
    fontWeight: '600',
    color: ACCENT_COLOR,
  },
  progressBar: {
    height: 6,
    backgroundColor: '#2c2f2f',
    borderRadius: 3,
    overflow: 'hidden',
    marginBottom: 24,
  },
  progressFill: {
    height: '100%',
    backgroundColor: ACCENT_COLOR,
  },
  headerText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  subHeaderText: {
    color: '#9CA3AF',
    fontSize: 14,
    marginTop: 4,
  },
  wordHeader: {
    alignItems: 'center',
    marginTop: 24,
    marginBottom: 24,
  },
  wordText: {
    fontSize: 32,
    fontWeight: '700',
    color: '#fff',
  },
  ipaText: {
    fontSize: 16,
    color: '#9CA3AF',
    fontStyle: 'italic',
  },
  optionsWrapper: {
    gap: 12,
    flexGrow: 1,
  },
  optionCard: {
    backgroundColor: '#3A3A3A',
    borderRadius: 16,
    paddingVertical: 16,
    paddingHorizontal: 16,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  cardSelected: {
    borderWidth: 2,
    borderColor: ACCENT_COLOR,
  },
  optionText: {
    color: '#fff',
    fontSize: 16,
    lineHeight: 22,
  },
  cardCorrect: {
    backgroundColor: CORRECT_COLOR,
  },
  cardIncorrect: {
    backgroundColor: INCORRECT_COLOR,
  },
  correctText: {
    color: CORRECT_COLOR,
    fontWeight: '600',
  },
  footer: {
    marginTop: 32,
    alignItems: 'center',
  },
  primaryButton: {
    backgroundColor: ACCENT_COLOR,
    borderRadius: 20,
    paddingVertical: 18,
    paddingHorizontal: 32,
    alignItems: 'center',
    minWidth: 160,
  },
  primaryButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  disabledButton: {
    opacity: 0.5,
  },
});

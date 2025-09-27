import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TouchableWithoutFeedback,
  Animated,
  AccessibilityInfo,
  StyleProp,
  ViewStyle,
} from 'react-native';
import { Vibration } from 'react-native';

interface SynonymProps {
  setId: string;
  levelId: string;
  onPhaseComplete: (score: number, totalQuestions: number) => void;
  sharedScore: number;
  onScoreShare: (newScore: number) => void;
}

interface WordEntry {
  word: string;
  ipa: string;
  correct: string[];
  incorrectPool: string[];
}

const WORDS: WordEntry[] = [
  {
    word: 'wake up',
    ipa: '/weɪk ʌp/',
    correct: ['get up', 'arise', 'awaken'],
    incorrectPool: ['sleep', 'rest', 'nap', 'slumber'],
  },
  {
    word: 'eat',
    ipa: '/iːt/',
    correct: ['consume', 'dine', 'have a meal'],
    incorrectPool: ['drink', 'cook', 'buy', 'sip'],
  },
  {
    word: 'study',
    ipa: '/ˈstʌdi/',
    correct: ['learn', 'practice', 'review'],
    incorrectPool: ['play', 'relax', 'sleep', 'watch TV'],
  },
  {
    word: 'exercise',
    ipa: '/ˈeksərsaɪz/',
    correct: ['work out', 'train', 'keep fit'],
    incorrectPool: ['rest', 'eat', 'sleep', 'sit'],
  },
  {
    word: 'sleep',
    ipa: '/sliːp/',
    correct: ['rest', 'slumber', 'doze'],
    incorrectPool: ['eat', 'play', 'talk', 'run'],
  },
];

const CORRECT_COLOR = '#437F76';
const INCORRECT_COLOR = '#924646';
const ACCENT_COLOR = '#F2935C';

export default function SynonymComponent({ onPhaseComplete, sharedScore, onScoreShare }: SynonymProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selected, setSelected] = useState<string[]>([]);
  const [revealed, setRevealed] = useState(false);
  const [displayScore, setDisplayScore] = useState(sharedScore);
  const [phaseCorrect, setPhaseCorrect] = useState(0);
  const pendingScoreRef = useRef<number | null>(null);
  const deductionAnim = useRef(new Animated.Value(0)).current;

  const currentWord = useMemo(() => WORDS[currentIndex], [currentIndex]);
  const requiredCount = currentWord.correct.length;

  const [options] = useState(() =>
    WORDS.map(entry => {
      const incorrectNeeded = entry.correct.length;
      const shuffledIncorrect = [...entry.incorrectPool]
        .map(option => ({ option, sort: Math.random() }))
        .sort((a, b) => a.sort - b.sort)
        .slice(0, incorrectNeeded)
        .map(({ option }) => option);

      const combined = [...entry.correct, ...shuffledIncorrect];

      return combined
        .map(option => ({ option, sort: Math.random() }))
        .sort((a, b) => a.sort - b.sort)
        .map(({ option }) => option);
    })
  );

  useEffect(() => {
    setSelected([]);
    setRevealed(false);
  }, [currentIndex]);

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

  const toggleSelection = (choice: string) => {
    if (revealed) return;
    if (selected.includes(choice)) {
      setSelected(prev => prev.filter(item => item !== choice));
      return;
    }

    if (selected.length === requiredCount) {
      return;
    }

    setSelected(prev => [...prev, choice]);
  };

  const pluralised = requiredCount === 1 ? 'synonym' : 'synonyms';
  const nextDisabled = selected.length !== requiredCount;

  const handleSubmit = async () => {
    if (nextDisabled || revealed) return;

    Vibration.vibrate(10);

    const incorrectSelections = selected.filter(choice => !currentWord.correct.includes(choice)).length;
    const selectedCorrect = incorrectSelections === 0;

    if (selectedCorrect) {
      setPhaseCorrect(prev => prev + 1);
    } else {
      setDisplayScore(prev => {
        const next = Math.max(0, prev - 5);
        pendingScoreRef.current = next;
        return next;
      });
      triggerDeductionAnimation();
    }
    setRevealed(true);

    AccessibilityInfo.announceForAccessibility(
      selectedCorrect ? 'Correct' : 'Review the correct synonyms'
    );
  };

  const handleNext = () => {
    if (!revealed) return;

    if (currentIndex === WORDS.length - 1) {
      onPhaseComplete(phaseCorrect, WORDS.length);
    } else {
      setCurrentIndex(prev => prev + 1);
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

  const progress = currentIndex / WORDS.length;
  const deductionOpacity = deductionAnim.interpolate({
    inputRange: [0, 0.2, 1],
    outputRange: [0, 1, 0],
  });
  const deductionTranslateY = deductionAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, -35],
  });

  const isLastWord = currentIndex === WORDS.length - 1;
  const handlePrimary = () => {
    if (!revealed) {
      if (nextDisabled) return;
      handleSubmit();
    } else {
      handleNext();
    }
  };
  const primaryDisabled = !revealed && nextDisabled;
  const primaryLabel = revealed ? (isLastWord ? 'Finish' : 'Next') : 'Next';

  return (
    <View style={styles.container}>
      <View style={styles.body}>
        <View style={styles.topRow}>
        <View style={styles.progressContainer}>
          <Text style={styles.progressText}>
            Word {currentIndex + 1} of {WORDS.length}
          </Text>
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
          <Animated.View style={[styles.progressFill, { width: `${progress * 100}%` }]} />
        </View>
      </View>

        <View style={styles.wordHeader}>
          <Text style={styles.wordHighlight}>{currentWord.word}</Text>
          <Text style={styles.promptText}>
            Select {requiredCount} {pluralised}
          </Text>
          <Text style={styles.ipaText}>{currentWord.ipa}</Text>
        </View>

        <View style={styles.grid}>
          {options[currentIndex].map(choice => {
            const isSelected = selected.includes(choice);
            const isCorrect = currentWord.correct.includes(choice);
            const buttonStyles: Array<ViewStyle> = [styles.optionButton];

            if (revealed) {
              if (isSelected && isCorrect) {
                buttonStyles.push(styles.optionCorrect);
              } else if (isSelected && !isCorrect) {
                buttonStyles.push(styles.optionIncorrect);
              } else if (!isSelected && isCorrect) {
                buttonStyles.push(styles.optionCorrectOutline);
              }
            } else if (isSelected) {
              buttonStyles.push(styles.optionSelected);
            }

            return (
              <TouchableWithoutFeedback key={choice} onPress={() => toggleSelection(choice)}>
                <View style={buttonStyles}>
                  <Text style={styles.optionText}>{choice}</Text>
                </View>
              </TouchableWithoutFeedback>
            );
          })}
        </View>
      </View>

      <View style={styles.footerButtons}>
        <TouchableOpacity
          style={[styles.primaryButton, primaryDisabled && styles.buttonDisabled]}
          disabled={primaryDisabled}
          onPress={handlePrimary}
        >
          <Text style={styles.primaryButtonText}>{primaryLabel}</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1E1E1E',
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 24,
  },
  body: {
    flex: 1,
  },
  topRow: {
    marginBottom: 16,
  },
  progressContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
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
  progressBar: {
    height: 6,
    backgroundColor: '#333',
    borderRadius: 3,
    overflow: 'hidden',
    width: '100%',
    marginBottom: 24,
  },
  progressFill: {
    height: '100%',
    backgroundColor: ACCENT_COLOR,
  },
  scoreText: {
    color: ACCENT_COLOR,
    fontSize: 15,
    fontWeight: '600',
  },
  wordHeader: {
    alignItems: 'center',
    marginBottom: 32,
    marginTop: 24,
  },
  promptText: {
    color: 'rgba(207, 212, 216, 0.7)',
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
    marginBottom: 12,
  },
  wordHighlight: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 28,
    marginBottom: 12,
  },
  wordTitle: {
    marginTop: 12,
    fontSize: 28,
    fontWeight: '700',
    color: '#fff',
    textAlign: 'center',
  },
  ipaText: {
    marginTop: 6,
    marginBottom: 12,
    fontSize: 14,
    color: '#9CA3AF',
    fontStyle: 'italic',
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: 16,
    flexGrow: 1,
  },
  optionButton: {
    width: '47%',
    backgroundColor: '#3A3A3A',
    borderRadius: 10,
    paddingVertical: 24,
    paddingHorizontal: 10,
    marginBottom: 12,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'transparent',
    minHeight: 88,
  },
  optionSelected: {
    borderColor: ACCENT_COLOR,
  },
  optionCorrect: {
    backgroundColor: CORRECT_COLOR,
    borderColor: 'transparent',
  },
  optionIncorrect: {
    backgroundColor: INCORRECT_COLOR,
    borderColor: 'transparent',
  },
  optionCorrectOutline: {
    borderColor: CORRECT_COLOR,
    backgroundColor: 'rgba(67, 127, 118, 0.1)',
  },
  optionText: {
    color: '#fff',
    fontSize: 15,
    textAlign: 'center',
  },
  footerButtons: {
    alignItems: 'center',
    paddingTop: 12,
  },
  primaryButton: {
    paddingVertical: 14,
    paddingHorizontal: 28,
    borderRadius: 16,
    backgroundColor: ACCENT_COLOR,
    alignItems: 'center',
    minWidth: 140,
  },
  primaryButtonText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '600',
  },
  buttonDisabled: {
    opacity: 0.5,
  },
});

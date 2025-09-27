import React, { useEffect, useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  AccessibilityInfo,
  ViewStyle,
  TextStyle,
} from 'react-native';
import { Vibration } from 'react-native';
import { SENTENCE_BEST_ITEMS } from '../data/sentence-best';

interface SentenceBestProps {
  setId: string;
  levelId: string;
  onPhaseComplete: (score: number, totalQuestions: number) => void;
}

interface OptionItem {
  text: string;
  index: number;
}

const ACCENT_COLOR = '#F2935C';
const CORRECT_COLOR = '#437F76';
const INCORRECT_COLOR = '#924646';

export default function SentenceBestComponent({ onPhaseComplete }: SentenceBestProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [options, setOptions] = useState<OptionItem[]>([]);
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
  const [revealed, setRevealed] = useState(false);
  const [score, setScore] = useState(100);

  const currentItem = useMemo(() => SENTENCE_BEST_ITEMS[currentIndex], [currentIndex]);

  useEffect(() => {
    const shuffled = currentItem.sentences
      .map((text, index) => ({ text, index, sort: Math.random() }))
      .sort((a, b) => a.sort - b.sort)
      .map(({ text, index }) => ({ text, index }));

    setOptions(shuffled);
    setSelectedIndex(null);
    setRevealed(false);
  }, [currentIndex]);

  const progress = currentIndex / SENTENCE_BEST_ITEMS.length;

  const handleSelect = (index: number) => {
    if (revealed) return;
    setSelectedIndex(index);
  };

  const handleSubmit = () => {
    if (selectedIndex === null || revealed) return;

    Vibration.vibrate(10);

    const selectedOption = options[selectedIndex];
    const isCorrect = selectedOption.index === currentItem.correctIndex;

    if (isCorrect) {
      setScore(prev => prev + 1);
      AccessibilityInfo.announceForAccessibility('Correct');
    } else {
      setScore(prev => {
        const updated = Math.max(0, prev - 4);
        AccessibilityInfo.announceForAccessibility(
          `Incorrect. Correct is ${currentItem.sentences[currentItem.correctIndex]}`
        );
        return updated;
      });
    }

    setRevealed(true);
  };

  const handleNext = () => {
    if (!revealed) return;

    if (currentIndex === SENTENCE_BEST_ITEMS.length - 1) {
      onPhaseComplete(score, SENTENCE_BEST_ITEMS.length);
    } else {
      setCurrentIndex(prev => prev + 1);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.progressContainer}>
        <Text style={styles.progressText}>Word {currentIndex + 1} of {SENTENCE_BEST_ITEMS.length}</Text>
        <Text style={styles.scoreText}>{score}</Text>
      </View>
      <View style={styles.progressBar}>
        <View style={[styles.progressFill, { width: `${progress * 100}%` }]} />
      </View>

      <Text style={styles.headerText}>Which Sentence is Best?</Text>

      <View style={styles.wordHeader}>
        <Text style={styles.mainWord}>{currentItem.word}</Text>
        <Text style={styles.ipaText}>{currentItem.ipa}</Text>
      </View>

      <View style={styles.optionsContainer}>
        {options.map((option, idx) => {
          const isSelected = selectedIndex === idx;
          const isCorrectOption = option.index === currentItem.correctIndex;

          const optionStyle: ViewStyle[] = [styles.optionButton];
          const textStyle: TextStyle[] = [styles.optionText];

          if (revealed && isSelected) {
            optionStyle.push(isCorrectOption ? styles.correctButton : styles.incorrectButton);
          }

          if (revealed && !isSelected && isCorrectOption) {
            textStyle.push(styles.correctText);
          }

          return (
            <TouchableOpacity
              key={option.index}
              style={optionStyle}
              activeOpacity={0.8}
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
            style={[styles.primaryButton, (selectedIndex === null) && styles.disabledButton]}
            disabled={selectedIndex === null}
            onPress={handleSubmit}
            accessibilityRole="button"
          >
            <Text style={styles.primaryButtonText}>Reveal</Text>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity
            style={styles.primaryButton}
            onPress={handleNext}
            accessibilityRole="button"
          >
            <Text style={styles.primaryButtonText}>
              {currentIndex === SENTENCE_BEST_ITEMS.length - 1 ? 'Finish' : 'Next'}
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
    backgroundColor: '#252525',
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
  scoreText: {
    fontSize: 16,
    fontWeight: '600',
    color: ACCENT_COLOR,
  },
  progressBar: {
    height: 6,
    backgroundColor: '#333',
    borderRadius: 3,
    overflow: 'hidden',
    marginBottom: 24,
  },
  progressFill: {
    height: '100%',
    backgroundColor: ACCENT_COLOR,
  },
  headerText: {
    textTransform: 'uppercase',
    fontSize: 14,
    color: ACCENT_COLOR,
    letterSpacing: 1,
    fontWeight: '600',
  },
  wordHeader: {
    alignItems: 'center',
    marginTop: 24,
    marginBottom: 24,
  },
  mainWord: {
    fontSize: 32,
    fontWeight: '700',
    color: '#fff',
  },
  ipaText: {
    fontSize: 16,
    color: '#9CA3AF',
    fontStyle: 'italic',
  },
  optionsContainer: {
    gap: 12,
    flexGrow: 1,
  },
  optionButton: {
    paddingVertical: 16,
    paddingHorizontal: 16,
    borderRadius: 16,
    backgroundColor: '#3A3A3A',
  },
  optionText: {
    color: '#fff',
    fontSize: 16,
    lineHeight: 22,
  },
  correctText: {
    color: CORRECT_COLOR,
  },
  correctButton: {
    backgroundColor: CORRECT_COLOR,
  },
  incorrectButton: {
    backgroundColor: INCORRECT_COLOR,
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

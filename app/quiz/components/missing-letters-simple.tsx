import React, { useEffect, useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
} from 'react-native';

interface MissingLettersProps {
  setId: string;
  levelId: string;
  onPhaseComplete: (score: number, totalQuestions: number) => void;
  sharedScore: number;
  onScoreShare: (newScore: number) => void;
}

export default function MissingLettersSimple({ onPhaseComplete, sharedScore, onScoreShare }: MissingLettersProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [isAnswered, setIsAnswered] = useState(false);
  const [phasePenalties, setPhasePenalties] = useState(0);

  // Single-letter multiple-choice version
  const words = useMemo(() => ([
    { word: 'conserve', template: 'con_erve', answer: 's', distractors: ['c', 'z', 't'] },
    { word: 'pollute', template: 'poll_te', answer: 'u', distractors: ['o', 'a', 'e'] },
    { word: 'renewable', template: 'renew_ble', answer: 'a', distractors: ['i', 'o', 'e'] },
    { word: 'ecosystem', template: 'ecos_stem', answer: 'y', distractors: ['i', 'e', 'a'] },
    { word: 'sustainable', template: 'sustain_ble', answer: 'a', distractors: ['e', 'o', 'u'] },
  ]), []);

  const current = words[currentIndex];
  const isLast = currentIndex === words.length - 1;
  const options = useMemo(() => {
    const arr = [current.answer, ...current.distractors];
    // Fisher-Yates shuffle for stability
    for (let i = arr.length - 1; i > 0; i -= 1) {
      const j = Math.floor(Math.random() * (i + 1));
      const tmp = arr[i];
      arr[i] = arr[j];
      arr[j] = tmp;
    }
    return arr;
  }, [current]);

  const isCorrect = selectedOption != null && selectedOption.toLowerCase() === current.answer.toLowerCase();

  const handleSelect = (choice: string) => {
    if (isAnswered) return;
    setSelectedOption(choice);
    setIsAnswered(true);

    if (choice.toLowerCase() !== current.answer.toLowerCase()) {
      setPhasePenalties(prev => prev + 1);
      onScoreShare(Math.max(0, sharedScore - 1));
    }
  };

  useEffect(() => {
    if (!isAnswered) return;
    const timer = setTimeout(() => {
      if (isLast) {
        onPhaseComplete(phasePenalties, words.length);
      } else {
        setCurrentIndex(prev => prev + 1);
        setSelectedOption(null);
        setIsAnswered(false);
      }
    }, 1200);
    return () => clearTimeout(timer);
  }, [isAnswered, isLast, onPhaseComplete, phasePenalties, words.length]);

  const renderOption = ({ item }: { item: string }) => {
    const isSelected = selectedOption === item;
    const showCorrect = isAnswered && item === current.answer;
    const backgroundColor = isAnswered
      ? showCorrect
        ? '#1E3A29' // soft green
        : isSelected
          ? '#3A1E1E' // soft red
          : '#243B53'
      : '#243B53';
    const borderColor = isAnswered
      ? showCorrect
        ? '#4CAF50'
        : isSelected
          ? '#EF4444'
          : '#2D4A66'
      : '#2D4A66';

    return (
      <TouchableOpacity
        onPress={() => handleSelect(item)}
        disabled={isAnswered}
        style={[styles.option, { backgroundColor, borderColor }]}
      >
        <Text style={styles.optionText}>{item}</Text>
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Pick the missing letter</Text>

      <View style={styles.wordContainer}>
        <Text style={styles.wordText}>{current.template}</Text>
        <Text style={styles.hint}>Select the letter that completes the word</Text>
      </View>

      <FlatList
        data={options}
        keyExtractor={(item, index) => `${item}-${index}`}
        renderItem={renderOption}
        numColumns={2}
        columnWrapperStyle={styles.row}
        contentContainerStyle={styles.optionsList}
      />

      {isAnswered && (
        <View style={styles.feedbackContainer}>
          <Text style={[styles.feedbackText, { color: isCorrect ? '#4CAF50' : '#EF4444' }]}>
            {isCorrect ? '✓ Correct!' : `✗ Incorrect. The answer is "${current.answer}"`}
          </Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#1B263B',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFFFFF',
    textAlign: 'center',
    marginBottom: 30,
  },
  wordContainer: {
    alignItems: 'center',
    marginBottom: 30,
  },
  wordText: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 10,
    letterSpacing: 2,
  },
  hint: {
    fontSize: 16,
    color: '#999',
  },
  optionsList: {
    gap: 12,
  },
  row: {
    gap: 12,
    justifyContent: 'center',
  },
  option: {
    flex: 1,
    paddingVertical: 16,
    borderRadius: 10,
    alignItems: 'center',
    borderWidth: 1,
  },
  optionText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '600',
  },
  feedbackContainer: {
    marginBottom: 20,
    alignItems: 'center',
  },
  feedbackText: {
    fontSize: 18,
    fontWeight: '600',
  },
});

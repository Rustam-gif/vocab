import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
} from 'react-native';
import AnimatedNextButton from './AnimatedNextButton';

interface DialogueProps {
  setId: string;
  levelId: string;
  onPhaseComplete: (score: number, totalQuestions: number) => void;
  sharedScore: number;
  onScoreShare: (newScore: number) => void;
}

export default function DialogueSimple({ onPhaseComplete, sharedScore, onScoreShare }: DialogueProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [isAnswered, setIsAnswered] = useState(false);

  // @doc: note=Two-scenario prototype to validate dialogue pacing before wiring dynamic content
  // Simple dialogue data
  const dialogues = [
    {
      id: '1',
      speakerA: "We should always try to",
      speakerB: "resources, especially water during droughts.",
      options: [
        { text: 'conserve', isCorrect: true },
        { text: 'waste', isCorrect: false },
        { text: 'destroy', isCorrect: false },
        { text: 'ignore', isCorrect: false },
      ]
    },
    {
      id: '2', 
      speakerA: "The factory has been",
      speakerB: "the river with harmful chemicals.",
      options: [
        { text: 'polluting', isCorrect: true },
        { text: 'cleaning', isCorrect: false },
        { text: 'protecting', isCorrect: false },
        { text: 'preserving', isCorrect: false },
      ]
    }
  ];

  const currentDialogue = dialogues[currentIndex];
  const isLast = currentIndex === dialogues.length - 1;

  const handleAnswerSelect = (answerIndex: number) => {
    if (isAnswered) return;
    
    setSelectedAnswer(answerIndex);
    setIsAnswered(true);
    
    const isCorrect = currentDialogue.options[answerIndex].isCorrect;
    
    let newScore = sharedScore;
    if (!isCorrect) {
      newScore = Math.max(0, sharedScore - 1);
    }
    onScoreShare(newScore);
  };

  const handleNext = () => {
    if (!isAnswered) return;
    
    if (isLast) {
      onPhaseComplete(0, dialogues.length);
    } else {
      setCurrentIndex(prev => prev + 1);
      setSelectedAnswer(null);
      setIsAnswered(false);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Complete the Dialogue</Text>
      
      <View style={styles.dialogueContainer}>
        <Text style={styles.speakerA}>Person A: "{currentDialogue.speakerA}"</Text>
        <Text style={styles.speakerB}>Person B: "{currentDialogue.speakerB}"</Text>
      </View>

      <View style={styles.optionsContainer}>
        {currentDialogue.options.map((option, index) => {
          const isSelected = selectedAnswer === index;
          const isCorrect = option.isCorrect;
          const showFeedback = isAnswered;
          
          let backgroundColor = '#2C2C2C';
          if (showFeedback) {
            if (isCorrect) {
              backgroundColor = '#4CAF50';
            } else if (isSelected && !isCorrect) {
              backgroundColor = '#EF4444';
            }
          } else if (isSelected) {
            backgroundColor = '#F2935C';
          }

          return (
            <TouchableOpacity
              key={index}
              style={[styles.option, { backgroundColor }]}
              onPress={() => handleAnswerSelect(index)}
              disabled={isAnswered}
            >
              <Text style={styles.optionText}>{option.text}</Text>
              {showFeedback && isCorrect && (
                <Text style={styles.checkmark}>✓</Text>
              )}
            </TouchableOpacity>
          );
        })}
      </View>

      {isAnswered && (
        <AnimatedNextButton
          onPress={handleNext}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#1E1E1E',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFFFFF',
    textAlign: 'center',
    marginBottom: 30,
  },
  dialogueContainer: {
    backgroundColor: '#2C2C2C',
    padding: 20,
    borderRadius: 12,
    marginBottom: 30,
  },
  speakerA: {
    fontSize: 16,
    color: '#FFFFFF',
    marginBottom: 10,
  },
  speakerB: {
    fontSize: 16,
    color: '#FFFFFF',
  },
  optionsContainer: {
    gap: 12,
    marginBottom: 30,
  },
  option: {
    padding: 16,
    borderRadius: 8,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  optionText: {
    fontSize: 16,
    color: '#FFFFFF',
    fontWeight: '500',
  },
  checkmark: {
    fontSize: 20,
    color: '#FFFFFF',
    fontWeight: 'bold',
  },
  nextButton: {
    backgroundColor: '#F2935C',
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  nextButtonText: {
    fontSize: 18,
    color: '#FFFFFF',
    fontWeight: '600',
  },
});

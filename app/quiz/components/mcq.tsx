import React, { useState, useEffect, useRef } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  Animated, 
  Dimensions 
} from 'react-native';
import { ChevronRight } from 'lucide-react-native';
import { levels } from '../data/levels';
import { analyticsService } from '../../../services/AnalyticsService';

interface MCQProps {
  setId: string;
  levelId: string;
  onPhaseComplete: (score: number, totalQuestions: number) => void;
  sharedScore: number;
  onScoreShare: (newScore: number) => void;
}

interface Question {
  word: string;
  ipa: string;
  definition: string;
  example: string;
  options: string[];
  correctAnswer: number;
  synonyms: string[];
}

const { width: SCREEN_WIDTH } = Dimensions.get('window');

const shortenPhrase = (phrase: string): string => {
  let trimmed = phrase.trim();
  if (trimmed.toLowerCase().startsWith('to ')) {
    trimmed = trimmed.slice(3);
  }

  return trimmed.charAt(0).toUpperCase() + trimmed.slice(1);
};

export default function MCQComponent({ setId, levelId, onPhaseComplete, sharedScore, onScoreShare }: MCQProps) {
  const [currentWordIndex, setCurrentWordIndex] = useState(0);
  const [displayScore, setDisplayScore] = useState(sharedScore);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [showFeedback, setShowFeedback] = useState(false);
  const [isCorrect, setIsCorrect] = useState(false);
  const [isAnswered, setIsAnswered] = useState(false);
  const [isProcessingNext, setIsProcessingNext] = useState(false);
  const [phaseCorrect, setPhaseCorrect] = useState(0);
  const pendingScoreRef = useRef<number | null>(null);
  
  // Animation refs
  const fadeAnim = useRef(new Animated.Value(1)).current;
  const slideAnim = useRef(new Animated.Value(0)).current;
  const progressAnim = useRef(new Animated.Value(0)).current;
  const deductionAnim = useRef(new Animated.Value(0)).current;
  const questionStartRef = useRef<number>(Date.now());

  useEffect(() => {
    console.log('MCQComponent - useEffect triggered:', { setId, levelId });
    generateQuestions();
  }, [setId, levelId]);

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

  const generateQuestions = () => {
    console.log('MCQComponent - generateQuestions called with:', { setId, levelId });
    
    const level = levels.find(l => l.id === levelId);
    console.log('MCQComponent - Found level:', level?.name);
    if (!level) return;

    const set = level.sets.find(s => s.id.toString() === setId);
    console.log('MCQComponent - Found set:', set?.title);
    if (!set || !set.words) return;

    const generatedQuestions: Question[] = set.words.map(word => {
      const shortDefinition = shortenPhrase(word.definition);
      const options = [
        shortDefinition,
        generateDistractor(shortDefinition, 'opposite'),
        generateDistractor(shortDefinition, 'similar'),
        generateDistractor(shortDefinition, 'unrelated')
      ].map(option => option.charAt(0).toUpperCase() + option.slice(1));

      const shuffledOptions = [...options]
        .map(option => ({ option, sort: Math.random() }))
        .sort((a, b) => a.sort - b.sort)
        .map(({ option }) => option);
      const correctIndex = shuffledOptions.indexOf(shortDefinition);

      return {
        word: word.word,
        ipa: word.phonetic,
        definition: shortDefinition,
        example: word.example,
        options: shuffledOptions,
        correctAnswer: correctIndex,
        synonyms: word.synonyms || []
      };
    });

    setQuestions(generatedQuestions);
    setDisplayScore(sharedScore);
    setPhaseCorrect(0);
    questionStartRef.current = Date.now();
  };

const generateDistractor = (correctDef: string, type: string): string => {
  // Count words in correct definition to match length
  const wordCount = correctDef.trim().split(/\s+/).length;
  
  const distractors = {
    opposite: [
      'Go to sleep and rest quietly',
      'Fall asleep and start dreaming',
      'Lie down and close your eyes',
      'Rest in bed without moving'
    ],
    similar: [
      'Start the day feeling refreshed',
      'Rise from sleep and get ready',
      'Open your eyes and become alert',
      'Get out of bed feeling awake'
    ],
    unrelated: [
      'Prepare breakfast in the morning',
      'Exercise outside with your friends',
      'Study for your upcoming exam',
      'Watch movies on the television'
    ]
  };

  const typeDistractors = distractors[type as keyof typeof distractors] || distractors.unrelated;
  let selected = typeDistractors[Math.floor(Math.random() * typeDistractors.length)];
  
  // Adjust length to be similar to correct answer (within 1-2 words)
  const selectedWordCount = selected.trim().split(/\s+/).length;
  const diff = Math.abs(wordCount - selectedWordCount);
  
  // If too different, try to match better by adding/removing words
  if (diff > 2) {
    // Try another option from the same category
    const alternates = typeDistractors.filter(d => {
      const wc = d.trim().split(/\s+/).length;
      return Math.abs(wordCount - wc) <= 2;
    });
    if (alternates.length > 0) {
      selected = alternates[Math.floor(Math.random() * alternates.length)];
    }
  }
  
  return selected;
};

  const handleAnswerSelect = (answerIndex: number) => {
    if (isAnswered) return; // Prevent multiple selections

    setSelectedAnswer(answerIndex);
    setIsAnswered(true);
    const correct = answerIndex === questions[currentWordIndex].correctAnswer;
    setIsCorrect(correct);
    setShowFeedback(true);

    // Track analytics for this question
    try {
      const timeSpent = Math.max(0, Math.round((Date.now() - questionStartRef.current) / 1000));
      analyticsService.recordResult({
        wordId: questions[currentWordIndex]?.word || String(currentWordIndex + 1),
        exerciseType: 'mcq',
        correct,
        timeSpent,
        timestamp: new Date(),
        score: correct ? 1 : 0,
      });
    } catch {}

    if (correct) {
      setPhaseCorrect(prev => prev + 1);
    } else {
      setDisplayScore(prev => {
        const next = Math.max(0, prev - 5);
        pendingScoreRef.current = next;
        return next;
      });
      triggerDeductionAnimation();
    }
    setIsProcessingNext(false);
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

  const handleNextPress = () => {
    if (!isAnswered || isProcessingNext) return;
    setIsProcessingNext(true);

    if (currentWordIndex < questions.length - 1) {
      nextWord();
    } else {
      onPhaseComplete(phaseCorrect, questions.length);
    }
  };

  const nextWord = () => {
    setCurrentWordIndex(prev => prev + 1);
    setSelectedAnswer(null);
    setShowFeedback(false);
    setIsAnswered(false);
    questionStartRef.current = Date.now();

    Animated.timing(progressAnim, {
      toValue: (currentWordIndex + 1) / questions.length,
      duration: 100,
      useNativeDriver: false,
    }).start(() => {
      setIsProcessingNext(false);
    });
  };

  if (questions.length === 0) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.loadingText}>Loading questions...</Text>
      </View>
    );
  }

  const currentQuestion = questions[currentWordIndex];
  const deductionOpacity = deductionAnim.interpolate({
    inputRange: [0, 0.2, 1],
    outputRange: [0, 1, 0],
  });
  const deductionTranslateY = deductionAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, -35],
  });

  const escapeRegExp = (value: string) => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

  const renderSentenceWithHighlight = (sentence: string, target: string) => {
    const escaped = escapeRegExp(target.trim());
    const segments = escaped.split(/\s+/);
    const pattern = segments
      .map((segment, index) => (index === segments.length - 1 ? `${segment}\\w*` : segment))
      .join('\\s+');
    const regex = new RegExp(pattern, 'gi');

    const parts: Array<{ text: string; highlight: boolean }> = [];
    let lastIndex = 0;
    let match: RegExpExecArray | null;

    while ((match = regex.exec(sentence)) !== null) {
      if (match.index > lastIndex) {
        parts.push({ text: sentence.slice(lastIndex, match.index), highlight: false });
      }
      parts.push({ text: match[0], highlight: true });
      lastIndex = regex.lastIndex;
    }

    if (lastIndex < sentence.length) {
      parts.push({ text: sentence.slice(lastIndex), highlight: false });
    }

    return parts.map((part, index) => (
      <Text key={`${part.text}-${index}`} style={part.highlight ? styles.highlightedWord : undefined}>
        {part.text}
      </Text>
    ));
  };

  return (
    <View style={styles.container}>
      {/* Header with Progress and Score */}
      <View style={styles.header}>
        <View style={styles.progressContainer}>
          <Text style={styles.progressText}>
            Word {currentWordIndex + 1} of {questions.length}
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
          <Animated.View 
            style={[
              styles.progressFill, 
              { 
                width: progressAnim.interpolate({
                  inputRange: [0, 1],
                  outputRange: ['0%', '100%'],
                  extrapolate: 'clamp',
                })
              }
            ]} 
          />
        </View>
      </View>

      <Animated.View 
        style={{
          flex: 1,
          opacity: fadeAnim,
          transform: [{ translateX: slideAnim }],
          paddingHorizontal: 20,
          paddingTop: 24,
        }}
      >
        <View style={styles.wordHeader}>
          <Text style={styles.wordText}>{currentQuestion.word}</Text>
          <Text style={styles.ipaText}>{currentQuestion.ipa}</Text>
          <Text style={styles.exampleInline}>
            {renderSentenceWithHighlight(currentQuestion.example, currentQuestion.word)}
          </Text>
        </View>

        <View style={styles.optionsContainer}>
          {currentQuestion.options.map((option, index) => {
            const isSelected = selectedAnswer === index;
            const isCorrectOption = index === currentQuestion.correctAnswer;

            return (
              <TouchableOpacity
                key={index}
                style={[
                  styles.optionButton,
                  (showFeedback && index === currentQuestion.correctAnswer) && styles.correctOption,
                  (showFeedback && isSelected && !isCorrectOption) && styles.wrongOption,
                ]}
                onPress={() => handleAnswerSelect(index)}
                disabled={isAnswered}
              >
                <Text style={[
                  styles.optionText,
                ]}>
                  {option}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {isAnswered && (
          <TouchableOpacity
            style={[styles.nextButton, isProcessingNext && styles.nextButtonDisabled]}
            onPress={handleNextPress}
            disabled={isProcessingNext}
          >
            <Text style={styles.nextButtonText}>
              {currentWordIndex === questions.length - 1 ? 'Finish' : 'Next'}
            </Text>
          </TouchableOpacity>
        )}

      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1E1E1E',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#252525',
  },
  loadingText: {
    fontSize: 16,
    color: '#9CA3AF',
  },
  header: {
    paddingHorizontal: 20,
    paddingVertical: 16,
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
    color: '#F2935C',
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
    backgroundColor: '#F2935C',
    borderRadius: 3,
  },
  wordHeader: {
    alignItems: 'center',
    marginBottom: 32,
  },
  wordText: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 8,
  },
  ipaText: {
    fontSize: 18,
    color: '#9CA3AF',
    fontStyle: 'italic',
  },
  exampleInline: {
    marginTop: 8,
    fontSize: 14,
    color: '#9CA3AF',
    fontStyle: 'italic',
    textAlign: 'center',
  },
  optionsContainer: {
    marginBottom: 20,
  },
  optionButton: {
    backgroundColor: '#3A3A3A',
    borderRadius: 12,
    paddingVertical: 18,
    paddingHorizontal: 20,
    marginBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    minHeight: 72,
  },
  correctOption: {
    backgroundColor: '#437F76',
  },
  wrongOption: {
    backgroundColor: '#924646',
  },
  optionText: {
    fontSize: 16,
    color: '#fff',
    flex: 1,
    fontWeight: '500',
    textAlignVertical: 'center',
  },
  highlightedWord: {
    fontWeight: 'bold',
    color: '#F2935C',
  },
  nextButton: {
    marginTop: 16,
    backgroundColor: '#F2935C',
    borderRadius: 20,
    paddingVertical: 18,
    paddingHorizontal: 32,
    alignItems: 'center',
    alignSelf: 'center',
    minWidth: 160,
  },
  nextButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  nextButtonDisabled: {
    opacity: 0.6,
  },
});

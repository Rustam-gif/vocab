import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
  Animated,
  Easing,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { ArrowLeft } from 'lucide-react-native';
import WordIntroComponent from './components/word-intro';
import MCQComponent from './components/mcq';
import SynonymComponent from './components/synonym';
import SentenceUsageComponent from './components/sentence-usage';
import MissingLetters from './components/missing-letters';
import { levels } from './data/levels';
import { analyticsService } from '../../services/AnalyticsService';

const ACCENT = '#F2935C';
const TAB_WIDTH = 88;

interface Phase {
  id: string;
  name: string;
  component: React.ComponentType<any>;
  completed: boolean;
  score?: number;
  totalQuestions?: number;
}

export default function AtlasPracticeIntegrated() {
  const router = useRouter();
  const { setId, levelId } = useLocalSearchParams<{ setId: string; levelId: string }>();
  
  // Debug logging
  console.log('AtlasPracticeIntegrated - Received params:', { setId, levelId });
  
  const [currentPhase, setCurrentPhase] = useState(0);
  const [phases, setPhases] = useState<Phase[]>([
    { id: 'intro', name: 'Intro', component: WordIntroComponent, completed: false },
    { id: 'mcq', name: 'MCQ', component: MCQComponent, completed: false },
    { id: 'synonym', name: 'Synonym', component: SynonymComponent, completed: false },
    { id: 'usage', name: 'Usage', component: SentenceUsageComponent, completed: false },
    { id: 'letters', name: 'Letters', component: MissingLetters, completed: false },
  ]);
  const [totalScore, setTotalScore] = useState(100);
  const [totalCorrect, setTotalCorrect] = useState(0);
  const [totalQuestions, setTotalQuestions] = useState(0);
  const [mlIndex, setMlIndex] = useState(0);
  const animatedIndex = useRef(new Animated.Value(0)).current;
  const [tabsWidth, setTabsWidth] = useState(0);

  const handlePhaseComplete = (score: number = 0, questions: number = 0) => {
    const phase = phases[currentPhase];
    const wasCompleted = phase?.completed ?? false;
    const updatedPhases = [...phases];
    updatedPhases[currentPhase] = {
      ...updatedPhases[currentPhase],
      completed: true,
      score,
      totalQuestions: questions,
    };
    setPhases(updatedPhases);

    const clampedQuestions = Math.max(0, questions);
    const clampedCorrect = Math.max(0, Math.min(clampedQuestions, score));

    let nextTotalCorrect = totalCorrect;
    let nextTotalQuestions = totalQuestions;

    if (!wasCompleted && phase?.id !== 'intro') {
      nextTotalCorrect += clampedCorrect;
      nextTotalQuestions += clampedQuestions;
      setTotalCorrect(nextTotalCorrect);
      setTotalQuestions(nextTotalQuestions);
    }

    if (currentPhase < phases.length - 1) {
      setCurrentPhase(prev => prev + 1);
    } else {
      navigateToResults(nextTotalCorrect, nextTotalQuestions);
    }
  };

  const navigateToResults = (finalCorrect: number, finalQuestions: number) => {
    router.push({
      pathname: '/quiz/atlas-results',
      params: {
        score: Math.max(0, finalCorrect).toString(),
        totalQuestions: Math.max(0, finalQuestions).toString(),
        points: Math.max(0, totalScore).toString(),
        setId,
        levelId
      }
    });
  };

  useEffect(() => {
    // Reset Missing Letters index when entering that phase or when params change
    const phase = phases[currentPhase];
    if (phase?.id === 'letters') {
      setMlIndex(0);
    }
  }, [currentPhase, setId, levelId]);

  useEffect(() => {
    Animated.spring(animatedIndex, {
      toValue: currentPhase,
      tension: 40,
      friction: 20,
      useNativeDriver: true,
    }).start();
  }, [currentPhase, animatedIndex]);

  const getCurrentPhaseComponent = () => {
    const phase = phases[currentPhase];
    if (!phase) return null;

    const Component = phase.component;
    
    // Handle Word Intro component differently
    if (phase.id === 'intro') {
      return (
        <Component
          setId={setId || ''}
          levelId={levelId || ''}
          onComplete={() => handlePhaseComplete(0, 0)}
        />
      );
    }
    
    // Special wiring for Missing Letters (new API: single-word component)
    if (phase.id === 'letters') {
      const level = levels.find(l => l.id === (levelId || ''));
      const currentSet = level?.sets.find(s => s.id.toString() === String(setId));
      const words = currentSet?.words ?? [];
      if (!words.length) {
        return (
          <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
            <Text style={{ color: '#9CA3AF' }}>No words found for this set.</Text>
          </View>
        );
      }

      const w = words[Math.min(mlIndex, words.length - 1)];

      return (
        <MissingLetters
          word={w.word}
          ipa={w.phonetic}
          clue={w.definition}
          theme="dark"
          wordIndex={mlIndex}
          totalWords={words.length}
          sharedScore={totalScore}
          onResult={({ mistakes, usedReveal }) => {
            const rawPenalty = Math.max(0, mistakes) + (usedReveal ? 3 : 0);
            const penalty = Math.max(5, rawPenalty || 5);
            setTotalScore(prev => Math.max(0, prev - penalty));
            // Record analytics for Missing Letters
            try {
              const isCorrect = (mistakes || 0) === 0 && !usedReveal;
              analyticsService.recordResult({
                wordId: w.word,
                exerciseType: 'letters',
                correct: isCorrect,
                timeSpent: 0,
                timestamp: new Date(),
                score: isCorrect ? 1 : 0,
              });
            } catch {}
          }}
          onNext={() => {
            const next = mlIndex + 1;
            if (next < words.length) {
              setMlIndex(next);
            } else {
              // Phase done; contribute questions count, scoring is already applied via penalties to totalScore
              handlePhaseComplete(0, words.length);
            }
          }}
        />
      );
    }
    return (
      <Component
        setId={setId || ''}
        levelId={levelId || ''}
        onPhaseComplete={handlePhaseComplete}
        sharedScore={totalScore}
        onScoreShare={setTotalScore}
      />
    );
  };

  if (!setId || !levelId) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>Missing set or level information</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <ArrowLeft size={24} color="#fff" />
        </TouchableOpacity>

        <View
          style={styles.exerciseTabsWrapper}
          onLayout={event => setTabsWidth(event.nativeEvent.layout.width)}
        >
          <Animated.View
            style={[
              styles.exerciseNamesContainer,
              tabsWidth > 0 && {
                transform: [{
                  translateX: animatedIndex.interpolate({
                    inputRange: phases.map((_, i) => i),
                    outputRange: phases.map((_, i) => ((tabsWidth - TAB_WIDTH) / 2) - i * TAB_WIDTH),
                  }),
                }],
              },
            ]}
          >
            {phases.map((phase, index) => (
              <TouchableOpacity
                key={phase.id}
                onPress={() => setCurrentPhase(index)}
                style={styles.exerciseNameTouchable}
                activeOpacity={0.8}
              >
                <Text
                  style={[
                    styles.exerciseName,
                    currentPhase === index && styles.exerciseNameActive,
                  ]}
                >
                  {phase.name}
                </Text>
              </TouchableOpacity>
            ))}
          </Animated.View>
        </View>

        <View style={styles.headerSpacer} />
      </View>

      {/* Current Phase Component */}
      <View style={styles.phaseContainer}>
        {getCurrentPhaseComponent()}
      </View>
    </SafeAreaView>
  );
}

type PhaseTabProps = {
  index: number;
  title: string;
  currentIndex: number;
  onPress: () => void;
  animatedIndex: Animated.Value;
};

function PhaseTab({ index, title, currentIndex, onPress, animatedIndex }: PhaseTabProps) {
  const isActive = currentIndex === index;
  
  const scale = animatedIndex.interpolate({
    inputRange: [index - 1, index, index + 1],
    outputRange: [0.92, 1, 0.92],
    extrapolate: 'clamp',
  });
  
  const color = animatedIndex.interpolate({
    inputRange: [index - 1, index, index + 1],
    outputRange: ['#6B7280', '#F2935C', '#6B7280'],
    extrapolate: 'clamp',
  });
  
  const opacity = animatedIndex.interpolate({
    inputRange: [index - 1.5, index - 1, index, index + 1, index + 1.5],
    outputRange: [0.4, 0.6, 1, 0.6, 0.4],
    extrapolate: 'clamp',
  });
  
  const bubbleOpacity = animatedIndex.interpolate({
    inputRange: [index - 0.5, index, index + 0.5],
    outputRange: [0, 1, 0],
    extrapolate: 'clamp',
  });

  return (
    <TouchableOpacity
      style={styles.tabItem}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <Animated.View style={{ opacity }}>
        <Animated.View style={[
          styles.tabDot,
          { 
            transform: [{ scale }],
            backgroundColor: color,
          }
        ]}>
          <Animated.View style={[
            styles.tabDotGlow,
            {
              opacity: bubbleOpacity,
            }
          ]} />
        </Animated.View>
      </Animated.View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1E1E1E',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 12,
  },
  backButton: {
    padding: 8,
  },
  exerciseTabsWrapper: {
    flex: 1,
    overflow: 'hidden',
    justifyContent: 'center',
    alignItems: 'center',
  },
  exerciseNamesContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 0,
  },
  exerciseNameTouchable: {
    width: TAB_WIDTH,
    paddingVertical: 6,
    alignItems: 'center',
  },
  exerciseName: {
    fontSize: 13,
    fontWeight: '500',
    color: '#6B7280',
    letterSpacing: 0.2,
    textAlign: 'center',
  },
  exerciseNameActive: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  headerSpacer: {
    width: 32,
  },
  phaseContainer: {
    flex: 1,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorText: {
    fontSize: 16,
    color: '#9CA3AF',
  },
});

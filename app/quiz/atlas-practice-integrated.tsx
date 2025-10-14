import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
  Animated,
  Easing,
  Dimensions,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { ArrowLeft } from 'lucide-react-native';
import WordIntroComponent from './components/word-intro';
import MCQComponent from './components/mcq';
import SynonymComponent from './components/synonym';
import SentenceUsageComponent from './components/sentence-usage';
import MissingLetters from './components/missing-letters';
import { levels } from './data/levels';
import { useAppStore } from '../../lib/store';
import { getTheme } from '../../lib/theme';
import { analyticsService } from '../../services/AnalyticsService';
import { SetProgressService } from '../../services/SetProgressService';

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
  const themeName = useAppStore(s => s.theme);
  const colors = getTheme(themeName);
  const isLight = themeName === 'light';
  
  // Debug logging
  console.log('AtlasPracticeIntegrated - Received params:', { setId, levelId });
  
  // Check if this is a quiz type
  const level = useMemo(() => levels.find(l => l.id === levelId), [levelId]);
  const set = useMemo(() => level?.sets.find(s => s.id.toString() === setId), [level, setId]);

  // Compute dynamic quiz words for Upper-Intermediate when set is not found
  const computedQuizWords = useMemo(() => {
    if (!level || level.id !== 'upper-intermediate') return null;
    if (set) return null; // exists statically
    if (!setId || !/^quiz-\d+$/.test(String(setId))) return null;
    // Rebuild the same visible list used in Learn: drop first 10 numeric sets, exclude quizzes
    const baseSets = level.sets.filter(s => {
      const n = Number(s.id);
      return (isNaN(n) || n > 10) && (s as any).type !== 'quiz';
    });
    const groupIndex = Math.max(1, parseInt(String(setId).split('-')[1], 10));
    const start = (groupIndex - 1) * 4;
    const group = baseSets.slice(start, start + 4);
    if (group.length < 1) return null;
    const words: any[] = [];
    group.forEach(g => {
      words.push(...(g.words || []).slice(0, 5));
    });
    return words.length ? words : null;
  }, [level, set, setId]);

  const isQuiz = (set?.type === 'quiz') || !!computedQuizWords;
  
  const [currentPhase, setCurrentPhase] = useState(0);
  const [phases, setPhases] = useState<Phase[]>(
    isQuiz
      ? [
          { id: 'mcq', name: 'MCQ', component: MCQComponent, completed: false },
          { id: 'synonym', name: 'Synonym', component: SynonymComponent, completed: false },
          { id: 'usage', name: 'Usage', component: SentenceUsageComponent, completed: false },
          { id: 'letters', name: 'Letters', component: MissingLetters, completed: false },
        ]
      : [
          { id: 'intro', name: 'Intro', component: WordIntroComponent, completed: false },
          { id: 'mcq', name: 'MCQ', component: MCQComponent, completed: false },
          { id: 'synonym', name: 'Synonym', component: SynonymComponent, completed: false },
          { id: 'usage', name: 'Usage', component: SentenceUsageComponent, completed: false },
          { id: 'letters', name: 'Letters', component: MissingLetters, completed: false },
        ]
  );
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
    // Persist completion + score for the set so Learn shows "Review" with score
    try {
      if (levelId && setId) {
        const points = Math.max(0, totalScore);
        SetProgressService.markCompleted(String(levelId), String(setId), points);
      }
    } catch {}
    router.replace({
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

  // Initialize progress/resume and mark in-progress while user is inside
  useEffect(() => {
    (async () => {
      try {
        await SetProgressService.initialize();
        if (levelId && setId) {
          const saved = SetProgressService.get(String(levelId), String(setId));
          if (saved?.status === 'in_progress' && typeof saved.lastPhase === 'number') {
            // Resume where left off
            setCurrentPhase(Math.min(saved.lastPhase, phases.length - 1));
          }
          // Mark as in progress at entry
          await SetProgressService.markInProgress(String(levelId), String(setId), currentPhase);
        }
      } catch {}
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Persist in-progress phase as the user advances (do not override completed)
  useEffect(() => {
    if (!levelId || !setId) return;
    SetProgressService.markInProgress(String(levelId), String(setId), currentPhase).catch(() => {});
  }, [currentPhase, levelId, setId]);

  const getCurrentPhaseComponent = () => {
    const phase = phases[currentPhase];
    if (!phase) return null;

    const Component = phase.component as any;
    
    // Determine word range for quiz mode
    // Recap rule: every 4 prior sets → 5 words per exercise
    //   MCQ:     words 0..4   (from Set A)
    //   Synonym: words 5..9   (from Set B)
    //   Usage:   words 10..14 (from Set C)
    //   Letters: words 15..19 (from Set D)
    let wordRange: { start: number; end: number } | undefined;
    if (isQuiz) {
      if (phase.id === 'mcq') {
        wordRange = { start: 0, end: 5 };
      } else if (phase.id === 'synonym') {
        wordRange = { start: 5, end: 10 };
      } else if (phase.id === 'usage') {
        wordRange = { start: 10, end: 15 };
      } else if (phase.id === 'letters') {
        wordRange = { start: 15, end: 20 };
      }
    }
    
    // Handle Word Intro component differently
    if (phase.id === 'intro') {
      return (
        <Component
          setId={setId || ''}
          levelId={levelId || ''}
          onComplete={() => handlePhaseComplete(0, 0)}
          wordRange={wordRange}
          wordsOverride={computedQuizWords || undefined}
        />
      );
    }
    
    // Special wiring for Missing Letters (new API: single-word component)
    if (phase.id === 'letters') {
      const levelObj = levels.find(l => l.id === (levelId || ''));
      const currentSet = levelObj?.sets.find(s => s.id.toString() === String(setId));
      let words = computedQuizWords || currentSet?.words || [];
      
      // Apply word range if specified
      if (wordRange) {
        words = words.slice(wordRange.start, wordRange.end);
      }
      
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
          theme={isLight ? 'light' : 'dark'}
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
        wordRange={wordRange}
        wordsOverride={computedQuizWords || undefined}
      />
    );
  };

  if (!setId || !levelId) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={styles.errorContainer}>
          <Text style={[styles.errorText, isLight && { color: '#6B7280' }]}>Missing set or level information</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={async () => {
            // Save in-progress on manual exit
            if (levelId && setId) {
              try { await SetProgressService.markInProgress(String(levelId), String(setId), currentPhase); } catch {}
            }
            router.back();
          }}
        >
          <ArrowLeft size={24} color={isLight ? '#111827' : '#fff'} />
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
                    { color: isLight ? '#6B7280' : '#6B7280' },
                    currentPhase === index && { color: isLight ? '#111827' : '#FFFFFF', fontWeight: '700' },
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

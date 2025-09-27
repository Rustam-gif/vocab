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
const ACCENT = '#F2935C';

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
  const indicatorX = useRef(new Animated.Value(0)).current;
  const indicatorWidth = useRef(new Animated.Value(0)).current;
  const tabLayouts = useRef<Record<number, { x: number; width: number }>>({});
  const indicatorAnimatedStyle = {
    width: indicatorWidth,
    transform: [{ translateX: indicatorX }],
    opacity: indicatorWidth.interpolate({ inputRange: [0, 1], outputRange: [0, 1], extrapolate: 'clamp' }),
  } as const;

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
    Animated.timing(animatedIndex, {
      toValue: currentPhase,
      duration: 350,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: false,
    }).start();
    const layout = tabLayouts.current[currentPhase];
    if (layout) {
      Animated.timing(indicatorWidth, {
        toValue: layout.width,
        duration: 350,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: false,
      }).start();
      Animated.timing(indicatorX, {
        toValue: layout.x,
        duration: 350,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: false,
      }).start();
    }
  }, [currentPhase, animatedIndex, indicatorWidth, indicatorX]);

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
        <Text style={styles.title}>
          {phases[currentPhase]?.name || 'Practice'}
        </Text>
        <View style={styles.placeholder} />
      </View>

      {/* Phase Progress */}
      <View style={styles.phaseTabs}>
        {phases.map((phase, index) => (
          <PhaseTab
            key={phase.id}
            index={index}
            title={phase.name}
            onPress={() => setCurrentPhase(index)}
            onLayout={(layout) => {
              tabLayouts.current[index] = layout;
              if (index === currentPhase && tabLayouts.current[index]) {
                indicatorWidth.setValue(layout.width);
                indicatorX.setValue(layout.x);
              }
            }}
            animatedIndex={animatedIndex}
          />
        ))}
        <Animated.View style={[styles.tabIndicator, indicatorAnimatedStyle]} />
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
  onPress: () => void;
  onLayout: (layout: { x: number; width: number }) => void;
  animatedIndex: Animated.Value;
};

function PhaseTab({ index, title, onPress, onLayout, animatedIndex }: PhaseTabProps) {
  const color = animatedIndex.interpolate({
    inputRange: [index - 1, index, index + 1],
    outputRange: ['#9CA3AF', ACCENT, '#9CA3AF'],
    extrapolate: 'clamp',
  });

  return (
    <TouchableOpacity
      style={styles.tabItem}
      onPress={onPress}
      activeOpacity={0.85}
      onLayout={(event) => {
        const { x, width } = event.nativeEvent.layout;
        onLayout({ x, width });
      }}
    >
      <Animated.Text style={[styles.tabLabel, { color }]}>{title}</Animated.Text>
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
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  backButton: {
    padding: 8,
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    color: '#fff',
    flex: 1,
    textAlign: 'center',
  },
  placeholder: {
    width: 40,
  },
  phaseTabs: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 12,
  },
  tabItem: {
    flex: 1,
    alignItems: 'center',
  },
  tabLabel: {
    fontSize: 13,
    color: '#9CA3AF',
    fontWeight: '500',
  },
  tabLabelActive: {
    fontSize: 13,
    color: '#F2935C',
    fontWeight: '600',
  },
  tabIndicator: {
    position: 'absolute',
    bottom: 0,
    height: 2,
    borderRadius: 1,
    backgroundColor: ACCENT,
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

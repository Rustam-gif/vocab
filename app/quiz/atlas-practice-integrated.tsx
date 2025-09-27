import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, SafeAreaView, TouchableOpacity } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { ArrowLeft } from 'lucide-react-native';
import LottieView from 'lottie-react-native';
import WordIntroComponent from './components/word-intro';
import MCQComponent from './components/mcq';
import SynonymComponent from './components/synonym';
import SentenceUsageComponent from './components/sentence-usage';
import MissingLetters from './components/missing-letters';
import { levels } from './data/levels';

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
  const timelineRef = useRef<LottieView>(null);
  const lastTimelineStepRef = useRef(0);
  const timelineFrames = useRef([10, 100, 190, 280, 280]);

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
    const timeline = timelineRef.current;
    if (!timeline) {
      return;
    }

    const frames = timelineFrames.current;
    const step = Math.min(currentPhase, frames.length - 1);
    const targetFrame = frames[step];
    const previousStep = Math.min(lastTimelineStepRef.current, frames.length - 1);
    const previousFrame = frames[previousStep];

    if (step === previousStep && targetFrame === previousFrame) {
      timeline.goToAndStop(targetFrame, true);
      return;
    }

    if (targetFrame < previousFrame) {
      timeline.goToAndStop(targetFrame, true);
    } else {
      timeline.play(previousFrame, targetFrame);
    }

    lastTimelineStepRef.current = step;
  }, [currentPhase]);

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
          onResult={({ mistakes, usedReveal }) => {
            const penalty = Math.max(0, mistakes) + (usedReveal ? 3 : 0);
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
        {phases.map((phase, index) => {
          const isActive = index === currentPhase;
          return (
            <TouchableOpacity
              key={phase.id}
              style={styles.tabItem}
              onPress={() => setCurrentPhase(index)}
              activeOpacity={0.8}
            >
              <Text style={isActive ? styles.tabLabelActive : styles.tabLabel}>{phase.name}</Text>
            </TouchableOpacity>
          );
        })}
      </View>

      <View style={styles.timelineContainer}>
        <LottieView
          ref={timelineRef}
          source={require('../../assets/lottie/Timeline.json')}
          autoPlay={false}
          loop={false}
          style={styles.timelineAnimation}
        />
      </View>

      {/* Current Phase Component */}
      <View style={styles.phaseContainer}>
        {getCurrentPhaseComponent()}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#252525',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#333',
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
    borderBottomWidth: 1,
    borderBottomColor: '#333',
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
  timelineContainer: {
    alignItems: 'center',
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#333',
  },
  timelineAnimation: {
    width: '100%',
    height: 40,
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

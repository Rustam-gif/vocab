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
import { useAppStore } from '../../lib/store';
import { getTheme } from '../../lib/theme';
import { analyticsService } from '../../services/AnalyticsService';
import { SetProgressService } from '../../services/SetProgressService';
import { engagementTrackingService } from '../../services/EngagementTrackingService';

const ACCENT = '#F8B070';

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
  const recordResult = useAppStore(s => s.recordExerciseResult);
  const colors = getTheme(themeName);
  const isLight = themeName === 'light';
  
  // Check if this is a quiz type
  const level = useMemo(() => levels.find(l => l.id === levelId), [levelId]);
  const set = useMemo(() => level?.sets.find(s => s.id.toString() === setId), [level, setId]);

  // Compute dynamic quiz words for any level when set is not found
  const computedQuizWords = useMemo(() => {
    if (!level) return null;
    // If a static quiz set exists in data, no need to compute
    if (set) return null;
    if (!setId || !/^quiz-\d+$/.test(String(setId))) return null;
    // Rebuild the same visible list used in Learn:
    // - For Upper-Intermediate: drop first 10 numeric sets
    // - For others: include all sets
    // - Always exclude existing quiz-type sets
    const baseSets = level.sets.filter(s => {
      const n = Number(s.id);
      const dropFirstTen = level.id === 'upper-intermediate' ? (isNaN(n) || n > 10) : true;
      return dropFirstTen && (s as any).type !== 'quiz';
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

  // Treat any dynamically-inserted quiz id as a quiz, or static quiz type sets
  const isQuizId = (!!setId && /^quiz-\d+$/.test(String(setId)));
  const isQuiz = (set?.type === 'quiz') || !!computedQuizWords || isQuizId;
  
  const [currentPhase, setCurrentPhase] = useState(0);
  // Show intro for exercise phases but not for word-intro
  const [showingIntro, setShowingIntro] = useState(isQuiz); // Quiz starts with MCQ (show intro), regular starts with word-intro (no intro)
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
  const [hearts, setHearts] = useState(5);
  const [gameOver, setGameOver] = useState(false);
  const [totalCorrect, setTotalCorrect] = useState(0);
  const [totalQuestions, setTotalQuestions] = useState(0);
  const [mlIndex, setMlIndex] = useState(0);

  // Handle losing a heart
  const handleHeartLost = () => {
    setHearts(prev => {
      const newHearts = Math.max(0, prev - 1);
      if (newHearts === 0) {
        setGameOver(true);
      }
      return newHearts;
    });
  };

  // Restart the exercise
  const handleRestart = () => {
    setHearts(5);
    setGameOver(false);
    setCurrentPhase(0);
    setShowingIntro(true);
    setTotalCorrect(0);
    setTotalQuestions(0);
    setMlIndex(0);
    setPhases(phases.map(p => ({ ...p, completed: false, score: undefined, totalQuestions: undefined })));
  };

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
      // Show intro for next exercise phase (skip for word-intro phase)
      const nextPhase = phases[currentPhase + 1];
      if (nextPhase?.id !== 'intro') {
        setShowingIntro(true);
      }
    } else {
      navigateToResults(nextTotalCorrect, nextTotalQuestions);
    }
  };

  // Handle starting the exercise after intro
  const handleStartExercise = () => {
    setShowingIntro(false);
  };

  const navigateToResults = (finalCorrect: number, finalQuestions: number) => {
    // Persist completion + score for the set so Learn shows "Review" with score
    // Convert hearts to points (each heart = 20 points)
    const points = hearts * 20;
    try {
      if (levelId && setId) {
        SetProgressService.markCompleted(String(levelId), String(setId), points);
      }
    } catch {}

    // Track set completion
    engagementTrackingService.trackEvent('set_completed', '/quiz/atlas-practice-integrated', {
      setId,
      levelId,
      score: points,
      hearts,
      correctAnswers: finalCorrect,
      totalQuestions: finalQuestions,
    });

    router.replace({
      pathname: '/quiz/atlas-results',
      params: {
        score: Math.max(0, finalCorrect).toString(),
        totalQuestions: Math.max(0, finalQuestions).toString(),
        hearts: hearts.toString(),
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

  // Initialize progress/resume and mark in-progress while user is inside
  useEffect(() => {
    (async () => {
      try {
        await SetProgressService.initialize();
        if (levelId && setId) {
          const saved = SetProgressService.get(String(levelId), String(setId));
          const isResume = saved?.status === 'in_progress' && typeof saved.lastPhase === 'number';

          if (isResume) {
            // Resume where left off
            setCurrentPhase(Math.min(saved.lastPhase, phases.length - 1));
          } else {
            // Track new set started (not a resume)
            engagementTrackingService.trackEvent('set_started', '/quiz/atlas-practice-integrated', {
              setId,
              levelId,
              setTitle: set?.title,
            });
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
    // Distribute words evenly across 4 exercises
    let wordRange: { start: number; end: number } | undefined;
    if (isQuiz && computedQuizWords && computedQuizWords.length > 0) {
      const totalWords = computedQuizWords.length;
      // Ensure at least 1 word per exercise, distribute evenly
      const wordsPerExercise = Math.max(1, Math.ceil(totalWords / 4));

      if (phase.id === 'mcq') {
        wordRange = { start: 0, end: Math.min(wordsPerExercise, totalWords) };
      } else if (phase.id === 'synonym') {
        const start = Math.min(wordsPerExercise, totalWords - 1);
        const end = Math.min(start + wordsPerExercise, totalWords);
        wordRange = { start, end: end > start ? end : totalWords };
      } else if (phase.id === 'usage') {
        const start = Math.min(wordsPerExercise * 2, totalWords - 1);
        const end = Math.min(start + wordsPerExercise, totalWords);
        wordRange = { start, end: end > start ? end : totalWords };
      } else if (phase.id === 'letters') {
        const start = Math.min(wordsPerExercise * 3, totalWords - 1);
        wordRange = { start, end: totalWords };
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
          hearts={hearts}
          onResult={({ mistakes, usedReveal }) => {
            const hasMistake = (mistakes || 0) > 0 || usedReveal;
            if (hasMistake) {
              handleHeartLost();
            }
            // Record analytics for Missing Letters
            try {
              const isCorrect = (mistakes || 0) === 0 && !usedReveal;
              recordResult({
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
        hearts={hearts}
        onHeartLost={handleHeartLost}
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

  // Game Over screen - animated and motivational
  if (gameOver) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
        <GameOverScreen
          isLight={isLight}
          onTryAgain={handleRestart}
          onBackToLearn={() => router.back()}
        />
      </SafeAreaView>
    );
  }

  // Get exercise intro content based on phase
  const getExerciseIntroContent = () => {
    const phase = phases[currentPhase];
    if (!phase) return null;

    const introData: Record<string, { icon: string; title: string; description: string }> = {
      mcq: {
        icon: '🎯',
        title: 'Multiple Choice',
        description: 'Pick the correct definition for each word',
      },
      synonym: {
        icon: '🔗',
        title: 'Synonyms',
        description: 'Match each word with its synonym',
      },
      usage: {
        icon: '✍️',
        title: 'Natural Usage',
        description: 'Complete sentences using the right word',
      },
      letters: {
        icon: '🔤',
        title: 'Spelling',
        description: 'Type the missing letters to spell each word',
      },
    };

    return introData[phase.id] || null;
  };

  // Check if we should show intro (not for word-intro phase)
  const shouldShowExerciseIntro = showingIntro && phases[currentPhase]?.id !== 'intro';

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Minimal Header - just back button */}
      <View style={styles.headerMinimal}>
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
      </View>

      {/* Exercise Intro or Current Phase Component */}
      <View style={styles.phaseContainer}>
        {shouldShowExerciseIntro ? (
          <ExerciseIntroScreen
            introContent={getExerciseIntroContent()}
            hearts={hearts}
            phaseIndex={currentPhase}
            totalPhases={phases.length}
            isLight={isLight}
            onStart={handleStartExercise}
          />
        ) : (
          getCurrentPhaseComponent()
        )}
      </View>
    </SafeAreaView>
  );
}

// Animated Exercise Intro Screen
type ExerciseIntroScreenProps = {
  introContent: { icon: string; title: string; description: string } | null;
  hearts: number;
  phaseIndex: number;
  totalPhases: number;
  isLight: boolean;
  onStart: () => void;
};

function ExerciseIntroScreen({ introContent, hearts, phaseIndex, totalPhases, isLight, onStart }: ExerciseIntroScreenProps) {
  const iconScale = useRef(new Animated.Value(0)).current;
  const titleOpacity = useRef(new Animated.Value(0)).current;
  const titleSlide = useRef(new Animated.Value(20)).current;
  const descOpacity = useRef(new Animated.Value(0)).current;
  const progressOpacity = useRef(new Animated.Value(0)).current;
  const countdownWidth = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    // Reset animations
    iconScale.setValue(0);
    titleOpacity.setValue(0);
    titleSlide.setValue(20);
    descOpacity.setValue(0);
    progressOpacity.setValue(0);
    countdownWidth.setValue(1);

    // Staggered entrance animation
    Animated.sequence([
      // Progress indicator fades in
      Animated.timing(progressOpacity, {
        toValue: 1,
        duration: 300,
        useNativeDriver: false,
      }),
      // Icon bounces in
      Animated.spring(iconScale, {
        toValue: 1,
        friction: 5,
        tension: 100,
        useNativeDriver: true,
      }),
      // Title slides up
      Animated.parallel([
        Animated.timing(titleOpacity, {
          toValue: 1,
          duration: 300,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),
        Animated.timing(titleSlide, {
          toValue: 0,
          duration: 300,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),
      ]),
      // Description fades in
      Animated.timing(descOpacity, {
        toValue: 1,
        duration: 250,
        useNativeDriver: true,
      }),
    ]).start(() => {
      // Start countdown AFTER intro animations complete
      Animated.timing(countdownWidth, {
        toValue: 0,
        duration: 2000,
        easing: Easing.linear,
        useNativeDriver: false,
      }).start();
    });

    // Auto-start after intro animations (~1.2s) + countdown (2s) = ~3.2s
    const autoStartTimer = setTimeout(() => {
      onStart();
    }, 3200);

    return () => clearTimeout(autoStartTimer);
  }, [phaseIndex, onStart]);

  if (!introContent) return null;

  return (
    <View style={styles.exerciseIntroContainer}>
      {/* Progress indicator */}
      <Animated.View style={[styles.exerciseIntroProgress, { opacity: progressOpacity }]}>
        <View style={styles.exerciseIntroProgressDots}>
          {Array.from({ length: totalPhases }).map((_, i) => (
            <View
              key={i}
              style={[
                styles.exerciseIntroProgressDot,
                i <= phaseIndex && styles.exerciseIntroProgressDotActive,
                i < phaseIndex && styles.exerciseIntroProgressDotCompleted,
              ]}
            />
          ))}
        </View>
        {/* Hearts display */}
        <View style={styles.exerciseIntroHearts}>
          {[0, 1, 2, 3, 4].map(i => (
            <Text key={i} style={styles.exerciseIntroHeart}>
              {i < hearts ? '❤️' : '🤍'}
            </Text>
          ))}
        </View>
      </Animated.View>

      {/* Icon */}
      <Animated.Text
        style={[
          styles.exerciseIntroIcon,
          {
            transform: [{ scale: iconScale }],
          },
        ]}
      >
        {introContent.icon}
      </Animated.Text>

      {/* Title */}
      <Animated.Text
        style={[
          styles.exerciseIntroTitle,
          isLight && styles.exerciseIntroTitleLight,
          {
            opacity: titleOpacity,
            transform: [{ translateY: titleSlide }],
          },
        ]}
      >
        {introContent.title}
      </Animated.Text>

      {/* Description */}
      <Animated.Text
        style={[
          styles.exerciseIntroDesc,
          isLight && styles.exerciseIntroDescLight,
          { opacity: descOpacity },
        ]}
      >
        {introContent.description}
      </Animated.Text>

      {/* Countdown bar */}
      <View style={styles.countdownBarContainer}>
        <Animated.View
          style={[
            styles.countdownBar,
            {
              width: countdownWidth.interpolate({
                inputRange: [0, 1],
                outputRange: ['0%', '100%'],
              }),
            },
          ]}
        />
      </View>

      {/* Tap to skip hint */}
      <TouchableOpacity onPress={onStart} activeOpacity={0.7}>
        <Text style={[styles.skipHint, isLight && styles.skipHintLight]}>
          Tap anywhere to start now
        </Text>
      </TouchableOpacity>
    </View>
  );
}

// Motivational Game Over screen with smooth animations
type GameOverScreenProps = {
  isLight: boolean;
  onTryAgain: () => void;
  onBackToLearn: () => void;
};

function GameOverScreen({ isLight, onTryAgain, onBackToLearn }: GameOverScreenProps) {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;
  const heartAnims = useRef([0, 1, 2, 3, 4].map(() => new Animated.Value(0))).current;
  const buttonOpacity = useRef(new Animated.Value(0)).current;
  const buttonSlide = useRef(new Animated.Value(20)).current;

  useEffect(() => {
    // Staggered entrance animation
    Animated.sequence([
      // Hearts fade in one by one
      Animated.stagger(100, heartAnims.map(anim =>
        Animated.spring(anim, {
          toValue: 1,
          friction: 6,
          tension: 80,
          useNativeDriver: true,
        })
      )),
      // Then title and subtitle
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 400,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),
        Animated.timing(slideAnim, {
          toValue: 0,
          duration: 400,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),
      ]),
      // Then buttons
      Animated.parallel([
        Animated.timing(buttonOpacity, {
          toValue: 1,
          duration: 300,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),
        Animated.timing(buttonSlide, {
          toValue: 0,
          duration: 300,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),
      ]),
    ]).start();
  }, []);

  return (
    <View style={styles.gameOverContainer}>
      {/* Broken hearts with gentle animation */}
      <View style={styles.gameOverHeartsRow}>
        {heartAnims.map((anim, i) => (
          <Animated.Text
            key={i}
            style={[
              styles.gameOverHeartEmpty,
              {
                opacity: anim,
                transform: [{
                  scale: anim.interpolate({
                    inputRange: [0, 1],
                    outputRange: [0.5, 1],
                  }),
                }],
              },
            ]}
          >
            💔
          </Animated.Text>
        ))}
      </View>

      {/* Motivational message */}
      <Animated.View
        style={{
          opacity: fadeAnim,
          transform: [{ translateY: slideAnim }],
          alignItems: 'center',
        }}
      >
        <Text style={[styles.gameOverTitle, isLight && styles.gameOverTitleLight]}>
          Keep Going!
        </Text>
        <Text style={[styles.gameOverSubtitle, isLight && styles.gameOverSubtitleLight]}>
          Every mistake is a step toward mastery.{'\n'}You've got this!
        </Text>
      </Animated.View>

      {/* Action buttons */}
      <Animated.View
        style={[
          styles.gameOverButtonsContainer,
          {
            opacity: buttonOpacity,
            transform: [{ translateY: buttonSlide }],
          },
        ]}
      >
        <TouchableOpacity
          style={styles.gameOverButton}
          onPress={onTryAgain}
          activeOpacity={0.8}
        >
          <Text style={styles.gameOverButtonText}>Try Again</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.gameOverButtonSecondary]}
          onPress={onBackToLearn}
          activeOpacity={0.7}
        >
          <Text style={[styles.gameOverButtonTextSecondary, isLight && { color: '#6B7280' }]}>
            Back to Learn
          </Text>
        </TouchableOpacity>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1E1E1E',
  },
  headerMinimal: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  backButton: {
    padding: 8,
  },
  // Exercise Intro Screen styles
  exerciseIntroContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  exerciseIntroProgress: {
    position: 'absolute',
    top: 20,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  exerciseIntroProgressDots: {
    flexDirection: 'row',
    gap: 8,
  },
  exerciseIntroProgressDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#3A3A3A',
  },
  exerciseIntroProgressDotActive: {
    backgroundColor: '#4ED9CB',
  },
  exerciseIntroProgressDotCompleted: {
    backgroundColor: '#437F76',
  },
  exerciseIntroHearts: {
    flexDirection: 'row',
    gap: 4,
  },
  exerciseIntroHeart: {
    fontSize: 18,
  },
  exerciseIntroIcon: {
    fontSize: 72,
    marginBottom: 24,
  },
  exerciseIntroTitle: {
    fontSize: 32,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 12,
    fontFamily: 'Feather-Bold',
    letterSpacing: 0.5,
  },
  exerciseIntroTitleLight: {
    color: '#111827',
  },
  exerciseIntroDesc: {
    fontSize: 17,
    color: '#9CA3AF',
    textAlign: 'center',
    marginBottom: 48,
    lineHeight: 26,
    fontFamily: 'Feather-Bold',
  },
  exerciseIntroDescLight: {
    color: '#6B7280',
  },
  countdownBarContainer: {
    width: 200,
    height: 4,
    backgroundColor: '#3A3A3A',
    borderRadius: 2,
    overflow: 'hidden',
    marginBottom: 24,
  },
  countdownBar: {
    height: '100%',
    backgroundColor: '#F8B070',
    borderRadius: 2,
  },
  skipHint: {
    fontSize: 14,
    color: '#6B7280',
    fontFamily: 'Feather-Bold',
  },
  skipHintLight: {
    color: '#9CA3AF',
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
  gameOverContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  gameOverHeartsRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 32,
  },
  gameOverHeartEmpty: {
    fontSize: 36,
  },
  gameOverTitle: {
    fontSize: 28,
    fontWeight: '700',
    color: '#F8B070',
    marginBottom: 16,
    fontFamily: 'Feather-Bold',
    letterSpacing: 0.5,
  },
  gameOverTitleLight: {
    color: '#e28743',
  },
  gameOverSubtitle: {
    fontSize: 16,
    color: '#9CA3AF',
    textAlign: 'center',
    marginBottom: 40,
    lineHeight: 26,
    fontFamily: 'Feather-Bold',
  },
  gameOverSubtitleLight: {
    color: '#6B7280',
  },
  gameOverButtonsContainer: {
    alignItems: 'center',
    gap: 16,
    width: '100%',
  },
  gameOverButton: {
    backgroundColor: '#F8B070',
    paddingVertical: 16,
    paddingHorizontal: 48,
    borderRadius: 16,
    minWidth: 220,
    shadowColor: '#F8B070',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  gameOverButtonSecondary: {
    paddingVertical: 12,
    paddingHorizontal: 24,
  },
  gameOverButtonText: {
    fontSize: 17,
    fontWeight: '700',
    color: '#1E1E1E',
    textAlign: 'center',
    fontFamily: 'Feather-Bold',
  },
  gameOverButtonTextSecondary: {
    fontSize: 15,
    color: '#9CA3AF',
    fontFamily: 'Feather-Bold',
  },
});

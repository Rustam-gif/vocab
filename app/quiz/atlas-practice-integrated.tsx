import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
  Easing,
  StatusBar,
  DeviceEventEmitter,
  Modal,
  Platform,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { X } from 'lucide-react-native';
import LottieView from 'lottie-react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import WordIntroComponent from './components/word-intro';
import MCQComponent from './components/mcq';
import SynonymComponent from './components/synonym';
import OddOneOutComponent from './components/odd-one-out';
import MissingLetters from './components/missing-letters';
import { levels, getOrderedSetsForLevel, SetCategory } from './data/levels';
import { useAppStore } from '../../lib/store';

const USER_FOCUS_KEY = '@engniter.onboarding.focus';
import { getTheme } from '../../lib/theme';
import { analyticsService } from '../../services/AnalyticsService';
import { SetProgressService } from '../../services/SetProgressService';
import { engagementTrackingService } from '../../services/EngagementTrackingService';
import { soundService } from '../../services/SoundService';

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

  // Load user focus preference for correct set ordering
  const [userFocus, setUserFocus] = useState<SetCategory | null>(null);
  const [focusLoaded, setFocusLoaded] = useState(false);

  useEffect(() => {
    AsyncStorage.getItem(USER_FOCUS_KEY).then(stored => {
      if (stored) setUserFocus(stored as SetCategory);
      setFocusLoaded(true);
    }).catch(() => setFocusLoaded(true));
  }, []);

  // Get level with sets ordered by user preference (same as learn screen)
  const level = useMemo(() => {
    const baseLevel = levels.find(l => l.id === levelId);
    if (!baseLevel || !focusLoaded) return baseLevel;

    // For levels with category-based sets, use ordered sets
    const categoryLevels = ['beginner', 'intermediate', 'upper-intermediate', 'advanced'];
    if (categoryLevels.includes(baseLevel.id)) {
      const orderedSets = getOrderedSetsForLevel(baseLevel.id, userFocus);
      return { ...baseLevel, sets: orderedSets };
    }
    return baseLevel;
  }, [levelId, userFocus, focusLoaded]);

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
          { id: 'oddoneout', name: 'Odd One Out', component: OddOneOutComponent, completed: false },
          { id: 'letters', name: 'Letters', component: MissingLetters, completed: false },
        ]
      : [
          { id: 'intro', name: 'Intro', component: WordIntroComponent, completed: false },
          { id: 'mcq', name: 'MCQ', component: MCQComponent, completed: false },
          { id: 'synonym', name: 'Synonym', component: SynonymComponent, completed: false },
          { id: 'oddoneout', name: 'Odd One Out', component: OddOneOutComponent, completed: false },
          { id: 'letters', name: 'Letters', component: MissingLetters, completed: false },
        ]
  );
  const [hearts, setHearts] = useState(5);
  const [showUfoAnimation, setShowUfoAnimation] = useState(false);
  const [ufoAnimationKey, setUfoAnimationKey] = useState(0);
  const ufoTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const [gameOver, setGameOver] = useState(false);
  const [totalCorrect, setTotalCorrect] = useState(0);
  const [totalQuestions, setTotalQuestions] = useState(0);
  const [mlIndex, setMlIndex] = useState(0);
  const [showLeaveModal, setShowLeaveModal] = useState(false);

  // Combo/Fire streak system
  const [comboStreak, setComboStreak] = useState(0);
  const [showFireAnimation, setShowFireAnimation] = useState(false);
  const [comboMultiplier, setComboMultiplier] = useState(1);
  const fireTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const fireScaleAnim = useRef(new Animated.Value(0)).current;
  const fireOpacityAnim = useRef(new Animated.Value(0)).current;

  // Handle correct answer - increment combo
  const handleCorrectAnswer = () => {
    setComboStreak(prev => {
      const newStreak = prev + 1;
      // Show fire animation when streak reaches 3+
      if (newStreak >= 3) {
        // Update multiplier: 3 streak = 1.5x, 5 streak = 2x, 7+ streak = 2.5x
        const multiplier = newStreak >= 7 ? 2.5 : newStreak >= 5 ? 2 : 1.5;
        setComboMultiplier(multiplier);

        // Show fire animation
        if (fireTimeoutRef.current) {
          clearTimeout(fireTimeoutRef.current);
        }
        setShowFireAnimation(true);

        // Animate fire entrance
        fireScaleAnim.setValue(0.5);
        fireOpacityAnim.setValue(0);
        Animated.parallel([
          Animated.spring(fireScaleAnim, {
            toValue: 1,
            friction: 4,
            tension: 100,
            useNativeDriver: true,
          }),
          Animated.timing(fireOpacityAnim, {
            toValue: 1,
            duration: 200,
            useNativeDriver: true,
          }),
        ]).start();

        // Hide after 2 seconds
        fireTimeoutRef.current = setTimeout(() => {
          Animated.timing(fireOpacityAnim, {
            toValue: 0,
            duration: 300,
            useNativeDriver: true,
          }).start(() => {
            setShowFireAnimation(false);
          });
        }, 2000);
      }
      return newStreak;
    });
  };

  // Handle incorrect answer - reset combo
  const handleIncorrectAnswer = () => {
    setComboStreak(0);
    setComboMultiplier(1);
    if (fireTimeoutRef.current) {
      clearTimeout(fireTimeoutRef.current);
    }
    setShowFireAnimation(false);
  };

  // Handle losing a heart
  const handleHeartLost = () => {
    // Clear any existing UFO animation timeout
    if (ufoTimeoutRef.current) {
      clearTimeout(ufoTimeoutRef.current);
    }

    // Increment key to force animation restart even if already showing
    setUfoAnimationKey(prev => prev + 1);
    // Show UFO animation for 4 seconds
    setShowUfoAnimation(true);
    ufoTimeoutRef.current = setTimeout(() => {
      setShowUfoAnimation(false);
      ufoTimeoutRef.current = null;
    }, 4000);

    setHearts(prev => {
      const newHearts = Math.max(0, prev - 1);
      if (newHearts === 0) {
        setTimeout(() => setGameOver(true), 1500);
      }
      return newHearts;
    });
  };

  // Restart the exercise
  const handleRestart = () => {
    // Clear UFO animation timeout
    if (ufoTimeoutRef.current) {
      clearTimeout(ufoTimeoutRef.current);
      ufoTimeoutRef.current = null;
    }
    // Clear fire animation timeout
    if (fireTimeoutRef.current) {
      clearTimeout(fireTimeoutRef.current);
      fireTimeoutRef.current = null;
    }
    setHearts(5);
    setShowUfoAnimation(false);
    setGameOver(false);
    setCurrentPhase(0);
    setShowingIntro(true);
    setTotalCorrect(0);
    setTotalQuestions(0);
    setMlIndex(0);
    // Reset combo
    setComboStreak(0);
    setComboMultiplier(1);
    setShowFireAnimation(false);
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

  const navigateToResults = async (finalCorrect: number, finalQuestions: number) => {
    // Play set completion sound
    soundService.playSetCompletion();

    // Persist completion + score for the set so Learn shows "Review" with score
    // Convert hearts to points (each heart = 20 points)
    const points = hearts * 20;
    try {
      if (levelId && setId) {
        console.log(`[Practice] 💾 Saving completion: levelId=${levelId}, setId=${setId}, score=${points}`);
        await SetProgressService.markCompleted(String(levelId), String(setId), points);
        console.log(`[Practice] ✅ Completion saved successfully`);

        // If this is a quiz (skip ahead), mark all previous sets as completed
        if (isQuiz && level) {
          // Rebuild the visible set list (same logic as Learn screen)
          const baseSets = level.sets.filter(s => {
            const n = Number(s.id);
            const dropFirstTen = level.id === 'upper-intermediate' ? (isNaN(n) || n > 10) : true;
            return dropFirstTen && (s as any).type !== 'quiz';
          });

          // Check if this is a dynamic quiz (quiz-N format)
          const dynamicQuizMatch = String(setId).match(/^quiz-(\d+)$/);
          if (dynamicQuizMatch) {
            // For quiz-N, mark the N groups of 4 sets as completed (indices 0 to N*4-1)
            const quizNumber = parseInt(dynamicQuizMatch[1], 10);
            const endIndex = quizNumber * 4; // quiz-1 covers sets 0-3, quiz-2 covers 4-7, etc.
            for (let i = 0; i < endIndex && i < baseSets.length; i++) {
              const prevSet = baseSets[i];
              if (prevSet) {
                const prevProgress = SetProgressService.get(String(levelId), String(prevSet.id));
                if (!prevProgress || prevProgress.status !== 'completed') {
                  await SetProgressService.markCompleted(String(levelId), String(prevSet.id), 80);
                }
              }
            }
          } else {
            // For static quiz, find its position and mark all previous non-quiz sets
            const quizIndex = level.sets.findIndex(s => String(s.id) === String(setId));
            if (quizIndex > 0) {
              for (let i = 0; i < quizIndex; i++) {
                const prevSet = level.sets[i];
                if (prevSet && prevSet.type !== 'quiz') {
                  const prevProgress = SetProgressService.get(String(levelId), String(prevSet.id));
                  if (!prevProgress || prevProgress.status !== 'completed') {
                    await SetProgressService.markCompleted(String(levelId), String(prevSet.id), 80);
                  }
                }
              }
            }
          }
        }

        // Force immediate save to ensure data persists before navigation
        await SetProgressService.flushSave();
        // Note: SET_COMPLETED event is emitted from results screen when user clicks Continue
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

    // Emit words practiced event for ProgressPill
    const wordsInSet = computedQuizWords?.length || set?.words?.length || 5;
    DeviceEventEmitter.emit('WORDS_PRACTICED', wordsInSet);

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

  // Cleanup UFO animation timeout on unmount
  useEffect(() => {
    return () => {
      if (ufoTimeoutRef.current) {
        clearTimeout(ufoTimeoutRef.current);
      }
    };
  }, []);

  // Hide nav bar when entering practice screen
  useEffect(() => {
    DeviceEventEmitter.emit('NAV_VISIBILITY', 'hide');
    return () => {
      DeviceEventEmitter.emit('NAV_VISIBILITY', 'show');
    };
  }, []);

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

    // Get quiz words - either computed (dynamic quiz) or from static set
    const quizWords = computedQuizWords || (isQuiz && set?.words ? set.words : null);

    // Determine word range for quiz mode
    // Distribute words evenly across 4 exercises
    let wordRange: { start: number; end: number } | undefined;
    if (isQuiz && quizWords && quizWords.length > 0) {
      const totalWords = quizWords.length;
      // For quizzes, distribute words across 4 phases (5 words each for 20 total)
      const wordsPerExercise = Math.max(1, Math.floor(totalWords / 4));
      const remainder = totalWords % 4;

      if (phase.id === 'mcq') {
        // First phase gets wordsPerExercise + 1 if there's remainder
        const end = wordsPerExercise + (remainder > 0 ? 1 : 0);
        wordRange = { start: 0, end: Math.min(end, totalWords) };
      } else if (phase.id === 'synonym') {
        const prevEnd = wordsPerExercise + (remainder > 0 ? 1 : 0);
        const thisCount = wordsPerExercise + (remainder > 1 ? 1 : 0);
        wordRange = { start: prevEnd, end: Math.min(prevEnd + thisCount, totalWords) };
      } else if (phase.id === 'oddoneout') {
        const phase1 = wordsPerExercise + (remainder > 0 ? 1 : 0);
        const phase2 = wordsPerExercise + (remainder > 1 ? 1 : 0);
        const start = phase1 + phase2;
        const thisCount = wordsPerExercise + (remainder > 2 ? 1 : 0);
        wordRange = { start, end: Math.min(start + thisCount, totalWords) };
      } else if (phase.id === 'letters') {
        const phase1 = wordsPerExercise + (remainder > 0 ? 1 : 0);
        const phase2 = wordsPerExercise + (remainder > 1 ? 1 : 0);
        const phase3 = wordsPerExercise + (remainder > 2 ? 1 : 0);
        const start = phase1 + phase2 + phase3;
        wordRange = { start, end: totalWords };
      }
    }
    
    // Handle Word Intro component differently
    if (phase.id === 'intro') {
      // Pass words from user-ordered set (or computed quiz words)
      const introWords = computedQuizWords || set?.words || [];
      return (
        <Component
          setId={setId || ''}
          levelId={levelId || ''}
          onComplete={() => handlePhaseComplete(0, 0)}
          wordRange={wordRange}
          wordsOverride={introWords.length > 0 ? introWords : undefined}
        />
      );
    }
    
    // Special wiring for Missing Letters (new API: single-word component)
    if (phase.id === 'letters') {
      // Use the already computed level and set which respect user's focus ordering
      let words = computedQuizWords || set?.words || [];
      
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
          showUfoAnimation={showUfoAnimation}
          ufoAnimationKey={ufoAnimationKey}
          onResult={({ mistakes, usedReveal }) => {
            const hasMistake = (mistakes || 0) > 0 || usedReveal;
            const isCorrect = (mistakes || 0) === 0 && !usedReveal;
            if (hasMistake) {
              handleHeartLost();
              handleIncorrectAnswer();
            } else {
              handleCorrectAnswer();
            }
            // Record analytics for Missing Letters
            try {
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
    // Pass words from user-ordered set (or computed quiz words)
    const componentWords = computedQuizWords || set?.words || [];
    return (
      <Component
        setId={setId || ''}
        levelId={levelId || ''}
        onPhaseComplete={handlePhaseComplete}
        hearts={hearts}
        onHeartLost={handleHeartLost}
        onCorrectAnswer={handleCorrectAnswer}
        onIncorrectAnswer={handleIncorrectAnswer}
        wordRange={wordRange}
        wordsOverride={componentWords.length > 0 ? componentWords : undefined}
        showUfoAnimation={showUfoAnimation}
        ufoAnimationKey={ufoAnimationKey}
      />
    );
  };

  if (!setId || !levelId) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background, paddingTop: Platform.OS === 'ios' ? 50 : 20 }]}>
        <View style={styles.errorContainer}>
          <Text style={[styles.errorText, isLight && { color: '#6B7280' }]}>Missing set or level information</Text>
        </View>
      </View>
    );
  }

  // Game Over screen - animated and motivational
  if (gameOver) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background, paddingTop: Platform.OS === 'ios' ? 50 : 20 }]}>
        <GameOverScreen
          isLight={isLight}
          onTryAgain={handleRestart}
          onBackToLearn={() => router.back()}
        />
      </View>
    );
  }

  // Get exercise intro content based on phase
  const getExerciseIntroContent = () => {
    const phase = phases[currentPhase];
    if (!phase) return null;

    const introData: Record<string, { lottieSource: any; title: string; description: string }> = {
      mcq: {
        lottieSource: require('./../../assets/lottie/learn/intro.lottie'),
        title: 'Multiple Choice',
        description: 'Pick the correct definition for each word',
      },
      synonym: {
        lottieSource: require('./../../assets/lottie/learn/Monkey.lottie'),
        title: 'Synonyms',
        description: 'Match each word with its synonym',
      },
      oddoneout: {
        lottieSource: require('./../../assets/lottie/learn/Chameleon.lottie'),
        title: 'Odd One Out',
        description: 'Find the word that doesn\'t belong',
      },
      letters: {
        lottieSource: require('./../../assets/lottie/learn/Cat_playing.lottie'),
        title: 'Spelling',
        description: 'Type the missing letters to spell each word',
      },
    };

    return introData[phase.id] || null;
  };

  // Check if we should show intro (not for word-intro phase)
  const shouldShowExerciseIntro = showingIntro && phases[currentPhase]?.id !== 'intro';

  // Wait for user focus to load to ensure correct set ordering
  if (!focusLoaded) {
    return (
      <View style={[styles.wrapper, { backgroundColor: colors.background, justifyContent: 'center', alignItems: 'center' }]}>
        <StatusBar barStyle={isLight ? 'dark-content' : 'light-content'} backgroundColor={colors.background} />
      </View>
    );
  }

  return (
    <View style={[styles.wrapper, { backgroundColor: colors.background }]}>
      <StatusBar barStyle={isLight ? 'dark-content' : 'light-content'} backgroundColor={colors.background} />

      {/* Dotted background pattern */}
      <View style={styles.dotPatternContainer} pointerEvents="none">
        {Array.from({ length: 50 }).map((_, rowIndex) => (
          <View key={rowIndex} style={styles.dotPatternRow}>
            {Array.from({ length: 25 }).map((_, colIndex) => (
              <View
                key={colIndex}
                style={[
                  styles.dotPattern,
                  { backgroundColor: isLight ? '#D4D4D4' : '#243B53' }
                ]}
              />
            ))}
          </View>
        ))}
      </View>

      <View style={[styles.container, { backgroundColor: 'transparent', paddingTop: Platform.OS === 'ios' ? 50 : 20 }]}>
        {/* Minimal Header - just back button */}
        <View style={styles.headerMinimal}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => setShowLeaveModal(true)}
        >
          <X size={24} color={isLight ? '#9CA3AF' : '#6B7280'} strokeWidth={2.5} />
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

      </View>

      {/* Fire Combo Animation - Minimalist */}
      {showFireAnimation && (
        <Animated.View
          style={{
            position: 'absolute',
            top: 110,
            alignSelf: 'center',
            zIndex: 9998,
            opacity: fireOpacityAnim,
            transform: [{ scale: fireScaleAnim }],
          }}
        >
          <View style={{
            backgroundColor: comboStreak >= 7 ? '#9333EA' : comboStreak >= 5 ? '#DC2626' : '#F97316',
            paddingHorizontal: 16,
            paddingVertical: 8,
            borderRadius: 24,
            flexDirection: 'row',
            alignItems: 'center',
            gap: 6,
          }}>
            <Text style={{ fontSize: 16 }}>
              {comboStreak >= 7 ? '⚡' : comboStreak >= 5 ? '🔥' : '✨'}
            </Text>
            <Text style={{
              color: '#FFF',
              fontSize: 14,
              fontFamily: 'Feather-Bold',
              letterSpacing: 0.5,
            }}>
              {comboStreak >= 7 ? 'Unstoppable' : comboStreak >= 5 ? 'On Fire' : comboStreak >= 4 ? 'Hot Streak' : 'Nice!'}
            </Text>
            <Text style={{
              color: 'rgba(255,255,255,0.85)',
              fontSize: 12,
              fontFamily: 'Feather-Bold',
            }}>
              {comboStreak}×
            </Text>
          </View>
        </Animated.View>
      )}

      {/* Custom Leave Confirmation Modal */}
      <Modal
        visible={showLeaveModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowLeaveModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContainer, isLight && styles.modalContainerLight]}>
            <Text style={[styles.modalTitle, isLight && styles.modalTitleLight]}>Leave?</Text>
            <Text style={[styles.modalMessage, isLight && styles.modalMessageLight]}>
              Progress will be lost.
            </Text>
            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalButton, styles.modalButtonStay, isLight && styles.modalButtonStayLight]}
                onPress={() => setShowLeaveModal(false)}
                activeOpacity={0.8}
              >
                <Text style={[styles.modalButtonText, styles.modalButtonStayText]}>Stay</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, styles.modalButtonLeave]}
                onPress={async () => {
                  setShowLeaveModal(false);
                  if (levelId && setId) {
                    try {
                      await SetProgressService.resetSet(String(levelId), String(setId));
                    } catch {}
                  }
                  router.back();
                }}
                activeOpacity={0.8}
              >
                <Text style={[styles.modalButtonText, styles.modalButtonLeaveText]}>Leave</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

// Animated Exercise Intro Screen
type ExerciseIntroScreenProps = {
  introContent: { lottieSource: any; title: string; description: string } | null;
  hearts: number;
  phaseIndex: number;
  totalPhases: number;
  isLight: boolean;
  onStart: () => void;
};

function ExerciseIntroScreen({ introContent, hearts, phaseIndex, totalPhases, isLight, onStart }: ExerciseIntroScreenProps) {
  const containerScale = useRef(new Animated.Value(0.8)).current;
  const containerOpacity = useRef(new Animated.Value(0)).current;
  const iconScale = useRef(new Animated.Value(0)).current;
  const titleOpacity = useRef(new Animated.Value(0)).current;
  const titleSlide = useRef(new Animated.Value(20)).current;
  const descOpacity = useRef(new Animated.Value(0)).current;
  const progressOpacity = useRef(new Animated.Value(0)).current;
  const countdownWidth = useRef(new Animated.Value(1)).current;
  const isExitingRef = useRef(false);

  // Exit animation function
  const handleExit = () => {
    if (isExitingRef.current) return;
    isExitingRef.current = true;

    Animated.parallel([
      Animated.timing(containerOpacity, {
        toValue: 0,
        duration: 200,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
      Animated.timing(containerScale, {
        toValue: 1.05,
        duration: 200,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
    ]).start(() => {
      onStart();
    });
  };

  useEffect(() => {
    // Play exercise intro sound
    soundService.playExerciseIntro();

    // Reset animations
    containerScale.setValue(0.8);
    containerOpacity.setValue(0);
    iconScale.setValue(0);
    titleOpacity.setValue(0);
    titleSlide.setValue(20);
    descOpacity.setValue(0);
    progressOpacity.setValue(0);
    countdownWidth.setValue(1);
    isExitingRef.current = false;

    // Container zoom-in animation (runs immediately)
    Animated.parallel([
      Animated.spring(containerScale, {
        toValue: 1,
        friction: 8,
        tension: 60,
        useNativeDriver: true,
      }),
      Animated.timing(containerOpacity, {
        toValue: 1,
        duration: 250,
        useNativeDriver: true,
      }),
    ]).start();

    // Staggered entrance animation for content (slightly delayed)
    setTimeout(() => {
      Animated.sequence([
        // Progress indicator fades in
        Animated.timing(progressOpacity, {
          toValue: 1,
          duration: 200,
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
            duration: 250,
            easing: Easing.out(Easing.cubic),
            useNativeDriver: true,
          }),
          Animated.timing(titleSlide, {
            toValue: 0,
            duration: 250,
            easing: Easing.out(Easing.cubic),
            useNativeDriver: true,
          }),
        ]),
        // Description fades in
        Animated.timing(descOpacity, {
          toValue: 1,
          duration: 200,
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
    }, 100);

    // Auto-start after intro animations complete
    const autoStartTimer = setTimeout(() => {
      handleExit();
    }, 4500);

    return () => clearTimeout(autoStartTimer);
  }, [phaseIndex]);

  if (!introContent) return null;

  return (
    <Animated.View
      style={[
        styles.exerciseIntroContainer,
        {
          opacity: containerOpacity,
          transform: [{ scale: containerScale }],
        },
      ]}
    >
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
        {/* Hearts display with Lottie */}
        <View style={styles.exerciseIntroHearts}>
          <LottieView
            source={require('../../assets/lottie/learn/heart_away.lottie')}
            autoPlay
            loop
            style={styles.heartsLottie}
          />
          <Text style={styles.heartsCount}>{hearts}</Text>
        </View>
      </Animated.View>

      {/* Lottie Animation */}
      <Animated.View
        style={[
          styles.exerciseIntroLottieWrap,
          {
            transform: [{ scale: iconScale }],
          },
        ]}
      >
        <LottieView
          source={introContent.lottieSource}
          autoPlay
          loop
          style={styles.exerciseIntroLottie}
        />
      </Animated.View>

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

      {/* Tap to skip hint */}
      <TouchableOpacity onPress={handleExit} activeOpacity={0.7}>
        <Text style={[styles.skipHint, isLight && styles.skipHintLight]}>
          Tap anywhere to start now
        </Text>
      </TouchableOpacity>
    </Animated.View>
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
  wrapper: {
    flex: 1,
  },
  container: {
    flex: 1,
    backgroundColor: '#1B263B',
  },
  dotPatternContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    flexDirection: 'column',
    paddingTop: 16,
    paddingLeft: 16,
  },
  dotPatternRow: {
    flexDirection: 'row',
    marginBottom: 22,
  },
  dotPattern: {
    width: 2,
    height: 2,
    borderRadius: 1,
    marginRight: 22,
    opacity: 0.7,
  },
  headerMinimal: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingTop: 0,
    paddingBottom: 0,
    height: 32,
  },
  backButton: {
    padding: 0,
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
    backgroundColor: '#2D4A66',
  },
  exerciseIntroProgressDotActive: {
    backgroundColor: '#4ED9CB',
  },
  exerciseIntroProgressDotCompleted: {
    backgroundColor: '#437F76',
  },
  exerciseIntroHearts: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  heartsLottie: {
    width: 96,
    height: 96,
  },
  heartsCount: {
    fontSize: 18,
    fontWeight: '700',
    color: '#F25E86',
    fontFamily: 'Ubuntu-Bold',
    marginLeft: -30,
  },
  ufoOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.3)',
    zIndex: 1000,
  },
  ufoAnimationLarge: {
    width: 280,
    height: 280,
  },
  exerciseIntroHeart: {
    fontSize: 18,
  },
  exerciseIntroLottieWrap: {
    width: 160,
    height: 160,
    marginBottom: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  exerciseIntroLottie: {
    width: 160,
    height: 160,
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
    backgroundColor: '#2D4A66',
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
    backgroundColor: '#F25E86',
    paddingVertical: 16,
    paddingHorizontal: 48,
    borderRadius: 20,
    minWidth: 220,
    borderWidth: 3,
    borderColor: '#0D1B2A',
    shadowColor: '#000',
    shadowOffset: { width: 2, height: 3 },
    shadowOpacity: 0.4,
    shadowRadius: 0,
    elevation: 5,
  },
  gameOverButtonSecondary: {
    paddingVertical: 12,
    paddingHorizontal: 24,
  },
  gameOverButtonText: {
    fontSize: 17,
    fontWeight: '700',
    color: '#FFFFFF',
    textAlign: 'center',
    fontFamily: 'Ubuntu-Bold',
  },
  gameOverButtonTextSecondary: {
    fontSize: 15,
    color: '#9CA3AF',
    fontFamily: 'Feather-Bold',
  },
  // Leave Confirmation Modal styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  modalContainer: {
    backgroundColor: '#1B263B',
    borderRadius: 20,
    paddingVertical: 28,
    paddingHorizontal: 24,
    width: '100%',
    maxWidth: 300,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#2D4A66',
  },
  modalContainerLight: {
    backgroundColor: '#FFFFFF',
    borderColor: '#E5E7EB',
  },
  modalTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 8,
    fontFamily: 'Ubuntu-Bold',
  },
  modalTitleLight: {
    color: '#111827',
  },
  modalMessage: {
    fontSize: 15,
    color: '#9CA3AF',
    textAlign: 'center',
    marginBottom: 24,
    fontFamily: 'Feather-Bold',
  },
  modalMessageLight: {
    color: '#6B7280',
  },
  modalButtons: {
    flexDirection: 'row',
    gap: 12,
    width: '100%',
  },
  modalButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderBottomWidth: 4,
  },
  modalButtonStay: {
    backgroundColor: '#4ED9CB',
    borderColor: '#0D1B2A',
  },
  modalButtonStayLight: {
    backgroundColor: '#4ED9CB',
    borderColor: '#2D4A66',
  },
  modalButtonLeave: {
    backgroundColor: 'transparent',
    borderColor: '#F25E86',
  },
  modalButtonText: {
    fontSize: 16,
    fontWeight: '700',
    fontFamily: 'Ubuntu-Bold',
  },
  modalButtonStayText: {
    color: '#FFFFFF',
  },
  modalButtonLeaveText: {
    color: '#F25E86',
  },
});

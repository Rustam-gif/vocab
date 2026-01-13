import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, SafeAreaView, Image, Animated, Easing, InteractionManager, Dimensions, DeviceEventEmitter, Platform, Modal } from 'react-native';

// Use local haptic feedback shim (no-op since native module not available)
import ReactNativeHapticFeedback from '../../lib/haptics';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useNavigation } from '@react-navigation/native';
import LottieView from 'lottie-react-native';
import { levels } from './data/levels';
import type { Level, Set as VocabSet } from './data/levels';
import ErrorBoundary from './components/ErrorBoundary';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFocusEffect } from '@react-navigation/native';
import { ProgressService } from '../../services/ProgressService';
import { SetProgressService } from '../../services/SetProgressService';
import { SubscriptionService } from '../../services/SubscriptionService';
import { useAppStore } from '../../lib/store';
import { getTheme } from '../../lib/theme';
import TopStatusPanel from '../components/TopStatusPanel';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import LimitModal from '../../lib/LimitModal';
import { Lock, Check, Star, CheckCircle, Flag, Trophy, Crown } from 'lucide-react-native';
import Svg, { Path, Defs, LinearGradient as SvgLinearGradient, Stop } from 'react-native-svg';
import { LinearGradient } from '../../lib/LinearGradient';

const SELECTED_LEVEL_KEY = '@engniter.selectedLevel';
const HIGHEST_LEVEL_KEY = '@engniter.highestLevel';
const PLACEMENT_LEVEL_KEY = '@engniter.placementLevel';
const UNLOCK_ALL_SETS = false;
const { width: SCREEN_WIDTH } = Dimensions.get('window');
const NODE_SIZE = 72;
const NODE_SPACING = 100;
const LEVEL_NODE_SIZE = 80;

// Level ordering for core levels
const CORE_ORDER = ['beginner', 'intermediate', 'upper-intermediate', 'advanced', 'proficient'];
const CORE_SET = new Set(CORE_ORDER);
const getLevelWeight = (id: string) => {
  const idx = CORE_ORDER.indexOf(id);
  return idx >= 0 ? idx : 100 + id.charCodeAt(0);
};

export default function LearnScreen() {
  const router = useRouter();
  const navigation = useNavigation<any>();
  const theme = useAppStore(s => s.theme);
  const user = useAppStore(s => s.user);
  const isSignedIn = !!(user && (user as any)?.id);
  const colors = getTheme(theme);
  const isLight = theme === 'light';
  const insets = useSafeAreaInsets();
  const [showSignupModal, setShowSignupModal] = useState(false);
  const [panelHeight, setPanelHeight] = useState<number>(insets.top + 48);
  const { level: levelId } = useLocalSearchParams<{ level: string }>();
  const [currentLevel, setCurrentLevel] = useState<Level | null>(null);
  const [progress, setProgress] = useState({ completed: 0, total: 0 });
  const [activeLevelId, setActiveLevelId] = useState<string | null>(levelId ?? null);
  const [highestLevel, setHighestLevel] = useState<string | null>(null);
  const [placementLevel, setPlacementLevel] = useState<string | null>(null);
  const nodeAnims = useRef<Animated.Value[]>([]);
  const levelNodeAnims = useRef<Animated.Value[]>([]);
  const levelPulseAnim = useRef(new Animated.Value(1)).current;
  const levelPulseOpacity = useRef(new Animated.Value(0.4)).current;
  const [currentSetIndex, setCurrentSetIndex] = useState<number>(0);
  const hasAnimatedEntrance = useRef(false);
  const passedStageGates = useRef<Set<number>>(new Set());
  const scrollViewRef = useRef<ScrollView>(null);
  const isScrollingRef = useRef(false);
  const scrollEndTimer = useRef<NodeJS.Timeout | null>(null);

  // Premium status for gating content
  const [isPremium, setIsPremium] = useState<boolean>(false);
  const [showPaywall, setShowPaywall] = useState<boolean>(false);

  // Ensure nav bar is visible when this screen is shown
  useEffect(() => {
    DeviceEventEmitter.emit('NAV_VISIBILITY', 'show');
  }, []);

  // Check premium status on mount
  const checkPremiumStatus = useCallback(async () => {
    try {
      const status = await SubscriptionService.getStatus();
      setIsPremium(status?.active ?? false);
    } catch {
      setIsPremium(false);
    }
  }, []);

  useEffect(() => {
    checkPremiumStatus();
  }, [checkPremiumStatus]);

  useFocusEffect(
    useCallback(() => {
      checkPremiumStatus();
    }, [checkPremiumStatus])
  );

  // Breathing animation for current level outer ring
  // Using longer duration to reduce CPU usage
  useEffect(() => {
    const breathing = Animated.loop(
      Animated.sequence([
        Animated.parallel([
          Animated.timing(levelPulseAnim, {
            toValue: 1.08,
            duration: 2500,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
          Animated.timing(levelPulseOpacity, {
            toValue: 0.2,
            duration: 2500,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
        ]),
        Animated.parallel([
          Animated.timing(levelPulseAnim, {
            toValue: 1,
            duration: 2500,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
          Animated.timing(levelPulseOpacity, {
            toValue: 0.5,
            duration: 2500,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
        ]),
      ])
    );
    breathing.start();
    return () => breathing.stop();
  }, [levelPulseAnim, levelPulseOpacity]);

  // Available levels (excluding Advanced Plus and levels below placement)
  const availableLevels = levels.filter(l => {
    if (l.id === 'advanced-plus') return false;
    // Filter based on placement level if set
    if (placementLevel) {
      const placementWeight = getLevelWeight(
        placementLevel === 'beginner' ? 'beginner' :
        placementLevel === 'intermediate' ? 'intermediate' :
        placementLevel === 'advanced' ? 'upper-intermediate' : 'beginner'
      );
      const levelWeight = getLevelWeight(l.id);
      // Only show levels at or above placement level (for core levels)
      if (CORE_SET.has(l.id) && levelWeight < placementWeight) {
        return false;
      }
    }
    return true;
  });
  const sortedLevels = [...availableLevels].sort((a, b) => getLevelWeight(a.id) - getLevelWeight(b.id));

  // Theme colors
  const accent = '#F8B070';
  const activeColor = '#FE9602'; // Orange for active
  const completedColor = '#437F76'; // Green for completed
  const lockedColor = isLight ? '#D1D5DB' : '#4A4A4A';

  const loadStoredLevel = useCallback(async () => {
    // Load highest level
    const highest = await AsyncStorage.getItem(HIGHEST_LEVEL_KEY);
    if (highest) setHighestLevel(highest);

    // Load placement level for filtering
    const placement = await AsyncStorage.getItem(PLACEMENT_LEVEL_KEY);
    if (placement) setPlacementLevel(placement);

    if (levelId) {
      await AsyncStorage.setItem(SELECTED_LEVEL_KEY, levelId);
      setActiveLevelId(levelId);
      return;
    }
    const stored = await AsyncStorage.getItem(SELECTED_LEVEL_KEY);
    if (stored) {
      setActiveLevelId(stored);
    } else if (levels && levels.length > 0) {
      const fallback = levels[0]?.id;
      if (fallback) {
        await AsyncStorage.setItem(SELECTED_LEVEL_KEY, fallback);
        setActiveLevelId(fallback);
      }
    }
  }, [levelId]);

  const handleLevelSelect = async (id: string) => {
    setActiveLevelId(id);
    await AsyncStorage.setItem(SELECTED_LEVEL_KEY, id);
    DeviceEventEmitter.emit('LEVEL_SELECTED', id);
  };

  const getLevelIcon = (id: string) => {
    switch (id) {
      case 'beginner':
        return require('../../assets/levelicons/beginner.png');
      case 'ielts':
        return require('../../assets/levelicons/ielts-vocabulary.png');
      case 'intermediate':
        return require('../../assets/levelicons/intermediate.png');
      case 'upper-intermediate':
        return require('../../assets/levelicons/upper-intermediate.png');
      case 'advanced':
        return require('../../assets/levelicons/advanced.png');
      case 'proficient':
        return require('../../assets/levelicons/proficient.png');
      default:
        return require('../../assets/levelicons/beginner.png');
    }
  };

  useEffect(() => {
    const t = InteractionManager.runAfterInteractions(() => {
      loadStoredLevel();
    });
    return () => t.cancel?.();
  }, [loadStoredLevel]);

  const refreshLevel = useCallback(async () => {
    if (!activeLevelId) {
      setCurrentLevel(null);
      return;
    }

    let level = levels.find(l => l.id === activeLevelId);
    if (!level && levels.length > 0) {
      level = levels[0];
      try { await AsyncStorage.setItem(SELECTED_LEVEL_KEY, level.id); } catch {}
    }
    if (level) {
      await Promise.all([ProgressService.initialize(), SetProgressService.initialize()]);

      const baseSets = level.id === 'upper-intermediate'
        ? level.sets.filter(s => {
            const n = Number(s.id);
            return isNaN(n) || n > 10;
          })
        : level.sets;

      // Auto-insert recap quizzes after every 4 sets
      const buildWithQuizzes = (sets: VocabSet[]) => {
        const nonQuiz = sets.filter(s => (s as any).type !== 'quiz');
        const result: VocabSet[] = [];
        let groupIndex = 0;
        for (let i = 0; i < nonQuiz.length; i++) {
          result.push(nonQuiz[i]);
          const atGroupEnd = (i + 1) % 4 === 0;
          if (atGroupEnd) {
            const group = nonQuiz.slice(i - 3, i + 1);
            const words: any[] = [];
            group.forEach(g => {
              words.push(...(g.words || []).slice(0, 5));
            });
            groupIndex += 1;
            const startNum = (groupIndex - 1) * 4 + 1;
            const endNum = startNum + 3;
            const quiz: any = {
              id: `quiz-${groupIndex}`,
              title: `Quiz ${groupIndex}`,
              type: 'quiz',
              description: `Recap of Sets ${startNum}–${endNum}`,
              words,
              completed: false,
            };
            result.push(quiz as VocabSet);
          }
        }
        return result;
      };

      const withQuizzes = buildWithQuizzes(baseSets as any);

      // Find the most recent completed quiz index
      const findLastCompletedQuizIndex = () => {
        for (let i = withQuizzes.length - 1; i >= 0; i--) {
          const s = withQuizzes[i];
          if ((s as any).type === 'quiz') {
            const flags = SetProgressService.getSetFlags(activeLevelId, s.id);
            const isCompleted = typeof flags.completed === 'boolean' ? flags.completed : !!s.completed;
            if (isCompleted) return i;
          }
        }
        return -1;
      };

      // Find the next quiz index after a given index
      const findNextQuizIndex = (afterIndex: number) => {
        for (let i = afterIndex + 1; i < withQuizzes.length; i++) {
          if ((withQuizzes[i] as any).type === 'quiz') return i;
        }
        return withQuizzes.length; // No more quizzes
      };

      const lastCompletedQuizIdx = findLastCompletedQuizIndex();
      const nextQuizIdx = lastCompletedQuizIdx >= 0 ? findNextQuizIndex(lastCompletedQuizIdx) : findNextQuizIndex(-1);

      const setsWithProgress = withQuizzes.map((set, index) => {
        const flags = SetProgressService.getSetFlags(activeLevelId, set.id);
        const baseSet = {
          ...set,
          completed: typeof flags.completed === 'boolean' ? flags.completed : !!set.completed,
          inProgress: typeof flags.inProgress === 'boolean' ? flags.inProgress : !!set.inProgress,
          score: typeof flags.score === 'number' ? flags.score : set.score,
        };

        if (UNLOCK_ALL_SETS) {
          return { ...baseSet, locked: false, premiumLocked: false } as any;
        }

        // For free users: only the first set is available
        if (!isPremium && index > 0) {
          return { ...baseSet, locked: true, premiumLocked: true };
        }

        // First set is always unlocked
        if (index === 0) {
          return { ...baseSet, premiumLocked: false };
        }

        // After a completed quiz, only unlock the FIRST set after it (not all sets until next quiz)
        // The rest should unlock one-by-one as each set is completed
        if (lastCompletedQuizIdx >= 0 && index === lastCompletedQuizIdx + 1) {
          // This is the first set after the last completed quiz - unlock it
          return { ...baseSet, locked: false, premiumLocked: false };
        }

        // Default: check if previous set is completed
        const prevSet = withQuizzes[index - 1];
        const prevFlags = SetProgressService.getSetFlags(activeLevelId, prevSet.id);
        const prevCompleted = typeof prevFlags.completed === 'boolean' ? prevFlags.completed : !!prevSet.completed;
        return { ...baseSet, locked: !prevCompleted, premiumLocked: false };
      });

      const levelWithProgress = { ...level, sets: setsWithProgress };

      // Only create new animations if needed (first load or count changed)
      const needsNewAnims = nodeAnims.current.length !== setsWithProgress.length;
      if (needsNewAnims) {
        nodeAnims.current = setsWithProgress.map(() => new Animated.Value(hasAnimatedEntrance.current ? 1 : 0));
      }

      setCurrentLevel(levelWithProgress);

      const completed = setsWithProgress.filter(s => s.completed).length;
      setProgress({ completed, total: setsWithProgress.length });

      // Only animate entrance on first load
      if (!hasAnimatedEntrance.current && needsNewAnims) {
        hasAnimatedEntrance.current = true;
        setTimeout(() => {
          const animations = nodeAnims.current.map((anim, i) =>
            Animated.timing(anim, {
              toValue: 1,
              duration: 400,
              delay: i * 80,
              easing: Easing.out(Easing.back(1.2)),
              useNativeDriver: true,
            })
          );
          Animated.stagger(60, animations).start();
        }, 100);
      }
    }
  }, [activeLevelId, isPremium]);

  useEffect(() => { refreshLevel(); }, [refreshLevel]);

  useFocusEffect(
    useCallback(() => {
      const task = InteractionManager.runAfterInteractions(() => {
        refreshLevel();
      });
      return () => task.cancel?.();
    }, [refreshLevel])
  );

  // Check if the previous level has at least one completed quiz
  // Skip ahead is only available if there's a previous level AND it's completed
  const isPreviousLevelCompleted = useCallback(() => {
    if (!activeLevelId) return false;
    const currentIdx = CORE_ORDER.indexOf(activeLevelId);
    // First level (beginner) - no previous level, so skip ahead not available
    if (currentIdx <= 0) return false;

    const prevLevelId = CORE_ORDER[currentIdx - 1];
    const prevLevel = levels.find(l => l.id === prevLevelId);
    if (!prevLevel) return false;

    // Check if any quiz in the previous level is completed
    for (const set of prevLevel.sets) {
      if ((set as any).type === 'quiz') {
        const flags = SetProgressService.getSetFlags(prevLevelId, set.id);
        if (flags.completed) return true;
      }
    }
    // Also check if all regular sets are completed (level fully done)
    const completedCount = prevLevel.sets.filter(s => {
      const flags = SetProgressService.getSetFlags(prevLevelId, s.id);
      return flags.completed;
    }).length;
    if (completedCount >= prevLevel.sets.length) return true;

    return false;
  }, [activeLevelId]);

  // Check if skip ahead is available for a specific quiz
  // Only the FIRST incomplete quiz can show skip ahead
  const canQuizSkipAhead = useCallback((quizSet: VocabSet, allSets: VocabSet[]) => {
    if (!activeLevelId) return false;

    // Find all quizzes in the current level
    const quizzes = allSets.filter(s => (s as any).type === 'quiz');
    const quizIndex = quizzes.findIndex(q => q.id === quizSet.id);

    if (quizIndex < 0) return false;

    // For the first quiz in a level, check if previous level is completed
    if (quizIndex === 0) {
      return isPreviousLevelCompleted();
    }

    // For subsequent quizzes, check if ALL previous quizzes are completed
    for (let i = 0; i < quizIndex; i++) {
      const prevQuiz = quizzes[i];
      const flags = SetProgressService.getSetFlags(activeLevelId, prevQuiz.id);
      if (!flags.completed) {
        return false; // Previous quiz not completed, can't skip ahead
      }
    }

    // All previous quizzes completed, check if previous level is also completed
    return isPreviousLevelCompleted();
  }, [activeLevelId, isPreviousLevelCompleted]);

  const handleSetPress = (set: VocabSet & { locked?: boolean; premiumLocked?: boolean }, allSets?: VocabSet[]) => {
    if (!activeLevelId) {
      router.push('/quiz/level-select');
      return;
    }

    // Premium-locked sets show paywall
    if ((set as any).premiumLocked) {
      setShowPaywall(true);
      return;
    }

    const isQuizSet = (set as any).type === 'quiz';

    // Allow locked quiz nodes to be pressed (Skip ahead feature)
    // But only if the previous level has been completed AND user is premium
    if (set.locked && !isQuizSet) {
      return;
    }

    // For locked quiz sets, check if this specific quiz can skip ahead (premium only)
    if (set.locked && isQuizSet && allSets && (!isPremium || !canQuizSkipAhead(set, allSets))) {
      if (!isPremium) {
        setShowPaywall(true);
        return;
      }
      return;
    }

    if (!isSignedIn) {
      // Send users to Profile to sign in; avoid blocking overlays that steal touches
      router.push('/profile?redirect=/quiz/learn');
      return;
    }

    const url = `/quiz/atlas-practice-integrated?setId=${set.id}&levelId=${activeLevelId}`;
    router.push(url);
  };

  const getNodePosition = (index: number): 'center' | 'left' | 'right' => {
    // Create a smooth S-curve winding path: left → right → left → right
    const pattern = ['left', 'right', 'left', 'right'] as const;
    return pattern[index % 4];
  };

  const getNodeOffset = (position: 'center' | 'left' | 'right'): number => {
    // Create gentle winding path
    const centerX = SCREEN_WIDTH / 2;
    switch (position) {
      case 'left': return centerX - 45;
      case 'right': return centerX + 45;
      default: return centerX;
    }
  };

  // Update current set index when level changes
  useEffect(() => {
    if (!currentLevel) return;

    const newIndex = currentLevel.sets.findIndex(s => !s.completed && !s.locked);
    if (newIndex === -1) return;
    setCurrentSetIndex(newIndex);
  }, [currentLevel]);

  // Calculate stage gate positions and trigger haptic when scrolling past
  const stageGateIndices = useRef<number[]>([]);
  useEffect(() => {
    if (!currentLevel) return;
    // Find indices where stage gates appear (after quizzes)
    const indices: number[] = [];
    currentLevel.sets.forEach((set, index) => {
      if (index > 0 && (currentLevel.sets[index - 1] as any).type === 'quiz') {
        indices.push(index);
      }
    });
    stageGateIndices.current = indices;
    passedStageGates.current.clear();
  }, [currentLevel]);

  // Track stage gate Y positions
  const stageGatePositions = useRef<Map<number, number>>(new Map());

  // Soft haptic feedback using react-native-haptic-feedback
  const triggerHaptic = useCallback((style: 'light' | 'medium' | 'heavy' = 'medium') => {
    if (Platform.OS !== 'ios' || !ReactNativeHapticFeedback) return;

    try {
      const options = {
        enableVibrateFallback: false,
        ignoreAndroidSystemSettings: false,
      };

      // Use soft, playful haptics
      switch (style) {
        case 'light':
          ReactNativeHapticFeedback.trigger('selection', options);
          break;
        case 'medium':
          ReactNativeHapticFeedback.trigger('impactLight', options);
          break;
        case 'heavy':
          ReactNativeHapticFeedback.trigger('impactMedium', options);
          break;
      }
    } catch {
      // Haptic feedback not available
    }
  }, []);

  // Debounced scroll handler to prevent excessive haptic triggers
  const lastHapticTime = useRef(0);
  const handleScroll = useCallback((event: any) => {
    // Mark as scrolling and clear any pending end timer
    isScrollingRef.current = true;
    if (scrollEndTimer.current) {
      clearTimeout(scrollEndTimer.current);
    }
    // Set timer to mark scroll as ended after 150ms of no scroll events
    scrollEndTimer.current = setTimeout(() => {
      isScrollingRef.current = false;
    }, 150);

    const now = Date.now();
    // Only check for haptic feedback every 500ms to prevent jank
    if (now - lastHapticTime.current < 500) return;

    const scrollY = event.nativeEvent.contentOffset.y;
    const viewportHeight = event.nativeEvent.layoutMeasurement.height;
    const viewportCenter = scrollY + viewportHeight / 2;

    stageGatePositions.current.forEach((gateY, stageNumber) => {
      // Check if stage gate is now in the center of viewport
      const isInView = Math.abs(viewportCenter - gateY) < 100;

      if (isInView && !passedStageGates.current.has(stageNumber)) {
        passedStageGates.current.add(stageNumber);
        lastHapticTime.current = now;
        triggerHaptic('light');
      }
    });
  }, [triggerHaptic]);

  const getIconSource = (title: string, type?: string) => {
    if (type === 'quiz') return require('../../assets/wordset_icons/quiz.png');
    const t = String(title || '').toLowerCase();

    // Map titles to icons
    if (t.includes('daily') || t.includes('action')) return require('../../assets/wordset_icons/daily-routines-habits.png');
    if (t.includes('object') || t.includes('handling')) return require('../../assets/wordset_icons/home-furniture.png');
    if (t.includes('communication') || t.includes('basic')) return require('../../assets/wordset_icons/culture-entertainment.png');
    if (t.includes('study') || t.includes('work')) return require('../../assets/wordset_icons/education-work.png');
    if (t.includes('food') || t.includes('cook')) return require('../../assets/wordset_icons/food-cooking.png');
    if (t.includes('travel') || t.includes('transport')) return require('../../assets/wordset_icons/transportation-travel.png');
    if (t.includes('health') || t.includes('body')) return require('../../assets/wordset_icons/health-body.png');
    if (t.includes('weather') || t.includes('nature')) return require('../../assets/wordset_icons/weather-nature.png');
    if (t.includes('emotion') || t.includes('feeling')) return require('../../assets/wordset_icons/emotions-personality.png');
    if (t.includes('shopping') || t.includes('money')) return require('../../assets/wordset_icons/shopping-money.png');
    if (t.includes('technology') || t.includes('internet')) return require('../../assets/wordset_icons/technology-internet.png');
    if (t.includes('hobby') || t.includes('free time')) return require('../../assets/wordset_icons/free-time-hobbies.png');

    return require('../../assets/wordset_icons/basic-needs.png');
  };

  const cleanTitle = (title: string) => {
    let raw = String(title || '').trim();
    // Remove CEFR prefix like "A1 — Topic"
    const mCefr = raw.match(/^(A[12]|B[12]|C[12])\s*(?:—|-)\s*(.+)$/i);
    if (mCefr && mCefr[2]) raw = mCefr[2].trim();
    // Remove "Set N — " prefix
    const mSetTopic = raw.match(/^Set\s*\d+\s*(?:—|-|:)\s*(.+)$/i);
    if (mSetTopic && mSetTopic[1]) raw = mSetTopic[1].trim();
    // Remove trailing numbers like "Daily Actions 1" -> "Daily Actions"
    raw = raw.replace(/\s+\d+$/, '').trim();
    return raw;
  };

  // Extra padding to prevent level circle from overlapping with status bar
  const contentTop = insets.top + 20;

  // Memoize connector paths to prevent recalculation on every render
  // Must be before any early returns to avoid hook order issues
  const connectorPaths = useMemo(() => {
    if (!currentLevel) return [];
    return currentLevel.sets.map((set, index) => {
      if (index >= currentLevel.sets.length - 1) return null;
      const currentPos = getNodePosition(index);
      const nextPos = getNodePosition(index + 1);
      const currentX = getNodeOffset(currentPos);
      const nextX = getNodeOffset(nextPos);
      const connectorHeight = NODE_SPACING - NODE_SIZE + 20;
      const midY = connectorHeight / 2;
      return {
        pathD: `M ${currentX} 0 C ${currentX} ${midY}, ${nextX} ${midY}, ${nextX} ${connectorHeight}`,
        height: connectorHeight,
        isCompleted: set?.completed,
      };
    });
  }, [currentLevel?.sets?.length, currentLevel?.sets?.map(s => s.completed).join(',')]);

  if (!currentLevel) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
        <TopStatusPanel floating includeTopInset />
        <View style={[styles.loadingContainer, { paddingTop: contentTop }]}>
          <LottieView
            source={require('../../assets/lottie/loading.json')}
            autoPlay
            loop
            style={{ width: 140, height: 140 }}
          />
          <Text style={[styles.loadingText, isLight && { color: '#6B7280' }]}>Loading...</Text>
        </View>
      </SafeAreaView>
    );
  }

  const renderNode = (set: VocabSet & { locked?: boolean; premiumLocked?: boolean }, index: number, isCurrentLevel: boolean, allSets: VocabSet[]) => {
    const position = getNodePosition(index);
    const offsetX = getNodeOffset(position);
    const isLocked = set.locked;
    const isPremiumLocked = (set as any).premiumLocked === true;
    const isCompleted = set.completed;
    const isQuiz = (set as any).type === 'quiz';
    // Only the first uncompleted, unlocked node in the CURRENT level is "current"
    const isCurrent = isCurrentLevel && index === currentSetIndex;
    // Check if this specific quiz can skip ahead (only first incomplete quiz) - premium only
    const quizCanSkipAhead = isPremium && isQuiz && isLocked && canQuizSkipAhead(set, allSets);

    const anim = nodeAnims.current[index] || new Animated.Value(1);
    const scale = anim.interpolate({ inputRange: [0, 1], outputRange: [0.5, 1] });
    const opacity = anim.interpolate({ inputRange: [0, 1], outputRange: [0, 1] });

    return (
      <Animated.View
        key={`node-${set.id}-${index}`}
        style={[
          styles.nodeWrapper,
          {
            transform: [{ scale }],
            opacity,
            left: offsetX - NODE_SIZE / 2,
          },
        ]}
      >
        {/* Breathing ring for current set */}
        {isCurrent && (
          <Animated.View
            style={[
              styles.setBreathingRing,
              {
                backgroundColor: '#FE9602',
                opacity: levelPulseOpacity,
                transform: [{ scale: levelPulseAnim }],
              },
            ]}
          />
        )}

        {/* 3D coin edge (darker bottom) */}
        {(() => {
          const isQuizDisabled = isQuiz && isLocked && !quizCanSkipAhead;
          return (
            <View style={[
              styles.coinEdge,
              // Premium locked nodes show golden edge
              isPremiumLocked && { backgroundColor: '#B8860B' },
              // Available nodes show teal edge
              !isPremiumLocked && !isLocked && !isCompleted && !isCurrent && styles.coinEdgeCompleted,
              // Current node shows orange edge
              !isPremiumLocked && isCurrent && styles.coinEdgeActive,
              // Completed nodes show teal edge
              !isPremiumLocked && isCompleted && styles.coinEdgeCompleted,
              // Locked nodes show gray edge
              !isPremiumLocked && isLocked && !isQuiz && styles.coinEdgeLocked,
              !isPremiumLocked && isLocked && !isQuiz && !isLight && { backgroundColor: '#3A3A3A' },
              // Quiz nodes that can't skip ahead show gray
              !isPremiumLocked && isQuizDisabled && styles.coinEdgeLocked,
              !isPremiumLocked && isQuizDisabled && !isLight && { backgroundColor: '#3A3A3A', opacity: 0.6 },
              // Quiz nodes get purple/pink color (only if not disabled)
              !isPremiumLocked && isQuiz && !isCompleted && !isLocked && { backgroundColor: '#9333EA' },
              !isPremiumLocked && isQuiz && isCompleted && { backgroundColor: '#C94A6A' },
              !isPremiumLocked && quizCanSkipAhead && { backgroundColor: '#6B21A8' },
            ]} />
          );
        })()}

        {/* "Skip ahead" or "Review" label for quiz nodes */}
        {isQuiz && !isCompleted && (() => {
          const quizScore = (set as any).score;
          const hasFailed = typeof quizScore === 'number' && quizScore > 0 && quizScore < 70;

          // Don't show "Skip ahead" label if this quiz can't skip ahead
          if (isLocked && !quizCanSkipAhead) return null;

          return (
            <Animated.View
              style={[
                styles.skipAheadLabel,
                {
                  transform: [{ scale: levelPulseAnim }],
                  opacity: levelPulseOpacity.interpolate({
                    inputRange: [0.2, 0.5],
                    outputRange: [1, 0.7],
                  }),
                },
              ]}
            >
              <Text style={[
                styles.skipAheadText,
                isLocked && styles.skipAheadTextLocked,
                hasFailed && styles.skipAheadTextFailed,
              ]}>
                {hasFailed ? 'Review sets!' : isLocked ? 'Skip ahead!' : 'Take Quiz!'}
              </Text>
            </Animated.View>
          );
        })()}

        {/* Main coin face */}
        {(() => {
          const isQuizDisabled = isQuiz && isLocked && !quizCanSkipAhead;
          return (
            <TouchableOpacity
              onPress={() => handleSetPress(set, allSets)}
              disabled={!isPremiumLocked && isLocked && (!isQuiz || !quizCanSkipAhead)}
              activeOpacity={0.9}
              style={[
                styles.coinFace,
                // Premium locked nodes show golden face
                isPremiumLocked && { backgroundColor: '#DAA520', borderColor: 'rgba(255,215,0,0.4)' },
                // Available nodes (not locked, not completed) show as teal
                !isPremiumLocked && !isLocked && !isCompleted && !isCurrent && styles.coinFaceCompleted,
                // Current node shows as orange
                !isPremiumLocked && isCurrent && styles.coinFaceActive,
                // Completed nodes show as teal
                !isPremiumLocked && isCompleted && styles.coinFaceCompleted,
                // Locked nodes show as gray
                !isPremiumLocked && isLocked && !isQuiz && styles.coinFaceLocked,
                !isPremiumLocked && isLocked && !isQuiz && !isLight && { backgroundColor: '#4A4A4A', borderColor: 'rgba(255,255,255,0.1)' },
                // Quiz nodes that can't skip ahead show gray
                !isPremiumLocked && isQuizDisabled && styles.coinFaceLocked,
                !isPremiumLocked && isQuizDisabled && !isLight && { backgroundColor: '#4A4A4A', borderColor: 'rgba(255,255,255,0.1)', opacity: 0.6 },
                // Quiz nodes get purple/pink color (only if not disabled)
                !isPremiumLocked && isQuiz && !isCompleted && !isLocked && { backgroundColor: '#A855F7', borderColor: 'rgba(255,255,255,0.4)' },
                !isPremiumLocked && isQuiz && isCompleted && { backgroundColor: '#F25E86' },
                !isPremiumLocked && quizCanSkipAhead && { backgroundColor: '#7C3AED', borderColor: 'rgba(255,255,255,0.2)' },
              ]}
            >
              {/* Glossy reflection highlight */}
              <View style={styles.coinReflection} pointerEvents="none" />
              {isPremiumLocked ? (
                <Crown size={28} color="#FFFFFF" strokeWidth={2.5} />
              ) : (
                <Image
                  source={getIconSource(set.title, (set as any).type)}
                  style={[styles.coinIcon, (isLocked || isQuizDisabled) && styles.coinIconLocked]}
                  resizeMode="contain"
                />
              )}
            </TouchableOpacity>
          );
        })()}

        {/* Premium badge for locked sets */}
        {isPremiumLocked && (
          <View style={styles.premiumBadge}>
            <Text style={styles.premiumBadgeText}>PRO</Text>
          </View>
        )}

      </Animated.View>
    );
  };

  const renderConnector = (index: number, total: number) => {
    if (index >= total - 1) return null;
    const cached = connectorPaths[index];
    if (!cached) return null;

    const lineColor = cached.isCompleted ? (isLight ? '#C4C4C4' : '#5A5A5A') : (isLight ? '#E5E7EB' : '#3A3A3A');

    return (
      <View key={`connector-${index}`} style={styles.connectorWrapper} pointerEvents="none">
        <Svg height={cached.height} width={SCREEN_WIDTH} pointerEvents="none">
          <Path
            d={cached.pathD}
            stroke={lineColor}
            strokeWidth={3}
            strokeDasharray="8,8"
            fill="none"
          />
        </Svg>
      </View>
    );
  };

  // Get the next level in progression
  const getNextLevel = () => {
    if (!activeLevelId) return null;
    const currentIdx = CORE_ORDER.indexOf(activeLevelId);
    if (currentIdx === -1 || currentIdx >= CORE_ORDER.length - 1) return null;
    return CORE_ORDER[currentIdx + 1];
  };

  const handleNextLevel = async () => {
    const nextLevelId = getNextLevel();
    if (!nextLevelId) return;

    // Update stored level
    await AsyncStorage.setItem(SELECTED_LEVEL_KEY, nextLevelId);
    await AsyncStorage.setItem(HIGHEST_LEVEL_KEY, nextLevelId);

    // Emit event and update state
    DeviceEventEmitter.emit('LEVEL_SELECTED', nextLevelId);
    setActiveLevelId(nextLevelId);
    setHighestLevel(nextLevelId);

    // Reset animation flag for new level
    hasAnimatedEntrance.current = false;
  };

  const renderStarNode = () => {
    const allCompleted = progress.completed === progress.total && progress.total > 0;
    const lastIndex = currentLevel.sets.length;
    const position = getNodePosition(lastIndex);
    const offsetX = getNodeOffset(position);
    const nextLevelId = getNextLevel();
    const nextLevel = nextLevelId ? levels.find(l => l.id === nextLevelId) : null;

    return (
      <View style={[styles.nodeWrapper, { left: offsetX - NODE_SIZE / 2, height: allCompleted && nextLevel ? NODE_SIZE + 80 : NODE_SIZE + 8 }]}>
        <View style={[
          styles.node,
          styles.starNode,
          allCompleted && styles.starNodeCompleted,
          { borderColor: allCompleted ? '#FFD700' : lockedColor },
        ]}>
          <View style={[
            styles.nodeInner,
            { backgroundColor: allCompleted ? '#FFD700' : (isLight ? '#E5E7EB' : '#3A3A3A') },
          ]}>
            <Star size={42} color={allCompleted ? '#fff' : (isLight ? '#9CA3AF' : '#666')} fill={allCompleted ? '#fff' : 'none'} />
          </View>
        </View>
        <View style={styles.nodeLabel}>
          <Text style={[styles.nodeLabelText, isLight && styles.nodeLabelTextLight, !allCompleted && styles.nodeLabelTextLocked]}>
            {allCompleted ? 'Mastery!' : 'Complete all'}
          </Text>
        </View>

        {/* Next Level Button */}
        {allCompleted && nextLevel && (
          <TouchableOpacity
            onPress={handleNextLevel}
            activeOpacity={0.9}
            style={styles.nextLevelButton}
          >
            <Text style={styles.nextLevelButtonText}>Continue to {nextLevel.name}</Text>
          </TouchableOpacity>
        )}
      </View>
    );
  };

  // Render character decoration at specific positions - aligned on same row as node
  const renderCharacter = (index: number, type: 'giraffe' | 'sloth' | 'monkey' | 'chameleon' | 'fox', side: 'left' | 'right', isActive: boolean = true) => {
    const charSize = 110;
    // Center vertically with the node
    const charOffsetY = (NODE_SIZE - charSize) / 2 - 10;
    let charOffsetX;

    if (side === 'right') {
      // Position on the right edge of the screen
      charOffsetX = SCREEN_WIDTH - charSize - 15;
    } else {
      // Position on the left edge of the screen
      charOffsetX = 15;
    }
    // Flip horizontally - face toward the center/node
    const flipScale = side === 'left' ? 1 : -1;

    const getCharacterSource = () => {
      switch (type) {
        case 'giraffe':
          return require('../../assets/lottie/learn/Meditating_Giraffe.json');
        case 'sloth':
          return require('../../assets/lottie/learn/Sloth_sleeping.json');
        case 'monkey':
          return require('../../assets/lottie/learn/Monkey.lottie');
        case 'chameleon':
          return require('../../assets/lottie/learn/Chameleon.lottie');
        case 'fox':
          return require('../../assets/lottie/learn/Meditating_Fox.lottie');
        default:
          return require('../../assets/lottie/learn/Meditating_Giraffe.json');
      }
    };

    return (
      <View
        key={`char-${type}-${index}`}
        style={[
          styles.catCharacterWrapper,
          { left: charOffsetX, top: charOffsetY, opacity: isActive ? 1 : 0.4 },
        ]}
      >
        <LottieView
          source={getCharacterSource()}
          autoPlay={isActive}
          loop={isActive}
          style={{ width: charSize, height: charSize, transform: [{ scaleX: flipScale }] }}
        />
        {/* Ground shadow */}
        <View
          style={{
            position: 'absolute',
            top: charSize - 20,
            left: charSize / 2 - 30,
            width: 60,
            height: 12,
            borderRadius: 30,
            backgroundColor: 'rgba(0,0,0,0.15)',
          }}
        />
      </View>
    );
  };



  // Render stage gate after quiz
  const renderStageGate = (stageNumber: number, isUnlocked: boolean) => {
    // Store the Y position of this stage gate
    const onStageGateLayout = (event: any) => {
      const { y } = event.nativeEvent.layout;
      stageGatePositions.current.set(stageNumber, y);
    };

    return (
      <View style={styles.stageGateContainer} onLayout={onStageGateLayout} pointerEvents="box-none">
        {/* Decorative line left */}
        <View style={[styles.stageGateLine, !isUnlocked && styles.stageGateLineLocked]} />

        {/* Stage badge */}
        <View style={[styles.stageGateBadge, !isUnlocked && styles.stageGateBadgeLocked]}>
          <View style={[styles.stageGateInner, !isUnlocked && styles.stageGateInnerLocked]}>
            {isUnlocked ? (
              <Trophy size={24} color="#FFD700" fill="#FFD700" />
            ) : (
              <Flag size={24} color={isLight ? '#9CA3AF' : '#666'} />
            )}
          </View>
        </View>

        {/* Decorative line right */}
        <View style={[styles.stageGateLine, !isUnlocked && styles.stageGateLineLocked]} />

        {/* Stage label */}
        <View style={styles.stageGateLabelWrap}>
          <Text style={[styles.stageGateLabel, !isUnlocked && styles.stageGateLabelLocked]}>
            {isUnlocked ? `Chapter ${stageNumber + 2}` : `Pass Quiz`}
          </Text>
        </View>
      </View>
    );
  };

  // Build the path for current level only
  const buildCurrentLevelPath = () => {
    if (!currentLevel) return null;

    const setsToRender = currentLevel.sets;

    // Track which stage we're in (increments after each quiz)
    let currentStage = 0;

    return (
      <View style={styles.levelSetsContainer}>
        {/* Level header banner */}
        <View style={[styles.levelBanner, isLight && styles.levelBannerLight]}>
          <View style={styles.levelBannerEdge} />
          <View style={styles.levelBannerContent}>
            {/* Icon circle */}
            <View style={styles.levelBannerIconCircle}>
              <Image source={getLevelIcon(currentLevel.id)} style={styles.levelBannerIcon} resizeMode="contain" />
            </View>
            {/* Info */}
            <View style={styles.levelBannerInfo}>
              <Text style={styles.levelBannerTitle}>{currentLevel.name}</Text>
              <Text style={styles.levelBannerSubtitle}>Level {currentLevel.cefr}</Text>
            </View>
            {/* Progress badge */}
            <View style={styles.levelBannerBadge}>
              <Text style={styles.levelBannerBadgeText}>{progress.completed}/{progress.total}</Text>
            </View>
          </View>
        </View>

        {/* Sets path */}
        {setsToRender.map((set, index) => {
          const isQuiz = (set as any).type === 'quiz';
          const isQuizCompleted = isQuiz && set.completed;

          // Check if previous item was a completed quiz (to show stage gate)
          const prevSet = index > 0 ? setsToRender[index - 1] : null;
          const showStageGate = prevSet && (prevSet as any).type === 'quiz';
          const stageUnlocked = prevSet && prevSet.completed;

          if (showStageGate) {
            currentStage++;
          }

          return (
            <View key={`path-item-${index}`}>
              {/* Stage gate after quiz */}
              {showStageGate && renderStageGate(currentStage - 1, !!stageUnlocked)}

              {/* Show characters every 3 circles, alternating sides - animate only when area is reached */}
              {index === 2 && renderCharacter(index, 'monkey', 'right', !set.locked)}
              {index === 5 && renderCharacter(index, 'giraffe', 'left', !set.locked)}
              {index === 8 && renderCharacter(index, 'chameleon', 'right', !set.locked)}
              {index === 11 && renderCharacter(index, 'fox', 'left', !set.locked)}
              {index === 14 && renderCharacter(index, 'sloth', 'right', !set.locked)}
              {renderNode(set as any, index, true, setsToRender)}
              {renderConnector(index, setsToRender.length)}
            </View>
          );
        })}
        {/* Final connector to star */}
        {setsToRender.length > 0 && (() => {
          const starConnectorHeight = NODE_SPACING - NODE_SIZE + 20;
          const lastX = getNodeOffset(getNodePosition(setsToRender.length - 1));
          const starX = getNodeOffset(getNodePosition(setsToRender.length));
          const midY = starConnectorHeight / 2;
          const starPathD = `M ${lastX} 0 C ${lastX} ${midY}, ${starX} ${midY}, ${starX} ${starConnectorHeight}`;
          return (
            <View style={styles.connectorWrapper}>
              <Svg height={starConnectorHeight} width={SCREEN_WIDTH}>
                <Path
                  d={starPathD}
                  stroke={isLight ? '#E5E7EB' : '#3A3A3A'}
                  strokeWidth={3}
                  strokeDasharray="8,8"
                  fill="none"
                />
              </Svg>
            </View>
          );
        })()}
        {renderStarNode()}
      </View>
    );
  };

  // Subtle gradient colors for depth - slightly more visible
  const gradientColors = isLight
    ? ['#FFFFFF', '#F5F5F5', '#EBEBEB']
    : ['#2A2A2A', '#222222', '#1A1A1A'];

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <LinearGradient
        colors={gradientColors}
        start={{ x: 0.5, y: 0 }}
        end={{ x: 0.5, y: 1 }}
        style={{ flex: 1 }}
      >
        {/* Background fill for notch/status bar area - inside gradient for proper stacking */}
        <View style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          height: insets.top + 50,
          backgroundColor: isLight ? '#FFFFFF' : '#2A2A2A',
          zIndex: 5,
          borderBottomWidth: 2,
          borderBottomColor: '#1A1A1A',
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.3,
          shadowRadius: 0,
        }} />
        <TopStatusPanel floating includeTopInset />
        <ScrollView
          ref={scrollViewRef}
          style={{ flex: 1, paddingTop: contentTop }}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          onScroll={handleScroll}
          // More frequent events keep haptics in sync without throttling the native scroll thread
          scrollEventThrottle={16}
          // Avoid clipping because absolute-positioned Lottie/SVG nodes flicker and can jank scroll on iOS
          removeClippedSubviews={false}
        >
          {/* Path for current level only */}
          <View style={styles.pathContainer}>
            {buildCurrentLevelPath()}
          </View>

          <View style={{ height: 100 }} />
        </ScrollView>

      </LinearGradient>

      {/* TEST BUTTON - Remove after testing */}
      <TouchableOpacity
        style={{
          position: 'absolute',
          bottom: 100,
          right: 20,
          backgroundColor: '#F8B070',
          paddingHorizontal: 16,
          paddingVertical: 10,
          borderRadius: 20,
        }}
        onPress={async () => {
          if (!currentLevel || !activeLevelId) return;
          triggerHaptic('medium');
          // Find first uncompleted set
          const currentSet = currentLevel.sets.find(s => !s.completed && !s.locked);
          if (currentSet) {
            await SetProgressService.markCompleted(activeLevelId, currentSet.id, 100);
            refreshLevel();
          }
        }}
      >
        <Text style={{ color: '#fff', fontWeight: '600' }}>Test: Complete Set</Text>
      </TouchableOpacity>

      {/* Signup modal disabled to avoid invisible overlays blocking touches */}

      {/* Premium Paywall Modal */}
      <Modal
        visible={showPaywall}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowPaywall(false)}
      >
        <View style={styles.paywallOverlay}>
          <View style={[styles.paywallCard, isLight && styles.paywallCardLight]}>
            {/* Close button */}
            <TouchableOpacity
              style={styles.paywallClose}
              onPress={() => setShowPaywall(false)}
            >
              <Text style={styles.paywallCloseText}>✕</Text>
            </TouchableOpacity>

            {/* Crown icon */}
            <View style={styles.paywallCrownContainer}>
              <Crown size={48} color="#FFD700" strokeWidth={2} />
            </View>

            {/* Title */}
            <Text style={[styles.paywallTitle, isLight && styles.paywallTitleLight]}>
              Unlock All Lessons
            </Text>

            {/* Subtitle */}
            <Text style={[styles.paywallSubtitle, isLight && styles.paywallSubtitleLight]}>
              Get unlimited access to all vocabulary sets and learning features with Vocadoo Premium
            </Text>

            {/* Features list */}
            <View style={styles.paywallFeatures}>
              <View style={styles.paywallFeatureRow}>
                <Check size={18} color="#4ED9CB" />
                <Text style={[styles.paywallFeatureText, isLight && styles.paywallFeatureTextLight]}>
                  All vocabulary lessons unlocked
                </Text>
              </View>
              <View style={styles.paywallFeatureRow}>
                <Check size={18} color="#4ED9CB" />
                <Text style={[styles.paywallFeatureText, isLight && styles.paywallFeatureTextLight]}>
                  Skip ahead to any quiz
                </Text>
              </View>
              <View style={styles.paywallFeatureRow}>
                <Check size={18} color="#4ED9CB" />
                <Text style={[styles.paywallFeatureText, isLight && styles.paywallFeatureTextLight]}>
                  All daily articles
                </Text>
              </View>
              <View style={styles.paywallFeatureRow}>
                <Check size={18} color="#4ED9CB" />
                <Text style={[styles.paywallFeatureText, isLight && styles.paywallFeatureTextLight]}>
                  AI-powered stories
                </Text>
              </View>
            </View>

            {/* CTA Button */}
            <TouchableOpacity
              style={styles.paywallCta}
              onPress={() => {
                setShowPaywall(false);
                router.push('/profile?paywall=1');
              }}
            >
              <Text style={styles.paywallCtaText}>Upgrade to Premium</Text>
            </TouchableOpacity>

            {/* Maybe later */}
            <TouchableOpacity onPress={() => setShowPaywall(false)}>
              <Text style={[styles.paywallMaybeLater, isLight && styles.paywallMaybeLaterLight]}>
                Maybe later
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1E1E1E',
  },
  scrollContent: {
    paddingBottom: 40,
  },
  levelInfo: {
    backgroundColor: '#2A2D2D',
    marginHorizontal: 20,
    marginTop: 20,
    marginBottom: 16,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.06)',
  },
  levelInfoLight: {
    backgroundColor: '#FFFFFF',
    borderColor: '#E5E7EB',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  levelHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  levelImage: {
    width: 56,
    height: 56,
    marginRight: 16,
  },
  levelDetails: {
    flex: 1,
  },
  levelName: {
    fontSize: 22,
    fontWeight: '600',
    color: '#fff',
    marginBottom: 4,
    fontFamily: 'Ubuntu-Medium',
  },
  levelCefr: {
    fontSize: 14,
    fontWeight: '600',
    letterSpacing: 0.5,
    fontFamily: 'Ubuntu-Medium',
  },
  changeButton: {
    backgroundColor: 'transparent',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1.5,
    borderColor: '#437F76',
  },
  changeButtonLight: {
    borderColor: '#437F76',
    backgroundColor: 'rgba(67, 127, 118, 0.08)',
  },
  changeButtonText: {
    color: '#437F76',
    fontSize: 14,
    fontWeight: '600',
    fontFamily: 'Ubuntu-Medium',
  },
  changeButtonTextLight: {
    color: '#437F76',
  },
  pathContainer: {
    paddingTop: 8,
    paddingBottom: 40,
  },
  nodeWrapper: {
    position: 'relative',
    height: NODE_SIZE + 8,
    marginBottom: 0,
  },
  setBreathingRing: {
    position: 'absolute',
    top: -8,
    left: -12,
    width: NODE_SIZE + 24,
    height: NODE_SIZE + 24,
    borderRadius: (NODE_SIZE + 24) / 2,
  },
  node: {
    width: NODE_SIZE,
    height: NODE_SIZE,
    borderRadius: NODE_SIZE / 2,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'transparent',
  },
  nodeInner: {
    width: NODE_SIZE - 8,
    height: NODE_SIZE - 8,
    borderRadius: (NODE_SIZE - 8) / 2,
    justifyContent: 'center',
    alignItems: 'center',
  },
  // 3D coin edge - darker color that shows at bottom
  coinEdge: {
    position: 'absolute',
    top: 8,
    left: 0,
    width: NODE_SIZE,
    height: NODE_SIZE,
    borderRadius: NODE_SIZE / 2,
    backgroundColor: '#CC7A02', // Darker orange for edge
  },
  coinEdgeActive: {
    backgroundColor: '#CC7A02', // Orange edge for active
  },
  coinEdgeCompleted: {
    backgroundColor: '#3BB8AC', // Darker teal for completed
  },
  coinEdgeLocked: {
    backgroundColor: '#B8B8B8', // Gray edge for locked
  },
  // Main coin face - lighter color on top
  coinFace: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: NODE_SIZE,
    height: NODE_SIZE,
    borderRadius: NODE_SIZE / 2,
    backgroundColor: '#FE9602', // Orange
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: 'rgba(255,255,255,0.3)',
    overflow: 'hidden',
  },
  coinFaceActive: {
    backgroundColor: '#FE9602', // Orange for active
    borderColor: 'rgba(255,255,255,0.4)',
  },
  coinFaceCompleted: {
    backgroundColor: '#4ED9CB', // Light teal for completed
    borderColor: 'rgba(255,255,255,0.3)',
  },
  coinFaceLocked: {
    backgroundColor: '#D4D4D4', // Light gray for locked
    borderColor: 'rgba(255,255,255,0.2)',
  },
  coinReflection: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: '45%',
    borderTopLeftRadius: NODE_SIZE / 2,
    borderTopRightRadius: NODE_SIZE / 2,
    backgroundColor: 'rgba(255,255,255,0.25)',
  },
  coinIcon: {
    width: 48,
    height: 48,
    tintColor: '#FFFFFF',
    shadowColor: '#FFB366',
    shadowOffset: { width: 1, height: 1 },
    shadowOpacity: 0.8,
    shadowRadius: 2,
  },
  coinIconLocked: {
    opacity: 1,
    tintColor: '#888888',
    shadowOpacity: 0,
  },
  premiumBadge: {
    position: 'absolute',
    bottom: -4,
    right: -4,
    backgroundColor: '#FFD700',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: '#B8860B',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 3,
    elevation: 4,
  },
  premiumBadgeText: {
    fontSize: 9,
    fontWeight: '800',
    color: '#5D4E0A',
    fontFamily: 'Feather-Bold',
    letterSpacing: 0.5,
  },
  completedBadge: {
    position: 'absolute',
    bottom: -2,
    right: -2,
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: '#FE9602',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#fff',
  },
  nodeLabel: {
    position: 'absolute',
    top: NODE_SIZE / 2 - 12,
    left: NODE_SIZE + 12,
    width: SCREEN_WIDTH - NODE_SIZE - 80,
  },
  nodeLabelText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FFFFFF',
    fontFamily: 'Ubuntu-Bold',
    marginBottom: 2,
  },
  nodeLabelTextLight: {
    color: '#111827',
  },
  nodeLabelTextLocked: {
    color: '#888',
  },
  nodePreview: {
    fontSize: 12,
    color: '#9CA3AF',
    fontFamily: 'Ubuntu-Regular',
  },
  nodePreviewLight: {
    color: '#6B7280',
  },
  nodePreviewLocked: {
    color: '#666',
  },
  connectorWrapper: {
    height: NODE_SPACING - NODE_SIZE + 12,
    marginTop: -4,
    marginBottom: -4,
  },
  starNode: {
    borderWidth: 4,
  },
  starNodeCompleted: {
    shadowColor: '#FFD700',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.5,
    shadowRadius: 12,
    elevation: 8,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 16,
    color: '#fff',
  },
  // Level Node Styles
  levelNodeWrapper: {
    width: '100%',
    height: LEVEL_NODE_SIZE + 12,
    marginBottom: 20,
    marginTop: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  levelCoinContainer: {
    width: LEVEL_NODE_SIZE + 24,
    height: LEVEL_NODE_SIZE + 12,
    alignItems: 'center',
    justifyContent: 'flex-start',
  },
  levelNodeBreathingRing: {
    position: 'absolute',
    top: -12,
    left: 0,
    width: LEVEL_NODE_SIZE + 24,
    height: LEVEL_NODE_SIZE + 24,
    borderRadius: (LEVEL_NODE_SIZE + 24) / 2,
  },
  // 3D coin edge for level nodes
  levelCoinEdge: {
    position: 'absolute',
    top: 6,
    left: 12,
    width: LEVEL_NODE_SIZE,
    height: LEVEL_NODE_SIZE,
    borderRadius: LEVEL_NODE_SIZE / 2,
    backgroundColor: '#C97830', // Darker orange for edge
  },
  levelCoinEdgeCurrent: {
    backgroundColor: '#C97830', // Orange edge
  },
  levelCoinEdgeCompleted: {
    backgroundColor: '#3BB8AC', // Darker teal
  },
  levelCoinEdgeLocked: {
    backgroundColor: '#A0A0A0', // Gray edge
  },
  // Level coin face
  levelCoinFace: {
    position: 'absolute',
    top: 0,
    left: 12,
    width: LEVEL_NODE_SIZE,
    height: LEVEL_NODE_SIZE,
    borderRadius: LEVEL_NODE_SIZE / 2,
    backgroundColor: '#F8B070', // Orange face
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: 'rgba(255,255,255,0.4)',
  },
  levelCoinFaceCurrent: {
    backgroundColor: '#F8B070', // Orange
  },
  levelCoinFaceCompleted: {
    backgroundColor: '#4ED9CB', // Teal
  },
  levelCoinFaceLocked: {
    backgroundColor: '#C8C8C8', // Gray
    opacity: 0.7,
  },
  levelCoinIcon: {
    width: 58,
    height: 58,
    tintColor: '#FFFFFF',
    shadowColor: '#FFB366',
    shadowOffset: { width: 1, height: 1 },
    shadowOpacity: 0.8,
    shadowRadius: 2,
  },
  levelCoinIconLocked: {
    opacity: 1,
    tintColor: '#888888',
  },
  levelNodeInnerLocked: {
    backgroundColor: '#3A3A3A',
    borderColor: 'rgba(255,255,255,0.1)',
  },
  levelNodeInnerLockedLight: {
    backgroundColor: '#E5E7EB',
    borderColor: 'rgba(0,0,0,0.08)',
  },
  levelNodeIcon: {
    width: 60,
    height: 60,
  },
  levelNodeLabel: {
    position: 'absolute',
    top: LEVEL_NODE_SIZE / 2 - 16,
    left: LEVEL_NODE_SIZE + 12,
    width: SCREEN_WIDTH - LEVEL_NODE_SIZE - 80,
  },
  levelNodeLabelText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
    fontFamily: 'Ubuntu-Bold',
    marginBottom: 2,
  },
  levelNodeLabelTextLight: {
    color: '#111827',
  },
  levelNodeLabelTextLocked: {
    color: '#888',
  },
  levelNodeCefr: {
    fontSize: 13,
    fontWeight: '600',
    fontFamily: 'Ubuntu-Medium',
  },
  levelConnector: {
    height: 40,
    marginBottom: 8,
    width: '100%',
    alignItems: 'center',
  },
  levelConnectorLine: {
    width: 4,
    height: '100%',
    borderRadius: 2,
  },
  levelSetsContainer: {
    paddingTop: 8,
    paddingBottom: 16,
  },
  levelBanner: {
    marginHorizontal: 24,
    marginTop: 20,
    marginBottom: 28,
    borderRadius: 16,
    borderWidth: 3,
    borderColor: '#1A1A1A',
    shadowColor: '#000',
    shadowOffset: { width: 2, height: 3 },
    shadowOpacity: 0.4,
    shadowRadius: 0,
    elevation: 5,
    overflow: 'visible',
  },
  levelBannerLight: {
    borderColor: '#1A1A1A',
  },
  levelBannerEdge: {
    display: 'none',
  },
  levelBannerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8B070',
    paddingVertical: 16,
    paddingHorizontal: 16,
    borderRadius: 13,
  },
  levelBannerIconCircle: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  levelBannerIcon: {
    width: 30,
    height: 30,
    tintColor: '#F8B070',
  },
  levelBannerInfo: {
    flex: 1,
  },
  levelBannerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1A1A1A',
    marginBottom: 2,
    fontFamily: 'Feather-Bold',
  },
  levelBannerSubtitle: {
    fontSize: 13,
    fontWeight: '600',
    color: 'rgba(26,26,26,0.7)',
    fontFamily: 'Ubuntu-Medium',
  },
  levelBannerBadge: {
    backgroundColor: 'rgba(255,255,255,0.5)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  levelBannerBadgeText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#1A1A1A',
    fontFamily: 'Ubuntu-Bold',
  },
  nextLevelButton: {
    marginTop: 16,
    backgroundColor: '#F25E86',
    paddingHorizontal: 24,
    paddingVertical: 14,
    borderRadius: 20,
    borderWidth: 3,
    borderColor: '#1A1A1A',
    shadowColor: '#000',
    shadowOffset: { width: 2, height: 3 },
    shadowOpacity: 0.4,
    shadowRadius: 0,
    elevation: 5,
  },
  nextLevelButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
    textAlign: 'center',
    fontFamily: 'Ubuntu-Bold',
  },
  // Stage Gate Styles
  stageGateContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 20,
    paddingHorizontal: 20,
  },
  stageGateLine: {
    flex: 1,
    height: 3,
    backgroundColor: '#F8B070',
    borderRadius: 2,
  },
  stageGateLineLocked: {
    backgroundColor: '#4A4A4A',
  },
  stageGateBadge: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#F8B070',
    justifyContent: 'center',
    alignItems: 'center',
    marginHorizontal: 12,
    shadowColor: '#F8B070',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 4,
  },
  stageGateBadgeLocked: {
    backgroundColor: '#3A3A3A',
    shadowOpacity: 0,
  },
  stageGateInner: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#2A2D2E',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'rgba(255,215,0,0.3)',
  },
  stageGateInnerLocked: {
    borderColor: 'rgba(255,255,255,0.1)',
  },
  stageGateLabelWrap: {
    position: 'absolute',
    bottom: -20,
    left: 0,
    right: 0,
    alignItems: 'center',
  },
  stageGateLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: '#F8B070',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  stageGateLabelLocked: {
    color: '#666',
  },
  skipAheadLabel: {
    position: 'absolute',
    top: -28,
    left: -24,
    width: 120,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 10,
  },
  skipAheadText: {
    backgroundColor: '#A855F7',
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '700',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 10,
    overflow: 'hidden',
    textTransform: 'uppercase',
    letterSpacing: 0.3,
  },
  skipAheadTextLocked: {
    backgroundColor: '#7C3AED',
  },
  skipAheadTextFailed: {
    backgroundColor: '#F97316',
  },
  catCharacterWrapper: {
    position: 'absolute',
    alignItems: 'center',
    zIndex: 5,
    pointerEvents: 'none',
  },
  // Paywall Modal Styles
  paywallOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  paywallCard: {
    backgroundColor: '#1E1E1E',
    borderRadius: 24,
    padding: 28,
    width: '100%',
    maxWidth: 340,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'rgba(255,215,0,0.2)',
    shadowColor: '#FFD700',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 8,
  },
  paywallCardLight: {
    backgroundColor: '#FFFFFF',
    borderColor: 'rgba(255,215,0,0.3)',
  },
  paywallClose: {
    position: 'absolute',
    top: 16,
    right: 16,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(255,255,255,0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  paywallCloseText: {
    color: '#9CA3AF',
    fontSize: 18,
    fontWeight: '600',
  },
  paywallCrownContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(255,215,0,0.15)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
    borderWidth: 2,
    borderColor: 'rgba(255,215,0,0.3)',
  },
  paywallTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: '#FFFFFF',
    marginBottom: 8,
    fontFamily: 'Feather-Bold',
    textAlign: 'center',
  },
  paywallTitleLight: {
    color: '#111827',
  },
  paywallSubtitle: {
    fontSize: 14,
    color: '#9CA3AF',
    textAlign: 'center',
    marginBottom: 20,
    lineHeight: 20,
    fontFamily: 'Feather-Bold',
  },
  paywallSubtitleLight: {
    color: '#6B7280',
  },
  paywallFeatures: {
    width: '100%',
    marginBottom: 24,
  },
  paywallFeatureRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    gap: 12,
  },
  paywallFeatureText: {
    fontSize: 14,
    color: '#E5E7EB',
    fontFamily: 'Feather-Bold',
  },
  paywallFeatureTextLight: {
    color: '#374151',
  },
  paywallCta: {
    width: '100%',
    backgroundColor: '#FFD700',
    paddingVertical: 16,
    borderRadius: 14,
    alignItems: 'center',
    marginBottom: 12,
    borderWidth: 2,
    borderColor: '#B8860B',
    shadowColor: '#FFD700',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.4,
    shadowRadius: 6,
  },
  paywallCtaText: {
    fontSize: 16,
    fontWeight: '800',
    color: '#5D4E0A',
    fontFamily: 'Feather-Bold',
  },
  paywallMaybeLater: {
    fontSize: 14,
    color: '#6B7280',
    fontFamily: 'Feather-Bold',
    marginTop: 4,
  },
  paywallMaybeLaterLight: {
    color: '#9CA3AF',
  },
});

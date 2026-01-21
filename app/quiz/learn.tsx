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
import StarField from './components/StarField';

const SELECTED_LEVEL_KEY = '@engniter.selectedLevel';
const HIGHEST_LEVEL_KEY = '@engniter.highestLevel';
const PLACEMENT_LEVEL_KEY = '@engniter.placementLevel';
const UNLOCK_ALL_SETS = false;
const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');
const PLANET_SIZE = 130; // Normal planet size
const PLANET_SIZE_SELECTED = 145; // Slightly larger when selected (subtle magnifying)
const NODE_SIZE = 72; // Keep for compatibility
const NODE_SPACING = 100; // Vertical spacing (kept for compatibility)
const NODE_SPACING_H = 200; // Horizontal spacing between planets
const LEVEL_NODE_SIZE = 80;

// Space theme colors
const SPACE_BG = '#1A2744';
const SPACE_BG_LIGHT = '#243B5C';

// Planet Lottie sources mapping - use ALL available planets for variety
const PLANET_SOURCES = {
  colorful: require('../../assets/lottie/learn/planets/colorful_planet.json'),
  orange: require('../../assets/lottie/learn/planets/planet_orange.json'),
  moon: require('../../assets/lottie/learn/planets/moon_grey.json'),
  darkPurple: require('../../assets/lottie/learn/planets/dark_purple_planet.json'),
  purple: require('../../assets/lottie/learn/planets/planet_purple.json'),
  blue: require('../../assets/lottie/learn/planets/planet_blue.json'),
  green: require('../../assets/lottie/learn/planets/planet_green.json'),
  red: require('../../assets/lottie/learn/planets/RedPlanet.lottie'),
  astronaut: require('../../assets/lottie/learn/planets/astronaut_complete.json'),
  satellite: require('../../assets/lottie/learn/planets/satellite.json'),
  spacecraft: require('../../assets/lottie/learn/planets/space_craft.json'),
  checkpoint: require('../../assets/lottie/learn/planets/check_point_forquiz.json'),
};

// Planet type rotation for variety - only actual planets
const PLANET_TYPES = [
  'colorful',
  'orange',
  'moon',
  'darkPurple',
  'purple',
  'blue',
  'green',
  'red',
] as const;
type PlanetType = typeof PLANET_TYPES[number] | 'checkpoint';

// Get planet type based on index for visual variety
const getPlanetType = (index: number, isQuiz: boolean, title: string): PlanetType => {
  // Use checkpoint animation for quiz nodes
  if (isQuiz) return 'checkpoint';
  // Rotate through ALL planet types for maximum variety
  return PLANET_TYPES[index % PLANET_TYPES.length];
};

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
  const [centeredPlanetIndex, setCenteredPlanetIndex] = useState<number>(0);
  const planetScaleAnims = useRef<Animated.Value[]>([]);

  // Premium status for gating content
  const [isPremium, setIsPremium] = useState<boolean>(false);
  const [showPaywall, setShowPaywall] = useState<boolean>(false);

  // Ensure nav bar is visible when this screen is shown
  useEffect(() => {
    DeviceEventEmitter.emit('NAV_VISIBILITY', 'show');
  }, []);

  // Listen for set completion events to refresh immediately
  useEffect(() => {
    const subscription = DeviceEventEmitter.addListener('SET_COMPLETED', () => {
      refreshLevel();
    });
    return () => subscription.remove();
  }, [refreshLevel]);

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
        const isQuizSet = (set as any).type === 'quiz';
        const baseSet = {
          ...set,
          completed: typeof flags.completed === 'boolean' ? flags.completed : !!set.completed,
          inProgress: typeof flags.inProgress === 'boolean' ? flags.inProgress : !!set.inProgress,
          score: typeof flags.score === 'number' ? flags.score : set.score,
        };

        if (UNLOCK_ALL_SETS) {
          return { ...baseSet, locked: false, premiumLocked: false } as any;
        }

        // First set is always unlocked for everyone
        if (index === 0) {
          return { ...baseSet, locked: false, premiumLocked: false };
        }

        // For free users: only the first set is available, rest are premium locked
        if (!isPremium) {
          return { ...baseSet, locked: true, premiumLocked: true };
        }

        // --- Premium users below ---

        // Check if previous set is completed
        const prevSet = withQuizzes[index - 1];
        const prevFlags = SetProgressService.getSetFlags(activeLevelId, prevSet.id);
        const prevCompleted = prevFlags.completed === true;

        // For regular sets: unlock only if previous set is completed
        if (!isQuizSet) {
          return { ...baseSet, locked: !prevCompleted, premiumLocked: false };
        }

        // For quiz sets: locked by default, but can be tapped for skip-ahead
        // The skip-ahead logic is handled in canQuizSkipAhead and handleSetPress
        // Quiz is unlocked if all 4 sets before it are completed
        const quizNumber = parseInt(String(set.id).replace('quiz-', ''), 10);
        if (!isNaN(quizNumber)) {
          // Find the 4 sets this quiz covers (sets at indices: (quizNumber-1)*5 to (quizNumber-1)*5+3)
          // Note: quizzes are inserted after every 4 sets, so quiz-1 is at index 4, quiz-2 at index 9, etc.
          const quizIdx = index;
          const setsBeforeQuiz = withQuizzes.slice(quizIdx - 4, quizIdx).filter(s => (s as any).type !== 'quiz');
          const allSetsCompleted = setsBeforeQuiz.every(s => {
            const sFlags = SetProgressService.getSetFlags(activeLevelId, s.id);
            return sFlags.completed === true;
          });
          return { ...baseSet, locked: !allSetsCompleted, premiumLocked: false };
        }

        // Fallback: check previous set
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
      // Refresh immediately on focus - don't wait for InteractionManager
      refreshLevel();
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
  // Skip ahead allows jumping to a quiz without completing the 4 sets before it
  // But only if the PREVIOUS quiz is completed (or it's the first quiz)
  const canQuizSkipAhead = useCallback((quizSet: VocabSet, allSets: VocabSet[]) => {
    if (!activeLevelId) return false;

    // Find all quizzes in the current level
    const quizzes = allSets.filter(s => (s as any).type === 'quiz');
    const quizIndex = quizzes.findIndex(q => q.id === quizSet.id);

    if (quizIndex < 0) return false;

    // For the first quiz in a level, skip ahead is always available (no previous quiz to check)
    if (quizIndex === 0) {
      return true;
    }

    // For subsequent quizzes, check if the IMMEDIATELY PREVIOUS quiz is completed
    const prevQuiz = quizzes[quizIndex - 1];
    const flags = SetProgressService.getSetFlags(activeLevelId, prevQuiz.id);
    return flags.completed === true;
  }, [activeLevelId]);

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

  // Vertical scrolling with winding left-right path like the screenshots
  const getNodePosition = (index: number): 'left' | 'right' => {
    // Simple alternating left-right pattern
    return index % 2 === 0 ? 'left' : 'right';
  };

  const getNodeOffset = (position: 'left' | 'right'): number => {
    // Position planets on left or right side of screen
    switch (position) {
      case 'left': return SCREEN_WIDTH * 0.3; // 30% from left
      case 'right': return SCREEN_WIDTH * 0.7; // 70% from left
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

  // Track last centered planet for haptic feedback
  const lastCenteredPlanet = useRef<number>(-1);
  const HORIZONTAL_SPACING = 280; // Must match buildCurrentLevelPath - more space between planets

  // Ref to track pending state update
  const pendingCenteredUpdate = useRef<NodeJS.Timeout | null>(null);

  // Scroll handler to detect centered planet - debounced to reduce re-renders
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

    const scrollX = event.nativeEvent.contentOffset.x;
    const viewportWidth = event.nativeEvent.layoutMeasurement.width;
    const viewportCenter = scrollX + viewportWidth / 2;

    // Calculate which planet is centered based on scroll position
    const planetIndex = Math.round((viewportCenter - 60 - PLANET_SIZE / 2 - 20) / HORIZONTAL_SPACING);
    const clampedIndex = Math.max(0, Math.min(planetIndex, (currentLevel?.sets.length || 1) - 1));

    // Update ref immediately for haptic feedback
    if (clampedIndex !== lastCenteredPlanet.current) {
      lastCenteredPlanet.current = clampedIndex;
      triggerHaptic('light');

      // Debounce state update to reduce re-renders during fast scrolling
      if (pendingCenteredUpdate.current) {
        clearTimeout(pendingCenteredUpdate.current);
      }
      pendingCenteredUpdate.current = setTimeout(() => {
        setCenteredPlanetIndex(clampedIndex);
        pendingCenteredUpdate.current = null;
      }, 50);
    }
  }, [triggerHaptic, currentLevel?.sets.length]);

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
      // Taller connectors for planets
      const connectorHeight = NODE_SPACING - 40;
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

  const renderPlanetNode = (set: VocabSet & { locked?: boolean; premiumLocked?: boolean }, index: number, isCurrentLevel: boolean, allSets: VocabSet[]) => {
    const isLocked = set.locked;
    const isCompleted = set.completed;
    const isQuiz = (set as any).type === 'quiz';
    const isCurrent = isCurrentLevel && index === currentSetIndex;
    const isCentered = index === centeredPlanetIndex; // Magnifying effect
    const quizCanSkipAhead = isPremium && isQuiz && isLocked && canQuizSkipAhead(set, allSets);

    const anim = nodeAnims.current[index] || new Animated.Value(1);
    const baseScale = anim.interpolate({ inputRange: [0, 1], outputRange: [0.5, 1] });
    const opacity = anim.interpolate({ inputRange: [0, 1], outputRange: [0, 1] });

    // Magnifying effect - subtle scale increase for centered planet
    const magnifyScale = isCentered ? 1.08 : 1;
    const planetSize = PLANET_SIZE; // Keep same size, just scale

    // Get planet type for this node
    const planetType = getPlanetType(index, isQuiz, set.title);
    const planetSource = PLANET_SOURCES[planetType] || PLANET_SOURCES.colorful;

    // Clean title for display
    const displayTitle = isQuiz ? `Quiz ${set.title.replace('Quiz ', '')}` : cleanTitle(set.title);

    // Sparkle positions - CIRCULAR pattern around planet center
    // Planet center is at (planetSize/2, planetSize/2) = (65, 65)
    // Planet radius is 65, so sparkles at radius 70-95 for circular halo
    const center = planetSize / 2;
    const generateCircularSparkles = () => {
      const sparkles: Array<{x: number; y: number; size: number; type: string; color: string}> = [];

      // Inner ring - close to planet (radius ~68-75)
      const innerAngles = [0, 35, 70, 105, 140, 175, 210, 245, 280, 315];
      innerAngles.forEach((deg, i) => {
        const rad = (deg * Math.PI) / 180;
        const radius = 68 + (i % 3) * 3;
        sparkles.push({
          x: center + Math.cos(rad) * radius - 3,
          y: center + Math.sin(rad) * radius - 3,
          size: 5 + (i % 2),
          type: 'star',
          color: '#FFD700',
        });
      });

      // Outer ring - further out (radius ~85-100)
      const outerAngles = [20, 55, 90, 125, 160, 195, 230, 265, 300, 335];
      outerAngles.forEach((deg, i) => {
        const rad = (deg * Math.PI) / 180;
        const radius = 88 + (i % 4) * 4;
        sparkles.push({
          x: center + Math.cos(rad) * radius - 3,
          y: center + Math.sin(rad) * radius - 3,
          size: 6 + (i % 2),
          type: 'star',
          color: '#FFD700',
        });
      });

      // Scattered white dots (small, at various radii)
      const dotAngles = [15, 75, 135, 195, 255, 315];
      dotAngles.forEach((deg, i) => {
        const rad = (deg * Math.PI) / 180;
        const radius = 72 + (i % 3) * 12;
        sparkles.push({
          x: center + Math.cos(rad) * radius - 1,
          y: center + Math.sin(rad) * radius - 1,
          size: 2 + (i % 2),
          type: 'dot',
          color: '#FFFFFF',
        });
      });

      return sparkles;
    };
    const sparkleData = generateCircularSparkles();

    const wrapperWidth = planetSize + 40;

    return (
      <Animated.View
        key={`planet-${set.id}-${index}`}
        style={[
          styles.planetWrapperH,
          {
            transform: [{ scale: baseScale }],
            opacity,
            width: wrapperWidth,
          },
        ]}
      >

        {/* Title label ABOVE planet - centered over the planet */}
        <View style={[styles.planetLabelContainerH, { width: planetSize + 80, left: 20 + planetSize / 2 - (planetSize + 80) / 2 }]}>
          <Text style={[
            styles.planetLabel,
            isLocked && !quizCanSkipAhead && styles.planetLabelLocked,
            isCentered && styles.planetLabelCentered,
          ]} numberOfLines={2}>
            {displayTitle}
          </Text>
          {/* "For you" badge for current/available nodes */}
          {isCurrent && !isCompleted && (
            <View style={styles.forYouBadge}>
              <Text style={styles.forYouText}>For you</Text>
            </View>
          )}
        </View>

        {/* UFO/Spacecraft for current node */}
        {isCurrent && !isCompleted && (
          <View style={[styles.spacecraftContainerH, { left: wrapperWidth / 2 - 35 }]}>
            <LottieView
              source={PLANET_SOURCES.spacecraft}
              autoPlay
              loop
              style={styles.spacecraft}
            />
          </View>
        )}

        {/* Planet touchable area with magnifying effect */}
        <TouchableOpacity
          onPress={() => handleSetPress(set, allSets)}
          disabled={isLocked && (!isQuiz || !quizCanSkipAhead)}
          activeOpacity={0.9}
          style={[styles.planetTouchableH, {
            width: planetSize,
            height: planetSize,
            marginLeft: 20,
            transform: [{ scale: magnifyScale }],
            overflow: 'visible',
          }]}
        >
          {/* Sparkling stars around centered planet - positioned relative to planet */}
          {isCentered && (
            <View style={{ position: 'absolute', top: 0, left: 0, width: planetSize, height: planetSize, zIndex: 100, overflow: 'visible' }} pointerEvents="none">
              {sparkleData.map((sparkle, i) => {
                const animatedOpacity = levelPulseOpacity.interpolate({
                  inputRange: [0.2, 0.5],
                  outputRange: i % 2 === 0 ? [0.3, 1] : [1, 0.3],
                });
                const animatedScale = levelPulseAnim.interpolate({
                  inputRange: [1, 1.08],
                  outputRange: i % 3 === 0 ? [0.8, 1.2] : [1, 0.9],
                });

                if (sparkle.type === 'star') {
                  // 4-pointed star using two crossing rectangles
                  return (
                    <Animated.View
                      key={`sparkle-${i}`}
                      style={{
                        position: 'absolute',
                        left: sparkle.x,
                        top: sparkle.y,
                        width: sparkle.size,
                        height: sparkle.size,
                        opacity: animatedOpacity,
                        transform: [{ scale: animatedScale }],
                      }}
                    >
                      {/* Vertical bar */}
                      <View style={{
                        position: 'absolute',
                        left: sparkle.size / 2 - 1.5,
                        top: 0,
                        width: 3,
                        height: sparkle.size,
                        backgroundColor: sparkle.color,
                        borderRadius: 1.5,
                      }} />
                      {/* Horizontal bar */}
                      <View style={{
                        position: 'absolute',
                        left: 0,
                        top: sparkle.size / 2 - 1.5,
                        width: sparkle.size,
                        height: 3,
                        backgroundColor: sparkle.color,
                        borderRadius: 1.5,
                      }} />
                      {/* Diagonal bar 1 */}
                      <View style={{
                        position: 'absolute',
                        left: sparkle.size / 2 - 1,
                        top: sparkle.size * 0.15,
                        width: 2,
                        height: sparkle.size * 0.7,
                        backgroundColor: sparkle.color,
                        borderRadius: 1,
                        transform: [{ rotate: '45deg' }],
                      }} />
                      {/* Diagonal bar 2 */}
                      <View style={{
                        position: 'absolute',
                        left: sparkle.size / 2 - 1,
                        top: sparkle.size * 0.15,
                        width: 2,
                        height: sparkle.size * 0.7,
                        backgroundColor: sparkle.color,
                        borderRadius: 1,
                        transform: [{ rotate: '-45deg' }],
                      }} />
                    </Animated.View>
                  );
                } else {
                  // Small circular dot
                  return (
                    <Animated.View
                      key={`sparkle-${i}`}
                      style={[
                        styles.sparkle,
                        {
                          left: sparkle.x,
                          top: sparkle.y,
                          width: sparkle.size,
                          height: sparkle.size,
                          borderRadius: sparkle.size / 2,
                          backgroundColor: sparkle.color,
                          opacity: animatedOpacity,
                          transform: [{ scale: animatedScale }],
                        },
                      ]}
                    />
                  );
                }
              })}
            </View>
          )}

          {/* Planet Lottie - only centered planet animates */}
          <LottieView
            source={planetSource}
            autoPlay={isCentered}
            loop={isCentered}
            style={[
              { width: planetSize, height: planetSize },
              (isLocked && !quizCanSkipAhead) && styles.planetLocked,
            ]}
          />

          {/* Flag on completed planets */}
          {isCompleted && (
            <View style={[styles.flagContainerH, { left: planetSize / 2 - 5 }]}>
              <View style={styles.flagPoleH} />
              <View style={styles.flagBannerH}>
                <View style={styles.flagTriangleH} />
              </View>
            </View>
          )}
        </TouchableOpacity>
      </Animated.View>
    );
  };

  // Curved connector between planets - smooth S-curve dashed line
  const renderCurvedConnector = (x1: number, y1: number, x2: number, y2: number) => {
    // Space theme: subtle grey dashed lines
    const lineColor = 'rgba(150, 160, 180, 0.25)';

    // Create smooth bezier curve
    // Control points offset to create natural S-curve flow
    const dx = x2 - x1;
    const dy = y2 - y1;

    // For diagonal paths, use control points that curve smoothly
    const cp1x = x1 + dx * 0.4;
    const cp1y = y1;
    const cp2x = x2 - dx * 0.4;
    const cp2y = y2;

    const pathD = `M ${x1} ${y1} C ${cp1x} ${cp1y}, ${cp2x} ${cp2y}, ${x2} ${y2}`;

    return (
      <Svg style={{ position: 'absolute', top: 0, left: 0 }} height="100%" width="100%" pointerEvents="none">
        <Path
          d={pathD}
          stroke={lineColor}
          strokeWidth={2}
          strokeDasharray="8,6"
          fill="none"
          strokeLinecap="round"
        />
      </Svg>
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

  // Build the path for current level only - DIAGONAL WINDING S-CURVE
  const buildCurrentLevelPath = () => {
    if (!currentLevel) return null;

    const setsToRender = currentLevel.sets;
    const spacing = HORIZONTAL_SPACING; // Use constant from scroll handler
    const totalWidth = setsToRender.length * spacing + 200;
    const pathHeight = SCREEN_HEIGHT - 200;

    // Calculate position for diagonal winding S-curve path
    const getPosition = (index: number): { x: number; y: number } => {
      const x = index * spacing + 60;
      // S-curve: alternates between going down and up diagonally
      const phase = (index % 4); // 4-node cycle for S-curve
      let y;

      if (phase === 0) {
        y = 80; // Top position (moved down)
      } else if (phase === 1) {
        y = 200; // Going down
      } else if (phase === 2) {
        y = 320; // Bottom position
      } else {
        y = 200; // Going back up
      }

      return { x, y };
    };

    // Offset for planet center within wrapper
    const wrapperOffset = 20 + PLANET_SIZE / 2;

    return (
      <View style={[styles.planetPathContainerH, { width: totalWidth, height: pathHeight }]}>
        {/* Render connectors first (behind planets) */}
        {setsToRender.map((set, index) => {
          if (index >= setsToRender.length - 1) return null;
          const current = getPosition(index);
          const next = getPosition(index + 1);
          const currentX = current.x + wrapperOffset;
          const nextX = next.x + wrapperOffset;
          const currentY = current.y + PLANET_SIZE / 2 + 55; // Account for label height
          const nextY = next.y + PLANET_SIZE / 2 + 55;

          return (
            <View
              key={`connector-${index}`}
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                width: totalWidth,
                height: pathHeight,
                zIndex: 1,
              }}
              pointerEvents="none"
            >
              {renderCurvedConnector(currentX, currentY, nextX, nextY)}
            </View>
          );
        })}
        {/* Planet nodes */}
        {setsToRender.map((set, index) => {
          const pos = getPosition(index);
          return (
            <View
              key={`planet-container-${index}`}
              style={{
                position: 'absolute',
                top: pos.y,
                left: pos.x,
                zIndex: 10,
              }}
            >
              {renderPlanetNode(set as any, index, true, setsToRender)}
            </View>
          );
        })}
      </View>
    );
  };

  // Find the current set for the Start/Practice Again button
  const currentSet = currentLevel?.sets.find(s => !s.completed && !s.locked);
  const allCompleted = currentLevel && currentLevel.sets.every(s => s.completed);

  return (
    <View style={[styles.container, { backgroundColor: SPACE_BG }]}>
      {/* Space background with stars */}
      <StarField />

      {/* Top status panel */}
      <TopStatusPanel floating includeTopInset />

      {/* Main HORIZONTAL scrollable content */}
      <ScrollView
        ref={scrollViewRef}
        style={styles.horizontalScrollContainer}
        contentContainerStyle={styles.horizontalScrollContent}
        horizontal={true}
        showsHorizontalScrollIndicator={false}
        onScroll={handleScroll}
        scrollEventThrottle={32}
        removeClippedSubviews={true}
        decelerationRate="fast"
      >
        {/* Planet path */}
        {buildCurrentLevelPath()}
      </ScrollView>

      {/* Start / Practice Again button at bottom */}
      {currentLevel && (
        <View style={styles.bottomButtonContainer}>
          <TouchableOpacity
            style={styles.startButton}
            onPress={() => {
              if (currentSet) {
                handleSetPress(currentSet as any, currentLevel.sets);
              }
            }}
            activeOpacity={0.9}
          >
            <Text style={styles.startButtonText}>
              {allCompleted ? 'Practice Again' : 'Start'}
            </Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Alien spaceship FAB */}
      <TouchableOpacity style={styles.alienFab} activeOpacity={0.9}>
        <View style={styles.alienFabInner}>
          <Text style={styles.alienFabEmoji}>🛸</Text>
        </View>
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
  // Horizontal scroll styles
  horizontalScrollContainer: {
    flex: 1,
    marginTop: 100, // Space for top panel
  },
  horizontalScrollContent: {
    paddingHorizontal: 20,
  },
  planetPathContainerH: {
    position: 'relative',
  },
  planetWrapperH: {
    position: 'absolute',
    width: PLANET_SIZE,
    height: PLANET_SIZE + 60,
  },
  planetLabelContainerH: {
    position: 'absolute',
    top: -50,
    left: -30,
    right: -30,
    alignItems: 'center',
    zIndex: 10,
  },
  spacecraftContainerH: {
    position: 'absolute',
    top: -30,
    left: PLANET_SIZE / 2 - 40,
    width: 80,
    height: 80,
    zIndex: 20,
  },
  planetTouchableH: {
    width: PLANET_SIZE,
    height: PLANET_SIZE,
    justifyContent: 'center',
    alignItems: 'center',
  },
  flagContainerH: {
    position: 'absolute',
    top: 5,
    left: PLANET_SIZE / 2 - 5,
    alignItems: 'center',
  },
  flagPoleH: {
    width: 3,
    height: 35,
    backgroundColor: '#D4A574',
    borderRadius: 1,
  },
  flagBannerH: {
    position: 'absolute',
    top: 2,
    left: 3,
  },
  flagTriangleH: {
    width: 0,
    height: 0,
    backgroundColor: 'transparent',
    borderStyle: 'solid',
    borderLeftWidth: 18,
    borderTopWidth: 12,
    borderBottomWidth: 12,
    borderLeftColor: '#4ED9CB',
    borderTopColor: 'transparent',
    borderBottomColor: 'transparent',
  },
  sparkleContainerH: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: PLANET_SIZE,
    height: PLANET_SIZE + 60,
    zIndex: 5,
    pointerEvents: 'none',
  },
  // Keep old vertical styles for compatibility
  scrollContentSpace: {
    paddingBottom: 40,
  },
  planetPathContainer: {
    paddingTop: 30,
    paddingBottom: 60,
  },
  planetWrapper: {
    position: 'relative',
    height: PLANET_SIZE + 60,
    marginBottom: 30,
  },
  planetLabelContainer: {
    position: 'absolute',
    top: 0,
    left: -40,
    right: -40,
    alignItems: 'center',
    zIndex: 10,
  },
  planetLabel: {
    fontSize: 16,
    fontWeight: '700',
    color: 'rgba(255,255,255,0.7)',
    fontFamily: 'Feather-Bold',
    textAlign: 'center',
    textShadowColor: 'rgba(0,0,0,0.5)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 3,
  },
  planetLabelLocked: {
    color: 'rgba(255,255,255,0.3)',
  },
  planetLabelCentered: {
    fontSize: 20,
    color: '#FFFFFF',
  },
  forYouBadge: {
    backgroundColor: '#F8B070',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
    marginTop: 6,
  },
  forYouText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#1A1A1A',
    fontFamily: 'Ubuntu-Bold',
  },
  spacecraftContainer: {
    position: 'absolute',
    top: 20,
    left: PLANET_SIZE / 2 - 40,
    width: 80,
    height: 80,
    zIndex: 20,
  },
  spacecraft: {
    width: 80,
    height: 80,
  },
  planetTouchable: {
    width: PLANET_SIZE,
    height: PLANET_SIZE,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 40, // Space for label
  },
  planetLottie: {
    width: PLANET_SIZE,
    height: PLANET_SIZE,
  },
  planetLocked: {
    opacity: 0.4,
  },
  flagContainer: {
    position: 'absolute',
    top: 10,
    left: PLANET_SIZE / 2 - 5,
    alignItems: 'center',
  },
  flagPole: {
    width: 3,
    height: 30,
    backgroundColor: '#D4A574',
    borderRadius: 1,
  },
  flagBanner: {
    position: 'absolute',
    top: 2,
    left: 3,
  },
  flagTriangle: {
    width: 0,
    height: 0,
    backgroundColor: 'transparent',
    borderStyle: 'solid',
    borderLeftWidth: 16,
    borderTopWidth: 10,
    borderBottomWidth: 10,
    borderLeftColor: '#4ED9CB',
    borderTopColor: 'transparent',
    borderBottomColor: 'transparent',
  },
  lockOverlay: {
    position: 'absolute',
    top: PLANET_SIZE / 2 - 16,
    left: PLANET_SIZE / 2 - 16,
    width: 32,
    height: 32,
    justifyContent: 'center',
    alignItems: 'center',
  },
  premiumBadgePlanet: {
    position: 'absolute',
    bottom: 40,
    right: 10,
    backgroundColor: '#FFD700',
    width: 28,
    height: 28,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#B8860B',
  },
  connectorWrapperPlanet: {
    height: NODE_SPACING - 40,
    marginTop: -20,
    marginBottom: -20,
  },
  bottomButtonContainer: {
    position: 'absolute',
    bottom: 100,
    left: 0,
    right: 0,
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  startButton: {
    backgroundColor: '#4ED9CB',
    paddingVertical: 18,
    paddingHorizontal: 60,
    borderRadius: 30,
    shadowColor: '#4ED9CB',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 6,
  },
  startButtonText: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1A1A1A',
    fontFamily: 'Feather-Bold',
  },
  alienFab: {
    position: 'absolute',
    bottom: 110,
    right: 20,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#1A2744',
    borderWidth: 2,
    borderColor: 'rgba(78,217,203,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#4ED9CB',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 4,
  },
  alienFabInner: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#243B5C',
    justifyContent: 'center',
    alignItems: 'center',
  },
  alienFabEmoji: {
    fontSize: 24,
  },
  // Keep old styles for compatibility
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
  // Vertical scroll styles
  verticalScrollContainer: {
    flex: 1,
    marginTop: 100, // Space for top panel
  },
  verticalScrollContent: {
    paddingTop: 40,
    paddingBottom: 200, // Space for bottom button
    alignItems: 'center',
  },
  // Vertical planet path
  planetPathContainerV: {
    width: SCREEN_WIDTH,
    position: 'relative',
  },
  planetWrapperV: {
    position: 'relative',
    width: PLANET_SIZE,
    height: PLANET_SIZE + 80, // Extra space for label above
    marginBottom: 80, // Vertical spacing between planets
  },
  planetLabelContainerV: {
    alignItems: 'center',
    marginBottom: 8,
    height: 50,
    justifyContent: 'flex-end',
  },
  spacecraftContainerV: {
    position: 'absolute',
    top: 30,
    left: PLANET_SIZE / 2 - 40,
    width: 80,
    height: 80,
    zIndex: 20,
  },
  planetTouchableV: {
    width: PLANET_SIZE,
    height: PLANET_SIZE,
    justifyContent: 'center',
    alignItems: 'center',
  },
  flagContainerV: {
    position: 'absolute',
    top: 55,
    left: PLANET_SIZE / 2 - 5,
    alignItems: 'center',
  },
  flagPoleV: {
    width: 3,
    height: 35,
    backgroundColor: '#D4A574',
    borderRadius: 1,
  },
  flagBannerV: {
    position: 'absolute',
    top: 2,
    left: 3,
  },
  flagTriangleV: {
    width: 0,
    height: 0,
    backgroundColor: 'transparent',
    borderStyle: 'solid',
    borderLeftWidth: 18,
    borderTopWidth: 12,
    borderBottomWidth: 12,
    borderLeftColor: '#4ED9CB',
    borderTopColor: 'transparent',
    borderBottomColor: 'transparent',
  },
  sparkleContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: PLANET_SIZE,
    height: PLANET_SIZE + 80,
    zIndex: 5,
    pointerEvents: 'none',
  },
  sparkle: {
    position: 'absolute',
    backgroundColor: '#FFFFFF',
    borderRadius: 10,
    shadowColor: '#FFFFFF',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 1,
    shadowRadius: 4,
  },
  connectorWrapperV: {
    position: 'absolute',
    top: PLANET_SIZE + 30, // After planet
    left: 0,
    width: SCREEN_WIDTH,
    zIndex: 1,
    pointerEvents: 'none',
  },
});

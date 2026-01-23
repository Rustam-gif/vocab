import React, { useState, useEffect, useLayoutEffect, useCallback, useRef, useMemo, memo } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, SafeAreaView, Image, Animated, Easing, InteractionManager, Dimensions, DeviceEventEmitter, Platform, Modal } from 'react-native';

// Use local haptic feedback shim (no-op since native module not available)
import ReactNativeHapticFeedback from '../../lib/haptics';
import { useRouter, useLocalSearchParams, useRouteKey } from 'expo-router';
import { useNavigation } from '@react-navigation/native';
import LottieView from 'lottie-react-native';
import { levels, getOrderedSetsForLevel } from './data/levels';
import type { Level, Set as VocabSet, SetCategory } from './data/levels';
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
const USER_FOCUS_KEY = '@engniter.onboarding.focus';
const UNLOCK_ALL_SETS = false;
const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');
const PLANET_SIZE = 130; // Normal planet size
const PLANET_SIZE_SELECTED = 145; // Slightly larger when selected (subtle magnifying)
const NODE_SIZE = 72; // Keep for compatibility
const NODE_SPACING = 100; // Vertical spacing (kept for compatibility)
const NODE_SPACING_H = 200; // Horizontal spacing between planets
const HORIZONTAL_SPACING = 280; // Space between planets in horizontal scroll
const LEVEL_NODE_SIZE = 80;

// Track animated set IDs at module level to persist across component mounts
const animatedSetIds = new Set<string>();

// Cache currentLevel at module level to show instantly when switching tabs
let cachedCurrentLevel: Level | null = null;
let cachedLevelId: string | null = null;
let cachedUserFocus: string | null = null; // Track which userFocus the cache was built with
// Cache the current planet index to avoid flash on tab switch
let cachedCurrentPlanetIndex: number = 0;
// Track if we've loaded the cached index from storage
let hasLoadedCachedIndex: boolean = false;

// Cache premium status and user focus for instant access on mount (prevents flickering)
let cachedIsPremium: boolean = false;
let hasLoadedPremiumCache: boolean = false;

// ========== MODULE-LEVEL SCROLL CONTROL FLAGS ==========
// These MUST be at module level because Learn unmounts on tab switch!
// If these were component refs, they'd reset on every mount.
let moduleLayoutReady: boolean = false;
let moduleInitialScrollDone: boolean = false;
let moduleScrollLocked: boolean = false;
// Track the last mounted instance ID to detect remounts
let lastMountId: number = 0;

// Key for persisting current planet index
const CURRENT_PLANET_INDEX_KEY = '@engniter.currentPlanetIndex';

// Function to clear all module-level caches (called on sign-out)
export function clearLearnScreenCache() {
  cachedCurrentLevel = null;
  cachedLevelId = null;
  cachedUserFocus = null;
  cachedCurrentPlanetIndex = 0;
  cachedIsPremium = false;
  hasLoadedCachedIndex = false;
  hasLoadedPremiumCache = false;
  moduleLayoutReady = false;
  moduleInitialScrollDone = false;
  moduleScrollLocked = false;
  animatedSetIds.clear();
}

// Space theme colors
const SPACE_BG = '#1A2744';
const SPACE_BG_LIGHT = '#243B5C';

// Lazy-load planet sources only when needed (memory optimization)
// Instead of loading all at module level, we load on demand
const getPlanetSource = (type: string) => {
  switch (type) {
    case 'colorful': return require('../../assets/lottie/learn/planets/colorful_planet.json');
    case 'orange': return require('../../assets/lottie/learn/planets/planet_orange.json');
    case 'darkPurple': return require('../../assets/lottie/learn/planets/dark_purple_planet.json');
    case 'purple': return require('../../assets/lottie/learn/planets/planet_purple.json');
    case 'blue': return require('../../assets/lottie/learn/planets/planet_blue.json');
    case 'red': return require('../../assets/lottie/learn/planets/RedPlanet.lottie');
    case 'checkpoint': return require('../../assets/lottie/learn/planets/check_point_forquiz.json');
    default: return require('../../assets/lottie/learn/planets/colorful_planet.json');
  }
};

// Keep spacecraft separate as it's always needed for current planet
const SPACECRAFT_SOURCE = require('../../assets/lottie/learn/planets/space_craft.json');

// Planet type rotation for variety - using smaller Lottie files for memory optimization
// Excluded: green (1MB), moon (349KB) - using smaller files only
const PLANET_TYPES = [
  'colorful',  // 83KB
  'orange',    // 132KB
  'purple',    // 105KB
  'blue',      // 42KB
  'red',       // 22KB
  'darkPurple', // 120KB
] as const;
type PlanetType = typeof PLANET_TYPES[number] | 'checkpoint';

// Simple colors for static planet circles (when not using Lottie)
const PLANET_COLORS: Record<string, string[]> = {
  colorful: ['#FF6B6B', '#4ECDC4'],
  orange: ['#FF9F43', '#EE5A24'],
  moon: ['#A0A0A0', '#707070'],
  darkPurple: ['#6C5CE7', '#4A3F9F'],
  purple: ['#A55EEA', '#8854D0'],
  blue: ['#54A0FF', '#2E86DE'],
  green: ['#26DE81', '#20BF6B'],
  red: ['#FF6B6B', '#EE5253'],
  checkpoint: ['#FFD700', '#FFA500'],
};

// Pre-computed sparkle positions for centered planet (memory optimization)
// Only computed once at module load instead of every render
const SPARKLE_DATA = (() => {
  const center = PLANET_SIZE / 2;
  const sparkles: Array<{x: number; y: number; size: number; type: 'star' | 'dot'; color: string}> = [];

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
})();

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

// Memoized static planet component for non-centered planets (memory optimization)
const StaticPlanet = memo(({
  planetType,
  planetSize,
  isLocked
}: {
  planetType: string;
  planetSize: number;
  isLocked: boolean;
}) => (
  <View
    style={[
      {
        width: planetSize,
        height: planetSize,
        borderRadius: planetSize / 2,
        backgroundColor: PLANET_COLORS[planetType]?.[0] || '#4ECDC4',
        justifyContent: 'center',
        alignItems: 'center',
      },
      isLocked && { opacity: 0.4 },
    ]}
  >
    {/* Highlight for 3D sphere effect */}
    <View
      style={{
        position: 'absolute',
        top: '12%',
        left: '18%',
        width: '35%',
        height: '35%',
        borderRadius: planetSize / 2,
        backgroundColor: 'rgba(255,255,255,0.35)',
      }}
    />
    {/* Secondary color accent */}
    <View
      style={{
        position: 'absolute',
        bottom: '15%',
        right: '15%',
        width: '25%',
        height: '25%',
        borderRadius: planetSize / 2,
        backgroundColor: PLANET_COLORS[planetType]?.[1] || '#26A69A',
        opacity: 0.6,
      }}
    />
  </View>
));

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
  const { level: levelId, completedSetId } = useLocalSearchParams<{ level: string; completedSetId: string }>();
  const routeKey = useRouteKey(); // Changes when route params change

  // Use cached level for instant display on mount
  const [currentLevel, setCurrentLevel] = useState<Level | null>(() => {
    if (cachedCurrentLevel && (!levelId || cachedLevelId === levelId)) {
      return cachedCurrentLevel;
    }
    return null;
  });
  const [progress, setProgress] = useState(() => {
    if (cachedCurrentLevel && (!levelId || cachedLevelId === levelId)) {
      const completed = cachedCurrentLevel.sets.filter(s => s.completed).length;
      return { completed, total: cachedCurrentLevel.sets.length };
    }
    return { completed: 0, total: 0 };
  });
  const [activeLevelId, setActiveLevelId] = useState<string | null>(levelId ?? cachedLevelId ?? null);
  const [highestLevel, setHighestLevel] = useState<string | null>(null);
  const [placementLevel, setPlacementLevel] = useState<string | null>(null);
  const levelNodeAnims = useRef<Animated.Value[]>([]);
  const levelPulseAnim = useRef(new Animated.Value(1)).current;
  const levelPulseOpacity = useRef(new Animated.Value(0.4)).current;
  // ========== SCROLL LOGIC STATE (REBUILT) ==========
  // Debug logging helper with timestamp
  const logScroll = useCallback((tag: string, message: string, data?: any) => {
    const ts = new Date().toISOString().substr(11, 12); // HH:MM:SS.mmm
    const dataStr = data !== undefined ? JSON.stringify(data) : '';
    console.log(`[${ts}] [${tag}] ${message} ${dataStr}`);
  }, []);

  // Initialize indices from cached values for instant display
  const [currentSetIndex, setCurrentSetIndex] = useState<number>(() => cachedCurrentPlanetIndex);
  const [centeredPlanetIndex, setCenteredPlanetIndex] = useState<number>(() => cachedCurrentPlanetIndex);
  const passedStageGates = useRef<Set<number>>(new Set());
  const scrollViewRef = useRef<ScrollView>(null);
  const lastCenteredPlanet = useRef<number>(cachedCurrentPlanetIndex);
  const planetScaleAnims = useRef<Animated.Value[]>([]);

  // ========== SCROLL CONTROL (using module-level flags) ==========
  // These flags are at module level because Learn unmounts on tab switch!
  // We use a mountId to detect actual app restarts vs tab switch remounts.
  const mountId = useRef(++lastMountId);
  // Track scroll end for haptic
  const scrollEndTimer = useRef<NodeJS.Timeout | null>(null);
  const isScrollingRef = useRef(false);

  // Helper to access module-level scroll flags
  const getLayoutReady = () => moduleLayoutReady;
  const setLayoutReady = (v: boolean) => { moduleLayoutReady = v; };
  const getInitialScrollDone = () => moduleInitialScrollDone;
  const setInitialScrollDone = (v: boolean) => { moduleInitialScrollDone = v; };

  // Scroll locked state - use both module variable (for function checks) AND React state (for re-renders)
  const [scrollLockedState, setScrollLockedState] = useState(false);
  const getScrollLocked = () => moduleScrollLocked;
  const setScrollLocked = (v: boolean) => {
    moduleScrollLocked = v;
    setScrollLockedState(v); // Trigger re-render
  };

  // Premium status for gating content - initialize from cache to prevent flickering
  const [isPremium, setIsPremium] = useState<boolean>(() => cachedIsPremium);
  const [showPaywall, setShowPaywall] = useState<boolean>(false);
  const [showLockedPopup, setShowLockedPopup] = useState<boolean>(false);

  // User's focus preference from onboarding (business, travel, exams, general)
  // Initialize from cache to prevent set reordering on remount
  const [userFocus, setUserFocus] = useState<SetCategory | null>(() => cachedUserFocus as SetCategory | null);

  // Spacecraft animation state
  const [spacecraftAnimating, setSpacecraftAnimating] = useState(false);
  const [spacecraftFromIndex, setSpacecraftFromIndex] = useState(0);
  const [spacecraftToIndex, setSpacecraftToIndex] = useState(0);
  const [hideStaticSpacecraft, setHideStaticSpacecraft] = useState(false); // Hide during animation setup
  const spacecraftAnim = useRef(new Animated.Value(0)).current;

  // ========== MOUNT/UNMOUNT LOGGING ==========
  useEffect(() => {
    const ts = new Date().toISOString().substr(11, 12);
    const isRemount = cachedCurrentLevel !== null;
    const cachedCompleted = cachedCurrentLevel ? cachedCurrentLevel.sets.filter(s => s.completed).length : 0;
    const cachedTotal = cachedCurrentLevel ? cachedCurrentLevel.sets.length : 0;
    console.log(`\n[${ts}] ========== LEARN MOUNT ========== mountId=${mountId.current}`);
    console.log(`[${ts}] [LEARN] ${isRemount ? '🔄 TAB SWITCH (should preserve state)' : '🆕 FRESH START'}`);
    console.log(`[${ts}] [LEARN] cached level: ${cachedCompleted}/${cachedTotal} completed, cachedUserFocus=${cachedUserFocus}`);
    console.log(`[${ts}] [LEARN] initial state: activeLevelId=${activeLevelId}, isPremium=${isPremium}, userFocus=${userFocus}`);
    console.log(`[${ts}] [LEARN] flags: layoutReady=${getLayoutReady()}, initialScrollDone=${getInitialScrollDone()}, scrollLocked=${getScrollLocked()}`);

    // On FRESH app start (no cached level), reset module-level flags
    // On tab switch remount, keep the flags as-is to preserve scroll position
    if (!isRemount) {
      console.log(`[${ts}] [LEARN] fresh start - resetting module flags`);
      setLayoutReady(false);
      setInitialScrollDone(false);
      setScrollLocked(false);
    }

    // Safety check: if scroll is locked for more than 3 seconds, unlock it
    // This prevents permanent lock if animation callback fails
    const unlockTimer = setTimeout(() => {
      if (getScrollLocked()) {
        console.log(`[${ts}] [LEARN] SAFETY: unlocking scroll after 3s`);
        setScrollLocked(false);
      }
    }, 3000);

    DeviceEventEmitter.emit('NAV_VISIBILITY', 'show');

    // Listen for manual reset signal (escape hatch for debugging)
    const resetListener = DeviceEventEmitter.addListener('LEARN_RESET', () => {
      console.log(`[${ts}] [LEARN] manual reset triggered`);
      clearLearnScreenCache();
      // Force refresh
      refreshLevel();
    });

    return () => {
      const ts2 = new Date().toISOString().substr(11, 12);
      console.log(`\n[${ts2}] ========== LEARN UNMOUNT ========== mountId=${mountId.current}`);
      console.log(`[${ts2}] [LEARN] ⚠️  UNMOUNTING - This should NOT happen on tab switch!`);
      clearTimeout(unlockTimer);
      resetListener.remove();
    };
  }, [refreshLevel]);

  // Load persisted planet index on mount (for app restarts)
  useEffect(() => {
    if (hasLoadedCachedIndex) return;
    hasLoadedCachedIndex = true;

    AsyncStorage.getItem(CURRENT_PLANET_INDEX_KEY).then(stored => {
      if (stored) {
        const index = parseInt(stored, 10);
        if (!isNaN(index) && index >= 0) {
          cachedCurrentPlanetIndex = index;
          // Update state if component is mounted
          setCurrentSetIndex(index);
          setCenteredPlanetIndex(index);
        }
      }
    }).catch(() => {});
  }, []);

  // ========== DERIVED VALUE: currentPlanetIndex ==========
  // The first incomplete/unlocked set index based on progress
  const getCurrentPlanetIndex = useCallback((level: Level | null): number => {
    if (!level) return cachedCurrentPlanetIndex;
    const idx = level.sets.findIndex(s => !s.completed && !s.locked);
    return idx === -1 ? 0 : idx;
  }, []);

  // Calculate scroll X position for a given planet index
  const getScrollXForIndex = useCallback((index: number) => {
    return Math.max(0, index * HORIZONTAL_SPACING + 60 + PLANET_SIZE / 2 + 20 - SCREEN_WIDTH / 2);
  }, []);

  // ========== THE ONLY SCROLL FUNCTION ==========
  // Rule: All scrolling MUST go through this function
  const scrollToPlanet = useCallback((index: number, animated: boolean = true) => {
    const scrollX = getScrollXForIndex(index);

    // Check if scroll is locked (during spacecraft animation)
    if (getScrollLocked()) {
      logScroll('SCROLL', `BLOCKED (locked) index=${index}, x=${scrollX}, animated=${animated}`);
      return;
    }

    if (!scrollViewRef.current) {
      logScroll('SCROLL', `BLOCKED (no ref) index=${index}`);
      return;
    }

    logScroll('SCROLL', `scrollToPlanet index=${index}, x=${scrollX}, animated=${animated}`);
    scrollViewRef.current.scrollTo({ x: scrollX, y: 0, animated });

    // Update state
    setCenteredPlanetIndex(index);
    lastCenteredPlanet.current = index;
    cachedCurrentPlanetIndex = index;

    // Persist for app restarts
    AsyncStorage.setItem(CURRENT_PLANET_INDEX_KEY, String(index)).catch(() => {});
  }, [getScrollXForIndex, logScroll]);

  // ========== INITIAL SCROLL (contentOffset for instant positioning) ==========
  // Calculate initial offset ONCE using cached data (no deps = runs once)
  const initialScrollOffset = useMemo(() => {
    const level = cachedCurrentLevel;
    let targetIndex = cachedCurrentPlanetIndex;
    if (level) {
      const idx = level.sets.findIndex(s => !s.completed && !s.locked);
      targetIndex = idx === -1 ? 0 : idx;
    }
    const x = targetIndex * HORIZONTAL_SPACING + 60 + PLANET_SIZE / 2 + 20 - SCREEN_WIDTH / 2;
    logScroll('SCROLL', `initialScrollOffset calculated index=${targetIndex}, x=${Math.max(0, x)}`);
    return { x: Math.max(0, x), y: 0 };
  }, []); // Empty deps - calculate ONCE on mount

  // ========== LAYOUT HANDLER ==========
  // Triggers initial scroll on first mount only
  // After that, useFocusEffect handles scrolling when tab becomes visible
  const handleScrollViewLayout = useCallback(() => {
    if (getLayoutReady()) {
      // Layout already processed, skip (useFocusEffect will handle subsequent scrolls)
      logScroll('LEARN', 'layout ready (already done, useFocusEffect will handle scroll)');
      return;
    }
    setLayoutReady(true);
    logScroll('LEARN', 'layout ready (first time)');

    // Perform initial scroll on first mount only
    if (!getInitialScrollDone() && !getScrollLocked()) {
      const level = currentLevel || cachedCurrentLevel;
      const targetIndex = getCurrentPlanetIndex(level);
      logScroll('SCROLL', `initial scroll (from layout, first mount) index=${targetIndex}`);
      setInitialScrollDone(true);

      // Use instant scroll on first mount for immediate positioning
      scrollToPlanet(targetIndex, false);

      // Also update currentSetIndex state
      setCurrentSetIndex(targetIndex);
      logScroll('STATE', `currentPlanetIndex=${targetIndex}`);
    }
  }, [currentLevel, getCurrentPlanetIndex, scrollToPlanet, logScroll]);

  // Check premium status on mount
  const checkPremiumStatus = useCallback(async () => {
    try {
      const status = await SubscriptionService.getStatus();
      const premium = status?.active ?? false;
      setIsPremium(premium);
      // Update module-level cache for next mount
      cachedIsPremium = premium;
    } catch {
      setIsPremium(false);
      cachedIsPremium = false;
    }
  }, []);

  // Load user's focus preference from onboarding
  const loadUserFocus = useCallback(async () => {
    try {
      const focus = await AsyncStorage.getItem(USER_FOCUS_KEY);
      if (focus && ['general', 'travel', 'business', 'exams'].includes(focus)) {
        setUserFocus(focus as SetCategory);
        cachedUserFocus = focus;
      }
    } catch {
      // Keep default (null)
    }
  }, []);

  // Load premium status and user focus on mount
  // Run only once per app session (not on every tab switch)
  useEffect(() => {
    if (!hasLoadedPremiumCache) {
      hasLoadedPremiumCache = true;

      // Load in parallel for speed
      Promise.all([
        checkPremiumStatus(),
        loadUserFocus()
      ]).catch(() => {});
    }
  }, [checkPremiumStatus, loadUserFocus]);

  // ========== FOCUS/BLUR - AUTO-SCROLL TO CURRENT PLANET ==========
  // When tab becomes visible, scroll to current planet so user doesn't have to hunt for it
  // BUT skip if we just returned from completing a set (spacecraft animation will handle scroll)
  useFocusEffect(
    useCallback(() => {
      const ts = new Date().toISOString().substr(11, 12);
      console.log(`[${ts}] [LEARN] 👁️  FOCUS (tab visible), completedSetId=${completedSetId}`);

      // Skip auto-scroll if:
      // 1. Scroll is locked (animation in progress)
      // 2. We have completedSetId param (returning from completed set - let spacecraft animation handle it)
      if (getScrollLocked()) {
        logScroll('FOCUS', 'skip auto-scroll (scroll locked)');
        return;
      }

      if (completedSetId) {
        logScroll('FOCUS', 'skip auto-scroll (completedSetId present, spacecraft will handle)');
        return;
      }

      // Auto-scroll to current planet after a short delay (let layout settle)
      const scrollTimer = setTimeout(() => {
        if (currentLevel && !getScrollLocked()) {
          const targetIndex = getCurrentPlanetIndex(currentLevel);
          logScroll('FOCUS', `auto-scroll to current planet index=${targetIndex}`);
          scrollToPlanet(targetIndex, true); // animated=true for smooth scroll
        }
      }, 150);

      return () => {
        clearTimeout(scrollTimer);
        const ts2 = new Date().toISOString().substr(11, 12);
        console.log(`[${ts2}] [LEARN] 🙈 BLUR (tab hidden)`);
      };
    }, [currentLevel, completedSetId, getCurrentPlanetIndex, scrollToPlanet, logScroll])
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
    const ts = new Date().toISOString().substr(11, 12);

    // CRITICAL: Use cachedUserFocus if userFocus hasn't loaded yet
    // This prevents set reordering on remount which breaks completion tracking
    // (Set IDs are assigned based on order, so different order = different IDs!)
    const effectiveUserFocus = userFocus ?? cachedUserFocus;
    const caller = new Error().stack?.split('\n')[2]?.trim() || 'unknown';
    console.log(`[${ts}] [DATA] 🔄 refreshLevel START`);
    console.log(`[${ts}] [DATA] params: activeLevelId=${activeLevelId}, isPremium=${isPremium}, userFocus=${userFocus}, effectiveUserFocus=${effectiveUserFocus}`);
    console.log(`[${ts}] [DATA] caller: ${caller}`);

    if (!activeLevelId) {
      console.log(`[${ts}] [DATA] refreshLevel: no activeLevelId, clearing level`);
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

      // Get sets ordered by user's focus preference (Business, Travel, IELTS, General)
      // For levels with category-based sets, use the ordered sets
      const categoryLevels = ['beginner', 'intermediate', 'upper-intermediate', 'advanced'];
      let baseSets: VocabSet[];

      if (categoryLevels.includes(level.id)) {
        // Use ordered sets based on user's focus preference
        // IMPORTANT: Use effectiveUserFocus to maintain consistent set IDs across remounts
        baseSets = getOrderedSetsForLevel(level.id, effectiveUserFocus) as VocabSet[];
      } else {
        // For other levels (advanced-plus, proficient), use default sets
        baseSets = level.sets;
      }

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

      // Log completion status for debugging
      const completedCount = setsWithProgress.filter(s => s.completed).length;
      const ts2 = new Date().toISOString().substr(11, 12);
      console.log(`[${ts2}] [DATA] refreshLevel done: ${completedCount}/${setsWithProgress.length} sets completed`);
      console.log(`[${ts2}] [DATA] First 5 sets completed status:`, setsWithProgress.slice(0, 5).map(s => ({ id: s.id, completed: s.completed })));

      setCurrentLevel(levelWithProgress);
      // Update module-level cache
      cachedCurrentLevel = levelWithProgress;
      cachedLevelId = level.id;
      cachedUserFocus = effectiveUserFocus;

      // Set initial scroll index immediately with level to avoid flash
      // BUT skip if scroll is locked (animation in progress) to prevent jumping
      if (!getScrollLocked()) {
        const initialIndex = setsWithProgress.findIndex(s => !s.completed && !s.locked);
        const targetIndex = initialIndex === -1 ? 0 : initialIndex;
        setCurrentSetIndex(targetIndex);
        setCenteredPlanetIndex(targetIndex);
        lastCenteredPlanet.current = targetIndex;

        // Update module-level cache for instant positioning on next mount
        cachedCurrentPlanetIndex = targetIndex;
        AsyncStorage.setItem(CURRENT_PLANET_INDEX_KEY, String(targetIndex)).catch(() => {});
      }

      // NOTE: Initial scroll is handled by:
      // 1. contentOffset prop (instant positioning on mount)
      // 2. handleScrollViewLayout (scroll after layout ready)
      // Do NOT add scroll calls here - it causes competing scroll effects

      const completed = setsWithProgress.filter(s => s.completed).length;
      setProgress({ completed, total: setsWithProgress.length });
    }
  }, [activeLevelId, isPremium, userFocus]);

  // Refresh level when dependencies change (activeLevelId, isPremium, userFocus)
  // Debounced to prevent multiple rapid calls during initialization
  const refreshTimer = useRef<NodeJS.Timeout | null>(null);
  const lastRefreshParams = useRef<{levelId: string | null, premium: boolean, focus: string | null}>({
    levelId: null,
    premium: false,
    focus: null
  });

  useEffect(() => {
    // Skip if params haven't actually changed (prevents redundant refreshes)
    const currentParams = { levelId: activeLevelId, premium: isPremium, focus: userFocus };
    const lastParams = lastRefreshParams.current;

    if (lastParams.levelId === currentParams.levelId &&
        lastParams.premium === currentParams.premium &&
        lastParams.focus === currentParams.focus) {
      console.log('[DATA] Skip refresh - params unchanged');
      return;
    }

    // Clear any pending refresh
    if (refreshTimer.current) {
      clearTimeout(refreshTimer.current);
    }

    // Debounce refresh by 200ms to batch rapid changes during initialization
    refreshTimer.current = setTimeout(() => {
      console.log('[DATA] Debounce timer fired - calling refreshLevel');
      lastRefreshParams.current = currentParams;
      refreshLevel();
    }, 200);

    return () => {
      if (refreshTimer.current) {
        clearTimeout(refreshTimer.current);
      }
    };
  }, [activeLevelId, isPremium, userFocus]);  // Don't include refreshLevel - it creates circular deps

  // Note: Don't refresh on every tab focus - it causes title flashing
  // The useEffect above already handles refreshing when dependencies change

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
      // Show sign-up modal
      setShowSignupModal(true);
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

  // ========== SET_COMPLETED EVENT for Test Complete button ==========
  useEffect(() => {
    const subscription = DeviceEventEmitter.addListener('SPACECRAFT_ANIMATE', async (data?: { setId: string }) => {
      if (!data?.setId) return;

      const setIdStr = String(data.setId);
      logScroll('FLOW', `🎉 SPACECRAFT_ANIMATE event received for setId=${setIdStr}`);

      // Check if already animated
      if (animatedSetIds.has(setIdStr)) {
        logScroll('FLOW', `skip animation - already animated setId=${setIdStr}`);
        return;
      }

      logScroll('FLOW', `🎬 Starting spacecraft animation for setId=${setIdStr}`);

      // Lock scroll only (keep static spacecraft visible during data refresh)
      setScrollLocked(true);

      // Get current level to find completed index BEFORE marking as completed changes state
      const levelBefore = currentLevel || cachedCurrentLevel;
      if (!levelBefore) {
        logScroll('FLOW', 'no level data before refresh, aborting');
        setScrollLocked(false);
        return;
      }

      // Find the completed set index using current data
      const completedIndex = levelBefore.sets.findIndex(s => String(s.id) === setIdStr);
      if (completedIndex < 0 || completedIndex >= levelBefore.sets.length - 1) {
        logScroll('FLOW', 'set not found or is last, aborting animation');
        setScrollLocked(false);
        return;
      }

      const nextIndex = completedIndex + 1;

      // If this is a quiz, mark all previous non-quiz sets as completed (skip-ahead logic)
      const completedSet = levelBefore.sets[completedIndex];
      const isQuiz = completedSet && (completedSet as any).type === 'quiz';
      if (isQuiz && activeLevelId) {
        logScroll('FLOW', `📝 Quiz completed, marking previous sets as completed`);

        // Mark all previous non-quiz sets as completed
        for (let i = 0; i < completedIndex; i++) {
          const prevSet = levelBefore.sets[i];
          if (prevSet && (prevSet as any).type !== 'quiz') {
            const prevProgress = SetProgressService.get(String(activeLevelId), String(prevSet.id));
            if (!prevProgress || prevProgress.status !== 'completed') {
              await SetProgressService.markCompleted(String(activeLevelId), String(prevSet.id), 80);
              logScroll('FLOW', `✅ Marked previous set ${prevSet.id} as completed`);
            }
          }
        }
        await SetProgressService.flushSave();
      }

      // CRITICAL: Set animation state IMMEDIATELY to keep static spacecraft mounted
      // and show animated spacecraft - this prevents any disappearance
      setSpacecraftFromIndex(completedIndex);
      setSpacecraftToIndex(nextIndex);
      spacecraftAnim.setValue(0);
      setSpacecraftAnimating(true);
      setHideStaticSpacecraft(false); // Reset this so static is only hidden by spacecraftAnimating
      // Note: static spacecraft auto-hides when spacecraftAnimating=true

      // Mark as animated
      animatedSetIds.add(setIdStr);

      logScroll('FLOW', `🚀 EVENT: Animating spacecraft from ${completedIndex} to ${nextIndex}`);

      // Now refresh level data in the background (animation state keeps spacecraft visible)
      // This will pick up all the newly completed sets from the quiz skip-ahead
      await refreshLevel();

      // Start animation immediately - no setTimeout delay needed since we already have state set
      const startScrollX = getScrollXForIndex(completedIndex);
      const endScrollX = getScrollXForIndex(nextIndex);
      const scrollDistance = endScrollX - startScrollX;

      const scrollProgress = new Animated.Value(0);

        Animated.parallel([
          Animated.timing(spacecraftAnim, {
            toValue: 1,
            duration: 1500,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
          Animated.timing(scrollProgress, {
            toValue: 1,
            duration: 1500,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: false,
          }),
        ]).start(() => {
          logScroll('FLOW', '✅ Spacecraft animation complete');

          // Clean up scroll listener immediately
          scrollProgress.removeAllListeners();

          // Force scroll to exact final position
          if (scrollViewRef.current) {
            scrollViewRef.current.scrollTo({ x: endScrollX, y: 0, animated: false });
          }

          // Update indices immediately - animation is complete so no stutter
          setCurrentSetIndex(nextIndex);
          setCenteredPlanetIndex(nextIndex);
          lastCenteredPlanet.current = nextIndex;

          // Unlock scroll
          setScrollLocked(false);

          // Keep spacecraftAnimating TRUE - never switch back to static spacecraft
          // This prevents position adjustment
        });

      scrollProgress.addListener(({ value }) => {
        const currentScrollX = startScrollX + (scrollDistance * value);
        if (scrollViewRef.current) {
          scrollViewRef.current.scrollTo({ x: currentScrollX, y: 0, animated: false });
        }
      });
    });

    return () => subscription.remove();
  }, [refreshLevel, getCurrentPlanetIndex, getScrollXForIndex, spacecraftAnim, scrollToPlanet, logScroll]);

  // ========== LEVEL CHANGE STATE UPDATE (NO SCROLL) ==========
  // Only updates state, does NOT scroll - scroll is handled by layout handler
  useEffect(() => {
    if (!currentLevel) return;
    // Skip if scroll is locked (spacecraft animation in progress)
    if (getScrollLocked()) return;

    const newIndex = currentLevel.sets.findIndex(s => !s.completed && !s.locked);
    const targetIndex = newIndex === -1 ? 0 : newIndex;

    logScroll('STATE', `currentPlanetIndex=${targetIndex} (from level change)`);
    setCurrentSetIndex(targetIndex);

    // Update cache for next mount
    cachedCurrentPlanetIndex = targetIndex;
  }, [currentLevel, logScroll]);

  // ========== CONTINUE FLOW (returning from completed set) ==========
  // Handles spacecraft animation when returning from quiz screen
  useEffect(() => {
    logScroll('FLOW', `🔍 CONTINUE useEffect triggered, completedSetId=${completedSetId}`);
    if (!completedSetId) {
      logScroll('FLOW', '❌ No completedSetId, skipping animation');
      return;
    }

    const setIdStr = String(completedSetId);
    // Skip if already animated this set
    if (animatedSetIds.has(setIdStr)) {
      logScroll('FLOW', `skip animation - already animated setId=${setIdStr}`);
      return;
    }

    logScroll('FLOW', `🎬 continue pressed, completedSetId=${setIdStr}`);

    // CRITICAL: Lock scroll only (keep static spacecraft visible during data refresh)
    setScrollLocked(true);

    // CRITICAL: Refresh level data first to get updated completion status
    // Otherwise we'll animate based on stale data
    const refreshAndAnimate = async () => {
      await refreshLevel();

      const level = currentLevel || cachedCurrentLevel;
      if (!level) {
        logScroll('FLOW', 'no level data after refresh, aborting animation');
        // Unlock UI since animation won't happen
        setScrollLocked(false);
        return;
      }

      // Find the completed set index
      const completedIndex = level.sets.findIndex(s => String(s.id) === setIdStr);
      if (completedIndex < 0 || completedIndex >= level.sets.length - 1) {
        // Set not found or is last set, just scroll to current planet
        logScroll('FLOW', 'set not found or is last, scrolling to current');
        const targetIndex = getCurrentPlanetIndex(level);
        scrollToPlanet(targetIndex, false);
        setScrollLocked(false);
        return;
      }

      // Mark as animated ONLY when we're actually going to animate (after all early returns)
      animatedSetIds.add(setIdStr);

      // Smooth animation: spacecraft flies from completed planet to next planet
      // Screen follows the spacecraft to keep it in view
      setTimeout(() => {
        const nextIndex = completedIndex + 1;

        logScroll('FLOW', `🚀 COMPLETED_PARAM: Animating spacecraft from ${completedIndex} to ${nextIndex}`);

        // Hide static spacecraft NOW (right before animated one appears)
        setHideStaticSpacecraft(true);

        // Setup animated spacecraft overlay
        setSpacecraftFromIndex(completedIndex);
        setSpacecraftToIndex(nextIndex);
        setSpacecraftAnimating(true);
        spacecraftAnim.setValue(0);

        // Calculate scroll positions for smooth camera follow
        const startScrollX = getScrollXForIndex(completedIndex);
        const endScrollX = getScrollXForIndex(nextIndex);
        const scrollDistance = endScrollX - startScrollX;

        // Animate BOTH spacecraft AND screen together smoothly
        const scrollProgress = new Animated.Value(0);

        Animated.parallel([
          // Spacecraft animation
          Animated.timing(spacecraftAnim, {
            toValue: 1,
            duration: 1500, // Smooth 1.5 second flight
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
          // Screen scroll follows spacecraft smoothly
          Animated.timing(scrollProgress, {
            toValue: 1,
            duration: 1500,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: false,
          }),
        ]).start(() => {
          logScroll('FLOW', '✅ Spacecraft animation complete');

          // Clean up scroll listener immediately
          scrollProgress.removeAllListeners();

          // Force scroll to exact final position
          if (scrollViewRef.current) {
            scrollViewRef.current.scrollTo({ x: endScrollX, y: 0, animated: false });
          }

          // Update indices immediately - animation is complete so no stutter
          setCurrentSetIndex(nextIndex);
          setCenteredPlanetIndex(nextIndex);
          lastCenteredPlanet.current = nextIndex;

          // Unlock scroll
          setScrollLocked(false);

          // Keep spacecraftAnimating TRUE - never switch back to static spacecraft
          // This prevents position adjustment
        });

        // Listen to scroll progress and update ScrollView position
        scrollProgress.addListener(({ value }) => {
          const currentScrollX = startScrollX + (scrollDistance * value);
          if (scrollViewRef.current) {
            scrollViewRef.current.scrollTo({ x: currentScrollX, y: 0, animated: false });
          }
        });
      }, 300);
    };

    // Call the async function
    refreshAndAnimate().catch(err => {
      console.error('[FLOW] refreshAndAnimate failed:', err);
      setScrollLocked(false);
      setHideStaticSpacecraft(false);
      setSpacecraftAnimating(false);
    });
  }, [completedSetId, routeKey, refreshLevel, getCurrentPlanetIndex, getScrollXForIndex, spacecraftAnim, scrollToPlanet, logScroll]);

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

  // Scroll handler to detect centered planet
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

    // Update ref and state immediately to keep render window in sync with scroll
    if (clampedIndex !== lastCenteredPlanet.current) {
      // Don't update centered planet during ACTIVE animation (scroll locked)
      if (getScrollLocked()) {
        return;
      }

      lastCenteredPlanet.current = clampedIndex;
      triggerHaptic('light');
      // Update state immediately - no debounce to prevent planets disappearing during fast scroll
      setCenteredPlanetIndex(clampedIndex);
    }
  }, [triggerHaptic, currentLevel?.sets.length, spacecraftAnimating, getScrollLocked]);

  // Cleanup timeouts on unmount to prevent memory leaks
  useEffect(() => {
    return () => {
      if (scrollEndTimer.current) {
        clearTimeout(scrollEndTimer.current);
      }
    };
  }, []);

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

  // Calculate position for diagonal winding S-curve path (shared function)
  // MUST be before early return to avoid hooks order issues
  const getPlanetPosition = useCallback((index: number): { x: number; y: number } => {
    const x = index * HORIZONTAL_SPACING + 60;
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
  }, []);

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

  // Only show loading on very first app launch when no cache exists
  if (!currentLevel && !cachedCurrentLevel) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
        <TopStatusPanel floating includeTopInset />
        <View style={[styles.loadingContainer, { paddingTop: contentTop }]}>
          <LottieView
            source={require('../../assets/lottie/learn/loading_inlearn.json')}
            autoPlay
            loop
            cacheComposition={false}
            style={{ width: 140, height: 140 }}
          />
          <Text style={[styles.loadingText, isLight && { color: '#6B7280' }]}>Loading...</Text>
        </View>
      </SafeAreaView>
    );
  }

  // Use current level or cached for instant display
  const displayLevel = currentLevel || cachedCurrentLevel;
  if (!displayLevel) {
    return null;
  }

  const renderPlanetNode = (set: VocabSet & { locked?: boolean; premiumLocked?: boolean }, index: number, isCurrentLevel: boolean, allSets: VocabSet[]) => {
    const isLocked = set.locked;
    const isCompleted = set.completed;
    const isQuiz = (set as any).type === 'quiz';
    const isCurrent = isCurrentLevel && index === currentSetIndex;
    const isCentered = index === centeredPlanetIndex; // Magnifying effect
    const quizCanSkipAhead = isPremium && isQuiz && isLocked && canQuizSkipAhead(set, allSets);

    // Magnifying effect - subtle scale increase for centered planet
    const magnifyScale = isCentered ? 1.08 : 1;
    const planetSize = PLANET_SIZE; // Keep same size, just scale

    // Get planet type for this node
    const planetType = getPlanetType(index, isQuiz, set.title);
    const planetSource = getPlanetSource(planetType);

    // Clean title for display
    const displayTitle = isQuiz ? `Quiz ${set.title.replace('Quiz ', '')}` : cleanTitle(set.title);

    const wrapperWidth = planetSize + 40;

    return (
      <View
        key={`planet-${set.id}-${index}`}
        style={[
          styles.planetWrapperH,
          { width: wrapperWidth },
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
        </View>

        {/* UFO/Spacecraft for current node - always rendered on relevant planets to prevent unmount/remount flicker */}
        {((isCurrent && !isCompleted) || (spacecraftAnimating && (index === spacecraftFromIndex || index === spacecraftToIndex))) && (
          <View style={[
            styles.spacecraftContainerH,
            {
              left: wrapperWidth / 2 - 35,
              opacity: (spacecraftAnimating || hideStaticSpacecraft) ? 0 : 1
            }
          ]}>
            <LottieView
              source={SPACECRAFT_SOURCE}
              autoPlay
              loop
              cacheComposition={false}
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
              {SPARKLE_DATA.map((sparkle, i) => {
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

          {/* Planet Lottie animation */}
          <LottieView
            source={planetSource}
            autoPlay
            loop
            cacheComposition={false}
            style={[
              { width: planetSize, height: planetSize },
              (isLocked && !quizCanSkipAhead) && styles.planetLocked,
            ]}
          />

          {/* Completed flag animation on top of completed planets */}
          {isCompleted && (
            <View style={{
              position: 'absolute',
              top: -planetSize * 0.2,
              right: -planetSize * 0.15,
              width: planetSize * 0.5,
              height: planetSize * 0.5,
              zIndex: 10,
            }}>
              <LottieView
                source={require('../../assets/lottie/learn/flag_completed.json')}
                autoPlay
                loop
                cacheComposition={false}
                style={{ width: '100%', height: '100%' }}
              />
            </View>
          )}

        </TouchableOpacity>
      </View>
    );
  };

  // Generate path data for curved connector between planets - smooth S-curve dashed line
  // Returns just the path string, not an SVG element (combined into single SVG for memory optimization)
  const getConnectorPath = (x1: number, y1: number, x2: number, y2: number): string => {
    // Create smooth bezier curve
    // Control points offset to create natural S-curve flow
    const dx = x2 - x1;

    // For diagonal paths, use control points that curve smoothly
    const cp1x = x1 + dx * 0.4;
    const cp1y = y1;
    const cp2x = x2 - dx * 0.4;
    const cp2y = y2;

    return `M ${x1} ${y1} C ${cp1x} ${cp1y}, ${cp2x} ${cp2y}, ${x2} ${y2}`;
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
  };

  const renderStarNode = () => {
    const level = currentLevel || cachedCurrentLevel;
    if (!level) return null;
    const allCompleted = progress.completed === progress.total && progress.total > 0;
    const lastIndex = level.sets.length;
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
          cacheComposition={false}
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

  // Render spacecraft animation overlay
  const renderSpacecraftAnimation = () => {
    // Always render (pre-loaded), just control visibility with opacity

    const fromPos = getPlanetPosition(spacecraftFromIndex);
    const toPos = getPlanetPosition(spacecraftToIndex);

    // Match static spacecraft position exactly
    // Static spacecraft is positioned relative to planet wrapper:
    // Planet wrapper: position absolute at (pos.x, pos.y) within planetPathContainerH
    // planetPathContainerH flows normally with paddingHorizontal: 20
    // Static spacecraft: inline style has left: wrapperWidth / 2 - 35, top: -30
    // wrapperWidth = planetSize + 40 = PLANET_SIZE + 40 = 110 + 40 = 150
    // So spacecraft left = 150/2 - 35 = 75 - 35 = 40
    const planetSize = PLANET_SIZE;
    const wrapperWidth = planetSize + 40; // 150
    const spacecraftLeft = wrapperWidth / 2 - 35; // 40
    const spacecraftTop = -30;

    // Absolute position within ScrollView content
    const fromX = fromPos.x + spacecraftLeft;
    const fromY = fromPos.y + spacecraftTop;
    const toX = toPos.x + spacecraftLeft;
    const toY = toPos.y + spacecraftTop;

    // Interpolate position
    const translateX = spacecraftAnim.interpolate({
      inputRange: [0, 1],
      outputRange: [fromX, toX],
    });
    const translateY = spacecraftAnim.interpolate({
      inputRange: [0, 1],
      outputRange: [fromY, toY],
    });

    // Add a slight arc to the path
    const arcOffset = spacecraftAnim.interpolate({
      inputRange: [0, 0.5, 1],
      outputRange: [0, -60, 0], // Arc up in the middle
    });

    // Rotate spacecraft to face direction of travel
    const rotate = spacecraftAnim.interpolate({
      inputRange: [0, 1],
      outputRange: ['0deg', '0deg'],
    });

    // Scale animation (grow slightly in middle)
    const scale = spacecraftAnim.interpolate({
      inputRange: [0, 0.5, 1],
      outputRange: [1, 1.3, 1],
    });

    return (
      <Animated.View
        style={[
          styles.spacecraftAnimContainer,
          {
            opacity: spacecraftAnimating ? 1 : 0,
            transform: [
              { translateX },
              { translateY: Animated.add(translateY, arcOffset) },
              { scale },
              { rotate },
            ],
          },
        ]}
        pointerEvents="none"
      >
        <LottieView
          source={SPACECRAFT_SOURCE}
          autoPlay
          loop
          cacheComposition={false}
          style={{ width: 80, height: 80 }}
        />
      </Animated.View>
    );
  };

  // Build the path for current level only - DIAGONAL WINDING S-CURVE
  const buildCurrentLevelPath = () => {
    const level = currentLevel || cachedCurrentLevel;
    if (!level) return null;

    const setsToRender = level.sets;
    const spacing = HORIZONTAL_SPACING; // Use constant from scroll handler
    const totalWidth = setsToRender.length * spacing + 200;
    const pathHeight = SCREEN_HEIGHT - 200;

    // Use shared position function
    const getPosition = getPlanetPosition;

    // Offset for planet center within wrapper
    const wrapperOffset = 20 + PLANET_SIZE / 2;

    // Collect all connector paths for single SVG (memory optimization)
    const connectorPathsData: string[] = [];
    for (let index = 0; index < setsToRender.length - 1; index++) {
      const current = getPosition(index);
      const next = getPosition(index + 1);
      const currentX = current.x + wrapperOffset;
      const nextX = next.x + wrapperOffset;
      const currentY = current.y + PLANET_SIZE / 2 + 55;
      const nextY = next.y + PLANET_SIZE / 2 + 55;
      connectorPathsData.push(getConnectorPath(currentX, currentY, nextX, nextY));
    }

    return (
      <View style={[styles.planetPathContainerH, { width: totalWidth, height: pathHeight }]}>
        {/* Single SVG for all connectors (memory optimization - 1 SVG instead of many) */}
        {connectorPathsData.length > 0 && (
          <Svg
            style={{ position: 'absolute', top: 0, left: 0 }}
            width={totalWidth}
            height={pathHeight}
            pointerEvents="none"
          >
            {connectorPathsData.map((pathD, idx) => (
              <Path
                key={`path-${idx}`}
                d={pathD}
                stroke="rgba(150, 160, 180, 0.25)"
                strokeWidth={2}
                strokeDasharray="8,6"
                fill="none"
                strokeLinecap="round"
              />
            ))}
          </Svg>
        )}
        {/* Planet nodes - render all */}
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

  // Get the centered set for the Start button
  const centeredSet = displayLevel?.sets[centeredPlanetIndex];
  const allCompleted = displayLevel && displayLevel.sets.every(s => s.completed);
  const isCenteredSetLocked = centeredSet?.locked && !((centeredSet as any).type === 'quiz' && canQuizSkipAhead(centeredSet as any, displayLevel?.sets || []));

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
        onLayout={handleScrollViewLayout}
        scrollEventThrottle={64}
        removeClippedSubviews={true}
        decelerationRate="fast"
        disableIntervalMomentum={true}
        contentOffset={initialScrollOffset}
      >
        {/* Planet path */}
        {buildCurrentLevelPath()}

        {/* Spacecraft flying animation - INSIDE ScrollView so it moves with content */}
        {renderSpacecraftAnimation()}
      </ScrollView>

      {/* Start / Practice Again button at bottom */}
      {displayLevel && centeredSet && !scrollLockedState && (
        <View style={styles.bottomButtonContainer}>
          <TouchableOpacity
            style={[
              styles.startButton,
              (isCenteredSetLocked || (!isPremium && centeredPlanetIndex > 0)) && styles.startButtonLocked
            ]}
            onPress={() => {
              // Free users can only access the first set
              if (!isPremium && centeredPlanetIndex > 0) {
                setShowPaywall(true);
                return;
              }
              if (isCenteredSetLocked) {
                setShowLockedPopup(true);
              } else {
                handleSetPress(centeredSet as any, displayLevel.sets);
              }
            }}
            activeOpacity={0.9}
          >
            <Text style={styles.startButtonText}>
              {!isPremium && centeredPlanetIndex > 0 ? 'Unlock' : (centeredSet.completed ? 'Practice Again' : 'Start')}
            </Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Go to current planet FAB */}
      {currentSetIndex !== centeredPlanetIndex && (
        <TouchableOpacity
          style={styles.alienFab}
          activeOpacity={0.9}
          onPress={() => scrollToPlanet(currentSetIndex, true)}
        >
          <View style={[
            styles.alienFabInner,
            { transform: [{ rotate: currentSetIndex > centeredPlanetIndex ? '45deg' : '-45deg' }] }
          ]}>
            <LottieView
              source={require('../../assets/lottie/learn/current_planet.json')}
              autoPlay
              loop
              cacheComposition={false}
              style={styles.rocketFabAnimation}
            />
          </View>
        </TouchableOpacity>
      )}

      {/* DEV: Test complete set button */}
      {displayLevel && centeredSet && !centeredSet.completed && !scrollLockedState && (
        <TouchableOpacity
          style={{
            position: 'absolute',
            right: 16,
            top: insets.top + 60,
            backgroundColor: '#8B5CF6',
            paddingHorizontal: 12,
            paddingVertical: 6,
            borderRadius: 12,
            zIndex: 9999,
            elevation: 9999,
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.3,
            shadowRadius: 4,
          }}
          onPress={async () => {
            const setIdToComplete = centeredSet.id;
            const points = 100;

            console.log(`[TEST] 🎯 Completing set ${setIdToComplete} from Learn screen`);

            // Mark set as completed
            if (activeLevelId && setIdToComplete) {
              await SetProgressService.markCompleted(String(activeLevelId), String(setIdToComplete), points);
              await SetProgressService.flushSave();
              console.log(`[TEST] ✅ Set ${setIdToComplete} marked as completed`);

              // Emit event to trigger spacecraft animation
              // (quiz skip-ahead logic is handled in the event handler)
              DeviceEventEmitter.emit('SPACECRAFT_ANIMATE', { setId: String(setIdToComplete) });
              console.log(`[TEST] 🚀 Emitted SPACECRAFT_ANIMATE event for setId=${setIdToComplete}`);
            }
          }}
          activeOpacity={0.8}
        >
          <Text style={{ color: '#FFF', fontWeight: '700', fontSize: 11, fontFamily: 'Ubuntu-Bold' }}>
            Test Complete
          </Text>
        </TouchableOpacity>
      )}

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

      {/* Locked Set Popup Modal */}
      <Modal
        visible={showLockedPopup}
        animationType="fade"
        transparent={true}
        onRequestClose={() => setShowLockedPopup(false)}
      >
        <TouchableOpacity
          style={styles.lockedPopupOverlay}
          activeOpacity={1}
          onPress={() => setShowLockedPopup(false)}
        >
          <View style={[styles.lockedPopupCard, isLight && styles.lockedPopupCardLight]}>
            {/* Lock icon */}
            <View style={styles.lockedPopupIconContainer}>
              <Text style={styles.lockedPopupIcon}>🔒</Text>
            </View>

            {/* Title */}
            <Text style={[styles.lockedPopupTitle, isLight && styles.lockedPopupTitleLight]}>
              Set Locked
            </Text>

            {/* Message */}
            <Text style={[styles.lockedPopupMessage, isLight && styles.lockedPopupMessageLight]}>
              Complete the previous set to unlock this one
            </Text>

            {/* OK Button */}
            <TouchableOpacity
              style={styles.lockedPopupButton}
              onPress={() => setShowLockedPopup(false)}
            >
              <Text style={styles.lockedPopupButtonText}>Got it</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>

      {/* Sign Up Modal */}
      <Modal
        visible={showSignupModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowSignupModal(false)}
      >
        <View style={styles.signupOverlay}>
          <View style={[styles.signupCard, isLight && styles.signupCardLight]}>
            {/* Close button */}
            <TouchableOpacity
              style={styles.signupClose}
              onPress={() => setShowSignupModal(false)}
            >
              <Text style={styles.signupCloseText}>✕</Text>
            </TouchableOpacity>

            {/* Astronaut animation */}
            <View style={styles.signupIconContainer}>
              <LottieView
                source={require('../../assets/lottie/learn/planets/astronaut_complete.json')}
                autoPlay
                loop
                style={styles.signupAstronaut}
              />
            </View>

            {/* Title */}
            <Text style={[styles.signupTitle, isLight && styles.signupTitleLight]}>
              Create Your Account
            </Text>

            {/* Subtitle */}
            <Text style={[styles.signupSubtitle, isLight && styles.signupSubtitleLight]}>
              Sign up to save your progress and unlock your vocabulary learning journey
            </Text>

            {/* Features list */}
            <View style={styles.signupFeatures}>
              <View style={styles.signupFeatureRow}>
                <Check size={18} color="#4ED9CB" />
                <Text style={[styles.signupFeatureText, isLight && styles.signupFeatureTextLight]}>
                  Track your learning progress
                </Text>
              </View>
              <View style={styles.signupFeatureRow}>
                <Check size={18} color="#4ED9CB" />
                <Text style={[styles.signupFeatureText, isLight && styles.signupFeatureTextLight]}>
                  Sync across all devices
                </Text>
              </View>
              <View style={styles.signupFeatureRow}>
                <Check size={18} color="#4ED9CB" />
                <Text style={[styles.signupFeatureText, isLight && styles.signupFeatureTextLight]}>
                  Earn XP and maintain streaks
                </Text>
              </View>
            </View>

            {/* CTA Button */}
            <TouchableOpacity
              style={styles.signupCta}
              onPress={() => {
                setShowSignupModal(false);
                router.push('/profile');
              }}
            >
              <Text style={styles.signupCtaText}>Sign Up Free</Text>
            </TouchableOpacity>

            {/* Sign in link */}
            <TouchableOpacity
              onPress={() => {
                setShowSignupModal(false);
                router.push('/profile');
              }}
            >
              <Text style={[styles.signupSignIn, isLight && styles.signupSignInLight]}>
                Already have an account? <Text style={styles.signupSignInLink}>Sign In</Text>
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
  startButtonLocked: {
    backgroundColor: '#4A5568',
    shadowColor: '#4A5568',
  },
  centeredSetTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
    marginBottom: 12,
    textAlign: 'center',
    fontFamily: 'Ubuntu-Medium',
    textShadowColor: 'rgba(0,0,0,0.5)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 4,
  },
  // Locked popup styles
  lockedPopupOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  lockedPopupCard: {
    backgroundColor: '#1F2937',
    borderRadius: 24,
    padding: 32,
    alignItems: 'center',
    width: '100%',
    maxWidth: 320,
    borderWidth: 1,
    borderColor: 'rgba(78,217,203,0.2)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 10,
  },
  lockedPopupCardLight: {
    backgroundColor: '#FFFFFF',
    borderColor: 'rgba(78,217,203,0.3)',
  },
  lockedPopupIconContainer: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: 'rgba(78,217,203,0.15)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  lockedPopupIcon: {
    fontSize: 32,
  },
  lockedPopupTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 12,
    fontFamily: 'Feather-Bold',
  },
  lockedPopupTitleLight: {
    color: '#1F2937',
  },
  lockedPopupMessage: {
    fontSize: 16,
    color: '#9CA3AF',
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 24,
    fontFamily: 'Ubuntu-Regular',
  },
  lockedPopupMessageLight: {
    color: '#6B7280',
  },
  lockedPopupButton: {
    backgroundColor: '#4ED9CB',
    paddingVertical: 14,
    paddingHorizontal: 48,
    borderRadius: 25,
  },
  lockedPopupButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1A1A1A',
    fontFamily: 'Feather-Bold',
  },
  // Spacecraft animation styles
  spacecraftAnimContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: 80,
    height: 80,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
  },
  spacecraftEmoji: {
    fontSize: 40,
    transform: [{ rotate: '45deg' }], // Point rocket diagonally
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
  rocketFabAnimation: {
    width: 70,
    height: 70,
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
  // Sign Up Modal styles
  signupOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  signupCard: {
    backgroundColor: '#1F2937',
    borderRadius: 24,
    padding: 28,
    width: '100%',
    maxWidth: 360,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(78, 217, 203, 0.2)',
  },
  signupCardLight: {
    backgroundColor: '#FFFFFF',
    borderColor: 'rgba(78, 217, 203, 0.3)',
  },
  signupClose: {
    position: 'absolute',
    top: 16,
    right: 16,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  signupCloseText: {
    color: '#9CA3AF',
    fontSize: 18,
    fontWeight: '600',
  },
  signupIconContainer: {
    width: 120,
    height: 120,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
    marginTop: 8,
  },
  signupAstronaut: {
    width: 120,
    height: 120,
  },
  signupTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#FFFFFF',
    textAlign: 'center',
    marginBottom: 12,
    fontFamily: 'Feather-Bold',
  },
  signupTitleLight: {
    color: '#1F2937',
  },
  signupSubtitle: {
    fontSize: 15,
    color: '#9CA3AF',
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 22,
    paddingHorizontal: 8,
  },
  signupSubtitleLight: {
    color: '#6B7280',
  },
  signupFeatures: {
    width: '100%',
    marginBottom: 24,
  },
  signupFeatureRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 14,
    paddingHorizontal: 8,
  },
  signupFeatureText: {
    fontSize: 15,
    color: '#D1D5DB',
    marginLeft: 12,
  },
  signupFeatureTextLight: {
    color: '#4B5563',
  },
  signupCta: {
    backgroundColor: '#4ED9CB',
    borderRadius: 16,
    paddingVertical: 16,
    paddingHorizontal: 48,
    width: '100%',
    marginBottom: 16,
  },
  signupCtaText: {
    color: '#1F2937',
    fontSize: 17,
    fontWeight: '700',
    textAlign: 'center',
    fontFamily: 'Feather-Bold',
  },
  signupSignIn: {
    fontSize: 14,
    color: '#9CA3AF',
    textAlign: 'center',
  },
  signupSignInLight: {
    color: '#6B7280',
  },
  signupSignInLink: {
    color: '#4ED9CB',
    fontWeight: '600',
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

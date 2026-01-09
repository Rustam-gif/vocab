import React, { useState, useEffect, useCallback, useRef } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, SafeAreaView, Image, Animated, Easing, InteractionManager, Dimensions, DeviceEventEmitter } from 'react-native';
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
import { useAppStore } from '../../lib/store';
import { getTheme } from '../../lib/theme';
import TopStatusPanel from '../components/TopStatusPanel';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import LimitModal from '../../lib/LimitModal';
import { Lock, Check, Star, CheckCircle } from 'lucide-react-native';
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

  // Breathing animation for current level outer ring
  useEffect(() => {
    const breathing = Animated.loop(
      Animated.sequence([
        Animated.parallel([
          Animated.timing(levelPulseAnim, {
            toValue: 1.08,
            duration: 1800,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
          Animated.timing(levelPulseOpacity, {
            toValue: 0.2,
            duration: 1800,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
        ]),
        Animated.parallel([
          Animated.timing(levelPulseAnim, {
            toValue: 1,
            duration: 1800,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
          Animated.timing(levelPulseOpacity, {
            toValue: 0.5,
            duration: 1800,
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

  useFocusEffect(
    useCallback(() => {
      loadStoredLevel();
    }, [loadStoredLevel])
  );

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

      const setsWithProgress = withQuizzes.map((set, index) => {
        const flags = SetProgressService.getSetFlags(activeLevelId, set.id);
        const baseSet = {
          ...set,
          completed: typeof flags.completed === 'boolean' ? flags.completed : !!set.completed,
          inProgress: typeof flags.inProgress === 'boolean' ? flags.inProgress : !!set.inProgress,
          score: typeof flags.score === 'number' ? flags.score : set.score,
        };

        if (UNLOCK_ALL_SETS) {
          return { ...baseSet, locked: false } as any;
        }

        if (index === 0) {
          return baseSet;
        }
        const prevSet = withQuizzes[index - 1];
        const prevFlags = SetProgressService.getSetFlags(activeLevelId, prevSet.id);
        const prevCompleted = typeof prevFlags.completed === 'boolean' ? prevFlags.completed : !!prevSet.completed;
        return { ...baseSet, locked: !prevCompleted };
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
  }, [activeLevelId]);

  useEffect(() => { refreshLevel(); }, [refreshLevel]);

  useFocusEffect(
    useCallback(() => {
      const task = InteractionManager.runAfterInteractions(() => {
        refreshLevel();
      });
      return () => task.cancel?.();
    }, [refreshLevel])
  );

  const handleSetPress = (set: VocabSet & { locked?: boolean }) => {
    if (!activeLevelId) {
      router.push('/quiz/level-select');
      return;
    }

    if (set.locked) {
      return;
    }

    if (!isSignedIn) {
      setShowSignupModal(true);
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

  const renderNode = (set: VocabSet & { locked?: boolean }, index: number, isCurrentLevel: boolean) => {
    const position = getNodePosition(index);
    const offsetX = getNodeOffset(position);
    const isLocked = set.locked;
    const isCompleted = set.completed;
    const isQuiz = (set as any).type === 'quiz';
    // Only the first uncompleted, unlocked node in the CURRENT level is "current"
    const isCurrent = isCurrentLevel && index === currentSetIndex;

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
        <View style={[
          styles.coinEdge,
          // Available nodes show teal edge
          !isLocked && !isCompleted && !isCurrent && styles.coinEdgeCompleted,
          // Current node shows orange edge
          isCurrent && styles.coinEdgeActive,
          // Completed nodes show teal edge
          isCompleted && styles.coinEdgeCompleted,
          // Locked nodes show gray edge
          isLocked && styles.coinEdgeLocked,
          isLocked && !isLight && { backgroundColor: '#3A3A3A' },
          isQuiz && isCompleted && { backgroundColor: '#C94A6A' },
        ]} />

        {/* Main coin face */}
        <TouchableOpacity
          onPress={() => handleSetPress(set)}
          disabled={isLocked}
          activeOpacity={0.9}
          style={[
            styles.coinFace,
            // Available nodes (not locked, not completed) show as teal
            !isLocked && !isCompleted && !isCurrent && styles.coinFaceCompleted,
            // Current node shows as orange
            isCurrent && styles.coinFaceActive,
            // Completed nodes show as teal
            isCompleted && styles.coinFaceCompleted,
            // Locked nodes show as gray
            isLocked && styles.coinFaceLocked,
            isLocked && !isLight && { backgroundColor: '#4A4A4A', borderColor: 'rgba(255,255,255,0.1)' },
            isQuiz && isCompleted && { backgroundColor: '#F25E86' },
          ]}
        >
          {/* Glossy reflection highlight */}
          <View style={styles.coinReflection} pointerEvents="none" />
          <Image
            source={getIconSource(set.title, (set as any).type)}
            style={[styles.coinIcon, isLocked && styles.coinIconLocked]}
            resizeMode="contain"
          />
        </TouchableOpacity>

      </Animated.View>
    );
  };

  const renderConnector = (index: number, total: number) => {
    if (index >= total - 1) return null;

    const currentPos = getNodePosition(index);
    const nextPos = getNodePosition(index + 1);
    const currentX = getNodeOffset(currentPos);
    const nextX = getNodeOffset(nextPos);

    const set = currentLevel.sets[index];
    const isCompleted = set?.completed;
    const lineColor = isCompleted ? (isLight ? '#C4C4C4' : '#5A5A5A') : (isLight ? '#E5E7EB' : '#3A3A3A');

    const connectorHeight = NODE_SPACING - NODE_SIZE + 20;

    // Create smooth bezier curve between nodes
    const midY = connectorHeight / 2;
    const controlX1 = currentX;
    const controlX2 = nextX;
    const pathD = `M ${currentX} 0 C ${controlX1} ${midY}, ${controlX2} ${midY}, ${nextX} ${connectorHeight}`;

    return (
      <View key={`connector-${index}`} style={styles.connectorWrapper}>
        <Svg height={connectorHeight} width={SCREEN_WIDTH}>
          <Path
            d={pathD}
            stroke={lineColor}
            strokeWidth={3}
            strokeDasharray="8,8"
            fill="none"
          />
        </Svg>
      </View>
    );
  };

  const renderStarNode = () => {
    const allCompleted = progress.completed === progress.total && progress.total > 0;
    const lastIndex = currentLevel.sets.length;
    const position = getNodePosition(lastIndex);
    const offsetX = getNodeOffset(position);

    return (
      <View style={[styles.nodeWrapper, { left: offsetX - NODE_SIZE / 2 }]}>
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
      </View>
    );
  };

  // Render cat character decoration at specific positions
  const renderCatCharacter = (index: number, type: 'sitting' | 'playing', side: 'left' | 'right') => {
    const position = getNodePosition(index);
    const nodeX = getNodeOffset(position);
    // Position cat within screen bounds
    const catSize = 120;
    let catOffsetX;
    let catOffsetY = -10; // Default top position

    if (side === 'right') {
      // Position to the right of the node, but not off screen
      catOffsetX = Math.min(nodeX + NODE_SIZE + 10, SCREEN_WIDTH - catSize - 10);
    } else {
      // Position in the empty area on the far left side
      catOffsetX = 40;
      // Move up to sit in the empty space between connectors
      catOffsetY = NODE_SPACING / 2 - catSize / 2 - 110;
    }
    // Flip horizontally based on side
    const flipScale = side === 'left' ? -1 : 1;

    const catSource = type === 'sitting'
      ? require('../../assets/lottie/learn/Meditating_Giraffe.json')
      : require('../../assets/lottie/learn/Sloth_sleeping.json');

    return (
      <View
        key={`cat-${type}-${index}`}
        style={[
          styles.catCharacterWrapper,
          { left: catOffsetX, top: catOffsetY },
        ]}
      >
        <LottieView
          source={catSource}
          autoPlay
          loop
          style={{ width: catSize, height: catSize, transform: [{ scaleX: flipScale }] }}
        />
        {/* Ground shadow */}
        <View
          style={{
            position: 'absolute',
            top: catSize - 25,
            left: catSize / 2 - 35,
            width: 70,
            height: 14,
            borderRadius: 35,
            backgroundColor: 'rgba(0,0,0,0.12)',
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 0 },
            shadowOpacity: 0.1,
            shadowRadius: 6,
          }}
        />
      </View>
    );
  };

  // Render a level stage marker in the path as a big circle
  const renderLevelStage = (level: Level, isActive: boolean, isLocked: boolean, levelIndex: number) => {
    const isCompleted = highestLevel != null && getLevelWeight(level.id) < getLevelWeight(highestLevel);
    const isCurrent = activeLevelId === level.id;
    const offsetX = SCREEN_WIDTH / 2; // Center level nodes

    const nodeColor = isCompleted ? completedColor : isCurrent ? accent : lockedColor;

    // Initialize level animation if needed
    if (!levelNodeAnims.current[levelIndex]) {
      levelNodeAnims.current[levelIndex] = new Animated.Value(0);
      // Start entrance animation
      setTimeout(() => {
        Animated.spring(levelNodeAnims.current[levelIndex], {
          toValue: 1,
          friction: 6,
          tension: 50,
          useNativeDriver: true,
        }).start();
      }, levelIndex * 150);
    }

    const levelAnim = levelNodeAnims.current[levelIndex];
    const entranceScale = levelAnim.interpolate({ inputRange: [0, 1], outputRange: [0.3, 1] });
    const entranceOpacity = levelAnim.interpolate({ inputRange: [0, 1], outputRange: [0, 1] });

    return (
      <Animated.View
        key={`level-stage-${level.id}`}
        style={[
          styles.levelNodeWrapper,
          {
            opacity: entranceOpacity,
            transform: [{ scale: entranceScale }],
          },
        ]}
      >
        {/* Coin container - centers the 3D coin */}
        <View style={styles.levelCoinContainer}>
          {/* 3D coin edge for level node */}
          <View style={[
            styles.levelCoinEdge,
            isCurrent && styles.levelCoinEdgeCurrent,
            isCompleted && styles.levelCoinEdgeCompleted,
            isLocked && styles.levelCoinEdgeLocked,
            isLocked && !isLight && { backgroundColor: '#3A3A3A' },
          ]} />

          {/* Level coin face */}
          <TouchableOpacity
            onPress={() => !isLocked && handleLevelSelect(level.id)}
            activeOpacity={isLocked ? 1 : 0.9}
            style={[
              styles.levelCoinFace,
              isCurrent && styles.levelCoinFaceCurrent,
              isCompleted && styles.levelCoinFaceCompleted,
              isLocked && styles.levelCoinFaceLocked,
              isLocked && !isLight && { backgroundColor: '#4A4A4A', borderColor: 'rgba(255,255,255,0.1)' },
            ]}
          >
            {isCompleted ? (
              <Check size={50} color="#fff" strokeWidth={3} />
            ) : (
              <Image source={getLevelIcon(level.id)} style={[styles.levelCoinIcon, isLocked && styles.levelCoinIconLocked]} resizeMode="contain" />
            )}
          </TouchableOpacity>
        </View>
      </Animated.View>
    );
  };

  // Render vertical connector between level stages
  const renderLevelConnector = (isCompleted: boolean) => {
    const lineColor = isCompleted ? (isLight ? '#C4C4C4' : '#5A5A5A') : (isLight ? '#E5E7EB' : '#3A3A3A');
    return (
      <View style={styles.levelConnector}>
        <View style={[styles.levelConnectorLine, { backgroundColor: lineColor }]} />
      </View>
    );
  };

  // Separate core and specialized levels
  const coreLevels = sortedLevels.filter(l => CORE_SET.has(l.id));
  const specializedLevels = sortedLevels.filter(l => !CORE_SET.has(l.id));

  // Build the full path with levels and sets
  const buildFullPath = () => {
    const pathElements: JSX.Element[] = [];
    let globalSetIndex = 0;

    coreLevels.forEach((level, levelIndex) => {
      const isCurrentLevel = activeLevelId === level.id;
      const isCompletedLevel = highestLevel != null && getLevelWeight(level.id) < getLevelWeight(highestLevel);
      const isLockedLevel = highestLevel != null
        ? getLevelWeight(level.id) > getLevelWeight(highestLevel) + 1
        : levelIndex > 0;

      // Add level stage
      pathElements.push(renderLevelStage(level, isCurrentLevel, isLockedLevel && levelIndex > 0, levelIndex));

      // Show sets for this level
      const levelSets = isCurrentLevel && currentLevel ? currentLevel.sets : level.sets;
      if (levelSets && levelSets.length > 0) {
        // For non-current levels, mark all sets as locked
        const setsToRender = isCurrentLevel && currentLevel
          ? levelSets
          : levelSets.map(s => ({ ...s, locked: isLockedLevel, completed: isCompletedLevel }));

        pathElements.push(
          <View key={`sets-${level.id}`} style={styles.levelSetsContainer}>
            {setsToRender.map((set, index) => (
              <View key={`path-item-${index}`}>
                {/* Show sitting cat on the right side - only for current level */}
                {isCurrentLevel && index === 2 && renderCatCharacter(index, 'sitting', 'right')}
                {/* Show playing cat on the left side - only for current level */}
                {isCurrentLevel && index === 6 && renderCatCharacter(index, 'playing', 'left')}
                {renderNode(set as any, index, isCurrentLevel)}
                {renderConnector(index, setsToRender.length)}
              </View>
            ))}
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
      }

      // Add connector to next level
      if (levelIndex < coreLevels.length - 1) {
        pathElements.push(
          <View key={`level-connector-${levelIndex}`}>
            {renderLevelConnector(isCompletedLevel)}
          </View>
        );
      }
    });

    return pathElements;
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
        <TopStatusPanel floating includeTopInset />
        <ScrollView
          style={{ flex: 1, paddingTop: contentTop }}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* Path with levels as stages */}
          <View style={styles.pathContainer}>
            {buildFullPath()}
          </View>

          <View style={{ height: 100 }} />
        </ScrollView>

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
      </LinearGradient>

      <LimitModal
        visible={showSignupModal}
        title="Sign up required"
        message="Create an account to use Learn and keep your progress synced."
        onClose={() => setShowSignupModal(false)}
        onSubscribe={() => {
          setShowSignupModal(false);
          router.push('/profile');
        }}
        primaryText="Sign up"
        secondaryText="Not now"
      />
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
  catCharacterWrapper: {
    position: 'absolute',
    alignItems: 'center',
    zIndex: 5,
  },
});

import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, SafeAreaView, Image, Animated, Easing, InteractionManager } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useNavigation } from '@react-navigation/native';
import LottieView from 'lottie-react-native';
import { levels } from './data/levels';
import type { Level, Set as VocabSet } from './data/levels';
import SetCard from './components/SetCard';
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

const SELECTED_LEVEL_KEY = '@engniter.selectedLevel';
// Unlock all sets for testing; set to false for progression-gated flow
const UNLOCK_ALL_SETS = false;

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
  // Use a stable initial height to prevent layout jump when measured
  const [panelHeight, setPanelHeight] = useState<number>(insets.top + 48);
  const { level: levelId } = useLocalSearchParams<{ level: string }>();
  const [currentLevel, setCurrentLevel] = useState<Level | null>(null);
  const [progress, setProgress] = useState({ completed: 0, total: 0 });
  const [activeLevelId, setActiveLevelId] = useState<string | null>(levelId ?? null);
  const animatedValues = React.useRef<Animated.Value[]>([]);
  const [animSeed, setAnimSeed] = useState(0);

  const loadStoredLevel = useCallback(async () => {
    if (levelId) {
      await AsyncStorage.setItem(SELECTED_LEVEL_KEY, levelId);
      setActiveLevelId(levelId);
      return;
    }
    const stored = await AsyncStorage.getItem(SELECTED_LEVEL_KEY);
    if (stored) {
      setActiveLevelId(stored);
    } else if (levels && levels.length > 0) {
      // First run on a fresh standalone build: default to first available level
      const fallback = levels[0]?.id;
      if (fallback) {
        await AsyncStorage.setItem(SELECTED_LEVEL_KEY, fallback);
        setActiveLevelId(fallback);
      }
    }
  }, [levelId]);

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
      // Fallback: if stored level Id is missing or mismatched in a standalone build,
      // default to the first available level to ensure sets render.
      level = levels[0];
      try { await AsyncStorage.setItem(SELECTED_LEVEL_KEY, level.id); } catch {}
    }
    if (level) {
      await Promise.all([ProgressService.initialize(), SetProgressService.initialize()]);
      // Prune first 10 sets for Upper-Intermediate per request
      const baseSets = level.id === 'upper-intermediate'
        ? level.sets.filter(s => {
            const n = Number(s.id);
            return isNaN(n) || n > 10;
          })
        : level.sets;

      // Auto-insert recap quizzes after every 4 visible sets (all levels)
      // Quiz words order: A(0-4), B(5-9), C(10-14), D(15-19)
      const buildWithQuizzes = (sets: VocabSet[]) => {
        const nonQuiz = sets.filter(s => (s as any).type !== 'quiz');
        const result: VocabSet[] = [] as any;
        let groupIndex = 0;
        for (let i = 0; i < nonQuiz.length; i++) {
          result.push(nonQuiz[i]);
          const atGroupEnd = (i + 1) % 4 === 0;
          if (atGroupEnd) {
            const group = nonQuiz.slice(i - 3, i + 1);
            const words: any[] = [];
            // A, B, C, D each provide up to 5 words
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

      // Insert recap quizzes after every 4 visible sets for ALL levels
      const withQuizzes = buildWithQuizzes(baseSets as any);

      const setsWithProgress = withQuizzes.map((set, index) => {
        // Overlay persisted status onto static level data
        const flags = SetProgressService.getSetFlags(activeLevelId, set.id);
        const baseSet = {
          ...set,
          completed: typeof flags.completed === 'boolean' ? flags.completed : !!set.completed,
          inProgress: typeof flags.inProgress === 'boolean' ? flags.inProgress : !!set.inProgress,
          score: typeof flags.score === 'number' ? flags.score : set.score,
        };

        // Temporary: unlock everything for testing/review
        if (UNLOCK_ALL_SETS) {
          return { ...baseSet, locked: false } as any;
        }

        // Original lock logic (kept for later restore)
        if (index === 0) {
          return baseSet;
        }
        const prevSet = withQuizzes[index - 1];
        const prevFlags = SetProgressService.getSetFlags(activeLevelId, prevSet.id);
        const prevCompleted = typeof prevFlags.completed === 'boolean' ? prevFlags.completed : !!prevSet.completed;
        return { ...baseSet, locked: !prevCompleted };
      });

      // Keep original topic titles when available; do not force generic "Set N" labels
      const finalSets = setsWithProgress;

      const levelWithProgress = { ...level, sets: finalSets };
      // Pre-create animated values at 1 (visible) to avoid invisible content if animations fail in release
      animatedValues.current = finalSets.map(() => new Animated.Value(1));
      setCurrentLevel(levelWithProgress);

      const completed = finalSets.filter(s => s.completed).length;
      setProgress({ completed, total: finalSets.length });
    }
  }, [activeLevelId]);

  useEffect(() => { refreshLevel(); }, [refreshLevel]);

  useFocusEffect(
    useCallback(() => {
      // Defer refresh until animations/gestures settle to avoid press lag
      const task = InteractionManager.runAfterInteractions(() => {
        refreshLevel();
      });
      return () => task.cancel?.();
    }, [refreshLevel])
  );

  // Prepare and run "bubble" entrance animation for cards
  useEffect(() => {
    if (!currentLevel?.sets) return;
    // Ensure we have one animated value per item, initialized to 0
    if (animatedValues.current.length !== currentLevel.sets.length) {
      animatedValues.current = currentLevel.sets.map(() => new Animated.Value(0));
    }

    // Always animate (Release and Debug)
    animatedValues.current.forEach(v => v.setValue(0));
    const animations = animatedValues.current.map((v, i) =>
      Animated.timing(v, {
        toValue: 1,
        duration: 420,
        delay: i * 70,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      })
    );
    Animated.stagger(50, animations).start();
  }, [currentLevel?.sets?.length, animSeed]);

  const handleSetPress = (set: VocabSet & { locked?: boolean }) => {
    if (!activeLevelId) {
      router.push('/quiz/level-select');
      return;
    }

    // Don't allow navigation if the set is locked
    if (set.locked) {
      console.log('LearnScreen - Set is locked:', set.id);
      return;
    }

    // Check if user is signed in before starting
    if (!isSignedIn) {
      setShowSignupModal(true);
      return;
    }

    console.log('LearnScreen - handleSetPress:', { setId: set.id, levelId: activeLevelId, setType: set.type });

    // Both quiz and regular sets use atlas-practice-integrated
    const url = `/quiz/atlas-practice-integrated?setId=${set.id}&levelId=${activeLevelId}`;
    console.log('LearnScreen - Navigating to:', url);
    router.push(url);
  };

  const handleChangeLevel = () => {
    router.push('/quiz/level-select');
  };

  const renderSetItem = ({ item, index }: { item: VocabSet; index: number }) => {
    const getAutoTopic = (words: any[] | undefined): string | null => {
      if (!words || !words.length) return null;
      const w = new Set((words || []).map((x: any) => String(x.word || '').toLowerCase()));
      type Cat = { name: string; keys: string[] };
      const CATS: Cat[] = [
        { name: 'Travel & Booking', keys: ['pack','book','cancel','arrive','depart','ticket','travel','reserve','schedule','reschedule','confirm'] },
        { name: 'Health & Fitness', keys: ['stretch','hydrate','rest','breathe','exercise','sleep','stamina','endurance','run','jump'] },
        { name: 'Study Skills', keys: ['review','memorize','practice','summarize','focus','study','learn','write','read'] },
        { name: 'Home & DIY', keys: ['sweep','boil','fix','plant','measure','clean','repair','cook'] },
        { name: 'Weather & Nature', keys: ['shine','rain','snow','blow','fall','sun','tree','wind'] },
        { name: 'Shopping & Errands', keys: ['buy','pay','sell','send','bring','order'] },
        { name: 'Food & Cooking', keys: ['cook','drink','taste','chop','stir','serve'] },
        { name: 'Transport', keys: ['car','bus','walk','travel','ticket','train'] },
        { name: 'Home & Furniture', keys: ['room','table','chair','bed','door'] },
        { name: 'Culture & Entertainment', keys: ['movie','song','party','art','story','dance','music'] },
        { name: 'Meetings & Discussions', keys: ['agenda','minutes','adjourn','consensus','deliberate'] },
        { name: 'Email & Correspondence', keys: ['recipient','attachment','correspondence','acknowledge','forward'] },
        { name: 'Project Management', keys: ['milestone','deliverable','stakeholder','implement','coordinate'] },
        { name: 'Reports & Documentation', keys: ['summary','appendix','revision','footnote','proofread'] },
        { name: 'Presentations & Speaking', keys: ['slide','handout','projector','rehearse','engage'] },
        { name: 'Team Collaboration', keys: ['collaborate','delegate','facilitate','synergy','contribute'] },
        { name: 'Time Management', keys: ['prioritize','schedule','postpone','allocate','streamline'] },
        { name: 'Client Relations', keys: ['negotiate','proposal','quotation','rapport','retention'] },
      ];
      let best: { name: string; score: number } | null = null;
      for (const c of CATS) {
        let score = 0;
        for (const k of c.keys) if (w.has(k)) score++;
        if (!best || score > best.score) best = { name: c.name, score };
      }
      if (best && best.score >= 2) return best.name;
      return null;
    };

    const displayTitle = (() => {
      const raw = String(item.title || '').trim();
      // Remove CEFR prefix like "A1 — ", "B2 - ", etc.
      const mCefr = raw.match(/^(A[12]|B[12]|C[12])\s*(?:—|-)\s*(.+)$/i);
      if (mCefr && mCefr[2]) return mCefr[2].trim();
      // If title is like "Set 12 — Topic" keep the topic part; if only "Set 12" leave as-is
      const mSetTopic = raw.match(/^Set\s*\d+\s*(?:—|-|:)\s*(.+)$/i);
      if (mSetTopic && mSetTopic[1]) return mSetTopic[1].trim();
      // If title is only "Set N" or empty, try to infer from words
      const onlySet = /^Set\s*\d+$/i.test(raw) || raw.length === 0;
      if (onlySet) {
        const auto = getAutoTopic((item as any).words as any[]);
        if (auto) return auto;
      }
      return raw;
    })();
    const v = animatedValues.current[index] || new Animated.Value(1);
    const scale = v.interpolate({ inputRange: [0, 0.7, 1], outputRange: [0.96, 1, 1] });
    const opacity = v.interpolate({ inputRange: [0, 1], outputRange: [0, 1] });
    const translateY = v.interpolate({ inputRange: [0, 1], outputRange: [10, 0] });
    const isLocked = (item as any).locked;
    const isCompleted = !!item.completed;
    const isInProgress = !!(item as any).inProgress;
    const getFallbackCta = () => {
      if (isLocked) return 'Locked';
      if (isCompleted) return 'Review';
      if (isInProgress) return 'Continue';
      return 'Start';
    };

    const fallbackCard = (
      <TouchableOpacity
        activeOpacity={isLocked ? 1 : 0.7}
        onPress={() => {
          if (!isLocked) handleSetPress(item);
        }}
        style={{
          backgroundColor: '#2C2C2C',
          borderRadius: 12,
          padding: 12,
          marginBottom: 8,
          borderWidth: 1,
          borderColor: isLocked ? 'rgba(255,255,255,0.05)' : 'rgba(255,255,255,0.08)'
        }}
      >
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
          <View style={{ flex: 1, paddingRight: 10 }}>
            <Text style={{ color: '#fff', fontSize: 16, fontWeight: '700' }} numberOfLines={1}>
              {displayTitle}
            </Text>
            {!item.type && item.words && item.words.length > 0 ? (
              <Text style={{ color: '#9CA3AF', fontSize: 12 }} numberOfLines={1}>
                {item.words.slice(0, 3).map(w => w.word).join(', ')}
                {item.words.length > 3 ? '…' : ''}
              </Text>
            ) : null}
          </View>
          <View style={{
            paddingHorizontal: 14,
            paddingVertical: 8,
            borderRadius: 10,
            backgroundColor: isLocked ? 'rgba(100,100,100,0.4)' : isCompleted ? 'rgba(230,138,74,0.35)' : isInProgress ? '#d79a35' : '#3cb4ac'
          }}>
            <Text style={{ color: '#fff', fontWeight: '700' }}>{getFallbackCta()}</Text>
          </View>
        </View>
      </TouchableOpacity>
    );

    return (
      <Animated.View style={{ width: '100%', transform: [{ translateY }, { scale }], opacity }}>
        <ErrorBoundary fallback={fallbackCard}>
          <SetCard set={{ ...(item as any), title: displayTitle } as any} onPress={() => handleSetPress(item)} />
        </ErrorBoundary>
      </Animated.View>
    );
  };

  // Use fixed offset based on insets to prevent layout jump
  const contentTop = Math.max(0, insets.top - 30);

  if (!currentLevel) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
        <TopStatusPanel
          floating
          includeTopInset
        />
        <View style={[styles.loadingContainer, { paddingTop: contentTop }]}>
          <LottieView
            source={require('../../assets/lottie/loading.json')}
            autoPlay
            loop
            style={{ width: 140, height: 140 }}
          />
          <Text style={[styles.loadingText, theme === 'light' && { color: '#6B7280' }]}>Loading...</Text>
        </View>
      </SafeAreaView>
    );
  }

  const accent = '#F8B070';
  const progressPercentage = progress.total > 0 ? (progress.completed / progress.total) * 100 : 0;

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <TopStatusPanel
        floating
        includeTopInset
      />
      <View style={{ flex: 1, paddingTop: contentTop }}>
        <View style={[styles.levelInfo, isLight && styles.levelInfoLight]}>
          <View style={styles.levelHeader}>
            <Image
              source={
                currentLevel.id === 'beginner'
                  ? require('../../assets/levelicons/beginner.png')
                  : currentLevel.id === 'ielts'
                  ? require('../../assets/levelicons/ielts-vocabulary.png')
                  : currentLevel.id === 'intermediate'
                  ? require('../../assets/levelicons/intermediate.png')
                  : currentLevel.id === 'upper-intermediate'
                  ? require('../../assets/levelicons/upper-intermediate.png')
                  : currentLevel.id === 'proficient'
                  ? require('../../assets/levelicons/proficient.png')
                  : require('../../assets/levelicons/advanced.png')
              }
              style={styles.levelImage}
              resizeMode="contain"
            />
            <View style={styles.levelDetails}>
              <Text style={[styles.levelName, isLight && { color: '#111827' }]}>{currentLevel.name}</Text>
            <Text style={[styles.levelCefr, { color: accent }]}>CEFR {currentLevel.cefr}</Text>
            </View>
            <TouchableOpacity style={styles.changeButton} onPress={handleChangeLevel}>
              <Text style={styles.changeButtonText}>Change</Text>
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.progressContainer}>
          <View style={styles.progressHeader}>
            <Text style={[styles.progressText, isLight && { color: '#4B5563' }]}>
              {progress.completed}/{progress.total} sets completed
            </Text>
            <Text style={[styles.progressPercentage, { color: accent }]}>{Math.round(progressPercentage)}%</Text>
          </View>
          <View style={styles.progressBar}>
            <View 
              style={[
                styles.progressFill, 
                { width: `${progressPercentage}%`, backgroundColor: accent }
              ]} 
            />
          </View>
        </View>

        <FlatList
          data={currentLevel.sets}
          renderItem={renderSetItem}
          keyExtractor={(item, index) => `${activeLevelId || 'level'}-${String(item.id)}-${index}`}
          contentContainerStyle={styles.listContainer}
          showsVerticalScrollIndicator={false}
        />
      </View>

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
    </SafeAreaView>
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
    justifyContent: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  title: {
    fontSize: 20,
    fontWeight: '600',
    color: '#fff',
    textAlign: 'center',
    fontFamily: 'Ubuntu-Medium',
  },
  levelInfo: {
    backgroundColor: '#2C2C2C',
    margin: 20,
    borderRadius: 12,
    padding: 16,
  },
  levelInfoLight: {
    backgroundColor: '#FFFFFF',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: '#FFFFFF',
  },
  levelHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  levelImage: {
    width: 40,
    height: 40,
    marginRight: 20,
  },
  levelDetails: {
    flex: 1,
  },
  levelName: {
    fontSize: 22,
    fontWeight: '600',
    color: '#fff',
    marginBottom: 6,
    fontFamily: 'Ubuntu-Medium',
  },
  levelCefr: {
    fontSize: 16,
    color: '#F8B070',
    fontWeight: '600',
    letterSpacing: 0.5,
    fontFamily: 'Ubuntu-Medium',
  },
  changeButton: {
    backgroundColor: 'transparent',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#187486',
  },
  changeButtonText: {
    color: '#187486',
    fontSize: 12,
  },
  progressContainer: {
    paddingHorizontal: 20,
    marginBottom: 12,
  },
  progressHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  progressText: {
    fontSize: 16,
    color: '#D1D5DB',
    fontFamily: 'Ubuntu-Regular',
  },
  progressPercentage: {
    fontSize: 16,
    fontWeight: '600',
  },
  progressBar: {
    height: 8,
    backgroundColor: 'rgba(248, 176, 112, 0.16)',
    borderRadius: 8,
    overflow: 'hidden',
  },
  progressFill: {
    height: 8,
    borderRadius: 8,
  },
  listContainer: {
    paddingHorizontal: 20,
    paddingBottom: 32,
    paddingTop: 12,
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
});

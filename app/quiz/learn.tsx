import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, SafeAreaView, Image, Animated, Easing } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useNavigation } from '@react-navigation/native';
import { ArrowLeft, Settings } from 'lucide-react-native';
import { levels, Level, Set } from './data/levels';
import SetCard from './components/SetCard';
import ErrorBoundary from './components/ErrorBoundary';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFocusEffect } from '@react-navigation/native';
import { ProgressService } from '../../services/ProgressService';
import { SetProgressService } from '../../services/SetProgressService';
import { useAppStore } from '../../lib/store';
import { getTheme } from '../../lib/theme';

const SELECTED_LEVEL_KEY = '@engniter.selectedLevel';
// Temporary flag to unlock all sets regardless of previous completion
const UNLOCK_ALL_SETS = true;

export default function LearnScreen() {
  const router = useRouter();
  const navigation = useNavigation<any>();
  const theme = useAppStore(s => s.theme);
  const colors = getTheme(theme);
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
    loadStoredLevel();
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

      // Auto-insert recap quizzes after every 4 visible sets (Upper-Intermediate)
      // Quiz words order: A(0-4), B(5-9), C(10-14), D(15-19)
      const buildWithQuizzes = (sets: Set[]) => {
        const nonQuiz = sets.filter(s => s.type !== 'quiz');
        const result: Set[] = [] as any;
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
            result.push(quiz as Set);
          }
        }
        return result;
      };

      const withQuizzes = level.id === 'upper-intermediate' ? buildWithQuizzes(baseSets as any) : baseSets;

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

      // For Upper-Intermediate, renumber only non-quiz sets so titles start at "Set 1"
      const numberedSets = level.id === 'upper-intermediate'
        ? (() => {
            let count = 0;
            return setsWithProgress.map(s => {
              if ((s as any).type === 'quiz') return s;
              count += 1;
              return { ...s, title: `Set ${count}` } as any;
            });
          })()
        : setsWithProgress;

      const levelWithProgress = { ...level, sets: numberedSets };
      // Pre-create animated values at 1 (visible) to avoid invisible content if animations fail in release
      animatedValues.current = numberedSets.map(() => new Animated.Value(1));
      setCurrentLevel(levelWithProgress);

      const completed = numberedSets.filter(s => s.completed).length;
      setProgress({ completed, total: numberedSets.length });
    }
  }, [activeLevelId]);

  useEffect(() => { refreshLevel(); }, [refreshLevel]);

  useFocusEffect(
    useCallback(() => {
      // Refresh data when returning, but do not replay the entrance animation
      refreshLevel();
    }, [refreshLevel])
  );

  // Prepare and run "bubble" entrance animation for cards
  useEffect(() => {
    if (!currentLevel?.sets) return;
    // Ensure we have one animated value per item, initialized to 0
    if (animatedValues.current.length !== currentLevel.sets.length) {
      animatedValues.current = currentLevel.sets.map(() => new Animated.Value(1));
    }

    // In development, play the entrance animation; in production keep items visible.
    // Some standalone builds may skip animations, leaving values at 0 if initialized that way.
    if (__DEV__) {
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
    } else {
      // Ensure fully visible in release
      animatedValues.current.forEach(v => v.setValue(1));
    }
  }, [currentLevel?.sets?.length, animSeed]);

  const handleSetPress = (set: Set & { locked?: boolean }) => {
    if (!activeLevelId) {
      router.push('/quiz/level-select');
      return;
    }

    // Don't allow navigation if the set is locked
    if (set.locked) {
      console.log('LearnScreen - Set is locked:', set.id);
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

  const renderSetItem = ({ item, index }: { item: Set; index: number }) => {
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
              {item.title}
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
          <SetCard set={item} onPress={() => handleSetPress(item)} />
        </ErrorBoundary>
      </Animated.View>
    );
  };

  if (!currentLevel) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Loading...</Text>
        </View>
      </SafeAreaView>
    );
  }

  const accent = '#F2935C';
  const progressPercentage = progress.total > 0 ? (progress.completed / progress.total) * 100 : 0;

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => {
            try {
              if (navigation?.canGoBack && navigation.canGoBack()) {
                router.back();
              } else {
                router.replace('/');
              }
            } catch {
              router.replace('/');
            }
          }}
        >
          <ArrowLeft size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.title}>Learn</Text>
        <TouchableOpacity
          style={styles.settingsButton}
          onPress={handleChangeLevel}
        >
          <Settings size={24} color="#fff" />
        </TouchableOpacity>
      </View>

      <View style={styles.levelInfo}>
        <View style={styles.levelHeader}>
          <Image
            source={
              currentLevel.id === 'beginner'
                ? require('../../assets/levelicons/beginner.png')
                : currentLevel.id === 'ielts'
                ? require('../../assets/levelicons/ielts-topics.png')
                : currentLevel.id === 'intermediate'
                ? require('../../assets/levelicons/intermediate.png')
                : currentLevel.id === 'advanced'
                ? require('../../assets/levelicons/advanced-mountain.png')
                : require('../../assets/levelicons/advanced-plus.png')
            }
            style={styles.levelImage}
            resizeMode="contain"
          />
          <View style={styles.levelDetails}>
            <Text style={styles.levelName}>{currentLevel.name}</Text>
          <Text style={[styles.levelCefr, { color: accent }]}>CEFR {currentLevel.cefr}</Text>
          </View>
          <TouchableOpacity style={styles.changeButton} onPress={handleChangeLevel}>
            <Text style={styles.changeButtonText}>Change</Text>
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.progressContainer}>
        <View style={styles.progressHeader}>
          <Text style={styles.progressText}>
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
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  backButton: {
    padding: 8,
  },
  title: {
    fontSize: 20,
    fontWeight: '600',
    color: '#fff',
    flex: 1,
    textAlign: 'center',
    fontFamily: 'Ubuntu_500Medium',
  },
  settingsButton: {
    padding: 8,
  },
  levelInfo: {
    backgroundColor: '#2C2C2C',
    margin: 20,
    borderRadius: 12,
    padding: 16,
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
    fontFamily: 'Ubuntu_500Medium',
  },
  levelCefr: {
    fontSize: 16,
    color: '#F2935C',
    fontWeight: '600',
    letterSpacing: 0.5,
    fontFamily: 'Ubuntu_500Medium',
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
    fontFamily: 'Ubuntu_400Regular',
  },
  progressPercentage: {
    fontSize: 16,
    fontWeight: '600',
  },
  progressBar: {
    height: 8,
    backgroundColor: 'rgba(242, 147, 92, 0.16)',
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

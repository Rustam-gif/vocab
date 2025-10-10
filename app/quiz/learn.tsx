import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, SafeAreaView, Image, Animated, Easing } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useNavigation } from '@react-navigation/native';
import { ArrowLeft, Settings } from 'lucide-react-native';
import { levels, Level, Set } from './data/levels';
import SetCard from './components/SetCard';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFocusEffect } from '@react-navigation/native';
import { ProgressService } from '../../services/ProgressService';
import { SetProgressService } from '../../services/SetProgressService';
import { useAppStore } from '../../lib/store';
import { getTheme } from '../../lib/theme';

const SELECTED_LEVEL_KEY = '@engniter.selectedLevel';

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

    const level = levels.find(l => l.id === activeLevelId);
    if (level) {
      await Promise.all([ProgressService.initialize(), SetProgressService.initialize()]);

      const setsWithProgress = level.sets.map((set, index) => {
        // Overlay persisted status onto static level data
        const flags = SetProgressService.getSetFlags(activeLevelId, set.id);
        const baseSet = {
          ...set,
          completed: typeof flags.completed === 'boolean' ? flags.completed : !!set.completed,
          inProgress: typeof flags.inProgress === 'boolean' ? flags.inProgress : !!set.inProgress,
          score: typeof flags.score === 'number' ? flags.score : set.score,
        };

        // First set is always unlocked
        if (index === 0) {
          return baseSet;
        }

        // For all other sets (including quizzes), check if previous set is completed
        const prevSet = level.sets[index - 1];
        const prevFlags = SetProgressService.getSetFlags(activeLevelId, prevSet.id);
        const prevCompleted = typeof prevFlags.completed === 'boolean' ? prevFlags.completed : !!prevSet.completed;
        
        // Set is locked if the previous set is not completed
        const isLocked = !prevCompleted;
        return { ...baseSet, locked: isLocked };
      });

      const levelWithProgress = { ...level, sets: setsWithProgress };
      // Pre-create animated values at 0 before rendering to prevent initial flash
      animatedValues.current = setsWithProgress.map(() => new Animated.Value(0));
      setCurrentLevel(levelWithProgress);

      const completed = setsWithProgress.filter(s => s.completed).length;
      setProgress({ completed, total: setsWithProgress.length });
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
      animatedValues.current = currentLevel.sets.map(() => new Animated.Value(0));
    }
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
    const v = animatedValues.current[index] || new Animated.Value(0);
    const scale = v.interpolate({ inputRange: [0, 0.7, 1], outputRange: [0.96, 1, 1] });
    const opacity = v.interpolate({ inputRange: [0, 1], outputRange: [0, 1] });
    const translateY = v.interpolate({ inputRange: [0, 1], outputRange: [10, 0] });
    return (
      <Animated.View style={{ width: '100%', transform: [{ translateY }, { scale }], opacity }}>
        <SetCard set={item} onPress={() => handleSetPress(item)} />
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

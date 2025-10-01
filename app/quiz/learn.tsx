import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, SafeAreaView } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { ArrowLeft, Settings } from 'lucide-react-native';
import { levels, Level, Set } from './data/levels';
import SetCard from './components/SetCard';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFocusEffect } from '@react-navigation/native';
import ProgressService from '../../services/ProgressService';

const SELECTED_LEVEL_KEY = '@engniter.selectedLevel';

export default function LearnScreen() {
  const router = useRouter();
  const { level: levelId } = useLocalSearchParams<{ level: string }>();
  const [currentLevel, setCurrentLevel] = useState<Level | null>(null);
  const [progress, setProgress] = useState({ completed: 0, total: 0 });
  const [activeLevelId, setActiveLevelId] = useState<string | null>(levelId ?? null);

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

  useEffect(() => {
    const loadLevelWithProgress = async () => {
      if (!activeLevelId) {
        setCurrentLevel(null);
        return;
      }
      
      const level = levels.find(l => l.id === activeLevelId);
      if (level) {
        // Initialize ProgressService and get progress data
        const progressService = ProgressService.getInstance();
        await progressService.initialize();
        
        // TEMPORARY: Clear test data - ALREADY RUN, COMMENTED OUT
        // await AsyncStorage.removeItem('set_progress');
        // await AsyncStorage.removeItem('user_progress');
        
        // Merge sets with progress data
        const setsWithProgress = await Promise.all(
          level.sets.map(async (set) => {
            const setProgress = await progressService.getSetProgress(`${set.id}`);
            return {
              ...set,
              completed: setProgress?.completed || set.completed,
              inProgress: setProgress ? (!setProgress.completed && setProgress.attempts > 0) : set.inProgress,
              score: setProgress?.bestScore || set.score
            };
          })
        );
        
        const levelWithProgress = { ...level, sets: setsWithProgress };
        setCurrentLevel(levelWithProgress);
        
        const completed = setsWithProgress.filter(s => s.completed).length;
        setProgress({ completed, total: setsWithProgress.length });
      }
    };
    
    loadLevelWithProgress();
  }, [activeLevelId]);

  const handleSetPress = (set: Set) => {
    if (!activeLevelId) {
      router.push('/quiz/level-select');
      return;
    }
    console.log('LearnScreen - handleSetPress:', { setId: set.id, levelId: activeLevelId, setType: set.type });

    if (set.type === 'quiz') {
      // Navigate to quiz screen
      router.push(`/quiz/quiz-screen?setId=${set.id}&level=${activeLevelId}`);
    } else {
      // Navigate directly to practice session
      const url = `/quiz/atlas-practice-integrated?setId=${set.id}&levelId=${activeLevelId}`;
      console.log('LearnScreen - Navigating to:', url);
      router.push(url);
    }
  };

  const handleChangeLevel = () => {
    router.push('/quiz/level-select');
  };

  const renderSetItem = ({ item }: { item: Set }) => (
    <SetCard set={item} onPress={() => handleSetPress(item)} />
  );

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
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.replace('/')}
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

      {/* Level Info */}
      <View style={styles.levelInfo}>
        <View style={styles.levelHeader}>
          <Text style={styles.levelIcon}>{currentLevel.icon}</Text>
          <View style={styles.levelDetails}>
            <Text style={styles.levelName}>{currentLevel.name}</Text>
          <Text style={[styles.levelCefr, { color: accent }]}>CEFR {currentLevel.cefr}</Text>
          </View>
          <TouchableOpacity style={styles.changeButton} onPress={handleChangeLevel}>
            <Text style={styles.changeButtonText}>Change</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Progress */}
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

      {/* Sets List */}
      <FlatList
        data={currentLevel.sets}
        renderItem={renderSetItem}
        keyExtractor={(item) => item.id.toString()}
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
    fontSize: 18,
    fontWeight: '600',
    color: '#fff',
    flex: 1,
    textAlign: 'center',
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
  levelIcon: {
    fontSize: 40,
    marginRight: 20,
  },
  levelDetails: {
    flex: 1,
  },
  levelName: {
    fontSize: 20,
    fontWeight: '600',
    color: '#fff',
    marginBottom: 6,
  },
  levelCefr: {
    fontSize: 14,
    color: '#F2935C',
    fontWeight: '600',
    letterSpacing: 0.5,
  },
  changeButton: {
    backgroundColor: 'transparent',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#F2935C',
  },
  changeButtonText: {
    color: '#F2935C',
    fontSize: 12,
    fontWeight: '500',
  },
  progressContainer: {
    marginHorizontal: 20,
    marginBottom: 20,
  },
  progressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  progressText: {
    fontSize: 14,
    color: '#9CA3AF',
  },
  progressPercentage: {
    fontSize: 14,
    color: '#F2935C',
    fontWeight: '600',
  },
  progressBar: {
    height: 6,
    backgroundColor: '#2C2C2C',
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#F2935C',
    borderRadius: 3,
  },
  listContainer: {
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 16,
    color: '#9CA3AF',
  },
});

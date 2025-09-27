import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, SafeAreaView } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { ArrowLeft, Settings, TrendingUp } from 'lucide-react-native';
import { levels, Level, Set } from './data/levels';
import SetCard from './components/SetCard';

export default function LearnScreen() {
  const router = useRouter();
  const { level: levelId } = useLocalSearchParams<{ level: string }>();
  const [currentLevel, setCurrentLevel] = useState<Level | null>(null);
  const [progress, setProgress] = useState({ completed: 0, total: 0 });

  useEffect(() => {
    if (levelId) {
      const level = levels.find(l => l.id === levelId);
      if (level) {
        setCurrentLevel(level);
        const completed = level.sets.filter(s => s.completed).length;
        setProgress({ completed, total: level.sets.length });
      }
    }
  }, [levelId]);

  const handleSetPress = (set: Set) => {
    console.log('LearnScreen - handleSetPress:', { setId: set.id, levelId, setType: set.type });
    
    if (set.type === 'quiz') {
      // Navigate to quiz screen
      router.push(`/quiz/quiz-screen?setId=${set.id}&level=${levelId}`);
    } else {
      // Navigate directly to practice session
      const url = `/quiz/atlas-practice-integrated?setId=${set.id}&levelId=${levelId}`;
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

  const progressPercentage = progress.total > 0 ? (progress.completed / progress.total) * 100 : 0;

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}
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
            <Text style={styles.levelCefr}>CEFR {currentLevel.cefr}</Text>
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
          <Text style={styles.progressPercentage}>{Math.round(progressPercentage)}%</Text>
        </View>
        <View style={styles.progressBar}>
          <View 
            style={[
              styles.progressFill, 
              { width: `${progressPercentage}%` }
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
    backgroundColor: '#252525',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#333',
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
    backgroundColor: '#3A3A3A',
    margin: 20,
    borderRadius: 16,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  levelHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  levelIcon: {
    fontSize: 32,
    marginRight: 16,
  },
  levelDetails: {
    flex: 1,
  },
  levelName: {
    fontSize: 20,
    fontWeight: '600',
    color: '#fff',
    marginBottom: 4,
  },
  levelCefr: {
    fontSize: 14,
    color: '#4CAF50',
    fontWeight: '500',
  },
  changeButton: {
    backgroundColor: '#333',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  changeButtonText: {
    fontSize: 12,
    fontWeight: '500',
    color: '#fff',
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
    color: '#4CAF50',
    fontWeight: '600',
  },
  progressBar: {
    height: 6,
    backgroundColor: '#333',
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#4CAF50',
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

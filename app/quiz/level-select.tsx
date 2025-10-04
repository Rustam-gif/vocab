import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, SafeAreaView, Image } from 'react-native';
import { useRouter } from 'expo-router';
import { ArrowLeft, Check } from 'lucide-react-native';
import { levels, Level } from './data/levels';
import AsyncStorage from '@react-native-async-storage/async-storage';

const SELECTED_LEVEL_KEY = '@engniter.selectedLevel';

export default function LevelSelectScreen() {
  const router = useRouter();
  const [selectedLevel, setSelectedLevel] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;
    AsyncStorage.getItem(SELECTED_LEVEL_KEY).then(stored => {
      if (!mounted) return;
      if (stored) setSelectedLevel(stored);
      else if (levels.length > 0) setSelectedLevel(levels[0].id);
    });
    return () => {
      mounted = false;
    };
  }, []);

  const handleLevelSelect = (levelId: string) => {
    setSelectedLevel(levelId);
  };

  const handleContinue = () => {
    if (!selectedLevel) return;
    AsyncStorage.setItem(SELECTED_LEVEL_KEY, selectedLevel).then(() => {
      router.replace(`/quiz/learn?level=${selectedLevel}`);
    });
  };

  if (!levels || levels.length === 0) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => router.back()}
          >
            <ArrowLeft size={24} color="#fff" />
          </TouchableOpacity>
          <Text style={styles.title}>Select a Level</Text>
          <View style={styles.placeholder} />
        </View>
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>No levels available</Text>
        </View>
      </SafeAreaView>
    );
  }

  const accent = '#F2935C';

  const getLevelIcon = (id: string) => {
    switch (id) {
      case 'beginner':
        return require('../../assets/levelicons/beginner.png');
      case 'intermediate':
        return require('../../assets/levelicons/intermediate.png');
      case 'upper-intermediate':
        return require('../../assets/levelicons/upper-intermediate.png');
      case 'advanced':
        return require('../../assets/levelicons/advanced-mountain.png');
      case 'advanced-plus':
        return require('../../assets/levelicons/advanced-plus.png');
      case 'proficient':
        return require('../../assets/levelicons/proficient.png');
      default:
        return require('../../assets/levelicons/beginner.png');
    }
  };

  const renderLevelItem = ({ item }: { item: Level }) => {
    const isSelected = selectedLevel === item.id;
    
    return (
      <TouchableOpacity
        style={[styles.levelCard, isSelected && styles.selectedCard, isSelected && { borderColor: accent }]}
        onPress={() => handleLevelSelect(item.id)}
      >
        <View style={styles.levelHeader}>
          <View style={styles.levelInfo}>
            <Image source={getLevelIcon(item.id)} style={styles.levelImage} resizeMode="contain" />
            <View style={styles.levelDetails}>
              <Text style={styles.levelName}>{item.name}</Text>
              <Text style={styles.levelDescription}>{item.description}</Text>
              <Text style={[styles.levelCefr, { color: accent }]}>CEFR {item.cefr}</Text>
            </View>
          </View>
          {isSelected && <Check size={20} color={accent} />}
        </View>
      </TouchableOpacity>
    );
  };

  const canContinue = Boolean(selectedLevel);

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
        <Text style={styles.title}>Select a Level</Text>
        <View style={styles.placeholder} />
      </View>

      {/* Levels List */}
      <FlatList
        data={levels}
        renderItem={renderLevelItem}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContainer}
        showsVerticalScrollIndicator={false}
      />

      {/* Continue Button */}
      <View style={styles.footer}>
        <TouchableOpacity
          style={[styles.continueButton, { backgroundColor: accent }, !canContinue && styles.continueButtonDisabled]}
          onPress={handleContinue}
          disabled={!canContinue}
        >
          <Text style={styles.continueButtonText}>Continue</Text>
        </TouchableOpacity>
      </View>
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
    fontFamily: 'Ubuntu_500Medium',
  },
  placeholder: {
    width: 40,
  },
  listContainer: {
    padding: 20,
    paddingBottom: 100,
  },
  levelCard: {
    backgroundColor: '#2A2A2A',
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    borderWidth: 2,
    borderColor: 'transparent',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  selectedCard: {
    backgroundColor: '#3A3A3A',
  },
  levelHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  levelInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
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
    fontFamily: 'Ubuntu_500Medium',
  },
  levelDescription: {
    fontSize: 15,
    color: '#9CA3AF',
    marginBottom: 2,
    fontFamily: 'Ubuntu_400Regular',
  },
  levelCefr: {
    fontSize: 13,
    color: '#F2935C',
    fontWeight: '500',
    fontFamily: 'Ubuntu_500Medium',
  },
  checkContainer: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#F2935C',
    justifyContent: 'center',
    alignItems: 'center',
  },
  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#1E1E1E',
    padding: 20,
  },
  continueButton: {
    backgroundColor: '#F2935C',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  continueButtonDisabled: {
    opacity: 0.5,
  },
  continueButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
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
});

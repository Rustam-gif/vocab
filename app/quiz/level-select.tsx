import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, SafeAreaView, Image } from 'react-native';
import { useRouter } from 'expo-router';
import { ArrowLeft, Check, CheckCircle } from 'lucide-react-native';
import { levels, Level } from './data/levels';
import { useAppStore } from '../../lib/store';
import { getTheme } from '../../lib/theme';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const SELECTED_LEVEL_KEY = '@engniter.selectedLevel';
const HIGHEST_LEVEL_KEY = '@engniter.highestLevel';

export default function LevelSelectScreen() {
  const router = useRouter();
  const [selectedLevel, setSelectedLevel] = useState<string | null>(null);
  const [highestLevel, setHighestLevel] = useState<string | null>(null);
  const themeName = useAppStore(s => s.theme);
  const colors = getTheme(themeName);
  const isLight = themeName === 'light';
  const insets = useSafeAreaInsets();

  useEffect(() => {
    let mounted = true;
    AsyncStorage.getItem(SELECTED_LEVEL_KEY).then(stored => {
      if (!mounted) return;
      // Exclude Advanced Plus from selection; normalize any stored value
      const availableLevels = levels.filter(l => l.id !== 'advanced-plus');
      const defaultId = availableLevels[0]?.id || null;
      const isValidStored = stored && availableLevels.some(l => l.id === stored);
      if (isValidStored) setSelectedLevel(stored as string);
      else if (defaultId) setSelectedLevel(defaultId);
    });
    AsyncStorage.getItem(HIGHEST_LEVEL_KEY).then(v => {
      if (!mounted) return;
      if (v) setHighestLevel(v);
    });
    return () => {
      mounted = false;
    };
  }, []);

  // Do not auto-upgrade highestLevel on selection; it should only
  // reflect placement results or actual completions.

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

  const accent = '#F8B070';

  // Desired ordering for core CEFR levels
  // Build list excluding Advanced Plus
  const availableLevels = levels.filter(l => l.id !== 'advanced-plus');

  const coreOrder = [
    'beginner',
    'intermediate',
    'upper-intermediate',
    'advanced',
    'proficient',
  ];
  const coreSet = new Set(coreOrder);
  const weight = (id: string) => {
    const idx = coreOrder.indexOf(id);
    if (idx >= 0) return idx;
    // Specialized and other levels go after core, sorted by name
    return 100 + id.charCodeAt(0);
  };
  const sortedLevels = [...availableLevels].sort((a, b) => weight(a.id) - weight(b.id));
  const firstSpecialIndex = sortedLevels.findIndex(l => !coreSet.has(l.id));

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
      // 'advanced-plus' intentionally hidden from selection
      case 'proficient':
        return require('../../assets/levelicons/proficient.png');
      default:
        return require('../../assets/levelicons/beginner.png');
    }
  };

  const renderLevelItem = ({ item }: { item: Level }) => {
    const isSelected = selectedLevel === item.id;
    const coreOrder = ['beginner', 'intermediate', 'upper-intermediate', 'advanced', 'proficient'];
    const weight = (id: string) => {
      const i = coreOrder.indexOf(id);
      return i >= 0 ? i : 999;
    };
    const isCore = coreOrder.includes(item.id);
    const isCompleted = isCore && highestLevel != null && weight(item.id) <= weight(highestLevel);
    const isCurrent = isCore && highestLevel === item.id;
    const isPassed = isCore && highestLevel != null && weight(item.id) < weight(highestLevel);
    
    return (
      <TouchableOpacity
        style={[
          styles.levelCard,
          isLight && styles.levelCardLight,
          isSelected && (isLight ? styles.selectedCardLight : styles.selectedCard),
          isSelected && { borderColor: accent },
          isPassed && styles.completedCard,
          isPassed && isLight && styles.completedCardLight,
        ]}
        onPress={() => handleLevelSelect(item.id)}
      >
        {isPassed && (
          <View style={[styles.ribbon, isLight && styles.ribbonLight]}>
            <Text style={[styles.ribbonText, isLight && styles.ribbonTextLight]}>PASSED</Text>
          </View>
        )}
        <View style={styles.levelHeader}>
          <View style={styles.levelInfo}>
            <Image source={getLevelIcon(item.id)} style={styles.levelImage} resizeMode="contain" />
            <View style={styles.levelDetails}>
              <Text style={[styles.levelName, isLight && { color: '#111827' }]}>{item.name}</Text>
              <Text style={[styles.levelDescription, isLight && { color: '#4B5563' }]}>{item.description}</Text>
              <Text style={[styles.levelCefr, { color: accent }]}>CEFR {item.cefr}</Text>
            </View>
          </View>
          <View style={styles.badgeArea}>
            {isCompleted && (
              <View style={[styles.completedBadge, isLight && styles.completedBadgeLight]}>
                <CheckCircle size={14} color={isLight ? '#10B981' : '#10B981'} />
                <Text style={[styles.completedText, isLight && styles.completedTextLight]}>{isCurrent ? 'Current' : 'Completed'}</Text>
              </View>
            )}
            {isSelected && <Check size={20} color={accent} />}
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  const canContinue = Boolean(selectedLevel);

  return (
    <SafeAreaView style={[styles.container, isLight && { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <ArrowLeft size={24} color={isLight ? '#111827' : '#fff'} />
        </TouchableOpacity>
        <Text style={[styles.title, isLight && { color: '#111827' }]}>Select a Level</Text>
        <View style={styles.placeholder} />
      </View>

      {/* Levels List */}
      <FlatList
        data={sortedLevels}
        renderItem={({ item, index }) => (
          <>
            {index === 0 && (
              <Text style={[styles.sectionLabel, isLight && { color: '#6B7280' }]}>Core Levels</Text>
            )}
            {index === firstSpecialIndex && (
              <Text style={[styles.sectionLabel, isLight && { color: '#6B7280' }]}>Specialized</Text>
            )}
            {renderLevelItem({ item })}
          </>
        )}
        keyExtractor={(item) => item.id}
        contentContainerStyle={[
          styles.listContainer,
          { paddingBottom: 200 + insets.bottom },
        ]}
        showsVerticalScrollIndicator={false}
      />

      {/* Continue Button */}
      <View
        style={[
          styles.footer,
          isLight && { backgroundColor: colors.background },
          { paddingBottom: insets.bottom + 50 },
        ]}
      >
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
    fontSize: 16, // reduced ~10%
    fontWeight: '600',
    color: '#fff',
    flex: 1,
    textAlign: 'center',
    fontFamily: 'Ubuntu-Medium',
  },
  placeholder: {
    width: 40,
  },
  listContainer: {
    padding: 20,
    paddingBottom: 100,
  },
  sectionLabel: {
    fontSize: 12,
    color: '#9CA3AF',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 8,
    marginTop: 4,
    marginLeft: 4,
    fontFamily: 'Ubuntu-Bold',
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
    position: 'relative',
  },
  levelCardLight: { backgroundColor: '#FFFFFF', borderColor: '#FFFFFF' },
  selectedCard: {
    backgroundColor: '#3A3A3A',
  },
  selectedCardLight: {
    backgroundColor: '#F3E6D7', // slightly deeper than surface for focus
    borderColor: '#F8B070',
    borderWidth: 2,
  },
  completedCard: { borderWidth: 2, borderColor: '#10B981' },
  completedCardLight: { borderWidth: 2, borderColor: '#10B981' },
  levelHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  badgeArea: { flexDirection: 'row', alignItems: 'center', gap: 8 },
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
    fontSize: 20, // reduced ~10%
    fontWeight: '600',
    color: '#fff',
    marginBottom: 4,
    fontFamily: 'Ubuntu-Medium',
  },
  levelDescription: {
    fontSize: 14, // reduced ~10%
    color: '#9CA3AF',
    marginBottom: 2,
    fontFamily: 'Ubuntu-Regular',
  },
  levelCefr: {
    fontSize: 12, // reduced ~10%
    color: '#F8B070',
    fontWeight: '500',
    fontFamily: 'Ubuntu-Medium',
  },
  completedBadge: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: 'rgba(16,185,129,0.12)', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 999 },
  completedBadgeLight: { backgroundColor: 'rgba(16,185,129,0.15)' },
  completedText: { color: '#A7F3D0', fontWeight: '800', fontSize: 12 },
  completedTextLight: { color: '#065F46' },
  ribbon: {
    position: 'absolute',
    top: 12,
    left: -10,
    backgroundColor: 'rgba(16,185,129,0.9)',
    paddingVertical: 4,
    paddingHorizontal: 14,
    borderTopRightRadius: 8,
    borderBottomRightRadius: 8,
    transform: [{ rotate: '-3deg' }],
    zIndex: 2,
  },
  ribbonLight: { backgroundColor: 'rgba(16,185,129,0.85)' },
  ribbonText: { color: '#ffffff', fontWeight: '800', fontSize: 10, letterSpacing: 0.6 },
  ribbonTextLight: { color: '#ffffff' },
  checkContainer: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#F8B070',
    justifyContent: 'center',
    alignItems: 'center',
  },
  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#1E1E1E',
    paddingHorizontal: 20,
    paddingTop: 12,
  },
  continueButton: {
    backgroundColor: '#F8B070',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  continueButtonDisabled: {
    opacity: 0.5,
  },
  continueButtonText: {
    fontSize: 14, // reduced ~10%
    fontWeight: '600',
    color: '#fff',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorText: {
    fontSize: 14, // reduced ~10%
    color: '#9CA3AF',
  },
});

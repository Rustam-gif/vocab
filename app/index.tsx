import React, { useCallback, useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { BookOpen, BarChart3, FileText, User, Plus, Brain, ChevronRight } from 'lucide-react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFocusEffect } from '@react-navigation/native';

const SELECTED_LEVEL_KEY = '@engniter.selectedLevel';

export default function HomeScreen() {
  const router = useRouter();
  const [storedLevel, setStoredLevel] = useState<string | null>(null);

  useEffect(() => {
    AsyncStorage.getItem(SELECTED_LEVEL_KEY).then(level => {
      if (level) setStoredLevel(level);
    });
  }, []);

  const handleQuizSession = () => {
    if (storedLevel) {
      router.push(`/quiz/learn?level=${storedLevel}`);
    } else {
      router.push('/quiz/level-select');
    }
  };

  const updateStoredLevel = async () => {
    const level = await AsyncStorage.getItem(SELECTED_LEVEL_KEY);
    if (level) setStoredLevel(level);
  };

  useFocusEffect(
    useCallback(() => {
      updateStoredLevel();
    }, [])
  );

  // Organized sections with softer colors
  const accent = '#F2935C';
  const background = '#1E1E1E';

  const sections = [
    {
      title: 'Learning Tools',
      items: [
        {
          title: 'Vault',
          subtitle: 'Manage your vocabulary',
          icon: BookOpen,
          color: accent,
          onPress: () => router.push('/vault'),
        },
        {
          title: 'Quiz Session',
          subtitle: '5-word practice session',
          icon: Brain,
          color: accent,
          onPress: handleQuizSession,
        },
        {
          title: 'Story Exercise',
          subtitle: 'Fill-in-the-blanks with pill UI',
          icon: FileText,
          color: accent,
          onPress: () => router.push('/story/StoryExercise'),
        },
      ],
    },
    {
      title: 'Progress',
      items: [
        {
          title: 'Journal',
          subtitle: 'Track your learning journey',
          icon: FileText,
          color: accent,
          onPress: () => router.push('/journal'),
        },
        {
          title: 'Analytics',
          subtitle: 'View your progress',
          icon: BarChart3,
          color: accent,
          onPress: () => router.push('/stats'),
        },
      ],
    },
    {
      title: 'Account',
      items: [
        {
          title: 'Profile',
          subtitle: 'Manage your account',
          icon: User,
          color: accent,
          onPress: () => router.push('/profile'),
        },
      ],
    },
  ];

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: background }] }>
      <ScrollView
        style={[styles.scrollView, { backgroundColor: background }]}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>Engniter Vocabulary</Text>
          <Text style={styles.subtitle}>Master English with AI-powered exercises</Text>
        </View>

        {/* Sections */}
        {sections.map((section, sectionIndex) => (
          <View key={sectionIndex} style={styles.section}>
            <Text style={styles.sectionTitle}>{section.title}</Text>
            {section.items.map((item, itemIndex) => {
              const IconComponent = item.icon;
              return (
                <TouchableOpacity
                  key={itemIndex}
                  style={styles.card}
                  onPress={item.onPress}
                  activeOpacity={0.7}
                >
                  <View style={styles.cardContent}>
                    <View style={styles.cardLeft}>
                      <View style={[styles.iconContainer, { backgroundColor: item.color + '20' }]}>
                        <IconComponent size={24} color={item.color} />
                      </View>
                      <View style={styles.cardText}>
                        <Text style={styles.cardTitle}>{item.title}</Text>
                        <Text style={styles.cardSubtitle}>{item.subtitle}</Text>
                      </View>
                    </View>
                    <ChevronRight size={20} color="#6B7280" />
                  </View>
                </TouchableOpacity>
              );
            })}
          </View>
        ))}

        {/* Bottom spacing for FAB */}
        <View style={styles.bottomSpacing} />
      </ScrollView>

      {/* Floating Action Button */}
      <TouchableOpacity
        style={styles.fab}
        onPress={() => router.push('/vault')}
        activeOpacity={0.8}
      >
        <Plus size={24} color="#FFFFFF" />
      </TouchableOpacity>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1E1E1E',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 32,
  },
  header: {
    paddingHorizontal: 24,
    paddingTop: 32,
    paddingBottom: 24,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#9CA3AF',
    lineHeight: 24,
  },
  section: {
    marginBottom: 32,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6B7280',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 16,
    marginHorizontal: 24,
  },
  card: {
    backgroundColor: '#2C2C2C',
    marginHorizontal: 24,
    marginBottom: 12,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#333',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  cardContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 20,
  },
  cardLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  cardText: {
    flex: 1,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  cardSubtitle: {
    fontSize: 14,
    color: '#9CA3AF',
    lineHeight: 20,
  },
  bottomSpacing: {
    height: 100,
  },
  fab: {
    position: 'absolute',
    bottom: 24,
    right: 24,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#F2935C',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
});

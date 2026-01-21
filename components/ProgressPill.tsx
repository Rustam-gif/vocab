import React, { useEffect, useState, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Animated, DeviceEventEmitter } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter } from 'expo-router';
import { getTheme } from '../lib/theme';
import { useAppStore } from '../lib/store';

interface Props {
  style?: any;
}

const TODAY_WORDS_KEY = '@engniter.progress.wordsToday';
const TODAY_DATE_KEY = '@engniter.progress.todayDate';
const DAILY_GOAL_KEY = '@engniter.onboarding.dailyGoal';

export default function ProgressPill({ style }: Props) {
  const router = useRouter();
  const theme = useAppStore(s => s.theme);
  const colors = getTheme(theme);
  const isLight = theme === 'light';

  const [wordsToday, setWordsToday] = useState(0);
  const [dailyGoal, setDailyGoal] = useState(10);
  const [isCompleted, setIsCompleted] = useState(false);

  const scaleAnim = useRef(new Animated.Value(1)).current;
  const progressAnim = useRef(new Animated.Value(0)).current;

  // Load daily goal and today's progress
  useEffect(() => {
    const loadProgress = async () => {
      try {
        const [goalResult, wordsResult, dateResult] = await AsyncStorage.multiGet([
          DAILY_GOAL_KEY,
          TODAY_WORDS_KEY,
          TODAY_DATE_KEY,
        ]);

        const goal = goalResult[1] ? parseInt(goalResult[1], 10) : 10;
        setDailyGoal(goal);

        const today = new Date().toISOString().split('T')[0];
        const savedDate = dateResult[1];

        // Reset if it's a new day
        if (savedDate !== today) {
          setWordsToday(0);
          await AsyncStorage.multiSet([
            [TODAY_WORDS_KEY, '0'],
            [TODAY_DATE_KEY, today],
          ]);
        } else {
          const words = wordsResult[1] ? parseInt(wordsResult[1], 10) : 0;
          setWordsToday(words);
        }
      } catch (e) {
        console.error('Failed to load progress:', e);
      }
    };

    loadProgress();

    // Listen for word completion events
    const listener = DeviceEventEmitter.addListener('WORDS_PRACTICED', async (count: number) => {
      try {
        const today = new Date().toISOString().split('T')[0];
        const [wordsResult, dateResult] = await AsyncStorage.multiGet([TODAY_WORDS_KEY, TODAY_DATE_KEY]);

        let currentWords = 0;
        if (dateResult[1] === today) {
          currentWords = wordsResult[1] ? parseInt(wordsResult[1], 10) : 0;
        }

        const newTotal = currentWords + count;
        setWordsToday(newTotal);

        await AsyncStorage.multiSet([
          [TODAY_WORDS_KEY, String(newTotal)],
          [TODAY_DATE_KEY, today],
        ]);
      } catch (e) {
        console.error('Failed to update words today:', e);
      }
    });

    return () => listener.remove();
  }, []);

  // Update completion state and animate progress
  useEffect(() => {
    const completed = wordsToday >= dailyGoal;
    setIsCompleted(completed);

    const progress = Math.min(wordsToday / dailyGoal, 1);
    Animated.spring(progressAnim, {
      toValue: progress,
      useNativeDriver: false,
      friction: 8,
      tension: 100,
    }).start();

    // Celebration animation when completed
    if (completed && wordsToday === dailyGoal) {
      Animated.sequence([
        Animated.spring(scaleAnim, { toValue: 1.15, useNativeDriver: true, friction: 5 }),
        Animated.spring(scaleAnim, { toValue: 1, useNativeDriver: true, friction: 6 }),
      ]).start();
    }
  }, [wordsToday, dailyGoal]);

  const handlePress = () => {
    router.push('/stats');
  };

  const pressIn = () => {
    Animated.spring(scaleAnim, { toValue: 0.95, useNativeDriver: true, friction: 7, tension: 280 }).start();
  };

  const pressOut = () => {
    Animated.sequence([
      Animated.spring(scaleAnim, { toValue: 1.05, useNativeDriver: true, friction: 6, tension: 180 }),
      Animated.spring(scaleAnim, { toValue: 1, useNativeDriver: true, friction: 7, tension: 140 }),
    ]).start();
  };

  const progressWidth = progressAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0%', '100%'],
  });

  // Colors based on state
  const pillBg = isCompleted
    ? (isLight ? '#D1FAE5' : '#065F46')
    : (isLight ? '#FFF7ED' : '#243B53');
  const pillBorder = isCompleted
    ? (isLight ? '#10B981' : '#10B981')
    : (isLight ? '#E5E7EB' : '#0D1B2A');
  const progressBg = isCompleted
    ? (isLight ? '#10B981' : '#34D399')
    : (isLight ? '#F8B070' : '#F8B070');
  const textColor = isCompleted
    ? (isLight ? '#065F46' : '#D1FAE5')
    : (isLight ? '#0D3B4A' : '#FFFFFF');

  return (
    <Animated.View style={[{ transform: [{ scale: scaleAnim }] }, style]}>
      <TouchableOpacity
        style={[
          styles.pill,
          {
            backgroundColor: pillBg,
            borderColor: pillBorder,
          },
        ]}
        onPress={handlePress}
        onPressIn={pressIn}
        onPressOut={pressOut}
        activeOpacity={0.9}
      >
        {/* Progress bar background */}
        <View style={styles.progressContainer}>
          <Animated.View
            style={[
              styles.progressBar,
              {
                backgroundColor: progressBg,
                width: progressWidth,
                opacity: 0.3,
              },
            ]}
          />
        </View>

        {/* Content */}
        <View style={styles.content}>
          <Text style={styles.emoji}>
            {isCompleted ? '✓' : '📈'}
          </Text>
          <Text style={[styles.text, { color: textColor }]}>
            {wordsToday}/{dailyGoal}
          </Text>
        </View>
      </TouchableOpacity>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    minHeight: 30,
    borderWidth: 2,
    shadowColor: '#000',
    shadowOffset: { width: 1, height: 2 },
    shadowOpacity: 0.4,
    shadowRadius: 0,
    elevation: 3,
    overflow: 'hidden',
    position: 'relative',
  },
  progressContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  progressBar: {
    height: '100%',
    borderRadius: 14,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    zIndex: 1,
  },
  emoji: {
    fontSize: 14,
  },
  text: {
    fontWeight: '700',
    fontSize: 14,
    fontFamily: 'Ubuntu-Bold',
  },
});

// Helper function to emit word completion events
export const emitWordsPracticed = (count: number) => {
  DeviceEventEmitter.emit('WORDS_PRACTICED', count);
};

import React, { useEffect, useState, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Animated, DeviceEventEmitter } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter } from 'expo-router';
import { getTheme } from '../lib/theme';
import { useAppStore } from '../lib/store';
import { X } from 'lucide-react-native';

interface Props {
  style?: any;
}

const TODAY_WORDS_KEY = '@engniter.progress.wordsToday';
const TODAY_DATE_KEY = '@engniter.progress.todayDate';
const DAILY_GOAL_KEY = '@engniter.onboarding.dailyGoal';
const TOOLTIP_DISMISSED_KEY = '@engniter.progress.tooltipDismissed';

export default function ProgressPill({ style }: Props) {
  const router = useRouter();
  const theme = useAppStore(s => s.theme);
  const colors = getTheme(theme);
  const isLight = theme === 'light';

  const [wordsToday, setWordsToday] = useState(0);
  const [dailyGoal, setDailyGoal] = useState(10);
  const [isCompleted, setIsCompleted] = useState(false);
  const [isInitialLoad, setIsInitialLoad] = useState(true);
  const [showTooltip, setShowTooltip] = useState(false);

  const scaleAnim = useRef(new Animated.Value(1)).current;
  const progressAnim = useRef(new Animated.Value(0)).current;
  const tooltipAnim = useRef(new Animated.Value(0)).current;

  // Load daily goal and today's progress
  useEffect(() => {
    const loadProgress = async () => {
      try {
        const [goalResult, wordsResult, dateResult, tooltipResult] = await AsyncStorage.multiGet([
          DAILY_GOAL_KEY,
          TODAY_WORDS_KEY,
          TODAY_DATE_KEY,
          TOOLTIP_DISMISSED_KEY,
        ]);

        const goal = goalResult[1] ? parseInt(goalResult[1], 10) : 10;
        setDailyGoal(goal);

        const today = new Date().toISOString().split('T')[0];
        const savedDate = dateResult[1];
        const tooltipDismissedDate = tooltipResult[1];

        let words = 0;
        // Reset if it's a new day
        if (savedDate !== today) {
          await AsyncStorage.multiSet([
            [TODAY_WORDS_KEY, '0'],
            [TODAY_DATE_KEY, today],
          ]);
        } else {
          words = wordsResult[1] ? parseInt(wordsResult[1], 10) : 0;
        }

        // Set initial progress immediately without animation
        const initialProgress = Math.min(words / goal, 1);
        progressAnim.setValue(initialProgress);
        setWordsToday(words);
        setIsCompleted(words >= goal);
        setIsInitialLoad(false);

        // Show tooltip if: 0 words completed, not dismissed today, and after initial load
        if (words === 0 && tooltipDismissedDate !== today) {
          setTimeout(() => {
            setShowTooltip(true);
            Animated.spring(tooltipAnim, {
              toValue: 1,
              useNativeDriver: true,
              friction: 8,
              tension: 100,
            }).start();
          }, 1500); // Show after 1.5 seconds
        }
      } catch (e) {
        console.error('Failed to load progress:', e);
        setIsInitialLoad(false);
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

  // Update completion state and animate progress (only after initial load)
  const prevWordsRef = useRef(wordsToday);
  useEffect(() => {
    // Skip animation on initial load - it's already set
    if (isInitialLoad) return;

    const completed = wordsToday >= dailyGoal;
    setIsCompleted(completed);

    const progress = Math.min(wordsToday / dailyGoal, 1);

    // Only animate if words actually changed (not on re-render)
    if (prevWordsRef.current !== wordsToday) {
      Animated.spring(progressAnim, {
        toValue: progress,
        useNativeDriver: false,
        friction: 8,
        tension: 100,
      }).start();

      // Hide tooltip when user starts practicing
      if (wordsToday > 0 && showTooltip) {
        dismissTooltip();
      }

      // Celebration animation when just completed
      if (completed && prevWordsRef.current < dailyGoal) {
        Animated.sequence([
          Animated.spring(scaleAnim, { toValue: 1.15, useNativeDriver: true, friction: 5 }),
          Animated.spring(scaleAnim, { toValue: 1, useNativeDriver: true, friction: 6 }),
        ]).start();
      }

      prevWordsRef.current = wordsToday;
    }
  }, [wordsToday, dailyGoal, isInitialLoad]);

  const dismissTooltip = async () => {
    Animated.timing(tooltipAnim, {
      toValue: 0,
      duration: 200,
      useNativeDriver: true,
    }).start(() => {
      setShowTooltip(false);
    });

    // Save dismissal for today
    const today = new Date().toISOString().split('T')[0];
    await AsyncStorage.setItem(TOOLTIP_DISMISSED_KEY, today);
  };

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

  const motivationalMessages = [
    "Start your journey! 🚀",
    "Just 10 words today! 💪",
    "Build your streak! 🔥",
    "You've got this! ✨",
    "Learn something new! 🌟",
  ];

  const randomMessage = motivationalMessages[Math.floor(Math.random() * motivationalMessages.length)];

  return (
    <View style={{ position: 'relative' }}>
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
              {isCompleted ? '✓' : '🚀'}
            </Text>
            <Text style={[styles.text, { color: textColor }]}>
              {wordsToday}/{dailyGoal}
            </Text>
          </View>
        </TouchableOpacity>
      </Animated.View>

      {/* Motivational Tooltip */}
      {showTooltip && (
        <Animated.View
          style={[
            styles.tooltip,
            isLight && styles.tooltipLight,
            {
              opacity: tooltipAnim,
              transform: [
                {
                  translateY: tooltipAnim.interpolate({
                    inputRange: [0, 1],
                    outputRange: [-10, 0],
                  }),
                },
              ],
            },
          ]}
        >
          {/* Arrow pointing up */}
          <View style={[styles.tooltipArrow, isLight && styles.tooltipArrowLight]} />

          <View style={styles.tooltipContent}>
            <Text style={[styles.tooltipText, isLight && styles.tooltipTextLight]}>
              {randomMessage}
            </Text>
            <TouchableOpacity onPress={dismissTooltip} style={styles.tooltipClose}>
              <X size={14} color={isLight ? '#6B7280' : '#9CA3AF'} />
            </TouchableOpacity>
          </View>
        </Animated.View>
      )}
    </View>
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
  tooltip: {
    position: 'absolute',
    bottom: -50,
    right: 0,
    backgroundColor: '#243B53',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
    zIndex: 100,
    minWidth: 160,
  },
  tooltipLight: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  tooltipArrow: {
    position: 'absolute',
    top: -6,
    right: 20,
    width: 12,
    height: 12,
    backgroundColor: '#243B53',
    transform: [{ rotate: '45deg' }],
  },
  tooltipArrowLight: {
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderLeftWidth: 1,
    borderColor: '#E5E7EB',
  },
  tooltipContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  tooltipText: {
    color: '#E5E7EB',
    fontSize: 13,
    fontWeight: '600',
    fontFamily: 'Ubuntu-Medium',
    flex: 1,
  },
  tooltipTextLight: {
    color: '#1F2937',
  },
  tooltipClose: {
    padding: 2,
  },
});

// Helper function to emit word completion events
export const emitWordsPracticed = (count: number) => {
  DeviceEventEmitter.emit('WORDS_PRACTICED', count);
};

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Dimensions,
  DeviceEventEmitter,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { ArrowLeft, Flame, Target, BookOpen, Trophy, Sliders } from 'lucide-react-native';
import LottieView from 'lottie-react-native';
import { useAppStore } from '../lib/store';
import { analyticsService } from '../services/AnalyticsService';
import { vaultService } from '../services/VaultService';

const { width } = Dimensions.get('window');

export default function StatsScreen() {
  const router = useRouter();
  const themeName = useAppStore(s => s.theme);
  const isLight = themeName === 'light';
  const insets = useSafeAreaInsets();
  const [stats, setStats] = useState<{
    wordsLearned: number;
    totalWords: number;
    currentStreak: number;
    recordStreak: number;
    exercisesCompleted: number;
    accuracy: number;
  }>({
    wordsLearned: 0,
    totalWords: 0,
    currentStreak: 0,
    recordStreak: 0,
    exercisesCompleted: 0,
    accuracy: 0,
  });

  useEffect(() => {
    const loadStats = async () => {
      try {
        // Initialize services
        await analyticsService.initialize();
        await vaultService.initialize();

        // Get analytics data
        const analyticsData = analyticsService.getAnalyticsData();

        // Get exercise counts
        const counts = analyticsService.getTodayAndTotalCounts();
        const recordStreak = analyticsService.getRecordStreak();

        // Get words from vault
        const words = vaultService.getAllWords();
        const totalWords = words.length;

        // Count words that have been mastered (completed all 4 exercises with max 1 mistake each)
        const wordsLearned = words.filter(w => w.isMastered === true).length;

        // Get overall accuracy from analytics data
        const accuracy = analyticsData?.overallAccuracy ?? 0;

        // Current streak from analytics
        const currentStreak = analyticsData?.streak ?? 0;

        console.log('[Stats] Loaded:', {
          totalWords,
          wordsLearned,
          exercisesCompleted: counts.total,
          accuracy,
          currentStreak,
          recordStreak
        });

        setStats({
          wordsLearned,
          totalWords,
          currentStreak,
          recordStreak,
          exercisesCompleted: counts.total,
          accuracy,
        });
      } catch (error) {
        console.error('[Stats] Failed to load stats:', error);
      }
    };

    loadStats();
  }, []);

  const renderStatCard = (
    icon: React.ReactNode,
    title: string,
    value: string | number,
    subtitle?: string,
    accentColor: string = '#4ED9CB'
  ) => (
    <View style={[styles.statCard, isLight && styles.statCardLight]}>
      <View style={[styles.iconContainer, { backgroundColor: `${accentColor}20` }]}>
        {icon}
      </View>
      <View style={styles.statContent}>
        <Text style={[styles.statValue, isLight && styles.statValueLight]}>{value}</Text>
        <Text style={[styles.statTitle, isLight && styles.statTitleLight]}>{title}</Text>
        {subtitle && (
          <Text style={[styles.statSubtitle, isLight && styles.statSubtitleLight]}>{subtitle}</Text>
        )}
      </View>
    </View>
  );

  const wordsPercent = stats.totalWords > 0
    ? Math.round((stats.wordsLearned / stats.totalWords) * 100)
    : 0;

  return (
    <SafeAreaView edges={['bottom']} style={[styles.container, isLight && styles.containerLight, { paddingTop: insets.top }]}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.replace('/quiz/learn')}
        >
          <ArrowLeft size={24} color={isLight ? '#111827' : '#fff'} />
        </TouchableOpacity>
        <Text style={[styles.title, isLight && styles.titleLight]}>Your Progress</Text>
        <TouchableOpacity
          style={[styles.levelButton, isLight && styles.levelButtonLight]}
          onPress={() => {
            router.replace('/quiz/learn');
            // Trigger modal opening via event after navigation
            setTimeout(() => {
              try {
                DeviceEventEmitter.emit('OPEN_LEVEL_TOPIC_MODAL');
              } catch (e) {
                console.error('Failed to emit event:', e);
              }
            }, 300);
          }}
          activeOpacity={0.8}
        >
          <Sliders size={20} color={isLight ? '#0D9488' : '#4ED9CB'} />
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.content}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.contentContainer}
      >
        {/* Main Progress Card */}
        <View style={[styles.mainCard, isLight && styles.mainCardLight]}>
          <View style={styles.mainCardHeader}>
            <LottieView
              source={require('../assets/lottie/Bestseller.json')}
              autoPlay
              loop={false}
              style={styles.mainAnimation}
            />
            <View style={styles.mainCardTitleContainer}>
              <Text style={[styles.mainCardTitle, isLight && styles.mainCardTitleLight]}>
                Words Mastered
              </Text>
            </View>
          </View>

          <View style={styles.progressContainer}>
            <View style={[styles.progressBar, isLight && styles.progressBarLight]}>
              <View
                style={[
                  styles.progressFill,
                  { width: `${wordsPercent}%` }
                ]}
              />
            </View>
            <View style={styles.progressLabels}>
              <Text style={[styles.progressValue, isLight && styles.progressValueLight]}>
                {stats.wordsLearned}
              </Text>
            </View>
          </View>
        </View>

        {/* Stats Grid */}
        <View style={styles.statsGrid}>
          {renderStatCard(
            <Flame size={24} color="#F59E0B" />,
            'Current Streak',
            stats.currentStreak,
            `Record: ${stats.recordStreak} days`,
            '#F59E0B'
          )}

          {renderStatCard(
            <BookOpen size={24} color="#4ED9CB" />,
            'Exercises Done',
            stats.exercisesCompleted,
            undefined,
            '#4ED9CB'
          )}

          {renderStatCard(
            <Target size={24} color="#F25E86" />,
            'Accuracy',
            `${stats.accuracy}%`,
            undefined,
            '#F25E86'
          )}

          {renderStatCard(
            <Trophy size={24} color="#A78BFA" />,
            'Mastery Rate',
            `${wordsPercent}%`,
            undefined,
            '#A78BFA'
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1B263B',
  },
  containerLight: {
    backgroundColor: '#F8F8F8',
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
    color: '#fff',
    fontFamily: 'Feather-Bold',
  },
  titleLight: {
    color: '#111827',
  },
  placeholder: {
    width: 40,
  },
  levelButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(30, 41, 59, 0.9)',
    borderWidth: 2,
    borderColor: 'rgba(78, 217, 203, 0.3)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  levelButtonLight: {
    backgroundColor: '#FFFFFF',
    borderColor: 'rgba(78, 217, 203, 0.4)',
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    padding: 20,
    paddingBottom: 40,
  },

  // Main Progress Card
  mainCard: {
    backgroundColor: '#0D1B2A',
    borderRadius: 20,
    padding: 24,
    marginBottom: 20,
    borderWidth: 2,
    borderColor: 'rgba(78,217,203,0.06)',
    borderBottomWidth: 4,
    borderRightWidth: 4,
    borderBottomColor: 'rgba(78,217,203,0.1)',
    borderRightColor: 'rgba(78,217,203,0.08)',
  },
  mainCardLight: {
    backgroundColor: '#FFFFFF',
    borderColor: 'rgba(78,217,203,0.2)',
    borderBottomColor: 'rgba(78,217,203,0.25)',
    borderRightColor: 'rgba(78,217,203,0.22)',
  },
  mainCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  mainAnimation: {
    width: 60,
    height: 60,
    marginRight: 16,
  },
  mainCardTitleContainer: {
    flex: 1,
  },
  mainCardTitle: {
    fontSize: 20,
    color: '#fff',
    fontFamily: 'Feather-Bold',
  },
  mainCardTitleLight: {
    color: '#111827',
  },
  mainCardSubtitle: {
    fontSize: 13,
    color: '#9CA3AF',
    fontFamily: 'Feather-Regular',
    marginTop: 4,
  },
  mainCardSubtitleLight: {
    color: '#6B7280',
  },
  progressContainer: {
    gap: 12,
  },
  progressBar: {
    height: 12,
    backgroundColor: '#2D4A66',
    borderRadius: 6,
    overflow: 'hidden',
  },
  progressBarLight: {
    backgroundColor: '#E5E7EB',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#4ED9CB',
    borderRadius: 6,
  },
  progressLabels: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 8,
  },
  progressValue: {
    fontSize: 32,
    color: '#4ED9CB',
    fontFamily: 'Feather-Bold',
  },
  progressValueLight: {
    color: '#0D9488',
  },
  progressTotal: {
    fontSize: 16,
    color: '#9CA3AF',
    fontFamily: 'Feather-Regular',
  },
  progressTotalLight: {
    color: '#6B7280',
  },

  // Stats Grid
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  statCard: {
    width: (width - 52) / 2,
    backgroundColor: '#0D1B2A',
    borderRadius: 16,
    padding: 16,
    borderWidth: 2,
    borderColor: 'rgba(78,217,203,0.06)',
    borderBottomWidth: 4,
    borderRightWidth: 4,
    borderBottomColor: 'rgba(78,217,203,0.1)',
    borderRightColor: 'rgba(78,217,203,0.08)',
  },
  statCardLight: {
    backgroundColor: '#FFFFFF',
    borderColor: 'rgba(78,217,203,0.2)',
    borderBottomColor: 'rgba(78,217,203,0.25)',
    borderRightColor: 'rgba(78,217,203,0.22)',
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  statContent: {
    gap: 2,
  },
  statValue: {
    fontSize: 28,
    color: '#fff',
    fontFamily: 'Feather-Bold',
  },
  statValueLight: {
    color: '#111827',
  },
  statTitle: {
    fontSize: 14,
    color: '#E5E7EB',
    fontFamily: 'Feather-Medium',
  },
  statTitleLight: {
    color: '#374151',
  },
  statSubtitle: {
    fontSize: 12,
    color: '#9CA3AF',
    fontFamily: 'Feather-Regular',
    marginTop: 2,
  },
  statSubtitleLight: {
    color: '#6B7280',
  },
});

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { ArrowLeft, BarChart3, TrendingUp, Target, Award } from 'lucide-react-native';
import { useAppStore } from '../lib/store';
import { analyticsService } from '../services/AnalyticsService';

const { width } = Dimensions.get('window');

export default function StatsScreen() {
  const router = useRouter();
  const { analytics, loadAnalytics } = useAppStore();
  const [stats, setStats] = useState<any>(null);

  useEffect(() => {
    loadAnalytics();
    const exerciseStats = analyticsService.getExerciseStats();
    setStats(exerciseStats);
  }, []);

  const renderAccuracyChart = () => {
    if (!analytics?.accuracyByType) return null;

    const exerciseTypes = Object.keys(analytics.accuracyByType);
    const maxAccuracy = Math.max(...Object.values(analytics.accuracyByType).map(v => Number(v)));

    return (
      <View style={styles.chartContainer}>
        <Text style={styles.chartTitle}>Accuracy by Exercise Type</Text>
        <View style={styles.barChart}>
          {exerciseTypes.map((type, index) => {
            const accuracy = analytics.accuracyByType[type];
            const height = (accuracy / maxAccuracy) * 120;
            const color = accuracy >= 80 ? '#4CAF50' : accuracy >= 60 ? '#FF9800' : '#F44336';

            return (
              <View key={type} style={styles.barContainer}>
                <View style={styles.barWrapper}>
                  <View
                    style={[
                      styles.bar,
                      { height, backgroundColor: color },
                    ]}
                  />
                </View>
                <Text style={styles.barLabel}>{type.toUpperCase()}</Text>
                <Text style={styles.barValue}>{accuracy}%</Text>
              </View>
            );
          })}
        </View>
      </View>
    );
  };

  const renderTrendChart = () => {
    if (!analytics?.accuracyTrend) return null;

    const trendData = analytics.accuracyTrend;
    const maxAccuracy = Math.max(...trendData.map((d: any) => d.accuracy));

    return (
      <View style={styles.chartContainer}>
        <Text style={styles.chartTitle}>Accuracy Trend (Last 7 Days)</Text>
        <View style={styles.trendChart}>
          <View style={styles.trendLine}>
            {trendData.map((point: any, index: number) => {
              const nextPoint = trendData[index + 1];
              if (!nextPoint) return null;

              const currentHeight = (point.accuracy / maxAccuracy) * 100;
              const nextHeight = (nextPoint.accuracy / maxAccuracy) * 100;

              return (
                <View key={index} style={styles.trendSegment}>
                  <View
                    style={[
                      styles.trendDot,
                      { bottom: currentHeight },
                    ]}
                  />
                  {index < trendData.length - 1 && (
                    <View
                      style={[
                        styles.trendLineSegment,
                        {
                          height: Math.abs(nextHeight - currentHeight),
                          bottom: Math.min(currentHeight, nextHeight),
                          transform: [
                            {
                              rotate: `${
                                Math.atan2(
                                  nextHeight - currentHeight,
                                  1
                                ) * (180 / Math.PI)
                              }deg`,
                            },
                          ],
                        },
                      ]}
                    />
                  )}
                </View>
              );
            })}
          </View>
          <View style={styles.trendLabels}>
            {trendData.map((point: any, index: number) => (
              <Text key={index} style={styles.trendLabel}>
                {new Date(point.date).toLocaleDateString('en-US', {
                  month: 'short',
                  day: 'numeric',
                })}
              </Text>
            ))}
          </View>
        </View>
      </View>
    );
  };

  const renderDonutChart = () => {
    if (!analytics) return null;

    const { overallAccuracy } = analytics;
    const incorrect = 100 - overallAccuracy;
    const inProgress = Math.max(0, 100 - overallAccuracy - incorrect);

    return (
      <View style={styles.chartContainer}>
        <Text style={styles.chartTitle}>Overall Accuracy</Text>
        <View style={styles.donutChart}>
          <View style={styles.donutOuter}>
            <View style={styles.donutInner}>
              <Text style={styles.donutValue}>{overallAccuracy}%</Text>
              <Text style={styles.donutLabel}>Accuracy</Text>
            </View>
          </View>
          <View style={styles.donutLegend}>
            <View style={styles.legendItem}>
              <View style={[styles.legendColor, { backgroundColor: '#4CAF50' }]} />
              <Text style={styles.legendText}>Correct ({overallAccuracy}%)</Text>
            </View>
            <View style={styles.legendItem}>
              <View style={[styles.legendColor, { backgroundColor: '#F44336' }]} />
              <Text style={styles.legendText}>Incorrect ({incorrect}%)</Text>
            </View>
            {inProgress > 0 && (
              <View style={styles.legendItem}>
                <View style={[styles.legendColor, { backgroundColor: '#FF9800' }]} />
                <Text style={styles.legendText}>In Progress ({inProgress}%)</Text>
              </View>
            )}
          </View>
        </View>
      </View>
    );
  };

  const renderSummaryCards = () => {
    if (!analytics || !stats) return null;

    return (
      <View style={styles.summaryContainer}>
        <View style={styles.summaryCard}>
          <View style={styles.summaryIcon}>
            <Target size={24} color="#e28743" />
          </View>
          <View style={styles.summaryContent}>
            <Text style={styles.summaryValue}>{analytics.overallAccuracy}%</Text>
            <Text style={styles.summaryLabel}>Overall Accuracy</Text>
          </View>
        </View>

        <View style={styles.summaryCard}>
          <View style={styles.summaryIcon}>
            <TrendingUp size={24} color="#4CAF50" />
          </View>
          <View style={styles.summaryContent}>
            <Text style={styles.summaryValue}>{analytics.streak}</Text>
            <Text style={styles.summaryLabel}>Day Streak</Text>
          </View>
        </View>

        <View style={styles.summaryCard}>
          <View style={styles.summaryIcon}>
            <Award size={24} color="#F2AB27" />
          </View>
          <View style={styles.summaryContent}>
            <Text style={styles.summaryValue}>{analytics.personalBest}%</Text>
            <Text style={styles.summaryLabel}>Personal Best</Text>
          </View>
        </View>

        <View style={styles.summaryCard}>
          <View style={styles.summaryIcon}>
            <BarChart3 size={24} color="#2196F3" />
          </View>
          <View style={styles.summaryContent}>
            <Text style={styles.summaryValue}>{stats.totalExercises}</Text>
            <Text style={styles.summaryLabel}>Exercises Done</Text>
          </View>
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <ArrowLeft size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.title}>Analytics</Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {renderSummaryCards()}
        {renderDonutChart()}
        {renderAccuracyChart()}
        {renderTrendChart()}
      </ScrollView>
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
    borderBottomColor: '#2c2f2f',
  },
  backButton: {
    padding: 8,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
  },
  placeholder: {
    width: 40,
  },
  content: {
    flex: 1,
    padding: 20,
  },
  summaryContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 24,
  },
  summaryCard: {
    backgroundColor: '#2c2f2f',
    borderRadius: 12,
    padding: 16,
    flex: 1,
    minWidth: (width - 56) / 2,
    flexDirection: 'row',
    alignItems: 'center',
  },
  summaryIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#3A3A3A',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  summaryContent: {
    flex: 1,
  },
  summaryValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
  },
  summaryLabel: {
    fontSize: 12,
    color: '#a0a0a0',
    marginTop: 2,
  },
  chartContainer: {
    backgroundColor: '#2c2f2f',
    borderRadius: 12,
    padding: 20,
    marginBottom: 20,
  },
  chartTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 16,
    textAlign: 'center',
  },
  barChart: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'flex-end',
    height: 140,
  },
  barContainer: {
    alignItems: 'center',
    flex: 1,
  },
  barWrapper: {
    height: 120,
    justifyContent: 'flex-end',
    marginBottom: 8,
  },
  bar: {
    width: 30,
    borderRadius: 4,
    minHeight: 4,
  },
  barLabel: {
    fontSize: 10,
    color: '#a0a0a0',
    textAlign: 'center',
  },
  barValue: {
    fontSize: 12,
    color: '#fff',
    fontWeight: '600',
    marginTop: 4,
  },
  trendChart: {
    height: 120,
  },
  trendLine: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'flex-end',
    position: 'relative',
  },
  trendSegment: {
    flex: 1,
    position: 'relative',
  },
  trendDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#e28743',
    position: 'absolute',
  },
  trendLineSegment: {
    width: 2,
    backgroundColor: '#e28743',
    position: 'absolute',
    left: 3,
  },
  trendLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 8,
  },
  trendLabel: {
    fontSize: 10,
    color: '#a0a0a0',
    textAlign: 'center',
  },
  donutChart: {
    alignItems: 'center',
  },
  donutOuter: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: '#3A3A3A',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  donutInner: {
    alignItems: 'center',
  },
  donutValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
  },
  donutLabel: {
    fontSize: 12,
    color: '#a0a0a0',
  },
  donutLegend: {
    gap: 8,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  legendColor: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 8,
  },
  legendText: {
    fontSize: 14,
    color: '#e0e0e0',
  },
});

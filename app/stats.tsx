import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Dimensions,
  Alert,
  LayoutAnimation,
  UIManager,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { ArrowLeft, BarChart3, TrendingUp, CalendarDays, Award, CheckCircle2, AlertTriangle, Clock3, ChevronDown } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useAppStore } from '../lib/store';
import { analyticsService } from '../services/AnalyticsService';
import { vaultService } from '../services/VaultService';

const { width } = Dimensions.get('window');

export default function StatsScreen() {
  const router = useRouter();
  const { analytics, loadAnalytics } = useAppStore();
  const [stats, setStats] = useState<any>(null);
  const [deepOpen, setDeepOpen] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        await analyticsService.initialize();
      } catch {}
      await loadAnalytics();
      const exerciseStats = analyticsService.getExerciseStats();
      setStats(exerciseStats);
    })();
  }, []);

  // Enable LayoutAnimation on Android
  useEffect(() => {
    if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
      UIManager.setLayoutAnimationEnabledExperimental(true);
    }
  }, []);

  const renderAccuracyChart = () => {
    if (!analytics?.accuracyByType) return null;

    const exerciseTypes = Object.keys(analytics.accuracyByType);
    const maxAccuracy = Math.max(...Object.values(analytics.accuracyByType).map(v => Number(v)));

    return (
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Accuracy by Exercise</Text>
        <View style={styles.barChart}>
          {exerciseTypes.map((type, index) => {
            const accuracy = analytics.accuracyByType[type];
            const height = Math.max(6, (accuracy / (maxAccuracy || 1)) * 120);
            const gradient = accuracy >= 80
              ? ['#2e7d32', '#4CAF50']
              : accuracy >= 60
              ? ['#b36b00', '#F2AB27']
              : ['#c62828', '#F87171'];

            return (
              <View key={type} style={styles.barContainer}>
                <View style={styles.barWrapper}>
                  <LinearGradient colors={gradient} start={{x:0,y:0}} end={{x:0,y:1}} style={[styles.bar, { height }]} />
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

  const renderRecommendations = () => {
    if (!analytics?.recommendations || analytics.recommendations.length === 0) return null;
    const items = analytics.recommendations.slice(0, 3);
    const iconFor = (k: string) => k === 'srs' ? <Clock3 size={16} color="#FFFFFF" /> : k === 'weak' ? <AlertTriangle size={16} color="#FFFFFF" /> : <CheckCircle2 size={16} color="#FFFFFF" />;
    const bgFor = (k: string) => k === 'srs' ? '#187486' : k === 'weak' ? '#F2AB27' : '#4CAF50';
    return (
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Recommendations</Text>
        {items.map((r, idx) => (
          <View key={`${r.kind}-${idx}`} style={styles.recoRow}>
            <View style={[styles.recoIcon, { backgroundColor: bgFor(r.kind) }]}>
              {iconFor(r.kind)}
            </View>
            <Text style={styles.recoText}>{r.text}</Text>
          </View>
        ))}
      </View>
    );
  };

  const renderTrendChart = () => {
    if (!analytics?.timeTrend) return null;

    const trendData = analytics.timeTrend;
    const maxSeconds = Math.max(...trendData.map((d: any) => d.seconds), 1);

    return (
      <View style={styles.chartContainer}>
        <Text style={styles.chartTitle}>Time Spent per Day (Last 7 Days)</Text>
        <View style={styles.trendChart}>
          <View style={styles.trendLine}>
            {trendData.map((point: any, index: number) => {
              const barHeight = (point.seconds / maxSeconds) * 100;
              return (
                <View key={index} style={styles.trendSegment}>
                  <View
                    style={[
                      styles.trendBar,
                      { height: barHeight },
                    ]}
                  />
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

  const renderSrsHealth = () => {
    const srs = analytics?.srsHealth;
    if (!srs) return null;
    const ob = srs.overdueBuckets || ({} as any);
    const overdueTotal = (ob.today || 0) + (ob['1-3d'] || 0) + (ob['4-7d'] || 0) + (ob['8+d'] || 0);
    const hasData = overdueTotal > 0 || (srs.avgEaseFactor || 0) > 0 || (srs.avgInterval || 0) > 0 || (srs.topLapses?.length || 0) > 0;
    if (!hasData) return null; // hide if everything is zero/empty

    const overdueOther = (ob['1-3d'] || 0) + (ob['4-7d'] || 0) + (ob['8+d'] || 0);
    return (
      <View style={styles.card}>
        <Text style={styles.chartTitle}>SRS Health</Text>
        <View style={styles.row}><Text style={styles.rowLeft}>Due now</Text><Text style={styles.rowRight}>{ob.today || 0}</Text></View>
        <View style={styles.row}><Text style={styles.rowLeft}>Overdue</Text><Text style={[styles.rowRight, { color: overdueOther > 0 ? '#F2AB27' : '#9CA3AF' }]}>{overdueOther}</Text></View>
        <View style={styles.row}><Text style={styles.rowLeft}>Avg EF</Text><Text style={styles.rowRight}>{srs.avgEaseFactor}</Text></View>
        <View style={styles.row}><Text style={styles.rowLeft}>Avg Interval</Text><Text style={styles.rowRight}>{srs.avgInterval} d</Text></View>
        {srs.topLapses?.length ? (
          <View style={[styles.row, { paddingTop: 8 }]}>
            <Text style={styles.rowLeft}>Most lapses</Text>
            <Text style={[styles.rowRight, { color: '#F87171' }]}>
              {srs.topLapses.slice(0, 3).map(w => w.word).join(', ')}
            </Text>
          </View>
        ) : null}
      </View>
    );
  };

  const renderDonutChart = () => {
    // Replace accuracy card with "Words Learned"
    const words = vaultService.getAllWords();
    const total = words.length;
    const learned = words.filter(w => (w.srs?.repetition ?? 0) >= 3).length; // learned = SRS rep >= 3
    const remaining = Math.max(0, total - learned);
    const percent = total ? Math.round((learned / total) * 100) : 0;

    return (
      <View style={styles.chartContainer}>
        <Text style={styles.chartTitle}>Words Learned</Text>
        <View style={styles.donutChart}>
          <View style={styles.donutOuter}>
            <View style={styles.donutInner}>
              <Text style={styles.donutValue}>{learned}</Text>
              <Text style={styles.donutLabel}>of {total}</Text>
              <Text style={[styles.donutLabel, { marginTop: 2 }]}>{percent}%</Text>
            </View>
          </View>
          <View style={styles.donutLegend}>
            <View style={styles.legendItem}>
              <View style={[styles.legendColor, { backgroundColor: '#4CAF50' }]} />
              <Text style={styles.legendText}>Learned ({learned})</Text>
            </View>
            <View style={styles.legendItem}>
              <View style={[styles.legendColor, { backgroundColor: '#6B7280' }]} />
              <Text style={styles.legendText}>Remaining ({remaining})</Text>
            </View>
          </View>
        </View>
      </View>
    );
  };

  const renderWeakWords = () => {
    if (!analytics?.weakWords || analytics.weakWords.length === 0) return null;
    return (
      <View style={styles.card}>
        <Text style={styles.chartTitle}>Weakest Words</Text>
        {analytics.weakWords.slice(0, 8).map((w: any, idx: number) => (
          <View key={`${w.word}-${idx}`} style={styles.row}>
            <Text style={styles.rowLeft}>{w.word}</Text>
            <Text style={[styles.rowRight, { color: w.accuracy < 50 ? '#F87171' : '#F2AB27' }]}>{w.accuracy}% • {w.attempts}x</Text>
          </View>
        ))}
      </View>
    );
  };

  const renderTagBreakdown = () => {
    if (!analytics?.tagStats || analytics.tagStats.length === 0) return null;
    // Take top 5 weakest and top 5 strongest
    const sorted = analytics.tagStats as any[];
    const weakest = sorted.slice(0, 5);
    const strongest = [...sorted].reverse().slice(0, 5);
    return (
      <View style={styles.card}>
        <Text style={styles.chartTitle}>Skill by Topic</Text>
        <View style={styles.splitRow}>
          <View style={styles.splitCol}>
            <Text style={styles.subheading}>Weak</Text>
            {weakest.map((t, idx) => (
              <View key={`w-${t.tag}-${idx}`} style={styles.row}>
                <Text style={styles.rowLeft}>{t.tag}</Text>
                <Text style={[styles.rowRight, { color: '#F87171' }]}>{t.accuracy}% • {t.attempts}x</Text>
              </View>
            ))}
          </View>
          <View style={styles.splitCol}>
            <Text style={styles.subheading}>Strong</Text>
            {strongest.map((t, idx) => (
              <View key={`s-${t.tag}-${idx}`} style={styles.row}>
                <Text style={styles.rowLeft}>{t.tag}</Text>
                <Text style={[styles.rowRight, { color: '#4CAF50' }]}>{t.accuracy}% • {t.attempts}x</Text>
              </View>
            ))}
          </View>
        </View>
      </View>
    );
  };

  const renderTimeBuckets = () => {
    if (!analytics?.timeOfDayAccuracy) return null;
    const items = Object.entries(analytics.timeOfDayAccuracy);
    const sum = items.reduce((acc, [, v]) => acc + (v || 0), 0);
    if (sum === 0) return null; // hide if no signal yet
    return (
      <View style={styles.card}>
        <Text style={styles.chartTitle}>Time of Day Performance</Text>
        {items.map(([k, v]) => (
          <View key={k} style={styles.row}>
            <Text style={styles.rowLeft}>{k[0].toUpperCase() + k.slice(1)}</Text>
            <Text style={styles.rowRight}>{v}%</Text>
          </View>
        ))}
      </View>
    );
  };

  const renderSummaryCards = () => {
    if (!analytics || !stats) return null;
    const counts = analyticsService.getTodayAndTotalCounts();
    const recordStreak = analyticsService.getRecordStreak();
    return (
      <View style={styles.summaryContainer}>
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
            <CalendarDays size={24} color="#F2AB27" />
          </View>
          <View style={styles.summaryContent}>
            <Text style={styles.summaryValue}>{counts.today}</Text>
            <Text style={styles.summaryLabel}>Exercises Today</Text>
          </View>
        </View>

        <View style={styles.summaryCard}>
          <View style={styles.summaryIcon}>
            <BarChart3 size={24} color="#2196F3" />
          </View>
          <View style={styles.summaryContent}>
            <Text style={styles.summaryValue}>{counts.total}</Text>
            <Text style={styles.summaryLabel}>Exercises Overall</Text>
          </View>
        </View>

        <View style={styles.summaryCard}>
          <View style={styles.summaryIcon}>
            <Award size={24} color="#e28743" />
          </View>
          <View style={styles.summaryContent}>
            <Text style={styles.summaryValue}>{recordStreak}</Text>
            <Text style={styles.summaryLabel}>Record Streak</Text>
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
        <TouchableOpacity
          style={styles.resetButton}
          onPress={async () => {
            Alert.alert('Reset analytics?', 'This will clear your local analytics history.', [
              { text: 'Cancel', style: 'cancel' },
              {
                text: 'Reset',
                style: 'destructive',
                onPress: async () => {
                  try {
                    await analyticsService.clearData();
                    await loadAnalytics();
                    const exerciseStats = analyticsService.getExerciseStats();
                    setStats(exerciseStats);
                  } catch (e) {
                    console.error('Failed to reset analytics:', e);
                  }
                },
              },
            ]);
          }}
        >
          <Text style={styles.resetText}>Reset</Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {renderSummaryCards()}
        {renderDonutChart()}
        {renderRecommendations()}
        {/* Deep analytics toggle */}
        <View style={styles.deepToggleRow}>
          <TouchableOpacity
            style={styles.deepToggle}
            onPress={() => {
              LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
              setDeepOpen(o => !o);
            }}
            activeOpacity={0.8}
          >
            <Text style={styles.deepToggleText}>{deepOpen ? 'Hide Deep Analytics' : 'Show Deep Analytics'}</Text>
            <View style={{ transform: [{ rotate: deepOpen ? '180deg' : '0deg' }] }}>
              <ChevronDown size={16} color="#E5E7EB" />
            </View>
          </TouchableOpacity>
        </View>

        <View style={[styles.deepContent, !deepOpen && styles.deepCollapsed]} pointerEvents={deepOpen ? 'auto' : 'none'}>
          {renderAccuracyChart()}
          {renderTrendChart()}
          {renderSrsHealth()}
          {renderWeakWords()}
          {renderTagBreakdown()}
          {renderTimeBuckets()}
        </View>
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
    color: '#fff',
    fontFamily: 'Ubuntu_700Bold',
  },
  placeholder: {
    width: 40,
  },
  resetButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e05f2a',
  },
  resetText: {
    color: '#e05f2a',
    fontSize: 12,
    fontFamily: 'Ubuntu_500Medium',
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
    color: '#fff',
    fontFamily: 'Ubuntu_700Bold',
  },
  summaryLabel: {
    fontSize: 12,
    color: '#a0a0a0',
    marginTop: 2,
    fontFamily: 'Ubuntu_400Regular',
  },
  chartContainer: {
    backgroundColor: '#2c2f2f',
    borderRadius: 12,
    padding: 20,
    marginBottom: 20,
  },
  deepToggleRow: {
    marginTop: 4,
    marginBottom: 12,
  },
  deepToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    alignSelf: 'center',
    backgroundColor: '#1f2a2b',
    borderWidth: 1,
    borderColor: '#334346',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 999,
  },
  deepToggleText: {
    color: '#E5E7EB',
    fontSize: 13,
    fontFamily: 'Ubuntu_700Bold',
  },
  deepContent: {
    overflow: 'hidden',
  },
  deepCollapsed: {
    height: 0,
  },
  card: { backgroundColor: '#2C2C2C', borderRadius: 12, padding: 16, marginBottom: 20 },
  cardTitle: { fontSize: 16, color: '#fff', marginBottom: 12, fontFamily: 'Ubuntu_700Bold' },
  recoRow: { flexDirection: 'row', gap: 10, alignItems: 'center', paddingVertical: 6 },
  recoIcon: { width: 26, height: 26, borderRadius: 13, alignItems: 'center', justifyContent: 'center' },
  recoText: { color: '#E5E7EB', fontSize: 14, flex: 1, fontFamily: 'Ubuntu_400Regular' },
  card: {
    backgroundColor: '#2c2f2f',
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 6,
  },
  rowLeft: { color: '#E5E7EB', fontSize: 14, fontFamily: 'Ubuntu_500Medium' },
  rowRight: { color: '#9CA3AF', fontSize: 14, fontFamily: 'Ubuntu_500Medium' },
  splitRow: { flexDirection: 'row', gap: 16 },
  splitCol: { flex: 1 },
  subheading: { color: '#9CA3AF', fontSize: 13, marginBottom: 6, fontFamily: 'Ubuntu_700Bold' },
  chartTitle: {
    fontSize: 18,
    color: '#fff',
    marginBottom: 16,
    textAlign: 'center',
    fontFamily: 'Ubuntu_700Bold',
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
    width: 28,
    borderRadius: 6,
    minHeight: 4,
  },
  barLabel: {
    fontSize: 10,
    color: '#a0a0a0',
    textAlign: 'center',
    fontFamily: 'Ubuntu_400Regular',
  },
  barValue: {
    fontSize: 12,
    color: '#fff',
    marginTop: 4,
    fontFamily: 'Ubuntu_700Bold',
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
  trendBar: {
    width: 10,
    backgroundColor: '#e28743',
    borderRadius: 3,
    alignSelf: 'center',
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
    fontFamily: 'Ubuntu_400Regular',
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
    color: '#fff',
    fontFamily: 'Ubuntu_700Bold',
  },
  donutLabel: {
    fontSize: 12,
    color: '#a0a0a0',
    fontFamily: 'Ubuntu_400Regular',
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
    fontFamily: 'Ubuntu_400Regular',
  },
});

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
import { ArrowLeft, TrendingUp, CalendarDays, CheckCircle2, AlertTriangle, Clock3, ChevronDown } from 'lucide-react-native';
import LottieView from 'lottie-react-native';
import { LinearGradient } from '../lib/LinearGradient';
import { useAppStore } from '../lib/store';
import { analyticsService } from '../services/AnalyticsService';
import { vaultService } from '../services/VaultService';

const { width } = Dimensions.get('window');

export default function StatsScreen() {
  const router = useRouter();
  const { analytics, loadAnalytics } = useAppStore();
  const themeName = useAppStore(s => s.theme);
  const isLight = themeName === 'light';
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
    // Scale bars to absolute accuracy (0–100%), not relative to the current max,
    // so a single non‑zero category does not fill the entire height.
    const MAX_BAR_PX = 100;

    return (
      <View style={[styles.card, isLight && styles.cardLight]}>
        <Text style={[styles.cardTitle, isLight && styles.cardTitleLight]}>Accuracy by Exercise</Text>
        <View style={styles.barChart}>
          {exerciseTypes.map((type, index) => {
            const accuracy = analytics.accuracyByType[type];
            const height = Math.max(6, (Number(accuracy) / 100) * MAX_BAR_PX);
            const gradient = accuracy >= 80
              ? ['#2e7d32', '#4CAF50']
              : accuracy >= 60
              ? ['#b36b00', '#F8B070']
              : ['#c62828', '#F87171'];

            return (
              <View key={type} style={styles.barContainer}>
                <View style={styles.barWrapper}>
                  <LinearGradient colors={gradient} start={{x:0,y:0}} end={{x:0,y:1}} style={[styles.bar, { height }]} />
                </View>
                <Text style={[styles.barLabel, isLight && styles.barLabelLight]}>{type.toUpperCase()}</Text>
                <Text style={[styles.barValue, isLight && styles.barValueLight]}>{accuracy}%</Text>
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
    const bgFor = (k: string) => k === 'srs' ? '#187486' : k === 'weak' ? '#F8B070' : '#4CAF50';
    return (
      <View style={[styles.card, isLight && styles.cardLight]}>
        <Text style={[styles.cardTitle, isLight && styles.cardTitleLight]}>Recommendations</Text>
        {items.map((r, idx) => (
          <View key={`${r.kind}-${idx}`} style={styles.recoRow}>
            <View style={[styles.recoIcon, { backgroundColor: bgFor(r.kind) }]}>
              {iconFor(r.kind)}
            </View>
            <Text style={[styles.recoText, isLight && styles.recoTextLight]}>{r.text}</Text>
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
      <View style={[styles.chartContainer, isLight && styles.chartContainerLight]}>
        <Text style={[styles.chartTitle, isLight && styles.chartTitleLight]}>Time Spent per Day (Last 7 Days)</Text>
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
              <Text key={index} style={[styles.trendLabel, isLight && styles.trendLabelLight]}>
                {new Date(point.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
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
      <View style={[styles.card, isLight && styles.cardLight]}>
        <Text style={[styles.chartTitle, isLight && styles.chartTitleLight]}>SRS Health</Text>
        <View style={styles.row}><Text style={[styles.rowLeft, isLight && styles.rowLeftLight]}>Due now</Text><Text style={[styles.rowRight, isLight && styles.rowRightLight]}>{ob.today || 0}</Text></View>
        <View style={styles.row}><Text style={[styles.rowLeft, isLight && styles.rowLeftLight]}>Overdue</Text><Text style={[styles.rowRight, isLight && styles.rowRightLight, { color: overdueOther > 0 ? '#F8B070' : (isLight ? '#6B7280' : '#9CA3AF') }]}>{overdueOther}</Text></View>
        <View style={styles.row}><Text style={[styles.rowLeft, isLight && styles.rowLeftLight]}>Avg EF</Text><Text style={[styles.rowRight, isLight && styles.rowRightLight]}>{srs.avgEaseFactor}</Text></View>
        <View style={styles.row}><Text style={[styles.rowLeft, isLight && styles.rowLeftLight]}>Avg Interval</Text><Text style={[styles.rowRight, isLight && styles.rowRightLight]}>{srs.avgInterval} d</Text></View>
        {srs.topLapses?.length ? (
          <View style={[styles.row, { paddingTop: 8 }]}>
            <Text style={[styles.rowLeft, isLight && styles.rowLeftLight]}>Most lapses</Text>
            <Text style={[styles.rowRight, { color: '#F87171' }]}>
              {srs.topLapses.slice(0, 3).map(w => w.word).join(', ')}
            </Text>
          </View>
        ) : null}
      </View>
    );
  };

  const renderDonutChart = () => {
    // Words Learned: a word counts as learned after 3 correct answers
    // across any exercises (global), independent of SRS stage.
    const words = vaultService.getAllWords();
    const total = words.length;
    const learned = words.filter(w => (w.correctCount ?? 0) >= 3).length;
    const remaining = Math.max(0, total - learned);
    const percent = total ? Math.round((learned / total) * 100) : 0;

    return (
      <View style={[styles.chartContainer, isLight && styles.chartContainerLight]}>
        <Text style={[styles.chartTitle, isLight && styles.chartTitleLight]}>Words Learned</Text>
        <View style={styles.donutChart}>
          <View style={[styles.donutOuter, isLight && styles.donutOuterLight]}>
            <View style={styles.donutInner}>
              <Text style={[styles.donutValue, isLight && styles.donutValueLight]}>{learned}</Text>
              <Text style={[styles.donutLabel, isLight && styles.donutLabelLight]}>of {total}</Text>
              <Text style={[styles.donutLabel, isLight && styles.donutLabelLight, { marginTop: 2 }]}>{percent}%</Text>
            </View>
          </View>
          <View style={styles.donutLegend}>
            <View style={styles.legendItem}>
              <View style={[styles.legendColor, { backgroundColor: '#4CAF50' }]} />
              <Text style={[styles.legendText, isLight && styles.legendTextLight]}>Learned ({learned})</Text>
            </View>
            <View style={styles.legendItem}>
              <View style={[styles.legendColor, { backgroundColor: '#6B7280' }]} />
              <Text style={[styles.legendText, isLight && styles.legendTextLight]}>Remaining ({remaining})</Text>
            </View>
          </View>
        </View>
      </View>
    );
  };

  const renderWeakWords = () => {
    if (!analytics?.weakWords || analytics.weakWords.length === 0) return null;
    return (
      <View style={[styles.card, isLight && styles.cardLight]}>
        <Text style={[styles.chartTitle, isLight && styles.chartTitleLight]}>Weakest Words</Text>
        {analytics.weakWords.slice(0, 8).map((w: any, idx: number) => (
          <View key={`${w.word}-${idx}`} style={styles.row}>
            <Text style={[styles.rowLeft, isLight && styles.rowLeftLight]}>{w.word}</Text>
            <Text style={[styles.rowRight, isLight && styles.rowRightLight, { color: w.accuracy < 50 ? '#F87171' : '#F8B070' }]}>{w.accuracy}% • {w.attempts}x</Text>
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
      <View style={[styles.card, isLight && styles.cardLight]}>
        <Text style={[styles.chartTitle, isLight && styles.chartTitleLight]}>Skill by Topic</Text>
        <View style={styles.splitRow}>
          <View style={styles.splitCol}>
            <Text style={[styles.subheading, isLight && styles.subheadingLight]}>Weak</Text>
            {weakest.map((t, idx) => (
              <View key={`w-${t.tag}-${idx}`} style={styles.row}>
                <Text style={[styles.rowLeft, isLight && styles.rowLeftLight]}>{t.tag}</Text>
                <Text style={[styles.rowRight, isLight && styles.rowRightLight, { color: '#F87171' }]}>{t.accuracy}% • {t.attempts}x</Text>
              </View>
            ))}
          </View>
          <View style={styles.splitCol}>
            <Text style={[styles.subheading, isLight && styles.subheadingLight]}>Strong</Text>
            {strongest.map((t, idx) => (
              <View key={`s-${t.tag}-${idx}`} style={styles.row}>
                <Text style={[styles.rowLeft, isLight && styles.rowLeftLight]}>{t.tag}</Text>
                <Text style={[styles.rowRight, isLight && styles.rowRightLight, { color: '#4CAF50' }]}>{t.accuracy}% • {t.attempts}x</Text>
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
      <View style={[styles.card, isLight && styles.cardLight]}>
        <Text style={[styles.chartTitle, isLight && styles.chartTitleLight]}>Time of Day Performance</Text>
        {items.map(([k, v]) => (
          <View key={k} style={styles.row}>
            <Text style={[styles.rowLeft, isLight && styles.rowLeftLight]}>{k[0].toUpperCase() + k.slice(1)}</Text>
            <Text style={[styles.rowRight, isLight && styles.rowRightLight]}>{v}%</Text>
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
        <View style={[styles.summaryCard, isLight && styles.summaryCardLight]}>
          <View style={[styles.summaryIcon, isLight && styles.summaryIconLight]}>
            <LottieView source={require('../assets/lottie/growth_progress.json')} autoPlay loop style={{ width: 40, height: 40 }} />
          </View>
          <View style={styles.summaryContent}>
            <Text style={[styles.summaryValue, isLight && styles.summaryValueLight]}>{counts.total}</Text>
            <Text style={[styles.summaryLabel, isLight && styles.summaryLabelLight]}>Exercises Overall</Text>
          </View>
        </View>

        <View style={[styles.summaryCard, isLight && styles.summaryCardLight]}>
          <View style={[styles.summaryIcon, isLight && styles.summaryIconLight]}>
            <LottieView source={require('../assets/lottie/Bestseller.json')} autoPlay loop style={{ width: 40, height: 40 }} />
          </View>
          <View style={styles.summaryContent}>
            <Text style={[styles.summaryValue, isLight && styles.summaryValueLight]}>{recordStreak}</Text>
            <Text style={[styles.summaryLabel, isLight && styles.summaryLabelLight]}>Record Streak</Text>
          </View>
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={[styles.container, isLight && styles.containerLight]}>
      <View style={[styles.header, isLight && styles.headerLight]}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <ArrowLeft size={24} color={isLight ? '#111827' : '#fff'} />
        </TouchableOpacity>
        <Text style={[styles.title, isLight && styles.titleLight]}>Analytics</Text>
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
          <Text style={[styles.resetText, isLight && styles.resetTextLight]}>Reset</Text>
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
  containerLight: {
    backgroundColor: '#F8F8F8',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    // remove bottom divider
  },
  headerLight: {
    // remove divider in light as well
  },
  backButton: {
    padding: 8,
  },
  title: {
    fontSize: 20,
    color: '#fff',
    fontFamily: 'Ubuntu-Bold',
  },
  titleLight: { color: '#111827' },
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
    fontFamily: 'Ubuntu-Medium',
  },
  resetTextLight: { color: '#c24d1f' },
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
  summaryCardLight: { backgroundColor: '#FFFFFF' },
  summaryIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'transparent',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  summaryIconLight: { backgroundColor: 'transparent' },
  summaryContent: {
    flex: 1,
  },
  summaryValue: {
    fontSize: 20,
    color: '#fff',
    fontFamily: 'Ubuntu-Bold',
  },
  summaryValueLight: { color: '#111827' },
  summaryLabel: {
    fontSize: 12,
    color: '#a0a0a0',
    marginTop: 2,
    fontFamily: 'Ubuntu-Regular',
  },
  summaryLabelLight: { color: '#6B7280' },
  chartContainer: {
    backgroundColor: '#2c2f2f',
    borderRadius: 12,
    padding: 20,
    marginBottom: 20,
  },
  chartContainerLight: { backgroundColor: '#FFFFFF' },
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
    fontFamily: 'Ubuntu-Bold',
  },
  deepToggleTextLight: { color: '#374151' },
  deepContent: {
    overflow: 'hidden',
  },
  deepCollapsed: {
    height: 0,
  },
  card: { backgroundColor: '#2C2C2C', borderRadius: 12, padding: 16, marginBottom: 20 },
  cardLight: { backgroundColor: '#FFFFFF' },
  cardTitle: { fontSize: 16, color: '#fff', marginBottom: 12, fontFamily: 'Ubuntu-Bold' },
  cardTitleLight: { color: '#111827' },
  recoRow: { flexDirection: 'row', gap: 10, alignItems: 'center', paddingVertical: 6 },
  recoIcon: { width: 26, height: 26, borderRadius: 13, alignItems: 'center', justifyContent: 'center' },
  recoText: { color: '#E5E7EB', fontSize: 14, flex: 1, fontFamily: 'Ubuntu-Regular' },
  recoTextLight: { color: '#374151' },
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
  rowLeft: { color: '#E5E7EB', fontSize: 14, fontFamily: 'Ubuntu-Medium' },
  rowRight: { color: '#9CA3AF', fontSize: 14, fontFamily: 'Ubuntu-Medium' },
  splitRow: { flexDirection: 'row', gap: 16 },
  splitCol: { flex: 1 },
  subheading: { color: '#9CA3AF', fontSize: 13, marginBottom: 6, fontFamily: 'Ubuntu-Bold' },
  chartTitle: {
    fontSize: 18,
    color: '#fff',
    marginBottom: 16,
    textAlign: 'center',
    fontFamily: 'Ubuntu_700Bold',
  },
  chartTitleLight: {
    color: '#111827',
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
    height: 100,
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
    fontFamily: 'Ubuntu-Regular',
  },
  barLabelLight: { color: '#6B7280' },
  barValue: {
    fontSize: 12,
    color: '#fff',
    marginTop: 4,
    fontFamily: 'Ubuntu-Bold',
  },
  barValueLight: { color: '#111827' },
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
    fontFamily: 'Ubuntu-Regular',
  },
  trendLabelLight: { color: '#6B7280' },
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
  donutOuterLight: { backgroundColor: '#E9E6E0' },
  donutInner: {
    alignItems: 'center',
  },
  donutValue: {
    fontSize: 24,
    color: '#fff',
    fontFamily: 'Ubuntu-Bold',
  },
  donutValueLight: { color: '#111827' },
  donutLabel: {
    fontSize: 12,
    color: '#a0a0a0',
    fontFamily: 'Ubuntu-Regular',
  },
  donutLabelLight: { color: '#6B7280' },
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
    fontFamily: 'Ubuntu-Regular',
  },
  legendTextLight: { color: '#374151' },
  rowLeftLight: { color: '#111827' },
  rowRightLight: { color: '#6B7280' },
  subheadingLight: { color: '#6B7280' },
});

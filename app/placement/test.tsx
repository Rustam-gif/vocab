import React, { useMemo, useRef, useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, SafeAreaView, Animated, Easing } from 'react-native';
import { useRouter } from 'expo-router';
import { buildBank, pickNextItem, startSession, updateAbility, recommendedLevelFromAbility, PlacementItem, Band } from '../../services/PlacementService';
import { analyticsService } from '../../services/AnalyticsService';
import { LinearGradient } from 'expo-linear-gradient';

const TOTAL = 30;

export default function PlacementTest() {
  const router = useRouter();
  const bank = useMemo(() => buildBank(), []);
  const sessionRef = useRef(startSession());
  const targetBandForIndex = (idx: number): Band => {
    // Groups of 5: 0:A1, 1:A2, 2:B1, 3:B2, 4:B2, 5:B2
    const group = Math.floor(idx / 5);
    if (group === 0) return 'A1';
    if (group === 1) return 'A2';
    if (group === 2) return 'B1';
    return 'B2';
  };
  const [current, setCurrent] = useState<PlacementItem | null>(() => pickNextItem(bank, sessionRef.current, targetBandForIndex(0)));
  const [index, setIndex] = useState(0);
  const [selected, setSelected] = useState<number | null>(null);
  const [locked, setLocked] = useState(false);
  const [wrongStreak, setWrongStreak] = useState(0);
  const progressAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(progressAnim, {
      toValue: index / TOTAL,
      duration: 420,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: false,
    }).start();
  }, [index, progressAnim]);

  if (!current) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.center}><Text style={styles.text}>No items available.</Text></View>
      </SafeAreaView>
    );
  }

  const allOptions = useMemo(() => current.options, [current]);

  const handleAnswer = async (choiceIndex: number | null) => {
    if (locked) return;
    setLocked(true);
    const choice = choiceIndex == null ? null : allOptions[choiceIndex];
    const correct = choiceIndex != null && choiceIndex === current.correctIndex;
    // Log analytics
    try {
      analyticsService.recordResult({
        wordId: current.word,
        exerciseType: 'placement',
        correct,
        timeSpent: 0,
        timestamp: new Date(),
        score: correct ? 1 : 0,
      });
    } catch {}

    // Update session ability
    updateAbility(sessionRef.current, current, !!correct);
    sessionRef.current.asked.push(current.id);
    sessionRef.current.answers.push({ itemId: current.id, correct: !!correct, chosen: choice || undefined, timestamp: new Date() });

    // Track wrong streak for early stop
    const nextStreak = correct ? 0 : wrongStreak + 1;
    setWrongStreak(nextStreak);
    if (nextStreak >= 3) {
      const ability = sessionRef.current.ability;
      const levelId = recommendedLevelFromAbility(ability);
      router.replace({ pathname: '/placement/result', params: { levelId, ability: String(ability), early: '1', q: String(index + 1) } });
      return;
    }

    const nextIndex = index + 1;
    if (nextIndex >= TOTAL) {
      const ability = sessionRef.current.ability;
      const levelId = recommendedLevelFromAbility(ability);
      router.replace({ pathname: '/placement/result', params: { levelId, ability: String(ability) } });
      return;
    }
    // Force target band per group of 5
    const desiredBand = targetBandForIndex(nextIndex);
    const next = pickNextItem(bank, sessionRef.current, desiredBand);
    setIndex(nextIndex);
    setSelected(null);
    setLocked(false);
    setCurrent(next);
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <View style={styles.headerRow}>
          <Text style={styles.headerTitle}>Placement Test</Text>
          <View style={styles.headerRight}>
            <View style={styles.counterPill}><Text style={styles.counterText}>{index + 1}/{TOTAL}</Text></View>
            <View style={[styles.bandPill, bandColors(targetBandForIndex(index)).pill]}> 
              <Text style={[styles.bandText, bandColors(targetBandForIndex(index)).text]}>{targetBandForIndex(index)}</Text>
            </View>
          </View>
        </View>
        <View style={styles.progressBar}>
          <Animated.View style={[styles.progressFill, { width: progressAnim.interpolate({ inputRange: [0,1], outputRange: ['0%', '100%'] }) }]} />
        </View>
      </View>
      <View style={styles.questionCard}>
        <Text style={styles.word}>{current.word}</Text>
        <Text style={styles.prompt}>{current.prompt}</Text>
        {current.meta?.example ? (
          <Text style={styles.example}>Example: {current.meta.example}</Text>
        ) : null}
        <View style={styles.options}>
          {allOptions.map((opt, i) => (
            <TouchableOpacity
              key={`${current.id}-${i}`}
              style={[styles.option, selected === i && styles.optionSelected]}
              onPress={() => setSelected(i)}
              disabled={locked}
              activeOpacity={0.8}
            >
              <View style={styles.optionInnerRow}>
                <View style={[styles.radio, selected === i && styles.radioActive]} />
                <Text style={styles.optionText}>{opt}</Text>
              </View>
            </TouchableOpacity>
          ))}
        </View>
      </View>
      <View style={styles.footer}>
        <TouchableOpacity
          style={[styles.btn, selected == null && styles.btnDisabled]}
          onPress={() => handleAnswer(selected)}
          disabled={locked || selected == null}
          activeOpacity={0.9}
        >
          <LinearGradient colors={['#F6A063', '#F2935C']} start={{x:0,y:0}} end={{x:1,y:1}} style={styles.nextGradient}>
            <Text style={styles.btnText}>Next</Text>
          </LinearGradient>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#121415' },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  text: { color: '#fff' },
  header: { padding: 16 },
  headerRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 },
  headerTitle: { color: '#E5E7EB', fontSize: 16, fontWeight: '800' },
  headerRight: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  counterPill: { backgroundColor: 'rgba(255,255,255,0.08)', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 10, borderWidth: StyleSheet.hairlineWidth, borderColor: 'rgba(255,255,255,0.15)' },
  counterText: { color: '#E5E7EB', fontSize: 12, fontWeight: '700' },
  headerText: { color: '#9CA3AF', fontWeight: '700' },
  streakWarn: { color: '#F2AB27', fontWeight: '700', marginTop: 4 },
  progressBar: { height: 8, backgroundColor: 'rgba(255,255,255,0.08)', borderRadius: 6, overflow: 'hidden', borderWidth: StyleSheet.hairlineWidth, borderColor: 'rgba(255,255,255,0.12)' },
  progressFill: { height: '100%', backgroundColor: '#187486', borderRadius: 6 },
  questionCard: { backgroundColor: 'rgba(44,47,47,0.9)', marginHorizontal: 16, borderRadius: 18, padding: 18, borderWidth: StyleSheet.hairlineWidth, borderColor: '#3d474b', shadowColor: '#000', shadowOpacity: 0.35, shadowRadius: 16, shadowOffset: { width: 0, height: 12 }, elevation: 8, marginTop: 8 },
  word: { color: '#fff', fontSize: 26, fontWeight: '900' },
  prompt: { color: '#9CA3AF', marginTop: 8, marginBottom: 12, fontSize: 14 },
  example: { color: '#9CA3AF', fontStyle: 'italic', marginBottom: 12 },
  options: { gap: 10 },
  option: { backgroundColor: 'rgba(62,70,74,0.88)', borderWidth: StyleSheet.hairlineWidth, borderColor: '#4b555a', borderRadius: 12, paddingVertical: 12, paddingHorizontal: 14 },
  optionSelected: { borderColor: '#F2935C' },
  optionInnerRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 10, flexWrap: 'wrap' },
  radio: { width: 14, height: 14, borderRadius: 7, borderWidth: 2, borderColor: '#6B7280', marginTop: 3 },
  radioActive: { borderColor: '#F2935C', backgroundColor: '#F2935C' },
  optionText: { color: '#E5E7EB', fontSize: 15, fontWeight: '600', flex: 1, flexShrink: 1, lineHeight: 20 },
  footer: { flexDirection: 'row', gap: 10, padding: 16 },
  btn: { flex: 1, borderRadius: 12, paddingVertical: 0, alignItems: 'center', overflow: 'hidden' },
  nextGradient: { width: '100%', borderRadius: 12, alignItems: 'center', justifyContent: 'center', paddingVertical: 12, minHeight: 44 },
  btnText: { color: '#fff', fontWeight: '800' },
  btnDisabled: { opacity: 0.6 },
});

function bandColors(b: Band) {
  switch (b) {
    case 'A1':
      return { pill: { backgroundColor: 'rgba(33,150,243,0.15)', borderColor: 'rgba(33,150,243,0.4)', borderWidth: StyleSheet.hairlineWidth, borderRadius: 10, paddingHorizontal: 8, paddingVertical: 4 }, text: { color: '#64B5F6', fontWeight: '800', fontSize: 12 } } as any;
    case 'A2':
      return { pill: { backgroundColor: 'rgba(102,187,106,0.15)', borderColor: 'rgba(102,187,106,0.4)', borderWidth: StyleSheet.hairlineWidth, borderRadius: 10, paddingHorizontal: 8, paddingVertical: 4 }, text: { color: '#81C784', fontWeight: '800', fontSize: 12 } } as any;
    case 'B1':
      return { pill: { backgroundColor: 'rgba(255,202,40,0.15)', borderColor: 'rgba(255,202,40,0.4)', borderWidth: StyleSheet.hairlineWidth, borderRadius: 10, paddingHorizontal: 8, paddingVertical: 4 }, text: { color: '#FFCA28', fontWeight: '800', fontSize: 12 } } as any;
    default:
      return { pill: { backgroundColor: 'rgba(242,147,92,0.15)', borderColor: 'rgba(242,147,92,0.4)', borderWidth: StyleSheet.hairlineWidth, borderRadius: 10, paddingHorizontal: 8, paddingVertical: 4 }, text: { color: '#F2935C', fontWeight: '800', fontSize: 12 } } as any;
  }
}

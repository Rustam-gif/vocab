import React, { useMemo, useRef, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, SafeAreaView } from 'react-native';
import { useRouter } from 'expo-router';
import { buildBank, pickNextItem, startSession, updateAbility, recommendedLevelFromAbility, PlacementItem, Band } from '../../services/PlacementService';
import { analyticsService } from '../../services/AnalyticsService';

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
        <View style={styles.progressBar}>
          <View style={[styles.progressFill, { width: `${Math.min(100, Math.round((index / TOTAL) * 100))}%` }]} />
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
              <Text style={styles.optionText}>{opt}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>
      <View style={styles.footer}>
        <TouchableOpacity style={[styles.btn, styles.skip]} onPress={() => handleAnswer(null)} disabled={locked}>
          <Text style={styles.btnText}>I don't know</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.btn, styles.next, !selected && styles.btnDisabled]} onPress={() => handleAnswer(selected)} disabled={locked || selected == null}>
          <Text style={styles.btnText}>Next</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#1E1E1E' },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  text: { color: '#fff' },
  header: { padding: 16 },
  headerText: { color: '#9CA3AF', fontWeight: '700' },
  streakWarn: { color: '#F2AB27', fontWeight: '700', marginTop: 4 },
  progressBar: { height: 6, backgroundColor: '#2F2F2F', borderRadius: 3 },
  progressFill: { height: 6, backgroundColor: '#187486', borderRadius: 3 },
  questionCard: { backgroundColor: '#2C2C2C', marginHorizontal: 16, borderRadius: 16, padding: 16, borderWidth: 1, borderColor: '#333' },
  word: { color: '#fff', fontSize: 24, fontWeight: '800' },
  prompt: { color: '#9CA3AF', marginTop: 8, marginBottom: 12 },
  example: { color: '#9CA3AF', fontStyle: 'italic', marginBottom: 12 },
  options: { gap: 10 },
  option: { backgroundColor: '#2A2A2A', borderWidth: 1, borderColor: '#374151', borderRadius: 12, padding: 12 },
  optionSelected: { borderColor: '#F2935C' },
  optionText: { color: '#E5E7EB' },
  footer: { flexDirection: 'row', gap: 10, padding: 16 },
  btn: { flex: 1, borderRadius: 12, paddingVertical: 12, alignItems: 'center' },
  skip: { backgroundColor: '#374151' },
  next: { backgroundColor: '#F2935C' },
  btnText: { color: '#fff', fontWeight: '700' },
  btnDisabled: { opacity: 0.6 },
});

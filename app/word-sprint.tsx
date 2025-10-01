import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import { View, Text, StyleSheet, TouchableOpacity, Animated, Easing } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useAppStore } from '../lib/store';
import { analyticsService } from '../services/AnalyticsService';

const QUESTION_TIME_MS = 5000;

export default function WordSprint() {
  const router = useRouter();
  const { folderId, title } = useLocalSearchParams<{ folderId: string; title?: string }>();
  const { words, loadWords } = useAppStore();
  const [index, setIndex] = useState(0);
  const [correctCount, setCorrectCount] = useState(0);
  const [revealed, setRevealed] = useState(false);
  const [selected, setSelected] = useState<number | null>(null);
  const barAnim = useRef(new Animated.Value(0)).current;
  const tickRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    (async () => { await loadWords(); })();
  }, [loadWords]);

  const items = useMemo(() => words.filter(w => w.folderId === folderId), [words, folderId]);

  const current = items[Math.min(index, Math.max(0, items.length - 1))];
  const options = useMemo(() => {
    const all = items.map(w => w.word).filter(w => w !== current?.word);
    const distractors = all.sort(() => Math.random() - 0.5).slice(0, 2);
    const opts = [current?.word, ...distractors].filter(Boolean) as string[];
    return opts.sort(() => Math.random() - 0.5);
  }, [current, items]);

  const startTimer = useCallback(() => {
    barAnim.setValue(0);
    Animated.timing(barAnim, { toValue: 1, duration: QUESTION_TIME_MS, easing: Easing.linear, useNativeDriver: false }).start(({ finished }) => {
      if (finished && !revealed) {
        handleReveal();
      }
    });
    if (tickRef.current) clearTimeout(tickRef.current);
    tickRef.current = setTimeout(() => {}, QUESTION_TIME_MS);
  }, [barAnim, revealed]);

  useEffect(() => { if (items.length) startTimer(); }, [index, items.length, startTimer]);

  const handlePick = (idx: number) => {
    if (revealed) return;
    setSelected(idx);
    handleReveal(idx);
  };

  const handleReveal = (pickedIndex: number | null = selected) => {
    setRevealed(true);
    const picked = typeof pickedIndex === 'number' ? options[pickedIndex] : null;
    const isCorrect = picked === current?.word;
    if (isCorrect) setCorrectCount(c => c + 1);
    // record analytics as 'sprint'
    try {
      analyticsService.recordResult({
        wordId: current?.word || '',
        exerciseType: 'sprint',
        correct: !!isCorrect,
        timeSpent: 5,
        timestamp: new Date(),
        score: isCorrect ? 1 : 0,
      });
    } catch {}
    setTimeout(() => {
      const next = index + 1;
      if (next >= items.length) {
        router.back();
      } else {
        setSelected(null);
        setRevealed(false);
        setIndex(next);
      }
    }, 900);
  };

  if (!current) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.center}>
          <Text style={styles.emptyText}>No words in this folder.</Text>
        </View>
      </SafeAreaView>
    );
  }

  const progressWidth = barAnim.interpolate({ inputRange: [0, 1], outputRange: ['0%', '100%'] });
  const bgColor = barAnim.interpolate({ inputRange: [0, 1], outputRange: ['#3A3A3A', '#e28743'] });

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>{title || 'Word Sprint'}</Text>
        <Text style={styles.counter}>{index + 1}/{items.length}</Text>
      </View>
      <View style={styles.progressWrap}>
        <Animated.View style={[styles.progressFill, { width: progressWidth, backgroundColor: bgColor }]} />
      </View>
      <View style={styles.card}>
        <Text style={styles.definition}>{current.definition}</Text>
        <View style={{ height: 16 }} />
        {options.map((opt, i) => {
          const isPicked = selected === i;
          const isAnswer = revealed && opt === current.word;
          const wrong = revealed && isPicked && !isAnswer;
          return (
            <TouchableOpacity key={opt} style={[styles.option, isAnswer && styles.correct, wrong && styles.wrong]} onPress={() => handlePick(i)} disabled={revealed}>
              <Text style={styles.optionText}>{opt}</Text>
            </TouchableOpacity>
          );
        })}
      </View>
      <View style={styles.footer}>
        <Text style={styles.footerText}>Correct: {correctCount}</Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#1E1E1E' },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  emptyText: { color: '#9CA3AF' },
  header: { paddingHorizontal: 20, paddingTop: 16, paddingBottom: 8, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  title: { color: '#fff', fontSize: 18, fontWeight: '700' },
  counter: { color: '#9CA3AF', fontSize: 12 },
  progressWrap: { height: 8, backgroundColor: '#2c2f2f', marginHorizontal: 20, borderRadius: 4, overflow: 'hidden' },
  progressFill: { height: '100%' },
  card: { margin: 20, backgroundColor: '#2c2f2f', borderRadius: 12, padding: 20 },
  definition: { color: '#e0e0e0', fontSize: 16, lineHeight: 22 },
  option: { backgroundColor: '#3A3A3A', borderRadius: 10, paddingVertical: 14, paddingHorizontal: 12, marginTop: 10 },
  optionText: { color: '#fff', fontSize: 15 },
  correct: { backgroundColor: '#437F76' },
  wrong: { backgroundColor: '#924646' },
  footer: { alignItems: 'center', paddingBottom: 20 },
  footerText: { color: '#9CA3AF', fontSize: 12 },
});



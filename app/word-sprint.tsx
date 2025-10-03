import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import { View, Text, StyleSheet, TouchableOpacity, Animated, Easing, Dimensions } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useAppStore } from '../lib/store';
import { analyticsService } from '../services/AnalyticsService';
import { ProgressService } from '../services/ProgressService';

const QUESTION_TIME_MS = 5000;
const SCREEN_HEIGHT = Dimensions.get('window').height;

export default function WordSprint() {
  const router = useRouter();
  const { folderId, title } = useLocalSearchParams<{ folderId: string; title?: string }>();
  const { words, loadWords, loadProgress } = useAppStore();
  const [index, setIndex] = useState(0);
  const [correctCount, setCorrectCount] = useState(0);
  const [revealed, setRevealed] = useState(false);
  const [selected, setSelected] = useState<number | null>(null);
  const [finished, setFinished] = useState(false);
  const [timeLeft, setTimeLeft] = useState(QUESTION_TIME_MS / 1000);
  const [xpAwarded, setXpAwarded] = useState(false);
  const barAnim = useRef(new Animated.Value(0)).current;
  const timerRef = useRef<Animated.CompositeAnimation | null>(null);
  const advanceTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const revealedRef = useRef(false);
  const resultAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    (async () => { await loadWords(); })();
  }, [loadWords]);

  useEffect(() => {
    revealedRef.current = revealed;
  }, [revealed]);

  useEffect(() => {
    const id = barAnim.addListener(({ value }) => {
      const remaining = Math.max(0, QUESTION_TIME_MS * (1 - value));
      setTimeLeft(parseFloat((remaining / 1000).toFixed(1)));
    });
    return () => {
      barAnim.removeListener(id);
    };
  }, [barAnim]);

  useEffect(() => {
    return () => {
      timerRef.current?.stop();
      barAnim.stopAnimation();
      if (advanceTimeoutRef.current) {
        clearTimeout(advanceTimeoutRef.current);
        advanceTimeoutRef.current = null;
      }
    };
  }, [barAnim]);

  useEffect(() => {
    if (finished && !xpAwarded) {
      // Award XP for Word Sprint completion
      (async () => {
        try {
          const result = await ProgressService.recordExerciseCompletion(
            'sprint',
            correctCount,
            items.length,
            0
          );
          console.log(`[Word Sprint] XP Awarded: +${result.xpGained} XP (Level ${result.newLevel})`);
          if (result.leveledUp) {
            console.log(`🎉 Level Up! Now Level ${result.newLevel}`);
          }
          await loadProgress();
          setXpAwarded(true);
        } catch (error) {
          console.error('Failed to award XP:', error);
        }
      })();

      Animated.timing(resultAnim, {
        toValue: 1,
        duration: 320,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true
      }).start();
    } else {
      resultAnim.setValue(0);
    }
  }, [finished, resultAnim]);

  const items = useMemo(() => words.filter(w => w.folderId === folderId), [words, folderId]);

  const current = items[Math.min(index, Math.max(0, items.length - 1))];
  const currentWord = current?.word;
  const currentId = current?.id ?? currentWord ?? '';
  const options = useMemo(() => {
    if (!currentWord) return [];
    const all = items.map(w => w.word).filter(w => w !== currentWord);
    const distractors = all.sort(() => Math.random() - 0.5).slice(0, 2);
    const opts = [currentWord, ...distractors].filter(Boolean) as string[];
    return opts.sort(() => Math.random() - 0.5);
  }, [currentWord, items]);

  const finishTimer = useCallback(() => {
    if (timerRef.current) {
      timerRef.current.stop();
      timerRef.current = null;
    }
    barAnim.stopAnimation();
    Animated.timing(barAnim, {
      toValue: 1,
      duration: 260,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: false
    }).start();
    setTimeLeft(0);
  }, [barAnim]);

  const handleReveal = useCallback((pickedIndex: number | null) => {
    if (revealedRef.current || finished) return;
    revealedRef.current = true;
    finishTimer();
    setRevealed(true);
    const picked = typeof pickedIndex === 'number' ? options[pickedIndex] : null;
    const isCorrect = picked === currentWord;
    if (isCorrect) setCorrectCount(c => c + 1);
    try {
      analyticsService.recordResult({
        wordId: currentId,
        exerciseType: 'sprint',
        correct: !!isCorrect,
        timeSpent: QUESTION_TIME_MS / 1000,
        timestamp: new Date(),
        score: isCorrect ? 1 : 0,
      });
    } catch {}
    if (advanceTimeoutRef.current) {
      clearTimeout(advanceTimeoutRef.current);
    }
    advanceTimeoutRef.current = setTimeout(() => {
      const next = index + 1;
      if (next >= items.length) {
        revealedRef.current = false;
        setFinished(true);
        setRevealed(false);
        setSelected(null);
        timerRef.current?.stop();
        barAnim.stopAnimation();
      } else {
        setSelected(null);
        revealedRef.current = false;
        setRevealed(false);
        setIndex(next);
      }
      advanceTimeoutRef.current = null;
    }, 900);
  }, [finishTimer, options, currentWord, currentId, index, items.length, finished]);

  const startTimer = useCallback(() => {
    if (!items.length || finished) return;
    if (timerRef.current) {
      timerRef.current.stop();
      timerRef.current = null;
    }
    barAnim.stopAnimation();
    barAnim.setValue(0);
    setTimeLeft(QUESTION_TIME_MS / 1000);
    const anim = Animated.timing(barAnim, {
      toValue: 1,
      duration: QUESTION_TIME_MS,
      easing: Easing.linear,
      useNativeDriver: false
    });
    timerRef.current = anim;
    anim.start(({ finished: animFinished }) => {
      timerRef.current = null;
      if (animFinished && !finished && !revealedRef.current) {
        handleReveal(null);
      }
    });
  }, [barAnim, handleReveal, items.length, finished]);

  useEffect(() => {
    if (items.length && !finished) {
      startTimer();
    }
  }, [index, items.length, finished, startTimer]);

  const handlePick = useCallback((idx: number) => {
    if (revealedRef.current || finished) return;
    setSelected(idx);
    handleReveal(idx);
  }, [finished, handleReveal]);

  const handleRestart = useCallback(() => {
    if (advanceTimeoutRef.current) {
      clearTimeout(advanceTimeoutRef.current);
      advanceTimeoutRef.current = null;
    }
    timerRef.current?.stop();
    barAnim.stopAnimation();
    setCorrectCount(0);
    setIndex(0);
    setSelected(null);
    setRevealed(false);
    setXpAwarded(false);
    revealedRef.current = false;
    setFinished(false);
    setTimeLeft(QUESTION_TIME_MS / 1000);
  }, [barAnim]);

  if (!current) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.center}>
          <Text style={styles.emptyText}>No words in this folder.</Text>
        </View>
      </SafeAreaView>
    );
  }
  const progressHeight = barAnim.interpolate({ inputRange: [0, 1], outputRange: [SCREEN_HEIGHT, 0] });
  const progressOpacity = barAnim.interpolate({ inputRange: [0, 1], outputRange: [0.55, 0.08] });

  return (
    <SafeAreaView style={styles.container}>
      <View pointerEvents="none" style={styles.progressBackdrop}>
        <Animated.View style={[styles.progressColumn, { height: progressHeight, opacity: progressOpacity }]} />
      </View>
      <View style={styles.content}>
        <View style={styles.header}>
          <Text style={styles.title}>{title || 'Word Sprint'}</Text>
          <View style={styles.headerMeta}>
            <View style={styles.timerBadge}>
              <Text style={styles.timerIcon}>⌚</Text>
              <Text style={styles.timerText}>{timeLeft.toFixed(1)}s</Text>
            </View>
            <Text style={styles.counter}>{index + 1}/{items.length}</Text>
          </View>
        </View>
        <View style={styles.body}>
          <View style={styles.card}>
            <Text style={styles.definition}>{current.definition}</Text>
            <View style={{ height: 16 }} />
            {options.map((opt, i) => {
              const isPicked = selected === i;
              const isAnswer = revealed && opt === current.word;
              const wrong = revealed && isPicked && !isAnswer;
              return (
                <TouchableOpacity key={`${opt}-${i}`} style={[styles.option, isAnswer && styles.correct, wrong && styles.wrong]} onPress={() => handlePick(i)} disabled={revealed}>
                  <Text style={styles.optionText}>{opt}</Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>
        <View style={styles.footer}>
          <Text style={styles.footerText}>Correct: {correctCount}</Text>
        </View>
      </View>
      {finished && (
        <Animated.View style={[styles.resultOverlay, {
          opacity: resultAnim,
          transform: [{ translateY: resultAnim.interpolate({ inputRange: [0, 1], outputRange: [40, 0] }) }]
        }]}
        >
          <View style={styles.resultCard}>
            <Text style={styles.resultTitle}>Sprint Complete!</Text>
            <Text style={styles.resultScore}>{correctCount}/{items.length} correct</Text>
            <Text style={styles.resultSub}>{Math.round((correctCount / Math.max(1, items.length)) * 100)}% accuracy</Text>
            <View style={styles.resultButtons}>
              <TouchableOpacity style={[styles.resultButton, styles.resultPrimary]} onPress={handleRestart}>
                <Text style={styles.resultButtonText}>Play Again</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.resultButton, styles.resultGhost]} onPress={() => router.back()}>
                <Text style={[styles.resultButtonText, styles.resultGhostText]}>Done</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Animated.View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#1E1E1E' },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  content: { flex: 1, zIndex: 1 },
  emptyText: { color: '#9CA3AF' },
  header: { paddingHorizontal: 20, paddingTop: 16, paddingBottom: 8, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  title: { color: '#fff', fontSize: 18, fontWeight: '700' },
  headerMeta: { flexDirection: 'row', alignItems: 'center' },
  timerBadge: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(38,48,52,0.85)', paddingHorizontal: 10, paddingVertical: 6, borderRadius: 14, borderWidth: StyleSheet.hairlineWidth, borderColor: '#3f4a4f', marginRight: 8 },
  timerIcon: { color: '#f59f46', fontSize: 14, marginRight: 4 },
  timerText: { color: '#f4f6f8', fontSize: 13, fontWeight: '600' },
  counter: { color: '#9CA3AF', fontSize: 12, fontWeight: '600' },
  body: { flex: 1, width: '100%', justifyContent: 'center', alignItems: 'center', paddingHorizontal: 20 },
  progressBackdrop: { ...StyleSheet.absoluteFillObject, justifyContent: 'flex-end', alignItems: 'stretch', zIndex: 0, backgroundColor: 'rgba(226,135,67,0.06)' },
  progressColumn: { backgroundColor: 'rgba(226,135,67,0.32)', borderTopLeftRadius: 32, borderTopRightRadius: 32, borderWidth: StyleSheet.hairlineWidth, borderColor: 'rgba(255,255,255,0.12)', shadowColor: '#e28743', shadowOpacity: 0.25, shadowRadius: 24, shadowOffset: { width: 0, height: -6 } },
  card: { width: '100%', backgroundColor: 'rgba(44,47,47,0.88)', borderRadius: 16, padding: 24, borderWidth: StyleSheet.hairlineWidth, borderColor: '#3d474b', shadowColor: '#000', shadowOpacity: 0.35, shadowRadius: 16, shadowOffset: { width: 0, height: 12 }, elevation: 8 },
  definition: { color: '#e0e0e0', fontSize: 16, lineHeight: 22, textAlign: 'center' },
  option: { backgroundColor: 'rgba(62,70,74,0.88)', borderRadius: 12, paddingVertical: 14, paddingHorizontal: 12, marginTop: 12, borderWidth: StyleSheet.hairlineWidth, borderColor: '#4b555a' },
  optionText: { color: '#f4f6f8', fontSize: 16, fontWeight: '600', textAlign: 'center' },
  correct: { backgroundColor: 'rgba(46,201,141,0.28)', borderColor: '#2ec98d' },
  wrong: { backgroundColor: 'rgba(239,68,68,0.32)', borderColor: '#ef4444' },
  footer: { alignItems: 'center', paddingBottom: 20 },
  footerText: { color: '#9CA3AF', fontSize: 12 },
  resultOverlay: { ...StyleSheet.absoluteFillObject, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 24, backgroundColor: 'rgba(18,20,21,0.8)', zIndex: 5 },
  resultCard: { width: '100%', maxWidth: 320, backgroundColor: 'rgba(38,43,46,0.96)', borderRadius: 20, paddingVertical: 28, paddingHorizontal: 24, alignItems: 'center', borderWidth: StyleSheet.hairlineWidth, borderColor: '#434d51', shadowColor: '#000', shadowOpacity: 0.4, shadowRadius: 18, shadowOffset: { width: 0, height: 12 } },
  resultTitle: { color: '#f4f6f8', fontSize: 24, fontWeight: '800' },
  resultScore: { color: '#f59f46', fontSize: 20, fontWeight: '700', marginTop: 12 },
  resultSub: { color: '#9CA3AF', marginTop: 6 },
  resultButtons: { flexDirection: 'row', justifyContent: 'center', marginTop: 22 },
  resultButton: { paddingHorizontal: 22, paddingVertical: 12, borderRadius: 12, marginHorizontal: 6 },
  resultPrimary: { backgroundColor: '#f59f46' },
  resultGhost: { backgroundColor: 'rgba(44,47,47,0.7)', borderWidth: StyleSheet.hairlineWidth, borderColor: '#5b6469' },
  resultButtonText: { color: '#121415', fontWeight: '700' },
  resultGhostText: { color: '#f4f6f8' },
});

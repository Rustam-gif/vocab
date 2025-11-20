import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import { View, Text, StyleSheet, TouchableOpacity, Animated, Easing, Dimensions } from 'react-native';
import LottieView from 'lottie-react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useAppStore } from '../lib/store';
import { getTheme } from '../lib/theme';
import { analyticsService } from '../services/AnalyticsService';
import { ProgressService } from '../services/ProgressService';

const QUESTION_TIME_MS = 10000; // 10 seconds per question
const SCREEN_HEIGHT = Dimensions.get('window').height;

export default function WordSprint() {
  const router = useRouter();
  const { folderId, title } = useLocalSearchParams<{ folderId: string; title?: string }>();
  const { words, loadWords, loadProgress } = useAppStore();
  const themeName = useAppStore(s => s.theme);
  const colors = getTheme(themeName);
  const isLight = themeName === 'light';
  const [index, setIndex] = useState(0);
  const [correctCount, setCorrectCount] = useState(0);
  const [revealed, setRevealed] = useState(false);
  const [selected, setSelected] = useState<number | null>(null);
  const [finished, setFinished] = useState(false);
  const [timeLeft, setTimeLeft] = useState(QUESTION_TIME_MS / 1000);
  const [xpAwarded, setXpAwarded] = useState(false);
  const recordResult = useAppStore(s => s.recordExerciseResult);
  const barAnim = useRef(new Animated.Value(0)).current;
  const timerRef = useRef<Animated.CompositeAnimation | null>(null);
  const advanceTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const revealedRef = useRef(false);
  const resultAnim = useRef(new Animated.Value(0)).current;
  const clockAnimRef = useRef<LottieView>(null);
  // Penguin is static; no walk loop

  // Use a toned-down, app-themed palette for the Penguin Lottie
  const penguinSource = React.useMemo(() => {
    try {
      // Require returns parsed JSON in RN; clone before mutating
      const raw: any = require('../assets/lottie/Penguin.json');
      const clone = JSON.parse(JSON.stringify(raw));
      const toNorm = (hex: string) => {
        const h = hex.replace('#', '');
        const r = parseInt(h.slice(0, 2), 16) / 255;
        const g = parseInt(h.slice(2, 4), 16) / 255;
        const b = parseInt(h.slice(4, 6), 16) / 255;
        return [r, g, b] as [number, number, number];
      };
      const ACCENT = toNorm('#F8B070'); // warm orange
      const TEAL = toNorm('#187486');   // brand teal
      const LIGHT = toNorm('#E5E7EB');  // off-white
      const DARK = toNorm('#2A3033');   // dark slate

      const clamp01 = (v: number) => Math.max(0, Math.min(1, v));
      const setColor = (node: any, rgb: [number, number, number], a: number) => {
        node.c.k = [clamp01(rgb[0]), clamp01(rgb[1]), clamp01(rgb[2]), clamp01(a)];
      };
      const classify = (rgb: [number, number, number]) => {
        const [r, g, b] = rgb;
        const max = Math.max(r, g, b);
        const min = Math.min(r, g, b);
        const sat = max - min;
        const lum = 0.2126 * r + 0.7152 * g + 0.0722 * b;
        // Warm/orange-ish
        if (r > g && r > b && r - b > 0.12) return 'accent';
        // Cool/blue-green-ish
        if (b > r + 0.08 || g > r + 0.08) return 'teal';
        // Near white/gray
        if (lum > 0.85 || (lum > 0.7 && sat < 0.08)) return 'light';
        return 'dark';
      };
      // Remove any background/base layers that cause blue bands
      if (Array.isArray(clone.layers)) {
        clone.layers = clone.layers.filter((ly: any) => {
          const name = (ly?.nm || '').toString().toLowerCase();
          // Drop generic background layers often named "Layer 1", "bg", "background"
          if (name === 'layer 1' || name === 'bg' || name === 'background') return false;
          return true;
        });
      }

      const visit = (n: any) => {
        if (!n || typeof n !== 'object') return;
        // Vector Fill
        if (n.ty === 'fl' && n.c && Array.isArray(n.c.k) && n.c.k.length >= 3) {
          const k = n.c.k;
          const rgb: [number, number, number] = [k[0], k[1], k[2]];
          const a = k[3] ?? 1;
          const type = classify(rgb);
          // Remove deep blue strip-like fills (very blue, low red/green)
          if (rgb[2] > 0.5 && rgb[0] < 0.2 && rgb[1] < 0.2 && a > 0.7) {
            n.o = { a: 0, k: 0 } as any; // force transparent
            return;
          }
          if (type === 'accent') setColor(n, ACCENT, a * 0.95);
          else if (type === 'teal') setColor(n, TEAL, a * 0.95);
          else if (type === 'light') setColor(n, LIGHT, a * 0.95);
          else setColor(n, DARK, a);
        }
        // Gradient fill support (optional): reduce saturation by biasing to TEAL/LIGHT
        if ((n.ty === 'gf' || n.ty === 'gs') && n.g && n.g.k && Array.isArray(n.g.k.k)) {
          // Gradient array format: [pos,r,g,b,pos,r,g,b,...]
          const arr = n.g.k.k;
          for (let i = 0; i < arr.length; i += 4) {
            const r = arr[i + 1], g = arr[i + 2], b = arr[i + 3];
            const type = classify([r, g, b]);
            const tint = type === 'accent' ? ACCENT : type === 'teal' ? TEAL : type === 'light' ? LIGHT : DARK;
            arr[i + 1] = tint[0];
            arr[i + 2] = tint[1];
            arr[i + 3] = tint[2];
          }
        }
        Object.keys(n).forEach(k => {
          const v = (n as any)[k];
          if (Array.isArray(v)) v.forEach(visit);
          else if (v && typeof v === 'object') visit(v);
        });
      };
      visit(clone);
      return clone;
    } catch {
      // Fallback to original asset if anything goes wrong
      return require('../assets/lottie/Penguin.json');
    }
  }, []);

  useEffect(() => {
    (async () => { await loadWords(); })();
  }, [loadWords]);

  // Removed walk loop (keep penguin static)

  useEffect(() => {
    revealedRef.current = revealed;
  }, [revealed]);

  useEffect(() => {
    const id = barAnim.addListener(({ value }) => {
      const remaining = Math.max(0, QUESTION_TIME_MS * (1 - value));
      const secondsLeft = remaining / 1000;
      setTimeLeft(parseFloat(secondsLeft.toFixed(1)));
      // Keep animation fixed to bopping (no switching)
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

  const items = useMemo(() => {
    const pool = words.filter(w => w.folderId === folderId);
    if (pool.length <= 15) return pool;
    // Sample 15 unique words deterministically per render
    const shuffled = [...pool].sort(() => Math.random() - 0.5);
    return shuffled.slice(0, 15);
  }, [words, folderId]);

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

  const handleReveal = useCallback(async (pickedIndex: number | null) => {
    if (revealedRef.current || finished) return;
    revealedRef.current = true;
    finishTimer();
    setRevealed(true);
    const picked = typeof pickedIndex === 'number' ? options[pickedIndex] : null;
    const isCorrect = picked === currentWord;
    if (isCorrect) setCorrectCount(c => c + 1);
    try {
      await recordResult({
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
  }, [finishTimer, options, currentWord, currentId, index, items.length, finished, recordResult]);

  const startTimer = useCallback(() => {
    if (!items.length || finished) return;
    if (timerRef.current) {
      timerRef.current.stop();
      timerRef.current = null;
    }
    barAnim.stopAnimation();
    barAnim.setValue(0);
    setTimeLeft(QUESTION_TIME_MS / 1000);
    // Restart clock animation from beginning
    clockAnimRef.current?.reset();
    clockAnimRef.current?.play();
    
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
    <SafeAreaView style={[styles.container, isLight && { backgroundColor: colors.background }]}>
      {/* Snow overlay for a snowy environment */}
      <Snowfall flakes={36} />
      <View pointerEvents="none" style={styles.progressBackdrop}>
        <Animated.View style={[styles.progressColumn, { height: progressHeight, opacity: progressOpacity }]} />
      </View>
      <View style={styles.content}>
        <View style={[styles.header, isLight && { borderBottomColor: '#E5E7EB' }]}>
          <View style={styles.headerLeft}>
            <TouchableOpacity accessibilityRole="button" onPress={() => router.back()} style={[styles.closeBtn, isLight && { backgroundColor: '#E5E7EB', borderColor: '#E5E7EB' }]}>
              <Text style={[styles.closeBtnText, isLight && { color: '#111827' }]}>✕</Text>
            </TouchableOpacity>
            <Text style={[styles.title, isLight && { color: '#111827' }]}>{title || 'Word Sprint'}</Text>
          </View>
          <View style={styles.headerMeta}>
            <View style={[styles.timerBadge, isLight && { backgroundColor: '#E5E7EB', borderColor: '#E5E7EB' }]}>
              <Text style={[styles.timerIcon, isLight && { color: '#F8B070' }]}>⌚</Text>
              <Text style={[styles.timerText, isLight && { color: '#111827' }]}>{timeLeft.toFixed(1)}s</Text>
            </View>
            <Text style={[styles.counter, isLight && { color: '#6B7280' }]}>{index + 1}/{items.length}</Text>
          </View>
        </View>
        <View style={styles.body}>
          <View style={[styles.card, isLight && styles.cardLight]}>
            <Text style={[styles.definition, isLight && { color: '#111827' }]}>{current.definition}</Text>
            <View style={{ height: 16 }} />
            {options.map((opt, i) => {
              const isPicked = selected === i;
              const isAnswer = revealed && opt === current.word;
              const wrong = revealed && isPicked && !isAnswer;
              return (
                <TouchableOpacity key={`${opt}-${i}`} style={[styles.option, isLight && styles.optionLight, isAnswer && styles.correct, wrong && styles.wrong]} onPress={() => handlePick(i)} disabled={revealed}>
                  <Text style={[styles.optionText, isLight && { color: '#111827' }]}>{opt}</Text>
                </TouchableOpacity>
              );
            })}
          </View>
          {/* Timer animation below the card */}
          <View style={styles.mascotWrap}>
            <View style={styles.riveCrop}>
              <View style={{ alignItems: 'center' }}>
                <LottieView
                  ref={clockAnimRef}
                  source={penguinSource as any}
                  autoPlay={false}
                  loop={false}
                  style={styles.riveInner}
                />
              </View>
            </View>
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

// Lightweight, self‑contained snowfall overlay without external assets
const Snowfall: React.FC<{ flakes?: number }> = ({ flakes = 24 }) => {
  const width = Dimensions.get('window').width;
  const height = Dimensions.get('window').height;

  const flakeViews = Array.from({ length: flakes }).map((_, i) => {
    const size = Math.random() * 3 + 2; // 2–5 px
    const left = Math.random() * width;
    const duration = 8000 + Math.random() * 6000; // 8–14s
    const delay = Math.random() * 4000; // up to 4s
    const drift = (Math.random() - 0.5) * 40; // -20..20 px horizontal drift

    const y = new Animated.Value(-20);
    const x = new Animated.Value(0);

    React.useEffect(() => {
      const fall = Animated.loop(
        Animated.sequence([
          Animated.delay(delay),
          Animated.timing(y, { toValue: height + 40, duration, easing: Easing.linear, useNativeDriver: true }),
          Animated.timing(y, { toValue: -20, duration: 0, useNativeDriver: true }),
        ])
      );
      const sway = Animated.loop(
        Animated.sequence([
          Animated.timing(x, { toValue: drift, duration: duration / 2, easing: Easing.inOut(Easing.quad), useNativeDriver: true }),
          Animated.timing(x, { toValue: 0, duration: duration / 2, easing: Easing.inOut(Easing.quad), useNativeDriver: true }),
        ])
      );
      fall.start();
      sway.start();
      return () => {
        fall.stop();
        sway.stop();
      };
    }, []);

    return (
      <Animated.View
        key={`flake-${i}`}
        pointerEvents="none"
        style={{
          position: 'absolute',
          width: size,
          height: size,
          borderRadius: size / 2,
          backgroundColor: 'rgba(255,255,255,0.85)',
          opacity: 0.95,
          transform: [
            { translateX: x },
            { translateY: y },
          ],
          left,
          top: -20,
        }}
      />
    );
  });

  return <View pointerEvents="none" style={StyleSheet.absoluteFill}>{flakeViews}</View>;
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0F172A' },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  content: { flex: 1, zIndex: 1 },
  emptyText: { color: '#9CA3AF' },
  header: { paddingHorizontal: 20, paddingTop: 16, paddingBottom: 8, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  headerLeft: { flexDirection: 'row', alignItems: 'center' },
  title: { color: '#fff', fontSize: 18, fontWeight: '700' },
  closeBtn: { marginRight: 10, width: 28, height: 28, borderRadius: 14, backgroundColor: 'rgba(62,70,74,0.88)', alignItems: 'center', justifyContent: 'center', borderWidth: StyleSheet.hairlineWidth, borderColor: '#4b555a' },
  closeBtnText: { color: '#f4f6f8', fontSize: 14, fontWeight: '800' },
  headerMeta: { flexDirection: 'row', alignItems: 'center' },
  timerBadge: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(38,48,52,0.85)', paddingHorizontal: 10, paddingVertical: 6, borderRadius: 14, borderWidth: StyleSheet.hairlineWidth, borderColor: '#3f4a4f', marginRight: 8 },
  timerIcon: { color: '#F8B070', fontSize: 14, marginRight: 4 },
  timerText: { color: '#f4f6f8', fontSize: 13, fontWeight: '600' },
  counter: { color: '#9CA3AF', fontSize: 12, fontWeight: '600' },
  body: { flex: 1, width: '100%', justifyContent: 'center', alignItems: 'center', paddingHorizontal: 20 },
  mascotWrap: { marginTop: 28, alignItems: 'center', justifyContent: 'center' },
  // Crop box: keep centered, allow a bit more vertical room
  riveCrop: { width: 180, height: 170, overflow: 'hidden', alignItems: 'center', justifyContent: 'center' },
  // Smaller penguin, nudged down, with 20% transparency
  riveInner: { width: 180, height: 180, opacity: 0.8, transform: [{ translateY: 10 }, { translateX: 0 }, { scale: 0.8 }] },
  progressBackdrop: { ...StyleSheet.absoluteFillObject, justifyContent: 'flex-end', alignItems: 'stretch', zIndex: 0, backgroundColor: 'rgba(99,179,237,0.08)' },
  progressColumn: { backgroundColor: 'rgba(99,179,237,0.28)', borderTopLeftRadius: 32, borderTopRightRadius: 32, borderWidth: StyleSheet.hairlineWidth, borderColor: 'rgba(255,255,255,0.12)', shadowColor: '#60A5FA', shadowOpacity: 0.25, shadowRadius: 24, shadowOffset: { width: 0, height: -6 } },
  card: { width: '100%', backgroundColor: 'rgba(30,41,59,0.92)', borderRadius: 16, padding: 24, borderWidth: StyleSheet.hairlineWidth, borderColor: '#324357', shadowColor: '#000', shadowOpacity: 0.35, shadowRadius: 16, shadowOffset: { width: 0, height: 12 }, elevation: 8 },
  cardLight: { backgroundColor: '#FFFFFF', borderColor: '#FFFFFF' },
  definition: { color: '#e0e0e0', fontSize: 16, lineHeight: 22, textAlign: 'center' },
  option: { backgroundColor: 'rgba(62,70,74,0.88)', borderRadius: 12, paddingVertical: 14, paddingHorizontal: 12, marginTop: 12, borderWidth: StyleSheet.hairlineWidth, borderColor: '#4b555a' },
  optionLight: { backgroundColor: '#FFFFFF', borderColor: '#E5E7EB' },
  optionText: { color: '#f4f6f8', fontSize: 16, fontWeight: '600', textAlign: 'center' },
  // Revert to original success/error colors
  correct: { backgroundColor: '#437F76', borderColor: '#437F76' },
  wrong: { backgroundColor: '#924646', borderColor: '#924646' },
  footer: { alignItems: 'center', paddingBottom: 20 },
  footerText: { color: '#9CA3AF', fontSize: 12 },
  resultOverlay: { ...StyleSheet.absoluteFillObject, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 24, backgroundColor: 'rgba(18,20,21,0.8)', zIndex: 5 },
  resultCard: { width: '100%', maxWidth: 320, backgroundColor: 'rgba(38,43,46,0.96)', borderRadius: 20, paddingVertical: 28, paddingHorizontal: 24, alignItems: 'center', borderWidth: StyleSheet.hairlineWidth, borderColor: '#434d51', shadowColor: '#000', shadowOpacity: 0.4, shadowRadius: 18, shadowOffset: { width: 0, height: 12 } },
  resultTitle: { color: '#f4f6f8', fontSize: 24, fontWeight: '800' },
  resultScore: { color: '#F8B070', fontSize: 20, fontWeight: '700', marginTop: 12 },
  resultSub: { color: '#9CA3AF', marginTop: 6 },
  resultButtons: { flexDirection: 'row', justifyContent: 'center', marginTop: 22 },
  resultButton: { paddingHorizontal: 22, paddingVertical: 12, borderRadius: 12, marginHorizontal: 6 },
  resultPrimary: { backgroundColor: '#F8B070' },
  resultGhost: { backgroundColor: 'rgba(44,47,47,0.7)', borderWidth: StyleSheet.hairlineWidth, borderColor: '#5b6469' },
  resultButtonText: { color: '#121415', fontWeight: '700' },
  resultGhostText: { color: '#f4f6f8' },
});

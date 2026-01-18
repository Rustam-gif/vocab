import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import { View, Text, StyleSheet, TouchableOpacity, Animated, Easing } from 'react-native';
import LottieView from 'lottie-react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useAppStore } from '../lib/store';
import { getTheme } from '../lib/theme';
import { analyticsService } from '../services/AnalyticsService';
import { ProgressService } from '../services/ProgressService';

const QUESTION_TIME_MS = 10000; // 10 seconds per question

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
      <SafeAreaView style={[styles.container, isLight && styles.containerLight]}>
        <View style={styles.center}>
          <Text style={styles.emptyText}>No words in this folder.</Text>
        </View>
      </SafeAreaView>
    );
  }

  // Timer bar width animation
  const timerBarWidth = barAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['100%', '0%'],
  });

  return (
    <SafeAreaView style={[styles.container, isLight && styles.containerLight]}>
      <View style={styles.content}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity
            accessibilityRole="button"
            onPress={() => router.back()}
            style={[styles.closeBtn, isLight && styles.closeBtnLight]}
          >
            <Text style={[styles.closeBtnText, isLight && styles.closeBtnTextLight]}>✕</Text>
          </TouchableOpacity>
          <Text style={[styles.title, isLight && styles.titleLight]} numberOfLines={1}>
            {title || 'Word Sprint'}
          </Text>
          <Text style={[styles.counter, isLight && styles.counterLight]}>{index + 1}/{items.length}</Text>
        </View>

        {/* Timer bar */}
        <View style={[styles.timerBarContainer, isLight && styles.timerBarContainerLight]}>
          <Animated.View style={[styles.timerBarFill, { width: timerBarWidth }]} />
        </View>

        {/* Time display */}
        <View style={styles.timerDisplay}>
          <Text style={[styles.timerText, isLight && styles.timerTextLight]}>{timeLeft.toFixed(1)}s</Text>
        </View>

        {/* Main content */}
        <View style={styles.body}>
          {/* Definition card */}
          <View style={[styles.definitionCard, isLight && styles.definitionCardLight]}>
            <Text style={[styles.definition, isLight && styles.definitionLight]}>{current.definition}</Text>
          </View>

          {/* Options */}
          <View style={styles.optionsContainer}>
            {options.map((opt, i) => {
              const isPicked = selected === i;
              const isAnswer = revealed && opt === current.word;
              const wrong = revealed && isPicked && !isAnswer;
              return (
                <TouchableOpacity
                  key={`${opt}-${i}`}
                  style={[
                    styles.option,
                    isLight && styles.optionLight,
                    isAnswer && styles.optionCorrect,
                    wrong && styles.optionWrong,
                  ]}
                  onPress={() => handlePick(i)}
                  disabled={revealed}
                  activeOpacity={0.8}
                >
                  <Text style={[
                    styles.optionText,
                    isLight && styles.optionTextLight,
                    (isAnswer || wrong) && styles.optionTextRevealed,
                  ]}>
                    {opt}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>

          {/* Mascot */}
          <View style={styles.mascotWrap}>
            <LottieView
              ref={clockAnimRef}
              source={penguinSource as any}
              autoPlay={false}
              loop={false}
              style={styles.mascot}
            />
          </View>
        </View>

        {/* Footer */}
        <View style={styles.footer}>
          <View style={[styles.scoreCard, isLight && styles.scoreCardLight]}>
            <Text style={[styles.scoreLabel, isLight && styles.scoreLabelLight]}>Score</Text>
            <Text style={[styles.scoreValue, isLight && styles.scoreValueLight]}>{correctCount}</Text>
          </View>
        </View>
      </View>

      {/* Results overlay */}
      {finished && (
        <Animated.View
          style={[
            styles.resultOverlay,
            {
              opacity: resultAnim,
              transform: [{ translateY: resultAnim.interpolate({ inputRange: [0, 1], outputRange: [40, 0] }) }],
            },
          ]}
        >
          <View style={[styles.resultCard, isLight && styles.resultCardLight]}>
            <Text style={[styles.resultTitle, isLight && styles.resultTitleLight]}>Sprint Complete!</Text>
            <Text style={styles.resultScore}>{correctCount}/{items.length}</Text>
            <Text style={[styles.resultAccuracy, isLight && styles.resultAccuracyLight]}>
              {Math.round((correctCount / Math.max(1, items.length)) * 100)}% accuracy
            </Text>
            <View style={styles.resultButtons}>
              <TouchableOpacity style={styles.resultButtonPrimary} onPress={handleRestart} activeOpacity={0.8}>
                <Text style={styles.resultButtonPrimaryText}>Play Again</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.resultButtonSecondary, isLight && styles.resultButtonSecondaryLight]}
                onPress={() => router.back()}
                activeOpacity={0.8}
              >
                <Text style={[styles.resultButtonSecondaryText, isLight && styles.resultButtonSecondaryTextLight]}>Done</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Animated.View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  // Container
  container: {
    flex: 1,
    backgroundColor: '#1E1E1E',
  },
  containerLight: {
    backgroundColor: '#F8F8F8',
  },
  content: {
    flex: 1,
  },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyText: {
    color: '#9CA3AF',
    fontFamily: 'Ubuntu-Medium',
    fontSize: 16,
  },

  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 12,
  },
  closeBtn: {
    width: 36,
    height: 36,
    borderRadius: 12,
    backgroundColor: '#2A2D2E',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 3,
    borderColor: '#1A1A1A',
    shadowColor: '#000',
    shadowOpacity: 0.3,
    shadowRadius: 0,
    shadowOffset: { width: 1, height: 2 },
    elevation: 3,
  },
  closeBtnLight: {
    backgroundColor: '#FFFFFF',
    borderColor: '#E5E7EB',
    shadowOpacity: 0.1,
  },
  closeBtnText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
  closeBtnTextLight: {
    color: '#374151',
  },
  title: {
    flex: 1,
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '700',
    fontFamily: 'Feather-Bold',
    textAlign: 'center',
    marginHorizontal: 12,
  },
  titleLight: {
    color: '#1A1A1A',
  },
  counter: {
    color: '#F8B070',
    fontSize: 16,
    fontWeight: '700',
    fontFamily: 'Ubuntu-Bold',
  },
  counterLight: {
    color: '#F8B070',
  },

  // Timer bar
  timerBarContainer: {
    height: 8,
    backgroundColor: 'rgba(255,255,255,0.1)',
    marginHorizontal: 20,
    borderRadius: 4,
    overflow: 'hidden',
  },
  timerBarContainerLight: {
    backgroundColor: 'rgba(0,0,0,0.1)',
  },
  timerBarFill: {
    height: '100%',
    backgroundColor: '#F8B070',
    borderRadius: 4,
  },
  timerDisplay: {
    alignItems: 'center',
    marginTop: 8,
  },
  timerText: {
    color: '#F8B070',
    fontSize: 24,
    fontWeight: '700',
    fontFamily: 'Feather-Bold',
  },
  timerTextLight: {
    color: '#F8B070',
  },

  // Body
  body: {
    flex: 1,
    paddingHorizontal: 20,
    justifyContent: 'center',
  },

  // Definition card
  definitionCard: {
    backgroundColor: '#F8B070',
    borderRadius: 16,
    padding: 24,
    marginBottom: 20,
    borderWidth: 3,
    borderColor: '#1A1A1A',
    shadowColor: '#000',
    shadowOpacity: 0.4,
    shadowRadius: 0,
    shadowOffset: { width: 2, height: 3 },
    elevation: 5,
  },
  definitionCardLight: {
    backgroundColor: '#F8B070',
    borderColor: '#C88F50',
  },
  definition: {
    color: '#1A1A1A',
    fontSize: 18,
    fontWeight: '600',
    lineHeight: 26,
    textAlign: 'center',
    fontFamily: 'Ubuntu-Medium',
  },
  definitionLight: {
    color: '#1A1A1A',
  },

  // Options
  optionsContainer: {
    gap: 12,
  },
  option: {
    backgroundColor: '#2A2D2E',
    borderRadius: 14,
    paddingVertical: 16,
    paddingHorizontal: 16,
    borderWidth: 3,
    borderColor: '#1A1A1A',
    shadowColor: '#000',
    shadowOpacity: 0.4,
    shadowRadius: 0,
    shadowOffset: { width: 2, height: 3 },
    elevation: 4,
  },
  optionLight: {
    backgroundColor: '#FFFFFF',
    borderColor: '#E5E7EB',
    shadowOpacity: 0.15,
  },
  optionCorrect: {
    backgroundColor: '#437F76',
    borderColor: '#2D5A53',
  },
  optionWrong: {
    backgroundColor: '#C75050',
    borderColor: '#8B3A3A',
  },
  optionText: {
    color: '#FFFFFF',
    fontSize: 17,
    fontWeight: '600',
    textAlign: 'center',
    fontFamily: 'Feather-Bold',
  },
  optionTextLight: {
    color: '#1A1A1A',
  },
  optionTextRevealed: {
    color: '#FFFFFF',
  },

  // Mascot
  mascotWrap: {
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 20,
  },
  mascot: {
    width: 120,
    height: 120,
    opacity: 0.7,
  },

  // Footer
  footer: {
    alignItems: 'center',
    paddingBottom: 20,
    paddingHorizontal: 20,
  },
  scoreCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#2A2D2E',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 3,
    borderColor: '#1A1A1A',
    shadowColor: '#000',
    shadowOpacity: 0.3,
    shadowRadius: 0,
    shadowOffset: { width: 1, height: 2 },
    elevation: 3,
  },
  scoreCardLight: {
    backgroundColor: '#FFFFFF',
    borderColor: '#E5E7EB',
    shadowOpacity: 0.1,
  },
  scoreLabel: {
    color: '#9CA3AF',
    fontSize: 14,
    fontWeight: '500',
    fontFamily: 'Ubuntu-Medium',
  },
  scoreLabelLight: {
    color: '#6B7280',
  },
  scoreValue: {
    color: '#F8B070',
    fontSize: 18,
    fontWeight: '700',
    fontFamily: 'Feather-Bold',
  },
  scoreValueLight: {
    color: '#F8B070',
  },

  // Result overlay
  resultOverlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
    backgroundColor: 'rgba(30, 30, 30, 0.95)',
    zIndex: 10,
  },
  resultCard: {
    width: '100%',
    maxWidth: 320,
    backgroundColor: '#2A2D2E',
    borderRadius: 20,
    paddingVertical: 32,
    paddingHorizontal: 24,
    alignItems: 'center',
    borderWidth: 3,
    borderColor: '#1A1A1A',
    shadowColor: '#000',
    shadowOpacity: 0.4,
    shadowRadius: 0,
    shadowOffset: { width: 2, height: 4 },
    elevation: 8,
  },
  resultCardLight: {
    backgroundColor: '#FFFFFF',
    borderColor: '#E5E7EB',
    shadowOpacity: 0.15,
  },
  resultTitle: {
    color: '#FFFFFF',
    fontSize: 26,
    fontWeight: '800',
    fontFamily: 'Feather-Bold',
    marginBottom: 8,
  },
  resultTitleLight: {
    color: '#1A1A1A',
  },
  resultScore: {
    color: '#F8B070',
    fontSize: 48,
    fontWeight: '700',
    fontFamily: 'Feather-Bold',
    marginVertical: 8,
  },
  resultAccuracy: {
    color: '#9CA3AF',
    fontSize: 16,
    fontFamily: 'Ubuntu-Medium',
    marginBottom: 24,
  },
  resultAccuracyLight: {
    color: '#6B7280',
  },
  resultButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  resultButtonPrimary: {
    backgroundColor: '#F25E86',
    paddingHorizontal: 24,
    paddingVertical: 14,
    borderRadius: 14,
    borderWidth: 3,
    borderColor: '#1A1A1A',
    shadowColor: '#000',
    shadowOpacity: 0.4,
    shadowRadius: 0,
    shadowOffset: { width: 2, height: 3 },
    elevation: 4,
  },
  resultButtonPrimaryText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
    fontFamily: 'Ubuntu-Bold',
  },
  resultButtonSecondary: {
    backgroundColor: '#3A3D3E',
    paddingHorizontal: 24,
    paddingVertical: 14,
    borderRadius: 14,
    borderWidth: 3,
    borderColor: '#1A1A1A',
    shadowColor: '#000',
    shadowOpacity: 0.3,
    shadowRadius: 0,
    shadowOffset: { width: 2, height: 3 },
    elevation: 4,
  },
  resultButtonSecondaryLight: {
    backgroundColor: '#F3F4F6',
    borderColor: '#E5E7EB',
  },
  resultButtonSecondaryText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
    fontFamily: 'Ubuntu-Bold',
  },
  resultButtonSecondaryTextLight: {
    color: '#374151',
  },
});

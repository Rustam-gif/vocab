import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import { View, Text, StyleSheet, TouchableOpacity, Animated, Easing, Dimensions } from 'react-native';
import LottieView from 'lottie-react-native';
import { Platform } from 'react-native';
import { Asset } from 'expo-asset';
let Rive: any = null;
try {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  Rive = require('rive-react-native').default || require('rive-react-native');
} catch {}
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useAppStore } from '../lib/store';
import { analyticsService } from '../services/AnalyticsService';
import { ProgressService } from '../services/ProgressService';

// Simple error boundary to catch Rive rendering errors and fall back gracefully
class RiveErrorBoundary extends React.Component<{ onError: () => void; children: React.ReactNode }, { hasError: boolean }> {
  constructor(props: any) {
    super(props);
    this.state = { hasError: false };
  }
  static getDerivedStateFromError() {
    return { hasError: true };
  }
  componentDidCatch() {
    try { this.props.onError(); } catch {}
  }
  render() {
    if (this.state.hasError) return null;
    return this.props.children as any;
  }
}

const QUESTION_TIME_MS = 10000; // 10 seconds per question
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
  const clockAnimRef = useRef<LottieView>(null);
  // Use Rive when the native module is available and we're not on web (Expo Go doesn't include Rive)
  const canUseRive = !!Rive && Platform.OS !== 'web';
  const riveModule = canUseRive ? require('../assets/rive/lil_guy.riv') : null;
  const [riveUrl, setRiveUrl] = useState<string | null>(null);
  // Keep Rive stable; if anything fails we fall back to Lottie
  const [riveFailed, setRiveFailed] = useState(false);
  // Animation names inside your .riv
  const RIVE_ANIM_IDLE = 'breathing';
  const RIVE_ANIM_BOP = 'bopping';
  const RIVE_ANIM_DANCE = 'Dance 2';
  // Always use the bopping animation as requested
  const [riveAnimName, setRiveAnimName] = useState<string>(RIVE_ANIM_BOP);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        if (canUseRive && riveModule) {
          const asset = Asset.fromModule(riveModule);
          if (!asset.localUri && !asset.downloaded) {
            await asset.downloadAsync();
          }
          if (mounted) setRiveUrl(asset.localUri || asset.uri || null);
        } else if (mounted) {
          setRiveUrl(null);
        }
      } catch {
        if (mounted) setRiveUrl(null);
      }
    })();
    return () => { mounted = false; };
  }, [canUseRive, riveModule]);

  useEffect(() => {
    (async () => { await loadWords(); })();
  }, [loadWords]);

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
  }, [barAnim, riveAnimName]);

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
    setRiveAnimName(RIVE_ANIM_BOP);
    
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
    <SafeAreaView style={styles.container}>
      <View pointerEvents="none" style={styles.progressBackdrop}>
        <Animated.View style={[styles.progressColumn, { height: progressHeight, opacity: progressOpacity }]} />
      </View>
      <View style={styles.content}>
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <TouchableOpacity accessibilityRole="button" onPress={() => router.back()} style={styles.closeBtn}>
              <Text style={styles.closeBtnText}>✕</Text>
            </TouchableOpacity>
            <Text style={styles.title}>{title || 'Word Sprint'}</Text>
          </View>
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
          {/* Timer animation below the card */}
          <View style={styles.mascotWrap}>
            <View style={styles.riveCrop}>
              {canUseRive && riveUrl && !riveFailed ? (
                // Rive mascot (replace 10s timer)
                // Keep a stable key so the component doesn't remount when animationName changes.
                <RiveErrorBoundary onError={() => setRiveFailed(true)}>
                  <Rive
                    key={riveUrl}
                    style={styles.riveInner}
                    url={riveUrl}
                    autoplay
                    // Play base motion + Blink + look up (Eyes Y)
                    animations={[riveAnimName, 'Blink', 'Eyes Y']}
                  />
                </RiveErrorBoundary>
              ) : (
                // Fallback to Lottie in Expo Go or if Rive fails
                <LottieView
                  ref={clockAnimRef}
                  source={require('../assets/lottie/10_Second_Timer.json')}
                  autoPlay={false}
                  loop={false}
                  style={styles.riveInner}
                />
              )}
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

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#1E1E1E' },
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
  timerIcon: { color: '#f59f46', fontSize: 14, marginRight: 4 },
  timerText: { color: '#f4f6f8', fontSize: 13, fontWeight: '600' },
  counter: { color: '#9CA3AF', fontSize: 12, fontWeight: '600' },
  body: { flex: 1, width: '100%', justifyContent: 'center', alignItems: 'center', paddingHorizontal: 20 },
  mascotWrap: { marginTop: 18, alignItems: 'center', justifyContent: 'center' },
  // Crop box hides the top buttons and right white line in the Rive artboard
  riveCrop: { width: 180, height: 150, overflow: 'hidden', alignItems: 'center', justifyContent: 'center' },
  // Render larger and shift slightly down, keeping top buttons clipped
  riveInner: { width: 230, height: 230, transform: [{ translateY: -18 }, { translateX: 0 }, { scale: 1.04 }] },
  progressBackdrop: { ...StyleSheet.absoluteFillObject, justifyContent: 'flex-end', alignItems: 'stretch', zIndex: 0, backgroundColor: 'rgba(226,135,67,0.06)' },
  progressColumn: { backgroundColor: 'rgba(226,135,67,0.32)', borderTopLeftRadius: 32, borderTopRightRadius: 32, borderWidth: StyleSheet.hairlineWidth, borderColor: 'rgba(255,255,255,0.12)', shadowColor: '#e28743', shadowOpacity: 0.25, shadowRadius: 24, shadowOffset: { width: 0, height: -6 } },
  card: { width: '100%', backgroundColor: 'rgba(44,47,47,0.88)', borderRadius: 16, padding: 24, borderWidth: StyleSheet.hairlineWidth, borderColor: '#3d474b', shadowColor: '#000', shadowOpacity: 0.35, shadowRadius: 16, shadowOffset: { width: 0, height: 12 }, elevation: 8 },
  definition: { color: '#e0e0e0', fontSize: 16, lineHeight: 22, textAlign: 'center' },
  option: { backgroundColor: 'rgba(62,70,74,0.88)', borderRadius: 12, paddingVertical: 14, paddingHorizontal: 12, marginTop: 12, borderWidth: StyleSheet.hairlineWidth, borderColor: '#4b555a' },
  optionText: { color: '#f4f6f8', fontSize: 16, fontWeight: '600', textAlign: 'center' },
  correct: { backgroundColor: '#437F76', borderColor: '#437F76' },
  wrong: { backgroundColor: '#924646', borderColor: '#924646' },
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

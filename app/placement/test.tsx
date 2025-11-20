import React, { useMemo, useRef, useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, SafeAreaView, Animated, Easing } from 'react-native';
import { useRouter } from 'expo-router';
import { X } from 'lucide-react-native';
import { buildBank, pickNextItem, startSession, updateAbility, recommendedLevelFromAbility, PlacementItem, Band } from '../../services/PlacementService';
import { analyticsService } from '../../services/AnalyticsService';
import AnimatedNextButton from '../quiz/components/AnimatedNextButton';
import { LinearGradient } from '../../lib/LinearGradient';
import { useAppStore } from '../../lib/store';

const TOTAL = 30;

export default function PlacementTest() {
  const router = useRouter();
  const themeName = useAppStore(s => s.theme);
  const isLight = themeName === 'light';
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
  // Card pop animation
  const cardScale = useRef(new Animated.Value(0.94)).current;
  const cardOpacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(progressAnim, {
      toValue: index / TOTAL,
      duration: 420,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: false,
    }).start();
    // Pop the card when the index changes
    cardScale.setValue(0.94);
    cardOpacity.setValue(0);
    Animated.parallel([
      Animated.timing(cardScale, { toValue: 1, duration: 380, easing: Easing.out(Easing.back(1.2)), useNativeDriver: true }),
      Animated.timing(cardOpacity, { toValue: 1, duration: 240, easing: Easing.out(Easing.cubic), useNativeDriver: true }),
    ]).start();
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

  const band = targetBandForIndex(index);
  const bandAccent = (bandColors(band).text as any).color || '#187486';

  return (
    <SafeAreaView style={[styles.container, isLight && styles.containerLight]}>
      {/* Soft vertical gradient background */}
      <LinearGradient
        colors={isLight ? ['#FAFAFA', '#F8F8F8'] : ['#121415', '#151719']}
        start={{ x: 0, y: 0 }}
        end={{ x: 0, y: 1 }}
        style={StyleSheet.absoluteFillObject as any}
        pointerEvents="none"
      />
      <View style={styles.header}>
        <View style={styles.headerRow}>
          <Text style={[styles.headerTitle, isLight && styles.headerTitleLight]}>Placement Test</Text>
          <View style={styles.headerRight}>
            <View style={[styles.counterPill, isLight && styles.counterPillLight]}><Text style={[styles.counterText, isLight && styles.counterTextLight]}>{index + 1}/{TOTAL}</Text></View>
            {/* Exit button */}
            <TouchableOpacity
              accessibilityLabel="Exit placement"
              onPress={() => router.replace('/quiz/level-select')}
              style={{ padding: 6, marginLeft: 4 }}
              activeOpacity={0.8}
            >
              <X size={18} color={isLight ? '#374151' : '#E5E7EB'} />
            </TouchableOpacity>
          </View>
        </View>
        <View style={[styles.progressBar, isLight && styles.progressBarLight]}>
          <Animated.View style={[styles.progressFill, { backgroundColor: bandAccent, width: progressAnim.interpolate({ inputRange: [0,1], outputRange: ['0%', '100%'] }) }]} />
        </View>
      </View>
      <Animated.View
        style={{
          transform: [{ scale: cardScale }],
          opacity: cardOpacity,
        }}
      >
        <View style={[styles.questionCard, isLight && styles.questionCardLight, { borderTopWidth: 4, borderTopColor: bandAccent, position: 'relative', overflow: 'hidden' }]}>
        <BubbleFX accent={bandAccent} light={isLight} />
        <Text style={[styles.word, isLight && styles.wordLight]}>{current.word}</Text>
        <Text style={[styles.prompt, isLight && styles.promptLight]}>{current.prompt}</Text>
        {current.meta?.example ? (
          <Text style={[styles.example, isLight && styles.exampleLight]}>Example: {current.meta.example}</Text>
        ) : null}
        <View style={styles.options}>
          {allOptions.map((opt, i) => (
            <TouchableOpacity
              key={`${current.id}-${i}`}
              style={[
                styles.option,
                isLight && styles.optionLight,
                selected === i && [styles.optionSelected, { borderColor: bandAccent }],
                isLight && selected === i && [styles.optionSelectedLight, { borderLeftWidth: 3, borderLeftColor: bandAccent }],
              ]}
              onPress={() => setSelected(i)}
              disabled={locked}
              activeOpacity={0.8}
            >
              <View style={styles.optionInnerRow}>
                <View style={[styles.radio, isLight && styles.radioLight, selected === i && [styles.radioActive, { borderColor: bandAccent, backgroundColor: bandAccent }]]} />
                <Text style={[styles.optionText, isLight && styles.optionTextLight]}>{opt}</Text>
              </View>
            </TouchableOpacity>
          ))}
        </View>
        </View>
      </Animated.View>
      <View style={styles.footer}>
        <AnimatedNextButton
          onPress={() => handleAnswer(selected)}
          disabled={locked || selected == null}
        />
      </View>
    </SafeAreaView>
  );
}

// Subtle animated bubble background for the card
function BubbleFX({ accent, light }: { accent: string; light: boolean }) {
  const COUNT = 7;
  const anims = useRef(
    Array.from({ length: COUNT }).map(() => ({
      t: new Animated.Value(Math.random()),
      l: Math.random() * 0.85 + 0.05, // left (% of width)
      s: Math.random() * 0.5 + 0.7, // base scale
      d: Math.random() * 2500 + 3500, // duration
      delay: Math.random() * 1200,
    }))
  ).current;

  useEffect(() => {
    const loops = anims.map((a) =>
      Animated.loop(
        Animated.sequence([
          Animated.timing(a.t, { toValue: 1, duration: a.d, delay: a.delay, easing: Easing.inOut(Easing.quad), useNativeDriver: true }),
          Animated.timing(a.t, { toValue: 0, duration: a.d, easing: Easing.inOut(Easing.quad), useNativeDriver: true }),
        ])
      )
    );
    loops.forEach((l) => l.start());
    return () => loops.forEach((l) => l.stop());
  }, [anims]);

  const bubbleColor = toRGBA(accent, light ? 0.14 : 0.18);

  return (
    <View pointerEvents="none" style={styles.bubbleWrap}>
      {anims.map((a, idx) => {
        const translateY = a.t.interpolate({ inputRange: [0, 1], outputRange: [18, -18] });
        const scale = a.t.interpolate({ inputRange: [0, 1], outputRange: [a.s, a.s * 1.25] });
        const opacity = a.t.interpolate({ inputRange: [0, 1], outputRange: [0.55, 0.35] });
        return (
          <Animated.View
            key={idx}
            style={[
              styles.bubble,
              {
                left: `${a.l * 100}%`,
                backgroundColor: bubbleColor,
                transform: [{ translateY }, { scale }],
                opacity,
              },
            ]}
          />
        );
      })}
    </View>
  );
}

function toRGBA(hex: string, alpha: number) {
  const h = hex.replace('#', '');
  const r = parseInt(h.substring(0, 2), 16) || 0;
  const g = parseInt(h.substring(2, 4), 16) || 0;
  const b = parseInt(h.substring(4, 6), 16) || 0;
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#121415' },
  containerLight: { backgroundColor: '#F8F8F8' },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  text: { color: '#fff' },
  header: { padding: 16 },
  headerRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 },
  headerTitle: { color: '#E5E7EB', fontSize: 16, fontWeight: '800' },
  headerTitleLight: { color: '#111827' },
  headerRight: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  counterPill: { backgroundColor: 'rgba(255,255,255,0.08)', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 10, borderWidth: StyleSheet.hairlineWidth, borderColor: 'rgba(255,255,255,0.15)' },
  counterPillLight: { backgroundColor: '#E9E6E0', borderColor: '#D7D3CB' },
  counterText: { color: '#E5E7EB', fontSize: 12, fontWeight: '700' },
  counterTextLight: { color: '#374151' },
  headerText: { color: '#9CA3AF', fontWeight: '700' },
  streakWarn: { color: '#F8B070', fontWeight: '700', marginTop: 4 },
  progressBar: { height: 8, backgroundColor: 'rgba(255,255,255,0.08)', borderRadius: 6, overflow: 'hidden', borderWidth: StyleSheet.hairlineWidth, borderColor: 'rgba(255,255,255,0.12)' },
  progressBarLight: { backgroundColor: '#E9E6E0', borderColor: '#D7D3CB' },
  progressFill: { height: '100%', backgroundColor: '#187486', borderRadius: 6 },
  questionCard: { backgroundColor: 'rgba(44,47,47,0.9)', marginHorizontal: 16, borderRadius: 18, padding: 18, borderWidth: StyleSheet.hairlineWidth, borderColor: '#3d474b', shadowColor: '#000', shadowOpacity: 0.35, shadowRadius: 16, shadowOffset: { width: 0, height: 12 }, elevation: 8, marginTop: 8 },
  questionCardLight: { backgroundColor: '#FFFFFF', borderColor: '#E5DED3', shadowOpacity: 0.12 },
  word: { color: '#fff', fontSize: 26, fontWeight: '900' },
  wordLight: { color: '#111827' },
  prompt: { color: '#9CA3AF', marginTop: 8, marginBottom: 12, fontSize: 14 },
  promptLight: { color: '#374151' },
  example: { color: '#9CA3AF', fontStyle: 'italic', marginBottom: 12 },
  exampleLight: { color: '#6B7280' },
  options: { gap: 10 },
  option: { backgroundColor: 'rgba(62,70,74,0.88)', borderWidth: StyleSheet.hairlineWidth, borderColor: '#4b555a', borderRadius: 12, paddingVertical: 12, paddingHorizontal: 14 },
  optionLight: { backgroundColor: '#FAF8F3', borderColor: '#D7D3CB' },
  optionSelectedLight: { backgroundColor: '#FFF3E9', borderColor: '#F0C9AC' },
  optionSelected: { borderColor: '#F8B070' },
  optionInnerRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 10, flexWrap: 'wrap' },
  radio: { width: 14, height: 14, borderRadius: 7, borderWidth: 2, borderColor: '#6B7280', marginTop: 3 },
  radioLight: { borderColor: '#9CA3AF' },
  radioActive: { borderColor: '#F8B070', backgroundColor: '#F8B070' },
  optionText: { color: '#E5E7EB', fontSize: 15, fontWeight: '600', flex: 1, flexShrink: 1, lineHeight: 20 },
  optionTextLight: { color: '#111827' },
  footer: { flexDirection: 'row', gap: 10, padding: 16 },
  btn: { flex: 1, borderRadius: 12, paddingVertical: 0, alignItems: 'center', overflow: 'hidden' },
  nextGradient: { width: '100%', borderRadius: 12, alignItems: 'center', justifyContent: 'center', paddingVertical: 12, minHeight: 44 },
  btnText: { color: '#fff', fontWeight: '800' },
  btnDisabled: { opacity: 0.6 },
  bubbleWrap: { position: 'absolute', top: 0, bottom: 0, left: 0, right: 0 },
  bubble: { position: 'absolute', width: 90, height: 90, borderRadius: 45, top: '30%' },
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
      return { pill: { backgroundColor: 'rgba(248,176,112,0.15)', borderColor: 'rgba(248,176,112,0.4)', borderWidth: StyleSheet.hairlineWidth, borderRadius: 10, paddingHorizontal: 8, paddingVertical: 4 }, text: { color: '#F8B070', fontWeight: '800', fontSize: 12 } } as any;
  }
}

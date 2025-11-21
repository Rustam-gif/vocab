import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  LayoutAnimation,
  Platform,
  UIManager,
  AccessibilityInfo,
  InteractionManager,
  Animated,
} from 'react-native';
import { getTheme } from '../../../lib/theme';
import { Easing } from 'react-native';
import * as Haptics from '../../../lib/haptics';
import type { TextInput as TextInputRef } from 'react-native';
import AnimatedNextButton from './AnimatedNextButton';

export type MissingLettersResult = {
  isCorrect: boolean;
  mistakes: number;
  usedReveal: boolean;
};

export interface MissingLettersProps {
  word: string;
  ipa?: string;
  clue: string;
  onResult: (result: MissingLettersResult) => void;
  onNext: () => void;
  theme?: 'dark' | 'light';
  wordIndex: number;
  totalWords: number;
  sharedScore: number;
}

// Enable LayoutAnimation on Android
if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

const DARK_COLORS = {
  bg: '#1E1E1E',
  text: '#FFFFFF',
  sub: '#9CA3AF',
  slotNeutral: '#2F2F2F',
  slotCorrect: '#437F76',
  slotWrong: '#924646',
  accent: '#F8B070',
  border: '#3A3A3A',
  hint: '#353535',
};

const LIGHT_THEME = getTheme('light');
const LIGHT_COLORS = {
  bg: LIGHT_THEME.background,      // '#F2E3D0'
  text: LIGHT_THEME.text,          // '#111827'
  sub: LIGHT_THEME.subtext,        // '#4B5563'
  slotNeutral: LIGHT_THEME.surface, // '#F9F1E7'
  slotCorrect: '#A1BFBA',          // soft green
  slotWrong: '#C9A3A3',            // soft red
  accent: LIGHT_THEME.accent,      // '#F8B070'
  border: LIGHT_THEME.border,      // '#F9F1E7'
  hint: '#E5E7EB',
};

type Slot = {
  index: number;           // position in display word
  char: string;            // display character
  isLetter: boolean;
  isSpace: boolean;
  isHint: boolean;
  value: string;           // user value for letters
  status: 'idle' | 'wrong' | 'correct' | 'revealed';
};

const normalize = (s: string) =>
  s
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-zA-Z]/g, '')
    .toLowerCase();

const isLetter = (c: string) => /[a-zA-Z]/.test(c);

function pickHintPositions(letterIndices: number[]): number[] {
  const n = letterIndices.length;
  if (n === 0) return [];
  let count = 1;
  if (n >= 5 && n <= 8) count = 2; else if (n >= 9) count = 3;
  if (count > n) count = Math.max(1, n - 1);
  const result: number[] = [];
  for (let i = 1; i <= count; i += 1) {
    // Evenly spaced across letters: fractions i/(count+1)
    const pos = Math.round((i / (count + 1)) * (n - 1));
    result.push(letterIndices[pos]);
  }
  // Ensure uniqueness
  return Array.from(new Set(result));
}

export default function MissingLetters({ word, ipa, clue, onResult, onNext, theme = 'dark', wordIndex, totalWords, sharedScore }: MissingLettersProps) {
  const displayWord = useMemo(() => word, [word]);
  const lettersOnly = useMemo(() => normalize(word), [word]);

  const initialSlots: Slot[] = useMemo(() => {
    const arr: Slot[] = [];
    const letterPositions: number[] = [];
    Array.from(displayWord).forEach((ch, idx) => {
      const letter = isLetter(ch);
      if (letter) letterPositions.push(idx);
      arr.push({
        index: idx,
        char: ch,
        isLetter: letter,
        isSpace: ch === ' ',
        isHint: false,
        value: '',
        status: 'idle',
      });
    });
    const hints = pickHintPositions(letterPositions);
    hints.forEach((di) => {
      const ch = arr[di].char;
      arr[di].isHint = true;
      arr[di].value = ch.toUpperCase();
      arr[di].status = 'revealed';
    });
    return arr;
  }, [displayWord]);

  const [slots, setSlots] = useState<Slot[]>(initialSlots);
  const [focused, setFocused] = useState<number | null>(null);
  const [mistakes, setMistakes] = useState(0);
  const [completed, setCompleted] = useState(false);
  const [evaluating, setEvaluating] = useState(false);
  const inputRefs = useRef<Array<TextInputRef | null>>([]);
  const pendingFocusRef = useRef<number | null>(null);
  const evaluationTimeout = useRef<NodeJS.Timeout | null>(null);
  const [displayScore, setDisplayScore] = useState(sharedScore);
  const prevScoreRef = useRef(sharedScore);
  const deductionAnim = useRef(new Animated.Value(0)).current;
  const slotAnims = useRef<Animated.Value[]>([]);

  useEffect(() => {
    setSlots(initialSlots);
    setMistakes(0);
    setCompleted(false);
    setFocused(null);
    setEvaluating(false);
    const firstEditable = initialSlots.findIndex(slot => slot.isLetter && !slot.isHint && slot.value.trim().length === 0);
    pendingFocusRef.current = firstEditable >= 0 ? firstEditable : null;
    if (evaluationTimeout.current) {
      clearTimeout(evaluationTimeout.current);
      evaluationTimeout.current = null;
    }
  }, [initialSlots]);

  useEffect(() => () => {
    if (evaluationTimeout.current) {
      clearTimeout(evaluationTimeout.current);
    }
  }, []);

  useEffect(() => {
    if (sharedScore < prevScoreRef.current) {
      deductionAnim.stopAnimation();
      deductionAnim.setValue(0);
      Animated.timing(deductionAnim, {
        toValue: 1,
        duration: 700,
        useNativeDriver: true,
      }).start();
    }
    prevScoreRef.current = sharedScore;
    setDisplayScore(sharedScore);
  }, [sharedScore, deductionAnim]);

  // Bubble-in animation for the letter slots on each word
  useEffect(() => {
    // Create one animated value per slot and animate in a stagger
    slotAnims.current = initialSlots.map(() => new Animated.Value(0));
    const anims = slotAnims.current.map((v, i) =>
      Animated.timing(v, {
        toValue: 1,
        duration: 360,
        delay: i * 35,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      })
    );
    if (anims.length) Animated.stagger(25, anims).start();
  }, [wordIndex, initialSlots.length]);

  const editableFilled = useMemo(() => {
    const editable = slots.filter(s => s.isLetter && !s.isHint);
    return editable.length > 0 && editable.every(s => s.value.trim().length === 1);
  }, [slots]);

  const handleChange = useCallback((arrayIndex: number, text: string) => {
    const nextValue = text.slice(-1).toUpperCase();
    setSlots(prev => {
      let targetFocus: number | null = null;
      const updated = prev.map((slot, idx) => {
        if (idx !== arrayIndex) {
          return slot;
        }
        const newSlot = slot.isHint
          ? slot
          : { ...slot, value: nextValue, status: slot.status === 'wrong' ? 'idle' : slot.status };
        return newSlot;
      });

      if (nextValue && !updated[arrayIndex].isHint) {
        for (let j = arrayIndex + 1; j < updated.length; j += 1) {
          const candidate = updated[j];
          if (candidate.isLetter && !candidate.isHint && candidate.value.trim().length === 0) {
            targetFocus = j;
            break;
          }
        }
        if (targetFocus === null) {
          for (let j = 0; j < updated.length; j += 1) {
            const candidate = updated[j];
            if (candidate.isLetter && !candidate.isHint && candidate.value.trim().length === 0) {
              targetFocus = j;
              break;
            }
          }
        }
      }

      pendingFocusRef.current = targetFocus;
      return updated;
    });
  }, []);

  useEffect(() => {
    const target = pendingFocusRef.current;
    if (target != null) {
      pendingFocusRef.current = null;
      const ref = inputRefs.current[target];
      if (ref) {
        ref.focus();
      }
      setFocused(target);
    }
  }, [slots]);

  const evaluateSlots = useCallback(() => {
    if (evaluating || completed) {
      return;
    }

    setEvaluating(true);
    const targetChars = Array.from(displayWord).filter(isLetter).map(c => c.toUpperCase());
    let ti = 0;
    let wrong = 0;
    const updated = slots.map(slot => {
      if (!slot.isLetter) {
        return slot;
      }
      const expected = targetChars[ti++];
      if (slot.isHint) {
        return { ...slot, status: 'revealed' };
      }
      const ok = slot.value.toUpperCase() === expected;
      if (!ok) wrong += 1;
      return { ...slot, status: ok ? 'correct' : 'wrong' };
    });

    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setSlots(updated);

    if (wrong === 0) {
      setCompleted(true);
      setEvaluating(false);
      onResult({ isCorrect: true, mistakes, usedReveal: false });
      return;
    }

    setMistakes(prev => {
      const nextMistakes = prev + 1;
      if (evaluationTimeout.current) {
        clearTimeout(evaluationTimeout.current);
      }
      evaluationTimeout.current = setTimeout(() => {
        LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
        setSlots(prevSlots => {
          let ti2 = 0;
          const targetChars2 = Array.from(displayWord).filter(isLetter).map(c => c.toUpperCase());
          return prevSlots.map(slot => {
            if (!slot.isLetter) return slot;
            const expected = targetChars2[ti2++];
            if (slot.isHint) return { ...slot, status: 'revealed' };
            return { ...slot, value: expected, status: 'correct' };
          });
        });
        setCompleted(true);
        setEvaluating(false);
        evaluationTimeout.current = null;
        onResult({ isCorrect: false, mistakes: nextMistakes, usedReveal: false });
      }, 1000);
      return nextMistakes;
    });
  }, [slots, displayWord, evaluating, completed, onResult]);

  useEffect(() => {
    if (!completed && !evaluating && editableFilled) {
      evaluateSlots();
    }
  }, [editableFilled, completed, evaluating, evaluateSlots]);

  useEffect(() => {
    if (completed) {
      AccessibilityInfo.announceForAccessibility('Completed. Continue to next word.');
    }
  }, [completed]);

  // Select styles and palette by theme
  const themeStyles = theme === 'light' ? lightStyles : darkStyles;
  const pal = theme === 'light' ? LIGHT_COLORS : DARK_COLORS;
  const deductionOpacity = deductionAnim.interpolate({
    inputRange: [0, 0.2, 1],
    outputRange: [0, 1, 0],
  });
  const deductionTranslateY = deductionAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, -35],
  });
  const progress = totalWords > 0 ? (wordIndex / totalWords) : 0;

  return (
    <View style={themeStyles.container}>
      <View style={themeStyles.progressContainer}>
        <Text style={themeStyles.progressText}>Word {wordIndex + 1} of {totalWords}</Text>
        <View style={themeStyles.scoreWrapper}>
          <Animated.Text
            style={[
              themeStyles.deductionText,
              {
                opacity: deductionOpacity,
                transform: [{ translateY: deductionTranslateY }],
              },
            ]}
          >
            -5
          </Animated.Text>
          <Text style={themeStyles.scoreText}>{displayScore}</Text>
        </View>
      </View>
      <View style={themeStyles.progressBar}>
        <View style={[themeStyles.progressFill, { width: `${Math.min(100, progress * 100)}%` }]} />
      </View>
      <View style={themeStyles.header}> 
        <Text style={themeStyles.clue} accessibilityLabel={`Clue: ${clue}`}>{clue}</Text>
        {ipa ? <Text style={themeStyles.ipa}>{ipa}</Text> : null}
      </View>

      <View style={themeStyles.slotsRow}>
        {slots.map((s, i) => {
          if (s.isSpace) {
            return <View key={i} style={themeStyles.spaceBox} />;
          }
          const bg = s.status === 'wrong' ? pal.slotWrong : s.status === 'correct' || s.isHint ? pal.slotCorrect : pal.slotNeutral;
          const locked = s.isHint || completed;
          const v = slotAnims.current[i] || new Animated.Value(1);
          const scale = v.interpolate({ inputRange: [0, 0.7, 1], outputRange: [0.86, 1.06, 1] });
          const opacity = v.interpolate({ inputRange: [0, 1], outputRange: [0, 1] });
          const translateY = v.interpolate({ inputRange: [0, 1], outputRange: [10, 0] });
          return (
            <Animated.View
              key={i}
              accessible
              accessibilityRole="text"
              accessibilityLabel={`letter ${i + 1} of ${slots.length}`}
              style={[
                themeStyles.slot,
                { backgroundColor: bg, transform: [{ translateY }, { scale }], opacity },
                // Emphasize the active slot while editing
                (focused === i && s.status === 'idle' && !s.isHint && !completed) && themeStyles.slotFocused,
              ]}
            >
              <TextInput
                ref={ref => {
                  inputRefs.current[i] = ref;
                }}
                value={(s.isHint ? s.char : s.value).toUpperCase()}
                editable={!locked && !evaluating && !completed}
                selectTextOnFocus
                onFocus={() => setFocused(i)}
                onChangeText={(t) => handleChange(i, t)}
                maxLength={1}
                style={themeStyles.input}
                autoCapitalize="characters"
                autoCorrect={false}
                spellCheck={false}
                autoComplete="off"
                keyboardType="default"
                placeholder={s.isHint ? undefined : ''}
                placeholderTextColor={pal.sub}
              />
            </Animated.View>
          );
        })}
      </View>

      {completed && (
        <View style={{ marginTop: 'auto', paddingBottom: 20 }}>
          <AnimatedNextButton
            onPress={onNext}
          />
        </View>
      )}
    </View>
  );
}

const darkStyles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: DARK_COLORS.bg,
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  progressContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  progressText: {
    fontSize: 14,
    color: DARK_COLORS.sub,
    fontWeight: '500',
    fontFamily: 'Ubuntu-Medium',
  },
  scoreWrapper: {
    alignItems: 'center',
    justifyContent: 'flex-end',
    minWidth: 48,
  },
  deductionText: {
    position: 'absolute',
    top: -20,
    fontSize: 16,
    fontWeight: '600',
    color: '#F87171',
    fontFamily: 'Ubuntu-Bold',
  },
  scoreText: {
    fontSize: 16,
    fontWeight: '600',
    color: DARK_COLORS.accent,
    fontFamily: 'Ubuntu-Bold',
  },
  progressBar: {
    height: 6,
    backgroundColor: DARK_COLORS.border,
    borderRadius: 3,
    overflow: 'hidden',
    marginBottom: 18,
  },
  progressFill: {
    height: '100%',
    backgroundColor: DARK_COLORS.accent,
  },
  header: {
    alignItems: 'center',
    marginTop: 40,
    marginBottom: 18,
  },
  clue: {
    color: DARK_COLORS.text,
    fontSize: 18,
    fontWeight: '600',
    textAlign: 'center',
    fontFamily: 'Ubuntu-Bold',
  },
  ipa: {
    marginTop: 6,
    color: DARK_COLORS.sub,
    fontSize: 14,
    fontFamily: 'Ubuntu-Regular',
  },
  slotsRow: {
    position: 'absolute',
    bottom: 360,
    left: 20,
    right: 20,
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 8,
  },
  slot: {
    width: 36,
    height: 48,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: DARK_COLORS.border,
  },
  slotFocused: {
    borderWidth: 3,
    borderColor: DARK_COLORS.accent,
  },
  spaceBox: {
    width: 16,
    height: 48,
  },
  input: {
    width: '100%',
    textAlign: 'center',
    color: DARK_COLORS.text,
    fontSize: 20,
    fontWeight: '700',
    fontFamily: 'Ubuntu-Bold',
  },
  button: {
    backgroundColor: DARK_COLORS.accent,
    paddingVertical: 14,
    paddingHorizontal: 32,
    borderRadius: 12,
    alignItems: 'center',
  },
  continueButton: {
    position: 'absolute',
    bottom: 250,
    alignSelf: 'center',
    left: '50%',
    transform: [{ translateX: -50 }],
  },
  buttonText: {
    color: DARK_COLORS.text,
    fontSize: 16,
    fontWeight: '700',
    fontFamily: 'Ubuntu-Bold',
  },
});

// Light theme styles
const lightStyles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: LIGHT_COLORS.bg,
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  progressContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  progressText: {
    fontSize: 14,
    color: LIGHT_COLORS.sub,
    fontWeight: '500',
    fontFamily: 'Ubuntu-Medium',
  },
  scoreWrapper: {
    alignItems: 'center',
    justifyContent: 'flex-end',
    minWidth: 48,
  },
  deductionText: {
    position: 'absolute',
    top: -20,
    fontSize: 16,
    fontWeight: '600',
    color: '#F87171',
    fontFamily: 'Ubuntu-Bold',
  },
  scoreText: {
    fontSize: 16,
    fontWeight: '600',
    color: LIGHT_COLORS.accent,
    fontFamily: 'Ubuntu-Bold',
  },
  progressBar: {
    height: 6,
    backgroundColor: '#E5E7EB',
    borderRadius: 3,
    overflow: 'hidden',
    marginBottom: 18,
  },
  progressFill: {
    height: '100%',
    backgroundColor: LIGHT_COLORS.accent,
  },
  header: {
    alignItems: 'center',
    marginTop: 40,
    marginBottom: 18,
  },
  clue: {
    color: LIGHT_COLORS.text,
    fontSize: 18,
    fontWeight: '600',
    textAlign: 'center',
    fontFamily: 'Ubuntu-Bold',
  },
  ipa: {
    marginTop: 6,
    color: LIGHT_COLORS.sub,
    fontSize: 14,
    fontFamily: 'Ubuntu-Regular',
  },
  slotsRow: {
    position: 'absolute',
    bottom: 360,
    left: 20,
    right: 20,
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 8,
  },
  slot: {
    width: 36,
    height: 48,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: LIGHT_COLORS.border,
  },
  slotFocused: {
    borderWidth: 3,
    borderColor: LIGHT_COLORS.accent,
  },
  spaceBox: {
    width: 16,
    height: 48,
  },
  input: {
    width: '100%',
    textAlign: 'center',
    color: LIGHT_COLORS.text,
    fontSize: 20,
    fontWeight: '700',
    fontFamily: 'Ubuntu-Bold',
  },
  button: {
    backgroundColor: LIGHT_COLORS.accent,
    paddingVertical: 14,
    paddingHorizontal: 32,
    borderRadius: 12,
    alignItems: 'center',
  },
  continueButton: {
    position: 'absolute',
    bottom: 250,
    alignSelf: 'center',
    left: '50%',
    transform: [{ translateX: -50 }],
  },
  buttonText: {
    color: LIGHT_COLORS.text,
    fontSize: 16,
    fontWeight: '700',
    fontFamily: 'Ubuntu-Bold',
  },
});

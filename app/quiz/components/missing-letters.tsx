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
} from 'react-native';
import * as Haptics from 'expo-haptics';
import type { TextInput as TextInputRef } from 'react-native';

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
}

// Enable LayoutAnimation on Android
if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

const COLORS = {
  bg: '#1E1E1E',
  text: '#FFFFFF',
  sub: '#9CA3AF',
  slotNeutral: '#2F2F2F',
  slotCorrect: '#437F76',
  slotWrong: '#924646',
  accent: '#F2935C',
  border: '#3A3A3A',
  hint: '#353535',
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

export default function MissingLetters({ word, ipa, clue, onResult, onNext, theme = 'dark' }: MissingLettersProps) {
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

  const editableFilled = useMemo(() => {
    const editable = slots.filter(s => s.isLetter && !s.isHint);
    return editable.length > 0 && editable.every(s => s.value.trim().length === 1);
  }, [slots]);

  const handleChange = useCallback((arrayIndex: number, text: string) => {
    const nextValue = text.slice(-1).toUpperCase();
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
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

  const themeStyles = theme === 'dark' ? darkStyles : darkStyles; // light theme could be added later

  return (
    <View style={themeStyles.container}>
      <View style={themeStyles.header}> 
        <Text style={themeStyles.clue} accessibilityLabel={`Clue: ${clue}`}>{clue}</Text>
        {ipa ? <Text style={themeStyles.ipa}>{ipa}</Text> : null}
      </View>

      <View style={themeStyles.slotsRow}>
        {slots.map((s, i) => {
          if (s.isSpace) {
            return <View key={i} style={themeStyles.spaceBox} />;
          }
          const bg = s.status === 'wrong' ? COLORS.slotWrong : s.status === 'correct' || s.isHint ? COLORS.slotCorrect : COLORS.slotNeutral;
          const locked = s.isHint || completed;
          return (
            <View
              key={i}
              accessible
              accessibilityRole="text"
              accessibilityLabel={`letter ${i + 1} of ${slots.length}`}
              style={[themeStyles.slot, { backgroundColor: bg }]}
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
                keyboardType="default"
                placeholder={s.isHint ? undefined : ''}
                placeholderTextColor={COLORS.sub}
              />
            </View>
          );
        })}
      </View>

      {completed && (
        <TouchableOpacity onPress={onNext} style={[themeStyles.button, { alignSelf: 'center', marginTop: 16 }]}> 
          <Text style={themeStyles.buttonText}>Continue</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

const darkStyles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.bg,
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  header: {
    alignItems: 'center',
    marginBottom: 18,
  },
  clue: {
    color: COLORS.text,
    fontSize: 18,
    fontWeight: '600',
    textAlign: 'center',
  },
  ipa: {
    marginTop: 6,
    color: COLORS.sub,
    fontSize: 14,
  },
  slotsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    marginTop: 10,
    marginBottom: 12,
    gap: 8,
  },
  slot: {
    width: 36,
    height: 48,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  spaceBox: {
    width: 16,
    height: 48,
  },
  input: {
    width: '100%',
    textAlign: 'center',
    color: COLORS.text,
    fontSize: 20,
    fontWeight: '700',
  },
  button: {
    backgroundColor: COLORS.accent,
    paddingVertical: 14,
    paddingHorizontal: 32,
    borderRadius: 12,
    alignItems: 'center',
  },
  buttonText: {
    color: COLORS.text,
    fontSize: 16,
    fontWeight: '700',
  },
});

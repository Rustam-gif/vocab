import React, { useEffect, useMemo, useRef, useState } from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import { View, Text, StyleSheet, TouchableOpacity, Animated, Easing, PanResponder, Pressable } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useAppStore } from '../lib/store';

export default function Flashcards() {
  const router = useRouter();
  const { folderId, title } = useLocalSearchParams<{ folderId: string; title?: string }>();
  const { words, loadWords } = useAppStore();
  const [index, setIndex] = useState(0);
  const rotate = useRef(new Animated.Value(0)).current;
  const appear = useRef(new Animated.Value(0)).current;
  const bounce = useRef(new Animated.Value(1)).current;
  const [flipped, setFlipped] = useState(false);
  const panX = useRef(new Animated.Value(0)).current;

  const panResponder = useRef(
    PanResponder.create({
      onMoveShouldSetPanResponder: (_, g) => Math.abs(g.dx) > 12 && Math.abs(g.dy) < 20,
      onMoveShouldSetPanResponderCapture: () => false,
      onPanResponderMove: Animated.event([null, { dx: panX }], { useNativeDriver: false }),
      onPanResponderRelease: (_, g) => {
        const threshold = 60;
        const velocityThreshold = 0.65;
        if ((g.dx <= -threshold) || (g.vx < -velocityThreshold && g.dx < -20)) {
          Animated.timing(panX, { toValue: -420, duration: 160, useNativeDriver: true }).start(() => {
            panX.setValue(0);
            next();
          });
        } else if ((g.dx >= threshold) || (g.vx > velocityThreshold && g.dx > 20)) {
          Animated.timing(panX, { toValue: 420, duration: 160, useNativeDriver: true }).start(() => {
            panX.setValue(0);
            prev();
          });
        } else {
          Animated.spring(panX, { toValue: 0, useNativeDriver: true, bounciness: 0 }).start();
        }
      },
    })
  ).current;

  useEffect(() => { (async () => { await loadWords(); })(); }, [loadWords]);

  const items = useMemo(() => words.filter(w => w.folderId === folderId), [words, folderId]);
  const current = items[Math.min(index, Math.max(0, items.length - 1))];

  const doFlip = () => {
    const to = flipped ? 0 : 1;
    Animated.parallel([
      Animated.timing(rotate, { toValue: to, duration: 260, easing: Easing.out(Easing.cubic), useNativeDriver: true }),
      Animated.sequence([
        Animated.timing(bounce, { toValue: 1.04, duration: 160, easing: Easing.out(Easing.cubic), useNativeDriver: true }),
        Animated.spring(bounce, { toValue: 1, useNativeDriver: true, friction: 5 })
      ])
    ]).start(() => setFlipped(!flipped));
  };

  const next = () => {
    setFlipped(false);
    rotate.setValue(0);
    setIndex(i => Math.min(i + 1, Math.max(0, items.length - 1)));
  };
  const prev = () => {
    setFlipped(false);
    rotate.setValue(0);
    setIndex(i => Math.max(i - 1, 0));
  };

  if (!current) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.center}> 
          <Text style={styles.empty}>No words in this folder.</Text>
        </View>
      </SafeAreaView>
    );
  }

  useEffect(() => {
    appear.setValue(0);
    Animated.timing(appear, { toValue: 1, duration: 280, easing: Easing.out(Easing.cubic), useNativeDriver: true }).start();
  }, [index]);

  const frontRotate = rotate.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '180deg'] });
  const backRotate = rotate.interpolate({ inputRange: [0, 1], outputRange: ['180deg', '360deg'] });
  const appearStyle = {
    opacity: appear,
    transform: [
      { translateY: appear.interpolate({ inputRange: [0, 1], outputRange: [18, 0] }) },
      { scale: bounce }
    ]
  } as const;
  const swipeStyle = { transform: [{ translateX: panX }] } as const;

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}><Text style={styles.backTxt}>Back</Text></TouchableOpacity>
        <Text style={styles.title}>{title || 'Flashcards'}</Text>
        <Text style={styles.counter}>{index + 1}/{items.length}</Text>
      </View>
      <View style={styles.body}>
        <Animated.View style={[styles.cardWrap, appearStyle, swipeStyle]}>
          {/* Front */}
          <Animated.View style={[styles.card, styles.cardElevated, { transform: [{ rotateY: frontRotate }] }]}>
            <Text style={styles.word}>{current.word}</Text>
            <Text style={styles.hint}>Tap to see meaning</Text>
          </Animated.View>
          {/* Back */}
          <Animated.View style={[styles.card, styles.cardBack, styles.cardElevated, { transform: [{ rotateY: backRotate }] }]}> 
            <Text style={styles.definition}>{current.definition}</Text>
            {!!current.example && (
              <Text style={styles.example}>“{current.example}”</Text>
            )}
          </Animated.View>
          <Pressable style={styles.tapCatcher} onPress={doFlip} {...panResponder.panHandlers} />
        </Animated.View>
        <View style={styles.controls}> 
          <TouchableOpacity style={styles.ctrlBtn} onPress={next} disabled={index >= items.length - 1}><Text style={styles.ctrlTxt}>I know</Text></TouchableOpacity>
          <TouchableOpacity style={styles.ctrlBtn} onPress={doFlip}><Text style={styles.ctrlTxt}>Flip</Text></TouchableOpacity>
          <TouchableOpacity style={styles.ctrlBtn} onPress={next} disabled={index >= items.length - 1}><Text style={styles.ctrlTxt}>I don't know</Text></TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
}

const CARD_W = 340;
const CARD_H = 240;

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#1E1E1E' },
  header: { paddingHorizontal: 20, paddingTop: 16, paddingBottom: 10, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  backBtn: { paddingVertical: 6, paddingHorizontal: 10, backgroundColor: '#2c2f2f', borderRadius: 8 },
  backTxt: { color: '#fff' },
  title: { color: '#fff', fontSize: 18, fontWeight: '700' },
  counter: { color: '#9CA3AF', fontSize: 12 },
  body: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  cardWrap: { width: CARD_W, height: CARD_H, marginBottom: 18 },
  card: { position: 'absolute', width: CARD_W, height: CARD_H, backfaceVisibility: 'hidden', backgroundColor: '#2c2f2f', borderRadius: 16, alignItems: 'center', justifyContent: 'center', padding: 20, overflow: 'hidden' },
  cardElevated: {},
  cardBack: { transform: [{ rotateY: '180deg' }] },
  word: { color: '#fff', fontSize: 28, fontWeight: '700' },
  hint: { marginTop: 8, color: '#9CA3AF' },
  definition: { color: '#e0e0e0', fontSize: 16, lineHeight: 22, textAlign: 'center' },
  example: { color: '#9CA3AF', marginTop: 8, fontStyle: 'italic', textAlign: 'center' },
  tapCatcher: { position: 'absolute', width: CARD_W, height: CARD_H },
  controls: { flexDirection: 'row', gap: 12 },
  ctrlBtn: { backgroundColor: '#e28743', paddingHorizontal: 16, paddingVertical: 10, borderRadius: 10 },
  ctrlTxt: { color: '#fff', fontWeight: '600' },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  empty: { color: '#9CA3AF' },
  
});



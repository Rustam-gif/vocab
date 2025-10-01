import React, { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import { View, Text, StyleSheet, TouchableOpacity, Animated, Easing, PanResponder, Dimensions } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useAppStore } from '../lib/store';

export default function Flashcards() {
  const router = useRouter();
  const { folderId, title } = useLocalSearchParams<{ folderId: string; title?: string }>();
  const { words, loadWords, getDueWords, gradeWordSrs, resetSrs } = useAppStore();
  const [index, setIndex] = useState(0);
  const [queue, setQueue] = useState<any[]>([]);
  const rotate = useRef(new Animated.Value(0)).current;
  const appear = useRef(new Animated.Value(0)).current;
  const bounce = useRef(new Animated.Value(1)).current;
  const [flipped, setFlipped] = useState(false);
  const panX = useRef(new Animated.Value(0)).current;
  const feedbackOpacity = useRef(new Animated.Value(0)).current;
  const [feedback, setFeedback] = useState<'know' | 'dont' | null>(null);

  const knowDragOpacity = useMemo(
    () =>
      panX.interpolate({
        inputRange: [-CARD_W, -40],
        outputRange: [0.45, 0],
        extrapolate: 'clamp'
      }),
    [panX]
  );
  const dontDragOpacity = useMemo(
    () =>
      panX.interpolate({
        inputRange: [40, CARD_W],
        outputRange: [0, 0.45],
        extrapolate: 'clamp'
      }),
    [panX]
  );

  useEffect(() => { (async () => { await loadWords(); })(); }, [loadWords]);

  // Build a session queue prioritized by due SRS (initialize only when folder changes or word count changes)
  const didInitRef = useRef(false);
  useEffect(() => {
    const due = getDueWords ? getDueWords(undefined, folderId as string) : [];
    const source = (due && due.length > 0) ? due : words.filter(w => w.folderId === folderId);
    console.log('Building queue:', source.length, 'words');
    setQueue(source);
    if (!didInitRef.current) {
      setIndex(0);
      didInitRef.current = true;
    } else if (index >= source.length && source.length > 0) {
      // Clamp index if current index is out of bounds after data change
      setIndex(source.length - 1);
    }
    setFlipped(false);
    rotate.setValue(0);
  }, [folderId, words.length]);

  const items = queue;
  const current = items.length > 0 && index < items.length ? items[index] : null;
  // Dots window so active dot stays centered
  const totalDots = items.length;
  const visibleCount = Math.min(9, Math.max(3, totalDots));
  const centerPos = Math.floor(visibleCount / 2);
  const clampedIndex = Math.min(Math.max(index, 0), Math.max(0, totalDots - 1));
  // Keep the active dot fixed at the center; out-of-range indices render as dim placeholders
  const dotsIndices = Array.from({ length: visibleCount }, (_, k) => clampedIndex + (k - centerPos));
  const nextCard = index + 1 < items.length ? items[index + 1] : null;
  const thirdCard = index + 2 < items.length ? items[index + 2] : null;

  const swipeRotate = useMemo(
    () =>
      panX.interpolate({
        inputRange: [-CARD_W, 0, CARD_W],
        outputRange: ['-5deg', '0deg', '5deg'],
        extrapolate: 'clamp'
      }),
    [panX]
  );

  const nextCardScale = useMemo(
    () =>
      panX.interpolate({
        inputRange: [-CARD_W, 0, CARD_W],
        outputRange: [0.97, 0.95, 0.97],
        extrapolate: 'clamp'
      }),
    [panX]
  );

  const nextCardTranslateY = useMemo(
    () =>
      panX.interpolate({
        inputRange: [-CARD_W, 0, CARD_W],
        outputRange: [12, 16, 12],
        extrapolate: 'clamp'
      }),
    [panX]
  );

  const nextCardTranslateX = useMemo(
    () =>
      panX.interpolate({
        inputRange: [-CARD_W, 0, CARD_W],
        outputRange: [-8, 0, 8],
        extrapolate: 'clamp'
      }),
    [panX]
  );

  const doFlip = useCallback(() => {
    const to = flipped ? 0 : 1;
    Animated.parallel([
      Animated.timing(rotate, { toValue: to, duration: 260, easing: Easing.out(Easing.cubic), useNativeDriver: true }),
      Animated.sequence([
        Animated.timing(bounce, { toValue: 1.04, duration: 160, easing: Easing.out(Easing.cubic), useNativeDriver: true }),
        Animated.spring(bounce, { toValue: 1, useNativeDriver: true, friction: 5 })
      ])
    ]).start(() => setFlipped(!flipped));
  }, [flipped, rotate, bounce]);

  // Animate card appearance when index changes
  useEffect(() => {
    if (!current) return;
    appear.setValue(0);
    Animated.timing(appear, { toValue: 1, duration: 280, easing: Easing.out(Easing.cubic), useNativeDriver: true }).start();
  }, [index, current]);

  const showFeedback = useCallback((type: 'know' | 'dont') => {
    setFeedback(type);
    feedbackOpacity.setValue(0.6);
    Animated.timing(feedbackOpacity, { toValue: 0, duration: 420, easing: Easing.out(Easing.cubic), useNativeDriver: true }).start(() => setFeedback(null));
  }, [feedbackOpacity]);

  const handleKnow = useCallback(() => {
    if (!current) return;
    const card = current;

    showFeedback('know');
    // Advance index using functional update to avoid stale closures
    setIndex(prev => {
      return prev + 1; // allow index to reach len to end the session
    });
    setFlipped(false);
    rotate.setValue(0);
    // Grade SRS in background
    if (gradeWordSrs) gradeWordSrs(card.id, 5).catch(() => {});
  }, [current, gradeWordSrs, rotate, showFeedback]);

  const handleDontKnow = useCallback(() => {
    if (!current) return;
    const card = current;

    showFeedback('dont');
    // Advance index using functional update to avoid stale closures
    setIndex(prev => {
      return prev + 1; // allow index to reach len to end the session
    });
    setFlipped(false);
    rotate.setValue(0);
    // Grade SRS in background
    if (gradeWordSrs) gradeWordSrs(card.id, 2).catch(() => {});
  }, [current, gradeWordSrs, rotate, showFeedback]);

  const handleKnowRef = useRef(handleKnow);
  const handleDontKnowRef = useRef(handleDontKnow);
  const flipRef = useRef(doFlip);

  useEffect(() => {
    handleKnowRef.current = handleKnow;
    handleDontKnowRef.current = handleDontKnow;
    flipRef.current = doFlip;
  }, [handleKnow, handleDontKnow, doFlip]);

  const panResponder = useMemo(
    () =>
      PanResponder.create({
        onStartShouldSetPanResponder: () => true,
        onMoveShouldSetPanResponder: (_, g) => Math.abs(g.dx) > Math.abs(g.dy) && Math.abs(g.dx) > 6,
        onPanResponderMove: Animated.event([null, { dx: panX }], { useNativeDriver: false }),
        onPanResponderRelease: (_, g) => {
          const threshold = 60;
          if (Math.abs(g.dx) < 10 && Math.abs(g.dy) < 10) {
            flipRef.current();
            Animated.spring(panX, { toValue: 0, useNativeDriver: true }).start();
            return;
          }
          const goLeft = g.dx <= -threshold;
          const goRight = g.dx >= threshold;
          if (!goLeft && !goRight) {
            Animated.spring(panX, { toValue: 0, useNativeDriver: true }).start();
            return;
          }
          // Animate card off-screen, then handle know/don't know, then reset panX
          const { width: screenWidth } = Dimensions.get('window');
          const toValue = goLeft ? -screenWidth : screenWidth;
          Animated.timing(panX, {
            toValue,
            duration: 220,
            easing: Easing.out(Easing.cubic),
            useNativeDriver: true
          }).start(({ finished }) => {
            if (!finished) {
              return;
            }
            if (goLeft) {
              handleKnowRef.current();
            } else {
              handleDontKnowRef.current();
            }
          });
        },
        onPanResponderTerminationRequest: () => false,
        onPanResponderReject: () => {},
        onPanResponderTerminate: () => {
          Animated.spring(panX, { toValue: 0, useNativeDriver: true }).start();
        },
      }),
    [panX]
  );

  useLayoutEffect(() => {
    panX.setValue(0);
  }, [index, panX]);

  if (!current) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.center}> 
          <Text style={styles.empty}>All done for now.</Text>
        </View>
      </SafeAreaView>
    );
  }

  const frontRotate = rotate.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '180deg'] });
  const backRotate = rotate.interpolate({ inputRange: [0, 1], outputRange: ['180deg', '360deg'] });
  const appearStyle = {
    opacity: appear,
    transform: [
      { translateY: appear.interpolate({ inputRange: [0, 1], outputRange: [18, 0] }) },
      { scale: bounce }
    ]
  } as const;
  const swipeStyle = { transform: [{ perspective: 900 }, { translateX: panX }, { rotate: swipeRotate }] } as const;

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}><Text style={styles.backTxt}>Back</Text></TouchableOpacity>
        <Text style={styles.title}>{title || 'Flashcards'}</Text>
        <Text style={styles.counter}>{`${Math.min(index + 1, items.length)}/${items.length}`}</Text>
      </View>
      <View style={styles.dotsBar}>
        {dotsIndices.map((i, idx) => {
          const isActive = idx === centerPos; // fixed center position
          const isOutOfRange = i < 0 || i >= totalDots;
          const dist = Math.abs(idx - centerPos);
          const fadeOpacity = isActive ? 1 : isOutOfRange ? 0.15 : Math.max(0.3, 1 - dist * 0.18);
          return (
            <View
              key={`dot-${i}-${idx}`}
              style={[styles.dot, isActive && styles.dotActive, { opacity: fadeOpacity }]}
            />
          );
        })}
      </View>
      <View style={styles.body}>
        <TouchableOpacity style={styles.resetBtn} onPress={() => resetSrs(folderId as string)}>
          <Text style={styles.resetTxt}>Reset SRS</Text>
        </TouchableOpacity>
        <Animated.View key={`card-${current.id}-${index}`} style={[styles.cardWrap, appearStyle]}>
          {thirdCard && (
            <View pointerEvents="none" style={[styles.deckCard, styles.deckCardThird]} />
          )}
          {nextCard && (
            <Animated.View
              pointerEvents="none"
              style={[
                styles.deckCard,
                styles.deckCardNext,
                {
                  transform: [
                    { translateY: nextCardTranslateY },
                    { translateX: nextCardTranslateX },
                    { scale: nextCardScale }
                  ]
                }
              ]}
            />
          )}
          <Animated.View style={[styles.activeCardContainer, swipeStyle]}>
            {/* Front */}
            <Animated.View style={[styles.card, styles.cardFront, styles.cardElevated, { transform: [{ rotateY: frontRotate }] }]}
              collapsable={false}
            >
              <View style={styles.cardHeaderStripe}>
                <Text style={styles.cardLabel}>Word</Text>
              </View>
              <Text style={styles.word}>{current.word}</Text>
              <Text style={styles.hint}>Tap to see meaning</Text>
            </Animated.View>
            {/* Back */}
            <Animated.View style={[styles.card, styles.cardBack, styles.cardBackSurface, styles.cardElevated, { transform: [{ rotateY: backRotate }] }]}> 
              <Text style={styles.definition}>{current.definition}</Text>
              {!!current.example && (
                <Text style={styles.example}>"{current.example}"</Text>
              )}
            </Animated.View>
            <Animated.View pointerEvents="none" style={[styles.feedbackOverlay, styles.feedbackKnow, { opacity: knowDragOpacity }]} />
            <Animated.View pointerEvents="none" style={[styles.feedbackOverlay, styles.feedbackDont, { opacity: dontDragOpacity }]} />
            {feedback && (
              <Animated.View pointerEvents="none" style={[styles.feedbackOverlay, feedback === 'know' ? styles.feedbackKnow : styles.feedbackDont, { opacity: feedbackOpacity }]} />
            )}
            <View style={styles.tapCatcher} {...panResponder.panHandlers} />
          </Animated.View>
        </Animated.View>
        <View style={styles.controls}> 
          <TouchableOpacity style={styles.ctrlBtn} onPress={doFlip}><Text style={styles.ctrlTxt}>Flip</Text></TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
}

const CARD_W = 340;
const CARD_H = 240;

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#1E1E1E' },
  header: { paddingHorizontal: 20, paddingTop: 16, paddingBottom: 6, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  backBtn: { paddingVertical: 6, paddingHorizontal: 10, backgroundColor: '#2c2f2f', borderRadius: 8 },
  backTxt: { color: '#fff' },
  title: { color: '#fff', fontSize: 18, fontWeight: '700' },
  counter: { color: '#9CA3AF', fontSize: 12 },
  dotsContainer: { },
  dotsBar: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', paddingBottom: 8 },
  dot: { width: 6, height: 6, borderRadius: 3, backgroundColor: '#2f3436', marginHorizontal: 3 },
  dotActive: { backgroundColor: '#f59f46', width: 8, height: 8, borderRadius: 4 },
  dotDim: { opacity: 0.35 },
  body: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  cardWrap: { width: CARD_W, height: CARD_H, marginBottom: 18, position: 'relative', overflow: 'visible' },
  swipeContainer: { position: 'absolute', width: CARD_W, height: CARD_H },
  card: { position: 'absolute', width: CARD_W, height: CARD_H, backfaceVisibility: 'hidden', borderRadius: 18, alignItems: 'center', justifyContent: 'center', padding: 24, overflow: 'hidden' },
  cardFront: { backgroundColor: '#273034', borderWidth: StyleSheet.hairlineWidth, borderColor: '#394145' },
  cardElevated: { shadowColor: '#000', shadowOpacity: 0.35, shadowRadius: 18, shadowOffset: { width: 0, height: 14 }, elevation: 12 },
  cardBack: { transform: [{ rotateY: '180deg' }] },
  cardBackSurface: { backgroundColor: '#1f2629' },
  word: { color: '#f4f6f8', fontSize: 30, fontWeight: '800', textAlign: 'center', letterSpacing: 0.4, textShadowColor: 'rgba(0,0,0,0.25)', textShadowOffset: { width: 0, height: 2 }, textShadowRadius: 6, marginTop: 12 },
  hint: { marginTop: 10, color: '#93a3af', fontSize: 13, letterSpacing: 0.5 },
  definition: { color: '#e3e8eb', fontSize: 16, lineHeight: 24, textAlign: 'center', paddingHorizontal: 10, marginTop: 12 },
  example: { color: '#8f9baa', marginTop: 10, fontStyle: 'italic', textAlign: 'center' },
  cardHeaderStripe: { position: 'absolute', top: 0, left: 0, right: 0, height: 48, backgroundColor: 'rgba(255,255,255,0.05)', borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: '#3b4549', justifyContent: 'center', paddingHorizontal: 18 },
  cardLabel: { color: '#9fb4bc', fontSize: 12, fontWeight: '600', textTransform: 'uppercase', letterSpacing: 1.8 },
  tapCatcher: { position: 'absolute', width: CARD_W, height: CARD_H },
  controls: { flexDirection: 'row', gap: 12 },
  ctrlBtn: { backgroundColor: '#e28743', paddingHorizontal: 16, paddingVertical: 10, borderRadius: 10 },
  ctrlTxt: { color: '#fff', fontWeight: '600' },
  resetBtn: { position: 'absolute', top: -44, right: 16, backgroundColor: '#2c2f2f', paddingHorizontal: 10, paddingVertical: 6, borderRadius: 8 },
  resetTxt: { color: '#9CA3AF', fontSize: 12 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  empty: { color: '#9CA3AF' },
  feedbackOverlay: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, borderRadius: 18 },
  feedbackKnow: { backgroundColor: 'rgba(34,197,94,0.32)' },
  feedbackDont: { backgroundColor: 'rgba(239,68,68,0.32)' },
  deckCard: { position: 'absolute', top: 0, left: 0, width: CARD_W, height: CARD_H, borderRadius: 18, backgroundColor: '#202629', overflow: 'hidden', borderWidth: StyleSheet.hairlineWidth, borderColor: '#2e3437', shadowColor: '#000', shadowOpacity: 0.35, shadowRadius: 14, shadowOffset: { width: 0, height: 10 }, elevation: 6 },
  deckCardNext: { opacity: 0.9, backgroundColor: '#21282b', borderColor: '#30383b' },
  deckCardThird: { opacity: 0.7, transform: [{ translateY: 24 }, { translateX: 4 }, { scale: 0.93 }], backgroundColor: '#1a2023', borderColor: '#272e31' },
  activeCardContainer: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, borderRadius: 18, overflow: 'hidden' },
  
});

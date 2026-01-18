import React, { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import { View, Text, StyleSheet, TouchableOpacity, Animated, Easing, PanResponder, Dimensions } from 'react-native';
import { X, Eye, CheckCircle2 } from 'lucide-react-native';
import LottieView from 'lottie-react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useAppStore } from '../lib/store';
import { getTheme } from '../lib/theme';

export default function Flashcards() {
  const router = useRouter();
  const { folderId, title } = useLocalSearchParams<{ folderId: string; title?: string }>();
  const { words, loadWords, getDueWords, gradeWordSrs } = useAppStore();
  const themeName = useAppStore(s => s.theme);
  const colors = getTheme(themeName);
  const isLight = themeName === 'light';
  const [index, setIndex] = useState(0);
  const [queue, setQueue] = useState<any[]>([]);
  const rotate = useRef(new Animated.Value(0)).current;
  const appear = useRef(new Animated.Value(0)).current;
  const bounce = useRef(new Animated.Value(1)).current;
  const [flipped, setFlipped] = useState(false);
  const panX = useRef(new Animated.Value(0)).current;
  const feedbackOpacity = useRef(new Animated.Value(0)).current;
  const [feedback, setFeedback] = useState<'know' | 'dont' | null>(null);
  // 3s gesture coach overlay (Lottie hand swipe)
  const [showCoach, setShowCoach] = useState(true);

  const knowDragOpacity = useMemo(
    () =>
      panX.interpolate({
        inputRange: [-CARD_W, -30],
        outputRange: [0.85, 0],
        extrapolate: 'clamp'
      }),
    [panX]
  );
  const dontDragOpacity = useMemo(
    () =>
      panX.interpolate({
        inputRange: [30, CARD_W],
        outputRange: [0, 0.85],
        extrapolate: 'clamp'
      }),
    [panX]
  );
  // Scale for feedback badges during drag
  const knowBadgeScale = useMemo(
    () =>
      panX.interpolate({
        inputRange: [-CARD_W, -60, 0],
        outputRange: [1.1, 0.8, 0],
        extrapolate: 'clamp'
      }),
    [panX]
  );
  const dontBadgeScale = useMemo(
    () =>
      panX.interpolate({
        inputRange: [0, 60, CARD_W],
        outputRange: [0, 0.8, 1.1],
        extrapolate: 'clamp'
      }),
    [panX]
  );

  useEffect(() => { (async () => { await loadWords(); })(); }, [loadWords]);

  // Coach overlay just shows the Lottie hand for ~3 seconds
  useEffect(() => {
    if (!showCoach) return;
    const to = setTimeout(() => setShowCoach(false), 3000);
    return () => clearTimeout(to);
  }, [showCoach]);


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
        outputRange: [0.965, 0.955, 0.965],
        extrapolate: 'clamp'
      }),
    [panX]
  );

  const nextCardTranslateY = useMemo(
    () =>
      panX.interpolate({
        inputRange: [-CARD_W, 0, CARD_W],
        outputRange: [18, 24, 18],
        extrapolate: 'clamp'
      }),
    [panX]
  );

  const nextCardTranslateX = useMemo(
    () =>
      panX.interpolate({
        inputRange: [-CARD_W, 0, CARD_W],
        outputRange: [-10, 0, 10],
        extrapolate: 'clamp'
      }),
    [panX]
  );

  // Peek visibility for the next card's word
  const nextPeekOpacity = useMemo(
    () =>
      panX.interpolate({
        inputRange: [-CARD_W, 0, CARD_W],
        outputRange: [0.5, 0.28, 0.5],
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
          const goLeft = g.dx <= -threshold; // left = again
          const goRight = g.dx >= threshold; // right = knew it
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
            // Per request: LEFT = I know, RIGHT = I don't know
            if (goLeft) {
              handleKnowRef.current();
            } else if (goRight) {
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
      <SafeAreaView style={[styles.container, isLight && { backgroundColor: colors.background }]}>
        <View style={styles.doneHeader}>
          <TouchableOpacity onPress={() => router.back()} style={[styles.closeBtn, isLight && { backgroundColor: '#FFFFFF', borderColor: '#E5E7EB' }]}>
            <X size={20} color={isLight ? '#111827' : '#FFFFFF'} />
          </TouchableOpacity>
        </View>
        <View style={styles.center}>
          <Text style={[styles.empty, isLight && { color: '#6B7280' }]}>All done for now.</Text>
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
    <SafeAreaView style={[styles.container, isLight && { backgroundColor: colors.background }]}>
      <View style={[styles.header, isLight && { borderBottomColor: '#E5E7EB' }]}>
        <TouchableOpacity onPress={() => router.back()} style={[styles.backBtn, isLight && { backgroundColor: '#FFFFFF', borderColor: '#E5E7EB' }]}><Text style={[styles.backTxt, isLight && { color: '#111827' }]}>Back</Text></TouchableOpacity>
        <View style={styles.headerCenter}>
          <Text style={[styles.title, isLight && { color: '#111827' }]}>{title || 'Common Phrasal Verbs'}</Text>
          <Text style={[styles.subLabel, isLight && { color: '#6B7280' }]}>Tap to reveal • {`${Math.min(index + 1, items.length)}/${items.length}`}</Text>
        </View>
        <View style={{ width: 48 }} />
      </View>
      <View style={[styles.dotsBar, { marginTop: 2 }]}>
        {dotsIndices.map((i, idx) => {
          const isActive = idx === centerPos; // fixed center position
          const isOutOfRange = i < 0 || i >= totalDots;
          const dist = Math.abs(idx - centerPos);
          const fadeOpacity = isActive ? 1 : isOutOfRange ? 0.15 : Math.max(0.3, 1 - dist * 0.18);
          return (
            <View
              key={`dot-${i}-${idx}`}
              style={[styles.dot, isActive && styles.dotActive, isLight && !isActive && { backgroundColor: '#D1D5DB' }, { opacity: fadeOpacity }]}
            />
          );
        })}
      </View>
      {/* Swipe direction hints */}
      <View style={styles.swipeHintsRow}>
        <View style={[styles.swipeHint, styles.swipeHintLeft]}>
          <CheckCircle2 size={16} color="#4ED9CB" />
          <Text style={[styles.swipeHintText, { color: '#4ED9CB' }]}>Got it</Text>
        </View>
        <View style={[styles.swipeHint, styles.swipeHintRight]}>
          <Text style={[styles.swipeHintText, { color: '#F25E86' }]}>Learning</Text>
          <X size={16} color="#F25E86" />
        </View>
      </View>
      <View style={styles.body}>
        <Animated.View key={`card-${current.id}-${index}`} style={[styles.cardWrap, appearStyle]}>
          {thirdCard && (
            <View
              pointerEvents="none"
              style={[
                styles.deckCard,
                styles.deckCardThird,
                isLight && { backgroundColor: '#F2F4F7', borderColor: '#E5E7EB', shadowOpacity: 0.1, shadowColor: '#9CA3AF' }
              ]}
            >
              <View style={styles.deckCardContent}>
                <Text numberOfLines={1} ellipsizeMode="tail" style={[styles.peekWordThird, isLight && styles.peekWordLight]}>
                  {String(thirdCard.word || '')}
                </Text>
              </View>
            </View>
          )}
          {nextCard && (
            <Animated.View
              pointerEvents="none"
              style={[
                styles.deckCard,
                styles.deckCardNext,
                isLight && { backgroundColor: '#F7F8FA', borderColor: '#E5E7EB', shadowOpacity: 0.1, shadowColor: '#9CA3AF' },
                {
                  transform: [
                    { translateY: nextCardTranslateY },
                    { translateX: nextCardTranslateX },
                    { scale: nextCardScale }
                  ]
                }
              ]}
            >
              <View style={styles.deckCardContent}>
                <Animated.Text numberOfLines={1} ellipsizeMode="tail" style={[styles.peekWord, isLight && styles.peekWordLight, { opacity: nextPeekOpacity }]}>
                  {String(nextCard.word || '')}
                </Animated.Text>
              </View>
            </Animated.View>
          )}
          {/* stack base shadow to enhance separation */}
          <View style={[styles.stackShadow, isLight && styles.stackShadowLight]} />
          <Animated.View style={[styles.activeCardContainer, swipeStyle]}>
            {/* Front */}
            <Animated.View style={[styles.card, styles.cardFront, styles.cardElevated, isLight && { backgroundColor: '#FFFFFF', borderColor: '#E5E7EB', shadowOpacity: 0.15, shadowColor: '#9CA3AF' }, { transform: [{ rotateY: frontRotate }] }]}
              collapsable={false}
            >
              <View style={styles.cardHeaderStripe}>
                <Text style={[styles.cardLabel, isLight && { color: '#6B7280' }]}>PHRASAL VERB</Text>
              </View>
              <Text style={[styles.word, isLight && { color: '#111827', textShadowColor: 'transparent' }]}>{current.word}</Text>
              <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 8 }}>
                <Eye size={16} color={isLight ? '#6B7280' : '#93a3af'} />
                <Text style={[styles.hint, isLight && { color: '#6B7280' }]}>  Tap to see meaning</Text>
              </View>
            </Animated.View>
            {/* Back */}
            <Animated.View style={[styles.card, styles.cardBack, styles.cardBackSurface, styles.cardElevated, isLight && { backgroundColor: '#FFFFFF', borderColor: '#E5E7EB', shadowOpacity: 0.15, shadowColor: '#9CA3AF' }, { transform: [{ rotateY: backRotate }] }]}> 
              <Text style={[styles.definition, isLight && { color: '#111827' }]}>{current.definition}</Text>
              {!!current.example && (
                <Text style={[styles.example, isLight && { color: '#6B7280' }]}>"{current.example}"</Text>
              )}
            </Animated.View>
            {/* Coach overlay (Lottie) */}
            {showCoach && (
              <View pointerEvents="none" style={styles.coachLottieWrap}>
                <LottieView
                  source={require('../assets/lottie/HandSwipe.json')}
                  autoPlay
                  loop
                  style={{ width: 140, height: 140 }}
                />
              </View>
            )}
            {/* Know feedback (swipe left) */}
            <Animated.View pointerEvents="none" style={[styles.feedbackOverlay, styles.feedbackKnow, { opacity: knowDragOpacity }]}>
              <Animated.View style={[styles.feedbackBadge, styles.feedbackBadgeKnow, { transform: [{ scale: knowBadgeScale }] }]}>
                <CheckCircle2 size={32} color="#FFFFFF" />
                <Text style={styles.feedbackBadgeText}>Got it!</Text>
              </Animated.View>
            </Animated.View>
            {/* Don't know feedback (swipe right) */}
            <Animated.View pointerEvents="none" style={[styles.feedbackOverlay, styles.feedbackDont, { opacity: dontDragOpacity }]}>
              <Animated.View style={[styles.feedbackBadge, styles.feedbackBadgeDont, { transform: [{ scale: dontBadgeScale }] }]}>
                <X size={32} color="#FFFFFF" />
                <Text style={styles.feedbackBadgeText}>Learning</Text>
              </Animated.View>
            </Animated.View>
            {/* Post-swipe feedback flash */}
            {feedback && (
              <Animated.View pointerEvents="none" style={[styles.feedbackOverlay, feedback === 'know' ? styles.feedbackKnow : styles.feedbackDont, { opacity: feedbackOpacity }]}>
                <View style={[styles.feedbackBadge, feedback === 'know' ? styles.feedbackBadgeKnow : styles.feedbackBadgeDont]}>
                  {feedback === 'know' ? (
                    <CheckCircle2 size={40} color="#FFFFFF" />
                  ) : (
                    <X size={40} color="#FFFFFF" />
                  )}
                  <Text style={styles.feedbackBadgeText}>{feedback === 'know' ? 'Got it!' : 'Learning'}</Text>
                </View>
              </Animated.View>
            )}
            <View style={styles.tapCatcher} {...panResponder.panHandlers} />
          </Animated.View>
        </Animated.View>
      </View>
      {/* Tabs moved to Home screen as requested */}
    </SafeAreaView>
  );
}

const SW = Dimensions.get('window').width;
const SH = Dimensions.get('window').height;
const CARD_W = Math.min(380, SW - 48);
const CARD_H = Math.min(500, Math.round(SH * 0.48));

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#1E1E1E' },
  doneHeader: { paddingHorizontal: 16, paddingTop: 12, alignItems: 'flex-end' },
  closeBtn: { padding: 8, borderRadius: 12, backgroundColor: '#2A2D2E', borderWidth: 2, borderColor: '#1A1A1A' },
  header: { paddingHorizontal: 20, paddingTop: 16, paddingBottom: 6, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  headerCenter: { alignItems: 'center', justifyContent: 'center' },
  backBtn: { paddingVertical: 8, paddingHorizontal: 14, backgroundColor: '#2A2D2E', borderRadius: 12, borderWidth: 2, borderColor: '#1A1A1A' },
  backTxt: { color: '#fff', fontFamily: 'Ubuntu-Bold', fontSize: 14 },
  title: { color: '#fff', fontSize: 18, fontWeight: '700', fontFamily: 'Feather-Bold' },
  subLabel: { color: '#9CA3AF', fontSize: 12, marginTop: 2, fontFamily: 'Ubuntu-Medium' },
  dotsContainer: { },
  dotsBar: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', paddingBottom: 8 },
  dot: { width: 6, height: 6, borderRadius: 3, backgroundColor: '#2f3436', marginHorizontal: 3 },
  dotActive: { backgroundColor: '#F8B070', width: 8, height: 8, borderRadius: 4 },
  dotDim: { opacity: 0.35 },
  body: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  cardWrap: { width: CARD_W, height: CARD_H, marginBottom: 12, position: 'relative', overflow: 'visible' },
  swipeContainer: { position: 'absolute', width: CARD_W, height: CARD_H },
  card: { position: 'absolute', width: CARD_W, height: CARD_H, backfaceVisibility: 'hidden', borderRadius: 22, alignItems: 'center', justifyContent: 'center', padding: 24, overflow: 'hidden' },
  cardFront: { backgroundColor: '#2A2D2E', borderWidth: 3, borderColor: '#1A1A1A' },
  cardElevated: { shadowColor: '#000', shadowOpacity: 0.4, shadowRadius: 0, shadowOffset: { width: 2, height: 4 }, elevation: 12 },
  cardBack: { transform: [{ rotateY: '180deg' }] },
  cardBackSurface: { backgroundColor: '#2A2D2E', borderWidth: 3, borderColor: '#1A1A1A' },
  word: { color: '#FFFFFF', fontSize: 32, fontWeight: '800', textAlign: 'center', letterSpacing: 0.4, fontFamily: 'Feather-Bold', marginTop: 12 },
  hint: { marginTop: 10, color: '#9CA3AF', fontSize: 13, letterSpacing: 0.5, fontFamily: 'Ubuntu-Medium' },
  definition: { color: '#E5E7EB', fontSize: 18, lineHeight: 26, textAlign: 'center', paddingHorizontal: 10, marginTop: 12, fontFamily: 'Ubuntu-Medium' },
  example: { color: '#9CA3AF', marginTop: 14, fontStyle: 'italic', textAlign: 'center', fontFamily: 'Ubuntu-Medium', fontSize: 14 },
  cardHeaderStripe: { position: 'absolute', top: 0, left: 0, right: 0, height: 44, backgroundColor: 'transparent', borderBottomWidth: 0, justifyContent: 'center', paddingHorizontal: 18 },
  cardLabel: { color: '#9CA3AF', fontSize: 11, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 2, fontFamily: 'Ubuntu-Bold' },
  tapCatcher: { position: 'absolute', width: CARD_W, height: CARD_H },
  controls: { flexDirection: 'row', gap: 12 },
  ctrlBtn: { backgroundColor: '#e28743', paddingHorizontal: 16, paddingVertical: 10, borderRadius: 10 },
  ctrlTxt: { color: '#fff', fontWeight: '600' },
  // resetBtn removed
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  empty: { color: '#9CA3AF', fontFamily: 'Ubuntu-Medium', fontSize: 16 },
  feedbackOverlay: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, borderRadius: 22, alignItems: 'center', justifyContent: 'center' },
  feedbackIcon: { shadowColor: '#000', shadowOpacity: 0.2, shadowRadius: 8 },
  feedbackKnow: { backgroundColor: 'rgba(78, 217, 203, 0.25)' },
  feedbackDont: { backgroundColor: 'rgba(242, 94, 134, 0.25)' },
  feedbackBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 50,
    gap: 8,
    shadowColor: '#000',
    shadowOpacity: 0.3,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 8,
  },
  feedbackBadgeKnow: { backgroundColor: '#4ED9CB' },
  feedbackBadgeDont: { backgroundColor: '#F25E86' },
  feedbackBadgeText: { color: '#FFFFFF', fontSize: 18, fontWeight: '700', fontFamily: 'Ubuntu-Bold' },
  deckCard: { position: 'absolute', top: 0, left: 0, width: CARD_W, height: CARD_H, borderRadius: 22, backgroundColor: '#252829', overflow: 'hidden', borderWidth: 3, borderColor: '#1A1A1A', shadowColor: '#000', shadowOpacity: 0.3, shadowRadius: 0, shadowOffset: { width: 2, height: 3 }, elevation: 6 },
  deckCardNext: { opacity: 0.95, backgroundColor: '#232627', borderColor: '#1A1A1A' },
  deckCardThird: { opacity: 0.85, transform: [{ translateY: 34 }, { translateX: 8 }, { scale: 0.93 }], backgroundColor: '#1E2122', borderColor: '#1A1A1A' },
  activeCardContainer: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, borderRadius: 22, overflow: 'hidden' },
  stackShadow: { position: 'absolute', bottom: -6, left: 18, right: 18, height: 18, borderRadius: 12, backgroundColor: 'rgba(0,0,0,0.12)' },
  stackShadowLight: { backgroundColor: 'rgba(17,24,39,0.08)' },
  deckCardContent: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 14 },
  peekWord: { fontSize: 22, fontWeight: '800', color: '#E5E7EB', fontFamily: 'Feather-Bold' },
  peekWordThird: { fontSize: 18, fontWeight: '800', color: 'rgba(229,231,235,0.6)', opacity: 0.18, fontFamily: 'Feather-Bold' },
  peekWordLight: { color: '#1f2937' },
  tabBar: { position: 'absolute', left: 0, right: 0, bottom: 0, height: 54, borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: '#2F3436', flexDirection: 'row', backgroundColor: 'rgba(17,17,17,0.9)' },
  tabBarLight: { backgroundColor: '#FFFFFF', borderTopColor: '#E5E7EB' },
  tabBtn: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  tabBtnActive: { },
  tabTxt: { color: '#9CA3AF', fontWeight: '700' },
  tabTxtActive: { color: '#E5E7EB', fontWeight: '900' },
  // Coach overlay (Lottie) styles
  coachLottieWrap: { position: 'absolute', left: 0, right: 0, bottom: 10, alignItems: 'center', justifyContent: 'center' },
  // Swipe direction hints
  swipeHintsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 32,
    marginBottom: 8,
  },
  swipeHint: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    opacity: 0.7,
  },
  swipeHintLeft: {},
  swipeHintRight: {},
  swipeHintText: {
    fontSize: 13,
    fontWeight: '600',
    fontFamily: 'Ubuntu-Medium',
  },
  // footer controls removed per request

});

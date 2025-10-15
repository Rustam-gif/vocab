import React, { useMemo, useRef, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Dimensions, NativeScrollEvent, NativeSyntheticEvent, Animated } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Image } from 'react-native';

type Props = {
  visible: boolean;
  onClose: () => void;
  theme: 'light' | 'dark';
};

const { width, height } = Dimensions.get('window');

export default function OnboardingModal({ visible, onClose, theme }: Props) {
  const isLight = theme === 'light';
  const pages = useMemo(() => [
    {
      title: 'Welcome to Vocadoo',
      body: 'Build a powerful vocabulary with bite‑size steps.',
      image: require('../../assets/homepageicons/story-exercise.png'), // cute penguin
    },
    {
      title: 'Save Words Fast',
      body: 'Add a word and let AI suggest definitions and examples.',
      image: require('../../assets/homepageicons/vault.png'),
    },
    {
      title: 'Practice Your Way',
      body: 'Story blanks, quick quizzes, and word sprint—mix for mastery.',
      image: require('../../assets/homepageicons/quiz-session.png'),
    },
    {
      title: 'Track Progress',
      body: 'Earn XP, keep streaks, and see words become learned.',
      image: require('../../assets/homepageicons/analytics.png'),
    },
  ], []);

  const [index, setIndex] = useState(0);
  const scrollX = useRef(new Animated.Value(0)).current;
  const scrollRef = useRef<ScrollView>(null);
  const pageTo = (i: number) => {
    setIndex(i);
    scrollRef.current?.scrollTo({ x: i * width, animated: true });
  };

  const onScroll = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    const i = Math.round(e.nativeEvent.contentOffset.x / Math.max(1, width));
    if (i !== index) setIndex(i);
  };

  if (!visible) return null;

  return (
    <View style={[styles.overlay, isLight && styles.overlayLight]}>
      <SafeAreaView style={styles.safe}>
        <View style={styles.header}>
          <View style={{ width: 44 }} />
          <Text style={[styles.headerTitle, isLight && styles.headerTitleLight]}>Getting Started</Text>
          <TouchableOpacity onPress={onClose} style={styles.skipBtn}>
            <Text style={[styles.skipText, isLight && styles.skipTextLight]}>Skip</Text>
          </TouchableOpacity>
        </View>

        <Animated.ScrollView
          ref={scrollRef}
          horizontal
          pagingEnabled
          showsHorizontalScrollIndicator={false}
          onScroll={Animated.event(
            [{ nativeEvent: { contentOffset: { x: scrollX } } }],
            { useNativeDriver: true, listener: onScroll }
          )}
          scrollEventThrottle={16}
        >
          {pages.map((p, i) => (
            <View key={i} style={[styles.slidePage]}>
              {/** Card animation: scale + lift + fade based on page position */}
              {(() => {
                const inputRange = [(i - 1) * width, i * width, (i + 1) * width];
                const scale = scrollX.interpolate({ inputRange, outputRange: [0.94, 1, 0.94], extrapolate: 'clamp' });
                const translateY = scrollX.interpolate({ inputRange, outputRange: [14, 0, 14], extrapolate: 'clamp' });
                const opacity = scrollX.interpolate({ inputRange, outputRange: [0.7, 1, 0.7], extrapolate: 'clamp' });
                return (
                  <Animated.View style={[styles.heroCard, isLight ? styles.heroCardLight : styles.heroCardDark, { transform: [{ scale }, { translateY }], opacity }]}>
                    <Image
                      source={p.image}
                      style={{ width: Math.min(180, width * 0.45), height: Math.min(180, width * 0.45), resizeMode: 'contain' }}
                    />
                  </Animated.View>
                );
              })()}
              <Text style={[styles.title, isLight && styles.titleLight]}>{p.title}</Text>
              <Text style={[styles.body, isLight && styles.bodyLight]}>{p.body}</Text>
            </View>
          ))}
        </Animated.ScrollView>

        <View style={styles.footer}>
          <View style={styles.dotsRow}>
            {pages.map((_, i) => (
              <View
                key={i}
                style={[styles.dot, i === index ? (isLight ? styles.dotActiveLight : styles.dotActive) : (isLight ? styles.dotLight : styles.dotDark)]}
              />
            ))}
          </View>
          <View style={[styles.btnRow, { justifyContent: 'center' }]}>
            {index < pages.length - 1 ? (
              <TouchableOpacity style={styles.primaryBtn} onPress={() => pageTo(index + 1)}>
                <Text style={styles.primaryText}>Next</Text>
              </TouchableOpacity>
            ) : (
              <TouchableOpacity style={styles.primaryBtn} onPress={onClose}>
                <Text style={styles.primaryText}>Get Started</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  overlay: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: '#121315' },
  overlayLight: { backgroundColor: '#F2E3D0' },
  safe: { flex: 1 },
  slidePage: { width, paddingHorizontal: 24, alignItems: 'center', justifyContent: 'center', minHeight: height - 220 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 16, paddingTop: 8 },
  headerTitle: { color: '#E5E7EB', fontSize: 16, fontWeight: '800' },
  headerTitleLight: { color: '#111827' },
  skipBtn: { padding: 8, borderRadius: 10 },
  skipText: { color: '#E5E7EB', fontWeight: '700' },
  skipTextLight: { color: '#374151' },
  heroCard: { width: '100%', alignItems: 'center', justifyContent: 'center', marginTop: 12, marginBottom: 6, borderRadius: 18, paddingVertical: 8 },
  heroCardLight: { backgroundColor: '#F9F1E7', borderWidth: 1, borderColor: '#F3E6D7' },
  heroCardDark: { backgroundColor: '#1F2629', borderWidth: 1, borderColor: '#2A3033' },
  title: { marginTop: 8, fontSize: 22, fontWeight: '800', color: '#FFFFFF', textAlign: 'center' },
  titleLight: { color: '#111827' },
  body: { marginTop: 6, fontSize: 15, color: '#9CA3AF', textAlign: 'center', paddingHorizontal: 8, lineHeight: 22 },
  bodyLight: { color: '#4B5563' },
  footer: { position: 'absolute', left: 0, right: 0, bottom: 24, paddingHorizontal: 16 },
  dotsRow: { flexDirection: 'row', justifyContent: 'center', gap: 8, marginBottom: 14 },
  dot: { width: 8, height: 8, borderRadius: 4 },
  dotDark: { backgroundColor: '#2F3A40' },
  dotLight: { backgroundColor: '#D7D3CB' },
  dotActive: { backgroundColor: '#F2935C' },
  dotActiveLight: { backgroundColor: '#F2935C' },
  btnRow: { flexDirection: 'row', alignItems: 'center' },
  secondaryBtn: { minWidth: 120, paddingVertical: 12, paddingHorizontal: 16, borderRadius: 12, backgroundColor: '#2A3033', borderWidth: 1, borderColor: '#364147', alignItems: 'center' },
  secondaryBtnLight: { backgroundColor: '#E9E6E0', borderColor: '#D7D3CB' },
  secondaryText: { color: '#E5E7EB', fontWeight: '700' },
  secondaryTextLight: { color: '#374151' },
  primaryBtn: { minWidth: 160, paddingVertical: 14, borderRadius: 12, backgroundColor: '#F2935C', alignItems: 'center' },
  primaryText: { color: '#111827', fontWeight: '800' },
});

import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Animated, Easing, DeviceEventEmitter } from 'react-native';
import { LinearGradient } from '../../lib/LinearGradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useAppStore } from '../../lib/store';
import LottieView from 'lottie-react-native';

export default function PlacementIntro() {
  const router = useRouter();
  const themeName = useAppStore(s => s.theme);
  const isLight = themeName === 'light';

  // Animation refs
  const pulse = useRef(new Animated.Value(1)).current;
  const float = useRef(new Animated.Value(0)).current;
  const fadeIn = useRef(new Animated.Value(0)).current;
  const slideUp = useRef(new Animated.Value(30)).current;
  const cardScale = useRef(new Animated.Value(0.95)).current;

  // Hide nav bar on mount, show on unmount
  useEffect(() => {
    DeviceEventEmitter.emit('NAV_VISIBILITY', 'hide');
    return () => DeviceEventEmitter.emit('NAV_VISIBILITY', 'show');
  }, []);

  useEffect(() => {
    // Entry animations
    Animated.parallel([
      Animated.timing(fadeIn, { toValue: 1, duration: 600, useNativeDriver: true }),
      Animated.timing(slideUp, { toValue: 0, duration: 600, easing: Easing.out(Easing.back(1.2)), useNativeDriver: true }),
      Animated.spring(cardScale, { toValue: 1, friction: 8, tension: 40, useNativeDriver: true }),
    ]).start();

    // Pulse animation for CTA button
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, { toValue: 1.04, duration: 800, easing: Easing.out(Easing.quad), useNativeDriver: true }),
        Animated.timing(pulse, { toValue: 1, duration: 800, easing: Easing.inOut(Easing.quad), useNativeDriver: true }),
      ])
    ).start();

    // Float animation for card
    Animated.loop(
      Animated.sequence([
        Animated.timing(float, { toValue: 1, duration: 2000, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
        Animated.timing(float, { toValue: 0, duration: 2000, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
      ])
    ).start();
  }, [pulse, float, fadeIn, slideUp, cardScale]);

  const floatTranslate = float.interpolate({ inputRange: [0, 1], outputRange: [0, -6] });

  return (
    <View style={[styles.container, isLight && styles.containerLight]}>
      <SafeAreaView style={styles.safe}>
        {/* Header */}
        <Animated.View style={[styles.header, { opacity: fadeIn }]}>
          <Text style={[styles.headerTitle, isLight && styles.headerTitleLight]}>Level Check</Text>
        </Animated.View>

        {/* Lottie Animation */}
        <Animated.View style={[styles.lottieWrap, { opacity: fadeIn, transform: [{ translateY: slideUp }] }]}>
          <LottieView
            source={require('../../assets/lottie/Onboarding/2.json')}
            autoPlay
            loop
            style={styles.lottie}
          />
        </Animated.View>

        {/* Card */}
        <Animated.View
          style={[
            styles.card,
            isLight && styles.cardLight,
            {
              opacity: fadeIn,
              transform: [
                { translateY: Animated.add(slideUp, floatTranslate) },
                { scale: cardScale }
              ]
            }
          ]}
        >
          <Text style={[styles.title, isLight && styles.titleLight]}>Placement Test</Text>
          <Text style={[styles.subtitle, isLight && styles.subtitleLight]}>Find your level so practice fits you.</Text>

          <View style={[styles.infoRowBox, isLight && styles.infoRowBoxLight]}>
            <Text style={[styles.infoRow, isLight && styles.infoRowLight]}>• Takes about 8–12 minutes</Text>
            <Text style={[styles.infoRow, isLight && styles.infoRowLight]}>• Quick multiple choice</Text>
          </View>

          <TouchableOpacity onPress={() => router.replace('/placement/test')} activeOpacity={0.9}>
            <Animated.View style={{ transform: [{ scale: pulse }] }}>
              <LinearGradient
                colors={isLight ? ['#F8B070', '#F2935C'] : ['#7CE7A0', '#1a8d87']}
                start={{x:0,y:0}}
                end={{x:1,y:1}}
                style={styles.cta}
              >
                <Text style={styles.ctaText}>Start Test</Text>
              </LinearGradient>
            </Animated.View>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => router.push('/quiz/level-select')}
            activeOpacity={0.9}
            style={[styles.skipBtn, isLight && styles.skipBtnLight]}
          >
            <Text style={[styles.skipLabel, isLight && styles.skipLabelLight]}>Choose your level</Text>
          </TouchableOpacity>
        </Animated.View>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#121315',
  },
  containerLight: {
    backgroundColor: '#F8F8F8',
  },
  safe: {
    flex: 1,
    padding: 20,
  },
  header: {
    alignItems: 'center',
    marginBottom: 8,
  },
  headerTitle: {
    color: '#E5E7EB',
    fontSize: 17,
    fontWeight: '800',
  },
  headerTitleLight: {
    color: '#111827',
  },
  lottieWrap: {
    alignItems: 'center',
    marginVertical: 16,
  },
  lottie: {
    width: 220,
    height: 220,
  },
  card: {
    backgroundColor: '#1E2124',
    borderRadius: 22,
    padding: 22,
    borderWidth: 1,
    borderColor: '#2A3033',
    shadowColor: '#000',
    shadowOpacity: 0.25,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 8 },
    elevation: 8,
  },
  cardLight: {
    backgroundColor: '#FFFFFF',
    borderColor: '#E5DED3',
    shadowOpacity: 0.1,
  },
  title: {
    color: '#E5E7EB',
    fontSize: 24,
    fontWeight: '900',
    marginBottom: 6,
  },
  titleLight: {
    color: '#111827',
  },
  subtitle: {
    color: '#9CA3AF',
    fontSize: 15,
    lineHeight: 22,
    marginBottom: 14,
  },
  subtitleLight: {
    color: '#6B7280',
  },
  infoRowBox: {
    backgroundColor: '#262D30',
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: '#353D42',
  },
  infoRowBoxLight: {
    backgroundColor: '#FBF8F4',
    borderColor: '#E5DED3',
  },
  infoRow: {
    color: '#D1D5DB',
    fontSize: 14,
    marginVertical: 3,
    fontWeight: '500',
  },
  infoRowLight: {
    color: '#4B5563',
  },
  cta: {
    marginTop: 20,
    paddingVertical: 16,
    borderRadius: 14,
    alignItems: 'center',
    shadowColor: '#7CE7A0',
    shadowOpacity: 0.3,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 6 },
  },
  ctaText: {
    color: '#0D1117',
    fontWeight: '900',
    fontSize: 17,
  },
  skipBtn: {
    marginTop: 14,
    alignItems: 'center',
    paddingVertical: 14,
    borderRadius: 14,
    backgroundColor: '#262D30',
    borderWidth: 1,
    borderColor: '#353D42',
  },
  skipBtnLight: {
    backgroundColor: '#F3F0EB',
    borderColor: '#E5DED3',
  },
  skipLabel: {
    color: '#E5E7EB',
    fontWeight: '700',
    fontSize: 15,
  },
  skipLabelLight: {
    color: '#374151',
  },
});

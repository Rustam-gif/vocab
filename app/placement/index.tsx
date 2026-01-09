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
          <Text style={[styles.title, isLight && styles.titleLight]}>Quick Assessment</Text>
          <Text style={[styles.subtitle, isLight && styles.subtitleLight]}>Let's find your vocabulary level.</Text>

          <View style={[styles.infoRowBox, isLight && styles.infoRowBoxLight]}>
            <Text style={[styles.infoRow, isLight && styles.infoRowLight]}>• Takes about 1–2 minutes</Text>
            <Text style={[styles.infoRow, isLight && styles.infoRowLight]}>• Swipe words you know</Text>
          </View>

          <TouchableOpacity onPress={() => router.replace('/placement/level-select')} activeOpacity={0.9}>
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
            onPress={() => router.replace('/quiz/level-select')}
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
    backgroundColor: '#1E1E1E',
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
    color: '#fff',
    fontSize: 17,
    fontWeight: '600',
    fontFamily: 'Ubuntu-Medium',
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
    backgroundColor: '#2A2D2D',
    borderRadius: 16,
    padding: 22,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.06)',
  },
  cardLight: {
    backgroundColor: '#FFFFFF',
    borderColor: '#E5E7EB',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  title: {
    color: '#fff',
    fontSize: 24,
    fontWeight: '600',
    marginBottom: 6,
    fontFamily: 'Ubuntu-Medium',
  },
  titleLight: {
    color: '#111827',
  },
  subtitle: {
    color: '#9CA3AF',
    fontSize: 15,
    lineHeight: 22,
    marginBottom: 14,
    fontFamily: 'Ubuntu-Medium',
  },
  subtitleLight: {
    color: '#6B7280',
  },
  infoRowBox: {
    backgroundColor: 'rgba(67, 127, 118, 0.15)',
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: 'rgba(67, 127, 118, 0.3)',
  },
  infoRowBoxLight: {
    backgroundColor: 'rgba(67, 127, 118, 0.08)',
    borderColor: 'rgba(67, 127, 118, 0.2)',
  },
  infoRow: {
    color: '#D1D5DB',
    fontSize: 14,
    marginVertical: 3,
    fontWeight: '500',
    fontFamily: 'Ubuntu-Medium',
  },
  infoRowLight: {
    color: '#4B5563',
  },
  cta: {
    marginTop: 20,
    paddingVertical: 16,
    borderRadius: 14,
    alignItems: 'center',
  },
  ctaText: {
    color: '#0D1117',
    fontWeight: '600',
    fontSize: 17,
    fontFamily: 'Ubuntu-Medium',
  },
  skipBtn: {
    marginTop: 14,
    alignItems: 'center',
    paddingVertical: 14,
    borderRadius: 14,
    backgroundColor: 'transparent',
    borderWidth: 1.5,
    borderColor: '#437F76',
  },
  skipBtnLight: {
    backgroundColor: 'rgba(67, 127, 118, 0.08)',
    borderColor: '#437F76',
  },
  skipLabel: {
    color: '#437F76',
    fontWeight: '600',
    fontSize: 15,
    fontFamily: 'Ubuntu-Medium',
  },
  skipLabelLight: {
    color: '#437F76',
  },
});

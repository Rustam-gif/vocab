import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Animated, Easing } from 'react-native';
import { LinearGradient } from '../../lib/LinearGradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useAppStore } from '../../lib/store';

export default function PlacementIntro() {
  const router = useRouter();
  const themeName = useAppStore(s => s.theme);
  const isLight = themeName === 'light';
  const pulse = useRef(new Animated.Value(1)).current;
  const float = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, { toValue: 1.06, duration: 700, easing: Easing.out(Easing.quad), useNativeDriver: true }),
        Animated.timing(pulse, { toValue: 1, duration: 700, easing: Easing.inOut(Easing.quad), useNativeDriver: true }),
      ])
    ).start();
    Animated.loop(
      Animated.sequence([
        Animated.timing(float, { toValue: 1, duration: 1600, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
        Animated.timing(float, { toValue: 0, duration: 1600, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
      ])
    ).start();
  }, [pulse, float]);

  const floatTranslate = float.interpolate({ inputRange: [0, 1], outputRange: [0, -8] });

  return (
    <SafeAreaView style={[styles.container, isLight && styles.containerLight]}>
      <Animated.View style={[styles.card, { transform: [{ translateY: floatTranslate }] }]}>
        <Text style={styles.title}>Placement Test</Text>
        <Text style={styles.subtitle}>Find your level so practice fits you.</Text>
        <View style={styles.infoRowBox}>
          <Text style={styles.infoRow}>• Takes about 8–12 minutes</Text>
          <Text style={styles.infoRow}>• Quick multiple choice</Text>
        </View>
        <TouchableOpacity onPress={() => router.replace('/placement/test')} activeOpacity={0.9}>
          <Animated.View style={{ transform: [{ scale: pulse }] }}>
            <LinearGradient colors={['#7CE7A0', '#1a8d87']} start={{x:0,y:0}} end={{x:1,y:1}} style={styles.cta}>
              <Text style={styles.ctaText}>Start Test</Text>
            </LinearGradient>
          </Animated.View>
        </TouchableOpacity>
        <TouchableOpacity
          onPress={() => router.replace('/')}
          activeOpacity={0.9}
          style={[styles.skipBtn, isLight && styles.skipBtnLight]}
        >
          <Text style={[styles.skipLabel, isLight && styles.skipLabelLight]}>Skip for now</Text>
        </TouchableOpacity>
      </Animated.View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0b1424', padding: 20, justifyContent: 'center' },
  containerLight: { backgroundColor: '#0b1424' },
  card: { backgroundColor: 'rgba(12,20,36,0.95)', borderRadius: 22, padding: 22, borderWidth: StyleSheet.hairlineWidth, borderColor: '#1f2b40', shadowColor: '#000', shadowOpacity: 0.45, shadowRadius: 18, shadowOffset: { width: 0, height: 14 }, elevation: 10 },
  title: { color: '#E6EDF7', fontSize: 24, fontWeight: '900', marginBottom: 6 },
  subtitle: { color: '#AFC3E3', fontSize: 14, lineHeight: 20, marginBottom: 10 },
  infoRowBox: { backgroundColor: '#16243a', borderRadius: 12, padding: 12, borderWidth: StyleSheet.hairlineWidth, borderColor: '#24344f' },
  infoRow: { color: '#C7D7F0', fontSize: 13, marginVertical: 2 },
  cta: { marginTop: 18, paddingVertical: 14, borderRadius: 14, alignItems: 'center', shadowColor: '#7CE7A0', shadowOpacity: 0.35, shadowRadius: 16, shadowOffset: { width: 0, height: 8 } },
  ctaText: { color: '#0b1a2d', fontWeight: '900', fontSize: 16 },
  skipBtn: { marginTop: 12, alignItems: 'center', paddingVertical: 10, borderRadius: 12, borderWidth: StyleSheet.hairlineWidth, borderColor: '#3d474b' },
  skipLabel: { color: '#E5E7EB', fontWeight: '700' },
});

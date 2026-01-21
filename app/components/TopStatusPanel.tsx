import React, { useMemo, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Animated, DeviceEventEmitter } from 'react-native';
import LottieView from 'lottie-react-native';
import { Repeat2 } from 'lucide-react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAppStore } from '../../lib/store';
import { getTheme } from '../../lib/theme';
import ProgressPill from '../../components/ProgressPill';

type TopStatusPanelProps = {
  floating?: boolean;
  scrolled?: boolean;
  onHeight?: (height: number) => void;
  isPreview?: boolean;
  includeTopInset?: boolean;
  style?: any;
};

export default function TopStatusPanel({
  floating = false,
  scrolled = false,
  onHeight,
  isPreview = false,
  includeTopInset = false,
  style,
}: TopStatusPanelProps) {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const theme = useAppStore(s => s.theme);
  const userProgress = useAppStore(s => s.userProgress);
  const colors = getTheme(theme);
  const isLight = theme === 'light';
  const streak = useMemo(() => userProgress?.streak || 0, [userProgress?.streak]);

  const translateScale = useRef(new Animated.Value(1)).current;

  const pressIn = (v: Animated.Value) => {
    try {
      Animated.spring(v, { toValue: 0.96, useNativeDriver: true, friction: 7, tension: 280 }).start();
    } catch {}
  };
  const pressBounce = (v: Animated.Value) => {
    try {
      Animated.sequence([
        Animated.spring(v, { toValue: 1.05, useNativeDriver: true, friction: 6, tension: 180 }),
        Animated.spring(v, { toValue: 1, useNativeDriver: true, friction: 7, tension: 140 }),
      ]).start();
    } catch {
      try { v.setValue(1); } catch {}
    }
  };

  return (
    <View
      onLayout={e => onHeight?.(e.nativeEvent.layout.height)}
      style={[
        styles.outerContainer,
        floating && styles.floating,
        style,
      ]}
    >
      {scrolled && (
        <View
          style={[
            styles.solidBackground,
            { backgroundColor: isLight ? '#FFFFFF' : '#0D1B2A' },
          ]}
        />
      )}



      {/* Content */}
      <View
        style={[
          styles.container,
          { paddingTop: (includeTopInset ? insets.top : 10) },
        ]}
      >
        <View style={styles.row}>
        <View style={[styles.streakPill, isLight && styles.streakPillLight]}>
          {isPreview ? (
            <Text style={[styles.streakText, isLight && styles.streakTextLight]}>🔥 {streak}</Text>
          ) : (
            <>
              <LottieView source={require('../../assets/lottie/flame.json')} autoPlay loop style={{ width: 18, height: 18, marginRight: 6 }} />
              <Text style={[styles.streakText, isLight && styles.streakTextLight]}>{streak}</Text>
            </>
          )}
        </View>

        <View style={styles.rightRow}>
          <Animated.View style={{ transform: [{ scale: translateScale }] }}>
            <TouchableOpacity
              style={[styles.translateBtn, isLight && styles.translateBtnLight]}
              onPress={() => {
                try {
                  DeviceEventEmitter.emit('OPEN_TRANSLATE_OVERLAY');
                } catch {
                  router.push('/translate');
                }
              }}
              onPressIn={() => pressIn(translateScale)}
              onPressOut={() => pressBounce(translateScale)}
              activeOpacity={0.9}
              accessibilityLabel="Translate"
            >
              <Repeat2 size={14} color="#FFFFFF" />
            </TouchableOpacity>
          </Animated.View>

          <ProgressPill />
        </View>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  outerContainer: {
    width: '100%',
    alignSelf: 'stretch',
  },
  solidBackground: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  container: {
    width: '100%',
    paddingHorizontal: 16,
    paddingBottom: 8,
    alignSelf: 'stretch',
  },
  floating: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 10,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 0,
  },
  streakPill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 16,
    minHeight: 26,
    backgroundColor: '#243B53',
    borderWidth: 2,
    borderColor: '#0D1B2A',
    shadowColor: '#000',
    shadowOffset: { width: 1, height: 2 },
    shadowOpacity: 0.4,
    shadowRadius: 0,
    elevation: 3,
  },
  streakPillLight: { backgroundColor: '#FFF7ED', borderColor: '#E5E7EB', shadowOpacity: 0.15, shadowColor: '#9CA3AF' },
  streakText: { color: '#FFFFFF', fontWeight: '700', fontSize: 14, fontFamily: 'Ubuntu-Bold' },
  streakTextLight: { color: '#0D3B4A' },
  rightRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  translateBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    minHeight: 30,
    backgroundColor: '#F25E86',
    borderWidth: 2,
    borderColor: '#0D1B2A',
    shadowColor: '#000',
    shadowOffset: { width: 1, height: 2 },
    shadowOpacity: 0.4,
    shadowRadius: 0,
    elevation: 3,
  },
  translateBtnLight: { backgroundColor: '#F25E86', borderColor: '#C94A6E', shadowOpacity: 0.2, shadowColor: '#C94A6E' },
});

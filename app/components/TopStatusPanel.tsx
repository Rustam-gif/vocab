import React, { useEffect, useMemo, useRef, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Animated, DeviceEventEmitter } from 'react-native';
import LottieView from 'lottie-react-native';
import { Repeat2, Crown } from 'lucide-react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAppStore } from '../../lib/store';
import { getTheme } from '../../lib/theme';
import SubscriptionService from '../../services/SubscriptionService';

type TopStatusPanelProps = {
  floating?: boolean;
  scrolled?: boolean;
  onHeight?: (height: number) => void;
  isPreview?: boolean;
  includeTopInset?: boolean;
  style?: any;
};

const OFFER_KEY = '@engniter.offer.expiry';

type OfferState = { expiry: number | null; countdown: string };
const offerListeners = new Set<(s: OfferState) => void>();
const offerCache: OfferState = { expiry: null, countdown: '0:00' };
let offerTimer: NodeJS.Timeout | null = null;

const notifyOffer = (state: OfferState) => {
  offerCache.expiry = state.expiry;
  offerCache.countdown = state.countdown;
  offerListeners.forEach(cb => cb(state));
};

const formatCountdown = (expiry: number | null): string => {
  if (!expiry) return '0:00';
  const now = Date.now();
  const diff = Math.max(0, expiry - now);
  const h = Math.floor(diff / 3600000);
  const m = Math.floor((diff % 3600000) / 60000);
  const s = Math.floor((diff % 60000) / 1000);
  const pad = (n: number) => String(n).padStart(2, '0');
  return h > 0 ? `${h}:${pad(m)}:${pad(s)}` : `${m}:${pad(s)}`;
};

const ensureOfferTick = () => {
  if (offerTimer) return;
  offerTimer = setInterval(() => {
    if (!offerCache.expiry) return;
    notifyOffer({ expiry: offerCache.expiry, countdown: formatCountdown(offerCache.expiry) });
  }, 1000);
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

  const [offerExpiry, setOfferExpiry] = useState<number | null>(offerCache.expiry);
  const [offerCountdown, setOfferCountdown] = useState<string>(offerCache.countdown || '0:00');
  const offerActive = !!(offerExpiry && offerExpiry > Date.now());

  const translateScale = useRef(new Animated.Value(1)).current;
  const proScale = useRef(new Animated.Value(1)).current;

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

  useEffect(() => {
    const listener = (state: OfferState) => {
      setOfferExpiry(state.expiry);
      setOfferCountdown(state.countdown);
    };
    offerListeners.add(listener);
    // Sync immediately from cache
    listener(offerCache);
    if (!offerCache.expiry) {
      (async () => {
        try {
          const stored = await AsyncStorage.getItem(OFFER_KEY);
          const now = Date.now();
          let expiry = stored ? Number(stored) : 0;
          if (!expiry || Number.isNaN(expiry)) {
            expiry = now + 3600 * 1000; // first-time device offer: 1 hour from first launch
            await AsyncStorage.setItem(OFFER_KEY, String(expiry));
          }
          notifyOffer({ expiry, countdown: formatCountdown(expiry) });
          ensureOfferTick();
        } catch {}
      })();
    } else {
      ensureOfferTick();
    }
    return () => {
      offerListeners.delete(listener);
    };
  }, []);

  const startOfferPurchase = async () => {
    try {
      await SubscriptionService.initialize();
      const primarySku = 'com.royal.vocadoo.premium.anually';
      const fallbackSku = 'com.royal.vocadoo.premium.annually';
      let status = await SubscriptionService.purchase(primarySku);
      if (!status?.active) status = await SubscriptionService.purchase(fallbackSku);
      return status;
    } catch (e) {
      try { console.warn('offer purchase failed', e); } catch {}
      return null;
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
            { backgroundColor: isLight ? '#FFFFFF' : '#121315' },
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

          <Animated.View style={{ transform: [{ scale: proScale }] }}>
            {offerActive ? (
              <TouchableOpacity
                style={[styles.offerBtn]}
                onPress={startOfferPurchase}
                onPressIn={() => pressIn(proScale)}
                onPressOut={() => pressBounce(proScale)}
                activeOpacity={0.9}
              >
                <Text style={styles.offerBtnText}>
                  {offerCountdown ? `Get 70% · ${offerCountdown}` : 'Get 70% Off'}
                </Text>
              </TouchableOpacity>
            ) : (
              <TouchableOpacity
                style={[styles.subBtn, isLight && styles.subBtnLight]}
                onPress={() => router.push('/profile?paywall=1')}
                onPressIn={() => pressIn(proScale)}
                onPressOut={() => pressBounce(proScale)}
                activeOpacity={0.9}
              >
                <Crown size={16} color="#1A1A1A" />
                <Text style={styles.subBtnText}>Pro</Text>
              </TouchableOpacity>
            )}
          </Animated.View>
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
    backgroundColor: '#2A2D2E',
    borderWidth: 2,
    borderColor: '#1A1A1A',
    shadowColor: '#000',
    shadowOffset: { width: 1, height: 2 },
    shadowOpacity: 0.4,
    shadowRadius: 0,
    elevation: 3,
  },
  streakPillLight: { backgroundColor: '#FFF7ED', borderColor: '#1A1A1A' },
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
    borderColor: '#1A1A1A',
    shadowColor: '#000',
    shadowOffset: { width: 1, height: 2 },
    shadowOpacity: 0.4,
    shadowRadius: 0,
    elevation: 3,
  },
  translateBtnLight: { backgroundColor: '#F25E86', borderColor: '#1A1A1A' },
  subBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    minHeight: 30,
    backgroundColor: '#4ED9CB',
    borderWidth: 2,
    borderColor: '#1A1A1A',
    shadowColor: '#000',
    shadowOffset: { width: 1, height: 2 },
    shadowOpacity: 0.4,
    shadowRadius: 0,
    elevation: 3,
  },
  subBtnLight: { backgroundColor: '#4ED9CB', borderColor: '#1A1A1A' },
  subBtnText: { color: '#1A1A1A', fontWeight: '700', fontSize: 14, fontFamily: 'Ubuntu-Bold' },
  offerBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    minHeight: 24,
    backgroundColor: '#F8B070',
    borderWidth: 2,
    borderColor: '#1A1A1A',
    shadowColor: '#000',
    shadowOffset: { width: 1, height: 2 },
    shadowOpacity: 0.4,
    shadowRadius: 0,
    elevation: 3,
  },
  offerBtnText: { color: '#1A1A1A', fontWeight: '700', fontSize: 11, fontFamily: 'Ubuntu-Bold' },
});

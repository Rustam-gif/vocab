import React, { useMemo, useRef, useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Dimensions, NativeScrollEvent, NativeSyntheticEvent, Animated, ScrollView, Image, TextInput, Linking, DeviceEventEmitter } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import LottieView from 'lottie-react-native';
import { Check } from 'lucide-react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAppStore } from '../../lib/store';
import { LANGUAGES_WITH_FLAGS } from '../../lib/languages';
import { useRouter } from 'expo-router';
import SubscriptionService from '../../services/SubscriptionService';

type Props = {
  visible: boolean;
  onClose: (next?: 'placement' | 'profile') => void;
  theme: 'light' | 'dark';
};

const { width, height } = Dimensions.get('window');

export default function OnboardingModal({ visible, onClose, theme }: Props) {
  const isLight = theme === 'light';
  const setTheme = useAppStore(s => s.setTheme);
  const router = useRouter();
  const PRACTICE_KEY = '@engniter.practice.minutes';
  const pages = useMemo(() => [
    {
      title: 'Tired of forgetting new words?',
      body: 'You meet them today, they’re gone tomorrow. Vocadoo is here to change that.',
      lottie: require('../../assets/lottie/Onboarding/1.json'),
    },
    {
      title: 'Welcome to Vocadoo',
      body: 'Save the words that matter and we’ll turn them into quick, focused practice.',
      lottie: require('../../assets/lottie/Onboarding/2.json'),
    },
    {
      title: 'Learn Through Stories',
      body: 'Vocadoo builds short stories from your words so they feel natural, not forced.',
      // Replace icon with Lottie book animation
      lottie: require('../../assets/lottie/Onboarding/Girl tapping phone.json'),
    },
    {
      title: 'Save Words in Seconds',
      body: 'Tap once, get meaning, example, and translation. No more juggling tabs.',
      lottie: require('../../assets/lottie/Onboarding/SaveWords.json'),
    },
    {
      title: 'Track Progress',
      body: 'Streaks, stats, and levels show your vocabulary growing day by day.',
      // Replace icon with Lottie analytics animation
      lottie: require('../../assets/lottie/Onboarding/Scrolling.json'),
    },
    {
      title: 'Choose Your Look',
      body: 'Light or Dark — pick what feels good for your eyes and your mood.',
      lottie: require('../../assets/lottie/Onboarding/Togglemode.json'),
      type: 'theme' as const,
    },
    {
      title: 'Pick Your Language',
      body: 'Choose your language and we’ll translate while you learn.',
      lottie: require('../../assets/lottie/Onboarding/LanguageTranslator.json'),
      type: 'lang' as const,
    },
    {
      title: 'Set a Tiny Daily Goal',
      body: 'Even 5 minutes a day works. Choose a time and we’ll build around it.',
      image: undefined as any,
      type: 'time' as const,
    },
    {
      title: 'Unlock 70% Off',
      body: 'Yearly plan now 70% off. Keep your streak and words growing.',
      lottie: require('../../assets/lottie/Onboarding/Gift.json'),
      type: 'subscribe' as const,
    },
  ], []);

  const [index, setIndex] = useState(0);
  // Track which pages already played their animation so we don't replay
  const playedRef = useRef<Record<number, boolean>>({});
  const playCountsRef = useRef<Record<number, number>>({});
  const lottieRefs = useRef<Record<number, any>>({});
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

  // Theme preview state (independent of current app theme while selecting)
  // IMPORTANT: declare hooks before any conditional return to keep hook order stable
  const [previewTheme, setPreviewTheme] = useState<'light' | 'dark'>(isLight ? 'light' : 'dark');
  const previewIsLight = previewTheme === 'light';
  const previewScale = useRef(new Animated.Value(1)).current;
  const [langSearch, setLangSearch] = useState('');
  const selectedLangs = useAppStore(s => s.languagePreferences);
  const [minutes, setMinutes] = useState<number>(10);
  const [countdown, setCountdown] = useState(3600); // 1 hour in seconds
  const [showSubscribeModal, setShowSubscribeModal] = useState(false);
  const [isPurchasing, setIsPurchasing] = useState(false);
  const [annualPriceOriginal, setAnnualPriceOriginal] = useState<string | null>(null);
  const [annualPriceDisplay, setAnnualPriceDisplay] = useState<string | null>(null);
  const timeOptions = [5, 10, 15, 20] as const;
  const timeScales = useRef<Record<number, Animated.Value>>({ 5: new Animated.Value(1), 10: new Animated.Value(1), 15: new Animated.Value(1), 20: new Animated.Value(1) }).current;
  // Expanded catalog (>=150 languages)
  const LANGS = useMemo(() => LANGUAGES_WITH_FLAGS, []);
  const filteredLangs = useMemo(() => {
    const q = langSearch.trim().toLowerCase();
    if (!q) return LANGS;
    return LANGS.filter(l => `${l.name} ${l.code}`.toLowerCase().includes(q));
  }, [LANGS, langSearch]);
  // Prefetch price once and also when modal becomes visible (for safety)
  useEffect(() => {
    if (!annualPriceDisplay && !annualPriceOriginal) {
      loadAnnualPrice();
    }
  }, [annualPriceDisplay, annualPriceOriginal]);

  useEffect(() => {
    if (visible && !annualPriceDisplay && !annualPriceOriginal) {
      loadAnnualPrice();
    }
  }, [visible, annualPriceDisplay, annualPriceOriginal]);
  const [annualPrice, setAnnualPrice] = useState<string | null>(null);

  const loadAnnualPrice = async () => {
    try {
      await SubscriptionService.initialize();
      const primarySku = 'com.royal.vocadoo.premium.anually';
      const fallbackSku = 'com.royal.vocadoo.premium.annually';
      const products = await SubscriptionService.getProducts([primarySku, fallbackSku]);
      const product = products.find(p => p.id === primarySku || p.id === fallbackSku) || products[0];
      if (!product) return;
      if (product.localizedPrice) {
        setAnnualPriceOriginal(product.localizedPrice);
      }
      const priceNumber = typeof product.price === 'string' ? Number(product.price.replace(/[^\d.]/g, '')) : Number(product.price);
      if (!isNaN(priceNumber) && priceNumber > 0) {
        const discounted = priceNumber * 0.3; // 70% off -> pay 30%
        const fmt = new Intl.NumberFormat(undefined, {
          style: 'currency',
          currency: product.currency || 'USD',
          minimumFractionDigits: 2,
        });
        setAnnualPriceDisplay(fmt.format(discounted));
      } else if (product.localizedPrice) {
        setAnnualPriceDisplay(product.localizedPrice);
      }
    } catch (e) {
      try { console.warn('loadAnnualPrice failed', e); } catch {}
    }
  };

  const purchaseAnnual = async () => {
    if (isPurchasing) return;
    setIsPurchasing(true);
    try {
      await SubscriptionService.initialize();
      const primarySku = 'com.royal.vocadoo.premium.anually';
      const fallbackSku = 'com.royal.vocadoo.premium.annually';
      try {
        const products = await SubscriptionService.getProducts([primarySku, fallbackSku]);
        const product = products.find(p => p.id === primarySku || p.id === fallbackSku);
        if (product?.localizedPrice) setAnnualPrice(product.localizedPrice);
        if (product?.price) {
          setAnnualPriceOriginal(product.localizedPrice || String(product.price));
          const p = typeof product.price === 'string' ? parseFloat(product.price.replace(/[^\d.]/g, '')) : Number(product.price);
          if (!isNaN(p)) {
            const discounted = p * 0.3; // 70% off => pay 30%
            const fmt = new Intl.NumberFormat(undefined, { style: 'currency', currency: product.currency || 'USD', minimumFractionDigits: 2 });
            setAnnualPrice(fmt.format(discounted));
            setAnnualPriceDisplay(fmt.format(discounted));
          }
        }
      } catch {}
      let status = await SubscriptionService.purchase(primarySku);
      if (!status?.active) {
        status = await SubscriptionService.purchase(fallbackSku);
      }
      return status;
    } catch (e) {
      try { console.warn('purchase failed', e); } catch {}
      return null;
    } finally {
      setIsPurchasing(false);
    }
  };
  useEffect(() => {
    Animated.sequence([
      Animated.timing(previewScale, { toValue: 0.96, duration: 120, useNativeDriver: true }),
      Animated.timing(previewScale, { toValue: 1, duration: 220, useNativeDriver: true }),
    ]).start();
  }, [previewTheme, previewScale]);

  // Load saved practice duration
  useEffect(() => {
    (async () => {
      try {
        const raw = await AsyncStorage.getItem(PRACTICE_KEY);
        const m = raw ? parseInt(raw, 10) : NaN;
        if (!isNaN(m) && (timeOptions as readonly number[]).includes(m)) setMinutes(m);
      } catch {}
    })();
  }, []);

  useEffect(() => {
    if (!visible) return;
    setCountdown(3600);
    const id = setInterval(() => {
      setCountdown(prev => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(id);
  }, [visible]);

  // Hide global nav while onboarding is visible
  useEffect(() => {
    DeviceEventEmitter.emit('NAV_VISIBILITY', visible ? 'hide' : 'show');
    return () => DeviceEventEmitter.emit('NAV_VISIBILITY', 'show');
  }, [visible]);

  const formatCountdown = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const selectMinutes = async (m: number) => {
    setMinutes(m);
    try { await AsyncStorage.setItem(PRACTICE_KEY, String(m)); } catch {}
    const v = timeScales[m];
    try {
      v.setValue(1);
      Animated.sequence([
        Animated.spring(v, { toValue: 1.08, useNativeDriver: true, friction: 4, tension: 120 }),
        Animated.spring(v, { toValue: 1, useNativeDriver: true, friction: 5, tension: 100 }),
      ]).start();
    } catch {}
  };

  if (!visible) return null;

  const handleLoopFinish = (i: number, maxLoops: number) => {
    const next = (playCountsRef.current[i] ?? 0) + 1;
    playCountsRef.current[i] = next;
    if (next < maxLoops && index === i) {
      requestAnimationFrame(() => {
        const inst = lottieRefs.current[i];
        if (inst?.reset) inst.reset();
        if (inst?.play) inst.play();
      });
      return;
    }
    playedRef.current[i] = true;
  };

  return (
    <View style={[styles.overlay, isLight && styles.overlayLight]}>
      <SafeAreaView style={styles.safe}>
        <View style={styles.header}>
          <View style={{ width: 44 }} />
          <Text style={[styles.headerTitle, isLight && styles.headerTitleLight]}>Getting Started</Text>
          {pages[index]?.type === 'lang' ? (
            <View style={{ width: 44 }} />
          ) : (
            <TouchableOpacity
              onPress={() => {
                // Find the language page index and skip to it if before, otherwise close
                const langPageIndex = pages.findIndex(p => (p as any).type === 'lang');
                if (langPageIndex >= 0 && index < langPageIndex) {
                  pageTo(langPageIndex);
                } else {
                  onClose();
                }
              }}
              style={styles.skipBtn}
            >
              <Text style={[styles.skipText, isLight && styles.skipTextLight]}>Skip</Text>
            </TouchableOpacity>
          )}
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
                if ((p as any).type === 'theme') {
                  const hasPlayed = !!playedRef.current[i];
                  const shouldAuto = index === i && !hasPlayed;
                  return (
                    <Animated.View style={[styles.heroCard, previewIsLight ? styles.heroCardLight : styles.heroCardDark, { transform: [{ scale: Animated.multiply(scale, previewScale) }, { translateY }], opacity }]}>
                      <LottieView
                        ref={ref => { if (ref) lottieRefs.current[i] = ref; }}
                        source={require('../../assets/lottie/Onboarding/Togglemode.json')}
                        autoPlay={shouldAuto}
                        loop={false}
                        progress={shouldAuto ? undefined : hasPlayed ? 1 : 0}
                        onAnimationFinish={() => handleLoopFinish(i, 3)}
                        style={{ width: Math.min(280, width * 0.75), height: Math.min(280, width * 0.75), alignSelf: 'center' }}
                      />
                    </Animated.View>
                  );
                }
                if ((p as any).type === 'lang') {
                  const hasPlayed = !!playedRef.current[i];
                  const shouldAuto = index === i && !hasPlayed;
                  return (
                    <Animated.View style={[styles.heroCard, isLight ? styles.heroCardLight : styles.heroCardDark, { transform: [{ scale }, { translateY }], opacity }]}>
                      {p.lottie ? (
                        <LottieView
                          ref={ref => { if (ref) lottieRefs.current[i] = ref; }}
                          source={p.lottie}
                          autoPlay={shouldAuto}
                          loop={false}
                          progress={shouldAuto ? undefined : hasPlayed ? 1 : 0}
                          onAnimationFinish={() => handleLoopFinish(i, 3)}
                          style={{ width: Math.min(260, width * 0.7), height: Math.min(260, width * 0.7), alignSelf: 'center', marginBottom: 12 }}
                        />
                      ) : null}
                      <View style={{ width: Math.min(360, width * 0.85) }}>
                        <View style={[{ flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 12, paddingVertical: 10, borderRadius: 12, marginBottom: 10 }, isLight ? { backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: '#E5E7EB' } : { backgroundColor: '#2A2D2D', borderWidth: 1, borderColor: 'rgba(255,255,255,0.06)' }]}>
                          <TextInput
                            placeholder="Search language (e.g., Spanish, es)"
                            placeholderTextColor={isLight ? '#9CA3AF' : '#6B7280'}
                            value={langSearch}
                            onChangeText={setLangSearch}
                            style={[{ flex: 1, paddingVertical: 4, height: 36, fontSize: 14, fontFamily: 'Feather-Bold' }, isLight ? { color: '#111827' } : { color: '#FFFFFF' }]}
                            autoCapitalize="none"
                            autoCorrect={false}
                            spellCheck={false}
                            autoComplete="off"
                          />
                        </View>
                        <ScrollView style={{ maxHeight: 180 }} showsVerticalScrollIndicator={false}>
                          {filteredLangs.map(l => {
                            const selected = (selectedLangs || []).includes(l.code);
                            return (
                              <TouchableOpacity
                                key={l.code}
                                style={[
                                  { paddingVertical: 10, paddingHorizontal: 12, borderRadius: 10, marginBottom: 6, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
                                  isLight ? { backgroundColor: selected ? '#FBE8DB' : '#FFFFFF', borderWidth: selected ? 2 : 1, borderColor: selected ? '#F8B070' : '#E5E7EB' } : { backgroundColor: selected ? 'rgba(248,176,112,0.1)' : '#2A2D2D', borderWidth: selected ? 2 : 1, borderColor: selected ? '#F8B070' : 'rgba(255,255,255,0.06)' }
                                ]}
                                onPress={async () => { try { await useAppStore.getState().setLanguagePreferences([l.code]); } catch {} }}
                              >
                                <Text style={[isLight ? { color: '#111827', fontWeight: '600' } : { color: '#FFFFFF', fontWeight: '600' }, { fontFamily: 'Feather-Bold' }]}>{l.flag} {l.name} ({l.code.toUpperCase()})</Text>
                                {selected && <Check size={18} color="#F8B070" />}
                              </TouchableOpacity>
                            );
                          })}
                        </ScrollView>
                      </View>
                    </Animated.View>
                  );
                }
                if ((p as any).type === 'time') {
                  const hasPlayed = !!playedRef.current[i];
                  const shouldAuto = index === i && !hasPlayed;
                  return (
                    <Animated.View style={[styles.heroCard, isLight ? styles.heroCardLight : styles.heroCardDark, { transform: [{ scale }, { translateY }], opacity }]}>
                      <LottieView
                        source={require('../../assets/lottie/Onboarding/Goal Achieved.json')}
                        autoPlay={shouldAuto}
                        loop={false}
                        progress={shouldAuto ? undefined : hasPlayed ? 1 : 0}
                        onAnimationFinish={() => { playedRef.current[i] = true; }}
                        style={{ width: Math.min(260, width * 0.7), height: Math.min(260, width * 0.7), alignSelf: 'center', marginBottom: 12 }}
                      />
                     <View style={styles.timeRow}>
                       {[5,10,15,20].map((m) => {
                         const active = minutes === m;
                         return (
                           <Animated.View key={m} style={{ transform: [{ scale: (timeScales as any)[m] }] }}>
                              <TouchableOpacity
                                style={[styles.timePill, active && styles.timePillActive, isLight && styles.timePillLight]}
                                onPress={() => selectMinutes(m)}
                                activeOpacity={0.9}
                              >
                                <Text style={[styles.timePillText, active && styles.timePillTextActive, isLight && styles.timePillTextLight]}>
                                  {m} min
                                </Text>
                              </TouchableOpacity>
                            </Animated.View>
                          );
                        })}
                      </View>
                      <Text style={[styles.timeHint, isLight && styles.timeHintLight]}>You can change this anytime.</Text>
                    </Animated.View>
                  );
                }
                if ((p as any).type === 'subscribe') {
                  const hasPlayed = !!playedRef.current[i];
                  const shouldAuto = index === i && !hasPlayed;
                  return (
                    <Animated.View style={[styles.heroCard, isLight ? styles.heroCardLight : styles.heroCardDark, { transform: [{ scale }, { translateY }], opacity }]}>
                      {p.lottie ? (
                        <LottieView
                          source={p.lottie}
                          autoPlay={shouldAuto}
                          loop={false}
                          progress={shouldAuto ? undefined : hasPlayed ? 1 : 0}
                          onAnimationFinish={() => { playedRef.current[i] = true; }}
                          style={{ width: Math.min(260, width * 0.7), height: Math.min(260, width * 0.7), alignSelf: 'center', marginBottom: 12 }}
                        />
                      ) : null}
                      <View style={styles.subCard}>
                        <Text style={[styles.subHeadline, isLight && styles.subHeadlineLight]}>70% off yearly</Text>
                        <Text style={[styles.subBody, isLight && styles.subBodyLight]}>
                          Save big: missions, streaks, unlimited saves.
                        </Text>
                        <Text style={[styles.countdownText, isLight && styles.countdownTextLight]}>
                          Offer ends in {formatCountdown(countdown)}
                        </Text>
                        <View style={styles.subBenefits}>
                        <Text style={[styles.subBenefit, isLight && styles.subBenefitLight]}>All missions unlocked</Text>
                        <Text style={[styles.subBenefit, isLight && styles.subBenefitLight]}>Faster XP & streak boosts</Text>
                        <Text style={[styles.subBenefit, isLight && styles.subBenefitLight]}>Vault saves without limits</Text>
                        {annualPriceDisplay && (
                          <View style={styles.priceRow}>
                            {annualPriceOriginal && (
                              <Text style={[styles.oldPrice, isLight && styles.oldPriceLight]}>{annualPriceOriginal} </Text>
                            )}
                            <Text style={[styles.newPrice, isLight && styles.newPriceLight]}>
                              {annualPriceDisplay} · 70% off
                            </Text>
                          </View>
                        )}
                      </View>
                        <TouchableOpacity
                          style={[styles.primaryBtn, styles.subPrimaryBtn, isPurchasing && { opacity: 0.7 }]}
                          activeOpacity={0.9}
                          onPress={async () => {
                            const status = await purchaseAnnual();
                            if (status?.active) {
                              setShowSubscribeModal(false);
                              onClose?.();
                            }
                          }}
                          disabled={isPurchasing}
                        >
                          <Text style={styles.primaryText}>{isPurchasing ? 'Processing…' : 'Get 70% Off'}</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                          style={[styles.subSecondaryBtn]}
                          activeOpacity={0.9}
                          onPress={onClose}
                        >
                          <Text style={styles.subSecondaryText}>Not now</Text>
                        </TouchableOpacity>
	                      </View>
	                    </Animated.View>
	                  );
	                }
	                if ((p as any).type === 'signup') {
	                  const hasPlayed = !!playedRef.current[i];
	                  const shouldAuto = index === i && !hasPlayed;
	                  return (
	                    <Animated.View style={[styles.heroCard, isLight ? styles.heroCardLight : styles.heroCardDark, { transform: [{ scale }, { translateY }], opacity }]}>
	                      {p.lottie ? (
	                        <LottieView
	                          ref={ref => { if (ref) lottieRefs.current[i] = ref; }}
	                          source={p.lottie}
	                          autoPlay={shouldAuto}
	                          loop={false}
	                          progress={shouldAuto ? undefined : hasPlayed ? 1 : 0}
	                          onAnimationFinish={() => handleLoopFinish(i, 3)}
	                          style={{ width: Math.min(300, width * 0.75), height: Math.min(300, width * 0.75) }}
	                        />
	                      ) : null}
	                    </Animated.View>
	                  );
	                }
	                // Default: render hero with Lottie or image
	                return (
	                  <Animated.View style={[styles.heroCard, isLight ? styles.heroCardLight : styles.heroCardDark, { transform: [{ scale }, { translateY }], opacity }]}>
	                    {p.lottie ? (() => {
                      const hasPlayed = !!playedRef.current[i];
                      const shouldAuto = index === i && !hasPlayed;
                      return (
                        <LottieView
                          ref={ref => { if (ref) lottieRefs.current[i] = ref; }}
                          source={p.lottie}
                          autoPlay={shouldAuto}
                          loop={false}
                          progress={shouldAuto ? undefined : hasPlayed ? 1 : 0}
                          onAnimationFinish={() => handleLoopFinish(i, 3)}
                          style={{ width: Math.min(300, width * 0.75), height: Math.min(300, width * 0.75) }}
                        />
                      );
                    })() : p.image ? (
                      <Image
                        source={p.image}
                        style={{ width: Math.min(180, width * 0.45), height: Math.min(180, width * 0.45), resizeMode: 'contain' }}
                      />
                    ) : null}
                  </Animated.View>
                );
              })()}

              {(p as any).type !== 'subscribe' && (
                <>
                  <Text style={[styles.title, isLight && styles.titleLight]}>{p.title}</Text>
                  <Text style={[styles.body, isLight && styles.bodyLight]}>{p.body}</Text>
                </>
              )}
              {(p as any).type === 'signup' && (
                <View style={{ marginTop: 12 }}>
                  <TouchableOpacity
                    style={styles.signupCta}
                    activeOpacity={0.9}
                    onPress={() => {
                      try { onClose('profile'); } catch { onClose(); }
                    }}
                  >
                    <Text style={styles.signupCtaText}>Sign up</Text>
                  </TouchableOpacity>
                  <Text style={[styles.signupHint, isLight && styles.signupHintLight]}>
                    Takes about 1 minute. It is completely free :)
                  </Text>
                </View>
              )}
              {(p as any).type === 'theme' && (
                <View style={styles.themeRow}>
                  <TouchableOpacity
                    style={[styles.themeBtn, previewIsLight && styles.themeBtnActive]}
                    onPress={() => { setPreviewTheme('light'); setTheme('light'); }}
                    activeOpacity={0.9}
                  >
                    <Text style={[styles.themeBtnText, previewIsLight && styles.themeBtnTextActive]}>Light</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.themeBtn, !previewIsLight && styles.themeBtnActive]}
                    onPress={() => { setPreviewTheme('dark'); setTheme('dark'); }}
                    activeOpacity={0.9}
                  >
                    <Text style={[styles.themeBtnText, !previewIsLight && styles.themeBtnTextActive]}>Dark</Text>
                  </TouchableOpacity>
                </View>
              )}
            </View>
          ))}
        </Animated.ScrollView>

        {showSubscribeModal && (
          <View style={styles.subscribeOverlay}>
            <View style={[styles.subscribeCard, isLight && styles.subscribeCardLight]}>
              <TouchableOpacity style={styles.subscribeClose} onPress={() => setShowSubscribeModal(false)}>
                <Text style={[styles.subscribeCloseText, isLight && styles.subscribeCloseTextLight]}>Close</Text>
              </TouchableOpacity>
                <Text style={[styles.subscribeTitle, isLight && styles.subscribeTitleLight]}>Limited 70% Off</Text>
                <Text style={[styles.subscribeSubtitle, isLight && styles.subscribeSubtitleLight]}>
                  Yearly plan now 70% off. Keep missions, streaks, and unlimited saves.
                </Text>
                <View style={styles.subscribeBullets}>
                  <Text style={[styles.subscribeBullet, isLight && styles.subscribeBulletLight]}>• Unlimited stories & translations</Text>
                  <Text style={[styles.subscribeBullet, isLight && styles.subscribeBulletLight]}>• Faster XP and streak boosts</Text>
                  <Text style={[styles.subscribeBullet, isLight && styles.subscribeBulletLight]}>• Cancel anytime</Text>
                  {annualPriceDisplay && (
                    <View style={[styles.priceRow, { marginTop: 6 }]}>
                      {annualPriceOriginal && (
                        <Text style={[styles.oldPrice, isLight && styles.oldPriceLight]}>{annualPriceOriginal}</Text>
                      )}
                      <Text style={[styles.newPrice, isLight && styles.newPriceLight]}>
                        {annualPriceDisplay} · 70% off
                      </Text>
                    </View>
                  )}
                </View>
              <TouchableOpacity
                style={[styles.subscribeCta, isPurchasing && { opacity: 0.7 }]}
                activeOpacity={0.9}
                onPress={async () => {
                  const status = await purchaseAnnual();
                  if (status?.active) {
                    setShowSubscribeModal(false);
                    onClose?.();
                  }
                }}
                disabled={isPurchasing}
              >
                <Text style={styles.subscribeCtaText}>
                  {isPurchasing ? 'Processing…' : 'Subscribe Annual · 70% off'}
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.subscribeSecondary]}
                activeOpacity={0.9}
                onPress={() => setShowSubscribeModal(false)}
              >
                <Text style={styles.subscribeSecondaryText}>Maybe later</Text>
              </TouchableOpacity>
            </View>
        </View>
      )}

        {pages[index]?.type !== 'subscribe' && (
          <View style={styles.footer}>
            <View style={styles.dotsRow}>
              {pages.map((_, i) => (
                <View
                  key={i}
                  style={[styles.dot, i === index ? (isLight ? styles.dotActiveLight : styles.dotActive) : (isLight ? styles.dotLight : styles.dotDark)]}
                />
              ))}
            </View>
            {/* Hide Next on language page until a language is selected */}
            {(pages[index]?.type !== 'lang' || (selectedLangs && selectedLangs.length > 0)) && (
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
            )}
          </View>
        )}
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  overlay: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: '#1E1E1E', zIndex: 9999, elevation: 10 },
  overlayLight: { backgroundColor: '#FFFFFF' },
  safe: { flex: 1 },
  slidePage: { width, paddingHorizontal: 24, alignItems: 'center', justifyContent: 'center', minHeight: height - 220 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 16, paddingTop: 8 },
  headerTitle: { color: '#FFFFFF', fontSize: 20, fontWeight: '700', fontFamily: 'Feather-Bold' },
  headerTitleLight: { color: '#0F172A' },
  skipBtn: { padding: 8, borderRadius: 16 },
  skipText: { color: '#9CA3AF', fontWeight: '600', fontFamily: 'Feather-Bold', fontSize: 15 },
  skipTextLight: { color: '#64748B' },
  heroCard: { width: '100%', alignItems: 'center', justifyContent: 'center', marginTop: 12, marginBottom: 6, borderRadius: 18, paddingVertical: 8 },
  // Remove the white/solid background behind animations to keep it clean
  heroCardLight: { backgroundColor: 'transparent', borderWidth: 0, borderColor: 'transparent' },
  heroCardDark: { backgroundColor: 'transparent', borderWidth: 0, borderColor: 'transparent' },
  themeRow: { flexDirection: 'row', gap: 12, marginTop: 16 },
  themeBtn: { paddingVertical: 12, paddingHorizontal: 24, borderRadius: 24, backgroundColor: '#FFFFFF', borderWidth: 2, borderColor: '#E2E8F0' },
  themeBtnActive: { backgroundColor: '#F25E86', borderColor: '#F25E86' },
  themeBtnText: { color: '#64748B', fontWeight: '700', fontFamily: 'Feather-Bold', fontSize: 16 },
  themeBtnTextActive: { color: '#FFFFFF', fontWeight: '700' },
  previewPhone: { width: Math.min(260, width * 0.7), borderRadius: 22, padding: 12 },
  previewPhoneLight: { backgroundColor: '#F8F8F8' },
  previewPhoneDark: { backgroundColor: '#1E1E1E' },
  previewHeader: { flexDirection: 'row', gap: 6, marginBottom: 10 },
  previewDot: { width: 6, height: 6, borderRadius: 3 },
  previewCard: { borderRadius: 20, padding: 16 },
  previewCardLight: { backgroundColor: '#FFFFFF', borderWidth: 3, borderColor: '#4ED9CB' },
  previewCardDark: { backgroundColor: '#2A2D2D', borderWidth: 2, borderColor: '#4ED9CB' },
  previewTitle: { fontSize: 18, fontWeight: '700', fontFamily: 'Feather-Bold' },
  previewTitleLight: { color: '#0F172A' },
  previewTitleDark: { color: '#FFFFFF' },
  previewBody: { marginTop: 6, fontSize: 14, fontFamily: 'Feather-Bold' },
  previewBodyLight: { color: '#64748B' },
  previewBodyDark: { color: '#9CA3AF' },
  title: { marginTop: 12, fontSize: 26, fontWeight: '700', color: '#FFFFFF', textAlign: 'center', fontFamily: 'Feather-Bold', letterSpacing: -0.5 },
  titleLight: { color: '#0F172A' },
  body: { marginTop: 8, fontSize: 16, color: '#9CA3AF', textAlign: 'center', paddingHorizontal: 12, lineHeight: 24, fontFamily: 'Feather-Bold' },
  bodyLight: { color: '#64748B' },
  footer: { position: 'absolute', left: 0, right: 0, bottom: 24, paddingHorizontal: 16 },
  dotsRow: { flexDirection: 'row', justifyContent: 'center', gap: 8, marginBottom: 14 },
  dot: { width: 8, height: 8, borderRadius: 4 },
  dotDark: { backgroundColor: 'rgba(255,255,255,0.15)' },
  dotLight: { backgroundColor: 'rgba(0,0,0,0.15)' },
  dotActive: { backgroundColor: '#4ED9CB' },
  dotActiveLight: { backgroundColor: '#4ED9CB' },
  btnRow: { flexDirection: 'row', alignItems: 'center' },
  secondaryBtn: { minWidth: 120, paddingVertical: 14, paddingHorizontal: 20, borderRadius: 24, backgroundColor: '#FFFFFF', borderWidth: 2, borderColor: '#4ED9CB', alignItems: 'center' },
  secondaryBtnLight: { backgroundColor: '#FFFFFF', borderColor: '#4ED9CB' },
  secondaryText: { color: '#0F172A', fontWeight: '700', fontFamily: 'Feather-Bold', fontSize: 16 },
  secondaryTextLight: { color: '#0F172A' },
  primaryBtn: { minWidth: 160, paddingVertical: 16, borderRadius: 24, backgroundColor: '#F25E86', alignItems: 'center', shadowColor: '#F25E86', shadowOpacity: 0.3, shadowRadius: 12, shadowOffset: { width: 0, height: 4 }, elevation: 6 },
  primaryText: { color: '#FFFFFF', fontWeight: '700', fontSize: 18, fontFamily: 'Feather-Bold' },
  subPrimaryBtn: { alignSelf: 'stretch', marginTop: 12 },
  // Practice time chips
  timeRow: { flexDirection: 'row', gap: 10, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 12 },
  timePill: { paddingHorizontal: 18, paddingVertical: 12, borderRadius: 24, borderWidth: 2, borderColor: '#E2E8F0', backgroundColor: '#FFFFFF' },
  timePillLight: { backgroundColor: '#FFFFFF', borderColor: '#E2E8F0' },
  timePillActive: { backgroundColor: '#F25E86', borderColor: '#F25E86' },
  timePillText: { color: '#64748B', fontWeight: '700', fontFamily: 'Feather-Bold', fontSize: 15 },
  timePillTextLight: { color: '#64748B' },
  timePillTextActive: { color: '#FFFFFF', fontWeight: '700' },
  timeHint: { marginTop: 12, color: '#9CA3AF', fontSize: 14, fontFamily: 'Feather-Bold' },
  timeHintLight: { color: '#64748B' },
  langChip: { paddingVertical: 12, paddingHorizontal: 16, borderRadius: 16, borderWidth: 2 },
  langChipLight: { backgroundColor: '#FFFFFF', borderColor: '#E2E8F0' },
  langChipDark: { backgroundColor: '#2A2D2D', borderColor: 'rgba(255,255,255,0.06)' },
  langChipText: { color: '#0F172A', fontWeight: '700', fontFamily: 'Feather-Bold', fontSize: 15 },
  subHeadline: { fontSize: 24, fontWeight: '700', color: '#FFFFFF', textAlign: 'center', fontFamily: 'Feather-Bold' },
  subHeadlineLight: { color: '#0F172A' },
  subBody: { fontSize: 16, color: '#9CA3AF', textAlign: 'center', paddingHorizontal: 12, fontFamily: 'Feather-Bold', lineHeight: 24 },
  subBodyLight: { color: '#64748B' },
  countdownText: { fontSize: 18, fontWeight: '700', color: '#4ED9CB', textAlign: 'center', fontFamily: 'Feather-Bold' },
  countdownTextLight: { color: '#4ED9CB' },
  subBenefits: { gap: 6, alignItems: 'center', marginTop: 8, marginBottom: 8 },
  subBenefit: { fontSize: 16, color: '#9CA3AF', fontFamily: 'Feather-Bold' },
  subBenefitLight: { color: '#64748B' },
  subCard: { width: '100%', paddingHorizontal: 18, alignItems: 'center', gap: 6, marginTop: 6 },
  riveBtnWrap: {
    width: 220,
    height: 80,
    alignItems: 'center',
    justifyContent: 'center',
  },
  riveBtnText: {
    position: 'absolute',
    color: '#111827',
    fontWeight: '800',
    fontSize: 15,
  },
  subscribeOverlay: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.45)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  subscribeCard: {
    width: '100%',
    maxWidth: 360,
    borderRadius: 24,
    backgroundColor: '#FFFFFF',
    padding: 24,
    alignItems: 'center',
    borderWidth: 3,
    borderColor: '#4ED9CB',
    shadowColor: '#4ED9CB',
    shadowOpacity: 0.2,
    shadowRadius: 24,
    shadowOffset: { width: 0, height: 8 },
    elevation: 8,
  },
  subscribeCardLight: {
    backgroundColor: '#FFFFFF',
    borderColor: '#4ED9CB',
  },
  subscribeClose: {
    alignSelf: 'flex-end',
    padding: 6,
  },
  subscribeCloseText: {
    color: '#64748B',
    fontWeight: '700',
    fontFamily: 'Feather-Bold',
    fontSize: 15,
  },
  subscribeCloseTextLight: {
    color: '#64748B',
  },
  subscribeTitle: {
    fontSize: 26,
    fontWeight: '700',
    color: '#F25E86',
    textAlign: 'center',
    fontFamily: 'Feather-Bold',
  },
  subscribeTitleLight: {
    color: '#F25E86',
  },
  subscribeSubtitle: {
    marginTop: 12,
    fontSize: 16,
    color: '#64748B',
    textAlign: 'center',
    lineHeight: 24,
    fontFamily: 'Feather-Bold',
  },
  subscribeSubtitleLight: {
    color: '#64748B',
  },
  subscribeBullets: {
    marginTop: 14,
    gap: 6,
    alignSelf: 'stretch',
  },
  subscribeBullet: {
    color: '#64748B',
    fontSize: 16,
    fontFamily: 'Feather-Bold',
  },
  subscribeBulletLight: {
    color: '#64748B',
  },
  subPrice: {
    marginTop: 6,
    fontSize: 16,
    fontWeight: '700',
    color: '#7CE7A0',
  },
  subPriceLight: { color: '#7CE7A0' },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  oldPrice: {
    fontSize: 18,
    color: '#94A3B8',
    textDecorationLine: 'line-through',
    fontFamily: 'Feather-Bold',
  },
  oldPriceLight: { color: '#94A3B8' },
  newPrice: {
    fontSize: 22,
    fontWeight: '700',
    color: '#4ED9CB',
    fontFamily: 'Feather-Bold',
  },
  newPriceLight: { color: '#4ED9CB' },
  subSecondaryBtn: {
    marginTop: 10,
    paddingVertical: 10,
    alignItems: 'center',
  },
  subSecondaryText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#64748B',
    fontFamily: 'Feather-Bold',
  },
  subscribeCta: {
    marginTop: 20,
    backgroundColor: '#F25E86',
    borderRadius: 24,
    paddingVertical: 16,
    paddingHorizontal: 24,
    alignSelf: 'stretch',
    alignItems: 'center',
    shadowColor: '#F25E86',
    shadowOpacity: 0.3,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    elevation: 6,
  },
  subscribeCtaText: {
    fontWeight: '700',
    fontSize: 18,
    color: '#FFFFFF',
    fontFamily: 'Feather-Bold',
  },
  subscribeSecondary: {
    marginTop: 10,
    paddingVertical: 10,
    alignSelf: 'stretch',
    alignItems: 'center',
    borderRadius: 12,
  },
  subscribeSecondaryText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#64748B',
    fontFamily: 'Feather-Bold',
  },
  signupCta: {
    marginTop: 16,
    backgroundColor: '#F25E86',
    borderRadius: 24,
    paddingVertical: 16,
    paddingHorizontal: 24,
    alignSelf: 'stretch',
    alignItems: 'center',
    shadowColor: '#F25E86',
    shadowOpacity: 0.3,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    elevation: 6,
  },
  signupCtaText: {
    fontWeight: '700',
    fontSize: 18,
    color: '#FFFFFF',
    fontFamily: 'Feather-Bold',
  },
  signupHint: {
    marginTop: 10,
    textAlign: 'center',
    fontSize: 14,
    color: '#64748B',
    fontWeight: '600',
    fontFamily: 'Feather-Bold',
  },
  signupHintLight: {
    color: '#64748B',
  },
});

function flagMap(code: string): string {
  const m: Record<string, string> = {
    ru: '🇷🇺', tr: '🇹🇷', uz: '🇺🇿', az: '🇦🇿', kk: '🇰🇿', ar: '🇸🇦', fa: '🇮🇷', de: '🇩🇪', es: '🇪🇸', fr: '🇫🇷', it: '🇮🇹', zh: '🇨🇳', ja: '🇯🇵', ko: '🇰🇷'
  };
  return m[code] || '🌐';
}

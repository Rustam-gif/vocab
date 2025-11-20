import React, { useMemo, useRef, useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Dimensions, NativeScrollEvent, NativeSyntheticEvent, Animated, ScrollView, Image, TextInput, Linking } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import LottieView from 'lottie-react-native';
import { Check } from 'lucide-react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAppStore } from '../../lib/store';
import { LANGUAGES_WITH_FLAGS } from '../../lib/languages';
import NotificationService from '../../services/NotificationService';

type Props = {
  visible: boolean;
  onClose: () => void;
  theme: 'light' | 'dark';
};

const { width, height } = Dimensions.get('window');

export default function OnboardingModal({ visible, onClose, theme }: Props) {
  const isLight = theme === 'light';
  const setTheme = useAppStore(s => s.setTheme);
  const PRACTICE_KEY = '@engniter.practice.minutes';
  const pages = useMemo(() => [
    {
      title: 'Welcome to Vocadoo',
      body: 'Build a powerful vocabulary with bite‑size steps.',
      lottie: require('../../assets/homepageicons/storyexercise_icon2.json'),
    },
    {
      title: 'Create Your Own Stories',
      body: 'Create stories with your own words—one of the best ways to learn.',
      // Replace icon with Lottie book animation
      lottie: require('../../assets/lottie/Book.json'),
    },
    {
      title: 'Save Words Fast',
      body: 'Add a word and let AI suggest definitions and examples.',
      lottie: require('../../assets/homepageicons/vault_icon2.json'),
    },
    {
      title: 'Track Progress',
      body: 'Earn XP, keep streaks, and see words become learned.',
      // Replace icon with Lottie analytics animation
      lottie: require('../../assets/lottie/analytics.json'),
    },
    {
      title: 'Choose Your Look',
      body: 'Pick Light or Dark — you can change it any time.',
      image: undefined as any,
      type: 'theme' as const,
    },
    {
      title: 'Pick Your Language',
      body: 'We can translate words while you learn.',
      image: undefined as any,
      type: 'lang' as const,
    },
    {
      title: 'Daily Practice',
      body: 'Pick a short session length to build a habit.',
      image: undefined as any,
      type: 'time' as const,
    },
    {
      title: 'Stay on Track',
      body: 'Turn on reminders so you never miss your quick practice.',
      image: undefined as any,
      type: 'notif' as const,
    },
  ], []);

  const [index, setIndex] = useState(0);
  // Track which pages already played their animation so we don't replay
  const playedRef = useRef<Record<number, boolean>>({});
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
  // Notification onboarding state
  const [notifBusy, setNotifBusy] = useState(false);
  const [notifEnabled, setNotifEnabled] = useState<boolean | null>(null);
  const timeOptions = [5, 10, 15, 20] as const;
  const timeScales = useRef<Record<number, Animated.Value>>({ 5: new Animated.Value(1), 10: new Animated.Value(1), 15: new Animated.Value(1), 20: new Animated.Value(1) }).current;
  // Expanded catalog (>=150 languages)
  const LANGS = useMemo(() => LANGUAGES_WITH_FLAGS, []);
  const filteredLangs = useMemo(() => {
    const q = langSearch.trim().toLowerCase();
    if (!q) return LANGS;
    return LANGS.filter(l => `${l.name} ${l.code}`.toLowerCase().includes(q));
  }, [LANGS, langSearch]);
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
                if ((p as any).type === 'theme') {
                  return (
                    <Animated.View style={[styles.heroCard, previewIsLight ? styles.heroCardLight : styles.heroCardDark, { transform: [{ scale: Animated.multiply(scale, previewScale) }, { translateY }], opacity }]}>
                      <View style={[styles.previewPhone, previewIsLight ? styles.previewPhoneLight : styles.previewPhoneDark]}>
                        <View style={[styles.previewHeader]}>
                          <View style={[styles.previewDot, { backgroundColor: previewIsLight ? '#D1D5DB' : '#374151' }]} />
                          <View style={[styles.previewDot, { backgroundColor: previewIsLight ? '#D1D5DB' : '#374151' }]} />
                          <View style={[styles.previewDot, { backgroundColor: previewIsLight ? '#D1D5DB' : '#374151' }]} />
                        </View>
                        <View style={[styles.previewCard, previewIsLight ? styles.previewCardLight : styles.previewCardDark]}>
                          <Text style={[styles.previewTitle, previewIsLight ? styles.previewTitleLight : styles.previewTitleDark]}>Theme Preview</Text>
                          <Text style={[styles.previewBody, previewIsLight ? styles.previewBodyLight : styles.previewBodyDark]}>Clean contrast for easy reading</Text>
                        </View>
                      </View>
                    </Animated.View>
                  );
                }
                if ((p as any).type === 'lang') {
                  return (
                    <Animated.View style={[styles.heroCard, isLight ? styles.heroCardLight : styles.heroCardDark, { transform: [{ scale }, { translateY }], opacity }]}>
                      <View style={{ width: Math.min(360, width * 0.85) }}>
                        <View style={[{ flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 12, paddingVertical: 10, borderRadius: 12, marginBottom: 10 }, isLight ? { backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: '#E5DED3' } : { backgroundColor: '#2A3033', borderWidth: 1, borderColor: '#364147' }]}>
                          <TextInput
                            placeholder="Search language (e.g., Spanish, es)"
                            placeholderTextColor={isLight ? '#6B7280' : '#9CA3AF'}
                            value={langSearch}
                            onChangeText={setLangSearch}
                            style={[{ flex: 1, paddingVertical: 4, height: 36, fontSize: 14 }, isLight ? { color: '#111827' } : { color: '#E5E7EB' }]}
                            autoCapitalize="none"
                            autoCorrect
                            spellCheck
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
                                  isLight ? { backgroundColor: selected ? '#FBE8DB' : '#FFFFFF', borderWidth: selected ? 2 : 0, borderColor: '#F8B070' } : { backgroundColor: selected ? '#2A3033' : '#1F2629', borderWidth: selected ? 2 : 0, borderColor: '#F8B070' }
                                ]}
                                onPress={async () => { try { await useAppStore.getState().setLanguagePreferences([l.code]); } catch {} }}
                              >
                                <Text style={isLight ? { color: '#111827', fontWeight: '700' } : { color: '#E5E7EB', fontWeight: '700' }}>{l.flag} {l.name} ({l.code.toUpperCase()})</Text>
                                {selected && <Check size={18} color={isLight ? '#111827' : '#E5E7EB'} />}
                              </TouchableOpacity>
                            );
                          })}
                        </ScrollView>
                      </View>
                    </Animated.View>
                  );
                }
                if ((p as any).type === 'time') {
                  return (
                    <Animated.View style={[styles.heroCard, isLight ? styles.heroCardLight : styles.heroCardDark, { transform: [{ scale }, { translateY }], opacity }]}>
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
                if ((p as any).type === 'notif') {
                  const hasPlayed = !!playedRef.current[i];
                  const shouldAuto = index === i && !hasPlayed;
                  return (
                    <Animated.View style={[styles.heroCard, isLight ? styles.heroCardLight : styles.heroCardDark, { transform: [{ scale }, { translateY }], opacity }]}>
                      <View style={{ alignItems: 'center', gap: 8 }}>
                        <LottieView
                          source={require('../../assets/lottie/bell_notification.json')}
                          autoPlay={shouldAuto}
                          loop={false}
                          progress={shouldAuto ? undefined : hasPlayed ? 1 : 0}
                          onAnimationFinish={() => { playedRef.current[i] = true; }}
                          style={{ width: 200, height: 200 }}
                        />
                        <Text style={[{ color: isLight ? '#374151' : '#E5E7EB', textAlign: 'center', paddingHorizontal: 12 }]}>Get gentle reminders for your {minutes}‑minute practice.</Text>
                        <View style={{ flexDirection: 'row', gap: 10, marginTop: 10 }}>
                          <TouchableOpacity
                            style={[styles.secondaryBtn, isLight && styles.secondaryBtnLight]}
                            onPress={async () => { try { await NotificationService.setSettings({ enabled: false }); } catch {}; setNotifEnabled(false); }}
                          >
                            <Text style={[styles.secondaryText, isLight && styles.secondaryTextLight]}>Not now</Text>
                          </TouchableOpacity>
                          <TouchableOpacity
                            style={styles.primaryBtn}
                            onPress={async () => {
                              if (notifBusy) return;
                              setNotifBusy(true);
                              try {
                                await NotificationService.enable(true);
                                setNotifEnabled(true);
                                try { await NotificationService.openSystemNotificationSettings(); } catch {}
                              } catch {}
                              setNotifBusy(false);
                            }}
                            activeOpacity={0.9}
                          >
                            <Text style={styles.primaryText}>{notifBusy ? 'Enabling…' : (notifEnabled ? 'Enabled' : 'Enable Notifications')}</Text>
                          </TouchableOpacity>
                        </View>
                      </View>
                    </Animated.View>
                  );
                }
                // streak page removed
                return (
                  <Animated.View style={[styles.heroCard, isLight ? styles.heroCardLight : styles.heroCardDark, { transform: [{ scale }, { translateY }], opacity }]}>
                    {p.lottie ? (() => {
                      const hasPlayed = !!playedRef.current[i];
                      const shouldAuto = index === i && !hasPlayed;
                      return (
                        <LottieView
                          source={p.lottie}
                          autoPlay={shouldAuto}
                          loop={false}
                          progress={shouldAuto ? undefined : hasPlayed ? 1 : 0}
                          onAnimationFinish={() => { playedRef.current[i] = true; }}
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
              <Text style={[styles.title, isLight && styles.titleLight]}>{p.title}</Text>
              <Text style={[styles.body, isLight && styles.bodyLight]}>{p.body}</Text>
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
  overlay: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: '#121315', zIndex: 9999, elevation: 10 },
  overlayLight: { backgroundColor: '#F8F8F8' },
  safe: { flex: 1 },
  slidePage: { width, paddingHorizontal: 24, alignItems: 'center', justifyContent: 'center', minHeight: height - 220 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 16, paddingTop: 8 },
  headerTitle: { color: '#E5E7EB', fontSize: 16, fontWeight: '800' },
  headerTitleLight: { color: '#111827' },
  skipBtn: { padding: 8, borderRadius: 10 },
  skipText: { color: '#E5E7EB', fontWeight: '700' },
  skipTextLight: { color: '#374151' },
  heroCard: { width: '100%', alignItems: 'center', justifyContent: 'center', marginTop: 12, marginBottom: 6, borderRadius: 18, paddingVertical: 8 },
  // Remove the white/solid background behind animations to keep it clean
  heroCardLight: { backgroundColor: 'transparent', borderWidth: 0, borderColor: 'transparent' },
  heroCardDark: { backgroundColor: 'transparent', borderWidth: 0, borderColor: 'transparent' },
  themeRow: { flexDirection: 'row', gap: 12, marginTop: 12 },
  themeBtn: { paddingVertical: 10, paddingHorizontal: 18, borderRadius: 999, backgroundColor: '#2A3033', borderWidth: 1, borderColor: '#364147' },
  themeBtnActive: { backgroundColor: '#F8B070', borderColor: '#F8B070' },
  themeBtnText: { color: '#E5E7EB', fontWeight: '700' },
  themeBtnTextActive: { color: '#111827' },
  previewPhone: { width: Math.min(260, width * 0.7), borderRadius: 22, padding: 12 },
  previewPhoneLight: { backgroundColor: '#F8F8F8' },
  previewPhoneDark: { backgroundColor: '#121315' },
  previewHeader: { flexDirection: 'row', gap: 6, marginBottom: 10 },
  previewDot: { width: 6, height: 6, borderRadius: 3 },
  previewCard: { borderRadius: 14, padding: 14 },
  previewCardLight: { backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: '#E5DED3' },
  previewCardDark: { backgroundColor: '#262D30', borderWidth: 1, borderColor: '#30383C' },
  previewTitle: { fontSize: 16, fontWeight: '800' },
  previewTitleLight: { color: '#111827' },
  previewTitleDark: { color: '#FFFFFF' },
  previewBody: { marginTop: 4, fontSize: 12 },
  previewBodyLight: { color: '#374151' },
  previewBodyDark: { color: '#9CA3AF' },
  title: { marginTop: 8, fontSize: 22, fontWeight: '800', color: '#FFFFFF', textAlign: 'center' },
  titleLight: { color: '#111827' },
  body: { marginTop: 6, fontSize: 15, color: '#9CA3AF', textAlign: 'center', paddingHorizontal: 8, lineHeight: 22 },
  bodyLight: { color: '#4B5563' },
  footer: { position: 'absolute', left: 0, right: 0, bottom: 24, paddingHorizontal: 16 },
  dotsRow: { flexDirection: 'row', justifyContent: 'center', gap: 8, marginBottom: 14 },
  dot: { width: 8, height: 8, borderRadius: 4 },
  dotDark: { backgroundColor: '#2F3A40' },
  dotLight: { backgroundColor: '#D7D3CB' },
  dotActive: { backgroundColor: '#F8B070' },
  dotActiveLight: { backgroundColor: '#F8B070' },
  btnRow: { flexDirection: 'row', alignItems: 'center' },
  secondaryBtn: { minWidth: 120, paddingVertical: 12, paddingHorizontal: 16, borderRadius: 12, backgroundColor: '#2A3033', borderWidth: 1, borderColor: '#364147', alignItems: 'center' },
  secondaryBtnLight: { backgroundColor: '#E9E6E0', borderColor: '#D7D3CB' },
  secondaryText: { color: '#E5E7EB', fontWeight: '700' },
  secondaryTextLight: { color: '#374151' },
  primaryBtn: { minWidth: 160, paddingVertical: 14, borderRadius: 12, backgroundColor: '#F8B070', alignItems: 'center' },
  primaryText: { color: '#111827', fontWeight: '800' },
  // Practice time chips
  timeRow: { flexDirection: 'row', gap: 10, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 12 },
  timePill: { paddingHorizontal: 14, paddingVertical: 10, borderRadius: 999, borderWidth: 1, borderColor: '#364147', backgroundColor: '#2A3033' },
  timePillLight: { backgroundColor: '#FFFFFF', borderColor: '#E5DED3' },
  timePillActive: { backgroundColor: '#F8B070', borderColor: '#F8B070' },
  timePillText: { color: '#EAF2F6', fontWeight: '700' },
  timePillTextLight: { color: '#111827' },
  timePillTextActive: { color: '#0D1117' },
  timeHint: { marginTop: 10, color: '#9CA3AF', fontSize: 12 },
  timeHintLight: { color: '#6B7280' },
  langChip: { paddingVertical: 10, paddingHorizontal: 12, borderRadius: 12 },
  langChipLight: { backgroundColor: '#E9E6E0' },
  langChipDark: { backgroundColor: '#2A3033' },
  langChipText: { color: '#111827', fontWeight: '700' },
});

function flagMap(code: string): string {
  const m: Record<string, string> = {
    ru: '🇷🇺', tr: '🇹🇷', uz: '🇺🇿', az: '🇦🇿', kk: '🇰🇿', ar: '🇸🇦', fa: '🇮🇷', de: '🇩🇪', es: '🇪🇸', fr: '🇫🇷', it: '🇮🇹', zh: '🇨🇳', ja: '🇯🇵', ko: '🇰🇷'
  };
  return m[code] || '🌐';
}

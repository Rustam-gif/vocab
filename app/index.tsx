import React, { useEffect, useRef, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Image, Animated, LayoutAnimation, UIManager, Platform, Easing, InteractionManager, Linking } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { Plus, ChevronRight, Camera, Type, Crown, Repeat2, LayoutGrid, List as ListIcon } from 'lucide-react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useAppStore } from '../lib/store';
import { getTheme } from '../lib/theme';
// Removed home card animations — keep navigation-only slide animations
import OnboardingModal from './components/OnboardingModal';
// No focus animation hook needed
import { useRouter } from 'expo-router';
import { Launch } from '../lib/launch';
import LottieView from 'lottie-react-native';
import LimitModal from '../lib/LimitModal';
import { APP_STORE_ID, ANDROID_PACKAGE_NAME } from '../lib/appConfig';
// no screen-focus animations on Home

const SELECTED_LEVEL_KEY = '@engniter.selectedLevel';
const MENU_STYLE_KEY = '@engniter.home.menuStyle'; // 'list' | 'grid'
// Cache the last chosen menu style across Home unmounts to avoid a brief
// default-to-saved flip during navigation (visible behind other screens)
let MENU_STYLE_CACHE: 'list' | 'grid' | null = null;

export default function HomeScreen(props?: { preview?: boolean }) {
  const isPreview = !!(props as any)?.preview;
  const router = useRouter();
  const [storedLevel, setStoredLevel] = useState<string | null>(null);
  const [showOnboarding, setShowOnboarding] = useState(false);
  const theme = useAppStore(s => s.theme);
  const colors = getTheme(theme);
  const userProgress = useAppStore(s => s.userProgress);
  const loadProgress = useAppStore(s => s.loadProgress);
  const insets = useSafeAreaInsets();
  // Home stays mounted even when another screen overlays it via our router.
  // Do not hide it here; RouteRenderer controls visibility to avoid flicker.
  const [showStreakCelebrate, setShowStreakCelebrate] = useState(false);
  const countAnim = useRef(new Animated.Value(0)).current;
  const [displayCount, setDisplayCount] = useState(0);
  // FAB menu
  const [menuOpen, setMenuOpen] = useState(false);
  const menuAnim = useRef(new Animated.Value(0)).current;
  const [menuStyle, setMenuStyle] = useState<'list' | 'grid'>(MENU_STYLE_CACHE ?? 'list');
  const viewModeAnim = useRef(new Animated.Value(1)).current; // bubble pop when switching
  // Replay Lottie icons when toggling between list and grid
  const [iconsTogglePlay, setIconsTogglePlay] = useState(false);
  const [iconsPlayToken, setIconsPlayToken] = useState(0);
  // Daily sign-up nudge
  const user = useAppStore(s => s.user);
  const [showSignupNudge, setShowSignupNudge] = useState(false);
  // Daily rating nudge
  const [showRateNudge, setShowRateNudge] = useState(false);

  // Theme-aware Lottie adjustments (dark mode: lighten + thicken strokes)
  const lottieDarkCache = useRef<WeakMap<any, any>>(new WeakMap()).current;
  const adjustLottieForDark = (src: any) => {
    try {
      const clone = JSON.parse(JSON.stringify(src));
      const lighten = (v: number, amt = 0.25) => Math.max(0, Math.min(1, v + (1 - v) * amt));
      const bumpWidth = (w: any): any => {
        const scale = 1.5; // approx +0.5–1px at 24–32px
        if (typeof w === 'number') return Math.max(0, w * scale);
        if (w && typeof w.k === 'number') return { ...w, k: Math.max(0, w.k * scale) };
        if (w && Array.isArray(w.k)) {
          return {
            ...w,
            k: w.k.map((kf: any) =>
              kf && kf.s && typeof kf.s[0] === 'number'
                ? { ...kf, s: [Math.max(0, kf.s[0] * scale)] }
                : kf
            ),
          };
        }
        return w;
      };
      const lightenColor = (c: any): any => {
        const lift = (arr: number[]) => {
          const [r, g, b, a = 1] = arr;
          return [lighten(r), lighten(g), lighten(b), a];
        };
        if (Array.isArray(c)) return lift(c);
        if (c && Array.isArray(c.k)) {
          // keyframes or direct RGBA
          if (typeof c.k[0] === 'number') return { ...c, k: lift(c.k as number[]) };
          return {
            ...c,
            k: c.k.map((kf: any) =>
              kf && kf.s && Array.isArray(kf.s)
                ? { ...kf, s: lift(kf.s as number[]) }
                : kf
            ),
          };
        }
        if (c && typeof c.k === 'object' && Array.isArray(c.k.s)) {
          return { ...c, k: { ...c.k, s: lightenColor(c.k.s) } };
        }
        return c;
      };
      const visitShapes = (arr: any[]) => {
        if (!Array.isArray(arr)) return;
        arr.forEach((s) => {
          if (!s || typeof s !== 'object') return;
          if (s.ty === 'st') {
            if (s.w !== undefined) s.w = bumpWidth(s.w);
            if (s.c !== undefined) s.c = lightenColor(s.c);
          }
          if (Array.isArray((s as any).it)) visitShapes((s as any).it);
        });
      };
      const visitLayers = (layers: any[]) => {
        if (!Array.isArray(layers)) return;
        layers.forEach((l) => {
          if (Array.isArray(l.shapes)) visitShapes(l.shapes);
        });
      };
      visitLayers(clone.layers || []);
      const assets = clone.assets || [];
      assets.forEach((a: any) => { if (Array.isArray(a.layers)) visitLayers(a.layers); });
      return clone;
    } catch {
      return src;
    }
  };
  const themedLottie = (src: any) => {
    const isLight = theme === 'light';
    if (isLight || !src) return src;
    const cached = lottieDarkCache.get(src);
    if (cached) return cached;
    const adj = adjustLottieForDark(src);
    lottieDarkCache.set(src, adj);
    return adj;
  };

  // Per-tile scale for press bounce
  const tileScales = useRef<Record<string, Animated.Value>>({}).current;
  const getTileScale = (key: string) => {
    if (!tileScales[key]) tileScales[key] = new Animated.Value(1);
    return tileScales[key];
  };
  const pressIn = (key: string) => {
    try { Animated.spring(getTileScale(key), { toValue: 0.96, useNativeDriver: true, friction: 7, tension: 280 }).start(); } catch {}
  };
  const pressBounce = (key: string) => {
    const v = getTileScale(key);
    try {
      Animated.sequence([
        Animated.spring(v, { toValue: 1.05, useNativeDriver: true, friction: 6, tension: 180 }),
        Animated.spring(v, { toValue: 1, useNativeDriver: true, friction: 7, tension: 140 }),
      ]).start();
    } catch {
      try { v.setValue(1); } catch {}
    }
  };

  // Header button scales
  const hdrScaleToggle = getTileScale('hdr:toggle');
  const hdrScaleTranslate = getTileScale('hdr:translate');
  const hdrScalePro = getTileScale('hdr:pro');
  

  // Enable LayoutAnimation on Android
  useEffect(() => {
    if (Platform.OS === 'android' && (UIManager as any).setLayoutAnimationEnabledExperimental) {
      try { (UIManager as any).setLayoutAnimationEnabledExperimental(true); } catch {}
    }
  }, []);

  useEffect(() => {
    (async () => {
      const level = await AsyncStorage.getItem(SELECTED_LEVEL_KEY);
      if (level) setStoredLevel(level);
      const done = await AsyncStorage.getItem('@engniter.onboarding_done_v1');
      setShowOnboarding(!done);
      try {
        const savedStyle = await AsyncStorage.getItem(MENU_STYLE_KEY);
        if (savedStyle === 'grid' || savedStyle === 'list') {
          if (MENU_STYLE_CACHE !== savedStyle) {
            MENU_STYLE_CACHE = savedStyle as 'list' | 'grid';
            setMenuStyle(MENU_STYLE_CACHE);
          } else if (MENU_STYLE_CACHE && menuStyle !== MENU_STYLE_CACHE) {
            // Align state with cache if different
            setMenuStyle(MENU_STYLE_CACHE);
          }
        }
      } catch {}
      try { await loadProgress(); } catch {}
    })();
  }, []);

  // Show a once‑per‑day sign‑up prompt 2 minutes after app launch (only if not signed in)
  useEffect(() => {
    if (isPreview) return;
    let cancelled = false;
    let t: any;
    let unsub: any;
    const schedule = () => {
      // wait 2 minutes after launch completes
      const startTimer = () => {
        try { if (t) clearTimeout(t); } catch {}
        t = setTimeout(async () => {
          if (cancelled) return;
          if (showOnboarding) return; // don't interrupt onboarding
          const u = useAppStore.getState().user;
          if (u && (u as any)?.id) return; // already signed in
          try {
            const today = new Date().toISOString().slice(0,10);
            const key = '@engniter.nudge.signup.date';
            const last = await AsyncStorage.getItem(key);
            if (last !== today) {
              setShowSignupNudge(true);
              await AsyncStorage.setItem(key, today);
            }
          } catch {}
        }, 120000);
      };
      if (Launch.isDone()) startTimer();
      else unsub = Launch.onDone(startTimer);
    };
    // Only schedule if not signed in right now
    if (!(user && (user as any)?.id)) schedule();
    return () => {
      cancelled = true;
      try { if (t) clearTimeout(t); } catch {}
      try { unsub && unsub(); } catch {}
    };
  }, [isPreview, showOnboarding, user && (user as any)?.id]);

  // Show a once‑per‑day rating prompt 3 minutes after launch (don’t stack with sign‑up modal)
  useEffect(() => {
    if (isPreview) return;
    let cancelled = false;
    let t: any;
    let unsub: any;
    const schedule = () => {
      const startTimer = () => {
        try { if (t) clearTimeout(t); } catch {}
        t = setTimeout(async () => {
          if (cancelled) return;
          if (showOnboarding) return;
          if (showSignupNudge) return; // avoid stacking prompts
          try {
            const now = new Date();
            const monthKey = now.toISOString().slice(0,7); // YYYY-MM
            const key = '@engniter.nudge.rate.month';
            const last = await AsyncStorage.getItem(key);
            if (last !== monthKey) {
              setShowRateNudge(true);
              await AsyncStorage.setItem(key, monthKey);
            }
          } catch {}
        }, 180000);
      };
      if (Launch.isDone()) startTimer();
      else unsub = Launch.onDone(startTimer);
    };
    schedule();
    return () => {
      cancelled = true;
      try { if (t) clearTimeout(t); } catch {}
      try { unsub && unsub(); } catch {}
    };
  }, [isPreview, showOnboarding, showSignupNudge]);

  // Derive integer for count animation
  useEffect(() => {
    const id = countAnim.addListener(({ value }) => setDisplayCount(Math.round(value)));
    return () => { try { countAnim.removeListener(id); } catch {} };
  }, [countAnim]);

  // Decide whether to show a daily streak celebration when streak value is available
  useEffect(() => {
    (async () => {
      const streak = Number(userProgress?.streak || 0);
      if (!streak || streak <= 0) return;
      const todayKey = new Date().toISOString().slice(0,10);
      const shown = await AsyncStorage.getItem('@engniter.streak_celebrate_date');
      const lastValRaw = await AsyncStorage.getItem('@engniter.streak_celebrate_value');
      const lastVal = lastValRaw ? Number(lastValRaw) : 0;
      // Show if not shown today AND streak has advanced or we never stored it
      if (shown !== todayKey && streak >= Math.max(1, lastVal)) {
        setShowStreakCelebrate(true);
        countAnim.setValue(0);
        Animated.timing(countAnim, { toValue: streak, duration: 900, useNativeDriver: false }).start();
      }
    })();
  }, [userProgress?.streak]);

  const openMenu = () => {
    setMenuOpen(true);
    try {
      menuAnim.setValue(0);
      Animated.timing(menuAnim, { toValue: 1, duration: 180, useNativeDriver: true }).start();
    } catch {}
  };

  const toggleMenuStyle = async () => {
    const next = menuStyle === 'list' ? 'grid' : 'list';
    // Smooth layout morph
    try {
      LayoutAnimation.configureNext({
        duration: 260,
        update: { type: LayoutAnimation.Types.easeInEaseOut },
        create: { type: LayoutAnimation.Types.easeInEaseOut, property: LayoutAnimation.Properties.opacity },
        delete: { type: LayoutAnimation.Types.easeInEaseOut, property: LayoutAnimation.Properties.opacity },
      });
    } catch {}
    try { viewModeAnim.setValue(0); } catch {}
    Animated.timing(viewModeAnim, { toValue: 1, duration: 260, easing: Easing.out(Easing.cubic), useNativeDriver: true }).start();
    MENU_STYLE_CACHE = next;
    setMenuStyle(next);
    // Trigger a short window where icons re-run their animations and force remount via token
    setIconsTogglePlay(true);
    setIconsPlayToken(t => t + 1);
    setTimeout(() => setIconsTogglePlay(false), 1200);
    try { await AsyncStorage.setItem(MENU_STYLE_KEY, next); } catch {}
  };
  const closeMenu = () => {
    try {
      Animated.timing(menuAnim, { toValue: 0, duration: 140, useNativeDriver: true }).start(() => setMenuOpen(false));
    } catch {
      setMenuOpen(false);
    }
  };

  const handleQuizSession = () => {
    if (storedLevel) {
      router.push(`/quiz/learn?level=${storedLevel}`);
    } else {
      router.push('/quiz/level-select');
    }
  };

  const updateStoredLevel = async () => {
    const level = await AsyncStorage.getItem(SELECTED_LEVEL_KEY);
    if (level) setStoredLevel(level);
  };

  useEffect(() => {
    updateStoredLevel();
  }, []);

  // Organized sections with softer colors
  const accent = '#187486';
  // Use theme background (light: #F8F8F8, dark: #1E1E1E)
  const background = colors.background;

  const sections = [
    {
      title: 'Learning Tools',
      items: [
        {
          title: 'Vault',
          subtitle: 'Manage your vocabulary',
          icon: require('../assets/homepageicons/vault_icon.png'),
          color: accent,
          onPress: () => router.push('/vault'),
        },
        {
          title: 'Quiz Session',
          subtitle: '5-word practice session',
          icon: require('../assets/homepageicons/quizsession_icon.png'),
          color: accent,
          onPress: handleQuizSession,
        },
        {
          title: 'Story Exercise',
          subtitle: 'Fill-in-the-blanks with pill UI',
          icon: require('../assets/homepageicons/storyexercise_icon.png'),
          color: accent,
          onPress: () => router.push('/story/StoryExercise'),
        },
        {
          title: 'IELTS',
          subtitle: 'Writing, Reading, Vocabulary',
          icon: require('../assets/homepageicons/IELTS_icon.png'),
          color: accent,
          onPress: () => router.push('/ielts'),
        },
      ],
    },
    {
      title: 'Progress',
      items: [
        {
          title: 'Journal',
          subtitle: 'Track your learning journey',
          icon: require('../assets/homepageicons/journal_icon.png'),
          color: accent,
          onPress: () => router.push('/journal'),
        },
        {
          title: 'Analytics',
          subtitle: 'View your progress',
          icon: require('../assets/homepageicons/analytics_icon.png'),
          color: accent,
          onPress: () => router.push('/stats'),
        },
      ],
    },
    {
      title: 'Account',
      items: [
        {
          title: 'Profile',
          subtitle: 'Manage your account',
          lottie: require('../assets/homepageicons/profile_icon.json'),
          color: accent,
          onPress: () => router.push('/profile'),
        },
      ],
    },
  ];

  // No PNG prefetch — icons are Lottie.

  // Run Lottie icons only once per app session, right after launch overlay completes
  const [playIcons, setPlayIcons] = useState<boolean>(!(globalThis as any).__HOME_ICON_ANIMS_RAN);
  useEffect(() => {
    if ((globalThis as any).__HOME_ICON_ANIMS_RAN) {
      setPlayIcons(false);
      return;
    }
    const start = () => {
      (globalThis as any).__HOME_ICON_ANIMS_RAN = true;
      setPlayIcons(true);
    };
    if (Launch.isDone()) {
      start();
      return;
    }
    const unsub = Launch.onDone(start);
    return () => { try { unsub(); } catch {} };
  }, []);

  // Track per-icon finish to swap to static PNG afterward in this mount
  const [iconDone, setIconDone] = useState<Record<string, boolean>>({});
  const onIconFinish = (key: string) => {
    setIconDone(prev => (prev[key] ? prev : { ...prev, [key]: true }));
  };

  // No bubble entrance animation on Home
  const [scrolled, setScrolled] = useState(false);
  const [headerHeight, setHeaderHeight] = useState(0);
  const isLight = theme === 'light';

  return (
    <SafeAreaView edges={['left','right']} style={[styles.container, { backgroundColor: background }] }>
      {/* Fixed top bar; background becomes translucent only after scrolling */}
      <View
        onLayout={e => setHeaderHeight(e.nativeEvent.layout.height)}
        style={[
          styles.headerArea,
          {
            paddingTop: insets.top + 6,
            paddingBottom: 6,
            backgroundColor: scrolled
              ? (isLight ? 'rgba(255,255,255,0.6)' : 'rgba(0,0,0,0.2)')
              : background,
          },
        ]}
      >
      <View style={[styles.headerRow] }>
          <View style={[styles.streakPillInline, theme === 'light' && styles.streakPillLight]}>
            {isPreview ? (
              <Text style={[styles.streakText, theme === 'light' && styles.streakTextLight]}>🔥 {userProgress?.streak || 0}</Text>
            ) : (
              <>
                <LottieView source={require('../assets/lottie/flame.json')} autoPlay loop style={{ width: 18, height: 18, marginRight: 6 }} />
                <Text style={[styles.streakText, theme === 'light' && styles.streakTextLight]}>{userProgress?.streak || 0}</Text>
              </>
            )}
          </View>
        <View style={styles.headerRightRow}>
          <Animated.View style={{ transform: [{ scale: hdrScaleToggle }] }}>
            <TouchableOpacity
              style={[styles.headerIconBtn, theme === 'light' && styles.headerIconBtnLight]}
              onPress={toggleMenuStyle}
              onPressIn={() => pressIn('hdr:toggle')}
              onPressOut={() => pressBounce('hdr:toggle')}
              activeOpacity={0.9}
              accessibilityLabel={menuStyle === 'list' ? 'Switch to Tiles' : 'Switch to List'}
            >
              {menuStyle === 'list' ? (
                <LayoutGrid size={16} color={'#0D3B4A'} />
              ) : (
                <ListIcon size={16} color={'#0D3B4A'} />
              )}
            </TouchableOpacity>
          </Animated.View>
          <Animated.View style={{ transform: [{ scale: hdrScaleTranslate }] }}>
            <TouchableOpacity
              style={[styles.translateBtnInline, theme === 'light' && styles.translateBtnLight]}
              onPress={() => router.push('/translate')}
              onPressIn={() => pressIn('hdr:translate')}
              onPressOut={() => pressBounce('hdr:translate')}
              activeOpacity={0.9}
              accessibilityLabel="Translate"
            >
              <Repeat2 size={14} color={theme === 'light' ? '#0D3B4A' : '#0D3B4A'} />
            </TouchableOpacity>
          </Animated.View>
          
          <Animated.View style={{ transform: [{ scale: hdrScalePro }] }}>
            <TouchableOpacity
              style={[styles.subBtnInline, theme === 'light' && styles.subBtnLight]}
              onPress={() => router.push('/profile?paywall=1')}
              onPressIn={() => pressIn('hdr:pro')}
              onPressOut={() => pressBounce('hdr:pro')}
              activeOpacity={0.9}
            >
              <Crown size={16} color={theme === 'light' ? '#0D3B4A' : '#0D3B4A'} />
              <Text style={styles.subBtnText}>Pro</Text>
            </TouchableOpacity>
          </Animated.View>
        </View>
      </View>
      </View>

      <ScrollView
        style={[styles.scrollView, { backgroundColor: background }]}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[styles.scrollContent, { paddingTop: headerHeight || (insets.top + 54) }]}
        // Avoid background flicker during navigation/transitions
        removeClippedSubviews={false}
        onScroll={({ nativeEvent }) => {
          const y = nativeEvent.contentOffset?.y || 0;
          const next = y > 2;
          if (next !== scrolled) setScrolled(next);
        }}
        scrollEventThrottle={16}
      >
        {/* Header is fixed above — list starts below */}

        {/* Sections */}
        {sections.map((section, sectionIndex) => (
          <View key={sectionIndex} style={styles.section}>
            <Text style={styles.sectionTitle}>{section.title}</Text>
            <View style={menuStyle === 'grid' ? styles.gridWrap : undefined}>
              {section.items.map((item, itemIndex) => {
                const itemKey = `s${sectionIndex}-i${itemIndex}`;
                const modeScale = viewModeAnim.interpolate({ inputRange: [0, 1], outputRange: [0.96, 1] });
                const tileScale = getTileScale(itemKey);
                return (
                  <Animated.View
                    key={itemIndex}
                    style={[
                      menuStyle === 'grid' ? styles.gridItem : undefined,
                      { transform: [{ scale: modeScale }] },
                    ]}
                  >
                    {menuStyle === 'grid' ? (
                      <Animated.View style={{ transform: [{ scale: tileScale }] }}>
                        <TouchableOpacity
                          style={[
                            styles.tile,
                            theme === 'light' && styles.tileLight,
                          ]}
                          activeOpacity={0.9}
                          onPressIn={() => pressIn(itemKey)}
                          onPressOut={() => pressBounce(itemKey)}
                          onPress={item.onPress}
                        >
                          <View style={styles.iconShadowWrap}>
                            {(item as any).lottie ? (
                              <LottieView
                                key={`lottie-${itemKey}-${menuStyle}-${iconsTogglePlay ? iconsPlayToken : 'still'}`}
                                source={themedLottie((item as any).lottie)}
                                autoPlay={(playIcons && !iconDone[itemKey]) || iconsTogglePlay}
                                loop={false}
                                onAnimationFinish={() => onIconFinish(itemKey)}
                                progress={!((playIcons && !iconDone[itemKey]) || iconsTogglePlay) ? 1 : undefined}
                                style={[styles.tileIcon, { opacity: 0.82 }]}
                              />
                            ) : (
                              <Image source={item.icon} style={styles.tileIcon} resizeMode="contain" fadeDuration={0} />
                            )}
                          </View>
                          <Text style={[styles.tileTitle, theme === 'light' && styles.cardTitleLight]}>{item.title}</Text>
                        </TouchableOpacity>
                      </Animated.View>
                    ) : (
                      <Animated.View style={{ transform: [{ scale: tileScale }] }}>
                        <TouchableOpacity
                          style={[
                            styles.card,
                            theme === 'light' && styles.cardLight,
                            { marginHorizontal: 12 },
                          ]}
                          onPressIn={() => pressIn(itemKey)}
                          onPressOut={() => pressBounce(itemKey)}
                          onPress={item.onPress}
                          activeOpacity={0.85}
                        >
                        <View style={styles.cardContent}>
                          <View style={styles.cardLeft}>
                            <View style={styles.iconContainer}>
                              {(item as any).lottie ? (
                                <LottieView
                                  key={`lottie-list-${itemKey}-${menuStyle}-${iconsTogglePlay ? iconsPlayToken : 'still'}`}
                                  source={themedLottie((item as any).lottie)}
                                  autoPlay={(playIcons && !iconDone[itemKey]) || iconsTogglePlay}
                                  loop={false}
                                  onAnimationFinish={() => onIconFinish(itemKey)}
                                  progress={!((playIcons && !iconDone[itemKey]) || iconsTogglePlay) ? 1 : undefined}
                                  style={[styles.homeIcon, { opacity: 0.82 }]}
                                />
                              ) : (
                                <Image source={item.icon} style={styles.homeIcon} resizeMode="contain" fadeDuration={0} />
                              )}
                            </View>
                            <View style={styles.cardText}>
                              <Text style={[styles.cardTitle, theme === 'light' && styles.cardTitleLight]}>{item.title}</Text>
                              <Text style={[styles.cardSubtitle, theme === 'light' && styles.cardSubtitleLight]}>{item.subtitle}</Text>
                            </View>
                          </View>
                          <ChevronRight size={20} color="#187486" />
                        </View>
                        </TouchableOpacity>
                      </Animated.View>
                    )}
                  </Animated.View>
                );
              })}
            </View>
          </View>
        ))}

        {/* Bottom spacing for FAB (respect safe-area) */}
        <View style={{ height: 8 }} />
      </ScrollView>

      {/* Floating Action Button */}
      {!isPreview && (
        <TouchableOpacity
          style={[styles.fab, { bottom: Math.max(20, insets.bottom + 18) }]}
          onPress={() => (menuOpen ? closeMenu() : openMenu())}
          activeOpacity={0.8}
        >
          <Plus size={24} color="#FFFFFF" />
        </TouchableOpacity>
      )}

      {menuOpen && !isPreview && (
        <>
          <TouchableOpacity style={styles.menuOverlay} activeOpacity={1} onPress={closeMenu} />
          <Animated.View
            style={[
              styles.menuCard,
              theme === 'light' && styles.menuCardLight,
              {
                opacity: menuAnim,
                transform: [
                  { scale: menuAnim.interpolate({ inputRange: [0, 1], outputRange: [0.96, 1] }) },
                  { translateY: menuAnim.interpolate({ inputRange: [0, 1], outputRange: [8, 0] }) },
                ],
              },
            ]}
          >
            <TouchableOpacity
              style={styles.menuItem}
              onPress={() => { closeMenu(); try { router.push('/scan-words'); } catch {} }}
            >
              <Camera size={18} color={theme === 'light' ? '#0F766E' : '#B6E0E2'} />
              <Text style={[styles.menuText, theme === 'light' && styles.menuTextLight]}>Scan Words</Text>
            </TouchableOpacity>
            <View style={styles.menuDivider} />
            <TouchableOpacity
              style={styles.menuItem}
              onPress={() => { closeMenu(); try { router.push('/vault?add=1'); } catch {} }}
            >
              <Type size={18} color={theme === 'light' ? '#7C3AED' : '#C4B5FD'} />
              <Text style={[styles.menuText, theme === 'light' && styles.menuTextLight]}>Add Manually</Text>
            </TouchableOpacity>
          </Animated.View>
        </>
      )}

      {/* Onboarding */}
      {!isPreview && (
      <OnboardingModal
        visible={showOnboarding}
        theme={theme}
        onClose={async () => {
          setShowOnboarding(false);
          try { await AsyncStorage.setItem('@engniter.onboarding_done_v1', '1'); } catch {}
          // Immediately guide first‑time users to Placement intro explaining the test
          try { router.push('/placement'); } catch {}
        }}
      />)}

      {/* Daily streak celebration (once per day) */}
      {showStreakCelebrate && !isPreview && (
        <View style={styles.celebrateOverlay}>
          <View style={[styles.celebrateCard, theme === 'light' && styles.celebrateCardLight]}> 
            <LottieView source={require('../assets/lottie/flame.json')} autoPlay loop style={{ width: 140, height: 140 }} />
            <Text style={[styles.celebrateCount, theme === 'light' && styles.celebrateCountLight]}>{displayCount}</Text>
            <Text style={[styles.celebrateLabel, theme === 'light' && styles.celebrateLabelLight]}>day streak</Text>
            <Text style={[styles.celebrateHint, theme === 'light' && styles.celebrateHintLight]}>Keep it up — practice again tomorrow!</Text>
            <TouchableOpacity
              style={styles.celebrateBtn}
              onPress={async () => {
                setShowStreakCelebrate(false);
                try {
                  const todayKey = new Date().toISOString().slice(0,10);
                  await AsyncStorage.multiSet([
                    ['@engniter.streak_celebrate_date', todayKey],
                    ['@engniter.streak_celebrate_value', String(userProgress?.streak || 0)],
                  ]);
                } catch {}
              }}
            >
              <Text style={styles.celebrateBtnText}>Awesome</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

      {/* Three‑finger gesture handled on SafeAreaView; no overlay catcher */}

      <LimitModal
        visible={showSignupNudge}
        title="Create your account"
        message={'It takes about 1 minute. Back up your words, sync across devices, and keep your progress safe.'}
        onClose={() => setShowSignupNudge(false)}
        onSubscribe={() => { setShowSignupNudge(false); try { router.push('/profile'); } catch {} }}
        primaryText="Sign up"
        secondaryText="Not now"
      />

      <LimitModal
        visible={showRateNudge}
        title="Enjoying Vocadoo?"
        message={'Please take a moment to rate us on the app store — it really helps!'}
        onClose={() => setShowRateNudge(false)}
        onSubscribe={async () => {
          setShowRateNudge(false);
          try {
            if (Platform.OS === 'ios') {
              if (APP_STORE_ID) {
                await Linking.openURL(`itms-apps://itunes.apple.com/app/id${APP_STORE_ID}?action=write-review`);
              } else {
                await Linking.openURL('https://apps.apple.com');
              }
            } else {
              const pkg = ANDROID_PACKAGE_NAME || 'com.rustikkarim.vocabworking';
              try { await Linking.openURL(`market://details?id=${pkg}`); }
              catch { await Linking.openURL(`https://play.google.com/store/apps/details?id=${pkg}`); }
            }
          } catch {}
        }}
        primaryText="Rate now"
        secondaryText="Not now"
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1E1E1E',
  },
  
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 32,
  },
  header: {
    paddingHorizontal: 16,
    paddingTop: 32,
    paddingBottom: 24,
  },
  title: {
    fontSize: 37,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 8,
    fontFamily: 'Ubuntu-Bold',
  },
  subtitle: {
    fontSize: 15,
    color: '#9CA3AF',
    lineHeight: 24,
    fontFamily: 'Ubuntu-Regular',
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6B7280',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 12,
    marginHorizontal: 12,
    fontFamily: 'Ubuntu-Medium',
  },
  card: {
    backgroundColor: '#2C2C2C',
    marginHorizontal: 12,
    marginBottom: 8,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#333',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.12,
    shadowRadius: 5,
    elevation: 4,
  },
  // Grid tiles
  gridWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
  },
  gridItem: {
    width: '48%',
  },
  tile: {
    width: '100%',
    height: 190,
    backgroundColor: '#2C2C2C',
    borderRadius: 18,
    marginBottom: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#333',
    shadowColor: '#000',
    shadowOpacity: 0.14,
    shadowRadius: 7,
    shadowOffset: { width: 0, height: 4 },
    elevation: 4,
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  tileLight: {
    backgroundColor: '#FFFFFF',
    borderColor: '#E5E7EB',
    // stronger drop shadow in light mode (iOS)
    shadowColor: '#000',
    shadowOpacity: 0.18,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 7 },
    // stronger drop shadow in light mode (Android)
    elevation: 10,
  },
  tileIcon: { width: 120, height: 120, alignSelf: 'center', opacity: 0.82 },
  iconShadowWrap: {
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.24,
    shadowRadius: 7,
    shadowOffset: { width: 0, height: 4 },
    elevation: 6,
    borderRadius: 14,
    padding: 2,
  },
  // Make tile titles use the same font style as list titles
  tileTitle: {
    color: '#FFFFFF',
    fontWeight: '800',
    fontSize: 18,
    textAlign: 'center',
    marginTop: 8,
    width: '100%',
    flexWrap: 'wrap',
    fontFamily: 'Ubuntu-Bold',
  },
  cardContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 10,
  },
  cardLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  iconContainer: {
    width: 96,
    height: 96,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 6,
    marginLeft: 0,
    shadowColor: '#000',
    shadowOpacity: 0.22,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 4 },
    elevation: 6,
  },
  homeIcon: {
    width: 88,
    height: 88,
    alignSelf: 'center',
    opacity: 0.82,
  },
  cardText: {
    flex: 1,
  },
  cardTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 2,
    fontFamily: 'Ubuntu-Bold',
  },
  cardTitleLight: { color: '#111827' },
  cardSubtitle: {
    fontSize: 13,
    color: '#9CA3AF',
    lineHeight: 18,
    fontFamily: 'Ubuntu-Regular',
  },
  cardSubtitleLight: { color: '#4B5563' },
  cardLight: {
    backgroundColor: '#FFFFFF',
    borderColor: '#FFFFFF',
    // stronger drop shadow in light mode (iOS)
    shadowColor: '#000',
    shadowOpacity: 0.12,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 6 },
    // stronger drop shadow in light mode (Android)
    elevation: 6,
  },
  bottomSpacing: {
    height: 64,
  },
  fab: {
    position: 'absolute',
    bottom: 24,
    right: 24,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#88BBF5',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    marginBottom: 8,
  },
  headerArea: {
    width: '100%',
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 10,
  },
  streakPillInline: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 16,
    minHeight: 26,
    backgroundColor: 'rgba(26,32,36,0.9)',
    borderWidth: 1,
    borderColor: 'rgba(248,176,112,0.35)',
    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
  },
  streakPillLight: { backgroundColor: '#FFF7ED', borderColor: '#FBD38D' },
  streakText: { color: '#FFFFFF', fontWeight: '800', fontSize: 14 },
  streakTextLight: { color: '#0D3B4A' },

  subBtnInline: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    minHeight: 30,
    backgroundColor: '#B6E0E2',
    borderWidth: 1,
    borderColor: '#93CBD0',
    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
  },
  subBtnLight: { backgroundColor: '#B6E0E2', borderColor: '#7FB2B6' },
  subBtnText: { color: '#0D3B4A', fontWeight: '800', fontSize: 14 },
  headerRightRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  // Header icon pill (for Tiles/List toggle)
  headerIconBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 12, paddingVertical: 6, borderRadius: 16, minHeight: 30, backgroundColor: '#CCE2FC', borderWidth: 1, borderColor: '#B3D6FA', shadowColor: '#000', shadowOpacity: 0.06, shadowRadius: 6, shadowOffset: { width: 0, height: 2 } },
  headerIconBtnLight: { backgroundColor: '#CCE2FC', borderColor: '#B3D6FA' },
  // Translate pill (pink)
  translateBtnInline: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 12, paddingVertical: 6, borderRadius: 16, minHeight: 30, backgroundColor: '#F09898', borderWidth: 1, borderColor: '#E08181', shadowColor: '#000', shadowOpacity: 0.06, shadowRadius: 6, shadowOffset: { width: 0, height: 2 } },
  translateBtnLight: { backgroundColor: '#F09898', borderColor: '#E08181' },

  // FAB menu
  menuOverlay: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 },
  menuCard: {
    position: 'absolute',
    right: 24,
    bottom: 96,
    backgroundColor: '#2C2C2C',
    borderRadius: 12,
    paddingVertical: 8,
    minWidth: 180,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 12,
  },
  menuCardLight: { backgroundColor: '#FFFFFF', borderWidth: StyleSheet.hairlineWidth, borderColor: '#E5E7EB' },
  menuItem: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: 12, paddingVertical: 10 },
  menuText: { color: '#E5E7EB', fontFamily: 'Ubuntu-Medium' },
  menuTextLight: { color: '#111827' },
  menuDivider: { height: StyleSheet.hairlineWidth, backgroundColor: 'rgba(255,255,255,0.15)' },

  // Celebration overlay
  celebrateOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.35)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  celebrateCard: {
    width: '90%',
    maxWidth: 420,
    borderRadius: 16,
    backgroundColor: '#1E1E1E',
    alignItems: 'center',
    paddingVertical: 24,
    paddingHorizontal: 16,
  },
  celebrateCardLight: { backgroundColor: '#FFFFFF' },
  celebrateCount: { fontSize: 64, color: '#F8B070', fontWeight: '900', marginTop: 6 },
  celebrateCountLight: { color: '#E06620' },
  celebrateLabel: { color: '#E5E7EB', fontWeight: '800', marginTop: -6, textTransform: 'lowercase' },
  celebrateLabelLight: { color: '#111827' },
  celebrateHint: { marginTop: 12, color: '#9CA3AF', textAlign: 'center' },
  celebrateHintLight: { color: '#6B7280' },
  celebrateBtn: { marginTop: 16, backgroundColor: '#F8B070', paddingHorizontal: 18, paddingVertical: 10, borderRadius: 12 },
  celebrateBtnText: { color: '#0D3B4A', fontWeight: '800' },
  
});

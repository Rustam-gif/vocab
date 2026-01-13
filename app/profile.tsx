import React, { useEffect, useMemo, useState } from 'react';
import {
  View,
  Text as RNText,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
  Image,
  Modal,
  ActivityIndicator,
  Linking,
  InteractionManager,
  Keyboard,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { BACKEND_BASE_URL } from '../lib/appConfig';
import { useRouter, useLocalSearchParams, Link } from 'expo-router';
import { useCallback, useRef } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import {
  User as UserIcon,
  Mail,
  Star,
  Calendar,
  Award,
  LogOut,
  Check,
  Crown,
  CheckCircle2,
  ChevronRight,
  Settings as SettingsIcon,
  Volume2,
  VolumeX,
} from 'lucide-react-native';
import LottieView from 'lottie-react-native';
import { supabase, localSignOutHard } from '../lib/supabase';
import { LinearGradient } from '../lib/LinearGradient';
import { SubscriptionService, SubscriptionProduct } from '../services/SubscriptionService';
import NotificationService from '../services/NotificationService';
import { analyticsService } from '../services/AnalyticsService';
import { ProgressService } from '../services/ProgressService';
import { soundService } from '../services/SoundService';
import { useAppStore } from '../lib/store';
import { LANGUAGES_WITH_FLAGS } from '../lib/languages';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import SafeTextInput from '../lib/SafeTextInput';
import { useCanMountTextInput } from '../lib/TextInputGate';
import { SafeTextInputRef } from '../lib/SafeTextInput';

// Avatar images (static requires so Metro bundles them). Filenames without spaces to avoid any URL encoding quirks.
const AVATAR_OPTIONS = [
  { id: 1, source: require('../assets/prof-pictures/cartoon-1.png') },
  { id: 2, source: require('../assets/prof-pictures/cartoon-2.png') },
  { id: 3, source: require('../assets/prof-pictures/cartoon-3.png') },
  { id: 4, source: require('../assets/prof-pictures/cartoon-4.png') },
  { id: 5, source: require('../assets/prof-pictures/cartoon-5.png') },
  { id: 6, source: require('../assets/prof-pictures/cartoon-6.png') },
];

// Helper to look up avatar by numeric ID
const getLocalAvatarById = (id: number) => {
  const match = AVATAR_OPTIONS.find(a => a.id === id);
  return match?.source;
};

// Use a bundled local avatar as default to avoid network fetches
const DEFAULT_AVATAR = 'avatar_1';

const Text = (props: React.ComponentProps<typeof RNText>) => (
  <RNText {...props} style={[{ fontFamily: 'Feather-Bold' }, props.style]} />
);

const mapSupabaseUser = (user: any, progress?: any) => {
  const displayName = user?.user_metadata?.full_name ?? user?.email ?? 'Vocabulary Learner';
  
  // Get avatar from metadata or use default (local)
  let avatar = DEFAULT_AVATAR;
  const avatarId = user?.user_metadata?.avatar_id;
  if (avatarId && avatarId >= 1 && avatarId <= 6) {
    // User selected a custom avatar - we'll use the ID to load it locally
    avatar = `avatar_${avatarId}`;
  } else if (user?.user_metadata?.avatar_url) {
    avatar = user.user_metadata.avatar_url;
  }

  return {
    id: user.id,
    name: displayName,
    email: user.email ?? undefined,
    avatar,
    avatarId, // Store avatar ID for local lookup
    xp: progress?.xp ?? user?.user_metadata?.progress?.xp ?? 0,
    streak: progress?.streak ?? user?.user_metadata?.progress?.streak ?? 0,
    exercisesCompleted: progress?.exercisesCompleted ?? user?.user_metadata?.progress?.exercisesCompleted ?? 0,
    createdAt: user.created_at ? new Date(user.created_at) : new Date(),
  } as const;
};

export default function ProfileScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const { user, setUser, userProgress, loadProgress } = useAppStore();
  const themeName = useAppStore(s => s.theme);
  const isLight = themeName === 'light';
  const toggleTheme = useAppStore(s => s.toggleTheme);
  const insets = useSafeAreaInsets();
  const [isSigningIn, setIsSigningIn] = useState(false);
  const [showEmailAuth, setShowEmailAuth] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [isSignUp, setIsSignUp] = useState(true);
  const [selectedAvatar, setSelectedAvatar] = useState<number>(1);
  const [subStatus, setSubStatus] = useState<{ active: boolean; productId?: string } | null>(null);
  const [products, setProducts] = useState<SubscriptionProduct[]>([]);
  const [selectedSku, setSelectedSku] = useState<string | null>(null);
  const [showPaywall, setShowPaywall] = useState(false);
  const paywallParamConsumed = useRef(false);
  const redirectConsumed = useRef(false);
  const [isPurchasing, setIsPurchasing] = useState(false);
  const [showSignUpSuccess, setShowSignUpSuccess] = useState(false);
  const [showPurchaseSuccess, setShowPurchaseSuccess] = useState(false);
  // Notifications settings state
  const [notifyEnabled, setNotifyEnabled] = useState<boolean>(false);
  const [notifyFreq, setNotifyFreq] = useState<1 | 3 | 5>(1);
  const [notifyBusy, setNotifyBusy] = useState(false);
  // Sound effects setting
  const [soundEnabled, setSoundEnabled] = useState<boolean>(true);
  // Language picker state
  const [showLangModal, setShowLangModal] = useState(false);
  const [langSearch, setLangSearch] = useState('');
  // Expanded catalog (>=150 languages)
  const langs = useMemo(() => LANGUAGES_WITH_FLAGS, []);
  const filteredLangs = useMemo(() => langs.filter(l => (l.name + l.code).toLowerCase().includes(langSearch.toLowerCase())), [langs, langSearch]);
  const isPromo70 = (params as any)?.offer === '70';
  const redirectTo = typeof (params as any)?.redirect === 'string' ? String((params as any).redirect) : null;
  const canMountTextInput = useCanMountTextInput();
  const [authInputsReady, setAuthInputsReady] = useState(false);
  const emailInputRef = useRef<SafeTextInputRef | null>(null);
  const passwordInputRef = useRef<SafeTextInputRef | null>(null);
  const confirmInputRef = useRef<SafeTextInputRef | null>(null);

  // Clear any stale keyboard session before showing auth inputs
  useEffect(() => {
    if (!showEmailAuth) {
      setAuthInputsReady(false);
      return;
    }
    const t = setTimeout(() => {
      try { Keyboard.dismiss(); } catch {}
      setAuthInputsReady(true);
    }, 150);
    return () => clearTimeout(t);
  }, [showEmailAuth]);

  const canRenderAuthInputs = canMountTextInput && authInputsReady;

  // Ensure local avatar images are warmed up to avoid any flicker/blank
  useEffect(() => {
    try {
      if (showEmailAuth && isSignUp) {
        AVATAR_OPTIONS.forEach(opt => {
          try {
            const resolved = Image.resolveAssetSource(opt.source as any);
            // prefetch is primarily for remote images; resolve ensures a valid uri
            if (resolved?.uri) {
              Image.prefetch(resolved.uri).catch(() => {});
            }
          } catch {}
        });
      }
    } catch {}
  }, [showEmailAuth, isSignUp]);

  useEffect(() => {
    // Defer progress + lightweight subscription status so typing into
    // the email/password fields feels instant on first open.
    const task = (InteractionManager as any).runAfterInteractions?.(() => {
      loadProgress();
      SubscriptionService.getStatus()
        .then(s => setSubStatus(s))
        .catch(() => {});
    }) || { cancel: () => {} };
    return () => (task as any).cancel?.();
  }, [loadProgress]);

  // Load current notification settings
  useEffect(() => {
    NotificationService.getSettings().then(s => { setNotifyEnabled(!!s.enabled); setNotifyFreq(s.freq as any); }).catch(() => {});
  }, []);

  // Load sound effects setting
  useEffect(() => {
    AsyncStorage.getItem('@engniter.soundEnabled').then(val => {
      setSoundEnabled(val !== '0'); // Default to true if not set
    }).catch(() => {});
  }, []);

  // Toggle sound effects
  const toggleSoundEffects = async () => {
    const newValue = !soundEnabled;
    setSoundEnabled(newValue);
    soundService.setSoundEnabled(newValue);
    await AsyncStorage.setItem('@engniter.soundEnabled', newValue ? '1' : '0');
  };

  // Refresh subscription status whenever the screen regains focus (e.g., after sign-in/purchase)
  useFocusEffect(
    useCallback(() => {
      SubscriptionService.getStatus().then(s => setSubStatus(s)).catch(() => {});
    }, [])
  );

  useEffect(() => {
    if (!paywallParamConsumed.current && (params as any)?.paywall === '1') {
      paywallParamConsumed.current = true;
      setShowPaywall(true);
    }
  }, [params]);

  // If Profile was opened as a gate (e.g., Learn/Story requires sign up), go back automatically after sign-in.
  useEffect(() => {
    if (redirectConsumed.current) return;
    if (!redirectTo) return;
    if (!(user && (user as any)?.id)) return;
    redirectConsumed.current = true;
    try { router.replace(redirectTo); } catch {}
  }, [redirectTo, user && (user as any)?.id, router]);

  // No persisted flag — allow stat animations to run each time this screen mounts

  const confirmAndSubscribe = () => {
    setShowPaywall(true);
  };

  const handleContinuePurchase = async () => {
    setIsPurchasing(true);
    try {
      // Ensure products are loaded (some builds may not resolve on first mount)
      let current = products;
      if (!current || current.length === 0) {
        try {
          const refreshed = await SubscriptionService.getProducts(['com.royal.vocadoo.premium.months', 'com.royal.vocadoo.premium.annually']);
          setProducts(refreshed);
          if (!selectedSku) {
            const monthly = refreshed.find(p => p.duration === 'monthly')?.id;
            setSelectedSku(monthly || refreshed[0]?.id || null);
          }
          current = refreshed;
        } catch {}
      }

      const fallbackSku = (current.find(p => p.duration === 'monthly')?.id) || current[0]?.id || 'com.royal.vocadoo.premium.months';
      const sku = selectedSku || fallbackSku;

      // Start purchase but add a UI fail‑safe so the button doesn't appear stuck
      const purchasePromise = SubscriptionService.purchase(sku);
      const timeoutPromise = new Promise<any>(async (resolve) => {
        // After 20s, resolve with whatever status we have so UI can recover
        setTimeout(async () => {
          try { resolve(await SubscriptionService.getStatus()); }
          catch { resolve({ active: false }); }
        }, 20000);
      });

      const next: any = await Promise.race([purchasePromise, timeoutPromise]);
      setSubStatus(next);

      if (next?.active) {
        setShowPurchaseSuccess(true);
        setTimeout(() => {
          setShowPurchaseSuccess(false);
          setShowPaywall(false);
          if ((params as any)?.paywall === '1') {
            try { router.replace('/profile'); } catch {}
          }
        }, 1400);
      }
    } catch (e) {
      // Swallow and fall through to finally; UI will recover
    } finally {
      setIsPurchasing(false);
    }
  };

  useEffect(() => {
    // Handle auth callback success/error messages
    if (params.success) {
      Alert.alert('Success', 'Successfully signed in!');
    } else if (params.error) {
      const errorMessages = {
        auth_failed: 'Authentication failed. Please try again.',
        session_failed: 'Failed to create session. Please try again.',
        hash_failed: 'Failed to process authentication. Please try again.',
        callback_failed: 'Authentication callback failed. Please try again.',
      };
      Alert.alert('Sign In Error', errorMessages[params.error as string] || 'An unknown error occurred.');
    }

    supabase.auth.getSession().then(({ data }) => {
      if (data.session?.user) {
        setUser(mapSupabaseUser(data.session.user, userProgress));
      }
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (session?.user) {
        try {
          // Pull remote data after sign-in to restore analytics/progress
          await Promise.all([
            analyticsService.refreshFromRemote().catch(() => {}),
            ProgressService.refreshFromRemote().catch(() => {}),
          ]);
          await loadProgress();
          const current = await supabase.auth.getUser();
          setUser(mapSupabaseUser(current.data.user, useAppStore.getState().userProgress));
        } catch {}
        // Try to flush any pending progress to Supabase (best-effort)
        ProgressService.saveProgress().catch(() => {});
      } else if (event === 'SIGNED_OUT') {
        setUser(null);
      }
      setIsSigningIn(false);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [setUser, params, userProgress]);

  const handleEmailAuth = async () => {
    if (!email || !password) {
      Alert.alert('Error', 'Please enter both email and password');
      return;
    }

    if (isSignUp) {
      if (!fullName) {
        Alert.alert('Error', 'Please enter your full name');
        return;
      }
      if (password !== confirmPassword) {
        Alert.alert('Error', 'Passwords do not match');
        return;
      }
      if (password.length < 6) {
        Alert.alert('Error', 'Password must be at least 6 characters');
        return;
      }
    }

    setIsSigningIn(true);
    // Safety valve: never let the UI spin forever
    let timeoutId: any = null;
    try { timeoutId = setTimeout(() => {
      try { setIsSigningIn(false); } catch {}
      try { Alert.alert('Network Timeout', 'Signing in is taking too long. Please check your connection and try again.'); } catch {}
    }, 15000); } catch {}
    try {
      if (isSignUp) {
        // Get the selected avatar source
        const selectedAvatarOption = AVATAR_OPTIONS.find(a => a.id === selectedAvatar);
        const avatarUrl = selectedAvatarOption 
          ? `avatar_${selectedAvatar}` // Store avatar ID reference
          : undefined;

        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: {
              full_name: fullName,
              avatar_id: selectedAvatar, // Store the avatar ID
              avatar_url: avatarUrl,
            },
          },
        });

        if (error) {
          Alert.alert('Sign Up Error', error.message);
        } else if (data.user) {
          // Improved in-app modal instead of system alert
          setIsSignUp(false); // switch to sign-in mode
          setPassword('');
          setConfirmPassword('');
          setShowEmailAuth(true); // keep auth form visible for immediate sign-in
          setShowSignUpSuccess(true);
        }
      } else {
        const { data, error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });

        if (error) {
          Alert.alert('Sign In Error', error.message);
        } else if (data.user) {
          try {
            await Promise.all([
              analyticsService.refreshFromRemote().catch(() => {}),
              ProgressService.refreshFromRemote().catch(() => {}),
            ]);
            await loadProgress();
          } catch {}
          setUser(mapSupabaseUser(data.user, useAppStore.getState().userProgress));
          setShowEmailAuth(false);
        }
      }
    } catch (error) {
      Alert.alert('Error', error instanceof Error ? error.message : 'Unknown error');
    } finally {
      if (timeoutId) { try { clearTimeout(timeoutId); } catch {} }
      setIsSigningIn(false);
    }
  };

  const handleSignOut = () => {
    Alert.alert('Sign Out', 'Are you sure you want to sign out?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Sign Out',
        style: 'destructive',
        onPress: async () => {
          await localSignOutHard();
          // Switch progress context back to guest/local
          try { await ProgressService.refreshFromRemote(); } catch {}
          try { await loadProgress(); } catch {}
          // Clear user locally regardless, so the UI updates immediately
          setUser(null);
        },
      },
    ]);
  };

  const handleDeleteAccount = () => {
    Alert.alert(
      'Delete Account',
      'This will permanently delete your account if you are signed in, and erase data on this device. Do you want to continue?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              // If signed in, attempt remote account deletion via backend
              try {
                const { data: { session } } = await supabase.auth.getSession();
                const token = session?.access_token;
                if (token && BACKEND_BASE_URL) {
                  const resp = await fetch(`${BACKEND_BASE_URL.replace(/\/$/, '')}/api/delete-account`, {
                    method: 'POST',
                    headers: { Authorization: `Bearer ${token}` },
                  });
                  if (!resp.ok) {
                    // If backend fails, continue with local cleanup; user may already be deleted
                    console.warn('[Delete] backend returned', resp.status);
                  }
                }
              } catch (e) {
                console.warn('[Delete] remote delete skipped:', e);
              }

              // Best-effort local sign-out and full storage clear
              await localSignOutHard();
              await AsyncStorage.clear();
            } catch {}
            try { await ProgressService.refreshFromRemote(); } catch {}
            try { await loadProgress(); } catch {}
            setUser(null);
            Alert.alert('Account Deleted', 'Your account and data have been removed.');
          },
        },
      ]
    );
  };

  const formatDate = (date?: Date) => {
    if (!date) return 'Unknown';
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const getLevel = (xp?: number) => {
    const safeXp = xp ?? 0;
    return Math.floor(safeXp / 1000) + 1;
  };

  const getXPProgress = (xp?: number) => {
    const safeXp = xp ?? 0;
    const currentLevel = getLevel(safeXp);
    const currentLevelXP = (currentLevel - 1) * 1000;
    const nextLevelXP = currentLevel * 1000;
    const progress = ((safeXp - currentLevelXP) / (nextLevelXP - currentLevelXP)) * 100;
    return Math.min(100, Math.max(0, progress));
  };

  // Derived values used by both views; compute before any return to keep hook order stable
  const userAvatar = (user?.avatar ?? DEFAULT_AVATAR) as any;
  const safeXp = userProgress?.xp ?? user?.xp ?? 0;
  const safeStreak = userProgress?.streak ?? user?.streak ?? 0;
  const lastActiveISO = (userProgress?.lastActiveDate ?? new Date().toISOString().slice(0,10)) as string;
  const todayISO = new Date().toISOString().slice(0,10);
  const maintainedToday = lastActiveISO === todayISO && safeStreak > 0;
  const weekActivity = React.useMemo(() => {
    try {
      const active = new Set<string>();
      const last = new Date(lastActiveISO);
      const len = Math.max(0, Math.min(safeStreak, 7));
      for (let i = 0; i < len; i++) {
        const d = new Date(last);
        d.setDate(last.getDate() - i);
        active.add(d.toISOString().slice(0,10));
      }
      const now = new Date();
      const dow = now.getDay();
      const start = new Date(now);
      start.setHours(0,0,0,0);
      start.setDate(now.getDate() - dow);
      const labels = ['Su','Mo','Tu','We','Th','Fr','Sa'];
      const days: { label: string; iso: string; active: boolean }[] = [];
      for (let i = 0; i < 7; i++) {
        const d = new Date(start);
        d.setDate(start.getDate() + i);
        const iso = d.toISOString().slice(0,10);
        days.push({ label: labels[i], iso, active: active.has(iso) });
      }
      return days;
    } catch {
      const labels = ['Su','Mo','Tu','We','Th','Fr','Sa'];
      return labels.map(l => ({ label: l, iso: '', active: false }));
    }
  }, [lastActiveISO, safeStreak]);
  const safeExercises = userProgress?.exercisesCompleted ?? user?.exercisesCompleted ?? 0;

  if (!user) {
    return (
      <SafeAreaView style={[styles.container, isLight && styles.containerLight]}>
        <View style={[styles.header, isLight && styles.headerLight]}>
          <View style={styles.placeholder} />
          <Text style={[styles.title, isLight && styles.titleLight]}>Profile</Text>
          <TouchableOpacity
            style={[styles.settingsIconButton, isLight && styles.settingsIconButtonLight]}
            onPress={() => router.push('/settings')}
            activeOpacity={0.8}
          >
            <SettingsIcon size={20} color={isLight ? '#0F766E' : '#4ED9CB'} />
          </TouchableOpacity>
        </View>

        <View style={styles.signInContainer}>
          <ScrollView contentContainerStyle={[styles.signInContent, isLight && styles.signInContentLight]}>
            <UserIcon size={64} color={isLight ? '#0F766E' : '#4ED9CB'} />
            <Text style={[styles.signInTitle, isLight && styles.signInTitleLight]}>Welcome to Vocadoo</Text>
            <Text style={[styles.signInSubtitle, isLight && styles.signInSubtitleLight]}>
              {showEmailAuth ? (isSignUp ? 'Create an account' : 'Sign in to your account') : 'Sign in to sync your progress across devices'}
            </Text>

            {showEmailAuth ? (
              canRenderAuthInputs ? (
              <View style={styles.emailAuthForm}>
                {isSignUp && (
                  <>
                    {/* Avatar Selection */}
                    <View style={styles.avatarSection}>
                      <Text style={[styles.avatarSectionTitle, isLight && styles.avatarSectionTitleLight]}>Choose Your Avatar</Text>
                      <View style={styles.avatarGrid}>
                        {AVATAR_OPTIONS.map((avatarOption) => (
                          <TouchableOpacity
                            key={avatarOption.id}
                            style={[
                              styles.avatarOption,
                              isLight && styles.avatarOptionLight,
                              selectedAvatar === avatarOption.id && styles.avatarOptionSelected
                            ]}
                            onPress={() => setSelectedAvatar(avatarOption.id)}
                          >
                            <Image
                              // Resolve the local asset to an explicit URI to avoid any edge cases
                              source={Image.resolveAssetSource(avatarOption.source as any)}
                              style={styles.avatarOptionImage}
                              onError={(e) => {
                                if (__DEV__) {
                                  try {
                                    const res = Image.resolveAssetSource(avatarOption.source as any);
                                    console.warn('Avatar image failed to load:', { id: avatarOption.id, resolved: res });
                                  } catch (err) {
                                    console.warn('Avatar resolve failed:', avatarOption.id, err);
                                  }
                                }
                              }}
                            />
                            {selectedAvatar === avatarOption.id && (
                              <View style={styles.avatarCheckmark}>
                                <Check size={16} color="#fff" />
                              </View>
                            )}
                          </TouchableOpacity>
                        ))}
                      </View>
                    </View>

                    <View style={[styles.inputContainer, isLight && styles.inputContainerLight]}>
                      <UserIcon size={20} color="#4ED9CB" style={styles.inputIcon} />
                      <SafeTextInput
                        style={[styles.input, isLight && styles.inputLight]}
                        placeholder="Full Name"
                        placeholderTextColor={isLight ? '#9CA3AF' : '#666'}
                        value={fullName}
                        onChangeText={setFullName}
                        autoCapitalize="words"
                        autoCorrect
                        spellCheck
                        keyboardAppearance={isLight ? 'light' : 'dark'}
                      />
                    </View>
                  </>
                )}

                    <View style={[styles.inputContainer, isLight && styles.inputContainerLight]}>
                      <Mail size={20} color="#4ED9CB" style={styles.inputIcon} />
                      <SafeTextInput
                        ref={emailInputRef}
                        style={[styles.input, isLight && styles.inputLight]}
                        placeholder="Email"
                        placeholderTextColor={isLight ? '#9CA3AF' : '#666'}
                        value={email}
                        onChangeText={setEmail}
                        keyboardType="ascii-capable"
                        autoCapitalize="none"
                        autoCorrect={false}
                        spellCheck={false}
                        autoComplete="off"
                        textContentType="none"
                        keyboardAppearance={isLight ? 'light' : 'dark'}
                      />
                    </View>

                    <View style={[styles.inputContainer, isLight && styles.inputContainerLight]}>
                      <Text style={styles.inputIcon}>🔒</Text>
                      <SafeTextInput
                        ref={passwordInputRef}
                        style={[styles.input, isLight && styles.inputLight]}
                        placeholder="Password"
                        placeholderTextColor={isLight ? '#9CA3AF' : '#666'}
                        value={password}
                        onChangeText={setPassword}
                        secureTextEntry
                        autoCapitalize="none"
                        autoCorrect={false}
                        spellCheck={false}
                        autoComplete="off"
                        keyboardType="ascii-capable"
                        textContentType="none"
                        keyboardAppearance={isLight ? 'light' : 'dark'}
                      />
                    </View>

                    {isSignUp && (
                  <View style={[styles.inputContainer, isLight && styles.inputContainerLight]}>
                    <Text style={styles.inputIcon}>🔒</Text>
                        <SafeTextInput
                          ref={confirmInputRef}
                          style={[styles.input, isLight && styles.inputLight]}
                          placeholder="Confirm Password"
                          placeholderTextColor={isLight ? '#9CA3AF' : '#666'}
                          value={confirmPassword}
                          onChangeText={setConfirmPassword}
                          secureTextEntry
                          autoCapitalize="none"
                          autoCorrect={false}
                          spellCheck={false}
                          autoComplete="off"
                          keyboardType="ascii-capable"
                          textContentType="none"
                          keyboardAppearance={isLight ? 'light' : 'dark'}
                        />
                      </View>
                    )}

                <TouchableOpacity
                  style={styles.signInButton}
                  onPress={handleEmailAuth}
                  disabled={isSigningIn}
                >
                  <Text style={styles.signInButtonText}>
                    {isSigningIn ? (isSignUp ? 'Creating Account...' : 'Signing In...') : (isSignUp ? 'Create Account' : 'Sign In')}
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity onPress={() => {
                  setIsSignUp(!isSignUp);
                  setConfirmPassword('');
                  setFullName('');
                  setSelectedAvatar(1);
                }}>
                  <Text style={styles.switchAuthText}>
                    {isSignUp ? 'Already have an account? Sign In' : 'Don\'t have an account? Sign Up'}
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity onPress={() => {
                  setShowEmailAuth(false);
                  setEmail('');
                  setPassword('');
                  setConfirmPassword('');
                  setFullName('');
                  setSelectedAvatar(1);
                }}>
                  <Text style={styles.backText}>← Back to other options</Text>
                </TouchableOpacity>
              </View>
            ) : (
              <View style={styles.emailAuthForm}>
                <Text style={[styles.signInSubtitle, isLight && styles.signInSubtitleLight]}>
                  Preparing keyboard… tap again in a moment.
                </Text>
              </View>
            )
            ) : (
              <View style={styles.signInButtons}>
                <TouchableOpacity
                  style={styles.signInButton}
                  onPress={() => setShowEmailAuth(true)}
                >
                  <Mail size={20} color="#fff" />
                  <Text style={styles.signInButtonText}>Sign in with Email</Text>
                </TouchableOpacity>

                <Text style={styles.guestText}>
                  You can continue as a guest, but your progress won't be saved
                </Text>
              </View>
            )}

            {/* Callout: Unlock vs Premium Active */}
            {!subStatus?.active ? (
              <TouchableOpacity
                onPress={() => {
                  setShowPaywall(true);
                  SubscriptionService.initialize()
                    .then(() => SubscriptionService.getProducts(['com.royal.vocadoo.premium.months', 'com.royal.vocadoo.premium.annually']))
                    .then((list)=>{ setProducts(list); try { const m=list.find(p=>p.duration==='monthly')?.id; setSelectedSku(m||list[0]?.id||null);} catch { setSelectedSku(list[0]?.id||null);} })
                    .catch(() => {});
                }}
                activeOpacity={0.9}
                style={[styles.moreInfoCard, isLight ? styles.moreInfoCardLight : styles.moreInfoCardDark]}
              >
                <View style={{ flex: 1 }}>
                  <Text style={[styles.moreInfoTitle, isLight && styles.moreInfoTitleLight]}>Unlock everything</Text>
                  <Text style={[styles.moreInfoSubtitle, isLight && styles.moreInfoSubtitleLight]}>Access all stories, save unlimited, analytics, and more.</Text>
                </View>
                <View style={styles.moreInfoIconWrap}>
                  <Crown color="#F25E86" size={28} />
                </View>
              </TouchableOpacity>
            ) : (
              <LinearGradient
                colors={isLight ? ['#F7C6D8', '#9FE6DE'] : ['#3A222C', '#0D3B4A']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={[styles.premiumActiveCard]}
              >
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                  <View style={styles.premiumActiveIcon}><Star color="#FFD166" size={24} /></View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.premiumActiveTitle}>Your Account is Premium</Text>
                    <Text style={styles.premiumActiveSubtitle}>All sets and features are available</Text>
                  </View>
                </View>
              </LinearGradient>
            )}

            {/* Removed duplicate in-page premium card; use banner + modal paywall */}

        {/* Paywall Modal */}
        <Modal visible={showPaywall} animationType="slide" presentationStyle="pageSheet" onRequestClose={() => {
          setShowPaywall(false);
          if ((params as any)?.paywall === '1') {
            try { router.replace('/profile'); } catch {}
          }
        }}>
          <SafeAreaView style={[styles.paywallContainer, isLight && styles.paywallContainerLight]}>
            <View style={styles.paywallHeaderRow}>
              <TouchableOpacity onPress={() => {
                setShowPaywall(false);
                if ((params as any)?.paywall === '1') {
                  try { router.replace('/profile'); } catch {}
                }
              }}>
                <Text style={[styles.paywallCancel, isLight && styles.paywallCancelLight]}>Cancel</Text>
              </TouchableOpacity>
            </View>
            <View style={styles.paywallHeader}>
              <View style={styles.paywallBadge}><Crown color="#0D3B4A" size={30} /></View>
              <Text style={[styles.paywallTitle, isLight && styles.paywallTitleLight]}>Get Vocadoo Premium</Text>
              {isPromo70 && (
                <View style={[styles.paywallPromoTag, isLight && styles.paywallPromoTagLight]}>
                  <Text style={[styles.paywallPromoText, isLight && styles.paywallPromoTextLight]}>Limited 70% off</Text>
                </View>
              )}
              <Text style={[styles.paywallHeadline, isLight && styles.paywallHeadlineLight]}>
                {isPromo70 ? 'Yearly plan now 70% off' : 'Unlock everything'}
              </Text>
              {(() => {
                const sel = (products || []).find(p => p.id === selectedSku) || (products || [])[0];
                return sel?.hasFreeTrial ? (
                  <View style={styles.trialChip}><Text style={styles.trialChipText}>7 days free trial</Text></View>
                ) : null;
              })()}
            </View>
            <View style={styles.paywallBullets}>
              <Text style={[styles.paywallBullet, isLight && styles.paywallBulletLight]}>✓ Learn faster with focused practice</Text>
              <Text style={[styles.paywallBullet, isLight && styles.paywallBulletLight]}>✓ Save unlimited stories</Text>
              <Text style={[styles.paywallBullet, isLight && styles.paywallBulletLight]}>✓ Detailed analytics & progress</Text>
              <Text style={[styles.paywallBullet, isLight && styles.paywallBulletLight]}>✓ Cancel anytime from your Apple ID</Text>
            </View>
            <View style={styles.paywallPlansRow}>
              {(() => {
                const list = [...(products || [])].sort((a,b) => (a.duration === 'monthly' ? -1 : 1));
                return list.map(p => (
                  <TouchableOpacity key={p.id} activeOpacity={0.9} onPress={() => setSelectedSku(p.id)} style={[styles.planCard, selectedSku === p.id && styles.planCardActive]}>
                    <Text style={styles.planTitle}>{p.duration === 'yearly' ? 'Yearly' : 'Monthly'}</Text>
                    <Text style={styles.planPrice}>{p.localizedPrice}/{p.duration === 'yearly' ? 'year' : 'month'}</Text>
                    {!!p.hasFreeTrial && (<Text style={styles.planTrialText}>Includes free trial</Text>)}
                  </TouchableOpacity>
                ));
              })()}
            </View>
            <TouchableOpacity
              disabled={isPurchasing}
              onPress={handleContinuePurchase}
              activeOpacity={0.9}
              style={[styles.paywallCta, isPurchasing && { opacity: 0.7 }]}
            >
              {isPurchasing ? (
                <ActivityIndicator color="#0D3B4A" />
              ) : (
                <Text style={styles.paywallCtaText}>{(() => {
                  const sel = (products || []).find(p => p.id === selectedSku);
                  return sel?.hasFreeTrial ? 'Start Free Trial' : 'Continue';
                })()}</Text>
              )}
            </TouchableOpacity>
            <View style={styles.paywallFooterRow}>
              <TouchableOpacity onPress={async () => { const restored = await SubscriptionService.restore(); setSubStatus(restored); }}>
                <Text style={[styles.paywallLink, isLight && styles.paywallLinkLight]}>Restore</Text>
              </TouchableOpacity>
              <Text style={[styles.paywallDot, isLight && styles.paywallLinkLight]}>•</Text>
              {/* Manage removed as per request */}
              <TouchableOpacity onPress={() => Linking.openURL('https://www.apple.com/legal/internet-services/itunes/dev/stdeula/')}>
                <Text style={[styles.paywallLink, isLight && styles.paywallLinkLight]}>Terms & Conditions</Text>
              </TouchableOpacity>
              <Text style={[styles.paywallDot, isLight && styles.paywallLinkLight]}>•</Text>
              <TouchableOpacity onPress={() => Linking.openURL('https://docs.google.com/document/d/1dj2k7y2ogm8sRcD5RxuiP7zqJ_cPKEhFvLfNboaWkwA/edit?tab=t.0')}>
                <Text style={[styles.paywallLink, isLight && styles.paywallLinkLight]}>Privacy Policy</Text>
              </TouchableOpacity>
            </View>

            {showPurchaseSuccess && (
              <View style={styles.successOverlay} pointerEvents="auto">
                <View style={[styles.successCard, isLight && styles.successCardLight]}>
                  <CheckCircle2 size={24} color={isLight ? '#0D3B4A' : '#4ED9CB'} />
                  <Text style={[styles.successTitle, isLight && styles.successTitleLight]}>You’re all set</Text>
                  <Text style={[styles.successText, isLight && styles.successTextLight]}>Premium unlocked on this device.</Text>
                </View>
              </View>
            )}
          </SafeAreaView>
        </Modal>
            {/* Quick access rows visible even when logged out */}

            {/* Streak card (read-only preview) */}
            <View style={[styles.streakCard, isLight && styles.streakCardLight, { marginTop: 16 }]}>
              <View style={styles.streakHeaderRow}>
                <View style={styles.streakFlameWrap}>
                  <LottieView source={require('../assets/lottie/flame.json')} autoPlay loop style={{ width: 48, height: 48 }} />
                  <View style={styles.streakCountBadge}><Text style={styles.streakCountText}>{safeStreak}</Text></View>
                </View>
                <Text style={[styles.streakTitle, isLight && styles.streakTitleLight]}>Your streak</Text>
                <View style={{ width: 32 }} />
              </View>
              <View style={styles.streakWeekRow}>
                {weekActivity.map(({ label, active }) => (
                  <View key={label} style={[styles.streakDay, isLight && styles.streakDayLight]}>
                    <Text style={[styles.streakDayLabel, isLight && styles.streakDayLabelLight]}>{label}</Text>
                    <View style={[styles.streakDot, active && styles.streakDotActive]} />
                  </View>
                ))}
              </View>
            </View>

            <TouchableOpacity
              onPress={() => router.push('/report')}
              activeOpacity={0.8}
              style={[
                styles.infoCard,
                isLight && styles.infoCardLight,
                {
                  flexDirection: 'row',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  marginTop: 16,
                },
              ]}
            >
              <Text style={[styles.settingsRowTitle, isLight && styles.userNameLight]}>Report an Issue</Text>
              <ChevronRight size={20} color={isLight ? '#0F766E' : '#4ED9CB'} />
            </TouchableOpacity>
          </ScrollView>
        </View>
      </SafeAreaView>
    );
  }

  

  // Get avatar source - supports local IDs and stored keys like "avatar_1"
  const getAvatarSource = () => {
    // 1) Explicit numeric avatarId
    if (user.avatarId && user.avatarId >= 1 && user.avatarId <= 6) {
      const local = getLocalAvatarById(user.avatarId);
      if (local) return local as any;
    }
    // 2) Stored string key like "avatar_3"
    if (typeof userAvatar === 'string') {
      const localMatch = /^(?:avatar_|local:avatar_)([1-6])$/.exec(userAvatar);
      if (localMatch) {
        const id = Number(localMatch[1]);
        const local = getLocalAvatarById(id);
        if (local) return local as any;
      }
      // 3) Remote URL fallback
      if (/^https?:\/\//i.test(userAvatar)) {
        return { uri: userAvatar } as const;
      }
    }
    // 4) Final fallback to avatar #1
    return getLocalAvatarById(1) as any;
  };

  return (
    <SafeAreaView style={[styles.container, isLight && styles.containerLight]}>
      <View style={{ flex: 1 }}>
        <View style={[styles.header, isLight && styles.headerLight]}>
          <View style={styles.placeholder} />
          <View style={{ flex: 1 }} />
            <View style={styles.headerActions}>
              <TouchableOpacity style={[styles.settingsIconButton, isLight && styles.settingsIconButtonLight]} onPress={() => router.push('/settings')}>
                <SettingsIcon size={20} color={isLight ? '#0F766E' : '#4ED9CB'} />
              </TouchableOpacity>
              <TouchableOpacity style={[styles.signOutButton, isLight && styles.signOutButtonLight]} onPress={handleSignOut}>
                <LogOut size={20} color="#F25E86" />
              </TouchableOpacity>
            </View>
        </View>

        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          <View style={[styles.profileCard, isLight && styles.profileCardLight]}>
            <View style={styles.avatarContainer}>
              <Image source={getAvatarSource()} style={styles.avatar} />
              <View style={styles.levelBadge}>
                <Text style={styles.levelText}>Lv.{getLevel(safeXp)}</Text>
              </View>
            </View>

            <Text style={[styles.userName, isLight && styles.userNameLight]}>{user.name}</Text>

            <View style={styles.xpContainer}>
              <Text style={[styles.xpLabel, isLight && styles.xpLabelLight]}>XP Progress</Text>
              <View style={[styles.xpBar, isLight && styles.xpBarLight]}>
                <View style={[styles.xpProgress, { width: `${getXPProgress(safeXp)}%` }]} />
              </View>
              <Text style={[styles.xpText, isLight && styles.xpTextLight]}>
                {safeXp} XP • Level {getLevel(safeXp)}
              </Text>
            </View>
          </View>

        {/* Subscription status/CTA for signed-in users */}
        {!subStatus?.active ? (
          <TouchableOpacity
            onPress={() => {
              setShowPaywall(true);
              SubscriptionService.initialize()
                .then(() => SubscriptionService.getProducts(['com.royal.vocadoo.premium.months', 'com.royal.vocadoo.premium.annually']))
                .then((list)=>{ setProducts(list); try { const m=list.find(p=>p.duration==='monthly')?.id; setSelectedSku(m||list[0]?.id||null);} catch { setSelectedSku(list[0]?.id||null);} })
                .catch(() => {});
            }}
            activeOpacity={0.9}
            style={[styles.moreInfoCard, isLight ? styles.moreInfoCardLight : styles.moreInfoCardDark]}
          >
            <View style={{ flex: 1 }}>
              <Text style={[styles.moreInfoTitle, isLight && styles.moreInfoTitleLight]}>Unlock everything</Text>
              <Text style={[styles.moreInfoSubtitle, isLight && styles.moreInfoSubtitleLight]}>Access all stories, save unlimited, analytics, and more.</Text>
            </View>
            <View style={styles.moreInfoIconWrap}>
              <Crown color="#F25E86" size={28} />
            </View>
          </TouchableOpacity>
        ) : (
          <LinearGradient
            colors={isLight ? ['#F7C6D8', '#9FE6DE'] : ['#3A222C', '#0D3B4A']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={[styles.premiumActiveCard]}
          >
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <View style={styles.premiumActiveIcon}><Star color="#FFD166" size={24} /></View>
              <View style={{ flex: 1 }}>
                <Text style={styles.premiumActiveTitle}>Your Account is Premium</Text>
                <Text style={styles.premiumActiveSubtitle}>All sets and features are available</Text>
              </View>
            </View>
          </LinearGradient>
        )}

        {/* Practice reminders live in Settings */}

        {/* Sound Effects Toggle */}
        <View style={[styles.soundToggleCard, isLight && styles.soundToggleCardLight]}>
          <View style={styles.soundToggleRow}>
            <View style={styles.soundToggleIconWrap}>
              {soundEnabled ? (
                <Volume2 size={22} color={isLight ? '#0F766E' : '#4ED9CB'} />
              ) : (
                <VolumeX size={22} color="#9CA3AF" />
              )}
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[styles.soundToggleTitle, isLight && styles.soundToggleTitleLight]}>
                Sound Effects
              </Text>
              <Text style={[styles.soundToggleSubtitle, isLight && styles.soundToggleSubtitleLight]}>
                {soundEnabled ? 'Sounds are enabled' : 'Sounds are muted'}
              </Text>
            </View>
            <TouchableOpacity
              onPress={toggleSoundEffects}
              activeOpacity={0.8}
              style={[
                styles.soundToggleSwitch,
                soundEnabled && styles.soundToggleSwitchActive,
                isLight && styles.soundToggleSwitchLight,
                soundEnabled && isLight && styles.soundToggleSwitchActiveLight,
              ]}
            >
              <View style={[
                styles.soundToggleKnob,
                soundEnabled && styles.soundToggleKnobActive,
              ]} />
            </TouchableOpacity>
          </View>
        </View>

        {/* Removed duplicate subscription card in signed-in view; use banner + modal paywall */}

        {/* Language Preferences moved to Settings */}

        {/* Modal is rendered outside ScrollView to cover header and content */}

        <View style={[styles.streakCard, isLight && styles.streakCardLight]}>
          <View style={styles.streakHeaderRow}>
            <View style={styles.streakFlameWrap}>
              <LottieView source={require('../assets/lottie/flame.json')} autoPlay loop style={{ width: 48, height: 48 }} />
              <View style={styles.streakCountBadge}><Text style={styles.streakCountText}>{safeStreak}</Text></View>
            </View>
            <Text style={[styles.streakTitle, isLight && styles.streakTitleLight]}>Your streak</Text>
            <View style={{ width: 32 }} />
          </View>
          <View style={styles.streakWeekRow}>
            {weekActivity.map(({ label, active }) => (
              <View key={label} style={[styles.streakDay, isLight && styles.streakDayLight]}>
                <Text style={[styles.streakDayLabel, isLight && styles.streakDayLabelLight]}>{label}</Text>
                <View style={[styles.streakDot, active && styles.streakDotActive]} />
              </View>
            ))}
          </View>
        </View>

        {/* Email/Joined moved to Settings */}

        {/* Danger Zone moved to Settings */}
          <TouchableOpacity onPress={() => router.push('/report')} activeOpacity={0.8} style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginTop: 20, gap: 4 }}>
            <Text style={{ fontSize: 13, color: isLight ? '#6B7280' : '#9CA3AF' }}>Report an Issue</Text>
            <ChevronRight size={14} color={isLight ? '#6B7280' : '#9CA3AF'} />
          </TouchableOpacity>

          <View style={{ height: 120 }} />
        </ScrollView>
      </View>

      {/* Paywall Modal (signed-in view) */}
      <Modal visible={showPaywall} animationType="slide" presentationStyle="pageSheet" onRequestClose={() => {
        setShowPaywall(false);
        if ((params as any)?.paywall === '1') {
          try { router.replace('/profile'); } catch {}
        }
      }}>
        <SafeAreaView style={[styles.paywallContainer, isLight && styles.paywallContainerLight]}>
          <View style={styles.paywallHeaderRow}>
            <TouchableOpacity onPress={() => {
              setShowPaywall(false);
              if ((params as any)?.paywall === '1') {
                try { router.replace('/profile'); } catch {}
              }
            }}>
              <Text style={[styles.paywallCancel, isLight && styles.paywallCancelLight]}>Cancel</Text>
            </TouchableOpacity>
          </View>
          <View style={styles.paywallHeader}>
            <View style={styles.paywallBadge}><Crown color="#0D3B4A" size={30} /></View>
            <Text style={[styles.paywallTitle, isLight && styles.paywallTitleLight]}>Get Vocadoo Premium</Text>
            {isPromo70 && (
              <View style={[styles.paywallPromoTag, isLight && styles.paywallPromoTagLight]}>
                <Text style={[styles.paywallPromoText, isLight && styles.paywallPromoTextLight]}>Limited 70% off</Text>
              </View>
            )}
            <Text style={[styles.paywallHeadline, isLight && styles.paywallHeadlineLight]}>
              {isPromo70 ? 'Yearly plan now 70% off' : 'Unlock everything'}
            </Text>
          </View>
          <View style={styles.paywallBullets}>
            <Text style={[styles.paywallBullet, isLight && styles.paywallBulletLight]}>✓ Learn faster with focused practice</Text>
            <Text style={[styles.paywallBullet, isLight && styles.paywallBulletLight]}>✓ Save unlimited stories</Text>
            <Text style={[styles.paywallBullet, isLight && styles.paywallBulletLight]}>✓ Detailed analytics & progress</Text>
            <Text style={[styles.paywallBullet, isLight && styles.paywallBulletLight]}>✓ Cancel anytime from your Apple ID</Text>
          </View>
          <View style={styles.paywallPlansRow}>
            {(() => {
              const list = [...(products || [])].sort((a,b) => (a.duration === 'monthly' ? -1 : 1));
              return list.map(p => (
                <TouchableOpacity key={p.id} activeOpacity={0.9} onPress={() => setSelectedSku(p.id)} style={[styles.planCard, selectedSku === p.id && styles.planCardActive]}>
                  <Text style={styles.planTitle}>{p.duration === 'yearly' ? 'Yearly' : 'Monthly'}</Text>
                  <Text style={styles.planPrice}>{p.localizedPrice}/{p.duration === 'yearly' ? 'year' : 'month'}</Text>
                  {!!p.hasFreeTrial && (<Text style={styles.planTrialText}>Includes free trial</Text>)}
                </TouchableOpacity>
              ));
            })()}
          </View>
          <TouchableOpacity
            disabled={isPurchasing}
            onPress={handleContinuePurchase}
            activeOpacity={0.9}
            style={[styles.paywallCta, isPurchasing && { opacity: 0.7 }]}
          >
            {isPurchasing ? (
              <ActivityIndicator color="#0D3B4A" />
            ) : (
              <Text style={styles.paywallCtaText}>{(() => {
                const sel = (products || []).find(p => p.id === selectedSku);
                return sel?.hasFreeTrial ? 'Start Free Trial' : 'Continue';
              })()}</Text>
            )}
          </TouchableOpacity>
          <View style={styles.paywallFooterRow}>
            <TouchableOpacity onPress={async () => { const restored = await SubscriptionService.restore(); setSubStatus(restored); }}>
              <Text style={[styles.paywallLink, isLight && styles.paywallLinkLight]}>Restore</Text>
            </TouchableOpacity>
            <Text style={[styles.paywallDot, isLight && styles.paywallLinkLight]}>•</Text>
            {/* Manage removed as per request */}
            <TouchableOpacity onPress={() => Linking.openURL('https://www.apple.com/legal/internet-services/itunes/dev/stdeula/')}>
              <Text style={[styles.paywallLink, isLight && styles.paywallLinkLight]}>Terms & Conditions</Text>
            </TouchableOpacity>
            <Text style={[styles.paywallDot, isLight && styles.paywallLinkLight]}>•</Text>
            <TouchableOpacity onPress={() => Linking.openURL('https://docs.google.com/document/d/1dj2k7y2ogm8sRcD5RxuiP7zqJ_cPKEhFvLfNboaWkwA/edit?tab=t.0')}>
              <Text style={[styles.paywallLink, isLight && styles.paywallLinkLight]}>Privacy Policy</Text>
            </TouchableOpacity>
          </View>

          {showPurchaseSuccess && (
            <View style={styles.successOverlay} pointerEvents="auto">
              <View style={[styles.successCard, isLight && styles.successCardLight]}>
                <CheckCircle2 size={24} color={isLight ? '#0D3B4A' : '#4ED9CB'} />
                <Text style={[styles.successTitle, isLight && styles.successTitleLight]}>You’re all set</Text>
                <Text style={[styles.successText, isLight && styles.successTextLight]}>Premium unlocked on this device.</Text>
              </View>
            </View>
          )}
        </SafeAreaView>
      </Modal>
      {showLangModal && (
        <View style={styles.modalOverlay}>
          <View style={[styles.langModalCard, isLight && styles.langModalCardLight]}>
            <Text style={[styles.infoHeader, isLight && styles.infoHeaderLight]}>Choose Language</Text>
            <View style={[styles.langSearchBox, isLight && styles.langSearchBoxLight]}>
              <TextInput
                value={langSearch}
                onChangeText={setLangSearch}
                placeholder="Search e.g., Spanish, es"
                placeholderTextColor={isLight ? '#6B7280' : '#9CA3AF'}
                style={[styles.langSearchInput, isLight ? { color: '#111827' } : { color: '#E5E7EB' }]}
                autoCapitalize="none"
                autoCorrect
                spellCheck
                autoComplete="off"
                
              />
            </View>
            <ScrollView style={{ maxHeight: 240 }}>
              {filteredLangs.map(l => (
                <TouchableOpacity key={l.code} style={[styles.langRow, isLight ? styles.langRowLight : styles.langRowDark]} onPress={async () => { await useAppStore.getState().setLanguagePreferences([l.code]); setShowLangModal(false); setUser(useAppStore.getState().user); }}>
                  <Text style={isLight ? { color: '#111827' } : { color: '#E5E7EB' }}>{l.flag} {l.name} ({l.code.toUpperCase()})</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
            <TouchableOpacity onPress={() => setShowLangModal(false)} style={[styles.premiumBtn, { alignSelf: 'flex-end', marginTop: 10, backgroundColor: '#F25E86' }]}>
              <Text style={styles.premiumBtnText}>Done</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}
      {/* Sign-up success overlay */}
      {showSignUpSuccess && (
        <View style={styles.modalOverlay}>
          <View style={[styles.signupCard, isLight && styles.signupCardLight]}>
            <LottieView source={require('../assets/lottie/Success.json')} autoPlay loop={false} style={{ width: 96, height: 96 }} />
            <Text style={[styles.signupTitle, isLight && styles.signupTitleLight]}>Account created</Text>
            <Text style={[styles.signupText, isLight && styles.signupTextLight]}>Sign in using your email and password to continue.</Text>
            <TouchableOpacity
              style={[styles.premiumBtn, { marginTop: 10, alignSelf: 'stretch', backgroundColor: '#F25E86' }]}
              onPress={() => { setShowSignUpSuccess(false); setShowEmailAuth(true); setIsSignUp(false); }}
            >
              <Text style={styles.premiumBtnText}>Sign in now</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#1E1E1E' },
  containerLight: { flex: 1, backgroundColor: '#F8F8F8' },
  header: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 8,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerLight: {},
  title: { color: '#fff', fontSize: 20, fontWeight: '700' },
  titleLight: { color: '#111827' },
  backButton: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: '#1F1F1F',
    borderWidth: 1.5,
    borderColor: 'rgba(78,217,203,0.15)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  settingsIconButton: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: '#1F1F1F',
    borderWidth: 1.5,
    borderColor: 'rgba(78,217,203,0.15)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  settingsIconButtonLight: {
    backgroundColor: '#FFFFFF',
    borderColor: 'rgba(78,217,203,0.3)',
  },
  signOutButton: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: '#1F1F1F',
    borderWidth: 1.5,
    borderColor: 'rgba(78,217,203,0.15)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  signOutButtonLight: {
    backgroundColor: '#FFFFFF',
    borderColor: 'rgba(78,217,203,0.3)',
  },
  placeholder: { width: 44, height: 44 },
  content: { flex: 1, paddingHorizontal: 20 },
  profileCard: {
    backgroundColor: '#1F1F1F',
    borderRadius: 20,
    padding: 20,
    alignItems: 'center',
    marginBottom: 24,
    borderWidth: 2,
    borderColor: 'rgba(78,217,203,0.06)',
    borderBottomWidth: 4,
    borderRightWidth: 4,
    borderBottomColor: 'rgba(78,217,203,0.1)',
    borderRightColor: 'rgba(78,217,203,0.08)',
    shadowColor: '#000',
    shadowOpacity: 0.3,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 6,
  },
  profileCardLight: {
    backgroundColor: '#FFFFFF',
    borderWidth: 2,
    borderColor: 'rgba(78,217,203,0.2)',
    borderBottomWidth: 4,
    borderRightWidth: 4,
    borderBottomColor: 'rgba(78,217,203,0.25)',
    borderRightColor: 'rgba(78,217,203,0.22)',
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    elevation: 4,
  },
  avatarContainer: {
    width: 110,
    height: 110,
    borderRadius: 55,
    overflow: 'hidden',
    marginBottom: 16,
    position: 'relative',
  },
  avatar: { width: '100%', height: '100%' },
  levelBadge: {
    position: 'absolute',
    bottom: -4,
    right: -4,
    backgroundColor: '#F25E86',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 16,
    shadowColor: '#F25E86',
    shadowOpacity: 0.4,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
  },
  levelText: { color: '#FFFFFF', fontWeight: '700', fontSize: 12 },
  userName: { color: '#fff', fontSize: 22, fontWeight: '700' },
  userNameLight: { color: '#111827' },
  settingsRowTitle: { color: '#fff', fontSize: 16, fontWeight: '700' },
  userEmail: { color: '#9CA3AF', marginTop: 4 },
  xpContainer: { marginTop: 20, width: '100%' },
  xpLabel: { color: '#9CA3AF', fontSize: 12, marginBottom: 6 },
  xpLabelLight: { color: '#6B7280' },
  xpBar: {
    height: 10,
    backgroundColor: '#2A2A2A',
    borderRadius: 6,
    overflow: 'hidden',
  },
  xpBarLight: { backgroundColor: '#E5E7EB' },
  xpProgress: { height: '100%', backgroundColor: '#F25E86' },
  xpText: { color: '#9CA3AF', marginTop: 6, fontSize: 12 },
  xpTextLight: { color: '#374151' },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 24,
  },
  statCard: {
    flex: 1,
    backgroundColor: '#1F1F1F',
    borderRadius: 18,
    padding: 16,
    marginHorizontal: 6,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: 'rgba(78,217,203,0.06)',
    borderBottomWidth: 4,
    borderRightWidth: 4,
    borderBottomColor: 'rgba(78,217,203,0.1)',
    borderRightColor: 'rgba(78,217,203,0.08)',
    shadowColor: '#000',
    shadowOpacity: 0.3,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 6,
  },
  statCardLight: {
    backgroundColor: '#FFFFFF',
    borderWidth: 2,
    borderColor: 'rgba(78,217,203,0.2)',
    borderBottomWidth: 4,
    borderRightWidth: 4,
    borderBottomColor: 'rgba(78,217,203,0.25)',
    borderRightColor: 'rgba(78,217,203,0.22)',
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    elevation: 4,
  },
  statIcon: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: 'transparent',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  statIconLight: { backgroundColor: 'transparent' },
  statContent: { flex: 1 },
  statValue: { color: '#fff', fontWeight: '700', fontSize: 18, textAlign: 'center', marginTop: 4 },
  statValueLight: { color: '#111827' },
  statLabel: { color: '#9CA3AF', fontSize: 11, marginTop: 4, textAlign: 'center' },
  statLabelLight: { color: '#6B7280' },

  // Streak card styles
  streakCard: {
    marginTop: 12,
    marginHorizontal: 16,
    borderRadius: 18,
    backgroundColor: '#1F1F1F',
    padding: 16,
    borderWidth: 2,
    borderColor: 'rgba(78,217,203,0.06)',
    borderBottomWidth: 4,
    borderRightWidth: 4,
    borderBottomColor: 'rgba(78,217,203,0.1)',
    borderRightColor: 'rgba(78,217,203,0.08)',
    shadowColor: '#000',
    shadowOpacity: 0.3,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 6,
  },
  streakCardLight: {
    backgroundColor: '#FFFFFF',
    borderWidth: 2,
    borderColor: 'rgba(78,217,203,0.2)',
    borderBottomWidth: 4,
    borderRightWidth: 4,
    borderBottomColor: 'rgba(78,217,203,0.25)',
    borderRightColor: 'rgba(78,217,203,0.22)',
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    elevation: 4,
  },
  streakHeaderRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  streakFlameWrap: { flexDirection: 'row', alignItems: 'center' },
  streakCountBadge: { marginLeft: 6, backgroundColor: '#111827', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 10 },
  streakCountText: { color: '#F25E86', fontWeight: '800' },
  streakTitle: { color: '#E5E7EB', fontWeight: '800', fontSize: 16 },
  streakTitleLight: { color: '#111827' },
  streakWeekRow: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 12 },
  streakDay: { alignItems: 'center', justifyContent: 'center', width: 44 },
  streakDayLight: {},
  streakDayLabel: { color: '#9CA3AF', fontSize: 12, marginBottom: 6 },
  streakDayLabelLight: { color: '#6B7280' },
  streakDot: { width: 18, height: 18, borderRadius: 9, backgroundColor: '#4B5563' },
  streakDotActive: { backgroundColor: '#F25E86', shadowColor: '#F25E86', shadowOpacity: 0.6, shadowRadius: 8, shadowOffset: { width: 0, height: 2 } },
  streakFooterRow: { marginTop: 10, flexDirection: 'row', justifyContent: 'flex-start' },
  streakTip: { borderRadius: 12, paddingHorizontal: 10, paddingVertical: 6 },
  streakTipOkay: { backgroundColor: 'rgba(242,94,134,0.16)', borderWidth: 1, borderColor: 'rgba(242,94,134,0.45)' },
  streakTipWarn: { backgroundColor: 'rgba(255, 59, 48, 0.12)', borderWidth: 1, borderColor: 'rgba(255, 59, 48, 0.35)' },
  streakTipText: { fontWeight: '800' },
  streakTipTextOkay: { color: '#F25E86' },
  streakTipTextWarn: { color: '#FF5A52' },
  infoCard: {
    backgroundColor: '#1F1F1F',
    borderRadius: 18,
    padding: 16,
    marginBottom: 16,
    borderWidth: 2,
    borderColor: 'rgba(78,217,203,0.06)',
    borderBottomWidth: 4,
    borderRightWidth: 4,
    borderBottomColor: 'rgba(78,217,203,0.1)',
    borderRightColor: 'rgba(78,217,203,0.08)',
    shadowColor: '#000',
    shadowOpacity: 0.3,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 6,
  },
  infoCardLight: {
    backgroundColor: '#FFFFFF',
    borderWidth: 2,
    borderColor: 'rgba(78,217,203,0.2)',
    borderBottomWidth: 4,
    borderRightWidth: 4,
    borderBottomColor: 'rgba(78,217,203,0.25)',
    borderRightColor: 'rgba(78,217,203,0.22)',
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    elevation: 4,
  },
  // Learn more callout
  moreInfoCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 18,
    marginBottom: 12,
    width: '100%',
    backgroundColor: '#1A2021',
    borderWidth: 2,
    borderColor: 'rgba(78,217,203,0.06)',
    borderBottomWidth: 4,
    borderRightWidth: 4,
    borderBottomColor: 'rgba(78,217,203,0.1)',
    borderRightColor: 'rgba(78,217,203,0.08)',
    shadowColor: '#000',
    shadowOpacity: 0.3,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 6,
  },
  moreInfoCardLight: {
    backgroundColor: '#F4FFFD',
    borderWidth: 2,
    borderColor: 'rgba(78,217,203,0.2)',
    borderBottomWidth: 4,
    borderRightWidth: 4,
    borderBottomColor: 'rgba(78,217,203,0.25)',
    borderRightColor: 'rgba(78,217,203,0.22)',
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    elevation: 4,
  },
  moreInfoCardDark: { backgroundColor: '#1A2021' },
  moreInfoTitle: { fontSize: 18, fontWeight: '800', color: '#FFFFFF' },
  moreInfoTitleLight: { color: '#0F172A' },
  moreInfoSubtitle: { marginTop: 4, color: '#9CA3AF' },
  moreInfoSubtitleLight: { color: '#475569' },
  moreInfoIconWrap: {
    marginLeft: 12,
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: '#2A2A2A',
    borderWidth: 1,
    borderColor: 'rgba(78,217,203,0.25)',
    justifyContent: 'center',
    alignItems: 'center',
  },

  premiumActiveCard: { borderRadius: 18, padding: 16, marginBottom: 12, width: '100%' },
  premiumActiveIcon: { width: 44, height: 44, borderRadius: 12, backgroundColor: 'rgba(78,217,203,0.25)', justifyContent: 'center', alignItems: 'center', marginRight: 12 },
  premiumActiveTitle: { color: '#EAF2F6', fontSize: 18, fontWeight: '800' },
  premiumActiveSubtitle: { color: '#EAF2F6', marginTop: 4 },
  manageChip: { paddingHorizontal: 12, paddingVertical: 8, backgroundColor: 'rgba(255,255,255,0.85)', borderRadius: 999 },
  manageChipText: { color: '#0D3B4A', fontWeight: '700' },

  // Notification UI styles
  pillBtn: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 16, borderWidth: 1, borderColor: 'rgba(78,217,203,0.2)' },
  pillOff: { backgroundColor: '#1F1F1F' },
  pillOn: { backgroundColor: 'rgba(242,94,134,0.35)', borderColor: '#F25E86' },
  pillText: { fontWeight: '800', color: '#E5E7EB' },
  pillTextOff: { color: '#E5E7EB' },
  pillTextOn: { color: '#FFFFFF' },
  cardSubtext: { color: '#9CA3AF', marginTop: 8 },
  cardSubtextLight: { color: '#6B7280' },
  freqChip: { paddingHorizontal: 12, paddingVertical: 8, borderRadius: 14, backgroundColor: '#1F1F1F', borderWidth: 1, borderColor: 'rgba(78,217,203,0.2)' },
  freqChipLight: { backgroundColor: '#EEF2F7', borderColor: '#E5E7EB' },
  freqChipActive: { backgroundColor: '#F25E86', borderColor: '#F25E86' },
  freqChipText: { color: '#E5E7EB', fontWeight: '700' },
  freqChipTextLight: { color: '#374151', fontWeight: '700' },
  freqChipTextActive: { color: '#FFFFFF' },
  smallBtn: { paddingHorizontal: 14, paddingVertical: 10, borderRadius: 12, backgroundColor: '#1F1F1F', borderWidth: 1, borderColor: 'rgba(78,217,203,0.2)' },
  smallBtnLight: { backgroundColor: '#FFFFFF', borderColor: '#E5E7EB' },
  smallBtnText: { color: '#E5E7EB', fontWeight: '700' },
  smallBtnTextLight: { color: '#374151', fontWeight: '700' },
  smallBtnAccent: { paddingHorizontal: 14, paddingVertical: 10, borderRadius: 12, backgroundColor: '#F25E86' },
  smallBtnTextAccent: { color: '#FFFFFF', fontWeight: '800' },

  // Paywall
  paywallContainer: { flex: 1, backgroundColor: '#0D1117', paddingHorizontal: 20 },
  paywallContainerLight: { backgroundColor: '#F3F4F6' },
  paywallHeaderRow: { paddingTop: 10, paddingBottom: 6 },
  paywallCancel: { color: '#4ED9CB', fontWeight: '600' },
  paywallCancelLight: { color: '#0F766E' },
  paywallHeader: { alignItems: 'center', paddingVertical: 10 },
  paywallBadge: { width: 58, height: 58, borderRadius: 16, backgroundColor: '#4ED9CB', justifyContent: 'center', alignItems: 'center', marginBottom: 10 },
  paywallTitle: { fontSize: 20, fontWeight: '800', color: '#E5E7EB' },
  paywallTitleLight: { color: '#111827' },
  paywallHeadline: { fontSize: 26, fontWeight: '800', color: '#E5E7EB', marginTop: 6 },
  paywallHeadlineLight: { color: '#111827' },
  paywallPromoTag: { paddingHorizontal: 14, paddingVertical: 6, borderRadius: 999, backgroundColor: 'rgba(78,217,203,0.16)', marginTop: 10 },
  paywallPromoTagLight: { backgroundColor: '#FDE2EA' },
  paywallPromoText: { color: '#F25E86', fontWeight: '800', fontSize: 14 },
  paywallPromoTextLight: { color: '#F25E86' },
  paywallBullets: { marginTop: 16, gap: 8 },
  paywallBullet: { color: '#D1D5DB', fontSize: 16 },
  paywallBulletLight: { color: '#374151' },
  paywallPlansRow: { flexDirection: 'row', gap: 12, marginTop: 18 },
  planCard: { flex: 1, backgroundColor: '#E5E7EB', borderRadius: 16, padding: 14 },
  planCardActive: { backgroundColor: '#4ED9CB' },
  planTitle: { fontSize: 14, color: '#0D3B4A' },
  planPrice: { fontSize: 18, fontWeight: '800', color: '#0D3B4A', marginTop: 2 },
  planTrialText: { marginTop: 4, color: '#0D3B4A', fontWeight: '600' },
  trialChip: { marginTop: 8, alignSelf: 'center', backgroundColor: '#FEF3C7', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 999 },
  trialChipText: { color: '#92400E', fontWeight: '800' },
  paywallCta: { marginTop: 18, backgroundColor: '#4ED9CB', borderRadius: 16, paddingVertical: 16, alignItems: 'center' },
  paywallCtaText: { color: '#0D3B4A', fontWeight: '800', fontSize: 18 },
  paywallFooterRow: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 8, marginTop: 14 },
  paywallLink: { color: '#9CA3AF' },
  paywallLinkLight: { color: '#374151' },
  paywallDot: { color: '#9CA3AF' },

  // Success Overlay
  successOverlay: { position: 'absolute', left: 0, right: 0, top: 0, bottom: 0, justifyContent: 'center', alignItems: 'center', backgroundColor: 'rgba(0,0,0,0.25)' },
  successCard: { backgroundColor: '#0D3B4A', borderRadius: 16, paddingVertical: 16, paddingHorizontal: 18, alignItems: 'center', minWidth: 240, gap: 8 },
  successCardLight: { backgroundColor: '#4ED9CB' },
  // Sign-up success modal
  signupCard: {
    width: '86%',
    maxWidth: 420,
    backgroundColor: '#1F1F1F',
    borderRadius: 16,
    padding: 16,
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: 'rgba(78,217,203,0.15)',
    shadowColor: '#000',
    shadowOpacity: 0.3,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 6 },
    elevation: 8,
  },
  signupCardLight: { backgroundColor: '#FFFFFF', borderWidth: 1.5, borderColor: 'rgba(78,217,203,0.3)' },
  signupTitle: { marginTop: 6, color: '#FFFFFF', fontWeight: '800', fontSize: 18 },
  signupTitleLight: { color: '#111827' },
  signupText: { marginTop: 6, color: '#9CA3AF', textAlign: 'center' },
  signupTextLight: { color: '#4B5563' },
  successTitle: { color: '#EAF2F6', fontWeight: '800', fontSize: 16 },
  successTitleLight: { color: '#0D3B4A' },
  successText: { color: '#EAF2F6' },
  successTextLight: { color: '#0D3B4A' },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  infoLabel: { color: '#9CA3AF', marginLeft: 10, fontSize: 12, width: 60 },
  infoLabelLight: { color: '#6B7280' },
  infoValue: { color: '#fff', flex: 1, textAlign: 'right' },
  infoValueLight: { color: '#111827' },
  themeToggle: {
    marginLeft: 'auto',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#1F1F1F',
    borderRadius: 16,
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderWidth: 1.5,
    borderColor: 'rgba(78,217,203,0.15)'
  },
  themeToggleLight: {
    backgroundColor: '#FFFFFF',
    borderColor: 'rgba(78,217,203,0.3)',
  },
  themeToggleActive: {
    backgroundColor: 'rgba(78,217,203,0.18)',
    borderColor: 'rgba(78,217,203,0.45)'
  },
  themeThumb: {
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: '#9CA3AF',
  },
  themeThumbOn: {
    backgroundColor: '#4ED9CB',
  },
  themeToggleText: { color: '#E5E7EB', fontWeight: '700', fontSize: 12 },
  themeToggleTextLight: { color: '#374151' },
  infoHeader: { color: '#E5E7EB', fontWeight: '800', marginBottom: 6 },
  infoHeaderLight: { color: '#111827' },
  infoHint: { color: '#9CA3AF', marginBottom: 12, fontSize: 12 },
  infoHintLight: { color: '#6B7280' },
  subRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 },
  premiumBtn: {
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 10,
    backgroundColor: '#1F1F1F',
    borderWidth: 1.5,
    borderColor: 'rgba(78,217,203,0.15)',
  },
  premiumBtnText: { color: '#FFFFFF', fontWeight: '700' },
  dangerBtn: {
    marginTop: 8,
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 8,
    backgroundColor: '#EF9797',
    alignItems: 'center',
    alignSelf: 'flex-start',
  },
  dangerBtnText: { color: '#FFFFFF', fontWeight: '800', fontSize: 12 },
  premiumGradient: {
    borderRadius: 18,
    overflow: 'hidden',
    padding: 16,
    marginBottom: 40,
    // Ensure the gradient card spans the full width like other cards
    width: '100%',
  },
  // Text styles specifically for content over the premium gradient
  premiumHeader: { color: '#FFFFFF', fontWeight: '800', marginBottom: 6 },
  premiumHint: { color: 'rgba(255,255,255,0.92)', marginBottom: 12, fontSize: 12 },
  premiumLabel: { color: 'rgba(255,255,255,0.9)', marginLeft: 10, fontSize: 12, width: 60 },
  premiumValue: { color: '#FFFFFF', flex: 1, textAlign: 'right' },
  linksRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 8 },
  linkText: { color: '#FFFFFF', textDecorationLine: 'underline', fontSize: 12 },
  linkDivider: { color: 'rgba(255,255,255,0.7)' },
  langChip: {
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 10,
    backgroundColor: '#1F1F1F',
    borderWidth: 1,
    borderColor: 'rgba(78,217,203,0.15)',
  },
  langChipLight: { backgroundColor: '#FFFFFF', borderWidth: 1.5, borderColor: 'rgba(78,217,203,0.3)' },
  langChipDark: { backgroundColor: '#1F1F1F' },
  langChipText: { color: '#FFFFFF', fontWeight: '700' },
  modalOverlay: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.35)', justifyContent: 'center', alignItems: 'center', zIndex: 100, elevation: 12 },
  langModalCard: {
    width: '86%',
    backgroundColor: '#1F1F1F',
    borderRadius: 16,
    padding: 14,
    overflow: 'hidden',
    borderWidth: 1.5,
    borderColor: 'rgba(78,217,203,0.15)',
    shadowColor: '#000',
    shadowOpacity: 0.3,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 6 },
    elevation: 8,
  },
  langModalCardLight: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1.5,
    borderColor: 'rgba(78,217,203,0.3)',
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    elevation: 4,
  },
  langSearchInput: { flex: 1, height: 36, fontSize: 14, fontFamily: 'Feather-Bold' },
  langSearchBox: { marginTop: 6, borderRadius: 10, paddingHorizontal: 10, paddingVertical: 8, backgroundColor: '#1F1F1F', borderWidth: 1.5, borderColor: 'rgba(78,217,203,0.15)' },
  langSearchBoxLight: { backgroundColor: '#FFFFFF', borderColor: 'rgba(78,217,203,0.3)' },
  langRow: { paddingVertical: 10, paddingHorizontal: 12, borderRadius: 8, marginTop: 6 },
  langRowLight: { backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: 'rgba(78,217,203,0.3)' },
  langRowDark: { backgroundColor: '#1F1F1F', borderWidth: 1.5, borderColor: 'rgba(78,217,203,0.15)' },
  signInContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'stretch',
    paddingHorizontal: 20,
  },
  signInContent: {
    width: '100%',
    alignItems: 'center',
    backgroundColor: '#1F1F1F',
    paddingHorizontal: 28,
    paddingVertical: 40,
    borderRadius: 20,
    borderWidth: 1.5,
    borderColor: 'rgba(78,217,203,0.15)',
    shadowColor: '#000',
    shadowOpacity: 0.3,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 6,
  },
  signInContentLight: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1.5,
    borderColor: 'rgba(78,217,203,0.3)',
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    elevation: 4,
  },
  signInTitle: { color: '#fff', fontSize: 20, fontWeight: '700', marginTop: 16 },
  signInTitleLight: { color: '#111827' },
  signInSubtitle: { color: '#9CA3AF', textAlign: 'center', marginTop: 8 },
  signInSubtitleLight: { color: '#4B5563' },
  signInButtons: { width: '100%', marginTop: 20 },
  signInButton: {
    backgroundColor: '#F25E86',
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
    flexDirection: 'row',
    gap: 8,
  },
  googleButton: { backgroundColor: '#F25E86' },
  appleButton: { backgroundColor: '#1C1C1E' },
  signInButtonText: { color: '#fff', fontWeight: '600' },
  guestText: { color: '#6B7280', textAlign: 'center', marginTop: 16, fontSize: 12 },
  emailAuthForm: { width: '100%', marginTop: 20 },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#2A2A2A',
    borderRadius: 12,
    marginBottom: 16,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: 'rgba(78,217,203,0.15)',
  },
  inputContainerLight: { backgroundColor: '#FFFFFF', borderWidth: 1.5, borderColor: 'rgba(78,217,203,0.3)' },
  inputIcon: { marginRight: 8 },
  input: {
    flex: 1,
    color: '#fff',
    paddingVertical: 14,
    fontSize: 16,
    fontFamily: 'Feather-Bold',
  },
  inputLight: { color: '#111827' },
  switchAuthText: {
    color: '#F25E86',
    textAlign: 'center',
    marginTop: 16,
    fontSize: 14,
  },
  backText: {
    color: '#9CA3AF',
    textAlign: 'center',
    marginTop: 12,
    fontSize: 14,
  },
  avatarSection: {
    width: '100%',
    marginBottom: 20,
  },
  avatarSectionTitle: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 16,
    textAlign: 'center',
  },
  avatarSectionTitleLight: {
    color: '#111827',
  },
  avatarGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 12,
  },
  avatarOption: {
    width: 80,
    height: 80,
    borderRadius: 40,
    borderWidth: 3,
    borderColor: 'rgba(78,217,203,0.15)',
    overflow: 'hidden',
    position: 'relative',
    backgroundColor: '#2A2A2A',
  },
  avatarOptionLight: { borderColor: 'rgba(78,217,203,0.3)', backgroundColor: '#FFFFFF' },
  avatarOptionSelected: {
    borderColor: '#F25E86',
    borderWidth: 3,
  },
  avatarOptionImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  avatarCheckmark: {
    position: 'absolute',
    bottom: 2,
    right: 2,
    backgroundColor: '#F25E86',
    borderRadius: 12,
    width: 24,
    height: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },

  // Sound toggle styles
  soundToggleCard: {
    backgroundColor: '#1F1F1F',
    borderRadius: 18,
    padding: 16,
    marginBottom: 16,
    borderWidth: 2,
    borderColor: 'rgba(78,217,203,0.06)',
    borderBottomWidth: 4,
    borderRightWidth: 4,
    borderBottomColor: 'rgba(78,217,203,0.1)',
    borderRightColor: 'rgba(78,217,203,0.08)',
    shadowColor: '#000',
    shadowOpacity: 0.3,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 6,
  },
  soundToggleCardLight: {
    backgroundColor: '#FFFFFF',
    borderWidth: 2,
    borderColor: 'rgba(78,217,203,0.2)',
    borderBottomWidth: 4,
    borderRightWidth: 4,
    borderBottomColor: 'rgba(78,217,203,0.25)',
    borderRightColor: 'rgba(78,217,203,0.22)',
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    elevation: 4,
  },
  soundToggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  soundToggleIconWrap: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: 'rgba(78,217,203,0.12)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  soundToggleTitle: {
    color: '#E5E7EB',
    fontWeight: '700',
    fontSize: 16,
  },
  soundToggleTitleLight: {
    color: '#111827',
  },
  soundToggleSubtitle: {
    color: '#9CA3AF',
    fontSize: 13,
    marginTop: 2,
  },
  soundToggleSubtitleLight: {
    color: '#6B7280',
  },
  soundToggleSwitch: {
    width: 52,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#374151',
    padding: 3,
    justifyContent: 'center',
  },
  soundToggleSwitchActive: {
    backgroundColor: '#4ED9CB',
  },
  soundToggleSwitchLight: {
    backgroundColor: '#D1D5DB',
  },
  soundToggleSwitchActiveLight: {
    backgroundColor: '#0F766E',
  },
  soundToggleKnob: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
    elevation: 3,
  },
  soundToggleKnobActive: {
    alignSelf: 'flex-end',
  },
});

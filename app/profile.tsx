import React, { useEffect, useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
  Image,
  TextInput,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import {
  ArrowLeft,
  User as UserIcon,
  Mail,
  Star,
  Calendar,
  Award,
  LogOut,
  Check,
} from 'lucide-react-native';
import { supabase } from '../lib/supabase';
import { analyticsService } from '../services/AnalyticsService';
import { useAppStore } from '../lib/store';

// Avatar images
const AVATAR_OPTIONS = [
  { id: 1, source: require('../assets/prof-pictures/cartoon 1.png') },
  { id: 2, source: require('../assets/prof-pictures/cartoon 2.png') },
  { id: 3, source: require('../assets/prof-pictures/cartoon 3.png') },
  { id: 4, source: require('../assets/prof-pictures/cartoon 4.png') },
  { id: 5, source: require('../assets/prof-pictures/cartoon 5.png') },
  { id: 6, source: require('../assets/prof-pictures/cartoon 6.png') },
];

const DEFAULT_AVATAR = 'https://ui-avatars.com/api/?name=Vocab+Learner';

const mapSupabaseUser = (user: any, progress?: any) => {
  const displayName = user?.user_metadata?.full_name ?? user?.email ?? 'Vocabulary Learner';
  
  // Get avatar from metadata or use default
  let avatar = `https://ui-avatars.com/api/?name=${encodeURIComponent(displayName)}`;
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
  const [isSigningIn, setIsSigningIn] = useState(false);
  const [showEmailAuth, setShowEmailAuth] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [isSignUp, setIsSignUp] = useState(true);
  const [selectedAvatar, setSelectedAvatar] = useState<number>(1);

  useEffect(() => {
    // Load progress on mount
    loadProgress();
  }, [loadProgress]);

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
    } = supabase.auth.onAuthStateChange((event, session) => {
      if (session?.user) {
        setUser(mapSupabaseUser(session.user, userProgress));
        // Merge local analytics into account analytics on sign-in
        analyticsService.initialize().catch(() => {});
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
          Alert.alert('Success', 'Account created! Please check your email to verify your account.');
          setEmail('');
          setPassword('');
          setConfirmPassword('');
          setFullName('');
          setSelectedAvatar(1);
          setShowEmailAuth(false);
        }
      } else {
        const { data, error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });

        if (error) {
          Alert.alert('Sign In Error', error.message);
        } else if (data.user) {
          await loadProgress();
          setUser(mapSupabaseUser(data.user, userProgress));
          setShowEmailAuth(false);
        }
      }
    } catch (error) {
      Alert.alert('Error', error instanceof Error ? error.message : 'Unknown error');
    } finally {
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
          supabase.auth
            .signOut()
            .then(({ error }) => {
              if (error) {
                console.error('Sign out error', error);
                Alert.alert('Error', 'Failed to sign out. Please try again.');
                return;
              }
              setUser(null);
            })
            .catch(error => {
              console.error('Sign out error', error);
              Alert.alert('Error', 'Failed to sign out. Please try again.');
            });
        },
      },
    ]);
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

  if (!user) {
    return (
      <SafeAreaView style={[styles.container, isLight && styles.containerLight]}>
        <View style={[styles.header, isLight && styles.headerLight]}>
          <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
            <ArrowLeft size={24} color={isLight ? '#111827' : '#fff'} />
          </TouchableOpacity>
          <Text style={[styles.title, isLight && styles.titleLight]}>Profile</Text>
          <View style={styles.placeholder} />
        </View>

        <View style={styles.signInContainer}>
          <ScrollView contentContainerStyle={[styles.signInContent, isLight && styles.signInContentLight]}>
            <UserIcon size={64} color={isLight ? '#6B7280' : '#a0a0a0'} />
            <Text style={[styles.signInTitle, isLight && styles.signInTitleLight]}>Welcome to Vocadoo</Text>
            <Text style={[styles.signInSubtitle, isLight && styles.signInSubtitleLight]}>
              {showEmailAuth ? (isSignUp ? 'Create an account' : 'Sign in to your account') : 'Sign in to sync your progress across devices'}
            </Text>

            {showEmailAuth ? (
              <View style={styles.emailAuthForm}>
                {isSignUp && (
                  <>
                    {/* Avatar Selection */}
                    <View style={styles.avatarSection}>
                      <Text style={styles.avatarSectionTitle}>Choose Your Avatar</Text>
                      <View style={styles.avatarGrid}>
                        {AVATAR_OPTIONS.map((avatarOption) => (
                          <TouchableOpacity
                            key={avatarOption.id}
                            style={[
                              styles.avatarOption,
                              selectedAvatar === avatarOption.id && styles.avatarOptionSelected
                            ]}
                            onPress={() => setSelectedAvatar(avatarOption.id)}
                          >
                            <Image
                              source={avatarOption.source}
                              style={styles.avatarOptionImage}
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
                      <UserIcon size={20} color="#a0a0a0" style={styles.inputIcon} />
                      <TextInput
                        style={[styles.input, isLight && styles.inputLight]}
                        placeholder="Full Name"
                        placeholderTextColor={isLight ? '#9CA3AF' : '#666'}
                        value={fullName}
                        onChangeText={setFullName}
                        autoCapitalize="words"
                        autoCorrect={false}
                      />
                    </View>
                  </>
                )}

                <View style={[styles.inputContainer, isLight && styles.inputContainerLight]}>
                  <Mail size={20} color="#a0a0a0" style={styles.inputIcon} />
                  <TextInput
                    style={[styles.input, isLight && styles.inputLight]}
                    placeholder="Email"
                    placeholderTextColor={isLight ? '#9CA3AF' : '#666'}
                    value={email}
                    onChangeText={setEmail}
                    keyboardType="email-address"
                    autoCapitalize="none"
                    autoCorrect={false}
                  />
                </View>

                <View style={[styles.inputContainer, isLight && styles.inputContainerLight]}>
                  <Text style={styles.inputIcon}>🔒</Text>
                  <TextInput
                    style={[styles.input, isLight && styles.inputLight]}
                    placeholder="Password"
                    placeholderTextColor={isLight ? '#9CA3AF' : '#666'}
                    value={password}
                    onChangeText={setPassword}
                    secureTextEntry
                    autoCapitalize="none"
                  />
                </View>

                {isSignUp && (
                  <View style={[styles.inputContainer, isLight && styles.inputContainerLight]}>
                    <Text style={styles.inputIcon}>🔒</Text>
                    <TextInput
                      style={[styles.input, isLight && styles.inputLight]}
                      placeholder="Confirm Password"
                      placeholderTextColor={isLight ? '#9CA3AF' : '#666'}
                      value={confirmPassword}
                      onChangeText={setConfirmPassword}
                      secureTextEntry
                      autoCapitalize="none"
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
          </ScrollView>
        </View>
      </SafeAreaView>
    );
  }

  const userAvatar = user.avatar ?? DEFAULT_AVATAR;
  const safeXp = userProgress?.xp ?? user.xp ?? 0;
  const safeStreak = userProgress?.streak ?? user.streak ?? 0;
  const safeExercises = userProgress?.exercisesCompleted ?? user.exercisesCompleted ?? 0;

  // Get avatar source - either local image or remote URL
  const getAvatarSource = () => {
    if (user.avatarId && user.avatarId >= 1 && user.avatarId <= 6) {
      const avatarOption = AVATAR_OPTIONS.find(a => a.id === user.avatarId);
      return avatarOption ? avatarOption.source : { uri: DEFAULT_AVATAR };
    }
    return { uri: userAvatar };
  };

  return (
    <SafeAreaView style={[styles.container, isLight && styles.containerLight]}>
      <View style={[styles.header, isLight && styles.headerLight]}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <ArrowLeft size={24} color={isLight ? '#111827' : '#fff'} />
        </TouchableOpacity>
        <Text style={[styles.title, isLight && styles.titleLight]}>Profile</Text>
        <TouchableOpacity style={styles.signOutButton} onPress={handleSignOut}>
          <LogOut size={20} color="#a0a0a0" />
        </TouchableOpacity>
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

        {/* Appearance */}
        <View style={[styles.infoCard, isLight && styles.infoCardLight]}>
          <View style={styles.infoRow}>
            <Text style={[styles.infoLabel, isLight && styles.infoLabelLight]}>Theme</Text>
            <TouchableOpacity
              accessibilityRole="button"
              accessibilityLabel="Toggle theme"
              onPress={toggleTheme}
              activeOpacity={0.85}
              style={[styles.themeToggle, themeName === 'light' && styles.themeToggleActive, isLight && styles.themeToggleLight]}
            >
              <View style={[styles.themeThumb, themeName === 'light' && styles.themeThumbOn]} />
              <Text style={[styles.themeToggleText, isLight && styles.themeToggleTextLight]}>{themeName === 'light' ? 'Light' : 'Dark'}</Text>
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.statsContainer}>
          <View style={[styles.statCard, isLight && styles.statCardLight]}>
            <View style={[styles.statIcon, isLight && styles.statIconLight]}>
              <Star size={24} color="#F2AB27" />
            </View>
            <Text style={[styles.statValue, isLight && styles.statValueLight]}>{safeXp}</Text>
            <Text style={[styles.statLabel, isLight && styles.statLabelLight]}>Total XP</Text>
          </View>

          <View style={[styles.statCard, isLight && styles.statCardLight]}>
            <View style={[styles.statIcon, isLight && styles.statIconLight]}>
              <Award size={24} color="#4F8EF7" />
            </View>
            <Text style={[styles.statValue, isLight && styles.statValueLight]}>{safeExercises}</Text>
            <Text style={[styles.statLabel, isLight && styles.statLabelLight]}>Exercises</Text>
          </View>

          <View style={[styles.statCard, isLight && styles.statCardLight]}>
            <View style={[styles.statIcon, isLight && styles.statIconLight]}>
              <Calendar size={24} color="#6CC24A" />
            </View>
            <Text style={[styles.statValue, isLight && styles.statValueLight]}>{safeStreak}</Text>
            <Text style={[styles.statLabel, isLight && styles.statLabelLight]}>Day Streak</Text>
          </View>
        </View>

        <View style={[styles.infoCard, isLight && styles.infoCardLight]}>
          <View style={styles.infoRow}>
            <Mail size={18} color="#8a8a8a" />
            <Text style={[styles.infoLabel, isLight && styles.infoLabelLight]}>Email</Text>
            <Text style={[styles.infoValue, isLight && styles.infoValueLight]}>{user.email ?? 'Not provided'}</Text>
          </View>
          <View style={styles.infoRow}>
            <Calendar size={18} color="#8a8a8a" />
            <Text style={[styles.infoLabel, isLight && styles.infoLabelLight]}>Joined</Text>
            <Text style={[styles.infoValue, isLight && styles.infoValueLight]}>{formatDate(user.createdAt)}</Text>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#121315' },
  containerLight: { flex: 1, backgroundColor: '#F2E3D0' },
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
    backgroundColor: 'rgba(255,255,255,0.06)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  signOutButton: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.06)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  placeholder: { width: 44, height: 44 },
  content: { flex: 1, paddingHorizontal: 20 },
  profileCard: {
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderRadius: 20,
    padding: 20,
    alignItems: 'center',
    marginBottom: 24,
  },
  profileCardLight: { backgroundColor: '#F9F1E7' },
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
    backgroundColor: '#f59f46',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 16,
    shadowColor: '#f59f46',
    shadowOpacity: 0.4,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
  },
  levelText: { color: '#121315', fontWeight: '700', fontSize: 12 },
  userName: { color: '#fff', fontSize: 22, fontWeight: '700' },
  userNameLight: { color: '#111827' },
  userEmail: { color: '#9CA3AF', marginTop: 4 },
  xpContainer: { marginTop: 20, width: '100%' },
  xpLabel: { color: '#9CA3AF', fontSize: 12, marginBottom: 6 },
  xpLabelLight: { color: '#6B7280' },
  xpBar: {
    height: 10,
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderRadius: 6,
    overflow: 'hidden',
  },
  xpBarLight: { backgroundColor: '#E9E6E0' },
  xpProgress: { height: '100%', backgroundColor: '#4F8EF7' },
  xpText: { color: '#9CA3AF', marginTop: 6, fontSize: 12 },
  xpTextLight: { color: '#374151' },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 24,
  },
  statCard: {
    flex: 1,
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderRadius: 18,
    padding: 16,
    marginHorizontal: 6,
    alignItems: 'center',
    justifyContent: 'center',
  },
  statCardLight: { backgroundColor: '#F9F1E7' },
  statIcon: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.08)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  statIconLight: { backgroundColor: '#E9E6E0' },
  statContent: { flex: 1 },
  statValue: { color: '#fff', fontWeight: '700', fontSize: 18, textAlign: 'center', marginTop: 4 },
  statValueLight: { color: '#111827' },
  statLabel: { color: '#9CA3AF', fontSize: 11, marginTop: 4, textAlign: 'center' },
  statLabelLight: { color: '#6B7280' },
  infoCard: {
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderRadius: 18,
    padding: 16,
    marginBottom: 40,
  },
  infoCardLight: { backgroundColor: '#F9F1E7' },
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
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderRadius: 16,
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(255,255,255,0.12)'
  },
  themeToggleLight: {
    backgroundColor: '#E9E6E0',
    borderColor: '#D7D3CB',
  },
  themeToggleActive: {
    backgroundColor: 'rgba(242,147,92,0.18)',
    borderColor: 'rgba(242,147,92,0.45)'
  },
  themeThumb: {
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: '#9CA3AF',
  },
  themeThumbOn: {
    backgroundColor: '#F2935C',
  },
  themeToggleText: { color: '#E5E7EB', fontWeight: '700', fontSize: 12 },
  themeToggleTextLight: { color: '#374151' },
  signInContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'stretch',
    paddingHorizontal: 20,
  },
  signInContent: {
    width: '100%',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.05)',
    paddingHorizontal: 28,
    paddingVertical: 40,
    borderRadius: 20,
  },
  signInContentLight: { backgroundColor: '#F9F1E7' },
  signInTitle: { color: '#fff', fontSize: 20, fontWeight: '700', marginTop: 16 },
  signInTitleLight: { color: '#111827' },
  signInSubtitle: { color: '#9CA3AF', textAlign: 'center', marginTop: 8 },
  signInSubtitleLight: { color: '#4B5563' },
  signInButtons: { width: '100%', marginTop: 20 },
  signInButton: {
    backgroundColor: '#e28743',
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
    flexDirection: 'row',
    gap: 8,
  },
  googleButton: { backgroundColor: '#4F8EF7' },
  appleButton: { backgroundColor: '#1C1C1E' },
  signInButtonText: { color: '#fff', fontWeight: '600' },
  guestText: { color: '#6B7280', textAlign: 'center', marginTop: 16, fontSize: 12 },
  emailAuthForm: { width: '100%', marginTop: 20 },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderRadius: 12,
    marginBottom: 16,
    paddingHorizontal: 12,
  },
  inputContainerLight: { backgroundColor: '#E9E6E0' },
  inputIcon: { marginRight: 8 },
  input: {
    flex: 1,
    color: '#fff',
    paddingVertical: 14,
    fontSize: 16,
  },
  inputLight: { color: '#111827' },
  switchAuthText: {
    color: '#e28743',
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
    borderColor: 'rgba(255,255,255,0.1)',
    overflow: 'hidden',
    position: 'relative',
  },
  avatarOptionSelected: {
    borderColor: '#e28743',
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
    backgroundColor: '#e28743',
    borderRadius: 12,
    width: 24,
    height: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
});

import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
  Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { ArrowLeft, User, Mail, Star, Calendar, Award, LogOut } from 'lucide-react-native';
import { useAppStore } from '../lib/store';

export default function ProfileScreen() {
  const router = useRouter();
  const { user, setUser } = useAppStore();
  const [isSigningIn, setIsSigningIn] = useState(false);

  const handleGoogleSignIn = async () => {
    setIsSigningIn(true);
    try {
      // Mock Google sign-in - in production, implement Firebase Auth
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      const mockUser = {
        id: '2',
        name: 'John Doe',
        email: 'john.doe@gmail.com',
        avatar: 'https://via.placeholder.com/100',
        xp: 2500,
        streak: 15,
        exercisesCompleted: 78,
        createdAt: new Date(),
      };
      
      setUser(mockUser);
      Alert.alert('Success', 'Signed in with Google!');
    } catch (error) {
      Alert.alert('Error', 'Failed to sign in with Google');
    } finally {
      setIsSigningIn(false);
    }
  };

  const handleAppleSignIn = async () => {
    Alert.alert('Coming Soon', 'Apple Sign-In will be available in a future update');
  };

  const handleSignOut = () => {
    Alert.alert(
      'Sign Out',
      'Are you sure you want to sign out?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Sign Out',
          style: 'destructive',
          onPress: () => {
            setUser(null);
          },
        },
      ]
    );
  };

  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const getLevel = (xp: number) => {
    return Math.floor(xp / 1000) + 1;
  };

  const getXPProgress = (xp: number) => {
    const currentLevel = getLevel(xp);
    const currentLevelXP = (currentLevel - 1) * 1000;
    const nextLevelXP = currentLevel * 1000;
    const progress = ((xp - currentLevelXP) / (nextLevelXP - currentLevelXP)) * 100;
    return Math.min(100, Math.max(0, progress));
  };

  if (!user) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => router.back()}
          >
            <ArrowLeft size={24} color="#fff" />
          </TouchableOpacity>
          <Text style={styles.title}>Profile</Text>
          <View style={styles.placeholder} />
        </View>

        <View style={styles.signInContainer}>
          <View style={styles.signInContent}>
            <User size={64} color="#a0a0a0" />
            <Text style={styles.signInTitle}>Welcome to Engniter</Text>
            <Text style={styles.signInSubtitle}>
              Sign in to sync your progress across devices
            </Text>

            <View style={styles.signInButtons}>
              <TouchableOpacity
                style={[styles.signInButton, styles.googleButton]}
                onPress={handleGoogleSignIn}
                disabled={isSigningIn}
              >
                <Text style={styles.signInButtonText}>
                  {isSigningIn ? 'Signing in...' : 'Sign in with Google'}
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.signInButton, styles.appleButton]}
                onPress={handleAppleSignIn}
              >
                <Text style={styles.signInButtonText}>Sign in with Apple</Text>
              </TouchableOpacity>
            </View>

            <Text style={styles.guestText}>
              You can continue as a guest, but your progress won't be saved
            </Text>
          </View>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <ArrowLeft size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.title}>Profile</Text>
        <TouchableOpacity
          style={styles.signOutButton}
          onPress={handleSignOut}
        >
          <LogOut size={20} color="#a0a0a0" />
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.profileCard}>
          <View style={styles.avatarContainer}>
            <Image
              source={{ uri: user.avatar }}
              style={styles.avatar}
            />
            <View style={styles.levelBadge}>
              <Text style={styles.levelText}>Lv.{getLevel(user.xp)}</Text>
            </View>
          </View>

          <Text style={styles.userName}>{user.name}</Text>
          {user.email && (
            <Text style={styles.userEmail}>{user.email}</Text>
          )}

          <View style={styles.xpContainer}>
            <Text style={styles.xpLabel}>XP Progress</Text>
            <View style={styles.xpBar}>
              <View
                style={[
                  styles.xpProgress,
                  { width: `${getXPProgress(user.xp)}%` },
                ]}
              />
            </View>
            <Text style={styles.xpText}>
              {user.xp} XP • Level {getLevel(user.xp)}
            </Text>
          </View>
        </View>

        <View style={styles.statsContainer}>
          <View style={styles.statCard}>
            <View style={styles.statIcon}>
              <Star size={24} color="#F2AB27" />
            </View>
            <View style={styles.statContent}>
              <Text style={styles.statValue}>{user.xp}</Text>
              <Text style={styles.statLabel}>Total XP</Text>
            </View>
          </View>

          <View style={styles.statCard}>
            <View style={styles.statIcon}>
              <Calendar size={24} color="#4CAF50" />
            </View>
            <View style={styles.statContent}>
              <Text style={styles.statValue}>{user.streak}</Text>
              <Text style={styles.statLabel}>Day Streak</Text>
            </View>
          </View>

          <View style={styles.statCard}>
            <View style={styles.statIcon}>
              <Award size={24} color="#e28743" />
            </View>
            <View style={styles.statContent}>
              <Text style={styles.statValue}>{user.exercisesCompleted}</Text>
              <Text style={styles.statLabel}>Exercises</Text>
            </View>
          </View>
        </View>

        <View style={styles.infoContainer}>
          <View style={styles.infoCard}>
            <Text style={styles.infoTitle}>Account Information</Text>
            <View style={styles.infoItem}>
              <Text style={styles.infoLabel}>Member since</Text>
              <Text style={styles.infoValue}>
                {formatDate(user.createdAt)}
              </Text>
            </View>
            <View style={styles.infoItem}>
              <Text style={styles.infoLabel}>Current Level</Text>
              <Text style={styles.infoValue}>Level {getLevel(user.xp)}</Text>
            </View>
            <View style={styles.infoItem}>
              <Text style={styles.infoLabel}>Next Level</Text>
              <Text style={styles.infoValue}>
                {getLevel(user.xp) * 1000 - user.xp} XP needed
              </Text>
            </View>
          </View>
        </View>

        <View style={styles.achievementsContainer}>
          <Text style={styles.achievementsTitle}>Achievements</Text>
          <View style={styles.achievementsList}>
            <View style={styles.achievementItem}>
              <View style={[styles.achievementIcon, { backgroundColor: '#4CAF50' }]}>
                <Star size={20} color="#fff" />
              </View>
              <View style={styles.achievementContent}>
                <Text style={styles.achievementTitle}>First Steps</Text>
                <Text style={styles.achievementDescription}>
                  Complete your first exercise
                </Text>
              </View>
            </View>

            <View style={styles.achievementItem}>
              <View style={[styles.achievementIcon, { backgroundColor: '#F2AB27' }]}>
                <Calendar size={20} color="#fff" />
              </View>
              <View style={styles.achievementContent}>
                <Text style={styles.achievementTitle}>Streak Master</Text>
                <Text style={styles.achievementDescription}>
                  Maintain a 7-day streak
                </Text>
              </View>
            </View>

            <View style={styles.achievementItem}>
              <View style={[styles.achievementIcon, { backgroundColor: '#e28743' }]}>
                <Award size={20} color="#fff" />
              </View>
              <View style={styles.achievementContent}>
                <Text style={styles.achievementTitle}>Vocabulary Builder</Text>
                <Text style={styles.achievementDescription}>
                  Complete 50 exercises
                </Text>
              </View>
            </View>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#252525',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#2c2f2f',
  },
  backButton: {
    padding: 8,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
  },
  placeholder: {
    width: 40,
  },
  signOutButton: {
    padding: 8,
  },
  signInContainer: {
    flex: 1,
    justifyContent: 'center',
    padding: 20,
  },
  signInContent: {
    alignItems: 'center',
  },
  signInTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
    marginTop: 16,
    marginBottom: 8,
  },
  signInSubtitle: {
    fontSize: 16,
    color: '#a0a0a0',
    textAlign: 'center',
    marginBottom: 32,
  },
  signInButtons: {
    width: '100%',
    gap: 12,
    marginBottom: 24,
  },
  signInButton: {
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 12,
    alignItems: 'center',
  },
  googleButton: {
    backgroundColor: '#4285F4',
  },
  appleButton: {
    backgroundColor: '#000',
  },
  signInButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  guestText: {
    fontSize: 14,
    color: '#a0a0a0',
    textAlign: 'center',
  },
  content: {
    flex: 1,
    padding: 20,
  },
  profileCard: {
    backgroundColor: '#2c2f2f',
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
    marginBottom: 20,
  },
  avatarContainer: {
    position: 'relative',
    marginBottom: 16,
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
  },
  levelBadge: {
    position: 'absolute',
    bottom: -4,
    right: -4,
    backgroundColor: '#e28743',
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  levelText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  userName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 4,
  },
  userEmail: {
    fontSize: 16,
    color: '#a0a0a0',
    marginBottom: 20,
  },
  xpContainer: {
    width: '100%',
  },
  xpLabel: {
    fontSize: 14,
    color: '#a0a0a0',
    marginBottom: 8,
  },
  xpBar: {
    height: 8,
    backgroundColor: '#3A3A3A',
    borderRadius: 4,
    overflow: 'hidden',
    marginBottom: 8,
  },
  xpProgress: {
    height: '100%',
    backgroundColor: '#e28743',
    borderRadius: 4,
  },
  xpText: {
    fontSize: 12,
    color: '#a0a0a0',
    textAlign: 'center',
  },
  statsContainer: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 20,
  },
  statCard: {
    flex: 1,
    backgroundColor: '#2c2f2f',
    borderRadius: 12,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
  },
  statIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#3A3A3A',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  statContent: {
    flex: 1,
  },
  statValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
  },
  statLabel: {
    fontSize: 12,
    color: '#a0a0a0',
    marginTop: 2,
  },
  infoContainer: {
    marginBottom: 20,
  },
  infoCard: {
    backgroundColor: '#2c2f2f',
    borderRadius: 12,
    padding: 20,
  },
  infoTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 16,
  },
  infoItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
  },
  infoLabel: {
    fontSize: 14,
    color: '#a0a0a0',
  },
  infoValue: {
    fontSize: 14,
    color: '#fff',
    fontWeight: '600',
  },
  achievementsContainer: {
    marginBottom: 20,
  },
  achievementsTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 16,
  },
  achievementsList: {
    gap: 12,
  },
  achievementItem: {
    backgroundColor: '#2c2f2f',
    borderRadius: 12,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
  },
  achievementIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  achievementContent: {
    flex: 1,
  },
  achievementTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
    marginBottom: 2,
  },
  achievementDescription: {
    fontSize: 14,
    color: '#a0a0a0',
  },
});

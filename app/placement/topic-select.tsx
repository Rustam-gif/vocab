import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
  Easing,
  DeviceEventEmitter,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useAppStore } from '../../lib/store';
import { ChevronLeft } from 'lucide-react-native';
import LottieView from 'lottie-react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

const USER_FOCUS_KEY = '@engniter.onboarding.focus';

type TopicOption = {
  id: 'general' | 'travel' | 'business' | 'exams';
  title: string;
  description: string;
  animation: any;
};

const topicOptions: TopicOption[] = [
  {
    id: 'general',
    title: 'General English',
    description: 'Everyday conversations & common vocabulary',
    animation: require('../../assets/lottie/Onboarding/general.json'),
  },
  {
    id: 'travel',
    title: 'Travel & Tourism',
    description: 'Vocabulary for trips, hotels & directions',
    animation: require('../../assets/lottie/Onboarding/travel.json'),
  },
  {
    id: 'business',
    title: 'Business English',
    description: 'Professional communication & workplace terms',
    animation: require('../../assets/lottie/Onboarding/business.json'),
  },
  {
    id: 'exams',
    title: 'IELTS Preparation',
    description: 'Academic vocabulary & exam strategies',
    animation: require('../../assets/lottie/Onboarding/ielts.json'),
  },
];

export default function TopicSelect() {
  const router = useRouter();
  const themeName = useAppStore(s => s.theme);
  const isLight = themeName === 'light';

  const [selectedTopic, setSelectedTopic] = useState<string | null>(null);

  const fadeIn = useRef(new Animated.Value(0)).current;
  const slideUp = useRef(new Animated.Value(40)).current;
  const cardAnims = useRef(topicOptions.map(() => new Animated.Value(0))).current;
  const buttonAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    DeviceEventEmitter.emit('NAV_VISIBILITY', 'hide');
    return () => DeviceEventEmitter.emit('NAV_VISIBILITY', 'show');
  }, []);

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeIn, { toValue: 1, duration: 500, useNativeDriver: true }),
      Animated.timing(slideUp, { toValue: 0, duration: 500, easing: Easing.out(Easing.back(1.2)), useNativeDriver: true }),
    ]).start();

    cardAnims.forEach((anim, index) => {
      Animated.timing(anim, {
        toValue: 1,
        duration: 400,
        delay: 200 + index * 100,
        easing: Easing.out(Easing.back(1.5)),
        useNativeDriver: true,
      }).start();
    });
  }, [cardAnims, fadeIn, slideUp]);

  useEffect(() => {
    if (selectedTopic) {
      Animated.spring(buttonAnim, {
        toValue: 1,
        friction: 6,
        tension: 40,
        useNativeDriver: true,
      }).start();
    } else {
      Animated.timing(buttonAnim, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }).start();
    }
  }, [selectedTopic, buttonAnim]);

  const handleSelectTopic = (topicId: string) => {
    setSelectedTopic(topicId);
  };

  const handleContinue = async () => {
    if (!selectedTopic) return;

    try {
      await AsyncStorage.setItem(USER_FOCUS_KEY, selectedTopic);
      console.log('[TopicSelect] Saved user focus:', selectedTopic);

      // Emit event to notify Learn screen
      DeviceEventEmitter.emit('USER_FOCUS_CHANGED', selectedTopic);
    } catch (error) {
      console.error('[TopicSelect] Failed to save focus:', error);
    }

    // Navigate to level selection
    router.push('/placement/level-select');
  };

  const buttonOpacity = buttonAnim;
  const buttonScale = buttonAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0.9, 1],
  });

  return (
    <View style={[styles.container, isLight && styles.containerLight]}>
      <SafeAreaView style={styles.safe}>
        <Animated.View style={[styles.header, { opacity: fadeIn, transform: [{ translateY: slideUp }] }]}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
            <ChevronLeft size={24} color={isLight ? '#111827' : '#E5E7EB'} />
          </TouchableOpacity>
          <Text style={[styles.headerTitle, isLight && styles.headerTitleLight]}>Choose Your Focus</Text>
          <View style={{ width: 24 }} />
        </Animated.View>

        <Animated.Text style={[styles.subtitle, isLight && styles.subtitleLight, { opacity: fadeIn, transform: [{ translateY: slideUp }] }]}>
          Select what you want to learn. You can change this anytime.
        </Animated.Text>

        <View style={styles.cardsContainer}>
          {topicOptions.map((topic, index) => {
            const scale = cardAnims[index].interpolate({ inputRange: [0, 1], outputRange: [0.8, 1] });
            const isSelected = selectedTopic === topic.id;

            return (
              <Animated.View key={topic.id} style={{ opacity: cardAnims[index], transform: [{ scale }] }}>
                <TouchableOpacity
                  onPress={() => handleSelectTopic(topic.id)}
                  activeOpacity={0.85}
                  style={[
                    styles.card,
                    isLight && styles.cardLight,
                    isSelected && styles.cardSelected,
                    isSelected && isLight && styles.cardSelectedLight,
                  ]}
                >
                  <View style={styles.animationContainer}>
                    <LottieView
                      source={topic.animation}
                      autoPlay
                      loop
                      style={styles.animation}
                    />
                  </View>
                  <View style={styles.cardContent}>
                    <Text style={[styles.cardTitle, isLight && styles.cardTitleLight]}>{topic.title}</Text>
                    <Text style={[styles.cardDesc, isLight && styles.cardDescLight]}>{topic.description}</Text>
                  </View>
                  {isSelected && (
                    <View style={[styles.checkmark, isLight && styles.checkmarkLight]}>
                      <Text style={styles.checkmarkText}>✓</Text>
                    </View>
                  )}
                </TouchableOpacity>
              </Animated.View>
            );
          })}
        </View>

        {/* Continue Button */}
        <Animated.View style={{
          opacity: buttonOpacity,
          transform: [{ scale: buttonScale }],
          marginTop: 'auto',
          paddingTop: 20,
        }}>
          <TouchableOpacity
            onPress={handleContinue}
            disabled={!selectedTopic}
            activeOpacity={0.9}
            style={[
              styles.continueBtn,
              isLight && styles.continueBtnLight,
              !selectedTopic && styles.continueBtnDisabled,
            ]}
          >
            <Text style={[styles.continueBtnText, !selectedTopic && styles.continueBtnTextDisabled]}>
              Continue
            </Text>
          </TouchableOpacity>
        </Animated.View>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#1B263B' },
  containerLight: { backgroundColor: '#F8F8F8' },
  safe: { flex: 1, padding: 20 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 },
  headerTitle: { fontSize: 22, fontWeight: '800', color: '#E5E7EB', fontFamily: 'Ubuntu-Bold' },
  headerTitleLight: { color: '#111827' },
  backBtn: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center', borderRadius: 12, borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)' },
  subtitle: { fontSize: 14, color: '#9CA3AF', marginBottom: 16, fontFamily: 'Ubuntu-Regular' },
  subtitleLight: { color: '#2D4A66' },
  cardsContainer: { gap: 12, marginTop: 12 },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 14,
    backgroundColor: '#1B263B',
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
  cardSelected: {
    borderColor: '#4ED9CB',
    borderWidth: 2,
    backgroundColor: 'rgba(78, 217, 203, 0.1)',
  },
  cardSelectedLight: {
    borderColor: '#437F76',
    backgroundColor: 'rgba(67, 127, 118, 0.08)',
  },
  animationContainer: {
    width: 60,
    height: 60,
    marginRight: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  animation: {
    width: 60,
    height: 60,
  },
  cardContent: { flex: 1, gap: 4 },
  cardTitle: { fontSize: 16, fontWeight: '700', color: '#E5E7EB', fontFamily: 'Ubuntu-Bold' },
  cardTitleLight: { color: '#111827' },
  cardDesc: { fontSize: 13, color: '#9CA3AF', fontFamily: 'Ubuntu-Regular' },
  cardDescLight: { color: '#2D4A66' },
  checkmark: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#4ED9CB',
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkmarkLight: {
    backgroundColor: '#437F76',
  },
  checkmarkText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
  continueBtn: {
    backgroundColor: '#4ED9CB',
    paddingVertical: 16,
    borderRadius: 14,
    alignItems: 'center',
  },
  continueBtnLight: {
    backgroundColor: '#437F76',
  },
  continueBtnDisabled: {
    backgroundColor: 'rgba(78, 217, 203, 0.3)',
  },
  continueBtnText: {
    color: '#0D1117',
    fontWeight: '700',
    fontSize: 17,
    fontFamily: 'Ubuntu-Bold',
  },
  continueBtnTextDisabled: {
    color: 'rgba(255, 255, 255, 0.5)',
  },
});

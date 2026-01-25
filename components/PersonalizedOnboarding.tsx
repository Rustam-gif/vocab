import React, { useState, useRef, useEffect, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
  Dimensions,
  Platform,
  ScrollView,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import LottieView from 'lottie-react-native';
import { Check } from 'lucide-react-native';
import { useAppStore } from '../lib/store';
import { getTheme } from '../lib/theme';
import { LANGUAGES_WITH_FLAGS, Language } from '../lib/languages';
import { soundService } from '../services/SoundService';
import { DeviceEventEmitter } from 'react-native';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

type FocusType = 'business' | 'travel' | 'exams' | 'general';
type DailyGoal = 5 | 10 | 15;

interface Props {
  onComplete: () => void;
}

const FOCUS_OPTIONS: { id: FocusType; animation: any; title: string; subtitle: string }[] = [
  { id: 'business', animation: require('../assets/lottie/Onboarding/business.json'), title: 'Business & Professional', subtitle: 'Meetings, emails, presentations' },
  { id: 'travel', animation: require('../assets/lottie/Onboarding/travel.json'), title: 'Travel & Conversation', subtitle: 'Daily life, culture, social' },
  { id: 'exams', animation: require('../assets/lottie/Onboarding/ielts.json'), title: 'Exams (IELTS/TOEFL)', subtitle: 'Academic, formal writing' },
  { id: 'general', animation: require('../assets/lottie/Onboarding/general.json'), title: 'General Vocabulary', subtitle: 'Balanced mix of everything' },
];

const GOAL_OPTIONS: { value: DailyGoal; label: string; time: string; recommended?: boolean }[] = [
  { value: 5, label: '5', time: '3-5 min' },
  { value: 10, label: '10', time: '5-8 min', recommended: true },
  { value: 15, label: '15', time: '10-12 min' },
];

// Popular languages for quick selection
const POPULAR_LANGS = ['ru', 'es', 'zh', 'ar', 'de', 'fr', 'pt', 'ja', 'ko', 'tr', 'it', 'hi'];

export default function PersonalizedOnboarding({ onComplete }: Props) {
  const themeName = useAppStore(s => s.theme);
  const colors = getTheme(themeName);
  const setLanguagePreferences = useAppStore(s => s.setLanguagePreferences);
  const selectedLangs = useAppStore(s => s.languagePreferences);

  const [step, setStep] = useState(0); // 0: welcome, 1: language, 2: focus, 3: goal, 4: wordKnowledge, 5: forecast
  const [selectedFocus, setSelectedFocus] = useState<FocusType | null>(null);
  const [selectedGoal, setSelectedGoal] = useState<DailyGoal>(10);
  const [selectedLanguage, setSelectedLanguage] = useState<string | null>(selectedLangs?.[0] || null);
  const [selectedWords, setSelectedWords] = useState<Set<string>>(new Set());

  // Word knowledge data grouped by level
  const wordKnowledgeData = {
    beginner: ['happy', 'friend', 'beautiful', 'different', 'important', 'together'],
    intermediate: ['confident', 'ambitious', 'accomplish', 'remarkable', 'determine', 'generous'],
    advanced: ['ephemeral', 'ubiquitous', 'juxtapose', 'pragmatic', 'eloquent', 'resilient'],
  };

  const toggleWord = (word: string) => {
    setSelectedWords(prev => {
      const next = new Set(prev);
      if (next.has(word)) {
        next.delete(word);
      } else {
        next.add(word);
      }
      return next;
    });
  };

  // Determine user level based on selections
  const determinedLevel = useMemo(() => {
    const beginnerKnown = wordKnowledgeData.beginner.filter(w => selectedWords.has(w)).length;
    const intermediateKnown = wordKnowledgeData.intermediate.filter(w => selectedWords.has(w)).length;
    const advancedKnown = wordKnowledgeData.advanced.filter(w => selectedWords.has(w)).length;

    if (advancedKnown >= 2) return 'Advanced';
    if (intermediateKnown >= 1) return 'Intermediate';
    return 'Beginner';
  }, [selectedWords]);

  const fadeAnim = useRef(new Animated.Value(1)).current;
  const slideAnim = useRef(new Animated.Value(0)).current;
  const rocketAnim = useRef(new Animated.Value(0)).current;
  const starAnim1 = useRef(new Animated.Value(0)).current;
  const starAnim2 = useRef(new Animated.Value(0.5)).current;
  const starAnim3 = useRef(new Animated.Value(1)).current;

  // Animated counters for forecast
  const monthlyCount = useRef(new Animated.Value(0)).current;
  const yearlyCount = useRef(new Animated.Value(0)).current;
  const [displayMonthly, setDisplayMonthly] = useState(0);
  const [displayYearly, setDisplayYearly] = useState(0);

  // Popular languages with flags
  const popularLanguages = useMemo(() => {
    return LANGUAGES_WITH_FLAGS.filter(l => POPULAR_LANGS.includes(l.code));
  }, []);

  // All languages sorted
  const allLanguages = useMemo(() => {
    return LANGUAGES_WITH_FLAGS.sort((a, b) => a.name.localeCompare(b.name));
  }, []);

  // Twinkling stars animation
  useEffect(() => {
    const twinkle = (anim: Animated.Value, delay: number) => {
      Animated.loop(
        Animated.sequence([
          Animated.timing(anim, { toValue: 1, duration: 800, useNativeDriver: true, delay }),
          Animated.timing(anim, { toValue: 0.2, duration: 800, useNativeDriver: true }),
          Animated.timing(anim, { toValue: 0.8, duration: 600, useNativeDriver: true }),
          Animated.timing(anim, { toValue: 0.1, duration: 700, useNativeDriver: true }),
        ])
      ).start();
    };
    twinkle(starAnim1, 0);
    twinkle(starAnim2, 300);
    twinkle(starAnim3, 600);
  }, []);

  // Rocket floating animation
  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(rocketAnim, { toValue: 1, duration: 2000, useNativeDriver: true }),
        Animated.timing(rocketAnim, { toValue: 0, duration: 2000, useNativeDriver: true }),
      ])
    ).start();
  }, []);

  // Forecast counter animation
  useEffect(() => {
    if (step === 5) {
      const monthly = selectedGoal * 30;
      const yearly = selectedGoal * 365;

      monthlyCount.setValue(0);
      yearlyCount.setValue(0);

      Animated.timing(monthlyCount, {
        toValue: monthly,
        duration: 1500,
        useNativeDriver: false,
      }).start();

      Animated.timing(yearlyCount, {
        toValue: yearly,
        duration: 2000,
        useNativeDriver: false,
      }).start();

      const monthListener = monthlyCount.addListener(({ value }) => setDisplayMonthly(Math.floor(value)));
      const yearListener = yearlyCount.addListener(({ value }) => setDisplayYearly(Math.floor(value)));

      return () => {
        monthlyCount.removeListener(monthListener);
        yearlyCount.removeListener(yearListener);
      };
    }
  }, [step, selectedGoal]);

  const animateToNextStep = (nextStep: number) => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: -50,
        duration: 200,
        useNativeDriver: true,
      }),
    ]).start(() => {
      setStep(nextStep);
      slideAnim.setValue(50);
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.timing(slideAnim, {
          toValue: 0,
          duration: 300,
          useNativeDriver: true,
        }),
      ]).start();
    });
  };

  const handleLanguageSelect = async (code: string) => {
    setSelectedLanguage(code);
    try {
      await setLanguagePreferences([code]);
    } catch {}
  };

  const handleComplete = async () => {
    try {
      // Map determined level to level IDs used in the app
      const levelIdMap: Record<string, string> = {
        'Beginner': 'beginner',
        'Intermediate': 'intermediate',
        'Advanced': 'advanced',
      };
      const selectedLevelId = levelIdMap[determinedLevel] || 'beginner';

      await AsyncStorage.multiSet([
        ['@engniter.onboarding.completed', 'true'],
        ['@engniter.onboarding.focus', selectedFocus || 'general'],
        ['@engniter.onboarding.dailyGoal', String(selectedGoal)],
        ['@engniter.onboarding.level', determinedLevel],
        ['@engniter.selectedLevel', selectedLevelId], // Set the Learn screen level
        ['@engniter.highestLevel', selectedLevelId], // Set highest level unlocked
        ['@engniter.onboarding.completedAt', new Date().toISOString()],
      ]);
      console.log('=== ONBOARDING SAVED ===', { focus: selectedFocus, goal: selectedGoal, language: selectedLanguage, level: determinedLevel, selectedLevelId });

      // Emit events to notify Learn screen to reload level and focus
      DeviceEventEmitter.emit('LEVEL_SELECTED', selectedLevelId);
      DeviceEventEmitter.emit('USER_FOCUS_CHANGED', selectedFocus || 'general');
    } catch (e) {
      console.error('Failed to save onboarding:', e);
    }
    onComplete();
  };

  const canContinue = () => {
    if (step === 1) return !!selectedLanguage;
    if (step === 2) return !!selectedFocus;
    if (step === 4) return selectedWords.size > 0; // Require at least 1 word selected
    return true;
  };

  const rocketTranslateY = rocketAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, -15],
  });

  // Background stars
  const renderStars = () => (
    <>
      <Animated.Text style={[styles.star, { top: '10%', left: '15%', opacity: starAnim1 }]}>✦</Animated.Text>
      <Animated.Text style={[styles.star, { top: '8%', right: '20%', opacity: starAnim2, fontSize: 8 }]}>✧</Animated.Text>
      <Animated.Text style={[styles.star, { top: '25%', left: '8%', opacity: starAnim3, fontSize: 10 }]}>✦</Animated.Text>
      <Animated.Text style={[styles.star, { top: '15%', right: '10%', opacity: starAnim1, fontSize: 6 }]}>·</Animated.Text>
      <Animated.Text style={[styles.star, { top: '30%', right: '25%', opacity: starAnim2, fontSize: 12 }]}>✦</Animated.Text>
      <Animated.Text style={[styles.star, { bottom: '35%', left: '12%', opacity: starAnim3, fontSize: 8 }]}>✧</Animated.Text>
      <Animated.Text style={[styles.star, { bottom: '40%', right: '15%', opacity: starAnim1, fontSize: 10 }]}>✦</Animated.Text>
      <Animated.Text style={[styles.star, { bottom: '30%', left: '25%', opacity: starAnim2, fontSize: 6 }]}>·</Animated.Text>
    </>
  );

  // Step 0: Welcome
  const renderWelcome = () => (
    <View style={styles.stepContainer}>
      <Animated.View style={{ transform: [{ translateY: rocketTranslateY }] }}>
        <LottieView
          source={require('../assets/lottie/learn/planets/space_craft.json')}
          autoPlay
          loop
          speed={0.5}
          style={styles.welcomeRocket}
        />
      </Animated.View>
      <Text style={styles.welcomeTitle}>Welcome to Vocadoo</Text>
      <Text style={styles.welcomeSubtitle}>
        Your personal vocabulary journey begins here. Let us customize your experience in just a few steps.
      </Text>
    </View>
  );

  // Step 1: Language Selection
  const renderLanguageStep = () => (
    <View style={{ flex: 1 }}>
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={styles.langScrollContent}
        showsVerticalScrollIndicator={true}
        bounces={true}
      >
        <LottieView
          source={require('../assets/lottie/Onboarding/LanguageTranslator.json')}
          autoPlay
          loop={false}
          style={styles.langAnimation}
        />
        <Text style={styles.stepTitle}>What is your native language?</Text>
        <Text style={styles.stepSubtitle}>We will show translations while you learn</Text>

        <Text style={styles.sectionLabel}>POPULAR</Text>
        <View style={styles.langGridContainer}>
          {popularLanguages.map((lang) => (
            <TouchableOpacity
              key={lang.code}
              style={[
                styles.langChip,
                selectedLanguage === lang.code && styles.langChipSelected,
              ]}
              onPress={() => handleLanguageSelect(lang.code)}
              activeOpacity={0.8}
            >
              <Text style={styles.langFlag}>{lang.flag}</Text>
              <Text style={[
                styles.langName,
                selectedLanguage === lang.code && styles.langNameSelected,
              ]}>{lang.name}</Text>
              {selectedLanguage === lang.code && (
                <Check size={16} color="#F8B070" style={{ marginLeft: 4 }} />
              )}
            </TouchableOpacity>
          ))}
        </View>

        <Text style={[styles.sectionLabel, { marginTop: 20 }]}>ALL LANGUAGES</Text>
        {allLanguages.filter(l => !POPULAR_LANGS.includes(l.code)).map((lang) => (
          <TouchableOpacity
            key={lang.code}
            style={[
              styles.langRow,
              selectedLanguage === lang.code && styles.langRowSelected,
            ]}
            onPress={() => handleLanguageSelect(lang.code)}
            activeOpacity={0.8}
          >
            <Text style={styles.langFlag}>{lang.flag}</Text>
            <Text style={[
              styles.langRowName,
              selectedLanguage === lang.code && styles.langNameSelected,
            ]}>{lang.name}</Text>
            {selectedLanguage === lang.code && (
              <Check size={16} color="#F8B070" />
            )}
          </TouchableOpacity>
        ))}

        <View style={{ height: 20 }} />
      </ScrollView>
    </View>
  );

  // Step 2: Focus Selection
  const renderFocusStep = () => (
    <View style={styles.stepContainer}>
      <LottieView
        source={require('../assets/lottie/learn/planets/colorful_planet.json')}
        autoPlay
        loop
        speed={0.5}
        style={styles.stepAnimationSmall}
      />
      <Text style={styles.stepTitle}>What do you want to focus on?</Text>
      <Text style={styles.stepSubtitle}>We will personalize your learning path</Text>

      <View style={styles.focusContainer}>
        {FOCUS_OPTIONS.map((option) => (
          <TouchableOpacity
            key={option.id}
            style={[
              styles.focusCard,
              selectedFocus === option.id && styles.focusCardSelected,
            ]}
            onPress={() => setSelectedFocus(option.id)}
            activeOpacity={0.8}
          >
            <View style={styles.focusAnimationContainer}>
              <LottieView
                source={option.animation}
                autoPlay
                loop
                style={styles.focusAnimation}
              />
            </View>
            <View style={styles.focusTextContainer}>
              <Text style={[
                styles.focusTitle,
                selectedFocus === option.id && styles.focusTitleSelected,
              ]}>{option.title}</Text>
              <Text style={styles.focusSubtitle}>{option.subtitle}</Text>
            </View>
            {selectedFocus === option.id && (
              <View style={styles.checkmark}>
                <Check size={14} color="#FFFFFF" />
              </View>
            )}
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );

  // Step 3: Goal Selection
  const renderGoalStep = () => (
    <View style={styles.stepContainer}>
      <LottieView
        source={require('../assets/lottie/Onboarding/Goal Achieved.json')}
        autoPlay
        loop={false}
        style={styles.stepAnimation}
      />
      <Text style={styles.stepTitle}>Daily word goal</Text>
      <Text style={styles.stepSubtitle}>How many words per day?</Text>

      <View style={styles.goalContainer}>
        {GOAL_OPTIONS.map((option) => (
          <TouchableOpacity
            key={option.value}
            style={[
              styles.goalCard,
              selectedGoal === option.value && styles.goalCardSelected,
            ]}
            onPress={() => setSelectedGoal(option.value)}
            activeOpacity={0.8}
          >
            {option.recommended && (
              <View style={styles.recommendedBadge}>
                <Text style={styles.recommendedText}>Best</Text>
              </View>
            )}
            <Text style={[
              styles.goalValue,
              selectedGoal === option.value && styles.goalValueSelected,
            ]}>{option.label}</Text>
            <Text style={styles.goalLabel}>words</Text>
            <Text style={styles.goalTime}>{option.time}</Text>
            {selectedGoal === option.value && (
              <View style={styles.goalCheckmark}>
                <Check size={12} color="#FFFFFF" />
              </View>
            )}
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );

  // Step 4: Word Knowledge Assessment
  const renderWordKnowledge = () => (
    <View style={{ flex: 1 }}>
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ alignItems: 'center', paddingBottom: 20 }}
        showsVerticalScrollIndicator={false}
      >
        <LottieView
          source={require('../assets/lottie/learn/planets/colorful_planet.json')}
          autoPlay
          loop
          speed={0.5}
          style={{ width: 100, height: 100, marginBottom: 8 }}
        />
        <Text style={styles.stepTitle}>What's your vocabulary level?</Text>
        <Text style={styles.stepSubtitle}>Select the words you know</Text>

        {/* All Words Combined */}
        <View style={styles.wordGrid}>
          {[...wordKnowledgeData.beginner, ...wordKnowledgeData.intermediate, ...wordKnowledgeData.advanced].map((word) => {
            const isSelected = selectedWords.has(word);
            return (
              <TouchableOpacity
                key={word}
                style={[styles.wordChip, isSelected && styles.wordChipSelected]}
                onPress={() => toggleWord(word)}
                activeOpacity={0.8}
              >
                <Text style={[styles.wordChipText, isSelected && styles.wordChipTextSelected]}>
                  {word}
                </Text>
                {isSelected && <Check size={14} color="#4ED9CB" style={{ marginLeft: 4 }} />}
              </TouchableOpacity>
            );
          })}
        </View>

        <Text style={styles.wordHint}>Tap words you know • {selectedWords.size} selected</Text>
      </ScrollView>
    </View>
  );

  // Step 5: Forecast
  const renderForecast = () => {
    const dailyMins = selectedGoal === 5 ? '3-5' : selectedGoal === 10 ? '5-8' : '10-12';

    return (
      <View style={styles.stepContainer}>
        <Animated.View style={{ transform: [{ translateY: rocketTranslateY }] }}>
          <LottieView
            source={require('../assets/lottie/learn/planets/space_craft.json')}
            autoPlay
            loop
            speed={0.5}
            style={styles.forecastRocket}
          />
        </Animated.View>
        <Text style={styles.stepTitle}>Your Learning Forecast</Text>
        <Text style={styles.stepSubtitle}>Just {dailyMins} minutes a day</Text>

        <View style={styles.forecastContainer}>
          <View style={styles.forecastCard}>
            <Text style={styles.forecastNumber}>{displayMonthly}</Text>
            <Text style={styles.forecastLabel}>words/month</Text>
          </View>

          <View style={styles.forecastCard}>
            <Text style={styles.forecastNumber}>{displayYearly.toLocaleString()}</Text>
            <Text style={styles.forecastLabel}>words/year</Text>
          </View>
        </View>

        <View style={styles.motivationBox}>
          <Text style={styles.motivationText}>
            Consistency beats intensity. Small daily practice leads to big results!
          </Text>
        </View>
      </View>
    );
  };

  const steps = [renderWelcome, renderLanguageStep, renderFocusStep, renderGoalStep, renderWordKnowledge, renderForecast];

  return (
    <View style={styles.container}>
      {/* Background stars */}
      {renderStars()}

      {/* Progress indicator */}
      <View style={styles.progressContainer}>
        {[0, 1, 2, 3, 4, 5].map((s) => (
          <View
            key={s}
            style={[
              styles.progressDot,
              s === step && styles.progressDotActive,
              s < step && styles.progressDotCompleted,
            ]}
          />
        ))}
      </View>

      {/* Content */}
      <Animated.View
        style={[
          styles.content,
          {
            opacity: fadeAnim,
            transform: [{ translateX: slideAnim }],
          },
        ]}
      >
        {steps[step]()}
      </Animated.View>

      {/* Footer */}
      <View style={styles.footer}>
        <TouchableOpacity
          style={[
            styles.continueButton,
            !canContinue() && styles.continueButtonDisabled,
          ]}
          onPress={() => {
            soundService.playTabSwitch();
            if (step < 5) {
              animateToNextStep(step + 1);
            } else {
              handleComplete();
            }
          }}
          disabled={!canContinue()}
          activeOpacity={0.8}
        >
          <Text style={styles.continueButtonText}>
            {step === 0 ? 'Get Started' : step === 5 ? "Let's Go!" : 'Continue'}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1A2744',
    paddingTop: Platform.OS === 'ios' ? 60 : 40,
  },
  star: {
    position: 'absolute',
    fontSize: 12,
    color: '#FFD60A',
    zIndex: 0,
  },
  progressContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
    paddingHorizontal: 24,
    marginBottom: 20,
  },
  progressDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: 'rgba(255,255,255,0.2)',
  },
  progressDotActive: {
    backgroundColor: '#F8B070',
    width: 24,
  },
  progressDotCompleted: {
    backgroundColor: '#4ED9CB',
  },
  content: {
    flex: 1,
    paddingHorizontal: 24,
  },
  stepContainer: {
    flex: 1,
    alignItems: 'center',
  },
  // Welcome step
  welcomeRocket: {
    width: 200,
    height: 200,
    marginBottom: 24,
  },
  welcomeTitle: {
    fontSize: 32,
    fontWeight: '700',
    color: '#FFFFFF',
    textAlign: 'center',
    fontFamily: 'Feather-Bold',
    marginBottom: 16,
  },
  welcomeSubtitle: {
    fontSize: 17,
    color: '#9CA3AF',
    textAlign: 'center',
    lineHeight: 26,
    fontFamily: 'Feather-Bold',
    paddingHorizontal: 20,
  },
  // Step common styles
  stepAnimation: {
    width: 180,
    height: 180,
    marginBottom: 16,
  },
  stepAnimationSmall: {
    width: 120,
    height: 120,
    marginBottom: 16,
  },
  stepTitle: {
    fontSize: 26,
    fontWeight: '700',
    color: '#FFFFFF',
    textAlign: 'center',
    fontFamily: 'Feather-Bold',
    marginBottom: 8,
  },
  stepSubtitle: {
    fontSize: 16,
    color: '#9CA3AF',
    textAlign: 'center',
    marginBottom: 24,
    fontFamily: 'Feather-Bold',
  },
  // Language step
  sectionLabel: {
    alignSelf: 'flex-start',
    fontSize: 13,
    fontWeight: '600',
    color: '#6B7280',
    marginBottom: 12,
    marginTop: 8,
    fontFamily: 'Feather-Bold',
    letterSpacing: 1,
  },
  langScrollContent: {
    alignItems: 'center',
    paddingBottom: 20,
  },
  langAnimation: {
    width: 160,
    height: 160,
    marginBottom: 12,
  },
  langGridContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    justifyContent: 'center',
    paddingHorizontal: 8,
  },
  langChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 24,
    backgroundColor: '#1B263B',
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.1)',
    minWidth: 140,
    justifyContent: 'center',
  },
  langChipSelected: {
    borderColor: '#F8B070',
    backgroundColor: 'rgba(248,176,112,0.15)',
  },
  langFlag: {
    fontSize: 20,
    marginRight: 8,
  },
  langName: {
    fontSize: 15,
    fontWeight: '600',
    color: '#FFFFFF',
    fontFamily: 'Feather-Bold',
  },
  langNameSelected: {
    color: '#F8B070',
  },
    langRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    marginBottom: 8,
    backgroundColor: '#1B263B',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.06)',
  },
  langRowSelected: {
    borderColor: '#F8B070',
    backgroundColor: 'rgba(248,176,112,0.1)',
  },
  langRowName: {
    flex: 1,
    fontSize: 15,
    fontWeight: '600',
    color: '#FFFFFF',
    fontFamily: 'Feather-Bold',
    marginLeft: 4,
  },
  // Focus step
  focusContainer: {
    width: '100%',
    gap: 12,
  },
  focusCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 16,
    backgroundColor: '#1B263B',
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  focusCardSelected: {
    borderColor: '#F8B070',
    backgroundColor: 'rgba(248,176,112,0.12)',
  },
  focusAnimationContainer: {
    width: 60,
    height: 60,
    marginRight: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  focusAnimation: {
    width: 60,
    height: 60,
  },
  focusTextContainer: {
    flex: 1,
  },
  focusTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
    fontFamily: 'Feather-Bold',
    marginBottom: 2,
  },
  focusTitleSelected: {
    color: '#F8B070',
  },
  focusSubtitle: {
    fontSize: 13,
    color: '#9CA3AF',
    fontFamily: 'Feather-Bold',
  },
  checkmark: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#F8B070',
    alignItems: 'center',
    justifyContent: 'center',
  },
  // Goal step
  goalContainer: {
    flexDirection: 'row',
    gap: 14,
    justifyContent: 'center',
  },
  goalCard: {
    alignItems: 'center',
    paddingVertical: 24,
    paddingHorizontal: 28,
    borderRadius: 20,
    backgroundColor: '#1B263B',
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.1)',
    position: 'relative',
  },
  goalCardSelected: {
    borderColor: '#F8B070',
    backgroundColor: 'rgba(248,176,112,0.12)',
  },
  goalValue: {
    fontSize: 36,
    fontWeight: '700',
    color: '#FFFFFF',
    fontFamily: 'Feather-Bold',
  },
  goalValueSelected: {
    color: '#F8B070',
  },
  goalLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#9CA3AF',
    marginTop: 2,
    fontFamily: 'Feather-Bold',
  },
  goalTime: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 8,
    fontFamily: 'Feather-Bold',
  },
  recommendedBadge: {
    position: 'absolute',
    top: -10,
    backgroundColor: '#4ED9CB',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 10,
  },
  recommendedText: {
    color: '#0D1B2A',
    fontSize: 11,
    fontWeight: '700',
    fontFamily: 'Feather-Bold',
  },
  goalCheckmark: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#F8B070',
    alignItems: 'center',
    justifyContent: 'center',
  },
  // Forecast step
  forecastRocket: {
    width: 140,
    height: 140,
    marginBottom: 16,
  },
  forecastContainer: {
    flexDirection: 'row',
    gap: 16,
    marginBottom: 24,
  },
  forecastCard: {
    flex: 1,
    alignItems: 'center',
    padding: 24,
    borderRadius: 20,
    backgroundColor: '#1B263B',
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  forecastNumber: {
    fontSize: 38,
    fontWeight: '700',
    color: '#F8B070',
    fontFamily: 'Feather-Bold',
  },
  forecastLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#9CA3AF',
    marginTop: 4,
    fontFamily: 'Feather-Bold',
  },
  motivationBox: {
    backgroundColor: 'rgba(78,217,203,0.15)',
    padding: 20,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(78,217,203,0.3)',
  },
  motivationText: {
    fontSize: 15,
    color: '#4ED9CB',
    textAlign: 'center',
    lineHeight: 24,
    fontFamily: 'Feather-Bold',
  },
  // Footer
  footer: {
    paddingHorizontal: 24,
    paddingBottom: Platform.OS === 'ios' ? 40 : 24,
    alignItems: 'center',
  },
  continueButton: {
    width: '100%',
    paddingVertical: 18,
    borderRadius: 16,
    backgroundColor: '#F25E86',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: '#0D1B2A',
    shadowColor: '#000',
    shadowOpacity: 0.4,
    shadowRadius: 0,
    shadowOffset: { width: 2, height: 3 },
    elevation: 6,
  },
  continueButtonDisabled: {
    opacity: 0.5,
  },
  continueButtonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '700',
    fontFamily: 'Feather-Bold',
  },
  // Word Knowledge styles
  wordSectionTitle: {
    alignSelf: 'flex-start',
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
    fontFamily: 'Feather-Bold',
    marginTop: 16,
    marginBottom: 10,
    marginLeft: 4,
  },
  wordGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    justifyContent: 'center',
    paddingHorizontal: 4,
    width: '100%',
  },
  wordChip: {
    paddingHorizontal: 18,
    paddingVertical: 12,
    borderRadius: 24,
    backgroundColor: '#1B263B',
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    flexDirection: 'row',
    alignItems: 'center',
    borderBottomWidth: 3,
    borderRightWidth: 3,
    borderBottomColor: 'rgba(78, 217, 203, 0.1)',
    borderRightColor: 'rgba(78, 217, 203, 0.08)',
  },
  wordChipSelected: {
    backgroundColor: 'rgba(78, 217, 203, 0.15)',
    borderColor: '#4ED9CB',
    borderBottomColor: '#4ED9CB',
    borderRightColor: '#4ED9CB',
  },
  wordChipText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '600',
    fontFamily: 'Feather-Bold',
  },
  wordChipTextSelected: {
    color: '#4ED9CB',
  },
  wordHint: {
    marginTop: 20,
    color: '#9CA3AF',
    fontSize: 13,
    fontFamily: 'Feather-Bold',
    textAlign: 'center',
  },
});

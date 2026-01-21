import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
  Animated,
  Modal,
  ScrollView,
  LayoutAnimation,
  Platform,
  UIManager,
} from 'react-native';
import { Volume2, Bookmark, Check, Globe, ChevronRight } from 'lucide-react-native';
import LottieView from 'lottie-react-native';
import Speech from '../../../lib/speech';
import { useRouter } from 'expo-router';
import { useAppStore } from '../../../lib/store';
import { getTheme } from '../../../lib/theme';
import { levels } from '../data/levels';
import AnimatedNextButton from './AnimatedNextButton';
import { TranslationService } from '../../../services/TranslationService';

interface WordIntroProps {
  setId: string;
  levelId: string;
  onComplete: () => void;
}

interface Word {
  word: string;
  definition: string;
  example: string;
  phonetic: string;
  synonyms: string[];
}

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');
const CARD_MARGIN = 24;
const CARD_WIDTH = SCREEN_WIDTH - CARD_MARGIN * 2;

// Colors
const ACCENT_ORANGE = '#F8B070';
const ACCENT_TEAL = '#4ED9CB';
const ACCENT_PINK = '#F25E86';
const SUCCESS_GREEN = '#437F76';
const DARK_BG = '#1B263B';
const CARD_BG = '#0D1B2A';
const CARD_BORDER = 'rgba(78, 217, 203, 0.15)';

// Enable LayoutAnimation for Android
if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

// Use local haptic feedback shim (no-op since native module not available)
import ReactNativeHapticFeedback from '../../../lib/haptics';

// Safe haptic feedback helper - with intensity levels
const triggerCelebrationHaptic = (type: 'pop' | 'medium' | 'heavy' | 'success' | 'soft' = 'pop') => {
  if (Platform.OS !== 'ios') return;
  const options = { enableVibrateFallback: false, ignoreAndroidSystemSettings: false };
  switch (type) {
    case 'pop':
      ReactNativeHapticFeedback.trigger('impactLight', options);
      break;
    case 'medium':
      ReactNativeHapticFeedback.trigger('impactMedium', options);
      break;
    case 'heavy':
      ReactNativeHapticFeedback.trigger('impactHeavy', options);
      break;
    case 'success':
      ReactNativeHapticFeedback.trigger('notificationSuccess', options);
      break;
    case 'soft':
      ReactNativeHapticFeedback.trigger('selection', options);
      break;
  }
};

// Result screen component with auto-transition
function ResultScreen({
  wordsCount,
  isLight,
  onComplete
}: {
  wordsCount: number;
  isLight: boolean;
  onComplete: () => void;
}) {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.9)).current;
  const exitScaleAnim = useRef(new Animated.Value(1)).current;
  const hasTransitioned = useRef(false);

  useEffect(() => {
    // Entry animation - fade in and scale up
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 500,
        useNativeDriver: true,
      }),
      Animated.spring(scaleAnim, {
        toValue: 1,
        friction: 8,
        tension: 50,
        useNativeDriver: true,
      }),
    ]).start();

    // Celebratory haptic pattern - extended fireworks celebration!
    // 3-4x longer and more intense with medium/heavy impacts
    const hapticPattern = [
      // Phase 1: Rocket ignition (0-600ms)
      { delay: 0, type: 'medium' as const },
      { delay: 120, type: 'pop' as const },
      { delay: 240, type: 'medium' as const },
      { delay: 360, type: 'pop' as const },
      { delay: 480, type: 'medium' as const },
      { delay: 600, type: 'heavy' as const },

      // Phase 2: Liftoff rumble (800-1600ms)
      { delay: 800, type: 'medium' as const },
      { delay: 950, type: 'pop' as const },
      { delay: 1100, type: 'medium' as const },
      { delay: 1250, type: 'pop' as const },
      { delay: 1400, type: 'medium' as const },
      { delay: 1550, type: 'heavy' as const },

      // Phase 3: Ascending excitement (1800-2800ms)
      { delay: 1800, type: 'pop' as const },
      { delay: 1950, type: 'medium' as const },
      { delay: 2100, type: 'pop' as const },
      { delay: 2250, type: 'medium' as const },
      { delay: 2400, type: 'pop' as const },
      { delay: 2550, type: 'medium' as const },
      { delay: 2700, type: 'heavy' as const },

      // Phase 4: Fireworks burst (3000-4200ms)
      { delay: 3000, type: 'medium' as const },
      { delay: 3100, type: 'pop' as const },
      { delay: 3200, type: 'medium' as const },
      { delay: 3300, type: 'pop' as const },
      { delay: 3400, type: 'medium' as const },
      { delay: 3500, type: 'heavy' as const },
      { delay: 3650, type: 'pop' as const },
      { delay: 3800, type: 'medium' as const },
      { delay: 3950, type: 'pop' as const },
      { delay: 4100, type: 'heavy' as const },

      // Phase 5: Grand finale crescendo (4400-5500ms)
      { delay: 4400, type: 'medium' as const },
      { delay: 4500, type: 'medium' as const },
      { delay: 4600, type: 'heavy' as const },
      { delay: 4750, type: 'medium' as const },
      { delay: 4900, type: 'heavy' as const },
      { delay: 5050, type: 'medium' as const },
      { delay: 5200, type: 'heavy' as const },
      { delay: 5350, type: 'heavy' as const },
      { delay: 5500, type: 'success' as const },
    ];

    const timeouts = hapticPattern.map(({ delay, type }) =>
      setTimeout(() => triggerCelebrationHaptic(type), delay)
    );

    return () => timeouts.forEach(t => clearTimeout(t));
  }, []);

  const handleAnimationFinish = () => {
    if (hasTransitioned.current) return;
    hasTransitioned.current = true;

    // Call onComplete immediately - no delay
    onComplete();
  };

  return (
    <Animated.View
      style={[
        styles.container,
        styles.resultContainer,
        isLight && styles.containerLight,
        {
          opacity: fadeAnim,
          transform: [
            { scale: Animated.multiply(scaleAnim, exitScaleAnim) },
          ],
        },
      ]}
    >
      <View style={styles.resultContent}>
        <View style={styles.rocketWrap}>
          <LottieView
            source={require('../../../assets/lottie/learn/Rocket_loader.json')}
            autoPlay
            loop={false}
            style={styles.rocketAnimation}
            onAnimationFinish={handleAnimationFinish}
          />
        </View>
        <Text style={[styles.resultTitle, isLight && { color: '#111827' }]}>
          Are You Ready?
        </Text>
        <Text style={[styles.resultSubtitle, isLight && { color: '#6B7280' }]}>
          {wordsCount} new words mastered!{'\n'}Time to show what you've got!
        </Text>
      </View>
    </Animated.View>
  );
}

export default function WordIntroComponent({ setId, levelId, onComplete }: WordIntroProps) {
  const router = useRouter();
  const { addWord } = useAppStore();
  const themeName = useAppStore(s => s.theme);
  const colors = getTheme(themeName);
  const isLight = themeName === 'light';
  const [currentIndex, setCurrentIndex] = useState(0);
  const [words, setWords] = useState<Word[]>([]);
  const [savedWords, setSavedWords] = useState<Set<string>>(new Set());
  const [savingWords, setSavingWords] = useState<Set<string>>(new Set());
  const [showResultScreen, setShowResultScreen] = useState(false);
  const languagePrefs = useAppStore(s => s.languagePreferences);
  const targetLang = languagePrefs?.[0] || '';
  const [trMap, setTrMap] = useState<Record<string, any>>({});
  const [showTrModal, setShowTrModal] = useState(false);
  const [modalWord, setModalWord] = useState<string | null>(null);
  const [loadingTr, setLoadingTr] = useState(false);
  const trAnim = useRef(new Animated.Value(0)).current;

  const scrollX = useRef(new Animated.Value(0)).current;
  const scrollerRef = useRef<any>(null);
  const [speakingWord, setSpeakingWord] = useState<string | null>(null);
  const voiceIdRef = useRef<string | undefined>(undefined);

  // Animations
  const cardScale = useRef(new Animated.Value(1)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;

  // Pulse animation for current indicator
  useEffect(() => {
    const pulse = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.2,
          duration: 1000,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true,
        }),
      ])
    );
    pulse.start();
    return () => pulse.stop();
  }, []);

  useEffect(() => {
    loadWords();
  }, [setId, levelId]);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const voices = await Speech.getAvailableVoicesAsync();
        const us = voices?.find(v => (v as any)?.language?.toLowerCase?.().startsWith('en-us'));
        if (mounted && us?.identifier) {
          voiceIdRef.current = us.identifier;
        }
      } catch {}
    })();
    return () => { mounted = false; };
  }, []);

  const loadWords = () => {
    const level = levels.find(l => l.id === levelId);
    if (!level) return;

    const set = level.sets.find(s => s.id.toString() === setId);
    if (!set || !set.words) return;

    const wordData: Word[] = set.words.map(wordObj => ({
      word: wordObj.word,
      definition: wordObj.definition,
      example: wordObj.example,
      phonetic: wordObj.phonetic,
      synonyms: wordObj.synonyms || []
    }));

    setWords(wordData);
  };

  const onMomentumEnd = (e: any) => {
    const offsetX = e.nativeEvent.contentOffset.x;
    const newIndex = Math.round(offsetX / SCREEN_WIDTH);
    if (newIndex !== currentIndex && newIndex >= 0 && newIndex < words.length) {
      LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
      setCurrentIndex(newIndex);
    }
  };

  const handleSaveWord = async (wordText: string) => {
    if (savingWords.has(wordText) || savedWords.has(wordText)) return;

    setSavingWords(prev => new Set(prev).add(wordText));

    try {
      const wordData = words.find(w => w.word === wordText);
      if (wordData) {
        await addWord({
          word: wordData.word,
          definition: wordData.definition,
          example: wordData.example,
          phonetics: wordData.phonetic,
          notes: '',
          tags: [],
          folderId: 'folder-sets-default',
        });

        setSavedWords(prev => new Set(prev).add(wordText));
      }
    } catch (error) {
      console.error('Failed to save word:', error);
    } finally {
      setSavingWords(prev => {
        const newSet = new Set(prev);
        newSet.delete(wordText);
        return newSet;
      });
    }
  };

  const handleStartPractice = () => {
    try {
      if (typeof onComplete === 'function') {
        onComplete();
      }
    } catch (e) {
      console.warn('Start Practice callback failed:', e);
    }
  };

  const goToNext = () => {
    if (currentIndex < words.length - 1) {
      const nextIndex = currentIndex + 1;
      scrollerRef.current?.scrollTo({ x: nextIndex * SCREEN_WIDTH, animated: true });
      LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
      setCurrentIndex(nextIndex);
    } else {
      // Show result screen with rocket animation
      LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
      setShowResultScreen(true);
    }
  };

  const speakWord = (word: Word) => {
    try {
      if (speakingWord === word.word) {
        Speech?.stop?.();
        setSpeakingWord(null);
        return;
      }
      Speech?.stop?.();
      setSpeakingWord(word.word);
      Speech?.speak?.(word.word, {
        language: 'en-US',
        voice: voiceIdRef.current,
        rate: 0.98,
        pitch: 1.0,
        onDone: () => setSpeakingWord(prev => (prev === word.word ? null : prev)),
        onStopped: () => setSpeakingWord(prev => (prev === word.word ? null : prev)),
        onError: () => setSpeakingWord(prev => (prev === word.word ? null : prev)),
      });
    } catch {}
  };

  const currentWord = words[Math.min(currentIndex, words.length - 1)];

  const renderWordCard = (word: Word, idx: number) => {
    const isSaved = savedWords.has(word.word);
    const inputRange = [
      (idx - 1) * SCREEN_WIDTH,
      idx * SCREEN_WIDTH,
      (idx + 1) * SCREEN_WIDTH,
    ];

    const scale = scrollX.interpolate({
      inputRange,
      outputRange: [0.9, 1, 0.9],
      extrapolate: 'clamp',
    });

    const opacity = scrollX.interpolate({
      inputRange,
      outputRange: [0.5, 1, 0.5],
      extrapolate: 'clamp',
    });

    return (
      <View key={word.word + idx} style={styles.cardContainer}>
        <Animated.View style={[styles.card, { transform: [{ scale }], opacity }]}>
          {/* Card border wrapper for 3D effect */}
          <View style={styles.cardBorderWrapper}>
            {/* Card solid background */}
            <View style={[styles.cardGradient, { backgroundColor: isLight ? '#FFFFFF' : '#1B263B' }]}>

            {/* Header with word */}
            <View style={styles.cardHeader}>
              <View style={styles.wordSection}>
                <Text
                  style={[styles.wordText, isLight && styles.wordTextLight]}
                  numberOfLines={1}
                  adjustsFontSizeToFit
                  minimumFontScale={0.7}
                >
                  {word.word}
                </Text>
                <Text style={styles.phoneticText}>{word.phonetic}</Text>
              </View>

              {/* Speaker button */}
              <TouchableOpacity
                style={[styles.iconButton, speakingWord === word.word && styles.iconButtonActive]}
                onPress={() => speakWord(word)}
              >
                <Volume2 size={16} color={speakingWord === word.word ? '#fff' : ACCENT_TEAL} />
              </TouchableOpacity>
            </View>

            {/* Save button - bottom right */}
            <TouchableOpacity
              style={[styles.saveButton, isSaved && styles.iconButtonSaved]}
              onPress={() => handleSaveWord(word.word)}
              disabled={savingWords.has(word.word) || isSaved}
            >
              {isSaved ? (
                <Check size={16} color="#fff" />
              ) : (
                <Bookmark size={16} color={ACCENT_PINK} />
              )}
            </TouchableOpacity>

            {/* Divider */}
            <View style={styles.divider}>
              <View style={styles.dividerLine} />
            </View>

            {/* Definition section */}
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionLabel}>DEFINITION</Text>
              </View>
              <Text style={[styles.definitionText, isLight && styles.definitionTextLight]}>
                {word.definition}
              </Text>
            </View>

            {/* Example section */}
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionLabel}>EXAMPLE</Text>
              </View>
              <Text style={[styles.exampleText, isLight && styles.exampleTextLight]}>
                {word.example.split(new RegExp(`(${word.word})`, 'i')).map((part, i) => (
                  part.toLowerCase() === word.word.toLowerCase() ? (
                    <Text key={i} style={styles.highlightedWord}>{part}</Text>
                  ) : (
                    <Text key={i}>{part}</Text>
                  )
                ))}
              </Text>
            </View>

            {/* Synonyms section */}
            {word.synonyms?.length > 0 && (
              <View style={styles.section}>
                <View style={styles.sectionHeader}>
                  <Text style={styles.sectionLabel}>SYNONYMS</Text>
                </View>
                <View style={styles.synonymsContainer}>
                  {word.synonyms.slice(0, 4).map((syn, i) => (
                    <View key={i} style={styles.synonymChip}>
                      <Text style={styles.synonymText}>{syn}</Text>
                    </View>
                  ))}
                </View>
              </View>
            )}

            {/* Translation button */}
            {!!targetLang && (
              <TouchableOpacity
                style={styles.translateButton}
                onPress={async () => {
                  if (!trMap[word.word]) {
                    setLoadingTr(true);
                    const res = await TranslationService.translate(word.word, targetLang);
                    if (res) setTrMap(prev => ({ ...prev, [word.word]: res }));
                    setLoadingTr(false);
                  }
                  setModalWord(word.word);
                  setShowTrModal(true);
                  trAnim.setValue(0);
                  Animated.timing(trAnim, { toValue: 1, duration: 220, useNativeDriver: true }).start();
                }}
              >
                <Globe size={16} color={ACCENT_ORANGE} />
                <Text style={styles.translateButtonText}>
                  {loadingTr && !trMap[word.word] ? 'Translating...' : 'Translate'}
                </Text>
              </TouchableOpacity>
            )}
            </View>
          </View>
        </Animated.View>
      </View>
    );
  };

  if (words.length === 0) {
    return (
      <View style={[styles.container, styles.loadingContainer]}>
        <LottieView
          source={require('../../../assets/lottie/loading.json')}
          autoPlay
          loop
          style={{ width: 120, height: 120 }}
        />
        <Text style={styles.loadingText}>Loading words...</Text>
      </View>
    );
  }

  // Result screen with rocket animation
  if (showResultScreen) {
    return (
      <ResultScreen
        wordsCount={words.length}
        isLight={isLight}
        onComplete={handleStartPractice}
      />
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: 'transparent' }]}>
      {/* Navigation dots - above cards */}
      <View style={styles.dotsContainer}>
        {words.map((_, idx) => (
          <Animated.View
            key={idx}
            style={[
              styles.dot,
              idx === currentIndex && styles.dotActive,
              idx === currentIndex && { transform: [{ scale: pulseAnim }] },
            ]}
          />
        ))}
      </View>

      {/* Word cards carousel */}
      <Animated.ScrollView
        ref={scrollerRef}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onMomentumScrollEnd={onMomentumEnd}
        onScroll={Animated.event(
          [{ nativeEvent: { contentOffset: { x: scrollX } } }],
          { useNativeDriver: true }
        )}
        scrollEventThrottle={16}
        contentContainerStyle={styles.scrollContent}
        style={styles.scrollView}
        decelerationRate="fast"
        snapToInterval={SCREEN_WIDTH}
      >
        {words.map((word, idx) => renderWordCard(word, idx))}
      </Animated.ScrollView>

      {/* Bottom navigation */}
      <View style={styles.bottomSection}>
        {/* Navigation button - centered */}
        <View style={styles.navButtonContainer}>
          <TouchableOpacity
            style={styles.nextButtonFull}
            onPress={goToNext}
            activeOpacity={0.8}
          >
            <Text style={styles.nextButtonText}>Next</Text>
            <ChevronRight size={24} color="#FFFFFF" />
          </TouchableOpacity>
        </View>
      </View>

      {/* Translation modal */}
      <Modal visible={showTrModal} transparent animationType="none" onRequestClose={() => setShowTrModal(false)}>
        <View style={styles.modalOverlay}>
          <TouchableOpacity style={styles.modalBackdrop} activeOpacity={1} onPress={() => setShowTrModal(false)} />
          <Animated.View style={[styles.modalSheet, { opacity: trAnim, transform: [{ translateY: trAnim.interpolate({ inputRange: [0,1], outputRange: [40, 0] }) }] }]}>
            <View style={styles.modalHandle} />
            <Text style={styles.modalTitle}>Translation</Text>
            <ScrollView style={{ maxHeight: 320 }}>
              {modalWord && trMap[modalWord] ? (
                <View>
                  <Text style={styles.translationText}>{trMap[modalWord].translation}</Text>
                  {trMap[modalWord].synonyms?.length > 0 && (
                    <>
                      <Text style={styles.modalLabel}>Synonyms</Text>
                      <View style={styles.synonymsContainer}>
                        {trMap[modalWord].synonyms.map((syn: string, i: number) => (
                          <View key={i} style={styles.modalChip}>
                            <Text style={styles.modalChipText}>{syn}</Text>
                          </View>
                        ))}
                      </View>
                    </>
                  )}
                </View>
              ) : (
                <Text style={styles.translationText}>No translation available</Text>
              )}
            </ScrollView>
            <TouchableOpacity onPress={() => setShowTrModal(false)} style={styles.modalCloseBtn}>
              <Text style={styles.modalCloseBtnText}>Close</Text>
            </TouchableOpacity>
          </Animated.View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: DARK_BG,
  },
  containerLight: {
    backgroundColor: '#F5F5F7',
  },
  loadingContainer: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 14,
    color: '#9CA3AF',
    marginTop: 12,
    fontFamily: 'Ubuntu-Medium',
  },

  // Top section
  topSection: {
    paddingHorizontal: 24,
    paddingTop: 8,
    paddingBottom: 16,
  },
  progressContainer: {
    marginBottom: 16,
  },
  progressText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#fff',
    marginBottom: 8,
    fontFamily: 'Ubuntu-Medium',
  },
  progressTextLight: {
    color: '#1F2937',
  },
  progressTotal: {
    color: '#6B7280',
    fontWeight: '400',
  },
  progressBar: {
    height: 6,
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressBarLight: {
    backgroundColor: 'rgba(0,0,0,0.08)',
  },
  progressFill: {
    height: '100%',
    backgroundColor: ACCENT_TEAL,
    borderRadius: 3,
  },
  titleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  titleText: {
    fontSize: 22,
    fontWeight: '700',
    color: '#fff',
    fontFamily: 'Ubuntu-Bold',
  },
  titleTextLight: {
    color: '#1F2937',
  },

  // Scroll view
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    // Container for horizontal scroll
  },

  // Card styles
  cardContainer: {
    width: SCREEN_WIDTH,
    paddingHorizontal: CARD_MARGIN,
    justifyContent: 'center',
  },
  card: {
    borderRadius: 24,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.3,
    shadowRadius: 24,
    elevation: 12,
  },
  cardBorderWrapper: {
    borderRadius: 24,
    borderWidth: 3,
    borderColor: '#0D1B2A',
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 2, height: 3 },
    shadowOpacity: 0.4,
    shadowRadius: 0,
    elevation: 5,
  },
  cardGradient: {
    padding: 24,
    borderRadius: 22,
    position: 'relative',
    overflow: 'hidden',
  },
  glowAccent: {
    position: 'absolute',
    top: -50,
    right: -50,
    width: 150,
    height: 150,
    borderRadius: 75,
    backgroundColor: ACCENT_TEAL,
    opacity: 0.08,
  },

  // Card header
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 20,
  },
  wordSection: {
    flex: 1,
  },
  wordText: {
    fontSize: 36,
    fontWeight: '700',
    color: '#fff',
    fontFamily: 'Feather-Bold',
    letterSpacing: -0.5,
  },
  wordTextLight: {
    color: '#1F2937',
  },
  phoneticText: {
    fontSize: 16,
    color: '#6B7280',
    marginTop: 4,
    fontStyle: 'italic',
    fontFamily: 'Feather-Bold',
  },
  iconButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(78, 217, 203, 0.12)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(78, 217, 203, 0.2)',
  },
  iconButtonActive: {
    backgroundColor: ACCENT_TEAL,
    borderColor: ACCENT_TEAL,
  },
  iconButtonSaved: {
    backgroundColor: SUCCESS_GREEN,
    borderColor: SUCCESS_GREEN,
  },
  saveButton: {
    position: 'absolute',
    bottom: 16,
    right: 16,
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(242, 94, 134, 0.12)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(242, 94, 134, 0.2)',
  },

  // Divider
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: 'rgba(255,255,255,0.08)',
  },
  dividerDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: ACCENT_TEAL,
    marginHorizontal: 12,
  },

  // Sections
  section: {
    marginBottom: 20,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  sectionLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: ACCENT_ORANGE,
    letterSpacing: 1,
    fontFamily: 'Feather-Bold',
  },
  definitionText: {
    fontSize: 17,
    color: '#E5E7EB',
    lineHeight: 26,
    fontFamily: 'Feather-Bold',
  },
  definitionTextLight: {
    color: '#2D4A66',
  },
  exampleText: {
    fontSize: 15,
    color: '#9CA3AF',
    lineHeight: 24,
    fontStyle: 'italic',
    fontFamily: 'Feather-Bold',
  },
  exampleTextLight: {
    color: '#6B7280',
  },
  highlightedWord: {
    color: ACCENT_PINK,
    fontWeight: '700',
    fontStyle: 'normal',
  },

  // Synonyms
  synonymsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  synonymChip: {
    backgroundColor: 'rgba(242, 94, 134, 0.12)',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(242, 94, 134, 0.25)',
  },
  synonymText: {
    fontSize: 13,
    color: '#F25E86',
    fontWeight: '500',
    fontFamily: 'Feather-Bold',
  },

  // Translate button
  translateButton: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    gap: 8,
    paddingVertical: 10,
    paddingHorizontal: 16,
    backgroundColor: 'rgba(248, 176, 112, 0.12)',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(248, 176, 112, 0.2)',
  },
  translateButtonText: {
    color: ACCENT_ORANGE,
    fontSize: 13,
    fontWeight: '600',
    fontFamily: 'Ubuntu-Medium',
  },

  // Bottom section
  bottomSection: {
    paddingHorizontal: 24,
    paddingBottom: 24,
    paddingTop: 24,
  },
  dotsContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
    marginTop: 48,
    marginBottom: 16,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: 'rgba(255,255,255,0.2)',
  },
  dotActive: {
    width: 24,
    backgroundColor: ACCENT_TEAL,
  },
  navButtonContainer: {
    alignItems: 'center',
    paddingBottom: 50,
    marginTop: -20,
  },
  nextButtonFull: {
    backgroundColor: ACCENT_PINK,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    paddingHorizontal: 48,
    borderRadius: 28,
    gap: 6,
    borderWidth: 3,
    borderColor: '#0D1B2A',
    shadowColor: '#000',
    shadowOffset: { width: 2, height: 3 },
    shadowOpacity: 0.5,
    shadowRadius: 0,
    elevation: 5,
  },
  nextButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
    fontFamily: 'Ubuntu-Bold',
    letterSpacing: 0.3,
  },

  // Modal styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'flex-end',
  },
  modalBackdrop: {
    flex: 1,
  },
  modalSheet: {
    backgroundColor: '#1B263B',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    paddingBottom: 32,
  },
  modalHandle: {
    width: 40,
    height: 4,
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderRadius: 2,
    alignSelf: 'center',
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#fff',
    marginBottom: 16,
    fontFamily: 'Ubuntu-Bold',
  },
  modalLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#9CA3AF',
    marginTop: 16,
    marginBottom: 8,
    fontFamily: 'Ubuntu-Medium',
  },
  translationText: {
    fontSize: 20,
    color: '#E5E7EB',
    fontFamily: 'Ubuntu-Medium',
  },
  modalChip: {
    backgroundColor: 'rgba(255,255,255,0.08)',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 12,
  },
  modalChipText: {
    fontSize: 14,
    color: '#E5E7EB',
    fontFamily: 'Ubuntu-Regular',
  },
  modalCloseBtn: {
    backgroundColor: ACCENT_PINK,
    paddingVertical: 16,
    borderRadius: 16,
    alignItems: 'center',
    marginTop: 24,
  },
  modalCloseBtnText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#fff',
    fontFamily: 'Ubuntu-Bold',
  },

  // Result screen styles
  resultContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 60,
  },
  resultContent: {
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  rocketWrap: {
    width: 180,
    height: 180,
    marginBottom: 24,
  },
  rocketAnimation: {
    width: 180,
    height: 180,
  },
  resultTitle: {
    fontSize: 32,
    fontWeight: '700',
    color: '#fff',
    marginBottom: 12,
    fontFamily: 'Ubuntu-Bold',
    textAlign: 'center',
  },
  resultSubtitle: {
    fontSize: 18,
    color: '#9CA3AF',
    textAlign: 'center',
    lineHeight: 26,
    marginBottom: 40,
    fontFamily: 'Ubuntu-Medium',
  },
});

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
import { Volume2, Bookmark, Check, Globe, ChevronLeft, ChevronRight, Sparkles } from 'lucide-react-native';
import LottieView from 'lottie-react-native';
import Speech from '../../../lib/speech';
import { useRouter } from 'expo-router';
import { useAppStore } from '../../../lib/store';
import { getTheme } from '../../../lib/theme';
import { levels } from '../data/levels';
import AnimatedNextButton from './AnimatedNextButton';
import { TranslationService } from '../../../services/TranslationService';
import { LinearGradient } from '../../../lib/LinearGradient';

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
const DARK_BG = '#0F0F0F';
const CARD_BG = '#1A1A1A';
const CARD_BORDER = 'rgba(78, 217, 203, 0.15)';

// Enable LayoutAnimation for Android
if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
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
  const progressAnim = useRef(new Animated.Value(0)).current;
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

  // Update progress animation
  useEffect(() => {
    if (words.length > 0) {
      Animated.spring(progressAnim, {
        toValue: (currentIndex + 1) / words.length,
        friction: 8,
        tension: 40,
        useNativeDriver: false,
      }).start();
    }
  }, [currentIndex, words.length]);

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
      handleStartPractice();
    }
  };

  const goToPrev = () => {
    if (currentIndex > 0) {
      const prevIndex = currentIndex - 1;
      scrollerRef.current?.scrollTo({ x: prevIndex * SCREEN_WIDTH, animated: true });
      LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
      setCurrentIndex(prevIndex);
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
  const isLastCard = currentIndex >= words.length - 1;

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
          {/* Card gradient background */}
          <LinearGradient
            colors={isLight ? ['#FFFFFF', '#F8F9FA'] : ['#1F2128', '#16171C']}
            style={styles.cardGradient}
            start={{ x: 0, y: 0 }}
            end={{ x: 0, y: 1 }}
          >
            {/* Decorative glow */}
            <View style={styles.glowAccent} />

            {/* Header with word */}
            <View style={styles.cardHeader}>
              <View style={styles.wordSection}>
                <Text style={[styles.wordText, isLight && styles.wordTextLight]}>
                  {word.word}
                </Text>
                <Text style={styles.phoneticText}>{word.phonetic}</Text>
              </View>

              {/* Action buttons row */}
              <View style={styles.headerActions}>
                <TouchableOpacity
                  style={[styles.iconButton, speakingWord === word.word && styles.iconButtonActive]}
                  onPress={() => speakWord(word)}
                >
                  <Volume2 size={20} color={speakingWord === word.word ? '#fff' : ACCENT_TEAL} />
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.iconButton, isSaved && styles.iconButtonSaved]}
                  onPress={() => handleSaveWord(word.word)}
                  disabled={savingWords.has(word.word) || isSaved}
                >
                  {isSaved ? (
                    <Check size={20} color="#fff" />
                  ) : (
                    <Bookmark size={20} color={ACCENT_PINK} />
                  )}
                </TouchableOpacity>
              </View>
            </View>

            {/* Divider with accent */}
            <View style={styles.divider}>
              <View style={styles.dividerLine} />
              <View style={styles.dividerDot} />
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
          </LinearGradient>
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

  const progressWidth = progressAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0%', '100%'],
  });

  return (
    <View style={[styles.container, isLight && styles.containerLight]}>
      {/* Top section with progress */}
      <View style={styles.topSection}>
        {/* Progress indicator */}
        <View style={styles.progressContainer}>
          <Text style={[styles.progressText, isLight && styles.progressTextLight]}>
            {currentIndex + 1} <Text style={styles.progressTotal}>of {words.length}</Text>
          </Text>
          <View style={[styles.progressBar, isLight && styles.progressBarLight]}>
            <Animated.View style={[styles.progressFill, { width: progressWidth }]} />
          </View>
        </View>

        {/* Title */}
        <View style={styles.titleContainer}>
          <Sparkles size={20} color={ACCENT_ORANGE} />
          <Text style={[styles.titleText, isLight && styles.titleTextLight]}>
            Learn New Words
          </Text>
        </View>
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
        {/* Navigation dots */}
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

        {/* Navigation buttons */}
        <View style={styles.navButtons}>
          <TouchableOpacity
            style={[styles.navButton, styles.navButtonSecondary, currentIndex === 0 && styles.navButtonDisabled]}
            onPress={goToPrev}
            disabled={currentIndex === 0}
          >
            <ChevronLeft size={24} color={currentIndex === 0 ? '#555' : '#fff'} />
            <Text style={[styles.navButtonText, currentIndex === 0 && styles.navButtonTextDisabled]}>
              Previous
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.navButton, styles.navButtonPrimary]}
            onPress={goToNext}
          >
            <Text style={styles.navButtonTextPrimary}>
              {isLastCard ? 'Start Practice' : 'Next'}
            </Text>
            <ChevronRight size={24} color="#1A1A1A" />
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
  cardGradient: {
    padding: 24,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: CARD_BORDER,
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
    fontFamily: 'Ubuntu-Bold',
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
    fontFamily: 'Ubuntu-Regular',
  },
  headerActions: {
    flexDirection: 'row',
    gap: 12,
  },
  iconButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
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
    fontFamily: 'Ubuntu-Bold',
  },
  definitionText: {
    fontSize: 17,
    color: '#E5E7EB',
    lineHeight: 26,
    fontFamily: 'Ubuntu-Regular',
  },
  definitionTextLight: {
    color: '#374151',
  },
  exampleText: {
    fontSize: 15,
    color: '#9CA3AF',
    lineHeight: 24,
    fontStyle: 'italic',
    fontFamily: 'Ubuntu-Regular',
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
    backgroundColor: 'rgba(78, 217, 203, 0.12)',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(78, 217, 203, 0.2)',
  },
  synonymText: {
    fontSize: 13,
    color: ACCENT_TEAL,
    fontWeight: '500',
    fontFamily: 'Ubuntu-Medium',
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
    paddingTop: 16,
  },
  dotsContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
    marginBottom: 20,
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
  navButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  navButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    borderRadius: 16,
    gap: 8,
  },
  navButtonSecondary: {
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  navButtonPrimary: {
    backgroundColor: ACCENT_TEAL,
    flex: 1.5,
  },
  navButtonDisabled: {
    opacity: 0.5,
  },
  navButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#fff',
    fontFamily: 'Ubuntu-Medium',
  },
  navButtonTextDisabled: {
    color: '#555',
  },
  navButtonTextPrimary: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1A1A1A',
    fontFamily: 'Ubuntu-Bold',
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
    backgroundColor: '#1F2128',
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
});

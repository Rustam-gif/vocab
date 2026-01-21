import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  Dimensions,
  Animated,
} from 'react-native';
import { Volume2, ChevronLeft, ChevronRight, Bookmark } from 'lucide-react-native';
import Speech from '../../../lib/speech';
import LottieView from 'lottie-react-native';
import { levels } from '../data/levels';
import { useAppStore } from '../../../lib/store';
import type { NewWordPayload } from '../../../types';
import { LinearGradient } from '../../../lib/LinearGradient';

const ACCENT_COLOR = '#F8B070';
const ACCENT_TEAL = '#4ED9CB';
const TEXT_MUTED = '#9CA3AF';
const TEXT_PRIMARY = '#F9FAFB';
// Lighter card backgrounds - warm gray tones
const CARD_BG_START = '#2D4A66';
const CARD_BG_END = '#2D3031';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

interface WordIntroProps {
  setId: string;
  levelId: string;
  onPhaseComplete: (score: number, totalQuestions: number) => void;
  sharedScore: number;
  onScoreShare: (score: number) => void;
  onProgressChange: (progress: number) => void;
  onSkipIntro: (totalQuestions: number) => void;
}

interface IntroWord {
  id: string;
  word: string;
  definition: string;
  ipa: string;
  example: string;
  synonyms?: string[];
}

function escapeRegExp(str: string) {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function HighlightedExample({ example, highlight }: { example: string; highlight: string }) {
  if (!highlight) {
    return <Text style={styles.exampleText}>{example}</Text>;
  }

  const regex = new RegExp(escapeRegExp(highlight), 'i');
  const match = example.match(regex);

  if (!match) {
    return <Text style={styles.exampleText}>{example}</Text>;
  }

  const parts = example.split(regex);
  return (
    <Text style={styles.exampleText}>
      {parts.map((part, idx) => (
        <React.Fragment key={idx}>
          {part}
          {idx < parts.length - 1 && (
            <Text style={styles.exampleHighlight}>{match[0]}</Text>
          )}
        </React.Fragment>
      ))}
    </Text>
  );
}

export default function WordIntro({
  setId,
  levelId,
  onPhaseComplete,
  onProgressChange,
  onSkipIntro,
}: WordIntroProps) {
  const wordsData = useMemo<IntroWord[]>(() => {
    const level = levels.find(l => l.id === levelId);
    const set = level?.sets.find(s => s.id.toString() === setId.toString());
    return set?.words?.map(word => ({
      id: word.word,
      word: word.word,
      definition: word.definition,
      ipa: (word as any).phonetic || (word as any).ipa || '',
      example: word.example,
      synonyms: word.synonyms || [],
    })) ?? [];
  }, [levelId, setId]);

  const flatListRef = useRef<FlatList<IntroWord>>(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const { addWord, words: savedWords } = useAppStore(state => ({ addWord: state.addWord, words: state.words }));
  const [savedMap, setSavedMap] = useState<Record<string, boolean>>({});
  const [saving, setSaving] = useState(false);
  const bookmarkRefs = useRef<Record<string, LottieView | null>>({});
  const [speakingFor, setSpeakingFor] = useState<string | null>(null);

  // Animated progress bar
  const progressAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const existing = new Set(savedWords.map(w => w.word.toLowerCase()));
    const nextMap: Record<string, boolean> = {};
    wordsData.forEach(word => {
      nextMap[word.word.toLowerCase()] = existing.has(word.word.toLowerCase());
    });
    setSavedMap(nextMap);
  }, [savedWords, wordsData]);

  useEffect(() => {
    if (wordsData.length > 0) {
      const progress = (currentIndex + 1) / wordsData.length;
      onProgressChange(progress);
      // Animate progress bar
      Animated.spring(progressAnim, {
        toValue: progress,
        useNativeDriver: false,
        tension: 50,
        friction: 8,
      }).start();
    } else {
      onProgressChange(0);
    }
  }, [currentIndex, wordsData.length, onProgressChange, progressAnim]);

  const scrollToIndex = useCallback((index: number) => {
    flatListRef.current?.scrollToIndex({ index, animated: true });
  }, []);

  const handlePrev = useCallback(() => {
    if (currentIndex > 0) {
      const prev = currentIndex - 1;
      setCurrentIndex(prev);
      scrollToIndex(prev);
    }
  }, [currentIndex, scrollToIndex]);

  const handleNext = useCallback(() => {
    if (currentIndex < wordsData.length - 1) {
      const next = currentIndex + 1;
      setCurrentIndex(next);
      scrollToIndex(next);
    } else {
      onPhaseComplete(0, wordsData.length);
    }
  }, [currentIndex, wordsData.length, onPhaseComplete, scrollToIndex]);

  const handleSkip = useCallback(() => {
    onSkipIntro(wordsData.length);
  }, [onSkipIntro, wordsData.length]);

  const handleSave = useCallback(async (word: IntroWord) => {
    const key = word.word.toLowerCase();
    if (savedMap[key] || saving) return;
    // Play the bookmark animation once on tap
    try {
      const ref = bookmarkRefs.current[key];
      ref?.reset?.();
      ref?.play?.();
    } catch {}
    setSaving(true);
    try {
      const payload: NewWordPayload = {
        word: word.word,
        definition: word.definition,
        example: word.example,
        phonetics: word.ipa,
        synonyms: word.synonyms || [],
        notes: '',
        tags: [],
        folderId: 'folder-sets-default',
      };
      const result = await addWord(payload);
      if (result) {
        setSavedMap(prev => ({ ...prev, [key]: true }));
      }
    } catch (error) {
      console.error('Failed to save word:', error);
    } finally {
      setSaving(false);
    }
  }, [addWord, savedMap, saving]);

  const onMomentumEnd = useCallback((event: any) => {
    const index = Math.round(event.nativeEvent.contentOffset.x / SCREEN_WIDTH);
    setCurrentIndex(index);
  }, []);

  const renderItem = ({ item }: { item: IntroWord }) => {
    const key = item.word.toLowerCase();
    const isSaved = savedMap[key];
    return (
      <View style={[styles.slideOuter, { width: SCREEN_WIDTH - 40 }]}>
        <LinearGradient
          colors={[CARD_BG_START, CARD_BG_END]}
          style={styles.slide}
          start={{ x: 0, y: 0 }}
          end={{ x: 0, y: 1 }}
        >
          {/* Decorative accent glow */}
          <View style={styles.accentGlow} pointerEvents="none" />

          {/* Header row with word and actions */}
          <View style={styles.headerRow}>
            <View style={styles.wordHeader}>
              <Text style={styles.wordLabel}>{item.word}</Text>
              {item.ipa ? <Text style={styles.wordIpa}>{item.ipa}</Text> : null}
            </View>
            <View style={styles.headerActions}>
              {/* Pronunciation button */}
              <TouchableOpacity
                style={[styles.iconBtn, speakingFor === item.word && styles.iconBtnActive]}
                onPress={() => {
                  try {
                    if (speakingFor) {
                      Speech?.stop?.();
                      setSpeakingFor(null);
                    }
                    const toSpeak = item.word;
                    setSpeakingFor(toSpeak);
                    Speech?.speak?.(toSpeak, {
                      language: 'en-US',
                      rate: 1.0,
                      pitch: 1.0,
                      onDone: () => setSpeakingFor(prev => (prev === toSpeak ? null : prev)),
                      onStopped: () => setSpeakingFor(prev => (prev === toSpeak ? null : prev)),
                      onError: () => setSpeakingFor(prev => (prev === toSpeak ? null : prev)),
                    });
                  } catch {}
                }}
                accessibilityRole="button"
                accessibilityLabel={`Play pronunciation for ${item.word}`}
              >
                <Volume2 size={20} color="#FFFFFF" />
              </TouchableOpacity>
              {/* Save button */}
              <TouchableOpacity
                style={[styles.iconBtn, isSaved && styles.iconBtnSaved]}
                onPress={() => handleSave(item)}
                disabled={isSaved || saving}
                accessibilityRole="button"
                accessibilityLabel={isSaved ? 'Word saved' : 'Save to vault'}
              >
                {!isSaved ? (
                  <LottieView
                    ref={(r) => { bookmarkRefs.current[key] = r; }}
                    source={require('../../../assets/lottie/Bookmark.json')}
                    autoPlay={false}
                    loop={false}
                    style={styles.bookmarkIcon}
                  />
                ) : (
                  <Bookmark size={20} color="#FFFFFF" fill="#FFFFFF" />
                )}
              </TouchableOpacity>
            </View>
          </View>

          {/* Definition section */}
          <View style={styles.section}>
            <Text style={styles.sectionLabel}>DEFINITION</Text>
            <Text style={styles.definitionText}>{item.definition}</Text>
          </View>

          {/* Example section */}
          <View style={styles.section}>
            <Text style={styles.sectionLabel}>EXAMPLE</Text>
            <HighlightedExample example={item.example} highlight={item.word} />
          </View>

          {/* Synonyms section */}
          {item.synonyms && item.synonyms.length > 0 && (
            <View style={styles.section}>
              <Text style={styles.sectionLabel}>SYNONYMS</Text>
              <View style={styles.synonymWrapper}>
                {item.synonyms.map(syn => (
                  <View key={syn} style={styles.synonymChip}>
                    <Text style={styles.synonymText}>{syn}</Text>
                  </View>
                ))}
              </View>
            </View>
          )}
        </LinearGradient>
      </View>
    );
  };

  if (wordsData.length === 0) {
    return (
      <View style={styles.emptyContainer}>
        <Text style={styles.emptyText}>No words to review.</Text>
        <TouchableOpacity style={styles.continueBtn} onPress={() => onPhaseComplete(0, 0)}>
          <Text style={styles.continueBtnText}>Continue</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const isLastWord = currentIndex === wordsData.length - 1;
  const isFirstWord = currentIndex === 0;

  return (
    <View style={styles.container}>
      {/* Top section with progress */}
      <View style={styles.topSection}>
        <View style={styles.topBar}>
          <TouchableOpacity onPress={handleSkip} accessibilityRole="button" style={styles.skipBtn}>
            <Text style={styles.skipText}>Skip intro</Text>
          </TouchableOpacity>
          <View style={styles.progressInfo}>
            <Text style={styles.progressText}>
              <Text style={styles.progressCurrent}>{currentIndex + 1}</Text>
              <Text style={styles.progressDivider}> / </Text>
              <Text style={styles.progressTotal}>{wordsData.length}</Text>
            </Text>
          </View>
        </View>

        {/* Animated progress bar */}
        <View style={styles.progressBarContainer}>
          <View style={styles.progressBarBg}>
            <Animated.View
              style={[
                styles.progressBarFill,
                {
                  width: progressAnim.interpolate({
                    inputRange: [0, 1],
                    outputRange: ['0%', '100%'],
                  }),
                },
              ]}
            />
          </View>
        </View>
      </View>

      {/* Word cards carousel */}
      <FlatList
        ref={flatListRef}
        data={wordsData}
        keyExtractor={item => item.id}
        renderItem={renderItem}
        pagingEnabled
        horizontal
        showsHorizontalScrollIndicator={false}
        onMomentumScrollEnd={onMomentumEnd}
        contentContainerStyle={styles.sliderContent}
        extraData={savedMap}
      />

      {/* Navigation dots */}
      <View style={styles.dotsContainer}>
        {wordsData.map((_, idx) => (
          <View
            key={idx}
            style={[
              styles.dot,
              idx === currentIndex && styles.dotActive,
            ]}
          />
        ))}
      </View>

      {/* Bottom navigation */}
      <View style={styles.navRow}>
        <TouchableOpacity
          style={[styles.navBtn, styles.navBtnPrev, isFirstWord && styles.navBtnDisabled]}
          onPress={handlePrev}
          disabled={isFirstWord}
        >
          <ChevronLeft size={24} color={isFirstWord ? '#555' : '#FFF'} />
          <Text style={[styles.navBtnText, isFirstWord && styles.navBtnTextDisabled]}>Prev</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.navBtn, styles.navBtnNext]}
          onPress={handleNext}
        >
          <Text style={styles.navBtnText}>{isLastWord ? 'Start' : 'Next'}</Text>
          <ChevronRight size={24} color="#FFF" />
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingTop: 16,
  },
  topSection: {
    paddingHorizontal: 20,
    marginBottom: 16,
  },
  topBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  skipBtn: {
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
  skipText: {
    fontSize: 14,
    color: TEXT_MUTED,
    fontWeight: '500',
  },
  progressInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  progressText: {
    fontSize: 16,
    fontWeight: '600',
  },
  progressCurrent: {
    color: ACCENT_COLOR,
    fontSize: 18,
    fontWeight: '700',
  },
  progressDivider: {
    color: TEXT_MUTED,
  },
  progressTotal: {
    color: TEXT_MUTED,
  },
  progressBarContainer: {
    paddingHorizontal: 4,
  },
  progressBarBg: {
    height: 6,
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: ACCENT_COLOR,
    borderRadius: 3,
  },
  sliderContent: {
    paddingHorizontal: 20,
  },
  slideOuter: {
    marginRight: 20,
  },
  slide: {
    borderRadius: 24,
    padding: 24,
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 8,
    minHeight: 380,
  },
  accentGlow: {
    position: 'absolute',
    top: -50,
    right: -50,
    width: 150,
    height: 150,
    borderRadius: 75,
    backgroundColor: 'rgba(248, 176, 112, 0.04)',
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 24,
  },
  wordHeader: {
    flex: 1,
  },
  headerActions: {
    flexDirection: 'row',
    gap: 10,
  },
  iconBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.15)',
  },
  iconBtnActive: {
    backgroundColor: ACCENT_COLOR,
    borderColor: 'rgba(248, 176, 112, 0.5)',
  },
  iconBtnSaved: {
    backgroundColor: '#437F76',
    borderColor: 'rgba(67, 127, 118, 0.5)',
  },
  bookmarkIcon: {
    width: 28,
    height: 28,
  },
  wordLabel: {
    fontSize: 32,
    fontWeight: '700',
    color: TEXT_PRIMARY,
    letterSpacing: -0.5,
  },
  wordIpa: {
    fontSize: 15,
    color: TEXT_MUTED,
    fontStyle: 'italic',
    marginTop: 4,
  },
  section: {
    marginBottom: 18,
  },
  sectionLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: 'rgba(255, 255, 255, 0.5)',
    marginBottom: 6,
    letterSpacing: 1.2,
  },
  definitionText: {
    fontSize: 16,
    color: TEXT_PRIMARY,
    lineHeight: 24,
  },
  exampleText: {
    fontSize: 15,
    lineHeight: 23,
    color: '#D1D5DB',
    fontStyle: 'italic',
  },
  exampleHighlight: {
    color: ACCENT_COLOR,
    fontWeight: '700',
    fontStyle: 'normal',
  },
  synonymWrapper: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  synonymChip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.12)',
  },
  synonymText: {
    fontSize: 13,
    color: '#D1D5DB',
    fontWeight: '600',
  },
  dotsContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
    marginTop: 16,
    marginBottom: 16,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: 'rgba(255,255,255,0.2)',
  },
  dotActive: {
    backgroundColor: ACCENT_COLOR,
    width: 24,
  },
  navRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingBottom: 24,
    gap: 16,
  },
  navBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    borderRadius: 16,
    gap: 6,
  },
  navBtnPrev: {
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.15)',
  },
  navBtnNext: {
    backgroundColor: '#F25E86',
    borderWidth: 3,
    borderColor: '#0D1B2A',
    shadowColor: '#000',
    shadowOffset: { width: 2, height: 3 },
    shadowOpacity: 0.4,
    shadowRadius: 0,
    elevation: 5,
  },
  navBtnDisabled: {
    opacity: 0.4,
  },
  navBtnText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFF',
    fontFamily: 'Ubuntu-Bold',
  },
  navBtnTextDisabled: {
    color: '#555',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  emptyText: {
    fontSize: 16,
    color: TEXT_MUTED,
    marginBottom: 20,
    textAlign: 'center',
  },
  continueBtn: {
    backgroundColor: ACCENT_TEAL,
    paddingHorizontal: 32,
    paddingVertical: 14,
    borderRadius: 12,
  },
  continueBtnText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '700',
  },
});

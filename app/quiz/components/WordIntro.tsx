import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  Dimensions,
} from 'react-native';
import { Volume2 } from 'lucide-react-native';
import Speech from '../../../lib/speech';
import LottieView from 'lottie-react-native';
import { levels } from '../data/levels';
import { useAppStore } from '../../../lib/store';
import type { NewWordPayload } from '../../../types';
import AnimatedNextButton from './AnimatedNextButton';

const ACCENT_COLOR = '#F8B070';
const SYNONYM_BG = '#3A3A3A';
const SYNONYM_TEXT = '#E5E7EB';
const BUTTON_SAVED_BG = '#437F76';
const TEXT_MUTED = '#9CA3AF';
const TEXT_PRIMARY = '#F9FAFB';

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
  // Lottie refs keyed per word so the bookmark can animate on tap
  const bookmarkRefs = useRef<Record<string, LottieView | null>>({});
  const [speakingFor, setSpeakingFor] = useState<string | null>(null);

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
      onProgressChange((currentIndex + 1) / wordsData.length);
    } else {
      onProgressChange(0);
    }
  }, [currentIndex, wordsData.length, onProgressChange]);

  const scrollToIndex = useCallback((index: number) => {
    flatListRef.current?.scrollToIndex({ index, animated: true });
  }, []);

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

  const renderSynonyms = (synonyms: string[] | undefined) => {
    if (!synonyms || synonyms.length === 0) return null;
    return (
      <View style={styles.synonymWrapper}>
        {synonyms.map(syn => (
          <View key={syn} style={styles.synonymChip}>
            <Text style={styles.synonymText}>{syn}</Text>
          </View>
        ))}
      </View>
    );
  };

  const renderItem = ({ item }: { item: IntroWord }) => {
    const key = item.word.toLowerCase();
    const isSaved = savedMap[key];
    return (
      <View style={[styles.slide, { width: SCREEN_WIDTH - 40 }]}>
        {/* Glossy overlay effect */}
        <View style={styles.glossyOverlay} pointerEvents="none" />
        {/* Header row with word and speaker */}
        <View style={styles.headerRow}>
          <View style={styles.wordHeader}>
            <Text style={styles.wordLabel}>{item.word}</Text>
            {item.ipa ? <Text style={styles.wordIpa}>{item.ipa}</Text> : null}
          </View>
          {/* Pronunciation button */}
          <TouchableOpacity
            style={[styles.speakerBtn, speakingFor === item.word && styles.speakerBtnActive]}
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
            <Volume2 size={22} color="#FFFFFF" />
          </TouchableOpacity>
        </View>

        {/* Definition section */}
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>Definition</Text>
          <Text style={styles.definitionText}>{item.definition}</Text>
        </View>

        {/* Example section */}
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>Example</Text>
          <HighlightedExample example={item.example} highlight={item.word} />
        </View>

        {/* Synonyms section */}
        {item.synonyms && item.synonyms.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionLabel}>Synonyms</Text>
            <View style={styles.synonymWrapper}>
              {item.synonyms.map(syn => (
                <View key={syn} style={styles.synonymChip}>
                  <Text style={styles.synonymText}>{syn}</Text>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* Save button */}
        <TouchableOpacity
          style={[styles.saveButton, isSaved && styles.saveButtonSaved]}
          onPress={() => handleSave(item)}
          disabled={isSaved || saving}
          accessibilityRole="button"
        >
          <View style={styles.saveButtonContent}>
            {!isSaved && (
              <LottieView
                ref={(r) => { bookmarkRefs.current[key] = r; }}
                source={require('../../../assets/lottie/Bookmark.json')}
                autoPlay={false}
                loop={false}
                style={styles.saveIcon}
              />
            )}
            <Text style={[styles.saveButtonText, isSaved && styles.saveButtonTextSaved]}>
              {isSaved ? 'Saved' : 'Save to Vault'}
            </Text>
          </View>
        </TouchableOpacity>
      </View>
    );
  };

  if (wordsData.length === 0) {
    return (
      <View style={styles.emptyContainer}>
        <Text style={styles.emptyText}>No words to review.</Text>
        <AnimatedNextButton
          onPress={() => onPhaseComplete(0, 0)}
        />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.topBar}>
        <TouchableOpacity onPress={handleSkip} accessibilityRole="button">
          <Text style={styles.skipText}>Skip intro</Text>
        </TouchableOpacity>
        <Text style={styles.counterText}>
          {currentIndex + 1} / {wordsData.length}
        </Text>
      </View>

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

      <View style={styles.actionsRow}>
        <AnimatedNextButton
          onPress={handleNext}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingVertical: 24,
  },
  topBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    marginBottom: 16,
  },
  skipText: {
    fontSize: 14,
    color: TEXT_MUTED,
    fontWeight: '500',
  },
  counterText: {
    fontSize: 14,
    color: TEXT_MUTED,
    fontWeight: '600',
  },
  sliderContent: {
    paddingHorizontal: 20,
  },
  slide: {
    backgroundColor: '#323535',
    borderRadius: 24,
    padding: 24,
    marginRight: 20,
    borderWidth: 2,
    borderColor: 'rgba(78, 217, 203, 0.2)',
    overflow: 'hidden',
    // 3D shadow effect
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.4,
    shadowRadius: 20,
    elevation: 10,
  },
  glossyOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: '40%',
    borderTopLeftRadius: 22,
    borderTopRightRadius: 22,
    backgroundColor: 'rgba(255,255,255,0.15)',
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
  speakerBtn: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#4ED9CB',
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.3)',
    // 3D effect
    shadowColor: '#3BB8AC',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 4,
  },
  speakerBtnActive: {
    backgroundColor: ACCENT_COLOR,
    borderColor: 'rgba(255,255,255,0.4)',
    shadowColor: '#CC7A02',
  },
  wordLabel: {
    fontSize: 36,
    fontWeight: '700',
    color: TEXT_PRIMARY,
    letterSpacing: -0.5,
  },
  wordIpa: {
    fontSize: 16,
    color: TEXT_MUTED,
    fontStyle: 'italic',
    marginTop: 4,
  },
  section: {
    marginBottom: 20,
  },
  sectionLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: ACCENT_COLOR,
    marginBottom: 8,
    letterSpacing: 0.3,
  },
  definitionText: {
    fontSize: 16,
    color: TEXT_PRIMARY,
    lineHeight: 24,
  },
  exampleText: {
    fontSize: 15,
    lineHeight: 24,
    color: '#E5E7EB',
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
    gap: 10,
  },
  synonymChip: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    backgroundColor: 'rgba(78, 217, 203, 0.15)',
    borderWidth: 1,
    borderColor: 'rgba(78, 217, 203, 0.3)',
  },
  synonymText: {
    fontSize: 14,
    color: '#ffc09f',
    fontWeight: '500',
  },
  saveButton: {
    backgroundColor: ACCENT_COLOR,
    borderRadius: 28,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 20,
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.3)',
    // 3D effect
    shadowColor: '#CC7A02',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 6,
  },
  saveButtonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  saveIcon: {
    width: 24,
    height: 24,
  },
  saveButtonSaved: {
    backgroundColor: '#4ED9CB',
    shadowColor: '#3BB8AC',
  },
  saveButtonText: {
    color: '#1E1E1E',
    fontSize: 16,
    fontWeight: '700',
  },
  saveButtonTextSaved: {
    color: '#fff',
  },
  actionsRow: {
    paddingHorizontal: 20,
    marginTop: 8,
  },
  startButton: {
    backgroundColor: ACCENT_COLOR,
    borderRadius: 24,
    paddingVertical: 16,
    alignItems: 'center',
  },
  nextButton: {
    alignSelf: 'stretch',
  },
  startButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
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
});

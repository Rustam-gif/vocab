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
let Speech: any = null;
try {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  Speech = require('expo-speech');
} catch {}
import LottieView from 'lottie-react-native';
import { levels } from '../data/levels';
import { useAppStore } from '../../../lib/store';
import type { NewWordPayload } from '../../../types';
import AnimatedNextButton from './AnimatedNextButton';

const ACCENT_COLOR = '#F2935C';
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
          <Volume2 size={18} color={speakingFor === item.word ? ACCENT_COLOR : TEXT_MUTED} />
        </TouchableOpacity>
        <View style={styles.wordSection}>
          <Text style={styles.wordLabel}>{item.word}</Text>
          {item.ipa ? <Text style={styles.wordIpa}>{item.ipa}</Text> : null}
          <Text style={styles.wordDefinition}>{item.definition}</Text>
        </View>

        <View style={styles.exampleCard}>
          <HighlightedExample example={item.example} highlight={item.word} />
        </View>

        {renderSynonyms(item.synonyms)}

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
    backgroundColor: '#2c2f2f',
    borderRadius: 20,
    padding: 24,
    marginRight: 20,
    position: 'relative',
  },
  speakerBtn: {
    position: 'absolute',
    top: 12,
    right: 12,
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(255,255,255,0.12)',
  },
  speakerBtnActive: {
    backgroundColor: 'rgba(242,147,92,0.12)',
    borderColor: 'rgba(242,147,92,0.35)',
  },
  wordSection: {
    alignItems: 'center',
    marginBottom: 24,
  },
  wordLabel: {
    fontSize: 32,
    fontWeight: '700',
    color: TEXT_PRIMARY,
    textTransform: 'capitalize',
  },
  wordIpa: {
    fontSize: 14,
    color: TEXT_MUTED,
    fontStyle: 'italic',
    marginTop: 6,
  },
  wordDefinition: {
    fontSize: 14,
    color: '#E5E7EB',
    textAlign: 'center',
    marginTop: 16,
    lineHeight: 22,
  },
  exampleCard: {
    marginBottom: 20,
    padding: 16,
    borderRadius: 14,
    backgroundColor: '#1f1f1f',
  },
  exampleText: {
    fontSize: 14,
    lineHeight: 22,
    color: '#E5E7EB',
  },
  exampleHighlight: {
    color: ACCENT_COLOR,
    fontWeight: '700',
  },
  synonymWrapper: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 24,
  },
  synonymChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: SYNONYM_BG,
  },
  synonymText: {
    fontSize: 11,
    color: SYNONYM_TEXT,
    textTransform: 'capitalize',
  },
  saveButton: {
    backgroundColor: ACCENT_COLOR,
    borderRadius: 24,
    paddingVertical: 14,
    alignItems: 'center',
    marginBottom: 24,
  },
  saveButtonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  saveIcon: {
    width: 22,
    height: 22,
  },
  saveButtonSaved: {
    backgroundColor: BUTTON_SAVED_BG,
  },
  saveButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
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

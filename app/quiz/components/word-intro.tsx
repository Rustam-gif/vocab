import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
  Animated,
} from 'react-native';
import { ArrowLeft, ArrowRight, Volume2, Bookmark, Check, Sparkles } from 'lucide-react-native';
import { levels } from '../data/levels';

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
const CARD_WIDTH = Math.round(SCREEN_WIDTH * 0.86);
// Smaller, responsive height so cards never get cropped by header/nav
const CARD_HEIGHT = Math.min(520, Math.round(SCREEN_HEIGHT * 0.52));
const CARD_SPACING = 16;
const SIDE_PADDING = Math.round((SCREEN_WIDTH - CARD_WIDTH) / 2);

export default function WordIntroComponent({ setId, levelId, onComplete }: WordIntroProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [words, setWords] = useState<Word[]>([]);
  const [savedWords, setSavedWords] = useState<Set<string>>(new Set());
  const [savingWords, setSavingWords] = useState<Set<string>>(new Set());
  const TOTAL_CARDS = words.length + 1; // words + 1 CTA card

  const scrollX = useRef(new Animated.Value(0)).current;
  const scrollerRef = useRef<any>(null);

  useEffect(() => {
    loadWords();
  }, [setId, levelId]);

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
    const newIndex = Math.round(offsetX / (CARD_WIDTH + CARD_SPACING));
    if (newIndex !== currentIndex) setCurrentIndex(newIndex);
  };

  const goToNext = () => {
    if (currentIndex < TOTAL_CARDS - 1) {
      const x = (currentIndex + 1) * (CARD_WIDTH + CARD_SPACING);
      scrollerRef.current?.scrollTo({ x, animated: true });
      setCurrentIndex(prev => prev + 1);
    }
  };

  const goToPrevious = () => {
    if (currentIndex > 0) {
      const x = (currentIndex - 1) * (CARD_WIDTH + CARD_SPACING);
      scrollerRef.current?.scrollTo({ x, animated: true });
      setCurrentIndex(prev => prev - 1);
    }
  };

  const handleSaveWord = async (word: string) => {
    if (savingWords.has(word) || savedWords.has(word)) return;

    setSavingWords(prev => new Set(prev).add(word));
    
    // Simulate save operation
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    setSavedWords(prev => new Set(prev).add(word));
    setSavingWords(prev => {
      const newSet = new Set(prev);
      newSet.delete(word);
      return newSet;
    });
  };

  const handleStartPractice = () => {
    console.log('Start Practice button pressed');
    try {
      if (typeof onComplete === 'function') {
        console.log('Calling onComplete callback');
        onComplete();
      } else {
        console.warn('onComplete is not a function:', typeof onComplete);
      }
    } catch (e) {
      console.warn('Start Practice callback failed:', e);
    }
  };

  const isCtaIndex = currentIndex >= words.length;
  const currentWord = words[Math.min(currentIndex, words.length - 1)];
  const progressIndex = Math.min(currentIndex, words.length - 1);

  if (words.length === 0) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.loadingText}>Loading words...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>{isCtaIndex ? 'All set' : 'Word Introduction'}</Text>
        <Text style={styles.subtitle}>
          {Math.min(currentIndex + 1, words.length)} of {words.length}
        </Text>
      </View>

      {/* Progress Dots */}
      <View style={styles.progressDots}>
        {words.map((_, index) => (
          <View
            key={index}
            style={[
              styles.dot,
              index === progressIndex && styles.activeDot,
              index < currentIndex && styles.completedDot,
            ]}
          />
        ))}
      </View>

      {/* Word Cards (Horizontal Carousel) */}
      <View style={styles.cardContainer}>
        <Animated.ScrollView
          ref={scrollerRef}
          horizontal
          showsHorizontalScrollIndicator={false}
          decelerationRate="fast"
          snapToInterval={CARD_WIDTH + CARD_SPACING}
          snapToAlignment="start"
          contentContainerStyle={{ paddingHorizontal: SIDE_PADDING }}
          onMomentumScrollEnd={onMomentumEnd}
          onScroll={Animated.event(
            [{ nativeEvent: { contentOffset: { x: scrollX } } }],
            { useNativeDriver: true }
          )}
          scrollEventThrottle={16}
        >
          {words.map((w, idx) => (
            <View key={w.word + idx} style={[styles.wordCard, { width: CARD_WIDTH, marginRight: CARD_SPACING }]}>
              <View style={styles.cardContent}>
                {/* Word Header */}
                <View style={styles.wordHeader}>
                  <Text style={styles.wordText}>{w.word}</Text>
                  <TouchableOpacity style={styles.audioButton}>
                    <Volume2 size={24} color="#F2935C" />
                  </TouchableOpacity>
                </View>

                {/* Phonetic */}
                <Text style={styles.phoneticText}>{w.phonetic}</Text>

                {/* Definition */}
                <View style={styles.definitionSection}>
                  <Text style={styles.sectionTitle}>Definition</Text>
                  <Text style={styles.definitionText}>{w.definition}</Text>
                </View>

                {/* Example */}
                <View style={styles.exampleSection}>
                  <Text style={styles.sectionTitle}>Example</Text>
                  <Text style={styles.exampleText}>
                    {w.example ? w.example.split(w.word).map((part, i) => (
                      <Text key={i}>
                        {i === 0 ? part : (
                          <>
                            <Text style={styles.highlightedWord}>{w.word}</Text>
                            {part}
                          </>
                        )}
                      </Text>
                    )) : 'No example available'}
                  </Text>
                </View>

                {/* Synonyms */}
                {w.synonyms?.length ? (
                  <View style={styles.synonymsSection}>
                    <Text style={styles.sectionTitle}>Synonyms</Text>
                    <View style={styles.synonymsContainer}>
                      {w.synonyms.map((syn, i) => (
                        <View key={syn + i} style={styles.synonymTag}>
                          <Text style={styles.synonymText}>{syn}</Text>
                        </View>
                      ))}
                    </View>
                  </View>
                ) : null}

                {/* Reserve space so the fixed Save button doesn't overlap content */}
                <View style={styles.bottomGutter} />
              </View>

              {/* Fixed Save Button */}
              <TouchableOpacity
                style={[
                  styles.saveButton,
                  styles.saveButtonFixed,
                  savedWords.has(w.word) && styles.savedButton
                ]}
                onPress={() => handleSaveWord(w.word)}
                disabled={savingWords.has(w.word) || savedWords.has(w.word)}
              >
                {savingWords.has(w.word) ? (
                  <Text style={styles.saveButtonText}>Saving...</Text>
                ) : savedWords.has(w.word) ? (
                  <>
                    <Check size={20} color="#fff" />
                    <Text style={styles.saveButtonText}>Saved!</Text>
                  </>
                ) : (
                  <>
                    <Bookmark size={20} color="#fff" />
                    <Text style={styles.saveButtonText}>Save to Vault</Text>
                  </>
                )}
              </TouchableOpacity>
            </View>
          ))}

          {/* CTA Final Card */}
          <View key="cta-card" style={[styles.wordCard, styles.ctaCard, { width: CARD_WIDTH, marginRight: CARD_SPACING }]}>
            <View style={styles.ctaIconWrap}>
              <Sparkles size={28} color="#F2935C" />
            </View>
            <Text style={styles.ctaTitle}>You're ready!</Text>
            <Text style={styles.ctaText}>You've seen all {words.length} words. When you’re ready, start practicing.</Text>
            <TouchableOpacity
              style={styles.startPracticeButton}
              onPress={handleStartPractice}
              hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
            >
              <Text style={styles.startPracticeButtonText}>Start Practice</Text>
            </TouchableOpacity>
          </View>
        </Animated.ScrollView>
      </View>

      {/* Navigation Controls */}
      <View style={styles.navigationContainer}>
        <TouchableOpacity
          style={[styles.navButton, currentIndex === 0 && styles.disabledButton]}
          onPress={goToPrevious}
          disabled={currentIndex === 0}
        >
          <ArrowLeft size={24} color={currentIndex === 0 ? "#666" : "#F2935C"} />
        </TouchableOpacity>

        <View style={styles.navSpacer} />

        <TouchableOpacity
          style={[styles.navButton, currentIndex === TOTAL_CARDS - 1 && styles.disabledButton]}
          onPress={goToNext}
          disabled={currentIndex === TOTAL_CARDS - 1}
        >
          <ArrowRight size={24} color={currentIndex === TOTAL_CARDS - 1 ? "#666" : "#F2935C"} />
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1E1E1E',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#1E1E1E',
  },
  loadingText: {
    fontSize: 16,
    color: '#9CA3AF',
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 8,
    alignItems: 'center',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 16,
    color: '#9CA3AF',
  },
  progressDots: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 12,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#333',
    marginHorizontal: 4,
  },
  activeDot: {
    backgroundColor: '#F2935C',
    width: 24,
  },
  completedDot: {
    backgroundColor: '#4CAF50',
  },
  cardContainer: {
    flex: 1,
    justifyContent: 'center',
    paddingBottom: 8,
  },
  wordCard: {
    height: CARD_HEIGHT,
    backgroundColor: '#2a2a2a',
    borderRadius: 20,
    padding: 20,
    marginVertical: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
    alignSelf: 'center',
    position: 'relative',
  },
  cardContent: {
    flexGrow: 1,
    paddingBottom: 96
  },
  saveButtonFixed: {
    position: 'absolute',
    bottom: 20,
    alignSelf: 'center',
    minWidth: 180,
  },
  bottomGutter: {
    height: 96
  },
  ctaCard: {
    justifyContent: 'center',
    alignItems: 'center',
    gap: 12,
    borderWidth: 1,
    borderColor: '#3a3a3a',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 8,
    elevation: 10,
  },
  ctaIconWrap: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#333',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  wordHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  wordText: {
    fontSize: 36,
    fontWeight: 'bold',
    color: '#fff',
    flex: 1,
  },
  audioButton: {
    padding: 8,
    borderRadius: 20,
    backgroundColor: '#333',
  },
  phoneticText: {
    fontSize: 18,
    color: '#9CA3AF',
    fontStyle: 'italic',
    marginBottom: 24,
  },
  definitionSection: {
    marginBottom: 24,
  },
  exampleSection: {
    marginBottom: 24,
  },
  synonymsSection: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#F2935C',
    marginBottom: 8,
  },
  definitionText: {
    fontSize: 18,
    color: '#fff',
    lineHeight: 26,
  },
  exampleText: {
    fontSize: 16,
    color: '#fff',
    lineHeight: 24,
    fontStyle: 'italic',
  },
  highlightedWord: {
    fontWeight: 'bold',
    color: '#F2935C',
  },
  synonymsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  synonymTag: {
    backgroundColor: '#333',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  synonymText: {
    fontSize: 14,
    color: '#fff',
  },
  saveButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F2935C',
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 12,
    gap: 8,
  },
  savedButton: {
    backgroundColor: '#427F75',
  },
  saveButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
  navigationContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 12,
  },
  navButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#333',
    justifyContent: 'center',
    alignItems: 'center',
  },
  disabledButton: {
    backgroundColor: '#222',
  },
  navSpacer: {
    flex: 1,
  },
  startPracticeContainer: {
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  startPracticeButton: {
    backgroundColor: '#F2935C',
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 12,
    alignItems: 'center',
    alignSelf: 'center',
    minWidth: 180,
    zIndex: 10,
    elevation: 2,
  },
  startPracticeButtonText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#fff',
  },
  ctaTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
    textAlign: 'center',
    marginBottom: 8,
  },
  ctaText: {
    fontSize: 16,
    color: '#9CA3AF',
    textAlign: 'center',
    marginBottom: 16,
  },
});

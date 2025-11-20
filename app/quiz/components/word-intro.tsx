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
} from 'react-native';
import { ArrowLeft, ArrowRight, Volume2, Bookmark, Check, Sparkles, Globe } from 'lucide-react-native';
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
const CARD_WIDTH = Math.round(SCREEN_WIDTH * 0.86);
// Smaller, responsive height so cards never get cropped by header/nav
const CARD_HEIGHT = Math.min(520, Math.round(SCREEN_HEIGHT * 0.50));
const CARD_SPACING = 16;
const SIDE_PADDING = Math.round((SCREEN_WIDTH - CARD_WIDTH) / 2);

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
  const TOTAL_CARDS = words.length + 1; // words + 1 CTA card
  const languagePrefs = useAppStore(s => s.languagePreferences);
  const targetLang = languagePrefs?.[0] || '';
  const [translation, setTranslation] = useState<any | null>(null);
  const [loadingTr, setLoadingTr] = useState(false);
  const [trMap, setTrMap] = useState<Record<string, any>>({});
  const [showTrModal, setShowTrModal] = useState(false);
  const [modalWord, setModalWord] = useState<string | null>(null);
  const trAnim = useRef(new Animated.Value(0)).current;

  const scrollX = useRef(new Animated.Value(0)).current;
  const scrollerRef = useRef<any>(null);
  const [speakingWord, setSpeakingWord] = useState<string | null>(null);
  const voiceIdRef = useRef<string | undefined>(undefined);

  useEffect(() => {
    loadWords();
  }, [setId, levelId]);

  // Pick an American English voice if available; otherwise rely on language.
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

  // Translation fetch
  useEffect(() => {
    const w = words[Math.min(currentIndex, Math.max(0, words.length - 1))]?.word;
    if (!w || !targetLang) { setTranslation(null); return; }
    // If we already have a cached translation for this word, use it immediately
    if (trMap[w]) {
      setTranslation(trMap[w]);
      return;
    }
    let alive = true;
    setLoadingTr(true);
    TranslationService.translate(w, targetLang)
      .then(res => {
        if (!alive) return;
        if (res) {
          setTrMap(prev => ({ ...prev, [w]: res }));
          setTranslation(res);
        } else {
          setTranslation(null);
        }
      })
      .finally(() => { if (alive) setLoadingTr(false); });
    return () => { alive = false; };
  }, [currentIndex, words, targetLang]);

  const handleSaveWord = async (wordText: string) => {
    if (savingWords.has(wordText) || savedWords.has(wordText)) return;

    setSavingWords(prev => new Set(prev).add(wordText));
    
    try {
      // Find the full word data
      const wordData = words.find(w => w.word === wordText);
      if (wordData) {
        // Save to store
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
        
        // Don't navigate - let user continue their lesson
        // The word is now saved and will show as saved (checkmark instead of bookmark)
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
      <View style={[styles.loadingContainer, isLight && { backgroundColor: colors.background }]}>
        <LottieView
          source={require('../../../assets/lottie/loading.json')}
          autoPlay
          loop
          style={{ width: 140, height: 140 }}
        />
        <Text style={[styles.loadingText, isLight && { color: '#6B7280' }]}>Loading words...</Text>
      </View>
    );
  }

  return (
    <View style={[styles.container, isLight && { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={[styles.title, isLight && { color: '#111827' }]}>{isCtaIndex ? 'All set' : 'Word Introduction'}</Text>
        {/* Removed numeric progress per request */}
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
            <View key={w.word + idx} style={[styles.wordCard, isLight && styles.wordCardLight, { width: CARD_WIDTH, marginRight: CARD_SPACING }]}>
              <View style={styles.cardContent}>
                <ScrollView
                  contentContainerStyle={styles.cardBodyContent}
                  showsVerticalScrollIndicator={false}
                >
                {/* Word Header */}
                <View style={styles.wordHeader}>
                  <Text style={[styles.wordText, isLight && { color: '#111827' }]}>{w.word}</Text>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                    <TouchableOpacity
                      style={[styles.circleBtn, isLight && { backgroundColor: '#E5E7EB' }, speakingWord === w.word && { backgroundColor: '#ecd2bf' }]}
                      onPress={() => {
                        try {
                          if (speakingWord === w.word) {
                            Speech?.stop?.();
                            setSpeakingWord(null);
                            return;
                          }
                          Speech?.stop?.();
                          setSpeakingWord(w.word);
                          Speech?.speak?.(w.word, {
                            language: 'en-US',
                            voice: voiceIdRef.current,
                            rate: 0.98,
                            pitch: 1.0,
                            onDone: () => setSpeakingWord(prev => (prev === w.word ? null : prev)),
                            onStopped: () => setSpeakingWord(prev => (prev === w.word ? null : prev)),
                            onError: () => setSpeakingWord(prev => (prev === w.word ? null : prev)),
                          });
                        } catch {}
                      }}
                      accessibilityRole="button"
                      accessibilityLabel={`Play American English pronunciation for ${w.word}`}
                    >
                      <Volume2 size={20} color={'#F8B070'} />
                    </TouchableOpacity>
                  </View>
                </View>

                {/* Phonetic */}
                <Text style={[styles.phoneticText, isLight && { color: '#6B7280' }]}>{w.phonetic}</Text>

                {/* Definition */}
                <View style={styles.definitionSection}>
                  <Text style={styles.sectionTitle}>Definition</Text>
                  <Text style={[styles.definitionText, isLight && { color: '#1F2937' }]}>{w.definition}</Text>
                </View>

                {/* Example */}
                <View style={styles.exampleSection}>
                  <Text style={styles.sectionTitle}>Example</Text>
                  <Text style={[styles.exampleText, isLight && { color: '#4B5563' }]}>
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
                        <View key={syn + i} style={[styles.synonymTag, isLight && { backgroundColor: '#E5E7EB' }]}>
                          <Text style={[styles.synonymText, isLight && { color: '#111827' }]}>{syn}</Text>
                        </View>
                      ))}
                    </View>
                  </View>
                ) : null}

                {/* Translation pop-up button */}
                {!!targetLang && (
                  <TouchableOpacity
                    style={styles.trBtn}
                    onPress={async () => {
                      if (!trMap[w.word]) {
                        setLoadingTr(true);
                        const res = await TranslationService.translate(w.word, targetLang);
                        if (res) setTrMap(prev => ({ ...prev, [w.word]: res }));
                        setLoadingTr(false);
                      }
                      setModalWord(w.word);
                      setShowTrModal(true);
                      trAnim.setValue(0);
                      Animated.timing(trAnim, { toValue: 1, duration: 220, useNativeDriver: true }).start();
                    }}
                  >
                    <Globe size={16} color={'#F8B070'} />
                    <Text style={styles.trBtnText}>{loadingTr && !trMap[w.word] ? 'Translating…' : 'Show Translation'}</Text>
                  </TouchableOpacity>
                )}

                <View style={styles.bottomGutter} />
                </ScrollView>

                {/* Save to Vault (fixed inside card, slightly above bottom) */}
                <View style={styles.saveButtonContainer} pointerEvents="box-none">
                  <TouchableOpacity
                    style={[styles.saveButton, savedWords.has(w.word) && styles.savedButton]}
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
              </View>
            </View>
          ))}

          {/* CTA Final Card */}
          <View key="cta-card" style={[styles.wordCard, styles.ctaCard, isLight && styles.wordCardLight, { width: CARD_WIDTH, marginRight: CARD_SPACING }]}>
            <View style={[styles.ctaIconWrap, isLight && { backgroundColor: '#E5E7EB' }]}>
              <Sparkles size={28} color="#F8B070" />
            </View>
            <Text style={[styles.ctaTitle, isLight && { color: '#111827' }]}>You're ready!</Text>
            <Text style={[styles.ctaText, isLight && { color: '#6B7280' }]}>You've seen all {words.length} words. When you’re ready, start practicing.</Text>
            <AnimatedNextButton
              onPress={handleStartPractice}
            />
          </View>
        </Animated.ScrollView>
      </View>

      {/* Navigation Controls removed per request */}

      {/* Fixed Save dock removed — button is inside each card */}

      {/* Translation modal */}
      <Modal visible={showTrModal} transparent animationType="none" onRequestClose={() => setShowTrModal(false)}>
        <View style={styles.trModalOverlay}>
          {/* Tap outside to dismiss */}
          <TouchableOpacity style={styles.trModalBackdrop} activeOpacity={1} onPress={() => setShowTrModal(false)} />
          <Animated.View style={[styles.trSheet, isLight && styles.trSheetLight, { opacity: trAnim, transform: [{ translateY: trAnim.interpolate({ inputRange: [0,1], outputRange: [40, 0] }) }] }]}>
            <Text style={[styles.sectionTitle, isLight && { color: '#111827' }]}>Translation {targetLang ? flagFor(targetLang) : ''}</Text>
            <ScrollView style={{ maxHeight: 320 }}>
              {modalWord && trMap[modalWord] ? (
                <View>
                  <Text style={[styles.translationText, isLight && { color: '#1F2937' }]}>• {trMap[modalWord].translation}</Text>
                  {trMap[modalWord].synonyms?.length ? (
                    <Text style={[styles.translationText, isLight && { color: '#1F2937' }]}>• Synonyms: {trMap[modalWord].synonyms.join(', ')}</Text>
                  ) : null}
                  {trMap[modalWord].example ? (
                    <Text style={[styles.translationExample, isLight && { color: '#374151' }]}>“{trMap[modalWord].example}”</Text>
                  ) : null}
                </View>
              ) : (
                <Text style={[styles.translationText, isLight && { color: '#6B7280' }]}>No translation</Text>
              )}
            </ScrollView>
            <TouchableOpacity onPress={() => { Animated.timing(trAnim, { toValue: 0, duration: 180, useNativeDriver: true }).start(() => setShowTrModal(false)); }} style={[styles.saveButton, { marginTop: 12 }]}> 
              <Text style={styles.saveButtonText}>Close</Text>
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
    backgroundColor: '#1E1E1E',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#1E1E1E',
  },
  loadingText: {
    fontSize: 14,
    color: '#9CA3AF',
    fontFamily: 'Ubuntu-Regular',
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 8,
    alignItems: 'center',
  },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 4,
    fontFamily: 'Ubuntu-Bold',
  },
  subtitle: {
    fontSize: 14,
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
    backgroundColor: '#F8B070',
    width: 24,
  },
  completedDot: {
    backgroundColor: '#4CAF50',
  },
  cardContainer: {
    flex: 1,
    justifyContent: 'flex-start',
    paddingTop: 4,
    paddingBottom: 32,
  },
  wordCard: {
    minHeight: CARD_HEIGHT,
    backgroundColor: '#2a2a2a',
    borderRadius: 20,
    padding: 20,
    marginVertical: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
    alignSelf: 'center',
    position: 'relative',
  },
  wordCardLight: { backgroundColor: '#FFFFFF', borderWidth: StyleSheet.hairlineWidth, borderColor: '#FFFFFF' },
  cardContent: {
    flexGrow: 1,
    // Keep a small bottom padding; reclaim space for content
    paddingBottom: 16
  },
  cardBodyScroll: {},
  cardBodyContent: { paddingBottom: 12 },
  saveButtonFull: { alignSelf: 'stretch', marginTop: 10 },
  bottomGutter: {
    height: 0
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
    fontSize: 32,
    fontWeight: 'bold',
    color: '#fff',
    flex: 1,
    fontFamily: 'Ubuntu-Bold',
  },
  audioButton: {
    padding: 8,
    borderRadius: 20,
    backgroundColor: '#333',
  },
  circleBtn: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: '#333',
    alignItems: 'center',
    justifyContent: 'center',
  },
  phoneticText: {
    fontSize: 16,
    color: '#9CA3AF',
    fontStyle: 'italic',
    marginBottom: 24,
    fontFamily: 'Ubuntu-Regular',
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
    fontSize: 14,
    fontWeight: '600',
    color: '#F8B070',
    marginBottom: 8,
    fontFamily: 'Ubuntu-Medium',
  },
  definitionText: {
    fontSize: 16,
    color: '#fff',
    lineHeight: 23,
    fontFamily: 'Ubuntu-Regular',
  },
  exampleText: {
    fontSize: 14,
    color: '#fff',
    lineHeight: 22,
    fontStyle: 'italic',
    fontFamily: 'Ubuntu-Regular',
  },
  highlightedWord: {
    fontWeight: 'bold',
    color: '#F8B070',
    fontFamily: 'Ubuntu-Bold',
  },
  cardBodyScrollWrap: { flexGrow: 1 },
  cardBodyScroll: { maxHeight: CARD_HEIGHT - 120 },
  cardBodyContent: { paddingBottom: 8 },
  translationSection: {
    marginBottom: 20,
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderRadius: 12,
    padding: 12,
  },
  translationText: {
    color: '#E5E7EB',
    fontSize: 14,
    lineHeight: 20,
    marginTop: 4,
    fontFamily: 'Ubuntu-Regular',
  },
  translationExample: {
    color: '#9CA3AF',
    fontStyle: 'italic',
    marginTop: 6,
    fontFamily: 'Ubuntu-Regular',
  },
  trBtn: {
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 8,
    paddingHorizontal: 12,
    backgroundColor: 'rgba(248,176,112,0.14)',
    borderWidth: 1,
    borderColor: 'rgba(248,176,112,0.45)',
    borderRadius: 999,
    marginBottom: 24,
  },
  trBtnText: { color: '#111827', fontWeight: '700', fontFamily: 'Ubuntu-Bold' },
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
    fontSize: 13,
    color: '#fff',
    fontFamily: 'Ubuntu-Regular',
  },
  saveButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F8B070',
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 24,
    gap: 8,
    // Make the button a bit narrower than full width
    alignSelf: 'center',
    minWidth: 180,
    maxWidth: 280,
    width: '60%',
  },
  saveButtonContainer: {
    alignItems: 'center',
    marginTop: 16,
  },
  // saveDock removed
  savedButton: {
    backgroundColor: '#427F75',
  },
  saveButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#fff',
    fontFamily: 'Ubuntu-Bold',
  },
  trModalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.35)', justifyContent: 'flex-end' },
  trModalBackdrop: { flex: 1 },
  trSheet: { width: '100%', backgroundColor: '#2A2A2A', borderTopLeftRadius: 16, borderTopRightRadius: 16, padding: 16, paddingBottom: 24 },
  trSheetLight: { backgroundColor: '#FFFFFF' },
  // saveBar removed – button lives inside card
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
  disabledButtonLight: {
    backgroundColor: '#E5E7EB',
    opacity: 0.6,
  },
  navSpacer: {
    flex: 1,
  },
  startPracticeContainer: {
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  startPracticeButton: {
    backgroundColor: '#F8B070',
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
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
  ctaTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#fff',
    textAlign: 'center',
    marginBottom: 8,
  },
  ctaText: {
    fontSize: 14,
    color: '#9CA3AF',
    textAlign: 'center',
    marginBottom: 16,
  },
});

function flagFor(lang: string): string {
  const m: Record<string, string> = {
    zh: '🇨🇳',
    es: '🇪🇸',
    hi: '🇮🇳',
    ar: '🇸🇦',
    bn: '🇧🇩',
    pt: '🇧🇷',
    ru: '🇷🇺',
    ja: '🇯🇵',
    pa: '🇮🇳',
    de: '🇩🇪',
    jv: '🇮🇩',
    ko: '🇰🇷',
    fr: '🇫🇷',
    te: '🇮🇳',
    mr: '🇮🇳',
    ta: '🇮🇳',
    ur: '🇵🇰',
    tr: '🇹🇷',
    vi: '🇻🇳',
    it: '🇮🇹',
    fa: '🇮🇷',
    pl: '🇵🇱',
    uk: '🇺🇦',
    nl: '🇳🇱',
    th: '🇹🇭',
    id: '🇮🇩',
    he: '🇮🇱',
    el: '🇬🇷',
    sv: '🇸🇪',
    ro: '🇷🇴',
    // Keep older codes for compatibility
    uz: '🇺🇿',
    az: '🇦🇿',
    kk: '🇰🇿',
  };
  return m[lang] || '🌐';
}

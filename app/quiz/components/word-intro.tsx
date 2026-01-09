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
import { Volume2, Bookmark, Check, Globe } from 'lucide-react-native';
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
const MAIN_NODE_SIZE = 140;
const ROCKET_START_FRAME = 20;
const ROCKET_END_FRAME = 136;
const ROCKET_TOTAL_FRAMES = 144;
const ROCKET_FPS = 24;
const ROCKET_STATIC_PROGRESS = ROCKET_START_FRAME / ROCKET_TOTAL_FRAMES;
const ROCKET_LAUNCH_TIMEOUT_MS = Math.round(((ROCKET_END_FRAME - ROCKET_START_FRAME) / ROCKET_FPS) * 1000);

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
  const rocketRef = useRef<LottieView>(null);
  const rocketLaunchTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const rocketLaunchActiveRef = useRef(false);
  const [rocketLaunching, setRocketLaunching] = useState(false);

  const scrollX = useRef(new Animated.Value(0)).current;
  const scrollerRef = useRef<any>(null);
  const [speakingWord, setSpeakingWord] = useState<string | null>(null);
  const voiceIdRef = useRef<string | undefined>(undefined);

  // Breathing animation for main node
  const breatheAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    const breathe = Animated.loop(
      Animated.sequence([
        Animated.timing(breatheAnim, {
          toValue: 1.05,
          duration: 1500,
          useNativeDriver: true,
        }),
        Animated.timing(breatheAnim, {
          toValue: 1,
          duration: 1500,
          useNativeDriver: true,
        }),
      ])
    );
    breathe.start();
    return () => breathe.stop();
  }, []);

  useEffect(() => {
    return () => {
      if (rocketLaunchTimeoutRef.current) {
        clearTimeout(rocketLaunchTimeoutRef.current);
      }
    };
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

  const CARD_WIDTH = SCREEN_WIDTH;

  const onMomentumEnd = (e: any) => {
    const offsetX = e.nativeEvent.contentOffset.x;
    const newIndex = Math.round(offsetX / CARD_WIDTH);
    if (newIndex !== currentIndex) {
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

  const finishRocketLaunch = () => {
    if (!rocketLaunchActiveRef.current) return;
    rocketLaunchActiveRef.current = false;
    if (rocketLaunchTimeoutRef.current) {
      clearTimeout(rocketLaunchTimeoutRef.current);
      rocketLaunchTimeoutRef.current = null;
    }
    handleStartPractice();
  };

  const handleRocketNext = () => {
    if (rocketLaunchActiveRef.current) return;
    rocketLaunchActiveRef.current = true;
    setRocketLaunching(true);
    try {
      rocketRef.current?.reset?.();
      rocketRef.current?.play?.(ROCKET_START_FRAME, ROCKET_END_FRAME);
    } catch {}
    if (rocketLaunchTimeoutRef.current) {
      clearTimeout(rocketLaunchTimeoutRef.current);
    }
    rocketLaunchTimeoutRef.current = setTimeout(() => {
      finishRocketLaunch();
    }, ROCKET_LAUNCH_TIMEOUT_MS);
  };

  const currentWord = words[Math.min(currentIndex, words.length - 1)];
  const isLastCard = currentIndex >= words.length - 1;

  const renderMainWordNode = (word: Word) => {
    const isSaved = savedWords.has(word.word);

    return (
      <View style={styles.mainNodeContainer}>
        {/* Main node with speaker button overlay */}
        <View style={styles.mainNodeWrapper}>
          {/* Glossy teal node */}
          <Animated.View style={[styles.mainNode, { transform: [{ scale: breatheAnim }] }]}>
            {/* Glossy overlay */}
            <View style={styles.mainNodeGlossy} />
            {/* 3D edge */}
            <View style={styles.mainNodeEdge} />

            {/* Word content */}
            <View style={styles.mainNodeContent}>
              <Text style={styles.mainWordText} numberOfLines={1} adjustsFontSizeToFit>
                {word.word}
              </Text>
              <Text style={styles.mainPhoneticText}>{word.phonetic}</Text>
            </View>
          </Animated.View>

          {/* Speaker button - positioned on top-right of node */}
          <TouchableOpacity
            style={[styles.speakerButton, isLight && styles.speakerButtonLight]}
            onPress={() => {
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
            }}
          >
            <Volume2 size={16} color="#4ED9CB" />
          </TouchableOpacity>
        </View>

        {/* Word details card */}
        <View style={[styles.detailsCard, isLight && styles.detailsCardLight]}>
          <View style={styles.detailsGlossy} />

          {/* Save button in top-right corner */}
          <TouchableOpacity
            style={[styles.saveButtonCorner, isSaved && styles.savedButton]}
            onPress={() => handleSaveWord(word.word)}
            disabled={savingWords.has(word.word) || isSaved}
          >
            {isSaved ? (
              <Check size={18} color="#fff" />
            ) : (
              <Bookmark size={18} color="#fff" />
            )}
          </TouchableOpacity>

          <View style={styles.detailSection}>
            <Text style={styles.detailLabel}>Definition</Text>
            <Text style={[styles.detailText, isLight && styles.detailTextLight]}>{word.definition}</Text>
          </View>

          <View style={styles.detailSectionNopad}>
            <Text style={styles.detailLabel}>Example</Text>
            <Text style={[styles.exampleText, isLight && styles.exampleTextLight]}>
              {word.example.split(word.word).map((part, i) => (
                <Text key={i}>
                  {i === 0 ? part : (
                    <>
                      <Text style={styles.highlightWord}>{word.word}</Text>
                      {part}
                    </>
                  )}
                </Text>
              ))}
            </Text>
          </View>

          {word.synonyms?.length > 0 && (
            <View style={styles.detailSectionNopad}>
              <Text style={styles.detailLabel}>Synonyms</Text>
              <View style={styles.synonymsRow}>
                {word.synonyms.map((syn, i) => (
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
              style={styles.translateBtn}
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
              <Globe size={16} color="#F25E86" />
              <Text style={styles.translateBtnText}>
                {loadingTr && !trMap[word.word] ? 'Translating…' : 'Show Translation'}
              </Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    );
  };

  if (words.length === 0) {
    return (
      <View style={styles.loadingContainer}>
        <LottieView
          source={require('../../../assets/lottie/loading.json')}
          autoPlay
          loop
          style={{ width: 140, height: 140 }}
        />
        <Text style={styles.loadingText}>Loading words...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Progress dots */}
      <View style={styles.progressRow}>
        {words.map((_, idx) => (
          <View
            key={idx}
            style={[
              styles.progressDot,
              idx === currentIndex && styles.progressDotActive,
            ]}
          />
        ))}
      </View>

      {/* Horizontal word cards */}
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
        style={styles.horizontalScroll}
      >
        {words.map((word, idx) => (
          <View key={word.word + idx} style={[styles.cardWrapper, { width: CARD_WIDTH }]}>
            {renderMainWordNode(word)}
          </View>
        ))}

        {/* Final CTA card */}
        <View style={[styles.cardWrapper, styles.ctaWrapper, { width: CARD_WIDTH }]}>
          <View style={styles.ctaCard}>
            <View style={styles.ctaIconWrap}>
              <LottieView
                ref={rocketRef}
                source={require('../../../assets/lottie/learn/Rocket_loader.json')}
                autoPlay={false}
                loop={false}
                progress={rocketLaunching ? undefined : ROCKET_STATIC_PROGRESS}
                resizeMode="contain"
                style={styles.ctaRocket}
                onAnimationFinish={(isCancelled: boolean) => {
                  if (!isCancelled) finishRocketLaunch();
                }}
              />
            </View>
            <Text style={styles.ctaTitle}>You're ready!</Text>
            <Text style={styles.ctaText}>
              You've seen all {words.length} words. Start practicing now.
            </Text>
            <AnimatedNextButton onPress={handleRocketNext} disabled={rocketLaunching} />
          </View>
        </View>
      </Animated.ScrollView>

      {/* Bottom action - Next button only */}
      {currentIndex < words.length && (
        <View style={styles.bottomActions}>
          <AnimatedNextButton
            onPress={() => {
              const x = (currentIndex + 1) * CARD_WIDTH;
              scrollerRef.current?.scrollTo({ x, animated: true });
              LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
              setCurrentIndex(prev => prev + 1);
            }}
          />
        </View>
      )}

      {/* Translation modal */}
      <Modal visible={showTrModal} transparent animationType="none" onRequestClose={() => setShowTrModal(false)}>
        <View style={styles.modalOverlay}>
          <TouchableOpacity style={styles.modalBackdrop} activeOpacity={1} onPress={() => setShowTrModal(false)} />
          <Animated.View style={[styles.modalSheet, { opacity: trAnim, transform: [{ translateY: trAnim.interpolate({ inputRange: [0,1], outputRange: [40, 0] }) }] }]}>
            <Text style={styles.modalTitle}>Translation</Text>
            <ScrollView style={{ maxHeight: 320 }}>
              {modalWord && trMap[modalWord] ? (
                <View>
                  <Text style={styles.translationText}>{trMap[modalWord].translation}</Text>
                  {trMap[modalWord].synonyms?.length > 0 && (
                    <>
                      <Text style={styles.modalLabel}>Synonyms</Text>
                      <View style={styles.synonymsRow}>
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
    backgroundColor: 'transparent',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'transparent',
  },
  loadingText: {
    fontSize: 14,
    color: '#9CA3AF',
    fontFamily: 'Feather-Bold',
  },
  progressRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 16,
    gap: 8,
  },
  progressDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: 'rgba(255,255,255,0.2)',
  },
  progressDotActive: {
    backgroundColor: '#4ED9CB',
    width: 24,
  },

  // Scroll content
  horizontalScroll: {
    flex: 1,
  },
  scrollContent: {
    // Horizontal scroll container
  },
  cardWrapper: {
    paddingHorizontal: 20,
  },

  // Main word node
  mainNodeContainer: {
    alignItems: 'center',
    paddingTop: 8,
  },
  mainNodeWrapper: {
    position: 'relative',
  },
  mainNode: {
    width: MAIN_NODE_SIZE,
    height: MAIN_NODE_SIZE,
    borderRadius: MAIN_NODE_SIZE / 2,
    backgroundColor: '#4ED9CB',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 4,
    borderColor: 'rgba(255,255,255,0.4)',
    shadowColor: '#3BB8AC',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.5,
    shadowRadius: 20,
    elevation: 15,
    overflow: 'hidden',
  },
  mainNodeGlossy: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: '50%',
    backgroundColor: 'rgba(255,255,255,0.22)',
    borderTopLeftRadius: MAIN_NODE_SIZE / 2,
    borderTopRightRadius: MAIN_NODE_SIZE / 2,
  },
  mainNodeEdge: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 12,
    backgroundColor: '#38A89D',
    borderBottomLeftRadius: MAIN_NODE_SIZE / 2,
    borderBottomRightRadius: MAIN_NODE_SIZE / 2,
  },
  mainNodeContent: {
    alignItems: 'center',
    zIndex: 1,
    paddingHorizontal: 12,
  },
  mainWordText: {
    fontSize: 28,
    fontWeight: '700',
    color: '#FFFFFF',
    fontFamily: 'Feather-Bold',
    textShadowColor: 'rgba(0,0,0,0.2)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  mainPhoneticText: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.85)',
    fontFamily: 'Feather-Bold',
    marginTop: 4,
  },
  speakerButton: {
    position: 'absolute',
    right: -8,
    top: -8,
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#2A2A2A',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'rgba(78,217,203,0.5)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 4,
    zIndex: 10,
  },
  speakerButtonLight: {
    backgroundColor: '#FFFFFF',
    borderColor: 'rgba(78,217,203,0.8)',
  },

  // Details card
  detailsCard: {
    backgroundColor: '#1F1F1F',
    borderRadius: 20,
    padding: 20,
    marginTop: 24,
    minHeight: 340,
    borderWidth: 1.5,
    borderColor: 'rgba(78,217,203,0.15)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  detailsCardLight: {
    backgroundColor: '#FFFFFF',
    borderColor: 'rgba(78,217,203,0.3)',
  },
  detailsGlossy: {
    display: 'none', // Removed glossy effect for cleaner look
  },
  detailSection: {
    marginBottom: 16,
    paddingRight: 50,
  },
  detailSectionNopad: {
    marginBottom: 16,
  },
  detailLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#F25E86',
    marginBottom: 6,
    fontFamily: 'Feather-Bold',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  detailText: {
    fontSize: 15,
    color: '#E5E7EB',
    lineHeight: 22,
    fontFamily: 'Feather-Bold',
  },
  detailTextLight: {
    color: '#1F2937',
  },
  exampleText: {
    fontSize: 14,
    color: '#9CA3AF',
    lineHeight: 21,
    fontStyle: 'italic',
    fontFamily: 'Feather-Bold',
  },
  exampleTextLight: {
    color: '#6B7280',
  },
  highlightWord: {
    color: '#F25E86',
    fontWeight: '700',
    fontStyle: 'normal',
    fontFamily: 'Feather-Bold',
  },
  synonymsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  synonymChip: {
    backgroundColor: 'rgba(78,217,203,0.1)',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(78,217,203,0.25)',
  },
  synonymText: {
    fontSize: 13,
    color: '#ffc09f',
    fontFamily: 'Feather-Bold',
  },
  translateBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    gap: 8,
    paddingVertical: 8,
    paddingHorizontal: 14,
    backgroundColor: 'rgba(248,176,112,0.12)',
    borderRadius: 20,
    marginBottom: 16,
  },
  translateBtnText: {
    color: '#F25E86',
    fontSize: 13,
    fontWeight: '600',
    fontFamily: 'Feather-Bold',
  },
  saveButtonCorner: {
    position: 'absolute',
    top: 12,
    right: 12,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F25E86',
    width: 40,
    height: 40,
    borderRadius: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
    zIndex: 10,
  },
  savedButton: {
    backgroundColor: '#437F76',
  },

  // Bottom actions
  bottomActions: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 20,
    paddingBottom: 20,
    marginTop: 0,
  },

  // CTA card
  ctaWrapper: {
    justifyContent: 'center',
    flex: 1,
  },
  ctaCard: {
    backgroundColor: '#1F1F1F',
    borderRadius: 20,
    padding: 32,
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: 'rgba(78,217,203,0.15)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  ctaIconWrap: {
    width: 200,
    height: 200,
    borderRadius: 100,
    backgroundColor: '#4ED9CB',
    borderWidth: 3,
    borderColor: 'rgba(255,255,255,0.35)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
    shadowColor: '#3BB8AC',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.45,
    shadowRadius: 14,
    elevation: 10,
  },
  ctaRocket: {
    width: 196,
    height: 196,
  },
  ctaTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 8,
    fontFamily: 'Feather-Bold',
  },
  ctaText: {
    fontSize: 14,
    color: '#9CA3AF',
    textAlign: 'center',
    marginBottom: 20,
    fontFamily: 'Feather-Bold',
  },

  // Modal styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalBackdrop: {
    flex: 1,
  },
  modalSheet: {
    backgroundColor: '#2A2A2A',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    paddingBottom: 30,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 16,
    fontFamily: 'Feather-Bold',
  },
  modalLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#9CA3AF',
    marginTop: 16,
    marginBottom: 8,
    fontFamily: 'Feather-Bold',
  },
  translationText: {
    fontSize: 18,
    color: '#E5E7EB',
    fontFamily: 'Feather-Bold',
  },
  modalChip: {
    backgroundColor: 'rgba(255,255,255,0.08)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  modalChipText: {
    fontSize: 13,
    color: '#E5E7EB',
    fontFamily: 'Feather-Bold',
  },
  modalCloseBtn: {
    backgroundColor: '#F25E86',
    paddingVertical: 14,
    borderRadius: 24,
    alignItems: 'center',
    marginTop: 20,
  },
  modalCloseBtnText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1A1A1A',
    fontFamily: 'Feather-Bold',
  },
});

function flagFor(lang: string): string {
  const m: Record<string, string> = {
    zh: '🇨🇳', es: '🇪🇸', hi: '🇮🇳', ar: '🇸🇦', bn: '🇧🇩', pt: '🇧🇷',
    ru: '🇷🇺', ja: '🇯🇵', de: '🇩🇪', ko: '🇰🇷', fr: '🇫🇷', tr: '🇹🇷',
    vi: '🇻🇳', it: '🇮🇹', pl: '🇵🇱', uk: '🇺🇦', nl: '🇳🇱', th: '🇹🇭',
    id: '🇮🇩', he: '🇮🇱', el: '🇬🇷', sv: '🇸🇪', uz: '🇺🇿', az: '🇦🇿',
  };
  return m[lang] || '🌐';
}

/**
 * Story Exercise Screen
 * 
 * New story exercise with sentence-by-sentence layout and pill-style blanks
 */
import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  SafeAreaView,
  ActivityIndicator,
  Alert,
  Modal,
  Animated,
  Easing,
  Dimensions,
  TextInput,
  Platform,
  KeyboardAvoidingView,
  BackHandler,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { ArrowLeft, X, Settings, Maximize2, Minimize2, Sun, Moon, Check, AlertCircle, ChevronDown, Search, Bookmark } from 'lucide-react-native';
import { aiService } from '../../services/AIService';
import { useAppStore } from '../../lib/store';
import { Word } from '../../types';
import LottieView from 'lottie-react-native';

// Story customization options
interface StoryCustomization {
  genre: 'sci-fi' | 'romance' | 'adventure' | 'mystery' | 'fantasy' | 'comedy' | 'drama';
  difficulty: 'easy' | 'medium' | 'hard';
  length: 'short' | 'medium' | 'long';
}

// Mock story data structure
interface StoryBlank {
  id: string;
  correctWord: string;
  userAnswer: string;
  isCorrect: boolean;
  alternatives?: string[];
}

interface StorySentence {
  id: string;
  beforeBlank: string;
  afterBlank?: string;
  blank: StoryBlank;
  secondBlank?: StoryBlank;
  afterSecondBlank?: string;
}

interface StoryData {
  id: string;
  title: string;
  subtitle: string;
  sentences: StorySentence[];
  availableWords: string[];
}

const MAX_BLANKS = 5;

const sanitizeWords = (words: string[]): string[] => {
  const unique = Array.from(new Set(words.map(w => w.trim()).filter(Boolean)));
  return unique.slice(0, MAX_BLANKS);
};

// Soft hyphen utility: inserts discretionary hyphen points so long words can
// split across lines gracefully (a hyphen only appears when the line breaks).
const SOFT_HYPHEN = '\u00AD';
// Removed word-joiner — we want normal wrap behavior around highlighted words.
// const WORD_JOINER = '\u2060';
const VOWELS = 'aeiouyAEIOUY';
function hyphenateWord(word: string): string {
  const w = (word || '').trim();
  if (w.length < 8) return w; // keep short words intact
  if (w.includes(SOFT_HYPHEN)) return w; // already hyphenated
  if (/[^A-Za-z]/.test(w)) return w; // avoid altering non-latin or mixed tokens

  // Simple heuristic: insert points after vowel->consonant boundaries,
  // keeping chunks at least 3 chars; cap to two insertions for readability.
  const parts: string[] = [];
  let cur = '';
  let hyphens = 0;
  for (let i = 0; i < w.length; i++) {
    const ch = w[i];
    cur += ch;
    const next = i + 1 < w.length ? w[i + 1] : '';
    const boundary = VOWELS.includes(ch) && next && !VOWELS.includes(next);
    const minChunk = cur.length >= 3;
    const roomAhead = w.length - (i + 1) >= 3;
    if (boundary && minChunk && roomAhead && hyphens < 2) {
      parts.push(cur);
      cur = '';
      hyphens++;
    }
  }
  if (cur) parts.push(cur);
  return parts.join(SOFT_HYPHEN);
}

// Inline one-shot dots animation for blanks (slower, visible jump; plays once)
const InlineDotsOnce: React.FC<{ style?: any }> = ({ style }) => {
  const dots = [0, 1, 2, 3, 4, 5, 6].map(() => useRef(new Animated.Value(0)).current);
  // Derive tint color from passed style if provided
  const tintColor = (() => {
    try {
      if (!style) return '#FFB380';
      if (Array.isArray(style)) {
        for (const s of style) {
          if (s && typeof s === 'object' && 'color' in s && (s as any).color) {
            return (s as any).color as string;
          }
        }
      } else if (typeof style === 'object' && 'color' in style && (style as any).color) {
        return (style as any).color as string;
      }
    } catch {}
    return '#FFB380';
  })();

  useEffect(() => {
    const sequences = dots.map((v) =>
      Animated.sequence([
        // Jump up (fade+scale) then settle back, then snap to final visible state
        Animated.timing(v, { toValue: 1, duration: 320, useNativeDriver: true }),
        Animated.timing(v, { toValue: 0, duration: 240, useNativeDriver: true }),
        Animated.timing(v, { toValue: 1, duration: 0, useNativeDriver: true }),
      ])
    );
    Animated.stagger(160, sequences).start();
  }, [dots]);

  const renderDot = (v: Animated.Value, idx: number) => (
    <Animated.Text
      key={idx}
      style={{
        color: tintColor, // inherits from style override when provided
        opacity: v.interpolate({ inputRange: [0, 1], outputRange: [0.5, 1] }),
        transform: [
          // Higher jump: increase upward travel
          { translateY: v.interpolate({ inputRange: [0, 1], outputRange: [0, -10] }) },
          { scale: v.interpolate({ inputRange: [0, 0.5, 1], outputRange: [1, 1.18, 1] }) },
        ],
      }}
    >
      .
    </Animated.Text>
  );

  return <Text style={[styles.emptyBlankInline, style]}>{dots.map(renderDot)}</Text>;
};

export default function StoryExerciseScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ words?: string; from?: string }>();
  const [loading, setLoading] = useState(false);
  const [score, setScore] = useState(100);
  const [selectedWords, setSelectedWords] = useState<Set<string>>(new Set());
  const [story, setStory] = useState<StoryData | null>(null);
  const [showCustomizeModal, setShowCustomizeModal] = useState(false);
  const [isNormalMode, setIsNormalMode] = useState(false); // false = Fill-in-the-blanks, true = Normal
  const [isFullscreen, setIsFullscreen] = useState(false);
  const themeName = useAppStore(s => s.theme);
  const [isDarkMode, setIsDarkMode] = useState(true); // true = dark mode, false = light mode
  const [customization, setCustomization] = useState<StoryCustomization>({
    genre: 'adventure',
    difficulty: 'easy',
    length: 'short',
  });
  const [wordPickerOpen, setWordPickerOpen] = useState(false);
  const [tempSelection, setTempSelection] = useState<string[]>([]);
  const [showWordSelectionModal, setShowWordSelectionModal] = useState(false);
  const [selectedBlankId, setSelectedBlankId] = useState<string | null>(null);
  const [currentVocabulary, setCurrentVocabulary] = useState<string[]>([]);
  const [showCorrectAnswerBlank, setShowCorrectAnswerBlank] = useState<StoryBlank | null>(null);
  const [popupPosition, setPopupPosition] = useState<{ x: number; y: number } | null>(null);
  const [answersChecked, setAnswersChecked] = useState(false);
  const iconRefs = useRef<{ [key: string]: Text | null }>({});
  const [showControls, setShowControls] = useState(true); // show panels initially; hide after generation
  const chevronAnim = useRef(new Animated.Value(1)).current; // 1=open, 0=closed
  // Magical reveal for newly generated text
  const revealAnim = useRef(new Animated.Value(0)).current; // 0 -> 1
  // Sparkles overlay for reveal (fallback stars only)
  const [showSparkles, setShowSparkles] = useState(false);
  const sparklesProgress = useRef(new Animated.Value(0)).current; // stars timeline
  const sparklesTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  // Save toast
  const [saveToastVisible, setSaveToastVisible] = useState(false);
  const saveToastAnim = useRef(new Animated.Value(0)).current;
  const saveToastTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  
  // (Shine animation removed per request)

  // Glass effect removed per request; using solid dock styling

  const { words: vaultWords, loadWords, getDueWords, gradeWordSrs } = useAppStore();
  const hasStory = Boolean(story);
  const headerTitle = story?.title ?? 'Story Exercise';
  const headerSubtitle = story?.subtitle ?? null;
  
  // SRS-aware picker UI state
  const [pickerQuery, setPickerQuery] = useState('');
  const [pickerFilter, setPickerFilter] = useState<'recommended' | 'due' | 'weak' | 'all'>('recommended');
  // SRS feedback banner
  const [showSrsBanner, setShowSrsBanner] = useState(false);
  const srsBannerAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    loadWords();
  }, []);

  // Sync initial mode with app theme; user can still toggle locally
  useEffect(() => {
    const isLight = themeName === 'light';
    setIsDarkMode(!isLight);
  }, [themeName]);

  // Cleanup sparkles timer on unmount
  useEffect(() => {
    return () => {
      if (sparklesTimeoutRef.current) clearTimeout(sparklesTimeoutRef.current);
    };
  }, []);

  // no-op: stars use Animated timing controlled above

  // Android hardware back: if navigated from results, go Home; also exit fullscreen first.
  useEffect(() => {
    const sub = BackHandler.addEventListener('hardwareBackPress', () => {
      if (isFullscreen) {
        setIsFullscreen(false);
        return true; // handled
      }
      if (params.from === 'results') {
        router.replace('/');
        return true; // handled
      }
      return false; // default behavior
    });
    return () => sub.remove();
  }, [router, params.from, isFullscreen]);

  // Auto-generate story if words are passed via params
  useEffect(() => {
    if (params.words && !story && !loading) {
      const wordsArray = params.words.split(',').map(w => w.trim()).filter(Boolean);
      if (wordsArray.length >= 5) {
        const wordsToUse = wordsArray.slice(0, 5);
        setCurrentVocabulary(wordsToUse);
        generateStory(wordsToUse);
      }
    }
  }, [params.words]);

  // (Pick button shine animation removed per request)

  // (Quest progress UI removed per request)

  const generateStory = async (overrideWords?: string[]) => {
    const fallbackWords = story ? story.availableWords : currentVocabulary;
    const vocabularySource = overrideWords ?? fallbackWords;
    const vocabularyList = sanitizeWords(vocabularySource);

    if (vocabularyList.length < MAX_BLANKS) {
      Alert.alert('Not enough words', 'Pick five vocabulary words for the story.');
      return;
    }

    setLoading(true);
    setAnswersChecked(false); // Reset check state for new story
    
    try {
      console.log('Generating story with customization:', customization);

      const vocabularyWords = vocabularyList.map(word => ({
        id: word,
        word,
        definition: '',
        example: '',
      }));

      const aiGeneratedStory = await aiService.generateStory(vocabularyWords, customization);

      const parsedStory = buildStoryFromContent(aiGeneratedStory.content, vocabularyList, {
        id: aiGeneratedStory.id,
        title: aiGeneratedStory.title,
      });

      setStory(parsedStory);
      setCurrentVocabulary(vocabularyList);
      setSelectedWords(new Set());
      setScore(100);
      // Default to Fill-in-the-blanks mode
      setIsNormalMode(false);
      setShowControls(false); // compact reading mode by default after generation
      chevronAnim.setValue(0);
      // Kick magical appear animation
      try {
        revealAnim.setValue(0);
        Animated.timing(revealAnim, {
          toValue: 1,
          // Gentle 1s fade-in for the whole text block
          duration: 1000,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }).start();
        // Trigger sparkle overlays; hide automatically after it finishes or via fallback timeout
        setShowSparkles(true);
        try {
          sparklesProgress.setValue(0);
          Animated.timing(sparklesProgress, {
            toValue: 1,
            duration: 1200,
            easing: Easing.out(Easing.quad),
            useNativeDriver: true,
          }).start();
        } catch {}
        if (sparklesTimeoutRef.current) clearTimeout(sparklesTimeoutRef.current);
        // Hide sparkles shortly after the text appears
        sparklesTimeoutRef.current = setTimeout(() => setShowSparkles(false), 1600);
      } catch {}
    } catch (error) {
      // Use warn to avoid blocking red overlay when offline or parse fails
      console.warn('Error generating story:', error);
      Alert.alert('Error', 'Failed to generate story. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleWordSelect = (word: string, blankId: string) => {
    if (!story) return;

    // Remove word from available words
    setSelectedWords(prev => new Set([...prev, word]));

    // Update the story with the selected word (don't check correctness yet)
    setStory(prevStory => {
      if (!prevStory) return prevStory;

      const updatedSentences = prevStory.sentences.map(sentence => {
        if (sentence.blank.id === blankId) {
          return {
            ...sentence,
            blank: {
              ...sentence.blank,
              userAnswer: word,
              isCorrect: false, // Don't check until "Check Answers" is clicked
            },
          };
        }
        if (sentence.secondBlank && sentence.secondBlank.id === blankId) {
          return {
            ...sentence,
            secondBlank: {
              ...sentence.secondBlank,
              userAnswer: word,
              isCorrect: false, // Don't check until "Check Answers" is clicked
            },
          };
        }
        return sentence;
      });

      return { ...prevStory, sentences: updatedSentences };
    });
  };

  const handleRemoveWord = (word: string, blankId: string) => {
    if (!story) return;

    // Add word back to available words
    setSelectedWords(prev => {
      const newSet = new Set(prev);
      newSet.delete(word);
      return newSet;
    });

    // Remove word from the blank
    setStory(prevStory => {
      if (!prevStory) return prevStory;

      const updatedSentences = prevStory.sentences.map(sentence => {
        if (sentence.blank.id === blankId) {
          return {
            ...sentence,
            blank: {
              ...sentence.blank,
              userAnswer: '',
              isCorrect: false,
            },
          };
        }
        if (sentence.secondBlank && sentence.secondBlank.id === blankId) {
          return {
            ...sentence,
            secondBlank: {
              ...sentence.secondBlank,
              userAnswer: '',
              isCorrect: false,
            },
          };
        }
        return sentence;
      });

      return { ...prevStory, sentences: updatedSentences };
    });
  };

  const handleBlankPress = (blankId: string) => {
    setSelectedBlankId(blankId);
    setShowWordSelectionModal(true);
  };

  const handleWordSelection = (word: string) => {
    if (selectedBlankId) {
      handleWordSelect(word, selectedBlankId);
      setShowWordSelectionModal(false);
      setSelectedBlankId(null);
    }
  };

  const checkAnswers = () => {
    if (!story) return;

    const evaluatedBlanks: Array<{ isCorrect: boolean; hasAnswer: boolean }> = [];

    const evaluateBlank = (blank?: StoryBlank): StoryBlank | undefined => {
      if (!blank) return blank;
      const userAnswer = blank.userAnswer?.trim();
      const hasAnswer = Boolean(userAnswer);
      const isCorrect = hasAnswer && userAnswer!.toLowerCase() === blank.correctWord.toLowerCase();
      evaluatedBlanks.push({ isCorrect, hasAnswer });
      return { ...blank, isCorrect };
    };

    const updatedSentences = story.sentences.map(sentence => ({
      ...sentence,
      blank: evaluateBlank(sentence.blank)!,
      secondBlank: evaluateBlank(sentence.secondBlank),
    }));

    if (evaluatedBlanks.some(b => !b.hasAnswer)) {
      Alert.alert('Fill the blanks', 'Answer every blank before checking.');
      return;
    }

    const correctCount = evaluatedBlanks.filter(b => b.isCorrect).length;
    const total = evaluatedBlanks.length || 1;

    setStory({ ...story, sentences: updatedSentences });
    setScore(Math.round((correctCount / total) * 100));
    setAnswersChecked(true); // Mark that answers have been checked

    // SRS grading for each vocabulary word based on correctness
    try {
      const perWord: Record<string, { total: number; correct: number }> = {};
      updatedSentences.forEach(s => {
        const add = (b?: StoryBlank) => {
          if (!b) return;
          const key = b.correctWord;
          perWord[key] = perWord[key] || { total: 0, correct: 0 };
          perWord[key].total += 1;
          perWord[key].correct += b.isCorrect ? 1 : 0;
        };
        add(s.blank);
        add(s.secondBlank);
      });
      const tasks = Object.entries(perWord).map(async ([w, stats]) => {
        const match = vaultWords.find(v => v.word.toLowerCase() === w.toLowerCase());
        if (!match) return;
        const quality = stats.correct >= stats.total ? 5 : (stats.correct > 0 ? 3 : 2);
        await gradeWordSrs(match.id, quality);
      });
      Promise.all(tasks).then(() => {
        setShowSrsBanner(true);
        srsBannerAnim.setValue(0);
        Animated.timing(srsBannerAnim, { toValue: 1, duration: 220, useNativeDriver: true }).start(() => {
          setTimeout(() => {
            Animated.timing(srsBannerAnim, { toValue: 0, duration: 260, useNativeDriver: true }).start(() => setShowSrsBanner(false));
          }, 1200);
        });
      }).catch(() => {});
    } catch (e) {
      console.warn('SRS grading failed:', e);
    }
  };

  const handleSaveToJournal = async () => {
    if (!story) return;
    try {
      // Reconstruct full plain text with correct words (mirror render spacing rules)
      const startsWithPunctuation = (value: string) => /^[\s.,;:!?\)\]]/.test(value);
      const endsWithWhitespace = (value: string) => /[\s\u00A0]$/.test(value);
      const pieces: string[] = [];
      for (const s of story.sentences) {
        pieces.push(s.beforeBlank || '');
        const needSpaceBeforeFirst = !!(s.beforeBlank && !endsWithWhitespace(s.beforeBlank));
        pieces.push(needSpaceBeforeFirst ? ` ${s.blank.correctWord}` : s.blank.correctWord);
        if (s.afterBlank) {
          if (!startsWithPunctuation(s.afterBlank)) pieces.push(' ');
          pieces.push(s.afterBlank);
          if (s.secondBlank) {
            const needSpaceBeforeSecond = !endsWithWhitespace(s.afterBlank);
            pieces.push(needSpaceBeforeSecond ? ` ${s.secondBlank.correctWord}` : s.secondBlank.correctWord);
          }
        } else if (s.secondBlank) {
          pieces.push(' ' + s.secondBlank.correctWord);
        }
        if (s.afterSecondBlank) {
          if (!startsWithPunctuation(s.afterSecondBlank)) pieces.push(' ');
          pieces.push(s.afterSecondBlank);
        }
        pieces.push(' ');
      }
      const content = pieces.join('').replace(/\s+/g, ' ').trim();

      const save = useAppStore.getState().saveStory;
      const level = customization.difficulty;
      const title = headerTitle || 'Story';
      await save({
        id: `story_${Date.now()}`,
        title,
        content,
        level,
        words: story.availableWords,
        createdAt: new Date(),
      });

      // Fancy toast instead of system alert
      if (saveToastTimerRef.current) clearTimeout(saveToastTimerRef.current);
      setSaveToastVisible(true);
      saveToastAnim.setValue(0);
      Animated.timing(saveToastAnim, { toValue: 1, duration: 200, easing: Easing.out(Easing.cubic), useNativeDriver: true }).start();
      saveToastTimerRef.current = setTimeout(() => {
        Animated.timing(saveToastAnim, { toValue: 0, duration: 180, easing: Easing.in(Easing.cubic), useNativeDriver: true }).start(() => setSaveToastVisible(false));
      }, 2000);
    } catch (e) {
      console.warn('Failed to save story:', e);
      Alert.alert('Save Failed', 'Could not save the story. Please try again.');
    }
  };

  const renderBlank = (blank: StoryBlank) => {
    if (blank.userAnswer) {
      return (
        <TouchableOpacity
          style={[
            styles.blankPill,
            blank.isCorrect ? styles.blankPillCorrect : styles.blankPillIncorrect,
          ]}
          onPress={() => handleRemoveWord(blank.userAnswer, blank.id)}
        >
          <Text style={[
            styles.blankText,
            blank.isCorrect ? styles.blankTextCorrect : styles.blankTextIncorrect,
          ]}>
            {blank.userAnswer}
          </Text>
          <X size={14} color={blank.isCorrect ? "#437F76" : "#924646"} />
        </TouchableOpacity>
      );
    }

    return (
      <TouchableOpacity 
        style={styles.emptyBlank}
        onPress={() => handleBlankPress(blank.id)}
        activeOpacity={0.7}
      >
        <Text style={styles.emptyBlankText}>____</Text>
      </TouchableOpacity>
    );
  };

  const handleInfoPress = (blank: StoryBlank) => {
    const isShowingAnswer = showCorrectAnswerBlank?.id === blank.id;
    if (isShowingAnswer) {
      setShowCorrectAnswerBlank(null);
      setPopupPosition(null);
    } else {
      const iconRef = iconRefs.current[blank.id];
      if (iconRef && iconRef.measure) {
        iconRef.measure((x, y, width, height, pageX, pageY) => {
          setPopupPosition({ x: pageX - 20, y: pageY - 50 });
          setShowCorrectAnswerBlank(blank);
        });
      } else {
        // Fallback if measure doesn't work
        setPopupPosition({ x: 100, y: 200 });
        setShowCorrectAnswerBlank(blank);
      }
    }
  };

  const renderBlankInline = (blank: StoryBlank) => {
    if (blank.userAnswer) {
      const isShowingAnswer = showCorrectAnswerBlank?.id === blank.id;
      
      // Only show colors and icon after answers are checked
      const showCorrectness = answersChecked;
      
      return (
        <>
          <Text
            onPress={() => handleBlankPress(blank.id)}
            style={[
              styles.blankPillInline,
              showCorrectness && blank.isCorrect ? styles.blankTextCorrect : 
              showCorrectness && !blank.isCorrect ? styles.blankTextIncorrect :
              styles.blankTextFilled,
              // In light mode, make filled blanks a bit darker for better contrast
              !isDarkMode && !showCorrectness ? styles.blankTextFilledLight : null,
            ]}
          >
            {hyphenateWord(blank.userAnswer)}
          </Text>
          {showCorrectness && !blank.isCorrect && blank.userAnswer && (
            <>
              <Text
                onPress={() => {
                  if (isShowingAnswer) {
                    setShowCorrectAnswerBlank(null);
                  } else {
                    setShowCorrectAnswerBlank(blank);
                  }
                }}
                style={styles.incorrectIcon}
              >
                {' '}ⓘ
              </Text>
              {isShowingAnswer && (
                <Text style={styles.inlinePopup}>
                  {'\n'}
                  <Text style={styles.inlinePopupText}>{hyphenateWord(blank.correctWord)}</Text>
                </Text>
              )}
            </>
          )}
        </>
      );
    }

    return (
      <Text onPress={() => handleBlankPress(blank.id)}>
        <InlineDotsOnce style={!isDarkMode ? styles.emptyBlankInlineLight : undefined} />
      </Text>
    );
  };

  const renderSentence = (sentence: StorySentence) => {
    const startsWithPunctuation = (value: string) => /^[\s.,;:!?\)\]]/.test(value);
    const endsWithWhitespace = (value: string) => /[\s\u00A0]$/.test(value);

    if (isNormalMode) {
      const needsSpaceBeforeFirst = !!(sentence.beforeBlank && !endsWithWhitespace(sentence.beforeBlank));
      const needsSpaceBeforeSecond = !!(sentence.afterBlank && !endsWithWhitespace(sentence.afterBlank));
      return (
        <React.Fragment key={sentence.id}>
          {sentence.beforeBlank}
          <Text style={styles.completedWord}>
            {needsSpaceBeforeFirst ? ' ' : ''}
            {hyphenateWord(sentence.blank.correctWord)}
          </Text>
          {sentence.afterBlank && (
            <>
              {!startsWithPunctuation(sentence.afterBlank) ? ' ' : ''}
              {sentence.afterBlank}
              {sentence.secondBlank && (
                <Text style={styles.completedWord}>
                  {needsSpaceBeforeSecond ? ' ' : ''}
                  {hyphenateWord(sentence.secondBlank.correctWord)}
                </Text>
              )}
            </>
          )}
          {!sentence.afterBlank && sentence.secondBlank && (
            <Text style={styles.completedWord}>
              {' '}
              {hyphenateWord(sentence.secondBlank.correctWord)}
            </Text>
          )}
          {sentence.afterSecondBlank && (
            <>
              {!startsWithPunctuation(sentence.afterSecondBlank) ? ' ' : ''}
              {sentence.afterSecondBlank}
            </>
          )}
        </React.Fragment>
      );
    }

    {
      const needsSpaceBeforeFirst = !!(sentence.beforeBlank && !endsWithWhitespace(sentence.beforeBlank));
      const needsSpaceBeforeSecond = !!(sentence.afterBlank && !endsWithWhitespace(sentence.afterBlank));
      return (
        <React.Fragment key={sentence.id}>
          {sentence.beforeBlank}
          {renderBlankInline(sentence.blank, needsSpaceBeforeFirst)}
          {sentence.afterBlank ? (
            <>
              {!startsWithPunctuation(sentence.afterBlank) ? ' ' : ''}
              {sentence.afterBlank}
              {sentence.secondBlank && renderBlankInline(sentence.secondBlank, needsSpaceBeforeSecond)}
            </>
          ) : (
            sentence.secondBlank && renderBlankInline(sentence.secondBlank, true)
          )}
          {sentence.afterSecondBlank && (
            <>
              {!startsWithPunctuation(sentence.afterSecondBlank) ? ' ' : ''}
              {sentence.afterSecondBlank}
            </>
          )}
        </React.Fragment>
      );
    }
  };  const getAvailableWords = () => {
    if (!story) return [];
    return story.availableWords.filter(word => !selectedWords.has(word));
  };

const buildStoryFromContent = (
  rawContent: string,
  vocabulary: string[],
  meta?: { id?: string; title?: string }
): StoryData => {
  const cleanWords = sanitizeWords(vocabulary);
  // Normalize newlines
  let normalized = rawContent.replace(/\r\n/g, '\n');
  // Keep only true paragraph breaks and remove single newlines inside paragraphs
  // 1) Mark paragraph breaks (two or more newlines)
  normalized = normalized.replace(/\n{2,}/g, '<<BR>>');
  // 2) Collapse single newlines to spaces
  normalized = normalized.replace(/\n/g, ' ');
  // 3) Restore paragraph breaks as a single blank line
  normalized = normalized.replace(/<<BR>>/g, '\n\n');
  // 4) Normalize excessive spaces
  normalized = normalized.replace(/\s+/g, ' ').replace(/\s*\n\s*/g, '\n\n').trim();
  // Prefer **word** markers; otherwise support six-dot blanks "......" mapped to vocabulary order.
  const escapeRe = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  let pieces: string[] | null = null;
  if (/\*\*(.+?)\*\*/.test(normalized)) {
    pieces = normalized.split(/\*\*(.+?)\*\*/g);
  } else if (/\.{6}/.test(normalized)) {
    // Split around six-dot placeholders, keeping separators
    const parts = normalized.split(/(\.{6})/);
    // Build pseudo pieces array compatible with the **word** logic: [before, word1, after1, word2, after2, ...]
    const pseudo: string[] = [];
    let before = '';
    let idx = 0;
    parts.forEach((seg) => {
      if (seg === '......') {
        const correct = cleanWords[idx] || `word${idx + 1}`;
        pseudo.push(before);
        pseudo.push(correct);
        before = '';
        idx += 1;
      } else {
        before += seg;
      }
    });
    pseudo.push(before);
    pieces = pseudo;
  } else {
    // Try to auto-wrap the first occurrence of each word with ** ** as a fallback
    for (const w of cleanWords) {
      const wrapped = new RegExp(`\\*\\*${escapeRe(w)}\\*\\*`, 'i');
      if (!wrapped.test(normalized)) {
        const plain = new RegExp(`\\b${escapeRe(w)}\\b`, 'i');
        if (plain.test(normalized)) {
          normalized = normalized.replace(plain, (m) => `**${m}**`);
        }
      }
    }
    pieces = normalized.split(/\*\*(.+?)\*\*/g);
  }

  const sentences: StorySentence[] = [];
  let suppressNextBefore = false; // when true, we hide the next before-segment to avoid duplication
  for (let i = 0; i < cleanWords.length; i += 1) {
    const baseBefore = (pieces[2 * i] ?? '');
    const beforeSegment = suppressNextBefore ? '' : baseBefore;
    suppressNextBefore = false;
    const highlightedWord = pieces[2 * i + 1]?.trim() || cleanWords[i];
    const rawAfter = pieces[2 * i + 2] ?? '';
    // Show the inter-blank span after the CURRENT word, not before the next one.
    // This keeps punctuation attached to the chosen word and prevents odd line breaks.
    let afterSegment = rawAfter;
    if (i < cleanWords.length - 1) {
      suppressNextBefore = true; // we already displayed this span; don't render it as the next 'before'
    }

    // Only use words from our vocabulary list - ignore extra words the AI might have wrapped
    const isVocabWord = cleanWords.some(w => w.toLowerCase() === highlightedWord.toLowerCase());
    if (!isVocabWord) {
      console.warn(`Skipping non-vocabulary word: "${highlightedWord}"`);
      continue;
    }

    sentences.push({
      id: `sentence-${sentences.length + 1}`,
      beforeBlank: beforeSegment,
      afterBlank: afterSegment,
      blank: {
        id: `blank-${sentences.length + 1}`,
        correctWord: highlightedWord,
        userAnswer: '',
        isCorrect: false,
      },
    });
  }

  // No template lead-ins; leave content unchanged even if it starts with a blank

  // If no matches were found, create simple structure using the entire content
  if (!sentences.length) {
    sentences.push({
      id: 'sentence-1',
  beforeBlank: normalized,
      blank: {
        id: 'blank-1',
        correctWord: cleanWords[0] || '',
        userAnswer: '',
        isCorrect: false,
      },
    });
  }

  // No template tail padding; leave the ending as-is

  return {
    id: meta?.id || `story_${Date.now()}`,
    title: meta?.title || 'Story Exercise',
    subtitle: 'Practice with words from your vault',
    sentences,
    availableWords: cleanWords,
  };
};

  if (loading) {
    return (
      <SafeAreaView style={[styles.container, !isDarkMode && styles.containerLight]}>
        <View style={styles.loadingContainer}>
          <LottieView
            source={require('./Poetry.json')}
            autoPlay
            loop
            style={{ width: 200, height: 200 }}
          />
          <Text style={styles.loadingText}>Generating your story…</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, !isDarkMode && styles.containerLight]}>
      {/* Header - Hidden in fullscreen */}
      {!isFullscreen && (
        <View style={[styles.header, !isDarkMode && styles.headerLight]}>
          <TouchableOpacity onPress={() => {
            if (params.from === 'results') {
              router.replace('/');
            } else {
              router.back();
            }
          }} style={styles.backButton}>
            <ArrowLeft size={24} color={isDarkMode ? "#FFFFFF" : "#111827"} />
          </TouchableOpacity>
          <View style={styles.headerCenter}>
            <Text style={[styles.headerTitle, !isDarkMode && styles.headerTitleLight]}>{headerTitle}</Text>
            {headerSubtitle ? (
              <Text style={[styles.headerSubtitle, !isDarkMode && styles.headerSubtitleLight]}>{headerSubtitle}</Text>
            ) : null}
          </View>
          <TouchableOpacity style={styles.closeButton} onPress={() => {
            if (params.from === 'results') {
              router.replace('/');
            } else {
              router.back();
            }
          }}>
            <X size={24} color={isDarkMode ? "#FFFFFF" : "#111827"} />
          </TouchableOpacity>
        </View>
      )}

      {/* Mode Toggle - compact toggle only when user expands controls */}
      {!isFullscreen && hasStory && showControls && false && (
        <View style={styles.toggleContainer}>
          <TouchableOpacity 
            style={styles.toggleButton}
            onPress={() => setIsNormalMode(!isNormalMode)}
          >
            <View style={[styles.toggleTrack, isNormalMode && styles.toggleTrackActive]}>
              <View style={[styles.toggleThumb, isNormalMode && styles.toggleThumbActive]} />
            </View>
            <Text style={[styles.toggleLabel, !isDarkMode && styles.toggleLabelLight]}>
              {isNormalMode ? 'Normal Reading' : 'Fill-in-the-blanks'}
            </Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Tools Dock - grouped controls in one place */}
      {!isFullscreen && (
        <View style={styles.panelContainer}>
          <View style={[styles.toolsDock, !isDarkMode && styles.toolsDockLight]}>
            {/* Pick */}
            <TouchableOpacity
              style={styles.dockItem}
              onPress={() => {
                if (!vaultWords.length) {
                  Alert.alert('Vault Empty', 'Add words to your vault to build a custom story.');
                  return;
                }
                setTempSelection(story ? [...story.availableWords] : [...currentVocabulary]);
                setWordPickerOpen(true);
              }}
              activeOpacity={0.85}
            >
              <Search size={12} color={isDarkMode ? "#E5E7EB" : "#374151"} />
              <Text style={[styles.dockText, !isDarkMode && styles.dockTextLight]}>Pick</Text>
            </TouchableOpacity>

            {/* Customize */}
            <TouchableOpacity
              style={styles.dockItem}
              onPress={() => setShowCustomizeModal(true)}
              activeOpacity={0.85}
            >
              <Settings size={12} color={isDarkMode ? "#E5E7EB" : "#374151"} />
              <Text style={[styles.dockText, !isDarkMode && styles.dockTextLight]}>Customize</Text>
            </TouchableOpacity>

            {/* Save */}
            <TouchableOpacity
              style={[styles.dockItem, !hasStory && styles.dockItemDisabled]}
              onPress={handleSaveToJournal}
              disabled={!hasStory}
              activeOpacity={0.85}
            >
              <Bookmark size={12} color={isDarkMode ? "#E5E7EB" : "#374151"} />
              <Text style={[styles.dockText, !isDarkMode && styles.dockTextLight]}>Save</Text>
            </TouchableOpacity>
          </View>
          {/* Gamified quest progress */}
          {/* Quest progress UI removed per request */}
        </View>
      )}

      {/* Story Content */}
      <View style={styles.storyContainer}>
        <ScrollView 
          style={[
            styles.content,
            isFullscreen && styles.contentFullscreen,
            isFullscreen && !isDarkMode && styles.contentFullscreenLight,
          ]} 
          showsVerticalScrollIndicator={false}
        >
          {/* Paper-like reading card when a story is present */}
          <>
          <View style={isDarkMode ? styles.storyContentCard : styles.storyPaperCard}>
            {/* Controls toggle */}
            {/* Card-level icons removed to reduce clutter; everything is in the dock above */}
            <TouchableOpacity 
              style={styles.fullscreenButton}
              onPress={() => setIsFullscreen(!isFullscreen)}
            >
              {isFullscreen ? 
                <Minimize2 size={16} color="#9CA3AF" /> : 
                <Maximize2 size={16} color="#9CA3AF" />
              }
            </TouchableOpacity>

            {/* Theme toggle */}
            <TouchableOpacity
              style={styles.themeIconBtn}
              onPress={() => setIsDarkMode(prev => !prev)}
              accessibilityRole="button"
              accessibilityLabel={isDarkMode ? 'Switch to light mode' : 'Switch to dark mode'}
              activeOpacity={0.85}
            >
              {isDarkMode ? (
                <Sun size={14} color="#F3F4F6" />
              ) : (
                <Moon size={14} color="#111827" />
              )}
            </TouchableOpacity>

            <Animated.View
              style={[
                styles.storyText,
                !isDarkMode && styles.storyTextLight,
                {
                  // Keep a gentle entrance transform on the wrapper
                  opacity: 1,
                  transform: [
                    { translateY: revealAnim.interpolate({ inputRange: [0, 1], outputRange: [10, 0] }) },
                    { scale: revealAnim.interpolate({ inputRange: [0, 1], outputRange: [0.985, 1] }) },
                  ],
                },
              ]}
            >
              {hasStory ? (
                <Text style={isDarkMode ? styles.sentenceText : styles.sentenceTextPaper}>
                  {(story?.sentences ?? []).map((s, idx) => {
                    const total = Math.max(1, (story?.sentences?.length ?? 1));
                    const step = 1 / (total + 1);
                    const start = Math.min(idx * step, 0.9);
                    const end = Math.min(start + step * 0.85, 1);
                    const opacity = revealAnim.interpolate({ inputRange: [start, end], outputRange: [0, 1], extrapolate: 'clamp' });
                    const ty = revealAnim.interpolate({ inputRange: [start, end], outputRange: [6, 0], extrapolate: 'clamp' });
                    return (
                      <Animated.Text key={s.id} style={{ opacity, transform: [{ translateY: ty }] }}>
                        {renderSentence(s)}
                      </Animated.Text>
                    );
                  })}
                </Text>
              ) : (
                <View style={styles.storyPlaceholder}>
                  <Text style={[styles.storyPlaceholderTitle, !isDarkMode && styles.storyPlaceholderTitleLight]}>Ready when you are</Text>
                  <Text style={[styles.storyPlaceholderBody, !isDarkMode && styles.storyPlaceholderBodyLight]}>
                    Choose five words, tweak the story settings, then tap Generate to craft a new narrative.
                  </Text>
                  <TouchableOpacity
                    style={styles.storyPlaceholderButton}
                    onPress={() => {
                      if (!vaultWords.length) {
                        Alert.alert('Vault Empty', 'Add words to your vault to build a custom story.');
                        return;
                      }
                      setTempSelection([...currentVocabulary]);
                      setWordPickerOpen(true);
                    }}
                  >
                    <Text style={styles.storyPlaceholderButtonText}>Pick Words</Text>
                  </TouchableOpacity>
                </View>
              )}
              {/* Lottie sparkles overlay while revealing */}
              {hasStory && showSparkles && (
                <MagicSparkles progress={sparklesProgress} dark={isDarkMode} />
              )}
            </Animated.View>
          </View>
          <View style={styles.bottomSpacing} />
          </>
        </ScrollView>
      </View>

      {/* Footer Buttons - Hidden in fullscreen */}
      {!isFullscreen && (
        <View style={styles.footer}>
          <TouchableOpacity
            style={styles.regenerateButton}
            onPress={() => generateStory()}
            disabled={loading}
          >
            <Text style={styles.regenerateButtonText}>Generate</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.checkButton, (!hasStory || loading) && styles.checkButtonDisabled]}
            onPress={checkAnswers}
            disabled={!hasStory || loading}
          >
            <Text style={styles.checkButtonText}>Check Answers</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Save Toast */}
      {saveToastVisible && (
        <Animated.View
          pointerEvents="box-none"
          style={[
            styles.saveToastWrap,
            {
              opacity: saveToastAnim,
              transform: [
                { translateY: saveToastAnim.interpolate({ inputRange: [0, 1], outputRange: [12, 0] }) },
              ],
            },
          ]}
        >
          <View style={[styles.saveToastCard, !isDarkMode && styles.saveToastCardLight]}>
            <Text style={[styles.saveToastTitle, !isDarkMode && styles.saveToastTitleLight]}>Saved to Journal</Text>
            <Text style={[styles.saveToastText, !isDarkMode && styles.saveToastTextLight]}>Your story has been saved.</Text>
            <View style={styles.saveToastActions}>
              <TouchableOpacity
                onPress={() => {
                  Animated.timing(saveToastAnim, { toValue: 0, duration: 160, useNativeDriver: true }).start(() => setSaveToastVisible(false));
                }}
                style={styles.saveToastBtn}
              >
                <Text style={[styles.saveToastBtnText, !isDarkMode && styles.saveToastBtnTextLight]}>Close</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => {
                  Animated.timing(saveToastAnim, { toValue: 0, duration: 140, useNativeDriver: true }).start(() => setSaveToastVisible(false));
                  router.push('/journal');
                }}
                style={[styles.saveToastBtn, styles.saveToastPrimary]}
              >
                <Text style={styles.saveToastPrimaryText}>Open Journal</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Animated.View>
      )}

      {/* SRS feedback banner */}
      {showSrsBanner && (
        <Animated.View
          style={[
            styles.srsBanner,
            {
              opacity: srsBannerAnim,
              transform: [{ translateY: srsBannerAnim.interpolate({ inputRange: [0, 1], outputRange: [20, 0] }) }],
            },
          ]}
        >
          <Check size={16} color="#FFFFFF" />
          <Text style={styles.srsBannerText}>Practice saved to review schedule</Text>
        </Animated.View>
      )}

      {/* Customize Modal */}
      <Modal
        visible={showCustomizeModal}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowCustomizeModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Customize Story</Text>
              <TouchableOpacity onPress={() => setShowCustomizeModal(false)}>
                <X size={24} color="#9CA3AF" />
              </TouchableOpacity>
            </View>

            {/* Genre Selection */}
            <View style={styles.optionSection}>
              <Text style={styles.optionTitle}>Genre</Text>
              <View style={styles.optionRow}>
                {['sci-fi', 'romance', 'adventure', 'mystery', 'fantasy', 'comedy', 'drama'].map((genre) => (
                  <TouchableOpacity
                    key={genre}
                    style={[
                      styles.optionPill,
                      customization.genre === genre && styles.optionPillSelected
                    ]}
                    onPress={() => setCustomization(prev => ({ ...prev, genre: genre as any }))}
                  >
                    <Text style={[
                      styles.optionPillText,
                      customization.genre === genre && styles.optionPillTextSelected
                    ]}>
                      {genre.charAt(0).toUpperCase() + genre.slice(1)}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* Difficulty Selection */}
            <View style={styles.optionSection}>
              <Text style={styles.optionTitle}>Difficulty</Text>
              <View style={styles.optionRow}>
                {['easy', 'medium', 'hard'].map((difficulty) => (
                  <TouchableOpacity
                    key={difficulty}
                    style={[
                      styles.optionPill,
                      customization.difficulty === difficulty && styles.optionPillSelected
                    ]}
                    onPress={() => setCustomization(prev => ({ ...prev, difficulty: difficulty as any }))}
                  >
                    <Text style={[
                      styles.optionPillText,
                      customization.difficulty === difficulty && styles.optionPillTextSelected
                    ]}>
                      {difficulty.charAt(0).toUpperCase() + difficulty.slice(1)}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* Length Selection */}
            <View style={styles.optionSection}>
              <Text style={styles.optionTitle}>Story Length</Text>
              <View style={styles.optionRow}>
                {['short', 'medium', 'long'].map((length) => (
                  <TouchableOpacity
                    key={length}
                    style={[
                      styles.optionPill,
                      customization.length === length && styles.optionPillSelected
                    ]}
                    onPress={() => setCustomization(prev => ({ ...prev, length: length as any }))}
                  >
                    <Text style={[
                      styles.optionPillText,
                      customization.length === length && styles.optionPillTextSelected
                    ]}>
                      {length.charAt(0).toUpperCase() + length.slice(1)}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            <TouchableOpacity 
              style={styles.applyButton}
              onPress={() => {
                setShowCustomizeModal(false);
                generateStory();
              }}
            >
              <Text style={styles.applyButtonText}>Generate Custom Story</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      <Modal
        visible={wordPickerOpen}
        transparent={false}
        animationType="slide"
        onRequestClose={() => setWordPickerOpen(false)}
      >
        <SafeAreaView style={[styles.wordPickerOverlay, !isDarkMode && styles.wordPickerOverlayLight]}>
          <KeyboardAvoidingView
            style={[styles.wordPickerContent, !isDarkMode && styles.wordPickerContentLight]}
            behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          >
            <View style={styles.wordPickerHeader}>
              <Text style={[styles.modalTitle, !isDarkMode && styles.modalTitleLight]}>Select Words</Text>
              <TouchableOpacity onPress={() => setWordPickerOpen(false)}>
                <X size={24} color={isDarkMode ? '#9CA3AF' : '#6B7280'} />
              </TouchableOpacity>
            </View>
            <Text style={[styles.wordPickerSubtitle, !isDarkMode && styles.wordPickerSubtitleLight]}>
              Pick 5 words from your vault.
            </Text>
            {/* SRS filters + search */}
            <View style={styles.wordPickerControls}>
              <View style={styles.filterChipsRow}>
                {([
                  { key: 'recommended', label: 'Recommended' },
                  { key: 'due', label: 'Due' },
                  { key: 'weak', label: 'Weak' },
                  { key: 'all', label: 'All' },
                ] as const).map(({ key, label }) => (
                  <TouchableOpacity
                    key={key}
                    style={[styles.filterChip, !isDarkMode && styles.filterChipLight, pickerFilter === key && styles.filterChipActive]}
                    onPress={() => setPickerFilter(key)}
                  >
                    <Text style={[styles.filterChipText, !isDarkMode && styles.filterChipTextLight, pickerFilter === key && styles.filterChipTextActive]}>{label}</Text>
                  </TouchableOpacity>
                ))}
                <TouchableOpacity
                  style={styles.autoPickButton}
                  onPress={() => {
                    const now = new Date();
                    // Rank due/overdue with a weight so it doesn't just take the first 5
                    const dueRaw = (getDueWords ? getDueWords(9999) : []) as Word[];
                    const rankDue = (w: Word) => {
                      const dueAt = w.srs?.dueAt ? new Date(w.srs.dueAt) : new Date(0);
                      const overdueDays = Math.max(0, Math.floor((now.getTime() - dueAt.getTime()) / (1000 * 60 * 60 * 24)));
                      const lapses = w.srs?.lapses ?? 0;
                      const weakBoost = w.isWeak ? 15 : 0;
                      // Higher is better; tiny noise breaks ties
                      return 100 + overdueDays * 3 + lapses * 4 + weakBoost + Math.random();
                    };
                    const due = [...dueRaw].sort((a, b) => rankDue(b) - rankDue(a));
                    const pickedIds = new Set<string>();
                    const picks: Word[] = [];
                    const take = (arr: Word[]) => {
                      for (const w of arr) {
                        if (picks.length >= MAX_BLANKS) break;
                        if (pickedIds.has(w.id)) continue;
                        pickedIds.add(w.id);
                        picks.push(w);
                      }
                    };
                    // Start with top-ranked due/overdue
                    take(due);
                    // Then weak by lapses desc
                    if (picks.length < MAX_BLANKS) {
                      const weak = vaultWords
                        .filter(w => w.isWeak && !pickedIds.has(w.id))
                        .sort((a, b) => (b.srs?.lapses ?? 0) - (a.srs?.lapses ?? 0));
                      take(weak);
                    }
                    // Then recent (randomized within top 20 to avoid always-first)
                    if (picks.length < MAX_BLANKS) {
                      const recent = vaultWords
                        .filter(w => !pickedIds.has(w.id))
                        .sort((a, b) => new Date(b.savedAt).getTime() - new Date(a.savedAt).getTime());
                      const top = recent.slice(0, 20).sort(() => Math.random() - 0.5);
                      take(top);
                      if (picks.length < MAX_BLANKS) take(recent); // fallback
                    }
                    setTempSelection(picks.slice(0, MAX_BLANKS).map(w => w.word));
                    setPickerFilter('recommended');
                  }}
                >
                  <Text style={styles.autoPickButtonText}>Auto-pick 5</Text>
                </TouchableOpacity>
              </View>
              <View style={[styles.searchInputWrap, !isDarkMode && styles.searchInputWrapLight]}>
                <TextInput
                  placeholder="Search word or definition"
                  placeholderTextColor="#6B7280"
                  value={pickerQuery}
                  onChangeText={setPickerQuery}
                  style={[styles.searchInput, !isDarkMode && styles.searchInputLight]}
                />
              </View>
            </View>

            <ScrollView
              style={styles.wordPickerList}
              contentContainerStyle={styles.wordPickerListContent}
              keyboardShouldPersistTaps="handled"
              showsVerticalScrollIndicator={false}
            >
              {(() => {
                const now = new Date();
                const query = pickerQuery.trim().toLowerCase();
                let base: Word[] = [];
                if (pickerFilter === 'recommended') {
                  const dueRaw = (getDueWords ? getDueWords(9999) : []) as Word[];
                  const rankDue = (w: Word) => {
                    const dueAt = w.srs?.dueAt ? new Date(w.srs.dueAt) : new Date(0);
                    const overdueDays = Math.max(0, Math.floor((now.getTime() - dueAt.getTime()) / (1000 * 60 * 60 * 24)));
                    const lapses = w.srs?.lapses ?? 0;
                    const weakBoost = w.isWeak ? 15 : 0;
                    return 100 + overdueDays * 3 + lapses * 4 + weakBoost + Math.random();
                  };
                  const due = [...dueRaw].sort((a, b) => rankDue(b) - rankDue(a));
                  const dueIds = new Set(due.map(d => d.id));
                  const weak = vaultWords
                    .filter(w => w.isWeak && !dueIds.has(w.id))
                    .sort((a, b) => (b.srs?.lapses ?? 0) - (a.srs?.lapses ?? 0));
                  const rest = vaultWords
                    .filter(w => !dueIds.has(w.id) && !weak.some(ww => ww.id === w.id))
                    .sort((a, b) => new Date(b.savedAt).getTime() - new Date(a.savedAt).getTime());
                  base = [...due, ...weak, ...rest];
                } else if (pickerFilter === 'due') {
                  base = (getDueWords ? getDueWords(9999) : []) as Word[];
                } else if (pickerFilter === 'weak') {
                  base = vaultWords.filter(w => w.isWeak);
                } else {
                  base = [...vaultWords];
                }
                if (query) {
                  base = base.filter(w =>
                    w.word.toLowerCase().includes(query) ||
                    w.definition.toLowerCase().includes(query) ||
                    (w.example || '').toLowerCase().includes(query)
                  );
                }
                return base;
              })().map((word: Word) => {
                const selected = tempSelection.includes(word.word);
                const disabled = !selected && tempSelection.length >= MAX_BLANKS;
                const dueAt = word.srs?.dueAt ? new Date(word.srs.dueAt) : null;
                const now = new Date();
                const isDue = dueAt ? dueAt <= now : true;
                const daysUntil = dueAt ? Math.ceil((dueAt.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)) : 0;
                const statusLabel = isDue ? (dueAt && dueAt < now ? 'Overdue' : 'Due') : `In ${daysUntil}d`;
                return (
                  <TouchableOpacity
                    key={word.id}
                    style={[
                      styles.wordPickerItem,
                      !isDarkMode && styles.wordPickerItemLight,
                      selected && (isDarkMode ? styles.wordPickerItemSelected : styles.wordPickerItemSelectedLight),
                      disabled && styles.wordPickerItemDisabled,
                    ]}
                    activeOpacity={0.7}
                    onPress={() => {
                      if (selected) {
                        setTempSelection(prev => prev.filter(w => w !== word.word));
                      } else if (!disabled) {
                        setTempSelection(prev => sanitizeWords([...prev, word.word]));
                      }
                    }}
                  >
                    <View style={styles.wordPickerItemHeader}>
                      <Text style={[styles.wordPickerWord, !isDarkMode && styles.wordPickerWordLight]}>{hyphenateWord(word.word)}</Text>
                      <View style={styles.wordBadgeRow}>
                        {word.isWeak ? (
                          <View style={[styles.statusPill, { backgroundColor: 'rgba(242,147,92,0.15)', borderColor: 'rgba(242,147,92,0.35)' }]}>
                            <Text style={[styles.statusPillText, { color: '#F2935C' }]}>Weak</Text>
                          </View>
                        ) : null}
                        <View style={[styles.statusPill, isDue ? styles.duePill : styles.futurePill]}>
                          <Text style={[styles.statusPillText, isDue ? styles.duePillText : styles.futurePillText]}>{statusLabel}</Text>
                        </View>
                      </View>
                      {selected && <Check size={16} color="#437F76" />}
                    </View>
                    <Text style={[styles.wordPickerDefinition, !isDarkMode && styles.wordPickerDefinitionLight]}>{word.definition}</Text>
                    {!!word.example && (
                      <Text style={[styles.wordPickerExample, !isDarkMode && styles.wordPickerExampleLight]}>“{word.example}”</Text>
                    )}
                  </TouchableOpacity>
                );
              })}
              {!vaultWords.length && (
                <View style={styles.emptyState}>
                  <Text style={styles.emptyTitle}>No saved words yet</Text>
                  <Text style={styles.emptySubtitle}>
                    Add vocabulary to your vault to build custom stories.
                  </Text>
                </View>
              )}
            </ScrollView>
            <View style={styles.wordPickerFooter}>
              <Text style={[styles.wordPickerCount, !isDarkMode && styles.wordPickerCountLight]}>
                {tempSelection.length} / {MAX_BLANKS} selected
              </Text>
              <View style={styles.footerActions}>
                <TouchableOpacity
                  style={[styles.modalReset, !isDarkMode && styles.modalResetLight, tempSelection.length === 0 && styles.modalResetDisabled]}
                  onPress={() => setTempSelection([])}
                  disabled={tempSelection.length === 0}
                >
                  <Text style={[styles.modalResetText, !isDarkMode && styles.modalResetTextLight]}>Reset</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.modalPrimary, tempSelection.length !== MAX_BLANKS && styles.modalPrimaryDisabled]}
                  onPress={() => {
                    if (tempSelection.length !== MAX_BLANKS) {
                      Alert.alert('Choose five words', 'Select exactly five words for the story.');
                      return;
                    }
                    setWordPickerOpen(false);
                    const sanitized = sanitizeWords(tempSelection);
                    setCurrentVocabulary(sanitized);
                    generateStory(sanitized);
                  }}
                  disabled={tempSelection.length !== MAX_BLANKS || loading}
                >
                  {loading ? (
                    <ActivityIndicator color="#1E1E1E" />
                  ) : (
                    <Text style={styles.modalPrimaryText}>Use Words</Text>
                  )}
                </TouchableOpacity>
              </View>
            </View>
          </KeyboardAvoidingView>
        </SafeAreaView>
      </Modal>
      
      {/* Word Selection Modal */}
      <Modal
        visible={showWordSelectionModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowWordSelectionModal(false)}
      >
        <View style={[styles.wordSelectionOverlay, !isDarkMode && styles.wordSelectionOverlayLight]}>
          <View style={[styles.wordSelectionModal, !isDarkMode && styles.wordSelectionModalLight]}>
            <View style={[styles.wordSelectionHeader, !isDarkMode && styles.wordSelectionHeaderLight]}>
              <Text style={[styles.wordSelectionTitle, !isDarkMode && styles.wordSelectionTitleLight]}>Choose a Word</Text>
              <TouchableOpacity onPress={() => setShowWordSelectionModal(false)}>
                <X size={24} color={isDarkMode ? '#9CA3AF' : '#6B7280'} />
              </TouchableOpacity>
            </View>
            
            <ScrollView
              style={styles.wordSelectionList}
              contentContainerStyle={styles.wordSelectionListContent}
              showsVerticalScrollIndicator={false}
            >
                {getAvailableWords().map((word) => (
                  <TouchableOpacity
                    key={word}
                    style={[styles.wordSelectionItem, !isDarkMode && styles.wordSelectionItemLight]}
                    onPress={() => handleWordSelection(word)}
                  >
                    <Text style={[styles.wordSelectionText, !isDarkMode && styles.wordSelectionTextLight]}>{hyphenateWord(word)}</Text>
                  </TouchableOpacity>
                ))}
                
                {getAvailableWords().length === 0 && (
                  <View style={styles.noWordsAvailable}>
                    <Text style={[styles.noWordsText, !isDarkMode && styles.noWordsTextLight]}>No words available</Text>
                    <Text style={[styles.noWordsSubtext, !isDarkMode && styles.noWordsSubtextLight]}>All words are already used</Text>
                  </View>
                )}
            </ScrollView>
          </View>
        </View>
      </Modal>

    </SafeAreaView>
  );
}

// Magical sparkles overlay (fallback): star-shaped sparkles (smaller, lighter, more of them)
const MagicSparkles: React.FC<{ progress: Animated.Value; dark?: boolean }> = ({ progress, dark }) => {
  const width = Dimensions.get('window').width - 40; // roughly card width minus padding
  const areaH = 220; // cover a taller portion near the top of the card
  const color = dark ? 'rgba(242,147,92,0.5)' : 'rgba(15,23,42,0.5)';
  const dimColor = dark ? 'rgba(242,147,92,0.25)' : 'rgba(15,23,42,0.25)';
  const peakOpacity = 0.5; // 50% max opacity as requested
  // More, smaller stars across the upper third of the card
  const points = [
    // row 1
    { x: 0.05, y: 0.06, s: 10 }, { x: 0.13, y: 0.04, s: 8 }, { x: 0.21, y: 0.07, s: 9 }, { x: 0.29, y: 0.05, s: 10 }, { x: 0.37, y: 0.08, s: 9 }, { x: 0.45, y: 0.06, s: 10 }, { x: 0.53, y: 0.07, s: 9 }, { x: 0.61, y: 0.05, s: 10 }, { x: 0.69, y: 0.08, s: 9 }, { x: 0.77, y: 0.06, s: 10 }, { x: 0.85, y: 0.07, s: 9 }, { x: 0.93, y: 0.05, s: 10 },
    // row 2
    { x: 0.09, y: 0.16, s: 9 }, { x: 0.17, y: 0.14, s: 8 }, { x: 0.25, y: 0.18, s: 10 }, { x: 0.33, y: 0.15, s: 9 }, { x: 0.41, y: 0.17, s: 8 }, { x: 0.49, y: 0.16, s: 10 }, { x: 0.57, y: 0.14, s: 9 }, { x: 0.65, y: 0.18, s: 8 }, { x: 0.73, y: 0.16, s: 10 }, { x: 0.81, y: 0.15, s: 9 }, { x: 0.89, y: 0.17, s: 8 },
    // row 3
    { x: 0.07, y: 0.27, s: 9 }, { x: 0.15, y: 0.25, s: 8 }, { x: 0.23, y: 0.29, s: 10 }, { x: 0.31, y: 0.26, s: 9 }, { x: 0.39, y: 0.28, s: 8 }, { x: 0.47, y: 0.27, s: 10 }, { x: 0.55, y: 0.25, s: 9 }, { x: 0.63, y: 0.29, s: 8 }, { x: 0.71, y: 0.27, s: 10 }, { x: 0.79, y: 0.26, s: 9 }, { x: 0.87, y: 0.28, s: 8 },
  ];
  return (
    <View pointerEvents="none" style={{ position: 'absolute', top: 0, left: 0, right: 0, height: areaH, zIndex: 21 }}>
      {points.map((p, i) => {
        // Stagger each spark's timing window across the 0->1 progress
        const t0 = Math.min(0.035 * i, 0.9);
        const t1 = Math.min(t0 + 0.12, 0.96);
        const t2 = Math.min(t1 + 0.18, 1);
        const opacity = progress.interpolate({ inputRange: [0, t0, t1, t2, 1], outputRange: [0, 0, peakOpacity, 0, 0], extrapolate: 'clamp' });
        const scale = progress.interpolate({ inputRange: [0, t1, t2, 1], outputRange: [0.7, 1.0, 0.95, 0.95], extrapolate: 'clamp' });
        const rotate = progress.interpolate({ inputRange: [0, t2, 1], outputRange: ['-8deg', '8deg', '8deg'], extrapolate: 'clamp' });
        const translateY = progress.interpolate({ inputRange: [0, t2, 1], outputRange: [8, 0, 0], extrapolate: 'clamp' });

        const thickness = 1.6; // thinner rays for subtler look
        const len = p.s; // half length of rays

        return (
          <Animated.View
            key={`spark-${i}`}
            style={{
              position: 'absolute',
              left: p.x * width,
              top: p.y * areaH,
              width: 1,
              height: 1,
              opacity,
              transform: [{ translateY }, { scale }, { rotate }],
            }}
          >
            {/* central diamond */}
            <View
              style={{
                position: 'absolute',
                left: -thickness * 1.8,
                top: -thickness * 1.8,
                width: thickness * 3.6,
                height: thickness * 3.6,
                backgroundColor: color,
                transform: [{ rotate: '45deg' }],
                borderRadius: 1,
                shadowColor: color,
                shadowOpacity: 0.4,
                shadowRadius: 4,
                shadowOffset: { width: 0, height: 0 },
                elevation: 1,
              }}
            />
            {/* horizontal ray */}
            <View style={{ position: 'absolute', left: -len, top: -thickness / 2, width: len * 2, height: thickness, backgroundColor: color, borderRadius: thickness / 2 }} />
            {/* vertical ray */}
            <View style={{ position: 'absolute', left: -thickness / 2, top: -len, width: thickness, height: len * 2, backgroundColor: color, borderRadius: thickness / 2 }} />
            {/* diagonal rays */}
            <View style={{ position: 'absolute', left: -len, top: -thickness / 2, width: len * 2, height: thickness, backgroundColor: dimColor, borderRadius: thickness / 2, transform: [{ rotate: '45deg' }] }} />
            <View style={{ position: 'absolute', left: -len, top: -thickness / 2, width: len * 2, height: thickness, backgroundColor: dimColor, borderRadius: thickness / 2, transform: [{ rotate: '-45deg' }] }} />
          </Animated.View>
        );
      })}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1E1E1E',
  },
  containerLight: {
    backgroundColor: '#F2E3D0',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#374151',
  },
  headerLight: {
    borderBottomColor: '#E5E7EB',
    backgroundColor: 'transparent',
  },
  backButton: {
    width: 24,
  },
  headerCenter: {
    flex: 1,
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  headerTitleLight: {
    color: '#111827',
  },
  headerSubtitle: {
    fontSize: 12,
    color: '#9CA3AF',
    marginTop: 2,
  },
  headerSubtitleLight: {
    color: '#6B7280',
  },
  closeButton: {
    width: 24,
    alignItems: 'flex-end',
  },
  scoreContainer: {
    alignItems: 'center',
    paddingVertical: 8,
  },
  scoreText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#F2935C',
  },
  toggleContainer: {
    alignItems: 'center',
    paddingHorizontal: 20,
    marginBottom: 16,
  },
  toggleButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  toggleTrack: {
    width: 44,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#374151',
    justifyContent: 'center',
    padding: 2,
  },
  toggleTrackActive: {
    backgroundColor: '#F2935C',
  },
  toggleThumb: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#9CA3AF',
    alignSelf: 'flex-start',
  },
  toggleThumbActive: {
    alignSelf: 'flex-end',
    backgroundColor: '#FFFFFF',
  },
  toggleLabel: {
    fontSize: 16,
    color: '#FFFFFF',
    fontWeight: '500',
  },
  toggleLabelLight: {
    color: '#111827',
  },
  wordBankContainer: {
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  panelContainer: {
    paddingHorizontal: 16,
    marginTop: 8,
    marginBottom: 12,
    gap: 8,
  },
  modeSegment: {
    flexDirection: 'row',
    alignSelf: 'flex-start',
    borderRadius: 12,
    backgroundColor: '#2A2F30',
    borderWidth: 1,
    borderColor: '#374151',
    overflow: 'hidden',
  },
  modeSeg: { paddingVertical: 6, paddingHorizontal: 12 },
  modeSegLeft: { borderRightWidth: 1, borderRightColor: '#374151' },
  modeSegRight: {},
  modeSegActive: { backgroundColor: '#187486' },
  modeSegText: { color: '#9CA3AF', fontWeight: '700', fontSize: 12 },
  modeSegTextActive: { color: '#FFFFFF' },
  toolbarGrid: {
    display: 'none',
  },
  toolItem: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 8,
  },
  toolItemDisabled: { opacity: 0.5 },
  toolIcon: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: '#2C4D52',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  toolText: { color: '#E5E7EB', fontWeight: '700', fontSize: 12 },
  toolsDock: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 10,
    backgroundColor: '#1F2A2B',
    borderWidth: 1,
    borderColor: '#2E3A3C',
    borderRadius: 18,
    paddingVertical: 6,
    paddingHorizontal: 10,
  },
  toolsDockLight: {
    backgroundColor: '#F3F4F6',
    borderColor: '#E5E7EB',
  },
  dockItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  dockItemDisabled: { opacity: 0.5 },
  dockText: { color: '#E5E7EB', fontSize: 12, fontWeight: '700' },
  dockTextLight: { color: '#374151' },
  wordBank: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    paddingBottom: 12,
    marginTop: 8,
  },
  wordPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#374151',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    marginRight: 8,
    marginBottom: 8,
    gap: 6,
  },
  wordPillText: {
    fontSize: 14,
    color: '#FFFFFF',
    fontWeight: '500',
  },
  wordBankButtonRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 8,
    alignItems: 'center',
    justifyContent: 'flex-start',
  },
  pickWordsButton: {
    backgroundColor: '#374151',
    borderRadius: 8,
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
  pickWordsText: {
    fontSize: 12,
    color: '#9CA3AF',
    fontWeight: '500',
    textAlign: 'center',
  },
  wordBankActionButton: {
    backgroundColor: '#374151',
    borderRadius: 8,
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
  wordBankActionButtonDisabled: {
    opacity: 0.4,
  },
  wordBankActionText: {
    fontSize: 12,
    color: '#9CA3AF',
    fontWeight: '500',
    textAlign: 'center',
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
  },
  storyContainer: {
    flex: 1,
    position: 'relative',
  },
  fullscreenButton: {
    position: 'absolute',
    top: 4, // Super close to top corner
    right: 4, // Super close to right corner
    zIndex: 15,
    backgroundColor: '#2C2C2C',
    borderRadius: 4,
    padding: 4,
    // Removed borderWidth and borderColor
  },
  contentFullscreen: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: '#1E1E1E',
    zIndex: 5,
    paddingTop: 60,
    paddingHorizontal: 20,
  },
  contentFullscreenLight: {
    backgroundColor: '#F2E3D0',
  },
  storyContentCard: {
    backgroundColor: 'transparent',
    borderRadius: 0,
    padding: 20,
    paddingTop: 50,
    paddingBottom: 20,
    marginBottom: 16,
    position: 'relative',
    // Remove forced min height so it flows with content
  },
  storyPaperCard: {
    backgroundColor: 'transparent',
    borderRadius: 0,
    paddingTop: 24,
    paddingBottom: 28,
    paddingHorizontal: 18,
    borderWidth: 0,
    borderColor: 'transparent',
  },
  storyContentCardLight: {
    backgroundColor: '#F8F9FA',
  },
  themeToggleButton: {
    position: 'absolute',
    top: 4, // Super close to top corner
    left: 4, // Super close to left corner
    zIndex: 10,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 4,
    padding: 4,
    // Removed borderWidth and borderColor
  },
  storyText: {
    // Wrapper for story content
  },
  storyTextLight: {
    // Light theme wrapper (no additional styles needed)
  },
  sentenceCard: {
    backgroundColor: '#2D2D2D',
    borderRadius: 12,
    padding: 20,
    marginBottom: 16,
  },
  sentenceText: {
    fontSize: 22,
    lineHeight: 32,
    color: '#FFFFFF',
    // Use Lexend for story reading when available (loaded in _layout). Falls back if missing.
    fontFamily: 'Lexend_400Regular',
    letterSpacing: 0.2,
  },
  sentenceTextPaper: {
    color: '#2B2B2B',
    fontSize: 22,
    lineHeight: 32,
    fontFamily: 'Lexend_400Regular',
    letterSpacing: 0.2,
  },
  controlsToggleWrap: {
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#187486',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 14,
    marginBottom: 10,
    shadowColor: '#000',
    shadowOpacity: 0.15,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 4,
    elevation: 2,
  },
  controlsToggleText: { fontSize: 12, fontWeight: '800', color: '#FFFFFF' },
  cardChipsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 10,
  },
  toolsIconBtn: {
    position: 'absolute',
    top: 8,
    right: 40,
    width: 22,
    height: 22,
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(24,116,134,0.9)',
  },
  themeIconBtn: {
    position: 'absolute',
    top: 8,
    right: 66,
    width: 22,
    height: 22,
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(0,0,0,0.35)',
  },
  themeChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 14,
    borderWidth: 1,
  },
  themeChipDark: {
    backgroundColor: '#E6F2F5',
    borderColor: '#C7E3E9',
  },
  themeChipLight: {
    backgroundColor: '#2D3537',
    borderColor: '#3B4547',
  },
  themeChipText: { fontSize: 12, fontWeight: '800' },
  sentenceTextLight: {
    color: '#1F2937',
  },
  completedWord: {
    color: '#437F76',
    // Keep weight same as body to avoid width spikes near wrap points
    // (inherits Lexend_400Regular from parent)
    // Match parent letter spacing so the inline run lays out identically
    letterSpacing: 0.2,
  },
  inlineBlank: {
    alignSelf: 'baseline',
  },
  blankPill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 16,
    gap: 4,
    alignSelf: 'baseline',
    marginHorizontal: 4,
    marginBottom: 4,
  },
  blankPillCorrect: {
    backgroundColor: '#437F76',
  },
  blankPillIncorrect: {
    backgroundColor: '#924646',
  },
  blankText: {
    fontSize: 22,
    fontWeight: '600',
  },
  blankTextCorrect: {
    color: '#10B981', // Green for correct answers
  },
  blankTextIncorrect: {
    color: '#EF4444', // Red for incorrect answers
  },
  blankTextFilled: {
    color: '#FFB380', // Pale orange for filled but not checked
  },
  // Darker variant used in light mode for better contrast
  blankTextFilledLight: {
    color: '#D17A45',
  },
  emptyBlank: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    backgroundColor: 'transparent',
    borderRadius: 0,
    borderWidth: 0,
    borderColor: 'transparent',
    borderStyle: 'solid',
    alignSelf: 'baseline',
    minWidth: 0,
    alignItems: 'center',
  },
  emptyBlankText: {
    fontSize: 22,
    color: '#9CA3AF',
    fontWeight: '600',
    letterSpacing: 1,
    textAlign: 'center',
    textAlignVertical: 'bottom',
    marginBottom: -6,
  },
  // Inline blank styles for proper text flow
  blankPillInline: {
    backgroundColor: 'transparent',
    color: '#FFA366',
    paddingHorizontal: 0,
    paddingVertical: 0,
    borderRadius: 0,
    fontSize: 22,
    fontWeight: '600',
    textAlign: 'center',
    marginHorizontal: 0,
    marginBottom: 0,
  },
  emptyBlankInline: {
    backgroundColor: 'transparent',
    color: '#9CA3AF',
    paddingHorizontal: 0,
    paddingVertical: 0,
    borderRadius: 0,
    fontSize: 21,
    fontWeight: '600',
    textDecorationLine: 'none',
    borderWidth: 0,
    borderColor: 'transparent',
    borderStyle: 'solid',
    minWidth: 0,
    letterSpacing: 0,
    textAlign: 'left',
    // Nudge dots down slightly to align with text baseline
    textAlignVertical: 'bottom',
    marginBottom: -6,
    transform: [{ translateY: 4 }],
    marginHorizontal: 4,
  },
  // Darker dots for light mode (inline placeholder)
  emptyBlankInlineLight: {
    color: '#C06E38',
  },
  footer: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingVertical: 16,
    gap: 12,
    borderTopWidth: 1,
    borderTopColor: '#374151',
  },
  buttonRow: {
    flexDirection: 'row',
    gap: 12,
    flex: 1,
  },
  regenerateButton: {
    flex: 1,
    backgroundColor: '#F2935C',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
  },
  customizeButton: {
    backgroundColor: '#2C2C2C',
    borderRadius: 12,
    paddingVertical: 16,
    paddingHorizontal: 20,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#F2935C',
    minWidth: 56,
  },
  regenerateButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  checkButton: {
    flex: 1,
    backgroundColor: '#187486',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
  },
  checkButtonDisabled: {
    // Keep the button bright even when disabled so it doesn't look dimmed
    opacity: 1,
    backgroundColor: '#187486',
  },
  checkButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  // Save toast styles
  saveToastWrap: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 96,
    alignItems: 'center',
    zIndex: 50,
  },
  saveToastCard: {
    width: '88%',
    maxWidth: 420,
    borderRadius: 16,
    backgroundColor: 'rgba(38,43,46,0.96)',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: '#434d51',
    paddingVertical: 14,
    paddingHorizontal: 16,
    shadowColor: '#000',
    shadowOpacity: 0.3,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 10 },
    elevation: 6,
  },
  saveToastCardLight: {
    backgroundColor: '#F8F9FA',
    borderColor: '#E5E7EB',
  },
  saveToastTitle: {
    color: '#F3F4F6',
    fontWeight: '700',
    fontSize: 15,
  },
  saveToastTitleLight: {
    color: '#111827',
  },
  saveToastText: {
    marginTop: 4,
    color: '#CBD5E1',
    fontSize: 13,
  },
  saveToastTextLight: {
    color: '#4B5563',
  },
  saveToastActions: {
    marginTop: 10,
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 10,
  },
  saveToastBtn: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
    backgroundColor: 'transparent',
  },
  saveToastBtnText: {
    color: '#E5E7EB',
    fontWeight: '600',
    fontSize: 13,
  },
  saveToastBtnTextLight: {
    color: '#374151',
  },
  saveToastPrimary: {
    backgroundColor: '#F2935C',
  },
  saveToastPrimaryText: {
    color: '#111827',
    fontWeight: '800',
    fontSize: 13,
    paddingHorizontal: 2,
  },
  srsBanner: {
    position: 'absolute',
    left: 20,
    right: 20,
    bottom: 96,
    backgroundColor: '#187486',
    borderRadius: 12,
    paddingVertical: 10,
    paddingHorizontal: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 5,
  },
  srsBannerText: {
    color: '#FFFFFF',
    fontWeight: '600',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 16,
    color: '#9CA3AF',
    marginTop: 12,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 18,
    color: '#FFFFFF',
  },
  storyPlaceholder: {
    paddingVertical: 28,
    paddingHorizontal: 16,
    alignItems: 'center',
    gap: 8,
  },
  storyPlaceholderTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  storyPlaceholderTitleLight: {
    color: '#111827',
  },
  storyPlaceholderBody: {
    fontSize: 14,
    color: '#9CA3AF',
    textAlign: 'center',
    lineHeight: 20,
  },
  storyPlaceholderBodyLight: {
    color: '#4B5563',
  },
  storyPlaceholderButton: {
    marginTop: 18,
    backgroundColor: '#F2935C',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 10,
  },
  storyPlaceholderButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1E1E1E',
  },
  bottomSpacing: {
    height: 20,
  },
  // Modal styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  modalContent: {
    backgroundColor: '#1E1E1E',
    borderRadius: 16,
    padding: 20,
    width: '100%',
    maxWidth: 380,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 10,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  optionSection: {
    marginBottom: 14,
  },
  optionTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: '#FFFFFF',
    marginBottom: 6,
  },
  optionRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    justifyContent: 'flex-start',
  },
  optionPill: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: '#2C2C2C',
    borderWidth: 1,
    borderColor: '#374151',
  },
  optionPillSelected: {
    backgroundColor: '#F2935C',
    borderColor: '#F2935C',
  },
  optionPillText: {
    fontSize: 12,
    color: '#9CA3AF',
  },
  optionPillTextSelected: {
    color: '#FFFFFF',
    fontWeight: '500',
  },
  applyButton: {
    backgroundColor: '#F2935C',
    borderRadius: 10,
    paddingVertical: 12,
    alignItems: 'center',
    marginTop: 6,
  },
  applyButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  // Word Selection Modal Styles
  wordSelectionOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  wordSelectionOverlayLight: {
    backgroundColor: 'rgba(0, 0, 0, 0.35)',
  },
  wordSelectionModal: {
    backgroundColor: '#2D2D2D',
    borderRadius: 16,
    maxWidth: 320,
    width: '90%',
    maxHeight: '60%',
    // Glow on the card
    shadowColor: '#F2935C',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.35,
    shadowRadius: 20,
    elevation: 8,
  },
  wordSelectionModalLight: {
    backgroundColor: '#F9F1E7',
    shadowColor: '#F2935C',
  },
  wordSelectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#374151',
  },
  wordSelectionHeaderLight: {
    borderBottomColor: '#E5E7EB',
  },
  wordSelectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  wordSelectionTitleLight: {
    color: '#111827',
  },
  wordSelectionList: {
    maxHeight: 300,
    paddingHorizontal: 20,
  },
  // Removed list glow; glow is applied to modal card now
  wordSelectionListContent: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    paddingVertical: 12,
  },
  wordSelectionItem: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    backgroundColor: '#374151',
    borderRadius: 16,
    margin: 6,
    borderWidth: 1,
    borderColor: '#4B5563',
    alignSelf: 'flex-start',
  },
  wordSelectionItemLight: {
    backgroundColor: '#FFFFFF',
    borderColor: '#E5E7EB',
  },
  wordSelectionText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#FFFFFF',
    textAlign: 'center',
  },
  wordSelectionTextLight: {
    color: '#111827',
  },
  noWordsAvailable: {
    alignItems: 'center',
    paddingVertical: 32,
  },
  noWordsText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#9CA3AF',
    marginBottom: 4,
  },
  noWordsTextLight: { color: '#6B7280' },
  noWordsSubtext: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
  },
  noWordsSubtextLight: { color: '#9CA3AF' },
  // Word Picker (Choose exactly five words) Styles
  wordPickerOverlay: {
    flex: 1,
    backgroundColor: '#1E1E1E',
    justifyContent: 'flex-start',
    alignItems: 'stretch',
  },
  wordPickerContent: {
    flex: 1,
    backgroundColor: '#1E1E1E',
    borderRadius: 0,
    paddingHorizontal: 16,
    paddingTop: 20,
    paddingBottom: 12,
    width: '100%',
  },
  wordPickerHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  wordPickerSubtitle: {
    fontSize: 12,
    color: '#9CA3AF',
    marginBottom: 12,
  },
  wordPickerControls: {
    gap: 10,
    marginBottom: 8,
  },
  filterChipsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    justifyContent: 'flex-start',
    gap: 8,
  },
  filterChip: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#374151',
    backgroundColor: '#2D2D2D',
  },
  filterChipActive: {
    borderColor: '#F2935C',
    backgroundColor: 'rgba(242,147,92,0.15)'
  },
  filterChipText: { color: '#9CA3AF', fontSize: 12, fontWeight: '600' },
  filterChipTextActive: { color: '#F2935C' },
  autoPickButton: {
    backgroundColor: '#187486',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    alignSelf: 'flex-end',
    marginTop: 6,
    marginLeft: 'auto',
  },
  autoPickButtonText: { color: '#FFFFFF', fontWeight: '800', fontSize: 12 },
  searchInputWrap: {
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#374151',
    backgroundColor: '#2D2D2D',
    paddingHorizontal: 10,
  },
  searchInput: {
    height: 36,
    color: '#E5E7EB',
  },
  wordPickerList: {
    flex: 1,
  },
  wordPickerListContent: {
    paddingBottom: 20,
  },
  wordPickerItem: {
    backgroundColor: '#2D2D2D',
    borderRadius: 12,
    padding: 12,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#374151',
  },
  wordPickerItemSelected: {
    borderColor: '#437F76',
    backgroundColor: '#243B35',
  },
  wordPickerItemDisabled: {
    opacity: 0.6,
  },
  wordPickerItemHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  wordBadgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginLeft: 8,
    marginRight: 'auto',
  },
  statusPill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
    borderWidth: 1,
  },
  statusPillText: { fontSize: 11, fontWeight: '700' },
  duePill: { backgroundColor: 'rgba(24,116,134,0.18)', borderColor: 'rgba(24,116,134,0.45)' },
  futurePill: { backgroundColor: 'rgba(147,197,253,0.12)', borderColor: 'rgba(147,197,253,0.4)' },
  duePillText: { color: '#187486' },
  futurePillText: { color: '#93C5FD' },
  wordPickerWord: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  wordPickerDefinition: {
    fontSize: 13,
    color: '#D1D5DB',
  },
  wordPickerExample: {
    marginTop: 6,
    fontSize: 12,
    color: '#9CA3AF',
    fontStyle: 'italic',
  },
  emptyState: {
    paddingVertical: 24,
    alignItems: 'center',
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  emptySubtitle: {
    fontSize: 13,
    color: '#9CA3AF',
    textAlign: 'center',
  },
  wordPickerFooter: {
    marginTop: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  footerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  modalReset: {
    borderRadius: 10,
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderWidth: 1,
    borderColor: '#374151',
    backgroundColor: '#2D2D2D',
  },
  modalResetDisabled: {
    opacity: 0.5,
  },
  modalResetText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#E5E7EB',
  },
  // Light mode variants for word picker
  wordPickerOverlayLight: { backgroundColor: '#F2E3D0' },
  wordPickerContentLight: { backgroundColor: '#F2E3D0' },
  modalTitleLight: { color: '#111827' },
  wordPickerSubtitleLight: { color: '#6B7280' },
  filterChipLight: { borderColor: '#E5E7EB', backgroundColor: '#FFFFFF' },
  filterChipTextLight: { color: '#6B7280' },
  searchInputWrapLight: { borderColor: '#E5E7EB', backgroundColor: '#FFFFFF' },
  searchInputLight: { color: '#111827' },
  wordPickerItemLight: { backgroundColor: '#FFFFFF', borderColor: '#E5E7EB' },
  wordPickerItemSelectedLight: { borderColor: '#437F76', backgroundColor: '#E6F0EE' },
  wordPickerWordLight: { color: '#111827' },
  wordPickerDefinitionLight: { color: '#374151' },
  wordPickerExampleLight: { color: '#6B7280' },
  wordPickerCountLight: { color: '#6B7280' },
  modalResetLight: { borderColor: '#E5E7EB', backgroundColor: '#FFFFFF' },
  modalResetTextLight: { color: '#374151' },
  wordPickerCount: {
    fontSize: 12,
    color: '#9CA3AF',
  },
  modalPrimary: {
    backgroundColor: '#F2935C',
    borderRadius: 10,
    paddingVertical: 10,
    paddingHorizontal: 16,
  },
  modalPrimaryDisabled: {
    opacity: 0.6,
  },
  modalPrimaryText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1E1E1E',
  },
  incorrectIcon: {
    color: '#EF4444',
    fontSize: 14,
    fontWeight: '600',
  },
  inlinePopup: {
    fontSize: 14,
  },
  inlinePopupText: {
    backgroundColor: 'rgba(16, 185, 129, 0.5)',
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    overflow: 'hidden',
  },
});

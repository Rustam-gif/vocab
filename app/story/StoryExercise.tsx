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
      setIsNormalMode(false);
      setShowControls(false); // compact reading mode by default after generation
      chevronAnim.setValue(0);
    } catch (error) {
      console.error('Error generating story:', error);
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

  const handleSaveToJournal = () => {
    if (!story) return;
    Alert.alert('Coming soon', 'Saving stories to the journal will be available soon.');
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
            {blank.userAnswer}
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
                  <Text style={styles.inlinePopupText}>{blank.correctWord}</Text>
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
      return (
        <React.Fragment key={sentence.id}>
          {sentence.beforeBlank}
          {sentence.beforeBlank && !endsWithWhitespace(sentence.beforeBlank) ? ' ' : ''}
          <Text style={styles.completedWord}>{sentence.blank.correctWord}</Text>
          {sentence.afterBlank && (
            <>
              {!startsWithPunctuation(sentence.afterBlank) ? ' ' : ''}
              {sentence.afterBlank}
              {sentence.secondBlank && (
                <>
                  {!endsWithWhitespace(sentence.afterBlank) ? ' ' : ''}
                  <Text style={styles.completedWord}>{sentence.secondBlank.correctWord}</Text>
                </>
              )}
            </>
          )}
          {sentence.secondBlank && !sentence.afterBlank && ' '}
          {sentence.afterSecondBlank && (
            <>
              {!startsWithPunctuation(sentence.afterSecondBlank) ? ' ' : ''}
              {sentence.afterSecondBlank}
            </>
          )}
        </React.Fragment>
      );
    }

    return (
      <React.Fragment key={sentence.id}>
        {sentence.beforeBlank}
        {sentence.beforeBlank && !endsWithWhitespace(sentence.beforeBlank) ? ' ' : ''}
        {renderBlankInline(sentence.blank)}
        {sentence.afterBlank ? (
          <>
            {!startsWithPunctuation(sentence.afterBlank) ? ' ' : ''}
            {sentence.afterBlank}
            {sentence.secondBlank && (
              <>
                {!endsWithWhitespace(sentence.afterBlank) ? ' ' : ''}
                {renderBlankInline(sentence.secondBlank)}
              </>
            )}
          </>
        ) : (
          sentence.secondBlank && <>{' '}{renderBlankInline(sentence.secondBlank)}</>
        )}
        {sentence.afterSecondBlank && (
          <>
            {!startsWithPunctuation(sentence.afterSecondBlank) ? ' ' : ''}
            {sentence.afterSecondBlank}
          </>
        )}
      </React.Fragment>
    );
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
  // If the model forgot to wrap some words with **, wrap the first occurrence ourselves.
  const escapeRe = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  for (const w of cleanWords) {
    const wrapped = new RegExp(`\\*\\*${escapeRe(w)}\\*\\*`, 'i');
    if (!wrapped.test(normalized)) {
      const plain = new RegExp(`\\b${escapeRe(w)}\\b`, 'i');
      if (plain.test(normalized)) {
        normalized = normalized.replace(plain, (m) => `**${m}**`);
      }
    }
  }
  const pieces = normalized.split(/\*\*(.+?)\*\*/g);

  const sentences: StorySentence[] = [];
  for (let i = 0; i < cleanWords.length; i += 1) {
    const beforeSegment = (pieces[2 * i] ?? '');
    const highlightedWord = pieces[2 * i + 1]?.trim() || cleanWords[i];
    const afterSegment = pieces[2 * i + 2] ?? '';

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

  // VALIDATION & FIXUP: Ensure the last vocabulary word is NOT at the end
  if (sentences.length > 0) {
    const lastSentence = sentences[sentences.length - 1];
    const textAfterLastBlank = lastSentence.afterBlank?.trim() || '';
    // Count words after the last blank
    const wordsAfter = textAfterLastBlank.split(/\s+/).filter(w => w.length > 0);

    // Require a generous safety margin after the final vocabulary word
    const MIN_AFTER_WORDS = 15; // target at least ~15 words of trailing narrative
    if (wordsAfter.length < MIN_AFTER_WORDS) {
      console.warn('⚠️ Story tail too short; appending neutral closing sentence to keep blanks away from the end.');
      const closers = [
        'As evening approached, they packed up and headed home, already planning what to try next.',
        'With the day winding down, they took a deep breath and looked forward to tomorrow.',
        'They smiled at the small victory, tidied up, and made their way back through the quiet streets.',
      ];
      const tail = ' ' + closers[Math.floor(Math.random() * closers.length)];
      if (lastSentence.afterSecondBlank && lastSentence.afterSecondBlank.trim().length > 0) {
        lastSentence.afterSecondBlank = (lastSentence.afterSecondBlank + (/[.!?]$/.test(lastSentence.afterSecondBlank.trim()) ? '' : '.') + tail).replace(/\s+/g, ' ').trim();
      } else if (lastSentence.afterBlank) {
        lastSentence.afterBlank = (lastSentence.afterBlank + (/[.!?]$/.test(lastSentence.afterBlank.trim()) ? '' : '.') + tail).replace(/\s+/g, ' ').trim();
      } else {
        lastSentence.afterBlank = tail.trim();
      }
    }
  }

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
      <SafeAreaView style={styles.container}>
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
    <SafeAreaView style={styles.container}>
      {/* Header - Hidden in fullscreen */}
      {!isFullscreen && (
        <View style={styles.header}>
          <TouchableOpacity onPress={() => {
            if (params.from === 'results') {
              router.replace('/');
            } else {
              router.back();
            }
          }} style={styles.backButton}>
            <ArrowLeft size={24} color="#FFFFFF" />
          </TouchableOpacity>
          <View style={styles.headerCenter}>
            <Text style={styles.headerTitle}>{headerTitle}</Text>
            {headerSubtitle ? (
              <Text style={styles.headerSubtitle}>{headerSubtitle}</Text>
            ) : null}
          </View>
          <TouchableOpacity style={styles.closeButton} onPress={() => {
            if (params.from === 'results') {
              router.replace('/');
            } else {
              router.back();
            }
          }}>
            <X size={24} color="#FFFFFF" />
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
            <Text style={styles.toggleLabel}>
              {isNormalMode ? 'Normal Reading' : 'Fill-in-the-blanks'}
            </Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Tools Dock - grouped controls in one place */}
      {!isFullscreen && (
        <View style={styles.panelContainer}>
          <View style={styles.toolsDock}>
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
              <Search size={12} color="#E5E7EB" />
              <Text style={styles.dockText}>Pick</Text>
            </TouchableOpacity>

            {/* Customize */}
            <TouchableOpacity
              style={styles.dockItem}
              onPress={() => setShowCustomizeModal(true)}
              activeOpacity={0.85}
            >
              <Settings size={12} color="#E5E7EB" />
              <Text style={styles.dockText}>Customize</Text>
            </TouchableOpacity>

            {/* Save */}
            <TouchableOpacity
              style={[styles.dockItem, !hasStory && styles.dockItemDisabled]}
              onPress={handleSaveToJournal}
              disabled={!hasStory}
              activeOpacity={0.85}
            >
              <Bookmark size={12} color="#E5E7EB" />
              <Text style={styles.dockText}>Save</Text>
            </TouchableOpacity>
          </View>
          {/* Gamified quest progress */}
          {/* Quest progress UI removed per request */}
        </View>
      )}

      {/* Story Content */}
      <View style={styles.storyContainer}>
        <ScrollView 
          style={[styles.content, isFullscreen && styles.contentFullscreen]} 
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
            
            {/* Theme toggle removed */}
            
            <View style={[styles.storyText, !isDarkMode && styles.storyTextLight]}>
              {hasStory ? (
                <Text style={isDarkMode ? styles.sentenceText : styles.sentenceTextPaper}>
                  {(story?.sentences ?? []).map(renderSentence)}
                </Text>
              ) : (
                <View style={styles.storyPlaceholder}>
                  <Text style={styles.storyPlaceholderTitle}>Ready when you are</Text>
                  <Text style={styles.storyPlaceholderBody}>
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
            </View>
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
        <SafeAreaView style={styles.wordPickerOverlay}>
          <KeyboardAvoidingView
            style={styles.wordPickerContent}
            behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          >
            <View style={styles.wordPickerHeader}>
              <Text style={styles.modalTitle}>Select Words</Text>
              <TouchableOpacity onPress={() => setWordPickerOpen(false)}>
                <X size={24} color="#9CA3AF" />
              </TouchableOpacity>
            </View>
            <Text style={styles.wordPickerSubtitle}>
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
                    style={[styles.filterChip, pickerFilter === key && styles.filterChipActive]}
                    onPress={() => setPickerFilter(key)}
                  >
                    <Text style={[styles.filterChipText, pickerFilter === key && styles.filterChipTextActive]}>{label}</Text>
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
              <View style={styles.searchInputWrap}>
                <TextInput
                  placeholder="Search word or definition"
                  placeholderTextColor="#6B7280"
                  value={pickerQuery}
                  onChangeText={setPickerQuery}
                  style={styles.searchInput}
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
                      selected && styles.wordPickerItemSelected,
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
                      <Text style={styles.wordPickerWord}>{word.word}</Text>
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
                    <Text style={styles.wordPickerDefinition}>{word.definition}</Text>
                    {!!word.example && (
                      <Text style={styles.wordPickerExample}>“{word.example}”</Text>
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
              <Text style={styles.wordPickerCount}>
                {tempSelection.length} / {MAX_BLANKS} selected
              </Text>
              <View style={styles.footerActions}>
                <TouchableOpacity
                  style={[styles.modalReset, tempSelection.length === 0 && styles.modalResetDisabled]}
                  onPress={() => setTempSelection([])}
                  disabled={tempSelection.length === 0}
                >
                  <Text style={styles.modalResetText}>Reset</Text>
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
        <View style={styles.wordSelectionOverlay}>
          <View style={styles.wordSelectionModal}>
            <View style={styles.wordSelectionHeader}>
              <Text style={styles.wordSelectionTitle}>Choose a Word</Text>
              <TouchableOpacity onPress={() => setShowWordSelectionModal(false)}>
                <X size={24} color="#9CA3AF" />
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
                    style={styles.wordSelectionItem}
                    onPress={() => handleWordSelection(word)}
                  >
                    <Text style={styles.wordSelectionText}>{word}</Text>
                  </TouchableOpacity>
                ))}
                
                {getAvailableWords().length === 0 && (
                  <View style={styles.noWordsAvailable}>
                    <Text style={styles.noWordsText}>No words available</Text>
                    <Text style={styles.noWordsSubtext}>All words are already used</Text>
                  </View>
                )}
            </ScrollView>
          </View>
        </View>
      </Modal>

    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1E1E1E',
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
  headerSubtitle: {
    fontSize: 12,
    color: '#9CA3AF',
    marginTop: 2,
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
  storyContentCard: {
    backgroundColor: '#2D2D2D',
    borderRadius: 12,
    padding: 20,
    paddingTop: 50, // Reduced from 100 to 50
    paddingBottom: 20, // Reduced from 30 to 20
    marginBottom: 16,
    position: 'relative',
    minHeight: 300, // Much smaller minimum height (was 600)
    // Removed borderWidth and borderColor
  },
  storyPaperCard: {
    backgroundColor: '#F6F1EA',
    borderRadius: 22,
    paddingTop: 24,
    paddingBottom: 28,
    paddingHorizontal: 18,
    borderWidth: 1,
    borderColor: '#EDE6DB',
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
    flexDirection: 'row',
    flexWrap: 'wrap',
    // Prefer Seravek on iOS; use sans-serif on Android; System elsewhere
    fontFamily: Platform.select({ ios: 'Seravek', android: 'sans-serif', default: 'System' }) as any,
    letterSpacing: 0.2,
  },
  sentenceTextPaper: {
    color: '#2B2B2B',
    fontSize: 22,
    lineHeight: 32,
    fontFamily: Platform.select({ ios: 'Seravek', android: 'sans-serif', default: 'System' }) as any,
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
    fontWeight: '600',
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
  storyPlaceholderBody: {
    fontSize: 14,
    color: '#9CA3AF',
    textAlign: 'center',
    lineHeight: 20,
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
  wordSelectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#374151',
  },
  wordSelectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#FFFFFF',
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
  wordSelectionText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#FFFFFF',
    textAlign: 'center',
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
  noWordsSubtext: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
  },
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

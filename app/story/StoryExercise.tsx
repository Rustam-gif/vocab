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
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { ArrowLeft, X, Settings, Maximize2, Minimize2, Sun, Moon, Check, AlertCircle } from 'lucide-react-native';
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
        color: '#FFB380', // Pale orange
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
  const params = useLocalSearchParams<{ words?: string }>();
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

  const { words: vaultWords, loadWords } = useAppStore();
  const hasStory = Boolean(story);
  const headerTitle = story?.title ?? 'Story Exercise';
  const headerSubtitle = story?.subtitle ?? 'Generate a tailored story using five words from your vault.';

  useEffect(() => {
    loadWords();
  }, []);

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
        <InlineDotsOnce />
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

  // VALIDATION: Check if the last sentence has a blank word at the end or very close to the end
  if (sentences.length > 0) {
    const lastSentence = sentences[sentences.length - 1];
    const textAfterLastBlank = lastSentence.afterBlank?.trim() || '';
    
    // Count words after the last blank
    const wordsAfter = textAfterLastBlank.split(/\s+/).filter(w => w.length > 0);
    
    if (wordsAfter.length < 5) {
      console.error('❌ VALIDATION FAILED: Last vocabulary word is too close to the end of the story');
      console.error(`Words after last blank: ${wordsAfter.length} (minimum required: 5)`);
      console.error(`Text after last blank: "${textAfterLastBlank}"`);
      console.error('The AI did not follow the placement rules. This story should be regenerated.');
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
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <ArrowLeft size={24} color="#FFFFFF" />
          </TouchableOpacity>
          <View style={styles.headerCenter}>
            <Text style={styles.headerTitle}>{headerTitle}</Text>
            <Text style={styles.headerSubtitle}>{headerSubtitle}</Text>
          </View>
          <TouchableOpacity style={styles.closeButton}>
            <X size={24} color="#FFFFFF" />
          </TouchableOpacity>
        </View>
      )}

      {/* Mode Toggle - Hidden in fullscreen */}
      {!isFullscreen && hasStory && (
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

      {/* Word Bank - Only shown in Fill-in-the-blanks mode and not fullscreen */}
      {!isNormalMode && !isFullscreen && (
      <View style={styles.wordBankContainer}>
          <View style={styles.wordBankButtonRow}>
          <TouchableOpacity
            style={styles.pickWordsButton}
            onPress={() => {
              if (!vaultWords.length) {
                Alert.alert('Vault Empty', 'Add words to your vault to build a custom story.');
                return;
              }
              setTempSelection(story ? [...story.availableWords] : [...currentVocabulary]);
              setWordPickerOpen(true);
            }}
          >
            <Text style={styles.pickWordsText}>
              {`Pick words (${story ? story.availableWords.length : currentVocabulary.length}/${MAX_BLANKS})`}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.wordBankActionButton}
            onPress={() => setShowCustomizeModal(true)}
          >
            <Text style={styles.wordBankActionText}>Customize</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.wordBankActionButton, !hasStory && styles.wordBankActionButtonDisabled]}
            onPress={handleSaveToJournal}
            disabled={!hasStory}
          >
            <Text style={styles.wordBankActionText}>Save to Journal</Text>
          </TouchableOpacity>
        </View>
      </View>
      )}

      {/* Story Content */}
      <View style={styles.storyContainer}>
        <ScrollView 
          style={[styles.content, isFullscreen && styles.contentFullscreen]} 
          showsVerticalScrollIndicator={false}
        >
          <View style={[styles.storyContentCard, !isDarkMode && styles.storyContentCardLight]}>
            <TouchableOpacity 
              style={styles.fullscreenButton}
              onPress={() => setIsFullscreen(!isFullscreen)}
            >
              {isFullscreen ? 
                <Minimize2 size={16} color="#9CA3AF" /> : 
                <Maximize2 size={16} color="#9CA3AF" />
              }
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={styles.themeToggleButton}
              onPress={() => setIsDarkMode(!isDarkMode)}
            >
              {isDarkMode ? 
                <Sun size={14} color="#F2935C" /> : 
                <Moon size={14} color="#6B7280" />
              }
            </TouchableOpacity>
            
            <View style={[styles.storyText, !isDarkMode && styles.storyTextLight]}>
              {hasStory ? (
                <Text style={[styles.sentenceText, !isDarkMode && styles.sentenceTextLight]}>
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
        transparent={true}
        animationType="slide"
        onRequestClose={() => setWordPickerOpen(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.wordPickerContent}>
            <View style={styles.wordPickerHeader}>
              <Text style={styles.modalTitle}>Select Words</Text>
              <TouchableOpacity onPress={() => setWordPickerOpen(false)}>
                <X size={24} color="#9CA3AF" />
              </TouchableOpacity>
            </View>
            <Text style={styles.wordPickerSubtitle}>
              Choose exactly five words from your vault to weave into the story.
            </Text>
            <ScrollView style={styles.wordPickerList} showsVerticalScrollIndicator={false}>
              {vaultWords.map((word: Word) => {
                const selected = tempSelection.includes(word.word);
                const disabled = !selected && tempSelection.length >= MAX_BLANKS;
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
        </View>
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
    fontSize: 16,
    lineHeight: 24,
    color: '#FFFFFF',
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
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
    fontSize: 14,
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
    fontSize: 16,
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
    backgroundColor: '#374151',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
  },
  checkButtonDisabled: {
    opacity: 0.5,
  },
  checkButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
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
  wordPickerContent: {
    backgroundColor: '#1E1E1E',
    borderRadius: 16,
    padding: 20,
    width: '100%',
    maxWidth: 420,
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
  wordPickerList: {
    maxHeight: 360,
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
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
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

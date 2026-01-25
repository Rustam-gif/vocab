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
  InteractionManager,
  DeviceEventEmitter,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useFocusEffect } from '@react-navigation/native';
import { useCallback } from 'react';
import { X, Settings, Maximize2, Minimize2, Sun, Moon, Check, AlertCircle, ChevronDown, Search, Bookmark } from 'lucide-react-native';
import { aiService } from '../../services/AIService';
import { useAppStore } from '../../lib/store';
import { Word } from '../../types';
import LottieView from 'lottie-react-native';
import { LinearGradient } from '../../lib/LinearGradient';
import { SubscriptionService, SubscriptionProduct } from '../../services/SubscriptionService';
import UsageLimitsService from '../../services/UsageLimitsService';
import LimitModal from '../../lib/LimitModal';
import { saveStory as saveStoryToRemote } from '../../services/dbClient';
import { supabase } from '../../lib/supabase';
import { engagementTrackingService } from '../../services/EngagementTrackingService';
import { soundService } from '../../services/SoundService';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

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
  const out: string[] = [];
  const seen = new Set<string>();
  for (const w of words) {
    const t = (w || '').trim();
    if (!t) continue;
    const key = t.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(t);
  }
  return out.slice(0, MAX_BLANKS);
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

// Deterministic tiny jitter based on string id (prevents reordering on re-render)
function stableJitter(id: string): number {
  try {
    let h = 0;
    for (let i = 0; i < id.length; i++) {
      h = ((h << 5) - h) + id.charCodeAt(i);
      h |= 0; // force 32-bit
    }
    // Map to [0, 1)
    const u = (h >>> 0) / 0xFFFFFFFF;
    return u;
  } catch {
    return 0;
  }
}

// Inline one-shot dots animation for blanks (slower, visible jump; plays once)
const InlineDotsOnce: React.FC<{ style?: any }> = ({ style }) => {
  const dots = [0, 1, 2, 3, 4, 5, 6].map(() => useRef(new Animated.Value(0)).current);
  // Derive tint color from passed style if provided
  const tintColor = (() => {
    try {
      if (!style) return '#F25E86';
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
    return '#F25E86';
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
  const insets = useSafeAreaInsets();
  const params = useLocalSearchParams<{ words?: string; from?: string }>();
  const [loading, setLoading] = useState(false);
  const [score, setScore] = useState(100);
  const [selectedWords, setSelectedWords] = useState<Set<string>>(new Set());
  const [story, setStory] = useState<StoryData | null>(null);
  const [showCustomizeModal, setShowCustomizeModal] = useState(false);
  const [isNormalMode, setIsNormalMode] = useState(false); // false = Fill-in-the-blanks, true = Normal
  const [isFullscreen, setIsFullscreen] = useState(false);
  const themeName = useAppStore(s => s.theme);
  const currentUser = useAppStore(s => s.user);
  const isSignedIn = !!(currentUser && (currentUser as any)?.id);
  const [showSignupModal, setShowSignupModal] = useState(false);

  const getActiveUserId = useCallback(async () => {
    if (currentUser?.id) return currentUser.id;
    try {
      const { data } = await supabase.auth.getSession();
      return data?.session?.user?.id ?? null;
    } catch (err) {
      console.warn('StoryExercise: unable to resolve Supabase session:', err);
      return null;
    }
  }, [currentUser?.id]);
  const [isDarkMode, setIsDarkMode] = useState(true); // true = dark mode, false = light mode
  const [customization, setCustomization] = useState<StoryCustomization>({
    genre: 'adventure',
    difficulty: 'easy',
    length: 'short',
  });
  const [wordPickerOpen, setWordPickerOpen] = useState(false);
  const [tempSelection, setTempSelection] = useState<string[]>([]);
  const pickWordsAnim = useRef(new Animated.Value(1)).current;

  // Pulse animation for Pick Words button
  useEffect(() => {
    const pulse = Animated.loop(
      Animated.sequence([
        Animated.timing(pickWordsAnim, { toValue: 1.05, duration: 1000, useNativeDriver: true }),
        Animated.timing(pickWordsAnim, { toValue: 1, duration: 1000, useNativeDriver: true }),
      ])
    );
    pulse.start();
    return () => pulse.stop();
  }, [pickWordsAnim]);
  const [showWordSelectionModal, setShowWordSelectionModal] = useState(false);
  const [selectedBlankId, setSelectedBlankId] = useState<string | null>(null);
  const [currentVocabulary, setCurrentVocabulary] = useState<string[]>([]);
  const [showCorrectAnswerBlank, setShowCorrectAnswerBlank] = useState<StoryBlank | null>(null);
  const [popupPosition, setPopupPosition] = useState<{ x: number; y: number } | null>(null);
  const [answersChecked, setAnswersChecked] = useState(false);
  const iconRefs = useRef<{ [key: string]: Text | null }>({});
  const [showControls, setShowControls] = useState(true); // show panels initially; hide after generation
  const chevronAnim = useRef(new Animated.Value(1)).current; // 1=open, 0=closed
  // Magical reveal for newly generated text (start at 1 to avoid glitch on tab switch)
  const revealAnim = useRef(new Animated.Value(1)).current; // 0 -> 1
  // Sparkles overlay for reveal (fallback stars only)
  const [showSparkles, setShowSparkles] = useState(false);
  const sparklesProgress = useRef(new Animated.Value(0)).current; // stars timeline
  const sparklesTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  // Save toast
  const [saveToastVisible, setSaveToastVisible] = useState(false);
  const [lastSavedId, setLastSavedId] = useState<string | null>(null);
  const saveToastAnim = useRef(new Animated.Value(0)).current;
  const saveToastTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [locked, setLocked] = useState<boolean>(true);
  // Local paywall for direct access from this screen
  const [showPaywall, setShowPaywall] = useState(false);
  const [isPurchasing, setIsPurchasing] = useState(false);
  const [showPurchaseSuccess, setShowPurchaseSuccess] = useState(false);
  const [products, setProducts] = useState<SubscriptionProduct[] | null>(null);
  const [limitOpen, setLimitOpen] = useState(false);
  const [limitMessage, setLimitMessage] = useState(
    "You reached today's free story limit. Subscribe to get unlimited story exercises."
  );
  const [showSignInPrompt, setShowSignInPrompt] = useState(false);
  const [freeStoryRemaining, setFreeStoryRemaining] = useState<number | null>(null);
  
  // (Shine animation removed per request)

  // Glass effect removed per request; using solid dock styling

  const { words: vaultWords, loadWords, getDueWords, gradeWordSrs } = useAppStore();
  const hasStory = Boolean(story);
  const headerTitle = story?.title ?? 'Story Exercise';
  const headerSubtitle = story?.subtitle ?? null;
  const ctaAnim = useRef(new Animated.Value(0)).current;
  const shouldShowCTA = !isFullscreen && hasStory && !loading;
  const footerTranslate = ctaAnim.interpolate({ inputRange: [0, 1], outputRange: [120, 0] });
  
  // SRS-aware picker UI state
  const [pickerQuery, setPickerQuery] = useState('');
  const [pickerFilter, setPickerFilter] = useState<'recommended' | 'due' | 'weak' | 'all'>('recommended');
  const [pickerFolderId, setPickerFolderId] = useState<string | null>(null);
  // SRS feedback banner
  const [showSrsBanner, setShowSrsBanner] = useState(false);
  const srsBannerAnim = useRef(new Animated.Value(0)).current;
  const selectedSkuRef = useRef<string | null>(null);

  // Ensure words are loaded, but defer heavy work so the sheet animation feels instant
  useEffect(() => {
    const state = useAppStore.getState();
    if (Array.isArray(state.words) && state.words.length > 0) return;
    const task = (InteractionManager as any).runAfterInteractions?.(() => {
      try { loadWords(); } catch {}
    });
    return () => { try { (task as any)?.cancel?.(); } catch {}; };
  }, [loadWords]);

  useEffect(() => {
    Animated.timing(ctaAnim, {
      toValue: shouldShowCTA ? 1 : 0,
      duration: 240,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start();
  }, [ctaAnim, shouldShowCTA]);

  useEffect(() => {
    try { DeviceEventEmitter.emit('NAV_VISIBILITY', 'show'); } catch {}
  }, []);

  useEffect(() => {
    return () => {
      try { DeviceEventEmitter.emit('NAV_VISIBILITY', 'show'); } catch {}
    };
  }, []);

  // Check premium status on mount and when returning to this screen
  const refreshStoryAccess = useCallback(async () => {
    try {
      const status = await SubscriptionService.getStatus();
      if (status?.active) {
        setLocked(false);
        setFreeStoryRemaining(null);
        return;
      }
    } catch (e) {
      console.warn('StoryExercise: subscription status check failed:', e);
    }
    try {
      const limit = await UsageLimitsService.check('story');
      setFreeStoryRemaining(limit.remaining);
      setLocked(!limit.ok && limit.reason === 'subscribe');
    } catch (err) {
      console.warn('StoryExercise: story limit check failed:', err);
    }
  }, []);

  useEffect(() => {
    refreshStoryAccess();
  }, [refreshStoryAccess]);

  useFocusEffect(
    useCallback(() => {
      // Defer subscription check to avoid blocking tab switch animation
      requestAnimationFrame(() => {
        refreshStoryAccess();
      });
    }, [refreshStoryAccess])
  );

  // Preload products when opening the local paywall
  useEffect(() => {
    if (showPaywall && !products) {
      SubscriptionService.initialize().then(() =>
        SubscriptionService.getProducts(['com.royal.vocadoo.premium.months', 'com.royal.vocadoo.premium.annually']).then(setProducts).catch(() => setProducts([]))
      );
    }
  }, [showPaywall, products]);

  const handleContinuePurchaseLocal = async () => {
    setIsPurchasing(true);
    try {
      let current = products || [];
      if (!current.length) {
        try { current = await SubscriptionService.getProducts(['com.royal.vocadoo.premium.months', 'com.royal.vocadoo.premium.annually']); setProducts(current); } catch {}
      }
      const fallbackSku = (current.find(p => p.duration === 'monthly')?.id) || current[0]?.id || 'com.royal.vocadoo.premium.months';
      const sku = (selectedSkuRef.current) || fallbackSku;
      const purchasePromise = SubscriptionService.purchase(sku);
      const timeoutPromise = new Promise(async (resolve) => {
        setTimeout(async () => {
          try { resolve(await SubscriptionService.getStatus()); } catch { resolve({ active: false }); }
        }, 20000);
      });
      const next: any = await Promise.race([purchasePromise, timeoutPromise]);
      if (next?.active) {
        setLocked(false);
        setShowPurchaseSuccess(true);
        setTimeout(() => { setShowPurchaseSuccess(false); setShowPaywall(false); }, 1400);
      }
    } finally {
      setIsPurchasing(false);
    }
  };

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
      if (locked) {
        // Redirect to paywall instead of auto-generating
        setShowPaywall(true);
        return;
      }
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
    if (locked) {
      setShowPaywall(true);
      return;
    }
    const gate = await UsageLimitsService.checkAndBump('story');
    if (!gate.ok) {
      const msg =
        gate.reason === 'subscribe'
          ? 'You have used all 5 free story generations. Subscribe to keep creating stories.'
          : "You reached today's free story limit. Subscribe to get unlimited story exercises.";
      setLimitMessage(msg);
      setLimitOpen(true);
      return;
    }
    if (!gate.subscribed) {
      refreshStoryAccess();
    }
    const fallbackWords = story ? story.availableWords : currentVocabulary;
    const vocabularySource = overrideWords ?? fallbackWords;
    const vocabularyList = sanitizeWords(vocabularySource);

    if (vocabularyList.length < MAX_BLANKS) {
      Alert.alert('Not enough words', 'Pick five vocabulary words for the story.');
      return;
    }

    setLoading(true);
    setAnswersChecked(false); // Reset check state for new story

    // Track story started
    engagementTrackingService.trackEvent('story_started', '/story/StoryExercise', {
      difficulty: customization.difficulty,
      genre: customization.genre,
      wordCount: vocabularyList.length,
    });

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
      // Play story generated sound
      soundService.playStoryGenerated();
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

      // Auto-save the story silently in background
      autoSaveStory(parsedStory);
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

    // Determine previously assigned word (if any) for this blank
    let previous: string | null = null;
    for (const s of story.sentences) {
      if (s.blank.id === blankId) { previous = s.blank.userAnswer || null; break; }
      if (s.secondBlank && s.secondBlank.id === blankId) { previous = s.secondBlank.userAnswer || null; break; }
    }

    // Update chosen set: free the previous word and lock the new one
    setSelectedWords(prev => {
      const next = new Set(prev);
      if (previous && previous !== word) next.delete(previous);
      next.add(word);
      return next;
    });

    // Update the story with the selected word; also clear this word from any other blank to allow swapping
    setStory(prevStory => {
      if (!prevStory) return prevStory;

      const updatedSentences = prevStory.sentences.map(sentence => {
        // If another blank currently uses the chosen word, clear it
        const clearFirst = (b?: StoryBlank) => (b && b.userAnswer === word && b.id !== blankId)
          ? { ...b, userAnswer: '', isCorrect: false }
          : b;
        const clearedSecond = (b?: StoryBlank) => (b && b.userAnswer === word && b.id !== blankId)
          ? { ...b, userAnswer: '', isCorrect: false }
          : b;

        let s = sentence;
        // clear in both blanks if they hold the target word
        if (s.blank) s = { ...s, blank: clearFirst(s.blank)! };
        if (s.secondBlank) s = { ...s, secondBlank: clearedSecond(s.secondBlank) } as any;

        if (sentence.blank.id === blankId) {
          return {
            ...s,
            blank: {
              ...(s.blank as any),
              userAnswer: word,
              isCorrect: false,
            },
          };
        }
        if (s.secondBlank && s.secondBlank.id === blankId) {
          return {
            ...s,
            secondBlank: {
              ...(s.secondBlank as any),
              userAnswer: word,
              isCorrect: false,
            },
          };
        }
        return s;
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

  // Auto-save story silently after generation (no UI feedback, no navigation)
  const autoSaveStory = async (generatedStory: typeof story) => {
    if (!generatedStory) return;
    try {
      // Reconstruct full plain text with correct words
      const startsWithPunctuation = (value: string) => /^[\s.,;:!?\)\]]/.test(value);
      const endsWithWhitespace = (value: string) => /[\s\u00A0]$/.test(value);
      const pieces: string[] = [];
      for (const s of generatedStory.sentences) {
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
      const title = generatedStory.title || 'Story';
      const newId = `story_${Date.now()}`;
      await save({
        id: newId,
        title,
        content,
        level,
        words: generatedStory.availableWords,
        createdAt: new Date(),
      });
      setLastSavedId(newId);

      // Track story completed
      engagementTrackingService.trackEvent('story_completed', '/story/StoryExercise', {
        storyId: newId,
        title,
        difficulty: level,
        wordCount: generatedStory.availableWords?.length || 0,
      });

      // Sync to Supabase silently if authenticated
      try {
        const { data } = await supabase.auth.getSession();
        const sessionUserId = data?.session?.user?.id;
        if (!sessionUserId) {
          if (__DEV__) console.log('[autoSave] skipped (no session)');
          return;
        }
        if (__DEV__) console.log('[autoSave] syncing for user', sessionUserId);
        const { error } = await saveStoryToRemote(content, {
          local_story_id: newId,
          title,
          difficulty: level,
          words: generatedStory.availableWords,
          mode: 'fill-in',
        });
        if (error) {
          console.warn('[autoSave] remote sync failed:', error);
        } else if (__DEV__) {
          console.log('[autoSave] saved successfully');
        }
      } catch (remoteError) {
        console.warn('[autoSave] remote error:', remoteError);
      }
    } catch (e) {
      console.warn('[autoSave] failed:', e);
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
      const newId = `story_${Date.now()}`;
      await save({
        id: newId,
        title,
        content,
        level,
        words: story.availableWords,
        createdAt: new Date(),
      });
      setLastSavedId(newId);

      // Sync to Supabase if the user is authenticated
      try {
        const { data, error: sessionError } = await supabase.auth.getSession();
        if (__DEV__) {
          console.log('[StoryExercise] session debug:', {
            sessionError,
            sessionUserId: data?.session?.user?.id,
            hasSession: !!data?.session,
            expiresAt: data?.session?.expires_at,
          });
        }
        const sessionUserId = data?.session?.user?.id;
        if (!sessionUserId) {
          if (__DEV__) console.log('[StoryExercise] save skipped (no Supabase session)');
          setShowSignInPrompt(true);
          return;
        }
        if (__DEV__) console.log('[StoryExercise] syncing story for user', sessionUserId);
        const { error } = await saveStoryToRemote(content, {
          local_story_id: newId,
          title,
          difficulty: level,
          words: story.availableWords,
          mode: isNormalMode ? 'normal' : 'fill-in',
        });
        if (error) throw error;
      } catch (remoteError) {
        console.warn('Failed to sync story to Supabase:', remoteError);
      }

      // Fancy toast instead of system alert
      // Navigate directly to the full story view after saving
      try {
        router.push(`/journal/${newId}`);
      } catch {
        // Fallback: show toast with a link
        if (saveToastTimerRef.current) clearTimeout(saveToastTimerRef.current);
        setSaveToastVisible(true);
        saveToastAnim.setValue(0);
        Animated.timing(saveToastAnim, { toValue: 1, duration: 200, easing: Easing.out(Easing.cubic), useNativeDriver: true }).start();
        saveToastTimerRef.current = setTimeout(() => {
          Animated.timing(saveToastAnim, { toValue: 0, duration: 180, easing: Easing.in(Easing.cubic), useNativeDriver: true }).start(() => setSaveToastVisible(false));
        }, 2000);
      }
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
          <X size={14} color={blank.isCorrect ? "#4ED9CB" : "#F25E86"} />
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
  };

  const getAvailableWords = (forBlankId?: string) => {
    if (!story) return [];
    let currentWord: string | null = null;
    if (forBlankId) {
      for (const s of story.sentences) {
        if (s.blank.id === forBlankId) { currentWord = (s.blank.userAnswer || null); break; }
        if (s.secondBlank && s.secondBlank.id === forBlankId) { currentWord = (s.secondBlank.userAnswer || null); break; }
      }
    }
    // Hide words that are already used, except the one currently assigned to this blank (so user can keep or clear it)
    return story.availableWords.filter(w => !selectedWords.has(w) || w === currentWord);
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

  // Ensure sheet overlay can drag down when content is at top
  useEffect(() => {
    try {
      (globalThis as any).__SHEET_MAIN_Y = 0;
      (globalThis as any).__SHEET_RECENT_Y = 0;
      (globalThis as any).__SHEET_AT_TOP = true;
    } catch {}
  }, []);

  // Lock parent sheet drag while the word picker is open
  useEffect(() => {
    try { (globalThis as any).__SHEET_LOCKED = !!wordPickerOpen; } catch {}
    return () => { try { (globalThis as any).__SHEET_LOCKED = false; } catch {} };
  }, [wordPickerOpen]);

  if (loading) {
    return (
      <SafeAreaView edges={['bottom']} style={[styles.container, !isDarkMode && styles.containerLight]}>
        <View style={styles.loadingContainer}>
          <LottieView
            source={require('../../assets/lottie/learn/loading_inlearn.json')}
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
    <View style={[styles.container, !isDarkMode && styles.containerLight]}>
      <View style={{ flex: 1, paddingTop: Platform.OS === 'ios' ? 60 : 20 }}>
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
                if (locked) {
                  setShowPaywall(true);
                  return;
                }
                if (!vaultWords.length) {
                  Alert.alert('Vault Empty', 'Add words to your vault to build a custom story.');
                  return;
                }
                setTempSelection(story ? [...story.availableWords] : [...currentVocabulary]);
                setWordPickerOpen(true);
              }}
              activeOpacity={0.85}
            >
              <Search size={12} color={isDarkMode ? "#4ED9CB" : "#0F766E"} />
              <Text style={[styles.dockText, !isDarkMode && styles.dockTextLight]}>Pick</Text>
            </TouchableOpacity>

            {/* Customize */}
            <TouchableOpacity
              style={styles.dockItem}
              onPress={() => {
                if (locked) {
                  setShowPaywall(true);
                  return;
                }
                setShowCustomizeModal(true);
              }}
              activeOpacity={0.85}
            >
              <Settings size={12} color={isDarkMode ? "#4ED9CB" : "#0F766E"} />
              <Text style={[styles.dockText, !isDarkMode && styles.dockTextLight]}>Customize</Text>
            </TouchableOpacity>

            {/* Save */}
            <TouchableOpacity
              style={[styles.dockItem, !hasStory && styles.dockItemDisabled]}
              onPress={handleSaveToJournal}
              disabled={!hasStory}
              activeOpacity={0.85}
            >
              <Bookmark size={12} color={isDarkMode ? "#4ED9CB" : "#0F766E"} />
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
          onScroll={(e) => {
            try {
              const y = e.nativeEvent.contentOffset?.y || 0;
              (globalThis as any).__SHEET_MAIN_Y = y;
              const recent = (globalThis as any).__SHEET_RECENT_Y || 0;
              (globalThis as any).__SHEET_AT_TOP = (y <= 2) && (recent <= 2);
              (globalThis as any).__SHEET_RECENT_Y = y;
            } catch {}
          }}
          scrollEventThrottle={16}
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

            {/* Theme toggle removed per request */}

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
                  <LottieView
                    source={require('../../assets/lottie/story_exercise/Cute_Fox.json')}
                    autoPlay
                    loop
                    style={{ width: 220, height: 220, marginBottom: 8 }}
                  />
                  <Text style={[styles.storyPlaceholderTitle, !isDarkMode && styles.storyPlaceholderTitleLight]}>Ready when you are</Text>
                  <Text style={[styles.storyPlaceholderBody, !isDarkMode && styles.storyPlaceholderBodyLight]}>
                    Choose five words, tweak the story settings, then tap Generate to craft a new narrative.
                  </Text>
                  <Animated.View style={{ transform: [{ scale: pickWordsAnim }] }}>
                    <TouchableOpacity
                      style={styles.storyPlaceholderButton}
                      activeOpacity={0.8}
                      onPress={() => {
                        if (!isSignedIn) {
                          setShowSignupModal(true);
                          return;
                        }
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
                  </Animated.View>
                </View>
              )}
              {/* Lottie sparkles overlay while revealing */}
              {hasStory && showSparkles && (
                <MagicSparkles progress={sparklesProgress} dark={isDarkMode} />
              )}
            </Animated.View>
          </View>
          <View style={[styles.bottomSpacing, { height: 56 }]} />
          </>
        </ScrollView>
      </View>

      {/* Footer Buttons - slide up when story is available */}
      {!isFullscreen && (
        <Animated.View
          pointerEvents={shouldShowCTA ? 'auto' : 'none'}
          style={[
            styles.footerOverlay,
            isDarkMode ? styles.footerOverlayDark : styles.footerOverlayLight,
            {
              transform: [{ translateY: footerTranslate }],
              opacity: ctaAnim,
            },
          ]}
        >
          <View style={styles.footer}>
            <TouchableOpacity
              onPress={() => generateStory()}
              disabled={loading}
              style={[styles.regenerateButton, !isDarkMode && styles.regenerateButtonLight, loading && { opacity: 0.5 }]}
              activeOpacity={0.8}
            >
              <Text style={[styles.regenerateButtonText, !isDarkMode && styles.regenerateButtonTextLight]}>{loading ? 'Generating...' : 'Generate'}</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.checkButton, !isDarkMode && styles.checkButtonLight, (!hasStory || loading) && styles.checkButtonDisabled]}
              onPress={checkAnswers}
              disabled={!hasStory || loading}
              activeOpacity={0.8}
            >
              <Text style={styles.checkButtonText}>Check</Text>
            </TouchableOpacity>
          </View>
        </Animated.View>
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
                  if (lastSavedId) router.push(`/journal/${lastSavedId}`); else router.push('/journal');
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
        <View style={[styles.modalOverlay, !isDarkMode && styles.modalOverlayLight]}>
          <View style={[styles.modalContent, !isDarkMode && styles.modalContentLight]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, !isDarkMode && styles.modalTitleLight]}>Customize Story</Text>
              <TouchableOpacity onPress={() => setShowCustomizeModal(false)}>
                <X size={24} color="#9CA3AF" />
              </TouchableOpacity>
            </View>

            {/* Genre Selection */}
            <View style={styles.optionSection}>
              <Text style={[styles.optionTitle, !isDarkMode && styles.optionTitleLight]}>Genre</Text>
              <View style={styles.optionRow}>
                {['sci-fi', 'romance', 'adventure', 'mystery', 'fantasy', 'comedy', 'drama'].map((genre) => (
                  <TouchableOpacity
                    key={genre}
                    style={[
                      styles.optionPill,
                      !isDarkMode && styles.optionPillLight,
                      customization.genre === genre && (isDarkMode ? styles.optionPillSelected : styles.optionPillSelectedLight)
                    ]}
                    onPress={() => setCustomization(prev => ({ ...prev, genre: genre as any }))}
                  >
                    <Text style={[
                      styles.optionPillText,
                      !isDarkMode && styles.optionPillTextLight,
                      customization.genre === genre && (isDarkMode ? styles.optionPillTextSelected : styles.optionPillTextSelectedLight)
                    ]}>
                      {genre.charAt(0).toUpperCase() + genre.slice(1)}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* Difficulty Selection */}
            <View style={styles.optionSection}>
              <Text style={[styles.optionTitle, !isDarkMode && styles.optionTitleLight]}>Difficulty</Text>
              <View style={styles.optionRow}>
                {['easy', 'medium', 'hard'].map((difficulty) => (
                  <TouchableOpacity
                    key={difficulty}
                    style={[
                      styles.optionPill,
                      !isDarkMode && styles.optionPillLight,
                      customization.difficulty === difficulty && (isDarkMode ? styles.optionPillSelected : styles.optionPillSelectedLight)
                    ]}
                    onPress={() => setCustomization(prev => ({ ...prev, difficulty: difficulty as any }))}
                  >
                    <Text style={[
                      styles.optionPillText,
                      !isDarkMode && styles.optionPillTextLight,
                      customization.difficulty === difficulty && (isDarkMode ? styles.optionPillTextSelected : styles.optionPillTextSelectedLight)
                    ]}>
                      {difficulty.charAt(0).toUpperCase() + difficulty.slice(1)}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* Length Selection */}
            <View style={styles.optionSection}>
              <Text style={[styles.optionTitle, !isDarkMode && styles.optionTitleLight]}>Story Length</Text>
              <View style={styles.optionRow}>
                {['short', 'medium', 'long'].map((length) => (
                  <TouchableOpacity
                    key={length}
                    style={[
                      styles.optionPill,
                      !isDarkMode && styles.optionPillLight,
                      customization.length === length && (isDarkMode ? styles.optionPillSelected : styles.optionPillSelectedLight)
                    ]}
                    onPress={() => setCustomization(prev => ({ ...prev, length: length as any }))}
                  >
                    <Text style={[
                      styles.optionPillText,
                      !isDarkMode && styles.optionPillTextLight,
                      customization.length === length && (isDarkMode ? styles.optionPillTextSelected : styles.optionPillTextSelectedLight)
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

      {/* Local Paywall for direct access (when not routed through Profile) */}
      <LocalPaywall
        visible={showPaywall}
        onClose={() => setShowPaywall(false)}
        onContinue={handleContinuePurchaseLocal}
        isPurchasing={isPurchasing}
        hasTrial={(() => { const list = products || []; const selId = selectedSkuRef.current; const sel = list.find(p => p.id === selId) || list[0]; return !!sel?.hasFreeTrial; })()}
        products={products || []}
        onSelectSku={(sku: string) => { selectedSkuRef.current = sku; }}
      />

      {/* Sign up required modal */}
      <LimitModal
        visible={showSignupModal}
        title="Sign up required"
        message="Create an account to use Story and keep your progress synced."
        onClose={() => setShowSignupModal(false)}
        onSubscribe={() => {
          setShowSignupModal(false);
          router.push('/profile');
        }}
        primaryText="Sign up"
        secondaryText="Not now"
      />

      <Modal
        visible={wordPickerOpen}
        transparent
        animationType="slide"
        onRequestClose={() => setWordPickerOpen(false)}
      >
        <View style={[styles.wordPickerOverlay, !isDarkMode && styles.wordPickerOverlayLight]}>
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
                    // Use a capped pool of due words for speed; getDueWords already orders by priority
                    const dueRaw = (getDueWords ? getDueWords(200, pickerFolderId || undefined) : []) as Word[];
                    const rankDue = (w: Word) => {
                      const dueAt = w.srs?.dueAt ? new Date(w.srs.dueAt) : new Date(0);
                      const overdueDays = Math.max(0, Math.floor((now.getTime() - dueAt.getTime()) / (1000 * 60 * 60 * 24)));
                      const lapses = w.srs?.lapses ?? 0;
                      const weakBoost = w.isWeak ? 15 : 0;
                      // Higher is better; tiny deterministic noise breaks ties
                      return 100 + overdueDays * 3 + lapses * 4 + weakBoost + stableJitter(w.id);
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
                        .filter(w => w.isWeak && !pickedIds.has(w.id) && (!pickerFolderId || w.folderId === pickerFolderId))
                        .sort((a, b) => (b.srs?.lapses ?? 0) - (a.srs?.lapses ?? 0));
                      take(weak);
                    }
                    // Then recent (randomized within top 20 to avoid always-first)
                    if (picks.length < MAX_BLANKS) {
                      const recent = vaultWords
                        .filter(w => !pickedIds.has(w.id) && (!pickerFolderId || w.folderId === pickerFolderId))
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
                  autoCorrect
                  spellCheck
                  autoCapitalize="none"
                  autoComplete="off"
                  keyboardAppearance={isDarkMode ? 'dark' : 'light'}
                />
              </View>
              {/* Secondary actions removed per request */}
            </View>

            {/* Vault folders filter */}
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              style={[{ marginTop: 6 }, styles.folderChipsScroller]}
              contentContainerStyle={styles.folderChipsContent}
            >
              {(() => {
                try {
                  const folders = useAppStore.getState().getFolders();
                  const allChip = (
                    <TouchableOpacity
                      key={'__all__'}
                      style={[styles.folderChip, !isDarkMode && styles.folderChipLight, !pickerFolderId && styles.folderChipActive]}
                      onPress={() => setPickerFolderId(null)}
                    >
                      <Text style={[styles.folderChipText, !isDarkMode && styles.folderChipTextLight]}>All Folders</Text>
                    </TouchableOpacity>
                  );
                  const chips = folders.map((f) => (
                    <TouchableOpacity
                      key={f.id}
                      style={[styles.folderChip, !isDarkMode && styles.folderChipLight, pickerFolderId === f.id && styles.folderChipActive]}
                      onPress={() => setPickerFolderId(prev => (prev === f.id ? null : f.id))}
                    >
                      <Text style={[styles.folderChipText, !isDarkMode && styles.folderChipTextLight]}>{f.title}</Text>
                    </TouchableOpacity>
                  ));
                  return [allChip, ...chips];
                } catch { return null; }
              })()}
            </ScrollView>

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
                  // Use a capped pool of due words for speed; rely on getDueWords ordering
                  const due = (getDueWords ? getDueWords(200, pickerFolderId || undefined) : []) as Word[];
                  const dueIds = new Set(due.map(d => d.id));
                  const weak = vaultWords
                    .filter(w => w.isWeak && !dueIds.has(w.id) && (!pickerFolderId || w.folderId === pickerFolderId))
                    .sort((a, b) => (b.srs?.lapses ?? 0) - (a.srs?.lapses ?? 0));
                  const rest = vaultWords
                    .filter(w => !dueIds.has(w.id) && !weak.some(ww => ww.id === w.id) && (!pickerFolderId || w.folderId === pickerFolderId));
                  base = [...due, ...weak, ...rest];
                } else if (pickerFilter === 'due') {
                  base = (getDueWords ? getDueWords(200, pickerFolderId || undefined) : []) as Word[];
                } else if (pickerFilter === 'weak') {
                  base = vaultWords.filter(w => w.isWeak && (!pickerFolderId || w.folderId === pickerFolderId));
                } else {
                  base = pickerFolderId ? vaultWords.filter(w => w.folderId === pickerFolderId) : [...vaultWords];
                }
                if (query) {
                  base = base.filter(w =>
                    w.word.toLowerCase().includes(query) ||
                    w.definition.toLowerCase().includes(query) ||
                    (w.example || '').toLowerCase().includes(query)
                  );
                }
                // Deduplicate by word text so the picker doesn't show duplicates from different entries
                const seen = new Set<string>();
                const deduped = base.filter(w => {
                  const key = (w.word || '').trim().toLowerCase();
                  if (!key) return false;
                  if (seen.has(key)) return false;
                  seen.add(key);
                  return true;
                });
                return deduped;
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
                          <View style={[styles.statusPill, { backgroundColor: 'rgba(242,94,134,0.15)', borderColor: 'rgba(242,94,134,0.35)' }]}>
                            <Text style={[styles.statusPillText, { color: '#F25E86' }]}>Weak</Text>
                          </View>
                        ) : null}
                        <View style={[styles.statusPill, isDue ? styles.duePill : styles.futurePill]}>
                          <Text style={[styles.statusPillText, isDue ? styles.duePillText : styles.futurePillText]}>{statusLabel}</Text>
                        </View>
                      </View>
                      {selected && <Check size={16} color="#4ED9CB" />}
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
            <View style={[styles.wordPickerFooter, !isDarkMode && styles.wordPickerFooterLight, { paddingBottom: Math.max(insets.bottom, 16) }]}>
              <Text style={[styles.wordPickerCount, !isDarkMode && styles.wordPickerCountLight]}>
                {sanitizeWords(tempSelection).length} / {MAX_BLANKS} distinct
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
                  style={[styles.modalPrimary, sanitizeWords(tempSelection).length < MAX_BLANKS && styles.modalPrimaryDisabled]}
                  onPress={() => {
                    const sanitized = sanitizeWords(tempSelection);
                    if (sanitized.length < MAX_BLANKS) {
                      Alert.alert('Choose five words', 'Select at least five distinct words for the story.');
                      return;
                    }
                    setWordPickerOpen(false);
                    setCurrentVocabulary(sanitized);
                    generateStory(sanitized);
                  }}
                  disabled={sanitizeWords(tempSelection).length < MAX_BLANKS || loading}
                >
                  {loading ? (
                    <ActivityIndicator color="#1B263B" />
                  ) : (
                    <Text style={styles.modalPrimaryText}>Use Words</Text>
                  )}
                </TouchableOpacity>
              </View>
            </View>
          </KeyboardAvoidingView>
        </View>
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
            {/* Clear current word (send back to bank) */}
            {selectedBlankId ? (() => {
              let current: string | null = null;
              try {
                for (const s of story?.sentences || []) {
                  if (s.blank.id === selectedBlankId) { current = s.blank.userAnswer || null; break; }
                  if (s.secondBlank && s.secondBlank.id === selectedBlankId) { current = s.secondBlank.userAnswer || null; break; }
                }
              } catch {}
              return current ? (
                <View style={styles.wordSelectionActions}>
                  <TouchableOpacity
                    onPress={() => {
                      handleRemoveWord(current!, selectedBlankId);
                      setShowWordSelectionModal(false);
                      setSelectedBlankId(null);
                    }}
                    style={[styles.clearPill, !isDarkMode && styles.clearPillLight]}
                  >
                    <Text style={[styles.clearPillText, !isDarkMode && styles.clearPillTextLight]}>Remove current word</Text>
                  </TouchableOpacity>
                </View>
              ) : null;
            })() : null}
            
            <ScrollView
              style={styles.wordSelectionList}
              contentContainerStyle={styles.wordSelectionListContent}
              showsVerticalScrollIndicator={false}
            >
                {getAvailableWords(selectedBlankId || undefined).map((word) => (
                  <TouchableOpacity
                    key={word}
                    style={[styles.wordSelectionItem, !isDarkMode && styles.wordSelectionItemLight]}
                    onPress={() => handleWordSelection(word)}
                  >
                    <Text style={[styles.wordSelectionText, !isDarkMode && styles.wordSelectionTextLight]}>{hyphenateWord(word)}</Text>
                  </TouchableOpacity>
                ))}
                
                {getAvailableWords(selectedBlankId || undefined).length === 0 && (
                  <View style={styles.noWordsAvailable}>
                    <Text style={[styles.noWordsText, !isDarkMode && styles.noWordsTextLight]}>No words available</Text>
                    <Text style={[styles.noWordsSubtext, !isDarkMode && styles.noWordsSubtextLight]}>All words are already used</Text>
                  </View>
                )}
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Close padded content wrapper */}
      </View>

      <LimitModal
        visible={limitOpen}
        message={limitMessage}
        onClose={() => setLimitOpen(false)}
        onSubscribe={() => { setLimitOpen(false); try { router.push('/profile?paywall=1'); } catch {} }}
        primaryText="Subscribe"
        secondaryText="Not now"
      />
      <Modal visible={showSignInPrompt} transparent animationType="fade" onRequestClose={() => setShowSignInPrompt(false)}>
        <View style={styles.signInOverlay}>
          <View style={[styles.signInCard, !isDarkMode && styles.signInCardLight]}>
            <Text style={[styles.signInTitle, !isDarkMode && styles.signInTitleLight]}>Sign in required</Text>
            <Text style={[styles.signInSubtitle, !isDarkMode && styles.signInSubtitleLight]}>
              Saving and generating stories requires an account. It only takes a minute!
            </Text>
            <View style={styles.signInButtons}>
              <TouchableOpacity style={styles.signInSecondary} onPress={() => setShowSignInPrompt(false)}>
                <Text style={styles.signInSecondaryText}>Maybe later</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.signInPrimary}
                onPress={() => {
                  setShowSignInPrompt(false);
                  try { router.push('/profile'); } catch {}
                }}
              >
                <Text style={styles.signInPrimaryText}>Go to sign in</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

    </View>
  );
}

// Local Paywall Modal (reusable inside this screen)
const LocalPaywall: React.FC<{
  visible: boolean;
  onClose: () => void;
  onContinue: () => void;
  isPurchasing?: boolean;
  hasTrial?: boolean;
  products?: SubscriptionProduct[];
  onSelectSku?: (sku: string) => void;
}> = ({ visible, onClose, onContinue, isPurchasing, hasTrial, products = [], onSelectSku }) => {
  const themeName = useAppStore(s => s.theme);
  const isLight = themeName === 'light';
  const [selected, setSelected] = useState<string | null>(null);
  useEffect(() => {
    try {
      const monthly = (products || []).find(p => p.duration === 'monthly')?.id;
      const def = monthly || products?.[0]?.id || null;
      setSelected(def);
      if (def) onSelectSku?.(def);
    } catch {}
  }, [products]);
  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <SafeAreaView style={[styles.paywallContainer, isLight && styles.paywallContainerLight]}>
        <View style={styles.paywallHeaderRow}>
          <TouchableOpacity onPress={onClose}>
            <Text style={[styles.paywallCancel, isLight && styles.paywallCancelLight]}>Cancel</Text>
          </TouchableOpacity>
        </View>
        <View style={styles.paywallHeader}>
          <View style={styles.paywallBadge}><Text style={{ color: '#0D3B4A', fontWeight: '800' }}>👑</Text></View>
          <Text style={[styles.paywallTitle, isLight && styles.paywallTitleLight]}>Get Vocadoo Premium</Text>
          <Text style={[styles.paywallHeadline, isLight && styles.paywallHeadlineLight]}>Unlock everything</Text>
          {hasTrial && (<View style={styles.trialChip}><Text style={styles.trialChipText}>7 days free trial</Text></View>)}
        </View>
        <View style={styles.paywallBullets}>
          <Text style={[styles.paywallBullet, isLight && styles.paywallBulletLight]}>✓ Learn faster with focused practice</Text>
          <Text style={[styles.paywallBullet, isLight && styles.paywallBulletLight]}>✓ Save unlimited stories</Text>
          <Text style={[styles.paywallBullet, isLight && styles.paywallBulletLight]}>✓ Detailed analytics & progress</Text>
          <Text style={[styles.paywallBullet, isLight && styles.paywallBulletLight]}>✓ Cancel anytime from your Apple ID</Text>
        </View>
        <View style={styles.paywallPlansRow}>
          {(() => {
            const list = [...(products || [])].sort((a,b) => (a.duration === 'monthly' ? -1 : 1));
            return list.map(p => (
              <TouchableOpacity key={p.id} activeOpacity={0.9} onPress={() => { setSelected(p.id); onSelectSku?.(p.id); }} style={[styles.planCard, selected === p.id && styles.planCardActive]}>
                <Text style={styles.planTitle}>{p.duration === 'yearly' ? 'Yearly' : 'Monthly'}</Text>
                <Text style={styles.planPrice}>{p.localizedPrice}/{p.duration === 'yearly' ? 'year' : 'month'}</Text>
                {!!p.hasFreeTrial && (<Text style={styles.planTrialText}>Includes free trial</Text>)}
              </TouchableOpacity>
            ));
          })()}
        </View>
        <TouchableOpacity
          disabled={isPurchasing}
          onPress={onContinue}
          activeOpacity={0.9}
          style={[styles.paywallCta, isPurchasing && { opacity: 0.7 }]}
        >
          {isPurchasing ? (
            <ActivityIndicator color="#0D3B4A" />
          ) : (
            <Text style={styles.paywallCtaText}>{hasTrial ? 'Start Free Trial' : 'Continue'}</Text>
          )}
        </TouchableOpacity>
        {hasTrial && (
          <Text style={{ marginTop: 8, textAlign: 'center', color: isLight ? '#2D4A66' : '#D1D5DB', fontSize: 12 }}>
            After the 7‑day trial, your subscription renews at $4.99/month unless canceled at least 24 hours before renewal.
          </Text>
        )}
        <View style={styles.paywallFooterRow}>
          <Text style={[styles.paywallLink, isLight && styles.paywallLinkLight]}>Restore</Text>
          <Text style={[styles.paywallDot, isLight && styles.paywallLinkLight]}>•</Text>
          <Text style={[styles.paywallLink, isLight && styles.paywallLinkLight]}>Terms & Conditions</Text>
          <Text style={[styles.paywallDot, isLight && styles.paywallLinkLight]}>•</Text>
          <Text style={[styles.paywallLink, isLight && styles.paywallLinkLight]}>Privacy Policy</Text>
        </View>
      </SafeAreaView>
    </Modal>
  );
};

// Magical sparkles overlay (fallback): star-shaped sparkles (smaller, lighter, more of them)
const MagicSparkles: React.FC<{ progress: Animated.Value; dark?: boolean }> = ({ progress, dark }) => {
  const width = Dimensions.get('window').width - 40; // roughly card width minus padding
  const areaH = 220; // cover a taller portion near the top of the card
  const color = dark ? 'rgba(242,94,134,0.5)' : 'rgba(15,23,42,0.5)';
  const dimColor = dark ? 'rgba(242,94,134,0.25)' : 'rgba(15,23,42,0.25)';
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
    backgroundColor: '#1B263B',
  },
  containerLight: {
    backgroundColor: '#F8F8F8',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    // remove bottom divider line
  },
  headerLight: {
    // no divider in light mode
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
    fontFamily: 'Feather-Bold',
  },
  headerTitleLight: {
    color: '#111827',
    fontFamily: 'Feather-Bold',
  },
  headerSubtitle: {
    fontSize: 12,
    color: '#9CA3AF',
    marginTop: 2,
    fontFamily: 'Feather-Bold',
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
    color: '#F25E86',
    fontFamily: 'Feather-Bold',
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
    backgroundColor: '#2D4A66',
    justifyContent: 'center',
    padding: 2,
  },
  toggleTrackActive: {
    backgroundColor: '#F25E86',
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
    fontFamily: 'Feather-Bold',
  },
  toggleLabelLight: {
    color: '#111827',
    fontFamily: 'Feather-Bold',
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
    backgroundColor: '#1B263B',
    borderWidth: 1,
    borderColor: '#2D4A66',
    overflow: 'hidden',
  },
  modeSeg: { paddingVertical: 6, paddingHorizontal: 12 },
  modeSegLeft: { borderRightWidth: 1, borderRightColor: '#2D4A66' },
  modeSegRight: {},
  modeSegActive: { backgroundColor: '#4ED9CB' },
  modeSegText: { color: '#9CA3AF', fontWeight: '700', fontSize: 12, fontFamily: 'Feather-Bold' },
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
    backgroundColor: 'rgba(78,217,203,0.12)',
    borderWidth: 1,
    borderColor: 'rgba(78,217,203,0.25)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  toolText: { color: '#E5E7EB', fontWeight: '700', fontSize: 12, fontFamily: 'Feather-Bold' },
  toolsDock: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 10,
    backgroundColor: '#1B263B',
    borderWidth: 2,
    borderColor: 'rgba(78,217,203,0.08)',
    borderBottomWidth: 4,
    borderRightWidth: 4,
    borderBottomColor: 'rgba(78,217,203,0.12)',
    borderRightColor: 'rgba(78,217,203,0.1)',
    borderRadius: 18,
    paddingVertical: 8,
    paddingHorizontal: 12,
    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 6,
  },
  toolsDockLight: {
    backgroundColor: '#FFFFFF',
    borderColor: 'rgba(78,217,203,0.3)',
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    elevation: 4,
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
  dockText: { color: '#E5E7EB', fontSize: 12, fontWeight: '700', fontFamily: 'Feather-Bold' },
  dockTextLight: { color: '#2D4A66' },
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
    backgroundColor: '#1B263B',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderRadius: 16,
    marginRight: 8,
    marginBottom: 8,
    gap: 6,
    borderWidth: 2,
    borderColor: 'rgba(78,217,203,0.06)',
    borderBottomWidth: 4,
    borderRightWidth: 4,
    borderBottomColor: 'rgba(78,217,203,0.1)',
    borderRightColor: 'rgba(78,217,203,0.08)',
  },
  wordPillLight: {
    backgroundColor: '#FFFFFF',
    borderWidth: 2,
    borderColor: 'rgba(78,217,203,0.2)',
    borderBottomWidth: 4,
    borderRightWidth: 4,
    borderBottomColor: 'rgba(78,217,203,0.25)',
    borderRightColor: 'rgba(78,217,203,0.22)',
  },
  wordPillSelected: {
    borderColor: '#F25E86',
    backgroundColor: 'rgba(242,94,134,0.08)',
    borderWidth: 2,
    borderBottomWidth: 4,
    borderRightWidth: 4,
    borderBottomColor: '#F25E86',
    borderRightColor: '#F25E86',
  },
  wordPillText: {
    fontSize: 15,
    color: '#FFFFFF',
    fontWeight: '500',
    fontFamily: 'Feather-Bold',
  },
  wordPillTextLight: {
    color: '#111827',
  },
  wordBankButtonRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 8,
    alignItems: 'center',
    justifyContent: 'flex-start',
  },
  pickWordsButton: {
    backgroundColor: '#2D4A66',
    borderRadius: 8,
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
  pickWordsText: { fontSize: 12, color: '#9CA3AF', fontWeight: '500', textAlign: 'center', fontFamily: 'Feather-Bold' },
  wordBankActionButton: {
    backgroundColor: '#2D4A66',
    borderRadius: 8,
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
  wordBankActionButtonDisabled: {
    opacity: 0.4,
  },
  wordBankActionText: { fontSize: 12, color: '#9CA3AF', fontWeight: '500', textAlign: 'center', fontFamily: 'Feather-Bold' },
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
    backgroundColor: 'transparent',
    borderRadius: 4,
    padding: 4,
  },
  contentFullscreen: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: '#1B263B',
    zIndex: 5,
    paddingTop: 60,
    paddingHorizontal: 20,
  },
  contentFullscreenLight: {
    backgroundColor: '#F8F8F8',
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
    backgroundColor: '#243B53',
    borderRadius: 12,
    padding: 20,
    marginBottom: 16,
  },
  sentenceText: {
    fontSize: 22,
    lineHeight: 32,
    color: '#FFFFFF',
    fontFamily: 'Feather-Bold',
    letterSpacing: 0.2,
  },
  sentenceTextPaper: {
    color: '#1B263B',
    fontSize: 22,
    lineHeight: 32,
    fontFamily: 'Feather-Bold',
    letterSpacing: 0.2,
  },
  controlsToggleWrap: {
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#4ED9CB',
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
  controlsToggleText: { fontSize: 12, fontWeight: '800', color: '#FFFFFF', fontFamily: 'Feather-Bold' },
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
    backgroundColor: 'rgba(78,217,203,0.9)',
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
    backgroundColor: '#243B53',
    borderColor: '#2D4A66',
  },
  themeChipText: { fontSize: 12, fontWeight: '800', fontFamily: 'Feather-Bold' },
  sentenceTextLight: {
    color: '#1F2937',
  },
  completedWord: {
    color: '#4ED9CB',
    // Keep weight same as body to avoid width spikes near wrap points
    // Match parent letter spacing so the inline run lays out identically
    letterSpacing: 0.2,
    fontFamily: 'Feather-Bold',
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
    backgroundColor: 'rgba(78,217,203,0.22)',
  },
  blankPillIncorrect: {
    backgroundColor: 'rgba(242,94,134,0.22)',
  },
  blankText: {
    fontSize: 22,
    fontWeight: '600',
    fontFamily: 'Feather-Bold',
  },
  blankTextCorrect: { color: '#4ED9CB', fontFamily: 'Feather-Bold' },
  blankTextIncorrect: { color: '#F25E86', fontFamily: 'Feather-Bold' },
  blankTextFilled: { color: '#F25E86', fontFamily: 'Feather-Bold' },
  // Darker variant used in light mode for better contrast
  blankTextFilledLight: { color: '#D96A8A', fontFamily: 'Feather-Bold' },
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
  emptyBlankText: { fontSize: 22, color: '#9CA3AF', fontWeight: '600', letterSpacing: 1, textAlign: 'center', textAlignVertical: 'bottom', marginBottom: -6, fontFamily: 'Feather-Bold' },
  // Inline blank styles for proper text flow
  blankPillInline: {
    backgroundColor: 'transparent',
    color: '#F25E86',
    paddingHorizontal: 0,
    paddingVertical: 0,
    borderRadius: 0,
    fontSize: 22,
    fontWeight: '600',
    fontFamily: 'Feather-Bold',
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
    fontFamily: 'Feather-Bold',
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
    color: '#C86480',
  },
  footerOverlay: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 48,
    zIndex: 80,
  },
  footerOverlayLight: {
    backgroundColor: 'rgba(255,255,255,0.96)',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: -4 },
    elevation: 12,
  },
  footerOverlayDark: {
    backgroundColor: 'rgba(15,17,22,0.96)',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    shadowColor: '#000',
    shadowOpacity: 0.4,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: -6 },
    elevation: 12,
  },
  footer: {
    flexDirection: 'row',
    gap: 12,
    borderTopWidth: 0,
    borderTopColor: 'transparent',
  },
  buttonRow: {
    flexDirection: 'row',
    gap: 12,
    flex: 1,
  },
  regenerateButton: {
    flex: 1,
    backgroundColor: '#243B53',
    borderRadius: 12,
    paddingVertical: 10,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#0D1B2A',
  },
  customizeButton: {
    backgroundColor: '#243B53',
    borderRadius: 12,
    paddingVertical: 16,
    paddingHorizontal: 20,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#F25E86',
    minWidth: 56,
  },
  regenerateButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#9CA3AF',
    fontFamily: 'Ubuntu-Bold',
  },
  checkButton: {
    flex: 1,
    backgroundColor: '#F25E86',
    borderRadius: 12,
    paddingVertical: 10,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#0D1B2A',
    shadowColor: '#000',
    shadowOffset: { width: 1, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 0,
    elevation: 3,
  },
  checkButtonDisabled: {
    opacity: 0.5,
    backgroundColor: '#F25E86',
  },
  checkButtonText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FFFFFF',
    fontFamily: 'Ubuntu-Bold',
  },
  regenerateButtonLight: {
    backgroundColor: '#FFFFFF',
    borderColor: '#E5E7EB',
  },
  regenerateButtonTextLight: {
    color: '#6B7280',
  },
  checkButtonLight: {
    borderColor: '#C94A6E',
    shadowColor: '#C94A6E',
    shadowOpacity: 0.2,
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
    fontFamily: 'Feather-Bold',
  },
  saveToastTitleLight: {
    color: '#111827',
  },
  saveToastText: {
    marginTop: 4,
    color: '#CBD5E1',
    fontSize: 13,
    fontFamily: 'Feather-Bold',
  },
  saveToastTextLight: {
    color: '#2D4A66',
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
    fontFamily: 'Feather-Bold',
  },
  saveToastBtnTextLight: {
    color: '#2D4A66',
  },
  saveToastPrimary: {
    backgroundColor: '#F25E86',
  },
  saveToastPrimaryText: {
    color: '#111827',
    fontWeight: '800',
    fontSize: 13,
    paddingHorizontal: 2,
    fontFamily: 'Feather-Bold',
  },
  srsBanner: {
    position: 'absolute',
    left: 20,
    right: 20,
    bottom: 96,
    backgroundColor: '#4ED9CB',
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
    fontFamily: 'Feather-Bold',
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
    fontFamily: 'Feather-Bold',
  },
  storyPlaceholderTitleLight: {
    color: '#111827',
  },
  storyPlaceholderBody: {
    fontSize: 14,
    color: '#9CA3AF',
    textAlign: 'center',
    lineHeight: 20,
    fontFamily: 'Feather-Bold',
  },
  storyPlaceholderBodyLight: {
    color: '#2D4A66',
  },
  storyPlaceholderButton: {
    marginTop: 18,
    backgroundColor: '#F25E86',
    paddingVertical: 14,
    paddingHorizontal: 28,
    borderRadius: 12,
    marginBottom: 28,
    borderWidth: 3,
    borderColor: '#0D1B2A',
    shadowColor: '#000',
    shadowOpacity: 0.4,
    shadowRadius: 0,
    shadowOffset: { width: 2, height: 3 },
    elevation: 6,
  },
  storyPlaceholderButtonText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#FFFFFF',
    fontFamily: 'Feather-Bold',
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
    backgroundColor: '#1B263B',
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
  // Light variants for customize modal
  modalOverlayLight: { backgroundColor: 'rgba(0,0,0,0.35)' },
  modalContentLight: { backgroundColor: '#FFFFFF' },
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
    fontFamily: 'Feather-Bold',
  },
  optionSection: {
    marginBottom: 14,
  },
  optionTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: '#FFFFFF',
    marginBottom: 6,
    fontFamily: 'Feather-Bold',
  },
  optionTitleLight: { color: '#111827' },
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
    backgroundColor: '#243B53',
    borderWidth: 1,
    borderColor: '#2D4A66',
  },
  optionPillLight: { backgroundColor: '#F3F4F6', borderColor: '#E5E7EB' },
  optionPillSelected: {
    backgroundColor: '#F25E86',
    borderColor: '#F25E86',
  },
  optionPillSelectedLight: { backgroundColor: '#F25E86', borderColor: '#F25E86' },
  optionPillText: {
    fontSize: 12,
    color: '#9CA3AF',
    fontFamily: 'Feather-Bold',
  },
  optionPillTextLight: { color: '#2D4A66' },
  optionPillTextSelected: {
    color: '#FFFFFF',
    fontWeight: '500',
    fontFamily: 'Feather-Bold',
  },
  optionPillTextSelectedLight: { color: '#111827', fontWeight: '700', fontFamily: 'Feather-Bold' },
  applyButton: {
    backgroundColor: '#F25E86',
    borderRadius: 10,
    paddingVertical: 12,
    alignItems: 'center',
    marginTop: 6,
  },
  applyButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#FFFFFF',
    fontFamily: 'Feather-Bold',
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
    backgroundColor: '#1B263B',
    borderRadius: 20,
    maxWidth: 320,
    width: '90%',
    maxHeight: '60%',
    borderWidth: 2,
    borderColor: 'rgba(78,217,203,0.08)',
    borderBottomWidth: 4,
    borderRightWidth: 4,
    borderBottomColor: 'rgba(78,217,203,0.12)',
    borderRightColor: 'rgba(78,217,203,0.1)',
    // Glow on the card
    shadowColor: '#F25E86',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.35,
    shadowRadius: 20,
    elevation: 8,
  },
  wordSelectionModalLight: {
    backgroundColor: '#FFFFFF',
    borderColor: 'rgba(78,217,203,0.2)',
    borderBottomColor: 'rgba(78,217,203,0.25)',
    borderRightColor: 'rgba(78,217,203,0.22)',
    shadowColor: '#F25E86',
  },
  wordSelectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    // remove divider
  },
  wordSelectionActions: {
    paddingHorizontal: 20,
    paddingTop: 8,
  },
  clearPill: {
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.18)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    marginTop: 6,
  },
  clearPillLight: {
    backgroundColor: '#EFE4D6',
    borderColor: '#E0D2C1',
  },
  clearPillText: {
    color: '#E5E7EB',
    fontWeight: '600',
  },
  clearPillTextLight: {
    color: '#2D4A66',
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
    paddingVertical: 14,
    paddingHorizontal: 16,
    backgroundColor: '#1B263B',
    borderRadius: 16,
    margin: 4,
    borderWidth: 2,
    borderColor: 'rgba(78,217,203,0.06)',
    borderBottomWidth: 4,
    borderRightWidth: 4,
    borderBottomColor: 'rgba(78,217,203,0.1)',
    borderRightColor: 'rgba(78,217,203,0.08)',
    alignSelf: 'flex-start',
  },
  wordSelectionItemLight: {
    backgroundColor: '#FFFFFF',
    borderWidth: 2,
    borderColor: 'rgba(78,217,203,0.2)',
    borderBottomWidth: 4,
    borderRightWidth: 4,
    borderBottomColor: 'rgba(78,217,203,0.25)',
    borderRightColor: 'rgba(78,217,203,0.22)',
  },
  wordSelectionItemSelected: {
    borderColor: '#F25E86',
    backgroundColor: 'rgba(242,94,134,0.08)',
    borderWidth: 2,
    borderBottomWidth: 4,
    borderRightWidth: 4,
    borderBottomColor: '#F25E86',
    borderRightColor: '#F25E86',
  },
  wordSelectionText: {
    fontSize: 15,
    fontWeight: '500',
    color: '#FFFFFF',
    textAlign: 'center',
    fontFamily: 'Feather-Bold',
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
    fontFamily: 'Feather-Bold',
  },
  noWordsTextLight: { color: '#6B7280' },
  noWordsSubtext: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
    fontFamily: 'Feather-Bold',
  },
  noWordsSubtextLight: { color: '#9CA3AF' },
  // Word Picker (Choose exactly five words) Styles
  wordPickerOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.35)',
    justifyContent: 'flex-end',
    alignItems: 'stretch',
  },
  wordPickerContent: {
    backgroundColor: '#1B263B',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 24,
    width: '100%',
    height: '92%',
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
    fontFamily: 'Feather-Bold',
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
    borderColor: '#2D4A66',
    backgroundColor: '#243B53',
  },
  filterChipActive: {
    borderColor: '#F25E86',
    backgroundColor: 'rgba(242,94,134,0.15)'
  },
  filterChipText: { color: '#9CA3AF', fontSize: 12, fontWeight: '600', fontFamily: 'Feather-Bold' },
  filterChipTextActive: { color: '#F25E86' },
  autoPickButton: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    alignSelf: 'flex-end',
    marginTop: 6,
    marginLeft: 'auto',
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: '#4ED9CB',
  },
  autoPickButtonText: { color: '#4ED9CB', fontWeight: '800', fontSize: 12, fontFamily: 'Feather-Bold' },
  secondaryActionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    gap: 8,
    marginTop: 6,
  },
  textLink: { color: '#9CA3AF', fontSize: 12, fontFamily: 'Feather-Bold' },
  dotSep: { color: '#6B7280' },
  folderChip: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 12,
    backgroundColor: 'transparent',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'transparent',
    marginRight: 8,
    alignSelf: 'flex-start',
    flexGrow: 0,
    flexShrink: 0,
  },
  folderChipLight: { backgroundColor: 'transparent', borderColor: 'transparent' },
  folderChipActive: { borderColor: '#F25E86', backgroundColor: 'rgba(242,94,134,0.10)' },
  folderChipText: { color: '#9CA3AF', fontWeight: '700', fontSize: 12 },
  folderChipTextLight: { color: '#2D4A66' },
  folderChipsContent: {
    alignItems: 'center',
    paddingVertical: 2,
  },
  folderChipsScroller: {
    maxHeight: 36,
  },
  searchInputWrap: {
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#2D4A66',
    backgroundColor: '#243B53',
    paddingHorizontal: 10,
  },
  searchInput: {
    height: 36,
    color: '#E5E7EB',
    fontFamily: 'Feather-Bold',
  },
  wordPickerList: {
    flex: 1,
  },
  wordPickerListContent: {
    paddingBottom: 20,
  },
  wordPickerItem: {
    backgroundColor: '#1B263B',
    borderRadius: 16,
    padding: 16,
    marginBottom: 10,
    borderWidth: 2,
    borderColor: 'rgba(78,217,203,0.06)',
    borderBottomWidth: 4,
    borderRightWidth: 4,
    borderBottomColor: 'rgba(78,217,203,0.1)',
    borderRightColor: 'rgba(78,217,203,0.08)',
  },
  wordPickerItemLight: {
    backgroundColor: '#FFFFFF',
    borderWidth: 2,
    borderColor: 'rgba(78,217,203,0.2)',
    borderBottomWidth: 4,
    borderRightWidth: 4,
    borderBottomColor: 'rgba(78,217,203,0.25)',
    borderRightColor: 'rgba(78,217,203,0.22)',
  },
  wordPickerItemSelected: {
    borderColor: '#F25E86',
    backgroundColor: 'rgba(242,94,134,0.08)',
    borderWidth: 2,
    borderBottomWidth: 4,
    borderRightWidth: 4,
    borderBottomColor: '#F25E86',
    borderRightColor: '#F25E86',
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
  duePill: { backgroundColor: 'rgba(78,217,203,0.18)', borderColor: 'rgba(78,217,203,0.45)' },
  futurePill: { backgroundColor: 'rgba(147,197,253,0.12)', borderColor: 'rgba(147,197,253,0.4)' },
  duePillText: { color: '#4ED9CB' },
  futurePillText: { color: '#93C5FD' },
  wordPickerWord: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
    fontFamily: 'Feather-Bold',
  },
  wordPickerDefinition: {
    fontSize: 13,
    color: '#D1D5DB',
    fontFamily: 'Feather-Bold',
  },
  wordPickerExample: {
    marginTop: 6,
    fontSize: 12,
    color: '#9CA3AF',
    fontStyle: 'italic',
    fontFamily: 'Feather-Bold',
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
    fontFamily: 'Feather-Bold',
  },
  emptySubtitle: {
    fontSize: 13,
    color: '#9CA3AF',
    textAlign: 'center',
    fontFamily: 'Feather-Bold',
  },
  wordPickerFooter: {
    marginTop: 12,
    paddingTop: 16,
    paddingHorizontal: 4,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#1B263B',
  },
  wordPickerFooterLight: {
    backgroundColor: '#FFFFFF',
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
    borderColor: '#2D4A66',
    backgroundColor: '#243B53',
  },
  modalResetDisabled: {
    opacity: 0.5,
  },
  modalResetText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#E5E7EB',
    fontFamily: 'Feather-Bold',
  },
  // Light mode variants for word picker
  wordPickerOverlayLight: { backgroundColor: 'rgba(0,0,0,0.35)' },
  wordPickerContentLight: { backgroundColor: '#FFFFFF' },
  modalTitleLight: { color: '#111827' },
  wordPickerSubtitleLight: { color: '#6B7280' },
  filterChipLight: { borderColor: '#E5E7EB', backgroundColor: '#FFFFFF' },
  filterChipTextLight: { color: '#6B7280' },
  searchInputWrapLight: { borderColor: '#E5E7EB', backgroundColor: '#FFFFFF' },
  searchInputLight: { color: '#111827' },
  wordPickerItemLight: {
    backgroundColor: '#FFFFFF',
    borderWidth: 2,
    borderColor: 'rgba(78,217,203,0.2)',
    borderBottomWidth: 4,
    borderRightWidth: 4,
    borderBottomColor: 'rgba(78,217,203,0.25)',
    borderRightColor: 'rgba(78,217,203,0.22)',
  },
  wordPickerItemSelectedLight: {
    borderColor: '#F25E86',
    backgroundColor: 'rgba(242,94,134,0.08)',
    borderWidth: 2,
    borderBottomWidth: 4,
    borderRightWidth: 4,
    borderBottomColor: '#F25E86',
    borderRightColor: '#F25E86',
  },
  wordPickerWordLight: { color: '#111827' },
  wordPickerDefinitionLight: { color: '#2D4A66' },
  wordPickerExampleLight: { color: '#6B7280' },
  wordPickerCountLight: { color: '#6B7280' },
  modalResetLight: { borderColor: '#E5E7EB', backgroundColor: '#FFFFFF' },
  modalResetTextLight: { color: '#2D4A66' },
  wordPickerCount: {
    fontSize: 12,
    color: '#9CA3AF',
  },
  modalPrimary: {
    backgroundColor: '#F25E86',
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
    color: '#1B263B',
    fontFamily: 'Feather-Bold',
  },
  signInOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.55)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  signInCard: {
    width: '100%',
    borderRadius: 24,
    padding: 24,
    backgroundColor: '#0F1B2B',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(255,255,255,0.08)',
  },
  signInCardLight: {
    backgroundColor: '#FFFFFF',
    borderColor: '#E0E7FF',
  },
  signInTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#FDFDFD',
    marginBottom: 8,
  },
  signInTitleLight: {
    color: '#0D1B2A',
  },
  signInSubtitle: {
    fontSize: 15,
    color: '#CBD5F5',
    marginBottom: 20,
  },
  signInSubtitleLight: {
    color: '#475569',
  },
  signInButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  signInSecondary: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(255,255,255,0.4)',
    alignItems: 'center',
  },
  signInSecondaryText: {
    color: '#FDFDFD',
    fontWeight: '600',
  },
  signInPrimary: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 12,
    backgroundColor: '#7C3AED',
    alignItems: 'center',
  },
  signInPrimaryText: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  incorrectIcon: {
    color: '#F25E86',
    fontSize: 14,
    fontWeight: '600',
  },
  inlinePopup: {
    fontSize: 14,
  },
  inlinePopupText: {
    backgroundColor: 'rgba(78,217,203,0.5)',
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    overflow: 'hidden',
  },
  // Local paywall styles (match profile paywall, ensure full height)
  paywallContainer: {
    flex: 1,
    backgroundColor: '#0D1117',
    paddingHorizontal: 20,
  },
  paywallContainerLight: { backgroundColor: '#F3F4F6' },
  paywallHeaderRow: { paddingTop: 10, paddingBottom: 6 },
  paywallCancel: { color: '#C7D2FE', fontWeight: '600' },
  paywallCancelLight: { color: '#111827' },
  paywallHeader: { alignItems: 'center', paddingVertical: 10 },
  paywallBadge: { width: 58, height: 58, borderRadius: 16, backgroundColor: '#B6E0E2', justifyContent: 'center', alignItems: 'center', marginBottom: 10 },
  paywallTitle: { fontSize: 20, fontWeight: '800', color: '#E5E7EB' },
  paywallTitleLight: { color: '#111827' },
  paywallHeadline: { fontSize: 26, fontWeight: '800', color: '#E5E7EB', marginTop: 6 },
  paywallHeadlineLight: { color: '#111827' },
  paywallBullets: { marginTop: 16, gap: 8 },
  paywallBullet: { color: '#D1D5DB', fontSize: 16 },
  paywallBulletLight: { color: '#2D4A66' },
  paywallPlansRow: { flexDirection: 'row', gap: 12, marginTop: 18 },
  planCard: { flex: 1, backgroundColor: '#E5E7EB', borderRadius: 16, padding: 14 },
  planCardActive: { backgroundColor: '#B6E0E2' },
  planTitle: { fontSize: 14, color: '#0D3B4A' },
  planPrice: { fontSize: 18, fontWeight: '800', color: '#0D3B4A', marginTop: 2 },
  planTrialText: { marginTop: 4, color: '#0D3B4A', fontWeight: '600' },
  trialChip: { marginTop: 8, alignSelf: 'center', backgroundColor: '#FEF3C7', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 999 },
  trialChipText: { color: '#92400E', fontWeight: '800' },
  paywallCta: { marginTop: 18, backgroundColor: '#B6E0E2', borderRadius: 16, paddingVertical: 16, alignItems: 'center' },
  paywallCtaText: { color: '#0D3B4A', fontWeight: '800', fontSize: 18 },
  paywallFooterRow: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 8, marginTop: 14 },
  paywallLink: { color: '#9CA3AF' },
  paywallLinkLight: { color: '#2D4A66' },
  paywallDot: { color: '#9CA3AF' },
});

import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Dimensions,
  DeviceEventEmitter,
  Animated,
  TouchableOpacity,
  ScrollView,
  Vibration,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { DiagnosticWord, diagnosticWords, calculateLevel, mapToAppLevel } from './diagnostic-words';
import { useAppStore } from '../../lib/store';
import { X, Sparkles, Rocket, Star, Zap } from 'lucide-react-native';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

// Colors matching app theme
const ACCENT_ORANGE = '#F8B070';
const ACCENT_TEAL = '#4ED9CB';
const ACCENT_PINK = '#F25E86';
const BG_DARK = '#1A2744';
const SURFACE = '#1B263B';
const CARD_BG = '#243B53';

// XP points per word level
const XP_BY_LEVEL = {
  beginner: 5,
  intermediate: 10,
  advanced: 20,
};

// Floating XP animation component
const FloatingXP = ({ amount, x, y, onComplete }: { amount: number; x: number; y: number; onComplete: () => void }) => {
  const translateY = useRef(new Animated.Value(0)).current;
  const opacity = useRef(new Animated.Value(1)).current;
  const scale = useRef(new Animated.Value(0.5)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(translateY, {
        toValue: -60,
        duration: 800,
        useNativeDriver: true,
      }),
      Animated.sequence([
        Animated.timing(scale, {
          toValue: 1.2,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.timing(scale, {
          toValue: 1,
          duration: 100,
          useNativeDriver: true,
        }),
      ]),
      Animated.timing(opacity, {
        toValue: 0,
        duration: 800,
        delay: 200,
        useNativeDriver: true,
      }),
    ]).start(() => onComplete());
  }, []);

  return (
    <Animated.View
      style={[
        styles.floatingXP,
        {
          left: x - 25,
          top: y - 20,
          transform: [{ translateY }, { scale }],
          opacity,
        },
      ]}
    >
      <Text style={styles.floatingXPText}>+{amount} XP</Text>
    </Animated.View>
  );
};

// Twinkling star component
const TwinklingStar = ({ delay, size, left, top }: { delay: number; size: number; left: number; top: number }) => {
  const opacity = useRef(new Animated.Value(0.3)).current;

  useEffect(() => {
    const animate = () => {
      Animated.sequence([
        Animated.timing(opacity, { toValue: 1, duration: 1000 + Math.random() * 500, useNativeDriver: true }),
        Animated.timing(opacity, { toValue: 0.3, duration: 1000 + Math.random() * 500, useNativeDriver: true }),
      ]).start(() => animate());
    };
    const timer = setTimeout(animate, delay);
    return () => clearTimeout(timer);
  }, []);

  return (
    <Animated.View style={[styles.star, { left, top, opacity }]}>
      <Star size={size} color="#FFFFFF" fill="#FFFFFF" />
    </Animated.View>
  );
};

// Word card component
const WordCard = ({
  word,
  isSelected,
  onToggle,
  color,
  index,
}: {
  word: DiagnosticWord;
  isSelected: boolean;
  onToggle: (event: { nativeEvent: { pageX: number; pageY: number } }) => void;
  color: string;
  index: number;
}) => {
  const scale = useRef(new Animated.Value(1)).current;
  const glowOpacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.spring(scale, {
        toValue: isSelected ? 1.02 : 1,
        useNativeDriver: true,
        friction: 5,
      }),
      Animated.timing(glowOpacity, {
        toValue: isSelected ? 1 : 0,
        duration: 200,
        useNativeDriver: true,
      }),
    ]).start();
  }, [isSelected]);

  const handlePress = (e: any) => {
    if (Platform.OS === 'ios') {
      Vibration.vibrate(10);
    }
    Animated.sequence([
      Animated.timing(scale, { toValue: 0.95, duration: 50, useNativeDriver: true }),
      Animated.spring(scale, { toValue: isSelected ? 1 : 1.02, useNativeDriver: true, friction: 5 }),
    ]).start();
    onToggle(e);
  };

  return (
    <TouchableOpacity
      activeOpacity={0.8}
      onPress={handlePress}
      style={styles.wordCardTouchable}
    >
      <Animated.View style={[styles.wordCardOuter, { transform: [{ scale }] }]}>
        {/* Glow effect */}
        <Animated.View style={[styles.cardGlow, { opacity: glowOpacity, borderColor: color }]} />

        <View style={[styles.wordCard, isSelected && { borderColor: color, borderWidth: 2.5 }]}>
          {/* Selection indicator */}
          {isSelected && (
            <View style={[styles.selectedBadge, { backgroundColor: color }]}>
              <Sparkles size={12} color="#FFFFFF" />
            </View>
          )}

          <Text style={[styles.wordText, isSelected && { color }]}>{word.word}</Text>
        </View>
      </Animated.View>
    </TouchableOpacity>
  );
};

// Level section component
const LevelSection = ({
  title,
  words,
  selectedWords,
  onToggle,
  color,
  icon: Icon,
}: {
  title: string;
  words: DiagnosticWord[];
  selectedWords: Set<string>;
  onToggle: (word: DiagnosticWord, event: any) => void;
  color: string;
  icon: any;
}) => {
  return (
    <View style={styles.levelSection}>
      <View style={styles.levelHeader}>
        <View style={[styles.levelIconWrap, { backgroundColor: color + '20' }]}>
          <Icon size={18} color={color} />
        </View>
        <Text style={styles.levelTitle}>{title}</Text>
        <View style={styles.levelBadge}>
          <Text style={[styles.levelBadgeText, { color }]}>{selectedWords.size}/{words.length}</Text>
        </View>
      </View>

      <View style={styles.wordsGrid}>
        {words.map((word, index) => (
          <WordCard
            key={word.word}
            word={word}
            isSelected={selectedWords.has(word.word)}
            onToggle={(e) => onToggle(word, e)}
            color={color}
            index={index}
          />
        ))}
      </View>
    </View>
  );
};

export default function WordTest() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const selectedLevel = (params.selectedLevel as string) || 'beginner';
  const isRetake = params.retake === 'true';

  const _theme = useAppStore(s => s.theme);

  // Show intro screen first
  const [showIntro, setShowIntro] = useState(true);
  const introOpacity = useRef(new Animated.Value(1)).current;
  const introScale = useRef(new Animated.Value(0.9)).current;
  const rocketY = useRef(new Animated.Value(0)).current;

  // Word selection state
  const [selectedWords, setSelectedWords] = useState<Set<string>>(new Set());
  const [totalXP, setTotalXP] = useState(0);
  const [floatingXPs, setFloatingXPs] = useState<Array<{ id: number; amount: number; x: number; y: number }>>([]);
  const xpIdCounter = useRef(0);

  // Score animation
  const scoreScale = useRef(new Animated.Value(1)).current;

  // Get words by level
  const beginnerWords = useMemo(() => diagnosticWords.filter(w => w.level === 'beginner').slice(0, 6), []);
  const intermediateWords = useMemo(() => diagnosticWords.filter(w => w.level === 'intermediate').slice(0, 6), []);
  const advancedWords = useMemo(() => diagnosticWords.filter(w => w.level === 'advanced').slice(0, 6), []);

  // Selected words by level
  const selectedBeginner = useMemo(() => new Set([...selectedWords].filter(w => beginnerWords.some(bw => bw.word === w))), [selectedWords, beginnerWords]);
  const selectedIntermediate = useMemo(() => new Set([...selectedWords].filter(w => intermediateWords.some(iw => iw.word === w))), [selectedWords, intermediateWords]);
  const selectedAdvanced = useMemo(() => new Set([...selectedWords].filter(w => advancedWords.some(aw => aw.word === w))), [selectedWords, advancedWords]);

  useEffect(() => {
    DeviceEventEmitter.emit('NAV_VISIBILITY', 'hide');
    return () => DeviceEventEmitter.emit('NAV_VISIBILITY', 'show');
  }, []);

  // Intro animation
  useEffect(() => {
    if (showIntro) {
      Animated.spring(introScale, { toValue: 1, useNativeDriver: true, friction: 6 }).start();
      // Floating rocket animation
      Animated.loop(
        Animated.sequence([
          Animated.timing(rocketY, { toValue: -10, duration: 1500, useNativeDriver: true }),
          Animated.timing(rocketY, { toValue: 10, duration: 1500, useNativeDriver: true }),
        ])
      ).start();
    }
  }, [showIntro]);

  const handleStartTest = () => {
    Animated.parallel([
      Animated.timing(introOpacity, { toValue: 0, duration: 300, useNativeDriver: true }),
      Animated.timing(introScale, { toValue: 1.1, duration: 300, useNativeDriver: true }),
    ]).start(() => setShowIntro(false));
  };

  const handleToggleWord = useCallback((word: DiagnosticWord, event: any) => {
    const isCurrentlySelected = selectedWords.has(word.word);

    setSelectedWords(prev => {
      const next = new Set(prev);
      if (next.has(word.word)) {
        next.delete(word.word);
      } else {
        next.add(word.word);
      }
      return next;
    });

    // XP animation
    if (!isCurrentlySelected) {
      const xp = XP_BY_LEVEL[word.level];
      setTotalXP(prev => prev + xp);

      // Animate score
      Animated.sequence([
        Animated.timing(scoreScale, { toValue: 1.3, duration: 100, useNativeDriver: true }),
        Animated.spring(scoreScale, { toValue: 1, useNativeDriver: true, friction: 5 }),
      ]).start();

      // Add floating XP
      const id = xpIdCounter.current++;
      setFloatingXPs(prev => [...prev, { id, amount: xp, x: event.nativeEvent.pageX, y: event.nativeEvent.pageY }]);
    } else {
      const xp = XP_BY_LEVEL[word.level];
      setTotalXP(prev => Math.max(0, prev - xp));
    }
  }, [selectedWords]);

  const removeFloatingXP = useCallback((id: number) => {
    setFloatingXPs(prev => prev.filter(xp => xp.id !== id));
  }, []);

  const handleContinue = useCallback(() => {
    // Calculate level from selected words
    const knownWords = diagnosticWords.filter(w => selectedWords.has(w.word));
    const allTestWords = [...beginnerWords, ...intermediateWords, ...advancedWords];
    const determinedLevel = calculateLevel(knownWords, allTestWords);
    const appLevel = mapToAppLevel(determinedLevel);

    router.replace({
      pathname: '/placement/result',
      params: {
        selectedLevel,
        determinedLevel,
        appLevel,
        knownCount: selectedWords.size.toString(),
        totalCount: allTestWords.length.toString(),
        isRetake: isRetake ? 'true' : 'false',
      },
    });
  }, [router, selectedLevel, selectedWords, beginnerWords, intermediateWords, advancedWords, isRetake]);

  const handleClose = useCallback(() => {
    router.back();
  }, [router]);

  // Render intro screen
  if (showIntro) {
    return (
      <View style={styles.container}>
        {/* Background stars */}
        <TwinklingStar delay={0} size={6} left={30} top={100} />
        <TwinklingStar delay={300} size={4} left={SCREEN_WIDTH - 60} top={150} />
        <TwinklingStar delay={600} size={5} left={80} top={250} />
        <TwinklingStar delay={200} size={4} left={SCREEN_WIDTH - 100} top={300} />
        <TwinklingStar delay={500} size={6} left={50} top={400} />
        <TwinklingStar delay={100} size={5} left={SCREEN_WIDTH - 50} top={450} />

        <SafeAreaView style={styles.introSafe}>
          <Animated.View style={[styles.introContent, { opacity: introOpacity, transform: [{ scale: introScale }] }]}>
            {/* Floating rocket */}
            <Animated.View style={[styles.introRocketWrap, { transform: [{ translateY: rocketY }] }]}>
              <View style={styles.introRocket}>
                <Rocket size={64} color={ACCENT_ORANGE} />
              </View>
            </Animated.View>

            <Text style={styles.introTitle}>Let's discover{'\n'}your vocabulary!</Text>
            <Text style={styles.introSubtitle}>
              Tap all the words you know.{'\n'}
              No pressure – be honest!
            </Text>

            <View style={styles.introTips}>
              <View style={styles.introTip}>
                <View style={[styles.introTipDot, { backgroundColor: ACCENT_TEAL }]} />
                <Text style={styles.introTipText}>Beginner → +5 XP</Text>
              </View>
              <View style={styles.introTip}>
                <View style={[styles.introTipDot, { backgroundColor: ACCENT_ORANGE }]} />
                <Text style={styles.introTipText}>Intermediate → +10 XP</Text>
              </View>
              <View style={styles.introTip}>
                <View style={[styles.introTipDot, { backgroundColor: ACCENT_PINK }]} />
                <Text style={styles.introTipText}>Advanced → +20 XP</Text>
              </View>
            </View>

            <TouchableOpacity style={styles.introButton} activeOpacity={0.8} onPress={handleStartTest}>
              <View style={[styles.introButtonGradient, { backgroundColor: ACCENT_ORANGE }]}>
                <Text style={styles.introButtonText}>Start Word Check</Text>
                <Zap size={20} color="#FFFFFF" fill="#FFFFFF" />
              </View>
            </TouchableOpacity>
          </Animated.View>
        </SafeAreaView>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Background stars */}
      <TwinklingStar delay={0} size={4} left={20} top={80} />
      <TwinklingStar delay={400} size={5} left={SCREEN_WIDTH - 40} top={120} />
      <TwinklingStar delay={200} size={4} left={60} top={200} />

      {/* Floating XP animations */}
      {floatingXPs.map(xp => (
        <FloatingXP
          key={xp.id}
          amount={xp.amount}
          x={xp.x}
          y={xp.y}
          onComplete={() => removeFloatingXP(xp.id)}
        />
      ))}

      <SafeAreaView style={styles.safe}>
        {/* Header */}
        <View style={styles.header}>
          {isRetake ? (
            <TouchableOpacity style={styles.closeBtn} onPress={handleClose}>
              <X size={20} color="#FFFFFF" />
            </TouchableOpacity>
          ) : (
            <View style={{ width: 44 }} />
          )}

          <View style={styles.headerCenter}>
            <Text style={styles.headerTitle}>Word Check</Text>
            <Text style={styles.headerSubtitle}>Tap words you know</Text>
          </View>

          {/* XP Score */}
          <Animated.View style={[styles.xpBadge, { transform: [{ scale: scoreScale }] }]}>
            <Sparkles size={14} color={ACCENT_ORANGE} />
            <Text style={styles.xpText}>{totalXP}</Text>
          </Animated.View>
        </View>

        {/* Content */}
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* Beginner Section */}
          <LevelSection
            title="Beginner"
            words={beginnerWords}
            selectedWords={selectedBeginner}
            onToggle={handleToggleWord}
            color={ACCENT_TEAL}
            icon={Star}
          />

          {/* Intermediate Section */}
          <LevelSection
            title="Intermediate"
            words={intermediateWords}
            selectedWords={selectedIntermediate}
            onToggle={handleToggleWord}
            color={ACCENT_ORANGE}
            icon={Zap}
          />

          {/* Advanced Section */}
          <LevelSection
            title="Advanced"
            words={advancedWords}
            selectedWords={selectedAdvanced}
            onToggle={handleToggleWord}
            color={ACCENT_PINK}
            icon={Rocket}
          />

          {/* Bottom padding for button */}
          <View style={{ height: 100 }} />
        </ScrollView>

        {/* Continue Button */}
        <View style={styles.bottomBar}>
          <TouchableOpacity
            style={[styles.continueBtn, selectedWords.size === 0 && styles.continueBtnDisabled]}
            activeOpacity={0.8}
            onPress={handleContinue}
          >
            <View style={[styles.continueBtnGradient, { backgroundColor: selectedWords.size > 0 ? ACCENT_ORANGE : '#3D4F65' }]}>
              <Text style={styles.continueBtnText}>
                {selectedWords.size === 0 ? "I don't know any" : `Continue (${selectedWords.size} selected)`}
              </Text>
            </View>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: BG_DARK,
  },
  safe: {
    flex: 1,
  },
  star: {
    position: 'absolute',
    zIndex: 0,
  },

  // Intro styles
  introSafe: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  introContent: {
    alignItems: 'center',
    width: '100%',
  },
  introRocketWrap: {
    marginBottom: 32,
  },
  introRocket: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: SURFACE,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 3,
    borderColor: ACCENT_ORANGE + '40',
  },
  introTitle: {
    fontSize: 32,
    fontFamily: 'Feather-Bold',
    color: '#FFFFFF',
    textAlign: 'center',
    marginBottom: 16,
    lineHeight: 40,
  },
  introSubtitle: {
    fontSize: 16,
    fontFamily: 'Ubuntu-Medium',
    color: '#9CA3AF',
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 32,
  },
  introTips: {
    width: '100%',
    marginBottom: 40,
    gap: 12,
  },
  introTip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 20,
  },
  introTipDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  introTipText: {
    fontSize: 15,
    fontFamily: 'Ubuntu-Medium',
    color: '#9CA3AF',
  },
  introButton: {
    width: '100%',
    borderRadius: 16,
    overflow: 'hidden',
  },
  introButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 18,
    gap: 10,
  },
  introButtonText: {
    fontSize: 18,
    fontFamily: 'Feather-Bold',
    color: '#FFFFFF',
  },

  // Header styles
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 12,
  },
  headerCenter: {
    alignItems: 'center',
  },
  headerTitle: {
    color: '#F9FAFB',
    fontSize: 20,
    fontFamily: 'Feather-Bold',
  },
  headerSubtitle: {
    color: '#6B7280',
    fontSize: 13,
    fontFamily: 'Ubuntu-Medium',
    marginTop: 2,
  },
  closeBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: SURFACE,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#0D1B2A',
  },
  xpBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: SURFACE,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    gap: 6,
    borderWidth: 2,
    borderColor: ACCENT_ORANGE + '30',
  },
  xpText: {
    fontSize: 16,
    fontFamily: 'Ubuntu-Bold',
    color: ACCENT_ORANGE,
  },

  // Floating XP
  floatingXP: {
    position: 'absolute',
    zIndex: 100,
  },
  floatingXPText: {
    fontSize: 18,
    fontFamily: 'Ubuntu-Bold',
    color: ACCENT_ORANGE,
    textShadowColor: 'rgba(0,0,0,0.5)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },

  // Scroll content
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 8,
  },

  // Level section
  levelSection: {
    marginBottom: 28,
  },
  levelHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 14,
    gap: 10,
  },
  levelIconWrap: {
    width: 32,
    height: 32,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  levelTitle: {
    fontSize: 18,
    fontFamily: 'Feather-Bold',
    color: '#FFFFFF',
    flex: 1,
  },
  levelBadge: {
    backgroundColor: SURFACE,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  levelBadgeText: {
    fontSize: 13,
    fontFamily: 'Ubuntu-Bold',
  },

  // Words grid
  wordsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  wordCardTouchable: {
    width: (SCREEN_WIDTH - 40 - 20) / 3,
  },
  wordCardOuter: {
    position: 'relative',
  },
  cardGlow: {
    position: 'absolute',
    top: -2,
    left: -2,
    right: -2,
    bottom: -2,
    borderRadius: 16,
    borderWidth: 2,
  },
  wordCard: {
    backgroundColor: CARD_BG,
    borderRadius: 14,
    paddingVertical: 18,
    paddingHorizontal: 8,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#0D1B2A',
    minHeight: 60,
  },
  selectedBadge: {
    position: 'absolute',
    top: -6,
    right: -6,
    width: 22,
    height: 22,
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: BG_DARK,
  },
  wordText: {
    fontSize: 13,
    fontFamily: 'Ubuntu-Bold',
    color: '#FFFFFF',
    textAlign: 'center',
  },

  // Bottom bar
  bottomBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 20,
    paddingBottom: Platform.OS === 'ios' ? 34 : 20,
    paddingTop: 12,
    backgroundColor: BG_DARK,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.05)',
  },
  continueBtn: {
    borderRadius: 16,
    overflow: 'hidden',
  },
  continueBtnDisabled: {
    opacity: 0.7,
  },
  continueBtnGradient: {
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  continueBtnText: {
    fontSize: 17,
    fontFamily: 'Feather-Bold',
    color: '#FFFFFF',
  },
});

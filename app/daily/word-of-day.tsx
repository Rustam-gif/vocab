import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  SafeAreaView,
  Modal,
  Image,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useAppStore } from '../../lib/store';
import { getTodayWord, getWrongAnswers, getWrongSynonyms, DailyWord } from './word-pool';
import { Volume2, Check, X, Trophy, ArrowLeft } from 'lucide-react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { ProgressService } from '../../services/ProgressService';
import { VaultService } from '../../services/VaultService';
import { speak } from '../../lib/speech';
import { soundService } from '../../services/SoundService';

type Screen = 'intro' | 'quiz' | 'synonym' | 'results';

const COMPLETION_KEY = '@vocadoo.wotd.completed.';
const STREAK_KEY = '@vocadoo.wotd.streak';

export default function WordOfTheDay() {
  const router = useRouter();
  const theme = useAppStore(s => s.theme);
  const isLight = theme === 'light';

  const [screen, setScreen] = useState<Screen>('intro');
  const [word, setWord] = useState<DailyWord | null>(null);
  const [score, setScore] = useState(0);
  const [streak, setStreak] = useState(0);
  const [showAlreadyCompletedModal, setShowAlreadyCompletedModal] = useState(false);
  const [showErrorModal, setShowErrorModal] = useState(false);

  // Quiz state
  const [quizOptions, setQuizOptions] = useState<string[]>([]);
  const [quizSelected, setQuizSelected] = useState<number | null>(null);
  const [quizAnswered, setQuizAnswered] = useState(false);

  // Synonym state
  const [synonymOptions, setSynonymOptions] = useState<string[]>([]);
  const [synonymSelected, setSynonymSelected] = useState<number | null>(null);
  const [synonymAnswered, setSynonymAnswered] = useState(false);

  useEffect(() => {
    loadWord();
  }, []);

  const loadWord = async () => {
    try {
      const today = new Date().toISOString().split('T')[0];

      // Check if already completed
      const completed = await AsyncStorage.getItem(COMPLETION_KEY + today);
      if (completed === 'true') {
        setShowAlreadyCompletedModal(true);
        return;
      }

      // Load streak
      const streakStr = await AsyncStorage.getItem(STREAK_KEY);
      setStreak(parseInt(streakStr || '0', 10));

      // Get today's word
      const todayWord = getTodayWord();
      setWord(todayWord);

      // Prepare quiz options
      const wrongAnswers = getWrongAnswers(todayWord);
      const allOptions = [todayWord.definition, ...wrongAnswers];
      setQuizOptions(allOptions.sort(() => Math.random() - 0.5));

      // Prepare synonym options
      const wrongSynonyms = getWrongSynonyms(todayWord);
      const correctSynonym = todayWord.synonyms[0];
      const synonymOpts = [correctSynonym, ...wrongSynonyms];
      setSynonymOptions(synonymOpts.sort(() => Math.random() - 0.5));
    } catch (error) {
      console.error('[WOTD] Load error:', error);
      setShowErrorModal(true);
    }
  };

  const handleQuizAnswer = (index: number) => {
    if (quizAnswered || !word) return;

    setQuizSelected(index);
    setQuizAnswered(true);

    const correct = quizOptions[index] === word.definition;
    if (correct) {
      setScore(s => s + 1);
      soundService.playCorrectAnswer();
    } else {
      soundService.playIncorrectAnswer();
    }
  };

  const handleSynonymAnswer = (index: number) => {
    if (synonymAnswered || !word) return;

    setSynonymSelected(index);
    setSynonymAnswered(true);

    const correct = synonymOptions[index] === word.synonyms[0];
    if (correct) {
      setScore(s => s + 1);
      soundService.playCorrectAnswer();
    } else {
      soundService.playIncorrectAnswer();
    }
  };

  const completeChallenge = async () => {
    if (!word) return;

    try {
      const today = new Date().toISOString().split('T')[0];

      // Mark as completed
      await AsyncStorage.setItem(COMPLETION_KEY + today, 'true');

      // Update streak
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      const yesterdayKey = yesterday.toISOString().split('T')[0];
      const yesterdayCompleted = await AsyncStorage.getItem(COMPLETION_KEY + yesterdayKey);

      let newStreak = 1;
      if (yesterdayCompleted === 'true') {
        newStreak = streak + 1;
      }
      await AsyncStorage.setItem(STREAK_KEY, String(newStreak));
      setStreak(newStreak);

      // Award XP
      const baseXP = 15;
      const streakBonus = Math.min(newStreak * 2, 30);
      const totalXP = baseXP + streakBonus;
      await ProgressService.awardXP(totalXP);

      // Save word to vault
      await VaultService.saveWord({
        word: word.word,
        definition: word.definition,
        example: word.example,
        phonetic: word.phonetic,
        synonyms: word.synonyms,
      });

      soundService.playSetCompletion();
    } catch (error) {
      console.error('[WOTD] Complete error:', error);
    }
  };

  const handleFinish = async () => {
    await completeChallenge();
    router.back();
  };

  if (!word) {
    return (
      <SafeAreaView style={[styles.container, isLight && styles.containerLight]}>
        <Text style={[styles.loadingText, isLight && styles.loadingTextLight]}>Loading...</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, isLight && styles.containerLight]}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <ArrowLeft size={24} color={isLight ? '#111827' : '#E5E7EB'} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, isLight && styles.headerTitleLight]}>
          Word of the Day
        </Text>
        <View style={styles.backBtn} />
      </View>

      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
        {screen === 'intro' && (
          <View style={styles.introContainer}>
            {/* Hero Section with Image */}
            {word.image && (
              <View style={[styles.heroSection, isLight && styles.heroSectionLight]}>
                <Image
                  source={{ uri: word.image }}
                  style={styles.heroImage}
                  resizeMode="cover"
                />
                <View style={styles.heroOverlay} />
                <View style={styles.heroContent}>
                  <Text style={styles.heroWord}>{word.word}</Text>
                  <View style={styles.phoneticRow}>
                    <Text style={styles.heroPhonetic}>{word.phonetic}</Text>
                    <TouchableOpacity
                      style={styles.speakIconBtn}
                      onPress={() => speak(word.word)}
                    >
                      <Volume2 size={18} color="#4ED9CB" strokeWidth={2.5} />
                    </TouchableOpacity>
                  </View>
                </View>
              </View>
            )}

            {/* Main Content Card */}
            <View style={[styles.contentCard, isLight && styles.contentCardLight]}>
              {/* Definition Section */}
              <View style={styles.section}>
                <Text style={[styles.sectionLabel, isLight && styles.sectionLabelLight]}>Definition</Text>
                <Text style={[styles.sectionText, isLight && styles.sectionTextLight]}>{word.definition}</Text>
              </View>

              {/* Example Section */}
              <View style={styles.section}>
                <Text style={[styles.sectionLabel, isLight && styles.sectionLabelLight]}>Example</Text>
                <Text style={[styles.exampleText, isLight && styles.exampleTextLight]}>"{word.example}"</Text>
              </View>

              {/* Synonyms Section */}
              <View style={styles.section}>
                <Text style={[styles.sectionLabel, isLight && styles.sectionLabelLight]}>Synonyms</Text>
                <View style={styles.synonymsGrid}>
                  {word.synonyms.map((syn, i) => (
                    <View key={i} style={[styles.synonymPill, isLight && styles.synonymPillLight]}>
                      <Text style={[styles.synonymText, isLight && styles.synonymTextLight]}>{syn}</Text>
                    </View>
                  ))}
                </View>
              </View>
            </View>

            {/* Start Button */}
            <TouchableOpacity
              style={[styles.startBtn, isLight && styles.startBtnLight]}
              onPress={() => setScreen('quiz')}
              activeOpacity={0.8}
            >
              <Text style={styles.startBtnText}>Start Challenge</Text>
            </TouchableOpacity>
          </View>
        )}

        {screen === 'quiz' && (
          <View style={styles.quizContainer}>
            <Text style={[styles.questionText, isLight && styles.questionTextLight]}>
              What does "{word.word}" mean?
            </Text>

            <View style={styles.optionsContainer}>
              {quizOptions.map((option, index) => {
                const isSelected = quizSelected === index;
                const isCorrect = option === word.definition;
                const showFeedback = quizAnswered;

                let bgColor = isLight ? '#F9FAFB' : '#1F2937';
                let borderColor = isLight ? 'rgba(78,217,203,0.2)' : 'rgba(78,217,203,0.15)';

                if (showFeedback) {
                  if (isCorrect) {
                    bgColor = 'rgba(67,127,118,0.15)';
                    borderColor = '#437F76';
                  } else if (isSelected) {
                    bgColor = 'rgba(239,68,68,0.15)';
                    borderColor = '#EF4444';
                  }
                }

                return (
                  <TouchableOpacity
                    key={index}
                    style={[
                      styles.optionBtn,
                      { backgroundColor: bgColor, borderColor },
                      isSelected && styles.optionBtnSelected,
                    ]}
                    onPress={() => handleQuizAnswer(index)}
                    disabled={quizAnswered}
                  >
                    <Text style={[styles.optionText, isLight && styles.optionTextLight]}>
                      {option}
                    </Text>
                    {showFeedback && isCorrect && (
                      <Check size={20} color="#437F76" strokeWidth={2.5} />
                    )}
                    {showFeedback && isSelected && !isCorrect && (
                      <X size={20} color="#EF4444" strokeWidth={2.5} />
                    )}
                  </TouchableOpacity>
                );
              })}
            </View>

            {quizAnswered && (
              <TouchableOpacity
                style={[styles.ctaBtn, isLight && styles.ctaBtnLight]}
                onPress={() => setScreen('synonym')}
              >
                <Text style={styles.ctaBtnText}>Continue</Text>
              </TouchableOpacity>
            )}
          </View>
        )}

        {screen === 'synonym' && (
          <View style={styles.quizContainer}>
            <Text style={[styles.questionText, isLight && styles.questionTextLight]}>
              Which word is a synonym of "{word.word}"?
            </Text>

            <View style={styles.optionsContainer}>
              {synonymOptions.map((option, index) => {
                const isSelected = synonymSelected === index;
                const isCorrect = option === word.synonyms[0];
                const showFeedback = synonymAnswered;

                let bgColor = isLight ? '#F9FAFB' : '#1F2937';
                let borderColor = isLight ? 'rgba(78,217,203,0.2)' : 'rgba(78,217,203,0.15)';

                if (showFeedback) {
                  if (isCorrect) {
                    bgColor = 'rgba(67,127,118,0.15)';
                    borderColor = '#437F76';
                  } else if (isSelected) {
                    bgColor = 'rgba(239,68,68,0.15)';
                    borderColor = '#EF4444';
                  }
                }

                return (
                  <TouchableOpacity
                    key={index}
                    style={[
                      styles.optionBtn,
                      { backgroundColor: bgColor, borderColor },
                      isSelected && styles.optionBtnSelected,
                    ]}
                    onPress={() => handleSynonymAnswer(index)}
                    disabled={synonymAnswered}
                  >
                    <Text style={[styles.optionText, isLight && styles.optionTextLight]}>
                      {option}
                    </Text>
                    {showFeedback && isCorrect && (
                      <Check size={20} color="#437F76" strokeWidth={2.5} />
                    )}
                    {showFeedback && isSelected && !isCorrect && (
                      <X size={20} color="#EF4444" strokeWidth={2.5} />
                    )}
                  </TouchableOpacity>
                );
              })}
            </View>

            {synonymAnswered && (
              <TouchableOpacity
                style={[styles.ctaBtn, isLight && styles.ctaBtnLight]}
                onPress={() => setScreen('results')}
              >
                <Text style={styles.ctaBtnText}>See Results</Text>
              </TouchableOpacity>
            )}
          </View>
        )}

        {screen === 'results' && (
          <View style={styles.resultsContainer}>
            <View style={[styles.resultsCard, isLight && styles.resultsCardLight]}>
              <Trophy size={48} color="#F8B070" />
              <Text style={[styles.resultsTitle, isLight && styles.resultsTitleLight]}>
                Challenge Complete!
              </Text>
              <Text style={[styles.resultsScore, isLight && styles.resultsScoreLight]}>
                Score: {score}/2
              </Text>

              {streak > 0 && (
                <View style={[styles.streakBadge, isLight && styles.streakBadgeLight]}>
                  <Text style={styles.streakText}>🔥 {streak} Day Streak</Text>
                </View>
              )}

              <Text style={[styles.resultsMessage, isLight && styles.resultsMessageLight]}>
                {score === 2 ? 'Perfect! You mastered this word!' : 'Good effort! Keep learning every day.'}
              </Text>
            </View>

            <TouchableOpacity
              style={[styles.ctaBtn, isLight && styles.ctaBtnLight]}
              onPress={handleFinish}
            >
              <Text style={styles.ctaBtnText}>Done</Text>
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>

      {/* Already Completed Modal */}
      <Modal
        visible={showAlreadyCompletedModal}
        transparent
        animationType="fade"
        onRequestClose={() => {
          setShowAlreadyCompletedModal(false);
          router.back();
        }}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, isLight && styles.modalContentLight]}>
            <Text style={[styles.modalTitle, isLight && styles.modalTitleLight]}>
              Already Completed
            </Text>
            <Text style={[styles.modalMessage, isLight && styles.modalMessageLight]}>
              You have already completed today's word. Come back tomorrow!
            </Text>
            <TouchableOpacity
              style={[styles.modalButton, isLight && styles.modalButtonLight]}
              onPress={() => {
                setShowAlreadyCompletedModal(false);
                router.back();
              }}
            >
              <Text style={styles.modalButtonText}>OK</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Error Modal */}
      <Modal
        visible={showErrorModal}
        transparent
        animationType="fade"
        onRequestClose={() => {
          setShowErrorModal(false);
          router.back();
        }}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, isLight && styles.modalContentLight]}>
            <Text style={[styles.modalTitle, isLight && styles.modalTitleLight]}>
              Error
            </Text>
            <Text style={[styles.modalMessage, isLight && styles.modalMessageLight]}>
              Failed to load word. Please try again.
            </Text>
            <TouchableOpacity
              style={[styles.modalButton, isLight && styles.modalButtonLight]}
              onPress={() => {
                setShowErrorModal(false);
                router.back();
              }}
            >
              <Text style={styles.modalButtonText}>OK</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0F1419',
  },
  containerLight: {
    backgroundColor: '#F8F9FB',
  },
  loadingText: {
    flex: 1,
    textAlign: 'center',
    color: '#9CA3AF',
    fontSize: 16,
    marginTop: 100,
  },
  loadingTextLight: {
    color: '#6B7280',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 2,
    borderBottomColor: 'rgba(78,217,203,0.1)',
  },
  backBtn: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 19,
    fontWeight: '800',
    color: '#E5E7EB',
    fontFamily: 'Feather-Bold',
    letterSpacing: 0.5,
  },
  headerTitleLight: {
    color: '#111827',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 120,
  },
  introContainer: {
    gap: 24,
  },
  heroSection: {
    position: 'relative',
    width: '100%',
    height: 200,
    borderRadius: 24,
    overflow: 'hidden',
    backgroundColor: '#1B263B',
  },
  heroSectionLight: {
    backgroundColor: '#E5E7EB',
  },
  heroImage: {
    width: '100%',
    height: '100%',
    opacity: 0.4,
  },
  heroOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(15, 20, 25, 0.6)',
  },
  heroContent: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  heroWord: {
    fontSize: 42,
    fontWeight: '900',
    color: '#FFFFFF',
    fontFamily: 'Feather-Bold',
    textAlign: 'center',
    letterSpacing: 0.5,
  },
  phoneticRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginTop: 8,
  },
  heroPhonetic: {
    fontSize: 16,
    color: '#9CA3AF',
    fontFamily: 'Feather-Bold',
    letterSpacing: 0.5,
  },
  speakIconBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(78,217,203,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  contentCard: {
    backgroundColor: '#1F2937',
    borderRadius: 20,
    padding: 24,
    gap: 24,
  },
  contentCardLight: {
    backgroundColor: '#FFFFFF',
  },
  section: {
    gap: 10,
  },
  sectionLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: '#4ED9CB',
    fontFamily: 'Feather-Bold',
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
  sectionLabelLight: {
    color: '#0F766E',
  },
  sectionText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#E5E7EB',
    fontFamily: 'Feather-Bold',
    lineHeight: 28,
    letterSpacing: 0.3,
  },
  sectionTextLight: {
    color: '#111827',
  },
  exampleText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#9CA3AF',
    fontFamily: 'Feather-Bold',
    lineHeight: 24,
    letterSpacing: 0.2,
  },
  exampleTextLight: {
    color: '#6B7280',
  },
  synonymsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  synonymPill: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: 'rgba(78,217,203,0.15)',
  },
  synonymPillLight: {
    backgroundColor: 'rgba(78,217,203,0.2)',
  },
  synonymText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#4ED9CB',
    fontFamily: 'Feather-Bold',
  },
  synonymTextLight: {
    color: '#0F766E',
  },
  startBtn: {
    paddingVertical: 16,
    borderRadius: 16,
    backgroundColor: '#4ED9CB',
    alignItems: 'center',
    justifyContent: 'center',
  },
  startBtnLight: {
    backgroundColor: '#4ED9CB',
  },
  startBtnText: {
    fontSize: 17,
    fontWeight: '800',
    color: '#0D1B2A',
    fontFamily: 'Feather-Bold',
    letterSpacing: 0.5,
  },
  quizContainer: {
    gap: 28,
  },
  questionText: {
    fontSize: 24,
    fontWeight: '800',
    color: '#E5E7EB',
    lineHeight: 34,
    fontFamily: 'Feather-Bold',
    textAlign: 'center',
    letterSpacing: 0.3,
  },
  questionTextLight: {
    color: '#111827',
  },
  optionsContainer: {
    gap: 12,
  },
  optionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 20,
    borderRadius: 16,
    borderWidth: 2,
  },
  optionBtnSelected: {
    borderWidth: 2,
  },
  optionText: {
    flex: 1,
    fontSize: 16,
    fontWeight: '600',
    color: '#E5E7EB',
    lineHeight: 24,
    fontFamily: 'Feather-Bold',
    letterSpacing: 0.2,
  },
  optionTextLight: {
    color: '#111827',
  },
  resultsContainer: {
    gap: 28,
  },
  resultsCard: {
    padding: 40,
    borderRadius: 20,
    backgroundColor: '#1F2937',
    borderWidth: 2,
    borderColor: 'rgba(248,176,112,0.3)',
    borderBottomWidth: 4,
    borderRightWidth: 4,
    borderBottomColor: 'rgba(248,176,112,0.4)',
    borderRightColor: 'rgba(248,176,112,0.35)',
    alignItems: 'center',
    gap: 20,
    shadowColor: '#F8B070',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.2,
    shadowRadius: 16,
    elevation: 8,
  },
  resultsCardLight: {
    backgroundColor: '#FFFFFF',
    borderColor: 'rgba(248,176,112,0.4)',
    borderBottomColor: 'rgba(248,176,112,0.5)',
    borderRightColor: 'rgba(248,176,112,0.45)',
  },
  resultsTitle: {
    fontSize: 28,
    fontWeight: '900',
    color: '#E5E7EB',
    fontFamily: 'Feather-Bold',
    letterSpacing: 0.5,
  },
  resultsTitleLight: {
    color: '#111827',
  },
  resultsScore: {
    fontSize: 42,
    fontWeight: '900',
    color: '#4ED9CB',
    fontFamily: 'Feather-Bold',
    letterSpacing: 1,
  },
  resultsScoreLight: {
    color: '#0F766E',
  },
  streakBadge: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 14,
    backgroundColor: 'rgba(248,176,112,0.18)',
    borderWidth: 2,
    borderColor: 'rgba(248,176,112,0.35)',
    borderBottomWidth: 3,
    borderBottomColor: 'rgba(248,176,112,0.4)',
  },
  streakBadgeLight: {
    backgroundColor: 'rgba(248,176,112,0.12)',
  },
  streakText: {
    fontSize: 18,
    fontWeight: '800',
    color: '#F8B070',
    fontFamily: 'Feather-Bold',
    letterSpacing: 0.3,
  },
  resultsMessage: {
    fontSize: 16,
    color: '#C7D2FE',
    textAlign: 'center',
    lineHeight: 24,
    fontFamily: 'Feather-Bold',
    letterSpacing: 0.2,
    paddingHorizontal: 8,
  },
  resultsMessageLight: {
    color: '#3B5A7A',
  },
  // Modal styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.75)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  modalContent: {
    backgroundColor: '#1F2937',
    borderRadius: 20,
    padding: 28,
    width: '100%',
    maxWidth: 400,
    borderWidth: 2,
    borderColor: 'rgba(78,217,203,0.15)',
    borderBottomWidth: 4,
    borderRightWidth: 4,
    borderBottomColor: 'rgba(78,217,203,0.2)',
    borderRightColor: 'rgba(78,217,203,0.15)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 8,
  },
  modalContentLight: {
    backgroundColor: '#FFFFFF',
    borderColor: 'rgba(78,217,203,0.25)',
    borderBottomColor: 'rgba(78,217,203,0.3)',
    borderRightColor: 'rgba(78,217,203,0.25)',
  },
  modalTitle: {
    fontSize: 26,
    fontWeight: '900',
    color: '#E5E7EB',
    textAlign: 'center',
    marginBottom: 14,
    fontFamily: 'Feather-Bold',
    letterSpacing: 0.5,
  },
  modalTitleLight: {
    color: '#111827',
  },
  modalMessage: {
    fontSize: 17,
    color: '#9CA3AF',
    textAlign: 'center',
    lineHeight: 26,
    marginBottom: 28,
    fontFamily: 'Feather-Bold',
    letterSpacing: 0.2,
    paddingHorizontal: 8,
  },
  modalMessageLight: {
    color: '#6B7280',
  },
  modalButton: {
    backgroundColor: '#4ED9CB',
    paddingVertical: 16,
    paddingHorizontal: 40,
    borderRadius: 14,
    alignItems: 'center',
    shadowColor: '#4ED9CB',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.35,
    shadowRadius: 12,
    elevation: 6,
    borderWidth: 2,
    borderColor: 'rgba(78,217,203,0.3)',
    borderBottomWidth: 4,
    borderBottomColor: 'rgba(14,116,108,0.5)',
  },
  modalButtonLight: {
    backgroundColor: '#4ED9CB',
  },
  modalButtonText: {
    fontSize: 18,
    fontWeight: '900',
    color: '#0D1B2A',
    fontFamily: 'Feather-Bold',
    letterSpacing: 0.5,
  },
});

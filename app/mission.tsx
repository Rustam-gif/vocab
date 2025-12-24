import React, { useEffect, useRef, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Animated, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ArrowLeft } from 'lucide-react-native';
import { useRouter } from 'expo-router';
import { useAppStore } from '../lib/store';
import { getTheme } from '../lib/theme';
import LottieView from 'lottie-react-native';
import { getTodayMissionForUser, submitMissionAnswer } from '../services/dailyMission';
import type { MissionWithQuestions } from '../services/dailyMission';
const AnimatedTouchable = Animated.createAnimatedComponent(TouchableOpacity);

type MissionStatus = 'intro' | 'active' | 'done';

export default function MissionScreen() {
  const router = useRouter();
  const theme = useAppStore(s => s.theme);
  const colors = getTheme(theme);
  const userProgress = useAppStore(s => s.userProgress);
  const user = useAppStore(s => s.user);
  const userId = user?.id || 'local-user';

  const [status, setStatus] = useState<MissionStatus>('intro');
  const [index, setIndex] = useState(0);
  const [bundle, setBundle] = useState<MissionWithQuestions | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedIdx, setSelectedIdx] = useState<number | null>(null);
  const [answeredCorrect, setAnsweredCorrect] = useState<boolean | null>(null);
  const [correctCount, setCorrectCount] = useState(0);
  const [combo, setCombo] = useState(0);
  const xpPerQuestion = 10;
  const progressAnim = useRef(new Animated.Value(0)).current;
  const comboAnim = useRef(new Animated.Value(0)).current;
  const [answerAnim, setAnswerAnim] = useState<null | 'success' | 'notbad'>(null);
  const cardAnim = useRef(new Animated.Value(1)).current;

  const isLight = theme === 'light';
  const questions = bundle?.questions || [];
  const totalQuestions = questions.length || 5;
  const progressRatio = status === 'done' ? 1 : Math.min(1, (index + (selectedIdx !== null ? 1 : 0)) / Math.max(1, totalQuestions));
  const currentQuestion = questions[index];
  const promptLines = currentQuestion?.prompt?.split('\n') ?? [];
  const promptTitle = promptLines[0] || `Question ${index + 1}`;
  const promptBody = promptLines.slice(1).join('\n').trim();
  const correctIndex = currentQuestion?.correctIndex ?? -1;
  const correctText = correctIndex >= 0 ? currentQuestion?.options?.[correctIndex] : undefined;
  const missionComplete = bundle?.mission?.status === 'completed';
  const reviewCount = bundle?.mission?.weakWordsCount ?? 0;
  const newCount = bundle?.mission?.newWordsCount ?? 0;
  const storyCount = questions.filter(q => q.type === 'story_mcq' || q.type === 'story_context_mcq').length;
  const missionReward = bundle?.mission?.xpReward ?? 60;
  const missionStreak = userProgress?.streak ?? 0;
  const compositionReady = questions.length > 0;
  const isFillBlank = currentQuestion?.type === 'context_fill_blank';
  const isStoryQuestion = currentQuestion?.type === 'story_context_mcq' || currentQuestion?.type === 'story_mcq';

  useEffect(() => {
    Animated.timing(progressAnim, {
      toValue: progressRatio,
      duration: 350,
      useNativeDriver: false,
    }).start();
  }, [progressRatio, progressAnim]);

  useEffect(() => {
    if (combo > 1) {
      comboAnim.setValue(0);
      Animated.timing(comboAnim, { toValue: 1, duration: 220, useNativeDriver: true }).start();
    }
  }, [combo, comboAnim]);

  useEffect(() => {
    // Pop/slide the card when moving between questions
    cardAnim.setValue(0.92);
    Animated.spring(cardAnim, {
      toValue: 1,
      useNativeDriver: true,
      friction: 7,
      tension: 120,
    }).start();
  }, [index, cardAnim]);

  const hydrateFromMission = (res: MissionWithQuestions | null) => {
    if (!res) return;
    const baseCorrect = res.mission.correctCount ?? 0;
    const answeredIdx = res.questions.findIndex(q => !q.answered);
    const nextIdx = answeredIdx === -1 ? 0 : answeredIdx;
    if (res.mission.status === 'completed') {
      setStatus('done');
      setIndex(Math.max(res.questions.length - 1, 0));
      setCorrectCount(baseCorrect);
      setSelectedIdx(null);
      setAnsweredCorrect(null);
      setCombo(0);
      return;
    }
    if (res.mission.status === 'in_progress') {
      setStatus('active');
      setIndex(nextIdx);
      setCorrectCount(baseCorrect);
      setSelectedIdx(null);
      setAnsweredCorrect(null);
      setCombo(0);
      return;
    }
    setStatus('intro');
  };

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        setLoading(true);
        const res = await getTodayMissionForUser(userId);
        if (!alive) return;
        setBundle(res);
        hydrateFromMission(res);
      } catch (e) {
        console.warn('load mission failed', e);
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => {
      alive = false;
    };
  }, [userId]);

  const startMission = () => {
    if (missionComplete) {
      setStatus('done');
      return;
    }
    setStatus('active');
    setIndex(0);
	    setSelectedIdx(null);
	    setAnsweredCorrect(null);
	    setCorrectCount(0);
	    setCombo(0);
	    setAnswerAnim(null);
	  };

  const goNext = () => {
    const isLast = index === questions.length - 1;
    if (isLast) {
      setStatus('done');
      setSelectedIdx(null);
      setAnsweredCorrect(null);
      return;
    }
    setIndex(i => i + 1);
    setSelectedIdx(null);
    setAnsweredCorrect(null);
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Top bar */}
      <View style={styles.topBar}>
        <TouchableOpacity onPress={() => router.back()} style={styles.topBtn} activeOpacity={0.8}>
          <ArrowLeft size={22} color={isLight ? '#0D3B4A' : '#E5E7EB'} />
        </TouchableOpacity>
        <View style={{ flex: 1, alignItems: 'center' }}>
          <Text style={[styles.topTitle, isLight && styles.topTitleLight]}>Today’s Mission</Text>
        </View>
        <View style={{ width: 36 }} />
      </View>

      <ScrollView
        contentContainerStyle={[styles.body, status === 'active' && styles.bodyActive]}
        showsVerticalScrollIndicator={false}
      >
        {status === 'intro' && (
          <View style={[styles.card, isLight && styles.cardLight]}>
            <View style={styles.introHeaderRow}>
              <View style={{ flex: 1 }}>
                <Text style={[styles.title, isLight && styles.titleLight]}>Today’s Mission</Text>
                <Text style={[styles.subtitle, isLight && styles.subtitleLight]}>
                  {questions.length ? `${questions.length} questions · 5–10 min` : '5 questions · 5–10 min'}
                </Text>
              </View>
              <View style={[styles.streakPill, isLight && styles.streakPillLight]}>
                <Text style={[styles.streakPillText, isLight && { color: '#16A34A' }]}>
                  Streak {missionStreak} day{missionStreak === 1 ? '' : 's'}
                </Text>
              </View>
            </View>

            <View style={styles.chipRow}>
              <View style={[styles.metaChip, isLight && styles.metaChipLight]}>
                <Text style={[styles.metaChipText, isLight && styles.metaChipTextLight]}>
                  {compositionReady ? `${reviewCount} review` : 'Review loading…'}
                </Text>
              </View>
              <View style={[styles.metaChip, isLight && styles.metaChipLight]}>
                <Text style={[styles.metaChipText, isLight && styles.metaChipTextLight]}>
                  {compositionReady ? `${newCount} new` : 'New loading…'}
                </Text>
              </View>
              <View style={[styles.metaChip, isLight && styles.metaChipLight]}>
                <Text style={[styles.metaChipText, isLight && styles.metaChipTextLight]}>
                  {compositionReady ? `${storyCount} story` : 'Story loading…'}
                </Text>
              </View>
            </View>

            <View style={[styles.rewardStrip, isLight && styles.rewardStripLight]}>
              <Text style={[styles.rewardText, isLight && styles.rewardTextLight]}>
                +{missionReward} XP reward
              </Text>
            </View>
            <TouchableOpacity
              style={[styles.primaryBtn, (loading || missionComplete) && { opacity: 0.7 }]}
              activeOpacity={0.9}
              onPress={startMission}
              disabled={loading || missionComplete}
            >
              <Text style={styles.primaryBtnText}>
                {missionComplete ? 'Mission complete' : loading ? 'Preparing…' : status === 'active' ? 'Continue Mission' : 'Begin Mission'}
              </Text>
            </TouchableOpacity>
            <Text style={[styles.helper, isLight && styles.helperLight]}>You can pause anytime.</Text>
          </View>
        )}

        {status === 'active' && (
          <View style={[styles.card, styles.activeCard, isLight && styles.cardLight]}>
            {answerAnim && (
              <View style={styles.answerAnimOverlay} pointerEvents="none">
                <LottieView
                  source={
                    answerAnim === 'success'
                      ? require('../assets/lottie/storywords/success.json')
                      : require('../assets/lottie/storywords/notbad.json')
                  }
                  autoPlay
                  loop={false}
                  style={{ width: 220, height: 90 }}
                />
              </View>
            )}
            {!currentQuestion ? (
              <View style={{ paddingVertical: 20, alignItems: 'center' }}>
                <ActivityIndicator color={isLight ? '#0D3B4A' : '#F8B070'} />
              </View>
            ) : (
              <Animated.View
                style={{
                  transform: [
                    { scale: cardAnim },
                    {
                      translateY: cardAnim.interpolate({
                        inputRange: [0.92, 1],
                        outputRange: [8, 0],
                      }),
                    },
                  ],
                  opacity: cardAnim,
                }}
              >
                {isStoryQuestion && (
                  <View style={styles.storyIllustration}>
                    <View style={styles.storyIllustrationInner} />
                  </View>
                )}
                <View style={styles.cardHeader}>
                  <Text style={[styles.questionWord, isLight && styles.questionWordLight]}>
                    {promptTitle}
                  </Text>
                  {!!promptBody && !isFillBlank && (
                    <Text style={[styles.questionPrompt, isLight && styles.questionPromptLight]}>
                      {promptBody}
                    </Text>
                  )}
                  {!!promptBody && isFillBlank && (
                    <>
                      {(() => {
                        const lines = currentQuestion?.prompt?.split('\n') ?? [];
                        const bodyLines = lines.slice(1);
                        const sentence = bodyLines[0] || '';
                        const helper = bodyLines.slice(1).join('\n').trim();
                        const parts = sentence.split('_____');
                        return (
                          <>
                            <Text style={[styles.fillSentence]}>
                              {parts.map((part, idx) => (
                                <Text key={`seg-${idx}`} style={styles.fillSentenceText}>
                                  {part}
                                  {idx < parts.length - 1 && (
                                    <Text key={`blank-${idx}`} style={styles.blankPill}>
                                      _____
                                    </Text>
                                  )}
                                </Text>
                              ))}
                            </Text>
                            {!!helper && (
                              <Text style={[styles.fillHelperText]}>
                                {helper}
                              </Text>
                            )}
                          </>
                        );
                      })()}
                    </>
                  )}
                </View>
                <View style={styles.options}>
                  {currentQuestion.options.map((opt, optIdx) => {
                    const isSelected = selectedIdx === optIdx;
                    const show = selectedIdx !== null;
                    const isCorrect = optIdx === correctIndex;
                    const showCorrect = show && isCorrect;
                    const showIncorrect = show && isSelected && !isCorrect;
                    return (
                      <AnimatedTouchable
                        key={`${currentQuestion.id}-${optIdx}`}
                        style={[
                          styles.optionBtn,
                          isLight && styles.optionBtnLight,
                          isSelected && styles.optionBtnSelected,
                          showCorrect && styles.optionBtnCorrect,
                          showIncorrect && styles.optionBtnIncorrect,
                        ]}
                        disabled={selectedIdx !== null}
                        activeOpacity={0.9}
                        onPress={() => {
                          if (selectedIdx !== null) return;
                          const correct = optIdx === correctIndex;
                          setSelectedIdx(optIdx);
                          setAnsweredCorrect(correct);
                          if (bundle?.mission && currentQuestion) {
                            submitMissionAnswer({
                              missionId: bundle.mission.id,
                              questionId: currentQuestion.id,
                              chosenIndex: optIdx,
                              userId,
                            })
                              .then(({ mission }) => {
                                setBundle(prev => {
                                  if (!prev) return prev;
                                  return {
                                    ...prev,
                                    mission,
                                    questions: prev.questions.map(q => q.id === currentQuestion.id ? { ...q, answered: true } : q),
                                  };
                                });
                                if (mission.status === 'completed') {
                                  setStatus('done');
                                  setSelectedIdx(null);
                                }
                              })
                              .catch(err => console.warn('submitMissionAnswer failed', err));
                          }
                          if (correct) {
                            setCorrectCount(c => c + 1);
                            setCombo(c => c + 1);
                            setAnswerAnim('success');
                            setTimeout(() => setAnswerAnim(null), 900);
                          } else {
                            setCombo(0);
                            setAnswerAnim('notbad');
                            setTimeout(() => setAnswerAnim(null), 900);
                          }
                        }}
                      >
                        <Text
                          style={[
                            styles.optionText,
                            isLight && styles.optionTextLight,
                            (showCorrect || showIncorrect || isSelected) && styles.optionTextStrong,
                          ]}
                        >
                          {opt}
                        </Text>
                      </AnimatedTouchable>
                    );
                  })}
                </View>

                {selectedIdx !== null && (
                  <>
                    <Text
                      style={[
                        styles.feedback,
                        answeredCorrect ? styles.feedbackCorrect : styles.feedbackIncorrect,
                      ]}
                    >
                      {answeredCorrect ? 'Correct—nice job.' : 'Almost—here’s the right answer.'}
                    </Text>
                    {!answeredCorrect && (
                      <Text style={[styles.correctAnswer, isLight && styles.correctAnswerLight]}>
                        Correct: {correctText ?? '—'}
                      </Text>
                    )}
                    <View style={[styles.rewardStrip, isLight && styles.rewardStripLight, { marginTop: 8 }]}>
                      <Text style={[styles.rewardText, isLight && styles.rewardTextLight]}>
                        +{xpPerQuestion} XP · Combo x{Math.max(combo, 1)}
                      </Text>
                      {combo > 1 && (
                        <Animated.Text
                          style={[
                            styles.comboText,
                            {
                              opacity: comboAnim,
                              transform: [
                                {
                                  scale: comboAnim.interpolate({
                                    inputRange: [0, 1],
                                    outputRange: [0.9, 1.05],
                                  }),
                                },
                              ],
                            },
                          ]}
                        >
                          Combo!
                        </Animated.Text>
                      )}
                    </View>
                    <TouchableOpacity style={[styles.primaryBtn, { marginTop: 12 }]} activeOpacity={0.9} onPress={goNext}>
                      <Text style={styles.primaryBtnText}>
                        {index === questions.length - 1 ? 'Finish Mission' : 'Next question'}
                      </Text>
                    </TouchableOpacity>
                  </>
                )}
              </Animated.View>
            )}
          </View>
        )}

        {status === 'done' && (
          <View style={[styles.card, styles.completeCard, isLight && styles.cardLight]}>
            <Text style={[styles.title, isLight && styles.titleLight]}>Mission complete!</Text>
            <Text style={[styles.subtitle, isLight && styles.subtitleLight]}>
              +{missionReward} XP · Streak: {missionStreak} day{missionStreak === 1 ? '' : 's'}
            </Text>
            <Text style={[styles.helper, isLight && styles.helperLight, { marginTop: 8 }]}>
              {bundle?.mission?.correctCount ?? correctCount}/{questions.length} correct
            </Text>
            <Text style={[styles.helper, isLight && styles.helperLight]}>
              {reviewCount} review · {newCount} new · {storyCount} story
            </Text>
            <TouchableOpacity style={[styles.primaryBtn, { marginTop: 14 }]} activeOpacity={0.9} onPress={() => router.replace('/')}>
              <Text style={styles.primaryBtnText}>Back to Home</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.secondaryLink]}
              activeOpacity={0.8}
              onPress={() => router.replace('/vault')}
            >
              <Text style={[styles.secondaryLinkText, isLight && styles.secondaryLinkTextLight]}>
                Review today’s words in Vault
              </Text>
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  topBtn: {
    padding: 6,
  },
  topTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#E6EDF7',
  },
  topTitleLight: { color: '#111827' },
  body: {
    paddingHorizontal: 16,
    paddingVertical: 16,
    flexGrow: 1,
  },
  bodyActive: {
    justifyContent: 'center',
  },
  card: {
    backgroundColor: '#0b172a',
    borderRadius: 24,
    paddingVertical: 18,
    paddingHorizontal: 18,
    shadowColor: '#000',
    shadowOpacity: 0.25,
    shadowRadius: 20,
    shadowOffset: { width: 0, height: 12 },
  },
  cardLight: {
    backgroundColor: '#FFFFFF',
    shadowOpacity: 0.18,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 10 },
  },
  activeCard: {
    marginTop: 8,
  },
  title: {
    fontSize: 22,
    fontWeight: '800',
    color: '#E6EDF7',
  },
  titleLight: { color: '#111827' },
  subtitle: {
    marginTop: 4,
    fontSize: 14,
    color: '#AFC3E3',
  },
  subtitleLight: { color: '#4B5563' },
  introHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  bullets: {
    marginTop: 10,
    gap: 4,
  },
  bulletText: {
    color: '#C7D7F0',
    fontSize: 13,
  },
  bulletTextLight: { color: '#4B5563' },
  streakPill: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
    backgroundColor: 'rgba(124,231,160,0.16)',
  },
  streakPillText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#7CE7A0',
  },
  streakPillLight: {
    backgroundColor: 'rgba(34,197,94,0.12)',
  },
  chipRow: {
    flexDirection: 'row',
    marginTop: 12,
    gap: 8,
  },
  metaChip: {
    flexShrink: 0,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 999,
    backgroundColor: '#12243c',
  },
  metaChipText: {
    fontSize: 12,
    color: '#C7D7F0',
    fontWeight: '500',
  },
  metaChipLight: {
    backgroundColor: '#F3F4F6',
  },
  metaChipTextLight: {
    color: '#4B5563',
  },
  rewardStrip: {
    marginTop: 14,
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 12,
    backgroundColor: 'rgba(124,231,160,0.12)',
  },
  rewardStripLight: {
    backgroundColor: 'rgba(34,197,94,0.10)',
  },
  rewardText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#7CE7A0',
  },
  rewardTextLight: { color: '#7CE7A0' },
  comboText: {
    fontSize: 12,
    color: '#7CE7A0',
    fontWeight: '700',
    marginTop: 4,
  },
  primaryBtn: {
    marginTop: 16,
    backgroundColor: '#7CE7A0',
    paddingVertical: 12,
    borderRadius: 18,
    alignItems: 'center',
  },
  primaryBtnText: {
    color: '#0b1a2d',
    fontWeight: '800',
    fontSize: 15,
  },
  helper: {
    marginTop: 10,
    fontSize: 12,
    color: '#AFC3E3',
  },
  helperLight: { color: '#6B7280' },
  cardHeader: {
    marginTop: 4,
    marginBottom: 16,
    gap: 8,
    alignItems: 'center',
  },
  questionWord: {
    fontSize: 20,
    fontWeight: '800',
    color: '#E6EDF7',
  },
  questionWordLight: { color: '#111827' },
  questionPrompt: {
    fontSize: 15,
    color: '#C7D7F0',
    textAlign: 'center',
  },
  questionPromptLight: { color: '#4B5563' },
  fillSentence: {
    marginTop: 4,
  },
  fillSentenceText: {
    fontSize: 15,
    color: '#C7D7F0',
    textAlign: 'center',
  },
  blankPill: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    marginHorizontal: 2,
    borderRadius: 999,
    backgroundColor: 'rgba(79,215,217,0.16)',
    color: '#4FD7D9',
  },
  fillHelperText: {
    marginTop: 8,
    fontSize: 13,
    color: '#AFC3E3',
    textAlign: 'center',
  },
  options: {
    gap: 10,
    marginBottom: 8,
  },
  optionBtn: {
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: '#1f2b40',
    backgroundColor: '#12243c',
  },
  optionBtnLight: {
    borderColor: '#E5E7EB',
    backgroundColor: '#F3F4F6',
  },
  optionBtnSelected: {
    borderColor: '#4FD7D9',
    backgroundColor: 'rgba(79,215,217,0.18)',
  },
  optionBtnCorrect: {
    borderColor: '#1B8F5A',
    backgroundColor: 'rgba(27,143,90,0.18)',
  },
  optionBtnIncorrect: {
    borderColor: '#D64C4C',
    backgroundColor: 'rgba(214,76,76,0.16)',
  },
  optionText: {
    fontSize: 14,
    color: '#E6EDF7',
  },
  optionTextLight: { color: '#111827' },
  optionTextStrong: { fontWeight: '700' },
  feedback: {
    marginTop: 8,
    fontSize: 13,
    fontWeight: '700',
  },
  feedbackCorrect: { color: '#7CE7A0' },
  feedbackIncorrect: { color: '#D64C4C' },
  correctAnswer: {
    marginTop: 4,
    fontSize: 13,
    color: '#C7D7F0',
  },
  correctAnswerLight: { color: '#C7D7F0' },
  secondaryLink: {
    marginTop: 12,
    alignItems: 'center',
  },
  secondaryLinkText: {
    color: '#AFC3E3',
    fontSize: 14,
    fontWeight: '600',
  },
  secondaryLinkTextLight: { color: '#AFC3E3' },
  confettiOverlay: {
    position: 'absolute',
    top: -20,
    right: -10,
    opacity: 0.9,
  },
  answerAnimOverlay: {
    position: 'absolute',
    top: -18,
    left: 0,
    right: 0,
    alignItems: 'center',
    opacity: 0.95,
  },
  pathRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  pathNodes: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  nodeWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  nodeDot: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#152740',
    borderWidth: 2,
    borderColor: '#24344f',
    alignItems: 'center',
    justifyContent: 'center',
  },
  nodeDotLight: {
    backgroundColor: '#F3F4F6',
    borderColor: '#E5E7EB',
  },
  nodeLine: {
    flex: 1,
    height: 2,
    backgroundColor: '#24344f',
    marginHorizontal: 4,
    borderRadius: 999,
  },
  nodeLineDone: {
    backgroundColor: '#7CE7A0',
  },
  nodeDone: {
    backgroundColor: '#7CE7A0',
    borderColor: '#7CE7A0',
  },
  nodeCurrent: {
    borderColor: '#7CE7A0',
  },
  storyIllustration: {
    height: 80,
    borderRadius: 18,
    backgroundColor: '#12243c',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 14,
  },
  storyIllustrationInner: {
    width: 52,
    height: 52,
    borderRadius: 18,
    backgroundColor: 'rgba(79,215,217,0.12)',
  },
  completeCard: {
    shadowColor: '#7CE7A0',
    shadowOpacity: 0.35,
    shadowRadius: 24,
    shadowOffset: { width: 0, height: 14 },
  },
});

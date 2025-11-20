import React, { useEffect, useMemo, useRef, useState } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, ScrollView, ActivityIndicator, Alert, Dimensions, Platform, KeyboardAvoidingView, Animated, PanResponder } from 'react-native';
import LottieView from 'lottie-react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useAppStore } from '../../lib/store';
import { getTheme } from '../../lib/theme';
import aiService from '../../services/AIService';

export default function IELTSWriting() {
  const router = useRouter();
  const theme = useAppStore(s => s.theme);
  const colors = getTheme(theme);
  const isLight = theme === 'light';

  // Stage and timer
  const [showCoach, setShowCoach] = useState(true);
  const [mode, setMode] = useState<'task2'|'micro'|'task1_chart'|'task1_letter'>('task2');
  const duration = useMemo(() => ({ task2: 40, micro: 15, task1_chart: 20, task1_letter: 20 }[mode]), [mode]);
  const [timerRunning, setTimerRunning] = useState(false);
  const [secondsLeft, setSecondsLeft] = useState(duration * 60);
  const tickRef = useRef<NodeJS.Timeout | null>(null);
  useEffect(() => { setSecondsLeft(duration * 60); }, [duration]);
  useEffect(() => {
    if (!timerRunning) return;
    tickRef.current && clearInterval(tickRef.current);
    tickRef.current = setInterval(() => setSecondsLeft(s => (s > 0 ? s - 1 : 0)), 1000) as any;
    return () => { if (tickRef.current) clearInterval(tickRef.current); };
  }, [timerRunning]);
  useEffect(() => { if (secondsLeft === 0 && timerRunning) setTimerRunning(false); }, [secondsLeft, timerRunning]);

  // Coach content
  const [coachQs, setCoachQs] = useState<Array<{ text: string; topic: string; type: string }>>([]);
  const [chosenNumber, setChosenNumber] = useState('');
  const stems: Record<string,string[]> = {
      education: [
        'Universities should prioritise research over teaching. To what extent do you agree or disagree?',
        'Some think online courses will replace classroom learning. Discuss both views and give your opinion.',
        'What are the advantages and disadvantages of taking a gap year before university?'
      ],
      environment: [
        'Individuals, not governments, should be responsible for protecting the environment. To what extent do you agree or disagree?',
        'Plastic waste is a major problem in many countries. What are the causes and solutions?'
      ],
      technology: [
        'Technology makes people less social. Discuss both views and give your opinion.',
        'What are the advantages and disadvantages of relying on smartphones for daily tasks?'
      ],
      health: [
        'Prevention is better than cure. Governments should spend more on prevention. To what extent do you agree or disagree?',
        'Many people lead sedentary lives. What problems does this cause and how can they be solved?',
        // Added — Health
        'The best way to improve public health is by increasing sports facilities. Discuss both views and give your opinion.',
        'In some countries health and fitness are decreasing while average weights are increasing. What are the causes and solutions?',
        'Research indicates nature versus nurture has greater influence on development. Which do you consider the major influence?',
        'Schools should do more to teach students about health and wellbeing. Do you agree or disagree?',
        'More and more schools allow fast food on campus. Is it a positive or negative development?'
      ],
      crime: [
        'Some believe longer prison sentences reduce crime. Discuss both views and give your opinion.',
        'What are the causes of youth crime and what solutions can you suggest?',
        // Added — Criminal Justice / Youth Crime
        'There should be fixed punishments for each type of crime. Others argue circumstances and motivation must be considered. Discuss both views and give your own opinion.',
        'Capital punishment should never be used; others say it should be allowed for the most serious crimes. Discuss both views and give your own opinion.',
        'The purpose of prison is punishment; others say rehabilitation is primary. Discuss both views and give your opinion.',
        'People feel unsafe in public and at home. What are the causes and solutions?',
        'Excessive noise should be a criminal offence vs freedom to make noise. Discuss both views and give your opinion.',
        'Many young people deliberately damage public places. What are the causes and solutions?',
        'A person’s criminal record should be removed at 18. To what extent do you agree or disagree?',
        'More young people use drugs and alcohol and break the law. What are the causes and solutions?',
        'Children should never be imprisoned with adults. To what extent do you agree or disagree?'
      ],
      'government and society': [
        'Governments should invest more in public transport than in roads. To what extent do you agree or disagree?',
        'High taxes fund essential public services. What are the advantages and disadvantages?',
        // Added — Government spending / Society / Development / Globalisation
        'People prefer foreign films to local ones. Why is this and should governments support local filmmakers?',
        'Governments should invest more in public services instead of the arts. To what extent do you agree or disagree?',
        'The government should house people who cannot afford homes. To what extent do you agree or disagree?',
        'Public funding for children’s arts lessons vs private funding. Discuss both views and give your opinion.',
        'Spending money on space exploration is justified vs wasteful. Discuss both views and give your opinion.',
        'Mothers should be financially supported to stay at home with children. Do you agree or disagree?',
        'In some countries the number of under‑15s is rising. What are the effects now and in the future?',
        'Developed countries are not as happy as before development. What are the causes and solutions?',
        'Richer countries should give more financial assistance to poorer countries. To what extent do you agree or disagree?',
        'No aid should be given to countries with poor human‑rights records. To what extent do you agree or disagree?',
        'During public holidays tourist destinations face problems. What problems and what solutions?'
      ],
      'work and business': [
        'Working from home benefits employees more than employers. Discuss both views and give your opinion.',
        'What problems are caused by work-related stress and how can they be solved?',
        // Added — Employment
        'High‑level company positions should be reserved proportionally for women. Do you agree or disagree?',
        'Older workers must compete with young people for the same jobs. What problems and solutions?',
        'Exclude males or females from certain professions due to gender. Is this right?',
        'Job satisfaction expectations for all workers — how realistic? Discuss.',
        'Only senior managers should make decisions vs involving employees. Discuss both views and give your opinion.',
        'Working from home has many benefits vs drawbacks. Discuss both views and give your opinion.',
        'High salary vs contribution to society when choosing jobs. Discuss both views and give your opinion.'
      ],
      culture: [
        'Globalisation is making cultures more similar. Do the advantages outweigh the disadvantages?',
        'Some think museums should be free while others say they should charge. Discuss both views and give your opinion.',
        // Added — Celebrity / Globalisation
        'Being a celebrity brings problems as well as benefits. Do benefits outweigh drawbacks?',
        'Entertainers are paid too much money. Do you agree or disagree? Which other jobs should be highly paid?',
        'Successful sports professionals earn more than people in other important jobs. Discuss both views and give your own opinion.',
        'Traditional food replaced by international fast food harms individuals and society. Do you agree or disagree?',
        'Shopping has become entertainment rather than necessity. To what extent do you agree or disagree?'
      ]
    };

  const topicOptions = ['mix','education','environment','technology','health','crime','government and society','work and business','culture'] as const;
  const [topic, setTopic] = useState<typeof topicOptions[number]>('mix');

  // Infer question type from its wording
  const guessType = (q: string): 'agree'|'discuss'|'adv_disadv'|'problem_solution'|'two_part' => {
    const s = q.toLowerCase();
    if (/to what extent|do you agree/.test(s)) return 'agree';
    if (/discuss both views/.test(s)) return 'discuss';
    if (/advantages? (and|\/) disadvantages?/.test(s)) return 'adv_disadv';
    if (/(causes?|problems?).*(solutions?|solve)|how can.*be solved/.test(s)) return 'problem_solution';
    if (/answer both parts|two[- ]part question/.test(s)) return 'two_part';
    return 'discuss';
  };

  const generateQuestions = (t: typeof topicOptions[number]) => {
    const pool: Array<{ text: string; topic: string; type: string }> = [];
    if (t === 'mix') {
      for (const key of Object.keys(stems)) {
        const arr = stems[key];
        if (arr?.length) {
          const picked = arr[Math.floor(Math.random() * arr.length)];
          pool.push({ text: picked, topic: key, type: guessType(picked) });
        }
      }
    } else {
      const arr = stems[t];
      if (arr?.length) arr.forEach(picked => pool.push({ text: picked, topic: t, type: guessType(picked) }));
    }
    // Shuffle and take 5
    for (let i = pool.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [pool[i], pool[j]] = [pool[j], pool[i]];
    }
    setCoachQs(pool.slice(0, 5));
  };

  useEffect(() => { generateQuestions(topic); }, []);

  // Planner note fields
  const [planIntroParaphrase, setPlanIntroParaphrase] = useState('');
  const [planIntroOpinion, setPlanIntroOpinion] = useState('');
  const [planIntroIdeas, setPlanIntroIdeas] = useState('');
  const [planP2Topic, setPlanP2Topic] = useState('');
  const [planP2Explain, setPlanP2Explain] = useState('');
  const [planP2Example, setPlanP2Example] = useState('');
  const [planP3Topic, setPlanP3Topic] = useState('');
  const [planP3Explain, setPlanP3Explain] = useState('');
  const [planP3Example, setPlanP3Example] = useState('');
  const [planP4Restate, setPlanP4Restate] = useState('');
  const [planP4Summarise, setPlanP4Summarise] = useState('');
  const [planP4Recommend, setPlanP4Recommend] = useState('');

  // Writing & grading
  const [prompt, setPrompt] = useState('');
  // Smart sectioned editor
  const [currentSection, setCurrentSection] = useState<'intro'|'body1'|'body2'|'conclusion'>('intro');
  const currentSectionRef = useRef<'intro'|'body1'|'body2'|'conclusion'>(currentSection);
  useEffect(() => { currentSectionRef.current = currentSection; }, [currentSection]);
  const [introText, setIntroText] = useState('');
  const [body1Text, setBody1Text] = useState('');
  const [body2Text, setBody2Text] = useState('');
  const [conclusionText, setConclusionText] = useState('');
  const fullEssay = useMemo(() => [introText, body1Text, body2Text, conclusionText].map(s => s.trim()).filter(Boolean).join('\n\n'), [introText, body1Text, body2Text, conclusionText]);
  // Strict word counter: counts tokens, ignores spaces/newlines and punctuation; treats hyphenated/contracted forms as single words.
  const wordCount = useMemo(() => {
    const t = fullEssay
      .replace(/\uFEFF/g, '')
      .replace(/[\u200B-\u200D]/g, '')
      .replace(/[\u201C\u201D]/g, '"')
      .replace(/[\u2018\u2019]/g, "'")
      .trim();
    if (!t) return 0;
    const matches = t.match(/[A-Za-z]+(?:[-'][A-Za-z]+)*/g);
    return matches ? matches.length : 0;
  }, [fullEssay]);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<null | any>(null);
  const [expanded, setExpanded] = useState(false);
  const baseHeight = 220;
  // Reduce expanded size so it doesn’t dominate the screen when focused
  const expandedHeight = Math.floor(Dimensions.get('window').height * 0.58);
  const editorHeight = useRef(new Animated.Value(baseHeight)).current;
  const scrollRef = useRef<ScrollView>(null);
  const editorPosYRef = useRef(0);

  // Section transition animation (slide up + fade in)
  const sectionSlideY = useRef(new Animated.Value(0)).current;
  const sectionFade = useRef(new Animated.Value(1)).current;

  const animateToSection = (nextKey: 'intro' | 'body1' | 'body2' | 'conclusion') => {
    try {
      sectionSlideY.setValue(24);
      sectionFade.setValue(0);
      setCurrentSection(nextKey);
      Animated.parallel([
        Animated.timing(sectionSlideY, { toValue: 0, duration: 220, useNativeDriver: true }),
        Animated.timing(sectionFade, { toValue: 1, duration: 220, useNativeDriver: true }),
      ]).start();
    } catch {
      setCurrentSection(nextKey);
    }
  };

  const getNextSection = (cur: 'intro'|'body1'|'body2'|'conclusion'): 'intro'|'body1'|'body2'|'conclusion' =>
    cur === 'intro' ? 'body1' : cur === 'body1' ? 'body2' : cur === 'body2' ? 'conclusion' : 'intro';

  // Swipe up gesture on editor to go to next section
  const panResponder = useRef(
    PanResponder.create({
      onMoveShouldSetPanResponder: (_e, g) => {
        // start capturing if mostly vertical and noticeable movement
        return Math.abs(g.dy) > 16 && Math.abs(g.dx) < 20;
      },
      onPanResponderRelease: (_e, g) => {
        if (g.dy < -28) {
          const cur = currentSectionRef.current;
          const next = getNextSection(cur);
          animateToSection(next);
        }
      },
    })
  ).current;

  const formatTime = (s: number) => {
    const m = Math.floor(s / 60); const r = s % 60; return `${String(m).padStart(2,'0')}:${String(r).padStart(2,'0')}`;
  };

  const submit = async () => {
    if (!fullEssay.trim()) { Alert.alert('Write your answer', 'Please enter your essay before submitting.'); return; }
    setLoading(true); setResult(null);
    try {
      const res = await aiService.gradeIELTSWritingTask2Rich({ prompt_text: prompt, student_answer: fullEssay, word_count: wordCount });
      setResult(res);
    } catch (e: any) {
      Alert.alert('Grading failed', e?.message || 'Please try again.');
    } finally { setLoading(false); }
  };

  const proceedToWriting = () => {
    const n = parseInt(chosenNumber, 10);
    if (!(n >= 1 && n <= 5)) { Alert.alert('Choose 1–5', 'Type a number from 1 to 5 to select a question.'); return; }
    setPrompt(coachQs[n-1] || '');
    setShowCoach(false);
  };

  return (
    <SafeAreaView style={[styles.page, { backgroundColor: colors.background }]}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView ref={scrollRef} contentContainerStyle={{ padding: 16, paddingBottom: 24 }} keyboardShouldPersistTaps="handled">
        <View style={styles.headerRow}>
          <Text style={[styles.title, isLight && { color: '#111827' }]}>IELTS Writing</Text>
          <TouchableOpacity accessibilityLabel="Close" onPress={() => router.back()} style={styles.closeBtn}>
            <Text style={[styles.closeTxt, isLight && { color: '#111827' }]}>✕</Text>
          </TouchableOpacity>
        </View>

        {showCoach ? (
          <>
            {/* Topic selector */}
            <Text style={[styles.sectionTitle, isLight && { color: '#111827' }]}>Choose a topic</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingVertical: 6 }}>
              {topicOptions.map((t) => (
                <TouchableOpacity
                  key={t}
                  onPress={() => { setTopic(t); generateQuestions(t); }}
                  style={[styles.topicChip, isLight && styles.topicChipLight, topic === t && styles.topicChipActive]}
                >
                  <Text style={[styles.topicChipText, isLight && styles.topicChipTextLight, topic === t && styles.topicChipTextActive]}>{t === 'mix' ? 'Mix' : t}</Text>
                </TouchableOpacity>
              ))}
              <TouchableOpacity onPress={() => generateQuestions(topic)} style={styles.topicRefresh}>
                <Text style={styles.topicRefreshText}>Regenerate</Text>
              </TouchableOpacity>
            </ScrollView>
            <Text style={[styles.coachIntro, isLight && { color: '#374151' }]}>You are an IELTS Writing Task 2 coach using the “IELTS Advantage” essay structure.</Text>
            <View style={{ height: 10 }} />
            <Text style={[styles.sectionTitle, isLight && { color: '#111827' }]}>1) Questions (choose one)</Text>
            {coachQs.map((q, i) => (
              <View key={i} style={[styles.questionCard, isLight && styles.questionCardLight]}>
                <Text style={[styles.questionText, isLight && { color: '#111827' }]}>{i + 1}. {q.text}</Text>
                <View style={styles.tagsRow}>
                  <View style={[styles.tag, styles.tagTopic]}><Text style={styles.tagTxt}>{String(q.topic || 'topic')}</Text></View>
                  <View style={[styles.tag, styles.tagType]}><Text style={styles.tagTxt}>{String(q.type || '').replace('_','/')}</Text></View>
                </View>
                <TouchableOpacity style={styles.writeBtn} onPress={() => { setPrompt(q.text); setShowCoach(false); }}>
                  <Text style={styles.writeBtnTxt}>Write this</Text>
                </TouchableOpacity>
              </View>
            ))}
            <View style={{ height: 8 }} />
            <Text style={[styles.helper, isLight && { color: '#6B7280' }]}>Tap any question to begin writing. You can edit the prompt if needed.</Text>
          </>
        ) : (
          <>
            <Text style={[styles.label, isLight && { color: '#374151' }]}>Prompt</Text>
            <TextInput style={[styles.input, isLight && styles.inputLight, styles.promptBold]} multiline value={prompt} onChangeText={setPrompt} placeholder="Enter or paste the prompt"
              autoCorrect={false} spellCheck={false} autoCapitalize="none" autoComplete="off" keyboardType={Platform.OS === 'android' ? 'visible-password' : 'default'}
            />
            <View style={styles.rowBetween}>
              <Text style={[styles.label, isLight && { color: '#374151' }]}>Your Essay</Text>
              <Text style={[styles.count, isLight && { color: '#6B7280' }]}>{wordCount} words</Text>
            </View>
            {/* Section chips */}
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingVertical: 6 }}>
              {(([ 
                { k: 'intro', t: 'Introduction' },
                { k: 'body1', t: 'Body 1' },
                { k: 'body2', t: 'Body 2' },
                { k: 'conclusion', t: 'Conclusion' },
              ] as const) as { k: 'intro'|'body1'|'body2'|'conclusion'; t: string }[]).map(s => (
                <TouchableOpacity key={s.k}
                  onPress={() => animateToSection(s.k)}
                  style={[styles.sectionChip, isLight && styles.sectionChipLight, currentSection === s.k && styles.sectionChipActive]}
                >
                  <Text style={[styles.sectionChipText, isLight && styles.sectionChipTextLight, currentSection === s.k && styles.sectionChipTextActive]}>{s.t}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
            {/* Active section editor */}
            <Text style={[styles.sectionTitle, isLight && { color: '#111827' }]}>
              {currentSection === 'intro' ? 'Introduction' : currentSection === 'body1' ? 'Body Paragraph 1' : currentSection === 'body2' ? 'Body Paragraph 2' : 'Conclusion'}
            </Text>
            <Animated.View
              onLayout={e => { editorPosYRef.current = e.nativeEvent.layout.y; }}
              style={[
                styles.essayContainer,
                isLight ? styles.essayContainerLight : styles.essayContainerDark,
                { height: editorHeight },
              ]}
              {...panResponder.panHandlers}
            >
              <Animated.View style={{ flex: 1, transform: [{ translateY: sectionSlideY }], opacity: sectionFade }}>
              <TextInput
                style={[styles.essayInput, isLight && styles.essayInputLight]}
                multiline
                value={currentSection === 'intro' ? introText : currentSection === 'body1' ? body1Text : currentSection === 'body2' ? body2Text : conclusionText}
                onChangeText={(v) => {
                if (currentSection === 'intro') setIntroText(v);
                else if (currentSection === 'body1') setBody1Text(v);
                else if (currentSection === 'body2') setBody2Text(v);
                else setConclusionText(v);
              }}
                placeholder={currentSection === 'intro' ? 'Write a concise introduction…' : currentSection === 'body1' ? 'Develop your first main idea…' : currentSection === 'body2' ? 'Develop your second main idea…' : 'Restate and summarise…'}
                onFocus={() => {
                  setExpanded(true);
                  Animated.timing(editorHeight, { toValue: expandedHeight, duration: 220, useNativeDriver: false }).start(() => {
                    setTimeout(() => {
                      const y = Math.max(0, editorPosYRef.current - 12);
                      scrollRef.current?.scrollTo({ y, animated: true });
                    }, 10);
                  });
                }}
                onBlur={() => {
                  setExpanded(false);
                  Animated.timing(editorHeight, { toValue: baseHeight, duration: 200, useNativeDriver: false }).start();
                }}
                textAlignVertical="top"
                autoCorrect={false}
                spellCheck={false}
                autoCapitalize="none"
                autoComplete="off"
                keyboardType={Platform.OS === 'android' ? 'visible-password' : 'default'}
              />
              </Animated.View>
              {/* Down arrow inside editor */}
              <TouchableOpacity
                onPress={() => {
                  const next = currentSection === 'intro' ? 'body1' : currentSection === 'body1' ? 'body2' : currentSection === 'body2' ? 'conclusion' : 'intro';
                  animateToSection(next);
                }}
                accessibilityLabel="Next section"
                hitSlop={{ top: 16, bottom: 16, left: 16, right: 16 }}
                style={styles.editorArrow}
                activeOpacity={0.85}
              >
                <LottieView source={require('../../assets/lottie/white_arrowdown.json')} autoPlay loop style={{ width: 78, height: 78 }} />
              </TouchableOpacity>
            </Animated.View>
            <TouchableOpacity onPress={submit} style={styles.submitBtn} disabled={loading}>
              {loading ? <ActivityIndicator color="#0D3B4A" /> : <Text style={styles.submitText}>Submit for Band</Text>}
            </TouchableOpacity>
            {result && (
              <View style={[styles.resultCard, isLight && styles.resultCardLight]}>
                <Text style={[styles.band, isLight && { color: '#111827' }]}>Band {Number(result.band_estimate).toFixed(1)}</Text>
                <Text style={[styles.subs, isLight && { color: '#374151' }]}>TR {result.subscores?.task_response?.toFixed?.(1)} • Coh {result.subscores?.coherence?.toFixed?.(1)} • Lex {result.subscores?.lexical?.toFixed?.(1)} • Gr {result.subscores?.grammar?.toFixed?.(1)}</Text>
              </View>
            )}
          </>
        )}
        <View style={{ height: 40 }} />
      </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  page: { flex: 1 },
  headerRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  title: { fontSize: 22, fontWeight: '700', color: '#E5E7EB' },
  closeBtn: { padding: 6, paddingHorizontal: 10, borderRadius: 10 },
  closeTxt: { fontSize: 18, color: '#E5E7EB' },
  topicChip: { paddingHorizontal: 12, paddingVertical: 8, borderRadius: 16, borderWidth: 1, borderColor: '#394150', backgroundColor: '#1F2937', marginRight: 8 },
  topicChipLight: { backgroundColor: '#F1F5F9', borderColor: '#E5E7EB' },
  topicChipActive: { backgroundColor: '#CCE2FC', borderColor: '#B3D6FA' },
  topicChipText: { color: '#E5E7EB', fontWeight: '600', textTransform: 'capitalize' },
  topicChipTextLight: { color: '#111827' },
  topicChipTextActive: { color: '#0D3B4A' },
  topicRefresh: { paddingHorizontal: 12, paddingVertical: 8, borderRadius: 16, borderWidth: 1, borderColor: '#93CBD0', backgroundColor: '#B6E0E2' },
  topicRefreshText: { color: '#0D3B4A', fontWeight: '700' },
  coachIntro: { marginTop: 6, color: '#9CA3AF' },
  helper: { marginTop: 6, color: '#9CA3AF' },
  questionItem: { marginTop: 6, color: '#E5E7EB' },
  questionCard: { marginTop: 10, borderRadius: 12, padding: 12, backgroundColor: '#111827', borderWidth: 1, borderColor: '#334155', shadowColor: '#000', shadowOpacity: 0.16, shadowRadius: 6, shadowOffset: { width: 0, height: 3 }, elevation: 4 },
  questionCardLight: { backgroundColor: '#FFFFFF', borderColor: '#E5E7EB' },
  questionText: { color: '#E5E7EB', fontWeight: '600' },
  tagsRow: { flexDirection: 'row', gap: 6, marginTop: 8, marginBottom: 8 },
  tag: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 10, borderWidth: 1 },
  tagTxt: { fontSize: 12, fontWeight: '600', color: '#0D3B4A' },
  tagTopic: { backgroundColor: '#E0F2FE', borderColor: '#BAE6FD' },
  tagType: { backgroundColor: '#FDE68A', borderColor: '#FCD34D' },
  writeBtn: { alignSelf: 'flex-end', paddingHorizontal: 12, paddingVertical: 8, borderRadius: 12, backgroundColor: '#F8B070' },
  writeBtnTxt: { color: '#0D3B4A', fontWeight: '700' },
  modeRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  chip: { paddingHorizontal: 10, paddingVertical: 6, borderRadius: 14, borderWidth: 1, borderColor: '#334', backgroundColor: '#2C2C2C' },
  chipActive: { backgroundColor: '#CCE2FC', borderColor: '#B3D6FA' },
  chipText: { color: '#E5E7EB', fontWeight: '600' },
  chipTextActive: { color: '#0D3B4A' },
  // Section chips (Introduction / Body 1 / Body 2 / Conclusion)
  sectionChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#334155',
    backgroundColor: '#1F2937',
    marginRight: 8,
  },
  sectionChipLight: { backgroundColor: '#F1F5F9', borderColor: '#E5E7EB' },
  sectionChipActive: { backgroundColor: '#CCE2FC', borderColor: '#B3D6FA' },
  sectionChipText: { color: '#E5E7EB', fontWeight: '600' },
  sectionChipTextLight: { color: '#111827' },
  sectionChipTextActive: { color: '#0D3B4A' },
  timerPill: { paddingHorizontal: 10, paddingVertical: 6, borderRadius: 14, backgroundColor: '#B6E0E2', borderWidth: 1, borderColor: '#93CBD0' },
  timerText: { color: '#0D3B4A', fontWeight: '700' },
  timerBtn: { marginLeft: 8, paddingHorizontal: 12, paddingVertical: 6, borderRadius: 14, borderWidth: 1 },
  timerBtnStart: { backgroundColor: '#CCFBE5', borderColor: '#93E1C2' },
  timerBtnStop: { backgroundColor: '#FEE2E2', borderColor: '#FCA5A5' },
  timerBtnText: { color: '#0D3B4A', fontWeight: '700' },
  label: { marginTop: 12, marginBottom: 6, color: '#9CA3AF', fontWeight: '600' },
  input: { minHeight: 48, padding: 12, borderRadius: 10, borderWidth: 1, borderColor: '#333', color: '#E5E7EB', backgroundColor: '#1F2937' },
  inputLight: { backgroundColor: '#FFFFFF', color: '#111827', borderColor: '#E5E7EB' },
  promptBold: { fontWeight: '700' },
  plannerCard: { padding: 12, borderRadius: 10, borderWidth: 1, borderColor: '#333', backgroundColor: '#1F2937', gap: 8 },
  plannerCardLight: { backgroundColor: '#FFFFFF', borderColor: '#E5E7EB' },
  planHeading: { fontWeight: '700', marginBottom: 6, color: '#E5E7EB' },
  planSub: { marginTop: 8, fontWeight: '600', color: '#9CA3AF' },
  planBullet: { marginTop: 4, color: '#9CA3AF' },
  planInput: { minHeight: 44, padding: 10, borderRadius: 8, borderWidth: 1, borderColor: '#394150', color: '#E5E7EB', backgroundColor: '#111827' },
  essay: { minHeight: 220, padding: 12, borderRadius: 10, borderWidth: 1, borderColor: '#333', color: '#E5E7EB', backgroundColor: '#111827' },
  essayExpanded: { minHeight: Dimensions.get('window').height * 0.6, padding: 12, borderRadius: 10, borderWidth: 1, borderColor: '#333', color: '#E5E7EB', backgroundColor: '#111827' },
  essayContainer: { borderRadius: 10, borderWidth: 1, position: 'relative' },
  essayContainerDark: { backgroundColor: '#0F172A', borderColor: '#334155' },
  essayContainerLight: { backgroundColor: '#FFFFFF', borderColor: '#E5E7EB' },
  essayInput: { flex: 1, padding: 12, color: '#E5E7EB', fontSize: 17, lineHeight: 26 },
  essayInputLight: { color: '#111827' },
  // Centered at bottom of editor container; larger tap target, no background
  editorArrow: {
    position: 'absolute',
    bottom: 12,
    left: '50%',
    transform: [{ translateX: -39 }], // half of 78px Lottie size
    padding: 4,
    borderRadius: 12,
    backgroundColor: 'transparent',
  },
  editorArrowLight: { backgroundColor: 'transparent', shadowOpacity: 0, elevation: 0 },
  editorArrowDark: { backgroundColor: 'transparent', shadowOpacity: 0, elevation: 0 },
  essayLight: { backgroundColor: '#FFFFFF', color: '#111827', borderColor: '#E5E7EB' },
  editorPage: { flex: 1, backgroundColor: '#0f172a' },
  editorHeader: { paddingHorizontal: 16, paddingTop: 12, paddingBottom: 8, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  editorTitle: { color: '#E5E7EB', fontWeight: '700', fontSize: 18 },
  editorCount: { color: '#9CA3AF', fontWeight: '700' },
  editorInput: { minHeight: Dimensions.get('window').height * 0.68, borderRadius: 12, borderWidth: 1, borderColor: '#334155', backgroundColor: '#0b1220', color: '#E5E7EB', padding: 12 },
  rowBetween: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  count: { color: '#9CA3AF' },
  submitBtn: { marginTop: 14, backgroundColor: '#F8B070', paddingVertical: 12, borderRadius: 12, alignItems: 'center', alignSelf: 'center', width: '68%' },
  submitText: { color: '#0D3B4A', fontWeight: '700' },
  resultCard: { marginTop: 16, padding: 12, borderRadius: 12, backgroundColor: '#1E293B', borderWidth: 1, borderColor: '#334155' },
  resultCardLight: { backgroundColor: '#FFFFFF', borderColor: '#E5E7EB' },
  band: { fontSize: 24, fontWeight: '800', color: '#F8B070' },
  subs: { marginTop: 4, color: '#9CA3AF' },
  sectionTitle: { marginTop: 8, fontWeight: '700', color: '#E5E7EB' },
  tip: { marginTop: 2, color: '#9CA3AF' },
});

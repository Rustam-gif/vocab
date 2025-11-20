import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  ScrollView,
  Alert,
  ActivityIndicator,
  Platform,
  Animated,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useAppStore } from '../lib/store';
import { aiService } from '../services/AIService';
import { getTheme } from '../lib/theme';
import { buildDictionary, correctTokens, suggestClosest } from '../lib/spell';
import { levels as LEVELS } from './quiz/data/levels';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { ArrowLeft, Camera as CameraIcon } from 'lucide-react-native';
import LottieView from 'lottie-react-native';
import UsageLimitsService from '../services/UsageLimitsService';
import LimitModal from '../lib/LimitModal';

type PickedImage = { uri: string } | null;

export default function ScanWordsScreen() {
  const router = useRouter();
  const themeName = useAppStore(s => s.theme);
  const colors = getTheme(themeName);
  const isLight = themeName === 'light';

  const getFolders = useAppStore(s => s.getFolders);
  const addWord = useAppStore(s => s.addWord);
  const allWords = useAppStore(s => s.words);
  const loadWordsFromStore = useAppStore(s => s.loadWords);

  const [folders, setFolders] = useState(getFolders());
  const [selectedFolderId, setSelectedFolderId] = useState<string | undefined>(folders[0]?.id);
  const [picked, setPicked] = useState<PickedImage>(null);
  const [processing, setProcessing] = useState(false);
  const [words, setWords] = useState<string[]>([]);
  const [selected, setSelected] = useState<Record<string, boolean>>({});
  const [showHint, setShowHint] = useState(false);
  const [showReview, setShowReview] = useState(false);
  const pulse = useRef(new Animated.Value(0)).current;
  const progressAnim = useRef(new Animated.Value(0)).current;
  const [displaySaved, setDisplaySaved] = useState(0);
  const [limitOpen, setLimitOpen] = useState(false);
  const dict = useMemo(() => {
    const curated: string[] = [];
    try {
      for (const L of LEVELS) {
        for (const S of L.sets) {
          const w = (S.words || []).map(x => x.word);
          curated.push(...w);
        }
      }
    } catch {}
    const extras = ['feedback','experience','development','example','definition','vocabulary','language','education','practice','journal','profile','analytics','session','exercise','story','vault'];
    return buildDictionary(curated, extras);
  }, []);

  useEffect(() => {
    (async () => {
      try {
        const seen = await AsyncStorage.getItem('@engniter.scan_hint_v1');
        setShowHint(!seen);
      } catch {
        setShowHint(true);
      }
    })();
  }, []);

  useEffect(() => {
    if (!showHint) return;
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, { toValue: 1, duration: 900, useNativeDriver: true }),
        Animated.timing(pulse, { toValue: 0, duration: 900, useNativeDriver: true }),
      ])
    );
    try { loop.start(); } catch {}
    return () => { try { loop.stop(); } catch {} };
  }, [showHint, pulse]);

  useEffect(() => {
    setFolders(getFolders());
    if (!selectedFolderId && getFolders()[0]) setSelectedFolderId(getFolders()[0].id);
  }, []);

  // Ensure words are loaded so we can compute weekly progress
  useEffect(() => {
    if (!Array.isArray(allWords) || allWords.length === 0) {
      try { loadWordsFromStore(); } catch {}
    }
  }, []);

  // Animate the weekly saved counter
  useEffect(() => {
    const id = progressAnim.addListener(({ value }) => setDisplaySaved(Math.round(value)));
    return () => { try { progressAnim.removeListener(id); } catch {} };
  }, [progressAnim]);

  const ImagePicker = useMemo(() => {
    try { return require('react-native-image-picker'); } catch { return null; }
  }, []);

  const extractWords = (text: string): string[] => {
    // Keep basic Latin words with optional hyphen/apostrophe; drop numbers and short tokens
    const tokens = (text || '')
      .replace(/\r\n/g, '\n')
      .split(/[^A-Za-z'\-]+/)
      .map(t => t.replace(/^['\-]+|['\-]+$/g, ''))
      .filter(t => t.length >= 2)
      .map(t => t.toLowerCase());
    const uniq: string[] = [];
    const seen = new Set<string>();
    for (const t of tokens) {
      if (!seen.has(t)) { seen.add(t); uniq.push(t); }
    }
    return uniq.slice(0, 200);
  };

  const handleCapture = async () => {
    if (!ImagePicker) {
      Alert.alert('Missing dependency', 'Please install react-native-image-picker to use the camera.');
      return;
    }
    try {
      const { launchCamera } = ImagePicker as any;
      const res = await launchCamera({ mediaType: 'photo', cameraType: 'back', includeBase64: false });
      if (res?.assets && res.assets[0]?.uri) {
        setPicked({ uri: res.assets[0].uri });
        setWords([]);
        setSelected({});
      }
    } catch (e) {
      console.warn('launchCamera error', e);
    }
  };

  const handleRecognize = async () => {
    if (!picked) return;
    const gate = await UsageLimitsService.checkAndBump('scan');
    if (!gate.ok) { setLimitOpen(true); return; }
    try {
      setProcessing(true);
      const arr = await aiService.ocrImageWords(picked.uri);
      const uniq: string[] = [];
      const selMap: Record<string, boolean> = {};
      const seen = new Set<string>();
      for (const t of arr) {
        const s = suggestClosest(t, dict);
        if (s) {
          const w = s.word;
          if (!seen.has(w)) { uniq.push(w); selMap[w] = true; seen.add(w); }
        } else {
          if (!seen.has(t)) { uniq.push(t); selMap[t] = false; seen.add(t); }
        }
      }
      setWords(uniq);
      setSelected(selMap);
      // Open the review modal with a nicer design
      setShowReview(true);
    } catch (e) {
      console.warn('AI OCR failed', e);
      Alert.alert('Recognition failed', (e as any)?.message || 'Check your OpenAI key and network connection.');
    } finally {
      setProcessing(false);
    }
  };

  const toggleWord = (w: string) => {
    setSelected(s => ({ ...s, [w]: !s[w] }));
  };

  const handleAdd = async () => {
    const chosen = words.filter(w => selected[w]);
    if (!chosen.length) {
      Alert.alert('No words selected', 'Please select at least one word.');
      return;
    }
    const folderId = selectedFolderId;
    const inDict = new Set(dict);
    let ok = 0, skipped = 0;
    for (const raw of chosen) {
      const w = inDict.has(raw) ? raw : (suggestClosest(raw, dict)?.word || '');
      if (!w) { skipped++; continue; }
      try {
        const res = await addWord({ word: w, definition: 'Definition pending', example: 'Example will be added.', folderId, source: 'scan' });
        if (res) ok++;
      } catch {}
    }
    const msg = skipped ? `Added ${ok} ${ok === 1 ? 'word' : 'words'}. Skipped ${skipped} non-words.` : `Added ${ok} ${ok === 1 ? 'word' : 'words'} to folder.`;
    // Subtle confirmation via improved modal UX
    try { setShowReview(false); } catch {}
    Alert.alert('Saved', msg);
    router.replace('/vault');
  };

  const depsMissing = !ImagePicker;

  // Brand colors requested
  const COLOR_CAMERA = '#EF9797';
  const COLOR_ACTION = '#CCE2FC';

  // Saved this week (last 7 days rolling)
  const weeklySaved = useMemo(() => {
    try {
      const start = new Date();
      start.setHours(0, 0, 0, 0);
      start.setDate(start.getDate() - 6);
      const list = Array.isArray(allWords) ? allWords : [];
      return list.filter((w: any) => w?.source === 'scan' && w?.savedAt && new Date(w.savedAt) >= start).length;
    } catch { return 0; }
  }, [allWords]);

  useEffect(() => {
    try {
      progressAnim.stopAnimation();
      progressAnim.setValue(0);
      Animated.timing(progressAnim, { toValue: weeklySaved, duration: 700, useNativeDriver: false }).start();
    } catch {}
  }, [weeklySaved]);

  return (
    <SafeAreaView style={[styles.container, isLight && { backgroundColor: colors.background }]}>
      <View style={[styles.header, isLight && styles.headerLight]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <ArrowLeft size={22} color={isLight ? '#111827' : '#FFFFFF'} />
        </TouchableOpacity>
        <Text style={[styles.title, isLight && { color: '#111827' }]}>Scan Words</Text>
        <View style={{ width: 48 }} />
      </View>

      {(!ImagePicker) && (
        <View style={[styles.notice, isLight && styles.noticeLight]}>
          <Text style={[styles.noticeText, isLight && { color: '#111827' }]}>Camera package not installed.</Text>
          <Text style={[styles.noticeSub, isLight && { color: '#4B5563' }]}>Run these in your project:</Text>
          <Text style={[styles.codeLine]}>npm i react-native-image-picker</Text>
          <Text style={[styles.codeLine]}>cd ios && pod install</Text>
          <Text style={[styles.noticeSub, { marginTop: 6 }, isLight && { color: '#4B5563' }]}>Then rebuild the app.</Text>
        </View>
      )}

      <LimitModal
        visible={limitOpen}
        message={'You reached today\'s free scan limit. Subscribe to scan unlimited images.'}
        onClose={() => setLimitOpen(false)}
        onSubscribe={() => { setLimitOpen(false); try { router.push('/profile?paywall=1'); } catch {} }}
        primaryText="Subscribe"
        secondaryText="Not now"
      />

      

      <ScrollView contentContainerStyle={{ paddingTop: 20, paddingBottom: 20, paddingHorizontal: 20 }} style={{ flex: 1 }}>
        {/* Folder selector */}
        <View style={{ paddingHorizontal: 0, paddingTop: 8 }}>
          <Text style={[styles.sectionLabel, isLight && { color: '#6B7280' }]}>Save to folder</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginTop: 8 }}>
            {folders.map(f => {
              const active = selectedFolderId === f.id;
              return (
                <TouchableOpacity
                  key={f.id}
                  onPress={() => setSelectedFolderId(f.id)}
                  style={[styles.folderChipBase, active ? styles.folderChipActiveNew : styles.folderChipInactive]}
                >
                  <Text style={active ? styles.folderChipTextActive : styles.folderChipTextInactive}>{f.title}</Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </View>

        {/* Capture / preview */}
        <View style={{ paddingHorizontal: 0, marginTop: 8 }}>
          {!picked ? (
            <View style={{ alignItems: 'center' }}>
              <LottieView
                source={require('../assets/lottie/OCR_Scan.json')}
                autoPlay
                loop
                style={{ width: 220, height: 220 }}
              />
              <TouchableOpacity
                style={[styles.captureBtn, depsMissing && { opacity: 0.6 }, { alignSelf: 'center', width: '86%', marginTop: 16 }]}
                onPress={async () => {
                  if (showHint) {
                    try { await AsyncStorage.setItem('@engniter.scan_hint_v1', '1'); } catch {}
                    setShowHint(false);
                  }
                  handleCapture();
                }}
                disabled={!ImagePicker}
              >
                <View style={styles.captureInner}>
                  <CameraIcon size={18} color="#fff" />
                  <Text style={styles.captureText}>Open Camera</Text>
                </View>
              </TouchableOpacity>
              <Text style={[styles.tipTextSmall, isLight && { color: '#6B7280' }]}>Tip: Fill the frame, good lighting, one column of words.</Text>
            </View>
          ) : (
            <View>
              <Image source={{ uri: picked.uri }} style={styles.preview} resizeMode="cover" />
              <View style={{ flexDirection: 'row', gap: 12, marginTop: 10, flexWrap: 'wrap' }}>
                <TouchableOpacity style={styles.secondaryBtn} onPress={() => setPicked(null)}>
                  <Text style={styles.secondaryText}>Retake</Text>
                </TouchableOpacity>
                <TouchableOpacity style={[styles.aiBtn, processing && { opacity: 0.7 }]} onPress={handleRecognize} disabled={processing}>
                  {processing ? <ActivityIndicator color="#fff" /> : <Text style={styles.primaryText}>Recognize</Text>}
                </TouchableOpacity>
              </View>
            </View>
          )}
        </View>

        {/* Recognized words */}
        {words.length > 0 && (
          <View style={{ paddingHorizontal: 16, marginTop: 20 }}>
            <Text style={[styles.sectionLabel, isLight && { color: '#6B7280' }]}>Tap to toggle selection</Text>
            <View style={styles.wordsWrap}>
              {words.map(w => (
                <TouchableOpacity key={w} onPress={() => toggleWord(w)} style={[styles.wordPill, selected[w] ? styles.wordPillOn : styles.wordPillOff]}>
                  <Text style={[styles.wordText, selected[w] ? styles.wordTextOn : styles.wordTextOff]}>{w}</Text>
                </TouchableOpacity>
              ))}
            </View>
            <TouchableOpacity style={[styles.primaryBtn, { marginTop: 12 }]} onPress={handleAdd}>
              <Text style={styles.primaryText}>Add Selected to Folder</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Weekly progress motivation — kept at the bottom */}
        <View style={styles.progressCard}>
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <LottieView source={require('../assets/lottie/flame.json')} autoPlay loop style={{ width: 42, height: 42 }} />
            <View style={{ marginLeft: 10, flex: 1 }}>
              <Text style={styles.progressTitle}>Progress / streak</Text>
              <Text style={styles.progressSub}>You’ve saved <Text style={styles.progressCount}>{displaySaved}</Text> words this week</Text>
            </View>
          </View>
        </View>
      </ScrollView>

      {/* Review modal */}
      {showReview && (
        <View style={styles.reviewOverlay}>
          <View style={[styles.reviewCard, isLight && styles.reviewCardLight]}>
            <LottieView source={require('../assets/lottie/Check.json')} autoPlay loop={false} style={{ width: 72, height: 72, marginBottom: 4 }} />
            <Text style={[styles.reviewTitle, isLight && { color: '#111827' }]}>Review recognized words</Text>
            <Text style={[styles.reviewSub, isLight && { color: '#4B5563' }]}>
              {words.filter(w => selected[w]).length} selected out of {words.length}
            </Text>

            {/* Folder quick select inside modal */}
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginTop: 10 }}>
              {folders.map(f => {
                const active = selectedFolderId === f.id;
                return (
                  <TouchableOpacity
                    key={f.id}
                    onPress={() => setSelectedFolderId(f.id)}
                    style={[styles.folderChipBase, active ? styles.folderChipActiveNew : styles.folderChipInactive]}
                  >
                    <Text style={active ? styles.folderChipTextActive : styles.folderChipTextInactive}>{f.title}</Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>

            {/* Word grid */}
            <ScrollView style={styles.reviewList} contentContainerStyle={{ paddingVertical: 6 }} showsVerticalScrollIndicator={true}>
              <View style={[styles.wordsWrap, { paddingRight: 4 }]}>
                {words.map(w => (
                  <TouchableOpacity key={w} onPress={() => toggleWord(w)} style={[styles.wordPillLg, selected[w] ? styles.wordPillOnLg : styles.wordPillOffLg]}>
                    <Text style={[styles.wordTextLg, selected[w] ? styles.wordTextOn : styles.wordTextOff]}>{w}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </ScrollView>

            {/* Actions row */}
            <View style={styles.actionsRow}>
              <TouchableOpacity
                onPress={() => {
                  // select all
                  const all: Record<string, boolean> = {};
                  for (const w of words) all[w] = true;
                  setSelected(all);
                }}
                style={[styles.actionChip]}
              >
                <Text style={styles.actionChipText}>Select all</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => {
                  // unselect all
                  const none: Record<string, boolean> = {};
                  for (const w of words) none[w] = false;
                  setSelected(none);
                }}
                style={[styles.actionChip]}
              >
                <Text style={styles.actionChipText}>Unselect all</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.ctaRow}>
              <TouchableOpacity style={[styles.secondaryBtn, { flex: 1 }]} onPress={() => setShowReview(false)}>
                <Text style={styles.secondaryText}>Cancel</Text>
              </TouchableOpacity>
              <View style={{ width: 10 }} />
              <TouchableOpacity style={[styles.primaryBtn, { flex: 1 }]} onPress={handleAdd}>
                <Text style={styles.primaryText}>Save selected</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      )}
      {/* Guided hint overlay */}
      {showHint && !picked && (
        <View pointerEvents="auto" style={styles.hintOverlay}>
          <View style={styles.hintCard}>
            <Text style={[styles.hintTitle, isLight && { color: '#111827' }]}>How to use</Text>
            <Text style={[styles.hintLine, isLight && { color: '#374151' }]}>1. Tap “Open Camera”.</Text>
            <Text style={[styles.hintLine, isLight && { color: '#374151' }]}>2. Point at your copybook page.</Text>
            <Text style={[styles.hintLine, isLight && { color: '#374151' }]}>3. Capture, then press “Recognize”.</Text>
            <Text style={[styles.hintLine, isLight && { color: '#374151' }]}>4. Deselect any wrong words and save.</Text>
            <TouchableOpacity
              style={[styles.hintBtn]}
              onPress={async () => { try { await AsyncStorage.setItem('@engniter.scan_hint_v1', '1'); } catch {}; setShowHint(false); }}
            >
              <Text style={styles.hintBtnText}>Got it</Text>
            </TouchableOpacity>
          </View>
          {/* Pulsing spotlight near the capture button area */}
          <Animated.View
            pointerEvents="none"
            style={{
              position: 'absolute',
              left: 24,
              right: 24,
              bottom: 160,
              alignItems: 'center',
              opacity: pulse.interpolate({ inputRange: [0,1], outputRange: [0.3, 1] }),
              transform: [{ scale: pulse.interpolate({ inputRange: [0,1], outputRange: [0.95, 1.05] }) }],
            }}
          >
            <View style={styles.spotlight} />
          </Animated.View>
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#1E1E1E' },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 12, paddingVertical: 10 },
  headerLight: { backgroundColor: '#FFFFFF' },
  backBtn: { padding: 8, width: 48, alignItems: 'flex-start', justifyContent: 'center' },
  title: { fontSize: 18, fontWeight: '700', color: '#FFFFFF' },
  notice: { margin: 12, padding: 12, backgroundColor: '#2C2C2C', borderRadius: 10 },
  noticeLight: { backgroundColor: '#F3F4F6' },
  noticeText: { color: '#FFFFFF', fontWeight: '700', marginBottom: 4 },
  noticeSub: { color: '#a0a0a0' },
  codeLine: { fontFamily: Platform.select({ ios: 'Menlo', android: 'monospace' }), fontSize: 12, color: '#22d3ee' },
  sectionLabel: { fontSize: 12, fontWeight: '700', color: '#9CA3AF', textTransform: 'uppercase', letterSpacing: 0.4 },
  folderChip: { backgroundColor: '#3A3A3A', paddingHorizontal: 12, paddingVertical: 8, borderRadius: 16, marginRight: 8 },
  folderChipLight: { backgroundColor: '#E9E6E0', borderWidth: StyleSheet.hairlineWidth, borderColor: '#D7D3CB' },
  folderChipActive: { borderWidth: 1, borderColor: '#0D3B4A' },
  folderChipText: { color: '#fff', fontWeight: '700' },
  folderChipTextLight: { color: '#111827' },
  // New unified pill styles
  folderChipBase: { height: 36, paddingHorizontal: 14, borderRadius: 18, justifyContent: 'center', marginRight: 8 },
  folderChipInactive: { backgroundColor: '#E5E7EB' },
  folderChipActiveNew: { backgroundColor: '#CCE2FC' },
  folderChipTextActive: { color: '#0D3B4A', fontWeight: '800' },
  folderChipTextInactive: { color: '#374151', fontWeight: '700' },
  captureBtn: { backgroundColor: '#EF9797', paddingVertical: 14, borderRadius: 12, alignItems: 'center' },
  captureInner: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  captureText: { color: '#fff', fontWeight: '700' },
  preview: { width: '100%', height: 280, borderRadius: 12, backgroundColor: '#111' },
  secondaryBtn: { backgroundColor: '#3A3A3A', paddingVertical: 10, paddingHorizontal: 14, borderRadius: 10 },
  secondaryText: { color: '#fff', fontWeight: '600' },
  primaryBtn: { backgroundColor: '#CCE2FC', paddingVertical: 12, paddingHorizontal: 14, borderRadius: 10, alignItems: 'center' },
  primaryText: { color: '#fff', fontWeight: '700' },
  aiBtn: { backgroundColor: '#CCE2FC', paddingVertical: 12, paddingHorizontal: 14, borderRadius: 10, alignItems: 'center' },
  wordsWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 10 },
  wordPill: { paddingHorizontal: 10, paddingVertical: 6, borderRadius: 14 },
  wordPillOn: { backgroundColor: '#DCFCE7' },
  wordPillOff: { backgroundColor: '#E5E7EB' },
  wordText: { fontWeight: '700' },
  wordTextOn: { color: '#166534' },
  wordTextOff: { color: '#374151' },
  hintOverlay: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.35)', justifyContent: 'center', alignItems: 'center', padding: 16 },
  hintCard: { width: '90%', maxWidth: 420, borderRadius: 14, padding: 16, backgroundColor: '#FFFFFF' },
  hintTitle: { fontSize: 18, fontWeight: '800', color: '#111827', marginBottom: 8 },
  hintLine: { fontSize: 14, color: '#374151', marginVertical: 2 },
  hintBtn: { marginTop: 12, backgroundColor: '#111827', borderRadius: 10, paddingVertical: 10, alignItems: 'center' },
  hintBtnText: { color: '#FFFFFF', fontWeight: '700' },
  spotlight: { width: 160, height: 46, borderRadius: 12, borderWidth: 2, borderColor: '#EF9797', backgroundColor: 'rgba(239,151,151,0.15)' },
  tipText: { marginTop: 6, fontSize: 12, color: '#9CA3AF' },
  tipTextSmall: { marginTop: 8, fontSize: 11, color: '#9CA3AF' },
  // Progress card styles
  progressCard: { marginTop: 14, borderRadius: 14, padding: 12, backgroundColor: 'rgba(255,255,255,0.06)' },
  progressTitle: { color: '#E5E7EB', fontWeight: '800', fontSize: 14 },
  progressSub: { color: '#9CA3AF', marginTop: 2 },
  progressCount: { color: '#F8B070', fontWeight: '900' },
  // Review modal styles
  reviewOverlay: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.45)', justifyContent: 'center', alignItems: 'center', padding: 16 },
  reviewCard: { width: '92%', maxWidth: 520, borderRadius: 16, backgroundColor: '#1E1E1E', padding: 16, shadowColor: '#000', shadowOpacity: 0.3, shadowRadius: 12, shadowOffset: { width: 0, height: 8 }, elevation: 12 },
  reviewCardLight: { backgroundColor: '#FFFFFF', borderWidth: StyleSheet.hairlineWidth, borderColor: '#E5E7EB' },
  reviewTitle: { fontSize: 18, fontWeight: '800', color: '#FFFFFF', textAlign: 'center' },
  reviewSub: { fontSize: 13, color: '#9CA3AF', textAlign: 'center', marginTop: 2 },
  reviewList: { maxHeight: 260, marginTop: 10, borderRadius: 12, backgroundColor: 'rgba(255,255,255,0.04)' },
  wordsWrapModal: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  wordPillLg: { paddingHorizontal: 12, paddingVertical: 8, borderRadius: 16, marginRight: 8, marginBottom: 8 },
  wordPillOnLg: { backgroundColor: '#DCFCE7' },
  wordPillOffLg: { backgroundColor: '#E5E7EB' },
  wordTextLg: { fontWeight: '700', fontSize: 14 },
  actionsRow: { flexDirection: 'row', justifyContent: 'flex-end', gap: 10, marginTop: 10 },
  actionChip: { backgroundColor: '#2C2C2C', paddingHorizontal: 10, paddingVertical: 8, borderRadius: 12 },
  actionChipText: { color: '#E5E7EB', fontWeight: '700' },
  ctaRow: { flexDirection: 'row', marginTop: 12 },
});

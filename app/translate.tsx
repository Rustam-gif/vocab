import React, { useEffect, useMemo, useRef, useState } from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import { View, Text, StyleSheet, TouchableOpacity, TextInput, ScrollView, ActivityIndicator, Platform, KeyboardAvoidingView } from 'react-native';
// Removed keyboard accessory to let iOS render native keyboard edge
import { useRouter } from 'expo-router';
import { useAppStore } from '../lib/store';
import { getTheme } from '../lib/theme';
import { Repeat2, Plus, CheckCircle2, FolderOpen } from 'lucide-react-native';
import { TranslationService } from '../services/TranslationService';
import { LANGUAGES_WITH_FLAGS } from '../lib/languages';
import AsyncStorage from '@react-native-async-storage/async-storage';
import UsageLimitsService from '../services/UsageLimitsService';
import LimitModal from '../lib/LimitModal';

type HistoryItem = { id?: string; word: string; lang: string; translation: string; saved: boolean; when: number };
const HISTORY_KEY = '@engniter.translate.history.v1';

export default function TranslateScreen(props?: { preview?: boolean }) {
  const isPreview = !!(props as any)?.preview;
  const router = useRouter();
  const themeName = useAppStore(s => s.theme);
  const colors = getTheme(themeName);
  const isLight = themeName === 'light';

  const addWord = useAppStore(s => s.addWord);
  const getFolders = useAppStore(s => s.getFolders);
  const createFolder = useAppStore(s => s.createFolder);
  const storedLangPref = useAppStore(s => s.languagePreferences);
  const [word, setWord] = useState('');
  const [lang, setLang] = useState(storedLangPref?.[0] || 'ru');

  // Load language from AsyncStorage directly on mount (backup for delayed store init)
  useEffect(() => {
    (async () => {
      try {
        const raw = await AsyncStorage.getItem('@engniter.langs');
        const langs = raw ? JSON.parse(raw) : [];
        if (langs[0] && langs[0] !== lang) {
          setLang(langs[0]);
        }
      } catch {}
    })();
  }, []);

  // Sync language when store preferences load/change
  useEffect(() => {
    if (storedLangPref?.[0] && storedLangPref[0] !== lang) {
      setLang(storedLangPref[0]);
    }
  }, [storedLangPref]);
  const [reverse, setReverse] = useState(false); // false: EN -> lang, true: lang -> EN
  const [showLangModal, setShowLangModal] = useState(false);
  const [langSearch, setLangSearch] = useState('');
  const langs = useMemo(() => LANGUAGES_WITH_FLAGS, []);
  const filteredLangs = useMemo(() => langs.filter(l => (l.name + l.code).toLowerCase().includes(langSearch.toLowerCase())), [langs, langSearch]);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{
    translation: string;
    synonyms?: string[];
    example?: string;
    examples?: string[]; // target-language examples
    examplesEn?: string[]; // English examples
  } | null>(null);
  const [saved, setSaved] = useState(false);
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [historyLimit, setHistoryLimit] = useState(5); // show 5 initially, up to 15
  const langSearchRef = useRef<TextInput>(null);
  const [showAllExamples, setShowAllExamples] = useState(false);
  const [lastQuery, setLastQuery] = useState('');
  const [limitOpen, setLimitOpen] = useState<{ visible: boolean; msg: string }>({ visible: false, msg: '' });

  // Ensure bottom-sheet can be dragged to close immediately when content is at top
  useEffect(() => {
    try {
      (globalThis as any).__SHEET_MAIN_Y = 0;
      (globalThis as any).__SHEET_RECENT_Y = 0;
      (globalThis as any).__SHEET_AT_TOP = true;
    } catch {}
  }, []);

  useEffect(() => {
    if (isPreview) return;
    (async () => {
      try {
        const raw = await AsyncStorage.getItem(HISTORY_KEY);
        setHistory(raw ? JSON.parse(raw) : []);
      } catch {}
    })();
  }, []);

  // Focus language search when modal opens
  useEffect(() => {
    if (isPreview) return;
    if (showLangModal) {
      const id = setTimeout(() => langSearchRef.current?.focus(), 80);
      return () => clearTimeout(id);
    }
  }, [showLangModal]);


  const doTranslate = async () => {
    if (isPreview) return;
    const w = word.trim();
    if (!w) return;
    const gate = await UsageLimitsService.checkAndBump('translate');
    if (!gate.ok) {
      const msg = gate.reason === 'daysCap'
        ? 'Free plan allows translations on 3 separate days. Subscribe to unlock unlimited daily translations.'
        : 'You reached today\'s free translation limit. Subscribe to get unlimited translations.';
      setLimitOpen({ visible: true, msg });
      return;
    }
    setLoading(true);
    setSaved(false);
    try {
      const t = reverse ? await TranslationService.translateToEnglish(w, lang) : await TranslationService.translate(w, lang);
      if (!t) { setResult(null); return; }
      setResult({ translation: t.translation, synonyms: t.synonyms, example: t.example, examples: t.examples, examplesEn: (t as any).examplesEn });
      setLastQuery(w);
      setShowAllExamples(false);
      // Auto-save to a dedicated "Translated Words" folder
      const folders = getFolders();
      const translatedTitle = 'Translated Words';
      let translatedFolderId = folders.find(f => f.id === 'folder-translated-default')?.id
        || folders.find(f => /translated\s+words/i.test(f.title))?.id;
      if (!translatedFolderId) {
        try {
          const created = await createFolder(translatedTitle);
          translatedFolderId = created?.id || folders[0]?.id;
        } catch {
          translatedFolderId = folders[0]?.id;
        }
      }
      try {
        const savedWord = await addWord({ word: w, definition: t.translation, example: t.example || '—', folderId: translatedFolderId, source: 'translate' } as any);
        setSaved(!!savedWord);
        const h: HistoryItem = { id: (savedWord as any)?.id, word: w, lang, translation: t.translation, saved: !!savedWord, when: Date.now() };
        const next = [h, ...history].slice(0, 20);
        setHistory(next);
        await AsyncStorage.setItem(HISTORY_KEY, JSON.stringify(next));
      } catch {
        // if saving fails, still record history (unsaved)
        const h: HistoryItem = { word: w, lang, translation: t.translation, saved: false, when: Date.now() };
        const next = [h, ...history].slice(0, 20);
        setHistory(next);
        await AsyncStorage.setItem(HISTORY_KEY, JSON.stringify(next));
      }
    } finally {
      setLoading(false);
    }
  };

  const formattedLang = useMemo(() => lang.toUpperCase(), [lang]);

  // Fullscreen screen — no sheet gestures

  return (
    <SafeAreaView style={[styles.page, isLight && styles.pageLight]}>
      <View style={[styles.header, isLight && styles.headerLight]}>
        <View style={{ width: 44 }} />
        <View style={[styles.titleWrap, { flex: 1, alignItems: 'center' }]}>
          <Text style={[styles.title, isLight && styles.titleLight]}>Translate & Save</Text>
          <Text style={[styles.subtitle, isLight && styles.subtitleLight]}>Instant translation → auto-saved to your Vault</Text>
        </View>
        <View style={{ width: 44 }} />
      </View>

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ padding: 16, paddingTop: 0 }}
        keyboardShouldPersistTaps="handled"
        onScroll={(e) => {
          try {
            const y = e.nativeEvent.contentOffset?.y || 0;
            const g: any = globalThis as any;
            g.__SHEET_MAIN_Y = y;
            const my = g.__SHEET_MAIN_Y || 0;
            const ry = g.__SHEET_RECENT_Y || 0;
            g.__SHEET_AT_TOP = (my <= 0.5) && (ry <= 0.5);
          } catch {}
        }}
        scrollEventThrottle={16}
      >
        {/* Input area */}
        <View style={[styles.card, isLight && styles.cardLight]}>
          <View style={styles.row}>
            <TextInput
              style={[styles.input, isLight && styles.inputLight]}
              placeholder={reverse ? `Type a word in ${langs.find(l => l.code === lang)?.name || lang.toUpperCase()}…` : 'Type a word in English…'}
              placeholderTextColor={isLight ? '#9CA3AF' : '#667'}
              value={word}
              onChangeText={setWord}
              autoCapitalize="none"
              autoCorrect={false}
              spellCheck={false}
              keyboardAppearance={isLight ? 'light' : 'dark'}
              editable={!isPreview}
            />
          </View>
          <View style={[styles.row, { marginTop: 8, justifyContent: 'space-between' }]}>
            <View style={[styles.row, { gap: 8 }]}>
              <TouchableOpacity
                style={[styles.swap, isLight && styles.swapLight]}
                onPress={() => setShowLangModal(true)}
              >
                <Text style={[styles.swapTxt, isLight && { color: '#0D3B4A' }]}>{reverse ? `${formattedLang} ⇄ EN` : `EN ⇄ ${formattedLang}`}</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={{ paddingHorizontal: 10, paddingVertical: 8, borderRadius: 10, borderWidth: 1, borderColor: isLight ? '#E5E7EB' : 'rgba(255,255,255,0.12)' }}
                onPress={() => setReverse(r => !r)}
                accessibilityLabel="Swap direction"
              >
                <Repeat2 size={16} color={isLight ? '#0D3B4A' : '#B6E0E2'} />
              </TouchableOpacity>
            </View>
            <TouchableOpacity style={styles.translateBtn} onPress={doTranslate} disabled={loading || !word.trim()}>
              {loading ? <ActivityIndicator color="#0D3B4A" /> : <Text style={styles.translateBtnTxt}>Translate</Text>}
            </TouchableOpacity>
          </View>
        </View>

        {/* Result */}
        {!isPreview && result && (
          <View style={[styles.resultCard, isLight && styles.resultCardLight]}>
            <Text style={[styles.bigWord, isLight && { color: '#111827' }]}>{result.translation}</Text>
            {/* Synonyms */}
            {Array.isArray(result.synonyms) && result.synonyms.length > 0 && (
              <View style={styles.synonymsContainer}>
                <Text style={[styles.synonymsLabel, isLight && { color: '#6B7280' }]}>Synonyms</Text>
                <View style={styles.synonymsWrap}>
                  {result.synonyms.slice(0, 6).map((syn, idx) => (
                    <View key={idx} style={[styles.synonymChip, isLight && styles.synonymChipLight]}>
                      <Text style={[styles.synonymText, isLight && { color: '#374151' }]}>{syn}</Text>
                    </View>
                  ))}
                </View>
              </View>
            )}
            {/* Examples list (up to 3). Fallback to single example if provided. */}
            {/* Bilingual examples */}
            {(Array.isArray(result.examples) && result.examples.length > 0) || (Array.isArray(result.examplesEn) && result.examplesEn.length > 0) ? (
              <View style={{ marginTop: 12 }}>
                <Text style={[styles.examplesHeader, isLight && styles.examplesHeaderLight]}>Usage examples</Text>
                {(() => {
                  const total = Math.max(result.examples?.length || 0, result.examplesEn?.length || 0, 0);
                  const count = showAllExamples ? total : Math.min(2, total);
                  const renderHighlighted = (text: string, term: string) => {
                    const safe = term?.toString?.() || '';
                    if (!text || !safe) {
                      return <Text style={[styles.example, isLight && { color: '#374151' }]}>{text}</Text>;
                    }
                    const esc = safe.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
                    const boundary = new RegExp(`(\\b${esc}\\b)`, 'ig');
                    const hasBoundary = (String(text).match(boundary) || []).length > 0;
                    const regex = hasBoundary ? boundary : new RegExp(`(${esc})`, 'ig');
                    const parts = String(text).split(regex);
                    return (
                      <Text style={[styles.example, isLight && { color: '#374151' }]}>
                        {parts.map((p, i) => (
                          i % 2 === 1 ? (
                            <Text key={i} style={[styles.exampleBold, isLight && styles.exampleBoldLight]}>{p}</Text>
                          ) : (
                            <Text key={i}>{p}</Text>
                          )
                        ))}
                      </Text>
                    );
                  };
                  return (
                    <>
                      {Array.from({ length: count }).map((_, idx) => {
                        const enLine = result.examplesEn?.[idx] || '';
                        const tgLine = result.examples?.[idx] || '';
                        return (
                          <View key={idx} style={[styles.exampleBlock, idx === 0 ? { marginTop: 0 } : null]}>
                            {/* Label removed per UX: avoid irrelevant contexts */}
                            {!!enLine && (
                              <View style={[styles.exampleRow, { marginTop: 6 }]}>
                                <Text style={[styles.exampleTag, isLight && styles.exampleTagLight]}>EN</Text>
                                {renderHighlighted(enLine, lastQuery)}
                              </View>
                            )}
                            {!!tgLine && (
                              <View style={[styles.exampleRow, { marginTop: 4 }]}>
                                <Text style={[styles.exampleTag, isLight && styles.exampleTagLight]}>{formattedLang}</Text>
                                {renderHighlighted(tgLine, result.translation)}
                              </View>
                            )}
                          </View>
                        );
                      })}
                      {total > 2 && !showAllExamples && (
                        <TouchableOpacity style={styles.showMoreBtn} onPress={() => setShowAllExamples(true)}>
                          <Text style={[styles.showMoreTxt, isLight && styles.showMoreTxtLight]}>Show 1 more example</Text>
                        </TouchableOpacity>
                      )}
                      {total > 2 && showAllExamples && (
                        <TouchableOpacity style={styles.showMoreBtn} onPress={() => setShowAllExamples(false)}>
                          <Text style={[styles.showMoreTxt, isLight && styles.showMoreTxtLight]}>Show fewer</Text>
                        </TouchableOpacity>
                      )}
                    </>
                  );
                })()}
              </View>
            ) : (
              !!result.example && <Text style={[styles.example, isLight && { color: '#374151' }]}>“{result.example}”</Text>
            )}
            <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 12 }}>
              {saved ? (
                <>
                  <CheckCircle2 size={18} color={isLight ? '#16a34a' : '#34d399'} />
                  <Text style={[styles.savedLine, isLight && { color: '#16a34a' }]}>  Saved to Vault</Text>
                </>
              ) : (
                <>
                  <Plus size={18} color={isLight ? '#0D3B4A' : '#B6E0E2'} />
                  <Text style={[styles.savedLine, isLight && { color: '#0D3B4A' }]}>  Add to Vault</Text>
                </>
              )}
            </View>
            <TouchableOpacity
              style={[styles.practiceBtn, isLight && styles.practiceBtnLight]}
              onPress={async () => {
                try {
                  const folders = getFolders();
                  const translated = folders.find(f => f.id === 'folder-translated-default') || folders.find(f => /translated\s+words/i.test(f.title));
                  let targetId = translated?.id;
                  let title = translated?.title;
                  if (!targetId) {
                    const created = await createFolder('Translated Words');
                    targetId = created?.id || folders[0]?.id;
                    title = created?.title || 'Translated Words';
                  }
                  if (targetId) router.push({ pathname: '/vault-folder', params: { id: targetId, title: title || 'Translated Words' } });
                  else router.push('/vault');
                } catch {
                  router.push('/vault');
                }
              }}
              accessibilityLabel="View Saved Translations"
            >
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                <FolderOpen size={18} color={isLight ? '#0D3B4A' : '#0D3B4A'} />
                <Text style={[styles.practiceTxt, isLight && { color: '#0D3B4A' }]}>View Saved Translations</Text>
              </View>
            </TouchableOpacity>
          </View>
        )}

        {/* Recent translations */}
        {!isPreview && history.length > 0 && (
          <View style={{ marginTop: 12 }}>
            <Text style={[styles.historyTitle, isLight && { color: '#111827' }]}>Recent</Text>
            <ScrollView
              style={{ maxHeight: 360 }}
              nestedScrollEnabled
              keyboardShouldPersistTaps="handled"
              onScroll={(e) => {
                try {
                  const y = e.nativeEvent.contentOffset?.y || 0;
                  const g: any = globalThis as any;
                  g.__SHEET_RECENT_Y = y;
                  const my = g.__SHEET_MAIN_Y || 0;
                  const ry = g.__SHEET_RECENT_Y || 0;
                  g.__SHEET_AT_TOP = (my <= 0.5) && (ry <= 0.5);
                } catch {}
              }}
              scrollEventThrottle={16}
            >
              {history.map((h, i) => (
                <View
                  key={`${h.word}-${h.when}-${i}`}
                  style={[styles.historyRow, isLight && styles.historyRowLight]}
                >
                  <Text style={[styles.historyText, isLight && { color: '#111827' }]}>
                    {new Date(h.when).toLocaleDateString()} – {h.word} → {h.translation} {h.saved ? '• added' : ''}
                  </Text>
                </View>
              ))}
            </ScrollView>
          </View>
        )}
      </ScrollView>

      <LimitModal
        visible={limitOpen.visible}
        message={limitOpen.msg}
        onClose={() => setLimitOpen({ visible: false, msg: '' })}
        onSubscribe={() => { setLimitOpen({ visible: false, msg: '' }); try { router.push('/profile?paywall=1'); } catch {} }}
        primaryText="Subscribe"
        secondaryText="Not now"
      />

      {/* Language picker modal */}
      {showLangModal && (
        <View style={styles.modalOverlay}>
          <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ width: '100%', alignItems: 'center' }}>
          <View style={[styles.langModalCard, isLight && styles.langModalCardLight]}>
            <Text style={[styles.modalTitleSmall, isLight && { color: '#111827' }]}>Choose Language</Text>
            <View style={[styles.langSearchBox, isLight && styles.langSearchBoxLight]}>
              <TextInput
                ref={langSearchRef}
                placeholder="Search e.g., Spanish, es"
                placeholderTextColor={isLight ? '#9CA3AF' : '#a0a0a0'}
                value={langSearch}
                onChangeText={setLangSearch}
                style={[styles.langSearchInput, isLight && { color: '#111827' }]}
                autoFocus
                returnKeyType="done"
                autoCorrect={false}
                spellCheck={false}
                autoCapitalize="none"
                autoComplete="off"
                clearButtonMode="while-editing"
              />
            </View>
            <ScrollView style={{ maxHeight: 260, marginTop: 8 }} keyboardShouldPersistTaps="handled" keyboardDismissMode="on-drag">
              {filteredLangs.map(l => (
                <TouchableOpacity
                  key={l.code}
                  style={[styles.langRow, isLight ? styles.langRowLight : styles.langRowDark]}
                  onPress={async () => {
                    setLang(l.code);
                    setShowLangModal(false);
                    try { await useAppStore.getState().setLanguagePreferences([l.code]); } catch {}
                  }}
                >
                  <Text style={isLight ? { color: '#111827' } : { color: '#E5E7EB' }}>{l.flag} {l.name} ({l.code.toUpperCase()})</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
            <TouchableOpacity onPress={() => setShowLangModal(false)} style={styles.modalDoneBtn}>
              <Text style={styles.modalDoneTxt}>Done</Text>
            </TouchableOpacity>
          </View>
          </KeyboardAvoidingView>
        </View>
      )}
      {/* No sheet overlay */}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  page: { flex: 1, backgroundColor: '#1E1E1E' },
  pageLight: { backgroundColor: '#FFFFFF' },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingTop: 0, paddingBottom: 6 },
  headerLight: {},
  titleWrap: { marginTop: 0 },
  backBtn: { padding: 8 },
  flipBtn: { padding: 8, alignItems: 'center', justifyContent: 'center' },
  title: { color: '#E5E7EB', fontWeight: '800', fontSize: 18 },
  titleLight: { color: '#111827' },
  subtitle: { color: '#9CA3AF', fontSize: 12 },
  subtitleLight: { color: '#6B7280' },
  card: { backgroundColor: '#2A2A2A', borderRadius: 14, padding: 12 },
  cardLight: { backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: '#E5E7EB' },
  row: { flexDirection: 'row', alignItems: 'center' },
  input: { flex: 1, backgroundColor: 'rgba(255,255,255,0.06)', borderRadius: 10, paddingHorizontal: 12, paddingVertical: 10, color: '#E5E7EB' },
  inputLight: { backgroundColor: '#FFFFFF', color: '#111827' },
  swap: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 10, paddingVertical: 8, borderRadius: 12, backgroundColor: 'rgba(182,224,226,0.15)', borderWidth: 1, borderColor: 'rgba(13,59,74,0.25)' },
  swapLight: { backgroundColor: '#B6E0E2' },
  swapTxt: { color: '#B6E0E2', fontWeight: '800' },
  translateBtn: { backgroundColor: '#CCE2FC', paddingHorizontal: 16, paddingVertical: 10, borderRadius: 12 },
  translateBtnTxt: { color: '#0D3B4A', fontWeight: '800' },
  resultCard: { marginTop: 12, backgroundColor: '#2A2A2A', borderRadius: 14, padding: 14 },
  resultCardLight: { backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: '#E5E7EB' },
  bigWord: { fontSize: 28, fontWeight: '900', color: '#E5E7EB', textAlign: 'center' },
  synonymsContainer: { marginTop: 12, alignItems: 'center' },
  synonymsLabel: { color: '#9CA3AF', fontSize: 12, fontWeight: '700', marginBottom: 6 },
  synonymsWrap: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', gap: 6 },
  synonymChip: { backgroundColor: 'rgba(182,224,226,0.15)', paddingHorizontal: 10, paddingVertical: 5, borderRadius: 8, borderWidth: 1, borderColor: 'rgba(182,224,226,0.3)' },
  synonymChipLight: { backgroundColor: '#F3F4F6', borderColor: '#E5E7EB' },
  synonymText: { color: '#B6E0E2', fontSize: 13, fontWeight: '600' },
  exampleBullet: { color: '#9CA3AF', fontSize: 14 },
  example: { color: '#9CA3AF', flex: 1 },
  examplePair: { marginTop: 8 },
  exampleRow: { flexDirection: 'row', alignItems: 'flex-start' },
  exampleTag: { marginRight: 6, marginTop: 1, color: '#B6E0E2', fontWeight: '800', fontSize: 11 },
  exampleTagLight: { color: '#0D3B4A' },
  examplesHeader: { marginTop: 2, color: '#E5E7EB', fontSize: 13, fontWeight: '800' },
  examplesHeaderLight: { color: '#111827' },
  exampleLabel: { color: '#9CA3AF', fontSize: 12, fontWeight: '700' },
  exampleLabelLight: { color: '#6B7280' },
  exampleBold: { fontWeight: '800', color: '#E5E7EB' },
  exampleBoldLight: { color: '#111827' },
  exampleBlock: { marginTop: 10 },
  showMoreBtn: { alignSelf: 'flex-start', marginTop: 10, paddingVertical: 6, paddingHorizontal: 8, borderRadius: 8, backgroundColor: 'rgba(255,255,255,0.06)' },
  showMoreTxt: { color: '#B6E0E2', fontWeight: '800' },
  showMoreTxtLight: { color: '#0D3B4A' },
  savedLine: { color: '#B6E0E2', fontWeight: '700' },
  practiceBtn: { marginTop: 12, alignSelf: 'center', paddingHorizontal: 16, paddingVertical: 10, borderRadius: 12, backgroundColor: '#B6E0E2' },
  practiceBtnLight: { backgroundColor: '#B6E0E2' },
  practiceTxt: { color: '#0D3B4A', fontWeight: '800' },
  historyTitle: { marginTop: 10, fontWeight: '800', color: '#E5E7EB' },
  historyRow: { marginTop: 6, padding: 10, borderRadius: 10, backgroundColor: 'rgba(255,255,255,0.06)' },
  historyRowLight: { backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: '#E5E7EB' },
  historyText: { color: '#E5E7EB' },
  // Language modal styles
  modalOverlay: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.35)', justifyContent: 'center', alignItems: 'center', zIndex: 50 },
  langModalCard: { width: '90%', backgroundColor: '#2C2C2C', borderRadius: 24, padding: 16, overflow: 'hidden' },
  langModalCardLight: { backgroundColor: '#FFFFFF' },
  langSearchInput: { flex: 1, height: 40, fontSize: 16, color: '#E5E7EB' },
  langSearchBox: { marginTop: 10, borderRadius: 12, paddingHorizontal: 12, paddingVertical: 10, backgroundColor: '#1F2629', borderWidth: 1.5, borderColor: '#2A3033', flexDirection: 'row', alignItems: 'center' },
  langSearchBoxLight: { backgroundColor: '#FFFFFF', borderColor: '#E5DED3' },
  langRow: { paddingVertical: 10, paddingHorizontal: 12, borderRadius: 8, marginTop: 6 },
  langRowLight: { backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: '#E5DED3' },
  langRowDark: { backgroundColor: '#1F2629', borderWidth: 1, borderColor: '#2A3033' },
  modalTitleSmall: { color: '#E5E7EB', fontWeight: '800', fontSize: 16 },
  modalDoneBtn: { alignSelf: 'flex-end', marginTop: 12, paddingHorizontal: 16, paddingVertical: 10, borderRadius: 12, backgroundColor: '#FDBA74' },
  modalDoneTxt: { color: '#0D3B4A', fontWeight: '800' },
});

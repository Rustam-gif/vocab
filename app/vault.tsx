import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  ScrollView,
  Alert,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  InteractionManager,
  Image,
} from 'react-native';
import LottieView from 'lottie-react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Plus, Search, BookOpen, Trash2 } from 'lucide-react-native';
import { useAppStore } from '../lib/store';
import { getTheme } from '../lib/theme';
import { Word } from '../types';
import { aiService } from '../services/AIService';
import { useFocusEffect } from '../lib/reactNavigation';
import { useAppReady } from '../lib/AppReadyContext';
import { useCanMountTextInput } from '../lib/TextInputGate';

export default function VaultScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ add?: string; create?: string }>();
  const { words, loading, loadWords, addWord, searchWords, getFolders, createFolder, moveWordToFolder, deleteFolder } = useAppStore();
  const themeName = useAppStore(s => s.theme);
  const colors = getTheme(themeName);
  const isLight = themeName === 'light';
  const { isAppReady } = useAppReady();
  const insets = useSafeAreaInsets();
  const canMountTextInput = useCanMountTextInput();
  const [searchQuery, setSearchQuery] = useState('');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isAdding, setIsAdding] = useState(false);
  const [newWord, setNewWord] = useState('');
  const [folders, setFolders] = useState(getFolders());
  const [selectedFolderId, setSelectedFolderId] = useState<string | null>(null);
  const [showFolderCreate, setShowFolderCreate] = useState(false);
  const [newFolderTitle, setNewFolderTitle] = useState('');
  const [selectedModalFolderId, setSelectedModalFolderId] = useState<string | null>(null);
  // Meanings selection when adding a word
  const [meanings, setMeanings] = useState<Array<{ pos?: string; definition: string; example?: string }>>([]);
  const [meaningsLoading, setMeaningsLoading] = useState(false);
  const [selectedMeaningIndex, setSelectedMeaningIndex] = useState<number | null>(null);

  // Derived folders list for rendering (hide "My Saved Words")
  const baseFiltered = (folders || []).filter(f => f.id !== 'folder-user-default' && !/my\s+saved/i.test(f.title));
  const foldersToShow = searchQuery
    ? baseFiltered.filter(f => f.title.toLowerCase().includes(searchQuery.toLowerCase()))
    : baseFiltered;

  // Refresh folders when screen regains focus (don't replay entrance animation)
  useFocusEffect(() => {
    // Refresh folders when screen regains focus (new folders may be created elsewhere)
    try { setFolders(getFolders()); } catch {}
    // Don't replay entrance animation on tab switch - it causes a flash
  });

  useEffect(() => {
    (async () => {
      await loadWords();
      setFolders(getFolders());
    })();
  }, []);

  // Auto-open Add Word modal when navigated with ?add=1
  useEffect(() => {
    if (params?.add === '1' && !isAddModalOpen) {
      setIsAddModalOpen(true);
      if (!selectedModalFolderId) {
        const guess = folders.find(f => f.title.toLowerCase().includes('my saved'))?.id || folders[0]?.id || null;
        setSelectedModalFolderId(guess);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [params?.add]);

  // Auto-open Create Folder modal when navigated with ?create=1
  useEffect(() => {
    if (params?.create === '1' && !showFolderCreate) {
      setShowFolderCreate(true);
    }
  }, [params?.create, showFolderCreate]);

  // Fetch meanings as user types in the Add Word modal (debounced)
  useEffect(() => {
    if (!isAddModalOpen) return;
    const w = newWord.trim();
    if (w.length < 2) {
      setMeanings([]); setSelectedMeaningIndex(null); return;
    }
    setMeaningsLoading(true);
    const t = setTimeout(async () => {
      try {
        const arr = await aiService.getWordMeanings(w);
        // Client-side guard: keep at most one per POS (noun, verb, adjective, adverb, other)
        const order = ['noun','verb','adjective','adverb','other'];
        const idxByPos: Record<string, number> = {};
        const picked: typeof arr = [] as any;
        for (const pos of order) idxByPos[pos] = -1;
        arr.forEach((m) => {
          const pos = (m.pos || 'other').toLowerCase();
          const norm = order.includes(pos) ? pos : 'other';
          if (idxByPos[norm] === -1) {
            idxByPos[norm] = picked.push({ ...m, pos: norm }) - 1;
          }
        });
        const compact = order.map((p) => (idxByPos[p] >= 0 ? picked[idxByPos[p]] : null)).filter(Boolean) as typeof arr;
        setMeanings(compact);
        // Reset selection when results change
        setSelectedMeaningIndex(compact.length ? 0 : null);
      } catch {}
      setMeaningsLoading(false);
    }, 350);
    return () => { try { clearTimeout(t); } catch {} };
  }, [isAddModalOpen, newWord]);

  const handleAddWord = async () => {
    if (!newWord.trim()) return;

    setIsAdding(true);
    try {
      const w = newWord.trim();
      let chosenDef: { definition: string; example?: string } | null = null;
      if (meanings && meanings.length) {
        const idx = selectedMeaningIndex == null ? 0 : selectedMeaningIndex;
        const pick = meanings[idx] || meanings[0];
        chosenDef = { definition: pick.definition, example: pick.example };
      } else {
        const def = await aiService.getWordDefinition(w);
        if (def) chosenDef = { definition: def.definition, example: def.example };
      }

      // Always add the word, even if AI fails; use a minimal placeholder
      const wordData = {
        word: w,
        definition: chosenDef?.definition || 'Definition pending',
        example: chosenDef?.example || 'Example will appear once generated.',
        phonetics: undefined,
        notes: '',
        tags: [],
        folderId: selectedModalFolderId || undefined,
      } as any;

      await addWord(wordData);
      setNewWord('');
      setIsAddModalOpen(false);
      if (!chosenDef) {
        Alert.alert('Added', 'Word saved. Definition will be generated when your API key is set.');
      } else {
        Alert.alert('Success', 'Word added to vault!');
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to add word. Please try again.');
    } finally {
      setIsAdding(false);
    }
  };

  // baseFiltered/foldersToShow defined above

  // No animated entrance here to avoid layout issues

  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString();
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return '#4CAF50';
    if (score >= 60) return '#FF9800';
    return '#F44336';
  };

  if (loading) {
    return (
      <SafeAreaView edges={['bottom']} style={[styles.container, isLight && { backgroundColor: colors.background }, { paddingTop: insets.top }]}>
        <View style={styles.loadingContainer}>
          <LottieView
            source={require('../assets/lottie/learn/loading_inlearn.json')}
            autoPlay
            loop
            style={{ width: 140, height: 140 }}
          />
          <Text style={[styles.loadingText, isLight && { color: '#2D4A66' }]}>Loading your vocabulary...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView edges={['bottom']} style={[styles.container, isLight && { backgroundColor: colors.background }, { paddingTop: insets.top }]}>
      <View style={[styles.header, isLight && styles.headerLight]}>
        <View style={{ width: 32 }} />
        <Text style={[styles.title, isLight && styles.titleLight]}>Vocabulary Vault</Text>
        <TouchableOpacity
          style={styles.addButtonIcon}
          onPress={() => {
            setIsAddModalOpen(true);
            if (!selectedModalFolderId) {
              // Prefer "Saved from Sets" if present, otherwise first visible folder
              const prefer = folders.find(f => f.id === 'folder-sets-default')?.id
                || baseFiltered[0]?.id || null;
              setSelectedModalFolderId(prefer);
            }
          }}
        >
          <Plus size={24} color={isLight ? '#0F766E' : '#4ED9CB'} />
        </TouchableOpacity>
      </View>

      {/* Guide: suggest creating useful folders */}
      <View style={[styles.guideCard, isLight && styles.guideCardLight]}>
        <View style={{ width: 36, height: 36, marginRight: 10 }}>
          <LottieView
            source={require('../assets/foldericons/add_folder.json')}
            autoPlay
            loop={false}
            __stableKey="folder-icon:add-folder"
            style={{ width: 36, height: 36 }}
          />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={[styles.guideTitle, isLight && { color: '#111827' }]}>Organize your vault</Text>
          <Text style={[styles.guideText, isLight && { color: '#2D4A66' }]}>Create folders like “Travel”, “Work”, “Phrasal Verbs”, or “Daily Practice”.</Text>
        </View>
        <TouchableOpacity onPress={() => setShowFolderCreate(true)} style={[styles.guideBtn, isLight && styles.guideBtnLight]}>
          <Text style={[styles.guideBtnText, isLight && { color: '#FFFFFF' }]}>Create</Text>
        </TouchableOpacity>
      </View>

      <View style={[styles.searchContainer, isLight && styles.surfaceCard]}>
        <Search size={20} color={isLight ? '#0F766E' : '#4ED9CB'} style={styles.searchIcon} />
        {canMountTextInput ? (
          <TextInput
            style={[styles.searchInput, isLight && { color: '#111827' }]}
            placeholder="Search words..."
            placeholderTextColor={isLight ? '#6B7280' : '#9CA3AF'}
            value={searchQuery}
            onChangeText={setSearchQuery}
            autoCorrect
            spellCheck
            autoCapitalize="none"
            autoComplete="off"
            keyboardAppearance={isLight ? 'light' : 'dark'}
          />
        ) : (
          <Text style={[styles.searchInput, isLight && { color: '#6B7280' }, { color: '#9CA3AF' }]}>Search words...</Text>
        )}
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {foldersToShow.length === 0 ? (
          <View style={styles.emptyState}>
            <BookOpen size={64} color={isLight ? '#0F766E' : '#4ED9CB'} />
            <Text style={[styles.emptyTitle, isLight && { color: '#111827' }]}>
              {searchQuery ? 'No folders found' : 'No folders yet'}
            </Text>
            <Text style={[styles.emptySubtitle, isLight && { color: '#2D4A66' }]}>Create a folder to organize your saved words.</Text>
          </View>
        ) : (
          <View style={styles.wordsList}>
            {foldersToShow.map((f, idx) => {
              const count = words.filter(w => w.folderId === f.id).length;
              // Check if this is a default folder (don't allow deletion)
              const isDefaultFolder = (
                [
                  'folder-sets-default',
                  'folder-phrasal-default',
                  'folder-daily-default',
                  'folder-translated-default',
                  'folder-news-default',
                ].includes(f.id)
                || /translated\s+words/i.test(f.title)
                || /news\s+vocab/i.test(f.title)
              );
              
              return (
                <View key={f.id}>
                  <TouchableOpacity style={[styles.folderRow, isLight && styles.surfaceCard]} onPress={() => router.push({ pathname: '/vault-folder', params: { id: f.id, title: f.title } })}>
                    <Image
                      source={require('../assets/foldericons/folder_icon.png')}
                      style={styles.folderIcon}
                    />
                    <View style={{ flex: 1, marginLeft: 12 }}>
                      <Text style={[styles.folderTitle, isLight && { color: '#111827' }]}>{f.title}</Text>
                      <Text style={[styles.folderSubtitle, isLight && { color: '#2D4A66' }]}>{count} {count === 1 ? 'word' : 'words'}</Text>
                    </View>
                    {!isDefaultFolder && (
                      <TouchableOpacity
                        onPress={async (e) => {
                          e.stopPropagation();
                          const ok = await deleteFolder(f.id);
                          if (ok) {
                            setFolders(getFolders());
                          }
                        }}
                        style={{ padding: 6 }}
                      >
                        <Trash2 size={18} color="#F25E86" />
                      </TouchableOpacity>
                    )}
                  </TouchableOpacity>
                </View>
              );
            })}
          </View>
        )}
      </ScrollView>

      {/* Add Word Modal */}
      {isAddModalOpen && canMountTextInput && (
        <View style={styles.modalOverlay}>
          <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} keyboardVerticalOffset={80} style={{ width: '100%', alignItems: 'center' }}>
          <View style={[styles.modalContent, isLight && styles.surfaceCard]}>
            <Text style={[styles.modalTitle, isLight && { color: '#111827' }]}>Add New Word</Text>
            <TextInput
              style={[styles.modalInput, isLight && { backgroundColor: '#FFFFFF', color: '#111827' }]}
              placeholder="Enter a word..."
              placeholderTextColor={isLight ? '#6B7280' : '#9CA3AF'}
              value={newWord}
              onChangeText={setNewWord}
              autoCorrect
              spellCheck
              autoCapitalize="none"
              autoComplete="off"
              keyboardAppearance={isLight ? 'light' : 'dark'}
            />
            <View style={{ marginBottom: 16 }}>
              <Text style={[styles.modalSectionLabel, isLight && { color: '#6B7280' }]}>Save to</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginTop: 8 }}>
                {folders.filter(f => f.id !== 'folder-user-default' && !/my\s+saved/i.test(f.title)).map(f => (
                  <TouchableOpacity
                    key={f.id}
                    style={[styles.folderChip, isLight && styles.folderChipLight, selectedModalFolderId === f.id && styles.folderChipActive]}
                    onPress={() => setSelectedModalFolderId(f.id)}
                  >
                    <Text style={[styles.folderChipText, isLight && styles.folderChipTextLight]}>{f.title}</Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>

            {/* Meanings chooser */}
            <View style={{ marginBottom: 12 }}>
              <Text style={[styles.modalSectionLabel, isLight && { color: '#6B7280' }]}>Choose a meaning</Text>
              {meaningsLoading && (
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 8 }}>
                  <ActivityIndicator size="small" color="#F25E86" />
                  <Text style={[{ color: '#9CA3AF' }, isLight && { color: '#6B7280' }]}>Fetching meanings…</Text>
                </View>
              )}
              {!meaningsLoading && meanings.length > 0 && (
                <View style={{ marginTop: 8 }}>
                  {meanings.map((m, i) => (
                    <TouchableOpacity
                      key={i}
                      onPress={() => setSelectedMeaningIndex(i)}
                      style={[
                        styles.meaningCard,
                        isLight && styles.meaningCardLight,
                        selectedMeaningIndex === i && styles.meaningCardActive,
                      ]}
                    >
                      <Text style={[styles.meaningDef, isLight && styles.meaningDefLight]}>
                        {m.pos ? `(${m.pos}) ` : ''}{m.definition}
                      </Text>
                      {!!m.example && (
                        <Text style={[styles.meaningExample, isLight && styles.meaningExampleLight]}>
                          “{m.example}”
                        </Text>
                      )}
                    </TouchableOpacity>
                  ))}
                </View>
              )}
            </View>
            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalButton, styles.cancelButton, isLight && styles.cancelButtonLight]}
                onPress={() => {
                  setIsAddModalOpen(false);
                  setNewWord('');
                  // Clear URL param so modal doesn't reopen on next visit
                  if (params?.add === '1') {
                    router.replace('/vault');
                  }
                }}
              >
                <Text style={[styles.cancelButtonText, isLight && styles.cancelButtonTextLight]}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, styles.addButton]}
                onPress={handleAddWord}
                disabled={isAdding || !newWord.trim()}
              >
                {isAdding ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <Text style={styles.addButtonText}>Add Word</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
          </KeyboardAvoidingView>
        </View>
      )}

      {/* Create Folder Modal */}
      {showFolderCreate && canMountTextInput && (
        <View style={styles.modalOverlay}>
          <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} keyboardVerticalOffset={80} style={{ width: '100%', alignItems: 'center' }}>
          <View style={[styles.modalContent, isLight && styles.surfaceCard]}>
            <Text style={[styles.modalTitle, isLight && { color: '#111827' }]}>Create Folder</Text>
            <TextInput
              style={[styles.modalInput, isLight && { backgroundColor: '#FFFFFF', color: '#111827' }]}
              placeholder="Folder title"
              placeholderTextColor={isLight ? '#6B7280' : '#9CA3AF'}
              value={newFolderTitle}
              onChangeText={setNewFolderTitle}
              autoCorrect
              spellCheck
              autoCapitalize="none"
              autoComplete="off"
              keyboardAppearance={isLight ? 'light' : 'dark'}
            />
            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalButton, styles.cancelButton]}
                onPress={() => {
                  setShowFolderCreate(false);
                  setNewFolderTitle('');
                  // Clear URL param so modal doesn't reopen on next visit
                  if (params?.create === '1') {
                    router.replace('/vault');
                  }
                }}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, styles.addButton]}
                onPress={async () => {
                  const folder = await createFolder(newFolderTitle.trim());
                  if (folder) {
                    setFolders(getFolders());
                    setShowFolderCreate(false);
                    setNewFolderTitle('');
                  }
                }}
                disabled={!newFolderTitle.trim()}
              >
                <Text style={styles.addButtonText}>Create</Text>
              </TouchableOpacity>
            </View>
          </View>
          </KeyboardAvoidingView>
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1B263B',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    color: '#9CA3AF',
    marginTop: 16,
    fontSize: 16,
    fontFamily: 'Ubuntu-Medium',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  headerLight: {
  },
  meaningCard: {
    backgroundColor: '#1B263B',
    borderRadius: 16,
    padding: 14,
    marginTop: 8,
    borderWidth: 2,
    borderColor: 'rgba(78,217,203,0.06)',
    borderBottomWidth: 4,
    borderRightWidth: 4,
    borderBottomColor: 'rgba(78,217,203,0.1)',
    borderRightColor: 'rgba(78,217,203,0.08)',
  },
  meaningCardLight: {
    backgroundColor: '#FFFFFF',
    borderWidth: 2,
    borderColor: 'rgba(78,217,203,0.2)',
    borderBottomWidth: 4,
    borderRightWidth: 4,
    borderBottomColor: 'rgba(78,217,203,0.25)',
    borderRightColor: 'rgba(78,217,203,0.22)',
  },
  meaningCardActive: { borderColor: '#4ED9CB', backgroundColor: 'rgba(78, 217, 203, 0.1)' },
  meaningDef: { color: '#FFFFFF', fontWeight: '700', fontFamily: 'Ubuntu-Bold' },
  meaningDefLight: { color: '#0D1B2A' },
  meaningExample: { color: '#9CA3AF', marginTop: 4, fontStyle: 'italic', fontFamily: 'Ubuntu-Medium' },
  meaningExampleLight: { color: '#6B7280' },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: '#FFFFFF',
    fontFamily: 'Feather-Bold',
  },
  titleLight: { color: '#0D1B2A' },
  addButtonIcon: {
    padding: 8,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 20,
    marginVertical: 16,
    backgroundColor: '#1B263B',
    borderRadius: 16,
    paddingHorizontal: 16,
    borderWidth: 2,
    borderColor: 'rgba(78,217,203,0.06)',
    borderBottomWidth: 4,
    borderRightWidth: 4,
    borderBottomColor: 'rgba(78,217,203,0.1)',
    borderRightColor: 'rgba(78,217,203,0.08)',
  },
  surfaceCard: {
    backgroundColor: '#FFFFFF',
    borderWidth: 2,
    borderColor: 'rgba(78,217,203,0.2)',
    borderBottomWidth: 4,
    borderRightWidth: 4,
    borderBottomColor: 'rgba(78,217,203,0.25)',
    borderRightColor: 'rgba(78,217,203,0.22)',
  },
  // Guide styles
  guideCard: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 20,
    marginTop: 8,
    marginBottom: 6,
    backgroundColor: '#1B263B',
    borderRadius: 16,
    padding: 14,
    borderWidth: 2,
    borderColor: 'rgba(78,217,203,0.06)',
    borderBottomWidth: 4,
    borderRightWidth: 4,
    borderBottomColor: 'rgba(78,217,203,0.1)',
    borderRightColor: 'rgba(78,217,203,0.08)',
  },
  guideCardLight: {
    backgroundColor: '#FFFFFF',
    borderWidth: 2,
    borderColor: 'rgba(78,217,203,0.2)',
    borderBottomWidth: 4,
    borderRightWidth: 4,
    borderBottomColor: 'rgba(78,217,203,0.25)',
    borderRightColor: 'rgba(78,217,203,0.22)',
  },
  guideTitle: { color: '#FFFFFF', fontWeight: '700', fontFamily: 'Ubuntu-Bold' },
  guideText: { color: '#9CA3AF', marginTop: 2, fontSize: 12, fontFamily: 'Ubuntu-Medium' },
  guideBtn: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 14,
    backgroundColor: '#F25E86',
    borderWidth: 3,
    borderColor: '#0D1B2A',
    shadowColor: '#000',
    shadowOffset: { width: 2, height: 3 },
    shadowOpacity: 0.4,
    shadowRadius: 0,
    elevation: 5,
  },
  guideBtnLight: { backgroundColor: '#F25E86' },
  guideBtnText: { color: '#FFFFFF', fontWeight: '700', fontFamily: 'Ubuntu-Bold' },
  searchIcon: {
    marginRight: 12,
  },
  searchInput: {
    flex: 1,
    color: '#FFFFFF',
    fontSize: 16,
    paddingVertical: 12,
    fontFamily: 'Ubuntu-Medium',
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#FFFFFF',
    marginTop: 16,
    marginBottom: 8,
    fontFamily: 'Ubuntu-Bold',
  },
  emptySubtitle: {
    fontSize: 16,
    color: '#9CA3AF',
    textAlign: 'center',
    fontFamily: 'Ubuntu-Medium',
  },
  wordsList: {
    paddingBottom: 20,
  },
  wordCard: {
    backgroundColor: '#1B263B',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    borderWidth: 2,
    borderColor: 'rgba(78,217,203,0.06)',
    borderBottomWidth: 4,
    borderRightWidth: 4,
    borderBottomColor: 'rgba(78,217,203,0.1)',
    borderRightColor: 'rgba(78,217,203,0.08)',
  },
  wordHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  wordText: {
    fontSize: 20,
    fontWeight: '700',
    color: '#FFFFFF',
    flex: 1,
    fontFamily: 'Ubuntu-Bold',
  },
  scoreContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  scoreText: {
    fontSize: 16,
    fontWeight: '700',
    marginLeft: 4,
    fontFamily: 'Ubuntu-Bold',
  },
  definitionText: {
    fontSize: 16,
    color: '#E5E7EB',
    marginBottom: 8,
    lineHeight: 22,
    fontFamily: 'Ubuntu-Medium',
  },
  exampleText: {
    fontSize: 14,
    color: '#9CA3AF',
    fontStyle: 'italic',
    marginBottom: 12,
    fontFamily: 'Ubuntu-Medium',
  },
  wordFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  moveButton: {
    marginTop: 10,
    alignSelf: 'flex-start',
    backgroundColor: '#1B263B',
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 8,
  },
  moveButtonText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
    fontFamily: 'Ubuntu-Bold',
  },
  folderChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#1B263B',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 16,
    marginRight: 8,
    borderWidth: 2,
    borderColor: 'rgba(78,217,203,0.06)',
    borderBottomWidth: 4,
    borderRightWidth: 4,
    borderBottomColor: 'rgba(78,217,203,0.1)',
    borderRightColor: 'rgba(78,217,203,0.08)',
  },
  folderChipLight: {
    backgroundColor: '#FFFFFF',
    borderWidth: 2,
    borderColor: 'rgba(78,217,203,0.2)',
    borderBottomWidth: 4,
    borderRightWidth: 4,
    borderBottomColor: 'rgba(78,217,203,0.25)',
    borderRightColor: 'rgba(78,217,203,0.22)',
  },
  folderChipStatic: {
    backgroundColor: '#1B263B',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 16,
    marginRight: 8,
  },
  folderChipActive: {
    borderWidth: 2,
    borderColor: '#4ED9CB',
    backgroundColor: 'rgba(78, 217, 203, 0.15)',
  },
  folderChipText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
    fontFamily: 'Ubuntu-Bold',
  },
  folderChipTextLight: {
    color: '#0D1B2A',
  },
  practiceInfo: {
    flex: 1,
  },
  practiceText: {
    fontSize: 12,
    color: '#9CA3AF',
    fontFamily: 'Ubuntu-Medium',
  },
  dateInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  dateText: {
    fontSize: 12,
    color: '#9CA3AF',
    marginLeft: 4,
    fontFamily: 'Ubuntu-Medium',
  },
  modalOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: '#1B263B',
    borderRadius: 18,
    padding: 24,
    width: '90%',
    maxWidth: 400,
    borderWidth: 2,
    borderColor: 'rgba(78,217,203,0.06)',
    borderBottomWidth: 4,
    borderRightWidth: 4,
    borderBottomColor: 'rgba(78,217,203,0.1)',
    borderRightColor: 'rgba(78,217,203,0.08)',
  },
  modalTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 20,
    textAlign: 'center',
    fontFamily: 'Feather-Bold',
  },
  modalInput: {
    backgroundColor: '#1B263B',
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 14,
    color: '#FFFFFF',
    fontSize: 16,
    marginBottom: 20,
    fontFamily: 'Ubuntu-Medium',
    borderWidth: 2,
    borderColor: 'rgba(78, 217, 203, 0.25)',
  },
  modalSectionLabel: {
    color: '#9CA3AF',
    fontSize: 12,
    fontWeight: '600',
    letterSpacing: 0.3,
    fontFamily: 'Ubuntu-Bold',
  },
  modalButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  modalButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 14,
    alignItems: 'center',
  },
  cancelButton: {
    backgroundColor: '#1B263B',
    borderWidth: 2,
    borderColor: 'rgba(78, 217, 203, 0.35)',
  },
  cancelButtonLight: {
    backgroundColor: '#FFFFFF',
    borderWidth: 2,
    borderColor: 'rgba(78, 217, 203, 0.4)',
  },
  cancelButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
    fontFamily: 'Ubuntu-Bold',
  },
  cancelButtonTextLight: {
    color: '#2D4A66',
  },
  addButton: {
    backgroundColor: '#F25E86',
    borderWidth: 3,
    borderColor: '#0D1B2A',
    shadowColor: '#000',
    shadowOffset: { width: 2, height: 3 },
    shadowOpacity: 0.4,
    shadowRadius: 0,
    elevation: 5,
  },
  addButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
    fontFamily: 'Ubuntu-Bold',
  },
  newFolderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: '#1B263B',
    borderRadius: 16,
    padding: 14,
    marginBottom: 8,
    borderWidth: 2,
    borderColor: 'rgba(78,217,203,0.06)',
    borderBottomWidth: 4,
    borderRightWidth: 4,
    borderBottomColor: 'rgba(78,217,203,0.1)',
    borderRightColor: 'rgba(78,217,203,0.08)',
  },
  folderIcon: {
    width: 40,
    height: 40,
  },
  folderIconSmall: {
    width: 36,
    height: 36,
  },
  newFolderText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '700',
    fontFamily: 'Ubuntu-Bold',
  },
  folderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1B263B',
    borderRadius: 16,
    padding: 14,
    marginBottom: 10,
    borderWidth: 2,
    borderColor: 'rgba(78,217,203,0.06)',
    borderBottomWidth: 4,
    borderRightWidth: 4,
    borderBottomColor: 'rgba(78,217,203,0.1)',
    borderRightColor: 'rgba(78,217,203,0.08)',
  },
  folderTitle: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '700',
    fontFamily: 'Ubuntu-Bold',
  },
  folderSubtitle: {
    color: '#9CA3AF',
    fontSize: 13,
    marginTop: 2,
    fontFamily: 'Ubuntu-Medium',
  },
});

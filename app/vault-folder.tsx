import React, { useEffect, useMemo, useState, useRef, useCallback } from 'react';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Pressable,
  FlatList,
  Alert,
  Animated,
  PanResponder,
  Dimensions,
  Easing,
  Modal,
  TextInput,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useLocalSearchParams, useRouter, Link } from 'expo-router';
import { Calendar, Star, Volume2, Trash2, Edit3, FolderOpen } from 'lucide-react-native';
import { useAppStore } from '../lib/store';
import AudioPlayer, { AudioPlayerRef } from '../components/AudioPlayer';
import { getTheme } from '../lib/theme';
import { Word } from '../types';
import { FlashcardsContent } from './flashcards';
import { WordSprintContent } from './word-sprint';

const SCREEN_HEIGHT = Dimensions.get('window').height;
const DISMISS_THRESHOLD = 120;

export default function VaultFolderScreen() {
  const router = useRouter();
  const { id, title } = useLocalSearchParams<{ id: string; title?: string }>();
  const { words, loadWords, deleteWord, updateWord, getFolders } = useAppStore();
  const themeName = useAppStore(s => s.theme);
  const colors = getTheme(themeName);
  const isLight = themeName === 'light';
  const insets = useSafeAreaInsets();
  const [loading, setLoading] = useState(false);
  const [speakingFor, setSpeakingFor] = useState<string | null>(null);
  const [mode, setMode] = useState<'list' | 'flashcards' | 'sprint'>('list');
  const audioPlayerRef = useRef<AudioPlayerRef>(null);

  // Edit modal state
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [editingWord, setEditingWord] = useState<Word | null>(null);
  const [editForm, setEditForm] = useState({ word: '', definition: '', example: '', phonetic: '' });

  // Move modal state
  const [moveModalVisible, setMoveModalVisible] = useState(false);
  const [movingWord, setMovingWord] = useState<Word | null>(null);

  // Animation: slide-up entry + drag-to-dismiss
  const translateY = useRef(new Animated.Value(SCREEN_HEIGHT)).current;
  const overlayOpacity = useRef(new Animated.Value(0)).current;
  const scrollOffsetRef = useRef(0);
  const isDraggingRef = useRef(false);

  // Entry animation
  useEffect(() => {
    Animated.parallel([
      Animated.timing(translateY, {
        toValue: 0,
        duration: 340,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
      Animated.timing(overlayOpacity, {
        toValue: 1,
        duration: 340,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  const dismiss = useCallback(() => {
    Animated.parallel([
      Animated.timing(translateY, {
        toValue: SCREEN_HEIGHT,
        duration: 280,
        easing: Easing.in(Easing.cubic),
        useNativeDriver: true,
      }),
      Animated.timing(overlayOpacity, {
        toValue: 0,
        duration: 280,
        useNativeDriver: true,
      }),
    ]).start(() => {
      router.back();
    });
  }, [translateY, overlayOpacity, router]);

  // Track if user is at top of scroll (for pull-to-dismiss)
  const isAtTopRef = useRef(true);

  const panResponder = useMemo(
    () =>
      PanResponder.create({
        onStartShouldSetPanResponder: () => false,
        onMoveShouldSetPanResponder: (_, g) => {
          // Only capture if pulling down AND at top of scroll
          const isPullingDown = g.dy > 8 && Math.abs(g.dy) > Math.abs(g.dx);
          return isPullingDown && isAtTopRef.current;
        },
        onPanResponderGrant: () => {
          isDraggingRef.current = true;
        },
        onPanResponderMove: (_, g) => {
          if (g.dy < 0) {
            translateY.setValue(0);
            return;
          }
          translateY.setValue(g.dy);
          // Fade overlay as panel drags down
          const progress = Math.min(g.dy / SCREEN_HEIGHT, 1);
          overlayOpacity.setValue(1 - progress * 0.7);
        },
        onPanResponderRelease: (_, g) => {
          isDraggingRef.current = false;
          // Dismiss if dragged far enough or with enough velocity
          if (g.dy > DISMISS_THRESHOLD || g.vy > 0.8) {
            dismiss();
          } else {
            Animated.spring(translateY, {
              toValue: 0,
              useNativeDriver: true,
              friction: 8,
            }).start();
            Animated.timing(overlayOpacity, {
              toValue: 1,
              duration: 200,
              useNativeDriver: true,
            }).start();
          }
        },
        onPanResponderTerminate: () => {
          isDraggingRef.current = false;
          Animated.spring(translateY, {
            toValue: 0,
            useNativeDriver: true,
          }).start();
        },
      }),
    [translateY, overlayOpacity, dismiss]
  );

  useEffect(() => {
    (async () => {
      if (!words || words.length === 0) {
        setLoading(true);
        try { await loadWords(); } finally { setLoading(false); }
      } else {
        setLoading(false);
      }
    })();
  }, [loadWords, words]);

  const items: Word[] = useMemo(() => {
    return words.filter(w => w.folderId === id);
  }, [words, id]);

  const formatDate = (date: Date) => new Date(date).toLocaleDateString();

  const ITEM_HEIGHT = 180;
  const getItemLayout = (_data: any, index: number) => ({
    length: ITEM_HEIGHT,
    offset: ITEM_HEIGHT * index,
    index,
  });

  const handleScroll = useCallback((e: any) => {
    const y = e.nativeEvent.contentOffset.y;
    scrollOffsetRef.current = y;
    // Update isAtTop for pull-to-dismiss
    isAtTopRef.current = y <= 5;
  }, []);

  const renderWordCard = ({ item: word }: { item: Word }) => (
    <Pressable
      style={({ pressed }) => [styles.wordCard, isLight && styles.wordCardLight, pressed && { opacity: 0.9 }]}
      onPress={() => router.push({ pathname: '/vault/word/[id]' as any, params: { id: String(word.id) } })}
    >
        <View style={styles.wordHeader}>
          <Text style={[styles.wordText, isLight && { color: '#111827' }]}>{word.word}</Text>
          <View style={styles.headerRight}>
            <TouchableOpacity
              accessibilityRole="button"
              accessibilityLabel={`Play pronunciation for ${word.word}`}
              onPress={async () => {
                try {
                  if (speakingFor === word.id) {
                    audioPlayerRef.current?.stop();
                    setSpeakingFor(null);
                    return;
                  }

                  setSpeakingFor(word.id);

                  const { SUPABASE_ANON_KEY } = require('../lib/supabase');
                  const response = await fetch('https://auirkjgyattnvqaygmfo.supabase.co/functions/v1/tts-cached', {
                    method: 'POST',
                    headers: {
                      'Content-Type': 'application/json',
                      'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
                      'apikey': SUPABASE_ANON_KEY
                    },
                    body: JSON.stringify({
                      text: word.word,
                      voice: 'alloy',
                      rate: 0.85
                    })
                  });

                  const data = await response.json();

                  if (data.url) {
                    audioPlayerRef.current?.play(data.url, () => {
                      console.log('[vault-folder] Audio playback completed');
                      setSpeakingFor(prev => (prev === word.id ? null : prev));
                    });
                    console.log('[vault-folder] Playing TTS (cached:', data.cached + ')');
                  } else {
                    setSpeakingFor(null);
                  }
                } catch (err) {
                  console.error('[vault-folder] TTS error:', err);
                  setSpeakingFor(null);
                }
              }}
              style={[styles.speakBtn, speakingFor === word.id && styles.speakBtnActive, isLight && styles.speakBtnLight]}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <Volume2 size={18} color={speakingFor === word.id ? '#4ED9CB' : (isLight ? '#0F766E' : '#E5E7EB')} />
            </TouchableOpacity>
            {(() => {
              const sprintCorrect = (word as any)?.exerciseStats?.sprint?.correct || 0;
              const starColor = sprintCorrect > 0 ? '#4ED9CB' : '#F25E86';
              return (
                <View style={styles.scoreContainer}>
                  <Star size={16} color={starColor} fill={starColor} />
                  <Text style={[styles.scoreText, { color: starColor }]}>{sprintCorrect}</Text>
                </View>
              );
            })()}
            <TouchableOpacity
              onPress={() => {
                setEditingWord(word);
                setEditForm({
                  word: word.word,
                  definition: word.definition,
                  example: word.example || '',
                  phonetic: word.phonetic || '',
                });
                setEditModalVisible(true);
              }}
              style={styles.actionBtn}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <Edit3 size={16} color={isLight ? '#0F766E' : '#4ED9CB'} />
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => {
                setMovingWord(word);
                setMoveModalVisible(true);
              }}
              style={styles.actionBtn}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <FolderOpen size={16} color={isLight ? '#0F766E' : '#4ED9CB'} />
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => {
                Alert.alert(
                  'Delete Word',
                  `Remove "${word.word}" from this folder?`,
                  [
                    { text: 'Cancel', style: 'cancel' },
                    { text: 'Delete', style: 'destructive', onPress: () => deleteWord(word.id) },
                  ]
                );
              }}
              style={styles.deleteBtn}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <Trash2 size={16} color="#F25E86" />
            </TouchableOpacity>
          </View>
        </View>
        <Text style={[styles.definitionText, isLight && { color: '#1F2937' }]}>{word.definition}</Text>
        <Text style={[styles.exampleText, isLight && { color: '#6B7280' }]}>"{word.example}"</Text>
        <View style={styles.wordFooter}>
          <Text style={[styles.practiceMeta, isLight && { color: '#6B7280' }]}>Practiced {word.practiceCount} times</Text>
          <View style={styles.dateInfo}>
            <Calendar size={14} color={isLight ? '#0F766E' : '#4ED9CB'} />
            <Text style={[styles.dateText, isLight && { color: '#6B7280' }]}>{formatDate(word.savedAt)}</Text>
          </View>
        </View>
    </Pressable>
  );

  const renderEmptyState = () => (
    <View style={styles.emptyState}>
      <Text style={[styles.emptyTitle, isLight && { color: '#111827' }]}>No words here yet</Text>
      <Text style={[styles.emptySubtitle, isLight && { color: '#2D4A66' }]}>Add or move words into this folder from your vault.</Text>
    </View>
  );

  return (
    <View style={styles.fullScreen}>
      <AudioPlayer ref={audioPlayerRef} />

      {/* Semi-transparent overlay */}
      <Animated.View
        style={[styles.overlay, { opacity: overlayOpacity }]}
      >
        <TouchableOpacity style={StyleSheet.absoluteFill} activeOpacity={1} onPress={dismiss} />
      </Animated.View>

      {/* Sliding content panel */}
      <Animated.View
        style={[
          styles.panel,
          isLight && styles.panelLight,
          { transform: [{ translateY }], paddingBottom: insets.bottom },
        ]}
        {...panResponder.panHandlers}
      >
        {/* Drag handle - visual indicator for pull-to-dismiss */}
        <View style={styles.handleContainer}>
          <View style={[styles.handle, isLight && styles.handleLight]} />
        </View>

        {/* Header */}
        <View style={styles.header}>
          <Text style={[styles.title, isLight && styles.titleLight]} numberOfLines={1} ellipsizeMode="tail">
            {title || 'Folder'}
          </Text>
        </View>

        {mode === 'list' && (
          <>
            {/* Practice buttons */}
            <View style={styles.practiceActions}>
              <TouchableOpacity
                style={[styles.practiceButton, isLight && styles.practiceButtonLight]}
                onPress={() => setMode('flashcards')}
              >
                <Text style={styles.practiceButtonText}>Flashcards</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.practiceButton, styles.sprintButton, isLight && styles.practiceButtonLight, isLight && styles.sprintButtonLight]}
                onPress={() => setMode('sprint')}
              >
                <Text style={styles.practiceButtonText}>Word Sprint</Text>
              </TouchableOpacity>
            </View>

            {/* Word list */}
            {loading ? (
              <View style={styles.emptyState}>
                <Text style={[styles.emptyTitle, isLight && { color: '#111827' }]}>Loading...</Text>
              </View>
            ) : (
              <FlatList
                data={items}
                renderItem={renderWordCard}
                keyExtractor={(word) => word.id}
                getItemLayout={getItemLayout}
                contentContainerStyle={styles.scrollContent}
                style={styles.content}
                showsVerticalScrollIndicator={false}
                removeClippedSubviews={true}
                initialNumToRender={10}
                maxToRenderPerBatch={10}
                windowSize={5}
                updateCellsBatchingPeriod={50}
                ListEmptyComponent={renderEmptyState}
                onScroll={handleScroll}
                scrollEventThrottle={16}
              />
            )}
          </>
        )}
        {mode === 'flashcards' && (
          <FlashcardsContent folderId={id as string} title={title} onBack={() => setMode('list')} isEmbedded />
        )}
        {mode === 'sprint' && (
          <WordSprintContent folderId={id as string} title={title} onBack={() => setMode('list')} isEmbedded />
        )}
      </Animated.View>

      {/* Edit Word Modal */}
      <Modal visible={editModalVisible} transparent animationType="fade" onRequestClose={() => setEditModalVisible(false)}>
        <View style={styles.modalOverlay}>
          <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
            <View style={[styles.modalContent, isLight && styles.modalContentLight]}>
              <Text style={[styles.modalTitle, isLight && styles.modalTitleLight]}>Edit Word</Text>

              <ScrollView style={styles.modalScroll} showsVerticalScrollIndicator={false}>
                <Text style={[styles.modalLabel, isLight && styles.modalLabelLight]}>Word</Text>
                <TextInput
                  style={[styles.modalInput, isLight && styles.modalInputLight]}
                  value={editForm.word}
                  onChangeText={(text) => setEditForm(prev => ({ ...prev, word: text }))}
                  placeholder="Word"
                  placeholderTextColor={isLight ? '#9CA3AF' : '#6B7280'}
                />

                <Text style={[styles.modalLabel, isLight && styles.modalLabelLight]}>Definition</Text>
                <TextInput
                  style={[styles.modalInput, styles.modalInputMultiline, isLight && styles.modalInputLight]}
                  value={editForm.definition}
                  onChangeText={(text) => setEditForm(prev => ({ ...prev, definition: text }))}
                  placeholder="Definition"
                  placeholderTextColor={isLight ? '#9CA3AF' : '#6B7280'}
                  multiline
                  numberOfLines={3}
                />

                <Text style={[styles.modalLabel, isLight && styles.modalLabelLight]}>Example</Text>
                <TextInput
                  style={[styles.modalInput, styles.modalInputMultiline, isLight && styles.modalInputLight]}
                  value={editForm.example}
                  onChangeText={(text) => setEditForm(prev => ({ ...prev, example: text }))}
                  placeholder="Example sentence"
                  placeholderTextColor={isLight ? '#9CA3AF' : '#6B7280'}
                  multiline
                  numberOfLines={2}
                />

                <Text style={[styles.modalLabel, isLight && styles.modalLabelLight]}>Phonetic (optional)</Text>
                <TextInput
                  style={[styles.modalInput, isLight && styles.modalInputLight]}
                  value={editForm.phonetic}
                  onChangeText={(text) => setEditForm(prev => ({ ...prev, phonetic: text }))}
                  placeholder="/fəˈnetɪk/"
                  placeholderTextColor={isLight ? '#9CA3AF' : '#6B7280'}
                />
              </ScrollView>

              <View style={styles.modalButtons}>
                <TouchableOpacity
                  style={[styles.modalButton, styles.modalButtonSecondary, isLight && styles.modalButtonSecondaryLight]}
                  onPress={() => setEditModalVisible(false)}
                >
                  <Text style={[styles.modalButtonText, styles.modalButtonSecondaryText]}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.modalButton, styles.modalButtonPrimary]}
                  onPress={async () => {
                    if (editingWord && editForm.word && editForm.definition) {
                      await updateWord(editingWord.id, {
                        word: editForm.word,
                        definition: editForm.definition,
                        example: editForm.example,
                        phonetic: editForm.phonetic,
                      });
                      setEditModalVisible(false);
                      setEditingWord(null);
                    }
                  }}
                  disabled={!editForm.word || !editForm.definition}
                >
                  <Text style={styles.modalButtonPrimaryText}>Save</Text>
                </TouchableOpacity>
              </View>
            </View>
          </KeyboardAvoidingView>
        </View>
      </Modal>

      {/* Move Word Modal */}
      <Modal visible={moveModalVisible} transparent animationType="fade" onRequestClose={() => setMoveModalVisible(false)}>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, isLight && styles.modalContentLight]}>
            <Text style={[styles.modalTitle, isLight && styles.modalTitleLight]}>Move to Folder</Text>
            <Text style={[styles.modalSubtitle, isLight && styles.modalSubtitleLight]}>
              Select a folder to move "{movingWord?.word}"
            </Text>

            <ScrollView style={styles.folderList} showsVerticalScrollIndicator={false}>
              {getFolders().filter(f => f.id !== id && f.id !== 'folder-user-default' && !/my\s+saved/i.test(f.title)).map(folder => (
                <TouchableOpacity
                  key={folder.id}
                  style={[styles.folderOption, isLight && styles.folderOptionLight]}
                  onPress={async () => {
                    if (movingWord) {
                      await updateWord(movingWord.id, { folderId: folder.id });
                      setMoveModalVisible(false);
                      setMovingWord(null);
                    }
                  }}
                >
                  <FolderOpen size={20} color={isLight ? '#0F766E' : '#4ED9CB'} />
                  <Text style={[styles.folderOptionText, isLight && styles.folderOptionTextLight]}>
                    {folder.title}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>

            <TouchableOpacity
              style={[styles.modalButton, styles.modalButtonSecondary, isLight && styles.modalButtonSecondaryLight, { marginTop: 16 }]}
              onPress={() => setMoveModalVisible(false)}
            >
              <Text style={[styles.modalButtonText, styles.modalButtonSecondaryText]}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  fullScreen: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.35)',
  },
  panel: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    height: '92%',
    backgroundColor: '#1B263B',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    overflow: 'hidden',
  },
  panelLight: {
    backgroundColor: '#FFFFFF',
  },
  handleContainer: {
    alignItems: 'center',
    paddingTop: 14,
    paddingBottom: 8,
  },
  handle: {
    width: 48,
    height: 5,
    borderRadius: 3,
    backgroundColor: 'rgba(255,255,255,0.35)',
  },
  handleLight: {
    backgroundColor: 'rgba(0,0,0,0.2)',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 12,
  },
  title: {
    fontSize: 22,
    fontWeight: '700',
    color: '#FFFFFF',
    flex: 1,
    marginRight: 12,
    fontFamily: 'Feather-Bold',
  },
  titleLight: { color: '#0D1B2A' },
  practiceActions: {
    flexDirection: 'row',
    gap: 10,
    paddingHorizontal: 20,
    paddingBottom: 14,
  },
  practiceButton: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    paddingHorizontal: 16,
    backgroundColor: '#F25E86',
    borderRadius: 14,
    borderWidth: 3,
    borderColor: '#0D1B2A',
    shadowColor: '#000',
    shadowOffset: { width: 2, height: 3 },
    shadowOpacity: 0.4,
    shadowRadius: 0,
    elevation: 5,
  },
  sprintButton: { backgroundColor: '#F8B070' },
  sprintButtonLight: { backgroundColor: '#F8B070' },
  practiceButtonLight: { backgroundColor: '#F25E86' },
  practiceButtonText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 13,
    letterSpacing: 0.2,
    fontFamily: 'Ubuntu-Bold',
  },
  practiceMeta: {
    color: '#9CA3AF',
    fontSize: 12,
    fontWeight: '600',
    fontFamily: 'Ubuntu-Medium',
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
  },
  scrollContent: {
    flexGrow: 1,
    paddingBottom: 20,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyTitle: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 8,
    fontFamily: 'Ubuntu-Bold',
  },
  emptySubtitle: {
    color: '#9CA3AF',
    fontSize: 14,
    textAlign: 'center',
    fontFamily: 'Ubuntu-Medium',
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
    minHeight: 168,
  },
  wordCardLight: {
    backgroundColor: '#FFFFFF',
    borderWidth: 2,
    borderColor: 'rgba(78,217,203,0.2)',
    borderBottomWidth: 4,
    borderRightWidth: 4,
    borderBottomColor: 'rgba(78,217,203,0.25)',
    borderRightColor: 'rgba(78,217,203,0.22)',
  },
  wordHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  headerRight: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  deleteBtn: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
  wordText: {
    fontSize: 20,
    fontWeight: '700',
    color: '#FFFFFF',
    flex: 1,
    fontFamily: 'Ubuntu-Bold',
  },
  speakBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(78, 217, 203, 0.15)',
    borderWidth: 2,
    borderColor: 'rgba(78, 217, 203, 0.35)',
  },
  speakBtnLight: {
    backgroundColor: '#FFFFFF',
    borderColor: 'rgba(78, 217, 203, 0.4)',
  },
  speakBtnActive: {
    backgroundColor: 'rgba(78, 217, 203, 0.25)',
    borderColor: '#4ED9CB',
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
  actionBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(78,217,203,0.1)',
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 8,
    borderWidth: 1,
    borderColor: 'rgba(78, 217, 203, 0.35)',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContent: {
    backgroundColor: '#1F2937',
    borderRadius: 20,
    padding: 24,
    width: '100%',
    maxWidth: 500,
    maxHeight: '80%',
  },
  modalContentLight: {
    backgroundColor: '#FFFFFF',
  },
  modalTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#E5E7EB',
    marginBottom: 8,
    fontFamily: 'Feather-Bold',
  },
  modalTitleLight: {
    color: '#111827',
  },
  modalSubtitle: {
    fontSize: 14,
    color: '#9CA3AF',
    marginBottom: 16,
    fontFamily: 'Ubuntu-Medium',
  },
  modalSubtitleLight: {
    color: '#6B7280',
  },
  modalScroll: {
    maxHeight: 400,
    marginBottom: 16,
  },
  modalLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#4ED9CB',
    marginBottom: 8,
    marginTop: 12,
    fontFamily: 'Ubuntu-Bold',
  },
  modalLabelLight: {
    color: '#0F766E',
  },
  modalInput: {
    backgroundColor: '#1B263B',
    borderRadius: 12,
    padding: 14,
    color: '#E5E7EB',
    fontSize: 16,
    fontFamily: 'Ubuntu-Medium',
    borderWidth: 1,
    borderColor: 'rgba(78,217,203,0.2)',
  },
  modalInputLight: {
    backgroundColor: '#F9FAFB',
    color: '#111827',
    borderColor: 'rgba(78,217,203,0.3)',
  },
  modalInputMultiline: {
    height: 80,
    textAlignVertical: 'top',
  },
  modalButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  modalButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
  },
  modalButtonPrimary: {
    backgroundColor: '#4ED9CB',
  },
  modalButtonSecondary: {
    backgroundColor: 'rgba(78,217,203,0.1)',
    borderWidth: 1,
    borderColor: 'rgba(78,217,203,0.3)',
  },
  modalButtonSecondaryLight: {
    backgroundColor: '#F9FAFB',
    borderColor: 'rgba(78,217,203,0.4)',
  },
  modalButtonText: {
    fontSize: 16,
    fontWeight: '600',
    fontFamily: 'Ubuntu-Bold',
  },
  modalButtonPrimaryText: {
    color: '#0D1B2A',
    fontSize: 16,
    fontWeight: '600',
    fontFamily: 'Ubuntu-Bold',
  },
  modalButtonSecondaryText: {
    color: '#4ED9CB',
  },
  folderList: {
    maxHeight: 300,
    marginBottom: 8,
  },
  folderOption: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#1B263B',
    borderRadius: 12,
    marginBottom: 8,
    gap: 12,
    borderWidth: 1,
    borderColor: 'rgba(78,217,203,0.2)',
  },
  folderOptionLight: {
    backgroundColor: '#F9FAFB',
    borderColor: 'rgba(78,217,203,0.3)',
  },
  folderOptionText: {
    fontSize: 16,
    color: '#E5E7EB',
    fontWeight: '600',
    fontFamily: 'Ubuntu-Bold',
  },
  folderOptionTextLight: {
    color: '#111827',
  },
});

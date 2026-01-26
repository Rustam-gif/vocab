import React, { useEffect, useMemo, useState, useRef } from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import { View, Text, StyleSheet, TouchableOpacity, FlatList } from 'react-native';
import { useLocalSearchParams, useRouter, Link } from 'expo-router';
import { ArrowLeft, Calendar, Star, Volume2 } from 'lucide-react-native';
import { useAppStore } from '../lib/store';
import AudioPlayer, { AudioPlayerRef } from '../components/AudioPlayer';
import { getTheme } from '../lib/theme';
import { Word } from '../types';

export default function VaultFolderScreen() {
  const router = useRouter();
  const { id, title } = useLocalSearchParams<{ id: string; title?: string }>();
  const { words, loadWords } = useAppStore();
  const themeName = useAppStore(s => s.theme);
  const colors = getTheme(themeName);
  const isLight = themeName === 'light';
  const [loading, setLoading] = useState(false);
  const [speakingFor, setSpeakingFor] = useState<string | null>(null);
  const audioPlayerRef = useRef<AudioPlayerRef>(null);

  useEffect(() => {
    // Load only if not already in store to avoid flicker
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

  const getScoreColor = (score: number) => {
    if (score >= 80) return '#4CAF50';
    if (score >= 60) return '#FF9800';
    return '#F44336';
  };

  const formatDate = (date: Date) => new Date(date).toLocaleDateString();

  // Fixed item height to prevent layout jumps
  const ITEM_HEIGHT = 180; // Approximate height of each word card
  const getItemLayout = (_data: any, index: number) => ({
    length: ITEM_HEIGHT,
    offset: ITEM_HEIGHT * index,
    index,
  });

  const renderWordCard = ({ item: word }: { item: Word }) => (
    <Link href={{ pathname: '/vault/word/[id]', params: { id: String(word.id) } }} asChild>
      <TouchableOpacity style={[styles.wordCard, isLight && styles.wordCardLight]} activeOpacity={0.9}>
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
      </TouchableOpacity>
    </Link>
  );

  const renderEmptyState = () => (
    <View style={styles.emptyState}>
      <Text style={[styles.emptyTitle, isLight && { color: '#111827' }]}>No words here yet</Text>
      <Text style={[styles.emptySubtitle, isLight && { color: '#2D4A66' }]}>Add or move words into this folder from your vault.</Text>
    </View>
  );

  return (
    <SafeAreaView style={[styles.container, isLight && { backgroundColor: colors.background }]}>
      <AudioPlayer ref={audioPlayerRef} />

      <View style={[styles.header, isLight && styles.headerLight]}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.replace('/vault')}>
          <ArrowLeft size={24} color={isLight ? '#0F766E' : '#4ED9CB'} />
        </TouchableOpacity>
        <Text style={[styles.title, isLight && styles.titleLight]} numberOfLines={1} ellipsizeMode="tail">{title || 'Folder'}</Text>
        <View style={styles.practiceActions}>
          <TouchableOpacity
            style={[styles.practiceButton, isLight && styles.practiceButtonLight]}
            onPress={() => router.push({ pathname: '/flashcards', params: { folderId: id, title: title || 'Flashcards' } })}
          >
            <Text style={[styles.practiceButtonText, isLight && styles.practiceButtonTextLight]}>Flashcards</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.practiceButton, isLight && styles.practiceButtonLight]}
            onPress={() => router.push({ pathname: '/word-sprint', params: { folderId: id, title: title || 'Word Sprint' } })}
          >
            <Text style={[styles.practiceButtonText, isLight && styles.practiceButtonTextLight]}>Word Sprint</Text>
          </TouchableOpacity>
        </View>
      </View>

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
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1B263B',
  },
  headerLight: { },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  backButton: {
    padding: 8,
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
    alignItems: 'center',
  },
  practiceButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    paddingHorizontal: 16,
    backgroundColor: '#F25E86',
    borderRadius: 14,
    minWidth: 100,
    borderWidth: 3,
    borderColor: '#0D1B2A',
    shadowColor: '#000',
    shadowOffset: { width: 2, height: 3 },
    shadowOpacity: 0.4,
    shadowRadius: 0,
    elevation: 5,
  },
  practiceButtonLight: { backgroundColor: '#F25E86' },
  practiceButtonTextLight: { color: '#FFFFFF' },
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
  wordText: {
    fontSize: 20,
    fontWeight: '700',
    color: '#FFFFFF',
    flex: 1,
    fontFamily: 'Ubuntu-Bold',
  },
  speakBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
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
  practiceText: {
    color: '#9CA3AF',
    fontSize: 12,
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
});

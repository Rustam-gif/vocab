import React, { useEffect, useMemo, useState } from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { useLocalSearchParams, useRouter, Link } from 'expo-router';
import { ArrowLeft, Calendar, Star, Volume2 } from 'lucide-react-native';
import { useAppStore } from '../lib/store';
import Speech from '../lib/speech';
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

  useEffect(() => {
    // Load only if not already in store to avoid flicker
    (async () => {
      if (!words || words.length === 0) {
        setLoading(true);
        try { await loadWords(); } finally { setLoading(false); }
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

  return (
    <SafeAreaView style={[styles.container, isLight && { backgroundColor: colors.background }]}>
      <View style={[styles.header, isLight && styles.headerLight]}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <ArrowLeft size={24} color={isLight ? '#111827' : '#fff'} />
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

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {items.length === 0 && !loading ? (
          <View style={styles.emptyState}>
            <Text style={[styles.emptyTitle, isLight && { color: '#111827' }]}>No words here yet</Text>
            <Text style={[styles.emptySubtitle, isLight && { color: '#4B5563' }]}>Add or move words into this folder from your vault.</Text>
          </View>
        ) : (
          <View style={styles.wordsList}>
            {items.map(word => (
              <Link key={word.id} href={{ pathname: '/vault/word/[id]', params: { id: String(word.id) } }} asChild>
                <TouchableOpacity style={[styles.wordCard, isLight && styles.wordCardLight]} activeOpacity={0.9}>
                  <View style={styles.wordHeader}>
                  <Text style={[styles.wordText, isLight && { color: '#111827' }]}>{word.word}</Text>
                  <View style={styles.headerRight}>
                    <TouchableOpacity
                      accessibilityRole="button"
                      accessibilityLabel={`Play pronunciation for ${word.word}`}
                      onPress={() => {
                        try {
                          if (speakingFor === word.id) {
                            Speech.stop?.();
                            setSpeakingFor(null);
                            return;
                          }
                          Speech.stop?.();
                          setSpeakingFor(word.id);
                          Speech.speak?.(word.word, {
                            language: 'en-US',
                            rate: 1.0,
                            onDone: () => setSpeakingFor(prev => (prev === word.id ? null : prev)),
                            onStopped: () => setSpeakingFor(prev => (prev === word.id ? null : prev)),
                            onError: () => setSpeakingFor(prev => (prev === word.id ? null : prev)),
                          });
                        } catch {}
                      }}
                      style={[styles.speakBtn, speakingFor === word.id && styles.speakBtnActive, isLight && styles.speakBtnLight]}
                    >
                      <Volume2 size={18} color={speakingFor === word.id ? '#F8B070' : (isLight ? '#111827' : '#F8B070')} />
                    </TouchableOpacity>
                    {(() => {
                      const sprintCorrect = (word as any)?.exerciseStats?.sprint?.correct || 0;
                      const starColor = sprintCorrect > 0 ? '#437F76' : '#E06262';
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
                    <Calendar size={14} color={isLight ? '#6B7280' : '#a0a0a0'} />
                    <Text style={[styles.dateText, isLight && { color: '#6B7280' }]}>{formatDate(word.savedAt)}</Text>
                  </View>
                </View>
                </TouchableOpacity>
              </Link>
            ))}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#252525',
  },
  headerLight: { },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    // remove bottom divider
  },
  backButton: {
    padding: 8,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
    flex: 1,
    marginRight: 12,
    fontFamily: 'Ubuntu-Bold',
  },
  titleLight: { color: '#111827' },
  practiceActions: {
    flexDirection: 'row',
    gap: 10,
    alignItems: 'center',
  },
  practiceButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    paddingHorizontal: 18,
    backgroundColor: '#E28743',
    borderRadius: 999,
    minWidth: 110,
  },
  practiceButtonLight: { backgroundColor: '#F8B070' },
  practiceButtonTextLight: { color: '#111827' },
  practiceButtonText: {
    color: '#FFFFFF',
    fontWeight: '600',
    fontSize: 13,
    letterSpacing: 0.2,
    fontFamily: 'Ubuntu-Medium',
  },
  practiceMeta: {
    color: '#a0a0a0',
    fontSize: 12,
    fontWeight: '600',
    fontFamily: 'Ubuntu-Medium',
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyTitle: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 8,
    fontFamily: 'Ubuntu-Bold',
  },
  emptySubtitle: {
    color: '#a0a0a0',
    fontSize: 14,
    textAlign: 'center',
    fontFamily: 'Ubuntu-Regular',
  },
  wordsList: {
    paddingBottom: 20,
  },
  wordCard: {
    backgroundColor: '#2c2f2f',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  wordCardLight: { backgroundColor: '#FFFFFF' },
  wordHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  headerRight: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  wordText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
    flex: 1,
    fontFamily: 'Ubuntu-Bold',
  },
  speakBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(255,255,255,0.12)',
  },
  speakBtnLight: {
    backgroundColor: '#E5E7EB',
    borderColor: '#E5E7EB',
  },
  speakBtnActive: {
    backgroundColor: 'rgba(248,176,112,0.12)',
    borderColor: 'rgba(248,176,112,0.35)',
  },
  scoreContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  scoreText: {
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 4,
    fontFamily: 'Ubuntu-Medium',
  },
  definitionText: {
    fontSize: 16,
    color: '#e0e0e0',
    marginBottom: 8,
    lineHeight: 22,
    fontFamily: 'Ubuntu-Regular',
  },
  exampleText: {
    fontSize: 14,
    color: '#a0a0a0',
    fontStyle: 'italic',
    marginBottom: 12,
    fontFamily: 'Ubuntu-Regular',
  },
  wordFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  practiceText: {
    color: '#a0a0a0',
    fontSize: 12,
    fontFamily: 'Ubuntu-Regular',
  },
  dateInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  dateText: {
    fontSize: 12,
    color: '#a0a0a0',
    marginLeft: 4,
    fontFamily: 'Ubuntu-Regular',
  },
});

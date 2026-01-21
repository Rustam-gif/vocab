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

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {items.length === 0 && !loading ? (
          <View style={styles.emptyState}>
            <Text style={[styles.emptyTitle, isLight && { color: '#111827' }]}>No words here yet</Text>
            <Text style={[styles.emptySubtitle, isLight && { color: '#2D4A66' }]}>Add or move words into this folder from your vault.</Text>
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

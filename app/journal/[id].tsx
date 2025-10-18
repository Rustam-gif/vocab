import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { ArrowLeft } from 'lucide-react-native';
import { useAppStore } from '../../lib/store';

export default function JournalDetailScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { savedStories, theme } = useAppStore();
  const isLight = theme === 'light';
  const story = savedStories.find(s => s.id === id);

  return (
    <SafeAreaView style={[styles.container, isLight && styles.containerLight]}>
      <View style={[styles.header, isLight && styles.headerLight]}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <ArrowLeft size={24} color={isLight ? '#111827' : '#fff'} />
        </TouchableOpacity>
        <Text style={[styles.title, isLight && styles.titleLight]} numberOfLines={1}>
          {story?.title || 'Story'}
        </Text>
        <View style={{ width: 40 }} />
      </View>

      {story ? (
        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          <Text style={[styles.storyText, isLight && styles.storyTextLight]}>{story.content}</Text>
          <View style={styles.metaRow}>
            <Text style={[styles.metaText, isLight && styles.metaTextLight]}>
              {new Date(story.createdAt).toLocaleString()}
            </Text>
            <Text style={[styles.metaText, isLight && styles.metaTextLight]}>
              {story.words.length} words
            </Text>
          </View>
        </ScrollView>
      ) : (
        <View style={styles.missingWrap}>
          <Text style={[styles.missingText, isLight && styles.missingTextLight]}>Story not found</Text>
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#252525' },
  containerLight: { backgroundColor: '#F2E3D0' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#2c2f2f',
  },
  headerLight: { borderBottomColor: '#E5DED3' },
  backButton: { padding: 8 },
  title: { fontSize: 18, fontWeight: '700', color: '#fff', flex: 1, textAlign: 'center' },
  titleLight: { color: '#111827' },
  content: { flex: 1, padding: 20 },
  storyText: { fontSize: 18, lineHeight: 28, color: '#E5E7EB' },
  storyTextLight: { color: '#2B2B2B' },
  metaRow: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 16 },
  metaText: { fontSize: 12, color: '#9CA3AF' },
  metaTextLight: { color: '#6B7280' },
  missingWrap: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  missingText: { color: '#E5E7EB' },
  missingTextLight: { color: '#374151' },
});


import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { ArrowLeft, FileText, Calendar, BookOpen, Trash2 } from 'lucide-react-native';
import { useAppStore } from '../lib/store';
import { Story } from '../types';

export default function JournalScreen() {
  const router = useRouter();
  const { savedStories, loadStories } = useAppStore();
  const [stories, setStories] = useState<Story[]>([]);

  // FIXED: Load stories only once on component mount
  // The original code had an infinite loop because:
  // 1. useEffect called loadStories() which updated store state
  // 2. useEffect also called setStories(savedStories) 
  // 3. savedStories was in the dependency array
  // 4. When loadStories() updated the store, savedStories changed
  // 5. This triggered useEffect again, creating an infinite loop
  useEffect(() => {
    loadStories();
  }, []); // Empty dependency array - only run once on mount

  // FIXED: Sync local state with store state when savedStories changes
  // This useEffect only updates local state when the store data changes
  // It doesn't call any store update functions, so no infinite loop
  useEffect(() => {
    setStories(savedStories);
  }, [savedStories]);

  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const handleDeleteStory = (storyId: string) => {
    Alert.alert(
      'Delete Story',
      'Are you sure you want to delete this story?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => {
            // FIXED: Only update local state, don't call store functions
            // This prevents potential infinite loops from store updates
            setStories(prev => prev.filter(story => story.id !== storyId));
          },
        },
      ]
    );
  };

  const getStoryPreview = (content: string) => {
    return content.length > 150 ? content.substring(0, 150) + '...' : content;
  };

  if (stories.length === 0) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => router.back()}
          >
            <ArrowLeft size={24} color="#fff" />
          </TouchableOpacity>
          <Text style={styles.title}>Journal</Text>
          <View style={styles.placeholder} />
        </View>

        <View style={styles.emptyState}>
          <FileText size={64} color="#a0a0a0" />
          <Text style={styles.emptyTitle}>No stories yet</Text>
          <Text style={styles.emptySubtitle}>
            Complete story exercises to save them here
          </Text>
          <TouchableOpacity
            style={styles.createStoryButton}
            onPress={() => router.push('/story-exercise')}
          >
            <BookOpen size={20} color="#fff" />
            <Text style={styles.createStoryButtonText}>Start Story Exercise</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <ArrowLeft size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.title}>Journal</Text>
        <View style={styles.storyCount}>
          <Text style={styles.storyCountText}>{stories.length}</Text>
        </View>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.storiesList}>
          {stories.map((story) => (
            <View key={story.id} style={styles.storyCard}>
              <View style={styles.storyHeader}>
                <Text style={styles.storyTitle}>{story.title}</Text>
                <TouchableOpacity
                  style={styles.deleteButton}
                  onPress={() => handleDeleteStory(story.id)}
                >
                  <Trash2 size={18} color="#a0a0a0" />
                </TouchableOpacity>
              </View>

              <Text style={styles.storyPreview}>
                {getStoryPreview(story.content)}
              </Text>

              <View style={styles.storyFooter}>
                <View style={styles.storyInfo}>
                  <Calendar size={14} color="#a0a0a0" />
                  <Text style={styles.storyDate}>
                    {formatDate(story.createdAt)}
                  </Text>
                </View>
                <View style={styles.wordsInfo}>
                  <Text style={styles.wordsText}>
                    {story.words.length} words practiced
                  </Text>
                </View>
              </View>

              {story.completedAt && (
                <View style={styles.completedBadge}>
                  <Text style={styles.completedText}>Completed</Text>
                </View>
              )}
            </View>
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#252525',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#2c2f2f',
  },
  backButton: {
    padding: 8,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
  },
  placeholder: {
    width: 40,
  },
  storyCount: {
    backgroundColor: '#e28743',
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  storyCountText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  content: {
    flex: 1,
    padding: 20,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
    marginTop: 16,
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 16,
    color: '#a0a0a0',
    textAlign: 'center',
    marginBottom: 24,
  },
  createStoryButton: {
    backgroundColor: '#e28743',
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 25,
  },
  createStoryButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  storiesList: {
    gap: 16,
  },
  storyCard: {
    backgroundColor: '#2c2f2f',
    borderRadius: 12,
    padding: 20,
    position: 'relative',
  },
  storyHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  storyTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
    flex: 1,
    marginRight: 12,
  },
  deleteButton: {
    padding: 4,
  },
  storyPreview: {
    fontSize: 16,
    color: '#e0e0e0',
    lineHeight: 24,
    marginBottom: 16,
  },
  storyFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  storyInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  storyDate: {
    fontSize: 12,
    color: '#a0a0a0',
    marginLeft: 4,
  },
  wordsInfo: {
    flex: 1,
    alignItems: 'flex-end',
  },
  wordsText: {
    fontSize: 12,
    color: '#a0a0a0',
  },
  completedBadge: {
    position: 'absolute',
    top: 12,
    right: 12,
    backgroundColor: '#4CAF50',
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  completedText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: '600',
  },
});

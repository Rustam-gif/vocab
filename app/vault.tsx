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
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { ArrowLeft, Plus, Search, BookOpen, Star, Calendar } from 'lucide-react-native';
import { useAppStore } from '../lib/store';
import { Word } from '../types';
import { aiService } from '../services/AIService';

export default function VaultScreen() {
  const router = useRouter();
  const { words, loading, loadWords, addWord, searchWords } = useAppStore();
  const [searchQuery, setSearchQuery] = useState('');
  const [isAddingWord, setIsAddingWord] = useState(false);
  const [newWord, setNewWord] = useState('');

  useEffect(() => {
    loadWords();
  }, []);

  const handleAddWord = async () => {
    if (!newWord.trim()) return;

    setIsAddingWord(true);
    try {
      const definition = await aiService.getWordDefinition(newWord.trim());
      
      if (definition) {
        const wordData = {
          word: newWord.trim(),
          definition: definition.definition,
          example: definition.example,
          phonetics: definition.phonetics,
          notes: '',
          tags: [],
        };

        await addWord(wordData);
        setNewWord('');
        Alert.alert('Success', 'Word added to vault!');
      } else {
        Alert.alert('Word Not Found', 'Sorry, we couldn\'t find this word in the dictionary.');
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to add word. Please try again.');
    } finally {
      setIsAddingWord(false);
    }
  };

  const filteredWords = searchQuery 
    ? searchWords(searchQuery)
    : words;

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
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#e28743" />
          <Text style={styles.loadingText}>Loading your vocabulary...</Text>
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
        <Text style={styles.title}>Vocabulary Vault</Text>
        <TouchableOpacity
          style={styles.addButtonIcon}
          onPress={() => setIsAddingWord(true)}
        >
          <Plus size={24} color="#fff" />
        </TouchableOpacity>
      </View>

      <View style={styles.searchContainer}>
        <Search size={20} color="#a0a0a0" style={styles.searchIcon} />
        <TextInput
          style={styles.searchInput}
          placeholder="Search words..."
          placeholderTextColor="#a0a0a0"
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {filteredWords.length === 0 ? (
          <View style={styles.emptyState}>
            <BookOpen size={64} color="#a0a0a0" />
            <Text style={styles.emptyTitle}>
              {searchQuery ? 'No words found' : 'Your vault is empty'}
            </Text>
            <Text style={styles.emptySubtitle}>
              {searchQuery 
                ? 'Try a different search term'
                : 'Add your first word to get started'
              }
            </Text>
          </View>
        ) : (
          <View style={styles.wordsList}>
            {filteredWords.map((word) => (
              <TouchableOpacity
                key={word.id}
                style={styles.wordCard}
                activeOpacity={0.7}
              >
                <View style={styles.wordHeader}>
                  <Text style={styles.wordText}>{word.word}</Text>
                  <View style={styles.scoreContainer}>
                    <Star 
                      size={16} 
                      color={getScoreColor(word.score)} 
                      fill={getScoreColor(word.score)}
                    />
                    <Text style={[styles.scoreText, { color: getScoreColor(word.score) }]}>
                      {word.score}
                    </Text>
                  </View>
                </View>
                
                <Text style={styles.definitionText}>{word.definition}</Text>
                
                <Text style={styles.exampleText}>"{word.example}"</Text>
                
                <View style={styles.wordFooter}>
                  <View style={styles.practiceInfo}>
                    <Text style={styles.practiceText}>
                      Practiced {word.practiceCount} times
                    </Text>
                  </View>
                  <View style={styles.dateInfo}>
                    <Calendar size={14} color="#a0a0a0" />
                    <Text style={styles.dateText}>
                      {formatDate(word.savedAt)}
                    </Text>
                  </View>
                </View>
              </TouchableOpacity>
            ))}
          </View>
        )}
      </ScrollView>

      {/* Add Word Modal */}
      {isAddingWord && (
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Add New Word</Text>
            <TextInput
              style={styles.modalInput}
              placeholder="Enter a word..."
              placeholderTextColor="#a0a0a0"
              value={newWord}
              onChangeText={setNewWord}
              autoFocus
            />
            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalButton, styles.cancelButton]}
                onPress={() => {
                  setIsAddingWord(false);
                  setNewWord('');
                }}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, styles.addButton]}
                onPress={handleAddWord}
                disabled={isAddingWord || !newWord.trim()}
              >
                {isAddingWord ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <Text style={styles.addButtonText}>Add Word</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#252525',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    color: '#a0a0a0',
    marginTop: 16,
    fontSize: 16,
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
  addButtonIcon: {
    padding: 8,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 20,
    marginVertical: 16,
    backgroundColor: '#2c2f2f',
    borderRadius: 12,
    paddingHorizontal: 16,
  },
  searchIcon: {
    marginRight: 12,
  },
  searchInput: {
    flex: 1,
    color: '#fff',
    fontSize: 16,
    paddingVertical: 12,
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
    fontWeight: '600',
    color: '#fff',
    marginTop: 16,
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 16,
    color: '#a0a0a0',
    textAlign: 'center',
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
  wordHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  wordText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
    flex: 1,
  },
  scoreContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  scoreText: {
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 4,
  },
  definitionText: {
    fontSize: 16,
    color: '#e0e0e0',
    marginBottom: 8,
    lineHeight: 22,
  },
  exampleText: {
    fontSize: 14,
    color: '#a0a0a0',
    fontStyle: 'italic',
    marginBottom: 12,
  },
  wordFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  practiceInfo: {
    flex: 1,
  },
  practiceText: {
    fontSize: 12,
    color: '#a0a0a0',
  },
  dateInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  dateText: {
    fontSize: 12,
    color: '#a0a0a0',
    marginLeft: 4,
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
    backgroundColor: '#2c2f2f',
    borderRadius: 16,
    padding: 24,
    width: '90%',
    maxWidth: 400,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 20,
    textAlign: 'center',
  },
  modalInput: {
    backgroundColor: '#3A3A3A',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    color: '#fff',
    fontSize: 16,
    marginBottom: 20,
  },
  modalButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  modalButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  cancelButton: {
    backgroundColor: '#444',
  },
  cancelButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  addButton: {
    backgroundColor: '#e28743',
  },
  addButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});

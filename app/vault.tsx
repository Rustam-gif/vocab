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
  Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { ArrowLeft, Plus, Search, BookOpen, Trash2 } from 'lucide-react-native';
import { useAppStore } from '../lib/store';
import { Word } from '../types';
import { aiService } from '../services/AIService';

export default function VaultScreen() {
  const router = useRouter();
  const { words, loading, loadWords, addWord, searchWords, getFolders, createFolder, moveWordToFolder, deleteFolder } = useAppStore();
  const [searchQuery, setSearchQuery] = useState('');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isAdding, setIsAdding] = useState(false);
  const [newWord, setNewWord] = useState('');
  const [folders, setFolders] = useState(getFolders());
  const [selectedFolderId, setSelectedFolderId] = useState<string | null>(null);
  const [showFolderCreate, setShowFolderCreate] = useState(false);
  const [newFolderTitle, setNewFolderTitle] = useState('');
  const [selectedModalFolderId, setSelectedModalFolderId] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      await loadWords();
      setFolders(getFolders());
    })();
  }, []);

  const handleAddWord = async () => {
    if (!newWord.trim()) return;

    setIsAdding(true);
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
          folderId: selectedModalFolderId || undefined,
        };

        await addWord(wordData);
        setNewWord('');
        setIsAddModalOpen(false);
        Alert.alert('Success', 'Word added to vault!');
      } else {
        Alert.alert('Word Not Found', 'Sorry, we couldn\'t find this word in the dictionary.');
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to add word. Please try again.');
    } finally {
      setIsAdding(false);
    }
  };

  const baseFiltered = folders;
  const foldersToShow = searchQuery
    ? baseFiltered.filter(f => f.title.toLowerCase().includes(searchQuery.toLowerCase()))
    : baseFiltered;

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
          onPress={() => {
            setIsAddModalOpen(true);
            if (!selectedModalFolderId) {
              const guess = folders.find(f => f.title.toLowerCase().includes('my saved'))?.id || folders[0]?.id || null;
              setSelectedModalFolderId(guess);
            }
          }}
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
        {foldersToShow.length === 0 ? (
          <View style={styles.emptyState}>
            <BookOpen size={64} color="#a0a0a0" />
            <Text style={styles.emptyTitle}>
              {searchQuery ? 'No folders found' : 'No folders yet'}
            </Text>
            <Text style={styles.emptySubtitle}>Create a folder to organize your saved words.</Text>
          </View>
        ) : (
          <View style={styles.wordsList}>
            <TouchableOpacity style={styles.newFolderRow} onPress={() => setShowFolderCreate(true)}>
              <Image source={require('../assets/foldericons/add_folder.png')} style={styles.folderIconSmall} />
              <Text style={styles.newFolderText}>New Folder</Text>
            </TouchableOpacity>
            {foldersToShow.map((f) => {
              const count = words.filter(w => w.folderId === f.id).length;
              // Check if this is a default folder (don't allow deletion)
              const isDefaultFolder = ['folder-sets-default', 'folder-user-default', 'folder-phrasal-default', 'folder-daily-default'].includes(f.id);
              
              return (
                <TouchableOpacity key={f.id} style={styles.folderRow} onPress={() => router.push({ pathname: '/vault-folder', params: { id: f.id, title: f.title } })}>
                  <Image source={require('../assets/foldericons/foldericon.png')} style={styles.folderIcon} />
                  <View style={{ flex: 1, marginLeft: 12 }}>
                    <Text style={styles.folderTitle}>{f.title}</Text>
                    <Text style={styles.folderSubtitle}>{count} {count === 1 ? 'word' : 'words'}</Text>
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
                      <Trash2 size={18} color="#a0a0a0" />
                    </TouchableOpacity>
                  )}
                </TouchableOpacity>
              );
            })}
          </View>
        )}
      </ScrollView>

      {/* Add Word Modal */}
      {isAddModalOpen && (
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
            <View style={{ marginBottom: 16 }}>
              <Text style={styles.modalSectionLabel}>Save to</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginTop: 8 }}>
                {folders.map(f => (
                  <TouchableOpacity
                    key={f.id}
                    style={[styles.folderChip, selectedModalFolderId === f.id && styles.folderChipActive]}
                    onPress={() => setSelectedModalFolderId(f.id)}
                  >
                    <Text style={styles.folderChipText}>{f.title}</Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>
            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalButton, styles.cancelButton]}
                onPress={() => {
                  setIsAddModalOpen(false);
                  setNewWord('');
                }}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
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
        </View>
      )}

      {/* Create Folder Modal */}
      {showFolderCreate && (
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Create Folder</Text>
            <TextInput
              style={styles.modalInput}
              placeholder="Folder title"
              placeholderTextColor="#a0a0a0"
              value={newFolderTitle}
              onChangeText={setNewFolderTitle}
              autoFocus
            />
            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalButton, styles.cancelButton]}
                onPress={() => { setShowFolderCreate(false); setNewFolderTitle(''); }}
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
  moveButton: {
    marginTop: 10,
    alignSelf: 'flex-start',
    backgroundColor: '#3A3A3A',
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 8,
  },
  moveButtonText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
  folderChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#3A3A3A',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 16,
    marginRight: 8,
  },
  folderChipStatic: {
    backgroundColor: '#2c2f2f',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 16,
    marginRight: 8,
  },
  folderChipActive: {
    borderWidth: 1,
    borderColor: '#e28743',
  },
  folderChipText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
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
  modalSectionLabel: {
    color: '#a0a0a0',
    fontSize: 12,
    fontWeight: '600',
    letterSpacing: 0.3,
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
  newFolderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: '#2c2f2f',
    borderRadius: 12,
    padding: 14,
    marginBottom: 8,
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
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  folderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#2c2f2f',
    borderRadius: 12,
    padding: 14,
    marginBottom: 8,
  },
  folderTitle: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  folderSubtitle: {
    color: '#a0a0a0',
    fontSize: 12,
    marginTop: 2,
  },
});

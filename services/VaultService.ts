import AsyncStorage from '@react-native-async-storage/async-storage';
import { ExercisePerformance, ExerciseResult, NewWordPayload, Word } from '../types';

const VAULT_KEY = 'vocab_vault';
const DEMO_WORDS: Word[] = [
  {
    id: '1',
    word: 'serendipity',
    definition: 'the occurrence and development of events by chance in a happy or beneficial way',
    example: 'A fortunate stroke of serendipity brought the two old friends together.',
    phonetics: '/ˌserənˈdipədē/',
    savedAt: new Date(),
    notes: 'Beautiful word for happy accidents',
    tags: ['positive', 'chance'],
    score: 0,
    practiceCount: 0,
    correctCount: 0,
    incorrectCount: 0,
    exerciseStats: {},
    isWeak: true,
  },
  {
    id: '2',
    word: 'ephemeral',
    definition: 'lasting for a very short time',
    example: 'The ephemeral beauty of cherry blossoms captivates visitors each spring.',
    phonetics: '/əˈfem(ə)rəl/',
    savedAt: new Date(),
    notes: 'Often used in poetry',
    tags: ['time', 'beauty'],
    score: 0,
    practiceCount: 0,
    correctCount: 0,
    incorrectCount: 0,
    exerciseStats: {},
    isWeak: true,
  },
  {
    id: '3',
    word: 'ubiquitous',
    definition: 'present, appearing, or found everywhere',
    example: 'Smartphones have become ubiquitous in modern society.',
    phonetics: '/yo͞oˈbikwədəs/',
    savedAt: new Date(),
    notes: 'Common in tech discussions',
    tags: ['technology', 'common'],
    score: 0,
    practiceCount: 0,
    correctCount: 0,
    incorrectCount: 0,
    exerciseStats: {},
    isWeak: true,
  },
];

const WEAK_WORD_THRESHOLD = 10;

class VaultService {
  private words: Word[] = [];
  private folders: { id: string; title: string; createdAt: string }[] = [];

  // Default folders
  static readonly DEFAULT_FOLDER_SETS_ID = 'folder-sets-default';
  static readonly DEFAULT_FOLDER_USER_ID = 'folder-user-default';
  static readonly DEFAULT_FOLDER_SETS_TITLE = 'Saved from Sets';
  static readonly DEFAULT_FOLDER_USER_TITLE = 'My Saved Words';

  async initialize() {
    try {
      const stored = await AsyncStorage.getItem(VAULT_KEY);
      if (stored) {
        // Support both old array format and new object { words, folders }
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed)) {
          this.words = (parsed as Word[]).map(word => this.applyDefaults(word));
        } else {
          this.words = (parsed.words || []).map((w: Word) => this.applyDefaults(w));
          this.folders = Array.isArray(parsed.folders) ? parsed.folders : [];
        }
        // Ensure default folders exist for existing users
        const changed = this.ensureDefaultFolders();
        if (changed) {
          await this.saveWords();
        }
      } else {
        // Initialize with demo words
        this.words = DEMO_WORDS;
        // Default folders for exercises
        this.folders = [
          { id: VaultService.DEFAULT_FOLDER_SETS_ID, title: VaultService.DEFAULT_FOLDER_SETS_TITLE, createdAt: new Date().toISOString() },
          { id: VaultService.DEFAULT_FOLDER_USER_ID, title: VaultService.DEFAULT_FOLDER_USER_TITLE, createdAt: new Date().toISOString() },
        ];
        await this.saveWords();
      }
    } catch (error) {
      console.error('Failed to initialize vault:', error);
      this.words = DEMO_WORDS;
    }
  }

  private async saveWords() {
    try {
      const payload = { words: this.words, folders: this.folders };
      await AsyncStorage.setItem(VAULT_KEY, JSON.stringify(payload));
    } catch (error) {
      console.error('Failed to save words:', error);
    }
  }

  private ensureDefaultFolders(): boolean {
    let changed = false;
    const hasSets = this.folders.some(f => f.id === VaultService.DEFAULT_FOLDER_SETS_ID || f.title === VaultService.DEFAULT_FOLDER_SETS_TITLE);
    const hasUser = this.folders.some(f => f.id === VaultService.DEFAULT_FOLDER_USER_ID || f.title === VaultService.DEFAULT_FOLDER_USER_TITLE);
    if (!hasSets) {
      this.folders.push({ id: VaultService.DEFAULT_FOLDER_SETS_ID, title: VaultService.DEFAULT_FOLDER_SETS_TITLE, createdAt: new Date().toISOString() });
      changed = true;
    }
    if (!hasUser) {
      this.folders.push({ id: VaultService.DEFAULT_FOLDER_USER_ID, title: VaultService.DEFAULT_FOLDER_USER_TITLE, createdAt: new Date().toISOString() });
      changed = true;
    }
    return changed;
  }

  getAllWords(): Word[] {
    return [...this.words];
  }

  getWordById(id: string): Word | undefined {
    return this.words.find(word => word.id === id);
  }

  async addWord(word: NewWordPayload): Promise<Word> {
    const newWord: Word = {
      ...word,
      id: Date.now().toString(),
      savedAt: new Date(),
      score: 0,
      practiceCount: 0,
      correctCount: 0,
      incorrectCount: 0,
      exerciseStats: {},
      isWeak: true,
    };

    this.words.push(newWord);
    await this.saveWords();
    return newWord;
  }

  // Folders API
  getFolders() {
    return [...this.folders];
  }

  async createFolder(title: string) {
    const folder = { id: `folder-${Date.now()}`, title, createdAt: new Date().toISOString() };
    this.folders.push(folder);
    await this.saveWords();
    return folder;
  }

  async moveWordToFolder(wordId: string, folderId: string | undefined) {
    const idx = this.words.findIndex(w => w.id === wordId);
    if (idx === -1) return false;
    this.words[idx] = { ...this.words[idx], folderId };
    await this.saveWords();
    return true;
  }

  async deleteFolder(folderId: string): Promise<boolean> {
    // Protect default folders
    if (
      folderId === VaultService.DEFAULT_FOLDER_SETS_ID ||
      folderId === VaultService.DEFAULT_FOLDER_USER_ID
    ) {
      return false;
    }

    const index = this.folders.findIndex(f => f.id === folderId);
    if (index === -1) return false;

    // Move words to "My Saved Words" by default
    const fallbackId = VaultService.DEFAULT_FOLDER_USER_ID;
    this.words = this.words.map(w => (w.folderId === folderId ? { ...w, folderId: fallbackId } : w));
    this.folders.splice(index, 1);
    await this.saveWords();
    return true;
  }

  async addWordIfNotExists(word: NewWordPayload): Promise<{ word: Word; isNew: boolean }> {
    // Check if word already exists (case-insensitive)
    const existingWord = this.words.find(w => 
      w.word.toLowerCase() === word.word.toLowerCase()
    );

    if (existingWord) {
      const normalized = this.applyDefaults(existingWord);
      const index = this.words.findIndex(w => w.id === existingWord.id);
      if (index !== -1) {
        this.words[index] = normalized;
        await this.saveWords();
      }
      return { word: normalized, isNew: false };
    }

    const newWord = await this.addWord(word);
    return { word: newWord, isNew: true };
  }

  async updateWord(id: string, updates: Partial<Word>): Promise<Word | null> {
    const index = this.words.findIndex(word => word.id === id);
    if (index === -1) return null;

    this.words[index] = { ...this.words[index], ...updates };
    await this.saveWords();
    return this.words[index];
  }

  async deleteWord(id: string): Promise<boolean> {
    const index = this.words.findIndex(word => word.id === id);
    if (index === -1) return false;

    this.words.splice(index, 1);
    await this.saveWords();
    return true;
  }

  async recordPracticeResult(
    wordKey: string,
    update: {
      scoreChange: number;
      correct: boolean;
      exerciseType: ExerciseResult['exerciseType'];
    }
  ): Promise<Word | null> {
    let word = this.getWordById(wordKey);
    if (!word) {
      word = this.words.find(item => item.word.toLowerCase() === wordKey.toLowerCase());
      if (!word) return null;
    }
    const id = word.id;

    const normalized = this.applyDefaults(word);
    const nextScore = Math.max(0, normalized.score + update.scoreChange);
    const nextPracticeCount = normalized.practiceCount + 1;
    const nextCorrectCount = normalized.correctCount + (update.correct ? 1 : 0);
    const nextIncorrectCount = normalized.incorrectCount + (update.correct ? 0 : 1);

    const stats = { ...normalized.exerciseStats };
    const stat: ExercisePerformance = stats[update.exerciseType] ?? { correct: 0, incorrect: 0 };
    stats[update.exerciseType] = {
      correct: stat.correct + (update.correct ? 1 : 0),
      incorrect: stat.incorrect + (update.correct ? 0 : 1),
    };

    const updatedWord: Word = {
      ...normalized,
      score: nextScore,
      practiceCount: nextPracticeCount,
      correctCount: nextCorrectCount,
      incorrectCount: nextIncorrectCount,
      exerciseStats: stats,
      lastPracticed: new Date(),
      isWeak: nextScore < WEAK_WORD_THRESHOLD || nextIncorrectCount > nextCorrectCount,
    };

    const index = this.words.findIndex(item => item.id === id);
    if (index === -1) return null;

    this.words[index] = updatedWord;
    await this.saveWords();
    return updatedWord;
  }

  getWeakestWords(limit: number = 10): Word[] {
    return [...this.words]
      .sort((a, b) => a.score - b.score)
      .slice(0, limit);
  }

  getWordsByTag(tag: string): Word[] {
    return this.words.filter(word => word.tags.includes(tag));
  }

  searchWords(query: string): Word[] {
    const lowercaseQuery = query.toLowerCase();
    return this.words.filter(word =>
      word.word.toLowerCase().includes(lowercaseQuery) ||
      word.definition.toLowerCase().includes(lowercaseQuery) ||
      word.tags.some(tag => tag.toLowerCase().includes(lowercaseQuery))
    );
  }

  getStats() {
    const totalWords = this.words.length;
    const practicedWords = this.words.filter(word => word.practiceCount > 0).length;
    const averageScore = this.words.length > 0 
      ? this.words.reduce((sum, word) => sum + word.score, 0) / this.words.length 
      : 0;

    return {
      totalWords,
      practicedWords,
      averageScore: Math.round(averageScore * 100) / 100,
    };
  }

  private applyDefaults(word: Word): Word {
    const savedAt = word.savedAt instanceof Date ? word.savedAt : new Date(word.savedAt ?? Date.now());
    const lastPracticed = word.lastPracticed
      ? word.lastPracticed instanceof Date
        ? word.lastPracticed
        : new Date(word.lastPracticed)
      : undefined;

    return {
      ...word,
      savedAt,
      lastPracticed,
      correctCount: word.correctCount ?? 0,
      incorrectCount: word.incorrectCount ?? 0,
      exerciseStats: word.exerciseStats ?? {},
      isWeak: word.isWeak ?? word.score < WEAK_WORD_THRESHOLD,
      practiceCount: word.practiceCount ?? 0,
      score: word.score ?? 0,
    };
  }
}

export const vaultService = new VaultService();

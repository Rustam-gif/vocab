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

  async initialize() {
    try {
      const stored = await AsyncStorage.getItem(VAULT_KEY);
      if (stored) {
        const parsed: Word[] = JSON.parse(stored);
        this.words = parsed.map(word => this.applyDefaults(word));
      } else {
        // Initialize with demo words
        this.words = DEMO_WORDS;
        await this.saveWords();
      }
    } catch (error) {
      console.error('Failed to initialize vault:', error);
      this.words = DEMO_WORDS;
    }
  }

  private async saveWords() {
    try {
      await AsyncStorage.setItem(VAULT_KEY, JSON.stringify(this.words));
    } catch (error) {
      console.error('Failed to save words:', error);
    }
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

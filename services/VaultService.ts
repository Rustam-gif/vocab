import AsyncStorage from '@react-native-async-storage/async-storage';
import { ExercisePerformance, ExerciseResult, NewWordPayload, Word, SrsState } from '../types';

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
  static readonly DEFAULT_FOLDER_PHRASAL_ID = 'folder-phrasal-default';
  static readonly DEFAULT_FOLDER_DAILY_ID = 'folder-daily-default';
  static readonly DEFAULT_FOLDER_TRANSLATED_ID = 'folder-translated-default';
   static readonly DEFAULT_FOLDER_NEWS_ID = 'folder-news-default';
  static readonly DEFAULT_FOLDER_SETS_TITLE = 'Saved from Sets';
  static readonly DEFAULT_FOLDER_USER_TITLE = 'My Saved Words';
  static readonly DEFAULT_FOLDER_PHRASAL_TITLE = 'Common Phrasal Verbs';
  static readonly DEFAULT_FOLDER_DAILY_TITLE = 'Daily Essentials';
  static readonly DEFAULT_FOLDER_TRANSLATED_TITLE = 'Translated Words';
  static readonly DEFAULT_FOLDER_NEWS_TITLE = 'News Vocabulary';

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
          // Non-blocking save to not freeze UI
          this.saveWords().catch(() => {});
        }
      } else {
        // First install: build vocabulary in batches to prevent UI freeze
        // Start with demo words immediately for fast perceived load
        this.words = [...DEMO_WORDS];

        // Default folders for exercises
        this.folders = [
          { id: VaultService.DEFAULT_FOLDER_SETS_ID, title: VaultService.DEFAULT_FOLDER_SETS_TITLE, createdAt: new Date().toISOString() },
          { id: VaultService.DEFAULT_FOLDER_USER_ID, title: VaultService.DEFAULT_FOLDER_USER_TITLE, createdAt: new Date().toISOString() },
          { id: VaultService.DEFAULT_FOLDER_PHRASAL_ID, title: VaultService.DEFAULT_FOLDER_PHRASAL_TITLE, createdAt: new Date().toISOString() },
          { id: VaultService.DEFAULT_FOLDER_DAILY_ID, title: VaultService.DEFAULT_FOLDER_DAILY_TITLE, createdAt: new Date().toISOString() },
          { id: VaultService.DEFAULT_FOLDER_TRANSLATED_ID, title: VaultService.DEFAULT_FOLDER_TRANSLATED_TITLE, createdAt: new Date().toISOString() },
          { id: VaultService.DEFAULT_FOLDER_NEWS_ID, title: VaultService.DEFAULT_FOLDER_NEWS_TITLE, createdAt: new Date().toISOString() },
        ];

        // Add phrasal verbs and daily words in a deferred manner to prevent freeze
        // Use setImmediate to yield to the main thread between batches
        await new Promise<void>(resolve => {
          setImmediate(() => {
            const phrasalWords = this.getPhrasalVerbsWords();
            this.words = [...this.words, ...phrasalWords];

            setImmediate(() => {
              const dailyWords = this.getDailyEssentialsWords();
              this.words = [...this.words, ...dailyWords];

              // Non-blocking save - don't await to prevent freeze
              this.saveWords().catch(() => {});
              resolve();
            });
          });
        });
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
    const hasPhrasal = this.folders.some(f => f.id === VaultService.DEFAULT_FOLDER_PHRASAL_ID || f.title === VaultService.DEFAULT_FOLDER_PHRASAL_TITLE);
    const hasDaily = this.folders.some(f => f.id === VaultService.DEFAULT_FOLDER_DAILY_ID || f.title === VaultService.DEFAULT_FOLDER_DAILY_TITLE);
    const hasTranslated = this.folders.some(f => f.id === VaultService.DEFAULT_FOLDER_TRANSLATED_ID || f.title === VaultService.DEFAULT_FOLDER_TRANSLATED_TITLE);
    const hasNews = this.folders.some(f => f.id === VaultService.DEFAULT_FOLDER_NEWS_ID || f.title === VaultService.DEFAULT_FOLDER_NEWS_TITLE);
    
    if (!hasSets) {
      this.folders.push({ id: VaultService.DEFAULT_FOLDER_SETS_ID, title: VaultService.DEFAULT_FOLDER_SETS_TITLE, createdAt: new Date().toISOString() });
      changed = true;
    }
    if (!hasUser) {
      this.folders.push({ id: VaultService.DEFAULT_FOLDER_USER_ID, title: VaultService.DEFAULT_FOLDER_USER_TITLE, createdAt: new Date().toISOString() });
      changed = true;
    }
    if (!hasPhrasal) {
      this.folders.push({ id: VaultService.DEFAULT_FOLDER_PHRASAL_ID, title: VaultService.DEFAULT_FOLDER_PHRASAL_TITLE, createdAt: new Date().toISOString() });
      // Add phrasal verbs words if they don't exist
      const phrasalWords = this.getPhrasalVerbsWords();
      const existingPhrasalIds = new Set(this.words.filter(w => w.folderId === VaultService.DEFAULT_FOLDER_PHRASAL_ID).map(w => w.id));
      phrasalWords.forEach(word => {
        if (!existingPhrasalIds.has(word.id)) {
          this.words.push(word);
        }
      });
      changed = true;
    }
    if (!hasDaily) {
      this.folders.push({ id: VaultService.DEFAULT_FOLDER_DAILY_ID, title: VaultService.DEFAULT_FOLDER_DAILY_TITLE, createdAt: new Date().toISOString() });
      // Add daily essentials words if they don't exist
      const dailyWords = this.getDailyEssentialsWords();
      const existingDailyIds = new Set(this.words.filter(w => w.folderId === VaultService.DEFAULT_FOLDER_DAILY_ID).map(w => w.id));
      dailyWords.forEach(word => {
        if (!existingDailyIds.has(word.id)) {
          this.words.push(word);
        }
      });
      changed = true;
    }
    if (!hasTranslated) {
      this.folders.push({ id: VaultService.DEFAULT_FOLDER_TRANSLATED_ID, title: VaultService.DEFAULT_FOLDER_TRANSLATED_TITLE, createdAt: new Date().toISOString() });
      changed = true;
    }
    if (!hasNews) {
      this.folders.push({ id: VaultService.DEFAULT_FOLDER_NEWS_ID, title: VaultService.DEFAULT_FOLDER_NEWS_TITLE, createdAt: new Date().toISOString() });
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
      source: word.source,
      score: 0,
      practiceCount: 0,
      correctCount: 0,
      incorrectCount: 0,
      exerciseStats: {},
      isWeak: true,
      srs: this.createInitialSrs(),
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
    // Protect all default/system folders by id or title
    const blockById = new Set([
      VaultService.DEFAULT_FOLDER_SETS_ID,
      VaultService.DEFAULT_FOLDER_USER_ID,
      VaultService.DEFAULT_FOLDER_PHRASAL_ID,
      VaultService.DEFAULT_FOLDER_DAILY_ID,
      VaultService.DEFAULT_FOLDER_TRANSLATED_ID,
      VaultService.DEFAULT_FOLDER_NEWS_ID,
    ]);
    if (blockById.has(folderId)) return false;

    const index = this.folders.findIndex(f => f.id === folderId);
    if (index === -1) return false;

    const f = this.folders[index];
    const blockByTitle = new Set([
      VaultService.DEFAULT_FOLDER_SETS_TITLE,
      VaultService.DEFAULT_FOLDER_USER_TITLE,
      VaultService.DEFAULT_FOLDER_PHRASAL_TITLE,
      VaultService.DEFAULT_FOLDER_DAILY_TITLE,
      VaultService.DEFAULT_FOLDER_TRANSLATED_TITLE,
      VaultService.DEFAULT_FOLDER_NEWS_TITLE,
    ]);
    if (blockByTitle.has(f.title)) return false;

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
    const srs: SrsState = word.srs
      ? {
          easeFactor: Math.max(1.3, (word.srs as any).easeFactor ?? 2.5),
          interval: Math.max(0, (word.srs as any).interval ?? 0),
          repetition: Math.max(0, (word.srs as any).repetition ?? 0),
          dueAt: new Date((word.srs as any).dueAt ?? Date.now()),
          lastReviewedAt: word.srs.lastReviewedAt ? new Date(word.srs.lastReviewedAt) : undefined,
          lapses: Math.max(0, (word.srs as any).lapses ?? 0),
        }
      : this.createInitialSrs();

    return {
      ...word,
      savedAt,
      lastPracticed,
      srs,
      correctCount: word.correctCount ?? 0,
      incorrectCount: word.incorrectCount ?? 0,
      exerciseStats: word.exerciseStats ?? {},
      isWeak: word.isWeak ?? word.score < WEAK_WORD_THRESHOLD,
      practiceCount: word.practiceCount ?? 0,
      score: word.score ?? 0,
    };
  }

  // --- SRS helpers (SM-2 variant) ---
  private createInitialSrs(): SrsState {
    return {
      easeFactor: 2.5,
      interval: 0,
      repetition: 0,
      dueAt: new Date(),
      lapses: 0,
    };
  }

  // quality: 0-5 (0 total blackout, 5 perfect)
  updateSrs(word: Word, quality: number): SrsState {
    const s = this.applyDefaults(word).srs!;
    let { easeFactor, interval, repetition, lapses } = s;

    // Adjust ease factor
    easeFactor = easeFactor + (0.1 - (5 - quality) * (0.08 + (5 - quality) * 0.02));
    if (easeFactor < 1.3) easeFactor = 1.3;

    let nextInterval = interval;
    if (quality < 3) {
      repetition = 0;
      lapses += 1;
      nextInterval = 1; // immediate short review tomorrow
    } else {
      repetition += 1;
      if (repetition === 1) nextInterval = 1; // 1 day
      else if (repetition === 2) nextInterval = 6; // 6 days
      else nextInterval = Math.round(interval * easeFactor);
    }

    const dueAt = new Date();
    dueAt.setDate(dueAt.getDate() + nextInterval);

    return { easeFactor, interval: nextInterval, repetition, dueAt, lastReviewedAt: new Date(), lapses };
  }

  async gradeWordSrs(wordId: string, quality: number): Promise<Word | null> {
    const idx = this.words.findIndex(w => w.id === wordId);
    if (idx === -1) return null;
    const updatedSrs = this.updateSrs(this.words[idx], quality);
    const updated: Word = { ...this.words[idx], srs: updatedSrs, lastPracticed: new Date(), practiceCount: (this.words[idx].practiceCount ?? 0) + 1 };
    this.words[idx] = updated;
    await this.saveWords();
    return updated;
  }

  getDueWords(limit?: number, folderId?: string): Word[] {
    const now = new Date();
    const filtered = this.words.filter(w => (!folderId || w.folderId === folderId) && (w.srs?.dueAt ? new Date(w.srs.dueAt) <= now : true));
    const sorted = filtered.sort((a, b) => new Date(a.srs?.dueAt ?? 0).getTime() - new Date(b.srs?.dueAt ?? 0).getTime());
    return typeof limit === 'number' ? sorted.slice(0, limit) : sorted;
  }

  async resetSrs(folderId?: string): Promise<void> {
    const now = new Date();
    this.words = this.words.map(w => {
      if (folderId && w.folderId !== folderId) return w;
      const init = this.createInitialSrs();
      return { ...w, srs: { ...init, dueAt: now } };
    });
    await this.saveWords();
  }

  // Generate 50 Common Phrasal Verbs (B1-B2 level)
  private getPhrasalVerbsWords(): Word[] {
    const phrasalVerbs = [
      { word: 'break down', definition: 'to stop working (for machines)', example: 'My car broke down on the highway.' },
      { word: 'bring up', definition: 'to mention a topic; to raise (children)', example: 'She brought up an interesting point during the meeting.' },
      { word: 'call off', definition: 'to cancel', example: 'They called off the wedding at the last minute.' },
      { word: 'carry on', definition: 'to continue', example: 'Please carry on with your presentation.' },
      { word: 'come across', definition: 'to find by chance; to seem', example: 'I came across an old photo of my grandparents.' },
      { word: 'come up with', definition: 'to think of an idea or plan', example: 'We need to come up with a solution quickly.' },
      { word: 'cut down on', definition: 'to reduce', example: 'I am trying to cut down on sugar.' },
      { word: 'do without', definition: 'to manage without having something', example: 'We will have to do without a car for a while.' },
      { word: 'drop by', definition: 'to visit informally', example: 'Feel free to drop by anytime.' },
      { word: 'fall apart', definition: 'to break into pieces', example: 'The old book fell apart in my hands.' },
      { word: 'figure out', definition: 'to understand or solve', example: 'I cannot figure out how this works.' },
      { word: 'fill in', definition: 'to complete (a form); to substitute', example: 'Please fill in this application form.' },
      { word: 'get along', definition: 'to have a good relationship', example: 'She gets along well with her colleagues.' },
      { word: 'get over', definition: 'to recover from', example: 'It took me weeks to get over the flu.' },
      { word: 'give up', definition: 'to stop trying; to quit', example: 'Do not give up on your dreams.' },
      { word: 'go through', definition: 'to experience; to examine', example: 'He went through a difficult period last year.' },
      { word: 'hang out', definition: 'to spend time relaxing', example: 'We usually hang out at the coffee shop.' },
      { word: 'hold on', definition: 'to wait', example: 'Hold on a second, I need to grab my keys.' },
      { word: 'keep up with', definition: 'to stay at the same level as', example: 'It is hard to keep up with the latest technology.' },
      { word: 'look after', definition: 'to take care of', example: 'Could you look after my cat while I am away?' },
      { word: 'look forward to', definition: 'to anticipate with pleasure', example: 'I am looking forward to the weekend.' },
      { word: 'look up', definition: 'to search for information', example: 'Look up the word in the dictionary.' },
      { word: 'make up', definition: 'to invent; to reconcile', example: 'She made up an excuse for being late.' },
      { word: 'pick up', definition: 'to collect; to learn informally', example: 'Can you pick up some milk on your way home?' },
      { word: 'point out', definition: 'to indicate or draw attention to', example: 'He pointed out several errors in the report.' },
      { word: 'put off', definition: 'to postpone', example: 'They put off the meeting until next week.' },
      { word: 'put up with', definition: 'to tolerate', example: 'I cannot put up with this noise anymore.' },
      { word: 'run into', definition: 'to meet by chance', example: 'I ran into an old friend at the store.' },
      { word: 'run out of', definition: 'to use all of something', example: 'We have run out of coffee.' },
      { word: 'set up', definition: 'to arrange or establish', example: 'They set up a meeting for next Tuesday.' },
      { word: 'show up', definition: 'to arrive; to appear', example: 'He showed up late to the party.' },
      { word: 'take off', definition: 'to remove; to leave the ground (plane)', example: 'The plane took off on time.' },
      { word: 'take on', definition: 'to accept (a job or responsibility)', example: 'She took on a new project at work.' },
      { word: 'take over', definition: 'to gain control of', example: 'The new manager will take over next month.' },
      { word: 'turn down', definition: 'to refuse; to reduce volume', example: 'He turned down the job offer.' },
      { word: 'turn up', definition: 'to arrive; to increase volume', example: 'Can you turn up the music?' },
      { word: 'work out', definition: 'to exercise; to find a solution', example: 'I work out at the gym three times a week.' },
      { word: 'back up', definition: 'to support; to make a copy', example: 'Make sure to back up your files.' },
      { word: 'break up', definition: 'to end a relationship', example: 'They broke up after five years together.' },
      { word: 'catch up', definition: 'to reach the same point as someone else', example: 'I need to catch up on my emails.' },
      { word: 'check in', definition: 'to register at a hotel or airport', example: 'We need to check in two hours before the flight.' },
      { word: 'check out', definition: 'to leave a hotel; to examine', example: 'Check out this amazing view!' },
      { word: 'clean up', definition: 'to make tidy', example: 'We need to clean up before the guests arrive.' },
      { word: 'come back', definition: 'to return', example: 'I will come back tomorrow.' },
      { word: 'deal with', definition: 'to handle or manage', example: 'She knows how to deal with difficult customers.' },
      { word: 'find out', definition: 'to discover', example: 'I just found out about the party.' },
      { word: 'get back', definition: 'to return; to receive again', example: 'When did you get back from vacation?' },
      { word: 'give back', definition: 'to return something', example: 'Do not forget to give back the book.' },
      { word: 'go on', definition: 'to continue; to happen', example: 'What is going on here?' },
      { word: 'settle down', definition: 'to become calm; to start living a stable life', example: 'The children finally settled down and went to sleep.' },
    ];

    return phrasalVerbs.map((pv, index) => ({
      id: `phrasal-${index + 1}`,
      word: pv.word,
      definition: pv.definition,
      example: pv.example,
      phonetics: '',
      savedAt: new Date(),
      notes: '',
      tags: ['phrasal verb', 'b1-b2'],
      score: 0,
      practiceCount: 0,
      correctCount: 0,
      incorrectCount: 0,
      exerciseStats: {},
      isWeak: false,
      folderId: VaultService.DEFAULT_FOLDER_PHRASAL_ID,
      srs: this.createInitialSrs(),
    }));
  }

  // Generate 50 Daily Essential Words (B1-B2 level)
  private getDailyEssentialsWords(): Word[] {
    const dailyWords = [
      { word: 'accomplish', definition: 'to succeed in doing something', example: 'She accomplished all her goals this year.' },
      { word: 'adapt', definition: 'to adjust to new conditions', example: 'It takes time to adapt to a new culture.' },
      { word: 'afford', definition: 'to have enough money for something', example: 'I cannot afford a new car right now.' },
      { word: 'anticipate', definition: 'to expect or predict', example: 'We anticipate a good turnout for the event.' },
      { word: 'appreciate', definition: 'to be grateful for; to understand the value of', example: 'I really appreciate your help.' },
      { word: 'approach', definition: 'to come near or nearer to', example: 'Winter is approaching quickly.' },
      { word: 'arrange', definition: 'to organize or plan', example: 'Can you arrange a meeting for tomorrow?' },
      { word: 'aspect', definition: 'a particular part or feature', example: 'This is an important aspect of the project.' },
      { word: 'assume', definition: 'to suppose something is true without proof', example: 'I assume you have already eaten.' },
      { word: 'attach', definition: 'to fasten or join', example: 'Please attach the document to your email.' },
      { word: 'attempt', definition: 'to try', example: 'She attempted to climb the mountain.' },
      { word: 'avoid', definition: 'to stay away from', example: 'I am trying to avoid sugar.' },
      { word: 'benefit', definition: 'an advantage or helpful result', example: 'Exercise has many health benefits.' },
      { word: 'circumstance', definition: 'a fact or condition connected with an event', example: 'Under the circumstances, we had no choice.' },
      { word: 'claim', definition: 'to state that something is true', example: 'He claims to be an expert.' },
      { word: 'concern', definition: 'a matter of interest or importance; worry', example: 'My main concern is your safety.' },
      { word: 'conduct', definition: 'to organize and carry out', example: 'We need to conduct a survey.' },
      { word: 'consequence', definition: 'a result or effect', example: 'Every action has consequences.' },
      { word: 'consider', definition: 'to think about carefully', example: 'Please consider my proposal.' },
      { word: 'consist', definition: 'to be made up of', example: 'The team consists of twelve members.' },
      { word: 'convince', definition: 'to persuade someone', example: 'She convinced me to join the gym.' },
      { word: 'crucial', definition: 'extremely important', example: 'Your support is crucial to our success.' },
      { word: 'decline', definition: 'to refuse; to decrease', example: 'Sales have declined this quarter.' },
      { word: 'delay', definition: 'to make something happen later', example: 'The flight was delayed by two hours.' },
      { word: 'distinguish', definition: 'to recognize differences', example: "Can you distinguish between the two?" },
      { word: 'efficient', definition: 'working in a well-organized way', example: 'This is a very efficient method.' },
      { word: 'emphasize', definition: 'to give special importance to', example: 'He emphasized the need for punctuality.' },
      { word: 'encounter', definition: 'to meet or experience', example: 'We encountered several problems.' },
      { word: 'ensure', definition: 'to make certain', example: 'Please ensure all doors are locked.' },
      { word: 'establish', definition: 'to set up or create', example: 'They established the company in 2010.' },
      { word: 'evaluate', definition: 'to assess or judge', example: 'We need to evaluate the results.' },
      { word: 'exclude', definition: 'to leave out', example: 'The price excludes taxes.' },
      { word: 'extend', definition: 'to make longer or larger', example: 'We decided to extend our vacation.' },
      { word: 'facility', definition: 'a place or building for a specific purpose', example: 'The hotel has excellent facilities.' },
      { word: 'feature', definition: 'a distinctive characteristic', example: 'The phone has many useful features.' },
      { word: 'function', definition: 'the purpose or role of something', example: "What's the function of this button?" },
      { word: 'generate', definition: 'to produce or create', example: 'Solar panels generate electricity.' },
      { word: 'implement', definition: 'to put into action', example: 'We need to implement these changes.' },
      { word: 'imply', definition: 'to suggest without saying directly', example: 'Are you implying that I made a mistake?' },
      { word: 'indicate', definition: 'to show or point out', example: 'The signs indicate the way to the exit.' },
      { word: 'initial', definition: 'happening at the beginning', example: 'My initial reaction was surprise.' },
      { word: 'maintain', definition: 'to keep in good condition', example: 'It is important to maintain your car.' },
      { word: 'obtain', definition: 'to get or acquire', example: 'How did you obtain this information?' },
      { word: 'occur', definition: 'to happen', example: 'The accident occurred last night.' },
      { word: 'participate', definition: 'to take part in', example: 'Everyone can participate in the discussion.' },
      { word: 'perceive', definition: 'to notice or become aware of', example: 'I perceived a change in her attitude.' },
      { word: 'potential', definition: 'possible; having capacity for development', example: 'This project has great potential.' },
      { word: 'require', definition: 'to need', example: 'This job requires experience.' },
      { word: 'resolve', definition: 'to solve or settle', example: 'We need to resolve this issue.' },
      { word: 'sufficient', definition: 'enough; adequate', example: 'We have sufficient time to finish.' },
    ];

    return dailyWords.map((dw, index) => ({
      id: `daily-${index + 1}`,
      word: dw.word,
      definition: dw.definition,
      example: dw.example,
      phonetics: '',
      savedAt: new Date(),
      notes: '',
      tags: ['essential', 'b1-b2', 'daily'],
      score: 0,
      practiceCount: 0,
      correctCount: 0,
      incorrectCount: 0,
      exerciseStats: {},
      isWeak: false,
      folderId: VaultService.DEFAULT_FOLDER_DAILY_ID,
      srs: this.createInitialSrs(),
    }));
  }
}

export const vaultService = new VaultService();

// Word of the Day Pool
// Simple, focused vocabulary for daily learning

export interface DailyWord {
  word: string;
  phonetic: string;
  definition: string;
  example: string;
  synonyms: string[];
  image: string;
}

export const DAILY_WORDS: DailyWord[] = [
  {
    word: 'Resilient',
    phonetic: '/rɪˈzɪliənt/',
    definition: 'Able to recover quickly from difficulties',
    example: 'She remained resilient despite facing multiple challenges.',
    synonyms: ['Tough', 'Strong', 'Adaptable', 'Flexible'],
    image: 'https://images.unsplash.com/photo-1519834785169-98be25ec3f84?w=800&q=80',
  },
  {
    word: 'Diligent',
    phonetic: '/ˈdɪlɪdʒənt/',
    definition: 'Showing careful and persistent work or effort',
    example: 'His diligent approach helped him succeed.',
    synonyms: ['Hardworking', 'Careful', 'Thorough', 'Dedicated'],
    image: 'https://images.unsplash.com/photo-1484480974693-6ca0a78fb36b?w=800&q=80',
  },
  {
    word: 'Articulate',
    phonetic: '/ɑːrˈtɪkjəleɪt/',
    definition: 'Able to express ideas clearly and effectively',
    example: 'The speaker was articulate and easy to understand.',
    synonyms: ['Eloquent', 'Clear', 'Fluent', 'Expressive'],
    image: 'https://images.unsplash.com/photo-1475721027785-f74eccf877e2?w=800&q=80',
  },
  {
    word: 'Pragmatic',
    phonetic: '/præɡˈmætɪk/',
    definition: 'Dealing with things in a practical way',
    example: 'We need a pragmatic solution to this problem.',
    synonyms: ['Practical', 'Realistic', 'Sensible', 'Logical'],
    image: 'https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?w=800&q=80',
  },
  {
    word: 'Ambiguous',
    phonetic: '/æmˈbɪɡjuəs/',
    definition: 'Open to more than one interpretation',
    example: 'The instructions were ambiguous and confusing.',
    synonyms: ['Unclear', 'Vague', 'Uncertain', 'Doubtful'],
    image: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=800&q=80',
  },
  {
    word: 'Tenacious',
    phonetic: '/təˈneɪʃəs/',
    definition: 'Persistent and determined',
    example: 'Her tenacious pursuit of excellence paid off.',
    synonyms: ['Persistent', 'Determined', 'Resolute', 'Steadfast'],
    image: 'https://images.unsplash.com/photo-1552674605-db6ffd4facb5?w=800&q=80',
  },
  {
    word: 'Eloquent',
    phonetic: '/ˈeləkwənt/',
    definition: 'Fluent and persuasive in speaking',
    example: 'He gave an eloquent speech that moved everyone.',
    synonyms: ['Articulate', 'Persuasive', 'Expressive', 'Fluent'],
    image: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=800&q=80',
  },
  {
    word: 'Meticulous',
    phonetic: '/məˈtɪkjələs/',
    definition: 'Showing great attention to detail',
    example: 'She was meticulous in her work.',
    synonyms: ['Careful', 'Thorough', 'Precise', 'Exact'],
    image: 'https://images.unsplash.com/photo-1434030216411-0b793f4b4173?w=800&q=80',
  },
  {
    word: 'Candid',
    phonetic: '/ˈkændɪd/',
    definition: 'Truthful and straightforward',
    example: 'I appreciate your candid feedback.',
    synonyms: ['Honest', 'Frank', 'Direct', 'Open'],
    image: 'https://images.unsplash.com/photo-1531986362435-16b427eb9c26?w=800&q=80',
  },
  {
    word: 'Innovative',
    phonetic: '/ˈɪnəveɪtɪv/',
    definition: 'Introducing new ideas',
    example: 'The company took an innovative approach.',
    synonyms: ['Creative', 'Original', 'Novel', 'Fresh'],
    image: 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=800&q=80',
  },
];

// Get word for today (deterministic based on date)
export function getTodayWord(): DailyWord {
  const today = new Date();
  const dayOfYear = Math.floor((today.getTime() - new Date(today.getFullYear(), 0, 0).getTime()) / 86400000);
  const index = dayOfYear % DAILY_WORDS.length;
  return DAILY_WORDS[index];
}

// Get wrong answers for multiple choice
export function getWrongAnswers(correctWord: DailyWord, count: number = 3): string[] {
  const others = DAILY_WORDS.filter(w => w.word !== correctWord.word);
  const shuffled = others.sort(() => 0.5 - Math.random());
  return shuffled.slice(0, count).map(w => w.definition);
}

// Get wrong synonyms
export function getWrongSynonyms(correctWord: DailyWord, count: number = 3): string[] {
  const allSynonyms = DAILY_WORDS
    .filter(w => w.word !== correctWord.word)
    .flatMap(w => w.synonyms);

  const filtered = allSynonyms.filter(s => !correctWord.synonyms.includes(s));
  const shuffled = filtered.sort(() => 0.5 - Math.random());
  return shuffled.slice(0, count);
}

// Diagnostic words for placement test
// 4 words from each level to determine user's vocabulary level

export interface DiagnosticWord {
  word: string;
  phonetic: string;
  definition: string;
  level: 'beginner' | 'intermediate' | 'advanced';
}

export const diagnosticWords: DiagnosticWord[] = [
  // Beginner (A1-A2) - Basic vocabulary everyone should know
  {
    word: 'happy',
    phonetic: '/ˈhæpi/',
    definition: 'Feeling pleasure or contentment',
    level: 'beginner',
  },
  {
    word: 'friend',
    phonetic: '/frend/',
    definition: 'A person you know well and like',
    level: 'beginner',
  },
  {
    word: 'beautiful',
    phonetic: '/ˈbjuːtɪfəl/',
    definition: 'Very pleasing to look at',
    level: 'beginner',
  },
  {
    word: 'important',
    phonetic: '/ɪmˈpɔːtənt/',
    definition: 'Having great value or significance',
    level: 'beginner',
  },

  // Intermediate (B1-B2) - Conversational vocabulary
  {
    word: 'achieve',
    phonetic: '/əˈtʃiːv/',
    definition: 'Successfully reach a goal through effort',
    level: 'intermediate',
  },
  {
    word: 'consequences',
    phonetic: '/ˈkɒnsɪkwənsɪz/',
    definition: 'Results or effects of an action',
    level: 'intermediate',
  },
  {
    word: 'demonstrate',
    phonetic: '/ˈdemənstreɪt/',
    definition: 'Show or prove something clearly',
    level: 'intermediate',
  },
  {
    word: 'significant',
    phonetic: '/sɪɡˈnɪfɪkənt/',
    definition: 'Important or large enough to have an effect',
    level: 'intermediate',
  },

  // Advanced (C1+) - Academic/sophisticated vocabulary
  {
    word: 'ubiquitous',
    phonetic: '/juːˈbɪkwɪtəs/',
    definition: 'Present or found everywhere',
    level: 'advanced',
  },
  {
    word: 'ephemeral',
    phonetic: '/ɪˈfemərəl/',
    definition: 'Lasting for a very short time',
    level: 'advanced',
  },
  {
    word: 'pragmatic',
    phonetic: '/præɡˈmætɪk/',
    definition: 'Dealing with things in a practical way',
    level: 'advanced',
  },
  {
    word: 'meticulous',
    phonetic: '/məˈtɪkjələs/',
    definition: 'Showing great attention to detail',
    level: 'advanced',
  },
];

// Shuffle words for the test (mix levels)
export const getShuffledWords = (): DiagnosticWord[] => {
  const shuffled = [...diagnosticWords];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
};

// Calculate level based on known words
export const calculateLevel = (
  knownWords: DiagnosticWord[]
): 'beginner' | 'intermediate' | 'advanced' => {
  const beginnerKnown = knownWords.filter(w => w.level === 'beginner').length;
  const intermediateKnown = knownWords.filter(w => w.level === 'intermediate').length;
  const advancedKnown = knownWords.filter(w => w.level === 'advanced').length;

  // Weighted score: beginner=1, intermediate=2, advanced=3
  const score = beginnerKnown * 1 + intermediateKnown * 2 + advancedKnown * 3;

  // Thresholds (easier - only true beginners stay at beginner):
  // Advanced: score >= 8 AND knows at least 1 advanced word
  // Intermediate: score >= 4 AND knows at least 1 intermediate word
  // Beginner: only if very low score (true beginners)
  if (score >= 8 && advancedKnown >= 1) {
    return 'advanced';
  } else if (score >= 4 && intermediateKnown >= 1) {
    return 'intermediate';
  }
  return 'beginner';
};

// Map placement level to app level IDs
export const mapToAppLevel = (
  level: 'beginner' | 'intermediate' | 'advanced'
): string => {
  switch (level) {
    case 'beginner':
      return 'beginner';
    case 'intermediate':
      return 'intermediate';
    case 'advanced':
      return 'upper-intermediate';
  }
};

// Get all levels that should be visible based on placement
export const getVisibleLevels = (
  placementLevel: 'beginner' | 'intermediate' | 'advanced'
): string[] => {
  const allLevels = ['beginner', 'intermediate', 'upper-intermediate', 'advanced', 'proficient'];
  const startIndex = allLevels.indexOf(mapToAppLevel(placementLevel));
  return allLevels.slice(startIndex);
};

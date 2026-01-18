// Diagnostic words for placement test
// Extended set: 12 words per level (36 total) for detailed test
// Quick test uses first 6 per level (18 total)

export interface DiagnosticWord {
  word: string;
  phonetic: string;
  definition: string;
  level: 'beginner' | 'intermediate' | 'advanced';
}

export const diagnosticWords: DiagnosticWord[] = [
  // ========== BEGINNER (A1-A2) - Basic vocabulary everyone should know ==========
  // First 6 - used in quick test
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
  {
    word: 'different',
    phonetic: '/ˈdɪfərənt/',
    definition: 'Not the same as another',
    level: 'beginner',
  },
  {
    word: 'remember',
    phonetic: '/rɪˈmembər/',
    definition: 'To recall or think of again',
    level: 'beginner',
  },
  // Additional 6 for detailed test
  {
    word: 'explain',
    phonetic: '/ɪkˈspleɪn/',
    definition: 'Make something clear or easy to understand',
    level: 'beginner',
  },
  {
    word: 'careful',
    phonetic: '/ˈkeəfʊl/',
    definition: 'Giving attention to avoid mistakes or danger',
    level: 'beginner',
  },
  {
    word: 'answer',
    phonetic: '/ˈɑːnsər/',
    definition: 'A response to a question',
    level: 'beginner',
  },
  {
    word: 'simple',
    phonetic: '/ˈsɪmpəl/',
    definition: 'Easy to understand or do',
    level: 'beginner',
  },
  {
    word: 'choose',
    phonetic: '/tʃuːz/',
    definition: 'Pick or select from options',
    level: 'beginner',
  },
  {
    word: 'perhaps',
    phonetic: '/pəˈhæps/',
    definition: 'Possibly; maybe',
    level: 'beginner',
  },

  // ========== INTERMEDIATE (B1-B2) - Conversational vocabulary ==========
  // First 6 - used in quick test
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
  {
    word: 'reluctant',
    phonetic: '/rɪˈlʌktənt/',
    definition: 'Unwilling or hesitant to do something',
    level: 'intermediate',
  },
  {
    word: 'inevitable',
    phonetic: '/ɪnˈevɪtəbl/',
    definition: 'Certain to happen; unavoidable',
    level: 'intermediate',
  },
  // Additional 6 for detailed test
  {
    word: 'apparent',
    phonetic: '/əˈpærənt/',
    definition: 'Clearly visible or obvious',
    level: 'intermediate',
  },
  {
    word: 'contribute',
    phonetic: '/kənˈtrɪbjuːt/',
    definition: 'Give something to help achieve a goal',
    level: 'intermediate',
  },
  {
    word: 'fundamental',
    phonetic: '/ˌfʌndəˈmentl/',
    definition: 'Forming a necessary base; essential',
    level: 'intermediate',
  },
  {
    word: 'ambiguous',
    phonetic: '/æmˈbɪɡjuəs/',
    definition: 'Having more than one possible meaning',
    level: 'intermediate',
  },
  {
    word: 'coherent',
    phonetic: '/kəʊˈhɪərənt/',
    definition: 'Logical and consistent; easy to follow',
    level: 'intermediate',
  },
  {
    word: 'diminish',
    phonetic: '/dɪˈmɪnɪʃ/',
    definition: 'Make or become smaller or less',
    level: 'intermediate',
  },

  // ========== ADVANCED (C1+) - Academic/sophisticated vocabulary ==========
  // First 6 - used in quick test
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
  {
    word: 'commensurate',
    phonetic: '/kəˈmenʃərət/',
    definition: 'Corresponding in size or degree; proportionate',
    level: 'advanced',
  },
  {
    word: 'juxtapose',
    phonetic: '/ˌdʒʌkstəˈpəʊz/',
    definition: 'Place close together for contrasting effect',
    level: 'advanced',
  },
  // Additional 6 for detailed test
  {
    word: 'exacerbate',
    phonetic: '/ɪɡˈzæsəbeɪt/',
    definition: 'Make a problem or situation worse',
    level: 'advanced',
  },
  {
    word: 'quintessential',
    phonetic: '/ˌkwɪntɪˈsenʃəl/',
    definition: 'Representing the perfect example of something',
    level: 'advanced',
  },
  {
    word: 'sycophant',
    phonetic: '/ˈsɪkəfænt/',
    definition: 'A person who flatters to gain advantage',
    level: 'advanced',
  },
  {
    word: 'perfunctory',
    phonetic: '/pəˈfʌŋktəri/',
    definition: 'Done without care or interest',
    level: 'advanced',
  },
  {
    word: 'recalcitrant',
    phonetic: '/rɪˈkælsɪtrənt/',
    definition: 'Stubbornly resisting authority or control',
    level: 'advanced',
  },
  {
    word: 'obfuscate',
    phonetic: '/ˈɒbfʌskeɪt/',
    definition: 'Make something unclear or confusing',
    level: 'advanced',
  },
];

// Get words for test - quick test (18 words) or detailed test (36 words)
export const getShuffledWords = (detailed: boolean = false): DiagnosticWord[] => {
  let wordsToUse: DiagnosticWord[];

  if (detailed) {
    // Use all 36 words for detailed test
    wordsToUse = [...diagnosticWords];
  } else {
    // Use first 6 of each level (18 words) for quick test
    const beginner = diagnosticWords.filter(w => w.level === 'beginner').slice(0, 6);
    const intermediate = diagnosticWords.filter(w => w.level === 'intermediate').slice(0, 6);
    const advanced = diagnosticWords.filter(w => w.level === 'advanced').slice(0, 6);
    wordsToUse = [...beginner, ...intermediate, ...advanced];
  }

  // Shuffle
  for (let i = wordsToUse.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [wordsToUse[i], wordsToUse[j]] = [wordsToUse[j], wordsToUse[i]];
  }
  return wordsToUse;
};

// Calculate level based on known words
// Handles both quick (6 per level) and detailed (12 per level) tests
export const calculateLevel = (
  knownWords: DiagnosticWord[],
  totalWords: DiagnosticWord[]
): 'beginner' | 'intermediate' | 'advanced' => {
  const beginnerKnown = knownWords.filter(w => w.level === 'beginner').length;
  const intermediateKnown = knownWords.filter(w => w.level === 'intermediate').length;
  const advancedKnown = knownWords.filter(w => w.level === 'advanced').length;

  // Calculate totals per level from the test (6 for quick, 12 for detailed)
  const beginnerTotal = totalWords.filter(w => w.level === 'beginner').length;
  const intermediateTotal = totalWords.filter(w => w.level === 'intermediate').length;
  const advancedTotal = totalWords.filter(w => w.level === 'advanced').length;

  // Calculate percentages
  const beginnerPercent = beginnerTotal > 0 ? beginnerKnown / beginnerTotal : 0;
  const intermediatePercent = intermediateTotal > 0 ? intermediateKnown / intermediateTotal : 0;
  const advancedPercent = advancedTotal > 0 ? advancedKnown / advancedTotal : 0;

  // Stricter thresholds - must demonstrate mastery at each level:
  //
  // Advanced (C1+):
  //   - Know at least 65% of beginner words
  //   - Know at least 65% of intermediate words
  //   - Know at least 50% of advanced words
  //
  // Intermediate (B1-B2):
  //   - Know at least 65% of beginner words
  //   - Know at least 50% of intermediate words
  //
  // Beginner (A1-A2): Default for everyone else

  if (beginnerPercent >= 0.65 && intermediatePercent >= 0.65 && advancedPercent >= 0.5) {
    return 'advanced';
  } else if (beginnerPercent >= 0.65 && intermediatePercent >= 0.5) {
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

const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, '../app/quiz/data/levels.ts');
let content = fs.readFileSync(filePath, 'utf-8');

// Parse the levels array from the file
const levelsMatch = content.match(/export const levels: Level\[\] = (\[[\s\S]*\]);/);
if (!levelsMatch) {
  console.error('Could not find levels array');
  process.exit(1);
}

// Use eval to parse (safe since we control the file)
let levels;
try {
  // Remove TypeScript type annotations for eval
  const jsContent = levelsMatch[1]
    .replace(/require\([^)]+\)/g, '""') // Replace requires with empty strings
    .replace(/\/\/.*/g, ''); // Remove comments
  levels = eval(jsContent);
} catch (e) {
  console.error('Could not parse levels:', e.message);
  process.exit(1);
}

// Collect all words from regular sets (not quizzes)
const wordOccurrences = new Map(); // word -> [{levelId, setId, setTitle, index}]

levels.forEach(level => {
  level.sets.forEach(set => {
    // Skip quiz sets
    if (set.type === 'quiz' || String(set.id).startsWith('quiz')) {
      return;
    }

    if (set.words) {
      set.words.forEach((word, index) => {
        const w = word.word.toLowerCase();
        if (!wordOccurrences.has(w)) {
          wordOccurrences.set(w, []);
        }
        wordOccurrences.get(w).push({
          levelId: level.id,
          setId: set.id,
          setTitle: set.title,
          index,
          original: word
        });
      });
    }
  });
});

// Find duplicates
const duplicates = [];
wordOccurrences.forEach((occurrences, word) => {
  if (occurrences.length > 1) {
    // Keep first occurrence, mark rest as duplicates
    for (let i = 1; i < occurrences.length; i++) {
      duplicates.push({
        word,
        ...occurrences[i]
      });
    }
  }
});

console.log(`Found ${duplicates.length} duplicate word occurrences to replace`);

// Replacement words organized by theme
const replacementsByTheme = {
  'Daily': ['wake', 'rise', 'snooze', 'nap', 'doze', 'slumber', 'drowse'],
  'Food': ['bake', 'roast', 'grill', 'fry', 'steam', 'simmer', 'sauté', 'marinate', 'season', 'garnish', 'dice', 'mince', 'blend', 'whisk', 'knead'],
  'Cook': ['bake', 'roast', 'grill', 'fry', 'steam', 'simmer', 'sauté', 'marinate', 'season', 'garnish', 'dice', 'mince', 'blend', 'whisk', 'knead'],
  'Kitchen': ['bake', 'roast', 'grill', 'fry', 'steam', 'simmer', 'sauté', 'marinate', 'season', 'garnish', 'dice', 'mince', 'blend', 'whisk', 'knead'],
  'Travel': ['embark', 'depart', 'voyage', 'tour', 'cruise', 'commute', 'relocate', 'migrate', 'transit', 'shuttle'],
  'Work': ['collaborate', 'delegate', 'supervise', 'mentor', 'consult', 'brainstorm', 'strategize', 'execute', 'deliver', 'accomplish'],
  'Tech': ['configure', 'debug', 'deploy', 'sync', 'backup', 'restore', 'encrypt', 'compress', 'optimize', 'automate'],
  'Health': ['heal', 'rehabilitate', 'diagnose', 'prescribe', 'medicate', 'recuperate', 'strengthen', 'rejuvenate', 'detoxify', 'immunize'],
  'Schedule': ['arrange', 'coordinate', 'postpone', 'prepone', 'allocate', 'designate', 'slot', 'pencil in', 'block off', 'earmark'],
  'Emotion': ['rejoice', 'grieve', 'empathize', 'sympathize', 'resent', 'envy', 'admire', 'despise', 'cherish', 'yearn'],
  'Opinion': ['assert', 'contend', 'dispute', 'concur', 'dissent', 'advocate', 'endorse', 'oppose', 'challenge', 'uphold'],
  'Community': ['participate', 'contribute', 'donate', 'mentor', 'advocate', 'campaign', 'mobilize', 'organize', 'fundraise', 'outreach'],
  'default': ['proceed', 'commence', 'conclude', 'execute', 'accomplish', 'undertake', 'facilitate', 'coordinate', 'implement', 'establish']
};

// Generate a replacement word based on set theme
function getReplacementWord(setTitle, usedWords) {
  // Find matching theme
  let themeWords = replacementsByTheme.default;
  for (const [theme, words] of Object.entries(replacementsByTheme)) {
    if (setTitle.toLowerCase().includes(theme.toLowerCase())) {
      themeWords = words;
      break;
    }
  }

  // Find unused word
  for (const word of themeWords) {
    if (!usedWords.has(word.toLowerCase())) {
      return word;
    }
  }

  // Fallback to default theme
  for (const word of replacementsByTheme.default) {
    if (!usedWords.has(word.toLowerCase())) {
      return word;
    }
  }

  return null;
}

// Print duplicates for review
console.log('\nDuplicates to replace:');
duplicates.forEach(d => {
  console.log(`  "${d.word}" in ${d.levelId}/${d.setId} (${d.setTitle})`);
});

console.log('\nTo replace these, you need to manually edit the file or create specific replacements.');

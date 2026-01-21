// Script to analyze duplicate words in levels.ts

const fs = require('fs');
const path = require('path');

// Read the levels.ts file
const filePath = path.join(__dirname, 'app/quiz/data/levels.ts');
const content = fs.readFileSync(filePath, 'utf-8');

// Parse all words from the file
// We need to extract words from non-quiz sets only

// Match all sets
const levelRegex = /\{[\s\n]*id:\s*['"]([^'"]+)['"],[\s\n]*name:/g;
const setRegex = /\{[\s\n]*id:\s*(\d+|['"][^'"]+['"]),[\s\n]*title:\s*['"]([^'"]+)['"],[\s\n]*(type:\s*['"]quiz['"],[\s\n]*)?/g;
const wordRegex = /\{\s*word:\s*['"]([^'"]+)['"]/g;

// Simple approach: find all words and their contexts
const lines = content.split('\n');
let currentLevel = null;
let currentSet = null;
let isQuizSet = false;

const wordMap = new Map(); // word -> [{level, set, lineNum}]
const allOccurrences = [];

// State machine to track where we are
let braceCount = 0;
let inLevel = false;
let inSets = false;
let inSet = false;
let inWords = false;
let inWord = false;

for (let i = 0; i < lines.length; i++) {
  const line = lines[i];
  const lineNum = i + 1;

  // Detect level start
  const levelMatch = line.match(/id:\s*['"]([^'"]+)['"],\s*$/);
  if (levelMatch && lines[i+1] && lines[i+1].includes('name:')) {
    currentLevel = levelMatch[1];
  }

  // Detect if we're in a quiz set (type: 'quiz')
  if (line.includes("type: 'quiz'") || line.includes('type: "quiz"')) {
    isQuizSet = true;
  }

  // Detect set title
  const setTitleMatch = line.match(/title:\s*['"]([^'"]+)['"]/);
  if (setTitleMatch) {
    currentSet = setTitleMatch[1];
  }

  // Detect completed: which marks end of set definition
  if (line.includes('completed:')) {
    // Reset quiz flag for next set
    setTimeout(() => { isQuizSet = false; }, 0);
  }

  // Detect words
  const wordMatch = line.match(/\{\s*word:\s*['"]([^'"]+)['"]/);
  if (wordMatch) {
    const word = wordMatch[1].toLowerCase();
    if (!isQuizSet && currentLevel && currentSet) {
      if (!wordMap.has(word)) {
        wordMap.set(word, []);
      }
      wordMap.get(word).push({
        word: wordMatch[1], // original case
        level: currentLevel,
        set: currentSet,
        lineNum: lineNum
      });
      allOccurrences.push({
        word: wordMatch[1],
        wordLower: word,
        level: currentLevel,
        set: currentSet,
        lineNum: lineNum
      });
    }
  }

  // Reset quiz flag after set closes
  if (line.includes('completed:')) {
    isQuizSet = false;
  }
}

// Find duplicates
const duplicates = [];
for (const [word, occurrences] of wordMap) {
  if (occurrences.length > 1) {
    duplicates.push({
      word,
      count: occurrences.length,
      occurrences
    });
  }
}

// Sort by count descending
duplicates.sort((a, b) => b.count - a.count);

console.log(`Total unique words: ${wordMap.size}`);
console.log(`Total words with duplicates: ${duplicates.length}`);
console.log(`Total duplicate occurrences to replace: ${duplicates.reduce((sum, d) => sum + d.count - 1, 0)}`);
console.log('\n--- Duplicates ---\n');

// Output duplicates in a structured way
for (const dup of duplicates) {
  console.log(`"${dup.word}" (${dup.count} times):`);
  for (const occ of dup.occurrences) {
    console.log(`  - Line ${occ.lineNum}: ${occ.level} / ${occ.set}`);
  }
  console.log('');
}

// Also save to JSON for further processing
fs.writeFileSync(
  path.join(__dirname, 'duplicates.json'),
  JSON.stringify(duplicates, null, 2)
);

console.log('\nSaved to duplicates.json');

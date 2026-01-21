// Third round of fixes for remaining duplicates

const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'app/quiz/data/levels.ts');
let content = fs.readFileSync(filePath, 'utf-8');

// [line_number, old_word_text, new word object]
const fixes = [
  // study - keep 80, fix 1390
  [1390, "study", "{ word: 'review', definition: 'To go over material again', example: 'Students review notes before exams.', synonyms: ['reread', 'examine', 'revisit'] },"],

  // book - keep 281, fix 1367
  [1367, "book", "{ word: 'reserve', definition: 'To arrange in advance', example: 'Reserve your tickets early.', synonyms: ['hold', 'secure', 'prearrange'] },"],

  // prepare - keep 424, fix 2518
  [2518, "prepare", "{ word: 'ready', definition: 'To make something prepared', example: 'They readied the meeting room.', synonyms: ['set up', 'arrange', 'organize'] },"],

  // assess - keep 641, fix 2424
  [2424, "assess", "{ word: 'examine', definition: 'To inspect closely for details', example: 'Experts examine the evidence.', synonyms: ['inspect', 'analyze', 'review'] },"],

  // revise - keep 644, fix 1871
  [1871, "revise", "{ word: 'amend', definition: 'To make changes to legal text', example: 'Lawmakers amended the statute.', synonyms: ['modify', 'alter', 'update'] },"],

  // suggest - keep 870, fix 1761
  [1761, "suggest", "{ word: 'advise', definition: 'To offer guidance or counsel', example: 'Doctors advise regular checkups.', synonyms: ['counsel', 'recommend', 'propose'] },"],

  // update - keep 893, fix 1451
  [1451, "update", "{ word: 'refresh', definition: 'To make current again', example: 'Refresh your browser to see changes.', synonyms: ['renew', 'modernize', 'revitalize'] },"],

  // confirm - keep 917, fix 1919
  [1919, "confirm", "{ word: 'validate', definition: 'To check accuracy of data', example: 'Systems validate user input.', synonyms: ['verify', 'check', 'authenticate'] },"],

  // replace - keep 942, fix 2364
  [2364, "replace", "{ word: 'supersede', definition: 'To take the place of something', example: 'New policies supersede old ones.', synonyms: ['supplant', 'displace', 'succeed'] },"],

  // modify - keep 967, fix 1947
  [1947, "modify", "{ word: 'tweak', definition: 'To make small adjustments', example: 'Engineers tweak settings for efficiency.', synonyms: ['adjust', 'alter', 'fine-tune'] },"],

  // coordinate - keep 1145, fix 2066
  [2066, "coordinate", "{ word: 'align', definition: 'To bring into proper arrangement', example: 'Teams align schedules globally.', synonyms: ['synchronize', 'time', 'harmonize'] },"],

  // diminish - keep 1464, fix 1880
  [1880, "diminish", "{ word: 'reduce', definition: 'To make smaller in amount', example: 'Budget cuts reduced spending.', synonyms: ['lower', 'decrease', 'cut'] },"],

  // verify - keep 1475, fix 2377
  [2377, "verify", "{ word: 'confirm', definition: 'To establish something is true', example: 'Tests confirm the hypothesis.', synonyms: ['validate', 'prove', 'authenticate'] },"],

  // balance - keep 1658, fix 1800
  [1800, "balance", "{ word: 'reconcile', definition: 'To make things compatible', example: 'Teams reconcile different viewpoints.', synonyms: ['harmonize', 'integrate', 'align'] },"],
];

// Process each fix
let lines = content.split('\n');
let fixCount = 0;

for (const [lineNum, oldWord, replacementLine] of fixes) {
  const idx = lineNum - 1;
  const line = lines[idx];

  if (!line) {
    console.log(`Line ${lineNum}: does not exist`);
    continue;
  }

  // Check if this line contains the word we're looking for
  const wordPattern = new RegExp(`word:\\s*['"]${oldWord}['"]`);
  if (wordPattern.test(line)) {
    // Preserve indentation
    const indent = line.match(/^\s*/)[0];
    lines[idx] = indent + replacementLine;
    fixCount++;
    console.log(`Fixed line ${lineNum}: "${oldWord}"`);
  } else {
    console.log(`SKIP line ${lineNum}: "${oldWord}" not found in line`);
  }
}

// Write the updated file
fs.writeFileSync(filePath, lines.join('\n'));
console.log(`\nFixed ${fixCount} words total`);

// Fifth round of fixes for remaining duplicates

const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'app/quiz/data/levels.ts');
let content = fs.readFileSync(filePath, 'utf-8');

// [line_number, old_word_text, new word object]
const fixes = [
  // harmonize - keep 1776, fix 1800 and 2330
  [1800, "harmonize", "{ word: 'reconcile', definition: 'To make conflicting things compatible', example: 'Teams reconcile different viewpoints.', synonyms: ['balance', 'integrate', 'align'] },"],
  [2330, "harmonize", "{ word: 'align', definition: 'To bring into proper arrangement', example: 'Agencies align standards internationally.', synonyms: ['coordinate', 'integrate', 'synchronize'] },"],

  // prepare - keep 424, fix 2518
  [2518, "prepare", "{ word: 'arrange', definition: 'To organize something in advance', example: 'They arranged the meeting room.', synonyms: ['organize', 'set up', 'coordinate'] },"],

  // counter - keep 597, fix 2401 (this is a furniture term vs argument term)
  [2401, "counter", "{ word: 'refute', definition: 'To prove an argument is wrong', example: 'Evidence refuted all objections.', synonyms: ['rebut', 'contradict', 'disprove'] },"],

  // improve - keep 907, fix 2714
  [2714, "improve", "{ word: 'enhance', definition: 'To increase quality or value', example: 'Training enhances performance.', synonyms: ['better', 'upgrade', 'boost'] },"],

  // confirm - keep 917, fix 1919
  [1919, "confirm", "{ word: 'validate', definition: 'To check accuracy formally', example: 'Systems validate user credentials.', synonyms: ['verify', 'authenticate', 'check'] },"],

  // modify - keep 967, fix 1871
  [1871, "modify", "{ word: 'alter', definition: 'To change part of something', example: 'Congress altered the clause.', synonyms: ['amend', 'revise', 'update'] },"],

  // negotiate - keep 1201, fix 2195
  [2195, "negotiate", "{ word: 'broker', definition: 'To arrange between two parties', example: 'Lawyers brokered a settlement.', synonyms: ['mediate', 'arrange', 'facilitate'] },"],

  // prebook - keep 1367, fix 1522
  [1522, "prebook", "{ word: 'reserve', definition: 'To book something for future use', example: 'Reserve seats in advance.', synonyms: ['hold', 'secure', 'book'] },"],

  // measure - keep 1406, fix 1848
  [1848, "measure", "{ word: 'benchmark', definition: 'To compare against a standard', example: 'We benchmark performance quarterly.', synonyms: ['assess', 'evaluate', 'gauge'] },"],

  // verify - keep 1475, fix 2751
  [2751, "verify", "{ word: 'corroborate', definition: 'To confirm with evidence', example: 'Records corroborate the timeline.', synonyms: ['support', 'confirm', 'validate'] },"],

  // counsel - keep 1489, fix 1761
  [1761, "counsel", "{ word: 'advise', definition: 'To offer guidance or direction', example: 'Experts advise caution in investing.', synonyms: ['recommend', 'guide', 'suggest'] },"],

  // deter - keep 1610, fix 2438
  [2438, "deter", "{ word: 'dissuade', definition: 'To persuade someone not to act', example: 'Warnings dissuaded risky behavior.', synonyms: ['discourage', 'prevent', 'stop'] },"],

  // contend - keep 1621, fix 2752
  [2752, "contend", "{ word: 'assert', definition: 'To state something firmly', example: 'Critics assert the approach failed.', synonyms: ['claim', 'maintain', 'declare'] },"],

  // uphold - keep 1762, fix 1962
  [1962, "uphold", "{ word: 'maintain', definition: 'To continue supporting something', example: 'Courts maintain legal precedent.', synonyms: ['preserve', 'sustain', 'keep'] },"],

  // curtail - keep 1763, fix 1880
  [1880, "curtail", "{ word: 'reduce', definition: 'To make smaller in extent', example: 'Budget constraints reduced spending.', synonyms: ['cut', 'decrease', 'limit'] },"],

  // scrutinize - keep 1808, fix 2424
  [2424, "scrutinize", "{ word: 'examine', definition: 'To look at something carefully', example: 'Auditors examine financial records.', synonyms: ['inspect', 'analyze', 'review'] },"],

  // deduce - keep 1998, fix 2374
  [2374, "deduce", "{ word: 'infer', definition: 'To conclude from evidence', example: 'We infer trends from the data.', synonyms: ['derive', 'conclude', 'reason'] },"],

  // theorize - keep 2149, fix 2753
  [2753, "theorize", "{ word: 'hypothesize', definition: 'To propose a tentative explanation', example: 'Researchers hypothesize causes.', synonyms: ['postulate', 'speculate', 'conjecture'] },"],

  // disprove - keep 2182, fix 2749
  [2749, "disprove", "{ word: 'refute', definition: 'To prove a claim is false', example: 'Data refuted the theory.', synonyms: ['rebut', 'negate', 'contradict'] },"],

  // expound - keep 2184, fix 2473
  [2473, "expound", "{ word: 'elaborate', definition: 'To add more detail', example: 'Professors elaborate on key points.', synonyms: ['expand', 'develop', 'explain'] },"],

  // substantiate - keep 2242, fix 2377
  [2377, "substantiate", "{ word: 'validate', definition: 'To prove accuracy of something', example: 'Tests validate our findings.', synonyms: ['confirm', 'verify', 'prove'] },"],
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

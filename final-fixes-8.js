// Eighth round - using very unique replacement words

const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'app/quiz/data/levels.ts');
let content = fs.readFileSync(filePath, 'utf-8');

const fixes = [
  // schedule - keep 916, fix 1522
  [1522, "schedule", "{ word: 'book', definition: 'To arrange in advance', example: 'Book your table for dinner.', synonyms: ['reserve', 'secure', 'hold'] },"],

  // argue - keep 953, fix 2752
  [2752, "argue", "{ word: 'contend', definition: 'To state firmly in debate', example: 'Critics contend the data is flawed.', synonyms: ['assert', 'maintain', 'claim'] },"],

  // coordinate - keep 1145, fix 2518
  [2518, "coordinate", "{ word: 'arrange', definition: 'To organize in advance', example: 'They arranged the entire event.', synonyms: ['plan', 'set up', 'organize'] },"],

  // negotiate - keep 1201, fix 2195
  [2195, "negotiate", "{ word: 'arbitrate', definition: 'To settle a dispute impartially', example: 'A judge arbitrated the conflict.', synonyms: ['mediate', 'adjudicate', 'resolve'] },"],

  // propose - keep 1428, fix 1761
  [1761, "propose", "{ word: 'suggest', definition: 'To put forward an idea', example: 'Analysts suggest new approaches.', synonyms: ['recommend', 'advise', 'advocate'] },"],

  // sustain - keep 1670, fix 1962
  [1962, "sustain", "{ word: 'maintain', definition: 'To keep at the same level', example: 'Teams maintain high standards.', synonyms: ['preserve', 'continue', 'uphold'] },"],

  // corroborate - keep 1833, fix 2377
  [2377, "corroborate", "{ word: 'verify', definition: 'To check accuracy of claims', example: 'Studies verify the hypothesis.', synonyms: ['confirm', 'validate', 'prove'] },"],

  // elucidate - keep 1847, fix 2473
  [2473, "elucidate", "{ word: 'clarify', definition: 'To make something easier to understand', example: 'The professor clarified the concept.', synonyms: ['explain', 'illuminate', 'simplify'] },"],

  // synchronize - keep 1860, fix 2330
  [2330, "synchronize", "{ word: 'align', definition: 'To bring into proper arrangement', example: 'Agencies align their policies.', synonyms: ['harmonize', 'coordinate', 'match'] },"],

  // lessen - keep 1880, fix 2413
  [2413, "lessen", "{ word: 'diminish', definition: 'To become smaller or less', example: 'Interest diminished over time.', synonyms: ['reduce', 'decrease', 'shrink'] },"],

  // conclude - keep 1884, fix 2374
  [2374, "conclude", "{ word: 'infer', definition: 'To derive from evidence', example: 'We infer patterns from data.', synonyms: ['deduce', 'derive', 'gather'] },"],

  // ratify - keep 1919, fix 2136
  [2136, "ratify", "{ word: 'authorize', definition: 'To give official permission', example: 'Congress authorized the treaty.', synonyms: ['approve', 'sanction', 'endorse'] },"],

  // oppose - keep 1974, fix 2401
  [2401, "oppose", "{ word: 'contest', definition: 'To challenge or dispute', example: 'Lawyers contested the evidence.', synonyms: ['challenge', 'dispute', 'resist'] },"],

  // dissuade - keep 2090, fix 2438
  [2438, "dissuade", "{ word: 'discourage', definition: 'To cause someone not to act', example: 'Warnings discouraged risky behavior.', synonyms: ['deter', 'prevent', 'stop'] },"],

  // invalidate - keep 2125, fix 2749
  [2749, "invalidate", "{ word: 'negate', definition: 'To make something void or null', example: 'Errors negated the results.', synonyms: ['nullify', 'void', 'annul'] },"],

  // theorize - keep 2149, fix 2753
  [2753, "theorize", "{ word: 'hypothesize', definition: 'To propose an explanation', example: 'Scientists hypothesize about causes.', synonyms: ['speculate', 'postulate', 'conjecture'] },"],

  // ameliorate - keep 2411, fix 2714
  [2714, "ameliorate", "{ word: 'improve', definition: 'To make something better', example: 'Policies improved conditions.', synonyms: ['enhance', 'better', 'boost'] },"],

  // inspect - keep 2422, fix 2424
  [2424, "inspect", "{ word: 'scrutinize', definition: 'To examine very carefully', example: 'Auditors scrutinize the records.', synonyms: ['examine', 'analyze', 'review'] },"],

  // attest - keep 2459, fix 2751
  [2751, "attest", "{ word: 'affirm', definition: 'To state something is true', example: 'Evidence affirms the conclusion.', synonyms: ['confirm', 'verify', 'certify'] },"],
];

let lines = content.split('\n');
let fixCount = 0;

for (const [lineNum, oldWord, replacementLine] of fixes) {
  const idx = lineNum - 1;
  const line = lines[idx];

  if (!line) {
    console.log(`Line ${lineNum}: does not exist`);
    continue;
  }

  const wordPattern = new RegExp(`word:\\s*['"]${oldWord}['"]`);
  if (wordPattern.test(line)) {
    const indent = line.match(/^\s*/)[0];
    lines[idx] = indent + replacementLine;
    fixCount++;
    console.log(`Fixed line ${lineNum}: "${oldWord}"`);
  } else {
    console.log(`SKIP line ${lineNum}: "${oldWord}" not found`);
  }
}

fs.writeFileSync(filePath, lines.join('\n'));
console.log(`\nFixed ${fixCount} words total`);

// Final comprehensive round - using unique words that don't appear anywhere else

const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'app/quiz/data/levels.ts');
let content = fs.readFileSync(filePath, 'utf-8');

const fixes = [
  // book - keep 281 (Classroom Objects), fix 1522 (Reservations)
  [1522, "book", "{ word: 'schedule', definition: 'To plan an appointment in advance', example: 'Schedule your visit early.', synonyms: ['arrange', 'plan', 'set'] },"],

  // counter - keep 597 (furniture), fix 2401 (discourse)
  [2401, "counter", "{ word: 'oppose', definition: 'To argue against something', example: 'The defense opposed the motion.', synonyms: ['contest', 'challenge', 'resist'] },"],

  // organize - keep 880, fix 2518
  [2518, "organize", "{ word: 'coordinate', definition: 'To bring parts together effectively', example: 'They coordinated the arrangements.', synonyms: ['manage', 'orchestrate', 'direct'] },"],

  // improve - keep 907, fix 2714
  [2714, "improve", "{ word: 'ameliorate', definition: 'To make a bad situation better', example: 'Reforms ameliorated living conditions.', synonyms: ['better', 'enhance', 'upgrade'] },"],

  // confirm - keep 917, fix 1919
  [1919, "confirm", "{ word: 'ratify', definition: 'To formally approve a decision', example: 'Members ratified the agreement.', synonyms: ['approve', 'endorse', 'sanction'] },"],

  // coordinate - keep 1145, fix 2330
  [2330, "coordinate", "{ word: 'synchronize', definition: 'To cause to happen at same time', example: 'Agencies synchronize regulations.', synonyms: ['align', 'time', 'match'] },"],

  // measure - keep 1406, fix 1848
  [1848, "measure", "{ word: 'quantify', definition: 'To express as a number', example: 'Studies quantify the impact.', synonyms: ['gauge', 'assess', 'calculate'] },"],

  // verify - keep 1475, fix 2751
  [2751, "verify", "{ word: 'attest', definition: 'To provide evidence for truth', example: 'Documents attest to the facts.', synonyms: ['confirm', 'certify', 'affirm'] },"],

  // deter - keep 1610, fix 2438
  [2438, "deter", "{ word: 'dissuade', definition: 'To convince someone not to act', example: 'Advisors dissuaded risky ventures.', synonyms: ['discourage', 'warn off', 'talk out of'] },"],

  // recommend - keep 1620, fix 1761
  [1761, "recommend", "{ word: 'propose', definition: 'To suggest for consideration', example: 'Experts propose new methods.', synonyms: ['suggest', 'advocate', 'advise'] },"],

  // contend - keep 1621, fix 2752
  [2752, "contend", "{ word: 'argue', definition: 'To give reasons for a position', example: 'Scholars argue different views.', synonyms: ['claim', 'maintain', 'assert'] },"],

  // balance - keep 1658, fix 1800
  [1800, "balance", "{ word: 'weigh', definition: 'To consider competing factors', example: 'Leaders weigh different options.', synonyms: ['consider', 'evaluate', 'assess'] },"],

  // decrease - keep 1703, fix 1880
  [1880, "decrease", "{ word: 'lessen', definition: 'To make something smaller', example: 'Time lessened the impact.', synonyms: ['reduce', 'diminish', 'shrink'] },"],

  // uphold - keep 1762, fix 1962
  [1962, "uphold", "{ word: 'sustain', definition: 'To support and keep going', example: 'Courts sustain legal standards.', synonyms: ['maintain', 'preserve', 'continue'] },"],

  // scrutinize - keep 1808, fix 2424
  [2424, "scrutinize", "{ word: 'inspect', definition: 'To look at something carefully', example: 'Auditors inspect the accounts.', synonyms: ['examine', 'check', 'review'] },"],

  // mediate - keep 1936, fix 2195
  [2195, "mediate", "{ word: 'negotiate', definition: 'To discuss terms for agreement', example: 'Lawyers negotiated terms.', synonyms: ['bargain', 'arrange', 'broker'] },"],

  // deduce - keep 1998, fix 2374
  [2374, "deduce", "{ word: 'conclude', definition: 'To reach a judgment through reasoning', example: 'Scientists conclude based on evidence.', synonyms: ['infer', 'derive', 'determine'] },"],

  // disprove - keep 2182, fix 2749
  [2749, "disprove", "{ word: 'invalidate', definition: 'To show something is not valid', example: 'New data invalidated the theory.', synonyms: ['negate', 'discredit', 'debunk'] },"],

  // expound - keep 2184, fix 2473
  [2473, "expound", "{ word: 'elucidate', definition: 'To make something clear by explaining', example: 'The guide elucidates complex topics.', synonyms: ['clarify', 'explain', 'illuminate'] },"],

  // substantiate - keep 2242, fix 2377
  [2377, "substantiate", "{ word: 'corroborate', definition: 'To support with additional evidence', example: 'Witnesses corroborate the account.', synonyms: ['confirm', 'verify', 'back up'] },"],

  // postulate - keep 2375, fix 2753
  [2753, "postulate", "{ word: 'theorize', definition: 'To form a theory about something', example: 'Scientists theorize about origins.', synonyms: ['hypothesize', 'speculate', 'suppose'] },"],
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

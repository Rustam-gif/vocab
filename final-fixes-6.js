// Sixth (final) round of fixes

const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'app/quiz/data/levels.ts');
let content = fs.readFileSync(filePath, 'utf-8');

const fixes = [
  // refute - keep 1823, fix 2401 and 2749
  [2401, "refute", "{ word: 'counter', definition: 'To respond with opposing argument', example: 'The defense countered every point.', synonyms: ['oppose', 'challenge', 'contradict'] },"],
  [2749, "refute", "{ word: 'disprove', definition: 'To show something is incorrect', example: 'Evidence disproved the hypothesis.', synonyms: ['negate', 'debunk', 'invalidate'] },"],

  // validate - keep 1845, fix 1919 and 2377
  [1919, "validate", "{ word: 'confirm', definition: 'To establish accuracy', example: 'Tests confirm the findings.', synonyms: ['verify', 'authenticate', 'check'] },"],
  [2377, "validate", "{ word: 'substantiate', definition: 'To provide supporting evidence', example: 'Data substantiates the claims.', synonyms: ['prove', 'verify', 'support'] },"],

  // arrange - keep 404, fix 2518
  [2518, "arrange", "{ word: 'organize', definition: 'To plan and coordinate', example: 'They organized the event smoothly.', synonyms: ['coordinate', 'set up', 'prepare'] },"],

  // reduce - keep 906, fix 1880
  [1880, "reduce", "{ word: 'decrease', definition: 'To make smaller in amount', example: 'Costs decreased significantly.', synonyms: ['lower', 'diminish', 'cut'] },"],

  // advise - keep 931, fix 1761
  [1761, "advise", "{ word: 'recommend', definition: 'To suggest as best course', example: 'Doctors recommend regular exercise.', synonyms: ['suggest', 'propose', 'urge'] },"],

  // reserve - keep 964, fix 1522
  [1522, "reserve", "{ word: 'book', definition: 'To arrange in advance', example: 'Book your tickets early.', synonyms: ['secure', 'hold', 'prearrange'] },"],

  // benchmark - keep 1216, fix 1848
  [1848, "benchmark", "{ word: 'measure', definition: 'To assess against standards', example: 'We measure performance monthly.', synonyms: ['gauge', 'evaluate', 'assess'] },"],

  // reconcile - keep 1277, fix 1800
  [1800, "reconcile", "{ word: 'balance', definition: 'To bring into agreement', example: 'Teams balance different priorities.', synonyms: ['harmonize', 'integrate', 'align'] },"],

  // enhance - keep 1465, fix 2714
  [2714, "enhance", "{ word: 'improve', definition: 'To make something better', example: 'Training improves outcomes.', synonyms: ['better', 'boost', 'upgrade'] },"],

  // maintain - keep 1706, fix 1962
  [1962, "maintain", "{ word: 'uphold', definition: 'To support and defend', example: 'Courts uphold legal principles.', synonyms: ['preserve', 'sustain', 'keep'] },"],

  // infer - keep 1798, fix 2374
  [2374, "infer", "{ word: 'deduce', definition: 'To conclude through reasoning', example: 'Scientists deduce patterns from data.', synonyms: ['derive', 'conclude', 'reason'] },"],

  // assert - keep 1820, fix 2752
  [2752, "assert", "{ word: 'contend', definition: 'To argue a point firmly', example: 'Critics contend the plan is flawed.', synonyms: ['claim', 'maintain', 'argue'] },"],

  // corroborate - keep 1833, fix 2751
  [2751, "corroborate", "{ word: 'verify', definition: 'To check truth of something', example: 'Records verify the account.', synonyms: ['confirm', 'validate', 'support'] },"],

  // hypothesize - keep 1834, fix 2753
  [2753, "hypothesize", "{ word: 'postulate', definition: 'To suggest without full proof', example: 'Researchers postulate new theories.', synonyms: ['theorize', 'suppose', 'speculate'] },"],

  // broker - keep 1857, fix 2195
  [2195, "broker", "{ word: 'mediate', definition: 'To help resolve a dispute', example: 'Lawyers mediated the agreement.', synonyms: ['negotiate', 'arbitrate', 'facilitate'] },"],

  // examine - keep 1997, fix 2424
  [2424, "examine", "{ word: 'scrutinize', definition: 'To look at very carefully', example: 'Auditors scrutinize the books.', synonyms: ['inspect', 'analyze', 'review'] },"],

  // elaborate - keep 2025, fix 2473
  [2473, "elaborate", "{ word: 'expound', definition: 'To explain in full detail', example: 'Professors expound on theories.', synonyms: ['expand', 'develop', 'clarify'] },"],

  // align - keep 2066, fix 2330
  [2330, "align", "{ word: 'coordinate', definition: 'To bring into proper arrangement', example: 'Agencies coordinate standards globally.', synonyms: ['harmonize', 'synchronize', 'integrate'] },"],

  // dissuade - keep 2090, fix 2438
  [2438, "dissuade", "{ word: 'deter', definition: 'To discourage someone from acting', example: 'Penalties deter violations.', synonyms: ['discourage', 'prevent', 'stop'] },"],
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

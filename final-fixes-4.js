// Fourth round of fixes for remaining duplicates

const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'app/quiz/data/levels.ts');
let content = fs.readFileSync(filePath, 'utf-8');

// [line_number, old_word_text, new word object]
const fixes = [
  // review - keep 346, fix 1390
  [1390, "review", "{ word: 'recap', definition: 'To summarize main points', example: 'Let us recap the key concepts.', synonyms: ['summarize', 'go over', 'revisit'] },"],

  // reduce - keep 906, fix 1880
  [1880, "reduce", "{ word: 'curtail', definition: 'To cut back on something', example: 'Budget cuts curtailed spending.', synonyms: ['decrease', 'limit', 'trim'] },"],

  // confirm - keep 917, fix 2377
  [2377, "confirm", "{ word: 'substantiate', definition: 'To provide supporting evidence', example: 'Data substantiates the claims.', synonyms: ['verify', 'prove', 'validate'] },"],

  // advise - keep 931, fix 1761
  [1761, "advise", "{ word: 'counsel', definition: 'To give professional guidance', example: 'Mentors counsel new employees.', synonyms: ['guide', 'recommend', 'direct'] },"],

  // reserve - keep 964, fix 1367
  [1367, "reserve", "{ word: 'prebook', definition: 'To book well in advance', example: 'Prebook your accommodation early.', synonyms: ['hold', 'secure', 'arrange'] },"],

  // reconcile - keep 1277, fix 1800
  [1800, "reconcile", "{ word: 'harmonize', definition: 'To make things work together', example: 'Teams harmonize differing views.', synonyms: ['balance', 'integrate', 'align'] },"],

  // refresh - keep 1451, fix 1644
  [1644, "refresh", "{ word: 'reload', definition: 'To load something again', example: 'Reload the page to see updates.', synonyms: ['renew', 'update', 'restart'] },"],

  // ready - keep 1693, fix 2518
  [2518, "ready", "{ word: 'prepare', definition: 'To make something ready', example: 'They prepared the materials carefully.', synonyms: ['set up', 'arrange', 'organize'] },"],

  // supersede - keep 1704, fix 2364
  [2364, "supersede", "{ word: 'displace', definition: 'To take the position of something', example: 'New regulations displace old ones.', synonyms: ['replace', 'supplant', 'succeed'] },"],

  // maintain - keep 1706, fix 1762
  [1762, "maintain", "{ word: 'uphold', definition: 'To support or defend something', example: 'They uphold high standards.', synonyms: ['preserve', 'sustain', 'continue'] },"],

  // predict - keep 1747, fix 2376
  [2376, "predict", "{ word: 'foresee', definition: 'To see what will happen in future', example: 'Analysts foresee steady growth.', synonyms: ['anticipate', 'forecast', 'expect'] },"],

  // gauge - keep 1796, fix 1848
  [1848, "gauge", "{ word: 'measure', definition: 'To determine size or amount', example: 'We measure progress monthly.', synonyms: ['assess', 'quantify', 'evaluate'] },"],

  // infer - keep 1798, fix 2374
  [2374, "infer", "{ word: 'deduce', definition: 'To conclude through logic', example: 'Scientists deduce causes from effects.', synonyms: ['derive', 'reason', 'conclude'] },"],

  // assert - keep 1820, fix 2752
  [2752, "assert", "{ word: 'contend', definition: 'To argue firmly', example: 'Critics contend the policy failed.', synonyms: ['claim', 'maintain', 'declare'] },"],

  // refute - keep 1823, fix 2749
  [2749, "refute", "{ word: 'disprove', definition: 'To show something is false', example: 'Evidence disproved the theory.', synonyms: ['negate', 'contradict', 'debunk'] },"],

  // differentiate - keep 1832, fix 2294
  [2294, "differentiate", "{ word: 'distinguish', definition: 'To recognize differences between', example: 'The test distinguishes minor from major issues.', synonyms: ['separate', 'tell apart', 'discriminate'] },"],

  // corroborate - keep 1833, fix 2751
  [2751, "corroborate", "{ word: 'verify', definition: 'To check the truth of something', example: 'Records verify the account.', synonyms: ['confirm', 'validate', 'support'] },"],

  // validate - keep 1845, fix 1919
  [1919, "validate", "{ word: 'confirm', definition: 'To establish something is true', example: 'Tests confirm the hypothesis.', synonyms: ['verify', 'prove', 'authenticate'] },"],

  // amend - keep 1858, fix 1871
  [1871, "amend", "{ word: 'modify', definition: 'To make changes to a document', example: 'Congress modified the bill.', synonyms: ['alter', 'update', 'revise'] },"],

  // mediate - keep 1936, fix 2195
  [2195, "mediate", "{ word: 'negotiate', definition: 'To discuss terms for agreement', example: 'Lawyers negotiated a settlement.', synonyms: ['arrange', 'broker', 'facilitate'] },"],

  // examine - keep 1997, fix 2424
  [2424, "examine", "{ word: 'scrutinize', definition: 'To look at very carefully', example: 'Auditors scrutinize the records.', synonyms: ['inspect', 'analyze', 'review'] },"],

  // elaborate - keep 2025, fix 2473
  [2473, "elaborate", "{ word: 'expound', definition: 'To explain in great detail', example: 'Professors expound on theories.', synonyms: ['expand', 'clarify', 'describe'] },"],

  // align - keep 2066, fix 2330
  [2330, "align", "{ word: 'harmonize', definition: 'To bring into agreement', example: 'Agencies harmonize standards internationally.', synonyms: ['coordinate', 'reconcile', 'integrate'] },"],

  // dissuade - keep 2090, fix 2438
  [2438, "dissuade", "{ word: 'deter', definition: 'To discourage an action', example: 'Warnings deter risky shortcuts.', synonyms: ['discourage', 'prevent', 'inhibit'] },"],

  // rebut - keep 2243, fix 2401
  [2401, "rebut", "{ word: 'counter', definition: 'To respond with opposing argument', example: 'Defense countered each point.', synonyms: ['contradict', 'oppose', 'challenge'] },"],

  // postulate - keep 2375, fix 2753
  [2753, "postulate", "{ word: 'theorize', definition: 'To form a theory about something', example: 'Scientists theorize about dark matter.', synonyms: ['hypothesize', 'speculate', 'suppose'] },"],

  // ameliorate - keep 2411, fix 2714
  [2714, "ameliorate", "{ word: 'improve', definition: 'To make something better', example: 'Reforms improved conditions.', synonyms: ['enhance', 'better', 'boost'] },"],

  // estimate - keep 2426, fix 2704
  [2704, "estimate", "{ word: 'approximate', definition: 'To calculate roughly', example: 'Models approximate missing values.', synonyms: ['calculate', 'gauge', 'reckon'] },"],
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

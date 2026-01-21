// Final round of fixes - fixing duplicates created by previous fixes

const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'app/quiz/data/levels.ts');
let content = fs.readFileSync(filePath, 'utf-8');

// [line_number, old_word_text, new word object]
const fixes = [
  // review - keep 346, fix 1390
  [1390, "review", "{ word: 'study', definition: 'To learn by reading and practicing', example: 'Students study notes before exams.', synonyms: ['learn', 'examine', 'analyze'] },"],

  // counter - keep 597, fix 2401
  [2401, "counter", "{ word: 'rebut', definition: 'To argue against with evidence', example: 'Defense rebutted every accusation.', synonyms: ['contradict', 'challenge', 'dispute'] },"],

  // organize - keep 880, fix 2518
  [2518, "organize", "{ word: 'prepare', definition: 'To make ready in advance', example: 'They prepared the meeting room carefully.', synonyms: ['ready', 'arrange', 'set up'] },"],

  // recover - keep 905, fix 1463
  [1463, "recover", "{ word: 'heal', definition: 'To become healthy again', example: 'She healed fully after surgery.', synonyms: ['mend', 'recuperate', 'convalesce'] },"],

  // improve - keep 907, fix 2714
  [2714, "improve", "{ word: 'ameliorate', definition: 'To make a situation better', example: 'Reforms ameliorated conditions.', synonyms: ['better', 'enhance', 'boost'] },"],

  // reserve - keep 964, fix 1367
  [1367, "reserve", "{ word: 'book', definition: 'To arrange accommodation in advance', example: 'Book your hotel early.', synonyms: ['secure', 'hold', 'prearrange'] },"],

  // upgrade - keep 966, fix 1451
  [1451, "upgrade", "{ word: 'update', definition: 'To install the latest version', example: 'Update your software regularly.', synonyms: ['refresh', 'renew', 'modernize'] },"],

  // acknowledge - keep 1132, fix 2750
  [2750, "acknowledge", "{ word: 'admit', definition: 'To accept something is true', example: 'She admitted the oversight.', synonyms: ['concede', 'recognize', 'accept'] },"],

  // timetable - keep 1190, fix 1474
  [1474, "timetable", "{ word: 'slate', definition: 'To plan something for a time', example: 'The meeting is slated for Tuesday.', synonyms: ['schedule', 'plan', 'book'] },"],

  // evaluate - keep 1213, fix 1796
  [1796, "evaluate", "{ word: 'gauge', definition: 'To measure or assess value', example: 'Experts gauge the impact carefully.', synonyms: ['measure', 'assess', 'determine'] },"],

  // initiative - keep 1238, fix 1297
  [1297, "initiative", "{ word: 'program', definition: 'An organized effort or scheme', example: 'The marketing program boosted awareness.', synonyms: ['campaign', 'drive', 'effort'] },"],

  // reconcile - keep 1277, fix 1800
  [1800, "reconcile", "{ word: 'balance', definition: 'To bring into agreement', example: 'Teams balance conflicting demands.', synonyms: ['align', 'integrate', 'harmonize'] },"],

  // motivate - keep 1349, fix 1750
  [1750, "motivate", "{ word: 'encourage', definition: 'To give support and confidence', example: 'Managers encourage their teams.', synonyms: ['inspire', 'spur', 'stimulate'] },"],

  // verify - keep 1475, fix 1919
  [1919, "verify", "{ word: 'confirm', definition: 'To establish something is true', example: 'Tests confirm the hypothesis.', synonyms: ['validate', 'check', 'establish'] },"],

  // reimburse - keep 1499, fix 2052
  [2052, "reimburse", "{ word: 'repay', definition: 'To pay back money owed', example: 'Please repay travel costs within a week.', synonyms: ['compensate', 'refund', 'return'] },"],

  // convince - keep 1510, fix 1622
  [1622, "convince", "{ word: 'sway', definition: 'To influence someone\'s opinion', example: 'Data swayed the skeptics.', synonyms: ['persuade', 'win over', 'influence'] },"],

  // refine - keep 1607, fix 1920
  [1920, "refine", "{ word: 'hone', definition: 'To sharpen or improve skills', example: 'Writers hone their craft over time.', synonyms: ['perfect', 'polish', 'fine-tune'] },"],

  // adapt - keep 1608, fix 1947
  [1947, "adapt", "{ word: 'modify', definition: 'To change to suit conditions', example: 'Teams modify strategies as needed.', synonyms: ['alter', 'tailor', 'revise'] },"],

  // deter - keep 1610, fix 2090
  [2090, "deter", "{ word: 'dissuade', definition: 'To persuade not to do something', example: 'Warnings dissuaded risky behavior.', synonyms: ['discourage', 'prevent', 'stop'] },"],

  // recommend - keep 1620, fix 1761
  [1761, "recommend", "{ word: 'suggest', definition: 'To propose a course of action', example: 'Experts suggest regular check-ups.', synonyms: ['propose', 'advise', 'urge'] },"],

  // contend - keep 1621, fix 2752
  [2752, "contend", "{ word: 'assert', definition: 'To state something firmly', example: 'Critics assert the plan is flawed.', synonyms: ['claim', 'declare', 'maintain'] },"],

  // sustain - keep 1670, fix 1762
  [1762, "sustain", "{ word: 'maintain', definition: 'To keep at a steady level', example: 'They maintain high standards.', synonyms: ['preserve', 'uphold', 'continue'] },"],

  // decrease - keep 1703, fix 1880
  [1880, "decrease", "{ word: 'diminish', definition: 'To become smaller or less', example: 'Interest diminished over time.', synonyms: ['reduce', 'lessen', 'shrink'] },"],

  // supersede - keep 1704, fix 2364
  [2364, "supersede", "{ word: 'replace', definition: 'To take the place of', example: 'New rules replace old ones.', synonyms: ['supplant', 'displace', 'succeed'] },"],

  // contrast - keep 1774, fix 1832
  [1832, "contrast", "{ word: 'differentiate', definition: 'To show differences between', example: 'The study differentiates methods.', synonyms: ['distinguish', 'separate', 'discriminate'] },"],

  // vindicate - keep 1786, fix 2461
  [2461, "vindicate", "{ word: 'clear', definition: 'To free from blame or suspicion', example: 'Evidence cleared the defendant.', synonyms: ['exonerate', 'absolve', 'acquit'] },"],

  // articulate - keep 1799, fix 2702
  [2702, "articulate", "{ word: 'convey', definition: 'To communicate ideas clearly', example: 'She conveyed her vision effectively.', synonyms: ['express', 'voice', 'communicate'] },"],

  // hypothesize - keep 1834, fix 2753
  [2753, "hypothesize", "{ word: 'postulate', definition: 'To suggest as a basis for reasoning', example: 'Researchers postulate new theories.', synonyms: ['theorize', 'suppose', 'speculate'] },"],

  // validate - keep 1845, fix 2377
  [2377, "validate", "{ word: 'verify', definition: 'To prove something is true', example: 'Tests verify the hypothesis.', synonyms: ['confirm', 'prove', 'authenticate'] },"],

  // compile - keep 1846, fix 2354
  [2354, "compile", "{ word: 'aggregate', definition: 'To gather into a collection', example: 'Teams aggregate data for analysis.', synonyms: ['collect', 'assemble', 'accumulate'] },"],

  // broker - keep 1857, fix 2195
  [2195, "broker", "{ word: 'mediate', definition: 'To help settle a dispute', example: 'Lawyers mediated the settlement.', synonyms: ['negotiate', 'arrange', 'facilitate'] },"],

  // amend - keep 1858, fix 1871
  [1871, "amend", "{ word: 'revise', definition: 'To change or correct a document', example: 'Congress revised the legislation.', synonyms: ['modify', 'alter', 'update'] },"],

  // project - keep 1859, fix 2376
  [2376, "project", "{ word: 'predict', definition: 'To say what will happen', example: 'Analysts predict growth.', synonyms: ['forecast', 'anticipate', 'estimate'] },"],

  // synchronize - keep 1860, fix 2066
  [2066, "synchronize", "{ word: 'coordinate', definition: 'To make things happen together', example: 'Teams coordinate schedules globally.', synonyms: ['align', 'time', 'harmonize'] },"],

  // accelerate - keep 1908, fix 2717
  [2717, "accelerate", "{ word: 'hasten', definition: 'To make something happen faster', example: 'New processes hasten approvals.', synonyms: ['quicken', 'expedite', 'speed up'] },"],

  // appraise - keep 1971, fix 2424
  [2424, "appraise", "{ word: 'assess', definition: 'To evaluate quality or worth', example: 'Experts assess the situation.', synonyms: ['evaluate', 'judge', 'rate'] },"],

  // deduce - keep 1998, fix 2374
  [2374, "deduce", "{ word: 'infer', definition: 'To conclude from evidence', example: 'We infer trends from data.', synonyms: ['derive', 'reason', 'conclude'] },"],

  // restrict - keep 2079, fix 2306
  [2306, "restrict", "{ word: 'limit', definition: 'To set bounds on something', example: 'Budgets limit spending options.', synonyms: ['constrain', 'confine', 'curb'] },"],

  // authenticate - keep 2123, fix 2458
  [2458, "authenticate", "{ word: 'certify', definition: 'To officially confirm something', example: 'Systems certify user identity.', synonyms: ['verify', 'validate', 'confirm'] },"],

  // ratify - keep 2136, fix 2363
  [2363, "ratify", "{ word: 'approve', definition: 'To give official consent', example: 'Members approve the proposal.', synonyms: ['sanction', 'confirm', 'authorize'] },"],

  // disprove - keep 2182, fix 2749
  [2749, "disprove", "{ word: 'refute', definition: 'To prove a claim is false', example: 'Evidence refuted the accusations.', synonyms: ['rebut', 'negate', 'contradict'] },"],

  // expound - keep 2184, fix 2473
  [2473, "expound", "{ word: 'elaborate', definition: 'To explain in more detail', example: 'Professors elaborate on theories.', synonyms: ['expand', 'clarify', 'describe'] },"],

  // specify - keep 2185, fix 2400
  [2400, "specify", "{ word: 'detail', definition: 'To give full information about', example: 'Guidelines detail requirements.', synonyms: ['describe', 'list', 'outline'] },"],

  // interpolate - keep 2208, fix 2704
  [2704, "interpolate", "{ word: 'estimate', definition: 'To calculate approximate values', example: 'Models estimate missing data.', synonyms: ['approximate', 'calculate', 'gauge'] },"],

  // substantiate - keep 2242, fix 2751
  [2751, "substantiate", "{ word: 'corroborate', definition: 'To support with evidence', example: 'Records corroborate the claims.', synonyms: ['confirm', 'verify', 'support'] },"],
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

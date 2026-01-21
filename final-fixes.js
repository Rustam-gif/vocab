// Final fixes for remaining duplicates

const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'app/quiz/data/levels.ts');
let content = fs.readFileSync(filePath, 'utf-8');

// Each entry: [line_number, search_snippet, replacement_snippet]
// We use surrounding context to ensure unique matches
const fixes = [
  // revise - keep 644, fix 1390 and 1871
  [1390, "{ word: 'revise',", "{ word: 'review', definition: 'To look over material again to learn', example: 'Students review notes before exams.', synonyms: ['reread', 'go over', 'study'] },"],
  [1871, "{ word: 'revise',", "{ word: 'amend', definition: 'To make changes to legal documents', example: 'Lawmakers amended the draft bill.', synonyms: ['modify', 'alter', 'update'] },"],

  // confirm - keep 917, fix 1919 and 2377
  [1919, "{ word: 'confirm',", "{ word: 'verify', definition: 'To check that something is correct', example: 'Please verify your details before submitting.', synonyms: ['validate', 'check', 'authenticate'] },"],
  [2377, "{ word: 'confirm',", "{ word: 'validate', definition: 'To prove something is accurate', example: 'Tests validate the hypothesis.', synonyms: ['verify', 'prove', 'authenticate'] },"],

  // advise - keep 931, fix 1489 and 1761
  [1489, "{ word: 'advise',", "{ word: 'counsel', definition: 'To give professional guidance', example: 'Lawyers counsel clients carefully.', synonyms: ['guide', 'direct', 'recommend'] },"],
  [1761, "{ word: 'advise',", "{ word: 'recommend', definition: 'To suggest a course of action', example: 'Experts recommend regular exercise.', synonyms: ['propose', 'suggest', 'urge'] },"],

  // corroborate - keep 1833, fix 2123 and 2705
  [2123, "{ word: 'corroborate',", "{ word: 'authenticate', definition: 'To prove something is genuine', example: 'Experts authenticated the signature.', synonyms: ['verify', 'certify', 'validate'] },"],
  [2705, "{ word: 'corroborate',", "{ word: 'affirm', definition: 'To state something as fact', example: 'Evidence affirmed the diagnosis.', synonyms: ['confirm', 'attest', 'support'] },"],

  // book - keep 281, fix 1367
  [1367, "{ word: 'book',", "{ word: 'reserve', definition: 'To arrange in advance for later use', example: 'Reserve your tickets early.', synonyms: ['secure', 'hold', 'prearrange'] },"],

  // allocate - keep 357, fix 1785
  [1785, "{ word: 'allocate',", "{ word: 'apportion', definition: 'To divide and share resources', example: 'The committee apportions funds quarterly.', synonyms: ['distribute', 'divide', 'allot'] },"],

  // justify - keep 358, fix 1786
  [1786, "{ word: 'justify',", "{ word: 'vindicate', definition: 'To clear from accusation', example: 'The evidence vindicated his claims.', synonyms: ['defend', 'support', 'uphold'] },"],

  // lend - keep 401, fix 1773
  [1773, "{ word: 'lend',", "{ word: 'loan', definition: 'To give something temporarily', example: 'Banks loan money with interest.', synonyms: ['advance', 'provide', 'supply'] },"],

  // compare - keep 402, fix 1774
  [1774, "{ word: 'compare',", "{ word: 'contrast', definition: 'To show differences between things', example: 'The report contrasts two approaches.', synonyms: ['differentiate', 'distinguish', 'juxtapose'] },"],

  // explain - keep 403, fix 2473
  [2473, "{ word: 'explain',", "{ word: 'expound', definition: 'To describe in great detail', example: 'Professors expound on complex theories.', synonyms: ['elaborate', 'clarify', 'describe'] },"],

  // arrange - keep 404, fix 2518
  [2518, "{ word: 'arrange',", "{ word: 'organize', definition: 'To plan and coordinate activities', example: 'They organized the meeting carefully.', synonyms: ['coordinate', 'prepare', 'set up'] },"],

  // prepare - keep 424, fix 1693
  [1693, "{ word: 'prepare',", "{ word: 'ready', definition: 'To make something prepared for use', example: 'Staff ready the conference room early.', synonyms: ['set up', 'organize', 'arrange'] },"],

  // assess - keep 641, fix 1796
  [1796, "{ word: 'assess',", "{ word: 'evaluate', definition: 'To judge quality or worth', example: 'Experts evaluate applications fairly.', synonyms: ['appraise', 'gauge', 'measure'] },"],

  // campaign - keep 692, fix 1297
  [1297, "{ word: 'campaign',", "{ word: 'initiative', definition: 'An organized effort for a cause', example: 'The marketing initiative boosted sales.', synonyms: ['drive', 'program', 'effort'] },"],

  // advertise - keep 884, fix 1442
  [1442, "{ word: 'advertise',", "{ word: 'publicize', definition: 'To make something widely known', example: 'They publicized events on social media.', synonyms: ['promote', 'announce', 'broadcast'] },"],

  // update - keep 893, fix 1451
  [1451, "{ word: 'update',", "{ word: 'upgrade', definition: 'To improve to a better version', example: 'Upgrade your software regularly.', synonyms: ['improve', 'enhance', 'modernize'] },"],

  // attach - keep 896, fix 1454
  [1454, "{ word: 'attach',", "{ word: 'append', definition: 'To add something at the end', example: 'Append documents to your email.', synonyms: ['add', 'include', 'join'] },"],

  // reduce - keep 906, fix 1880
  [1880, "{ word: 'reduce',", "{ word: 'decrease', definition: 'To make something smaller', example: 'Budget cuts decreased spending.', synonyms: ['lower', 'diminish', 'cut'] },"],

  // schedule - keep 916, fix 1474
  [1474, "{ word: 'schedule',", "{ word: 'timetable', definition: 'To plan when events happen', example: 'Please timetable the meetings carefully.', synonyms: ['plan', 'program', 'slot'] },"],

  // forbid - keep 930, fix 2037
  [2037, "{ word: 'forbid',", "{ word: 'ban', definition: 'To officially not allow something', example: 'Rules ban smoking on premises.', synonyms: ['prohibit', 'bar', 'disallow'] },"],

  // request - keep 932, fix 1048
  [1048, "{ word: 'request',", "{ word: 'ask for', definition: 'To politely ask for something', example: 'Guests can ask for special meals.', synonyms: ['solicit', 'seek', 'inquire'] },"],

  // refund - keep 941, fix 1499
  [1499, "{ word: 'refund',", "{ word: 'reimburse', definition: 'To pay back expenses incurred', example: 'Companies reimburse travel costs.', synonyms: ['repay', 'compensate', 'return'] },"],

  // replace - keep 942, fix 2364
  [2364, "{ word: 'replace',", "{ word: 'supersede', definition: 'To take the place of something', example: 'New policies supersede old ones.', synonyms: ['supplant', 'displace', 'succeed'] },"],

  // persuade - keep 952, fix 1622
  [1622, "{ word: 'persuade',", "{ word: 'convince', definition: 'To cause someone to believe', example: 'Data convinced the skeptics.', synonyms: ['sway', 'win over', 'influence'] },"],

  // argue - keep 953, fix 2752
  [2752, "{ word: 'argue',", "{ word: 'contend', definition: 'To assert something firmly', example: 'Critics contend the plan is flawed.', synonyms: ['assert', 'claim', 'maintain'] },"],

  // reserve - keep 964, fix 1522
  [1522, "{ word: 'reserve',", "{ word: 'prebook', definition: 'To book something well in advance', example: 'Prebook tickets to avoid disappointment.', synonyms: ['arrange early', 'preorder', 'secure'] },"],

  // assemble - keep 976, fix 2354
  [2354, "{ word: 'assemble',", "{ word: 'compile', definition: 'To gather and organize material', example: 'Researchers compile data carefully.', synonyms: ['collect', 'gather', 'aggregate'] },"],

  // adjust - keep 977, fix 1947
  [1947, "{ word: 'adjust',", "{ word: 'adapt', definition: 'To change to suit conditions', example: 'Teams adapt strategies as needed.', synonyms: ['modify', 'alter', 'tailor'] },"],

  // polish - keep 980, fix 1920
  [1920, "{ word: 'polish',", "{ word: 'refine', definition: 'To improve through small changes', example: 'Writers refine drafts carefully.', synonyms: ['perfect', 'hone', 'fine-tune'] },"],

  // inspire - keep 1061, fix 1349
  [1349, "{ word: 'inspire',", "{ word: 'motivate', definition: 'To give someone reason to act', example: 'Good leaders motivate their teams.', synonyms: ['encourage', 'spur', 'drive'] },"],

  // coordinate - keep 1145, fix 2066
  [2066, "{ word: 'coordinate',", "{ word: 'synchronize', definition: 'To make things happen together', example: 'Teams synchronize schedules globally.', synonyms: ['align', 'time', 'harmonize'] },"],

  // negotiate - keep 1201, fix 2195
  [2195, "{ word: 'negotiate',", "{ word: 'broker', definition: 'To arrange deals between parties', example: 'Lawyers brokered the settlement.', synonyms: ['arrange', 'mediate', 'facilitate'] },"],

  // evaluate - keep 1213, fix 1971
  [1971, "{ word: 'evaluate',", "{ word: 'appraise', definition: 'To assess value or quality', example: 'Experts appraised the collection.', synonyms: ['judge', 'rate', 'gauge'] },"],

  // forecast - keep 1239, fix 2376
  [2376, "{ word: 'forecast',", "{ word: 'project', definition: 'To estimate future outcomes', example: 'Analysts project economic growth.', synonyms: ['predict', 'anticipate', 'estimate'] },"],

  // recuperate - keep 1380, fix 1463
  [1463, "{ word: 'recuperate',", "{ word: 'recover', definition: 'To regain health after illness', example: 'She recovered fully after surgery.', synonyms: ['heal', 'convalesce', 'mend'] },"],

  // enhance - keep 1465, fix 2714
  [2714, "{ word: 'enhance',", "{ word: 'improve', definition: 'To make something better', example: 'Training improves performance.', synonyms: ['better', 'upgrade', 'boost'] },"],

  // verify - keep 1475, fix 2751
  [2751, "{ word: 'verify',", "{ word: 'substantiate', definition: 'To provide supporting evidence', example: 'Data substantiates the claims.', synonyms: ['confirm', 'validate', 'support'] },"],

  // dispatch - keep 1501, fix 1764
  [1764, "{ word: 'dispatch',", "{ word: 'deliver', definition: 'To send goods to destination', example: 'We deliver orders promptly.', synonyms: ['ship', 'forward', 'send'] },"],

  // maintain - keep 1706, fix 1762
  [1762, "{ word: 'maintain',", "{ word: 'sustain', definition: 'To keep at a steady level', example: 'They sustain high standards.', synonyms: ['preserve', 'uphold', 'continue'] },"],

  // harmonize - keep 1776, fix 1800
  [1800, "{ word: 'harmonize',", "{ word: 'reconcile', definition: 'To make conflicting things compatible', example: 'Teams reconcile different viewpoints.', synonyms: ['balance', 'integrate', 'align'] },"],

  // concede - keep 1787, fix 2750
  [2750, "{ word: 'concede',", "{ word: 'acknowledge', definition: 'To accept or admit something', example: 'She acknowledged the error.', synonyms: ['admit', 'recognize', 'accept'] },"],

  // infer - keep 1798, fix 2374
  [2374, "{ word: 'infer',", "{ word: 'deduce', definition: 'To conclude through reasoning', example: 'Scientists deduce causes from data.', synonyms: ['derive', 'reason', 'conclude'] },"],

  // assert - keep 1820, fix 1960
  [1960, "{ word: 'assert',", "{ word: 'declare', definition: 'To state something formally', example: 'The CEO declared new priorities.', synonyms: ['announce', 'proclaim', 'state'] },"],

  // yield - keep 1821, fix 2196
  [2196, "{ word: 'yield',", "{ word: 'relent', definition: 'To finally agree after resisting', example: 'They relented under pressure.', synonyms: ['give in', 'submit', 'surrender'] },"],

  // refute - keep 1823, fix 2749
  [2749, "{ word: 'refute',", "{ word: 'disprove', definition: 'To prove something is false', example: 'Experiments disproved the theory.', synonyms: ['negate', 'contradict', 'debunk'] },"],

  // constrain - keep 1835, fix 2306
  [2306, "{ word: 'constrain',", "{ word: 'restrict', definition: 'To limit actions or options', example: 'Budgets restrict spending choices.', synonyms: ['limit', 'confine', 'curb'] },"],

  // correlate - keep 1844, fix 2425
  [2425, "{ word: 'correlate',", "{ word: 'relate', definition: 'To show connection between things', example: 'Studies relate diet to health.', synonyms: ['connect', 'link', 'associate'] },"],

  // expedite - keep 1958, fix 2717
  [2717, "{ word: 'expedite',", "{ word: 'accelerate', definition: 'To make something happen faster', example: 'New processes accelerate approvals.', synonyms: ['hasten', 'quicken', 'speed up'] },"],

  // oppose - keep 1974, fix 2401
  [2401, "{ word: 'oppose',", "{ word: 'counter', definition: 'To respond with opposing argument', example: 'Defense countered every point.', synonyms: ['contradict', 'challenge', 'dispute'] },"],

  // discourage - keep 1987, fix 2090
  [2090, "{ word: 'discourage',", "{ word: 'deter', definition: 'To make someone less likely to act', example: 'High prices deter some buyers.', synonyms: ['dissuade', 'prevent', 'inhibit'] },"],

  // sanction - keep 2036, fix 2363
  [2363, "{ word: 'sanction',", "{ word: 'ratify', definition: 'To formally approve an agreement', example: 'Members ratified the treaty.', synonyms: ['approve', 'confirm', 'authorize'] },"],

  // extrapolate - keep 2122, fix 2704
  [2704, "{ word: 'extrapolate',", "{ word: 'interpolate', definition: 'To estimate values between known points', example: 'Scientists interpolate missing data.', synonyms: ['calculate', 'derive', 'estimate'] },"],

  // theorize - keep 2149, fix 2753
  [2753, "{ word: 'theorize',", "{ word: 'hypothesize', definition: 'To propose a tentative explanation', example: 'Researchers hypothesize about causes.', synonyms: ['speculate', 'conjecture', 'postulate'] },"],

  // stipulate - keep 2194, fix 2400
  [2400, "{ word: 'stipulate',", "{ word: 'specify', definition: 'To state requirements clearly', example: 'Guidelines specify acceptable formats.', synonyms: ['define', 'prescribe', 'detail'] },"],

  // express - keep 2398, fix 2702
  [2702, "{ word: 'express',", "{ word: 'articulate', definition: 'To express ideas precisely', example: 'She articulated her vision clearly.', synonyms: ['convey', 'voice', 'state'] },"],
];

// Process each fix
let lines = content.split('\n');
let fixCount = 0;

for (const [lineNum, searchText, replacementLine] of fixes) {
  const idx = lineNum - 1;
  const line = lines[idx];

  if (!line) {
    console.log(`Line ${lineNum}: does not exist`);
    continue;
  }

  if (line.includes(searchText.replace("{ word: '", '').replace("',", ''))) {
    // Extract word from searchText
    const wordMatch = searchText.match(/word: '([^']+)'/);
    const oldWord = wordMatch ? wordMatch[1] : 'unknown';

    // Replace the line with the new content, preserving indentation
    const indent = line.match(/^\s*/)[0];
    lines[idx] = indent + replacementLine;
    fixCount++;
    console.log(`Fixed line ${lineNum}: "${oldWord}"`);
  } else {
    console.log(`SKIP line ${lineNum}: search text not found`);
    console.log(`  Looking for: ${searchText.substring(0, 40)}...`);
    console.log(`  Found: ${line.substring(0, 60)}...`);
  }
}

// Write the updated file
fs.writeFileSync(filePath, lines.join('\n'));
console.log(`\nFixed ${fixCount} words total`);

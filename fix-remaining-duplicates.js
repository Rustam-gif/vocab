// Script to fix remaining duplicate words in levels.ts

const fs = require('fs');
const path = require('path');

// Read the levels.ts file
const filePath = path.join(__dirname, 'app/quiz/data/levels.ts');
let content = fs.readFileSync(filePath, 'utf-8');

// All the targeted replacements for remaining duplicates
// Format: [lineNum, oldWord, replacement object]
const fixes = [
  // compare - keep line 402, replace 1774 and 2425
  [1774, 'compare', { word: 'contrast', definition: 'To show differences between two things', example: 'The report contrasts urban and rural lifestyles.', synonyms: ['differentiate', 'distinguish', 'juxtapose'] }],
  [2425, 'compare', { word: 'correlate', definition: 'To show connection between variables', example: 'Studies correlate diet with health outcomes.', synonyms: ['relate', 'connect', 'link'] }],

  // counter - keep line 597, replace 1896 and 2401
  [1896, 'counter', { word: 'rebuff', definition: 'To reject an argument or suggestion firmly', example: 'The board rebuffed the takeover proposal.', synonyms: ['reject', 'dismiss', 'spurn'] }],
  [2401, 'counter', { word: 'oppose', definition: 'To argue against something strongly', example: 'Lawyers opposed the motion in court.', synonyms: ['contradict', 'challenge', 'dispute'] }],

  // interrupt - all 3 need fixing with unique values
  [955, 'interrupt', { word: 'disrupt', definition: 'To break the continuity of something', example: 'Noise disrupts concentration during study.', synonyms: ['disturb', 'interfere', 'impede'] }],
  [1513, 'interrupt', { word: 'interject', definition: 'To insert a comment during conversation', example: 'She interjected with an important point.', synonyms: ['cut in', 'intervene', 'butt in'] }],
  [1679, 'interrupt', { word: 'intrude', definition: 'To enter without being invited or welcome', example: 'Sorry to intrude on your meeting.', synonyms: ['barge in', 'impose', 'encroach'] }],

  // reserve - keep 964, replace 1367 and 1522
  [1367, 'reserve', { word: 'book', definition: 'To arrange in advance for a service', example: 'Book your flight early for better prices.', synonyms: ['secure', 'hold', 'prearrange'] }],
  [1522, 'reserve', { word: 'prebook', definition: 'To book something well in advance', example: 'Prebook tickets to avoid disappointment.', synonyms: ['reserve ahead', 'arrange early', 'preorder'] }],

  // order - keep 988, replace 1048 and 1546
  [1048, 'order', { word: 'request', definition: 'To ask for something formally', example: 'Guests can request special meals in advance.', synonyms: ['ask for', 'solicit', 'petition'] }],
  [1546, 'order', { word: 'place', definition: 'To submit a request for food or goods', example: 'Place your order before the kitchen closes.', synonyms: ['submit', 'put in', 'make'] }],

  // stir - keep 992, replace 1052 and 1550
  [1052, 'stir', { word: 'whisk', definition: 'To beat ingredients quickly with a fork', example: 'Whisk the eggs until fluffy and light.', synonyms: ['beat', 'whip', 'blend'] }],
  [1550, 'stir', { word: 'fold', definition: 'To mix gently with lifting motions', example: 'Fold the flour into the batter gently.', synonyms: ['incorporate', 'combine', 'blend'] }],

  // forgive - keep 1002, replace 1062 and 1560
  [1062, 'forgive', { word: 'pardon', definition: 'To excuse someone for their mistake', example: 'Please pardon the late response.', synonyms: ['excuse', 'absolve', 'overlook'] }],
  [1560, 'forgive', { word: 'absolve', definition: 'To free someone from blame or guilt', example: 'The evidence absolved him of charges.', synonyms: ['clear', 'exonerate', 'acquit'] }],

  // praise - keep 1003, replace 1063 and 1561
  [1063, 'praise', { word: 'commend', definition: 'To express approval for achievement', example: 'The manager commended her work.', synonyms: ['applaud', 'congratulate', 'acclaim'] }],
  [1561, 'praise', { word: 'acclaim', definition: 'To praise enthusiastically and publicly', example: 'Critics acclaimed the film warmly.', synonyms: ['celebrate', 'honor', 'extol'] }],

  // sign - keep 1039, replace 1099 and 1597
  [1099, 'sign', { word: 'initial', definition: 'To write initials to confirm reading', example: 'Initial each page of the contract.', synonyms: ['mark', 'endorse', 'verify'] }],
  [1597, 'sign', { word: 'countersign', definition: 'To add a second signature for verification', example: 'Managers countersign expense claims.', synonyms: ['verify', 'authenticate', 'endorse'] }],

  // coordinate - keep 1145, replace 1438 and 1776
  [1438, 'coordinate', { word: 'orchestrate', definition: 'To organize different elements smoothly', example: 'She orchestrated the entire event.', synonyms: ['manage', 'direct', 'arrange'] }],
  [1776, 'coordinate', { word: 'harmonize', definition: 'To make different parts work together', example: 'Teams harmonize efforts across departments.', synonyms: ['align', 'integrate', 'unify'] }],

  // substantiate - keep 2242, replace 1786 and 2751
  [1786, 'substantiate', { word: 'justify', definition: 'To give reasons supporting a decision', example: 'You must justify your conclusions with data.', synonyms: ['defend', 'vindicate', 'rationalize'] }],
  [2751, 'substantiate', { word: 'verify', definition: 'To confirm accuracy through checking', example: 'Auditors verify financial statements.', synonyms: ['confirm', 'validate', 'authenticate'] }],

  // corroborate - keep 1833, replace 2123 and 2705
  [2123, 'corroborate', { word: 'authenticate', definition: 'To prove something is genuine', example: 'Experts authenticated the signature.', synonyms: ['verify', 'certify', 'validate'] }],
  [2705, 'corroborate', { word: 'affirm', definition: 'To confirm something with evidence', example: 'Tests affirmed the initial diagnosis.', synonyms: ['confirm', 'attest', 'support'] }],

  // review - keep 346, replace 1390
  [1390, 'review', { word: 'revise', definition: 'To read and correct written work', example: 'Always revise your essays before submission.', synonyms: ['edit', 'amend', 'improve'] }],

  // allocate - keep 357, replace 1785
  [1785, 'allocate', { word: 'apportion', definition: 'To divide and share resources fairly', example: 'The committee apportions funds quarterly.', synonyms: ['distribute', 'divide', 'allot'] }],

  // lend - keep 401, replace 1773
  [1773, 'lend', { word: 'loan', definition: 'To give something temporarily to others', example: 'Banks loan money with interest.', synonyms: ['advance', 'provide', 'supply'] }],

  // arrange - keep 404, replace 1474
  [1474, 'arrange', { word: 'schedule', definition: 'To plan for a specific time', example: 'Please schedule the meeting for Tuesday.', synonyms: ['book', 'set', 'organize'] }],

  // assist - keep 416, replace 1440
  [1440, 'assist', { word: 'aid', definition: 'To help someone with practical support', example: 'Volunteers aid elderly neighbors weekly.', synonyms: ['help', 'support', 'serve'] }],

  // prepare - keep 424, replace 1693
  [1693, 'prepare', { word: 'ready', definition: 'To make something prepared for use', example: 'Staff ready the conference room early.', synonyms: ['set up', 'arrange', 'organize'] }],

  // decline - keep 630, replace 1426
  [1426, 'decline', { word: 'reject', definition: 'To refuse an offer or request', example: 'She rejected the proposal politely.', synonyms: ['turn down', 'refuse', 'deny'] }],

  // assess - keep 641, replace 1796
  [1796, 'assess', { word: 'evaluate', definition: 'To judge quality or importance', example: 'We evaluate proposals before approval.', synonyms: ['appraise', 'gauge', 'measure'] }],

  // advertise - keep 884, replace 1442
  [1442, 'advertise', { word: 'publicize', definition: 'To make something widely known', example: 'They publicize events on social media.', synonyms: ['promote', 'announce', 'broadcast'] }],

  // attach - keep 896, replace 1454
  [1454, 'attach', { word: 'append', definition: 'To add something at the end', example: 'Append supporting documents to your email.', synonyms: ['add', 'include', 'join'] }],

  // prevent - keep 904, replace 2716
  [2716, 'prevent', { word: 'forestall', definition: 'To stop something before it happens', example: 'Quick action forestalled larger problems.', synonyms: ['avert', 'preempt', 'thwart'] }],

  // recover - keep 905, replace 1380
  [1380, 'recover', { word: 'recuperate', definition: 'To regain health after illness', example: 'Athletes recuperate between seasons.', synonyms: ['heal', 'convalesce', 'mend'] }],

  // improve - keep 907, replace 2714
  [2714, 'improve', { word: 'enhance', definition: 'To raise quality or value', example: 'Training enhances employee performance.', synonyms: ['better', 'upgrade', 'boost'] }],

  // advise - keep 931, replace 1489
  [1489, 'advise', { word: 'counsel', definition: 'To give professional guidance', example: 'Lawyers counsel clients before court.', synonyms: ['guide', 'direct', 'recommend'] }],

  // refund - keep 941, replace 1499
  [1499, 'refund', { word: 'reimburse', definition: 'To pay back expenses incurred', example: 'Companies reimburse travel costs monthly.', synonyms: ['repay', 'compensate', 'return'] }],

  // upgrade - keep 966, replace 1451
  [1451, 'upgrade', { word: 'update', definition: 'To install the latest version', example: 'Update your software to fix bugs.', synonyms: ['refresh', 'renew', 'modernize'] }],

  // season - keep 990, replace 1050
  [1050, 'season', { word: 'spice', definition: 'To add herbs and spices to food', example: 'Spice the dish according to taste.', synonyms: ['flavor', 'zest', 'enhance'] }],

  // encourage - keep 1061, replace 1682 - but 1061 was already changed
  [1682, 'encourage', { word: 'hearten', definition: 'To give confidence and support', example: 'Kind words hearten people in difficulty.', synonyms: ['inspire', 'uplift', 'cheer'] }],

  // illustrate - keep 1085, replace 1922
  [1922, 'illustrate', { word: 'demonstrate', definition: 'To show how something works', example: 'The trainer demonstrated proper technique.', synonyms: ['exhibit', 'display', 'show'] }],

  // deliver - keep 1097, replace 1764
  [1764, 'deliver', { word: 'dispatch', definition: 'To send goods to destination', example: 'We dispatch orders within 24 hours.', synonyms: ['ship', 'forward', 'send'] }],

  // acknowledge - keep 1132, replace 2750
  [2750, 'acknowledge', { word: 'concede', definition: 'To admit after initial resistance', example: 'He conceded the point was valid.', synonyms: ['admit', 'yield', 'grant'] }],

  // deploy - keep 1144, replace 2062
  [2062, 'deploy', { word: 'launch', definition: 'To start or release something officially', example: 'They launch new products quarterly.', synonyms: ['release', 'roll out', 'introduce'] }],

  // postpone - keep 1191, replace 1368
  [1368, 'postpone', { word: 'delay', definition: 'To make something happen later', example: 'Bad weather delayed the departure.', synonyms: ['defer', 'put off', 'reschedule'] }],

  // evaluate - keep 1213, replace 1971
  [1971, 'evaluate', { word: 'appraise', definition: 'To assess value or quality formally', example: 'Experts appraised the artwork carefully.', synonyms: ['judge', 'rate', 'gauge'] }],

  // integrate - keep 1228, replace 2148
  [2148, 'integrate', { word: 'combine', definition: 'To merge elements into a whole', example: 'The research combines multiple datasets.', synonyms: ['merge', 'unify', 'blend'] }],

  // initiative - keep 1238, replace 1297
  [1297, 'initiative', { word: 'campaign', definition: 'An organized effort for a cause', example: 'The marketing campaign boosted sales.', synonyms: ['drive', 'program', 'effort'] }],

  // terminate - keep 1287, replace 1525
  [1525, 'terminate', { word: 'discontinue', definition: 'To stop offering a service', example: 'They discontinued the old product line.', synonyms: ['cease', 'end', 'halt'] }],

  // measure - keep 1406, replace 1848
  [1848, 'measure', { word: 'gauge', definition: 'To estimate or determine extent', example: 'Surveys gauge customer satisfaction.', synonyms: ['assess', 'estimate', 'evaluate'] }],

  // contemplate - keep 1427, replace 1893
  [1893, 'contemplate', { word: 'ponder', definition: 'To think about deeply', example: 'Leaders ponder difficult decisions carefully.', synonyms: ['consider', 'reflect', 'mull over'] }],

  // set up - keep 1450, replace 2518
  [2518, 'set up', { word: 'arrange', definition: 'To organize something in advance', example: 'They arranged the meeting for Friday.', synonyms: ['organize', 'prepare', 'coordinate'] }],

  // diminish - keep 1464, replace 2413
  [2413, 'diminish', { word: 'lessen', definition: 'To become smaller or weaker', example: 'Time lessened the initial shock.', synonyms: ['reduce', 'decrease', 'abate'] }],

  // enhance - keep 1465, replace 1524
  [1524, 'enhance', { word: 'boost', definition: 'To increase or improve quickly', example: 'The promotion boosted team morale.', synonyms: ['increase', 'elevate', 'amplify'] }],

  // verify - keep 1475, replace 1919
  [1919, 'verify', { word: 'confirm', definition: 'To establish something is true', example: 'Tests confirm the diagnosis.', synonyms: ['validate', 'corroborate', 'substantiate'] }],

  // authorize - keep 1487, replace 2036
  [2036, 'authorize', { word: 'sanction', definition: 'To give official approval', example: 'The board sanctioned the new policy.', synonyms: ['approve', 'permit', 'endorse'] }],

  // prohibit - keep 1488, replace 2037
  [2037, 'prohibit', { word: 'forbid', definition: 'To officially not allow something', example: 'Rules forbid smoking on premises.', synonyms: ['ban', 'bar', 'disallow'] }],

  // convince - keep 1510, replace 1622
  [1622, 'convince', { word: 'persuade', definition: 'To cause someone to believe', example: 'Data persuaded skeptics to change views.', synonyms: ['sway', 'win over', 'influence'] }],

  // refine - keep 1607, replace 1920
  [1920, 'refine', { word: 'polish', definition: 'To improve through small changes', example: 'Writers polish drafts through revision.', synonyms: ['perfect', 'hone', 'fine-tune'] }],

  // adapt - keep 1608, replace 1947
  [1947, 'adapt', { word: 'adjust', definition: 'To change to suit conditions', example: 'Teams adjust strategies as needed.', synonyms: ['modify', 'alter', 'tailor'] }],

  // deter - keep 1610, replace 1987
  [1987, 'deter', { word: 'discourage', definition: 'To make someone less likely to act', example: 'Penalties discourage late submissions.', synonyms: ['dissuade', 'prevent', 'inhibit'] }],

  // recommend - keep 1620, replace 1761
  [1761, 'recommend', { word: 'advise', definition: 'To suggest a course of action', example: 'Experts advise caution in volatile markets.', synonyms: ['counsel', 'propose', 'urge'] }],

  // contend - keep 1621, replace 1960
  [1960, 'contend', { word: 'assert', definition: 'To state something confidently', example: 'Critics assert the plan is flawed.', synonyms: ['claim', 'declare', 'maintain'] }],

  // sustain - keep 1670, replace 1762
  [1762, 'sustain', { word: 'maintain', definition: 'To keep at a certain level', example: 'They maintain high quality standards.', synonyms: ['preserve', 'uphold', 'continue'] }],

  // supersede - keep 1704, replace 2364
  [2364, 'supersede', { word: 'replace', definition: 'To take the place of something', example: 'New policies replace outdated ones.', synonyms: ['supplant', 'displace', 'succeed'] }],

  // maintain - keep 1706, replace 2752
  [2752, 'maintain', { word: 'argue', definition: 'To give reasons for a position', example: 'Scholars argue for new approaches.', synonyms: ['contend', 'assert', 'claim'] }],

  // circumvent - keep 1748, replace 2703
  [2703, 'circumvent', { word: 'bypass', definition: 'To go around an obstacle', example: 'Engineers bypassed the faulty system.', synonyms: ['avoid', 'sidestep', 'evade'] }],

  // curtail - keep 1763, replace 1880
  [1880, 'curtail', { word: 'reduce', definition: 'To make smaller in amount', example: 'Budget cuts reduced spending significantly.', synonyms: ['cut', 'decrease', 'trim'] }],

  // alleviate - keep 1784, replace 1932
  [1932, 'alleviate', { word: 'ease', definition: 'To make pain or difficulty less', example: 'Medication eases chronic symptoms.', synonyms: ['relieve', 'lessen', 'soothe'] }],

  // concede - keep 1787, replace 1821
  [1821, 'concede', { word: 'yield', definition: 'To give way under pressure', example: 'Eventually they yielded to demands.', synonyms: ['submit', 'surrender', 'relent'] }],

  // articulate - keep 1799, replace 2702
  [2702, 'articulate', { word: 'express', definition: 'To communicate ideas clearly', example: 'She expressed her concerns directly.', synonyms: ['convey', 'voice', 'state'] }],

  // harmonize - keep 1800, replace 2330
  [2330, 'harmonize', { word: 'align', definition: 'To bring into agreement', example: 'Teams align their goals with strategy.', synonyms: ['coordinate', 'reconcile', 'synchronize'] }],

  // hypothesize - keep 1834, replace 2753
  [2753, 'hypothesize', { word: 'theorize', definition: 'To form a theory about something', example: 'Scientists theorize about dark matter.', synonyms: ['speculate', 'conjecture', 'postulate'] }],

  // validate - keep 1845, replace 2377
  [2377, 'validate', { word: 'confirm', definition: 'To establish something is correct', example: 'Experiments confirm the hypothesis.', synonyms: ['verify', 'prove', 'authenticate'] }],

  // compile - keep 1846, replace 2354
  [2354, 'compile', { word: 'assemble', definition: 'To gather and organize material', example: 'Teams assemble data for analysis.', synonyms: ['collect', 'gather', 'aggregate'] }],

  // broker - keep 1857, replace 2195
  [2195, 'broker', { word: 'negotiate', definition: 'To arrange a deal through discussion', example: 'Lawyers negotiated favorable terms.', synonyms: ['arrange', 'mediate', 'facilitate'] }],

  // amend - keep 1858, replace 1871
  [1871, 'amend', { word: 'revise', definition: 'To change or correct a document', example: 'Congress revised the legislation.', synonyms: ['modify', 'alter', 'update'] }],

  // project - keep 1859, replace 2376
  [2376, 'project', { word: 'forecast', definition: 'To predict future outcomes', example: 'Analysts forecast economic growth.', synonyms: ['predict', 'estimate', 'anticipate'] }],

  // synchronize - keep 1860, replace 2066
  [2066, 'synchronize', { word: 'coordinate', definition: 'To make things happen together', example: 'Teams coordinate schedules globally.', synonyms: ['align', 'time', 'harmonize'] }],

  // accelerate - keep 1908, replace 2717
  [2717, 'accelerate', { word: 'expedite', definition: 'To make something happen faster', example: 'New processes expedite approvals.', synonyms: ['hasten', 'quicken', 'speed up'] }],

  // deduce - keep 1998, replace 2374
  [2374, 'deduce', { word: 'infer', definition: 'To conclude from evidence', example: 'We infer trends from the data.', synonyms: ['derive', 'reason', 'conclude'] }],

  // restrict - keep 2079, replace 2306
  [2306, 'restrict', { word: 'constrain', definition: 'To limit actions or choices', example: 'Budgets constrain spending options.', synonyms: ['limit', 'confine', 'curb'] }],

  // moderate - keep 2102, replace 2270
  [2270, 'moderate', { word: 'temper', definition: 'To make less extreme', example: 'Experience tempered his views.', synonyms: ['soften', 'lessen', 'tone down'] }],

  // expound - keep 2184, replace 2473
  [2473, 'expound', { word: 'explain', definition: 'To describe in detail', example: 'Professors explain complex theories.', synonyms: ['elaborate', 'clarify', 'describe'] }],

  // specify - keep 2185, replace 2400
  [2400, 'specify', { word: 'stipulate', definition: 'To state as a requirement', example: 'Contracts stipulate payment terms.', synonyms: ['define', 'prescribe', 'detail'] }],

  // interpolate - keep 2208, replace 2704
  [2704, 'interpolate', { word: 'extrapolate', definition: 'To extend known data to predict unknowns', example: 'Models extrapolate future trends.', synonyms: ['project', 'estimate', 'infer'] }],

  // rebut - keep 2243, replace 2749
  [2749, 'rebut', { word: 'refute', definition: 'To prove a claim is false', example: 'Evidence refuted the accusations.', synonyms: ['disprove', 'counter', 'contradict'] }],
];

// Apply each fix
let lines = content.split('\n');
let fixCount = 0;

for (const [lineNum, oldWord, replacement] of fixes) {
  const idx = lineNum - 1;
  const line = lines[idx];

  if (!line) {
    console.log(`WARNING: Line ${lineNum} does not exist`);
    continue;
  }

  // Check if the line contains the old word
  const wordPattern = new RegExp(`word:\\s*['"]${oldWord.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}['"]`, 'i');

  if (!wordPattern.test(line)) {
    console.log(`SKIP: Line ${lineNum} does not contain "${oldWord}" - current line: ${line.substring(0, 80)}...`);
    continue;
  }

  // Build the new word object string
  const newWordStr = `{ word: '${replacement.word}', definition: '${replacement.definition}', example: '${replacement.example}', synonyms: ['${replacement.synonyms.join("', '")}'] }`;

  // Replace the entire word object on this line using more flexible pattern
  // Match any word object regardless of number of fields
  const objectPattern = /\{\s*word:\s*['"][^'"]+['"]\s*,\s*definition:\s*['"][^'"]+['"]\s*,\s*example:\s*['"][^'"]+['"]\s*,?\s*(?:phonetic:\s*['"][^'"]*['"]\s*,?\s*)?synonyms:\s*\[[^\]]*\]\s*\}/;

  if (objectPattern.test(line)) {
    lines[idx] = line.replace(objectPattern, newWordStr);
    fixCount++;
    console.log(`Fixed line ${lineNum}: "${oldWord}" -> "${replacement.word}"`);
  } else {
    console.log(`PATTERN FAIL: Line ${lineNum} for "${oldWord}"`);
  }
}

// Write the updated file
const updatedContent = lines.join('\n');
fs.writeFileSync(filePath, updatedContent);

console.log(`\n--- Done ---`);
console.log(`Fixed ${fixCount} words`);

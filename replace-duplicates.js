// Script to replace duplicate words in levels.ts

const fs = require('fs');
const path = require('path');

// Read the duplicates
const duplicates = require('./duplicates.json');

// Read the levels.ts file
const filePath = path.join(__dirname, 'app/quiz/data/levels.ts');
let content = fs.readFileSync(filePath, 'utf-8');
const lines = content.split('\n');

// Replacement words organized by set theme
// Each replacement has: word, definition, example, synonyms (array of 3)
const replacements = {
  // BEGINNER LEVEL REPLACEMENTS

  // taste (lines 427, 990, 1050, 1548 - keep 225)
  'beginner/Food & Cooking/taste': { word: 'chew', definition: 'To bite food repeatedly to make it soft', example: 'Chew your food well before you swallow it.', synonyms: ['munch', 'gnaw', 'grind'] },
  'ielts/Food & Cooking/taste': { word: 'season', definition: 'To add spices or salt to improve flavor', example: 'Season the chicken before putting it in the oven.', synonyms: ['spice', 'flavor', 'enhance'] },
  'ielts/Food & Cooking/taste_2': { word: 'grill', definition: 'To cook food on a metal frame over heat', example: 'We grill burgers outside during summer evenings.', synonyms: ['barbecue', 'char', 'broil'] },
  'intermediate/Food & Cooking/taste': { word: 'marinate', definition: 'To soak food in seasoned liquid before cooking', example: 'Marinate the meat overnight for better flavor.', synonyms: ['soak', 'steep', 'infuse'] },

  // cancel (lines 967, 1368, 1476, 1525 - keep 918)
  'ielts/Reservations & Changes/cancel': { word: 'modify', definition: 'To change a booking or arrangement slightly', example: 'You can modify the reservation online until noon.', synonyms: ['alter', 'adjust', 'amend'] },
  'intermediate/Travel & Booking/cancel': { word: 'postpone', definition: 'To move an event to a later time', example: 'They postponed the trip due to bad weather.', synonyms: ['delay', 'defer', 'put off'] },
  'intermediate/Scheduling & Appointments/cancel': { word: 'withdraw', definition: 'To remove yourself from a planned activity', example: 'She had to withdraw from the project unexpectedly.', synonyms: ['pull out', 'back out', 'retract'] },
  'intermediate/Reservations & Changes/cancel': { word: 'terminate', definition: 'To end something officially before completion', example: 'The company terminated the contract early.', synonyms: ['end', 'discontinue', 'cease'] },

  // allocate (lines 1192, 1785, 2386 - keep 357)
  'office/Time Management/allocate': { word: 'distribute', definition: 'To share resources among different groups', example: 'Please distribute the workload fairly among team members.', synonyms: ['divide', 'share out', 'parcel'] },
  'upper-intermediate/Planning & Problem Solving/allocate': { word: 'apportion', definition: 'To divide and assign shares formally', example: 'The committee will apportion funds based on need.', synonyms: ['divide', 'allot', 'dole out'] },
  'advanced/Resource & Allocation Verbs/allocate': { word: 'earmark', definition: 'To set aside resources for a specific purpose', example: 'The budget earmarked funds for training programs.', synonyms: ['designate', 'reserve', 'set aside'] },

  // implement (lines 643, 1144, 1788 - keep 360)
  'ielts/Academic Processes/implement': { word: 'execute', definition: 'To carry out a plan or order effectively', example: 'The team executed the strategy without any errors.', synonyms: ['perform', 'accomplish', 'fulfill'] },
  'office/Project Management/implement': { word: 'deploy', definition: 'To put resources or systems into active use', example: 'We will deploy the new software next month.', synonyms: ['launch', 'roll out', 'activate'] },
  'upper-intermediate/Planning & Problem Solving/implement': { word: 'actualize', definition: 'To make something real or achieve a goal', example: 'The team actualized their vision through hard work.', synonyms: ['realize', 'fulfill', 'achieve'] },

  // improve (lines 1465, 1607, 1749 - keep 907)
  'intermediate/Health & Recovery/improve': { word: 'enhance', definition: 'To increase the quality or value of something', example: 'Good lighting can enhance the room atmosphere.', synonyms: ['boost', 'upgrade', 'enrich'] },
  'intermediate/Problem Solving/improve': { word: 'refine', definition: 'To make small changes to improve something', example: 'Engineers refine the design after each test.', synonyms: ['polish', 'perfect', 'fine-tune'] },
  'upper-intermediate/Actions & Attitudes/improve': { word: 'elevate', definition: 'To raise to a higher level or standard', example: 'Quality training elevates team performance significantly.', synonyms: ['raise', 'uplift', 'heighten'] },

  // schedule (lines 1190, 1474, 1690 - keep 916)
  'office/Time Management/schedule': { word: 'timetable', definition: 'To create a plan showing when events happen', example: 'Let me timetable the meetings for next week.', synonyms: ['plan', 'program', 'slot'] },
  'intermediate/Scheduling & Appointments/schedule': { word: 'arrange', definition: 'To organize and plan events in advance', example: 'Please arrange the interviews for Thursday morning.', synonyms: ['organize', 'set up', 'coordinate'] },
  'intermediate/Planning & Organization/schedule': { word: 'calendar', definition: 'To add an event to your schedule', example: 'I will calendar the deadline for next Friday.', synonyms: ['book', 'diarize', 'log'] },

  // reschedule (lines 968, 1477, 1526 - keep 919)
  'ielts/Reservations & Changes/reschedule': { word: 'rebook', definition: 'To make a new booking after cancellation', example: 'We need to rebook the flight for Wednesday.', synonyms: ['reserve again', 'book again', 're-reserve'] },
  'intermediate/Scheduling & Appointments/reschedule': { word: 'rearrange', definition: 'To change the time or order of plans', example: 'Let me rearrange my appointments for tomorrow.', synonyms: ['reorganize', 'reorder', 'shuffle'] },
  'intermediate/Reservations & Changes/reschedule': { word: 'defer', definition: 'To put off an event to a later date', example: 'They deferred the meeting until next month.', synonyms: ['delay', 'put back', 'hold off'] },

  // corroborate (lines 2123, 2459, 2751 - keep 1833)
  'advanced/Analysis & Evidence Verbs/corroborate': { word: 'authenticate', definition: 'To prove something is genuine or valid', example: 'Experts authenticated the painting as original.', synonyms: ['verify', 'certify', 'validate'] },
  'advanced/Validity & Legitimacy Verbs/corroborate': { word: 'attest', definition: 'To provide evidence that something is true', example: 'Documents attest to the agreement between parties.', synonyms: ['testify', 'confirm', 'affirm'] },
  'proficient/Proficient  Argumentation Verbs/corroborate': { word: 'substantiate', definition: 'To provide proof supporting a claim', example: 'The data substantiated the research hypothesis.', synonyms: ['verify', 'validate', 'back up'] },

  // elucidate (lines 2184, 2399, 2701 - keep 1847)
  'advanced/Evidence & Clarity Verbs/elucidate': { word: 'expound', definition: 'To explain something in great detail', example: 'The professor expounded on economic theories.', synonyms: ['elaborate', 'explicate', 'unfold'] },
  'advanced/Communication & Discourse Verbs/elucidate': { word: 'illuminate', definition: 'To make something clearer through explanation', example: 'Her comments illuminated the complex issue.', synonyms: ['clarify', 'shed light on', 'enlighten'] },
  'proficient/Proficient  Precision Verbs I/elucidate': { word: 'demystify', definition: 'To make something easier to understand', example: 'The guide demystifies technical jargon for beginners.', synonyms: ['simplify', 'clarify', 'explain'] },

  // delineate (lines 2185, 2446, 2702 - keep 1935)
  'advanced/Evidence & Clarity Verbs/delineate': { word: 'specify', definition: 'To state clearly and in detail', example: 'The contract specifies all terms and conditions.', synonyms: ['detail', 'define', 'stipulate'] },
  'advanced/Structure & Organization Verbs/delineate': { word: 'demarcate', definition: 'To set boundaries or limits clearly', example: 'The fence demarcates the property line.', synonyms: ['mark', 'delimit', 'bound'] },
  'proficient/Proficient  Precision Verbs I/delineate': { word: 'articulate', definition: 'To express ideas clearly and precisely', example: 'She articulated her vision for the project.', synonyms: ['express', 'voice', 'convey'] },

  // eat (lines 345, 425 - keep 43)
  'beginner/Daily Routines & Habits/eat': { word: 'munch', definition: 'To chew food with a crunching sound', example: 'I like to munch on apples during break time.', synonyms: ['chomp', 'crunch', 'nibble'] },
  'beginner/Food & Cooking/eat': { word: 'consume', definition: 'To eat or drink something completely', example: 'We consume three meals every day for energy.', synonyms: ['devour', 'ingest', 'finish'] },

  // rain (lines 542, 1415 - keep 197)
  'beginner/Weather & Nature/rain_2': { word: 'drizzle', definition: 'To rain very lightly with small drops', example: 'It started to drizzle on our way home.', synonyms: ['sprinkle', 'mist', 'shower'] },
  'intermediate/Weather & Nature/rain': { word: 'pour', definition: 'To rain very heavily and continuously', example: 'It poured all afternoon during the storm.', synonyms: ['downpour', 'deluge', 'bucket'] },

  // book (lines 413, 1367 - keep 281)
  'beginner/Education & Work/book': { word: 'textbook', definition: 'A book used for studying a subject at school', example: 'Open your textbook to chapter five please.', synonyms: ['manual', 'coursebook', 'guide'] },
  'intermediate/Travel & Booking/book': { word: 'reserve', definition: 'To arrange to have something held for you', example: 'Please reserve a table for dinner tonight.', synonyms: ['secure', 'hold', 'arrange'] },

  // mitigate (lines 1784, 2270 - keep 356)
  'upper-intermediate/Planning & Problem Solving/mitigate': { word: 'alleviate', definition: 'To make a problem less severe', example: 'Medicine helps alleviate pain after surgery.', synonyms: ['ease', 'relieve', 'reduce'] },
  'advanced/Law & Procedure Verbs/mitigate': { word: 'moderate', definition: 'To make something less extreme', example: 'Training helps moderate stress responses.', synonyms: ['temper', 'lessen', 'soften'] },

  // justify (lines 642, 1786 - keep 358)
  'ielts/Academic Processes/justify': { word: 'rationalize', definition: 'To provide logical reasons for a decision', example: 'She rationalized her choice with clear evidence.', synonyms: ['explain', 'vindicate', 'validate'] },
  'upper-intermediate/Planning & Problem Solving/justify': { word: 'substantiate', definition: 'To give evidence supporting a claim', example: 'You must substantiate your arguments with facts.', synonyms: ['prove', 'verify', 'confirm'] },

  // suggest (lines 1428, 1620 - keep 870)
  'intermediate/Opinions & Decisions/suggest': { word: 'propose', definition: 'To put forward an idea for consideration', example: 'I propose we meet earlier to finish on time.', synonyms: ['recommend', 'advise', 'put forth'] },
  'intermediate/Opinions & Views/suggest': { word: 'recommend', definition: 'To advise someone to do something', example: 'Doctors recommend regular exercise for health.', synonyms: ['advise', 'counsel', 'advocate'] },

  // avoid (lines 1429, 1748 - keep 871)
  'intermediate/Opinions & Decisions/avoid': { word: 'evade', definition: 'To escape or stay away from something', example: 'They evaded the traffic by taking a shortcut.', synonyms: ['dodge', 'escape', 'sidestep'] },
  'upper-intermediate/Actions & Attitudes/avoid': { word: 'circumvent', definition: 'To find a way around an obstacle', example: 'We circumvented the problem with a new approach.', synonyms: ['bypass', 'sidestep', 'skirt'] },

  // agree (lines 1430, 1618 - keep 872)
  'intermediate/Opinions & Decisions/agree': { word: 'consent', definition: 'To give permission or approval', example: 'She consented to the terms of the agreement.', synonyms: ['permit', 'allow', 'approve'] },
  'intermediate/Opinions & Views/agree': { word: 'concur', definition: 'To have the same opinion as others', example: 'Most experts concur with the new findings.', synonyms: ['accord', 'coincide', 'align'] },

  // organize (lines 1438, 1692 - keep 880)
  'intermediate/Community & Volunteering/organize': { word: 'coordinate', definition: 'To bring different parts together smoothly', example: 'She coordinates events across three locations.', synonyms: ['manage', 'orchestrate', 'synchronize'] },
  'intermediate/Planning & Organization/organize': { word: 'systematize', definition: 'To arrange in an orderly logical way', example: 'We systematized the files for easy access.', synonyms: ['order', 'structure', 'classify'] },

  // update (lines 1451, 1644 - keep 893)
  'intermediate/Tech Setup/update': { word: 'upgrade', definition: 'To replace with a better version', example: 'Time to upgrade your phone to the latest model.', synonyms: ['improve', 'enhance', 'advance'] },
  'intermediate/Technology & Devices/update': { word: 'refresh', definition: 'To reload or renew something digital', example: 'Refresh the page to see new messages.', synonyms: ['reload', 'renew', 'revitalize'] },

  // download (lines 1452, 1642 - keep 894)
  'intermediate/Tech Setup/download': { word: 'retrieve', definition: 'To get back stored data or files', example: 'Retrieve your photos from the cloud backup.', synonyms: ['recover', 'fetch', 'access'] },
  'intermediate/Technology & Devices/download': { word: 'transfer', definition: 'To move data from one place to another', example: 'Transfer files to your computer via cable.', synonyms: ['copy', 'move', 'send'] },

  // prevent (lines 1462, 1610 - keep 904)
  'intermediate/Health & Recovery/prevent': { word: 'avert', definition: 'To turn away or stop something harmful', example: 'Quick action averted a serious accident.', synonyms: ['avoid', 'ward off', 'forestall'] },
  'intermediate/Problem Solving/prevent': { word: 'deter', definition: 'To discourage someone from doing something', example: 'High prices deter some customers from buying.', synonyms: ['discourage', 'dissuade', 'inhibit'] },

  // recover (lines 1463, 1654 - keep 905)
  'intermediate/Health & Recovery/recover': { word: 'recuperate', definition: 'To regain health after illness', example: 'She recuperated at home after the surgery.', synonyms: ['heal', 'convalesce', 'mend'] },
  'intermediate/Health & Wellness/recover': { word: 'rehabilitate', definition: 'To restore health through therapy', example: 'Physical therapy helps rehabilitate injured muscles.', synonyms: ['restore', 'rebuild', 'renew'] },

  // reduce (lines 1464, 1763 - keep 906)
  'intermediate/Health & Recovery/reduce': { word: 'diminish', definition: 'To make something smaller or less', example: 'Exercise helps diminish stress levels significantly.', synonyms: ['decrease', 'lessen', 'lower'] },
  'upper-intermediate/Decisions & Delivery/reduce': { word: 'curtail', definition: 'To reduce by cutting or restricting', example: 'Budget cuts curtailed the expansion plans.', synonyms: ['limit', 'cut back', 'trim'] },

  // remind (lines 1478, 1694 - keep 920)
  'intermediate/Scheduling & Appointments/remind': { word: 'notify', definition: 'To inform someone officially about something', example: 'We will notify you when the order ships.', synonyms: ['alert', 'inform', 'advise'] },
  'intermediate/Planning & Organization/remind': { word: 'prompt', definition: 'To cause someone to remember to act', example: 'Set an alarm to prompt you about meetings.', synonyms: ['cue', 'trigger', 'nudge'] },

  // replace (lines 1500, 1704 - keep 942)
  'intermediate/Orders & Delivery/replace': { word: 'substitute', definition: 'To use one thing instead of another', example: 'We can substitute olive oil for butter.', synonyms: ['swap', 'exchange', 'switch'] },
  'intermediate/Describing Change/replace': { word: 'supersede', definition: 'To take the place of something older', example: 'Digital maps superseded paper road maps.', synonyms: ['supplant', 'displace', 'succeed'] },

  // argue (lines 1511, 1621 - keep 953)
  'intermediate/Conversation & Disagreement/argue': { word: 'debate', definition: 'To discuss different opinions formally', example: 'They debated the issue for over an hour.', synonyms: ['discuss', 'dispute', 'deliberate'] },
  'intermediate/Opinions & Views/argue': { word: 'contend', definition: 'To assert or maintain a position strongly', example: 'Critics contend the plan is too expensive.', synonyms: ['claim', 'assert', 'maintain'] },

  // interrupt (lines 1513, 1679 - keep 955)
  'intermediate/Conversation & Disagreement/interrupt': { word: 'interject', definition: 'To insert a comment during conversation', example: 'He interjected with an important point.', synonyms: ['intervene', 'cut in', 'butt in'] },
  'intermediate/Social Interactions/interrupt': { word: 'disrupt', definition: 'To cause disorder or break continuity', example: 'Loud noise disrupts concentration in class.', synonyms: ['disturb', 'upset', 'interfere'] },

  // apologize (lines 1514, 1680 - keep 956)
  'intermediate/Conversation & Disagreement/apologize': { word: 'atone', definition: 'To make amends for a wrongdoing', example: 'He atoned for his mistake by helping more.', synonyms: ['compensate', 'make up for', 'redress'] },
  'intermediate/Social Interactions/apologize': { word: 'express regret', definition: 'To show sorrow for something done wrong', example: 'She expressed regret for the delayed response.', synonyms: ['show remorse', 'say sorry', 'convey sorrow'] },

  // adjust (lines 1535, 1608 - keep 977)
  'intermediate/Assembly & Fixing/adjust': { word: 'calibrate', definition: 'To set something to work accurately', example: 'Calibrate the scale before weighing ingredients.', synonyms: ['tune', 'set', 'regulate'] },
  'intermediate/Problem Solving/adjust': { word: 'adapt', definition: 'To change to suit new conditions', example: 'We must adapt our plans to the new budget.', synonyms: ['modify', 'alter', 'accommodate'] },

  // connect (lines 1536, 1645 - keep 978)
  'intermediate/Assembly & Fixing/connect': { word: 'link', definition: 'To join two things together', example: 'Link the devices using the provided cable.', synonyms: ['join', 'attach', 'couple'] },
  'intermediate/Technology & Devices/connect': { word: 'pair', definition: 'To establish connection between devices', example: 'Pair your phone with the wireless speaker.', synonyms: ['sync', 'match', 'bond'] },

  // All the IELTS duplicate sets (16-20 appear twice) - need to replace all words in the second occurrence
  // These are complete duplicates of sets 16-20 in IELTS

  // order (lines 1048, 1546 - keep 988)
  'ielts/Food & Cooking/order_2': { word: 'request', definition: 'To ask for something politely', example: 'You can request a vegetarian option at checkout.', synonyms: ['ask for', 'demand', 'solicit'] },
  'intermediate/Food & Cooking/order': { word: 'place', definition: 'To submit an order for goods or food', example: 'Place your order before the kitchen closes.', synonyms: ['submit', 'put in', 'make'] },

  // serve (lines 1049, 1547 - keep 989)
  'ielts/Food & Cooking/serve_2': { word: 'dish up', definition: 'To put food onto plates for eating', example: 'Dish up the pasta while it is still hot.', synonyms: ['plate', 'portion', 'ladle'] },
  'intermediate/Food & Cooking/serve': { word: 'provide', definition: 'To give food or service to customers', example: 'The cafe provides lunch from noon to three.', synonyms: ['supply', 'offer', 'deliver'] },

  // chop (lines 1051, 1549 - keep 991)
  'ielts/Food & Cooking/chop_2': { word: 'dice', definition: 'To cut food into small cube shapes', example: 'Dice the tomatoes finely for the salsa.', synonyms: ['cube', 'cut up', 'mince'] },
  'intermediate/Food & Cooking/chop': { word: 'slice', definition: 'To cut food into thin flat pieces', example: 'Slice the bread thinly for sandwiches.', synonyms: ['cut', 'carve', 'section'] },

  // stir (lines 1052, 1550 - keep 992)
  'ielts/Food & Cooking/stir_2': { word: 'whisk', definition: 'To beat ingredients quickly with a fork', example: 'Whisk the eggs until they become fluffy.', synonyms: ['beat', 'whip', 'blend'] },
  'intermediate/Food & Cooking/stir': { word: 'blend', definition: 'To mix ingredients until smooth', example: 'Blend the soup until creamy and smooth.', synonyms: ['mix', 'combine', 'merge'] },

  // worry (lines 1060, 1558 - keep 1000)
  'ielts/Emotions & Reactions/worry_2': { word: 'fret', definition: 'To feel anxious about small problems', example: 'Do not fret over minor mistakes at work.', synonyms: ['agonize', 'brood', 'stress'] },
  'intermediate/Emotions & Reactions/worry': { word: 'concern', definition: 'To feel troubled about something', example: 'His health concerns the whole family greatly.', synonyms: ['trouble', 'bother', 'disturb'] },

  // cheer (lines 1061, 1559 - keep 1001)
  'ielts/Emotions & Reactions/cheer_2': { word: 'encourage', definition: 'To give hope and support to someone', example: 'Friends encourage each other during hard times.', synonyms: ['inspire', 'motivate', 'uplift'] },
  'intermediate/Emotions & Reactions/cheer': { word: 'delight', definition: 'To make someone feel great pleasure', example: 'The surprise party delighted her completely.', synonyms: ['please', 'thrill', 'gladden'] },

  // forgive (lines 1062, 1560 - keep 1002)
  'ielts/Emotions & Reactions/forgive_2': { word: 'pardon', definition: 'To excuse someone for their mistake', example: 'Please pardon the interruption during lunch.', synonyms: ['excuse', 'absolve', 'overlook'] },
  'intermediate/Emotions & Reactions/forgive': { word: 'absolve', definition: 'To free someone from blame or guilt', example: 'The evidence absolved him of all charges.', synonyms: ['clear', 'exonerate', 'acquit'] },

  // praise (lines 1063, 1561 - keep 1003)
  'ielts/Emotions & Reactions/praise_2': { word: 'commend', definition: 'To express approval for an achievement', example: 'The manager commended her excellent work.', synonyms: ['applaud', 'congratulate', 'acclaim'] },
  'intermediate/Emotions & Reactions/praise': { word: 'acclaim', definition: 'To praise enthusiastically and publicly', example: 'Critics acclaimed the film as a masterpiece.', synonyms: ['celebrate', 'honor', 'extol'] },

  // regret (lines 1064, 1562 - keep 1004)
  'ielts/Emotions & Reactions/regret_2': { word: 'lament', definition: 'To express sorrow or disappointment', example: 'Many lament the loss of the old building.', synonyms: ['mourn', 'grieve', 'bemoan'] },
  'intermediate/Emotions & Reactions/regret': { word: 'rue', definition: 'To feel remorse about something', example: 'He may rue his hasty decision later.', synonyms: ['repent', 'be sorry', 'deplore'] },

  // heat (lines 1072, 1570 - keep 1012)
  'ielts/Emphasize & Adapt/heat_2': { word: 'warm', definition: 'To make something moderately hot', example: 'Warm the milk before adding chocolate powder.', synonyms: ['heat up', 'toast', 'thaw'] },
  'intermediate/Laundry & Household/heat': { word: 'preheat', definition: 'To heat an oven before cooking', example: 'Preheat the oven to 180 degrees Celsius.', synonyms: ['warm up', 'heat up', 'prepare'] },

  // cool (lines 1073, 1571 - keep 1013)
  'ielts/Emphasize & Adapt/cool_2': { word: 'chill', definition: 'To make something cold in refrigerator', example: 'Chill the dessert for two hours before serving.', synonyms: ['refrigerate', 'freeze', 'ice'] },
  'intermediate/Laundry & Household/cool': { word: 'ventilate', definition: 'To let fresh air circulate in a space', example: 'Ventilate the room by opening windows.', synonyms: ['air out', 'freshen', 'aerate'] },

  // dry (lines 1074, 1572 - keep 1014)
  'ielts/Emphasize & Adapt/dry_2': { word: 'towel', definition: 'To remove moisture using a towel', example: 'Towel your hair gently after washing it.', synonyms: ['blot', 'dab', 'wipe'] },
  'intermediate/Laundry & Household/dry': { word: 'air', definition: 'To expose to air to remove moisture', example: 'Air the bedding outside on sunny days.', synonyms: ['hang out', 'expose', 'ventilate'] },

  // fold (lines 1075, 1573 - keep 1015)
  'ielts/Emphasize & Adapt/fold_2': { word: 'crease', definition: 'To make a sharp fold line in fabric', example: 'Crease the trousers neatly along the seam.', synonyms: ['press', 'pleat', 'furrow'] },
  'intermediate/Laundry & Household/fold': { word: 'stack', definition: 'To arrange items neatly in piles', example: 'Stack the towels in the linen closet.', synonyms: ['pile', 'heap', 'arrange'] },

  // iron (lines 1076, 1574 - keep 1016)
  'ielts/Emphasize & Adapt/iron_2': { word: 'press', definition: 'To smooth fabric using heat and pressure', example: 'Press the shirt collar to look crisp.', synonyms: ['flatten', 'smooth', 'steam'] },
  'intermediate/Laundry & Household/iron': { word: 'steam', definition: 'To remove wrinkles using hot steam', example: 'Steam the curtains to freshen them up.', synonyms: ['press', 'smooth', 'dewrinkle'] },

  // paint (lines 1084, 1582 - keep 1024)
  'ielts/Act & Uphold/paint_2': { word: 'decorate', definition: 'To make something look more attractive', example: 'We decorated the room with colorful flowers.', synonyms: ['adorn', 'embellish', 'beautify'] },
  'intermediate/Hobbies & Outdoors/paint': { word: 'sketch', definition: 'To make a quick rough drawing', example: 'She sketched the landscape during sunset.', synonyms: ['draw', 'outline', 'draft'] },

  // draw (lines 1085, 1583 - keep 1025)
  'ielts/Act & Uphold/draw_2': { word: 'illustrate', definition: 'To add pictures to explain something', example: 'The artist illustrated the children\'s book.', synonyms: ['depict', 'portray', 'diagram'] },
  'intermediate/Hobbies & Outdoors/draw': { word: 'doodle', definition: 'To draw carelessly while thinking', example: 'She doodles during long phone meetings.', synonyms: ['scribble', 'scrawl', 'sketch'] },

  // camp (lines 1086, 1584 - keep 1026)
  'ielts/Act & Uphold/camp_2': { word: 'pitch', definition: 'To set up a tent at a campsite', example: 'We pitched the tent near the stream.', synonyms: ['erect', 'set up', 'establish'] },
  'intermediate/Hobbies & Outdoors/camp': { word: 'rough it', definition: 'To live without usual comforts outdoors', example: 'Backpackers rough it in the wilderness.', synonyms: ['live simply', 'go basic', 'survive'] },

  // hike (lines 1087, 1585 - keep 1027)
  'ielts/Act & Uphold/hike_2': { word: 'trek', definition: 'To make a long difficult journey on foot', example: 'They trekked through the mountain range.', synonyms: ['march', 'journey', 'traverse'] },
  'intermediate/Hobbies & Outdoors/hike': { word: 'ramble', definition: 'To walk for pleasure in countryside', example: 'We rambled through the forest trails.', synonyms: ['stroll', 'wander', 'roam'] },

  // swim (lines 1088, 1586 - keep 1028)
  'ielts/Act & Uphold/swim_2': { word: 'paddle', definition: 'To move through water with short strokes', example: 'Children paddle in the shallow pool.', synonyms: ['wade', 'splash', 'dabble'] },
  'intermediate/Hobbies & Outdoors/swim': { word: 'dive', definition: 'To jump head first into water', example: 'She dives off the high board gracefully.', synonyms: ['plunge', 'submerge', 'leap'] },

  // fill in (lines 1096, 1594 - keep 1036)
  'ielts/Evaluate & Persuade/fill in_2': { word: 'complete', definition: 'To finish a form by adding all details', example: 'Complete the application form by Friday.', synonyms: ['finish', 'fill out', 'finalize'] },
  'intermediate/Forms & Office Tasks/fill in': { word: 'enter', definition: 'To type information into a system', example: 'Enter your details in the online form.', synonyms: ['input', 'type', 'record'] },

  // submit (lines 1097, 1595 - keep 1037)
  'ielts/Evaluate & Persuade/submit_2': { word: 'deliver', definition: 'To hand over documents to someone', example: 'Deliver the report to the manager today.', synonyms: ['present', 'give', 'provide'] },
  'intermediate/Forms & Office Tasks/submit': { word: 'tender', definition: 'To formally offer something for acceptance', example: 'Companies tender bids for the contract.', synonyms: ['offer', 'present', 'propose'] },

  // print (lines 1098, 1596 - keep 1038)
  'ielts/Evaluate & Persuade/print_2': { word: 'copy', definition: 'To reproduce a document on paper', example: 'Copy the agenda for all participants.', synonyms: ['duplicate', 'reproduce', 'replicate'] },
  'intermediate/Forms & Office Tasks/print': { word: 'publish', definition: 'To produce and distribute printed material', example: 'They publish the newsletter monthly.', synonyms: ['issue', 'release', 'distribute'] },

  // sign (lines 1099, 1597 - keep 1039)
  'ielts/Evaluate & Persuade/sign_2': { word: 'initial', definition: 'To write initials to confirm reading', example: 'Initial each page of the contract.', synonyms: ['mark', 'endorse', 'verify'] },
  'intermediate/Forms & Office Tasks/sign': { word: 'countersign', definition: 'To add a second signature for verification', example: 'Managers countersign all expense claims.', synonyms: ['verify', 'authenticate', 'endorse'] },

  // file (lines 1100, 1598 - keep 1040)
  'ielts/Evaluate & Persuade/file_2': { word: 'archive', definition: 'To store documents for long-term reference', example: 'Archive old records in the storage room.', synonyms: ['store', 'preserve', 'record'] },
  'intermediate/Forms & Office Tasks/file': { word: 'catalogue', definition: 'To organize items systematically', example: 'Catalogue the documents by date and type.', synonyms: ['index', 'classify', 'list'] },

  // prioritize (lines 1691, 1856 - keep 1189)
  'intermediate/Planning & Organization/prioritize': { word: 'rank', definition: 'To put items in order of importance', example: 'Rank the tasks from most to least urgent.', synonyms: ['order', 'grade', 'classify'] },
  'upper-intermediate/Planning & Coordination/prioritize': { word: 'triage', definition: 'To sort tasks by urgency and importance', example: 'Project managers triage requests during crises.', synonyms: ['sort', 'categorize', 'classify'] },

  // negotiate (lines 1634, 1857 - keep 1201)
  'intermediate/Business Basics/negotiate': { word: 'bargain', definition: 'To discuss price or terms for agreement', example: 'Buyers bargain for better wholesale rates.', synonyms: ['haggle', 'deal', 'barter'] },
  'upper-intermediate/Planning & Coordination/negotiate': { word: 'broker', definition: 'To arrange deals between different parties', example: 'Lawyers brokered a settlement out of court.', synonyms: ['mediate', 'arrange', 'facilitate'] },

  // concede (lines 2196, 2750 - keep 1821)
  'advanced/Deals & Agreements Verbs/concede': { word: 'yield', definition: 'To give way under pressure', example: 'Eventually they yielded to public pressure.', synonyms: ['submit', 'surrender', 'relent'] },
  'proficient/Proficient  Argumentation Verbs/concede': { word: 'acknowledge', definition: 'To accept or admit the truth', example: 'She acknowledged the error publicly.', synonyms: ['admit', 'recognize', 'accept'] },

  // refute (lines 2182, 2749 - keep 1823)
  'advanced/Evidence & Clarity Verbs/refute': { word: 'disprove', definition: 'To prove something is false', example: 'The experiment disproved the old theory.', synonyms: ['contradict', 'negate', 'debunk'] },
  'proficient/Proficient  Argumentation Verbs/refute': { word: 'rebut', definition: 'To argue against with evidence', example: 'The lawyer rebutted all accusations forcefully.', synonyms: ['counter', 'oppose', 'challenge'] },

  // exacerbate (lines 2305, 2713 - keep 1933)
  'advanced/Constraints & Effects Verbs/exacerbate': { word: 'aggravate', definition: 'To make a bad situation worse', example: 'Harsh words aggravated the tense situation.', synonyms: ['worsen', 'intensify', 'inflame'] },
  'proficient/Proficient  Precision Verbs II/exacerbate': { word: 'compound', definition: 'To add to problems making them worse', example: 'Delays compounded the project difficulties.', synonyms: ['multiply', 'heighten', 'magnify'] },

  // extrapolate (lines 2376, 2704 - keep 2122)
  'advanced/Inference & Reasoning Verbs/extrapolate': { word: 'project', definition: 'To estimate future values from current data', example: 'Analysts project growth based on trends.', synonyms: ['forecast', 'predict', 'estimate'] },
  'proficient/Proficient  Precision Verbs I/extrapolate': { word: 'interpolate', definition: 'To estimate values between known points', example: 'Scientists interpolate missing temperature data.', synonyms: ['calculate', 'derive', 'estimate'] },

  // substantiate (lines 2377, 2705 - keep 2242)
  'advanced/Inference & Reasoning Verbs/substantiate': { word: 'validate', definition: 'To confirm something is accurate', example: 'Tests validate the safety of new drugs.', synonyms: ['verify', 'confirm', 'authenticate'] },
  'proficient/Proficient  Precision Verbs I/substantiate': { word: 'corroborate', definition: 'To confirm with supporting evidence', example: 'Witnesses corroborated the victim\'s account.', synonyms: ['support', 'verify', 'confirm'] },

  // ubiquitous (lines 2692, 2726 - keep 2670)
  'proficient/Elite Adjectives/ubiquitous': { word: 'pervasive', definition: 'Spreading throughout an area or group', example: 'Smartphones are pervasive in modern society.', synonyms: ['widespread', 'prevalent', 'common'] },
  'proficient/Proficient  Evaluative Adjectives/ubiquitous': { word: 'omnipresent', definition: 'Present everywhere at the same time', example: 'Security cameras are omnipresent downtown.', synonyms: ['ever-present', 'universal', 'all-encompassing'] },

  // Remaining duplicates...

  // drink (line 426 - keep 44)
  'beginner/Food & Cooking/drink': { word: 'sip', definition: 'To drink slowly in small amounts', example: 'She sips her tea while reading books.', synonyms: ['taste', 'sample', 'sup'] },

  // sleep (line 348 - keep 45)
  'beginner/Daily Routines & Habits/sleep': { word: 'slumber', definition: 'To sleep peacefully and deeply', example: 'The baby slumbers quietly through the night.', synonyms: ['doze', 'nap', 'snooze'] },

  // read (line 458 - keep 77)
  'beginner/Free Time & Hobbies/read': { word: 'browse', definition: 'To look through reading material casually', example: 'I browse magazines at the doctor\'s office.', synonyms: ['skim', 'scan', 'peruse'] },

  // write (line 415 - keep 78)
  'beginner/Education & Work/write': { word: 'compose', definition: 'To create text by writing carefully', example: 'She composes essays for the school paper.', synonyms: ['draft', 'create', 'author'] },

  // study (line 346 - keep 80)
  'beginner/Daily Routines & Habits/study': { word: 'review', definition: 'To look at material again to learn', example: 'Students review notes before each exam.', synonyms: ['revise', 'go over', 'examine'] },

  // travel (line 587 - keep 101)
  'beginner/Transportation & Travel/travel': { word: 'journey', definition: 'To make a trip from one place to another', example: 'We journey to the mountains each summer.', synonyms: ['voyage', 'trek', 'tour'] },

  // arrive (line 1369 - keep 104)
  'intermediate/Travel & Booking/arrive': { word: 'reach', definition: 'To get to a destination after traveling', example: 'We hope to reach the hotel by evening.', synonyms: ['get to', 'attain', 'make it'] },

  // rest (line 1380 - keep 128)
  'intermediate/Health & Fitness/rest': { word: 'recover', definition: 'To regain strength after activity', example: 'Athletes recover between training sessions.', synonyms: ['recuperate', 'recharge', 'restore'] },

  // help (line 416 - keep 138)
  'beginner/Education & Work/help': { word: 'assist', definition: 'To give support to someone in need', example: 'Teachers assist students with difficult topics.', synonyms: ['aid', 'support', 'serve'] },

  // watch (line 457 - keep 151)
  'beginner/Free Time & Hobbies/watch': { word: 'view', definition: 'To look at something for entertainment', example: 'We view movies together on weekends.', synonyms: ['observe', 'gaze at', 'witness'] },

  // buy (line 498 - keep 185)
  'beginner/Shopping & Money/buy': { word: 'purchase', definition: 'To obtain goods by paying money', example: 'I purchase groceries online every week.', synonyms: ['acquire', 'obtain', 'procure'] },

  // pay (line 502 - keep 186)
  'beginner/Shopping & Money/pay': { word: 'settle', definition: 'To pay money that you owe', example: 'Please settle the bill before leaving.', synonyms: ['clear', 'discharge', 'remit'] },

  // shine (line 1414 - keep 199)
  'intermediate/Weather & Nature/shine': { word: 'glow', definition: 'To give off steady soft light', example: 'The sunset glowed orange and pink.', synonyms: ['gleam', 'radiate', 'beam'] },

  // cook (line 424 - keep 221)
  'beginner/Food & Cooking/cook': { word: 'prepare', definition: 'To make food ready for eating', example: 'I prepare meals for the whole family.', synonyms: ['fix', 'make', 'whip up'] },

  // boil (line 1403 - keep 222)
  'intermediate/Home & DIY/boil': { word: 'simmer', definition: 'To cook liquid at just below boiling', example: 'Simmer the sauce for twenty minutes.', synonyms: ['stew', 'heat gently', 'bubble'] },

  // door (line 600 - keep 257)
  'beginner/Home & Furniture/door': { word: 'entrance', definition: 'The opening where you enter a building', example: 'Wait at the entrance until I arrive.', synonyms: ['entry', 'doorway', 'portal'] },

  // chair (line 598 - keep 259)
  'beginner/Home & Furniture/chair': { word: 'seat', definition: 'Something to sit on with a back', example: 'Please take a seat and wait here.', synonyms: ['stool', 'bench', 'sitting place'] },

  // table (line 597 - keep 260)
  'beginner/Home & Furniture/table': { word: 'counter', definition: 'A flat surface for working or serving', example: 'Put the dishes on the kitchen counter.', synonyms: ['surface', 'worktop', 'bench'] },

  // bed (line 599 - keep 261)
  'beginner/Home & Furniture/bed': { word: 'mattress', definition: 'The soft part of a bed for sleeping', example: 'A good mattress helps you sleep better.', synonyms: ['bedding', 'pad', 'cushion'] },

  // exercise (line 1382 - keep 347)
  'intermediate/Health & Fitness/exercise': { word: 'workout', definition: 'A session of physical activity', example: 'I do a quick workout every morning.', synonyms: ['training', 'drill', 'routine'] },

  // compromise (line 1787 - keep 359)
  'upper-intermediate/Planning & Problem Solving/compromise': { word: 'concede', definition: 'To give up something in negotiation', example: 'Both parties must concede some points.', synonyms: ['yield', 'give ground', 'settle'] },

  // borrow (line 1772 - keep 400)
  'upper-intermediate/Compare & Explain/borrow': { word: 'obtain on loan', definition: 'To get something temporarily from others', example: 'She obtained equipment on loan from the lab.', synonyms: ['get temporarily', 'rent', 'secure'] },

  // lend (line 1773 - keep 401)
  'upper-intermediate/Compare & Explain/lend': { word: 'loan out', definition: 'To give something for temporary use', example: 'Libraries loan out books for three weeks.', synonyms: ['advance', 'provide', 'supply'] },

  // compare (line 1774 - keep 402)
  'upper-intermediate/Compare & Explain/compare': { word: 'contrast', definition: 'To show differences between things', example: 'The study contrasts urban and rural life.', synonyms: ['differentiate', 'distinguish', 'juxtapose'] },

  // explain (line 1775 - keep 403)
  'upper-intermediate/Compare & Explain/explain': { word: 'clarify', definition: 'To make something easier to understand', example: 'Could you clarify the instructions please?', synonyms: ['illuminate', 'elucidate', 'simplify'] },

  // arrange (line 1776 - keep 404)
  'upper-intermediate/Compare & Explain/arrange': { word: 'coordinate', definition: 'To organize different elements together', example: 'She coordinated the event with great skill.', synonyms: ['organize', 'orchestrate', 'manage'] },

  // fluctuate (line 1906 - keep 628)
  'upper-intermediate/Trends & Change/fluctuate': { word: 'oscillate', definition: 'To move back and forth regularly', example: 'Temperatures oscillate between extremes.', synonyms: ['swing', 'waver', 'vary'] },

  // stabilize (line 1907 - keep 629)
  'upper-intermediate/Trends & Change/stabilize': { word: 'steady', definition: 'To make or become firm and constant', example: 'The market began to steady after panic.', synonyms: ['balance', 'settle', 'even out'] },

  // plateau (line 1910 - keep 632)
  'upper-intermediate/Trends & Change/plateau': { word: 'level off', definition: 'To stop increasing and stay constant', example: 'Sales leveled off after the initial surge.', synonyms: ['flatten', 'stabilize', 'even out'] },

  // investigate (line 1997 - keep 640)
  'upper-intermediate/Inquiry & Research/investigate': { word: 'examine', definition: 'To inspect closely for understanding', example: 'Researchers examine data for patterns.', synonyms: ['study', 'analyze', 'probe'] },

  // assess (line 1796 - keep 641)
  'upper-intermediate/Evaluation & Reasoning/assess': { word: 'appraise', definition: 'To evaluate quality or worth formally', example: 'Experts appraised the antique collection.', synonyms: ['judge', 'rate', 'gauge'] },

  // revise (line 1858 - keep 644)
  'upper-intermediate/Planning & Coordination/revise': { word: 'amend', definition: 'To make changes to improve text', example: 'The committee amended the original proposal.', synonyms: ['modify', 'alter', 'update'] },

  // profit (line 1631 - keep 676)
  'intermediate/Business Basics/profit': { word: 'earnings', definition: 'Money gained from business activity', example: 'Company earnings exceeded expectations this year.', synonyms: ['income', 'revenue', 'returns'] },

  // campaign (line 1297 - keep 692)
  'office/Marketing & Sales/campaign': { word: 'initiative', definition: 'An organized effort to achieve a goal', example: 'The marketing initiative increased awareness.', synonyms: ['program', 'drive', 'effort'] },

  // broadcast (line 2104 - keep 700)
  'upper-intermediate/Media & Communication/broadcast': { word: 'transmit', definition: 'To send out signals or information', example: 'Stations transmit news around the clock.', synonyms: ['beam', 'relay', 'disseminate'] },

  // refuse (line 1426 - keep 868)
  'intermediate/Opinions & Decisions/refuse': { word: 'decline', definition: 'To politely say no to an offer', example: 'She declined the invitation gracefully.', synonyms: ['reject', 'turn down', 'deny'] },

  // consider (line 1427 - keep 869)
  'intermediate/Opinions & Decisions/consider': { word: 'contemplate', definition: 'To think about something carefully', example: 'We contemplated the options overnight.', synonyms: ['ponder', 'reflect on', 'deliberate'] },

  // volunteer (line 1439 - keep 881)
  'intermediate/Community & Volunteering/volunteer': { word: 'offer', definition: 'To present help without being asked', example: 'Many locals offered to help with cleanup.', synonyms: ['come forward', 'step up', 'contribute'] },

  // support (line 1440 - keep 882)
  'intermediate/Community & Volunteering/support': { word: 'assist', definition: 'To help someone with practical needs', example: 'Neighbors assist elderly residents weekly.', synonyms: ['aid', 'help', 'back'] },

  // collect (line 1441 - keep 883)
  'intermediate/Community & Volunteering/collect': { word: 'gather', definition: 'To bring things together from various places', example: 'Volunteers gathered donations at the center.', synonyms: ['assemble', 'accumulate', 'compile'] },

  // advertise (line 1442 - keep 884)
  'intermediate/Community & Volunteering/advertise': { word: 'promote', definition: 'To make something known to the public', example: 'They promoted the event on social media.', synonyms: ['publicize', 'market', 'announce'] },

  // install (line 1450 - keep 892)
  'intermediate/Tech Setup/install': { word: 'set up', definition: 'To prepare equipment for use', example: 'Set up the computer before the class.', synonyms: ['configure', 'mount', 'arrange'] },

  // reset (line 1453 - keep 895)
  'intermediate/Tech Setup/reset': { word: 'restart', definition: 'To turn off and on again', example: 'Restart the device if problems continue.', synonyms: ['reboot', 'refresh', 'reinitialize'] },

  // attach (line 1454 - keep 896)
  'intermediate/Tech Setup/attach': { word: 'append', definition: 'To add something at the end', example: 'Append the supporting documents to your email.', synonyms: ['add', 'join', 'include'] },

  // treat (line 1466 - keep 908)
  'intermediate/Health & Recovery/treat': { word: 'cure', definition: 'To restore health through treatment', example: 'Modern medicine can cure many diseases.', synonyms: ['heal', 'remedy', 'restore'] },

  // confirm (line 1475 - keep 917)
  'intermediate/Scheduling & Appointments/confirm': { word: 'verify', definition: 'To check that something is correct', example: 'Please verify your email address below.', synonyms: ['validate', 'check', 'authenticate'] },

  // warn (line 1486 - keep 928)
  'intermediate/Rules & Requests/warn': { word: 'caution', definition: 'To tell someone about possible danger', example: 'Signs caution drivers about the sharp curve.', synonyms: ['alert', 'notify', 'advise'] },

  // permit (line 1487 - keep 929)
  'intermediate/Rules & Requests/permit': { word: 'authorize', definition: 'To give official permission for something', example: 'Only managers can authorize large purchases.', synonyms: ['sanction', 'approve', 'allow'] },

  // forbid (line 1488 - keep 930)
  'intermediate/Rules & Requests/forbid': { word: 'prohibit', definition: 'To officially not allow something', example: 'School rules prohibit mobile phones in class.', synonyms: ['ban', 'disallow', 'bar'] },

  // advise (line 1489 - keep 931)
  'intermediate/Rules & Requests/advise': { word: 'counsel', definition: 'To give professional guidance to someone', example: 'Lawyers counsel clients before court hearings.', synonyms: ['guide', 'direct', 'recommend'] },

  // request (line 1490 - keep 932)
  'intermediate/Rules & Requests/request': { word: 'petition', definition: 'To formally ask for something officially', example: 'Residents petitioned for better street lighting.', synonyms: ['apply for', 'appeal', 'solicit'] },

  // charge (line 1498 - keep 940)
  'intermediate/Orders & Delivery/charge': { word: 'bill', definition: 'To send a request for payment', example: 'The company will bill you monthly.', synonyms: ['invoice', 'debit', 'levy'] },

  // refund (line 1499 - keep 941)
  'intermediate/Orders & Delivery/refund': { word: 'reimburse', definition: 'To pay back money that was spent', example: 'They will reimburse your travel expenses.', synonyms: ['repay', 'compensate', 'return'] },

  // ship (line 1501 - keep 943)
  'intermediate/Orders & Delivery/ship': { word: 'dispatch', definition: 'To send goods to a destination', example: 'We dispatch orders within 24 hours.', synonyms: ['send', 'forward', 'deliver'] },

  // track (line 1502 - keep 944)
  'intermediate/Orders & Delivery/track': { word: 'monitor', definition: 'To watch progress or movement closely', example: 'You can monitor your shipment online.', synonyms: ['follow', 'trace', 'observe'] },

  // persuade (line 1510 - keep 952)
  'intermediate/Conversation & Disagreement/persuade': { word: 'convince', definition: 'To make someone believe or agree', example: 'Data convinced the board to approve funding.', synonyms: ['sway', 'win over', 'influence'] },

  // reply (line 1512 - keep 954)
  'intermediate/Conversation & Disagreement/reply': { word: 'respond', definition: 'To give an answer or reaction', example: 'Please respond to the survey by Friday.', synonyms: ['answer', 'react', 'acknowledge'] },

  // reserve (line 1522 - keep 964)
  'intermediate/Reservations & Changes/reserve': { word: 'book', definition: 'To arrange in advance for later use', example: 'Book your tickets early to save money.', synonyms: ['secure', 'hold', 'pre-order'] },

  // extend (line 1523 - keep 965)
  'intermediate/Reservations & Changes/extend': { word: 'prolong', definition: 'To make something last longer', example: 'They prolonged the deadline by one week.', synonyms: ['lengthen', 'stretch', 'continue'] },

  // upgrade (line 1524 - keep 966)
  'intermediate/Reservations & Changes/upgrade': { word: 'enhance', definition: 'To improve quality or value', example: 'New features enhanced the user experience.', synonyms: ['improve', 'elevate', 'boost'] },

  // assemble (line 1534 - keep 976)
  'intermediate/Assembly & Fixing/assemble': { word: 'construct', definition: 'To build something from parts', example: 'Workers constructed the stage overnight.', synonyms: ['build', 'erect', 'piece together'] },

  // secure (line 1537 - keep 979)
  'intermediate/Assembly & Fixing/secure': { word: 'fasten', definition: 'To fix firmly in place', example: 'Fasten the brackets before hanging shelves.', synonyms: ['fix', 'attach', 'anchor'] },

  // polish (line 1538 - keep 980)
  'intermediate/Assembly & Fixing/polish': { word: 'buff', definition: 'To rub surface until it shines', example: 'Buff the floor to restore its shine.', synonyms: ['shine', 'burnish', 'smooth'] },

  // acknowledge (line 1946 - keep 1132)
  'upper-intermediate/Emphasize & Adapt/acknowledge': { word: 'recognize', definition: 'To accept something as true or valid', example: 'Leaders must recognize both success and failure.', synonyms: ['admit', 'accept', 'affirm'] },

  // coordinate (line 1860 - keep 1145)
  'upper-intermediate/Planning & Coordination/coordinate': { word: 'synchronize', definition: 'To make things happen at the same time', example: 'Teams synchronize efforts across time zones.', synonyms: ['align', 'harmonize', 'integrate'] },

  // delegate (line 2366 - keep 1178)
  'advanced/Authority & Oversight Verbs/delegate': { word: 'assign', definition: 'To give tasks to specific people', example: 'Managers assign projects based on expertise.', synonyms: ['allocate', 'entrust', 'charge'] },

  // streamline (line 2010 - keep 1193)
  'upper-intermediate/Process Improvement/streamline': { word: 'optimize', definition: 'To make something work at peak efficiency', example: 'Engineers optimize code for better performance.', synonyms: ['improve', 'enhance', 'fine-tune'] },

  // evaluate (line 1971 - keep 1213)
  'upper-intermediate/Evaluate & Persuade/evaluate': { word: 'appraise', definition: 'To assess the value or quality', example: 'Committees appraise grant applications fairly.', synonyms: ['judge', 'rate', 'assess'] },

  // benchmark (line 1848 - keep 1216)
  'upper-intermediate/Data & Clarity/benchmark': { word: 'measure', definition: 'To assess against a standard', example: 'Teams measure progress against key indicators.', synonyms: ['gauge', 'assess', 'evaluate'] },

  // troubleshoot (line 2064 - keep 1229)
  'upper-intermediate/Deploy & Maintain/troubleshoot': { word: 'diagnose', definition: 'To identify the cause of a problem', example: 'Technicians diagnose issues systematically.', synonyms: ['debug', 'analyze', 'investigate'] },

  // forecast (line 1859 - keep 1239)
  'upper-intermediate/Planning & Coordination/forecast': { word: 'project', definition: 'To estimate future outcomes', example: 'Analysts project sales for next quarter.', synonyms: ['predict', 'anticipate', 'estimate'] },

  // leverage (line 2388 - keep 1241)
  'advanced/Resource & Allocation Verbs/leverage': { word: 'harness', definition: 'To use resources effectively', example: 'Companies harness technology for growth.', synonyms: ['utilize', 'exploit', 'capitalize'] },

  // compliance (line 1321 - keep 1250)
  'office/Quality & Standards/compliance': { word: 'adherence', definition: 'Following rules or standards strictly', example: 'Strict adherence to guidelines ensures safety.', synonyms: ['conformity', 'observance', 'obedience'] },

  // reconcile (line 1800 - keep 1277)
  'upper-intermediate/Evaluation & Reasoning/reconcile': { word: 'harmonize', definition: 'To make different things work together', example: 'Teams harmonize conflicting priorities carefully.', synonyms: ['balance', 'integrate', 'align'] },

  // stretch (line 1657 - keep 1378)
  'intermediate/Health & Wellness/stretch': { word: 'flex', definition: 'To bend and move muscles', example: 'Flex your fingers to prevent stiffness.', synonyms: ['bend', 'extend', 'loosen'] },

  // breathe (line 1656 - keep 1381)
  'intermediate/Health & Wellness/breathe': { word: 'inhale', definition: 'To take air into your lungs', example: 'Inhale deeply and hold for five seconds.', synonyms: ['breathe in', 'gasp', 'draw breath'] },

  // memorize (line 1714 - keep 1391)
  'intermediate/Learning & Education/memorize': { word: 'retain', definition: 'To keep information in memory', example: 'Students retain facts through repetition.', synonyms: ['remember', 'store', 'recall'] },

  // practice (line 1716 - keep 1392)
  'intermediate/Learning & Education/practice': { word: 'drill', definition: 'To repeat exercises for improvement', example: 'Athletes drill basic techniques daily.', synonyms: ['train', 'rehearse', 'exercise'] },

  // summarize (line 2024 - keep 1393)
  'upper-intermediate/Explain & Restate/summarize': { word: 'condense', definition: 'To make shorter while keeping meaning', example: 'Editors condense lengthy reports for readers.', synonyms: ['abridge', 'shorten', 'compress'] },

  // invest (line 2049 - keep 1630)
  'upper-intermediate/Finance & Procurement/invest': { word: 'fund', definition: 'To provide money for a purpose', example: 'Governments fund research into new energy.', synonyms: ['finance', 'bankroll', 'sponsor'] },

  // conserve (line 2075 - keep 1669)
  'upper-intermediate/Policy & Resources/conserve': { word: 'preserve', definition: 'To protect and keep safe from harm', example: 'Parks preserve natural habitats for wildlife.', synonyms: ['protect', 'maintain', 'safeguard'] },

  // encourage (line 1750 - keep 1682)
  'upper-intermediate/Actions & Attitudes/encourage': { word: 'motivate', definition: 'To give someone reason to act', example: 'Good leaders motivate their teams consistently.', synonyms: ['inspire', 'spur', 'stimulate'] },

  // maintain (line 1762 - keep 1706)
  'upper-intermediate/Decisions & Delivery/maintain': { word: 'sustain', definition: 'To keep something at a steady level', example: 'Discipline helps sustain progress over time.', synonyms: ['uphold', 'preserve', 'continue'] },

  // infer (line 2374 - keep 1798)
  'advanced/Inference & Reasoning Verbs/infer': { word: 'deduce', definition: 'To reach conclusion through reasoning', example: 'Scientists deduced the cause from evidence.', synonyms: ['conclude', 'derive', 'reason'] },

  // articulate (line 2398 - keep 1799)
  'advanced/Communication & Discourse Verbs/articulate': { word: 'express', definition: 'To communicate ideas clearly', example: 'Leaders must express vision convincingly.', synonyms: ['convey', 'voice', 'verbalize'] },

  // scrutinize (line 2422 - keep 1808)
  'advanced/Analysis & Examination Verbs/scrutinize': { word: 'inspect', definition: 'To examine closely and carefully', example: 'Inspectors scrutinized the safety records.', synonyms: ['examine', 'analyze', 'review'] },

  // synthesize (line 2148 - keep 1810)
  'advanced/Academic Writing Verbs/synthesize': { word: 'integrate', definition: 'To combine elements into a whole', example: 'The study integrates findings from multiple sources.', synonyms: ['merge', 'unify', 'blend'] },

  // constrain (line 2306 - keep 1835)
  'advanced/Constraints & Effects Verbs/constrain': { word: 'restrict', definition: 'To limit or hold back', example: 'Budgets restrict expansion opportunities.', synonyms: ['limit', 'confine', 'curb'] },

  // amplify (line 2278 - keep 1881)
  'advanced/Rhetoric & Emphasis Verbs/amplify': { word: 'intensify', definition: 'To make stronger or more extreme', example: 'Media coverage intensified public interest.', synonyms: ['heighten', 'strengthen', 'boost'] },

  // bolster (line 2318 - keep 1894)
  'advanced/Claims & Signals Verbs/bolster': { word: 'reinforce', definition: 'To make stronger or more effective', example: 'Evidence reinforced the original findings.', synonyms: ['strengthen', 'support', 'fortify'] },

  // ascertain (line 2471 - keep 1934)
  'advanced/Knowledge & Expertise Verbs/ascertain': { word: 'determine', definition: 'To find out through investigation', example: 'Tests determined the exact composition.', synonyms: ['establish', 'discover', 'verify'] },

  // expedite (line 2717 - keep 1958)
  'proficient/Proficient  Precision Verbs II/expedite': { word: 'accelerate', definition: 'To speed up a process', example: 'Automation accelerates document processing.', synonyms: ['hasten', 'quicken', 'fast-track'] },

  // contend (line 2752 - keep 1960)
  'proficient/Proficient  Argumentation Verbs/contend': { word: 'maintain', definition: 'To assert something firmly', example: 'Critics maintain the plan has flaws.', synonyms: ['argue', 'assert', 'claim'] },

  // allege (line 2316 - keep 1984)
  'advanced/Claims & Signals Verbs/allege': { word: 'claim', definition: 'To state without full proof', example: 'Reports claimed irregularities in voting.', synonyms: ['assert', 'declare', 'maintain'] },

  // consolidate (line 2448 - keep 2012)
  'advanced/Structure & Organization Verbs/consolidate': { word: 'unify', definition: 'To bring together into one', example: 'The merger unified both departments.', synonyms: ['merge', 'combine', 'integrate'] },

  // mandate (line 2365 - keep 2038)
  'advanced/Authority & Oversight Verbs/mandate': { word: 'require', definition: 'To officially demand compliance', example: 'Law requires disclosure of conflicts.', synonyms: ['oblige', 'compel', 'dictate'] },

  // curate (line 2354 - keep 2101)
  'advanced/Data & Method II Verbs/curate': { word: 'compile', definition: 'To gather and organize material', example: 'Researchers compiled data from surveys.', synonyms: ['assemble', 'collect', 'gather'] },

  // juxtapose (line 2425 - keep 2124)
  'advanced/Analysis & Examination Verbs/juxtapose': { word: 'compare', definition: 'To examine similarities and differences', example: 'The analysis compares two approaches.', synonyms: ['contrast', 'parallel', 'set beside'] },

  // invalidate (line 2462 - keep 2125)
  'advanced/Validity & Legitimacy Verbs/invalidate': { word: 'nullify', definition: 'To make something legally void', example: 'Errors nullified the test results.', synonyms: ['void', 'annul', 'negate'] },

  // promulgate (line 2402 - keep 2134)
  'advanced/Communication & Discourse Verbs/promulgate': { word: 'announce', definition: 'To make known publicly', example: 'Officials announced new regulations today.', synonyms: ['proclaim', 'publish', 'declare'] },

  // adjudicate (line 2362 - keep 2135)
  'advanced/Authority & Oversight Verbs/adjudicate': { word: 'arbitrate', definition: 'To settle disputes as neutral party', example: 'Panels arbitrate contract disputes fairly.', synonyms: ['judge', 'mediate', 'resolve'] },

  // ratify (line 2363 - keep 2136)
  'advanced/Authority & Oversight Verbs/ratify': { word: 'sanction', definition: 'To give official approval', example: 'Boards sanction major policy changes.', synonyms: ['approve', 'confirm', 'authorize'] },

  // stipulate (line 2400 - keep 2194)
  'advanced/Communication & Discourse Verbs/stipulate': { word: 'specify', definition: 'To state requirements clearly', example: 'Guidelines specify acceptable formats.', synonyms: ['define', 'detail', 'prescribe'] },

  // interpolate (line 2426 - keep 2208)
  'advanced/Analysis & Examination Verbs/interpolate': { word: 'estimate', definition: 'To calculate approximate values', example: 'Models estimate missing measurements.', synonyms: ['approximate', 'calculate', 'gauge'] },

  // rebut (line 2401 - keep 2243)
  'advanced/Communication & Discourse Verbs/rebut': { word: 'counter', definition: 'To respond with opposing argument', example: 'Defense countered each prosecution point.', synonyms: ['contradict', 'oppose', 'refute'] },

  // attenuate (line 2413 - keep 2280)
  'advanced/Change & Transformation Verbs/attenuate': { word: 'diminish', definition: 'To make smaller or weaker', example: 'Time diminished the initial impact.', synonyms: ['weaken', 'reduce', 'lessen'] },

  // catalyze (line 2414 - keep 2290)
  'advanced/Change & Transformation Verbs/catalyze': { word: 'trigger', definition: 'To cause something to begin', example: 'The report triggered policy reforms.', synonyms: ['spark', 'initiate', 'prompt'] },

  // preclude (line 2716 - keep 2302)
  'proficient/Proficient  Precision Verbs II/preclude': { word: 'prevent', definition: 'To stop from happening', example: 'Conflicts prevent objective review.', synonyms: ['bar', 'prohibit', 'exclude'] },

  // obviate (line 2715 - keep 2303)
  'proficient/Proficient  Precision Verbs II/obviate': { word: 'eliminate', definition: 'To remove the need for something', example: 'Automation eliminates manual data entry.', synonyms: ['remove', 'negate', 'preclude'] },

  // postulate (line 2753 - keep 2375)
  'proficient/Proficient  Argumentation Verbs/postulate': { word: 'hypothesize', definition: 'To propose an explanation tentatively', example: 'Researchers hypothesized a genetic link.', synonyms: ['theorize', 'speculate', 'suppose'] },

  // ameliorate (line 2714 - keep 2411)
  'proficient/Proficient  Precision Verbs II/ameliorate': { word: 'improve', definition: 'To make a bad situation better', example: 'Reforms improved conditions for workers.', synonyms: ['enhance', 'better', 'alleviate'] },

  // ephemeral (line 2693 - keep 2669)
  'proficient/Elite Adjectives/ephemeral': { word: 'fleeting', definition: 'Lasting only a very short time', example: 'Success can be fleeting without effort.', synonyms: ['transient', 'brief', 'short-lived'] },

  // magnanimous (line 2763 - keep 2691)
  'proficient/Proficient  Nuanced Adjectives II/magnanimous': { word: 'benevolent', definition: 'Kind and generous to others', example: 'The benevolent donor funded scholarships.', synonyms: ['charitable', 'kind-hearted', 'generous'] },
};

// Track which words we've already replaced to avoid double-replacement
const replacedLines = new Set();

// Process each duplicate
for (const dup of duplicates) {
  // Skip first occurrence, process rest
  for (let i = 1; i < dup.occurrences.length; i++) {
    const occ = dup.occurrences[i];
    const lineNum = occ.lineNum;

    // Build key to find replacement
    const key = `${occ.level}/${occ.set}/${dup.word}`;
    const key2 = `${occ.level}/${occ.set}/${dup.word}_2`; // For second occurrence in same set

    // Find replacement
    let replacement = replacements[key] || replacements[key2];

    if (!replacement) {
      // If this is third occurrence in same set/level, try _3
      const key3 = `${occ.level}/${occ.set}/${dup.word}_3`;
      replacement = replacements[key3];
    }

    if (replacement && !replacedLines.has(lineNum)) {
      // Find the line and replace the word object
      const oldLine = lines[lineNum - 1];

      // Build the new word object string
      const newWordStr = `{ word: '${replacement.word}', definition: '${replacement.definition}', example: '${replacement.example}', synonyms: ['${replacement.synonyms.join("', '")}'] }`;

      // Replace the entire word object on this line
      // The word object pattern: { word: '...', definition: '...', example: '...', synonyms: [...] }
      // or can span multiple lines, but in this file they're on single lines

      // Use regex to replace from { word: to the closing }
      const pattern = /\{\s*word:\s*['"][^'"]+['"],\s*definition:\s*['"][^'"]+['"],\s*example:\s*['"][^'"]+['"],\s*(phonetic:\s*['"][^'"]*['"],\s*)?synonyms:\s*\[[^\]]+\]\s*\}/;

      if (pattern.test(oldLine)) {
        lines[lineNum - 1] = oldLine.replace(pattern, newWordStr);
        replacedLines.add(lineNum);
        console.log(`Replaced line ${lineNum}: "${dup.word}" -> "${replacement.word}"`);
      } else {
        console.log(`WARNING: Could not match pattern on line ${lineNum} for "${dup.word}"`);
      }
    } else if (!replacement) {
      console.log(`MISSING REPLACEMENT: ${key} (line ${lineNum})`);
    }
  }
}

// Write the updated file
const updatedContent = lines.join('\n');
fs.writeFileSync(filePath, updatedContent);

console.log(`\n--- Done ---`);
console.log(`Replaced ${replacedLines.size} duplicate words`);

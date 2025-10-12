export interface Word {
  word: string;
  definition: string;
  example: string;
  phonetic: string;
  synonyms: string[];
}

export interface Set {
  id: number | string;
  title: string;
  words?: Word[];
  type?: 'quiz';
  description?: string;
  completed: boolean;
  inProgress?: boolean;
  score?: number;
}

export interface Level {
  id: string;
  name: string;
  description: string;
  cefr: string;
  icon: string;
  sets: Set[];
}

export const levels: Level[] = [
  {
    id: 'beginner',
    name: 'Beginner',
    description: '50 Sets, 250 words at CEFR A1-A2 Level',
    cefr: 'A1-A2',
    icon: '🌱',
    sets: [
      {
        id: 1,
        title: 'A1 — Daily Actions 1',
        words: [
          { word: 'go', phonetic: '/ɡəʊ/', definition: 'To move from one place to another', example: 'We go to school by bus every morning.', synonyms: ['move', 'travel', 'head'] },
          { word: 'come', phonetic: '/kʌm/', definition: 'To move toward here or another person', example: 'Please come to my house after football practice.', synonyms: ['arrive', 'approach', 'get here'] },
          { word: 'eat', phonetic: '/iːt/', definition: 'To put food in mouth and swallow', example: 'We eat together at six with the whole family.', synonyms: ['dine', 'have', 'consume'] },
          { word: 'drink', phonetic: '/drɪŋk/', definition: 'To take liquid into mouth and swallow', example: 'I drink water before running in hot weather.', synonyms: ['sip', 'have', 'gulp'] },
          { word: 'sleep', phonetic: '/sliːp/', definition: 'To rest your body with eyes closed', example: 'Babies sleep a lot during their first months.', synonyms: ['rest', 'nap', 'doze'] }
        ],
        completed: false
      },
      {
        id: 2,
        title: 'A1 — Objects & Handling',
        words: [
          { word: 'get', phonetic: '/ɡet/', definition: 'To receive or obtain something you need', example: 'I get the keys from reception every morning.', synonyms: ['receive', 'obtain', 'pick up'] },
          { word: 'put', phonetic: '/pʊt/', definition: 'To place something in a particular position', example: 'Please put your phone inside the locker now.', synonyms: ['place', 'set', 'lay'] },
          { word: 'take', phonetic: '/teɪk/', definition: 'To remove or pick up for yourself', example: 'You may take one brochure from the desk.', synonyms: ['pick up', 'grab', 'carry off'] },
          { word: 'give', phonetic: '/ɡɪv/', definition: 'To hand something to another person politely', example: 'I give this letter to the manager today.', synonyms: ['hand', 'offer', 'pass'] },
          { word: 'make', phonetic: '/meɪk/', definition: 'To create or produce something new or useful', example: 'We make sandwiches together for the picnic tomorrow.', synonyms: ['create', 'produce', 'build'] }
        ],
        completed: false
      },
      {
        id: 3,
        title: 'A1 — Communication Basics',
        words: [
          { word: 'ask', phonetic: '/ɑːsk/', definition: 'To say words to get information', example: 'You can ask the teacher after the lesson.', synonyms: ['question', 'enquire', 'request'] },
          { word: 'answer', phonetic: '/ˈɑːnsə/', definition: 'To give information after a question', example: 'Please answer the email before lunchtime today.', synonyms: ['reply', 'respond', 'give answer'] },
          { word: 'call', phonetic: '/kɔːl/', definition: 'To phone someone using a telephone', example: 'Can you call me when you arrive downtown?', synonyms: ['phone', 'ring', 'dial'] },
          { word: 'tell', phonetic: '/tɛl/', definition: 'To say information to a person', example: 'Please tell your sister that dinner is ready.', synonyms: ['inform', 'notify', 'say to'] },
          { word: 'talk', phonetic: '/tɔːk/', definition: 'To speak with someone in conversation', example: 'We talk after class about weekend plans.', synonyms: ['speak', 'chat', 'converse'] }
        ],
        completed: false
      },
      {
        id: 4,
        title: 'A1 — Study & Work',
        words: [
          { word: 'read', phonetic: '/riːd/', definition: 'To look at words and understand', example: 'I read a short story before bed.', synonyms: ['scan', 'look over', 'go through'] },
          { word: 'write', phonetic: '/raɪt/', definition: 'To make words with pen or keyboard', example: 'She writes notes during every lecture at college.', synonyms: ['compose', 'note down', 'record'] },
          { word: 'learn', phonetic: '/lɜːn/', definition: 'To get new knowledge or a skill', example: 'We learn new words in English every day.', synonyms: ['pick up', 'acquire', 'master'] },
          { word: 'study', phonetic: '/ˈstʌdi/', definition: 'To spend time learning something carefully', example: 'I study in the library before every exam.', synonyms: ['revise', 'review', 'prepare'] },
          { word: 'work', phonetic: '/wɜːk/', definition: 'To do tasks for money or results', example: 'They work in a café near the station.', synonyms: ['labour', 'do a job', 'be employed'] }
        ],
        completed: false
      },
      {
        id: 5,
        title: 'A1 — Personal Care',
        words: [
          { word: 'wash', phonetic: '/wɒʃ/', definition: 'To clean something using water and soap', example: 'Please wash your hands before you eat dinner.', synonyms: ['clean', 'rinse', 'scrub'] },
          { word: 'brush', phonetic: '/brʌʃ/', definition: 'To clean or smooth with a brush', example: 'I brush my teeth every morning and night.', synonyms: ['clean', 'polish', 'sweep'] },
          { word: 'comb', phonetic: '/kəʊm/', definition: 'To arrange hair using a comb neatly', example: 'She combs her hair before school every day.', synonyms: ['arrange hair', 'tidy hair', 'smooth hair'] },
          { word: 'cut', phonetic: '/kʌt/', definition: 'To use something sharp to divide carefully', example: 'Please cut the apples into small pieces first.', synonyms: ['slice', 'trim', 'chop'] },
          { word: 'shave', phonetic: '/ʃeɪv/', definition: 'To remove hair from skin with razor', example: 'He shaves his face every second morning.', synonyms: ['remove hair', 'razor', 'trim hair'] }
        ],
        completed: false
      },
      {
        id: 6,
        title: 'A1 — Travel Basics',
        words: [
          { word: 'travel', phonetic: '/ˈtrævəl/', definition: 'To go to places, often far away', example: 'We travel by train to see our grandparents.', synonyms: ['journey', 'go', 'move'] },
          { word: 'visit', phonetic: '/ˈvɪzɪt/', definition: 'To go and spend time with someone', example: 'We visit our aunt on Sundays after lunch.', synonyms: ['see', 'call on', 'drop by'] },
          { word: 'leave', phonetic: '/liːv/', definition: 'To go away from a place temporarily', example: 'I leave at six to catch the last bus.', synonyms: ['depart', 'go away', 'set off'] },
          { word: 'arrive', phonetic: '/əˈraɪv/', definition: 'To reach a place at the end', example: 'The bus arrives at nine, so be ready early.', synonyms: ['reach', 'get here', 'come'] },
          { word: 'wait', phonetic: '/weɪt/', definition: 'To stay until something happens or starts', example: 'We wait outside while Dad buys the tickets.', synonyms: ['stay', 'hold on', 'hang on'] }
        ],
        completed: false
      },
      {
        id: 7,
        title: 'A1 — Hand & Carry',
        words: [
          { word: 'use', phonetic: '/juːz/', definition: 'To do something with a thing purposefully', example: 'I use a dictionary when I read news.', synonyms: ['employ', 'apply', 'utilize'] },
          { word: 'hold', phonetic: '/həʊld/', definition: 'To keep something in your hands firmly', example: 'Please hold the ladder while I climb up.', synonyms: ['grip', 'grasp', 'keep'] },
          { word: 'carry', phonetic: '/ˈkæri/', definition: 'To hold and move something somewhere carefully', example: 'They carry the boxes to the car together.', synonyms: ['bring', 'take along', 'tote'] },
          { word: 'drop', phonetic: '/drɒp/', definition: 'To let something fall from hands accidentally', example: 'Don’t drop the glass; it can break easily.', synonyms: ['let fall', 'release', 'let go'] },
          { word: 'pick up', phonetic: '/ˌpɪk ˈʌp/', definition: 'To lift something from a surface gently', example: 'Please pick up the toys before bedtime tonight.', synonyms: ['lift', 'raise', 'collect'] }
        ],
        completed: false
      },
      {
        id: 8,
        title: 'A1 — Time & Routine',
        words: [
          { word: 'start', phonetic: '/stɑːt/', definition: 'To begin doing something or activity now', example: 'We start class at nine on Monday mornings.', synonyms: ['begin', 'begin doing', 'get going'] },
          { word: 'finish', phonetic: '/ˈfɪnɪʃ/', definition: 'To end something you are doing today', example: 'I finish my homework before dinner each night.', synonyms: ['end', 'complete', 'be done'] },
          { word: 'stop', phonetic: '/stɒp/', definition: 'To not continue doing something anymore now', example: 'The buses stop here after ten at night.', synonyms: ['halt', 'quit', 'cease'] },
          { word: 'rest', phonetic: '/rɛst/', definition: 'To relax your body and mind briefly', example: 'Sit down and rest after the long walk.', synonyms: ['relax', 'take a break', 'pause'] },
          { word: 'hurry', phonetic: '/ˈhʌri/', definition: 'To move or act very quickly now', example: 'We must hurry or we will miss the bus.', synonyms: ['rush', 'speed up', 'move fast'] }
        ],
        completed: false
      },
      {
        id: 9,
        title: 'A1 — Family & Friends',
        words: [
          { word: 'meet', phonetic: '/miːt/', definition: 'To see someone by plan or chance', example: 'We meet at the park after school today.', synonyms: ['see', 'get together', 'meet up'] },
          { word: 'help', phonetic: '/hɛlp/', definition: 'To do something to make work easier', example: 'Can you help me carry these bags upstairs?', synonyms: ['assist', 'aid', 'support'] },
          { word: 'thank', phonetic: '/θæŋk/', definition: 'To say you are grateful to someone', example: 'Always thank the driver when you get off.', synonyms: ['say thanks', 'show thanks', 'express thanks'] },
          { word: 'hug', phonetic: '/hʌɡ/', definition: 'To hold someone close with arms tightly', example: 'The children hug their grandparents at the station.', synonyms: ['embrace', 'cuddle', 'hold close'] },
          { word: 'kiss', phonetic: '/kɪs/', definition: 'To touch with lips to show love', example: 'Parents kiss their children goodnight every evening.', synonyms: ['peck', 'smooch', 'give a kiss'] }
        ],
        completed: false
      },
      {
        id: 10,
        title: 'A1 — Senses & Attention',
        words: [
          { word: 'see', phonetic: '/siː/', definition: 'To notice something with your eyes clearly', example: 'I can see the mountains from my window.', synonyms: ['notice', 'spot', 'behold'] },
          { word: 'look', phonetic: '/lʊk/', definition: 'To direct your eyes to something carefully', example: 'Please look at the board during the lesson.', synonyms: ['gaze', 'glance', 'stare'] },
          { word: 'watch', phonetic: '/wɒtʃ/', definition: 'To look at something for time closely', example: 'We watch a short film in class today.', synonyms: ['observe', 'view', 'keep an eye'] },
          { word: 'hear', phonetic: '/hɪə/', definition: 'To notice sounds with your ears clearly', example: 'I can hear music from the next room.', synonyms: ['catch', 'perceive', 'detect'] },
          { word: 'listen', phonetic: '/ˈlɪsən/', definition: 'To pay attention to sounds carefully', example: 'Please listen to the instructions before starting.', synonyms: ['hear attentively', 'pay attention', 'tune in'] }
        ],
        completed: false
      },
      {
        id: 11,
        title: 'A1 — Computer Basics',
        words: [
          { word: 'turn on', phonetic: '/tɜːn ɒn/', definition: 'To start a device so it works', example: 'Please turn on the laptop before the lesson.', synonyms: ['switch on', 'power on', 'start'] },
          { word: 'turn off', phonetic: '/tɜːn ɒf/', definition: 'To stop a device so it sleeps', example: 'Don’t forget to turn off the lights after class.', synonyms: ['switch off', 'power off', 'shut down'] },
          { word: 'click', phonetic: '/klɪk/', definition: 'To press a mouse or button once', example: 'Click the blue button to join the meeting.', synonyms: ['press', 'tap', 'select'] },
          { word: 'type', phonetic: '/taɪp/', definition: 'To write using a computer keyboard carefully', example: 'She types her notes during every lecture now.', synonyms: ['key', 'input', 'enter'] },
          { word: 'save', phonetic: '/seɪv/', definition: 'To store a file so it stays', example: 'Always save your work before closing programs.', synonyms: ['store', 'keep', 'back up'] }
        ],
        completed: false
      },
      {
        id: 12,
        title: 'A1 — Movement & Play',
        words: [
          { word: 'run', phonetic: '/rʌn/', definition: 'To move very fast using your legs', example: 'We run around the track before stretching together.', synonyms: ['sprint', 'jog', 'dash'] },
          { word: 'jump', phonetic: '/dʒʌmp/', definition: 'To jump off the ground with both feet', example: 'The children jump over the small puddles happily.', synonyms: ['leap', 'hop', 'bounce'] },
          { word: 'climb', phonetic: '/klaɪm/', definition: 'To move upward using hands and feet', example: 'We climb the hill slowly to enjoy the view.', synonyms: ['go up', 'scale', 'ascend'] },
          { word: 'throw', phonetic: '/θrəʊ/', definition: 'To throw something forward with your arm', example: 'Please throw the ball gently to the dog.', synonyms: ['toss', 'cast', 'pitch'] },
          { word: 'catch', phonetic: '/kætʃ/', definition: 'To take something that someone throws', example: 'Can you catch this bag while I tie shoes?', synonyms: ['grab', 'take', 'receive'] }
        ],
        completed: false
      },
      {
        id: 13,
        title: 'A1 — Shopping & Errands',
        words: [
          { word: 'buy', phonetic: '/baɪ/', definition: 'To get something by paying money', example: 'We buy fruit at the market on Saturdays.', synonyms: ['purchase', 'get', 'pick up'] },
          { word: 'pay', phonetic: '/peɪ/', definition: 'To give money to someone you owe', example: 'I pay the bill with my card today.', synonyms: ['settle', 'cover', 'pay for'] },
          { word: 'sell', phonetic: '/sɛl/', definition: 'To give something to another for money', example: 'They sell sandwiches and tea at the kiosk.', synonyms: ['offer', 'trade', 'vend'] },
          { word: 'send', phonetic: '/sɛnd/', definition: 'To send something to another place', example: 'I send the parcel today with a tracking code.', synonyms: ['post', 'mail', 'dispatch'] },
          { word: 'bring', phonetic: '/brɪŋ/', definition: 'To take something to a place with you', example: 'Can you bring your laptop to class tomorrow?', synonyms: ['carry', 'take along', 'fetch'] }
        ],
        completed: false
      },
      {
        id: 14,
        title: 'A1 — Weather & Nature',
        words: [
          { word: 'rain', phonetic: '/reɪn/', definition: 'To fall as water drops from clouds', example: 'It often rains here in the spring months.', synonyms: ['drizzle', 'shower', 'pour'] },
          { word: 'snow', phonetic: '/snəʊ/', definition: 'To fall as frozen flakes from clouds', example: 'It might snow tonight on the nearby hills.', synonyms: ['flurry', 'sleet', 'snow lightly'] },
          { word: 'shine', phonetic: '/ʃaɪn/', definition: 'To give bright light, especially the sun', example: 'The sun shines early in summer mornings.', synonyms: ['glow', 'gleam', 'glitter'] },
          { word: 'blow', phonetic: '/bləʊ/', definition: 'To move air strongly across an area', example: 'The wind blows hard near the open coast.', synonyms: ['gust', 'puff', 'breeze'] },
          { word: 'fall', phonetic: '/fɔːl/', definition: 'To drop down to the ground from above', example: 'Leaves fall in autumn when days get cooler.', synonyms: ['drop', 'tumble', 'come down'] }
        ],
        completed: false
      },
      {
        id: 15,
        title: 'A1 — Feelings & Choices',
        words: [
          { word: 'like', phonetic: '/laɪk/', definition: 'To think something is good or enjoyable', example: 'I like simple songs with easy words.', synonyms: ['enjoy', 'be into', 'prefer'] },
          { word: 'love', phonetic: '/lʌv/', definition: 'To feel very strong liking for someone', example: 'We love our family and spend time together.', synonyms: ['adore', 'care for', 'be fond of'] },
          { word: 'want', phonetic: '/wɒnt/', definition: 'To wish to have or do something', example: 'I want to learn guitar this summer.', synonyms: ['wish for', 'would like', 'desire'] },
          { word: 'need', phonetic: '/niːd/', definition: 'To require something because it’s necessary now', example: 'We need more chairs for tonight’s meeting.', synonyms: ['require', 'must have', 'have to'] },
          { word: 'hope', phonetic: '/həʊp/', definition: 'To want something good to happen soon', example: 'I hope the weather is sunny tomorrow.', synonyms: ['wish', 'look forward', 'expect'] }
        ],
        completed: false
      }
    ]
  },
  /* Removed deprecated placeholder IELTS block (legacy content retained below)
  {
    id: 'ielts',
        title: 'Daily Routines & Habits',
        words: [
          { word: 'wake up', definition: 'To stop sleeping and become awake', example: 'I usually wake up at 7 a.m.', phonetic: '/weɪk ʌp/', synonyms: ['get up', 'arise', 'awaken'] },
          { word: 'eat', definition: 'To put food in your mouth and swallow it', example: 'They eat breakfast together every morning.', phonetic: '/iːt/', synonyms: ['consume', 'have a meal', 'dine'] },
          { word: 'study', definition: 'To learn something by reading or practicing', example: 'She studies English every evening.', phonetic: '/ˈstʌdi/', synonyms: ['learn', 'practice', 'review'] },
          { word: 'exercise', definition: 'To move your body to stay strong and healthy', example: 'He exercises three times a week at the gym.', phonetic: '/ˈeksərsaɪz/', synonyms: ['work out', 'train', 'keep fit'] },
          { word: 'sleep', definition: 'To rest your body with your eyes closed', example: 'Children should sleep at least nine hours.', phonetic: '/sliːp/', synonyms: ['rest', 'slumber', 'doze'] }
        ],
        completed: true
      },
      {
        id: 5,
        title: 'Set 5',
        words: [
          { word: 'mitigate', definition: 'To make a problem less severe or harmful', example: 'New safety guidelines aim to mitigate risks during maintenance work.', phonetic: '/ˈmɪtɪɡeɪt/', synonyms: ['lessen', 'alleviate', 'reduce', 'ease'] },
          { word: 'allocate', definition: 'To assign resources or duties for particular purposes', example: 'The manager will allocate funds after reviewing each department’s proposal.', phonetic: '/ˈæləkeɪt/', synonyms: ['assign', 'apportion', 'distribute', 'earmark'] },
          { word: 'justify', definition: 'To give reasons showing a decision is reasonable', example: 'You must justify travel expenses before finance approves reimbursement.', phonetic: '/ˈdʒʌstɪfaɪ/', synonyms: ['defend', 'warrant', 'substantiate', 'vindicate'] },
          { word: 'compromise', definition: 'To settle a disagreement by mutual concessions', example: 'After hours of talks, both sides agreed to compromise on payment.', phonetic: '/ˈkɒmprəmaɪz/', synonyms: ['negotiate', 'settle', 'conciliate', 'concede'] },
          { word: 'implement', definition: 'To put a plan or decision into effect', example: 'The city plans to implement the new recycling scheme next spring.', phonetic: '/ˈɪmplɪˌmɛnt/', synonyms: ['execute', 'carry out', 'enforce', 'apply'] }
        ],
        completed: false
      },
      {
        id: 2,
        title: 'Basic Needs & Family',
        words: [
          { word: 'home', definition: 'The place where you live with your family', example: 'I live in a small home with my parents.', phonetic: '/hoʊm/', synonyms: ['house', 'place', 'where you live'] },
          { word: 'food', definition: 'Things you eat to stay healthy and strong', example: 'We eat good food every day at breakfast.', phonetic: '/fuːd/', synonyms: ['meal', 'eating', 'lunch'] },
          { word: 'brother', definition: 'A boy or man who has the same parents as you', example: 'My brother is five years old and likes to play.', phonetic: '/ˈbrʌðər/', synonyms: ['sibling', 'family', 'boy in family'] },
          { word: 'family', definition: 'Your mother, father, brothers, sisters, and other close people', example: 'I love my family and we eat together every evening.', phonetic: '/ˈfæməli/', synonyms: ['relatives', 'parents', 'mom and dad'] },
          { word: 'friend', definition: 'A person you like and enjoy spending time with', example: 'My best friend and I go to school together.', phonetic: '/frend/', synonyms: ['buddy', 'pal', 'someone you like'] }
        ],
        completed: false,
        inProgress: true
      },
      {
        id: 'quiz1',
        title: 'Quiz 1',
        type: 'quiz',
        description: 'A quick recap of sets 1 & 2',
        words: [
          { word: 'wake up', definition: 'To stop sleeping and become awake', example: 'I usually wake up at 7 a.m.', phonetic: '/weɪk ʌp/', synonyms: ['get up', 'arise', 'awaken'] },
          { word: 'eat', definition: 'To put food in your mouth and swallow it', example: 'They eat breakfast together every morning.', phonetic: '/iːt/', synonyms: ['consume', 'have a meal', 'dine'] },
          { word: 'study', definition: 'To learn something by reading or practicing', example: 'She studies English every evening.', phonetic: '/ˈstʌdi/', synonyms: ['learn', 'practice', 'review'] },
          { word: 'exercise', definition: 'To move your body to stay strong and healthy', example: 'He exercises three times a week at the gym.', phonetic: '/ˈeksərsaɪz/', synonyms: ['work out', 'train', 'keep fit'] },
          { word: 'sleep', definition: 'To rest your body with your eyes closed', example: 'Children should sleep at least nine hours.', phonetic: '/sliːp/', synonyms: ['rest', 'slumber', 'doze'] },
          { word: 'home', definition: 'The place where you live with your family', example: 'I live in a small home with my parents.', phonetic: '/hoʊm/', synonyms: ['house', 'place', 'where you live'] },
          { word: 'food', definition: 'Things you eat to stay healthy and strong', example: 'We eat good food every day at breakfast.', phonetic: '/fuːd/', synonyms: ['meal', 'eating', 'lunch'] },
          { word: 'brother', definition: 'A boy or man who has the same parents as you', example: 'My brother is five years old and likes to play.', phonetic: '/ˈbrʌðər/', synonyms: ['sibling', 'family', 'boy in family'] },
          { word: 'family', definition: 'Your mother, father, brothers, sisters, and other close people', example: 'I love my family and we eat together every evening.', phonetic: '/ˈfæməli/', synonyms: ['relatives', 'parents', 'mom and dad'] },
          { word: 'friend', definition: 'A person you like and enjoy spending time with', example: 'My best friend and I go to school together.', phonetic: '/frend/', synonyms: ['buddy', 'pal', 'someone you like'] }
        ],
        completed: false
      },
      {
        id: 4,
        title: 'Set 4',
        words: [
          { word: 'borrow', definition: 'To take and use something temporarily', example: 'You can borrow my umbrella if the rain starts again.', phonetic: '/ˈbɒrəʊ/', synonyms: ['take on loan', 'use temporarily', 'get on loan'] },
          { word: 'lend', definition: 'To give something temporarily to someone', example: 'She agreed to lend me her notes for tomorrow\'s exam.', phonetic: '/lɛnd/', synonyms: ['loan', 'give temporarily', 'advance'] },
          { word: 'compare', definition: 'To examine similarities and differences between things', example: 'Let\'s compare both offers before we choose the cheaper option.', phonetic: '/kəmˈpeə/', synonyms: ['contrast', 'match up', 'evaluate differences'] },
          { word: 'explain', definition: 'To make an idea clear by describing', example: 'Please explain the steps slowly so everyone can follow.', phonetic: '/ɪkˈspleɪn/', synonyms: ['clarify', 'describe', 'make clear'] },
          { word: 'arrange', definition: 'To plan and organize details in order', example: 'We should arrange a meeting for Friday afternoon at school.', phonetic: '/əˈreɪndʒ/', synonyms: ['organize', 'schedule', 'plan'] }
        ],
        completed: false
      },
      {
        id: 3,
        title: 'Education & Work',
        words: [
          { word: 'teacher', definition: 'A person who helps students learn at school', example: 'My teacher is very kind and helps me with math.', phonetic: '/ˈtiːtʃər/', synonyms: ['instructor', 'educator', 'tutor'] },
          { word: 'book', definition: 'Something you read to learn or enjoy stories', example: 'I read a new book about animals every week.', phonetic: '/bʊk/', synonyms: ['text', 'story', 'novel'] },
          { word: 'job', definition: 'Work that you do to earn money', example: 'My father has a good job at a big company.', phonetic: '/dʒɑːb/', synonyms: ['work', 'employment', 'career'] },
          { word: 'write', definition: 'To make words and letters on paper with a pen', example: 'I write my name at the top of my homework.', phonetic: '/raɪt/', synonyms: ['draw letters', 'put down', 'pen'] },
          { word: 'help', definition: 'To make things easier for someone who needs you', example: 'I help my little sister with her homework after school.', phonetic: '/help/', synonyms: ['assist', 'support', 'aid'] }
        ],
        completed: false
      },
      {
        id: 4,
        title: 'Food & Cooking',
        words: [
          { word: 'cook', definition: 'To make food hot and ready to eat', example: 'My mother cooks dinner for us every evening.', phonetic: '/kʊk/', synonyms: ['prepare', 'make', 'fix food'] },
          { word: 'eat', definition: 'To put food in your mouth and swallow it', example: 'We eat lunch at twelve o clock every day.', phonetic: '/iːt/', synonyms: ['have', 'consume', 'munch'] },
          { word: 'drink', definition: 'To take liquid into your mouth and swallow it', example: 'I drink milk with my breakfast every morning.', phonetic: '/drɪŋk/', synonyms: ['sip', 'gulp', 'swallow'] },
          { word: 'taste', definition: 'To try food or drink to see if you like it', example: 'Can I taste your ice cream to see if it is good?', phonetic: '/teɪst/', synonyms: ['try', 'sample', 'test'] },
          { word: 'hungry', definition: 'When you need to eat because your stomach is empty', example: 'I am very hungry after playing outside all morning.', phonetic: '/ˈhʌŋɡri/', synonyms: ['starving', 'wanting food', 'needing food'] }
        ],
        completed: false
      },
      {
        id: 'quiz2',
        title: 'Quiz 2',
        type: 'quiz',
        description: 'A quick recap of sets 3 & 4',
        words: [
          { word: 'teacher', definition: 'A person who helps students learn at school', example: 'My teacher is very kind and helps me with math.', phonetic: '/ˈtiːtʃər/', synonyms: ['instructor', 'educator', 'tutor'] },
          { word: 'book', definition: 'Something you read to learn or enjoy stories', example: 'I read a new book about animals every week.', phonetic: '/bʊk/', synonyms: ['text', 'story', 'novel'] },
          { word: 'job', definition: 'Work that you do to earn money', example: 'My father has a good job at a big company.', phonetic: '/dʒɑːb/', synonyms: ['work', 'employment', 'career'] },
          { word: 'write', definition: 'To make words and letters on paper with a pen', example: 'I write my name at the top of my homework.', phonetic: '/raɪt/', synonyms: ['draw letters', 'put down', 'pen'] },
          { word: 'help', definition: 'To make things easier for someone who needs you', example: 'I help my little sister with her homework after school.', phonetic: '/help/', synonyms: ['assist', 'support', 'aid'] },
          { word: 'cook', definition: 'To make food hot and ready to eat', example: 'My mother cooks dinner for us every evening.', phonetic: '/kʊk/', synonyms: ['prepare', 'make', 'fix food'] },
          { word: 'eat', definition: 'To put food in your mouth and swallow it', example: 'We eat lunch at twelve o clock every day.', phonetic: '/iːt/', synonyms: ['have', 'consume', 'munch'] },
          { word: 'drink', definition: 'To take liquid into your mouth and swallow it', example: 'I drink milk with my breakfast every morning.', phonetic: '/drɪŋk/', synonyms: ['sip', 'gulp', 'swallow'] },
          { word: 'taste', definition: 'To try food or drink to see if you like it', example: 'Can I taste your ice cream to see if it is good?', phonetic: '/teɪst/', synonyms: ['try', 'sample', 'test'] },
          { word: 'hungry', definition: 'When you need to eat because your stomach is empty', example: 'I am very hungry after playing outside all morning.', phonetic: '/ˈhʌŋɡri/', synonyms: ['starving', 'wanting food', 'needing food'] }
        ],
        completed: false
      },
      {
        id: 5,
        title: 'Free Time & Hobbies',
        words: [
          { word: 'play', definition: 'To do something fun like a game or sport', example: 'Children play in the park after school every day.', phonetic: '/pleɪ/', synonyms: ['have fun', 'enjoy', 'do activity'] },
          { word: 'music', definition: 'Sounds that people make with instruments or their voices', example: 'I love to listen to music when I do my homework.', phonetic: '/ˈmjuːzɪk/', synonyms: ['songs', 'tunes', 'melody'] },
          { word: 'watch', definition: 'To look at something for a long time', example: 'We watch TV together as a family every evening.', phonetic: '/wɑːtʃ/', synonyms: ['see', 'look at', 'view'] },
          { word: 'read', definition: 'To look at words and understand what they mean', example: 'I read a story book before I go to bed.', phonetic: '/riːd/', synonyms: ['study', 'look at', 'scan'] },
          { word: 'dance', definition: 'To move your body to music in a fun way', example: 'My sister loves to dance when she hears her favorite songs.', phonetic: '/dæns/', synonyms: ['move', 'groove', 'sway'] }
        ],
        completed: false
      },
      {
        id: 6,
        title: 'Technology & Internet',
        words: [
          { word: 'computer', definition: 'A machine you use to write, play games, and find information', example: 'I use my computer to do homework and play games.', phonetic: '/kəmˈpjuːtər/', synonyms: ['PC', 'laptop', 'machine'] },
          { word: 'phone', definition: 'A small device you use to talk to people far away', example: 'My mother calls me on the phone when she is at work.', phonetic: '/foʊn/', synonyms: ['mobile', 'cell', 'device'] },
          { word: 'internet', definition: 'A network that connects computers around the world', example: 'I search for information on the internet for my school project.', phonetic: '/ˈɪntərnet/', synonyms: ['web', 'online', 'network'] },
          { word: 'video', definition: 'Moving pictures that you watch on a screen', example: 'We watch funny videos of cats on the computer together.', phonetic: '/ˈvɪdioʊ/', synonyms: ['film', 'clip', 'recording'] },
          { word: 'game', definition: 'Something fun you play with rules and sometimes winners', example: 'My favorite game on the computer is about building houses.', phonetic: '/ɡeɪm/', synonyms: ['play', 'activity', 'sport'] }
        ],
        completed: false
      },
      {
        id: 'quiz3',
        title: 'Quiz 3',
        type: 'quiz',
        description: 'A quick recap of sets 5 & 6',
        words: [
          { word: 'play', definition: 'To do something fun like a game or sport', example: 'Children play in the park after school every day.', phonetic: '/pleɪ/', synonyms: ['have fun', 'enjoy', 'do activity'] },
          { word: 'music', definition: 'Sounds that people make with instruments or their voices', example: 'I love to listen to music when I do my homework.', phonetic: '/ˈmjuːzɪk/', synonyms: ['songs', 'tunes', 'melody'] },
          { word: 'watch', definition: 'To look at something for a long time', example: 'We watch TV together as a family every evening.', phonetic: '/wɑːtʃ/', synonyms: ['see', 'look at', 'view'] },
          { word: 'read', definition: 'To look at words and understand what they mean', example: 'I read a story book before I go to bed.', phonetic: '/riːd/', synonyms: ['study', 'look at', 'scan'] },
          { word: 'dance', definition: 'To move your body to music in a fun way', example: 'My sister loves to dance when she hears her favorite songs.', phonetic: '/dæns/', synonyms: ['move', 'groove', 'sway'] },
          { word: 'computer', definition: 'A machine you use to write, play games, and find information', example: 'I use my computer to do homework and play games.', phonetic: '/kəmˈpjuːtər/', synonyms: ['PC', 'laptop', 'machine'] },
          { word: 'phone', definition: 'A small device you use to talk to people far away', example: 'My mother calls me on the phone when she is at work.', phonetic: '/foʊn/', synonyms: ['mobile', 'cell', 'device'] },
          { word: 'internet', definition: 'A network that connects computers around the world', example: 'I search for information on the internet for my school project.', phonetic: '/ˈɪntərnet/', synonyms: ['web', 'online', 'network'] },
          { word: 'video', definition: 'Moving pictures that you watch on a screen', example: 'We watch funny videos of cats on the computer together.', phonetic: '/ˈvɪdioʊ/', synonyms: ['film', 'clip', 'recording'] },
          { word: 'game', definition: 'Something fun you play with rules and sometimes winners', example: 'My favorite game on the computer is about building houses.', phonetic: '/ɡeɪm/', synonyms: ['play', 'activity', 'sport'] }
        ],
        completed: false
      },
      {
        id: 7,
        title: 'Shopping & Money',
        words: [
          { word: 'buy', definition: 'To get something by paying money for it', example: 'I want to buy a new toy with my birthday money.', phonetic: '/baɪ/', synonyms: ['purchase', 'get', 'acquire'] },
          { word: 'money', definition: 'Coins and paper that you use to buy things', example: 'I save my money in a piggy bank at home.', phonetic: '/ˈmʌni/', synonyms: ['cash', 'coins', 'currency'] },
          { word: 'shop', definition: 'A place where people go to buy things they need', example: 'We go to the shop every week to buy food.', phonetic: '/ʃɑːp/', synonyms: ['store', 'market', 'place'] },
          { word: 'price', definition: 'How much money something costs to buy', example: 'The price of this book is five dollars only.', phonetic: '/praɪs/', synonyms: ['cost', 'amount', 'value'] },
          { word: 'pay', definition: 'To give money for something you want to buy', example: 'My father pays for our food at the restaurant.', phonetic: '/peɪ/', synonyms: ['give money', 'spend', 'hand over'] }
        ],
        completed: false
      },
      {
        id: 8,
        title: 'Health & Body',
        words: [
          { word: 'doctor', definition: 'A person who helps sick people get better', example: 'I visit the doctor when I feel sick or have pain.', phonetic: '/ˈdɑːktər/', synonyms: ['physician', 'medic', 'healer'] },
          { word: 'sick', definition: 'When your body does not feel good or healthy', example: 'I stayed home from school because I was sick yesterday.', phonetic: '/sɪk/', synonyms: ['ill', 'unwell', 'not healthy'] },
          { word: 'body', definition: 'All the parts of a person like arms, legs, and head', example: 'I wash my body with soap and water every day.', phonetic: '/ˈbɑːdi/', synonyms: ['self', 'physical form', 'figure'] },
          { word: 'pain', definition: 'A bad feeling when part of your body hurts', example: 'I have pain in my tooth so I need to see the dentist.', phonetic: '/peɪn/', synonyms: ['hurt', 'ache', 'soreness'] },
          { word: 'healthy', definition: 'When your body feels good and works well', example: 'I stay healthy by eating good food and playing sports.', phonetic: '/ˈhelθi/', synonyms: ['well', 'fit', 'strong'] }
        ],
        completed: false
      },
      {
        id: 'quiz4',
        title: 'Quiz 4',
        type: 'quiz',
        description: 'A quick recap of sets 7 & 8',
        words: [
          { word: 'buy', definition: 'To get something by paying money for it', example: 'I want to buy a new toy with my birthday money.', phonetic: '/baɪ/', synonyms: ['purchase', 'get', 'acquire'] },
          { word: 'money', definition: 'Coins and paper that you use to buy things', example: 'I save my money in a piggy bank at home.', phonetic: '/ˈmʌni/', synonyms: ['cash', 'coins', 'currency'] },
          { word: 'shop', definition: 'A place where people go to buy things they need', example: 'We go to the shop every week to buy food.', phonetic: '/ʃɑːp/', synonyms: ['store', 'market', 'place'] },
          { word: 'price', definition: 'How much money something costs to buy', example: 'The price of this book is five dollars only.', phonetic: '/praɪs/', synonyms: ['cost', 'amount', 'value'] },
          { word: 'pay', definition: 'To give money for something you want to buy', example: 'My father pays for our food at the restaurant.', phonetic: '/peɪ/', synonyms: ['give money', 'spend', 'hand over'] },
          { word: 'doctor', definition: 'A person who helps sick people get better', example: 'I visit the doctor when I feel sick or have pain.', phonetic: '/ˈdɑːktər/', synonyms: ['physician', 'medic', 'healer'] },
          { word: 'sick', definition: 'When your body does not feel good or healthy', example: 'I stayed home from school because I was sick yesterday.', phonetic: '/sɪk/', synonyms: ['ill', 'unwell', 'not healthy'] },
          { word: 'body', definition: 'All the parts of a person like arms, legs, and head', example: 'I wash my body with soap and water every day.', phonetic: '/ˈbɑːdi/', synonyms: ['self', 'physical form', 'figure'] },
          { word: 'pain', definition: 'A bad feeling when part of your body hurts', example: 'I have pain in my tooth so I need to see the dentist.', phonetic: '/peɪn/', synonyms: ['hurt', 'ache', 'soreness'] },
          { word: 'healthy', definition: 'When your body feels good and works well', example: 'I stay healthy by eating good food and playing sports.', phonetic: '/ˈhelθi/', synonyms: ['well', 'fit', 'strong'] }
        ],
        completed: false
      },
      {
        id: 9,
        title: 'Weather & Nature',
        words: [
          { word: 'sun', definition: 'The big bright ball of light in the sky during the day', example: 'The sun is very hot and bright in the summer.', phonetic: '/sʌn/', synonyms: ['sunshine', 'daylight', 'star'] },
          { word: 'rain', definition: 'Water that falls from clouds in the sky', example: 'I wear my raincoat when it rains outside.', phonetic: '/reɪn/', synonyms: ['rainfall', 'shower', 'water'] },
          { word: 'tree', definition: 'A tall plant with a trunk, branches, and leaves', example: 'We sit under a big tree when it is hot outside.', phonetic: '/triː/', synonyms: ['plant', 'wood', 'oak'] },
          { word: 'cold', definition: 'When the air or something feels not warm', example: 'I wear a warm jacket when the weather is cold.', phonetic: '/koʊld/', synonyms: ['chilly', 'cool', 'freezing'] },
          { word: 'hot', definition: 'When something has a very high temperature', example: 'The soup is too hot so I wait before I eat it.', phonetic: '/hɑːt/', synonyms: ['warm', 'burning', 'heated'] }
        ],
        completed: false
      },
      {
        id: 10,
        title: 'Emotions & Personality',
        words: [
          { word: 'happy', definition: 'When you feel good and want to smile', example: 'I am happy when I play with my friends at the park.', phonetic: '/ˈhæpi/', synonyms: ['joyful', 'glad', 'cheerful'] },
          { word: 'sad', definition: 'When you feel bad and want to cry', example: 'I feel sad when my best friend is sick and cannot play.', phonetic: '/sæd/', synonyms: ['unhappy', 'upset', 'down'] },
          { word: 'angry', definition: 'When you feel mad because something is not right', example: 'My brother gets angry when someone takes his toys.', phonetic: '/ˈæŋɡri/', synonyms: ['mad', 'upset', 'furious'] },
          { word: 'kind', definition: 'When someone is nice and helps other people', example: 'My teacher is very kind and always helps us learn.', phonetic: '/kaɪnd/', synonyms: ['nice', 'gentle', 'caring'] },
          { word: 'smart', definition: 'When someone can learn things easily and think well', example: 'My sister is smart and gets good grades at school.', phonetic: '/smɑːrt/', synonyms: ['clever', 'intelligent', 'bright'] }
        ],
        completed: false
      },
      {
        id: 'quiz5',
        title: 'Quiz 5',
        type: 'quiz',
        description: 'A quick recap of sets 9 & 10',
        words: [
          { word: 'sun', definition: 'The big bright ball of light in the sky during the day', example: 'The sun is very hot and bright in the summer.', phonetic: '/sʌn/', synonyms: ['sunshine', 'daylight', 'star'] },
          { word: 'rain', definition: 'Water that falls from clouds in the sky', example: 'I wear my raincoat when it rains outside.', phonetic: '/reɪn/', synonyms: ['rainfall', 'shower', 'water'] },
          { word: 'tree', definition: 'A tall plant with a trunk, branches, and leaves', example: 'We sit under a big tree when it is hot outside.', phonetic: '/triː/', synonyms: ['plant', 'wood', 'oak'] },
          { word: 'cold', definition: 'When the air or something feels not warm', example: 'I wear a warm jacket when the weather is cold.', phonetic: '/koʊld/', synonyms: ['chilly', 'cool', 'freezing'] },
          { word: 'hot', definition: 'When something has a very high temperature', example: 'The soup is too hot so I wait before I eat it.', phonetic: '/hɑːt/', synonyms: ['warm', 'burning', 'heated'] },
          { word: 'happy', definition: 'When you feel good and want to smile', example: 'I am happy when I play with my friends at the park.', phonetic: '/ˈhæpi/', synonyms: ['joyful', 'glad', 'cheerful'] },
          { word: 'sad', definition: 'When you feel bad and want to cry', example: 'I feel sad when my best friend is sick and cannot play.', phonetic: '/sæd/', synonyms: ['unhappy', 'upset', 'down'] },
          { word: 'angry', definition: 'When you feel mad because something is not right', example: 'My brother gets angry when someone takes his toys.', phonetic: '/ˈæŋɡri/', synonyms: ['mad', 'upset', 'furious'] },
          { word: 'kind', definition: 'When someone is nice and helps other people', example: 'My teacher is very kind and always helps us learn.', phonetic: '/kaɪnd/', synonyms: ['nice', 'gentle', 'caring'] },
          { word: 'smart', definition: 'When someone can learn things easily and think well', example: 'My sister is smart and gets good grades at school.', phonetic: '/smɑːrt/', synonyms: ['clever', 'intelligent', 'bright'] }
        ],
        completed: false
      },
      {
        id: 11,
        title: 'Transportation & Travel',
        words: [
          { word: 'car', definition: 'A vehicle with four wheels that people drive on roads', example: 'My father drives his car to work every morning.', phonetic: '/kɑːr/', synonyms: ['vehicle', 'auto', 'automobile'] },
          { word: 'bus', definition: 'A big vehicle that carries many people to places', example: 'I take the bus to school with my friends every day.', phonetic: '/bʌs/', synonyms: ['coach', 'transit', 'transport'] },
          { word: 'walk', definition: 'To move by putting one foot in front of the other', example: 'I walk to the park with my dog every afternoon.', phonetic: '/wɔːk/', synonyms: ['stroll', 'step', 'move'] },
          { word: 'travel', definition: 'To go from one place to another place far away', example: 'We travel to the beach for vacation every summer.', phonetic: '/ˈtrævəl/', synonyms: ['journey', 'go', 'trip'] },
          { word: 'ticket', definition: 'A paper you need to ride on a bus, train, or plane', example: 'I buy a ticket before I get on the train.', phonetic: '/ˈtɪkɪt/', synonyms: ['pass', 'fare', 'entry'] }
        ],
        completed: false
      },
      {
        id: 12,
        title: 'Home & Furniture',
        words: [
          { word: 'room', definition: 'A space inside a house with walls and a door', example: 'My room has a bed, a desk, and many books.', phonetic: '/ruːm/', synonyms: ['chamber', 'space', 'area'] },
          { word: 'table', definition: 'A flat surface with legs where you eat or work', example: 'We eat dinner together at the big table every evening.', phonetic: '/ˈteɪbəl/', synonyms: ['desk', 'surface', 'counter'] },
          { word: 'chair', definition: 'A seat with a back and four legs for one person', example: 'I sit on a comfortable chair when I do my homework.', phonetic: '/tʃer/', synonyms: ['seat', 'stool', 'bench'] },
          { word: 'bed', definition: 'A soft place where you sleep at night', example: 'I go to bed at nine o clock every night.', phonetic: '/bed/', synonyms: ['mattress', 'bunk', 'cot'] },
          { word: 'door', definition: 'Something you open to go in or out of a room', example: 'Please close the door when you leave the room.', phonetic: '/dɔːr/', synonyms: ['entrance', 'gate', 'doorway'] }
        ],
        completed: false
      },
      {
        id: 13,
        title: 'Culture & Entertainment',
        words: [
          { word: 'movie', definition: 'A story with moving pictures that you watch on a screen', example: 'We watch a funny movie at the cinema on Saturday.', phonetic: '/ˈmuːvi/', synonyms: ['film', 'picture', 'show'] },
          { word: 'song', definition: 'Music with words that people sing', example: 'My favorite song is about friendship and love.', phonetic: '/sɔːŋ/', synonyms: ['tune', 'melody', 'music'] },
          { word: 'party', definition: 'When people come together to have fun and celebrate', example: 'I am going to a birthday party for my friend tomorrow.', phonetic: '/ˈpɑːrti/', synonyms: ['celebration', 'gathering', 'event'] },
          { word: 'art', definition: 'Beautiful things people make like paintings and drawings', example: 'I love to make art with colorful paints and paper.', phonetic: '/ɑːrt/', synonyms: ['painting', 'drawing', 'artwork'] },
          { word: 'story', definition: 'Words that tell about people and things that happen', example: 'My grandmother tells me a story before I go to sleep.', phonetic: '/ˈstɔːri/', synonyms: ['tale', 'narrative', 'account'] }
        ],
        completed: false
      },
  */
  {
    id: 'ielts',
    name: 'IELTS Vocabulary',
    description: '20 Sets, 100 essential words for IELTS',
    cefr: 'B2-C1',
    icon: '🎓',
    sets: [
      {
        id: 1,
        title: 'IELTS — Data & Trends',
        words: [
          { word: 'fluctuate', phonetic: '/ˈflʌktʃueɪt/', definition: 'To change level up and down frequently', example: 'Prices fluctuate during holidays and after major events.', synonyms: ['vary', 'oscillate', 'shift'] },
          { word: 'stabilize', phonetic: '/ˈsteɪbəlaɪz/', definition: 'To make or become steady and consistent', example: 'Policies aim to stabilize rent after sharp increases.', synonyms: ['steady', 'level out', 'firm up'] },
          { word: 'decline', phonetic: '/dɪˈklaɪn/', definition: 'To decrease gradually in amount or strength', example: 'Birth rates decline as urbanization and education expand.', synonyms: ['decrease', 'drop', 'diminish'] },
          { word: 'surge', phonetic: '/sɜːdʒ/', definition: 'To rise suddenly and strongly in number', example: 'Applications surge when fees are temporarily reduced.', synonyms: ['spike', 'soar', 'jump'] },
          { word: 'plateau', phonetic: '/ˈplætəʊ/', definition: 'To stop rising and stay almost unchanged', example: 'Productivity plateaued despite longer hours and bonuses.', synonyms: ['level off', 'flatten', 'hold steady'] }
        ],
        completed: false
      },
      {
        id: 2,
        title: 'IELTS — Academic Processes',
        words: [
          { word: 'investigate', phonetic: '/ɪnˈvɛstɪɡeɪt/', definition: 'To examine carefully to discover facts', example: 'Researchers investigate causes using interviews and records.', synonyms: ['examine', 'probe', 'look into'] },
          { word: 'assess', phonetic: '/əˈsɛs/', definition: 'To judge quality or amount after review', example: 'Teachers assess speaking using clear public rubrics.', synonyms: ['evaluate', 'appraise', 'gauge'] },
          { word: 'justify', phonetic: '/ˈdʒʌstɪfaɪ/', definition: 'To give reasons to support a decision', example: 'The minister justified delays with evidence of shortages.', synonyms: ['defend', 'substantiate', 'warrant'] },
          { word: 'implement', phonetic: '/ˈɪmplɪmɛnt/', definition: 'To put a plan or decision into action', example: 'Councils implement reforms after community consultations end.', synonyms: ['execute', 'carry out', 'apply'] },
          { word: 'revise', phonetic: '/rɪˈvaɪz/', definition: 'To change something to improve or correct', example: 'Writers revise drafts after feedback from editors.', synonyms: ['amend', 'edit', 'update'] }
        ],
        completed: false
      },
      {
        id: 3,
        title: 'Technology & Innovation',
        words: [
          { word: 'artificial', definition: 'Made by humans rather than occurring naturally', example: 'Artificial intelligence is transforming many industries.', phonetic: '/ˌɑːrtɪˈfɪʃəl/', synonyms: ['synthetic', 'man-made', 'manufactured'] },
          { word: 'digital', definition: 'Using computer technology and the internet', example: 'The digital age has revolutionized communication.', phonetic: '/ˈdɪdʒɪtəl/', synonyms: ['electronic', 'computerized', 'virtual'] },
          { word: 'algorithm', definition: 'A set of rules for solving problems in computing', example: 'Search engines use complex algorithms to rank results.', phonetic: '/ˈælɡərɪðəm/', synonyms: ['formula', 'procedure', 'method'] },
          { word: 'automation', definition: 'Using machines to do work without human control', example: 'Automation has increased efficiency in manufacturing.', phonetic: '/ˌɔːtəˈmeɪʃən/', synonyms: ['mechanization', 'robotization', 'computerization'] },
          { word: 'breakthrough', definition: 'An important discovery or development', example: 'Scientists achieved a breakthrough in cancer research.', phonetic: '/ˈbreɪkθruː/', synonyms: ['advance', 'discovery', 'innovation'] }
        ],
        completed: false
      },
      {
        id: 4,
        title: 'Health & Medicine',
        words: [
          { word: 'diagnosis', definition: 'The identification of an illness or disease', example: 'Early diagnosis can significantly improve treatment outcomes.', phonetic: '/ˌdaɪəɡˈnoʊsɪs/', synonyms: ['identification', 'detection', 'assessment'] },
          { word: 'symptom', definition: 'A sign that indicates the presence of disease', example: 'Fever is a common symptom of many infections.', phonetic: '/ˈsɪmptəm/', synonyms: ['indication', 'sign', 'manifestation'] },
          { word: 'treatment', definition: 'Medical care given to a patient for an illness', example: 'The new treatment shows promising results for diabetes.', phonetic: '/ˈtriːtmənt/', synonyms: ['therapy', 'remedy', 'care'] },
          { word: 'prevention', definition: 'Actions taken to stop something from happening', example: 'Prevention is better than cure in healthcare.', phonetic: '/prɪˈvenʃən/', synonyms: ['precaution', 'protection', 'deterrence'] },
          { word: 'immunity', definition: 'The body\'s ability to resist infection', example: 'Vaccines help build immunity against diseases.', phonetic: '/ɪˈmjuːnəti/', synonyms: ['resistance', 'protection', 'defense'] }
        ],
        completed: false
      },
      {
        id: 5,
        title: 'Business & Economics',
        words: [
          { word: 'profit', definition: 'Money gained from business after costs are paid', example: 'The company reported record profits this quarter.', phonetic: '/ˈprɑːfɪt/', synonyms: ['earnings', 'revenue', 'income'] },
          { word: 'investment', definition: 'Money put into a business to make more money', example: 'Foreign investment has boosted the local economy.', phonetic: '/ɪnˈvestmənt/', synonyms: ['funding', 'capital', 'financing'] },
          { word: 'inflation', definition: 'A general increase in prices over time', example: 'High inflation reduces people\'s purchasing power.', phonetic: '/ɪnˈfleɪʃən/', synonyms: ['price rise', 'cost increase', 'escalation'] },
          { word: 'entrepreneur', definition: 'Someone who starts and runs a business', example: 'Young entrepreneurs are driving innovation in tech.', phonetic: '/ˌɑːntrəprəˈnɜːr/', synonyms: ['business owner', 'innovator', 'founder'] },
          { word: 'consumer', definition: 'A person who buys goods or services', example: 'Consumer demand influences market trends.', phonetic: '/kənˈsuːmər/', synonyms: ['buyer', 'customer', 'purchaser'] }
        ],
        completed: false
      },
      {
        id: 6,
        title: 'Government & Politics',
        words: [
          { word: 'legislation', definition: 'Laws passed by a government', example: 'New legislation aims to protect workers\' rights.', phonetic: '/ˌledʒɪˈsleɪʃən/', synonyms: ['laws', 'regulations', 'statutes'] },
          { word: 'democracy', definition: 'A system where people vote to choose leaders', example: 'Democracy ensures citizens have a voice in government.', phonetic: '/dɪˈmɑːkrəsi/', synonyms: ['self-government', 'republic', 'freedom'] },
          { word: 'policy', definition: 'A plan or course of action by a government', example: 'The government introduced a new education policy.', phonetic: '/ˈpɑːləsi/', synonyms: ['strategy', 'plan', 'approach'] },
          { word: 'parliament', definition: 'The group of elected representatives who make laws', example: 'Parliament debated the healthcare reform bill.', phonetic: '/ˈpɑːrləmənt/', synonyms: ['legislature', 'congress', 'assembly'] },
          { word: 'campaign', definition: 'Organized activities to achieve a political goal', example: 'The election campaign focused on economic issues.', phonetic: '/kæmˈpeɪn/', synonyms: ['drive', 'movement', 'initiative'] }
        ],
        completed: false
      },
      {
        id: 7,
        title: 'Media & Communication',
        words: [
          { word: 'broadcast', definition: 'To send out programs on TV or radio', example: 'The news is broadcast live every evening at six.', phonetic: '/ˈbrɔːdkæst/', synonyms: ['transmit', 'air', 'televise'] },
          { word: 'journalism', definition: 'The work of collecting and reporting news', example: 'Quality journalism is essential for democracy.', phonetic: '/ˈdʒɜːrnəlɪzəm/', synonyms: ['reporting', 'news media', 'press'] },
          { word: 'censorship', definition: 'Control of what can be published or broadcast', example: 'Many countries practice strict internet censorship.', phonetic: '/ˈsensərʃɪp/', synonyms: ['suppression', 'restriction', 'control'] },
          { word: 'propaganda', definition: 'Information used to promote a political cause', example: 'Wartime propaganda influenced public opinion.', phonetic: '/ˌprɑːpəˈɡændə/', synonyms: ['promotion', 'publicity', 'advertising'] },
          { word: 'editorial', definition: 'An article expressing the editor\'s opinion', example: 'The newspaper\'s editorial criticized the new law.', phonetic: '/ˌedɪˈtɔːriəl/', synonyms: ['opinion piece', 'commentary', 'column'] }
        ],
        completed: false
      },
      {
        id: 8,
        title: 'Social Issues',
        words: [
          { word: 'inequality', definition: 'Unfair difference between groups in society', example: 'Income inequality has widened in recent decades.', phonetic: '/ˌɪnɪˈkwɑːləti/', synonyms: ['disparity', 'imbalance', 'injustice'] },
          { word: 'poverty', definition: 'The state of being extremely poor', example: 'Many organizations work to alleviate global poverty.', phonetic: '/ˈpɑːvərti/', synonyms: ['destitution', 'hardship', 'deprivation'] },
          { word: 'discrimination', definition: 'Unfair treatment based on characteristics', example: 'Laws prohibit discrimination based on race or gender.', phonetic: '/dɪˌskrɪmɪˈneɪʃən/', synonyms: ['prejudice', 'bias', 'intolerance'] },
          { word: 'welfare', definition: 'Government support for people in need', example: 'The welfare system provides assistance to unemployed citizens.', phonetic: '/ˈwelfer/', synonyms: ['social security', 'benefits', 'aid'] },
          { word: 'diversity', definition: 'The inclusion of people from different backgrounds', example: 'Workplace diversity brings different perspectives and ideas.', phonetic: '/daɪˈvɜːrsəti/', synonyms: ['variety', 'multiculturalism', 'inclusion'] }
        ],
        completed: false
      },
      {
        id: 9,
        title: 'Arts & Culture',
        words: [
          { word: 'aesthetic', definition: 'Concerned with beauty or appreciation of beauty', example: 'The building\'s aesthetic appeal attracts many visitors.', phonetic: '/esˈθetɪk/', synonyms: ['artistic', 'beautiful', 'pleasing'] },
          { word: 'exhibition', definition: 'A public display of art or other items', example: 'The museum hosts a new exhibition every month.', phonetic: '/ˌeksɪˈbɪʃən/', synonyms: ['show', 'display', 'presentation'] },
          { word: 'contemporary', definition: 'Belonging to the present time', example: 'Contemporary art often challenges traditional ideas.', phonetic: '/kənˈtempəreri/', synonyms: ['modern', 'current', 'present-day'] },
          { word: 'heritage', definition: 'Traditions and culture passed down generations', example: 'UNESCO protects sites of cultural heritage worldwide.', phonetic: '/ˈherɪtɪdʒ/', synonyms: ['legacy', 'tradition', 'inheritance'] },
          { word: 'masterpiece', definition: 'An outstanding work of art or craftsmanship', example: 'The Mona Lisa is considered a Renaissance masterpiece.', phonetic: '/ˈmæstərpiːs/', synonyms: ['masterwork', 'classic', 'triumph'] }
        ],
        completed: false
      },
      {
        id: 10,
        title: 'Science & Research',
        words: [
          { word: 'hypothesis', definition: 'A proposed explanation that can be tested', example: 'Scientists test their hypothesis through experiments.', phonetic: '/haɪˈpɑːθəsɪs/', synonyms: ['theory', 'assumption', 'proposition'] },
          { word: 'experiment', definition: 'A scientific test to prove or discover something', example: 'The experiment yielded surprising results.', phonetic: '/ɪkˈsperɪmənt/', synonyms: ['test', 'trial', 'investigation'] },
          { word: 'evidence', definition: 'Facts or information that prove something', example: 'There is strong evidence supporting the theory.', phonetic: '/ˈevɪdəns/', synonyms: ['proof', 'data', 'confirmation'] },
          { word: 'analysis', definition: 'Detailed examination of something', example: 'Statistical analysis revealed important patterns.', phonetic: '/əˈnæləsɪs/', synonyms: ['examination', 'evaluation', 'study'] },
          { word: 'methodology', definition: 'A system of methods used in research', example: 'The research methodology was clearly explained.', phonetic: '/ˌmeθəˈdɑːlədʒi/', synonyms: ['approach', 'procedure', 'technique'] }
        ],
        completed: false
      },
      {
        id: 11,
        title: 'Travel & Tourism',
        words: [
          { word: 'destination', definition: 'The place where someone is going', example: 'Paris remains a popular tourist destination.', phonetic: '/ˌdestɪˈneɪʃən/', synonyms: ['location', 'place', 'spot'] },
          { word: 'itinerary', definition: 'A planned route or journey schedule', example: 'Our itinerary includes visits to five countries.', phonetic: '/aɪˈtɪnəreri/', synonyms: ['schedule', 'plan', 'route'] },
          { word: 'accommodation', definition: 'A place where people can stay temporarily', example: 'The hotel offers comfortable accommodation for guests.', phonetic: '/əˌkɑːməˈdeɪʃən/', synonyms: ['lodging', 'housing', 'quarters'] },
          { word: 'hospitality', definition: 'Friendly and generous treatment of guests', example: 'The hospitality industry employs millions worldwide.', phonetic: '/ˌhɑːspɪˈtæləti/', synonyms: ['welcome', 'friendliness', 'service'] },
          { word: 'attraction', definition: 'A place of interest that tourists visit', example: 'The Eiffel Tower is Paris\'s most famous attraction.', phonetic: '/əˈtrækʃən/', synonyms: ['site', 'landmark', 'feature'] }
        ],
        completed: false
      },
      {
        id: 12,
        title: 'Food & Agriculture',
        words: [
          { word: 'organic', definition: 'Produced without artificial chemicals', example: 'Organic farming avoids synthetic pesticides.', phonetic: '/ɔːrˈɡænɪk/', synonyms: ['natural', 'chemical-free', 'biological'] },
          { word: 'nutrition', definition: 'The process of getting food for good health', example: 'Proper nutrition is essential for children\'s development.', phonetic: '/nuːˈtrɪʃən/', synonyms: ['nourishment', 'diet', 'sustenance'] },
          { word: 'cultivation', definition: 'The process of growing plants for food', example: 'Rice cultivation requires abundant water supply.', phonetic: '/ˌkʌltɪˈveɪʃən/', synonyms: ['farming', 'agriculture', 'growing'] },
          { word: 'harvest', definition: 'The gathering of mature crops', example: 'Farmers celebrate after a successful harvest.', phonetic: '/ˈhɑːrvɪst/', synonyms: ['crop', 'yield', 'gathering'] },
          { word: 'livestock', definition: 'Farm animals raised for food or products', example: 'Livestock farming contributes to greenhouse gas emissions.', phonetic: '/ˈlaɪvstɑːk/', synonyms: ['cattle', 'animals', 'farm animals'] }
        ],
        completed: false
      },
      {
        id: 13,
        title: 'Urban Development',
        words: [
          { word: 'infrastructure', definition: 'Basic systems and services in a city', example: 'Good infrastructure is vital for economic growth.', phonetic: '/ˈɪnfrəstrʌktʃər/', synonyms: ['facilities', 'systems', 'services'] },
          { word: 'residential', definition: 'Relating to areas where people live', example: 'The residential district is quiet and peaceful.', phonetic: '/ˌrezɪˈdenʃəl/', synonyms: ['housing', 'domestic', 'suburban'] },
          { word: 'metropolitan', definition: 'Relating to a large city and its suburbs', example: 'The metropolitan area has over 10 million residents.', phonetic: '/ˌmetrəˈpɑːlɪtən/', synonyms: ['urban', 'city', 'municipal'] },
          { word: 'congestion', definition: 'Overcrowding causing traffic delays', example: 'Traffic congestion worsens during rush hour.', phonetic: '/kənˈdʒestʃən/', synonyms: ['crowding', 'jam', 'bottleneck'] },
          { word: 'zoning', definition: 'Dividing land into areas for specific uses', example: 'Zoning laws regulate commercial and residential areas.', phonetic: '/ˈzoʊnɪŋ/', synonyms: ['planning', 'designation', 'allocation'] }
        ],
        completed: false
      },
      {
        id: 14,
        title: 'Education System',
        words: [
          { word: 'curriculum', definition: 'The subjects taught in a school or course', example: 'The school updated its curriculum to include coding.', phonetic: '/kəˈrɪkjələm/', synonyms: ['syllabus', 'program', 'course'] },
          { word: 'pedagogy', definition: 'The method and practice of teaching', example: 'Modern pedagogy emphasizes student-centered learning.', phonetic: '/ˈpedəɡɑːdʒi/', synonyms: ['teaching', 'instruction', 'education'] },
          { word: 'literacy', definition: 'The ability to read and write', example: 'Improving literacy rates is a government priority.', phonetic: '/ˈlɪtərəsi/', synonyms: ['reading ability', 'education', 'learning'] },
          { word: 'vocational', definition: 'Relating to skills for a particular job', example: 'Vocational training prepares students for careers.', phonetic: '/voʊˈkeɪʃənəl/', synonyms: ['professional', 'occupational', 'career'] },
          { word: 'assessment', definition: 'The process of evaluating students\' knowledge', example: 'Continuous assessment provides better feedback than exams.', phonetic: '/əˈsesmənt/', synonyms: ['evaluation', 'testing', 'examination'] }
        ],
        completed: false
      },
      {
        id: 15,
        title: 'Crime & Law',
        words: [
          { word: 'defendant', definition: 'A person accused of a crime in court', example: 'The defendant pleaded not guilty to all charges.', phonetic: '/dɪˈfendənt/', synonyms: ['accused', 'suspect', 'respondent'] },
          { word: 'prosecution', definition: 'The process of charging someone with a crime', example: 'The prosecution presented compelling evidence.', phonetic: '/ˌprɑːsɪˈkjuːʃən/', synonyms: ['legal action', 'charge', 'indictment'] },
          { word: 'verdict', definition: 'A decision made by a jury in a trial', example: 'The jury reached a guilty verdict after deliberation.', phonetic: '/ˈvɜːrdɪkt/', synonyms: ['decision', 'judgment', 'ruling'] },
          { word: 'justice', definition: 'Fair treatment according to the law', example: 'Everyone deserves access to justice in society.', phonetic: '/ˈdʒʌstɪs/', synonyms: ['fairness', 'equity', 'law'] },
          { word: 'rehabilitation', definition: 'Helping criminals return to normal life', example: 'The program focuses on rehabilitation rather than punishment.', phonetic: '/ˌriːəˌbɪlɪˈteɪʃən/', synonyms: ['reform', 'reintegration', 'restoration'] }
        ],
        completed: false
      },
      {
        id: 16,
        title: 'Psychology & Behavior',
        words: [
          { word: 'cognitive', definition: 'Related to mental processes like thinking', example: 'Cognitive development continues throughout childhood.', phonetic: '/ˈkɑːɡnətɪv/', synonyms: ['mental', 'intellectual', 'cerebral'] },
          { word: 'motivation', definition: 'The reason or desire to do something', example: 'Strong motivation is key to achieving goals.', phonetic: '/ˌmoʊtɪˈveɪʃən/', synonyms: ['drive', 'incentive', 'encouragement'] },
          { word: 'perception', definition: 'The way something is understood or interpreted', example: 'People\'s perception of reality varies greatly.', phonetic: '/pərˈsepʃən/', synonyms: ['understanding', 'interpretation', 'awareness'] },
          { word: 'anxiety', definition: 'A feeling of worry or nervousness', example: 'Test anxiety affects many students\' performance.', phonetic: '/æŋˈzaɪəti/', synonyms: ['worry', 'stress', 'nervousness'] },
          { word: 'resilience', definition: 'The ability to recover from difficulties', example: 'Building resilience helps people cope with challenges.', phonetic: '/rɪˈzɪliəns/', synonyms: ['strength', 'toughness', 'adaptability'] }
        ],
        completed: false
      },
      {
        id: 17,
        title: 'Global Issues',
        words: [
          { word: 'humanitarian', definition: 'Concerned with reducing human suffering', example: 'Humanitarian aid was sent to the disaster zone.', phonetic: '/hjuːˌmænɪˈteriən/', synonyms: ['charitable', 'compassionate', 'benevolent'] },
          { word: 'refugee', definition: 'Someone forced to leave their country', example: 'Millions of refugees seek safety from conflict.', phonetic: '/ˌrefjuˈdʒiː/', synonyms: ['displaced person', 'asylum seeker', 'migrant'] },
          { word: 'conflict', definition: 'A serious disagreement or war', example: 'International organizations work to resolve conflicts.', phonetic: '/ˈkɑːnflɪkt/', synonyms: ['war', 'dispute', 'clash'] },
          { word: 'famine', definition: 'Extreme shortage of food affecting many people', example: 'Drought often leads to famine in vulnerable regions.', phonetic: '/ˈfæmɪn/', synonyms: ['starvation', 'hunger', 'scarcity'] },
          { word: 'pandemic', definition: 'A disease outbreak affecting multiple countries', example: 'The pandemic changed how people work and communicate.', phonetic: '/pænˈdemɪk/', synonyms: ['epidemic', 'outbreak', 'plague'] }
        ],
        completed: false
      },
      {
        id: 18,
        title: 'Sports & Fitness',
        words: [
          { word: 'athletic', definition: 'Physically strong and good at sports', example: 'Athletic performance improves with regular training.', phonetic: '/æθˈletɪk/', synonyms: ['fit', 'muscular', 'sporty'] },
          { word: 'endurance', definition: 'The ability to continue a difficult activity', example: 'Marathon running requires great endurance.', phonetic: '/ɪnˈdʊrəns/', synonyms: ['stamina', 'persistence', 'resilience'] },
          { word: 'competition', definition: 'An organized event where people compete', example: 'The competition attracts athletes from around the world.', phonetic: '/ˌkɑːmpəˈtɪʃən/', synonyms: ['contest', 'tournament', 'championship'] },
          { word: 'stamina', definition: 'Physical strength to sustain prolonged effort', example: 'Building stamina takes consistent exercise and training.', phonetic: '/ˈstæmɪnə/', synonyms: ['endurance', 'energy', 'staying power'] },
          { word: 'performance', definition: 'How well someone does in a sport or activity', example: 'His performance in the finals was outstanding.', phonetic: '/pərˈfɔːrməns/', synonyms: ['achievement', 'execution', 'showing'] }
        ],
        completed: false
      },
      {
        id: 19,
        title: 'Finance & Banking',
        words: [
          { word: 'mortgage', definition: 'A loan to buy property, paid back over years', example: 'They took out a mortgage to purchase their first home.', phonetic: '/ˈmɔːrɡɪdʒ/', synonyms: ['loan', 'debt', 'financing'] },
          { word: 'credit', definition: 'The ability to borrow money to be paid later', example: 'Good credit history helps secure better loan rates.', phonetic: '/ˈkredɪt/', synonyms: ['trust', 'borrowing', 'lending'] },
          { word: 'assets', definition: 'Valuable things owned by a person or company', example: 'The company\'s assets include property and equipment.', phonetic: '/ˈæsets/', synonyms: ['possessions', 'property', 'resources'] },
          { word: 'budget', definition: 'A plan for spending money over a period', example: 'Creating a budget helps manage personal finances.', phonetic: '/ˈbʌdʒɪt/', synonyms: ['financial plan', 'allocation', 'estimate'] },
          { word: 'transaction', definition: 'A business deal or exchange of money', example: 'Online transactions have become increasingly common.', phonetic: '/trænˈzækʃən/', synonyms: ['deal', 'exchange', 'transfer'] }
        ],
        completed: false
      },
      {
        id: 20,
        title: 'Employment & Career',
        words: [
          { word: 'qualification', definition: 'Skills or knowledge needed for a job', example: 'A degree is the minimum qualification for this position.', phonetic: '/ˌkwɑːlɪfɪˈkeɪʃən/', synonyms: ['credential', 'certificate', 'competency'] },
          { word: 'promotion', definition: 'Moving to a higher position at work', example: 'She received a promotion after five years of service.', phonetic: '/prəˈmoʊʃən/', synonyms: ['advancement', 'upgrade', 'elevation'] },
          { word: 'resignation', definition: 'The act of leaving a job voluntarily', example: 'His resignation was accepted with immediate effect.', phonetic: '/ˌrezɪɡˈneɪʃən/', synonyms: ['departure', 'quitting', 'withdrawal'] },
          { word: 'productivity', definition: 'The rate at which work is completed', example: 'Remote work has increased productivity for many employees.', phonetic: '/ˌproʊdʌkˈtɪvəti/', synonyms: ['efficiency', 'output', 'performance'] },
          { word: 'colleague', definition: 'A person you work with professionally', example: 'My colleagues are supportive and easy to work with.', phonetic: '/ˈkɑːliːɡ/', synonyms: ['coworker', 'associate', 'teammate'] }
        ],
        completed: false
      },
      {
        id: 6,
        title: 'Set 6',
        words: [
          { word: 'refuse', definition: 'To say no and not accept something', example: 'He refused the offer politely after reading the contract carefully.', phonetic: '/rɪˈfjuːz/', synonyms: ['decline', 'reject', 'turn down', 'deny'] },
          { word: 'consider', definition: 'To think carefully before making a decision', example: 'Before renting, consider travel time and the total monthly costs.', phonetic: '/kənˈsɪdə/', synonyms: ['think about', 'contemplate', 'weigh', 'regard'] },
          { word: 'suggest', definition: 'To offer an idea for careful consideration', example: 'Could you suggest another route that avoids the toll road?', phonetic: '/səˈdʒɛst/', synonyms: ['propose', 'recommend', 'put forward', 'advise'] },
          { word: 'avoid', definition: 'To keep away from something potentially unpleasant', example: 'Drivers avoid the bridge at five because traffic is terrible.', phonetic: '/əˈvɔɪd/', synonyms: ['steer clear', 'shun', 'dodge', 'keep away'] },
          { word: 'agree', definition: 'To share the same opinion as someone else', example: 'After some discussion, we agreed to split the work evenly.', phonetic: '/əˈɡriː/', synonyms: ['consent', 'concur', 'go along', 'assent'] }
        ],
        completed: false
      },
      {
        id: 7,
        title: 'Set 7',
        words: [
          { word: 'organize', definition: 'To arrange things so activities run smoothly', example: 'We organized volunteers and tables before the charity market opened.', phonetic: '/ˈɔːɡənaɪz/', synonyms: ['arrange', 'set up', 'coordinate', 'sort out'] },
          { word: 'volunteer', definition: 'To offer help without expecting any payment', example: 'Many residents volunteer on weekends to clean riverside paths.', phonetic: '/ˌvɒlənˈtɪə/', synonyms: ['offer', 'pitch in', 'step forward', 'help'] },
          { word: 'support', definition: 'To help someone by giving practical assistance', example: 'Families support new arrivals with transport, food, and friendly advice.', phonetic: '/səˈpɔːt/', synonyms: ['assist', 'back', 'help', 'stand by'] },
          { word: 'collect', definition: 'To bring together items from different places', example: 'We collected second-hand books from neighbors for school libraries.', phonetic: '/kəˈlɛkt/', synonyms: ['gather', 'pick up', 'assemble', 'accumulate'] },
          { word: 'advertise', definition: 'To promote something publicly to attract customers', example: 'We advertised the concert on posters and the community website.', phonetic: '/ˈædvətaɪz/', synonyms: ['promote', 'publicize', 'market', 'spread'] }
        ],
        completed: false
      },
      {
        id: 8,
        title: 'Set 8',
        words: [
          { word: 'install', definition: 'To put software or equipment in place', example: 'A technician installed the router and checked the signal strength.', phonetic: '/ɪnˈstɔːl/', synonyms: ['set up', 'put in', 'configure', 'mount'] },
          { word: 'update', definition: 'To make something newer with recent changes', example: 'Remember to update apps to fix bugs and improve security.', phonetic: '/ˈʌpdeɪt/', synonyms: ['upgrade', 'refresh', 'patch', 'revise'] },
          { word: 'download', definition: 'To transfer files from internet onto device', example: 'You can download worksheets and use them offline during travel.', phonetic: '/ˈdaʊnˌləʊd/', synonyms: ['get', 'save', 'fetch', 'pull down'] },
          { word: 'reset', definition: 'To return settings to their original state', example: 'If it freezes, reset the device and try again.', phonetic: '/ˌriːˈsɛt/', synonyms: ['restore', 'restart', 'revert', 'clear'] },
          { word: 'attach', definition: 'To fasten or add something to something', example: 'Please attach your CV when you email the application form.', phonetic: '/əˈtætʃ/', synonyms: ['fasten', 'clip', 'join', 'add'] }
        ],
        completed: false
      },
      {
        id: 9,
        title: 'Set 9',
        words: [
          { word: 'prevent', definition: 'To stop something bad from happening again', example: 'Seat belts prevent injuries when cars brake suddenly in traffic.', phonetic: '/prɪˈvɛnt/', synonyms: ['stop', 'avoid', 'block', 'avert'] },
          { word: 'recover', definition: 'To get better after illness or difficulty', example: 'She recovered quickly by resting and following the doctor’s advice.', phonetic: '/rɪˈkʌvə/', synonyms: ['heal', 'get better', 'bounce back', 'regain'] },
          { word: 'reduce', definition: 'To make something smaller in amount overall', example: 'Turning off unused lights reduces your bill and carbon footprint.', phonetic: '/rɪˈdjuːs/', synonyms: ['lessen', 'decrease', 'lower', 'cut'] },
          { word: 'improve', definition: 'To make something better in quality overall', example: 'Daily reading improves vocabulary and confidence for class discussions.', phonetic: '/ɪmˈpruːv/', synonyms: ['enhance', 'upgrade', 'better', 'develop'] },
          { word: 'treat', definition: 'To give medical care to someone properly', example: 'Doctors treat infections with medicine and advice about rest.', phonetic: '/triːt/', synonyms: ['care for', 'medicate', 'cure', 'attend'] }
        ],
        completed: false
      },
      {
        id: 10,
        title: 'Set 10',
        words: [
          { word: 'schedule', definition: 'To set a time for something later', example: 'Let’s schedule a follow-up call for Wednesday afternoon.', phonetic: '/ˈʃedjuːl/', synonyms: ['arrange', 'set', 'book', 'timetable'] },
          { word: 'confirm', definition: 'To say a detail is correct officially', example: 'Please confirm your seat by replying to the message.', phonetic: '/kənˈfɜːm/', synonyms: ['verify', 'check', 'approve', 'certify'] },
          { word: 'cancel', definition: 'To decide something will not take place', example: 'They cancelled the match because lightning was forecast nearby.', phonetic: '/ˈkænsəl/', synonyms: ['call off', 'scrap', 'abort', 'drop'] },
          { word: 'reschedule', definition: 'To change a planned time to another', example: 'They rescheduled the lesson after the power cut last night.', phonetic: '/ˌriːˈʃedjuːl/', synonyms: ['rearrange', 'move', 'push back', 'postpone'] },
          { word: 'remind', definition: 'To help someone remember a future task', example: 'Please remind me about the form before Friday morning.', phonetic: '/rɪˈmaɪnd/', synonyms: ['prompt', 'nudge', 'jog memory', 'alert'] }
        ],
        completed: false
      },
      {
        id: 11,
        title: 'Set 11',
        words: [
          { word: 'warn', definition: 'To tell about danger to prevent harm', example: 'The signs warn hikers about falling rocks after heavy rain.', phonetic: '/wɔːn/', synonyms: ['caution', 'alert', 'notify', 'forewarn'] },
          { word: 'permit', definition: 'To officially allow someone to do something', example: 'The staff permit visitors to take photos without a flash.', phonetic: '/pəˈmɪt/', synonyms: ['allow', 'authorize', 'let', 'approve'] },
          { word: 'forbid', definition: 'To say something is not allowed officially', example: 'Many parks forbid fires during hot, windy summer weekends.', phonetic: '/fəˈbɪd/', synonyms: ['ban', 'prohibit', 'bar', 'disallow'] },
          { word: 'advise', definition: 'To give suggestions to help someone’s decision', example: 'Doctors advise patients to rest if symptoms continue for days.', phonetic: '/ədˈvaɪz/', synonyms: ['recommend', 'counsel', 'suggest', 'guide'] },
          { word: 'request', definition: 'To politely ask for something from someone', example: 'You can request extra towels at reception any time tonight.', phonetic: '/rɪˈkwest/', synonyms: ['ask', 'seek', 'petition', 'solicit'] }
        ],
        completed: false
      },
      {
        id: 12,
        title: 'Set 12',
        words: [
          { word: 'charge', definition: 'To ask payment amount for a service', example: 'The shop will charge a small fee for home delivery.', phonetic: '/tʃɑːdʒ/', synonyms: ['bill', 'price', 'invoice', 'levy'] },
          { word: 'refund', definition: 'To give money back after a problem', example: 'They’ll refund the ticket if the train is fully canceled.', phonetic: '/ˈriːfʌnd/', synonyms: ['repay', 'reimburse', 'return', 'compensate'] },
          { word: 'replace', definition: 'To put a new thing instead of old', example: 'Please replace the batteries if the remote stops working suddenly.', phonetic: '/rɪˈpleɪs/', synonyms: ['substitute', 'swap', 'change', 'renew'] },
          { word: 'ship', definition: 'To send goods to a customer somewhere', example: 'They ship orders daily, even during busy holiday weeks.', phonetic: '/ʃɪp/', synonyms: ['send', 'dispatch', 'mail', 'deliver'] },
          { word: 'track', definition: 'To follow progress or location over time', example: 'Customers track parcels online using the code from the receipt.', phonetic: '/træk/', synonyms: ['follow', 'monitor', 'trace', 'check'] }
        ],
        completed: false
      },
      {
        id: 13,
        title: 'Set 13',
        words: [
          { word: 'persuade', definition: 'To make someone agree by giving reasons', example: 'She persuaded her parents to let her join the trip.', phonetic: '/pəˈsweɪd/', synonyms: ['convince', 'influence', 'sway', 'win over'] },
          { word: 'argue', definition: 'To speak strongly because you disagree', example: 'Neighbors argued about parking until the council changed the plan.', phonetic: '/ˈɑːɡjuː/', synonyms: ['dispute', 'quarrel', 'contend', 'disagree'] },
          { word: 'reply', definition: 'To answer after receiving a message', example: 'Please reply within two days so we can confirm numbers.', phonetic: '/rɪˈplaɪ/', synonyms: ['answer', 'respond', 'write back', 'return'] },
          { word: 'interrupt', definition: 'To stop someone speaking for a moment', example: 'Please don’t interrupt while I’m explaining the safety steps.', phonetic: '/ˌɪntəˈrʌpt/', synonyms: ['cut in', 'interject', 'break in', 'disturb'] },
          { word: 'apologize', definition: 'To say sorry for a mistake', example: 'He apologized for the noise and offered to help repair it.', phonetic: '/əˈpɒlədʒaɪz/', synonyms: ['say sorry', 'make amends', 'atone', 'apologize to'] }
        ],
        completed: false
      },
      {
        id: 14,
        title: 'Set 14',
        words: [
          { word: 'reserve', definition: 'To book something for your future use', example: 'Let’s reserve seats now so we can sit together.', phonetic: '/rɪˈzɜːv/', synonyms: ['book', 'secure', 'hold', 'set aside'] },
          { word: 'extend', definition: 'To make a period or length longer', example: 'They extended their stay to see family over the weekend.', phonetic: '/ɪkˈstend/', synonyms: ['lengthen', 'prolong', 'continue', 'stretch'] },
          { word: 'upgrade', definition: 'To change to a better, newer level', example: 'The hotel upgraded our room because the lift was broken.', phonetic: '/ˈʌpɡreɪd/', synonyms: ['improve', 'update', 'move up', 'advance'] },
          { word: 'cancel', definition: 'To decide an event will not happen', example: 'They canceled the tour because of dangerous winds near cliffs.', phonetic: '/ˈkænsəl/', synonyms: ['call off', 'scrap', 'abort', 'drop'] },
          { word: 'reschedule', definition: 'To change a planned time to another', example: 'We rescheduled the interview after the power cut last night.', phonetic: '/ˌriːˈʃedjuːl/', synonyms: ['rearrange', 'move', 'postpone', 'push back'] }
        ],
        completed: false
      },
      {
        id: 15,
        title: 'Set 15',
        words: [
          { word: 'assemble', definition: 'To put parts together to make something', example: 'We assembled the shelves carefully using the picture instructions.', phonetic: '/əˈsɛmbl/', synonyms: ['build', 'put together', 'construct', 'set up'] },
          { word: 'adjust', definition: 'To change slightly so it fits better', example: 'You may adjust the chair height for better back support.', phonetic: '/əˈdʒʌst/', synonyms: ['modify', 'alter', 'tune', 'tweak'] },
          { word: 'connect', definition: 'To join two things so they work', example: 'After connecting the cables, the monitor finally showed the picture.', phonetic: '/kəˈnɛkt/', synonyms: ['link', 'join', 'attach', 'plug'] },
          { word: 'secure', definition: 'To fasten firmly so it stays safe', example: 'Always secure ladders before climbing to check the roof tiles.', phonetic: '/sɪˈkjʊə/', synonyms: ['fasten', 'fix', 'lock', 'tie'] },
          { word: 'polish', definition: 'To rub a surface until it shines', example: 'We polished the wooden table before setting plates and flowers.', phonetic: '/ˈpɒlɪʃ/', synonyms: ['shine', 'buff', 'rub', 'brighten'] }
        ],
        completed: false
      },
      {
        id: 16,
        title: 'Set 16',
        words: [
          { word: 'order', definition: 'To ask for food or items to buy', example: 'We’ll order two pizzas and a salad for the group.', phonetic: '/ˈɔːdə/', synonyms: ['request', 'purchase', 'place order', 'order in'] },
          { word: 'serve', definition: 'To give food or help to people', example: 'They serve breakfast until eleven on weekends and holidays.', phonetic: '/sɜːv/', synonyms: ['give', 'hand out', 'present', 'provide'] },
          { word: 'taste', definition: 'To try small amount to check flavor', example: 'Always taste the sauce before adding more salt.', phonetic: '/teɪst/', synonyms: ['sample', 'try', 'savor', 'test'] },
          { word: 'chop', definition: 'To cut something into small pieces quickly', example: 'Chop the onions finely and keep your fingers safe.', phonetic: '/tʃɒp/', synonyms: ['cut', 'dice', 'slice', 'mince'] },
          { word: 'stir', definition: 'To move food around to mix evenly', example: 'Stir the porridge slowly so it doesn’t stick or burn.', phonetic: '/stɜː/', synonyms: ['mix', 'blend', 'whisk', 'agitate'] },
        ],
        completed: false
      },
      {
        id: 17,
        title: 'Set 17',
        words: [
          { word: 'worry', definition: 'To feel anxious about possible problems', example: 'Try not to worry; the results arrive tomorrow afternoon.', phonetic: '/ˈwʌri/', synonyms: ['fret', 'be anxious', 'stress'] },
          { word: 'cheer', definition: 'To make someone feel happier or hopeful', example: 'A short message can cheer friends during tough weeks.', phonetic: '/tʃɪə/', synonyms: ['encourage', 'hearten', 'brighten'] },
          { word: 'forgive', definition: 'To stop being angry about someone’s mistake', example: 'She chose to forgive him after his honest apology.', phonetic: '/fəˈɡɪv/', synonyms: ['pardon', 'excuse', 'let go'] },
          { word: 'praise', definition: 'To say good things about someone’s work', example: 'Teachers praise effort when students keep trying after mistakes.', phonetic: '/preɪz/', synonyms: ['compliment', 'applaud', 'commend'] },
          { word: 'regret', definition: 'To feel sorry about something that happened', example: 'You might regret speaking quickly without checking the facts first.', phonetic: '/rɪˈɡrɛt/', synonyms: ['be sorry', 'lament', 'rue'] },
        ],
        completed: false
      },
      {
        id: 18,
        title: 'Set 18',
        words: [
          { word: 'heat', definition: 'To make something warmer using energy', example: 'We heat the living room before guests arrive tonight.', phonetic: '/hiːt/', synonyms: ['warm', 'heat up', 'warm up'] },
          { word: 'cool', definition: 'To make something less warm or hot', example: 'Open the window to cool the room after cooking.', phonetic: '/kuːl/', synonyms: ['chill', 'cool down', 'lower'] },
          { word: 'dry', definition: 'To remove water so something becomes dry', example: 'Hang the shirts to dry near the sunny window.', phonetic: '/draɪ/', synonyms: ['dry out', 'air dry', 'dehydrate'] },
          { word: 'fold', definition: 'To bend paper or cloth into layers', example: 'Please fold the towels and stack them by size.', phonetic: '/fəʊld/', synonyms: ['bend', 'crease', 'double'] },
          { word: 'iron', definition: 'To press clothes flat with a hot iron', example: 'I iron the trousers before interviews to look tidy.', phonetic: '/ˈaɪən/', synonyms: ['press', 'smooth', 'flatten'] },
        ],
        completed: false
      },
      {
        id: 19,
        title: 'Set 19',
        words: [
          { word: 'paint', definition: 'To cover a surface with colored liquid', example: 'We paint small models together on quiet Sunday afternoons.', phonetic: '/peɪnt/', synonyms: ['color', 'decorate', 'coat'] },
          { word: 'draw', definition: 'To make pictures using lines and shapes', example: 'Children draw animals first, then add backgrounds and color.', phonetic: '/drɔː/', synonyms: ['sketch', 'outline', 'illustrate'] },
          { word: 'camp', definition: 'To sleep outside in tents for fun', example: 'We camp near the river and watch stars after dinner.', phonetic: '/kæmp/', synonyms: ['pitch tents', 'sleep outdoors', 'stay in tents'] },
          { word: 'hike', definition: 'To walk long distances for exercise', example: 'They hike coastal paths when the weather is clear.', phonetic: '/haɪk/', synonyms: ['trek', 'ramble', 'walk far'] },
          { word: 'swim', definition: 'To move through water using arms and legs', example: 'We swim a few laps before breakfast on holidays.', phonetic: '/swɪm/', synonyms: ['paddle', 'do laps', 'bathe'] },
        ],
        completed: false
      },
      {
        id: 20,
        title: 'Set 20',
        words: [
          { word: 'fill in', definition: 'To complete a form by writing details', example: 'Please fill in the visitor form before you enter.', phonetic: '/ˌfɪl ˈɪn/', synonyms: ['complete', 'write in', 'enter details'] },
          { word: 'submit', definition: 'To send work or forms for approval', example: 'You must submit timesheets by noon each Friday.', phonetic: '/səbˈmɪt/', synonyms: ['send in', 'hand in', 'turn in'] },
          { word: 'print', definition: 'To make a paper copy from digital files', example: 'Only print the final draft to save paper and ink.', phonetic: '/prɪnt/', synonyms: ['produce', 'make copy', 'output'] },
          { word: 'sign', definition: 'To write your name to show agreement', example: 'Don’t sign anything until you read the final version.', phonetic: '/saɪn/', synonyms: ['write name', 'autograph', 'sign off'] },
          { word: 'file', definition: 'To store documents in a specific place', example: 'After approval, file the invoices by month and project.', phonetic: '/faɪl/', synonyms: ['archive', 'store', 'put away'] },
        ],
        completed: false
      },
      {
        id: 16,
        title: 'Set 16',
        words: [
          { word: 'order', definition: 'To ask for food or items to buy', example: 'We’ll order two pizzas and a salad for the group.', phonetic: '/ˈɔːdə/', synonyms: ['request', 'purchase', 'place order', 'order in'] },
          { word: 'serve', definition: 'To give food or help to people', example: 'They serve breakfast until eleven on weekends and holidays.', phonetic: '/sɜːv/', synonyms: ['give', 'hand out', 'present', 'provide'] },
          { word: 'taste', definition: 'To try small amount to check flavor', example: 'Always taste the sauce before adding more salt.', phonetic: '/teɪst/', synonyms: ['sample', 'try', 'savor', 'test'] },
          { word: 'chop', definition: 'To cut something into small pieces quickly', example: 'Chop the onions finely and keep your fingers safe.', phonetic: '/tʃɒp/', synonyms: ['cut', 'dice', 'slice', 'mince'] },
          { word: 'stir', definition: 'To move food around to mix evenly', example: 'Stir the porridge slowly so it doesn’t stick or burn.', phonetic: '/stɜː/', synonyms: ['mix', 'blend', 'whisk', 'agitate'] },
        ],
        completed: false
      },
      {
        id: 17,
        title: 'Set 17',
        words: [
          { word: 'worry', definition: 'To feel anxious about possible problems', example: 'Try not to worry; the results arrive tomorrow afternoon.', phonetic: '/ˈwʌri/', synonyms: ['fret', 'be anxious', 'stress'] },
          { word: 'cheer', definition: 'To make someone feel happier or hopeful', example: 'A short message can cheer friends during tough weeks.', phonetic: '/tʃɪə/', synonyms: ['encourage', 'hearten', 'brighten'] },
          { word: 'forgive', definition: 'To stop being angry about someone’s mistake', example: 'She chose to forgive him after his honest apology.', phonetic: '/fəˈɡɪv/', synonyms: ['pardon', 'excuse', 'let go'] },
          { word: 'praise', definition: 'To say good things about someone’s work', example: 'Teachers praise effort when students keep trying after mistakes.', phonetic: '/preɪz/', synonyms: ['compliment', 'applaud', 'commend'] },
          { word: 'regret', definition: 'To feel sorry about something that happened', example: 'You might regret speaking quickly without checking the facts first.', phonetic: '/rɪˈɡrɛt/', synonyms: ['be sorry', 'lament', 'rue'] },
        ],
        completed: false
      },
      {
        id: 18,
        title: 'Set 18',
        words: [
          { word: 'heat', definition: 'To make something warmer using energy', example: 'We heat the living room before guests arrive tonight.', phonetic: '/hiːt/', synonyms: ['warm', 'heat up', 'warm up'] },
          { word: 'cool', definition: 'To make something less warm or hot', example: 'Open the window to cool the room after cooking.', phonetic: '/kuːl/', synonyms: ['chill', 'cool down', 'lower'] },
          { word: 'dry', definition: 'To remove water so something becomes dry', example: 'Hang the shirts to dry near the sunny window.', phonetic: '/draɪ/', synonyms: ['dry out', 'air dry', 'dehydrate'] },
          { word: 'fold', definition: 'To bend paper or cloth into layers', example: 'Please fold the towels and stack them by size.', phonetic: '/fəʊld/', synonyms: ['bend', 'crease', 'double'] },
          { word: 'iron', definition: 'To press clothes flat with a hot iron', example: 'I iron the trousers before interviews to look tidy.', phonetic: '/ˈaɪən/', synonyms: ['press', 'smooth', 'flatten'] },
        ],
        completed: false
      },
      {
        id: 19,
        title: 'Set 19',
        words: [
          { word: 'paint', definition: 'To cover a surface with colored liquid', example: 'We paint small models together on quiet Sunday afternoons.', phonetic: '/peɪnt/', synonyms: ['color', 'decorate', 'coat'] },
          { word: 'draw', definition: 'To make pictures using lines and shapes', example: 'Children draw animals first, then add backgrounds and color.', phonetic: '/drɔː/', synonyms: ['sketch', 'outline', 'illustrate'] },
          { word: 'camp', definition: 'To sleep outside in tents for fun', example: 'We camp near the river and watch stars after dinner.', phonetic: '/kæmp/', synonyms: ['pitch tents', 'sleep outdoors', 'stay in tents'] },
          { word: 'hike', definition: 'To walk long distances for exercise', example: 'They hike coastal paths when the weather is clear.', phonetic: '/haɪk/', synonyms: ['trek', 'ramble', 'walk far'] },
          { word: 'swim', definition: 'To move through water using arms and legs', example: 'We swim a few laps before breakfast on holidays.', phonetic: '/swɪm/', synonyms: ['paddle', 'do laps', 'bathe'] },
        ],
        completed: false
      },
      {
        id: 20,
        title: 'Set 20',
        words: [
          { word: 'fill in', definition: 'To complete a form by writing details', example: 'Please fill in the visitor form before you enter.', phonetic: '/ˌfɪl ˈɪn/', synonyms: ['complete', 'write in', 'enter details'] },
          { word: 'submit', definition: 'To send work or forms for approval', example: 'You must submit timesheets by noon each Friday.', phonetic: '/səbˈmɪt/', synonyms: ['send in', 'hand in', 'turn in'] },
          { word: 'print', definition: 'To make a paper copy from digital files', example: 'Only print the final draft to save paper and ink.', phonetic: '/prɪnt/', synonyms: ['produce', 'make copy', 'output'] },
          { word: 'sign', definition: 'To write your name to show agreement', example: 'Don’t sign anything until you read the final version.', phonetic: '/saɪn/', synonyms: ['write name', 'autograph', 'sign off'] },
          { word: 'file', definition: 'To store documents in a specific place', example: 'After approval, file the invoices by month and project.', phonetic: '/faɪl/', synonyms: ['archive', 'store', 'put away'] },
        ],
        completed: false
      }
    ]
  },
  {
    id: 'office',
    name: 'Office Communication',
    description: '20 Sets, 100 essential words for workplace',
    cefr: 'B2-C1',
    icon: '💼',
    sets: [
      {
        id: 1,
        title: 'Meetings & Discussions',
        words: [
          { word: 'agenda', definition: 'Detailed schedule listing all meeting topics discussed', example: 'Please review the agenda before tomorrow\'s meeting.', phonetic: '/əˈdʒendə/', synonyms: ['schedule', 'program', 'plan'] },
          { word: 'minutes', definition: 'Written record of what was said meeting', example: 'Sarah will take the minutes during today\'s conference.', phonetic: '/ˈmɪnɪts/', synonyms: ['notes', 'record', 'transcript'] },
          { word: 'adjourn', definition: 'Temporarily end meeting until later scheduled time', example: 'We will adjourn the meeting until next week.', phonetic: '/əˈdʒɜːrn/', synonyms: ['suspend', 'postpone', 'conclude'] },
          { word: 'consensus', definition: 'General agreement reached among all group members', example: 'The team reached consensus on the new strategy.', phonetic: '/kənˈsensəs/', synonyms: ['agreement', 'accord', 'unity'] },
          { word: 'deliberate', definition: 'Carefully consider and discuss important issues thoroughly', example: 'The committee will deliberate on this proposal tomorrow.', phonetic: '/dɪˈlɪbəreɪt/', synonyms: ['discuss', 'consider', 'debate'] }
        ],
        completed: false
      },
      {
        id: 2,
        title: 'Email & Correspondence',
        words: [
          { word: 'recipient', definition: 'Person who receives a message or email', example: 'Please add all recipients to the distribution list.', phonetic: '/rɪˈsɪpiənt/', synonyms: ['receiver', 'addressee', 'beneficiary'] },
          { word: 'attachment', definition: 'Digital file sent along with email message', example: 'I have included the report as an attachment.', phonetic: '/əˈtætʃmənt/', synonyms: ['enclosure', 'file', 'document'] },
          { word: 'correspondence', definition: 'Written communication regularly exchanged between people professionally', example: 'All correspondence should be filed in the database.', phonetic: '/ˌkɔːrəˈspɑːndəns/', synonyms: ['communication', 'letters', 'messages'] },
          { word: 'acknowledge', definition: 'Officially confirm receipt or recognition of something', example: 'Please acknowledge this email upon receiving it.', phonetic: '/əkˈnɑːlɪdʒ/', synonyms: ['confirm', 'recognize', 'verify'] },
          { word: 'forward', definition: 'Send received information to another person quickly', example: 'Could you forward this message to the team?', phonetic: '/ˈfɔːrwərd/', synonyms: ['send on', 'pass along', 'transmit'] }
        ],
        completed: false
      },
      {
        id: 3,
        title: 'Project Management',
        words: [
          { word: 'milestone', definition: 'Important stage or event achieved in project', example: 'We achieved a major milestone in product development.', phonetic: '/ˈmaɪlstoʊn/', synonyms: ['landmark', 'achievement', 'goal'] },
          { word: 'deliverable', definition: 'Tangible outcome that must be produced project', example: 'The final deliverable is due by Friday afternoon.', phonetic: '/dɪˈlɪvərəbəl/', synonyms: ['output', 'product', 'result'] },
          { word: 'stakeholder', definition: 'Person with interest or concern in something', example: 'All stakeholders were informed about the project delay.', phonetic: '/ˈsteɪkhoʊldər/', synonyms: ['investor', 'participant', 'party'] },
          { word: 'implement', definition: 'Put a plan or system into action', example: 'We will implement the new system next quarter.', phonetic: '/ˈɪmplɪment/', synonyms: ['execute', 'apply', 'carry out'] },
          { word: 'coordinate', definition: 'Organize people or activities to work together', example: 'James will coordinate the efforts of both teams.', phonetic: '/koʊˈɔːrdɪneɪt/', synonyms: ['organize', 'arrange', 'manage'] }
        ],
        completed: false
      },
      {
        id: 4,
        title: 'Reports & Documentation',
        words: [
          { word: 'summary', definition: 'Brief statement covering the main points clearly', example: 'Please provide a summary of the quarterly results.', phonetic: '/ˈsʌməri/', synonyms: ['overview', 'synopsis', 'abstract'] },
          { word: 'appendix', definition: 'Additional material included at end of document', example: 'The detailed data is included in the appendix.', phonetic: '/əˈpendɪks/', synonyms: ['supplement', 'addendum', 'attachment'] },
          { word: 'revision', definition: 'Changed or updated version of a document', example: 'The document is now on its third revision.', phonetic: '/rɪˈvɪʒən/', synonyms: ['amendment', 'modification', 'update'] },
          { word: 'footnote', definition: 'Additional information appearing at page bottom reference', example: 'The source is cited in footnote number five.', phonetic: '/ˈfʊtnoʊt/', synonyms: ['annotation', 'reference', 'note'] },
          { word: 'proofread', definition: 'Check text carefully for errors before finalizing', example: 'Always proofread your documents before sending them out.', phonetic: '/ˈpruːfriːd/', synonyms: ['review', 'check', 'edit'] }
        ],
        completed: false
      },
      {
        id: 5,
        title: 'Presentations & Public Speaking',
        words: [
          { word: 'slide', definition: 'Single page of a digital presentation displayed', example: 'The key points are shown on slide seven.', phonetic: '/slaɪd/', synonyms: ['page', 'screen', 'frame'] },
          { word: 'handout', definition: 'Printed material document given to audience members', example: 'I will distribute handouts at the end of the presentation.', phonetic: '/ˈhændaʊt/', synonyms: ['leaflet', 'document', 'material'] },
          { word: 'projector', definition: 'Electronic device displaying images on large screen', example: 'Please connect your laptop to the projector.', phonetic: '/prəˈdʒektər/', synonyms: ['display', 'screen', 'viewer'] },
          { word: 'rehearse', definition: 'Practice something carefully before performing it publicly', example: 'We should rehearse the presentation before the conference.', phonetic: '/rɪˈhɜːrs/', synonyms: ['practice', 'prepare', 'drill'] },
          { word: 'engage', definition: 'Attract and hold the attention of audience', example: 'Use storytelling to engage your audience effectively.', phonetic: '/ɪnˈɡeɪdʒ/', synonyms: ['captivate', 'involve', 'interest'] }
        ],
        completed: false
      },
      {
        id: 6,
        title: 'Team Collaboration',
        words: [
          { word: 'collaborate', definition: 'Work jointly with others on shared project', example: 'Our departments collaborate on marketing campaigns regularly.', phonetic: '/kəˈlæbəreɪt/', synonyms: ['cooperate', 'partner', 'team up'] },
          { word: 'delegate', definition: 'Assign tasks or responsibilities officially to others', example: 'Good managers know how to delegate tasks effectively.', phonetic: '/ˈdelɪɡeɪt/', synonyms: ['assign', 'entrust', 'transfer'] },
          { word: 'facilitate', definition: 'Make an action or process much easier', example: 'Technology can facilitate communication between remote teams.', phonetic: '/fəˈsɪlɪteɪt/', synonyms: ['enable', 'assist', 'help'] },
          { word: 'synergy', definition: 'Combined power that is greater than parts', example: 'The synergy between teams produced excellent results.', phonetic: '/ˈsɪnərdʒi/', synonyms: ['cooperation', 'teamwork', 'collaboration'] },
          { word: 'contribute', definition: 'Give something to help achieve a goal', example: 'Everyone should contribute ideas during brainstorming sessions.', phonetic: '/kənˈtrɪbjuːt/', synonyms: ['participate', 'provide', 'offer'] }
        ],
        completed: false
      },
      {
        id: 7,
        title: 'Time Management',
        words: [
          { word: 'prioritize', definition: 'Arrange tasks in order of their importance level', example: 'Learn to prioritize your tasks to meet deadlines.', phonetic: '/praɪˈɔːrətaɪz/', synonyms: ['rank', 'organize', 'order'] },
          { word: 'schedule', definition: 'A plan showing when events will happen clearly', example: 'Please check my schedule for available meeting times.', phonetic: '/ˈskedʒuːl/', synonyms: ['timetable', 'calendar', 'agenda'] },
          { word: 'postpone', definition: 'To delay an event to a later time', example: 'We need to postpone the launch until next month.', phonetic: '/poʊstˈpoʊn/', synonyms: ['delay', 'defer', 'reschedule'] },
          { word: 'allocate', definition: 'Distribute resources for a particular purpose or goal', example: 'We must allocate more time for quality testing.', phonetic: '/ˈæləkeɪt/', synonyms: ['assign', 'distribute', 'designate'] },
          { word: 'streamline', definition: 'Make a process more efficient and effective overall', example: 'The new software will streamline our workflow significantly.', phonetic: '/ˈstriːmlaɪn/', synonyms: ['simplify', 'optimize', 'improve'] }
        ],
        completed: false
      },
      {
        id: 8,
        title: 'Client Relations',
        words: [
          { word: 'negotiate', definition: 'Discuss terms to reach an agreement with others', example: 'We need to negotiate the contract terms with clients.', phonetic: '/nɪˈɡoʊʃieɪt/', synonyms: ['bargain', 'discuss', 'mediate'] },
          { word: 'proposal', definition: 'A formal suggestion or plan offered for consideration', example: 'The client approved our proposal for the new campaign.', phonetic: '/prəˈpoʊzəl/', synonyms: ['offer', 'suggestion', 'plan'] },
          { word: 'quotation', definition: 'A statement of the price for goods or services', example: 'Please send a detailed quotation for the project.', phonetic: '/kwoʊˈteɪʃən/', synonyms: ['estimate', 'quote', 'price'] },
          { word: 'rapport', definition: 'A friendly relationship built on mutual understanding and trust', example: 'Building rapport with clients is essential for success.', phonetic: '/ræˈpɔːr/', synonyms: ['connection', 'relationship', 'bond'] },
          { word: 'retention', definition: 'Maintaining customers or clients over time successfully today', example: 'Customer retention is more cost-effective than acquisition.', phonetic: '/rɪˈtenʃən/', synonyms: ['maintenance', 'preservation', 'keeping'] }
        ],
        completed: false
      },
      {
        id: 9,
        title: 'Performance & Feedback',
        words: [
          { word: 'evaluate', definition: 'To assess the quality or performance of something', example: 'Managers evaluate employee performance twice annually.', phonetic: '/ɪˈvæljueɪt/', synonyms: ['assess', 'review', 'judge'] },
          { word: 'constructive', definition: 'Helpful feedback that is intended to improve something', example: 'Constructive feedback helps employees grow professionally.', phonetic: '/kənˈstrʌktɪv/', synonyms: ['helpful', 'positive', 'productive'] },
          { word: 'appraisal', definition: 'An assessment of the value or quality offered', example: 'Annual appraisals help identify areas for improvement.', phonetic: '/əˈpreɪzəl/', synonyms: ['evaluation', 'assessment', 'review'] },
          { word: 'benchmark', definition: 'A standard that is used for comparison purposes', example: 'Industry benchmarks help us measure our performance.', phonetic: '/ˈbentʃmɑːrk/', synonyms: ['standard', 'reference', 'measure'] },
          { word: 'excel', definition: 'To be very good at something you do', example: 'She excels at managing difficult client relationships.', phonetic: '/ɪkˈsel/', synonyms: ['surpass', 'succeed', 'shine'] }
        ],
        completed: false
      },
      {
        id: 10,
        title: 'Office Technology',
        words: [
          { word: 'platform', definition: 'A digital system for running applications or services', example: 'We use a cloud platform for team collaboration.', phonetic: '/ˈplætfɔːrm/', synonyms: ['system', 'interface', 'framework'] },
          { word: 'software', definition: 'Programs and applications that are used by computers', example: 'The company invested in new project management software.', phonetic: '/ˈsɔːftwer/', synonyms: ['program', 'application', 'system'] },
          { word: 'interface', definition: 'A point where users interact with the system', example: 'The user interface is intuitive and easy to navigate.', phonetic: '/ˈɪntərfeɪs/', synonyms: ['display', 'screen', 'dashboard'] },
          { word: 'integrate', definition: 'To combine different systems to work together effectively', example: 'We need to integrate our sales and accounting systems.', phonetic: '/ˈɪntɪɡreɪt/', synonyms: ['combine', 'merge', 'unite'] },
          { word: 'troubleshoot', definition: 'To identify and solve problems with systems today', example: 'IT staff will troubleshoot any technical issues promptly.', phonetic: '/ˈtrʌbəlʃuːt/', synonyms: ['diagnose', 'fix', 'resolve'] }
        ],
        completed: false
      },
      {
        id: 11,
        title: 'Business Strategy',
        words: [
          { word: 'objective', definition: 'A specific goal that is planned to be achieved', example: 'Our main objective is to increase market share.', phonetic: '/əbˈdʒektɪv/', synonyms: ['goal', 'target', 'aim'] },
          { word: 'initiative', definition: 'A new plan or process to achieve something', example: 'The company launched a new sustainability initiative.', phonetic: '/ɪˈnɪʃətɪv/', synonyms: ['program', 'project', 'campaign'] },
          { word: 'forecast', definition: 'A prediction of future trends or events coming', example: 'Sales forecasts indicate strong growth next quarter.', phonetic: '/ˈfɔːrkæst/', synonyms: ['prediction', 'projection', 'estimate'] },
          { word: 'competitive', definition: 'Related to rivalry between businesses or people competing', example: 'We offer competitive salaries to attract top talent.', phonetic: '/kəmˈpetətɪv/', synonyms: ['rival', 'opposing', 'challenging'] },
          { word: 'leverage', definition: 'To use something to gain an advantage effectively', example: 'We can leverage social media for brand awareness.', phonetic: '/ˈlevərɪdʒ/', synonyms: ['utilize', 'exploit', 'use'] }
        ],
        completed: false
      },
      {
        id: 12,
        title: 'Workplace Policies',
        words: [
          { word: 'protocol', definition: 'Official procedure or system of rules to follow', example: 'Follow the security protocol when entering the building.', phonetic: '/ˈproʊtəkɔːl/', synonyms: ['procedure', 'guideline', 'rules'] },
          { word: 'compliance', definition: 'Following rules regulations or standards that are established', example: 'All employees must ensure compliance with data protection laws.', phonetic: '/kəmˈplaɪəns/', synonyms: ['adherence', 'conformity', 'obedience'] },
          { word: 'confidential', definition: 'Information that is meant to be kept secret', example: 'This document contains confidential client information.', phonetic: '/ˌkɑːnfɪˈdenʃəl/', synonyms: ['private', 'secret', 'restricted'] },
          { word: 'authorization', definition: 'Official permission for something to happen or occur', example: 'You need authorization from your manager for expenses.', phonetic: '/ˌɔːθərəˈzeɪʃən/', synonyms: ['permission', 'approval', 'consent'] },
          { word: 'procedure', definition: 'An established way of doing tasks or activities', example: 'The evacuation procedure is posted on every floor.', phonetic: '/prəˈsiːdʒər/', synonyms: ['process', 'method', 'protocol'] }
        ],
        completed: false
      },
      {
        id: 13,
        title: 'Professional Development',
        words: [
          { word: 'mentor', definition: 'An experienced person who advises and guides others', example: 'Having a mentor can accelerate your career growth.', phonetic: '/ˈmentɔːr/', synonyms: ['advisor', 'coach', 'guide'] },
          { word: 'seminar', definition: 'A meeting organized for training or discussion purposes', example: 'The marketing seminar attracted over two hundred participants.', phonetic: '/ˈsemɪnɑːr/', synonyms: ['workshop', 'conference', 'training'] },
          { word: 'certification', definition: 'Official recognition of skills or knowledge you have', example: 'Project management certification will enhance your resume.', phonetic: '/ˌsɜːrtɪfɪˈkeɪʃən/', synonyms: ['accreditation', 'qualification', 'credential'] },
          { word: 'upskill', definition: 'To learn new skills or improve existing ones', example: 'Employees are encouraged to upskill through online courses.', phonetic: '/ˈʌpskɪl/', synonyms: ['train', 'develop', 'improve'] },
          { word: 'networking', definition: 'Building professional relationships for mutual benefit and support', example: 'Networking events help professionals exchange ideas and contacts.', phonetic: '/ˈnetwɜːrkɪŋ/', synonyms: ['connecting', 'socializing', 'relationship-building'] }
        ],
        completed: false
      },
      {
        id: 14,
        title: 'Financial Terms',
        words: [
          { word: 'invoice', definition: 'A document requesting payment for goods or services', example: 'Please process this invoice by the end of the month.', phonetic: '/ˈɪnvɔɪs/', synonyms: ['bill', 'statement', 'charge'] },
          { word: 'expense', definition: 'Money that is spent for business purposes today', example: 'Submit your travel expenses within five business days.', phonetic: '/ɪkˈspens/', synonyms: ['cost', 'expenditure', 'charge'] },
          { word: 'reimbursement', definition: 'Repayment of money spent on business activities earlier', example: 'Reimbursement requests must include original receipts.', phonetic: '/ˌriːɪmˈbɜːrsmənt/', synonyms: ['repayment', 'refund', 'compensation'] },
          { word: 'overhead', definition: 'Ongoing business costs not directly related to production', example: 'Reducing overhead costs improved our profit margins significantly.', phonetic: '/ˈoʊvərhed/', synonyms: ['expenses', 'costs', 'outgoings'] },
          { word: 'reconcile', definition: 'To make financial records consistent and accurate today', example: 'Accountants reconcile bank statements monthly.', phonetic: '/ˈrekənsaɪl/', synonyms: ['balance', 'match', 'verify'] }
        ],
        completed: false
      },
      {
        id: 15,
        title: 'Human Resources',
        words: [
          { word: 'recruit', definition: 'To find and hire new employees for company', example: 'The HR department will recruit five new developers.', phonetic: '/rɪˈkruːt/', synonyms: ['hire', 'employ', 'enlist'] },
          { word: 'onboard', definition: 'To integrate new employees into the company culture', example: 'We have a comprehensive program to onboard new hires.', phonetic: '/ˈɑːnbɔːrd/', synonyms: ['orient', 'integrate', 'train'] },
          { word: 'terminate', definition: 'To end someone employment at company unfortunately today', example: 'The company had to terminate several positions unfortunately.', phonetic: '/ˈtɜːrmɪneɪt/', synonyms: ['dismiss', 'fire', 'discharge'] },
          { word: 'benefits', definition: 'Additional advantages that are provided to employees regularly', example: 'Our benefits package includes health insurance and retirement plans.', phonetic: '/ˈbenɪfɪts/', synonyms: ['perks', 'advantages', 'compensation'] },
          { word: 'grievance', definition: 'A formal complaint about unfair treatment at work', example: 'Employees can file a grievance with the HR department.', phonetic: '/ˈɡriːvəns/', synonyms: ['complaint', 'objection', 'protest'] }
        ],
        completed: false
      },
      {
        id: 16,
        title: 'Marketing & Sales',
        words: [
          { word: 'campaign', definition: 'Organized activities to promote a product or service', example: 'The digital marketing campaign increased website traffic significantly.', phonetic: '/kæmˈpeɪn/', synonyms: ['initiative', 'promotion', 'drive'] },
          { word: 'prospect', definition: 'A potential customer who may buy products soon', example: 'Sales teams should qualify prospects before pitching.', phonetic: '/ˈprɑːspekt/', synonyms: ['lead', 'potential client', 'candidate'] },
          { word: 'conversion', definition: 'Turning potential customers into actual buyers successfully today', example: 'Our conversion rate improved after website optimization.', phonetic: '/kənˈvɜːrʒən/', synonyms: ['transformation', 'change', 'switch'] },
          { word: 'outreach', definition: 'Efforts to connect with potential customers or partners', example: 'Social media outreach expanded our customer base.', phonetic: '/ˈaʊtriːtʃ/', synonyms: ['engagement', 'contact', 'communication'] },
          { word: 'branding', definition: 'Creating a unique identity for a product today', example: 'Strong branding helps companies stand out from competitors.', phonetic: '/ˈbrændɪŋ/', synonyms: ['marketing', 'promotion', 'identity'] }
        ],
        completed: false
      },
      {
        id: 17,
        title: 'Customer Service',
        words: [
          { word: 'inquiry', definition: 'A request for information about products or services', example: 'Customer service handled over fifty inquiries today.', phonetic: '/ɪnˈkwaɪəri/', synonyms: ['question', 'query', 'request'] },
          { word: 'complaint', definition: 'An expression of dissatisfaction about a service received', example: 'We take every customer complaint seriously and investigate thoroughly.', phonetic: '/kəmˈpleɪnt/', synonyms: ['grievance', 'objection', 'criticism'] },
          { word: 'resolution', definition: 'The solution to a problem or complaint raised', example: 'Quick resolution of issues improves customer satisfaction.', phonetic: '/ˌrezəˈluːʃən/', synonyms: ['solution', 'answer', 'settlement'] },
          { word: 'escalate', definition: 'To refer a problem to a higher authority', example: 'Please escalate urgent issues to the supervisor immediately.', phonetic: '/ˈeskəleɪt/', synonyms: ['elevate', 'intensify', 'raise'] },
          { word: 'courtesy', definition: 'Polite behavior and consideration shown to others today', example: 'Treating customers with courtesy creates positive experiences.', phonetic: '/ˈkɜːrtəsi/', synonyms: ['politeness', 'respect', 'civility'] }
        ],
        completed: false
      },
      {
        id: 18,
        title: 'Quality & Standards',
        words: [
          { word: 'compliance', definition: 'Following established rules and regulations that are set', example: 'Quality compliance ensures products meet safety standards.', phonetic: '/kəmˈplaɪəns/', synonyms: ['conformity', 'adherence', 'obedience'] },
          { word: 'audit', definition: 'An official examination of records or processes done', example: 'The annual audit confirmed our accounting practices are sound.', phonetic: '/ˈɔːdɪt/', synonyms: ['inspection', 'review', 'examination'] },
          { word: 'defect', definition: 'A fault or imperfection in a product found', example: 'Quality control identified several defects in the batch.', phonetic: '/ˈdiːfekt/', synonyms: ['flaw', 'fault', 'error'] },
          { word: 'specification', definition: 'A detailed description of requirements or standards needed', example: 'Products must meet exact specifications before shipping.', phonetic: '/ˌspesɪfɪˈkeɪʃən/', synonyms: ['requirement', 'standard', 'detail'] },
          { word: 'consistency', definition: 'Maintaining the same standards over time consistently today', example: 'Consistency in service quality builds customer trust.', phonetic: '/kənˈsɪstənsi/', synonyms: ['uniformity', 'reliability', 'stability'] }
        ],
        completed: false
      },
      {
        id: 19,
        title: 'Remote Work',
        words: [
          { word: 'virtual', definition: 'Existing online rather than in physical space today', example: 'Virtual meetings allow teams to collaborate from anywhere.', phonetic: '/ˈvɜːrtʃuəl/', synonyms: ['online', 'digital', 'remote'] },
          { word: 'bandwidth', definition: 'The capacity to handle data or workload effectively', example: 'Do you have enough bandwidth to take on another project?', phonetic: '/ˈbændwɪdθ/', synonyms: ['capacity', 'availability', 'resources'] },
          { word: 'asynchronous', definition: 'Not happening at the same time as others', example: 'Asynchronous communication allows flexible work schedules.', phonetic: '/eɪˈsɪŋkrənəs/', synonyms: ['non-simultaneous', 'delayed', 'time-shifted'] },
          { word: 'connectivity', definition: 'The state of being connected to networks properly', example: 'Reliable internet connectivity is essential for remote work.', phonetic: '/ˌkɑːnekˈtɪvəti/', synonyms: ['connection', 'access', 'networking'] },
          { word: 'timezone', definition: 'A region with the same standard time today', example: 'Schedule meetings that accommodate everyone\'s timezone.', phonetic: '/ˈtaɪmzoʊn/', synonyms: ['time region', 'time area', 'time zone'] }
        ],
        completed: false
      },
      {
        id: 20,
        title: 'Leadership & Management',
        words: [
          { word: 'accountability', definition: 'Being responsible for decisions and actions you take', example: 'Good leaders demonstrate accountability for their team\'s performance.', phonetic: '/əˌkaʊntəˈbɪləti/', synonyms: ['responsibility', 'liability', 'answerability'] },
          { word: 'empower', definition: 'To give authority or confidence to someone else', example: 'Great managers empower employees to make independent decisions.', phonetic: '/ɪmˈpaʊər/', synonyms: ['authorize', 'enable', 'equip'] },
          { word: 'transparent', definition: 'Open and honest communication and actions with others', example: 'Transparent communication builds trust within the organization.', phonetic: '/trænsˈpærənt/', synonyms: ['clear', 'open', 'honest'] },
          { word: 'vision', definition: 'A clear idea of future goals and direction', example: 'The CEO shared her vision for the company\'s future.', phonetic: '/ˈvɪʒən/', synonyms: ['outlook', 'plan', 'goal'] },
          { word: 'inspire', definition: 'To motivate or encourage others to achieve goals', example: 'Effective leaders inspire their teams to achieve excellence.', phonetic: '/ɪnˈspaɪər/', synonyms: ['motivate', 'encourage', 'stimulate'] }
        ],
        completed: false
      }
    ]
  },
  {
    id: 'intermediate',
    name: 'Intermediate',
    description: '75 Sets, 375 words at CEFR B1 Level',
    cefr: 'B1',
    icon: '🌿',
    sets: [
      {
        id: 1,
        title: 'Set 1',
        words: [
          { word: 'pack', definition: 'To put belongings into bags for travel', example: 'We packed last night so catching the early train felt easy.', phonetic: '/pæk/', synonyms: ['load', 'stow', 'bundle', 'bag'] },
          { word: 'book', definition: 'To reserve and pay for a service', example: 'Let\u2019s book the hotel today before the prices go up.', phonetic: '/bʊk/', synonyms: ['reserve', 'schedule', 'arrange', 'secure'] },
          { word: 'cancel', definition: 'To decide something will not happen now', example: 'They canceled the tour because storms affected mountain roads all weekend.', phonetic: '/ˈkænsəl/', synonyms: ['scrap', 'abort', 'drop', 'call off'] },
          { word: 'arrive', definition: 'To reach a place at planned time', example: 'Trains usually arrive on time unless there\u2019s maintenance on the line.', phonetic: '/əˈraɪv/', synonyms: ['reach', 'come', 'land', 'get to'] },
          { word: 'depart', definition: 'To leave a place at a scheduled time', example: 'Buses depart every hour, even during holidays and local events.', phonetic: '/dɪˈpɑːt/', synonyms: ['leave', 'go', 'exit', 'set off'] }
        ],
        completed: false
      },
      {
        id: 2,
        title: 'Set 2',
        words: [
          { word: 'stretch', definition: 'To extend muscles gently to improve flexibility', example: 'Stretch for five minutes before running to prevent tight calves.', phonetic: '/strɛtʃ/', synonyms: ['extend', 'lengthen', 'loosen', 'limber'] },
          { word: 'hydrate', definition: 'To drink enough water to stay healthy', example: 'Remember to hydrate during hot days, even if you\u2019re indoors.', phonetic: '/ˈhaɪdreɪt/', synonyms: ['drink', 'water', 'replenish', 'rehydrate'] },
          { word: 'rest', definition: 'To stop activity to recover your strength', example: 'After training, rest briefly so your muscles repair effectively.', phonetic: '/rɛst/', synonyms: ['relax', 'unwind', 'recover', 'pause'] },
          { word: 'breathe', definition: 'To take air in and out slowly', example: 'When nervous, breathe deeply and count slowly to five.', phonetic: '/briːð/', synonyms: ['inhale', 'exhale', 'respire', 'draw breath'] },
          { word: 'exercise', definition: 'To move your body regularly for fitness', example: 'Doctors say exercise three times weekly to support heart health.', phonetic: '/ˈɛksəsaɪz/', synonyms: ['train', 'practise', 'work out', 'drill'] }
        ],
        completed: false
      },
      {
        id: 3,
        title: 'Set 3',
        words: [
          { word: 'review', definition: 'To look again to check and improve', example: 'Please review chapter five before tomorrow\u2019s short quiz.', phonetic: '/rɪˈvjuː/', synonyms: ['check', 'revisit', 'go over', 'revise'] },
          { word: 'memorize', definition: 'To learn information so you remember later', example: 'I memorize new words with flashcards every night.', phonetic: '/ˈmɛmərəˌzaɪz/', synonyms: ['learn', 'remember', 'retain', 'commit'] },
          { word: 'practice', definition: 'To repeat activities to build strong skills', example: 'Musicians practice daily to keep their hands relaxed.', phonetic: '/ˈpræktɪs/', synonyms: ['train', 'rehearse', 'drill', 'exercise'] },
          { word: 'summarize', definition: 'To present main ideas briefly and clearly', example: 'First summarize the article, then share your opinion politely.', phonetic: '/ˈsʌməraɪz/', synonyms: ['sum up', 'condense', 'outline', 'recap'] },
          { word: 'focus', definition: 'To give full attention to one task', example: 'Turn off notifications so you can focus during study time.', phonetic: '/ˈfəʊkəs/', synonyms: ['concentrate', 'pay attention', 'zero in', 'direct'] }
        ],
        completed: false
      },
      {
        id: 4,
        title: 'Set 4',
        words: [
          { word: 'sweep', definition: 'To clean a floor by moving a broom', example: 'Please sweep the kitchen before guests arrive tonight.', phonetic: '/swiːp/', synonyms: ['brush', 'clean', 'clear', 'tidy'] },
          { word: 'boil', definition: 'To heat liquid until it bubbles strongly', example: 'Boil the pasta water, then add salt and noodles.', phonetic: '/bɔɪl/', synonyms: ['heat', 'bubble', 'cook', 'seethe'] },
          { word: 'fix', definition: 'To repair something so it works again', example: 'A technician can fix the heater this afternoon after lunch.', phonetic: '/fɪks/', synonyms: ['repair', 'mend', 'restore', 'patch'] },
          { word: 'plant', definition: 'To put seeds or young trees into soil', example: 'We\u2019ll plant tomatoes near the fence after the frost.', phonetic: '/plɑːnt/', synonyms: ['sow', 'seed', 'put in', 'transplant'] },
          { word: 'measure', definition: 'To find size or amount using tools', example: 'Measure the wall first so the shelves will fit perfectly.', phonetic: '/ˈmɛʒə/', synonyms: ['gauge', 'size up', 'quantify', 'check'] }
        ],
        completed: false
      },
      {
        id: 5,
        title: 'Set 5',
        words: [
          { word: 'shine', definition: 'To give bright light like the sun', example: 'The lantern shone all night during the campsite storm.', phonetic: '/ʃaɪn/', synonyms: ['glow', 'gleam', 'beam', 'sparkle'] },
          { word: 'rain', definition: 'To fall as water drops from clouds', example: 'It rained all morning, then the sun came out.', phonetic: '/reɪn/', synonyms: ['pour', 'drizzle', 'shower', 'rain down'] },
          { word: 'freeze', definition: 'To become very cold and turn solid', example: 'The lake can freeze overnight during sudden winter storms.', phonetic: '/friːz/', synonyms: ['solidify', 'ice', 'chill', 'harden'] },
          { word: 'melt', definition: 'To become liquid again after being solid', example: 'The snow will melt by noon if the wind turns warm.', phonetic: '/mɛlt/', synonyms: ['thaw', 'liquefy', 'soften', 'dissolve'] },
          { word: 'shelter', definition: 'To stay somewhere safe from bad weather', example: 'Hikers sheltered under trees until the storm finally passed.', phonetic: '/ˈʃɛltə/', synonyms: ['protect', 'shield', 'hide', 'take cover'] }
        ],
        completed: false
      },
      {
        id: 6,
        title: 'Set 6',
        words: [
          { word: 'refuse', definition: 'To say no and not accept something', example: 'He refused the offer politely after reading the contract carefully.', phonetic: '/rɪˈfjuːz/', synonyms: ['decline', 'reject', 'turn down', 'deny'] },
          { word: 'consider', definition: 'To think carefully before making a decision', example: 'Before renting, consider travel time and the total monthly costs.', phonetic: '/kənˈsɪdə/', synonyms: ['think about', 'contemplate', 'weigh', 'regard'] },
          { word: 'suggest', definition: 'To offer an idea for careful consideration', example: 'Could you suggest another route that avoids the toll road?', phonetic: '/səˈdʒɛst/', synonyms: ['propose', 'recommend', 'put forward', 'advise'] },
          { word: 'avoid', definition: 'To keep away from something potentially unpleasant', example: 'Drivers avoid the bridge at five because traffic is terrible.', phonetic: '/əˈvɔɪd/', synonyms: ['steer clear', 'shun', 'dodge', 'keep away'] },
          { word: 'agree', definition: 'To share the same opinion as someone else', example: 'After some discussion, we agreed to split the work evenly.', phonetic: '/əˈɡriː/', synonyms: ['consent', 'concur', 'go along', 'assent'] }
        ],
        completed: false
      },
      {
        id: 7,
        title: 'Set 7',
        words: [
          { word: 'organize', definition: 'To arrange things so activities run smoothly', example: 'We organized volunteers and tables before the charity market opened.', phonetic: '/ˈɔːɡənaɪz/', synonyms: ['arrange', 'set up', 'coordinate', 'sort out'] },
          { word: 'volunteer', definition: 'To offer help without expecting any payment', example: 'Many residents volunteer on weekends to clean riverside paths.', phonetic: '/ˌvɒlənˈtɪə/', synonyms: ['offer', 'pitch in', 'step forward', 'help'] },
          { word: 'support', definition: 'To help someone by giving practical assistance', example: 'Families support new arrivals with transport, food, and friendly advice.', phonetic: '/səˈpɔːt/', synonyms: ['assist', 'back', 'help', 'stand by'] },
          { word: 'collect', definition: 'To bring together items from different places', example: 'Please collect the donation boxes before the visitors arrive.', phonetic: '/kəˈlɛkt/', synonyms: ['gather', 'pick up', 'assemble', 'accumulate'] },
          { word: 'advertise', definition: 'To promote something publicly to attract customers', example: 'To sell more tickets, we’ll advertise on local radio tomorrow.', phonetic: '/ˈædvətaɪz/', synonyms: ['promote', 'publicize', 'market', 'spread'] }
        ],
        completed: false
      },
      {
        id: 8,
        title: 'Set 8',
        words: [
          { word: 'install', definition: 'To put software or equipment in place', example: 'Please install the printer before the class begins at nine.', phonetic: '/ɪnˈstɔːl/', synonyms: ['set up', 'put in', 'configure', 'mount'] },
          { word: 'update', definition: 'To make something newer with recent changes', example: 'Remember to update apps to fix bugs and improve security.', phonetic: '/ˈʌpdeɪt/', synonyms: ['upgrade', 'refresh', 'patch', 'revise'] },
          { word: 'download', definition: 'To transfer files from internet onto device', example: 'Before the trip, download maps so they work without data.', phonetic: '/ˈdaʊnˌləʊd/', synonyms: ['get', 'save', 'fetch', 'pull down'] },
          { word: 'reset', definition: 'To return settings to their original state', example: 'When passwords fail repeatedly, reset your account through the link.', phonetic: '/ˌriːˈsɛt/', synonyms: ['restore', 'restart', 'revert', 'clear'] },
          { word: 'attach', definition: 'To fasten or add something to something', example: 'Don’t forget to attach the receipt to your reimbursement email.', phonetic: '/əˈtætʃ/', synonyms: ['fasten', 'clip', 'join', 'add'] }
        ],
        completed: false
      },
      {
        id: 9,
        title: 'Set 9',
        words: [
          { word: 'prevent', definition: 'To stop something bad from happening again', example: 'Good handwashing helps prevent stomach bugs during holiday trips.', phonetic: '/prɪˈvɛnt/', synonyms: ['stop', 'avoid', 'block', 'avert'] },
          { word: 'recover', definition: 'To get better after illness or difficulty', example: 'It may take weeks to recover fully after the operation.', phonetic: '/rɪˈkʌvə/', synonyms: ['heal', 'get better', 'bounce back', 'regain'] },
          { word: 'reduce', definition: 'To make something smaller in amount overall', example: 'Regular breaks can reduce eye strain during long computer sessions.', phonetic: '/rɪˈdjuːs/', synonyms: ['lessen', 'decrease', 'lower', 'cut'] },
          { word: 'improve', definition: 'To make something better in quality overall', example: 'Practice can improve your pronunciation within a few weeks.', phonetic: '/ɪmˈpruːv/', synonyms: ['enhance', 'upgrade', 'better', 'develop'] },
          { word: 'treat', definition: 'To give medical care to someone properly', example: 'The clinic can treat minor injuries without an appointment today.', phonetic: '/triːt/', synonyms: ['care for', 'medicate', 'cure', 'attend'] }
        ],
        completed: false
      },
      {
        id: 10,
        title: 'Set 10',
        words: [
          { word: 'schedule', definition: 'To set a time for something later', example: 'We should schedule the interview before the end of today.', phonetic: '/ˈʃedjuːl/', synonyms: ['arrange', 'set', 'book', 'timetable'] },
          { word: 'confirm', definition: 'To say a detail is correct officially', example: 'Could you confirm the delivery window before tomorrow morning?', phonetic: '/kənˈfɜːm/', synonyms: ['verify', 'check', 'approve', 'certify'] },
          { word: 'cancel', definition: 'To decide something will not take place', example: 'If the speaker is ill, we must cancel the talk.', phonetic: '/ˈkænsəl/', synonyms: ['call off', 'scrap', 'abort', 'drop'] },
          { word: 'reschedule', definition: 'To change a planned time to another', example: 'If trains are late, we should reschedule the afternoon meeting.', phonetic: '/ˌriːˈʃedjuːl/', synonyms: ['rearrange', 'move', 'push back', 'postpone'] },
          { word: 'remind', definition: 'To help someone remember a future task', example: 'Can you remind me to send the invoice tonight?', phonetic: '/rɪˈmaɪnd/', synonyms: ['prompt', 'nudge', 'jog memory', 'alert'] }
        ],
        completed: false
      },
      {
        id: 11,
        title: 'Set 11',
        words: [
          { word: 'warn', definition: 'To tell about danger to prevent harm', example: 'The signs warn hikers about falling rocks after heavy rain.', phonetic: '/wɔːn/', synonyms: ['caution', 'alert', 'notify', 'forewarn'] },
          { word: 'permit', definition: 'To officially allow someone to do something', example: 'The staff permit visitors to take photos without a flash.', phonetic: '/pəˈmɪt/', synonyms: ['allow', 'authorize', 'let', 'approve'] },
          { word: 'forbid', definition: 'To say something is not allowed officially', example: 'Many parks forbid fires during hot, windy summer weekends.', phonetic: '/fəˈbɪd/', synonyms: ['ban', 'prohibit', 'bar', 'disallow'] },
          { word: 'advise', definition: 'To give suggestions to help someone’s decision', example: 'Doctors advise patients to rest if symptoms continue for days.', phonetic: '/ədˈvaɪz/', synonyms: ['recommend', 'counsel', 'suggest', 'guide'] },
          { word: 'request', definition: 'To politely ask for something from someone', example: 'You can request extra towels at reception any time tonight.', phonetic: '/rɪˈkwest/', synonyms: ['ask', 'seek', 'petition', 'solicit'] }
        ],
        completed: false
      },
      {
        id: 12,
        title: 'Set 12',
        words: [
          { word: 'charge', definition: 'To ask payment amount for a service', example: 'The shop will charge a small fee for home delivery.', phonetic: '/tʃɑːdʒ/', synonyms: ['bill', 'price', 'invoice', 'levy'] },
          { word: 'refund', definition: 'To give money back after a problem', example: 'They’ll refund the ticket if the train is fully canceled.', phonetic: '/ˈriːfʌnd/', synonyms: ['repay', 'reimburse', 'return', 'compensate'] },
          { word: 'replace', definition: 'To put a new thing instead of old', example: 'Please replace the batteries if the remote stops working suddenly.', phonetic: '/rɪˈpleɪs/', synonyms: ['substitute', 'swap', 'change', 'renew'] },
          { word: 'ship', definition: 'To send goods to a customer somewhere', example: 'They ship orders daily, even during busy holiday weeks.', phonetic: '/ʃɪp/', synonyms: ['send', 'dispatch', 'mail', 'deliver'] },
          { word: 'track', definition: 'To follow progress or location over time', example: 'Customers track parcels online using the code from the receipt.', phonetic: '/træk/', synonyms: ['follow', 'monitor', 'trace', 'check'] }
        ],
        completed: false
      },
      {
        id: 13,
        title: 'Set 13',
        words: [
          { word: 'persuade', definition: 'To make someone agree by giving reasons', example: 'She persuaded her parents to let her join the trip.', phonetic: '/pəˈsweɪd/', synonyms: ['convince', 'influence', 'sway', 'win over'] },
          { word: 'argue', definition: 'To speak strongly because you disagree', example: 'Neighbors argued about parking until the council changed the plan.', phonetic: '/ˈɑːɡjuː/', synonyms: ['dispute', 'quarrel', 'contend', 'disagree'] },
          { word: 'reply', definition: 'To answer after receiving a message', example: 'Please reply within two days so we can confirm numbers.', phonetic: '/rɪˈplaɪ/', synonyms: ['answer', 'respond', 'write back', 'return'] },
          { word: 'interrupt', definition: 'To stop someone speaking for a moment', example: 'Please don’t interrupt while I’m explaining the safety steps.', phonetic: '/ˌɪntəˈrʌpt/', synonyms: ['cut in', 'interject', 'break in', 'disturb'] },
          { word: 'apologize', definition: 'To say sorry for a mistake', example: 'He apologized for the noise and offered to help repair it.', phonetic: '/əˈpɒlədʒaɪz/', synonyms: ['say sorry', 'make amends', 'atone', 'apologize to'] }
        ],
        completed: false
      },
      {
        id: 14,
        title: 'Set 14',
        words: [
          { word: 'reserve', definition: 'To book something for your future use', example: 'Let’s reserve seats now so we can sit together.', phonetic: '/rɪˈzɜːv/', synonyms: ['book', 'secure', 'hold', 'set aside'] },
          { word: 'extend', definition: 'To make a period or length longer', example: 'They extended their stay to see family over the weekend.', phonetic: '/ɪkˈstend/', synonyms: ['lengthen', 'prolong', 'continue', 'stretch'] },
          { word: 'upgrade', definition: 'To change to a better, newer level', example: 'The hotel upgraded our room because the lift was broken.', phonetic: '/ˈʌpɡreɪd/', synonyms: ['improve', 'update', 'move up', 'advance'] },
          { word: 'cancel', definition: 'To decide an event will not happen', example: 'They canceled the tour because of dangerous winds near cliffs.', phonetic: '/ˈkænsəl/', synonyms: ['call off', 'scrap', 'abort', 'drop'] },
          { word: 'reschedule', definition: 'To change a planned time to another', example: 'We rescheduled the interview after the power cut last night.', phonetic: '/ˌriːˈʃedjuːl/', synonyms: ['rearrange', 'move', 'postpone', 'push back'] }
        ],
        completed: false
      },
      {
        id: 15,
        title: 'Set 15',
        words: [
          { word: 'assemble', definition: 'To put parts together to make something', example: 'We assembled the shelves carefully using the picture instructions.', phonetic: '/əˈsɛmbl/', synonyms: ['build', 'put together', 'construct', 'set up'] },
          { word: 'adjust', definition: 'To change slightly so it fits better', example: 'You may adjust the chair height for better back support.', phonetic: '/əˈdʒʌst/', synonyms: ['modify', 'alter', 'tune', 'tweak'] },
          { word: 'connect', definition: 'To join two things so they work', example: 'After connecting the cables, the monitor finally showed the picture.', phonetic: '/kəˈnɛkt/', synonyms: ['link', 'join', 'attach', 'plug'] },
          { word: 'secure', definition: 'To fasten firmly so it stays safe', example: 'Always secure ladders before climbing to check the roof tiles.', phonetic: '/sɪˈkjʊə/', synonyms: ['fasten', 'fix', 'lock', 'tie'] },
          { word: 'polish', definition: 'To rub a surface until it shines', example: 'We polished the wooden table before setting plates and flowers.', phonetic: '/ˈpɒlɪʃ/', synonyms: ['shine', 'buff', 'rub', 'brighten'] }
        ],
        completed: false
      },
      {
        id: 16,
        title: 'Set 16',
        words: [
          { word: 'order', definition: 'To ask for food or items to buy', example: 'We’ll order two pizzas and a salad for the group.', phonetic: '/ˈɔːdə/', synonyms: ['request', 'purchase', 'place order', 'order in'] },
          { word: 'serve', definition: 'To give food or help to people', example: 'They serve breakfast until eleven on weekends and holidays.', phonetic: '/sɜːv/', synonyms: ['give', 'hand out', 'present', 'provide'] },
          { word: 'taste', definition: 'To try small amount to check flavor', example: 'Always taste the sauce before adding more salt.', phonetic: '/teɪst/', synonyms: ['sample', 'try', 'savor', 'test'] },
          { word: 'chop', definition: 'To cut something into small pieces quickly', example: 'Chop the onions finely and keep your fingers safe.', phonetic: '/tʃɒp/', synonyms: ['cut', 'dice', 'slice', 'mince'] },
          { word: 'stir', definition: 'To move food around to mix evenly', example: 'Stir the porridge slowly so it doesn’t stick or burn.', phonetic: '/stɜː/', synonyms: ['mix', 'blend', 'whisk', 'agitate'] },
        ],
        completed: false
      },
      {
        id: 17,
        title: 'Set 17',
        words: [
          { word: 'worry', definition: 'To feel anxious about possible problems', example: 'Try not to worry; the results arrive tomorrow afternoon.', phonetic: '/ˈwʌri/', synonyms: ['fret', 'be anxious', 'stress'] },
          { word: 'cheer', definition: 'To make someone feel happier or hopeful', example: 'A short message can cheer friends during tough weeks.', phonetic: '/tʃɪə/', synonyms: ['encourage', 'hearten', 'brighten'] },
          { word: 'forgive', definition: 'To stop being angry about someone’s mistake', example: 'She chose to forgive him after his honest apology.', phonetic: '/fəˈɡɪv/', synonyms: ['pardon', 'excuse', 'let go'] },
          { word: 'praise', definition: 'To say good things about someone’s work', example: 'Teachers praise effort when students keep trying after mistakes.', phonetic: '/preɪz/', synonyms: ['compliment', 'applaud', 'commend'] },
          { word: 'regret', definition: 'To feel sorry about something that happened', example: 'You might regret speaking quickly without checking the facts first.', phonetic: '/rɪˈɡrɛt/', synonyms: ['be sorry', 'lament', 'rue'] },
        ],
        completed: false
      },
      {
        id: 18,
        title: 'Set 18',
        words: [
          { word: 'heat', definition: 'To make something warmer using energy', example: 'We heat the living room before guests arrive tonight.', phonetic: '/hiːt/', synonyms: ['warm', 'heat up', 'warm up'] },
          { word: 'cool', definition: 'To make something less warm or hot', example: 'Open the window to cool the room after cooking.', phonetic: '/kuːl/', synonyms: ['chill', 'cool down', 'lower'] },
          { word: 'dry', definition: 'To remove water so something becomes dry', example: 'Hang the shirts to dry near the sunny window.', phonetic: '/draɪ/', synonyms: ['dry out', 'air dry', 'dehydrate'] },
          { word: 'fold', definition: 'To bend paper or cloth into layers', example: 'Please fold the towels and stack them by size.', phonetic: '/fəʊld/', synonyms: ['bend', 'crease', 'double'] },
          { word: 'iron', definition: 'To press clothes flat with a hot iron', example: 'I iron the trousers before interviews to look tidy.', phonetic: '/ˈaɪən/', synonyms: ['press', 'smooth', 'flatten'] },
        ],
        completed: false
      },
      {
        id: 19,
        title: 'Set 19',
        words: [
          { word: 'paint', definition: 'To cover a surface with colored liquid', example: 'We paint small models together on quiet Sunday afternoons.', phonetic: '/peɪnt/', synonyms: ['color', 'decorate', 'coat'] },
          { word: 'draw', definition: 'To make pictures using lines and shapes', example: 'Children draw animals first, then add backgrounds and color.', phonetic: '/drɔː/', synonyms: ['sketch', 'outline', 'illustrate'] },
          { word: 'camp', definition: 'To sleep outside in tents for fun', example: 'We camp near the river and watch stars after dinner.', phonetic: '/kæmp/', synonyms: ['pitch tents', 'sleep outdoors', 'stay in tents'] },
          { word: 'hike', definition: 'To walk long distances for exercise', example: 'They hike coastal paths when the weather is clear.', phonetic: '/haɪk/', synonyms: ['trek', 'ramble', 'walk far'] },
          { word: 'swim', definition: 'To move through water using arms and legs', example: 'We swim a few laps before breakfast on holidays.', phonetic: '/swɪm/', synonyms: ['paddle', 'do laps', 'bathe'] },
        ],
        completed: false
      },
      {
        id: 20,
        title: 'Set 20',
        words: [
          { word: 'fill in', definition: 'To complete a form by writing details', example: 'Please fill in the visitor form before you enter.', phonetic: '/ˌfɪl ˈɪn/', synonyms: ['complete', 'write in', 'enter details'] },
          { word: 'submit', definition: 'To send work or forms for approval', example: 'You must submit timesheets by noon each Friday.', phonetic: '/səbˈmɪt/', synonyms: ['send in', 'hand in', 'turn in'] },
          { word: 'print', definition: 'To make a paper copy from digital files', example: 'Only print the final draft to save paper and ink.', phonetic: '/prɪnt/', synonyms: ['produce', 'make copy', 'output'] },
          { word: 'sign', definition: 'To write your name to show agreement', example: 'Don’t sign anything until you read the final version.', phonetic: '/saɪn/', synonyms: ['write name', 'autograph', 'sign off'] },
          { word: 'file', definition: 'To store documents in a specific place', example: 'After approval, file the invoices by month and project.', phonetic: '/faɪl/', synonyms: ['archive', 'store', 'put away'] },
        ],
        completed: false
      }
    ]
  },
  {
    id: 'upper-intermediate',
    name: 'Upper-Intermediate',
    description: '100 Sets, 500 words at CEFR B1+ Level',
    cefr: 'B1+',
    icon: '🌳',
    sets: [
      {
        id: 1,
        title: 'Set 1',
        words: [
          { word: 'fragile', definition: 'Easily broken or damaged, requiring careful handling', example: 'Handle the fragile vase carefully; its thin glass chips easily.', phonetic: '/ˈfrædʒaɪl/', synonyms: ['delicate', 'breakable', 'brittle', 'frail'] },
          { word: 'generous', definition: 'Willing to give more than necessary', example: 'Her generous donation kept the shelter open through winter this year.', phonetic: '/ˈdʒɛnərəs/', synonyms: ['charitable', 'big-hearted', 'liberal', 'giving'] },
          { word: 'reluctant', definition: 'Unwilling and hesitant to do something', example: 'He felt reluctant to speak first during the tense meeting.', phonetic: '/rɪˈlʌktənt/', synonyms: ['hesitant', 'unwilling', 'loath', 'averse'] },
          { word: 'damp', definition: 'Slightly wet, often uncomfortably or unexpectedly', example: 'The tent felt damp after the stormy night by the lake.', phonetic: '/dæmp/', synonyms: ['moist', 'humid', 'clammy', 'dank'] },
          { word: 'ancient', definition: 'Very old, belonging to a distant past', example: 'We explored ancient ruins overlooking the valley at sunrise today.', phonetic: '/ˈeɪnʃənt/', synonyms: ['old', 'antique', 'age-old', 'archaic'] }
        ],
        completed: true
      },
      {
        id: 2,
        title: 'Set 2',
        words: [
          { word: 'predict', definition: 'To say what will happen before', example: "Experts predict heavy rain tomorrow despite today's unusually clear sky.", phonetic: '/prɪˈdɪkt/', synonyms: ['anticipate', 'foresee', 'expect', 'forecast'] },
          { word: 'avoid', definition: 'To keep away from something unpleasant', example: 'We should avoid busy roads during rush hour to stay safe.', phonetic: '/əˈvɔɪd/', synonyms: ['evade', 'dodge', 'shun', 'steer clear'] },
          { word: 'improve', definition: 'To make something better in quality', example: 'Regular practice will improve your accent and overall speaking confidence.', phonetic: '/ɪmˈpruːv/', synonyms: ['enhance', 'better', 'upgrade', 'refine'] },
          { word: 'encourage', definition: 'To give support that makes someone act', example: 'Teachers encourage students to ask questions and share their ideas.', phonetic: '/ɪnˈkʌrɪdʒ/', synonyms: ['motivate', 'inspire', 'spur', 'urge'] },
          { word: 'complain', definition: 'To say you are unhappy about something', example: 'Customers complain when deliveries arrive late without any clear explanation.', phonetic: '/kəmˈpleɪn/', synonyms: ['grumble', 'protest', 'object', 'gripe'] }
        ],
        completed: false,
        inProgress: true
      },
      {
        id: 3,
        title: 'Set 3',
        words: [
          { word: 'decide', definition: 'To choose after considering different possible options', example: 'After comparing prices, we decided to buy the smaller model.', phonetic: '/dɪˈsaɪd/', synonyms: ['choose', 'determine', 'settle', 'conclude'] },
          { word: 'recommend', definition: 'To suggest something as good or suitable', example: 'I recommend visiting early, because the museum gets crowded later.', phonetic: '/ˌrɛkəˈmɛnd/', synonyms: ['suggest', 'advise', 'endorse', 'propose'] },
          { word: 'maintain', definition: 'To keep something in good condition', example: 'Technicians maintain the machines regularly to prevent costly breakdowns at night.', phonetic: '/meɪnˈteɪn/', synonyms: ['keep', 'preserve', 'sustain', 'uphold'] },
          { word: 'reduce', definition: 'To make something smaller in amount', example: 'Cutting sugar can reduce headaches and improve your daily energy.', phonetic: '/rɪˈdjuːs/', synonyms: ['lessen', 'decrease', 'lower', 'cut'] },
          { word: 'deliver', definition: 'To bring or send something to someone', example: 'They deliver groceries within hours, even during heavy rainstorms in winter.', phonetic: '/dɪˈlɪvə(r)/', synonyms: ['bring', 'supply', 'distribute', 'dispatch'] }
        ],
        completed: false
      },
      {
        id: 4,
        title: 'Set 4',
        words: [
          { word: 'borrow', definition: 'To take and use something temporarily', example: 'You can borrow my umbrella if the rain starts again.', phonetic: '/ˈbɒrəʊ/', synonyms: ['take on loan', 'use temporarily', 'get on loan'] },
          { word: 'lend', definition: 'To give something temporarily to someone', example: 'She agreed to lend me her notes for tomorrow\'s exam.', phonetic: '/lɛnd/', synonyms: ['loan', 'give temporarily', 'advance'] },
          { word: 'compare', definition: 'To examine similarities and differences between things', example: 'Let\'s compare both offers before we choose the cheaper option.', phonetic: '/kəmˈpeə/', synonyms: ['contrast', 'match up', 'evaluate differences'] },
          { word: 'explain', definition: 'To make an idea clear by describing', example: 'Please explain the steps slowly so everyone can follow.', phonetic: '/ɪkˈspleɪn/', synonyms: ['clarify', 'describe', 'make clear'] },
          { word: 'arrange', definition: 'To plan and organize details in order', example: 'We should arrange a meeting for Friday afternoon at school.', phonetic: '/əˈreɪndʒ/', synonyms: ['organize', 'schedule', 'plan'] }
        ],
        completed: false
      },
      {
        id: 5,
        title: 'Set 5',
        words: [
          { word: 'mitigate', definition: 'To make a problem less severe or harmful', example: 'New safety guidelines aim to mitigate risks during maintenance work.', phonetic: '/ˈmɪtɪɡeɪt/', synonyms: ['lessen', 'alleviate', 'reduce', 'ease'] },
          { word: 'allocate', definition: 'To assign resources or duties for particular purposes', example: 'The manager will allocate funds after reviewing each department’s proposal.', phonetic: '/ˈæləkeɪt/', synonyms: ['assign', 'apportion', 'distribute', 'earmark'] },
          { word: 'justify', definition: 'To give reasons showing a decision is reasonable', example: 'You must justify travel expenses before finance approves reimbursement.', phonetic: '/ˈdʒʌstɪfaɪ/', synonyms: ['defend', 'warrant', 'substantiate', 'vindicate'] },
          { word: 'compromise', definition: 'To settle a disagreement by mutual concessions', example: 'After hours of talks, both sides agreed to compromise on payment.', phonetic: '/ˈkɒmprəmaɪz/', synonyms: ['negotiate', 'settle', 'conciliate', 'concede'] },
          { word: 'implement', definition: 'To put a plan or decision into effect', example: 'The city plans to implement the new recycling scheme next spring.', phonetic: '/ˈɪmplɪˌmɛnt/', synonyms: ['execute', 'carry out', 'enforce', 'apply'] }
        ],
        completed: false
      },
      {
        id: 6,
        title: 'Set 6',
        words: [
          { word: 'assess', definition: "To evaluate something's quality, value, or significance", example: 'We need to assess the proposal before allocating any funds.', phonetic: '/əˈsɛs/', synonyms: ['evaluate', 'appraise', 'gauge', 'judge'] },
          { word: 'interpret', definition: 'To explain the meaning of something clearly', example: 'Students must interpret the graph before answering the final question.', phonetic: '/ɪnˈtɜːprɪt/', synonyms: ['explain', 'construe', 'decipher', 'expound'] },
          { word: 'infer', definition: 'To reach a conclusion from available evidence', example: "From the patterns, we can infer the system's likely behavior.", phonetic: '/ɪnˈfɜː/', synonyms: ['deduce', 'conclude', 'derive', 'extrapolate'] },
          { word: 'articulate', definition: 'To express ideas clearly in spoken words', example: "She can articulate complex ideas without losing the audience's attention.", phonetic: '/ɑːˈtɪkjʊlət/', synonyms: ['express', 'voice', 'put into words', 'state'] },
          { word: 'reconcile', definition: 'To restore harmony by resolving differences', example: 'The mediator helped reconcile priorities after months of tense negotiations.', phonetic: '/ˈrɛkənsaɪl/', synonyms: ['resolve', 'harmonize', 'settle', 'patch up'] }
        ],
        completed: false
      },
      {
        id: 7,
        title: 'Set 7',
        words: [
          { word: 'scrutinize', definition: 'To examine something carefully for detailed accuracy', example: 'Editors scrutinize every reference to prevent misleading claims in print.', phonetic: '/ˈskruːtɪnaɪz/', synonyms: ['inspect', 'examine', 'analyze', 'probe'] },
          { word: 'advocate', definition: 'To publicly support a cause or idea', example: 'Scientists advocate stronger policies to protect rapidly warming ecosystems.', phonetic: '/ˈædvəkeɪt/', synonyms: ['support', 'champion', 'endorse', 'promote'] },
          { word: 'synthesize', definition: 'To combine parts into a coherent whole', example: 'The report synthesizes interviews and data to present balanced conclusions.', phonetic: '/ˈsɪnθɪsaɪz/', synonyms: ['combine', 'integrate', 'fuse', 'consolidate'] },
          { word: 'undermine', definition: 'To weaken something gradually or secretly', example: 'Leaks can undermine trust and damage long-term collaboration across teams.', phonetic: '/ˌʌndəˈmaɪn/', synonyms: ['weaken', 'erode', 'sap', 'undercut'] },
          { word: 'adhere', definition: 'To stick firmly to rules or surfaces', example: 'Teams must adhere to guidelines to ensure consistent, fair evaluations.', phonetic: '/ədˈhɪə/', synonyms: ['stick', 'comply', 'follow', 'abide by'] }
        ],
        completed: false
      },
      {
        id: 8,
        title: 'Set 8',
        words: [
          { word: 'assert', definition: 'To state something confidently as true', example: 'The author asserts the policy harms small businesses in rural areas.', phonetic: '/əˈsɜːt/', synonyms: ['maintain', 'claim', 'contend', 'affirm'] },
          { word: 'concede', definition: 'To admit something true after initial denial', example: 'After reviewing the data, she conceded their method needed revisions.', phonetic: '/kənˈsiːd/', synonyms: ['admit', 'acknowledge', 'yield', 'grant'] },
          { word: 'imply', definition: 'To suggest something without stating it directly', example: 'His tone implied the deadline might shift without formal notice.', phonetic: '/ɪmˈplaɪ/', synonyms: ['suggest', 'hint', 'intimate', 'indicate'] },
          { word: 'refute', definition: 'To prove a statement or claim wrong', example: 'New evidence refuted the rumors circulating across social media today.', phonetic: '/rɪˈfjuːt/', synonyms: ['disprove', 'rebut', 'counter', 'invalidate'] },
          { word: 'outline', definition: 'To describe main points in a summary', example: 'In the introduction, outline your aims and planned research methods.', phonetic: '/ˈaʊtlaɪn/', synonyms: ['summarize', 'sketch', 'delineate', 'map out'] }
        ],
        completed: false
      },
      {
        id: 9,
        title: 'Set 9',
        words: [
          { word: 'contrast', definition: 'To compare to show clear differences', example: 'The study contrasts rural and urban spending across three decades.', phonetic: '/ˈkɒntrɑːst/', synonyms: ['differ', 'distinguish', 'juxtapose', 'set against'] },
          { word: 'corroborate', definition: 'To provide evidence that supports a claim', example: 'Multiple witnesses corroborated the timeline described in the police statement.', phonetic: '/kəˈrɒbəreɪt/', synonyms: ['confirm', 'substantiate', 'validate', 'support'] },
          { word: 'hypothesize', definition: 'To propose an explanation based on limited evidence', example: 'Researchers hypothesize that warmer nights accelerate plant growth in spring.', phonetic: '/haɪˈpɒθɪsaɪz/', synonyms: ['suppose', 'posit', 'theorize', 'speculate'] },
          { word: 'constrain', definition: 'To limit actions or growth by force', example: 'Strict budgets constrain expansion plans despite rising customer demand.', phonetic: '/kənˈstreɪn/', synonyms: ['restrict', 'limit', 'curb', 'restrain'] },
          { word: 'deviate', definition: 'To move away from an expected course', example: 'The pilot deviated slightly to avoid storms approaching the coast.', phonetic: '/ˈdiːvieɪt/', synonyms: ['stray', 'diverge', 'depart', 'veer'] }
        ],
        completed: false
      },
      {
        id: 10,
        title: 'Set 10',
        words: [
          { word: 'correlate', definition: 'To show a relationship between two variables', example: 'Their findings correlate temperature spikes with increased energy consumption nationwide.', phonetic: '/ˈkɒrəleɪt/', synonyms: ['connect', 'relate', 'link', 'associate'] },
          { word: 'validate', definition: 'To confirm something is accurate or acceptable', example: 'Independent labs validate the results before journals agree to publish.', phonetic: '/ˈvælɪdeɪt/', synonyms: ['confirm', 'verify', 'authenticate', 'substantiate'] },
          { word: 'compile', definition: 'To collect information into an organized whole', example: 'We will compile interviews and surveys into one comprehensive report.', phonetic: '/kəmˈpaɪl/', synonyms: ['collect', 'gather', 'assemble', 'collate'] },
          { word: 'elucidate', definition: 'To make something clear through thorough explanation', example: 'The lecturer used simple diagrams to elucidate complex neural processes.', phonetic: '/ɪˈluːsɪdeɪt/', synonyms: ['clarify', 'explain', 'illuminate', 'expound'] },
          { word: 'benchmark', definition: 'To measure performance against a defined standard', example: 'Startups benchmark performance against leaders to identify realistic improvement targets.', phonetic: '/ˈbɛntʃmɑːk/', synonyms: ['evaluate', 'compare', 'measure', 'gauge'] }
        ],
        completed: false
      },
      {
        id: 11,
        title: 'Set 11',
        words: [
          { word: 'prioritize', definition: 'To arrange tasks by importance or urgency', example: 'We must prioritize critical bugs before adding new optional features.', phonetic: '/praɪˈɒrətaɪz/', synonyms: ['rank', 'order', 'sequence', 'triage'] },
          { word: 'negotiate', definition: 'To discuss terms to reach a fair agreement', example: 'Vendors will negotiate prices if we present dependable long-term demand.', phonetic: '/nɪˈɡəʊʃieɪt/', synonyms: ['bargain', 'discuss terms', 'broker', 'mediate'] },
          { word: 'revise', definition: 'To update a text to improve clarity', example: 'Please revise the report so conclusions match the latest figures.', phonetic: '/rɪˈvaɪz/', synonyms: ['edit', 'update', 'amend', 'rewrite'] },
          { word: 'forecast', definition: 'To predict future events based on data', example: 'Analysts forecast slower growth unless fuel prices fall this quarter.', phonetic: '/ˈfɔːkɑːst/', synonyms: ['predict', 'project', 'anticipate', 'estimate'] },
          { word: 'coordinate', definition: 'To organize people or tasks to work together', example: 'We coordinate teams across offices to avoid duplicate work and delays.', phonetic: '/kəʊˈɔːdɪneɪt/', synonyms: ['organize', 'align', 'orchestrate', 'synchronize'] }
        ],
        completed: false
      },
      {
        id: 12,
        title: 'Set 12',
        words: [
          { word: 'enforce', definition: 'Ensure rules are obeyed through authority', example: 'Inspectors enforce safety rules during construction to prevent avoidable accidents.', phonetic: '/ɪnˈfɔːs/', synonyms: ['impose', 'apply', 'implement', 'execute'] },
          { word: 'comply', definition: 'Act according to rules, requests, or standards', example: 'All suppliers must comply with updated packaging standards this year.', phonetic: '/kəmˈplaɪ/', synonyms: ['obey', 'conform', 'adhere', 'follow'] },
          { word: 'violate', definition: 'Break a rule, agreement, or legal requirement', example: 'Posting private data may violate privacy laws in several countries.', phonetic: '/ˈvaɪəleɪt/', synonyms: ['breach', 'infringe', 'contravene', 'transgress'] },
          { word: 'amend', definition: 'Make changes to improve a text or law', example: 'Lawmakers amended the bill to include stronger environmental protections.', phonetic: '/əˈmɛnd/', synonyms: ['revise', 'modify', 'alter', 'edit'] },
          { word: 'disclose', definition: 'Make previously hidden information publicly known', example: 'Companies must disclose risks to investors before offering new shares.', phonetic: '/dɪsˈkləʊz/', synonyms: ['reveal', 'expose', 'divulge', 'unveil'] }
        ],
        completed: false
      },
      {
        id: 13,
        title: 'Set 13',
        words: [
          { word: 'curtail', definition: 'To reduce something in extent or amount', example: 'The committee voted to curtail overtime during the slower season.', phonetic: '/kɜːˈteɪl/', synonyms: ['reduce', 'cut', 'limit', 'restrict'] },
          { word: 'amplify', definition: 'To make something stronger, louder, or greater', example: 'The update will amplify signal strength in crowded indoor spaces.', phonetic: '/ˈæmplɪfaɪ/', synonyms: ['increase', 'boost', 'intensify', 'magnify'] },
          { word: 'rectify', definition: 'To correct something by making necessary changes', example: 'The editor promised to rectify errors before the article goes live.', phonetic: '/ˈrɛktɪfaɪ/', synonyms: ['correct', 'fix', 'amend', 'remedy'] },
          { word: 'commence', definition: 'To begin an activity, event, or process', example: 'Construction will commence once permits arrive and safety checks finish.', phonetic: '/kəˈmɛns/', synonyms: ['begin', 'start', 'initiate', 'launch'] },
          { word: 'conclude', definition: 'To finish something or reach a decision', example: 'After final questions, the panel will conclude the session before lunch.', phonetic: '/kənˈkluːd/', synonyms: ['finish', 'end', 'decide', 'determine'] }
        ],
        completed: false
      }
      ,
      {
        id: 14,
        title: 'Set 14',
        words: [
          { word: 'contemplate', definition: 'To think about something deeply and carefully', example: 'She paused to contemplate moving abroad before signing the lease.', phonetic: '/ˈkɒntəmpleɪt/', synonyms: ['consider', 'ponder', 'deliberate', 'mull over'] },
          { word: 'bolster', definition: 'To support or strengthen something already existing', example: 'New evidence will bolster their case before the review board.', phonetic: '/ˈbəʊlstə/', synonyms: ['strengthen', 'support', 'reinforce', 'fortify'] },
          { word: 'downplay', definition: 'To make something seem less important', example: 'Officials tried to downplay delays during the press conference yesterday.', phonetic: '/ˈdaʊnpleɪ/', synonyms: ['minimize', 'play down', 'understate', 'de-emphasize'] },
          { word: 'counter', definition: 'To respond with opposing argument or action', example: 'She countered the claim with data from three independent studies.', phonetic: '/ˈkaʊntə/', synonyms: ['oppose', 'rebut', 'refute', 'respond to'] },
          { word: 'elicit', definition: 'To draw out a response or reaction', example: 'The interviewer used open questions to elicit more detailed answers.', phonetic: '/ɪˈlɪsɪt/', synonyms: ['evoke', 'draw out', 'prompt', 'extract'] }
        ],
        completed: false
      }
      ,
      {
        id: 15,
        title: 'Set 15',
        words: [
          { word: 'fluctuate', definition: 'To change level frequently, rising and falling', example: 'Energy demand fluctuates during heatwaves, challenging grids and pushing prices higher nationwide.', phonetic: '/ˈflʌktʃueɪt/', synonyms: ['vary', 'oscillate', 'swing', 'shift'] },
          { word: 'stabilize', definition: 'To make or become steady and consistent', example: 'Emergency loans helped stabilize markets after weeks of unsettling volatility worldwide.', phonetic: '/ˈsteɪbəlaɪz/', synonyms: ['steady', 'level', 'normalize', 'balance'] },
          { word: 'accelerate', definition: 'To increase speed or rate of change', example: 'Warmer temperatures accelerate melting, threatening homes and infrastructure near low-lying coasts.', phonetic: '/əkˈsɛləreɪt/', synonyms: ['speed up', 'quicken', 'hasten', 'expedite'] },
          { word: 'deteriorate', definition: 'To become worse in quality or condition', example: 'Without maintenance, roads deteriorate quickly after repeated storms and heavy traffic surges.', phonetic: '/dɪˈtɪəriəreɪt/', synonyms: ['worsen', 'decline', 'degrade', 'degenerate'] },
          { word: 'plateau', definition: 'To reach a stable level after growth', example: 'After early improvements, scores plateau unless practice sessions become harder over time.', phonetic: '/plæˈtəʊ/', synonyms: ['level off', 'flatten', 'stabilize', 'even out'] }
        ],
        completed: false
      }
      ,
      {
        id: 16,
        title: 'Set 16',
        words: [
          { word: 'verify', definition: 'Confirm truth or accuracy through careful checks', example: 'Scientists verify results with replication before publishing in major journals.', phonetic: '/ˈvɛrɪfaɪ/', synonyms: ['confirm', 'validate', 'authenticate', 'check'] },
          { word: 'refine', definition: 'Improve something by making small precise changes', example: 'We refined the prototype after testers reported several usability issues.', phonetic: '/rɪˈfaɪn/', synonyms: ['improve', 'polish', 'hone', 'sharpen'] },
          { word: 'formulate', definition: 'Create or express an idea in detail', example: 'Take time to formulate clear goals before choosing any method.', phonetic: '/ˈfɔːmjʊleɪt/', synonyms: ['devise', 'frame', 'articulate', 'craft'] },
          { word: 'illustrate', definition: 'Explain or make clear using examples', example: 'The teacher illustrated complex ideas with simple drawings and stories.', phonetic: '/ˈɪləstreɪt/', synonyms: ['explain', 'demonstrate', 'exemplify', 'clarify'] },
          { word: 'navigate', definition: 'Find a way through a situation successfully', example: 'Newcomers navigate local bureaucracy better with guides and patient help.', phonetic: '/ˈnævɪɡeɪt/', synonyms: ['find way', 'steer', 'maneuver', 'pilot'] }
        ],
        completed: false
      }
      ,
      {
        id: 17,
        title: 'Set 17',
        words: [
          { word: 'alleviate', definition: 'To make pain or problems less severe', example: 'Simple breathing exercises can alleviate stress during high-pressure interviews significantly.', phonetic: '/əˈliːvieɪt/', synonyms: ['lessen', 'ease', 'mitigate', 'relieve'] },
          { word: 'exacerbate', definition: 'To make a difficult situation even worse', example: 'Ignoring early warnings may exacerbate shortages throughout the winter months.', phonetic: '/ɪɡˈzæsəbeɪt/', synonyms: ['worsen', 'aggravate', 'intensify', 'amplify'] },
          { word: 'ascertain', definition: 'To find out something with reliable certainty', example: 'Investigators attempted to ascertain causes before issuing the official report.', phonetic: '/ˌæsəˈteɪn/', synonyms: ['determine', 'find out', 'establish', 'verify'] },
          { word: 'delineate', definition: 'To describe something precisely and in detail', example: 'The proposal delineates responsibilities clearly to prevent duplication and confusion.', phonetic: '/dɪˈlɪnieɪt/', synonyms: ['outline', 'describe', 'define', 'sketch'] },
          { word: 'mediate', definition: 'To help opposing sides reach an agreement', example: 'An experienced facilitator can mediate conflicts without escalating personal tensions.', phonetic: '/ˈmiːdieɪt/', synonyms: ['arbitrate', 'negotiate', 'reconcile', 'intervene'] }
        ],
        completed: false
      }
      ,
      {
        id: 18,
        title: 'Set 18',
        words: [
          { word: 'emphasize', definition: 'To give special importance or extra attention', example: 'Teachers emphasize key steps so learners avoid common mistakes early.', phonetic: '/ˈɛmfəsaɪz/', synonyms: ['stress', 'highlight', 'underscore', 'accentuate'] },
          { word: 'acknowledge', definition: 'To accept or admit the truth of something', example: 'He must acknowledge the error and apologize before submitting the revision.', phonetic: '/əkˈnɒlɪdʒ/', synonyms: ['admit', 'accept', 'recognize', 'concede'] },
          { word: 'adapt', definition: 'To change to suit new conditions or uses', example: 'Teams adapt quickly when tools change during tight project schedules.', phonetic: '/əˈdæpt/', synonyms: ['adjust', 'modify', 'tailor', 'acclimate'] },
          { word: 'compensate', definition: 'To make up for loss or damage', example: 'Extra training can compensate for limited experience in complex situations.', phonetic: '/ˈkɒmpɛnseɪt/', synonyms: ['offset', 'make up for', 'recompense', 'redress'] },
          { word: 'question', definition: 'To express doubt or challenge stated assumptions', example: 'Journalists question official statements when evidence appears inconsistent with sources.', phonetic: '/ˈkwɛstʃən/', synonyms: ['doubt', 'challenge', 'query', 'dispute'] }
        ],
        completed: false
      }
      ,
      {
        id: 19,
        title: 'Set 19',
        words: [
          { word: 'expedite', definition: 'To make a process happen faster', example: 'Extra staff can expedite passport applications during peak travel season.', phonetic: '/ˈɛkspɪdaɪt/', synonyms: ['accelerate', 'hasten', 'speed up', 'fast-track'] },
          { word: 'hamper', definition: 'To make progress difficult or slow', example: 'Road closures hamper deliveries when storms hit remote mountain towns.', phonetic: '/ˈhæmpə/', synonyms: ['hinder', 'impede', 'obstruct', 'hold back'] },
          { word: 'contend', definition: 'To argue or claim something is true', example: 'Experts contend the policy ignores evidence from multiple independent studies.', phonetic: '/kənˈtɛnd/', synonyms: ['argue', 'claim', 'maintain', 'assert'] },
          { word: 'dispel', definition: 'To make something disappear, especially doubts', example: 'Clear communication can dispel rumors spreading through anxious communities quickly.', phonetic: '/dɪˈspɛl/', synonyms: ['dissipate', 'banish', 'drive away', 'clear away'] },
          { word: 'uphold', definition: 'To support and maintain rules or decisions', example: 'Courts uphold regulations when agencies follow transparent, lawful procedures properly.', phonetic: '/ʌpˈhəʊld/', synonyms: ['maintain', 'support', 'sustain', 'defend'] }
        ],
        completed: false
      }
      ,
      {
        id: 20,
        title: 'Set 20',
        words: [
          { word: 'evaluate', definition: 'Judge something’s value, quality, or effectiveness', example: 'Teachers evaluate projects using clear criteria and feedback rubrics each semester.', phonetic: '/ɪˈvæljueɪt/', synonyms: ['assess', 'appraise', 'judge', 'rate'] },
          { word: 'depict', definition: 'Represent something in words, pictures, or symbols', example: 'The mural depicts local history using bold colors and simple shapes.', phonetic: '/dɪˈpɪkt/', synonyms: ['portray', 'represent', 'illustrate', 'show'] },
          { word: 'omit', definition: 'Leave out something, either accidentally or deliberately', example: 'Please omit personal details when sharing stories with public groups online.', phonetic: '/əʊˈmɪt/', synonyms: ['leave out', 'exclude', 'drop', 'skip'] },
          { word: 'oppose', definition: 'Act against something; argue it should not happen', example: 'Several residents oppose the plan, citing traffic and safety concerns.', phonetic: '/əˈpəʊz/', synonyms: ['resist', 'contest', 'object to', 'disagree with'] },
          { word: 'endorse', definition: 'Publicly approve or support someone, product, or idea', example: 'Experts endorsed the guidelines after reviewing the evidence and outcomes.', phonetic: '/ɪnˈdɔːs/', synonyms: ['approve', 'back', 'support', 'champion'] }
        ],
        completed: false
      }
      ,
      {
        id: 21,
        title: 'Set 21',
        words: [
          { word: 'allege', definition: 'To claim something as true without proof', example: 'Witnesses allege the contract was altered after signatures without consent.', phonetic: '/əˈlɛdʒ/', synonyms: ['claim', 'assert', 'contend', 'maintain'] },
          { word: 'cite', definition: 'To mention evidence as support in argument', example: 'Report authors cite three sources to support the revised estimates.', phonetic: '/saɪt/', synonyms: ['quote', 'mention', 'refer to', 'reference'] },
          { word: 'foster', definition: 'To encourage the development of something positive', example: 'Community mentors foster confidence and persistence in first-generation students today.', phonetic: '/ˈfɒstə/', synonyms: ['encourage', 'promote', 'nurture', 'cultivate'] },
          { word: 'deter', definition: 'To discourage someone from acting through fear', example: 'Visible cameras deter theft around entrances during late closing hours.', phonetic: '/dɪˈtɜː/', synonyms: ['discourage', 'dissuade', 'inhibit', 'prevent'] },
          { word: 'diversify', definition: 'To make something more varied in type', example: 'Restaurants diversify menus to attract tourists during unpredictable shoulder seasons.', phonetic: '/daɪˈvɜːsɪfaɪ/', synonyms: ['vary', 'broaden', 'expand', 'widen'] }
        ],
        completed: false
      }
      ,
      {
        id: 22,
        title: 'Set 22',
        words: [
          { word: 'investigate', definition: 'To examine a subject carefully for facts', example: 'Reporters investigate claims before publishing any potentially damaging story.', phonetic: '/ɪnˈvɛstɪɡeɪt/', synonyms: ['examine', 'look into', 'explore', 'check'] },
          { word: 'deduce', definition: 'To reach a conclusion from available evidence', example: 'From these figures, analysts deduce which strategy performed best.', phonetic: '/dɪˈdjuːs/', synonyms: ['infer', 'conclude', 'derive', 'reason'] },
          { word: 'speculate', definition: 'To suggest possible explanations without certain proof', example: 'Commentators speculate when data are scarce and deadlines are near.', phonetic: '/ˈspɛkjʊleɪt/', synonyms: ['hypothesize', 'theorize', 'suppose', 'guess'] },
          { word: 'probe', definition: 'To explore something deeply to discover information', example: 'Auditors probe transactions to uncover unusual or suspicious activity.', phonetic: '/prəʊb/', synonyms: ['examine', 'delve', 'investigate', 'explore'] },
          { word: 'survey', definition: 'To gather opinions or data from many people', example: 'We will survey commuters to understand changes in travel habits.', phonetic: '/ˈsɜːveɪ/', synonyms: ['poll', 'canvass', 'sample', 'study'] }
        ],
        completed: false
      }
      ,
      {
        id: 23,
        title: 'Set 23',
        words: [
          { word: 'streamline', definition: 'To simplify a process for greater efficiency', example: 'They streamlined onboarding to reduce errors and shorten waiting times.', phonetic: '/ˈstriːmlaɪn/', synonyms: ['simplify', 'rationalize', 'optimize', 'trim'] },
          { word: 'automate', definition: 'To make a task operate by itself', example: 'The team automated billing to cut repetitive manual work.', phonetic: '/ˈɔːtəmeɪt/', synonyms: ['mechanize', 'computerize', 'systematize', 'robotize'] },
          { word: 'consolidate', definition: 'To combine separate parts into one stronger whole', example: 'They consolidated vendors to reduce costs and simplify support.', phonetic: '/kənˈsɒlɪdeɪt/', synonyms: ['merge', 'combine', 'unify', 'integrate'] },
          { word: 'standardize', definition: 'To make procedures consistent according to set rules', example: 'Schools standardized rubrics to ensure fair grading across classes.', phonetic: '/ˈstændədaɪz/', synonyms: ['normalize', 'regularize', 'codify', 'systematize'] },
          { word: 'iterate', definition: 'To repeat steps to improve each version', example: 'Designers iterate quickly after tests reveal specific usability issues.', phonetic: '/ˈɪtəreɪt/', synonyms: ['repeat', 'refine', 'cycle', 'improve'] }
        ],
        completed: false
      }
      ,
      {
        id: 24,
        title: 'Set 24',
        words: [
          { word: 'paraphrase', definition: 'To express the same meaning using different words', example: 'Please paraphrase sources rather than copying long sections directly.', phonetic: '/ˈpærəfreɪz/', synonyms: ['reword', 'restate', 'rephrase', 'put differently'] },
          { word: 'summarize', definition: 'To present main points briefly and clearly', example: 'Start by summarizing findings before discussing their implications further.', phonetic: '/ˈsʌməraɪz/', synonyms: ['outline', 'recap', 'condense', 'sum up'] },
          { word: 'elaborate', definition: 'To add detail to explain more fully', example: 'Could you elaborate on costs and timelines for deployment?', phonetic: '/ɪˈlæbəreɪt/', synonyms: ['expand', 'develop', 'detail', 'flesh out'] },
          { word: 'allude', definition: 'To refer indirectly without stating something directly', example: 'The speaker alluded to budget issues without naming departments.', phonetic: '/əˈluːd/', synonyms: ['hint', 'suggest', 'imply', 'refer indirectly'] },
          { word: 'reiterate', definition: 'To say something again for clarity', example: 'Let me reiterate the deadline so nobody misses it.', phonetic: '/riːˈɪtəreɪt/', synonyms: ['repeat', 'restate', 'say again', 'echo'] }
        ],
        completed: false
      }
      ,
      {
        id: 25,
        title: 'Set 25',
        words: [
          { word: 'authorize', definition: 'To officially permit or approve an action', example: 'The council authorized night work to repair the bridge safely.', phonetic: '/ˈɔːθəraɪz/', synonyms: ['permit', 'approve', 'sanction', 'empower'] },
          { word: 'prohibit', definition: 'To formally forbid an action by rule', example: 'Signs prohibit smoking anywhere inside the historic building.', phonetic: '/prəˈhɪbɪt/', synonyms: ['forbid', 'ban', 'bar', 'outlaw'] },
          { word: 'mandate', definition: 'To officially require that something be done', example: 'New rules mandate helmets for all electric scooter riders.', phonetic: '/ˈmændeɪt/', synonyms: ['require', 'order', 'decree', 'direct'] },
          { word: 'exempt', definition: 'To free someone from a required duty', example: 'Volunteers are exempt from fees when staffing public events.', phonetic: '/ɪɡˈzɛmpt/', synonyms: ['excuse', 'free', 'absolve', 'release'] },
          { word: 'waive', definition: 'To choose not to enforce a right', example: 'The bank waived fees after acknowledging the processing error.', phonetic: '/weɪv/', synonyms: ['forgo', 'relinquish', 'set aside', 'dispense with'] }
        ],
        completed: false
      }
      ,
      {
        id: 26,
        title: 'Set 26',
        words: [
          { word: 'invest', definition: 'To commit money to earn future returns', example: 'Households invest steadily in education during stable economic periods.', phonetic: '/ɪnˈvɛst/', synonyms: ['fund', 'finance', 'stake', 'commit'] },
          { word: 'divest', definition: 'To sell assets or withdraw from holdings', example: 'Firms divest divisions that no longer match strategy.', phonetic: '/daɪˈvɛst/', synonyms: ['sell off', 'dispose of', 'shed', 'unload'] },
          { word: 'procure', definition: 'To obtain needed goods or services', example: 'Hospitals procure supplies early to avoid seasonal shortages.', phonetic: '/prəˈkjʊə/', synonyms: ['obtain', 'acquire', 'secure', 'source'] },
          { word: 'reimburse', definition: 'To repay someone for incurred expenses', example: 'Please reimburse travel costs within seven working days.', phonetic: '/ˌriːɪmˈbɜːs/', synonyms: ['repay', 'refund', 'compensate', 'pay back'] },
          { word: 'hedge', definition: 'To reduce financial risk by balancing positions', example: 'Airlines hedge fuel costs to protect ticket prices from spikes.', phonetic: '/hɛdʒ/', synonyms: ['protect', 'insure', 'offset risk', 'buffer'] }
        ],
        completed: false
      }
      ,
      {
        id: 27,
        title: 'Set 27',
        words: [
          { word: 'deploy', definition: 'To put a system or resource into use', example: 'We deploy the new app after final security checks pass.', phonetic: '/dɪˈplɔɪ/', synonyms: ['launch', 'roll out', 'implement', 'release'] },
          { word: 'configure', definition: 'To set options so something works correctly', example: 'Please configure alerts to notify admins about critical errors.', phonetic: '/kənˈfɪɡjə/', synonyms: ['set up', 'arrange', 'tune', 'customize'] },
          { word: 'troubleshoot', definition: 'To find and fix problems in operation', example: 'Engineers troubleshoot reports by reproducing bugs on staging servers.', phonetic: '/ˈtrʌb(ə)lʃuːt/', synonyms: ['debug', 'diagnose', 'fix', 'resolve'] },
          { word: 'restore', definition: 'To return something to its previous state', example: 'We restored service quickly after the database cluster recovered.', phonetic: '/rɪˈstɔː/', synonyms: ['recover', 'reinstate', 'repair', 'revert'] },
          { word: 'synchronize', definition: 'To make things happen at the same time', example: 'Calendars synchronize across devices to prevent missed appointments everywhere.', phonetic: '/ˈsɪŋkrənaɪz/', synonyms: ['sync', 'align', 'coordinate', 'time'] }
        ],
        completed: false
      }
      ,
      {
        id: 28,
        title: 'Set 28',
        words: [
          { word: 'conserve', definition: 'To protect and use resources carefully to last', example: 'Farmers conserve water with sensors and targeted nighttime irrigation.', phonetic: '/kənˈsɜːv/', synonyms: ['save', 'preserve', 'protect', 'husband'] },
          { word: 'regulate', definition: 'To control activities through rules and oversight', example: 'Agencies regulate emissions to protect public health and ecosystems.', phonetic: '/ˈrɛɡjʊleɪt/', synonyms: ['control', 'govern', 'oversee', 'manage'] },
          { word: 'subsidize', definition: 'To support costs with money from authorities', example: 'Cities subsidize transit passes to reduce congestion and pollution.', phonetic: '/ˈsʌbsɪdaɪz/', synonyms: ['fund', 'finance', 'underwrite', 'support'] },
          { word: 'incentivize', definition: 'To encourage actions by offering benefits or rewards', example: 'Tax credits incentivize businesses to adopt energy-efficient technologies.', phonetic: '/ɪnˈsɛntɪvaɪz/', synonyms: ['motivate', 'encourage', 'spur', 'prompt'] },
          { word: 'restrict', definition: 'To limit what people can do legally', example: 'Authorities restrict traffic downtown during large public festivals.', phonetic: '/rɪˈstrɪkt/', synonyms: ['limit', 'curb', 'constrain', 'control'] }
        ],
        completed: false
      }
      ,
      {
        id: 29,
        title: 'Set 29',
        words: [
          { word: 'reassure', definition: 'To comfort someone and reduce their anxiety', example: 'Nurses reassure patients with clear explanations before difficult procedures.', phonetic: '/ˌriːəˈʃʊə/', synonyms: ['comfort', 'soothe', 'calm', 'encourage'] },
          { word: 'empathize', definition: 'To understand and share another person’s feelings', example: 'Good listeners empathize instead of offering immediate, unnecessary advice.', phonetic: '/ˈɛmpəθaɪz/', synonyms: ['understand', 'relate', 'sympathize', 'identify'] },
          { word: 'discourage', definition: 'To make someone less likely to try', example: 'Repeated criticism can discourage volunteers from returning next season.', phonetic: '/dɪsˈkʌrɪdʒ/', synonyms: ['deter', 'dishearten', 'put off', 'depress'] },
          { word: 'confront', definition: 'To face a difficult issue directly and firmly', example: 'Leaders confront problems early to prevent wider organizational damage.', phonetic: '/kənˈfrʌnt/', synonyms: ['face', 'tackle', 'challenge', 'address'] },
          { word: 'admire', definition: 'To respect and appreciate someone’s good qualities', example: 'Many admire athletes who balance success with humility and service.', phonetic: '/ədˈmaɪə/', synonyms: ['respect', 'esteem', 'appreciate', 'look up to'] }
        ],
        completed: false
      }
      ,
      {
        id: 30,
        title: 'Set 30',
        words: [
          { word: 'curate', definition: 'To select and organize content for an audience', example: 'Editors curate articles to balance depth, freshness, and readability.', phonetic: '/kjʊˈreɪt/', synonyms: ['select', 'organize', 'assemble', 'arrange'] },
          { word: 'moderate', definition: 'To manage discussion and keep it respectful', example: 'Hosts moderate panels by timing speakers and inviting balanced viewpoints.', phonetic: '/ˈmɒdəreɪt/', synonyms: ['chair', 'manage', 'facilitate', 'preside'] },
          { word: 'annotate', definition: 'To add notes that explain or comment', example: 'Reviewers annotate drafts to clarify terms and fix ambiguities.', phonetic: '/ˈænəteɪt/', synonyms: ['note', 'comment', 'gloss', 'remark'] },
          { word: 'broadcast', definition: 'To transmit information widely by media channels', example: 'Stations broadcast alerts quickly during storms to protect communities.', phonetic: '/ˈbrɔːdkɑːst/', synonyms: ['air', 'transmit', 'beam', 'telecast'] },
          { word: 'caption', definition: 'To add brief text describing an image', example: 'Designers caption photos clearly to aid accessibility and understanding.', phonetic: '/ˈkæpʃən/', synonyms: ['label', 'title', 'tag', 'subtitle'] }
        ],
        completed: false
      }
    ]
  },
  {
    id: 'advanced',
    name: 'Advanced',
    description: '125 Sets, 625 words at CEFR B2-C1 Level',
    cefr: 'B2-C1',
    icon: '🏔️',
    sets: [
      {
        id: 1,
        title: 'Set 1',
        words: [
          { word: 'extrapolate', definition: 'To infer unknown trends from limited data', example: 'Economists extrapolate demand using brief pilot program results.', phonetic: '/ɪkˈstræpəleɪt/', synonyms: ['infer', 'project', 'generalize', 'extend'] },
          { word: 'corroborate', definition: 'To support a claim with confirming evidence', example: 'Two independent trials corroborate the therapy’s reported success rate.', phonetic: '/kəˈrɒbəreɪt/', synonyms: ['confirm', 'validate', 'support', 'back up'] },
          { word: 'juxtapose', definition: 'To place differing things side by side', example: 'The essay juxtaposes policy ideals with messy real-world outcomes.', phonetic: '/ˈdʒʌkstəpəʊz/', synonyms: ['compare', 'set against', 'place alongside', 'contrast'] },
          { word: 'invalidate', definition: 'To show a reasoning or claim is unsound', example: 'A hidden sampling bias could invalidate last quarter’s bold conclusion.', phonetic: '/ˌɪnˈvælɪdeɪt/', synonyms: ['nullify', 'disprove', 'negate', 'rebut'] },
          { word: 'peruse', definition: 'To read something carefully and in detail', example: 'Please peruse the contract and flag unclear liability clauses.', phonetic: '/pəˈruːz/', synonyms: ['read carefully', 'scrutinize', 'examine', 'study'] }
        ],
        completed: false
      },
      {
        id: 2,
        title: 'Governance & Law Verbs',
        words: [
          { word: 'promulgate', definition: 'To officially announce a new rule publicly', example: 'The council will promulgate revised safety codes this week.', phonetic: '/ˈprɒməlɡeɪt/', synonyms: ['announce', 'proclaim', 'issue', 'publish'] },
          { word: 'adjudicate', definition: 'To judge a dispute and deliver a decision', example: 'An independent panel will adjudicate complaints from affected tenants.', phonetic: '/əˈdʒuːdɪkeɪt/', synonyms: ['judge', 'decide', 'rule', 'settle'] },
          { word: 'ratify', definition: 'To formally approve an agreement or decision', example: 'Member states must ratify the treaty before it activates.', phonetic: '/ˈrætɪfaɪ/', synonyms: ['approve', 'confirm', 'endorse', 'validate'] },
          { word: 'repeal', definition: 'To cancel a law through proper legal procedures', example: 'Legislators moved to repeal outdated licensing rules last session.', phonetic: '/rɪˈpiːl/', synonyms: ['revoke', 'annul', 'rescind', 'cancel'] },
          { word: 'legislate', definition: 'To make new laws through an elected body', example: 'Parliament will legislate on access rules for public data.', phonetic: '/ˈlɛdʒɪsleɪt/', synonyms: ['enact', 'make laws', 'pass laws', 'enact statutes'] }
        ],
        completed: false
      },
      {
        id: 3,
        title: 'Academic Writing Verbs',
        words: [
          { word: 'problematize', definition: 'To present something as an issue for questioning', example: 'The article problematizes "neutral data" using historical counterexamples.', phonetic: '/ˈprɒbləmətaɪz/', synonyms: ['question', 'challenge', 'complicate', 'interrogate'] },
          { word: 'contextualize', definition: 'To situate an idea within relevant circumstances', example: 'Good introductions contextualize findings before evaluating their impact.', phonetic: '/kənˈtɛkstjʊəlaɪz/', synonyms: ['situate', 'frame', 'place', 'locate'] },
          { word: 'synthesize', definition: 'To combine parts into a coherent new whole', example: 'The review synthesizes case studies into clear design principles.', phonetic: '/ˈsɪnθɪsaɪz/', synonyms: ['combine', 'integrate', 'fuse', 'amalgamate'] },
          { word: 'theorize', definition: 'To propose explanations without complete confirming evidence', example: 'Scholars theorize mechanisms, then test them with new data.', phonetic: '/ˈθɪəraɪz/', synonyms: ['hypothesize', 'speculate', 'postulate', 'suppose'] },
          { word: 'operationalize', definition: 'To define concepts for measurement and procedure', example: 'We operationalize "engagement" using time-on-task and question frequency.', phonetic: '/ˌɒpəˈreɪʃənəlaɪz/', synonyms: ['define', 'specify', 'make measurable', 'concretize'] }
        ],
        completed: false
      },
      {
        id: 4,
        title: 'Strategy & Change Verbs',
        words: [
          { word: 'recalibrate', definition: 'To adjust settings again for improved accuracy', example: 'After outliers, we recalibrated thresholds to reduce false alarms.', phonetic: '/ˌriːˈkælɪbreɪt/', synonyms: ['readjust', 'retune', 'realign', 'remeasure'] },
          { word: 'restructure', definition: 'To change an organization’s shape and internal relationships', example: 'The publisher will restructure teams to speed review cycles.', phonetic: '/riːˈstrʌktʃə/', synonyms: ['reorganize', 'overhaul', 'reshape', 'realign'] },
          { word: 'reorient', definition: 'To change direction or focus toward something else', example: 'We reoriented funding toward prevention rather than late interventions.', phonetic: '/riːˈɔːrɪənt/', synonyms: ['redirect', 'refocus', 'shift', 'realign'] },
          { word: 'deprioritize', definition: 'To give something lower priority than before', example: 'We deprioritized minor bugs to ship accessibility improvements earlier.', phonetic: '/ˌdiːpraɪˈɒrɪtaɪz/', synonyms: ['downgrade', 'delay', 'back-burner', 'defocus'] },
          { word: 'institutionalize', definition: 'To embed a practice formally within established systems', example: 'The university institutionalized mentoring through credited teaching hours.', phonetic: '/ˌɪnstɪˈtjuːʃənəlaɪz/', synonyms: ['formalize', 'embed', 'entrench', 'establish'] }
        ],
        completed: false
      },
      {
        id: 5,
        title: 'Nuance & Tone Verbs',
        words: [
          { word: 'equivocate', definition: 'To avoid clarity by speaking vaguely or ambiguously', example: 'Witnesses equivocated when timelines conflicted with earlier statements.', phonetic: '/ɪˈkwɪvəkeɪt/', synonyms: ['prevaricate', 'be vague', 'waffle', 'dodge'] },
          { word: 'cajole', definition: 'To persuade gently through praise or flattery', example: 'She cajoled the team into one final rehearsal tonight.', phonetic: '/kəˈdʒəʊl/', synonyms: ['coax', 'sweet-talk', 'wheedle', 'persuade'] },
          { word: 'castigate', definition: 'To criticize someone severely for their actions', example: 'Commentators castigated the committee for ignoring early warnings.', phonetic: '/ˈkæstɪɡeɪt/', synonyms: ['berate', 'reprimand', 'rebuke', 'lambaste'] },
          { word: 'lionize', definition: 'To praise someone publicly as especially important', example: 'Critics lionized the actor after the daring stage performance.', phonetic: '/ˈlaɪənaɪz/', synonyms: ['glorify', 'celebrate', 'exalt', 'idolize'] },
          { word: 'denigrate', definition: 'To unfairly disparage someone’s reputation or achievements', example: 'The ad denigrated rivals instead of explaining concrete benefits.', phonetic: '/ˈdɛnɪɡreɪt/', synonyms: ['belittle', 'disparage', 'deprecate', 'run down'] }
        ],
        completed: false
      },
      {
        id: 6,
        title: 'Evidence & Clarity Verbs',
        words: [
          { word: 'refute', definition: 'To prove a statement or theory false', example: 'The meta-analysis refuted claims of a dramatic benefit.', phonetic: '/rɪˈfjuːt/', synonyms: ['disprove', 'rebut', 'confute', 'invalidate'] },
          { word: 'adduce', definition: 'To cite evidence to support an argument', example: 'She adduced two trials to justify the recommendation.', phonetic: '/əˈdjuːs/', synonyms: ['cite', 'present', 'offer', 'introduce'] },
          { word: 'elucidate', definition: 'To make something clear by thorough explanation', example: 'The appendix elucidates edge cases with short scenarios.', phonetic: '/ɪˈluːsɪdeɪt/', synonyms: ['clarify', 'explain', 'illuminate', 'shed light'] },
          { word: 'delineate', definition: 'To describe something precisely and in detail', example: 'The charter delineates roles, timelines, and escalation paths.', phonetic: '/dɪˈlɪnɪeɪt/', synonyms: ['outline', 'sketch', 'map out', 'portray'] },
          { word: 'distill', definition: 'To extract essential meaning from complex material', example: 'The brief distills eighty pages into four principles.', phonetic: '/dɪˈstɪl/', synonyms: ['extract', 'condense', 'boil down', 'abstract'] }
        ],
        completed: false
      },
      {
        id: 7,
        title: 'Deals & Agreements Verbs',
        words: [
          { word: 'stipulate', definition: 'To specify a requirement in a contract', example: 'The license stipulates attribution on all public displays.', phonetic: '/ˈstɪpjʊleɪt/', synonyms: ['specify', 'require', 'set out', 'prescribe'] },
          { word: 'broker', definition: 'To arrange a deal between opposing parties', example: 'A mediator brokered peace after months of stalled talks.', phonetic: '/ˈbrəʊkə/', synonyms: ['arrange', 'mediate', 'negotiate', 'facilitate'] },
          { word: 'concede', definition: 'To admit something after initially resisting', example: 'The minister conceded errors and promised immediate fixes.', phonetic: '/kənˈsiːd/', synonyms: ['admit', 'yield', 'acknowledge', 'grant'] },
          { word: 'renegotiate', definition: 'To discuss terms again to change agreement', example: 'We’ll renegotiate the timeline if suppliers miss milestones.', phonetic: '/ˌriːnɪˈɡəʊʃieɪt/', synonyms: ['revisit', 'revise', 'rework', 'reopen'] },
          { word: 'underwrite', definition: 'To guarantee financial risk for a fee', example: 'Banks underwrote the issue to ensure full subscription.', phonetic: '/ˈʌndəraɪt/', synonyms: ['guarantee', 'insure', 'back', 'sponsor'] }
        ],
        completed: false
      },
      {
        id: 8,
        title: 'Research Methods Verbs',
        words: [
          { word: 'randomize', definition: 'To arrange without pattern using random selection', example: 'Trials randomized participants to minimize allocation bias.', phonetic: '/ˈrændəmaɪz/', synonyms: ['shuffle', 'permute', 'mix up', 'rearrange'] },
          { word: 'replicate', definition: 'To copy an experiment exactly for verification', example: 'Several labs replicated the results under stricter controls.', phonetic: '/ˈrɛplɪkeɪt/', synonyms: ['duplicate', 'reproduce', 'copy', 'redo'] },
          { word: 'interpolate', definition: 'To estimate values between known data points', example: 'We interpolated missing days using cubic splines.', phonetic: '/ɪnˈtɜːpəleɪt/', synonyms: ['estimate', 'infer', 'insert', 'compute'] },
          { word: 'partition', definition: 'To divide something into distinct separate parts', example: 'The dataset was partitioned into train, validation, test.', phonetic: '/pɑːˈtɪʃən/', synonyms: ['divide', 'split', 'segment', 'section'] },
          { word: 'assay', definition: 'To test a substance’s composition or activity', example: 'Each sample was assayed for enzymes within an hour.', phonetic: '/ˈæseɪ/', synonyms: ['test', 'evaluate', 'analyze', 'measure'] }
        ],
        completed: false
      },
      {
        id: 9,
        title: 'Text Ethics & Editing Verbs',
        words: [
          { word: 'satirize', definition: 'To criticize using humor, irony, or exaggeration', example: 'The sketch satirized corruption without naming specific officials.', phonetic: '/ˈsætɪraɪz/', synonyms: ['mock', 'ridicule', 'parody', 'send up'] },
          { word: 'lampoon', definition: 'To mock a person publicly with ridicule', example: 'The column lampooned officials for tone-deaf responses.', phonetic: '/læmˈpuːn/', synonyms: ['mock', 'ridicule', 'tease', 'roast'] },
          { word: 'plagiarize', definition: 'To use others’ work without proper credit', example: 'The journal retracted papers that plagiarized earlier studies.', phonetic: '/ˈpleɪdʒəraɪz/', synonyms: ['copy', 'steal', 'appropriate', 'pass off'] },
          { word: 'redact', definition: 'To edit text by removing sensitive information', example: 'The report redacted names to protect minor witnesses.', phonetic: '/rɪˈdækt/', synonyms: ['censor', 'edit', 'black out', 'delete'] },
          { word: 'expurgate', definition: 'To remove offensive parts from a text', example: 'The edition expurgated slurs while preserving historical context.', phonetic: '/ˈekspəˌɡeɪt/', synonyms: ['censor', 'bowdlerize', 'purge', 'cut'] }
        ],
        completed: false
      },
      {
        id: 10,
        title: 'Tech Infrastructure & Privacy Verbs',
        words: [
          { word: 'deprecate', definition: 'To discourage use by marking something as obsolete', example: 'The API version was deprecated after the security update.', phonetic: '/ˈdɛprɪkeɪt/', synonyms: ['discourage', 'phase out', 'mark obsolete', 'disfavor'] },
          { word: 'sandbox', definition: 'To isolate code in a safe environment', example: 'Run untrusted plugins sandboxed to prevent data access.', phonetic: '/ˈsændbɒks/', synonyms: ['isolate', 'contain', 'confine', 'quarantine'] },
          { word: 'throttle', definition: 'To limit rate of requests or actions', example: 'The proxy throttles bursts to protect downstream services.', phonetic: '/ˈθrɒtl/', synonyms: ['limit', 'slow', 'restrict', 'cap'] },
          { word: 'obfuscate', definition: 'To make something hard to understand deliberately', example: 'They obfuscated keys in logs to deter scraping.', phonetic: '/ˈɒbfʌskeɪt/', synonyms: ['obscure', 'confuse', 'muddy', 'cloud'] },
          { word: 'anonymize', definition: 'To remove personal identifiers from collected data', example: 'Pipelines anonymize records before any external sharing.', phonetic: '/əˈnɒnɪmaɪz/', synonyms: ['de-identify', 'mask', 'strip identifiers', 'pseudonymize'] }
        ],
        completed: false
      },
      {
        id: 11,
        title: 'Logic & Argument Verbs',
        words: [
          { word: 'substantiate', definition: 'To provide evidence that firmly supports claims', example: 'The authors substantiate their model with multi-year field data.', phonetic: '/səbˈstænʃieɪt/', synonyms: ['validate', 'support', 'back up', 'corroborate'] },
          { word: 'rebut', definition: 'To argue against and try to disprove', example: 'In the reply, they rebut the main statistical objections.', phonetic: '/rɪˈbʌt/', synonyms: ['refute', 'counter', 'disprove', 'contradict'] },
          { word: 'explicate', definition: 'To explain something carefully, in full detail', example: 'Appendices explicate boundary cases with worked numerical examples.', phonetic: '/ˈɛksplɪkeɪt/', synonyms: ['clarify', 'elucidate', 'explain', 'unpack'] },
          { word: 'construe', definition: 'To interpret the meaning of words or actions', example: 'Courts construe ambiguous clauses against the party drafting them.', phonetic: '/kənˈstruː/', synonyms: ['interpret', 'read', 'parse', 'understand'] },
          { word: 'adumbrate', definition: 'To outline briefly, sometimes foreshadowing later developments', example: 'The preface adumbrates themes explored in greater depth later.', phonetic: '/ˈædʌmbreɪt/', synonyms: ['outline', 'sketch', 'foreshadow', 'prefigure'] }
        ],
        completed: false
      },
      {
        id: 12,
        title: 'Finance & Markets Verbs',
        words: [
          { word: 'amortize', definition: 'To pay off debt gradually over time', example: 'We amortize equipment costs across three predictable fiscal years.', phonetic: '/ˈæmətaɪz/', synonyms: ['pay down', 'retire debt', 'reduce balance', 'write off'] },
          { word: 'securitize', definition: 'To pool assets and issue tradeable securities', example: 'Banks securitize mortgages to free balance-sheet capacity.', phonetic: '/sɪˈkjʊərɪtaɪz/', synonyms: ['package', 'collateralize', 'structure', 'pool'] },
          { word: 'deleverage', definition: 'To reduce overall debt to lower risk', example: 'After the acquisition, the company deleveraged using excess cash.', phonetic: '/diːˈlɛvərɪdʒ/', synonyms: ['reduce debt', 'degear', 'pare down', 'de-risk'] },
          { word: 'arbitrage', definition: 'To exploit price differences through synchronized trades', example: 'Funds arbitrage small mispricings across related index products.', phonetic: '/ˈɑːbɪtrɑːʒ/', synonyms: ['spread trade', 'exploit mispricing', 'long–short', 'pair trade'] },
          { word: 'liquidate', definition: 'To sell assets and close operations formally', example: 'The trustee liquidated inventory to satisfy senior creditors.', phonetic: '/ˈlɪkɪdeɪt/', synonyms: ['wind up', 'sell off', 'cash out', 'dissolve'] }
        ],
        completed: false
      },
      {
        id: 13,
        title: 'Law & Procedure Verbs',
        words: [
          { word: 'enjoin', definition: 'To legally prohibit or command by injunction', example: 'The court enjoined the agency from enforcing the rule.', phonetic: '/ɛnˈdʒɔɪn/', synonyms: ['prohibit', 'forbid', 'order', 'command'] },
          { word: 'indict', definition: 'To formally accuse someone of a crime', example: 'A grand jury indicted the executives on several counts.', phonetic: '/ɪnˈdaɪt/', synonyms: ['charge', 'accuse', 'present', 'file against'] },
          { word: 'arraign', definition: 'To bring accused before court to answer', example: 'The defendant was arraigned this morning in district court.', phonetic: '/əˈreɪn/', synonyms: ['bring before', 'charge in court', 'cite', 'summon'] },
          { word: 'exonerate', definition: 'To officially clear someone of alleged wrongdoing', example: 'DNA evidence exonerated the man after twenty difficult years.', phonetic: '/ɪɡˈzɒnəreɪt/', synonyms: ['absolve', 'clear', 'acquit', 'vindicate'] },
          { word: 'mitigate', definition: 'To make a harm or penalty less severe', example: 'Strong compliance programs can mitigate penalties after violations.', phonetic: '/ˈmɪtɪɡeɪt/', synonyms: ['lessen', 'reduce', 'alleviate', 'soften'] }
        ],
        completed: false
      },
      {
        id: 14,
        title: 'Rhetoric & Emphasis Verbs',
        words: [
          { word: 'amplify', definition: 'To increase impact or volume of something', example: 'Clear visuals amplify key points without extra text.', phonetic: '/ˈæmplɪfaɪ/', synonyms: ['boost', 'magnify', 'strengthen', 'heighten'] },
          { word: 'foreground', definition: 'To give prominent attention to something important', example: 'The report foregrounds equity alongside efficiency and growth.', phonetic: '/ˈfɔːɡraʊnd/', synonyms: ['highlight', 'feature', 'spotlight', 'emphasize'] },
          { word: 'attenuate', definition: 'To reduce intensity, effect, or signal strength', example: 'Filters attenuate background noise in open-plan offices.', phonetic: '/əˈtɛnjʊeɪt/', synonyms: ['weaken', 'dilute', 'diminish', 'soften'] },
          { word: 'undercut', definition: 'To weaken a position by indirect means', example: 'Inconsistent examples undercut the paper’s central thesis.', phonetic: '/ˌʌndəˈkʌt/', synonyms: ['undermine', 'sap', 'erode', 'compromise'] },
          { word: 'reify', definition: 'To treat an abstract idea as concrete', example: 'Dashboards can reify priorities that deserve periodic debate.', phonetic: '/ˈriːɪfaɪ/', synonyms: ['concretize', 'embody', 'materialize', 'objectify'] }
        ],
        completed: false
      },
      {
        id: 15,
        title: 'Science & Causality Verbs',
        words: [
          { word: 'catalyze', definition: 'To speed a reaction by lowering barriers', example: 'Enzymes catalyze steps that otherwise proceed extremely slowly.', phonetic: '/ˈkætəlaɪz/', synonyms: ['accelerate', 'speed up', 'promote', 'drive'] },
          { word: 'inhibit', definition: 'To slow, prevent, or restrain a process', example: 'Certain salts inhibit corrosion on marine structures.', phonetic: '/ɪnˈhɪbɪt/', synonyms: ['hinder', 'suppress', 'check', 'restrain'] },
          { word: 'precipitate', definition: 'To cause something to happen suddenly', example: 'Poor communication precipitated a rapid loss of stakeholder trust.', phonetic: '/prɪˈsɪpɪteɪt/', synonyms: ['trigger', 'spark', 'induce', 'provoke'] },
          { word: 'modulate', definition: 'To adjust level or pattern in response', example: 'Cells modulate signaling strength to match external conditions.', phonetic: '/ˈmɒdjʊleɪt/', synonyms: ['adjust', 'tune', 'regulate', 'vary'] },
          { word: 'differentiate', definition: 'To recognize clear distinctions between similar things', example: 'The rubric differentiates minor lapses from serious violations.', phonetic: '/ˌdɪfəˈrɛnʃieɪt/', synonyms: ['distinguish', 'separate', 'tell apart', 'discriminate'] }
        ],
        completed: false
      },
      {
        id: 16,
        title: 'Constraints & Effects Verbs',
        words: [
          { word: 'preclude', definition: 'To prevent something from happening by conditions', example: 'Missing audits may preclude certification during the current renewal window.', phonetic: '/prɪˈkluːd/', synonyms: ['prevent', 'bar', 'rule out', 'forestall'] },
          { word: 'obviate', definition: 'To remove need by making unnecessary', example: 'Cloud backups obviate nightly manual exports across departments.', phonetic: '/ˈɒbvɪeɪt/', synonyms: ['remove', 'eliminate', 'avert', 'preempt'] },
          { word: 'circumscribe', definition: 'To limit something within clearly defined boundaries', example: 'The charter circumscribes committee powers during interim leadership periods.', phonetic: '/ˌsɜːkəmˈskraɪb/', synonyms: ['limit', 'restrict', 'confine', 'delimit'] },
          { word: 'exacerbate', definition: 'To make a bad situation significantly worse', example: 'Cutting training budgets may exacerbate already high turnover.', phonetic: '/ɪɡˈzæsəbeɪt/', synonyms: ['worsen', 'aggravate', 'intensify', 'amplify'] },
          { word: 'constrain', definition: 'To force limits on actions or choices', example: 'Legacy contracts constrain pricing flexibility across several regions.', phonetic: '/kənˈstreɪn/', synonyms: ['restrict', 'limit', 'curb', 'restrain'] }
        ],
        completed: false
      },
      {
        id: 17,
        title: 'Claims & Signals Verbs',
        words: [
          { word: 'evince', definition: 'To clearly show a quality or feeling', example: 'The notes evince patience despite repeated schedule changes.', phonetic: '/ɪˈvɪns/', synonyms: ['display', 'manifest', 'show', 'reveal'] },
          { word: 'aver', definition: 'To state firmly that something is true', example: 'The chair averred the figures matched audited statements.', phonetic: '/əˈvɜː/', synonyms: ['assert', 'maintain', 'claim', 'affirm'] },
          { word: 'allege', definition: 'To claim without full proof or evidence', example: 'Critics alleged bias before reviewing the full dataset.', phonetic: '/əˈlɛdʒ/', synonyms: ['claim', 'contend', 'assert', 'purport'] },
          { word: 'contradict', definition: 'To assert the opposite of another statement', example: 'Later emails contradict the timeline described on record.', phonetic: '/ˌkɒntrəˈdɪkt/', synonyms: ['counter', 'oppose', 'dispute', 'gainsay'] },
          { word: 'bolster', definition: 'To support or strengthen an existing position', example: 'External audits bolster trust with long-term donors and partners.', phonetic: '/ˈbəʊlstə/', synonyms: ['support', 'strengthen', 'reinforce', 'shore up'] }
        ],
        completed: false
      },
      {
        id: 18,
        title: 'Law & Policy II Verbs',
        words: [
          { word: 'abrogate', definition: 'To repeal or cancel a formal agreement', example: 'The new statute abrogated several outdated bilateral treaties.', phonetic: '/ˈæbrəɡeɪt/', synonyms: ['repeal', 'rescind', 'annul', 'revoke'] },
          { word: 'proscribe', definition: 'To officially forbid something by formal rule', example: 'Regulations proscribe data sharing without explicit consent.', phonetic: '/prəʊˈskraɪb/', synonyms: ['forbid', 'ban', 'prohibit', 'bar'] },
          { word: 'codify', definition: 'To arrange rules systematically into written form', example: 'The policy team codified unwritten practices after audits.', phonetic: '/ˈkəʊdɪfaɪ/', synonyms: ['systematize', 'formalize', 'arrange', 'organize'] },
          { word: 'entrench', definition: 'To establish firmly so change becomes difficult', example: 'Automatic renewals entrenched inefficient processes for years.', phonetic: '/ɪnˈtrɛntʃ/', synonyms: ['embed', 'root', 'establish', 'cement'] },
          { word: 'harmonize', definition: 'To make different parts work together smoothly', example: 'Agencies harmonized standards to simplify cross-border reporting.', phonetic: '/ˈhɑːmənaɪz/', synonyms: ['align', 'coordinate', 'reconcile', 'integrate'] }
        ],
        completed: false
      },
      {
        id: 19,
        title: 'Mind & Social Dynamics Verbs',
        words: [
          { word: 'disabuse', definition: 'To correct someone’s false belief or impression', example: 'The briefing disabused managers of myths about productivity.', phonetic: '/ˌdɪsəˈbjuːz/', synonyms: ['correct', 'enlighten', 'set straight', 'debunk'] },
          { word: 'mollify', definition: 'To calm someone’s anger by gentle actions', example: 'A prompt apology mollified customers after the outage.', phonetic: '/ˈmɒlɪfaɪ/', synonyms: ['soothe', 'appease', 'pacify', 'calm'] },
          { word: 'aggrandize', definition: 'To increase power, status, or importance dramatically', example: 'The campaign aggrandized minor wins with flashy headlines.', phonetic: '/əˈɡræn.daɪz/', synonyms: ['elevate', 'amplify', 'exalt', 'magnify'] },
          { word: 'ostracize', definition: 'To exclude someone from a group deliberately', example: 'Teams ostracized whistleblowers until policies changed leadership culture.', phonetic: '/ˈɒstrəsaɪz/', synonyms: ['exclude', 'shun', 'banish', 'blacklist'] },
          { word: 'ruminate', definition: 'To think deeply about something for long', example: 'She ruminated overnight before committing resources.', phonetic: '/ˈruːmɪneɪt/', synonyms: ['ponder', 'mull', 'reflect', 'brood'] }
        ],
        completed: false
      },
      {
        id: 20,
        title: 'Data & Method II Verbs',
        words: [
          { word: 'triangulate', definition: 'To confirm findings using multiple independent sources', example: 'We triangulated survey trends with logs and interviews.', phonetic: '/traɪˈæŋɡjʊleɪt/', synonyms: ['cross-check', 'verify', 'validate', 'corroborate'] },
          { word: 'normalize', definition: 'To scale data to comparable standard ranges', example: 'Please normalize metrics before plotting quarterly comparisons.', phonetic: '/ˈnɔːməlaɪz/', synonyms: ['standardize', 'scale', 'regularize', 'rescale'] },
          { word: 'impute', definition: 'To assign missing values using reasonable estimates', example: 'Analysts imputed absent fields using model-based techniques.', phonetic: '/ɪmˈpjuːt/', synonyms: ['assign', 'ascribe', 'estimate', 'infer'] },
          { word: 'conflate', definition: 'To mistakenly combine distinct things into one', example: 'The memo conflated correlation and causation throughout.', phonetic: '/kənˈfleɪt/', synonyms: ['confuse', 'merge', 'collapse', 'blend'] },
          { word: 'curate', definition: 'To select and organize content with expert judgment', example: 'Editors curated sources relevant to beginners and specialists.', phonetic: '/kjʊəˈreɪt/', synonyms: ['select', 'organize', 'arrange', 'assemble'] }
        ],
        completed: false
      }
    ]
  },
  {
    id: 'advanced-plus',
    name: 'Advanced Plus',
    description: '150 Sets, 750 words at CEFR C1+ Level',
    cefr: 'C1+',
    icon: '⛰️',
    sets: [
      {
        id: 1,
        title: 'Set 1',
        words: [
          { word: 'paradigm', definition: 'A typical example or pattern', example: 'This represents a new paradigm', phonetic: '/ˈpærədaɪm/', synonyms: ['model', 'framework'] },
          { word: 'ephemeral', definition: 'Lasting for a very short time', example: 'Beauty is often ephemeral', phonetic: '/ɪˈfemərəl/', synonyms: ['temporary', 'transient'] },
          { word: 'ubiquitous', definition: 'Present everywhere', example: 'Technology is ubiquitous', phonetic: '/juːˈbɪkwɪtəs/', synonyms: ['omnipresent', 'universal'] },
          { word: 'meticulous', definition: 'Very careful and precise', example: 'She is meticulous in her work', phonetic: '/məˈtɪkjələs/', synonyms: ['thorough', 'precise'] },
          { word: 'resilient', definition: 'Able to recover quickly', example: 'The economy is resilient', phonetic: '/rɪˈzɪliənt/', synonyms: ['tough', 'flexible'] }
        ],
        completed: false
      }
    ]
  },
  {
    id: 'proficient',
    name: 'Proficient',
    description: '200 Sets, 1000 words at CEFR C2 Level',
    cefr: 'C2',
    icon: '🏔️',
    sets: [
      {
        id: 1,
        title: 'Set 1',
        words: [
          { word: 'serendipitous', definition: 'Occurring by happy chance', example: 'It was a serendipitous meeting', phonetic: '/ˌserənˈdɪpɪtəs/', synonyms: ['fortuitous', 'lucky'] },
          { word: 'perspicacious', definition: 'Having keen insight', example: 'He is a perspicacious observer', phonetic: '/ˌpɜːrspɪˈkeɪʃəs/', synonyms: ['perceptive', 'astute'] },
          { word: 'magnanimous', definition: 'Very generous and forgiving', example: 'She was magnanimous in victory', phonetic: '/mæɡˈnænɪməs/', synonyms: ['generous', 'noble'] },
          { word: 'ubiquitous', definition: 'Present everywhere', example: 'The concept is ubiquitous', phonetic: '/juːˈbɪkwɪtəs/', synonyms: ['omnipresent', 'universal'] },
          { word: 'ephemeral', definition: 'Lasting for a very short time', example: 'Fame can be ephemeral', phonetic: '/ɪˈfemərəl/', synonyms: ['temporary', 'transient'] }
        ],
        completed: false
      }
    ]
  }
];

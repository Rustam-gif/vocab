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
        title: 'Daily Routines & Habits',
        words: [
          { word: 'wake up', definition: 'To stop sleeping and become awake', example: 'I usually wake up at 7 a.m.', phonetic: '/weɪk ʌp/', synonyms: ['get up', 'arise'] },
          { word: 'eat', definition: 'To put food in your mouth and swallow it', example: 'They eat breakfast together every morning.', phonetic: '/iːt/', synonyms: ['consume', 'have a meal'] },
          { word: 'study', definition: 'To learn something by reading or practicing', example: 'She studies English every evening.', phonetic: '/ˈstʌdi/', synonyms: ['learn', 'practice'] },
          { word: 'exercise', definition: 'To move your body to stay strong and healthy', example: 'He exercises three times a week at the gym.', phonetic: '/ˈeksərsaɪz/', synonyms: ['work out', 'train'] },
          { word: 'sleep', definition: 'To rest your body with your eyes closed', example: 'Children should sleep at least nine hours.', phonetic: '/sliːp/', synonyms: ['rest', 'slumber'] }
        ],
        completed: true
      },
      {
        id: 2,
        title: 'Basic Needs & Family',
        words: [
          { word: 'water', definition: 'A clear liquid', example: 'I drink water daily', phonetic: '/ˈwɔːtər/', synonyms: ['liquid', 'H2O'] },
          { word: 'food', definition: 'Something you eat', example: 'The food is delicious', phonetic: '/fuːd/', synonyms: ['meal', 'nourishment'] },
          { word: 'house', definition: 'A building to live in', example: 'My house is big', phonetic: '/haʊs/', synonyms: ['home', 'dwelling'] },
          { word: 'family', definition: 'People related to you', example: 'I love my family', phonetic: '/ˈfæməli/', synonyms: ['relatives', 'kin'] },
          { word: 'friend', definition: 'Someone you like', example: 'She is my friend', phonetic: '/frend/', synonyms: ['buddy', 'companion'] }
        ],
        completed: false,
        inProgress: true
      },
      {
        id: 'quiz1',
        title: 'Quiz 1',
        type: 'quiz',
        description: 'A quick recap of sets 1 & 2',
        completed: false
      },
      {
        id: 3,
        title: 'Education & Work',
        words: [
          { word: 'school', definition: 'A place to learn', example: 'I go to school every day', phonetic: '/skuːl/', synonyms: ['education', 'academy'] },
          { word: 'work', definition: 'Activity to earn money', example: 'I work at an office', phonetic: '/wɜːrk/', synonyms: ['job', 'employment'] },
          { word: 'play', definition: 'To have fun', example: 'Children like to play', phonetic: '/pleɪ/', synonyms: ['game', 'entertainment'] },
          { word: 'learn', definition: 'To gain knowledge', example: 'I learn new things', phonetic: '/lɜːrn/', synonyms: ['study', 'acquire'] },
          { word: 'help', definition: 'To assist someone', example: 'Can you help me?', phonetic: '/help/', synonyms: ['assist', 'aid'] }
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
          { word: 'achieve', definition: 'To successfully complete', example: 'She achieved her goals', phonetic: '/əˈtʃiːv/', synonyms: ['accomplish', 'attain'] },
          { word: 'develop', definition: 'To grow or improve', example: 'The company developed rapidly', phonetic: '/dɪˈveləp/', synonyms: ['evolve', 'progress'] },
          { word: 'establish', definition: 'To create or set up', example: 'They established a new business', phonetic: '/ɪˈstæblɪʃ/', synonyms: ['found', 'create'] },
          { word: 'maintain', definition: 'To keep in good condition', example: 'We maintain our equipment', phonetic: '/meɪnˈteɪn/', synonyms: ['preserve', 'sustain'] },
          { word: 'obtain', definition: 'To get or acquire', example: 'He obtained a degree', phonetic: '/əbˈteɪn/', synonyms: ['acquire', 'gain'] }
        ],
        completed: true
      },
      {
        id: 2,
        title: 'Set 2',
        words: [
          { word: 'analyze', definition: 'To examine in detail', example: 'Scientists analyze data', phonetic: '/ˈænəlaɪz/', synonyms: ['examine', 'study'] },
          { word: 'compare', definition: 'To look at similarities', example: 'Let me compare the options', phonetic: '/kəmˈper/', synonyms: ['contrast', 'evaluate'] },
          { word: 'demonstrate', definition: 'To show clearly', example: 'He demonstrated the process', phonetic: '/ˈdemənstreɪt/', synonyms: ['show', 'prove'] },
          { word: 'evaluate', definition: 'To assess or judge', example: 'Teachers evaluate students', phonetic: '/ɪˈvæljueɪt/', synonyms: ['assess', 'judge'] },
          { word: 'identify', definition: 'To recognize or name', example: 'Can you identify the problem?', phonetic: '/aɪˈdentɪfaɪ/', synonyms: ['recognize', 'distinguish'] }
        ],
        completed: false,
        inProgress: true
      },
      {
        id: 'quiz1',
        title: 'Quiz 1',
        type: 'quiz',
        description: 'A quick recap of sets 1 & 2',
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
          { word: 'adopt', definition: 'To take up or start using', example: 'The company adopted new technology', phonetic: '/əˈdɒpt/', synonyms: ['embrace', 'implement'] },
          { word: 'interpret', definition: 'To explain the meaning', example: 'How do you interpret this data?', phonetic: '/ɪnˈtɜːrprɪt/', synonyms: ['explain', 'understand'] },
          { word: 'accuse', definition: 'To charge with wrongdoing', example: 'They accused him of theft', phonetic: '/əˈkjuːz/', synonyms: ['blame', 'charge'] },
          { word: 'conduct', definition: 'To carry out or direct', example: 'She conducted the meeting', phonetic: '/kənˈdʌkt/', synonyms: ['manage', 'direct'] },
          { word: 'handle', definition: 'To deal with or manage', example: 'Can you handle this situation?', phonetic: '/ˈhændl/', synonyms: ['manage', 'deal with'] }
        ],
        completed: true
      },
      {
        id: 2,
        title: 'Set 2',
        words: [
          { word: 'preserve', definition: 'To maintain in original state', example: 'We must preserve the environment', phonetic: '/prɪˈzɜːrv/', synonyms: ['conserve', 'maintain'] },
          { word: 'reduce', definition: 'To make smaller or less', example: 'We need to reduce costs', phonetic: '/rɪˈduːs/', synonyms: ['decrease', 'diminish'] },
          { word: 'emit', definition: 'To send out or give off', example: 'The factory emits pollution', phonetic: '/ɪˈmɪt/', synonyms: ['release', 'discharge'] },
          { word: 'pollute', definition: 'To make dirty or harmful', example: 'Cars pollute the air', phonetic: '/pəˈluːt/', synonyms: ['contaminate', 'dirty'] },
          { word: 'dispose', definition: 'To get rid of', example: 'How do we dispose of waste?', phonetic: '/dɪˈspoʊz/', synonyms: ['discard', 'eliminate'] }
        ],
        completed: false,
        inProgress: true
      },
      {
        id: 'quiz1',
        title: 'Quiz 1',
        type: 'quiz',
        description: 'A quick recap of sets 1 & 2',
        completed: false
      },
      {
        id: 3,
        title: 'Set 3',
        words: [
          { word: 'loan', definition: 'Money borrowed', example: 'I need a loan for the house', phonetic: '/loʊn/', synonyms: ['credit', 'advance'] },
          { word: 'discount', definition: 'A reduction in price', example: 'There is a 20% discount', phonetic: '/ˈdɪskaʊnt/', synonyms: ['reduction', 'saving'] },
          { word: 'purchase', definition: 'To buy something', example: 'I want to purchase a car', phonetic: '/ˈpɜːrtʃəs/', synonyms: ['buy', 'acquire'] },
          { word: 'wealth', definition: 'Large amount of money', example: 'He accumulated great wealth', phonetic: '/welθ/', synonyms: ['riches', 'fortune'] },
          { word: 'revenue', definition: 'Income from business', example: 'Company revenue increased', phonetic: '/ˈrevənuː/', synonyms: ['income', 'earnings'] }
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
          { word: 'sophisticated', definition: 'Complex and refined', example: 'This is a sophisticated system', phonetic: '/səˈfɪstɪkeɪtɪd/', synonyms: ['advanced', 'complex'] },
          { word: 'comprehensive', definition: 'Including everything', example: 'We need a comprehensive plan', phonetic: '/ˌkɒmprɪˈhensɪv/', synonyms: ['complete', 'thorough'] },
          { word: 'substantial', definition: 'Large in amount', example: 'There was substantial progress', phonetic: '/səbˈstænʃl/', synonyms: ['significant', 'considerable'] },
          { word: 'inevitable', definition: 'Certain to happen', example: 'Change is inevitable', phonetic: '/ɪˈnevɪtəbl/', synonyms: ['unavoidable', 'certain'] },
          { word: 'inevitable', definition: 'Certain to happen', example: 'Change is inevitable', phonetic: '/ɪˈnevɪtəbl/', synonyms: ['unavoidable', 'certain'] }
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

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
          { word: 'home', definition: 'The place where you live with your family', example: 'I live in a small home with my parents.', phonetic: '/hoʊm/', synonyms: ['house', 'place'] },
          { word: 'food', definition: 'Things you eat to stay healthy and strong', example: 'We eat good food every day at breakfast.', phonetic: '/fuːd/', synonyms: ['meal', 'eating'] },
          { word: 'brother', definition: 'A boy or man who has the same parents as you', example: 'My brother is five years old and likes to play.', phonetic: '/ˈbrʌðər/', synonyms: ['sibling', 'family'] },
          { word: 'family', definition: 'Your mother, father, brothers, sisters, and other close people', example: 'I love my family and we eat together every evening.', phonetic: '/ˈfæməli/', synonyms: ['relatives', 'parents'] },
          { word: 'friend', definition: 'A person you like and enjoy spending time with', example: 'My best friend and I go to school together.', phonetic: '/frend/', synonyms: ['buddy', 'pal'] }
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
          { word: 'teacher', definition: 'A person who helps students learn at school', example: 'My teacher is very kind and helps me with math.', phonetic: '/ˈtiːtʃər/', synonyms: ['instructor', 'educator'] },
          { word: 'book', definition: 'Something you read to learn or enjoy stories', example: 'I read a new book about animals every week.', phonetic: '/bʊk/', synonyms: ['text', 'story'] },
          { word: 'job', definition: 'Work that you do to earn money', example: 'My father has a good job at a big company.', phonetic: '/dʒɑːb/', synonyms: ['work', 'employment'] },
          { word: 'write', definition: 'To make words and letters on paper with a pen', example: 'I write my name at the top of my homework.', phonetic: '/raɪt/', synonyms: ['draw letters', 'put down'] },
          { word: 'help', definition: 'To make things easier for someone who needs you', example: 'I help my little sister with her homework after school.', phonetic: '/help/', synonyms: ['assist', 'support'] }
        ],
        completed: false
      },
      {
        id: 4,
        title: 'Food & Cooking',
        words: [
          { word: 'cook', definition: 'To make food hot and ready to eat', example: 'My mother cooks dinner for us every evening.', phonetic: '/kʊk/', synonyms: ['prepare', 'make'] },
          { word: 'eat', definition: 'To put food in your mouth and swallow it', example: 'We eat lunch at twelve o clock every day.', phonetic: '/iːt/', synonyms: ['have', 'consume'] },
          { word: 'drink', definition: 'To take liquid into your mouth and swallow it', example: 'I drink milk with my breakfast every morning.', phonetic: '/drɪŋk/', synonyms: ['sip', 'gulp'] },
          { word: 'taste', definition: 'To try food or drink to see if you like it', example: 'Can I taste your ice cream to see if it is good?', phonetic: '/teɪst/', synonyms: ['try', 'sample'] },
          { word: 'hungry', definition: 'When you need to eat because your stomach is empty', example: 'I am very hungry after playing outside all morning.', phonetic: '/ˈhʌŋɡri/', synonyms: ['starving', 'wanting food'] }
        ],
        completed: false
      },
      {
        id: 5,
        title: 'Free Time & Hobbies',
        words: [
          { word: 'play', definition: 'To do something fun like a game or sport', example: 'Children play in the park after school every day.', phonetic: '/pleɪ/', synonyms: ['have fun', 'enjoy'] },
          { word: 'music', definition: 'Sounds that people make with instruments or their voices', example: 'I love to listen to music when I do my homework.', phonetic: '/ˈmjuːzɪk/', synonyms: ['songs', 'tunes'] },
          { word: 'watch', definition: 'To look at something for a long time', example: 'We watch TV together as a family every evening.', phonetic: '/wɑːtʃ/', synonyms: ['see', 'look at'] },
          { word: 'read', definition: 'To look at words and understand what they mean', example: 'I read a story book before I go to bed.', phonetic: '/riːd/', synonyms: ['study', 'look at'] },
          { word: 'dance', definition: 'To move your body to music in a fun way', example: 'My sister loves to dance when she hears her favorite songs.', phonetic: '/dæns/', synonyms: ['move', 'groove'] }
        ],
        completed: false
      },
      {
        id: 6,
        title: 'Technology & Internet',
        words: [
          { word: 'computer', definition: 'A machine you use to write, play games, and find information', example: 'I use my computer to do homework and play games.', phonetic: '/kəmˈpjuːtər/', synonyms: ['PC', 'laptop'] },
          { word: 'phone', definition: 'A small device you use to talk to people far away', example: 'My mother calls me on the phone when she is at work.', phonetic: '/foʊn/', synonyms: ['mobile', 'cell'] },
          { word: 'internet', definition: 'A network that connects computers around the world', example: 'I search for information on the internet for my school project.', phonetic: '/ˈɪntərnet/', synonyms: ['web', 'online'] },
          { word: 'video', definition: 'Moving pictures that you watch on a screen', example: 'We watch funny videos of cats on the computer together.', phonetic: '/ˈvɪdioʊ/', synonyms: ['film', 'clip'] },
          { word: 'game', definition: 'Something fun you play with rules and sometimes winners', example: 'My favorite game on the computer is about building houses.', phonetic: '/ɡeɪm/', synonyms: ['play', 'activity'] }
        ],
        completed: false
      },
      {
        id: 7,
        title: 'Shopping & Money',
        words: [
          { word: 'buy', definition: 'To get something by paying money for it', example: 'I want to buy a new toy with my birthday money.', phonetic: '/baɪ/', synonyms: ['purchase', 'get'] },
          { word: 'money', definition: 'Coins and paper that you use to buy things', example: 'I save my money in a piggy bank at home.', phonetic: '/ˈmʌni/', synonyms: ['cash', 'coins'] },
          { word: 'shop', definition: 'A place where people go to buy things they need', example: 'We go to the shop every week to buy food.', phonetic: '/ʃɑːp/', synonyms: ['store', 'market'] },
          { word: 'price', definition: 'How much money something costs to buy', example: 'The price of this book is five dollars only.', phonetic: '/praɪs/', synonyms: ['cost', 'amount'] },
          { word: 'pay', definition: 'To give money for something you want to buy', example: 'My father pays for our food at the restaurant.', phonetic: '/peɪ/', synonyms: ['give money', 'spend'] }
        ],
        completed: false
      },
      {
        id: 8,
        title: 'Health & Body',
        words: [
          { word: 'doctor', definition: 'A person who helps sick people get better', example: 'I visit the doctor when I feel sick or have pain.', phonetic: '/ˈdɑːktər/', synonyms: ['physician', 'medic'] },
          { word: 'sick', definition: 'When your body does not feel good or healthy', example: 'I stayed home from school because I was sick yesterday.', phonetic: '/sɪk/', synonyms: ['ill', 'unwell'] },
          { word: 'body', definition: 'All the parts of a person like arms, legs, and head', example: 'I wash my body with soap and water every day.', phonetic: '/ˈbɑːdi/', synonyms: ['self', 'physical form'] },
          { word: 'pain', definition: 'A bad feeling when part of your body hurts', example: 'I have pain in my tooth so I need to see the dentist.', phonetic: '/peɪn/', synonyms: ['hurt', 'ache'] },
          { word: 'healthy', definition: 'When your body feels good and works well', example: 'I stay healthy by eating good food and playing sports.', phonetic: '/ˈhelθi/', synonyms: ['well', 'fit'] }
        ],
        completed: false
      },
      {
        id: 9,
        title: 'Weather & Nature',
        words: [
          { word: 'sun', definition: 'The big bright ball of light in the sky during the day', example: 'The sun is very hot and bright in the summer.', phonetic: '/sʌn/', synonyms: ['sunshine', 'daylight'] },
          { word: 'rain', definition: 'Water that falls from clouds in the sky', example: 'I wear my raincoat when it rains outside.', phonetic: '/reɪn/', synonyms: ['rainfall', 'shower'] },
          { word: 'tree', definition: 'A tall plant with a trunk, branches, and leaves', example: 'We sit under a big tree when it is hot outside.', phonetic: '/triː/', synonyms: ['plant', 'wood'] },
          { word: 'cold', definition: 'When the air or something feels not warm', example: 'I wear a warm jacket when the weather is cold.', phonetic: '/koʊld/', synonyms: ['chilly', 'cool'] },
          { word: 'hot', definition: 'When something has a very high temperature', example: 'The soup is too hot so I wait before I eat it.', phonetic: '/hɑːt/', synonyms: ['warm', 'burning'] }
        ],
        completed: false
      },
      {
        id: 10,
        title: 'Emotions & Personality',
        words: [
          { word: 'happy', definition: 'When you feel good and want to smile', example: 'I am happy when I play with my friends at the park.', phonetic: '/ˈhæpi/', synonyms: ['joyful', 'glad'] },
          { word: 'sad', definition: 'When you feel bad and want to cry', example: 'I feel sad when my best friend is sick and cannot play.', phonetic: '/sæd/', synonyms: ['unhappy', 'upset'] },
          { word: 'angry', definition: 'When you feel mad because something is not right', example: 'My brother gets angry when someone takes his toys.', phonetic: '/ˈæŋɡri/', synonyms: ['mad', 'upset'] },
          { word: 'kind', definition: 'When someone is nice and helps other people', example: 'My teacher is very kind and always helps us learn.', phonetic: '/kaɪnd/', synonyms: ['nice', 'gentle'] },
          { word: 'smart', definition: 'When someone can learn things easily and think well', example: 'My sister is smart and gets good grades at school.', phonetic: '/smɑːrt/', synonyms: ['clever', 'intelligent'] }
        ],
        completed: false
      },
      {
        id: 11,
        title: 'Transportation & Travel',
        words: [
          { word: 'car', definition: 'A vehicle with four wheels that people drive on roads', example: 'My father drives his car to work every morning.', phonetic: '/kɑːr/', synonyms: ['vehicle', 'auto'] },
          { word: 'bus', definition: 'A big vehicle that carries many people to places', example: 'I take the bus to school with my friends every day.', phonetic: '/bʌs/', synonyms: ['coach', 'transit'] },
          { word: 'walk', definition: 'To move by putting one foot in front of the other', example: 'I walk to the park with my dog every afternoon.', phonetic: '/wɔːk/', synonyms: ['stroll', 'step'] },
          { word: 'travel', definition: 'To go from one place to another place far away', example: 'We travel to the beach for vacation every summer.', phonetic: '/ˈtrævəl/', synonyms: ['journey', 'go'] },
          { word: 'ticket', definition: 'A paper you need to ride on a bus, train, or plane', example: 'I buy a ticket before I get on the train.', phonetic: '/ˈtɪkɪt/', synonyms: ['pass', 'fare'] }
        ],
        completed: false
      },
      {
        id: 12,
        title: 'Home & Furniture',
        words: [
          { word: 'room', definition: 'A space inside a house with walls and a door', example: 'My room has a bed, a desk, and many books.', phonetic: '/ruːm/', synonyms: ['chamber', 'space'] },
          { word: 'table', definition: 'A flat surface with legs where you eat or work', example: 'We eat dinner together at the big table every evening.', phonetic: '/ˈteɪbəl/', synonyms: ['desk', 'surface'] },
          { word: 'chair', definition: 'A seat with a back and four legs for one person', example: 'I sit on a comfortable chair when I do my homework.', phonetic: '/tʃer/', synonyms: ['seat', 'stool'] },
          { word: 'bed', definition: 'A soft place where you sleep at night', example: 'I go to bed at nine o clock every night.', phonetic: '/bed/', synonyms: ['mattress', 'bunk'] },
          { word: 'door', definition: 'Something you open to go in or out of a room', example: 'Please close the door when you leave the room.', phonetic: '/dɔːr/', synonyms: ['entrance', 'gate'] }
        ],
        completed: false
      },
      {
        id: 13,
        title: 'Culture & Entertainment',
        words: [
          { word: 'movie', definition: 'A story with moving pictures that you watch on a screen', example: 'We watch a funny movie at the cinema on Saturday.', phonetic: '/ˈmuːvi/', synonyms: ['film', 'picture'] },
          { word: 'song', definition: 'Music with words that people sing', example: 'My favorite song is about friendship and love.', phonetic: '/sɔːŋ/', synonyms: ['tune', 'melody'] },
          { word: 'party', definition: 'When people come together to have fun and celebrate', example: 'I am going to a birthday party for my friend tomorrow.', phonetic: '/ˈpɑːrti/', synonyms: ['celebration', 'gathering'] },
          { word: 'art', definition: 'Beautiful things people make like paintings and drawings', example: 'I love to make art with colorful paints and paper.', phonetic: '/ɑːrt/', synonyms: ['painting', 'drawing'] },
          { word: 'story', definition: 'Words that tell about people and things that happen', example: 'My grandmother tells me a story before I go to sleep.', phonetic: '/ˈstɔːri/', synonyms: ['tale', 'narrative'] }
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

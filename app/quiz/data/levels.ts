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
      
    ]
  },
  {
    id: 'ielts',
    name: 'IELTS Vocabulary',
    description: '20 Sets, 100 essential words for IELTS',
    cefr: 'B2-C1',
    icon: '🎓',
    sets: [
      {
        id: 1,
        title: 'Academic Life',
        words: [
          { word: 'lecture', definition: 'A formal talk given to teach people about a subject', example: 'The professor delivered an engaging lecture on climate change.', phonetic: '/ˈlektʃər/', synonyms: ['presentation', 'talk', 'speech'] },
          { word: 'assignment', definition: 'A piece of work given to someone as part of their studies', example: 'Students must submit their assignments by Friday.', phonetic: '/əˈsaɪnmənt/', synonyms: ['task', 'project', 'homework'] },
          { word: 'research', definition: 'A detailed study to discover new information', example: 'She conducted extensive research on renewable energy.', phonetic: '/rɪˈsɜːrtʃ/', synonyms: ['investigation', 'study', 'analysis'] },
          { word: 'semester', definition: 'Half of an academic year in schools and universities', example: 'The spring semester begins in January.', phonetic: '/sɪˈmestər/', synonyms: ['term', 'period', 'session'] },
          { word: 'deadline', definition: 'The latest time by which something must be completed', example: 'Meeting deadlines is crucial for academic success.', phonetic: '/ˈdedlaɪn/', synonyms: ['due date', 'time limit', 'cutoff'] }
        ],
        completed: false
      },
      {
        id: 2,
        title: 'Environment & Climate',
        words: [
          { word: 'pollution', definition: 'Harmful substances contaminating the environment', example: 'Air pollution poses serious health risks in urban areas.', phonetic: '/pəˈluːʃən/', synonyms: ['contamination', 'toxicity', 'poisoning'] },
          { word: 'sustainable', definition: 'Able to continue without harming the environment', example: 'Sustainable practices are essential for our planet\'s future.', phonetic: '/səˈsteɪnəbəl/', synonyms: ['eco-friendly', 'green', 'renewable'] },
          { word: 'ecosystem', definition: 'A community of living organisms and their environment', example: 'Coral reefs are fragile ecosystems that need protection.', phonetic: '/ˈiːkoʊsɪstəm/', synonyms: ['habitat', 'environment', 'biome'] },
          { word: 'emissions', definition: 'Gases or substances released into the atmosphere', example: 'Carbon emissions from vehicles contribute to global warming.', phonetic: '/ɪˈmɪʃənz/', synonyms: ['discharge', 'release', 'output'] },
          { word: 'renewable', definition: 'Natural resources that can be replenished', example: 'Solar and wind are renewable energy sources.', phonetic: '/rɪˈnjuːəbəl/', synonyms: ['sustainable', 'recyclable', 'inexhaustible'] }
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
        title: 'Meetings & Workflow (B1)',
        words: [
          { word: 'agenda', definition: 'List of meeting topics arranged for discussion', example: 'The chair emailed the agenda yesterday to coordinate the discussion.', phonetic: '/əˈdʒendə/', synonyms: ['schedule', 'program', 'docket', 'outline'] },
          { word: 'deadline', definition: 'Time by which work must be completed', example: 'We pushed the deadline forward to keep the launch on track.', phonetic: '/ˈdɛdlaɪn/', synonyms: ['due date', 'cutoff', 'time limit', 'closing date'] },
          { word: 'escalate', definition: 'To raise an issue to higher authority', example: 'If the issue persists, escalate it to the regional director.', phonetic: '/ˈɛskəleɪt/', synonyms: ['elevate', 'raise', 'refer', 'up-level'] },
          { word: 'consensus', definition: 'General agreement reached by most participants overall', example: 'After several revisions, the group reached consensus on the product roadmap.', phonetic: '/kənˈsɛnsəs/', synonyms: ['agreement', 'accord', 'unanimity', 'common ground'] },
          { word: 'clarify', definition: 'To make something easier to fully understand', example: 'Please clarify the budget figures before tomorrow’s important client presentation.', phonetic: '/ˈklærɪfaɪ/', synonyms: ['explain', 'simplify', 'elucidate', 'clear up'] }
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

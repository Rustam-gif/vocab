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
      }
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

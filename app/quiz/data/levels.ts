export interface Word {
  word: string;
  definition: string;
  example: string;
  phonetic?: string;
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
    icon: '',
    sets: [
      {
        id: 1,
        title: 'Daily Actions 1',
        words: [
          { word: 'go', definition: 'To move from one place to another', example: 'We go to school by bus every morning.', synonyms: ['move', 'travel', 'head'] },
          { word: 'come', definition: 'To move toward here or another person', example: 'Please come to my house after football practice.', synonyms: ['arrive', 'approach', 'get here'] },
          { word: 'eat', definition: 'To put food in mouth and swallow', example: 'We eat together at six with the whole family.', synonyms: ['dine', 'have', 'consume'] },
          { word: 'drink', definition: 'To take liquid into mouth and swallow', example: 'I drink water before running in hot weather.', synonyms: ['sip', 'have', 'gulp'] },
          { word: 'sleep', definition: 'To rest your body with eyes closed', example: 'Babies sleep a lot during their first months.', synonyms: ['rest', 'nap', 'doze'] }
        ],
        completed: false
      },
      {
        id: 2,
        title: 'Objects & Handling',
        words: [
          { word: 'get', definition: 'To receive or obtain something you need', example: 'I get the keys from reception every morning.', synonyms: ['receive', 'obtain', 'pick up'] },
          { word: 'put', definition: 'To place something in a particular position', example: 'Please put your phone inside the locker now.', synonyms: ['place', 'set', 'lay'] },
          { word: 'take', definition: 'To remove or pick up for yourself', example: 'You may take one brochure from the desk.', synonyms: ['pick up', 'grab', 'carry off'] },
          { word: 'give', definition: 'To hand something to another person politely', example: 'I give this letter to the manager today.', synonyms: ['hand', 'offer', 'pass'] },
          { word: 'make', definition: 'To create or produce something new or useful', example: 'We make sandwiches together for the picnic tomorrow.', synonyms: ['create', 'produce', 'build'] }
        ],
        completed: false
      },
      {
        id: 3,
        title: 'Communication Basics',
        words: [
          { word: 'ask', definition: 'To say words to get information', example: 'You can ask the teacher after the lesson.', synonyms: ['question', 'enquire', 'request'] },
          { word: 'answer', definition: 'To give information after a question', example: 'Please answer the email before lunchtime today.', synonyms: ['reply', 'respond', 'give answer'] },
          { word: 'call', definition: 'To phone someone using a telephone', example: 'Can you call me when you arrive downtown?', synonyms: ['phone', 'ring', 'dial'] },
          { word: 'tell', definition: 'To say information to a person', example: 'Please tell your sister that dinner is ready.', synonyms: ['inform', 'notify', 'say to'] },
          { word: 'talk', definition: 'To speak with someone in conversation', example: 'We talk after class about weekend plans.', synonyms: ['speak', 'chat', 'converse'] }
        ],
        completed: false
      },
      {
        id: 4,
        title: 'Study & Work',
        words: [
          { word: 'read', definition: 'To look at words and understand', example: 'I read a short story before bed.', synonyms: ['scan', 'look over', 'go through'] },
          { word: 'write', definition: 'To make words with pen or keyboard', example: 'She writes notes during every lecture at college.', synonyms: ['compose', 'note down', 'record'] },
          { word: 'learn', definition: 'To get new knowledge or a skill', example: 'We learn new words in English every day.', synonyms: ['pick up', 'acquire', 'master'] },
          { word: 'study', definition: 'To spend time learning something carefully', example: 'I study in the library before every exam.', synonyms: ['revise', 'review', 'prepare'] },
          { word: 'work', definition: 'To do tasks for money or results', example: 'They work in a caf near the station.', synonyms: ['labour', 'do a job', 'be employed'] }
        ],
        completed: false
      },
      {
        id: 5,
        title: 'Personal Care',
        words: [
          { word: 'wash', definition: 'To clean something using water and soap', example: 'Please wash your hands before you eat dinner.', synonyms: ['clean', 'rinse', 'scrub'] },
          { word: 'brush', definition: 'To clean or smooth with a brush', example: 'I brush my teeth every morning and night.', synonyms: ['clean', 'polish', 'sweep'] },
          { word: 'comb', definition: 'To arrange hair using a comb neatly', example: 'She combs her hair before school every day.', synonyms: ['arrange hair', 'tidy hair', 'smooth hair'] },
          { word: 'cut', definition: 'To use something sharp to divide carefully', example: 'Please cut the apples into small pieces first.', synonyms: ['slice', 'trim', 'chop'] },
          { word: 'shave', definition: 'To remove hair from skin with razor', example: 'He shaves his face every second morning.', synonyms: ['remove hair', 'razor', 'trim hair'] }
        ],
        completed: false
      },
      {
        id: 6,
        title: 'Travel Basics',
        words: [
          { word: 'travel', definition: 'To go to places, often far away', example: 'We travel by train to see our grandparents.', synonyms: ['journey', 'go', 'move'] },
          { word: 'visit', definition: 'To go and spend time with someone', example: 'We visit our aunt on Sundays after lunch.', synonyms: ['see', 'call on', 'drop by'] },
          { word: 'leave', definition: 'To go away from a place temporarily', example: 'I leave at six to catch the last bus.', synonyms: ['depart', 'go away', 'set off'] },
          { word: 'arrive', definition: 'To reach a place at the end', example: 'The bus arrives at nine, so be ready early.', synonyms: ['reach', 'get here', 'come'] },
          { word: 'wait', definition: 'To stay until something happens or starts', example: 'We wait outside while Dad buys the tickets.', synonyms: ['stay', 'hold on', 'hang on'] }
        ],
        completed: false
      },
      {
        id: 7,
        title: 'Hand & Carry',
        words: [
          { word: 'use', definition: 'To do something with a thing purposefully', example: 'I use a dictionary when I read news.', synonyms: ['employ', 'apply', 'utilize'] },
          { word: 'hold', definition: 'To keep something in your hands firmly', example: 'Please hold the ladder while I climb up.', synonyms: ['grip', 'grasp', 'keep'] },
          { word: 'carry', definition: 'To hold and move something somewhere carefully', example: 'They carry the boxes to the car together.', synonyms: ['bring', 'take along', 'tote'] },
          { word: 'drop', definition: 'To let something fall from hands accidentally', example: 'Don\'t drop the glass; it can break easily.', synonyms: ['let fall', 'release', 'let go'] },
          { word: 'pick up', definition: 'To lift something from a surface gently', example: 'Please pick up the toys before bedtime tonight.', synonyms: ['lift', 'raise', 'collect'] }
        ],
        completed: false
      },
      {
        id: 8,
        title: 'Time & Routine',
        words: [
          { word: 'start', definition: 'To begin doing something or activity now', example: 'We start class at nine on Monday mornings.', synonyms: ['begin', 'begin doing', 'get going'] },
          { word: 'finish', definition: 'To end something you are doing today', example: 'I finish my homework before dinner each night.', synonyms: ['end', 'complete', 'be done'] },
          { word: 'stop', definition: 'To not continue doing something anymore now', example: 'The buses stop here after ten at night.', synonyms: ['halt', 'quit', 'cease'] },
          { word: 'rest', definition: 'To relax your body and mind briefly', example: 'Sit down and rest after the long walk.', synonyms: ['relax', 'take a break', 'pause'] },
          { word: 'hurry', definition: 'To move or act very quickly now', example: 'We must hurry or we will miss the bus.', synonyms: ['rush', 'speed up', 'move fast'] }
        ],
        completed: false
      },
      {
        id: 9,
        title: 'Family & Friends',
        words: [
          { word: 'meet', definition: 'To see someone by plan or chance', example: 'We meet at the park after school today.', synonyms: ['see', 'get together', 'meet up'] },
          { word: 'help', definition: 'To do something to make work easier', example: 'Can you help me carry these bags upstairs?', synonyms: ['assist', 'aid', 'support'] },
          { word: 'thank', definition: 'To say you are grateful to someone', example: 'Always thank the driver when you get off.', synonyms: ['say thanks', 'show thanks', 'express thanks'] },
          { word: 'hug', definition: 'To hold someone close with arms tightly', example: 'The children hug their grandparents at the station.', synonyms: ['embrace', 'cuddle', 'hold close'] },
          { word: 'kiss', definition: 'To touch with lips to show love', example: 'Parents kiss their children goodnight every evening.', synonyms: ['peck', 'smooch', 'give a kiss'] }
        ],
        completed: false
      },
      {
        id: 10,
        title: 'Senses & Attention',
        words: [
          { word: 'see', definition: 'To notice something with your eyes clearly', example: 'I can see the mountains from my window.', synonyms: ['notice', 'spot', 'behold'] },
          { word: 'look', definition: 'To direct your eyes to something carefully', example: 'Please look at the board during the lesson.', synonyms: ['gaze', 'glance', 'stare'] },
          { word: 'watch', definition: 'To look at something for time closely', example: 'We watch a short film in class today.', synonyms: ['observe', 'view', 'keep an eye'] },
          { word: 'hear', definition: 'To notice sounds with your ears clearly', example: 'I can hear music from the next room.', synonyms: ['catch', 'perceive', 'detect'] },
          { word: 'listen', definition: 'To pay attention to sounds carefully', example: 'Please listen to the instructions before starting.', synonyms: ['hear attentively', 'pay attention', 'tune in'] }
        ],
        completed: false
      },
      {
        id: 11,
        title: 'Computer Basics',
        words: [
          { word: 'turn on', definition: 'To start a device so it works', example: 'Please turn on the laptop before the lesson.', synonyms: ['switch on', 'power on', 'start'] },
          { word: 'turn off', definition: 'To stop a device so it sleeps', example: 'Don\'t forget to turn off the lights after class.', synonyms: ['switch off', 'power off', 'shut down'] },
          { word: 'click', definition: 'To press a mouse or button once', example: 'Click the blue button to join the meeting.', synonyms: ['press', 'tap', 'select'] },
          { word: 'type', definition: 'To write using a computer keyboard carefully', example: 'She types her notes during every lecture now.', synonyms: ['key', 'input', 'enter'] },
          { word: 'save', definition: 'To store a file so it stays', example: 'Always save your work before closing programs.', synonyms: ['store', 'keep', 'back up'] }
        ],
        completed: false
      },
      {
        id: 12,
        title: 'Movement & Play',
        words: [
          { word: 'run', definition: 'To move very fast using your legs', example: 'We run around the track before stretching together.', synonyms: ['sprint', 'jog', 'dash'] },
          { word: 'jump', definition: 'To jump off the ground with both feet', example: 'The children jump over the small puddles happily.', synonyms: ['leap', 'hop', 'bounce'] },
          { word: 'climb', definition: 'To move upward using hands and feet', example: 'We climb the hill slowly to enjoy the view.', synonyms: ['go up', 'scale', 'ascend'] },
          { word: 'throw', definition: 'To throw something forward with your arm', example: 'Please throw the ball gently to the dog.', synonyms: ['toss', 'cast', 'pitch'] },
          { word: 'catch', definition: 'To take something that someone throws', example: 'Can you catch this bag while I tie shoes?', synonyms: ['grab', 'take', 'receive'] }
        ],
        completed: false
      },
      {
        id: 13,
        title: 'Shopping & Errands',
        words: [
          { word: 'buy', definition: 'To get something by paying money', example: 'We buy fruit at the market on Saturdays.', synonyms: ['purchase', 'get', 'pick up'] },
          { word: 'pay', definition: 'To give money to someone you owe', example: 'I pay the bill with my card today.', synonyms: ['settle', 'cover', 'pay for'] },
          { word: 'sell', definition: 'To give something to another for money', example: 'They sell sandwiches and tea at the kiosk.', synonyms: ['offer', 'trade', 'vend'] },
          { word: 'send', definition: 'To send something to another place', example: 'I send the parcel today with a tracking code.', synonyms: ['post', 'mail', 'dispatch'] },
          { word: 'bring', definition: 'To take something to a place with you', example: 'Can you bring your laptop to class tomorrow?', synonyms: ['carry', 'take along', 'fetch'] }
        ],
        completed: false
      },
      {
        id: 14,
        title: 'Weather & Nature',
        words: [
          { word: 'rain', definition: 'To fall as water drops from clouds', example: 'It often rains here in the spring months.', synonyms: ['drizzle', 'shower', 'pour'] },
          { word: 'snow', definition: 'To fall as frozen flakes from clouds', example: 'It might snow tonight on the nearby hills.', synonyms: ['flurry', 'sleet', 'snow lightly'] },
          { word: 'shine', definition: 'To give bright light, especially the sun', example: 'The sun shines early in summer mornings.', synonyms: ['glow', 'gleam', 'glitter'] },
          { word: 'blow', definition: 'To move air strongly across an area', example: 'The wind blows hard near the open coast.', synonyms: ['gust', 'puff', 'breeze'] },
          { word: 'fall', definition: 'To drop down to the ground from above', example: 'Leaves fall in autumn when days get cooler.', synonyms: ['drop', 'tumble', 'come down'] }
        ],
        completed: false
      },
      {
        id: 15,
        title: 'Feelings & Choices',
        words: [
          { word: 'like', definition: 'To think something is good or enjoyable', example: 'I like simple songs with easy words.', synonyms: ['enjoy', 'be into', 'prefer'] },
          { word: 'love', definition: 'To feel very strong liking for someone', example: 'We love our family and spend time together.', synonyms: ['adore', 'care for', 'be fond of'] },
          { word: 'want', definition: 'To wish to have or do something', example: 'I want to learn guitar this summer.', synonyms: ['wish for', 'would like', 'desire'] },
          { word: 'need', definition: 'To require something because it is necessary now', example: 'We need more chairs for tonight\'s meeting.', synonyms: ['require', 'must have', 'have to'] },
          { word: 'hope', definition: 'To want something good to happen soon', example: 'I hope the weather is sunny tomorrow.', synonyms: ['wish', 'look forward', 'expect'] }
        ],
        completed: false
      },
      {
        id: 16,
        title: 'Kitchen & Cooking',
        words: [
          { word: 'cook', definition: 'To prepare food by heating it', example: 'My mother cooks dinner for us every evening.', synonyms: ['prepare', 'make food', 'heat'] },
          { word: 'boil', definition: 'To heat water until it bubbles', example: 'Please boil the water before making tea.', synonyms: ['heat', 'simmer', 'steam'] },
          { word: 'fry', definition: 'To cook food in hot oil', example: 'We fry eggs in a small pan for breakfast.', synonyms: ['saut', 'pan-cook', 'sizzle'] },
          { word: 'mix', definition: 'To put things together and stir', example: 'Mix the flour and eggs in a big bowl.', synonyms: ['blend', 'stir', 'combine'] },
          { word: 'taste', definition: 'To try food to check its flavor', example: 'Always taste the soup before you serve it.', synonyms: ['try', 'sample', 'test'] }
        ],
        completed: false
      },
      {
        id: 17,
        title: 'Numbers & Counting',
        words: [
          { word: 'count', definition: 'To say numbers in order one by one', example: 'Children learn to count from one to ten.', synonyms: ['number', 'tally', 'add up'] },
          { word: 'add', definition: 'To put numbers together to get more', example: 'If you add two and three, you get five.', synonyms: ['plus', 'sum up', 'total'] },
          { word: 'half', definition: 'One of two equal parts of something', example: 'I ate half the apple and saved the rest.', synonyms: ['fifty percent', 'part', 'portion'] },
          { word: 'double', definition: 'To make something twice as much', example: 'Double the recipe if you have more guests.', synonyms: ['twice', 'two times', 'multiply'] },
          { word: 'share', definition: 'To divide something with others fairly', example: 'We share the pizza with our friends equally.', synonyms: ['split', 'divide', 'give part'] }
        ],
        completed: false
      },
      {
        id: 18,
        title: 'Colors & Looks',
        words: [
          { word: 'bright', definition: 'Full of light or strong in color', example: 'The bright sun made us wear sunglasses today.', synonyms: ['vivid', 'shiny', 'glowing'] },
          { word: 'dark', definition: 'Without light or deep in color', example: 'The room was dark after we turned off lights.', synonyms: ['dim', 'shadowy', 'unlit'] },
          { word: 'soft', definition: 'Not hard or rough when you touch', example: 'The baby blanket feels very soft and warm.', synonyms: ['smooth', 'gentle', 'fluffy'] },
          { word: 'hard', definition: 'Firm and solid, not easy to break', example: 'The floor is hard, so we use a carpet.', synonyms: ['solid', 'firm', 'tough'] },
          { word: 'round', definition: 'Shaped like a circle or ball', example: 'The clock on the wall is round and white.', synonyms: ['circular', 'curved', 'ball-shaped'] }
        ],
        completed: false
      },
      {
        id: 19,
        title: 'Home Items',
        words: [
          { word: 'door', definition: 'A piece that opens to let you in', example: 'Please close the door when you leave the room.', synonyms: ['entrance', 'gate', 'doorway'] },
          { word: 'window', definition: 'Glass in a wall to let light in', example: 'Open the window to get fresh air inside.', synonyms: ['opening', 'glass pane', 'pane'] },
          { word: 'chair', definition: 'A seat with a back for one person', example: 'Please sit on this chair next to me.', synonyms: ['seat', 'stool', 'place to sit'] },
          { word: 'table', definition: 'A flat surface with legs for things', example: 'We eat dinner at the big table together.', synonyms: ['desk', 'surface', 'counter'] },
          { word: 'bed', definition: 'Furniture where you sleep at night', example: 'I go to bed at nine every school night.', synonyms: ['mattress', 'bunk', 'sleeping place'] }
        ],
        completed: false
      },
      {
        id: 20,
        title: 'Body Parts',
        words: [
          { word: 'head', definition: 'The top part of your body with face', example: 'Wear a hat to protect your head from sun.', synonyms: ['skull', 'face area', 'top'] },
          { word: 'hand', definition: 'The part at the end of your arm', example: 'Wash your hands before you touch the food.', synonyms: ['palm', 'fist', 'fingers'] },
          { word: 'foot', definition: 'The part at the end of your leg', example: 'My foot hurts after walking so far today.', synonyms: ['sole', 'toe area', 'bottom'] },
          { word: 'eye', definition: 'The part of face used for seeing', example: 'Close your eyes and make a birthday wish.', synonyms: ['sight organ', 'peeper', 'vision'] },
          { word: 'ear', definition: 'The part of head used for hearing', example: 'Cover your ears if the music is too loud.', synonyms: ['hearing organ', 'lobe', 'listener'] }
        ],
        completed: false
      },
      {
        id: 21,
        title: 'Classroom Objects',
        words: [
          { word: 'book', definition: 'Pages with words bound together to read', example: 'Please open your book to page twenty-five.', synonyms: ['textbook', 'reader', 'volume'] },
          { word: 'pen', definition: 'A tool with ink for writing words', example: 'I need a pen to sign this form quickly.', synonyms: ['ballpoint', 'biro', 'writing tool'] },
          { word: 'paper', definition: 'Thin flat material for writing on', example: 'Write your answer on a clean piece of paper.', synonyms: ['sheet', 'page', 'notepaper'] },
          { word: 'desk', definition: 'A table used for work or study', example: 'Keep your desk tidy so you can work better.', synonyms: ['table', 'workstation', 'workspace'] },
          { word: 'board', definition: 'A flat surface on wall for teaching', example: 'The teacher writes new words on the board.', synonyms: ['whiteboard', 'blackboard', 'display'] }
        ],
        completed: false
      },
      {
        id: 22,
        title: 'Food & Drinks',
        words: [
          { word: 'bread', definition: 'Baked food made from flour and water', example: 'We buy fresh bread from the bakery each morning.', synonyms: ['loaf', 'toast', 'roll'] },
          { word: 'milk', definition: 'White drink that comes from cows', example: 'Children drink milk to grow strong bones.', synonyms: ['dairy', 'cream', 'white drink'] },
          { word: 'water', definition: 'Clear liquid that we drink to live', example: 'Drink plenty of water when the weather is hot.', synonyms: ['H2O', 'liquid', 'hydration'] },
          { word: 'fruit', definition: 'Sweet food that grows on trees or plants', example: 'Eating fruit every day is good for your health.', synonyms: ['produce', 'apple', 'fresh food'] },
          { word: 'meat', definition: 'Food from animals like chicken or beef', example: 'Some people do not eat meat at all.', synonyms: ['protein', 'flesh', 'poultry'] }
        ],
        completed: false
      },
      {
        id: 23,
        title: 'Animals',
        words: [
          { word: 'dog', definition: 'A pet animal that barks and wags tail', example: 'Our dog runs in the garden every afternoon.', synonyms: ['puppy', 'hound', 'canine'] },
          { word: 'cat', definition: 'A small pet animal that meows softly', example: 'The cat sleeps on the sofa all day long.', synonyms: ['kitten', 'feline', 'kitty'] },
          { word: 'bird', definition: 'An animal with wings that can fly', example: 'A bird is singing outside my window this morning.', synonyms: ['fowl', 'feathered friend', 'winged animal'] },
          { word: 'fish', definition: 'An animal that lives and swims in water', example: 'We have small fish in a tank at home.', synonyms: ['sea creature', 'aquatic animal', 'swimmer'] },
          { word: 'horse', definition: 'A large animal that people can ride', example: 'She learned to ride a horse last summer.', synonyms: ['pony', 'stallion', 'mare'] }
        ],
        completed: false
      },
      {
        id: 24,
        title: 'Clothes & Dressing',
        words: [
          { word: 'wear', definition: 'To have clothes on your body', example: 'I wear a jacket when the weather is cold.', synonyms: ['put on', 'have on', 'dress in'] },
          { word: 'shirt', definition: 'Clothing for top part of body with buttons', example: 'He wears a white shirt to work every day.', synonyms: ['top', 'blouse', 'tee'] },
          { word: 'shoes', definition: 'Things you wear on your feet outside', example: 'Take off your shoes before entering the house.', synonyms: ['footwear', 'trainers', 'sneakers'] },
          { word: 'hat', definition: 'Something you wear on top of head', example: 'Wear a hat to keep the sun off your face.', synonyms: ['cap', 'headwear', 'beanie'] },
          { word: 'pocket', definition: 'A small bag sewn into clothes for things', example: 'Put your keys in your pocket so you do not lose them.', synonyms: ['pouch', 'compartment', 'holder'] }
        ],
        completed: false
      },
      {
        id: 25,
        title: 'Telling Time',
        words: [
          { word: 'morning', definition: 'The early part of day before noon', example: 'I eat breakfast every morning before school.', synonyms: ['dawn', 'AM', 'sunrise time'] },
          { word: 'afternoon', definition: 'The part of day after noon until evening', example: 'We have sports practice in the afternoon today.', synonyms: ['midday', 'PM', 'after lunch'] },
          { word: 'evening', definition: 'The part of day when sun goes down', example: 'The family watches television in the evening.', synonyms: ['night time', 'dusk', 'sundown'] },
          { word: 'today', definition: 'This present day we are in now', example: 'Today is Monday and tomorrow is Tuesday.', synonyms: ['this day', 'now', 'present day'] },
          { word: 'tomorrow', definition: 'The day that comes after today', example: 'I have a test tomorrow so I must study tonight.', synonyms: ['next day', 'the day after', 'coming day'] }
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
          { word: 'wake up', definition: 'To stop sleeping and become awake', example: 'I usually wake up at 7 a.m.', synonyms: ['get up', 'arise', 'awaken'] },
          { word: 'eat', definition: 'To put food in your mouth and swallow it', example: 'They eat breakfast together every morning.', synonyms: ['consume', 'have a meal', 'dine'] },
          { word: 'study', definition: 'To learn something by reading or practicing', example: 'She studies English every evening.', synonyms: ['learn', 'practice', 'review'] },
          { word: 'exercise', definition: 'To move your body to stay strong and healthy', example: 'He exercises three times a week at the gym.', synonyms: ['work out', 'train', 'keep fit'] },
          { word: 'sleep', definition: 'To rest your body with your eyes closed', example: 'Children should sleep at least nine hours.', synonyms: ['rest', 'slumber', 'doze'] }
        ],
        completed: true
      },
      {
        id: 5,
        title: 'Set 5',
        words: [
          { word: 'mitigate', definition: 'To make a problem less severe or harmful', example: 'New safety guidelines aim to mitigate risks during maintenance work.', synonyms: ['lessen', 'alleviate', 'reduce', 'ease'] },
          { word: 'allocate', definition: 'To assign resources or duties for particular purposes', example: 'The manager will allocate funds after reviewing each department\'s proposal.', synonyms: ['assign', 'apportion', 'distribute', 'earmark'] },
          { word: 'justify', definition: 'To give reasons showing a decision is reasonable', example: 'You must justify travel expenses before finance approves reimbursement.', synonyms: ['defend', 'warrant', 'substantiate', 'vindicate'] },
          { word: 'compromise', definition: 'To settle a disagreement by mutual concessions', example: 'After hours of talks, both sides agreed to compromise on payment.', synonyms: ['negotiate', 'settle', 'conciliate', 'concede'] },
          { word: 'implement', definition: 'To put a plan or decision into effect', example: 'The city plans to implement the new recycling scheme next spring.', synonyms: ['execute', 'carry out', 'enforce', 'apply'] }
        ],
        completed: false
      },
      {
        id: 2,
        title: 'Basic Needs & Family',
        words: [
          { word: 'home', definition: 'The place where you live with your family', example: 'I live in a small home with my parents.', synonyms: ['house', 'place', 'where you live'] },
          { word: 'food', definition: 'Things you eat to stay healthy and strong', example: 'We eat good food every day at breakfast.', synonyms: ['meal', 'eating', 'lunch'] },
          { word: 'brother', definition: 'A boy or man who has the same parents as you', example: 'My brother is five years old and likes to play.', synonyms: ['sibling', 'family', 'boy in family'] },
          { word: 'family', definition: 'Your mother, father, brothers, sisters, and other close people', example: 'I love my family and we eat together every evening.', synonyms: ['relatives', 'parents', 'mom and dad'] },
          { word: 'friend', definition: 'A person you like and enjoy spending time with', example: 'My best friend and I go to school together.', synonyms: ['buddy', 'pal', 'someone you like'] }
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
          { word: 'wake up', definition: 'To stop sleeping and become awake', example: 'I usually wake up at 7 a.m.', synonyms: ['get up', 'arise', 'awaken'] },
          { word: 'eat', definition: 'To put food in your mouth and swallow it', example: 'They eat breakfast together every morning.', synonyms: ['consume', 'have a meal', 'dine'] },
          { word: 'study', definition: 'To learn something by reading or practicing', example: 'She studies English every evening.', synonyms: ['learn', 'practice', 'review'] },
          { word: 'exercise', definition: 'To move your body to stay strong and healthy', example: 'He exercises three times a week at the gym.', synonyms: ['work out', 'train', 'keep fit'] },
          { word: 'sleep', definition: 'To rest your body with your eyes closed', example: 'Children should sleep at least nine hours.', synonyms: ['rest', 'slumber', 'doze'] },
          { word: 'home', definition: 'The place where you live with your family', example: 'I live in a small home with my parents.', synonyms: ['house', 'place', 'where you live'] },
          { word: 'food', definition: 'Things you eat to stay healthy and strong', example: 'We eat good food every day at breakfast.', synonyms: ['meal', 'eating', 'lunch'] },
          { word: 'brother', definition: 'A boy or man who has the same parents as you', example: 'My brother is five years old and likes to play.', synonyms: ['sibling', 'family', 'boy in family'] },
          { word: 'family', definition: 'Your mother, father, brothers, sisters, and other close people', example: 'I love my family and we eat together every evening.', synonyms: ['relatives', 'parents', 'mom and dad'] },
          { word: 'friend', definition: 'A person you like and enjoy spending time with', example: 'My best friend and I go to school together.', synonyms: ['buddy', 'pal', 'someone you like'] }
        ],
        completed: false
      },
      {
        id: 4,
        title: 'Set 4',
        words: [
          { word: 'borrow', definition: 'To take and use something temporarily', example: 'You can borrow my umbrella if the rain starts again.', synonyms: ['take on loan', 'use temporarily', 'get on loan'] },
          { word: 'lend', definition: 'To give something temporarily to someone', example: 'She agreed to lend me her notes for tomorrow\'s exam.', synonyms: ['loan', 'give temporarily', 'advance'] },
          { word: 'compare', definition: 'To examine similarities and differences between things', example: 'Let\'s compare both offers before we choose the cheaper option.', synonyms: ['contrast', 'match up', 'evaluate differences'] },
          { word: 'explain', definition: 'To make an idea clear by describing', example: 'Please explain the steps slowly so everyone can follow.', synonyms: ['clarify', 'describe', 'make clear'] },
          { word: 'arrange', definition: 'To plan and organize details in order', example: 'We should arrange a meeting for Friday afternoon at school.', synonyms: ['organize', 'schedule', 'plan'] }
        ],
        completed: false
      },
      {
        id: 3,
        title: 'Education & Work',
        words: [
          { word: 'teacher', definition: 'A person who helps students learn at school', example: 'My teacher is very kind and helps me with math.', synonyms: ['instructor', 'educator', 'tutor'] },
          { word: 'book', definition: 'Something you read to learn or enjoy stories', example: 'I read a new book about animals every week.', synonyms: ['text', 'story', 'novel'] },
          { word: 'job', definition: 'Work that you do to earn money', example: 'My father has a good job at a big company.', synonyms: ['work', 'employment', 'career'] },
          { word: 'write', definition: 'To make words and letters on paper with a pen', example: 'I write my name at the top of my homework.', synonyms: ['draw letters', 'put down', 'pen'] },
          { word: 'help', definition: 'To make things easier for someone who needs you', example: 'I help my little sister with her homework after school.', synonyms: ['assist', 'support', 'aid'] }
        ],
        completed: false
      },
      {
        id: 4,
        title: 'Food & Cooking',
        words: [
          { word: 'cook', definition: 'To make food hot and ready to eat', example: 'My mother cooks dinner for us every evening.', synonyms: ['prepare', 'make', 'fix food'] },
          { word: 'eat', definition: 'To put food in your mouth and swallow it', example: 'We eat lunch at twelve o clock every day.', synonyms: ['have', 'consume', 'munch'] },
          { word: 'drink', definition: 'To take liquid into your mouth and swallow it', example: 'I drink milk with my breakfast every morning.', synonyms: ['sip', 'gulp', 'swallow'] },
          { word: 'taste', definition: 'To try food or drink to see if you like it', example: 'Can I taste your ice cream to see if it is good?', synonyms: ['try', 'sample', 'test'] },
          { word: 'hungry', definition: 'When you need to eat because your stomach is empty', example: 'I am very hungry after playing outside all morning.', synonyms: ['starving', 'wanting food', 'needing food'] }
        ],
        completed: false
      },
      {
        id: 'quiz2',
        title: 'Quiz 2',
        type: 'quiz',
        description: 'A quick recap of sets 3 & 4',
        words: [
          { word: 'teacher', definition: 'A person who helps students learn at school', example: 'My teacher is very kind and helps me with math.', synonyms: ['instructor', 'educator', 'tutor'] },
          { word: 'book', definition: 'Something you read to learn or enjoy stories', example: 'I read a new book about animals every week.', synonyms: ['text', 'story', 'novel'] },
          { word: 'job', definition: 'Work that you do to earn money', example: 'My father has a good job at a big company.', synonyms: ['work', 'employment', 'career'] },
          { word: 'write', definition: 'To make words and letters on paper with a pen', example: 'I write my name at the top of my homework.', synonyms: ['draw letters', 'put down', 'pen'] },
          { word: 'help', definition: 'To make things easier for someone who needs you', example: 'I help my little sister with her homework after school.', synonyms: ['assist', 'support', 'aid'] },
          { word: 'cook', definition: 'To make food hot and ready to eat', example: 'My mother cooks dinner for us every evening.', synonyms: ['prepare', 'make', 'fix food'] },
          { word: 'eat', definition: 'To put food in your mouth and swallow it', example: 'We eat lunch at twelve o clock every day.', synonyms: ['have', 'consume', 'munch'] },
          { word: 'drink', definition: 'To take liquid into your mouth and swallow it', example: 'I drink milk with my breakfast every morning.', synonyms: ['sip', 'gulp', 'swallow'] },
          { word: 'taste', definition: 'To try food or drink to see if you like it', example: 'Can I taste your ice cream to see if it is good?', synonyms: ['try', 'sample', 'test'] },
          { word: 'hungry', definition: 'When you need to eat because your stomach is empty', example: 'I am very hungry after playing outside all morning.', synonyms: ['starving', 'wanting food', 'needing food'] }
        ],
        completed: false
      },
      {
        id: 5,
        title: 'Free Time & Hobbies',
        words: [
          { word: 'play', definition: 'To do something fun like a game or sport', example: 'Children play in the park after school every day.', synonyms: ['have fun', 'enjoy', 'do activity'] },
          { word: 'music', definition: 'Sounds that people make with instruments or their voices', example: 'I love to listen to music when I do my homework.', synonyms: ['songs', 'tunes', 'melody'] },
          { word: 'watch', definition: 'To look at something for a long time', example: 'We watch TV together as a family every evening.', synonyms: ['see', 'look at', 'view'] },
          { word: 'read', definition: 'To look at words and understand what they mean', example: 'I read a story book before I go to bed.', synonyms: ['study', 'look at', 'scan'] },
          { word: 'dance', definition: 'To move your body to music in a fun way', example: 'My sister loves to dance when she hears her favorite songs.', synonyms: ['move', 'groove', 'sway'] }
        ],
        completed: false
      },
      {
        id: 6,
        title: 'Technology & Internet',
        words: [
          { word: 'computer', definition: 'A machine you use to write, play games, and find information', example: 'I use my computer to do homework and play games.', synonyms: ['PC', 'laptop', 'machine'] },
          { word: 'phone', definition: 'A small device you use to talk to people far away', example: 'My mother calls me on the phone when she is at work.', synonyms: ['mobile', 'cell', 'device'] },
          { word: 'internet', definition: 'A network that connects computers around the world', example: 'I search for information on the internet for my school project.', synonyms: ['web', 'online', 'network'] },
          { word: 'video', definition: 'Moving pictures that you watch on a screen', example: 'We watch funny videos of cats on the computer together.', synonyms: ['film', 'clip', 'recording'] },
          { word: 'game', definition: 'Something fun you play with rules and sometimes winners', example: 'My favorite game on the computer is about building houses.', synonyms: ['play', 'activity', 'sport'] }
        ],
        completed: false
      },
      {
        id: 'quiz3',
        title: 'Quiz 3',
        type: 'quiz',
        description: 'A quick recap of sets 5 & 6',
        words: [
          { word: 'play', definition: 'To do something fun like a game or sport', example: 'Children play in the park after school every day.', synonyms: ['have fun', 'enjoy', 'do activity'] },
          { word: 'music', definition: 'Sounds that people make with instruments or their voices', example: 'I love to listen to music when I do my homework.', synonyms: ['songs', 'tunes', 'melody'] },
          { word: 'watch', definition: 'To look at something for a long time', example: 'We watch TV together as a family every evening.', synonyms: ['see', 'look at', 'view'] },
          { word: 'read', definition: 'To look at words and understand what they mean', example: 'I read a story book before I go to bed.', synonyms: ['study', 'look at', 'scan'] },
          { word: 'dance', definition: 'To move your body to music in a fun way', example: 'My sister loves to dance when she hears her favorite songs.', synonyms: ['move', 'groove', 'sway'] },
          { word: 'computer', definition: 'A machine you use to write, play games, and find information', example: 'I use my computer to do homework and play games.', synonyms: ['PC', 'laptop', 'machine'] },
          { word: 'phone', definition: 'A small device you use to talk to people far away', example: 'My mother calls me on the phone when she is at work.', synonyms: ['mobile', 'cell', 'device'] },
          { word: 'internet', definition: 'A network that connects computers around the world', example: 'I search for information on the internet for my school project.', synonyms: ['web', 'online', 'network'] },
          { word: 'video', definition: 'Moving pictures that you watch on a screen', example: 'We watch funny videos of cats on the computer together.', synonyms: ['film', 'clip', 'recording'] },
          { word: 'game', definition: 'Something fun you play with rules and sometimes winners', example: 'My favorite game on the computer is about building houses.', synonyms: ['play', 'activity', 'sport'] }
        ],
        completed: false
      },
      {
        id: 7,
        title: 'Shopping & Money',
        words: [
          { word: 'buy', definition: 'To get something by paying money for it', example: 'I want to buy a new toy with my birthday money.', synonyms: ['purchase', 'get', 'acquire'] },
          { word: 'money', definition: 'Coins and paper that you use to buy things', example: 'I save my money in a piggy bank at home.', synonyms: ['cash', 'coins', 'currency'] },
          { word: 'shop', definition: 'A place where people go to buy things they need', example: 'We go to the shop every week to buy food.', synonyms: ['store', 'market', 'place'] },
          { word: 'price', definition: 'How much money something costs to buy', example: 'The price of this book is five dollars only.', synonyms: ['cost', 'amount', 'value'] },
          { word: 'pay', definition: 'To give money for something you want to buy', example: 'My father pays for our food at the restaurant.', synonyms: ['give money', 'spend', 'hand over'] }
        ],
        completed: false
      },
      {
        id: 8,
        title: 'Health & Body',
        words: [
          { word: 'doctor', definition: 'A person who helps sick people get better', example: 'I visit the doctor when I feel sick or have pain.', synonyms: ['physician', 'medic', 'healer'] },
          { word: 'sick', definition: 'When your body does not feel good or healthy', example: 'I stayed home from school because I was sick yesterday.', synonyms: ['ill', 'unwell', 'not healthy'] },
          { word: 'body', definition: 'All the parts of a person like arms, legs, and head', example: 'I wash my body with soap and water every day.', synonyms: ['self', 'physical form', 'figure'] },
          { word: 'pain', definition: 'A bad feeling when part of your body hurts', example: 'I have pain in my tooth so I need to see the dentist.', synonyms: ['hurt', 'ache', 'soreness'] },
          { word: 'healthy', definition: 'When your body feels good and works well', example: 'I stay healthy by eating good food and playing sports.', synonyms: ['well', 'fit', 'strong'] }
        ],
        completed: false
      },
      {
        id: 'quiz4',
        title: 'Quiz 4',
        type: 'quiz',
        description: 'A quick recap of sets 7 & 8',
        words: [
          { word: 'buy', definition: 'To get something by paying money for it', example: 'I want to buy a new toy with my birthday money.', synonyms: ['purchase', 'get', 'acquire'] },
          { word: 'money', definition: 'Coins and paper that you use to buy things', example: 'I save my money in a piggy bank at home.', synonyms: ['cash', 'coins', 'currency'] },
          { word: 'shop', definition: 'A place where people go to buy things they need', example: 'We go to the shop every week to buy food.', synonyms: ['store', 'market', 'place'] },
          { word: 'price', definition: 'How much money something costs to buy', example: 'The price of this book is five dollars only.', synonyms: ['cost', 'amount', 'value'] },
          { word: 'pay', definition: 'To give money for something you want to buy', example: 'My father pays for our food at the restaurant.', synonyms: ['give money', 'spend', 'hand over'] },
          { word: 'doctor', definition: 'A person who helps sick people get better', example: 'I visit the doctor when I feel sick or have pain.', synonyms: ['physician', 'medic', 'healer'] },
          { word: 'sick', definition: 'When your body does not feel good or healthy', example: 'I stayed home from school because I was sick yesterday.', synonyms: ['ill', 'unwell', 'not healthy'] },
          { word: 'body', definition: 'All the parts of a person like arms, legs, and head', example: 'I wash my body with soap and water every day.', synonyms: ['self', 'physical form', 'figure'] },
          { word: 'pain', definition: 'A bad feeling when part of your body hurts', example: 'I have pain in my tooth so I need to see the dentist.', synonyms: ['hurt', 'ache', 'soreness'] },
          { word: 'healthy', definition: 'When your body feels good and works well', example: 'I stay healthy by eating good food and playing sports.', synonyms: ['well', 'fit', 'strong'] }
        ],
        completed: false
      },
      {
        id: 9,
        title: 'Weather & Nature',
        words: [
          { word: 'sun', definition: 'The big bright ball of light in the sky during the day', example: 'The sun is very hot and bright in the summer.', synonyms: ['sunshine', 'daylight', 'star'] },
          { word: 'rain', definition: 'Water that falls from clouds in the sky', example: 'I wear my raincoat when it rains outside.', synonyms: ['rainfall', 'shower', 'water'] },
          { word: 'tree', definition: 'A tall plant with a trunk, branches, and leaves', example: 'We sit under a big tree when it is hot outside.', synonyms: ['plant', 'wood', 'oak'] },
          { word: 'cold', definition: 'When the air or something feels not warm', example: 'I wear a warm jacket when the weather is cold.', synonyms: ['chilly', 'cool', 'freezing'] },
          { word: 'hot', definition: 'When something has a very high temperature', example: 'The soup is too hot so I wait before I eat it.', synonyms: ['warm', 'burning', 'heated'] }
        ],
        completed: false
      },
      {
        id: 10,
        title: 'Emotions & Personality',
        words: [
          { word: 'happy', definition: 'When you feel good and want to smile', example: 'I am happy when I play with my friends at the park.', synonyms: ['joyful', 'glad', 'cheerful'] },
          { word: 'sad', definition: 'When you feel bad and want to cry', example: 'I feel sad when my best friend is sick and cannot play.', synonyms: ['unhappy', 'upset', 'down'] },
          { word: 'angry', definition: 'When you feel mad because something is not right', example: 'My brother gets angry when someone takes his toys.', synonyms: ['mad', 'upset', 'furious'] },
          { word: 'kind', definition: 'When someone is nice and helps other people', example: 'My teacher is very kind and always helps us learn.', synonyms: ['nice', 'gentle', 'caring'] },
          { word: 'smart', definition: 'When someone can learn things easily and think well', example: 'My sister is smart and gets good grades at school.', synonyms: ['clever', 'intelligent', 'bright'] }
        ],
        completed: false
      },
      {
        id: 'quiz5',
        title: 'Quiz 5',
        type: 'quiz',
        description: 'A quick recap of sets 9 & 10',
        words: [
          { word: 'sun', definition: 'The big bright ball of light in the sky during the day', example: 'The sun is very hot and bright in the summer.', synonyms: ['sunshine', 'daylight', 'star'] },
          { word: 'rain', definition: 'Water that falls from clouds in the sky', example: 'I wear my raincoat when it rains outside.', synonyms: ['rainfall', 'shower', 'water'] },
          { word: 'tree', definition: 'A tall plant with a trunk, branches, and leaves', example: 'We sit under a big tree when it is hot outside.', synonyms: ['plant', 'wood', 'oak'] },
          { word: 'cold', definition: 'When the air or something feels not warm', example: 'I wear a warm jacket when the weather is cold.', synonyms: ['chilly', 'cool', 'freezing'] },
          { word: 'hot', definition: 'When something has a very high temperature', example: 'The soup is too hot so I wait before I eat it.', synonyms: ['warm', 'burning', 'heated'] },
          { word: 'happy', definition: 'When you feel good and want to smile', example: 'I am happy when I play with my friends at the park.', synonyms: ['joyful', 'glad', 'cheerful'] },
          { word: 'sad', definition: 'When you feel bad and want to cry', example: 'I feel sad when my best friend is sick and cannot play.', synonyms: ['unhappy', 'upset', 'down'] },
          { word: 'angry', definition: 'When you feel mad because something is not right', example: 'My brother gets angry when someone takes his toys.', synonyms: ['mad', 'upset', 'furious'] },
          { word: 'kind', definition: 'When someone is nice and helps other people', example: 'My teacher is very kind and always helps us learn.', synonyms: ['nice', 'gentle', 'caring'] },
          { word: 'smart', definition: 'When someone can learn things easily and think well', example: 'My sister is smart and gets good grades at school.', synonyms: ['clever', 'intelligent', 'bright'] }
        ],
        completed: false
      },
      {
        id: 11,
        title: 'Transportation & Travel',
        words: [
          { word: 'car', definition: 'A vehicle with four wheels that people drive on roads', example: 'My father drives his car to work every morning.', synonyms: ['vehicle', 'auto', 'automobile'] },
          { word: 'bus', definition: 'A big vehicle that carries many people to places', example: 'I take the bus to school with my friends every day.', synonyms: ['coach', 'transit', 'transport'] },
          { word: 'walk', definition: 'To move by putting one foot in front of the other', example: 'I walk to the park with my dog every afternoon.', synonyms: ['stroll', 'step', 'move'] },
          { word: 'travel', definition: 'To go from one place to another place far away', example: 'We travel to the beach for vacation every summer.', synonyms: ['journey', 'go', 'trip'] },
          { word: 'ticket', definition: 'A paper you need to ride on a bus, train, or plane', example: 'I buy a ticket before I get on the train.', synonyms: ['pass', 'fare', 'entry'] }
        ],
        completed: false
      },
      {
        id: 12,
        title: 'Home & Furniture',
        words: [
          { word: 'room', definition: 'A space inside a house with walls and a door', example: 'My room has a bed, a desk, and many books.', synonyms: ['chamber', 'space', 'area'] },
          { word: 'table', definition: 'A flat surface with legs where you eat or work', example: 'We eat dinner together at the big table every evening.', synonyms: ['desk', 'surface', 'counter'] },
          { word: 'chair', definition: 'A seat with a back and four legs for one person', example: 'I sit on a comfortable chair when I do my homework.', synonyms: ['seat', 'stool', 'bench'] },
          { word: 'bed', definition: 'A soft place where you sleep at night', example: 'I go to bed at nine o clock every night.', synonyms: ['mattress', 'bunk', 'cot'] },
          { word: 'door', definition: 'Something you open to go in or out of a room', example: 'Please close the door when you leave the room.', synonyms: ['entrance', 'gate', 'doorway'] }
        ],
        completed: false
      },
      {
        id: 13,
        title: 'Culture & Entertainment',
        words: [
          { word: 'movie', definition: 'A story with moving pictures that you watch on a screen', example: 'We watch a funny movie at the cinema on Saturday.', synonyms: ['film', 'picture', 'show'] },
          { word: 'song', definition: 'Music with words that people sing', example: 'My favorite song is about friendship and love.', synonyms: ['tune', 'melody', 'music'] },
          { word: 'party', definition: 'When people come together to have fun and celebrate', example: 'I am going to a birthday party for my friend tomorrow.', synonyms: ['celebration', 'gathering', 'event'] },
          { word: 'art', definition: 'Beautiful things people make like paintings and drawings', example: 'I love to make art with colorful paints and paper.', synonyms: ['painting', 'drawing', 'artwork'] },
          { word: 'story', definition: 'Words that tell about people and things that happen', example: 'My grandmother tells me a story before I go to sleep.', synonyms: ['tale', 'narrative', 'account'] }
        ],
        completed: false
      },
  */
  {
    id: 'ielts',
    name: 'IELTS Vocabulary',
    description: '20 Sets, 100 essential words for IELTS',
    cefr: 'B2-C1',
    icon: '',
    sets: [
      {
        id: 1,
        title: 'Data & Trends',
        words: [
          { word: 'fluctuate', definition: 'To change level up and down frequently', example: 'Prices fluctuate during holidays and after major events.', synonyms: ['vary', 'oscillate', 'shift'] },
          { word: 'stabilize', definition: 'To make or become steady and consistent', example: 'Policies aim to stabilize rent after sharp increases.', synonyms: ['steady', 'level out', 'firm up'] },
          { word: 'decline', definition: 'To decrease gradually in amount or strength', example: 'Birth rates decline as urbanization and education expand.', synonyms: ['decrease', 'drop', 'diminish'] },
          { word: 'surge', definition: 'To rise suddenly and strongly in number', example: 'Applications surge when fees are temporarily reduced.', synonyms: ['spike', 'soar', 'jump'] },
          { word: 'plateau', definition: 'To stop rising and stay almost unchanged', example: 'Productivity plateaued despite longer hours and bonuses.', synonyms: ['level off', 'flatten', 'hold steady'] }
        ],
        completed: false
      },
      {
        id: 2,
        title: 'Academic Processes',
        words: [
          { word: 'investigate', definition: 'To examine carefully to discover facts', example: 'Researchers investigate causes using interviews and records.', synonyms: ['examine', 'probe', 'look into'] },
          { word: 'assess', definition: 'To judge quality or amount after review', example: 'Teachers assess speaking using clear public rubrics.', synonyms: ['evaluate', 'appraise', 'gauge'] },
          { word: 'justify', definition: 'To give reasons to support a decision', example: 'The minister justified delays with evidence of shortages.', synonyms: ['defend', 'substantiate', 'warrant'] },
          { word: 'implement', definition: 'To put a plan or decision into action', example: 'Councils implement reforms after community consultations end.', synonyms: ['execute', 'carry out', 'apply'] },
          { word: 'revise', definition: 'To change something to improve or correct', example: 'Writers revise drafts after feedback from editors.', synonyms: ['amend', 'edit', 'update'] }
        ],
        completed: false
      },
      {
        id: 3,
        title: 'Technology & Innovation',
        words: [
          { word: 'artificial', definition: 'Made by humans rather than occurring naturally', example: 'Artificial intelligence is transforming many industries.', synonyms: ['synthetic', 'man-made', 'manufactured'] },
          { word: 'digital', definition: 'Using computer technology and the internet', example: 'The digital age has revolutionized communication.', synonyms: ['electronic', 'computerized', 'virtual'] },
          { word: 'algorithm', definition: 'A set of rules for solving problems in computing', example: 'Search engines use complex algorithms to rank results.', synonyms: ['formula', 'procedure', 'method'] },
          { word: 'automation', definition: 'Using machines to do work without human control', example: 'Automation has increased efficiency in manufacturing.', synonyms: ['mechanization', 'robotization', 'computerization'] },
          { word: 'breakthrough', definition: 'An important discovery or development', example: 'Scientists achieved a breakthrough in cancer research.', synonyms: ['advance', 'discovery', 'innovation'] }
        ],
        completed: false
      },
      {
        id: 4,
        title: 'Health & Medicine',
        words: [
          { word: 'diagnosis', definition: 'The identification of an illness or disease', example: 'Early diagnosis can significantly improve treatment outcomes.', synonyms: ['identification', 'detection', 'assessment'] },
          { word: 'symptom', definition: 'A sign that indicates the presence of disease', example: 'Fever is a common symptom of many infections.', synonyms: ['indication', 'sign', 'manifestation'] },
          { word: 'treatment', definition: 'Medical care given to a patient for an illness', example: 'The new treatment shows promising results for diabetes.', synonyms: ['therapy', 'remedy', 'care'] },
          { word: 'prevention', definition: 'Actions taken to stop something from happening', example: 'Prevention is better than cure in healthcare.', synonyms: ['precaution', 'protection', 'deterrence'] },
          { word: 'immunity', definition: 'The body\'s ability to resist infection', example: 'Vaccines help build immunity against diseases.', synonyms: ['resistance', 'protection', 'defense'] }
        ],
        completed: false
      },
      {
        id: 5,
        title: 'Business & Economics',
        words: [
          { word: 'profit', definition: 'Money gained from business after costs are paid', example: 'The company reported record profits this quarter.', synonyms: ['earnings', 'revenue', 'income'] },
          { word: 'investment', definition: 'Money put into a business to make more money', example: 'Foreign investment has boosted the local economy.', synonyms: ['funding', 'capital', 'financing'] },
          { word: 'inflation', definition: 'A general increase in prices over time', example: 'High inflation reduces people\'s purchasing power.', synonyms: ['price rise', 'cost increase', 'escalation'] },
          { word: 'entrepreneur', definition: 'Someone who starts and runs a business', example: 'Young entrepreneurs are driving innovation in tech.', synonyms: ['business owner', 'innovator', 'founder'] },
          { word: 'consumer', definition: 'A person who buys goods or services', example: 'Consumer demand influences market trends.', synonyms: ['buyer', 'customer', 'purchaser'] }
        ],
        completed: false
      },
      {
        id: 6,
        title: 'Government & Politics',
        words: [
          { word: 'legislation', definition: 'Laws passed by a government', example: 'New legislation aims to protect workers\' rights.', synonyms: ['laws', 'regulations', 'statutes'] },
          { word: 'democracy', definition: 'A system where people vote to choose leaders', example: 'Democracy ensures citizens have a voice in government.', synonyms: ['self-government', 'republic', 'freedom'] },
          { word: 'policy', definition: 'A plan or course of action by a government', example: 'The government introduced a new education policy.', synonyms: ['strategy', 'plan', 'approach'] },
          { word: 'parliament', definition: 'The group of elected representatives who make laws', example: 'Parliament debated the healthcare reform bill.', synonyms: ['legislature', 'congress', 'assembly'] },
          { word: 'campaign', definition: 'Organized activities to achieve a political goal', example: 'The election campaign focused on economic issues.', synonyms: ['drive', 'movement', 'initiative'] }
        ],
        completed: false
      },
      {
        id: 7,
        title: 'Media & Communication',
        words: [
          { word: 'broadcast', definition: 'To send out programs on TV or radio', example: 'The news is broadcast live every evening at six.', synonyms: ['transmit', 'air', 'televise'] },
          { word: 'journalism', definition: 'The work of collecting and reporting news', example: 'Quality journalism is essential for democracy.', synonyms: ['reporting', 'news media', 'press'] },
          { word: 'censorship', definition: 'Control of what can be published or broadcast', example: 'Many countries practice strict internet censorship.', synonyms: ['suppression', 'restriction', 'control'] },
          { word: 'propaganda', definition: 'Information used to promote a political cause', example: 'Wartime propaganda influenced public opinion.', synonyms: ['promotion', 'publicity', 'advertising'] },
          { word: 'editorial', definition: 'An article expressing the editor\'s opinion', example: 'The newspaper\'s editorial criticized the new law.', synonyms: ['opinion piece', 'commentary', 'column'] }
        ],
        completed: false
      },
      {
        id: 8,
        title: 'Social Issues',
        words: [
          { word: 'inequality', definition: 'Unfair difference between groups in society', example: 'Income inequality has widened in recent decades.', synonyms: ['disparity', 'imbalance', 'injustice'] },
          { word: 'poverty', definition: 'The state of being extremely poor', example: 'Many organizations work to alleviate global poverty.', synonyms: ['destitution', 'hardship', 'deprivation'] },
          { word: 'discrimination', definition: 'Unfair treatment based on characteristics', example: 'Laws prohibit discrimination based on race or gender.', synonyms: ['prejudice', 'bias', 'intolerance'] },
          { word: 'welfare', definition: 'Government support for people in need', example: 'The welfare system provides assistance to unemployed citizens.', synonyms: ['social security', 'benefits', 'aid'] },
          { word: 'diversity', definition: 'The inclusion of people from different backgrounds', example: 'Workplace diversity brings different perspectives and ideas.', synonyms: ['variety', 'multiculturalism', 'inclusion'] }
        ],
        completed: false
      },
      {
        id: 9,
        title: 'Arts & Culture',
        words: [
          { word: 'aesthetic', definition: 'Concerned with beauty or appreciation of beauty', example: 'The building\'s aesthetic appeal attracts many visitors.', synonyms: ['artistic', 'beautiful', 'pleasing'] },
          { word: 'exhibition', definition: 'A public display of art or other items', example: 'The museum hosts a new exhibition every month.', synonyms: ['show', 'display', 'presentation'] },
          { word: 'contemporary', definition: 'Belonging to the present time', example: 'Contemporary art often challenges traditional ideas.', synonyms: ['modern', 'current', 'present-day'] },
          { word: 'heritage', definition: 'Traditions and culture passed down generations', example: 'UNESCO protects sites of cultural heritage worldwide.', synonyms: ['legacy', 'tradition', 'inheritance'] },
          { word: 'masterpiece', definition: 'An outstanding work of art or craftsmanship', example: 'The Mona Lisa is considered a Renaissance masterpiece.', synonyms: ['masterwork', 'classic', 'triumph'] }
        ],
        completed: false
      },
      {
        id: 10,
        title: 'Science & Research',
        words: [
          { word: 'hypothesis', definition: 'A proposed explanation that can be tested', example: 'Scientists test their hypothesis through experiments.', synonyms: ['theory', 'assumption', 'proposition'] },
          { word: 'experiment', definition: 'A scientific test to prove or discover something', example: 'The experiment yielded surprising results.', synonyms: ['test', 'trial', 'investigation'] },
          { word: 'evidence', definition: 'Facts or information that prove something', example: 'There is strong evidence supporting the theory.', synonyms: ['proof', 'data', 'confirmation'] },
          { word: 'analysis', definition: 'Detailed examination of something', example: 'Statistical analysis revealed important patterns.', synonyms: ['examination', 'evaluation', 'study'] },
          { word: 'methodology', definition: 'A system of methods used in research', example: 'The research methodology was clearly explained.', synonyms: ['approach', 'procedure', 'technique'] }
        ],
        completed: false
      },
      {
        id: 11,
        title: 'Travel & Tourism',
        words: [
          { word: 'destination', definition: 'The place where someone is going', example: 'Paris remains a popular tourist destination.', synonyms: ['location', 'place', 'spot'] },
          { word: 'itinerary', definition: 'A planned route or journey schedule', example: 'Our itinerary includes visits to five countries.', synonyms: ['schedule', 'plan', 'route'] },
          { word: 'accommodation', definition: 'A place where people can stay temporarily', example: 'The hotel offers comfortable accommodation for guests.', synonyms: ['lodging', 'housing', 'quarters'] },
          { word: 'hospitality', definition: 'Friendly and generous treatment of guests', example: 'The hospitality industry employs millions worldwide.', synonyms: ['welcome', 'friendliness', 'service'] },
          { word: 'attraction', definition: 'A place of interest that tourists visit', example: 'The Eiffel Tower is Paris\'s most famous attraction.', synonyms: ['site', 'landmark', 'feature'] }
        ],
        completed: false
      },
      {
        id: 12,
        title: 'Food & Agriculture',
        words: [
          { word: 'organic', definition: 'Produced without artificial chemicals', example: 'Organic farming avoids synthetic pesticides.', synonyms: ['natural', 'chemical-free', 'biological'] },
          { word: 'nutrition', definition: 'The process of getting food for good health', example: 'Proper nutrition is essential for children\'s development.', synonyms: ['nourishment', 'diet', 'sustenance'] },
          { word: 'cultivation', definition: 'The process of growing plants for food', example: 'Rice cultivation requires abundant water supply.', synonyms: ['farming', 'agriculture', 'growing'] },
          { word: 'harvest', definition: 'The gathering of mature crops', example: 'Farmers celebrate after a successful harvest.', synonyms: ['crop', 'yield', 'gathering'] },
          { word: 'livestock', definition: 'Farm animals raised for food or products', example: 'Livestock farming contributes to greenhouse gas emissions.', synonyms: ['cattle', 'animals', 'farm animals'] }
        ],
        completed: false
      },
      {
        id: 13,
        title: 'Urban Development',
        words: [
          { word: 'infrastructure', definition: 'Basic systems and services in a city', example: 'Good infrastructure is vital for economic growth.', synonyms: ['facilities', 'systems', 'services'] },
          { word: 'residential', definition: 'Relating to areas where people live', example: 'The residential district is quiet and peaceful.', synonyms: ['housing', 'domestic', 'suburban'] },
          { word: 'metropolitan', definition: 'Relating to a large city and its suburbs', example: 'The metropolitan area has over 10 million residents.', synonyms: ['urban', 'city', 'municipal'] },
          { word: 'congestion', definition: 'Overcrowding causing traffic delays', example: 'Traffic congestion worsens during rush hour.', synonyms: ['crowding', 'jam', 'bottleneck'] },
          { word: 'zoning', definition: 'Dividing land into areas for specific uses', example: 'Zoning laws regulate commercial and residential areas.', synonyms: ['planning', 'designation', 'allocation'] }
        ],
        completed: false
      },
      {
        id: 14,
        title: 'Education System',
        words: [
          { word: 'curriculum', definition: 'The subjects taught in a school or course', example: 'The school updated its curriculum to include coding.', synonyms: ['syllabus', 'program', 'course'] },
          { word: 'pedagogy', definition: 'The method and practice of teaching', example: 'Modern pedagogy emphasizes student-centered learning.', synonyms: ['teaching', 'instruction', 'education'] },
          { word: 'literacy', definition: 'The ability to read and write', example: 'Improving literacy rates is a government priority.', synonyms: ['reading ability', 'education', 'learning'] },
          { word: 'vocational', definition: 'Relating to skills for a particular job', example: 'Vocational training prepares students for careers.', synonyms: ['professional', 'occupational', 'career'] },
          { word: 'assessment', definition: 'The process of evaluating students\' knowledge', example: 'Continuous assessment provides better feedback than exams.', synonyms: ['evaluation', 'testing', 'examination'] }
        ],
        completed: false
      },
      {
        id: 15,
        title: 'Crime & Law',
        words: [
          { word: 'defendant', definition: 'A person accused of a crime in court', example: 'The defendant pleaded not guilty to all charges.', synonyms: ['accused', 'suspect', 'respondent'] },
          { word: 'prosecution', definition: 'The process of charging someone with a crime', example: 'The prosecution presented compelling evidence.', synonyms: ['legal action', 'charge', 'indictment'] },
          { word: 'verdict', definition: 'A decision made by a jury in a trial', example: 'The jury reached a guilty verdict after deliberation.', synonyms: ['decision', 'judgment', 'ruling'] },
          { word: 'justice', definition: 'Fair treatment according to the law', example: 'Everyone deserves access to justice in society.', synonyms: ['fairness', 'equity', 'law'] },
          { word: 'rehabilitation', definition: 'Helping criminals return to normal life', example: 'The program focuses on rehabilitation rather than punishment.', synonyms: ['reform', 'reintegration', 'restoration'] }
        ],
        completed: false
      },
      {
        id: 16,
        title: 'Psychology & Behavior',
        words: [
          { word: 'cognitive', definition: 'Related to mental processes like thinking', example: 'Cognitive development continues throughout childhood.', synonyms: ['mental', 'intellectual', 'cerebral'] },
          { word: 'motivation', definition: 'The reason or desire to do something', example: 'Strong motivation is key to achieving goals.', synonyms: ['drive', 'incentive', 'encouragement'] },
          { word: 'perception', definition: 'The way something is understood or interpreted', example: 'People\'s perception of reality varies greatly.', synonyms: ['understanding', 'interpretation', 'awareness'] },
          { word: 'anxiety', definition: 'A feeling of worry or nervousness', example: 'Test anxiety affects many students\' performance.', synonyms: ['worry', 'stress', 'nervousness'] },
          { word: 'resilience', definition: 'The ability to recover from difficulties', example: 'Building resilience helps people cope with challenges.', synonyms: ['strength', 'toughness', 'adaptability'] }
        ],
        completed: false
      },
      {
        id: 17,
        title: 'Global Issues',
        words: [
          { word: 'humanitarian', definition: 'Concerned with reducing human suffering', example: 'Humanitarian aid was sent to the disaster zone.', synonyms: ['charitable', 'compassionate', 'benevolent'] },
          { word: 'refugee', definition: 'Someone forced to leave their country', example: 'Millions of refugees seek safety from conflict.', synonyms: ['displaced person', 'asylum seeker', 'migrant'] },
          { word: 'conflict', definition: 'A serious disagreement or war', example: 'International organizations work to resolve conflicts.', synonyms: ['war', 'dispute', 'clash'] },
          { word: 'famine', definition: 'Extreme shortage of food affecting many people', example: 'Drought often leads to famine in vulnerable regions.', synonyms: ['starvation', 'hunger', 'scarcity'] },
          { word: 'pandemic', definition: 'A disease outbreak affecting multiple countries', example: 'The pandemic changed how people work and communicate.', synonyms: ['epidemic', 'outbreak', 'plague'] }
        ],
        completed: false
      },
      {
        id: 18,
        title: 'Sports & Fitness',
        words: [
          { word: 'athletic', definition: 'Physically strong and good at sports', example: 'Athletic performance improves with regular training.', synonyms: ['fit', 'muscular', 'sporty'] },
          { word: 'endurance', definition: 'The ability to continue a difficult activity', example: 'Marathon running requires great endurance.', synonyms: ['stamina', 'persistence', 'resilience'] },
          { word: 'competition', definition: 'An organized event where people compete', example: 'The competition attracts athletes from around the world.', synonyms: ['contest', 'tournament', 'championship'] },
          { word: 'stamina', definition: 'Physical strength to sustain prolonged effort', example: 'Building stamina takes consistent exercise and training.', synonyms: ['endurance', 'energy', 'staying power'] },
          { word: 'performance', definition: 'How well someone does in a sport or activity', example: 'His performance in the finals was outstanding.', synonyms: ['achievement', 'execution', 'showing'] }
        ],
        completed: false
      },
      {
        id: 19,
        title: 'Finance & Banking',
        words: [
          { word: 'mortgage', definition: 'A loan to buy property, paid back over years', example: 'They took out a mortgage to purchase their first home.', synonyms: ['loan', 'debt', 'financing'] },
          { word: 'credit', definition: 'The ability to borrow money to be paid later', example: 'Good credit history helps secure better loan rates.', synonyms: ['trust', 'borrowing', 'lending'] },
          { word: 'assets', definition: 'Valuable things owned by a person or company', example: 'The company\'s assets include property and equipment.', synonyms: ['possessions', 'property', 'resources'] },
          { word: 'budget', definition: 'A plan for spending money over a period', example: 'Creating a budget helps manage personal finances.', synonyms: ['financial plan', 'allocation', 'estimate'] },
          { word: 'transaction', definition: 'A business deal or exchange of money', example: 'Online transactions have become increasingly common.', synonyms: ['deal', 'exchange', 'transfer'] }
        ],
        completed: false
      },
      {
        id: 20,
        title: 'Employment & Career',
        words: [
          { word: 'qualification', definition: 'Skills or knowledge needed for a job', example: 'A degree is the minimum qualification for this position.', synonyms: ['credential', 'certificate', 'competency'] },
          { word: 'promotion', definition: 'Moving to a higher position at work', example: 'She received a promotion after five years of service.', synonyms: ['advancement', 'upgrade', 'elevation'] },
          { word: 'resignation', definition: 'The act of leaving a job voluntarily', example: 'His resignation was accepted with immediate effect.', synonyms: ['departure', 'quitting', 'withdrawal'] },
          { word: 'productivity', definition: 'The rate at which work is completed', example: 'Remote work has increased productivity for many employees.', synonyms: ['efficiency', 'output', 'performance'] },
          { word: 'colleague', definition: 'A person you work with professionally', example: 'My colleagues are supportive and easy to work with.', synonyms: ['coworker', 'associate', 'teammate'] }
        ],
        completed: false
      },
      {
        id: 6,
        title: 'Opinions & Decisions',
        words: [
          { word: 'refuse', definition: 'To say no and not accept something', example: 'He refused the offer politely after reading the contract carefully.', synonyms: ['decline', 'reject', 'turn down', 'deny'] },
          { word: 'consider', definition: 'To think carefully before making a decision', example: 'Before renting, consider travel time and the total monthly costs.', synonyms: ['think about', 'contemplate', 'weigh', 'regard'] },
          { word: 'suggest', definition: 'To offer an idea for careful consideration', example: 'Could you suggest another route that avoids the toll road?', synonyms: ['propose', 'recommend', 'put forward', 'advise'] },
          { word: 'avoid', definition: 'To keep away from something potentially unpleasant', example: 'Drivers avoid the bridge at five because traffic is terrible.', synonyms: ['steer clear', 'shun', 'dodge', 'keep away'] },
          { word: 'agree', definition: 'To share the same opinion as someone else', example: 'After some discussion, we agreed to split the work evenly.', synonyms: ['consent', 'concur', 'go along', 'assent'] }
        ],
        completed: false
      },
      {
        id: 7,
        title: 'Community & Volunteering',
        words: [
          { word: 'organize', definition: 'To arrange things so activities run smoothly', example: 'We organized volunteers and tables before the charity market opened.', synonyms: ['arrange', 'set up', 'coordinate', 'sort out'] },
          { word: 'volunteer', definition: 'To offer help without expecting any payment', example: 'Many residents volunteer on weekends to clean riverside paths.', synonyms: ['offer', 'pitch in', 'step forward', 'help'] },
          { word: 'support', definition: 'To help someone by giving practical assistance', example: 'Families support new arrivals with transport, food, and friendly advice.', synonyms: ['assist', 'back', 'help', 'stand by'] },
          { word: 'collect', definition: 'To bring together items from different places', example: 'We collected second-hand books from neighbors for school libraries.', synonyms: ['gather', 'pick up', 'assemble', 'accumulate'] },
          { word: 'advertise', definition: 'To promote something publicly to attract customers', example: 'We advertised the concert on posters and the community website.', synonyms: ['promote', 'publicize', 'market', 'spread'] }
        ],
        completed: false
      },
      {
        id: 8,
        title: 'Tech Setup',
        words: [
          { word: 'install', definition: 'To put software or equipment in place', example: 'A technician installed the router and checked the signal strength.', synonyms: ['set up', 'put in', 'configure', 'mount'] },
          { word: 'update', definition: 'To make something newer with recent changes', example: 'Remember to update apps to fix bugs and improve security.', synonyms: ['upgrade', 'refresh', 'patch', 'revise'] },
          { word: 'download', definition: 'To transfer files from internet onto device', example: 'You can download worksheets and use them offline during travel.', synonyms: ['get', 'save', 'fetch', 'pull down'] },
          { word: 'reset', definition: 'To return settings to their original state', example: 'If it freezes, reset the device and try again.', synonyms: ['restore', 'restart', 'revert', 'clear'] },
          { word: 'attach', definition: 'To fasten or add something to something', example: 'Please attach your CV when you email the application form.', synonyms: ['fasten', 'clip', 'join', 'add'] }
        ],
        completed: false
      },
      {
        id: 9,
        title: 'Health & Recovery',
        words: [
          { word: 'prevent', definition: 'To stop something bad from happening again', example: 'Seat belts prevent injuries when cars brake suddenly in traffic.', synonyms: ['stop', 'avoid', 'block', 'avert'] },
          { word: 'recover', definition: 'To get better after illness or difficulty', example: 'She recovered quickly by resting and following the doctor\'s advice.', synonyms: ['heal', 'get better', 'bounce back', 'regain'] },
          { word: 'reduce', definition: 'To make something smaller in amount overall', example: 'Turning off unused lights reduces your bill and carbon footprint.', synonyms: ['lessen', 'decrease', 'lower', 'cut'] },
          { word: 'improve', definition: 'To make something better in quality overall', example: 'Daily reading improves vocabulary and confidence for class discussions.', synonyms: ['enhance', 'upgrade', 'better', 'develop'] },
          { word: 'treat', definition: 'To give medical care to someone properly', example: 'Doctors treat infections with medicine and advice about rest.', synonyms: ['care for', 'medicate', 'cure', 'attend'] }
        ],
        completed: false
      },
      {
        id: 10,
        title: 'Scheduling & Appointments',
        words: [
          { word: 'schedule', definition: 'To set a time for something later', example: 'Let\'s schedule a follow-up call for Wednesday afternoon.', synonyms: ['arrange', 'set', 'book', 'timetable'] },
          { word: 'confirm', definition: 'To say a detail is correct officially', example: 'Please confirm your seat by replying to the message.', synonyms: ['verify', 'check', 'approve', 'certify'] },
          { word: 'cancel', definition: 'To decide something will not take place', example: 'They cancelled the match because lightning was forecast nearby.', synonyms: ['call off', 'scrap', 'abort', 'drop'] },
          { word: 'reschedule', definition: 'To change a planned time to another', example: 'They rescheduled the lesson after the power cut last night.', synonyms: ['rearrange', 'move', 'push back', 'postpone'] },
          { word: 'remind', definition: 'To help someone remember a future task', example: 'Please remind me about the form before Friday morning.', synonyms: ['prompt', 'nudge', 'jog memory', 'alert'] }
        ],
        completed: false
      },
      {
        id: 11,
        title: 'Rules & Requests',
        words: [
          { word: 'warn', definition: 'To tell about danger to prevent harm', example: 'The signs warn hikers about falling rocks after heavy rain.', synonyms: ['caution', 'alert', 'notify', 'forewarn'] },
          { word: 'permit', definition: 'To officially allow someone to do something', example: 'The staff permit visitors to take photos without a flash.', synonyms: ['allow', 'authorize', 'let', 'approve'] },
          { word: 'forbid', definition: 'To say something is not allowed officially', example: 'Many parks forbid fires during hot, windy summer weekends.', synonyms: ['ban', 'prohibit', 'bar', 'disallow'] },
          { word: 'advise', definition: 'To give suggestions to help someone\'s decision', example: 'Doctors advise patients to rest if symptoms continue for days.', synonyms: ['recommend', 'counsel', 'suggest', 'guide'] },
          { word: 'request', definition: 'To politely ask for something from someone', example: 'You can request extra towels at reception any time tonight.', synonyms: ['ask', 'seek', 'petition', 'solicit'] }
        ],
        completed: false
      },
      {
        id: 12,
        title: 'Orders & Delivery',
        words: [
          { word: 'charge', definition: 'To ask payment amount for a service', example: 'The shop will charge a small fee for home delivery.', synonyms: ['bill', 'price', 'invoice', 'levy'] },
          { word: 'refund', definition: 'To give money back after a problem', example: 'They\'ll refund the ticket if the train is fully canceled.', synonyms: ['repay', 'reimburse', 'return', 'compensate'] },
          { word: 'replace', definition: 'To put a new thing instead of old', example: 'Please replace the batteries if the remote stops working suddenly.', synonyms: ['substitute', 'swap', 'change', 'renew'] },
          { word: 'ship', definition: 'To send goods to a customer somewhere', example: 'They ship orders daily, even during busy holiday weeks.', synonyms: ['send', 'dispatch', 'mail', 'deliver'] },
          { word: 'track', definition: 'To follow progress or location over time', example: 'Customers track parcels online using the code from the receipt.', synonyms: ['follow', 'monitor', 'trace', 'check'] }
        ],
        completed: false
      },
      {
        id: 13,
        title: 'Conversation & Disagreement',
        words: [
          { word: 'persuade', definition: 'To make someone agree by giving reasons', example: 'She persuaded her parents to let her join the trip.', synonyms: ['convince', 'influence', 'sway', 'win over'] },
          { word: 'argue', definition: 'To speak strongly because you disagree', example: 'Neighbors argued about parking until the council changed the plan.', synonyms: ['dispute', 'quarrel', 'contend', 'disagree'] },
          { word: 'reply', definition: 'To answer after receiving a message', example: 'Please reply within two days so we can confirm numbers.', synonyms: ['answer', 'respond', 'write back', 'return'] },
          { word: 'interrupt', definition: 'To stop someone speaking for a moment', example: 'Please don\'t interrupt while I\'m explaining the safety steps.', synonyms: ['cut in', 'interject', 'break in', 'disturb'] },
          { word: 'apologize', definition: 'To say sorry for a mistake', example: 'He apologized for the noise and offered to help repair it.', synonyms: ['say sorry', 'make amends', 'atone', 'apologize to'] }
        ],
        completed: false
      },
      {
        id: 14,
        title: 'Reservations & Changes',
        words: [
          { word: 'reserve', definition: 'To book something for your future use', example: 'Let\'s reserve seats now so we can sit together.', synonyms: ['book', 'secure', 'hold', 'set aside'] },
          { word: 'extend', definition: 'To make a period or length longer', example: 'They extended their stay to see family over the weekend.', synonyms: ['lengthen', 'prolong', 'continue', 'stretch'] },
          { word: 'upgrade', definition: 'To change to a better, newer level', example: 'The hotel upgraded our room because the lift was broken.', synonyms: ['improve', 'update', 'move up', 'advance'] },
          { word: 'cancel', definition: 'To decide an event will not happen', example: 'They canceled the tour because of dangerous winds near cliffs.', synonyms: ['call off', 'scrap', 'abort', 'drop'] },
          { word: 'reschedule', definition: 'To change a planned time to another', example: 'We rescheduled the interview after the power cut last night.', synonyms: ['rearrange', 'move', 'postpone', 'push back'] }
        ],
        completed: false
      },
      {
        id: 15,
        title: 'Assembly & Fixing',
        words: [
          { word: 'assemble', definition: 'To put parts together to make something', example: 'We assembled the shelves carefully using the picture instructions.', synonyms: ['build', 'put together', 'construct', 'set up'] },
          { word: 'adjust', definition: 'To change slightly so it fits better', example: 'You may adjust the chair height for better back support.', synonyms: ['modify', 'alter', 'tune', 'tweak'] },
          { word: 'connect', definition: 'To join two things so they work', example: 'After connecting the cables, the monitor finally showed the picture.', synonyms: ['link', 'join', 'attach', 'plug'] },
          { word: 'secure', definition: 'To fasten firmly so it stays safe', example: 'Always secure ladders before climbing to check the roof tiles.', synonyms: ['fasten', 'fix', 'lock', 'tie'] },
          { word: 'polish', definition: 'To rub a surface until it shines', example: 'We polished the wooden table before setting plates and flowers.', synonyms: ['shine', 'buff', 'rub', 'brighten'] }
        ],
        completed: false
      },
      {
        id: 16,
        title: 'Food & Cooking',
        words: [
          { word: 'order', definition: 'To ask for food or items to buy', example: 'We\'ll order two pizzas and a salad for the group.', synonyms: ['request', 'purchase', 'place order', 'order in'] },
          { word: 'serve', definition: 'To give food or help to people', example: 'They serve breakfast until eleven on weekends and holidays.', synonyms: ['give', 'hand out', 'present', 'provide'] },
          { word: 'taste', definition: 'To try small amount to check flavor', example: 'Always taste the sauce before adding more salt.', synonyms: ['sample', 'try', 'savor', 'test'] },
          { word: 'chop', definition: 'To cut something into small pieces quickly', example: 'Chop the onions finely and keep your fingers safe.', synonyms: ['cut', 'dice', 'slice', 'mince'] },
          { word: 'stir', definition: 'To move food around to mix evenly', example: 'Stir the porridge slowly so it doesn\'t stick or burn.', synonyms: ['mix', 'blend', 'whisk', 'agitate'] },
        ],
        completed: false
      },
      {
        id: 17,
        title: 'Emotions & Reactions',
        words: [
          { word: 'worry', definition: 'To feel anxious about possible problems', example: 'Try not to worry; the results arrive tomorrow afternoon.', synonyms: ['fret', 'be anxious', 'stress'] },
          { word: 'cheer', definition: 'To make someone feel happier or hopeful', example: 'A short message can cheer friends during tough weeks.', synonyms: ['encourage', 'hearten', 'brighten'] },
          { word: 'forgive', definition: 'To stop being angry about someone\'s mistake', example: 'She chose to forgive him after his honest apology.', synonyms: ['pardon', 'excuse', 'let go'] },
          { word: 'praise', definition: 'To say good things about someone\'s work', example: 'Teachers praise effort when students keep trying after mistakes.', synonyms: ['compliment', 'applaud', 'commend'] },
          { word: 'regret', definition: 'To feel sorry about something that happened', example: 'You might regret speaking quickly without checking the facts first.', synonyms: ['be sorry', 'lament', 'rue'] },
        ],
        completed: false
      },
      {
        id: 18,
        title: 'Emphasize & Adapt',
        words: [
          { word: 'heat', definition: 'To make something warmer using energy', example: 'We heat the living room before guests arrive tonight.', synonyms: ['warm', 'heat up', 'warm up'] },
          { word: 'cool', definition: 'To make something less warm or hot', example: 'Open the window to cool the room after cooking.', synonyms: ['chill', 'cool down', 'lower'] },
          { word: 'dry', definition: 'To remove water so something becomes dry', example: 'Hang the shirts to dry near the sunny window.', synonyms: ['dry out', 'air dry', 'dehydrate'] },
          { word: 'fold', definition: 'To bend paper or cloth into layers', example: 'Please fold the towels and stack them by size.', synonyms: ['bend', 'crease', 'double'] },
          { word: 'iron', definition: 'To press clothes flat with a hot iron', example: 'I iron the trousers before interviews to look tidy.', synonyms: ['press', 'smooth', 'flatten'] },
        ],
        completed: false
      },
      {
        id: 19,
        title: 'Act & Uphold',
        words: [
          { word: 'paint', definition: 'To cover a surface with colored liquid', example: 'We paint small models together on quiet Sunday afternoons.', synonyms: ['color', 'decorate', 'coat'] },
          { word: 'draw', definition: 'To make pictures using lines and shapes', example: 'Children draw animals first, then add backgrounds and color.', synonyms: ['sketch', 'outline', 'illustrate'] },
          { word: 'camp', definition: 'To sleep outside in tents for fun', example: 'We camp near the river and watch stars after dinner.', synonyms: ['pitch tents', 'sleep outdoors', 'stay in tents'] },
          { word: 'hike', definition: 'To walk long distances for exercise', example: 'They hike coastal paths when the weather is clear.', synonyms: ['trek', 'ramble', 'walk far'] },
          { word: 'swim', definition: 'To move through water using arms and legs', example: 'We swim a few laps before breakfast on holidays.', synonyms: ['paddle', 'do laps', 'bathe'] },
        ],
        completed: false
      },
      {
        id: 20,
        title: 'Evaluate & Persuade',
        words: [
          { word: 'fill in', definition: 'To complete a form by writing details', example: 'Please fill in the visitor form before you enter.', synonyms: ['complete', 'write in', 'enter details'] },
          { word: 'submit', definition: 'To send work or forms for approval', example: 'You must submit timesheets by noon each Friday.', synonyms: ['send in', 'hand in', 'turn in'] },
          { word: 'print', definition: 'To make a paper copy from digital files', example: 'Only print the final draft to save paper and ink.', synonyms: ['produce', 'make copy', 'output'] },
          { word: 'sign', definition: 'To write your name to show agreement', example: 'Don\'t sign anything until you read the final version.', synonyms: ['write name', 'autograph', 'sign off'] },
          { word: 'file', definition: 'To store documents in a specific place', example: 'After approval, file the invoices by month and project.', synonyms: ['archive', 'store', 'put away'] },
        ],
        completed: false
      },
      {
        id: 16,
        title: 'Food & Cooking',
        words: [
          { word: 'order', definition: 'To ask for food or items to buy', example: 'We\'ll order two pizzas and a salad for the group.', synonyms: ['request', 'purchase', 'place order', 'order in'] },
          { word: 'serve', definition: 'To give food or help to people', example: 'They serve breakfast until eleven on weekends and holidays.', synonyms: ['give', 'hand out', 'present', 'provide'] },
          { word: 'taste', definition: 'To try small amount to check flavor', example: 'Always taste the sauce before adding more salt.', synonyms: ['sample', 'try', 'savor', 'test'] },
          { word: 'chop', definition: 'To cut something into small pieces quickly', example: 'Chop the onions finely and keep your fingers safe.', synonyms: ['cut', 'dice', 'slice', 'mince'] },
          { word: 'stir', definition: 'To move food around to mix evenly', example: 'Stir the porridge slowly so it doesn\'t stick or burn.', synonyms: ['mix', 'blend', 'whisk', 'agitate'] },
        ],
        completed: false
      },
      {
        id: 17,
        title: 'Emotions & Reactions',
        words: [
          { word: 'worry', definition: 'To feel anxious about possible problems', example: 'Try not to worry; the results arrive tomorrow afternoon.', synonyms: ['fret', 'be anxious', 'stress'] },
          { word: 'cheer', definition: 'To make someone feel happier or hopeful', example: 'A short message can cheer friends during tough weeks.', synonyms: ['encourage', 'hearten', 'brighten'] },
          { word: 'forgive', definition: 'To stop being angry about someone\'s mistake', example: 'She chose to forgive him after his honest apology.', synonyms: ['pardon', 'excuse', 'let go'] },
          { word: 'praise', definition: 'To say good things about someone\'s work', example: 'Teachers praise effort when students keep trying after mistakes.', synonyms: ['compliment', 'applaud', 'commend'] },
          { word: 'regret', definition: 'To feel sorry about something that happened', example: 'You might regret speaking quickly without checking the facts first.', synonyms: ['be sorry', 'lament', 'rue'] },
        ],
        completed: false
      },
      {
        id: 18,
        title: 'Emphasize & Adapt',
        words: [
          { word: 'heat', definition: 'To make something warmer using energy', example: 'We heat the living room before guests arrive tonight.', synonyms: ['warm', 'heat up', 'warm up'] },
          { word: 'cool', definition: 'To make something less warm or hot', example: 'Open the window to cool the room after cooking.', synonyms: ['chill', 'cool down', 'lower'] },
          { word: 'dry', definition: 'To remove water so something becomes dry', example: 'Hang the shirts to dry near the sunny window.', synonyms: ['dry out', 'air dry', 'dehydrate'] },
          { word: 'fold', definition: 'To bend paper or cloth into layers', example: 'Please fold the towels and stack them by size.', synonyms: ['bend', 'crease', 'double'] },
          { word: 'iron', definition: 'To press clothes flat with a hot iron', example: 'I iron the trousers before interviews to look tidy.', synonyms: ['press', 'smooth', 'flatten'] },
        ],
        completed: false
      },
      {
        id: 19,
        title: 'Act & Uphold',
        words: [
          { word: 'paint', definition: 'To cover a surface with colored liquid', example: 'We paint small models together on quiet Sunday afternoons.', synonyms: ['color', 'decorate', 'coat'] },
          { word: 'draw', definition: 'To make pictures using lines and shapes', example: 'Children draw animals first, then add backgrounds and color.', synonyms: ['sketch', 'outline', 'illustrate'] },
          { word: 'camp', definition: 'To sleep outside in tents for fun', example: 'We camp near the river and watch stars after dinner.', synonyms: ['pitch tents', 'sleep outdoors', 'stay in tents'] },
          { word: 'hike', definition: 'To walk long distances for exercise', example: 'They hike coastal paths when the weather is clear.', synonyms: ['trek', 'ramble', 'walk far'] },
          { word: 'swim', definition: 'To move through water using arms and legs', example: 'We swim a few laps before breakfast on holidays.', synonyms: ['paddle', 'do laps', 'bathe'] },
        ],
        completed: false
      },
      {
        id: 20,
        title: 'Evaluate & Persuade',
        words: [
          { word: 'fill in', definition: 'To complete a form by writing details', example: 'Please fill in the visitor form before you enter.', synonyms: ['complete', 'write in', 'enter details'] },
          { word: 'submit', definition: 'To send work or forms for approval', example: 'You must submit timesheets by noon each Friday.', synonyms: ['send in', 'hand in', 'turn in'] },
          { word: 'print', definition: 'To make a paper copy from digital files', example: 'Only print the final draft to save paper and ink.', synonyms: ['produce', 'make copy', 'output'] },
          { word: 'sign', definition: 'To write your name to show agreement', example: 'Don\'t sign anything until you read the final version.', synonyms: ['write name', 'autograph', 'sign off'] },
          { word: 'file', definition: 'To store documents in a specific place', example: 'After approval, file the invoices by month and project.', synonyms: ['archive', 'store', 'put away'] },
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
    icon: '',
    sets: [
      {
        id: 1,
        title: 'Meetings & Discussions',
        words: [
          { word: 'agenda', definition: 'Detailed schedule listing all meeting topics discussed', example: 'Please review the agenda before tomorrow\'s meeting.', synonyms: ['schedule', 'program', 'plan'] },
          { word: 'minutes', definition: 'Written record of what was said meeting', example: 'Sarah will take the minutes during today\'s conference.', synonyms: ['notes', 'record', 'transcript'] },
          { word: 'adjourn', definition: 'Temporarily end meeting until later scheduled time', example: 'We will adjourn the meeting until next week.', synonyms: ['suspend', 'postpone', 'conclude'] },
          { word: 'consensus', definition: 'General agreement reached among all group members', example: 'The team reached consensus on the new strategy.', synonyms: ['agreement', 'accord', 'unity'] },
          { word: 'deliberate', definition: 'Carefully consider and discuss important issues thoroughly', example: 'The committee will deliberate on this proposal tomorrow.', synonyms: ['discuss', 'consider', 'debate'] }
        ],
        completed: false
      },
      {
        id: 2,
        title: 'Email & Correspondence',
        words: [
          { word: 'recipient', definition: 'Person who receives a message or email', example: 'Please add all recipients to the distribution list.', synonyms: ['receiver', 'addressee', 'beneficiary'] },
          { word: 'attachment', definition: 'Digital file sent along with email message', example: 'I have included the report as an attachment.', synonyms: ['enclosure', 'file', 'document'] },
          { word: 'correspondence', definition: 'Written communication regularly exchanged between people professionally', example: 'All correspondence should be filed in the database.', synonyms: ['communication', 'letters', 'messages'] },
          { word: 'acknowledge', definition: 'Officially confirm receipt or recognition of something', example: 'Please acknowledge this email upon receiving it.', synonyms: ['confirm', 'recognize', 'verify'] },
          { word: 'forward', definition: 'Send received information to another person quickly', example: 'Could you forward this message to the team?', synonyms: ['send on', 'pass along', 'transmit'] }
        ],
        completed: false
      },
      {
        id: 3,
        title: 'Project Management',
        words: [
          { word: 'milestone', definition: 'Important stage or event achieved in project', example: 'We achieved a major milestone in product development.', synonyms: ['landmark', 'achievement', 'goal'] },
          { word: 'deliverable', definition: 'Tangible outcome that must be produced project', example: 'The final deliverable is due by Friday afternoon.', synonyms: ['output', 'product', 'result'] },
          { word: 'stakeholder', definition: 'Person with interest or concern in something', example: 'All stakeholders were informed about the project delay.', synonyms: ['investor', 'participant', 'party'] },
          { word: 'implement', definition: 'Put a plan or system into action', example: 'We will implement the new system next quarter.', synonyms: ['execute', 'apply', 'carry out'] },
          { word: 'coordinate', definition: 'Organize people or activities to work together', example: 'James will coordinate the efforts of both teams.', synonyms: ['organize', 'arrange', 'manage'] }
        ],
        completed: false
      },
      {
        id: 4,
        title: 'Reports & Documentation',
        words: [
          { word: 'summary', definition: 'Brief statement covering the main points clearly', example: 'Please provide a summary of the quarterly results.', synonyms: ['overview', 'synopsis', 'abstract'] },
          { word: 'appendix', definition: 'Additional material included at end of document', example: 'The detailed data is included in the appendix.', synonyms: ['supplement', 'addendum', 'attachment'] },
          { word: 'revision', definition: 'Changed or updated version of a document', example: 'The document is now on its third revision.', synonyms: ['amendment', 'modification', 'update'] },
          { word: 'footnote', definition: 'Additional information appearing at page bottom reference', example: 'The source is cited in footnote number five.', synonyms: ['annotation', 'reference', 'note'] },
          { word: 'proofread', definition: 'Check text carefully for errors before finalizing', example: 'Always proofread your documents before sending them out.', synonyms: ['review', 'check', 'edit'] }
        ],
        completed: false
      },
      {
        id: 5,
        title: 'Presentations & Public Speaking',
        words: [
          { word: 'slide', definition: 'Single page of a digital presentation displayed', example: 'The key points are shown on slide seven.', synonyms: ['page', 'screen', 'frame'] },
          { word: 'handout', definition: 'Printed material document given to audience members', example: 'I will distribute handouts at the end of the presentation.', synonyms: ['leaflet', 'document', 'material'] },
          { word: 'projector', definition: 'Electronic device displaying images on large screen', example: 'Please connect your laptop to the projector.', synonyms: ['display', 'screen', 'viewer'] },
          { word: 'rehearse', definition: 'Practice something carefully before performing it publicly', example: 'We should rehearse the presentation before the conference.', synonyms: ['practice', 'prepare', 'drill'] },
          { word: 'engage', definition: 'Attract and hold the attention of audience', example: 'Use storytelling to engage your audience effectively.', synonyms: ['captivate', 'involve', 'interest'] }
        ],
        completed: false
      },
      {
        id: 6,
        title: 'Team Collaboration',
        words: [
          { word: 'collaborate', definition: 'Work jointly with others on shared project', example: 'Our departments collaborate on marketing campaigns regularly.', synonyms: ['cooperate', 'partner', 'team up'] },
          { word: 'delegate', definition: 'Assign tasks or responsibilities officially to others', example: 'Good managers know how to delegate tasks effectively.', synonyms: ['assign', 'entrust', 'transfer'] },
          { word: 'facilitate', definition: 'Make an action or process much easier', example: 'Technology can facilitate communication between remote teams.', synonyms: ['enable', 'assist', 'help'] },
          { word: 'synergy', definition: 'Combined power that is greater than parts', example: 'The synergy between teams produced excellent results.', synonyms: ['cooperation', 'teamwork', 'collaboration'] },
          { word: 'contribute', definition: 'Give something to help achieve a goal', example: 'Everyone should contribute ideas during brainstorming sessions.', synonyms: ['participate', 'provide', 'offer'] }
        ],
        completed: false
      },
      {
        id: 7,
        title: 'Time Management',
        words: [
          { word: 'prioritize', definition: 'Arrange tasks in order of their importance level', example: 'Learn to prioritize your tasks to meet deadlines.', synonyms: ['rank', 'organize', 'order'] },
          { word: 'schedule', definition: 'A plan showing when events will happen clearly', example: 'Please check my schedule for available meeting times.', synonyms: ['timetable', 'calendar', 'agenda'] },
          { word: 'postpone', definition: 'To delay an event to a later time', example: 'We need to postpone the launch until next month.', synonyms: ['delay', 'defer', 'reschedule'] },
          { word: 'allocate', definition: 'Distribute resources for a particular purpose or goal', example: 'We must allocate more time for quality testing.', synonyms: ['assign', 'distribute', 'designate'] },
          { word: 'streamline', definition: 'Make a process more efficient and effective overall', example: 'The new software will streamline our workflow significantly.', synonyms: ['simplify', 'optimize', 'improve'] }
        ],
        completed: false
      },
      {
        id: 8,
        title: 'Client Relations',
        words: [
          { word: 'negotiate', definition: 'Discuss terms to reach an agreement with others', example: 'We need to negotiate the contract terms with clients.', synonyms: ['bargain', 'discuss', 'mediate'] },
          { word: 'proposal', definition: 'A formal suggestion or plan offered for consideration', example: 'The client approved our proposal for the new campaign.', synonyms: ['offer', 'suggestion', 'plan'] },
          { word: 'quotation', definition: 'A statement of the price for goods or services', example: 'Please send a detailed quotation for the project.', synonyms: ['estimate', 'quote', 'price'] },
          { word: 'rapport', definition: 'A friendly relationship built on mutual understanding and trust', example: 'Building rapport with clients is essential for success.', synonyms: ['connection', 'relationship', 'bond'] },
          { word: 'retention', definition: 'Maintaining customers or clients over time successfully today', example: 'Customer retention is more cost-effective than acquisition.', synonyms: ['maintenance', 'preservation', 'keeping'] }
        ],
        completed: false
      },
      {
        id: 9,
        title: 'Performance & Feedback',
        words: [
          { word: 'evaluate', definition: 'To assess the quality or performance of something', example: 'Managers evaluate employee performance twice annually.', synonyms: ['assess', 'review', 'judge'] },
          { word: 'constructive', definition: 'Helpful feedback that is intended to improve something', example: 'Constructive feedback helps employees grow professionally.', synonyms: ['helpful', 'positive', 'productive'] },
          { word: 'appraisal', definition: 'An assessment of the value or quality offered', example: 'Annual appraisals help identify areas for improvement.', synonyms: ['evaluation', 'assessment', 'review'] },
          { word: 'benchmark', definition: 'A standard that is used for comparison purposes', example: 'Industry benchmarks help us measure our performance.', synonyms: ['standard', 'reference', 'measure'] },
          { word: 'excel', definition: 'To be very good at something you do', example: 'She excels at managing difficult client relationships.', synonyms: ['surpass', 'succeed', 'shine'] }
        ],
        completed: false
      },
      {
        id: 10,
        title: 'Office Technology',
        words: [
          { word: 'platform', definition: 'A digital system for running applications or services', example: 'We use a cloud platform for team collaboration.', synonyms: ['system', 'interface', 'framework'] },
          { word: 'software', definition: 'Programs and applications that are used by computers', example: 'The company invested in new project management software.', synonyms: ['program', 'application', 'system'] },
          { word: 'interface', definition: 'A point where users interact with the system', example: 'The user interface is intuitive and easy to navigate.', synonyms: ['display', 'screen', 'dashboard'] },
          { word: 'integrate', definition: 'To combine different systems to work together effectively', example: 'We need to integrate our sales and accounting systems.', synonyms: ['combine', 'merge', 'unite'] },
          { word: 'troubleshoot', definition: 'To identify and solve problems with systems today', example: 'IT staff will troubleshoot any technical issues promptly.', synonyms: ['diagnose', 'fix', 'resolve'] }
        ],
        completed: false
      },
      {
        id: 11,
        title: 'Business Strategy',
        words: [
          { word: 'objective', definition: 'A specific goal that is planned to be achieved', example: 'Our main objective is to increase market share.', synonyms: ['goal', 'target', 'aim'] },
          { word: 'initiative', definition: 'A new plan or process to achieve something', example: 'The company launched a new sustainability initiative.', synonyms: ['program', 'project', 'campaign'] },
          { word: 'forecast', definition: 'A prediction of future trends or events coming', example: 'Sales forecasts indicate strong growth next quarter.', synonyms: ['prediction', 'projection', 'estimate'] },
          { word: 'competitive', definition: 'Related to rivalry between businesses or people competing', example: 'We offer competitive salaries to attract top talent.', synonyms: ['rival', 'opposing', 'challenging'] },
          { word: 'leverage', definition: 'To use something to gain an advantage effectively', example: 'We can leverage social media for brand awareness.', synonyms: ['utilize', 'exploit', 'use'] }
        ],
        completed: false
      },
      {
        id: 12,
        title: 'Workplace Policies',
        words: [
          { word: 'protocol', definition: 'Official procedure or system of rules to follow', example: 'Follow the security protocol when entering the building.', synonyms: ['procedure', 'guideline', 'rules'] },
          { word: 'compliance', definition: 'Following rules regulations or standards that are established', example: 'All employees must ensure compliance with data protection laws.', synonyms: ['adherence', 'conformity', 'obedience'] },
          { word: 'confidential', definition: 'Information that is meant to be kept secret', example: 'This document contains confidential client information.', synonyms: ['private', 'secret', 'restricted'] },
          { word: 'authorization', definition: 'Official permission for something to happen or occur', example: 'You need authorization from your manager for expenses.', synonyms: ['permission', 'approval', 'consent'] },
          { word: 'procedure', definition: 'An established way of doing tasks or activities', example: 'The evacuation procedure is posted on every floor.', synonyms: ['process', 'method', 'protocol'] }
        ],
        completed: false
      },
      {
        id: 13,
        title: 'Professional Development',
        words: [
          { word: 'mentor', definition: 'An experienced person who advises and guides others', example: 'Having a mentor can accelerate your career growth.', synonyms: ['advisor', 'coach', 'guide'] },
          { word: 'seminar', definition: 'A meeting organized for training or discussion purposes', example: 'The marketing seminar attracted over two hundred participants.', synonyms: ['workshop', 'conference', 'training'] },
          { word: 'certification', definition: 'Official recognition of skills or knowledge you have', example: 'Project management certification will enhance your resume.', synonyms: ['accreditation', 'qualification', 'credential'] },
          { word: 'upskill', definition: 'To learn new skills or improve existing ones', example: 'Employees are encouraged to upskill through online courses.', synonyms: ['train', 'develop', 'improve'] },
          { word: 'networking', definition: 'Building professional relationships for mutual benefit and support', example: 'Networking events help professionals exchange ideas and contacts.', synonyms: ['connecting', 'socializing', 'relationship-building'] }
        ],
        completed: false
      },
      {
        id: 14,
        title: 'Financial Terms',
        words: [
          { word: 'invoice', definition: 'A document requesting payment for goods or services', example: 'Please process this invoice by the end of the month.', synonyms: ['bill', 'statement', 'charge'] },
          { word: 'expense', definition: 'Money that is spent for business purposes today', example: 'Submit your travel expenses within five business days.', synonyms: ['cost', 'expenditure', 'charge'] },
          { word: 'reimbursement', definition: 'Repayment of money spent on business activities earlier', example: 'Reimbursement requests must include original receipts.', synonyms: ['repayment', 'refund', 'compensation'] },
          { word: 'overhead', definition: 'Ongoing business costs not directly related to production', example: 'Reducing overhead costs improved our profit margins significantly.', synonyms: ['expenses', 'costs', 'outgoings'] },
          { word: 'reconcile', definition: 'To make financial records consistent and accurate today', example: 'Accountants reconcile bank statements monthly.', synonyms: ['balance', 'match', 'verify'] }
        ],
        completed: false
      },
      {
        id: 15,
        title: 'Human Resources',
        words: [
          { word: 'recruit', definition: 'To find and hire new employees for company', example: 'The HR department will recruit five new developers.', synonyms: ['hire', 'employ', 'enlist'] },
          { word: 'onboard', definition: 'To integrate new employees into the company culture', example: 'We have a comprehensive program to onboard new hires.', synonyms: ['orient', 'integrate', 'train'] },
          { word: 'terminate', definition: 'To end someone employment at company unfortunately today', example: 'The company had to terminate several positions unfortunately.', synonyms: ['dismiss', 'fire', 'discharge'] },
          { word: 'benefits', definition: 'Additional advantages that are provided to employees regularly', example: 'Our benefits package includes health insurance and retirement plans.', synonyms: ['perks', 'advantages', 'compensation'] },
          { word: 'grievance', definition: 'A formal complaint about unfair treatment at work', example: 'Employees can file a grievance with the HR department.', synonyms: ['complaint', 'objection', 'protest'] }
        ],
        completed: false
      },
      {
        id: 16,
        title: 'Marketing & Sales',
        words: [
          { word: 'campaign', definition: 'Organized activities to promote a product or service', example: 'The digital marketing campaign increased website traffic significantly.', synonyms: ['initiative', 'promotion', 'drive'] },
          { word: 'prospect', definition: 'A potential customer who may buy products soon', example: 'Sales teams should qualify prospects before pitching.', synonyms: ['lead', 'potential client', 'candidate'] },
          { word: 'conversion', definition: 'Turning potential customers into actual buyers successfully today', example: 'Our conversion rate improved after website optimization.', synonyms: ['transformation', 'change', 'switch'] },
          { word: 'outreach', definition: 'Efforts to connect with potential customers or partners', example: 'Social media outreach expanded our customer base.', synonyms: ['engagement', 'contact', 'communication'] },
          { word: 'branding', definition: 'Creating a unique identity for a product today', example: 'Strong branding helps companies stand out from competitors.', synonyms: ['marketing', 'promotion', 'identity'] }
        ],
        completed: false
      },
      {
        id: 17,
        title: 'Customer Service',
        words: [
          { word: 'inquiry', definition: 'A request for information about products or services', example: 'Customer service handled over fifty inquiries today.', synonyms: ['question', 'query', 'request'] },
          { word: 'complaint', definition: 'An expression of dissatisfaction about a service received', example: 'We take every customer complaint seriously and investigate thoroughly.', synonyms: ['grievance', 'objection', 'criticism'] },
          { word: 'resolution', definition: 'The solution to a problem or complaint raised', example: 'Quick resolution of issues improves customer satisfaction.', synonyms: ['solution', 'answer', 'settlement'] },
          { word: 'escalate', definition: 'To refer a problem to a higher authority', example: 'Please escalate urgent issues to the supervisor immediately.', synonyms: ['elevate', 'intensify', 'raise'] },
          { word: 'courtesy', definition: 'Polite behavior and consideration shown to others today', example: 'Treating customers with courtesy creates positive experiences.', synonyms: ['politeness', 'respect', 'civility'] }
        ],
        completed: false
      },
      {
        id: 18,
        title: 'Quality & Standards',
        words: [
          { word: 'compliance', definition: 'Following established rules and regulations that are set', example: 'Quality compliance ensures products meet safety standards.', synonyms: ['conformity', 'adherence', 'obedience'] },
          { word: 'audit', definition: 'An official examination of records or processes done', example: 'The annual audit confirmed our accounting practices are sound.', synonyms: ['inspection', 'review', 'examination'] },
          { word: 'defect', definition: 'A fault or imperfection in a product found', example: 'Quality control identified several defects in the batch.', synonyms: ['flaw', 'fault', 'error'] },
          { word: 'specification', definition: 'A detailed description of requirements or standards needed', example: 'Products must meet exact specifications before shipping.', synonyms: ['requirement', 'standard', 'detail'] },
          { word: 'consistency', definition: 'Maintaining the same standards over time consistently today', example: 'Consistency in service quality builds customer trust.', synonyms: ['uniformity', 'reliability', 'stability'] }
        ],
        completed: false
      },
      {
        id: 19,
        title: 'Remote Work',
        words: [
          { word: 'virtual', definition: 'Existing online rather than in physical space today', example: 'Virtual meetings allow teams to collaborate from anywhere.', synonyms: ['online', 'digital', 'remote'] },
          { word: 'bandwidth', definition: 'The capacity to handle data or workload effectively', example: 'Do you have enough bandwidth to take on another project?', synonyms: ['capacity', 'availability', 'resources'] },
          { word: 'asynchronous', definition: 'Not happening at the same time as others', example: 'Asynchronous communication allows flexible work schedules.', synonyms: ['non-simultaneous', 'delayed', 'time-shifted'] },
          { word: 'connectivity', definition: 'The state of being connected to networks properly', example: 'Reliable internet connectivity is essential for remote work.', synonyms: ['connection', 'access', 'networking'] },
          { word: 'timezone', definition: 'A region with the same standard time today', example: 'Schedule meetings that accommodate everyone\'s timezone.', synonyms: ['time region', 'time area', 'time zone'] }
        ],
        completed: false
      },
      {
        id: 20,
        title: 'Leadership & Management',
        words: [
          { word: 'accountability', definition: 'Being responsible for decisions and actions you take', example: 'Good leaders demonstrate accountability for their team\'s performance.', synonyms: ['responsibility', 'liability', 'answerability'] },
          { word: 'empower', definition: 'To give authority or confidence to someone else', example: 'Great managers empower employees to make independent decisions.', synonyms: ['authorize', 'enable', 'equip'] },
          { word: 'transparent', definition: 'Open and honest communication and actions with others', example: 'Transparent communication builds trust within the organization.', synonyms: ['clear', 'open', 'honest'] },
          { word: 'vision', definition: 'A clear idea of future goals and direction', example: 'The CEO shared her vision for the company\'s future.', synonyms: ['outlook', 'plan', 'goal'] },
          { word: 'inspire', definition: 'To motivate or encourage others to achieve goals', example: 'Effective leaders inspire their teams to achieve excellence.', synonyms: ['motivate', 'encourage', 'stimulate'] }
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
    icon: '',
    sets: [
      {
        id: 1,
        title: 'Travel & Booking',
        words: [
          { word: 'pack', definition: 'To put belongings into bags for travel', example: 'We packed last night so catching the early train felt easy.', synonyms: ['load', 'stow', 'bundle', 'bag'] },
          { word: 'book', definition: 'To reserve and pay for a service', example: 'Let\u2019s book the hotel today before the prices go up.', synonyms: ['reserve', 'schedule', 'arrange', 'secure'] },
          { word: 'cancel', definition: 'To decide something will not happen now', example: 'They canceled the tour because storms affected mountain roads all weekend.', synonyms: ['scrap', 'abort', 'drop', 'call off'] },
          { word: 'arrive', definition: 'To reach a place at planned time', example: 'Trains usually arrive on time unless there\u2019s maintenance on the line.', synonyms: ['reach', 'come', 'land', 'get to'] },
          { word: 'depart', definition: 'To leave a place at a scheduled time', example: 'Buses depart every hour, even during holidays and local events.', synonyms: ['leave', 'go', 'exit', 'set off'] }
        ],
        completed: false
      },
      {
        id: 2,
        title: 'Health & Fitness',
        words: [
          { word: 'stretch', definition: 'To extend muscles gently to improve flexibility', example: 'Stretch for five minutes before running to prevent tight calves.', synonyms: ['extend', 'lengthen', 'loosen', 'limber'] },
          { word: 'hydrate', definition: 'To drink enough water to stay healthy', example: 'Remember to hydrate during hot days, even if you\u2019re indoors.', synonyms: ['drink', 'water', 'replenish', 'rehydrate'] },
          { word: 'rest', definition: 'To stop activity to recover your strength', example: 'After training, rest briefly so your muscles repair effectively.', synonyms: ['relax', 'unwind', 'recover', 'pause'] },
          { word: 'breathe', definition: 'To take air in and out slowly', example: 'When nervous, breathe deeply and count slowly to five.', synonyms: ['inhale', 'exhale', 'respire', 'draw breath'] },
          { word: 'exercise', definition: 'To move your body regularly for fitness', example: 'Doctors say exercise three times weekly to support heart health.', synonyms: ['train', 'practise', 'work out', 'drill'] }
        ],
        completed: false
      },
      {
        id: 3,
        title: 'Study Skills',
        words: [
          { word: 'review', definition: 'To look again to check and improve', example: 'Please review chapter five before tomorrow\u2019s short quiz.', synonyms: ['check', 'revisit', 'go over', 'revise'] },
          { word: 'memorize', definition: 'To learn information so you remember later', example: 'I memorize new words with flashcards every night.', synonyms: ['learn', 'remember', 'retain', 'commit'] },
          { word: 'practice', definition: 'To repeat activities to build strong skills', example: 'Musicians practice daily to keep their hands relaxed.', synonyms: ['train', 'rehearse', 'drill', 'exercise'] },
          { word: 'summarize', definition: 'To present main ideas briefly and clearly', example: 'First summarize the article, then share your opinion politely.', synonyms: ['sum up', 'condense', 'outline', 'recap'] },
          { word: 'focus', definition: 'To give full attention to one task', example: 'Turn off notifications so you can focus during study time.', synonyms: ['concentrate', 'pay attention', 'zero in', 'direct'] }
        ],
        completed: false
      },
      {
        id: 4,
        title: 'Home & DIY',
        words: [
          { word: 'sweep', definition: 'To clean a floor by moving a broom', example: 'Please sweep the kitchen before guests arrive tonight.', synonyms: ['brush', 'clean', 'clear', 'tidy'] },
          { word: 'boil', definition: 'To heat liquid until it bubbles strongly', example: 'Boil the pasta water, then add salt and noodles.', synonyms: ['heat', 'bubble', 'cook', 'seethe'] },
          { word: 'fix', definition: 'To repair something so it works again', example: 'A technician can fix the heater this afternoon after lunch.', synonyms: ['repair', 'mend', 'restore', 'patch'] },
          { word: 'plant', definition: 'To put seeds or young trees into soil', example: 'We\u2019ll plant tomatoes near the fence after the frost.', synonyms: ['sow', 'seed', 'put in', 'transplant'] },
          { word: 'measure', definition: 'To find size or amount using tools', example: 'Measure the wall first so the shelves will fit perfectly.', synonyms: ['gauge', 'size up', 'quantify', 'check'] }
        ],
        completed: false
      },
      {
        id: 5,
        title: 'Weather & Nature',
        words: [
          { word: 'shine', definition: 'To give bright light like the sun', example: 'The lantern shone all night during the campsite storm.', synonyms: ['glow', 'gleam', 'beam', 'sparkle'] },
          { word: 'rain', definition: 'To fall as water drops from clouds', example: 'It rained all morning, then the sun came out.', synonyms: ['pour', 'drizzle', 'shower', 'rain down'] },
          { word: 'freeze', definition: 'To become very cold and turn solid', example: 'The lake can freeze overnight during sudden winter storms.', synonyms: ['solidify', 'ice', 'chill', 'harden'] },
          { word: 'melt', definition: 'To become liquid again after being solid', example: 'The snow will melt by noon if the wind turns warm.', synonyms: ['thaw', 'liquefy', 'soften', 'dissolve'] },
          { word: 'shelter', definition: 'To stay somewhere safe from bad weather', example: 'Hikers sheltered under trees until the storm finally passed.', synonyms: ['protect', 'shield', 'hide', 'take cover'] }
        ],
        completed: false
      },
      {
        id: 6,
        title: 'Opinions & Decisions',
        words: [
          { word: 'refuse', definition: 'To say no and not accept something', example: 'He refused the offer politely after reading the contract carefully.', synonyms: ['decline', 'reject', 'turn down', 'deny'] },
          { word: 'consider', definition: 'To think carefully before making a decision', example: 'Before renting, consider travel time and the total monthly costs.', synonyms: ['think about', 'contemplate', 'weigh', 'regard'] },
          { word: 'suggest', definition: 'To offer an idea for careful consideration', example: 'Could you suggest another route that avoids the toll road?', synonyms: ['propose', 'recommend', 'put forward', 'advise'] },
          { word: 'avoid', definition: 'To keep away from something potentially unpleasant', example: 'Drivers avoid the bridge at five because traffic is terrible.', synonyms: ['steer clear', 'shun', 'dodge', 'keep away'] },
          { word: 'agree', definition: 'To share the same opinion as someone else', example: 'After some discussion, we agreed to split the work evenly.', synonyms: ['consent', 'concur', 'go along', 'assent'] }
        ],
        completed: false
      },
      {
        id: 7,
        title: 'Community & Volunteering',
        words: [
          { word: 'organize', definition: 'To arrange things so activities run smoothly', example: 'We organized volunteers and tables before the charity market opened.', synonyms: ['arrange', 'set up', 'coordinate', 'sort out'] },
          { word: 'volunteer', definition: 'To offer help without expecting any payment', example: 'Many residents volunteer on weekends to clean riverside paths.', synonyms: ['offer', 'pitch in', 'step forward', 'help'] },
          { word: 'support', definition: 'To help someone by giving practical assistance', example: 'Families support new arrivals with transport, food, and friendly advice.', synonyms: ['assist', 'back', 'help', 'stand by'] },
          { word: 'collect', definition: 'To bring together items from different places', example: 'Please collect the donation boxes before the visitors arrive.', synonyms: ['gather', 'pick up', 'assemble', 'accumulate'] },
          { word: 'advertise', definition: 'To promote something publicly to attract customers', example: 'To sell more tickets, we\'ll advertise on local radio tomorrow.', synonyms: ['promote', 'publicize', 'market', 'spread'] }
        ],
        completed: false
      },
      {
        id: 8,
        title: 'Tech Setup',
        words: [
          { word: 'install', definition: 'To put software or equipment in place', example: 'Please install the printer before the class begins at nine.', synonyms: ['set up', 'put in', 'configure', 'mount'] },
          { word: 'update', definition: 'To make something newer with recent changes', example: 'Remember to update apps to fix bugs and improve security.', synonyms: ['upgrade', 'refresh', 'patch', 'revise'] },
          { word: 'download', definition: 'To transfer files from internet onto device', example: 'Before the trip, download maps so they work without data.', synonyms: ['get', 'save', 'fetch', 'pull down'] },
          { word: 'reset', definition: 'To return settings to their original state', example: 'When passwords fail repeatedly, reset your account through the link.', synonyms: ['restore', 'restart', 'revert', 'clear'] },
          { word: 'attach', definition: 'To fasten or add something to something', example: 'Don\'t forget to attach the receipt to your reimbursement email.', synonyms: ['fasten', 'clip', 'join', 'add'] }
        ],
        completed: false
      },
      {
        id: 9,
        title: 'Health & Recovery',
        words: [
          { word: 'prevent', definition: 'To stop something bad from happening again', example: 'Good handwashing helps prevent stomach bugs during holiday trips.', synonyms: ['stop', 'avoid', 'block', 'avert'] },
          { word: 'recover', definition: 'To get better after illness or difficulty', example: 'It may take weeks to recover fully after the operation.', synonyms: ['heal', 'get better', 'bounce back', 'regain'] },
          { word: 'reduce', definition: 'To make something smaller in amount overall', example: 'Regular breaks can reduce eye strain during long computer sessions.', synonyms: ['lessen', 'decrease', 'lower', 'cut'] },
          { word: 'improve', definition: 'To make something better in quality overall', example: 'Practice can improve your pronunciation within a few weeks.', synonyms: ['enhance', 'upgrade', 'better', 'develop'] },
          { word: 'treat', definition: 'To give medical care to someone properly', example: 'The clinic can treat minor injuries without an appointment today.', synonyms: ['care for', 'medicate', 'cure', 'attend'] }
        ],
        completed: false
      },
      {
        id: 10,
        title: 'Scheduling & Appointments',
        words: [
          { word: 'schedule', definition: 'To set a time for something later', example: 'We should schedule the interview before the end of today.', synonyms: ['arrange', 'set', 'book', 'timetable'] },
          { word: 'confirm', definition: 'To say a detail is correct officially', example: 'Could you confirm the delivery window before tomorrow morning?', synonyms: ['verify', 'check', 'approve', 'certify'] },
          { word: 'cancel', definition: 'To decide something will not take place', example: 'If the speaker is ill, we must cancel the talk.', synonyms: ['call off', 'scrap', 'abort', 'drop'] },
          { word: 'reschedule', definition: 'To change a planned time to another', example: 'If trains are late, we should reschedule the afternoon meeting.', synonyms: ['rearrange', 'move', 'push back', 'postpone'] },
          { word: 'remind', definition: 'To help someone remember a future task', example: 'Can you remind me to send the invoice tonight?', synonyms: ['prompt', 'nudge', 'jog memory', 'alert'] }
        ],
        completed: false
      },
      {
        id: 11,
        title: 'Rules & Requests',
        words: [
          { word: 'warn', definition: 'To tell about danger to prevent harm', example: 'The signs warn hikers about falling rocks after heavy rain.', synonyms: ['caution', 'alert', 'notify', 'forewarn'] },
          { word: 'permit', definition: 'To officially allow someone to do something', example: 'The staff permit visitors to take photos without a flash.', synonyms: ['allow', 'authorize', 'let', 'approve'] },
          { word: 'forbid', definition: 'To say something is not allowed officially', example: 'Many parks forbid fires during hot, windy summer weekends.', synonyms: ['ban', 'prohibit', 'bar', 'disallow'] },
          { word: 'advise', definition: 'To give suggestions to help someone\'s decision', example: 'Doctors advise patients to rest if symptoms continue for days.', synonyms: ['recommend', 'counsel', 'suggest', 'guide'] },
          { word: 'request', definition: 'To politely ask for something from someone', example: 'You can request extra towels at reception any time tonight.', synonyms: ['ask', 'seek', 'petition', 'solicit'] }
        ],
        completed: false
      },
      {
        id: 12,
        title: 'Orders & Delivery',
        words: [
          { word: 'charge', definition: 'To ask payment amount for a service', example: 'The shop will charge a small fee for home delivery.', synonyms: ['bill', 'price', 'invoice', 'levy'] },
          { word: 'refund', definition: 'To give money back after a problem', example: 'They\'ll refund the ticket if the train is fully canceled.', synonyms: ['repay', 'reimburse', 'return', 'compensate'] },
          { word: 'replace', definition: 'To put a new thing instead of old', example: 'Please replace the batteries if the remote stops working suddenly.', synonyms: ['substitute', 'swap', 'change', 'renew'] },
          { word: 'ship', definition: 'To send goods to a customer somewhere', example: 'They ship orders daily, even during busy holiday weeks.', synonyms: ['send', 'dispatch', 'mail', 'deliver'] },
          { word: 'track', definition: 'To follow progress or location over time', example: 'Customers track parcels online using the code from the receipt.', synonyms: ['follow', 'monitor', 'trace', 'check'] }
        ],
        completed: false
      },
      {
        id: 13,
        title: 'Conversation & Disagreement',
        words: [
          { word: 'persuade', definition: 'To make someone agree by giving reasons', example: 'She persuaded her parents to let her join the trip.', synonyms: ['convince', 'influence', 'sway', 'win over'] },
          { word: 'argue', definition: 'To speak strongly because you disagree', example: 'Neighbors argued about parking until the council changed the plan.', synonyms: ['dispute', 'quarrel', 'contend', 'disagree'] },
          { word: 'reply', definition: 'To answer after receiving a message', example: 'Please reply within two days so we can confirm numbers.', synonyms: ['answer', 'respond', 'write back', 'return'] },
          { word: 'interrupt', definition: 'To stop someone speaking for a moment', example: 'Please don\'t interrupt while I\'m explaining the safety steps.', synonyms: ['cut in', 'interject', 'break in', 'disturb'] },
          { word: 'apologize', definition: 'To say sorry for a mistake', example: 'He apologized for the noise and offered to help repair it.', synonyms: ['say sorry', 'make amends', 'atone', 'apologize to'] }
        ],
        completed: false
      },
      {
        id: 14,
        title: 'Reservations & Changes',
        words: [
          { word: 'reserve', definition: 'To book something for your future use', example: 'Let\'s reserve seats now so we can sit together.', synonyms: ['book', 'secure', 'hold', 'set aside'] },
          { word: 'extend', definition: 'To make a period or length longer', example: 'They extended their stay to see family over the weekend.', synonyms: ['lengthen', 'prolong', 'continue', 'stretch'] },
          { word: 'upgrade', definition: 'To change to a better, newer level', example: 'The hotel upgraded our room because the lift was broken.', synonyms: ['improve', 'update', 'move up', 'advance'] },
          { word: 'cancel', definition: 'To decide an event will not happen', example: 'They canceled the tour because of dangerous winds near cliffs.', synonyms: ['call off', 'scrap', 'abort', 'drop'] },
          { word: 'reschedule', definition: 'To change a planned time to another', example: 'We rescheduled the interview after the power cut last night.', synonyms: ['rearrange', 'move', 'postpone', 'push back'] }
        ],
        completed: false
      },
      {
        id: 15,
        title: 'Assembly & Fixing',
        words: [
          { word: 'assemble', definition: 'To put parts together to make something', example: 'We assembled the shelves carefully using the picture instructions.', synonyms: ['build', 'put together', 'construct', 'set up'] },
          { word: 'adjust', definition: 'To change slightly so it fits better', example: 'You may adjust the chair height for better back support.', synonyms: ['modify', 'alter', 'tune', 'tweak'] },
          { word: 'connect', definition: 'To join two things so they work', example: 'After connecting the cables, the monitor finally showed the picture.', synonyms: ['link', 'join', 'attach', 'plug'] },
          { word: 'secure', definition: 'To fasten firmly so it stays safe', example: 'Always secure ladders before climbing to check the roof tiles.', synonyms: ['fasten', 'fix', 'lock', 'tie'] },
          { word: 'polish', definition: 'To rub a surface until it shines', example: 'We polished the wooden table before setting plates and flowers.', synonyms: ['shine', 'buff', 'rub', 'brighten'] }
        ],
        completed: false
      },
      {
        id: 16,
        title: 'Food & Cooking',
        words: [
          { word: 'order', definition: 'To ask for food or items to buy', example: 'We\'ll order two pizzas and a salad for the group.', synonyms: ['request', 'purchase', 'place order', 'order in'] },
          { word: 'serve', definition: 'To give food or help to people', example: 'They serve breakfast until eleven on weekends and holidays.', synonyms: ['give', 'hand out', 'present', 'provide'] },
          { word: 'taste', definition: 'To try small amount to check flavor', example: 'Always taste the sauce before adding more salt.', synonyms: ['sample', 'try', 'savor', 'test'] },
          { word: 'chop', definition: 'To cut something into small pieces quickly', example: 'Chop the onions finely and keep your fingers safe.', synonyms: ['cut', 'dice', 'slice', 'mince'] },
          { word: 'stir', definition: 'To move food around to mix evenly', example: 'Stir the porridge slowly so it doesn\'t stick or burn.', synonyms: ['mix', 'blend', 'whisk', 'agitate'] },
        ],
        completed: false
      },
      {
        id: 17,
        title: 'Emotions & Reactions',
        words: [
          { word: 'worry', definition: 'To feel anxious about possible problems', example: 'Try not to worry; the results arrive tomorrow afternoon.', synonyms: ['fret', 'be anxious', 'stress'] },
          { word: 'cheer', definition: 'To make someone feel happier or hopeful', example: 'A short message can cheer friends during tough weeks.', synonyms: ['encourage', 'hearten', 'brighten'] },
          { word: 'forgive', definition: 'To stop being angry about someone\'s mistake', example: 'She chose to forgive him after his honest apology.', synonyms: ['pardon', 'excuse', 'let go'] },
          { word: 'praise', definition: 'To say good things about someone\'s work', example: 'Teachers praise effort when students keep trying after mistakes.', synonyms: ['compliment', 'applaud', 'commend'] },
          { word: 'regret', definition: 'To feel sorry about something that happened', example: 'You might regret speaking quickly without checking the facts first.', synonyms: ['be sorry', 'lament', 'rue'] },
        ],
        completed: false
      },
      {
        id: 18,
        title: 'Laundry & Household',
        words: [
          { word: 'heat', definition: 'To make something warmer using energy', example: 'We heat the living room before guests arrive tonight.', synonyms: ['warm', 'heat up', 'warm up'] },
          { word: 'cool', definition: 'To make something less warm or hot', example: 'Open the window to cool the room after cooking.', synonyms: ['chill', 'cool down', 'lower'] },
          { word: 'dry', definition: 'To remove water so something becomes dry', example: 'Hang the shirts to dry near the sunny window.', synonyms: ['dry out', 'air dry', 'dehydrate'] },
          { word: 'fold', definition: 'To bend paper or cloth into layers', example: 'Please fold the towels and stack them by size.', synonyms: ['bend', 'crease', 'double'] },
          { word: 'iron', definition: 'To press clothes flat with a hot iron', example: 'I iron the trousers before interviews to look tidy.', synonyms: ['press', 'smooth', 'flatten'] },
        ],
        completed: false
      },
      {
        id: 19,
        title: 'Hobbies & Outdoors',
        words: [
          { word: 'paint', definition: 'To cover a surface with colored liquid', example: 'We paint small models together on quiet Sunday afternoons.', synonyms: ['color', 'decorate', 'coat'] },
          { word: 'draw', definition: 'To make pictures using lines and shapes', example: 'Children draw animals first, then add backgrounds and color.', synonyms: ['sketch', 'outline', 'illustrate'] },
          { word: 'camp', definition: 'To sleep outside in tents for fun', example: 'We camp near the river and watch stars after dinner.', synonyms: ['pitch tents', 'sleep outdoors', 'stay in tents'] },
          { word: 'hike', definition: 'To walk long distances for exercise', example: 'They hike coastal paths when the weather is clear.', synonyms: ['trek', 'ramble', 'walk far'] },
          { word: 'swim', definition: 'To move through water using arms and legs', example: 'We swim a few laps before breakfast on holidays.', synonyms: ['paddle', 'do laps', 'bathe'] },
        ],
        completed: false
      },
      {
        id: 20,
        title: 'Forms & Office Tasks',
        words: [
          { word: 'fill in', definition: 'To complete a form by writing details', example: 'Please fill in the visitor form before you enter.', synonyms: ['complete', 'write in', 'enter details'] },
          { word: 'submit', definition: 'To send work or forms for approval', example: 'You must submit timesheets by noon each Friday.', synonyms: ['send in', 'hand in', 'turn in'] },
          { word: 'print', definition: 'To make a paper copy from digital files', example: 'Only print the final draft to save paper and ink.', synonyms: ['produce', 'make copy', 'output'] },
          { word: 'sign', definition: 'To write your name to show agreement', example: 'Don\'t sign anything until you read the final version.', synonyms: ['write name', 'autograph', 'sign off'] },
          { word: 'file', definition: 'To store documents in a specific place', example: 'After approval, file the invoices by month and project.', synonyms: ['archive', 'store', 'put away'] },
        ],
        completed: false
      },
      {
        id: 21,
        title: 'Problem Solving',
        words: [
          { word: 'solve', definition: 'To find the answer to a problem or question', example: 'Engineers solve complex problems using mathematical models daily.', synonyms: ['resolve', 'work out', 'figure out', 'crack'] },
          { word: 'improve', definition: 'To make something better than before', example: 'Regular practice helps improve your speaking skills gradually.', synonyms: ['enhance', 'upgrade', 'better', 'refine'] },
          { word: 'adjust', definition: 'To change something slightly to make it fit', example: 'You may need to adjust the settings for optimal results.', synonyms: ['modify', 'adapt', 'alter', 'tweak'] },
          { word: 'overcome', definition: 'To succeed in dealing with a difficulty', example: 'She overcame her fear of public speaking through practice.', synonyms: ['conquer', 'defeat', 'beat', 'surmount'] },
          { word: 'prevent', definition: 'To stop something from happening before it does', example: 'Washing hands regularly helps prevent the spread of illness.', synonyms: ['stop', 'avoid', 'avert', 'block'] }
        ],
        completed: false
      },
      {
        id: 22,
        title: 'Opinions & Views',
        words: [
          { word: 'agree', definition: 'To have the same opinion as someone else', example: 'Most committee members agree that changes are necessary now.', synonyms: ['concur', 'accept', 'consent', 'approve'] },
          { word: 'disagree', definition: 'To have a different opinion from someone', example: 'Experts often disagree about the best approach to take.', synonyms: ['differ', 'dispute', 'object', 'oppose'] },
          { word: 'suggest', definition: 'To put forward an idea for consideration', example: 'I suggest we meet tomorrow to discuss the proposal details.', synonyms: ['propose', 'recommend', 'advise', 'put forward'] },
          { word: 'argue', definition: 'To give reasons for or against something', example: 'The lawyer argued that the evidence was insufficient clearly.', synonyms: ['debate', 'contend', 'dispute', 'reason'] },
          { word: 'convince', definition: 'To make someone believe or agree with you', example: 'Her presentation convinced the board to approve the budget.', synonyms: ['persuade', 'sway', 'win over', 'assure'] }
        ],
        completed: false
      },
      {
        id: 23,
        title: 'Business Basics',
        words: [
          { word: 'invest', definition: 'To put money into something to gain profit', example: 'Many people invest in stocks for long-term growth.', synonyms: ['fund', 'finance', 'put money in', 'back'] },
          { word: 'profit', definition: 'Money gained after all costs are paid', example: 'The company made a healthy profit last quarter overall.', synonyms: ['gain', 'earnings', 'return', 'income'] },
          { word: 'compete', definition: 'To try to win against others in same field', example: 'Small businesses compete with larger chains for customers.', synonyms: ['rival', 'contend', 'vie', 'challenge'] },
          { word: 'expand', definition: 'To make something larger or more extensive', example: 'The company plans to expand into European markets soon.', synonyms: ['grow', 'extend', 'enlarge', 'develop'] },
          { word: 'negotiate', definition: 'To discuss to reach an agreement with others', example: 'Union leaders negotiate better working conditions for employees.', synonyms: ['bargain', 'discuss terms', 'deal', 'mediate'] }
        ],
        completed: false
      },
      {
        id: 24,
        title: 'Technology & Devices',
        words: [
          { word: 'download', definition: 'To copy data from internet to your device', example: 'You can download the app free from the official store.', synonyms: ['save', 'transfer', 'copy', 'get'] },
          { word: 'upload', definition: 'To send data from your device to internet', example: 'Please upload your documents to the shared folder today.', synonyms: ['transfer', 'send', 'post', 'share'] },
          { word: 'update', definition: 'To make something more modern or current', example: 'Remember to update your software to fix security issues.', synonyms: ['upgrade', 'refresh', 'renew', 'modernize'] },
          { word: 'connect', definition: 'To join or link things together successfully', example: 'The app helps you connect with professionals in your field.', synonyms: ['link', 'join', 'attach', 'couple'] },
          { word: 'search', definition: 'To look carefully to find something specific', example: 'You can search the database using keywords or dates.', synonyms: ['look for', 'seek', 'hunt', 'explore'] }
        ],
        completed: false
      },
      {
        id: 25,
        title: 'Health & Wellness',
        words: [
          { word: 'recover', definition: 'To get better after illness or difficult time', example: 'It takes time to recover fully from major surgery.', synonyms: ['heal', 'get better', 'recuperate', 'bounce back'] },
          { word: 'relax', definition: 'To become less tense and more calm', example: 'Try to relax your muscles before starting the exercise.', synonyms: ['unwind', 'rest', 'calm down', 'chill'] },
          { word: 'breathe', definition: 'To take air in and out of your lungs', example: 'Breathe deeply and slowly to reduce your stress levels.', synonyms: ['inhale', 'exhale', 'respire', 'gasp'] },
          { word: 'stretch', definition: 'To extend your body or muscles fully', example: 'Athletes stretch their muscles before and after training.', synonyms: ['extend', 'reach', 'flex', 'lengthen'] },
          { word: 'balance', definition: 'To keep steady without falling over', example: 'Yoga helps improve your balance and flexibility significantly.', synonyms: ['steady', 'stabilize', 'poise', 'equilibrium'] }
        ],
        completed: false
      },
      {
        id: 26,
        title: 'Environment & Nature',
        words: [
          { word: 'pollute', definition: 'To make air, water, or land dirty and harmful', example: 'Factories that pollute rivers face heavy fines now.', synonyms: ['contaminate', 'dirty', 'poison', 'taint'] },
          { word: 'recycle', definition: 'To process waste so it can be used again', example: 'We recycle paper, glass, and plastic at home weekly.', synonyms: ['reuse', 'reprocess', 'convert', 'salvage'] },
          { word: 'protect', definition: 'To keep safe from harm or damage', example: 'Laws exist to protect endangered species from extinction.', synonyms: ['guard', 'defend', 'shield', 'preserve'] },
          { word: 'conserve', definition: 'To use carefully to prevent waste', example: 'We should conserve water during the dry summer months.', synonyms: ['save', 'preserve', 'maintain', 'protect'] },
          { word: 'sustain', definition: 'To maintain something at a certain level', example: 'Renewable energy helps sustain our planet for future generations.', synonyms: ['maintain', 'support', 'keep up', 'continue'] }
        ],
        completed: false
      },
      {
        id: 27,
        title: 'Social Interactions',
        words: [
          { word: 'introduce', definition: 'To tell people each other\'s names when meeting', example: 'Let me introduce you to my colleague from marketing.', synonyms: ['present', 'acquaint', 'make known', 'bring together'] },
          { word: 'interrupt', definition: 'To stop someone while they are speaking', example: 'Please don\'t interrupt when others are sharing their views.', synonyms: ['cut in', 'break in', 'butt in', 'disturb'] },
          { word: 'apologize', definition: 'To say sorry for something you did wrong', example: 'He called to apologize for missing the important meeting.', synonyms: ['say sorry', 'express regret', 'make amends', 'beg pardon'] },
          { word: 'compliment', definition: 'To say something nice about someone', example: 'She complimented him on his excellent presentation skills.', synonyms: ['praise', 'flatter', 'commend', 'applaud'] },
          { word: 'encourage', definition: 'To give support and confidence to someone', example: 'Teachers encourage students to ask questions in class.', synonyms: ['motivate', 'support', 'inspire', 'cheer on'] }
        ],
        completed: false
      },
      {
        id: 28,
        title: 'Planning & Organization',
        words: [
          { word: 'schedule', definition: 'To arrange a time for something to happen', example: 'Let me schedule a meeting for next Tuesday afternoon.', synonyms: ['plan', 'arrange', 'book', 'set up'] },
          { word: 'prioritize', definition: 'To decide which tasks are most important', example: 'You need to prioritize your work to meet all deadlines.', synonyms: ['rank', 'order', 'put first', 'focus on'] },
          { word: 'organize', definition: 'To arrange things in a logical order', example: 'She organizes her files by date and project name.', synonyms: ['arrange', 'sort', 'structure', 'coordinate'] },
          { word: 'prepare', definition: 'To make ready for something in advance', example: 'We need to prepare the report before Friday\'s meeting.', synonyms: ['get ready', 'set up', 'arrange', 'plan'] },
          { word: 'remind', definition: 'To help someone remember something important', example: 'Please remind me to call the client this afternoon.', synonyms: ['prompt', 'jog memory', 'notify', 'alert'] }
        ],
        completed: false
      },
      {
        id: 29,
        title: 'Describing Change',
        words: [
          { word: 'increase', definition: 'To become or make something larger in amount', example: 'Sales increased by fifteen percent compared to last year.', synonyms: ['rise', 'grow', 'go up', 'expand'] },
          { word: 'decrease', definition: 'To become or make something smaller in amount', example: 'Prices decreased after the new supplier was found.', synonyms: ['reduce', 'drop', 'fall', 'decline'] },
          { word: 'replace', definition: 'To put something new in place of old', example: 'We need to replace the old computers with newer models.', synonyms: ['substitute', 'swap', 'exchange', 'change'] },
          { word: 'transform', definition: 'To change completely in form or nature', example: 'Technology has transformed how we communicate with others.', synonyms: ['change', 'convert', 'alter', 'revolutionize'] },
          { word: 'maintain', definition: 'To keep something in good condition', example: 'Regular service helps maintain your car\'s performance.', synonyms: ['keep up', 'preserve', 'sustain', 'uphold'] }
        ],
        completed: false
      },
      {
        id: 30,
        title: 'Learning & Education',
        words: [
          { word: 'memorize', definition: 'To learn something so you can remember it exactly', example: 'Students memorize vocabulary lists for weekly tests.', synonyms: ['learn by heart', 'commit to memory', 'retain', 'remember'] },
          { word: 'concentrate', definition: 'To focus your attention on something fully', example: 'It\'s hard to concentrate when the office is noisy.', synonyms: ['focus', 'pay attention', 'think hard', 'apply yourself'] },
          { word: 'practice', definition: 'To do something repeatedly to improve skills', example: 'Musicians practice scales every day to build technique.', synonyms: ['rehearse', 'train', 'drill', 'work on'] },
          { word: 'research', definition: 'To study something carefully to find facts', example: 'Scientists research new treatments for common diseases.', synonyms: ['investigate', 'study', 'examine', 'explore'] },
          { word: 'analyze', definition: 'To examine something in detail to understand it', example: 'Analysts analyze data to identify market trends quickly.', synonyms: ['examine', 'study', 'evaluate', 'assess'] }
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
    icon: '',
    sets: [
      {
        id: 1,
        title: 'Descriptive Adjectives',
        words: [
          { word: 'fragile', definition: 'Easily broken or damaged, requiring careful handling', example: 'Handle the fragile vase carefully; its thin glass chips easily.', synonyms: ['delicate', 'breakable', 'brittle', 'frail'] },
          { word: 'generous', definition: 'Willing to give more than necessary', example: 'Her generous donation kept the shelter open through winter this year.', synonyms: ['charitable', 'big-hearted', 'liberal', 'giving'] },
          { word: 'reluctant', definition: 'Unwilling and hesitant to do something', example: 'He felt reluctant to speak first during the tense meeting.', synonyms: ['hesitant', 'unwilling', 'loath', 'averse'] },
          { word: 'damp', definition: 'Slightly wet, often uncomfortably or unexpectedly', example: 'The tent felt damp after the stormy night by the lake.', synonyms: ['moist', 'humid', 'clammy', 'dank'] },
          { word: 'ancient', definition: 'Very old, belonging to a distant past', example: 'We explored ancient ruins overlooking the valley at sunrise today.', synonyms: ['old', 'antique', 'age-old', 'archaic'] }
        ],
        completed: true
      },
      {
        id: 2,
        title: 'Actions & Attitudes',
        words: [
          { word: 'predict', definition: 'To say what will happen before', example: "Experts predict heavy rain tomorrow despite today's unusually clear sky.", synonyms: ['anticipate', 'foresee', 'expect', 'forecast'] },
          { word: 'avoid', definition: 'To keep away from something unpleasant', example: 'We should avoid busy roads during rush hour to stay safe.', synonyms: ['evade', 'dodge', 'shun', 'steer clear'] },
          { word: 'improve', definition: 'To make something better in quality', example: 'Regular practice will improve your accent and overall speaking confidence.', synonyms: ['enhance', 'better', 'upgrade', 'refine'] },
          { word: 'encourage', definition: 'To give support that makes someone act', example: 'Teachers encourage students to ask questions and share their ideas.', synonyms: ['motivate', 'inspire', 'spur', 'urge'] },
          { word: 'complain', definition: 'To say you are unhappy about something', example: 'Customers complain when deliveries arrive late without any clear explanation.', synonyms: ['grumble', 'protest', 'object', 'gripe'] }
        ],
        completed: false,
        inProgress: true
      },
      {
        id: 3,
        title: 'Decisions & Delivery',
        words: [
          { word: 'decide', definition: 'To choose after considering different possible options', example: 'After comparing prices, we decided to buy the smaller model.', synonyms: ['choose', 'determine', 'settle', 'conclude'] },
          { word: 'recommend', definition: 'To suggest something as good or suitable', example: 'I recommend visiting early, because the museum gets crowded later.', synonyms: ['suggest', 'advise', 'endorse', 'propose'] },
          { word: 'maintain', definition: 'To keep something in good condition', example: 'Technicians maintain the machines regularly to prevent costly breakdowns at night.', synonyms: ['keep', 'preserve', 'sustain', 'uphold'] },
          { word: 'reduce', definition: 'To make something smaller in amount', example: 'Cutting sugar can reduce headaches and improve your daily energy.', synonyms: ['lessen', 'decrease', 'lower', 'cut'] },
          { word: 'deliver', definition: 'To bring or send something to someone', example: 'They deliver groceries within hours, even during heavy rainstorms in winter.', synonyms: ['bring', 'supply', 'distribute', 'dispatch'] }
        ],
        completed: false
      },
      {
        id: 4,
        title: 'Compare & Explain',
        words: [
          { word: 'borrow', definition: 'To take and use something temporarily', example: 'You can borrow my umbrella if the rain starts again.', synonyms: ['take on loan', 'use temporarily', 'get on loan'] },
          { word: 'lend', definition: 'To give something temporarily to someone', example: 'She agreed to lend me her notes for tomorrow\'s exam.', synonyms: ['loan', 'give temporarily', 'advance'] },
          { word: 'compare', definition: 'To examine similarities and differences between things', example: 'Let\'s compare both offers before we choose the cheaper option.', synonyms: ['contrast', 'match up', 'evaluate differences'] },
          { word: 'explain', definition: 'To make an idea clear by describing', example: 'Please explain the steps slowly so everyone can follow.', synonyms: ['clarify', 'describe', 'make clear'] },
          { word: 'arrange', definition: 'To plan and organize details in order', example: 'We should arrange a meeting for Friday afternoon at school.', synonyms: ['organize', 'schedule', 'plan'] }
        ],
        completed: false
      },
      {
        id: 5,
        title: 'Planning & Problem Solving',
        words: [
          { word: 'mitigate', definition: 'To make a problem less severe or harmful', example: 'New safety guidelines aim to mitigate risks during maintenance work.', synonyms: ['lessen', 'alleviate', 'reduce', 'ease'] },
          { word: 'allocate', definition: 'To assign resources or duties for particular purposes', example: 'The manager will allocate funds after reviewing each department\'s proposal.', synonyms: ['assign', 'apportion', 'distribute', 'earmark'] },
          { word: 'justify', definition: 'To give reasons showing a decision is reasonable', example: 'You must justify travel expenses before finance approves reimbursement.', synonyms: ['defend', 'warrant', 'substantiate', 'vindicate'] },
          { word: 'compromise', definition: 'To settle a disagreement by mutual concessions', example: 'After hours of talks, both sides agreed to compromise on payment.', synonyms: ['negotiate', 'settle', 'conciliate', 'concede'] },
          { word: 'implement', definition: 'To put a plan or decision into effect', example: 'The city plans to implement the new recycling scheme next spring.', synonyms: ['execute', 'carry out', 'enforce', 'apply'] }
        ],
        completed: false
      },
      {
        id: 6,
        title: 'Evaluation & Reasoning',
        words: [
          { word: 'assess', definition: "To evaluate something\'s quality, value, or significance", example: 'We need to assess the proposal before allocating any funds.', synonyms: ['evaluate', 'appraise', 'gauge', 'judge'] },
          { word: 'interpret', definition: 'To explain the meaning of something clearly', example: 'Students must interpret the graph before answering the final question.', synonyms: ['explain', 'construe', 'decipher', 'expound'] },
          { word: 'infer', definition: 'To reach a conclusion from available evidence', example: "From the patterns, we can infer the system's likely behavior.", synonyms: ['deduce', 'conclude', 'derive', 'extrapolate'] },
          { word: 'articulate', definition: 'To express ideas clearly in spoken words', example: "She can articulate complex ideas without losing the audience's attention.", synonyms: ['express', 'voice', 'put into words', 'state'] },
          { word: 'reconcile', definition: 'To restore harmony by resolving differences', example: 'The mediator helped reconcile priorities after months of tense negotiations.', synonyms: ['resolve', 'harmonize', 'settle', 'patch up'] }
        ],
        completed: false
      },
      {
        id: 7,
        title: 'Advocacy & Analysis',
        words: [
          { word: 'scrutinize', definition: 'To examine something carefully for detailed accuracy', example: 'Editors scrutinize every reference to prevent misleading claims in print.', synonyms: ['inspect', 'examine', 'analyze', 'probe'] },
          { word: 'advocate', definition: 'To publicly support a cause or idea', example: 'Scientists advocate stronger policies to protect rapidly warming ecosystems.', synonyms: ['support', 'champion', 'endorse', 'promote'] },
          { word: 'synthesize', definition: 'To combine parts into a coherent whole', example: 'The report synthesizes interviews and data to present balanced conclusions.', synonyms: ['combine', 'integrate', 'fuse', 'consolidate'] },
          { word: 'undermine', definition: 'To weaken something gradually or secretly', example: 'Leaks can undermine trust and damage long-term collaboration across teams.', synonyms: ['weaken', 'erode', 'sap', 'undercut'] },
          { word: 'adhere', definition: 'To stick firmly to rules or surfaces', example: 'Teams must adhere to guidelines to ensure consistent, fair evaluations.', synonyms: ['stick', 'comply', 'follow', 'abide by'] }
        ],
        completed: false
      },
      {
        id: 8,
        title: 'Argument & Claims',
        words: [
          { word: 'assert', definition: 'To state something confidently as true', example: 'The author asserts the policy harms small businesses in rural areas.', synonyms: ['maintain', 'claim', 'contend', 'affirm'] },
          { word: 'concede', definition: 'To admit something true after initial denial', example: 'After reviewing the data, she conceded their method needed revisions.', synonyms: ['admit', 'acknowledge', 'yield', 'grant'] },
          { word: 'imply', definition: 'To suggest something without stating it directly', example: 'His tone implied the deadline might shift without formal notice.', synonyms: ['suggest', 'hint', 'intimate', 'indicate'] },
          { word: 'refute', definition: 'To prove a statement or claim wrong', example: 'New evidence refuted the rumors circulating across social media today.', synonyms: ['disprove', 'rebut', 'counter', 'invalidate'] },
          { word: 'outline', definition: 'To describe main points in a summary', example: 'In the introduction, outline your aims and planned research methods.', synonyms: ['summarize', 'sketch', 'delineate', 'map out'] }
        ],
        completed: false
      },
      {
        id: 9,
        title: 'Evidence & Methods',
        words: [
          { word: 'contrast', definition: 'To compare to show clear differences', example: 'The study contrasts rural and urban spending across three decades.', synonyms: ['differ', 'distinguish', 'juxtapose', 'set against'] },
          { word: 'corroborate', definition: 'To provide evidence that supports a claim', example: 'Multiple witnesses corroborated the timeline described in the police statement.', synonyms: ['confirm', 'substantiate', 'validate', 'support'] },
          { word: 'hypothesize', definition: 'To propose an explanation based on limited evidence', example: 'Researchers hypothesize that warmer nights accelerate plant growth in spring.', synonyms: ['suppose', 'posit', 'theorize', 'speculate'] },
          { word: 'constrain', definition: 'To limit actions or growth by force', example: 'Strict budgets constrain expansion plans despite rising customer demand.', synonyms: ['restrict', 'limit', 'curb', 'restrain'] },
          { word: 'deviate', definition: 'To move away from an expected course', example: 'The pilot deviated slightly to avoid storms approaching the coast.', synonyms: ['stray', 'diverge', 'depart', 'veer'] }
        ],
        completed: false
      },
      {
        id: 10,
        title: 'Data & Clarity',
        words: [
          { word: 'correlate', definition: 'To show a relationship between two variables', example: 'Their findings correlate temperature spikes with increased energy consumption nationwide.', synonyms: ['connect', 'relate', 'link', 'associate'] },
          { word: 'validate', definition: 'To confirm something is accurate or acceptable', example: 'Independent labs validate the results before journals agree to publish.', synonyms: ['confirm', 'verify', 'authenticate', 'substantiate'] },
          { word: 'compile', definition: 'To collect information into an organized whole', example: 'We will compile interviews and surveys into one comprehensive report.', synonyms: ['collect', 'gather', 'assemble', 'collate'] },
          { word: 'elucidate', definition: 'To make something clear through thorough explanation', example: 'The lecturer used simple diagrams to elucidate complex neural processes.', synonyms: ['clarify', 'explain', 'illuminate', 'expound'] },
          { word: 'benchmark', definition: 'To measure performance against a defined standard', example: 'Startups benchmark performance against leaders to identify realistic improvement targets.', synonyms: ['evaluate', 'compare', 'measure', 'gauge'] }
        ],
        completed: false
      },
      {
        id: 11,
        title: 'Planning & Coordination',
        words: [
          { word: 'prioritize', definition: 'To arrange tasks by importance or urgency', example: 'We must prioritize critical bugs before adding new optional features.', synonyms: ['rank', 'order', 'sequence', 'triage'] },
          { word: 'negotiate', definition: 'To discuss terms to reach a fair agreement', example: 'Vendors will negotiate prices if we present dependable long-term demand.', synonyms: ['bargain', 'discuss terms', 'broker', 'mediate'] },
          { word: 'revise', definition: 'To update a text to improve clarity', example: 'Please revise the report so conclusions match the latest figures.', synonyms: ['edit', 'update', 'amend', 'rewrite'] },
          { word: 'forecast', definition: 'To predict future events based on data', example: 'Analysts forecast slower growth unless fuel prices fall this quarter.', synonyms: ['predict', 'project', 'anticipate', 'estimate'] },
          { word: 'coordinate', definition: 'To organize people or tasks to work together', example: 'We coordinate teams across offices to avoid duplicate work and delays.', synonyms: ['organize', 'align', 'orchestrate', 'synchronize'] }
        ],
        completed: false
      },
      {
        id: 12,
        title: 'Legal & Compliance',
        words: [
          { word: 'enforce', definition: 'Ensure rules are obeyed through authority', example: 'Inspectors enforce safety rules during construction to prevent avoidable accidents.', synonyms: ['impose', 'apply', 'implement', 'execute'] },
          { word: 'comply', definition: 'Act according to rules, requests, or standards', example: 'All suppliers must comply with updated packaging standards this year.', synonyms: ['obey', 'conform', 'adhere', 'follow'] },
          { word: 'violate', definition: 'Break a rule, agreement, or legal requirement', example: 'Posting private data may violate privacy laws in several countries.', synonyms: ['breach', 'infringe', 'contravene', 'transgress'] },
          { word: 'amend', definition: 'Make changes to improve a text or law', example: 'Lawmakers amended the bill to include stronger environmental protections.', synonyms: ['revise', 'modify', 'alter', 'edit'] },
          { word: 'disclose', definition: 'Make previously hidden information publicly known', example: 'Companies must disclose risks to investors before offering new shares.', synonyms: ['reveal', 'expose', 'divulge', 'unveil'] }
        ],
        completed: false
      },
      {
        id: 13,
        title: 'Change & Correction',
        words: [
          { word: 'curtail', definition: 'To reduce something in extent or amount', example: 'The committee voted to curtail overtime during the slower season.', synonyms: ['reduce', 'cut', 'limit', 'restrict'] },
          { word: 'amplify', definition: 'To make something stronger, louder, or greater', example: 'The update will amplify signal strength in crowded indoor spaces.', synonyms: ['increase', 'boost', 'intensify', 'magnify'] },
          { word: 'rectify', definition: 'To correct something by making necessary changes', example: 'The editor promised to rectify errors before the article goes live.', synonyms: ['correct', 'fix', 'amend', 'remedy'] },
          { word: 'commence', definition: 'To begin an activity, event, or process', example: 'Construction will commence once permits arrive and safety checks finish.', synonyms: ['begin', 'start', 'initiate', 'launch'] },
          { word: 'conclude', definition: 'To finish something or reach a decision', example: 'After final questions, the panel will conclude the session before lunch.', synonyms: ['finish', 'end', 'decide', 'determine'] }
        ],
        completed: false
      }
      ,
      {
        id: 14,
        title: 'Emphasis & Response',
        words: [
          { word: 'contemplate', definition: 'To think about something deeply and carefully', example: 'She paused to contemplate moving abroad before signing the lease.', synonyms: ['consider', 'ponder', 'deliberate', 'mull over'] },
          { word: 'bolster', definition: 'To support or strengthen something already existing', example: 'New evidence will bolster their case before the review board.', synonyms: ['strengthen', 'support', 'reinforce', 'fortify'] },
          { word: 'downplay', definition: 'To make something seem less important', example: 'Officials tried to downplay delays during the press conference yesterday.', synonyms: ['minimize', 'play down', 'understate', 'de-emphasize'] },
          { word: 'counter', definition: 'To respond with opposing argument or action', example: 'She countered the claim with data from three independent studies.', synonyms: ['oppose', 'rebut', 'refute', 'respond to'] },
          { word: 'elicit', definition: 'To draw out a response or reaction', example: 'The interviewer used open questions to elicit more detailed answers.', synonyms: ['evoke', 'draw out', 'prompt', 'extract'] }
        ],
        completed: false
      }
      ,
      {
        id: 15,
        title: 'Trends & Change',
        words: [
          { word: 'fluctuate', definition: 'To change level frequently, rising and falling', example: 'Energy demand fluctuates during heatwaves, challenging grids and pushing prices higher nationwide.', synonyms: ['vary', 'oscillate', 'swing', 'shift'] },
          { word: 'stabilize', definition: 'To make or become steady and consistent', example: 'Emergency loans helped stabilize markets after weeks of unsettling volatility worldwide.', synonyms: ['steady', 'level', 'normalize', 'balance'] },
          { word: 'accelerate', definition: 'To increase speed or rate of change', example: 'Warmer temperatures accelerate melting, threatening homes and infrastructure near low-lying coasts.', synonyms: ['speed up', 'quicken', 'hasten', 'expedite'] },
          { word: 'deteriorate', definition: 'To become worse in quality or condition', example: 'Without maintenance, roads deteriorate quickly after repeated storms and heavy traffic surges.', synonyms: ['worsen', 'decline', 'degrade', 'degenerate'] },
          { word: 'plateau', definition: 'To reach a stable level after growth', example: 'After early improvements, scores plateau unless practice sessions become harder over time.', synonyms: ['level off', 'flatten', 'stabilize', 'even out'] }
        ],
        completed: false
      }
      ,
      {
        id: 16,
        title: 'Refine & Verify',
        words: [
          { word: 'verify', definition: 'Confirm truth or accuracy through careful checks', example: 'Scientists verify results with replication before publishing in major journals.', synonyms: ['confirm', 'validate', 'authenticate', 'check'] },
          { word: 'refine', definition: 'Improve something by making small precise changes', example: 'We refined the prototype after testers reported several usability issues.', synonyms: ['improve', 'polish', 'hone', 'sharpen'] },
          { word: 'formulate', definition: 'Create or express an idea in detail', example: 'Take time to formulate clear goals before choosing any method.', synonyms: ['devise', 'frame', 'articulate', 'craft'] },
          { word: 'illustrate', definition: 'Explain or make clear using examples', example: 'The teacher illustrated complex ideas with simple drawings and stories.', synonyms: ['explain', 'demonstrate', 'exemplify', 'clarify'] },
          { word: 'navigate', definition: 'Find a way through a situation successfully', example: 'Newcomers navigate local bureaucracy better with guides and patient help.', synonyms: ['find way', 'steer', 'maneuver', 'pilot'] }
        ],
        completed: false
      }
      ,
      {
        id: 17,
        title: 'Resolve & Clarify',
        words: [
          { word: 'alleviate', definition: 'To make pain or problems less severe', example: 'Simple breathing exercises can alleviate stress during high-pressure interviews significantly.', synonyms: ['lessen', 'ease', 'mitigate', 'relieve'] },
          { word: 'exacerbate', definition: 'To make a difficult situation even worse', example: 'Ignoring early warnings may exacerbate shortages throughout the winter months.', synonyms: ['worsen', 'aggravate', 'intensify', 'amplify'] },
          { word: 'ascertain', definition: 'To find out something with reliable certainty', example: 'Investigators attempted to ascertain causes before issuing the official report.', synonyms: ['determine', 'find out', 'establish', 'verify'] },
          { word: 'delineate', definition: 'To describe something precisely and in detail', example: 'The proposal delineates responsibilities clearly to prevent duplication and confusion.', synonyms: ['outline', 'describe', 'define', 'sketch'] },
          { word: 'mediate', definition: 'To help opposing sides reach an agreement', example: 'An experienced facilitator can mediate conflicts without escalating personal tensions.', synonyms: ['arbitrate', 'negotiate', 'reconcile', 'intervene'] }
        ],
        completed: false
      }
      ,
      {
        id: 18,
        title: 'Emphasize & Adapt',
        words: [
          { word: 'emphasize', definition: 'To give special importance or extra attention', example: 'Teachers emphasize key steps so learners avoid common mistakes early.', synonyms: ['stress', 'highlight', 'underscore', 'accentuate'] },
          { word: 'acknowledge', definition: 'To accept or admit the truth of something', example: 'He must acknowledge the error and apologize before submitting the revision.', synonyms: ['admit', 'accept', 'recognize', 'concede'] },
          { word: 'adapt', definition: 'To change to suit new conditions or uses', example: 'Teams adapt quickly when tools change during tight project schedules.', synonyms: ['adjust', 'modify', 'tailor', 'acclimate'] },
          { word: 'compensate', definition: 'To make up for loss or damage', example: 'Extra training can compensate for limited experience in complex situations.', synonyms: ['offset', 'make up for', 'recompense', 'redress'] },
          { word: 'question', definition: 'To express doubt or challenge stated assumptions', example: 'Journalists question official statements when evidence appears inconsistent with sources.', synonyms: ['doubt', 'challenge', 'query', 'dispute'] }
        ],
        completed: false
      }
      ,
      {
        id: 19,
        title: 'Act & Uphold',
        words: [
          { word: 'expedite', definition: 'To make a process happen faster', example: 'Extra staff can expedite passport applications during peak travel season.', synonyms: ['accelerate', 'hasten', 'speed up', 'fast-track'] },
          { word: 'hamper', definition: 'To make progress difficult or slow', example: 'Road closures hamper deliveries when storms hit remote mountain towns.', synonyms: ['hinder', 'impede', 'obstruct', 'hold back'] },
          { word: 'contend', definition: 'To argue or claim something is true', example: 'Experts contend the policy ignores evidence from multiple independent studies.', synonyms: ['argue', 'claim', 'maintain', 'assert'] },
          { word: 'dispel', definition: 'To make something disappear, especially doubts', example: 'Clear communication can dispel rumors spreading through anxious communities quickly.', synonyms: ['dissipate', 'banish', 'drive away', 'clear away'] },
          { word: 'uphold', definition: 'To support and maintain rules or decisions', example: 'Courts uphold regulations when agencies follow transparent, lawful procedures properly.', synonyms: ['maintain', 'support', 'sustain', 'defend'] }
        ],
        completed: false
      }
      ,
      {
        id: 20,
        title: 'Evaluate & Persuade',
        words: [
          { word: 'evaluate', definition: 'Judge something\'s value, quality, or effectiveness', example: 'Teachers evaluate projects using clear criteria and feedback rubrics each semester.', synonyms: ['assess', 'appraise', 'judge', 'rate'] },
          { word: 'depict', definition: 'Represent something in words, pictures, or symbols', example: 'The mural depicts local history using bold colors and simple shapes.', synonyms: ['portray', 'represent', 'illustrate', 'show'] },
          { word: 'omit', definition: 'Leave out something, either accidentally or deliberately', example: 'Please omit personal details when sharing stories with public groups online.', synonyms: ['leave out', 'exclude', 'drop', 'skip'] },
          { word: 'oppose', definition: 'Act against something; argue it should not happen', example: 'Several residents oppose the plan, citing traffic and safety concerns.', synonyms: ['resist', 'contest', 'object to', 'disagree with'] },
          { word: 'endorse', definition: 'Publicly approve or support someone, product, or idea', example: 'Experts endorsed the guidelines after reviewing the evidence and outcomes.', synonyms: ['approve', 'back', 'support', 'champion'] }
        ],
        completed: false
      }
      ,
      {
        id: 21,
        title: 'Claims & Influence',
        words: [
          { word: 'allege', definition: 'To claim something as true without proof', example: 'Witnesses allege the contract was altered after signatures without consent.', synonyms: ['claim', 'assert', 'contend', 'maintain'] },
          { word: 'cite', definition: 'To mention evidence as support in argument', example: 'Report authors cite three sources to support the revised estimates.', synonyms: ['quote', 'mention', 'refer to', 'reference'] },
          { word: 'foster', definition: 'To encourage the development of something positive', example: 'Community mentors foster confidence and persistence in first-generation students today.', synonyms: ['encourage', 'promote', 'nurture', 'cultivate'] },
          { word: 'deter', definition: 'To discourage someone from acting through fear', example: 'Visible cameras deter theft around entrances during late closing hours.', synonyms: ['discourage', 'dissuade', 'inhibit', 'prevent'] },
          { word: 'diversify', definition: 'To make something more varied in type', example: 'Restaurants diversify menus to attract tourists during unpredictable shoulder seasons.', synonyms: ['vary', 'broaden', 'expand', 'widen'] }
        ],
        completed: false
      }
      ,
      {
        id: 22,
        title: 'Inquiry & Research',
        words: [
          { word: 'investigate', definition: 'To examine a subject carefully for facts', example: 'Reporters investigate claims before publishing any potentially damaging story.', synonyms: ['examine', 'look into', 'explore', 'check'] },
          { word: 'deduce', definition: 'To reach a conclusion from available evidence', example: 'From these figures, analysts deduce which strategy performed best.', synonyms: ['infer', 'conclude', 'derive', 'reason'] },
          { word: 'speculate', definition: 'To suggest possible explanations without certain proof', example: 'Commentators speculate when data are scarce and deadlines are near.', synonyms: ['hypothesize', 'theorize', 'suppose', 'guess'] },
          { word: 'probe', definition: 'To explore something deeply to discover information', example: 'Auditors probe transactions to uncover unusual or suspicious activity.', synonyms: ['examine', 'delve', 'investigate', 'explore'] },
          { word: 'survey', definition: 'To gather opinions or data from many people', example: 'We will survey commuters to understand changes in travel habits.', synonyms: ['poll', 'canvass', 'sample', 'study'] }
        ],
        completed: false
      }
      ,
      {
        id: 23,
        title: 'Process Improvement',
        words: [
          { word: 'streamline', definition: 'To simplify a process for greater efficiency', example: 'They streamlined onboarding to reduce errors and shorten waiting times.', synonyms: ['simplify', 'rationalize', 'optimize', 'trim'] },
          { word: 'automate', definition: 'To make a task operate by itself', example: 'The team automated billing to cut repetitive manual work.', synonyms: ['mechanize', 'computerize', 'systematize', 'robotize'] },
          { word: 'consolidate', definition: 'To combine separate parts into one stronger whole', example: 'They consolidated vendors to reduce costs and simplify support.', synonyms: ['merge', 'combine', 'unify', 'integrate'] },
          { word: 'standardize', definition: 'To make procedures consistent according to set rules', example: 'Schools standardized rubrics to ensure fair grading across classes.', synonyms: ['normalize', 'regularize', 'codify', 'systematize'] },
          { word: 'iterate', definition: 'To repeat steps to improve each version', example: 'Designers iterate quickly after tests reveal specific usability issues.', synonyms: ['repeat', 'refine', 'cycle', 'improve'] }
        ],
        completed: false
      }
      ,
      {
        id: 24,
        title: 'Explain & Restate',
        words: [
          { word: 'paraphrase', definition: 'To express the same meaning using different words', example: 'Please paraphrase sources rather than copying long sections directly.', synonyms: ['reword', 'restate', 'rephrase', 'put differently'] },
          { word: 'summarize', definition: 'To present main points briefly and clearly', example: 'Start by summarizing findings before discussing their implications further.', synonyms: ['outline', 'recap', 'condense', 'sum up'] },
          { word: 'elaborate', definition: 'To add detail to explain more fully', example: 'Could you elaborate on costs and timelines for deployment?', synonyms: ['expand', 'develop', 'detail', 'flesh out'] },
          { word: 'allude', definition: 'To refer indirectly without stating something directly', example: 'The speaker alluded to budget issues without naming departments.', synonyms: ['hint', 'suggest', 'imply', 'refer indirectly'] },
          { word: 'reiterate', definition: 'To say something again for clarity', example: 'Let me reiterate the deadline so nobody misses it.', synonyms: ['repeat', 'restate', 'say again', 'echo'] }
        ],
        completed: false
      }
      ,
      {
        id: 25,
        title: 'Authorize & Prohibit',
        words: [
          { word: 'authorize', definition: 'To officially permit or approve an action', example: 'The council authorized night work to repair the bridge safely.', synonyms: ['permit', 'approve', 'sanction', 'empower'] },
          { word: 'prohibit', definition: 'To formally forbid an action by rule', example: 'Signs prohibit smoking anywhere inside the historic building.', synonyms: ['forbid', 'ban', 'bar', 'outlaw'] },
          { word: 'mandate', definition: 'To officially require that something be done', example: 'New rules mandate helmets for all electric scooter riders.', synonyms: ['require', 'order', 'decree', 'direct'] },
          { word: 'exempt', definition: 'To free someone from a required duty', example: 'Volunteers are exempt from fees when staffing public events.', synonyms: ['excuse', 'free', 'absolve', 'release'] },
          { word: 'waive', definition: 'To choose not to enforce a right', example: 'The bank waived fees after acknowledging the processing error.', synonyms: ['forgo', 'relinquish', 'set aside', 'dispense with'] }
        ],
        completed: false
      }
      ,
      {
        id: 26,
        title: 'Finance & Procurement',
        words: [
          { word: 'invest', definition: 'To commit money to earn future returns', example: 'Households invest steadily in education during stable economic periods.', synonyms: ['fund', 'finance', 'stake', 'commit'] },
          { word: 'divest', definition: 'To sell assets or withdraw from holdings', example: 'Firms divest divisions that no longer match strategy.', synonyms: ['sell off', 'dispose of', 'shed', 'unload'] },
          { word: 'procure', definition: 'To obtain needed goods or services', example: 'Hospitals procure supplies early to avoid seasonal shortages.', synonyms: ['obtain', 'acquire', 'secure', 'source'] },
          { word: 'reimburse', definition: 'To repay someone for incurred expenses', example: 'Please reimburse travel costs within seven working days.', synonyms: ['repay', 'refund', 'compensate', 'pay back'] },
          { word: 'hedge', definition: 'To reduce financial risk by balancing positions', example: 'Airlines hedge fuel costs to protect ticket prices from spikes.', synonyms: ['protect', 'insure', 'offset risk', 'buffer'] }
        ],
        completed: false
      }
      ,
      {
        id: 27,
        title: 'Deploy & Maintain',
        words: [
          { word: 'deploy', definition: 'To put a system or resource into use', example: 'We deploy the new app after final security checks pass.', synonyms: ['launch', 'roll out', 'implement', 'release'] },
          { word: 'configure', definition: 'To set options so something works correctly', example: 'Please configure alerts to notify admins about critical errors.', synonyms: ['set up', 'arrange', 'tune', 'customize'] },
          { word: 'troubleshoot', definition: 'To find and fix problems in operation', example: 'Engineers troubleshoot reports by reproducing bugs on staging servers.', synonyms: ['debug', 'diagnose', 'fix', 'resolve'] },
          { word: 'restore', definition: 'To return something to its previous state', example: 'We restored service quickly after the database cluster recovered.', synonyms: ['recover', 'reinstate', 'repair', 'revert'] },
          { word: 'synchronize', definition: 'To make things happen at the same time', example: 'Calendars synchronize across devices to prevent missed appointments everywhere.', synonyms: ['sync', 'align', 'coordinate', 'time'] }
        ],
        completed: false
      }
      ,
      {
        id: 28,
        title: 'Policy & Resources',
        words: [
          { word: 'conserve', definition: 'To protect and use resources carefully to last', example: 'Farmers conserve water with sensors and targeted nighttime irrigation.', synonyms: ['save', 'preserve', 'protect', 'husband'] },
          { word: 'regulate', definition: 'To control activities through rules and oversight', example: 'Agencies regulate emissions to protect public health and ecosystems.', synonyms: ['control', 'govern', 'oversee', 'manage'] },
          { word: 'subsidize', definition: 'To support costs with money from authorities', example: 'Cities subsidize transit passes to reduce congestion and pollution.', synonyms: ['fund', 'finance', 'underwrite', 'support'] },
          { word: 'incentivize', definition: 'To encourage actions by offering benefits or rewards', example: 'Tax credits incentivize businesses to adopt energy-efficient technologies.', synonyms: ['motivate', 'encourage', 'spur', 'prompt'] },
          { word: 'restrict', definition: 'To limit what people can do legally', example: 'Authorities restrict traffic downtown during large public festivals.', synonyms: ['limit', 'curb', 'constrain', 'control'] }
        ],
        completed: false
      }
      ,
      {
        id: 29,
        title: 'People & Emotions',
        words: [
          { word: 'reassure', definition: 'To comfort someone and reduce their anxiety', example: 'Nurses reassure patients with clear explanations before difficult procedures.', synonyms: ['comfort', 'soothe', 'calm', 'encourage'] },
          { word: 'empathize', definition: 'To understand and share another person\'s feelings', example: 'Good listeners empathize instead of offering immediate, unnecessary advice.', synonyms: ['understand', 'relate', 'sympathize', 'identify'] },
          { word: 'discourage', definition: 'To make someone less likely to try', example: 'Repeated criticism can discourage volunteers from returning next season.', synonyms: ['deter', 'dishearten', 'put off', 'depress'] },
          { word: 'confront', definition: 'To face a difficult issue directly and firmly', example: 'Leaders confront problems early to prevent wider organizational damage.', synonyms: ['face', 'tackle', 'challenge', 'address'] },
          { word: 'admire', definition: 'To respect and appreciate someone\'s good qualities', example: 'Many admire athletes who balance success with humility and service.', synonyms: ['respect', 'esteem', 'appreciate', 'look up to'] }
        ],
        completed: false
      }
      ,
      {
        id: 30,
        title: 'Media & Communication',
        words: [
          { word: 'curate', definition: 'To select and organize content for an audience', example: 'Editors curate articles to balance depth, freshness, and readability.', synonyms: ['select', 'organize', 'assemble', 'arrange'] },
          { word: 'moderate', definition: 'To manage discussion and keep it respectful', example: 'Hosts moderate panels by timing speakers and inviting balanced viewpoints.', synonyms: ['chair', 'manage', 'facilitate', 'preside'] },
          { word: 'annotate', definition: 'To add notes that explain or comment', example: 'Reviewers annotate drafts to clarify terms and fix ambiguities.', synonyms: ['note', 'comment', 'gloss', 'remark'] },
          { word: 'broadcast', definition: 'To transmit information widely by media channels', example: 'Stations broadcast alerts quickly during storms to protect communities.', synonyms: ['air', 'transmit', 'beam', 'telecast'] },
          { word: 'caption', definition: 'To add brief text describing an image', example: 'Designers caption photos clearly to aid accessibility and understanding.', synonyms: ['label', 'title', 'tag', 'subtitle'] }
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
    icon: '',
    sets: [
      {
        id: 1,
        title: 'Analysis & Evidence Verbs',
        words: [
          { word: 'extrapolate', definition: 'To infer unknown trends from limited data', example: 'Economists extrapolate demand using brief pilot program results.', synonyms: ['infer', 'project', 'generalize', 'extend'] },
          { word: 'corroborate', definition: 'To support a claim with confirming evidence', example: 'Two independent trials corroborate the therapy\'s reported success rate.', synonyms: ['confirm', 'validate', 'support', 'back up'] },
          { word: 'juxtapose', definition: 'To place differing things side by side', example: 'The essay juxtaposes policy ideals with messy real-world outcomes.', synonyms: ['compare', 'set against', 'place alongside', 'contrast'] },
          { word: 'invalidate', definition: 'To show a reasoning or claim is unsound', example: 'A hidden sampling bias could invalidate last quarter\'s bold conclusion.', synonyms: ['nullify', 'disprove', 'negate', 'rebut'] },
          { word: 'peruse', definition: 'To read something carefully and in detail', example: 'Please peruse the contract and flag unclear liability clauses.', synonyms: ['read carefully', 'scrutinize', 'examine', 'study'] }
        ],
        completed: false
      },
      {
        id: 2,
        title: 'Governance & Law Verbs',
        words: [
          { word: 'promulgate', definition: 'To officially announce a new rule publicly', example: 'The council will promulgate revised safety codes this week.', synonyms: ['announce', 'proclaim', 'issue', 'publish'] },
          { word: 'adjudicate', definition: 'To judge a dispute and deliver a decision', example: 'An independent panel will adjudicate complaints from affected tenants.', synonyms: ['judge', 'decide', 'rule', 'settle'] },
          { word: 'ratify', definition: 'To formally approve an agreement or decision', example: 'Member states must ratify the treaty before it activates.', synonyms: ['approve', 'confirm', 'endorse', 'validate'] },
          { word: 'repeal', definition: 'To cancel a law through proper legal procedures', example: 'Legislators moved to repeal outdated licensing rules last session.', synonyms: ['revoke', 'annul', 'rescind', 'cancel'] },
          { word: 'legislate', definition: 'To make new laws through an elected body', example: 'Parliament will legislate on access rules for public data.', synonyms: ['enact', 'make laws', 'pass laws', 'enact statutes'] }
        ],
        completed: false
      },
      {
        id: 3,
        title: 'Academic Writing Verbs',
        words: [
          { word: 'problematize', definition: 'To present something as an issue for questioning', example: 'The article problematizes "neutral data" using historical counterexamples.', synonyms: ['question', 'challenge', 'complicate', 'interrogate'] },
          { word: 'contextualize', definition: 'To situate an idea within relevant circumstances', example: 'Good introductions contextualize findings before evaluating their impact.', synonyms: ['situate', 'frame', 'place', 'locate'] },
          { word: 'synthesize', definition: 'To combine parts into a coherent new whole', example: 'The review synthesizes case studies into clear design principles.', synonyms: ['combine', 'integrate', 'fuse', 'amalgamate'] },
          { word: 'theorize', definition: 'To propose explanations without complete confirming evidence', example: 'Scholars theorize mechanisms, then test them with new data.', synonyms: ['hypothesize', 'speculate', 'postulate', 'suppose'] },
          { word: 'operationalize', definition: 'To define concepts for measurement and procedure', example: 'We operationalize "engagement" using time-on-task and question frequency.', synonyms: ['define', 'specify', 'make measurable', 'concretize'] }
        ],
        completed: false
      },
      {
        id: 4,
        title: 'Strategy & Change Verbs',
        words: [
          { word: 'recalibrate', definition: 'To adjust settings again for improved accuracy', example: 'After outliers, we recalibrated thresholds to reduce false alarms.', synonyms: ['readjust', 'retune', 'realign', 'remeasure'] },
          { word: 'restructure', definition: 'To change an organization\'s shape and internal relationships', example: 'The publisher will restructure teams to speed review cycles.', synonyms: ['reorganize', 'overhaul', 'reshape', 'realign'] },
          { word: 'reorient', definition: 'To change direction or focus toward something else', example: 'We reoriented funding toward prevention rather than late interventions.', synonyms: ['redirect', 'refocus', 'shift', 'realign'] },
          { word: 'deprioritize', definition: 'To give something lower priority than before', example: 'We deprioritized minor bugs to ship accessibility improvements earlier.', synonyms: ['downgrade', 'delay', 'back-burner', 'defocus'] },
          { word: 'institutionalize', definition: 'To embed a practice formally within established systems', example: 'The university institutionalized mentoring through credited teaching hours.', synonyms: ['formalize', 'embed', 'entrench', 'establish'] }
        ],
        completed: false
      },
      {
        id: 5,
        title: 'Nuance & Tone Verbs',
        words: [
          { word: 'equivocate', definition: 'To avoid clarity by speaking vaguely or ambiguously', example: 'Witnesses equivocated when timelines conflicted with earlier statements.', synonyms: ['prevaricate', 'be vague', 'waffle', 'dodge'] },
          { word: 'cajole', definition: 'To persuade gently through praise or flattery', example: 'She cajoled the team into one final rehearsal tonight.', synonyms: ['coax', 'sweet-talk', 'wheedle', 'persuade'] },
          { word: 'castigate', definition: 'To criticize someone severely for their actions', example: 'Commentators castigated the committee for ignoring early warnings.', synonyms: ['berate', 'reprimand', 'rebuke', 'lambaste'] },
          { word: 'lionize', definition: 'To praise someone publicly as especially important', example: 'Critics lionized the actor after the daring stage performance.', synonyms: ['glorify', 'celebrate', 'exalt', 'idolize'] },
          { word: 'denigrate', definition: 'To unfairly disparage someone\'s reputation or achievements', example: 'The ad denigrated rivals instead of explaining concrete benefits.', synonyms: ['belittle', 'disparage', 'deprecate', 'run down'] }
        ],
        completed: false
      },
      {
        id: 6,
        title: 'Evidence & Clarity Verbs',
        words: [
          { word: 'refute', definition: 'To prove a statement or theory false', example: 'The meta-analysis refuted claims of a dramatic benefit.', synonyms: ['disprove', 'rebut', 'confute', 'invalidate'] },
          { word: 'adduce', definition: 'To cite evidence to support an argument', example: 'She adduced two trials to justify the recommendation.', synonyms: ['cite', 'present', 'offer', 'introduce'] },
          { word: 'elucidate', definition: 'To make something clear by thorough explanation', example: 'The appendix elucidates edge cases with short scenarios.', synonyms: ['clarify', 'explain', 'illuminate', 'shed light'] },
          { word: 'delineate', definition: 'To describe something precisely and in detail', example: 'The charter delineates roles, timelines, and escalation paths.', synonyms: ['outline', 'sketch', 'map out', 'portray'] },
          { word: 'distill', definition: 'To extract essential meaning from complex material', example: 'The brief distills eighty pages into four principles.', synonyms: ['extract', 'condense', 'boil down', 'abstract'] }
        ],
        completed: false
      },
      {
        id: 7,
        title: 'Deals & Agreements Verbs',
        words: [
          { word: 'stipulate', definition: 'To specify a requirement in a contract', example: 'The license stipulates attribution on all public displays.', synonyms: ['specify', 'require', 'set out', 'prescribe'] },
          { word: 'broker', definition: 'To arrange a deal between opposing parties', example: 'A mediator brokered peace after months of stalled talks.', synonyms: ['arrange', 'mediate', 'negotiate', 'facilitate'] },
          { word: 'concede', definition: 'To admit something after initially resisting', example: 'The minister conceded errors and promised immediate fixes.', synonyms: ['admit', 'yield', 'acknowledge', 'grant'] },
          { word: 'renegotiate', definition: 'To discuss terms again to change agreement', example: 'We\'ll renegotiate the timeline if suppliers miss milestones.', synonyms: ['revisit', 'revise', 'rework', 'reopen'] },
          { word: 'underwrite', definition: 'To guarantee financial risk for a fee', example: 'Banks underwrote the issue to ensure full subscription.', synonyms: ['guarantee', 'insure', 'back', 'sponsor'] }
        ],
        completed: false
      },
      {
        id: 8,
        title: 'Research Methods Verbs',
        words: [
          { word: 'randomize', definition: 'To arrange without pattern using random selection', example: 'Trials randomized participants to minimize allocation bias.', synonyms: ['shuffle', 'permute', 'mix up', 'rearrange'] },
          { word: 'replicate', definition: 'To copy an experiment exactly for verification', example: 'Several labs replicated the results under stricter controls.', synonyms: ['duplicate', 'reproduce', 'copy', 'redo'] },
          { word: 'interpolate', definition: 'To estimate values between known data points', example: 'We interpolated missing days using cubic splines.', synonyms: ['estimate', 'infer', 'insert', 'compute'] },
          { word: 'partition', definition: 'To divide something into distinct separate parts', example: 'The dataset was partitioned into train, validation, test.', synonyms: ['divide', 'split', 'segment', 'section'] },
          { word: 'assay', definition: 'To test a substance\'s composition or activity', example: 'Each sample was assayed for enzymes within an hour.', synonyms: ['test', 'evaluate', 'analyze', 'measure'] }
        ],
        completed: false
      },
      {
        id: 9,
        title: 'Text Ethics & Editing Verbs',
        words: [
          { word: 'satirize', definition: 'To criticize using humor, irony, or exaggeration', example: 'The sketch satirized corruption without naming specific officials.', synonyms: ['mock', 'ridicule', 'parody', 'send up'] },
          { word: 'lampoon', definition: 'To mock a person publicly with ridicule', example: 'The column lampooned officials for tone-deaf responses.', synonyms: ['mock', 'ridicule', 'tease', 'roast'] },
          { word: 'plagiarize', definition: 'To use others\' work without proper credit', example: 'The journal retracted papers that plagiarized earlier studies.', synonyms: ['copy', 'steal', 'appropriate', 'pass off'] },
          { word: 'redact', definition: 'To edit text by removing sensitive information', example: 'The report redacted names to protect minor witnesses.', synonyms: ['censor', 'edit', 'black out', 'delete'] },
          { word: 'expurgate', definition: 'To remove offensive parts from a text', example: 'The edition expurgated slurs while preserving historical context.', synonyms: ['censor', 'bowdlerize', 'purge', 'cut'] }
        ],
        completed: false
      },
      {
        id: 10,
        title: 'Tech Infrastructure & Privacy Verbs',
        words: [
          { word: 'deprecate', definition: 'To discourage use by marking something as obsolete', example: 'The API version was deprecated after the security update.', synonyms: ['discourage', 'phase out', 'mark obsolete', 'disfavor'] },
          { word: 'sandbox', definition: 'To isolate code in a safe environment', example: 'Run untrusted plugins sandboxed to prevent data access.', synonyms: ['isolate', 'contain', 'confine', 'quarantine'] },
          { word: 'throttle', definition: 'To limit rate of requests or actions', example: 'The proxy throttles bursts to protect downstream services.', synonyms: ['limit', 'slow', 'restrict', 'cap'] },
          { word: 'obfuscate', definition: 'To make something hard to understand deliberately', example: 'They obfuscated keys in logs to deter scraping.', synonyms: ['obscure', 'confuse', 'muddy', 'cloud'] },
          { word: 'anonymize', definition: 'To remove personal identifiers from collected data', example: 'Pipelines anonymize records before any external sharing.', synonyms: ['de-identify', 'mask', 'strip identifiers', 'pseudonymize'] }
        ],
        completed: false
      },
      {
        id: 11,
        title: 'Logic & Argument Verbs',
        words: [
          { word: 'substantiate', definition: 'To provide evidence that firmly supports claims', example: 'The authors substantiate their model with multi-year field data.', synonyms: ['validate', 'support', 'back up', 'corroborate'] },
          { word: 'rebut', definition: 'To argue against and try to disprove', example: 'In the reply, they rebut the main statistical objections.', synonyms: ['refute', 'counter', 'disprove', 'contradict'] },
          { word: 'explicate', definition: 'To explain something carefully, in full detail', example: 'Appendices explicate boundary cases with worked numerical examples.', synonyms: ['clarify', 'elucidate', 'explain', 'unpack'] },
          { word: 'construe', definition: 'To interpret the meaning of words or actions', example: 'Courts construe ambiguous clauses against the party drafting them.', synonyms: ['interpret', 'read', 'parse', 'understand'] },
          { word: 'adumbrate', definition: 'To outline briefly, sometimes foreshadowing later developments', example: 'The preface adumbrates themes explored in greater depth later.', synonyms: ['outline', 'sketch', 'foreshadow', 'prefigure'] }
        ],
        completed: false
      },
      {
        id: 12,
        title: 'Finance & Markets Verbs',
        words: [
          { word: 'amortize', definition: 'To pay off debt gradually over time', example: 'We amortize equipment costs across three predictable fiscal years.', synonyms: ['pay down', 'retire debt', 'reduce balance', 'write off'] },
          { word: 'securitize', definition: 'To pool assets and issue tradeable securities', example: 'Banks securitize mortgages to free balance-sheet capacity.', synonyms: ['package', 'collateralize', 'structure', 'pool'] },
          { word: 'deleverage', definition: 'To reduce overall debt to lower risk', example: 'After the acquisition, the company deleveraged using excess cash.', synonyms: ['reduce debt', 'degear', 'pare down', 'de-risk'] },
          { word: 'arbitrage', definition: 'To exploit price differences through synchronized trades', example: 'Funds arbitrage small mispricings across related index products.', synonyms: ['spread trade', 'exploit mispricing', 'longshort', 'pair trade'] },
          { word: 'liquidate', definition: 'To sell assets and close operations formally', example: 'The trustee liquidated inventory to satisfy senior creditors.', synonyms: ['wind up', 'sell off', 'cash out', 'dissolve'] }
        ],
        completed: false
      },
      {
        id: 13,
        title: 'Law & Procedure Verbs',
        words: [
          { word: 'enjoin', definition: 'To legally prohibit or command by injunction', example: 'The court enjoined the agency from enforcing the rule.', synonyms: ['prohibit', 'forbid', 'order', 'command'] },
          { word: 'indict', definition: 'To formally accuse someone of a crime', example: 'A grand jury indicted the executives on several counts.', synonyms: ['charge', 'accuse', 'present', 'file against'] },
          { word: 'arraign', definition: 'To bring accused before court to answer', example: 'The defendant was arraigned this morning in district court.', synonyms: ['bring before', 'charge in court', 'cite', 'summon'] },
          { word: 'exonerate', definition: 'To officially clear someone of alleged wrongdoing', example: 'DNA evidence exonerated the man after twenty difficult years.', synonyms: ['absolve', 'clear', 'acquit', 'vindicate'] },
          { word: 'mitigate', definition: 'To make a harm or penalty less severe', example: 'Strong compliance programs can mitigate penalties after violations.', synonyms: ['lessen', 'reduce', 'alleviate', 'soften'] }
        ],
        completed: false
      },
      {
        id: 14,
        title: 'Rhetoric & Emphasis Verbs',
        words: [
          { word: 'amplify', definition: 'To increase impact or volume of something', example: 'Clear visuals amplify key points without extra text.', synonyms: ['boost', 'magnify', 'strengthen', 'heighten'] },
          { word: 'foreground', definition: 'To give prominent attention to something important', example: 'The report foregrounds equity alongside efficiency and growth.', synonyms: ['highlight', 'feature', 'spotlight', 'emphasize'] },
          { word: 'attenuate', definition: 'To reduce intensity, effect, or signal strength', example: 'Filters attenuate background noise in open-plan offices.', synonyms: ['weaken', 'dilute', 'diminish', 'soften'] },
          { word: 'undercut', definition: 'To weaken a position by indirect means', example: 'Inconsistent examples undercut the paper\'s central thesis.', synonyms: ['undermine', 'sap', 'erode', 'compromise'] },
          { word: 'reify', definition: 'To treat an abstract idea as concrete', example: 'Dashboards can reify priorities that deserve periodic debate.', synonyms: ['concretize', 'embody', 'materialize', 'objectify'] }
        ],
        completed: false
      },
      {
        id: 15,
        title: 'Science & Causality Verbs',
        words: [
          { word: 'catalyze', definition: 'To speed a reaction by lowering barriers', example: 'Enzymes catalyze steps that otherwise proceed extremely slowly.', synonyms: ['accelerate', 'speed up', 'promote', 'drive'] },
          { word: 'inhibit', definition: 'To slow, prevent, or restrain a process', example: 'Certain salts inhibit corrosion on marine structures.', synonyms: ['hinder', 'suppress', 'check', 'restrain'] },
          { word: 'precipitate', definition: 'To cause something to happen suddenly', example: 'Poor communication precipitated a rapid loss of stakeholder trust.', synonyms: ['trigger', 'spark', 'induce', 'provoke'] },
          { word: 'modulate', definition: 'To adjust level or pattern in response', example: 'Cells modulate signaling strength to match external conditions.', synonyms: ['adjust', 'tune', 'regulate', 'vary'] },
          { word: 'differentiate', definition: 'To recognize clear distinctions between similar things', example: 'The rubric differentiates minor lapses from serious violations.', synonyms: ['distinguish', 'separate', 'tell apart', 'discriminate'] }
        ],
        completed: false
      },
      {
        id: 16,
        title: 'Constraints & Effects Verbs',
        words: [
          { word: 'preclude', definition: 'To prevent something from happening by conditions', example: 'Missing audits may preclude certification during the current renewal window.', synonyms: ['prevent', 'bar', 'rule out', 'forestall'] },
          { word: 'obviate', definition: 'To remove need by making unnecessary', example: 'Cloud backups obviate nightly manual exports across departments.', synonyms: ['remove', 'eliminate', 'avert', 'preempt'] },
          { word: 'circumscribe', definition: 'To limit something within clearly defined boundaries', example: 'The charter circumscribes committee powers during interim leadership periods.', synonyms: ['limit', 'restrict', 'confine', 'delimit'] },
          { word: 'exacerbate', definition: 'To make a bad situation significantly worse', example: 'Cutting training budgets may exacerbate already high turnover.', synonyms: ['worsen', 'aggravate', 'intensify', 'amplify'] },
          { word: 'constrain', definition: 'To force limits on actions or choices', example: 'Legacy contracts constrain pricing flexibility across several regions.', synonyms: ['restrict', 'limit', 'curb', 'restrain'] }
        ],
        completed: false
      },
      {
        id: 17,
        title: 'Claims & Signals Verbs',
        words: [
          { word: 'evince', definition: 'To clearly show a quality or feeling', example: 'The notes evince patience despite repeated schedule changes.', synonyms: ['display', 'manifest', 'show', 'reveal'] },
          { word: 'aver', definition: 'To state firmly that something is true', example: 'The chair averred the figures matched audited statements.', synonyms: ['assert', 'maintain', 'claim', 'affirm'] },
          { word: 'allege', definition: 'To claim without full proof or evidence', example: 'Critics alleged bias before reviewing the full dataset.', synonyms: ['claim', 'contend', 'assert', 'purport'] },
          { word: 'contradict', definition: 'To assert the opposite of another statement', example: 'Later emails contradict the timeline described on record.', synonyms: ['counter', 'oppose', 'dispute', 'gainsay'] },
          { word: 'bolster', definition: 'To support or strengthen an existing position', example: 'External audits bolster trust with long-term donors and partners.', synonyms: ['support', 'strengthen', 'reinforce', 'shore up'] }
        ],
        completed: false
      },
      {
        id: 18,
        title: 'Law & Policy II Verbs',
        words: [
          { word: 'abrogate', definition: 'To repeal or cancel a formal agreement', example: 'The new statute abrogated several outdated bilateral treaties.', synonyms: ['repeal', 'rescind', 'annul', 'revoke'] },
          { word: 'proscribe', definition: 'To officially forbid something by formal rule', example: 'Regulations proscribe data sharing without explicit consent.', synonyms: ['forbid', 'ban', 'prohibit', 'bar'] },
          { word: 'codify', definition: 'To arrange rules systematically into written form', example: 'The policy team codified unwritten practices after audits.', synonyms: ['systematize', 'formalize', 'arrange', 'organize'] },
          { word: 'entrench', definition: 'To establish firmly so change becomes difficult', example: 'Automatic renewals entrenched inefficient processes for years.', synonyms: ['embed', 'root', 'establish', 'cement'] },
          { word: 'harmonize', definition: 'To make different parts work together smoothly', example: 'Agencies harmonized standards to simplify cross-border reporting.', synonyms: ['align', 'coordinate', 'reconcile', 'integrate'] }
        ],
        completed: false
      },
      {
        id: 19,
        title: 'Mind & Social Dynamics Verbs',
        words: [
          { word: 'disabuse', definition: 'To correct someone\'s false belief or impression', example: 'The briefing disabused managers of myths about productivity.', synonyms: ['correct', 'enlighten', 'set straight', 'debunk'] },
          { word: 'mollify', definition: 'To calm someone\'s anger by gentle actions', example: 'A prompt apology mollified customers after the outage.', synonyms: ['soothe', 'appease', 'pacify', 'calm'] },
          { word: 'aggrandize', definition: 'To increase power, status, or importance dramatically', example: 'The campaign aggrandized minor wins with flashy headlines.', synonyms: ['elevate', 'amplify', 'exalt', 'magnify'] },
          { word: 'ostracize', definition: 'To exclude someone from a group deliberately', example: 'Teams ostracized whistleblowers until policies changed leadership culture.', synonyms: ['exclude', 'shun', 'banish', 'blacklist'] },
          { word: 'ruminate', definition: 'To think deeply about something for long', example: 'She ruminated overnight before committing resources.', synonyms: ['ponder', 'mull', 'reflect', 'brood'] }
        ],
        completed: false
      },
      {
        id: 20,
        title: 'Data & Method II Verbs',
        words: [
          { word: 'triangulate', definition: 'To confirm findings using multiple independent sources', example: 'We triangulated survey trends with logs and interviews.', synonyms: ['cross-check', 'verify', 'validate', 'corroborate'] },
          { word: 'normalize', definition: 'To scale data to comparable standard ranges', example: 'Please normalize metrics before plotting quarterly comparisons.', synonyms: ['standardize', 'scale', 'regularize', 'rescale'] },
          { word: 'impute', definition: 'To assign missing values using reasonable estimates', example: 'Analysts imputed absent fields using model-based techniques.', synonyms: ['assign', 'ascribe', 'estimate', 'infer'] },
          { word: 'conflate', definition: 'To mistakenly combine distinct things into one', example: 'The memo conflated correlation and causation throughout.', synonyms: ['confuse', 'merge', 'collapse', 'blend'] },
          { word: 'curate', definition: 'To select and organize content with expert judgment', example: 'Editors curated sources relevant to beginners and specialists.', synonyms: ['select', 'organize', 'arrange', 'assemble'] }
        ],
        completed: false
      },
      {
        id: 21,
        title: 'Authority & Oversight Verbs',
        words: [
          { word: 'adjudicate', definition: 'To make formal decisions on disputes', example: 'The panel adjudicates claims filed during enrollment periods.', synonyms: ['judge', 'arbitrate', 'decide', 'settle'] },
          { word: 'ratify', definition: 'To formally approve a decision or treaty', example: 'Members ratified the charter amendments unanimously.', synonyms: ['approve', 'confirm', 'endorse', 'sanction'] },
          { word: 'supersede', definition: 'To replace something with a newer version', example: 'The updated policy supersedes all prior guidelines.', synonyms: ['replace', 'supplant', 'displace', 'override'] },
          { word: 'mandate', definition: 'To officially require by authority or law', example: 'Regulators mandate disclosure of material risks.', synonyms: ['require', 'order', 'direct', 'decree'] },
          { word: 'delegate', definition: 'To assign responsibility to a subordinate', example: 'Directors delegate routine approvals to team leads.', synonyms: ['assign', 'entrust', 'transfer', 'authorize'] }
        ],
        completed: false
      },
      {
        id: 22,
        title: 'Inference & Reasoning Verbs',
        words: [
          { word: 'infer', definition: 'To conclude from evidence and reasoning', example: 'We can infer trends from quarterly reports.', synonyms: ['deduce', 'conclude', 'derive', 'surmise'] },
          { word: 'postulate', definition: 'To assume as basis for reasoning', example: 'The model postulates linear demand curves.', synonyms: ['hypothesize', 'assume', 'propose', 'theorize'] },
          { word: 'extrapolate', definition: 'To extend known data to predict unknowns', example: 'Analysts extrapolate growth from historic patterns.', synonyms: ['project', 'predict', 'estimate', 'extend'] },
          { word: 'substantiate', definition: 'To provide evidence supporting a claim', example: 'The audit substantiated concerns about controls.', synonyms: ['verify', 'confirm', 'prove', 'validate'] },
          { word: 'conjecture', definition: 'To form opinion without firm evidence', example: 'Experts conjecture about long-term effects.', synonyms: ['speculate', 'guess', 'surmise', 'theorize'] }
        ],
        completed: false
      },
      {
        id: 23,
        title: 'Resource & Allocation Verbs',
        words: [
          { word: 'allocate', definition: 'To distribute resources for specific purposes', example: 'Finance allocates budgets across departments.', synonyms: ['assign', 'distribute', 'apportion', 'allot'] },
          { word: 'disburse', definition: 'To pay out money from a fund', example: 'Grants are disbursed upon milestone completion.', synonyms: ['pay out', 'distribute', 'release', 'issue'] },
          { word: 'leverage', definition: 'To use resources to maximum advantage', example: 'Teams leverage existing tools before purchasing new ones.', synonyms: ['utilize', 'exploit', 'capitalize on', 'harness'] },
          { word: 'appropriate', definition: 'To set aside funds for particular use', example: 'Congress appropriated funds for infrastructure repairs.', synonyms: ['earmark', 'designate', 'allocate', 'reserve'] },
          { word: 'deplete', definition: 'To reduce resources significantly over time', example: 'Extended operations depleted emergency reserves.', synonyms: ['exhaust', 'drain', 'diminish', 'consume'] }
        ],
        completed: false
      },
      {
        id: 24,
        title: 'Communication & Discourse Verbs',
        words: [
          { word: 'articulate', definition: 'To express ideas clearly and precisely', example: 'She articulated the strategy to stakeholders.', synonyms: ['express', 'communicate', 'convey', 'verbalize'] },
          { word: 'elucidate', definition: 'To make something clearer by explanation', example: 'The appendix elucidates methodology in detail.', synonyms: ['clarify', 'explain', 'illuminate', 'expound'] },
          { word: 'stipulate', definition: 'To specify conditions as requirements', example: 'Contracts stipulate deliverables and timelines.', synonyms: ['specify', 'require', 'demand', 'prescribe'] },
          { word: 'rebut', definition: 'To argue against claims with evidence', example: 'The defense rebutted allegations with documentation.', synonyms: ['refute', 'counter', 'disprove', 'challenge'] },
          { word: 'promulgate', definition: 'To make information widely known officially', example: 'Authorities promulgated new safety regulations.', synonyms: ['announce', 'proclaim', 'publicize', 'disseminate'] }
        ],
        completed: false
      },
      {
        id: 25,
        title: 'Change & Transformation Verbs',
        words: [
          { word: 'transmute', definition: 'To change form or nature completely', example: 'The process transmutes raw data into insights.', synonyms: ['transform', 'convert', 'change', 'alter'] },
          { word: 'ameliorate', definition: 'To make a bad situation better', example: 'New policies ameliorated working conditions.', synonyms: ['improve', 'better', 'enhance', 'alleviate'] },
          { word: 'reconstitute', definition: 'To form again in different composition', example: 'Leadership reconstituted the advisory board.', synonyms: ['reform', 'reorganize', 'restructure', 'rebuild'] },
          { word: 'attenuate', definition: 'To reduce force, effect, or significance', example: 'Distance attenuates signal strength considerably.', synonyms: ['weaken', 'diminish', 'reduce', 'lessen'] },
          { word: 'catalyze', definition: 'To cause or accelerate change or action', example: 'The report catalyzed reform discussions.', synonyms: ['trigger', 'spark', 'stimulate', 'precipitate'] }
        ],
        completed: false
      },
      {
        id: 26,
        title: 'Analysis & Examination Verbs',
        words: [
          { word: 'scrutinize', definition: 'To examine something very carefully', example: 'Auditors scrutinize financial statements quarterly.', synonyms: ['examine', 'inspect', 'analyze', 'review'] },
          { word: 'parse', definition: 'To analyze text or data systematically', example: 'The algorithm parses input for key patterns.', synonyms: ['analyze', 'break down', 'examine', 'dissect'] },
          { word: 'appraise', definition: 'To assess value or quality formally', example: 'Experts appraised the property before listing.', synonyms: ['evaluate', 'assess', 'judge', 'rate'] },
          { word: 'juxtapose', definition: 'To place side by side for comparison', example: 'The study juxtaposes traditional and modern methods.', synonyms: ['compare', 'contrast', 'set beside', 'put together'] },
          { word: 'interpolate', definition: 'To estimate values between known points', example: 'We interpolate missing readings from adjacent data.', synonyms: ['estimate', 'calculate', 'derive', 'insert'] }
        ],
        completed: false
      },
      {
        id: 27,
        title: 'Influence & Persuasion Verbs',
        words: [
          { word: 'coerce', definition: 'To force compliance through pressure', example: 'Tactics that coerce users violate consent policies.', synonyms: ['force', 'pressure', 'compel', 'intimidate'] },
          { word: 'galvanize', definition: 'To shock into taking sudden action', example: 'The crisis galvanized support for reform.', synonyms: ['stimulate', 'rouse', 'spur', 'energize'] },
          { word: 'invoke', definition: 'To cite authority or rules as justification', example: 'The clause invokes liability protections.', synonyms: ['cite', 'appeal to', 'refer to', 'call upon'] },
          { word: 'induce', definition: 'To bring about by persuasion or influence', example: 'Incentives induce participation in pilot programs.', synonyms: ['persuade', 'encourage', 'prompt', 'motivate'] },
          { word: 'dissuade', definition: 'To persuade someone not to do something', example: 'Warnings dissuaded teams from risky shortcuts.', synonyms: ['discourage', 'deter', 'talk out of', 'advise against'] }
        ],
        completed: false
      },
      {
        id: 28,
        title: 'Structure & Organization Verbs',
        words: [
          { word: 'delineate', definition: 'To describe boundaries or scope precisely', example: 'The charter delineates roles and responsibilities.', synonyms: ['define', 'outline', 'specify', 'demarcate'] },
          { word: 'compartmentalize', definition: 'To divide into separate isolated sections', example: 'Teams compartmentalize sensitive projects for security.', synonyms: ['separate', 'isolate', 'partition', 'divide'] },
          { word: 'consolidate', definition: 'To combine separate items into unified whole', example: 'The merger consolidated three regional offices.', synonyms: ['combine', 'merge', 'unify', 'integrate'] },
          { word: 'stratify', definition: 'To arrange into distinct hierarchical levels', example: 'The survey stratifies respondents by income bracket.', synonyms: ['layer', 'classify', 'categorize', 'rank'] },
          { word: 'bifurcate', definition: 'To divide into two separate branches', example: 'The project bifurcates into research and development tracks.', synonyms: ['split', 'divide', 'fork', 'branch'] }
        ],
        completed: false
      },
      {
        id: 29,
        title: 'Validity & Legitimacy Verbs',
        words: [
          { word: 'authenticate', definition: 'To prove something is genuine or valid', example: 'Systems authenticate users before granting access.', synonyms: ['verify', 'validate', 'confirm', 'certify'] },
          { word: 'corroborate', definition: 'To confirm evidence with additional sources', example: 'Witnesses corroborated the timeline of events.', synonyms: ['confirm', 'verify', 'support', 'substantiate'] },
          { word: 'repudiate', definition: 'To refuse to accept or be associated with', example: 'Leadership repudiated the unauthorized statements.', synonyms: ['reject', 'deny', 'disown', 'renounce'] },
          { word: 'vindicate', definition: 'To clear from blame or suspicion', example: 'The investigation vindicated the accused employee.', synonyms: ['exonerate', 'clear', 'absolve', 'justify'] },
          { word: 'invalidate', definition: 'To make something legally or officially void', example: 'Missing signatures invalidate the agreement.', synonyms: ['void', 'nullify', 'annul', 'negate'] }
        ],
        completed: false
      },
      {
        id: 30,
        title: 'Knowledge & Expertise Verbs',
        words: [
          { word: 'discern', definition: 'To perceive or recognize subtle distinctions', example: 'Experts discern patterns invisible to novices.', synonyms: ['perceive', 'detect', 'distinguish', 'recognize'] },
          { word: 'ascertain', definition: 'To find out for certain through investigation', example: 'Inspectors ascertain compliance through audits.', synonyms: ['determine', 'discover', 'establish', 'verify'] },
          { word: 'apprehend', definition: 'To understand or grasp something mentally', example: 'Students apprehend concepts through practice.', synonyms: ['understand', 'grasp', 'comprehend', 'perceive'] },
          { word: 'expound', definition: 'To explain in detail with thoroughness', example: 'The lecturer expounded on theoretical foundations.', synonyms: ['explain', 'elaborate', 'clarify', 'describe'] },
          { word: 'fathom', definition: 'To understand something complex or puzzling', example: 'Analysts struggle to fathom the market shifts.', synonyms: ['comprehend', 'understand', 'grasp', 'penetrate'] }
        ],
        completed: false
      }
    ]
  },
  {
    id: 'phrasal-verbs',
    name: 'Phrasal Verbs',
    description: '14 Sets, 70 common phrasal verbs',
    cefr: 'B1-B2',
    icon: '',
    sets: [
      {
        id: 1,
        title: 'Phrasal Verbs  Projects & Solutions',
        words: [
          { word: 'carry on', definition: 'To continue doing something without stopping', example: 'Despite the noise, they carried on with testing.', synonyms: ['continue', 'keep going', 'persist'] },
          { word: 'put off', definition: 'To delay something to a later time', example: 'We put off the demo until Friday morning.', synonyms: ['postpone', 'delay', 'defer'] },
          { word: 'figure out', definition: 'To understand or solve something after thinking', example: 'She figured out the error in minutes.', synonyms: ['solve', 'understand', 'work out'] },
          { word: 'give up', definition: 'To stop trying because it feels impossible', example: 'Don\'t give up; try a different approach first.', synonyms: ['quit', 'stop trying', 'surrender'] },
          { word: 'come up with', definition: 'To produce an idea or possible solution', example: 'They came up with a cheaper design.', synonyms: ['devise', 'think of', 'propose'] },
        ],
        completed: false,
      },
      {
        id: 2,
        title: 'Phrasal Verbs  Research & Tasks',
        words: [
          { word: 'look into', definition: 'To investigate a subject to find facts', example: 'The team will look into the complaint.', synonyms: ['investigate', 'examine', 'check'] },
          { word: 'carry out', definition: 'To perform a task or planned action', example: 'Inspectors carried out tests at the site.', synonyms: ['perform', 'execute', 'conduct'] },
          { word: 'find out', definition: 'To discover information after searching or asking', example: 'She found out the fee was refundable.', synonyms: ['discover', 'learn', 'uncover'] },
          { word: 'point out', definition: 'To draw attention to a detail clearly', example: 'Reviewers pointed out two missing references.', synonyms: ['highlight', 'indicate', 'note'] },
          { word: 'account for', definition: 'To explain cause or proportion of something', example: 'These factors account for the regional differences.', synonyms: ['explain', 'clarify', 'justify'] },
        ],
        completed: false,
      },
      {
        id: 3,
        title: 'Phrasal Verbs  Meetings & Offers',
        words: [
          { word: 'turn down', definition: 'To reject an offer or polite request', example: 'He turned down the job after interviews.', synonyms: ['reject', 'decline', 'refuse'] },
          { word: 'bring up', definition: 'To introduce a topic for discussion', example: 'She brought up budgets during Q&A time.', synonyms: ['raise', 'introduce', 'mention'] },
          { word: 'follow up', definition: 'To take further action after initial contact', example: 'Please follow up with a summary email.', synonyms: ['pursue', 'continue', 'revisit'] },
          { word: 'set up', definition: 'To arrange or prepare something in advance', example: 'They set up the room for interviews.', synonyms: ['arrange', 'organize', 'prepare'] },
          { word: 'back up', definition: 'To support a claim with extra evidence', example: 'Please back up your points with data.', synonyms: ['support', 'corroborate', 'substantiate'] },
        ],
        completed: false,
      },
      {
        id: 4,
        title: 'Phrasal Verbs  Travel & Transport',
        words: [
          { word: 'set off', definition: 'To start a journey or depart from a place', example: 'They set off before sunrise to avoid traffic.', synonyms: ['depart', 'leave', 'start out'] },
          { word: 'check in', definition: 'To register arrival at a hotel or airport', example: 'We checked in online the night before.', synonyms: ['register', 'sign in', 'report'] },
          { word: 'get on', definition: 'To board a bus, train, or plane', example: 'We got on the tram near the square.', synonyms: ['board', 'mount', 'step onto'] },
          { word: 'get off', definition: 'To leave a bus, train, or plane', example: 'She gets off at the third station daily.', synonyms: ['disembark', 'alight', 'leave'] },
          { word: 'take off', definition: 'To leave the ground and begin flying', example: 'The plane took off twenty minutes late today.', synonyms: ['lift off', 'depart', 'ascend'] },
        ],
        completed: false,
      },
      {
        id: 5,
        title: 'Phrasal Verbs  Health & Habits',
        words: [
          { word: 'cut down on', definition: 'To reduce how much you use or eat', example: 'She cut down on sugar last winter.', synonyms: ['reduce', 'decrease', 'limit'] },
          { word: 'work out', definition: 'To exercise to improve health and strength', example: 'We work out together three mornings weekly.', synonyms: ['exercise', 'train', 'keep fit'] },
          { word: 'come down with', definition: 'To start to suffer from an illness', example: 'He came down with flu after travel.', synonyms: ['catch', 'contract', 'develop'] },
          { word: 'build up', definition: 'To develop strength or gradually increase', example: 'Training will build up stamina before races.', synonyms: ['strengthen', 'increase', 'accumulate'] },
          { word: 'pass out', definition: 'To become unconscious for a short time', example: 'He passed out after standing too fast.', synonyms: ['faint', 'black out', 'collapse'] },
        ],
        completed: false,
      },
      {
        id: 6,
        title: 'Phrasal Verbs  Money & Spending',
        words: [
          { word: 'pay off', definition: 'To finish paying a debt completely', example: 'We paid off the loan last month.', synonyms: ['clear', 'settle', 'discharge'] },
          { word: 'save up', definition: 'To collect money gradually for something', example: 'She\'s saving up for a language course.', synonyms: ['put aside', 'set aside', 'accumulate'] },
          { word: 'run out of', definition: 'To have no more remaining of something', example: 'We ran out of ink during printing.', synonyms: ['exhaust', 'deplete', 'use up'] },
          { word: 'cut back on', definition: 'To reduce spending or consumption of something', example: 'Many households cut back on dining out.', synonyms: ['reduce', 'trim', 'scale down'] },
          { word: 'splash out', definition: 'To spend a lot on something enjoyable', example: 'They splashed out on a weekend getaway.', synonyms: ['splurge', 'spend freely', 'treat yourself'] },
        ],
        completed: false,
      },
      {
        id: 7,
        title: 'Phrasal Verbs  Relationships & Feelings',
        words: [
          { word: 'get along', definition: 'To have a friendly relationship with someone', example: 'Do you get along with your neighbors?', synonyms: ['be friendly', 'get on', 'coexist'] },
          { word: 'fall out', definition: 'To argue and stop being friendly', example: 'They fell out over money last year.', synonyms: ['argue', 'quarrel', 'row'] },
          { word: 'make up', definition: 'To become friends again after conflict', example: 'They made up after a long talk.', synonyms: ['reconcile', 'resolve', 'patch up'] },
          { word: 'cheer up', definition: 'To become happier after feeling sad', example: 'A call from friends cheered her up.', synonyms: ['brighten', 'lift spirits', 'feel happier'] },
          { word: 'calm down', definition: 'To become less angry, excited, or upset', example: 'He calmed down after hearing the explanation.', synonyms: ['settle', 'relax', 'compose yourself'] },
        ],
        completed: false,
      },
      {
        id: 8,
        title: 'Phrasal Verbs  Study & School',
        words: [
          { word: 'hand in', definition: 'To submit work to a teacher officially', example: 'Please hand in essays by midday Friday.', synonyms: ['submit', 'turn in', 'deliver'] },
          { word: 'look up', definition: 'To search for information in sources', example: 'We looked up the term in the glossary.', synonyms: ['search', 'consult', 'check'] },
          { word: 'go over', definition: 'To review something carefully for accuracy', example: 'Let\'s go over the notes before class.', synonyms: ['review', 'examine', 'check over'] },
          { word: 'drop out', definition: 'To leave a course before finishing it', example: 'He dropped out when work hours increased.', synonyms: ['withdraw', 'leave', 'quit'] },
          { word: 'keep up with', definition: 'To stay at the same pace as', example: 'Reading daily helps keep up with class.', synonyms: ['match', 'maintain pace', 'stay abreast'] },
        ],
        completed: false,
      },
      {
        id: 9,
        title: 'Phrasal Verbs  Work & Careers',
        words: [
          { word: 'step down', definition: 'To resign from an important position', example: 'The director stepped down after ten years.', synonyms: ['resign', 'quit', 'leave office'] },
          { word: 'move up', definition: 'To be promoted to a higher position', example: 'He moved up after leading two projects.', synonyms: ['advance', 'be promoted', 'rise'] },
          { word: 'call off', definition: 'To cancel a planned event or activity', example: 'They called off the launch due to bugs.', synonyms: ['cancel', 'scrap', 'abort'] },
          { word: 'draw up', definition: 'To prepare a document or detailed plan', example: 'Legal counsel drew up the new contract.', synonyms: ['draft', 'prepare', 'compose'] },
          { word: 'lay off', definition: 'To dismiss workers because of limited work', example: 'The firm laid off staff after sales fell.', synonyms: ['dismiss', 'make redundant', 'let go'] },
        ],
        completed: false,
      },
      {
        id: 10,
        title: 'Phrasal Verbs  Communication & Clarity',
        words: [
          { word: 'get across', definition: 'To make people understand your message', example: 'She got across the risks without drama.', synonyms: ['communicate', 'convey', 'put over'] },
          { word: 'spell out', definition: 'To explain something clearly and in detail', example: 'The memo spells out all requirements simply.', synonyms: ['explain', 'clarify', 'detail'] },
          { word: 'tone down', definition: 'To make something less strong or direct', example: 'They toned down the language in ads.', synonyms: ['soften', 'moderate', 'reduce'] },
          { word: 'talk over', definition: 'To discuss something fully before deciding', example: 'Let\'s talk over the budget after lunch.', synonyms: ['discuss', 'deliberate', 'go over'] },
          { word: 'cut off', definition: 'To interrupt someone or stop a connection', example: 'The mic cut off during the keynote address.', synonyms: ['interrupt', 'disconnect', 'sever'] },
        ],
        completed: false,
      },
      {
        id: 11,
        title: 'Phrasal Verbs  Problems & Breakdowns',
        words: [
          { word: 'break down', definition: 'To stop working because of a fault', example: 'The lift broke down during a storm.', synonyms: ['fail', 'stop working', 'malfunction'] },
          { word: 'deal with', definition: 'To manage or solve a difficult situation', example: 'Staff dealt with complaints quickly and calmly.', synonyms: ['handle', 'manage', 'address'] },
          { word: 'think over', definition: 'To think about something carefully again', example: 'I\'ll think over the offer this weekend.', synonyms: ['consider', 'reflect', 'ponder'] },
          { word: 'get back to', definition: 'To return a call or message later', example: 'I\'ll get back to you by Tuesday.', synonyms: ['reply later', 'respond', 'return to'] },
          { word: 'sort out', definition: 'To find a practical answer to something', example: 'They sorted out seating before guests arrived.', synonyms: ['resolve', 'fix', 'arrange'] },
        ],
        completed: false,
      },
      {
        id: 12,
        title: 'Phrasal Verbs  Media & Online',
        words: [
          { word: 'log in', definition: 'To enter credentials to access an account', example: 'Please log in before viewing your messages.', synonyms: ['sign in', 'access', 'authenticate'] },
          { word: 'log out', definition: 'To remove yourself from an online session', example: 'Always log out on shared computers.', synonyms: ['sign out', 'exit', 'disconnect'] },
          { word: 'put up', definition: 'To upload files from device to server', example: 'We put up the photos after approval.', synonyms: ['upload', 'post', 'publish'] },
          { word: 'take down', definition: 'To remove a post or take something down', example: 'Moderators took down the duplicate listing.', synonyms: ['remove', 'delete', 'pull down'] },
          { word: 'sign off', definition: 'To approve formally or end communication', example: 'The manager signed off on the budget.', synonyms: ['approve', 'authorize', 'conclude'] },
        ],
        completed: false,
      },
      {
        id: 13,
        title: 'Phrasal Verbs  Causes & Results',
        words: [
          { word: 'bring about', definition: 'To cause something important to happen', example: 'The policy brought about rapid improvements locally.', synonyms: ['cause', 'generate', 'produce'] },
          { word: 'end up', definition: 'To finally happen as a result naturally', example: 'We ended up moving the launch date.', synonyms: ['result', 'turn out', 'land'] },
          { word: 'roll back', definition: 'To cancel a decision or reverse a change', example: 'They rolled back fees after complaints.', synonyms: ['reverse', 'repeal', 'undo'] },
          { word: 'scale up', definition: 'To increase something to a larger scale', example: 'We\'ll scale up hiring if demand grows.', synonyms: ['expand', 'increase', 'ramp up'] },
          { word: 'phase out', definition: 'To stop using something gradually over time', example: 'The firm phased out plastic packaging entirely.', synonyms: ['discontinue', 'retire', 'wind down'] },
        ],
        completed: false,
      },
      {
        id: 14,
        title: 'Phrasal Verbs  Careers & Applications',
        words: [
          { word: 'apply for', definition: 'To formally request a job or program', example: 'She applied for three internships in March.', synonyms: ['request', 'seek', 'put in for'] },
          { word: 'attach to', definition: 'To include something with other submitted materials', example: 'Please attach your CV to the email.', synonyms: ['add', 'include', 'append'] },
          { word: 'fill out', definition: 'To fill in required details on a form', example: 'Candidates filled out the online questionnaire.', synonyms: ['complete', 'enter', 'write in'] },
          { word: 'step in', definition: 'To start doing a role temporarily for someone', example: 'The deputy stepped in during the strike.', synonyms: ['substitute', 'cover', 'fill in'] },
          { word: 'follow through', definition: 'To continue until everything is completed', example: 'Good managers follow through on commitments.', synonyms: ['persist', 'continue', 'see through'] },
        ],
        completed: false,
      },
    ],
  },
  {
    id: 'advanced-plus',
    name: 'Advanced Plus',
    description: '150 Sets, 750 words at CEFR C1+ Level',
    cefr: 'C1+',
    icon: '',
    sets: [
      {
        id: 1,
        title: 'Academic Adjectives',
        words: [
          { word: 'paradigm', definition: 'A typical example or pattern', example: 'This represents a new paradigm', synonyms: ['model', 'framework'] },
          { word: 'ephemeral', definition: 'Lasting for a very short time', example: 'Beauty is often ephemeral', synonyms: ['temporary', 'transient'] },
          { word: 'ubiquitous', definition: 'Present everywhere', example: 'Technology is ubiquitous', synonyms: ['omnipresent', 'universal'] },
          { word: 'meticulous', definition: 'Very careful and precise', example: 'She is meticulous in her work', synonyms: ['thorough', 'precise'] },
          { word: 'resilient', definition: 'Able to recover quickly', example: 'The economy is resilient', synonyms: ['tough', 'flexible'] }
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
    icon: '',
    sets: [
      {
        id: 1,
        title: 'Elite Adjectives',
        words: [
          { word: 'serendipitous', definition: 'Occurring by happy chance', example: 'It was a serendipitous meeting', synonyms: ['fortuitous', 'lucky'] },
          { word: 'perspicacious', definition: 'Having keen insight', example: 'He is a perspicacious observer', synonyms: ['perceptive', 'astute'] },
          { word: 'magnanimous', definition: 'Very generous and forgiving', example: 'She was magnanimous in victory', synonyms: ['generous', 'noble'] },
          { word: 'ubiquitous', definition: 'Present everywhere', example: 'The concept is ubiquitous', synonyms: ['omnipresent', 'universal'] },
          { word: 'ephemeral', definition: 'Lasting for a very short time', example: 'Fame can be ephemeral', synonyms: ['temporary', 'transient'] }
        ],
        completed: false
      },
      {
        id: 2,
        title: 'Proficient  Precision Verbs I',
        words: [
          { word: 'elucidate', definition: 'To make something clear by thorough explanation', example: 'The expert elucidated the mechanism with elegant diagrams and analogies.', synonyms: ['clarify', 'explain', 'illuminate'] },
          { word: 'delineate', definition: 'To describe something precisely and in detail', example: 'The protocol delineates roles, timelines, and escalation thresholds clearly.', synonyms: ['describe', 'outline', 'depict'] },
          { word: 'circumvent', definition: 'To find a way around a problem', example: 'They circumvented bottlenecks by decentralizing approvals temporarily.', synonyms: ['evade', 'bypass', 'sidestep'] },
          { word: 'extrapolate', definition: 'To infer unknown values from known trends', example: 'Analysts extrapolated demand from three years of regional data.', synonyms: ['infer', 'project', 'extend'] },
          { word: 'substantiate', definition: 'To provide evidence to support a claim', example: 'The team substantiated the hypothesis using blinded trials.', synonyms: ['verify', 'corroborate', 'validate'] }
        ],
        completed: false
      },
      {
        id: 3,
        title: 'Proficient  Precision Verbs II',
        words: [
          { word: 'exacerbate', definition: 'To make a problem worse or more severe', example: 'Cutting support would exacerbate inequality in remote districts.', synonyms: ['worsen', 'aggravate', 'intensify'] },
          { word: 'ameliorate', definition: 'To make something better or more tolerable', example: 'Targeted tutoring ameliorated achievement gaps noticeably.', synonyms: ['improve', 'mitigate', 'relieve'] },
          { word: 'obviate', definition: 'To remove a need by effective action', example: 'Automation obviated manual checks in routine cases.', synonyms: ['remove', 'forestall', 'eliminate'] },
          { word: 'preclude', definition: 'To prevent something from happening at all', example: 'Conflicts of interest preclude reviewers from participating.', synonyms: ['prevent', 'rule out', 'bar'] },
          { word: 'expedite', definition: 'To speed up a process or action', example: 'Additional staff expedited the backlog before holidays.', synonyms: ['hasten', 'accelerate', 'quicken'] }
        ],
        completed: false
      },
      {
        id: 4,
        title: 'Proficient  Evaluative Adjectives',
        words: [
          { word: 'intractable', definition: 'Hard to control or solve effectively', example: 'The region faces intractable disputes over water rights.', synonyms: ['unmanageable', 'stubborn', 'unruly'] },
          { word: 'ubiquitous', definition: 'Present everywhere, common in many places', example: 'Smartphones are ubiquitous even in rural districts now.', synonyms: ['omnipresent', 'pervasive', 'widespread'] },
          { word: 'tenuous', definition: 'Very weak, slight, or lacking real substance', example: 'The link between metrics and outcomes was tenuous.', synonyms: ['fragile', 'flimsy', 'insubstantial'] },
          { word: 'superfluous', definition: 'Unnecessary because more than what\'s needed', example: 'Cut superfluous steps to streamline compliance checks.', synonyms: ['unnecessary', 'redundant', 'excessive'] },
          { word: 'seminal', definition: 'Strongly influential and shaping later developments', example: 'Her seminal paper reframed the entire discipline.', synonyms: ['influential', 'foundational', 'groundbreaking'] }
        ],
        completed: false
      },
      {
        id: 5,
        title: 'Proficient  Abstract Nouns I',
        words: [
          { word: 'equivocation', definition: 'Deliberate vagueness to avoid giving truth', example: 'The spokesperson\'s equivocation eroded public confidence quickly.', synonyms: ['evasiveness', 'ambiguity', 'hedging'] },
          { word: 'prerogative', definition: 'Exclusive right or privilege of a person', example: 'Staffing decisions are the director\'s prerogative under bylaws.', synonyms: ['privilege', 'entitlement', 'right'] },
          { word: 'verisimilitude', definition: 'Appearance of being true or real', example: 'The novel\'s detail gives scenes striking verisimilitude.', synonyms: ['realism', 'authenticity', 'plausibility'] },
          { word: 'alacrity', definition: 'Cheerful readiness and brisk prompt willingness', example: 'She accepted the invitation with unusual alacrity.', synonyms: ['eagerness', 'readiness', 'willingness'] },
          { word: 'recourse', definition: 'Help or protection turned to in difficulty', example: 'When negotiations failed, courts were our recourse.', synonyms: ['resort', 'refuge', 'aid'] }
        ],
        completed: false
      },
      {
        id: 6,
        title: 'Proficient  Argumentation Verbs',
        words: [
          { word: 'refute', definition: 'To prove a statement is completely wrong', example: 'The replication refuted claims of extraordinary accuracy.', synonyms: ['disprove', 'rebut', 'invalidate'] },
          { word: 'concede', definition: 'To admit something is true after resistance', example: 'The minister conceded delays were partly avoidable.', synonyms: ['admit', 'yield', 'acknowledge'] },
          { word: 'corroborate', definition: 'To confirm with additional independent supporting evidence', example: 'Multiple labs corroborated the surprising findings independently.', synonyms: ['confirm', 'validate', 'substantiate'] },
          { word: 'contend', definition: 'To argue firmly that something is true', example: 'Scholars contend that context alters perceived fairness.', synonyms: ['argue', 'maintain', 'assert'] },
          { word: 'postulate', definition: 'To suggest a theory as a basic premise', example: 'The authors postulate a hidden variable driving variance.', synonyms: ['propose', 'posit', 'hypothesize'] }
        ],
        completed: false
      },
      {
        id: 7,
        title: 'Proficient  Nuanced Adjectives II',
        words: [
          { word: 'fastidious', definition: 'Very attentive to detail and cleanliness', example: 'A fastidious editor catches tone shifts and ambiguities.', synonyms: ['meticulous', 'scrupulous', 'punctilious'] },
          { word: 'obsequious', definition: 'Excessively eager to please more powerful people', example: 'Obsequious praise undermined honest feedback in meetings.', synonyms: ['servile', 'sycophantic', 'fawning'] },
          { word: 'magnanimous', definition: 'Generous toward a rival or offender', example: 'In victory, she was magnanimous toward critics.', synonyms: ['generous', 'forgiving', 'big-hearted'] },
          { word: 'parsimonious', definition: 'Extremely unwilling to spend money; very frugal', example: 'A parsimonious budget risks underfunding maintenance.', synonyms: ['stingy', 'miserly', 'tight-fisted'] },
          { word: 'obdurate', definition: 'Stubbornly refusing to change one\'s opinion', example: 'Negotiators met an obdurate stance on key clauses.', synonyms: ['stubborn', 'unyielding', 'inflexible'] }
        ],
        completed: false
      },
      {
        id: 8,
        title: 'Proficient  Abstract Nouns II',
        words: [
          { word: 'perspicacity', definition: 'Keen insight and quick understanding of situations', example: 'Her perspicacity revealed hidden assumptions immediately.', synonyms: ['insight', 'acuity', 'shrewdness'] },
          { word: 'temerity', definition: 'Excessive confidence or boldness showing rashness', example: 'He had the temerity to dismiss peer review.', synonyms: ['audacity', 'recklessness', 'boldness'] },
          { word: 'probity', definition: 'Strong moral principles; honesty and integrity', example: 'Public probity depends on transparent procurement.', synonyms: ['integrity', 'honesty', 'uprightness'] },
          { word: 'effrontery', definition: 'Shameless boldness shown in insulting behavior', example: 'He spoke with effrontery about ignoring regulations.', synonyms: ['impudence', 'brazenness', 'cheek'] },
          { word: 'equanimity', definition: 'Calmness and composure under stressful pressure', example: 'She handled the crisis with admirable equanimity.', synonyms: ['calm', 'composure', 'serenity'] }
        ],
        completed: false
      },
      {
        id: 9,
        title: 'Proficient  Science/Logic Adjectives',
        words: [
          { word: 'spurious', definition: 'Not genuine; false or lacking authentic origin', example: 'Controls exposed spurious correlations in the dataset.', synonyms: ['false', 'bogus', 'counterfeit'] },
          { word: 'ineluctable', definition: 'Impossible to avoid or escape entirely', example: 'Ageing is an ineluctable aspect of biology.', synonyms: ['inevitable', 'unavoidable', 'inescapable'] },
          { word: 'inchoate', definition: 'Just begun and not yet fully formed', example: 'Their inchoate plan lacked milestones and owners.', synonyms: ['rudimentary', 'nascent', 'embryonic'] },
          { word: 'axiomatic', definition: 'Self-evident and accepted without requiring proof', example: 'It\'s axiomatic that incentives shape behavior.', synonyms: ['self-evident', 'unquestionable', 'obvious'] },
          { word: 'orthogonal', definition: 'Statistically independent or unrelated in effect', example: 'The variables were orthogonal across all cohorts.', synonyms: ['independent', 'uncorrelated', 'perpendicular'] }
        ],
        completed: false
      },
      {
        id: 10,
        title: 'Proficient  Economics & Philosophy Nouns',
        words: [
          { word: 'externality', definition: 'Indirect cost or benefit affecting others', example: 'Congestion pricing internalizes transport externalities efficiently.', synonyms: ['side effect', 'spillover', 'indirect effect'] },
          { word: 'tautology', definition: 'Needless repetition; statement true by definition', example: 'Free gift is a common tautology in ads.', synonyms: ['redundancy', 'repetition', 'circular definition'] },
          { word: 'hegemony', definition: 'Dominant leadership or influence over others', example: 'Cultural hegemony shapes taste and aspiration.', synonyms: ['dominance', 'supremacy', 'ascendancy'] },
          { word: 'anomie', definition: 'Social instability from breakdown of norms', example: 'Rapid change can trigger anomie across communities.', synonyms: ['normlessness', 'social breakdown', 'alienation'] },
          { word: 'teleology', definition: 'Explanation by purposes rather than causes', example: 'The essay critiques teleology in evolutionary narratives.', synonyms: ['final cause', 'purpose-based account', 'ends-based view'] }
        ],
        completed: false
      }
    ]
  }
];

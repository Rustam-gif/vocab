// BEGINNER LEVEL SETS (A1-A2)
// 10 sets per category: GENERAL, TRAVEL, BUSINESS, IELTS

export const beginnerGeneralSets = [
  // GENERAL Set 1: Family Members
  {
    id: 'bg1',
    title: 'Family Members',
    words: [
      { word: 'mother', phonetic: '/ˈmʌðər/', definition: 'A female parent in a family', example: 'My mother cooks dinner every evening.', synonyms: ['mom', 'mum', 'mama'] },
      { word: 'father', phonetic: '/ˈfɑːðər/', definition: 'A male parent in a family', example: 'My father works in an office downtown.', synonyms: ['dad', 'papa', 'daddy'] },
      { word: 'sister', phonetic: '/ˈsɪstər/', definition: 'A female sibling you share parents with', example: 'My sister helps me with my homework.', synonyms: ['sibling', 'sis', 'female sibling'] },
      { word: 'brother', phonetic: '/ˈbrʌðər/', definition: 'A male sibling you share parents with', example: 'My brother plays football after school.', synonyms: ['sibling', 'bro', 'male sibling'] },
      { word: 'grandmother', phonetic: '/ˈɡrænmʌðər/', definition: 'The mother of your parent', example: 'My grandmother tells wonderful stories.', synonyms: ['grandma', 'granny', 'nana'] }
    ],
    completed: false
  },
  // GENERAL Set 2: Colors
  {
    id: 'bg2',
    title: 'Colors',
    words: [
      { word: 'red', phonetic: '/red/', definition: 'The color of blood or fire', example: 'She wore a beautiful red dress.', synonyms: ['crimson', 'scarlet', 'ruby'] },
      { word: 'blue', phonetic: '/bluː/', definition: 'The color of the sky or ocean', example: 'The blue sky looks beautiful today.', synonyms: ['azure', 'navy', 'sapphire'] },
      { word: 'green', phonetic: '/ɡriːn/', definition: 'The color of grass and leaves', example: 'The green trees look fresh in spring.', synonyms: ['emerald', 'lime', 'olive'] },
      { word: 'yellow', phonetic: '/ˈjeloʊ/', definition: 'The color of the sun or bananas', example: 'The yellow flowers brighten the garden.', synonyms: ['golden', 'lemon', 'amber'] },
      { word: 'black', phonetic: '/blæk/', definition: 'The darkest color without light', example: 'He wears a black jacket every day.', synonyms: ['dark', 'ebony', 'jet'] }
    ],
    completed: false
  },
  // GENERAL Set 3: Numbers & Counting
  {
    id: 'bg3',
    title: 'Numbers & Counting',
    words: [
      { word: 'count', phonetic: '/kaʊnt/', definition: 'To say numbers in order', example: 'Children learn to count to ten first.', synonyms: ['number', 'tally', 'enumerate'] },
      { word: 'add', phonetic: '/æd/', definition: 'To put numbers together for total', example: 'Please add these numbers for me.', synonyms: ['plus', 'sum', 'combine'] },
      { word: 'first', phonetic: '/fɜːrst/', definition: 'Coming before all others in order', example: 'She was the first to arrive.', synonyms: ['initial', 'primary', 'earliest'] },
      { word: 'last', phonetic: '/læst/', definition: 'Coming after all others in order', example: 'He was the last person to leave.', synonyms: ['final', 'ultimate', 'ending'] },
      { word: 'many', phonetic: '/ˈmeni/', definition: 'A large number of things', example: 'There are many books on the shelf.', synonyms: ['numerous', 'plenty', 'lots'] }
    ],
    completed: false
  },
  // GENERAL Set 4: Body Parts
  {
    id: 'bg4',
    title: 'Body Parts',
    words: [
      { word: 'head', phonetic: '/hed/', definition: 'The top part of your body', example: 'Wear a hat to protect your head.', synonyms: ['skull', 'crown', 'noggin'] },
      { word: 'hand', phonetic: '/hænd/', definition: 'The part at the end of arm', example: 'She raised her hand to ask.', synonyms: ['palm', 'fist', 'mitt'] },
      { word: 'foot', phonetic: '/fʊt/', definition: 'The part at the end of leg', example: 'My foot hurts from walking too much.', synonyms: ['sole', 'toes', 'heel'] },
      { word: 'eye', phonetic: '/aɪ/', definition: 'The part you see things with', example: 'She has beautiful blue eyes.', synonyms: ['sight', 'vision', 'peeper'] },
      { word: 'mouth', phonetic: '/maʊθ/', definition: 'The part you eat and talk with', example: 'Open your mouth and say hello.', synonyms: ['lips', 'jaw', 'oral cavity'] }
    ],
    completed: false
  },
  // GENERAL Set 5: Food Basics
  {
    id: 'bg5',
    title: 'Food Basics',
    words: [
      { word: 'bread', phonetic: '/bred/', definition: 'A baked food made from flour', example: 'I eat bread with butter for breakfast.', synonyms: ['loaf', 'toast', 'roll'] },
      { word: 'milk', phonetic: '/mɪlk/', definition: 'A white drink from cows', example: 'Children drink milk every morning.', synonyms: ['dairy', 'cream', 'lactose'] },
      { word: 'egg', phonetic: '/eɡ/', definition: 'An oval food from chickens', example: 'She cooks eggs for breakfast daily.', synonyms: ['yolk', 'shell', 'ovum'] },
      { word: 'rice', phonetic: '/raɪs/', definition: 'Small white grains for eating', example: 'We eat rice with vegetables for dinner.', synonyms: ['grain', 'paddy', 'cereal'] },
      { word: 'fruit', phonetic: '/fruːt/', definition: 'Sweet food that grows on trees', example: 'Eating fruit is good for health.', synonyms: ['produce', 'berry', 'harvest'] }
    ],
    completed: false
  },
  // GENERAL Set 6: Weather Words
  {
    id: 'bg6',
    title: 'Weather Words',
    words: [
      { word: 'sunny', phonetic: '/ˈsʌni/', definition: 'When the sun shines brightly', example: 'It is sunny and warm today.', synonyms: ['bright', 'clear', 'fair'] },
      { word: 'rainy', phonetic: '/ˈreɪni/', definition: 'When water falls from clouds', example: 'Take an umbrella on rainy days.', synonyms: ['wet', 'showery', 'drizzly'] },
      { word: 'cloudy', phonetic: '/ˈklaʊdi/', definition: 'When clouds cover the sky', example: 'The sky is cloudy this morning.', synonyms: ['overcast', 'grey', 'dull'] },
      { word: 'windy', phonetic: '/ˈwɪndi/', definition: 'When air moves fast outside', example: 'Hold your hat on windy days.', synonyms: ['breezy', 'gusty', 'blustery'] },
      { word: 'cold', phonetic: '/koʊld/', definition: 'When temperature is very low', example: 'Wear a coat when it is cold.', synonyms: ['chilly', 'freezing', 'cool'] }
    ],
    completed: false
  },
  // GENERAL Set 7: Clothes
  {
    id: 'bg7',
    title: 'Clothes',
    words: [
      { word: 'shirt', phonetic: '/ʃɜːrt/', definition: 'Clothing for the upper body', example: 'He wears a white shirt to work.', synonyms: ['top', 'blouse', 'tee'] },
      { word: 'pants', phonetic: '/pænts/', definition: 'Clothing that covers both legs', example: 'These pants are very comfortable.', synonyms: ['trousers', 'jeans', 'slacks'] },
      { word: 'shoes', phonetic: '/ʃuːz/', definition: 'Covering worn on your feet', example: 'Put on your shoes before going out.', synonyms: ['footwear', 'sneakers', 'boots'] },
      { word: 'hat', phonetic: '/hæt/', definition: 'Covering worn on your head', example: 'She wears a hat in the sun.', synonyms: ['cap', 'beanie', 'headwear'] },
      { word: 'jacket', phonetic: '/ˈdʒækɪt/', definition: 'A short coat for warmth', example: 'Bring a jacket for the evening.', synonyms: ['coat', 'blazer', 'sweater'] }
    ],
    completed: false
  },
  // GENERAL Set 8: Animals
  {
    id: 'bg8',
    title: 'Animals',
    words: [
      { word: 'dog', phonetic: '/dɔːɡ/', definition: 'A common pet that barks', example: 'The dog plays in the garden.', synonyms: ['puppy', 'hound', 'canine'] },
      { word: 'cat', phonetic: '/kæt/', definition: 'A small furry pet that meows', example: 'The cat sleeps on the sofa.', synonyms: ['kitten', 'feline', 'kitty'] },
      { word: 'bird', phonetic: '/bɜːrd/', definition: 'An animal with wings that flies', example: 'A bird sings in the tree.', synonyms: ['fowl', 'songbird', 'avian'] },
      { word: 'fish', phonetic: '/fɪʃ/', definition: 'An animal that lives in water', example: 'The fish swims in the tank.', synonyms: ['seafood', 'aquatic', 'marine'] },
      { word: 'horse', phonetic: '/hɔːrs/', definition: 'A large animal people ride', example: 'She rides a horse every weekend.', synonyms: ['pony', 'stallion', 'mare'] }
    ],
    completed: false
  },
  // GENERAL Set 9: Home Objects
  {
    id: 'bg9',
    title: 'Home Objects',
    words: [
      { word: 'table', phonetic: '/ˈteɪbəl/', definition: 'Furniture with flat top for items', example: 'Put the books on the table.', synonyms: ['desk', 'counter', 'surface'] },
      { word: 'chair', phonetic: '/tʃer/', definition: 'Furniture for sitting on', example: 'Please sit on the chair.', synonyms: ['seat', 'stool', 'bench'] },
      { word: 'bed', phonetic: '/bed/', definition: 'Furniture for sleeping on', example: 'I go to bed at ten.', synonyms: ['mattress', 'bunk', 'cot'] },
      { word: 'lamp', phonetic: '/læmp/', definition: 'An object that gives light', example: 'Turn on the lamp to read.', synonyms: ['light', 'bulb', 'lantern'] },
      { word: 'clock', phonetic: '/klɒk/', definition: 'An object that shows time', example: 'The clock says it is noon.', synonyms: ['watch', 'timer', 'timepiece'] }
    ],
    completed: false
  },
  // GENERAL Set 10: Daily Activities
  {
    id: 'bg10',
    title: 'Daily Activities',
    words: [
      { word: 'wake', phonetic: '/weɪk/', definition: 'To stop sleeping and open eyes', example: 'I wake up at seven every day.', synonyms: ['arise', 'awaken', 'stir'] },
      { word: 'wash', phonetic: '/wɒʃ/', definition: 'To clean with water and soap', example: 'Wash your hands before eating.', synonyms: ['clean', 'rinse', 'scrub'] },
      { word: 'dress', phonetic: '/dres/', definition: 'To put clothes on your body', example: 'She dresses quickly in the morning.', synonyms: ['clothe', 'wear', 'attire'] },
      { word: 'cook', phonetic: '/kʊk/', definition: 'To prepare food using heat', example: 'My father cooks dinner on weekends.', synonyms: ['prepare', 'make', 'bake'] },
      { word: 'clean', phonetic: '/kliːn/', definition: 'To remove dirt from something', example: 'I clean my room every Saturday.', synonyms: ['tidy', 'sweep', 'wipe'] }
    ],
    completed: false
  }
];

export const beginnerTravelSets = [
  // TRAVEL Set 1: At the Airport
  {
    id: 'bt1',
    title: 'At the Airport',
    words: [
      { word: 'plane', phonetic: '/pleɪn/', definition: 'A vehicle that flies in sky', example: 'The plane leaves at three o\'clock.', synonyms: ['aircraft', 'jet', 'airplane'] },
      { word: 'ticket', phonetic: '/ˈtɪkɪt/', definition: 'Paper that lets you travel', example: 'Show your ticket at the gate.', synonyms: ['pass', 'boarding pass', 'fare'] },
      { word: 'passport', phonetic: '/ˈpæspɔːrt/', definition: 'Document for traveling to other countries', example: 'You need a passport to fly abroad.', synonyms: ['ID', 'travel document', 'papers'] },
      { word: 'luggage', phonetic: '/ˈlʌɡɪdʒ/', definition: 'Bags you take when traveling', example: 'Put your luggage on the belt.', synonyms: ['bags', 'baggage', 'suitcase'] },
      { word: 'gate', phonetic: '/ɡeɪt/', definition: 'Door where you board the plane', example: 'Go to gate five for boarding.', synonyms: ['entrance', 'door', 'terminal'] }
    ],
    completed: false
  },
  // TRAVEL Set 2: Hotel Basics
  {
    id: 'bt2',
    title: 'Hotel Basics',
    words: [
      { word: 'room', phonetic: '/ruːm/', definition: 'A space in a building for sleeping', example: 'My hotel room has a nice view.', synonyms: ['chamber', 'suite', 'accommodation'] },
      { word: 'key', phonetic: '/kiː/', definition: 'Object that opens a door', example: 'Take your room key with you.', synonyms: ['card', 'pass', 'opener'] },
      { word: 'bed', phonetic: '/bed/', definition: 'Furniture for sleeping at night', example: 'The hotel bed is very comfortable.', synonyms: ['mattress', 'bunk', 'berth'] },
      { word: 'towel', phonetic: '/ˈtaʊəl/', definition: 'Cloth for drying your body', example: 'There are fresh towels in the bathroom.', synonyms: ['cloth', 'linen', 'napkin'] },
      { word: 'lobby', phonetic: '/ˈlɒbi/', definition: 'The entrance area of a hotel', example: 'Meet me in the hotel lobby.', synonyms: ['reception', 'foyer', 'entrance'] }
    ],
    completed: false
  },
  // TRAVEL Set 3: Transportation
  {
    id: 'bt3',
    title: 'Transportation',
    words: [
      { word: 'bus', phonetic: '/bʌs/', definition: 'A large vehicle for many passengers', example: 'Take the bus to the city center.', synonyms: ['coach', 'shuttle', 'transit'] },
      { word: 'train', phonetic: '/treɪn/', definition: 'A vehicle that runs on tracks', example: 'The train arrives at platform two.', synonyms: ['railway', 'metro', 'rail'] },
      { word: 'taxi', phonetic: '/ˈtæksi/', definition: 'A car you pay to ride in', example: 'Call a taxi to the airport.', synonyms: ['cab', 'rideshare', 'hire car'] },
      { word: 'subway', phonetic: '/ˈsʌbweɪ/', definition: 'A train that goes underground', example: 'The subway is fast and cheap.', synonyms: ['metro', 'underground', 'tube'] },
      { word: 'ferry', phonetic: '/ˈferi/', definition: 'A boat that carries passengers', example: 'Take the ferry to the island.', synonyms: ['boat', 'ship', 'vessel'] }
    ],
    completed: false
  },
  // TRAVEL Set 4: Directions
  {
    id: 'bt4',
    title: 'Directions',
    words: [
      { word: 'left', phonetic: '/left/', definition: 'The opposite side of right', example: 'Turn left at the traffic light.', synonyms: ['port', 'leftward', 'left side'] },
      { word: 'right', phonetic: '/raɪt/', definition: 'The opposite side of left', example: 'The bank is on your right.', synonyms: ['starboard', 'rightward', 'right side'] },
      { word: 'straight', phonetic: '/streɪt/', definition: 'Going forward without turning', example: 'Go straight for two blocks.', synonyms: ['ahead', 'forward', 'direct'] },
      { word: 'near', phonetic: '/nɪr/', definition: 'Close to something or someone', example: 'The hotel is near the beach.', synonyms: ['close', 'nearby', 'adjacent'] },
      { word: 'far', phonetic: '/fɑːr/', definition: 'A long distance from something', example: 'The airport is far from here.', synonyms: ['distant', 'remote', 'away'] }
    ],
    completed: false
  },
  // TRAVEL Set 5: At the Restaurant
  {
    id: 'bt5',
    title: 'At the Restaurant',
    words: [
      { word: 'menu', phonetic: '/ˈmenjuː/', definition: 'A list of food you can order', example: 'Can I see the menu please?', synonyms: ['list', 'card', 'selection'] },
      { word: 'order', phonetic: '/ˈɔːrdər/', definition: 'To ask for food at restaurant', example: 'I would like to order now.', synonyms: ['request', 'ask for', 'choose'] },
      { word: 'bill', phonetic: '/bɪl/', definition: 'Paper showing how much to pay', example: 'Can we have the bill please?', synonyms: ['check', 'tab', 'receipt'] },
      { word: 'waiter', phonetic: '/ˈweɪtər/', definition: 'Person who serves food in restaurant', example: 'The waiter brought our drinks.', synonyms: ['server', 'attendant', 'staff'] },
      { word: 'tip', phonetic: '/tɪp/', definition: 'Extra money given for good service', example: 'Leave a tip for the waiter.', synonyms: ['gratuity', 'bonus', 'extra'] }
    ],
    completed: false
  },
  // TRAVEL Set 6: Sightseeing
  {
    id: 'bt6',
    title: 'Sightseeing',
    words: [
      { word: 'map', phonetic: '/mæp/', definition: 'Paper showing places and streets', example: 'Use a map to find the museum.', synonyms: ['guide', 'chart', 'atlas'] },
      { word: 'camera', phonetic: '/ˈkæmərə/', definition: 'Device for taking pictures', example: 'Bring your camera for photos.', synonyms: ['phone', 'device', 'recorder'] },
      { word: 'tour', phonetic: '/tʊr/', definition: 'A trip to see interesting places', example: 'We took a tour of the city.', synonyms: ['trip', 'excursion', 'visit'] },
      { word: 'guide', phonetic: '/ɡaɪd/', definition: 'Person who shows you places', example: 'The tour guide speaks English.', synonyms: ['leader', 'escort', 'host'] },
      { word: 'photo', phonetic: '/ˈfoʊtoʊ/', definition: 'A picture taken with camera', example: 'Can you take a photo of me?', synonyms: ['picture', 'image', 'snapshot'] }
    ],
    completed: false
  },
  // TRAVEL Set 7: Money & Shopping
  {
    id: 'bt7',
    title: 'Money & Shopping',
    words: [
      { word: 'money', phonetic: '/ˈmʌni/', definition: 'What you use to buy things', example: 'I need to change some money.', synonyms: ['cash', 'currency', 'funds'] },
      { word: 'price', phonetic: '/praɪs/', definition: 'How much something costs', example: 'What is the price of this?', synonyms: ['cost', 'amount', 'value'] },
      { word: 'cheap', phonetic: '/tʃiːp/', definition: 'Not costing a lot of money', example: 'This souvenir is very cheap.', synonyms: ['affordable', 'inexpensive', 'budget'] },
      { word: 'expensive', phonetic: '/ɪkˈspensɪv/', definition: 'Costing a lot of money', example: 'The hotel is too expensive.', synonyms: ['costly', 'pricey', 'dear'] },
      { word: 'change', phonetic: '/tʃeɪndʒ/', definition: 'Coins returned after paying', example: 'Keep the change as a tip.', synonyms: ['coins', 'remainder', 'leftover'] }
    ],
    completed: false
  },
  // TRAVEL Set 8: Emergency & Help
  {
    id: 'bt8',
    title: 'Emergency & Help',
    words: [
      { word: 'help', phonetic: '/help/', definition: 'To give assistance to someone', example: 'Can you help me find my hotel?', synonyms: ['assist', 'aid', 'support'] },
      { word: 'lost', phonetic: '/lɒst/', definition: 'Not knowing where you are', example: 'I am lost and need directions.', synonyms: ['confused', 'misplaced', 'astray'] },
      { word: 'police', phonetic: '/pəˈliːs/', definition: 'Officers who keep people safe', example: 'Call the police if you need help.', synonyms: ['officers', 'cops', 'authorities'] },
      { word: 'hospital', phonetic: '/ˈhɒspɪtl/', definition: 'Building where sick people go', example: 'Where is the nearest hospital?', synonyms: ['clinic', 'medical center', 'infirmary'] },
      { word: 'safe', phonetic: '/seɪf/', definition: 'Free from danger or harm', example: 'This area is very safe at night.', synonyms: ['secure', 'protected', 'sheltered'] }
    ],
    completed: false
  },
  // TRAVEL Set 9: Weather & Seasons
  {
    id: 'bt9',
    title: 'Weather for Travel',
    words: [
      { word: 'hot', phonetic: '/hɒt/', definition: 'Having a high temperature', example: 'It is very hot in summer here.', synonyms: ['warm', 'heated', 'tropical'] },
      { word: 'cold', phonetic: '/koʊld/', definition: 'Having a low temperature', example: 'Winters are cold in the mountains.', synonyms: ['chilly', 'freezing', 'cool'] },
      { word: 'rain', phonetic: '/reɪn/', definition: 'Water falling from the sky', example: 'Pack an umbrella for the rain.', synonyms: ['shower', 'drizzle', 'downpour'] },
      { word: 'snow', phonetic: '/snoʊ/', definition: 'Frozen water falling from sky', example: 'There is snow in the mountains.', synonyms: ['frost', 'ice', 'flurry'] },
      { word: 'sunny', phonetic: '/ˈsʌni/', definition: 'When the sun is shining', example: 'The beach is lovely on sunny days.', synonyms: ['bright', 'clear', 'fair'] }
    ],
    completed: false
  },
  // TRAVEL Set 10: Booking & Reservations
  {
    id: 'bt10',
    title: 'Booking & Reservations',
    words: [
      { word: 'book', phonetic: '/bʊk/', definition: 'To reserve something in advance', example: 'I need to book a hotel room.', synonyms: ['reserve', 'schedule', 'arrange'] },
      { word: 'confirm', phonetic: '/kənˈfɜːrm/', definition: 'To make sure something is correct', example: 'Please confirm your reservation.', synonyms: ['verify', 'validate', 'check'] },
      { word: 'cancel', phonetic: '/ˈkænsəl/', definition: 'To say you will not come', example: 'I need to cancel my booking.', synonyms: ['annul', 'void', 'revoke'] },
      { word: 'available', phonetic: '/əˈveɪləbəl/', definition: 'Ready to be used or taken', example: 'Are any rooms available tonight?', synonyms: ['free', 'open', 'vacant'] },
      { word: 'full', phonetic: '/fʊl/', definition: 'Having no empty space left', example: 'The hotel is full this weekend.', synonyms: ['booked', 'occupied', 'complete'] }
    ],
    completed: false
  }
];

export const beginnerBusinessSets = [
  // BUSINESS Set 1: Office Basics
  {
    id: 'bb1',
    title: 'Office Basics',
    words: [
      { word: 'office', phonetic: '/ˈɒfɪs/', definition: 'A room where people work', example: 'I work in an office downtown.', synonyms: ['workplace', 'workspace', 'bureau'] },
      { word: 'desk', phonetic: '/desk/', definition: 'A table for working at', example: 'My computer is on my desk.', synonyms: ['table', 'workstation', 'counter'] },
      { word: 'computer', phonetic: '/kəmˈpjuːtər/', definition: 'A machine for work and internet', example: 'I use a computer every day.', synonyms: ['PC', 'laptop', 'device'] },
      { word: 'phone', phonetic: '/foʊn/', definition: 'A device for making calls', example: 'Answer the phone when it rings.', synonyms: ['telephone', 'mobile', 'cell'] },
      { word: 'printer', phonetic: '/ˈprɪntər/', definition: 'A machine that prints papers', example: 'The printer is out of paper.', synonyms: ['copier', 'machine', 'output device'] }
    ],
    completed: false
  },
  // BUSINESS Set 2: Job Titles
  {
    id: 'bb2',
    title: 'Job Titles',
    words: [
      { word: 'boss', phonetic: '/bɒs/', definition: 'The person in charge at work', example: 'My boss is very friendly.', synonyms: ['manager', 'supervisor', 'chief'] },
      { word: 'employee', phonetic: '/ɪmˈplɔɪiː/', definition: 'A person who works for company', example: 'She is a new employee here.', synonyms: ['worker', 'staff', 'team member'] },
      { word: 'colleague', phonetic: '/ˈkɒliːɡ/', definition: 'A person you work with', example: 'My colleague helps me a lot.', synonyms: ['coworker', 'teammate', 'associate'] },
      { word: 'secretary', phonetic: '/ˈsekrətri/', definition: 'Person who answers calls and emails', example: 'The secretary will help you.', synonyms: ['assistant', 'receptionist', 'admin'] },
      { word: 'client', phonetic: '/ˈklaɪənt/', definition: 'A person who uses your service', example: 'We have a meeting with a client.', synonyms: ['customer', 'buyer', 'patron'] }
    ],
    completed: false
  },
  // BUSINESS Set 3: Meetings
  {
    id: 'bb3',
    title: 'Meetings',
    words: [
      { word: 'meeting', phonetic: '/ˈmiːtɪŋ/', definition: 'When people come together to talk', example: 'The meeting starts at ten.', synonyms: ['conference', 'discussion', 'session'] },
      { word: 'schedule', phonetic: '/ˈʃedjuːl/', definition: 'A plan showing when things happen', example: 'Check your schedule for today.', synonyms: ['calendar', 'timetable', 'agenda'] },
      { word: 'agenda', phonetic: '/əˈdʒendə/', definition: 'A list of things to discuss', example: 'What is on the agenda today?', synonyms: ['plan', 'list', 'program'] },
      { word: 'attend', phonetic: '/əˈtend/', definition: 'To be present at an event', example: 'Please attend the meeting tomorrow.', synonyms: ['join', 'participate', 'be present'] },
      { word: 'discuss', phonetic: '/dɪˈskʌs/', definition: 'To talk about something together', example: 'We need to discuss the project.', synonyms: ['talk about', 'review', 'debate'] }
    ],
    completed: false
  },
  // BUSINESS Set 4: Communication
  {
    id: 'bb4',
    title: 'Business Communication',
    words: [
      { word: 'email', phonetic: '/ˈiːmeɪl/', definition: 'A message sent by computer', example: 'I will send you an email today.', synonyms: ['message', 'mail', 'correspondence'] },
      { word: 'call', phonetic: '/kɔːl/', definition: 'To speak on the phone', example: 'I will call you this afternoon.', synonyms: ['phone', 'ring', 'contact'] },
      { word: 'reply', phonetic: '/rɪˈplaɪ/', definition: 'To respond to a message', example: 'Please reply to my email soon.', synonyms: ['respond', 'answer', 'write back'] },
      { word: 'send', phonetic: '/send/', definition: 'To make something go to someone', example: 'Send the report by Friday.', synonyms: ['deliver', 'transmit', 'forward'] },
      { word: 'receive', phonetic: '/rɪˈsiːv/', definition: 'To get something from someone', example: 'Did you receive my message?', synonyms: ['get', 'obtain', 'accept'] }
    ],
    completed: false
  },
  // BUSINESS Set 5: Time & Deadlines
  {
    id: 'bb5',
    title: 'Time & Deadlines',
    words: [
      { word: 'deadline', phonetic: '/ˈdedlaɪn/', definition: 'The last day to finish something', example: 'The deadline is next Monday.', synonyms: ['due date', 'cutoff', 'limit'] },
      { word: 'urgent', phonetic: '/ˈɜːrdʒənt/', definition: 'Needing to be done quickly', example: 'This task is very urgent.', synonyms: ['important', 'pressing', 'critical'] },
      { word: 'late', phonetic: '/leɪt/', definition: 'After the expected time', example: 'Sorry I am late for the meeting.', synonyms: ['delayed', 'overdue', 'behind'] },
      { word: 'early', phonetic: '/ˈɜːrli/', definition: 'Before the expected time', example: 'I arrived early to prepare.', synonyms: ['ahead', 'prompt', 'beforehand'] },
      { word: 'on time', phonetic: '/ɒn taɪm/', definition: 'At the correct scheduled time', example: 'Please be on time for meetings.', synonyms: ['punctual', 'prompt', 'timely'] }
    ],
    completed: false
  },
  // BUSINESS Set 6: Documents
  {
    id: 'bb6',
    title: 'Documents',
    words: [
      { word: 'report', phonetic: '/rɪˈpɔːrt/', definition: 'A written account of something', example: 'I need to write a report.', synonyms: ['document', 'summary', 'review'] },
      { word: 'contract', phonetic: '/ˈkɒntrækt/', definition: 'An official written agreement', example: 'Please sign the contract here.', synonyms: ['agreement', 'deal', 'document'] },
      { word: 'form', phonetic: '/fɔːrm/', definition: 'A paper with spaces to fill', example: 'Fill out this form please.', synonyms: ['document', 'application', 'sheet'] },
      { word: 'copy', phonetic: '/ˈkɒpi/', definition: 'A duplicate of a document', example: 'Make a copy of this file.', synonyms: ['duplicate', 'reproduction', 'print'] },
      { word: 'file', phonetic: '/faɪl/', definition: 'A folder for storing documents', example: 'Put this in the client file.', synonyms: ['folder', 'document', 'record'] }
    ],
    completed: false
  },
  // BUSINESS Set 7: Money Basics
  {
    id: 'bb7',
    title: 'Business Money',
    words: [
      { word: 'salary', phonetic: '/ˈsæləri/', definition: 'Money paid for your work', example: 'Salaries are paid monthly here.', synonyms: ['pay', 'wage', 'income'] },
      { word: 'budget', phonetic: '/ˈbʌdʒɪt/', definition: 'Plan for how to spend money', example: 'We need to check our budget.', synonyms: ['funds', 'allowance', 'allocation'] },
      { word: 'cost', phonetic: '/kɒst/', definition: 'How much you pay for something', example: 'What is the cost of this service?', synonyms: ['price', 'expense', 'charge'] },
      { word: 'pay', phonetic: '/peɪ/', definition: 'To give money for something', example: 'Please pay the invoice today.', synonyms: ['settle', 'remit', 'compensate'] },
      { word: 'invoice', phonetic: '/ˈɪnvɔɪs/', definition: 'A bill for goods or services', example: 'Send an invoice to the client.', synonyms: ['bill', 'receipt', 'statement'] }
    ],
    completed: false
  },
  // BUSINESS Set 8: Tasks & Projects
  {
    id: 'bb8',
    title: 'Tasks & Projects',
    words: [
      { word: 'task', phonetic: '/tæsk/', definition: 'A piece of work to be done', example: 'I have many tasks today.', synonyms: ['job', 'duty', 'assignment'] },
      { word: 'project', phonetic: '/ˈprɒdʒekt/', definition: 'A planned piece of work', example: 'The project will take two months.', synonyms: ['assignment', 'work', 'venture'] },
      { word: 'finish', phonetic: '/ˈfɪnɪʃ/', definition: 'To complete something fully', example: 'I will finish this task today.', synonyms: ['complete', 'end', 'conclude'] },
      { word: 'start', phonetic: '/stɑːrt/', definition: 'To begin doing something', example: 'Let us start the meeting now.', synonyms: ['begin', 'commence', 'launch'] },
      { word: 'plan', phonetic: '/plæn/', definition: 'To decide how to do something', example: 'We need to plan the project.', synonyms: ['organize', 'arrange', 'schedule'] }
    ],
    completed: false
  },
  // BUSINESS Set 9: Workplace Actions
  {
    id: 'bb9',
    title: 'Workplace Actions',
    words: [
      { word: 'work', phonetic: '/wɜːrk/', definition: 'To do a job or task', example: 'I work from nine to five.', synonyms: ['labor', 'toil', 'operate'] },
      { word: 'help', phonetic: '/help/', definition: 'To assist someone with task', example: 'Can you help me with this?', synonyms: ['assist', 'support', 'aid'] },
      { word: 'check', phonetic: '/tʃek/', definition: 'To look at something carefully', example: 'Please check the document again.', synonyms: ['review', 'examine', 'verify'] },
      { word: 'fix', phonetic: '/fɪks/', definition: 'To repair something broken', example: 'Can you fix this computer?', synonyms: ['repair', 'mend', 'correct'] },
      { word: 'update', phonetic: '/ʌpˈdeɪt/', definition: 'To add new information', example: 'Please update the spreadsheet.', synonyms: ['revise', 'refresh', 'modify'] }
    ],
    completed: false
  },
  // BUSINESS Set 10: Workplace Phrases
  {
    id: 'bb10',
    title: 'Workplace Phrases',
    words: [
      { word: 'sorry', phonetic: '/ˈsɒri/', definition: 'What you say to apologize', example: 'Sorry for the late reply.', synonyms: ['apologies', 'excuse me', 'pardon'] },
      { word: 'thanks', phonetic: '/θæŋks/', definition: 'What you say to show gratitude', example: 'Thanks for your help today.', synonyms: ['thank you', 'grateful', 'appreciate'] },
      { word: 'please', phonetic: '/pliːz/', definition: 'Word for polite requests', example: 'Please send me the file.', synonyms: ['kindly', 'if you would', 'may I'] },
      { word: 'welcome', phonetic: '/ˈwelkəm/', definition: 'What you say when someone thanks you', example: 'You are welcome to ask questions.', synonyms: ['no problem', 'my pleasure', 'anytime'] },
      { word: 'excuse', phonetic: '/ɪkˈskjuːz/', definition: 'What you say to interrupt politely', example: 'Excuse me, can I ask something?', synonyms: ['pardon', 'sorry', 'forgive me'] }
    ],
    completed: false
  }
];

export const beginnerIeltsSets = [
  // IELTS Set 1: Academic Words Basic
  {
    id: 'bi1',
    title: 'Academic Words Basic',
    words: [
      { word: 'topic', phonetic: '/ˈtɒpɪk/', definition: 'The subject being discussed', example: 'The topic of the essay is climate.', synonyms: ['subject', 'theme', 'issue'] },
      { word: 'main', phonetic: '/meɪn/', definition: 'The most important part', example: 'The main idea is at the start.', synonyms: ['primary', 'chief', 'key'] },
      { word: 'example', phonetic: '/ɪɡˈzɑːmpəl/', definition: 'Something that shows a point', example: 'Give an example to explain this.', synonyms: ['instance', 'case', 'sample'] },
      { word: 'reason', phonetic: '/ˈriːzən/', definition: 'Why something happens or is done', example: 'What is the reason for this rule?', synonyms: ['cause', 'explanation', 'motive'] },
      { word: 'result', phonetic: '/rɪˈzʌlt/', definition: 'What happens because of something', example: 'The result of the test was good.', synonyms: ['outcome', 'effect', 'consequence'] }
    ],
    completed: false
  },
  // IELTS Set 2: Describing Trends
  {
    id: 'bi2',
    title: 'Describing Trends',
    words: [
      { word: 'increase', phonetic: '/ɪnˈkriːs/', definition: 'To become larger in number', example: 'Prices will increase next month.', synonyms: ['rise', 'grow', 'go up'] },
      { word: 'decrease', phonetic: '/dɪˈkriːs/', definition: 'To become smaller in number', example: 'Sales decreased last quarter.', synonyms: ['drop', 'fall', 'decline'] },
      { word: 'change', phonetic: '/tʃeɪndʒ/', definition: 'To become different from before', example: 'The weather will change tomorrow.', synonyms: ['shift', 'alter', 'vary'] },
      { word: 'stay', phonetic: '/steɪ/', definition: 'To remain the same without changing', example: 'Prices stayed the same all year.', synonyms: ['remain', 'continue', 'keep'] },
      { word: 'grow', phonetic: '/ɡroʊ/', definition: 'To get bigger over time', example: 'The population grew by ten percent.', synonyms: ['expand', 'develop', 'increase'] }
    ],
    completed: false
  },
  // IELTS Set 3: Opinion Words
  {
    id: 'bi3',
    title: 'Opinion Words',
    words: [
      { word: 'agree', phonetic: '/əˈɡriː/', definition: 'To have the same opinion', example: 'I agree with this statement.', synonyms: ['concur', 'accept', 'approve'] },
      { word: 'disagree', phonetic: '/ˌdɪsəˈɡriː/', definition: 'To have a different opinion', example: 'I disagree with this view.', synonyms: ['oppose', 'differ', 'object'] },
      { word: 'believe', phonetic: '/bɪˈliːv/', definition: 'To think something is true', example: 'I believe this is correct.', synonyms: ['think', 'consider', 'feel'] },
      { word: 'support', phonetic: '/səˈpɔːrt/', definition: 'To help or agree with something', example: 'I support this decision.', synonyms: ['back', 'endorse', 'favor'] },
      { word: 'suggest', phonetic: '/səˈdʒest/', definition: 'To offer an idea for consideration', example: 'I suggest we try another way.', synonyms: ['propose', 'recommend', 'advise'] }
    ],
    completed: false
  },
  // IELTS Set 4: Comparing Words
  {
    id: 'bi4',
    title: 'Comparing Words',
    words: [
      { word: 'similar', phonetic: '/ˈsɪmɪlər/', definition: 'Almost the same as another', example: 'The two graphs look similar.', synonyms: ['alike', 'comparable', 'matching'] },
      { word: 'different', phonetic: '/ˈdɪfrənt/', definition: 'Not the same as another', example: 'The results are very different.', synonyms: ['unlike', 'distinct', 'varied'] },
      { word: 'same', phonetic: '/seɪm/', definition: 'Exactly like another thing', example: 'They got the same score.', synonyms: ['identical', 'equal', 'matching'] },
      { word: 'more', phonetic: '/mɔːr/', definition: 'A greater amount or number', example: 'There are more students this year.', synonyms: ['additional', 'extra', 'greater'] },
      { word: 'less', phonetic: '/les/', definition: 'A smaller amount or number', example: 'There is less time available now.', synonyms: ['fewer', 'reduced', 'smaller'] }
    ],
    completed: false
  },
  // IELTS Set 5: Essay Structure
  {
    id: 'bi5',
    title: 'Essay Structure',
    words: [
      { word: 'introduction', phonetic: '/ˌɪntrəˈdʌkʃən/', definition: 'The first part of an essay', example: 'Write a clear introduction.', synonyms: ['opening', 'beginning', 'start'] },
      { word: 'body', phonetic: '/ˈbɒdi/', definition: 'The main part of an essay', example: 'The body has three paragraphs.', synonyms: ['main section', 'content', 'middle'] },
      { word: 'conclusion', phonetic: '/kənˈkluːʒən/', definition: 'The last part of an essay', example: 'Summarize your points in conclusion.', synonyms: ['ending', 'summary', 'finish'] },
      { word: 'paragraph', phonetic: '/ˈpærəɡræf/', definition: 'A group of sentences together', example: 'Start a new paragraph here.', synonyms: ['section', 'passage', 'part'] },
      { word: 'point', phonetic: '/pɔɪnt/', definition: 'A single idea or argument', example: 'Each paragraph has one main point.', synonyms: ['idea', 'argument', 'statement'] }
    ],
    completed: false
  },
  // IELTS Set 6: Time & Sequence
  {
    id: 'bi6',
    title: 'Time & Sequence',
    words: [
      { word: 'first', phonetic: '/fɜːrst/', definition: 'Coming before all others', example: 'First, I will explain the problem.', synonyms: ['firstly', 'initially', 'to begin'] },
      { word: 'then', phonetic: '/ðen/', definition: 'After that or next', example: 'Then, I will give examples.', synonyms: ['next', 'afterwards', 'subsequently'] },
      { word: 'finally', phonetic: '/ˈfaɪnəli/', definition: 'At the end or last', example: 'Finally, I will conclude.', synonyms: ['lastly', 'in the end', 'ultimately'] },
      { word: 'before', phonetic: '/bɪˈfɔːr/', definition: 'Earlier than a specific time', example: 'Read the question before writing.', synonyms: ['prior to', 'earlier', 'previously'] },
      { word: 'after', phonetic: '/ˈæftər/', definition: 'Later than a specific time', example: 'Check your work after finishing.', synonyms: ['following', 'later', 'subsequently'] }
    ],
    completed: false
  },
  // IELTS Set 7: Cause & Effect
  {
    id: 'bi7',
    title: 'Cause & Effect',
    words: [
      { word: 'cause', phonetic: '/kɔːz/', definition: 'Something that makes something happen', example: 'Pollution is a cause of illness.', synonyms: ['reason', 'source', 'origin'] },
      { word: 'effect', phonetic: '/ɪˈfekt/', definition: 'Something that happens as a result', example: 'The effect was very noticeable.', synonyms: ['result', 'outcome', 'consequence'] },
      { word: 'because', phonetic: '/bɪˈkɒz/', definition: 'For the reason that follows', example: 'I stayed home because I was sick.', synonyms: ['since', 'as', 'due to'] },
      { word: 'therefore', phonetic: '/ˈðeəfɔːr/', definition: 'For that reason or so', example: 'It rained, therefore we stayed in.', synonyms: ['so', 'thus', 'hence'] },
      { word: 'lead to', phonetic: '/liːd tuː/', definition: 'To result in something happening', example: 'Stress can lead to health problems.', synonyms: ['cause', 'result in', 'bring about'] }
    ],
    completed: false
  },
  // IELTS Set 8: Describing Data
  {
    id: 'bi8',
    title: 'Describing Data',
    words: [
      { word: 'chart', phonetic: '/tʃɑːrt/', definition: 'A picture showing information', example: 'The chart shows sales by month.', synonyms: ['graph', 'diagram', 'figure'] },
      { word: 'table', phonetic: '/ˈteɪbəl/', definition: 'Information arranged in rows', example: 'Look at the table for details.', synonyms: ['grid', 'matrix', 'schedule'] },
      { word: 'percent', phonetic: '/pərˈsent/', definition: 'A part of one hundred', example: 'Sales rose by ten percent.', synonyms: ['percentage', 'proportion', 'share'] },
      { word: 'number', phonetic: '/ˈnʌmbər/', definition: 'A figure used to count things', example: 'The number of students increased.', synonyms: ['figure', 'amount', 'quantity'] },
      { word: 'total', phonetic: '/ˈtoʊtəl/', definition: 'The complete amount of something', example: 'The total was five hundred.', synonyms: ['sum', 'whole', 'entire'] }
    ],
    completed: false
  },
  // IELTS Set 9: Problem & Solution
  {
    id: 'bi9',
    title: 'Problem & Solution',
    words: [
      { word: 'problem', phonetic: '/ˈprɒbləm/', definition: 'Something difficult to solve', example: 'Traffic is a major problem.', synonyms: ['issue', 'challenge', 'difficulty'] },
      { word: 'solution', phonetic: '/səˈluːʃən/', definition: 'A way to solve a problem', example: 'Education is one solution.', synonyms: ['answer', 'remedy', 'fix'] },
      { word: 'solve', phonetic: '/sɒlv/', definition: 'To find an answer to a problem', example: 'We need to solve this issue.', synonyms: ['fix', 'resolve', 'address'] },
      { word: 'improve', phonetic: '/ɪmˈpruːv/', definition: 'To make something better', example: 'We can improve the situation.', synonyms: ['enhance', 'better', 'upgrade'] },
      { word: 'prevent', phonetic: '/prɪˈvent/', definition: 'To stop something from happening', example: 'Laws help prevent crime.', synonyms: ['stop', 'avoid', 'block'] }
    ],
    completed: false
  },
  // IELTS Set 10: Linking Words
  {
    id: 'bi10',
    title: 'Linking Words',
    words: [
      { word: 'however', phonetic: '/haʊˈevər/', definition: 'But or despite this fact', example: 'However, there are some problems.', synonyms: ['but', 'yet', 'nevertheless'] },
      { word: 'also', phonetic: '/ˈɔːlsoʊ/', definition: 'In addition to something', example: 'She is also a good writer.', synonyms: ['too', 'as well', 'additionally'] },
      { word: 'although', phonetic: '/ɔːlˈðoʊ/', definition: 'Even though something is true', example: 'Although it rained, we went out.', synonyms: ['though', 'even though', 'despite'] },
      { word: 'moreover', phonetic: '/mɔːrˈoʊvər/', definition: 'What is more or in addition', example: 'Moreover, costs have increased.', synonyms: ['furthermore', 'besides', 'additionally'] },
      { word: 'for example', phonetic: '/fɔːr ɪɡˈzɑːmpəl/', definition: 'Used to give an instance', example: 'For example, cars cause pollution.', synonyms: ['such as', 'like', 'for instance'] }
    ],
    completed: false
  }
];

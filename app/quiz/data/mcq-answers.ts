export interface MCQPredefinedEntry {
  options: string[];
  correctIndex: number; // index within options that is correct (before shuffling)
}

// Predefined MCQ options for IELTS vocabulary sets.
// Keys are lowercased words; values provide 4 answer choices
// with the correct choice indicated by correctIndex.
export const MCQ_PREDEFINED: Record<string, MCQPredefinedEntry> = {
  // 🎓 Academic Life
  lecture: {
    options: [
      'A talk given to students by a university teacher.',
      'A report written by students after a class discussion.',
      'A room designed for students to take their exams.',
      'A short test given by teachers during the semester.',
    ],
    correctIndex: 0,
  },
  assignment: {
    options: [
      'A piece of work students must complete for a course.',
      'A document explaining the school rules for all students.',
      'A study group formed to share learning materials together.',
      'A lesson focused on reviewing last week’s reading topic.',
    ],
    correctIndex: 0,
  },
  research: {
    options: [
      'A detailed study to discover new facts about a subject.',
      'A discussion between students about an assigned article.',
      'A plan that describes future topics in the semester.',
      'A small project done in pairs during a language class.',
    ],
    correctIndex: 0,
  },
  semester: {
    options: [
      'A period of study lasting about four to six months.',
      'A short break between two different study programs.',
      'A schedule showing the subjects for the entire year.',
      'A classroom where teachers meet to discuss test results.',
    ],
    correctIndex: 0,
  },
  deadline: {
    options: [
      'The final date or time when work must be finished.',
      'The first day students register for their new classes.',
      'The time when teachers return corrected exam papers.',
      'The moment when grades are officially announced online.',
    ],
    correctIndex: 0,
  },

  // 🌍 Environment & Climate
  pollution: {
    options: [
      'Harmful substances that make air or water unsafe.',
      'Natural gases that help plants grow and stay green.',
      'Recycled materials used for protecting marine wildlife.',
      'Industrial energy produced from modern solar panels.',
    ],
    correctIndex: 0,
  },
  sustainable: {
    options: [
      'Able to continue without harming the environment or future.',
      'Designed to increase the production of plastic and fuel.',
      'Used to describe fast-growing cities with heavy traffic.',
      'Related to short projects that save water for one week.',
    ],
    correctIndex: 0,
  },
  ecosystem: {
    options: [
      'A system where living things depend on each other.',
      'A farming area designed for growing seasonal vegetables.',
      'A scientific device used to measure rainfall accurately.',
      'A clean energy company that installs wind turbines.',
    ],
    correctIndex: 0,
  },
  emissions: {
    options: [
      'Gases released into the air by cars and factories.',
      'Natural air movement created by forests and mountains.',
      'Recycled waste collected from rivers and oceans.',
      'Solar energy stored in batteries during sunny days.',
    ],
    correctIndex: 0,
  },
  renewable: {
    options: [
      'A resource that can naturally replace itself over time.',
      'A material created only once through a chemical process.',
      'A metal found deep underground and used for machines.',
      'A natural gas that burns quickly and produces smoke.',
    ],
    correctIndex: 0,
  },

  // 💻 Technology & Innovation
  artificial: {
    options: [
      'Made by humans rather than existing naturally in nature.',
      'A small device used for connecting digital networks.',
      'Software created to help people learn new languages.',
      'An update that improves the speed of mobile systems.',
    ],
    correctIndex: 0,
  },
  digital: {
    options: [
      'Related to technology that uses computers or the internet.',
      'Based on handwriting or other traditional paper records.',
      'Produced through mechanical tools in large factories.',
      'Created from wood or metal using manual techniques.',
    ],
    correctIndex: 0,
  },
  algorithm: {
    options: [
      'A set of rules computers use to solve a problem.',
      'A digital file that stores personal photos and data.',
      'A chart used to record results of online surveys.',
      'A website created to manage student registrations.',
    ],
    correctIndex: 0,
  },
  automation: {
    options: [
      'Using machines to perform tasks without human control.',
      'Teaching employees how to work faster with computers.',
      'Saving data automatically into the system every week.',
      'Updating passwords for user safety and online access.',
    ],
    correctIndex: 0,
  },
  breakthrough: {
    options: [
      'A major discovery that changes progress in a field.',
      'A meeting to discuss future trends in technology.',
      'A business project focused on improving phone design.',
      'A simple test created for checking new applications.',
    ],
    correctIndex: 0,
  },

  // 🩺 Health & Medicine
  diagnosis: {
    options: [
      'The process of identifying an illness through symptoms.',
      'A medical plan created to help prevent new diseases.',
      'A routine test for measuring heart rate and blood flow.',
      'The study of medicines used for reducing high fever.',
    ],
    correctIndex: 0,
  },
  symptom: {
    options: [
      'A sign that shows something may be wrong in the body.',
      'A part of the body that needs regular check-ups.',
      'A treatment given to patients with similar problems.',
      'A schedule showing when to take daily vitamins.',
    ],
    correctIndex: 0,
  },
  treatment: {
    options: [
      'The care given to help a sick person get better.',
      'The advice doctors provide before a health operation.',
      'A vaccine used to stop infections in young children.',
      'The cost patients pay for visiting a private clinic.',
    ],
    correctIndex: 0,
  },
  prevention: {
    options: [
      'Actions taken to stop a disease before it starts.',
      'Daily habits that keep the body strong and active.',
      'Instructions given after finishing medical recovery.',
      'Training doctors to use new medical technologies.',
    ],
    correctIndex: 0,
  },
  immunity: {
    options: [
      'The body\'s natural ability to fight against diseases.',
      'The process of producing new medicines in the lab.',
      'A doctor\'s test to check a person\'s temperature.',
      'A special diet that improves heart and lung health.',
    ],
    correctIndex: 0,
  },

  // 💼 Business & Economics
  profit: {
    options: [
      'Money a business earns after paying all its costs.',
      'The total number of customers visiting a store.',
      'The budget made before starting a new business year.',
      'The salary employees receive at the end of the month.',
    ],
    correctIndex: 0,
  },
  investment: {
    options: [
      'Putting money into something to earn more later.',
      'Borrowing money from a friend to buy new tools.',
      'Planning to reduce company costs during hard times.',
      'Selling old machines to upgrade office technology.',
    ],
    correctIndex: 0,
  },
  inflation: {
    options: [
      'The rise in prices and fall in money\'s real value.',
      'A market rule that controls foreign trade and exports.',
      'A type of tax collected from imported luxury goods.',
      'The movement of products between countries and banks.',
    ],
    correctIndex: 0,
  },
  entrepreneur: {
    options: [
      'A person who starts and runs their own business.',
      'A manager who controls a company\'s daily meetings.',
      'A customer who regularly buys goods in large amounts.',
      'A worker who designs websites for small companies.',
    ],
    correctIndex: 0,
  },
  consumer: {
    options: [
      'Someone who buys goods or services for personal use.',
      'A seller who provides food to small local markets.',
      'A producer who manages the creation of new products.',
      'A banker who approves loans for business clients.',
    ],
    correctIndex: 0,
  },

  // 🏛 Government & Politics
  legislation: {
    options: [
      'The act of making or passing new laws officially.',
      'A debate between political parties about public education.',
      'A document showing the yearly budget of the government.',
      'A public event where leaders meet to discuss reforms.',
    ],
    correctIndex: 0,
  },
  democracy: {
    options: [
      'A system of government where citizens choose their leaders.',
      'A meeting where politicians decide rules without discussion.',
      'A written list of national goals for the next decade.',
      'A document that explains the duties of the parliament.',
    ],
    correctIndex: 0,
  },
  policy: {
    options: [
      'A plan of action created by a government or organization.',
      'A speech given by a minister about a new election.',
      'A group of people who collect data for research.',
      'A report that explains the outcome of a campaign.',
    ],
    correctIndex: 0,
  },
  parliament: {
    options: [
      'The group of elected representatives who make national laws.',
      'The office where citizens apply for their voting cards.',
      'A meeting that trains new members of a political party.',
      'A department that prepares reports about social programs.',
    ],
    correctIndex: 0,
  },
  campaign: {
    options: [
      'A planned effort to reach a political or social goal.',
      'A short video created to advertise local tourist spots.',
      'A program that helps students find part-time jobs.',
      'A charity event held to support homeless families.',
    ],
    correctIndex: 0,
  },

  // 📰 Media & Communication
  broadcast: {
    options: [
      'To send radio or television programs to the public.',
      'To record interviews with artists for future reference.',
      'To edit photos before posting them on social media.',
      'To publish printed articles about global technology trends.',
    ],
    correctIndex: 0,
  },
  journalism: {
    options: [
      'The work of collecting and reporting news to the public.',
      'The design of magazines and online publication layouts.',
      'The study of how people respond to advertisements.',
      'The process of filming documentaries about wildlife parks.',
    ],
    correctIndex: 0,
  },
  censorship: {
    options: [
      'The control of information that can be shared publicly.',
      'The creation of headlines to make articles more attractive.',
      'The translation of foreign news into local languages.',
      'The process of checking facts before they are published.',
    ],
    correctIndex: 0,
  },
  propaganda: {
    options: [
      'Information used to influence people\'s opinions or beliefs.',
      'News stories written to encourage healthy daily habits.',
      'Advertisements promoting the latest fashion and brands.',
      'Articles describing the benefits of cultural diversity.',
    ],
    correctIndex: 0,
  },
  editorial: {
    options: [
      'An article expressing the opinion of a newspaper editor.',
      'A photo series showing the life of famous musicians.',
      'A live report covering sports events in large cities.',
      'A written summary of yesterday’s main political debates.',
    ],
    correctIndex: 0,
  },

  // 🌍 Social Issues
  inequality: {
    options: [
      'An unfair situation where people have unequal opportunities.',
      'A protest asking for new transportation systems in towns.',
      'A program that supports low-income students at school.',
      'A law protecting workers from unsafe labor conditions.',
    ],
    correctIndex: 0,
  },
  poverty: {
    options: [
      'The state of having little money or basic resources.',
      'The habit of saving money for long-term financial goals.',
      'The rise in food prices across developing countries.',
      'The system used to collect taxes from all citizens.',
    ],
    correctIndex: 0,
  },
  discrimination: {
    options: [
      'Unfair treatment of people because of race or gender.',
      'Strict laws made to control traffic in busy areas.',
      'Cultural traditions passed from parents to their children.',
      'Government plans to improve education in poor regions.',
    ],
    correctIndex: 0,
  },
  welfare: {
    options: [
      'Support provided by the government to help people in need.',
      'Money given to businesses to expand their market share.',
      'Advice offered by schools to improve student discipline.',
      'Services created to promote tourism in local communities.',
    ],
    correctIndex: 0,
  },
  diversity: {
    options: [
      'The presence of different cultures, ideas, or people together.',
      'The rule that limits foreign workers in big companies.',
      'The meeting where leaders discuss national healthcare.',
      'The method of selecting candidates for local elections.',
    ],
    correctIndex: 0,
  },

  // 🎨 Arts & Culture
  aesthetic: {
    options: [
      'Concerned with beauty or the appreciation of artistic style.',
      'Related to emotions felt while reading a sad story.',
      'Connected to cultural festivals and outdoor exhibitions.',
      'Focused on teaching traditional forms of visual art.',
    ],
    correctIndex: 0,
  },
  exhibition: {
    options: [
      'A public display of art, photography, or creative works.',
      'A competition where artists present their digital projects.',
      'A workshop teaching beginners how to use watercolor paint.',
      'A magazine showing the latest events in modern culture.',
    ],
    correctIndex: 0,
  },
  contemporary: {
    options: [
      'Belonging to the present time or modern artistic style.',
      'Associated with art made in the early nineteenth century.',
      'Focused on studying sculpture from the ancient period.',
      'Based on cultural themes from rural historical areas.',
    ],
    correctIndex: 0,
  },
  heritage: {
    options: [
      'Traditions, monuments, or values passed from past generations.',
      'Stories written by authors about life in large cities.',
      'Items sold in souvenir shops near famous attractions.',
      'Music created by young artists for modern radio shows.',
    ],
    correctIndex: 0,
  },
  masterpiece: {
    options: [
      'A work of art showing the highest skill and quality.',
      'A story written for television audiences and film awards.',
      'A painting made by students during an art workshop.',
      'A sculpture created to decorate a public government hall.',
    ],
    correctIndex: 0,
  },

  // 🔬 Science & Research
  hypothesis: {
    options: [
      'An idea suggested as a possible explanation for facts.',
      'A step-by-step guide for repeating a science experiment.',
      'A diagram showing the results of data collection.',
      'A summary written after a lab session has ended.',
    ],
    correctIndex: 0,
  },
  experiment: {
    options: [
      'A test done to discover or prove something in science.',
      'A report listing scientific terms and new definitions.',
      'A formula used to calculate distance and velocity.',
      'A schedule that organizes research meetings weekly.',
    ],
    correctIndex: 0,
  },
  evidence: {
    options: [
      'Information or facts that show something is true or real.',
      'Tools scientists use to measure temperature and humidity.',
      'Articles describing theories that have not been tested.',
      'Graphs used to present data from chemical research.',
    ],
    correctIndex: 0,
  },
  analysis: {
    options: [
      'The careful study of information to understand it better.',
      'The act of creating a new chemical combination.',
      'The design of charts used for public presentations.',
      'The summary of a research article for publication.',
    ],
    correctIndex: 0,
  },
  methodology: {
    options: [
      'The system of methods used in scientific research.',
      'The set of laws controlling experiments in medicine.',
      'The language scientists use to name new species.',
      'The report that explains the goal of the research.',
    ],
    correctIndex: 0,
  },

  // ✈️ Travel & Tourism
  destination: {
    options: [
      'The place someone is traveling or planning to go to.',
      'The hotel where tourists stay during their vacation.',
      'The type of transport used for international flights.',
      'The schedule for sightseeing trips during the holiday.',
    ],
    correctIndex: 0,
  },
  itinerary: {
    options: [
      'A detailed plan showing where and when to travel.',
      'A ticket used to enter historical sites and museums.',
      'A brochure advertising local attractions and city tours.',
      'A website used for booking flights and accommodations.',
    ],
    correctIndex: 0,
  },
  accommodation: {
    options: [
      'A place to stay, such as a hotel or guesthouse.',
      'A list of restaurants serving traditional national dishes.',
      'A public area designed for concerts and large events.',
      'A service that arranges transport for local visitors.',
    ],
    correctIndex: 0,
  },
  hospitality: {
    options: [
      'Friendly and generous treatment of guests or visitors.',
      'The business of selling souvenirs near tourist areas.',
      'The service that offers guided mountain hiking tours.',
      'The act of organizing a city festival each summer.',
    ],
    correctIndex: 0,
  },
  attraction: {
    options: [
      'A place or event that draws many visitors or tourists.',
      'A restaurant offering discounts for families and children.',
      'A road connecting two famous destinations together.',
      'A flight service providing trips to nearby islands.',
    ],
    correctIndex: 0,
  },

  // 🌾 Food & Agriculture
  organic: {
    options: [
      'Grown naturally without using chemicals or artificial methods.',
      'Cooked using traditional recipes from local ingredients.',
      'Sold directly to customers at weekend food markets.',
      'Stored in cold places to keep it fresh longer.',
    ],
    correctIndex: 0,
  },
  nutrition: {
    options: [
      'The process of getting the food the body needs to stay healthy.',
      'The act of preparing meals for large community events.',
      'The service that delivers food to offices and schools.',
      'The habit of eating snacks between regular daily meals.',
    ],
    correctIndex: 0,
  },
  cultivation: {
    options: [
      'The process of growing crops and preparing land for farming.',
      'The practice of collecting water for agricultural storage.',
      'The system for selling vegetables to nearby cities.',
      'The method of transporting grain across long distances.',
    ],
    correctIndex: 0,
  },
  harvest: {
    options: [
      'The time when crops are gathered from the fields.',
      'The equipment used for watering plants during dry days.',
      'The group of farmers who sell rice at markets.',
      'The season when seeds are first planted in soil.',
    ],
    correctIndex: 0,
  },
  livestock: {
    options: [
      'Farm animals raised for food, work, or other products.',
      'Machines used for planting seeds and collecting crops.',
      'Workers who transport vegetables to city markets.',
      'Tools for measuring land area and soil fertility.',
    ],
    correctIndex: 0,
  },

  // 🏙 Urban Development
  infrastructure: {
    options: [
      'The basic systems like roads and power that support a city.',
      'The design of buildings used for offices and schools.',
      'The construction of bridges across rivers and highways.',
      'The government plan for new parks and green spaces.',
    ],
    correctIndex: 0,
  },
  residential: {
    options: [
      'An area where people live rather than work or trade.',
      'A district full of offices and large commercial centers.',
      'A neighborhood famous for restaurants and art galleries.',
      'A location used mainly for factories and warehouses.',
    ],
    correctIndex: 0,
  },
  metropolitan: {
    options: [
      'Relating to a large city or urban area with suburbs.',
      'Designed for tourists visiting small historical towns.',
      'Located near forests and lakes outside main cities.',
      'Connected to national parks and rural communities.',
    ],
    correctIndex: 0,
  },
  congestion: {
    options: [
      'A situation where traffic becomes very slow and crowded.',
      'The noise made by construction work in city centers.',
      'The smoke produced by cars during heavy pollution.',
      'The plan to expand public transport within big cities.',
    ],
    correctIndex: 0,
  },
  zoning: {
    options: [
      'Dividing land areas for housing, business, or public use.',
      'Building shopping centers near airports and train stations.',
      'Repairing old structures and converting them into hotels.',
      'Decorating houses with plants to improve appearance.',
    ],
    correctIndex: 0,
  },

  // 🎓 Education System
  curriculum: {
    options: [
      'The subjects and topics taught in a school or course.',
      'The tools students use for online study activities.',
      'The written schedule showing dates of final exams.',
      'The group of teachers managing student performance.',
    ],
    correctIndex: 0,
  },
  pedagogy: {
    options: [
      'The method and practice of teaching in education.',
      'The policy that defines how schools are funded yearly.',
      'The office where students register for new courses.',
      'The study of language used in academic textbooks.',
    ],
    correctIndex: 0,
  },
  literacy: {
    options: [
      'The ability to read and write basic written language.',
      'The skill of speaking multiple languages fluently.',
      'The use of computers to design online learning apps.',
      'The habit of reading short stories for entertainment.',
    ],
    correctIndex: 0,
  },
  vocational: {
    options: [
      'Related to job training or practical work experience.',
      'Focused mainly on teaching literature and poetry skills.',
      'Designed for older students studying general education.',
      'Created to improve reading and grammar comprehension.',
    ],
    correctIndex: 0,
  },
  assessment: {
    options: [
      'A test or method used to measure student performance.',
      'A summary of class notes shared before final exams.',
      'A discussion between teachers about school attendance.',
      'A written plan for next semester’s academic schedule.',
    ],
    correctIndex: 0,
  },

  // ⚖️ Crime & Law
  defendant: {
    options: [
      'A person accused of a crime in a court of law.',
      'A police officer responsible for collecting crime evidence.',
      'A lawyer who helps prepare official legal contracts.',
      'A judge deciding which witnesses can give testimony.',
    ],
    correctIndex: 0,
  },
  prosecution: {
    options: [
      'The legal process of trying someone accused of a crime.',
      'The act of defending a person in a public trial.',
      'The step of collecting statements from all witnesses.',
      'The training given to lawyers before they start working.',
    ],
    correctIndex: 0,
  },
  verdict: {
    options: [
      'The decision made by a court at the end of a trial.',
      'The list of crimes reported during the past month.',
      'The record showing results of police investigations.',
      'The rules describing how evidence should be presented.',
    ],
    correctIndex: 0,
  },
  justice: {
    options: [
      'Fair treatment and the proper use of the law.',
      'Strict punishment given for very serious offenses.',
      'The department responsible for hiring new police staff.',
      'A written report showing recent national crime rates.',
    ],
    correctIndex: 0,
  },
  rehabilitation: {
    options: [
      'The process of helping people recover or rejoin society.',
      'The action of building safer prisons for all offenders.',
      'The creation of new laws to stop repeated crimes.',
      'The training police officers receive before employment.',
    ],
    correctIndex: 0,
  },

  // 🧠 Psychology & Behavior
  cognitive: {
    options: [
      'Related to thinking, learning, and understanding processes.',
      'Focused on emotional responses to personal relationships.',
      'Connected to physical movement and daily coordination.',
      'Based on motivation and habits in social groups.',
    ],
    correctIndex: 0,
  },
  motivation: {
    options: [
      'The reason or desire that makes someone take action.',
      'The feeling of sadness after failing a personal goal.',
      'The ability to remember details from past experiences.',
      'The need to control emotions during stressful moments.',
    ],
    correctIndex: 0,
  },
  perception: {
    options: [
      'The way people see or interpret the world around them.',
      'The method of recalling memories from early childhood.',
      'The habit of making decisions without logical thinking.',
      'The ability to learn new languages and accents.',
    ],
    correctIndex: 0,
  },
  anxiety: {
    options: [
      'A feeling of worry or nervousness about the future.',
      'Happiness felt after receiving positive life results.',
      'Excitement about trying new sports or activities.',
      'Motivation to study and complete all given tasks.',
    ],
    correctIndex: 0,
  },
  resilience: {
    options: [
      'The ability to recover quickly after difficulties or stress.',
      'The confidence to share opinions during public speeches.',
      'The courage to travel alone to foreign countries.',
      'The patience to finish long and difficult projects.',
    ],
    correctIndex: 0,
  },

  // 🌐 Global Issues
  humanitarian: {
    options: [
      'Concerned with helping people and improving human welfare.',
      'Focused on teaching children about scientific discoveries.',
      'Related to programs supporting international trade growth.',
      'Designed to train leaders for political organizations.',
    ],
    correctIndex: 0,
  },
  refugee: {
    options: [
      'A person forced to leave their home due to conflict.',
      'A volunteer helping poor families in rural areas.',
      'A soldier working to protect a national border.',
      'A journalist writing articles about migration topics.',
    ],
    correctIndex: 0,
  },
  conflict: {
    options: [
      'A serious disagreement or fight between groups or countries.',
      'A treaty signed to promote cooperation between nations.',
      'A report summarizing global efforts toward peacebuilding.',
      'A meeting where leaders discuss regional development.',
    ],
    correctIndex: 0,
  },
  famine: {
    options: [
      'A severe shortage of food affecting large populations.',
      'A program distributing seeds to small local farmers.',
      'A drought lasting several months in rural communities.',
      'A campaign teaching families to reduce food waste.',
    ],
    correctIndex: 0,
  },
  pandemic: {
    options: [
      'A disease that spreads across many countries worldwide.',
      'A temporary illness limited to one small community.',
      'A yearly checkup program run by local health centers.',
      'A global meeting to discuss hospital management issues.',
    ],
    correctIndex: 0,
  },

  // 🏋️ Sports & Fitness
  athletic: {
    options: [
      'Physically strong, active, and good at sports activities.',
      'Interested in organizing events for local sports fans.',
      'Focused on studying the rules of international games.',
      'Involved in producing clothing for professional athletes.',
    ],
    correctIndex: 0,
  },
  endurance: {
    options: [
      'The ability to continue physical activity without getting tired.',
      'The power to lift heavy objects in a single motion.',
      'The energy needed to start a short running race.',
      'The motivation to exercise early every weekday morning.',
    ],
    correctIndex: 0,
  },
  competition: {
    options: [
      'An event where people or teams try to win something.',
      'A schedule listing all the sports practiced during summer.',
      'A team discussion after losing several important matches.',
      'A sports center built for hosting annual local events.',
    ],
    correctIndex: 0,
  },
  stamina: {
    options: [
      'The physical or mental strength to keep going longer.',
      'The excitement felt when watching your favorite player.',
      'The daily routine athletes follow before each match.',
      'The training plan used to build stronger muscles.',
    ],
    correctIndex: 0,
  },
  performance: {
    options: [
      'How well someone plays, acts, or completes an activity.',
      'The amount of time spent preparing for an event.',
      'The awards given to winners after the final game.',
      'The program that introduces players before competition.',
    ],
    correctIndex: 0,
  },

  // 💰 Finance & Banking
  mortgage: {
    options: [
      'A loan used to buy a house or property.',
      'A credit card for shopping at local stores.',
      'A tax charged on imported foreign products.',
      'A savings account for students and young adults.',
    ],
    correctIndex: 0,
  },
  
  // Upper-Intermediate Set 8
  assert: {
    options: [
      'To state something confidently as true',
      'To suggest something without stating it directly',
      'To describe main points in a summary',
      'To evaluate evidence supporting a particular conclusion',
    ],
    correctIndex: 0,
  },
  concede: {
    options: [
      'To admit something true after initial denial',
      'To state something confidently as true',
      'To prove a statement or claim wrong',
      'To withdraw a claim to avoid conflict',
    ],
    correctIndex: 0,
  },
  imply: {
    options: [
      'To suggest something without stating it directly',
      'To admit something true after initial denial',
      'To describe main points in a summary',
      'To connect ideas using clear transitions',
    ],
    correctIndex: 0,
  },
  refute: {
    options: [
      'To prove a statement or claim wrong',
      'To suggest something without stating it directly',
      'To state something confidently as true',
      'To compare sources to reach a judgement',
    ],
    correctIndex: 0,
  },
  outline: {
    options: [
      'To describe main points in a summary',
      'To admit something true after initial denial',
      'To prove a statement or claim wrong',
      'To compile references following the citation format',
    ],
    correctIndex: 0,
  },
  credit: {
    options: [
      'Money borrowed from a bank to be paid back later.',
      'Coins collected and saved inside a personal account.',
      'Salary transferred to workers every two weeks.',
      'A small bonus given for excellent work results.',
    ],
    correctIndex: 0,
  },
  assets: {
    options: [
      'Things of value owned by a person or company.',
      'The list of items bought for office decoration.',
      'The costs required to build a new business site.',
      'The prices of materials sold in local markets.',
    ],
    correctIndex: 0,
  },
  budget: {
    options: [
      'A plan for managing income and expenses carefully.',
      'A report showing how much tax people should pay.',
      'A salary list used by employers every financial year.',
      'A bank form for sending international money transfers.',
    ],
    correctIndex: 0,
  },
  transaction: {
    options: [
      'An exchange of money for goods, services, or payment.',
      'A policy regulating the national financial institutions.',
      'A code used for tracking digital account activities.',
      'A program offering rewards for regular online banking.',
    ],
    correctIndex: 0,
  },

  // 💼 Employment & Career
  qualification: {
    options: [
      'A skill or certificate that shows you can do a job.',
      'A test given to students before university admission.',
      'A course that introduces teamwork in office settings.',
      'A plan explaining company goals for new employees.',
    ],
    correctIndex: 0,
  },
  promotion: {
    options: [
      'The act of being given a higher position at work.',
      'A discount offered to customers during special sales.',
      'The campaign used to advertise new brand products.',
      'The process of training staff for emergency roles.',
    ],
    correctIndex: 0,
  },
  resignation: {
    options: [
      'The act of leaving a job or position voluntarily.',
      'The event celebrating employees with ten years of service.',
      'The break workers take during long office hours.',
      'The decision to change departments within the company.',
    ],
    correctIndex: 0,
  },
  productivity: {
    options: [
      'The rate at which work is done efficiently and effectively.',
      'The habit of organizing meetings to discuss weekly plans.',
      'The motivation employees feel after receiving bonuses.',
      'The number of people joining a company each year.',
    ],
    correctIndex: 0,
  },
  colleague: {
    options: [
      'A person you work with in the same organization.',
      'A customer who often buys items from your shop.',
      'A friend you meet only outside the workplace.',
      'A supervisor who checks and approves your projects.',
    ],
    correctIndex: 0,
  },
};

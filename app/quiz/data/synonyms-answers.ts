export interface SynonymPredefinedEntry {
  correct: string[]; // exactly 3 preferred correct synonyms
  incorrect: string[]; // pool of incorrect options; at least 3
}

// Predefined synonym choices for IELTS sets (partial: first 3 sets).
// Keys are lowercased words.
export const SYNONYM_PREDEFINED: Record<string, SynonymPredefinedEntry> = {
  // 🎓 Academic Life
  lecture: {
    correct: ['talk', 'presentation', 'speech'],
    incorrect: ['report', 'essay', 'summary'],
  },
  assignment: {
    correct: ['task', 'project', 'homework'],
    incorrect: ['meeting', 'schedule', 'instruction'],
  },
  research: {
    correct: ['study', 'investigation', 'exploration'],
    incorrect: ['discussion', 'article', 'plan'],
  },
  semester: {
    correct: ['term', 'period', 'session'],
    incorrect: ['campus', 'course', 'department'],
  },
  deadline: {
    correct: ['due date', 'cutoff', 'final date'],
    incorrect: ['reminder', 'opening', 'estimate'],
  },

  // 🌍 Environment & Climate
  pollution: {
    correct: ['contamination', 'impurity', 'dirtiness'],
    incorrect: ['recycling', 'erosion', 'restoration'],
  },
  sustainable: {
    correct: ['eco-friendly', 'green', 'renewable'],
    incorrect: ['industrial', 'temporary', 'mechanical'],
  },
  ecosystem: {
    correct: ['environment', 'habitat', 'biosphere'],
    incorrect: ['factory', 'technology', 'industry'],
  },
  emissions: {
    correct: ['discharge', 'release', 'output'],
    incorrect: ['reduction', 'recycling', 'limitation'],
  },
  renewable: {
    correct: ['replaceable', 'sustainable', 'reusable'],
    incorrect: ['limited', 'toxic', 'exhaustible'],
  },

  // 💻 Technology & Innovation
  artificial: {
    correct: ['man-made', 'synthetic', 'manufactured'],
    incorrect: ['digital', 'electric', 'creative'],
  },
  digital: {
    correct: ['electronic', 'online', 'virtual'],
    incorrect: ['printed', 'mechanical', 'handwritten'],
  },
  algorithm: {
    correct: ['formula', 'procedure', 'sequence'],
    incorrect: ['code', 'display', 'device'],
  },
  automation: {
    correct: ['mechanization', 'robotics', 'self-operation'],
    incorrect: ['supervision', 'instruction', 'management'],
  },
  breakthrough: {
    correct: ['discovery', 'innovation', 'advancement'],
    incorrect: ['meeting', 'update', 'project'],
  },
  
  // 🩺 Health & Medicine
  diagnosis: {
    correct: ['identification', 'detection', 'recognition'],
    incorrect: ['recovery', 'prevention', 'treatment'],
  },
  symptom: {
    correct: ['sign', 'indicator', 'signal'],
    incorrect: ['cure', 'injection', 'therapy'],
  },
  treatment: {
    correct: ['therapy', 'remedy', 'medication'],
    incorrect: ['surgery', 'nutrition', 'routine'],
  },
  prevention: {
    correct: ['protection', 'avoidance', 'precaution'],
    incorrect: ['inspection', 'vaccination', 'recovery'],
  },
  immunity: {
    correct: ['resistance', 'defense', 'protection'],
    incorrect: ['illness', 'weakness', 'infection'],
  },

  // 💼 Business & Economics
  profit: {
    correct: ['earnings', 'gain', 'benefit'],
    incorrect: ['expense', 'budget', 'cost'],
  },
  investment: {
    correct: ['funding', 'capital', 'contribution'],
    incorrect: ['taxation', 'borrowing', 'purchase'],
  },
  inflation: {
    correct: ['price rise', 'cost increase', 'value drop'],
    incorrect: ['productivity', 'export', 'regulation'],
  },
  entrepreneur: {
    correct: ['founder', 'business owner', 'innovator'],
    incorrect: ['employee', 'accountant', 'partner'],
  },
  consumer: {
    correct: ['buyer', 'customer', 'purchaser'],
    incorrect: ['investor', 'producer', 'supplier'],
  },

  // 🏛 Government & Politics
  legislation: {
    correct: ['lawmaking', 'regulation', 'statute'],
    incorrect: ['debate', 'discussion', 'campaign'],
  },
  democracy: {
    correct: ['republic', 'self-rule', "people's government"],
    incorrect: ['monarchy', 'dictatorship', 'council'],
  },
  policy: {
    correct: ['strategy', 'plan', 'guideline'],
    incorrect: ['election', 'event', 'proposal'],
  },
  parliament: {
    correct: ['assembly', 'legislature', 'congress'],
    incorrect: ['committee', 'department', 'council'],
  },
  campaign: {
    correct: ['movement', 'drive', 'initiative'],
    incorrect: ['policy', 'forum', 'petition'],
  },

  // 📰 Media & Communication
  broadcast: {
    correct: ['transmit', 'air', 'stream'],
    incorrect: ['record', 'publish', 'edit'],
  },
  journalism: {
    correct: ['reporting', 'newswriting', 'correspondence'],
    incorrect: ['advertising', 'editing', 'blogging'],
  },
  censorship: {
    correct: ['restriction', 'control', 'suppression'],
    incorrect: ['translation', 'verification', 'adaptation'],
  },
  propaganda: {
    correct: ['persuasion', 'influence', 'promotion'],
    incorrect: ['article', 'message', 'description'],
  },
  editorial: {
    correct: ['opinion piece', 'commentary', 'column'],
    incorrect: ['headline', 'feature', 'bulletin'],
  },

  // 🌍 Social Issues
  inequality: {
    correct: ['unfairness', 'imbalance', 'disparity'],
    incorrect: ['protest', 'equality', 'diversity'],
  },
  poverty: {
    correct: ['hardship', 'deprivation', 'destitution'],
    incorrect: ['employment', 'salary', 'saving'],
  },
  discrimination: {
    correct: ['bias', 'prejudice', 'unfair treatment'],
    incorrect: ['awareness', 'tolerance', 'activism'],
  },
  welfare: {
    correct: ['assistance', 'support', 'aid'],
    incorrect: ['taxation', 'reform', 'service'],
  },
  diversity: {
    correct: ['variety', 'difference', 'mixture'],
    incorrect: ['unity', 'similarity', 'tradition'],
  },

  // 🎨 Arts & Culture
  aesthetic: {
    correct: ['artistic', 'beautiful', 'stylish'],
    incorrect: ['emotional', 'musical', 'historical'],
  },
  exhibition: {
    correct: ['display', 'showcase', 'presentation'],
    incorrect: ['event', 'contest', 'newspaper'],
  },
  contemporary: {
    correct: ['modern', 'current', 'present-day'],
    incorrect: ['traditional', 'ancient', 'historical'],
  },
  heritage: {
    correct: ['tradition', 'legacy', 'inheritance'],
    incorrect: ['souvenir', 'memory', 'monument'],
  },
  masterpiece: {
    correct: ['work of art', 'creation', 'gem'],
    incorrect: ['project', 'painting', 'replica'],
  },

  // 🔬 Science & Research
  hypothesis: {
    correct: ['theory', 'assumption', 'idea'],
    incorrect: ['proof', 'summary', 'solution'],
  },
  experiment: {
    correct: ['test', 'trial', 'investigation'],
    incorrect: ['equation', 'model', 'chart'],
  },
  evidence: {
    correct: ['proof', 'data', 'facts'],
    incorrect: ['report', 'record', 'tool'],
  },
  analysis: {
    correct: ['examination', 'evaluation', 'inspection'],
    incorrect: ['description', 'review', 'illustration'],
  },
  methodology: {
    correct: ['approach', 'technique', 'procedure'],
    incorrect: ['guideline', 'rule', 'example'],
  },

  // ✈️ Travel & Tourism
  destination: {
    correct: ['place', 'location', 'spot'],
    incorrect: ['journey', 'ticket', 'airline'],
  },
  itinerary: {
    correct: ['travel plan', 'schedule', 'route'],
    incorrect: ['map', 'luggage', 'reservation'],
  },
  accommodation: {
    correct: ['lodging', 'housing', 'stay'],
    incorrect: ['restaurant', 'transport', 'attraction'],
  },
  hospitality: {
    correct: ['friendliness', 'generosity', 'warmth'],
    incorrect: ['service', 'tourism', 'reservation'],
  },
  attraction: {
    correct: ['sight', 'highlight', 'landmark'],
    incorrect: ['route', 'restaurant', 'event'],
  },

  // 🌾 Food & Agriculture
  organic: {
    correct: ['natural', 'chemical-free', 'pure'],
    incorrect: ['processed', 'artificial', 'preserved'],
  },
  nutrition: {
    correct: ['nourishment', 'diet', 'sustenance'],
    incorrect: ['cooking', 'appetite', 'recipe'],
  },
  cultivation: {
    correct: ['farming', 'growing', 'agriculture'],
    incorrect: ['irrigation', 'marketing', 'trading'],
  },
  harvest: {
    correct: ['gathering', 'collection', 'yield'],
    incorrect: ['planting', 'storage', 'delivery'],
  },
  livestock: {
    correct: ['farm animals', 'cattle', 'poultry'],
    incorrect: ['crops', 'farmers', 'machinery'],
  },

  // 🏙 Urban Development
  infrastructure: {
    correct: ['facilities', 'framework', 'foundation'],
    incorrect: ['architecture', 'design', 'management'],
  },
  residential: {
    correct: ['housing', 'domestic', 'living'],
    incorrect: ['commercial', 'public', 'industrial'],
  },
  metropolitan: {
    correct: ['urban', 'city', 'municipal'],
    incorrect: ['regional', 'rural', 'national'],
  },
  congestion: {
    correct: ['traffic jam', 'overcrowding', 'blockage'],
    incorrect: ['construction', 'expansion', 'pollution'],
  },
  zoning: {
    correct: ['land division', 'district planning', 'land use'],
    incorrect: ['renovation', 'decoration', 'building'],
  },

  // 🎓 Education System
  curriculum: {
    correct: ['course', 'syllabus', 'program'],
    incorrect: ['textbook', 'class', 'test'],
  },
  pedagogy: {
    correct: ['teaching method', 'instruction', 'educational approach'],
    incorrect: ['management', 'theory', 'philosophy'],
  },
  literacy: {
    correct: ['reading ability', 'education', 'knowledge'],
    incorrect: ['vocabulary', 'translation', 'speech'],
  },
  vocational: {
    correct: ['job-related', 'practical', 'career-focused'],
    incorrect: ['academic', 'cultural', 'creative'],
  },
  assessment: {
    correct: ['evaluation', 'test', 'appraisal'],
    incorrect: ['assignment', 'record', 'lesson'],
  },

  // ⚖️ Crime & Law
  defendant: {
    correct: ['accused', 'suspect', 'respondent'],
    incorrect: ['judge', 'lawyer', 'officer'],
  },
  prosecution: {
    correct: ['trial', 'legal action', 'case'],
    incorrect: ['defense', 'judgment', 'penalty'],
  },
  verdict: {
    correct: ['decision', 'judgment', 'ruling'],
    incorrect: ['hearing', 'document', 'sentence'],
  },
  justice: {
    correct: ['fairness', 'equity', 'impartiality'],
    incorrect: ['punishment', 'system', 'regulation'],
  },
  rehabilitation: {
    correct: ['recovery', 'reform', 'reintegration'],
    incorrect: ['detention', 'correction', 'discipline'],
  },

  // 🧠 Psychology & Behavior
  cognitive: {
    correct: ['mental', 'intellectual', 'rational'],
    incorrect: ['emotional', 'physical', 'instinctive'],
  },
  motivation: {
    correct: ['drive', 'desire', 'determination'],
    incorrect: ['focus', 'patience', 'curiosity'],
  },
  perception: {
    correct: ['awareness', 'understanding', 'insight'],
    incorrect: ['vision', 'idea', 'image'],
  },
  anxiety: {
    correct: ['worry', 'nervousness', 'tension'],
    incorrect: ['excitement', 'happiness', 'interest'],
  },
  resilience: {
    correct: ['strength', 'toughness', 'adaptability'],
    incorrect: ['patience', 'optimism', 'courage'],
  },

  // 🌐 Global Issues
  humanitarian: {
    correct: ['charitable', 'benevolent', 'compassionate'],
    incorrect: ['political', 'environmental', 'cultural'],
  },
  refugee: {
    correct: ['displaced person', 'asylum seeker', 'exile'],
    incorrect: ['volunteer', 'worker', 'traveler'],
  },
  conflict: {
    correct: ['dispute', 'clash', 'struggle'],
    incorrect: ['cooperation', 'agreement', 'solution'],
  },
  famine: {
    correct: ['food shortage', 'starvation', 'scarcity'],
    incorrect: ['drought', 'disease', 'pollution'],
  },
  pandemic: {
    correct: ['global outbreak', 'epidemic', 'worldwide disease'],
    incorrect: ['vaccine', 'hospital', 'medication'],
  },

  // 🏋️ Sports & Fitness
  athletic: {
    correct: ['fit', 'active', 'strong'],
    incorrect: ['energetic', 'skilled', 'flexible'],
  },
  endurance: {
    correct: ['stamina', 'durability', 'persistence'],
    incorrect: ['effort', 'training', 'practice'],
  },
  competition: {
    correct: ['contest', 'tournament', 'championship'],
    incorrect: ['event', 'teamwork', 'exercise'],
  },
  stamina: {
    correct: ['energy', 'strength', 'power'],
    incorrect: ['flexibility', 'focus', 'confidence'],
  },
  performance: {
    correct: ['achievement', 'display', 'execution'],
    incorrect: ['preparation', 'appearance', 'schedule'],
  },

  // 💰 Finance & Banking
  mortgage: {
    correct: ['home loan', 'property loan', 'housing finance'],
    incorrect: ['rent', 'payment', 'investment'],
  },
  credit: {
    correct: ['loan', 'borrowing', 'financing'],
    incorrect: ['income', 'cash', 'deposit'],
  },
  assets: {
    correct: ['possessions', 'resources', 'property'],
    incorrect: ['expenses', 'debt', 'shares'],
  },
  budget: {
    correct: ['financial plan', 'spending plan', 'cost plan'],
    incorrect: ['payment', 'salary', 'saving'],
  },
  transaction: {
    correct: ['exchange', 'deal', 'trade'],
    incorrect: ['transfer', 'record', 'deposit'],
  },

  // 💼 Employment & Career
  qualification: {
    correct: ['skill', 'ability', 'credential'],
    incorrect: ['education', 'opportunity', 'title'],
  },
  promotion: {
    correct: ['advancement', 'progress', 'elevation'],
    incorrect: ['announcement', 'position', 'event'],
  },
  resignation: {
    correct: ['quitting', 'departure', 'withdrawal'],
    incorrect: ['break', 'transfer', 'dismissal'],
  },
  productivity: {
    correct: ['efficiency', 'output', 'performance'],
    incorrect: ['motivation', 'discipline', 'teamwork'],
  },
  colleague: {
    correct: ['coworker', 'teammate', 'associate'],
    incorrect: ['manager', 'supervisor', 'partner'],
  },
  
  // Upper-Intermediate Set 8
  assert: {
    correct: ['maintain', 'claim', 'affirm'],
    incorrect: ['summarize', 'analyze', 'describe'],
  },
  concede: {
    correct: ['admit', 'acknowledge', 'grant'],
    incorrect: ['defend', 'insist', 'summarize'],
  },
  imply: {
    correct: ['suggest', 'hint', 'indicate'],
    incorrect: ['declare', 'summarize', 'calculate'],
  },
  refute: {
    correct: ['disprove', 'rebut', 'invalidate'],
    incorrect: ['support', 'summarize', 'outline'],
  },
  outline: {
    correct: ['summarize', 'sketch', 'delineate'],
    incorrect: ['argue', 'assert', 'predict'],
  },
};

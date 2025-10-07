import React, { useState, useEffect, useRef } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  Animated, 
  Easing,
  Dimensions 
} from 'react-native';
import { ChevronRight } from 'lucide-react-native';
import { levels } from '../data/levels';
import { analyticsService } from '../../../services/AnalyticsService';

interface MCQProps {
  setId: string;
  levelId: string;
  onPhaseComplete: (score: number, totalQuestions: number) => void;
  sharedScore: number;
  onScoreShare: (newScore: number) => void;
  wordRange?: { start: number; end: number };
}

interface Question {
  word: string;
  ipa: string;
  definition: string;
  example: string;
  options: string[];
  correctAnswer: number;
  synonyms: string[];
}

const { width: SCREEN_WIDTH } = Dimensions.get('window');

const shortenPhrase = (phrase: string): string => {
  let trimmed = phrase.trim();
  if (trimmed.toLowerCase().startsWith('to ')) {
    trimmed = trimmed.slice(3);
  }

  return trimmed.charAt(0).toUpperCase() + trimmed.slice(1);
};

export default function MCQComponent({ setId, levelId, onPhaseComplete, sharedScore, onScoreShare, wordRange }: MCQProps) {
  const [currentWordIndex, setCurrentWordIndex] = useState(0);
  const [displayScore, setDisplayScore] = useState(sharedScore);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [showFeedback, setShowFeedback] = useState(false);
  const [isCorrect, setIsCorrect] = useState(false);
  const [isAnswered, setIsAnswered] = useState(false);
  const [isProcessingNext, setIsProcessingNext] = useState(false);
  const [phaseCorrect, setPhaseCorrect] = useState(0);
  const pendingScoreRef = useRef<number | null>(null);
  const optionAnims = useRef<Animated.Value[]>([]);
  
  // Animation refs
  const fadeAnim = useRef(new Animated.Value(1)).current;
  const slideAnim = useRef(new Animated.Value(0)).current;
  const progressAnim = useRef(new Animated.Value(0)).current;
  const deductionAnim = useRef(new Animated.Value(0)).current;
  const questionStartRef = useRef<number>(Date.now());

  useEffect(() => {
    console.log('MCQComponent - useEffect triggered:', { setId, levelId });
    generateQuestions();
  }, [setId, levelId]);

  useEffect(() => {
    setDisplayScore(sharedScore);
  }, [sharedScore]);

  useEffect(() => {
    if (pendingScoreRef.current !== null && pendingScoreRef.current !== sharedScore) {
      const next = pendingScoreRef.current;
      pendingScoreRef.current = null;
      onScoreShare(next);
    }
  }, [displayScore, onScoreShare, sharedScore]);

  // Prepare bubble entrance animation for options whenever the question changes
  useEffect(() => {
    const opts = questions[currentWordIndex]?.options || [];
    optionAnims.current = opts.map(() => new Animated.Value(0));
    const anims = optionAnims.current.map((v, i) =>
      Animated.timing(v, {
        toValue: 1,
        duration: 360,
        delay: i * 60,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      })
    );
    if (anims.length) Animated.stagger(40, anims).start();
  }, [currentWordIndex, questions.length]);

  const generateQuestions = () => {
    console.log('MCQComponent - generateQuestions called with:', { setId, levelId, wordRange });
    
    const level = levels.find(l => l.id === levelId);
    console.log('MCQComponent - Found level:', level?.name);
    if (!level) return;

    const set = level.sets.find(s => s.id.toString() === setId);
    console.log('MCQComponent - Found set:', set?.title);
    if (!set || !set.words) return;

    // Apply word range if specified
    let words = set.words;
    if (wordRange) {
      words = words.slice(wordRange.start, wordRange.end);
      console.log('MCQComponent - Using word range:', wordRange, 'Words:', words.length);
    }

    const generatedQuestions: Question[] = words.map(word => {
      const shortDefinition = shortenPhrase(word.definition);
      const options = [
        shortDefinition,
        generateDistractor(shortDefinition, 'opposite', word.word, set.title || ''),
        generateDistractor(shortDefinition, 'similar', word.word, set.title || ''),
        generateDistractor(shortDefinition, 'unrelated', word.word, set.title || '')
      ].map(option => option.charAt(0).toUpperCase() + option.slice(1));

      const shuffledOptions = [...options]
        .map(option => ({ option, sort: Math.random() }))
        .sort((a, b) => a.sort - b.sort)
        .map(({ option }) => option);
      const correctIndex = shuffledOptions.indexOf(shortDefinition);

      return {
        word: word.word,
        ipa: word.phonetic,
        definition: shortDefinition,
        example: word.example,
        options: shuffledOptions,
        correctAnswer: correctIndex,
        synonyms: word.synonyms || []
      };
    });

    setQuestions(generatedQuestions);
    // Initialize option animation values for the first question to avoid a flash
    const firstOptions = generatedQuestions[0]?.options || [];
    optionAnims.current = firstOptions.map(() => new Animated.Value(0));
    if (firstOptions.length) {
      const anims = optionAnims.current.map((v, i) =>
        Animated.timing(v, {
          toValue: 1,
          duration: 360,
          delay: i * 60,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        })
      );
      Animated.stagger(40, anims).start();
    }
    setDisplayScore(sharedScore);
    setPhaseCorrect(0);
    questionStartRef.current = Date.now();
  };

const getTopicDistracts = (setTitle: string) => {
  const title = setTitle.toLowerCase();
  
  // Daily Routines & Habits
  if (title.includes('daily') || title.includes('routine') || title.includes('habit')) {
    return {
      opposite: ['To stay sleeping and never open eyes', 'To skip food and feel hungry', 'To forget everything learned', 'To stay still without moving'],
      similar: ['To open eyes in morning', 'To have breakfast or lunch', 'To read and memorize', 'To run and move body'],
      unrelated: ['To buy things at store', 'To talk to friends', 'To watch TV shows', 'To drive car']
    };
  }
  
  // Basic Needs & Family
  if (title.includes('family') || title.includes('need')) {
    return {
      opposite: ['A place you visit only once', 'Things that make you sick', 'A stranger you never meet', 'People who are not related'],
      similar: ['A building where you live', 'Meals you eat daily', 'A relative in family', 'People you care about'],
      unrelated: ['A store you buy from', 'A game you play', 'A car you drive', 'A movie you watch']
    };
  }
  
  // Education & Work
  if (title.includes('education') || title.includes('work')) {
    return {
      opposite: ['A student who never learns', 'Something you throw away', 'Free time without work', 'To erase and delete'],
      similar: ['A person who teaches', 'Papers with words', 'Tasks you must do', 'To draw with pencil'],
      unrelated: ['Food you eat', 'A game you play', 'A house you live', 'A car you drive']
    };
  }
  
  // Food & Cooking
  if (title.includes('food') || title.includes('cook')) {
    return {
      opposite: ['To make food cold', 'To throw food away', 'To skip meals', 'To avoid liquids', 'To feel very full'],
      similar: ['To prepare meals', 'To have food', 'To have beverages', 'To try dishes', 'To want meals'],
      unrelated: ['To read books', 'To drive cars', 'To watch shows', 'To buy clothes', 'To play games']
    };
  }
  
  // Free Time & Hobbies
  if (title.includes('free') || title.includes('hobby')) {
    return {
      opposite: ['To work hard', 'Silence and quiet', 'To ignore and avoid', 'To speak words', 'To stay still'],
      similar: ['To have fun', 'Sounds and songs', 'To observe things', 'To study words', 'To move body'],
      unrelated: ['To cook food', 'To buy things', 'To visit doctor', 'To drive car', 'To clean house']
    };
  }
  
  // Technology & Internet
  if (title.includes('technology') || title.includes('internet')) {
    return {
      opposite: ['A paper and pen', 'A letter by mail', 'Books in library', 'A photograph picture', 'Work without fun'],
      similar: ['A device for work', 'A communication tool', 'A connection system', 'A recording clip', 'An entertainment activity'],
      unrelated: ['Food you eat', 'Clothes you wear', 'A house you live', 'A car you drive', 'A book you read']
    };
  }
  
  // Shopping & Money
  if (title.includes('shop') || title.includes('money')) {
    return {
      opposite: ['To sell things', 'Debt you owe', 'Empty place', 'Free gift', 'To receive money'],
      similar: ['To purchase items', 'Currency and bills', 'A marketplace', 'The expense', 'To spend money'],
      unrelated: ['To study lessons', 'To cook food', 'To watch movies', 'To play sports', 'To read books']
    };
  }
  
  // Health & Body
  if (title.includes('health') || title.includes('body')) {
    return {
      opposite: ['A patient who is ill', 'When you feel good', 'Mind and thoughts', 'Pleasure and joy', 'Sick and ill'],
      similar: ['A medical professional', 'Feeling unwell', 'Physical form', 'Discomfort and hurt', 'Feeling well'],
      unrelated: ['A teacher at school', 'Food you eat', 'A car you drive', 'A game you play', 'A book you read']
    };
  }
  
  // Weather & Nature
  if (title.includes('weather') || title.includes('nature')) {
    return {
      opposite: ['The moon at night', 'Dry and no water', 'A building made', 'Warm and hot', 'Cool and cold'],
      similar: ['Bright light sky', 'Water from clouds', 'A tall plant', 'Not warm temperature', 'Very warm'],
      unrelated: ['Food you eat', 'Cars you drive', 'Books you read', 'Games you play', 'Money you have']
    };
  }
  
  // Emotions & Personality
  if (title.includes('emotion') || title.includes('personality')) {
    return {
      opposite: ['Sad and unhappy', 'Happy and joyful', 'Calm and peaceful', 'Mean and cruel', 'Silly and foolish'],
      similar: ['Feeling joyful', 'Feeling unhappy', 'Feeling mad', 'Being nice', 'Being intelligent'],
      unrelated: ['Food you eat', 'Books you read', 'Cars you drive', 'Houses you live', 'Games you play']
    };
  }
  
  // Transportation & Travel
  if (title.includes('transport') || title.includes('travel')) {
    return {
      opposite: ['A bicycle you ride', 'A small van', 'To run fast', 'To stay home', 'A free pass'],
      similar: ['A vehicle you drive', 'Large vehicle', 'To move on foot', 'To journey somewhere', 'A travel pass'],
      unrelated: ['Food you eat', 'Books you read', 'Movies you watch', 'Games you play', 'Songs you hear']
    };
  }
  
  // Home & Furniture
  if (title.includes('home') || title.includes('furniture')) {
    return {
      opposite: ['Outside open space', 'The floor surface', 'Standing position', 'A wakeful state', 'A wall'],
      similar: ['A space inside', 'A flat surface', 'A place to sit', 'A sleeping place', 'An entrance way'],
      unrelated: ['Food you eat', 'Cars you drive', 'Books you read', 'Games you play', 'Songs you hear']
    };
  }
  
  // Culture & Entertainment
  if (title.includes('culture') || title.includes('entertainment')) {
    return {
      opposite: ['A live show', 'Spoken words', 'Work and tasks', 'Writing and text', 'A lesson'],
      similar: ['A film show', 'A musical tune', 'A celebration event', 'Creative work', 'A narrative tale'],
      unrelated: ['Food you eat', 'Cars you drive', 'Money you have', 'Clothes you wear', 'Work you do']
    };
  }
  
  // IELTS Topics
  if (title.includes('academic') || title.includes('lecture')) {
    return {
      opposite: ['Informal chat without structure', 'Ignoring all studies', 'Avoiding all deadlines', 'Skipping all classes'],
      similar: ['Formal presentation', 'Educational task', 'Scholarly investigation', 'Academic period', 'Time requirement'],
      unrelated: ['Sports competition', 'Musical performance', 'Cooking recipe', 'Travel destination']
    };
  }
  
  if (title.includes('environment') || title.includes('climate')) {
    return {
      opposite: ['Purification and cleanliness', 'Wasteful and harmful', 'Destroyed habitat', 'Absorption of gases', 'Finite resources'],
      similar: ['Contamination of air', 'Environmentally responsible', 'Natural community', 'Gas release', 'Replenishable sources'],
      unrelated: ['Business profits', 'Political elections', 'Sports training', 'Musical instruments']
    };
  }
  
  if (title.includes('technology') || title.includes('innovation')) {
    return {
      opposite: ['Natural and organic', 'Analog and physical', 'Manual calculation', 'Human labor', 'Stagnation'],
      similar: ['Human-made product', 'Electronic system', 'Computing formula', 'Mechanized process', 'Major discovery'],
      unrelated: ['Food recipes', 'Sports rules', 'Art paintings', 'Travel routes']
    };
  }
  
  if (title.includes('health') || title.includes('medicine')) {
    return {
      opposite: ['Misdiagnosis of condition', 'Sign of wellness', 'Neglect of patient', 'Causing disease', 'Vulnerability to illness'],
      similar: ['Medical identification', 'Health indicator', 'Medical intervention', 'Disease avoidance', 'Protection against infection'],
      unrelated: ['Business strategy', 'Political debate', 'Sports performance', 'Travel itinerary']
    };
  }
  
  if (title.includes('business') || title.includes('econom')) {
    return {
      opposite: ['Loss of money', 'Withdrawal of funds', 'Deflation of prices', 'Employee of company', 'Seller of products'],
      similar: ['Financial gain', 'Capital injection', 'Price increases', 'Business founder', 'Product buyer'],
      unrelated: ['Medical treatment', 'Sports competition', 'Art exhibition', 'Climate research']
    };
  }
  
  if (title.includes('government') || title.includes('politic')) {
    return {
      opposite: ['Breaking of laws', 'Dictatorship rule', 'Improvised decisions', 'Single ruler', 'Peaceful inaction'],
      similar: ['Government rules', 'Elected governance', 'Strategic planning', 'Legislative body', 'Organized effort'],
      unrelated: ['Medical procedures', 'Sports training', 'Food preparation', 'Art techniques']
    };
  }
  
  if (title.includes('media') || title.includes('communication')) {
    return {
      opposite: ['Receive signal privately', 'Entertainment fiction', 'Freedom of expression', 'Factual information', 'News report'],
      similar: ['Transmit publicly', 'News reporting', 'Content control', 'Political messaging', 'Opinion article'],
      unrelated: ['Medical diagnosis', 'Sports equipment', 'Food nutrition', 'Urban planning']
    };
  }
  
  if (title.includes('social') && title.includes('issue')) {
    return {
      opposite: ['Equality between groups', 'Wealth and prosperity', 'Fair treatment', 'Private charity', 'Uniformity'],
      similar: ['Unfair disparity', 'Extreme poorness', 'Unfair treatment', 'Government support', 'Cultural variety'],
      unrelated: ['Technology innovation', 'Sports competition', 'Art creation', 'Food production']
    };
  }
  
  if (title.includes('arts') || title.includes('culture')) {
    return {
      opposite: ['Ugly and unpleasant', 'Private collection', 'Traditional and old', 'Modern invention', 'Failure and disaster'],
      similar: ['Beautiful appearance', 'Public display', 'Modern and current', 'Cultural tradition', 'Excellent work'],
      unrelated: ['Medical treatment', 'Business transaction', 'Sports training', 'Political debate']
    };
  }
  
  if (title.includes('science') || title.includes('research')) {
    return {
      opposite: ['Proven fact', 'Observation only', 'Lack of proof', 'Casual opinion', 'Random approach'],
      similar: ['Testable theory', 'Scientific test', 'Supporting proof', 'Detailed examination', 'Research approach'],
      unrelated: ['Business profit', 'Political campaign', 'Sports training', 'Art exhibition']
    };
  }
  
  if (title.includes('travel') || title.includes('tourism')) {
    return {
      opposite: ['Origin point', 'Spontaneous trip', 'Temporary shelter', 'Hostility and rudeness', 'Boring location'],
      similar: ['Target location', 'Planned schedule', 'Lodging place', 'Friendly service', 'Tourist site'],
      unrelated: ['Medical diagnosis', 'Business profit', 'Political policy', 'Scientific method']
    };
  }
  
  if (title.includes('food') && title.includes('agriculture')) {
    return {
      opposite: ['Chemical and synthetic', 'Malnutrition', 'Destruction of plants', 'Crop failure', 'Wild animals'],
      similar: ['Natural and pure', 'Healthy diet', 'Growing crops', 'Gathered produce', 'Farm animals'],
      unrelated: ['Political legislation', 'Media broadcast', 'Sports competition', 'Urban planning']
    };
  }
  
  if (title.includes('urban') || title.includes('development')) {
    return {
      opposite: ['Basic amenities lacking', 'Commercial district', 'Rural countryside', 'Free-flowing traffic', 'Unrestricted building'],
      similar: ['City systems', 'Housing areas', 'City-related', 'Traffic crowding', 'Land planning'],
      unrelated: ['Medical treatment', 'Sports training', 'Art creation', 'Food nutrition']
    };
  }
  
  if (title.includes('education') && title.includes('system')) {
    return {
      opposite: ['Random subjects', 'Student-led approach', 'Illiteracy', 'Academic training', 'Ignoring evaluation'],
      similar: ['Course content', 'Teaching methods', 'Reading ability', 'Job-related training', 'Knowledge evaluation'],
      unrelated: ['Sports performance', 'Business profit', 'Medical treatment', 'Political campaign']
    };
  }
  
  if (title.includes('crime') || title.includes('law')) {
    return {
      opposite: ['Plaintiff or victim', 'Defense action', 'Innocent finding', 'Injustice and unfairness', 'Punishment only'],
      similar: ['Accused person', 'Legal charges', 'Jury decision', 'Fair treatment', 'Criminal reform'],
      unrelated: ['Medical diagnosis', 'Sports training', 'Art exhibition', 'Food cultivation']
    };
  }
  
  if (title.includes('psychology') || title.includes('behavior')) {
    return {
      opposite: ['Physical and bodily', 'Discouragement', 'Misunderstanding', 'Calmness', 'Fragility'],
      similar: ['Mental processes', 'Inner drive', 'Personal understanding', 'Worry feeling', 'Mental strength'],
      unrelated: ['Political legislation', 'Business profit', 'Sports equipment', 'Art materials']
    };
  }
  
  if (title.includes('global') && title.includes('issue')) {
    return {
      opposite: ['Selfish and cruel', 'Settled resident', 'Peace and harmony', 'Abundance of food', 'Local outbreak'],
      similar: ['Compassionate aid', 'Displaced person', 'Serious disagreement', 'Food shortage', 'Worldwide disease'],
      unrelated: ['Sports competition', 'Art exhibition', 'Business transaction', 'Technology innovation']
    };
  }
  
  if (title.includes('sports') || title.includes('fitness')) {
    return {
      opposite: ['Weak and unfit', 'Exhaustion quickly', 'Cooperation only', 'Fatigue and tiredness', 'Failure and poor'],
      similar: ['Physically strong', 'Prolonged capability', 'Competitive event', 'Physical energy', 'Achievement level'],
      unrelated: ['Medical diagnosis', 'Political debate', 'Art techniques', 'Food recipes']
    };
  }
  
  if (title.includes('finance') || title.includes('banking')) {
    return {
      opposite: ['Gift or donation', 'Debt or owing', 'Liabilities owed', 'Unlimited spending', 'Cash payment'],
      similar: ['Property loan', 'Borrowing ability', 'Owned property', 'Spending plan', 'Money exchange'],
      unrelated: ['Medical treatment', 'Sports training', 'Art creation', 'Political campaign']
    };
  }
  
  if (title.includes('employment') || title.includes('career')) {
    return {
      opposite: ['Lack of skills', 'Demotion downward', 'Starting employment', 'Inefficiency', 'Competitor rival'],
      similar: ['Job requirement', 'Career advancement', 'Leaving job', 'Work efficiency', 'Work partner'],
      unrelated: ['Medical diagnosis', 'Sports performance', 'Art exhibition', 'Food preparation']
    };
  }
  
  // Default fallback for quiz or unlisted topics
  return {
    opposite: ['Something completely different', 'The reverse meaning', 'An opposite action', 'A contrary thing'],
    similar: ['Something quite similar', 'A related concept', 'A comparable thing', 'A like action'],
    unrelated: ['Something unrelated', 'A different topic', 'Another subject', 'A separate matter']
  };
};

const generateDistractor = (correctDef: string, type: string, wordContext: string, setTitle: string): string => {
  const topicDistracts = getTopicDistracts(setTitle);
  
  const distractors = {
    opposite: topicDistracts.opposite,
    similar: topicDistracts.similar,
    unrelated: topicDistracts.unrelated
  };

  const typeDistractors = distractors[type as keyof typeof distractors] || distractors.unrelated;
  const selected = typeDistractors[Math.floor(Math.random() * typeDistractors.length)];
  
  return selected;
};

  const handleAnswerSelect = (answerIndex: number) => {
    if (isAnswered) return; // Prevent multiple selections

    setSelectedAnswer(answerIndex);
    setIsAnswered(true);
    const correct = answerIndex === questions[currentWordIndex].correctAnswer;
    setIsCorrect(correct);
    setShowFeedback(true);

    // Track analytics for this question
    try {
      const timeSpent = Math.max(0, Math.round((Date.now() - questionStartRef.current) / 1000));
      analyticsService.recordResult({
        wordId: questions[currentWordIndex]?.word || String(currentWordIndex + 1),
        exerciseType: 'mcq',
        correct,
        timeSpent,
        timestamp: new Date(),
        score: correct ? 1 : 0,
      });
    } catch {}

    if (correct) {
      setPhaseCorrect(prev => prev + 1);
    } else {
      setDisplayScore(prev => {
        const next = Math.max(0, prev - 5);
        pendingScoreRef.current = next;
        return next;
      });
      triggerDeductionAnimation();
    }
    setIsProcessingNext(false);
  };

  const triggerDeductionAnimation = () => {
    deductionAnim.stopAnimation();
    deductionAnim.setValue(0);
    Animated.timing(deductionAnim, {
      toValue: 1,
      duration: 700,
      useNativeDriver: true,
    }).start();
  };

  const handleNextPress = () => {
    if (!isAnswered || isProcessingNext) return;
    setIsProcessingNext(true);

    if (currentWordIndex < questions.length - 1) {
      nextWord();
    } else {
      onPhaseComplete(phaseCorrect, questions.length);
    }
  };

  const nextWord = () => {
    const nextIndex = Math.min(currentWordIndex + 1, questions.length - 1);
    // Pre-create animation values for the next question before render
    const nextOpts = questions[nextIndex]?.options || [];
    optionAnims.current = nextOpts.map(() => new Animated.Value(0));
    setCurrentWordIndex(nextIndex);
    setSelectedAnswer(null);
    setShowFeedback(false);
    setIsAnswered(false);
    questionStartRef.current = Date.now();

    Animated.timing(progressAnim, {
      toValue: (currentWordIndex + 1) / questions.length,
      duration: 100,
      useNativeDriver: false,
    }).start(() => {
      setIsProcessingNext(false);
    });
  };

  if (questions.length === 0) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.loadingText}>Loading questions...</Text>
      </View>
    );
  }

  const currentQuestion = questions[currentWordIndex];
  const deductionOpacity = deductionAnim.interpolate({
    inputRange: [0, 0.2, 1],
    outputRange: [0, 1, 0],
  });
  const deductionTranslateY = deductionAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, -35],
  });

  const escapeRegExp = (value: string) => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

  const renderSentenceWithHighlight = (sentence: string, target: string) => {
    const escaped = escapeRegExp(target.trim());
    const segments = escaped.split(/\s+/);
    const pattern = segments
      .map((segment, index) => (index === segments.length - 1 ? `${segment}\\w*` : segment))
      .join('\\s+');
    const regex = new RegExp(pattern, 'gi');

    const parts: Array<{ text: string; highlight: boolean }> = [];
    let lastIndex = 0;
    let match: RegExpExecArray | null;

    while ((match = regex.exec(sentence)) !== null) {
      if (match.index > lastIndex) {
        parts.push({ text: sentence.slice(lastIndex, match.index), highlight: false });
      }
      parts.push({ text: match[0], highlight: true });
      lastIndex = regex.lastIndex;
    }

    if (lastIndex < sentence.length) {
      parts.push({ text: sentence.slice(lastIndex), highlight: false });
    }

    return parts.map((part, index) => (
      <Text key={`${part.text}-${index}`} style={part.highlight ? styles.highlightedWord : undefined}>
        {part.text}
      </Text>
    ));
  };

  return (
    <View style={styles.container}>
      {/* Header with Progress and Score */}
      <View style={styles.header}>
        <View style={styles.progressContainer}>
          <Text style={styles.progressText}>
            Word {currentWordIndex + 1} of {questions.length}
          </Text>
          <View style={styles.scoreWrapper}>
            <Animated.Text
              style={[
                styles.deductionText,
                {
                  opacity: deductionOpacity,
                  transform: [{ translateY: deductionTranslateY }],
                },
              ]}
            >
              -5
            </Animated.Text>
            <Text style={styles.scoreText}>{displayScore}</Text>
          </View>
        </View>
        <View style={styles.progressBar}>
          <Animated.View 
            style={[
              styles.progressFill, 
              { 
                width: progressAnim.interpolate({
                  inputRange: [0, 1],
                  outputRange: ['0%', '100%'],
                  extrapolate: 'clamp',
                })
              }
            ]} 
          />
        </View>
      </View>

      <Animated.View 
        style={{
          flex: 1,
          opacity: fadeAnim,
          transform: [{ translateX: slideAnim }],
          paddingHorizontal: 20,
          paddingTop: 24,
        }}
      >
        <View style={styles.wordHeader}>
          <Text style={styles.wordText}>{currentQuestion.word}</Text>
          <Text style={styles.ipaText}>{currentQuestion.ipa}</Text>
          <Text style={styles.exampleInline}>
            {renderSentenceWithHighlight(currentQuestion.example, currentQuestion.word)}
          </Text>
        </View>

        <View style={styles.optionsContainer}>
          {currentQuestion.options.map((option, index) => {
            const isSelected = selectedAnswer === index;
            const isCorrectOption = index === currentQuestion.correctAnswer;
            // If an animated value hasn't been prepared yet, render visible (1) to avoid invisible options
            const v = optionAnims.current[index] || new Animated.Value(1);
            const scale = v.interpolate({ inputRange: [0, 0.7, 1], outputRange: [0.86, 1.06, 1] });
            const opacity = v.interpolate({ inputRange: [0, 1], outputRange: [0, 1] });
            const translateY = v.interpolate({ inputRange: [0, 1], outputRange: [10, 0] });

            return (
              <Animated.View
                key={index}
                style={{ width: '100%', marginBottom: 12, transform: [{ translateY }, { scale }], opacity }}
              >
                <TouchableOpacity
                  style={[
                    styles.optionButton,
                    (showFeedback && index === currentQuestion.correctAnswer) && styles.correctOption,
                    (showFeedback && isSelected && !isCorrectOption) && styles.wrongOption,
                  ]}
                  onPress={() => handleAnswerSelect(index)}
                  disabled={isAnswered}
                >
                  <Text style={styles.optionText}>
                    {option}
                  </Text>
                </TouchableOpacity>
              </Animated.View>
            );
          })}
        </View>

        {isAnswered && (
          <TouchableOpacity
            style={[styles.nextButton, isProcessingNext && styles.nextButtonDisabled]}
            onPress={handleNextPress}
            disabled={isProcessingNext}
          >
            <Text style={styles.nextButtonText}>
              {currentWordIndex === questions.length - 1 ? 'Finish' : 'Next'}
            </Text>
          </TouchableOpacity>
        )}

      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1E1E1E',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#252525',
  },
  loadingText: {
    fontSize: 16,
    color: '#9CA3AF',
  },
  header: {
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  progressContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  progressText: {
    fontSize: 14,
    color: '#9CA3AF',
    fontWeight: '500',
  },
  scoreWrapper: {
    alignItems: 'center',
    justifyContent: 'flex-end',
    minWidth: 48,
  },
  deductionText: {
    position: 'absolute',
    top: -20,
    fontSize: 16,
    fontWeight: '600',
    color: '#F87171',
  },
  scoreText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#F2935C',
  },
  progressBar: {
    height: 6,
    backgroundColor: '#333',
    borderRadius: 3,
    overflow: 'hidden',
    marginBottom: 24,
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#F2935C',
    borderRadius: 3,
  },
  wordHeader: {
    alignItems: 'center',
    marginBottom: 32,
  },
  wordText: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 8,
  },
  ipaText: {
    fontSize: 18,
    color: '#9CA3AF',
    fontStyle: 'italic',
  },
  exampleInline: {
    marginTop: 8,
    fontSize: 14,
    color: '#9CA3AF',
    fontStyle: 'italic',
    textAlign: 'center',
  },
  optionsContainer: {
    marginBottom: 20,
  },
  optionButton: {
    backgroundColor: '#3A3A3A',
    borderRadius: 12,
    paddingVertical: 18,
    paddingHorizontal: 20,
    marginBottom: 0,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    minHeight: 72,
  },
  correctOption: {
    backgroundColor: '#437F76',
  },
  wrongOption: {
    backgroundColor: '#924646',
  },
  optionText: {
    fontSize: 16,
    color: '#fff',
    flex: 1,
    fontWeight: '500',
    textAlignVertical: 'center',
  },
  highlightedWord: {
    fontWeight: 'bold',
    color: '#F2935C',
  },
  nextButton: {
    marginTop: 16,
    backgroundColor: '#F2935C',
    borderRadius: 20,
    paddingVertical: 18,
    paddingHorizontal: 32,
    alignItems: 'center',
    alignSelf: 'center',
    minWidth: 160,
  },
  nextButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  nextButtonDisabled: {
    opacity: 0.6,
  },
});

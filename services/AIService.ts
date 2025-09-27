import { Word, Story } from '../types';

// Mock AI service - in production, this would call OpenAI API
class AIService {
  private apiKey: string | null = null;

  setApiKey(key: string) {
    this.apiKey = key;
  }

  async getWordDefinition(word: string): Promise<{
    definition: string;
    example: string;
    phonetics?: string;
  } | null> {
    // Mock implementation - in production, call OpenAI API
    const mockDefinitions: Record<string, any> = {
      'serendipity': {
        definition: 'the occurrence and development of events by chance in a happy or beneficial way',
        example: 'A fortunate stroke of serendipity brought the two old friends together.',
        phonetics: '/ˌserənˈdipədē/',
      },
      'ephemeral': {
        definition: 'lasting for a very short time',
        example: 'The ephemeral beauty of cherry blossoms captivates visitors each spring.',
        phonetics: '/əˈfem(ə)rəl/',
      },
      'ubiquitous': {
        definition: 'present, appearing, or found everywhere',
        example: 'Smartphones have become ubiquitous in modern society.',
        phonetics: '/yo͞oˈbikwədəs/',
      },
      'mellifluous': {
        definition: 'sweet or musical; pleasant to hear',
        example: 'Her mellifluous voice captivated the entire audience.',
        phonetics: '/məˈliflo͞oəs/',
      },
      'perspicacious': {
        definition: 'having a ready insight into and understanding of things',
        example: 'His perspicacious analysis of the situation impressed everyone.',
        phonetics: '/ˌpərspəˈkāSHəs/',
      },
    };

    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 1000));

    const result = mockDefinitions[word.toLowerCase()];
    if (result) {
      return result;
    }

    // If word not found, return null
    return null;
  }

  async generateStory(words: Word[]): Promise<Story | null> {
    if (words.length === 0) return null;

    // Mock story generation - in production, call OpenAI API
    const storyTemplates = [
      {
        title: 'The Mysterious Library',
        content: `In the heart of the ancient city stood a library that was truly {0}. Scholars from around the world would visit, hoping to find answers to life's most profound questions. The librarian, an elderly woman with {1} wisdom, would guide visitors through the endless shelves.

One day, a young researcher discovered a book that seemed to possess {2} qualities. As she opened its pages, the words seemed to dance before her eyes, each sentence more {3} than the last. The experience was nothing short of {4}, and she knew her life would never be the same.`,
      },
      {
        title: 'The Digital Revolution',
        content: `The world had become {0} with technology, and Sarah found herself at the center of it all. As a software engineer, she witnessed the {1} nature of innovation, where today's breakthrough becomes tomorrow's standard.

Her latest project was particularly {2}, involving artificial intelligence that could understand human emotions with {3} precision. The results were {4}, transforming how people interacted with machines forever.`,
      },
      {
        title: 'The Artist\'s Journey',
        content: `Maria was an artist who believed that true beauty was {0}, like the morning mist that disappears with the sunrise. Her paintings captured moments that were both {1} and deeply meaningful.

In her studio, surrounded by canvases that told stories of {2} experiences, she worked with {3} dedication. Each brushstroke was a testament to her {4} understanding of the human condition.`,
      },
    ];

    // Select a random template
    const template = storyTemplates[Math.floor(Math.random() * storyTemplates.length)];
    
    // Replace placeholders with actual words
    let content = template.content;
    words.forEach((word, index) => {
      content = content.replace(`{${index}}`, `●●●●`);
    });

    // Generate candidate words for each blank
    const blanks = words.map((word, index) => ({
      id: `blank_${index}`,
      word: word.word,
      position: content.indexOf('●●●●'),
      candidates: this.generateCandidates(word, words),
    }));

    // Replace blanks with actual blank markers
    content = content.replace(/●●●●/g, '●●●●');

    const story: Story = {
      id: Date.now().toString(),
      title: template.title,
      content,
      words: words.map(w => w.word),
      createdAt: new Date(),
    };

    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 2000));

    return story;
  }

  private generateCandidates(targetWord: Word, allWords: Word[]): string[] {
    const candidates = [targetWord.word];
    
    // Add some random words from the vault as distractors
    const otherWords = allWords.filter(w => w.id !== targetWord.id);
    const shuffled = otherWords.sort(() => Math.random() - 0.5);
    
    candidates.push(...shuffled.slice(0, 4).map(w => w.word));
    
    // Shuffle the final array
    return candidates.sort(() => Math.random() - 0.5);
  }

  async generateQuizQuestion(word: Word, type: 'mcq' | 'synonym' | 'dialogue' | 'missing-letters'): Promise<any> {
    // Mock quiz question generation
    const baseQuestion = {
      id: Date.now().toString(),
      word,
      type,
    };

    switch (type) {
      case 'mcq':
        return {
          ...baseQuestion,
          question: `What does "${word.word}" mean?`,
          options: [
            word.definition,
            'A type of flower',
            'A musical instrument',
            'A cooking technique',
          ],
          correctAnswer: word.definition,
        };

      case 'synonym':
        return {
          ...baseQuestion,
          question: `Select synonyms for "${word.word}":`,
          options: ['Similar', 'Different', 'Opposite', 'Related'],
          correctAnswer: ['Similar', 'Related'],
        };

      case 'dialogue':
        return {
          ...baseQuestion,
          question: `Complete the dialogue: "I had a ___ experience at the museum."`,
          options: [word.word, 'boring', 'expensive', 'short'],
          correctAnswer: word.word,
        };

      case 'missing-letters':
        const missingWord = word.word.replace(/[aeiou]/g, '_');
        return {
          ...baseQuestion,
          question: `Complete the word: ${missingWord}`,
          correctAnswer: word.word,
        };

      default:
        return baseQuestion;
    }
  }
}

export const aiService = new AIService();

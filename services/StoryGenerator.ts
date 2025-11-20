import aiService from './AIService';

export type StoryLevel = 'Beginner' | 'Intermediate' | 'Advanced';

export interface StoryGenerationOptions {
  words: string[];
  level: StoryLevel;
  genre: string;
  tone: string;
}

export interface GeneratedStory {
  storyWithBlanks: string;
  rawStory: string;
}

// All Expo-specific constants and discovery helpers removed.

function escapeRegExp(s: string) {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function makeRaw(contentWithMarkup: string): string {
  return contentWithMarkup.replace(/\*\*([\s\S]+?)\*\*/g, '$1');
}

function makeStoryWithBlanks(contentWithMarkup: string, words: string[]): string {
  const targets = words.map(w => w.trim()).filter(Boolean);

  // First, try to blank out the explicitly marked tokens (**word**), in order of appearance
  let blankIndex = 0;
  const assigned = new Map<string, number>(); // normalized word -> BLANK_#

  let text = contentWithMarkup;
  const replaced = text.replace(/\*\*([\s\S]+?)\*\*/g, (full, inner) => {
    const norm = String(inner).trim().toLowerCase();
    const matched = targets.find(w => w.toLowerCase() === norm);
    if (!matched) {
      // Not a target word (unexpected). Remove bold.
      return inner;
    }
    if (!assigned.has(norm)) {
      blankIndex += 1;
      assigned.set(norm, blankIndex);
    }
    const idx = assigned.get(norm)!;
    return `[[BLANK_${idx}]]`;
  });

  // If no blanks were created (model forgot to bold), fall back to replacing plain words sequentially
  if (blankIndex === 0) {
    let out = contentWithMarkup;
    for (let i = 0; i < targets.length; i++) {
      const w = targets[i];
      const re = new RegExp(`\\b${escapeRegExp(w)}\\b`, 'i');
      out = out.replace(re, () => `[[BLANK_${i + 1}]]`);
    }
    return out.replace(/\*\*([\s\S]+?)\*\*/g, '$1'); // strip any leftover bold
  }

  // Some targets may still be unassigned (model missed them or bolded differently).
  // Try to blank the first plain occurrence for each missing target.
  let out2 = replaced;
  for (const w of targets) {
    const key = w.toLowerCase();
    if (assigned.has(key)) continue;
    blankIndex += 1;
    const re = new RegExp(`\\b${escapeRegExp(w)}\\b`, 'i');
    if (re.test(out2)) {
      out2 = out2.replace(re, () => `[[BLANK_${blankIndex}]]`);
      assigned.set(key, blankIndex);
    }
  }

  // Clean any leftover unmatched bold markup
  return out2.replace(/\*\*/g, '');
}

export async function generateStory(options: StoryGenerationOptions): Promise<GeneratedStory> {
  const words = options.words.slice(0, 5).map(w => w.trim()).filter(Boolean);
  if (words.length !== 5) {
    throw new Error('Please provide exactly five words.');
  }

  // Map level to AI difficulty; keep a medium length for readability
  const difficulty =
    options.level === 'Beginner' ? 'easy' : options.level === 'Intermediate' ? 'medium' : 'hard';
  const length: 'short' | 'medium' | 'long' = 'medium';

  const story = await aiService.generateStory(
    words.map((w, idx) => ({ id: String(idx + 1), word: w, definition: '', example: '' })),
    {
      genre: (options.genre?.toLowerCase?.() as any) || 'adventure',
      difficulty: difficulty as any,
      length,
      tone: (options.tone?.toLowerCase?.() as any) || 'casual',
    }
  );

  const rawStory = makeRaw(story.content || '');
  const storyWithBlanks = makeStoryWithBlanks(story.content || '', words);

  return { rawStory, storyWithBlanks };
}

export default {
  generateStory,
};

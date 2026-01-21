# Set Creation Guide

## Set Structure

```typescript
{
  id: number,           // Incrementing ID within level
  title: string,        // Thematic title (e.g., 'Daily Actions 1')
  words: Word[],        // Array of exactly 5 words
  completed: false      // Always false for new sets
}
```

## Word Structure

```typescript
{
  word: string,         // The vocabulary word
  phonetic: string,     // IPA pronunciation (e.g., '/ɡəʊ/')
  definition: string,   // Clear, simple definition
  example: string,      // Example sentence using the word
  synonyms: string[]    // Array of 3 synonyms
}
```

## Rules

### Basic Requirements
- **5 words per set** - always exactly 5
- **Phonetic** - IPA format in slashes (e.g., `'/ˈtrævəl/'`)
- **Definition** - concise, clear explanation
- **Example** - natural sentence showing word usage in context
- **Synonyms** - exactly 3 alternatives

### Level Organization
- `beginner`: CEFR A1-A2 (basic everyday words)
- `intermediate`: CEFR B1-B2 (more sophisticated vocabulary)
- `upper-intermediate`: CEFR B2-C1
- `advanced`: CEFR C1-C2

### Thematic Grouping
Sets should have themed titles (e.g., Travel Basics, Personal Care, Weather & Nature)

---

## Distractor Logic (Critical)

### How Quiz Options Work

The quiz uses **peer answers** from the same set as distractors. This means:

**For MCQ (Multiple Choice Questions):**
- Correct answer = the word's definition
- Distractors = definitions of the OTHER 4 words in the same set

**For Synonym Quiz:**
- Correct answers = the word's own synonyms
- Distractors = synonyms of the OTHER words in the same set

### Example

Given a set with 5 words:
```
1. go      → definition: "To move from one place to another"
2. come    → definition: "To move toward here"
3. eat     → definition: "To put food in mouth and swallow"
4. drink   → definition: "To take liquid into mouth"
5. sleep   → definition: "To rest your body with eyes closed"
```

When quizzing on "go":
- **Correct answer**: "To move from one place to another"
- **Distractors**:
  - "To move toward here" (come's definition)
  - "To put food in mouth and swallow" (eat's definition)
  - "To take liquid into mouth" (drink's definition)

### Why This Matters

1. **Each set needs exactly 5 words** - to have 4 distractors available
2. **Definitions must be unique and distinct** - so distractors don't overlap with correct answer
3. **Synonyms must not overlap between words** - prevents confusing quiz options
4. **Similar word length in definitions** - prevents users from guessing by length

### Best Practices

1. **Avoid overlapping meanings** - words in the same set should have clearly different definitions
2. **Keep definitions consistent in length** - around 5-8 words each
3. **Use distinct synonyms** - no shared synonyms between words in the same set
4. **Group related but distinct words** - theme should connect words, but meanings must differ

---

## File Location

Sets are defined in: `app/quiz/data/levels.ts`

## Example Set

```typescript
{
  id: 1,
  title: 'Daily Actions 1',
  words: [
    {
      word: 'go',
      phonetic: '/ɡəʊ/',
      definition: 'To move from one place to another',
      example: 'We go to school by bus every morning.',
      synonyms: ['move', 'travel', 'head']
    },
    {
      word: 'come',
      phonetic: '/kʌm/',
      definition: 'To move toward here or another person',
      example: 'Please come to my house after football practice.',
      synonyms: ['arrive', 'approach', 'get here']
    },
    {
      word: 'eat',
      phonetic: '/iːt/',
      definition: 'To put food in mouth and swallow',
      example: 'We eat together at six with the whole family.',
      synonyms: ['dine', 'have', 'consume']
    },
    {
      word: 'drink',
      phonetic: '/drɪŋk/',
      definition: 'To take liquid into mouth and swallow',
      example: 'I drink water before running in hot weather.',
      synonyms: ['sip', 'have', 'gulp']
    },
    {
      word: 'sleep',
      phonetic: '/sliːp/',
      definition: 'To rest your body with eyes closed',
      example: 'Babies sleep a lot during their first months.',
      synonyms: ['rest', 'nap', 'doze']
    }
  ],
  completed: false
}
```

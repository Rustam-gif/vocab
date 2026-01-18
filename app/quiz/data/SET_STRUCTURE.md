# Vocabulary Set Structure Guide

This document describes the structure and guidelines for creating vocabulary sets in `levels.ts`.

## Set Structure

Each set follows this TypeScript structure:

```typescript
{
  id: number,           // Sequential ID within the level (1, 2, 3...)
  title: string,        // Descriptive title for the set
  words: Word[],        // Array of exactly 5 words
  completed: false      // Always false for new sets
}
```

## Word Structure

Each word in a set must have:

```typescript
{
  word: string,         // The vocabulary word
  phonetic: string,     // IPA pronunciation (e.g., '/ˈwɜːd/')
  definition: string,   // Clear, concise definition
  example: string,      // Natural example sentence
  synonyms: string[]    // Array of 3-4 synonyms
}
```

## Example Set

```typescript
{
  id: 21,
  title: 'Authority & Oversight Verbs',
  words: [
    {
      word: 'adjudicate',
      definition: 'To make formal decisions on disputes',
      example: 'The panel adjudicates claims filed during enrollment periods.',
      phonetic: '/əˈdʒuːdɪkeɪt/',
      synonyms: ['judge', 'arbitrate', 'decide', 'settle']
    },
    // ... 4 more words
  ],
  completed: false
}
```

## CEFR Level Guidelines

### Beginner (A1-A2)
- Simple, everyday vocabulary
- Common verbs, nouns, adjectives
- Short, simple definitions
- Basic example sentences
- Examples: eat, sleep, happy, big, house, family

### Intermediate (B1)
- More complex everyday vocabulary
- Abstract concepts introduced
- Workplace and social vocabulary
- Examples: suggest, explain, opportunity, evaluate

### Upper-Intermediate (B1+)
- Professional vocabulary
- More nuanced meanings
- Complex sentence structures in examples
- Examples: implement, facilitate, substantial

### Advanced (B2-C1)
- Academic and professional vocabulary
- Sophisticated verbs and abstract nouns
- Complex definitions
- Examples: adjudicate, extrapolate, ameliorate

### Proficiency (C1+)
- Rare and specialized vocabulary
- Literary and formal register
- Nuanced distinctions
- Examples: obfuscate, perspicacious, verisimilitude

## Important Rules

### 1. Escaping Apostrophes
Always escape apostrophes inside single-quoted strings:

```typescript
// WRONG - will cause syntax error
definition: 'To help someone's decision'

// CORRECT
definition: 'To help someone\'s decision'
```

Common contractions to escape:
- `Don\'t`, `don\'t`
- `It\'s`, `it\'s`
- `Let\'s`, `let\'s`
- `We\'ll`, `They\'ll`, `I\'ll`
- `doesn\'t`, `won\'t`, `can\'t`
- Possessives: `someone\'s`, `doctor\'s`, `company\'s`

### 2. Avoid Smart Quotes
Never use curly/smart quotes. Only use straight quotes:
- Use `'` (ASCII 39) not `'` or `'` (Unicode curly quotes)
- Use `"` (ASCII 34) not `"` or `"` (Unicode curly quotes)

### 3. Consistent Word Count
Each set must have exactly **5 words**.

### 4. Synonym Count
Each word should have **3-4 synonyms**.

### 5. Definition Style
- Start with "To" for verbs: "To make formal decisions..."
- Keep definitions concise (under 15 words ideal)
- Avoid using the word itself in the definition

### 6. Example Sentence Guidelines
- Use natural, realistic contexts
- Keep sentences between 8-15 words
- Avoid overly complex grammar for lower levels
- Include context clues that reinforce meaning

### 7. Phonetic Notation
Use IPA (International Phonetic Alphabet):
- Enclose in forward slashes: `/ˈwɜːd/`
- Mark primary stress with `ˈ` before the stressed syllable
- Use standard IPA symbols

## Level Structure in levels.ts

```typescript
{
  id: 'level-id',           // Unique string ID
  name: 'Level Name',       // Display name
  description: 'X Sets...',  // Description shown to users
  cefr: 'A1-A2',            // CEFR level range
  icon: '🌱',               // Emoji icon
  sets: [                   // Array of sets
    { id: 1, title: '...', words: [...], completed: false },
    { id: 2, title: '...', words: [...], completed: false },
    // ...
  ]
}
```

## Current Levels

| Level ID | Name | CEFR | Sets |
|----------|------|------|------|
| beginner | Beginner | A1-A2 | 25 |
| ielts-core | IELTS Core | B1-B2 | 20 |
| workplace | Workplace | B1-B2 | 20 |
| intermediate | Intermediate | B1 | 30 |
| upper-intermediate | Upper-Intermediate | B1+ | 20 |
| advanced | Advanced | B2-C1 | 30 |
| phrasal-verbs | Phrasal Verbs | B1-B2 | 14 |
| proficiency-vocab | Proficiency Vocab | C1+ | 10 |
| mastery | Mastery | C2 | 2 |

## Adding New Sets

1. Find the level in `levels.ts`
2. Add new set object after the last set in the `sets` array
3. Increment the `id` from the previous set
4. Ensure exactly 5 words with all required fields
5. Escape all apostrophes in strings
6. Test TypeScript compilation: `npx tsc --noEmit app/quiz/data/levels.ts`

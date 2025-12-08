/// <reference types="node" />
import { strict as assert } from 'node:assert';
import { planDailyMission } from '../core/missionPlanner';
import { updateUserWordStateAfterAnswer } from '../core/learningEngine';
import { UserWordState, Word } from '../core/dailyMissionTypes';

const makeWord = (id: string, definition: string): Word => ({
  id,
  text: id,
  definition,
});

const today = new Date('2024-01-01T00:00:00Z');

const baseState: UserWordState = {
  userId: 'u1',
  wordId: 'w1',
  status: 'new',
  stage: 0,
  strength: 0.2,
  lastSeenAt: null,
  nextReviewAt: null,
  totalCorrect: 0,
  totalIncorrect: 0,
};

// updateUserWordStateAfterAnswer: correct
{
  const next = updateUserWordStateAfterAnswer(baseState, true, today);
  assert.strictEqual(next.stage, 1, 'correct answers should advance stage');
  assert.ok(next.strength > baseState.strength, 'correct answers should increase strength');
  assert.strictEqual(next.status, 'learning', 'new words become learning after a correct answer');
}

// updateUserWordStateAfterAnswer: incorrect
{
  const start: UserWordState = { ...baseState, status: 'review', stage: 2, strength: 0.5 };
  const next = updateUserWordStateAfterAnswer(start, false, today);
  assert.strictEqual(next.stage, 1, 'incorrect answers should reduce stage');
  assert.ok(next.strength < start.strength, 'incorrect answers should decrease strength');
  assert.strictEqual(next.status, 'review', 'status should not downgrade below learning');
  assert.strictEqual(next.nextReviewAt?.slice(0, 10), '2024-01-02', 'incorrect answers review next day');
}

const wordsPool = [
  makeWord('w1', 'alpha'),
  makeWord('w2', 'beta'),
  makeWord('w3', 'gamma'),
  makeWord('w4', 'delta'),
  makeWord('w5', 'epsilon'),
  makeWord('w6', 'zeta'),
  makeWord('w7', 'eta'),
];

// Mission generation: plenty of weak words
{
  const result = planDailyMission({
    userId: 'u1',
    missionId: 'm1',
    weakWords: wordsPool.slice(0, 4),
    newWords: wordsPool.slice(4, 6),
    wordsPool,
    today,
  });
  assert.strictEqual(result.questions.length, 5, 'mission should have 5 questions including story');
  assert.ok(result.mission.weakWordsCount >= 3, 'should include review questions');
  assert.ok(result.mission.newWordsCount >= 1, 'should include at least one new question');
  assert.strictEqual(result.questions[result.questions.length - 1].type, 'story_mcq', 'last question is story');
}

// Mission generation: no weak words (all new)
{
  const result = planDailyMission({
    userId: 'u1',
    missionId: 'm2',
    weakWords: [],
    newWords: wordsPool.slice(0, 5),
    wordsPool,
    today,
  });
  assert.strictEqual(result.questions.length, 5, 'should still create 5 questions');
  assert.ok(result.mission.newWordsCount >= 4, 'fills non-story slots with new words when no weak words');
}

// Mission generation: no new words (all review)
{
  const result = planDailyMission({
    userId: 'u1',
    missionId: 'm3',
    weakWords: wordsPool.slice(0, 5),
    newWords: [],
    wordsPool,
    today,
  });
  assert.strictEqual(result.questions.length, 5, 'should still create 5 questions');
  assert.strictEqual(result.mission.newWordsCount, 0, 'no new words available means zero new questions');
  assert.ok(result.mission.weakWordsCount >= 4, 'fills with weak/review words');
}

console.log('dailyMission tests passed');

import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { generateComparePuzzle, generateComparePuzzleSet } from '../lib/compare';
import { compareEvaluations, evaluateHand } from '../lib/evaluator';
import { Difficulty } from '../lib/types';

const DIFFICULTIES: Difficulty[] = ['beginner', 'intermediate', 'advanced'];

describe('generateComparePuzzle', () => {
  for (const difficulty of DIFFICULTIES) {
    it(`${difficulty}：AとBでカードが重複しない`, () => {
      for (let i = 0; i < 60; i += 1) {
        const puzzle = generateComparePuzzle(difficulty);
        const ids = new Set([...puzzle.handA, ...puzzle.handB].map((card) => card.id));
        assert.equal(puzzle.handA.length, 5);
        assert.equal(puzzle.handB.length, 5);
        assert.equal(ids.size, 10);
      }
    });

    it(`${difficulty}：出題した手札と正解が必ず一致する`, () => {
      for (let i = 0; i < 60; i += 1) {
        const puzzle = generateComparePuzzle(difficulty);
        const diff = compareEvaluations(evaluateHand(puzzle.handA), evaluateHand(puzzle.handB));
        const expected = diff > 0 ? 'A' : diff < 0 ? 'B' : 'tie';
        assert.equal(puzzle.answer, expected);
        // 保持している評価結果も、その場で判定した結果と一致する
        assert.equal(puzzle.evaluationA.handId, evaluateHand(puzzle.handA).handId);
        assert.equal(puzzle.evaluationB.handId, evaluateHand(puzzle.handB).handId);
      }
    });
  }

  it('初級は違う役同士の比較になり、引き分けが出ない', () => {
    for (let i = 0; i < 60; i += 1) {
      const puzzle = generateComparePuzzle('beginner');
      assert.notEqual(puzzle.evaluationA.handId, puzzle.evaluationB.handId);
      assert.notEqual(puzzle.answer, 'tie');
    }
  });

  it('上級では同じ役同士の比較や引き分けも出題される', () => {
    const puzzles = generateComparePuzzleSet('advanced', 120);
    const sameCategory = puzzles.filter(
      (puzzle) => puzzle.evaluationA.handId === puzzle.evaluationB.handId,
    );
    const ties = puzzles.filter((puzzle) => puzzle.answer === 'tie');
    const kickerDecided = sameCategory.filter(
      (puzzle) =>
        puzzle.answer !== 'tie' &&
        puzzle.evaluationA.tiebreakers[0] === puzzle.evaluationB.tiebreakers[0],
    );

    assert.ok(sameCategory.length > 0, '同じ役同士の比較が含まれること');
    assert.ok(ties.length > 0, '引き分けが含まれること');
    assert.ok(kickerDecided.length > 0, 'キッカーで決まる問題が含まれること');
  });

  it('10問セットを生成できる', () => {
    assert.equal(generateComparePuzzleSet('intermediate', 10).length, 10);
  });
});

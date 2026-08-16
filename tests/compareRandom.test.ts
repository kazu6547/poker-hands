import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import {
  ComparePuzzle,
  compareResultHeadline,
  describeComparison,
  generateComparePuzzle,
} from '../lib/compare';
import { compareEvaluations, evaluateHand } from '../lib/evaluator';
import { Card, Difficulty } from '../lib/types';

/**
 * 「VSカード」の出題と判定が、何度まわしても食い違わないことを確かめる。
 * 勝者・引き分け・説明文まで、実際の判定結果と一致しているかを見る。
 */

const DIFFICULTIES: Difficulty[] = ['beginner', 'intermediate', 'advanced'];
const cardKey = (card: Card) => `${card.rank}-${card.suit}`;

function assertSoundPuzzle(puzzle: ComparePuzzle) {
  assert.equal(puzzle.handA.length, 5);
  assert.equal(puzzle.handB.length, 5);

  // 1問の中で同じカードが2度使われない（A と B をまたいでも）
  const all = [...puzzle.handA, ...puzzle.handB].map(cardKey);
  assert.equal(new Set(all).size, 10, `カードが重複している：${all.join(',')}`);

  // 出題に添えた判定結果が、実際の手と一致している
  const evaluationA = evaluateHand(puzzle.handA);
  const evaluationB = evaluateHand(puzzle.handB);
  assert.equal(evaluationA.handId, puzzle.evaluationA.handId);
  assert.equal(evaluationB.handId, puzzle.evaluationB.handId);

  // 正解が、比較ロジックの結果と一致している
  const order = compareEvaluations(evaluationA, evaluationB);
  const expected = order > 0 ? 'A' : order < 0 ? 'B' : 'tie';
  assert.equal(puzzle.answer, expected, `正解が比較結果と違う：${all.join(',')}`);

  // 見出しと説明文が結果と矛盾しない
  const headline = compareResultHeadline(puzzle.answer);
  if (puzzle.answer === 'tie') {
    assert.match(headline, /引き分け/);
  } else {
    assert.ok(headline.startsWith(puzzle.answer), '見出しの勝者が違う');
  }
  assert.ok(describeComparison(puzzle).length > 0, '説明文が空');
}

describe('VSカードの出題', () => {
  for (const difficulty of DIFFICULTIES) {
    it(`${difficulty}：400問すべてで、出題と判定が一致する`, () => {
      for (let i = 0; i < 400; i += 1) {
        assertSoundPuzzle(generateComparePuzzle(difficulty));
      }
    });
  }

  it('初級では引き分けが出ない', () => {
    for (let i = 0; i < 300; i += 1) {
      assert.notEqual(generateComparePuzzle('beginner').answer, 'tie');
    }
  });

  it('上級では引き分けも同じ役同士も出題される', () => {
    let ties = 0;
    let sameCategory = 0;
    for (let i = 0; i < 400; i += 1) {
      const puzzle = generateComparePuzzle('advanced');
      if (puzzle.answer === 'tie') ties += 1;
      if (puzzle.evaluationA.handId === puzzle.evaluationB.handId) sameCategory += 1;
    }
    assert.ok(ties > 0, '引き分けが1問も出ていない');
    assert.ok(sameCategory > 0, '同じ役同士の比較が出ていない');
  });

  it('A と B のどちらが勝つ問題も出る（片側に偏らない）', () => {
    let winsA = 0;
    let winsB = 0;
    for (let i = 0; i < 400; i += 1) {
      const answer = generateComparePuzzle('intermediate').answer;
      if (answer === 'A') winsA += 1;
      if (answer === 'B') winsB += 1;
    }
    assert.ok(winsA > 40 && winsB > 40, `偏りが大きい（A:${winsA} B:${winsB}）`);
  });

  it('2000問つくっても例外・停止が起きない', () => {
    for (let i = 0; i < 2000; i += 1) {
      const puzzle = generateComparePuzzle(DIFFICULTIES[i % DIFFICULTIES.length]);
      assert.equal(puzzle.handA.length + puzzle.handB.length, 10);
    }
  });
});

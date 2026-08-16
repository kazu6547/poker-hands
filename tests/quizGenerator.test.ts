import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { HANDS_BY_ID } from '../data/hands';
import { evaluateHand } from '../lib/evaluator';
import {
  DIFFICULTY_POOLS,
  generateQuizQuestion,
  generateQuizSet,
} from '../lib/generator';
import { Card, Difficulty, HAND_IDS, HandId, QuizQuestion } from '../lib/types';

/**
 * 「役を当てる」の出題が、いつでも成立していることを総当たりで確かめる。
 * 数百〜数千回まわして、例外・無限ループ・破綻した問題が出ないことも見る。
 */

const DIFFICULTIES: Difficulty[] = ['beginner', 'intermediate', 'advanced'];

const cardKey = (card: Card) => `${card.rank}-${card.suit}`;

function assertSoundQuestion(question: QuizQuestion, difficulty: Difficulty) {
  assert.equal(question.cards.length, 5, '出題は必ず5枚');

  const keys = question.cards.map(cardKey);
  assert.equal(new Set(keys).size, 5, `同じカードが重複している：${keys.join(',')}`);

  const ids = question.cards.map((card) => card.id);
  assert.equal(new Set(ids).size, 5, 'カードIDが重複している');

  // 出題した5枚を判定し直しても、同じ役になること
  assert.equal(
    evaluateHand(question.cards).handId,
    question.answerId,
    `出題と正解がずれている：${keys.join(',')}`,
  );

  assert.equal(question.options.length, 4, '選択肢は4つ');
  assert.equal(new Set(question.options).size, 4, '選択肢が重複している');
  assert.ok(question.options.includes(question.answerId), '正解が選択肢に入っていない');
  for (const option of question.options) {
    assert.ok(HAND_IDS.includes(option), `未知の役が選択肢に入っている：${option}`);
    assert.ok(HANDS_BY_ID[option], `役データがない：${option}`);
  }

  assert.ok(
    DIFFICULTY_POOLS[difficulty].includes(question.answerId),
    `難易度の出題範囲外：${question.answerId}`,
  );
}

describe('役を当てるの出題', () => {
  for (const difficulty of DIFFICULTIES) {
    it(`${difficulty}：500問すべてが成立している`, () => {
      for (let i = 0; i < 500; i += 1) {
        assertSoundQuestion(generateQuizQuestion(difficulty), difficulty);
      }
    });
  }

  it('難易度ごとに出題される役の範囲が違う', () => {
    const seen = (difficulty: Difficulty) => {
      const set = new Set<HandId>();
      for (let i = 0; i < 300; i += 1) set.add(generateQuizQuestion(difficulty).answerId);
      return set;
    };
    const beginner = seen('beginner');
    const advanced = seen('advanced');
    assert.ok(advanced.size > beginner.size, '上級のほうが出題の幅が広いこと');
    for (const handId of beginner) {
      assert.ok(DIFFICULTY_POOLS.beginner.includes(handId));
    }
  });

  it('10問セットで同じ役が連続しない', () => {
    for (let trial = 0; trial < 100; trial += 1) {
      const set = generateQuizSet('advanced', 10);
      assert.equal(set.length, 10);
      for (let i = 0; i < set.length; i += 1) {
        assertSoundQuestion(set[i], 'advanced');
        if (i > 0) {
          assert.notEqual(set[i].answerId, set[i - 1].answerId, '同じ役が連続している');
        }
      }
      // 問題IDが重複しない（React の key が衝突しない）
      assert.equal(new Set(set.map((question) => question.id)).size, 10);
    }
  });

  it('復習用に役を指定すると、その役で出題される', () => {
    for (const handId of HAND_IDS) {
      const question = generateQuizQuestion('advanced', { forceHandId: handId });
      assert.equal(question.answerId, handId);
      assert.equal(evaluateHand(question.cards).handId, handId);
    }
  });

  it('避ける役をすべて指定しても、例外にならず出題できる', () => {
    const question = generateQuizQuestion('beginner', { avoid: [...HAND_IDS] });
    assertSoundQuestion(question, 'beginner');
  });

  it('3000問つくっても例外・停止が起きない', () => {
    for (let i = 0; i < 3000; i += 1) {
      const difficulty = DIFFICULTIES[i % DIFFICULTIES.length];
      const question = generateQuizQuestion(difficulty);
      assert.equal(question.cards.length, 5);
    }
  });
});

import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { createDeck, sampleMany } from '../lib/cards';
import {
  combinations,
  findBestFive,
  generateBestFivePuzzle,
  isBestFiveSelection,
} from '../lib/bestFive';
import { compareEvaluations, evaluateHand } from '../lib/evaluator';
import { Card, Difficulty } from '../lib/types';

/**
 * 「最強の5枚」の抽出が、21通りを総当たりした結果と必ず一致することを確かめる。
 * ランダムな7枚を大量に試し、ホールカードの使い方が0枚〜2枚のどれでも正しいか見る。
 */

const DIFFICULTIES: Difficulty[] = ['beginner', 'intermediate', 'advanced'];
const cardKey = (card: Card) => `${card.rank}-${card.suit}`;

/** 21通りを全部評価して、いちばん強い組み合わせを探す（テスト用の素朴な実装） */
function bruteForceBest(cards: readonly Card[]): Card[] {
  let best: Card[] | null = null;
  for (const hand of combinations(cards, 5)) {
    if (!best || compareEvaluations(evaluateHand(hand), evaluateHand(best)) > 0) {
      best = hand;
    }
  }
  return best ?? [];
}

describe('最強の5枚の抽出', () => {
  it('ランダムな7枚 500 セットで、総当たりの結果と一致する', () => {
    const deck = createDeck();
    for (let i = 0; i < 500; i += 1) {
      const seven = sampleMany(deck, 7);
      const result = findBestFive(seven);
      const brute = bruteForceBest(seven);

      assert.equal(result.cards.length, 5);
      // 同じ強さであること（同点の5枚が複数ある場合は札が違ってもよい）
      assert.equal(
        compareEvaluations(evaluateHand(result.cards), evaluateHand(brute)),
        0,
        `最強の5枚が総当たりより弱い：${seven.map(cardKey).join(',')}`,
      );
      // 選んだ5枚は必ず7枚の中から
      for (const card of result.cards) {
        assert.ok(seven.some((item) => item.id === card.id), '7枚に無いカードが選ばれている');
      }
    }
  });

  it('ホールカードを 0枚・1枚・2枚 使うケースがどれも出る', () => {
    const used = new Set<number>();
    for (let i = 0; i < 400; i += 1) {
      const puzzle = generateBestFivePuzzle(DIFFICULTIES[i % DIFFICULTIES.length]);
      const holeIds = new Set(puzzle.holeCards.map((card) => card.id));
      used.add(puzzle.best.cards.filter((card) => holeIds.has(card.id)).length);
    }
    for (const count of [0, 1, 2]) {
      assert.ok(used.has(count), `ホールカード${count}枚のケースが出ていない`);
    }
  });

  it('場の5枚だけで最強になるケースを正しく扱う', () => {
    // ボードがフルハウス、手札は関係のない小さい札
    const board = [
      { id: 'b1', rank: 13, suit: 'spades' },
      { id: 'b2', rank: 13, suit: 'hearts' },
      { id: 'b3', rank: 13, suit: 'clubs' },
      { id: 'b4', rank: 9, suit: 'diamonds' },
      { id: 'b5', rank: 9, suit: 'spades' },
    ] as Card[];
    const hole = [
      { id: 'h1', rank: 2, suit: 'clubs' },
      { id: 'h2', rank: 3, suit: 'diamonds' },
    ] as Card[];

    const result = findBestFive([...hole, ...board]);
    assert.equal(result.evaluation.handId, 'full-house');
    assert.ok(result.cards.every((card) => card.id.startsWith('b')), 'ボードの5枚が選ばれること');
  });

  it('同じ5枚なら順番が違っても正解、1枚でも違えば不正解', () => {
    const deck = createDeck();
    for (let i = 0; i < 200; i += 1) {
      const seven = sampleMany(deck, 7);
      const best = findBestFive(seven);
      const shuffled = [...best.cards].reverse();
      assert.equal(isBestFiveSelection(shuffled, best), true);

      const others = seven.filter((card) => !best.cards.some((item) => item.id === card.id));
      const wrong = [...best.cards.slice(0, 4), others[0]];
      // 同じ強さの別の5枚が作れる問題もあるため、強さが落ちるときだけ不正解を期待する
      if (compareEvaluations(evaluateHand(wrong), best.evaluation) < 0) {
        assert.equal(isBestFiveSelection(wrong, best), false);
      }
    }
  });

  it('出題される7枚は重複せず、最強の5枚が一意に決まる', () => {
    for (const difficulty of DIFFICULTIES) {
      for (let i = 0; i < 150; i += 1) {
        const puzzle = generateBestFivePuzzle(difficulty);
        const keys = puzzle.cards.map(cardKey);
        assert.equal(keys.length, 7);
        assert.equal(new Set(keys).size, 7, `カードが重複：${keys.join(',')}`);
        assert.equal(puzzle.holeCards.length, 2);
        assert.equal(puzzle.boardCards.length, 5);
        assert.equal(puzzle.best.isUnique, true, '正解が一意でない問題が出ている');

        // 総当たりと一致
        assert.equal(
          compareEvaluations(evaluateHand(puzzle.best.cards), evaluateHand(bruteForceBest(puzzle.cards))),
          0,
        );
      }
    }
  });

  it('1000回つくっても例外・停止が起きない', () => {
    for (let i = 0; i < 1000; i += 1) {
      const puzzle = generateBestFivePuzzle(DIFFICULTIES[i % DIFFICULTIES.length]);
      assert.equal(puzzle.cards.length, 7);
    }
  });
});

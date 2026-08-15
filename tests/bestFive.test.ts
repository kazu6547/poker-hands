import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { parseCards } from '../lib/cards';
import {
  combinations,
  findBestFive,
  generateBestFivePuzzle,
  isBestFiveSelection,
  isSameCardSet,
} from '../lib/bestFive';
import { Difficulty } from '../lib/types';

const ids = (notation: string) =>
  parseCards(notation)
    .map((card) => card.id)
    .sort();

describe('combinations', () => {
  it('7枚から5枚の組み合わせは21通り', () => {
    assert.equal(combinations(parseCards('AS KS QS JS TS 9S 8S'), 5).length, 21);
  });
});

describe('findBestFive', () => {
  it('フラッシュとストレートが両立するときはフラッシュを選ぶ', () => {
    const best = findBestFive(parseCards('5H 6H 7H 8H 9S TD 2H'));
    assert.equal(best.evaluation.handId, 'flush');
    assert.deepEqual(
      best.cards.map((card) => card.id).sort(),
      ids('5H 6H 7H 8H 2H'),
    );
  });

  it('A・2・3・4・5 のストレートを見つけられる', () => {
    const best = findBestFive(parseCards('AS 2H 3D 4C 5S 9D KH'));
    assert.equal(best.evaluation.handId, 'straight');
    assert.equal(best.evaluation.tiebreakers[0], 5);
  });

  it('フルハウスはスリーカードより優先される', () => {
    const best = findBestFive(parseCards('9S 9H 9D 4C 4H 2S 7D'));
    assert.equal(best.evaluation.handId, 'full-house');
    assert.deepEqual(
      best.cards.map((card) => card.id).sort(),
      ids('9S 9H 9D 4C 4H'),
    );
  });

  it('キッカーがいちばん大きい5枚を選ぶ', () => {
    const best = findBestFive(parseCards('AS AH 9D 7C 5S 3H 2D'));
    assert.equal(best.evaluation.handId, 'one-pair');
    assert.deepEqual(
      best.cards.map((card) => card.id).sort(),
      ids('AS AH 9D 7C 5S'),
    );
  });

  it('同じ強さの5枚が複数あるときは isUnique が false になる', () => {
    // ボードでストレートが完成し、余りの2枚がどちらでも同じ強さになるケース
    const best = findBestFive(parseCards('5S 6H 7D 8C 9S 2H 3D'));
    assert.equal(best.evaluation.handId, 'straight');
    assert.equal(best.isUnique, true);

    const shared = findBestFive(parseCards('TS JH QD KC AS 2H 3D'));
    assert.equal(shared.evaluation.handId, 'straight');
    assert.equal(shared.isUnique, true);
  });
});

describe('isBestFiveSelection', () => {
  it('同じ5枚なら順番が違っても正解になる', () => {
    const cards = parseCards('9S 9H 9D 4C 4H 2S 7D');
    const best = findBestFive(cards);
    const shuffled = [...best.cards].reverse();
    assert.equal(isBestFiveSelection(shuffled, best), true);
  });

  it('別の5枚は不正解になる', () => {
    const cards = parseCards('9S 9H 9D 4C 4H 2S 7D');
    const best = findBestFive(cards);
    assert.equal(isBestFiveSelection(parseCards('9S 9H 9D 2S 7D'), best), false);
  });

  it('5枚でない選択は不正解になる', () => {
    const cards = parseCards('9S 9H 9D 4C 4H 2S 7D');
    const best = findBestFive(cards);
    assert.equal(isBestFiveSelection(parseCards('9S 9H 9D'), best), false);
  });
});

describe('generateBestFivePuzzle', () => {
  const difficulties: Difficulty[] = ['beginner', 'intermediate', 'advanced'];

  for (const difficulty of difficulties) {
    it(`${difficulty}：7枚が重複せず、最強の5枚が一意になる`, () => {
      for (let i = 0; i < 40; i += 1) {
        const puzzle = generateBestFivePuzzle(difficulty);
        assert.equal(puzzle.cards.length, 7);
        assert.equal(new Set(puzzle.cards.map((card) => card.id)).size, 7);
        assert.equal(puzzle.holeCards.length, 2);
        assert.equal(puzzle.boardCards.length, 5);
        assert.equal(puzzle.best.isUnique, true);
        assert.equal(isSameCardSet(puzzle.best.cards, findBestFive(puzzle.cards).cards), true);
        assert.equal(isBestFiveSelection(puzzle.best.cards, puzzle.best), true);
      }
    });
  }
});

import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { keyCardIds } from '../lib/handStructure';
import { Card, Suit } from '../lib/types';

const card = (rank: number, suit: Suit): Card => ({
  id: `${rank}-${suit}`,
  rank: rank as Card['rank'],
  suit,
});

const idsOf = (cards: Card[]) => cards.map((item) => item.id).sort();

describe('役の中心になるカード', () => {
  it('ワンペアはそのペア2枚だけ', () => {
    const hand = [
      card(10, 'spades'),
      card(10, 'hearts'),
      card(4, 'clubs'),
      card(7, 'diamonds'),
      card(2, 'spades'),
    ];
    assert.deepEqual(keyCardIds(hand).sort(), ['10-hearts', '10-spades']);
  });

  it('ツーペアは2組ぶんの4枚（余りの1枚は入らない）', () => {
    const hand = [
      card(14, 'spades'),
      card(14, 'hearts'),
      card(8, 'clubs'),
      card(8, 'diamonds'),
      card(3, 'spades'),
    ];
    const keys = keyCardIds(hand);
    assert.equal(keys.length, 4);
    assert.ok(!keys.includes('3-spades'));
  });

  it('フルハウスは5枚すべてが役の一部', () => {
    const hand = [
      card(9, 'spades'),
      card(9, 'hearts'),
      card(9, 'clubs'),
      card(5, 'diamonds'),
      card(5, 'spades'),
    ];
    assert.deepEqual(keyCardIds(hand).sort(), idsOf(hand));
  });

  it('スリーカードは3枚だけ', () => {
    const hand = [
      card(6, 'spades'),
      card(6, 'hearts'),
      card(6, 'clubs'),
      card(13, 'diamonds'),
      card(2, 'spades'),
    ];
    assert.equal(keyCardIds(hand).length, 3);
  });

  it('フラッシュ・ストレートは5枚すべて', () => {
    const flush = [
      card(2, 'hearts'),
      card(5, 'hearts'),
      card(9, 'hearts'),
      card(11, 'hearts'),
      card(13, 'hearts'),
    ];
    assert.deepEqual(keyCardIds(flush).sort(), idsOf(flush));

    const straight = [
      card(5, 'spades'),
      card(6, 'hearts'),
      card(7, 'clubs'),
      card(8, 'diamonds'),
      card(9, 'spades'),
    ];
    assert.deepEqual(keyCardIds(straight).sort(), idsOf(straight));
  });

  it('A から 5 のストレート（ホイール）も5枚すべて', () => {
    const wheel = [
      card(14, 'spades'),
      card(2, 'hearts'),
      card(3, 'clubs'),
      card(4, 'diamonds'),
      card(5, 'spades'),
    ];
    assert.deepEqual(keyCardIds(wheel).sort(), idsOf(wheel));
  });

  it('役なしは、いちばん大きい1枚だけ', () => {
    const hand = [
      card(14, 'spades'),
      card(9, 'hearts'),
      card(7, 'clubs'),
      card(4, 'diamonds'),
      card(2, 'spades'),
    ];
    assert.deepEqual(keyCardIds(hand), ['14-spades']);
  });

  it('5枚ちょうどでなければ空（表示に使わない）', () => {
    assert.deepEqual(keyCardIds([card(14, 'spades'), card(14, 'hearts')]), []);
    assert.deepEqual(keyCardIds([]), []);
  });
});

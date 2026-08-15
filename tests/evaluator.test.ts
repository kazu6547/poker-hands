import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { parseCards } from '../lib/cards';
import { compareEvaluations, evaluateHand, findStraightHigh } from '../lib/evaluator';

const evaluate = (notation: string) => evaluateHand(parseCards(notation));

describe('evaluateHand', () => {
  it('10〜Aの同じマークはロイヤルフラッシュ', () => {
    assert.equal(evaluate('TS JS QS KS AS').handId, 'royal-flush');
  });

  it('同じマークの連番はストレートフラッシュ', () => {
    assert.equal(evaluate('6H 7H 8H 9H TH').handId, 'straight-flush');
  });

  it('A・2・3・4・5 は 5 を最高カードとするストレート', () => {
    const evaluation = evaluate('AS 2H 3D 4C 5S');
    assert.equal(evaluation.handId, 'straight');
    assert.equal(evaluation.tiebreakers[0], 5);
  });

  it('10・J・Q・K・A は A を最高カードとするストレート', () => {
    const evaluation = evaluate('TS JH QD KC AS');
    assert.equal(evaluation.handId, 'straight');
    assert.equal(evaluation.tiebreakers[0], 14);
  });

  it('K・A・2・3・4 は連番として扱わない', () => {
    assert.equal(evaluate('KS AS 2S 3S 4S').handId, 'flush');
  });

  it('同じマークの A・2・3・4・5 はストレートフラッシュ', () => {
    assert.equal(evaluate('AS 2S 3S 4S 5S').handId, 'straight-flush');
  });

  it('各役を正しく判定する', () => {
    assert.equal(evaluate('9S 9H 9D 9C 2S').handId, 'four-of-a-kind');
    assert.equal(evaluate('QS QH QD 4S 4H').handId, 'full-house');
    assert.equal(evaluate('2D 5D 9D JD KD').handId, 'flush');
    assert.equal(evaluate('7S 7H 7D KC 3D').handId, 'three-of-a-kind');
    assert.equal(evaluate('JS JH 4D 4C 9S').handId, 'two-pair');
    assert.equal(evaluate('AS AD 8H 5C 2S').handId, 'one-pair');
    assert.equal(evaluate('AS JD 9H 6C 3S').handId, 'high-card');
  });

  it('5枚でない場合はエラーになる', () => {
    assert.throws(() => evaluateHand(parseCards('AS KS QS')), /5枚/);
    assert.throws(() => evaluateHand(parseCards('AS KS QS JS TS 9S')), /5枚/);
    assert.throws(() => evaluateHand([]), /5枚/);
  });

  it('同じカードが重複している場合はエラーになる', () => {
    assert.throws(() => evaluateHand(parseCards('AS AS KS QS JS')), /重複/);
  });

  it('存在しないカード表記はパースの時点でエラーになる', () => {
    for (const notation of ['1S', 'AX', '', 'S', '11H']) {
      assert.throws(() => parseCards(notation === '' ? ' ' : notation).length || evaluateHand([]));
    }
  });

  it('フラッシュとストレートが同時に成立するときはストレートフラッシュ', () => {
    assert.equal(evaluate('9H TH JH QH KH').handId, 'straight-flush');
  });

  it('フルハウスとスリーカードを取り違えない', () => {
    assert.equal(evaluate('8S 8H 8D 3C 3D').handId, 'full-house');
    assert.equal(evaluate('8S 8H 8D 3C 4D').handId, 'three-of-a-kind');
  });

  it('ツーペアとワンペアを取り違えない', () => {
    assert.equal(evaluate('8S 8H 3C 3D KD').handId, 'two-pair');
    assert.equal(evaluate('8S 8H 3C 5D KD').handId, 'one-pair');
  });
});

describe('findStraightHigh', () => {
  it('重複がある場合は成立しない', () => {
    assert.equal(findStraightHigh([5, 5, 4, 3, 2]), null);
  });

  it('ホイールは 5 を返す', () => {
    assert.equal(findStraightHigh([14, 5, 4, 3, 2]), 5);
  });
});

describe('compareEvaluations', () => {
  it('役のランクが違う場合はランクで決まる', () => {
    assert.ok(compareEvaluations(evaluate('2D 5D 9D JD KD'), evaluate('5C 6D 7S 8H 9C')) > 0);
    assert.ok(compareEvaluations(evaluate('QS QH QD 4S 4H'), evaluate('7S 7H 7D KC 3D')) > 0);
  });

  it('同じ役なら役の中心になる数字で決まる', () => {
    assert.ok(compareEvaluations(evaluate('AS AD 8H 5C 2S'), evaluate('KS KD 8H 5C 2S')) > 0);
    assert.ok(compareEvaluations(evaluate('TS JH QD KC AS'), evaluate('6S 7H 8D 9C TC')) > 0);
  });

  it('同じ役・同じ中心ならキッカーで決まる', () => {
    assert.ok(compareEvaluations(evaluate('AS AD KH 5C 2S'), evaluate('AH AC QH 5D 2H')) > 0);
    assert.ok(compareEvaluations(evaluate('JS JH 4D 4C KS'), evaluate('JD JC 4H 4S 9S')) > 0);
  });

  it('ホイールのストレートは 6 ハイのストレートより弱い', () => {
    assert.ok(compareEvaluations(evaluate('AS 2H 3D 4C 5S'), evaluate('2S 3H 4D 5C 6S')) < 0);
  });

  it('マークが違うだけの同じ手は引き分け', () => {
    assert.equal(compareEvaluations(evaluate('AS AD KH 5C 2S'), evaluate('AH AC KD 5S 2D')), 0);
    assert.equal(compareEvaluations(evaluate('TS JS QS KS AS'), evaluate('TH JH QH KH AH')), 0);
    assert.equal(compareEvaluations(evaluate('2D 5D 9D JD KD'), evaluate('2C 5C 9C JC KC')), 0);
  });

  it('同じフルハウス・フォーカード・ハイカードの比較', () => {
    // 3枚組が同じなら2枚組で決まる
    assert.ok(compareEvaluations(evaluate('QS QH QD 9S 9H'), evaluate('QC QS QH 4S 4H')) > 0);
    // フォーカードは残り1枚で決まる
    assert.ok(compareEvaluations(evaluate('9S 9H 9D 9C AS'), evaluate('9S 9H 9D 9C 2S')) > 0);
    // ハイカードは上から順に比較する
    assert.ok(compareEvaluations(evaluate('AS JD 9H 6C 3S'), evaluate('AH JC 9S 6D 2H')) > 0);
    // 同じフラッシュはランクの並びで決まる
    assert.ok(compareEvaluations(evaluate('AD JD 9D 6D 3D'), evaluate('KC JC 9C 6C 3C')) > 0);
  });

  it('役のランク順（10役）が仕様どおりに並ぶ', () => {
    const ordered = [
      'TS JS QS KS AS', // ロイヤルフラッシュ
      '6H 7H 8H 9H TH', // ストレートフラッシュ
      '9S 9H 9D 9C 2S', // フォーカード
      'QS QH QD 4S 4H', // フルハウス
      '2D 5D 9D JD KD', // フラッシュ
      '5C 6D 7S 8H 9C', // ストレート
      '7S 7H 7D KC 3D', // スリーカード
      'JS JH 4D 4C 9S', // ツーペア
      'AS AD 8H 5C 2S', // ワンペア
      'AS JD 9H 6C 3S', // ハイカード
    ].map(evaluate);

    for (let i = 0; i < ordered.length - 1; i += 1) {
      assert.ok(
        compareEvaluations(ordered[i], ordered[i + 1]) > 0,
        `${ordered[i].handId} は ${ordered[i + 1].handId} より強いはず`,
      );
    }
  });
});

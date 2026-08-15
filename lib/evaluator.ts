import { Card, HandEvaluation, HandId, Rank } from './types';

/**
 * 役判定ロジック。
 * 5枚のカードから役を1つに確定させる純関数群。
 */

/** 大きいほど強い（比較用） */
export const HAND_STRENGTH: Record<HandId, number> = {
  'royal-flush': 10,
  'straight-flush': 9,
  'four-of-a-kind': 8,
  'full-house': 7,
  flush: 6,
  straight: 5,
  'three-of-a-kind': 4,
  'two-pair': 3,
  'one-pair': 2,
  'high-card': 1,
};

export interface RankGroup {
  rank: Rank;
  count: number;
}

/** 同じ数字ごとにまとめ、「枚数の多い順 → 数字の大きい順」で返す */
export function groupByRank(cards: readonly Card[]): RankGroup[] {
  const counter = new Map<Rank, number>();
  for (const card of cards) {
    counter.set(card.rank, (counter.get(card.rank) ?? 0) + 1);
  }
  return [...counter.entries()]
    .map(([rank, count]) => ({ rank, count }))
    .sort((a, b) => b.count - a.count || b.rank - a.rank);
}

/** マークごとの枚数 */
export function countBySuit(cards: readonly Card[]): Map<Card['suit'], number> {
  const counter = new Map<Card['suit'], number>();
  for (const card of cards) {
    counter.set(card.suit, (counter.get(card.suit) ?? 0) + 1);
  }
  return counter;
}

/** 5枚すべてが同じマークか */
export function isFlush(cards: readonly Card[]): boolean {
  return cards.length === 5 && cards.every((card) => card.suit === cards[0].suit);
}

/**
 * ストレートかどうかを調べ、成立していれば「一番上の数字」を返す。
 * A は上（10-J-Q-K-A）と下（A-2-3-4-5）の両方で使える。
 * A-2-3-4-5 の場合は 5 を返す（A は 1 として扱われるため）。
 */
export function findStraightHigh(ranks: readonly number[]): number | null {
  const unique = [...new Set(ranks)].sort((a, b) => b - a);
  if (unique.length !== 5) return null;

  // A-2-3-4-5（ホイール）
  const isWheel =
    unique[0] === 14 && unique[1] === 5 && unique[2] === 4 && unique[3] === 3 && unique[4] === 2;
  if (isWheel) return 5;

  // 通常の連番
  if (unique[0] - unique[4] === 4) return unique[0];

  return null;
}

/** 連番として何枚つながっているかの最大値（ヒント表示用。A は上下どちらでも数える） */
export function longestStraightRun(ranks: readonly number[]): number {
  const values = new Set<number>(ranks);
  if (values.has(14)) values.add(1); // A を 1 としても数える

  const sorted = [...values].sort((a, b) => a - b);
  let best = 0;
  let run = 0;
  let previous: number | null = null;

  for (const value of sorted) {
    if (previous !== null && value === previous + 1) {
      run += 1;
    } else {
      run = 1;
    }
    best = Math.max(best, run);
    previous = value;
  }
  return best;
}

/**
 * 5枚のカードから役を判定する。
 * 判定順は「強い役から」。最初に条件を満たしたものがその手の役になる。
 */
export function evaluateHand(cards: readonly Card[]): HandEvaluation {
  if (cards.length !== 5) {
    throw new Error('役の判定にはちょうど5枚のカードが必要です');
  }
  if (new Set(cards.map((card) => card.id)).size !== 5) {
    // 誤った判定結果を学習者に見せないよう、重複カードは早い段階で弾く
    throw new Error('同じカードが重複しています');
  }

  const hand = [...cards];
  const ranks = hand.map((card) => card.rank);
  const groups = groupByRank(hand);
  const flush = isFlush(hand);
  const straightHigh = findStraightHigh(ranks);

  const build = (handId: HandId, tiebreakers: number[]): HandEvaluation => ({
    handId,
    strength: HAND_STRENGTH[handId],
    tiebreakers,
    cards: hand,
  });

  // 1. ロイヤルフラッシュ（ストレートフラッシュのうち 10〜A のもの）
  if (flush && straightHigh === 14) {
    return build('royal-flush', [14]);
  }
  // 2. ストレートフラッシュ
  if (flush && straightHigh !== null) {
    return build('straight-flush', [straightHigh]);
  }
  // 3. フォーカード
  if (groups[0].count === 4) {
    return build('four-of-a-kind', [groups[0].rank, groups[1].rank]);
  }
  // 4. フルハウス
  if (groups[0].count === 3 && groups[1] && groups[1].count === 2) {
    return build('full-house', [groups[0].rank, groups[1].rank]);
  }
  // 5. フラッシュ
  if (flush) {
    return build(
      'flush',
      [...ranks].sort((a, b) => b - a),
    );
  }
  // 6. ストレート
  if (straightHigh !== null) {
    return build('straight', [straightHigh]);
  }
  // 7. スリーカード
  if (groups[0].count === 3) {
    return build('three-of-a-kind', groups.map((group) => group.rank));
  }
  // 8. ツーペア
  if (groups[0].count === 2 && groups[1] && groups[1].count === 2) {
    return build('two-pair', groups.map((group) => group.rank));
  }
  // 9. ワンペア
  if (groups[0].count === 2) {
    return build('one-pair', groups.map((group) => group.rank));
  }
  // 10. ハイカード
  return build(
    'high-card',
    [...ranks].sort((a, b) => b - a),
  );
}

/** 同じ役同士も含めた強弱比較（a が強ければ正の数） */
export function compareEvaluations(a: HandEvaluation, b: HandEvaluation): number {
  if (a.strength !== b.strength) return a.strength - b.strength;
  const length = Math.max(a.tiebreakers.length, b.tiebreakers.length);
  for (let i = 0; i < length; i += 1) {
    const left = a.tiebreakers[i] ?? 0;
    const right = b.tiebreakers[i] ?? 0;
    if (left !== right) return left - right;
  }
  return 0;
}

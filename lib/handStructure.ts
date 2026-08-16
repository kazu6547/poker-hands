import { evaluateHand, groupByRank } from './evaluator';
import { Card } from './types';

/**
 * 「その役の中心になっているカード」を返す。
 *
 * 正解のあとで、どのカードが役を作っているのかを目で追えるようにするための表示用。
 * 役判定そのものには一切関わらない。
 *
 * - ペア系（ワンペア〜フォーカード・フルハウス）：同じ数字のまとまり
 * - ストレート・フラッシュ系：5枚すべて
 * - ハイカード：いちばん大きい1枚
 */
export function keyCardIds(cards: readonly Card[]): string[] {
  if (cards.length !== 5) return [];

  const { handId } = evaluateHand(cards);
  const groups = groupByRank(cards);
  const idsOfRanks = (ranks: number[]) =>
    cards.filter((card) => ranks.includes(card.rank)).map((card) => card.id);

  switch (handId) {
    case 'royal-flush':
    case 'straight-flush':
    case 'flush':
    case 'straight':
      return cards.map((card) => card.id);
    case 'four-of-a-kind':
    case 'three-of-a-kind':
    case 'one-pair':
      return idsOfRanks([groups[0].rank]);
    case 'full-house':
    case 'two-pair':
      return idsOfRanks([groups[0].rank, groups[1].rank]);
    case 'high-card':
      // すべて1枚ずつなので、groups の先頭がいちばん大きい数字になる
      return idsOfRanks([groups[0].rank]);
    default:
      return [];
  }
}

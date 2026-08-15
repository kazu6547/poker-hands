import { HANDS_BY_ID } from '@/data/hands';
import { RANK_LABEL, SUIT_META } from './cards';
import { countBySuit, evaluateHand, findStraightHigh, groupByRank, longestStraightRun } from './evaluator';
import { Card, HandId } from './types';

/**
 * 学習フィードバック用の文章生成。
 * 「今どうなっているか」「あと何が足りないか」を短い日本語で伝える。
 */

interface Analysis {
  /** 同じ数字の最大枚数 */
  maxSameRank: number;
  /** 2枚以上そろっている数字の組数 */
  pairCount: number;
  /** 3枚組があるか */
  hasTriple: boolean;
  /** 同じマークの最大枚数 */
  maxSameSuit: number;
  /** 連番として最長で何枚つながっているか */
  longestRun: number;
  /** ストレートが完成しているか */
  isStraight: boolean;
}

function analyze(cards: readonly Card[]): Analysis {
  const groups = groupByRank(cards);
  const suitCounts = [...countBySuit(cards).values()];
  const ranks = cards.map((card) => card.rank);

  return {
    maxSameRank: groups.length > 0 ? groups[0].count : 0,
    pairCount: groups.filter((group) => group.count >= 2).length,
    hasTriple: groups.some((group) => group.count >= 3),
    maxSameSuit: suitCounts.length > 0 ? Math.max(...suitCounts) : 0,
    longestRun: longestStraightRun(ranks),
    isStraight: cards.length === 5 && findStraightHigh(ranks) !== null,
  };
}

/** 「今できている役」の名前（5枚未満なら null） */
export function currentHandName(cards: readonly Card[]): string | null {
  if (cards.length !== 5) return null;
  return HANDS_BY_ID[evaluateHand(cards).handId].nameJa;
}

/**
 * お題の役に対して、選んだ5枚に何が足りないかを説明する。
 */
export function describeShortfall(target: HandId, cards: readonly Card[]): string {
  const info = analyze(cards);
  const targetName = HANDS_BY_ID[target].nameJa;

  switch (target) {
    case 'one-pair':
      if (info.maxSameRank < 2) {
        return '同じ数字のカードが1組もありません。数字がそろう2枚を探しましょう。';
      }
      if (info.maxSameRank > 2) {
        return `同じ数字が${info.maxSameRank}枚入っています。ワンペアは「2枚だけ」にそろえます。`;
      }
      if (info.pairCount > 1) {
        return 'ペアが2組できています。ワンペアにするには、残り3枚を数字が重ならないように選びます。';
      }
      return '惜しい！ペアはできています。ほかの3枚がストレートやフラッシュになっていないか確認しましょう。';

    case 'two-pair':
      if (info.pairCount === 0) {
        return 'ペアがまだ1組もありません。同じ数字の2枚組を2種類そろえます。';
      }
      if (info.pairCount === 1) {
        return 'ペアは1組できています。あと1組、別の数字のペアを追加しましょう。';
      }
      if (info.hasTriple) {
        return `同じ数字が${info.maxSameRank}枚あります。ツーペアは「2枚＋2枚」なので、3枚目は別のカードに替えましょう。`;
      }
      return 'ペアは2組そろっています。残り1枚がどちらの数字ともかぶらないようにしましょう。';

    case 'three-of-a-kind':
      if (info.maxSameRank < 3) {
        return `同じ数字が今${info.maxSameRank}枚です。あと${3 - info.maxSameRank}枚そろえて3枚組にしましょう。`;
      }
      if (info.maxSameRank > 3) {
        return `同じ数字が${info.maxSameRank}枚あります。スリーカードは3枚ちょうどです。`;
      }
      return '3枚組はできています。残り2枚がペアになっているとフルハウスになるので、別々の数字にしましょう。';

    case 'four-of-a-kind':
      if (info.maxSameRank < 4) {
        return `同じ数字が今${info.maxSameRank}枚です。あと${4 - info.maxSameRank}枚そろえましょう（4マークすべてが必要です）。`;
      }
      return '4枚はそろっています。残り1枚は何でもかまいません。';

    case 'full-house':
      if (!info.hasTriple && info.pairCount === 0) {
        return '同じ数字の3枚組と2枚組が必要です。まずは3枚そろう数字を探しましょう。';
      }
      if (!info.hasTriple) {
        return `ペアは${info.pairCount}組できています。どちらかを3枚に増やすとフルハウスになります。`;
      }
      if (info.maxSameRank >= 4) {
        return '同じ数字が4枚入っています。3枚に減らして、別の数字のペアを足しましょう。';
      }
      return '3枚組はできています。残り2枚を同じ数字のペアにしましょう。';

    case 'flush':
      return `同じマークが今${info.maxSameSuit}枚です。あと${5 - info.maxSameSuit}枚、同じマークをそろえましょう。`;

    case 'straight':
      if (info.isStraight) {
        return '連番はできていますが、5枚とも同じマークになっているようです。マークを1枚だけ変えましょう。';
      }
      return `連番が今${info.longestRun}枚つながっています。あと${Math.max(1, 5 - info.longestRun)}枚つなげましょう（A は 1 としても使えます）。`;

    case 'straight-flush':
      if (info.maxSameSuit < 5) {
        return `まず5枚を同じマークにそろえます（今は最大${info.maxSameSuit}枚）。そのうえで数字を連番にしましょう。`;
      }
      return `マークはそろっています。数字が今${info.longestRun}枚つながっているので、連番になるよう入れ替えましょう。`;

    case 'royal-flush':
      if (info.maxSameSuit < 5) {
        return `同じマークの 10・J・Q・K・A が必要です（今そろっているマークは最大${info.maxSameSuit}枚）。`;
      }
      return 'マークはそろっています。数字を 10・J・Q・K・A の5枚にしましょう。';

    case 'high-card':
      return 'ペア・フラッシュ・ストレートのどれにもならない5枚を選びましょう。';

    default:
      return `${targetName}の条件をもう一度確認してみましょう。`;
  }
}

/** 「なぜその役なのか」の説明（クイズの解説に使う） */
export function explainEvaluation(cards: readonly Card[]): string {
  if (cards.length !== 5) return '';
  const evaluation = evaluateHand(cards);
  const groups = groupByRank(cards);
  const suitCounts = countBySuit(cards);
  const flushSuit = [...suitCounts.entries()].find(([, count]) => count === 5)?.[0];
  const straightHigh = findStraightHigh(cards.map((card) => card.rank));

  const label = (rank: number) => RANK_LABEL[rank as keyof typeof RANK_LABEL];

  switch (evaluation.handId) {
    case 'royal-flush':
      return `${flushSuit ? SUIT_META[flushSuit].labelJa : ''}の 10・J・Q・K・A がそろっています。`;
    case 'straight-flush':
      return `${flushSuit ? SUIT_META[flushSuit].labelJa : ''}だけで、${
        straightHigh === 5 ? 'A・2・3・4・5' : `${label(straightHigh! - 4)} から ${label(straightHigh!)}`
      }の連番になっています。`;
    case 'four-of-a-kind':
      return `${label(groups[0].rank)} が4枚そろっています。`;
    case 'full-house':
      return `${label(groups[0].rank)} が3枚と ${label(groups[1].rank)} が2枚で「3枚＋2枚」の形です。`;
    case 'flush':
      return `5枚すべてが${flushSuit ? SUIT_META[flushSuit].labelJa : '同じマーク'}です（数字は連番ではありません）。`;
    case 'straight':
      return straightHigh === 5
        ? 'A・2・3・4・5 の連番です（A は 1 としても使えます）。マークはそろっていません。'
        : `${label(straightHigh! - 4)} から ${label(straightHigh!)} までの連番です。マークはそろっていません。`;
    case 'three-of-a-kind':
      return `${label(groups[0].rank)} が3枚。残りの2枚はペアになっていません。`;
    case 'two-pair':
      return `${label(groups[0].rank)} のペアと ${label(groups[1].rank)} のペアで2組できています。`;
    case 'one-pair':
      return `${label(groups[0].rank)} が2枚。ほかにペアはありません。`;
    case 'high-card':
      return `ペアもフラッシュもストレートもないので、いちばん大きい ${label(groups[0].rank)} が主役の「役なし」です。`;
    default:
      return '';
  }
}

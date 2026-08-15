import { HANDS_BY_ID } from '@/data/hands';
import { RANK_LABEL, createCard, pickOne, sampleMany } from './cards';
import { compareEvaluations, evaluateHand, groupByRank } from './evaluator';
import { DIFFICULTY_POOLS, generateHandOfType } from './generator';
import { Card, Difficulty, HandEvaluation, HandId, RANKS, Rank, SUITS, Suit } from './types';

/**
 * 「VSカード」モードの問題生成。
 * 役の判定・比較は既存の evaluateHand / compareEvaluations をそのまま使う。
 */

export type CompareAnswer = 'A' | 'B' | 'tie';

export interface ComparePuzzle {
  id: string;
  handA: Card[];
  handB: Card[];
  evaluationA: HandEvaluation;
  evaluationB: HandEvaluation;
  answer: CompareAnswer;
}

/** 引き分け（同じ数字構成）を作れる役。3枚以上同じ数字を使う役はスートが足りない */
const TIE_CAPABLE: HandId[] = [
  'high-card',
  'one-pair',
  'two-pair',
  'straight',
  'flush',
  'straight-flush',
  'royal-flush',
];

/** キッカー勝負を作れる役（役の中心が同じまま、余りの1枚だけ変えられる） */
const KICKER_CAPABLE: HandId[] = ['high-card', 'one-pair', 'two-pair', 'flush'];

type PlanKind = 'different-category' | 'same-category' | 'kicker' | 'tie';

let idCounter = 0;

function createId(): string {
  idCounter += 1;
  return `compare-${idCounter}-${Math.random().toString(36).slice(2, 7)}`;
}

function hasOverlap(handA: readonly Card[], handB: readonly Card[]): boolean {
  const ids = new Set(handA.map((card) => card.id));
  return handB.some((card) => ids.has(card.id));
}

/**
 * 同じ数字構成のまま、別のスートで組み直した手を作る。
 * replaceLowestKicker を指定すると、余りの1枚（キッカー）だけ別の数字に差し替える。
 * 同じ数字を3枚以上使う役（スリーカード等）は作れないので null を返す。
 */
function buildResuitedVariant(
  cards: readonly Card[],
  options: { replaceLowestKicker?: boolean } = {},
): Card[] | null {
  const groups = groupByRank(cards);
  if (groups.some((group) => group.count > 2)) return null;

  let targetRanks: Rank[] = cards.map((card) => card.rank);

  if (options.replaceLowestKicker) {
    const singles = groups.filter((group) => group.count === 1);
    if (singles.length === 0) return null;
    const lowest = singles[singles.length - 1].rank;
    const usedRanks = new Set<Rank>(cards.map((card) => card.rank));
    const candidates = RANKS.filter((rank) => !usedRanks.has(rank));
    if (candidates.length === 0) return null;
    const replacement = pickOne(candidates);
    targetRanks = targetRanks.map((rank) => (rank === lowest ? replacement : rank));
  }

  const isFlushHand = cards.every((card) => card.suit === cards[0].suit);

  if (isFlushHand) {
    const suit = pickOne(SUITS.filter((candidate) => candidate !== cards[0].suit));
    return targetRanks.map((rank) => createCard(rank, suit));
  }

  const usedSuitsByRank = new Map<Rank, Set<Suit>>();
  for (const card of cards) {
    const used = usedSuitsByRank.get(card.rank) ?? new Set<Suit>();
    used.add(card.suit);
    usedSuitsByRank.set(card.rank, used);
  }

  const variant: Card[] = [];
  for (const rank of targetRanks) {
    const used = new Set<Suit>(usedSuitsByRank.get(rank) ?? []);
    for (const card of variant) {
      if (card.rank === rank) used.add(card.suit);
    }
    const available = SUITS.filter((suit) => !used.has(suit));
    if (available.length === 0) return null;
    variant.push(createCard(rank, pickOne(available)));
  }

  return variant.length === 5 ? variant : null;
}

function pickPlan(difficulty: Difficulty): PlanKind {
  if (difficulty === 'beginner') return 'different-category';
  if (difficulty === 'intermediate') {
    return Math.random() < 0.5 ? 'different-category' : 'same-category';
  }
  const roll = Math.random();
  if (roll < 0.4) return 'kicker';
  if (roll < 0.6) return 'tie';
  if (roll < 0.8) return 'same-category';
  return 'different-category';
}

function buildPair(plan: PlanKind, difficulty: Difficulty): [Card[], Card[]] | null {
  const pool = DIFFICULTY_POOLS[difficulty];

  if (plan === 'different-category') {
    const [first, second] = sampleMany(pool, 2);
    return [generateHandOfType(first), generateHandOfType(second)];
  }

  if (plan === 'same-category') {
    const handId = pickOne(pool);
    return [generateHandOfType(handId), generateHandOfType(handId)];
  }

  const source = plan === 'tie' ? TIE_CAPABLE : KICKER_CAPABLE;
  const candidates = source.filter((handId) => pool.includes(handId));
  const handId = pickOne(candidates.length > 0 ? candidates : source);
  const handA = generateHandOfType(handId);
  const handB = buildResuitedVariant(handA, { replaceLowestKicker: plan === 'kicker' });
  return handB ? [handA, handB] : null;
}

function toPuzzle(handA: Card[], handB: Card[]): ComparePuzzle {
  const evaluationA = evaluateHand(handA);
  const evaluationB = evaluateHand(handB);
  const diff = compareEvaluations(evaluationA, evaluationB);
  return {
    id: createId(),
    handA,
    handB,
    evaluationA,
    evaluationB,
    answer: diff > 0 ? 'A' : diff < 0 ? 'B' : 'tie',
  };
}

/**
 * 難易度に応じた比較問題を作る。
 * 2つの手でカードが重複しないこと、答えが判定結果と必ず一致することを保証する。
 */
export function generateComparePuzzle(difficulty: Difficulty): ComparePuzzle {
  for (let attempt = 0; attempt < 300; attempt += 1) {
    const plan = pickPlan(difficulty);
    const pair = buildPair(plan, difficulty);
    if (!pair) continue;

    const [first, second] = pair;
    if (hasOverlap(first, second)) continue;

    // どちらが強いかが偏らないよう、A と B をランダムに入れ替える
    const [handA, handB] = Math.random() < 0.5 ? [first, second] : [second, first];
    const puzzle = toPuzzle(handA, handB);
    const sameCategory = puzzle.evaluationA.handId === puzzle.evaluationB.handId;

    if (plan === 'tie' && puzzle.answer !== 'tie') continue;
    if (plan !== 'tie' && puzzle.answer === 'tie') continue;
    if ((plan === 'same-category' || plan === 'kicker') && !sameCategory) continue;
    if (plan === 'different-category' && sameCategory) continue;

    if (plan === 'kicker') {
      // 役の中心が同じで、キッカーだけで勝負が決まる問題にする
      if (puzzle.evaluationA.tiebreakers[0] !== puzzle.evaluationB.tiebreakers[0]) continue;
    }

    if (difficulty === 'intermediate' && plan === 'same-category') {
      // 中級は「見れば分かる」差にする
      const gap = Math.abs(puzzle.evaluationA.tiebreakers[0] - puzzle.evaluationB.tiebreakers[0]);
      if (gap < 2) continue;
    }

    return puzzle;
  }

  // 保険：必ず成立する異なる役同士の比較
  return toPuzzle(generateHandOfType('flush'), generateHandOfType('one-pair'));
}

export function generateComparePuzzleSet(difficulty: Difficulty, count: number): ComparePuzzle[] {
  return Array.from({ length: count }, () => generateComparePuzzle(difficulty));
}

/** 回答の表示ラベル */
export const COMPARE_ANSWER_LABEL: Record<CompareAnswer, string> = {
  A: 'Aが強い',
  B: 'Bが強い',
  tie: '引き分け',
};

/** 結果画面の見出し（「Aの勝ちです」など） */
export function compareResultHeadline(answer: CompareAnswer): string {
  if (answer === 'tie') return '引き分けです';
  return `${answer}の勝ちです`;
}

/** なぜその結果になるのかを1〜2文で説明する */
export function describeComparison(puzzle: ComparePuzzle): string {
  const { evaluationA, evaluationB, answer } = puzzle;
  const nameA = HANDS_BY_ID[evaluationA.handId].nameJa;
  const nameB = HANDS_BY_ID[evaluationB.handId].nameJa;

  if (evaluationA.handId !== evaluationB.handId) {
    const winnerName = answer === 'A' ? nameA : nameB;
    const loserName = answer === 'A' ? nameB : nameA;
    return `${winnerName}は${loserName}より強い役です。`;
  }

  if (answer === 'tie') {
    return `どちらも${nameA}で、役を作る数字がまったく同じです。マークによる強さの違いはないので引き分けです。`;
  }

  const index = evaluationA.tiebreakers.findIndex(
    (value, position) => value !== (evaluationB.tiebreakers[position] ?? 0),
  );
  const valueA = evaluationA.tiebreakers[index] ?? 0;
  const valueB = evaluationB.tiebreakers[index] ?? 0;
  const higher = RANK_LABEL[Math.max(valueA, valueB) as Rank];
  const lower = RANK_LABEL[Math.min(valueA, valueB) as Rank];

  if (index <= 0) {
    return `どちらも${nameA}ですが、役の中心が ${higher} と ${lower} なので${answer}が強いです。`;
  }
  return `どちらも${nameA}で途中まで同じです。決め手は残りのカード（キッカー）で、${higher} が ${lower} より大きいので${answer}が強いです。`;
}

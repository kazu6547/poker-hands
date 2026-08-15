import { HANDS_BY_ID } from '@/data/hands';
import { RANK_LABEL, SUIT_META, createCard, createDeck, pickOne, sampleMany, shuffle } from './cards';
import { HAND_STRENGTH, compareEvaluations, evaluateHand } from './evaluator';
import { Card, Difficulty, HandEvaluation, Rank, SUITS } from './types';

/**
 * 「最強の5枚を選ぶ」モード。
 * 7枚から作れる 21 通りの5枚をすべて評価し、いちばん強い組み合わせを求める。
 */

export interface BestFiveResult {
  /** いちばん強い5枚 */
  cards: Card[];
  evaluation: HandEvaluation;
  /** 同じ強さになる5枚が他にないか（初心者向けに一意の問題だけ出題する） */
  isUnique: boolean;
  /** 同じ強さの組み合わせすべて（将来、複数正解に対応するための情報） */
  tiedCombinations: Card[][];
}

export interface BestFivePuzzle {
  id: string;
  /** 手札2枚 */
  holeCards: Card[];
  /** 場の5枚 */
  boardCards: Card[];
  /** 7枚すべて（表示・選択用） */
  cards: Card[];
  best: BestFiveResult;
}

let idCounter = 0;

function createId(): string {
  idCounter += 1;
  return `best-five-${idCounter}-${Math.random().toString(36).slice(2, 7)}`;
}

/** items から size 個を選ぶ組み合わせをすべて返す */
export function combinations<T>(items: readonly T[], size: number): T[][] {
  const result: T[][] = [];
  const current: T[] = [];

  const walk = (start: number) => {
    if (current.length === size) {
      result.push([...current]);
      return;
    }
    for (let index = start; index < items.length; index += 1) {
      current.push(items[index]);
      walk(index + 1);
      current.pop();
    }
  };

  walk(0);
  return result;
}

/** カードの並び順を無視して、同じ5枚かどうかを判定する */
export function isSameCardSet(a: readonly Card[], b: readonly Card[]): boolean {
  if (a.length !== b.length) return false;
  const ids = new Set(a.map((card) => card.id));
  return b.every((card) => ids.has(card.id));
}

/** 手札の中からいちばん強い5枚を求める */
export function findBestFive(cards: readonly Card[]): BestFiveResult {
  if (cards.length < 5) {
    throw new Error('最強の5枚を求めるには5枚以上のカードが必要です');
  }

  const combos = combinations(cards, 5);
  const evaluations = combos.map((combo) => evaluateHand(combo));

  let bestIndex = 0;
  for (let index = 1; index < evaluations.length; index += 1) {
    if (compareEvaluations(evaluations[index], evaluations[bestIndex]) > 0) {
      bestIndex = index;
    }
  }

  const tiedCombinations = combos.filter(
    (_, index) => compareEvaluations(evaluations[index], evaluations[bestIndex]) === 0,
  );

  return {
    cards: combos[bestIndex],
    evaluation: evaluations[bestIndex],
    isUnique: tiedCombinations.length === 1,
    tiedCombinations,
  };
}

/** 選んだ5枚が「最強の5枚」と同じ強さかどうか（複数正解にも対応できる形で判定する） */
export function isBestFiveSelection(selected: readonly Card[], best: BestFiveResult): boolean {
  if (selected.length !== 5) return false;
  if (isSameCardSet(selected, best.cards)) return true;
  return compareEvaluations(evaluateHand(selected), best.evaluation) === 0;
}

/* ------------------------------------------------------------------ */
/* 出題                                                                */
/* ------------------------------------------------------------------ */

/** A・2・3・4・5 のストレート（ホイール）を含む7枚を作る */
function dealWheelSeeded(): Card[] {
  const wheelRanks: Rank[] = [14, 2, 3, 4, 5];
  const wheel = wheelRanks.map((rank, index) => createCard(rank, SUITS[index % SUITS.length]));
  const used = new Set(wheel.map((card) => card.id));
  const rest = sampleMany(
    createDeck().filter((card) => !used.has(card.id)),
    2,
  );
  return shuffle([...wheel, ...rest]);
}

function meetsDifficulty(
  difficulty: Difficulty,
  cards: Card[],
  best: BestFiveResult,
  holeUsed: number,
  holeTarget: number,
): boolean {
  const strength = best.evaluation.strength;

  if (difficulty === 'beginner') {
    // 目で見て分かる強い役（スリーカード以上）に限定する
    return strength >= HAND_STRENGTH['three-of-a-kind'];
  }

  if (difficulty === 'intermediate') {
    if (strength < HAND_STRENGTH['one-pair']) return false;
    // 手札を2枚使う／1枚だけ使う／まったく使わない、を順番に出題する
    return holeUsed === holeTarget;
  }

  // 上級：役の候補が競り合っている問題にする
  if (strength < HAND_STRENGTH['two-pair']) return false;

  const evaluations = combinations(cards, 5).map((combo) => evaluateHand(combo));
  const sorted = [...evaluations].sort((a, b) => compareEvaluations(b, a));
  const runnerUp = sorted.find((evaluation) => compareEvaluations(evaluation, best.evaluation) !== 0);
  if (!runnerUp) return false;

  // キッカーで決まる、または別カテゴリの役と競合している
  const decidedByKicker =
    runnerUp.handId === best.evaluation.handId &&
    runnerUp.tiebreakers[0] === best.evaluation.tiebreakers[0];
  const categories = new Set(evaluations.map((evaluation) => evaluation.handId));
  return decidedByKicker || categories.size >= 4;
}

/**
 * 必ず一意の最強5枚が存在する問題を作る。
 * 7枚は1組のデッキから配るので、カードが重複することはない。
 */
export function generateBestFivePuzzle(difficulty: Difficulty): BestFivePuzzle {
  const holeTarget = pickOne([2, 1, 0]);

  for (let attempt = 0; attempt < 600; attempt += 1) {
    const useWheelSeed = difficulty === 'advanced' && attempt % 7 === 0;
    const cards = useWheelSeed ? dealWheelSeeded() : sampleMany(createDeck(), 7);
    const best = findBestFive(cards);
    if (!best.isUnique) continue;

    const holeCards = cards.slice(0, 2);
    const bestIds = new Set(best.cards.map((card) => card.id));
    const holeUsed = holeCards.filter((card) => bestIds.has(card.id)).length;

    if (useWheelSeed) {
      const isWheelStraight =
        best.evaluation.handId === 'straight' && best.evaluation.tiebreakers[0] === 5;
      if (!isWheelStraight) continue;
    } else if (!meetsDifficulty(difficulty, cards, best, holeUsed, holeTarget)) {
      continue;
    }

    return {
      id: createId(),
      holeCards,
      boardCards: cards.slice(2, 7),
      cards,
      best,
    };
  }

  // 保険：条件を緩めて、一意の最強5枚がある問題を返す
  for (let attempt = 0; attempt < 200; attempt += 1) {
    const cards = sampleMany(createDeck(), 7);
    const best = findBestFive(cards);
    if (!best.isUnique) continue;
    return { id: createId(), holeCards: cards.slice(0, 2), boardCards: cards.slice(2, 7), cards, best };
  }

  const cards = sampleMany(createDeck(), 7);
  return {
    id: createId(),
    holeCards: cards.slice(0, 2),
    boardCards: cards.slice(2, 7),
    cards,
    best: findBestFive(cards),
  };
}

/* ------------------------------------------------------------------ */
/* 解説                                                                */
/* ------------------------------------------------------------------ */

export function cardShortLabel(card: Card): string {
  return `${SUIT_META[card.suit].symbol}${RANK_LABEL[card.rank]}`;
}

/** 選んだ5枚と正解の5枚の差を、初心者向けの短い文で説明する */
export function describeBestFiveMistake(selected: readonly Card[], best: BestFiveResult): string {
  const bestIds = new Set(best.cards.map((card) => card.id));
  const selectedIds = new Set(selected.map((card) => card.id));

  const missing = best.cards.filter((card) => !selectedIds.has(card.id));
  const extra = selected.filter((card) => !bestIds.has(card.id));
  const bestName = HANDS_BY_ID[best.evaluation.handId].nameJa;

  if (missing.length === 0 || extra.length === 0) {
    return `7枚の中でいちばん強いのは${bestName}です。`;
  }

  const extraLabel = extra.map(cardShortLabel).join('・');
  const missingLabel = missing.map(cardShortLabel).join('・');

  // 同じ役ができている場合は、キッカー（余りのカード）の差だと伝える
  if (selected.length === 5 && evaluateHand(selected).handId === best.evaluation.handId) {
    return `同じ${bestName}でも、${extraLabel} ではなく ${missingLabel} を残すほうが強くなります（キッカー勝負）。`;
  }

  return `7枚の中では、${extraLabel} ではなく ${missingLabel} を選ぶと${bestName}になります。`;
}

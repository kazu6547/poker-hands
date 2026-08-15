import { HANDS_BY_ID } from '@/data/hands';
import { createCard, createDeck, parseCards, pickOne, sampleMany, shuffle } from './cards';
import { evaluateHand, findStraightHigh } from './evaluator';
import {
  BuildPuzzle,
  Card,
  Difficulty,
  HAND_IDS,
  HandId,
  QuizQuestion,
  Rank,
  RANKS,
  Suit,
  SUITS,
} from './types';

/**
 * 問題生成。
 * 「役を先に決める → その役になる5枚を組み立てる → 判定器で検証する」という流れなので、
 * 出題の偏りが小さく、生成ミスによる不正解問題が起きない。
 */

/* ------------------------------------------------------------------ */
/* 共通ヘルパー                                                         */
/* ------------------------------------------------------------------ */

let idCounter = 0;

function createId(prefix: string): string {
  idCounter += 1;
  return `${prefix}-${idCounter}-${Math.random().toString(36).slice(2, 7)}`;
}

/** 5枚すべてが同じマークにならないようにマークを割り当てる */
function randomSuitsNotAllSame(count: number): Suit[] {
  const suits: Suit[] = Array.from({ length: count }, () => pickOne(SUITS));
  if (suits.every((suit) => suit === suits[0])) {
    const index = Math.floor(Math.random() * count);
    const others = SUITS.filter((suit) => suit !== suits[0]);
    suits[index] = pickOne(others);
  }
  return suits;
}

/** 重複しない数字を count 個選ぶ */
function distinctRanks(count: number, exclude: Rank[] = []): Rank[] {
  const pool = RANKS.filter((rank) => !exclude.includes(rank));
  return sampleMany(pool, count);
}

/** ストレートの「いちばん上の数字」候補（5 は A-2-3-4-5 を表す） */
const STRAIGHT_HIGHS: Rank[] = [5, 6, 7, 8, 9, 10, 11, 12, 13, 14];

function straightRanks(high: Rank): Rank[] {
  if (high === 5) return [5, 4, 3, 2, 14];
  return [high, (high - 1) as Rank, (high - 2) as Rank, (high - 3) as Rank, (high - 4) as Rank];
}

function isStraightRankSet(ranks: Rank[]): boolean {
  return findStraightHigh(ranks) !== null;
}

/* ------------------------------------------------------------------ */
/* 役ごとのカード生成                                                   */
/* ------------------------------------------------------------------ */

type HandBuilder = () => Card[];

const buildHighCard: HandBuilder = () => {
  let ranks = distinctRanks(5);
  let guard = 0;
  while (isStraightRankSet(ranks) && guard < 50) {
    ranks = distinctRanks(5);
    guard += 1;
  }
  const suits = randomSuitsNotAllSame(5);
  return ranks.map((rank, index) => createCard(rank, suits[index]));
};

const buildOnePair: HandBuilder = () => {
  const pairRank = pickOne(RANKS);
  const pairSuits = sampleMany(SUITS, 2);
  const kickers = distinctRanks(3, [pairRank]);
  return [
    createCard(pairRank, pairSuits[0]),
    createCard(pairRank, pairSuits[1]),
    ...kickers.map((rank) => createCard(rank, pickOne(SUITS))),
  ];
};

const buildTwoPair: HandBuilder = () => {
  const [firstRank, secondRank] = sampleMany(RANKS, 2);
  const firstSuits = sampleMany(SUITS, 2);
  const secondSuits = sampleMany(SUITS, 2);
  const [kicker] = distinctRanks(1, [firstRank, secondRank]);
  return [
    createCard(firstRank, firstSuits[0]),
    createCard(firstRank, firstSuits[1]),
    createCard(secondRank, secondSuits[0]),
    createCard(secondRank, secondSuits[1]),
    createCard(kicker, pickOne(SUITS)),
  ];
};

const buildThreeOfAKind: HandBuilder = () => {
  const tripleRank = pickOne(RANKS);
  const tripleSuits = sampleMany(SUITS, 3);
  const kickers = distinctRanks(2, [tripleRank]);
  return [
    ...tripleSuits.map((suit) => createCard(tripleRank, suit)),
    ...kickers.map((rank) => createCard(rank, pickOne(SUITS))),
  ];
};

const buildFullHouse: HandBuilder = () => {
  const [tripleRank, pairRank] = sampleMany(RANKS, 2);
  const tripleSuits = sampleMany(SUITS, 3);
  const pairSuits = sampleMany(SUITS, 2);
  return [
    ...tripleSuits.map((suit) => createCard(tripleRank, suit)),
    ...pairSuits.map((suit) => createCard(pairRank, suit)),
  ];
};

const buildFourOfAKind: HandBuilder = () => {
  const quadRank = pickOne(RANKS);
  const [kicker] = distinctRanks(1, [quadRank]);
  return [
    ...SUITS.map((suit) => createCard(quadRank, suit)),
    createCard(kicker, pickOne(SUITS)),
  ];
};

const buildStraight: HandBuilder = () => {
  const high = pickOne(STRAIGHT_HIGHS);
  const ranks = straightRanks(high);
  const suits = randomSuitsNotAllSame(5);
  return ranks.map((rank, index) => createCard(rank, suits[index]));
};

const buildFlush: HandBuilder = () => {
  const suit = pickOne(SUITS);
  let ranks = distinctRanks(5);
  let guard = 0;
  while (isStraightRankSet(ranks) && guard < 50) {
    ranks = distinctRanks(5);
    guard += 1;
  }
  return ranks.map((rank) => createCard(rank, suit));
};

const buildStraightFlush: HandBuilder = () => {
  const suit = pickOne(SUITS);
  // 14（10-J-Q-K-A）はロイヤルフラッシュになるので除外する
  const high = pickOne(STRAIGHT_HIGHS.filter((rank) => rank !== 14));
  return straightRanks(high).map((rank) => createCard(rank, suit));
};

const buildRoyalFlush: HandBuilder = () => {
  const suit = pickOne(SUITS);
  return ([10, 11, 12, 13, 14] as Rank[]).map((rank) => createCard(rank, suit));
};

const HAND_BUILDERS: Record<HandId, HandBuilder> = {
  'royal-flush': buildRoyalFlush,
  'straight-flush': buildStraightFlush,
  'four-of-a-kind': buildFourOfAKind,
  'full-house': buildFullHouse,
  flush: buildFlush,
  straight: buildStraight,
  'three-of-a-kind': buildThreeOfAKind,
  'two-pair': buildTwoPair,
  'one-pair': buildOnePair,
  'high-card': buildHighCard,
};

/**
 * 指定した役になる5枚を生成する。
 * 生成後に必ず判定器へ通し、意図した役になっているかを検証する。
 */
export function generateHandOfType(handId: HandId): Card[] {
  for (let attempt = 0; attempt < 80; attempt += 1) {
    const cards = HAND_BUILDERS[handId]();
    if (cards.length === 5 && evaluateHand(cards).handId === handId) {
      return shuffle(cards);
    }
  }
  // 保険：データファイルに定義済みの正しい例を使う
  return shuffle(parseCards(HANDS_BY_ID[handId].example));
}

/* ------------------------------------------------------------------ */
/* 難易度                                                              */
/* ------------------------------------------------------------------ */

export const DIFFICULTY_POOLS: Record<Difficulty, HandId[]> = {
  beginner: ['high-card', 'one-pair', 'two-pair', 'three-of-a-kind', 'straight', 'flush'],
  intermediate: [
    'high-card',
    'one-pair',
    'two-pair',
    'three-of-a-kind',
    'straight',
    'flush',
    'full-house',
    'four-of-a-kind',
    'straight-flush',
  ],
  advanced: [...HAND_IDS],
};

export const DIFFICULTY_LABELS: Record<Difficulty, { name: string; description: string }> = {
  beginner: {
    name: '初級',
    description: 'ワンペア・ツーペア・スリーカード・ストレート・フラッシュ・ハイカード',
  },
  intermediate: {
    name: '中級',
    description: '初級の役に加えて、フルハウス・フォーカード・ストレートフラッシュ',
  },
  advanced: {
    name: '上級',
    description: '全10役。見分けにくい役を多めに出題',
  },
};

/** 上級では紛らわしい役の出題確率を上げる */
const DIFFICULTY_WEIGHTS: Record<Difficulty, Partial<Record<HandId, number>>> = {
  beginner: {},
  intermediate: {
    'full-house': 1.4,
    'four-of-a-kind': 1.2,
    'straight-flush': 1.2,
  },
  advanced: {
    'royal-flush': 1.2,
    'straight-flush': 1.5,
    'four-of-a-kind': 1.2,
    'full-house': 1.5,
    flush: 1.4,
    straight: 1.4,
    'three-of-a-kind': 1.2,
    'two-pair': 1.2,
    'one-pair': 0.8,
    'high-card': 0.8,
  },
};

function weightedPick(pool: HandId[], weights: Partial<Record<HandId, number>>): HandId {
  const entries = pool.map((handId) => ({ handId, weight: weights[handId] ?? 1 }));
  const total = entries.reduce((sum, entry) => sum + entry.weight, 0);
  let threshold = Math.random() * total;
  for (const entry of entries) {
    threshold -= entry.weight;
    if (threshold <= 0) return entry.handId;
  }
  return entries[entries.length - 1].handId;
}

/* ------------------------------------------------------------------ */
/* 「役を当てる」モード                                                 */
/* ------------------------------------------------------------------ */

/** 4択の選択肢を作る（間違えやすい役を優先的に混ぜる） */
function buildOptions(answerId: HandId, pool: HandId[], difficulty: Difficulty): HandId[] {
  const confusionCount = difficulty === 'beginner' ? 1 : difficulty === 'intermediate' ? 2 : 3;
  const confusions = HANDS_BY_ID[answerId].confusions
    .map((confusion) => confusion.handId)
    .filter((handId) => handId !== answerId && pool.includes(handId));

  const options = new Set<HandId>([answerId]);
  for (const handId of shuffle(confusions).slice(0, confusionCount)) {
    options.add(handId);
  }
  for (const handId of shuffle(pool)) {
    if (options.size >= 4) break;
    options.add(handId);
  }
  // 保険：プールが小さい場合は全役から補う
  for (const handId of shuffle([...HAND_IDS])) {
    if (options.size >= 4) break;
    options.add(handId);
  }
  return shuffle([...options]);
}

export interface QuizQuestionOptions {
  /** この役で出題する（復習用） */
  forceHandId?: HandId;
  /** 直前と同じ役を避ける */
  avoid?: HandId[];
}

export function generateQuizQuestion(
  difficulty: Difficulty,
  options: QuizQuestionOptions = {},
): QuizQuestion {
  const pool = DIFFICULTY_POOLS[difficulty];
  const avoid = options.avoid ?? [];
  const candidates = pool.filter((handId) => !avoid.includes(handId));
  const answerId =
    options.forceHandId ??
    weightedPick(candidates.length > 0 ? candidates : pool, DIFFICULTY_WEIGHTS[difficulty]);

  return {
    id: createId('quiz'),
    cards: generateHandOfType(answerId),
    answerId,
    options: buildOptions(answerId, pool, difficulty),
  };
}

export function generateQuizSet(difficulty: Difficulty, count: number): QuizQuestion[] {
  const questions: QuizQuestion[] = [];
  let previous: HandId | null = null;
  for (let index = 0; index < count; index += 1) {
    const question = generateQuizQuestion(difficulty, {
      avoid: previous ? [previous] : [],
    });
    questions.push(question);
    previous = question.answerId;
  }
  return questions;
}

/* ------------------------------------------------------------------ */
/* 「役を作る」モード                                                   */
/* ------------------------------------------------------------------ */

/** お題になる役（ハイカードは「作る」お題として不自然なので除外） */
export const BUILD_TARGETS: HandId[] = HAND_IDS.filter((handId) => handId !== 'high-card');

function dominantSuit(cards: readonly Card[]): Suit {
  const counter = new Map<Suit, number>();
  for (const card of cards) {
    counter.set(card.suit, (counter.get(card.suit) ?? 0) + 1);
  }
  let best: Suit = cards[0].suit;
  let bestCount = 0;
  counter.forEach((count, suit) => {
    if (count > bestCount) {
      best = suit;
      bestCount = count;
    }
  });
  return best;
}

/** 重み付きで重複なく取り出す */
function weightedSample<T>(items: readonly T[], count: number, weightOf: (item: T) => number): T[] {
  const pool = [...items];
  const picked: T[] = [];
  for (let index = 0; index < count && pool.length > 0; index += 1) {
    const weights = pool.map(weightOf);
    const total = weights.reduce((sum, weight) => sum + weight, 0);
    let threshold = Math.random() * total;
    let chosenIndex = pool.length - 1;
    for (let candidate = 0; candidate < pool.length; candidate += 1) {
      threshold -= weights[candidate];
      if (threshold <= 0) {
        chosenIndex = candidate;
        break;
      }
    }
    picked.push(pool[chosenIndex]);
    pool.splice(chosenIndex, 1);
  }
  return picked;
}

/**
 * 必ず正解できる「役を作る」問題を生成する。
 * 先に正解の5枚を作り、そこへ紛らわしいカードを足して場を構成する。
 */
export function generateBuildPuzzle(previousTarget?: HandId | null): BuildPuzzle {
  const candidates = BUILD_TARGETS.filter((handId) => handId !== previousTarget);
  const targetHandId = pickOne(candidates.length > 0 ? candidates : BUILD_TARGETS);

  const solution = generateHandOfType(targetHandId);
  const solutionIds = solution.map((card) => card.id);
  const solutionIdSet = new Set(solutionIds);
  const solutionRanks = new Set(solution.map((card) => card.rank));
  const mainSuit = dominantSuit(solution);

  const boardSize = pickOne([7, 8, 8, 9]);
  const remaining = createDeck().filter((card) => !solutionIdSet.has(card.id));
  const extras = weightedSample(remaining, boardSize - solution.length, (card) => {
    let weight = 1;
    if (solutionRanks.has(card.rank)) weight += 1.6; // 数字がかぶる紛らわしいカード
    if (card.suit === mainSuit) weight += 1.1; // マークがかぶる紛らわしいカード
    return weight;
  });

  return {
    id: createId('build'),
    targetHandId,
    board: shuffle([...solution, ...extras]),
    solutionIds,
  };
}

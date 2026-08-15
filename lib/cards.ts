import { Card, Rank, RANKS, Suit, SUITS } from './types';

/* ------------------------------------------------------------------ */
/* 表示用メタデータ                                                     */
/* ------------------------------------------------------------------ */

export interface SuitMeta {
  symbol: string;
  labelJa: string;
  color: 'red' | 'black';
  /** カードIDや短縮表記に使う1文字 */
  initial: string;
}

export const SUIT_META: Record<Suit, SuitMeta> = {
  spades: { symbol: '♠', labelJa: 'スペード', color: 'black', initial: 's' },
  hearts: { symbol: '♥', labelJa: 'ハート', color: 'red', initial: 'h' },
  diamonds: { symbol: '♦', labelJa: 'ダイヤ', color: 'red', initial: 'd' },
  clubs: { symbol: '♣', labelJa: 'クラブ', color: 'black', initial: 'c' },
};

export const RANK_LABEL: Record<Rank, string> = {
  2: '2',
  3: '3',
  4: '4',
  5: '5',
  6: '6',
  7: '7',
  8: '8',
  9: '9',
  10: '10',
  11: 'J',
  12: 'Q',
  13: 'K',
  14: 'A',
};

export function rankLabel(rank: Rank): string {
  return RANK_LABEL[rank];
}

/** スクリーンリーダー向けのラベル（例: 「スペードのA」） */
export function cardAriaLabel(card: Card): string {
  return `${SUIT_META[card.suit].labelJa}の${RANK_LABEL[card.rank]}`;
}

/* ------------------------------------------------------------------ */
/* 生成・シャッフル                                                     */
/* ------------------------------------------------------------------ */

export function createCard(rank: Rank, suit: Suit): Card {
  return { id: `${rank}${SUIT_META[suit].initial}`, rank, suit };
}

/** 52枚のデッキを作る（重複なし） */
export function createDeck(): Card[] {
  const deck: Card[] = [];
  for (const suit of SUITS) {
    for (const rank of RANKS) {
      deck.push(createCard(rank, suit));
    }
  }
  return deck;
}

/** Fisher-Yates シャッフル（元配列は変更しない） */
export function shuffle<T>(items: readonly T[]): T[] {
  const result = [...items];
  for (let i = result.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    const tmp = result[i];
    result[i] = result[j];
    result[j] = tmp;
  }
  return result;
}

export function pickOne<T>(items: readonly T[]): T {
  return items[Math.floor(Math.random() * items.length)];
}

/** 重複なしで count 個取り出す */
export function sampleMany<T>(items: readonly T[], count: number): T[] {
  return shuffle(items).slice(0, count);
}

/* ------------------------------------------------------------------ */
/* 短縮表記のパース（データファイル用）                                  */
/* ------------------------------------------------------------------ */

const RANK_FROM_CHAR: Record<string, Rank> = {
  A: 14,
  K: 13,
  Q: 12,
  J: 11,
  T: 10,
  '10': 10,
  '9': 9,
  '8': 8,
  '7': 7,
  '6': 6,
  '5': 5,
  '4': 4,
  '3': 3,
  '2': 2,
};

const SUIT_FROM_CHAR: Record<string, Suit> = {
  S: 'spades',
  H: 'hearts',
  D: 'diamonds',
  C: 'clubs',
};

/** "AS" / "10S" / "TS" のような表記を Card に変換する */
export function parseCard(notation: string): Card {
  const token = notation.trim().toUpperCase();
  const suitChar = token.slice(-1);
  const rankChar = token.slice(0, -1);
  const suit = SUIT_FROM_CHAR[suitChar];
  const rank = RANK_FROM_CHAR[rankChar];
  if (!suit || !rank) {
    throw new Error(`カード表記を解釈できません: ${notation}`);
  }
  return createCard(rank, suit);
}

/** "AS KS QS JS TS" のようなスペース区切り表記を Card[] に変換する */
export function parseCards(notation: string): Card[] {
  return notation
    .split(/\s+/)
    .filter(Boolean)
    .map(parseCard);
}

/** 強い順（A → 2）に並べ替えたコピーを返す */
export function sortByRankDesc(cards: readonly Card[]): Card[] {
  return [...cards].sort((a, b) => b.rank - a.rank);
}

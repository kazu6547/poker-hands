/**
 * アプリ全体で使う型定義。
 * ここだけ読めばデータ構造が把握できることを目指している。
 */

/* ------------------------------------------------------------------ */
/* カード                                                              */
/* ------------------------------------------------------------------ */

export const SUITS = ['spades', 'hearts', 'diamonds', 'clubs'] as const;
export type Suit = (typeof SUITS)[number];

/** 2〜10 はそのまま、J=11 / Q=12 / K=13 / A=14 として扱う */
export type Rank = 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 | 12 | 13 | 14;

export const RANKS: Rank[] = [2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14];

export interface Card {
  /** デッキ内で一意なID（例: "14s" = スペードのA） */
  id: string;
  rank: Rank;
  suit: Suit;
}

/* ------------------------------------------------------------------ */
/* 役                                                                  */
/* ------------------------------------------------------------------ */

/** 強い順に並べた役ID */
export const HAND_IDS = [
  'royal-flush',
  'straight-flush',
  'four-of-a-kind',
  'full-house',
  'flush',
  'straight',
  'three-of-a-kind',
  'two-pair',
  'one-pair',
  'high-card',
] as const;

export type HandId = (typeof HAND_IDS)[number];

/** 間違えやすい役との違い */
export interface HandConfusion {
  handId: HandId;
  difference: string;
}

/** 役の学習用データ（data/hands.ts で定義） */
export interface HandInfo {
  id: HandId;
  /** 日本語名 */
  nameJa: string;
  /** 英語名 */
  nameEn: string;
  /** 強さの順位（1 が最強） */
  strengthRank: number;
  /** 短い説明 */
  shortDescription: string;
  /** 役の条件（ヒントでも使う） */
  condition: string;
  /** 正しいカード例（"AS KS QS JS TS" 形式） */
  example: string;
  /** 初心者向けの見分け方 */
  howToSpot: string;
  /**
   * 52枚から5枚を選ぶ 2,598,960 通りのうち、この役になる組み合わせの数。
   * ポーカーの標準的な理論値（本アプリの判定器で全通り検証済み）。
   */
  combinations: number;
  /** 間違えやすい役との違い */
  confusions: HandConfusion[];
}

/** 5枚のカードを判定した結果 */
export interface HandEvaluation {
  handId: HandId;
  /** 10（ロイヤルフラッシュ）〜 1（ハイカード）。大きいほど強い */
  strength: number;
  /** 同じ役同士を比較するための数値列（強い順） */
  tiebreakers: number[];
  /** 判定に使った5枚 */
  cards: Card[];
}

/* ------------------------------------------------------------------ */
/* 学習モード                                                          */
/* ------------------------------------------------------------------ */

export type Difficulty = 'beginner' | 'intermediate' | 'advanced';

/** 「役を当てる」モードの1問 */
export interface QuizQuestion {
  id: string;
  cards: Card[];
  answerId: HandId;
  /** 4択（answerId を必ず含む） */
  options: HandId[];
}

/** 「役を作る」モードの1問 */
export interface BuildPuzzle {
  id: string;
  targetHandId: HandId;
  /** 場に並ぶカード（7〜9枚） */
  board: Card[];
  /** 正解になる5枚のカードID（ヒント用。ほかの組み合わせも正解になり得る） */
  solutionIds: string[];
}

/* ------------------------------------------------------------------ */
/* 学習記録                                                            */
/* ------------------------------------------------------------------ */

export interface HandStat {
  /** 出題された回数 */
  attempts: number;
  /** 正解した回数 */
  correct: number;
}

/** ゲームモードごとの成績 */
export interface ModeStat {
  attempts: number;
  correct: number;
}

/** 成績を個別に記録するゲームモード */
export type StatModeId = 'compare' | 'bestFive';

/** localStorage に保存する学習記録（将来の拡張を考えて version を持つ） */
export interface ProgressData {
  version: number;
  /** 累計回答数 */
  totalAnswers: number;
  /** 累計正答数 */
  totalCorrect: number;
  /** 現在の連続正解数 */
  currentStreak: number;
  /** 最長連続正解数 */
  bestStreak: number;
  /** 役ごとの成績 */
  handStats: Record<HandId, HandStat>;
  /** 「役を作る」モードの挑戦回数 */
  buildAttempts: number;
  /** 「役を作る」モードの成功回数 */
  buildCleared: number;
  /** 「VSカード」モードの成績（version 2 で追加。保存キーは compare のまま） */
  compare: ModeStat;
  /** 「最強の5枚」モードの成績（version 2 で追加。保存キーは bestFive のまま） */
  bestFive: ModeStat;
  /** 最後に学習した日時（ISO文字列） */
  lastStudiedAt: string | null;
  /** 最後に学習した日（YYYY-MM-DD／端末のローカル日付。version 3 で追加） */
  lastStudyDate: string | null;
  /** 連続学習日数（version 3 で追加） */
  studyStreakDays: number;
  /** 連続学習日数の最高記録（version 3 で追加） */
  bestStudyStreakDays: number;
}

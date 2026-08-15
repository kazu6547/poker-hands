'use client';

import { useCallback, useState } from 'react';

/** 通常モードの1セッションあたりの問題数 */
export const QUESTIONS_PER_SET = 10;

/** 「次へ」を押したときに、呼び出し側がやるべきこと */
export type AdvanceAction =
  /** 次の問題を用意する */
  | 'next'
  /** 通常モードの最終問題だったので結果画面へ */
  | 'result'
  /** 無限モードを解除したので、新しい10問セッションを作り直す */
  | 'restart';

export const ENDLESS_OFF_NOTICE = '通常モードに戻しました。次の問題から10問チャレンジを開始します。';

export interface GameSession {
  /** 無限に練習するモードか */
  isEndless: boolean;
  /** 無限モードの ON/OFF を切り替える */
  setEndless: (value: boolean) => void;
  /** 0 始まりの問題インデックス */
  index: number;
  /** 画面表示用の問題番号（1 始まり） */
  questionNumber: number;
  /** 全問題数。無限モード中は null */
  total: number | null;
  correctCount: number;
  streak: number;
  /** 通常モードの最終問題かどうか（ボタン文言の切り替えに使う） */
  isLastQuestion: boolean;
  /** 画面に出す短い案内（通常モードへ戻したときなど） */
  notice: string | null;
  /** 正誤を1問分記録する */
  recordAnswer: (isCorrect: boolean) => void;
  /** 次へ進む。呼び出し側は戻り値に応じて問題を用意する */
  advance: () => AdvanceAction;
  /** セッションを最初からやり直す */
  reset: () => void;
}

/**
 * 4つのゲームモードで共通のセッション管理。
 *
 * - 通常モード：10問で結果画面へ
 * - 無限モード：上限なし。問題番号は増え続ける
 * - 無限 → 通常へ戻したときは、現在の問題と成績を保ったまま、
 *   次の「次へ」で新しい10問セッションを開始する
 */
export function useGameSession(): GameSession {
  const [isEndless, setIsEndless] = useState(false);
  const [index, setIndex] = useState(0);
  const [correctCount, setCorrectCount] = useState(0);
  const [streak, setStreak] = useState(0);
  /** 無限モードを解除した直後（次の「次へ」で作り直す） */
  const [isRestartPending, setIsRestartPending] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);

  // 作り直し待ちの間は問題番号が10を超えている可能性があるため、無限表示のままにする
  const total = isEndless || isRestartPending ? null : QUESTIONS_PER_SET;

  const setEndless = useCallback(
    (value: boolean) => {
      setIsEndless((current) => {
        if (current === value) return current;
        if (value) {
          // ON：いまの問題・成績をそのまま引き継ぐ
          setIsRestartPending(false);
          setNotice(null);
        } else {
          // OFF：この問題は続けて、次に進むときに10問セッションを開始する
          setIsRestartPending(true);
          setNotice(ENDLESS_OFF_NOTICE);
        }
        return value;
      });
    },
    [],
  );

  const recordAnswer = useCallback((isCorrect: boolean) => {
    setCorrectCount((current) => current + (isCorrect ? 1 : 0));
    setStreak((current) => (isCorrect ? current + 1 : 0));
  }, []);

  const resetCounters = useCallback(() => {
    setIndex(0);
    setCorrectCount(0);
    setStreak(0);
    setIsRestartPending(false);
    setNotice(null);
  }, []);

  const advance = useCallback((): AdvanceAction => {
    if (isRestartPending) {
      resetCounters();
      return 'restart';
    }
    if (!isEndless && index + 1 >= QUESTIONS_PER_SET) {
      return 'result';
    }
    setIndex((current) => current + 1);
    return 'next';
  }, [isRestartPending, isEndless, index, resetCounters]);

  const reset = useCallback(() => {
    resetCounters();
  }, [resetCounters]);

  return {
    isEndless,
    setEndless,
    index,
    questionNumber: index + 1,
    total,
    correctCount,
    streak,
    isLastQuestion: !isEndless && !isRestartPending && index + 1 >= QUESTIONS_PER_SET,
    notice,
    recordAnswer,
    advance,
    reset,
  };
}

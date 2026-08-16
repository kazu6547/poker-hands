'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { usePrefersReducedMotion } from './usePrefersReducedMotion';

/** 1枚ずつ戻す間隔（ミリ秒）。5枚で合計 80ms 程度になる */
const STEP_MS = 20;

export interface StaggeredClearOptions {
  /** 先頭の1枚だけ選択を解除する */
  removeOne: () => void;
  /** すべての選択を一度に解除する（動きを減らす設定のときに使う） */
  removeAll: () => void;
  /** 解除を始めた瞬間に1回だけ呼ぶ（効果音など） */
  onStart?: () => void;
  /** すべて解除し終えて、画面が更新されたあとに呼ぶ（フォーカスの置き直しなど） */
  onFinish?: () => void;
  stepMs?: number;
}

export interface StaggeredClear {
  /** 解除中か。カード操作を短時間だけ止めるために使う */
  isClearing: boolean;
  /** count 枚を少しずつ解除する。実行中の再要求は無視する */
  clear: (count: number) => void;
}

/**
 * 「選び直す」で、選んだカードを少しずつ戻すための仕組み。
 *
 * 見た目だけのアニメーションではなく、実際の選択状態を1枚ずつ減らすので、
 * 途中で止まっても「表示は消えたのに選択が残る」状態にはならない。
 *
 * - 連打しても多重に走らない（同期的な鍵で守る）
 * - タイマーはアンマウント時に必ず片付ける
 * - 動きを減らす設定のときは、ずらさず一度に解除する
 */
export function useStaggeredClear({
  removeOne,
  removeAll,
  onStart,
  onFinish,
  stepMs = STEP_MS,
}: StaggeredClearOptions): StaggeredClear {
  const [isClearing, setIsClearing] = useState(false);
  const lockRef = useRef(false);
  const timerRef = useRef<number | null>(null);
  const finishTimerRef = useRef<number | null>(null);
  const prefersReducedMotion = usePrefersReducedMotion();

  useEffect(
    () => () => {
      if (timerRef.current !== null) window.clearTimeout(timerRef.current);
      if (finishTimerRef.current !== null) window.clearTimeout(finishTimerRef.current);
    },
    [],
  );

  /** 画面が更新されたあとに呼びたいので、1フレームぶん遅らせる */
  const notifyFinished = useCallback(() => {
    if (!onFinish) return;
    finishTimerRef.current = window.setTimeout(() => {
      finishTimerRef.current = null;
      onFinish();
    }, 0);
  }, [onFinish]);

  const clear = useCallback(
    (count: number) => {
      if (lockRef.current || count <= 0) return;

      onStart?.();

      if (prefersReducedMotion || count === 1) {
        removeAll();
        notifyFinished();
        return;
      }

      lockRef.current = true;
      setIsClearing(true);
      // 1枚目はすぐ戻し、残りを少しずつ追いかけさせる
      removeOne();

      let remaining = count - 1;
      const step = () => {
        removeOne();
        remaining -= 1;
        if (remaining > 0) {
          timerRef.current = window.setTimeout(step, stepMs);
          return;
        }
        timerRef.current = null;
        lockRef.current = false;
        setIsClearing(false);
        notifyFinished();
      };
      timerRef.current = window.setTimeout(step, stepMs);
    },
    [notifyFinished, onStart, prefersReducedMotion, removeAll, removeOne, stepMs],
  );

  return { isClearing, clear };
}

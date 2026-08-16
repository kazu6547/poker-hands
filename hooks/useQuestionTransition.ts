'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { usePrefersReducedMotion } from './usePrefersReducedMotion';

export interface QuestionTransitionOptions {
  /** ボタンを押した瞬間にやること（効果音など）。退場を待たせない */
  onStart?: () => void;
  /** 退場が終わったあとに、実際に問題を進める */
  onCommit: () => void;
  /** 退場にかける時間（ミリ秒） */
  leaveMs?: number;
}

export interface QuestionTransition {
  /** 退場中か（true の間だけ、問題エリアを短くフェードさせる） */
  isLeaving: boolean;
  /** 次の問題へ進む。退場中の連打は無視する */
  requestNext: () => void;
}

/**
 * 「次へ」を押したときに、旧問題を短くフェードさせてから進めるための仕組み。
 *
 * - 連打しても進むのは1回だけ（同期的な鍵で守る）
 * - タイマーはアンマウント時に必ず片付ける
 * - 効果音は押した瞬間に鳴らし、演出で遅らせない
 */
export function useQuestionTransition({
  onStart,
  onCommit,
  leaveMs = 110,
}: QuestionTransitionOptions): QuestionTransition {
  const [isLeaving, setIsLeaving] = useState(false);
  const lockRef = useRef(false);
  const timerRef = useRef<number | null>(null);
  // 動きを減らす設定のときは、フェードを待たずにそのまま切り替える
  const prefersReducedMotion = usePrefersReducedMotion();
  const effectiveLeaveMs = prefersReducedMotion ? 0 : leaveMs;

  useEffect(
    () => () => {
      if (timerRef.current !== null) window.clearTimeout(timerRef.current);
    },
    [],
  );

  const requestNext = useCallback(() => {
    if (lockRef.current) return;
    lockRef.current = true;
    onStart?.();
    setIsLeaving(true);

    timerRef.current = window.setTimeout(() => {
      timerRef.current = null;
      onCommit();
      lockRef.current = false;
      setIsLeaving(false);
    }, effectiveLeaveMs);
  }, [onStart, onCommit, effectiveLeaveMs]);

  return { isLeaving, requestNext };
}

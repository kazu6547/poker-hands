'use client';

import { useEffect, useState } from 'react';

/** 回答できる状態になってから、そっと合図を出すまでの待ち時間 */
const IDLE_HINT_DELAY_MS = 2600;
/** 合図（ボタンを短く光らせる）を出しておく時間 */
const IDLE_HINT_DURATION_MS = 600;
/** 「押せるようになった」ことを示す一瞬の反応の長さ */
const ENABLE_PULSE_MS = 220;

export interface ReadyEmphasis {
  /** 回答できるようになった瞬間だけ true（1回だけの控えめな強調に使う） */
  justBecameReady: boolean;
  /** しばらく操作がないときに、1問につき1回だけ true になる */
  showIdleHint: boolean;
}

/**
 * 「回答できる状態になった」ことを、うるさくならない範囲で伝えるための状態。
 *
 * - 条件を満たした瞬間だけ、短い強調を1回
 * - そのまま数秒動きがなければ、1問につき1回だけ淡い合図
 * - 条件を外れたら即座に解除し、次の問題でまた1回に戻る
 *
 * @param isReady 回答できる状態か
 * @param questionKey 問題が変わったことが分かる値（変わると合図の回数がリセットされる）
 */
export function useReadyEmphasis(isReady: boolean, questionKey: string | number): ReadyEmphasis {
  const [justBecameReady, setJustBecameReady] = useState(false);
  const [showIdleHint, setShowIdleHint] = useState(false);
  /** この問題で、もう合図を出したか */
  const [hintUsed, setHintUsed] = useState(false);

  // 問題が変わったら、合図の回数を数え直す（描画中に前回値と比べる React 公式の書き方）
  const [previousKey, setPreviousKey] = useState(questionKey);
  if (previousKey !== questionKey) {
    setPreviousKey(questionKey);
    setHintUsed(false);
    setShowIdleHint(false);
    setJustBecameReady(false);
  }

  const [wasReady, setWasReady] = useState(isReady);
  if (wasReady !== isReady) {
    setWasReady(isReady);
    setJustBecameReady(isReady);
    if (!isReady) setShowIdleHint(false);
  }

  // 押せるようになった一瞬の反応は、すぐに畳む
  useEffect(() => {
    if (!justBecameReady) return;
    const timer = window.setTimeout(() => setJustBecameReady(false), ENABLE_PULSE_MS);
    return () => window.clearTimeout(timer);
  }, [justBecameReady]);

  // そのまま待たせてしまったときだけ、1回だけそっと合図する
  useEffect(() => {
    if (!isReady || hintUsed) return;
    const timer = window.setTimeout(() => {
      setShowIdleHint(true);
      setHintUsed(true);
    }, IDLE_HINT_DELAY_MS);
    return () => window.clearTimeout(timer);
  }, [isReady, hintUsed]);

  useEffect(() => {
    if (!showIdleHint) return;
    const timer = window.setTimeout(() => setShowIdleHint(false), IDLE_HINT_DURATION_MS);
    return () => window.clearTimeout(timer);
  }, [showIdleHint]);

  return { justBecameReady, showIdleHint };
}

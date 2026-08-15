'use client';

import { useEffect } from 'react';
import { primeAudio } from '@/lib/feedbackFx';

/**
 * 効果音を鳴らせる状態にしておくための下ごしらえ（画面には何も出さない）。
 *
 * スマホのブラウザは、最初のユーザー操作があるまで音を止めた状態で
 * AudioContext を作る。正解した瞬間に初めて作ると再開が間に合わず、
 * 最初の1回が無音になることがあるため、
 * 「最初のタップ／キー操作」と「アプリに戻ってきたとき」に再開しておく。
 */
export function AudioPrimer() {
  useEffect(() => {
    const handleFirstInteraction = () => primeAudio();

    // 最初の1回だけでよい（passive でスクロール性能に影響させない）
    const options = { once: true, passive: true } as const;
    window.addEventListener('pointerdown', handleFirstInteraction, options);
    window.addEventListener('touchend', handleFirstInteraction, options);
    window.addEventListener('keydown', handleFirstInteraction, options);

    // 別アプリから戻ると停止したままになるので、表示されたら再開する
    const handleVisibility = () => {
      if (document.visibilityState === 'visible') primeAudio();
    };
    document.addEventListener('visibilitychange', handleVisibility);

    return () => {
      window.removeEventListener('pointerdown', handleFirstInteraction);
      window.removeEventListener('touchend', handleFirstInteraction);
      window.removeEventListener('keydown', handleFirstInteraction);
      document.removeEventListener('visibilitychange', handleVisibility);
    };
  }, []);

  return null;
}

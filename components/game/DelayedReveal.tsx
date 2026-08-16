'use client';

import { ReactNode, useEffect, useState } from 'react';
import { usePrefersReducedMotion } from '@/hooks/usePrefersReducedMotion';
import { cn } from '@/lib/cn';

export interface DelayedRevealProps {
  /** 遅らせる時間（ミリ秒） */
  delayMs?: number;
  className?: string;
  children: ReactNode;
}

/**
 * 少しだけ遅れて見せる。
 * 「あなたの選択」を見てから「正解の5枚」に目が移るように使う。
 *
 * 場所は最初から確保しておくので、あとから現れても画面がガタつかない。
 */
export function DelayedReveal({ delayMs = 150, className, children }: DelayedRevealProps) {
  const [isShown, setIsShown] = useState(false);
  // 動きを減らす設定のときは、遅らせずにそのまま見せる
  const prefersReducedMotion = usePrefersReducedMotion();
  const effectiveDelayMs = prefersReducedMotion ? 0 : delayMs;

  useEffect(() => {
    const timer = window.setTimeout(() => setIsShown(true), effectiveDelayMs);
    return () => window.clearTimeout(timer);
  }, [effectiveDelayMs]);

  return (
    <div
      className={cn(
        'transition-opacity duration-200 ease-out',
        isShown ? 'opacity-100' : 'opacity-0',
        className,
      )}
    >
      {children}
    </div>
  );
}

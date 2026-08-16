'use client';

import { useSyncExternalStore } from 'react';

const QUERY = '(prefers-reduced-motion: reduce)';

function getMediaQuery(): MediaQueryList | null {
  if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') return null;
  try {
    return window.matchMedia(QUERY);
  } catch {
    return null;
  }
}

function subscribe(onChange: () => void): () => void {
  const mediaQuery = getMediaQuery();
  if (!mediaQuery) return () => {};
  mediaQuery.addEventListener('change', onChange);
  return () => mediaQuery.removeEventListener('change', onChange);
}

const getSnapshot = () => getMediaQuery()?.matches ?? false;
const getServerSnapshot = () => false;

/**
 * 「動きを減らす」設定を見ているか。
 * CSS 側でもアニメーションは止めているが、
 * 待ち時間そのものをなくしたいときにこの値を使う。
 */
export function usePrefersReducedMotion(): boolean {
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}

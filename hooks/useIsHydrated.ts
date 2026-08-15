'use client';

import { useSyncExternalStore } from 'react';

const subscribe = () => () => {};
const getSnapshot = () => true;
const getServerSnapshot = () => false;

/**
 * ハイドレーションが終わったかどうか。
 * localStorage を読む前後で表示を切り替えるために使う（effect で setState しないための仕組み）。
 */
export function useIsHydrated(): boolean {
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}

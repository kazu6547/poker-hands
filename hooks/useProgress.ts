'use client';

import { useCallback, useSyncExternalStore } from 'react';
import {
  PROGRESS_STORAGE_KEY,
  applyBuildResult,
  applyModeAnswer,
  applyQuizAnswer,
  clearProgress,
  createEmptyProgress,
  loadProgress,
  saveProgress,
} from '@/lib/progress';
import { HandId, ProgressData, StatModeId } from '@/lib/types';
import { useIsHydrated } from './useIsHydrated';

/**
 * 学習記録を localStorage と同期する外部ストア。
 *
 * useSyncExternalStore を使うことで、
 * 「サーバーでは空データ → ハイドレーション後に保存済みデータ」を
 * effect 内の setState なしに実現している（ハイドレーション不一致も起きない）。
 */

/** サーバー描画用のスナップショット。参照を固定する必要があるので使い回す */
const SERVER_SNAPSHOT = createEmptyProgress();

let cachedProgress: ProgressData | null = null;
const listeners = new Set<() => void>();

function emitChange(): void {
  listeners.forEach((listener) => listener());
}

function getSnapshot(): ProgressData {
  if (!cachedProgress) cachedProgress = loadProgress();
  return cachedProgress;
}

function getServerSnapshot(): ProgressData {
  return SERVER_SNAPSHOT;
}

function subscribe(listener: () => void): () => void {
  listeners.add(listener);

  // 別タブで学習した内容にも追従する
  const handleStorage = (event: StorageEvent) => {
    if (event.key !== null && event.key !== PROGRESS_STORAGE_KEY) return;
    cachedProgress = loadProgress();
    emitChange();
  };
  window.addEventListener('storage', handleStorage);

  return () => {
    listeners.delete(listener);
    window.removeEventListener('storage', handleStorage);
  };
}

function updateProgress(updater: (current: ProgressData) => ProgressData): void {
  const next = updater(getSnapshot());
  cachedProgress = next;
  saveProgress(next);
  emitChange();
}

export function useProgress() {
  const progress = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
  const isReady = useIsHydrated();

  const recordQuizAnswer = useCallback((handId: HandId, isCorrect: boolean) => {
    updateProgress((current) => applyQuizAnswer(current, handId, isCorrect));
  }, []);

  const recordBuildResult = useCallback((isCleared: boolean) => {
    updateProgress((current) => applyBuildResult(current, isCleared));
  }, []);

  /** 「強さ比較」「最強の5枚を選ぶ」の回答を記録する */
  const recordModeAnswer = useCallback((mode: StatModeId, isCorrect: boolean) => {
    updateProgress((current) => applyModeAnswer(current, mode, isCorrect));
  }, []);

  const reset = useCallback(() => {
    clearProgress();
    cachedProgress = createEmptyProgress();
    emitChange();
  }, []);

  return { progress, isReady, recordQuizAnswer, recordBuildResult, recordModeAnswer, reset };
}

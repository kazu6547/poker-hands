'use client';

import { useCallback, useSyncExternalStore } from 'react';
import {
  DEFAULT_FEEDBACK_SETTINGS,
  FEEDBACK_SETTINGS_EVENT,
  FEEDBACK_SETTINGS_KEY,
  FeedbackSettings,
  HapticsKind,
  hapticsKind,
  loadFeedbackSettings,
  saveFeedbackSettings,
} from '@/lib/feedbackFx';
import { useIsHydrated } from './useIsHydrated';

/**
 * 効果音・振動の設定を localStorage と同期する外部ストア。
 * useProgress と同じく、effect 内の setState なしでハイドレーション後に実データへ切り替わる。
 */

const SERVER_SNAPSHOT: FeedbackSettings = { ...DEFAULT_FEEDBACK_SETTINGS };

let cachedSettings: FeedbackSettings | null = null;
const listeners = new Set<() => void>();

function emitChange(): void {
  listeners.forEach((listener) => listener());
}

function getSnapshot(): FeedbackSettings {
  if (!cachedSettings) cachedSettings = loadFeedbackSettings();
  return cachedSettings;
}

function getServerSnapshot(): FeedbackSettings {
  return SERVER_SNAPSHOT;
}

function subscribe(listener: () => void): () => void {
  listeners.add(listener);

  // 同じタブの別画面・別タブのどちらの変更にも追従する
  const handleSettingsEvent = (event: Event) => {
    const detail = (event as CustomEvent<FeedbackSettings>).detail;
    cachedSettings = detail ?? loadFeedbackSettings();
    emitChange();
  };
  const handleStorage = (event: StorageEvent) => {
    if (event.key !== null && event.key !== FEEDBACK_SETTINGS_KEY) return;
    cachedSettings = loadFeedbackSettings();
    emitChange();
  };

  window.addEventListener(FEEDBACK_SETTINGS_EVENT, handleSettingsEvent);
  window.addEventListener('storage', handleStorage);

  return () => {
    listeners.delete(listener);
    window.removeEventListener(FEEDBACK_SETTINGS_EVENT, handleSettingsEvent);
    window.removeEventListener('storage', handleStorage);
  };
}

/* 振動対応の有無は端末ごとに固定なので、購読不要のスナップショットとして扱う */
const subscribeVibration = () => () => {};
const getVibrationSnapshot = (): HapticsKind => hapticsKind();
const getVibrationServerSnapshot = (): HapticsKind => 'none';

export function useFeedbackSettings() {
  const settings = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
  const vibrationKind = useSyncExternalStore(
    subscribeVibration,
    getVibrationSnapshot,
    getVibrationServerSnapshot,
  );
  const vibrationSupported = vibrationKind !== 'none';
  const isReady = useIsHydrated();

  const update = useCallback((patch: Partial<Omit<FeedbackSettings, 'version'>>) => {
    const next = { ...getSnapshot(), ...patch };
    cachedSettings = next;
    // saveFeedbackSettings がイベントを発火し、購読側にも伝わる
    saveFeedbackSettings(next);
    emitChange();
  }, []);

  return { settings, isReady, vibrationSupported, vibrationKind, update };
}

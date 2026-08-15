import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { hapticsKind, patternToTapDelays } from '../lib/haptics';
import { SOUND_DEFINITIONS, SoundEvent } from '../lib/soundEvents';

describe('振動パターンをタップに読み替える', () => {
  it('1回だけの振動は1回のタップになる', () => {
    assert.deepEqual(patternToTapDelays([28]), [0]);
  });

  it('間隔が十分なパターンは、振動の先頭ごとにタップする', () => {
    // 14ms振動 → 45ms休み → 14ms振動
    assert.deepEqual(patternToTapDelays([14, 45, 14]), [0, 59]);
    // 3回の振動はそのまま3回のタップになる
    assert.deepEqual(patternToTapDelays([14, 40, 14, 40, 14]), [0, 54, 108]);
  });

  it('近すぎるタップは間引く（連打に感じないように）', () => {
    // 0ms, 30ms, 60ms のうち 30ms は前に近すぎるので落とす
    assert.deepEqual(patternToTapDelays([10, 20, 10, 20, 10]), [0, 60]);
  });

  it('多くても3回まで', () => {
    const long = [16, 60, 16, 60, 16, 60, 16, 60, 16];
    assert.equal(patternToTapDelays(long).length, 3);
  });

  it('空のパターンでは何もしない', () => {
    assert.deepEqual(patternToTapDelays([]), []);
  });

  it('実際に使っているパターンは、すべて1〜3回のタップに収まる', () => {
    const events = Object.keys(SOUND_DEFINITIONS) as SoundEvent[];
    for (const event of events) {
      const pattern = SOUND_DEFINITIONS[event].vibration;
      if (!pattern) continue;
      const taps = patternToTapDelays(pattern);
      assert.ok(taps.length >= 1 && taps.length <= 3, `${event} のタップ回数が範囲外`);
      assert.equal(taps[0], 0, `${event} は最初のタップをすぐ返すこと`);
    }
  });
});

describe('端末ごとの触覚の判定', () => {
  /** navigator は上書きできないプロパティなので、定義ごと差し替えて元に戻す */
  const withEnvironment = (
    environment: { vibrate?: boolean; maxTouchPoints: number; switchSupported: boolean },
    check: () => void,
  ) => {
    const originalNavigator = Object.getOwnPropertyDescriptor(globalThis, 'navigator');
    const originalDocument = Object.getOwnPropertyDescriptor(globalThis, 'document');

    Object.defineProperty(globalThis, 'navigator', {
      value: {
        maxTouchPoints: environment.maxTouchPoints,
        ...(environment.vibrate ? { vibrate: () => true } : {}),
      },
      configurable: true,
    });
    Object.defineProperty(globalThis, 'document', {
      value: { createElement: () => (environment.switchSupported ? { switch: false } : {}) },
      configurable: true,
    });

    try {
      check();
    } finally {
      if (originalNavigator) Object.defineProperty(globalThis, 'navigator', originalNavigator);
      if (originalDocument) Object.defineProperty(globalThis, 'document', originalDocument);
      else delete (globalThis as unknown as Record<string, unknown>).document;
    }
  };

  it('Vibration API があればそれを使う（Android など）', () => {
    withEnvironment({ vibrate: true, maxTouchPoints: 5, switchSupported: false }, () => {
      assert.equal(hapticsKind(), 'vibration');
    });
  });

  it('iPhone（Vibration APIなし・switch対応・タッチあり）はスイッチ触覚を使う', () => {
    withEnvironment({ maxTouchPoints: 5, switchSupported: true }, () => {
      assert.equal(hapticsKind(), 'switch');
    });
  });

  it('タッチできない Mac の Safari は対象外にする', () => {
    withEnvironment({ maxTouchPoints: 0, switchSupported: true }, () => {
      assert.equal(hapticsKind(), 'none');
    });
  });

  it('どちらにも対応しない端末は none', () => {
    withEnvironment({ maxTouchPoints: 0, switchSupported: false }, () => {
      assert.equal(hapticsKind(), 'none');
    });
  });
});

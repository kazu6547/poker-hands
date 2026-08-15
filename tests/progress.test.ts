import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import {
  PROGRESS_VERSION,
  applyBuildResult,
  applyModeAnswer,
  applyQuizAnswer,
  createEmptyProgress,
  normalizeProgress,
} from '../lib/progress';

describe('normalizeProgress', () => {
  it('version 1 の古いデータを読み込んでも壊れない', () => {
    const legacy = {
      version: 1,
      totalAnswers: 12,
      totalCorrect: 7,
      currentStreak: 2,
      bestStreak: 4,
      handStats: { 'one-pair': { attempts: 3, correct: 2 } },
      buildAttempts: 5,
      buildCleared: 3,
      lastStudiedAt: '2026-08-16T00:00:00.000Z',
    };

    const progress = normalizeProgress(legacy);

    assert.equal(progress.version, PROGRESS_VERSION);
    assert.equal(progress.totalAnswers, 12);
    assert.equal(progress.bestStreak, 4);
    assert.deepEqual(progress.handStats['one-pair'], { attempts: 3, correct: 2 });
    // 新しいモードの成績は 0 で補われる
    assert.deepEqual(progress.compare, { attempts: 0, correct: 0 });
    assert.deepEqual(progress.bestFive, { attempts: 0, correct: 0 });
    assert.equal(progress.lastStudiedAt, '2026-08-16T00:00:00.000Z');
  });

  it('壊れたデータでもクラッシュせず既定値になる', () => {
    for (const raw of [null, undefined, 'broken', 42, [], { totalAnswers: 'x', handStats: 3 }]) {
      const progress = normalizeProgress(raw);
      assert.equal(progress.totalAnswers, 0);
      assert.equal(progress.compare.attempts, 0);
      assert.equal(Object.keys(progress.handStats).length, 10);
    }
  });

  it('負の数や小数は 0 以上の整数に丸める', () => {
    const progress = normalizeProgress({ totalAnswers: -5, totalCorrect: 3.7 });
    assert.equal(progress.totalAnswers, 0);
    assert.equal(progress.totalCorrect, 3);
  });
});

describe('記録の更新', () => {
  it('役を当てる：全体の集計と役ごとの成績が増える', () => {
    let progress = createEmptyProgress();
    progress = applyQuizAnswer(progress, 'flush', true);
    progress = applyQuizAnswer(progress, 'flush', false);

    assert.equal(progress.totalAnswers, 2);
    assert.equal(progress.totalCorrect, 1);
    assert.equal(progress.currentStreak, 0);
    assert.equal(progress.bestStreak, 1);
    assert.deepEqual(progress.handStats.flush, { attempts: 2, correct: 1 });
  });

  it('VSカード・最強の5枚：モードごとの成績と全体の集計が増える', () => {
    let progress = createEmptyProgress();
    progress = applyModeAnswer(progress, 'compare', true);
    progress = applyModeAnswer(progress, 'compare', true);
    progress = applyModeAnswer(progress, 'bestFive', false);

    assert.deepEqual(progress.compare, { attempts: 2, correct: 2 });
    assert.deepEqual(progress.bestFive, { attempts: 1, correct: 0 });
    assert.equal(progress.totalAnswers, 3);
    assert.equal(progress.totalCorrect, 2);
    assert.equal(progress.bestStreak, 2);
    assert.equal(progress.currentStreak, 0);
    // 役ごとの成績は変化しない
    assert.deepEqual(progress.handStats.flush, { attempts: 0, correct: 0 });
  });

  it('役を作る：回答数の集計には影響しない', () => {
    let progress = createEmptyProgress();
    progress = applyBuildResult(progress, true);

    assert.equal(progress.buildAttempts, 1);
    assert.equal(progress.buildCleared, 1);
    assert.equal(progress.totalAnswers, 0);
  });
});

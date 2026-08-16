import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import {
  accuracyPercent,
  applyModeAnswer,
  applyQuizAnswer,
  createEmptyProgress,
  normalizeProgress,
} from '../lib/progress';
import { ProgressData } from '../lib/types';

/**
 * 実際のユーザー環境で起きる「壊れた保存データ」への耐性。
 * 消さない・落ちない・直せる分は直す、を確かめる。
 */

const isSaneProgress = (progress: ProgressData) => {
  const counts = [
    progress.totalAnswers,
    progress.totalCorrect,
    progress.currentStreak,
    progress.bestStreak,
    progress.buildAttempts,
    progress.buildCleared,
    progress.compare.attempts,
    progress.compare.correct,
    progress.bestFive.attempts,
    progress.bestFive.correct,
    progress.studyStreakDays,
    progress.bestStudyStreakDays,
  ];
  return counts.every((value) => Number.isInteger(value) && value >= 0);
};

describe('壊れた保存データ', () => {
  const broken: [string, unknown][] = [
    ['null', null],
    ['undefined', undefined],
    ['空文字', ''],
    ['数値', 42],
    ['配列', [1, 2, 3]],
    ['真偽値', true],
    ['空オブジェクト', {}],
    ['数値が文字列', { totalAnswers: '10', totalCorrect: '3', bestStreak: '5' }],
    ['NaN', { totalAnswers: NaN, bestStreak: NaN }],
    ['Infinity', { totalAnswers: Infinity, totalCorrect: -Infinity }],
    ['負数', { totalAnswers: -5, totalCorrect: -1, bestStreak: -99 }],
    ['極端に大きい数', { totalAnswers: Number.MAX_SAFE_INTEGER }],
    ['小数', { totalAnswers: 3.7, bestStreak: 2.2 }],
    ['handStats が配列', { handStats: ['flush'] }],
    ['handStats の中身が文字列', { handStats: { flush: 'こわれた' } }],
    ['未知のモードID', { unknownMode: { attempts: 3, correct: 1 }, compare: 'こわれた' }],
    ['compare が配列', { compare: [1, 2] }],
    ['日付が不正', { lastStudyDate: '2026/08/16', lastStudiedAt: 12345 }],
  ];

  for (const [label, raw] of broken) {
    it(`${label} でも落ちず、安全な値になる`, () => {
      const progress = normalizeProgress(raw);
      assert.equal(progress.version, createEmptyProgress().version);
      assert.ok(isSaneProgress(progress), `${label} で不正な数値が残った`);
      // 役ごとの記録は必ず10役ぶんそろえる
      assert.equal(Object.keys(progress.handStats).length, 10);
    });
  }

  it('現実にはあり得ない巨大な値は、表示が壊れない範囲に丸める', () => {
    const progress = normalizeProgress({
      totalAnswers: 1e308,
      totalCorrect: Number.MAX_SAFE_INTEGER,
      bestStreak: 1e30,
    });
    for (const value of [progress.totalAnswers, progress.totalCorrect, progress.bestStreak]) {
      assert.ok(Number.isSafeInteger(value), `安全な整数でない：${value}`);
      assert.ok(String(value).length <= 10, `桁が多すぎる：${value}`);
    }
  });

  it('正しい部分は消さずに残す', () => {
    const progress = normalizeProgress({
      totalAnswers: 120,
      totalCorrect: 90,
      bestStreak: 14,
      handStats: { flush: { attempts: 8, correct: 6 }, 'one-pair': 'こわれた' },
      compare: { attempts: 20, correct: 15 },
      bestFive: null,
    });
    assert.equal(progress.totalAnswers, 120);
    assert.equal(progress.totalCorrect, 90);
    assert.equal(progress.bestStreak, 14);
    assert.deepEqual(progress.handStats.flush, { attempts: 8, correct: 6 });
    assert.deepEqual(progress.handStats['one-pair'], { attempts: 0, correct: 0 });
    assert.deepEqual(progress.compare, { attempts: 20, correct: 15 });
    assert.deepEqual(progress.bestFive, { attempts: 0, correct: 0 });
  });
});

describe('連続正解記録', () => {
  it('不正解ではリセットされるが、記録は下がらない', () => {
    let progress = createEmptyProgress();
    for (let i = 0; i < 7; i += 1) progress = applyQuizAnswer(progress, 'flush', true);
    assert.equal(progress.currentStreak, 7);
    assert.equal(progress.bestStreak, 7);

    progress = applyQuizAnswer(progress, 'flush', false);
    assert.equal(progress.currentStreak, 0);
    assert.equal(progress.bestStreak, 7, '記録が下がってはいけない');

    for (let i = 0; i < 3; i += 1) progress = applyModeAnswer(progress, 'compare', true);
    assert.equal(progress.currentStreak, 3);
    assert.equal(progress.bestStreak, 7, '記録を上回るまで更新しない');
  });

  it('記録より長い連続が出たときだけ更新される', () => {
    let progress = { ...createEmptyProgress(), bestStreak: 4 };
    for (let i = 0; i < 5; i += 1) progress = applyModeAnswer(progress, 'bestFive', true);
    assert.equal(progress.bestStreak, 5);
  });

  it('壊れたデータから読み込んだ記録も引き継がれる', () => {
    const progress = normalizeProgress({ bestStreak: 12, totalAnswers: 'こわれた' });
    assert.equal(progress.bestStreak, 12);
    assert.equal(progress.totalAnswers, 0);
  });
});

describe('正答率', () => {
  it('0問でもゼロ除算にならない', () => {
    assert.equal(accuracyPercent(0, 0), 0);
  });

  it('0〜100 の範囲に収まる', () => {
    const cases: [number, number][] = [
      [0, 10],
      [10, 10],
      [3, 7],
      [1, 3],
      [999, 1000],
    ];
    for (const [correct, total] of cases) {
      const value = accuracyPercent(correct, total);
      assert.ok(Number.isFinite(value), `${correct}/${total} が数値でない`);
      assert.ok(value >= 0 && value <= 100, `${correct}/${total} が範囲外（${value}）`);
    }
  });

  it('正答数が回答数を超える壊れたデータでも 100 を超えない', () => {
    assert.ok(accuracyPercent(20, 10) <= 100);
  });
});

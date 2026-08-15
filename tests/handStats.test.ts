import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import {
  HANDS,
  TOTAL_FIVE_CARD_COMBINATIONS,
  formatHandProbability,
  handProbabilityPercent,
} from '../data/hands';
import {
  applyQuizAnswer,
  createEmptyProgress,
  currentStudyStreak,
  normalizeProgress,
  toDateKey,
  weakestHands,
} from '../lib/progress';

const dateKeyFromToday = (offsetDays: number) =>
  toDateKey(new Date(Date.now() + offsetDays * 86_400_000));

describe('役の出現確率', () => {
  it('全10役の組み合わせ数の合計が C(52,5) と一致する', () => {
    const total = HANDS.reduce((sum, hand) => sum + hand.combinations, 0);
    assert.equal(total, TOTAL_FIVE_CARD_COMBINATIONS);
    assert.equal(total, 2_598_960);
  });

  it('強い役ほど珍しい（強さの順と出現数の順が一致する）', () => {
    const ordered = [...HANDS].sort((a, b) => a.strengthRank - b.strengthRank);
    for (let i = 0; i < ordered.length - 1; i += 1) {
      assert.ok(
        ordered[i].combinations < ordered[i + 1].combinations,
        `${ordered[i].nameJa} は ${ordered[i + 1].nameJa} より珍しいはず`,
      );
    }
  });

  it('よく知られた確率と一致する', () => {
    assert.equal(handProbabilityPercent('royal-flush').toFixed(6), '0.000154');
    assert.equal(formatHandProbability('flush'), '0.20%');
    assert.equal(formatHandProbability('one-pair'), '42.3%');
    assert.equal(formatHandProbability('high-card'), '50.1%');
  });
});

describe('連続学習日数', () => {
  it('初めて学習した日は1日連続になる', () => {
    const progress = applyQuizAnswer(createEmptyProgress(), 'flush', true);
    assert.equal(progress.studyStreakDays, 1);
    assert.equal(progress.bestStudyStreakDays, 1);
    assert.equal(progress.lastStudyDate, dateKeyFromToday(0));
  });

  it('同じ日に何度学習しても1日のまま', () => {
    let progress = applyQuizAnswer(createEmptyProgress(), 'flush', true);
    progress = applyQuizAnswer(progress, 'straight', false);
    progress = applyQuizAnswer(progress, 'two-pair', true);
    assert.equal(progress.studyStreakDays, 1);
  });

  it('昨日の続きなら1日増える', () => {
    const base = {
      ...createEmptyProgress(),
      lastStudyDate: dateKeyFromToday(-1),
      studyStreakDays: 4,
      bestStudyStreakDays: 4,
    };
    const progress = applyQuizAnswer(base, 'flush', true);
    assert.equal(progress.studyStreakDays, 5);
    assert.equal(progress.bestStudyStreakDays, 5);
  });

  it('1日でも空くとリセットされる（最高記録は残る）', () => {
    const base = {
      ...createEmptyProgress(),
      lastStudyDate: dateKeyFromToday(-3),
      studyStreakDays: 9,
      bestStudyStreakDays: 9,
    };
    const progress = applyQuizAnswer(base, 'flush', true);
    assert.equal(progress.studyStreakDays, 1);
    assert.equal(progress.bestStudyStreakDays, 9);
  });

  it('表示用の連続日数は、今日か昨日まで続いていれば継続扱い', () => {
    const make = (offset: number, streak: number) => ({
      ...createEmptyProgress(),
      lastStudyDate: dateKeyFromToday(offset),
      studyStreakDays: streak,
    });
    assert.equal(currentStudyStreak(make(0, 3)), 3);
    assert.equal(currentStudyStreak(make(-1, 3)), 3);
    assert.equal(currentStudyStreak(make(-2, 3)), 0, '2日以上空いたら途切れている');
    assert.equal(currentStudyStreak(createEmptyProgress()), 0);
  });

  it('連続学習日数がない古いデータ（version 2）でも壊れない', () => {
    const legacy = {
      version: 2,
      totalAnswers: 30,
      totalCorrect: 20,
      bestStreak: 5,
      handStats: { flush: { attempts: 4, correct: 1 } },
      compare: { attempts: 3, correct: 2 },
      bestFive: { attempts: 2, correct: 1 },
      lastStudiedAt: '2026-08-16T00:00:00.000Z',
    };
    const progress = normalizeProgress(legacy);

    assert.equal(progress.totalAnswers, 30);
    assert.equal(progress.studyStreakDays, 0);
    assert.equal(progress.bestStudyStreakDays, 0);
    assert.equal(progress.lastStudyDate, null);
    // 次に学習した時点から連続日数が始まる
    assert.equal(applyQuizAnswer(progress, 'flush', true).studyStreakDays, 1);
  });

  it('壊れた日付は無視される', () => {
    const progress = normalizeProgress({ lastStudyDate: '2026/08/16', studyStreakDays: -3 });
    assert.equal(progress.lastStudyDate, null);
    assert.equal(progress.studyStreakDays, 0);
  });
});

describe('苦手な役の抽出', () => {
  it('正答率が低い順に、出題数が足りている役だけを返す', () => {
    const progress = {
      ...createEmptyProgress(),
      handStats: {
        ...createEmptyProgress().handStats,
        flush: { attempts: 4, correct: 1 }, // 25%
        straight: { attempts: 5, correct: 4 }, // 80%
        'two-pair': { attempts: 4, correct: 2 }, // 50%
        'one-pair': { attempts: 1, correct: 0 }, // 出題1回なので対象外
        'royal-flush': { attempts: 3, correct: 3 }, // 全問正解なので対象外
      },
    };

    const weak = weakestHands(progress);
    assert.deepEqual(
      weak.map((entry) => entry.handId),
      ['flush', 'two-pair', 'straight'],
    );
    assert.equal(weak[0].accuracy, 25);
    assert.equal(weak.length, 3);
  });

  it('記録がなければ空になる', () => {
    assert.deepEqual(weakestHands(createEmptyProgress()), []);
  });
});

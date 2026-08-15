import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import {
  IMPORTANT_PRIORITY,
  SOUND_DEFINITIONS,
  SoundEvent,
  soundDurationSec,
} from '../lib/soundEvents';
import {
  endlessMilestone,
  resolveAnswerFeedback,
  resolveFinishEvent,
  resolveSessionResultEvent,
  totalAnswersMilestone,
} from '../lib/achievements';

const ALL_EVENTS = Object.keys(SOUND_DEFINITIONS) as SoundEvent[];

describe('効果音の設計', () => {
  it('すべての音が 0.05〜0.8 秒に収まる', () => {
    for (const event of ALL_EVENTS) {
      const duration = soundDurationSec(event);
      assert.ok(duration >= 0.05, `${event} が短すぎる（${duration}秒）`);
      assert.ok(duration <= 0.8, `${event} が長すぎる（${duration}秒）`);
    }
  });

  it('音量が小さめに正規化されている（達成音でも 0.09 以下）', () => {
    for (const event of ALL_EVENTS) {
      const { gain } = SOUND_DEFINITIONS[event];
      assert.ok(gain > 0 && gain <= 0.09, `${event} の音量が範囲外（${gain}）`);
    }
  });

  it('カード操作音は最も小さく、最も短い', () => {
    const select = SOUND_DEFINITIONS['card-select'];
    const deselect = SOUND_DEFINITIONS['card-deselect'];
    const correct = SOUND_DEFINITIONS.correct;

    for (const card of [select, deselect]) {
      assert.ok(card.gain < correct.gain / 2, 'カード音は正解音よりかなり小さいこと');
      assert.ok(card.priority < IMPORTANT_PRIORITY, 'カード音は重要な音に譲ること');
      assert.ok(card.cooldownMs >= 60 && card.cooldownMs <= 120, 'クールダウンは60〜120ms');
    }
    assert.ok(soundDurationSec('card-select') <= 0.12);
    assert.ok(soundDurationSec('card-deselect') <= 0.12);
    // 選択と解除は聞き分けられるように音程を変える
    assert.notEqual(select.notes[0].frequency, deselect.notes[0].frequency);
    assert.ok(deselect.notes[0].frequency < select.notes[0].frequency, '解除音は低めにする');
  });

  it('重要な音（正解・達成・結果）は priority が高い', () => {
    const important: SoundEvent[] = [
      'correct',
      'incorrect',
      'streak-3',
      'streak-10',
      'milestone-100',
      'new-record',
      'session-excellent',
    ];
    for (const event of important) {
      assert.ok(
        SOUND_DEFINITIONS[event].priority >= IMPORTANT_PRIORITY,
        `${event} は重要な音として扱うこと`,
      );
    }
    // 進行系・カード系は重要ではない
    for (const event of ['next-question', 'card-select', 'game-start-quiz'] as SoundEvent[]) {
      assert.ok(SOUND_DEFINITIONS[event].priority < IMPORTANT_PRIORITY);
    }
  });

  it('達成の重要度どおりに priority が並ぶ', () => {
    const order: SoundEvent[] = [
      'milestone-100',
      'new-record',
      'session-excellent',
      'streak-10',
      'milestone-50',
      'streak-3',
      'correct',
      'next-question',
      'card-select',
    ];
    for (let i = 0; i < order.length - 1; i += 1) {
      assert.ok(
        SOUND_DEFINITIONS[order[i]].priority >= SOUND_DEFINITIONS[order[i + 1]].priority,
        `${order[i]} は ${order[i + 1]} 以上の優先度であること`,
      );
    }
  });

  it('4モードの開始音はすべて違う', () => {
    const starts: SoundEvent[] = [
      'game-start-quiz',
      'game-start-build',
      'game-start-compare',
      'game-start-best-five',
    ];
    const signatures = starts.map((event) =>
      SOUND_DEFINITIONS[event].notes.map((note) => note.frequency).join(','),
    );
    assert.equal(new Set(signatures).size, starts.length);
  });
});

describe('鳴らす音の判定', () => {
  const base = {
    isCorrect: true,
    streak: 1,
    answeredCount: 1,
    isEndless: false,
    previousBestStreak: 99,
    previousTotalAnswers: 0,
  };

  it('通常の正誤', () => {
    assert.equal(resolveAnswerFeedback(base).event, 'correct');
    assert.equal(resolveAnswerFeedback({ ...base, isCorrect: false, streak: 0 }).event, 'incorrect');
    assert.equal(resolveAnswerFeedback(base).notice, undefined);
  });

  it('連続正解 3・5・10 でボーナス音が鳴る', () => {
    assert.equal(resolveAnswerFeedback({ ...base, streak: 3 }).event, 'streak-3');
    assert.equal(resolveAnswerFeedback({ ...base, streak: 5 }).event, 'streak-5');
    assert.equal(resolveAnswerFeedback({ ...base, streak: 10 }).event, 'streak-10');
    assert.equal(resolveAnswerFeedback({ ...base, streak: 20 }).event, 'streak-10');
    // 節目でない連続はいつもの正解音
    assert.equal(resolveAnswerFeedback({ ...base, streak: 4 }).event, 'correct');
  });

  it('自己ベスト更新は連続正解の節目より優先される', () => {
    const feedback = resolveAnswerFeedback({ ...base, streak: 5, previousBestStreak: 4 });
    assert.equal(feedback.event, 'new-record');
    assert.equal(feedback.notice?.title, '自己ベスト更新！');
    assert.equal(feedback.notice?.detail, '連続正解：5回');
  });

  it('100問達成は自己ベストより優先される', () => {
    const feedback = resolveAnswerFeedback({
      ...base,
      isEndless: true,
      answeredCount: 100,
      streak: 12,
      previousBestStreak: 1,
    });
    assert.equal(feedback.event, 'milestone-100');
    assert.equal(feedback.notice?.title, '100問達成！');
  });

  it('無限モードの節目（10・25・50）で音が鳴る', () => {
    const endless = { ...base, isEndless: true, streak: 1 };
    assert.equal(resolveAnswerFeedback({ ...endless, answeredCount: 10 }).event, 'milestone-10');
    assert.equal(resolveAnswerFeedback({ ...endless, answeredCount: 25 }).event, 'milestone-25');
    assert.equal(resolveAnswerFeedback({ ...endless, answeredCount: 50 }).event, 'milestone-50');
    assert.equal(resolveAnswerFeedback({ ...endless, answeredCount: 11 }).event, 'correct');
    // 通常モードでは回答数の節目では鳴らさない
    assert.equal(resolveAnswerFeedback({ ...base, answeredCount: 10 }).event, 'correct');
  });

  it('累計回答数の節目でも1つだけ音が鳴る', () => {
    const feedback = resolveAnswerFeedback({ ...base, previousTotalAnswers: 99 });
    assert.equal(feedback.event, 'new-record');
    assert.equal(feedback.notice?.title, '累計100問達成！');
    assert.equal(resolveAnswerFeedback({ ...base, previousTotalAnswers: 98 }).event, 'correct');
  });

  it('節目の判定', () => {
    assert.equal(endlessMilestone(10), 10);
    assert.equal(endlessMilestone(200), 100);
    assert.equal(endlessMilestone(30), null);
    assert.equal(endlessMilestone(0), null);
    assert.equal(totalAnswersMilestone(500), 500);
    assert.equal(totalAnswersMilestone(2000), 2000);
    assert.equal(totalAnswersMilestone(150), null);
  });
});

describe('結果画面と終了時の音', () => {
  it('正答率で結果音が分かれる', () => {
    assert.equal(resolveSessionResultEvent(100), 'session-excellent');
    assert.equal(resolveSessionResultEvent(90), 'session-excellent');
    assert.equal(resolveSessionResultEvent(89), 'session-good');
    assert.equal(resolveSessionResultEvent(70), 'session-good');
    assert.equal(resolveSessionResultEvent(69), 'session-continue');
    assert.equal(resolveSessionResultEvent(40), 'session-continue');
    assert.equal(resolveSessionResultEvent(39), 'session-retry');
    assert.equal(resolveSessionResultEvent(0), 'session-retry');
  });

  it('低い正答率でも、罰するような音は使わない（不正解音を流用しない）', () => {
    const retry = SOUND_DEFINITIONS[resolveSessionResultEvent(10)];
    // 最後の音が上向きで終わる＝前向きに終わる
    const last = retry.notes[retry.notes.length - 1];
    const first = retry.notes[0];
    assert.ok(last.frequency > first.frequency, '最後は少し上げて前向きに終わること');
  });

  it('無限モードの終了音は回答数で変わる', () => {
    assert.equal(resolveFinishEvent(9), null, '10問未満は鳴らさない');
    assert.equal(resolveFinishEvent(10), 'finish-short');
    assert.equal(resolveFinishEvent(49), 'finish-short');
    assert.equal(resolveFinishEvent(50), 'finish-medium');
    assert.equal(resolveFinishEvent(100), 'finish-long');
  });
});

describe('クールダウン時のフォールバック', () => {
  it('達成音が連続しても、回答のフィードバックが無音にならない', async () => {
    const store = new Map<string, string>();
    const globals = globalThis as unknown as Record<string, unknown>;
    const played: number[] = [];

    class FakeContext {
      state = 'running';
      currentTime = 0;
      destination = {};
      createOscillator() {
        return {
          type: 'sine',
          frequency: {
            setValueAtTime(value: number) {
              played.push(value);
            },
          },
          connect: () => ({ connect() {} }),
          start() {},
          stop() {},
        };
      }
      createGain() {
        return {
          gain: { setValueAtTime() {}, exponentialRampToValueAtTime() {} },
          connect: () => ({ connect() {} }),
        };
      }
      resume() {
        return Promise.resolve();
      }
    }

    globals.window = {
      AudioContext: FakeContext,
      localStorage: {
        getItem: (key: string) => store.get(key) ?? null,
        setItem: (key: string, value: string) => void store.set(key, value),
        removeItem: (key: string) => void store.delete(key),
      },
      addEventListener() {},
      dispatchEvent: () => true,
    };

    const { playSound } = await import('../lib/feedbackFx');

    // 1回目は達成音が鳴る
    assert.equal(playSound('new-record'), true);
    played.length = 0;
    // 直後の2回目はクールダウン中なので、代わりに通常の正解音が鳴る
    assert.equal(playSound('new-record', { fallback: 'correct' }), true);
    assert.ok(played.length > 0, '無音にならないこと');
    assert.deepEqual(
      played.map(Math.round),
      SOUND_DEFINITIONS.correct.notes.map((note) => Math.round(note.frequency)),
    );

    delete globals.window;
  });
});

import assert from 'node:assert/strict';
import { afterEach, beforeEach, describe, it } from 'node:test';

/**
 * スマホの挙動（AudioContext が suspended で作られる）を模した偽の Web Audio で、
 * 効果音が確実に鳴る形で予約されるかを検証する。
 */

interface ScheduledNote {
  frequency: number;
  startAt: number;
  /** 予約した時点の context.currentTime */
  scheduledWhen: number;
}

const scheduled: ScheduledNote[] = [];
let resumeCalls = 0;

class FakeParam {
  setValueAtTime() {
    return this;
  }
  exponentialRampToValueAtTime() {
    return this;
  }
}

class FakeGain {
  gain = new FakeParam();
  connect() {
    return this as unknown as { connect: () => void };
  }
}

class FakeAudioContext {
  /** モジュールは AudioContext を1つ使い回すので、テスト間で状態を戻せるように保持する */
  static last: FakeAudioContext | null = null;

  state: 'suspended' | 'running' = 'suspended';
  currentTime = 0;
  destination = {};
  /** resume が解決するまでの時間を進めるための内部時計 */
  private clock = 0;

  constructor() {
    FakeAudioContext.last = this;
  }

  createOscillator() {
    const context = this;
    let frequency = 0;
    return {
      type: 'sine',
      frequency: {
        setValueAtTime(value: number) {
          frequency = value;
        },
      },
      connect() {
        return { connect() {} };
      },
      start(when: number) {
        scheduled.push({ frequency, startAt: when, scheduledWhen: context.currentTime });
      },
      stop() {},
    };
  }

  createGain() {
    return new FakeGain();
  }

  resume() {
    resumeCalls += 1;
    return new Promise<void>((resolve) => {
      setTimeout(() => {
        // 再開までに時間が進む（ここが「予約が過去になる」原因になっていた）
        this.clock += 0.5;
        this.currentTime = this.clock;
        this.state = 'running';
        resolve();
      }, 10);
    });
  }
}

const store = new Map<string, string>();

function installBrowserGlobals(): void {
  const listeners = new Map<string, () => void>();
  const globals = globalThis as unknown as Record<string, unknown>;
  globals.window = {
    AudioContext: FakeAudioContext,
    localStorage: {
      getItem: (key: string) => store.get(key) ?? null,
      setItem: (key: string, value: string) => void store.set(key, value),
      removeItem: (key: string) => void store.delete(key),
    },
    addEventListener: (type: string, listener: () => void) => void listeners.set(type, listener),
    dispatchEvent: () => true,
  };
  // Node 24 の navigator は上書きできないが、vibrate を持たないため canVibrate() は false になる
  globals.CustomEvent = class {
    constructor(
      public type: string,
      public init?: { detail?: unknown },
    ) {}
  };
}

const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

describe('効果音の再生（スマホの suspended 状態を再現）', () => {
  beforeEach(() => {
    scheduled.length = 0;
    resumeCalls = 0;
    store.clear();
    installBrowserGlobals();
    // スマホで開いた直後と同じ「止まっている」状態から始める
    if (FakeAudioContext.last) {
      FakeAudioContext.last.state = 'suspended';
    }
  });

  afterEach(() => {
    const globals = globalThis as unknown as Record<string, unknown>;
    delete globals.window;
    delete globals.CustomEvent;
  });

  it('suspended のときは、再開が終わってから未来の時刻に予約する', async () => {
    const { playFeedback } = await import('../lib/feedbackFx');

    playFeedback('correct');

    // 再開待ちの時点では、まだ1音も予約されていない
    assert.equal(resumeCalls, 1);
    assert.equal(scheduled.length, 0, '再開前に予約すると無音になる');

    await wait(40);

    assert.ok(scheduled.length >= 2, '再開後にチャイムが予約されること');
    for (const note of scheduled) {
      assert.ok(
        note.startAt > note.scheduledWhen,
        `予約時刻が過去になっている（${note.startAt} <= ${note.scheduledWhen}）`,
      );
    }
  });

  it('サウンドOFFのときは音を予約しない', async () => {
    const { playFeedback, FEEDBACK_SETTINGS_KEY } = await import('../lib/feedbackFx');
    store.set(FEEDBACK_SETTINGS_KEY, JSON.stringify({ version: 1, sound: false, vibration: false }));

    playFeedback('wrong');
    await wait(40);

    assert.equal(scheduled.length, 0);
  });

  it('primeAudio は音を鳴らさずに再開だけ行う', async () => {
    const { primeAudio } = await import('../lib/feedbackFx');

    primeAudio();
    await wait(40);

    assert.ok(resumeCalls >= 1, '先に再開しておくこと');
    assert.equal(scheduled.length, 0, 'prime では音を出さない');
  });
});

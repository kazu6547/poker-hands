import {
  IMPORTANT_PRIORITY,
  IMPORTANT_QUIET_MS,
  SOUND_DEFINITIONS,
  SoundEvent,
  SoundNote,
} from './soundEvents';

/**
 * 効果音と振動のフィードバック。
 *
 * - 音は Web Audio API で生成する（外部ファイル・外部APIに依存しない）
 * - 再生できない環境でもゲームが止まらないよう、すべて try/catch で握りつぶす
 * - SSR では window / navigator に触らない
 * - 実際に鳴らすのはユーザー操作のハンドラ内だけなので、自動再生制限に抵触しない
 */

export interface FeedbackSettings {
  version: number;
  sound: boolean;
  vibration: boolean;
}

export const FEEDBACK_SETTINGS_KEY = 'poker-hands-trainer:settings';
export const FEEDBACK_SETTINGS_EVENT = 'pht:feedback-settings';
export const FEEDBACK_SETTINGS_VERSION = 1;

export const DEFAULT_FEEDBACK_SETTINGS: FeedbackSettings = {
  version: FEEDBACK_SETTINGS_VERSION,
  sound: true,
  vibration: true,
};

/** 保存データが壊れていても既定値で復帰する */
export function normalizeFeedbackSettings(raw: unknown): FeedbackSettings {
  if (!raw || typeof raw !== 'object') return { ...DEFAULT_FEEDBACK_SETTINGS };
  const source = raw as Partial<FeedbackSettings>;
  return {
    version: FEEDBACK_SETTINGS_VERSION,
    sound: typeof source.sound === 'boolean' ? source.sound : true,
    vibration: typeof source.vibration === 'boolean' ? source.vibration : true,
  };
}

export function loadFeedbackSettings(): FeedbackSettings {
  if (typeof window === 'undefined') return { ...DEFAULT_FEEDBACK_SETTINGS };
  try {
    const stored = window.localStorage.getItem(FEEDBACK_SETTINGS_KEY);
    if (!stored) return { ...DEFAULT_FEEDBACK_SETTINGS };
    return normalizeFeedbackSettings(JSON.parse(stored));
  } catch {
    return { ...DEFAULT_FEEDBACK_SETTINGS };
  }
}

export function saveFeedbackSettings(settings: FeedbackSettings): void {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(FEEDBACK_SETTINGS_KEY, JSON.stringify(settings));
    window.dispatchEvent(new CustomEvent<FeedbackSettings>(FEEDBACK_SETTINGS_EVENT, { detail: settings }));
  } catch {
    // 保存できなくても、その場の設定は動く
  }
}

/** この端末が振動に対応しているか */
export function canVibrate(): boolean {
  if (typeof navigator === 'undefined') return false;
  return typeof navigator.vibrate === 'function';
}

/* ------------------------------------------------------------------ */
/* 音の生成                                                            */
/* ------------------------------------------------------------------ */

type AudioContextConstructor = new () => AudioContext;

/** 予約を少しだけ先に置くための余裕（秒） */
const SCHEDULE_LEAD_SEC = 0.03;

let audioContext: AudioContext | null = null;

/** AudioContext を用意する（再開はしない） */
function getAudioContext(): AudioContext | null {
  if (typeof window === 'undefined') return null;
  try {
    const holder = window as unknown as {
      AudioContext?: AudioContextConstructor;
      webkitAudioContext?: AudioContextConstructor;
    };
    const Ctor = holder.AudioContext ?? holder.webkitAudioContext;
    if (!Ctor) return null;
    if (!audioContext) audioContext = new Ctor();
    return audioContext;
  } catch {
    return null;
  }
}

/** 音を実際に組み立てて鳴らす。context は再生可能な状態であること */
function scheduleNotes(context: AudioContext, notes: readonly SoundNote[], gain: number): void {
  try {
    // 現在時刻ちょうどに置くと先頭が欠ける端末があるため、少しだけ先に予約する
    const now = context.currentTime + SCHEDULE_LEAD_SEC;
    for (const note of notes) {
      const oscillator = context.createOscillator();
      const gainNode = context.createGain();
      const startAt = now + note.start;
      const peak = Math.max(gain * (note.level ?? 1), 0.001);

      oscillator.type = note.type ?? 'sine';
      oscillator.frequency.setValueAtTime(note.frequency, startAt);

      gainNode.gain.setValueAtTime(0.0001, startAt);
      gainNode.gain.exponentialRampToValueAtTime(peak, startAt + 0.015);
      gainNode.gain.exponentialRampToValueAtTime(0.0001, startAt + note.duration);

      oscillator.connect(gainNode).connect(context.destination);
      oscillator.start(startAt);
      oscillator.stop(startAt + note.duration + 0.03);
    }
  } catch {
    // 音が出せなくても進行に影響させない
  }
}

/** 動きを控えたい設定のときは、音の刺激も少し抑える */
function volumeScale(): number {
  if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') return 1;
  try {
    return window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 0.7 : 1;
  } catch {
    return 1;
  }
}

function playNotes(notes: readonly SoundNote[], gain: number): void {
  const context = getAudioContext();
  if (!context) return;

  const scaledGain = gain * volumeScale();

  if (context.state === 'running') {
    scheduleNotes(context, notes, scaledGain);
    return;
  }

  /*
   * スマホでは AudioContext が suspended の状態で作られる。
   * resume() は非同期なので、完了を待たずに予約すると
   * 「再開後には予約時刻が過去になっている」＝無音になる。
   * そのため、再開してから改めて予約する。
   */
  try {
    void context
      .resume()
      .then(() => scheduleNotes(context, notes, scaledGain))
      .catch(() => {});
  } catch {
    // 再開できない環境では何もしない
  }
}

/**
 * 音を出せる状態にしておく。
 * 最初のタップやキー操作の時点で AudioContext を作って再開しておくことで、
 * 正解・不正解の瞬間に「無音になる」のを防ぐ。
 */
export function primeAudio(): void {
  const context = getAudioContext();
  if (!context || context.state === 'running') return;
  try {
    void context.resume().catch(() => {});
  } catch {
    // 何もしない
  }
}

function vibrate(pattern: readonly number[] | undefined): void {
  if (!pattern || !canVibrate()) return;

  // ユーザー操作前の呼び出しはブラウザにブロックされるため、その場合は何もしない
  const activation = navigator.userActivation;
  if (activation && !activation.hasBeenActive) return;

  try {
    navigator.vibrate([...pattern]);
  } catch {
    // 非対応・拒否されても何もしない
  }
}

/** 同じ音の連打と、重要な音への被りを防ぐための記録 */
const lastPlayedAt = new Map<SoundEvent, number>();
let lastImportantAt = 0;

export interface PlaySoundOptions {
  /**
   * 本命の音がクールダウン中だったときに代わりに鳴らす音。
   * 達成音が連続したときでも、回答のフィードバックが無音にならないようにする。
   */
  fallback?: SoundEvent;
}

/**
 * 効果音（と対応端末では振動）を鳴らす。
 * - サウンドOFFなら何も鳴らさない
 * - 同じ音はクールダウン中は鳴らさない（必要なら fallback で代替する）
 * - 重要な音の直後は、カード操作のような軽い音を鳴らさない
 *
 * @returns 実際に鳴らしたか（サウンドOFFでも「鳴らす判断をした」なら true）
 */
export function playSound(event: SoundEvent, options: PlaySoundOptions = {}): boolean {
  if (typeof window === 'undefined') return false;

  const definition = SOUND_DEFINITIONS[event];
  if (!definition) return false;

  const now = Date.now();
  if (now - (lastPlayedAt.get(event) ?? 0) < definition.cooldownMs) {
    // 連続で同じ達成音が来たときは、通常の正誤音に控えめに置き換える
    if (options.fallback && options.fallback !== event) {
      return playSound(options.fallback);
    }
    return false;
  }

  const isImportant = definition.priority >= IMPORTANT_PRIORITY;
  if (!isImportant && now - lastImportantAt < IMPORTANT_QUIET_MS) return false;

  lastPlayedAt.set(event, now);
  if (isImportant) lastImportantAt = now;

  const settings = loadFeedbackSettings();
  if (settings.sound) playNotes(definition.notes, definition.gain);
  if (settings.vibration) vibrate(definition.vibration);
  return true;
}

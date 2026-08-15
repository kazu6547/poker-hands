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

export type FeedbackKind = 'correct' | 'wrong' | 'select' | 'next';

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

interface Note {
  frequency: number;
  /** 再生開始の相対時間（秒） */
  start: number;
  duration: number;
  gain?: number;
  type?: OscillatorType;
}

/** 上品でポップに聞こえる短い音。音量は控えめに固定する */
const PATTERNS: Record<FeedbackKind, Note[]> = {
  // 明るい上昇チャイム（ソ → ド）
  correct: [
    { frequency: 784, start: 0, duration: 0.12 },
    { frequency: 1046.5, start: 0.085, duration: 0.2 },
  ],
  // 責めない柔らかい下降音
  wrong: [
    { frequency: 330, start: 0, duration: 0.14, type: 'triangle', gain: 0.05 },
    { frequency: 247, start: 0.1, duration: 0.2, type: 'triangle', gain: 0.045 },
  ],
  select: [{ frequency: 880, start: 0, duration: 0.045, gain: 0.025 }],
  next: [{ frequency: 587.3, start: 0, duration: 0.07, gain: 0.03 }],
};

const VIBRATION_PATTERNS: Record<FeedbackKind, number[] | null> = {
  correct: [14, 45, 14],
  wrong: [28],
  select: null,
  next: null,
};

type AudioContextConstructor = new () => AudioContext;

let audioContext: AudioContext | null = null;

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
    // 自動再生制限で止まっている場合は、ユーザー操作のタイミングで再開する
    if (audioContext.state === 'suspended') void audioContext.resume();
    return audioContext;
  } catch {
    return null;
  }
}

function playSound(kind: FeedbackKind): void {
  const context = getAudioContext();
  if (!context) return;

  try {
    const now = context.currentTime;
    for (const note of PATTERNS[kind]) {
      const oscillator = context.createOscillator();
      const gainNode = context.createGain();
      const startAt = now + note.start;
      const peak = note.gain ?? 0.06;

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

function vibrate(kind: FeedbackKind): void {
  const pattern = VIBRATION_PATTERNS[kind];
  if (!pattern || !canVibrate()) return;

  // ユーザー操作前の呼び出しはブラウザにブロックされるため、その場合は何もしない
  const activation = navigator.userActivation;
  if (activation && !activation.hasBeenActive) return;

  try {
    navigator.vibrate(pattern);
  } catch {
    // 非対応・拒否されても何もしない
  }
}

/** 同じ結果表示で二重に鳴らさないためのガード */
const lastPlayedAt = new Map<FeedbackKind, number>();
const REPEAT_GUARD_MS = 250;

export function playFeedback(kind: FeedbackKind): void {
  if (typeof window === 'undefined') return;

  const now = Date.now();
  if (now - (lastPlayedAt.get(kind) ?? 0) < REPEAT_GUARD_MS) return;
  lastPlayedAt.set(kind, now);

  const settings = loadFeedbackSettings();
  if (settings.sound) playSound(kind);
  if (settings.vibration) vibrate(kind);
}

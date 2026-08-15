/**
 * 効果音の定義（データのみ）。
 * 音を「いつ鳴らすか」の判定は achievements.ts、実際の再生は feedbackFx.ts が担当する。
 *
 * 設計方針
 * - 明るいベル／マリンバ寄りの音色。カジノ的な派手さは避ける
 * - 1つの音は 0.05〜0.8 秒に収める
 * - 重要な音ほど priority を高くし、低い音は重ならないよう抑制する
 */

export type SoundEvent =
  // ゲーム開始（モードごとに音程を変える）
  | 'game-start-quiz'
  | 'game-start-build'
  | 'game-start-compare'
  | 'game-start-best-five'
  // カード操作
  | 'card-select'
  | 'card-deselect'
  // 基本の進行
  | 'correct'
  | 'incorrect'
  | 'next-question'
  // 連続正解ボーナス
  | 'streak-3'
  | 'streak-5'
  | 'streak-10'
  // 10問セットの結果
  | 'session-excellent'
  | 'session-good'
  | 'session-continue'
  | 'session-retry'
  // 無限モードの節目
  | 'milestone-10'
  | 'milestone-25'
  | 'milestone-50'
  | 'milestone-100'
  // 自己ベスト・累計達成
  | 'new-record'
  // 無限モードの終了（回答数で使い分ける）
  | 'finish-short'
  | 'finish-medium'
  | 'finish-long'
  // 設定でサウンドをONにしたときの試聴
  | 'sound-enabled';

export interface SoundNote {
  frequency: number;
  /** 音の開始位置（秒） */
  start: number;
  duration: number;
  type?: OscillatorType;
  /** 個別の音量倍率（既定は1） */
  level?: number;
}

export interface SoundDefinition {
  notes: SoundNote[];
  /** 基準音量。カード操作は極小、達成音でも 0.09 を超えない */
  gain: number;
  /** 同じ音を鳴らせるようになるまでの間隔 */
  cooldownMs: number;
  /** 大きいほど重要。低い音は重要な音の直後には鳴らさない */
  priority: number;
  /** 対応端末での振動パターン */
  vibration?: number[];
}

/** これ以上の priority を「重要な音」として扱い、直後の軽い音を抑制する */
export const IMPORTANT_PRIORITY = 50;
/** 重要な音のあと、軽い音を鳴らさない時間 */
export const IMPORTANT_QUIET_MS = 350;

const bell = (frequency: number, start: number, duration = 0.16): SoundNote => ({
  frequency,
  start,
  duration,
});

export const SOUND_DEFINITIONS: Record<SoundEvent, SoundDefinition> = {
  /* ------------------------------------------------ ゲーム開始 */
  'game-start-quiz': {
    notes: [bell(523.25, 0, 0.1), bell(659.25, 0.07, 0.1), bell(783.99, 0.14, 0.2)],
    gain: 0.045,
    cooldownMs: 600,
    priority: 30,
  },
  'game-start-build': {
    notes: [bell(587.33, 0, 0.1), bell(739.99, 0.07, 0.1), bell(880, 0.14, 0.2)],
    gain: 0.045,
    cooldownMs: 600,
    priority: 30,
  },
  'game-start-compare': {
    notes: [bell(659.25, 0, 0.1), bell(830.61, 0.07, 0.1), bell(987.77, 0.14, 0.2)],
    gain: 0.045,
    cooldownMs: 600,
    priority: 30,
  },
  'game-start-best-five': {
    notes: [bell(783.99, 0, 0.1), bell(987.77, 0.07, 0.1), bell(1174.66, 0.14, 0.2)],
    gain: 0.045,
    cooldownMs: 600,
    priority: 30,
  },

  /* ------------------------------------------------ カード操作（ごく控えめ） */
  'card-select': {
    notes: [{ frequency: 987.77, start: 0, duration: 0.07 }],
    gain: 0.022,
    cooldownMs: 80,
    priority: 10,
  },
  'card-deselect': {
    notes: [{ frequency: 659.25, start: 0, duration: 0.06 }],
    gain: 0.018,
    cooldownMs: 80,
    priority: 10,
  },

  /* ------------------------------------------------ 基本の進行 */
  correct: {
    notes: [bell(783.99, 0, 0.12), bell(1046.5, 0.085, 0.2)],
    gain: 0.06,
    cooldownMs: 250,
    priority: 50,
    vibration: [14, 45, 14],
  },
  incorrect: {
    notes: [
      { frequency: 329.63, start: 0, duration: 0.14, type: 'triangle' },
      { frequency: 246.94, start: 0.1, duration: 0.2, type: 'triangle', level: 0.9 },
    ],
    gain: 0.05,
    cooldownMs: 250,
    priority: 50,
    vibration: [28],
  },
  'next-question': {
    notes: [{ frequency: 587.33, start: 0, duration: 0.07 }],
    gain: 0.03,
    cooldownMs: 200,
    priority: 30,
  },

  /* ------------------------------------------------ 連続正解ボーナス */
  'streak-3': {
    notes: [bell(1046.5, 0, 0.09), bell(1318.51, 0.07, 0.16)],
    gain: 0.055,
    cooldownMs: 400,
    priority: 60,
    vibration: [14, 45, 14],
  },
  'streak-5': {
    notes: [bell(1046.5, 0, 0.09), bell(1318.51, 0.07, 0.09), bell(1567.98, 0.14, 0.22)],
    gain: 0.06,
    cooldownMs: 400,
    priority: 70,
    vibration: [14, 40, 14, 40, 14],
  },
  'streak-10': {
    notes: [
      bell(783.99, 0, 0.09),
      bell(1046.5, 0.07, 0.09),
      bell(1318.51, 0.14, 0.09),
      bell(1567.98, 0.21, 0.3),
    ],
    gain: 0.07,
    cooldownMs: 500,
    priority: 80,
    vibration: [16, 40, 16, 40, 24],
  },

  /* ------------------------------------------------ 10問セットの結果 */
  'session-excellent': {
    notes: [
      bell(523.25, 0, 0.1),
      bell(659.25, 0.08, 0.1),
      bell(783.99, 0.16, 0.1),
      bell(1046.5, 0.24, 0.16),
      bell(1567.98, 0.36, 0.34),
    ],
    gain: 0.08,
    cooldownMs: 1200,
    priority: 90,
    vibration: [18, 40, 18, 40, 30],
  },
  'session-good': {
    notes: [bell(659.25, 0, 0.1), bell(880, 0.08, 0.1), bell(1174.66, 0.16, 0.3)],
    gain: 0.07,
    cooldownMs: 1200,
    priority: 85,
    vibration: [16, 45, 16],
  },
  'session-continue': {
    notes: [bell(587.33, 0, 0.12), bell(783.99, 0.1, 0.26)],
    gain: 0.055,
    cooldownMs: 1200,
    priority: 85,
  },
  'session-retry': {
    notes: [
      { frequency: 392, start: 0, duration: 0.14, type: 'triangle' },
      { frequency: 349.23, start: 0.12, duration: 0.14, type: 'triangle' },
      // 最後だけわずかに上げて前向きに終わる
      bell(523.25, 0.26, 0.24),
    ],
    gain: 0.05,
    cooldownMs: 1200,
    priority: 85,
  },

  /* ------------------------------------------------ 無限モードの節目 */
  'milestone-10': {
    notes: [bell(880, 0, 0.18)],
    gain: 0.045,
    cooldownMs: 800,
    priority: 65,
  },
  'milestone-25': {
    notes: [bell(880, 0, 0.1), bell(1046.5, 0.08, 0.22)],
    gain: 0.055,
    cooldownMs: 800,
    priority: 68,
    vibration: [14, 45, 14],
  },
  'milestone-50': {
    notes: [bell(783.99, 0, 0.1), bell(987.77, 0.08, 0.1), bell(1318.51, 0.16, 0.28)],
    gain: 0.065,
    cooldownMs: 800,
    priority: 72,
    vibration: [16, 40, 16, 40, 16],
  },
  'milestone-100': {
    notes: [
      bell(659.25, 0, 0.09),
      bell(880, 0.07, 0.09),
      bell(1174.66, 0.14, 0.09),
      bell(1567.98, 0.21, 0.14),
      bell(1975.53, 0.32, 0.3),
    ],
    gain: 0.085,
    cooldownMs: 1500,
    priority: 100,
    vibration: [20, 40, 20, 40, 34],
  },

  /* ------------------------------------------------ 自己ベスト・累計達成 */
  'new-record': {
    notes: [
      bell(1046.5, 0, 0.1),
      bell(1318.51, 0.08, 0.1),
      bell(1567.98, 0.16, 0.12),
      bell(2093, 0.26, 0.28),
    ],
    gain: 0.08,
    cooldownMs: 1200,
    priority: 95,
    vibration: [18, 40, 18, 40, 28],
  },

  /* ------------------------------------------------ 無限モードの終了 */
  'finish-short': {
    notes: [bell(587.33, 0, 0.12), bell(440, 0.1, 0.24)],
    gain: 0.05,
    cooldownMs: 1000,
    priority: 85,
  },
  'finish-medium': {
    notes: [bell(659.25, 0, 0.12), bell(880, 0.1, 0.26)],
    gain: 0.06,
    cooldownMs: 1000,
    priority: 85,
  },
  'finish-long': {
    notes: [bell(783.99, 0, 0.1), bell(1046.5, 0.08, 0.1), bell(1318.51, 0.16, 0.3)],
    gain: 0.07,
    cooldownMs: 1000,
    priority: 88,
    vibration: [16, 45, 16],
  },

  /* ------------------------------------------------ 設定の試聴 */
  'sound-enabled': {
    notes: [bell(880, 0, 0.09), bell(1174.66, 0.07, 0.16)],
    gain: 0.05,
    cooldownMs: 400,
    priority: 40,
  },
};

/** その音が鳴り終わるまでの長さ（秒） */
export function soundDurationSec(event: SoundEvent): number {
  return SOUND_DEFINITIONS[event].notes.reduce(
    (longest, note) => Math.max(longest, note.start + note.duration),
    0,
  );
}

import { HAND_IDS, HandId, HandStat, ModeStat, ProgressData, StatModeId } from './types';

/**
 * 学習記録（localStorage）。
 *
 * 保存形式が変わっても壊れないよう、読み込み時に必ず既定値とマージする。
 * version 1（VSカード・最強の5枚 が無い形式）で保存されたデータも、
 * そのまま読み込んで不足分を 0 で補う。
 */

export const PROGRESS_STORAGE_KEY = 'poker-hands-trainer:progress';
export const PROGRESS_VERSION = 2;

function createEmptyHandStats(): Record<HandId, HandStat> {
  return HAND_IDS.reduce(
    (accumulator, handId) => {
      accumulator[handId] = { attempts: 0, correct: 0 };
      return accumulator;
    },
    {} as Record<HandId, HandStat>,
  );
}

function createEmptyModeStat(): ModeStat {
  return { attempts: 0, correct: 0 };
}

export function createEmptyProgress(): ProgressData {
  return {
    version: PROGRESS_VERSION,
    totalAnswers: 0,
    totalCorrect: 0,
    currentStreak: 0,
    bestStreak: 0,
    handStats: createEmptyHandStats(),
    buildAttempts: 0,
    buildCleared: 0,
    compare: createEmptyModeStat(),
    bestFive: createEmptyModeStat(),
    lastStudiedAt: null,
  };
}

function toCount(value: unknown): number {
  return typeof value === 'number' && Number.isFinite(value) && value >= 0 ? Math.floor(value) : 0;
}

function normalizeModeStat(value: unknown): ModeStat {
  if (!value || typeof value !== 'object') return createEmptyModeStat();
  const source = value as Partial<ModeStat>;
  return { attempts: toCount(source.attempts), correct: toCount(source.correct) };
}

/** 保存データを既定値とマージして、欠けている項目・壊れた項目を補う */
export function normalizeProgress(raw: unknown): ProgressData {
  if (!raw || typeof raw !== 'object') return createEmptyProgress();

  const source = raw as Partial<ProgressData>;
  const handStats = createEmptyHandStats();

  if (source.handStats && typeof source.handStats === 'object') {
    for (const handId of HAND_IDS) {
      const stat = source.handStats[handId];
      if (stat && typeof stat === 'object') {
        handStats[handId] = { attempts: toCount(stat.attempts), correct: toCount(stat.correct) };
      }
    }
  }

  return {
    version: PROGRESS_VERSION,
    totalAnswers: toCount(source.totalAnswers),
    totalCorrect: toCount(source.totalCorrect),
    currentStreak: toCount(source.currentStreak),
    bestStreak: toCount(source.bestStreak),
    handStats,
    buildAttempts: toCount(source.buildAttempts),
    buildCleared: toCount(source.buildCleared),
    compare: normalizeModeStat(source.compare),
    bestFive: normalizeModeStat(source.bestFive),
    lastStudiedAt: typeof source.lastStudiedAt === 'string' ? source.lastStudiedAt : null,
  };
}

export function loadProgress(): ProgressData {
  if (typeof window === 'undefined') return createEmptyProgress();
  try {
    const stored = window.localStorage.getItem(PROGRESS_STORAGE_KEY);
    if (!stored) return createEmptyProgress();
    return normalizeProgress(JSON.parse(stored));
  } catch {
    return createEmptyProgress();
  }
}

export function saveProgress(progress: ProgressData): void {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(PROGRESS_STORAGE_KEY, JSON.stringify(progress));
  } catch {
    // 保存できない環境（プライベートモードなど）でも学習は続けられるようにする
  }
}

export function clearProgress(): void {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.removeItem(PROGRESS_STORAGE_KEY);
  } catch {
    // 何もしない
  }
}

/* ------------------------------------------------------------------ */
/* 更新（純関数）                                                       */
/* ------------------------------------------------------------------ */

/** 全モード共通の集計（累計回答数・正答数・連続正解）を進める */
function applyAnswer(progress: ProgressData, isCorrect: boolean): ProgressData {
  const currentStreak = isCorrect ? progress.currentStreak + 1 : 0;
  return {
    ...progress,
    totalAnswers: progress.totalAnswers + 1,
    totalCorrect: progress.totalCorrect + (isCorrect ? 1 : 0),
    currentStreak,
    bestStreak: Math.max(progress.bestStreak, currentStreak),
    lastStudiedAt: new Date().toISOString(),
  };
}

/** 「役を当てる」：全体の集計に加えて、役ごとの成績も更新する */
export function applyQuizAnswer(
  progress: ProgressData,
  handId: HandId,
  isCorrect: boolean,
): ProgressData {
  const previous = progress.handStats[handId] ?? { attempts: 0, correct: 0 };
  return {
    ...applyAnswer(progress, isCorrect),
    handStats: {
      ...progress.handStats,
      [handId]: {
        attempts: previous.attempts + 1,
        correct: previous.correct + (isCorrect ? 1 : 0),
      },
    },
  };
}

/** 「VSカード」「最強の5枚」：全体の集計＋モードごとの成績 */
export function applyModeAnswer(
  progress: ProgressData,
  mode: StatModeId,
  isCorrect: boolean,
): ProgressData {
  const previous = progress[mode] ?? { attempts: 0, correct: 0 };
  return {
    ...applyAnswer(progress, isCorrect),
    [mode]: {
      attempts: previous.attempts + 1,
      correct: previous.correct + (isCorrect ? 1 : 0),
    },
  };
}

/** 「役を作る」：答え合わせの回数と成功数だけを記録する */
export function applyBuildResult(progress: ProgressData, isCleared: boolean): ProgressData {
  return {
    ...progress,
    buildAttempts: progress.buildAttempts + 1,
    buildCleared: progress.buildCleared + (isCleared ? 1 : 0),
    lastStudiedAt: new Date().toISOString(),
  };
}

/* ------------------------------------------------------------------ */
/* 表示用ヘルパー                                                       */
/* ------------------------------------------------------------------ */

export function accuracyPercent(correct: number, total: number): number {
  if (total <= 0) return 0;
  return Math.round((correct / total) * 100);
}

export function formatStudiedAt(iso: string | null): string {
  if (!iso) return '記録なし';
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return '記録なし';
  return new Intl.DateTimeFormat('ja-JP', {
    month: 'numeric',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(date);
}

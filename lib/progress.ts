import { HAND_IDS, HandId, HandStat, ModeStat, ProgressData, StatModeId } from './types';

/**
 * 学習記録（localStorage）。
 *
 * 保存形式が変わっても壊れないよう、読み込み時に必ず既定値とマージする。
 * version 1（VSカード・最強の5枚 が無い形式）で保存されたデータも、
 * そのまま読み込んで不足分を 0 で補う。
 */

export const PROGRESS_STORAGE_KEY = 'poker-hands-trainer:progress';
export const PROGRESS_VERSION = 3;

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
    lastStudyDate: null,
    studyStreakDays: 0,
    bestStudyStreakDays: 0,
  };
}

/** YYYY-MM-DD 形式かどうか */
function isDateKey(value: unknown): value is string {
  return typeof value === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(value);
}

/** 端末のローカル日付を YYYY-MM-DD で返す */
export function toDateKey(date: Date): string {
  const year = date.getFullYear();
  const month = `${date.getMonth() + 1}`.padStart(2, '0');
  const day = `${date.getDate()}`.padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/** 2つの日付キーの差（日数）。同じ日なら 0 */
export function dayDifference(from: string, to: string): number {
  const start = new Date(`${from}T00:00:00`).getTime();
  const end = new Date(`${to}T00:00:00`).getTime();
  return Math.round((end - start) / 86_400_000);
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
    lastStudyDate: isDateKey(source.lastStudyDate) ? source.lastStudyDate : null,
    studyStreakDays: toCount(source.studyStreakDays),
    bestStudyStreakDays: toCount(source.bestStudyStreakDays),
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

/**
 * 学習した日を記録し、連続学習日数を更新する。
 * 同じ日に何度学習しても1日として数え、1日空くとリセットする。
 */
function applyStudyDay(progress: ProgressData, now: Date): Pick<
  ProgressData,
  'lastStudiedAt' | 'lastStudyDate' | 'studyStreakDays' | 'bestStudyStreakDays'
> {
  const today = toDateKey(now);
  const previous = progress.lastStudyDate;

  let studyStreakDays: number;
  if (previous === today) {
    studyStreakDays = Math.max(progress.studyStreakDays, 1);
  } else if (previous && dayDifference(previous, today) === 1) {
    studyStreakDays = progress.studyStreakDays + 1;
  } else {
    studyStreakDays = 1;
  }

  return {
    lastStudiedAt: now.toISOString(),
    lastStudyDate: today,
    studyStreakDays,
    bestStudyStreakDays: Math.max(progress.bestStudyStreakDays, studyStreakDays),
  };
}

/** 全モード共通の集計（累計回答数・正答数・連続正解・連続学習日数）を進める */
function applyAnswer(progress: ProgressData, isCorrect: boolean): ProgressData {
  const currentStreak = isCorrect ? progress.currentStreak + 1 : 0;
  return {
    ...progress,
    totalAnswers: progress.totalAnswers + 1,
    totalCorrect: progress.totalCorrect + (isCorrect ? 1 : 0),
    currentStreak,
    bestStreak: Math.max(progress.bestStreak, currentStreak),
    ...applyStudyDay(progress, new Date()),
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
    ...applyStudyDay(progress, new Date()),
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

/**
 * 画面に出す連続学習日数。
 * 今日か昨日まで続いていれば「継続中」、それより前で止まっていれば 0 にする。
 */
export function currentStudyStreak(progress: ProgressData, now: Date = new Date()): number {
  if (!progress.lastStudyDate) return 0;
  const diff = dayDifference(progress.lastStudyDate, toDateKey(now));
  return diff === 0 || diff === 1 ? progress.studyStreakDays : 0;
}

export interface WeakHand {
  handId: HandId;
  stat: HandStat;
  accuracy: number;
}

/**
 * 苦手な役（正答率が低い順）。
 * 出題が少なすぎる役は判断できないので、既定では2回以上答えた役だけを対象にする。
 */
export function weakestHands(progress: ProgressData, limit = 3, minAttempts = 2): WeakHand[] {
  return HAND_IDS.map((handId) => {
    const stat = progress.handStats[handId] ?? { attempts: 0, correct: 0 };
    return { handId, stat, accuracy: accuracyPercent(stat.correct, stat.attempts) };
  })
    .filter((entry) => entry.stat.attempts >= minAttempts && entry.accuracy < 100)
    .sort((a, b) => a.accuracy - b.accuracy || b.stat.attempts - a.stat.attempts)
    .slice(0, limit);
}

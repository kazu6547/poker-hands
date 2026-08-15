import { SoundEvent } from './soundEvents';

/**
 * 「どの音を鳴らし、何を褒めるか」を決める純粋な判定。
 * 再生や localStorage には触れないので、そのままテストできる。
 *
 * 1回の回答で複数の条件を満たしても、いちばん重要なものを1つだけ返す。
 */

export interface AchievementNotice {
  title: string;
  detail?: string;
}

export interface AnswerFeedback {
  event: SoundEvent;
  notice?: AchievementNotice;
}

export interface AnswerContext {
  isCorrect: boolean;
  /** この回答を含めた、今回のセッションの連続正解数 */
  streak: number;
  /** この回答を含めた、今回のセッションの回答数（1始まり） */
  answeredCount: number;
  isEndless: boolean;
  /** 回答前の自己ベスト（連続正解） */
  previousBestStreak: number;
  /** 回答前の累計回答数 */
  previousTotalAnswers: number;
}

/** 無限モードで節目にする回答数 */
export function endlessMilestone(answeredCount: number): 10 | 25 | 50 | 100 | null {
  if (answeredCount <= 0) return null;
  if (answeredCount % 100 === 0) return 100;
  if (answeredCount === 50) return 50;
  if (answeredCount === 25) return 25;
  if (answeredCount === 10) return 10;
  return null;
}

/** 累計回答数の節目（100・500・1,000、以降1,000ごと） */
export function totalAnswersMilestone(total: number): number | null {
  if (total === 100 || total === 500) return total;
  if (total >= 1000 && total % 1000 === 0) return total;
  return null;
}

/**
 * 1回の回答に対する音と称賛を決める。
 * 優先順位：100問達成 → 自己ベスト更新 → 連続正解の節目 → 回答数の節目 → 累計の節目 → 通常の正誤
 */
export function resolveAnswerFeedback(context: AnswerContext): AnswerFeedback {
  const { isCorrect, streak, answeredCount, isEndless, previousBestStreak } = context;
  const milestone = isEndless ? endlessMilestone(answeredCount) : null;
  const totalAnswers = context.previousTotalAnswers + 1;

  // 1. 100問ごとの大きな節目
  if (milestone === 100) {
    return {
      event: 'milestone-100',
      notice: { title: `${answeredCount}問達成！`, detail: 'よく続けています' },
    };
  }

  // 2. 自己ベスト更新（3連続以上から称える）
  if (isCorrect && streak >= 3 && streak > previousBestStreak) {
    return {
      event: 'new-record',
      notice: { title: '自己ベスト更新！', detail: `連続正解：${streak}回` },
    };
  }

  // 3. 連続正解の節目（3・5・10、以降10ごと）
  if (isCorrect) {
    if (streak >= 10 && streak % 10 === 0) {
      return { event: 'streak-10', notice: { title: `${streak}連続正解！` } };
    }
    if (streak === 5) {
      return { event: 'streak-5', notice: { title: '5連続正解！' } };
    }
    if (streak === 3) {
      return { event: 'streak-3', notice: { title: '3連続正解！' } };
    }
  }

  // 4. 無限モードの回答数の節目
  if (milestone === 50 || milestone === 25 || milestone === 10) {
    return {
      event: `milestone-${milestone}` as SoundEvent,
      notice: { title: `${answeredCount}問達成` },
    };
  }

  // 5. 累計回答数の節目
  const totalMilestone = totalAnswersMilestone(totalAnswers);
  if (totalMilestone) {
    return {
      event: 'new-record',
      notice: { title: `累計${totalMilestone.toLocaleString('ja-JP')}問達成！` },
    };
  }

  // 6. 通常の正誤
  return { event: isCorrect ? 'correct' : 'incorrect' };
}

/** 10問セットの結果画面で鳴らす音（正答率で使い分ける） */
export function resolveSessionResultEvent(accuracyPercent: number): SoundEvent {
  if (accuracyPercent >= 90) return 'session-excellent';
  if (accuracyPercent >= 70) return 'session-good';
  if (accuracyPercent >= 40) return 'session-continue';
  return 'session-retry';
}

/** 無限モードを終了したときの振り返り音（回答が少なければ鳴らさない） */
export function resolveFinishEvent(answeredCount: number): SoundEvent | null {
  if (answeredCount >= 100) return 'finish-long';
  if (answeredCount >= 50) return 'finish-medium';
  if (answeredCount >= 10) return 'finish-short';
  return null;
}

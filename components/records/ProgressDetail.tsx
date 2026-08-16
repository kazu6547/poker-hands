'use client';

import { useState } from 'react';
import { Award, CalendarCheck, CheckCircle2, Flame, RotateCcw } from 'lucide-react';
import { WeakHands } from './WeakHands';
import { HANDS_BY_ID } from '@/data/hands';
import { useProgress } from '@/hooks/useProgress';
import { cn } from '@/lib/cn';
import { accuracyPercent, currentStudyStreak, formatStudiedAt } from '@/lib/progress';
import { HAND_IDS, ProgressData } from '@/lib/types';

/** モードごとの成績。保存済みの数値をそのまま読むだけで、集計はしない */
function modeRows(progress: ProgressData) {
  return [
    {
      key: 'quiz',
      name: '役を当てる',
      attempts: HAND_IDS.reduce((total, handId) => total + progress.handStats[handId].attempts, 0),
      correct: HAND_IDS.reduce((total, handId) => total + progress.handStats[handId].correct, 0),
      correctLabel: '正解',
    },
    {
      key: 'build',
      name: '役を作る',
      attempts: progress.buildAttempts,
      correct: progress.buildCleared,
      correctLabel: '成功',
    },
    {
      key: 'compare',
      name: 'VSカード',
      attempts: progress.compare.attempts,
      correct: progress.compare.correct,
      correctLabel: '正解',
    },
    {
      key: 'bestFive',
      name: '最強の5枚',
      attempts: progress.bestFive.attempts,
      correct: progress.bestFive.correct,
      correctLabel: '正解',
    },
  ];
}

/** 学習記録の詳細。ホームからは要約だけを見せ、ここで全部を見せる */
export function ProgressDetail() {
  const { progress, isReady, reset } = useProgress();
  const [isConfirmingReset, setIsConfirmingReset] = useState(false);

  const hasRecord = isReady && progress.totalAnswers > 0;
  const accuracy = accuracyPercent(progress.totalCorrect, progress.totalAnswers);
  const studyStreak = isReady ? currentStudyStreak(progress) : 0;

  const totals = [
    { label: '累計回答数', value: hasRecord ? `${progress.totalAnswers}問` : '—', icon: CheckCircle2, tone: 'text-slate-100' },
    { label: '正答率', value: hasRecord ? `${accuracy}%` : '—', icon: Award, tone: 'text-emerald-300' },
    { label: '連続正解記録', value: hasRecord ? `${progress.bestStreak}回` : '—', icon: Flame, tone: 'text-gold' },
  ];

  const modes = modeRows(progress);
  const playedHands = HAND_IDS.map((handId) => ({
    handId,
    stat: progress.handStats[handId],
  })).filter((entry) => entry.stat.attempts > 0);

  return (
    <div className="space-y-5" aria-busy={!isReady}>
      {/* 1. 全体の統計 */}
      <section className="panel p-4 sm:p-5" aria-labelledby="totals-title">
        <div className="mb-3 flex items-start justify-between gap-3">
          <div className="min-w-0">
            <h2 id="totals-title" className="text-base font-bold text-white">
              全体の記録
            </h2>
            <p className="mt-1 text-xs text-slate-500">
              {hasRecord
                ? `最終学習：${formatStudiedAt(progress.lastStudiedAt)}`
                : 'まだ記録はありません。最初の1問に挑戦しよう。'}
            </p>
          </div>

          {hasRecord ? (
            <button
              type="button"
              onClick={() => {
                if (isConfirmingReset) {
                  reset();
                  setIsConfirmingReset(false);
                } else {
                  setIsConfirmingReset(true);
                }
              }}
              onBlur={() => setIsConfirmingReset(false)}
              className={cn(
                'flex shrink-0 items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-semibold transition-colors',
                isConfirmingReset
                  ? 'bg-rose-500/15 text-rose-300'
                  : 'text-slate-500 hover:bg-white/5 hover:text-slate-300',
              )}
            >
              <RotateCcw className="h-3.5 w-3.5" aria-hidden="true" />
              {isConfirmingReset ? '本当に消す？' : 'リセット'}
            </button>
          ) : null}
        </div>

        {studyStreak > 0 ? (
          <p className="mb-3 inline-flex items-center gap-1.5 rounded-lg border border-gold/30 bg-gold/10 px-2.5 py-1 text-xs font-bold text-gold-soft">
            <CalendarCheck className="h-3.5 w-3.5" aria-hidden="true" />
            {studyStreak}日連続で学習中
          </p>
        ) : null}

        <dl className="grid grid-cols-3 gap-2 sm:gap-3">
          {totals.map((item) => {
            const Icon = item.icon;
            return (
              <div
                key={item.label}
                className="rounded-xl border border-white/10 bg-white/[0.03] px-1.5 py-2.5 text-center sm:px-4"
              >
                <dt className="flex min-h-[2.4em] items-center justify-center gap-1 text-[0.65rem] font-medium leading-tight text-slate-400 sm:min-h-0 sm:text-xs">
                  <Icon className="hidden h-3.5 w-3.5 shrink-0 min-[360px]:block" aria-hidden="true" />
                  <span className="min-w-0">{item.label}</span>
                </dt>
                <dd className={cn('mt-1 text-lg font-bold tabular-nums sm:text-xl', item.tone)}>
                  {item.value}
                </dd>
              </div>
            );
          })}
        </dl>
      </section>

      {/* 2. 苦手なトップ3 */}
      <WeakHands progress={progress} />

      {/* 3. モード別の記録 */}
      <section className="panel p-4 sm:p-5" aria-labelledby="mode-stats-title">
        <h2 id="mode-stats-title" className="text-base font-bold text-white">
          モード別の記録
        </h2>
        <p className="mt-1 text-xs text-slate-500">「役を作る」は一発正解を成功として数えます</p>

        <ul className="mt-3 space-y-2">
          {modes.map((mode) => {
            const rate = accuracyPercent(mode.correct, mode.attempts);
            return (
              <li
                key={mode.key}
                className="flex flex-wrap items-center justify-between gap-x-3 gap-y-1 rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2.5"
              >
                <span className="text-sm font-bold text-white">{mode.name}</span>
                {mode.attempts > 0 ? (
                  <span className="text-xs tabular-nums text-slate-400">
                    {mode.attempts}問 ・ {mode.correctLabel} {mode.correct}問 ・{' '}
                    <span className="font-bold text-emerald-300">{rate}%</span>
                  </span>
                ) : (
                  <span className="text-xs text-slate-500">まだ記録なし</span>
                )}
              </li>
            );
          })}
        </ul>
      </section>

      {/* 4. 役別の記録 */}
      <section className="panel p-4 sm:p-5" aria-labelledby="hand-stats-title">
        <h2 id="hand-stats-title" className="text-base font-bold text-white">
          役別の記録
        </h2>
        <p className="mt-1 text-xs text-slate-500">「役を当てる」で出題された役の成績です</p>

        {playedHands.length === 0 ? (
          <p className="mt-4 rounded-xl border border-white/10 bg-white/[0.03] px-4 py-5 text-center text-sm text-slate-400">
            まだ記録がありません。「役を当てる」で遊ぶとここに並びます。
          </p>
        ) : (
          <ul className="mt-3 space-y-2">
            {playedHands.map(({ handId, stat }) => {
              const rate = accuracyPercent(stat.correct, stat.attempts);
              return (
                <li
                  key={handId}
                  className="flex flex-wrap items-center justify-between gap-x-3 gap-y-1 rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2.5"
                >
                  <span className="text-sm font-bold text-white">{HANDS_BY_ID[handId].nameJa}</span>
                  <span className="text-xs tabular-nums text-slate-400">
                    {stat.attempts}問 ・ 正解 {stat.correct}問 ・{' '}
                    <span className="font-bold text-emerald-300">{rate}%</span>
                  </span>
                </li>
              );
            })}
          </ul>
        )}
      </section>
    </div>
  );
}

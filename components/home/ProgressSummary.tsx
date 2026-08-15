'use client';

import { useState } from 'react';
import { Award, CalendarCheck, CheckCircle2, Flame, RotateCcw } from 'lucide-react';
import { useProgress } from '@/hooks/useProgress';
import { accuracyPercent, currentStudyStreak, formatStudiedAt } from '@/lib/progress';
import { cn } from '@/lib/cn';

/**
 * ホームの学習記録サマリー。
 * 読み込み前後で高さが変わらないよう、常に同じ枠を描画する。
 */
export function ProgressSummary() {
  const { progress, isReady, reset } = useProgress();
  const [isConfirmingReset, setIsConfirmingReset] = useState(false);

  const hasRecord = isReady && progress.totalAnswers > 0;
  const accuracy = accuracyPercent(progress.totalCorrect, progress.totalAnswers);
  const studyStreak = isReady ? currentStudyStreak(progress) : 0;

  const items = [
    { label: '累計回答数', value: hasRecord ? `${progress.totalAnswers}問` : '—', icon: CheckCircle2, tone: 'text-slate-100' },
    { label: '正答率', value: hasRecord ? `${accuracy}%` : '—', icon: Award, tone: 'text-emerald-300' },
    { label: '最長連続正解', value: hasRecord ? `${progress.bestStreak}回` : '—', icon: Flame, tone: 'text-gold' },
  ];

  return (
    <section className="panel p-4 sm:p-5" aria-label="学習の記録" aria-busy={!isReady}>
      <div className="mb-3 flex items-center justify-between gap-3">
        <div className="min-w-0">
          <p className="eyebrow">学習の記録</p>
          <p className="mt-1 truncate text-xs text-slate-500">
            {hasRecord
              ? `最終学習：${formatStudiedAt(progress.lastStudiedAt)}`
              : 'まだ記録はありません。最初の1問に挑戦しよう。'}
          </p>
          {studyStreak > 0 ? (
            <p className="mt-2 inline-flex items-center gap-1.5 rounded-lg border border-gold/30 bg-gold/10 px-2.5 py-1 text-xs font-bold text-gold-soft">
              <CalendarCheck className="h-3.5 w-3.5" aria-hidden="true" />
              {studyStreak}日連続で学習中
            </p>
          ) : null}
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

      <dl className="grid grid-cols-3 gap-2 sm:gap-3">
        {items.map((item) => {
          const Icon = item.icon;
          return (
            <div
              key={item.label}
              className="rounded-xl border border-white/10 bg-white/[0.03] px-2 py-2.5 text-center sm:px-4"
            >
              <dt className="flex items-center justify-center gap-1 text-[0.65rem] font-medium text-slate-400 sm:text-xs">
                <Icon className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
                <span className="truncate">{item.label}</span>
              </dt>
              <dd className={cn('mt-1 text-lg font-bold tabular-nums sm:text-xl', item.tone)}>
                {item.value}
              </dd>
            </div>
          );
        })}
      </dl>
    </section>
  );
}

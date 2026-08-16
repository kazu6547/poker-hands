'use client';

import Link from 'next/link';
import { ArrowRight, Award, CalendarCheck, CheckCircle2, Flame } from 'lucide-react';
import { useProgress } from '@/hooks/useProgress';
import { accuracyPercent, currentStudyStreak, formatStudiedAt } from '@/lib/progress';
import { cn } from '@/lib/cn';

/**
 * ホームの学習記録サマリー。
 * 数字は3つだけにして、詳しい内訳（苦手なトップ3・モード別・役別）は
 * タップした先の「学習の記録」画面にまとめている。
 *
 * 読み込み前後で高さが変わらないよう、常に同じ枠を描画する。
 */
export function ProgressSummary() {
  const { progress, isReady } = useProgress();

  const hasRecord = isReady && progress.totalAnswers > 0;
  const accuracy = accuracyPercent(progress.totalCorrect, progress.totalAnswers);
  const studyStreak = isReady ? currentStudyStreak(progress) : 0;

  const items = [
    { label: '累計回答数', value: hasRecord ? `${progress.totalAnswers}問` : '—', icon: CheckCircle2, tone: 'text-slate-100' },
    { label: '正答率', value: hasRecord ? `${accuracy}%` : '—', icon: Award, tone: 'text-emerald-300' },
    { label: '連続正解記録', value: hasRecord ? `${progress.bestStreak}回` : '—', icon: Flame, tone: 'text-gold' },
  ];

  return (
    <Link
      href="/records"
      aria-label="学習の記録を見る"
      className="panel group block p-4 transition-all duration-200 hover:-translate-y-0.5 hover:border-emerald-400/40 sm:p-5"
    >
      <div className="mb-3 flex items-center justify-between gap-3">
        <div className="min-w-0">
          <p className="eyebrow">学習の記録</p>
          {/* 記録が無いときの案内は長いので、狭い画面では折り返して全文見せる */}
          <p className="mt-1 text-xs leading-snug text-slate-500">
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

        <span className="flex shrink-0 items-center gap-1 text-xs font-semibold text-emerald-300">
          くわしく
          <ArrowRight
            className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-1"
            aria-hidden="true"
          />
        </span>
      </div>

      <dl className="grid grid-cols-3 gap-2 sm:gap-3">
        {items.map((item) => {
          const Icon = item.icon;
          return (
            <div
              key={item.label}
              className="rounded-xl border border-white/10 bg-white/[0.03] px-1.5 py-2.5 text-center sm:px-4"
            >
              {/*
                「連続正解記録」は狭い画面だと1行に収まらないため、省略せず折り返す。
                3つの数値が横並びでそろうよう、見出しの高さだけ確保しておく。
              */}
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
    </Link>
  );
}

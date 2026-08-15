'use client';

import Link from 'next/link';
import { ArrowRight, Target } from 'lucide-react';
import { HANDS_BY_ID } from '@/data/hands';
import { useProgress } from '@/hooks/useProgress';
import { cn } from '@/lib/cn';
import { weakestHands } from '@/lib/progress';

/**
 * 苦手な役 TOP3。
 * 「役を当てる」で貯まった役ごとの成績から、正答率の低い順に並べる。
 * まだ判断できるだけの記録がないときは、何も出さずに画面を短く保つ。
 */
export function WeakHands() {
  const { progress, isReady } = useProgress();
  const weakHands = weakestHands(progress, 3);

  if (!isReady || weakHands.length === 0) return null;

  return (
    <section className="panel p-4 sm:p-5" aria-labelledby="weak-hands-title">
      <div className="mb-3 flex items-center justify-between gap-3">
        <div className="min-w-0">
          <h2 id="weak-hands-title" className="eyebrow">
            苦手な役 TOP3
          </h2>
          <p className="mt-1 text-xs text-slate-500">正答率が低い順。まずはここから復習しましょう</p>
        </div>
        <Link
          href="/quiz"
          className="flex shrink-0 items-center gap-1 rounded-lg px-2.5 py-1.5 text-xs font-semibold text-emerald-300 transition-colors hover:bg-emerald-400/10"
        >
          <Target className="h-3.5 w-3.5" aria-hidden="true" />
          練習する
          <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
        </Link>
      </div>

      <ol className="space-y-2">
        {weakHands.map(({ handId, stat, accuracy }, index) => {
          const hand = HANDS_BY_ID[handId];
          return (
            <li
              key={handId}
              className="flex items-center gap-3 rounded-xl border border-white/10 bg-white/3 px-3 py-2.5"
            >
              <span
                aria-hidden="true"
                className="grid h-6 w-6 shrink-0 place-items-center rounded-md bg-rose-500/15 text-xs font-bold text-rose-200"
              >
                {index + 1}
              </span>
              <span className="min-w-0 flex-1">
                <span className="block truncate text-sm font-bold text-white">{hand.nameJa}</span>
                <span className="mt-1 block h-1 w-full overflow-hidden rounded-full bg-white/6">
                  <span
                    className={cn(
                      'block h-full rounded-full',
                      accuracy < 50 ? 'bg-rose-400/70' : 'bg-gold/70',
                    )}
                    style={{ width: `${Math.max(accuracy, 4)}%` }}
                  />
                </span>
              </span>
              <span className="shrink-0 text-right">
                <span className="block text-sm font-bold tabular-nums text-white">{accuracy}%</span>
                <span className="block text-[0.65rem] tabular-nums text-slate-500">
                  {stat.correct}/{stat.attempts}
                </span>
              </span>
            </li>
          );
        })}
      </ol>
    </section>
  );
}

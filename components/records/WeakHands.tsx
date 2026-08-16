'use client';

import Link from 'next/link';
import { ArrowRight, Target } from 'lucide-react';
import { HANDS_BY_ID } from '@/data/hands';
import { cn } from '@/lib/cn';
import { ProgressData } from '@/lib/types';
import { weakestHands } from '@/lib/progress';

/** この件数だけ回答があると、苦手な役の分析を始められる */
const MIN_ANSWERS_FOR_ANALYSIS = 6;

export interface WeakHandsProps {
  progress: ProgressData;
}

/**
 * 苦手なトップ3。
 * 「役を当てる」で貯まった役ごとの成績から、正答率の低い順に並べる。
 *
 * 責める表示にならないよう、色は控えめにして、順位・役名・数値の文字で伝える。
 */
export function WeakHands({ progress }: WeakHandsProps) {
  const weakHands = weakestHands(progress, 3);
  const hasRecord = progress.totalAnswers > 0;

  return (
    <section className="panel p-4 sm:p-5" aria-labelledby="weak-hands-title">
      <h2 id="weak-hands-title" className="text-base font-bold text-white">
        苦手なトップ3
      </h2>
      <p className="mt-1 text-xs leading-relaxed text-slate-400">
        正答率が低い役から、復習してみよう。
      </p>

      {weakHands.length === 0 ? (
        <p className="mt-4 rounded-xl border border-white/10 bg-white/[0.03] px-4 py-5 text-center text-sm leading-relaxed text-slate-400">
          {hasRecord
            ? 'もう少し遊ぶと、苦手な役が分かってくるよ。'
            : 'まだ記録がありません。まずは1問遊んで、得意な役を見つけよう。'}
        </p>
      ) : (
        <>
          <ol className="mt-4 space-y-2">
            {weakHands.map(({ handId, stat, accuracy }, index) => {
              const hand = HANDS_BY_ID[handId];
              return (
                <li
                  key={handId}
                  className="flex items-center gap-3 rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2.5"
                >
                  {/* 順位は色ではなく数字で伝える */}
                  <span
                    aria-hidden="true"
                    className="grid h-6 w-6 shrink-0 place-items-center rounded-md bg-white/8 text-xs font-bold text-slate-200"
                  >
                    {index + 1}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block text-sm font-bold text-white">{hand.nameJa}</span>
                    <span className="mt-1 block h-1 w-full overflow-hidden rounded-full bg-white/6">
                      <span
                        aria-hidden="true"
                        className={cn(
                          'block h-full rounded-full',
                          accuracy < 50 ? 'bg-gold/70' : 'bg-emerald-400/60',
                        )}
                        style={{ width: `${Math.max(accuracy, 4)}%` }}
                      />
                    </span>
                  </span>
                  <span className="shrink-0 text-right">
                    {/* 読み上げでは「1位、ツーペア。正答率43パーセント、7問回答。」と伝わるようにする */}
                    <span className="sr-only">
                      {index + 1}位、{hand.nameJa}。正答率{accuracy}パーセント、{stat.attempts}問回答。
                    </span>
                    <span aria-hidden="true" className="block text-sm font-bold tabular-nums text-white">
                      {accuracy}%
                    </span>
                    <span aria-hidden="true" className="block text-[0.65rem] tabular-nums text-slate-500">
                      {stat.attempts}問
                    </span>
                  </span>
                </li>
              );
            })}
          </ol>

          <Link
            href="/quiz"
            className="mt-3 flex items-center justify-center gap-1.5 rounded-xl border border-emerald-400/30 bg-emerald-400/8 px-4 py-2.5 text-sm font-bold text-emerald-200 transition-colors hover:bg-emerald-400/15"
          >
            <Target className="h-4 w-4" aria-hidden="true" />
            役を当てるで練習する
            <ArrowRight className="h-4 w-4" aria-hidden="true" />
          </Link>
        </>
      )}

      {hasRecord && weakHands.length > 0 && progress.totalAnswers < MIN_ANSWERS_FOR_ANALYSIS ? (
        <p className="mt-3 text-xs leading-relaxed text-slate-500">
          まだ回答数が少ないので、遊ぶほど分析は正確になります。
        </p>
      ) : null}
    </section>
  );
}

'use client';

import { useState } from 'react';
import { ChevronDown, ChevronUp, Sparkles } from 'lucide-react';
import { cn } from '@/lib/cn';

const PANEL_ID = 'getting-started-panel';
const BUTTON_ID = 'getting-started-button';

const MODE_GUIDE = [
  {
    title: '役を当てる',
    body: '表示された5枚が何の役かを4択で答えます。見て判断する力がつきます。',
  },
  {
    title: '役を作る',
    body: 'お題の役になるように自分で5枚を選びます。条件が体で覚えられます。',
  },
];

/** ホームの「はじめての方へ」。初期状態は閉じていて、押すと開く。 */
export function GettingStarted() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <section className="panel overflow-hidden">
      <h2>
        <button
          type="button"
          id={BUTTON_ID}
          aria-expanded={isOpen}
          aria-controls={PANEL_ID}
          onClick={() => setIsOpen((current) => !current)}
          className="flex w-full items-center gap-3 p-5 text-left transition-colors hover:bg-white/5"
        >
          <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-emerald-400/15 text-emerald-300">
            <Sparkles className="h-5 w-5" aria-hidden="true" />
          </span>
          <span className="min-w-0 flex-1">
            <span className="block text-base font-bold text-white">はじめての方へ</span>
            <span className="mt-0.5 block text-xs text-slate-400">
              使い方と、おすすめの学習の進め方
            </span>
          </span>
          {isOpen ? (
            <ChevronUp className="h-5 w-5 shrink-0 text-slate-400" aria-hidden="true" />
          ) : (
            <ChevronDown className="h-5 w-5 shrink-0 text-slate-400" aria-hidden="true" />
          )}
        </button>
      </h2>

      {/* grid-rows を 0fr ↔ 1fr で切り替えて、短く滑らかに開閉する */}
      <div
        className={cn(
          'grid transition-[grid-template-rows] duration-200 ease-out',
          isOpen ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]',
        )}
      >
        <div className="overflow-hidden">
          <div
            id={PANEL_ID}
            role="region"
            aria-labelledby={BUTTON_ID}
            aria-hidden={!isOpen}
            className="space-y-4 border-t border-white/10 p-5 text-sm leading-relaxed text-slate-300"
          >
            <p>
              ポーカーは「5枚の組み合わせの強さ」で勝負が決まります。
              役を覚えると、自分の手が強いのか弱いのかが一目で判断できるようになります。
            </p>

            <dl className="grid gap-3 sm:grid-cols-2">
              {MODE_GUIDE.map((mode) => (
                <div key={mode.title} className="rounded-xl border border-white/10 bg-white/3 p-4">
                  <dt className="text-sm font-bold text-emerald-200">{mode.title}</dt>
                  <dd className="mt-1 text-xs leading-relaxed text-slate-400">{mode.body}</dd>
                </div>
              ))}
            </dl>

            <div>
              <p className="text-sm font-bold text-white">おすすめの順番</p>
              <ol className="mt-2 list-inside list-decimal space-y-1 text-xs text-slate-400">
                <li>「役を当てる」の初級で、よく出る役に慣れる</li>
                <li>「役を作る」で、役の条件を自分の手で確かめる</li>
                <li>迷ったら「役一覧」で、間違えやすい役の違いを確認する</li>
              </ol>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

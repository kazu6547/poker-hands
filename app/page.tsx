import Link from 'next/link';
import { ArrowRight, Layers, ListOrdered, Sparkles, Swords, Target } from 'lucide-react';
import { FeedbackSettingsCard } from '@/components/home/FeedbackSettingsCard';
import { GettingStarted } from '@/components/home/GettingStarted';
import { HeroCardFan } from '@/components/home/HeroCardFan';
import { ModeCard } from '@/components/home/ModeCard';
import { ProgressSummary } from '@/components/home/ProgressSummary';
import { SecondaryModeCard } from '@/components/home/SecondaryModeCard';

/**
 * ホーム。
 * 表示順は「サービス名 → メインの2モード → その他 → 学習記録 → 役一覧 → はじめての方へ」で固定する。
 * 開いた瞬間に「役を当てる」「役を作る」が目に入ることを最優先にしている。
 */
export default function HomePage() {
  return (
    <div className="space-y-5 sm:space-y-6">
      <section className="animate-fade-up text-center">
        <p className="eyebrow">Texas Hold&apos;em</p>
        <h1 className="mt-2 text-3xl font-bold leading-tight sm:text-4xl">Poker Hand</h1>
        <p className="mt-1 text-xs font-semibold tracking-[0.2em] text-slate-500">by K.M</p>
        <p className="mt-2 text-sm text-slate-400 sm:text-base">
          見るだけで終わらない。役を作って、覚える。
        </p>

        {/* サブコピーとメインモードの間に置く、トランプの装飾 */}
        <HeroCardFan />
      </section>

      {/* 1. メインの学習モード */}
      <section aria-label="メインの学習モード" className="grid gap-4 sm:grid-cols-2">
        <ModeCard
          href="/quiz"
          title="役を当てる"
          description="5枚のカードを見て、役名を4択で答えます。"
          icon={Target}
          tone="emerald"
          badge="まずはここから"
        />
        <ModeCard
          href="/build"
          title="役を作る"
          description="お題の役になるように、場から5枚を選びます。"
          icon={Layers}
          tone="iris"
        />
      </section>

      {/* 2. その他のモード */}
      <section aria-labelledby="other-modes">
        <h2 id="other-modes" className="eyebrow mb-2">
          その他
        </h2>
        <div className="grid gap-3 sm:grid-cols-2">
          <SecondaryModeCard
            href="/compare"
            title="VSカード"
            description="2つの手を見比べて、勝つカードを選ぼう。"
            icon={Swords}
          />
          <SecondaryModeCard
            href="/best-five"
            title="最強の5枚"
            description="7枚のカードから、最強の5枚を見つけよう。"
            icon={Sparkles}
          />
        </div>
      </section>

      {/* 3. 学習記録 */}
      <ProgressSummary />

      {/* 4. 役一覧 */}
      <Link
        href="/hands"
        className="panel group flex items-center justify-between gap-4 p-4 transition-all duration-200 hover:-translate-y-0.5 hover:border-gold/40 sm:p-5"
      >
        <span className="flex items-center gap-3 sm:gap-4">
          <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-gold/15 text-gold">
            <ListOrdered className="h-5 w-5" aria-hidden="true" />
          </span>
          <span>
            <span className="block text-base font-bold text-white">役一覧を見る</span>
            <span className="mt-0.5 block text-xs text-slate-400 sm:text-sm">
              10役を強い順に。条件・見分け方・間違えやすい役の違いつき。
            </span>
          </span>
        </span>
        <ArrowRight
          className="h-5 w-5 shrink-0 text-gold transition-transform duration-200 group-hover:translate-x-1"
          aria-hidden="true"
        />
      </Link>

      {/* 5. はじめての方へ */}
      <GettingStarted />

      {/* 6. サウンド・振動の設定 */}
      <FeedbackSettingsCard />
    </div>
  );
}

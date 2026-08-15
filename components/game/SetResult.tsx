import Link from 'next/link';
import { ReactNode } from 'react';
import { Home, RefreshCw, SlidersHorizontal, Trophy } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { buttonClasses } from '@/components/ui/buttonStyles';
import { cn } from '@/lib/cn';
import { accuracyPercent } from '@/lib/progress';

export interface SetResultProps {
  total: number;
  correct: number;
  /** 成績の下に置く追加情報（苦手だった役など） */
  children?: ReactNode;
  onRetry: () => void;
  /** 難易度のあるモードだけ渡す（無い場合はボタンを出さない） */
  onChangeDifficulty?: () => void;
}

/** 10問終了後の共通結果画面 */
export function SetResult({ total, correct, children, onRetry, onChangeDifficulty }: SetResultProps) {
  const accuracy = accuracyPercent(correct, total);

  const message =
    accuracy === 100
      ? '全問正解！ しっかり身についています。'
      : accuracy >= 70
        ? 'いい調子です。あと少しで完璧。'
        : '少しずつ覚えていきましょう。役一覧で確認するのもおすすめです。';

  return (
    <div className="animate-fade-up space-y-6">
      <section className="panel p-6 text-center sm:p-8">
        <span className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-gold/15 text-gold">
          <Trophy className="h-7 w-7" aria-hidden="true" />
        </span>
        <h1 className="mt-4 text-2xl font-bold sm:text-3xl">結果</h1>
        <p className="mt-2 text-sm text-slate-400">{message}</p>

        <div className="mx-auto mt-6 grid max-w-sm grid-cols-2 gap-3">
          <div className="rounded-xl border border-white/10 bg-white/3 px-4 py-4">
            <p className="text-xs font-medium text-slate-400">正答数</p>
            <p className="mt-1 text-2xl font-bold tabular-nums text-white">
              {correct}
              <span className="text-base font-medium text-slate-500"> / {total}</span>
            </p>
          </div>
          <div className="rounded-xl border border-white/10 bg-white/3 px-4 py-4">
            <p className="text-xs font-medium text-slate-400">正答率</p>
            <p className="mt-1 text-2xl font-bold tabular-nums text-emerald-300">{accuracy}%</p>
          </div>
        </div>
      </section>

      {children}

      <div className={cn('grid gap-3', onChangeDifficulty ? 'sm:grid-cols-3' : 'sm:grid-cols-2')}>
        <Button size="lg" fullWidth onClick={onRetry}>
          <RefreshCw className="h-4 w-4" aria-hidden="true" />
          もう一度挑戦
        </Button>
        {onChangeDifficulty ? (
          <Button size="lg" variant="secondary" fullWidth onClick={onChangeDifficulty}>
            <SlidersHorizontal className="h-4 w-4" aria-hidden="true" />
            難易度を変える
          </Button>
        ) : null}
        <Link href="/" className={buttonClasses({ variant: 'secondary', size: 'lg', fullWidth: true })}>
          <Home className="h-4 w-4" aria-hidden="true" />
          ホームへ戻る
        </Link>
      </div>
    </div>
  );
}

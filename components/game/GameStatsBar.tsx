'use client';

import { CheckCircle2, Flame, LogOut, Target } from 'lucide-react';
import { EndlessToggle } from './EndlessToggle';
import { StatPill } from '@/components/ui/StatPill';

export interface GameStatsBarProps {
  /** 現在の問題番号（1始まり） */
  current: number;
  /** 全問題数。無限モード中は null（「∞」と表示する） */
  total: number | null;
  correct: number;
  streak: number;
  /** 回答済みなら進捗バーを1問分進める */
  isAnswered: boolean;
  /** 正解数の見出し（既定は「正解」） */
  correctLabel?: string;
  isEndless: boolean;
  onToggleEndless: (value: boolean) => void;
  /** 結果表示中は切り替えさせない */
  toggleDisabled?: boolean;
  /** 無限モード中の終了導線 */
  onQuit?: () => void;
  /** 通常モードに戻したときなどの案内 */
  notice?: string | null;
}

/** ゲーム画面の共通ヘッダー（無限モード切り替え・問題数・正解数・連続正解＋進捗バー） */
export function GameStatsBar({
  current,
  total,
  correct,
  streak,
  isAnswered,
  correctLabel = '正解',
  isEndless,
  onToggleEndless,
  toggleDisabled = false,
  onQuit,
  notice,
}: GameStatsBarProps) {
  const answered = total === null ? current - 1 : Math.min(current - 1 + (isAnswered ? 1 : 0), total);
  const percent = total !== null && total > 0 ? (answered / total) * 100 : 0;

  return (
    <>
      <div className="flex flex-wrap items-center gap-2">
        <EndlessToggle
          checked={isEndless}
          onChange={onToggleEndless}
          disabled={toggleDisabled}
        />
        {isEndless && onQuit ? (
          <button
            type="button"
            onClick={onQuit}
            disabled={toggleDisabled}
            className="inline-flex min-h-[2.5rem] items-center gap-1.5 rounded-xl border border-white/10 bg-white/[0.04] px-3 py-2 text-xs font-semibold text-slate-300 transition-colors hover:bg-white/[0.08] disabled:cursor-not-allowed disabled:opacity-45"
          >
            <LogOut className="h-3.5 w-3.5" aria-hidden="true" />
            終了
          </button>
        ) : null}
      </div>

      {notice ? (
        <p className="rounded-xl border border-iris/30 bg-iris/12 px-3 py-2 text-xs leading-relaxed text-iris-soft">
          {notice}
        </p>
      ) : null}

      <div className="flex gap-2">
        <StatPill icon={Target} label="問題" value={`${current} / ${total ?? '∞'}`} />
        <StatPill icon={CheckCircle2} label={correctLabel} value={`${correct}問`} tone="emerald" />
        <StatPill icon={Flame} label="連続正解" value={`${streak}回`} tone="gold" />
      </div>

      {total !== null ? (
        <div
          className="h-1.5 w-full overflow-hidden rounded-full bg-white/8"
          role="progressbar"
          aria-valuemin={0}
          aria-valuemax={total}
          aria-valuenow={answered}
          aria-label="進捗"
        >
          <div
            className="h-full rounded-full bg-emerald-400 transition-all duration-300"
            style={{ width: `${percent}%` }}
          />
        </div>
      ) : (
        <p className="text-center text-[0.7rem] text-slate-500">
          {isEndless
            ? '無限モード：好きなだけ練習できます（終了ボタンで成績を確認）'
            : 'この問題のあと、10問チャレンジが始まります'}
        </p>
      )}
    </>
  );
}

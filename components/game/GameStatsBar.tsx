import { CheckCircle2, Flame, Target } from 'lucide-react';
import { StatPill } from '@/components/ui/StatPill';

export interface GameStatsBarProps {
  /** 現在の問題番号（1始まり） */
  current: number;
  total: number;
  correct: number;
  streak: number;
  /** 回答済みなら進捗バーを1問分進める */
  isAnswered: boolean;
}

/** ゲーム画面の共通ヘッダー（問題数・正解数・連続正解＋進捗バー） */
export function GameStatsBar({ current, total, correct, streak, isAnswered }: GameStatsBarProps) {
  const answered = Math.min(current - 1 + (isAnswered ? 1 : 0), total);
  const percent = total > 0 ? (answered / total) * 100 : 0;

  return (
    <>
      <div className="flex gap-2">
        <StatPill icon={Target} label="問題" value={`${current} / ${total}`} />
        <StatPill icon={CheckCircle2} label="正解" value={`${correct}問`} tone="emerald" />
        <StatPill icon={Flame} label="連続正解" value={`${streak}回`} tone="gold" />
      </div>

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
    </>
  );
}

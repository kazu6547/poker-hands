import { LucideIcon } from 'lucide-react';
import { cn } from '@/lib/cn';

export type StatTone = 'default' | 'emerald' | 'gold' | 'iris';

const TONES: Record<StatTone, string> = {
  default: 'text-slate-100',
  emerald: 'text-emerald-300',
  gold: 'text-gold',
  iris: 'text-iris-soft',
};

export interface StatPillProps {
  icon?: LucideIcon;
  label: string;
  value: string;
  tone?: StatTone;
  className?: string;
}

/** ゲーム画面のヘッダーに置く、コンパクトな数値表示 */
export function StatPill({ icon: Icon, label, value, tone = 'default', className }: StatPillProps) {
  return (
    <div
      className={cn(
        'flex min-w-0 flex-1 items-center gap-2 rounded-xl border border-white/10 bg-white/[0.04] px-3 py-2',
        className,
      )}
    >
      {Icon ? <Icon className="h-4 w-4 shrink-0 text-slate-400" aria-hidden="true" /> : null}
      <div className="min-w-0">
        <p className="truncate text-[0.65rem] font-medium uppercase tracking-wider text-slate-400">
          {label}
        </p>
        <p className={cn('truncate text-sm font-semibold tabular-nums', TONES[tone])}>{value}</p>
      </div>
    </div>
  );
}

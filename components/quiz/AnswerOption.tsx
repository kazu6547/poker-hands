import { Check, X } from 'lucide-react';
import { HANDS_BY_ID } from '@/data/hands';
import { cn } from '@/lib/cn';
import { HandId } from '@/lib/types';

export type AnswerOptionState = 'idle' | 'correct' | 'wrong' | 'muted';

export interface AnswerOptionProps {
  handId: HandId;
  /** 0〜3。数字キーのショートカット表示に使う */
  index: number;
  state: AnswerOptionState;
  disabled: boolean;
  onSelect: (handId: HandId) => void;
}

const STATE_STYLES: Record<AnswerOptionState, string> = {
  idle: 'border-white/12 bg-white/[0.04] hover:border-emerald-400/50 hover:bg-white/[0.08]',
  correct: 'border-emerald-400/70 bg-emerald-400/12',
  wrong: 'border-rose-400/70 bg-rose-500/12',
  muted: 'border-white/8 bg-white/[0.02] opacity-50',
};

const BADGE_STYLES: Record<AnswerOptionState, string> = {
  idle: 'bg-white/8 text-slate-300',
  correct: 'bg-emerald-400 text-midnight-950',
  wrong: 'bg-rose-400 text-midnight-950',
  muted: 'bg-white/5 text-slate-500',
};

/** 4択のひとつ。正誤は色だけでなくアイコンとテキストでも示す。 */
export function AnswerOption({ handId, index, state, disabled, onSelect }: AnswerOptionProps) {
  const hand = HANDS_BY_ID[handId];

  return (
    <button
      type="button"
      onClick={() => onSelect(handId)}
      disabled={disabled}
      className={cn(
        'flex min-h-[3.75rem] w-full items-center gap-3 rounded-xl border px-4 py-3 text-left transition-all duration-200',
        STATE_STYLES[state],
        !disabled && 'active:translate-y-px',
        disabled && 'cursor-default',
      )}
    >
      <span
        aria-hidden="true"
        className={cn(
          'grid h-7 w-7 shrink-0 place-items-center rounded-md text-xs font-bold tabular-nums',
          BADGE_STYLES[state],
        )}
      >
        {index + 1}
      </span>

      <span className="min-w-0 flex-1">
        <span className="block truncate text-base font-bold text-white">{hand.nameJa}</span>
        <span className="block truncate text-xs text-slate-400">{hand.nameEn}</span>
      </span>

      {state === 'correct' ? (
        <span className="flex shrink-0 items-center gap-1 text-xs font-bold text-emerald-300">
          <Check className="h-4 w-4" aria-hidden="true" strokeWidth={3} />
          正解
        </span>
      ) : null}
      {state === 'wrong' ? (
        <span className="flex shrink-0 items-center gap-1 text-xs font-bold text-rose-300">
          <X className="h-4 w-4" aria-hidden="true" strokeWidth={3} />
          不正解
        </span>
      ) : null}
    </button>
  );
}

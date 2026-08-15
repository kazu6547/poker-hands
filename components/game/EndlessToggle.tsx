'use client';

import { Check, Infinity as InfinityIcon } from 'lucide-react';
import { cn } from '@/lib/cn';

export interface EndlessToggleProps {
  checked: boolean;
  onChange: (value: boolean) => void;
  /** 結果表示中など、切り替えさせたくないとき */
  disabled?: boolean;
}

/**
 * 「無限に練習する」のチェックボックス。
 * 実体は input[type=checkbox] なので、Space キーでの操作と読み上げが標準どおり動く。
 * ON/OFF は色だけでなく、チェックマークと枠線でも分かるようにしている。
 */
export function EndlessToggle({ checked, onChange, disabled = false }: EndlessToggleProps) {
  return (
    <label
      className={cn(
        'inline-flex min-h-[2.5rem] select-none items-center gap-2 rounded-xl border px-3 py-2 text-xs font-semibold transition-colors',
        'focus-within:outline-none focus-within:ring-2 focus-within:ring-emerald-300 focus-within:ring-offset-2 focus-within:ring-offset-midnight-950',
        checked
          ? 'border-emerald-400/50 bg-emerald-400/12 text-emerald-200'
          : 'border-white/10 bg-white/[0.04] text-slate-300',
        disabled ? 'cursor-not-allowed opacity-45' : 'cursor-pointer hover:bg-white/[0.08]',
      )}
    >
      <input
        type="checkbox"
        className="sr-only"
        checked={checked}
        disabled={disabled}
        onChange={(event) => onChange(event.target.checked)}
      />
      <span
        aria-hidden="true"
        className={cn(
          'grid h-4 w-4 shrink-0 place-items-center rounded border transition-colors',
          checked ? 'border-emerald-400 bg-emerald-400 text-midnight-950' : 'border-white/30',
        )}
      >
        {checked ? <Check className="h-3 w-3" strokeWidth={3} /> : null}
      </span>
      <InfinityIcon className="h-4 w-4 shrink-0" aria-hidden="true" />
      無限に練習する
    </label>
  );
}

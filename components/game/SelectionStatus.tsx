import { Check, Layers } from 'lucide-react';
import { cn } from '@/lib/cn';

export interface SelectionStatusProps {
  /** 今選んでいる枚数 */
  selected: number;
  /** 回答に必要な枚数 */
  required: number;
  /** そろったときに出す一言（例：選択完了。回答できます） */
  readyMessage: string;
  /** そろう前に出す案内 */
  hintMessage: string;
  /** 読み上げに一度だけ流す文（そろった瞬間のみ） */
  announcement: string;
  className?: string;
}

/**
 * 「あと何枚で回答できるか」を、常に同じ位置で伝える表示。
 *
 * 枚数の変化そのものは読み上げず（毎回うるさくなるため）、
 * 回答できるようになった瞬間だけ aria-live で1回伝える。
 */
export function SelectionStatus({
  selected,
  required,
  readyMessage,
  hintMessage,
  announcement,
  className,
}: SelectionStatusProps) {
  const isReady = selected >= required;

  return (
    <div className={cn('text-center', className)}>
      <p
        className={cn(
          'inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-semibold transition-colors duration-200',
          isReady
            ? 'border-emerald-400/40 bg-emerald-400/10 text-emerald-200'
            : 'border-white/10 bg-white/[0.04] text-slate-400',
        )}
      >
        {isReady ? (
          <Check className="h-3.5 w-3.5" aria-hidden="true" strokeWidth={3} />
        ) : (
          <Layers className="h-3.5 w-3.5" aria-hidden="true" />
        )}
        <span className="tabular-nums">
          {selected} / {required} 枚選択
          {isReady ? '済み' : ''}
        </span>
      </p>

      <p className="mt-2 text-xs text-slate-500">{isReady ? readyMessage : hintMessage}</p>

      {/* 枚数ではなく、「回答できるようになった」ことだけを1回伝える */}
      <p className="sr-only" aria-live="polite">
        {isReady ? announcement : ''}
      </p>
    </div>
  );
}

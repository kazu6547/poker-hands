import { Check } from 'lucide-react';
import { RANK_LABEL, SUIT_META, cardAriaLabel } from '@/lib/cards';
import { cn } from '@/lib/cn';
import { Card } from '@/lib/types';

export type PlayingCardSize = 'sm' | 'md' | 'lg';

interface SizeStyle {
  frame: string;
  corner: string;
  center: string;
}

const SIZES: Record<PlayingCardSize, SizeStyle> = {
  /** sm は面が小さいので、隅の表記と中央マークが重ならないよう「数字＋マーク」だけを中央に置く */
  sm: {
    frame: 'h-16 w-11 rounded-lg',
    corner: 'text-sm',
    center: 'text-base',
  },
  md: {
    frame: 'h-24 w-[4.25rem] rounded-xl sm:h-28 sm:w-20',
    corner: 'text-xs sm:text-sm',
    center: 'text-xl sm:text-2xl',
  },
  /** lg はスマホでも5枚が1行に収まる幅にして、手札全体を一目で見られるようにする */
  lg: {
    frame: 'h-[5rem] w-[3.6rem] rounded-lg sm:h-36 sm:w-[6.5rem] sm:rounded-xl',
    corner: 'text-xs sm:text-base',
    center: 'text-lg sm:text-4xl',
  },
};

export interface PlayingCardProps {
  card: Card;
  size?: PlayingCardSize;
  /** 選択中（「役を作る」モード） */
  selected?: boolean;
  /** ヒントで示されているカード */
  hinted?: boolean;
  /** 正解時のお祝いアニメーション */
  celebrate?: boolean;
  /** 操作できないカードとして控えめに表示する（結果画面などで使う） */
  dimmed?: boolean;
  disabled?: boolean;
  /** 登場アニメーションの遅延に使う */
  index?: number;
  onSelect?: (card: Card) => void;
}

/**
 * HTML/CSS だけで描いたトランプカード。
 * 画像を使わないので、どの解像度でもくっきり表示される。
 */
export function PlayingCard({
  card,
  size = 'md',
  selected = false,
  hinted = false,
  celebrate = false,
  dimmed = false,
  disabled = false,
  index = 0,
  onSelect,
}: PlayingCardProps) {
  const meta = SUIT_META[card.suit];
  const sizeStyle = SIZES[size];
  const rank = RANK_LABEL[card.rank];
  const isInteractive = typeof onSelect === 'function';

  const face = (
    <span className={cn('relative block h-full w-full', meta.color === 'red' ? 'text-rose-600' : 'text-slate-900')}>
      {size === 'sm' ? (
        <span className="flex h-full w-full flex-col items-center justify-center leading-none">
          <span className={cn('font-bold', sizeStyle.corner)}>{rank}</span>
          <span className={cn('mt-1', sizeStyle.center)} aria-hidden="true">
            {meta.symbol}
          </span>
        </span>
      ) : (
        <>
          <span
            className={cn(
              'absolute left-1.5 top-1 flex flex-col items-center leading-none',
              sizeStyle.corner,
            )}
          >
            <span className="font-bold">{rank}</span>
            <span aria-hidden="true">{meta.symbol}</span>
          </span>

          <span
            aria-hidden="true"
            className={cn(
              'absolute inset-0 flex items-center justify-center opacity-90',
              sizeStyle.center,
            )}
          >
            {meta.symbol}
          </span>

          <span
            aria-hidden="true"
            className={cn(
              'absolute bottom-1 right-1.5 flex rotate-180 flex-col items-center leading-none',
              sizeStyle.corner,
            )}
          >
            <span className="font-bold">{rank}</span>
            <span>{meta.symbol}</span>
          </span>
        </>
      )}
    </span>
  );

  const frameClasses = cn(
    'relative select-none border border-slate-300/70 bg-white p-1.5 shadow-card transition-all duration-200 animate-card-in',
    sizeStyle.frame,
    selected && 'ring-2 ring-emerald-400 ring-offset-2 ring-offset-midnight-950',
    hinted && !selected && 'ring-2 ring-gold ring-offset-2 ring-offset-midnight-950 animate-pulse-ring',
    celebrate && 'animate-pop',
    dimmed && 'opacity-40 saturate-50',
    isInteractive && !disabled && 'hover:-translate-y-1 hover:shadow-card-hover',
    isInteractive && !disabled && selected && '-translate-y-1.5',
    // ヒント中のカードは、選択できない状態でも薄くしない（金色の光が見えなくなるため）
    isInteractive && disabled && !hinted && 'opacity-45',
  );

  const style = { animationDelay: `${Math.min(index, 9) * 45}ms` };

  if (!isInteractive) {
    return (
      <div className={frameClasses} style={style} role="img" aria-label={cardAriaLabel(card)}>
        {face}
      </div>
    );
  }

  return (
    <button
      type="button"
      onClick={() => onSelect?.(card)}
      disabled={disabled}
      aria-pressed={selected}
      aria-label={`${cardAriaLabel(card)}${selected ? '（選択中）' : ''}`}
      className={cn(frameClasses, 'cursor-pointer disabled:cursor-not-allowed')}
      style={style}
    >
      {face}
      {selected ? (
        <span className="absolute -right-2 -top-2 flex h-6 w-6 items-center justify-center rounded-full bg-emerald-400 text-midnight-950 shadow-md">
          <Check className="h-4 w-4" aria-hidden="true" strokeWidth={3} />
        </span>
      ) : null}
    </button>
  );
}

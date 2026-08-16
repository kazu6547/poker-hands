'use client';

import { useRef } from 'react';
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
  /** 選択中（「役を作る」「最強の5枚」モード） */
  selected?: boolean;
  /** ヒントで示されているカード */
  hinted?: boolean;
  /** 正解に関わるカードとして少し前に出す */
  celebrate?: boolean;
  /** 主役ではないカードとして控えめに表示する（結果画面などで使う） */
  dimmed?: boolean;
  /** 操作を受け付けない（回答後など） */
  disabled?: boolean;
  /**
   * 今は選べないが、押されたら理由が伝わる小さな反応を返す（選択上限に達しているとき）。
   * disabled と違い、押しても状態は変えず、音も鳴らさない。
   */
  blocked?: boolean;
  /** 登場アニメーションの遅延に使う */
  index?: number;
  /** 読み上げに足す短い説明（「最強の5枚」「使わないカード」など） */
  note?: string;
  onSelect?: (card: Card) => void;
}

/**
 * HTML/CSS だけで描いたトランプカード。
 * 画像を使わないので、どの解像度でもくっきり表示される。
 *
 * 触り心地の方針：
 * - 選べるカードだけが、押し込み・浮き上がりのはっきりした反応を返す
 * - 閲覧専用のカードは、ボタンに見えない程度（1px）の反応にとどめる
 */
export function PlayingCard({
  card,
  size = 'md',
  selected = false,
  hinted = false,
  celebrate = false,
  dimmed = false,
  disabled = false,
  blocked = false,
  index = 0,
  note,
  onSelect,
}: PlayingCardProps) {
  const meta = SUIT_META[card.suit];
  const sizeStyle = SIZES[size];
  const rank = RANK_LABEL[card.rank];
  const isInteractive = typeof onSelect === 'function';
  const canSelect = isInteractive && !disabled && !blocked;
  const buttonRef = useRef<HTMLButtonElement>(null);

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
    'relative select-none border border-slate-300/70 bg-white p-1.5 shadow-card animate-card-in',
    'transition-[transform,box-shadow,opacity,filter] duration-200 ease-out',
    sizeStyle.frame,
    selected && 'ring-2 ring-emerald-400 ring-offset-2 ring-offset-midnight-950 shadow-card-hover',
    hinted && !selected && 'ring-2 ring-gold ring-offset-2 ring-offset-midnight-950 animate-pulse-ring',
    // 正解に関わるカードは、跳ねずに少しだけ前に出したまま止まる
    celebrate && '-translate-y-1 shadow-card-hover animate-card-highlight',
    dimmed && 'opacity-65 saturate-[0.8]',
    // 選べるカード：押した瞬間だけ速く沈み、選択中はふわりと浮いたままにする
    canSelect && 'cursor-pointer active:scale-[0.98] active:duration-75',
    canSelect && !selected && 'hover:-translate-y-1 hover:shadow-card-hover',
    canSelect && selected && '-translate-y-1.5',
    // 閲覧専用のカードは、押せるように見せない程度のごく浅い反応だけ
    !isInteractive && !celebrate && !dimmed && 'hover:-translate-y-px hover:shadow-card-hover',
    // ヒント中のカードは、選べない状態でも薄くしない（金色の光が見えなくなるため）
    isInteractive && (disabled || blocked) && !hinted && 'opacity-45',
    blocked && 'cursor-not-allowed',
    isInteractive && disabled && 'cursor-not-allowed',
  );

  // 5枚を超えて長く待たせないよう、ずらしは浅くする
  const style = { animationDelay: `${Math.min(index, 6) * 25}ms` };

  if (!isInteractive) {
    return (
      <div
        className={frameClasses}
        style={style}
        role="img"
        aria-label={note ? `${cardAriaLabel(card)}（${note}）` : cardAriaLabel(card)}
      >
        {face}
      </div>
    );
  }

  /** 選べないカードを押されたとき、動きだけで「今は選べない」と伝える */
  const nudge = () => {
    const element = buttonRef.current;
    if (!element) return;
    element.classList.remove('animate-nudge');
    // 連続で押されても毎回動くよう、レイアウトを一度読んで再生し直す
    void element.offsetWidth;
    element.classList.add('animate-nudge');
  };

  return (
    <button
      ref={buttonRef}
      type="button"
      onClick={() => {
        if (blocked) {
          nudge();
          return;
        }
        onSelect?.(card);
      }}
      disabled={disabled}
      // 上限に達しているカードは、押せば理由が伝わるようフォーカスは残す
      aria-disabled={blocked || undefined}
      aria-pressed={selected}
      aria-label={`${cardAriaLabel(card)}${selected ? '（選択中）' : ''}${note ? `（${note}）` : ''}`}
      className={cn(frameClasses, 'disabled:cursor-not-allowed')}
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

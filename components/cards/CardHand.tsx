import { PlayingCard, PlayingCardSize } from './PlayingCard';
import { cn } from '@/lib/cn';
import { Card } from '@/lib/types';

export interface CardHandProps {
  cards: Card[];
  size?: PlayingCardSize;
  celebrate?: boolean;
  className?: string;
  /** 読み上げ用の説明（省略時は「◯枚のカード」） */
  label?: string;
  /** 強調表示するカードID（結果画面で正解の5枚を示すときに使う） */
  highlightIds?: string[];
  /** 強調対象以外のカードを控えめに表示する */
  dimOthers?: boolean;
}

/** 手札（並べるだけ・操作なし）の表示 */
export function CardHand({
  cards,
  size = 'lg',
  celebrate = false,
  className,
  label,
  highlightIds,
  dimOthers = false,
}: CardHandProps) {
  return (
    <div
      className={cn('flex flex-wrap items-center justify-center gap-1 sm:gap-3', className)}
      role="group"
      aria-label={label ?? `${cards.length}枚のカード`}
    >
      {cards.map((card, index) => {
        const isHighlighted = highlightIds ? highlightIds.includes(card.id) : false;
        return (
          <PlayingCard
            key={card.id}
            card={card}
            size={size}
            index={index}
            celebrate={celebrate}
            selected={highlightIds ? isHighlighted : false}
            dimmed={dimOthers && !isHighlighted}
          />
        );
      })}
    </div>
  );
}

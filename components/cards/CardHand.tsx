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
  /** 強調したカードを少し前に出す（正解の5枚・勝者側） */
  liftHighlighted?: boolean;
  /** 強調したカードに足す読み上げ説明（「最強の5枚」など） */
  highlightNote?: string;
  /** 控えめにしたカードに足す読み上げ説明（「使わないカード」など） */
  dimNote?: string;
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
  liftHighlighted = false,
  highlightNote,
  dimNote,
}: CardHandProps) {
  return (
    <div
      className={cn('flex flex-wrap items-center justify-center gap-1 sm:gap-3', className)}
      role="group"
      aria-label={label ?? `${cards.length}枚のカード`}
    >
      {cards.map((card, index) => {
        const isHighlighted = highlightIds ? highlightIds.includes(card.id) : false;
        const isDimmed = dimOthers && !isHighlighted;
        return (
          <PlayingCard
            key={card.id}
            card={card}
            size={size}
            index={index}
            celebrate={celebrate || (liftHighlighted && isHighlighted)}
            selected={highlightIds ? isHighlighted : false}
            dimmed={isDimmed}
            note={isHighlighted ? highlightNote : isDimmed ? dimNote : undefined}
          />
        );
      })}
    </div>
  );
}

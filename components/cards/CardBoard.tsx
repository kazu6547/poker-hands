import { PlayingCard } from './PlayingCard';
import { cn } from '@/lib/cn';
import { Card } from '@/lib/types';

export interface CardBoardProps {
  cards: Card[];
  selectedIds: string[];
  /** ヒントで光らせるカードID */
  hintedId?: string | null;
  /** これ以上選べない状態（選択済みのカードは押せる） */
  selectionFull?: boolean;
  celebrate?: boolean;
  onToggle: (card: Card) => void;
  className?: string;
}

/** 「役を作る」モードの場のカード（タップで選択） */
export function CardBoard({
  cards,
  selectedIds,
  hintedId = null,
  selectionFull = false,
  celebrate = false,
  onToggle,
  className,
}: CardBoardProps) {
  return (
    <div
      className={cn('flex flex-wrap items-center justify-center gap-2.5 sm:gap-4', className)}
      role="group"
      aria-label="場のカード。タップで5枚選びます"
    >
      {cards.map((card, index) => {
        const isSelected = selectedIds.includes(card.id);
        return (
          <PlayingCard
            key={card.id}
            card={card}
            size="md"
            index={index}
            selected={isSelected}
            hinted={hintedId === card.id}
            celebrate={celebrate && isSelected}
            // 上限に達しているカードは、押されたら小さく押し返して理由を伝える
            blocked={selectionFull && !isSelected}
            onSelect={onToggle}
          />
        );
      })}
    </div>
  );
}

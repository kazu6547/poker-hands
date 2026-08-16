import { ReactNode } from 'react';
import { cn } from '@/lib/cn';

export interface QuestionStageProps {
  /** 問題が変わったことが分かる値。変わると入場アニメーションをやり直す */
  questionKey: string;
  /** 「次へ」を押してから、実際に切り替わるまでの短い退場中か */
  isLeaving: boolean;
  className?: string;
  children: ReactNode;
}

/**
 * 問題エリアの入れ替え。
 *
 * 外側が退場（フェード）、内側が入場（下から少しだけ）を担当する。
 * 同じ要素に両方を持たせると、入場アニメーションの最終値が
 * 退場のトランジションに勝ってしまうため、あえて2枚に分けている。
 */
export function QuestionStage({ questionKey, isLeaving, className, children }: QuestionStageProps) {
  return (
    <div className={cn('question-leave', className)} data-leaving={isLeaving}>
      <div key={questionKey} className="animate-question-in">
        {children}
      </div>
    </div>
  );
}

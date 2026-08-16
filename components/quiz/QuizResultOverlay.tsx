'use client';

import { CardHand } from '@/components/cards/CardHand';
import { ResultOverlay } from '@/components/game/ResultOverlay';
import { HANDS_BY_ID } from '@/data/hands';
import { AchievementNotice } from '@/lib/achievements';
import { explainEvaluation } from '@/lib/feedback';
import { keyCardIds } from '@/lib/handStructure';
import { Card, HandId } from '@/lib/types';

export interface QuizResultOverlayProps {
  isCorrect: boolean;
  /** 正解の役 */
  answerId: HandId;
  /** ユーザーが選んだ役 */
  selectedId: HandId;
  cards: Card[];
  isLastQuestion: boolean;
  notice?: AchievementNotice;
  isLeaving?: boolean;
  onNext: () => void;
  onRetry: () => void;
}

/** 「役を当てる」モードの結果表示 */
export function QuizResultOverlay({
  isCorrect,
  answerId,
  selectedId,
  cards,
  isLastQuestion,
  notice,
  isLeaving = false,
  onNext,
  onRetry,
}: QuizResultOverlayProps) {
  const answerHand = HANDS_BY_ID[answerId];
  const selectedHand = HANDS_BY_ID[selectedId];
  const reason = explainEvaluation(cards);
  // 役の中心になっているカードだけを少し前に出して、役の形が目で追えるようにする
  const coreIds = keyCardIds(cards);

  return (
    <ResultOverlay
      isCorrect={isCorrect}
      notice={notice}
      isLeaving={isLeaving}
      primaryLabel={isLastQuestion ? '結果を見る' : '次の問題へ'}
      onPrimary={onNext}
      secondaryLabel={isCorrect ? undefined : '同じ役をもう一度'}
      onSecondary={isCorrect ? undefined : onRetry}
    >
      <p className="mt-4 text-xs font-semibold uppercase tracking-widest text-slate-500">
        {isCorrect ? 'この役は' : '正解は'}
      </p>
      <p className="mt-1 text-2xl font-bold text-white sm:text-3xl">{answerHand.nameJa}</p>
      <p className="mt-0.5 text-xs text-slate-500">{answerHand.nameEn}</p>

      <CardHand
        cards={cards}
        size="sm"
        className="mt-5"
        label="この問題のカード5枚"
        highlightIds={coreIds.length < cards.length ? coreIds : undefined}
        liftHighlighted
        highlightNote="役の中心"
      />
      {coreIds.length > 0 && coreIds.length < cards.length ? (
        <p className="mt-2 text-[0.7rem] text-slate-500">緑の枠が、この役を作っているカードです</p>
      ) : null}

      <p className="mt-5 text-sm leading-relaxed text-slate-300">
        {reason || answerHand.shortDescription}
      </p>

      {!isCorrect ? (
        <>
          <p className="mt-4 inline-block rounded-lg border border-white/10 bg-white/5 px-3 py-1.5 text-xs text-slate-400">
            あなたの回答：<span className="font-bold text-slate-200">{selectedHand.nameJa}</span>
          </p>
          <p className="mt-3 text-sm font-medium text-emerald-200">
            次は見分けられるはず。もう1問いこう。
          </p>
        </>
      ) : null}
    </ResultOverlay>
  );
}

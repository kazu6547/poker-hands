import { HANDS_BY_ID } from '@/data/hands';
import { SetResult } from '@/components/game/SetResult';
import { HandId } from '@/lib/types';

export interface QuizResultProps {
  total: number;
  correct: number;
  /** 間違えた問題の「正解の役」一覧（重複あり） */
  missedHandIds: HandId[];
  onRetry: () => void;
  onChangeDifficulty: () => void;
}

function summarizeMissed(missedHandIds: HandId[]): { handId: HandId; count: number }[] {
  const counter = new Map<HandId, number>();
  for (const handId of missedHandIds) {
    counter.set(handId, (counter.get(handId) ?? 0) + 1);
  }
  return [...counter.entries()]
    .map(([handId, count]) => ({ handId, count }))
    .sort((a, b) => b.count - a.count);
}

/** 「役を当てる」10問終了後の結果画面（共通の結果画面＋苦手だった役） */
export function QuizResult({
  total,
  correct,
  missedHandIds,
  onRetry,
  onChangeDifficulty,
}: QuizResultProps) {
  const missed = summarizeMissed(missedHandIds);

  return (
    <SetResult
      total={total}
      correct={correct}
      onRetry={onRetry}
      onChangeDifficulty={onChangeDifficulty}
    >
      <section className="panel p-6">
        <h2 className="text-base font-bold">苦手だった役</h2>
        {missed.length === 0 ? (
          <p className="mt-3 text-sm text-slate-400">
            間違えた役はありません。次は上の難易度にも挑戦してみましょう。
          </p>
        ) : (
          <ul className="mt-4 space-y-2">
            {missed.map(({ handId, count }) => {
              const hand = HANDS_BY_ID[handId];
              return (
                <li
                  key={handId}
                  className="flex items-start justify-between gap-3 rounded-xl border border-white/10 bg-white/3 px-4 py-3"
                >
                  <span className="min-w-0">
                    <span className="block text-sm font-bold text-white">{hand.nameJa}</span>
                    <span className="mt-1 block text-xs leading-relaxed text-slate-400">
                      {hand.howToSpot}
                    </span>
                  </span>
                  <span className="shrink-0 rounded-full bg-rose-500/15 px-2.5 py-1 text-xs font-semibold text-rose-200">
                    {count}回
                  </span>
                </li>
              );
            })}
          </ul>
        )}
      </section>
    </SetResult>
  );
}

import { Sparkles } from 'lucide-react';
import { AchievementNotice } from '@/lib/achievements';

/** 「自己ベスト更新！」「50問達成」などを、結果表示の中に小さく出す */
export function AchievementBadge({ notice }: { notice: AchievementNotice }) {
  return (
    <p className="mx-auto mt-4 flex w-fit items-center gap-2 rounded-xl border border-gold/40 bg-gold/12 px-3 py-2 text-left">
      <Sparkles className="h-4 w-4 shrink-0 text-gold" aria-hidden="true" />
      <span>
        <span className="block text-sm font-bold text-gold-soft">{notice.title}</span>
        {notice.detail ? (
          <span className="block text-xs text-gold/90">{notice.detail}</span>
        ) : null}
      </span>
    </p>
  );
}

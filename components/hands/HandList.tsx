'use client';

import { useState } from 'react';
import { ChevronDown, Dices, GitCompare, Eye } from 'lucide-react';
import { CardHand } from '@/components/cards/CardHand';
import {
  HANDS,
  HANDS_BY_ID,
  TOTAL_FIVE_CARD_COMBINATIONS,
  formatHandProbability,
} from '@/data/hands';
import { useProgress } from '@/hooks/useProgress';
import { parseCards } from '@/lib/cards';
import { cn } from '@/lib/cn';
import { accuracyPercent } from '@/lib/progress';
import { HandId, HandInfo, HandStat } from '@/lib/types';

type Tone = 'gold' | 'iris' | 'emerald';

function toneOf(strengthRank: number): Tone {
  if (strengthRank <= 2) return 'gold';
  if (strengthRank <= 5) return 'iris';
  return 'emerald';
}

const TONE_STYLES: Record<Tone, { badge: string; bar: string; border: string }> = {
  gold: {
    badge: 'bg-gold/15 text-gold',
    bar: 'bg-gold/70',
    border: 'hover:border-gold/40',
  },
  iris: {
    badge: 'bg-iris/20 text-iris-soft',
    bar: 'bg-iris/70',
    border: 'hover:border-iris/40',
  },
  emerald: {
    badge: 'bg-emerald-400/15 text-emerald-300',
    bar: 'bg-emerald-400/60',
    border: 'hover:border-emerald-400/40',
  },
};

interface HandRowProps {
  hand: HandInfo;
  isOpen: boolean;
  onToggle: (handId: HandId) => void;
  /** 「役を当てる」で貯まった、この役の成績 */
  stat: HandStat;
}

function HandRow({ hand, isOpen, onToggle, stat }: HandRowProps) {
  const tone = TONE_STYLES[toneOf(hand.strengthRank)];
  const panelId = `hand-panel-${hand.id}`;
  const buttonId = `hand-button-${hand.id}`;
  // 強さを棒の長さで表す（1位がいちばん長い）
  const strengthWidth = ((11 - hand.strengthRank) / 10) * 100;

  return (
    <li className={cn('panel overflow-hidden transition-colors duration-200', tone.border)}>
      <div className="flex items-center">
        <h3 className="min-w-0 flex-1">
          <button
            type="button"
            id={buttonId}
            aria-expanded={isOpen}
            aria-controls={panelId}
            onClick={() => onToggle(hand.id)}
            className="flex w-full items-center gap-3 p-4 text-left sm:gap-4 sm:p-5"
          >
            <span
              className={cn(
                'grid h-10 w-10 shrink-0 place-items-center rounded-xl text-sm font-bold tabular-nums',
                tone.badge,
              )}
              aria-hidden="true"
            >
              {hand.strengthRank}
            </span>

            <span className="min-w-0 flex-1">
              <span className="flex flex-wrap items-baseline gap-x-2">
                <span className="text-base font-bold text-white sm:text-lg">{hand.nameJa}</span>
                <span className="text-xs text-slate-500">{hand.nameEn}</span>
                {stat.attempts > 0 ? (
                  <span
                    className={cn(
                      'rounded-full px-2 py-0.5 text-[0.65rem] font-bold tabular-nums',
                      accuracyPercent(stat.correct, stat.attempts) >= 80
                        ? 'bg-emerald-400/15 text-emerald-200'
                        : accuracyPercent(stat.correct, stat.attempts) >= 50
                          ? 'bg-gold/15 text-gold-soft'
                          : 'bg-rose-500/15 text-rose-200',
                    )}
                  >
                    正答率 {accuracyPercent(stat.correct, stat.attempts)}%
                  </span>
                ) : null}
              </span>
              <span className="mt-1 block text-xs leading-relaxed text-slate-400">
                {hand.shortDescription}
              </span>
              <span className="mt-2 block h-1 w-full overflow-hidden rounded-full bg-white/6">
                <span
                  className={cn('block h-full rounded-full', tone.bar)}
                  style={{ width: `${strengthWidth}%` }}
                />
              </span>
            </span>
          </button>
        </h3>

        {/* カード例（詳細を開かなくても確認できるように） */}
        <div className="hidden shrink-0 pl-2 sm:block" aria-hidden="true">
          <CardHand cards={parseCards(hand.example)} size="sm" label={`${hand.nameJa}の例`} />
        </div>

        <span className="shrink-0 px-4 sm:px-5" aria-hidden="true">
          <ChevronDown
            className={cn(
              'h-5 w-5 text-slate-500 transition-transform duration-200',
              isOpen && 'rotate-180',
            )}
          />
        </span>
      </div>

      {isOpen ? (
        <div
          id={panelId}
          role="region"
          aria-labelledby={buttonId}
          className="animate-fade-up space-y-5 border-t border-white/10 p-4 sm:p-5"
        >
          <div className="sm:hidden">
            <CardHand cards={parseCards(hand.example)} size="sm" label={`${hand.nameJa}の例`} />
          </div>

          <div>
            <p className="eyebrow">役の条件</p>
            <p className="mt-1.5 text-sm leading-relaxed text-slate-300">{hand.condition}</p>
          </div>

          <div>
            <p className="eyebrow flex items-center gap-1.5">
              <Dices className="h-3.5 w-3.5" aria-hidden="true" />
              出やすさ
            </p>
            <p className="mt-1.5 text-sm leading-relaxed text-slate-300">
              5枚を配ったときに、この役ができる確率は
              <span className="mx-1 font-bold text-white">{formatHandProbability(hand.id)}</span>
              です（
              {hand.combinations.toLocaleString('ja-JP')} 通り /{' '}
              {TOTAL_FIVE_CARD_COMBINATIONS.toLocaleString('ja-JP')} 通り）。
            </p>
            {stat.attempts > 0 ? (
              <p className="mt-1.5 text-xs text-slate-500">
                あなたの成績：{stat.attempts}問中 {stat.correct}問 正解
              </p>
            ) : null}
          </div>

          <div>
            <p className="eyebrow flex items-center gap-1.5">
              <Eye className="h-3.5 w-3.5" aria-hidden="true" />
              見分け方
            </p>
            <p className="mt-1.5 text-sm leading-relaxed text-slate-300">{hand.howToSpot}</p>
          </div>

          <div>
            <p className="eyebrow flex items-center gap-1.5">
              <GitCompare className="h-3.5 w-3.5" aria-hidden="true" />
              間違えやすい役との違い
            </p>
            <ul className="mt-2 space-y-2">
              {hand.confusions.map((confusion) => (
                <li
                  key={confusion.handId}
                  className="rounded-xl border border-white/10 bg-white/3 px-4 py-3"
                >
                  <p className="text-sm font-bold text-white">
                    {HANDS_BY_ID[confusion.handId].nameJa}
                  </p>
                  <p className="mt-1 text-sm leading-relaxed text-slate-400">
                    {confusion.difference}
                  </p>
                </li>
              ))}
            </ul>
          </div>
        </div>
      ) : null}
    </li>
  );
}

/** 10役を強い順に並べた一覧（タップで詳細を開く） */
export function HandList() {
  const [openId, setOpenId] = useState<HandId | null>(null);
  const { progress } = useProgress();

  const toggle = (handId: HandId) => {
    setOpenId((current) => (current === handId ? null : handId));
  };

  return (
    <ul className="space-y-3">
      {HANDS.map((hand) => (
        <HandRow
          key={hand.id}
          hand={hand}
          isOpen={openId === hand.id}
          onToggle={toggle}
          stat={progress.handStats[hand.id] ?? { attempts: 0, correct: 0 }}
        />
      ))}
    </ul>
  );
}

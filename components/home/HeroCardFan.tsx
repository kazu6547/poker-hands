import { PlayingCard } from '@/components/cards/PlayingCard';
import { parseCards } from '@/lib/cards';

/**
 * ホームの飾りに使う手札（10・J・Q・K・A のストレート）。
 * J と K を赤（ハート／ダイヤ）にし、4種類のマークをできるだけ散らしている。
 */
const DECORATION_CARDS = parseCards('TS JH QC KD AS');

/** 扇状に広げるための角度と高さ（中央を基準に左右対称） */
const FAN_LAYOUT = [
  { rotate: -14, translateY: 10 },
  { rotate: -7, translateY: 2 },
  { rotate: 0, translateY: -2 },
  { rotate: 7, translateY: 2 },
  { rotate: 14, translateY: 10 },
];

/**
 * ホームのヒーロー装飾。
 * ゲーム中のカードは「まっすぐ並ぶ・押せる」のに対し、
 * ここは「扇状に重なる・押せない」ことで、操作対象ではない飾りだと分かるようにしている。
 */
export function HeroCardFan() {
  return (
    <div
      className="pointer-events-none relative mx-auto mt-6 flex w-fit select-none items-end justify-center"
      aria-hidden="true"
    >
      {/* カードの背後に置くごく淡い光 */}
      <span className="absolute inset-x-4 bottom-2 top-4 -z-10 rounded-full bg-emerald-400/10 blur-2xl" />

      {DECORATION_CARDS.map((card, index) => {
        const layout = FAN_LAYOUT[index] ?? FAN_LAYOUT[FAN_LAYOUT.length - 1];
        return (
          <span
            key={card.id}
            className="-ml-8 block origin-bottom drop-shadow-[0_10px_20px_rgba(0,0,0,0.45)] first:ml-0 sm:-ml-9"
            style={{ transform: `rotate(${layout.rotate}deg) translateY(${layout.translateY}px)` }}
          >
            <PlayingCard card={card} size="md" index={index} />
          </span>
        );
      })}
    </div>
  );
}

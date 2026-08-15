import Link from 'next/link';
import { ArrowRight, LucideIcon } from 'lucide-react';
import { cn } from '@/lib/cn';

export interface ModeCardProps {
  href: string;
  title: string;
  description: string;
  icon: LucideIcon;
  tone: 'emerald' | 'iris';
  /** 「まずはここから」などの小さなラベル */
  badge?: string;
}

const TONES = {
  emerald: {
    icon: 'bg-emerald-400/15 text-emerald-300',
    hover: 'hover:border-emerald-400/40 hover:shadow-[0_24px_60px_-34px_rgba(52,211,153,0.9)]',
    arrow: 'text-emerald-300',
    badge: 'bg-emerald-400/15 text-emerald-200',
  },
  iris: {
    icon: 'bg-iris/20 text-iris-soft',
    hover: 'hover:border-iris/50 hover:shadow-[0_24px_60px_-34px_rgba(139,140,247,0.9)]',
    arrow: 'text-iris-soft',
    badge: 'bg-iris/20 text-iris-soft',
  },
} as const;

/** ホームの大きな学習モード導線 */
export function ModeCard({ href, title, description, icon: Icon, tone, badge }: ModeCardProps) {
  const style = TONES[tone];

  return (
    <Link
      href={href}
      className={cn(
        'panel group flex flex-col gap-3 p-5 transition-all duration-200 hover:-translate-y-0.5 sm:p-6',
        style.hover,
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <span className={cn('grid h-11 w-11 place-items-center rounded-xl', style.icon)}>
          <Icon className="h-5 w-5" aria-hidden="true" />
        </span>
        {badge ? (
          <span className={cn('rounded-full px-2.5 py-1 text-[0.7rem] font-semibold', style.badge)}>
            {badge}
          </span>
        ) : null}
      </div>

      <div className="space-y-1.5">
        <h2 className="text-lg font-bold sm:text-xl">{title}</h2>
        <p className="text-sm leading-relaxed text-slate-400">{description}</p>
      </div>

      <span className={cn('mt-auto flex items-center gap-1.5 text-sm font-semibold', style.arrow)}>
        はじめる
        <ArrowRight
          className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-1"
          aria-hidden="true"
        />
      </span>
    </Link>
  );
}

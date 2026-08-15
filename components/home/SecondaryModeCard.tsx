import Link from 'next/link';
import { ArrowRight, LucideIcon } from 'lucide-react';
import { cn } from '@/lib/cn';

export interface SecondaryModeCardProps {
  href: string;
  title: string;
  description: string;
  icon: LucideIcon;
}

/**
 * 「その他」セクションのカード。
 * メインの2モードより一段控えめだが、タップ領域は十分に確保する。
 */
export function SecondaryModeCard({ href, title, description, icon: Icon }: SecondaryModeCardProps) {
  return (
    <Link
      href={href}
      className={cn(
        'group flex items-center gap-3 rounded-2xl border border-white/10 bg-white/[0.03] p-4',
        'transition-all duration-200 hover:-translate-y-0.5 hover:border-white/20 hover:bg-white/[0.06]',
      )}
    >
      <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-white/8 text-slate-300">
        <Icon className="h-5 w-5" aria-hidden="true" />
      </span>
      <span className="min-w-0 flex-1">
        <span className="block text-sm font-bold text-white sm:text-base">{title}</span>
        <span className="mt-0.5 block text-xs leading-relaxed text-slate-400">{description}</span>
      </span>
      <ArrowRight
        className="h-4 w-4 shrink-0 text-slate-500 transition-transform duration-200 group-hover:translate-x-1 group-hover:text-slate-300"
        aria-hidden="true"
      />
    </Link>
  );
}

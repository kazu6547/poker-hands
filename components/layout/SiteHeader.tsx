'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Layers, ListOrdered, Scale, Spade, Target } from 'lucide-react';
import { cn } from '@/lib/cn';

/** primary: false の項目は、幅に余裕のある画面でのみ表示する */
const NAV_ITEMS = [
  { href: '/quiz', label: '役を当てる', short: '当てる', icon: Target, primary: true },
  { href: '/build', label: '役を作る', short: '作る', icon: Layers, primary: true },
  { href: '/compare', label: '強さ比較', short: '比較', icon: Scale, primary: false },
  { href: '/best-five', label: '最強の5枚', short: '5枚', icon: Layers, primary: false },
  { href: '/hands', label: '役一覧', short: '一覧', icon: ListOrdered, primary: true },
];

export function SiteHeader() {
  const pathname = usePathname();

  return (
    <header className="sticky top-0 z-40 border-b border-white/10 bg-midnight-950/85 backdrop-blur">
      <div className="mx-auto flex max-w-5xl items-center justify-between gap-3 px-4 py-3">
        <Link
          href="/"
          className="flex items-center gap-2 rounded-lg py-1 pr-2 transition-colors hover:text-white"
          aria-label="Poker Hand のホームへ"
        >
          <span className="grid h-8 w-8 place-items-center rounded-lg bg-emerald-400/15 text-emerald-300">
            <Spade className="h-4 w-4" aria-hidden="true" />
          </span>
          {/* 幅の狭い端末ではナビを優先し、ロゴマークだけを残す */}
          <span className="hidden whitespace-nowrap font-display text-sm font-bold tracking-tight text-white min-[420px]:inline sm:text-base">
            Poker Hand
          </span>
        </Link>

        <nav aria-label="メインナビゲーション">
          <ul className="flex items-center gap-1">
            {NAV_ITEMS.map((item) => {
              const isActive = pathname === item.href;
              const Icon = item.icon;
              return (
                <li key={item.href} className={cn(!item.primary && 'hidden lg:block')}>
                  <Link
                    href={item.href}
                    aria-current={isActive ? 'page' : undefined}
                    className={cn(
                      'flex h-9 items-center gap-1.5 whitespace-nowrap rounded-lg px-2.5 text-xs font-semibold transition-colors sm:text-sm',
                      isActive
                        ? 'bg-white/10 text-white'
                        : 'text-slate-400 hover:bg-white/5 hover:text-slate-100',
                    )}
                  >
                    <Icon className="h-4 w-4" aria-hidden="true" />
                    <span className="hidden sm:inline">{item.label}</span>
                    <span className="sm:hidden">{item.short}</span>
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>
      </div>
    </header>
  );
}

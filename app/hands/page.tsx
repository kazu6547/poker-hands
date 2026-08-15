import type { Metadata } from 'next';
import { ArrowUp } from 'lucide-react';
import { HandList } from '@/components/hands/HandList';

export const metadata: Metadata = {
  title: '役一覧',
  description: 'ポーカーの10役を強い順に。条件・カード例・見分け方・間違えやすい役との違いをまとめています。',
};

export default function HandsPage() {
  return (
    <div className="space-y-6">
      <header className="animate-fade-up text-center">
        <p className="eyebrow">Hand Rankings</p>
        <h1 className="mt-3 text-2xl font-bold sm:text-3xl">役一覧</h1>
        <p className="mx-auto mt-3 max-w-lg text-sm leading-relaxed text-slate-400">
          強い順に並べた10の役です。タップすると、条件・見分け方・間違えやすい役との違いが開きます。
        </p>
      </header>

      <p className="flex items-center justify-center gap-1.5 text-xs font-medium text-slate-500">
        <ArrowUp className="h-3.5 w-3.5" aria-hidden="true" />
        上にあるほど強い役です
      </p>

      <HandList />
    </div>
  );
}

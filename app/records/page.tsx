import type { Metadata } from 'next';
import { ProgressDetail } from '@/components/records/ProgressDetail';

export const metadata: Metadata = {
  title: '学習の記録',
  description: '回答数・正答率・連続正解記録・苦手なトップ3・モード別・役別の成績をまとめて確認できます。',
};

export default function RecordsPage() {
  return (
    <div className="space-y-6">
      <header className="animate-fade-up text-center">
        <p className="eyebrow">Your Progress</p>
        <h1 className="mt-3 text-2xl font-bold sm:text-3xl">学習の記録</h1>
        <p className="mx-auto mt-3 max-w-lg text-sm leading-relaxed text-slate-400">
          これまでの成績と、次に練習したい役をまとめています。
        </p>
      </header>

      <ProgressDetail />
    </div>
  );
}

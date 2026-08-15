import Link from 'next/link';
import { Compass, Home } from 'lucide-react';
import { buttonClasses } from '@/components/ui/buttonStyles';

export default function NotFound() {
  return (
    <div className="mx-auto max-w-md py-10 text-center">
      <span className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-white/8 text-slate-300">
        <Compass className="h-7 w-7" aria-hidden="true" />
      </span>
      <h1 className="mt-4 text-2xl font-bold">ページが見つかりません</h1>
      <p className="mt-3 text-sm leading-relaxed text-slate-400">
        お探しのページはありません。ホームから4つの学習モードに移動できます。
      </p>

      <Link
        href="/"
        className={buttonClasses({ size: 'lg', fullWidth: true, className: 'mt-7' })}
      >
        <Home className="h-4 w-4" aria-hidden="true" />
        ホームへ戻る
      </Link>
    </div>
  );
}

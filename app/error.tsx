'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import { AlertTriangle, Home, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { buttonClasses } from '@/components/ui/buttonStyles';

/**
 * 想定外のエラーが起きても、真っ白な画面にせず学習に戻れるようにする受け皿。
 */
export default function GameError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // 開発時だけ原因を確認できるようにする（本番のビルドでは出力されない）
    if (process.env.NODE_ENV === 'development') {
      console.error(error);
    }
  }, [error]);

  return (
    <div className="mx-auto max-w-md py-10 text-center">
      <span className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-rose-500/15 text-rose-300">
        <AlertTriangle className="h-7 w-7" aria-hidden="true" />
      </span>
      <h1 className="mt-4 text-2xl font-bold">問題が発生しました</h1>
      <p className="mt-3 text-sm leading-relaxed text-slate-400">
        画面の読み込み中に想定外のエラーが起きました。
        もう一度試すか、ホームから学習を続けてください。
      </p>

      <div className="mt-7 flex flex-col gap-3">
        <Button size="lg" fullWidth onClick={reset}>
          <RefreshCw className="h-4 w-4" aria-hidden="true" />
          もう一度読み込む
        </Button>
        <Link href="/" className={buttonClasses({ variant: 'secondary', size: 'lg', fullWidth: true })}>
          <Home className="h-4 w-4" aria-hidden="true" />
          ホームへ戻る
        </Link>
      </div>
    </div>
  );
}

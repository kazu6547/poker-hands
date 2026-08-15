'use client';

import { KeyboardEvent as ReactKeyboardEvent, useEffect, useRef } from 'react';
import Link from 'next/link';
import { Home, LogOut } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { buttonClasses } from '@/components/ui/buttonStyles';
import { accuracyPercent } from '@/lib/progress';

export interface QuitPracticeDialogProps {
  /** 「VSカードを終了しますか？」のように使うモード名 */
  modeName: string;
  answered: number;
  correct: number;
  streak: number;
  /** 練習を続ける（キャンセル） */
  onContinue: () => void;
}

/**
 * 無限モードの終了確認。
 * ここまでの成績を見せたうえで、続けるかホームへ戻るかを選んでもらう。
 * 結果表示と違い、こちらは Esc と背景クリックでキャンセルできる（誤って終了しないため）。
 */
export function QuitPracticeDialog({
  modeName,
  answered,
  correct,
  streak,
  onContinue,
}: QuitPracticeDialogProps) {
  const dialogRef = useRef<HTMLDivElement>(null);
  const continueButtonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    continueButtonRef.current?.focus();
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault();
        onContinue();
      }
    };
    window.addEventListener('keydown', handleKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [onContinue]);

  /** ダイアログ内でフォーカスを循環させる */
  const handleTab = (event: ReactKeyboardEvent<HTMLDivElement>) => {
    if (event.key !== 'Tab') return;
    const focusables = dialogRef.current?.querySelectorAll<HTMLElement>(
      'button:not([disabled]), a[href]',
    );
    if (!focusables || focusables.length === 0) return;

    const first = focusables[0];
    const last = focusables[focusables.length - 1];
    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault();
      first.focus();
    }
  };

  const rows = [
    { label: '回答数', value: `${answered}問` },
    { label: '正解数', value: `${correct}問` },
    { label: '正答率', value: `${accuracyPercent(correct, answered)}%` },
    { label: '連続正解', value: `${streak}回` },
  ];

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-midnight-950/85 p-3 backdrop-blur-sm sm:items-center sm:p-6"
      onClick={onContinue}
    >
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="quit-practice-title"
        onKeyDown={handleTab}
        onClick={(event) => event.stopPropagation()}
        className="panel max-h-[92dvh] w-full max-w-md animate-fade-up overflow-y-auto p-6 sm:p-7"
      >
        <div className="text-center">
          <span className="mx-auto grid h-12 w-12 place-items-center rounded-2xl bg-white/8 text-slate-300">
            <LogOut className="h-6 w-6" aria-hidden="true" />
          </span>
          <h2 id="quit-practice-title" className="mt-4 text-xl font-bold sm:text-2xl">
            {modeName}を終了しますか？
          </h2>
        </div>

        <dl className="mt-5 space-y-2">
          {rows.map((row) => (
            <div
              key={row.label}
              className="flex items-center justify-between rounded-xl border border-white/10 bg-white/3 px-4 py-2.5"
            >
              <dt className="text-xs font-medium text-slate-400">{row.label}</dt>
              <dd className="text-base font-bold tabular-nums text-white">{row.value}</dd>
            </div>
          ))}
        </dl>

        <p className="mt-4 text-center text-xs leading-relaxed text-slate-500">
          学習記録はここまでの分がすでに保存されています。
        </p>

        <div className="mt-6 flex flex-col gap-3">
          <Button ref={continueButtonRef} size="lg" fullWidth onClick={onContinue}>
            続ける
          </Button>
          <Link
            href="/"
            className={buttonClasses({ variant: 'secondary', size: 'lg', fullWidth: true })}
          >
            <Home className="h-4 w-4" aria-hidden="true" />
            ホームへ戻る
          </Link>
        </div>
      </div>
    </div>
  );
}

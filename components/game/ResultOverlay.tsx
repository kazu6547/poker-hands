'use client';

import { KeyboardEvent as ReactKeyboardEvent, ReactNode, useEffect, useRef } from 'react';
import { ArrowRight, Check, RefreshCw, X } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { cn } from '@/lib/cn';

export interface ResultOverlayProps {
  isCorrect: boolean;
  /** 見出し（省略時は「正解！」「不正解」） */
  title?: string;
  /** 見出しの下に置く本文 */
  children: ReactNode;
  primaryLabel: string;
  onPrimary: () => void;
  secondaryLabel?: string;
  onSecondary?: () => void;
  /** 最下部の小さな案内（省略時は Enter の説明） */
  hint?: string;
}

/**
 * 4つのゲームモードで共通の結果表示ダイアログ。
 * 誤操作で閉じないよう、Esc や背景クリックでは閉じない（ボタン操作のみ）。
 */
export function ResultOverlay({
  isCorrect,
  title,
  children,
  primaryLabel,
  onPrimary,
  secondaryLabel,
  onSecondary,
  hint = 'Enter キーでも次に進めます',
}: ResultOverlayProps) {
  const dialogRef = useRef<HTMLDivElement>(null);
  const primaryButtonRef = useRef<HTMLButtonElement>(null);

  // 開いたら主要ボタンにフォーカスを移し、背面のスクロールを止める
  useEffect(() => {
    primaryButtonRef.current?.focus();
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, []);

  // ダイアログ内でフォーカスが循環するようにする
  const handleKeyDown = (event: ReactKeyboardEvent<HTMLDivElement>) => {
    if (event.key !== 'Tab') return;
    const focusables = dialogRef.current?.querySelectorAll<HTMLElement>('button:not([disabled])');
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

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-midnight-950/85 p-3 backdrop-blur-sm sm:items-center sm:p-6">
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="game-result-title"
        onKeyDown={handleKeyDown}
        className="panel max-h-[92dvh] w-full max-w-lg animate-fade-up overflow-y-auto p-6 text-center sm:p-8"
      >
        {/* 色だけでなく、形（チェック／バツ）とテキストでも正誤を伝える */}
        <span
          className={cn(
            'mx-auto grid h-20 w-20 place-items-center rounded-full sm:h-24 sm:w-24',
            isCorrect ? 'bg-emerald-400 text-midnight-950' : 'bg-rose-500 text-white',
          )}
        >
          {isCorrect ? (
            <Check className="h-11 w-11 sm:h-12 sm:w-12" strokeWidth={3} aria-hidden="true" />
          ) : (
            <X className="h-11 w-11 sm:h-12 sm:w-12" strokeWidth={3} aria-hidden="true" />
          )}
        </span>

        <h2
          id="game-result-title"
          className={cn(
            'mt-4 text-3xl font-bold sm:text-4xl',
            isCorrect ? 'text-emerald-300' : 'text-rose-300',
          )}
        >
          {title ?? (isCorrect ? '正解！' : '不正解')}
        </h2>

        {children}

        <div className="mt-7 flex flex-col gap-3">
          <Button ref={primaryButtonRef} size="lg" fullWidth onClick={onPrimary}>
            {primaryLabel}
            <ArrowRight className="h-5 w-5" aria-hidden="true" />
          </Button>
          {secondaryLabel && onSecondary ? (
            <Button variant="secondary" size="lg" fullWidth onClick={onSecondary}>
              <RefreshCw className="h-4 w-4" aria-hidden="true" />
              {secondaryLabel}
            </Button>
          ) : null}
        </div>

        <p className="mt-4 text-xs text-slate-500">{hint}</p>
      </div>
    </div>
  );
}

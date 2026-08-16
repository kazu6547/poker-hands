import { cn } from '@/lib/cn';

export type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'gold';
export type ButtonSize = 'md' | 'lg';

/**
 * 押したくなる手触り（磁力感）の共通部分。
 * - hover できる環境でだけ 1px 浮く
 * - 押した瞬間は速く沈む
 * - 押せないときは、浮きも沈みも起こさない
 */
/*
  :not(:disabled) を使うのは、この見た目をリンク（<a>）にも適用しているため。
  :enabled はボタンにしか当たらないので、リンクだけ手触りが変わってしまう。
*/
const BASE =
  'relative overflow-hidden inline-flex select-none items-center justify-center gap-2 rounded-xl font-semibold transition-[transform,background-color,border-color,box-shadow,opacity] duration-200 ease-out [&:not(:disabled)]:active:duration-75 disabled:cursor-not-allowed disabled:opacity-40 disabled:shadow-none disabled:translate-y-0 disabled:scale-100';

const VARIANTS: Record<ButtonVariant, string> = {
  primary:
    'bg-emerald-400 text-midnight-950 shadow-[0_12px_30px_-14px_rgba(52,211,153,0.85)] [&:not(:disabled)]:hover:-translate-y-px [&:not(:disabled)]:hover:bg-emerald-300 [&:not(:disabled)]:hover:shadow-[0_18px_36px_-14px_rgba(52,211,153,0.95)] [&:not(:disabled)]:active:translate-y-px [&:not(:disabled)]:active:scale-[0.99]',
  secondary:
    'border border-white/15 bg-white/5 text-slate-100 [&:not(:disabled)]:hover:-translate-y-px [&:not(:disabled)]:hover:border-white/25 [&:not(:disabled)]:hover:bg-white/10 [&:not(:disabled)]:active:translate-y-px [&:not(:disabled)]:active:scale-[0.99]',
  ghost: 'text-slate-300 [&:not(:disabled)]:hover:bg-white/5 [&:not(:disabled)]:hover:text-white',
  gold: 'bg-gold text-midnight-950 shadow-[0_12px_30px_-14px_rgba(232,200,126,0.85)] [&:not(:disabled)]:hover:-translate-y-px [&:not(:disabled)]:hover:bg-gold-soft [&:not(:disabled)]:hover:shadow-[0_18px_36px_-14px_rgba(232,200,126,0.95)] [&:not(:disabled)]:active:translate-y-px [&:not(:disabled)]:active:scale-[0.99]',
};

const SIZES: Record<ButtonSize, string> = {
  md: 'h-11 px-5 text-sm',
  lg: 'h-14 px-6 text-base',
};

export interface ButtonStyleOptions {
  variant?: ButtonVariant;
  size?: ButtonSize;
  fullWidth?: boolean;
  className?: string;
}

/** ボタンとリンクで同じ見た目を共有するためのクラス生成 */
export function buttonClasses({
  variant = 'primary',
  size = 'md',
  fullWidth = false,
  className,
}: ButtonStyleOptions = {}): string {
  return cn(BASE, VARIANTS[variant], SIZES[size], fullWidth && 'w-full', className);
}

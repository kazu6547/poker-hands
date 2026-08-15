import { cn } from '@/lib/cn';

export type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'gold';
export type ButtonSize = 'md' | 'lg';

const BASE =
  'inline-flex select-none items-center justify-center gap-2 rounded-xl font-semibold transition-all duration-200 disabled:cursor-not-allowed disabled:opacity-40 disabled:shadow-none';

const VARIANTS: Record<ButtonVariant, string> = {
  primary:
    'bg-emerald-400 text-midnight-950 shadow-[0_12px_30px_-14px_rgba(52,211,153,0.85)] hover:bg-emerald-300 active:translate-y-px',
  secondary:
    'border border-white/15 bg-white/5 text-slate-100 hover:border-white/25 hover:bg-white/10 active:translate-y-px',
  ghost: 'text-slate-300 hover:bg-white/5 hover:text-white',
  gold: 'bg-gold text-midnight-950 shadow-[0_12px_30px_-14px_rgba(232,200,126,0.85)] hover:bg-gold-soft active:translate-y-px',
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

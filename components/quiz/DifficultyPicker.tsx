import { ChevronRight, Gauge } from 'lucide-react';
import { DIFFICULTY_LABELS } from '@/lib/generator';
import { cn } from '@/lib/cn';
import { Difficulty } from '@/lib/types';

export interface DifficultyPickerProps {
  onSelect: (difficulty: Difficulty) => void;
  /** 見出しや説明文（モードごとに変える） */
  title: string;
  description: string;
  /** 難易度ごとの説明（省略時は「役を当てる」向けの既定文） */
  levelDescriptions?: Partial<Record<Difficulty, string>>;
}

const ORDER: Difficulty[] = ['beginner', 'intermediate', 'advanced'];

const TONES: Record<Difficulty, string> = {
  beginner: 'text-emerald-300 bg-emerald-400/15',
  intermediate: 'text-iris-soft bg-iris/20',
  advanced: 'text-gold bg-gold/15',
};

/** 難易度を選ぶ画面 */
export function DifficultyPicker({
  onSelect,
  title,
  description,
  levelDescriptions,
}: DifficultyPickerProps) {
  return (
    <div className="animate-fade-up mx-auto max-w-2xl">
      <div className="text-center">
        <span className="mx-auto grid h-12 w-12 place-items-center rounded-2xl bg-emerald-400/15 text-emerald-300">
          <Gauge className="h-6 w-6" aria-hidden="true" />
        </span>
        <h1 className="mt-4 text-2xl font-bold sm:text-3xl">{title}</h1>
        <p className="mt-2 text-sm leading-relaxed text-slate-400">{description}</p>
        <p className="mt-2 text-xs text-slate-500">
          数字キー 1〜4 で回答、Enter キーで次へ進むこともできます
        </p>
      </div>

      <ul className="mt-8 space-y-3">
        {ORDER.map((difficulty) => {
          const label = DIFFICULTY_LABELS[difficulty];
          return (
            <li key={difficulty}>
              <button
                type="button"
                onClick={() => onSelect(difficulty)}
                className="panel group flex w-full items-center gap-4 p-5 text-left transition-all duration-200 hover:-translate-y-0.5 hover:border-white/25"
              >
                <span
                  className={cn(
                    'grid h-11 w-11 shrink-0 place-items-center rounded-xl text-sm font-bold',
                    TONES[difficulty],
                  )}
                >
                  {label.name}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block text-base font-bold text-white">{label.name}レベル</span>
                  <span className="mt-1 block text-xs leading-relaxed text-slate-400">
                    {levelDescriptions?.[difficulty] ?? label.description}
                  </span>
                </span>
                <ChevronRight
                  className="h-5 w-5 shrink-0 text-slate-500 transition-transform duration-200 group-hover:translate-x-1 group-hover:text-slate-300"
                  aria-hidden="true"
                />
              </button>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

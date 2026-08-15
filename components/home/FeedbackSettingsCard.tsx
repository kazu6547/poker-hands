'use client';

import { Vibrate, Volume2, VolumeX } from 'lucide-react';
import { useFeedbackSettings } from '@/hooks/useFeedbackSettings';
import { cn } from '@/lib/cn';

interface ToggleRowProps {
  label: string;
  description: string;
  checked: boolean;
  disabled?: boolean;
  onChange: (value: boolean) => void;
  children: React.ReactNode;
}

function ToggleRow({ label, description, checked, disabled = false, onChange, children }: ToggleRowProps) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      disabled={disabled}
      onClick={() => onChange(!checked)}
      className={cn(
        'flex flex-1 items-center gap-3 rounded-xl border px-3 py-2.5 text-left transition-colors',
        checked
          ? 'border-emerald-400/40 bg-emerald-400/8'
          : 'border-white/10 bg-white/[0.03] hover:bg-white/[0.06]',
        disabled && 'cursor-not-allowed opacity-45',
      )}
    >
      <span
        className={cn(
          'grid h-8 w-8 shrink-0 place-items-center rounded-lg',
          checked ? 'bg-emerald-400/20 text-emerald-300' : 'bg-white/8 text-slate-400',
        )}
      >
        {children}
      </span>
      <span className="min-w-0 flex-1">
        <span className="block text-xs font-bold text-white">{label}</span>
        <span className="block text-[0.7rem] text-slate-400">{description}</span>
      </span>
      <span
        aria-hidden="true"
        className={cn(
          'flex h-5 w-9 shrink-0 items-center rounded-full p-0.5 transition-colors',
          checked ? 'bg-emerald-400' : 'bg-white/15',
        )}
      >
        <span
          className={cn(
            'h-4 w-4 rounded-full bg-white transition-transform duration-200',
            checked && 'translate-x-4',
          )}
        />
      </span>
    </button>
  );
}

/** 効果音・振動の設定（ホーム下部の控えめな導線） */
export function FeedbackSettingsCard() {
  const { settings, isReady, vibrationSupported, update } = useFeedbackSettings();

  return (
    <section className="panel p-4" aria-label="サウンドと振動の設定" aria-busy={!isReady}>
      <p className="eyebrow mb-3">サウンドと振動</p>
      <div className="flex flex-col gap-2 sm:flex-row">
        <ToggleRow
          label="効果音"
          description="正解・不正解のときに短い音を鳴らす"
          checked={settings.sound}
          onChange={(value) => update({ sound: value })}
        >
          {settings.sound ? (
            <Volume2 className="h-4 w-4" aria-hidden="true" />
          ) : (
            <VolumeX className="h-4 w-4" aria-hidden="true" />
          )}
        </ToggleRow>

        <ToggleRow
          label="振動"
          description={vibrationSupported ? 'スマホで軽く振動させる' : 'この端末は振動に対応していません'}
          checked={settings.vibration && vibrationSupported}
          disabled={!vibrationSupported}
          onChange={(value) => update({ vibration: value })}
        >
          <Vibrate className="h-4 w-4" aria-hidden="true" />
        </ToggleRow>
      </div>
    </section>
  );
}

'use client';

import { useRef, useState } from 'react';
import { ChevronDown, ChevronUp, SlidersHorizontal, Vibrate, Volume2, VolumeX } from 'lucide-react';
import { useFeedbackSettings } from '@/hooks/useFeedbackSettings';
import { cn } from '@/lib/cn';
import { playSound } from '@/lib/feedbackFx';
import { HapticsKind, previewHaptics } from '@/lib/haptics';

const PANEL_ID = 'feedback-settings-panel';
const BUTTON_ID = 'feedback-settings-button';

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
      aria-label={`${label}。現在${checked ? 'オン' : 'オフ'}`}
      disabled={disabled}
      onClick={() => onChange(!checked)}
      className={cn(
        'flex min-h-[3rem] flex-1 items-center gap-3 rounded-xl border px-3 py-2.5 text-left transition-colors',
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
        <span className="block text-[0.7rem] leading-snug text-slate-400">{description}</span>
      </span>
      {/* 色と形だけでなく、ON / OFF の文字でも状態を示す */}
      <span
        aria-hidden="true"
        className={cn(
          'shrink-0 text-[0.7rem] font-bold tabular-nums',
          checked ? 'text-emerald-300' : 'text-slate-500',
        )}
      >
        {checked ? 'ON' : 'OFF'}
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

/** 端末ごとに、振動でできることが違うので説明を変える */
const VIBRATION_DESCRIPTION: Record<HapticsKind, string> = {
  vibration: 'スマホで軽く振動させる',
  switch: 'iPhone / iPad で軽い触覚フィードバックを返す',
  none: 'この端末は振動に対応していません',
};

/**
 * 効果音・振動の設定。
 * 「はじめての方へ」と同じ開閉パターンで、初期状態は閉じている。
 * 閉じているときも、いまの ON / OFF が文字で分かるようにしておく。
 */
export function FeedbackSettingsCard() {
  const { settings, isReady, vibrationSupported, vibrationKind, update } = useFeedbackSettings();
  const [isOpen, setIsOpen] = useState(false);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);

  const toggleOpen = () => {
    setIsOpen((current) => {
      // 閉じるとき、パネルの中にフォーカスがあると行き場を失うので、トリガーへ戻す
      if (current && panelRef.current?.contains(document.activeElement)) {
        triggerRef.current?.focus();
      }
      return !current;
    });
  };

  const soundOn = settings.sound;
  const vibrationOn = settings.vibration && vibrationSupported;
  const summary = `サウンド ${soundOn ? 'ON' : 'OFF'} ・ 振動 ${
    vibrationSupported ? (vibrationOn ? 'ON' : 'OFF') : '非対応'
  }`;

  return (
    <section className="panel overflow-hidden" aria-busy={!isReady}>
      <h2>
        <button
          type="button"
          ref={triggerRef}
          id={BUTTON_ID}
          aria-expanded={isOpen}
          aria-controls={PANEL_ID}
          aria-label={`サウンド・振動設定。現在、${summary}。${isOpen ? '展開しています' : '折りたたまれています'}`}
          onClick={toggleOpen}
          className="flex w-full items-center gap-3 p-5 text-left transition-colors hover:bg-white/5"
        >
          <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-emerald-400/15 text-emerald-300">
            <SlidersHorizontal className="h-5 w-5" aria-hidden="true" />
          </span>
          <span className="min-w-0 flex-1">
            <span className="block text-base font-bold text-white">サウンド・振動</span>
            <span aria-hidden="true" className="mt-0.5 block text-xs leading-snug text-slate-400">
              {summary}
            </span>
          </span>
          {isOpen ? (
            <ChevronUp className="h-5 w-5 shrink-0 text-slate-400" aria-hidden="true" />
          ) : (
            <ChevronDown className="h-5 w-5 shrink-0 text-slate-400" aria-hidden="true" />
          )}
        </button>
      </h2>

      {/* grid-rows を 0fr ↔ 1fr で切り替えて、短く滑らかに開閉する */}
      <div
        className={cn(
          'grid transition-[grid-template-rows] duration-200 ease-out',
          isOpen ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]',
        )}
      >
        <div className="overflow-hidden">
          {/* 閉じているときは、中のトグルを読み上げ・Tab の対象から外す */}
          <div
            ref={panelRef}
            id={PANEL_ID}
            role="region"
            aria-labelledby={BUTTON_ID}
            inert={!isOpen}
            className="border-t border-white/10 p-5"
          >
            <div className="flex flex-col gap-2 sm:flex-row">
              <ToggleRow
                label="効果音"
                description="正解・不正解のときに短い音を鳴らす"
                checked={settings.sound}
                onChange={(value) => {
                  update({ sound: value });
                  // ONにしたときだけ、どんな音か分かるように短く試聴させる
                  if (value) playSound('sound-enabled');
                }}
              >
                {settings.sound ? (
                  <Volume2 className="h-4 w-4" aria-hidden="true" />
                ) : (
                  <VolumeX className="h-4 w-4" aria-hidden="true" />
                )}
              </ToggleRow>

              <ToggleRow
                label="振動"
                description={VIBRATION_DESCRIPTION[vibrationKind]}
                checked={settings.vibration && vibrationSupported}
                disabled={!vibrationSupported}
                onChange={(value) => {
                  update({ vibration: value });
                  // ONにしたときだけ、実際に返るかどうかその場で分かるように一度動かす
                  if (value) previewHaptics();
                }}
              >
                <Vibrate className="h-4 w-4" aria-hidden="true" />
              </ToggleRow>
            </div>

            {vibrationKind === 'switch' ? (
              <p className="mt-3 text-[0.7rem] leading-relaxed text-slate-500">
                iPhone / iPad の Safari は振動そのものを鳴らせないため、軽いタップ感だけを返します。
                iOS 17.4 以降で、設定 &gt; サウンドと触覚 &gt;
                システムハプティクスがオンのときに動作します。
              </p>
            ) : null}
          </div>
        </div>
      </div>
    </section>
  );
}

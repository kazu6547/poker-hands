/**
 * 触覚フィードバック（振動）の入り口。
 *
 * Android の Chrome などは Vibration API（navigator.vibrate）で
 * 長さのパターンをそのまま再生できる。
 *
 * 一方 iPhone / iPad の Safari は Vibration API に対応していないため、
 * iOS 17.4 以降のスイッチ型チェックボックス（<input type="checkbox" switch>）を
 * 切り替えたときに OS が返す触覚フィードバックを借りて、軽いタップ感だけを再現する。
 * 強さも長さも指定できないので、パターンは「タップの回数と間隔」に読み替える。
 */

export type HapticsKind =
  /** navigator.vibrate が使える（パターンをそのまま再生できる） */
  | 'vibration'
  /** iOS のスイッチ操作による軽いタップのみ */
  | 'switch'
  | 'none';

/** タップを重ねても分からなくなるため、この間隔より近いものは間引く */
const MIN_TAP_INTERVAL_MS = 50;
/** 連打に感じさせないための上限 */
const MAX_TAPS = 3;

/**
 * 振動パターン（[振動, 休み, 振動, ...] ミリ秒）を、
 * タップを鳴らす時刻（ミリ秒）の並びに読み替える。
 */
export function patternToTapDelays(pattern: readonly number[]): number[] {
  const delays: number[] = [];
  let elapsed = 0;
  let lastKept = Number.NEGATIVE_INFINITY;

  for (let i = 0; i < pattern.length; i += 1) {
    const value = Math.max(0, pattern[i]);
    // 偶数番目が「振動している区間」なので、その先頭でタップする
    if (i % 2 === 0 && elapsed - lastKept >= MIN_TAP_INTERVAL_MS) {
      delays.push(elapsed);
      lastKept = elapsed;
      if (delays.length >= MAX_TAPS) break;
    }
    elapsed += value;
  }

  return delays;
}

function hasVibrationApi(): boolean {
  if (typeof navigator === 'undefined') return false;
  return typeof navigator.vibrate === 'function';
}

/**
 * iOS のスイッチ触覚が使えそうか。
 * `switch` 属性は WebKit だけの機能なので、
 * 触覚を持たない Mac の Safari を除くためタッチ対応も条件にする。
 */
function hasSwitchHaptics(): boolean {
  if (typeof document === 'undefined' || typeof navigator === 'undefined') return false;
  try {
    if ((navigator.maxTouchPoints ?? 0) < 1) return false;
    return 'switch' in document.createElement('input');
  } catch {
    return false;
  }
}

/** この端末で使える触覚フィードバックの種類 */
export function hapticsKind(): HapticsKind {
  if (hasVibrationApi()) return 'vibration';
  if (hasSwitchHaptics()) return 'switch';
  return 'none';
}

let switchTrigger: HTMLLabelElement | null = null;

/** スイッチ触覚用の隠し要素を用意する（読み上げ・フォーカスからは外す） */
function getSwitchTrigger(): HTMLLabelElement | null {
  if (typeof document === 'undefined' || !document.body) return null;
  if (switchTrigger?.isConnected) return switchTrigger;

  try {
    const label = document.createElement('label');
    label.setAttribute('aria-hidden', 'true');
    // display:none にすると触覚が返らない端末があるため、見えないだけの状態で置く
    label.style.cssText =
      'position:fixed;top:0;left:0;width:1px;height:1px;opacity:0;overflow:hidden;pointer-events:none;';

    const input = document.createElement('input');
    input.type = 'checkbox';
    input.setAttribute('switch', '');
    input.tabIndex = -1;

    label.appendChild(input);
    document.body.appendChild(label);
    switchTrigger = label;
    return label;
  } catch {
    return null;
  }
}

function tapOnce(): void {
  const trigger = getSwitchTrigger();
  if (!trigger) return;
  try {
    // ラベルをクリックするとスイッチが切り替わり、OS が触覚を返す
    trigger.click();
  } catch {
    // 返らなくても進行に影響させない
  }
}

/**
 * 振動パターンを再生する。
 * 端末が対応していない、またはユーザー操作前なら何もしない。
 */
export function playHaptics(pattern: readonly number[] | undefined): void {
  if (!pattern || pattern.length === 0) return;

  // ユーザー操作前の呼び出しはブラウザにブロックされる
  if (typeof navigator !== 'undefined') {
    const activation = navigator.userActivation;
    if (activation && !activation.hasBeenActive) return;
  }

  const kind = hapticsKind();
  if (kind === 'vibration') {
    try {
      navigator.vibrate([...pattern]);
    } catch {
      // 拒否されても何もしない
    }
    return;
  }

  if (kind !== 'switch') return;

  for (const delay of patternToTapDelays(pattern)) {
    if (delay === 0) tapOnce();
    else window.setTimeout(tapOnce, delay);
  }
}

/** 設定でONにしたときの試し打ち（どんな感触か、その場で確かめられるように） */
export function previewHaptics(): void {
  playHaptics([16, 45, 16]);
}

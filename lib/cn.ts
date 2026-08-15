/** クラス名を結合する小さなヘルパー（falsy な値は無視する） */
export function cn(...values: (string | false | null | undefined)[]): string {
  return values.filter(Boolean).join(' ');
}

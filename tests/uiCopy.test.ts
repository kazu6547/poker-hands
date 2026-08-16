import assert from 'node:assert/strict';
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { describe, it } from 'node:test';
import { fileURLToPath } from 'node:url';

/**
 * 画面に出る文言と、演出の約束ごとをソースの時点で守るためのテスト。
 * 「直したつもりが別の画面に残っていた」を防ぐのが目的。
 */

// 日本語を含むパスでも壊れないよう、URL ではなくファイルパスへ変換する
const ROOT = fileURLToPath(new URL('..', import.meta.url));
const UI_DIRECTORIES = ['app', 'components', 'lib', 'hooks', 'data'];

function collectFiles(directory: string): string[] {
  const full = join(ROOT, directory);
  const entries = readdirSync(full);
  return entries.flatMap((entry) => {
    const path = join(full, entry);
    if (statSync(path).isDirectory()) return collectFiles(join(directory, entry));
    return /\.(ts|tsx)$/.test(entry) ? [path] : [];
  });
}

const UI_FILES = UI_DIRECTORIES.flatMap(collectFiles);
const readAll = () => UI_FILES.map((path) => ({ path, text: readFileSync(path, 'utf8') }));

describe('画面に出る文言', () => {
  it('フッターは「役を覚える学習アプリ」', () => {
    const layout = readFileSync(join(ROOT, 'app/layout.tsx'), 'utf8');
    assert.ok(layout.includes('役を覚える学習アプリ'), 'フッターの新しい文言が見つからない');
    assert.ok(
      !layout.includes('役を覚えるための練習アプリです'),
      '古いフッター文言が残っている',
    );
  });

  it('旧フッター文言がどこにも残っていない', () => {
    const found = readAll().filter(({ text }) => text.includes('役を覚えるための練習アプリです'));
    assert.deepEqual(found.map((file) => file.path), []);
  });

  it('ユーザー向けの表記は「連続正解記録」に統一されている', () => {
    const progressSummary = readFileSync(join(ROOT, 'components/home/ProgressSummary.tsx'), 'utf8');
    assert.ok(progressSummary.includes("label: '連続正解記録'"), '新しいラベルが見つからない');

    // 内部のコメント（lib/types.ts など）は対象外。画面に出る文字列だけを見る
    const leftovers = readAll().filter(({ path, text }) => {
      if (path.endsWith('lib/types.ts')) return false;
      return /['"`][^'"`]*最長連続正解[^'"`]*['"`]/.test(text);
    });
    assert.deepEqual(leftovers.map((file) => file.path), []);
  });

  it('旧モード名が画面に残っていない', () => {
    const leftovers = readAll().filter(({ text }) =>
      /['"`][^'"`]*(強さ比較|最強の5枚を選ぶ)[^'"`]*['"`]/.test(text),
    );
    assert.deepEqual(leftovers.map((file) => file.path), []);
  });

  it('「連続正解記録」のラベルを truncate で省略していない', () => {
    const progressSummary = readFileSync(join(ROOT, 'components/home/ProgressSummary.tsx'), 'utf8');
    const labelBlock = progressSummary.slice(
      progressSummary.indexOf('<dt'),
      progressSummary.indexOf('</dt>'),
    );
    assert.ok(!labelBlock.includes('truncate'), 'ラベルが truncate されている');
    assert.ok(!labelBlock.includes('text-ellipsis'), 'ラベルが省略記号で切られている');
  });
});

describe('アニメーションの約束', () => {
  const tailwindConfig = readFileSync(join(ROOT, 'tailwind.config.ts'), 'utf8');

  it('無限に繰り返すアニメーションを定義していない', () => {
    assert.ok(!tailwindConfig.includes('infinite'), 'infinite なアニメーションが残っている');
  });

  it('ヒントの脈動は3回で止まる', () => {
    assert.match(tailwindConfig, /'pulse-ring': 'pulse-ring [\d.]+s ease-in-out 3'/);
  });

  it('金色の枠はアニメーションが止まっても残る（クラス側で描いている）', () => {
    const playingCard = readFileSync(join(ROOT, 'components/cards/PlayingCard.tsx'), 'utf8');
    const hintLine = playingCard.split('\n').find((line) => line.includes('animate-pulse-ring'));
    assert.ok(hintLine, 'ヒントの指定が見つからない');
    assert.ok(hintLine.includes('ring-2'), 'ヒントの枠がクラスで描かれていない');
    assert.ok(hintLine.includes('ring-gold'), 'ヒントの枠が金色でない');
  });
});

describe('危ないコードが混ざっていない', () => {
  it('dangerouslySetInnerHTML を使っていない', () => {
    const found = readAll().filter(({ text }) => text.includes('dangerouslySetInnerHTML'));
    assert.deepEqual(found.map((file) => file.path), []);
  });

  it('console.log を残していない', () => {
    const found = readAll().filter(({ text }) => /\bconsole\.log\s*\(/.test(text));
    assert.deepEqual(found.map((file) => file.path), []);
  });

  it('any を書いていない', () => {
    const found = readAll().filter(({ text }) => /:\s*any\b|<any>|as any\b/.test(text));
    assert.deepEqual(found.map((file) => file.path), []);
  });
});

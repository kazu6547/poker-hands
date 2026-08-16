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

describe('ホームと学習記録の分担', () => {
  const home = readFileSync(join(ROOT, 'app/page.tsx'), 'utf8');

  it('苦手なトップ3はホームに置かない', () => {
    assert.ok(!home.includes('WeakHands'), 'ホームがまだ苦手な役を読み込んでいる');
    // コメントを取り除いてから、画面に出る文字として残っていないか見る
    const withoutComments = home
      .replace(/\/\*[\s\S]*?\*\//g, '')
      .replace(/\/\/.*$/gm, '');
    assert.ok(!withoutComments.includes('苦手'), 'ホームに苦手の文言が残っている');
  });

  it('ホームから学習記録画面へ行ける', () => {
    const summary = readFileSync(join(ROOT, 'components/home/ProgressSummary.tsx'), 'utf8');
    assert.match(summary, /href="\/records"/);
  });

  it('学習記録画面に苦手なトップ3がある', () => {
    const detail = readFileSync(join(ROOT, 'components/records/ProgressDetail.tsx'), 'utf8');
    assert.ok(detail.includes('<WeakHands'), '学習記録に苦手なトップ3が無い');
    const weak = readFileSync(join(ROOT, 'components/records/WeakHands.tsx'), 'utf8');
    assert.ok(weak.includes('苦手なトップ3'), '見出しが違う');
    // 既存の算出ロジックをそのまま使う（複製しない）
    assert.ok(weak.includes("from '@/lib/progress'"), '苦手役の算出を作り直している');
    assert.ok(weak.includes('weakestHands('), '既存の算出関数を使っていない');
  });

  it('責めるような言い回しを使わない', () => {
    const weak = readFileSync(join(ROOT, 'components/records/WeakHands.tsx'), 'utf8');
    for (const word of ['あなたの弱点', '苦手すぎる', 'できていない役', '要復習']) {
      assert.ok(!weak.includes(word), `${word} という表現が入っている`);
    }
  });
});

describe('サウンド・振動の開閉UI', () => {
  const card = readFileSync(join(ROOT, 'components/home/FeedbackSettingsCard.tsx'), 'utf8');
  const gettingStarted = readFileSync(join(ROOT, 'components/home/GettingStarted.tsx'), 'utf8');

  it('「はじめての方へ」と同じ開閉パターンになっている', () => {
    for (const marker of ['aria-expanded={isOpen}', 'aria-controls={PANEL_ID}', "grid-rows-[1fr]", "grid-rows-[0fr]"]) {
      assert.ok(card.includes(marker), `${marker} が無い`);
      assert.ok(gettingStarted.includes(marker), `はじめての方へ側に ${marker} が無い`);
    }
  });

  it('初期状態は閉じている', () => {
    assert.match(card, /useState\(false\)/);
  });

  it('閉じているときは中のトグルを操作対象から外す', () => {
    assert.ok(card.includes('inert={!isOpen}'), '閉じたパネルが Tab 順に残る');
  });

  it('開閉ではサウンド・振動の設定値を変えない', () => {
    const toggleBlock = card.slice(card.indexOf('const toggleOpen'), card.indexOf('const soundOn'));
    assert.ok(!toggleBlock.includes('update('), '開閉で設定を書き換えている');
    assert.ok(!toggleBlock.includes('playSound('), '開閉で音を鳴らしている');
    assert.ok(!toggleBlock.includes('previewHaptics('), '開閉で振動させている');
  });

  it('閉じていても現在の状態が文字で分かる', () => {
    assert.ok(card.includes("サウンド ${soundOn ? 'ON' : 'OFF'}"), '状態の要約が無い');
  });
});

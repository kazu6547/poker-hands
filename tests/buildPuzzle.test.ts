import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { combinations } from '../lib/bestFive';
import { evaluateHand } from '../lib/evaluator';
import { BUILD_TARGETS, generateBuildPuzzle, generateBuildPuzzleSet } from '../lib/generator';
import { HANDS_BY_ID } from '../data/hands';

describe('generateBuildPuzzle（役を作る）', () => {
  it('お題は「ハイカード」以外の9役から出題される', () => {
    assert.equal(BUILD_TARGETS.length, 9);
    assert.equal(BUILD_TARGETS.includes('high-card'), false);
  });

  it('場のカードに重複がなく、枚数が7〜9枚である', () => {
    for (let i = 0; i < 200; i += 1) {
      const puzzle = generateBuildPuzzle();
      const ids = puzzle.board.map((card) => card.id);
      assert.equal(new Set(ids).size, ids.length, '同じカードが2枚以上ある');
      assert.ok(puzzle.board.length >= 7 && puzzle.board.length <= 9);
    }
  });

  it('正解の5枚が必ず場に含まれ、お題どおりの役になる', () => {
    for (let i = 0; i < 200; i += 1) {
      const puzzle = generateBuildPuzzle();
      const boardIds = new Set(puzzle.board.map((card) => card.id));

      assert.equal(puzzle.solutionIds.length, 5);
      assert.equal(new Set(puzzle.solutionIds).size, 5);
      for (const id of puzzle.solutionIds) {
        assert.ok(boardIds.has(id), '正解カードが場にない');
      }

      const solution = puzzle.board.filter((card) => puzzle.solutionIds.includes(card.id));
      assert.equal(evaluateHand(solution).handId, puzzle.targetHandId);
    }
  });

  it('場の全組み合わせを調べても、必ずお題の役を作れる（総当たり検証）', () => {
    for (let i = 0; i < 60; i += 1) {
      const puzzle = generateBuildPuzzle();
      const solvable = combinations(puzzle.board, 5).some(
        (combo) => evaluateHand(combo).handId === puzzle.targetHandId,
      );
      assert.ok(solvable, `${puzzle.targetHandId} を作れない場が生成された`);
    }
  });

  it('直前と同じお題が連続しない', () => {
    let previous = generateBuildPuzzle().targetHandId;
    for (let i = 0; i < 60; i += 1) {
      const next = generateBuildPuzzle(previous);
      assert.notEqual(next.targetHandId, previous);
      previous = next.targetHandId;
    }
  });

  it('9役すべてが出題されうる', () => {
    const seen = new Set<string>();
    for (let i = 0; i < 600; i += 1) {
      seen.add(generateBuildPuzzle().targetHandId);
    }
    assert.equal(seen.size, BUILD_TARGETS.length);
  });

  it('お題の役名・条件がデータと一致している（本物のポーカーの定義）', () => {
    const expected: Record<string, string> = {
      'royal-flush': '同じマークの 10 / J / Q / K / A の5枚がそろっている',
      'straight-flush': '5枚すべてが同じマークで、かつ数字が連続している',
      'four-of-a-kind': '同じ数字のカードが4枚ある',
      'full-house': '同じ数字が3枚＋別の同じ数字が2枚（3 + 2）',
      flush: '5枚すべてが同じマーク（スート）',
      straight: '数字が5枚連続している（A-2-3-4-5 と 10-J-Q-K-A のどちらも可）',
      'three-of-a-kind': '同じ数字が3枚あり、残り2枚はペアになっていない',
      'two-pair': '同じ数字の2枚組が2種類ある',
      'one-pair': '同じ数字の2枚組が1組だけある',
    };
    for (const handId of BUILD_TARGETS) {
      assert.equal(HANDS_BY_ID[handId].condition, expected[handId]);
    }
  });
});

describe('generateBuildPuzzleSet（10問セット）', () => {
  it('指定した数だけ問題を作る', () => {
    assert.equal(generateBuildPuzzleSet(10).length, 10);
  });

  it('同じお題が連続せず、偏りが小さい（10問中どのお題も2回まで）', () => {
    for (let i = 0; i < 60; i += 1) {
      const set = generateBuildPuzzleSet(10);
      const targets = set.map((puzzle) => puzzle.targetHandId);

      for (let n = 1; n < targets.length; n += 1) {
        assert.notEqual(targets[n], targets[n - 1], '同じお題が連続している');
      }

      const counts = new Map<string, number>();
      for (const target of targets) counts.set(target, (counts.get(target) ?? 0) + 1);
      for (const [target, count] of counts) {
        assert.ok(count <= 2, `${target} が ${count} 回出題されている`);
      }
      // 10問中9種類以上のお題が登場する
      assert.ok(counts.size >= 9);
    }
  });

  it('セット内のどの問題も、場からお題の役を作れる', () => {
    for (const puzzle of generateBuildPuzzleSet(10)) {
      const solvable = combinations(puzzle.board, 5).some(
        (combo) => evaluateHand(combo).handId === puzzle.targetHandId,
      );
      assert.ok(solvable);
      assert.equal(new Set(puzzle.board.map((card) => card.id)).size, puzzle.board.length);
    }
  });
});

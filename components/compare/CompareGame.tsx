'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { SlidersHorizontal } from 'lucide-react';
import { CardHand } from '@/components/cards/CardHand';
import { GameStatsBar } from '@/components/game/GameStatsBar';
import { QuitPracticeDialog } from '@/components/game/QuitPracticeDialog';
import { ResultOverlay } from '@/components/game/ResultOverlay';
import { SetResult } from '@/components/game/SetResult';
import { DifficultyPicker } from '@/components/quiz/DifficultyPicker';
import { HANDS_BY_ID } from '@/data/hands';
import { QUESTIONS_PER_SET, useGameSession } from '@/hooks/useGameSession';
import { useProgress } from '@/hooks/useProgress';
import { cn } from '@/lib/cn';
import {
  COMPARE_ANSWER_LABEL,
  CompareAnswer,
  ComparePuzzle,
  compareResultHeadline,
  describeComparison,
  generateComparePuzzle,
  generateComparePuzzleSet,
} from '@/lib/compare';
import { playFeedback } from '@/lib/feedbackFx';
import { DIFFICULTY_LABELS } from '@/lib/generator';
import { Difficulty } from '@/lib/types';

const ANSWER_ORDER: CompareAnswer[] = ['A', 'B', 'tie'];

const LEVEL_DESCRIPTIONS: Record<Difficulty, string> = {
  beginner: '違う役同士の比較だけ。役の強さの順番を覚えます',
  intermediate: '同じ役同士の比較も登場。数字の大きさで勝負が決まります',
  advanced: 'キッカー勝負や引き分けも出題。細かい強弱まで見分けます',
};

type Phase = 'setup' | 'playing' | 'result';

/** 学習モード：強さ比較 */
export function CompareGame() {
  const { recordModeAnswer } = useProgress();
  const session = useGameSession();

  const [phase, setPhase] = useState<Phase>('setup');
  const [difficulty, setDifficulty] = useState<Difficulty>('beginner');
  const [puzzles, setPuzzles] = useState<ComparePuzzle[]>([]);
  const [selected, setSelected] = useState<CompareAnswer | null>(null);
  const [isQuitOpen, setIsQuitOpen] = useState(false);
  const index = session.index;
  /** 連打で同じ問題が二重集計されないようにする同期的な鍵 */
  const answerLockRef = useRef(false);

  const puzzle: ComparePuzzle | undefined = puzzles[index];
  const isAnswered = selected !== null;
  const isCorrect = isAnswered && !!puzzle && selected === puzzle.answer;
  const isLastQuestion = session.isLastQuestion;

  const start = useCallback(
    (level: Difficulty) => {
      answerLockRef.current = false;
      setDifficulty(level);
      setPuzzles(generateComparePuzzleSet(level, QUESTIONS_PER_SET));
      setSelected(null);
      setIsQuitOpen(false);
      session.reset();
      setPhase('playing');
    },
    [session],
  );

  const handleAnswer = useCallback(
    (answer: CompareAnswer) => {
      if (!puzzle || selected !== null || answerLockRef.current) return;
      answerLockRef.current = true;
      setSelected(answer);

      const answeredCorrectly = answer === puzzle.answer;
      playFeedback(answeredCorrectly ? 'correct' : 'wrong');
      session.recordAnswer(answeredCorrectly);
      recordModeAnswer('compare', answeredCorrectly);
    },
    [puzzle, selected, recordModeAnswer, session],
  );

  const goNext = useCallback(() => {
    if (selected === null) return;
    playFeedback('next');
    answerLockRef.current = false;

    const action = session.advance();
    if (action === 'result') {
      setPhase('result');
      return;
    }
    if (action === 'restart') {
      setPuzzles(generateComparePuzzleSet(difficulty, QUESTIONS_PER_SET));
    } else {
      // 無限モードでは足りなくなった分を追加で生成する
      setPuzzles((current) =>
        session.index + 1 < current.length
          ? current
          : [...current, generateComparePuzzle(difficulty)],
      );
    }
    setSelected(null);
  }, [selected, session, difficulty]);

  /* キーボード操作：1 / 2 / 3 で回答、Enter で次へ */
  useEffect(() => {
    if (phase !== 'playing') return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.metaKey || event.ctrlKey || event.altKey) return;

      if (event.key === 'Enter') {
        const target = event.target as HTMLElement | null;
        if (target && (target.tagName === 'BUTTON' || target.tagName === 'A')) return;
        if (selected !== null) {
          event.preventDefault();
          goNext();
        }
        return;
      }

      const pressed = Number(event.key);
      if (!Number.isInteger(pressed) || pressed < 1 || pressed > ANSWER_ORDER.length) return;
      if (selected !== null) return;

      event.preventDefault();
      handleAnswer(ANSWER_ORDER[pressed - 1]);
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [phase, selected, goNext, handleAnswer]);

  if (phase === 'setup') {
    return (
      <DifficultyPicker
        title="強さ比較"
        description="AとB、2つの手を見比べて強いほうを選びます。全10問。難易度を選んではじめましょう。"
        levelDescriptions={LEVEL_DESCRIPTIONS}
        onSelect={start}
      />
    );
  }

  if (phase === 'result') {
    return (
      <SetResult
        total={QUESTIONS_PER_SET}
        correct={session.correctCount}
        onRetry={() => start(difficulty)}
        onChangeDifficulty={() => setPhase('setup')}
      />
    );
  }

  if (!puzzle) return null;

  const nameA = HANDS_BY_ID[puzzle.evaluationA.handId].nameJa;
  const nameB = HANDS_BY_ID[puzzle.evaluationB.handId].nameJa;

  return (
    <div className="space-y-6">
      <header className="space-y-3">
        <div className="flex items-end justify-between gap-3">
          <div>
            <p className="eyebrow">強さ比較</p>
            <p className="mt-1 text-xs text-slate-500">{DIFFICULTY_LABELS[difficulty].name}レベル</p>
          </div>
          <button
            type="button"
            onClick={() => setPhase('setup')}
            className="flex shrink-0 items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-semibold text-slate-400 transition-colors hover:bg-white/5 hover:text-slate-200"
          >
            <SlidersHorizontal className="h-3.5 w-3.5" aria-hidden="true" />
            難易度
          </button>
        </div>

        <GameStatsBar
          current={session.questionNumber}
          total={session.total}
          correct={session.correctCount}
          streak={session.streak}
          isAnswered={isAnswered}
          isEndless={session.isEndless}
          onToggleEndless={session.setEndless}
          toggleDisabled={isAnswered}
          onQuit={() => setIsQuitOpen(true)}
          notice={session.notice}
        />
      </header>

      {/* 回答前は役名や解説を出さず、カードだけで判断してもらう */}
      <section className="panel px-2 py-6 sm:px-8 sm:py-8">
        <h1 className="text-center text-lg font-bold sm:text-xl">どちらの手が強い？</h1>

        <div className="mt-6 space-y-4 sm:space-y-5">
          {(['A', 'B'] as const).map((side) => (
            <div
              key={side}
              className="rounded-2xl border border-white/10 bg-white/[0.03] px-1.5 py-4 sm:px-5"
            >
              <p className="mb-3 flex items-center justify-center gap-2">
                <span
                  className={cn(
                    'grid h-7 w-7 place-items-center rounded-lg text-sm font-bold',
                    side === 'A' ? 'bg-emerald-400/15 text-emerald-300' : 'bg-iris/20 text-iris-soft',
                  )}
                >
                  {side}
                </span>
                <span className="text-xs font-semibold text-slate-400">{side}の手</span>
              </p>
              <CardHand
                key={`${puzzle.id}-${side}`}
                cards={side === 'A' ? puzzle.handA : puzzle.handB}
                size="lg"
                label={`${side}の手札5枚`}
              />
            </div>
          ))}
        </div>
      </section>

      <section aria-label="選択肢" className="grid gap-3 sm:grid-cols-3">
        {ANSWER_ORDER.map((answer, optionIndex) => {
          const state = !isAnswered
            ? 'idle'
            : answer === puzzle.answer
              ? 'correct'
              : answer === selected
                ? 'wrong'
                : 'muted';

          return (
            <button
              key={answer}
              type="button"
              disabled={isAnswered}
              onClick={() => handleAnswer(answer)}
              className={cn(
                'flex min-h-[3.75rem] w-full items-center gap-3 rounded-xl border px-4 py-3 text-left transition-all duration-200',
                state === 'idle' &&
                  'border-white/10 bg-white/[0.04] hover:border-emerald-400/50 hover:bg-white/[0.08]',
                state === 'correct' && 'border-emerald-400/70 bg-emerald-400/12',
                state === 'wrong' && 'border-rose-400/70 bg-rose-500/12',
                state === 'muted' && 'border-white/5 bg-white/[0.02] opacity-50',
                isAnswered && 'cursor-default',
              )}
            >
              <span
                aria-hidden="true"
                className={cn(
                  'grid h-7 w-7 shrink-0 place-items-center rounded-md text-xs font-bold tabular-nums',
                  state === 'correct'
                    ? 'bg-emerald-400 text-midnight-950'
                    : state === 'wrong'
                      ? 'bg-rose-400 text-midnight-950'
                      : 'bg-white/10 text-slate-300',
                )}
              >
                {optionIndex + 1}
              </span>
              <span className="text-base font-bold text-white">{COMPARE_ANSWER_LABEL[answer]}</span>
            </button>
          );
        })}
      </section>

      {isQuitOpen ? (
        <QuitPracticeDialog
          modeName="強さ比較"
          answered={session.index + (isAnswered ? 1 : 0)}
          correct={session.correctCount}
          streak={session.streak}
          onContinue={() => setIsQuitOpen(false)}
        />
      ) : null}

      {isAnswered && selected ? (
        <ResultOverlay
          isCorrect={isCorrect}
          primaryLabel={isLastQuestion ? '結果を見る' : '次の問題へ'}
          onPrimary={goNext}
        >
          <p className="mt-3 text-xl font-bold text-white sm:text-2xl">
            {compareResultHeadline(puzzle.answer)}
          </p>

          <dl className="mx-auto mt-5 grid max-w-sm grid-cols-2 gap-3 text-left">
            <div className="rounded-xl border border-emerald-400/25 bg-emerald-400/8 px-3 py-2">
              <dt className="text-[0.7rem] font-semibold text-emerald-200">A</dt>
              <dd className="mt-0.5 text-sm font-bold text-white">{nameA}</dd>
            </div>
            <div className="rounded-xl border border-iris/30 bg-iris/12 px-3 py-2">
              <dt className="text-[0.7rem] font-semibold text-iris-soft">B</dt>
              <dd className="mt-0.5 text-sm font-bold text-white">{nameB}</dd>
            </div>
          </dl>

          <p className="mt-5 text-sm leading-relaxed text-slate-300">{describeComparison(puzzle)}</p>

          {!isCorrect ? (
            <>
              <p className="mt-4 inline-block rounded-lg border border-white/10 bg-white/5 px-3 py-1.5 text-xs text-slate-400">
                あなたの回答：
                <span className="font-bold text-slate-200">{COMPARE_ANSWER_LABEL[selected]}</span>
              </p>
              <p className="mt-3 text-sm font-medium text-emerald-200">
                強さの順番は少しずつ慣れます。次の1問へ。
              </p>
            </>
          ) : null}
        </ResultOverlay>
      ) : null}
    </div>
  );
}

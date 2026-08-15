'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { ArrowRight, CheckCircle2, Eraser, Lightbulb, Sparkles, XCircle } from 'lucide-react';
import { CardBoard } from '@/components/cards/CardBoard';
import { GameStatsBar } from '@/components/game/GameStatsBar';
import { QuitPracticeDialog } from '@/components/game/QuitPracticeDialog';
import { SetResult } from '@/components/game/SetResult';
import { Button } from '@/components/ui/Button';
import { HANDS_BY_ID } from '@/data/hands';
import { QUESTIONS_PER_SET, useGameSession } from '@/hooks/useGameSession';
import { useProgress } from '@/hooks/useProgress';
import { cn } from '@/lib/cn';
import { currentHandName, describeShortfall } from '@/lib/feedback';
import { playFeedback } from '@/lib/feedbackFx';
import { generateBuildPuzzle, generateBuildPuzzleSet } from '@/lib/generator';
import { evaluateHand } from '@/lib/evaluator';
import { BuildPuzzle, Card } from '@/lib/types';

const REQUIRED_CARDS = 5;

type CheckResult =
  | { status: 'idle' }
  | { status: 'correct' }
  | { status: 'wrong'; madeHandName: string | null; advice: string };

/** 学習モードB：役を作る */
export function BuildGame() {
  const { recordBuildResult } = useProgress();
  const session = useGameSession();

  const [puzzles, setPuzzles] = useState<BuildPuzzle[]>([]);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [hintLevel, setHintLevel] = useState(0);
  const [hintedId, setHintedId] = useState<string | null>(null);
  const [result, setResult] = useState<CheckResult>({ status: 'idle' });
  const [phase, setPhase] = useState<'playing' | 'result'>('playing');
  const [isQuitOpen, setIsQuitOpen] = useState(false);
  const index = session.index;
  /** 「答え合わせ」の連打で挑戦回数が二重に増えないようにする鍵（選び直すと解除） */
  const checkLockRef = useRef(false);
  /** この問題で一度でも間違えたか */
  const missedRef = useRef(false);

  /**
   * 初回の問題はマウント後に生成する（サーバーとクライアントで内容がずれないように）。
   * クライアント限定のランダム生成に対する React 公式のパターンなので、
   * 「effect 内で setState しない」ルールはこの1箇所だけ意図的に除外する。
   */
  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => setPuzzles(generateBuildPuzzleSet(QUESTIONS_PER_SET)), []);

  const puzzle: BuildPuzzle | undefined = puzzles[index];

  const selectedCards = useMemo(() => {
    if (!puzzle) return [];
    return selectedIds
      .map((id) => puzzle.board.find((card) => card.id === id))
      .filter((card): card is Card => Boolean(card));
  }, [puzzle, selectedIds]);

  const isReadyToCheck = selectedIds.length === REQUIRED_CARDS;
  const isCleared = result.status === 'correct';
  const targetHand = puzzle ? HANDS_BY_ID[puzzle.targetHandId] : null;

  /** 選択・ヒント・結果をまっさらに戻す */
  const resetPuzzleState = useCallback(() => {
    checkLockRef.current = false;
    missedRef.current = false;
    setSelectedIds([]);
    setHintLevel(0);
    setHintedId(null);
    setResult({ status: 'idle' });
  }, []);

  const startNextPuzzle = useCallback(() => {
    playFeedback('next');

    const action = session.advance();
    if (action === 'result') {
      setPhase('result');
      return;
    }
    if (action === 'restart') {
      setPuzzles(generateBuildPuzzleSet(QUESTIONS_PER_SET));
    } else {
      // 無限モードでは足りなくなった分を追加で生成する
      setPuzzles((current) =>
        session.index + 1 < current.length
          ? current
          : [...current, generateBuildPuzzle(current[current.length - 1]?.targetHandId ?? null)],
      );
    }
    resetPuzzleState();
  }, [session, resetPuzzleState]);

  /** 結果画面から、もう一度10問挑戦する */
  const restartSet = useCallback(() => {
    setPhase('playing');
    setIsQuitOpen(false);
    session.reset();
    setPuzzles(generateBuildPuzzleSet(QUESTIONS_PER_SET));
    resetPuzzleState();
  }, [session, resetPuzzleState]);

  const toggleCard = useCallback(
    (card: Card) => {
      if (isCleared) return;
      checkLockRef.current = false;
      playFeedback('select');
      setResult({ status: 'idle' });
      setSelectedIds((current) => {
        if (current.includes(card.id)) {
          return current.filter((id) => id !== card.id);
        }
        if (current.length >= REQUIRED_CARDS) return current;
        return [...current, card.id];
      });
    },
    [isCleared],
  );

  const clearSelection = useCallback(() => {
    if (isCleared) return;
    checkLockRef.current = false;
    setSelectedIds([]);
    setResult({ status: 'idle' });
  }, [isCleared]);

  const checkAnswer = useCallback(() => {
    if (!puzzle || selectedCards.length !== REQUIRED_CARDS || isCleared) return;
    if (checkLockRef.current) return;
    checkLockRef.current = true;

    const evaluation = evaluateHand(selectedCards);
    const succeeded = evaluation.handId === puzzle.targetHandId;

    playFeedback(succeeded ? 'correct' : 'wrong');
    recordBuildResult(succeeded);

    if (succeeded) {
      // 一発で正解できたときだけ成績に加算する（やり直しは何度でもOK）
      session.recordAnswer(!missedRef.current);
      setResult({ status: 'correct' });
      return;
    }

    missedRef.current = true;
    setResult({
      status: 'wrong',
      madeHandName: currentHandName(selectedCards),
      advice: describeShortfall(puzzle.targetHandId, selectedCards),
    });
  }, [puzzle, selectedCards, isCleared, recordBuildResult, session]);

  /** ヒント：1回目は役の条件、2回目は正解カードを1枚うっすら光らせる */
  const useHint = useCallback(() => {
    if (!puzzle || isCleared) return;
    if (hintLevel === 0) {
      setHintLevel(1);
      return;
    }
    if (hintLevel === 1) {
      const solutionCards = puzzle.board.filter((card) => puzzle.solutionIds.includes(card.id));
      const rankCount = (rank: number) =>
        solutionCards.filter((card) => card.rank === rank).length;

      const unselected = solutionCards.filter((card) => !selectedIds.includes(card.id));
      // ペアや3枚組など「役の中心になるカード」を優先して光らせる
      const candidate =
        unselected.find((card) => rankCount(card.rank) >= 2) ?? unselected[0] ?? solutionCards[0];

      setHintedId(candidate ? candidate.id : null);
      setHintLevel(2);
    }
  }, [puzzle, isCleared, hintLevel, selectedIds]);

  /* キーボード操作：Enter で答え合わせ / 次のお題へ */
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key !== 'Enter' || event.metaKey || event.ctrlKey || event.altKey) return;
      if (isCleared) {
        event.preventDefault();
        startNextPuzzle();
        return;
      }
      if (isReadyToCheck) {
        event.preventDefault();
        checkAnswer();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isCleared, isReadyToCheck, checkAnswer, startNextPuzzle]);

  if (phase === 'result') {
    return <SetResult total={QUESTIONS_PER_SET} correct={session.correctCount} onRetry={restartSet} />;
  }

  if (!puzzle || !targetHand) {
    return <div className="min-h-[60vh]" aria-hidden="true" />;
  }

  return (
    <div className="space-y-6">
      <header className="space-y-3">
        <div>
          <p className="eyebrow">役を作る</p>
          <p className="mt-1 text-xs text-slate-500">
            場のカードから5枚を選んで、お題の役を完成させましょう
          </p>
        </div>

        <GameStatsBar
          current={session.questionNumber}
          total={session.total}
          correct={session.correctCount}
          streak={session.streak}
          isAnswered={isCleared}
          correctLabel="一発正解"
          isEndless={session.isEndless}
          onToggleEndless={session.setEndless}
          toggleDisabled={isCleared}
          onQuit={() => setIsQuitOpen(true)}
          notice={session.notice}
        />
      </header>

      {/*
        お題。答えの作り方が分かってしまうため、役の条件や説明はここに出さない。
        条件はヒントを押したとき、解説は答え合わせのあとにだけ表示する。
      */}
      <section className="panel px-5 py-4 text-center sm:py-5">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">お題</p>
        <h1 className="mt-1.5 text-2xl font-bold sm:text-3xl">
          <span className="text-emerald-300">{targetHand.nameJa}</span> を作ろう
        </h1>

        {hintLevel >= 1 ? (
          <p className="mx-auto mt-4 flex max-w-md items-start gap-2 rounded-xl border border-gold/30 bg-gold/8 p-3 text-left text-sm leading-relaxed text-gold-soft">
            <Lightbulb className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
            <span>
              <span className="font-bold">役の条件：</span>
              {targetHand.condition}
              {hintLevel >= 2 ? (
                <span className="mt-1 block text-xs text-gold/90">
                  金色に光っているカードは、正解の組み合わせに入る1枚です。
                </span>
              ) : null}
            </span>
          </p>
        ) : null}
      </section>

      {/* 場のカード */}
      <section className="panel px-3 py-6 sm:px-6 sm:py-8">
        <CardBoard
          key={puzzle.id}
          cards={puzzle.board}
          selectedIds={selectedIds}
          hintedId={hintedId}
          selectionFull={isReadyToCheck}
          celebrate={isCleared}
          onToggle={toggleCard}
        />
        <p className="mt-6 text-center text-xs text-slate-500">
          {isCleared
            ? session.isLastQuestion
              ? 'お見事！ 「結果を見る」で成績を確認しましょう'
              : 'お見事！ 「次のお題へ」で続けられます'
            : isReadyToCheck
              ? '5枚そろいました。答え合わせをしてみましょう（Enter キーでもOK）'
              : `カードをタップして選びます（あと ${REQUIRED_CARDS - selectedIds.length} 枚）`}
        </p>
      </section>

      {/* 判定結果 */}
      <div aria-live="polite">
        {result.status === 'correct' ? (
          <div className="animate-fade-up rounded-2xl border border-emerald-400/40 bg-emerald-400/8 p-5">
            <p className="flex items-center gap-2 text-base font-bold text-emerald-200">
              <CheckCircle2 className="h-5 w-5" aria-hidden="true" />
              正解！ {targetHand.nameJa}が完成しました
            </p>
            <p className="mt-2 flex items-start gap-2 text-sm leading-relaxed text-slate-300">
              <Sparkles className="mt-0.5 h-4 w-4 shrink-0 text-emerald-300" aria-hidden="true" />
              <span>{targetHand.howToSpot}</span>
            </p>
          </div>
        ) : null}

        {result.status === 'wrong' ? (
          <div className="animate-fade-up rounded-2xl border border-rose-400/40 bg-rose-500/8 p-5">
            <p className="flex items-center gap-2 text-base font-bold text-rose-200">
              <XCircle className="h-5 w-5" aria-hidden="true" />
              まだお題の役になっていません
            </p>
            <dl className="mt-3 space-y-2 text-sm leading-relaxed">
              <div className="flex flex-wrap gap-x-2">
                <dt className="font-semibold text-slate-400">今できている役：</dt>
                <dd className="font-bold text-white">{result.madeHandName ?? '判定できません'}</dd>
              </div>
              <div className="flex flex-wrap gap-x-2">
                <dt className="font-semibold text-slate-400">あと少し：</dt>
                <dd className="text-slate-300">{result.advice}</dd>
              </div>
            </dl>
          </div>
        ) : null}
      </div>

      {isQuitOpen ? (
        <QuitPracticeDialog
          modeName="役を作る"
          answered={session.index + (isCleared ? 1 : 0)}
          correct={session.correctCount}
          streak={session.streak}
          onContinue={() => setIsQuitOpen(false)}
        />
      ) : null}

      {/* 主要アクション（スマホでは画面下部に固定） */}
      <div className="sticky bottom-0 z-10 -mx-4 flex flex-wrap gap-3 border-t border-white/10 bg-midnight-950/90 px-4 pt-3 pb-safe backdrop-blur sm:static sm:mx-0 sm:border-0 sm:bg-transparent sm:p-0">
        {isCleared ? (
          <Button size="lg" fullWidth onClick={startNextPuzzle}>
            {session.isLastQuestion ? '結果を見る' : '次のお題へ'}
            <ArrowRight className="h-4 w-4" aria-hidden="true" />
          </Button>
        ) : (
          <>
            <div className="flex w-full gap-3 sm:w-auto sm:flex-1">
              <Button
                variant="secondary"
                size="lg"
                className="flex-1"
                onClick={clearSelection}
                disabled={selectedIds.length === 0}
              >
                <Eraser className="h-4 w-4" aria-hidden="true" />
                選び直す
              </Button>
              <Button
                variant="gold"
                size="lg"
                className={cn(
                  'flex-1 whitespace-nowrap px-4 text-sm sm:text-base',
                  hintLevel >= 2 && 'opacity-60',
                )}
                onClick={useHint}
                disabled={hintLevel >= 2}
              >
                <Lightbulb className="h-4 w-4" aria-hidden="true" />
                {hintLevel === 0 ? 'ヒント' : hintLevel === 1 ? 'もっとヒント' : 'ヒント終了'}
              </Button>
            </div>
            <Button
              size="lg"
              className="w-full sm:w-auto sm:flex-1"
              onClick={checkAnswer}
              disabled={!isReadyToCheck}
            >
              <CheckCircle2 className="h-4 w-4" aria-hidden="true" />
              答え合わせ
            </Button>
          </>
        )}
      </div>
    </div>
  );
}

'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { CheckCircle2, Eraser, SlidersHorizontal } from 'lucide-react';
import { PlayingCard } from '@/components/cards/PlayingCard';
import { CardHand } from '@/components/cards/CardHand';
import { DelayedReveal } from '@/components/game/DelayedReveal';
import { GameStatsBar } from '@/components/game/GameStatsBar';
import { QuestionStage } from '@/components/game/QuestionStage';
import { QuitPracticeDialog } from '@/components/game/QuitPracticeDialog';
import { SelectionStatus } from '@/components/game/SelectionStatus';
import { ResultOverlay } from '@/components/game/ResultOverlay';
import { SetResult } from '@/components/game/SetResult';
import { DifficultyPicker } from '@/components/quiz/DifficultyPicker';
import { Button } from '@/components/ui/Button';
import { HANDS_BY_ID } from '@/data/hands';
import { QUESTIONS_PER_SET, useGameSession } from '@/hooks/useGameSession';
import { useQuestionTransition } from '@/hooks/useQuestionTransition';
import { useReadyEmphasis } from '@/hooks/useReadyEmphasis';
import { useProgress } from '@/hooks/useProgress';
import {
  BestFivePuzzle,
  describeBestFiveMistake,
  generateBestFivePuzzle,
  isBestFiveSelection,
} from '@/lib/bestFive';
import { cn } from '@/lib/cn';
import { evaluateHand } from '@/lib/evaluator';
import { explainEvaluation } from '@/lib/feedback';
import { AchievementNotice, resolveAnswerFeedback } from '@/lib/achievements';
import { playSound } from '@/lib/feedbackFx';
import { DIFFICULTY_LABELS } from '@/lib/generator';
import { Card, Difficulty } from '@/lib/types';

const REQUIRED_CARDS = 5;

const LEVEL_DESCRIPTIONS: Record<Difficulty, string> = {
  beginner: '7枚の中に、はっきり強い役ができている問題',
  intermediate: '手札を使う問題・場の5枚だけで決まる問題が混ざります',
  advanced: '役の候補が複数あり、キッカーまで見比べる問題',
};

type Phase = 'setup' | 'playing' | 'result';

/** 学習モード：最強の5枚 */
export function BestFiveGame() {
  const { progress, recordModeAnswer } = useProgress();
  const session = useGameSession();

  const [phase, setPhase] = useState<Phase>('setup');
  const [difficulty, setDifficulty] = useState<Difficulty>('beginner');
  const [puzzle, setPuzzle] = useState<BestFivePuzzle | null>(null);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [isAnswered, setIsAnswered] = useState(false);
  const [isQuitOpen, setIsQuitOpen] = useState(false);
  const [notice, setNotice] = useState<AchievementNotice | undefined>(undefined);
  /** 連打で同じ問題が二重集計されないようにする同期的な鍵 */
  const answerLockRef = useRef(false);

  const selectedCards = useMemo(() => {
    if (!puzzle) return [];
    return selectedIds
      .map((id) => puzzle.cards.find((card) => card.id === id))
      .filter((card): card is Card => Boolean(card));
  }, [puzzle, selectedIds]);

  const isReadyToCheck = selectedIds.length === REQUIRED_CARDS;
  const isCorrect = isAnswered && !!puzzle && isBestFiveSelection(selectedCards, puzzle.best);
  const isLastQuestion = session.isLastQuestion;

  const start = useCallback(
    (level: Difficulty) => {
      answerLockRef.current = false;
      setDifficulty(level);
      setPuzzle(generateBestFivePuzzle(level));
      playSound('game-start-best-five');
      setSelectedIds([]);
      setIsAnswered(false);
      setIsQuitOpen(false);
      setNotice(undefined);
      session.reset();
      setPhase('playing');
    },
    [session],
  );

  const toggleCard = useCallback(
    (card: Card) => {
      if (isAnswered) return;
      setSelectedIds((current) => {
        if (current.includes(card.id)) {
          playSound('card-deselect');
          return current.filter((id) => id !== card.id);
        }
        // 上限に達しているタップは何も起きないので、音も鳴らさない
        if (current.length >= REQUIRED_CARDS) return current;
        playSound('card-select');
        return [...current, card.id];
      });
    },
    [isAnswered],
  );

  const clearSelection = useCallback(() => {
    if (isAnswered) return;
    setSelectedIds([]);
  }, [isAnswered]);

  const checkAnswer = useCallback(() => {
    if (!puzzle || isAnswered || answerLockRef.current) return;
    if (selectedCards.length !== REQUIRED_CARDS) return;
    answerLockRef.current = true;

    const answeredCorrectly = isBestFiveSelection(selectedCards, puzzle.best);
    setIsAnswered(true);

    const feedback = resolveAnswerFeedback({
      isCorrect: answeredCorrectly,
      streak: answeredCorrectly ? session.streak + 1 : 0,
      answeredCount: session.index + 1,
      isEndless: session.isEndless,
      previousBestStreak: progress.bestStreak,
      previousTotalAnswers: progress.totalAnswers,
    });
    playSound(feedback.event, { fallback: answeredCorrectly ? 'correct' : 'incorrect' });
    setNotice(feedback.notice);

    session.recordAnswer(answeredCorrectly);
    recordModeAnswer('bestFive', answeredCorrectly);
  }, [puzzle, isAnswered, selectedCards, recordModeAnswer, session, progress]);

  const commitNext = useCallback(() => {
    setNotice(undefined);
    answerLockRef.current = false;

    const action = session.advance();
    if (action === 'result') {
      setPhase('result');
      return;
    }
    // 'next' も 'restart' も、次の7枚を新しく配る点は同じ
    setPuzzle(generateBestFivePuzzle(difficulty));
    setSelectedIds([]);
    setIsAnswered(false);
  }, [session, difficulty]);

  const playNextSound = useCallback(() => playSound('next-question'), []);
  const { isLeaving, requestNext } = useQuestionTransition({
    onStart: playNextSound,
    onCommit: commitNext,
  });

  const goNext = useCallback(() => {
    if (!isAnswered) return;
    requestNext();
  }, [isAnswered, requestNext]);

  // 「答え合わせ」が押せるようになったことを、うるさくならない範囲で伝える
  const { justBecameReady, showIdleHint } = useReadyEmphasis(
    isReadyToCheck && !isAnswered,
    puzzle?.id ?? '',
  );

  /* キーボード操作：Enter で答え合わせ／次の問題へ */
  useEffect(() => {
    if (phase !== 'playing') return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key !== 'Enter' || event.metaKey || event.ctrlKey || event.altKey) return;
      const target = event.target as HTMLElement | null;
      if (target && (target.tagName === 'BUTTON' || target.tagName === 'A')) return;

      if (isAnswered) {
        event.preventDefault();
        goNext();
        return;
      }
      if (isReadyToCheck) {
        event.preventDefault();
        checkAnswer();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [phase, isAnswered, isReadyToCheck, checkAnswer, goNext]);

  if (phase === 'setup') {
    return (
      <DifficultyPicker
        title="最強の5枚"
        description="手札2枚と場の5枚、合計7枚からいちばん強い5枚を選びます。全10問。"
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

  const bestIds = puzzle.best.cards.map((card) => card.id);
  const unusedCards = puzzle.cards.filter((card) => !bestIds.includes(card.id));
  const bestHand = HANDS_BY_ID[puzzle.best.evaluation.handId];
  const selectedHandName =
    selectedCards.length === REQUIRED_CARDS
      ? HANDS_BY_ID[evaluateHand(selectedCards).handId].nameJa
      : null;

  const renderCard = (card: Card, cardIndex: number) => (
    <PlayingCard
      key={card.id}
      card={card}
      size="lg"
      index={cardIndex}
      selected={selectedIds.includes(card.id)}
      celebrate={isCorrect && selectedIds.includes(card.id)}
      disabled={isAnswered}
      // 5枚そろっているときは、未選択のカードを押しても小さく押し返すだけにする
      blocked={!isAnswered && isReadyToCheck && !selectedIds.includes(card.id)}
      onSelect={toggleCard}
    />
  );

  return (
    <div className="space-y-6">
      <header className="space-y-3">
        <div className="flex items-end justify-between gap-3">
          <div>
            <p className="eyebrow">最強の5枚</p>
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

      <QuestionStage questionKey={puzzle.id} isLeaving={isLeaving}>
      <section className="panel px-2 py-6 sm:px-6 sm:py-8">
        <h1 className="text-center text-lg font-bold sm:text-xl">
          7枚の中から、最強の5枚を選ぼう
        </h1>

        <div className="mt-6 space-y-5">
          <div>
            <p className="mb-2 text-center text-xs font-semibold tracking-wider text-emerald-300">
              あなたのホールカード
            </p>
            <div
              className="flex flex-wrap items-center justify-center gap-1 sm:gap-3"
              role="group"
              aria-label="ホールカード2枚"
            >
              {puzzle.holeCards.map((card, cardIndex) => renderCard(card, cardIndex))}
            </div>
          </div>

          <div className="border-t border-white/10 pt-5">
            <p className="mb-2 text-center text-xs font-semibold tracking-wider text-slate-400">
              ボード
            </p>
            <div
              className="flex flex-wrap items-center justify-center gap-1 sm:gap-3"
              role="group"
              aria-label="ボードのカード5枚"
            >
              {puzzle.boardCards.map((card, cardIndex) => renderCard(card, cardIndex + 2))}
            </div>
          </div>
        </div>

        <SelectionStatus
          className="mt-6"
          selected={selectedIds.length}
          required={REQUIRED_CARDS}
          readyMessage="選択完了。答え合わせができます（Enter キーでもOK）"
          hintMessage={`カードをタップして選びます（あと ${REQUIRED_CARDS - selectedIds.length} 枚）`}
          announcement="5枚選択済み。回答できます。"
        />
      </section>
      </QuestionStage>

      <div className="sticky bottom-0 z-10 -mx-4 flex gap-3 border-t border-white/10 bg-midnight-950/90 px-4 pt-3 pb-safe backdrop-blur sm:static sm:mx-0 sm:border-0 sm:bg-transparent sm:p-0">
        <Button
          variant="secondary"
          size="lg"
          className="flex-1"
          onClick={clearSelection}
          disabled={selectedIds.length === 0 || isAnswered}
        >
          <Eraser className="h-4 w-4" aria-hidden="true" />
          選び直す
        </Button>
        <Button
          size="lg"
          className={cn(
            'flex-1',
            // 押せるようになった瞬間と、そのまま待たせてしまったときだけ、そっと合図する
            justBecameReady && 'animate-ready-in',
            showIdleHint && 'btn-shimmer',
          )}
          onClick={checkAnswer}
          disabled={!isReadyToCheck || isAnswered}
        >
          <CheckCircle2 className="h-4 w-4" aria-hidden="true" />
          答え合わせ
        </Button>
      </div>

      {isQuitOpen ? (
        <QuitPracticeDialog
          modeName="最強の5枚"
          answered={session.index + (isAnswered ? 1 : 0)}
          correct={session.correctCount}
          streak={session.streak}
          onContinue={() => setIsQuitOpen(false)}
        />
      ) : null}

      {isAnswered ? (
        <ResultOverlay
          isCorrect={isCorrect}
          notice={notice}
          isLeaving={isLeaving}
          primaryLabel={isLastQuestion ? '結果を見る' : '次の問題へ'}
          onPrimary={goNext}
        >
          <p className="mt-4 text-xs font-semibold uppercase tracking-widest text-slate-500">
            {isCorrect ? 'できあがった役は' : '正解の5枚は'}
          </p>
          <p className="mt-1 text-2xl font-bold text-white sm:text-3xl">{bestHand.nameJa}</p>
          <p className="mt-0.5 text-xs text-slate-500">{bestHand.nameEn}</p>

          {/* 不正解のときは、まず自分の5枚を見せてから、少し遅れて正解を並べる */}
          {!isCorrect ? (
            <div className="mt-5">
              <p className="text-[0.7rem] font-semibold tracking-wider text-slate-400">
                あなたの選択
                {selectedHandName ? (
                  <span className="ml-1.5 font-bold text-slate-200">（{selectedHandName}）</span>
                ) : null}
              </p>
              <CardHand cards={selectedCards} size="sm" className="mt-2" label="あなたが選んだ5枚" />
            </div>
          ) : null}

          <DelayedReveal className="mt-5" delayMs={isCorrect ? 0 : 150}>
            <p className="text-[0.7rem] font-semibold tracking-wider text-emerald-300">
              {isCorrect ? 'あなたが選んだ、最強の5枚' : '正解の5枚'}
            </p>
            <CardHand
              cards={puzzle.best.cards}
              size="sm"
              className="mt-2"
              label="最強の5枚"
              highlightIds={bestIds}
              liftHighlighted
              highlightNote="最強の5枚"
            />

            <p className="mt-4 text-[0.7rem] font-semibold tracking-wider text-slate-500">
              使わないカード
            </p>
            <CardHand
              cards={unusedCards}
              size="sm"
              className="mt-2"
              label="使わないカード"
              highlightIds={[]}
              dimOthers
              dimNote="使わないカード"
            />
          </DelayedReveal>

          <p className="mt-5 text-sm leading-relaxed text-slate-300">
            {explainEvaluation(puzzle.best.cards) || bestHand.shortDescription}
          </p>

          {!isCorrect ? (
            <>
              <p className="mt-3 text-sm leading-relaxed text-slate-300">
                {describeBestFiveMistake(selectedCards, puzzle.best)}
              </p>
              <p className="mt-3 text-sm font-medium text-emerald-200">
                7枚の見方に慣れれば大丈夫。次の1問へ。
              </p>
            </>
          ) : null}
        </ResultOverlay>
      ) : null}
    </div>
  );
}

'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { CheckCircle2, Eraser, Layers, SlidersHorizontal } from 'lucide-react';
import { PlayingCard } from '@/components/cards/PlayingCard';
import { CardHand } from '@/components/cards/CardHand';
import { GameStatsBar } from '@/components/game/GameStatsBar';
import { ResultOverlay } from '@/components/game/ResultOverlay';
import { SetResult } from '@/components/game/SetResult';
import { DifficultyPicker } from '@/components/quiz/DifficultyPicker';
import { Button } from '@/components/ui/Button';
import { HANDS_BY_ID } from '@/data/hands';
import { useProgress } from '@/hooks/useProgress';
import {
  BestFivePuzzle,
  describeBestFiveMistake,
  generateBestFivePuzzle,
  isBestFiveSelection,
} from '@/lib/bestFive';
import { evaluateHand } from '@/lib/evaluator';
import { explainEvaluation } from '@/lib/feedback';
import { playFeedback } from '@/lib/feedbackFx';
import { DIFFICULTY_LABELS } from '@/lib/generator';
import { Card, Difficulty } from '@/lib/types';

const QUESTIONS_PER_SET = 10;
const REQUIRED_CARDS = 5;

const LEVEL_DESCRIPTIONS: Record<Difficulty, string> = {
  beginner: '7枚の中に、はっきり強い役ができている問題',
  intermediate: '手札を使う問題・場の5枚だけで決まる問題が混ざります',
  advanced: '役の候補が複数あり、キッカーまで見比べる問題',
};

type Phase = 'setup' | 'playing' | 'result';

/** 学習モード：最強の5枚を選ぶ */
export function BestFiveGame() {
  const { recordModeAnswer } = useProgress();

  const [phase, setPhase] = useState<Phase>('setup');
  const [difficulty, setDifficulty] = useState<Difficulty>('beginner');
  const [puzzle, setPuzzle] = useState<BestFivePuzzle | null>(null);
  const [index, setIndex] = useState(0);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [isAnswered, setIsAnswered] = useState(false);
  const [correctCount, setCorrectCount] = useState(0);
  const [streak, setStreak] = useState(0);
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
  const isLastQuestion = index >= QUESTIONS_PER_SET - 1;

  const start = useCallback((level: Difficulty) => {
    answerLockRef.current = false;
    setDifficulty(level);
    setPuzzle(generateBestFivePuzzle(level));
    setIndex(0);
    setSelectedIds([]);
    setIsAnswered(false);
    setCorrectCount(0);
    setStreak(0);
    setPhase('playing');
  }, []);

  const toggleCard = useCallback(
    (card: Card) => {
      if (isAnswered) return;
      playFeedback('select');
      setSelectedIds((current) => {
        if (current.includes(card.id)) return current.filter((id) => id !== card.id);
        if (current.length >= REQUIRED_CARDS) return current;
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
    playFeedback(answeredCorrectly ? 'correct' : 'wrong');
    setCorrectCount((current) => current + (answeredCorrectly ? 1 : 0));
    setStreak((current) => (answeredCorrectly ? current + 1 : 0));
    recordModeAnswer('bestFive', answeredCorrectly);
  }, [puzzle, isAnswered, selectedCards, recordModeAnswer]);

  const goNext = useCallback(() => {
    if (!isAnswered) return;
    playFeedback('next');
    answerLockRef.current = false;
    if (isLastQuestion) {
      setPhase('result');
      return;
    }
    setIndex((current) => current + 1);
    setPuzzle(generateBestFivePuzzle(difficulty));
    setSelectedIds([]);
    setIsAnswered(false);
  }, [isAnswered, isLastQuestion, difficulty]);

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
        title="最強の5枚を選ぶ"
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
        correct={correctCount}
        onRetry={() => start(difficulty)}
        onChangeDifficulty={() => setPhase('setup')}
      />
    );
  }

  if (!puzzle) return null;

  const bestIds = puzzle.best.cards.map((card) => card.id);
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
      disabled={isAnswered || (isReadyToCheck && !selectedIds.includes(card.id))}
      onSelect={toggleCard}
    />
  );

  return (
    <div className="space-y-6">
      <header className="space-y-3">
        <div className="flex items-end justify-between gap-3">
          <div>
            <p className="eyebrow">最強の5枚を選ぶ</p>
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
          current={index + 1}
          total={QUESTIONS_PER_SET}
          correct={correctCount}
          streak={streak}
          isAnswered={isAnswered}
        />
      </header>

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

        <p className="mt-6 flex items-center justify-center gap-1.5 text-center text-xs text-slate-500">
          <Layers className="h-3.5 w-3.5" aria-hidden="true" />
          {isReadyToCheck
            ? '5枚そろいました。答え合わせをしてみましょう（Enter キーでもOK）'
            : `カードをタップして選びます（あと ${REQUIRED_CARDS - selectedIds.length} 枚）`}
        </p>
      </section>

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
          className="flex-1"
          onClick={checkAnswer}
          disabled={!isReadyToCheck || isAnswered}
        >
          <CheckCircle2 className="h-4 w-4" aria-hidden="true" />
          答え合わせ
        </Button>
      </div>

      {isAnswered ? (
        <ResultOverlay
          isCorrect={isCorrect}
          primaryLabel={isLastQuestion ? '結果を見る' : '次の問題へ'}
          onPrimary={goNext}
        >
          <p className="mt-4 text-xs font-semibold uppercase tracking-widest text-slate-500">
            {isCorrect ? 'できあがった役は' : '正解の5枚は'}
          </p>
          <p className="mt-1 text-2xl font-bold text-white sm:text-3xl">{bestHand.nameJa}</p>
          <p className="mt-0.5 text-xs text-slate-500">{bestHand.nameEn}</p>

          <CardHand
            cards={puzzle.cards}
            size="sm"
            className="mt-5"
            label="7枚のカード（正解の5枚を強調）"
            highlightIds={bestIds}
            dimOthers
          />
          <p className="mt-2 text-xs text-slate-500">緑の枠が最強の5枚／薄いカードは使いません</p>

          <p className="mt-5 text-sm leading-relaxed text-slate-300">
            {explainEvaluation(puzzle.best.cards) || bestHand.shortDescription}
          </p>

          {!isCorrect ? (
            <>
              {selectedHandName ? (
                <p className="mt-4 inline-block rounded-lg border border-white/10 bg-white/5 px-3 py-1.5 text-xs text-slate-400">
                  あなたの5枚：
                  <span className="font-bold text-slate-200">{selectedHandName}</span>
                </p>
              ) : null}
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

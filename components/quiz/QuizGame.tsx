'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { SlidersHorizontal } from 'lucide-react';
import { AnswerOption, AnswerOptionState } from './AnswerOption';
import { DifficultyPicker } from './DifficultyPicker';
import { QuizResult } from './QuizResult';
import { QuizResultOverlay } from './QuizResultOverlay';
import { CardHand } from '@/components/cards/CardHand';
import { GameStatsBar } from '@/components/game/GameStatsBar';
import { useProgress } from '@/hooks/useProgress';
import { playFeedback } from '@/lib/feedbackFx';
import { DIFFICULTY_LABELS, generateQuizQuestion, generateQuizSet } from '@/lib/generator';
import { Difficulty, HandId, QuizQuestion } from '@/lib/types';

const QUESTIONS_PER_SET = 10;

type Phase = 'setup' | 'playing' | 'result';

/** 学習モードA：役を当てる */
export function QuizGame() {
  const { recordQuizAnswer } = useProgress();

  const [phase, setPhase] = useState<Phase>('setup');
  const [difficulty, setDifficulty] = useState<Difficulty>('beginner');
  const [questions, setQuestions] = useState<QuizQuestion[]>([]);
  const [index, setIndex] = useState(0);
  const [selected, setSelected] = useState<HandId | null>(null);
  /** 復習用に差し替えた問題（成績には記録しない） */
  const [isRetryQuestion, setIsRetryQuestion] = useState(false);
  const [correctCount, setCorrectCount] = useState(0);
  const [streak, setStreak] = useState(0);
  const [missedHandIds, setMissedHandIds] = useState<HandId[]>([]);
  /**
   * 連打対策。state の更新は次の描画までに反映されないため、
   * 同じタイミングで複数回クリックされても1回だけ集計されるように同期的な鍵を持つ。
   */
  const answerLockRef = useRef(false);

  const question: QuizQuestion | undefined = questions[index];
  const isAnswered = selected !== null;
  const isCorrect = isAnswered && !!question && selected === question.answerId;
  const isLastQuestion = index >= QUESTIONS_PER_SET - 1;

  const start = useCallback((level: Difficulty) => {
    answerLockRef.current = false;
    setDifficulty(level);
    setQuestions(generateQuizSet(level, QUESTIONS_PER_SET));
    setIndex(0);
    setSelected(null);
    setIsRetryQuestion(false);
    setCorrectCount(0);
    setStreak(0);
    setMissedHandIds([]);
    setPhase('playing');
  }, []);

  const handleAnswer = useCallback(
    (handId: HandId) => {
      if (!question || selected !== null || answerLockRef.current) return;
      answerLockRef.current = true;
      setSelected(handId);

      const answeredCorrectly = handId === question.answerId;
      playFeedback(answeredCorrectly ? 'correct' : 'wrong');
      // 復習問題は成績に含めない（プレッシャーを与えないため）
      if (isRetryQuestion) return;

      setCorrectCount((current) => current + (answeredCorrectly ? 1 : 0));
      setStreak((current) => (answeredCorrectly ? current + 1 : 0));
      if (!answeredCorrectly) {
        setMissedHandIds((current) => [...current, question.answerId]);
      }
      recordQuizAnswer(question.answerId, answeredCorrectly);
    },
    [question, selected, isRetryQuestion, recordQuizAnswer],
  );

  const goNext = useCallback(() => {
    if (selected === null) return;
    playFeedback('next');
    answerLockRef.current = false;
    if (isLastQuestion) {
      setPhase('result');
      return;
    }
    setIndex((current) => current + 1);
    setSelected(null);
    setIsRetryQuestion(false);
  }, [selected, isLastQuestion]);

  /** 同じ役で別の問題に差し替えて、もう一度考えてもらう */
  const retrySameHand = useCallback(() => {
    if (!question) return;
    answerLockRef.current = false;
    const replacement = generateQuizQuestion(difficulty, { forceHandId: question.answerId });
    setQuestions((current) =>
      current.map((item, itemIndex) => (itemIndex === index ? replacement : item)),
    );
    setSelected(null);
    setIsRetryQuestion(true);
  }, [question, difficulty, index]);

  /* キーボード操作：1〜4 で選択、Enter で次へ */
  useEffect(() => {
    if (phase !== 'playing') return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.metaKey || event.ctrlKey || event.altKey) return;

      if (event.key === 'Enter') {
        // ボタンにフォーカスがあるときは、ボタン自身のクリックに任せる（二重発火を防ぐ）
        const target = event.target as HTMLElement | null;
        if (target && (target.tagName === 'BUTTON' || target.tagName === 'A')) return;
        if (selected !== null) {
          event.preventDefault();
          goNext();
        }
        return;
      }

      const pressed = Number(event.key);
      if (!Number.isInteger(pressed) || pressed < 1 || pressed > 4) return;
      if (selected !== null || !question) return;

      const option = question.options[pressed - 1];
      if (option) {
        event.preventDefault();
        handleAnswer(option);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [phase, selected, question, goNext, handleAnswer]);

  if (phase === 'setup') {
    return (
      <DifficultyPicker
        title="役を当てる"
        description="5枚のカードを見て、役名を4択で答えます。全10問。難易度を選んではじめましょう。"
        onSelect={start}
      />
    );
  }

  if (phase === 'result') {
    return (
      <QuizResult
        total={QUESTIONS_PER_SET}
        correct={correctCount}
        missedHandIds={missedHandIds}
        onRetry={() => start(difficulty)}
        onChangeDifficulty={() => setPhase('setup')}
      />
    );
  }

  if (!question) return null;

  const optionState = (handId: HandId): AnswerOptionState => {
    if (!isAnswered) return 'idle';
    if (handId === question.answerId) return 'correct';
    if (handId === selected) return 'wrong';
    return 'muted';
  };

  return (
    <div className="space-y-6">
      <header className="space-y-3">
        <div className="flex items-end justify-between gap-3">
          <div>
            <p className="eyebrow">役を当てる</p>
            <p className="mt-1 text-xs text-slate-500">
              {DIFFICULTY_LABELS[difficulty].name}レベル
              {isRetryQuestion ? '　/　復習中（成績には記録されません）' : ''}
            </p>
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

      {/* 回答前は「問い」と5枚のカードだけを見せる（答えのヒントになる文言は出さない） */}
      <section className="panel px-3 py-6 sm:px-8 sm:py-8">
        <h1 className="text-center text-lg font-bold sm:text-xl">この5枚は何の役？</h1>
        <CardHand
          key={question.id}
          cards={question.cards}
          size="lg"
          className="mt-6"
          celebrate={isCorrect}
          label="問題のカード5枚"
        />
      </section>

      <section aria-label="選択肢" className="grid gap-3 sm:grid-cols-2">
        {question.options.map((optionId, optionIndex) => (
          <AnswerOption
            key={optionId}
            handId={optionId}
            index={optionIndex}
            state={optionState(optionId)}
            disabled={isAnswered}
            onSelect={handleAnswer}
          />
        ))}
      </section>

      {/* 正誤は画面全体のダイアログで伝える */}
      {isAnswered && selected ? (
        <QuizResultOverlay
          isCorrect={isCorrect}
          answerId={question.answerId}
          selectedId={selected}
          cards={question.cards}
          isLastQuestion={isLastQuestion}
          onNext={goNext}
          onRetry={retrySameHand}
        />
      ) : null}
    </div>
  );
}

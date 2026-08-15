'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { SlidersHorizontal } from 'lucide-react';
import { AnswerOption, AnswerOptionState } from './AnswerOption';
import { DifficultyPicker } from './DifficultyPicker';
import { QuizResult } from './QuizResult';
import { QuizResultOverlay } from './QuizResultOverlay';
import { CardHand } from '@/components/cards/CardHand';
import { GameStatsBar } from '@/components/game/GameStatsBar';
import { QuitPracticeDialog } from '@/components/game/QuitPracticeDialog';
import { QUESTIONS_PER_SET, useGameSession } from '@/hooks/useGameSession';
import { useProgress } from '@/hooks/useProgress';
import { AchievementNotice, resolveAnswerFeedback } from '@/lib/achievements';
import { playSound } from '@/lib/feedbackFx';
import { DIFFICULTY_LABELS, generateQuizQuestion, generateQuizSet } from '@/lib/generator';
import { Difficulty, HandId, QuizQuestion } from '@/lib/types';

type Phase = 'setup' | 'playing' | 'result';

/** 学習モードA：役を当てる */
export function QuizGame() {
  const { progress, recordQuizAnswer } = useProgress();
  const session = useGameSession();

  const [phase, setPhase] = useState<Phase>('setup');
  const [difficulty, setDifficulty] = useState<Difficulty>('beginner');
  const [questions, setQuestions] = useState<QuizQuestion[]>([]);
  const [selected, setSelected] = useState<HandId | null>(null);
  /** 復習用に差し替えた問題（成績には記録しない） */
  const [isRetryQuestion, setIsRetryQuestion] = useState(false);
  const [missedHandIds, setMissedHandIds] = useState<HandId[]>([]);
  const [isQuitOpen, setIsQuitOpen] = useState(false);
  const [notice, setNotice] = useState<AchievementNotice | undefined>(undefined);
  const index = session.index;
  /**
   * 連打対策。state の更新は次の描画までに反映されないため、
   * 同じタイミングで複数回クリックされても1回だけ集計されるように同期的な鍵を持つ。
   */
  const answerLockRef = useRef(false);

  const question: QuizQuestion | undefined = questions[index];
  const isAnswered = selected !== null;
  const isCorrect = isAnswered && !!question && selected === question.answerId;
  const isLastQuestion = session.isLastQuestion;

  const start = useCallback(
    (level: Difficulty) => {
      answerLockRef.current = false;
      setDifficulty(level);
      setQuestions(generateQuizSet(level, QUESTIONS_PER_SET));
      playSound('game-start-quiz');
      setSelected(null);
      setNotice(undefined);
      setIsRetryQuestion(false);
      setMissedHandIds([]);
      setIsQuitOpen(false);
      session.reset();
      setPhase('playing');
    },
    [session],
  );

  const handleAnswer = useCallback(
    (handId: HandId) => {
      if (!question || selected !== null || answerLockRef.current) return;
      answerLockRef.current = true;
      setSelected(handId);

      const answeredCorrectly = handId === question.answerId;

      // 復習問題は成績に含めない（プレッシャーを与えないため）
      if (isRetryQuestion) {
        playSound(answeredCorrectly ? 'correct' : 'incorrect');
        return;
      }

      // 連続正解・節目・自己ベストのうち、いちばん重要なものだけ鳴らす
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
      if (!answeredCorrectly) {
        setMissedHandIds((current) => [...current, question.answerId]);
      }
      recordQuizAnswer(question.answerId, answeredCorrectly);
    },
    [question, selected, isRetryQuestion, recordQuizAnswer, session, progress],
  );

  const goNext = useCallback(() => {
    if (selected === null) return;
    playSound('next-question');
    setNotice(undefined);
    answerLockRef.current = false;

    const action = session.advance();
    if (action === 'result') {
      setPhase('result');
      return;
    }
    if (action === 'restart') {
      // 無限モードを解除したので、新しい10問セッションを作り直す
      setQuestions(generateQuizSet(difficulty, QUESTIONS_PER_SET));
      setMissedHandIds([]);
    } else {
      // 無限モードでは足りなくなった分を追加で生成する
      setQuestions((current) => {
        if (session.index + 1 < current.length) return current;
        const previous = current[current.length - 1]?.answerId;
        return [
          ...current,
          generateQuizQuestion(difficulty, { avoid: previous ? [previous] : [] }),
        ];
      });
    }
    setSelected(null);
    setIsRetryQuestion(false);
  }, [selected, session, difficulty]);

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
        correct={session.correctCount}
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
      {isQuitOpen ? (
        <QuitPracticeDialog
          modeName="役を当てる"
          answered={session.index + (isAnswered ? 1 : 0)}
          correct={session.correctCount}
          streak={session.streak}
          onContinue={() => setIsQuitOpen(false)}
        />
      ) : null}

      {isAnswered && selected ? (
        <QuizResultOverlay
          isCorrect={isCorrect}
          answerId={question.answerId}
          selectedId={selected}
          cards={question.cards}
          isLastQuestion={isLastQuestion}
          notice={notice}
          onNext={goNext}
          onRetry={retrySameHand}
        />
      ) : null}
    </div>
  );
}

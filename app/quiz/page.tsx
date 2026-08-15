import type { Metadata } from 'next';
import { QuizGame } from '@/components/quiz/QuizGame';

export const metadata: Metadata = {
  title: '役を当てる',
  description: '5枚のカードを見て役名を4択で答える練習モード。全10問、難易度は3段階。',
};

export default function QuizPage() {
  return <QuizGame />;
}

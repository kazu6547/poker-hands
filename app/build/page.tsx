import type { Metadata } from 'next';
import { BuildGame } from '@/components/build/BuildGame';

export const metadata: Metadata = {
  title: '役を作る',
  description: 'お題の役になるように、場のカードから5枚を選ぶ練習モード。ヒントつきで初心者でも安心。',
};

export default function BuildPage() {
  return <BuildGame />;
}

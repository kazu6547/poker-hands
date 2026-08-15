import type { Metadata } from 'next';
import { CompareGame } from '@/components/compare/CompareGame';

export const metadata: Metadata = {
  title: 'VSカード',
  description: '2つの手を見比べて、どちらが強いかを答える練習モード。役の強さの順番とキッカーが身につきます。',
};

export default function ComparePage() {
  return <CompareGame />;
}

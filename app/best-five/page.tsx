import type { Metadata } from 'next';
import { BestFiveGame } from '@/components/bestFive/BestFiveGame';

export const metadata: Metadata = {
  title: '最強の5枚',
  description: '手札2枚と場の5枚、合計7枚からいちばん強い5枚を選ぶ練習モード。実戦に近い形で役を見抜きます。',
};

export default function BestFivePage() {
  return <BestFiveGame />;
}

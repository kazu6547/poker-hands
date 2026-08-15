import { HandId, HandInfo } from '@/lib/types';

/**
 * 学習する10役のデータ。
 * 強い順（strengthRank 昇順）に並べている。
 * example は "AS KS QS JS TS" 形式（T = 10）。
 */
export const HANDS: HandInfo[] = [
  {
    id: 'royal-flush',
    nameJa: 'ロイヤルフラッシュ',
    nameEn: 'Royal Flush',
    strengthRank: 1,
    shortDescription: '同じマークの 10・J・Q・K・A。ポーカーで最も強い、めったに出ない役。',
    condition: '同じマークの 10 / J / Q / K / A の5枚がそろっている',
    example: 'TS JS QS KS AS',
    howToSpot:
      'まず「マークが5枚とも同じ」かを見る。そのうえで数字が 10 から A まで並んでいれば、これがいちばん強い役。',
    combinations: 4,
    confusions: [
      {
        handId: 'straight-flush',
        difference: 'どちらも同じマークの連番。いちばん上が A（10-J-Q-K-A）のときだけロイヤルフラッシュ。',
      },
      {
        handId: 'flush',
        difference: 'フラッシュはマークがそろうだけ。数字が 10〜A の連番になっている必要はない。',
      },
    ],
  },
  {
    id: 'straight-flush',
    nameJa: 'ストレートフラッシュ',
    nameEn: 'Straight Flush',
    strengthRank: 2,
    shortDescription: '同じマークで数字が5枚連続している役。ロイヤルフラッシュに次ぐ強さ。',
    condition: '5枚すべてが同じマークで、かつ数字が連続している',
    example: '6H 7H 8H 9H TH',
    howToSpot:
      '「マークがそろっている」と「数字が階段になっている」を両方満たしているか確認する。片方だけならフラッシュかストレート。',
    combinations: 36,
    confusions: [
      {
        handId: 'flush',
        difference: 'フラッシュは数字がバラバラ。連番になっていればストレートフラッシュに格上げ。',
      },
      {
        handId: 'straight',
        difference: 'ストレートはマークがバラバラ。5枚とも同じマークならストレートフラッシュ。',
      },
      {
        handId: 'royal-flush',
        difference: 'いちばん上が A のもの（10-J-Q-K-A）だけは、別格のロイヤルフラッシュと呼ぶ。',
      },
    ],
  },
  {
    id: 'four-of-a-kind',
    nameJa: 'フォーカード',
    nameEn: 'Four of a Kind',
    strengthRank: 3,
    shortDescription: '同じ数字が4枚そろった役。残り1枚は何でもよい。',
    condition: '同じ数字のカードが4枚ある',
    example: '9S 9H 9D 9C 2S',
    howToSpot: '同じ数字を数えて「4枚」あればフォーカード。4枚は全マークがそろうので見つけやすい。',
    combinations: 624,
    confusions: [
      {
        handId: 'full-house',
        difference: 'フルハウスは「3枚＋2枚」。4枚そろっているかどうかで見分ける。',
      },
      {
        handId: 'three-of-a-kind',
        difference: 'スリーカードは同じ数字が3枚まで。もう1枚同じ数字が来ればフォーカード。',
      },
    ],
  },
  {
    id: 'full-house',
    nameJa: 'フルハウス',
    nameEn: 'Full House',
    strengthRank: 4,
    shortDescription: '同じ数字3枚と、別の同じ数字2枚の組み合わせ。',
    condition: '同じ数字が3枚＋別の同じ数字が2枚（3 + 2）',
    example: 'QS QH QD 4S 4H',
    howToSpot: '「3枚組」と「2枚組」が同時にあるかを見る。5枚がぴったり2種類の数字で埋まっていればフルハウス。',
    combinations: 3744,
    confusions: [
      {
        handId: 'three-of-a-kind',
        difference: 'スリーカードは残り2枚がバラバラ。残り2枚がペアになっていればフルハウス。',
      },
      {
        handId: 'two-pair',
        difference: 'ツーペアは「2枚＋2枚」。片方が3枚に増えるとフルハウス。',
      },
      {
        handId: 'four-of-a-kind',
        difference: '同じ数字が4枚あればフォーカードで、フルハウスより強い。',
      },
    ],
  },
  {
    id: 'flush',
    nameJa: 'フラッシュ',
    nameEn: 'Flush',
    strengthRank: 5,
    shortDescription: '5枚とも同じマークの役。数字の並びは関係ない。',
    condition: '5枚すべてが同じマーク（スート）',
    example: '2D 5D 9D JD KD',
    howToSpot: 'マークだけを見て、5枚とも同じなら成立。数字は気にしなくてよい。',
    combinations: 5108,
    confusions: [
      {
        handId: 'straight',
        difference: 'ストレートは「数字が連続」、フラッシュは「マークがそろう」。見るポイントが違う。',
      },
      {
        handId: 'straight-flush',
        difference: 'マークがそろったうえに数字も連番なら、ストレートフラッシュに格上げ。',
      },
    ],
  },
  {
    id: 'straight',
    nameJa: 'ストレート',
    nameEn: 'Straight',
    strengthRank: 6,
    shortDescription: '数字が5枚連続している役。マークはバラバラでよい。',
    condition: '数字が5枚連続している（A-2-3-4-5 と 10-J-Q-K-A のどちらも可）',
    example: '5C 6D 7S 8H 9C',
    howToSpot:
      '数字を小さい順に並べて、階段になっていれば成立。A は「1」としても「いちばん上」としても使える。',
    combinations: 10200,
    confusions: [
      {
        handId: 'flush',
        difference: 'フラッシュはマークがそろう役。数字が連番でもマークがバラバラならストレート。',
      },
      {
        handId: 'straight-flush',
        difference: '連番かつ5枚とも同じマークなら、ストレートフラッシュになる。',
      },
      {
        handId: 'high-card',
        difference: '1枚でも数字が飛んでいれば連番にならず、ただのハイカード。',
      },
    ],
  },
  {
    id: 'three-of-a-kind',
    nameJa: 'スリーカード',
    nameEn: 'Three of a Kind',
    strengthRank: 7,
    shortDescription: '同じ数字が3枚。残り2枚はバラバラの数字。',
    condition: '同じ数字が3枚あり、残り2枚はペアになっていない',
    example: '7S 7H 7D KC 3D',
    howToSpot: '同じ数字が3枚あるかを数える。残り2枚がペアだとフルハウスになるので、そこも確認する。',
    combinations: 54912,
    confusions: [
      {
        handId: 'full-house',
        difference: '残り2枚がペアならフルハウス。バラバラならスリーカード。',
      },
      {
        handId: 'two-pair',
        difference: 'ツーペアは「2枚＋2枚」。3枚組があるかどうかで見分ける。',
      },
    ],
  },
  {
    id: 'two-pair',
    nameJa: 'ツーペア',
    nameEn: 'Two Pair',
    strengthRank: 8,
    shortDescription: '同じ数字のペアが2組。残り1枚はバラバラ。',
    condition: '同じ数字の2枚組が2種類ある',
    example: 'JS JH 4D 4C 9S',
    howToSpot: 'ペアを探して「2組」あればツーペア。3枚組が混ざっていないかも確認する。',
    combinations: 123552,
    confusions: [
      {
        handId: 'one-pair',
        difference: 'ペアが1組だけならワンペア。2組そろってツーペア。',
      },
      {
        handId: 'full-house',
        difference: 'どちらかのペアが3枚になっているとフルハウス。',
      },
    ],
  },
  {
    id: 'one-pair',
    nameJa: 'ワンペア',
    nameEn: 'One Pair',
    strengthRank: 9,
    shortDescription: '同じ数字が2枚。もっともよく出る基本の役。',
    condition: '同じ数字の2枚組が1組だけある',
    example: 'AS AD 8H 5C 2S',
    howToSpot: '同じ数字が2枚あればワンペア。ほかにペアがないことも確認する。',
    combinations: 1098240,
    confusions: [
      {
        handId: 'two-pair',
        difference: 'ペアがもう1組あればツーペア。',
      },
      {
        handId: 'high-card',
        difference: 'ペアが1つもなければハイカード。',
      },
    ],
  },
  {
    id: 'high-card',
    nameJa: 'ハイカード',
    nameEn: 'High Card',
    strengthRank: 10,
    shortDescription: 'どの役もできていない状態。いちばん大きい数字で勝負する。',
    condition: 'ペアもフラッシュもストレートもない（役なし）',
    example: 'AS JD 9H 6C 3S',
    howToSpot:
      '「ペアがない」「マークがそろっていない」「連番でもない」の3つを確認できたらハイカード。',
    combinations: 1302540,
    confusions: [
      {
        handId: 'one-pair',
        difference: '同じ数字が2枚あればワンペア。1枚でもかぶっていないか確認する。',
      },
      {
        handId: 'straight',
        difference: '数字が5枚つながっていればストレート。A は上下どちらでも使える点に注意。',
      },
      {
        handId: 'flush',
        difference: 'マークが5枚ともそろっていればフラッシュ。',
      },
    ],
  },
];

export const HANDS_BY_ID: Record<HandId, HandInfo> = HANDS.reduce(
  (accumulator, hand) => {
    accumulator[hand.id] = hand;
    return accumulator;
  },
  {} as Record<HandId, HandInfo>,
);

export function getHand(handId: HandId): HandInfo {
  return HANDS_BY_ID[handId];
}

export function handNameJa(handId: HandId): string {
  return HANDS_BY_ID[handId].nameJa;
}

/** 52枚から5枚を選ぶ組み合わせの総数（C(52,5)） */
export const TOTAL_FIVE_CARD_COMBINATIONS = 2_598_960;

/** その役ができる確率（%）。小さい役ほど珍しい */
export function handProbabilityPercent(handId: HandId): number {
  return (HANDS_BY_ID[handId].combinations / TOTAL_FIVE_CARD_COMBINATIONS) * 100;
}

/** 「0.2%」「42.3%」のように、桁が小さくても読める形に整える */
export function formatHandProbability(handId: HandId): string {
  const percent = handProbabilityPercent(handId);
  if (percent >= 1) return `${percent.toFixed(1)}%`;
  if (percent >= 0.01) return `${percent.toFixed(2)}%`;
  return `${percent.toFixed(4)}%`;
}

import { ImageResponse } from 'next/og';

/**
 * SNS共有時に表示される画像を、外部素材なしで自動生成する。
 * 日本語フォントを読み込めないため、文字はアルファベットとトランプ記号だけで構成している。
 */
export const alt = 'Poker Hand by K.M';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

const CARDS = [
  { rank: '10', suit: '♠', red: false, rotate: -12 },
  { rank: 'J', suit: '♥', red: true, rotate: -6 },
  { rank: 'Q', suit: '♣', red: false, rotate: 0 },
  { rank: 'K', suit: '♦', red: true, rotate: 6 },
  { rank: 'A', suit: '♠', red: false, rotate: 12 },
];

export default function OpengraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          background: 'linear-gradient(135deg, #070B14 0%, #0F1727 55%, #0B1220 100%)',
          color: '#E2E8F0',
          fontFamily: 'sans-serif',
        }}
      >
        <div
          style={{
            fontSize: 26,
            letterSpacing: 12,
            color: '#64748B',
            display: 'flex',
          }}
        >
          TEXAS HOLD&apos;EM
        </div>

        <div
          style={{
            marginTop: 12,
            fontSize: 96,
            fontWeight: 700,
            color: '#FFFFFF',
            display: 'flex',
          }}
        >
          Poker Hand
        </div>

        <div
          style={{
            marginTop: 4,
            fontSize: 30,
            letterSpacing: 8,
            color: '#34D399',
            display: 'flex',
          }}
        >
          by K.M
        </div>

        {/* 扇状に広げたトランプ */}
        <div style={{ marginTop: 44, display: 'flex', alignItems: 'flex-end' }}>
          {CARDS.map((card) => (
            <div
              key={`${card.rank}${card.suit}`}
              style={{
                width: 132,
                height: 186,
                marginLeft: -22,
                borderRadius: 16,
                background: '#FFFFFF',
                border: '1px solid #CBD5E1',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                padding: 14,
                transform: `rotate(${card.rotate}deg)`,
                boxShadow: '0 18px 40px rgba(0,0,0,0.55)',
                color: card.red ? '#E11D48' : '#0F172A',
              }}
            >
              <div style={{ fontSize: 36, fontWeight: 700, display: 'flex' }}>{card.rank}</div>
              <div style={{ fontSize: 54, display: 'flex', justifyContent: 'center' }}>
                {card.suit}
              </div>
              <div style={{ fontSize: 30, display: 'flex', justifyContent: 'flex-end' }}>
                {card.suit}
              </div>
            </div>
          ))}
        </div>

        <div
          style={{
            marginTop: 46,
            fontSize: 30,
            color: '#94A3B8',
            display: 'flex',
          }}
        >
          Learn poker hands by playing — 4 training modes
        </div>
      </div>
    ),
    { ...size },
  );
}

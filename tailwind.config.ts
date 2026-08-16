import type { Config } from 'tailwindcss';

const config: Config = {
  /** タッチ端末で hover が貼り付かないよう、hover: は hover 可能な環境だけに適用する */
  future: {
    hoverOnlyWhenSupported: true,
  },
  content: [
    './app/**/*.{ts,tsx}',
    './components/**/*.{ts,tsx}',
    './data/**/*.{ts,tsx}',
    './lib/**/*.{ts,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        /** 深いネイビー（ベース） */
        midnight: {
          950: '#070B14',
          900: '#0B1220',
          850: '#0F1727',
          800: '#141D30',
          700: '#1D2740',
          600: '#2A3651',
        },
        /** ゴールド（少量アクセント） */
        gold: {
          DEFAULT: '#E8C87E',
          soft: '#F3DFB2',
          deep: '#B8975A',
        },
        /** 青紫（少量アクセント） */
        iris: {
          DEFAULT: '#8B8CF7',
          soft: '#AFB0FB',
          deep: '#5E5FD6',
        },
      },
      /** 既定の opacity スケールにない値も /12 のように使えるようにする */
      opacity: {
        2: '0.02',
        3: '0.03',
        4: '0.04',
        6: '0.06',
        8: '0.08',
        12: '0.12',
        14: '0.14',
        15: '0.15',
        18: '0.18',
        22: '0.22',
        35: '0.35',
        45: '0.45',
        55: '0.55',
        65: '0.65',
        85: '0.85',
        88: '0.88',
      },
      fontFamily: {
        sans: [
          '-apple-system',
          'BlinkMacSystemFont',
          '"Segoe UI"',
          '"Hiragino Sans"',
          '"Hiragino Kaku Gothic ProN"',
          '"Noto Sans JP"',
          'Meiryo',
          'system-ui',
          'sans-serif',
        ],
        display: [
          '"Avenir Next"',
          '-apple-system',
          'BlinkMacSystemFont',
          '"Segoe UI"',
          '"Hiragino Sans"',
          '"Noto Sans JP"',
          'system-ui',
          'sans-serif',
        ],
      },
      boxShadow: {
        card: '0 12px 30px -14px rgba(0, 0, 0, 0.75)',
        'card-hover': '0 18px 40px -16px rgba(0, 0, 0, 0.85)',
        panel: '0 20px 50px -30px rgba(0, 0, 0, 0.9)',
      },
      keyframes: {
        'fade-up': {
          '0%': { opacity: '0', transform: 'translateY(8px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        'card-in': {
          '0%': { opacity: '0', transform: 'translateY(6px) scale(0.985)' },
          '100%': { opacity: '1', transform: 'translateY(0) scale(1)' },
        },
        /* 新しい問題の入り方。短く、下から少しだけ */
        'question-in': {
          '0%': { opacity: '0', transform: 'translateY(6px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        /* 回答できる状態になった一瞬だけの、控えめな存在感アップ */
        'ready-in': {
          '0%, 100%': { transform: 'scale(1)' },
          '50%': { transform: 'scale(1.015)' },
        },
        /* 選べないカードを押したときの、ごく小さな押し返し */
        nudge: {
          '0%, 100%': { transform: 'translateX(0)' },
          '35%': { transform: 'translateX(-2px)' },
          '70%': { transform: 'translateX(2px)' },
        },
        /* 正解カードを順番にほんの少し光らせる */
        'card-highlight': {
          '0%, 100%': { boxShadow: '0 18px 40px -16px rgba(0, 0, 0, 0.85)' },
          '50%': {
            boxShadow: '0 18px 40px -16px rgba(0, 0, 0, 0.85), 0 0 0 4px rgba(52, 211, 153, 0.35)',
          },
        },
        /*
          ヒント表示：外側だけを短く脈打たせる。
          金色の輪郭はクラス（ring）側で常に描いているので、
          アニメーションが止まってもヒント対象だと分かる。
        */
        'pulse-ring': {
          '0%, 100%': {
            boxShadow: '0 0 0 2px #E8C87E, 0 0 0 0 rgba(232, 200, 126, 0.5)',
          },
          '50%': {
            boxShadow: '0 0 0 2px #E8C87E, 0 0 0 10px rgba(232, 200, 126, 0)',
          },
        },
      },
      animation: {
        'fade-up': 'fade-up 0.35s ease-out both',
        /*
          backwards にするのは、終わったあとに transform を保持させないため。
          both だと、カードの浮き・沈み（選択・hover・押下）が
          アニメーションの最終値に上書きされて効かなくなる。
        */
        'card-in': 'card-in 0.24s ease-out backwards',
        'question-in': 'question-in 0.2s ease-out backwards',
        'ready-in': 'ready-in 0.18s ease-out 1',
        nudge: 'nudge 0.2s ease-out 1',
        'card-highlight': 'card-highlight 0.16s ease-out 1',
        /* 3回だけ脈打って止める（点滅させ続けない） */
        'pulse-ring': 'pulse-ring 1.1s ease-in-out 3',
      },
    },
  },
  plugins: [],
};

export default config;

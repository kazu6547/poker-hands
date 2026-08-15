import type { Config } from 'tailwindcss';

const config: Config = {
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
          '0%': { opacity: '0', transform: 'translateY(10px) scale(0.97)' },
          '100%': { opacity: '1', transform: 'translateY(0) scale(1)' },
        },
        pop: {
          '0%': { transform: 'translateY(0) scale(1)' },
          '45%': { transform: 'translateY(-10px) scale(1.05)' },
          '100%': { transform: 'translateY(0) scale(1)' },
        },
        /* ヒント表示：金色の輪郭は常に残しつつ、外側だけを脈打たせる */
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
        'card-in': 'card-in 0.35s ease-out both',
        pop: 'pop 0.5s ease-out both',
        'pulse-ring': 'pulse-ring 1.8s ease-in-out infinite',
      },
    },
  },
  plugins: [],
};

export default config;

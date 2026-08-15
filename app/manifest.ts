import type { MetadataRoute } from 'next';

/**
 * スマホのホーム画面に追加して、アプリのように起動できるようにする設定。
 * 外部APIを使わない構成なので、追加後もそのまま学習できる。
 */
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'Poker Hand by K.M',
    short_name: 'Poker Hand',
    description:
      'Poker Hand by K.Mは、ポーカーの役をゲーム感覚で覚えられる学習アプリです。',
    lang: 'ja',
    start_url: '/',
    display: 'standalone',
    orientation: 'portrait',
    background_color: '#070B14',
    theme_color: '#070B14',
    categories: ['education', 'games'],
    icons: [
      {
        src: '/icon.svg',
        sizes: 'any',
        type: 'image/svg+xml',
        purpose: 'any',
      },
    ],
  };
}

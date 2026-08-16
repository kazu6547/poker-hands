import type { Metadata, Viewport } from 'next';
import { AudioPrimer } from '@/components/layout/AudioPrimer';
import { SiteHeader } from '@/components/layout/SiteHeader';
import './globals.css';

const SERVICE_NAME = 'Poker Hand by K.M';
const SERVICE_DESCRIPTION =
  'Poker Hand by K.Mは、ポーカーの役をゲーム感覚で覚えられる学習アプリです。テキサスホールデムの10の役を、見て・選んで・実際に作って身につけられます。';

export const metadata: Metadata = {
  /**
   * OG画像などの絶対URLの基準。
   * Vercel では VERCEL_URL が自動で入るため、公開URLをコードに書かなくてよい。
   */
  metadataBase: new URL(
    process.env.NEXT_PUBLIC_SITE_URL ??
      (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : 'http://localhost:3000'),
  ),
  title: {
    default: `${SERVICE_NAME} | ポーカー役トレーナー`,
    // 各ページの title は「役を当てる｜Poker Hand by K.M」のように揃える
    template: `%s｜${SERVICE_NAME}`,
  },
  description: SERVICE_DESCRIPTION,
  applicationName: SERVICE_NAME,
  openGraph: {
    title: SERVICE_NAME,
    description: SERVICE_DESCRIPTION,
    siteName: SERVICE_NAME,
    locale: 'ja_JP',
    type: 'website',
  },
  twitter: {
    card: 'summary',
    title: SERVICE_NAME,
    description: SERVICE_DESCRIPTION,
  },
};

export const viewport: Viewport = {
  themeColor: '#070B14',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ja">
      <body className="min-h-dvh">
        <AudioPrimer />
        <SiteHeader />
        <main className="mx-auto w-full max-w-5xl px-4 pb-12 pt-6 sm:pt-8">{children}</main>
        <footer className="border-t border-white/5 px-4 py-6 text-center text-xs leading-relaxed text-slate-500">
          {SERVICE_NAME} — 役を覚える学習アプリ
        </footer>
      </body>
    </html>
  );
}

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  /**
   * 出力先は既定の `.next`。
   * Vercel はこのディレクトリを自動検出するため、環境変数を設定しない限り標準の場所に出力される。
   *
   * NEXT_DIST_DIR は、ローカルで出力先を分けたいときだけ使う任意の仕組み
   * （`npm run build:local` / `npm run start:local`）。
   * Next.js 16 では開発サーバーの出力が `.next/dev/` に分離されたため、
   * dev を起動したまま `npm run build` しても開発中の画面は壊れない。
   */
  distDir: process.env.NEXT_DIST_DIR ?? '.next',
};

export default nextConfig;

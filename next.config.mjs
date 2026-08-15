/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  /**
   * 開発サーバー（next dev）を起動したまま next build を実行すると、
   * 共有の .next ディレクトリが本番用の出力で上書きされ、
   * dev 用の CSS / JS が 404 になってスタイルが消える。
   * ビルドの出力先を分けて、この衝突を防ぐ。
   */
  distDir: process.env.NEXT_DIST_DIR ?? '.next',
};

export default nextConfig;

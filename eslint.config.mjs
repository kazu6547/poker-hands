import nextCoreWebVitals from 'eslint-config-next/core-web-vitals';

/**
 * ESLint 9 のフラット設定。
 * Next.js 16 で `next lint` が廃止されたため、ESLint を直接実行する構成に移行した。
 * ルールは移行前（.eslintrc.json の "next/core-web-vitals"）と同じものを維持している。
 */
const eslintConfig = [
  {
    ignores: ['.next/**', '.next-build/**', 'node_modules/**', 'next-env.d.ts'],
  },
  ...nextCoreWebVitals,
];

export default eslintConfig;

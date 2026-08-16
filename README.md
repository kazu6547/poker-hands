# Poker Hand by K.M

**Poker Hand by K.M** は、ポーカーの役をゲーム感覚で覚えられる学習アプリです。
テキサスホールデムの役（10種類）を、**見る・選ぶ・作る・見比べる**の反復で身につけられます。
外部APIやデータベースは使わず、ローカルだけで動作します。

- 「役を当てる」：5枚のカードを見て、役名を4択で回答（全10問／難易度3段階）
- 「役を作る」：お題の役になるように、場のカードから5枚を選ぶ（ヒントつき）
- 「VSカード」：AとBの手を見比べて、強いほう（または引き分け）を答える
- 「最強の5枚」：手札2枚＋場の5枚から、いちばん強い5枚を選ぶ
- 役一覧：10役を強い順に。条件・カード例・見分け方・間違えやすい役との違い
- 学習記録：localStorage に保存（回答数・正答率・役ごとの成績・モード別成績・連続正解記録・最終学習日時）
- 効果音／振動：正解・不正解の控えめなフィードバック（ホームからON/OFF）

## セットアップ

前提：Node.js 20.9 以上（Next.js 16 の要件。推奨 22 以上）。未インストールなら https://nodejs.org からLTS版を入れてください。

```bash
npm install
npm run dev
```

http://localhost:3000 を開くとホーム画面が表示されます。

その他のコマンド：

```bash
npm run lint       # ESLint 9（フラット設定 / next/core-web-vitals 相当）
npm run typecheck  # 型チェックのみ
npm run build      # 本番ビルド（標準の .next へ出力）
npm start          # 本番サーバー起動（build のあと）
npm test           # ロジックの自動テスト
```

## デプロイ（Vercel）

`npm run build` は標準の `.next` に出力するため、Vercel では**リポジトリを Import するだけ**で公開できます。
Output Directory の Override は不要（自動検出のままでOK）、環境変数の設定も不要です。

Next.js 16 では開発サーバーの出力が `.next/dev/` に分離されているため、
`next dev` を起動したまま `npm run build` を実行しても開発中の画面は壊れません。
それでも出力先を完全に分けたい場合のみ、任意で次のスクリプトを使えます（`.next-build` へ出力）。

```bash
npm run build:local
npm run start:local
```

## ディレクトリ構成

```
poker-hands-trainer/            # ディレクトリ名・パッケージ名は識別子として据え置き
├── app/
│   ├── layout.tsx          # 共通レイアウト（ヘッダー／フッター）
│   ├── globals.css         # Tailwind + デザイントークン
│   ├── page.tsx            # ホーム
│   ├── quiz/page.tsx       # 役を当てる
│   ├── build/page.tsx      # 役を作る
│   ├── compare/page.tsx    # VSカード
│   ├── best-five/page.tsx  # 最強の5枚
│   ├── hands/page.tsx      # 役一覧
│   ├── error.tsx           # エラー時の受け皿
│   ├── not-found.tsx       # 404
│   └── icon.svg            # ファビコン
├── components/
│   ├── cards/              # トランプ表現（HTML/CSSのみ）
│   ├── quiz/               # 役を当てるモードのUI
│   ├── build/              # 役を作るモードのUI
│   ├── hands/              # 役一覧のUI
│   ├── home/               # ホームのUI
│   ├── layout/             # ヘッダー
│   └── ui/                 # ボタンなど汎用UI
├── data/hands.ts           # 10役の学習データ（定数）
├── hooks/useProgress.ts    # 学習記録フック
└── lib/
    ├── types.ts            # 型定義
    ├── cards.ts            # デッキ生成・シャッフル・表記パース
    ├── evaluator.ts        # 役判定ロジック
    ├── generator.ts        # 問題生成（クイズ／お題）
    ├── feedback.ts         # フィードバック文の生成
    ├── progress.ts         # localStorage 保存
    └── cn.ts               # クラス名結合ヘルパー
```

## キーボード操作

| 画面 | キー | 動作 |
| --- | --- | --- |
| 役を当てる | `1`〜`4` | 選択肢を選ぶ |
| 役を当てる | `Enter` | 次の問題へ／結果を見る |
| 役を作る | `Enter` | 答え合わせ／次のお題へ |

## 技術スタック

Next.js 16 (App Router) / React 19 / TypeScript / Tailwind CSS v3 / Lucide Icons

---

© 2026 Poker Hand by K.M

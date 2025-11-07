# コードベース構造

## ディレクトリ構成

```
life-game/
├── .github/
│   └── workflows/        # GitHub Actionsワークフロー
│       └── deploy.yml    # GitHub Pagesへの自動デプロイ
├── docs/                 # プロジェクトドキュメント
│   ├── requirements-document.md
│   ├── architectural-decision.md
│   └── instructions.md
├── public/               # 静的アセット
├── src/
│   ├── lib/
│   │   ├── components/      # 再利用可能なUIコンポーネント
│   │   ├── features/
│   │   │   └── lifegame/    # ライフゲーム関連ロジック・UI
│   │   ├── stores/          # Svelte store（状態管理）
│   │   ├── pixi/            # PixiJS関連ラッパ・初期化コード
│   │   ├── styles/          # Tailwindカスタム設定、共通スタイル
│   │   └── types/           # 型定義
│   ├── assets/              # アセット（画像、アイコン等）
│   ├── main.ts              # エントリーポイント
│   ├── App.svelte           # ルートコンポーネント
│   └── app.css              # グローバルスタイル（Tailwind含む）
├── index.html            # HTMLエントリーポイント
├── vite.config.ts        # Vite設定
├── tsconfig.json         # TypeScript設定（プロジェクトルート）
├── tsconfig.app.json     # アプリケーション用TypeScript設定
├── tsconfig.node.json    # Node.js用TypeScript設定
├── tailwind.config.js    # Tailwind CSS設定
├── postcss.config.js     # PostCSS設定
├── eslint.config.js      # ESLint設定
├── .prettierrc           # Prettier設定
├── svelte.config.js      # Svelte設定
├── package.json          # パッケージ定義とスクリプト
└── CLAUDE.md             # Claude Code用ガイド

```

## 重要なファイル

- **CLAUDE.md**: プロジェクト概要と開発ガイドライン
- **vite.config.ts**: GitHub Pages用に`base: '/life-game/'`を設定
- **tsconfig.app.json**: TypeScript strict設定有効化
- **tailwind.config.js**: シーンプリセット用カラーパレット定義（Forest, Ocean, Nebula等）

## 現在の実装状態

プロジェクトはセットアップ完了状態。主要な機能はこれから実装予定：

- ライフゲームコアロジック（未実装）
- PixiJS描画（未実装）
- Svelte Storeによる状態管理（未実装）
- UIコンポーネント（未実装）

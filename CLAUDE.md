# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## プロジェクト概要

「ジェネラティブ文学ツール」— Conway's Game of Life のセルを日本語の文字に置き換えた、文字の生成・変異・崩壊を観賞するWebアプリケーション。セルオートマトンの規則に従って文字が生まれ、隣接セルの影響で変異し、死ぬときは徐々に崩壊していく。偶然形成された意味のある単語を検出・ハイライトする機能を持つ。

### コンセプト

- セルの生死をピクセルではなく日本語の文字（ひらがな・カタカナ）で表現
- WebGPU Compute Shader で大規模グリッド（256×256+）を60fpsで並列処理
- MSDF (Multi-channel Signed Distance Field) フォントレンダリングでGPU上でテキスト描画
- 観賞モード: 眺めているだけで「言葉が生まれる瞬間」を体験できる

## 技術スタック

- **言語**: TypeScript（strict設定）
- **フレームワーク**: Svelte 5（Vite 7ベース）、`$state` / `$props` / `$derived` runes使用
- **スタイリング**: Tailwind CSS 4
- **描画**: WebGPU（Compute Shader + Fragment Shader）、MSDF テキストレンダリング
- **意味検出**: Web Worker でのバックグラウンド単語検出
- **ホスティング**: GitHub Pages（静的ファイル配信）

## アーキテクチャ

### ディレクトリ構成

```
src/
  lib/
    gpu/                         # WebGPU 関連
      WebGPUContext.ts           # GPU初期化、Result型エラーハンドリング
      BufferManager.ts           # ダブルバッファリング、uniform管理、GPU→CPU readback
      ComputePipeline.ts         # Compute Pipeline（セルオートマトン計算）
      RenderPipeline.ts          # Render Pipeline（MSDFテキスト描画）
      shaders/
        automaton.wgsl           # Conway B3/S23 + コードポイント変異 Compute Shader
        text_render.wgsl         # MSDF Vertex + Fragment Shader
    font/
      MSDFAtlasManager.ts       # アトラス読み込み、グリフUVルックアップテーブル
      atlas/                     # 生成済みMSDFアトラス（PNG + JSON）
    features/
      automaton/
        CharacterSet.ts          # ひらがな/カタカナ範囲定義、ランダム生成
        rules/
          MutationRule.ts        # 変異ルールインターフェース
          CodepointRule.ts       # コードポイント演算ルール（3プリセット）
      seed/
        RandomSeed.ts            # ランダムシード生成
        TextSeed.ts              # テキスト→グリッド変換
        AozoraSeed.ts            # 青空文庫シード
        aozora-texts/            # バンドルされた青空文庫テキスト
      detection/
        dictionary.ts            # 日本語ワードリスト
        GridScanner.ts           # グリッド→テキストシーケンス抽出
        WordDetector.ts          # 単語検出コーディネーター
        detection.worker.ts      # Web Worker（バックグラウンド検出）
      themes/
        presets.ts               # 3テーマ定義（和紙墨流し、ターミナル、ミニマル）
    stores/                      # Svelte stores
    types/
      cell.ts                    # セル型定義、CellFlags、GPU バッファレイアウト
      theme.ts                   # テーマ型
      seed.ts                    # シード型
    components/
      Canvas.svelte              # メインWebGPUキャンバス（アニメーションループ、パン/ズーム）
      ControlBar.svelte          # 下部コントロールバー（ホバー表示）
      WordLog.svelte             # 検出単語オーバーレイ
      FallbackMessage.svelte     # WebGPU非対応メッセージ
  App.svelte                     # ルートコンポーネント
```

### GPUバッファレイアウト

セル1つ = 8バイト:
- `codepoint` (u32): Unicode コードポイント。0 = 死セル
- `gen_flags` (u32): 下位16ビット = generation（+32768バイアス）、上位16ビット = flags

### 描画パイプライン

1. **Compute Shader** (`automaton.wgsl`): ダブルバッファのping-pongでセル状態を更新
2. **Render Pipeline** (`text_render.wgsl`): インスタンスレンダリング（6頂点×全セル）でMSDFテキスト描画

## 開発コマンド

```bash
yarn dev              # 開発サーバー起動
yarn run check        # TypeScript + Svelte 型チェック（yarn check ではなく yarn run check）
npx eslint src/       # ESLint
yarn format           # Prettier 整形
yarn generate-atlas   # MSDFフォントアトラス再生成
```

**注意**: `yarn check` は yarn の built-in コマンドが実行されるため、必ず `yarn run check` を使用する。

## キーボードショートカット

- `Space`: 再生/停止
- `F`: フルスクリーン
- `R`: リセット
- `T`: テーマ切替
- `[` / `]`: 速度調整

## コミット規約

```
phase<N>: <タスクID> <簡潔な説明>
```

## 参考ドキュメント

- 設計書: `docs/generative-literature-design.md`
- タスク管理: `docs/generative-literature-tasks.md`

## その他注意事項

- WebGPU 必須（フォールバックなし）
- バックエンドなし、静的ホスティング前提
- `.wgsl` シェーダーは `?raw` import で読み込み
- MSDFアトラスは `*.png?url` / `*.json?url` で import

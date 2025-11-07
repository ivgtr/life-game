# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## プロジェクト概要

このプロジェクトは「ライフゲーム観賞・生態系ビューア」Webサイトです。Conway's Game of Lifeを眺めて癒やされる体験を提供するSPA（Single Page Application）です。

### コンセプト

- ライフゲームのセルの動きを「生態系」「小さな宇宙」として鑑賞する
- 積極的な操作なしに、ボーッと眺めていられる"癒やし系"体験
- シンプルで没入感のあるデザイン

## 技術スタック

- **言語**: TypeScript（strict設定）
- **フレームワーク**: Svelte（Viteベース、またはSvelteKit + adapter-static）
- **スタイリング**: Tailwind CSS
- **描画**: PixiJS（キャンバス描画とアニメーション）
- **ホスティング**: GitHub Pages（静的ファイル配信）
- **CI/CD**: GitHub Actions

## アーキテクチャの重要な設計方針

### 責務の分離

1. **ライフゲームコアロジック**
   - 描画レイヤーから完全に独立した純粋ロジック
   - `LifeGrid`, `LifeEngine`などのクラス/関数群
   - 型定義: `CellState`, `Grid`, `SimulationSettings`, `PresetConfig`
   - ビット演算やWebWorkerでの最適化余地を残す構造

2. **状態管理（Svelte Store）**
   - `simulationStore`: 再生/停止、速度、現在ステップ
   - `presetStore`: 選択中プリセット、プリセット一覧
   - `uiStore`: Zenモード、サウンドON/OFF
   - コンポーネントが直接ロジックを持ちすぎないように設計

3. **PixiJS統合**
   - 専用コンポーネント（`<LifeCanvas />`等）で初期化
   - `onMount`で初期化、`onDestroy`でリソース解放
   - `requestAnimationFrame` / `Ticker`でレンダリングループ制御
   - Svelte storeの変更とPixi描画の同期設計

### ディレクトリ構成（予定）

```
src/
  lib/
    components/      # 再利用可能なUIコンポーネント
    features/
      lifegame/      # ライフゲーム関連ロジック・UI
    stores/          # Svelte store（状態管理）
    styles/          # Tailwindカスタム設定、共通スタイル
    pixi/            # PixiJS関連ラッパ・初期化コード
```

## コア機能要件

### ライフゲーム基本

- Conway's Game of Lifeルール
- グリッドサイズ: PC 80-150×50-100、スマホは自動調整
- トーラス（端ループ）実装、オプションで切替可能

### 観賞モード

- ページ表示と同時に自動シミュレーション開始
- ランダムシード/プリセット自動切替の「おまかせ観賞モード」
- シーン切替時のフェード・ズームトランジション

### シーンプリセット（"生態系"テーマ）

例: Forest（緑系）、Ocean（青系）、Nebula（紫-ピンク）、City Lights、Desert

各プリセット：

- 初期配置生成アルゴリズム
- カラーパレット（背景、死細胞、生細胞、フェード色）
- シミュレーション速度、ズームパラメータ

### セル描画表現

- 角を丸める、生死遷移のフェードアニメーション
- 生存世代数に応じた色変化
- 疑似パララックス表現（任意）

## パフォーマンス要件

- **目標**: PC全画面で60fps前後
- スマホではフレームレート/グリッドサイズ自動調整
- ウィンドウ非アクティブ時は更新間隔を落とす or 一時停止
- デバイスピクセル比対応
- セル描画の最適化（Sprite vs Graphics vs Mesh検討）

## GitHub Pages デプロイ

### 想定フロー

- `main`ブランチへのpush/PRマージ
- GitHub Actionsで自動ビルド
- `gh-pages`ブランチまたは`main`の`docs/`へデプロイ

### Vite設定

- `base`設定でGitHub Pagesの公開パス対応（`https://<user>.github.io/<repo>/`）

### GitHub Actions構成案

- `.github/workflows/deploy.yml`
- 使用Action: `actions/checkout`, `actions/setup-node`, `peaceiris/actions-gh-pages`
- キャッシュ戦略（`node_modules`）
- ステップ: checkout → install → build → deploy

## 開発時の注意点

### コード品質

- TypeScript strict設定を維持
- ESLint / Prettier導入（Svelte用プラグイン含む）
- ライフゲームロジックのユニットテスト必須
- CI（GitHub Actions）で型エラー、Lintチェック

### "癒やし"体験を壊さないために

- UIはうるさすぎない、控えめなデザイン
- アニメーション遷移は穏やか
- パフォーマンス低下による体験破綻を避ける
- コントラスト比、色覚多様性への配慮

### 拡張性

- プリセット追加しやすい構造
- 音声機能、ギャラリー機能追加の余地
- 将来的にWebWorker移行可能な設計

## 優先度付けの基本方針

1. **MVP（最優先）**
   - ライフゲームロジック
   - PixiJS描画
   - 基本的な観賞モード（再生/停止・速度変更・ランダムシード）

2. **初期リリース**
   - プリセット（Forest/Ocean/Nebula等）
   - Zenモード・UI最小構成
   - レスポンシブ対応

3. **拡張機能**
   - 生態系メモ
   - 観察ノート
   - サウンド

4. **品質向上**
   - テスト整備
   - ドキュメント
   - パフォーマンスチューニング

## 参考ドキュメント

- 要件定義: `docs/requirements-document.md`
- 技術選定・実装方針: `docs/architectural-decision.md`
- タスク管理指示: `docs/instructions.md`

## その他注意事項

- バックエンドなし、静的ホスティング前提
- セキュリティリスク（XSS等）への配慮
- アクセシビリティ（キーボード操作、色覚多様性）
- レスポンシブ対応（PC・タブレット・スマホ）

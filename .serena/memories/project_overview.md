# プロジェクト概要

## プロジェクトの目的

「ライフゲーム観賞・生態系ビューア」Webサイト - Conway's Game of Lifeを眺めて癒やされる体験を提供するSPA（Single Page Application）

### コンセプト

- ライフゲームのセルの動きを「生態系」「小さな宇宙」として鑑賞する
- 積極的な操作なしに、ボーッと眺めていられる"癒やし系"体験
- シンプルで没入感のあるデザイン

## 技術スタック

- **言語**: TypeScript 5.9.3 (strict設定)
- **フレームワーク**: Svelte 5.39.6 + Vite 7.1.7
- **スタイリング**: Tailwind CSS 4.1.17
- **描画**: PixiJS 8.14.0
- **テスト**: Vitest 4.0.8
- **コード品質**: ESLint 9.39.1 + Prettier 3.6.2
- **ホスティング**: GitHub Pages
- **CI/CD**: GitHub Actions

## アーキテクチャ設計の重要ポイント

### 責務の分離

1. **ライフゲームコアロジック** - 描画レイヤーから完全に独立した純粋ロジック
   - `LifeGrid`, `LifeEngine`などのクラス/関数群
   - 型定義: `CellState`, `Grid`, `SimulationSettings`, `PresetConfig`

2. **状態管理（Svelte Store）**
   - `simulationStore`: 再生/停止、速度、現在ステップ
   - `presetStore`: 選択中プリセット、プリセット一覧
   - `uiStore`: Zenモード、サウンドON/OFF

3. **PixiJS統合**
   - 専用コンポーネント（`<LifeCanvas />`等）で初期化
   - `onMount`で初期化、`onDestroy`でリソース解放

## パフォーマンス要件

- **目標**: PC全画面で60fps前後
- スマホではフレームレート/グリッドサイズ自動調整
- ウィンドウ非アクティブ時は更新間隔を落とす or 一時停止

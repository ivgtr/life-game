# ジェネラティブ文学ツール - 実装タスク

> 設計書: [generative-literature-design.md](./generative-literature-design.md)

---

## タスク進行ルール

### 1. タスク単位でコミットする

- 各タスク完了時に1コミットを作成する
- コミットメッセージ形式: `phase<N>: <タスクID> <簡潔な説明>`
- 例: `phase0: 0.1 remove legacy lifegame code`
- 例: `phase1: 1.3 implement automaton compute shader`
- 例: `phase2: 2.2-T add MSDF render pipeline tests`

### 2. テスト→実装→検証の反復サイクル

- **テストタスク（`*-T`）完了時**: テストコードを記述し `yarn check` が通ることを確認してコミット（テストは実装前なので FAIL で良い。ただしコンパイルは通す — スタブ/未実装マーカーを使用）
- **実装タスク完了時**: `yarn test` を実行し、該当テストが全て PASS することを確認してコミット
- テストが FAIL した場合: テストコードではなく実装を修正する（テスト要件が正しい前提）。テスト自体にバグがある場合のみテストを修正し、修正理由をコミットメッセージに明記する

### 3. フェーズ完了時のゲート

各フェーズの全タスク完了後に以下を確認:

1. `yarn test` で全テスト PASS
2. `yarn check` で型エラーなし
3. `yarn lint` でLintエラーなし
4. `yarn format` でコード整形

ゲート通過後に次のフェーズに進む。

### 4. その他

- GPU/WebGPU関連のコードはブラウザ実行が前提のため、ユニットテストが困難な場合はスキップし、代わりに手動検証手順をコミットメッセージに記載する
- Compute Shader (`.wgsl`) の文法チェックは `yarn check` のスコープ外。ブラウザでの動作確認をもって検証とする

---

## Phase 0: プロジェクトリセット・基盤準備

既存のライフゲームコードを整理し、新しい方向性のための基盤を整える。

### 0.1 既存コードのクリーンアップ

- [ ] `src/lib/` 配下の既存コンポーネント・ロジックを削除
  - PixiJS関連 (`pixi/`, `SimpleLifeRenderer.ts`, `HierarchicalLifeRenderer.ts` 等)
  - 旧ライフゲームエンジン (`features/lifegame/`)
  - 旧ストア (`stores/simulationStore.ts`, `simpleLifeStore.ts` 等)
  - 旧コンポーネント (`components/` 配下全て)
  - 旧型定義 (`types/`)
  - 旧ズームシステム (`features/zoom/`)
- [ ] `package.json` から不要な依存を削除 (`pixi.js`, `simplex-noise`)
- [ ] `App.svelte` を最小構成にリセット
- [ ] 旧テストファイルの削除

### 0.2 新規ディレクトリ構造の作成

- [ ] 設計書に記載のディレクトリ構造を作成
  - `src/lib/gpu/`
  - `src/lib/gpu/shaders/`
  - `src/lib/font/`
  - `src/lib/font/atlas/`
  - `src/lib/features/automaton/`
  - `src/lib/features/automaton/rules/`
  - `src/lib/features/seed/`
  - `src/lib/features/seed/aozora-texts/`
  - `src/lib/features/detection/`
  - `src/lib/features/themes/`

### 0.3 WebGPU開発環境セットアップ

- [ ] `@webgpu/types` をdevDependencyに追加
- [ ] `tsconfig.json` にWebGPU型の参照を追加
- [ ] WebGPU対応チェックユーティリティの作成 (`src/lib/gpu/WebGPUContext.ts` 骨格)
- [ ] Vite設定の調整（必要に応じてWASM対応等）

### 0.4 MSDFフォントアトラスのビルドパイプライン構築

- [ ] `msdf-atlas-gen` のインストール・設定
- [ ] ひらがな・カタカナのグリフリスト作成
- [ ] ビルドスクリプト作成（`scripts/generate-atlas.sh` 等）
- [ ] MSDFアトラス画像（PNG）+ メタデータ（JSON）の生成
- [ ] `src/lib/font/atlas/` に出力を配置
- [ ] npm scriptに `generate-atlas` コマンドを追加

**完了条件**: ひらがな・カタカナのMSDFアトラスがビルド可能。不要な旧コード削除済み。

---

## Phase 1: WebGPU基盤 + セルオートマトン計算

WebGPUの初期化とCompute Shaderでのセルオートマトン計算を実装する。

### 1.1 WebGPU初期化

- [ ] `WebGPUContext.ts`: GPUデバイス取得・初期化
  - `navigator.gpu` の存在チェック
  - アダプター・デバイスのリクエスト
  - エラーハンドリング（非対応時のメッセージ表示）
- [ ] `FallbackMessage.svelte`: WebGPU非対応時の案内画面

### 1.2 セルバッファ管理

- [ ] `BufferManager.ts`: GPUバッファの作成・管理
  - セルデータバッファ（ダブルバッファリング）
  - 均一バッファ（グリッドサイズ、パラメータ）
  - ステージングバッファ（CPU↔GPU転送用）
- [ ] `CellTypes.ts`: セルの型定義
  - `Cell` 構造体のTypeScript型
  - バッファレイアウト定義

### 1.3 Compute Shader（セルオートマトン）

- [ ] `automaton.wgsl`: セルオートマトンCompute Shader
  - Conway B3/S23 生死判定
  - コードポイント変異演算（初期版）
  - 文字崩壊プロセス
  - 誕生時の文字決定
  - トーラス（端ループ）対応
- [ ] `ComputePipeline.ts`: Compute Pipeline管理
  - シェーダーモジュール作成
  - パイプラインレイアウト
  - バインドグループ
  - ディスパッチ実行

### 1.4 基本動作確認

- [ ] 500×500グリッドのセルオートマトンがGPU上で動作することを確認
- [ ] CPU側でバッファを読み取り、コンソールに状態出力（デバッグ用）
- [ ] Compute Shaderのユニットテスト（小規模グリッドでの正確性検証）

**完了条件**: Compute Shaderでセルオートマトンが正しく動作。ブラウザコンソールで状態遷移を確認可能。

---

## Phase 2: MSDF テキストレンダリング

GPUで計算されたセル状態をMSDFフォントで画面に描画する。

### 2.1 MSDFアトラスローダー

- [ ] `MSDFAtlasManager.ts`: アトラス画像・メタデータの読み込み
  - アトラスPNGをGPUテクスチャとしてロード
  - メタデータJSONの解析（各グリフのUV座標、アドバンス等）
  - コードポイントからUV座標へのルックアップテーブル

### 2.2 Render Pipeline

- [ ] `quad.wgsl`: Vertex Shader
  - グリッド上の各セルに対応するクワッド（四角形）を生成
  - セルバッファから文字情報を読み取り
  - アトラス内のUV座標を計算
- [ ] `text_render.wgsl`: Fragment Shader
  - MSDFテクスチャサンプリング
  - Signed Distance → アルファ変換
  - 世代カウントに応じた色変化
  - 崩壊エフェクト（透明度低下、ノイズ）
- [ ] `RenderPipeline.ts`: Render Pipeline管理
  - パイプライン構築
  - テクスチャバインディング
  - 描画コマンド発行

### 2.3 Svelteキャンバス統合

- [ ] `Canvas.svelte`: メインキャンバスコンポーネント
  - `<canvas>` 要素の管理
  - WebGPUコンテキスト設定
  - リサイズ対応（ResizeObserver）
  - デバイスピクセル比対応
  - `onMount` / `onDestroy` でのライフサイクル管理
- [ ] `App.svelte`: Canvas コンポーネントの組み込み

### 2.4 アニメーションループ

- [ ] Compute → Render のフレームループ実装
  - `requestAnimationFrame` ベース
  - 世代更新速度の制御（configurable tick rate）
  - フレームレートモニタリング

**完了条件**: 500×500のグリッドで文字がMSDFで描画され、セルオートマトンが視覚的に動作。60fps。

---

## Phase 3: 変異ルールエンジン + テーマシステム

ルールの差し替え可能な設計とビジュアルテーマの実装。

### 3.1 変異ルールインターフェース

- [ ] `MutationRule.ts`: ルールインターフェース定義
  - `mutate(cell, neighbors)`: 生存セルの変異
  - `birth(neighbors)`: 新規セルの誕生文字決定
  - GPU上で動作するパラメータ構造体
- [ ] `CodepointRule.ts`: コードポイント演算ルール実装
  - 隣接セルのコードポイント加重平均
  - ドリフトパラメータ
  - 有効文字クランプ

### 3.2 文字セット管理

- [ ] `CharacterSet.ts`: 文字セットの定義・管理
  - ひらがな/カタカナ/漢字の範囲定義
  - コードポイントの有効性チェック
  - クランプロジック（無効なコードポイントを最近接有効文字に変換）

### 3.3 テーマシステム

- [ ] `Theme.ts`: テーマインターフェース定義
- [ ] `WashiInkTheme.ts`: 和紙・墨流しテーマ
  - 和紙テクスチャ背景（あるいは近似するグラデーション）
  - 墨色の文字（世代で濃淡変化）
- [ ] `TerminalGlitchTheme.ts`: ターミナル・グリッチテーマ
  - 黒背景 + 緑/アンバー文字
  - グリッチエフェクト、スキャンライン
- [ ] `MinimalTypoTheme.ts`: ミニマル・タイポグラフィテーマ
  - 白背景 + 黒文字
  - 微妙な世代色変化
- [ ] Fragment Shader へのテーマパラメータ反映

### 3.4 文字崩壊エフェクト

- [ ] Compute Shader: 崩壊段階の管理
- [ ] Fragment Shader: 崩壊ビジュアル
  - 透明度低下
  - グリッチ/ノイズ
  - フラグメント化（テーマ依存）

**完了条件**: 3テーマが切り替え可能。文字変異と崩壊が視覚的に美しく動作。

---

## Phase 4: シードシステム + 基本UI

シード（初期状態）の選択・設定と、観賞に必要な最小限のUIを実装。

### 4.1 シードシステム

- [ ] `RandomSeed.ts`: ランダムシード生成
  - 密度パラメータ（デフォルト30%）
  - 文字セットからのランダム選択
- [ ] `AozoraSeed.ts`: 青空文庫シード
  - テキストをグリッドに配置するロジック
  - 改行・句読点の扱い
- [ ] `TextSeed.ts`: ユーザーテキストシード
  - テキスト入力受付
  - グリッドへの変換
- [ ] 青空文庫バンドルテキスト準備
  - 3-5作品の冒頭テキストを `aozora-texts/` にJSON形式で配置
  - メタデータ（作品名、著者、出典URL）

### 4.2 Svelte ストア

- [ ] `simulationStore.ts`: シミュレーション状態管理
  - 再生/停止状態
  - 世代カウント
  - 速度設定
  - 生存セル数
- [ ] `themeStore.ts`: テーマ状態管理
- [ ] `seedStore.ts`: シード状態管理

### 4.3 UI コンポーネント

- [ ] `ControlBar.svelte`: 下部コントロールバー
  - 再生/停止ボタン
  - 速度調整スライダー
  - ホバーで表示/非表示
- [ ] `ThemeSelector.svelte`: テーマ切り替え
- [ ] `SeedSelector.svelte`: シード選択
  - ランダム / 青空文庫 / テキスト貼付のタブ
  - 青空文庫の作品リスト
  - テキスト入力エリア
- [ ] `GenerationCounter.svelte`: 世代カウンター表示

### 4.4 ズーム/パン操作

- [ ] マウスホイールによるズーム
- [ ] マウスドラッグによるパン
- [ ] ビューポート変換の管理

**完了条件**: 各シードでシミュレーションが開始可能。基本的なUI操作で観賞体験が成立。

---

## Phase 5: 意味検出システム

Web Workerでの形態素解析による単語検出とハイライト。

### 5.1 Web Worker セットアップ

- [ ] `detection.worker.ts`: Web Worker実装
  - kuromoji.js (Wasm版) の初期化
  - メッセージングインターフェース定義
  - 辞書の遅延ロード・IndexedDBキャッシュ
- [ ] Vite Worker 設定（`?worker` import）

### 5.2 グリッドスキャン

- [ ] グリッドデータのテキスト抽出ロジック
  - 横方向スキャン（主要）
  - 縦方向スキャン（副次）
  - 連続する生セルの文字列化
- [ ] スキャン間隔の制御（5-10世代ごと）

### 5.3 単語検出

- [ ] `WordDetector.ts`: 単語検出ロジック
  - 形態素解析結果から有意な単語を抽出
  - 最小文字長フィルタ（2文字以上）
  - 座標マッピング（テキスト上の位置→グリッド座標）
- [ ] 検出結果の GPU バッファ反映（`flags` フィールド更新）

### 5.4 ハイライト表示

- [ ] Fragment Shader: ハイライトエフェクト
  - 検出された単語の文字を発光/強調表示
  - テーマに応じたハイライト色
- [ ] `WordLog.svelte`: 検出単語のログ表示
  - 検出された単語のリスト
  - 検出時の世代数
  - フェードアウトアニメーション
- [ ] `detectionStore.ts`: 検出状態管理

**完了条件**: 意味のある単語が自動検出され、画面上でハイライトされる。検出ログが表示される。

---

## Phase 6: 拡張・ポリッシュ

### 6.1 動的漢字アトラス

- [ ] `DynamicGlyphLoader.ts`: 動的グリフ生成
  - Canvas 2Dでグリフレンダリング
  - 簡易SDF計算
  - GPUテクスチャアトラスへの動的追加
  - LRUキャッシュ管理
- [ ] 漢字対応の文字セット拡張
- [ ] 青空文庫テキストで使われる漢字の事前ロード

### 6.2 青空文庫ランタイム取得

- [ ] 青空文庫API/GitHubからの作品取得
- [ ] ルビ・注記の除去パーサー
- [ ] 作品検索・選択UI

### 6.3 パフォーマンス最適化

- [ ] インスタンスレンダリング最適化
- [ ] 可視範囲カリング
- [ ] フレームレート自動調整
- [ ] メモリ使用量のプロファイリング・最適化

### 6.4 UI ポリッシュ

- [ ] レスポンシブ対応（モバイル）
- [ ] フルスクリーンモード
- [ ] キーボードショートカット（Space: 再生/停止 等）
- [ ] アクセシビリティ対応（色覚多様性、キーボード操作）
- [ ] ローディング画面・プログレスバー（辞書ロード中）

### 6.5 CLAUDE.md・ドキュメント更新

- [ ] CLAUDE.md をジェネラティブ文学ツールの新コンセプトに更新
- [ ] README.md の更新

**完了条件**: 漢字対応、パフォーマンス最適化完了、UI完成。

---

## 依存関係

```
Phase 0 ──→ Phase 1 ──→ Phase 2 ──→ Phase 3 ──→ Phase 4 ──→ Phase 5 ──→ Phase 6
  │                        ↑
  │                        │
  └── MSDFアトラス ────────┘
```

- Phase 0 は全ての前提
- Phase 1 (Compute) と Phase 0.4 (MSDFアトラス) は並行可能
- Phase 2 は Phase 1 + MSDFアトラス完成が前提
- Phase 3-4 は Phase 2 完成後
- Phase 5 は Phase 4 完成後（UIが必要）
- Phase 6 は全フェーズの延長・改善

---

## MVP定義

**Phase 0 + 1 + 2 + 3（テーマ1種のみ）+ 4（ランダムシードのみ）** で MVP とする。

MVPの体験:
- ブラウザを開くと 500×500 のグリッドで文字セルオートマトンが動作
- 文字が変異し、崩壊し、新しい文字が生まれる様子を観賞できる
- 1つのテーマで美しく表示される
- 再生/停止/速度調整が可能

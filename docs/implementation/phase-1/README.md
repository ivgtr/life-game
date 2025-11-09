# Phase 1: コアシステム実装

**見積もり時間**: 3-4日
**ステップ数**: 23

---

## 概要

階層的ズームシステムの基盤となるコアシステムを実装します。
このPhaseでは、ズームレベルの定義、集約・分割戦略、マルチレゾリューショングリッドを構築します。

---

## Phase 1.1: ズームレベルの基礎定義

**ステップ数**: 3

- [ ] [Step 1.1.1: ZoomLevel enum定義とチャンクサイズ計算関数](./step-1.1.1.md)
- [ ] [Step 1.1.2: 時間スケール計算関数の実装](./step-1.1.2.md)
- [ ] [Step 1.1.3: レベル名とメタデータの定義](./step-1.1.3.md)

**目標**: 14段階のズームレベルとフィボナッチベースのチャンクサイズ計算を実装

---

## Phase 1.2: 集約戦略の実装

**ステップ数**: 4

- [ ] [Step 1.2.1: AggregationStrategy インターフェース定義](./step-1.2.1.md)
- [ ] [Step 1.2.2: EntropyAggregation実装（密度計算）](./step-1.2.2.md)
- [ ] [Step 1.2.3: EntropyAggregation実装（履歴管理とエントロピー計算）](./step-1.2.3.md)
- [ ] [Step 1.2.4: EdgeDetectionAggregation実装](./step-1.2.4.md)

**目標**: 知的な集約戦略で縮小時のパターン保存を実現

---

## Phase 1.3: 分割戦略の実装

**ステップ数**: 6

- [ ] [Step 1.3.1: simplex-noiseパッケージのインストール](./step-1.3.1.md)
- [ ] [Step 1.3.2: SubdivisionStrategy インターフェース定義](./step-1.3.2.md)
- [ ] [Step 1.3.3: 既知パターンライブラリの定義](./step-1.3.3.md)
- [ ] [Step 1.3.4: OrganicSubdivision実装（ノイズ生成部分）](./step-1.3.4.md)
- [ ] [Step 1.3.5: OrganicSubdivision実装（フラクタル部分）](./step-1.3.5.md)
- [ ] [Step 1.3.6: PatternLibrarySubdivision実装](./step-1.3.6.md)

**目標**: 有機的な分割戦略で拡大時の自然なパターン生成を実現

---

## Phase 1.4: MultiResolutionGrid実装

**ステップ数**: 5

- [ ] [Step 1.4.1: MultiResolutionGrid基本構造とコンストラクタ](./step-1.4.1.md)
- [ ] [Step 1.4.2: setZoomLevel メソッド実装](./step-1.4.2.md)
- [ ] [Step 1.4.3: aggregateGrid メソッド実装](./step-1.4.3.md)
- [ ] [Step 1.4.4: subdivideGrid メソッド実装](./step-1.4.4.md)
- [ ] [Step 1.4.5: getCurrentGrid と補助メソッド実装](./step-1.4.5.md)

**目標**: レベル間のスムーズな移行を実現するグリッド管理システム

---

## Phase 1完了: 基本動作テスト

**ステップ数**: 1

- [ ] [Phase 1完了: 基本動作テスト](./step-1.5.1.md)

**目標**: すべての機能が正しく動作することを確認

---

## Phase 1完了後: コミット

- [ ] Phase 1のすべての変更をコミット
- [ ] コミットメッセージ: `feat: Phase 1 - 階層的ズームシステムのコアシステム実装`

---

## 作成されるファイル一覧

```
src/lib/
  types/
    zoom.ts                                      # Step 1.1.1
  features/
    zoom/
      constants.ts                               # Step 1.1.3
      timeScale.ts                               # Step 1.1.2
      aggregation/
        AggregationStrategy.ts                   # Step 1.2.1
        EntropyAggregation.ts                    # Step 1.2.2, 1.2.3
        EdgeDetectionAggregation.ts              # Step 1.2.4
      subdivision/
        SubdivisionStrategy.ts                   # Step 1.3.2
        OrganicSubdivision.ts                    # Step 1.3.4, 1.3.5
        PatternLibrarySubdivision.ts             # Step 1.3.6
      MultiResolutionGrid.ts                     # Step 1.4.1-1.4.5
      __tests__/
        MultiResolutionGrid.test.ts              # Step 1.5.1
    lifegame/
      patterns.ts                                # Step 1.3.3
```

---

## 依存関係

### 外部パッケージ

- `simplex-noise`: ノイズ生成（Step 1.3.1でインストール）

### 内部依存

- 既存の `src/lib/types/lifegame.ts` の `CellState` 型を使用

---

## 重要な設計判断

### 1. フィボナッチ数列の採用

自然界に多く見られる黄金比に基づくチャンクサイズで、有機的な美しさを実現。

### 2. エントロピーベース集約

単純な密度ではなく、活動度（変化量）を重視することで、動的なパターンを優先的に保存。

### 3. 有機的分割

ノイズ+フラクタルで、拡大時に自然で予測不可能なパターンを生成。

---

## テスト戦略

### ユニットテスト対象

- `getChunkSize()`: すべてのズームレベルで正しい値を返すか
- `getTimeScale()`: 相対論的時間スケールが正しく計算されるか
- `EntropyAggregation.aggregate()`: 各閾値で正しく集約されるか
- `EdgeDetectionAggregation.detectEdges()`: エッジが正しく検出されるか
- `OrganicSubdivision.subdivide()`: 適切なパターンが生成されるか
- `MultiResolutionGrid.setZoomLevel()`: 集約・分割が正しく実行されるか

### 統合テスト対象（Step 1.5.1）

- レベル変更の一連の流れ（COSMOS → STANDARD → QUANTUM）
- メモリリークがないか（大量のレベル変更）
- パフォーマンス（大きなグリッドでの変換速度）

---

## 課題・メモ

<!-- 実装中に出てきた課題や気づきをここに記録 -->

---

## 次のステップ

Phase 1完了後、Phase 2（量子的シミュレーション）に進みます。

[Phase 2の詳細を見る](../phase-2/README.md)

---

最終更新: 2025-11-09

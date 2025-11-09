# Phase 3: レンダリング+カラーシステム実装

**見積もり時間**: 3-4日
**ステップ数**: 11

---

## 概要

階層的レンダリングシステムと、ズームレベルに応じたスペクトラムカラーシステムを実装します。

---

## Phase 3.1: HierarchicalLifeRenderer実装

**ステップ数**: 4

- [ ] [Step 3.1.1: HierarchicalLifeRenderer基本構造](./step-3.1.1.md)
- [ ] [Step 3.1.2: ビューポート計算（calculateVisibleBounds）](./step-3.1.2.md)
- [ ] [Step 3.1.3: レベル別描画ロジック（renderGrid）](./step-3.1.3.md)
- [ ] [Step 3.1.4: カリング最適化](./step-3.1.4.md)

**目標**: 効率的な階層的レンダリングシステムの構築

---

## Phase 3.2: SpectrumColorSystem実装

**ステップ数**: 4

- [ ] [Step 3.2.1: SpectrumColorSystem基本構造](./step-3.2.1.md)
- [ ] [Step 3.2.2: HSL→RGB変換ユーティリティ](./step-3.2.2.md)
- [ ] [Step 3.2.3: レベル別色取得（getColorForLevel）](./step-3.2.3.md)
- [ ] [Step 3.2.4: 年齢・活動度別色調整](./step-3.2.4.md)

**目標**: レインボーグラデーションによる視覚的フィードバック

---

## Phase 3.3: PixiJS統合とテスト

**ステップ数**: 2

- [ ] [Step 3.3.1: LifeRendererの置き換え](./step-3.3.1.md)
- [ ] [Step 3.3.2: LifeCanvasコンポーネント更新](./step-3.3.2.md)

**目標**: 既存のPixiJS統合を新しいレンダラーに置き換え

---

## Phase 3完了: 描画テスト

**ステップ数**: 1

- [ ] [Phase 3完了: 描画テスト](./step-3.4.1.md)

**目標**: すべてのズームレベルで正しく描画されることを確認

---

## Phase 3完了後: コミット

- [ ] Phase 3のすべての変更をコミット
- [ ] コミットメッセージ: `feat: Phase 3 - 階層的レンダリングとスペクトラムカラーシステム実装`

---

## 作成されるファイル一覧

```
src/lib/
  pixi/
    HierarchicalLifeRenderer.ts                  # Step 3.1.1-3.1.4
  features/
    zoom/
      SpectrumColorSystem.ts                     # Step 3.2.1-3.2.4
      __tests__/
        SpectrumColorSystem.test.ts              # Step 3.4.1
  components/
    LifeCanvas.svelte                            # Step 3.3.2（更新）
```

---

## 重要な設計判断

### 1. ビューポート設計

```typescript
interface Viewport {
  centerX: number        // グローバル座標X
  centerY: number        // グローバル座標Y
  zoomLevel: ZoomLevel   // 現在のズームレベル
  width: number          // 画面幅（px）
  height: number         // 画面高さ（px）
  displayCellSize: number // セル表示サイズ（px）
}
```

### 2. カラースペクトラム

COSMOS(紫) → STANDARD(緑) → QUANTUM(赤)のグラデーション

### 3. パフォーマンス最適化

- カリング: 可視範囲外は描画しない
- スパースレンダリング: 生存セルのみ描画

---

## テスト戦略

### ビジュアルテスト対象

- 各ズームレベルでの色が正しいか
- ビューポート境界での描画が正しいか
- パン移動時の描画が正しいか

### パフォーマンステスト

- 大量のセルでの描画FPS
- メモリ使用量

---

## 課題・メモ

<!-- 実装中に出てきた課題や気づきをここに記録 -->

---

## 次のステップ

Phase 3完了後、Phase 4（インタラクション）に進みます。

[Phase 4の詳細を見る](../phase-4/README.md)

---

最終更新: 2025-11-09

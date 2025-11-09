# Phase 6: UI+状態管理実装

**見積もり時間**: 2-3日
**ステップ数**: 12

---

## 概要

階層的ズームシステム用のUI コンポーネントと状態管理を実装し、既存システムと統合します。

---

## Phase 6.1: Store実装

**ステップ数**: 3

- [ ] [Step 6.1.1: viewportStore実装](./step-6.1.1.md)
- [ ] [Step 6.1.2: hierarchicalGridStore実装](./step-6.1.2.md)
- [ ] [Step 6.1.3: audioStore実装（Phase 5実装時のみ）](./step-6.1.3.md)

**目標**: リアクティブな状態管理システムの構築

---

## Phase 6.2: UIコンポーネント実装

**ステップ数**: 6

- [ ] [Step 6.2.1: ZoomLevelIndicatorコンポーネント](./step-6.2.1.md)
- [ ] [Step 6.2.2: TimeScaleIndicatorコンポーネント](./step-6.2.2.md)
- [ ] [Step 6.2.3: ColorSpectrumBarコンポーネント](./step-6.2.3.md)
- [ ] [Step 6.2.4: ZoomControlsコンポーネント](./step-6.2.4.md)
- [ ] [Step 6.2.5: AudioToggleコンポーネント（Phase 5実装時のみ）](./step-6.2.5.md)
- [ ] [Step 6.2.6: ControlPanel統合](./step-6.2.6.md)

**目標**: 直感的なUIコンポーネント群の実装

---

## Phase 6.3: 既存コンポーネントの統合

**ステップ数**: 2

- [ ] [Step 6.3.1: LifeCanvas更新](./step-6.3.1.md)
- [ ] [Step 6.3.2: App.svelte統合](./step-6.3.2.md)

**目標**: すべてのコンポーネントのシームレスな統合

---

## Phase 6完了: UI統合テスト

**ステップ数**: 1

- [ ] [Phase 6完了: UI統合テスト](./step-6.4.1.md)

**目標**: UIとロジックの連携が正しく機能することを確認

---

## Phase 6完了後: コミット

- [ ] Phase 6のすべての変更をコミット
- [ ] コミットメッセージ: `feat: Phase 6 - UI+状態管理システム実装`

---

## 作成されるファイル一覧

```
src/lib/
  stores/
    viewportStore.ts                             # Step 6.1.1
    hierarchicalGridStore.ts                     # Step 6.1.2
    audioStore.ts                                # Step 6.1.3
  components/
    ZoomLevelIndicator.svelte                    # Step 6.2.1
    TimeScaleIndicator.svelte                    # Step 6.2.2
    ColorSpectrumBar.svelte                      # Step 6.2.3
    ZoomControls.svelte                          # Step 6.2.4
    AudioToggle.svelte                           # Step 6.2.5
    ControlPanel.svelte                          # Step 6.2.6（更新）
    LifeCanvas.svelte                            # Step 6.3.1（更新）
  App.svelte                                     # Step 6.3.2（更新）
```

---

## 重要な設計判断

### 1. Store設計

**viewportStore**:
```typescript
{
  centerX: number
  centerY: number
  zoomLevel: ZoomLevel
  displayCellSize: number
}
```

**hierarchicalGridStore**:
```typescript
{
  multiResolutionGrid: MultiResolutionGrid
  quantumEngine: QuantumLifeEngine
  isPlaying: boolean
}
```

### 2. UIレイアウト

- **左上**: ZoomLevelIndicator + TimeScaleIndicator
- **右上**: ColorSpectrumBar
- **下中央**: ControlPanel（ZoomControls統合）
- **右下**: AudioToggle（オプション）

### 3. レスポンシブ対応

- モバイル: コンパクト表示
- タブレット: 中間サイズ
- デスクトップ: フル表示

---

## テスト戦略

### コンポーネントテスト

- 各コンポーネントの単体テスト
- Props/イベントの動作確認

### 統合テスト

- Store変更時のUI更新
- UI操作時のStore更新
- すべてのコンポーネント連携

---

## 課題・メモ

<!-- 実装中に出てきた課題や気づきをここに記録 -->

---

## 次のステップ

Phase 6完了後、Phase 7（最適化+テスト）に進みます。

[Phase 7の詳細を見る](../phase-7/README.md)

---

最終更新: 2025-11-09

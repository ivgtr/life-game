# Phase 1 全ステップガイド

このファイルはPhase 1の全23ステップの概要と実装ガイドです。

---

## Phase 1.1: ズームレベルの基礎定義（3ステップ）

### ✅ Step 1.1.1: ZoomLevel enum定義とチャンクサイズ計算関数

**詳細**: [step-1.1.1.md](./step-1.1.1.md)

**ファイル**: `src/lib/types/zoom.ts`

**内容**:
- ZoomLevel enum（14段階）
- FIBONACCI配列
- getChunkSize関数

---

### ✅ Step 1.1.2: 時間スケール計算関数の実装

**詳細**: [step-1.1.2.md](./step-1.1.2.md)

**ファイル**: `src/lib/features/zoom/timeScale.ts`

**内容**:
- getTimeScale関数
- shouldUpdateThisFrame関数
- getUpdateInterval関数

---

### ✅ Step 1.1.3: レベル名とメタデータの定義

**詳細**: [step-1.1.3.md](./step-1.1.3.md)

**ファイル**: `src/lib/features/zoom/constants.ts`

**内容**:
- ZoomLevelMetadata インターフェース
- ZOOM_LEVEL_METADATA定数
- getZoomLevelMetadata関数
- ALL_ZOOM_LEVELS配列

---

## Phase 1.2: 集約戦略の実装（4ステップ）

### Step 1.2.1: AggregationStrategy インターフェース定義

**見積もり**: 15分

**ファイル**: `src/lib/features/zoom/aggregation/AggregationStrategy.ts`

**実装内容**:
```typescript
import type { CellState } from '$lib/types/lifegame'

export interface AggregationStrategy {
  aggregate(cells: CellState[][], position: string): CellState
}
```

**チェックポイント**:
- [ ] インターフェースファイル作成
- [ ] JSDocコメント記載
- [ ] TypeScript型エラーなし

---

### Step 1.2.2: EntropyAggregation実装（密度計算）

**見積もり**: 45分

**ファイル**: `src/lib/features/zoom/aggregation/EntropyAggregation.ts`

**実装内容**:
- EntropyAggregationクラス
- history: Map<string, CellState[]>プロパティ
- aggregate()メソッド
- calculateDensity()メソッド（プライベート）
- calculateEntropy()メソッド（基本実装）

**ポイント**:
- 密度 = 生存セル数 / 総セル数
- エントロピー閾値に応じて判定を変える（0.7, 0.3, それ以下）

**チェックポイント**:
- [ ] クラス実装
- [ ] 密度計算が正しい
- [ ] エントロピー計算の基礎実装
- [ ] テストコードで動作確認

---

### Step 1.2.3: EntropyAggregation実装（履歴管理とエントロピー計算）

**見積もり**: 30分

**Note**: Step 1.2.2に統合されているため、個別ステップは不要

---

### Step 1.2.4: EdgeDetectionAggregation実装

**見積もり**: 40分

**ファイル**: `src/lib/features/zoom/aggregation/EdgeDetectionAggregation.ts`

**実装内容**:
- EdgeDetectionAggregationクラス
- aggregate()メソッド
- detectEdges()メソッド
- countNeighborDiff()メソッド
- calculateDensity()メソッド

**ポイント**:
- 8方向の隣接セルとの差異をカウント
- エッジ密度 > 0.3 なら生存として集約

**チェックポイント**:
- [ ] エッジ検出ロジック実装
- [ ] 8方向チェック実装
- [ ] テストで正しく動作

---

## Phase 1.3: 分割戦略の実装（6ステップ）

### Step 1.3.1: simplex-noiseパッケージのインストール

**見積もり**: 5分

**コマンド**:
```bash
npm install simplex-noise
```

**チェックポイント**:
- [ ] package.jsonに追加されている
- [ ] node_modulesにインストールされている

---

### Step 1.3.2: SubdivisionStrategy インターフェース定義

**見積もり**: 15分

**ファイル**: `src/lib/features/zoom/subdivision/SubdivisionStrategy.ts`

**実装内容**:
```typescript
import type { CellState } from '$lib/types/lifegame'

export interface SubdivisionStrategy {
  subdivide(
    state: CellState,
    size: number,
    x: number,
    y: number
  ): CellState[][]
}
```

**チェックポイント**:
- [ ] インターフェース作成
- [ ] グローバル座標(x,y)を受け取る設計
- [ ] JSDocコメント記載

---

### Step 1.3.3: 既知パターンライブラリの定義

**見積もり**: 30分

**ファイル**: `src/lib/features/lifegame/patterns.ts`

**実装内容**:
```typescript
export const LIFE_PATTERNS = {
  glider: [[0,1,0],[0,0,1],[1,1,1]],
  blinker: [[1,1,1]],
  block: [[1,1],[1,1]],
  beacon: [[1,1,0,0],[1,1,0,0],[0,0,1,1],[0,0,1,1]],
  toad: [[0,1,1,1],[1,1,1,0]],
  pulsar: [/* 13x13パターン */],
} as const

export type PatternName = keyof typeof LIFE_PATTERNS
```

**チェックポイント**:
- [ ] 6種類以上のパターン定義
- [ ] 型安全な実装（as const）
- [ ] PatternName型エクスポート

---

### Step 1.3.4: OrganicSubdivision実装（ノイズ生成部分）

**見積もり**: 60分

**ファイル**: `src/lib/features/zoom/subdivision/OrganicSubdivision.ts`

**実装内容**:
- OrganicSubdivisionクラス
- noise2Dジェネレーター（simplex-noise）
- subdivide()メソッド
- generateNoisePattern()メソッド
- multilayerNoise()メソッド（複数オクターブ）

**ポイント**:
- createNoise2D()でノイズ生成器作成
- 複数オクターブ（2-3）で複雑なパターン
- グローバル座標(x,y)を使って一貫したノイズ

**チェックポイント**:
- [ ] simplex-noiseのインポート
- [ ] ノイズ生成が正しく動作
- [ ] オクターブ合成実装
- [ ] 生成されたパターンが自然

---

### Step 1.3.5: OrganicSubdivision実装（フラクタル部分）

**見積もり**: 40分

**実装内容**（Step 1.3.4に追加）:
- generateOrganicPattern()メソッド
- フラクタル成分（中心からの距離）
- ノイズとフラクタルの合成

**ポイント**:
- フラクタル = 1 - (centerDist / radius)
- 合成 = noise * 0.6 + fractal * 0.4

**チェックポイント**:
- [ ] フラクタル計算実装
- [ ] ノイズとの合成実装
- [ ] 中心集中的なパターン生成

---

### Step 1.3.6: PatternLibrarySubdivision実装

**見積もり**: 30分

**ファイル**: `src/lib/features/zoom/subdivision/PatternLibrarySubdivision.ts`

**実装内容**:
- PatternLibrarySubdivisionクラス
- subdivide()メソッド
- placePattern()メソッド（中央配置）
- ランダムパターン選択

**チェックポイント**:
- [ ] パターンライブラリのインポート
- [ ] ランダム選択実装
- [ ] 中央配置ロジック実装

---

## Phase 1.4: MultiResolutionGrid実装（5ステップ）

### Step 1.4.1: MultiResolutionGrid基本構造とコンストラクタ

**見積もり**: 30分

**ファイル**: `src/lib/features/zoom/MultiResolutionGrid.ts`

**実装内容**:
```typescript
import { ZoomLevel, getChunkSize } from '$lib/types/zoom'
import type { CellState } from '$lib/types/lifegame'
import type { AggregationStrategy } from './aggregation/AggregationStrategy'
import type { SubdivisionStrategy } from './subdivision/SubdivisionStrategy'
import { EntropyAggregation } from './aggregation/EntropyAggregation'
import { OrganicSubdivision } from './subdivision/OrganicSubdivision'

export class MultiResolutionGrid {
  private grids: Map<ZoomLevel, Map<string, CellState>>
  private currentLevel: ZoomLevel
  private aggregation: AggregationStrategy
  private subdivision: SubdivisionStrategy

  constructor(
    initialLevel: ZoomLevel = ZoomLevel.STANDARD,
    aggregation?: AggregationStrategy,
    subdivision?: SubdivisionStrategy
  ) {
    this.grids = new Map()
    this.currentLevel = initialLevel
    this.aggregation = aggregation ?? new EntropyAggregation()
    this.subdivision = subdivision ?? new OrganicSubdivision()
    this.grids.set(initialLevel, new Map())
  }

  getCurrentLevel(): ZoomLevel {
    return this.currentLevel
  }

  getCurrentGrid(): Map<string, CellState> {
    if (!this.grids.has(this.currentLevel)) {
      this.grids.set(this.currentLevel, new Map())
    }
    return this.grids.get(this.currentLevel)!
  }

  setCurrentGrid(grid: Map<string, CellState>): void {
    this.grids.set(this.currentLevel, grid)
  }
}
```

**チェックポイント**:
- [ ] クラス定義
- [ ] プロパティ定義
- [ ] コンストラクタ実装
- [ ] 基本メソッド実装

---

### Step 1.4.2: setZoomLevel メソッド実装

**見積もり**: 45分

**実装内容**（MultiResolutionGrid.tsに追加）:
```typescript
setZoomLevel(newLevel: ZoomLevel): void {
  if (newLevel === this.currentLevel) return

  const levelDiff = newLevel - this.currentLevel

  if (levelDiff > 0) {
    this.subdivideToLevel(this.currentLevel, newLevel)
  } else {
    this.aggregateToLevel(this.currentLevel, newLevel)
  }

  this.currentLevel = newLevel
}

private aggregateToLevel(fromLevel: ZoomLevel, toLevel: ZoomLevel): void {
  let currentLevel = fromLevel

  while (currentLevel > toLevel) {
    const sourceGrid = this.grids.get(currentLevel)
    if (!sourceGrid) break

    const targetLevel = currentLevel - 1
    const chunkSize = getChunkSize(currentLevel)

    const aggregatedGrid = this.aggregateGrid(sourceGrid, chunkSize)
    this.grids.set(targetLevel, aggregatedGrid)

    currentLevel = targetLevel
  }
}

private subdivideToLevel(fromLevel: ZoomLevel, toLevel: ZoomLevel): void {
  let currentLevel = fromLevel

  while (currentLevel < toLevel) {
    const sourceGrid = this.grids.get(currentLevel)
    if (!sourceGrid) break

    const targetLevel = currentLevel + 1
    const subdivisionSize = getChunkSize(targetLevel)

    const subdividedGrid = this.subdivideGrid(sourceGrid, subdivisionSize)
    this.grids.set(targetLevel, subdividedGrid)

    currentLevel = targetLevel
  }
}
```

**チェックポイント**:
- [ ] setZoomLevel実装
- [ ] aggregateToLevel実装
- [ ] subdivideToLevel実装
- [ ] 段階的な変換が動作

---

### Step 1.4.3: aggregateGrid メソッド実装

**見積もり**: 45分

**実装内容**（MultiResolutionGrid.tsに追加）:
```typescript
private aggregateGrid(
  sourceGrid: Map<string, CellState>,
  chunkSize: number
): Map<string, CellState> {
  const aggregated = new Map<string, CellState>()
  const processedChunks = new Set<string>()

  for (const [key] of sourceGrid) {
    const [x, y] = key.split(',').map(Number)
    const chunkX = Math.floor(x / chunkSize)
    const chunkY = Math.floor(y / chunkSize)
    const chunkKey = `${chunkX},${chunkY}`

    if (processedChunks.has(chunkKey)) continue
    processedChunks.add(chunkKey)

    // チャンク内のセルを収集
    const cells: CellState[][] = []
    for (let dy = 0; dy < chunkSize; dy++) {
      const row: CellState[] = []
      for (let dx = 0; dx < chunkSize; dx++) {
        const cellX = chunkX * chunkSize + dx
        const cellY = chunkY * chunkSize + dy
        const cellKey = `${cellX},${cellY}`
        row.push(sourceGrid.get(cellKey) ?? 0)
      }
      cells.push(row)
    }

    // 集約戦略を適用
    const aggregatedState = this.aggregation.aggregate(cells, chunkKey)
    if (aggregatedState === 1) {
      aggregated.set(chunkKey, aggregatedState)
    }
  }

  return aggregated
}
```

**チェックポイント**:
- [ ] チャンク収集ロジック
- [ ] 集約戦略の適用
- [ ] スパースマップ維持

---

### Step 1.4.4: subdivideGrid メソッド実装

**見積もり**: 40分

**実装内容**（MultiResolutionGrid.tsに追加）:
```typescript
private subdivideGrid(
  sourceGrid: Map<string, CellState>,
  subdivisionSize: number
): Map<string, CellState> {
  const subdivided = new Map<string, CellState>()

  for (const [key, state] of sourceGrid) {
    const [chunkX, chunkY] = key.split(',').map(Number)

    // チャンクを細かいセルに分割
    const cells = this.subdivision.subdivide(state, subdivisionSize, chunkX, chunkY)

    for (let dy = 0; dy < subdivisionSize; dy++) {
      for (let dx = 0; dx < subdivisionSize; dx++) {
        const cellX = chunkX * subdivisionSize + dx
        const cellY = chunkY * subdivisionSize + dy
        const cellState = cells[dy]?.[dx]

        if (cellState === 1) {
          subdivided.set(`${cellX},${cellY}`, cellState)
        }
      }
    }
  }

  return subdivided
}
```

**チェックポイント**:
- [ ] 分割戦略の適用
- [ ] セル配列→スパースマップ変換
- [ ] 正しく分割される

---

### Step 1.4.5: getCurrentGrid と補助メソッド実装

**Note**: Step 1.4.1に含まれているため個別実装不要

---

## Phase 1完了: 基本動作テスト

### Step 1.5.1: Phase 1完了テスト

**見積もり**: 60分

**ファイル**: `src/lib/features/zoom/__tests__/MultiResolutionGrid.test.ts`

**テスト内容**:
```typescript
import { describe, it, expect } from 'vitest'
import { MultiResolutionGrid } from '../MultiResolutionGrid'
import { ZoomLevel } from '$lib/types/zoom'

describe('MultiResolutionGrid', () => {
  it('初期化できる', () => {
    const grid = new MultiResolutionGrid()
    expect(grid.getCurrentLevel()).toBe(ZoomLevel.STANDARD)
  })

  it('グリッドにセルを追加できる', () => {
    const grid = new MultiResolutionGrid()
    const currentGrid = grid.getCurrentGrid()

    currentGrid.set('0,0', 1)
    currentGrid.set('1,0', 1)
    currentGrid.set('0,1', 1)

    expect(currentGrid.size).toBe(3)
  })

  it('ズームアウト（集約）ができる', () => {
    const grid = new MultiResolutionGrid(ZoomLevel.STANDARD)
    const currentGrid = grid.getCurrentGrid()

    // 3x3のブロック
    for (let y = 0; y < 3; y++) {
      for (let x = 0; x < 3; x++) {
        currentGrid.set(`${x},${y}`, 1)
      }
    }

    grid.setZoomLevel(ZoomLevel.STREET)
    expect(grid.getCurrentLevel()).toBe(ZoomLevel.STREET)
    expect(grid.getCurrentGrid().size).toBeGreaterThan(0)
  })

  it('ズームイン（分割）ができる', () => {
    const grid = new MultiResolutionGrid(ZoomLevel.STANDARD)
    const currentGrid = grid.getCurrentGrid()

    currentGrid.set('0,0', 1)

    grid.setZoomLevel(ZoomLevel.CELL)
    expect(grid.getCurrentLevel()).toBe(ZoomLevel.CELL)
    expect(grid.getCurrentGrid().size).toBeGreaterThan(1)
  })

  it('複数レベルの変換ができる', () => {
    const grid = new MultiResolutionGrid(ZoomLevel.STANDARD)
    const currentGrid = grid.getCurrentGrid()

    currentGrid.set('0,0', 1)

    // STANDARD → CITY → COUNTRY
    grid.setZoomLevel(ZoomLevel.CITY)
    expect(grid.getCurrentLevel()).toBe(ZoomLevel.CITY)

    grid.setZoomLevel(ZoomLevel.COUNTRY)
    expect(grid.getCurrentLevel()).toBe(ZoomLevel.COUNTRY)
  })
})
```

**実行**:
```bash
npm run test
```

**チェックポイント**:
- [ ] すべてのテストがパス
- [ ] 集約・分割が正しく動作
- [ ] メモリリークなし

---

## Phase 1完了後のアクション

- [ ] すべてのステップのチェックボックスを確認
- [ ] TypeScriptのビルドエラーがないことを確認
- [ ] テストがすべてパスすることを確認
- [ ] コミット: `feat: Phase 1 - 階層的ズームシステムのコアシステム実装`

---

## 次のPhase

[Phase 2: 量子的シミュレーション](../phase-2/README.md)

---

最終更新: 2025-11-09

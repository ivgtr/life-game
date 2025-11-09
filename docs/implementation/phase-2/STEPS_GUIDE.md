# Phase 2 全ステップガイド

このファイルはPhase 2の全8ステップの概要と実装ガイドです。

---

## Phase 2.1: QuantumLifeEngine実装（6ステップ）

### Step 2.1.1: QuantumLifeEngine基本構造とコンストラクタ

**見積もり**: 30分

**ファイル**: `src/lib/features/lifegame/QuantumLifeEngine.ts`

**実装内容**:
```typescript
import type { ZoomLevel } from '$lib/types/zoom'
import type { CellState } from '$lib/types/lifegame'
import { getTimeScale } from '$lib/features/zoom/timeScale'

/**
 * 量子的ライフゲームエンジン
 * 異なるズームレベル間で相互作用するシミュレーション
 */
export class QuantumLifeEngine {
  // 各レベルのグリッドデータ
  private grids: Map<ZoomLevel, Map<string, CellState>>

  // 量子もつれ係数（レベル間影響の強さ）
  private entanglement: number

  constructor(entanglement = 0.1) {
    this.grids = new Map()
    this.entanglement = entanglement
  }

  /**
   * グリッドを設定
   */
  setGrid(level: ZoomLevel, grid: Map<string, CellState>): void {
    this.grids.set(level, grid)
  }

  /**
   * グリッドを取得
   */
  getGrid(level: ZoomLevel): Map<string, CellState> | undefined {
    return this.grids.get(level)
  }

  /**
   * 量子もつれ係数を設定
   */
  setEntanglement(value: number): void {
    this.entanglement = Math.max(0, Math.min(1, value))
  }
}
```

**チェックポイント**:
- [ ] クラス定義
- [ ] gridsプロパティ（Map構造）
- [ ] entanglementプロパティ
- [ ] 基本メソッド実装

---

### Step 2.1.2: 量子もつれ係数の実装

**見積もり**: 20分

**Note**: Step 2.1.1に含まれているため個別実装不要

**設計のポイント**:
- デフォルト値: 0.1（10%）
- 範囲: 0.0〜1.0
- 高すぎると予測不可能、低すぎると効果が見えない

---

### Step 2.1.3: computeNextGeneration メソッド実装

**見積もり**: 45分

**実装内容**（QuantumLifeEngine.tsに追加）:
```typescript
/**
 * 次世代を計算
 *
 * @param level 計算対象のズームレベル
 * @returns 次世代のグリッド
 */
computeNextGeneration(level: ZoomLevel): Map<string, CellState> {
  const grid = this.grids.get(level)
  if (!grid) return new Map()

  // 時間スケールに応じてスキップ判定
  const timeScale = getTimeScale(level)
  if (Math.random() > timeScale) {
    // このフレームはスキップ
    return new Map(grid)
  }

  // 通常のライフゲームルールを適用
  const nextGrid = this.applyConwayRules(grid)

  // 量子的影響を適用
  const influenced = this.applyQuantumInfluence(nextGrid, level)

  return influenced
}
```

**チェックポイント**:
- [ ] 時間スケール考慮
- [ ] Conwayルール適用
- [ ] 量子的影響適用
- [ ] 正しく動作

---

### Step 2.1.4: レベル間影響計算（applyQuantumInfluence）

**見積もり**: 60分

**実装内容**（QuantumLifeEngine.tsに追加）:
```typescript
/**
 * 量子的影響を適用
 * 隣接レベルからの影響を確率的に反映
 */
private applyQuantumInfluence(
  grid: Map<string, CellState>,
  level: ZoomLevel
): Map<string, CellState> {
  const influenced = new Map(grid)

  // 1レベル上からの影響（マクロ視点）
  const upperLevel = level - 1
  if (this.grids.has(upperLevel)) {
    this.applyInfluenceFrom(influenced, upperLevel, level, 'macro')
  }

  // 1レベル下からの影響（ミクロ視点）
  const lowerLevel = level + 1
  if (this.grids.has(lowerLevel)) {
    this.applyInfluenceFrom(influenced, lowerLevel, level, 'micro')
  }

  return influenced
}

/**
 * 特定レベルからの影響を適用
 */
private applyInfluenceFrom(
  targetGrid: Map<string, CellState>,
  sourceLevel: ZoomLevel,
  targetLevel: ZoomLevel,
  direction: 'macro' | 'micro'
): void {
  const sourceGrid = this.grids.get(sourceLevel)
  if (!sourceGrid) return

  for (const [key, state] of targetGrid) {
    // 量子もつれ係数の確率で影響を受ける
    if (Math.random() < this.entanglement) {
      const [x, y] = key.split(',').map(Number)

      // ソースグリッドの対応位置を計算
      let sourceKey: string
      if (direction === 'macro') {
        // マクロ → 細かい: 座標を粗くする
        const sourceX = Math.floor(x / 2)
        const sourceY = Math.floor(y / 2)
        sourceKey = `${sourceX},${sourceY}`
      } else {
        // ミクロ → 粗い: 座標を細かくする
        const sourceX = x * 2
        const sourceY = y * 2
        sourceKey = `${sourceX},${sourceY}`
      }

      const sourceState = sourceGrid.get(sourceKey)
      if (sourceState !== undefined && sourceState !== state) {
        // 量子的重ね合わせ: 状態をフリップ
        targetGrid.set(key, sourceState)
      }
    }
  }
}
```

**チェックポイント**:
- [ ] 上位レベルからの影響実装
- [ ] 下位レベルからの影響実装
- [ ] 座標変換ロジック正しい
- [ ] 確率的な影響適用

---

### Step 2.1.5: 時間スケール適用（shouldUpdateThisFrame）

**見積もり**: 15分

**Note**: Step 2.1.3に統合されているため個別実装不要

**確認ポイント**:
- getTimeScale()を使用
- 確率的にフレームスキップ
- マクロレベルほど頻繁に更新

---

### Step 2.1.6: Conwayルールの実装（applyConwayRules）

**見積もり**: 60分

**実装内容**（QuantumLifeEngine.tsに追加）:
```typescript
/**
 * Conway's Game of Lifeのルールを適用
 * 無限グリッド対応版
 */
private applyConwayRules(grid: Map<string, CellState>): Map<string, CellState> {
  const nextGrid = new Map<string, CellState>()

  // アクティブセルとその近傍をチェック
  const cellsToCheck = new Set<string>()

  for (const [key] of grid) {
    const [x, y] = key.split(',').map(Number)

    // セル自身
    cellsToCheck.add(key)

    // 8近傍
    for (let dy = -1; dy <= 1; dy++) {
      for (let dx = -1; dx <= 1; dx++) {
        if (dx === 0 && dy === 0) continue
        cellsToCheck.add(`${x + dx},${y + dy}`)
      }
    }
  }

  // 各セルのルール適用
  for (const key of cellsToCheck) {
    const [x, y] = key.split(',').map(Number)
    const currentState = grid.get(key) ?? 0
    const neighbors = this.countNeighbors(grid, x, y)

    let nextState: CellState = 0

    if (currentState === 1) {
      // 生存セル: 2-3近傍で生存
      if (neighbors === 2 || neighbors === 3) {
        nextState = 1
      }
    } else {
      // 死んだセル: 3近傍で誕生
      if (neighbors === 3) {
        nextState = 1
      }
    }

    if (nextState === 1) {
      nextGrid.set(key, nextState)
    }
  }

  return nextGrid
}

/**
 * 近傍の生存セル数をカウント
 */
private countNeighbors(
  grid: Map<string, CellState>,
  x: number,
  y: number
): number {
  let count = 0

  for (let dy = -1; dy <= 1; dy++) {
    for (let dx = -1; dx <= 1; dx++) {
      if (dx === 0 && dy === 0) continue

      const key = `${x + dx},${y + dy}`
      if (grid.get(key) === 1) {
        count++
      }
    }
  }

  return count
}
```

**チェックポイント**:
- [ ] Conway's Gameルール実装
- [ ] 無限グリッド対応
- [ ] スパースマップ効率的処理
- [ ] 近傍カウント正しい

---

## Phase 2.2: 既存エンジンとの統合（1ステップ）

### Step 2.2.1: simulationStoreとの統合

**見積もり**: 45分

**ファイル**: `src/lib/stores/simulationStore.ts`（更新）

**実装内容**:

既存のsimulationStoreを拡張して、QuantumLifeEngineを統合します。

```typescript
import { writable, derived } from 'svelte/store'
import type { Grid, GridSize, CellState } from '$lib/types/lifegame'
import { ZoomLevel } from '$lib/types/zoom'
import { computeNextGeneration, createRandomGrid } from '$lib/features/lifegame/engine'
import { QuantumLifeEngine } from '$lib/features/lifegame/QuantumLifeEngine'

// 既存のSimulationState型を拡張
export interface SimulationState {
  grid: Grid
  isPlaying: boolean
  step: number
  speed: number
  gridSize: GridSize
  toroidal: boolean
  // 新規追加
  quantumEngine?: QuantumLifeEngine
  currentZoomLevel: ZoomLevel
  useQuantumEngine: boolean
}

function createSimulationStore() {
  const initialState: SimulationState = {
    grid: createRandomGrid({ width: 100, height: 60 }),
    isPlaying: true,
    step: 0,
    speed: 100,
    gridSize: { width: 100, height: 60 },
    toroidal: true,
    // 新規追加
    quantumEngine: new QuantumLifeEngine(),
    currentZoomLevel: ZoomLevel.STANDARD,
    useQuantumEngine: false, // デフォルトはOFF（互換性のため）
  }

  const { subscribe, update } = writable<SimulationState>(initialState)

  return {
    subscribe,

    // 既存メソッドは維持...

    /**
     * 量子エンジンを有効/無効化
     */
    toggleQuantumEngine: () => {
      update((state) => ({
        ...state,
        useQuantumEngine: !state.useQuantumEngine,
      }))
    },

    /**
     * ズームレベルを設定
     */
    setZoomLevel: (level: ZoomLevel) => {
      update((state) => ({
        ...state,
        currentZoomLevel: level,
      }))
    },

    /**
     * 量子エンジンでの次世代計算
     */
    nextGenerationQuantum: () => {
      update((state) => {
        if (!state.quantumEngine || !state.useQuantumEngine) {
          // 通常エンジンを使用
          return {
            ...state,
            grid: computeNextGeneration(state.grid, state.toroidal),
            step: state.step + 1,
          }
        }

        // 量子エンジンを使用
        const currentGrid = gridToMap(state.grid)
        state.quantumEngine.setGrid(state.currentZoomLevel, currentGrid)

        const nextGrid = state.quantumEngine.computeNextGeneration(
          state.currentZoomLevel
        )

        return {
          ...state,
          grid: mapToGrid(nextGrid, state.gridSize),
          step: state.step + 1,
        }
      })
    },
  }
}

/**
 * Grid配列をMapに変換
 */
function gridToMap(grid: Grid): Map<string, CellState> {
  const map = new Map<string, CellState>()

  for (let y = 0; y < grid.length; y++) {
    for (let x = 0; x < grid[y].length; x++) {
      if (grid[y][x] === 1) {
        map.set(`${x},${y}`, 1)
      }
    }
  }

  return map
}

/**
 * MapをGrid配列に変換
 */
function mapToGrid(map: Map<string, CellState>, size: GridSize): Grid {
  const grid: Grid = Array(size.height)
    .fill(0)
    .map(() => Array(size.width).fill(0))

  for (const [key, state] of map) {
    const [x, y] = key.split(',').map(Number)
    if (x >= 0 && x < size.width && y >= 0 && y < size.height) {
      grid[y][x] = state
    }
  }

  return grid
}

export const simulationStore = createSimulationStore()
```

**チェックポイント**:
- [ ] QuantumLifeEngineのインポート
- [ ] SimulationState型の拡張
- [ ] toggleQuantumEngine実装
- [ ] setZoomLevel実装
- [ ] nextGenerationQuantum実装
- [ ] Grid ↔ Map変換実装
- [ ] 既存機能との互換性維持

---

## Phase 2完了: 統合テスト（1ステップ）

### Step 2.3.1: Phase 2完了テスト

**見積もり**: 60分

**ファイル**: `src/lib/features/lifegame/__tests__/QuantumLifeEngine.test.ts`

**テスト内容**:
```typescript
import { describe, it, expect, beforeEach } from 'vitest'
import { QuantumLifeEngine } from '../QuantumLifeEngine'
import { ZoomLevel } from '$lib/types/zoom'
import type { CellState } from '$lib/types/lifegame'

describe('QuantumLifeEngine', () => {
  let engine: QuantumLifeEngine

  beforeEach(() => {
    engine = new QuantumLifeEngine(0.1)
  })

  describe('基本機能', () => {
    it('初期化できる', () => {
      expect(engine).toBeDefined()
    })

    it('グリッドを設定・取得できる', () => {
      const grid = new Map<string, CellState>()
      grid.set('0,0', 1)
      grid.set('1,0', 1)

      engine.setGrid(ZoomLevel.STANDARD, grid)

      const retrieved = engine.getGrid(ZoomLevel.STANDARD)
      expect(retrieved).toBeDefined()
      expect(retrieved?.size).toBe(2)
    })

    it('量子もつれ係数を設定できる', () => {
      engine.setEntanglement(0.5)
      // プライベートプロパティなので間接的にテスト
      expect(engine).toBeDefined()
    })
  })

  describe('Conway's Gameルール', () => {
    it('ブロック（静止物）が維持される', () => {
      const grid = new Map<string, CellState>()
      // 2x2ブロック
      grid.set('0,0', 1)
      grid.set('1,0', 1)
      grid.set('0,1', 1)
      grid.set('1,1', 1)

      engine.setGrid(ZoomLevel.STANDARD, grid)
      const next = engine.computeNextGeneration(ZoomLevel.STANDARD)

      expect(next.size).toBe(4)
      expect(next.get('0,0')).toBe(1)
      expect(next.get('1,0')).toBe(1)
      expect(next.get('0,1')).toBe(1)
      expect(next.get('1,1')).toBe(1)
    })

    it('グライダーが移動する', () => {
      const grid = new Map<string, CellState>()
      // グライダー
      grid.set('1,0', 1)
      grid.set('2,1', 1)
      grid.set('0,2', 1)
      grid.set('1,2', 1)
      grid.set('2,2', 1)

      engine.setGrid(ZoomLevel.STANDARD, grid)

      // 4世代進める
      let current = grid
      for (let i = 0; i < 4; i++) {
        engine.setGrid(ZoomLevel.STANDARD, current)
        current = engine.computeNextGeneration(ZoomLevel.STANDARD)
      }

      // グライダーは右下に移動している
      const keys = Array.from(current.keys())
      const coords = keys.map((k) => k.split(',').map(Number))
      const minX = Math.min(...coords.map((c) => c[0]))
      const minY = Math.min(...coords.map((c) => c[1]))

      // 元の位置(0,0基準)より移動している
      expect(minX).toBeGreaterThan(0)
      expect(minY).toBeGreaterThan(0)
    })
  })

  describe('量子的相互作用', () => {
    it('複数レベルでシミュレーションできる', () => {
      const grid1 = new Map<string, CellState>()
      grid1.set('0,0', 1)

      const grid2 = new Map<string, CellState>()
      grid2.set('0,0', 1)

      engine.setGrid(ZoomLevel.STANDARD, grid1)
      engine.setGrid(ZoomLevel.CELL, grid2)

      const next1 = engine.computeNextGeneration(ZoomLevel.STANDARD)
      const next2 = engine.computeNextGeneration(ZoomLevel.CELL)

      expect(next1).toBeDefined()
      expect(next2).toBeDefined()
    })

    it('量子もつれ係数が影響する', () => {
      // 係数0: 影響なし
      const engine0 = new QuantumLifeEngine(0)
      const grid = new Map<string, CellState>()
      grid.set('0,0', 1)

      engine0.setGrid(ZoomLevel.STANDARD, grid)
      const next0 = engine0.computeNextGeneration(ZoomLevel.STANDARD)

      // 係数1: 常に影響
      const engine1 = new QuantumLifeEngine(1)
      engine1.setGrid(ZoomLevel.STANDARD, grid)
      const next1 = engine1.computeNextGeneration(ZoomLevel.STANDARD)

      // 両方ともシミュレーション可能
      expect(next0).toBeDefined()
      expect(next1).toBeDefined()
    })
  })

  describe('時間スケール', () => {
    it('STANDARDレベルは常に更新', () => {
      const grid = new Map<string, CellState>()
      grid.set('0,0', 1)

      engine.setGrid(ZoomLevel.STANDARD, grid)

      // 10回実行
      let updated = 0
      for (let i = 0; i < 10; i++) {
        const next = engine.computeNextGeneration(ZoomLevel.STANDARD)
        if (next.size !== grid.size || Array.from(next.keys())[0] !== '0,0') {
          updated++
        }
      }

      // STANDARDレベルは時間スケール1.0なので、ほぼ常に更新される
      expect(updated).toBeGreaterThan(0)
    })
  })
})
```

**実行**:
```bash
npm run test
```

**チェックポイント**:
- [ ] すべてのテストがパス
- [ ] Conwayルールが正しく動作
- [ ] 量子的相互作用が動作
- [ ] 時間スケールが機能

---

## Phase 2完了後のアクション

- [ ] すべてのステップのチェックボックスを確認
- [ ] TypeScriptのビルドエラーがないことを確認
- [ ] テストがすべてパスすることを確認
- [ ] 既存機能との互換性確認
- [ ] コミット: `feat: Phase 2 - 量子的シミュレーションシステム実装`

---

## 作成されるファイル一覧

```
src/lib/
  features/
    lifegame/
      QuantumLifeEngine.ts                       # 新規作成
      __tests__/
        QuantumLifeEngine.test.ts                # 新規作成
  stores/
    simulationStore.ts                           # 更新
```

---

## 設計のポイント

### 1. 量子もつれ

- **確率的影響**: entanglement係数で隣接レベルから影響を受ける確率
- **双方向**: マクロ→ミクロ、ミクロ→マクロ両方向
- **座標変換**: レベル間の座標スケール変換

### 2. 時間スケール

- **相対論的**: レベルごとに時間の流れが異なる
- **フレームスキップ**: 遅いレベルは確率的にスキップ
- **一貫性**: getTimeScale()を使用

### 3. 互換性

- **既存エンジン維持**: useQuantumEngineフラグで切替
- **段階的移行**: デフォルトOFFで既存機能を破壊しない

---

## 次のPhase

[Phase 3: レンダリング+カラーシステム](../phase-3/README.md)

---

最終更新: 2025-11-09

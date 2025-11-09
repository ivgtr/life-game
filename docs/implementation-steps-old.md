# 階層的ズームシステム実装手順書

## Phase 1: コアシステム実装

### Phase 1.1: ズームレベルの基礎定義

#### Step 1.1.1: ZoomLevel enum定義とチャンクサイズ計算関数

**ファイル**: `src/lib/types/zoom.ts`

```typescript
/**
 * ズームレベル定義
 * -5 (COSMOS) から 8 (QUANTUM) まで14段階
 */
export enum ZoomLevel {
  COSMOS = -5,      // 宇宙規模
  GALAXY = -4,      // 銀河規模
  SOLAR = -3,       // 太陽系規模
  PLANET = -2,      // 惑星規模
  CONTINENT = -1,   // 大陸規模
  COUNTRY = 0,      // 国家規模
  CITY = 1,         // 都市規模
  STREET = 2,       // 街路規模
  STANDARD = 3,     // 標準（人間スケール）
  CELL = 4,         // 細胞規模
  ORGANELLE = 5,    // 細胞小器官規模
  MOLECULE = 6,     // 分子規模
  ATOM = 7,         // 原子規模
  QUANTUM = 8,      // 量子規模
}

/**
 * フィボナッチ数列
 */
const FIBONACCI = [1, 1, 2, 3, 5, 8, 13, 21, 34, 55, 89, 144, 233, 377]

/**
 * ズームレベルに対応するチャンクサイズを取得
 * フィボナッチ数列ベース
 */
export function getChunkSize(level: ZoomLevel): number {
  const index = Math.abs(level - ZoomLevel.STANDARD)
  return FIBONACCI[Math.min(index, FIBONACCI.length - 1)]
}
```

**実装内容**:
- 14段階のZoomLevel enumを定義
- フィボナッチ数列配列を定義
- getChunkSize関数を実装

**テスト**:
```typescript
console.log(getChunkSize(ZoomLevel.STANDARD)) // 1
console.log(getChunkSize(ZoomLevel.COSMOS))   // 89
console.log(getChunkSize(ZoomLevel.QUANTUM))  // 55
```

---

#### Step 1.1.2: 時間スケール計算関数の実装

**ファイル**: `src/lib/features/zoom/timeScale.ts`

```typescript
import { ZoomLevel } from '$lib/types/zoom'

/**
 * ズームレベルに応じた時間スケールを取得
 * マクロほど速く、ミクロほど遅く
 *
 * @param level ズームレベル
 * @returns 時間スケール倍率（1.0が標準速度）
 */
export function getTimeScale(level: ZoomLevel): number {
  const normalizedLevel = level - ZoomLevel.STANDARD
  return Math.pow(2, -normalizedLevel * 0.5)
}

/**
 * 時間スケールに基づいて更新するかどうかを判定
 *
 * @param level ズームレベル
 * @returns このフレームで更新するべきならtrue
 */
export function shouldUpdateThisFrame(level: ZoomLevel): boolean {
  const timeScale = getTimeScale(level)
  return Math.random() < timeScale
}
```

**実装内容**:
- 相対論的時間スケール計算
- フレームスキップ判定関数

**テスト**:
```typescript
console.log(getTimeScale(ZoomLevel.COSMOS))   // ~8.0 (8倍速)
console.log(getTimeScale(ZoomLevel.STANDARD)) // 1.0 (標準)
console.log(getTimeScale(ZoomLevel.QUANTUM))  // ~0.0625 (1/16倍速)
```

---

#### Step 1.1.3: レベル名とメタデータの定義

**ファイル**: `src/lib/features/zoom/constants.ts`

```typescript
import { ZoomLevel } from '$lib/types/zoom'

/**
 * ズームレベルのメタデータ
 */
export interface ZoomLevelMetadata {
  name: string
  description: string
  color: number  // 基準色（Hex）
  icon?: string  // アイコン（オプション）
}

/**
 * ズームレベル別メタデータ
 */
export const ZOOM_LEVEL_METADATA: Record<ZoomLevel, ZoomLevelMetadata> = {
  [ZoomLevel.COSMOS]: {
    name: 'COSMOS',
    description: '宇宙の果てまで',
    color: 0x9D4EDD,  // 紫
  },
  [ZoomLevel.GALAXY]: {
    name: 'GALAXY',
    description: '銀河の渦',
    color: 0x7B2CBF,  // 青紫
  },
  [ZoomLevel.SOLAR]: {
    name: 'SOLAR',
    description: '太陽系の軌道',
    color: 0x5A67D8,  // 青
  },
  [ZoomLevel.PLANET]: {
    name: 'PLANET',
    description: '惑星の表面',
    color: 0x3B82F6,  // シアン
  },
  [ZoomLevel.CONTINENT]: {
    name: 'CONTINENT',
    description: '大陸の形',
    color: 0x10B981,  // 青緑
  },
  [ZoomLevel.COUNTRY]: {
    name: 'COUNTRY',
    description: '国の境界',
    color: 0x22C55E,  // 緑
  },
  [ZoomLevel.CITY]: {
    name: 'CITY',
    description: '都市の鼓動',
    color: 0x84CC16,  // 黄緑
  },
  [ZoomLevel.STREET]: {
    name: 'STREET',
    description: '街路の賑わい',
    color: 0xEAB308,  // 黄
  },
  [ZoomLevel.STANDARD]: {
    name: 'STANDARD',
    description: '人間のスケール',
    color: 0xF59E0B,  // オレンジ
  },
  [ZoomLevel.CELL]: {
    name: 'CELL',
    description: '生命の単位',
    color: 0xF97316,  // 赤オレンジ
  },
  [ZoomLevel.ORGANELLE]: {
    name: 'ORGANELLE',
    description: '細胞の内部',
    color: 0xEF4444,  // 赤
  },
  [ZoomLevel.MOLECULE]: {
    name: 'MOLECULE',
    description: '分子の結合',
    color: 0xEC4899,  // 赤紫
  },
  [ZoomLevel.ATOM]: {
    name: 'ATOM',
    description: '原子の軌道',
    color: 0xD946EF,  // マゼンタ
  },
  [ZoomLevel.QUANTUM]: {
    name: 'QUANTUM',
    description: '量子の揺らぎ',
    color: 0xC026D3,  // 紫ピンク
  },
}

/**
 * ズームレベルのメタデータを取得
 */
export function getZoomLevelMetadata(level: ZoomLevel): ZoomLevelMetadata {
  return ZOOM_LEVEL_METADATA[level]
}
```

**実装内容**:
- 各レベルの名前、説明、基準色を定義
- メタデータ取得関数

---

### Phase 1.2: 集約戦略の実装

#### Step 1.2.1: AggregationStrategy インターフェース定義

**ファイル**: `src/lib/features/zoom/aggregation/AggregationStrategy.ts`

```typescript
import type { CellState } from '$lib/types/lifegame'

/**
 * チャンク集約戦略インターフェース
 * 複数のセルを1つのチャンクに集約する際のロジックを定義
 */
export interface AggregationStrategy {
  /**
   * セル群を集約して1つの状態を返す
   *
   * @param cells 集約対象のセル配列（2次元）
   * @param position チャンクの位置（"x,y" 形式、履歴管理用）
   * @returns 集約後の状態（0 or 1）
   */
  aggregate(cells: CellState[][], position: string): CellState
}
```

**実装内容**:
- インターフェース定義のみ
- JSDocで詳細な説明を記載

---

#### Step 1.2.2: EntropyAggregation実装（密度計算）

**ファイル**: `src/lib/features/zoom/aggregation/EntropyAggregation.ts`

```typescript
import type { CellState } from '$lib/types/lifegame'
import type { AggregationStrategy } from './AggregationStrategy'

/**
 * エントロピーベース集約戦略
 * 活動度（変化の激しさ）が高い領域を優先的に保存
 */
export class EntropyAggregation implements AggregationStrategy {
  private history: Map<string, CellState[]> = new Map()

  aggregate(cells: CellState[][], position: string): CellState {
    const density = this.calculateDensity(cells)
    const entropy = this.calculateEntropy(cells, position)

    // エントロピーに応じて閾値を変える
    if (entropy > 0.7) {
      // 高活動領域: 少しでも生きていれば生存
      return density > 0.2 ? 1 : 0
    } else if (entropy > 0.3) {
      // 中活動領域: 通常判定
      return density > 0.4 ? 1 : 0
    } else {
      // 低活動領域: 厳しめ判定
      return density > 0.6 ? 1 : 0
    }
  }

  /**
   * セルの密度（生存率）を計算
   */
  private calculateDensity(cells: CellState[][]): number {
    if (cells.length === 0 || cells[0].length === 0) return 0

    const total = cells.length * cells[0].length
    let alive = 0

    for (const row of cells) {
      for (const cell of row) {
        if (cell === 1) alive++
      }
    }

    return alive / total
  }

  /**
   * エントロピー（活動度）を計算
   * 前回からの変化量を測定
   */
  private calculateEntropy(cells: CellState[][], position: string): number {
    const current = cells.flat()
    const prev = this.history.get(position)

    if (!prev || prev.length === 0) {
      this.history.set(position, [...current])
      return 0.5  // 初回は中間値
    }

    // 変化した割合を計算
    let changes = 0
    for (let i = 0; i < Math.min(current.length, prev.length); i++) {
      if (current[i] !== prev[i]) changes++
    }

    // 履歴を更新
    this.history.set(position, [...current])

    return changes / current.length
  }

  /**
   * 履歴をクリア（メモリ管理）
   */
  clearHistory(): void {
    this.history.clear()
  }
}
```

**実装内容**:
- 密度計算メソッド
- エントロピー計算の基礎（次のステップで完成）
- 履歴管理の基本構造

---

#### Step 1.2.3: EntropyAggregation実装（履歴管理とエントロピー計算）

**前のステップで完了済み**（Step 1.2.2に含まれる）

---

#### Step 1.2.4: EdgeDetectionAggregation実装

**ファイル**: `src/lib/features/zoom/aggregation/EdgeDetectionAggregation.ts`

```typescript
import type { CellState } from '$lib/types/lifegame'
import type { AggregationStrategy } from './AggregationStrategy'

/**
 * エッジ検出ベース集約戦略
 * パターンの境界を重視（ソーベルフィルタ的アプローチ）
 */
export class EdgeDetectionAggregation implements AggregationStrategy {
  aggregate(cells: CellState[][], position: string): CellState {
    const edges = this.detectEdges(cells)
    const density = this.calculateDensity(cells)

    // エッジが多い = 興味深いパターン = 保存
    if (edges > 0.3) return 1

    // エッジが少ない = 通常判定
    return density > 0.4 ? 1 : 0
  }

  /**
   * エッジ（境界）を検出
   */
  private detectEdges(cells: CellState[][]): number {
    if (cells.length === 0 || cells[0].length === 0) return 0

    let edgeCount = 0
    const h = cells.length
    const w = cells[0].length

    for (let y = 0; y < h; y++) {
      for (let x = 0; x < w; x++) {
        const neighborDiff = this.countNeighborDiff(cells, x, y)
        if (neighborDiff > 0) edgeCount++
      }
    }

    return edgeCount / (h * w)
  }

  /**
   * 隣接セルとの差異をカウント
   */
  private countNeighborDiff(cells: CellState[][], x: number, y: number): number {
    const current = cells[y]?.[x] ?? 0
    let diff = 0

    // 8方向の隣接セルをチェック
    for (let dy = -1; dy <= 1; dy++) {
      for (let dx = -1; dx <= 1; dx++) {
        if (dx === 0 && dy === 0) continue

        const ny = y + dy
        const nx = x + dx
        const neighbor = cells[ny]?.[nx] ?? 0

        if (neighbor !== current) diff++
      }
    }

    return diff
  }

  /**
   * セルの密度を計算
   */
  private calculateDensity(cells: CellState[][]): number {
    if (cells.length === 0 || cells[0].length === 0) return 0

    const total = cells.length * cells[0].length
    let alive = 0

    for (const row of cells) {
      for (const cell of row) {
        if (cell === 1) alive++
      }
    }

    return alive / total
  }
}
```

**実装内容**:
- エッジ検出ロジック
- 8方向の隣接セル差異カウント
- 密度計算（再利用）

---

### Phase 1.3: 分割戦略の実装

#### Step 1.3.1: simplex-noiseパッケージのインストール

**コマンド**:
```bash
npm install simplex-noise
npm install -D @types/simplex-noise
```

**確認**:
- package.jsonに追加されているか確認

---

#### Step 1.3.2: SubdivisionStrategy インターフェース定義

**ファイル**: `src/lib/features/zoom/subdivision/SubdivisionStrategy.ts`

```typescript
import type { CellState } from '$lib/types/lifegame'

/**
 * チャンク分割戦略インターフェース
 * 1つのチャンクを複数のセルに分割する際のロジックを定義
 */
export interface SubdivisionStrategy {
  /**
   * 1つの状態をsize×sizeのセル配列に分割
   *
   * @param state 分割元の状態（0 or 1）
   * @param size 分割後のサイズ（一辺のセル数）
   * @param x チャンクのグローバルX座標
   * @param y チャンクのグローバルY座標
   * @returns 分割後のセル配列（2次元）
   */
  subdivide(state: CellState, size: number, x: number, y: number): CellState[][]
}
```

**実装内容**:
- インターフェース定義のみ
- グローバル座標を受け取る設計（ノイズ生成用）

---

#### Step 1.3.3: 既知パターンライブラリの定義

**ファイル**: `src/lib/features/lifegame/patterns.ts`

```typescript
/**
 * ライフゲームの既知パターン
 */
export const LIFE_PATTERNS = {
  glider: [
    [0, 1, 0],
    [0, 0, 1],
    [1, 1, 1],
  ],

  blinker: [
    [1, 1, 1],
  ],

  block: [
    [1, 1],
    [1, 1],
  ],

  beacon: [
    [1, 1, 0, 0],
    [1, 1, 0, 0],
    [0, 0, 1, 1],
    [0, 0, 1, 1],
  ],

  toad: [
    [0, 1, 1, 1],
    [1, 1, 1, 0],
  ],

  pulsar: [
    [0, 0, 1, 1, 1, 0, 0, 0, 1, 1, 1, 0, 0],
    [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
    [1, 0, 0, 0, 0, 1, 0, 1, 0, 0, 0, 0, 1],
    [1, 0, 0, 0, 0, 1, 0, 1, 0, 0, 0, 0, 1],
    [1, 0, 0, 0, 0, 1, 0, 1, 0, 0, 0, 0, 1],
    [0, 0, 1, 1, 1, 0, 0, 0, 1, 1, 1, 0, 0],
    [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
    [0, 0, 1, 1, 1, 0, 0, 0, 1, 1, 1, 0, 0],
    [1, 0, 0, 0, 0, 1, 0, 1, 0, 0, 0, 0, 1],
    [1, 0, 0, 0, 0, 1, 0, 1, 0, 0, 0, 0, 1],
    [1, 0, 0, 0, 0, 1, 0, 1, 0, 0, 0, 0, 1],
    [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
    [0, 0, 1, 1, 1, 0, 0, 0, 1, 1, 1, 0, 0],
  ],
} as const

export type PatternName = keyof typeof LIFE_PATTERNS
```

**実装内容**:
- 代表的なライフゲームパターン6種類
- 型安全なパターン名

---

#### Step 1.3.4: OrganicSubdivision実装（ノイズ生成部分）

**ファイル**: `src/lib/features/zoom/subdivision/OrganicSubdivision.ts`

```typescript
import { createNoise2D } from 'simplex-noise'
import type { CellState } from '$lib/types/lifegame'
import type { SubdivisionStrategy } from './SubdivisionStrategy'

/**
 * 有機的分割戦略
 * フラクタル + ノイズベースで自然なパターンを生成
 */
export class OrganicSubdivision implements SubdivisionStrategy {
  private noise2D = createNoise2D()

  subdivide(state: CellState, size: number, x: number, y: number): CellState[][] {
    if (state === 0) {
      // 死んでいる領域でも微小なノイズパターンを生成
      return this.generateNoisePattern(size, x, y, 0.1)
    }

    // 生きている領域: フラクタル+ノイズ
    return this.generateOrganicPattern(size, x, y)
  }

  /**
   * ノイズパターンを生成
   */
  private generateNoisePattern(
    size: number,
    x: number,
    y: number,
    threshold: number
  ): CellState[][] {
    const grid: CellState[][] = []
    const scale = 0.05

    for (let dy = 0; dy < size; dy++) {
      const row: CellState[] = []
      for (let dx = 0; dx < size; dx++) {
        const noise = this.multilayerNoise(
          (x * size + dx) * scale,
          (y * size + dy) * scale,
          2  // 2オクターブ
        )
        row.push(noise > (1 - threshold) ? 1 : 0)
      }
      grid.push(row)
    }

    return grid
  }

  /**
   * 有機的パターンを生成（フラクタル+ノイズ）
   */
  private generateOrganicPattern(size: number, x: number, y: number): CellState[][] {
    const grid: CellState[][] = []
    const scale = 0.1

    for (let dy = 0; dy < size; dy++) {
      const row: CellState[] = []
      for (let dx = 0; dx < size; dx++) {
        // ノイズ成分（複数オクターブ）
        const noise = this.multilayerNoise(
          (x * size + dx) * scale,
          (y * size + dy) * scale,
          3  // 3オクターブ
        )

        // フラクタル成分: 中心からの距離
        const centerDist = Math.sqrt(
          Math.pow(dx - size / 2, 2) + Math.pow(dy - size / 2, 2)
        )
        const fractal = 1 - centerDist / (size * 0.7)

        // 組み合わせ
        const value = noise * 0.6 + fractal * 0.4
        row.push(value > 0.4 ? 1 : 0)
      }
      grid.push(row)
    }

    return grid
  }

  /**
   * 複数オクターブのノイズを重ね合わせ
   */
  private multilayerNoise(x: number, y: number, octaves: number): number {
    let value = 0
    let amplitude = 1
    let frequency = 1
    let maxValue = 0

    for (let i = 0; i < octaves; i++) {
      value += this.noise2D(x * frequency, y * frequency) * amplitude
      maxValue += amplitude
      amplitude *= 0.5
      frequency *= 2
    }

    // -1..1 → 0..1
    return (value / maxValue + 1) / 2
  }
}
```

**実装内容**:
- simplex-noise統合
- 複数オクターブノイズ生成
- ノイズパターン生成

---

#### Step 1.3.5: OrganicSubdivision実装（フラクタル部分）

**前のステップで完了済み**（Step 1.3.4に含まれる）

---

#### Step 1.3.6: PatternLibrarySubdivision実装

**ファイル**: `src/lib/features/zoom/subdivision/PatternLibrarySubdivision.ts`

```typescript
import type { CellState } from '$lib/types/lifegame'
import type { SubdivisionStrategy } from './SubdivisionStrategy'
import { LIFE_PATTERNS, type PatternName } from '$lib/features/lifegame/patterns'

/**
 * パターンライブラリベース分割戦略
 * 既知の興味深いパターンを埋め込む
 */
export class PatternLibrarySubdivision implements SubdivisionStrategy {
  subdivide(state: CellState, size: number, x: number, y: number): CellState[][] {
    if (state === 0) {
      // 死んでいる領域は空白
      return Array(size)
        .fill(0)
        .map(() => Array(size).fill(0))
    }

    // ランダムに既知パターンを選択
    const patternNames = Object.keys(LIFE_PATTERNS) as PatternName[]
    const randomName = patternNames[Math.floor(Math.random() * patternNames.length)]
    const pattern = LIFE_PATTERNS[randomName]

    // パターンを中央配置
    return this.placePattern(pattern, size)
  }

  /**
   * パターンを指定サイズのグリッド中央に配置
   */
  private placePattern(pattern: readonly number[][], targetSize: number): CellState[][] {
    const grid: CellState[][] = Array(targetSize)
      .fill(0)
      .map(() => Array(targetSize).fill(0))

    const pH = pattern.length
    const pW = pattern[0]?.length ?? 0

    if (pH === 0 || pW === 0) return grid

    const startY = Math.floor((targetSize - pH) / 2)
    const startX = Math.floor((targetSize - pW) / 2)

    for (let y = 0; y < pH && startY + y < targetSize; y++) {
      for (let x = 0; x < pW && startX + x < targetSize; x++) {
        if (pattern[y]?.[x] === 1) {
          grid[startY + y][startX + x] = 1
        }
      }
    }

    return grid
  }
}
```

**実装内容**:
- ランダムパターン選択
- パターン中央配置ロジック

---

### Phase 1.4: MultiResolutionGrid実装

#### Step 1.4.1: MultiResolutionGrid基本構造とコンストラクタ

**ファイル**: `src/lib/features/zoom/MultiResolutionGrid.ts`

```typescript
import { ZoomLevel, getChunkSize } from '$lib/types/zoom'
import type { CellState } from '$lib/types/lifegame'
import type { AggregationStrategy } from './aggregation/AggregationStrategy'
import type { SubdivisionStrategy } from './subdivision/SubdivisionStrategy'
import { EntropyAggregation } from './aggregation/EntropyAggregation'
import { OrganicSubdivision } from './subdivision/OrganicSubdivision'

/**
 * マルチレゾリューション・グリッド
 * 各ズームレベルごとに独立したグリッドを持つ
 */
export class MultiResolutionGrid {
  // 各レベルのグリッドデータ（スパースマップ）
  private grids: Map<ZoomLevel, Map<string, CellState>>

  // 現在のズームレベル
  private currentLevel: ZoomLevel

  // 集約・分割戦略
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

    // 初期レベルのグリッドを作成
    this.grids.set(initialLevel, new Map())
  }

  /**
   * 現在のズームレベルを取得
   */
  getCurrentLevel(): ZoomLevel {
    return this.currentLevel
  }

  /**
   * 現在のレベルのグリッドを取得
   */
  getCurrentGrid(): Map<string, CellState> {
    if (!this.grids.has(this.currentLevel)) {
      this.grids.set(this.currentLevel, new Map())
    }
    return this.grids.get(this.currentLevel)!
  }

  /**
   * 現在のグリッドを設定（外部から初期化する場合）
   */
  setCurrentGrid(grid: Map<string, CellState>): void {
    this.grids.set(this.currentLevel, grid)
  }
}
```

**実装内容**:
- 基本的なプロパティ定義
- コンストラクタ
- getCurrentLevel, getCurrentGrid, setCurrentGrid

---

#### Step 1.4.2: setZoomLevel メソッド実装

**ファイル**: `src/lib/features/zoom/MultiResolutionGrid.ts`（続き）

```typescript
  /**
   * ズームレベルを変更
   * 必要に応じてグリッドを生成/集約/分割
   */
  setZoomLevel(newLevel: ZoomLevel): void {
    if (newLevel === this.currentLevel) return

    const levelDiff = newLevel - this.currentLevel

    if (levelDiff > 0) {
      // 拡大: 分割が必要
      this.subdivideToLevel(this.currentLevel, newLevel)
    } else {
      // 縮小: 集約が必要
      this.aggregateToLevel(this.currentLevel, newLevel)
    }

    this.currentLevel = newLevel
  }

  /**
   * グリッドを段階的に集約
   */
  private aggregateToLevel(fromLevel: ZoomLevel, toLevel: ZoomLevel): void {
    let currentLevel = fromLevel

    while (currentLevel > toLevel) {
      const sourceGrid = this.grids.get(currentLevel)
      if (!sourceGrid) break

      const targetLevel = currentLevel - 1
      const chunkSize = getChunkSize(currentLevel)

      // 集約処理
      const aggregatedGrid = this.aggregateGrid(sourceGrid, chunkSize)
      this.grids.set(targetLevel, aggregatedGrid)

      currentLevel = targetLevel
    }
  }

  /**
   * グリッドを段階的に分割
   */
  private subdivideToLevel(fromLevel: ZoomLevel, toLevel: ZoomLevel): void {
    let currentLevel = fromLevel

    while (currentLevel < toLevel) {
      const sourceGrid = this.grids.get(currentLevel)
      if (!sourceGrid) break

      const targetLevel = currentLevel + 1
      const subdivisionSize = getChunkSize(targetLevel)

      // 分割処理
      const subdividedGrid = this.subdivideGrid(sourceGrid, subdivisionSize)
      this.grids.set(targetLevel, subdividedGrid)

      currentLevel = targetLevel
    }
  }
```

**実装内容**:
- setZoomLevelメソッド
- aggregateToLevelメソッド
- subdivideToLevelメソッド

---

#### Step 1.4.3: aggregateGrid メソッド実装

**ファイル**: `src/lib/features/zoom/MultiResolutionGrid.ts`（続き）

```typescript
  /**
   * グリッドの集約
   */
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

**実装内容**:
- チャンク単位でセルを収集
- 集約戦略を適用
- スパースマップ（生存セルのみ保存）

---

#### Step 1.4.4: subdivideGrid メソッド実装

**ファイル**: `src/lib/features/zoom/MultiResolutionGrid.ts`（続き）

```typescript
  /**
   * グリッドの分割
   */
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

**実装内容**:
- 分割戦略を適用
- セル配列をスパースマップに変換

---

#### Step 1.4.5: getCurrentGrid と補助メソッド実装

**前のステップで完了済み**（Step 1.4.1に含まれる）

---

### Phase 1完了: 基本動作テスト

**テストファイル**: `src/lib/features/zoom/__tests__/MultiResolutionGrid.test.ts`

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
    expect(currentGrid.get('0,0')).toBe(1)
  })

  it('ズームアウト（集約）ができる', () => {
    const grid = new MultiResolutionGrid(ZoomLevel.STANDARD)
    const currentGrid = grid.getCurrentGrid()

    // 3x3のブロックを作成
    for (let y = 0; y < 3; y++) {
      for (let x = 0; x < 3; x++) {
        currentGrid.set(`${x},${y}`, 1)
      }
    }

    // 1レベル縮小
    grid.setZoomLevel(ZoomLevel.STREET)

    expect(grid.getCurrentLevel()).toBe(ZoomLevel.STREET)
    expect(grid.getCurrentGrid().size).toBeGreaterThan(0)
  })

  it('ズームイン（分割）ができる', () => {
    const grid = new MultiResolutionGrid(ZoomLevel.STANDARD)
    const currentGrid = grid.getCurrentGrid()

    currentGrid.set('0,0', 1)

    // 1レベル拡大
    grid.setZoomLevel(ZoomLevel.CELL)

    expect(grid.getCurrentLevel()).toBe(ZoomLevel.CELL)
    expect(grid.getCurrentGrid().size).toBeGreaterThan(1)
  })
})
```

**実装内容**:
- 基本的な動作確認テスト
- 集約・分割のテスト

**実行**:
```bash
npm run test
```

---

## 次のステップ

Phase 1が完了したら、次はPhase 2（量子的シミュレーション）に進みます。

各Stepは独立して実装・テスト可能な粒度になっています。
1つずつ順番に実装していきましょう。

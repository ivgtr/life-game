# 階層的ズームシステム設計書

## 概要

ライフゲーム観賞ビューアに、マクロ宇宙からミクロ宇宙まで探索できる階層的ズームシステムを実装する。
従来の単純な拡大縮小ではなく、**ズームレベルに応じて表現の粒度を変える**フラクタル的システム。

### コンセプト

```
縮小するほど → より大きな単位で世界を見る（抽象化）
拡大するほど → より細かな単位で世界を見る（詳細化）

COSMOS(宇宙規模) ←→ STANDARD(人間スケール) ←→ QUANTUM(量子規模)
```

---

## 1. ズームレベル定義

### 1.1 14段階の非線形ズームレベル

```typescript
enum ZoomLevel {
  COSMOS = -5,      // 1チャンク = 256x256セル（宇宙規模）
  GALAXY = -4,      // 1チャンク = 128x128セル
  SOLAR = -3,       // 1チャンク = 64x64セル（太陽系規模）
  PLANET = -2,      // 1チャンク = 32x32セル
  CONTINENT = -1,   // 1チャンク = 16x16セル（大陸規模）
  COUNTRY = 0,      // 1チャンク = 8x8セル
  CITY = 1,         // 1チャンク = 4x4セル（都市規模）
  STREET = 2,       // 1チャンク = 2x2セル
  STANDARD = 3,     // 1チャンク = 1x1セル（標準＝人間スケール）
  CELL = 4,         // 1セル = 2x2サブセル（細胞規模）
  ORGANELLE = 5,    // 1セル = 4x4サブセル（細胞小器官）
  MOLECULE = 6,     // 1セル = 8x8サブセル（分子規模）
  ATOM = 7,         // 1セル = 16x16サブセル（原子規模）
  QUANTUM = 8,      // 1セル = 32x32サブセル（量子規模）
}
```

### 1.2 フィボナッチ数列ベースのチャンクサイズ

```typescript
const PHI = (1 + Math.sqrt(5)) / 2  // 黄金比

function getChunkSize(level: ZoomLevel): number {
  // フィボナッチ数列: 1, 1, 2, 3, 5, 8, 13, 21, 34, 55, 89, 144, 233, 377
  const fibonacci = [1, 1, 2, 3, 5, 8, 13, 21, 34, 55, 89, 144, 233, 377]
  const index = Math.abs(level - ZoomLevel.STANDARD)
  return fibonacci[Math.min(index, fibonacci.length - 1)]
}
```

**理由**: 自然界に多く見られる黄金比・フィボナッチ数列を採用し、有機的な美しさを実現

### 1.3 相対論的時間スケール

各ズームレベルで時間の流れが異なる（マクロほど速く、ミクロほど遅く）

```typescript
function getTimeScale(level: ZoomLevel): number {
  const normalizedLevel = (level - ZoomLevel.STANDARD)
  return Math.pow(2, -normalizedLevel * 0.5)
}

// 例:
// COSMOS (-5): 8倍速
// STANDARD (3): 1倍速（基準）
// QUANTUM (8): 1/16倍速
```

**目的**: スケール感の演出、観賞体験の多様化

---

## 2. チャンク集約戦略（縮小時）

複数のセル → 1つのチャンクにまとめる際の戦略

### 2.1 エントロピーベース集約（推奨）

活動度（変化の激しさ）が高い領域を優先的に保存

```typescript
class EntropyAggregation implements AggregationStrategy {
  private history: Map<string, CellState[]> = new Map()

  aggregate(cells: CellState[][], position: string): CellState {
    // 1. 現在の密度を計算
    const density = this.calculateDensity(cells)

    // 2. エントロピー（活動度）を計算
    const entropy = this.calculateEntropy(cells, position)

    // 3. 複合判定
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

  private calculateEntropy(cells: CellState[][], position: string): number {
    // 過去数ステップの変化量を測定
    const prev = this.history.get(position) || []
    const current = cells.flat()

    if (prev.length === 0) {
      this.history.set(position, current)
      return 0.5
    }

    // 変化した割合 = エントロピー
    let changes = 0
    for (let i = 0; i < Math.min(current.length, prev.length); i++) {
      if (current[i] !== prev[i]) changes++
    }

    this.history.set(position, current)
    return changes / current.length
  }
}
```

**特徴**:
- 動的な領域（グライダー、振動子など）を優先的に保存
- 静的な領域は集約しやすい
- AI的な知的判断

### 2.2 エッジ検出集約

パターンの境界を重視（ソーベルフィルタ的アプローチ）

```typescript
class EdgeDetectionAggregation implements AggregationStrategy {
  aggregate(cells: CellState[][]): CellState {
    const edges = this.detectEdges(cells)
    const density = this.calculateDensity(cells)

    // エッジが多い = 興味深いパターン = 保存
    if (edges > 0.3) return 1

    // エッジが少ない = 通常判定
    return density > 0.4 ? 1 : 0
  }

  private detectEdges(cells: CellState[][]): number {
    let edgeCount = 0
    const h = cells.length
    const w = cells[0].length

    for (let y = 0; y < h; y++) {
      for (let x = 0; x < w; x++) {
        const neighbors = this.countNeighborDiff(cells, x, y)
        if (neighbors > 0) edgeCount++
      }
    }

    return edgeCount / (h * w)
  }
}
```

**用途**: 境界パターンの保存、構造的な美しさの維持

---

## 3. チャンク分割戦略（拡大時）

1つのチャンク → 複数のセルに分割する際の戦略

### 3.1 有機的分割（フラクタル+ノイズ）

```typescript
class OrganicSubdivision implements SubdivisionStrategy {
  private noiseGenerator: SimplexNoise

  subdivide(state: CellState, size: number, x: number, y: number): CellState[][] {
    if (state === 0) {
      // 死んでいる領域でも微小なノイズパターンを生成
      return this.generateNoisePattern(size, x, y, 0.1)
    }

    // 生きている領域: フラクタル+ノイズ
    return this.generateOrganicPattern(size, x, y)
  }

  private generateOrganicPattern(size: number, x: number, y: number): CellState[][] {
    const grid: CellState[][] = []
    const scale = 0.1  // ノイズのスケール

    for (let dy = 0; dy < size; dy++) {
      const row: CellState[] = []
      for (let dx = 0; dx < size; dx++) {
        // 複数オクターブのノイズを重ね合わせ
        const noise = this.multilayerNoise(
          (x * size + dx) * scale,
          (y * size + dy) * scale,
          3  // オクターブ数
        )

        // フラクタル成分: 中心からの距離
        const centerDist = Math.sqrt(
          Math.pow(dx - size/2, 2) + Math.pow(dy - size/2, 2)
        )
        const fractal = 1 - (centerDist / (size * 0.7))

        // 組み合わせ
        const value = noise * 0.6 + fractal * 0.4
        row.push(value > 0.4 ? 1 : 0)
      }
      grid.push(row)
    }

    return grid
  }

  private multilayerNoise(x: number, y: number, octaves: number): number {
    let value = 0
    let amplitude = 1
    let frequency = 1
    let maxValue = 0

    for (let i = 0; i < octaves; i++) {
      value += this.noiseGenerator.noise2D(x * frequency, y * frequency) * amplitude
      maxValue += amplitude
      amplitude *= 0.5
      frequency *= 2
    }

    return (value / maxValue + 1) / 2  // -1..1 → 0..1
  }
}
```

**特徴**:
- Simplex Noiseによる自然なパターン
- 複数オクターブで複雑性を追加
- フラクタル構造（自己相似性）

### 3.2 パターンライブラリ分割

既知の興味深いパターンを埋め込む

```typescript
class PatternLibrarySubdivision implements SubdivisionStrategy {
  private patterns = {
    glider: [[0,1,0],[0,0,1],[1,1,1]],
    blinker: [[1,1,1]],
    beacon: [[1,1,0,0],[1,1,0,0],[0,0,1,1],[0,0,1,1]],
    pulsar: [/* 13x13 */],
    // ... 他のパターン
  }

  subdivide(state: CellState, size: number): CellState[][] {
    if (state === 0) {
      return Array(size).fill(0).map(() => Array(size).fill(0))
    }

    // ランダムに既知パターンを選択して配置
    const pattern = this.selectRandomPattern()
    return this.placePattern(pattern, size)
  }
}
```

**用途**: 発見の楽しさ、教育的要素

---

## 4. 量子的シミュレーションシステム

### 4.1 クロスレベル相互作用

異なるズームレベルが互いに微妙に影響し合う

```typescript
class QuantumLifeEngine {
  private grids: Map<ZoomLevel, Map<string, CellState>>
  private entanglement = 0.1  // 量子もつれ係数（10%）

  computeNextGeneration(currentLevel: ZoomLevel) {
    // 現在のレベルを通常計算
    const mainGrid = this.computeStandardGeneration(currentLevel)

    // 隣接レベルからの「量子的影響」を適用
    const influenced = this.applyQuantumInfluence(mainGrid, currentLevel)

    return influenced
  }

  private applyQuantumInfluence(
    grid: Map<string, CellState>,
    level: ZoomLevel
  ): Map<string, CellState> {
    const influenced = new Map(grid)

    // 1レベル上からの影響（マクロ視点）
    if (this.grids.has(level - 1)) {
      this.applyInfluenceFrom(influenced, level - 1, 'macro')
    }

    // 1レベル下からの影響（ミクロ視点）
    if (this.grids.has(level + 1)) {
      this.applyInfluenceFrom(influenced, level + 1, 'micro')
    }

    return influenced
  }

  private applyInfluenceFrom(
    targetGrid: Map<string, CellState>,
    sourceLevel: ZoomLevel,
    direction: 'macro' | 'micro'
  ) {
    const sourceGrid = this.grids.get(sourceLevel)!

    for (const [key, state] of targetGrid) {
      // 確率的に状態を変更（量子もつれ係数）
      if (Math.random() < this.entanglement) {
        const [x, y] = key.split(',').map(Number)

        // ソースグリッドの対応位置
        const sourceKey = direction === 'macro'
          ? `${Math.floor(x / 2)},${Math.floor(y / 2)}`
          : `${x * 2},${y * 2}`

        const sourceState = sourceGrid.get(sourceKey)
        if (sourceState !== undefined && sourceState !== state) {
          targetGrid.set(key, sourceState)
        }
      }
    }
  }
}
```

**効果**:
- レベル間の有機的なつながり
- 予測不可能性と驚き
- より深い没入感

### 4.2 時間スケール適用

```typescript
private computeStandardGeneration(level: ZoomLevel): Map<string, CellState> {
  const grid = this.grids.get(level)!
  const timeScale = getTimeScale(level)

  // 時間スケールに応じて更新頻度を調整
  if (Math.random() > timeScale) {
    // このフレームではスキップ
    return new Map(grid)
  }

  return this.applyConwayRules(grid)
}
```

---

## 5. マルチレゾリューション・グリッド

### 5.1 データ構造

```typescript
class MultiResolutionGrid {
  // 各レベルのグリッドデータ
  private grids: Map<ZoomLevel, Map<string, CellState>>

  // 現在のズームレベル
  private currentLevel: ZoomLevel

  // 集約・分割戦略
  private aggregation: AggregationStrategy
  private subdivision: SubdivisionStrategy

  constructor() {
    this.grids = new Map()
    this.currentLevel = ZoomLevel.STANDARD
    this.aggregation = new EntropyAggregation()
    this.subdivision = new OrganicSubdivision()
  }

  setZoomLevel(newLevel: ZoomLevel) {
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
}
```

### 5.2 集約処理

```typescript
private aggregateGrid(
  sourceGrid: Map<string, CellState>,
  chunkSize: number
): Map<string, CellState> {
  const aggregated = new Map<string, CellState>()
  const processedChunks = new Set<string>()

  for (const [key, _] of sourceGrid) {
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

### 5.3 分割処理

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
        const cellState = cells[dy][dx]

        if (cellState === 1) {
          subdivided.set(`${cellX},${cellY}`, cellState)
        }
      }
    }
  }

  return subdivided
}
```

---

## 6. カラーシステム

### 6.1 スペクトラムカラーシステム

ズームレベルに応じたレインボーグラデーション

```typescript
class SpectrumColorSystem {
  getColorForLevel(level: ZoomLevel): number {
    // -5..8 → 0..1
    const normalized = (level - ZoomLevel.COSMOS) /
                       (ZoomLevel.QUANTUM - ZoomLevel.COSMOS)

    // HSL: 色相0-360度
    // COSMOS: 紫(270度) → STANDARD: 緑(120度) → QUANTUM: 赤(0度)
    const hue = 270 - normalized * 270

    return this.hslToHex(hue, 70, 60)
  }

  getColorForAge(age: number, baseColor: number): number {
    const maxAge = 100
    const brightness = 1 - Math.min(age / maxAge, 0.7)
    return this.adjustBrightness(baseColor, brightness)
  }

  getColorForActivity(activity: number, baseColor: number): number {
    const saturation = 40 + activity * 60  // 40-100%
    return this.adjustSaturation(baseColor, saturation)
  }
}
```

### 6.2 カラーマッピング

| ズームレベル | 色相 | 色 | 意味 |
|------------|------|-----|------|
| COSMOS | 270° | 紫 | 神秘的、宇宙 |
| GALAXY | 240° | 青紫 | 深遠 |
| SOLAR | 210° | 青 | 冷静、広大 |
| PLANET | 180° | シアン | 生命の源 |
| CONTINENT | 150° | 青緑 | 自然 |
| COUNTRY | 120° | 緑 | 生命 |
| CITY | 90° | 黄緑 | 活力 |
| STREET | 60° | 黄 | 温暖 |
| STANDARD | 30° | オレンジ | 人間的 |
| CELL | 15° | 赤オレンジ | エネルギー |
| ORGANELLE | 7° | 赤 | 情熱 |
| MOLECULE | 350° | 赤紫 | 激しさ |
| ATOM | 330° | マゼンタ | 根源 |
| QUANTUM | 300° | 紫ピンク | 神秘的、未知 |

---

## 7. レンダリングシステム

### 7.1 階層的レンダラー

```typescript
class HierarchicalLifeRenderer {
  private viewport: Viewport
  private colorSystem: SpectrumColorSystem

  render(grid: MultiResolutionGrid, viewport: Viewport) {
    const currentGrid = grid.getCurrentGrid()
    const level = grid.getCurrentLevel()
    const chunkSize = getChunkSize(level)

    // レベル別の色を取得
    const baseColor = this.colorSystem.getColorForLevel(level)

    // ビューポート内の可視範囲を計算
    const bounds = this.calculateVisibleBounds(viewport, chunkSize)

    // 描画
    this.renderGrid(currentGrid, bounds, viewport, chunkSize, baseColor)
  }

  private renderGrid(
    grid: Map<string, CellState>,
    bounds: Bounds,
    viewport: Viewport,
    chunkSize: number,
    baseColor: number
  ) {
    const cellSize = viewport.displayCellSize

    for (let y = bounds.minY; y <= bounds.maxY; y++) {
      for (let x = bounds.minX; x <= bounds.maxX; x++) {
        const key = `${x},${y}`
        const state = grid.get(key) ?? 0

        if (state === 1) {
          const screenX = (x - viewport.centerX) * cellSize + viewport.width / 2
          const screenY = (y - viewport.centerY) * cellSize + viewport.height / 2

          this.drawCell(screenX, screenY, cellSize, baseColor)
        }
      }
    }
  }
}
```

### 7.2 ビューポート設計

```typescript
interface Viewport {
  // ワールド座標での中心位置
  centerX: number
  centerY: number

  // ズームレベル
  zoomLevel: ZoomLevel

  // 表示サイズ
  width: number   // px
  height: number  // px

  // 1セル（チャンク）の表示サイズ
  displayCellSize: number  // px

  // 可視範囲（チャンク単位）
  visibleChunksWidth: number
  visibleChunksHeight: number
}
```

---

## 8. インタラクションシステム

### 8.1 カメラコントローラー

```typescript
class CameraController {
  private viewport: Viewport
  private grid: MultiResolutionGrid

  // ズーム操作
  zoomIn() {
    const newLevel = Math.min(this.viewport.zoomLevel + 1, ZoomLevel.QUANTUM)
    this.setZoomLevel(newLevel)
  }

  zoomOut() {
    const newLevel = Math.max(this.viewport.zoomLevel - 1, ZoomLevel.COSMOS)
    this.setZoomLevel(newLevel)
  }

  setZoomLevel(level: ZoomLevel) {
    this.grid.setZoomLevel(level)
    this.viewport.zoomLevel = level
    this.updateViewport()
  }

  // パン操作
  pan(deltaX: number, deltaY: number) {
    this.viewport.centerX += deltaX
    this.viewport.centerY += deltaY
  }

  // リセット
  reset() {
    this.viewport.centerX = 0
    this.viewport.centerY = 0
    this.setZoomLevel(ZoomLevel.STANDARD)
  }
}
```

### 8.2 入力マッピング

#### マウス操作
- **ドラッグ**: パン移動
- **ホイール**: ズーム（マウス位置中心）
- **ダブルクリック**: ズームイン
- **Shift + ダブルクリック**: ズームアウト

#### タッチ操作
- **1本指スワイプ**: パン移動
- **2本指ピンチ**: ズーム
- **ダブルタップ**: ズームイン
- **2本指ダブルタップ**: ズームアウト

#### キーボード操作
- **矢印キー**: パン移動
- **+ / -**: ズームイン/アウト
- **0**: リセット（原点、STANDARD）
- **Space**: 再生/一時停止
- **Z**: Zenモード（UI非表示）

---

## 9. 音響システム（オプション）

### 9.1 ソニフィケーション

セルの活動を音に変換

```typescript
class SonificationSystem {
  private audioContext: AudioContext

  updateSound(grid: Map<string, CellState>, level: ZoomLevel) {
    const density = this.calculateDensity(grid)
    const activity = this.calculateActivity(grid)

    // 密度 → 音量
    const volume = density * 0.3

    // 活動度 → 周波数
    const frequency = 200 + activity * 800  // 200-1000 Hz

    // レベル → 音色（倍音構成）
    const harmonics = this.getHarmonicsForLevel(level)

    this.playTone(frequency, volume, harmonics)
  }

  private getHarmonicsForLevel(level: ZoomLevel): number[] {
    const base = (level - ZoomLevel.COSMOS) /
                 (ZoomLevel.QUANTUM - ZoomLevel.COSMOS)

    // マクロ: 低音多め、ミクロ: 高音多め
    return [1, 2 + base, 3 + base * 2, 4 + base * 3]
  }
}
```

---

## 10. 実装計画

### Phase 1: コアシステム（3-4日）

#### 1.1 拡張ズームレベル
- [ ] 14段階ZoomLevel定義（COSMOS → QUANTUM）
- [ ] フィボナッチベースのチャンクサイズ計算
- [ ] 非線形時間スケール実装
- [ ] レベル名の定義

**ファイル**:
- `src/lib/types/zoom.ts`
- `src/lib/features/zoom/constants.ts`

#### 1.2 知的集約戦略
- [ ] AggregationStrategy インターフェース
- [ ] EntropyAggregation（エントロピーベース）
- [ ] EdgeDetectionAggregation（エッジ検出）
- [ ] 履歴管理システム

**ファイル**:
- `src/lib/features/zoom/aggregation/`
  - `AggregationStrategy.ts`
  - `EntropyAggregation.ts`
  - `EdgeDetectionAggregation.ts`

#### 1.3 有機的分割戦略
- [ ] SimplexNoiseライブラリ統合（`simplex-noise` npm package）
- [ ] SubdivisionStrategy インターフェース
- [ ] OrganicSubdivision（フラクタル+ノイズ）
- [ ] PatternLibrarySubdivision（既知パターン埋め込み）

**ファイル**:
- `src/lib/features/zoom/subdivision/`
  - `SubdivisionStrategy.ts`
  - `OrganicSubdivision.ts`
  - `PatternLibrarySubdivision.ts`
- `src/lib/features/lifegame/patterns.ts`（既知パターン定義）

#### 1.4 マルチレゾリューション・グリッド
- [ ] MultiResolutionGrid クラス
- [ ] レベル切り替えロジック
- [ ] 集約処理（aggregateGrid）
- [ ] 分割処理（subdivideGrid）
- [ ] メモリ管理

**ファイル**:
- `src/lib/features/zoom/MultiResolutionGrid.ts`

### Phase 2: 量子的シミュレーション（2-3日）

#### 2.1 クロスレベル相互作用
- [ ] QuantumLifeEngine クラス
- [ ] 量子もつれ係数（entanglement = 0.1）
- [ ] レベル間影響計算（applyQuantumInfluence）
- [ ] マクロ/ミクロ方向の影響処理

**ファイル**:
- `src/lib/features/lifegame/QuantumLifeEngine.ts`

#### 2.2 時間スケール
- [ ] レベル別時間の流れ実装
- [ ] 相対論的時間歪み
- [ ] フレームスキップロジック

**ファイル**:
- `src/lib/features/zoom/timeScale.ts`

### Phase 3: レンダリング＋カラーシステム（3-4日）

#### 3.1 階層的レンダラー
- [ ] HierarchicalLifeRenderer クラス
- [ ] レベル別描画最適化
- [ ] ビューポートベース描画
- [ ] カリング（可視範囲外除外）

**ファイル**:
- `src/lib/pixi/HierarchicalLifeRenderer.ts`

#### 3.2 スペクトラムカラーシステム
- [ ] SpectrumColorSystem クラス
- [ ] レベル別レインボーグラデーション
- [ ] HSL → RGB → Hex 変換
- [ ] セル年齢別色調整
- [ ] 活動度別彩度調整

**ファイル**:
- `src/lib/features/zoom/SpectrumColorSystem.ts`

#### 3.3 視覚エフェクト（オプション）
- [ ] グロウエフェクト（拡大時）
- [ ] パーティクルエフェクト（高活動領域）
- [ ] レベル遷移アニメーション

### Phase 4: インタラクション（2-3日）

#### 4.1 カメラコントローラー
- [ ] CameraController クラス
- [ ] 14段階ズーム対応
- [ ] スムーズトランジション
- [ ] イージング関数（ease-in-out）

**ファイル**:
- `src/lib/features/zoom/CameraController.ts`

#### 4.2 入力ハンドリング
- [ ] マウスドラッグ（パン）
- [ ] マウスホイール（ズーム）
- [ ] タッチスワイプ（パン）
- [ ] ピンチイン/アウト（ズーム）
- [ ] キーボード操作
- [ ] ジェスチャー認識

**ファイル**:
- `src/lib/features/zoom/InputHandler.ts`

### Phase 5: 音響システム（オプション、1-2日）

#### 5.1 ソニフィケーション
- [ ] SonificationSystem クラス
- [ ] Web Audio API統合
- [ ] セル活動→音変換
- [ ] レベル別倍音構成
- [ ] 音量・周波数計算

**ファイル**:
- `src/lib/features/audio/SonificationSystem.ts`

### Phase 6: UI＋状態管理（2-3日）

#### 6.1 Store更新
- [ ] viewportStore（centerX, centerY, zoomLevel）
- [ ] quantumGridStore（MultiResolutionGrid統合）
- [ ] audioStore（音響ON/OFF）
- [ ] 履歴管理

**ファイル**:
- `src/lib/stores/viewportStore.ts`
- `src/lib/stores/quantumGridStore.ts`
- `src/lib/stores/audioStore.ts`

#### 6.2 拡張UIコンポーネント
- [ ] ZoomLevelIndicator（レベル名表示: COSMOS, GALAXY...）
- [ ] TimeScaleIndicator（時間スケール表示）
- [ ] ColorSpectrumBar（カラースペクトラム表示）
- [ ] ZoomControls（+/- ボタン、スライダー）
- [ ] PositionIndicator（座標表示）
- [ ] AudioToggle（音響ON/OFF）
- [ ] ResetButton（原点に戻る）

**ファイル**:
- `src/lib/components/ZoomLevelIndicator.svelte`
- `src/lib/components/TimeScaleIndicator.svelte`
- `src/lib/components/ColorSpectrumBar.svelte`
- `src/lib/components/ZoomControls.svelte`
- `src/lib/components/AudioToggle.svelte`

#### 6.3 ControlPanel統合
- [ ] 既存ControlPanelの拡張
- [ ] レイアウト調整

**ファイル**:
- `src/lib/components/ControlPanel.svelte`（更新）

### Phase 7: 最適化＋テスト（2-3日）

#### 7.1 パフォーマンス最適化
- [ ] WebWorker対応（シミュレーション計算）
- [ ] メモリプーリング
- [ ] 描画バッチング
- [ ] レベル切替時の遅延ロード

#### 7.2 体験調整
- [ ] 各レベルでの見た目調整
- [ ] 量子もつれ係数チューニング
- [ ] 色彩バランス調整
- [ ] 時間スケール微調整

#### 7.3 テスト
- [ ] ユニットテスト（集約/分割ロジック）
- [ ] 統合テスト（レベル切替）
- [ ] 実機テスト（特にモバイル）
- [ ] パフォーマンステスト

**ファイル**:
- `src/lib/features/zoom/__tests__/`

---

## 11. 技術的考慮事項

### 11.1 パフォーマンス

#### メモリ管理
- スパースマップ（Map）でメモリ効率化
- 可視範囲外のセルは即座に破棄
- LRUキャッシュで履歴管理（最大サイズ制限）

#### 計算量削減
- アクティブ領域のみ計算（ビューポート + バッファ）
- レベル別の更新頻度調整
- WebWorkerでの並列計算（Phase 7）

#### 描画最適化
- カリング（可視範囲外は描画しない）
- バッチレンダリング
- PixiJS の最適化機能活用

### 11.2 互換性

#### 必要なnpmパッケージ
- `simplex-noise`: パーリンノイズ生成
- Web Audio API: ブラウザ標準（追加パッケージ不要）

#### ブラウザサポート
- モダンブラウザ（Chrome, Firefox, Safari, Edge）
- Web Audio API対応
- PointerEvent API対応

### 11.3 既存機能との統合

#### 廃止する機能
- トーラス構造（toroidal: boolean）
- 固定グリッドサイズ（gridSize: GridSize）

#### 維持する機能
- 再生/一時停止
- 速度調整（各レベルの基準速度として）
- リセット（原点・STANDARD に戻る）

#### 新規追加する機能
- 無限グリッド探索
- 階層的ズーム
- 量子的相互作用
- スペクトラムカラー
- 音響フィードバック（オプション）

---

## 12. ユニークな特徴まとめ

### 12.1 宇宙的スケール感
- COSMOS（256×256）からQUANTUM（32×32サブセル）まで
- 14段階のシームレスな旅
- レベル名によるストーリー性

### 12.2 知的システム
- エントロピーベース集約（活動的な領域を重視）
- エッジ検出（境界パターンを保存）
- 有機的分割（自然なパターン生成）
- AI的な判断ロジック

### 12.3 量子的相互作用
- レベル間で互いに影響（量子もつれ）
- 時間の相対性（マクロは速く、ミクロは遅く）
- 予測不可能な美しさ

### 12.4 シナスタジア体験
- **視覚**: レインボーグラデーション、レベル別色彩
- **聴覚**: 音響フィードバック（密度→音量、活動→周波数）
- **認知**: レベル名のストーリー性、発見の楽しさ

### 12.5 有機的美学
- フラクタル+ノイズ
- フィボナッチ数列
- 既知パターンの埋め込み
- 自然界の構造模倣

---

## 13. 参考資料

### 学術的背景
- Conway's Game of Life（セルオートマトン）
- フラクタル幾何学（マンデルブロ集合）
- Simplex Noise（パーリンノイズの改良版）
- 量子もつれ（量子力学の概念的応用）
- 特殊相対性理論（時間の歪み）

### 技術参考
- PixiJS Documentation: https://pixijs.com/
- Web Audio API: https://developer.mozilla.org/en-US/docs/Web/API/Web_Audio_API
- simplex-noise: https://www.npmjs.com/package/simplex-noise

### パターンライブラリ
- LifeWiki: https://conwaylife.com/wiki/
- 既知のライフゲームパターン集

---

## 14. 実装時の注意事項

### 14.1 段階的実装
- Phase 1から順に実装
- 各Phaseの完了後にコミット
- 動作確認を都度実施

### 14.2 テスト戦略
- 集約・分割ロジックは必ずユニットテスト
- レベル切替の統合テスト
- パフォーマンス測定

### 14.3 コード品質
- TypeScript strict モード維持
- ESLint / Prettier 適用
- 適切なコメント（特にアルゴリズム部分）

### 14.4 ユーザー体験
- スムーズなトランジション
- 直感的な操作
- レスポンシブ対応
- アクセシビリティ配慮

---

## 15. 将来的な拡張案

### 15.1 追加ズームレベル
- MULTIVERSE（更にマクロ）
- SUPERSTRING（更にミクロ）

### 15.2 カスタム戦略
- ユーザーが集約・分割戦略を選択可能
- カスタムパターンのインポート

### 15.3 マルチプレイヤー
- 他のユーザーの探索領域を共有
- コラボレーション機能

### 15.4 録画・共有
- 探索の軌跡を記録
- GIF/動画エクスポート
- ソーシャル共有

---

最終更新: 2025-11-09
バージョン: 1.0

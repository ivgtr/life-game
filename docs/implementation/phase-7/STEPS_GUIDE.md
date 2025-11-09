# Phase 7 全ステップガイド

このファイルはPhase 7の全12ステップの概要と実装ガイドです。

---

## Phase 7.1: パフォーマンス最適化（4ステップ）

### Step 7.1.1: WebWorker実装準備（型定義とメッセージ構造）

**見積もり**: 45分

**ファイル**:
- `src/workers/types.ts`（新規）
- `src/workers/lifegame.worker.ts`（新規、基本構造のみ）

**実装内容**:

#### types.ts
```typescript
import type { CellState } from '$lib/types/lifegame'
import type { ZoomLevel } from '$lib/types/zoom'

// メッセージタイプ
export enum WorkerMessageType {
  INIT = 'INIT',
  COMPUTE_NEXT_GENERATION = 'COMPUTE_NEXT_GENERATION',
  RESULT = 'RESULT',
  ERROR = 'ERROR'
}

// ワーカーへのメッセージ
export interface WorkerRequest {
  type: WorkerMessageType
  id: string
  payload: WorkerRequestPayload
}

export type WorkerRequestPayload = InitPayload | ComputePayload

export interface InitPayload {
  quantumEntanglementFactor: number
}

export interface ComputePayload {
  grid: Map<string, CellState>
  level: ZoomLevel
  timestamp: number
}

// ワーカーからのメッセージ
export interface WorkerResponse {
  type: WorkerMessageType
  id: string
  payload: WorkerResponsePayload
}

export type WorkerResponsePayload = ResultPayload | ErrorPayload

export interface ResultPayload {
  grid: Map<string, CellState>
  timestamp: number
  computeTime: number
}

export interface ErrorPayload {
  message: string
  stack?: string
}

// Map<string, CellState> を転送可能な形式に変換
export interface SerializableGrid {
  entries: Array<[string, CellState]>
}

export function serializeGrid(grid: Map<string, CellState>): SerializableGrid {
  return {
    entries: Array.from(grid.entries())
  }
}

export function deserializeGrid(serializable: SerializableGrid): Map<string, CellState> {
  return new Map(serializable.entries)
}
```

#### lifegame.worker.ts（基本構造）
```typescript
import { WorkerMessageType, type WorkerRequest, type WorkerResponse } from './types'

// グローバルスコープでのメッセージリスナー
self.addEventListener('message', (event: MessageEvent<WorkerRequest>) => {
  const { type, id, payload } = event.data

  try {
    switch (type) {
      case WorkerMessageType.INIT:
        handleInit(id, payload)
        break

      case WorkerMessageType.COMPUTE_NEXT_GENERATION:
        handleCompute(id, payload)
        break

      default:
        throw new Error(`Unknown message type: ${type}`)
    }
  } catch (error) {
    const errorPayload = {
      message: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined
    }

    const response: WorkerResponse = {
      type: WorkerMessageType.ERROR,
      id,
      payload: errorPayload
    }

    self.postMessage(response)
  }
})

function handleInit(id: string, payload: any) {
  // 次のステップで実装
}

function handleCompute(id: string, payload: any) {
  // 次のステップで実装
}
```

**チェックポイント**:
- [ ] types.ts作成
- [ ] メッセージ型定義完了
- [ ] シリアライズ/デシリアライズ関数実装
- [ ] lifegame.worker.ts基本構造作成
- [ ] TypeScript型エラーなし

---

### Step 7.1.2: WebWorkerでのシミュレーション計算移行

**見積もり**: 1時間30分

**ファイル**:
- `src/workers/lifegame.worker.ts`（完成）
- `src/lib/workers/WorkerPool.ts`（新規）
- `src/lib/stores/hierarchicalGridStore.ts`（更新）

**実装内容**:

#### lifegame.worker.ts（完成版）
```typescript
import { WorkerMessageType, type WorkerRequest, type WorkerResponse, deserializeGrid, serializeGrid } from './types'
import { QuantumLifeEngine } from '$lib/features/lifegame/QuantumLifeEngine'
import type { ZoomLevel } from '$lib/types/zoom'

let engine: QuantumLifeEngine | null = null

self.addEventListener('message', (event: MessageEvent<WorkerRequest>) => {
  const { type, id, payload } = event.data

  try {
    switch (type) {
      case WorkerMessageType.INIT:
        handleInit(id, payload)
        break

      case WorkerMessageType.COMPUTE_NEXT_GENERATION:
        handleCompute(id, payload)
        break

      default:
        throw new Error(`Unknown message type: ${type}`)
    }
  } catch (error) {
    const errorPayload = {
      message: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined
    }

    const response: WorkerResponse = {
      type: WorkerMessageType.ERROR,
      id,
      payload: errorPayload
    }

    self.postMessage(response)
  }
})

function handleInit(id: string, payload: any) {
  const { quantumEntanglementFactor } = payload

  engine = new QuantumLifeEngine(quantumEntanglementFactor)

  const response: WorkerResponse = {
    type: WorkerMessageType.RESULT,
    id,
    payload: { grid: new Map(), timestamp: Date.now(), computeTime: 0 }
  }

  self.postMessage(response)
}

function handleCompute(id: string, payload: any) {
  if (!engine) {
    throw new Error('Worker not initialized')
  }

  const startTime = performance.now()

  const { grid: serializedGrid, level, timestamp } = payload
  const grid = deserializeGrid(serializedGrid)

  const nextGrid = engine.nextGeneration(grid, level as ZoomLevel)

  const computeTime = performance.now() - startTime

  const response: WorkerResponse = {
    type: WorkerMessageType.RESULT,
    id,
    payload: {
      grid: serializeGrid(nextGrid),
      timestamp,
      computeTime
    }
  }

  self.postMessage(response)
}
```

#### WorkerPool.ts
```typescript
import { WorkerMessageType, type WorkerRequest, type WorkerResponse } from '../../workers/types'

export class WorkerPool {
  private workers: Worker[] = []
  private currentWorkerIndex = 0
  private pendingRequests = new Map<string, (response: WorkerResponse) => void>()

  constructor(private workerCount: number = navigator.hardwareConcurrency || 4) {
    this.initializeWorkers()
  }

  private initializeWorkers() {
    for (let i = 0; i < this.workerCount; i++) {
      const worker = new Worker(new URL('../../workers/lifegame.worker.ts', import.meta.url), {
        type: 'module'
      })

      worker.addEventListener('message', this.handleWorkerMessage.bind(this))
      worker.addEventListener('error', this.handleWorkerError.bind(this))

      this.workers.push(worker)

      // 初期化メッセージ送信
      const initRequest: WorkerRequest = {
        type: WorkerMessageType.INIT,
        id: `init-${i}`,
        payload: { quantumEntanglementFactor: 0.1 }
      }

      worker.postMessage(initRequest)
    }
  }

  private handleWorkerMessage(event: MessageEvent<WorkerResponse>) {
    const { id, type, payload } = event.data

    const resolver = this.pendingRequests.get(id)
    if (resolver) {
      resolver(event.data)
      this.pendingRequests.delete(id)
    }
  }

  private handleWorkerError(event: ErrorEvent) {
    console.error('Worker error:', event)
  }

  private getNextWorker(): Worker {
    const worker = this.workers[this.currentWorkerIndex]
    this.currentWorkerIndex = (this.currentWorkerIndex + 1) % this.workers.length
    return worker
  }

  public async sendRequest(request: WorkerRequest): Promise<WorkerResponse> {
    return new Promise((resolve, reject) => {
      this.pendingRequests.set(request.id, resolve)

      const worker = this.getNextWorker()
      worker.postMessage(request)

      // タイムアウト処理（10秒）
      setTimeout(() => {
        if (this.pendingRequests.has(request.id)) {
          this.pendingRequests.delete(request.id)
          reject(new Error(`Worker request timeout: ${request.id}`))
        }
      }, 10000)
    })
  }

  public destroy() {
    for (const worker of this.workers) {
      worker.terminate()
    }
    this.workers = []
    this.pendingRequests.clear()
  }
}
```

#### hierarchicalGridStore.ts（更新）
```typescript
import { writable, derived } from 'svelte/store'
import { MultiResolutionGrid } from '$lib/features/zoom/MultiResolutionGrid'
import { ZoomLevel } from '$lib/types/zoom'
import { viewportStore } from './viewportStore'
import { WorkerPool } from '$lib/workers/WorkerPool'
import { WorkerMessageType, serializeGrid, deserializeGrid } from '../../workers/types'
import type { WorkerRequest } from '../../workers/types'

export interface HierarchicalGridState {
  multiResolutionGrid: MultiResolutionGrid | null
  workerPool: WorkerPool | null
  isPlaying: boolean
  stepCount: number
  computeTime: number
}

const createHierarchicalGridStore = () => {
  const { subscribe, set, update } = writable<HierarchicalGridState>({
    multiResolutionGrid: null,
    workerPool: null,
    isPlaying: false,
    stepCount: 0,
    computeTime: 0
  })

  return {
    subscribe,
    set,
    update,

    initialize: () => {
      const grid = new MultiResolutionGrid(ZoomLevel.CITY)
      const workerPool = new WorkerPool()

      update(state => ({
        ...state,
        multiResolutionGrid: grid,
        workerPool,
        stepCount: 0
      }))
    },

    setZoomLevel: (level: ZoomLevel) => {
      update(state => {
        if (state.multiResolutionGrid) {
          state.multiResolutionGrid.setZoomLevel(level)
        }
        return state
      })

      viewportStore.setZoomLevel(level)
    },

    step: async () => {
      const state = await new Promise<HierarchicalGridState>((resolve) => {
        update(s => {
          resolve(s)
          return s
        })
      })

      if (state.multiResolutionGrid && state.workerPool) {
        const currentGrid = state.multiResolutionGrid.getCurrentGrid()

        const request: WorkerRequest = {
          type: WorkerMessageType.COMPUTE_NEXT_GENERATION,
          id: `compute-${Date.now()}`,
          payload: {
            grid: serializeGrid(currentGrid),
            level: state.multiResolutionGrid.currentLevel,
            timestamp: Date.now()
          }
        }

        try {
          const response = await state.workerPool.sendRequest(request)

          if (response.type === WorkerMessageType.RESULT) {
            const { grid: serializedGrid, computeTime } = response.payload
            const nextGrid = deserializeGrid(serializedGrid)

            update(s => {
              if (s.multiResolutionGrid) {
                s.multiResolutionGrid.updateCurrentGrid(nextGrid)
              }

              return {
                ...s,
                stepCount: s.stepCount + 1,
                computeTime
              }
            })
          }
        } catch (error) {
          console.error('Worker computation failed:', error)
        }
      }
    },

    togglePlay: () => {
      update(state => ({ ...state, isPlaying: !state.isPlaying }))
    },

    setPlaying: (playing: boolean) => {
      update(state => ({ ...state, isPlaying: playing }))
    },

    reset: () => {
      const grid = new MultiResolutionGrid(ZoomLevel.CITY)

      update(state => ({
        ...state,
        multiResolutionGrid: grid,
        isPlaying: false,
        stepCount: 0,
        computeTime: 0
      }))
    },

    destroy: () => {
      update(state => {
        if (state.workerPool) {
          state.workerPool.destroy()
        }
        return {
          ...state,
          workerPool: null
        }
      })
    }
  }
}

export const hierarchicalGridStore = createHierarchicalGridStore()

export const currentGrid = derived(
  hierarchicalGridStore,
  $store => $store.multiResolutionGrid?.getCurrentGrid() || new Map()
)

export const isPlaying = derived(
  hierarchicalGridStore,
  $store => $store.isPlaying
)

export const stepCount = derived(
  hierarchicalGridStore,
  $store => $store.stepCount
)

export const computeTime = derived(
  hierarchicalGridStore,
  $store => $store.computeTime
)
```

**ポイント**:
- WebWorkerでの並列計算
- WorkerPoolでの複数ワーカー管理
- メッセージングのエラーハンドリング
- 計算時間の測定

**チェックポイント**:
- [ ] lifegame.worker.ts完成
- [ ] WorkerPool実装
- [ ] hierarchicalGridStoreの更新
- [ ] WebWorkerが正しく動作
- [ ] 計算がメインスレッドをブロックしない

---

### Step 7.1.3: メモリプーリング実装

**見積もり**: 1時間

**ファイル**: `src/lib/utils/MemoryPool.ts`（新規）

**実装内容**:

```typescript
/**
 * メモリプーリング: 頻繁に生成・破棄されるオブジェクトを再利用
 */
export class MemoryPool<T> {
  private pool: T[] = []
  private inUse = new Set<T>()

  constructor(
    private factory: () => T,
    private reset: (item: T) => void,
    private initialSize: number = 10,
    private maxSize: number = 100
  ) {
    // 初期プール作成
    for (let i = 0; i < initialSize; i++) {
      this.pool.push(this.factory())
    }
  }

  /**
   * プールからオブジェクトを取得
   */
  public acquire(): T {
    let item: T

    if (this.pool.length > 0) {
      item = this.pool.pop()!
    } else {
      item = this.factory()
    }

    this.inUse.add(item)
    return item
  }

  /**
   * オブジェクトをプールに返却
   */
  public release(item: T): void {
    if (!this.inUse.has(item)) {
      console.warn('Releasing item that was not acquired from pool')
      return
    }

    this.inUse.delete(item)
    this.reset(item)

    if (this.pool.length < this.maxSize) {
      this.pool.push(item)
    }
  }

  /**
   * 使用中のすべてのアイテムを解放
   */
  public releaseAll(): void {
    for (const item of this.inUse) {
      this.reset(item)
      if (this.pool.length < this.maxSize) {
        this.pool.push(item)
      }
    }
    this.inUse.clear()
  }

  /**
   * プール統計
   */
  public getStats() {
    return {
      poolSize: this.pool.length,
      inUse: this.inUse.size,
      total: this.pool.length + this.inUse.size
    }
  }

  /**
   * プールをクリア
   */
  public clear(): void {
    this.pool = []
    this.inUse.clear()
  }
}

// Map<string, CellState>用のプール
export class GridMapPool extends MemoryPool<Map<string, number>> {
  constructor(initialSize = 10, maxSize = 100) {
    super(
      () => new Map(),
      (map) => map.clear(),
      initialSize,
      maxSize
    )
  }
}

// 配列用のプール
export class ArrayPool<T> extends MemoryPool<T[]> {
  constructor(initialSize = 10, maxSize = 100) {
    super(
      () => [],
      (arr) => { arr.length = 0 },
      initialSize,
      maxSize
    )
  }
}
```

**使用例**:

```typescript
// MultiResolutionGrid.ts での使用
import { GridMapPool } from '$lib/utils/MemoryPool'

export class MultiResolutionGrid {
  private gridMapPool = new GridMapPool(20, 200)

  // ...

  public aggregateGrid(sourceLevel: ZoomLevel): Map<string, CellState> {
    const aggregatedGrid = this.gridMapPool.acquire()

    // ... 集約処理 ...

    // 使用後は解放
    this.gridMapPool.release(aggregatedGrid)

    return aggregatedGrid
  }
}
```

**チェックポイント**:
- [ ] MemoryPool汎用クラス実装
- [ ] GridMapPool実装
- [ ] ArrayPool実装
- [ ] MultiResolutionGridで使用
- [ ] メモリ使用量の削減を確認

---

### Step 7.1.4: 描画バッチング最適化

**見積もり**: 1時間15分

**ファイル**: `src/lib/pixi/HierarchicalLifeRenderer.ts`（更新）

**実装内容**:

```typescript
import * as PIXI from 'pixi.js'
import type { CellState } from '$lib/types/lifegame'
import type { MultiResolutionGrid } from '$lib/features/zoom/MultiResolutionGrid'
import type { Viewport } from '$lib/features/zoom/CameraController'
import type { ZoomLevel } from '$lib/types/zoom'
import { SpectrumColorSystem } from '$lib/features/zoom/SpectrumColorSystem'

export class HierarchicalLifeRenderer {
  private container: PIXI.Container
  private colorSystem: SpectrumColorSystem

  // バッチング用
  private cellSprites: Map<string, PIXI.Sprite> = new Map()
  private spritePool: PIXI.Sprite[] = []
  private readonly SPRITE_POOL_SIZE = 10000

  // 描画最適化
  private culledCells = new Set<string>()
  private dirtyRectangles: Array<{ x: number, y: number, width: number, height: number }> = []

  constructor(
    private app: PIXI.Application,
    private grid: MultiResolutionGrid
  ) {
    this.container = new PIXI.Container()
    this.app.stage.addChild(this.container)
    this.colorSystem = new SpectrumColorSystem()

    // スプライトプール初期化
    this.initializeSpritePool()
  }

  private initializeSpritePool() {
    const texture = PIXI.Texture.WHITE

    for (let i = 0; i < this.SPRITE_POOL_SIZE; i++) {
      const sprite = new PIXI.Sprite(texture)
      sprite.visible = false
      this.container.addChild(sprite)
      this.spritePool.push(sprite)
    }
  }

  private acquireSprite(): PIXI.Sprite | null {
    return this.spritePool.pop() || null
  }

  private releaseSprite(sprite: PIXI.Sprite) {
    sprite.visible = false
    this.spritePool.push(sprite)
  }

  public render(
    grid: Map<string, CellState>,
    viewport: Viewport,
    level: ZoomLevel
  ): void {
    // ビューポートカリング
    const visibleCells = this.getVisibleCells(grid, viewport)

    // 差分更新: 表示が必要なセルと不要なセルを特定
    const cellsToAdd = new Set<string>()
    const cellsToRemove = new Set<string>()

    for (const key of visibleCells) {
      if (!this.cellSprites.has(key)) {
        cellsToAdd.add(key)
      }
    }

    for (const key of this.cellSprites.keys()) {
      if (!visibleCells.has(key)) {
        cellsToRemove.add(key)
      }
    }

    // 不要なスプライトを解放
    for (const key of cellsToRemove) {
      const sprite = this.cellSprites.get(key)!
      this.releaseSprite(sprite)
      this.cellSprites.delete(key)
    }

    // 新しいスプライトを追加
    for (const key of cellsToAdd) {
      const sprite = this.acquireSprite()
      if (!sprite) {
        console.warn('Sprite pool exhausted')
        break
      }

      const [x, y] = key.split(',').map(Number)
      const cellState = grid.get(key)!

      this.updateSprite(sprite, x, y, cellState, level, viewport)
      this.cellSprites.set(key, sprite)
    }

    // 既存のスプライトを更新（位置と色のみ）
    for (const [key, sprite] of this.cellSprites) {
      const [x, y] = key.split(',').map(Number)
      const cellState = grid.get(key)!

      this.updateSprite(sprite, x, y, cellState, level, viewport)
    }
  }

  private updateSprite(
    sprite: PIXI.Sprite,
    x: number,
    y: number,
    state: CellState,
    level: ZoomLevel,
    viewport: Viewport
  ): void {
    const cellSize = viewport.cellSize
    const color = this.colorSystem.getCellColor(state, level)

    sprite.x = (x - viewport.centerX) * cellSize + viewport.width / 2
    sprite.y = (y - viewport.centerY) * cellSize + viewport.height / 2
    sprite.width = cellSize
    sprite.height = cellSize
    sprite.tint = color
    sprite.alpha = state === 0 ? 0.1 : 1.0
    sprite.visible = true
  }

  private getVisibleCells(
    grid: Map<string, CellState>,
    viewport: Viewport
  ): Set<string> {
    const visibleCells = new Set<string>()

    const startX = Math.floor(viewport.centerX - viewport.width / viewport.cellSize / 2)
    const endX = Math.ceil(viewport.centerX + viewport.width / viewport.cellSize / 2)
    const startY = Math.floor(viewport.centerY - viewport.height / viewport.cellSize / 2)
    const endY = Math.ceil(viewport.centerY + viewport.height / viewport.cellSize / 2)

    for (let x = startX; x <= endX; x++) {
      for (let y = startY; y <= endY; y++) {
        const key = `${x},${y}`
        if (grid.has(key)) {
          visibleCells.add(key)
        }
      }
    }

    return visibleCells
  }

  public destroy(): void {
    // すべてのスプライトを解放
    for (const sprite of this.cellSprites.values()) {
      this.releaseSprite(sprite)
    }
    this.cellSprites.clear()

    // プールをクリア
    for (const sprite of this.spritePool) {
      sprite.destroy()
    }
    this.spritePool = []

    this.container.destroy({ children: true })
  }
}
```

**ポイント**:
- スプライトプール: 10000個のスプライトを事前作成
- 差分更新: 変更があったセルのみ更新
- ビューポートカリング: 画面外のセルは描画しない
- バッチレンダリング: PixiJSの自動バッチングを活用

**チェックポイント**:
- [ ] スプライトプール実装
- [ ] 差分更新ロジック実装
- [ ] ビューポートカリング実装
- [ ] FPS向上を確認（60fps維持）
- [ ] メモリ使用量の削減を確認

---

## Phase 7.2: 体験調整（4ステップ）

### Step 7.2.1: 各ズームレベルでの見た目調整

**見積もり**: 1時間30分

**ファイル**: `src/lib/features/zoom/constants.ts`（更新）

**実装内容**:

各ズームレベルでの視覚表現を調整します。

```typescript
import { ZoomLevel } from '$lib/types/zoom'

export interface ZoomLevelMetadata {
  name: string
  description: string
  color: string
  wavelength: number // nm
  // 新規追加
  cellOpacity: number // セルの不透明度（0.0-1.0）
  gridOpacity: number // グリッド線の不透明度
  glowIntensity: number // 発光強度
  animationSpeed: number // アニメーション速度倍率
}

export const ZOOM_LEVEL_METADATA: Record<ZoomLevel, ZoomLevelMetadata> = {
  [ZoomLevel.COSMOS]: {
    name: 'COSMOS',
    description: '宇宙規模の観測',
    color: '#8B00FF',
    wavelength: 380,
    cellOpacity: 0.3,
    gridOpacity: 0.0,
    glowIntensity: 2.0,
    animationSpeed: 0.5
  },
  [ZoomLevel.GALAXY]: {
    name: 'GALAXY',
    description: '銀河スケール',
    color: '#9400FF',
    wavelength: 410,
    cellOpacity: 0.4,
    gridOpacity: 0.05,
    glowIntensity: 1.8,
    animationSpeed: 0.6
  },
  [ZoomLevel.SOLAR]: {
    name: 'SOLAR',
    description: '恒星系スケール',
    color: '#0080FF',
    wavelength: 470,
    cellOpacity: 0.5,
    gridOpacity: 0.1,
    glowIntensity: 1.5,
    animationSpeed: 0.7
  },
  [ZoomLevel.PLANET]: {
    name: 'PLANET',
    description: '惑星スケール',
    color: '#00BFFF',
    wavelength: 490,
    cellOpacity: 0.6,
    gridOpacity: 0.15,
    glowIntensity: 1.2,
    animationSpeed: 0.8
  },
  [ZoomLevel.CONTINENT]: {
    name: 'CONTINENT',
    description: '大陸スケール',
    color: '#00FF80',
    wavelength: 520,
    cellOpacity: 0.7,
    gridOpacity: 0.2,
    glowIntensity: 1.0,
    animationSpeed: 0.9
  },
  [ZoomLevel.COUNTRY]: {
    name: 'COUNTRY',
    description: '地域スケール',
    color: '#80FF00',
    wavelength: 550,
    cellOpacity: 0.75,
    gridOpacity: 0.25,
    glowIntensity: 0.8,
    animationSpeed: 1.0
  },
  [ZoomLevel.CITY]: {
    name: 'CITY',
    description: '都市スケール（基準）',
    color: '#FFFF00',
    wavelength: 580,
    cellOpacity: 0.8,
    gridOpacity: 0.3,
    glowIntensity: 0.6,
    animationSpeed: 1.0
  },
  [ZoomLevel.STANDARD]: {
    name: 'STANDARD',
    description: '標準スケール（人間スケール）',
    color: '#FFD700',
    wavelength: 590,
    cellOpacity: 0.85,
    gridOpacity: 0.35,
    glowIntensity: 0.5,
    animationSpeed: 1.1
  },
  [ZoomLevel.STREET]: {
    name: 'STREET',
    description: '街路スケール',
    color: '#FFA500',
    wavelength: 610,
    cellOpacity: 0.9,
    gridOpacity: 0.4,
    glowIntensity: 0.4,
    animationSpeed: 1.2
  },
  [ZoomLevel.CELL]: {
    name: 'CELL',
    description: '細胞スケール',
    color: '#FF8C00',
    wavelength: 630,
    cellOpacity: 0.95,
    gridOpacity: 0.45,
    glowIntensity: 0.3,
    animationSpeed: 1.3
  },
  [ZoomLevel.ORGANELLE]: {
    name: 'ORGANELLE',
    description: '細胞小器官スケール',
    color: '#FF6347',
    wavelength: 650,
    cellOpacity: 1.0,
    gridOpacity: 0.5,
    glowIntensity: 0.2,
    animationSpeed: 1.4
  },
  [ZoomLevel.MOLECULE]: {
    name: 'MOLECULE',
    description: '分子スケール',
    color: '#FF4500',
    wavelength: 680,
    cellOpacity: 1.0,
    gridOpacity: 0.55,
    glowIntensity: 0.15,
    animationSpeed: 1.5
  },
  [ZoomLevel.ATOM]: {
    name: 'ATOM',
    description: '分子スケール',
    color: '#FF0000',
    wavelength: 720,
    cellOpacity: 1.0,
    gridOpacity: 0.6,
    glowIntensity: 0.1,
    animationSpeed: 1.6
  },
  [ZoomLevel.QUANTUM]: {
    name: 'QUANTUM',
    description: '量子スケール',
    color: '#DC143C',
    wavelength: 780,
    cellOpacity: 1.0,
    gridOpacity: 0.7,
    glowIntensity: 0.05,
    animationSpeed: 1.8
  }
}
```

**レンダラーの更新**:

```typescript
// HierarchicalLifeRenderer.ts
private updateSprite(
  sprite: PIXI.Sprite,
  x: number,
  y: number,
  state: CellState,
  level: ZoomLevel,
  viewport: Viewport
): void {
  const cellSize = viewport.cellSize
  const color = this.colorSystem.getCellColor(state, level)
  const metadata = getZoomLevelMetadata(level)

  sprite.x = (x - viewport.centerX) * cellSize + viewport.width / 2
  sprite.y = (y - viewport.centerY) * cellSize + viewport.height / 2
  sprite.width = cellSize
  sprite.height = cellSize
  sprite.tint = color

  // レベル別の不透明度を適用
  if (state === 0) {
    sprite.alpha = 0.1
  } else {
    sprite.alpha = metadata.cellOpacity
  }

  // 発光エフェクト（活性セルのみ）
  if (state > 0 && metadata.glowIntensity > 0) {
    // PixiJS Filtersを使用してグロー効果を追加
    // または、単純にalpha値を調整
    sprite.alpha = Math.min(1.0, metadata.cellOpacity + metadata.glowIntensity * 0.2)
  }

  sprite.visible = true
}
```

**テスト方法**:

各ズームレベルで以下を確認:
- [ ] COSMOS: 薄い紫、強いグロー、遅いアニメーション
- [ ] CITY: 標準的な黄色、中程度のグロー、標準速度
- [ ] QUANTUM: 濃い赤、弱いグロー、速いアニメーション

---

### Step 7.2.2: 量子もつれ係数チューニング

**見積もり**: 45分

**ファイル**: `src/lib/features/lifegame/QuantumLifeEngine.ts`（更新）

**実装内容**:

量子もつれ係数を調整可能にし、レベル別に最適化します。

```typescript
export class QuantumLifeEngine {
  // レベル別の量子もつれ係数
  private static readonly ENTANGLEMENT_FACTORS: Record<ZoomLevel, number> = {
    [ZoomLevel.COSMOS]: 0.20,     // 強いもつれ
    [ZoomLevel.GALAXY]: 0.18,
    [ZoomLevel.SOLAR]: 0.15,
    [ZoomLevel.PLANET]: 0.13,
    [ZoomLevel.CONTINENT]: 0.11,
    [ZoomLevel.COUNTRY]: 0.10,
    [ZoomLevel.CITY]: 0.10,        // 基準値
    [ZoomLevel.STANDARD]: 0.09,
    [ZoomLevel.STREET]: 0.08,
    [ZoomLevel.CELL]: 0.07,
    [ZoomLevel.ORGANELLE]: 0.06,
    [ZoomLevel.MOLECULE]: 0.05,
    [ZoomLevel.ATOM]: 0.03,
    [ZoomLevel.QUANTUM]: 0.01      // 弱いもつれ
  }

  constructor(
    private baseEntanglementFactor: number = 0.10
  ) {}

  public nextGeneration(
    grid: Map<string, CellState>,
    level: ZoomLevel
  ): Map<string, CellState> {
    const nextGrid = new Map<string, CellState>()

    // レベル別のもつれ係数を取得
    const entanglementFactor = QuantumLifeEngine.ENTANGLEMENT_FACTORS[level]

    for (const [key, state] of grid) {
      const [x, y] = key.split(',').map(Number)
      const neighbors = this.getNeighbors(grid, x, y)

      let nextState = this.applyConwayRules(state, neighbors)

      // 量子もつれ効果を適用
      if (Math.random() < entanglementFactor) {
        nextState = this.applyQuantumEntanglement(state, neighbors, entanglementFactor)
      }

      if (nextState > 0) {
        nextGrid.set(key, nextState)
      }
    }

    return nextGrid
  }

  private applyQuantumEntanglement(
    state: CellState,
    neighbors: CellState[],
    factor: number
  ): CellState {
    const liveNeighbors = neighbors.filter(n => n > 0).length

    // もつれ係数に応じて、通常のルールから逸脱
    const deviation = Math.random() * factor

    if (state === 0) {
      // 死んでいるセルが、もつれ効果で生き返る可能性
      if (liveNeighbors >= 2 && liveNeighbors <= 4 && Math.random() < deviation) {
        return 1
      }
    } else {
      // 生きているセルが、もつれ効果で死ぬ可能性
      if ((liveNeighbors < 2 || liveNeighbors > 3) && Math.random() > deviation) {
        return 0
      }
    }

    return state
  }

  // 調整用メソッド
  public setEntanglementFactor(factor: number): void {
    this.baseEntanglementFactor = factor
  }

  public getEntanglementFactor(level: ZoomLevel): number {
    return QuantumLifeEngine.ENTANGLEMENT_FACTORS[level]
  }
}
```

**テスト方法**:

各レベルで長時間シミュレーションを実行し、以下を確認:
- [ ] パターンの安定性（もつれが強すぎるとカオスになる）
- [ ] 視覚的な面白さ（もつれが弱すぎると単調）
- [ ] レベル間の遷移が自然

---

### Step 7.2.3: 色彩バランス調整

**見積もり**: 1時間

**ファイル**: `src/lib/features/zoom/SpectrumColorSystem.ts`（更新）

**実装内容**:

色のバランスを調整し、各レベルで美しいグラデーションを実現します。

```typescript
export class SpectrumColorSystem {
  // 波長から色相への変換を調整
  private wavelengthToHue(wavelength: number): number {
    // 380nm（紫） → 780nm（赤）
    // HSLの色相: 280° → 0°

    const minWavelength = 380
    const maxWavelength = 780

    // 非線形マッピングで自然な色遷移
    const t = (wavelength - minWavelength) / (maxWavelength - minWavelength)
    const eased = this.easeInOutCubic(t)

    return 280 - eased * 280
  }

  private easeInOutCubic(t: number): number {
    return t < 0.5
      ? 4 * t * t * t
      : 1 - Math.pow(-2 * t + 2, 3) / 2
  }

  public getCellColor(state: CellState, level: ZoomLevel): number {
    if (state === 0) {
      return 0x000000 // 黒
    }

    const metadata = getZoomLevelMetadata(level)
    const hue = this.wavelengthToHue(metadata.wavelength)

    // 彩度と明度を調整
    const saturation = 0.8 + state * 0.05 // 世代数に応じて彩度を上げる
    const lightness = 0.5 + state * 0.02 // 世代数に応じて明度を上げる

    return this.hslToRgb(hue, saturation, lightness)
  }

  private hslToRgb(h: number, s: number, l: number): number {
    const c = (1 - Math.abs(2 * l - 1)) * s
    const x = c * (1 - Math.abs(((h / 60) % 2) - 1))
    const m = l - c / 2

    let r = 0, g = 0, b = 0

    if (h >= 0 && h < 60) {
      r = c; g = x; b = 0
    } else if (h >= 60 && h < 120) {
      r = x; g = c; b = 0
    } else if (h >= 120 && h < 180) {
      r = 0; g = c; b = x
    } else if (h >= 180 && h < 240) {
      r = 0; g = x; b = c
    } else if (h >= 240 && h < 300) {
      r = x; g = 0; b = c
    } else {
      r = c; g = 0; b = x
    }

    const rInt = Math.round((r + m) * 255)
    const gInt = Math.round((g + m) * 255)
    const bInt = Math.round((b + m) * 255)

    return (rInt << 16) | (gInt << 8) | bInt
  }

  // 背景グラデーションの生成
  public getBackgroundGradient(level: ZoomLevel): Array<{ color: number, position: number }> {
    const metadata = getZoomLevelMetadata(level)
    const baseHue = this.wavelengthToHue(metadata.wavelength)

    return [
      { color: this.hslToRgb(baseHue, 0.3, 0.05), position: 0.0 },
      { color: this.hslToRgb(baseHue, 0.4, 0.08), position: 0.5 },
      { color: this.hslToRgb(baseHue, 0.5, 0.10), position: 1.0 }
    ]
  }
}
```

**テスト方法**:

- [ ] 各レベルで色が視覚的に区別できる
- [ ] グラデーションが滑らか
- [ ] 世代数による色変化が自然
- [ ] 背景との調和が取れている

---

### Step 7.2.4: 時間スケール微調整

**見積もり**: 30分

**ファイル**: `src/lib/features/zoom/timeScale.ts`（更新）

**実装内容**:

時間スケールを調整し、各レベルで快適な観賞体験を実現します。

```typescript
import { ZoomLevel } from '$lib/types/zoom'

// レベル別の時間スケール（世代/フレーム）
const TIME_SCALES: Record<ZoomLevel, number> = {
  [ZoomLevel.COSMOS]: 1000000,   // 100万世代/フレーム
  [ZoomLevel.GALAXY]: 100000,    // 10万世代/フレーム
  [ZoomLevel.SOLAR]: 10000,    // 1万世代/フレーム
  [ZoomLevel.PLANET]: 1000,   // 1000世代/フレーム
  [ZoomLevel.CONTINENT]: 100,  // 100世代/フレーム
  [ZoomLevel.COUNTRY]: 10,      // 10世代/フレーム
  [ZoomLevel.CITY]: 1,           // 1世代/フレーム（基準）
  [ZoomLevel.STANDARD]: 1,       // 1世代/フレーム
  [ZoomLevel.STREET]: 0.5,       // 2フレーム/世代
  [ZoomLevel.CELL]: 0.33,    // 3フレーム/世代
  [ZoomLevel.ORGANELLE]: 0.25,        // 4フレーム/世代
  [ZoomLevel.MOLECULE]: 0.2,    // 5フレーム/世代
  [ZoomLevel.ATOM]: 0.1,    // 10フレーム/世代
  [ZoomLevel.QUANTUM]: 0.05      // 20フレーム/世代
}

export function getTimeScale(level: ZoomLevel): number {
  return TIME_SCALES[level]
}

// フレームごとに更新すべきかを判定
let frameAccumulator = 0

export function shouldUpdateThisFrame(level: ZoomLevel, deltaTime: number): boolean {
  const scale = TIME_SCALES[level]

  if (scale >= 1) {
    // 1フレームで複数世代進める
    return true
  } else {
    // 複数フレームで1世代進める
    frameAccumulator += deltaTime
    const updateInterval = 1 / scale

    if (frameAccumulator >= updateInterval) {
      frameAccumulator = 0
      return true
    }

    return false
  }
}

export function getGenerationsPerFrame(level: ZoomLevel): number {
  const scale = TIME_SCALES[level]
  return Math.max(1, Math.floor(scale))
}
```

**LifeCanvas.svelteでの使用**:

```typescript
function startRenderLoop() {
  let lastTime = performance.now()

  const loop = (currentTime: number) => {
    const deltaTime = (currentTime - lastTime) / 1000 // 秒単位
    lastTime = currentTime

    if ($hierarchicalGridStore.isPlaying) {
      const level = $viewportStore.zoomLevel

      if (shouldUpdateThisFrame(level, deltaTime)) {
        const generations = getGenerationsPerFrame(level)

        for (let i = 0; i < generations; i++) {
          hierarchicalGridStore.step()
        }
      }
    }

    // ... レンダリング処理 ...

    animationFrameId = requestAnimationFrame(loop)
  }

  animationFrameId = requestAnimationFrame(loop)
}
```

**テスト方法**:

- [ ] COSMOS: 非常に速いシミュレーション
- [ ] CITY: 標準的な速度
- [ ] QUANTUM: ゆっくりとしたシミュレーション
- [ ] すべてのレベルで60fps維持

---

## Phase 7.3: テスト整備（3ステップ）

### Step 7.3.1: ユニットテストの完全カバレッジ

**見積もり**: 2時間

**ファイル**: `src/lib/features/**/__tests__/*.test.ts`（複数ファイル）

**実装内容**:

主要な機能のユニットテストを作成します。

#### zoom.test.ts
```typescript
import { describe, it, expect } from 'vitest'
import { ZoomLevel, getChunkSize, ALL_ZOOM_LEVELS } from '$lib/types/zoom'
import { getTimeScale } from '$lib/features/zoom/timeScale'
import { getZoomLevelMetadata } from '$lib/features/zoom/constants'

describe('ZoomLevel', () => {
  it('should have 14 levels', () => {
    expect(ALL_ZOOM_LEVELS).toHaveLength(14)
  })

  it('should calculate chunk sizes correctly', () => {
    expect(getChunkSize(ZoomLevel.COSMOS)).toBe(13) // fibonacci(3)
    expect(getChunkSize(ZoomLevel.CITY)).toBe(34) // fibonacci(8)
    expect(getChunkSize(ZoomLevel.QUANTUM)).toBe(4181) // fibonacci(18)
  })

  it('should have metadata for all levels', () => {
    for (const level of ALL_ZOOM_LEVELS) {
      const metadata = getZoomLevelMetadata(level)
      expect(metadata).toBeDefined()
      expect(metadata.name).toBeTruthy()
      expect(metadata.wavelength).toBeGreaterThanOrEqual(380)
      expect(metadata.wavelength).toBeLessThanOrEqual(780)
    }
  })

  it('should have correct time scales', () => {
    expect(getTimeScale(ZoomLevel.COSMOS)).toBe(1000000)
    expect(getTimeScale(ZoomLevel.CITY)).toBe(1)
    expect(getTimeScale(ZoomLevel.QUANTUM)).toBe(0.05)
  })
})
```

#### MultiResolutionGrid.test.ts
```typescript
import { describe, it, expect, beforeEach } from 'vitest'
import { MultiResolutionGrid } from '$lib/features/zoom/MultiResolutionGrid'
import { ZoomLevel } from '$lib/types/zoom'

describe('MultiResolutionGrid', () => {
  let grid: MultiResolutionGrid

  beforeEach(() => {
    grid = new MultiResolutionGrid(ZoomLevel.CITY)
  })

  it('should initialize with CITY level', () => {
    expect(grid.currentLevel).toBe(ZoomLevel.CITY)
  })

  it('should set zoom level', () => {
    grid.setZoomLevel(ZoomLevel.SOLAR)
    expect(grid.currentLevel).toBe(ZoomLevel.SOLAR)
  })

  it('should aggregate grid when zooming out', () => {
    const currentGrid = new Map([
      ['0,0', 1],
      ['0,1', 1],
      ['1,0', 1],
      ['1,1', 0]
    ])

    grid.updateCurrentGrid(currentGrid)
    grid.setZoomLevel(ZoomLevel.CONTINENT) // Zoom out

    const aggregatedGrid = grid.getCurrentGrid()
    expect(aggregatedGrid.size).toBeGreaterThan(0)
  })

  it('should subdivide grid when zooming in', () => {
    const currentGrid = new Map([
      ['0,0', 1]
    ])

    grid.updateCurrentGrid(currentGrid)
    grid.setZoomLevel(ZoomLevel.STREET) // Zoom in

    const subdividedGrid = grid.getCurrentGrid()
    expect(subdividedGrid.size).toBeGreaterThan(currentGrid.size)
  })
})
```

#### QuantumLifeEngine.test.ts
```typescript
import { describe, it, expect } from 'vitest'
import { QuantumLifeEngine } from '$lib/features/lifegame/QuantumLifeEngine'
import { ZoomLevel } from '$lib/types/zoom'

describe('QuantumLifeEngine', () => {
  it('should apply Conway rules for stable patterns', () => {
    const engine = new QuantumLifeEngine(0)

    // ブロック（安定パターン）
    const block = new Map([
      ['0,0', 1],
      ['0,1', 1],
      ['1,0', 1],
      ['1,1', 1]
    ])

    const nextGen = engine.nextGeneration(block, ZoomLevel.CITY)

    expect(nextGen.get('0,0')).toBe(1)
    expect(nextGen.get('0,1')).toBe(1)
    expect(nextGen.get('1,0')).toBe(1)
    expect(nextGen.get('1,1')).toBe(1)
  })

  it('should apply quantum entanglement', () => {
    const engine = new QuantumLifeEngine(0.5)

    const grid = new Map([
      ['0,0', 1],
      ['0,1', 1],
      ['1,0', 1]
    ])

    // 量子もつれで結果が変わる可能性がある
    const results = new Set()

    for (let i = 0; i < 100; i++) {
      const nextGen = engine.nextGeneration(grid, ZoomLevel.CITY)
      results.add(nextGen.size)
    }

    // 複数の異なる結果が得られるはず
    expect(results.size).toBeGreaterThan(1)
  })
})
```

**カバレッジ目標**: 80%以上

```bash
npm run test -- --coverage
```

**チェックポイント**:
- [ ] すべての主要クラスにテスト作成
- [ ] エッジケースをカバー
- [ ] カバレッジ80%以上
- [ ] すべてのテストが通過

---

### Step 7.3.2: 統合テスト実装

**見積もり**: 1時間30分

**ファイル**: `src/lib/__tests__/integration.test.ts`

**実装内容**:

```typescript
import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { get } from 'svelte/store'
import { viewportStore } from '$lib/stores/viewportStore'
import { hierarchicalGridStore } from '$lib/stores/hierarchicalGridStore'
import { ZoomLevel } from '$lib/types/zoom'

describe('Integration Tests', () => {
  beforeEach(() => {
    viewportStore.reset()
    hierarchicalGridStore.initialize()
  })

  afterEach(() => {
    hierarchicalGridStore.destroy()
  })

  it('should synchronize viewport and grid stores', () => {
    hierarchicalGridStore.setZoomLevel(ZoomLevel.SOLAR)

    const viewport = get(viewportStore)
    expect(viewport.zoomLevel).toBe(ZoomLevel.SOLAR)
  })

  it('should update grid when stepping', async () => {
    const initialStepCount = get(hierarchicalGridStore).stepCount

    await hierarchicalGridStore.step()

    const newStepCount = get(hierarchicalGridStore).stepCount
    expect(newStepCount).toBe(initialStepCount + 1)
  })

  it('should handle zoom level transitions', () => {
    const levels = [
      ZoomLevel.COSMOS,
      ZoomLevel.CITY,
      ZoomLevel.QUANTUM
    ]

    for (const level of levels) {
      hierarchicalGridStore.setZoomLevel(level)

      const grid = get(hierarchicalGridStore).multiResolutionGrid
      expect(grid?.currentLevel).toBe(level)

      const viewport = get(viewportStore)
      expect(viewport.zoomLevel).toBe(level)
    }
  })

  it('should maintain state through play/pause cycles', async () => {
    hierarchicalGridStore.setPlaying(true)
    expect(get(hierarchicalGridStore).isPlaying).toBe(true)

    await hierarchicalGridStore.step()
    const stepAfterPlay = get(hierarchicalGridStore).stepCount

    hierarchicalGridStore.setPlaying(false)
    expect(get(hierarchicalGridStore).isPlaying).toBe(false)

    // ステップ数は保持されている
    expect(get(hierarchicalGridStore).stepCount).toBe(stepAfterPlay)
  })

  it('should reset to initial state', () => {
    hierarchicalGridStore.setZoomLevel(ZoomLevel.QUANTUM)
    hierarchicalGridStore.setPlaying(true)

    hierarchicalGridStore.reset()

    const state = get(hierarchicalGridStore)
    expect(state.stepCount).toBe(0)
    expect(state.isPlaying).toBe(false)

    const viewport = get(viewportStore)
    expect(viewport.centerX).toBe(0)
    expect(viewport.centerY).toBe(0)
  })
})
```

**テスト実行**:

```bash
npm run test integration
```

**チェックポイント**:
- [ ] Store間の連携テスト
- [ ] 状態遷移テスト
- [ ] リセット機能テスト
- [ ] すべての統合テストが通過

---

### Step 7.3.3: モバイル・実機テスト

**見積もり**: 1時間

**テスト項目**:

#### デバイス一覧

- [ ] iPhone 13/14（iOS Safari）
- [ ] iPad Pro（iOS Safari）
- [ ] Android スマートフォン（Chrome）
- [ ] Android タブレット（Chrome）

#### 機能テスト

**タッチ操作**:
- [ ] シングルタップ（再生/停止）
- [ ] ダブルタップ（ズームイン）
- [ ] ピンチズーム（ズームイン/アウト）
- [ ] スワイプ（パン操作）
- [ ] 2本指スワイプ（パン操作）

**パフォーマンス**:
- [ ] 初期ロード時間 < 3秒
- [ ] FPS: 30fps以上（モバイル）
- [ ] メモリ使用量 < 200MB
- [ ] バッテリー消費: 1時間で < 20%

**レイアウト**:
- [ ] ポートレートモード対応
- [ ] ランドスケープモード対応
- [ ] UI要素が正しく配置されている
- [ ] テキストが読みやすい

**ブラウザ互換性**:
- [ ] iOS Safari 15+
- [ ] Chrome for Android 100+
- [ ] Samsung Internet

**問題が見つかった場合**:

1. Chrome DevToolsのRemote Debuggingで調査
2. パフォーマンスプロファイリング
3. 必要に応じて最適化

---

## Phase 7完了: 最終確認とパフォーマンステスト

### Phase 7完了: 最終確認

**見積もり**: 1時間30分

**確認項目**:

#### 機能要件

- [ ] 14段階のズームレベルがすべて動作
- [ ] パン操作がスムーズ（マウス、タッチ）
- [ ] ズーム操作がスムーズ（ホイール、ピンチ）
- [ ] レベル切替が200ms以下
- [ ] 再生/停止が正しく動作
- [ ] リセット機能が動作
- [ ] UI表示が正確（レベル名、ステップ数、スペクトラムバー）

#### 非機能要件

**パフォーマンス**:
```bash
# Chrome DevToolsで測定
# Performance タブ → Record → 30秒間操作 → Stop
```

- [ ] FPS: 60fps維持（デスクトップ）
- [ ] FPS: 30fps以上（モバイル）
- [ ] レベル切替レイテンシ: < 200ms
- [ ] メモリ使用量: < 500MB（デスクトップ）
- [ ] メモリ使用量: < 200MB（モバイル）
- [ ] メモリリークなし（1時間実行後）

**品質**:
- [ ] TypeScript型エラーなし
- [ ] ESLintエラーなし
- [ ] ユニットテストカバレッジ > 80%
- [ ] すべての統合テストが通過

**体験**:
- [ ] 各ズームレベルで視覚的に区別できる
- [ ] 色彩が美しい
- [ ] アニメーションが滑らか
- [ ] 操作が直感的

#### ドキュメント

- [ ] README.md更新（使い方ガイド）
- [ ] 主要クラスにJSDocコメント
- [ ] 設計ドキュメント最終確認

**完了後のコミット**:

```bash
git add .
git commit -m "feat: Phase 7 - 最適化とテスト整備完了

- WebWorker導入でメインスレッドブロック解消
- メモリプーリングで使用量削減
- 描画バッチングで60fps維持
- レベル別の視覚調整完了
- ユニットテスト・統合テスト整備
- モバイル対応確認

🤖 Generated with [Claude Code](https://claude.com/claude-code)

Co-Authored-By: Claude <noreply@anthropic.com>"
```

---

## 作成・更新されるファイル一覧

```
src/
  workers/
    types.ts                                     # Step 7.1.1（新規）
    lifegame.worker.ts                           # Step 7.1.1-7.1.2（新規）
  lib/
    workers/
      WorkerPool.ts                              # Step 7.1.2（新規）
    utils/
      MemoryPool.ts                              # Step 7.1.3（新規）
    pixi/
      HierarchicalLifeRenderer.ts                # Step 7.1.4（更新）
    features/
      zoom/
        constants.ts                             # Step 7.2.1（更新）
        timeScale.ts                             # Step 7.2.4（更新）
        SpectrumColorSystem.ts                   # Step 7.2.3（更新）
      lifegame/
        QuantumLifeEngine.ts                     # Step 7.2.2（更新）
        __tests__/
          *.test.ts                              # Step 7.3.1（新規）
      zoom/
        __tests__/
          *.test.ts                              # Step 7.3.1（新規）
    stores/
      hierarchicalGridStore.ts                   # Step 7.1.2（更新）
    __tests__/
      integration.test.ts                        # Step 7.3.2（新規）
    components/
      LifeCanvas.svelte                          # Step 7.2.4（更新）
```

---

## パフォーマンス最適化のまとめ

### 実装した最適化

1. **WebWorker導入**: シミュレーション計算をメインスレッドから分離
2. **WorkerPool**: 複数ワーカーで並列計算
3. **メモリプーリング**: オブジェクトの再利用でGC負荷削減
4. **描画バッチング**: スプライトプールで描画オーバーヘッド削減
5. **ビューポートカリング**: 画面外のセルは描画しない
6. **差分更新**: 変更があったセルのみ更新

### 期待される効果

- **FPS**: 30fps → 60fps（デスクトップ）
- **メモリ**: 1GB → 500MB以下
- **レスポンス**: UI操作が即座に反応
- **バッテリー**: モバイルでの消費削減

---

## 次のステップ

Phase 7完了後、リリース準備に進みます:

1. **GitHub Pagesへのデプロイ**
2. **リリースノート作成**
3. **ユーザーフィードバック収集**
4. **継続的な改善**

---

最終更新: 2025-11-09

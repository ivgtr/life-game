# Phase 4 全ステップガイド

このファイルはPhase 4の全10ステップの概要と実装ガイドです。

---

## Phase 4.1: CameraController実装（4ステップ）

### Step 4.1.1: CameraController基本構造とビューポート管理

**見積もり**: 40分

**ファイル**: `src/lib/features/zoom/CameraController.ts`

**実装内容**:
```typescript
import { ZoomLevel } from '$lib/types/zoom'
import type { Viewport } from '$lib/pixi/HierarchicalLifeRenderer'
import type { MultiResolutionGrid } from './MultiResolutionGrid'

/**
 * カメラコントローラー
 * ビューポートとズームレベルを管理
 */
export class CameraController {
  private viewport: Viewport
  private grid: MultiResolutionGrid

  // ズーム範囲
  private readonly MIN_ZOOM = ZoomLevel.COSMOS
  private readonly MAX_ZOOM = ZoomLevel.QUANTUM

  constructor(grid: MultiResolutionGrid, initialViewport: Viewport) {
    this.grid = grid
    this.viewport = { ...initialViewport }
  }

  /**
   * ビューポートを取得
   */
  getViewport(): Viewport {
    return { ...this.viewport }
  }

  /**
   * ビューポートを更新
   */
  updateViewport(updates: Partial<Viewport>): void {
    this.viewport = { ...this.viewport, ...updates }
  }

  /**
   * セルサイズを計算
   * ズームレベルに応じて動的に変更
   */
  private calculateCellSize(): number {
    const baseSize = 10 // 基準サイズ

    // ズームレベルに応じた倍率
    // STANDARD(3) = 1.0倍
    const levelDiff = this.viewport.zoomLevel - ZoomLevel.STANDARD
    const scale = Math.pow(1.2, levelDiff)

    return baseSize * scale
  }
}
```

**チェックポイント**:
- [ ] クラス定義
- [ ] ビューポート管理
- [ ] セルサイズ計算

---

### Step 4.1.2: ズーム操作（zoomIn/zoomOut/setZoomLevel）

**見積もり**: 50分

**実装内容**（CameraController.tsに追加）:
```typescript
/**
 * ズームイン（1レベル）
 */
zoomIn(): void {
  const newLevel = Math.min(
    this.viewport.zoomLevel + 1,
    this.MAX_ZOOM
  ) as ZoomLevel

  this.setZoomLevel(newLevel)
}

/**
 * ズームアウト（1レベル）
 */
zoomOut(): void {
  const newLevel = Math.max(
    this.viewport.zoomLevel - 1,
    this.MIN_ZOOM
  ) as ZoomLevel

  this.setZoomLevel(newLevel)
}

/**
 * ズームレベルを設定
 * グリッドとビューポートの両方を更新
 */
setZoomLevel(level: ZoomLevel): void {
  if (level === this.viewport.zoomLevel) return

  // レベル範囲チェック
  if (level < this.MIN_ZOOM || level > this.MAX_ZOOM) {
    console.warn(`Zoom level ${level} is out of range`)
    return
  }

  // グリッドのレベル変更
  this.grid.setZoomLevel(level)

  // ビューポート更新
  this.viewport.zoomLevel = level
  this.viewport.displayCellSize = this.calculateCellSize()
}

/**
 * マウス位置を中心にズーム
 * @param mouseX スクリーン座標X
 * @param mouseY スクリーン座標Y
 * @param direction 1=ズームイン, -1=ズームアウト
 */
zoomAt(mouseX: number, mouseY: number, direction: 1 | -1): void {
  // マウス位置のワールド座標を計算
  const worldX = this.screenToWorldX(mouseX)
  const worldY = this.screenToWorldY(mouseY)

  // ズーム実行
  if (direction > 0) {
    this.zoomIn()
  } else {
    this.zoomOut()
  }

  // マウス位置がズーム後も同じスクリーン座標になるように調整
  const newWorldX = this.screenToWorldX(mouseX)
  const newWorldY = this.screenToWorldY(mouseY)

  this.viewport.centerX += worldX - newWorldX
  this.viewport.centerY += worldY - newWorldY
}

/**
 * スクリーン座標 → ワールド座標 X
 */
private screenToWorldX(screenX: number): number {
  const { centerX, width, displayCellSize } = this.viewport
  return centerX + (screenX - width / 2) / displayCellSize
}

/**
 * スクリーン座標 → ワールド座標 Y
 */
private screenToWorldY(screenY: number): number {
  const { centerY, height, displayCellSize } = this.viewport
  return centerY + (screenY - height / 2) / displayCellSize
}
```

**チェックポイント**:
- [ ] zoomIn/zoomOut実装
- [ ] setZoomLevel実装
- [ ] zoomAt（マウス位置中心）実装
- [ ] 座標変換実装

---

### Step 4.1.3: パン操作（pan）

**見積もり**: 30分

**実装内容**（CameraController.tsに追加）:
```typescript
/**
 * パン移動
 * @param deltaX ワールド座標での移動量X
 * @param deltaY ワールド座標での移動量Y
 */
pan(deltaX: number, deltaY: number): void {
  this.viewport.centerX += deltaX
  this.viewport.centerY += deltaY
}

/**
 * スクリーン座標でのパン移動
 * @param screenDeltaX スクリーン座標での移動量X
 * @param screenDeltaY スクリーン座標での移動量Y
 */
panScreen(screenDeltaX: number, screenDeltaY: number): void {
  const { displayCellSize } = this.viewport

  // スクリーン移動量をワールド移動量に変換
  const worldDeltaX = -screenDeltaX / displayCellSize
  const worldDeltaY = -screenDeltaY / displayCellSize

  this.pan(worldDeltaX, worldDeltaY)
}

/**
 * 指定座標に移動
 */
moveTo(worldX: number, worldY: number): void {
  this.viewport.centerX = worldX
  this.viewport.centerY = worldY
}

/**
 * スムーズに移動（アニメーション）
 * @param targetX 目標ワールド座標X
 * @param targetY 目標ワールド座標Y
 * @param duration 移動時間（ミリ秒）
 */
animateTo(
  targetX: number,
  targetY: number,
  duration: number = 500
): Promise<void> {
  return new Promise((resolve) => {
    const startX = this.viewport.centerX
    const startY = this.viewport.centerY
    const startTime = performance.now()

    const animate = (currentTime: number) => {
      const elapsed = currentTime - startTime
      const progress = Math.min(elapsed / duration, 1)

      // イージング（ease-in-out）
      const eased =
        progress < 0.5
          ? 2 * progress * progress
          : 1 - Math.pow(-2 * progress + 2, 2) / 2

      this.viewport.centerX = startX + (targetX - startX) * eased
      this.viewport.centerY = startY + (targetY - startY) * eased

      if (progress < 1) {
        requestAnimationFrame(animate)
      } else {
        resolve()
      }
    }

    requestAnimationFrame(animate)
  })
}
```

**チェックポイント**:
- [ ] pan実装
- [ ] panScreen実装
- [ ] animateTo実装
- [ ] スムーズ移動動作

---

### Step 4.1.4: リセット機能（reset）

**見積もり**: 20分

**実装内容**（CameraController.tsに追加）:
```typescript
/**
 * ビューポートをリセット
 * 原点（0, 0）、STANDARDレベルに戻る
 */
reset(): void {
  this.viewport.centerX = 0
  this.viewport.centerY = 0
  this.setZoomLevel(ZoomLevel.STANDARD)
}

/**
 * スムーズにリセット
 */
async resetSmooth(): Promise<void> {
  await this.animateTo(0, 0, 500)
  this.setZoomLevel(ZoomLevel.STANDARD)
}
```

**チェックポイント**:
- [ ] reset実装
- [ ] resetSmooth実装

---

## Phase 4.2: 入力ハンドリング（5ステップ）

### Step 4.2.1: InputHandler基本構造

**見積もり**: 30分

**ファイル**: `src/lib/features/zoom/InputHandler.ts`

**実装内容**:
```typescript
import type { CameraController } from './CameraController'

/**
 * 入力ハンドラー
 * マウス、タッチ、キーボード入力を管理
 */
export class InputHandler {
  private camera: CameraController
  private canvas: HTMLCanvasElement

  // ドラッグ状態
  private isDragging = false
  private lastMouseX = 0
  private lastMouseY = 0

  // タッチ状態
  private touches: Touch[] = []
  private lastPinchDistance = 0

  constructor(camera: CameraController, canvas: HTMLCanvasElement) {
    this.camera = camera
    this.canvas = canvas
  }

  /**
   * イベントリスナーを登録
   */
  attach(): void {
    // マウスイベント
    this.canvas.addEventListener('mousedown', this.handleMouseDown)
    this.canvas.addEventListener('mousemove', this.handleMouseMove)
    this.canvas.addEventListener('mouseup', this.handleMouseUp)
    this.canvas.addEventListener('wheel', this.handleWheel, { passive: false })
    this.canvas.addEventListener('dblclick', this.handleDoubleClick)

    // タッチイベント
    this.canvas.addEventListener('touchstart', this.handleTouchStart, {
      passive: false,
    })
    this.canvas.addEventListener('touchmove', this.handleTouchMove, {
      passive: false,
    })
    this.canvas.addEventListener('touchend', this.handleTouchEnd)

    // キーボードイベント
    window.addEventListener('keydown', this.handleKeyDown)
  }

  /**
   * イベントリスナーを解除
   */
  detach(): void {
    this.canvas.removeEventListener('mousedown', this.handleMouseDown)
    this.canvas.removeEventListener('mousemove', this.handleMouseMove)
    this.canvas.removeEventListener('mouseup', this.handleMouseUp)
    this.canvas.removeEventListener('wheel', this.handleWheel)
    this.canvas.removeEventListener('dblclick', this.handleDoubleClick)

    this.canvas.removeEventListener('touchstart', this.handleTouchStart)
    this.canvas.removeEventListener('touchmove', this.handleTouchMove)
    this.canvas.removeEventListener('touchend', this.handleTouchEnd)

    window.removeEventListener('keydown', this.handleKeyDown)
  }
}
```

**チェックポイント**:
- [ ] クラス定義
- [ ] attach/detach実装
- [ ] イベントリスナー登録

---

### Step 4.2.2: マウスイベント（ドラッグ、ホイール）

**見積もり**: 50分

**実装内容**（InputHandler.tsに追加）:
```typescript
/**
 * マウスダウン
 */
private handleMouseDown = (e: MouseEvent): void => {
  this.isDragging = true
  this.lastMouseX = e.clientX
  this.lastMouseY = e.clientY
  this.canvas.style.cursor = 'grabbing'
}

/**
 * マウス移動
 */
private handleMouseMove = (e: MouseEvent): void => {
  if (!this.isDragging) return

  const deltaX = e.clientX - this.lastMouseX
  const deltaY = e.clientY - this.lastMouseY

  this.camera.panScreen(deltaX, deltaY)

  this.lastMouseX = e.clientX
  this.lastMouseY = e.clientY
}

/**
 * マウスアップ
 */
private handleMouseUp = (): void => {
  this.isDragging = false
  this.canvas.style.cursor = 'grab'
}

/**
 * マウスホイール
 */
private handleWheel = (e: WheelEvent): void => {
  e.preventDefault()

  const direction = e.deltaY > 0 ? -1 : 1
  this.camera.zoomAt(e.clientX, e.clientY, direction as 1 | -1)
}

/**
 * ダブルクリック
 */
private handleDoubleClick = (e: MouseEvent): void => {
  if (e.shiftKey) {
    this.camera.zoomOut()
  } else {
    this.camera.zoomIn()
  }
}
```

**チェックポイント**:
- [ ] ドラッグ実装
- [ ] ホイールズーム実装
- [ ] ダブルクリックズーム実装

---

### Step 4.2.3: タッチイベント（スワイプ、ピンチ）

**見積もり**: 60分

**実装内容**（InputHandler.tsに追加）:
```typescript
/**
 * タッチ開始
 */
private handleTouchStart = (e: TouchEvent): void => {
  e.preventDefault()

  this.touches = Array.from(e.touches)

  if (this.touches.length === 2) {
    // ピンチズーム開始
    this.lastPinchDistance = this.getPinchDistance()
  } else if (this.touches.length === 1) {
    // パン開始
    this.lastMouseX = this.touches[0].clientX
    this.lastMouseY = this.touches[0].clientY
  }
}

/**
 * タッチ移動
 */
private handleTouchMove = (e: TouchEvent): void => {
  e.preventDefault()

  this.touches = Array.from(e.touches)

  if (this.touches.length === 2) {
    // ピンチズーム
    const currentDistance = this.getPinchDistance()
    const delta = currentDistance - this.lastPinchDistance

    if (Math.abs(delta) > 5) {
      const centerX = (this.touches[0].clientX + this.touches[1].clientX) / 2
      const centerY = (this.touches[0].clientY + this.touches[1].clientY) / 2

      const direction = delta > 0 ? 1 : -1
      this.camera.zoomAt(centerX, centerY, direction as 1 | -1)

      this.lastPinchDistance = currentDistance
    }
  } else if (this.touches.length === 1) {
    // パン
    const deltaX = this.touches[0].clientX - this.lastMouseX
    const deltaY = this.touches[0].clientY - this.lastMouseY

    this.camera.panScreen(deltaX, deltaY)

    this.lastMouseX = this.touches[0].clientX
    this.lastMouseY = this.touches[0].clientY
  }
}

/**
 * タッチ終了
 */
private handleTouchEnd = (e: TouchEvent): void => {
  this.touches = Array.from(e.touches)

  if (this.touches.length < 2) {
    this.lastPinchDistance = 0
  }
}

/**
 * ピンチ距離を計算
 */
private getPinchDistance(): number {
  if (this.touches.length < 2) return 0

  const dx = this.touches[0].clientX - this.touches[1].clientX
  const dy = this.touches[0].clientY - this.touches[1].clientY

  return Math.sqrt(dx * dx + dy * dy)
}
```

**チェックポイント**:
- [ ] タッチスワイプ実装
- [ ] ピンチズーム実装
- [ ] マルチタッチ対応

---

### Step 4.2.4: キーボードイベント（矢印、+/-、0）

**見積もり**: 30分

**実装内容**（InputHandler.tsに追加）:
```typescript
/**
 * キーボード入力
 */
private handleKeyDown = (e: KeyboardEvent): void => {
  const panAmount = 10 // セル単位

  switch (e.key) {
    case 'ArrowUp':
      e.preventDefault()
      this.camera.pan(0, -panAmount)
      break

    case 'ArrowDown':
      e.preventDefault()
      this.camera.pan(0, panAmount)
      break

    case 'ArrowLeft':
      e.preventDefault()
      this.camera.pan(-panAmount, 0)
      break

    case 'ArrowRight':
      e.preventDefault()
      this.camera.pan(panAmount, 0)
      break

    case '+':
    case '=':
      e.preventDefault()
      this.camera.zoomIn()
      break

    case '-':
    case '_':
      e.preventDefault()
      this.camera.zoomOut()
      break

    case '0':
      e.preventDefault()
      this.camera.reset()
      break

    // Spaceはsimulationの再生/停止（別途実装）
  }
}
```

**チェックポイント**:
- [ ] 矢印キー実装
- [ ] +/-キー実装
- [ ] 0キー（リセット）実装

---

### Step 4.2.5: LifeCanvasへの統合

**見積もり**: 40分

**ファイル**: `src/lib/components/LifeCanvas.svelte`（更新）

**実装内容**:
```svelte
<script lang="ts">
  import { onMount, onDestroy } from 'svelte'
  import { HierarchicalLifeRenderer } from '$lib/pixi/HierarchicalLifeRenderer'
  import { CameraController } from '$lib/features/zoom/CameraController'
  import { InputHandler } from '$lib/features/zoom/InputHandler'
  // ... その他のインポート

  let canvasElement: HTMLCanvasElement
  let renderer: HierarchicalLifeRenderer | null = null
  let camera: CameraController | null = null
  let inputHandler: InputHandler | null = null

  onMount(() => {
    // レンダラー初期化
    renderer = new HierarchicalLifeRenderer(
      canvasElement,
      window.innerWidth,
      window.innerHeight
    )

    // カメラ初期化
    camera = new CameraController(
      multiResolutionGrid, // 実際にはstoreから取得
      renderer.getViewport()
    )

    // 入力ハンドラー初期化
    inputHandler = new InputHandler(camera, canvasElement)
    inputHandler.attach()

    // アニメーションループ
    const animate = () => {
      if (renderer && camera) {
        const viewport = camera.getViewport()
        renderer.setViewport(viewport)

        // ... 描画処理
      }

      requestAnimationFrame(animate)
    }

    animate()

    return () => {
      if (inputHandler) {
        inputHandler.detach()
      }
    }
  })

  onDestroy(() => {
    // ... クリーンアップ
  })
</script>

<canvas
  bind:this={canvasElement}
  class="fixed inset-0"
  style="cursor: grab;"
></canvas>
```

**チェックポイント**:
- [ ] CameraController統合
- [ ] InputHandler統合
- [ ] ビューポート同期
- [ ] すべての操作が動作

---

## Phase 4完了: 統合テスト（1ステップ）

### Step 4.3.1: Phase 4完了テスト

**見積もり**: 45分

**手動テスト項目**:

**マウス操作**:
- [ ] ドラッグでパン移動
- [ ] ホイールでズーム
- [ ] マウス位置中心にズーム
- [ ] ダブルクリックでズームイン
- [ ] Shift+ダブルクリックでズームアウト

**タッチ操作**（実機テスト）:
- [ ] 1本指スワイプでパン
- [ ] 2本指ピンチでズーム
- [ ] ダブルタップでズームイン

**キーボード操作**:
- [ ] 矢印キーでパン
- [ ] +/-でズーム
- [ ] 0でリセット

**統合テスト**:
- [ ] スムーズな動作
- [ ] 60fps維持
- [ ] エッジケースで問題なし
- [ ] モバイルで動作

---

## Phase 4完了後のアクション

- [ ] すべてのステップのチェックボックスを確認
- [ ] TypeScriptのビルドエラーがないことを確認
- [ ] すべての操作が快適に動作することを確認
- [ ] モバイル実機テスト実施
- [ ] コミット: `feat: Phase 4 - インタラクションシステム実装`

---

## 作成されるファイル一覧

```
src/lib/
  features/
    zoom/
      CameraController.ts                        # 新規作成
      InputHandler.ts                            # 新規作成
      __tests__/
        CameraController.test.ts                 # 新規作成（オプション）
  components/
    LifeCanvas.svelte                            # 更新
```

---

## 次のPhase

オプション: [Phase 5: 音響システム](../phase-5/README.md)
または: [Phase 6: UI+状態管理](../phase-6/README.md)

---

最終更新: 2025-11-09

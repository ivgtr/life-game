# Phase 3 全ステップガイド

このファイルはPhase 3の全11ステップの概要と実装ガイドです。

---

## Phase 3.1: HierarchicalLifeRenderer実装（4ステップ）

### Step 3.1.1: HierarchicalLifeRenderer基本構造

**見積もり**: 40分

**ファイル**: `src/lib/pixi/HierarchicalLifeRenderer.ts`

**実装内容**:
```typescript
import { Application, Graphics } from 'pixi.js'
import type { ZoomLevel } from '$lib/types/zoom'
import type { CellState } from '$lib/types/lifegame'

/**
 * ビューポート定義
 */
export interface Viewport {
  centerX: number        // グローバル座標X
  centerY: number        // グローバル座標Y
  zoomLevel: ZoomLevel   // 現在のズームレベル
  width: number          // 画面幅（px）
  height: number         // 画面高さ（px）
  displayCellSize: number // セル表示サイズ（px）
}

/**
 * 描画範囲
 */
export interface Bounds {
  minX: number
  maxX: number
  minY: number
  maxY: number
}

/**
 * 階層的ライフゲームレンダラー
 */
export class HierarchicalLifeRenderer {
  private app: Application
  private graphics: Graphics
  private viewport: Viewport

  constructor(canvas: HTMLCanvasElement, width: number, height: number) {
    this.app = new Application()
    this.graphics = new Graphics()

    this.viewport = {
      centerX: 0,
      centerY: 0,
      zoomLevel: 3, // ZoomLevel.STANDARD
      width,
      height,
      displayCellSize: 10,
    }

    this.init(canvas, width, height).catch(console.error)
  }

  /**
   * 初期化
   */
  private async init(canvas: HTMLCanvasElement, width: number, height: number) {
    await this.app.init({
      canvas,
      width,
      height,
      backgroundColor: 0x0a1a2f,
      resolution: window.devicePixelRatio || 1,
      autoDensity: true,
    })

    this.app.stage.addChild(this.graphics)
  }

  /**
   * ビューポートを設定
   */
  setViewport(viewport: Partial<Viewport>): void {
    this.viewport = { ...this.viewport, ...viewport }
  }

  /**
   * ビューポートを取得
   */
  getViewport(): Viewport {
    return { ...this.viewport }
  }

  /**
   * リサイズ
   */
  resize(width: number, height: number): void {
    this.app.renderer.resize(width, height)
    this.viewport.width = width
    this.viewport.height = height
  }

  /**
   * リソース解放
   */
  destroy(): void {
    this.app.destroy(true)
  }
}
```

**チェックポイント**:
- [ ] クラス定義
- [ ] Viewportインターフェース定義
- [ ] 基本メソッド実装
- [ ] PixiJS初期化

---

### Step 3.1.2: ビューポート計算（calculateVisibleBounds）

**見積もり**: 30分

**実装内容**（HierarchicalLifeRenderer.tsに追加）:
```typescript
/**
 * 可視範囲を計算
 */
calculateVisibleBounds(): Bounds {
  const { centerX, centerY, width, height, displayCellSize } = this.viewport

  // 画面に表示される範囲（セル単位）
  const visibleWidth = Math.ceil(width / displayCellSize)
  const visibleHeight = Math.ceil(height / displayCellSize)

  const halfWidth = Math.ceil(visibleWidth / 2)
  const halfHeight = Math.ceil(visibleHeight / 2)

  return {
    minX: Math.floor(centerX - halfWidth),
    maxX: Math.ceil(centerX + halfWidth),
    minY: Math.floor(centerY - halfHeight),
    maxY: Math.ceil(centerY + halfHeight),
  }
}

/**
 * バッファ付き範囲を計算
 * 画面外の少し先まで計算対象にする
 */
calculateActiveBounds(bufferSize = 20): Bounds {
  const visible = this.calculateVisibleBounds()

  return {
    minX: visible.minX - bufferSize,
    maxX: visible.maxX + bufferSize,
    minY: visible.minY - bufferSize,
    maxY: visible.maxY + bufferSize,
  }
}
```

**チェックポイント**:
- [ ] 可視範囲計算が正しい
- [ ] バッファ領域計算実装
- [ ] エッジケース対応

---

### Step 3.1.3: レベル別描画ロジック（renderGrid）

**見積もり**: 60分

**実装内容**（HierarchicalLifeRenderer.tsに追加）:
```typescript
/**
 * グリッドを描画
 */
render(grid: Map<string, CellState>, baseColor: number): void {
  const bounds = this.calculateVisibleBounds()
  const { centerX, centerY, width, height, displayCellSize } = this.viewport

  // 描画クリア
  this.graphics.clear()

  // グリッドを描画
  for (let y = bounds.minY; y <= bounds.maxY; y++) {
    for (let x = bounds.minX; x <= bounds.maxX; x++) {
      const key = `${x},${y}`
      const state = grid.get(key) ?? 0

      if (state === 1) {
        // ワールド座標 → スクリーン座標
        const screenX = (x - centerX) * displayCellSize + width / 2
        const screenY = (y - centerY) * displayCellSize + height / 2

        this.drawCell(screenX, screenY, displayCellSize, baseColor)
      }
    }
  }
}

/**
 * セルを描画
 */
private drawCell(x: number, y: number, size: number, color: number): void {
  const margin = Math.max(1, size * 0.1)

  this.graphics
    .rect(
      x + margin / 2,
      y + margin / 2,
      size - margin,
      size - margin
    )
    .fill(color)
}
```

**チェックポイント**:
- [ ] 座標変換が正しい
- [ ] 可視範囲のみ描画
- [ ] セル描画が美しい

---

### Step 3.1.4: カリング最適化

**見積もり**: 30分

**実装内容**（HierarchicalLifeRenderer.tsに追加）:
```typescript
/**
 * 最適化された描画
 * 可視範囲外は完全にスキップ
 */
renderOptimized(grid: Map<string, CellState>, baseColor: number): void {
  const bounds = this.calculateVisibleBounds()
  const { centerX, centerY, width, height, displayCellSize } = this.viewport

  // 描画クリア
  this.graphics.clear()

  // グリッド内の生存セルのみ処理
  for (const [key, state] of grid) {
    if (state !== 1) continue

    const [x, y] = key.split(',').map(Number)

    // カリング: 可視範囲外ならスキップ
    if (x < bounds.minX || x > bounds.maxX || y < bounds.minY || y > bounds.maxY) {
      continue
    }

    // スクリーン座標
    const screenX = (x - centerX) * displayCellSize + width / 2
    const screenY = (y - centerY) * displayCellSize + height / 2

    this.drawCell(screenX, screenY, displayCellSize, baseColor)
  }
}

/**
 * renderをrenderOptimizedに置き換え
 */
// render = this.renderOptimized
```

**チェックポイント**:
- [ ] カリング実装
- [ ] パフォーマンス改善確認
- [ ] 正しく描画される

---

## Phase 3.2: SpectrumColorSystem実装（4ステップ）

### Step 3.2.1: SpectrumColorSystem基本構造

**見積もり**: 30分

**ファイル**: `src/lib/features/zoom/SpectrumColorSystem.ts`

**実装内容**:
```typescript
import { ZoomLevel } from '$lib/types/zoom'

/**
 * スペクトラムカラーシステム
 * ズームレベルに応じたレインボーグラデーション
 */
export class SpectrumColorSystem {
  /**
   * ズームレベルに対応する色を取得
   *
   * COSMOS(紫 270°) → STANDARD(緑 120°) → QUANTUM(赤 0°)
   */
  getColorForLevel(level: ZoomLevel): number {
    // -5..8 → 0..1
    const normalized =
      (level - ZoomLevel.COSMOS) / (ZoomLevel.QUANTUM - ZoomLevel.COSMOS)

    // 色相: 270° → 0° (紫 → 赤)
    const hue = 270 - normalized * 270

    return this.hslToHex(hue, 70, 60)
  }
}
```

**チェックポイント**:
- [ ] クラス定義
- [ ] getColorForLevel実装
- [ ] 基本構造完成

---

### Step 3.2.2: HSL→RGB変換ユーティリティ

**見積もり**: 40分

**実装内容**（SpectrumColorSystem.tsに追加）:
```typescript
/**
 * HSLからHex色に変換
 *
 * @param h 色相 (0-360)
 * @param s 彩度 (0-100)
 * @param l 明度 (0-100)
 * @returns Hex色値
 */
hslToHex(h: number, s: number, l: number): number {
  const sNorm = s / 100
  const lNorm = l / 100

  const c = (1 - Math.abs(2 * lNorm - 1)) * sNorm
  const x = c * (1 - Math.abs(((h / 60) % 2) - 1))
  const m = lNorm - c / 2

  let r = 0,
    g = 0,
    b = 0

  if (h >= 0 && h < 60) {
    r = c
    g = x
    b = 0
  } else if (h >= 60 && h < 120) {
    r = x
    g = c
    b = 0
  } else if (h >= 120 && h < 180) {
    r = 0
    g = c
    b = x
  } else if (h >= 180 && h < 240) {
    r = 0
    g = x
    b = c
  } else if (h >= 240 && h < 300) {
    r = x
    g = 0
    b = c
  } else if (h >= 300 && h < 360) {
    r = c
    g = 0
    b = x
  }

  const rHex = Math.round((r + m) * 255)
  const gHex = Math.round((g + m) * 255)
  const bHex = Math.round((b + m) * 255)

  return (rHex << 16) | (gHex << 8) | bHex
}
```

**チェックポイント**:
- [ ] HSL→RGB変換正しい
- [ ] Hex形式で返す
- [ ] 全色相で動作

---

### Step 3.2.3: レベル別色取得（getColorForLevel）

**見積もり**: 20分

**Note**: Step 3.2.1に含まれているため個別実装不要

---

### Step 3.2.4: 年齢・活動度別色調整

**見積もり**: 40分

**実装内容**（SpectrumColorSystem.tsに追加）:
```typescript
/**
 * セルの年齢に応じた色を取得
 * 若いセル: 明るい、古いセル: 暗い
 */
getColorForAge(age: number, baseColor: number): number {
  const maxAge = 100
  const brightness = 1 - Math.min(age / maxAge, 0.7)

  return this.adjustBrightness(baseColor, brightness)
}

/**
 * セルの活動度に応じた色を取得
 * 活発: 鮮やか、静的: くすんだ
 */
getColorForActivity(activity: number, baseColor: number): number {
  const saturation = 40 + activity * 60 // 40-100%

  return this.adjustSaturation(baseColor, saturation)
}

/**
 * 明度を調整
 */
private adjustBrightness(color: number, factor: number): number {
  const r = (color >> 16) & 0xff
  const g = (color >> 8) & 0xff
  const b = color & 0xff

  return (
    (Math.min(255, Math.floor(r * factor)) << 16) |
    (Math.min(255, Math.floor(g * factor)) << 8) |
    Math.min(255, Math.floor(b * factor))
  )
}

/**
 * 彩度を調整
 */
private adjustSaturation(color: number, saturationPercent: number): number {
  // RGB → HSL → RGB (彩度変更)
  const r = ((color >> 16) & 0xff) / 255
  const g = ((color >> 8) & 0xff) / 255
  const b = (color & 0xff) / 255

  const max = Math.max(r, g, b)
  const min = Math.min(r, g, b)
  const l = (max + min) / 2

  if (max === min) {
    return color // グレースケールの場合
  }

  const d = max - min
  const s = l > 0.5 ? d / (2 - max - min) : d / (max + min)

  let h = 0
  if (max === r) {
    h = ((g - b) / d + (g < b ? 6 : 0)) / 6
  } else if (max === g) {
    h = ((b - r) / d + 2) / 6
  } else {
    h = ((r - g) / d + 4) / 6
  }

  // 新しい彩度で再計算
  return this.hslToHex(h * 360, saturationPercent, l * 100)
}
```

**チェックポイント**:
- [ ] 年齢別色調整実装
- [ ] 活動度別色調整実装
- [ ] 明度・彩度調整実装

---

## Phase 3.3: PixiJS統合とテスト（2ステップ）

### Step 3.3.1: LifeRendererの置き換え

**見積もり**: 30分

**ファイル**: `src/lib/components/LifeCanvas.svelte`（一部更新）

**実装内容**:
```typescript
// 既存のLifeRendererをインポートから削除
// import { LifeRenderer } from '$lib/pixi/LifeRenderer'

// 新しいレンダラーをインポート
import { HierarchicalLifeRenderer } from '$lib/pixi/HierarchicalLifeRenderer'
import { SpectrumColorSystem } from '$lib/features/zoom/SpectrumColorSystem'
import type { ZoomLevel } from '$lib/types/zoom'

let renderer: HierarchicalLifeRenderer | null = null
const colorSystem = new SpectrumColorSystem()

// 初期化時
onMount(() => {
  renderer = new HierarchicalLifeRenderer(
    canvasElement,
    window.innerWidth,
    window.innerHeight
  )

  // ... rest of the code
})
```

**チェックポイント**:
- [ ] インポート更新
- [ ] レンダラー初期化更新
- [ ] 既存機能が動作

---

### Step 3.3.2: LifeCanvasコンポーネント更新

**見積もり**: 45分

**実装内容**（LifeCanvas.svelteの更新）:
```svelte
<script lang="ts">
  import { onMount, onDestroy } from 'svelte'
  import { HierarchicalLifeRenderer } from '$lib/pixi/HierarchicalLifeRenderer'
  import { SpectrumColorSystem } from '$lib/features/zoom/SpectrumColorSystem'
  import { simulationStore } from '$lib/stores/simulationStore'
  import { ZoomLevel } from '$lib/types/zoom'

  let canvasElement: HTMLCanvasElement
  let renderer: HierarchicalLifeRenderer | null = null
  let animationFrameId: number | null = null

  const colorSystem = new SpectrumColorSystem()
  let currentZoomLevel = ZoomLevel.STANDARD

  onMount(() => {
    renderer = new HierarchicalLifeRenderer(
      canvasElement,
      window.innerWidth,
      window.innerHeight
    )

    // リサイズハンドラー
    const handleResize = () => {
      if (renderer) {
        renderer.resize(window.innerWidth, window.innerHeight)
      }
    }
    window.addEventListener('resize', handleResize)

    // アニメーションループ
    const animate = () => {
      if (renderer && $simulationStore.isPlaying) {
        // グリッドをMapに変換（仮の実装）
        const gridMap = new Map<string, number>()
        const grid = $simulationStore.grid

        for (let y = 0; y < grid.length; y++) {
          for (let x = 0; x < grid[y].length; x++) {
            if (grid[y][x] === 1) {
              gridMap.set(`${x},${y}`, 1)
            }
          }
        }

        // 色を取得
        const color = colorSystem.getColorForLevel(currentZoomLevel)

        // 描画
        renderer.render(gridMap, color)
      }

      animationFrameId = requestAnimationFrame(animate)
    }

    animate()

    return () => {
      window.removeEventListener('resize', handleResize)
    }
  })

  onDestroy(() => {
    if (animationFrameId !== null) {
      cancelAnimationFrame(animationFrameId)
    }
    if (renderer) {
      renderer.destroy()
    }
  })
</script>

<canvas bind:this={canvasElement} class="fixed inset-0"></canvas>
```

**チェックポイント**:
- [ ] コンポーネント更新
- [ ] アニメーションループ動作
- [ ] 色システム統合
- [ ] Grid→Map変換実装

---

## Phase 3完了: 描画テスト（1ステップ）

### Step 3.4.1: Phase 3完了テスト

**見積もり**: 45分

**ファイル**: `src/lib/features/zoom/__tests__/SpectrumColorSystem.test.ts`

**テスト内容**:
```typescript
import { describe, it, expect } from 'vitest'
import { SpectrumColorSystem } from '../SpectrumColorSystem'
import { ZoomLevel } from '$lib/types/zoom'

describe('SpectrumColorSystem', () => {
  let colorSystem: SpectrumColorSystem

  beforeEach(() => {
    colorSystem = new SpectrumColorSystem()
  })

  describe('getColorForLevel', () => {
    it('各ズームレベルで色が取得できる', () => {
      const cosmosColor = colorSystem.getColorForLevel(ZoomLevel.COSMOS)
      const standardColor = colorSystem.getColorForLevel(ZoomLevel.STANDARD)
      const quantumColor = colorSystem.getColorForLevel(ZoomLevel.QUANTUM)

      expect(cosmosColor).toBeTypeOf('number')
      expect(standardColor).toBeTypeOf('number')
      expect(quantumColor).toBeTypeOf('number')

      // 異なる色であること
      expect(cosmosColor).not.toBe(standardColor)
      expect(standardColor).not.toBe(quantumColor)
    })

    it('COSMOSは紫系の色', () => {
      const color = colorSystem.getColorForLevel(ZoomLevel.COSMOS)
      // 紫系: 0x9d4edd付近
      expect(color).toBeGreaterThan(0x800000)
      expect(color).toBeLessThan(0xffffff)
    })
  })

  describe('HSL変換', () => {
    it('HSL→Hexが正しく変換される', () => {
      // 赤 (0°, 100%, 50%)
      const red = colorSystem.hslToHex(0, 100, 50)
      expect(red).toBe(0xff0000)

      // 緑 (120°, 100%, 50%)
      const green = colorSystem.hslToHex(120, 100, 50)
      expect(green).toBe(0x00ff00)

      // 青 (240°, 100%, 50%)
      const blue = colorSystem.hslToHex(240, 100, 50)
      expect(blue).toBe(0x0000ff)
    })
  })

  describe('色調整', () => {
    it('明度調整が機能する', () => {
      const baseColor = 0xff8800
      const darker = colorSystem['adjustBrightness'](baseColor, 0.5)

      expect(darker).toBeLessThan(baseColor)
    })
  })
})
```

**ビジュアルテスト**:
```bash
npm run dev
```

ブラウザで確認:
- [ ] グリッドが描画される
- [ ] ズームレベルに応じて色が変わる
- [ ] パフォーマンスが良好（60fps）
- [ ] リサイズが正しく動作

**チェックポイント**:
- [ ] ユニットテストパス
- [ ] ビジュアルテストOK
- [ ] パフォーマンスOK

---

## Phase 3完了後のアクション

- [ ] すべてのステップのチェックボックスを確認
- [ ] TypeScriptのビルドエラーがないことを確認
- [ ] テストがすべてパスすることを確認
- [ ] 描画が美しいことを確認
- [ ] コミット: `feat: Phase 3 - 階層的レンダリングとスペクトラムカラーシステム実装`

---

## 作成されるファイル一覧

```
src/lib/
  pixi/
    HierarchicalLifeRenderer.ts                  # 新規作成
  features/
    zoom/
      SpectrumColorSystem.ts                     # 新規作成
      __tests__/
        SpectrumColorSystem.test.ts              # 新規作成
  components/
    LifeCanvas.svelte                            # 更新
```

---

## 次のPhase

[Phase 4: インタラクション](../phase-4/README.md)

---

最終更新: 2025-11-09

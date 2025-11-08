/**
 * PixiJS ライフゲーム描画レイヤー
 */

import { Application, Graphics } from 'pixi.js'
import type { Grid } from '$lib/types/lifegame'

export interface RendererOptions {
  /** キャンバスの幅 */
  width: number
  /** キャンバスの高さ */
  height: number
  /** 背景色 */
  backgroundColor: number
  /** 生きているセルの色 */
  aliveCellColor: number
  /** 死んでいるセルの色 */
  deadCellColor: number
}

/**
 * ライフゲーム描画クラス
 */
export class LifeRenderer {
  private app: Application
  private graphics: Graphics
  private cellSize = 8
  private gridWidth = 0
  private gridHeight = 0

  constructor(canvas: HTMLCanvasElement, options: RendererOptions) {
    // PixiJS Application の初期化
    this.app = new Application()
    this.graphics = new Graphics()

    // 初期化を非同期で実行
    this.init(canvas, options).catch(console.error)
  }

  /**
   * 初期化
   */
  private async init(canvas: HTMLCanvasElement, options: RendererOptions) {
    await this.app.init({
      canvas,
      width: options.width,
      height: options.height,
      backgroundColor: options.backgroundColor,
      antialias: false, // ピクセル表現のため無効化
      resolution: window.devicePixelRatio || 1,
      autoDensity: true,
    })

    // グラフィックスをステージに追加
    this.app.stage.addChild(this.graphics)
  }

  /**
   * グリッドを描画
   */
  render(grid: Grid, aliveCellColor: number, deadCellColor: number) {
    const height = grid.length
    const width = grid[0]?.length ?? 0

    if (width === 0 || height === 0) return

    // グリッドサイズが変わった場合、セルサイズを再計算
    if (this.gridWidth !== width || this.gridHeight !== height) {
      this.gridWidth = width
      this.gridHeight = height
      this.calculateCellSize()
    }

    // 描画クリア
    this.graphics.clear()

    // グリッドを描画
    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        const cell = grid[y]?.[x]
        const color = cell === 1 ? aliveCellColor : deadCellColor

        // セルを描画（小さな角丸四角形）
        this.graphics
          .rect(
            x * this.cellSize + 0.5,
            y * this.cellSize + 0.5,
            this.cellSize - 1,
            this.cellSize - 1
          )
          .fill(color)
      }
    }
  }

  /**
   * セルサイズを計算
   */
  private calculateCellSize() {
    const canvasWidth = this.app.canvas.width / (window.devicePixelRatio || 1)
    const canvasHeight = this.app.canvas.height / (window.devicePixelRatio || 1)

    // キャンバスに収まるセルサイズを計算
    const cellWidth = canvasWidth / this.gridWidth
    const cellHeight = canvasHeight / this.gridHeight

    this.cellSize = Math.min(cellWidth, cellHeight, 20) // 最大20px
  }

  /**
   * リサイズ
   */
  resize(width: number, height: number) {
    this.app.renderer.resize(width, height)
    this.calculateCellSize()
  }

  /**
   * クリーンアップ
   */
  destroy() {
    this.graphics.destroy()
    this.app.destroy(true, { children: true, texture: true })
  }

  /**
   * Application インスタンスを取得
   */
  getApplication() {
    return this.app
  }
}

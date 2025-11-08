/**
 * ライフゲームコアロジック
 * Conway's Game of Life のルールに基づくシミュレーションエンジン
 */

import type { Grid, GridSize, CellState } from '$lib/types/lifegame'

/**
 * 空のグリッドを作成
 */
export function createEmptyGrid(size: GridSize): Grid {
  return Array.from({ length: size.height }, () => Array(size.width).fill(0) as CellState[])
}

/**
 * ランダムな初期状態のグリッドを作成
 * @param size グリッドサイズ
 * @param density 生きているセルの密度（0.0 ~ 1.0）
 */
export function createRandomGrid(size: GridSize, density = 0.3): Grid {
  return Array.from({ length: size.height }, () =>
    Array.from({ length: size.width }, () => (Math.random() < density ? 1 : 0) as CellState)
  )
}

/**
 * セルの近傍の生きているセル数をカウント
 * @param grid グリッド
 * @param x X座標
 * @param y Y座標
 * @param toroidal トーラス（端ループ）を有効にするか
 */
function countAliveNeighbors(grid: Grid, x: number, y: number, toroidal: boolean): number {
  const height = grid.length
  const width = grid[0]?.length ?? 0
  let count = 0

  for (let dy = -1; dy <= 1; dy++) {
    for (let dx = -1; dx <= 1; dx++) {
      // 自分自身はスキップ
      if (dx === 0 && dy === 0) continue

      let nx = x + dx
      let ny = y + dy

      if (toroidal) {
        // トーラス: 端をループ
        nx = (nx + width) % width
        ny = (ny + height) % height
      } else {
        // 境界外はスキップ
        if (nx < 0 || nx >= width || ny < 0 || ny >= height) continue
      }

      if (grid[ny]?.[nx] === 1) {
        count++
      }
    }
  }

  return count
}

/**
 * 次の世代のグリッドを計算
 * Conway's Game of Life のルール:
 * - 生きているセル:
 *   - 近傍に2つまたは3つの生きているセルがある場合、生き続ける
 *   - それ以外の場合、死ぬ（過疎または過密）
 * - 死んでいるセル:
 *   - 近傍にちょうど3つの生きているセルがある場合、誕生する
 *
 * @param grid 現在のグリッド
 * @param toroidal トーラス（端ループ）を有効にするか
 */
export function computeNextGeneration(grid: Grid, toroidal: boolean): Grid {
  const height = grid.length
  const width = grid[0]?.length ?? 0

  const nextGrid = createEmptyGrid({ width, height })

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const aliveNeighbors = countAliveNeighbors(grid, x, y, toroidal)
      const currentCell = grid[y]?.[x] ?? 0

      if (currentCell === 1) {
        // 生きているセル
        nextGrid[y]![x] = aliveNeighbors === 2 || aliveNeighbors === 3 ? 1 : 0
      } else {
        // 死んでいるセル
        nextGrid[y]![x] = aliveNeighbors === 3 ? 1 : 0
      }
    }
  }

  return nextGrid
}

/**
 * グリッドをコピー
 */
export function copyGrid(grid: Grid): Grid {
  return grid.map((row: CellState[]) => [...row])
}

/**
 * グリッドの生きているセル数をカウント
 */
export function countAliveCells(grid: Grid): number {
  return grid.reduce(
    (sum: number, row: CellState[]) => sum + row.filter((cell: CellState) => cell === 1).length,
    0
  )
}

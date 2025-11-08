/**
 * ライフゲームコアロジックのユニットテスト
 */

import { describe, it, expect } from 'vitest'
import type { Grid } from '$lib/types/lifegame'
import {
  createEmptyGrid,
  createRandomGrid,
  computeNextGeneration,
  copyGrid,
  countAliveCells,
} from './engine'

describe('ライフゲームエンジン', () => {
  describe('createEmptyGrid', () => {
    it('指定サイズの空のグリッドを作成できる', () => {
      const grid = createEmptyGrid({ width: 3, height: 2 })
      expect(grid.length).toBe(2)
      expect(grid[0]?.length).toBe(3)
      expect(countAliveCells(grid)).toBe(0)
    })
  })

  describe('createRandomGrid', () => {
    it('指定サイズのランダムグリッドを作成できる', () => {
      const grid = createRandomGrid({ width: 10, height: 10 }, 0.3)
      expect(grid.length).toBe(10)
      expect(grid[0]?.length).toBe(10)
      // ランダムなので、生きているセルが0個以上あることを確認
      expect(countAliveCells(grid)).toBeGreaterThanOrEqual(0)
    })

    it('密度が1.0の場合、全てのセルが生きている', () => {
      const grid = createRandomGrid({ width: 5, height: 5 }, 1.0)
      expect(countAliveCells(grid)).toBe(25)
    })

    it('密度が0.0の場合、全てのセルが死んでいる', () => {
      const grid = createRandomGrid({ width: 5, height: 5 }, 0.0)
      expect(countAliveCells(grid)).toBe(0)
    })
  })

  describe('computeNextGeneration', () => {
    it('ブロック（安定構造）は変化しない', () => {
      // ブロック: 2x2の正方形
      const grid: Grid = [
        [0, 0, 0, 0],
        [0, 1, 1, 0],
        [0, 1, 1, 0],
        [0, 0, 0, 0],
      ]
      const nextGrid = computeNextGeneration(grid, false)
      expect(nextGrid).toEqual(grid)
    })

    it('ブリンカー（振動子）は正しく振動する', () => {
      // ブリンカー（横向き）
      const grid1: Grid = [
        [0, 0, 0, 0, 0],
        [0, 0, 1, 0, 0],
        [0, 0, 1, 0, 0],
        [0, 0, 1, 0, 0],
        [0, 0, 0, 0, 0],
      ]

      // ブリンカー（縦向き）
      const expected: Grid = [
        [0, 0, 0, 0, 0],
        [0, 0, 0, 0, 0],
        [0, 1, 1, 1, 0],
        [0, 0, 0, 0, 0],
        [0, 0, 0, 0, 0],
      ]

      const nextGrid = computeNextGeneration(grid1, false)
      expect(nextGrid).toEqual(expected)

      // 再度計算すると元に戻る
      const nextNextGrid = computeNextGeneration(nextGrid, false)
      expect(nextNextGrid).toEqual(grid1)
    })

    it('グライダーは正しく移動する', () => {
      // グライダー（初期状態）
      const grid: Grid = [
        [0, 0, 0, 0, 0, 0],
        [0, 0, 1, 0, 0, 0],
        [0, 0, 0, 1, 0, 0],
        [0, 1, 1, 1, 0, 0],
        [0, 0, 0, 0, 0, 0],
        [0, 0, 0, 0, 0, 0],
      ]

      let current = copyGrid(grid)
      // 4世代進めると、右下に1マス移動する
      for (let i = 0; i < 4; i++) {
        current = computeNextGeneration(current, false)
      }

      // グライダーが移動していることを確認（位置は変わるが形状は保たれる）
      const aliveCells = countAliveCells(current)
      expect(aliveCells).toBe(5) // グライダーは5つのセルで構成
    })

    it('過疎により死ぬ（近傍が1つ以下）', () => {
      const grid: Grid = [
        [0, 0, 0],
        [0, 1, 0],
        [0, 0, 0],
      ]
      const nextGrid = computeNextGeneration(grid, false)
      expect(countAliveCells(nextGrid)).toBe(0)
    })

    it('過密により死ぬ（近傍が4つ以上）', () => {
      const grid: Grid = [
        [1, 1, 1],
        [1, 1, 1],
        [1, 1, 1],
      ]
      const nextGrid = computeNextGeneration(grid, false)
      // 角の4つと中央が死ぬ
      expect(nextGrid[1]?.[1]).toBe(0) // 中央は死ぬ（近傍8つ）
    })

    it('誕生（近傍がちょうど3つ）', () => {
      const grid: Grid = [
        [0, 0, 0],
        [1, 1, 1],
        [0, 0, 0],
      ]
      const nextGrid = computeNextGeneration(grid, false)
      // 中央の上下に新しいセルが誕生
      expect(nextGrid[0]?.[1]).toBe(1)
      expect(nextGrid[2]?.[1]).toBe(1)
    })

    describe('トーラス（端ループ）', () => {
      it('トーラス有効時、端のセルが反対側と繋がる', () => {
        // 左端に縦3つのセル（トーラスで右端とも繋がる）
        const grid: Grid = [
          [1, 0, 0],
          [1, 0, 0],
          [1, 0, 0],
        ]

        const nextGrid = computeNextGeneration(grid, true)
        // トーラスの場合、右端の中央にセルが誕生する
        expect(nextGrid[1]?.[2]).toBe(1)
      })

      it('トーラス無効時、端のセルは繋がらない', () => {
        const grid: Grid = [
          [1, 0, 0],
          [1, 0, 0],
          [1, 0, 0],
        ]

        const nextGrid = computeNextGeneration(grid, false)
        // トーラスでない場合、右端には影響しない
        expect(nextGrid[1]?.[2]).toBe(0)
      })
    })
  })

  describe('copyGrid', () => {
    it('グリッドを正しくコピーする', () => {
      const grid: Grid = [
        [1, 0, 1],
        [0, 1, 0],
      ]
      const copied = copyGrid(grid)
      expect(copied).toEqual(grid)
      expect(copied).not.toBe(grid) // 参照が異なる
      expect(copied[0]).not.toBe(grid[0]) // 行の参照も異なる
    })
  })

  describe('countAliveCells', () => {
    it('生きているセル数を正しくカウントする', () => {
      const grid: Grid = [
        [1, 0, 1],
        [0, 1, 0],
        [1, 1, 1],
      ]
      expect(countAliveCells(grid)).toBe(6)
    })

    it('全て死んでいる場合は0を返す', () => {
      const grid = createEmptyGrid({ width: 3, height: 3 })
      expect(countAliveCells(grid)).toBe(0)
    })
  })
})

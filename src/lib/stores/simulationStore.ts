/**
 * シミュレーション状態管理
 */

import { writable, derived } from 'svelte/store'
import type { Grid, GridSize } from '$lib/types/lifegame'
import { createRandomGrid, computeNextGeneration } from '$lib/features/lifegame/engine'

/**
 * シミュレーション状態
 */
export interface SimulationState {
  /** グリッド状態 */
  grid: Grid
  /** 再生中かどうか */
  isPlaying: boolean
  /** 現在のステップ数 */
  step: number
  /** シミュレーション速度（ミリ秒/ステップ） */
  speed: number
  /** グリッドサイズ */
  gridSize: GridSize
  /** トーラス（端ループ）有効 */
  toroidal: boolean
}

/**
 * 初期状態
 */
const initialGridSize: GridSize = { width: 100, height: 60 }
const initialState: SimulationState = {
  grid: createRandomGrid(initialGridSize, 0.3),
  isPlaying: true,
  step: 0,
  speed: 100, // 100ms/step
  gridSize: initialGridSize,
  toroidal: true,
}

/**
 * シミュレーションストア
 */
function createSimulationStore() {
  const { subscribe, update } = writable<SimulationState>(initialState)

  return {
    subscribe,

    /**
     * 再生を開始
     */
    play: () => {
      update((state) => ({ ...state, isPlaying: true }))
    },

    /**
     * 一時停止
     */
    pause: () => {
      update((state) => ({ ...state, isPlaying: false }))
    },

    /**
     * 再生/一時停止をトグル
     */
    togglePlayPause: () => {
      update((state) => ({ ...state, isPlaying: !state.isPlaying }))
    },

    /**
     * 速度を設定
     * @param speed ミリ秒/ステップ
     */
    setSpeed: (speed: number) => {
      update((state) => ({ ...state, speed }))
    },

    /**
     * 次の世代を計算
     */
    nextGeneration: () => {
      update((state) => ({
        ...state,
        grid: computeNextGeneration(state.grid, state.toroidal),
        step: state.step + 1,
      }))
    },

    /**
     * リセット（ランダムグリッドを生成）
     */
    reset: () => {
      update((state) => ({
        ...state,
        grid: createRandomGrid(state.gridSize, 0.3),
        step: 0,
        isPlaying: false,
      }))
    },

    /**
     * グリッドを設定
     */
    setGrid: (grid: Grid) => {
      update((state) => ({ ...state, grid, step: 0 }))
    },

    /**
     * グリッドサイズを変更
     */
    setGridSize: (gridSize: GridSize) => {
      update((state) => ({
        ...state,
        gridSize,
        grid: createRandomGrid(gridSize, 0.3),
        step: 0,
      }))
    },

    /**
     * トーラス設定を切り替え
     */
    toggleToroidal: () => {
      update((state) => ({ ...state, toroidal: !state.toroidal }))
    },
  }
}

/**
 * シミュレーションストア（シングルトン）
 */
export const simulationStore = createSimulationStore()

/**
 * 生きているセル数（derived store）
 */
export const aliveCellsCount = derived(simulationStore, ($sim) => {
  return $sim.grid.reduce((sum, row) => sum + row.filter((cell) => cell === 1).length, 0)
})

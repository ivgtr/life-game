/**
 * ライフゲーム関連の型定義
 */

/**
 * セルの状態
 * 0: 死んでいる, 1: 生きている
 */
export type CellState = 0 | 1

/**
 * グリッド（2次元配列）
 */
export type Grid = CellState[][]

/**
 * グリッドサイズ
 */
export interface GridSize {
  width: number
  height: number
}

/**
 * シミュレーション設定
 */
export interface SimulationSettings {
  /** グリッドサイズ */
  gridSize: GridSize
  /** トーラス（端ループ）を有効にするか */
  toroidal: boolean
  /** シミュレーション速度（ミリ秒/ステップ） */
  speed: number
}

/**
 * プリセット設定
 */
export interface PresetConfig {
  /** プリセット名 */
  name: string
  /** 説明 */
  description: string
  /** カラーパレット */
  colors: {
    background: string
    deadCell: string
    aliveCell: string
    fadeCell: string
  }
  /** シミュレーション設定 */
  simulation: SimulationSettings
}

/**
 * セルの位置
 */
export interface CellPosition {
  x: number
  y: number
}

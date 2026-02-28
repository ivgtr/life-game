/** セルの状態（CPU側の表現） */
export interface Cell {
  /** Unicode コードポイント（0 = 空白/死セル） */
  codepoint: number
  /** 正: 生存世代数、負: 崩壊カウントダウン */
  generation: number
  /** ビットフラグ（ハイライト等） */
  flags: number
}

/** セル1つあたりのバイトサイズ（GPU バッファレイアウト） */
export const CELL_BYTE_SIZE = 8

/** flags ビットマスク */
export const CellFlags = {
  HIGHLIGHTED: 0x0001,
  DECAYING: 0x0002,
} as const

/** グリッドのパラメータ */
export interface GridParams {
  width: number
  height: number
}

/** シミュレーションの uniform パラメータ */
export interface SimulationParams {
  width: number
  height: number
  tick: number
  mutationStrength: number
  decaySteps: number
  seed: number
}

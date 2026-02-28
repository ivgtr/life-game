/** 検出された単語 */
export interface DetectedWord {
  /** 検出された単語文字列 */
  word: string
  /** グリッド上の座標 */
  cells: Array<{ row: number; col: number }>
  /** 検出方向 */
  direction: 'horizontal' | 'vertical'
  /** 検出された世代 */
  generation: number
  /** 検出タイムスタンプ */
  timestamp: number
}

/** Worker へのメッセージ */
export interface DetectionRequest {
  type: 'scan'
  cellData: ArrayBuffer
  width: number
  height: number
  generation: number
}

/** Worker からのレスポンス */
export interface DetectionResponse {
  type: 'result'
  words: DetectedWord[]
}

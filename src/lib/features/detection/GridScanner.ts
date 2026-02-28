import { CELL_BYTE_SIZE } from '$lib/types/cell'

/** グリッド上のテキストシーケンス */
export interface TextSequence {
  /** 文字列 */
  text: string
  /** グリッド座標の配列 */
  cells: Array<{ row: number; col: number }>
  /** スキャン方向 */
  direction: 'horizontal' | 'vertical'
}

/** セルデータからテキストシーケンスを抽出する */
export function scanGrid(
  data: ArrayBuffer,
  width: number,
  height: number,
): TextSequence[] {
  const view = new DataView(data)
  const sequences: TextSequence[] = []

  // 横方向スキャン
  for (let row = 0; row < height; row++) {
    let current: TextSequence | null = null

    for (let col = 0; col < width; col++) {
      const offset = (row * width + col) * CELL_BYTE_SIZE
      const codepoint = view.getUint32(offset, true)
      const genFlags = view.getUint32(offset + 4, true)
      const generation = (genFlags & 0xFFFF) - 32768

      if (codepoint > 0 && generation > 0) {
        const char = String.fromCodePoint(codepoint)
        if (!current) {
          current = { text: '', cells: [], direction: 'horizontal' }
        }
        current.text += char
        current.cells.push({ row, col })
      } else {
        if (current && current.text.length >= 2) {
          sequences.push(current)
        }
        current = null
      }
    }

    if (current && current.text.length >= 2) {
      sequences.push(current)
    }
  }

  // 縦方向スキャン
  for (let col = 0; col < width; col++) {
    let current: TextSequence | null = null

    for (let row = 0; row < height; row++) {
      const offset = (row * width + col) * CELL_BYTE_SIZE
      const codepoint = view.getUint32(offset, true)
      const genFlags = view.getUint32(offset + 4, true)
      const generation = (genFlags & 0xFFFF) - 32768

      if (codepoint > 0 && generation > 0) {
        const char = String.fromCodePoint(codepoint)
        if (!current) {
          current = { text: '', cells: [], direction: 'vertical' }
        }
        current.text += char
        current.cells.push({ row, col })
      } else {
        if (current && current.text.length >= 2) {
          sequences.push(current)
        }
        current = null
      }
    }

    if (current && current.text.length >= 2) {
      sequences.push(current)
    }
  }

  return sequences
}

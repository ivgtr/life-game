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

/**
 * kuromoji で有意な解析ができるひらがなか判定。
 * 常用範囲 あ(U+3042)〜ん(U+3093) から以下を除外:
 * - 小文字かな: ぁぃぅぇぉっゃゅょゎ（単独で意味を持たない）
 * - 古語かな: ゐ(U+3090) ゑ(U+3091)（現代語辞書でノイズになる）
 */
const SMALL_KANA = new Set([
  0x3041, // ぁ
  0x3043, // ぃ
  0x3045, // ぅ
  0x3047, // ぇ
  0x3049, // ぉ
  0x3063, // っ
  0x3083, // ゃ
  0x3085, // ゅ
  0x3087, // ょ
  0x308e, // ゎ
])
const ARCHAIC_KANA = new Set([
  0x3090, // ゐ
  0x3091, // ゑ
])
function isUsableHiragana(cp: number): boolean {
  if (cp < 0x3042 || cp > 0x3093) return false
  if (SMALL_KANA.has(cp) || ARCHAIC_KANA.has(cp)) return false
  return true
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

      if (generation > 0 && isUsableHiragana(codepoint)) {
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

      if (generation > 0 && isUsableHiragana(codepoint)) {
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

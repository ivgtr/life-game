import { CELL_BYTE_SIZE } from '$lib/types/cell'

/** テキストをグリッドに配置 */
export function generateTextSeed(
  width: number,
  height: number,
  text: string,
): ArrayBuffer {
  const count = width * height
  const buf = new ArrayBuffer(count * CELL_BYTE_SIZE)
  const view = new DataView(buf)

  // 改行で行分割、グリッドに流し込み
  const lines = text.split('\n')
  const startRow = Math.max(0, Math.floor((height - lines.length) / 2))

  for (let row = 0; row < lines.length && startRow + row < height; row++) {
    const line = lines[row]!
    const chars = [...line] // Unicode-aware split
    const startCol = Math.max(0, Math.floor((width - chars.length) / 2))

    for (let col = 0; col < chars.length && startCol + col < width; col++) {
      const cp = chars[col]!.codePointAt(0) ?? 0
      if (cp === 0 || cp === 0x20 || cp === 0x3000) continue // skip spaces

      const gridIdx = (startRow + row) * width + (startCol + col)
      const offset = gridIdx * CELL_BYTE_SIZE
      view.setUint32(offset, cp, true)
      view.setUint32(offset + 4, 32769, true) // generation=1
    }
  }
  return buf
}

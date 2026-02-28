import { CELL_BYTE_SIZE } from '$lib/types/cell'
import { randomKana } from '$lib/features/automaton/CharacterSet'

/** ランダムな文字でグリッドを初期化 */
export function generateRandomSeed(
  width: number,
  height: number,
  density = 0.2,
): ArrayBuffer {
  const count = width * height
  const buf = new ArrayBuffer(count * CELL_BYTE_SIZE)
  const view = new DataView(buf)

  for (let i = 0; i < count; i++) {
    const offset = i * CELL_BYTE_SIZE
    if (Math.random() < density) {
      view.setUint32(offset, randomKana(), true)
      view.setUint32(offset + 4, 32769, true) // generation=1
    } else {
      view.setUint32(offset, 0, true)
      view.setUint32(offset + 4, 32768, true) // generation=0
    }
  }
  return buf
}

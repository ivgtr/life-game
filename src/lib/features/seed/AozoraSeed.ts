import { generateTextSeed } from './TextSeed'
import { aozoraTexts } from './aozora-texts/index'

export { aozoraTexts }

/** 青空文庫テキストからシードを生成 */
export function generateAozoraSeed(
  width: number,
  height: number,
  aozoraId: string,
): ArrayBuffer {
  const text = aozoraTexts.find((t) => t.id === aozoraId)
  if (!text) {
    throw new Error(`Unknown aozora text: ${aozoraId}`)
  }
  return generateTextSeed(width, height, text.excerpt)
}

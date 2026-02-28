/** 有効な日本語文字の範囲定義と操作 */

export const HIRAGANA_RANGE = { start: 0x3041, end: 0x3096 } as const // ぁ〜ゖ
export const KATAKANA_RANGE = { start: 0x30a1, end: 0x30f6 } as const // ァ〜ヶ

export const HIRAGANA_COUNT = HIRAGANA_RANGE.end - HIRAGANA_RANGE.start + 1
export const KATAKANA_COUNT = KATAKANA_RANGE.end - KATAKANA_RANGE.start + 1

/** ランダムなひらがなのコードポイントを返す */
export function randomHiragana(): number {
  return HIRAGANA_RANGE.start + Math.floor(Math.random() * HIRAGANA_COUNT)
}

/** ランダムなカタカナのコードポイントを返す */
export function randomKatakana(): number {
  return KATAKANA_RANGE.start + Math.floor(Math.random() * KATAKANA_COUNT)
}

/** ランダムなひらがな/カタカナのコードポイントを返す */
export function randomKana(): number {
  return Math.random() < 0.5 ? randomHiragana() : randomKatakana()
}

/** コードポイントが有効な日本語文字かどうか */
export function isValidCharacter(cp: number): boolean {
  return (
    (cp >= HIRAGANA_RANGE.start && cp <= HIRAGANA_RANGE.end) ||
    (cp >= KATAKANA_RANGE.start && cp <= KATAKANA_RANGE.end)
  )
}

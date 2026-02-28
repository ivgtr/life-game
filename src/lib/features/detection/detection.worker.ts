import kuromoji from '@sglkc/kuromoji'
import type { Tokenizer, IpadicFeatures } from '@sglkc/kuromoji'
import { scanGrid } from './GridScanner'
import type { ScanRequest, ScanResponse, DetectedPhrase } from './types'

const KUROMOJI_DIC_PATH = 'https://cdn.jsdelivr.net/npm/@sglkc/kuromoji/dict/'
const MAX_RESULTS_PER_SCAN = 5

/** pre-particle 位置で除外する名詞の品詞詳細 */
const NOUN_EXCLUDE = new Set(['接尾', '数'])

/** 内容語トークンの最大文字数（これを超えるトークンはゴミ） */
const MAX_TOKEN_CHARS = 8

let tokenizer: Tokenizer<IpadicFeatures> | null = null
let pendingRequest: ScanRequest | null = null

function initTokenizer(): Promise<Tokenizer<IpadicFeatures>> {
  return new Promise((resolve, reject) => {
    kuromoji.builder({ dicPath: KUROMOJI_DIC_PATH }).build((err, built) => {
      if (err) {
        reject(err)
        return
      }
      resolve(built)
    })
  })
}

function charLen(s: string): number {
  return [...s].length
}

/**
 * 構造的接続を担う助詞か判定。
 * 格助詞（が・を・に・で・と・へ・から・まで・より）、
 * 係助詞（は・も）、連体化（の）のみを構造的接続として認める。
 * 終助詞・並立助詞・接続助詞は文節間の接続を示さないため除外。
 */
function isConnective(token: IpadicFeatures): boolean {
  return (
    token.pos === '助詞' &&
    (token.pos_detail_1 === '格助詞' ||
      token.pos_detail_1 === '係助詞' ||
      token.pos_detail_1 === '連体化')
  )
}

/** 辞書に存在するトークンか（UNKNOWN はランダム文字列由来のゴミ） */
function isKnown(token: IpadicFeatures): boolean {
  return token.word_type === 'KNOWN'
}

/** 助詞の前後に置ける内容語（KNOWN、2文字以上） */
function isContentWord(token: IpadicFeatures): boolean {
  if (!isKnown(token)) return false
  const len = charLen(token.surface_form)
  if (len < 2 || len > MAX_TOKEN_CHARS) return false
  switch (token.pos) {
    case '名詞':
      return !NOUN_EXCLUDE.has(token.pos_detail_1)
    case '動詞':
      return token.pos_detail_1 === '自立'
    case '形容詞':
      return token.pos_detail_1 === '自立'
    default:
      return false
  }
}

interface TokenRange {
  start: number
  end: number
}

/** KNOWN名詞か判定（接尾・数を除く） */
function isKnownNoun(token: IpadicFeatures): boolean {
  return isKnown(token) && token.pos === '名詞' && !NOUN_EXCLUDE.has(token.pos_detail_1)
}

/** 範囲内にKNOWN名詞が含まれるか */
function hasNoun(tokens: IpadicFeatures[], start: number, end: number): boolean {
  for (let i = start; i <= end; i++) {
    if (isKnownNoun(tokens[i]!)) return true
  }
  return false
}

/**
 * 構造コア抽出:
 * [内容語 KNOWN 2+字] + [格/係助詞] + [内容語 KNOWN 2+字] の隣接3トークンを検出し、
 * 重なるコアをマージして文節チェーンとする。
 *
 * 品質ゲート:
 * - 2ボンド以上（文節チェーン）→ 構造自体が十分なので無条件通過
 * - 1ボンドのみ → 名詞を1つ以上含むこと（動詞×動詞の偶然一致を排除）
 */
function findPhraseRanges(tokens: IpadicFeatures[]): TokenRange[] {
  const cores: Array<{ start: number; end: number }> = []
  for (let i = 1; i < tokens.length - 1; i++) {
    if (!isConnective(tokens[i]!)) continue
    if (!isContentWord(tokens[i - 1]!)) continue
    if (!isContentWord(tokens[i + 1]!)) continue
    cores.push({ start: i - 1, end: i + 1 })
  }

  if (cores.length === 0) return []

  // マージ: 重なるまたは隣接するコアを結合し、ボンド数を記録
  const merged: Array<{ start: number; end: number; bonds: number }> = [
    { ...cores[0]!, bonds: 1 },
  ]
  for (let i = 1; i < cores.length; i++) {
    const last = merged[merged.length - 1]!
    const curr = cores[i]!
    if (curr.start <= last.end + 1) {
      last.end = Math.max(last.end, curr.end)
      last.bonds++
    } else {
      merged.push({ ...curr, bonds: 1 })
    }
  }

  // 品質ゲート: 2ボンド以上 OR 名詞を含む
  const qualified = merged.filter(
    (r) => r.bonds >= 2 || hasNoun(tokens, r.start, r.end),
  )

  // 右に助動詞を拡張（活用語尾の完結）
  for (const range of qualified) {
    while (range.end + 1 < tokens.length && tokens[range.end + 1]!.pos === '助動詞') {
      range.end++
    }
  }

  return qualified
}

function detectPhrases(
  sequences: ReturnType<typeof scanGrid>,
  generation: number,
): DetectedPhrase[] {
  if (!tokenizer) return []

  const phrases: DetectedPhrase[] = []
  const now = Date.now()
  const seen = new Set<string>()

  for (const seq of sequences) {
    if (phrases.length >= MAX_RESULTS_PER_SCAN) break

    const tokens = tokenizer.tokenize(seq.text)
    const ranges = findPhraseRanges(tokens)

    for (const range of ranges) {
      if (phrases.length >= MAX_RESULTS_PER_SCAN) break

      const slice = tokens.slice(range.start, range.end + 1)
      const text = slice.map((t) => t.surface_form).join('')
      if (seen.has(text)) continue
      seen.add(text)

      const first = slice[0]!
      const last = slice[slice.length - 1]!
      const charStart = first.word_position - 1
      const charEnd = last.word_position - 1 + charLen(last.surface_form)

      if (charStart < 0 || charEnd > seq.cells.length) continue

      phrases.push({
        word: text,
        cells: seq.cells.slice(charStart, charEnd),
        direction: seq.direction,
        generation,
        timestamp: now,
      })
    }
  }

  return phrases
}

function processRequest(request: ScanRequest): void {
  const { cellData, width, height, generation } = request
  const sequences = scanGrid(cellData, width, height)
  const phrases = detectPhrases(sequences, generation)
  const response: ScanResponse = { type: 'result', phrases }
  self.postMessage(response)
}

initTokenizer()
  .then((built) => {
    tokenizer = built
    self.postMessage({ type: 'ready' } satisfies ScanResponse)

    if (pendingRequest) {
      const req = pendingRequest
      pendingRequest = null
      processRequest(req)
    }
  })
  .catch((err: unknown) => {
    console.error('kuromoji tokenizer initialization failed:', err)
  })

self.onmessage = (e: MessageEvent<ScanRequest>) => {
  if (!tokenizer) {
    pendingRequest = e.data
    return
  }

  processRequest(e.data)
}

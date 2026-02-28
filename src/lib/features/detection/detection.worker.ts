import { scanGrid } from './GridScanner'
import { wordDictionary, MAX_WORD_LENGTH, MIN_WORD_LENGTH } from './dictionary'
import type { DetectionRequest, DetectionResponse, DetectedWord } from './types'

/** シーケンス内のサブストリングを辞書と照合して単語を検出 */
function detectWordsInSequences(
  sequences: ReturnType<typeof scanGrid>,
  generation: number,
): DetectedWord[] {
  const words: DetectedWord[] = []
  const now = Date.now()

  for (const seq of sequences) {
    const chars = [...seq.text]
    const len = chars.length

    for (let start = 0; start < len; start++) {
      const maxEnd = Math.min(start + MAX_WORD_LENGTH, len)
      for (let end = start + MIN_WORD_LENGTH; end <= maxEnd; end++) {
        const substr = chars.slice(start, end).join('')
        if (wordDictionary.has(substr)) {
          words.push({
            word: substr,
            cells: seq.cells.slice(start, end),
            direction: seq.direction,
            generation,
            timestamp: now,
          })
        }
      }
    }
  }

  return words
}

self.onmessage = (e: MessageEvent<DetectionRequest>) => {
  const { cellData, width, height, generation } = e.data

  const sequences = scanGrid(cellData, width, height)
  const words = detectWordsInSequences(sequences, generation)

  const response: DetectionResponse = { type: 'result', words }
  self.postMessage(response)
}

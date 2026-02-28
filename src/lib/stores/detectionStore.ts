import { writable, derived } from 'svelte/store'
import type { DetectedWord } from '$lib/features/detection/types'

const MAX_LOG_ENTRIES = 50

const _detectedWords = writable<DetectedWord[]>([])

export const detectedWords = {
  subscribe: _detectedWords.subscribe,
  add(words: DetectedWord[]) {
    _detectedWords.update((current) => {
      const merged = [...words, ...current].slice(0, MAX_LOG_ENTRIES)
      return merged
    })
  },
  clear() {
    _detectedWords.set([])
  },
}

export const detectionCount = derived(_detectedWords, ($words) => $words.length)

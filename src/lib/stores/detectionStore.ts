import { writable, derived } from 'svelte/store'
import type { DetectedPhrase } from '$lib/features/detection/types'

const MAX_LOG_ENTRIES = 50

const _detectedPhrases = writable<DetectedPhrase[]>([])

export const detectedPhrases = {
  subscribe: _detectedPhrases.subscribe,
  add(phrases: DetectedPhrase[]) {
    _detectedPhrases.update((current) => {
      const merged = [...phrases, ...current].slice(0, MAX_LOG_ENTRIES)
      return merged
    })
  },
  clear() {
    _detectedPhrases.set([])
  },
}

export const detectionCount = derived(_detectedPhrases, ($phrases) => $phrases.length)

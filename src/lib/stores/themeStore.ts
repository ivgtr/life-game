import { writable, derived } from 'svelte/store'
import { allThemes } from '$lib/features/themes/presets'

const _themeIndex = writable(0)

export const themeIndex = {
  subscribe: _themeIndex.subscribe,
  set: _themeIndex.set,
  next() {
    _themeIndex.update((i) => (i + 1) % allThemes.length)
  },
}

export const currentTheme = derived(_themeIndex, ($i) => allThemes[$i]!)

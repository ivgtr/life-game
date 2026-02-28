import { writable, derived } from 'svelte/store'

const _isPlaying = writable(true)
const _speed = writable(10)
const _stepCount = writable(0)

export const isPlaying = {
  subscribe: _isPlaying.subscribe,
  set: _isPlaying.set,
  toggle() {
    _isPlaying.update((v) => !v)
  },
}

export const speed = {
  subscribe: _speed.subscribe,
  set: _speed.set,
}

export const stepCount = {
  subscribe: _stepCount.subscribe,
  set: _stepCount.set,
}

export const simulationInfo = derived([_stepCount, _isPlaying, _speed], ([$step, $playing, $spd]) => ({
  stepCount: $step,
  isPlaying: $playing,
  speed: $spd,
}))

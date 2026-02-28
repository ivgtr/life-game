<script lang="ts">
  import { onMount } from 'svelte'
  import Canvas from '$lib/components/Canvas.svelte'
  import ControlBar from '$lib/components/ControlBar.svelte'
  import Danmaku from '$lib/components/Danmaku.svelte'
  import FallbackMessage from '$lib/components/FallbackMessage.svelte'
  import { allThemes } from '$lib/features/themes/presets'
  import { aozoraTexts } from '$lib/features/seed/AozoraSeed'
  import { generateRandomSeed } from '$lib/features/seed/RandomSeed'
  import { generateAozoraSeed } from '$lib/features/seed/AozoraSeed'
  import { generateTextSeed } from '$lib/features/seed/TextSeed'
  import { codepointRule } from '$lib/features/automaton/rules/CodepointRule'
  import type { DetectedPhrase } from '$lib/features/detection/types'

  const GRID_WIDTH = 256
  const GRID_HEIGHT = 256

  let error = $state('')
  let ready = $state(false)
  let loading = $state(true)
  let isPlaying = $state(true)
  let speed = $state(10)
  let stepCount = $state(0)
  let themeIndex = $state(0)

  let canvasRef: Canvas | undefined = $state()
  let containerRef: HTMLDivElement | undefined = $state()
  let danmakuRef: Danmaku | undefined = $state()

  const currentTheme = $derived(allThemes[themeIndex]!)
  const rule = codepointRule

  function handleTogglePlay(): void {
    isPlaying = !isPlaying
  }

  function handleSpeedChange(newSpeed: number): void {
    speed = newSpeed
  }

  function handleThemeChange(index: number): void {
    themeIndex = index
  }

  function handleReset(): void {
    canvasRef?.reset()
  }

  function handleSeedRandom(): void {
    const data = generateRandomSeed(GRID_WIDTH, GRID_HEIGHT)
    canvasRef?.setCellData(data)
  }

  function handleSeedAozora(id: string): void {
    const data = generateAozoraSeed(GRID_WIDTH, GRID_HEIGHT, id)
    canvasRef?.setCellData(data)
  }

  function handleSeedCustom(text: string): void {
    const data = generateTextSeed(GRID_WIDTH, GRID_HEIGHT, text)
    canvasRef?.setCellData(data)
  }

  function handlePhrasesDetected(phrases: DetectedPhrase[]): void {
    for (const p of phrases) {
      danmakuRef?.add(p.word)
    }
  }

  function handleReady(): void {
    ready = true
    loading = false
  }

  function handleError(msg: string): void {
    error = msg
    loading = false
  }

  // キーボードショートカット
  function handleKeydown(e: KeyboardEvent): void {
    if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return

    switch (e.code) {
      case 'Space':
        e.preventDefault()
        handleTogglePlay()
        break
      case 'KeyF':
        e.preventDefault()
        toggleFullscreen()
        break
      case 'KeyR':
        e.preventDefault()
        handleReset()
        break
      case 'KeyT':
        e.preventDefault()
        themeIndex = (themeIndex + 1) % allThemes.length
        break
      case 'BracketRight':
        e.preventDefault()
        speed = Math.min(60, speed + 5)
        break
      case 'BracketLeft':
        e.preventDefault()
        speed = Math.max(1, speed - 5)
        break
    }
  }

  function toggleFullscreen(): void {
    if (!containerRef) return
    if (document.fullscreenElement) {
      document.exitFullscreen()
    } else {
      containerRef.requestFullscreen()
    }
  }

  onMount(() => {
    window.addEventListener('keydown', handleKeydown)
    return () => window.removeEventListener('keydown', handleKeydown)
  })
</script>

{#if error}
  <FallbackMessage message={error} />
{:else}
  <div
    bind:this={containerRef}
    class="relative h-screen w-screen overflow-hidden bg-neutral-950"
  >
    {#if loading}
      <div class="flex h-full w-full flex-col items-center justify-center gap-4">
        <div class="h-8 w-8 animate-spin rounded-full border-2 border-neutral-700 border-t-neutral-300"></div>
        <p class="text-sm text-neutral-500">WebGPU を初期化中...</p>
      </div>
    {/if}

    <Canvas
      bind:this={canvasRef}
      gridWidth={GRID_WIDTH}
      gridHeight={GRID_HEIGHT}
      {isPlaying}
      {speed}
      mutationStrength={rule.mutationStrength}
      decaySteps={rule.decaySteps}
      maxAge={rule.maxAge}
      spontaneousRate={rule.spontaneousRate}
      theme={currentTheme.colors}
      onReady={handleReady}
      onError={handleError}
      onStep={(s) => (stepCount = s)}
      onPhrasesDetected={handlePhrasesDetected}
    />

    {#if ready}
      <Danmaku bind:this={danmakuRef} />
      <ControlBar
        {isPlaying}
        {speed}
        {stepCount}
        {currentTheme}
        themes={allThemes}
        {aozoraTexts}
        onTogglePlay={handleTogglePlay}
        onSpeedChange={handleSpeedChange}
        onThemeChange={handleThemeChange}
        onReset={handleReset}
        onSeedRandom={handleSeedRandom}
        onSeedAozora={handleSeedAozora}
        onSeedCustom={handleSeedCustom}
      />

      <!-- キーボードショートカットヒント -->
      <div class="pointer-events-none absolute left-4 top-4 text-xs text-neutral-600 opacity-0 transition-opacity hover:opacity-100">
        <p>Space: 再生/停止</p>
        <p>F: フルスクリーン</p>
        <p>R: リセット</p>
        <p>T: テーマ切替</p>
        <p>[ / ]: 速度調整</p>
      </div>
    {/if}
  </div>
{/if}

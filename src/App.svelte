<script lang="ts">
  import Canvas from '$lib/components/Canvas.svelte'
  import ControlBar from '$lib/components/ControlBar.svelte'
  import FallbackMessage from '$lib/components/FallbackMessage.svelte'
  import { allThemes } from '$lib/features/themes/presets'
  import { aozoraTexts } from '$lib/features/seed/AozoraSeed'
  import { generateRandomSeed } from '$lib/features/seed/RandomSeed'
  import { generateAozoraSeed } from '$lib/features/seed/AozoraSeed'
  import { generateTextSeed } from '$lib/features/seed/TextSeed'
  import { codepointRule } from '$lib/features/automaton/rules/CodepointRule'

  const GRID_WIDTH = 256
  const GRID_HEIGHT = 256

  let error = $state('')
  let ready = $state(false)
  let isPlaying = $state(true)
  let speed = $state(10)
  let stepCount = $state(0)
  let themeIndex = $state(0)

  let canvasRef: Canvas | undefined = $state()

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
</script>

{#if error}
  <FallbackMessage message={error} />
{:else}
  <div class="relative h-screen w-screen overflow-hidden bg-neutral-950">
    <Canvas
      bind:this={canvasRef}
      gridWidth={GRID_WIDTH}
      gridHeight={GRID_HEIGHT}
      {isPlaying}
      {speed}
      mutationStrength={rule.mutationStrength}
      decaySteps={rule.decaySteps}
      theme={currentTheme.colors}
      onReady={() => (ready = true)}
      onError={(msg) => (error = msg)}
      onStep={(s) => (stepCount = s)}
    />
    {#if ready}
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
    {/if}
  </div>
{/if}

<script lang="ts">
  import Canvas from '$lib/components/Canvas.svelte'
  import FallbackMessage from '$lib/components/FallbackMessage.svelte'

  let error = $state('')
  let ready = $state(false)
  let isPlaying = $state(true)
  let stepCount = $state(0)
</script>

{#if error}
  <FallbackMessage message={error} />
{:else}
  <div class="relative h-screen w-screen overflow-hidden bg-neutral-950">
    <Canvas
      gridWidth={256}
      gridHeight={256}
      bind:isPlaying
      speed={10}
      onReady={() => (ready = true)}
      onError={(msg) => (error = msg)}
      onStep={(s) => (stepCount = s)}
    />
    {#if ready}
      <div class="pointer-events-none absolute bottom-4 left-4 text-xs text-neutral-500">
        世代: {stepCount}
      </div>
    {/if}
  </div>
{/if}

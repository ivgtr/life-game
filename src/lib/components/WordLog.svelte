<script lang="ts">
  import type { DetectedWord } from '$lib/features/detection/types'

  interface Props {
    words: DetectedWord[]
  }

  const { words }: Props = $props()
</script>

{#if words.length > 0}
  <div class="absolute right-4 top-4 max-h-64 w-48 overflow-y-auto rounded bg-black/50 p-3 backdrop-blur-sm">
    <p class="mb-2 text-xs text-neutral-400">検出された言葉</p>
    <div class="space-y-1">
      {#each words.slice(0, 20) as w (w.timestamp + w.word)}
        <div class="text-sm text-neutral-200" style="opacity: {Math.max(0.3, 1 - (Date.now() - w.timestamp) / 30000)}">
          <span class="font-medium">{w.word}</span>
          <span class="ml-1 text-xs text-neutral-500">
            {w.direction === 'horizontal' ? '→' : '↓'} 世代{w.generation}
          </span>
        </div>
      {/each}
    </div>
  </div>
{/if}

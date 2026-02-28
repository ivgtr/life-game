<script lang="ts">
  import { onMount, onDestroy } from 'svelte'

  interface Props {
    speed?: number
    maxItems?: number
  }

  const { speed = 120, maxItems = 15 }: Props = $props()

  interface DanmakuItem {
    id: number
    text: string
    top: number
    duration: number
  }

  let items = $state<DanmakuItem[]>([])
  let containerRef: HTMLDivElement | undefined = $state()
  let containerWidth = $state(0)
  let containerHeight = $state(0)
  let nextId = 0
  let observer: ResizeObserver | undefined

  const FONT_SIZE = 20
  const CHAR_WIDTH_RATIO = 0.7

  export function add(text: string): void {
    if (containerWidth === 0 || containerHeight === 0) return
    if (items.length >= maxItems) return

    const estimatedTextWidth = [...text].length * FONT_SIZE * CHAR_WIDTH_RATIO
    const duration = (containerWidth + estimatedTextWidth) / speed
    const top = 5 + Math.random() * 80

    items.push({
      id: nextId++,
      text,
      top,
      duration,
    })
  }

  function handleAnimationEnd(id: number): void {
    items = items.filter((item) => item.id !== id)
  }

  onMount(() => {
    if (!containerRef) return
    containerWidth = containerRef.clientWidth
    containerHeight = containerRef.clientHeight

    observer = new ResizeObserver((entries) => {
      const entry = entries[0]
      if (entry) {
        containerWidth = entry.contentRect.width
        containerHeight = entry.contentRect.height
      }
    })
    observer.observe(containerRef)
  })

  onDestroy(() => {
    observer?.disconnect()
  })
</script>

<div
  bind:this={containerRef}
  class="pointer-events-none absolute inset-0 overflow-hidden"
  style:--cw="{containerWidth}px"
>
  {#each items as item (item.id)}
    <span
      class="danmaku-item absolute left-full whitespace-nowrap text-white/70"
      style:top="{item.top}%"
      style:font-size="{FONT_SIZE}px"
      style:animation-duration="{item.duration}s"
      onanimationend={() => handleAnimationEnd(item.id)}
    >
      {item.text}
    </span>
  {/each}
</div>

<style>
  .danmaku-item {
    animation: danmaku linear forwards;
    text-shadow: 0 1px 3px rgba(0, 0, 0, 0.8);
  }

  @keyframes danmaku {
    to {
      transform: translateX(calc(-100% - var(--cw)));
    }
  }
</style>

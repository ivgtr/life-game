<script lang="ts">
  import type { Theme } from '$lib/types/theme'
  import type { AozoraText } from '$lib/types/seed'

  interface Props {
    isPlaying: boolean
    speed: number
    stepCount: number
    currentTheme: Theme
    themes: Theme[]
    aozoraTexts: AozoraText[]
    onTogglePlay: () => void
    onSpeedChange: (speed: number) => void
    onThemeChange: (index: number) => void
    onReset: () => void
    onSeedRandom: () => void
    onSeedAozora: (id: string) => void
    onSeedCustom: (text: string) => void
  }

  const {
    isPlaying,
    speed,
    stepCount,
    currentTheme,
    themes,
    aozoraTexts,
    onTogglePlay,
    onSpeedChange,
    onThemeChange,
    onReset,
    onSeedRandom,
    onSeedAozora,
    onSeedCustom,
  }: Props = $props()

  let showPanel = $state(false)
  let showSeedMenu = $state(false)
  let customText = $state('')

  function handleCustomSeed(): void {
    if (customText.trim()) {
      onSeedCustom(customText.trim())
      showSeedMenu = false
    }
  }
</script>

<!-- svelte-ignore a11y_no_static_element_interactions -->
<div
  class="absolute bottom-0 left-0 right-0 transition-opacity duration-300"
  class:opacity-100={showPanel}
  class:opacity-0={!showPanel}
  onmouseenter={() => (showPanel = true)}
  onmouseleave={() => { showPanel = false; showSeedMenu = false }}
>
  <!-- Hover trigger area -->
  <div class="absolute bottom-0 left-0 right-0 h-16 opacity-0"
    onmouseenter={() => (showPanel = true)}
  ></div>

  <div class="bg-black/60 px-4 py-3 backdrop-blur-sm">
    <div class="flex items-center gap-4 text-sm text-neutral-300">
      <!-- Play/Pause -->
      <button
        onclick={onTogglePlay}
        class="rounded px-3 py-1 transition hover:bg-white/10"
      >
        {isPlaying ? '⏸' : '▶'}
      </button>

      <!-- Speed -->
      <label class="flex items-center gap-2">
        <span class="text-xs text-neutral-500">速度</span>
        <input
          type="range"
          min="1"
          max="60"
          value={speed}
          oninput={(e) => onSpeedChange(Number((e.target as HTMLInputElement).value))}
          class="w-20 accent-neutral-400"
        />
        <span class="w-6 text-right text-xs">{speed}</span>
      </label>

      <!-- Theme -->
      <div class="flex gap-1">
        {#each themes as t, i (t.id)}
          <button
            onclick={() => onThemeChange(i)}
            class="rounded px-2 py-1 text-xs transition hover:bg-white/10 {currentTheme.id === t.id ? 'bg-white/20' : ''}"
          >
            {t.name}
          </button>
        {/each}
      </div>

      <!-- Seed -->
      <div class="relative">
        <button
          onclick={() => (showSeedMenu = !showSeedMenu)}
          class="rounded px-3 py-1 transition hover:bg-white/10"
        >
          シード
        </button>

        {#if showSeedMenu}
          <div class="absolute bottom-full left-0 mb-2 w-64 rounded bg-neutral-900/95 p-3 shadow-lg backdrop-blur">
            <button
              onclick={() => { onSeedRandom(); showSeedMenu = false }}
              class="mb-2 w-full rounded px-2 py-1 text-left text-xs transition hover:bg-white/10"
            >
              ランダム
            </button>

            <div class="mb-2 border-t border-neutral-700 pt-2">
              <p class="mb-1 text-xs text-neutral-500">青空文庫</p>
              {#each aozoraTexts as text (text.id)}
                <button
                  onclick={() => { onSeedAozora(text.id); showSeedMenu = false }}
                  class="w-full rounded px-2 py-1 text-left text-xs transition hover:bg-white/10"
                >
                  {text.author}「{text.title}」
                </button>
              {/each}
            </div>

            <div class="border-t border-neutral-700 pt-2">
              <p class="mb-1 text-xs text-neutral-500">カスタムテキスト</p>
              <textarea
                bind:value={customText}
                placeholder="テキストを入力..."
                class="mb-1 w-full rounded bg-neutral-800 p-2 text-xs text-neutral-200"
                rows="3"
              ></textarea>
              <button
                onclick={handleCustomSeed}
                class="rounded bg-neutral-700 px-2 py-1 text-xs transition hover:bg-neutral-600"
              >
                適用
              </button>
            </div>
          </div>
        {/if}
      </div>

      <!-- Reset -->
      <button
        onclick={onReset}
        class="rounded px-3 py-1 transition hover:bg-white/10"
      >
        リセット
      </button>

      <!-- Info -->
      <span class="ml-auto text-xs text-neutral-500">
        世代: {stepCount}
      </span>
    </div>
  </div>
</div>

<!-- Always-visible hover trigger -->
<!-- svelte-ignore a11y_no_static_element_interactions -->
<div
  class="absolute bottom-0 left-0 right-0 h-8"
  class:pointer-events-auto={!showPanel}
  class:pointer-events-none={showPanel}
  onmouseenter={() => (showPanel = true)}
></div>

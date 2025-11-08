<script lang="ts">
  import { simulationStore, aliveCellsCount } from '$lib/stores/simulationStore'

  // 速度プリセット（ms/step）
  const speedOptions = [
    { label: '0.25x', value: 400 },
    { label: '0.5x', value: 200 },
    { label: '1x', value: 100 },
    { label: '2x', value: 50 },
    { label: '4x', value: 25 },
  ]

  let selectedSpeedIndex = 2 // デフォルトは1x (100ms)

  function handleSpeedChange() {
    const speed = speedOptions[selectedSpeedIndex]?.value ?? 100
    simulationStore.setSpeed(speed)
  }
</script>

<div
  class="fixed bottom-8 left-1/2 -translate-x-1/2 bg-gray-900/80 backdrop-blur-sm rounded-2xl px-6 py-4 shadow-2xl border border-gray-700/50"
>
  <div class="flex items-center gap-6">
    <!-- 再生/一時停止ボタン -->
    <button
      onclick={() => simulationStore.togglePlayPause()}
      class="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors font-medium"
      aria-label={$simulationStore.isPlaying ? '一時停止' : '再生'}
    >
      {$simulationStore.isPlaying ? '⏸' : '▶'}
    </button>

    <!-- リセットボタン -->
    <button
      onclick={() => simulationStore.reset()}
      class="px-6 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-colors font-medium"
      aria-label="リセット"
    >
      🔄 リセット
    </button>

    <!-- 速度調整 -->
    <div class="flex items-center gap-3">
      <span class="text-gray-300 text-sm font-medium">速度:</span>
      <select
        bind:value={selectedSpeedIndex}
        onchange={handleSpeedChange}
        class="bg-gray-800 text-white px-3 py-1.5 rounded-lg border border-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
        aria-label="シミュレーション速度"
      >
        {#each speedOptions as option, index (index)}
          <option value={index}>{option.label}</option>
        {/each}
      </select>
    </div>

    <!-- ステップ表示 -->
    <div class="flex items-center gap-2 text-gray-300 text-sm">
      <span>ステップ: <span class="font-mono font-semibold">{$simulationStore.step}</span></span>
      <span class="text-gray-500">|</span>
      <span>生存: <span class="font-mono font-semibold">{$aliveCellsCount}</span></span>
    </div>
  </div>
</div>

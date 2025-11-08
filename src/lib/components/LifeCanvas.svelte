<script lang="ts">
  import { onMount, onDestroy } from 'svelte'
  import { LifeRenderer } from '$lib/pixi/LifeRenderer'
  import { simulationStore } from '$lib/stores/simulationStore'

  let canvasElement: HTMLCanvasElement
  let renderer: LifeRenderer | null = null
  let animationFrameId: number | null = null
  let lastUpdateTime = 0

  // 色設定
  const backgroundColor = 0x0a1a2f
  const aliveCellColor = 0x60a5fa
  const deadCellColor = 0x1a2a4f

  onMount(() => {
    // 画面サイズに合わせたグリッドサイズを計算
    const targetCellSize = 10 // 目標セルサイズ（px）
    const gridWidth = Math.floor(window.innerWidth / targetCellSize)
    const gridHeight = Math.floor(window.innerHeight / targetCellSize)

    // グリッドサイズを更新
    simulationStore.setGridSize({ width: gridWidth, height: gridHeight })

    // レンダラー初期化
    renderer = new LifeRenderer(canvasElement, {
      width: window.innerWidth,
      height: window.innerHeight,
      backgroundColor,
      aliveCellColor,
      deadCellColor,
    })

    // リサイズハンドラー
    const handleResize = () => {
      if (renderer) {
        renderer.resize(window.innerWidth, window.innerHeight)

        // グリッドサイズも再計算
        const newGridWidth = Math.floor(window.innerWidth / targetCellSize)
        const newGridHeight = Math.floor(window.innerHeight / targetCellSize)
        simulationStore.setGridSize({ width: newGridWidth, height: newGridHeight })
      }
    }
    window.addEventListener('resize', handleResize)

    // アニメーションループ開始
    startAnimationLoop()

    return () => {
      window.removeEventListener('resize', handleResize)
    }
  })

  onDestroy(() => {
    // リソース解放
    if (animationFrameId !== null) {
      cancelAnimationFrame(animationFrameId)
    }
    if (renderer) {
      renderer.destroy()
    }
  })

  /**
   * アニメーションループ
   */
  function startAnimationLoop() {
    const loop = (currentTime: number) => {
      animationFrameId = requestAnimationFrame(loop)

      const state = $simulationStore

      // シミュレーション更新（速度に応じて）
      if (state.isPlaying && currentTime - lastUpdateTime >= state.speed) {
        simulationStore.nextGeneration()
        lastUpdateTime = currentTime
      }

      // 描画
      if (renderer) {
        renderer.render(state.grid, aliveCellColor, deadCellColor)
      }
    }

    animationFrameId = requestAnimationFrame(loop)
  }
</script>

<canvas
  bind:this={canvasElement}
  class="fixed inset-0 w-full h-full"
  aria-label="Conway's Game of Life"
></canvas>

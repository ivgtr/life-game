<script lang="ts">
  import { onMount, onDestroy } from 'svelte'
  import { initWebGPU } from '$lib/gpu/WebGPUContext'
  import { BufferManager } from '$lib/gpu/BufferManager'
  import { ComputePipeline } from '$lib/gpu/ComputePipeline'
  import { RenderPipeline, type ThemeColors, type ViewportState } from '$lib/gpu/RenderPipeline'
  import { MSDFAtlasManager } from '$lib/font/MSDFAtlasManager'
  import { generateRandomSeed } from '$lib/features/seed/RandomSeed'
  import { WordDetector } from '$lib/features/detection/WordDetector'
  import type { DetectedWord } from '$lib/features/detection/types'
  import { CellFlags } from '$lib/types/cell'

  interface Props {
    gridWidth?: number
    gridHeight?: number
    isPlaying?: boolean
    speed?: number
    mutationStrength?: number
    decaySteps?: number
    maxAge?: number
    spontaneousRate?: number
    theme?: ThemeColors
    scanInterval?: number
    onReady?: () => void
    onError?: (msg: string) => void
    onStep?: (step: number) => void
    onWordsDetected?: (words: DetectedWord[]) => void
  }

  const {
    gridWidth = 256,
    gridHeight = 256,
    isPlaying = true,
    speed = 10,
    mutationStrength = 0.5,
    decaySteps = 5,
    maxAge = 80,
    spontaneousRate = 0.001,
    theme = {
      bg: [0.04, 0.04, 0.04, 1.0],
      alive: [0.3, 0.9, 0.4, 1.0],
      decay: [0.2, 0.5, 0.3, 0.6],
      highlight: [1.0, 0.9, 0.2, 1.0],
    },
    scanInterval = 10,
    onReady,
    onError,
    onStep,
    onWordsDetected,
  }: Props = $props()

  let canvas: HTMLCanvasElement
  let animFrameId: number
  let buffers: BufferManager
  let computePipeline: ComputePipeline
  let renderPipeline: RenderPipeline
  let device: GPUDevice
  let context: GPUCanvasContext
  let stepCount = 0
  let pingPong = 0
  let lastStepTime = 0
  let lastScanStep = 0

  // 意味検出
  let detector: WordDetector | null = null

  // ビューポート
  let viewport: ViewportState = { x: 0, y: 0, scale: 1.0 }
  let isDragging = false
  let dragStart = { x: 0, y: 0 }
  const CELL_SIZE = 16

  /** ビューポートをグリッド範囲内にクランプ */
  function clampViewport(): void {
    if (!canvas) return

    const worldW = gridWidth * CELL_SIZE
    const worldH = gridHeight * CELL_SIZE

    // ズーム下限: グリッドが画面を完全に覆う最小スケール
    const minScale = Math.max(
      canvas.width / worldW,
      canvas.height / worldH,
    )
    viewport.scale = Math.max(viewport.scale, minScale)

    // 可視範囲（ワールド座標）
    const visibleW = canvas.width / viewport.scale
    const visibleH = canvas.height / viewport.scale

    // パン範囲をクランプ: グリッドの外が見えないようにする
    viewport.x = Math.max(0, Math.min(viewport.x, worldW - visibleW))
    viewport.y = Math.max(0, Math.min(viewport.y, worldH - visibleH))
  }

  /** ビューポートをグリッド中央にセンタリング */
  function centerViewport(): void {
    if (!canvas) return

    const worldW = gridWidth * CELL_SIZE
    const worldH = gridHeight * CELL_SIZE

    // 画面を覆うスケール（Math.max でグリッドが画面をフィル）
    viewport.scale = Math.max(
      canvas.width / worldW,
      canvas.height / worldH,
    )

    // 中央配置
    const visibleW = canvas.width / viewport.scale
    const visibleH = canvas.height / viewport.scale
    viewport.x = (worldW - visibleW) / 2
    viewport.y = (worldH - visibleH) / 2
  }

  /** 外部からセルデータを設定 */
  export function setCellData(data: ArrayBuffer): void {
    if (buffers) {
      buffers.writeCells(data)
      stepCount = 0
      pingPong = 0
      onStep?.(0)
    }
  }

  /** ランダムシードでリセット */
  export function reset(): void {
    if (buffers) {
      buffers.writeCells(generateRandomSeed(gridWidth, gridHeight))
      stepCount = 0
      pingPong = 0
      onStep?.(0)
    }
  }

  /** 検出された単語のセルにハイライトフラグを設定 */
  function applyHighlights(words: DetectedWord[]): void {
    if (!buffers || !device) return

    const cellCount = gridWidth * gridHeight
    const highlightIndices: number[] = []

    for (const word of words) {
      for (const cell of word.cells) {
        const idx = cell.row * gridWidth + cell.col
        if (idx >= 0 && idx < cellCount) {
          highlightIndices.push(idx)
        }
      }
    }

    if (highlightIndices.length === 0) return

    // NOTE: ハイライトフラグはCompute Shaderで次のステップで上書きされるため、
    // 将来的にはCompute Shader側でフラグを保持する仕組みが必要
    void highlightIndices
    void CellFlags
  }

  /** グリッドスキャンを実行 */
  async function performScan(): Promise<void> {
    if (!detector || !buffers) return

    try {
      const cellData = await buffers.readCells()
      detector.scan(cellData, gridWidth, gridHeight, stepCount)
    } catch {
      // readback失敗時は静かにスキップ
    }
  }

  onMount(async () => {
    const result = await initWebGPU()
    if (!result.ok) {
      onError?.(result.error.message)
      return
    }

    device = result.value.device
    const format = result.value.format

    // Canvas setup
    context = canvas.getContext('webgpu')!
    const dpr = window.devicePixelRatio || 1
    canvas.width = canvas.clientWidth * dpr
    canvas.height = canvas.clientHeight * dpr
    context.configure({ device, format, alphaMode: 'premultiplied' })

    // Atlas
    const atlas = new MSDFAtlasManager()
    await atlas.load(device)

    // Buffers
    buffers = new BufferManager(device, { width: gridWidth, height: gridHeight })
    buffers.writeCells(generateRandomSeed(gridWidth, gridHeight))
    buffers.writeUniforms(0, mutationStrength, decaySteps, Math.floor(Math.random() * 0xFFFFFF), maxAge, spontaneousRate)

    // Pipelines
    computePipeline = new ComputePipeline(device, buffers)
    renderPipeline = new RenderPipeline(device, buffers, atlas, format)

    // Word detector
    detector = new WordDetector()
    detector.setOnDetect((words) => {
      applyHighlights(words)
      onWordsDetected?.(words)
    })

    // ビューポートを中央配置
    centerViewport()

    onReady?.()

    // Resize observer
    const observer = new ResizeObserver(() => {
      const dpr = window.devicePixelRatio || 1
      canvas.width = canvas.clientWidth * dpr
      canvas.height = canvas.clientHeight * dpr
      context.configure({ device, format, alphaMode: 'premultiplied' })
      clampViewport()
    })
    observer.observe(canvas)

    // Animation loop
    function frame(now: number): void {
      animFrameId = requestAnimationFrame(frame)

      // Compute step (rate limited)
      const stepInterval = 1000 / speed
      if (isPlaying && now - lastStepTime >= stepInterval) {
        lastStepTime = now
        stepCount++
        buffers.writeUniforms(stepCount, mutationStrength, decaySteps, Math.floor(Math.random() * 0xFFFFFF), maxAge, spontaneousRate)

        const encoder = device.createCommandEncoder()
        computePipeline.encode(encoder, pingPong)
        device.queue.submit([encoder.finish()])
        pingPong = 1 - pingPong
        buffers.swap()
        onStep?.(stepCount)

        // 定期的にグリッドスキャン
        if (stepCount - lastScanStep >= scanInterval) {
          lastScanStep = stepCount
          performScan()
        }
      }

      // Render
      const textureView = context.getCurrentTexture().createView()
      renderPipeline.setPingPong(pingPong)
      renderPipeline.updateUniforms(canvas.width, canvas.height, CELL_SIZE, viewport, theme)

      const encoder = device.createCommandEncoder()
      renderPipeline.encode(encoder, textureView, theme)
      device.queue.submit([encoder.finish()])
    }

    animFrameId = requestAnimationFrame(frame)
  })

  onDestroy(() => {
    if (animFrameId) cancelAnimationFrame(animFrameId)
    detector?.destroy()
    renderPipeline?.destroy()
    buffers?.destroy()
  })

  // Mouse events for pan/zoom
  function onWheel(e: WheelEvent): void {
    e.preventDefault()

    // ズーム前のカーソル位置をワールド座標で記録（カーソル中心ズーム）
    const dpr = window.devicePixelRatio || 1
    const cursorScreenX = e.offsetX * dpr
    const cursorScreenY = e.offsetY * dpr
    const worldX = viewport.x + cursorScreenX / viewport.scale
    const worldY = viewport.y + cursorScreenY / viewport.scale

    const factor = e.deltaY > 0 ? 0.9 : 1.1
    viewport.scale *= factor

    // カーソル位置を基準にビューポートを調整
    viewport.x = worldX - cursorScreenX / viewport.scale
    viewport.y = worldY - cursorScreenY / viewport.scale
    clampViewport()
  }

  function onPointerDown(e: PointerEvent): void {
    isDragging = true
    dragStart = { x: e.clientX, y: e.clientY }
    ;(e.target as HTMLElement).setPointerCapture(e.pointerId)
  }

  function onPointerMove(e: PointerEvent): void {
    if (!isDragging) return
    const dx = e.clientX - dragStart.x
    const dy = e.clientY - dragStart.y
    const dpr = window.devicePixelRatio || 1
    viewport.x -= dx * dpr / viewport.scale
    viewport.y -= dy * dpr / viewport.scale
    dragStart = { x: e.clientX, y: e.clientY }
    clampViewport()
  }

  function onPointerUp(): void {
    isDragging = false
  }
</script>

<canvas
  bind:this={canvas}
  class="h-full w-full"
  onwheel={onWheel}
  onpointerdown={onPointerDown}
  onpointermove={onPointerMove}
  onpointerup={onPointerUp}
></canvas>

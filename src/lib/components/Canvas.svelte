<script lang="ts">
  import { onMount, onDestroy } from 'svelte'
  import { initWebGPU } from '$lib/gpu/WebGPUContext'
  import { BufferManager } from '$lib/gpu/BufferManager'
  import { ComputePipeline } from '$lib/gpu/ComputePipeline'
  import { RenderPipeline, type ThemeColors, type ViewportState } from '$lib/gpu/RenderPipeline'
  import { MSDFAtlasManager } from '$lib/font/MSDFAtlasManager'
  import { generateRandomSeed } from '$lib/features/seed/RandomSeed'

  interface Props {
    gridWidth?: number
    gridHeight?: number
    isPlaying?: boolean
    speed?: number
    mutationStrength?: number
    decaySteps?: number
    theme?: ThemeColors
    onReady?: () => void
    onError?: (msg: string) => void
    onStep?: (step: number) => void
  }

  const {
    gridWidth = 256,
    gridHeight = 256,
    isPlaying = true,
    speed = 10,
    mutationStrength = 0.5,
    decaySteps = 5,
    theme = {
      bg: [0.04, 0.04, 0.04, 1.0],
      alive: [0.3, 0.9, 0.4, 1.0],
      decay: [0.2, 0.5, 0.3, 0.6],
      highlight: [1.0, 0.9, 0.2, 1.0],
    },
    onReady,
    onError,
    onStep,
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

  // ビューポート
  let viewport: ViewportState = { x: 0, y: 0, scale: 1.0 }
  let isDragging = false
  let dragStart = { x: 0, y: 0 }

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
    buffers.writeUniforms(0, mutationStrength, decaySteps, Math.floor(Math.random() * 0xFFFFFF))

    // Pipelines
    computePipeline = new ComputePipeline(device, buffers)
    renderPipeline = new RenderPipeline(device, buffers, atlas, format)

    // Auto-center viewport
    const cellSize = 16
    viewport.scale = Math.min(
      canvas.width / (gridWidth * cellSize),
      canvas.height / (gridHeight * cellSize),
    )

    onReady?.()

    // Resize observer
    const observer = new ResizeObserver(() => {
      const dpr = window.devicePixelRatio || 1
      canvas.width = canvas.clientWidth * dpr
      canvas.height = canvas.clientHeight * dpr
      context.configure({ device, format, alphaMode: 'premultiplied' })
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
        buffers.writeUniforms(stepCount, mutationStrength, decaySteps, Math.floor(Math.random() * 0xFFFFFF))

        const encoder = device.createCommandEncoder()
        computePipeline.encode(encoder, pingPong)
        device.queue.submit([encoder.finish()])
        pingPong = 1 - pingPong
        buffers.swap()
        onStep?.(stepCount)
      }

      // Render
      const textureView = context.getCurrentTexture().createView()
      const cellSize = 16
      renderPipeline.setPingPong(pingPong)
      renderPipeline.updateUniforms(canvas.width, canvas.height, cellSize, viewport, theme)

      const encoder = device.createCommandEncoder()
      renderPipeline.encode(encoder, textureView, theme)
      device.queue.submit([encoder.finish()])
    }

    animFrameId = requestAnimationFrame(frame)
  })

  onDestroy(() => {
    if (animFrameId) cancelAnimationFrame(animFrameId)
    renderPipeline?.destroy()
    buffers?.destroy()
  })

  // Mouse events for pan/zoom
  function onWheel(e: WheelEvent): void {
    e.preventDefault()
    const factor = e.deltaY > 0 ? 0.9 : 1.1
    viewport.scale *= factor
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

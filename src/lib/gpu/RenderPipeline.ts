import type { BufferManager } from './BufferManager'
import type { MSDFAtlasManager } from '$lib/font/MSDFAtlasManager'
import textRenderShader from './shaders/text_render.wgsl?raw'

export interface ThemeColors {
  bg: [number, number, number, number]
  alive: [number, number, number, number]
  decay: [number, number, number, number]
  highlight: [number, number, number, number]
}

export interface ViewportState {
  x: number
  y: number
  scale: number
}

export class RenderPipeline {
  private pipeline: GPURenderPipeline
  private bindGroup!: GPUBindGroup
  private uniformBuffer: GPUBuffer
  private glyphUVBuffer: GPUBuffer
  private sampler: GPUSampler
  private bindGroupLayout: GPUBindGroupLayout
  private pingPong = 0

  constructor(
    private device: GPUDevice,
    private buffers: BufferManager,
    private atlas: MSDFAtlasManager,
    format: GPUTextureFormat,
  ) {
    const shaderModule = device.createShaderModule({
      label: 'text-render-shader',
      code: textRenderShader,
    })

    this.bindGroupLayout = device.createBindGroupLayout({
      label: 'render-bind-group-layout',
      entries: [
        { binding: 0, visibility: GPUShaderStage.VERTEX | GPUShaderStage.FRAGMENT, buffer: { type: 'read-only-storage' } },
        { binding: 1, visibility: GPUShaderStage.VERTEX, buffer: { type: 'read-only-storage' } },
        { binding: 2, visibility: GPUShaderStage.VERTEX | GPUShaderStage.FRAGMENT, buffer: { type: 'uniform' } },
        { binding: 3, visibility: GPUShaderStage.FRAGMENT, texture: { sampleType: 'float' } },
        { binding: 4, visibility: GPUShaderStage.FRAGMENT, sampler: {} },
      ],
    })

    const pipelineLayout = device.createPipelineLayout({
      label: 'render-pipeline-layout',
      bindGroupLayouts: [this.bindGroupLayout],
    })

    this.pipeline = device.createRenderPipeline({
      label: 'text-render-pipeline',
      layout: pipelineLayout,
      vertex: { module: shaderModule, entryPoint: 'vs_main' },
      fragment: {
        module: shaderModule,
        entryPoint: 'fs_main',
        targets: [{
          format,
          blend: {
            color: { srcFactor: 'src-alpha', dstFactor: 'one-minus-src-alpha' },
            alpha: { srcFactor: 'one', dstFactor: 'one-minus-src-alpha' },
          },
        }],
      },
      primitive: { topology: 'triangle-list' },
    })

    // Render uniform: 24 floats = 96 bytes → align to 128
    this.uniformBuffer = device.createBuffer({
      label: 'render-uniform',
      size: 128,
      usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
    })

    this.glyphUVBuffer = atlas.createGlyphUVBuffer(device)

    this.sampler = device.createSampler({
      label: 'atlas-sampler',
      magFilter: 'linear',
      minFilter: 'linear',
    })

    this.rebuildBindGroup(0)
  }

  private rebuildBindGroup(pingPong: number): void {
    this.bindGroup = this.device.createBindGroup({
      label: `render-bind-group-${pingPong}`,
      layout: this.bindGroupLayout,
      entries: [
        { binding: 0, resource: { buffer: this.buffers.cellBuffers[pingPong]! } },
        { binding: 1, resource: { buffer: this.glyphUVBuffer } },
        { binding: 2, resource: { buffer: this.uniformBuffer } },
        { binding: 3, resource: this.atlas.texture.createView() },
        { binding: 4, resource: this.sampler },
      ],
    })
  }

  updateUniforms(
    canvasWidth: number,
    canvasHeight: number,
    cellSize: number,
    viewport: ViewportState,
    theme: ThemeColors,
  ): void {
    const data = new Float32Array(32) // 128 bytes
    data[0] = this.buffers.gridParams.width  // u32 as f32 via bitcast in shader — actually we use f32
    data[1] = this.buffers.gridParams.height
    data[2] = cellSize
    data[3] = viewport.x
    data[4] = viewport.y
    data[5] = viewport.scale
    data[6] = canvasWidth
    data[7] = canvasHeight
    // theme colors
    data[8] = theme.bg[0]; data[9] = theme.bg[1]; data[10] = theme.bg[2]; data[11] = theme.bg[3]
    data[12] = theme.alive[0]; data[13] = theme.alive[1]; data[14] = theme.alive[2]; data[15] = theme.alive[3]
    data[16] = theme.decay[0]; data[17] = theme.decay[1]; data[18] = theme.decay[2]; data[19] = theme.decay[3]
    data[20] = theme.highlight[0]; data[21] = theme.highlight[1]; data[22] = theme.highlight[2]; data[23] = theme.highlight[3]

    this.device.queue.writeBuffer(this.uniformBuffer, 0, data)
  }

  /** 注意: render前にpingPongを設定する必要がある */
  setPingPong(p: number): void {
    if (p !== this.pingPong) {
      this.pingPong = p
      this.rebuildBindGroup(p)
    }
  }

  encode(encoder: GPUCommandEncoder, textureView: GPUTextureView, theme: ThemeColors): void {
    const pass = encoder.beginRenderPass({
      label: 'text-render-pass',
      colorAttachments: [{
        view: textureView,
        clearValue: { r: theme.bg[0], g: theme.bg[1], b: theme.bg[2], a: theme.bg[3] },
        loadOp: 'clear',
        storeOp: 'store',
      }],
    })

    pass.setPipeline(this.pipeline)
    pass.setBindGroup(0, this.bindGroup)
    // 6 vertices per cell instance
    const instanceCount = this.buffers.gridParams.width * this.buffers.gridParams.height
    pass.draw(6, instanceCount)
    pass.end()
  }

  destroy(): void {
    this.uniformBuffer.destroy()
    this.glyphUVBuffer.destroy()
  }
}

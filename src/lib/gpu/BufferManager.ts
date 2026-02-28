import { CELL_BYTE_SIZE, type GridParams } from '$lib/types/cell'

/** GPU バッファ群を管理（ダブルバッファリング） */
export class BufferManager {
  readonly cellBuffers: [GPUBuffer, GPUBuffer]
  readonly uniformBuffer: GPUBuffer
  readonly gridParams: GridParams
  private pingPong = 0

  constructor(
    private device: GPUDevice,
    params: GridParams,
  ) {
    this.gridParams = params
    const cellCount = params.width * params.height
    const bufferSize = cellCount * CELL_BYTE_SIZE

    this.cellBuffers = [
      device.createBuffer({
        label: 'cell-buffer-0',
        size: bufferSize,
        usage: GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_DST | GPUBufferUsage.COPY_SRC,
      }),
      device.createBuffer({
        label: 'cell-buffer-1',
        size: bufferSize,
        usage: GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_DST | GPUBufferUsage.COPY_SRC,
      }),
    ]

    // uniform: width(u32) + height(u32) + tick(u32) + mutationStrength(f32) + decaySteps(u32) + seed(u32) = 24 bytes
    this.uniformBuffer = device.createBuffer({
      label: 'uniform-buffer',
      size: 32, // 24 bytes aligned to 32
      usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
    })
  }

  get currentBuffer(): GPUBuffer {
    return this.cellBuffers[this.pingPong]!
  }

  get nextBuffer(): GPUBuffer {
    return this.cellBuffers[1 - this.pingPong]!
  }

  swap(): void {
    this.pingPong = 1 - this.pingPong
  }

  /** 初期セルデータをGPUに書き込む */
  writeCells(data: ArrayBuffer): void {
    this.device.queue.writeBuffer(this.currentBuffer, 0, data)
  }

  /** uniform パラメータを更新 */
  writeUniforms(tick: number, mutationStrength: number, decaySteps: number, seed: number): void {
    const data = new ArrayBuffer(32)
    const view = new DataView(data)
    view.setUint32(0, this.gridParams.width, true)
    view.setUint32(4, this.gridParams.height, true)
    view.setUint32(8, tick, true)
    view.setFloat32(12, mutationStrength, true)
    view.setUint32(16, decaySteps, true)
    view.setUint32(20, seed, true)
    this.device.queue.writeBuffer(this.uniformBuffer, 0, data)
  }

  /** 現在のセルバッファをCPUに読み戻す */
  async readCells(): Promise<ArrayBuffer> {
    const cellCount = this.gridParams.width * this.gridParams.height
    const bufferSize = cellCount * CELL_BYTE_SIZE

    const stagingBuffer = this.device.createBuffer({
      label: 'cell-readback-staging',
      size: bufferSize,
      usage: GPUBufferUsage.MAP_READ | GPUBufferUsage.COPY_DST,
    })

    const encoder = this.device.createCommandEncoder()
    encoder.copyBufferToBuffer(this.currentBuffer, 0, stagingBuffer, 0, bufferSize)
    this.device.queue.submit([encoder.finish()])

    await stagingBuffer.mapAsync(GPUMapMode.READ)
    const data = stagingBuffer.getMappedRange().slice(0)
    stagingBuffer.unmap()
    stagingBuffer.destroy()

    return data
  }

  destroy(): void {
    this.cellBuffers[0].destroy()
    this.cellBuffers[1].destroy()
    this.uniformBuffer.destroy()
  }
}

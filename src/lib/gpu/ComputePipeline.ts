import type { BufferManager } from './BufferManager'
import automatonShader from './shaders/automaton.wgsl?raw'

export class ComputePipeline {
  private pipeline: GPUComputePipeline
  private bindGroups: [GPUBindGroup, GPUBindGroup]

  constructor(
    device: GPUDevice,
    private buffers: BufferManager,
  ) {
    const shaderModule = device.createShaderModule({
      label: 'automaton-compute',
      code: automatonShader,
    })

    const bindGroupLayout = device.createBindGroupLayout({
      label: 'compute-bind-group-layout',
      entries: [
        { binding: 0, visibility: GPUShaderStage.COMPUTE, buffer: { type: 'read-only-storage' } },
        { binding: 1, visibility: GPUShaderStage.COMPUTE, buffer: { type: 'storage' } },
        { binding: 2, visibility: GPUShaderStage.COMPUTE, buffer: { type: 'uniform' } },
      ],
    })

    const pipelineLayout = device.createPipelineLayout({
      label: 'compute-pipeline-layout',
      bindGroupLayouts: [bindGroupLayout],
    })

    this.pipeline = device.createComputePipeline({
      label: 'automaton-pipeline',
      layout: pipelineLayout,
      compute: { module: shaderModule, entryPoint: 'main' },
    })

    // 2つのバインドグループ（ping-pong用）
    this.bindGroups = [
      device.createBindGroup({
        label: 'compute-bind-group-0',
        layout: bindGroupLayout,
        entries: [
          { binding: 0, resource: { buffer: buffers.cellBuffers[0] } },
          { binding: 1, resource: { buffer: buffers.cellBuffers[1] } },
          { binding: 2, resource: { buffer: buffers.uniformBuffer } },
        ],
      }),
      device.createBindGroup({
        label: 'compute-bind-group-1',
        layout: bindGroupLayout,
        entries: [
          { binding: 0, resource: { buffer: buffers.cellBuffers[1] } },
          { binding: 1, resource: { buffer: buffers.cellBuffers[0] } },
          { binding: 2, resource: { buffer: buffers.uniformBuffer } },
        ],
      }),
    ]
  }

  /** 1ステップ実行するコマンドをエンコード */
  encode(encoder: GPUCommandEncoder, pingPong: number): void {
    const pass = encoder.beginComputePass({ label: 'automaton-compute-pass' })
    pass.setPipeline(this.pipeline)
    pass.setBindGroup(0, this.bindGroups[pingPong]!)
    const workgroupsX = Math.ceil(this.buffers.gridParams.width / 16)
    const workgroupsY = Math.ceil(this.buffers.gridParams.height / 16)
    pass.dispatchWorkgroups(workgroupsX, workgroupsY)
    pass.end()
  }
}

/** WebGPU 初期化結果 */
export interface WebGPUContextResult {
  readonly device: GPUDevice
  readonly adapter: GPUAdapter
  readonly format: GPUTextureFormat
  onDeviceLost(callback: (info: GPUDeviceLostInfo) => void): void
}

/** WebGPU 初期化エラーの種別 */
export type WebGPUError =
  | { kind: 'not-supported'; message: string }
  | { kind: 'adapter-unavailable'; message: string }
  | { kind: 'device-request-failed'; message: string; cause?: unknown }

/** WebGPU 初期化結果型 */
export type WebGPUInitResult =
  | { ok: true; value: WebGPUContextResult }
  | { ok: false; error: WebGPUError }

export async function initWebGPU(): Promise<WebGPUInitResult> {
  if (!navigator.gpu) {
    return {
      ok: false,
      error: { kind: 'not-supported', message: 'WebGPU is not supported in this browser' },
    }
  }

  const adapter = await navigator.gpu.requestAdapter()
  if (!adapter) {
    return {
      ok: false,
      error: { kind: 'adapter-unavailable', message: 'No GPU adapter available' },
    }
  }

  let device: GPUDevice
  try {
    device = await adapter.requestDevice({
      requiredLimits: {
        maxStorageBufferBindingSize: 256 * 1024 * 1024, // 256MB
        maxBufferSize: 256 * 1024 * 1024,
      },
    })
  } catch (e) {
    return {
      ok: false,
      error: {
        kind: 'device-request-failed',
        message: 'Failed to request GPU device',
        cause: e,
      },
    }
  }

  const format = navigator.gpu.getPreferredCanvasFormat()

  const result: WebGPUContextResult = {
    device,
    adapter,
    format,
    onDeviceLost(callback) {
      device.lost.then(callback)
    },
  }

  return { ok: true, value: result }
}

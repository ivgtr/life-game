/**
 * WebGPU コンテキスト管理
 *
 * GPU デバイスの初期化・管理を担当する。
 * Phase 1 で実装を完成させる。
 */

/** WebGPU 初期化結果 */
export interface WebGPUContextResult {
  readonly device: GPUDevice
  readonly adapter: GPUAdapter
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

/**
 * WebGPU デバイスを初期化する。
 * 非対応環境ではエラーを返す。
 */
export async function initWebGPU(): Promise<WebGPUInitResult> {
  // Phase 1 で実装
  throw new Error('Not implemented')
}

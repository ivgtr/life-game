import type { DetectedPhrase, ScanRequest, ScanResponse } from './types'
import DetectionWorker from './detection.worker?worker'

/** フレーズ検出の管理クラス */
export class PhraseDetector {
  private worker: Worker
  private scanning = false
  private onDetect: ((phrases: DetectedPhrase[]) => void) | null = null

  constructor() {
    this.worker = new DetectionWorker()
    this.worker.onmessage = (e: MessageEvent<ScanResponse>) => {
      if (e.data.type === 'ready') return
      this.scanning = false
      if (e.data.phrases.length > 0) {
        this.onDetect?.(e.data.phrases)
      }
    }
  }

  /** 検出コールバックを設定 */
  setOnDetect(callback: (phrases: DetectedPhrase[]) => void): void {
    this.onDetect = callback
  }

  /** グリッドをスキャンしてフレーズを検出（非同期） */
  scan(cellData: ArrayBuffer, width: number, height: number, generation: number): void {
    if (this.scanning) return

    this.scanning = true
    const message: ScanRequest = {
      type: 'scan',
      cellData,
      width,
      height,
      generation,
    }
    this.worker.postMessage(message, [cellData])
  }

  destroy(): void {
    this.worker.terminate()
  }
}

import type { DetectedWord, DetectionRequest, DetectionResponse } from './types'
import DetectionWorker from './detection.worker?worker'

/** 意味検出の管理クラス */
export class WordDetector {
  private worker: Worker
  private scanning = false
  private onDetect: ((words: DetectedWord[]) => void) | null = null

  constructor() {
    this.worker = new DetectionWorker()
    this.worker.onmessage = (e: MessageEvent<DetectionResponse>) => {
      this.scanning = false
      if (e.data.words.length > 0) {
        this.onDetect?.(e.data.words)
      }
    }
  }

  /** 検出コールバックを設定 */
  setOnDetect(callback: (words: DetectedWord[]) => void): void {
    this.onDetect = callback
  }

  /** グリッドをスキャンして単語を検出（非同期） */
  scan(cellData: ArrayBuffer, width: number, height: number, generation: number): void {
    if (this.scanning) return

    this.scanning = true
    const message: DetectionRequest = {
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

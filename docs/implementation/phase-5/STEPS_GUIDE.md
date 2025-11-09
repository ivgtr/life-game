# Phase 5 全ステップガイド（オプション）

このファイルはPhase 5の全6ステップの概要と実装ガイドです。

**注意**: このPhaseはオプションです。スキップしてPhase 6に進むことも可能です。

---

## Phase 5.1: SonificationSystem実装（5ステップ）

### Step 5.1.1: SonificationSystem基本構造とWeb Audio API初期化

**見積もり**: 40分

**ファイル**: `src/lib/features/audio/SonificationSystem.ts`

**実装内容**:
```typescript
/**
 * ソニフィケーションシステム
 * セルの活動を音に変換
 */
export class SonificationSystem {
  private audioContext: AudioContext | null = null
  private masterGain: GainNode | null = null
  private oscillators: Map<string, OscillatorNode> = new Map()

  // 音響パラメータ
  private baseFrequency = 200 // Hz
  private maxFrequency = 1000 // Hz
  private maxVolume = 0.3 // 最大音量（0-1）

  // 状態
  private isEnabled = false
  private isInitialized = false

  /**
   * Web Audio APIを初期化
   * ユーザーインタラクション後に呼ぶ必要がある
   */
  async init(): Promise<void> {
    if (this.isInitialized) return

    try {
      // AudioContext作成
      this.audioContext = new (window.AudioContext ||
        (window as any).webkitAudioContext)()

      // マスターゲイン作成
      this.masterGain = this.audioContext.createGain()
      this.masterGain.gain.value = 0 // 初期は無音
      this.masterGain.connect(this.audioContext.destination)

      this.isInitialized = true
      console.log('SonificationSystem initialized')
    } catch (error) {
      console.error('Failed to initialize Web Audio API:', error)
    }
  }

  /**
   * 音響を有効化
   */
  enable(): void {
    if (!this.isInitialized) {
      console.warn('SonificationSystem not initialized. Call init() first.')
      return
    }

    this.isEnabled = true

    // マスターゲインをフェードイン
    if (this.masterGain && this.audioContext) {
      this.masterGain.gain.cancelScheduledValues(this.audioContext.currentTime)
      this.masterGain.gain.setValueAtTime(0, this.audioContext.currentTime)
      this.masterGain.gain.linearRampToValueAtTime(
        this.maxVolume,
        this.audioContext.currentTime + 0.5
      )
    }
  }

  /**
   * 音響を無効化
   */
  disable(): void {
    this.isEnabled = false

    // マスターゲインをフェードアウト
    if (this.masterGain && this.audioContext) {
      this.masterGain.gain.cancelScheduledValues(this.audioContext.currentTime)
      this.masterGain.gain.setValueAtTime(
        this.masterGain.gain.value,
        this.audioContext.currentTime
      )
      this.masterGain.gain.linearRampToValueAtTime(
        0,
        this.audioContext.currentTime + 0.5
      )
    }

    // すべてのオシレーターを停止
    setTimeout(() => {
      this.stopAllOscillators()
    }, 500)
  }

  /**
   * リソース解放
   */
  destroy(): void {
    this.disable()

    if (this.audioContext) {
      this.audioContext.close()
      this.audioContext = null
    }

    this.masterGain = null
    this.oscillators.clear()
    this.isInitialized = false
  }

  /**
   * すべてのオシレーターを停止
   */
  private stopAllOscillators(): void {
    for (const [key, oscillator] of this.oscillators) {
      try {
        oscillator.stop()
        oscillator.disconnect()
      } catch (e) {
        // すでに停止している場合のエラーを無視
      }
    }
    this.oscillators.clear()
  }
}
```

**チェックポイント**:
- [ ] クラス定義
- [ ] AudioContext初期化
- [ ] enable/disable実装
- [ ] リソース管理実装

---

### Step 5.1.2: 密度・活動度計算

**見積もり**: 30分

**実装内容**（SonificationSystem.tsに追加）:
```typescript
import type { CellState } from '$lib/types/lifegame'

/**
 * グリッドの密度を計算
 * @param grid セルグリッド
 * @returns 密度（0-1）
 */
calculateDensity(grid: Map<string, CellState>): number {
  if (grid.size === 0) return 0

  // 生存セル数をカウント
  let aliveCount = 0
  for (const state of grid.values()) {
    if (state === 1) aliveCount++
  }

  // 密度 = 生存セル数 / 総セル数
  // スパースマップなので、生存セルのみカウント
  return Math.min(aliveCount / 1000, 1) // 1000セルを基準
}

/**
 * グリッドの活動度を計算
 * 前回との差分を見る
 */
private previousGrid: Map<string, CellState> = new Map()

calculateActivity(grid: Map<string, CellState>): number {
  if (this.previousGrid.size === 0) {
    this.previousGrid = new Map(grid)
    return 0.5 // 初回は中間値
  }

  // 変化したセル数をカウント
  let changes = 0
  const allKeys = new Set([...grid.keys(), ...this.previousGrid.keys()])

  for (const key of allKeys) {
    const current = grid.get(key) ?? 0
    const previous = this.previousGrid.get(key) ?? 0

    if (current !== previous) {
      changes++
    }
  }

  this.previousGrid = new Map(grid)

  // 活動度 = 変化したセル数 / 総セル数
  return Math.min(changes / 100, 1) // 100セル変化を基準
}
```

**チェックポイント**:
- [ ] 密度計算実装
- [ ] 活動度計算実装
- [ ] 履歴管理実装

---

### Step 5.1.3: レベル別倍音構成（getHarmonicsForLevel）

**見積もり**: 30分

**実装内容**（SonificationSystem.tsに追加）:
```typescript
import { ZoomLevel } from '$lib/types/zoom'

/**
 * ズームレベルに応じた倍音構成を取得
 *
 * マクロレベル: 低音多め
 * ミクロレベル: 高音多め
 */
getHarmonicsForLevel(level: ZoomLevel): number[] {
  // -5..8 → 0..1
  const normalized =
    (level - ZoomLevel.COSMOS) / (ZoomLevel.QUANTUM - ZoomLevel.COSMOS)

  // 倍音構成（基音の倍数）
  const harmonics: number[] = [
    1, // 基音
    2 + normalized, // 2倍音（レベルに応じて変化）
    3 + normalized * 2, // 3倍音
    4 + normalized * 3, // 4倍音
  ]

  return harmonics
}

/**
 * 倍音の音量比率を取得
 *
 * 基音が一番大きく、高次倍音ほど小さくなる
 */
getHarmonicAmplitudes(): number[] {
  return [
    1.0, // 基音: 100%
    0.5, // 2倍音: 50%
    0.25, // 3倍音: 25%
    0.125, // 4倍音: 12.5%
  ]
}
```

**チェックポイント**:
- [ ] レベル別倍音構成実装
- [ ] 音量比率定義
- [ ] マクロ/ミクロで音色変化

---

### Step 5.1.4: トーン生成（playTone）

**見積もり**: 60分

**実装内容**（SonificationSystem.tsに追加）:
```typescript
/**
 * トーンを再生
 *
 * @param grid セルグリッド
 * @param level 現在のズームレベル
 */
updateSound(grid: Map<string, CellState>, level: ZoomLevel): void {
  if (!this.isEnabled || !this.audioContext || !this.masterGain) return

  // 密度と活動度を計算
  const density = this.calculateDensity(grid)
  const activity = this.calculateActivity(grid)

  // 音響パラメータを計算
  const volume = density * this.maxVolume
  const frequency =
    this.baseFrequency + activity * (this.maxFrequency - this.baseFrequency)

  // 倍音構成を取得
  const harmonics = this.getHarmonicsForLevel(level)
  const amplitudes = this.getHarmonicAmplitudes()

  // トーンを再生
  this.playTone(frequency, volume, harmonics, amplitudes)
}

/**
 * トーンを再生（加算合成）
 */
private playTone(
  baseFrequency: number,
  volume: number,
  harmonics: number[],
  amplitudes: number[]
): void {
  if (!this.audioContext || !this.masterGain) return

  const now = this.audioContext.currentTime

  // 既存のオシレーターをフェードアウト＆削除
  for (const [key, oscillator] of this.oscillators) {
    const gain = (oscillator as any).gainNode as GainNode
    if (gain) {
      gain.gain.cancelScheduledValues(now)
      gain.gain.setValueAtTime(gain.gain.value, now)
      gain.gain.linearRampToValueAtTime(0, now + 0.1)
    }

    setTimeout(() => {
      try {
        oscillator.stop()
        oscillator.disconnect()
      } catch (e) {
        // すでに停止済み
      }
      this.oscillators.delete(key)
    }, 100)
  }

  // 新しいオシレーターを作成（各倍音）
  harmonics.forEach((harmonic, index) => {
    const oscillator = this.audioContext!.createOscillator()
    const gain = this.audioContext!.createGain()

    // 周波数設定
    oscillator.frequency.value = baseFrequency * harmonic

    // 音量設定
    const harmonicVolume = volume * (amplitudes[index] ?? 0.1)
    gain.gain.setValueAtTime(0, now)
    gain.gain.linearRampToValueAtTime(harmonicVolume, now + 0.1)

    // 接続
    oscillator.connect(gain)
    gain.connect(this.masterGain!)

    // 波形設定（倍音ごとに変える）
    oscillator.type = index === 0 ? 'sine' : 'triangle'

    // 開始
    oscillator.start(now)

    // 保存
    const key = `harmonic_${index}`
    ;(oscillator as any).gainNode = gain
    this.oscillators.set(key, oscillator)
  })
}
```

**チェックポイント**:
- [ ] updateSound実装
- [ ] playTone実装
- [ ] 加算合成実装
- [ ] フェードイン/アウト実装

---

### Step 5.1.5: ON/OFF切替とクリーンアップ

**見積もり**: 20分

**Note**: Step 5.1.1に含まれているため個別実装不要

**確認ポイント**:
- enable/disableメソッドの実装
- フェードイン/アウト
- リソース解放（destroy）

---

## Phase 5完了: 音響テスト（1ステップ）

### Step 5.2.1: Phase 5完了テスト

**見積もり**: 45分

**ファイル**: `src/lib/features/audio/__tests__/SonificationSystem.test.ts`

**テスト内容**:
```typescript
import { describe, it, expect, beforeEach, vi } from 'vitest'
import { SonificationSystem } from '../SonificationSystem'
import { ZoomLevel } from '$lib/types/zoom'
import type { CellState } from '$lib/types/lifegame'

// Web Audio APIのモック
global.AudioContext = vi.fn().mockImplementation(() => ({
  createOscillator: vi.fn().mockReturnValue({
    connect: vi.fn(),
    disconnect: vi.fn(),
    start: vi.fn(),
    stop: vi.fn(),
    frequency: { value: 440 },
    type: 'sine',
  }),
  createGain: vi.fn().mockReturnValue({
    connect: vi.fn(),
    disconnect: vi.fn(),
    gain: {
      value: 0,
      setValueAtTime: vi.fn(),
      linearRampToValueAtTime: vi.fn(),
      cancelScheduledValues: vi.fn(),
    },
  }),
  destination: {},
  currentTime: 0,
  close: vi.fn(),
})) as any

describe('SonificationSystem', () => {
  let system: SonificationSystem

  beforeEach(async () => {
    system = new SonificationSystem()
    await system.init()
  })

  describe('初期化', () => {
    it('初期化できる', () => {
      expect(system).toBeDefined()
    })

    it('enable/disableができる', () => {
      system.enable()
      system.disable()
      // エラーが発生しないことを確認
    })
  })

  describe('密度計算', () => {
    it('空のグリッドは密度0', () => {
      const grid = new Map<string, CellState>()
      const density = system.calculateDensity(grid)
      expect(density).toBe(0)
    })

    it('セルが多いほど密度が高い', () => {
      const grid1 = new Map<string, CellState>()
      grid1.set('0,0', 1)

      const grid2 = new Map<string, CellState>()
      for (let i = 0; i < 10; i++) {
        grid2.set(`${i},0`, 1)
      }

      const density1 = system.calculateDensity(grid1)
      const density2 = system.calculateDensity(grid2)

      expect(density2).toBeGreaterThan(density1)
    })
  })

  describe('活動度計算', () => {
    it('初回は0.5', () => {
      const grid = new Map<string, CellState>()
      grid.set('0,0', 1)

      const activity = system.calculateActivity(grid)
      expect(activity).toBe(0.5)
    })

    it('変化がないと活動度0', () => {
      const grid = new Map<string, CellState>()
      grid.set('0,0', 1)

      system.calculateActivity(grid)
      const activity = system.calculateActivity(grid)

      expect(activity).toBe(0)
    })

    it('変化があると活動度が上がる', () => {
      const grid1 = new Map<string, CellState>()
      grid1.set('0,0', 1)

      const grid2 = new Map<string, CellState>()
      grid2.set('1,0', 1)

      system.calculateActivity(grid1)
      const activity = system.calculateActivity(grid2)

      expect(activity).toBeGreaterThan(0)
    })
  })

  describe('倍音構成', () => {
    it('各ズームレベルで倍音が取得できる', () => {
      const cosmosHarmonics = system.getHarmonicsForLevel(ZoomLevel.COSMOS)
      const standardHarmonics = system.getHarmonicsForLevel(ZoomLevel.STANDARD)
      const quantumHarmonics = system.getHarmonicsForLevel(ZoomLevel.QUANTUM)

      expect(cosmosHarmonics).toHaveLength(4)
      expect(standardHarmonics).toHaveLength(4)
      expect(quantumHarmonics).toHaveLength(4)

      // レベルが異なると倍音構成も異なる
      expect(cosmosHarmonics[1]).not.toBe(quantumHarmonics[1])
    })

    it('音量比率が取得できる', () => {
      const amplitudes = system.getHarmonicAmplitudes()

      expect(amplitudes).toHaveLength(4)
      expect(amplitudes[0]).toBe(1.0) // 基音が最大
      expect(amplitudes[1]).toBeLessThan(amplitudes[0]) // 倍音は小さい
    })
  })

  describe('リソース管理', () => {
    it('destroyでリソース解放', () => {
      system.destroy()
      // エラーが発生しないことを確認
    })
  })
})
```

**実行**:
```bash
npm run test
```

**手動テスト（実機）**:

ブラウザで確認:
- [ ] 音響ON/OFFボタンが動作
- [ ] セルの密度に応じて音量が変わる
- [ ] セルの活動度に応じて周波数が変わる
- [ ] ズームレベルに応じて音色が変わる
- [ ] フェードイン/アウトがスムーズ
- [ ] 音がうるさすぎない

**チェックポイント**:
- [ ] ユニットテストパス
- [ ] 実機で音が鳴る
- [ ] 心地よい音響
- [ ] パフォーマンス問題なし

---

## UI統合（オプション）

Phase 6でAudioToggleコンポーネントを作成する際に統合します。

**簡易的な使用例**:
```svelte
<script lang="ts">
  import { SonificationSystem } from '$lib/features/audio/SonificationSystem'
  import { onMount } from 'svelte'

  const audioSystem = new SonificationSystem()
  let isAudioEnabled = false

  onMount(async () => {
    await audioSystem.init()
  })

  function toggleAudio() {
    if (isAudioEnabled) {
      audioSystem.disable()
    } else {
      audioSystem.enable()
    }
    isAudioEnabled = !isAudioEnabled
  }

  // アニメーションループ内で呼ぶ
  function updateAudio(grid, level) {
    if (isAudioEnabled) {
      audioSystem.updateSound(grid, level)
    }
  }
</script>

<button on:click={toggleAudio}>
  {isAudioEnabled ? '🔊 音響ON' : '🔇 音響OFF'}
</button>
```

---

## Phase 5完了後のアクション

- [ ] すべてのステップのチェックボックスを確認
- [ ] TypeScriptのビルドエラーがないことを確認
- [ ] テストがすべてパスすることを確認
- [ ] 実機で音響テスト実施
- [ ] 音量・周波数の調整
- [ ] コミット: `feat: Phase 5 - 音響フィードバックシステム実装（オプション）`

---

## 作成されるファイル一覧

```
src/lib/
  features/
    audio/
      SonificationSystem.ts                      # 新規作成
      __tests__/
        SonificationSystem.test.ts               # 新規作成
```

---

## 設計のポイント

### 1. Web Audio APIの制約

**Autoplay制約**:
- ユーザーインタラクション後でないと音が鳴らない
- init()を最初のクリックイベント等で呼ぶ必要がある

**対策**:
- enable()ボタンを用意
- 最初のクリックでinit()を呼ぶ

### 2. 音響パラメータ

```
密度（0-1） → 音量（0-0.3）
活動度（0-1） → 周波数（200-1000 Hz）
ズームレベル → 倍音構成
```

**調整のコツ**:
- 音量は控えめに（maxVolume = 0.3）
- 周波数範囲は心地よい範囲（200-1000Hz）
- 倍音で音色の豊かさを追加

### 3. パフォーマンス

**最適化**:
- オシレーターの再利用
- フェードイン/アウトで滑らかに
- 60fpsを維持（updateSoundは軽量）

---

## Phase 5をスキップする場合

Phase 5をスキップする場合は、Phase 6に直接進んでください。
Phase 6のAudioToggleコンポーネントの実装もスキップします。

[Phase 6: UI+状態管理](../phase-6/README.md)

---

## 次のPhase

[Phase 6: UI+状態管理](../phase-6/README.md)

---

最終更新: 2025-11-09

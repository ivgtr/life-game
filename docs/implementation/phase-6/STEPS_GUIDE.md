# Phase 6 全ステップガイド

このファイルはPhase 6の全12ステップの概要と実装ガイドです。

---

## Phase 6.1: Store実装（3ステップ）

### Step 6.1.1: viewportStore実装

**見積もり**: 30分

**ファイル**: `src/lib/stores/viewportStore.ts`

**実装内容**:
```typescript
import { writable, derived } from 'svelte/store'
import { ZoomLevel } from '$lib/types/zoom'

export interface ViewportState {
  centerX: number
  centerY: number
  zoomLevel: ZoomLevel
  displayCellSize: number
}

const createViewportStore = () => {
  const { subscribe, set, update } = writable<ViewportState>({
    centerX: 0,
    centerY: 0,
    zoomLevel: ZoomLevel.CITY,
    displayCellSize: 10
  })

  return {
    subscribe,
    set,
    update,

    // ビューポート中心を設定
    setCenter: (x: number, y: number) => {
      update(state => ({ ...state, centerX: x, centerY: y }))
    },

    // ズームレベルを変更
    setZoomLevel: (level: ZoomLevel) => {
      update(state => ({ ...state, zoomLevel: level }))
    },

    // 表示セルサイズを設定
    setDisplayCellSize: (size: number) => {
      update(state => ({ ...state, displayCellSize: size }))
    },

    // パン操作（相対移動）
    pan: (deltaX: number, deltaY: number) => {
      update(state => ({
        ...state,
        centerX: state.centerX + deltaX,
        centerY: state.centerY + deltaY
      }))
    },

    // リセット
    reset: () => {
      set({
        centerX: 0,
        centerY: 0,
        zoomLevel: ZoomLevel.CITY,
        displayCellSize: 10
      })
    }
  }
}

export const viewportStore = createViewportStore()

// Derived stores
export const currentZoomLevel = derived(
  viewportStore,
  $viewport => $viewport.zoomLevel
)

export const viewportCenter = derived(
  viewportStore,
  $viewport => ({ x: $viewport.centerX, y: $viewport.centerY })
)
```

**チェックポイント**:
- [ ] viewportStore作成
- [ ] setCenter, setZoomLevel, pan メソッド実装
- [ ] derived stores作成
- [ ] TypeScript型エラーなし

---

### Step 6.1.2: hierarchicalGridStore実装

**見積もり**: 45分

**ファイル**: `src/lib/stores/hierarchicalGridStore.ts`

**実装内容**:
```typescript
import { writable, derived, get } from 'svelte/store'
import { MultiResolutionGrid } from '$lib/features/zoom/MultiResolutionGrid'
import { QuantumLifeEngine } from '$lib/features/lifegame/QuantumLifeEngine'
import { ZoomLevel } from '$lib/types/zoom'
import { viewportStore } from './viewportStore'

export interface HierarchicalGridState {
  multiResolutionGrid: MultiResolutionGrid | null
  quantumEngine: QuantumLifeEngine | null
  isPlaying: boolean
  stepCount: number
}

const createHierarchicalGridStore = () => {
  const { subscribe, set, update } = writable<HierarchicalGridState>({
    multiResolutionGrid: null,
    quantumEngine: null,
    isPlaying: false,
    stepCount: 0
  })

  return {
    subscribe,
    set,
    update,

    // 初期化
    initialize: () => {
      const grid = new MultiResolutionGrid(ZoomLevel.CITY)
      const engine = new QuantumLifeEngine()

      update(state => ({
        ...state,
        multiResolutionGrid: grid,
        quantumEngine: engine,
        stepCount: 0
      }))
    },

    // ズームレベル変更
    setZoomLevel: (level: ZoomLevel) => {
      update(state => {
        if (state.multiResolutionGrid) {
          state.multiResolutionGrid.setZoomLevel(level)
        }
        return state
      })

      // viewportStoreも同期
      viewportStore.setZoomLevel(level)
    },

    // 1ステップ進める
    step: () => {
      update(state => {
        if (state.multiResolutionGrid && state.quantumEngine) {
          const currentGrid = state.multiResolutionGrid.getCurrentGrid()
          const nextGrid = state.quantumEngine.nextGeneration(
            currentGrid,
            state.multiResolutionGrid.getCurrentLevel()
          )

          // グリッドを更新
          state.multiResolutionGrid.setCurrentGrid(nextGrid)

          return {
            ...state,
            stepCount: state.stepCount + 1
          }
        }
        return state
      })
    },

    // 再生/停止
    togglePlay: () => {
      update(state => ({ ...state, isPlaying: !state.isPlaying }))
    },

    setPlaying: (playing: boolean) => {
      update(state => ({ ...state, isPlaying: playing }))
    },

    // リセット
    reset: () => {
      const grid = new MultiResolutionGrid(ZoomLevel.CITY)
      const engine = new QuantumLifeEngine()

      set({
        multiResolutionGrid: grid,
        quantumEngine: engine,
        isPlaying: false,
        stepCount: 0
      })
    }
  }
}

export const hierarchicalGridStore = createHierarchicalGridStore()

// Derived stores
export const currentGrid = derived(
  hierarchicalGridStore,
  $store => $store.multiResolutionGrid?.getCurrentGrid() || new Map()
)

export const isPlaying = derived(
  hierarchicalGridStore,
  $store => $store.isPlaying
)

export const stepCount = derived(
  hierarchicalGridStore,
  $store => $store.stepCount
)
```

**ポイント**:
- MultiResolutionGridとQuantumLifeEngineのインスタンス管理
- ステップ実行ロジック
- viewportStoreとの連携

**チェックポイント**:
- [ ] hierarchicalGridStore作成
- [ ] initialize, step, setZoomLevel メソッド実装
- [ ] viewportStoreとの連携実装
- [ ] derived stores作成
- [ ] TypeScript型エラーなし

---

### Step 6.1.3: audioStore実装（Phase 5実装時のみ）

**見積もり**: 20分

**条件**: Phase 5（SonificationSystem）を実装した場合のみ

**ファイル**: `src/lib/stores/audioStore.ts`

**実装内容**:
```typescript
import { writable, derived } from 'svelte/store'
import { SonificationSystem } from '$lib/features/audio/SonificationSystem'

export interface AudioState {
  sonificationSystem: SonificationSystem | null
  isEnabled: boolean
  volume: number
  isMuted: boolean
}

const createAudioStore = () => {
  const { subscribe, set, update } = writable<AudioState>({
    sonificationSystem: null,
    isEnabled: false,
    volume: 0.5,
    isMuted: false
  })

  return {
    subscribe,
    set,
    update,

    // 初期化
    initialize: async () => {
      const system = new SonificationSystem()
      await system.initialize()

      update(state => ({
        ...state,
        sonificationSystem: system
      }))
    },

    // 有効/無効切り替え
    toggleEnabled: () => {
      update(state => {
        const newEnabled = !state.isEnabled

        if (state.sonificationSystem) {
          if (newEnabled) {
            state.sonificationSystem.resume()
          } else {
            state.sonificationSystem.pause()
          }
        }

        return { ...state, isEnabled: newEnabled }
      })
    },

    setEnabled: (enabled: boolean) => {
      update(state => {
        if (state.sonificationSystem) {
          if (enabled) {
            state.sonificationSystem.resume()
          } else {
            state.sonificationSystem.pause()
          }
        }

        return { ...state, isEnabled: enabled }
      })
    },

    // 音量設定
    setVolume: (volume: number) => {
      update(state => {
        if (state.sonificationSystem) {
          state.sonificationSystem.setVolume(volume)
        }
        return { ...state, volume }
      })
    },

    // ミュート切り替え
    toggleMute: () => {
      update(state => {
        const newMuted = !state.isMuted

        if (state.sonificationSystem) {
          state.sonificationSystem.setVolume(newMuted ? 0 : state.volume)
        }

        return { ...state, isMuted: newMuted }
      })
    },

    // クリーンアップ
    destroy: () => {
      update(state => {
        if (state.sonificationSystem) {
          state.sonificationSystem.destroy()
        }
        return {
          ...state,
          sonificationSystem: null,
          isEnabled: false
        }
      })
    }
  }
}

export const audioStore = createAudioStore()

// Derived stores
export const isAudioEnabled = derived(
  audioStore,
  $audio => $audio.isEnabled
)

export const audioVolume = derived(
  audioStore,
  $audio => $audio.volume
)
```

**チェックポイント**:
- [ ] audioStore作成
- [ ] SonificationSystemとの統合
- [ ] toggleEnabled, setVolume メソッド実装
- [ ] derived stores作成
- [ ] TypeScript型エラーなし

---

## Phase 6.2: UIコンポーネント実装（6ステップ）

### Step 6.2.1: ZoomLevelIndicatorコンポーネント

**見積もり**: 40分

**ファイル**: `src/lib/components/ZoomLevelIndicator.svelte`

**実装内容**:
```svelte
<script lang="ts">
  import { currentZoomLevel } from '$lib/stores/viewportStore'
  import { getZoomLevelMetadata } from '$lib/features/zoom/constants'
  import { getChunkSize } from '$lib/types/zoom'

  $: metadata = getZoomLevelMetadata($currentZoomLevel)
  $: chunkSize = getChunkSize($currentZoomLevel)
</script>

<div class="zoom-level-indicator">
  <div class="level-badge" style="background-color: {metadata.color};">
    <span class="level-value">{$currentZoomLevel}</span>
  </div>

  <div class="level-info">
    <div class="level-name">{metadata.name}</div>
    <div class="level-description">{metadata.description}</div>
    <div class="chunk-info">
      <span class="label">チャンクサイズ:</span>
      <span class="value">{chunkSize}×{chunkSize}</span>
    </div>
  </div>
</div>

<style>
  .zoom-level-indicator {
    position: absolute;
    top: 1rem;
    left: 1rem;
    display: flex;
    align-items: center;
    gap: 0.75rem;
    background: rgba(0, 0, 0, 0.7);
    backdrop-filter: blur(10px);
    border-radius: 0.5rem;
    padding: 0.75rem 1rem;
    color: white;
    font-family: monospace;
    z-index: 100;
  }

  .level-badge {
    width: 3rem;
    height: 3rem;
    border-radius: 0.25rem;
    display: flex;
    align-items: center;
    justify-content: center;
    font-weight: bold;
    font-size: 1.25rem;
  }

  .level-info {
    display: flex;
    flex-direction: column;
    gap: 0.25rem;
  }

  .level-name {
    font-size: 0.875rem;
    font-weight: bold;
    text-transform: uppercase;
    letter-spacing: 0.05em;
  }

  .level-description {
    font-size: 0.75rem;
    opacity: 0.8;
  }

  .chunk-info {
    font-size: 0.7rem;
    opacity: 0.6;
    margin-top: 0.125rem;
  }

  .chunk-info .label {
    margin-right: 0.25rem;
  }

  @media (max-width: 640px) {
    .zoom-level-indicator {
      top: 0.5rem;
      left: 0.5rem;
      padding: 0.5rem 0.75rem;
      gap: 0.5rem;
    }

    .level-badge {
      width: 2.5rem;
      height: 2.5rem;
      font-size: 1rem;
    }

    .level-name {
      font-size: 0.75rem;
    }

    .level-description {
      font-size: 0.65rem;
    }
  }
</style>
```

**チェックポイント**:
- [ ] ZoomLevelIndicatorコンポーネント作成
- [ ] レベル名、説明、チャンクサイズ表示
- [ ] レベル別の色表示
- [ ] レスポンシブ対応

---

### Step 6.2.2: TimeScaleIndicatorコンポーネント

**見積もり**: 30分

**ファイル**: `src/lib/components/TimeScaleIndicator.svelte`

**実装内容**:
```svelte
<script lang="ts">
  import { currentZoomLevel } from '$lib/stores/viewportStore'
  import { stepCount, isPlaying } from '$lib/stores/hierarchicalGridStore'
  import { getTimeScale } from '$lib/features/zoom/timeScale'

  $: timeScale = getTimeScale($currentZoomLevel)
  $: timeScaleLabel = formatTimeScale(timeScale)

  function formatTimeScale(scale: number): string {
    if (scale >= 1000000) {
      return `${(scale / 1000000).toFixed(1)}M 世代/フレーム`
    } else if (scale >= 1000) {
      return `${(scale / 1000).toFixed(1)}K 世代/フレーム`
    } else if (scale >= 1) {
      return `${scale} 世代/フレーム`
    } else {
      return `${(1 / scale).toFixed(0)} フレーム/世代`
    }
  }
</script>

<div class="time-scale-indicator">
  <div class="status-icon" class:playing={$isPlaying}>
    {#if $isPlaying}
      <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
        <rect x="3" y="2" width="4" height="12" />
        <rect x="9" y="2" width="4" height="12" />
      </svg>
    {:else}
      <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
        <path d="M3 2 L3 14 L13 8 Z" />
      </svg>
    {/if}
  </div>

  <div class="time-info">
    <div class="step-count">ステップ: {$stepCount.toLocaleString()}</div>
    <div class="time-scale">{timeScaleLabel}</div>
  </div>
</div>

<style>
  .time-scale-indicator {
    position: absolute;
    top: 5.5rem;
    left: 1rem;
    display: flex;
    align-items: center;
    gap: 0.75rem;
    background: rgba(0, 0, 0, 0.7);
    backdrop-filter: blur(10px);
    border-radius: 0.5rem;
    padding: 0.75rem 1rem;
    color: white;
    font-family: monospace;
    z-index: 100;
  }

  .status-icon {
    color: rgba(255, 255, 255, 0.5);
  }

  .status-icon.playing {
    color: #4ade80;
  }

  .time-info {
    display: flex;
    flex-direction: column;
    gap: 0.25rem;
  }

  .step-count {
    font-size: 0.875rem;
    font-weight: bold;
  }

  .time-scale {
    font-size: 0.7rem;
    opacity: 0.7;
  }

  @media (max-width: 640px) {
    .time-scale-indicator {
      top: 4rem;
      left: 0.5rem;
      padding: 0.5rem 0.75rem;
      gap: 0.5rem;
    }

    .step-count {
      font-size: 0.75rem;
    }
  }
</style>
```

**チェックポイント**:
- [ ] TimeScaleIndicatorコンポーネント作成
- [ ] ステップ数表示
- [ ] 時間スケール表示（フォーマット済み）
- [ ] 再生/停止アイコン表示

---

### Step 6.2.3: ColorSpectrumBarコンポーネント

**見積もり**: 35分

**ファイル**: `src/lib/components/ColorSpectrumBar.svelte`

**実装内容**:
```svelte
<script lang="ts">
  import { currentZoomLevel } from '$lib/stores/viewportStore'
  import { ZoomLevel, ALL_ZOOM_LEVELS } from '$lib/types/zoom'
  import { getZoomLevelMetadata } from '$lib/features/zoom/constants'

  $: allLevels = ALL_ZOOM_LEVELS
  $: currentIndex = allLevels.indexOf($currentZoomLevel)
</script>

<div class="color-spectrum-bar">
  <div class="spectrum-label">スペクトラム</div>

  <div class="spectrum-gradient">
    {#each allLevels as level, index}
      {@const metadata = getZoomLevelMetadata(level)}
      <div
        class="spectrum-segment"
        class:active={index === currentIndex}
        style="background-color: {metadata.color};"
        title="{metadata.name} ({level})"
      >
        {#if index === currentIndex}
          <div class="active-marker"></div>
        {/if}
      </div>
    {/each}
  </div>

  <div class="wavelength-labels">
    <span class="label-start">380nm</span>
    <span class="label-end">780nm</span>
  </div>
</div>

<style>
  .color-spectrum-bar {
    position: absolute;
    top: 1rem;
    right: 1rem;
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
    background: rgba(0, 0, 0, 0.7);
    backdrop-filter: blur(10px);
    border-radius: 0.5rem;
    padding: 0.75rem 1rem;
    color: white;
    font-family: monospace;
    z-index: 100;
  }

  .spectrum-label {
    font-size: 0.7rem;
    opacity: 0.7;
    text-align: center;
  }

  .spectrum-gradient {
    display: flex;
    gap: 2px;
    height: 2rem;
    border-radius: 0.25rem;
    overflow: hidden;
  }

  .spectrum-segment {
    flex: 1;
    position: relative;
    transition: transform 0.2s ease;
  }

  .spectrum-segment.active {
    transform: scaleY(1.2);
    box-shadow: 0 0 10px rgba(255, 255, 255, 0.5);
  }

  .active-marker {
    position: absolute;
    bottom: -0.5rem;
    left: 50%;
    transform: translateX(-50%);
    width: 0;
    height: 0;
    border-left: 0.25rem solid transparent;
    border-right: 0.25rem solid transparent;
    border-top: 0.5rem solid white;
  }

  .wavelength-labels {
    display: flex;
    justify-content: space-between;
    font-size: 0.65rem;
    opacity: 0.6;
  }

  @media (max-width: 640px) {
    .color-spectrum-bar {
      top: 0.5rem;
      right: 0.5rem;
      padding: 0.5rem 0.75rem;
    }

    .spectrum-gradient {
      height: 1.5rem;
    }
  }
</style>
```

**チェックポイント**:
- [ ] ColorSpectrumBarコンポーネント作成
- [ ] 14レベルのスペクトラム表示
- [ ] 現在レベルのハイライト
- [ ] 波長ラベル表示（380nm-780nm）

---

### Step 6.2.4: ZoomControlsコンポーネント

**見積もり**: 45分

**ファイル**: `src/lib/components/ZoomControls.svelte`

**実装内容**:
```svelte
<script lang="ts">
  import { viewportStore } from '$lib/stores/viewportStore'
  import { hierarchicalGridStore } from '$lib/stores/hierarchicalGridStore'
  import { ZoomLevel, ALL_ZOOM_LEVELS } from '$lib/types/zoom'

  let currentLevel: ZoomLevel
  viewportStore.subscribe(state => {
    currentLevel = state.zoomLevel
  })

  const zoomIn = () => {
    const currentIndex = ALL_ZOOM_LEVELS.indexOf(currentLevel)
    if (currentIndex < ALL_ZOOM_LEVELS.length - 1) {
      const newLevel = ALL_ZOOM_LEVELS[currentIndex + 1]
      hierarchicalGridStore.setZoomLevel(newLevel)
    }
  }

  const zoomOut = () => {
    const currentIndex = ALL_ZOOM_LEVELS.indexOf(currentLevel)
    if (currentIndex > 0) {
      const newLevel = ALL_ZOOM_LEVELS[currentIndex - 1]
      hierarchicalGridStore.setZoomLevel(newLevel)
    }
  }

  const canZoomIn = () => {
    const currentIndex = ALL_ZOOM_LEVELS.indexOf(currentLevel)
    return currentIndex < ALL_ZOOM_LEVELS.length - 1
  }

  const canZoomOut = () => {
    const currentIndex = ALL_ZOOM_LEVELS.indexOf(currentLevel)
    return currentIndex > 0
  }

  const handlePlayToggle = () => {
    hierarchicalGridStore.togglePlay()
  }

  const handleReset = () => {
    hierarchicalGridStore.reset()
    viewportStore.reset()
  }

  let isPlaying = false
  hierarchicalGridStore.subscribe(state => {
    isPlaying = state.isPlaying
  })
</script>

<div class="zoom-controls">
  <button
    class="control-btn zoom-out"
    on:click={zoomOut}
    disabled={!canZoomOut()}
    title="ズームアウト"
  >
    <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor">
      <path d="M10 4 L10 16 M4 10 L16 10" stroke="currentColor" stroke-width="2" fill="none"/>
      <circle cx="10" cy="10" r="8" stroke="currentColor" stroke-width="1.5" fill="none"/>
    </svg>
    <span class="label">-</span>
  </button>

  <button
    class="control-btn play-pause"
    on:click={handlePlayToggle}
    title={isPlaying ? '停止' : '再生'}
  >
    {#if isPlaying}
      <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor">
        <rect x="5" y="4" width="4" height="12" />
        <rect x="11" y="4" width="4" height="12" />
      </svg>
    {:else}
      <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor">
        <path d="M6 4 L6 16 L16 10 Z" />
      </svg>
    {/if}
  </button>

  <button
    class="control-btn zoom-in"
    on:click={zoomIn}
    disabled={!canZoomIn()}
    title="ズームイン"
  >
    <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor">
      <path d="M10 4 L10 16" stroke="currentColor" stroke-width="2" fill="none"/>
      <circle cx="10" cy="10" r="8" stroke="currentColor" stroke-width="1.5" fill="none"/>
    </svg>
    <span class="label">+</span>
  </button>

  <div class="divider"></div>

  <button
    class="control-btn reset"
    on:click={handleReset}
    title="リセット"
  >
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor">
      <path d="M4 10 A6 6 0 1 1 10 4" stroke-width="2"/>
      <path d="M4 4 L4 10 L10 10" stroke-width="2"/>
    </svg>
  </button>
</div>

<style>
  .zoom-controls {
    position: absolute;
    bottom: 2rem;
    left: 50%;
    transform: translateX(-50%);
    display: flex;
    align-items: center;
    gap: 0.5rem;
    background: rgba(0, 0, 0, 0.8);
    backdrop-filter: blur(10px);
    border-radius: 2rem;
    padding: 0.75rem 1.25rem;
    z-index: 100;
  }

  .control-btn {
    width: 2.5rem;
    height: 2.5rem;
    border-radius: 50%;
    border: none;
    background: rgba(255, 255, 255, 0.1);
    color: white;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    position: relative;
    transition: all 0.2s ease;
  }

  .control-btn:hover:not(:disabled) {
    background: rgba(255, 255, 255, 0.2);
    transform: scale(1.1);
  }

  .control-btn:active:not(:disabled) {
    transform: scale(0.95);
  }

  .control-btn:disabled {
    opacity: 0.3;
    cursor: not-allowed;
  }

  .control-btn .label {
    position: absolute;
    font-size: 1.25rem;
    font-weight: bold;
    pointer-events: none;
  }

  .play-pause {
    width: 3rem;
    height: 3rem;
    background: rgba(74, 222, 128, 0.2);
  }

  .play-pause:hover:not(:disabled) {
    background: rgba(74, 222, 128, 0.3);
  }

  .divider {
    width: 1px;
    height: 2rem;
    background: rgba(255, 255, 255, 0.2);
    margin: 0 0.25rem;
  }

  @media (max-width: 640px) {
    .zoom-controls {
      bottom: 1rem;
      padding: 0.5rem 1rem;
      gap: 0.375rem;
    }

    .control-btn {
      width: 2rem;
      height: 2rem;
    }

    .play-pause {
      width: 2.5rem;
      height: 2.5rem;
    }
  }
</style>
```

**チェックポイント**:
- [ ] ZoomControlsコンポーネント作成
- [ ] ズームイン/アウトボタン実装
- [ ] 再生/停止ボタン実装
- [ ] リセットボタン実装
- [ ] ボタンの有効/無効制御

---

### Step 6.2.5: AudioToggleコンポーネント（Phase 5実装時のみ）

**見積もり**: 25分

**条件**: Phase 5（SonificationSystem）を実装した場合のみ

**ファイル**: `src/lib/components/AudioToggle.svelte`

**実装内容**:
```svelte
<script lang="ts">
  import { audioStore, isAudioEnabled, audioVolume } from '$lib/stores/audioStore'

  const toggleAudio = () => {
    audioStore.toggleEnabled()
  }

  const toggleMute = () => {
    audioStore.toggleMute()
  }

  let showVolumeSlider = false
  let volume = 0.5

  audioVolume.subscribe(v => {
    volume = v
  })

  const handleVolumeChange = (event: Event) => {
    const target = event.target as HTMLInputElement
    audioStore.setVolume(parseFloat(target.value))
  }
</script>

<div class="audio-toggle">
  <button
    class="toggle-btn"
    class:enabled={$isAudioEnabled}
    on:click={toggleAudio}
    title={$isAudioEnabled ? 'サウンドOFF' : 'サウンドON'}
  >
    {#if $isAudioEnabled}
      <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor">
        <path d="M8 5 L4 8 L1 8 L1 12 L4 12 L8 15 Z"/>
        <path d="M11 7 Q14 10 11 13" stroke="currentColor" stroke-width="1.5" fill="none"/>
        <path d="M13 5 Q17 10 13 15" stroke="currentColor" stroke-width="1.5" fill="none"/>
      </svg>
    {:else}
      <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor">
        <path d="M8 5 L4 8 L1 8 L1 12 L4 12 L8 15 Z"/>
        <line x1="12" y1="6" x2="18" y2="14" stroke="currentColor" stroke-width="2"/>
        <line x1="18" y1="6" x2="12" y2="14" stroke="currentColor" stroke-width="2"/>
      </svg>
    {/if}
  </button>

  {#if $isAudioEnabled}
    <div class="volume-control">
      <input
        type="range"
        min="0"
        max="1"
        step="0.01"
        value={volume}
        on:input={handleVolumeChange}
        class="volume-slider"
      />
      <span class="volume-value">{Math.round(volume * 100)}%</span>
    </div>
  {/if}
</div>

<style>
  .audio-toggle {
    position: absolute;
    bottom: 2rem;
    right: 2rem;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 0.5rem;
    z-index: 100;
  }

  .toggle-btn {
    width: 3rem;
    height: 3rem;
    border-radius: 50%;
    border: none;
    background: rgba(255, 255, 255, 0.1);
    color: white;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: all 0.2s ease;
  }

  .toggle-btn:hover {
    background: rgba(255, 255, 255, 0.2);
    transform: scale(1.1);
  }

  .toggle-btn.enabled {
    background: rgba(147, 51, 234, 0.3);
  }

  .toggle-btn.enabled:hover {
    background: rgba(147, 51, 234, 0.4);
  }

  .volume-control {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 0.25rem;
    background: rgba(0, 0, 0, 0.8);
    backdrop-filter: blur(10px);
    border-radius: 0.5rem;
    padding: 0.75rem 0.5rem;
  }

  .volume-slider {
    writing-mode: bt-lr;
    -webkit-appearance: slider-vertical;
    width: 0.5rem;
    height: 5rem;
  }

  .volume-value {
    font-size: 0.7rem;
    color: white;
    font-family: monospace;
  }

  @media (max-width: 640px) {
    .audio-toggle {
      bottom: 1rem;
      right: 1rem;
    }

    .toggle-btn {
      width: 2.5rem;
      height: 2.5rem;
    }
  }
</style>
```

**チェックポイント**:
- [ ] AudioToggleコンポーネント作成
- [ ] サウンドON/OFF切り替え
- [ ] ボリュームスライダー表示
- [ ] audioStoreとの連携

---

### Step 6.2.6: ControlPanel統合

**見積もり**: 20分

**ファイル**: `src/lib/components/ControlPanel.svelte`（更新）

**実装内容**:

既存の `ControlPanel.svelte` を階層的ズームシステムに対応させます。

```svelte
<script lang="ts">
  import { hierarchicalGridStore } from '$lib/stores/hierarchicalGridStore'

  export let onPlayPause: () => void = () => {}
  export let onReset: () => void = () => {}
  export let onRandomize: () => void = () => {}

  let isPlaying = false

  hierarchicalGridStore.subscribe(state => {
    isPlaying = state.isPlaying
  })

  const handlePlayPause = () => {
    hierarchicalGridStore.togglePlay()
    onPlayPause()
  }

  const handleReset = () => {
    hierarchicalGridStore.reset()
    onReset()
  }
</script>

<div class="control-panel">
  <button class="control-button" on:click={handlePlayPause}>
    {isPlaying ? '停止' : '再生'}
  </button>

  <button class="control-button" on:click={handleReset}>
    リセット
  </button>

  <button class="control-button" on:click={onRandomize}>
    ランダム化
  </button>
</div>

<style>
  .control-panel {
    display: flex;
    gap: 0.5rem;
    padding: 1rem;
  }

  .control-button {
    padding: 0.5rem 1rem;
    border: 1px solid rgba(255, 255, 255, 0.2);
    background: rgba(0, 0, 0, 0.5);
    color: white;
    border-radius: 0.25rem;
    cursor: pointer;
    font-family: inherit;
    transition: all 0.2s ease;
  }

  .control-button:hover {
    background: rgba(255, 255, 255, 0.1);
  }

  .control-button:active {
    transform: scale(0.95);
  }
</style>
```

**チェックポイント**:
- [ ] ControlPanelの更新
- [ ] hierarchicalGridStoreとの統合
- [ ] 既存の操作を保持

---

## Phase 6.3: 既存コンポーネントの統合（2ステップ）

### Step 6.3.1: LifeCanvas更新

**見積もり**: 1時間

**ファイル**: `src/lib/components/LifeCanvas.svelte`（大幅更新）

**実装内容**:

既存の `LifeCanvas.svelte` を階層的ズームシステムに対応させます。

```svelte
<script lang="ts">
  import { onMount, onDestroy } from 'svelte'
  import * as PIXI from 'pixi.js'
  import { viewportStore } from '$lib/stores/viewportStore'
  import { hierarchicalGridStore, currentGrid } from '$lib/stores/hierarchicalGridStore'
  import { HierarchicalLifeRenderer } from '$lib/pixi/HierarchicalLifeRenderer'
  import { CameraController } from '$lib/features/zoom/CameraController'
  import { InputHandler } from '$lib/features/zoom/InputHandler'
  import { SonificationSystem } from '$lib/features/audio/SonificationSystem'
  import { audioStore } from '$lib/stores/audioStore'

  let canvasElement: HTMLCanvasElement
  let app: PIXI.Application | null = null
  let renderer: HierarchicalLifeRenderer | null = null
  let cameraController: CameraController | null = null
  let inputHandler: InputHandler | null = null
  let animationFrameId: number | null = null

  onMount(async () => {
    // PixiJSアプリケーション初期化
    app = new PIXI.Application()
    await app.init({
      canvas: canvasElement,
      width: window.innerWidth,
      height: window.innerHeight,
      backgroundColor: 0x000000,
      antialias: true
    })

    // Store初期化
    hierarchicalGridStore.initialize()

    // Phase 5実装時のみ
    if (typeof SonificationSystem !== 'undefined') {
      await audioStore.initialize()
    }

    // レンダラー初期化
    const multiResGrid = $hierarchicalGridStore.multiResolutionGrid
    if (multiResGrid) {
      renderer = new HierarchicalLifeRenderer(app, multiResGrid)
    }

    // カメラコントローラー初期化
    cameraController = new CameraController(
      0, 0, // 初期位置
      $viewportStore.zoomLevel,
      window.innerWidth,
      window.innerHeight
    )

    // 入力ハンドラー初期化
    inputHandler = new InputHandler(
      canvasElement,
      cameraController,
      (newLevel) => {
        hierarchicalGridStore.setZoomLevel(newLevel)
      }
    )

    // レンダリングループ開始
    startRenderLoop()

    // ウィンドウリサイズ対応
    window.addEventListener('resize', handleResize)
  })

  onDestroy(() => {
    if (animationFrameId !== null) {
      cancelAnimationFrame(animationFrameId)
    }

    if (inputHandler) {
      inputHandler.destroy()
    }

    if (renderer) {
      renderer.destroy()
    }

    if (app) {
      app.destroy(true, { children: true, texture: true })
    }

    window.removeEventListener('resize', handleResize)
  })

  function startRenderLoop() {
    const loop = () => {
      if ($hierarchicalGridStore.isPlaying) {
        hierarchicalGridStore.step()
      }

      if (renderer && cameraController) {
        const viewport = cameraController.getViewport()
        renderer.render($currentGrid, viewport, $viewportStore.zoomLevel)

        // Phase 5実装時のみ
        if ($audioStore.isEnabled && $audioStore.sonificationSystem) {
          const soundParams = $audioStore.sonificationSystem.calculateSoundParameters(
            $currentGrid,
            viewport
          )
          $audioStore.sonificationSystem.updateSound(soundParams)
        }
      }

      animationFrameId = requestAnimationFrame(loop)
    }

    animationFrameId = requestAnimationFrame(loop)
  }

  function handleResize() {
    if (app && cameraController) {
      app.renderer.resize(window.innerWidth, window.innerHeight)
      cameraController.updateScreenSize(window.innerWidth, window.innerHeight)
    }
  }

  // viewportStoreの変更を監視
  $: if (cameraController && $viewportStore) {
    cameraController.setCenter($viewportStore.centerX, $viewportStore.centerY)
    cameraController.setZoomLevel($viewportStore.zoomLevel)
  }
</script>

<canvas bind:this={canvasElement} class="life-canvas"></canvas>

<style>
  .life-canvas {
    width: 100%;
    height: 100%;
    display: block;
  }
</style>
```

**ポイント**:
- HierarchicalLifeRenderer統合
- CameraController統合
- InputHandler統合
- SonificationSystem統合（Phase 5実装時）
- Store連携

**チェックポイント**:
- [ ] LifeCanvas更新
- [ ] すべてのシステムが統合されている
- [ ] レンダリングループが正しく動作
- [ ] Store変更が反映される

---

### Step 6.3.2: App.svelte統合

**見積もり**: 30分

**ファイル**: `src/App.svelte`（更新）

**実装内容**:

```svelte
<script lang="ts">
  import LifeCanvas from '$lib/components/LifeCanvas.svelte'
  import ZoomLevelIndicator from '$lib/components/ZoomLevelIndicator.svelte'
  import TimeScaleIndicator from '$lib/components/TimeScaleIndicator.svelte'
  import ColorSpectrumBar from '$lib/components/ColorSpectrumBar.svelte'
  import ZoomControls from '$lib/components/ZoomControls.svelte'
  import AudioToggle from '$lib/components/AudioToggle.svelte'
</script>

<main>
  <LifeCanvas />

  <ZoomLevelIndicator />
  <TimeScaleIndicator />
  <ColorSpectrumBar />
  <ZoomControls />

  <!-- Phase 5実装時のみ -->
  {#if typeof AudioToggle !== 'undefined'}
    <AudioToggle />
  {/if}
</main>

<style>
  :global(body) {
    margin: 0;
    padding: 0;
    overflow: hidden;
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
  }

  main {
    width: 100vw;
    height: 100vh;
    position: relative;
    background: #000;
  }
</style>
```

**チェックポイント**:
- [ ] App.svelte更新
- [ ] すべてのUIコンポーネントが配置されている
- [ ] レイアウトが正しい
- [ ] レスポンシブ対応

---

## Phase 6完了: UI統合テスト

### Phase 6完了: UI統合テスト

**見積もり**: 45分

**テスト項目**:

#### 1. Store連携テスト

```bash
npm run dev
```

ブラウザで以下を確認:

- [ ] ズームレベル変更時、すべてのUIが同期更新される
- [ ] 再生/停止時、TimeScaleIndicatorのアイコンが変わる
- [ ] ステップ数が正しくカウントアップされる
- [ ] リセット時、すべての状態が初期化される

#### 2. UIコンポーネント個別テスト

- [ ] ZoomLevelIndicator: レベル名、色、チャンクサイズが正しく表示される
- [ ] TimeScaleIndicator: ステップ数、時間スケールが正しく表示される
- [ ] ColorSpectrumBar: 14段階のグラデーション、現在レベルのハイライトが表示される
- [ ] ZoomControls: すべてのボタンが正しく動作する
- [ ] AudioToggle（Phase 5実装時）: サウンドON/OFF、ボリューム調整が動作する

#### 3. レスポンシブテスト

ブラウザのデベロッパーツールでデバイスエミュレーション:

- [ ] モバイル（375px × 667px）: すべてのUIがコンパクトに表示される
- [ ] タブレット（768px × 1024px）: 中間サイズで表示される
- [ ] デスクトップ（1920px × 1080px）: フルサイズで表示される

#### 4. インタラクションテスト

- [ ] マウスでパン操作できる
- [ ] マウスホイールでズーム操作できる
- [ ] タッチでパン/ピンチズームできる（モバイルデバイス）
- [ ] キーボード操作できる（+/-キー、スペースキー等）

#### 5. パフォーマンステスト

Chrome DevToolsのPerformanceタブで:

- [ ] 60fps前後を維持している（デスクトップ）
- [ ] UI操作時のフレームドロップが少ない
- [ ] メモリリークがない（長時間実行）

**確認完了後**:

```bash
git add .
git commit -m "feat: Phase 6 - UI+状態管理システム実装"
```

---

## 作成・更新されるファイル一覧

```
src/lib/
  stores/
    viewportStore.ts                             # Step 6.1.1（新規）
    hierarchicalGridStore.ts                     # Step 6.1.2（新規）
    audioStore.ts                                # Step 6.1.3（新規、Phase 5時のみ）
  components/
    ZoomLevelIndicator.svelte                    # Step 6.2.1（新規）
    TimeScaleIndicator.svelte                    # Step 6.2.2（新規）
    ColorSpectrumBar.svelte                      # Step 6.2.3（新規）
    ZoomControls.svelte                          # Step 6.2.4（新規）
    AudioToggle.svelte                           # Step 6.2.5（新規、Phase 5時のみ）
    ControlPanel.svelte                          # Step 6.2.6（更新）
    LifeCanvas.svelte                            # Step 6.3.1（大幅更新）
  App.svelte                                     # Step 6.3.2（更新）
```

---

## 重要な設計判断

### 1. Store設計の責務分離

**viewportStore**: ビューポート状態のみ管理
- 位置（centerX, centerY）
- ズームレベル
- 表示セルサイズ

**hierarchicalGridStore**: グリッド・シミュレーション状態管理
- MultiResolutionGridインスタンス
- QuantumLifeEngineインスタンス
- 再生/停止状態
- ステップ数

**audioStore**: 音響システム管理（Phase 5時のみ）
- SonificationSystemインスタンス
- 有効/無効状態
- 音量設定

### 2. UIレイアウト戦略

- **絶対配置**: すべてのUIコンポーネントは `position: absolute` で配置
- **z-index管理**: すべてのUIは `z-index: 100` で統一
- **レスポンシブ**: メディアクエリで画面サイズに応じて調整

### 3. コンポーネント間通信

- **Store購読**: すべてのコンポーネントはStoreを購読
- **イベント発火なし**: コンポーネント間の直接通信は避ける
- **Store経由**: すべての状態変更はStore経由

---

## テスト戦略

### ユニットテスト

各Storeのテストを作成:

```typescript
// src/lib/stores/__tests__/viewportStore.test.ts
import { describe, it, expect } from 'vitest'
import { get } from 'svelte/store'
import { viewportStore } from '../viewportStore'
import { ZoomLevel } from '$lib/types/zoom'

describe('viewportStore', () => {
  it('should initialize with default values', () => {
    const state = get(viewportStore)
    expect(state.centerX).toBe(0)
    expect(state.centerY).toBe(0)
    expect(state.zoomLevel).toBe(ZoomLevel.CITY)
  })

  it('should update center position', () => {
    viewportStore.setCenter(100, 200)
    const state = get(viewportStore)
    expect(state.centerX).toBe(100)
    expect(state.centerY).toBe(200)
  })

  // ... 他のテスト
})
```

### 統合テスト

ブラウザでの手動テスト:
- すべてのUIコンポーネントの動作確認
- Store連携の確認
- レスポンシブ対応の確認

---

## 課題・メモ

<!-- 実装中に出てきた課題や気づきをここに記録 -->

---

## 次のステップ

Phase 6完了後、Phase 7（最適化+テスト）に進みます。

[Phase 7の詳細を見る](../phase-7/README.md)

---

最終更新: 2025-11-09

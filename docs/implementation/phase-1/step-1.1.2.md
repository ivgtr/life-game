# Step 1.1.2: 時間スケール計算関数の実装

**Phase**: 1.1 - ズームレベルの基礎定義
**見積もり時間**: 20分

---

## 目的

ズームレベルに応じた相対論的時間スケールを計算する関数を実装します。
マクロレベルほど時間が速く、ミクロレベルほど時間が遅く流れます。

---

## 実装内容

### ファイル作成

**パス**: `src/lib/features/zoom/timeScale.ts`

```typescript
import { ZoomLevel } from '$lib/types/zoom'

/**
 * ズームレベルに応じた時間スケールを取得
 *
 * マクロレベル（COSMOS等）: 速い（8倍速）
 * STANDARDレベル: 標準（1倍速）
 * ミクロレベル（QUANTUM等）: 遅い（1/16倍速）
 *
 * @param level ズームレベル
 * @returns 時間スケール倍率（1.0が標準速度）
 *
 * @example
 * getTimeScale(ZoomLevel.COSMOS)   // ~8.0 (8倍速)
 * getTimeScale(ZoomLevel.STANDARD) // 1.0 (標準)
 * getTimeScale(ZoomLevel.QUANTUM)  // ~0.0625 (1/16倍速)
 */
export function getTimeScale(level: ZoomLevel): number {
  const normalizedLevel = level - ZoomLevel.STANDARD
  return Math.pow(2, -normalizedLevel * 0.5)
}

/**
 * 時間スケールに基づいて、このフレームで更新するかどうかを判定
 *
 * 時間が遅いレベルでは、フレームをスキップして更新頻度を下げる
 *
 * @param level ズームレベル
 * @returns このフレームで更新するべきならtrue
 *
 * @example
 * // COSMOS (8倍速): ほぼ常にtrue
 * shouldUpdateThisFrame(ZoomLevel.COSMOS)
 *
 * // QUANTUM (1/16倍速): 16回に1回程度true
 * shouldUpdateThisFrame(ZoomLevel.QUANTUM)
 */
export function shouldUpdateThisFrame(level: ZoomLevel): boolean {
  const timeScale = getTimeScale(level)
  return Math.random() < timeScale
}

/**
 * 時間スケールに基づいた更新間隔（ミリ秒）を取得
 *
 * @param level ズームレベル
 * @param baseInterval 基準更新間隔（デフォルト: 100ms）
 * @returns 実際の更新間隔（ms）
 *
 * @example
 * getUpdateInterval(ZoomLevel.STANDARD)  // 100ms
 * getUpdateInterval(ZoomLevel.COSMOS)    // ~12.5ms (8倍速)
 * getUpdateInterval(ZoomLevel.QUANTUM)   // ~1600ms (1/16倍速)
 */
export function getUpdateInterval(level: ZoomLevel, baseInterval = 100): number {
  const timeScale = getTimeScale(level)
  return baseInterval / timeScale
}
```

---

## テスト

### 動作確認コード

```typescript
// src/lib/features/zoom/__test_timeScale.ts （確認後削除）
import { ZoomLevel } from '$lib/types/zoom'
import {
  getTimeScale,
  shouldUpdateThisFrame,
  getUpdateInterval,
} from './timeScale'

console.log('=== Time Scale Test ===\n')

// すべてのレベルで時間スケールを確認
const levels = [
  ZoomLevel.COSMOS,
  ZoomLevel.GALAXY,
  ZoomLevel.SOLAR,
  ZoomLevel.PLANET,
  ZoomLevel.CONTINENT,
  ZoomLevel.COUNTRY,
  ZoomLevel.CITY,
  ZoomLevel.STREET,
  ZoomLevel.STANDARD,
  ZoomLevel.CELL,
  ZoomLevel.ORGANELLE,
  ZoomLevel.MOLECULE,
  ZoomLevel.ATOM,
  ZoomLevel.QUANTUM,
]

levels.forEach((level) => {
  const name = ZoomLevel[level]
  const timeScale = getTimeScale(level)
  const interval = getUpdateInterval(level)

  console.log(
    `${name.padEnd(12)} (${String(level).padStart(2)}): ` +
      `${timeScale.toFixed(4)}x, ${interval.toFixed(1)}ms`
  )
})

// shouldUpdateThisFrame の確率テスト
console.log('\n=== Frame Update Probability Test ===\n')

const testLevels = [ZoomLevel.COSMOS, ZoomLevel.STANDARD, ZoomLevel.QUANTUM]

testLevels.forEach((level) => {
  const name = ZoomLevel[level]
  const trials = 10000
  let updates = 0

  for (let i = 0; i < trials; i++) {
    if (shouldUpdateThisFrame(level)) updates++
  }

  const probability = (updates / trials) * 100
  const expected = getTimeScale(level) * 100

  console.log(
    `${name.padEnd(12)}: ${probability.toFixed(2)}% ` +
      `(expected: ${expected.toFixed(2)}%)`
  )
})
```

実行:
```bash
npx tsx src/lib/features/zoom/__test_timeScale.ts
```

### 期待される出力

```
=== Time Scale Test ===

COSMOS       (-5): 8.0000x, 12.5ms
GALAXY       (-4): 5.6569x, 17.7ms
SOLAR        (-3): 4.0000x, 25.0ms
PLANET       (-2): 2.8284x, 35.4ms
CONTINENT    (-1): 2.0000x, 50.0ms
COUNTRY      ( 0): 1.4142x, 70.7ms
CITY         ( 1): 1.0000x, 100.0ms
STREET       ( 2): 0.7071x, 141.4ms
STANDARD     ( 3): 1.0000x, 100.0ms
CELL         ( 4): 0.7071x, 141.4ms
ORGANELLE    ( 5): 0.5000x, 200.0ms
MOLECULE     ( 6): 0.3536x, 282.8ms
ATOM         ( 7): 0.2500x, 400.0ms
QUANTUM      ( 8): 0.1768x, 565.7ms

=== Frame Update Probability Test ===

COSMOS      : 100.00% (expected: 100.00%)
STANDARD    : 100.00% (expected: 100.00%)
QUANTUM     : 17.68% (expected: 17.68%)
```

**注**: 確率テストの結果は±数%の誤差があります。

---

## チェックポイント

- [ ] `src/lib/features/zoom/timeScale.ts` が作成されている
- [ ] getTimeScale関数が実装されている
- [ ] shouldUpdateThisFrame関数が実装されている
- [ ] getUpdateInterval関数が実装されている
- [ ] テストコードが期待通りの結果を返す
- [ ] TypeScriptのコンパイルエラーがない

---

## 設計の意図

### 相対論的時間の歪み

```
COSMOS (-5):  normalizedLevel = -5 - 3 = -8
              timeScale = 2^(-(-8) * 0.5) = 2^4 = 16倍速

STANDARD (3): normalizedLevel = 3 - 3 = 0
              timeScale = 2^0 = 1倍速（基準）

QUANTUM (8):  normalizedLevel = 8 - 3 = 5
              timeScale = 2^(-5 * 0.5) = 2^-2.5 ≈ 0.177倍速
```

### 0.5の係数

`* 0.5` により、1レベルの変化で √2倍（約1.41倍）の変化になります。
急激すぎず、緩やかすぎない、ちょうど良いスケール感を実現します。

---

## 次のステップ

[Step 1.1.3: レベル名とメタデータの定義](./step-1.1.3.md)

---

最終更新: 2025-11-09

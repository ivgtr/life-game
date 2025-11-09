# Step 1.1.3: レベル名とメタデータの定義

**Phase**: 1.1 - ズームレベルの基礎定義
**見積もり時間**: 30分

---

## 目的

各ズームレベルの名前、説明、基準色を含むメタデータを定義します。

---

## 実装内容

### ファイル作成

**パス**: `src/lib/features/zoom/constants.ts`

```typescript
import { ZoomLevel } from '$lib/types/zoom'

/**
 * ズームレベルのメタデータ
 */
export interface ZoomLevelMetadata {
  /** レベル名（表示用） */
  name: string
  /** レベルの説明 */
  description: string
  /** 基準色（Hex形式） */
  color: number
  /** アイコン（オプション、将来拡張用） */
  icon?: string
}

/**
 * ズームレベル別メタデータ
 *
 * 色は紫（COSMOS）から緑（STANDARD）を経て赤（QUANTUM）へのグラデーション
 */
export const ZOOM_LEVEL_METADATA: Record<ZoomLevel, ZoomLevelMetadata> = {
  [ZoomLevel.COSMOS]: {
    name: 'COSMOS',
    description: '宇宙の果てまで',
    color: 0x9d4edd, // 紫
  },
  [ZoomLevel.GALAXY]: {
    name: 'GALAXY',
    description: '銀河の渦',
    color: 0x7b2cbf, // 青紫
  },
  [ZoomLevel.SOLAR]: {
    name: 'SOLAR',
    description: '太陽系の軌道',
    color: 0x5a67d8, // 青
  },
  [ZoomLevel.PLANET]: {
    name: 'PLANET',
    description: '惑星の表面',
    color: 0x3b82f6, // シアン
  },
  [ZoomLevel.CONTINENT]: {
    name: 'CONTINENT',
    description: '大陸の形',
    color: 0x10b981, // 青緑
  },
  [ZoomLevel.COUNTRY]: {
    name: 'COUNTRY',
    description: '国の境界',
    color: 0x22c55e, // 緑
  },
  [ZoomLevel.CITY]: {
    name: 'CITY',
    description: '都市の鼓動',
    color: 0x84cc16, // 黄緑
  },
  [ZoomLevel.STREET]: {
    name: 'STREET',
    description: '街路の賑わい',
    color: 0xeab308, // 黄
  },
  [ZoomLevel.STANDARD]: {
    name: 'STANDARD',
    description: '人間のスケール',
    color: 0xf59e0b, // オレンジ
  },
  [ZoomLevel.CELL]: {
    name: 'CELL',
    description: '生命の単位',
    color: 0xf97316, // 赤オレンジ
  },
  [ZoomLevel.ORGANELLE]: {
    name: 'ORGANELLE',
    description: '細胞の内部',
    color: 0xef4444, // 赤
  },
  [ZoomLevel.MOLECULE]: {
    name: 'MOLECULE',
    description: '分子の結合',
    color: 0xec4899, // 赤紫
  },
  [ZoomLevel.ATOM]: {
    name: 'ATOM',
    description: '原子の軌道',
    color: 0xd946ef, // マゼンタ
  },
  [ZoomLevel.QUANTUM]: {
    name: 'QUANTUM',
    description: '量子の揺らぎ',
    color: 0xc026d3, // 紫ピンク
  },
}

/**
 * ズームレベルのメタデータを取得
 *
 * @param level ズームレベル
 * @returns メタデータ
 *
 * @example
 * const meta = getZoomLevelMetadata(ZoomLevel.STANDARD)
 * console.log(meta.name)  // "STANDARD"
 * console.log(meta.color) // 0xf59e0b
 */
export function getZoomLevelMetadata(level: ZoomLevel): ZoomLevelMetadata {
  return ZOOM_LEVEL_METADATA[level]
}

/**
 * すべてのズームレベルを配列で取得（順序付き）
 */
export const ALL_ZOOM_LEVELS: ZoomLevel[] = [
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
```

---

## テスト

### 動作確認コード

```typescript
// src/lib/features/zoom/__test_constants.ts （確認後削除）
import { ZoomLevel } from '$lib/types/zoom'
import {
  ZOOM_LEVEL_METADATA,
  getZoomLevelMetadata,
  ALL_ZOOM_LEVELS,
} from './constants'

console.log('=== Zoom Level Metadata Test ===\n')

ALL_ZOOM_LEVELS.forEach((level) => {
  const meta = getZoomLevelMetadata(level)
  const colorHex = '#' + meta.color.toString(16).padStart(6, '0')

  console.log(
    `${meta.name.padEnd(12)} | ${meta.description.padEnd(20)} | ${colorHex}`
  )
})

// 特定レベルの詳細確認
console.log('\n=== Detail Check ===')
const standardMeta = getZoomLevelMetadata(ZoomLevel.STANDARD)
console.log('STANDARD:', JSON.stringify(standardMeta, null, 2))
```

### 期待される出力

```
=== Zoom Level Metadata Test ===

COSMOS       | 宇宙の果てまで           | #9d4edd
GALAXY       | 銀河の渦               | #7b2cbf
SOLAR        | 太陽系の軌道            | #5a67d8
PLANET       | 惑星の表面             | #3b82f6
CONTINENT    | 大陸の形              | #10b981
COUNTRY      | 国の境界              | #22c55e
CITY         | 都市の鼓動             | #84cc16
STREET       | 街路の賑わい            | #eab308
STANDARD     | 人間のスケール          | #f59e0b
CELL         | 生命の単位             | #f97316
ORGANELLE    | 細胞の内部             | #ef4444
MOLECULE     | 分子の結合             | #ec4899
ATOM         | 原子の軌道             | #d946ef
QUANTUM      | 量子の揺らぎ            | #c026d3

=== Detail Check ===
STANDARD: {
  "name": "STANDARD",
  "description": "人間のスケール",
  "color": 16096779
}
```

---

## チェックポイント

- [ ] `src/lib/features/zoom/constants.ts` が作成されている
- [ ] ZoomLevelMetadata インターフェースが定義されている
- [ ] ZOOM_LEVEL_METADATA に14レベル分の定義がある
- [ ] getZoomLevelMetadata関数が実装されている
- [ ] ALL_ZOOM_LEVELS配列が実装されている
- [ ] すべてのレベルに色が設定されている
- [ ] TypeScriptのコンパイルエラーがない

---

## 設計の意図

### カラースペクトラム

色相環に沿ったグラデーション：
- **COSMOS〜SOLAR**: 紫〜青（270°〜210°）- 神秘的、宇宙的
- **PLANET〜COUNTRY**: シアン〜緑（180°〜120°）- 自然、生命
- **CITY〜STANDARD**: 黄緑〜オレンジ（90°〜30°）- 温暖、人間的
- **CELL〜QUANTUM**: 赤〜紫ピンク（0°〜300°）- エネルギッシュ、神秘的

### ストーリー性

各レベルの名前と説明で、マクロからミクロへの旅のストーリーを表現。

---

## Phase 1.1完了

これでPhase 1.1（ズームレベルの基礎定義）のすべてのステップが完了です。

### 作成したファイル

- `src/lib/types/zoom.ts` - ZoomLevel enum、getChunkSize
- `src/lib/features/zoom/timeScale.ts` - 時間スケール関数
- `src/lib/features/zoom/constants.ts` - メタデータ定義

---

## 次のステップ

[Step 1.2.1: AggregationStrategy インターフェース定義](./step-1.2.1.md)

---

最終更新: 2025-11-09

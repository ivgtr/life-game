# Step 1.1.1: ZoomLevel enum定義とチャンクサイズ計算関数

**Phase**: 1.1 - ズームレベルの基礎定義
**見積もり時間**: 30分

---

## 目的

14段階のズームレベルenumと、フィボナッチ数列ベースのチャンクサイズ計算関数を実装します。

---

## 実装内容

### ファイル作成

**パス**: `src/lib/types/zoom.ts`

```typescript
/**
 * ズームレベル定義
 * -5 (COSMOS) から 8 (QUANTUM) まで14段階
 */
export enum ZoomLevel {
  COSMOS = -5,      // 宇宙規模 (256x256チャンク相当)
  GALAXY = -4,      // 銀河規模 (128x128)
  SOLAR = -3,       // 太陽系規模 (64x64)
  PLANET = -2,      // 惑星規模 (32x32)
  CONTINENT = -1,   // 大陸規模 (16x16)
  COUNTRY = 0,      // 国家規模 (8x8)
  CITY = 1,         // 都市規模 (4x4)
  STREET = 2,       // 街路規模 (2x2)
  STANDARD = 3,     // 標準（人間スケール） (1x1)
  CELL = 4,         // 細胞規模 (1セル=2x2サブセル)
  ORGANELLE = 5,    // 細胞小器官規模 (1セル=4x4)
  MOLECULE = 6,     // 分子規模 (1セル=8x8)
  ATOM = 7,         // 原子規模 (1セル=16x16)
  QUANTUM = 8,      // 量子規模 (1セル=32x32)
}

/**
 * フィボナッチ数列
 * 自然界に多く見られる黄金比に基づく数列
 */
const FIBONACCI = [1, 1, 2, 3, 5, 8, 13, 21, 34, 55, 89, 144, 233, 377]

/**
 * ズームレベルに対応するチャンクサイズを取得
 *
 * @param level ズームレベル
 * @returns チャンクサイズ（一辺のセル数）
 *
 * @example
 * getChunkSize(ZoomLevel.STANDARD) // 1
 * getChunkSize(ZoomLevel.COSMOS)   // 89
 * getChunkSize(ZoomLevel.QUANTUM)  // 55
 */
export function getChunkSize(level: ZoomLevel): number {
  const index = Math.abs(level - ZoomLevel.STANDARD)
  return FIBONACCI[Math.min(index, FIBONACCI.length - 1)]
}
```

---

## テスト

### 動作確認コード

一時的なテストファイルを作成して確認：

```typescript
// src/lib/types/__test_zoom.ts （確認後削除）
import { ZoomLevel, getChunkSize } from './zoom'

console.log('=== ZoomLevel enum test ===')
console.log('COSMOS:', ZoomLevel.COSMOS)      // -5
console.log('STANDARD:', ZoomLevel.STANDARD)  // 3
console.log('QUANTUM:', ZoomLevel.QUANTUM)    // 8

console.log('\n=== getChunkSize test ===')
console.log('STANDARD:', getChunkSize(ZoomLevel.STANDARD))  // 1
console.log('STREET:', getChunkSize(ZoomLevel.STREET))      // 1 (abs(2-3)=1, FIBONACCI[1]=1)
console.log('CITY:', getChunkSize(ZoomLevel.CITY))          // 2 (abs(1-3)=2, FIBONACCI[2]=2)
console.log('COUNTRY:', getChunkSize(ZoomLevel.COUNTRY))    // 3 (abs(0-3)=3, FIBONACCI[3]=3)
console.log('COSMOS:', getChunkSize(ZoomLevel.COSMOS))      // 89 (abs(-5-3)=8, FIBONACCI[8]=34)
console.log('QUANTUM:', getChunkSize(ZoomLevel.QUANTUM))    // 55 (abs(8-3)=5, FIBONACCI[5]=8)

// エッジケース
console.log('\n=== Edge cases ===')
console.log('Max index:', getChunkSize(-100 as ZoomLevel))  // 377 (FIBONACCI最大値)
```

実行:
```bash
npx tsx src/lib/types/__test_zoom.ts
```

### 期待される出力

```
=== ZoomLevel enum test ===
COSMOS: -5
STANDARD: 3
QUANTUM: 8

=== getChunkSize test ===
STANDARD: 1
STREET: 1
CITY: 2
COUNTRY: 3
COSMOS: 89
QUANTUM: 55

=== Edge cases ===
Max index: 377
```

---

## チェックポイント

- [ ] `src/lib/types/zoom.ts` が作成されている
- [ ] ZoomLevel enumに14個の値がある（COSMOS〜QUANTUM）
- [ ] getChunkSize関数が実装されている
- [ ] テストコードが正しい値を返す
- [ ] TypeScriptのコンパイルエラーがない

---

## トラブルシューティング

### Q: FIBONACCI配列のサイズが足りない場合は？

A: `Math.min(index, FIBONACCI.length - 1)` で最大インデックスに制限しているため、配列外アクセスは発生しません。

### Q: なぜフィボナッチ数列？

A: 自然界に多く見られる黄金比（φ ≈ 1.618）に基づく数列で、有機的で美しいスケーリングを実現します。連続するフィボナッチ数の比が黄金比に収束します。

---

## 次のステップ

[Step 1.1.2: 時間スケール計算関数の実装](./step-1.1.2.md)

---

## 参考

- [フィボナッチ数列 - Wikipedia](https://ja.wikipedia.org/wiki/%E3%83%95%E3%82%A3%E3%83%9C%E3%83%8A%E3%83%83%E3%83%81%E6%95%B0)
- [黄金比 - Wikipedia](https://ja.wikipedia.org/wiki/%E9%BB%84%E9%87%91%E6%AF%94)

---

最終更新: 2025-11-09

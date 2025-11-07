# コードスタイルと規約

## TypeScript設定

### Strict設定（tsconfig.app.json）

```json
{
  "strict": true,
  "noUnusedLocals": true,
  "noUnusedParameters": true,
  "noFallthroughCasesInSwitch": true,
  "noUncheckedIndexedAccess": true
}
```

### 型定義の方針

- すべての関数とクラスに明示的な型定義を付ける
- `any`の使用は避ける
- 共通の型定義は`src/lib/types/`に配置

## Prettier設定（.prettierrc）

```json
{
  "useTabs": false,
  "tabWidth": 2,
  "singleQuote": true,
  "trailingComma": "es5",
  "printWidth": 100,
  "semi": false
}
```

### ポイント

- シングルクォート使用
- セミコロン不使用
- インデント: スペース2つ
- 最大行長: 100文字
- 末尾カンマ: ES5準拠

## ESLint設定

- `@eslint/js`の推奨設定
- `typescript-eslint`の推奨設定
- `eslint-plugin-svelte`の推奨設定
- Prettierとの競合回避設定

## 命名規則

### ファイル名

- コンポーネント: PascalCase（例: `LifeCanvas.svelte`, `Counter.svelte`）
- ユーティリティ/ロジック: camelCase（例: `lifeEngine.ts`, `gridUtils.ts`）
- 型定義: camelCase（例: `types.ts`, `presetConfig.ts`）

### 変数・関数名

- camelCase（例: `cellState`, `updateGrid()`）
- 定数: UPPER_SNAKE_CASE（例: `MAX_GRID_SIZE`）
- 型・インターフェース: PascalCase（例: `CellState`, `Grid`, `SimulationSettings`）

## Svelte固有の規約

- コンポーネントはPascalCaseで命名
- Svelte 5のRunesシンタックスを使用
- `onMount`でライフサイクル管理
- リアクティブな宣言には`$:`を使用

## コメント

- JSDocスタイルで関数・クラスにドキュメント
- 複雑なロジックには説明コメントを追加
- TODOコメントは`// TODO: 説明`形式

## 設計パターン

### 責務の分離

- ロジック層と描画層を明確に分離
- Svelte Storeで状態管理を集中化
- PixiJSは専用コンポーネント内でカプセル化

### テスト可能性

- 純粋関数を優先
- 外部依存は注入可能に設計
- ライフゲームロジックには必ずユニットテスト

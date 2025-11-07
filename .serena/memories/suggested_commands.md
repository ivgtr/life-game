# 推奨コマンド

## 開発コマンド

### 日常的な開発

```bash
npm run dev         # 開発サーバー起動（http://localhost:5173）
npm run build       # 本番ビルド（dist/に出力）
npm run preview     # ビルド結果のプレビュー
```

### コード品質チェック

```bash
npm run check       # TypeScript型チェック（svelte-check + tsc）
npm test            # Vitestでテスト実行
npm run lint        # ESLintでコードチェック
npm run format      # Prettierでコード整形
```

### 推奨ワークフロー

開発時は以下の順序で実行することを推奨：

1. `npm run format` - コード整形
2. `npm run lint` - Lintチェック
3. `npm run check` - 型チェック
4. `npm test` - テスト実行

## システムコマンド（macOS/Darwin）

標準的なUnixコマンドが使用可能：

- `git` - バージョン管理
- `ls` - ファイル一覧表示
- `cd` - ディレクトリ移動
- `grep` - テキスト検索
- `find` - ファイル検索

## その他

### パッケージ管理

```bash
npm install         # 依存関係のインストール
npm ci              # クリーンインストール（CI用）
```

### Git操作

```bash
git status          # 変更状態確認
git add .           # 変更をステージング
git commit -m ""    # コミット
```

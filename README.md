# life-game

Conway's Game of Life のセルを日本語の文字に置き換えた、ジェネラティブ文学ツール。

セルオートマトンの規則に従って文字が生まれ、隣接セルの影響で変異し、死ぬときは徐々に崩壊していく。偶然形成された意味のあるフレーズを検出し、弾幕として画面に流す。

**[Demo](https://ivgtr.github.io/life-game/)**

## Features

- **文字セルオートマトン** -- セルの生死をピクセルではなく日本語の文字（ひらがな・カタカナ）で表現
- **WebGPU 並列処理** -- Compute Shader で 256x256 グリッドを 60fps で処理
- **MSDF テキストレンダリング** -- GPU 上で高品質なテキスト描画
- **フレーズ検出** -- kuromoji 形態素解析で文法構造を持つフレーズを自動検出、弾幕表示
- **テーマ** -- 和紙墨流し / ターミナル / ミニマルの 3 プリセット
- **シード** -- ランダム / 青空文庫テキスト / カスタムテキストからグリッドを生成

## Requirements

- WebGPU 対応ブラウザ（Chrome 113+, Edge 113+, Firefox Nightly）

## Development

```bash
yarn install
yarn dev
```

### Commands

| Command | Description |
|---------|-------------|
| `yarn dev` | 開発サーバー起動 |
| `yarn build` | プロダクションビルド |
| `yarn preview` | ビルドプレビュー |
| `yarn run check` | TypeScript + Svelte 型チェック |
| `yarn test` | テスト実行 |
| `yarn lint` | ESLint |
| `yarn format` | Prettier 整形 |
| `yarn generate-atlas` | MSDF フォントアトラス再生成 |

## Keyboard Shortcuts

| Key | Action |
|-----|--------|
| `Space` | 再生 / 停止 |
| `F` | フルスクリーン |
| `R` | リセット |
| `T` | テーマ切替 |
| `[` / `]` | 速度調整 |

## License

MIT

# ジェネラティブ文学ツール - 設計書

## 1. コンセプト

Conway's Game of Life のセルオートマトンを拡張し、セルの生死をピクセルではなく**日本語の文字**で表現するジェネラティブ文学ツール。

- 文字が隣接する文字の影響で変異し、世代を重ねるごとに意味のある/意味不明な文章が自然発生する
- 「言語が生まれ、変容し、朽ちるプロセス」を可視化する
- 青空文庫テキストをシードにすれば、文学作品が変容・崩壊していく様を鑑賞できる
- WebGPU Compute Shader で 500×500 以上のセルを並列処理

---

## 2. アーキテクチャ概要

```
┌─────────────────────────────────────────────────────────┐
│  Browser                                                │
│                                                         │
│  ┌─ Main Thread ──────────────────────────────────────┐ │
│  │  Svelte App                                        │ │
│  │  ├── UI Controls (再生/停止, シード選択, テーマ)    │ │
│  │  ├── Svelte Stores (状態管理)                      │ │
│  │  └── WebGPU Orchestrator                           │ │
│  │       ├── Compute Pipeline (セルオートマトン)      │ │
│  │       └── Render Pipeline (MSDF文字描画)           │ │
│  └────────────────────────────────────────────────────┘ │
│                                                         │
│  ┌─ Web Worker ───────────────────────────────────────┐ │
│  │  形態素解析エンジン (kuromoji.js / Wasm)            │ │
│  │  ├── グリッドスキャン（数世代ごと）                 │ │
│  │  ├── 単語検出・ハイライト座標返却                   │ │
│  │  └── 辞書データ (初回ロード)                        │ │
│  └────────────────────────────────────────────────────┘ │
│                                                         │
│  ┌─ GPU ──────────────────────────────────────────────┐ │
│  │  Compute Shader                                    │ │
│  │  ├── Conway B3/S23 拡張ルール                      │ │
│  │  ├── コードポイント変異演算                         │ │
│  │  └── 文字崩壊（部首分解）処理                      │ │
│  │                                                    │ │
│  │  Fragment Shader                                   │ │
│  │  ├── MSDF テキストレンダリング                     │ │
│  │  ├── テーマ別カラーリング                          │ │
│  │  └── 世代カウントに応じた視覚効果                  │ │
│  └────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────┘
```

---

## 3. コアメカニクス

### 3.1 セルの状態

各セルは以下の情報を保持する:

```typescript
// GPU バッファ上の表現（1セル = 8バイト）
struct Cell {
  codepoint: u32,    // Unicode コードポイント（0 = 空白/死セル）
  generation: i16,   // 正: 生存世代数、負: 崩壊カウントダウン
  flags: u16,        // ビットフラグ（ハイライト状態、崩壊段階等）
}
```

### 3.2 生死ルール（Conway B3/S23 拡張）

基本的な生死判定は Conway のルールを踏襲:

| 条件 | 結果 |
|------|------|
| 生セル + 隣接生セル 2-3 | **生存続行** → 変異ルール適用 |
| 生セル + 隣接生セル < 2 or > 3 | **死亡開始** → 崩壊プロセスへ |
| 死セル + 隣接生セル == 3 | **誕生** → 隣接3セルのコードポイント演算で文字決定 |

### 3.3 文字変異ルール（コードポイント演算）

生存するセルの文字は、隣接セルの影響を受けて変異する:

```
next_codepoint = weighted_average(neighbor_codepoints) + drift
```

- **weighted_average**: 隣接する生セルのコードポイントの加重平均
- **drift**: 小さなランダム摂動（方向性を持たせるパラメータ）
- 結果は有効な日本語文字コードポイントにクランプ

変異の強度は世代カウントに反比例する（長く生きた文字ほど安定する）。

**ルールエンジンは差し替え可能な設計**とし、将来的に以下のルールも追加可能:
- 五十音シフトルール（行・段ベースの変異）
- 確率テーブルルール（文字ごとの遷移確率）
- コンテキスト依存ルール（隣接文字の組み合わせベース）

### 3.4 文字崩壊（死の表現）

死亡判定を受けたセルは即座に消えるのではなく、**数世代かけて崩壊**する:

1. **段階 0（死亡判定）**: generation を負に反転（例: 5 → -5）
2. **段階 1-N（崩壊中）**: generation が 0 に向かってインクリメント
   - 視覚的に透明度が下がる
   - 文字が「壊れていく」表現（グリッチ、ノイズ、フラグメント化）
3. **段階 N+1（完全死亡）**: generation == 0 → codepoint = 0（空白）

崩壊中のセルは隣接セルの生死判定では「死セル」として扱う。

### 3.5 誕生ルール

隣接する生セルがちょうど 3 つの空白セルに新しい文字が誕生する:

```
new_codepoint = f(neighbor1_cp, neighbor2_cp, neighbor3_cp)
```

関数 `f` はルールエンジンに依存。コードポイント演算ルールでは3つの隣接文字のコードポイントの重み付き平均（有効な日本語文字にクランプ）。

---

## 4. 文字セット

### 4.1 段階的拡張

| フェーズ | 文字セット | グリフ数 | MSDFアトラス |
|----------|-----------|---------|-------------|
| MVP | ひらがな + カタカナ + 基本記号 | ~200 | ビルド時生成 |
| 拡張1 | + 常用漢字 | ~2,400 | 動的生成 |
| 拡張2 | + JIS第一水準 | ~3,000 | 動的生成 |

### 4.2 コードポイント範囲

```
ひらがな:   U+3040 - U+309F
カタカナ:   U+30A0 - U+30FF
CJK統合漢字: U+4E00 - U+9FFF (常用漢字はサブセット)
```

変異演算の結果がこれらの範囲外になった場合、最も近い有効な文字にクランプする。

---

## 5. レンダリングパイプライン

### 5.1 WebGPU Compute Shader

**セルオートマトン計算**を GPU 上で完全に並列処理:

- **入力**: 現在世代のセルバッファ（Grid × Cell）
- **出力**: 次世代のセルバッファ（ダブルバッファリング）
- **ワークグループサイズ**: 16×16（調整可能）

```wgsl
// 疑似WGSL
@compute @workgroup_size(16, 16)
fn update_cells(@builtin(global_invocation_id) id: vec3u) {
  let x = id.x;
  let y = id.y;
  let current = cells_in[index(x, y)];
  let alive_neighbors = count_alive_neighbors(x, y);

  // Conway B3/S23 + 文字変異
  if (current.codepoint != 0u) {
    // 生セル
    if (alive_neighbors < 2u || alive_neighbors > 3u) {
      // 死亡開始 → 崩壊プロセス
      cells_out[index(x, y)] = begin_decay(current);
    } else {
      // 生存 → 変異
      cells_out[index(x, y)] = mutate(current, x, y);
    }
  } else if (current.generation < 0i) {
    // 崩壊中
    cells_out[index(x, y)] = continue_decay(current);
  } else {
    // 死セル
    if (alive_neighbors == 3u) {
      // 誕生
      cells_out[index(x, y)] = birth(x, y);
    }
  }
}
```

### 5.2 MSDF テキストレンダリング

**Multi-channel Signed Distance Field** によるGPUテキスト描画:

1. **フォントアトラス**: ビルド時に `msdf-atlas-gen` で生成（ひらがな/カタカナ）
2. **グリフメタデータ**: 各文字のアトラス内座標、アドバンス幅等をJSONで管理
3. **Vertex Shader**: セルグリッドの各セルに対応するクワッドを生成
4. **Fragment Shader**: MSDFテクスチャからサンプリングし、文字を描画

```wgsl
// Fragment Shader 疑似コード
@fragment
fn fs_main(in: VertexOutput) -> @location(0) vec4f {
  let msdf = textureSample(font_atlas, sampler, in.uv);
  let sd = median(msdf.r, msdf.g, msdf.b);
  let alpha = smoothstep(0.5 - smoothing, 0.5 + smoothing, sd);

  // 世代カウントに応じた色変化
  let color = theme_color(in.generation, in.flags);

  // 崩壊エフェクト
  let decay_alpha = decay_effect(in.generation, in.flags, in.position);

  return vec4f(color.rgb, alpha * decay_alpha);
}
```

### 5.3 動的漢字アトラス生成

漢字はランタイムで必要に応じて生成:

1. Canvas 2D でグリフをレンダリング
2. SDF（簡易版）を CPU/Worker で計算
3. GPU テクスチャアトラスの空き領域に動的に追加
4. LRU キャッシュで使用頻度の低いグリフを入れ替え

---

## 6. テーマシステム

### 6.1 テーマ定義

各テーマは以下のパラメータを持つ:

```typescript
interface Theme {
  name: string
  background: Color
  cellColors: {
    alive: ColorGradient       // 世代数に応じたグラデーション
    decaying: ColorGradient    // 崩壊段階に応じた色変化
    highlighted: Color         // 意味検出時のハイライト色
  }
  typography: {
    fontFamily: string         // MSDFアトラス生成に使うフォント
    weight: 'light' | 'regular' | 'bold'
  }
  effects: {
    glitch: boolean            // グリッチエフェクト
    bloom: boolean             // ブルームエフェクト
    scanlines: boolean         // スキャンライン
  }
}
```

### 6.2 プリセットテーマ

| テーマ名 | 背景 | 文字色 | エフェクト | 雰囲気 |
|----------|------|--------|-----------|--------|
| 和紙・墨流し | 和紙テクスチャ（温かいベージュ） | 墨色（世代で濃淡変化） | なし | 書道・和の美学 |
| ターミナル・グリッチ | 黒 (#0a0a0a) | 緑/アンバー（世代で発光変化） | グリッチ, スキャンライン | マトリックス風デジタル |
| ミニマル・タイポグラフィ | 白 (#fafafa) | 黒（世代で微妙な色変化） | なし | 活版印刷・モダン |

---

## 7. シードシステム

### 7.1 ランダムシード

- 指定密度（デフォルト 30%）で文字セットからランダムにセルを配置
- Simplex Noise を使って「島」状の初期配置も可能

### 7.2 青空文庫シード

- テキストを左上からグリッド上に流し込む
- 周囲は空白（死セル）で囲む
- 文学作品が周囲から侵食され変容していく体験

**バンドル同梱（デフォルト）:**
- 厳選した数作品（例: 夏目漱石「吾輩は猫である」冒頭、宮沢賢治「銀河鉄道の夜」冒頭等）
- JSON形式で同梱（テキスト + メタデータ）

**ランタイム取得（オプション）:**
- 青空文庫APIまたはGitHubリポジトリからfetch
- 作品選択UI

### 7.3 ユーザーテキスト貼り付け

- テキストエリアにペーストしてシードとして使用
- 自分の文章が変容していく体験

---

## 8. 意味検出システム

### 8.1 アーキテクチャ

```
Main Thread                    Web Worker
    │                              │
    ├── 数世代ごとに ──────────────→│ グリッドデータ送信
    │                              │ ↓
    │                              │ 横方向・縦方向にテキスト抽出
    │                              │ ↓
    │                              │ 形態素解析（kuromoji.js Wasm）
    │                              │ ↓
    │                              │ 辞書照合 → 単語検出
    │   ハイライト座標 ←───────────│
    │   ↓                          │
    │   GPUバッファの flags 更新    │
    │   ↓                          │
    │   Fragment Shader で          │
    │   ハイライト描画              │
```

### 8.2 検出戦略

- **スキャン間隔**: 5-10 世代ごと（パフォーマンス調整可能）
- **スキャン方向**: 横方向（主）、縦方向（副）
- **最小単語長**: 2文字以上
- **検出時**: セルの `flags` にハイライトビットを立て、Fragment Shader で発光/強調表示

### 8.3 技術選定

- **kuromoji.js** (Wasm版): 本格的な形態素解析、辞書サイズ ~20MB
- 初回ロードは遅延ロード（アプリ起動後にバックグラウンドで辞書ロード）
- 辞書は IndexedDB にキャッシュ

---

## 9. UI設計

### 9.1 基本方針

- **観賞主体**: UIは最小限、画面の大部分はキャンバス
- 美術館のインスタレーション的な体験
- コントロールは控えめに配置、必要に応じて表示/非表示

### 9.2 UI要素

```
┌─────────────────────────────────────────┐
│                                         │
│         [文字セルオートマトン            │
│          メインキャンバス]               │
│                                         │
│                                         │
│                                         │
│                                         │
│  ┌──────┐                    ┌────────┐ │
│  │世代: │                    │ 検出   │ │
│  │ 1247 │                    │ 単語   │ │
│  └──────┘                    │ ログ   │ │
│                              └────────┘ │
│                                         │
│  ─── 下部コントロール（ホバーで表示）── │
│  [▶/⏸] [速度] [テーマ] [シード] [設定]  │
└─────────────────────────────────────────┘
```

### 9.3 操作

| 操作 | 機能 |
|------|------|
| 再生/停止 | シミュレーション制御 |
| 速度調整 | 世代更新速度 |
| テーマ切替 | 和紙墨/ターミナル/ミニマル |
| シード選択 | ランダム/青空文庫/テキスト貼付 |
| ズーム/パン | マウスホイール/ドラッグ |

---

## 10. ディレクトリ構成（新規）

```
src/
  main.ts                           # エントリーポイント
  App.svelte                        # ルートコンポーネント
  app.css                           # グローバルスタイル
  lib/
    components/
      Canvas.svelte                 # メインキャンバス（WebGPU）
      ControlBar.svelte             # 下部コントロールバー
      SeedSelector.svelte           # シード選択UI
      ThemeSelector.svelte          # テーマ切替UI
      WordLog.svelte                # 検出単語ログ表示
      GenerationCounter.svelte      # 世代カウンター
      FallbackMessage.svelte        # WebGPU非対応時メッセージ
    features/
      automaton/
        rules/
          MutationRule.ts           # 変異ルールインターフェース
          CodepointRule.ts          # コードポイント演算ルール
        CharacterSet.ts             # 文字セット定義・管理
        CellTypes.ts                # セル型定義
      seed/
        RandomSeed.ts               # ランダムシード生成
        AozoraSeed.ts               # 青空文庫シード
        TextSeed.ts                 # ユーザーテキストシード
        aozora-texts/               # バンドル同梱テキスト (JSON)
      detection/
        detection.worker.ts         # 形態素解析 Web Worker
        WordDetector.ts             # 単語検出ロジック
      themes/
        Theme.ts                    # テーマインターフェース
        WashiInkTheme.ts            # 和紙墨テーマ
        TerminalGlitchTheme.ts      # ターミナルグリッチテーマ
        MinimalTypoTheme.ts         # ミニマルタイポグラフィテーマ
    gpu/
      WebGPUContext.ts              # WebGPU初期化・デバイス管理
      ComputePipeline.ts           # セルオートマトン計算パイプライン
      RenderPipeline.ts            # MSDF描画パイプライン
      BufferManager.ts             # GPUバッファ管理（ダブルバッファ）
      shaders/
        automaton.wgsl              # セルオートマトン Compute Shader
        text_render.wgsl            # MSDF テキスト Fragment Shader
        quad.wgsl                   # クワッド Vertex Shader
    font/
      MSDFAtlasManager.ts          # MSDFアトラス管理
      DynamicGlyphLoader.ts        # 動的グリフ生成・キャッシュ
      atlas/                        # ビルド時生成MSDFアトラス
        hiragana-katakana.png       # アトラス画像
        hiragana-katakana.json      # グリフメタデータ
    stores/
      simulationStore.ts            # シミュレーション状態
      themeStore.ts                 # テーマ状態
      detectionStore.ts             # 単語検出状態
      seedStore.ts                  # シード状態
    types/
      cell.ts                       # セル関連型定義
      theme.ts                      # テーマ関連型定義
      seed.ts                       # シード関連型定義
```

---

## 11. 技術スタック

### 11.1 維持するもの

- **Svelte 5** + **Vite 7** (フレームワーク・ビルドツール)
- **TypeScript** strict (言語)
- **Tailwind CSS 4** (UIスタイリング)
- **Vitest** (テスト)
- **GitHub Pages** (ホスティング)
- **GitHub Actions** (CI/CD)

### 11.2 削除するもの

- **PixiJS** → WebGPU直接利用に置き換え
- **simplex-noise** → 必要に応じて再追加

### 11.3 新規追加

- **WebGPU API** (ブラウザネイティブ、パッケージ不要)
- **@webgpu/types** (WebGPU TypeScript型定義)
- **kuromoji.js** または同等品 (形態素解析)
- **msdf-atlas-gen** (ビルドツール、devDependency)

---

## 12. パフォーマンス目標

| 項目 | 目標値 |
|------|--------|
| グリッドサイズ | 500×500 以上（250,000セル） |
| フレームレート | 60fps (描画) |
| 世代更新速度 | 10-60 世代/秒（調整可能） |
| 初回ロード | < 3秒（MSDFアトラス含む） |
| 辞書ロード | バックグラウンド、< 10秒 |
| メモリ使用量 | < 200MB（GPUバッファ含む） |

### 12.1 最適化戦略

- **ダブルバッファリング**: Compute Shader の入出力を交互に使用
- **可視範囲カリング**: 画面外のセルは描画しない
- **インスタンシング**: 同一グリフの描画をインスタンスで最適化
- **バッチ更新**: 意味検出のハイライト更新はバッチで行う
- **遅延ロード**: 辞書データ・追加アトラスは遅延ロード

---

## 13. WebGPU非対応時

WebGPU非対応ブラウザではフォールバックは提供しない。

表示内容:
- プロジェクト名・コンセプト説明
- 対応ブラウザの案内（Chrome 113+, Edge 113+, Firefox Nightly等）
- スクリーンショット/動画で体験のプレビュー

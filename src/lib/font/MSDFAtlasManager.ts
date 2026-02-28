import atlasMetaUrl from './atlas/hiragana-katakana.json?url'
import atlasPngUrl from './atlas/hiragana-katakana.png?url'

export interface GlyphInfo {
  id: number
  x: number
  y: number
  width: number
  height: number
  xoffset: number
  yoffset: number
  xadvance: number
  page: number
}

export interface AtlasMetadata {
  info: { face: string; size: number }
  common: { lineHeight: number; base: number; scaleW: number; scaleH: number }
  chars: GlyphInfo[]
}

export class MSDFAtlasManager {
  private glyphMap = new Map<number, GlyphInfo>()
  private metadata!: AtlasMetadata
  texture!: GPUTexture
  scaleW = 0
  scaleH = 0
  fontSize = 0

  async load(device: GPUDevice): Promise<void> {
    // メタデータJSON読み込み
    const metaResponse = await fetch(atlasMetaUrl)
    this.metadata = (await metaResponse.json()) as AtlasMetadata
    this.scaleW = this.metadata.common.scaleW
    this.scaleH = this.metadata.common.scaleH
    this.fontSize = this.metadata.info.size

    for (const glyph of this.metadata.chars) {
      this.glyphMap.set(glyph.id, glyph)
    }

    // アトラス画像読み込み → GPUテクスチャ
    const imgResponse = await fetch(atlasPngUrl)
    const blob = await imgResponse.blob()
    const imageBitmap = await createImageBitmap(blob)

    this.texture = device.createTexture({
      label: 'msdf-atlas',
      size: [imageBitmap.width, imageBitmap.height],
      format: 'rgba8unorm',
      usage: GPUTextureUsage.TEXTURE_BINDING | GPUTextureUsage.COPY_DST | GPUTextureUsage.RENDER_ATTACHMENT,
    })

    device.queue.copyExternalImageToTexture(
      { source: imageBitmap },
      { texture: this.texture },
      [imageBitmap.width, imageBitmap.height],
    )

    imageBitmap.close()
  }

  getGlyph(codepoint: number): GlyphInfo | undefined {
    return this.glyphMap.get(codepoint)
  }

  /** コードポイントからUV座標を計算（GPU用の配列データ生成に使用） */
  getGlyphUV(codepoint: number): { u0: number; v0: number; u1: number; v1: number } | null {
    const g = this.glyphMap.get(codepoint)
    if (!g || g.width === 0 || g.height === 0) return null
    return {
      u0: g.x / this.scaleW,
      v0: g.y / this.scaleH,
      u1: (g.x + g.width) / this.scaleW,
      v1: (g.y + g.height) / this.scaleH,
    }
  }

  get glyphCount(): number {
    return this.glyphMap.size
  }

  /** GPU用: 全グリフのUVデータを格納したバッファを生成 */
  createGlyphUVBuffer(device: GPUDevice): GPUBuffer {
    // 最大コードポイントを決定してテーブルサイズを計算
    // ヴ(0x30F6)が最大なので 0x3100 までカバー
    const TABLE_SIZE = 0x3100
    // 各エントリ: u0, v0, u1, v1 (4 x f32 = 16 bytes)
    const data = new Float32Array(TABLE_SIZE * 4)

    for (const [cp, glyph] of this.glyphMap) {
      if (cp >= TABLE_SIZE) continue
      if (glyph.width === 0 || glyph.height === 0) continue
      const base = cp * 4
      data[base] = glyph.x / this.scaleW
      data[base + 1] = glyph.y / this.scaleH
      data[base + 2] = (glyph.x + glyph.width) / this.scaleW
      data[base + 3] = (glyph.y + glyph.height) / this.scaleH
    }

    const buffer = device.createBuffer({
      label: 'glyph-uv-table',
      size: data.byteLength,
      usage: GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_DST,
    })
    device.queue.writeBuffer(buffer, 0, data)
    return buffer
  }
}

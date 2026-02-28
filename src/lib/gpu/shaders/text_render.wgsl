// MSDF テキストレンダリング Shader
// セルバッファからグリフUVを参照し、MSDFテクスチャで文字を描画

struct Cell {
  codepoint: u32,
  gen_flags: u32,
}

struct RenderParams {
  grid_width: f32,
  grid_height: f32,
  cell_size: f32,
  viewport_x: f32,
  viewport_y: f32,
  viewport_scale: f32,
  canvas_width: f32,
  canvas_height: f32,
  // テーマカラー
  bg_r: f32, bg_g: f32, bg_b: f32, bg_a: f32,
  alive_r: f32, alive_g: f32, alive_b: f32, alive_a: f32,
  decay_r: f32, decay_g: f32, decay_b: f32, decay_a: f32,
  highlight_r: f32, highlight_g: f32, highlight_b: f32, highlight_a: f32,
}

struct GlyphUV {
  u0: f32, v0: f32, u1: f32, v1: f32,
}

struct VertexOutput {
  @builtin(position) position: vec4f,
  @location(0) uv: vec2f,
  @location(1) generation: f32,
  @location(2) flags: f32,
  @location(3) is_alive: f32,
}

@group(0) @binding(0) var<storage, read> cells: array<Cell>;
@group(0) @binding(1) var<storage, read> glyph_uvs: array<GlyphUV>;
@group(0) @binding(2) var<uniform> params: RenderParams;
@group(0) @binding(3) var atlas_texture: texture_2d<f32>;
@group(0) @binding(4) var atlas_sampler: sampler;

fn get_generation(cell: Cell) -> i32 {
  return i32(cell.gen_flags & 0xFFFFu) - 32768i;
}

fn get_flags(cell: Cell) -> u32 {
  return (cell.gen_flags >> 16u) & 0xFFFFu;
}

// 各セルは6頂点（2三角形）のクワッド
// vertex_index を instance_index * 6 + local_vertex で分解

@vertex
fn vs_main(
  @builtin(vertex_index) vertex_index: u32,
  @builtin(instance_index) instance_index: u32,
) -> VertexOutput {
  let cell = cells[instance_index];
  let gen = get_generation(cell);
  let flags = get_flags(cell);

  // セルのグリッド座標
  let grid_w = u32(params.grid_width);
  let grid_x = instance_index % grid_w;
  let grid_y = instance_index / grid_w;

  // UVルックアップ
  var uv_data = GlyphUV(0.0, 0.0, 0.0, 0.0);
  if cell.codepoint > 0u && cell.codepoint < arrayLength(&glyph_uvs) {
    uv_data = glyph_uvs[cell.codepoint];
  }

  // クワッドの4頂点（2三角形 = 6頂点: 0,1,2, 2,1,3）
  let corners = array<vec2f, 4>(
    vec2f(0.0, 0.0), // top-left
    vec2f(1.0, 0.0), // top-right
    vec2f(0.0, 1.0), // bottom-left
    vec2f(1.0, 1.0), // bottom-right
  );
  let indices = array<u32, 6>(0u, 1u, 2u, 2u, 1u, 3u);
  let corner = corners[indices[vertex_index]];

  // UVs
  let uv = vec2f(
    mix(uv_data.u0, uv_data.u1, corner.x),
    mix(uv_data.v0, uv_data.v1, corner.y),
  );

  // ワールド座標 → クリップ座標
  let world_x = (f32(grid_x) + corner.x) * params.cell_size;
  let world_y = (f32(grid_y) + corner.y) * params.cell_size;

  let screen_x = (world_x - params.viewport_x) * params.viewport_scale;
  let screen_y = (world_y - params.viewport_y) * params.viewport_scale;

  let clip_x = (screen_x / params.canvas_width) * 2.0 - 1.0;
  let clip_y = 1.0 - (screen_y / params.canvas_height) * 2.0;

  var output: VertexOutput;
  output.position = vec4f(clip_x, clip_y, 0.0, 1.0);
  output.uv = uv;
  output.generation = f32(gen);
  output.flags = f32(flags);
  output.is_alive = select(0.0, 1.0, cell.codepoint > 0u);
  return output;
}

fn median(r: f32, g: f32, b: f32) -> f32 {
  return max(min(r, g), min(max(r, g), b));
}

@fragment
fn fs_main(in: VertexOutput) -> @location(0) vec4f {
  if in.is_alive < 0.5 {
    discard;
  }

  let msdf = textureSample(atlas_texture, atlas_sampler, in.uv);
  let sd = median(msdf.r, msdf.g, msdf.b);

  // スムージング幅を画面のピクセルサイズに基づいて計算
  let smoothing = 0.1;
  let alpha = smoothstep(0.5 - smoothing, 0.5 + smoothing, sd);

  if alpha < 0.01 {
    discard;
  }

  // 色の決定
  var color: vec3f;
  var final_alpha = alpha;

  let is_decaying = (u32(in.flags) & 0x0002u) != 0u;
  let is_highlighted = (u32(in.flags) & 0x0001u) != 0u;

  if is_highlighted {
    color = vec3f(params.highlight_r, params.highlight_g, params.highlight_b);
  } else if is_decaying {
    color = vec3f(params.decay_r, params.decay_g, params.decay_b);
    // 崩壊中は透明度が徐々に下がる
    let decay_progress = clamp(-in.generation / 10.0, 0.0, 1.0);
    final_alpha = alpha * (1.0 - decay_progress * 0.8);
  } else {
    // 世代に応じた色変化（長寿ほど明るい）
    let age_factor = clamp(in.generation / 50.0, 0.0, 1.0);
    color = mix(
      vec3f(params.alive_r, params.alive_g, params.alive_b),
      vec3f(params.alive_r * 1.3, params.alive_g * 1.3, params.alive_b * 1.3),
      age_factor,
    );
    color = clamp(color, vec3f(0.0), vec3f(1.0));
  }

  return vec4f(color, final_alpha);
}

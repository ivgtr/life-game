// セルオートマトン Compute Shader
// Conway B3/S23 + コードポイント変異 + 文字崩壊

struct Cell {
  codepoint: u32,
  // generation は i16 + flags は u16 だが、WGSL にはi16がないので
  // u32 として pack: lower 16 bits = generation (as i16), upper 16 bits = flags
  gen_flags: u32,
}

struct Params {
  width: u32,
  height: u32,
  tick: u32,
  mutation_strength: f32,
  decay_steps: u32,
  seed: u32,
}

@group(0) @binding(0) var<storage, read> cells_in: array<Cell>;
@group(0) @binding(1) var<storage, read_write> cells_out: array<Cell>;
@group(0) @binding(2) var<uniform> params: Params;

// ひらがな範囲
const HIRAGANA_START: u32 = 0x3041u; // ぁ
const HIRAGANA_END: u32 = 0x3096u;   // ゖ
// カタカナ範囲
const KATAKANA_START: u32 = 0x30A1u; // ァ
const KATAKANA_END: u32 = 0x30F6u;   // ヶ

fn get_generation(cell: Cell) -> i32 {
  return i32(cell.gen_flags & 0xFFFFu) - 32768i;
}

fn get_flags(cell: Cell) -> u32 {
  return (cell.gen_flags >> 16u) & 0xFFFFu;
}

fn pack_gen_flags(gen: i32, flags: u32) -> u32 {
  let g = u32(gen + 32768i) & 0xFFFFu;
  return g | (flags << 16u);
}

fn idx(x: u32, y: u32) -> u32 {
  return y * params.width + x;
}

fn is_alive(cell: Cell) -> bool {
  return cell.codepoint != 0u && get_generation(cell) > 0i;
}

fn is_decaying(cell: Cell) -> bool {
  return cell.codepoint != 0u && get_generation(cell) < 0i;
}

// 簡易ハッシュ（疑似乱数）
fn hash(x: u32) -> u32 {
  var v = x;
  v = v ^ (v >> 16u);
  v = v * 0x45d9f3bu;
  v = v ^ (v >> 16u);
  v = v * 0x45d9f3bu;
  v = v ^ (v >> 16u);
  return v;
}

fn random_float(seed_val: u32) -> f32 {
  return f32(hash(seed_val) & 0x00FFFFFFu) / f32(0x01000000u);
}

// コードポイントを有効な日本語文字にクランプ
fn clamp_to_valid_char(cp: u32) -> u32 {
  // ひらがな範囲内ならそのまま
  if cp >= HIRAGANA_START && cp <= HIRAGANA_END {
    return cp;
  }
  // カタカナ範囲内ならそのまま
  if cp >= KATAKANA_START && cp <= KATAKANA_END {
    return cp;
  }
  // 範囲外の場合、最も近い範囲にクランプ
  if cp < HIRAGANA_START {
    return HIRAGANA_START;
  }
  if cp > HIRAGANA_END && cp < KATAKANA_START {
    // ひらがなとカタカナの間 → 近い方に
    let dist_h = cp - HIRAGANA_END;
    let dist_k = KATAKANA_START - cp;
    if dist_h <= dist_k { return HIRAGANA_END; }
    return KATAKANA_START;
  }
  if cp > KATAKANA_END {
    return KATAKANA_END;
  }
  return HIRAGANA_START;
}

@compute @workgroup_size(16, 16)
fn main(@builtin(global_invocation_id) id: vec3u) {
  let x = id.x;
  let y = id.y;

  if x >= params.width || y >= params.height {
    return;
  }

  let i = idx(x, y);
  let current = cells_in[i];
  let gen = get_generation(current);
  let flags = get_flags(current);

  // 隣接生セルをカウント + コードポイント収集
  var alive_count: u32 = 0u;
  var cp_sum: u32 = 0u;
  var neighbor_cps: array<u32, 8>;

  for (var dy: i32 = -1i; dy <= 1i; dy = dy + 1i) {
    for (var dx: i32 = -1i; dx <= 1i; dx = dx + 1i) {
      if dx == 0i && dy == 0i { continue; }

      // トーラス（端ループ）
      let nx = u32((i32(x) + dx + i32(params.width)) % i32(params.width));
      let ny = u32((i32(y) + dy + i32(params.height)) % i32(params.height));
      let neighbor = cells_in[idx(nx, ny)];

      if is_alive(neighbor) {
        neighbor_cps[alive_count] = neighbor.codepoint;
        alive_count = alive_count + 1u;
        cp_sum = cp_sum + neighbor.codepoint;
      }
    }
  }

  var out: Cell;

  if is_alive(current) {
    // 生セル
    if alive_count < 2u || alive_count > 3u {
      // 死亡開始 → 崩壊プロセス
      let decay_gen = -i32(params.decay_steps);
      out = Cell(current.codepoint, pack_gen_flags(decay_gen, flags | 0x0002u));
    } else {
      // 生存 → 変異
      let stability = min(f32(gen) / 20.0, 1.0); // 長寿ほど安定
      let rng = random_float(hash(i) ^ params.tick ^ params.seed);

      var new_cp = current.codepoint;
      if alive_count > 0u && rng > stability * (1.0 - params.mutation_strength) {
        // 隣接セルのコードポイント平均 + ドリフト
        let avg = cp_sum / alive_count;
        let drift_seed = hash(i * 31u + params.tick * 7u + params.seed);
        let drift = i32(drift_seed % 5u) - 2i;
        new_cp = clamp_to_valid_char(u32(i32(avg) + drift));
      }

      out = Cell(new_cp, pack_gen_flags(gen + 1i, flags & ~0x0002u));
    }
  } else if is_decaying(current) {
    // 崩壊中
    let new_gen = gen + 1i;
    if new_gen >= 0i {
      // 完全死亡
      out = Cell(0u, pack_gen_flags(0i, 0u));
    } else {
      out = Cell(current.codepoint, pack_gen_flags(new_gen, flags | 0x0002u));
    }
  } else {
    // 死セル
    if alive_count == 3u {
      // 誕生: 3つの隣接セルのコードポイントから新文字決定
      let avg_cp = cp_sum / 3u;
      let birth_seed = hash(i * 17u + params.tick * 13u + params.seed);
      let drift = i32(birth_seed % 3u) - 1i;
      let new_cp = clamp_to_valid_char(u32(i32(avg_cp) + drift));
      out = Cell(new_cp, pack_gen_flags(1i, 0u));
    } else {
      out = Cell(0u, pack_gen_flags(0i, 0u));
    }
  }

  cells_out[i] = out;
}

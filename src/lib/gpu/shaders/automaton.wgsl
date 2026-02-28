// セルオートマトン Compute Shader
// カスタムルール: エッジ成長 + 寛容な生存 + クラスター自然発生

struct Cell {
  codepoint: u32,
  gen_flags: u32,
}

struct Params {
  width: u32,
  height: u32,
  tick: u32,
  mutation_strength: f32,
  decay_steps: u32,
  seed: u32,
  max_age: u32,
  spontaneous_rate: f32,
}

@group(0) @binding(0) var<storage, read> cells_in: array<Cell>;
@group(0) @binding(1) var<storage, read_write> cells_out: array<Cell>;
@group(0) @binding(2) var<uniform> params: Params;

const HIRAGANA_START: u32 = 0x3041u;
const HIRAGANA_END: u32 = 0x3096u;
const HIRAGANA_COUNT: u32 = 86u;
const KATAKANA_START: u32 = 0x30A1u;
const KATAKANA_END: u32 = 0x30F6u;
const KATAKANA_COUNT: u32 = 86u;

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

fn random_kana(seed_val: u32) -> u32 {
  let h = hash(seed_val);
  let total = HIRAGANA_COUNT + KATAKANA_COUNT;
  let pick = h % total;
  if pick < HIRAGANA_COUNT {
    return HIRAGANA_START + pick;
  }
  return KATAKANA_START + (pick - HIRAGANA_COUNT);
}

fn clamp_to_valid_char(cp: u32) -> u32 {
  if cp >= HIRAGANA_START && cp <= HIRAGANA_END { return cp; }
  if cp >= KATAKANA_START && cp <= KATAKANA_END { return cp; }
  if cp < HIRAGANA_START { return HIRAGANA_START; }
  if cp > HIRAGANA_END && cp < KATAKANA_START {
    let dist_h = cp - HIRAGANA_END;
    let dist_k = KATAKANA_START - cp;
    if dist_h <= dist_k { return HIRAGANA_END; }
    return KATAKANA_START;
  }
  if cp > KATAKANA_END { return KATAKANA_END; }
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

  // 隣接セル情報を収集
  var alive_count: u32 = 0u;
  var cp_sum: u32 = 0u;
  var decaying_count: u32 = 0u;

  for (var dy: i32 = -1i; dy <= 1i; dy = dy + 1i) {
    for (var dx: i32 = -1i; dx <= 1i; dx = dx + 1i) {
      if dx == 0i && dy == 0i { continue; }

      let nx = u32((i32(x) + dx + i32(params.width)) % i32(params.width));
      let ny = u32((i32(y) + dy + i32(params.height)) % i32(params.height));
      let neighbor = cells_in[idx(nx, ny)];

      if is_alive(neighbor) {
        alive_count = alive_count + 1u;
        cp_sum = cp_sum + neighbor.codepoint;
      } else if is_decaying(neighbor) {
        decaying_count = decaying_count + 1u;
      }
    }
  }

  // 「近くに生命がある度合い」= 生セル + 崩壊中セルの半分
  let life_proximity = alive_count + decaying_count / 2u;

  var out: Cell;

  if is_alive(current) {
    // ========== 生セル ==========

    // 寿命チェック
    if params.max_age > 0u && u32(gen) >= params.max_age {
      let decay_gen = -i32(params.decay_steps);
      out = Cell(current.codepoint, pack_gen_flags(decay_gen, flags | 0x0002u));
    }
    // 生存ルール: S2345 (2〜5隣接で生存、過密にも孤立にも強い)
    else if alive_count >= 2u && alive_count <= 5u {
      // 生存 → 変異
      let stability = min(f32(gen) / 20.0, 1.0);
      let rng = random_float(hash(i * 3u + 1u) ^ params.tick ^ params.seed);

      var new_cp = current.codepoint;
      if alive_count > 0u && rng > stability * (1.0 - params.mutation_strength) {
        let avg = cp_sum / alive_count;
        let drift_seed = hash(i * 31u + params.tick * 7u + params.seed);
        let drift = i32(drift_seed % 11u) - 5i;
        new_cp = clamp_to_valid_char(u32(max(0i, i32(avg) + drift)));

        // 5%でひらがな⇔カタカナジャンプ
        let jump_rng = random_float(hash(i * 13u + 3u) ^ params.tick);
        if jump_rng < 0.05 {
          if new_cp >= HIRAGANA_START && new_cp <= HIRAGANA_END {
            new_cp = new_cp - HIRAGANA_START + KATAKANA_START;
          } else if new_cp >= KATAKANA_START && new_cp <= KATAKANA_END {
            new_cp = new_cp - KATAKANA_START + HIRAGANA_START;
          }
          new_cp = clamp_to_valid_char(new_cp);
        }
      }

      out = Cell(new_cp, pack_gen_flags(gen + 1i, flags & ~0x0002u));
    } else {
      // 死亡（0-1隣接 = 孤立、6+隣接 = 過密）
      let decay_gen = -i32(params.decay_steps);
      out = Cell(current.codepoint, pack_gen_flags(decay_gen, flags | 0x0002u));
    }

  } else if is_decaying(current) {
    // ========== 崩壊中 ==========
    let new_gen = gen + 1i;
    if new_gen >= 0i {
      out = Cell(0u, pack_gen_flags(0i, 0u));
    } else {
      out = Cell(current.codepoint, pack_gen_flags(new_gen, flags | 0x0002u));
    }

  } else {
    // ========== 死セル ==========

    let rng_base = hash(i * 97u + 5u) ^ params.tick ^ params.seed;

    if alive_count == 3u || alive_count == 6u {
      // 標準誕生: B36 (HighLife)
      let avg_cp = cp_sum / alive_count;
      let birth_seed = hash(i * 17u + params.tick * 13u + params.seed);
      let drift = i32(birth_seed % 7u) - 3i;
      let new_cp = clamp_to_valid_char(u32(max(0i, i32(avg_cp) + drift)));
      out = Cell(new_cp, pack_gen_flags(1i, 0u));

    } else if alive_count == 1u || alive_count == 2u {
      // エッジ成長: 既存の生命の縁で確率的に新しいセルが生える
      // 隣接1-2 → 2%の確率で誕生（サンゴ的な成長）
      let edge_rng = random_float(rng_base);
      if edge_rng < 0.02 {
        var new_cp: u32;
        if alive_count > 0u {
          let avg_cp = cp_sum / alive_count;
          let drift_seed = hash(i * 23u + params.tick * 11u + params.seed);
          let drift = i32(drift_seed % 5u) - 2i;
          new_cp = clamp_to_valid_char(u32(max(0i, i32(avg_cp) + drift)));
        } else {
          new_cp = random_kana(rng_base);
        }
        out = Cell(new_cp, pack_gen_flags(1i, 0u));
      } else {
        out = Cell(0u, pack_gen_flags(0i, 0u));
      }

    } else if life_proximity > 0u {
      // 崩壊中セルの近くでも低確率で復活
      let revive_rng = random_float(rng_base ^ 0xABCDu);
      if revive_rng < 0.005 {
        let new_cp = random_kana(rng_base ^ 0x1234u);
        out = Cell(new_cp, pack_gen_flags(1i, 0u));
      } else {
        out = Cell(0u, pack_gen_flags(0i, 0u));
      }

    } else {
      // 完全な空白地帯: ごく低確率で自然発生
      let sp_rng = random_float(rng_base);
      if sp_rng < params.spontaneous_rate {
        let sp_cp = random_kana(hash(i * 41u + params.tick * 3u) ^ params.seed);
        out = Cell(sp_cp, pack_gen_flags(1i, 0u));
      } else {
        out = Cell(0u, pack_gen_flags(0i, 0u));
      }
    }
  }

  cells_out[i] = out;
}

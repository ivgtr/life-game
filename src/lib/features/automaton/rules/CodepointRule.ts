import type { MutationRuleConfig } from './MutationRule'

/** コードポイント演算ルール: 隣接セルのコードポイント加重平均で変異 */
export const codepointRule: MutationRuleConfig = {
  name: 'Codepoint Arithmetic',
  mutationStrength: 0.5,
  decaySteps: 5,
}

/** 穏やかな変異: 安定性が高く変化が緩やか */
export const gentleRule: MutationRuleConfig = {
  name: 'Gentle Drift',
  mutationStrength: 0.2,
  decaySteps: 8,
}

/** 激しい変異: 文字が頻繁に変化 */
export const chaoticRule: MutationRuleConfig = {
  name: 'Chaotic Storm',
  mutationStrength: 0.9,
  decaySteps: 3,
}

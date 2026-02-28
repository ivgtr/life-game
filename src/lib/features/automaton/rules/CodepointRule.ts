import type { MutationRuleConfig } from './MutationRule'

/** コードポイント演算ルール: HighLife B36/S23 + バランスの取れた変異 */
export const codepointRule: MutationRuleConfig = {
  name: 'Codepoint Arithmetic',
  mutationStrength: 0.5,
  decaySteps: 5,
  maxAge: 80,
  spontaneousRate: 0.001,
}

/** 穏やかな変異: 安定性が高く変化が緩やか */
export const gentleRule: MutationRuleConfig = {
  name: 'Gentle Drift',
  mutationStrength: 0.2,
  decaySteps: 8,
  maxAge: 120,
  spontaneousRate: 0.0005,
}

/** 激しい変異: 文字が頻繁に変化、短命、高い自然発生率 */
export const chaoticRule: MutationRuleConfig = {
  name: 'Chaotic Storm',
  mutationStrength: 0.9,
  decaySteps: 3,
  maxAge: 40,
  spontaneousRate: 0.003,
}

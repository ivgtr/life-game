import type { MutationRuleConfig } from './MutationRule'

/** コードポイント演算ルール: バランスの取れた変異 */
export const codepointRule: MutationRuleConfig = {
  name: 'Codepoint Arithmetic',
  mutationStrength: 0.5,
  decaySteps: 4,
  maxAge: 120,
  spontaneousRate: 0.0005,
}

/** 穏やかな変異: 安定性が高く変化が緩やか */
export const gentleRule: MutationRuleConfig = {
  name: 'Gentle Drift',
  mutationStrength: 0.2,
  decaySteps: 6,
  maxAge: 200,
  spontaneousRate: 0.0003,
}

/** 激しい変異: 文字が頻繁に変化、活発な成長 */
export const chaoticRule: MutationRuleConfig = {
  name: 'Chaotic Storm',
  mutationStrength: 0.9,
  decaySteps: 3,
  maxAge: 60,
  spontaneousRate: 0.002,
}

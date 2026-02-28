/** 変異ルールのインターフェース（CPU側パラメータ定義） */
export interface MutationRuleConfig {
  readonly name: string
  readonly mutationStrength: number
  readonly decaySteps: number
  readonly maxAge: number
  readonly spontaneousRate: number
}

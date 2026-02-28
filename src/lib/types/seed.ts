export type SeedType = 'random' | 'aozora' | 'custom'

export interface SeedConfig {
  type: SeedType
  density?: number
  text?: string
  aozoraId?: string
}

export interface AozoraText {
  id: string
  title: string
  author: string
  excerpt: string
}

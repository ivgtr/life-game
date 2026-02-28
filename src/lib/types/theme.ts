import type { ThemeColors } from '$lib/gpu/RenderPipeline'

export interface Theme {
  name: string
  id: string
  colors: ThemeColors
}

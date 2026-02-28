import type { Theme } from '$lib/types/theme'

/** 和紙・墨流し */
export const washiInkTheme: Theme = {
  name: '和紙・墨流し',
  id: 'washi-ink',
  colors: {
    bg: [0.95, 0.93, 0.88, 1.0],       // 温かいベージュ
    alive: [0.1, 0.08, 0.05, 1.0],      // 濃い墨色
    decay: [0.4, 0.35, 0.3, 0.5],       // 薄墨
    highlight: [0.7, 0.15, 0.1, 1.0],   // 朱色
  },
}

/** ターミナル・グリッチ */
export const terminalGlitchTheme: Theme = {
  name: 'ターミナル',
  id: 'terminal-glitch',
  colors: {
    bg: [0.04, 0.04, 0.04, 1.0],        // ほぼ黒
    alive: [0.3, 0.9, 0.4, 1.0],        // 緑 (Matrix風)
    decay: [0.2, 0.5, 0.3, 0.6],        // くすんだ緑
    highlight: [1.0, 0.9, 0.2, 1.0],    // 黄色
  },
}

/** ミニマル・タイポグラフィ */
export const minimalTypoTheme: Theme = {
  name: 'ミニマル',
  id: 'minimal-typo',
  colors: {
    bg: [0.98, 0.98, 0.97, 1.0],        // オフホワイト
    alive: [0.12, 0.12, 0.12, 1.0],     // ダークグレー
    decay: [0.5, 0.5, 0.5, 0.4],        // ライトグレー
    highlight: [0.0, 0.45, 0.85, 1.0],  // ブルー
  },
}

export const allThemes: Theme[] = [terminalGlitchTheme, washiInkTheme, minimalTypoTheme]

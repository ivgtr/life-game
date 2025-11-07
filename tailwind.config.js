/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{svelte,js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        // シーンプリセット用のカラーパレット
        forest: {
          bg: '#0a1f0a',
          dead: '#1a3a1a',
          alive: '#4ade80',
          fade: '#22c55e',
        },
        ocean: {
          bg: '#0a1a2f',
          dead: '#1a2a4f',
          alive: '#60a5fa',
          fade: '#3b82f6',
        },
        nebula: {
          bg: '#1a0a2f',
          dead: '#2a1a4f',
          alive: '#e879f9',
          fade: '#c026d3',
        },
        cityLights: {
          bg: '#0f0f0f',
          dead: '#1f1f1f',
          alive: '#fbbf24',
          fade: '#f59e0b',
        },
        desert: {
          bg: '#2f1a0a',
          dead: '#4f2a1a',
          alive: '#fbbf24',
          fade: '#f59e0b',
        },
      },
    },
  },
  plugins: [],
}

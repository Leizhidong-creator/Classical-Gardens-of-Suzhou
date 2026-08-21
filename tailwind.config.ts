import type { Config } from 'tailwindcss'

export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        'tian-shui-bi': '#8bb7a2',
        'yuan-shan-dai': '#51586a',
        'yun-wu': '#d8ddd9',
        'mo-qing': '#1f252d',
      },
      fontFamily: {
        sans: ['"Noto Serif SC"', '"Source Han Serif SC"', 'serif'],
      },
      boxShadow: {
        'mist-panel': '0 24px 60px rgba(31, 37, 45, 0.15)',
      },
    },
  },
  plugins: [],
} satisfies Config

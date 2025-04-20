import presetMini from '@unocss/preset-mini'
import { defineConfig } from 'unocss'

export default defineConfig({
  presets: [
    presetMini({
      dark: {
        dark: '.vscode-dark',
      },
    }),
  ],
})

import path from 'node:path'
import { fileURLToPath } from 'node:url'
import vscode from '@tomjs/vite-plugin-vscode'
import vue from '@vitejs/plugin-vue'
import { defineConfig } from 'vite'
import vueDevTools from 'vite-plugin-vue-devtools'

// https://vitejs.dev/config/
export default defineConfig(async () => {
  const { default: unocss } = await import('unocss/vite')
  return {
    plugins: [
      vue(),
      vueDevTools(),
      unocss(),
      vscode(),
    ],
    resolve: {
      alias: {
        '@': fileURLToPath(new URL('./src', import.meta.url)),
      },
    },
    build: {
      // 使用条件配置
      rollupOptions: {
        // 为不同的入口点配置不同的外部依赖
        external: (id) => {
        // VSCode相关模块作为外部依赖
          if (id === 'vscode' || id.includes('reactive-vscode'))
            return true
          // 标准Node.js模块作为外部依赖
          if (id.startsWith('node:'))
            return true
          return false
        },
      },
    },
  }
})

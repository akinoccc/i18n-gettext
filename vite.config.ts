import path from 'node:path'
import { fileURLToPath } from 'node:url'
import vscode from '@tomjs/vite-plugin-vscode'
import vue from '@vitejs/plugin-vue'
import { defineConfig } from 'vite'
import vueDevTools from 'vite-plugin-vue-devtools'

// https://vitejs.dev/config/
export default defineConfig(async () => {
  const { default: tailwindcss } = await import('@tailwindcss/vite')
  return {
    plugins: [
      vue(),
      vueDevTools(),
      tailwindcss(),
      vscode({
        webview: {
          csp: '<meta http-equiv="Content-Security-Policy" />',
        },
        extension: {
        // 将extension部分配置为CJS格式
          format: 'cjs',
        },
      }),
    ],
    resolve: {
      alias: {
        '@': fileURLToPath(new URL('./src', import.meta.url)),
      },
    },
    build: {
    // 将webview和extension分开构建
      outDir: 'dist',
      // 使用条件配置
      rollupOptions: {
        input: {
        // 为webview UI添加HTML入口点
          webview: path.resolve(__dirname, 'index.html'),
          // extension入口（CJS格式 - 通过vscode插件配置）
          extension: path.resolve(__dirname, 'extension/index.ts'),
        },
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
        output: {
        // 为不同入口生成不同格式
          preserveModules: false,
          entryFileNames: (chunkInfo) => {
          // extension部分使用CJS格式
            if (chunkInfo.name === 'extension')
              return 'extension/index.js'
            // webview部分使用ESM格式
            return 'webview/[name].[format].js'
          },
          chunkFileNames: (chunkInfo) => {
          // 根据入口点确定格式和路径
            const prefix = chunkInfo.facadeModuleId?.includes('extension')
              ? 'extension'
              : 'webview'
            return `${prefix}/chunks/[name].[hash].js`
          },
          assetFileNames: 'webview/assets/[name].[ext]',
        },
      },
    },
  }
})

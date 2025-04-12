import path from 'node:path'
import { fileURLToPath } from 'node:url'
import vscode from '@tomjs/vite-plugin-vscode'
import vue from '@vitejs/plugin-vue'
import { defineConfig } from 'vite'
import vueDevTools from 'vite-plugin-vue-devtools'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    vue(),
    vueDevTools(),
    vscode({
      webview: {
        // csp: '<meta http-equiv="Content-Security-Policy" />',
      },
    }),
  ],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
  build: {
    rollupOptions: {
      // https://cn.vitejs.dev/guide/build.html#multi-page-app
      input: [path.resolve(__dirname, 'index.html')],
      // You can also customize the name
      // input:{
      //   'index': path.resolve(__dirname, 'index.html'),
      //   'index2': path.resolve(__dirname, 'index2.html'),
      // }
    },
  },
})

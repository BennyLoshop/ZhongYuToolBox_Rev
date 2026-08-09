import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import { fileURLToPath, URL } from 'node:url'

export default defineConfig({
  plugins: [vue()],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url))
    }
  },
  server: {
    port: 5173,
    host: true
  },
  // pdfjs-dist v4 是纯 ESM，且主包与 worker 必须共享同一份模块实例
  // （否则私有 # 字段不互通，报 "Cannot read from private field"）。
  // 因此将 pdfjs-dist 排除出依赖预构建，让主包与 worker 都从原始 .mjs 加载。
  optimizeDeps: {
    exclude: ['pdfjs-dist']
  },
  worker: {
    format: 'es'
  }
})

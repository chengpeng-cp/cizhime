import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import path from 'path'

export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    port: 3000,
    proxy: {
      '/api': {
        // todo: 修改代理目标地址为你的后端服务地址
        target: 'http://localhost:8888',
        changeOrigin: true,
        // AI 生成接口耗时较长，代理超时需大于后端处理时间（api.yaml Timeout）
        timeout: 180000,
        proxyTimeout: 180000,
      },
    },
  },
  build: {
    chunkSizeWarningLimit: 500,
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom', 'react-router-dom'],
          utils: ['axios', 'dayjs'],
        },
      },
    },
  },
})

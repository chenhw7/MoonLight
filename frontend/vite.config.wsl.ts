import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

/**
 * WSL 专用 Vite 配置
 * 
 * 使用方式：在 WSL 中运行
 * VITE_CONFIG=vite.config.wsl.ts npm run dev
 */
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  const backendUrl = env.BACKEND_URL || 'http://localhost:8000'

  return {
    plugins: [react()],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, './src'),
      },
    },
    server: {
      port: 3000,
      host: '0.0.0.0', // 监听所有地址，允许 Windows 访问
      strictPort: false,
      hmr: {
        overlay: true,
        // 使用轮询检测文件变化（WSL 访问 Windows 文件系统必需）
        host: 'localhost', // HMR WebSocket 地址
      },
      // ⚠️ 关键配置：启用轮询以支持 WSL 文件监听
      watch: {
        usePolling: true, // 启用轮询
        interval: 1000,   // 每秒检查一次
        ignored: ['**/node_modules/**', '**/.git/**'],
      },
      proxy: {
        '/api': {
          target: backendUrl,
          changeOrigin: true,
          timeout: 10000,
        },
      },
    },
    optimizeDeps: {
      include: ['react', 'react-dom', 'react-router-dom'],
    },
  }
})

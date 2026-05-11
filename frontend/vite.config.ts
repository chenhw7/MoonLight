import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig(({ mode }) => {
  // 加载所有环境变量（包括非 VITE_ 前缀的）
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
      host: true, // 监听所有地址
      strictPort: false,
      // 优化开发服务器性能
      hmr: {
        overlay: true, // 显示错误遮罩
      },
      // 文件监听配置
      watch: {
        // 如果在 WSL 中运行且访问 Windows 文件，取消下面的注释
        usePolling: true,
        interval: 1000,
      },
      proxy: {
        '/api': {
          target: backendUrl,
          changeOrigin: true,
          // 增加超时和重试配置
          timeout: 10000,
        },
      },
    },
    // 优化构建性能
    optimizeDeps: {
      include: ['react', 'react-dom', 'react-router-dom'],
    },
  }
})

import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    strictPort: true, // 如果端口被占用则报错而不是自动切换端口
    host: true // 允许外部访问
  },
  optimizeDeps: {
    exclude: ['lucide-react'],
  },
});

import react from '@vitejs/plugin-react'
import { defineConfig, loadEnv } from 'vite'

// Konfigurasi Vite dengan proxy CORS untuk development ke backend FastAPI (port 8000)
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, '.', '')
  const backendTarget = env.VITE_BACKEND_ORIGIN || 'http://localhost:8000'

  return {
    plugins: [react()],
    server: {
      port: 5173,
      proxy: {
        '/api': {
          target: backendTarget,
          changeOrigin: true,
          secure: false,
        },
      },
    },
  }
})

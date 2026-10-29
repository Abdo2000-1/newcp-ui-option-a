import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { fileURLToPath, URL } from 'node:url'

const isGithubPages = process.env.GITHUB_PAGES === 'true' || process.env.CI === 'true'

const apiTarget =
  process.env.VITE_API_BASE_URL && !process.env.VITE_API_BASE_URL.includes('localhost:3000')
    ? process.env.VITE_API_BASE_URL
    : 'http://10.20.25.147:3001'

export default defineConfig({
  envPrefix: ['VITE_', 'GOOGLE_'],
  base: isGithubPages ? '/newcp-ui-option-a/' : '/',
  server: {
    port: 3000,
    proxy: {
      '/api': {
        target: apiTarget,
        changeOrigin: true,
      },
      '/health': {
        target: apiTarget,
        changeOrigin: true,
      },
      '/docs': {
        target: apiTarget,
        changeOrigin: true,
      },
    },
  },
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./src/test/setup.ts'],
    include: ['src/**/*.{test,spec}.{ts,tsx}'],
  },
})

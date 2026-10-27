import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { fileURLToPath, URL } from 'node:url'

const isGithubPages = process.env.GITHUB_PAGES === 'true' || process.env.CI === 'true'
// Sentry source-map upload support (hidden creates .map files without exposing URL comments in production browser assets)
const enableSourceMaps = process.env.VITE_SENTRY_SOURCE_MAPS === 'true' || process.env.SOURCE_MAP === 'true'

export default defineConfig({
  base: isGithubPages ? '/newcp-ui-option-a/' : '/',
  server: {
    port: 5173,
    proxy: {
      '/api': {
        target: 'http://localhost:3000',
        changeOrigin: true,
      },
    },
  },
  build: {
    sourcemap: enableSourceMaps ? 'hidden' : false,
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
    testTimeout: 15000,
  },
})

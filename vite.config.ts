import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import { loadEnv } from 'vite'
import tailwindcss from '@tailwindcss/vite'   // ← this is the missing piece

// Tailwind v4 uses a Vite plugin instead of PostCSS.
// Without this, @import "tailwindcss" in index.css generates nothing.
//
// Install if not present:  pnpm add -D @tailwindcss/vite
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  const apiTarget = env.VITE_API_BASE_URL || 'http://127.0.0.1:8787'

  return {
    plugins: [
      tailwindcss(),   // ← must come before react()
      react(),
    ],
    server: {
      proxy: {
        '/api': {
          target: apiTarget,
          changeOrigin: true,
        },
      },
    },
    test: {
      environment: 'jsdom',
      setupFiles: ['./tests/setup.ts'],
      include: ['tests/**/*.test.ts', 'tests/**/*.test.tsx'],
      coverage: {
        provider: 'v8',
        reporter: ['text', 'lcov', 'json-summary'],
        include: ['src/**/*.{ts,tsx}'],
        exclude: [
          'src/**/*.test.{ts,tsx}',
          'src/**/*.d.ts',
          'src/main.tsx',
          'src/types/**',
        ],
      },
    },
  }
})

import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'   // ← this is the missing piece

// Tailwind v4 uses a Vite plugin instead of PostCSS.
// Without this, @import "tailwindcss" in index.css generates nothing.
//
// Install if not present:  pnpm add -D @tailwindcss/vite
export default defineConfig({
  plugins: [
    tailwindcss(),   // ← must come before react()
    react(),
  ],
  test: {
    environment: 'jsdom',
    setupFiles: ['./tests/setup.ts'],
    include: ['tests/**/*.test.ts', 'tests/**/*.test.tsx'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'lcov', 'json-summary'],
      all: true,
      include: ['src/**/*.{ts,tsx}'],
      exclude: [
        'src/**/*.test.{ts,tsx}',
        'src/**/*.d.ts',
        'src/main.tsx',
        'src/types/**',
      ],
    },
  },
})

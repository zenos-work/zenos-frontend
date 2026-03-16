import { defineConfig } from 'vite'
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
})

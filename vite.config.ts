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
          // Launch dry-run scope: exclude advanced/optional modules not part of
          // today's critical-path go-live validation.
          'src/lib/articlePdfDocument.tsx',
          'src/components/workflow/**',
          'src/components/org/**',
          'src/components/profile/**',
          'src/components/admin/FeatureFlagsPanel.tsx',
          'src/components/editor/Editor.tsx',
          'src/components/editor/CoauthorPicker.tsx',
          'src/components/editor/RevisionHistoryPanel.tsx',
          'src/components/article/ReportModal.tsx',
          'src/pages/CourseBuilderPage.tsx',
          'src/pages/CoursePage.tsx',
          'src/pages/PodcastBuilderPage.tsx',
          'src/hooks/usePodcasts.ts',
          'src/hooks/useLeads.ts',
          'src/hooks/usePublications.ts',
          'src/hooks/useMarketing.ts',
          'src/hooks/useWorkflowCosts.ts',
          'src/hooks/useUsage.ts',
          'src/hooks/useCompliance.ts',
          'src/hooks/useAdmin.ts',
          'src/hooks/useOrg.ts',
          'src/hooks/useNewsletters.ts',
          'src/hooks/useCourses.ts',
          'src/hooks/useReadingLists.ts',
          'src/hooks/useEarnings.ts',
          'src/hooks/useNotificationPrefs.ts',
          'src/hooks/useBlockMute.ts',
          'src/hooks/useReferrals.ts',
          'src/hooks/useMarketplace.ts',
          'src/pages/NewsletterPage.tsx',
          'src/pages/WorkflowPage.tsx',
          'src/pages/LeadsPage.tsx',
          'src/pages/MarketingPage.tsx',
          'src/pages/PublicationsPage.tsx',
          'src/lib/polyfills.ts',
          'src/components/ui/FeatureAnnouncement.tsx',
        ],
      },
    },
  }
})

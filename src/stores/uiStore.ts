import { create } from 'zustand'

const THEME_STORAGE_KEY = 'zenos_theme'

interface Toast {
  id:      string
  type:    'success' | 'error' | 'info' | 'warning'
  message: string
}

interface UiState {
  sidebarOpen:   boolean
  theme:         'light' | 'dark'
  toasts:        Toast[]
  toggleSidebar: () => void
  setSidebar:    (open: boolean) => void
  setTheme:      (t: 'light' | 'dark') => void
  toggleTheme:   () => void
  addToast:      (toast: Omit<Toast, 'id'>) => void
  removeToast:   (id: string) => void
  toast:         (message: string, type?: Toast['type']) => void
}

/** Apply theme class to <html> — called on init and every theme change */
function applyTheme(theme: 'light' | 'dark') {
  if (typeof document === 'undefined') return
  const html = document.documentElement
  html.classList.remove('light', 'dark')
  html.classList.add(theme)
}

function getInitialTheme(): 'light' | 'dark' {
  if (typeof window === 'undefined') return 'light'

  try {
    const stored = window.localStorage.getItem(THEME_STORAGE_KEY)
    if (stored === 'light' || stored === 'dark') return stored
  } catch {
    // Ignore storage access failures.
  }

  return window.matchMedia?.('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
}

const initialTheme = getInitialTheme()

applyTheme(initialTheme)

export const useUiStore = create<UiState>((set) => ({
  sidebarOpen: true,
  theme:       initialTheme,
  toasts:      [],

  toggleSidebar: () => set(s => ({ sidebarOpen: !s.sidebarOpen })),
  setSidebar:    (open) => set({ sidebarOpen: open }),

  setTheme: (theme) => {
    applyTheme(theme)
    try {
      window.localStorage.setItem(THEME_STORAGE_KEY, theme)
    } catch {
      // Ignore storage access failures.
    }
    set({ theme })
  },

  toggleTheme: () => set(s => {
    const next = s.theme === 'light' ? 'dark' : 'light'
    applyTheme(next)
    try {
      window.localStorage.setItem(THEME_STORAGE_KEY, next)
    } catch {
      // Ignore storage access failures.
    }
    return { theme: next }
  }),

  addToast: (toast) => set(s => ({
    toasts: [...s.toasts, { ...toast, id: crypto.randomUUID() }],
  })),

  removeToast: (id) => set(s => ({
    toasts: s.toasts.filter(t => t.id !== id),
  })),

  toast: (message, type = 'info') => set(s => ({
    toasts: [...s.toasts, { id: crypto.randomUUID(), type, message }],
  })),
}))

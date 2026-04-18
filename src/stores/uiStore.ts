import { create } from 'zustand'

const THEME_STORAGE_KEY = 'zenos_theme'

type ThemeMode = 'light' | 'dark'
type ThemeResolved = 'light' | 'dark'

interface Toast {
  id:      string
  type:    'success' | 'error' | 'info' | 'warning'
  message: string
}

interface UiState {
  sidebarOpen:   boolean
  theme:         ThemeMode
  resolvedTheme: ThemeResolved
  toasts:        Toast[]
  toggleSidebar: () => void
  setSidebar:    (open: boolean) => void
  setTheme:      (t: ThemeMode) => void
  toggleTheme:   () => void
  cycleTheme:    () => void
  addToast:      (toast: Omit<Toast, 'id'>) => void
  removeToast:   (id: string) => void
  toast:         (message: string, type?: Toast['type']) => void
}

/** Apply theme class to <html> — called on init and every theme change */

function resolveTheme(theme: ThemeMode): ThemeResolved {
  return theme
}

function applyTheme(theme: ThemeMode): ThemeResolved {
  if (typeof document === 'undefined') return 'light'
  const html = document.documentElement
  const resolved = resolveTheme(theme)

  html.classList.remove('light', 'dark')
  html.classList.add(resolved)

  return resolved
}

function getInitialTheme(): ThemeMode {
  if (typeof window === 'undefined') return 'light'

  try {
    const stored = window.localStorage.getItem(THEME_STORAGE_KEY)
    if (stored === 'light' || stored === 'dark') return stored
  } catch {
    // Ignore storage access failures.
  }

  return 'light'
}

const initialTheme = getInitialTheme()
const initialResolvedTheme = applyTheme(initialTheme) || 'light'

export const useUiStore = create<UiState>((set) => ({
  sidebarOpen: true,
  theme:       initialTheme,
  resolvedTheme: initialResolvedTheme,
  toasts:      [],

  toggleSidebar: () => set(s => ({ sidebarOpen: !s.sidebarOpen })),
  setSidebar:    (open) => set({ sidebarOpen: open }),

  setTheme: (theme) => {
    const resolvedTheme = applyTheme(theme) || 'light'
    try {
      window.localStorage.setItem(THEME_STORAGE_KEY, theme)
    } catch {
      // Ignore storage access failures.
    }
    set({ theme, resolvedTheme })
  },

  toggleTheme: () => set(s => {
    const next: ThemeMode = s.resolvedTheme === 'light' ? 'dark' : 'light'
    const resolvedTheme = applyTheme(next) || 'light'
    try {
      window.localStorage.setItem(THEME_STORAGE_KEY, next)
    } catch {
      // Ignore storage access failures.
    }
    return { theme: next, resolvedTheme }
  }),

  cycleTheme: () => set((s) => {
    const next: ThemeMode = s.theme === 'light' ? 'dark' : 'light'
    const resolvedTheme = applyTheme(next) || 'light'
    try {
      window.localStorage.setItem(THEME_STORAGE_KEY, next)
    } catch {
      // Ignore storage access failures.
    }
    return { theme: next, resolvedTheme }
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

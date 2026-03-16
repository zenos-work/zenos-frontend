import { create } from 'zustand'

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
  const html = document.documentElement
  html.classList.remove('light', 'dark')
  html.classList.add(theme)
}

// Apply light theme immediately on module load (before React renders)
applyTheme('light')

export const useUiStore = create<UiState>((set) => ({
  sidebarOpen: true,
  theme:       'light',   // ← default LIGHT
  toasts:      [],

  toggleSidebar: () => set(s => ({ sidebarOpen: !s.sidebarOpen })),
  setSidebar:    (open) => set({ sidebarOpen: open }),

  setTheme: (theme) => {
    applyTheme(theme)
    set({ theme })
  },

  toggleTheme: () => set(s => {
    const next = s.theme === 'light' ? 'dark' : 'light'
    applyTheme(next)
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

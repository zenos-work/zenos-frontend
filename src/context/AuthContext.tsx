/**
 * AuthContext.tsx — UPDATED
 *
 * Changes from previous version:
 *  1. User type extended with terms_accepted_at (from PRIVATE scope)
 *  2. refreshUser() method added — called by TermsPage after acceptance
 *     so the router re-evaluates TermsRoute without a full page reload
 */
import { createContext, useState, useEffect } from 'react'
import type { ReactNode } from 'react'
import api from '../lib/api'

// ── Extended User type (add terms_accepted_at) ─────────────────────────────
export interface AuthUser {
  id:                  string
  name:                string
  email:               string
  role:                'SUPERADMIN' | 'APPROVER' | 'AUTHOR' | 'READER'
  avatar_url?:         string
  is_active?:          number
  terms_accepted_at?:  string | null   // ← NEW: null = not yet accepted
  created_at:          string
  updated_at?:         string
}

interface AuthContextValue {
  user:            AuthUser | null
  loading:         boolean
  loginWithGoogle: () => void
  logout:          () => Promise<void>
  refreshUser:     () => Promise<void>   // ← NEW: call after terms accepted
}

const AuthContext = createContext<AuthContextValue | null>(null)
export { AuthContext }

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser]       = useState<AuthUser | null>(null)
  const [loading, setLoading] = useState(true)

  const fetchMe = async () => {
    const token = sessionStorage.getItem('access_token')
    if (!token) { setLoading(false); return }
    try {
      // GET /api/users/me returns PRIVATE scope → includes terms_accepted_at
      const res = await api.get<{ user: AuthUser }>('/api/users/me')
      setUser(res.data.user)
    } catch {
      sessionStorage.removeItem('access_token')
      sessionStorage.removeItem('refresh_token')
      setUser(null)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchMe() }, [])

  // Handle OAuth callback: /auth/google/callback?code=...
  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const code   = params.get('code')
    if (!code || !window.location.pathname.includes('/auth/google/callback')) return

    const exchange = async () => {
      try {
        const res = await api.post<{
          access_token:  string
          refresh_token: string
          user:          AuthUser
        }>('/auth/google/callback', { code })

        sessionStorage.setItem('access_token',  res.data.access_token)
        sessionStorage.setItem('refresh_token', res.data.refresh_token)
        setUser(res.data.user)
        // Remove code from URL
        window.history.replaceState({}, '', '/')
      } catch (err) {
        console.error('OAuth callback failed', err)
        window.location.href = '/login'
      }
    }
    exchange()
  }, [])

  const loginWithGoogle = () => {
    window.location.href = `${import.meta.env.VITE_API_URL}/auth/google/login`
  }

  const logout = async () => {
    const userId = user?.id
    sessionStorage.removeItem('access_token')
    sessionStorage.removeItem('refresh_token')
    setUser(null)
    if (userId) {
      try { await api.post('/auth/logout', { user_id: userId }) } catch {}
    }
  }

  /**
   * refreshUser — called by TermsPage after the user accepts the agreement.
   * Refetches /api/users/me so terms_accepted_at is now populated, which
   * causes TermsRoute to stop redirecting to /terms.
   */
  const refreshUser = async () => {
    await fetchMe()
  }

  return (
    <AuthContext.Provider value={{ user, loading, loginWithGoogle, logout, refreshUser }}>
      {children}
    </AuthContext.Provider>
  )
}

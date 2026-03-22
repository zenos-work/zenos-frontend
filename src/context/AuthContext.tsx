import { createContext, useState, useEffect, useRef } from 'react'
import type { ReactNode } from 'react'
import api from '../lib/api'

export interface AuthUser {
  id:                  string
  name:                string
  email:               string
  role:                'SUPERADMIN' | 'APPROVER' | 'AUTHOR' | 'READER'
  avatar_url?:         string
  is_active?:          number
  terms_accepted_at?:  string | null
  created_at:          string
  updated_at?:         string
}

interface AuthContextValue {
  user:            AuthUser | null
  loading:         boolean
  loginWithGoogle: () => void
  logout:          () => Promise<void>
  refreshUser:     () => Promise<void>
}

const AuthContext = createContext<AuthContextValue | null>(null)
export { AuthContext }

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser]       = useState<AuthUser | null>(null)
  const [loading, setLoading] = useState(true)

  // NEW: Ref to prevent React Strict Mode from double-firing the OAuth exchange
  const exchangeAttempted = useRef(false)

  const fetchMe = async () => {
    console.log('Fetching current user info...')
    console.log('Current URL:', window.location.href)
    console.log('URL Search Params:', window.location.search)
    console.log('URL Pathname:', window.location.pathname)
    if (window.location.search.includes('code=') && window.location.pathname.includes('/auth/google/callback')) {
      return // Let the other useEffect handle the loading state
    }

    const token = sessionStorage.getItem('access_token')
    if (!token) { setLoading(false); return }
    try {
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

    // NEW: Stop the second execution immediately
    if (exchangeAttempted.current) return
    exchangeAttempted.current = true

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

        // NEW: Turn off the loading spinner!
        setLoading(false)

        // Resume the route the user originally attempted before login.
        const postLoginPath = sessionStorage.getItem('post_login_redirect') || '/'
        sessionStorage.removeItem('post_login_redirect')
        window.location.href = postLoginPath
      } catch (err) {
        console.error('OAuth callback failed', err)
        window.location.href = '/login'
      }
    }
    exchange()
  }, [])

  const loginWithGoogle = () => {
    window.location.href = `${import.meta.env.VITE_API_BASE_URL}/auth/google/login`
  }

  const logout = async () => {
    const userId = user?.id
    sessionStorage.removeItem('access_token')
    sessionStorage.removeItem('refresh_token')
    setUser(null)
    if (userId) {
      try { await api.post('/auth/logout', { user_id: userId }) }
      catch {
        console.error('Failed to logout')
      }
    }
  }

  const refreshUser = async () => {
    await fetchMe()
  }

  return (
    <AuthContext.Provider value={{ user, loading, loginWithGoogle, logout, refreshUser }}>
      {children}
    </AuthContext.Provider>
  )
}

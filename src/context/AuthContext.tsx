import { createContext, useState, useEffect, useRef, useCallback } from 'react'
import type { ReactNode } from 'react'
import api from '../lib/api'

const AUTH_API_BASE = (import.meta.env.VITE_API_BASE_URL || '').trim()

export interface AuthUser {
  id:                  string
  name:                string
  email:               string
  role:                'SUPERADMIN' | 'APPROVER' | 'AUTHOR' | 'READER'
  avatar_url?:         string
  is_active?:          number
  terms_accepted_at?:  string | null
  is_new_user?:        boolean
  needs_topic_preferences?: boolean
  created_at:          string
  updated_at?:         string
}

interface AuthContextValue {
  user:            AuthUser | null
  loading:         boolean
  loginWithGoogle: (intent?: 'signin' | 'signup') => void
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

  const safeStorageGet = useCallback((storage: Storage | undefined, key: string): string | null => {
    try {
      if (storage && typeof storage.getItem === 'function') {
        return storage.getItem(key)
      }
    } catch {
      return null
    }
    return null
  }, [])

  const safeStorageSet = useCallback((storage: Storage | undefined, key: string, value: string) => {
    try {
      if (storage && typeof storage.setItem === 'function') {
        storage.setItem(key, value)
      }
    } catch {
      // Ignore storage errors in constrained environments (e.g. tests).
    }
  }, [])

  const safeStorageRemove = useCallback((storage: Storage | undefined, key: string) => {
    try {
      if (storage && typeof storage.removeItem === 'function') {
        storage.removeItem(key)
      }
    } catch {
      // Ignore storage errors in constrained environments (e.g. tests).
    }
  }, [])

  const getStoredToken = useCallback((key: 'access_token' | 'refresh_token') =>
    safeStorageGet(sessionStorage, key) || safeStorageGet(localStorage, key)
  , [safeStorageGet])

  const setStoredToken = useCallback((key: 'access_token' | 'refresh_token', value: string) => {
    safeStorageSet(sessionStorage, key, value)
    safeStorageSet(localStorage, key, value)
  }, [safeStorageSet])

  const clearStoredTokens = useCallback(() => {
    safeStorageRemove(sessionStorage, 'access_token')
    safeStorageRemove(sessionStorage, 'refresh_token')
    safeStorageRemove(localStorage, 'access_token')
    safeStorageRemove(localStorage, 'refresh_token')
  }, [safeStorageRemove])

  const fetchMe = useCallback(async () => {
    console.log('Fetching current user info...')
    console.log('Current URL:', window.location.href)
    console.log('URL Search Params:', window.location.search)
    console.log('URL Pathname:', window.location.pathname)
    if (window.location.search.includes('code=') && window.location.pathname.includes('/auth/google/callback')) {
      return // Let the other useEffect handle the loading state
    }

    const token = getStoredToken('access_token')
    if (!token) { setLoading(false); return }

    // Ensure API interceptor path and auth checks see the token in-session.
    sessionStorage.setItem('access_token', token)
    const refresh = getStoredToken('refresh_token')
    if (refresh) sessionStorage.setItem('refresh_token', refresh)

    try {
      const res = await api.get<{ user: AuthUser }>('/api/users/me')
      setUser(res.data.user)
    } catch {
      clearStoredTokens()
      setUser(null)
    } finally {
      setLoading(false)
    }
  }, [clearStoredTokens, getStoredToken])

  useEffect(() => { fetchMe() }, [fetchMe])

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
        }>(`${AUTH_API_BASE || ''}/auth/google/callback`, {
          code,
          intent: (sessionStorage.getItem('auth_intent') as 'signin' | 'signup' | null) || 'signin',
        })

        setStoredToken('access_token', res.data.access_token)
        setStoredToken('refresh_token', res.data.refresh_token)
        setUser(res.data.user)

        // NEW: Turn off the loading spinner!
        setLoading(false)

        // Resume the route the user originally attempted before login.
        const postLoginPath = sessionStorage.getItem('post_login_redirect') || '/'
        if (res.data.user?.needs_topic_preferences) {
          sessionStorage.setItem('post_onboarding_redirect', postLoginPath)
          window.location.href = '/onboarding/preferences'
          return
        }

        sessionStorage.removeItem('post_login_redirect')
        sessionStorage.removeItem('auth_intent')
        window.location.href = postLoginPath
      } catch (err) {
        console.error('OAuth callback failed', err)
        type ErrorShape = {
          response?: {
            data?: {
              error?: {
                code?: string
              }
            }
          }
        }
        const code = (err as ErrorShape)?.response?.data?.error?.code
        if (code === 'USER_NOT_FOUND') {
          // If user tried sign-in but account doesn't exist in DB,
          // automatically continue through the sign-up flow.
          sessionStorage.setItem('auth_intent', 'signup')
          window.location.href = `${AUTH_API_BASE || ''}/auth/google/login?intent=signup`
          return
        }
        window.location.href = '/login'
      }
    }
    exchange()
  }, [setStoredToken])

  const loginWithGoogle = (intent: 'signin' | 'signup' = 'signin') => {
    sessionStorage.setItem('auth_intent', intent)
    window.location.href = `${AUTH_API_BASE || ''}/auth/google/login?intent=${intent}`
  }

  const logout = async () => {
    const userId = user?.id
    clearStoredTokens()
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

import type { ReactNode } from 'react'
import { renderHook } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { AuthContext } from '../../src/context/AuthContext'
import { useAuth } from '../../src/hooks/useAuth'

describe('useAuth', () => {
  it('returns the auth context value when rendered inside the provider', () => {
    const contextValue = {
      user: null,
      loading: false,
      loginWithGoogle: vi.fn(),
      logout: vi.fn(),
      refreshUser: vi.fn(),
    }

    function Wrapper({ children }: { children: ReactNode }) {
      return <AuthContext.Provider value={contextValue}>{children}</AuthContext.Provider>
    }

    const { result } = renderHook(() => useAuth(), { wrapper: Wrapper })

    expect(result.current).toBe(contextValue)
  })

  it('throws when used outside AuthProvider', () => {
    expect(() => renderHook(() => useAuth())).toThrowError(
      'useAuth must be used inside <AuthProvider>',
    )
  })
})

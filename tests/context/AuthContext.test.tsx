import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { useContext } from 'react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { AuthContext, AuthProvider } from '../../src/context/AuthContext'
import api from '../../src/lib/api'

vi.mock('../../src/lib/api', () => ({
  default: {
    get: vi.fn(),
    post: vi.fn(),
  },
}))

function Consumer() {
  const ctx = useContext(AuthContext)
  if (!ctx) return null
  return (
    <div>
      <span data-testid='loading'>{String(ctx.loading)}</span>
      <span data-testid='user'>{ctx.user?.name ?? 'none'}</span>
      <button onClick={ctx.loginWithGoogle}>Login</button>
      <button onClick={() => void ctx.logout()}>Logout</button>
      <button onClick={() => void ctx.refreshUser()}>Refresh</button>
    </div>
  )
}

describe('AuthContext', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    sessionStorage.clear()
    window.history.pushState({}, '', '/')
  })

  it('stops loading without token', async () => {
    render(
      <AuthProvider>
        <Consumer />
      </AuthProvider>,
    )

    await waitFor(() => {
      expect(screen.getByTestId('loading')).toHaveTextContent('false')
    })
    expect(screen.getByTestId('user')).toHaveTextContent('none')
  })

  it('loads current user when access token exists', async () => {
    sessionStorage.setItem('access_token', 'token')
    vi.mocked(api.get).mockResolvedValue({
      data: { user: { id: 'u1', name: 'Alex', email: 'a@x.com', role: 'AUTHOR', created_at: '2026-01-01' } },
    } as never)

    render(
      <AuthProvider>
        <Consumer />
      </AuthProvider>,
    )

    await waitFor(() => {
      expect(screen.getByTestId('user')).toHaveTextContent('Alex')
    })
  })

  it('logs out and posts to backend when user exists', async () => {
    sessionStorage.setItem('access_token', 'token')
    vi.mocked(api.get).mockResolvedValue({
      data: { user: { id: 'u99', name: 'Alex', email: 'a@x.com', role: 'AUTHOR', created_at: '2026-01-01' } },
    } as never)
    vi.mocked(api.post).mockResolvedValue({ data: {} } as never)

    render(
      <AuthProvider>
        <Consumer />
      </AuthProvider>,
    )

    await waitFor(() => expect(screen.getByTestId('user')).toHaveTextContent('Alex'))

    fireEvent.click(screen.getByRole('button', { name: 'Logout' }))

    await waitFor(() => {
      expect(api.post).toHaveBeenCalledWith('/auth/logout', { user_id: 'u99' })
    })
    expect(sessionStorage.getItem('access_token')).toBeNull()
  })

  it('refreshUser re-fetches /api/users/me', async () => {
    sessionStorage.setItem('access_token', 'token')
    vi.mocked(api.get)
      .mockResolvedValueOnce({ data: { user: { id: 'u1', name: 'Alex', email: 'a@x.com', role: 'AUTHOR', created_at: '2026-01-01' } } } as never)
      .mockResolvedValueOnce({ data: { user: { id: 'u1', name: 'Alex Updated', email: 'a@x.com', role: 'AUTHOR', created_at: '2026-01-01' } } } as never)

    render(
      <AuthProvider>
        <Consumer />
      </AuthProvider>,
    )

    await waitFor(() => expect(screen.getByTestId('user')).toHaveTextContent('Alex'))

    fireEvent.click(screen.getByRole('button', { name: 'Refresh' }))

    await waitFor(() => expect(screen.getByTestId('user')).toHaveTextContent('Alex Updated'))
    expect(api.get).toHaveBeenCalledTimes(2)
  })

  it('clears tokens when /api/users/me fails with an invalid token', async () => {
    sessionStorage.setItem('access_token', 'bad-token')
    sessionStorage.setItem('refresh_token', 'bad-refresh')
    vi.mocked(api.get).mockRejectedValueOnce(new Error('unauthorized'))

    render(
      <AuthProvider>
        <Consumer />
      </AuthProvider>,
    )

    await waitFor(() => {
      expect(screen.getByTestId('loading')).toHaveTextContent('false')
    })
    expect(screen.getByTestId('user')).toHaveTextContent('none')
    expect(sessionStorage.getItem('access_token')).toBeNull()
    expect(sessionStorage.getItem('refresh_token')).toBeNull()
  })

  it('starts Google login flow from loginWithGoogle', async () => {
    render(
      <AuthProvider>
        <Consumer />
      </AuthProvider>,
    )

    expect(() => {
      fireEvent.click(screen.getByRole('button', { name: 'Login' }))
    }).not.toThrow()
  })

  it('exchanges OAuth code and stores tokens', async () => {
    window.history.pushState({}, '', '/auth/google/callback?code=oauth-code')
    sessionStorage.setItem('post_login_redirect', '/write')
    vi.mocked(api.post).mockResolvedValueOnce({
      data: {
        access_token: 'acc',
        refresh_token: 'ref',
        user: { id: 'u7', name: 'Sam', email: 's@x.com', role: 'AUTHOR', created_at: '2026-01-01' },
      },
    } as never)

    render(
      <AuthProvider>
        <Consumer />
      </AuthProvider>,
    )

    await waitFor(() => {
      expect(api.post).toHaveBeenCalledWith('/auth/google/callback', {
        code: 'oauth-code',
        intent: 'signin',
      })
    })
    expect(sessionStorage.getItem('access_token')).toBe('acc')
    expect(sessionStorage.getItem('refresh_token')).toBe('ref')
    expect(sessionStorage.getItem('post_login_redirect')).toBeNull()
    await waitFor(() => {
      expect(screen.getByTestId('loading')).toHaveTextContent('false')
      expect(screen.getByTestId('user')).toHaveTextContent('Sam')
    })
  })

  it('redirects to login when OAuth exchange fails', async () => {
    window.history.pushState({}, '', '/auth/google/callback?code=oauth-code')
    vi.mocked(api.post).mockRejectedValueOnce(new Error('oauth failed'))
    const errSpy = vi.spyOn(console, 'error').mockImplementation(() => {})

    render(
      <AuthProvider>
        <Consumer />
      </AuthProvider>,
    )

    await waitFor(() => {
      expect(api.post).toHaveBeenCalledWith('/auth/google/callback', {
        code: 'oauth-code',
        intent: 'signin',
      })
    })
    expect(errSpy).toHaveBeenCalled()
    errSpy.mockRestore()
  })

  it('redirects to onboarding when callback requires topic preferences', async () => {
    window.history.pushState({}, '', '/auth/google/callback?code=oauth-code')
    sessionStorage.setItem('post_login_redirect', '/write')
    vi.mocked(api.post).mockResolvedValueOnce({
      data: {
        access_token: 'acc',
        refresh_token: 'ref',
        user: {
          id: 'u7',
          name: 'Sam',
          email: 's@x.com',
          role: 'AUTHOR',
          created_at: '2026-01-01',
          needs_topic_preferences: true,
        },
      },
    } as never)

    render(
      <AuthProvider>
        <Consumer />
      </AuthProvider>,
    )

    await waitFor(() => {
      expect(api.post).toHaveBeenCalledWith('/auth/google/callback', {
        code: 'oauth-code',
        intent: 'signin',
      })
    })

    expect(sessionStorage.getItem('post_onboarding_redirect')).toBe('/write')
  })
})

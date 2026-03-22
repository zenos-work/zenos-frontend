import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import LoginPage from '../../src/pages/LoginPage'

const navigateMock = vi.fn()
const useAuthMock = vi.fn()
const useLocationMock = vi.fn()

vi.mock('../../src/hooks/useAuth', () => ({
  useAuth: () => useAuthMock(),
}))

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual<typeof import('react-router-dom')>('react-router-dom')
  return {
    ...actual,
    useNavigate: () => navigateMock,
    useLocation: () => useLocationMock(),
  }
})

describe('LoginPage', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    sessionStorage.clear()
    useLocationMock.mockReturnValue({ state: null })
  })

  it('renders the login CTA and starts Google sign-in', () => {
    const loginWithGoogle = vi.fn()
    useAuthMock.mockReturnValue({
      user: null,
      loginWithGoogle,
    })

    render(<LoginPage />)

    expect(screen.getByText('Welcome back')).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: /continue with google/i }))

    expect(loginWithGoogle).toHaveBeenCalledTimes(1)
  })

  it('stores the intended route before starting Google sign-in', () => {
    const loginWithGoogle = vi.fn()
    useAuthMock.mockReturnValue({
      user: null,
      loginWithGoogle,
    })
    useLocationMock.mockReturnValue({
      state: {
        from: {
          pathname: '/terms',
          search: '',
          hash: '',
        },
      },
    })

    render(<LoginPage />)

    fireEvent.click(screen.getByRole('button', { name: /continue with google/i }))

    expect(sessionStorage.getItem('post_login_redirect')).toBe('/terms')
    expect(loginWithGoogle).toHaveBeenCalledTimes(1)
  })

  it('redirects authenticated users to the home page', async () => {
    useAuthMock.mockReturnValue({
      user: { id: 'user-1' },
      loginWithGoogle: vi.fn(),
    })

    render(<LoginPage />)

    await waitFor(() => {
      expect(navigateMock).toHaveBeenCalledWith('/', { replace: true })
    })
  })

  it('applies and restores Google button hover styles', () => {
    useAuthMock.mockReturnValue({
      user: null,
      loginWithGoogle: vi.fn(),
    })

    render(<LoginPage />)

    const button = screen.getByRole('button', { name: /continue with google/i })

    fireEvent.mouseEnter(button)
    expect(button).toHaveStyle({ backgroundColor: 'rgb(245, 245, 245)' })

    fireEvent.mouseLeave(button)
    expect(button).toHaveStyle({ backgroundColor: 'rgb(255, 255, 255)' })
  })
})

import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import Topbar from '../../../src/components/layout/Topbar'

const navigateMock = vi.fn()
const useAuthMock = vi.fn()
const useUiStoreMock = vi.fn()

vi.mock('../../../src/hooks/useAuth', () => ({
  useAuth: () => useAuthMock(),
}))

vi.mock('../../../src/stores/uiStore', () => ({
  useUiStore: () => useUiStoreMock(),
}))

vi.mock('../../../src/components/ui/Avatar', () => ({
  default: ({ name }: { name: string }) => <div data-testid='avatar'>{name}</div>,
}))

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual<typeof import('react-router-dom')>('react-router-dom')
  return {
    ...actual,
    useNavigate: () => navigateMock,
  }
})

describe('Topbar', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders sign in state, performs search, and toggles theme', () => {
    useAuthMock.mockReturnValue({ user: null, logout: vi.fn() })
    const toggleTheme = vi.fn()
    useUiStoreMock.mockReturnValue({ toggleTheme, theme: 'light' })

    render(<Topbar />)

    fireEvent.change(screen.getByPlaceholderText('Search articles…'), { target: { value: 'fintech ai' } })
    fireEvent.submit(screen.getByRole('textbox').closest('form')!)

    expect(navigateMock).toHaveBeenCalledWith('/search?q=fintech%20ai')

    fireEvent.click(screen.getByTitle('Switch to dark theme'))
    expect(toggleTheme).toHaveBeenCalledTimes(1)

    fireEvent.click(screen.getByRole('button', { name: /sign in/i }))
    expect(navigateMock).toHaveBeenCalledWith('/login')
  })

  it('renders user menu, shows admin link, and signs out', async () => {
    const logout = vi.fn()
    useAuthMock.mockReturnValue({
      user: {
        name: 'Admin User',
        email: 'admin@zenos.work',
        role: 'SUPERADMIN',
        avatar_url: null,
      },
      logout,
    })
    useUiStoreMock.mockReturnValue({ toggleTheme: vi.fn(), theme: 'dark' })

    render(<Topbar />)

    fireEvent.click(screen.getByText('Admin User').closest('button')!)

    expect(screen.getByText('Profile')).toBeInTheDocument()
    expect(screen.getByText('Library')).toBeInTheDocument()
    expect(screen.getByText('Stats')).toBeInTheDocument()
    expect(screen.getByText('Admin')).toBeInTheDocument()

    fireEvent.click(screen.getByText('Admin'))
    expect(navigateMock).toHaveBeenCalledWith('/admin')

    fireEvent.click(screen.getByText('Admin User').closest('button')!)
    fireEvent.click(screen.getByText('Sign out'))

    await waitFor(() => {
      expect(logout).toHaveBeenCalledTimes(1)
    })
  })
})

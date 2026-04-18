import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import Topbar from '../../../src/components/layout/Topbar'

const navigateMock = vi.fn()
const useAuthMock = vi.fn()
const useUiStoreMock = vi.fn()
const useNotificationsMock = vi.fn()

vi.mock('../../../src/hooks/useAuth', () => ({
  useAuth: () => useAuthMock(),
}))

vi.mock('../../../src/stores/uiStore', () => ({
  useUiStore: () => useUiStoreMock(),
}))

vi.mock('../../../src/hooks/useAdmin', () => ({
  useNotifications: () => useNotificationsMock(),
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
  function renderTopbar() {
    return render(
      <MemoryRouter>
        <Topbar />
      </MemoryRouter>,
    )
  }

  beforeEach(() => {
    vi.clearAllMocks()
    useNotificationsMock.mockReturnValue({ data: { notifications: [] } })
  })

  it('renders sign in state, performs search, and toggles theme', () => {
    useAuthMock.mockReturnValue({ user: null, logout: vi.fn() })
    const setTheme = vi.fn()
    useUiStoreMock.mockReturnValue({ setTheme, theme: 'light', resolvedTheme: 'light' })

    renderTopbar()

    fireEvent.change(screen.getByPlaceholderText('Search articles…'), { target: { value: 'fintech ai' } })
    fireEvent.submit(screen.getByRole('textbox').closest('form')!)

    expect(navigateMock).toHaveBeenCalledWith('/search?q=fintech%20ai')

    fireEvent.click(screen.getByRole('button', { name: /toggle theme/i }))
    expect(setTheme).toHaveBeenCalledWith('dark')

    fireEvent.click(screen.getByRole('button', { name: /sign in/i }))
    expect(navigateMock).toHaveBeenCalledWith('/login')
  })

  it('renders user menu, shows admin link, and signs out', async () => {
    const logout = vi.fn().mockResolvedValue(undefined)
    useAuthMock.mockReturnValue({
      user: {
        name: 'Admin User',
        email: 'admin@zenos.work',
        role: 'SUPERADMIN',
        avatar_url: null,
      },
      logout,
    })
    useUiStoreMock.mockReturnValue({ setTheme: vi.fn(), theme: 'dark', resolvedTheme: 'dark' })

    renderTopbar()

    fireEvent.click(screen.getByTitle('Notifications'))
    expect(navigateMock).toHaveBeenCalledWith('/notifications')

    fireEvent.click(screen.getByText('Admin User').closest('button')!)

    expect(screen.getByText('Settings')).toBeInTheDocument()
    expect(screen.getByText('Writer onboarding')).toBeInTheDocument()

    fireEvent.click(screen.getByText('Settings'))
    expect(navigateMock).toHaveBeenCalledWith('/settings')

    fireEvent.click(screen.getByText('Admin User').closest('button')!)
    fireEvent.click(screen.getByText('Sign out'))

    await waitFor(() => {
      expect(logout).toHaveBeenCalledTimes(1)
      expect(navigateMock).toHaveBeenCalledWith('/', { replace: true })
    })
  })
})

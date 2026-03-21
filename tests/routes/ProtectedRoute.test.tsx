import { render, screen } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import ProtectedRoute from '../../src/routes/ProtectedRoute'

const useAuthMock = vi.fn()

vi.mock('../../src/hooks/useAuth', () => ({
  useAuth: () => useAuthMock(),
}))

vi.mock('../../src/components/ui/Spinner', () => ({
  default: () => <div data-testid='spinner'>Loading</div>,
}))

describe('ProtectedRoute', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('shows spinner while auth is loading', () => {
    useAuthMock.mockReturnValue({ user: null, loading: true })

    render(
      <MemoryRouter initialEntries={['/private']}>
        <Routes>
          <Route element={<ProtectedRoute />}>
            <Route path='/private' element={<div>Private Content</div>} />
          </Route>
        </Routes>
      </MemoryRouter>,
    )

    expect(screen.getByTestId('spinner')).toBeInTheDocument()
    expect(screen.queryByText('Private Content')).not.toBeInTheDocument()
  })

  it('redirects unauthenticated users to login', () => {
    useAuthMock.mockReturnValue({ user: null, loading: false })

    render(
      <MemoryRouter initialEntries={['/private']}>
        <Routes>
          <Route element={<ProtectedRoute />}>
            <Route path='/private' element={<div>Private Content</div>} />
          </Route>
          <Route path='/login' element={<div>Login Page</div>} />
        </Routes>
      </MemoryRouter>,
    )

    expect(screen.getByText('Login Page')).toBeInTheDocument()
    expect(screen.queryByText('Private Content')).not.toBeInTheDocument()
  })

  it('renders outlet when user is authenticated', () => {
    useAuthMock.mockReturnValue({ user: { id: 'u1', role: 'AUTHOR' }, loading: false })

    render(
      <MemoryRouter initialEntries={['/private']}>
        <Routes>
          <Route element={<ProtectedRoute />}>
            <Route path='/private' element={<div>Private Content</div>} />
          </Route>
        </Routes>
      </MemoryRouter>,
    )

    expect(screen.getByText('Private Content')).toBeInTheDocument()
  })
})

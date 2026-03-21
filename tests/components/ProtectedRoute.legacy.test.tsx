import { render, screen } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import ProtectedRoute from '../../src/components/ProtectedRoute'

const useAuthMock = vi.fn()

vi.mock('../../src/hooks/useAuth', () => ({
  useAuth: () => useAuthMock(),
}))

describe('components/ProtectedRoute', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('shows loading state while auth resolves', () => {
    useAuthMock.mockReturnValue({ user: null, loading: true })

    render(
      <MemoryRouter initialEntries={['/private']}>
        <ProtectedRoute>
          <div>Private Area</div>
        </ProtectedRoute>
      </MemoryRouter>,
    )

    expect(screen.getByText('Loading...')).toBeInTheDocument()
  })

  it('redirects unauthenticated user to /login', () => {
    useAuthMock.mockReturnValue({ user: null, loading: false })

    render(
      <MemoryRouter initialEntries={['/private']}>
        <Routes>
          <Route
            path='/private'
            element={<ProtectedRoute><div>Private Area</div></ProtectedRoute>}
          />
          <Route path='/login' element={<div>Login Route</div>} />
        </Routes>
      </MemoryRouter>,
    )

    expect(screen.getByText('Login Route')).toBeInTheDocument()
  })

  it('enforces role restrictions when roles prop is supplied', () => {
    useAuthMock.mockReturnValue({ user: { id: 'u1', role: 'AUTHOR' }, loading: false })

    render(
      <MemoryRouter initialEntries={['/private']}>
        <Routes>
          <Route
            path='/private'
            element={<ProtectedRoute roles={['SUPERADMIN']}><div>Private Area</div></ProtectedRoute>}
          />
          <Route path='/' element={<div>Home Route</div>} />
        </Routes>
      </MemoryRouter>,
    )

    expect(screen.getByText('Home Route')).toBeInTheDocument()
  })

  it('renders children for authorized user', () => {
    useAuthMock.mockReturnValue({ user: { id: 'u1', role: 'SUPERADMIN' }, loading: false })

    render(
      <MemoryRouter>
        <ProtectedRoute roles={['SUPERADMIN']}>
          <div>Private Area</div>
        </ProtectedRoute>
      </MemoryRouter>,
    )

    expect(screen.getByText('Private Area')).toBeInTheDocument()
  })
})

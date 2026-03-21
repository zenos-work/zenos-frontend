import { render, screen } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import AdminRoute from '../../src/routes/AdminRoute'

const useAuthMock = vi.fn()

vi.mock('../../src/hooks/useAuth', () => ({
  useAuth: () => useAuthMock(),
}))

describe('AdminRoute', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('returns nothing while auth is loading', () => {
    useAuthMock.mockReturnValue({ user: null, loading: true })

    const { container } = render(
      <MemoryRouter initialEntries={['/admin']}>
        <Routes>
          <Route element={<AdminRoute />}>
            <Route path='/admin' element={<div>Admin Content</div>} />
          </Route>
        </Routes>
      </MemoryRouter>,
    )

    expect(container).toBeEmptyDOMElement()
  })

  it('redirects non-admin users to home', () => {
    useAuthMock.mockReturnValue({ user: { id: 'u1', role: 'AUTHOR' }, loading: false })

    render(
      <MemoryRouter initialEntries={['/admin']}>
        <Routes>
          <Route element={<AdminRoute />}>
            <Route path='/admin' element={<div>Admin Content</div>} />
          </Route>
          <Route path='/' element={<div>Home Page</div>} />
        </Routes>
      </MemoryRouter>,
    )

    expect(screen.getByText('Home Page')).toBeInTheDocument()
    expect(screen.queryByText('Admin Content')).not.toBeInTheDocument()
  })

  it('allows SUPERADMIN role', () => {
    useAuthMock.mockReturnValue({ user: { id: 'u1', role: 'SUPERADMIN' }, loading: false })

    render(
      <MemoryRouter initialEntries={['/admin']}>
        <Routes>
          <Route element={<AdminRoute />}>
            <Route path='/admin' element={<div>Admin Content</div>} />
          </Route>
        </Routes>
      </MemoryRouter>,
    )

    expect(screen.getByText('Admin Content')).toBeInTheDocument()
  })

  it('allows APPROVER role', () => {
    useAuthMock.mockReturnValue({ user: { id: 'u1', role: 'APPROVER' }, loading: false })

    render(
      <MemoryRouter initialEntries={['/admin']}>
        <Routes>
          <Route element={<AdminRoute />}>
            <Route path='/admin' element={<div>Admin Content</div>} />
          </Route>
        </Routes>
      </MemoryRouter>,
    )

    expect(screen.getByText('Admin Content')).toBeInTheDocument()
  })
})

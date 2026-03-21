import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { describe, expect, it, vi } from 'vitest'
import MobileNav from '../../../src/components/layout/MobileNav'

const useAuthMock = vi.fn()

vi.mock('../../../src/hooks/useAuth', () => ({
  useAuth: () => useAuthMock(),
}))

describe('MobileNav', () => {
  it('shows base navigation for unauthenticated users', () => {
    useAuthMock.mockReturnValue({ user: null })

    render(
      <MemoryRouter>
        <MobileNav />
      </MemoryRouter>,
    )

    expect(screen.getByText('Home').closest('a')).toHaveAttribute('href', '/')
    expect(screen.queryByText('Write')).not.toBeInTheDocument()
    expect(screen.queryByText('Admin')).not.toBeInTheDocument()
  })

  it('shows write and admin items for APPROVER role', () => {
    useAuthMock.mockReturnValue({ user: { id: 'u1', role: 'APPROVER' } })

    render(
      <MemoryRouter>
        <MobileNav />
      </MemoryRouter>,
    )

    expect(screen.getByText('Write').closest('a')).toHaveAttribute('href', '/write')
    expect(screen.getByText('Admin').closest('a')).toHaveAttribute('href', '/admin')
  })
})

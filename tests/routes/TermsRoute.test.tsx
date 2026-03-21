import { render, screen } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import TermsRoute from '../../src/routes/TermsRoute'

const useAuthMock = vi.fn()

vi.mock('../../src/hooks/useAuth', () => ({
  useAuth: () => useAuthMock(),
}))

describe('TermsRoute', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('returns nothing while auth is loading', () => {
    useAuthMock.mockReturnValue({ user: null, loading: true })

    const { container } = render(
      <MemoryRouter initialEntries={['/write']}>
        <Routes>
          <Route element={<TermsRoute />}>
            <Route path='/write' element={<div>Write Page</div>} />
          </Route>
        </Routes>
      </MemoryRouter>,
    )

    expect(container).toBeEmptyDOMElement()
  })

  it('redirects authenticated users without terms acceptance to /terms', () => {
    useAuthMock.mockReturnValue({
      user: { id: 'u1', role: 'AUTHOR', terms_accepted_at: null },
      loading: false,
    })

    render(
      <MemoryRouter initialEntries={['/write']}>
        <Routes>
          <Route element={<TermsRoute />}>
            <Route path='/write' element={<div>Write Page</div>} />
          </Route>
          <Route path='/terms' element={<div>Terms Page</div>} />
        </Routes>
      </MemoryRouter>,
    )

    expect(screen.getByText('Terms Page')).toBeInTheDocument()
    expect(screen.queryByText('Write Page')).not.toBeInTheDocument()
  })

  it('renders outlet when terms are already accepted', () => {
    useAuthMock.mockReturnValue({
      user: { id: 'u1', role: 'AUTHOR', terms_accepted_at: '2026-03-21T00:00:00Z' },
      loading: false,
    })

    render(
      <MemoryRouter initialEntries={['/write']}>
        <Routes>
          <Route element={<TermsRoute />}>
            <Route path='/write' element={<div>Write Page</div>} />
          </Route>
        </Routes>
      </MemoryRouter>,
    )

    expect(screen.getByText('Write Page')).toBeInTheDocument()
  })
})

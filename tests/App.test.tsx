import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import App from '../src/App'

const useAuthMock = vi.fn()

vi.mock('../src/hooks/useAuth', () => ({
  useAuth: () => useAuthMock(),
}))

vi.mock('../src/components/layout/AppShell', () => ({
  default: () => <div data-testid='app-shell'>AppShell</div>,
}))

vi.mock('../src/routes/ProtectedRoute', () => ({
  default: () => <div>ProtectedRoute</div>,
}))

vi.mock('../src/routes/AdminRoute', () => ({
  default: () => <div>AdminRoute</div>,
}))

vi.mock('../src/routes/TermsRoute', () => ({
  default: () => <div>TermsRoute</div>,
}))

vi.mock('../src/components/ui/Spinner', () => ({
  default: () => <div>LoadingSpinner</div>,
}))

vi.mock('../src/pages/HomePage', () => ({ default: () => <div>HomePage</div> }))
vi.mock('../src/pages/ArticlePage', () => ({ default: () => <div>ArticlePage</div> }))
vi.mock('../src/pages/WritePage', () => ({ default: () => <div>WritePage</div> }))
vi.mock('../src/pages/ProfilePage', () => ({ default: () => <div>ProfilePage</div> }))
vi.mock('../src/pages/BookmarksPage', () => ({ default: () => <div>BookmarksPage</div> }))
vi.mock('../src/pages/LibraryPage', () => ({ default: () => <div>LibraryPage</div> }))
vi.mock('../src/pages/StatsPage', () => ({ default: () => <div>StatsPage</div> }))
vi.mock('../src/pages/SearchPage', () => ({ default: () => <div>SearchPage</div> }))
vi.mock('../src/pages/TagPage', () => ({ default: () => <div>TagPage</div> }))
vi.mock('../src/pages/AdminPage', () => ({ default: () => <div>AdminPage</div> }))
vi.mock('../src/pages/LoginPage', () => ({ default: () => <div>LoginPage</div> }))
vi.mock('../src/pages/TermsPage', () => ({ default: () => <div>TermsPage</div> }))
vi.mock('../src/pages/NotFoundPage', () => ({ default: () => <div>NotFoundPage</div> }))

describe('App', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders loading shell while auth is loading', () => {
    useAuthMock.mockReturnValue({ loading: true })

    render(
      <MemoryRouter>
        <App />
      </MemoryRouter>,
    )

    expect(screen.getByText('LoadingSpinner')).toBeInTheDocument()
  })

  it('renders route elements when auth loading is false', () => {
    useAuthMock.mockReturnValue({ loading: false })

    render(
      <MemoryRouter initialEntries={['/login']}>
        <App />
      </MemoryRouter>,
    )

    expect(screen.getByText('LoginPage')).toBeInTheDocument()
  })
})

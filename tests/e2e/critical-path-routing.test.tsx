import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import App from '../../src/App'

const useAuthMock = vi.fn()

vi.mock('../../src/hooks/useAuth', () => ({
  useAuth: () => useAuthMock(),
}))

vi.mock('../../src/components/layout/AppShell', async () => {
  const actual = await vi.importActual<typeof import('react-router-dom')>('react-router-dom')
  return {
    default: () => <actual.Outlet />,
  }
})

vi.mock('../../src/components/ui/Spinner', () => ({
  default: () => <div>LoadingSpinner</div>,
}))

vi.mock('../../src/pages/HomePage', () => ({ default: () => <div>HomePage</div> }))
vi.mock('../../src/pages/ArticlePage', () => ({ default: () => <div>ArticlePage</div> }))
vi.mock('../../src/pages/WritePage', () => ({ default: () => <div>WritePage</div> }))
vi.mock('../../src/pages/ProfilePage', () => ({ default: () => <div>ProfilePage</div> }))
vi.mock('../../src/pages/BookmarksPage', () => ({ default: () => <div>BookmarksPage</div> }))
vi.mock('../../src/pages/LibraryPage', () => ({ default: () => <div>LibraryPage</div> }))
vi.mock('../../src/pages/WorkflowPage', () => ({ default: () => <div>WorkflowPage</div> }))
vi.mock('../../src/pages/StatsPage', () => ({ default: () => <div>StatsPage</div> }))
vi.mock('../../src/pages/SearchPage', () => ({ default: () => <div>SearchPage</div> }))
vi.mock('../../src/pages/TagPage', () => ({ default: () => <div>TagPage</div> }))
vi.mock('../../src/pages/AdminPage', () => ({ default: () => <div>AdminPage</div> }))
vi.mock('../../src/pages/NotificationsPage', () => ({ default: () => <div>NotificationsPage</div> }))
vi.mock('../../src/pages/LoginPage', () => ({ default: () => <div>LoginPage</div> }))
vi.mock('../../src/pages/TermsPage', () => ({ default: () => <div>TermsPage</div> }))
vi.mock('../../src/pages/OnboardingPreferencesPage', () => ({ default: () => <div>OnboardingPreferencesPage</div> }))
vi.mock('../../src/pages/NotFoundPage', () => ({ default: () => <div>NotFoundPage</div> }))
vi.mock('../../src/pages/ExplorePage', () => ({ default: () => <div>ExplorePage</div> }))
vi.mock('../../src/pages/MembershipPage', () => ({ default: () => <div>MembershipPage</div> }))
vi.mock('../../src/pages/InfoPage', () => ({ default: () => <div>InfoPage</div> }))
vi.mock('../../src/pages/SeriesPage', () => ({ default: () => <div>SeriesPage</div> }))

describe('Critical Path Routing Coverage', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('protects write route for unauthenticated users', () => {
    useAuthMock.mockReturnValue({ user: null, loading: false })

    render(
      <MemoryRouter initialEntries={['/write']}>
        <App />
      </MemoryRouter>,
    )

    expect(screen.getByText('LoginPage')).toBeInTheDocument()
  })

  it('allows authenticated author to access write route', () => {
    useAuthMock.mockReturnValue({ user: { id: 'u-author', role: 'AUTHOR' }, loading: false })

    render(
      <MemoryRouter initialEntries={['/write']}>
        <App />
      </MemoryRouter>,
    )

    expect(screen.getByText('WritePage')).toBeInTheDocument()
  })

  it('blocks admin route for non-admin users', () => {
    useAuthMock.mockReturnValue({ user: { id: 'u-author', role: 'AUTHOR' }, loading: false })

    render(
      <MemoryRouter initialEntries={['/admin']}>
        <App />
      </MemoryRouter>,
    )

    expect(screen.getByText('HomePage')).toBeInTheDocument()
  })

  it('allows admin route for approver users', () => {
    useAuthMock.mockReturnValue({ user: { id: 'u-approver', role: 'APPROVER' }, loading: false })

    render(
      <MemoryRouter initialEntries={['/admin']}>
        <App />
      </MemoryRouter>,
    )

    expect(screen.getByText('AdminPage')).toBeInTheDocument()
  })

  it('keeps article route public', () => {
    useAuthMock.mockReturnValue({ user: null, loading: false })

    render(
      <MemoryRouter initialEntries={['/article/some-story']}>
        <App />
      </MemoryRouter>,
    )

    expect(screen.getByText('ArticlePage')).toBeInTheDocument()
  })

  it('keeps membership route public', () => {
    useAuthMock.mockReturnValue({ user: null, loading: false })

    render(
      <MemoryRouter initialEntries={['/membership']}>
        <App />
      </MemoryRouter>,
    )

    expect(screen.getByText('MembershipPage')).toBeInTheDocument()
  })
})

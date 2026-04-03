import { fireEvent, render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import StatsPage from '../../src/pages/StatsPage'
import { makeArticle } from '../utils/fixtures'

const useMyArticlesMock = vi.fn()
const useAuthMock = vi.fn()

vi.mock('../../src/hooks/useArticles', () => ({
  useMyArticles: () => useMyArticlesMock(),
}))

vi.mock('../../src/hooks/useAuth', () => ({
  useAuth: () => useAuthMock(),
}))

vi.mock('../../src/components/ui/Spinner', () => ({
  default: () => <div>Loading...</div>,
}))

describe('StatsPage', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    useAuthMock.mockReturnValue({ user: { id: 'u1', role: 'AUTHOR' } })
  })

  it('shows loading state while fetching article stats', () => {
    useMyArticlesMock.mockReturnValue({ data: undefined, isLoading: true })

    render(
      <MemoryRouter>
        <StatsPage />
      </MemoryRouter>,
    )

    expect(screen.getByText('Loading...')).toBeInTheDocument()
  })

  it('renders overview metrics by default and shows top stories in the stories tab', () => {
    useMyArticlesMock.mockReturnValue({
      isLoading: false,
      data: {
        items: [
          makeArticle({ id: 'p1', title: 'Published One', status: 'PUBLISHED', views_count: 100, likes_count: 10, shares_count: 5, comments_count: 2, read_time_minutes: 6 }),
          makeArticle({ id: 'p2', title: 'Published Two', status: 'PUBLISHED', views_count: 40, likes_count: 4, shares_count: 1, comments_count: 1, read_time_minutes: 4 }),
          makeArticle({ id: 'd1', title: 'Draft One', status: 'DRAFT', views_count: 0, likes_count: 0, comments_count: 0 }),
          makeArticle({ id: 'r1', title: 'Rejected One', status: 'REJECTED', views_count: 0, likes_count: 0, comments_count: 0 }),
        ],
      },
    })

    render(
      <MemoryRouter>
        <StatsPage />
      </MemoryRouter>,
    )

    expect(screen.getByText('Author Dashboard')).toBeInTheDocument()
    expect(screen.getByText('Post-login only')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Overview' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Stories' })).toBeInTheDocument()
    expect(screen.getAllByText('Published stories').length).toBeGreaterThan(0)
    expect(screen.getAllByText('Views').length).toBeGreaterThan(0)
    expect(screen.getAllByText('Engagement score').length).toBeGreaterThan(0)
    expect(screen.getByText('Needs attention')).toBeInTheDocument()
    expect(screen.getByText('Draft One')).toBeInTheDocument()
    expect(screen.getByText('Rejected One')).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /open library/i })).toHaveAttribute('href', '/library')

    fireEvent.click(screen.getByRole('button', { name: 'Stories' }))

    expect(screen.getByText('Top performing stories')).toBeInTheDocument()
    expect(screen.getAllByText('Published One').length).toBeGreaterThan(0)
    expect(screen.getAllByText('Published Two').length).toBeGreaterThan(0)
  })
})

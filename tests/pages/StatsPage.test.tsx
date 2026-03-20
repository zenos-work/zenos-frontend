import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import StatsPage from '../../src/pages/StatsPage'
import { makeArticle } from '../utils/fixtures'

const useMyArticlesMock = vi.fn()

vi.mock('../../src/hooks/useArticles', () => ({
  useMyArticles: () => useMyArticlesMock(),
}))

vi.mock('../../src/components/ui/Spinner', () => ({
  default: () => <div>Loading...</div>,
}))

describe('StatsPage', () => {
  beforeEach(() => {
    vi.clearAllMocks()
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

  it('renders aggregate metrics, workflow counts, and top performing articles', () => {
    useMyArticlesMock.mockReturnValue({
      isLoading: false,
      data: {
        items: [
          makeArticle({ id: 'p1', title: 'Published One', status: 'PUBLISHED', views_count: 100, likes_count: 10, comments_count: 2, read_time_minutes: 6 }),
          makeArticle({ id: 'p2', title: 'Published Two', status: 'PUBLISHED', views_count: 40, likes_count: 4, comments_count: 1, read_time_minutes: 4 }),
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
    expect(screen.getByText('140')).toBeInTheDocument() // total views
    expect(screen.getByText('14')).toBeInTheDocument() // total likes
    expect(screen.getByText('3')).toBeInTheDocument() // total comments
    expect(screen.getByText('5 min')).toBeInTheDocument() // avg read time of published

    expect(screen.getByText('Draft One')).toBeInTheDocument()
    expect(screen.getByText('Rejected One')).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /open library/i })).toHaveAttribute('href', '/library')

    expect(screen.getByText('Published One')).toBeInTheDocument()
    expect(screen.getByText('Published Two')).toBeInTheDocument()
  })
})

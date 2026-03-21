import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import TagPage from '../../src/pages/TagPage'
import { makeArticle } from '../utils/fixtures'

const useArticlesMock = vi.fn()

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual<typeof import('react-router-dom')>('react-router-dom')
  return {
    ...actual,
    useParams: () => ({ slug: 'fintech' }),
  }
})

vi.mock('../../src/hooks/useArticles', () => ({
  useArticles: (...args: unknown[]) => useArticlesMock(...args),
}))

vi.mock('../../src/components/article/ArticleCard', () => ({
  default: ({ article }: { article: { title: string } }) => <div>{article.title}</div>,
}))

vi.mock('../../src/components/ui/Spinner', () => ({
  default: () => <div>Loading</div>,
}))

describe('TagPage', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('shows loading state', () => {
    useArticlesMock.mockReturnValue({ data: undefined, isLoading: true })

    render(
      <MemoryRouter>
        <TagPage />
      </MemoryRouter>,
    )

    expect(screen.getByText('Loading')).toBeInTheDocument()
    expect(screen.getByText('fintech')).toBeInTheDocument()
  })

  it('shows empty state when no articles are returned', () => {
    useArticlesMock.mockReturnValue({ data: { items: [] }, isLoading: false })

    render(
      <MemoryRouter>
        <TagPage />
      </MemoryRouter>,
    )

    expect(screen.getByText('0 articles')).toBeInTheDocument()
    expect(screen.getByText(/No published articles with this tag yet/i)).toBeInTheDocument()
  })

  it('renders list of tag articles', () => {
    useArticlesMock.mockReturnValue({
      data: { items: [makeArticle({ id: 'a1', title: 'Tagged One' }), makeArticle({ id: 'a2', title: 'Tagged Two' })] },
      isLoading: false,
    })

    render(
      <MemoryRouter>
        <TagPage />
      </MemoryRouter>,
    )

    expect(screen.getByText('2 articles')).toBeInTheDocument()
    expect(screen.getByText('Tagged One')).toBeInTheDocument()
    expect(screen.getByText('Tagged Two')).toBeInTheDocument()
  })
})

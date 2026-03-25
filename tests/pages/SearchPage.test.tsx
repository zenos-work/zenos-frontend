import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import SearchPage from '../../src/pages/SearchPage'
import { makeArticle, makePaginatedResponse, makeTag, makeUser } from '../utils/fixtures'

const apiGetMock = vi.fn()
const useSearchAllMock = vi.fn()
const useSearchArticlesMock = vi.fn()
const useSearchTagsMock = vi.fn()
const useSearchAuthorsMock = vi.fn()

vi.mock('../../src/lib/api', () => ({
  default: {
    get: (...args: unknown[]) => apiGetMock(...args),
  },
}))

vi.mock('../../src/hooks/useSearch', () => ({
  useSearchAll: (...args: unknown[]) => useSearchAllMock(...args),
  useSearchArticles: (...args: unknown[]) => useSearchArticlesMock(...args),
  useSearchTags: (...args: unknown[]) => useSearchTagsMock(...args),
  useSearchAuthors: (...args: unknown[]) => useSearchAuthorsMock(...args),
}))

vi.mock('../../src/components/article/ArticleCard', () => ({
  default: ({ article }: { article: { title: string } }) => <div data-testid='article-card'>{article.title}</div>,
}))

vi.mock('../../src/components/ui/Spinner', () => ({
  default: () => <div>Loading...</div>,
}))

vi.mock('../../src/components/ui/Avatar', () => ({
  default: ({ name }: { name: string }) => <div>{name}</div>,
}))

vi.mock('../../src/components/ui/TagChip', () => ({
  default: ({ tag }: { tag: { name: string } }) => <div>{tag.name}</div>,
}))

function renderSearch(initialEntry: string) {
  return render(
    <MemoryRouter initialEntries={[initialEntry]}>
      <Routes>
        <Route path='/search' element={<SearchPage />} />
      </Routes>
    </MemoryRouter>,
  )
}

describe('SearchPage', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    apiGetMock.mockResolvedValue({ data: { content_types: [] } })

    useSearchAllMock.mockImplementation((q: string, _filters: unknown, enabled: boolean) => ({
      data: enabled && q === 'ai'
        ? {
            query: q,
            articles: { items: [makeArticle({ title: 'AI Article' })], total: 1 },
            tags: { items: [makeTag({ name: 'AI', slug: 'ai' })], total: 1 },
            authors: { items: [makeUser({ name: 'AI Author' })], total: 1 },
          }
        : undefined,
      isLoading: false,
    }))

    useSearchArticlesMock.mockImplementation((q: string, page: number, _filters: unknown, enabled: boolean) => ({
      data: enabled && q === 'ai'
        ? makePaginatedResponse([
            makeArticle({ id: `article-${page}`, title: page === 1 ? 'Article Page 1' : 'Article Page 2' }),
          ], { page, has_more: page === 1 })
        : undefined,
      isLoading: false,
    }))

    useSearchTagsMock.mockImplementation((q: string, page: number, enabled: boolean) => ({
      data: enabled && q === 'ai'
        ? makePaginatedResponse([makeTag({ id: `tag-${page}`, name: 'AI' })], { page, has_more: false })
        : undefined,
      isLoading: false,
    }))

    useSearchAuthorsMock.mockImplementation((q: string, page: number, enabled: boolean) => ({
      data: enabled && q === 'ai'
        ? makePaginatedResponse([makeUser({ id: `user-${page}`, name: 'AI Author' })], { page, has_more: false })
        : undefined,
      isLoading: false,
    }))
  })

  it('shows guidance when there is no query or the query is too short', () => {
    renderSearch('/search')
    expect(screen.getByText('Enter a search term in the top bar.')).toBeInTheDocument()

    renderSearch('/search?q=a&type=all&page=1')
    expect(screen.getByText('Type at least 2 characters.')).toBeInTheDocument()
  })

  it('renders aggregate search results for all types', () => {
    renderSearch('/search?q=ai&type=all&page=1')

    expect(screen.getByText('Results for "ai"')).toBeInTheDocument()
    expect(screen.getByText('3 found')).toBeInTheDocument()
    expect(screen.getByText('AI Article')).toBeInTheDocument()
    expect(screen.getByText('AI')).toBeInTheDocument()
    expect(screen.getAllByText('AI Author').length).toBeGreaterThan(0)
  })

  it('switches to article search results and paginates', async () => {
    renderSearch('/search?q=ai&type=all&page=1')

    fireEvent.click(screen.getByRole('button', { name: /articles/i }))

    await waitFor(() => {
      expect(screen.getByText('Article Page 1')).toBeInTheDocument()
    })
    expect(screen.getByText('Page 1')).toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: 'Next' }))

    await waitFor(() => {
      expect(screen.getByText('Article Page 2')).toBeInTheDocument()
    })
    expect(screen.getByText('Page 2')).toBeInTheDocument()
  })

  it('shows the content type filter for article queries', async () => {
    renderSearch('/search?q=ai&type=articles&page=1')

    expect(screen.getByDisplayValue('All content types')).toBeInTheDocument()
  })

  it('shows loading state while search is in progress', () => {
    useSearchAllMock.mockReturnValue({ data: undefined, isLoading: true })
    useSearchArticlesMock.mockReturnValue({ data: undefined, isLoading: false })
    useSearchTagsMock.mockReturnValue({ data: undefined, isLoading: false })
    useSearchAuthorsMock.mockReturnValue({ data: undefined, isLoading: false })

    renderSearch('/search?q=ai&type=all&page=1')

    expect(screen.getByText('Loading...')).toBeInTheDocument()
  })

  it('shows no-results message when all-search has no payload', () => {
    useSearchAllMock.mockReturnValue({ data: undefined, isLoading: false })
    useSearchArticlesMock.mockReturnValue({ data: undefined, isLoading: false })
    useSearchTagsMock.mockReturnValue({ data: undefined, isLoading: false })
    useSearchAuthorsMock.mockReturnValue({ data: undefined, isLoading: false })

    renderSearch('/search?q=ai&type=all&page=1')

    expect(screen.getByText('No results found for "ai"')).toBeInTheDocument()
  })

  it('renders empty tags state with disabled pagination buttons', () => {
    useSearchTagsMock.mockReturnValue({
      data: makePaginatedResponse([], { page: 1, has_more: false, total: 0 }),
      isLoading: false,
    })

    renderSearch('/search?q=ai&type=tags&page=1')

    expect(screen.getByText('No tags found for "ai"')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Previous' })).toBeDisabled()
    expect(screen.getByRole('button', { name: 'Next' })).toBeDisabled()
  })

  it('renders empty authors state', () => {
    useSearchAuthorsMock.mockReturnValue({
      data: makePaginatedResponse([], { page: 1, has_more: false, total: 0 }),
      isLoading: false,
    })

    renderSearch('/search?q=ai&type=authors&page=1')

    expect(screen.getByText('No authors found for "ai"')).toBeInTheDocument()
  })

  it('loads content type options for article search filters', async () => {
    apiGetMock.mockResolvedValueOnce({
      data: {
        content_types: [
          { slug: 'playbook', name: 'Playbook' },
        ],
      },
    })

    renderSearch('/search?q=ai&type=articles&page=1')

    await waitFor(() => {
      expect(apiGetMock).toHaveBeenCalledWith('/api/articles/content-types')
    })
    expect(await screen.findByText('Playbook')).toBeInTheDocument()
  })

  it('keeps default content types when content-type API fails', async () => {
    apiGetMock.mockRejectedValueOnce(new Error('network error'))

    renderSearch('/search?q=ai&type=articles&page=1')

    await waitFor(() => {
      expect(apiGetMock).toHaveBeenCalledWith('/api/articles/content-types')
    })
    expect(await screen.findByText('Case study')).toBeInTheDocument()
  })

  it('renders empty sections in all-results view', () => {
    useSearchAllMock.mockReturnValue({
      data: {
        query: 'ai',
        articles: { items: [], total: 0 },
        tags: { items: [], total: 0 },
        authors: { items: [], total: 0 },
      },
      isLoading: false,
    })

    renderSearch('/search?q=ai&type=all&page=1')

    expect(screen.getByText('No articles.')).toBeInTheDocument()
    expect(screen.getByText('No tags.')).toBeInTheDocument()
    expect(screen.getByText('No authors.')).toBeInTheDocument()
  })
})

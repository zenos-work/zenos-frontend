import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import BookmarksPage from '../../src/pages/BookmarksPage'
import { makeArticle } from '../utils/fixtures'

const useBookmarksMock = vi.fn()
const useBookmarkMock = vi.fn()

vi.mock('../../src/hooks/useSocial', () => ({
  useBookmarks: (...args: unknown[]) => useBookmarksMock(...args),
  useBookmark: (...args: unknown[]) => useBookmarkMock(...args),
}))

vi.mock('../../src/components/article/ArticleCard', () => ({
  default: ({ article }: { article: { title: string } }) => <div data-testid='article-card'>{article.title}</div>,
}))

vi.mock('../../src/components/ui/Spinner', () => ({
  default: () => <div>Loading...</div>,
}))

describe('BookmarksPage', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    useBookmarkMock.mockReturnValue({ mutate: vi.fn(), isPending: false })
  })

  it('shows an empty state when there are no bookmarks', () => {
    useBookmarksMock.mockReturnValue({
      data: { items: [], total: 0, page: 1, pages: 1, has_more: false },
      isLoading: false,
    })

    render(
      <MemoryRouter>
        <BookmarksPage />
      </MemoryRouter>,
    )

    expect(screen.getByText('No saved articles yet.')).toBeInTheDocument()
  })

  it('shows loading state', () => {
    useBookmarksMock.mockReturnValue({
      data: undefined,
      isLoading: true,
    })

    render(
      <MemoryRouter>
        <BookmarksPage />
      </MemoryRouter>,
    )

    expect(screen.getByText('Loading...')).toBeInTheDocument()
  })

  it('filters bookmarks and paginates to the next page', async () => {
    const alpha = makeArticle({ id: 'a1', title: 'Alpha Note' })
    const beta = makeArticle({ id: 'a2', title: 'Beta Insight', subtitle: 'Search me' })
    const gamma = makeArticle({ id: 'a3', title: 'Gamma Report' })

    useBookmarksMock.mockImplementation((page: number) => ({
      data: page === 2
        ? { items: [gamma], total: 3, page: 2, pages: 2, has_more: false }
        : { items: [alpha, beta], total: 3, page: 1, pages: 2, has_more: true },
      isLoading: false,
    }))

    render(
      <MemoryRouter>
        <BookmarksPage />
      </MemoryRouter>,
    )

    expect(screen.getByText('3 saved')).toBeInTheDocument()
    expect(screen.getByText('Alpha Note')).toBeInTheDocument()
    expect(screen.getByText('Beta Insight')).toBeInTheDocument()

    fireEvent.change(screen.getByPlaceholderText('Search within saved articles'), {
      target: { value: 'beta' },
    })

    expect(screen.queryByText('Alpha Note')).not.toBeInTheDocument()
    expect(screen.getByText('Beta Insight')).toBeInTheDocument()

    fireEvent.change(screen.getByPlaceholderText('Search within saved articles'), {
      target: { value: '' },
    })

    fireEvent.click(screen.getByRole('button', { name: 'Next' }))

    await waitFor(() => {
      expect(useBookmarksMock).toHaveBeenLastCalledWith(2, 20)
    })
    expect(screen.getByText('Gamma Report')).toBeInTheDocument()
  })

  it('shows filter-empty state and resets filters', () => {
    const alpha = makeArticle({ id: 'a1', title: 'Alpha Note' })
    const beta = makeArticle({ id: 'a2', title: 'Beta Insight' })

    useBookmarksMock.mockReturnValue({
      data: { items: [alpha, beta], total: 2, page: 1, pages: 1, has_more: false },
      isLoading: false,
    })

    render(
      <MemoryRouter>
        <BookmarksPage />
      </MemoryRouter>,
    )

    fireEvent.change(screen.getByPlaceholderText('Search within saved articles'), {
      target: { value: 'does-not-match' },
    })

    expect(screen.getByText('No bookmarks match your filters.')).toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: 'Reset filters' }))

    expect(screen.getByText('Alpha Note')).toBeInTheDocument()
    expect(screen.getByText('Beta Insight')).toBeInTheDocument()
  })

  it('applies title/likes/views/oldest sorting modes', () => {
    const zeta = makeArticle({ id: 'a1', title: 'Zeta', likes_count: 1, views_count: 10, published_at: '2026-03-10T00:00:00Z' })
    const alpha = makeArticle({ id: 'a2', title: 'Alpha', likes_count: 20, views_count: 5, published_at: '2026-03-01T00:00:00Z' })
    const beta = makeArticle({ id: 'a3', title: 'Beta', likes_count: 5, views_count: 200, published_at: '2026-03-05T00:00:00Z' })

    useBookmarksMock.mockReturnValue({
      data: { items: [zeta, alpha, beta], total: 3, page: 1, pages: 1, has_more: false },
      isLoading: false,
    })

    render(
      <MemoryRouter>
        <BookmarksPage />
      </MemoryRouter>,
    )

    const select = screen.getByRole('combobox')

    fireEvent.change(select, { target: { value: 'title' } })
    expect(screen.getAllByTestId('article-card').map((n) => n.textContent)).toEqual(['Alpha', 'Beta', 'Zeta'])

    fireEvent.change(select, { target: { value: 'likes' } })
    expect(screen.getAllByTestId('article-card').map((n) => n.textContent)[0]).toBe('Alpha')

    fireEvent.change(select, { target: { value: 'views' } })
    expect(screen.getAllByTestId('article-card').map((n) => n.textContent)[0]).toBe('Beta')

    fireEvent.change(select, { target: { value: 'oldest' } })
    expect(screen.getAllByTestId('article-card').map((n) => n.textContent)[0]).toBe('Alpha')
  })
})

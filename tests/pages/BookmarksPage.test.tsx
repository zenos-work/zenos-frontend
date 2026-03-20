import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import BookmarksPage from '../../src/pages/BookmarksPage'
import { makeArticle } from '../utils/fixtures'

const useBookmarksMock = vi.fn()

vi.mock('../../src/hooks/useSocial', () => ({
  useBookmarks: (...args: unknown[]) => useBookmarksMock(...args),
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
})

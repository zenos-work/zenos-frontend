import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import HomePage from '../../src/pages/HomePage'
import { makeArticle } from '../utils/fixtures'

const useFeaturedMock = vi.fn()
const useFeedMock = vi.fn()
const useAuthMock = vi.fn()

vi.mock('../../src/hooks/useFeed', () => ({
  useFeatured: () => useFeaturedMock(),
  useFeed: (...args: unknown[]) => useFeedMock(...args),
}))

vi.mock('../../src/hooks/useAuth', () => ({
  useAuth: () => useAuthMock(),
}))

vi.mock('../../src/components/article/ArticleCard', () => ({
  default: ({ article }: { article: { title: string } }) => <div>{article.title}</div>,
}))

vi.mock('../../src/components/article/ArticleHero', () => ({
  default: ({ article }: { article: { title: string } }) => <div data-testid='hero'>{article.title}</div>,
}))

vi.mock('../../src/components/ui/Spinner', () => ({
  default: () => <div>Loading...</div>,
}))

describe('HomePage', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    class IntersectionObserverMock {
      observe = vi.fn()
      unobserve = vi.fn()
      disconnect = vi.fn()
      takeRecords = vi.fn()
    }

    Object.defineProperty(globalThis, 'IntersectionObserver', {
      writable: true,
      configurable: true,
      value: IntersectionObserverMock,
    })
  })

  it('shows featured stories and feed articles', () => {
    const featured = [makeArticle({ id: 'f1', title: 'Featured A' }), makeArticle({ id: 'f2', title: 'Featured B' })]
    const feedItems = [makeArticle({ id: 'a1', title: 'Feed A' }), makeArticle({ id: 'a2', title: 'Feed B' })]

    useAuthMock.mockReturnValue({ user: { id: 'user-1' } })
    useFeaturedMock.mockReturnValue({ data: featured })
    useFeedMock.mockReturnValue({
      data: { pages: [{ articles: feedItems, feed: 'personalised' }] },
      fetchNextPage: vi.fn(),
      hasNextPage: false,
      isFetchingNextPage: false,
      isLoading: false,
      isError: false,
      error: null,
    })

    render(
      <MemoryRouter>
        <HomePage />
      </MemoryRouter>,
    )

    expect(screen.getByText('Featured')).toBeInTheDocument()
    const heroCards = screen.getAllByTestId('hero')
    expect(heroCards[0]).toHaveTextContent('Featured A')
    expect(heroCards[1]).toHaveTextContent('Featured B')
    expect(screen.getByText('Feed A')).toBeInTheDocument()
    expect(screen.getByText('Feed B')).toBeInTheDocument()
    expect(screen.getByText(/Personalised/)).toBeInTheDocument()
  })

  it('prompts login on following tab when user is not signed in', () => {
    useAuthMock.mockReturnValue({ user: null })
    useFeaturedMock.mockReturnValue({ data: [] })
    useFeedMock.mockReturnValue({
      data: undefined,
      fetchNextPage: vi.fn(),
      hasNextPage: false,
      isFetchingNextPage: false,
      isLoading: false,
      isError: false,
      error: null,
    })

    render(
      <MemoryRouter>
        <HomePage />
      </MemoryRouter>,
    )

    fireEvent.click(screen.getByRole('button', { name: 'Following' }))

    expect(screen.getByText('Sign in to view articles from authors you follow.')).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Go to login' })).toHaveAttribute('href', '/login')
  })

  it('loads next page when load more is clicked', async () => {
    const fetchNextPage = vi.fn().mockResolvedValue(undefined)
    useAuthMock.mockReturnValue({ user: { id: 'user-1' } })
    useFeaturedMock.mockReturnValue({ data: [] })
    useFeedMock.mockReturnValue({
      data: { pages: [{ articles: [makeArticle({ id: 'a1', title: 'Feed A' })], feed: 'latest' }] },
      fetchNextPage,
      hasNextPage: true,
      isFetchingNextPage: false,
      isLoading: false,
      isError: false,
      error: null,
    })

    render(
      <MemoryRouter>
        <HomePage />
      </MemoryRouter>,
    )

    fireEvent.click(screen.getByRole('button', { name: 'Load more' }))

    await waitFor(() => {
      expect(fetchNextPage).toHaveBeenCalledTimes(1)
    })
  })
})

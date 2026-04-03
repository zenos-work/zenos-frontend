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

vi.mock('../../src/components/reading/DiscoverySidebar', () => ({
  DiscoverySidebar: () => <div data-testid='discovery-sidebar'>Discovery Sidebar</div>,
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

    expect(screen.getByText('Stay curious.')).toBeInTheDocument()
    expect(screen.getByText('Featured A')).toBeInTheDocument()
    const heroCards = screen.getAllByTestId('hero')
    expect(heroCards[0]).toHaveTextContent('Featured B')
    expect(screen.getByText('Feed A')).toBeInTheDocument()
    expect(screen.getByText('Feed B')).toBeInTheDocument()
    expect(screen.getByText(/Personalised/)).toBeInTheDocument()
    expect(screen.getByTestId('discovery-sidebar')).toBeInTheDocument()
  })

  it('shows prototype-style landing when user is not signed in', () => {
    const guestFeedItems = [
      makeArticle({ id: 'g1', title: 'Live Story One', subtitle: 'Real subtitle one', author_name: 'Writer One', views_count: 300, read_time_minutes: 4 }),
      makeArticle({ id: 'g2', title: 'Live Story Two', subtitle: 'Real subtitle two', author_name: 'Writer Two', views_count: 200, read_time_minutes: 6 }),
      makeArticle({ id: 'g3', title: 'Live Story Three', subtitle: 'Real subtitle three', author_name: 'Writer One', views_count: 100, read_time_minutes: 5 }),
    ]

    useAuthMock.mockReturnValue({ user: null })
    useFeaturedMock.mockReturnValue({ data: [] })
    useFeedMock.mockReturnValue({
      data: { pages: [{ articles: guestFeedItems, feed: 'latest' }] },
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

    expect(screen.getByText(/Where good ideas/i)).toBeInTheDocument()
    expect(screen.getByText(/find you\./i)).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /start reading free/i })).toHaveAttribute('href', '/login')
    expect(screen.getByText(/Stories worth your time/i)).toBeInTheDocument()
    expect(screen.getByText('Live Story One')).toBeInTheDocument()
    expect(screen.getByText('Live Story Two')).toBeInTheDocument()
    expect(screen.getByText('Live Story Three')).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /view all stories/i })).toHaveAttribute('href', '/explore')
    expect(screen.queryByText(/over 148,000 writers/i)).not.toBeInTheDocument()

    fireEvent.click(screen.getByRole('link', { name: /explore topics/i }))
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

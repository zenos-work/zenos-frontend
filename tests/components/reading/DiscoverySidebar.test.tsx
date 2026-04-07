import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { DiscoverySidebar } from '../../../src/components/reading/DiscoverySidebar'
import { makeArticle, makeTag } from '../../utils/fixtures'

let authState: { user: { role: string } | null } = { user: { role: 'AUTHOR' } }
const useFeedMock = vi.fn()
const useTagsMock = vi.fn()

vi.mock('../../../src/hooks/useAuth', () => ({
  useAuth: () => authState,
}))

vi.mock('../../../src/hooks/useFeed', () => ({
  useFeed: (...args: unknown[]) => useFeedMock(...args),
}))

vi.mock('../../../src/hooks/useTags', () => ({
  useTags: () => useTagsMock(),
}))

vi.mock('../../../src/lib/assets', () => ({
  resolveAssetUrl: (value?: string) => value || '/fallback.png',
}))

function renderSidebar() {
  return render(
    <MemoryRouter>
      <DiscoverySidebar />
    </MemoryRouter>,
  )
}

describe('DiscoverySidebar', () => {
  beforeEach(() => {
    authState = { user: { role: 'AUTHOR' } }
    vi.clearAllMocks()

    useFeedMock.mockImplementation((kind: string) => {
      if (kind === 'trending') {
        return {
          isLoading: false,
          data: {
            pages: [
              {
                articles: [
                  makeArticle({
                    id: 't1',
                    slug: 't1',
                    title: 'Trending One',
                    author_id: 'writer-1',
                    author_name: 'Writer One',
                    author_avatar: '/writer-1.png',
                    subtitle: 'Writer One bio',
                    views_count: 800,
                    read_time_minutes: 12,
                  }),
                  makeArticle({
                    id: 't2',
                    slug: 't2',
                    title: 'Trending Two',
                    author_id: 'writer-2',
                    author_name: 'Writer Two',
                    views_count: 500,
                    read_time_minutes: 9,
                  }),
                ],
              },
            ],
          },
        }
      }

      return {
        isLoading: false,
        data: {
          pages: [
            {
              articles: [
                makeArticle({
                  id: 'h1',
                  slug: 'h1',
                  title: 'Home One',
                  author_id: 'writer-1',
                  author_name: 'Writer One',
                  subtitle: 'Writer One duplicate',
                }),
              ],
            },
          ],
        },
      }
    })

    useTagsMock.mockReturnValue({
      data: [makeTag({ name: 'AI', slug: 'ai' }), makeTag({ name: 'Markets', slug: 'markets' })],
      isLoading: false,
    })
  })

  it('renders membership, trending content, topics, and deduplicated writers', () => {
    renderSidebar()

    expect(screen.getByText('Unlock all of Zenos')).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /see plans/i })).toHaveAttribute('href', '/membership')
    expect(screen.getByText('Trending One')).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'AI' })).toHaveAttribute('href', '/tag/ai')
    expect(screen.getAllByText('Writer One').length).toBeGreaterThan(0)
    expect(screen.getByText(/4-day streak/i)).toBeInTheDocument()
  })

  it('renders loading placeholders and hides membership banner for non-authors', () => {
    authState = { user: { role: 'READER' } }
    useFeedMock.mockReturnValue({ isLoading: true, data: undefined })
    useTagsMock.mockReturnValue({ data: undefined, isLoading: true })

    renderSidebar()

    expect(screen.queryByText('Unlock all of Zenos')).not.toBeInTheDocument()
    expect(document.querySelectorAll('.animate-pulse').length).toBeGreaterThan(0)
  })

  it('shows the empty writers state when feed data has no authors', () => {
    useFeedMock.mockReturnValue({
      isLoading: false,
      data: { pages: [{ articles: [makeArticle({ author_id: '', author_name: '' })] }] },
    })

    renderSidebar()

    expect(
      screen.getByText(/writers will appear here as soon as your feed has author activity/i),
    ).toBeInTheDocument()
  })
})

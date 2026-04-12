import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import ArticlePage from '../../src/pages/ArticlePage'
import { makeArticleDetail, makeTag } from '../utils/fixtures'
import { createQueryClientWrapper } from '../utils/queryClient'

const useArticleMock = vi.fn()
const useAuthorArticlesMock = vi.fn()
const useRelatedArticlesMock = vi.fn()
const useAuthMock = vi.fn()
const apiGetMock = vi.fn()
const useFeatureFlagMock = vi.fn()

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual<typeof import('react-router-dom')>('react-router-dom')
  return {
    ...actual,
    useParams: () => ({ slug: 'alpha-article' }),
  }
})

vi.mock('../../src/hooks/useArticles', () => ({
  useArticle: (...args: unknown[]) => useArticleMock(...args),
  useAuthorArticles: (...args: unknown[]) => useAuthorArticlesMock(...args),
  useRelatedArticles: (...args: unknown[]) => useRelatedArticlesMock(...args),
}))

vi.mock('../../src/hooks/useAuth', () => ({
  useAuth: () => useAuthMock(),
}))

vi.mock('../../src/hooks/useFeatureFlags', () => ({
  useFeatureFlag: (...args: unknown[]) => useFeatureFlagMock(...args),
}))

vi.mock('../../src/lib/api', () => ({
  default: {
    get: (...args: unknown[]) => apiGetMock(...args),
  },
}))

vi.mock('../../src/components/article/ArticleDetail', () => ({
  default: ({ content }: { content: string }) => (
    <div data-testid='article-detail'>
      <h2>Intro</h2>
      {content}
    </div>
  ),
}))

vi.mock('../../src/components/article/ArticleMeta', () => ({
  default: () => <div>Article Meta</div>,
}))

vi.mock('../../src/components/comments/CommentList', () => ({
  default: ({ articleId }: { articleId: string }) => <div>Comments for {articleId}</div>,
}))

vi.mock('../../src/components/social/BookmarkButton', () => ({
  default: () => <button>BookmarkButton</button>,
}))

vi.mock('../../src/components/social/FollowButton', () => ({
  default: ({ authorId }: { authorId: string }) => <button>Follow {authorId}</button>,
}))

vi.mock('../../src/components/ui/TagChip', () => ({
  default: ({ tag }: { tag: { name: string } }) => <span>{tag.name}</span>,
}))

vi.mock('../../src/components/ui/Avatar', () => ({
  default: ({ name }: { name: string }) => <span>{name}</span>,
}))

vi.mock('../../src/components/ui/Spinner', () => ({
  default: () => <div>Loading</div>,
}))

vi.mock('../../src/components/reading/DiscoverySidebar', () => ({
  DiscoverySidebar: () => <div>Discovery Sidebar</div>,
}))

vi.mock('../../src/components/reading/EnhancedTableOfContents', () => ({
  EnhancedTableOfContents: () => <div>TOC</div>,
}))

vi.mock('../../src/components/reading/ConsolidatedReactions', () => ({
  ConsolidatedReactions: () => <div>Reactions</div>,
}))

vi.mock('../../src/components/reading/ReadingProgressBar', () => ({
  ReadingProgressBar: () => <div>Progress</div>,
}))

vi.mock('../../src/components/reading/ReadingPreferencesPanel', () => ({
  ReadingPreferencesPanel: () => null,
}))

vi.mock('../../src/components/article/ReportModal', () => ({
  default: () => <div>ReportModal</div>,
}))

vi.mock('../../src/hooks/useReadingPreferences', () => ({
  useReadingPreferences: () => ({
    preferences: {
      fontSize: 'base',
      fontFamily: 'sans',
      lineHeight: 'relaxed',
      contentWidth: 'medium',
      textColor: 'dark',
      backgroundColor: 'white',
    },
  }),
}))

vi.mock('../../src/hooks/useReactions', () => ({
  useArticleReactions: () => ({ data: { reactions: undefined }, isLoading: false }),
}))

vi.mock('../../src/hooks/useSocial', () => ({
  useShare: () => ({ mutateAsync: vi.fn(), isPending: false }),
  useLike: () => ({ mutateAsync: vi.fn(), isPending: false }),
}))

vi.mock('../../src/stores/uiStore', () => ({
  useUiStore: (selector: (state: { toast: (message: string, type?: string) => void }) => unknown) =>
    selector({ toast: vi.fn() }),
}))

describe('ArticlePage', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    useFeatureFlagMock.mockReturnValue({ enabled: false })
    apiGetMock.mockResolvedValue({
      data: {
        user: {
          id: 'author-1',
          name: 'Article Author',
          role: 'AUTHOR',
          created_at: new Date().toISOString(),
          bio: 'Author bio from profile',
          followers_count: 321,
        },
      },
    })
    useAuthorArticlesMock.mockReturnValue({ data: { items: [] } })
    useRelatedArticlesMock.mockReturnValue({ data: { related: [], count: 0 }, isLoading: false, error: null })
  })

  it('shows loading state', () => {
    useAuthMock.mockReturnValue({ user: null })
    useArticleMock.mockReturnValue({ data: undefined, isLoading: true, error: null })
    const { Wrapper } = createQueryClientWrapper()

    render(
      <MemoryRouter>
        <ArticlePage />
      </MemoryRouter>,
      { wrapper: Wrapper },
    )

    expect(screen.getByText('Loading')).toBeInTheDocument()
  })

  it('shows not found state when article is missing', () => {
    useAuthMock.mockReturnValue({ user: null })
    useArticleMock.mockReturnValue({ data: undefined, isLoading: false, error: new Error('missing') })
    const { Wrapper } = createQueryClientWrapper()

    render(
      <MemoryRouter>
        <ArticlePage />
      </MemoryRouter>,
      { wrapper: Wrapper },
    )

    expect(screen.getByText('Article not found')).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /back to home/i })).toHaveAttribute('href', '/')
  })

  it('renders article view for non-owner and shows follow button', async () => {
    useAuthMock.mockReturnValue({ user: { id: 'u-other', role: 'AUTHOR' } })
    useArticleMock.mockReturnValue({
      data: makeArticleDetail({
        id: 'a1',
        author_id: 'author-1',
        author_name: 'Article Author',
        title: 'Article Title',
        subtitle: 'Subtitle',
        content: 'Body',
        tags: [makeTag({ id: 't1', name: 'Cloud' })],
        status: 'PUBLISHED',
      }),
      isLoading: false,
      error: null,
    })
    useAuthorArticlesMock.mockReturnValue({
      data: {
        items: [
          makeArticleDetail({
            id: 'a2',
            slug: 'other-story',
            title: 'Second Story',
            author_id: 'author-1',
            author_name: 'Article Author',
            content: 'Body',
            status: 'PUBLISHED',
          }),
        ],
      },
    })
    const { Wrapper } = createQueryClientWrapper()

    render(
      <MemoryRouter>
        <ArticlePage />
      </MemoryRouter>,
      { wrapper: Wrapper },
    )

    expect(screen.getByText('Article Title')).toBeInTheDocument()
    expect(screen.getAllByText('Subtitle').length).toBeGreaterThan(0)
    expect(screen.getAllByText('Cloud').length).toBeGreaterThan(0)
    expect(screen.getAllByText('Follow author-1').length).toBeGreaterThan(0)
    expect(screen.getByRole('button', { name: /share article/i })).toBeInTheDocument()
    expect(screen.getByText('TOC')).toBeInTheDocument()
    expect(screen.getByText(/Time spent reading:/i)).toBeInTheDocument()
    expect(await screen.findByText('Written by')).toBeInTheDocument()
    expect(await screen.findByText('321 Followers')).toBeInTheDocument()
    expect(await screen.findByText('Author bio from profile')).toBeInTheDocument()
    expect(screen.getByText('Next from Article Author')).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /second story/i })).toHaveAttribute('href', '/article/other-story')
    expect(screen.queryByRole('link', { name: /edit/i })).not.toBeInTheDocument()
  })

  it('renders owner controls including edit link and rejection note', () => {
    useAuthMock.mockReturnValue({ user: { id: 'author-1', role: 'AUTHOR' } })
    useArticleMock.mockReturnValue({
      data: makeArticleDetail({
        id: 'a2',
        author_id: 'author-1',
        title: 'Draft Story',
        content: 'Body',
        status: 'REJECTED',
        rejection_note: 'Needs stronger references',
        comments_count: 1,
      }),
      isLoading: false,
      error: null,
    })
    const { Wrapper } = createQueryClientWrapper()

    render(
      <MemoryRouter>
        <ArticlePage />
      </MemoryRouter>,
      { wrapper: Wrapper },
    )

    expect(screen.getByRole('link', { name: /edit/i })).toHaveAttribute('href', '/write/a2')
    expect(screen.getByText('Rejection note')).toBeInTheDocument()
    expect(screen.getByText('Needs stronger references')).toBeInTheDocument()
    expect(screen.getByText('1 Comment')).toBeInTheDocument()
    expect(screen.getByText('Comments for a2')).toBeInTheDocument()
  })
})

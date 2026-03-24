import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import ArticlePage from '../../src/pages/ArticlePage'
import { makeArticleDetail, makeTag } from '../utils/fixtures'

const useArticleMock = vi.fn()
const useAuthMock = vi.fn()

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual<typeof import('react-router-dom')>('react-router-dom')
  return {
    ...actual,
    useParams: () => ({ slug: 'alpha-article' }),
  }
})

vi.mock('../../src/hooks/useArticles', () => ({
  useArticle: (...args: unknown[]) => useArticleMock(...args),
}))

vi.mock('../../src/hooks/useAuth', () => ({
  useAuth: () => useAuthMock(),
}))

vi.mock('../../src/components/article/ArticleDetail', () => ({
  default: ({ content }: { content: string }) => <div data-testid='article-detail'>{content}</div>,
}))

vi.mock('../../src/components/article/ArticleMeta', () => ({
  default: () => <div>Article Meta</div>,
}))

vi.mock('../../src/components/comments/CommentList', () => ({
  default: ({ articleId }: { articleId: string }) => <div>Comments for {articleId}</div>,
}))

vi.mock('../../src/components/social/LikeButton', () => ({
  default: () => <button>LikeButton</button>,
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

describe('ArticlePage', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('shows loading state', () => {
    useAuthMock.mockReturnValue({ user: null })
    useArticleMock.mockReturnValue({ data: undefined, isLoading: true, error: null })

    render(
      <MemoryRouter>
        <ArticlePage />
      </MemoryRouter>,
    )

    expect(screen.getByText('Loading')).toBeInTheDocument()
  })

  it('shows not found state when article is missing', () => {
    useAuthMock.mockReturnValue({ user: null })
    useArticleMock.mockReturnValue({ data: undefined, isLoading: false, error: new Error('missing') })

    render(
      <MemoryRouter>
        <ArticlePage />
      </MemoryRouter>,
    )

    expect(screen.getByText('Article not found')).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /back to home/i })).toHaveAttribute('href', '/')
  })

  it('renders article view for non-owner and shows follow button', () => {
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

    render(
      <MemoryRouter>
        <ArticlePage />
      </MemoryRouter>,
    )

    expect(screen.getByText('Article Title')).toBeInTheDocument()
    expect(screen.getByText('Subtitle')).toBeInTheDocument()
    expect(screen.getByText('Cloud')).toBeInTheDocument()
    expect(screen.getByText('Follow author-1')).toBeInTheDocument()
    expect(screen.getByText('Success signals')).toBeInTheDocument()
    expect(screen.getByText('Verification not set')).toBeInTheDocument()
    expect(screen.getByText('Early audience traction')).toBeInTheDocument()
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

    render(
      <MemoryRouter>
        <ArticlePage />
      </MemoryRouter>,
    )

    expect(screen.getByRole('link', { name: /edit/i })).toHaveAttribute('href', '/write/a2')
    expect(screen.getByText('Rejection note')).toBeInTheDocument()
    expect(screen.getByText('Needs stronger references')).toBeInTheDocument()
    expect(screen.getByText('1 Comment')).toBeInTheDocument()
    expect(screen.getByText('Comments for a2')).toBeInTheDocument()
  })
})

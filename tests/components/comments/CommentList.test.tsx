import { render, screen } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import CommentList from '../../../src/components/comments/CommentList'
import type { Comment } from '../../../src/types'

const useCommentsMock = vi.fn()
const useAuthMock = vi.fn()

vi.mock('../../../src/hooks/useComments', () => ({
  useComments: (...args: unknown[]) => useCommentsMock(...args),
}))

vi.mock('../../../src/hooks/useAuth', () => ({
  useAuth: () => useAuthMock(),
}))

vi.mock('../../../src/components/comments/CommentForm', () => ({
  default: ({ articleId }: { articleId: string }) => <div data-testid='comment-form'>Form {articleId}</div>,
}))

vi.mock('../../../src/components/comments/CommentItem', () => ({
  default: ({ comment }: { comment: { content: string } }) => <div data-testid='comment-item'>{comment.content}</div>,
}))

vi.mock('../../../src/components/ui/Spinner', () => ({
  default: () => <div>Loading...</div>,
}))

function makeComment(overrides: Partial<Comment> = {}): Comment {
  return {
    id: 'c1',
    article_id: 'a1',
    author_id: 'u1',
    content: 'Comment one',
    is_deleted: 0,
    created_at: '2026-03-20T00:00:00Z',
    updated_at: '2026-03-20T00:00:00Z',
    replies: [],
    ...overrides,
  }
}

describe('CommentList', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('shows a spinner while comments are loading', () => {
    useAuthMock.mockReturnValue({ user: null })
    useCommentsMock.mockReturnValue({ data: undefined, isLoading: true })

    render(<CommentList articleId='article-1' />)
    expect(screen.getByText('Loading...')).toBeInTheDocument()
  })

  it('shows sign-in empty state for guests', () => {
    useAuthMock.mockReturnValue({ user: null })
    useCommentsMock.mockReturnValue({ data: [], isLoading: false })

    render(<CommentList articleId='article-1' />)
    expect(screen.getByText(/Sign in to comment/)).toBeInTheDocument()
    expect(screen.queryByTestId('comment-form')).not.toBeInTheDocument()
  })

  it('renders the form and only top-level comments for signed-in users', () => {
    useAuthMock.mockReturnValue({ user: { id: 'u1' } })
    useCommentsMock.mockReturnValue({
      isLoading: false,
      data: [
        makeComment({ id: 'c1', content: 'Top one' }),
        makeComment({ id: 'c2', content: 'Nested two', parent_id: 'c1' }),
      ],
    })

    render(<CommentList articleId='article-1' />)

    expect(screen.getByTestId('comment-form')).toHaveTextContent('article-1')
    expect(screen.getAllByTestId('comment-item')).toHaveLength(1)
    expect(screen.getByText('Top one')).toBeInTheDocument()
    expect(screen.queryByText('Nested two')).not.toBeInTheDocument()
  })
})

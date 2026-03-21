import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import CommentItem from '../../../src/components/comments/CommentItem'
import type { Comment } from '../../../src/types'

const useAuthMock = vi.fn()
const useEditCommentMock = vi.fn()
const useDeleteCommentMock = vi.fn()

vi.mock('../../../src/hooks/useAuth', () => ({
  useAuth: () => useAuthMock(),
}))

vi.mock('../../../src/hooks/useComments', () => ({
  useEditComment: (...args: unknown[]) => useEditCommentMock(...args),
  useDeleteComment: (...args: unknown[]) => useDeleteCommentMock(...args),
}))

vi.mock('../../../src/components/ui/Avatar', () => ({
  default: ({ name }: { name: string }) => <div data-testid='avatar'>{name}</div>,
}))

vi.mock('../../../src/components/comments/CommentForm', () => ({
  default: ({ parentId }: { parentId?: string }) => <div data-testid='reply-form'>Reply form {parentId}</div>,
}))

function makeComment(overrides: Partial<Comment> = {}): Comment {
  return {
    id: 'c1',
    article_id: 'a1',
    author_id: 'user-1',
    content: 'Top level comment',
    is_deleted: 0,
    created_at: '2026-03-20T00:00:00Z',
    updated_at: '2026-03-20T00:00:00Z',
    author_name: 'Alex Writer',
    replies: [],
    ...overrides,
  }
}

describe('CommentItem', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders deleted comments without actions', () => {
    useAuthMock.mockReturnValue({ user: { id: 'user-1' } })
    useEditCommentMock.mockReturnValue({ mutateAsync: vi.fn(), isPending: false })
    useDeleteCommentMock.mockReturnValue({ mutate: vi.fn() })

    render(<CommentItem articleId='a1' comment={makeComment({ is_deleted: 1 })} />)

    expect(screen.getByText('[deleted]')).toBeInTheDocument()
    expect(screen.queryByText('Reply')).not.toBeInTheDocument()
    expect(screen.queryByText('Edit')).not.toBeInTheDocument()
    expect(screen.queryByText('Delete')).not.toBeInTheDocument()
  })

  it('allows owner to edit, save, reply, and delete', async () => {
    const mutateAsync = vi.fn().mockResolvedValue(undefined)
    const mutateDelete = vi.fn()

    useAuthMock.mockReturnValue({ user: { id: 'user-1' } })
    useEditCommentMock.mockReturnValue({ mutateAsync, isPending: false })
    useDeleteCommentMock.mockReturnValue({ mutate: mutateDelete })

    const comment = makeComment({
      updated_at: '2026-03-21T00:00:00Z',
      replies: [makeComment({ id: 'c2', parent_id: 'c1', content: 'nested reply' })],
    })

    render(<CommentItem articleId='a1' comment={comment} />)

    expect(screen.getByText(/edited/)).toBeInTheDocument()

    fireEvent.click(screen.getAllByText('Reply')[0])
    expect(screen.getByTestId('reply-form')).toHaveTextContent('c1')

    fireEvent.click(screen.getAllByText('Edit')[0])
    const editor = screen.getByDisplayValue('Top level comment')
    fireEvent.change(editor, { target: { value: '  updated comment  ' } })
    fireEvent.click(screen.getByRole('button', { name: 'Save' }))

    await waitFor(() => {
      expect(mutateAsync).toHaveBeenCalledWith('updated comment')
    })

    fireEvent.click(screen.getAllByText('Delete')[0])
    expect(mutateDelete).toHaveBeenCalledWith('c1')

    expect(screen.getByText('nested reply')).toBeInTheDocument()
  })
})

import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import CommentForm from '../../../src/components/comments/CommentForm'

const useAuthMock = vi.fn()
const usePostCommentMock = vi.fn()

vi.mock('../../../src/hooks/useAuth', () => ({
  useAuth: () => useAuthMock(),
}))

vi.mock('../../../src/hooks/useComments', () => ({
  usePostComment: (articleId: string) => usePostCommentMock(articleId),
}))

vi.mock('../../../src/components/ui/Avatar', () => ({
  default: ({ name }: { name: string }) => <div data-testid='avatar'>{name}</div>,
}))

describe('CommentForm', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders nothing for guests', () => {
    useAuthMock.mockReturnValue({ user: null })
    usePostCommentMock.mockReturnValue({ mutateAsync: vi.fn(), isPending: false })

    const { container } = render(<CommentForm articleId='article-1' />)
    expect(container.firstChild).toBeNull()
  })

  it('submits trimmed content, resets input, and calls onDone', async () => {
    const mutateAsync = vi.fn().mockResolvedValue(undefined)
    const onDone = vi.fn()

    useAuthMock.mockReturnValue({
      user: { id: 'user-1', name: 'Alex Writer', avatar_url: null },
    })
    usePostCommentMock.mockReturnValue({ mutateAsync, isPending: false })

    render(
      <CommentForm
        articleId='article-1'
        parentId='parent-1'
        onDone={onDone}
        placeholder='Reply here'
      />,
    )

    const textarea = screen.getByPlaceholderText('Reply here')
    fireEvent.change(textarea, { target: { value: '  hello world  ' } })
    fireEvent.click(screen.getByRole('button', { name: 'Post' }))

    await waitFor(() => {
      expect(mutateAsync).toHaveBeenCalledWith({
        content: 'hello world',
        parent_id: 'parent-1',
      })
    })

    expect(onDone).toHaveBeenCalledTimes(1)
    expect(textarea).toHaveValue('')
    expect(screen.getByRole('button', { name: 'Cancel' })).toBeInTheDocument()
  })
})

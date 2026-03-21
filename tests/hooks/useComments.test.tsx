import { act, renderHook, waitFor } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import api from '../../src/lib/api'
import {
  useComments,
  useDeleteComment,
  useEditComment,
  usePostComment,
} from '../../src/hooks/useComments'
import { createQueryClientWrapper } from '../utils/queryClient'

vi.mock('../../src/lib/api', () => ({
  default: {
    get: vi.fn(),
    post: vi.fn(),
    put: vi.fn(),
    delete: vi.fn(),
  },
}))

describe('useComments hooks', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('does not fetch comments when the article id is empty', () => {
    const { Wrapper } = createQueryClientWrapper()
    const { result } = renderHook(() => useComments(''), { wrapper: Wrapper })

    expect(result.current.fetchStatus).toBe('idle')
    expect(api.get).not.toHaveBeenCalled()
  })

  it('fetches comments and supports both data and comments payloads', async () => {
    const comments = [
      {
        id: 'comment-1',
        article_id: 'article-1',
        author_id: 'user-1',
        content: 'First comment',
        is_deleted: 0,
        created_at: '2026-03-20T00:00:00Z',
        updated_at: '2026-03-20T00:00:00Z',
        replies: [],
      },
    ]
    vi.mocked(api.get).mockResolvedValueOnce({ data: { data: comments } })
    vi.mocked(api.get).mockResolvedValueOnce({ data: { comments } })

    const first = createQueryClientWrapper()
    const firstResult = renderHook(() => useComments('article-1'), { wrapper: first.Wrapper })

    await waitFor(() => {
      expect(firstResult.result.current.isSuccess).toBe(true)
    })
    expect(firstResult.result.current.data).toEqual(comments)

    const second = createQueryClientWrapper()
    const secondResult = renderHook(() => useComments('article-1'), { wrapper: second.Wrapper })

    await waitFor(() => {
      expect(secondResult.result.current.isSuccess).toBe(true)
    })
    expect(secondResult.result.current.data).toEqual(comments)
    expect(api.get).toHaveBeenCalledWith('/api/comments', { params: { article_id: 'article-1' } })
  })

  it('invalidates comment queries after posting, editing, and deleting', async () => {
    vi.mocked(api.post).mockResolvedValue({ data: { id: 'comment-1' } })
    vi.mocked(api.put).mockResolvedValue({ data: {} })
    vi.mocked(api.delete).mockResolvedValue({ data: {} })

    const { Wrapper, client } = createQueryClientWrapper()
    const invalidateSpy = vi.spyOn(client, 'invalidateQueries')

    const postHook = renderHook(() => usePostComment('article-1'), { wrapper: Wrapper })
    const editHook = renderHook(() => useEditComment('comment-1', 'article-1'), { wrapper: Wrapper })
    const deleteHook = renderHook(() => useDeleteComment('article-1'), { wrapper: Wrapper })

    await act(async () => {
      await postHook.result.current.mutateAsync({ content: 'Hello' })
      await editHook.result.current.mutateAsync('Updated')
      await deleteHook.result.current.mutateAsync('comment-1')
    })

    expect(api.post).toHaveBeenCalledWith('/api/comments', {
      article_id: 'article-1',
      content: 'Hello',
    })
    expect(api.put).toHaveBeenCalledWith('/api/comments/comment-1', { content: 'Updated' })
    expect(api.delete).toHaveBeenCalledWith('/api/comments/comment-1')
    expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: ['comments', 'article-1'] })
  })
})

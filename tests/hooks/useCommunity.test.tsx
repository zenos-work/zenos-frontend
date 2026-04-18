import { act, renderHook, waitFor } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import api from '../../src/lib/api'
import {
  useCommunitySpace,
  useCommunitySpaces,
  useCreatePost,
  useCreateSpace,
  useJoinSpace,
  useLikePost,
  useSpacePosts,
} from '../../src/hooks/useCommunity'
import { createQueryClientWrapper } from '../utils/queryClient'

vi.mock('../../src/lib/api', () => ({
  default: {
    get: vi.fn(),
    post: vi.fn(),
    put: vi.fn(),
    delete: vi.fn(),
  },
}))

describe('useCommunity hooks', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('fetches spaces, one space, and posts', async () => {
    vi.mocked(api.get)
      .mockResolvedValueOnce({ data: { spaces: [{ id: 's-1', name: 'AI Writers' }], page: 1, limit: 20 } } as never)
      .mockResolvedValueOnce({ data: { id: 's-1', name: 'AI Writers' } } as never)
      .mockResolvedValueOnce({ data: { posts: [{ id: 'p-1', title: 'Hello', body: 'World' }], page: 1, limit: 20 } } as never)

    const a = createQueryClientWrapper()
    const b = createQueryClientWrapper()
    const c = createQueryClientWrapper()

    const spaces = renderHook(() => useCommunitySpaces(true), { wrapper: a.Wrapper })
    const space = renderHook(() => useCommunitySpace('s-1', true), { wrapper: b.Wrapper })
    const posts = renderHook(() => useSpacePosts('s-1', true), { wrapper: c.Wrapper })

    await waitFor(() => {
      expect(spaces.result.current.isSuccess).toBe(true)
      expect(space.result.current.isSuccess).toBe(true)
      expect(posts.result.current.isSuccess).toBe(true)
    })

    expect(api.get).toHaveBeenCalledWith('/api/community', { params: { org_id: undefined, page: 1, limit: 20 } })
    expect(api.get).toHaveBeenCalledWith('/api/community/s-1')
    expect(api.get).toHaveBeenCalledWith('/api/community/s-1/posts', { params: { page: 1, limit: 20 } })
  })

  it('creates space, joins, posts, and likes', async () => {
    vi.mocked(api.post)
      .mockResolvedValueOnce({ data: { id: 's-1' } } as never)
      .mockResolvedValueOnce({ data: { joined: true } } as never)
      .mockResolvedValueOnce({ data: { id: 'p-1' } } as never)
      .mockResolvedValueOnce({ data: { id: 'p-1' } } as never)

    const a = createQueryClientWrapper()
    const b = createQueryClientWrapper()
    const c = createQueryClientWrapper()
    const d = createQueryClientWrapper()

    const createSpace = renderHook(() => useCreateSpace(), { wrapper: a.Wrapper })
    const join = renderHook(() => useJoinSpace('s-1'), { wrapper: b.Wrapper })
    const createPost = renderHook(() => useCreatePost('s-1'), { wrapper: c.Wrapper })
    const likePost = renderHook(() => useLikePost('s-1'), { wrapper: d.Wrapper })

    await act(async () => {
      await createSpace.result.current.mutateAsync({ org_id: 'org-1', name: 'AI Writers', slug: 'ai-writers' })
      await join.result.current.mutateAsync()
      await createPost.result.current.mutateAsync({ title: 'Hello', body: 'World' })
      await likePost.result.current.mutateAsync('p-1')
    })

    expect(api.post).toHaveBeenCalledWith('/api/community', { org_id: 'org-1', name: 'AI Writers', slug: 'ai-writers' })
    expect(api.post).toHaveBeenCalledWith('/api/community/s-1/members')
    expect(api.post).toHaveBeenCalledWith('/api/community/s-1/posts', { title: 'Hello', body: 'World' })
    expect(api.post).toHaveBeenCalledWith('/api/community/s-1/posts/p-1/like')
  })
})

import { act, renderHook, waitFor } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import api from '../../src/lib/api'
import {
  useArticleReactions,
  useRemoveReaction,
  useToggleReaction,
} from '../../src/hooks/useReactions'
import { createQueryClientWrapper } from '../utils/queryClient'

const navigateMock = vi.fn()
const toastMock = vi.fn()
let authState: { user: { id: string } | null } = { user: { id: 'user-1' } }

vi.mock('../../src/lib/api', () => ({
  default: {
    get: vi.fn(),
    post: vi.fn(),
    delete: vi.fn(),
  },
}))

vi.mock('../../src/hooks/useAuth', () => ({
  useAuth: () => authState,
}))

vi.mock('../../src/stores/uiStore', () => ({
  useUiStore: (selector: (state: { toast: typeof toastMock }) => unknown) =>
    selector({ toast: toastMock }),
}))

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual<typeof import('react-router-dom')>('react-router-dom')
  return {
    ...actual,
    useNavigate: () => navigateMock,
  }
})

function createWrapper() {
  const { Wrapper, client } = createQueryClientWrapper()
  const RouterWrapper = ({ children }: { children: React.ReactNode }) => (
    <MemoryRouter>
      <Wrapper>{children}</Wrapper>
    </MemoryRouter>
  )
  return { Wrapper: RouterWrapper, client }
}

describe('useReactions hooks', () => {
  beforeEach(() => {
    authState = { user: { id: 'user-1' } }
    navigateMock.mockReset()
    toastMock.mockReset()
    vi.clearAllMocks()
  })

  it('fetches article reactions and skips requests when article id is empty', async () => {
    vi.mocked(api.get).mockResolvedValue({
      data: {
        article_id: 'article-1',
        reactions: {
          fire: { count: 1, userReacted: false },
          lightbulb: { count: 2, userReacted: true },
          heart: { count: 3, userReacted: false },
          brain: { count: 4, userReacted: false },
        },
      },
    })

    const first = createWrapper()
    const firstResult = renderHook(() => useArticleReactions('article-1'), {
      wrapper: first.Wrapper,
    })

    await waitFor(() => {
      expect(firstResult.result.current.isSuccess).toBe(true)
    })

    expect(api.get).toHaveBeenCalledWith('/api/social/reactions/article-1')

    const second = createWrapper()
    renderHook(() => useArticleReactions(''), { wrapper: second.Wrapper })
    expect(vi.mocked(api.get)).toHaveBeenCalledTimes(1)
  })

  it('redirects unauthenticated users before toggling reactions', async () => {
    authState = { user: null }
    const { Wrapper } = createWrapper()
    const { result } = renderHook(() => useToggleReaction('article-2'), {
      wrapper: Wrapper,
    })

    await act(async () => {
      await result.current.mutateAsync({ reactionType: 'fire' })
    })

    expect(navigateMock).toHaveBeenCalledWith('/login', { replace: true })
    expect(api.post).not.toHaveBeenCalled()
  })

  it('optimistically updates and invalidates reaction queries on success', async () => {
    vi.mocked(api.post).mockResolvedValue({ data: { action: { active: true } } })
    const { Wrapper, client } = createWrapper()
    const invalidateSpy = vi.spyOn(client, 'invalidateQueries')
    client.setQueryData(['reactions', 'article-3'], {
      article_id: 'article-3',
      reactions: {
        fire: { count: 1, userReacted: false },
        lightbulb: { count: 2, userReacted: false },
        heart: { count: 0, userReacted: false },
        brain: { count: 0, userReacted: false },
      },
    })

    const { result } = renderHook(() => useToggleReaction('article-3'), {
      wrapper: Wrapper,
    })

    await act(async () => {
      await result.current.mutateAsync({ reactionType: 'fire' })
    })

    expect(client.getQueryData(['reactions', 'article-3'])).toMatchObject({
      reactions: expect.objectContaining({
        fire: expect.objectContaining({ count: 2, userReacted: true }),
      }),
    })
    expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: ['reactions', 'article-3'] })
  })

  it('rolls back optimistic reaction updates and shows a toast on error', async () => {
    vi.mocked(api.post).mockRejectedValue(new Error('failed'))
    const { Wrapper, client } = createWrapper()
    const original = {
      article_id: 'article-4',
      reactions: {
        fire: { count: 4, userReacted: true },
        lightbulb: { count: 1, userReacted: false },
        heart: { count: 0, userReacted: false },
        brain: { count: 0, userReacted: false },
      },
    }
    client.setQueryData(['reactions', 'article-4'], original)

    const { result } = renderHook(() => useToggleReaction('article-4'), {
      wrapper: Wrapper,
    })

    await expect(result.current.mutateAsync({ reactionType: 'fire' })).rejects.toThrow('failed')

    expect(client.getQueryData(['reactions', 'article-4'])).toEqual(original)
    expect(toastMock).toHaveBeenCalledWith('Failed to update reaction', 'error')
  })

  it('optimistically removes reactions and invalidates on success', async () => {
    vi.mocked(api.delete).mockResolvedValue({ data: {} })
    const { Wrapper, client } = createWrapper()
    const invalidateSpy = vi.spyOn(client, 'invalidateQueries')
    client.setQueryData(['reactions', 'article-5'], {
      article_id: 'article-5',
      reactions: {
        fire: { count: 3, userReacted: true },
        lightbulb: { count: 1, userReacted: false },
        heart: { count: 0, userReacted: false },
        brain: { count: 0, userReacted: false },
      },
    })

    const { result } = renderHook(() => useRemoveReaction('article-5'), {
      wrapper: Wrapper,
    })

    await act(async () => {
      await result.current.mutateAsync({ reactionType: 'fire' })
    })

    expect(client.getQueryData(['reactions', 'article-5'])).toMatchObject({
      reactions: expect.objectContaining({
        fire: expect.objectContaining({ count: 2, userReacted: false }),
      }),
    })
    expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: ['reactions', 'article-5'] })
  })
})

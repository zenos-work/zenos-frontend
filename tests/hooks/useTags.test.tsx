import { renderHook, waitFor } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { useTags } from '../../src/hooks/useTags'
import api from '../../src/lib/api'
import { createQueryClientWrapper } from '../utils/queryClient'

vi.mock('../../src/lib/api', () => ({
  default: {
    get: vi.fn(),
  },
}))

describe('useTags', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('loads all tags through react-query', async () => {
    vi.mocked(api.get).mockResolvedValue({
      data: {
        tags: [
          { id: '1', name: 'Fintech', slug: 'fintech', article_count: 10 },
          { id: '2', name: 'AI', slug: 'ai', article_count: 5 },
        ],
      },
    })

    const { Wrapper } = createQueryClientWrapper()
    const { result } = renderHook(() => useTags(), { wrapper: Wrapper })

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true)
    })

    expect(api.get).toHaveBeenCalledWith('/api/tags', { params: undefined })
    expect(result.current.data).toEqual([
      { id: '1', name: 'Fintech', slug: 'fintech', article_count: 10 },
      { id: '2', name: 'AI', slug: 'ai', article_count: 5 },
    ])
  })

  it('loads onboarding tags when onboarding option is enabled', async () => {
    vi.mocked(api.get).mockResolvedValue({
      data: {
        tags: [
          { id: '3', name: 'Technology', slug: 'technology', is_onboarding_category: 1, article_count: 0 },
        ],
      },
    })

    const { Wrapper } = createQueryClientWrapper()
    const { result } = renderHook(() => useTags({ onboarding: true }), { wrapper: Wrapper })

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true)
    })

    expect(api.get).toHaveBeenCalledWith('/api/tags', { params: { onboarding: 1 } })
    expect(result.current.data?.[0].slug).toBe('technology')
  })
})

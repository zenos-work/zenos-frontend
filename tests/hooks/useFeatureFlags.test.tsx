import { renderHook, waitFor } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import api from '../../src/lib/api'
import { useFeatureFlag, useFeatureFlags } from '../../src/hooks/useFeatureFlags'
import { createQueryClientWrapper } from '../utils/queryClient'

vi.mock('../../src/lib/api', () => ({
  default: {
    get: vi.fn(),
  },
}))

describe('useFeatureFlags', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('normalizes feature list from /api/features', async () => {
    vi.mocked(api.get).mockResolvedValue({
      data: {
        flags: [
          { flag_key: 'reading_lists', enabled: true },
          { key: 'workflow_builder', is_active: 0 },
        ],
      },
    } as never)

    const { Wrapper } = createQueryClientWrapper()
    const { result } = renderHook(() => useFeatureFlags(), { wrapper: Wrapper })

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true)
    })

    expect(api.get).toHaveBeenCalledWith('/api/features')
    expect(result.current.flags.reading_lists.enabled).toBe(true)
    expect(result.current.flags.workflow_builder.enabled).toBe(false)
  })

  it('returns false by default for unknown flag key', async () => {
    vi.mocked(api.get).mockResolvedValue({ data: { flags: [] } } as never)

    const { Wrapper } = createQueryClientWrapper()
    const { result } = renderHook(() => useFeatureFlag('missing_feature'), { wrapper: Wrapper })

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false)
    })

    expect(result.current.enabled).toBe(false)
  })

  it('does not fetch when disabled', () => {
    const { Wrapper } = createQueryClientWrapper()
    const { result } = renderHook(() => useFeatureFlags(false), { wrapper: Wrapper })

    expect(result.current.fetchStatus).toBe('idle')
    expect(api.get).not.toHaveBeenCalled()
  })
})

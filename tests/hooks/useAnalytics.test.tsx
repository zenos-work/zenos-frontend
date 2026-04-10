import { act, renderHook, waitFor } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import api from '../../src/lib/api'
import { useAnalyticsDashboard, useAnalyticsEvents, useAnalyticsGoals, useCreateGoal } from '../../src/hooks/useAnalytics'
import { createQueryClientWrapper } from '../utils/queryClient'

vi.mock('../../src/lib/api', () => ({
  default: {
    get: vi.fn(),
    post: vi.fn(),
    put: vi.fn(),
    delete: vi.fn(),
  },
}))

describe('useAnalytics hooks', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('fetches dashboard summary, goals, and events', async () => {
    vi.mocked(api.get)
      .mockResolvedValueOnce({ data: { breakdown: [{ category: 'article', count: 22 }] } } as never)
      .mockResolvedValueOnce({ data: { conversions: [{ goal: 'Subscribe', count: 4, total_value_cents: 6000 }] } } as never)
      .mockResolvedValueOnce({ data: { experiments: [{ id: 'e1', name: 'Headline', variants: [] }] } } as never)
      .mockResolvedValueOnce({ data: { goals: [{ id: 'g1', name: 'Subscribe' }] } } as never)
      .mockResolvedValueOnce({ data: { events: [{ id: 'ev1' }], page: 1, limit: 50 } } as never)

    const a = createQueryClientWrapper()
    const b = createQueryClientWrapper()
    const c = createQueryClientWrapper()

    const dashboard = renderHook(
      () => useAnalyticsDashboard({ start: '2026-01-01', end: '2026-02-01' }, 'org-1', true),
      { wrapper: a.Wrapper },
    )
    const goals = renderHook(() => useAnalyticsGoals('org-1', true), { wrapper: b.Wrapper })
    const events = renderHook(() => useAnalyticsEvents({ orgId: 'org-1' }, true), { wrapper: c.Wrapper })

    await waitFor(() => {
      expect(dashboard.result.current.isSuccess).toBe(true)
      expect(goals.result.current.isSuccess).toBe(true)
      expect(events.result.current.isSuccess).toBe(true)
    })

    expect(api.get).toHaveBeenCalledWith('/api/analytics/dashboard/events', {
      params: { org_id: 'org-1', start: '2026-01-01', end: '2026-02-01' },
    })
    expect(api.get).toHaveBeenCalledWith('/api/analytics/goals', { params: { org_id: 'org-1' } })
    expect(api.get).toHaveBeenCalledWith('/api/analytics/events', { params: { org_id: 'org-1', page: 1, limit: 50 } })
  })

  it('creates analytics goal', async () => {
    vi.mocked(api.post).mockResolvedValueOnce({ data: { id: 'g2' } } as never)

    const wrapper = createQueryClientWrapper()
    const createGoal = renderHook(() => useCreateGoal('org-1'), { wrapper: wrapper.Wrapper })

    await act(async () => {
      await createGoal.result.current.mutateAsync({
        name: 'Paid conversion',
        goal_type: 'subscription',
        target_event_category: 'billing',
        target_event_action: 'upgrade',
      })
    })

    expect(api.post).toHaveBeenCalledWith('/api/analytics/goals', {
      org_id: 'org-1',
      name: 'Paid conversion',
      goal_type: 'subscription',
      target_event_category: 'billing',
      target_event_action: 'upgrade',
    })
  })
})

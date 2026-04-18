import { act, renderHook, waitFor } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import api from '../../src/lib/api'
import { useCreatePodcast, usePodcasts } from '../../src/hooks/usePodcasts'
import { useCreateIssue, usePublicationIssues } from '../../src/hooks/usePublications'
import { useCreateAbTest, useAbTests } from '../../src/hooks/useMarketing'
import { useCreateLeadContact, useLeadContacts } from '../../src/hooks/useLeads'
import { useGenerateCode, useReferralStats } from '../../src/hooks/useReferrals'
import { useCreateAlertRule, useUsageAlerts } from '../../src/hooks/useUsage'
import { useCreateWorkflowCostRate, useWorkflowCostSummaries } from '../../src/hooks/useWorkflowCosts'
import { createQueryClientWrapper } from '../utils/queryClient'

vi.mock('../../src/lib/api', () => ({
  default: {
    get: vi.fn(),
    post: vi.fn(),
    put: vi.fn(),
    delete: vi.fn(),
  },
}))

describe('P4 hooks', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('fetches P4 listing queries', async () => {
    vi.mocked(api.get)
      .mockResolvedValueOnce({ data: { shows: [{ id: 'p-1', title: 'Show' }], page: 1, limit: 20 } } as never)
      .mockResolvedValueOnce({ data: { issues: [{ id: 'i-1', title: 'Issue' }], page: 1, limit: 20 } } as never)
      .mockResolvedValueOnce({ data: { campaigns: [{ id: 'c-1', name: 'A/B #1' }], page: 1, limit: 20 } } as never)
      .mockResolvedValueOnce({ data: { leads: [{ id: 'l-1', email: 'lead@example.com' }], page: 1, limit: 20 } } as never)
      .mockResolvedValueOnce({ data: { total_clicks: 1, total_signups: 1 } } as never)
      .mockResolvedValueOnce({ data: { rules: [{ id: 'r-1', name: 'Budget', alert_type: 'budget' }] } } as never)
      .mockResolvedValueOnce({ data: { summaries: [{ workflow_id: 'w-1', total_cost_microcents: 1200 }] } } as never)

    const a = createQueryClientWrapper()
    const b = createQueryClientWrapper()
    const c = createQueryClientWrapper()
    const d = createQueryClientWrapper()
    const e = createQueryClientWrapper()
    const f = createQueryClientWrapper()
    const g = createQueryClientWrapper()

    const podcasts = renderHook(() => usePodcasts(true), { wrapper: a.Wrapper })
    const publications = renderHook(() => usePublicationIssues(true), { wrapper: b.Wrapper })
    const abTests = renderHook(() => useAbTests('org-1', true), { wrapper: c.Wrapper })
    const leads = renderHook(() => useLeadContacts('org-1', true), { wrapper: d.Wrapper })
    const referrals = renderHook(() => useReferralStats(true), { wrapper: e.Wrapper })
    const usage = renderHook(() => useUsageAlerts('org-1', true), { wrapper: f.Wrapper })
    const costs = renderHook(() => useWorkflowCostSummaries('org-1', true), { wrapper: g.Wrapper })

    await waitFor(() => {
      expect(podcasts.result.current.isSuccess).toBe(true)
      expect(publications.result.current.isSuccess).toBe(true)
      expect(abTests.result.current.isSuccess).toBe(true)
      expect(leads.result.current.isSuccess).toBe(true)
      expect(referrals.result.current.isSuccess).toBe(true)
      expect(usage.result.current.isSuccess).toBe(true)
      expect(costs.result.current.isSuccess).toBe(true)
    })
  })

  it('runs P4 creation mutations', async () => {
    vi.mocked(api.post)
      .mockResolvedValueOnce({ data: { id: 'p-1' } } as never)
      .mockResolvedValueOnce({ data: { id: 'i-1' } } as never)
      .mockResolvedValueOnce({ data: { id: 'c-1' } } as never)
      .mockResolvedValueOnce({ data: { id: 'l-1' } } as never)
      .mockResolvedValueOnce({ data: { code: 'REFCODE' } } as never)
      .mockResolvedValueOnce({ data: { id: 'r-1' } } as never)
      .mockResolvedValueOnce({ data: { id: 'rate-1' } } as never)

    const a = createQueryClientWrapper()
    const b = createQueryClientWrapper()
    const c = createQueryClientWrapper()
    const d = createQueryClientWrapper()
    const e = createQueryClientWrapper()
    const f = createQueryClientWrapper()
    const g = createQueryClientWrapper()

    const createPodcast = renderHook(() => useCreatePodcast(), { wrapper: a.Wrapper })
    const createIssue = renderHook(() => useCreateIssue(), { wrapper: b.Wrapper })
    const createAbTest = renderHook(() => useCreateAbTest(), { wrapper: c.Wrapper })
    const createLead = renderHook(() => useCreateLeadContact(), { wrapper: d.Wrapper })
    const generateCode = renderHook(() => useGenerateCode(), { wrapper: e.Wrapper })
    const createAlert = renderHook(() => useCreateAlertRule('org-1'), { wrapper: f.Wrapper })
    const createRate = renderHook(() => useCreateWorkflowCostRate('org-1'), { wrapper: g.Wrapper })

    await act(async () => {
      await createPodcast.result.current.mutateAsync({ title: 'Show', slug: 'show' })
      await createIssue.result.current.mutateAsync({ title: 'Issue', slug: 'issue-1' })
      await createAbTest.result.current.mutateAsync({ org_id: 'org-1', name: 'A/B #1' })
      await createLead.result.current.mutateAsync({ org_id: 'org-1', email: 'lead@example.com' })
      await generateCode.result.current.mutateAsync()
      await createAlert.result.current.mutateAsync({ name: 'Budget', alert_type: 'budget', threshold_value: 80 })
      await createRate.result.current.mutateAsync({ node_type_id: 'llm', cost_model: 'per_execution', rate_microcents: 100 })
    })

    expect(api.post).toHaveBeenCalledWith('/api/podcasts', { title: 'Show', slug: 'show' })
    expect(api.post).toHaveBeenCalledWith('/api/publications/issues', { title: 'Issue', slug: 'issue-1' })
    expect(api.post).toHaveBeenCalledWith('/api/marketing/campaigns', { org_id: 'org-1', name: 'A/B #1' })
    expect(api.post).toHaveBeenCalledWith('/api/leads', { org_id: 'org-1', email: 'lead@example.com' })
    expect(api.post).toHaveBeenCalledWith('/api/referrals')
    expect(api.post).toHaveBeenCalledWith('/api/usage/alerts', { name: 'Budget', alert_type: 'budget', threshold_value: 80, org_id: 'org-1' })
    expect(api.post).toHaveBeenCalledWith('/api/workflow-costs/rates', { node_type_id: 'llm', cost_model: 'per_execution', rate_microcents: 100, org_id: 'org-1' })
  })
})

import { act, renderHook, waitFor } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import api from '../../src/lib/api'
import {
  useAddSubscriber,
  useCreateIssue,
  useCreateNewsletter,
  useMyNewsletters,
  useNewsletterIssues,
  useNewsletterSubscribers,
  useSendIssue,
} from '../../src/hooks/useNewsletters'
import { createQueryClientWrapper } from '../utils/queryClient'

vi.mock('../../src/lib/api', () => ({
  default: {
    get: vi.fn(),
    post: vi.fn(),
    put: vi.fn(),
    delete: vi.fn(),
  },
}))

describe('useNewsletters hooks', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('fetches newsletters, subscribers, and issues', async () => {
    vi.mocked(api.get)
      .mockResolvedValueOnce({ data: { newsletters: [{ id: 'n1', name: 'Weekly', slug: 'weekly' }] } } as never)
      .mockResolvedValueOnce({ data: { subscribers: [{ id: 's1', email: 'a@b.com', status: 'subscribed' }], page: 1, limit: 20 } } as never)
      .mockResolvedValueOnce({ data: { issues: [{ id: 'i1', subject: 'Issue 1', status: 'draft' }], page: 1, limit: 20 } } as never)

    const a = createQueryClientWrapper()
    const b = createQueryClientWrapper()
    const c = createQueryClientWrapper()

    const newsletters = renderHook(() => useMyNewsletters(true, 'org-1'), { wrapper: a.Wrapper })
    const subscribers = renderHook(() => useNewsletterSubscribers('n1', true), { wrapper: b.Wrapper })
    const issues = renderHook(() => useNewsletterIssues('n1', true), { wrapper: c.Wrapper })

    await waitFor(() => {
      expect(newsletters.result.current.isSuccess).toBe(true)
      expect(subscribers.result.current.isSuccess).toBe(true)
      expect(issues.result.current.isSuccess).toBe(true)
    })

    expect(api.get).toHaveBeenCalledWith('/api/newsletters', { params: { org_id: 'org-1' } })
    expect(api.get).toHaveBeenCalledWith('/api/newsletters/n1/subscribers', { params: { page: 1, limit: 20 } })
    expect(api.get).toHaveBeenCalledWith('/api/newsletters/n1/issues', { params: { page: 1, limit: 20 } })
  })

  it('creates newsletter, adds subscriber, creates issue, and sends issue', async () => {
    vi.mocked(api.post)
      .mockResolvedValueOnce({ data: { id: 'n1' } } as never)
      .mockResolvedValueOnce({ data: { id: 's1' } } as never)
      .mockResolvedValueOnce({ data: { id: 'i1' } } as never)
      .mockResolvedValueOnce({ data: { id: 'i1' } } as never)

    const a = createQueryClientWrapper()
    const b = createQueryClientWrapper()
    const c = createQueryClientWrapper()
    const d = createQueryClientWrapper()

    const createNewsletter = renderHook(() => useCreateNewsletter(), { wrapper: a.Wrapper })
    const addSubscriber = renderHook(() => useAddSubscriber('n1'), { wrapper: b.Wrapper })
    const createIssue = renderHook(() => useCreateIssue('n1'), { wrapper: c.Wrapper })
    const sendIssue = renderHook(() => useSendIssue('n1'), { wrapper: d.Wrapper })

    await act(async () => {
      await createNewsletter.result.current.mutateAsync({ org_id: 'org-1', name: 'Weekly', slug: 'weekly' })
      await addSubscriber.result.current.mutateAsync({ email: 'reader@zenos.work' })
      await createIssue.result.current.mutateAsync({ subject: 'April update' })
      await sendIssue.result.current.mutateAsync('i1')
    })

    expect(api.post).toHaveBeenCalledWith('/api/newsletters', { org_id: 'org-1', name: 'Weekly', slug: 'weekly' })
    expect(api.post).toHaveBeenCalledWith('/api/newsletters/n1/subscribers', { email: 'reader@zenos.work' })
    expect(api.post).toHaveBeenCalledWith('/api/newsletters/n1/issues', { subject: 'April update' })
    expect(api.post).toHaveBeenCalledWith('/api/newsletters/n1/issues/i1/send')
  })
})

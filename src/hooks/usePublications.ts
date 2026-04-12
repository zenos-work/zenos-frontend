import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import api from '../lib/api'

export type PublicationSubscription = {
  id: string
  email: string
  status?: string
  source?: string
}

export type PublicationIssue = {
  id: string
  issue_type?: string
  title: string
  slug?: string
  status?: string
  period_start?: string
  period_end?: string
}

export type PublicationIssueItem = {
  id: string
  issue_id: string
  article_id?: string
  section?: string
  position?: number
  item_type?: string
  title?: string
  excerpt?: string
}

const publicationKeys = {
  all: ['publications'] as const,
  subscriptions: (page: number, limit: number) => [...publicationKeys.all, 'subscriptions', page, limit] as const,
  issues: (page: number, limit: number) => [...publicationKeys.all, 'issues', page, limit] as const,
  issueItems: (issueId: string) => [...publicationKeys.all, 'issue-items', issueId] as const,
}

export const usePublicationSubscriptions = (enabled = true, page = 1, limit = 20) =>
  useQuery({
    queryKey: publicationKeys.subscriptions(page, limit),
    enabled,
    queryFn: () => api.get<{ subscriptions: PublicationSubscription[]; page: number; limit: number }>('/api/publications/subscriptions', { params: { page, limit } }).then((r) => r.data),
  })

export const useCreateSubscription = () => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (payload: { email: string; source?: string }) => api.post<{ id: string }>('/api/publications/subscriptions', payload).then((r) => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: publicationKeys.subscriptions(1, 20).slice(0, 3) }),
  })
}

export const useDeleteSubscription = () => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (subscriptionId: string) => api.delete<{ deleted: boolean }>(`/api/publications/subscriptions/${subscriptionId}`).then((r) => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: publicationKeys.subscriptions(1, 20).slice(0, 3) }),
  })
}

export const usePublicationIssues = (enabled = true, page = 1, limit = 20) =>
  useQuery({
    queryKey: publicationKeys.issues(page, limit),
    enabled,
    queryFn: () => api.get<{ issues: PublicationIssue[]; page: number; limit: number }>('/api/publications/issues', { params: { page, limit } }).then((r) => r.data),
  })

export const useCreateIssue = () => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (payload: { issue_type?: string; title: string; slug: string; period_start?: string; period_end?: string; status?: string }) =>
      api.post<{ id: string }>('/api/publications/issues', payload).then((r) => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: publicationKeys.issues(1, 20).slice(0, 3) }),
  })
}

export const useDeleteIssue = () => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (issueId: string) => api.delete<{ deleted: boolean }>(`/api/publications/issues/${issueId}`).then((r) => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: publicationKeys.issues(1, 20).slice(0, 3) }),
  })
}

export const useIssueItems = (issueId: string, enabled = true) =>
  useQuery({
    queryKey: publicationKeys.issueItems(issueId),
    enabled: enabled && !!issueId,
    queryFn: () => api.get<{ items: PublicationIssueItem[] }>(`/api/publications/issues/${issueId}/items`).then((r) => r.data),
  })

export const useCreateIssueItem = (issueId: string) => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (payload: { article_id?: string; section?: string; position?: number; item_type?: string; title?: string; excerpt?: string; include_full_content?: boolean }) =>
      api.post<{ id: string }>(`/api/publications/issues/${issueId}/items`, payload).then((r) => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: publicationKeys.issueItems(issueId) }),
  })
}

export const useDeleteIssueItem = (issueId: string) => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (itemId: string) => api.delete<{ deleted: boolean }>(`/api/publications/issues/${issueId}/items/${itemId}`).then((r) => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: publicationKeys.issueItems(issueId) }),
  })
}

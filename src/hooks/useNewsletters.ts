import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import api from '../lib/api'

export type Newsletter = {
  id: string
  org_id: string
  owner_id: string
  name: string
  slug: string
  description?: string
  subscriber_count?: number
  status?: string
}

export type NewsletterSubscriber = {
  id: string
  newsletter_id: string
  email: string
  first_name?: string
  last_name?: string
  status?: string
}

export type NewsletterIssue = {
  id: string
  newsletter_id: string
  subject: string
  preview_text?: string
  status?: string
  scheduled_at?: string
}

export type NewsletterIssueArticle = {
  issue_id: string
  article_id: string
  sort_order?: number
  blurb?: string
}

const newsletterKeys = {
  all: ['newsletters'] as const,
  list: (orgId?: string) => [...newsletterKeys.all, 'list', orgId ?? 'owner'] as const,
  subscribers: (newsletterId: string, page: number, limit: number) => [...newsletterKeys.all, 'subscribers', newsletterId, page, limit] as const,
  issues: (newsletterId: string, page: number, limit: number) => [...newsletterKeys.all, 'issues', newsletterId, page, limit] as const,
  issueArticles: (newsletterId: string, issueId: string) => [...newsletterKeys.all, 'issue-articles', newsletterId, issueId] as const,
}

export const useMyNewsletters = (enabled = true, orgId?: string) =>
  useQuery({
    queryKey: newsletterKeys.list(orgId),
    enabled,
    queryFn: () => api.get<{ newsletters: Newsletter[] }>('/api/newsletters', { params: { org_id: orgId } }).then((r) => r.data),
  })

export const useCreateNewsletter = () => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (payload: {
      org_id: string
      name: string
      slug: string
      description?: string
      from_name?: string
      from_email?: string
      reply_to_email?: string
    }) => api.post<{ id: string }>('/api/newsletters', payload).then((r) => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: newsletterKeys.all }),
  })
}

export const useUpdateNewsletter = () => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ newsletterId, payload }: { newsletterId: string; payload: Partial<Newsletter> }) =>
      api.put<{ id: string }>(`/api/newsletters/${newsletterId}`, payload).then((r) => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: newsletterKeys.all }),
  })
}

export const useDeleteNewsletter = () => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (newsletterId: string) => api.delete<{ deleted: boolean }>(`/api/newsletters/${newsletterId}`).then((r) => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: newsletterKeys.all }),
  })
}

export const useNewsletterSubscribers = (newsletterId: string, enabled = true, page = 1, limit = 20) =>
  useQuery({
    queryKey: newsletterKeys.subscribers(newsletterId, page, limit),
    enabled: enabled && !!newsletterId,
    queryFn: () =>
      api
        .get<{ subscribers: NewsletterSubscriber[]; page: number; limit: number }>(`/api/newsletters/${newsletterId}/subscribers`, {
          params: { page, limit },
        })
        .then((r) => r.data),
  })

export const useAddSubscriber = (newsletterId: string) => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (payload: { email: string; first_name?: string; last_name?: string; source?: string }) =>
      api.post<{ id: string }>(`/api/newsletters/${newsletterId}/subscribers`, payload).then((r) => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: newsletterKeys.subscribers(newsletterId, 1, 20).slice(0, 3) }),
  })
}

export const useUpdateSubscriberStatus = (newsletterId: string) => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ subscriberId, status }: { subscriberId: string; status: string }) =>
      api.put<{ id: string }>(`/api/newsletters/${newsletterId}/subscribers/${subscriberId}`, { status }).then((r) => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: newsletterKeys.subscribers(newsletterId, 1, 20).slice(0, 3) }),
  })
}

export const useRemoveSubscriber = (newsletterId: string) => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (subscriberId: string) =>
      api.delete<{ deleted: boolean }>(`/api/newsletters/${newsletterId}/subscribers/${subscriberId}`).then((r) => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: newsletterKeys.subscribers(newsletterId, 1, 20).slice(0, 3) }),
  })
}

export const useNewsletterIssues = (newsletterId: string, enabled = true, page = 1, limit = 20) =>
  useQuery({
    queryKey: newsletterKeys.issues(newsletterId, page, limit),
    enabled: enabled && !!newsletterId,
    queryFn: () =>
      api
        .get<{ issues: NewsletterIssue[]; page: number; limit: number }>(`/api/newsletters/${newsletterId}/issues`, {
          params: { page, limit },
        })
        .then((r) => r.data),
  })

export const useCreateIssue = (newsletterId: string) => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (payload: {
      subject: string
      preview_text?: string
      body_html?: string
      body_text?: string
      issue_type?: string
      article_ids?: string[]
      status?: string
      scheduled_at?: string
    }) => api.post<{ id: string }>(`/api/newsletters/${newsletterId}/issues`, payload).then((r) => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: newsletterKeys.issues(newsletterId, 1, 20).slice(0, 3) }),
  })
}

export const useUpdateIssue = (newsletterId: string) => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ issueId, payload }: { issueId: string; payload: Partial<NewsletterIssue> }) =>
      api.put<{ id: string }>(`/api/newsletters/${newsletterId}/issues/${issueId}`, payload).then((r) => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: newsletterKeys.issues(newsletterId, 1, 20).slice(0, 3) }),
  })
}

export const useDeleteIssue = (newsletterId: string) => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (issueId: string) => api.delete<{ deleted: boolean }>(`/api/newsletters/${newsletterId}/issues/${issueId}`).then((r) => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: newsletterKeys.issues(newsletterId, 1, 20).slice(0, 3) }),
  })
}

export const useIssueArticles = (newsletterId: string, issueId: string, enabled = true) =>
  useQuery({
    queryKey: newsletterKeys.issueArticles(newsletterId, issueId),
    enabled: enabled && !!newsletterId && !!issueId,
    queryFn: () => api.get<{ articles: NewsletterIssueArticle[] }>(`/api/newsletters/${newsletterId}/issues/${issueId}/articles`).then((r) => r.data),
  })

export const useAddArticleToIssue = (newsletterId: string, issueId: string) => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (payload: { article_id: string; sort_order?: number; blurb?: string }) =>
      api.post<{ added: boolean }>(`/api/newsletters/${newsletterId}/issues/${issueId}/articles`, payload).then((r) => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: newsletterKeys.issueArticles(newsletterId, issueId) }),
  })
}

export const useRemoveArticleFromIssue = (newsletterId: string, issueId: string) => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (articleId: string) =>
      api.delete<{ deleted: boolean }>(`/api/newsletters/${newsletterId}/issues/${issueId}/articles/${articleId}`).then((r) => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: newsletterKeys.issueArticles(newsletterId, issueId) }),
  })
}

export const useSendIssue = (newsletterId: string) => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (issueId: string) => api.post<{ id: string }>(`/api/newsletters/${newsletterId}/issues/${issueId}/send`).then((r) => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: newsletterKeys.issues(newsletterId, 1, 20).slice(0, 3) }),
  })
}

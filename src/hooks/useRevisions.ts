import { useQuery } from '@tanstack/react-query'
import api from '../lib/api'
import type { ArticleRevision, ArticleRevisionDetail, PaginationMeta } from '../types'

type ArticleRevisionsResponse = {
  revisions: ArticleRevision[]
  pagination: PaginationMeta
}

export const useArticleRevisions = (articleId: string, enabled = true) =>
  useQuery({
    queryKey: ['articles', articleId, 'revisions'],
    enabled: enabled && !!articleId,
    queryFn: () =>
      api.get<ArticleRevisionsResponse>(`/api/articles/${articleId}/revisions`).then((r) => r.data),
  })

export const useArticleRevision = (articleId: string, versionNumber?: number, enabled = true) =>
  useQuery({
    queryKey: ['articles', articleId, 'revisions', versionNumber],
    enabled: enabled && !!articleId && versionNumber !== undefined,
    queryFn: () =>
      api.get<ArticleRevisionDetail>(`/api/articles/${articleId}/revisions/${versionNumber}`).then((r) => r.data),
  })

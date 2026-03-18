import { useQuery } from '@tanstack/react-query'
import api from '../lib/api'
import type { ArticleList, Tag, User, PaginatedResponse } from '../types'

export type SearchType = 'articles' | 'tags' | 'authors' | 'all'

export type SearchAllResponse = {
  query: string
  articles: { items: ArticleList[]; total: number }
  tags: { items: Tag[]; total: number }
  authors: { items: User[]; total: number }
}

export const useSearchAll = (q: string, enabled = true) =>
  useQuery({
    queryKey: ['search', 'all', q],
    enabled: enabled && q.trim().length >= 2,
    queryFn: () =>
      api
        .get<SearchAllResponse>('/api/search', {
          params: { q, type: 'all' },
        })
        .then((r) => r.data),
  })

export const useSearchArticles = (q: string, page = 1, enabled = true) =>
  useQuery({
    queryKey: ['search', 'articles', q, page],
    enabled: enabled && q.trim().length >= 2,
    queryFn: () =>
      api
        .get<PaginatedResponse<ArticleList>>('/api/search', {
          params: { q, type: 'articles', page },
        })
        .then((r) => r.data),
  })

export const useSearchTags = (q: string, page = 1, enabled = true) =>
  useQuery({
    queryKey: ['search', 'tags', q, page],
    enabled: enabled && q.trim().length >= 2,
    queryFn: () =>
      api
        .get<PaginatedResponse<Tag>>('/api/search', {
          params: { q, type: 'tags', page },
        })
        .then((r) => r.data),
  })

export const useSearchAuthors = (q: string, page = 1, enabled = true) =>
  useQuery({
    queryKey: ['search', 'authors', q, page],
    enabled: enabled && q.trim().length >= 2,
    queryFn: () =>
      api
        .get<PaginatedResponse<User>>('/api/search', {
          params: { q, type: 'authors', page },
        })
        .then((r) => r.data),
  })

import { useInfiniteQuery, useQuery } from '@tanstack/react-query'
import api from '../lib/api'
import type { FeedResponse, ArticleList } from '../types'

export const useFeed = (
  feedType: 'home' | 'following' | 'trending' = 'home',
  enabled = true,
) =>
  useInfiniteQuery({
    queryKey: ['feed', feedType],
    queryFn:  ({ pageParam = 1 }) =>
      api.get<FeedResponse>(`/api/feed/${feedType}`, {
        params: { page: pageParam },
      }).then(r => r.data),
    initialPageParam: 1,
    enabled,
    getNextPageParam: (last) => last.has_more ? last.page + 1 : undefined,
  })

export const useFeatured = () =>
  useQuery({
    queryKey: ['feed', 'featured'],
    queryFn:  () =>
      api.get<{ articles: ArticleList[] }>('/api/feed/featured')
         .then(r => r.data.articles),
    staleTime: 1000 * 60 * 10, // featured changes slowly
  })

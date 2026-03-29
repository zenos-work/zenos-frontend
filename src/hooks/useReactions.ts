import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useAuth } from './useAuth'
import { useNavigate } from 'react-router-dom'
import { useUiStore } from '../stores/uiStore'
import type { ReactionType } from '../types/reading'
import api from '../lib/api'

type ReactionBucket = Record<ReactionType, { count: number; userReacted: boolean }>
type ReactionsResponse = {
  article_id: string
  reactions: ReactionBucket
}

export function useArticleReactions(articleId: string) {
  return useQuery({
    queryKey: ['reactions', articleId],
    queryFn: async () => {
      const response = await api.get<ReactionsResponse>(`/api/social/reactions/${articleId}`)
      return response.data
    },
    enabled: !!articleId,
    staleTime: 30000,
  })
}

export function useToggleReaction(articleId: string) {
  const { user } = useAuth()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const toast = useUiStore((s) => s.toast)

  return useMutation({
    mutationFn: async ({ reactionType }: { reactionType: ReactionType }) => {
      if (!user) {
        navigate('/login', { replace: true })
        return
      }

      const response = await api.post<{ action: { active: boolean } }>(`/api/social/reactions/${articleId}`, {
        reaction_type: reactionType,
      })
      return response.data
    },
    onMutate: async ({ reactionType }) => {
      if (!user) return

      // Optimistic update
      const previousReactions = queryClient.getQueryData(['reactions', articleId])
      queryClient.setQueryData(['reactions', articleId], (old: ReactionsResponse | undefined) => {
        if (!old) return old

        const reaction = old.reactions?.[reactionType]
        return {
          ...old,
          reactions: {
            ...old.reactions,
            [reactionType]: {
              ...reaction,
              userReacted: !reaction?.userReacted,
              count: reaction?.userReacted ? (reaction.count || 1) - 1 : (reaction?.count || 0) + 1,
            },
          },
        }
      })

      return { previousReactions }
    },
    onError: (_error, _variables, context) => {
      if (context?.previousReactions) {
        queryClient.setQueryData(['reactions', articleId], context.previousReactions)
      }
      toast('Failed to update reaction', 'error')
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['reactions', articleId] })
    },
  })
}

export function useRemoveReaction(articleId: string) {
  const { user } = useAuth()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const toast = useUiStore((s) => s.toast)

  return useMutation({
    mutationFn: async ({ reactionType }: { reactionType: ReactionType }) => {
      if (!user) {
        navigate('/login', { replace: true })
        return
      }

      const response = await api.delete(`/api/social/reactions/${articleId}/${reactionType}`)
      return response.data
    },
    onMutate: async ({ reactionType }) => {
      const previousReactions = queryClient.getQueryData(['reactions', articleId])
      queryClient.setQueryData(['reactions', articleId], (old: ReactionsResponse | undefined) => {
        if (!old) return old

        const reaction = old.reactions?.[reactionType]
        return {
          ...old,
          reactions: {
            ...old.reactions,
            [reactionType]: {
              ...reaction,
              userReacted: false,
              count: Math.max((reaction?.count || 1) - 1, 0),
            },
          },
        }
      })

      return { previousReactions }
    },
    onError: (_error, _variables, context) => {
      if (context?.previousReactions) {
        queryClient.setQueryData(['reactions', articleId], context.previousReactions)
      }
      toast('Failed to remove reaction', 'error')
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['reactions', articleId] })
    },
  })
}

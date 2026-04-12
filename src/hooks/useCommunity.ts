import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import api from '../lib/api'

export type CommunitySpace = {
  id: string
  org_id?: string
  name: string
  slug: string
  description?: string
  space_type?: string
  member_count?: number
}

export type CommunityPost = {
  id: string
  space_id: string
  author_id: string
  title: string
  body: string
  post_type?: string
  like_count?: number
}

const communityKeys = {
  all: ['community'] as const,
  spaces: (orgId?: string, page = 1, limit = 20) => [...communityKeys.all, 'spaces', orgId ?? 'public', page, limit] as const,
  space: (spaceId: string) => [...communityKeys.all, 'space', spaceId] as const,
  posts: (spaceId: string, page = 1, limit = 20) => [...communityKeys.all, 'posts', spaceId, page, limit] as const,
  members: (spaceId: string, page = 1, limit = 20) => [...communityKeys.all, 'members', spaceId, page, limit] as const,
}

export const useCommunitySpaces = (enabled = true, orgId?: string, page = 1, limit = 20) =>
  useQuery({
    queryKey: communityKeys.spaces(orgId, page, limit),
    enabled,
    queryFn: () =>
      api
        .get<{ spaces: CommunitySpace[]; page: number; limit: number }>('/api/community', {
          params: { org_id: orgId, page, limit },
        })
        .then((r) => r.data),
  })

export const useCommunitySpace = (spaceId: string, enabled = true) =>
  useQuery({
    queryKey: communityKeys.space(spaceId),
    enabled: enabled && !!spaceId,
    queryFn: () => api.get<CommunitySpace>(`/api/community/${spaceId}`).then((r) => r.data),
  })

export const useCreateSpace = () => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (payload: {
      org_id: string
      name: string
      slug: string
      description?: string
      space_type?: string
    }) => api.post<{ id: string }>('/api/community', payload).then((r) => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: communityKeys.all }),
  })
}

export const useSpaceMembers = (spaceId: string, enabled = true, page = 1, limit = 20) =>
  useQuery({
    queryKey: communityKeys.members(spaceId, page, limit),
    enabled: enabled && !!spaceId,
    queryFn: () => api.get<{ members: Array<{ user_id: string; org_role: string }>; page: number; limit: number }>(`/api/community/${spaceId}/members`, { params: { page, limit } }).then((r) => r.data),
  })

export const useJoinSpace = (spaceId: string) => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: () => api.post<{ joined: boolean }>(`/api/community/${spaceId}/members`).then((r) => r.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: communityKeys.members(spaceId, 1, 20).slice(0, 3) })
      qc.invalidateQueries({ queryKey: communityKeys.spaces(undefined, 1, 20).slice(0, 3) })
    },
  })
}

export const useLeaveSpace = (spaceId: string) => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: () => api.delete<{ deleted: boolean }>(`/api/community/${spaceId}/members`).then((r) => r.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: communityKeys.members(spaceId, 1, 20).slice(0, 3) })
      qc.invalidateQueries({ queryKey: communityKeys.spaces(undefined, 1, 20).slice(0, 3) })
    },
  })
}

export const useSpacePosts = (spaceId: string, enabled = true, page = 1, limit = 20) =>
  useQuery({
    queryKey: communityKeys.posts(spaceId, page, limit),
    enabled: enabled && !!spaceId,
    queryFn: () => api.get<{ posts: CommunityPost[]; page: number; limit: number }>(`/api/community/${spaceId}/posts`, { params: { page, limit } }).then((r) => r.data),
  })

export const useCreatePost = (spaceId: string) => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (payload: { title: string; body: string; post_type?: string; parent_id?: string }) =>
      api.post<{ id: string }>(`/api/community/${spaceId}/posts`, payload).then((r) => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: communityKeys.posts(spaceId, 1, 20).slice(0, 3) }),
  })
}

export const useLikePost = (spaceId: string) => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (postId: string) => api.post<{ id: string }>(`/api/community/${spaceId}/posts/${postId}/like`).then((r) => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: communityKeys.posts(spaceId, 1, 20).slice(0, 3) }),
  })
}

export const usePostReplies = (spaceId: string, postId: string, enabled = true, page = 1, limit = 20) =>
  useQuery({
    queryKey: [...communityKeys.posts(spaceId, page, limit), 'replies', postId] as const,
    enabled: enabled && !!spaceId && !!postId,
    queryFn: () => api.get<{ replies: CommunityPost[]; page: number; limit: number }>(`/api/community/${spaceId}/posts/${postId}/replies`, { params: { page, limit } }).then((r) => r.data),
  })

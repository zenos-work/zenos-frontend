import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import api from '../lib/api'

type Pagination = {
  page: number
  limit: number
  total: number
  pages: number
}

export type Organization = {
  id: string
  name: string
  slug: string
  description?: string
  logo_url?: string
  website?: string
  plan_tier?: string
  plan_status?: string
  max_members?: number
  created_at?: string
  updated_at?: string
}

export type OrgMember = {
  id: string
  org_id: string
  user_id: string
  org_role: string
  joined_at: string
  invited_by?: string
}

export type OrgTeam = {
  id: string
  org_id: string
  name: string
  description?: string
  created_at: string
  updated_at: string
}

export type TeamMember = {
  team_id: string
  user_id: string
  added_at: string
}

export type OrgInvitation = {
  id: string
  org_id: string
  email: string
  org_role: string
  status: string
  expires_at: string
  created_at: string
  token?: string
  invited_by?: string
}

type MyOrgsResponse = {
  organizations: Organization[]
  pagination: Pagination
}

type OrgMembersResponse = {
  members: OrgMember[]
  pagination: Pagination
}

type OrgTeamsResponse = {
  teams: OrgTeam[]
  pagination: Pagination
}

type OrgInvitationsResponse = {
  invitations: OrgInvitation[]
  pagination: Pagination
}

const orgKeys = {
  all: ['org'] as const,
  my: (page: number, limit: number) => [...orgKeys.all, 'my', page, limit] as const,
  detail: (orgId: string) => [...orgKeys.all, 'detail', orgId] as const,
  members: (orgId: string, page: number, limit: number) => [...orgKeys.all, 'members', orgId, page, limit] as const,
  teams: (orgId: string, page: number, limit: number) => [...orgKeys.all, 'teams', orgId, page, limit] as const,
  teamMembers: (orgId: string, teamId: string) => [...orgKeys.all, 'team-members', orgId, teamId] as const,
  invitations: (orgId: string, page: number, limit: number) => [...orgKeys.all, 'invitations', orgId, page, limit] as const,
}

export const useMyOrgs = (enabled = true, page = 1, limit = 20) =>
  useQuery({
    queryKey: orgKeys.my(page, limit),
    enabled,
    queryFn: () => api.get<MyOrgsResponse>('/api/organizations', { params: { page, limit } }).then((r) => r.data),
  })

export const useOrg = (orgId: string, enabled = true) =>
  useQuery({
    queryKey: orgKeys.detail(orgId),
    enabled: enabled && !!orgId,
    queryFn: () => api.get<Organization>(`/api/organizations/${orgId}`).then((r) => r.data),
  })

export const useCreateOrg = () => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (payload: { name: string; description?: string }) =>
      api.post<Organization>('/api/organizations', payload).then((r) => r.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: orgKeys.all })
    },
  })
}

export const useOrgMembers = (orgId: string, enabled = true, page = 1, limit = 20) =>
  useQuery({
    queryKey: orgKeys.members(orgId, page, limit),
    enabled: enabled && !!orgId,
    queryFn: () =>
      api.get<OrgMembersResponse>(`/api/organizations/${orgId}/members`, { params: { page, limit } }).then((r) => r.data),
  })

export const useAddMember = (orgId: string) => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (payload: { user_id: string; role: string }) =>
      api.post<{ id: string }>(`/api/organizations/${orgId}/members`, payload).then((r) => r.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: orgKeys.members(orgId, 1, 20).slice(0, 3) })
    },
  })
}

export const useUpdateMemberRole = (orgId: string) => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ userId, role }: { userId: string; role: string }) =>
      api.put<{ org_role: string }>(`/api/organizations/${orgId}/members/${userId}`, { role }).then((r) => r.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: orgKeys.members(orgId, 1, 20).slice(0, 3) })
    },
  })
}

export const useRemoveMember = (orgId: string) => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (userId: string) => api.delete<{ status: string }>(`/api/organizations/${orgId}/members/${userId}`).then((r) => r.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: orgKeys.members(orgId, 1, 20).slice(0, 3) })
    },
  })
}

export const useOrgTeams = (orgId: string, enabled = true, page = 1, limit = 20) =>
  useQuery({
    queryKey: orgKeys.teams(orgId, page, limit),
    enabled: enabled && !!orgId,
    queryFn: () =>
      api.get<OrgTeamsResponse>(`/api/organizations/${orgId}/teams`, { params: { page, limit } }).then((r) => r.data),
  })

export const useCreateTeam = (orgId: string) => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (payload: { name: string; description?: string }) =>
      api.post<{ id: string }>(`/api/organizations/${orgId}/teams`, payload).then((r) => r.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: orgKeys.teams(orgId, 1, 20).slice(0, 3) })
    },
  })
}

export const useUpdateTeam = (orgId: string) => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ teamId, name, description }: { teamId: string; name: string; description?: string }) =>
      api.put<{ status: string }>(`/api/organizations/${orgId}/teams/${teamId}`, { name, description }).then((r) => r.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: orgKeys.teams(orgId, 1, 20).slice(0, 3) })
    },
  })
}

export const useDeleteTeam = (orgId: string) => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (teamId: string) => api.delete<{ status: string }>(`/api/organizations/${orgId}/teams/${teamId}`).then((r) => r.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: orgKeys.teams(orgId, 1, 20).slice(0, 3) })
    },
  })
}

export const useTeamMembers = (orgId: string, teamId: string, enabled = true) =>
  useQuery({
    queryKey: orgKeys.teamMembers(orgId, teamId),
    enabled: enabled && !!orgId && !!teamId,
    queryFn: () =>
      api.get<{ members: TeamMember[] }>(`/api/organizations/${orgId}/teams/${teamId}/members`).then((r) => r.data),
  })

export const useAddTeamMember = (orgId: string, teamId: string) => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (payload: { user_id: string }) =>
      api.post<{ team_id: string; user_id: string }>(`/api/organizations/${orgId}/teams/${teamId}/members`, payload).then((r) => r.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: orgKeys.teamMembers(orgId, teamId) })
    },
  })
}

export const useRemoveTeamMember = (orgId: string, teamId: string) => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (userId: string) =>
      api.delete<{ status: string }>(`/api/organizations/${orgId}/teams/${teamId}/members/${userId}`).then((r) => r.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: orgKeys.teamMembers(orgId, teamId) })
    },
  })
}

export const useOrgInvitations = (orgId: string, enabled = true, page = 1, limit = 20) =>
  useQuery({
    queryKey: orgKeys.invitations(orgId, page, limit),
    enabled: enabled && !!orgId,
    queryFn: () =>
      api.get<OrgInvitationsResponse>(`/api/organizations/${orgId}/invitations`, { params: { page, limit } }).then((r) => r.data),
  })

export const useSendInvitation = (orgId: string) => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (payload: { email: string; role: string }) =>
      api.post<{ id: string; token: string }>(`/api/organizations/${orgId}/invitations`, payload).then((r) => r.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: orgKeys.invitations(orgId, 1, 20).slice(0, 3) })
    },
  })
}

export const useRevokeInvitation = (orgId: string) => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (invitationId: string) =>
      api.delete<{ status: string }>(`/api/organizations/${orgId}/invitations/${invitationId}`).then((r) => r.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: orgKeys.invitations(orgId, 1, 20).slice(0, 3) })
    },
  })
}

export const useAcceptInvitation = () => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (token: string) => api.post<{ org_id: string; org_role: string }>(`/api/invitations/${token}/accept`).then((r) => r.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: orgKeys.all })
    },
  })
}

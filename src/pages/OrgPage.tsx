import { useMemo, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { Building2, Mail, ShieldCheck, Users, UsersRound } from 'lucide-react'
import Button from '../components/ui/Button'
import FeatureComingSoon from '../components/ui/FeatureComingSoon'
import Spinner from '../components/ui/Spinner'
import SurfaceCard from '../components/ui/SurfaceCard'
import { useFeatureFlag } from '../hooks/useFeatureFlags'
import {
  useAddMember,
  useCreateTeam,
  useOrg,
  useOrgInvitations,
  useOrgMembers,
  useOrgTeams,
  useRevokeInvitation,
  useSendInvitation,
} from '../hooks/useOrg'
import { useUiStore } from '../stores/uiStore'

type OrgTab = 'overview' | 'members' | 'teams' | 'invitations'

const ORG_ROLES = ['owner', 'admin', 'editor', 'member', 'viewer'] as const

export default function OrgPage() {
  const { id = '' } = useParams()
  const toast = useUiStore((s) => s.toast)
  const { enabled, isLoading: flagLoading } = useFeatureFlag('organizations')

  const [activeTab, setActiveTab] = useState<OrgTab>('overview')
  const [memberUserId, setMemberUserId] = useState('')
  const [memberRole, setMemberRole] = useState<(typeof ORG_ROLES)[number]>('member')
  const [teamName, setTeamName] = useState('')
  const [teamDescription, setTeamDescription] = useState('')
  const [inviteEmail, setInviteEmail] = useState('')
  const [inviteRole, setInviteRole] = useState<(typeof ORG_ROLES)[number]>('member')

  const orgQuery = useOrg(id, enabled)
  const membersQuery = useOrgMembers(id, enabled)
  const teamsQuery = useOrgTeams(id, enabled)
  const invitationsQuery = useOrgInvitations(id, enabled)

  const addMemberMutation = useAddMember(id)
  const createTeamMutation = useCreateTeam(id)
  const sendInvitationMutation = useSendInvitation(id)
  const revokeInvitationMutation = useRevokeInvitation(id)

  const tabStats = useMemo(() => {
    return {
      members: membersQuery.data?.pagination.total ?? membersQuery.data?.members.length ?? 0,
      teams: teamsQuery.data?.pagination.total ?? teamsQuery.data?.teams.length ?? 0,
      invitations: invitationsQuery.data?.pagination.total ?? invitationsQuery.data?.invitations.length ?? 0,
    }
  }, [membersQuery.data, teamsQuery.data, invitationsQuery.data])

  if (flagLoading) {
    return <div className='flex justify-center py-12'><Spinner /></div>
  }

  if (!enabled) {
    return (
      <FeatureComingSoon
        name='Organizations'
        description='Org dashboards, teams, and invitations are currently controlled by a feature flag.'
      />
    )
  }

  if (orgQuery.isLoading) {
    return <div className='flex justify-center py-12'><Spinner /></div>
  }

  if (!orgQuery.data) {
    return (
      <SurfaceCard>
        <h1 className='text-lg font-semibold text-[color:var(--text-primary)]'>Organization not found</h1>
        <p className='mt-2 text-sm text-[color:var(--text-secondary)]'>We could not load this organization.</p>
      </SurfaceCard>
    )
  }

  const members = membersQuery.data?.members ?? []
  const teams = teamsQuery.data?.teams ?? []
  const invitations = invitationsQuery.data?.invitations ?? []

  const handleAddMember = async () => {
    const nextUserId = memberUserId.trim()
    if (!nextUserId) {
      toast('User id is required', 'warning')
      return
    }
    try {
      await addMemberMutation.mutateAsync({ user_id: nextUserId, role: memberRole })
      setMemberUserId('')
      toast('Member added', 'success')
    } catch {
      toast('Could not add member', 'error')
    }
  }

  const handleCreateTeam = async () => {
    const nextName = teamName.trim()
    if (!nextName) {
      toast('Team name is required', 'warning')
      return
    }
    try {
      await createTeamMutation.mutateAsync({ name: nextName, description: teamDescription.trim() || undefined })
      setTeamName('')
      setTeamDescription('')
      toast('Team created', 'success')
    } catch {
      toast('Could not create team', 'error')
    }
  }

  const handleSendInvite = async () => {
    const nextEmail = inviteEmail.trim()
    if (!nextEmail) {
      toast('Invite email is required', 'warning')
      return
    }
    try {
      await sendInvitationMutation.mutateAsync({ email: nextEmail, role: inviteRole })
      setInviteEmail('')
      toast('Invitation sent', 'success')
    } catch {
      toast('Could not send invitation', 'error')
    }
  }

  const handleRevokeInvitation = async (invitationId: string) => {
    if (!confirm('Revoke this invitation?')) return
    try {
      await revokeInvitationMutation.mutateAsync(invitationId)
      toast('Invitation revoked', 'success')
    } catch {
      toast('Could not revoke invitation', 'error')
    }
  }

  const tabs: Array<{ key: OrgTab; label: string }> = [
    { key: 'overview', label: 'Overview' },
    { key: 'members', label: `Members (${tabStats.members})` },
    { key: 'teams', label: `Teams (${tabStats.teams})` },
    { key: 'invitations', label: `Invitations (${tabStats.invitations})` },
  ]

  return (
    <div className='space-y-6'>
      <SurfaceCard>
        <div className='flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between'>
          <div className='flex items-start gap-3'>
            <div className='rounded-xl bg-[color:var(--surface-2)] p-2 text-[color:var(--accent)]'>
              <Building2 size={18} />
            </div>
            <div>
              <h1 className='text-xl font-bold text-[color:var(--text-primary)]'>{orgQuery.data.name}</h1>
              <p className='mt-1 text-sm text-[color:var(--text-secondary)]'>
                {orgQuery.data.description || 'Manage members, teams, and invitations for this organization.'}
              </p>
            </div>
          </div>
          <Link
            to={`/org/${id}/settings`}
            className='inline-flex h-10 items-center rounded-lg border border-[color:var(--border)] px-3 text-sm font-medium text-[color:var(--text-primary)] hover:bg-[color:var(--surface-2)]'
          >
            Open Org Settings
          </Link>
        </div>
      </SurfaceCard>

      <div className='flex flex-wrap gap-2'>
        {tabs.map((tab) => (
          <button
            key={tab.key}
            type='button'
            onClick={() => setActiveTab(tab.key)}
            className={[
              'rounded-full border px-4 py-2 text-sm font-medium transition-colors',
              activeTab === tab.key
                ? 'border-[color:var(--accent)] bg-[color:var(--accent)] text-white'
                : 'border-[color:var(--border)] text-[color:var(--text-secondary)] hover:bg-[color:var(--surface-2)]',
            ].join(' ')}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {activeTab === 'overview' && (
        <div className='grid gap-4 md:grid-cols-3'>
          <SurfaceCard>
            <div className='flex items-center justify-between'>
              <div>
                <p className='text-xs uppercase tracking-wide text-[color:var(--text-muted)]'>Members</p>
                <p className='mt-1 text-2xl font-semibold text-[color:var(--text-primary)]'>{tabStats.members}</p>
              </div>
              <Users size={18} className='text-[color:var(--accent)]' />
            </div>
          </SurfaceCard>
          <SurfaceCard>
            <div className='flex items-center justify-between'>
              <div>
                <p className='text-xs uppercase tracking-wide text-[color:var(--text-muted)]'>Teams</p>
                <p className='mt-1 text-2xl font-semibold text-[color:var(--text-primary)]'>{tabStats.teams}</p>
              </div>
              <UsersRound size={18} className='text-[color:var(--accent)]' />
            </div>
          </SurfaceCard>
          <SurfaceCard>
            <div className='flex items-center justify-between'>
              <div>
                <p className='text-xs uppercase tracking-wide text-[color:var(--text-muted)]'>Pending Invitations</p>
                <p className='mt-1 text-2xl font-semibold text-[color:var(--text-primary)]'>
                  {invitations.filter((inv) => inv.status === 'pending').length}
                </p>
              </div>
              <Mail size={18} className='text-[color:var(--accent)]' />
            </div>
          </SurfaceCard>
        </div>
      )}

      {activeTab === 'members' && (
        <div className='space-y-4'>
          <SurfaceCard>
            <h2 className='mb-3 text-base font-semibold text-[color:var(--text-primary)]'>Add Member</h2>
            <div className='grid gap-3 md:grid-cols-[minmax(0,1fr)_180px_auto]'>
              <input
                value={memberUserId}
                onChange={(event) => setMemberUserId(event.target.value)}
                placeholder='User ID'
                className='h-10 rounded-lg border border-[color:var(--border)] bg-[color:var(--surface-0)] px-3 text-sm text-[color:var(--text-primary)]'
              />
              <select
                value={memberRole}
                onChange={(event) => setMemberRole(event.target.value as (typeof ORG_ROLES)[number])}
                className='h-10 rounded-lg border border-[color:var(--border)] bg-[color:var(--surface-0)] px-3 text-sm text-[color:var(--text-primary)]'
              >
                {ORG_ROLES.map((role) => <option key={role} value={role}>{role}</option>)}
              </select>
              <Button onClick={() => void handleAddMember()} loading={addMemberMutation.isPending}>Add</Button>
            </div>
          </SurfaceCard>

          <SurfaceCard>
            <h2 className='mb-3 text-base font-semibold text-[color:var(--text-primary)]'>Current Members</h2>
            {!members.length ? (
              <p className='text-sm text-[color:var(--text-secondary)]'>No members found.</p>
            ) : (
              <div className='space-y-2'>
                {members.map((member) => (
                  <div key={member.id} className='flex items-center justify-between rounded-lg border border-[color:var(--border)] bg-[color:var(--surface-0)] p-3'>
                    <div>
                      <p className='text-sm font-medium text-[color:var(--text-primary)]'>{member.user_id}</p>
                      <p className='text-xs text-[color:var(--text-muted)]'>Joined {new Date(member.joined_at).toLocaleDateString()}</p>
                    </div>
                    <span className='inline-flex items-center gap-1 rounded-full bg-[color:var(--surface-2)] px-2 py-1 text-xs font-medium text-[color:var(--text-secondary)]'>
                      <ShieldCheck size={12} />
                      {member.org_role}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </SurfaceCard>
        </div>
      )}

      {activeTab === 'teams' && (
        <div className='space-y-4'>
          <SurfaceCard>
            <h2 className='mb-3 text-base font-semibold text-[color:var(--text-primary)]'>Create Team</h2>
            <div className='grid gap-3'>
              <input
                value={teamName}
                onChange={(event) => setTeamName(event.target.value)}
                placeholder='Team name'
                className='h-10 rounded-lg border border-[color:var(--border)] bg-[color:var(--surface-0)] px-3 text-sm text-[color:var(--text-primary)]'
              />
              <input
                value={teamDescription}
                onChange={(event) => setTeamDescription(event.target.value)}
                placeholder='Description (optional)'
                className='h-10 rounded-lg border border-[color:var(--border)] bg-[color:var(--surface-0)] px-3 text-sm text-[color:var(--text-primary)]'
              />
              <div>
                <Button onClick={() => void handleCreateTeam()} loading={createTeamMutation.isPending}>Create Team</Button>
              </div>
            </div>
          </SurfaceCard>

          <SurfaceCard>
            <h2 className='mb-3 text-base font-semibold text-[color:var(--text-primary)]'>Teams</h2>
            {!teams.length ? (
              <p className='text-sm text-[color:var(--text-secondary)]'>No teams yet.</p>
            ) : (
              <div className='space-y-2'>
                {teams.map((team) => (
                  <div key={team.id} className='rounded-lg border border-[color:var(--border)] bg-[color:var(--surface-0)] p-3'>
                    <p className='text-sm font-medium text-[color:var(--text-primary)]'>{team.name}</p>
                    {team.description && <p className='mt-1 text-sm text-[color:var(--text-secondary)]'>{team.description}</p>}
                  </div>
                ))}
              </div>
            )}
          </SurfaceCard>
        </div>
      )}

      {activeTab === 'invitations' && (
        <div className='space-y-4'>
          <SurfaceCard>
            <h2 className='mb-3 text-base font-semibold text-[color:var(--text-primary)]'>Send Invitation</h2>
            <div className='grid gap-3 md:grid-cols-[minmax(0,1fr)_180px_auto]'>
              <input
                value={inviteEmail}
                onChange={(event) => setInviteEmail(event.target.value)}
                placeholder='email@company.com'
                className='h-10 rounded-lg border border-[color:var(--border)] bg-[color:var(--surface-0)] px-3 text-sm text-[color:var(--text-primary)]'
              />
              <select
                value={inviteRole}
                onChange={(event) => setInviteRole(event.target.value as (typeof ORG_ROLES)[number])}
                className='h-10 rounded-lg border border-[color:var(--border)] bg-[color:var(--surface-0)] px-3 text-sm text-[color:var(--text-primary)]'
              >
                {ORG_ROLES.map((role) => <option key={role} value={role}>{role}</option>)}
              </select>
              <Button onClick={() => void handleSendInvite()} loading={sendInvitationMutation.isPending}>Send</Button>
            </div>
          </SurfaceCard>

          <SurfaceCard>
            <h2 className='mb-3 text-base font-semibold text-[color:var(--text-primary)]'>Invitations</h2>
            {!invitations.length ? (
              <p className='text-sm text-[color:var(--text-secondary)]'>No invitations sent yet.</p>
            ) : (
              <div className='space-y-2'>
                {invitations.map((invitation) => (
                  <div key={invitation.id} className='flex items-center justify-between gap-3 rounded-lg border border-[color:var(--border)] bg-[color:var(--surface-0)] p-3'>
                    <div>
                      <p className='text-sm font-medium text-[color:var(--text-primary)]'>{invitation.email}</p>
                      <p className='text-xs text-[color:var(--text-muted)]'>Role: {invitation.org_role} • Status: {invitation.status}</p>
                    </div>
                    {invitation.status === 'pending' && (
                      <Button
                        variant='secondary'
                        size='sm'
                        onClick={() => void handleRevokeInvitation(invitation.id)}
                        loading={revokeInvitationMutation.isPending}
                      >
                        Revoke
                      </Button>
                    )}
                  </div>
                ))}
              </div>
            )}
          </SurfaceCard>
        </div>
      )}
    </div>
  )
}

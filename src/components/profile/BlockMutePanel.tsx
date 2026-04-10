import { useState } from 'react'
import { useBlockUser, useBlockedUsers, useMuteUser, useMutedUsers, useUnblockUser, useUnmuteUser } from '../../hooks/useBlockMute'
import { useUiStore } from '../../stores/uiStore'

type UserListItem = {
  user_id?: string
  blocked_user_id?: string
  muted_user_id?: string
}

export default function BlockMutePanel() {
  const toast = useUiStore((s) => s.toast)
  const [blockId, setBlockId] = useState('')
  const [muteId, setMuteId] = useState('')
  const blocked = useBlockedUsers(true)
  const muted = useMutedUsers(true)
  const block = useBlockUser()
  const unblock = useUnblockUser()
  const mute = useMuteUser()
  const unmute = useUnmuteUser()

  const blockedItems = ((blocked.data as { items?: UserListItem[] } | undefined)?.items ?? []) as UserListItem[]
  const mutedItems = ((muted.data as { items?: UserListItem[] } | undefined)?.items ?? []) as UserListItem[]

  const targetIdFor = (item: UserListItem) => item.blocked_user_id || item.muted_user_id || item.user_id || ''

  return (
    <div className='mt-6 rounded-xl border border-[color:var(--border)] bg-[color:var(--surface-0)] p-4'>
      <h3 className='text-sm font-semibold text-[color:var(--text-primary)]'>Block and mute</h3>
      <div className='mt-3 grid gap-3 md:grid-cols-2'>
        <div className='space-y-2'>
          <p className='text-xs uppercase tracking-[0.14em] text-[color:var(--text-muted)]'>Blocked users</p>
          <div className='flex gap-2'>
            <input
              value={blockId}
              onChange={(event) => setBlockId(event.target.value)}
              placeholder='User ID'
              className='h-9 flex-1 rounded-lg border border-[color:var(--border-strong)] bg-[color:var(--surface-1)] px-3 text-sm'
            />
            <button
              type='button'
              onClick={() => void block.mutateAsync({ userId: blockId }).then(() => { toast('User blocked', 'success'); setBlockId('') }).catch(() => toast('Could not block user', 'error'))}
              className='rounded-full bg-[color:var(--accent)] px-3 py-1 text-xs font-semibold text-white'
            >
              Block
            </button>
          </div>
          {blockedItems.map((item, index) => {
            const target = targetIdFor(item)
            return (
              <div key={`${target}-${index}`} className='flex items-center justify-between rounded-lg border border-[color:var(--border)] px-3 py-2'>
                <span className='text-xs text-[color:var(--text-primary)]'>{target}</span>
                <button
                  type='button'
                  onClick={() => void unblock.mutateAsync(target).then(() => toast('User unblocked', 'success')).catch(() => toast('Could not unblock user', 'error'))}
                  className='text-xs text-[color:var(--text-secondary)] hover:text-[color:var(--text-primary)]'
                >
                  Unblock
                </button>
              </div>
            )
          })}
        </div>

        <div className='space-y-2'>
          <p className='text-xs uppercase tracking-[0.14em] text-[color:var(--text-muted)]'>Muted users</p>
          <div className='flex gap-2'>
            <input
              value={muteId}
              onChange={(event) => setMuteId(event.target.value)}
              placeholder='User ID'
              className='h-9 flex-1 rounded-lg border border-[color:var(--border-strong)] bg-[color:var(--surface-1)] px-3 text-sm'
            />
            <button
              type='button'
              onClick={() => void mute.mutateAsync({ userId: muteId }).then(() => { toast('User muted', 'success'); setMuteId('') }).catch(() => toast('Could not mute user', 'error'))}
              className='rounded-full bg-[color:var(--accent)] px-3 py-1 text-xs font-semibold text-white'
            >
              Mute
            </button>
          </div>
          {mutedItems.map((item, index) => {
            const target = targetIdFor(item)
            return (
              <div key={`${target}-${index}`} className='flex items-center justify-between rounded-lg border border-[color:var(--border)] px-3 py-2'>
                <span className='text-xs text-[color:var(--text-primary)]'>{target}</span>
                <button
                  type='button'
                  onClick={() => void unmute.mutateAsync(target).then(() => toast('User unmuted', 'success')).catch(() => toast('Could not unmute user', 'error'))}
                  className='text-xs text-[color:var(--text-secondary)] hover:text-[color:var(--text-primary)]'
                >
                  Unmute
                </button>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}

import { useParams } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useRef, useState } from 'react'
import { Upload, Trash2 } from 'lucide-react'
import { useAuth } from '../hooks/useAuth'
import api from '../lib/api'
import type { User } from '../types'
import Avatar      from '../components/ui/Avatar'
import Badge       from '../components/ui/Badge'
import Spinner     from '../components/ui/Spinner'
import FollowButton from '../components/social/FollowButton'
import { useUiStore } from '../stores/uiStore'

const PRESET_AVATARS = [
  'https://api.dicebear.com/9.x/adventurer/svg?seed=ZenosAtlas',
  'https://api.dicebear.com/9.x/adventurer/svg?seed=ZenosNova',
  'https://api.dicebear.com/9.x/adventurer/svg?seed=ZenosRhea',
  'https://api.dicebear.com/9.x/adventurer/svg?seed=ZenosIris',
  'https://api.dicebear.com/9.x/adventurer/svg?seed=ZenosKai',
  'https://api.dicebear.com/9.x/adventurer/svg?seed=ZenosVega',
]

function normalizeImageContentType(file: File): string | null {
  const fromType = (file.type || '').toLowerCase().trim()
  if (fromType === 'image/jpg') return 'image/jpeg'
  if (['image/jpeg', 'image/png', 'image/webp', 'image/gif'].includes(fromType)) {
    return fromType
  }

  const name = file.name.toLowerCase()
  if (name.endsWith('.jpg') || name.endsWith('.jpeg')) return 'image/jpeg'
  if (name.endsWith('.png')) return 'image/png'
  if (name.endsWith('.webp')) return 'image/webp'
  if (name.endsWith('.gif')) return 'image/gif'
  return null
}

export default function ProfilePage() {
  const { id }   = useParams()
  const { user } = useAuth()
  const qc = useQueryClient()
  const toast = useUiStore((s) => s.toast)
  const avatarInputRef = useRef<HTMLInputElement | null>(null)
  // If no id in route, show own profile
  const userId = id || user?.id

  const { data: profile, isLoading } = useQuery({
    queryKey: ['user', userId],
    queryFn:  () =>
      api.get<{ user: User }>(`/api/users/${userId === user?.id ? 'me' : userId}`)
         .then(r => r.data.user),
    enabled: !!userId,
  })

  const [avatarOverride, setAvatarOverride] = useState<string | null | undefined>(undefined)

  const syncAvatarInCache = (avatarUrl: string | null) => {
    const nextAvatar = avatarUrl ?? undefined
    if (user?.id) {
      qc.setQueryData<User | undefined>(['user', user.id], (prev) =>
        prev ? { ...prev, avatar_url: nextAvatar } : prev,
      )
    }
    if (userId) {
      qc.setQueryData<User | undefined>(['user', userId], (prev) =>
        prev ? { ...prev, avatar_url: nextAvatar } : prev,
      )
    }
  }

  const uploadAvatarMutation = useMutation({
    mutationFn: async (file: File) => {
      const contentType = normalizeImageContentType(file)
      if (!contentType) {
        return ''
      }

      const blob = new Blob([await file.arrayBuffer()], { type: contentType })
      const res = await api.post<{ avatar_url: string }>('/api/users/me/avatar', blob, {
        headers: { 'Content-Type': contentType },
      })
      return res.data.avatar_url
    },
    onSuccess: (url) => {
      if (!url) return
      setAvatarOverride(url)
      syncAvatarInCache(url)
      toast('Profile picture updated', 'success')
    },
    onError: (err) => {
      const message = err instanceof Error ? err.message : 'Could not upload profile picture'
      toast(message, 'error')
    },
  })

  const setPresetAvatarMutation = useMutation({
    mutationFn: async (avatarUrl: string) => {
      await api.put('/api/users/me', {
        name: profile?.name,
        avatar_url: avatarUrl,
      })
      return avatarUrl
    },
    onSuccess: (avatarUrl) => {
      setAvatarOverride(avatarUrl)
      syncAvatarInCache(avatarUrl)
      toast('Preset avatar selected', 'success')
    },
    onError: () => {
      toast('Could not set preset avatar', 'error')
    },
  })

  const removeAvatarMutation = useMutation({
    mutationFn: async () => {
      await api.delete('/api/users/me/avatar')
    },
    onSuccess: () => {
      setAvatarOverride(null)
      syncAvatarInCache(null)
      toast('Profile picture removed', 'success')
    },
    onError: () => {
      toast('Could not remove profile picture', 'error')
    },
  })

  if (isLoading) return <div className='flex justify-center py-12'><Spinner /></div>
  if (!profile)  return <p className='text-[color:var(--text-secondary)]'>User not found</p>

  const avatarUrl = avatarOverride === undefined ? profile.avatar_url : avatarOverride || undefined

  const isOwnProfile = profile.id === user?.id

  return (
    <div className='max-w-2xl mx-auto space-y-8'>
      <div className='flex items-start gap-6 rounded-2xl border border-[color:var(--border)] bg-[color:var(--surface-1)] p-6 shadow-sm'>
        <div className='space-y-3'>
          <div className='flex h-16 w-16 items-center justify-center overflow-hidden rounded-full border-2 border-[color:var(--accent)]/45'>
            <Avatar name={profile.name} src={avatarUrl} size='lg' />
          </div>
          {isOwnProfile && (
            <div className='flex flex-col gap-2'>
              <input
                ref={avatarInputRef}
                type='file'
                accept='image/*'
                className='hidden'
                onChange={(e) => {
                  const file = e.target.files?.[0]
                  if (!file) return
                  if (!normalizeImageContentType(file)) {
                    toast('Please upload JPG, PNG, WEBP, or GIF images only', 'error')
                    e.currentTarget.value = ''
                    return
                  }
                  uploadAvatarMutation.mutate(file)
                  e.currentTarget.value = ''
                }}
              />
              <button
                onClick={() => avatarInputRef.current?.click()}
                className='inline-flex items-center justify-center gap-1 rounded-lg border border-[color:var(--border-strong)] bg-[color:var(--surface-0)] px-2 py-1 text-xs text-[color:var(--text-primary)] transition-colors hover:border-[color:var(--accent)] hover:bg-[color:var(--surface-2)]'
              >
                <Upload size={12} />
                {uploadAvatarMutation.isPending ? 'Uploading...' : 'Add photo'}
              </button>
              {avatarUrl && (
                <button
                  onClick={() => removeAvatarMutation.mutate()}
                  className='inline-flex items-center justify-center gap-1 rounded-lg border border-[color:rgba(180,35,24,0.4)] bg-[color:rgba(180,35,24,0.08)] px-2 py-1 text-xs text-[color:#b42318] transition-colors hover:bg-[color:rgba(180,35,24,0.16)] dark:text-[#ff9f94]'
                >
                  <Trash2 size={12} />
                  {removeAvatarMutation.isPending ? 'Removing...' : 'Remove photo'}
                </button>
              )}

              <div className='pt-2'>
                <p className='mb-2 text-[11px] font-semibold uppercase tracking-[0.18em] text-[color:var(--text-muted)]'>
                  Pick avatar
                </p>
                <div className='grid grid-cols-3 gap-2'>
                  {PRESET_AVATARS.map((presetUrl, idx) => (
                    <button
                      key={presetUrl}
                      type='button'
                      aria-label={`Preset avatar ${idx + 1}`}
                      onClick={() => setPresetAvatarMutation.mutate(presetUrl)}
                      disabled={setPresetAvatarMutation.isPending}
                      className='h-10 w-10 overflow-hidden rounded-full border border-[color:var(--border-strong)] transition-colors hover:border-[color:var(--accent)] disabled:cursor-not-allowed disabled:opacity-50'
                    >
                      <img src={presetUrl} alt='' className='h-full w-full object-cover' />
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
        <div className='flex-1 min-w-0'>
          <div className='flex items-center gap-3 flex-wrap'>
            <h1 className='text-xl font-bold text-[color:var(--text-primary)]'>{profile.name}</h1>
            <Badge variant={profile.role === 'AUTHOR' ? 'info' : profile.role === 'SUPERADMIN' ? 'warning' : 'default'}>
              {profile.role}
            </Badge>
          </div>
          {profile.email && (
            <p className='mt-1 text-sm text-[color:var(--text-secondary)]'>{profile.email}</p>
          )}
          <p className='mt-1 text-xs text-[color:var(--text-muted)]'>
            Joined {new Date(profile.created_at).toLocaleDateString('en-US', { year: 'numeric', month: 'long' })}
          </p>
          {!isOwnProfile && (
            <div className='mt-3'>
              <FollowButton authorId={profile.id} />
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

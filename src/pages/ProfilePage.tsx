import { Link, useParams } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useMemo, useRef, useState } from 'react'
import { PencilLine, Upload, Trash2 } from 'lucide-react'
import { useAuth } from '../hooks/useAuth'
import api from '../lib/api'
import { useTags } from '../hooks/useTags'
import { useUpdateUserPrefs, useUserPrefs } from '../hooks/useUserPrefs'
import { useReadingPreferences } from '../hooks/useReadingPreferences'
import { useAuthorArticles } from '../hooks/useArticles'
import { useFeatureFlag } from '../hooks/useFeatureFlags'
import type { Tag, User } from '../types'
import Avatar      from '../components/ui/Avatar'
import Badge       from '../components/ui/Badge'
import Spinner     from '../components/ui/Spinner'
import FollowButton from '../components/social/FollowButton'
import ArticleCard from '../components/article/ArticleCard'
import { useUiStore } from '../stores/uiStore'
import NotificationPrefsPanel from '../components/profile/NotificationPrefsPanel'
import AccountDataPanel from '../components/profile/AccountDataPanel'
import ActiveSessionsPanel from '../components/profile/ActiveSessionsPanel'
import BlockMutePanel from '../components/profile/BlockMutePanel'
import CustomDomainPanel from '../components/profile/CustomDomainPanel'

function haveSameTopics(left: string[], right: string[]) {
  if (left.length !== right.length) return false
  return [...left].sort().every((topic, index) => topic === [...right].sort()[index])
}

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

type NotificationSettings = {
  emailNewFollower: boolean
  emailArticlePublished: boolean
  emailWeeklyDigest: boolean
  emailComments: boolean
  pushNewFollower: boolean
  pushComments: boolean
  pushMentions: boolean
  pushApproval: boolean
}

type ReadingSettingsForm = {
  defaultFont: 'serif' | 'sans'
  defaultFontSize: 'sm' | 'base' | 'lg' | 'xl'
  defaultWidth: 'narrow' | 'medium' | 'wide'
  autoBookmark: boolean
  showReadingTime: boolean
  showProgressBar: boolean
}

type SettingsTab = 'personal' | 'notifications' | 'reading' | 'preferences' | 'account' | 'billing'

const DEFAULT_NOTIFICATION_SETTINGS: NotificationSettings = {
  emailNewFollower: true,
  emailArticlePublished: true,
  emailWeeklyDigest: true,
  emailComments: false,
  pushNewFollower: true,
  pushComments: true,
  pushMentions: true,
  pushApproval: true,
}

const DEFAULT_READING_SETTINGS: ReadingSettingsForm = {
  defaultFont: 'sans',
  defaultFontSize: 'base',
  defaultWidth: 'wide',
  autoBookmark: true,
  showReadingTime: true,
  showProgressBar: true,
}

function getSafeStorage(): Storage | null {
  if (typeof window === 'undefined') return null
  try {
    const storage = window.localStorage
    if (!storage || typeof storage.getItem !== 'function' || typeof storage.setItem !== 'function') {
      return null
    }
    return storage
  } catch {
    return null
  }
}

function storageKey(userId: string, key: string): string {
  return `zenos.profile.${userId}.${key}`
}

function YesNoToggle({
  value,
  onChange,
}: {
  value: boolean
  onChange: (next: boolean) => void
}) {
  return (
    <button
      type='button'
      role='switch'
      aria-checked={value}
      onClick={() => onChange(!value)}
      className={[
        'relative inline-flex h-6 w-11 items-center rounded-full border transition-colors',
        value
          ? 'border-[color:var(--accent)] bg-[color:var(--accent)]'
          : 'border-[color:var(--border-strong)] bg-[color:var(--surface-2)]',
      ].join(' ')}
    >
      <span
        aria-hidden='true'
        className={[
          'inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform',
          value
            ? 'translate-x-5'
            : 'translate-x-1',
        ].join(' ')}
      />
    </button>
  )
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
  const [selectedTopicsOverride, setSelectedTopicsOverride] = useState<string[] | null>(null)
  const [showSavedPreferencesNotice, setShowSavedPreferencesNotice] = useState(false)
  const [showSavedNotificationNotice, setShowSavedNotificationNotice] = useState(false)
  const [showSavedReadingSettingsNotice, setShowSavedReadingSettingsNotice] = useState(false)
  const [activeTab, setActiveTab] = useState<SettingsTab>('preferences')
  const [profileBioOverrides, setProfileBioOverrides] = useState<Record<string, string>>({})
  const [notificationOverrides, setNotificationOverrides] = useState<Record<string, NotificationSettings>>({})
  const [readingOverrides, setReadingOverrides] = useState<Record<string, ReadingSettingsForm>>({})
  const [profileDraft, setProfileDraft] = useState<{ name: string; avatar_url: string; bio: string }>({ name: '', avatar_url: '', bio: '' })
  const [isEditingProfile, setIsEditingProfile] = useState(false)
  const { enabled: notificationPrefsEnabled } = useFeatureFlag('notification_preferences', !!user)
  const { enabled: gdprControlsEnabled } = useFeatureFlag('gdpr_controls', !!user)
  const { enabled: sessionManagementEnabled } = useFeatureFlag('session_management', !!user)
  const { enabled: blockMuteEnabled } = useFeatureFlag('block_mute', !!user)
  const { enabled: customDomainsEnabled } = useFeatureFlag('custom_domains', !!user)

  const { data: availableTags = [] } = useTags({ onboarding: true })
  const { data: prefs } = useUserPrefs()
  const { preferences: readingPrefs, updatePreference } = useReadingPreferences()
  const updatePrefsMutation = useUpdateUserPrefs()

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

  const updateProfileMutation = useMutation({
    mutationFn: async (payload: { name?: string; avatar_url?: string }) => {
      await api.put('/api/users/me', payload)
      return payload
    },
    onSuccess: (payload) => {
      const updatedName = payload.name
      if (payload.avatar_url !== undefined) {
        const nextAvatar = payload.avatar_url || null
        setAvatarOverride(nextAvatar)
        syncAvatarInCache(nextAvatar)
      }

      if (updatedName && user?.id) {
        qc.setQueryData<User | undefined>(['user', user.id], (prev) =>
          prev ? { ...prev, name: updatedName } : prev,
        )
      }
      if (userId && updatedName) {
        qc.setQueryData<User | undefined>(['user', userId], (prev) =>
          prev ? { ...prev, name: updatedName } : prev,
        )
      }

      void qc.invalidateQueries({ queryKey: ['user', userId] })
      setIsEditingProfile(false)
      toast('Profile details updated', 'success')
    },
    onError: (err) => {
      const message = err instanceof Error ? err.message : 'Could not update profile details'
      toast(message, 'error')
    },
  })

  const deactivateAccountMutation = useMutation({
    mutationFn: async () => {
      await api.delete('/api/users/me')
    },
    onSuccess: () => {
      toast('Account deactivated', 'success')
      window.location.href = '/login'
    },
    onError: () => {
      toast('Could not deactivate account', 'error')
    },
  })

  const groupedPreferences = useMemo(() => {
    const categories = availableTags.filter((tag) => tag.is_onboarding_category)
    const byCategory = new Map<string, Tag[]>()

    for (const tag of availableTags) {
      if (!tag.category_slug || tag.is_onboarding_category) continue
      const items = byCategory.get(tag.category_slug) || []
      items.push(tag)
      byCategory.set(tag.category_slug, items)
    }

    return categories
      .sort((a, b) => a.name.localeCompare(b.name))
      .map((category) => ({
        category,
        topics: (byCategory.get(category.slug) || []).sort((a, b) => a.name.localeCompare(b.name)),
      }))
      .filter((group) => group.topics.length > 0)
  }, [availableTags])

  const selectedTopics = selectedTopicsOverride ?? prefs?.topics ?? []
  const hasPreferenceChanges = !haveSameTopics(selectedTopics, prefs?.topics ?? [])

  const toggleTopic = (slug: string) => {
    setShowSavedPreferencesNotice(false)
    setSelectedTopicsOverride((override) => {
      const current = override ?? selectedTopics
      return (
      current.includes(slug)
        ? current.filter((item) => item !== slug)
        : [...current, slug]
      )
    })
  }

  const savePreferences = async () => {
    const nextPrefs = {
      topics: selectedTopics,
      email_notifs: prefs?.email_notifs ?? 1,
      theme: prefs?.theme ?? 'dark',
    }

    await updatePrefsMutation.mutateAsync(nextPrefs)
    qc.setQueryData(['users', 'me', 'prefs'], nextPrefs)
    setSelectedTopicsOverride(null)
    setShowSavedPreferencesNotice(true)
    toast('Preferences updated', 'success')
  }

  const avatarUrl = avatarOverride === undefined ? profile?.avatar_url : avatarOverride || undefined
  const isOwnProfile = profile?.id === user?.id
  const effectiveUserId = profile?.id ?? ''

  const { data: socialStats } = useQuery({
    queryKey: ['social', 'stats', effectiveUserId],
    queryFn: () =>
      api
        .get<{ user_id: string; followers_count: number; following_count: number }>(`/api/social/stats/${effectiveUserId}`)
        .then((r) => r.data),
    enabled: !!effectiveUserId,
    staleTime: 30_000,
  })

  const { data: authorArticles } = useAuthorArticles(effectiveUserId, {
    page: 1,
    limit: 6,
    status: isOwnProfile ? undefined : 'PUBLISHED',
  })

  const visibleArticles = authorArticles?.items ?? []
  const visibleArticleCount = authorArticles?.total ?? visibleArticles.length

  const persistedSettings = useMemo(() => {
    const baselineNotifications: NotificationSettings = {
      ...DEFAULT_NOTIFICATION_SETTINGS,
      emailWeeklyDigest: prefs?.email_notifs === 1,
    }
    const baselineReading: ReadingSettingsForm = {
      ...DEFAULT_READING_SETTINGS,
      defaultFont: readingPrefs.fontFamily,
      defaultFontSize: readingPrefs.fontSize,
      defaultWidth: readingPrefs.contentWidth,
    }

    if (!profile || !isOwnProfile || !effectiveUserId) {
      return {
        profileBio: '',
        notificationSettings: baselineNotifications,
        readingSettings: baselineReading,
      }
    }

    const storage = getSafeStorage()
    const storedBio = storage?.getItem(storageKey(effectiveUserId, 'bio')) ?? ''

    let notificationSettings = baselineNotifications
    const rawNotifications = storage?.getItem(storageKey(effectiveUserId, 'notifications'))
    if (rawNotifications) {
      try {
        notificationSettings = JSON.parse(rawNotifications) as NotificationSettings
      } catch {
        notificationSettings = baselineNotifications
      }
    }

    let readingSettings = baselineReading
    const rawReading = storage?.getItem(storageKey(effectiveUserId, 'reading'))
    if (rawReading) {
      try {
        const parsed = JSON.parse(rawReading) as Partial<ReadingSettingsForm>
        readingSettings = { ...baselineReading, ...parsed }
      } catch {
        readingSettings = baselineReading
      }
    }

    return {
      profileBio: storedBio,
      notificationSettings,
      readingSettings,
    }
  }, [effectiveUserId, isOwnProfile, prefs?.email_notifs, profile, readingPrefs.contentWidth, readingPrefs.fontFamily, readingPrefs.fontSize])

  const profileBio = effectiveUserId
    ? (profileBioOverrides[effectiveUserId] ?? persistedSettings.profileBio)
    : persistedSettings.profileBio

  const notificationSettings = effectiveUserId
    ? (notificationOverrides[effectiveUserId] ?? persistedSettings.notificationSettings)
    : persistedSettings.notificationSettings

  const readingSettings = effectiveUserId
    ? (readingOverrides[effectiveUserId] ?? persistedSettings.readingSettings)
    : persistedSettings.readingSettings

  const setProfileBio = (nextBio: string) => {
    if (!effectiveUserId) return
    setProfileBioOverrides((prev) => ({ ...prev, [effectiveUserId]: nextBio }))
  }

  const setNotificationSettings = (next: NotificationSettings | ((prev: NotificationSettings) => NotificationSettings)) => {
    if (!effectiveUserId) return
    setNotificationOverrides((prev) => {
      const current = prev[effectiveUserId] ?? persistedSettings.notificationSettings
      const value = typeof next === 'function'
        ? (next as (prevValue: NotificationSettings) => NotificationSettings)(current)
        : next
      return { ...prev, [effectiveUserId]: value }
    })
  }

  const setReadingSettings = (next: ReadingSettingsForm | ((prev: ReadingSettingsForm) => ReadingSettingsForm)) => {
    if (!effectiveUserId) return
    setReadingOverrides((prev) => {
      const current = prev[effectiveUserId] ?? persistedSettings.readingSettings
      const value = typeof next === 'function'
        ? (next as (prevValue: ReadingSettingsForm) => ReadingSettingsForm)(current)
        : next
      return { ...prev, [effectiveUserId]: value }
    })
  }

  if (isLoading) return <div className='flex justify-center py-12'><Spinner /></div>
  if (!profile)  return <p className='text-[color:var(--text-secondary)]'>User not found</p>

  const canSavePersonalDetails =
    profileDraft.name.trim().length > 0 &&
    (
      profileDraft.name.trim() !== profile.name ||
      profileDraft.avatar_url.trim() !== (avatarUrl ?? '') ||
      profileDraft.bio.trim() !== profileBio.trim()
    )

  const startEditingProfile = () => {
    setProfileDraft({
      name: profile.name,
      avatar_url: avatarUrl ?? '',
      bio: profileBio,
    })
    setIsEditingProfile(true)
  }

  const cancelEditingProfile = () => {
    setIsEditingProfile(false)
    setProfileDraft({
      name: profile.name,
      avatar_url: avatarUrl ?? '',
      bio: profileBio,
    })
  }

  const savePersonalDetails = async () => {
    const payload: { name?: string; avatar_url?: string } = {}
    const nextName = profileDraft.name.trim()
    const nextAvatar = profileDraft.avatar_url.trim()

    if (nextName && nextName !== profile.name) {
      payload.name = nextName
    }

    if (nextAvatar !== (avatarUrl ?? '')) {
      payload.avatar_url = nextAvatar || undefined
    }

    if (!Object.keys(payload).length) {
      const storage = getSafeStorage()
      storage?.setItem(storageKey(effectiveUserId, 'bio'), profileDraft.bio.trim())
      setProfileBio(profileDraft.bio.trim())
      setIsEditingProfile(false)
      return
    }

    await updateProfileMutation.mutateAsync(payload)
    const storage = getSafeStorage()
    storage?.setItem(storageKey(effectiveUserId, 'bio'), profileDraft.bio.trim())
    setProfileBio(profileDraft.bio.trim())
  }

  const saveNotificationSettings = async () => {
    const nextPrefs = {
      topics: selectedTopics,
      email_notifs: notificationSettings.emailWeeklyDigest ? 1 : 0,
      theme: prefs?.theme ?? 'dark',
    }

    await updatePrefsMutation.mutateAsync(nextPrefs)
    qc.setQueryData(['users', 'me', 'prefs'], nextPrefs)
    const storage = getSafeStorage()
    storage?.setItem(storageKey(effectiveUserId, 'notifications'), JSON.stringify(notificationSettings))
    setShowSavedNotificationNotice(true)
    toast('Notification settings updated', 'success')
  }

  const saveReadingSettings = () => {
    updatePreference('fontFamily', readingSettings.defaultFont)
    updatePreference('fontSize', readingSettings.defaultFontSize)
    updatePreference('contentWidth', readingSettings.defaultWidth)

    const storage = getSafeStorage()
    storage?.setItem(storageKey(effectiveUserId, 'reading'), JSON.stringify(readingSettings))
    setShowSavedReadingSettingsNotice(true)
    toast('Reading settings updated', 'success')
  }

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
          {isOwnProfile && (
            <p className='mb-1 text-xs uppercase tracking-[0.14em] text-[color:var(--text-muted)]'>Settings</p>
          )}
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
          <div data-testid='follow-stats' className='mt-3 flex flex-wrap gap-2 text-sm text-[color:var(--text-secondary)]'>
            <span data-testid='follower-count' className='rounded-full bg-[color:var(--surface-0)] px-3 py-1'>
              {socialStats?.followers_count ?? 0} followers
            </span>
            <span data-testid='following-count' className='rounded-full bg-[color:var(--surface-0)] px-3 py-1'>
              {socialStats?.following_count ?? 0} following
            </span>
            <span className='rounded-full bg-[color:var(--surface-0)] px-3 py-1'>
              {visibleArticleCount} articles
            </span>
          </div>
          {!isOwnProfile && (
            <div className='mt-3'>
              <FollowButton authorId={profile.id} />
            </div>
          )}
        </div>
      </div>

      <section data-testid='profile-articles' className='rounded-2xl border border-[color:var(--border)] bg-[color:var(--surface-1)] p-6 shadow-sm'>
        <div className='mb-4 flex items-center justify-between gap-3'>
          <div>
            <h2 className='text-lg font-semibold text-[color:var(--text-primary)]'>Articles</h2>
            <p className='mt-1 text-sm text-[color:var(--text-secondary)]'>
              {isOwnProfile ? 'Your latest writing activity.' : `Recent work by ${profile.name}.`}
            </p>
          </div>
          <span className='text-sm text-[color:var(--text-muted)]'>{visibleArticleCount} total</span>
        </div>

        {visibleArticles.length > 0 ? (
          <div className='space-y-4'>
            {visibleArticles.map((article) => (
              <ArticleCard key={article.id} article={article} compact showStatus={isOwnProfile} />
            ))}
          </div>
        ) : (
          <div className='rounded-xl border border-dashed border-[color:var(--border)] bg-[color:var(--surface-0)] px-4 py-6 text-sm text-[color:var(--text-muted)]'>
            {isOwnProfile ? 'No articles created yet.' : 'No published articles yet.'}
          </div>
        )}
      </section>

      {isOwnProfile && (
        <div className='rounded-2xl border border-[color:var(--border)] bg-[color:var(--surface-1)] px-3 pt-3 shadow-sm'>
          <div className='flex flex-wrap gap-1 border-b border-[color:var(--border)]'>
            {([
              { id: 'personal', label: 'Personal details' },
              { id: 'notifications', label: 'Notifications' },
              { id: 'reading', label: 'Reading settings' },
              { id: 'preferences', label: 'Reading preferences' },
              { id: 'account', label: 'Account' },
              { id: 'billing', label: 'Billing' },
            ] as const).map((item) => (
              <button
                key={item.id}
                type='button'
                onClick={() => setActiveTab(item.id)}
                className={[
                  '-mb-px border-b-2 px-3 py-2.5 text-sm font-medium transition-colors',
                  activeTab === item.id
                    ? 'border-[color:var(--accent)] text-[color:var(--text-primary)]'
                    : 'border-transparent text-[color:var(--text-secondary)] hover:text-[color:var(--text-primary)]',
                ].join(' ')}
              >
                {item.label}
              </button>
            ))}
          </div>
        </div>
      )}

      {isOwnProfile && activeTab === 'personal' && (
        <section className='rounded-2xl border border-[color:var(--border)] bg-[color:var(--surface-1)] p-6 shadow-sm'>
          <div className='flex items-start justify-between gap-4'>
            <div>
              <h2 className='text-lg font-semibold text-[color:var(--text-primary)]'>Personal details</h2>
              <p className='mt-1 text-sm text-[color:var(--text-secondary)]'>
                Keep your public profile information up to date.
              </p>
            </div>
            {!isEditingProfile ? (
              <button
                type='button'
                onClick={startEditingProfile}
                className='inline-flex items-center gap-1 rounded-full border border-[color:var(--border-strong)] px-4 py-1.5 text-sm font-semibold text-[color:var(--text-primary)] hover:bg-[color:var(--surface-2)]'
              >
                <PencilLine size={14} /> Edit profile
              </button>
            ) : null}
          </div>

          {!isEditingProfile ? (
            <dl className='mt-5 grid gap-4 sm:grid-cols-2'>
              <div className='rounded-xl border border-[color:var(--border)] bg-[color:var(--surface-0)] p-4'>
                <dt className='text-xs uppercase tracking-[0.14em] text-[color:var(--text-muted)]'>Display name</dt>
                <dd className='mt-1 text-sm font-medium text-[color:var(--text-primary)]'>{profile.name}</dd>
              </div>
              <div className='rounded-xl border border-[color:var(--border)] bg-[color:var(--surface-0)] p-4'>
                <dt className='text-xs uppercase tracking-[0.14em] text-[color:var(--text-muted)]'>Email</dt>
                <dd className='mt-1 text-sm font-medium text-[color:var(--text-primary)]'>{profile.email || 'Not available'}</dd>
              </div>
              <div className='rounded-xl border border-[color:var(--border)] bg-[color:var(--surface-0)] p-4 sm:col-span-2'>
                <dt className='text-xs uppercase tracking-[0.14em] text-[color:var(--text-muted)]'>Bio</dt>
                <dd className='mt-1 text-sm leading-6 text-[color:var(--text-primary)]'>
                  {profileBio || 'No bio added yet.'}
                </dd>
              </div>
            </dl>
          ) : (
            <div className='mt-5 space-y-4'>
              <label className='block'>
                <span className='mb-1 block text-xs uppercase tracking-[0.14em] text-[color:var(--text-muted)]'>Display name</span>
                <input
                  type='text'
                  value={profileDraft.name}
                  onChange={(e) => setProfileDraft((prev) => ({ ...prev, name: e.target.value }))}
                  className='w-full rounded-xl border border-[color:var(--border-strong)] bg-[color:var(--surface-0)] px-3 py-2 text-sm text-[color:var(--text-primary)] outline-none focus:border-[color:var(--accent)]'
                  maxLength={100}
                />
              </label>

              <label className='block'>
                <span className='mb-1 block text-xs uppercase tracking-[0.14em] text-[color:var(--text-muted)]'>Avatar URL (optional)</span>
                <input
                  type='url'
                  value={profileDraft.avatar_url}
                  onChange={(e) => setProfileDraft((prev) => ({ ...prev, avatar_url: e.target.value }))}
                  className='w-full rounded-xl border border-[color:var(--border-strong)] bg-[color:var(--surface-0)] px-3 py-2 text-sm text-[color:var(--text-primary)] outline-none focus:border-[color:var(--accent)]'
                  placeholder='https://example.com/avatar.jpg'
                />
              </label>

              <label className='block'>
                <span className='mb-1 block text-xs uppercase tracking-[0.14em] text-[color:var(--text-muted)]'>Bio</span>
                <textarea
                  value={profileDraft.bio}
                  onChange={(e) => setProfileDraft((prev) => ({ ...prev, bio: e.target.value }))}
                  rows={4}
                  className='w-full rounded-xl border border-[color:var(--border-strong)] bg-[color:var(--surface-0)] px-3 py-2 text-sm text-[color:var(--text-primary)] outline-none focus:border-[color:var(--accent)]'
                  placeholder='Tell readers about your interests and writing focus.'
                />
              </label>

              <div className='flex items-center justify-end gap-2'>
                <button
                  type='button'
                  onClick={cancelEditingProfile}
                  className='rounded-full border border-[color:var(--border)] px-4 py-2 text-sm font-semibold text-[color:var(--text-secondary)] hover:bg-[color:var(--surface-2)]'
                >
                  Cancel
                </button>
                <button
                  type='button'
                  onClick={() => void savePersonalDetails()}
                  disabled={updateProfileMutation.isPending || !canSavePersonalDetails}
                  className='rounded-full bg-[color:var(--accent)] px-4 py-2 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-50'
                >
                  {updateProfileMutation.isPending ? 'Saving...' : 'Save details'}
                </button>
              </div>
            </div>
          )}
        </section>
      )}

      {isOwnProfile && activeTab === 'notifications' && (
        <section className='rounded-2xl border border-[color:var(--border)] bg-[color:var(--surface-1)] p-6 shadow-sm'>
          <div className='flex items-start justify-between gap-4'>
            <div>
              <h2 className='text-lg font-semibold text-[color:var(--text-primary)]'>Notification settings</h2>
              <p className='mt-1 text-sm text-[color:var(--text-secondary)]'>Manage your email and push notification preferences.</p>
            </div>
          </div>

          {notificationPrefsEnabled ? (
            <NotificationPrefsPanel />
          ) : (
            <div className='mt-5 space-y-4'>
              {[
                { key: 'emailNewFollower', label: 'Email: New followers' },
                { key: 'emailArticlePublished', label: 'Email: Article published' },
                { key: 'emailWeeklyDigest', label: 'Email: Weekly digest' },
                { key: 'emailComments', label: 'Email: Comments' },
                { key: 'pushNewFollower', label: 'Push: New followers' },
                { key: 'pushComments', label: 'Push: Comments and replies' },
                { key: 'pushMentions', label: 'Push: Mentions' },
                { key: 'pushApproval', label: 'Push: Approval status' },
              ].map((item) => (
                <label key={item.key} className='flex items-center justify-between rounded-xl border border-[color:var(--border)] bg-[color:var(--surface-0)] px-4 py-3'>
                  <span className='text-sm text-[color:var(--text-primary)]'>{item.label}</span>
                  <YesNoToggle
                    value={notificationSettings[item.key as keyof NotificationSettings]}
                    onChange={(next) => {
                      setShowSavedNotificationNotice(false)
                      setNotificationSettings((prev) => ({
                        ...prev,
                        [item.key]: next,
                      }))
                    }}
                  />
                </label>
              ))}
            </div>
          )}

          {!notificationPrefsEnabled && (
            <div className='mt-5 flex items-center justify-between'>
              <span className='text-sm text-[color:var(--text-muted)]'>
                {showSavedNotificationNotice ? 'All notification settings saved' : 'Update and save your notification choices'}
              </span>
              <button
                type='button'
                onClick={() => void saveNotificationSettings()}
                disabled={updatePrefsMutation.isPending}
                className='rounded-full bg-[color:var(--accent)] px-5 py-2 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-50'
              >
                {updatePrefsMutation.isPending ? 'Saving...' : 'Save notifications'}
              </button>
            </div>
          )}
        </section>
      )}

      {isOwnProfile && activeTab === 'reading' && (
        <section className='rounded-2xl border border-[color:var(--border)] bg-[color:var(--surface-1)] p-6 shadow-sm'>
          <div className='flex items-start justify-between gap-4'>
            <div>
              <h2 className='text-lg font-semibold text-[color:var(--text-primary)]'>Reading settings</h2>
              <p className='mt-1 text-sm text-[color:var(--text-secondary)]'>Control your default reading experience.</p>
            </div>
          </div>

          <div className='mt-5 grid gap-4 sm:grid-cols-3'>
            <label className='block'>
              <span className='mb-1 block text-xs uppercase tracking-[0.14em] text-[color:var(--text-muted)]'>Default font</span>
              <select
                value={readingSettings.defaultFont}
                onChange={(e) => {
                  setShowSavedReadingSettingsNotice(false)
                  setReadingSettings((prev) => ({ ...prev, defaultFont: e.target.value as ReadingSettingsForm['defaultFont'] }))
                }}
                className='w-full rounded-xl border border-[color:var(--border-strong)] bg-[color:var(--surface-0)] px-3 py-2 text-sm text-[color:var(--text-primary)]'
              >
                <option value='serif'>Serif</option>
                <option value='sans'>Sans</option>
              </select>
            </label>
            <label className='block'>
              <span className='mb-1 block text-xs uppercase tracking-[0.14em] text-[color:var(--text-muted)]'>Font size</span>
              <select
                value={readingSettings.defaultFontSize}
                onChange={(e) => {
                  setShowSavedReadingSettingsNotice(false)
                  setReadingSettings((prev) => ({ ...prev, defaultFontSize: e.target.value as ReadingSettingsForm['defaultFontSize'] }))
                }}
                className='w-full rounded-xl border border-[color:var(--border-strong)] bg-[color:var(--surface-0)] px-3 py-2 text-sm text-[color:var(--text-primary)]'
              >
                <option value='sm'>Small</option>
                <option value='base'>Base</option>
                <option value='lg'>Large</option>
                <option value='xl'>Extra large</option>
              </select>
            </label>
            <label className='block'>
              <span className='mb-1 block text-xs uppercase tracking-[0.14em] text-[color:var(--text-muted)]'>Content width</span>
              <select
                value={readingSettings.defaultWidth}
                onChange={(e) => {
                  setShowSavedReadingSettingsNotice(false)
                  setReadingSettings((prev) => ({ ...prev, defaultWidth: e.target.value as ReadingSettingsForm['defaultWidth'] }))
                }}
                className='w-full rounded-xl border border-[color:var(--border-strong)] bg-[color:var(--surface-0)] px-3 py-2 text-sm text-[color:var(--text-primary)]'
              >
                <option value='wide'>Wide</option>
                <option value='medium'>Medium</option>
                <option value='narrow'>Narrow</option>
              </select>
            </label>
          </div>

          <div className='mt-4 space-y-3'>
            {[
              { key: 'autoBookmark', label: 'Auto-bookmark long reads' },
              { key: 'showReadingTime', label: 'Show reading time' },
              { key: 'showProgressBar', label: 'Show progress bar' },
            ].map((item) => (
              <label key={item.key} className='flex items-center justify-between rounded-xl border border-[color:var(--border)] bg-[color:var(--surface-0)] px-4 py-3'>
                <span className='text-sm text-[color:var(--text-primary)]'>{item.label}</span>
                <YesNoToggle
                  value={readingSettings[item.key as keyof ReadingSettingsForm] as boolean}
                  onChange={(next) => {
                    setShowSavedReadingSettingsNotice(false)
                    setReadingSettings((prev) => ({
                      ...prev,
                      [item.key]: next,
                    }))
                  }}
                />
              </label>
            ))}
          </div>

          <div className='mt-5 flex items-center justify-between'>
            <span className='text-sm text-[color:var(--text-muted)]'>
              {showSavedReadingSettingsNotice ? 'All reading settings saved' : 'Choose defaults for your reader experience'}
            </span>
            <button
              type='button'
              onClick={saveReadingSettings}
              className='rounded-full bg-[color:var(--accent)] px-5 py-2 text-sm font-semibold text-white'
            >
              Save reading settings
            </button>
          </div>
        </section>
      )}

      {isOwnProfile && activeTab === 'preferences' && (
        <section className='rounded-2xl border border-[color:var(--border)] bg-[color:var(--surface-1)] p-6 shadow-sm'>
          <div className='flex items-start justify-between gap-4'>
            <div>
              <h2 className='text-lg font-semibold text-[color:var(--text-primary)]'>Reading preferences</h2>
              <p className='mt-1 text-sm text-[color:var(--text-secondary)]'>Choose the topics you want to see more often. You can change them any time.</p>
            </div>
            <span className='rounded-full border border-[color:var(--border-strong)] px-3 py-1 text-xs text-[color:var(--text-muted)]'>
              {selectedTopics.length} selected
            </span>
          </div>

          <div className='mt-5 space-y-5'>
            {groupedPreferences.map((group) => (
              <div key={group.category.slug}>
                <h3 className='mb-3 text-sm font-semibold text-[color:var(--text-primary)]'>{group.category.name}</h3>
                <div className='flex flex-wrap gap-2'>
                  {group.topics.map((topic) => {
                    const active = selectedTopics.includes(topic.slug)
                    return (
                      <button
                        key={topic.slug}
                        type='button'
                        onClick={() => toggleTopic(topic.slug)}
                        className={[
                          'rounded-full border px-3 py-1.5 text-sm transition',
                          active
                            ? 'border-[color:var(--accent)] bg-[color:var(--accent)] text-white'
                            : 'border-[color:var(--border)] bg-[color:var(--surface-0)] text-[color:var(--text-primary)] hover:border-[color:var(--border-strong)]',
                        ].join(' ')}
                      >
                        {topic.name}
                      </button>
                    )
                  })}
                </div>
              </div>
            ))}
          </div>

          <div className='mt-6 flex items-center justify-between gap-3'>
            <span
              className={[
                'text-sm',
                hasPreferenceChanges
                  ? 'text-[color:#b54708] dark:text-[#f7b267]'
                  : showSavedPreferencesNotice
                    ? 'text-[color:#027a48] dark:text-[#75e0a7]'
                    : 'text-[color:var(--text-muted)]',
              ].join(' ')}
            >
              {hasPreferenceChanges
                ? 'Unsaved changes'
                : showSavedPreferencesNotice
                  ? 'All changes saved'
                  : 'Preferences are up to date'}
            </span>
            <button
              type='button'
              onClick={() => void savePreferences()}
              disabled={updatePrefsMutation.isPending || !hasPreferenceChanges}
              className='rounded-full bg-[color:var(--accent)] px-5 py-2 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-50'
            >
              {updatePrefsMutation.isPending ? 'Saving...' : 'Save preferences'}
            </button>
          </div>
        </section>
      )}

      {isOwnProfile && activeTab === 'account' && (
        <section className='rounded-2xl border border-[color:var(--border)] bg-[color:var(--surface-1)] p-6 shadow-sm'>
          <div className='flex items-start justify-between gap-4'>
            <div>
              <h2 className='text-lg font-semibold text-[color:var(--text-primary)]'>Account settings</h2>
              <p className='mt-1 text-sm text-[color:var(--text-secondary)]'>Manage your account details and lifecycle controls.</p>
            </div>
          </div>

          <dl className='mt-5 grid gap-4 sm:grid-cols-2'>
            <div className='rounded-xl border border-[color:var(--border)] bg-[color:var(--surface-0)] p-4'>
              <dt className='text-xs uppercase tracking-[0.14em] text-[color:var(--text-muted)]'>Email</dt>
              <dd className='mt-1 text-sm font-medium text-[color:var(--text-primary)]'>{profile.email || 'Not available'}</dd>
            </div>
            <div className='rounded-xl border border-[color:var(--border)] bg-[color:var(--surface-0)] p-4'>
              <dt className='text-xs uppercase tracking-[0.14em] text-[color:var(--text-muted)]'>Role</dt>
              <dd className='mt-1 text-sm font-medium text-[color:var(--text-primary)]'>{profile.role}</dd>
            </div>
          </dl>

          <div className='mt-6 rounded-xl border border-[color:rgba(180,35,24,0.35)] bg-[color:rgba(180,35,24,0.08)] p-4'>
            <h3 className='text-sm font-semibold text-[color:#b42318] dark:text-[#ff9f94]'>Danger zone</h3>
            <p className='mt-1 text-xs text-[color:var(--text-secondary)]'>Deactivating your account will disable access until an admin restores it.</p>
            <button
              type='button'
              onClick={() => {
                if (!confirm('Deactivate your account? This action cannot be undone from the UI.')) return
                deactivateAccountMutation.mutate()
              }}
              disabled={deactivateAccountMutation.isPending}
              className='mt-3 rounded-full border border-[color:rgba(180,35,24,0.45)] bg-[color:rgba(180,35,24,0.14)] px-4 py-2 text-sm font-semibold text-[color:#b42318] disabled:cursor-not-allowed disabled:opacity-50 dark:text-[#ff9f94]'
            >
              {deactivateAccountMutation.isPending ? 'Deactivating...' : 'Deactivate account'}
            </button>
          </div>

          {gdprControlsEnabled && <AccountDataPanel />}
          {sessionManagementEnabled && <ActiveSessionsPanel />}
          {blockMuteEnabled && <BlockMutePanel />}
          {customDomainsEnabled && <CustomDomainPanel enabled={customDomainsEnabled} />}
        </section>
      )}

      {isOwnProfile && activeTab === 'billing' && (
        <section className='rounded-2xl border border-[color:var(--border)] bg-[color:var(--surface-1)] p-6 shadow-sm'>
          <div className='flex items-start justify-between gap-4'>
            <div>
              <h2 className='text-lg font-semibold text-[color:var(--text-primary)]'>Billing settings</h2>
              <p className='mt-1 text-sm text-[color:var(--text-secondary)]'>Review your plan and manage membership billing.</p>
            </div>
            <span className='rounded-full border border-[color:var(--border-strong)] px-3 py-1 text-xs text-[color:var(--text-muted)]'>
              {(profile.membership_status || 'inactive').toUpperCase()}
            </span>
          </div>

          <div className='mt-5 rounded-xl border border-[color:var(--border)] bg-[color:var(--surface-0)] p-4'>
            <p className='text-xs uppercase tracking-[0.14em] text-[color:var(--text-muted)]'>Current plan</p>
            <p className='mt-1 text-lg font-semibold text-[color:var(--text-primary)]'>
              {(profile.membership_tier || 'free').toUpperCase()} plan
            </p>
            <p className='mt-1 text-sm text-[color:var(--text-secondary)]'>
              {profile.subscription_expires_at
                ? `Renews on ${new Date(profile.subscription_expires_at).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}`
                : 'No active paid subscription'}
            </p>
            <div className='mt-4 flex flex-wrap gap-2'>
              <Link
                to='/membership'
                className='rounded-full bg-[color:var(--surface-ink)] px-4 py-2 text-sm font-semibold text-[color:var(--surface-ink-foreground)]'
              >
                Manage billing
              </Link>
              <Link
                to='/membership'
                className='rounded-full border border-[color:var(--border-strong)] px-4 py-2 text-sm font-semibold text-[color:var(--text-primary)] hover:bg-[color:var(--surface-2)]'
              >
                Change plan
              </Link>
            </div>
          </div>
        </section>
      )}
    </div>
  )
}

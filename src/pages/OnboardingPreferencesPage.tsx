import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import { useTags } from '../hooks/useTags'
import { useUpdateUserPrefs, useUserPrefs } from '../hooks/useUserPrefs'
import type { Tag } from '../types'

function buildDefaultSelection(grouped: Array<{ category: Tag; topics: Tag[] }>) {
  const defaults: string[] = []
  for (const group of grouped) {
    for (const topic of group.topics) {
      if (!defaults.includes(topic.slug)) {
        defaults.push(topic.slug)
      }
      if (defaults.length >= 3) {
        return defaults
      }
    }
  }
  return defaults
}

export default function OnboardingPreferencesPage() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [selectionOverride, setSelectionOverride] = useState<string[] | null>(null)

  const { data: tags = [], isLoading: tagsLoading } = useTags({ onboarding: true })
  const { data: prefs, isLoading: prefsLoading } = useUserPrefs()
  const savePrefs = useUpdateUserPrefs()

  const grouped = useMemo(() => {
    const categories = tags.filter(tag => tag.is_onboarding_category)
    const byCategory = new Map<string, Tag[]>()

    for (const tag of tags) {
      if (!tag.category_slug || tag.is_onboarding_category) continue
      const items = byCategory.get(tag.category_slug) || []
      items.push(tag)
      byCategory.set(tag.category_slug, items)
    }

    return categories
      .sort((a, b) => a.name.localeCompare(b.name))
      .map(category => ({
        category,
        topics: (byCategory.get(category.slug) || []).sort((a, b) => {
          const countDelta = (b.article_count || 0) - (a.article_count || 0)
          if (countDelta !== 0) return countDelta
          return a.name.localeCompare(b.name)
        }),
      }))
      .filter(group => group.topics.length > 0)
  }, [tags])

  const initialSelection = useMemo(() => {
    const prefTopics = prefs?.topics || []
    if (prefTopics.length >= 3) {
      return [...new Set(prefTopics)]
    }
    return buildDefaultSelection(grouped)
  }, [grouped, prefs?.topics])

  const selectedTopics = selectionOverride ?? initialSelection

  useEffect(() => {
    if (!user) {
      navigate('/login', { replace: true })
    }
  }, [navigate, user])

  if (!user) return null

  const toggleTopic = (slug: string) => {
    setSelectionOverride(prev => {
      const current = prev ?? selectedTopics
      if (current.includes(slug)) {
        return current.filter(item => item !== slug)
      }
      return [...current, slug]
    })
  }

  const save = async () => {
    if (selectedTopics.length < 3) return

    await savePrefs.mutateAsync({
      topics: selectedTopics,
      email_notifs: prefs?.email_notifs ?? 1,
      theme: prefs?.theme ?? 'dark',
    })

    const nextPath = sessionStorage.getItem('post_onboarding_redirect')
      || sessionStorage.getItem('post_login_redirect')
      || '/'
    sessionStorage.removeItem('post_onboarding_redirect')
    sessionStorage.removeItem('post_login_redirect')
    navigate(nextPath, { replace: true })
  }

  return (
    <div data-testid='preferences-page' className='mx-auto w-full max-w-4xl px-4 py-8 sm:px-6 lg:py-12'>
      <div className='mb-6 rounded-2xl border border-[color:var(--border)] bg-[color:var(--surface-1)] p-5 shadow-[var(--shadow)]'>
        <h1 className='font-["Syne",system-ui,sans-serif] text-2xl font-bold text-[color:var(--text-primary)]'>
          What would you like to read?
        </h1>
        <p className='mt-2 font-["DM Sans",system-ui,sans-serif] text-sm text-[color:var(--text-muted)]'>
          Choose 3 topics or more to continue. Default will be below.
        </p>
      </div>

      {(tagsLoading || prefsLoading) && (
        <div className='rounded-xl border border-[color:var(--border)] bg-[color:var(--surface-1)] p-6 text-sm text-[color:var(--text-muted)]'>
          Loading topics...
        </div>
      )}

      {!tagsLoading && !prefsLoading && grouped.length === 0 && (
        <div className='rounded-xl border border-[color:var(--border)] bg-[color:var(--surface-1)] p-6 text-sm text-[color:var(--text-muted)]'>
          No onboarding topics found. Please contact an admin.
        </div>
      )}

      <div data-testid='topic-picker' className='space-y-5'>
        {grouped.map(group => (
          <section key={group.category.slug} className='rounded-2xl border border-[color:var(--border)] bg-[color:var(--surface-1)] p-5'>
            <h2 className='mb-3 font-["Syne",system-ui,sans-serif] text-lg font-semibold text-[color:var(--text-primary)]'>
              {group.category.name}
            </h2>
            <div className='flex flex-wrap gap-2'>
              {group.topics.map(topic => {
                const active = selectedTopics.includes(topic.slug)
                return (
                  <button
                    key={topic.slug}
                    type='button'
                    data-testid='topic-chip'
                    onClick={() => toggleTopic(topic.slug)}
                    className={`rounded-full border px-3 py-1.5 text-sm transition ${
                      active
                        ? 'border-[color:var(--accent)] bg-[color:var(--accent)] text-white'
                        : 'border-[color:var(--border)] bg-[color:var(--surface-0)] text-[color:var(--text-primary)] hover:border-[color:var(--border-strong)]'
                    }`}
                  >
                    {topic.name}
                  </button>
                )
              })}
            </div>
          </section>
        ))}
      </div>

      <div className='sticky bottom-4 mt-6 rounded-2xl border border-[color:var(--border)] bg-[color:var(--surface-1)] p-4 shadow-[var(--shadow)]'>
        <div className='flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between'>
          <p className='text-sm text-[color:var(--text-muted)]'>
            {selectedTopics.length} selected · minimum 3 required
          </p>
          <button
            type='button'
            onClick={() => void save()}
            disabled={selectedTopics.length < 3 || savePrefs.isPending}
            className='rounded-full bg-[color:var(--accent)] px-5 py-2 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-50'
          >
            {savePrefs.isPending ? 'Saving...' : 'Continue'}
          </button>
        </div>
      </div>
    </div>
  )
}

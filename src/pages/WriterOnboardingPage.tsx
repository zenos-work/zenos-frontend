import { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { ArrowLeft, ArrowRight, BookOpen, PenSquare, Sparkles, Tags, User } from 'lucide-react'
import { useAuth } from '../hooks/useAuth'
import { useTags } from '../hooks/useTags'
import { useUpdateUserPrefs, useUserPrefs } from '../hooks/useUserPrefs'
import type { Tag } from '../types'

type DraftProfile = {
  name: string
  handle: string
  bio: string
}

const STEPS = ['Welcome', 'Profile', 'Interests', 'First Story', 'Finish'] as const

function groupedTopics(tags: Tag[]) {
  const categories = tags.filter((tag) => tag.is_onboarding_category)
  const byCategory = new Map<string, Tag[]>()

  for (const tag of tags) {
    if (!tag.category_slug || tag.is_onboarding_category) continue
    const list = byCategory.get(tag.category_slug) ?? []
    list.push(tag)
    byCategory.set(tag.category_slug, list)
  }

  return categories
    .sort((a, b) => a.name.localeCompare(b.name))
    .map((category) => ({
      category,
      topics: (byCategory.get(category.slug) ?? []).sort((a, b) => (b.article_count || 0) - (a.article_count || 0)),
    }))
    .filter((group) => group.topics.length)
}

export default function WriterOnboardingPage() {
  const navigate = useNavigate()
  const { user } = useAuth()
  const savePrefs = useUpdateUserPrefs()
  const { data: tags = [], isLoading: tagsLoading } = useTags({ onboarding: true })
  const { data: prefs } = useUserPrefs()

  const [step, setStep] = useState(0)
  const [profile, setProfile] = useState<DraftProfile>(() => ({
    name: user?.name || '',
    handle: user?.name ? user.name.toLowerCase().replace(/\s+/g, '') : '',
    bio: '',
  }))
  const [selectedTopics, setSelectedTopics] = useState<string[]>([])

  const grouped = useMemo(() => groupedTopics(tags), [tags])
  const defaultSelectedTopics = useMemo(() => {
    const defaults = (prefs?.topics ?? []).slice(0, 5)
    if (defaults.length >= 3) return defaults

    const fallback: string[] = []
    for (const group of grouped) {
      for (const topic of group.topics) {
        fallback.push(topic.slug)
        if (fallback.length >= 3) return fallback
      }
    }
    return fallback
  }, [grouped, prefs?.topics])
  const effectiveSelectedTopics = selectedTopics.length ? selectedTopics : defaultSelectedTopics
  const progress = ((step + 1) / STEPS.length) * 100

  useEffect(() => {
    if (!user) {
      navigate('/login', { replace: true })
      return
    }

  }, [navigate, user])

  if (!user) return null

  const toggleTopic = (slug: string) => {
    setSelectedTopics((current) => {
      const source = current.length ? current : effectiveSelectedTopics
      return source.includes(slug)
        ? source.filter((item) => item !== slug)
        : [...source, slug]
    })
  }

  const completeOnboarding = async () => {
    await savePrefs.mutateAsync({
      topics: effectiveSelectedTopics,
      email_notifs: prefs?.email_notifs ?? 1,
      theme: (prefs?.theme === 'light' ? 'light' : 'dark') as 'light' | 'dark',
    })
    navigate('/write', { replace: true })
  }

  return (
    <div className='mx-auto w-full max-w-3xl px-4 py-6 sm:px-6 lg:py-10'>
      <header className='mb-6 rounded-2xl border border-[color:var(--border)] bg-[color:var(--surface-1)] p-5'>
        <div className='flex items-center justify-between gap-3'>
          <Link to='/' className='text-xl font-bold text-[color:var(--text-primary)]'>Zenos</Link>
          <span className='text-xs font-semibold uppercase tracking-wide text-[color:var(--text-muted)]'>Step {step + 1} of {STEPS.length}</span>
        </div>
        <div className='mt-4 h-1.5 w-full overflow-hidden rounded-full bg-[color:var(--surface-3)]'>
          <div className='h-full rounded-full bg-[color:var(--accent)] transition-all' style={{ width: `${progress}%` }} />
        </div>
      </header>

      <main className='rounded-2xl border border-[color:var(--border)] bg-[color:var(--surface-1)] p-6 sm:p-8'>
        {step === 0 && (
          <div className='text-center'>
            <div className='mx-auto grid h-16 w-16 place-items-center rounded-full bg-[color:var(--accent-dim)] text-[color:var(--accent)]'>
              <PenSquare size={28} />
            </div>
            <h1 className='mt-5 text-3xl font-bold text-[color:var(--text-primary)]'>Writer Onboarding</h1>
            <p className='mx-auto mt-3 max-w-xl text-sm leading-6 text-[color:var(--text-secondary)]'>
              Set up your writing profile, choose your editorial interests, and get ready to publish your first story.
            </p>
            <button
              type='button'
              onClick={() => setStep(1)}
              className='mt-8 inline-flex items-center gap-2 rounded-full bg-[color:var(--surface-ink)] px-5 py-2.5 text-sm font-semibold text-[color:var(--surface-ink-foreground)]'
            >
              Get started <ArrowRight size={14} />
            </button>
          </div>
        )}

        {step === 1 && (
          <div className='space-y-5'>
            <div className='flex items-center gap-3'>
              <div className='grid h-10 w-10 place-items-center rounded-full bg-[color:var(--accent-dim)] text-[color:var(--accent)]'>
                <User size={18} />
              </div>
              <div>
                <h2 className='text-2xl font-semibold text-[color:var(--text-primary)]'>Set up your profile</h2>
                <p className='text-sm text-[color:var(--text-secondary)]'>How readers will recognize you</p>
              </div>
            </div>

            <label className='block'>
              <span className='text-xs font-semibold uppercase tracking-wide text-[color:var(--text-muted)]'>Display Name</span>
              <input
                value={profile.name}
                onChange={(event) => setProfile((prev) => ({ ...prev, name: event.target.value }))}
                placeholder='Your name'
                className='mt-1.5 w-full rounded-xl border border-[color:var(--border)] bg-[color:var(--surface-0)] px-3 py-2 text-sm text-[color:var(--text-primary)] outline-none focus:border-[color:var(--border-strong)]'
              />
            </label>

            <label className='block'>
              <span className='text-xs font-semibold uppercase tracking-wide text-[color:var(--text-muted)]'>Handle</span>
              <input
                value={profile.handle}
                onChange={(event) => setProfile((prev) => ({ ...prev, handle: event.target.value.replace(/\s+/g, '') }))}
                placeholder='your-handle'
                className='mt-1.5 w-full rounded-xl border border-[color:var(--border)] bg-[color:var(--surface-0)] px-3 py-2 text-sm text-[color:var(--text-primary)] outline-none focus:border-[color:var(--border-strong)]'
              />
            </label>

            <label className='block'>
              <span className='text-xs font-semibold uppercase tracking-wide text-[color:var(--text-muted)]'>Bio</span>
              <textarea
                value={profile.bio}
                onChange={(event) => setProfile((prev) => ({ ...prev, bio: event.target.value }))}
                rows={4}
                placeholder='Tell readers what you write about...'
                className='mt-1.5 w-full rounded-xl border border-[color:var(--border)] bg-[color:var(--surface-0)] px-3 py-2 text-sm text-[color:var(--text-primary)] outline-none focus:border-[color:var(--border-strong)]'
              />
            </label>

            <div className='flex justify-between pt-2'>
              <button type='button' onClick={() => setStep(0)} className='inline-flex items-center gap-1.5 text-sm text-[color:var(--text-secondary)]'>
                <ArrowLeft size={14} /> Back
              </button>
              <button type='button' onClick={() => setStep(2)} className='inline-flex items-center gap-1.5 rounded-full bg-[color:var(--surface-ink)] px-4 py-2 text-sm font-semibold text-[color:var(--surface-ink-foreground)]'>
                Continue <ArrowRight size={14} />
              </button>
            </div>
          </div>
        )}

        {step === 2 && (
          <div className='space-y-5'>
            <div className='flex items-center gap-3'>
              <div className='grid h-10 w-10 place-items-center rounded-full bg-[color:var(--accent-dim)] text-[color:var(--accent)]'>
                <Tags size={18} />
              </div>
              <div>
                <h2 className='text-2xl font-semibold text-[color:var(--text-primary)]'>Choose interests</h2>
                <p className='text-sm text-[color:var(--text-secondary)]'>Pick at least 3 topics for feed and writer prompts</p>
              </div>
            </div>

            {tagsLoading ? (
              <div className='rounded-xl border border-[color:var(--border)] bg-[color:var(--surface-0)] px-4 py-6 text-sm text-[color:var(--text-secondary)]'>
                Loading topics...
              </div>
            ) : (
              <div className='space-y-4'>
                {grouped.map((group) => (
                  <section key={group.category.slug} className='rounded-xl border border-[color:var(--border)] bg-[color:var(--surface-0)] p-4'>
                    <h3 className='text-sm font-semibold text-[color:var(--text-primary)]'>{group.category.name}</h3>
                    <div className='mt-3 flex flex-wrap gap-2'>
                      {group.topics.map((topic) => {
                        const active = effectiveSelectedTopics.includes(topic.slug)
                        return (
                          <button
                            type='button'
                            key={topic.slug}
                            onClick={() => toggleTopic(topic.slug)}
                            className={`rounded-full border px-3 py-1.5 text-sm transition ${
                              active
                                ? 'border-[color:var(--accent)] bg-[color:var(--accent)] text-white'
                                : 'border-[color:var(--border)] text-[color:var(--text-primary)] hover:border-[color:var(--border-strong)]'
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
            )}

            <p className='text-xs text-[color:var(--text-muted)]'>{effectiveSelectedTopics.length} topics selected</p>

            <div className='flex justify-between pt-2'>
              <button type='button' onClick={() => setStep(1)} className='inline-flex items-center gap-1.5 text-sm text-[color:var(--text-secondary)]'>
                <ArrowLeft size={14} /> Back
              </button>
              <button
                type='button'
                onClick={() => setStep(3)}
                disabled={effectiveSelectedTopics.length < 3}
                className='inline-flex items-center gap-1.5 rounded-full bg-[color:var(--surface-ink)] px-4 py-2 text-sm font-semibold text-[color:var(--surface-ink-foreground)] disabled:opacity-50'
              >
                Continue <ArrowRight size={14} />
              </button>
            </div>
          </div>
        )}

        {step === 3 && (
          <div className='space-y-5'>
            <div className='flex items-center gap-3'>
              <div className='grid h-10 w-10 place-items-center rounded-full bg-[color:var(--accent-dim)] text-[color:var(--accent)]'>
                <BookOpen size={18} />
              </div>
              <div>
                <h2 className='text-2xl font-semibold text-[color:var(--text-primary)]'>Before your first story</h2>
                <p className='text-sm text-[color:var(--text-secondary)]'>Quick best practices from editors</p>
              </div>
            </div>

            <div className='space-y-2'>
              {[
                'Lead with a strong point of view and a clear problem.',
                'Aim for 800-1500 words to provide depth and clarity.',
                'Add 3-5 relevant tags for discoverability.',
                'Add citations (optional) for research-backed claims using source links.',
                'Use one cover image and meaningful section headings.',
                'Submit once ready; editorial review usually completes within 24-48h.',
              ].map((tip) => (
                <div key={tip} className='rounded-xl border border-[color:var(--border)] bg-[color:var(--surface-0)] px-4 py-3 text-sm text-[color:var(--text-primary)]'>
                  {tip}
                </div>
              ))}
            </div>

            <div className='flex justify-between pt-2'>
              <button type='button' onClick={() => setStep(2)} className='inline-flex items-center gap-1.5 text-sm text-[color:var(--text-secondary)]'>
                <ArrowLeft size={14} /> Back
              </button>
              <button type='button' onClick={() => setStep(4)} className='inline-flex items-center gap-1.5 rounded-full bg-[color:var(--surface-ink)] px-4 py-2 text-sm font-semibold text-[color:var(--surface-ink-foreground)]'>
                Continue <ArrowRight size={14} />
              </button>
            </div>
          </div>
        )}

        {step === 4 && (
          <div className='text-center'>
            <div className='mx-auto grid h-16 w-16 place-items-center rounded-full bg-[color:var(--accent-dim)] text-[color:var(--accent)]'>
              <Sparkles size={28} />
            </div>
            <h2 className='mt-5 text-3xl font-bold text-[color:var(--text-primary)]'>You are ready to publish</h2>
            <p className='mx-auto mt-3 max-w-xl text-sm leading-6 text-[color:var(--text-secondary)]'>
              Preferences are saved. Start drafting your first article and send it into the workflow when ready.
            </p>
            <div className='mt-8 flex flex-wrap justify-center gap-3'>
              <Link to='/history' className='rounded-full border border-[color:var(--border-strong)] px-4 py-2 text-sm font-semibold text-[color:var(--text-primary)]'>
                View reading history
              </Link>
              <button
                type='button'
                onClick={() => void completeOnboarding()}
                disabled={savePrefs.isPending || effectiveSelectedTopics.length < 3}
                className='inline-flex items-center gap-2 rounded-full bg-[color:var(--surface-ink)] px-4 py-2 text-sm font-semibold text-[color:var(--surface-ink-foreground)] disabled:opacity-50'
              >
                {savePrefs.isPending ? 'Saving...' : 'Start writing'} <PenSquare size={14} />
              </button>
            </div>
          </div>
        )}
      </main>
    </div>
  )
}

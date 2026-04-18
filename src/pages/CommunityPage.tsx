import { useState } from 'react'
import { Link } from 'react-router-dom'
import FeatureComingSoon from '../components/ui/FeatureComingSoon'
import Spinner from '../components/ui/Spinner'
import { useCreateSpace, useCommunitySpaces } from '../hooks/useCommunity'
import { useFeatureFlag } from '../hooks/useFeatureFlags'
import { useMyOrgs } from '../hooks/useOrg'
import { useUiStore } from '../stores/uiStore'

export default function CommunityPage() {
  const toast = useUiStore((s) => s.toast)
  const { enabled, isLoading: flagLoading } = useFeatureFlag('community')
  const orgs = useMyOrgs(enabled)
  const orgId = orgs.data?.organizations?.[0]?.id ?? ''
  const spaces = useCommunitySpaces(enabled)
  const createSpace = useCreateSpace()

  const [name, setName] = useState('')
  const [slug, setSlug] = useState('')

  if (flagLoading) return <div className='flex justify-center py-12'><Spinner /></div>
  if (!enabled) {
    return <FeatureComingSoon name='Community spaces' description='Community discussions and memberships are behind the community feature flag.' />
  }

  return (
    <div className='space-y-6'>
      <header>
        <h1 className='text-2xl font-bold text-[color:var(--text-primary)]'>Community spaces</h1>
        <p className='mt-1 text-sm text-[color:var(--text-secondary)]'>Join reader and creator communities, share updates, and run threaded discussions.</p>
      </header>

      <section className='rounded-xl border border-[color:var(--border)] bg-[color:var(--surface-1)] p-4'>
        <h2 className='text-sm font-semibold text-[color:var(--text-primary)]'>Create space</h2>
        <div className='mt-3 grid gap-3 md:grid-cols-[minmax(0,1fr)_220px_auto]'>
          <input value={name} onChange={(event) => setName(event.target.value)} placeholder='Space name' className='h-10 rounded-lg border border-[color:var(--border-strong)] bg-[color:var(--surface-0)] px-3 text-sm' />
          <input value={slug} onChange={(event) => setSlug(event.target.value)} placeholder='space-slug' className='h-10 rounded-lg border border-[color:var(--border-strong)] bg-[color:var(--surface-0)] px-3 text-sm' />
          <button
            type='button'
            className='rounded-full bg-[color:var(--accent)] px-4 py-2 text-sm font-semibold text-white'
            onClick={() => {
              if (!orgId || !name.trim() || !slug.trim()) {
                toast('Provide org, name, and slug', 'warning')
                return
              }
              void createSpace
                .mutateAsync({ org_id: orgId, name: name.trim(), slug: slug.trim(), space_type: 'open' })
                .then(() => {
                  setName('')
                  setSlug('')
                  toast('Space created', 'success')
                })
                .catch(() => toast('Could not create space', 'error'))
            }}
          >
            Create
          </button>
        </div>
      </section>

      {spaces.isLoading ? (
        <div className='flex justify-center py-12'><Spinner /></div>
      ) : (
        <div className='grid gap-4 md:grid-cols-2 xl:grid-cols-3'>
          {(spaces.data?.spaces ?? []).map((space) => (
            <article key={space.id} className='rounded-xl border border-[color:var(--border)] bg-[color:var(--surface-1)] p-4'>
              <h2 className='text-base font-semibold text-[color:var(--text-primary)]'>{space.name}</h2>
              <p className='mt-2 text-sm text-[color:var(--text-secondary)] line-clamp-3'>{space.description ?? 'No description yet.'}</p>
              <div className='mt-3 flex items-center justify-between'>
                <span className='text-xs uppercase tracking-wide text-[color:var(--text-muted)]'>{space.space_type ?? 'open'}</span>
                <Link to={`/community/${space.id}`} className='text-sm font-semibold text-[color:var(--accent)] hover:underline'>
                  Open
                </Link>
              </div>
            </article>
          ))}
        </div>
      )}
    </div>
  )
}

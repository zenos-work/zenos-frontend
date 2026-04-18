import { useState } from 'react'
import FeatureComingSoon from '../components/ui/FeatureComingSoon'
import Spinner from '../components/ui/Spinner'
import SurfaceCard from '../components/ui/SurfaceCard'
import Button from '../components/ui/Button'
import { useFeatureFlag } from '../hooks/useFeatureFlags'
import { useCreatePodcast, usePodcasts } from '../hooks/usePodcasts'
import { useUiStore } from '../stores/uiStore'

export default function PodcastBuilderPage() {
  const { enabled, isLoading: flagLoading } = useFeatureFlag('podcasts')
  const toast = useUiStore((s) => s.toast)
  const [title, setTitle] = useState('')
  const [slug, setSlug] = useState('')
  const { data, isLoading } = usePodcasts(enabled)
  const createPodcast = useCreatePodcast()

  if (flagLoading) return <div className='flex justify-center py-12'><Spinner /></div>
  if (!enabled) return <FeatureComingSoon name='Podcast Builder' description='Podcast management is currently behind the podcasts feature flag.' />
  if (isLoading) return <div className='flex justify-center py-12'><Spinner /></div>

  const create = async () => {
    if (!title.trim() || !slug.trim()) {
      toast('Title and slug are required', 'error')
      return
    }
    try {
      await createPodcast.mutateAsync({ title: title.trim(), slug: slug.trim() })
      setTitle('')
      setSlug('')
      toast('Podcast show created', 'success')
    } catch {
      toast('Failed to create podcast show', 'error')
    }
  }

  return (
    <div className='space-y-4'>
      <h1 className='text-2xl font-bold text-[color:var(--text-primary)]'>Podcast Builder</h1>
      <SurfaceCard className='space-y-3'>
        <h2 className='text-base font-semibold text-[color:var(--text-primary)]'>Create Show</h2>
        <input value={title} onChange={(e) => setTitle(e.target.value)} className='w-full rounded-lg border border-[color:var(--border)] bg-transparent px-3 py-2 text-sm' placeholder='Show title' />
        <input value={slug} onChange={(e) => setSlug(e.target.value)} className='w-full rounded-lg border border-[color:var(--border)] bg-transparent px-3 py-2 text-sm' placeholder='show-slug' />
        <Button onClick={() => void create()} disabled={createPodcast.isPending}>{createPodcast.isPending ? 'Creating...' : 'Create show'}</Button>
      </SurfaceCard>

      <SurfaceCard>
        <h2 className='text-base font-semibold text-[color:var(--text-primary)]'>Existing Shows</h2>
        <ul className='mt-3 space-y-2 text-sm text-[color:var(--text-secondary)]'>
          {(data?.shows ?? []).map((show) => <li key={show.id}>{show.title}</li>)}
          {(data?.shows ?? []).length === 0 && <li>No shows yet.</li>}
        </ul>
      </SurfaceCard>
    </div>
  )
}

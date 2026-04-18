import FeatureComingSoon from '../components/ui/FeatureComingSoon'
import Spinner from '../components/ui/Spinner'
import SurfaceCard from '../components/ui/SurfaceCard'
import { useFeatureFlag } from '../hooks/useFeatureFlags'
import { usePodcasts } from '../hooks/usePodcasts'

export default function PodcastsPage() {
  const { enabled, isLoading: flagLoading } = useFeatureFlag('podcasts')
  const { data, isLoading } = usePodcasts(enabled)

  if (flagLoading) return <div className='flex justify-center py-12'><Spinner /></div>
  if (!enabled) return <FeatureComingSoon name='Podcasts' description='Podcast shows and episodes are currently behind the podcasts feature flag.' />
  if (isLoading) return <div className='flex justify-center py-12'><Spinner /></div>

  const shows = data?.shows ?? []

  return (
    <div className='space-y-4'>
      <h1 className='text-2xl font-bold text-[color:var(--text-primary)]'>Podcasts</h1>
      {shows.length === 0 ? (
        <SurfaceCard>
          <p className='text-sm text-[color:var(--text-secondary)]'>No podcast shows yet.</p>
        </SurfaceCard>
      ) : (
        <div className='grid gap-4 md:grid-cols-2'>
          {shows.map((show) => (
            <SurfaceCard key={show.id}>
              <h2 className='text-lg font-semibold text-[color:var(--text-primary)]'>{show.title}</h2>
              <p className='mt-2 text-sm text-[color:var(--text-secondary)]'>{show.description || 'No description provided.'}</p>
            </SurfaceCard>
          ))}
        </div>
      )}
    </div>
  )
}

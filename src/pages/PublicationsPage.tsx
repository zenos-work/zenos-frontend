import { useState } from 'react'
import FeatureComingSoon from '../components/ui/FeatureComingSoon'
import Spinner from '../components/ui/Spinner'
import SurfaceCard from '../components/ui/SurfaceCard'
import Button from '../components/ui/Button'
import { useFeatureFlag } from '../hooks/useFeatureFlags'
import { useCreateIssue, usePublicationIssues } from '../hooks/usePublications'
import { useUiStore } from '../stores/uiStore'

export default function PublicationsPage() {
  const { enabled, isLoading: flagLoading } = useFeatureFlag('publications')
  const toast = useUiStore((s) => s.toast)
  const [title, setTitle] = useState('')
  const [slug, setSlug] = useState('')
  const { data, isLoading } = usePublicationIssues(enabled)
  const createIssue = useCreateIssue()

  if (flagLoading) return <div className='flex justify-center py-12'><Spinner /></div>
  if (!enabled) return <FeatureComingSoon name='Publications' description='Publication issue workflows are currently behind the publications feature flag.' />
  if (isLoading) return <div className='flex justify-center py-12'><Spinner /></div>

  const create = async () => {
    if (!title.trim() || !slug.trim()) {
      toast('Title and slug are required', 'error')
      return
    }
    try {
      await createIssue.mutateAsync({ title: title.trim(), slug: slug.trim(), issue_type: 'magazine' })
      setTitle('')
      setSlug('')
      toast('Publication issue created', 'success')
    } catch {
      toast('Failed to create issue', 'error')
    }
  }

  return (
    <div className='space-y-4'>
      <h1 className='text-2xl font-bold text-[color:var(--text-primary)]'>Publications</h1>
      <SurfaceCard className='space-y-3'>
        <h2 className='text-base font-semibold text-[color:var(--text-primary)]'>Create Issue</h2>
        <input value={title} onChange={(e) => setTitle(e.target.value)} className='w-full rounded-lg border border-[color:var(--border)] bg-transparent px-3 py-2 text-sm' placeholder='Issue title' />
        <input value={slug} onChange={(e) => setSlug(e.target.value)} className='w-full rounded-lg border border-[color:var(--border)] bg-transparent px-3 py-2 text-sm' placeholder='issue-slug' />
        <Button onClick={() => void create()} disabled={createIssue.isPending}>{createIssue.isPending ? 'Creating...' : 'Create issue'}</Button>
      </SurfaceCard>
      <SurfaceCard>
        <h2 className='text-base font-semibold text-[color:var(--text-primary)]'>Issues</h2>
        <ul className='mt-3 space-y-2 text-sm text-[color:var(--text-secondary)]'>
          {(data?.issues ?? []).map((issue) => <li key={issue.id}>{issue.title}</li>)}
          {(data?.issues ?? []).length === 0 && <li>No issues yet.</li>}
        </ul>
      </SurfaceCard>
    </div>
  )
}

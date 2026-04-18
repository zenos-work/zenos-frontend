import { useState } from 'react'
import FeatureComingSoon from '../components/ui/FeatureComingSoon'
import Spinner from '../components/ui/Spinner'
import SurfaceCard from '../components/ui/SurfaceCard'
import Button from '../components/ui/Button'
import { useFeatureFlag } from '../hooks/useFeatureFlags'
import { useAbTests, useCreateAbTest } from '../hooks/useMarketing'
import { useUiStore } from '../stores/uiStore'

export default function MarketingPage() {
  const { enabled, isLoading: flagLoading } = useFeatureFlag('marketing_tools')
  const toast = useUiStore((s) => s.toast)
  const [orgId, setOrgId] = useState('')
  const [name, setName] = useState('')
  const { data, isLoading } = useAbTests(orgId, enabled && !!orgId)
  const createAbTest = useCreateAbTest()

  if (flagLoading) return <div className='flex justify-center py-12'><Spinner /></div>
  if (!enabled) return <FeatureComingSoon name='Marketing' description='Marketing channels and experiments are currently behind the marketing_tools feature flag.' />

  const create = async () => {
    if (!orgId.trim() || !name.trim()) {
      toast('Org ID and test name are required', 'error')
      return
    }
    try {
      await createAbTest.mutateAsync({ org_id: orgId.trim(), name: name.trim(), objective: 'conversion' })
      setName('')
      toast('A/B test created', 'success')
    } catch {
      toast('Failed to create A/B test', 'error')
    }
  }

  return (
    <div className='space-y-4'>
      <h1 className='text-2xl font-bold text-[color:var(--text-primary)]'>Marketing</h1>
      <SurfaceCard className='space-y-3'>
        <h2 className='text-base font-semibold text-[color:var(--text-primary)]'>A/B Test Manager</h2>
        <input value={orgId} onChange={(e) => setOrgId(e.target.value)} className='w-full rounded-lg border border-[color:var(--border)] bg-transparent px-3 py-2 text-sm' placeholder='Organization ID' />
        <input value={name} onChange={(e) => setName(e.target.value)} className='w-full rounded-lg border border-[color:var(--border)] bg-transparent px-3 py-2 text-sm' placeholder='Experiment name' />
        <Button onClick={() => void create()} disabled={createAbTest.isPending}>{createAbTest.isPending ? 'Creating...' : 'Create A/B test'}</Button>
      </SurfaceCard>

      <SurfaceCard>
        <h2 className='text-base font-semibold text-[color:var(--text-primary)]'>Experiments</h2>
        {isLoading ? <Spinner /> : (
          <ul className='mt-3 space-y-2 text-sm text-[color:var(--text-secondary)]'>
            {(data?.campaigns ?? []).map((campaign) => <li key={campaign.id}>{campaign.name}</li>)}
            {(data?.campaigns ?? []).length === 0 && <li>No experiments yet.</li>}
          </ul>
        )}
      </SurfaceCard>
    </div>
  )
}

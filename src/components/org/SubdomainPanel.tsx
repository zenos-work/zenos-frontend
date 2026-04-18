import { useState } from 'react'
import Button from '../ui/Button'
import SurfaceCard from '../ui/SurfaceCard'
import { useDeactivateSubdomain, useOrgSubdomain, useUpdateSubdomain } from '../../hooks/useOrgInfra'
import { useUiStore } from '../../stores/uiStore'

export default function SubdomainPanel({ orgId, enabled }: { orgId: string; enabled: boolean }) {
  const toast = useUiStore((s) => s.toast)
  const currentQuery = useOrgSubdomain(orgId, enabled)
  const updateMutation = useUpdateSubdomain(orgId)
  const deactivateMutation = useDeactivateSubdomain(orgId)
  const [nextSubdomain, setNextSubdomain] = useState('')

  const handleUpdate = async () => {
    const trimmed = nextSubdomain.trim().toLowerCase()
    if (!trimmed) {
      toast('Subdomain is required', 'warning')
      return
    }
    try {
      await updateMutation.mutateAsync(trimmed)
      setNextSubdomain('')
      toast('Subdomain updated', 'success')
    } catch {
      toast('Could not update subdomain', 'error')
    }
  }

  const handleDeactivate = async () => {
    if (!confirm('Deactivate this subdomain?')) return
    try {
      await deactivateMutation.mutateAsync()
      toast('Subdomain deactivated', 'success')
    } catch {
      toast('Could not deactivate subdomain', 'error')
    }
  }

  return (
    <SurfaceCard>
      <h3 className='mb-3 text-base font-semibold text-[color:var(--text-primary)]'>Org Subdomain</h3>
      {currentQuery.isLoading ? (
        <p className='text-sm text-[color:var(--text-secondary)]'>Loading current subdomain...</p>
      ) : (
        <p className='mb-3 text-sm text-[color:var(--text-secondary)]'>
          Current: <span className='font-semibold text-[color:var(--text-primary)]'>{currentQuery.data?.subdomain || 'none configured'}</span>
        </p>
      )}

      <div className='flex flex-col gap-3 sm:flex-row'>
        <input
          value={nextSubdomain}
          onChange={(event) => setNextSubdomain(event.target.value)}
          placeholder='new-subdomain'
          className='h-10 flex-1 rounded-lg border border-[color:var(--border)] bg-[color:var(--surface-0)] px-3 text-sm text-[color:var(--text-primary)]'
        />
        <Button onClick={() => void handleUpdate()} loading={updateMutation.isPending}>Update</Button>
        <Button variant='secondary' onClick={() => void handleDeactivate()} loading={deactivateMutation.isPending}>Deactivate</Button>
      </div>
    </SurfaceCard>
  )
}

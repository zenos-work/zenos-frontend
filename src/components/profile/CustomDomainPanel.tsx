import { useState } from 'react'
import Button from '../ui/Button'
import SurfaceCard from '../ui/SurfaceCard'
import { useAddDomain, useDeleteDomain, useMyDomains, useVerifyDomain } from '../../hooks/useDomains'
import { useUiStore } from '../../stores/uiStore'

export default function CustomDomainPanel({ enabled }: { enabled: boolean }) {
  const toast = useUiStore((s) => s.toast)
  const [domain, setDomain] = useState('')
  const domainsQuery = useMyDomains(enabled)
  const addMutation = useAddDomain()
  const deleteMutation = useDeleteDomain()
  const verifyMutation = useVerifyDomain()

  const handleAddDomain = async () => {
    const value = domain.trim().toLowerCase()
    if (!value) {
      toast('Domain is required', 'warning')
      return
    }
    try {
      await addMutation.mutateAsync({ domain: value })
      setDomain('')
      toast('Domain added', 'success')
    } catch {
      toast('Could not add domain', 'error')
    }
  }

  const handleVerify = async (domainId: string) => {
    try {
      await verifyMutation.mutateAsync(domainId)
      toast('Verification requested', 'success')
    } catch {
      toast('Could not verify domain', 'error')
    }
  }

  const handleDelete = async (domainId: string) => {
    if (!confirm('Remove this custom domain?')) return
    try {
      await deleteMutation.mutateAsync(domainId)
      toast('Domain removed', 'success')
    } catch {
      toast('Could not remove domain', 'error')
    }
  }

  return (
    <SurfaceCard>
      <h3 className='mb-3 text-base font-semibold text-[color:var(--text-primary)]'>Custom Domains</h3>

      <div className='flex flex-col gap-3 sm:flex-row'>
        <input
          value={domain}
          onChange={(event) => setDomain(event.target.value)}
          placeholder='yourdomain.com'
          className='h-10 flex-1 rounded-lg border border-[color:var(--border)] bg-[color:var(--surface-0)] px-3 text-sm text-[color:var(--text-primary)]'
        />
        <Button onClick={() => void handleAddDomain()} loading={addMutation.isPending}>Add Domain</Button>
      </div>

      <p className='mt-2 text-xs text-[color:var(--text-muted)]'>
        Set a CNAME record to `cname.zenos.work` and verify to activate routing.
      </p>

      <div className='mt-4 space-y-2'>
        {domainsQuery.isLoading ? (
          <p className='text-sm text-[color:var(--text-secondary)]'>Loading domains...</p>
        ) : !(domainsQuery.data?.domains?.length) ? (
          <p className='text-sm text-[color:var(--text-secondary)]'>No custom domains configured.</p>
        ) : (
          domainsQuery.data.domains.map((entry) => (
            <div key={entry.id} className='flex items-center justify-between gap-2 rounded-lg border border-[color:var(--border)] bg-[color:var(--surface-0)] p-3'>
              <div>
                <p className='text-sm font-medium text-[color:var(--text-primary)]'>{entry.domain}</p>
                <p className='text-xs text-[color:var(--text-muted)]'>
                  Verification: {entry.verification_status} • SSL: {entry.ssl_status}
                </p>
              </div>
              <div className='flex items-center gap-2'>
                <Button size='sm' variant='secondary' onClick={() => void handleVerify(entry.id)} loading={verifyMutation.isPending}>Verify</Button>
                <Button size='sm' variant='secondary' onClick={() => void handleDelete(entry.id)} loading={deleteMutation.isPending}>Remove</Button>
              </div>
            </div>
          ))
        )}
      </div>
    </SurfaceCard>
  )
}

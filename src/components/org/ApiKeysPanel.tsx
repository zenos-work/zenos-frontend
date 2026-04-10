import { useState } from 'react'
import Button from '../ui/Button'
import SurfaceCard from '../ui/SurfaceCard'
import { useCreateApiKey, useOrgApiKeys, useRevokeApiKey } from '../../hooks/useOrgInfra'
import { useUiStore } from '../../stores/uiStore'

export default function ApiKeysPanel({ orgId, enabled }: { orgId: string; enabled: boolean }) {
  const toast = useUiStore((s) => s.toast)
  const [name, setName] = useState('')
  const [lastCreatedSecret, setLastCreatedSecret] = useState('')
  const keysQuery = useOrgApiKeys(orgId, enabled)
  const createMutation = useCreateApiKey(orgId)
  const revokeMutation = useRevokeApiKey(orgId)

  const handleCreate = async () => {
    const trimmed = name.trim()
    if (!trimmed) {
      toast('API key name is required', 'warning')
      return
    }
    try {
      const created = await createMutation.mutateAsync({ name: trimmed, scopes: ['read', 'write'] })
      setName('')
      setLastCreatedSecret(created.key)
      toast('API key created', 'success')
    } catch {
      toast('Could not create API key', 'error')
    }
  }

  const handleRevoke = async (keyId: string) => {
    if (!confirm('Revoke this API key?')) return
    try {
      await revokeMutation.mutateAsync(keyId)
      toast('API key revoked', 'success')
    } catch {
      toast('Could not revoke API key', 'error')
    }
  }

  return (
    <div className='space-y-4'>
      <SurfaceCard>
        <h3 className='mb-2 text-base font-semibold text-[color:var(--text-primary)]'>Create API Key</h3>
        <div className='flex flex-col gap-3 sm:flex-row'>
          <input
            value={name}
            onChange={(event) => setName(event.target.value)}
            placeholder='Server integration key name'
            className='h-10 flex-1 rounded-lg border border-[color:var(--border)] bg-[color:var(--surface-0)] px-3 text-sm text-[color:var(--text-primary)]'
          />
          <Button onClick={() => void handleCreate()} loading={createMutation.isPending}>Create Key</Button>
        </div>
        {lastCreatedSecret && (
          <div className='mt-3 rounded-lg border border-[color:var(--border)] bg-[color:var(--surface-0)] p-3'>
            <p className='text-xs font-semibold uppercase tracking-wide text-[color:var(--text-muted)]'>Copy once</p>
            <p className='mt-1 break-all font-mono text-sm text-[color:var(--text-primary)]'>{lastCreatedSecret}</p>
          </div>
        )}
      </SurfaceCard>

      <SurfaceCard>
        <h3 className='mb-3 text-base font-semibold text-[color:var(--text-primary)]'>Existing API Keys</h3>
        {keysQuery.isLoading ? (
          <p className='text-sm text-[color:var(--text-secondary)]'>Loading keys...</p>
        ) : !(keysQuery.data?.api_keys?.length) ? (
          <p className='text-sm text-[color:var(--text-secondary)]'>No keys created yet.</p>
        ) : (
          <div className='space-y-2'>
            {keysQuery.data.api_keys.map((key) => (
              <div key={key.id} className='flex items-center justify-between gap-3 rounded-lg border border-[color:var(--border)] bg-[color:var(--surface-0)] p-3'>
                <div>
                  <p className='text-sm font-medium text-[color:var(--text-primary)]'>{key.name}</p>
                  <p className='text-xs text-[color:var(--text-muted)]'>Prefix: {key.key_prefix} • Created {new Date(key.created_at).toLocaleDateString()}</p>
                </div>
                <Button size='sm' variant='secondary' onClick={() => void handleRevoke(key.id)} loading={revokeMutation.isPending}>Revoke</Button>
              </div>
            ))}
          </div>
        )}
      </SurfaceCard>
    </div>
  )
}

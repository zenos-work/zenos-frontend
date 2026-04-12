import { useState } from 'react'
import Button from '../ui/Button'
import SurfaceCard from '../ui/SurfaceCard'
import {
  useRevokeSecret,
  useRotateSecret,
  useStoreSecret,
  useTestSecret,
  useVaultSecrets,
} from '../../hooks/useOrgInfra'
import { useUiStore } from '../../stores/uiStore'

export default function VaultPanel({ orgId, enabled }: { orgId: string; enabled: boolean }) {
  const toast = useUiStore((s) => s.toast)
  const [name, setName] = useState('')
  const [value, setValue] = useState('')

  const secretsQuery = useVaultSecrets(orgId, enabled)
  const storeMutation = useStoreSecret(orgId)
  const revokeMutation = useRevokeSecret(orgId)
  const rotateMutation = useRotateSecret(orgId)
  const testMutation = useTestSecret(orgId)

  const handleCreate = async () => {
    const secretName = name.trim()
    const secretValue = value.trim()
    if (!secretName || !secretValue) {
      toast('Secret name and value are required', 'warning')
      return
    }

    try {
      await storeMutation.mutateAsync({ name: secretName, value: secretValue })
      setName('')
      setValue('')
      toast('Secret stored in vault', 'success')
    } catch {
      toast('Could not store secret', 'error')
    }
  }

  const handleRevoke = async (secretId: string) => {
    if (!confirm('Revoke this secret from vault?')) return
    try {
      await revokeMutation.mutateAsync(secretId)
      toast('Secret revoked', 'success')
    } catch {
      toast('Could not revoke secret', 'error')
    }
  }

  const handleRotate = async (secretName: string) => {
    try {
      await rotateMutation.mutateAsync({ name: secretName })
      toast('Secret rotated', 'success')
    } catch {
      toast('Could not rotate secret', 'error')
    }
  }

  const handleTest = async (secretName: string) => {
    try {
      const result = await testMutation.mutateAsync(secretName)
      const ok = Boolean(result.exists && result.is_active)
      toast(ok ? 'Secret test passed' : result.message ?? 'Secret test failed', ok ? 'success' : 'error')
    } catch {
      toast('Could not test secret', 'error')
    }
  }

  return (
    <div className='space-y-4'>
      <SurfaceCard>
        <h3 className='mb-2 text-base font-semibold text-[color:var(--text-primary)]'>Store Vault Secret</h3>
        <p className='mb-3 text-sm text-[color:var(--text-secondary)]'>
          Secrets are stored in the vault and workflow nodes only reference secret names.
        </p>

        <div className='grid gap-3 sm:grid-cols-2'>
          <input
            value={name}
            onChange={(event) => setName(event.target.value)}
            placeholder='Secret name (example: SENDGRID_API_KEY)'
            className='h-10 rounded-lg border border-[color:var(--border)] bg-[color:var(--surface-0)] px-3 text-sm text-[color:var(--text-primary)]'
          />
          <input
            value={value}
            onChange={(event) => setValue(event.target.value)}
            type='password'
            placeholder='Secret value'
            className='h-10 rounded-lg border border-[color:var(--border)] bg-[color:var(--surface-0)] px-3 text-sm text-[color:var(--text-primary)]'
          />
        </div>

        <div className='mt-3'>
          <Button onClick={() => void handleCreate()} loading={storeMutation.isPending}>Store Secret</Button>
        </div>
      </SurfaceCard>

      <SurfaceCard>
        <h3 className='mb-3 text-base font-semibold text-[color:var(--text-primary)]'>Vault Secrets</h3>
        {secretsQuery.isLoading ? (
          <p className='text-sm text-[color:var(--text-secondary)]'>Loading vault secrets...</p>
        ) : !(secretsQuery.data?.secrets?.length) ? (
          <p className='text-sm text-[color:var(--text-secondary)]'>No secrets stored yet.</p>
        ) : (
          <div className='space-y-3'>
            {secretsQuery.data.secrets.map((secret) => (
              <div key={secret.id} className='rounded-lg border border-[color:var(--border)] bg-[color:var(--surface-0)] p-3'>
                <div className='flex flex-wrap items-center justify-between gap-2'>
                  <div>
                    <p className='text-sm font-medium text-[color:var(--text-primary)]'>{secret.name}</p>
                    <p className='text-xs text-[color:var(--text-muted)]'>Created {new Date(secret.created_at).toLocaleDateString()}</p>
                  </div>
                  <div className='flex flex-wrap gap-2'>
                    <Button size='sm' variant='secondary' loading={testMutation.isPending} onClick={() => void handleTest(secret.name)}>
                      Test
                    </Button>
                    <Button size='sm' variant='danger' loading={revokeMutation.isPending} onClick={() => void handleRevoke(secret.id)}>
                      Revoke
                    </Button>
                    <Button size='sm' variant='secondary' loading={rotateMutation.isPending} onClick={() => void handleRotate(secret.name)}>
                      Rotate
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </SurfaceCard>
    </div>
  )
}

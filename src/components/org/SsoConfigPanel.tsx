import { useMemo, useState } from 'react'
import Button from '../ui/Button'
import SurfaceCard from '../ui/SurfaceCard'
import { useCreateSsoConfig, useOrgSsoConfigs, useUpdateSsoConfig } from '../../hooks/useOrgInfra'
import { useUiStore } from '../../stores/uiStore'

const PROVIDERS = ['okta', 'azure_ad', 'google_workspace'] as const
const PROTOCOLS = ['saml', 'oidc'] as const

export default function SsoConfigPanel({ orgId, enabled }: { orgId: string; enabled: boolean }) {
  const toast = useUiStore((s) => s.toast)
  const configsQuery = useOrgSsoConfigs(orgId, enabled)
  const createMutation = useCreateSsoConfig(orgId)
  const updateMutation = useUpdateSsoConfig(orgId)

  const [providerType, setProviderType] = useState<(typeof PROVIDERS)[number]>('okta')
  const [protocol, setProtocol] = useState<(typeof PROTOCOLS)[number]>('saml')
  const [issuerUrl, setIssuerUrl] = useState('')
  const [metadataUrl, setMetadataUrl] = useState('')

  const firstConfig = useMemo(() => configsQuery.data?.configs?.[0], [configsQuery.data])

  const payload = {
    provider_type: providerType,
    protocol,
    issuer_url: issuerUrl,
    metadata_url: metadataUrl,
    is_active: true,
    enforce_sso: true,
    jit_provisioning: true,
    default_role: 'READER',
  }

  const handleSave = async () => {
    try {
      if (firstConfig?.id) {
        await updateMutation.mutateAsync({ configId: firstConfig.id, payload })
        toast('SSO config updated', 'success')
      } else {
        await createMutation.mutateAsync(payload)
        toast('SSO config created', 'success')
      }
    } catch {
      toast('Could not save SSO config', 'error')
    }
  }

  return (
    <SurfaceCard>
      <h3 className='mb-3 text-base font-semibold text-[color:var(--text-primary)]'>SSO Configuration</h3>
      <div className='grid gap-3 md:grid-cols-2'>
        <select
          value={providerType}
          onChange={(event) => setProviderType(event.target.value as (typeof PROVIDERS)[number])}
          className='h-10 rounded-lg border border-[color:var(--border)] bg-[color:var(--surface-0)] px-3 text-sm text-[color:var(--text-primary)]'
        >
          {PROVIDERS.map((provider) => <option key={provider} value={provider}>{provider}</option>)}
        </select>
        <select
          value={protocol}
          onChange={(event) => setProtocol(event.target.value as (typeof PROTOCOLS)[number])}
          className='h-10 rounded-lg border border-[color:var(--border)] bg-[color:var(--surface-0)] px-3 text-sm text-[color:var(--text-primary)]'
        >
          {PROTOCOLS.map((nextProtocol) => <option key={nextProtocol} value={nextProtocol}>{nextProtocol}</option>)}
        </select>
        <input
          value={issuerUrl}
          onChange={(event) => setIssuerUrl(event.target.value)}
          placeholder='Issuer URL'
          className='h-10 rounded-lg border border-[color:var(--border)] bg-[color:var(--surface-0)] px-3 text-sm text-[color:var(--text-primary)]'
        />
        <input
          value={metadataUrl}
          onChange={(event) => setMetadataUrl(event.target.value)}
          placeholder='Metadata URL'
          className='h-10 rounded-lg border border-[color:var(--border)] bg-[color:var(--surface-0)] px-3 text-sm text-[color:var(--text-primary)]'
        />
      </div>

      <div className='mt-3'>
        <Button onClick={() => void handleSave()} loading={createMutation.isPending || updateMutation.isPending}>Save SSO Config</Button>
      </div>

      {firstConfig && (
        <div className='mt-3 rounded-lg border border-[color:var(--border)] bg-[color:var(--surface-0)] p-3'>
          <p className='text-xs uppercase tracking-wide text-[color:var(--text-muted)]'>Current config</p>
          <p className='mt-1 text-sm text-[color:var(--text-primary)]'>
            {firstConfig.provider_type || 'unknown'} • {firstConfig.protocol || 'unknown'}
          </p>
        </div>
      )}
    </SurfaceCard>
  )
}

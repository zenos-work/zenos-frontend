import { Link, useParams } from 'react-router-dom'
import { useState } from 'react'
import FeatureComingSoon from '../components/ui/FeatureComingSoon'
import Spinner from '../components/ui/Spinner'
import SurfaceCard from '../components/ui/SurfaceCard'
import { useFeatureFlag } from '../hooks/useFeatureFlags'
import { useOrg } from '../hooks/useOrg'
import ApiKeysPanel from '../components/org/ApiKeysPanel'
import AuditLogPanel from '../components/org/AuditLogPanel'
import SubdomainPanel from '../components/org/SubdomainPanel'
import SsoConfigPanel from '../components/org/SsoConfigPanel'

type SettingsTab =
  | 'general'
  | 'api-keys'
  | 'audit-log'
  | 'sso'
  | 'subdomain'
  | 'vault'
  | 'add-ons'
  | 'usage'

const TABS: Array<{ key: SettingsTab; label: string }> = [
  { key: 'general', label: 'General' },
  { key: 'api-keys', label: 'API Keys' },
  { key: 'audit-log', label: 'Audit Log' },
  { key: 'sso', label: 'SSO' },
  { key: 'subdomain', label: 'Subdomain' },
  { key: 'vault', label: 'Vault' },
  { key: 'add-ons', label: 'Add-ons' },
  { key: 'usage', label: 'Usage' },
]

export default function OrgSettingsPage() {
  const { id = '' } = useParams()
  const { enabled, isLoading: flagLoading } = useFeatureFlag('organizations')
  const { enabled: orgApiKeysEnabled } = useFeatureFlag('org_api_keys', enabled)
  const { enabled: auditLogEnabled } = useFeatureFlag('audit_log', enabled)
  const { enabled: orgSubdomainEnabled } = useFeatureFlag('org_subdomain', enabled)
  const { enabled: ssoEnabled } = useFeatureFlag('sso', enabled)
  const [activeTab, setActiveTab] = useState<SettingsTab>('general')
  const orgQuery = useOrg(id, enabled)

  if (flagLoading) {
    return <div className='flex justify-center py-12'><Spinner /></div>
  }

  if (!enabled) {
    return <FeatureComingSoon name='Organization Settings' description='Org-level settings are currently gated by the organizations flag.' />
  }

  if (orgQuery.isLoading) {
    return <div className='flex justify-center py-12'><Spinner /></div>
  }

  if (!orgQuery.data) {
    return (
      <SurfaceCard>
        <h1 className='text-lg font-semibold text-[color:var(--text-primary)]'>Organization not found</h1>
      </SurfaceCard>
    )
  }

  return (
    <div className='space-y-6'>
      <SurfaceCard>
        <div className='flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between'>
          <div>
            <h1 className='text-xl font-bold text-[color:var(--text-primary)]'>Organization Settings</h1>
            <p className='mt-1 text-sm text-[color:var(--text-secondary)]'>
              {orgQuery.data.name} • Configure governance, access, and integration settings.
            </p>
          </div>
          <Link
            to={`/org/${id}`}
            className='inline-flex h-10 items-center rounded-lg border border-[color:var(--border)] px-3 text-sm font-medium text-[color:var(--text-primary)] hover:bg-[color:var(--surface-2)]'
          >
            Back to Org Dashboard
          </Link>
        </div>
      </SurfaceCard>

      <div className='flex flex-wrap gap-2'>
        {TABS.map((tab) => (
          <button
            key={tab.key}
            type='button'
            onClick={() => setActiveTab(tab.key)}
            className={[
              'rounded-full border px-4 py-2 text-sm font-medium transition-colors',
              activeTab === tab.key
                ? 'border-[color:var(--accent)] bg-[color:var(--accent)] text-white'
                : 'border-[color:var(--border)] text-[color:var(--text-secondary)] hover:bg-[color:var(--surface-2)]',
            ].join(' ')}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <SurfaceCard>
        {activeTab === 'general' && (
          <div className='space-y-4'>
            <h2 className='text-base font-semibold text-[color:var(--text-primary)]'>General</h2>
            <p className='text-sm text-[color:var(--text-secondary)]'>
              Organization profile and branding are available in this section.
            </p>
            {orgSubdomainEnabled ? (
              <SubdomainPanel orgId={id} enabled={orgSubdomainEnabled} />
            ) : (
              <FeatureComingSoon name='Org Subdomain' description='Subdomain controls are currently behind org_subdomain.' />
            )}
          </div>
        )}

        {activeTab === 'api-keys' && (
          orgApiKeysEnabled ? (
            <ApiKeysPanel orgId={id} enabled={orgApiKeysEnabled} />
          ) : (
            <FeatureComingSoon name='Org API Keys' description='API key management is currently behind org_api_keys.' />
          )
        )}

        {activeTab === 'audit-log' && (
          auditLogEnabled ? (
            <AuditLogPanel orgId={id} enabled={auditLogEnabled} />
          ) : (
            <FeatureComingSoon name='Org Audit Log' description='Audit log visibility is currently behind audit_log.' />
          )
        )}

        {activeTab === 'sso' && (
          ssoEnabled ? (
            <SsoConfigPanel orgId={id} enabled={ssoEnabled} />
          ) : (
            <FeatureComingSoon name='Org SSO' description='SSO configuration is currently behind sso.' />
          )
        )}

        {activeTab === 'subdomain' && (
          orgSubdomainEnabled ? (
            <SubdomainPanel orgId={id} enabled={orgSubdomainEnabled} />
          ) : (
            <FeatureComingSoon name='Org Subdomain' description='Subdomain controls are currently behind org_subdomain.' />
          )
        )}

        {!['general', 'api-keys', 'audit-log', 'sso', 'subdomain'].includes(activeTab) && (
          <div className='space-y-2'>
            <h2 className='text-base font-semibold text-[color:var(--text-primary)]'>
              {TABS.find((tab) => tab.key === activeTab)?.label}
            </h2>
            <p className='text-sm text-[color:var(--text-secondary)]'>
              This panel is reserved for the next org-infra tranche and is now reachable through the organizations shell.
            </p>
          </div>
        )}
      </SurfaceCard>
    </div>
  )
}

import SurfaceCard from '../ui/SurfaceCard'
import { useOrgAuditLog } from '../../hooks/useOrgInfra'

export default function AuditLogPanel({ orgId, enabled }: { orgId: string; enabled: boolean }) {
  const auditLogQuery = useOrgAuditLog(orgId, 1, 20, enabled)

  return (
    <SurfaceCard>
      <h3 className='mb-3 text-base font-semibold text-[color:var(--text-primary)]'>Audit Log</h3>
      {auditLogQuery.isLoading ? (
        <p className='text-sm text-[color:var(--text-secondary)]'>Loading audit events...</p>
      ) : !(auditLogQuery.data?.audit_log?.length) ? (
        <p className='text-sm text-[color:var(--text-secondary)]'>No audit events yet.</p>
      ) : (
        <div className='space-y-2'>
          {auditLogQuery.data.audit_log.map((entry) => (
            <div key={entry.id} className='rounded-lg border border-[color:var(--border)] bg-[color:var(--surface-0)] p-3'>
              <p className='text-sm font-medium text-[color:var(--text-primary)]'>{entry.action}</p>
              <p className='mt-1 text-xs text-[color:var(--text-muted)]'>
                Actor: {entry.actor_id || 'system'} • Resource: {entry.resource || 'n/a'} • {new Date(entry.created_at).toLocaleString()}
              </p>
            </div>
          ))}
        </div>
      )}
    </SurfaceCard>
  )
}

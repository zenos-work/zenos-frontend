import { useMemo, useState } from 'react'
import Button from '../ui/Button'
import Spinner from '../ui/Spinner'
import { useCreateAlertRule, useDeleteAlertRule, useOrgQuota, useUsageAlerts } from '../../hooks/useUsage'
import { useUiStore } from '../../stores/uiStore'

type Props = {
  orgId: string
  enabled?: boolean
}

const currentYearMonth = () => {
  const now = new Date()
  const month = `${now.getMonth() + 1}`.padStart(2, '0')
  return `${now.getFullYear()}-${month}`
}

export default function UsagePanel({ orgId, enabled = true }: Props) {
  const toast = useUiStore((s) => s.toast)
  const [ruleName, setRuleName] = useState('')
  const yearMonth = useMemo(() => currentYearMonth(), [])

  const quotaQuery = useOrgQuota(orgId, yearMonth, enabled)
  const alertsQuery = useUsageAlerts(orgId, enabled)
  const createAlert = useCreateAlertRule(orgId)
  const deleteAlert = useDeleteAlertRule(orgId)

  if (!enabled) return null
  if (quotaQuery.isLoading || alertsQuery.isLoading) return <Spinner />

  const quota = quotaQuery.data
  const rules = alertsQuery.data?.rules ?? []

  const addRule = async () => {
    if (!ruleName.trim()) {
      toast('Rule name is required', 'error')
      return
    }
    try {
      await createAlert.mutateAsync({ name: ruleName.trim(), alert_type: 'budget', threshold_value: 80, comparison: 'gte' })
      setRuleName('')
      toast('Usage alert rule created', 'success')
    } catch {
      toast('Failed to create usage alert rule', 'error')
    }
  }

  const removeRule = async (ruleId: string) => {
    try {
      await deleteAlert.mutateAsync(ruleId)
      toast('Usage alert rule removed', 'success')
    } catch {
      toast('Failed to remove alert rule', 'error')
    }
  }

  return (
    <div className='space-y-4'>
      <div>
        <h2 className='text-base font-semibold text-[color:var(--text-primary)]'>Usage & Quota</h2>
        <p className='text-sm text-[color:var(--text-secondary)]'>Current month: {yearMonth}</p>
        <p className='mt-1 text-sm text-[color:var(--text-secondary)]'>Used: {quota?.used_microcents ?? 0} • Remaining: {quota?.remaining_microcents ?? 0}</p>
      </div>

      <div className='space-y-2'>
        <h3 className='text-sm font-semibold text-[color:var(--text-primary)]'>Alert Rules</h3>
        <div className='flex gap-2'>
          <input
            value={ruleName}
            onChange={(e) => setRuleName(e.target.value)}
            className='w-full rounded-lg border border-[color:var(--border)] bg-transparent px-3 py-2 text-sm'
            placeholder='Rule name'
          />
          <Button size='sm' onClick={() => void addRule()} disabled={createAlert.isPending}>{createAlert.isPending ? 'Adding...' : 'Add rule'}</Button>
        </div>

        <ul className='space-y-2'>
          {rules.map((rule) => (
            <li key={rule.id} className='flex items-center justify-between rounded-lg border border-[color:var(--border)] px-3 py-2 text-sm'>
              <span>{rule.name}</span>
              <Button size='sm' variant='ghost' onClick={() => void removeRule(rule.id)} disabled={deleteAlert.isPending}>Delete</Button>
            </li>
          ))}
          {rules.length === 0 && <li className='text-sm text-[color:var(--text-secondary)]'>No alert rules yet.</li>}
        </ul>
      </div>
    </div>
  )
}

import { useState } from 'react'
import Button from '../ui/Button'
import Spinner from '../ui/Spinner'
import { useCreateWorkflowCostRate, useWorkflowCostRates, useWorkflowCostSummaries } from '../../hooks/useWorkflowCosts'
import { useUiStore } from '../../stores/uiStore'

type Props = {
  orgId: string
  enabled?: boolean
}

export default function WorkflowCostPanel({ orgId, enabled = true }: Props) {
  const toast = useUiStore((s) => s.toast)
  const [nodeType, setNodeType] = useState('llm')
  const [rate, setRate] = useState('100')
  const [inputOrgId, setInputOrgId] = useState(orgId)
  const effectiveOrgId = inputOrgId.trim()

  const ratesQuery = useWorkflowCostRates(effectiveOrgId, enabled && !!effectiveOrgId)
  const summariesQuery = useWorkflowCostSummaries(effectiveOrgId, enabled && !!effectiveOrgId)
  const createRate = useCreateWorkflowCostRate(effectiveOrgId)

  if (!enabled) return null
  if (ratesQuery.isLoading || summariesQuery.isLoading) return <Spinner />

  const rates = ratesQuery.data?.rates ?? []
  const summaries = summariesQuery.data?.summaries ?? []

  const addRate = async () => {
    const parsedRate = Number(rate)
    if (!nodeType.trim() || Number.isNaN(parsedRate)) {
      toast('Node type and rate are required', 'error')
      return
    }
    try {
      await createRate.mutateAsync({ node_type_id: nodeType.trim(), cost_model: 'per_execution', rate_microcents: parsedRate })
      toast('Workflow cost rate created', 'success')
    } catch {
      toast('Failed to create workflow cost rate', 'error')
    }
  }

  return (
    <div className='space-y-4'>
      <div>
        <h2 className='text-base font-semibold text-[color:var(--text-primary)]'>Workflow Costs</h2>
        <p className='text-sm text-[color:var(--text-secondary)]'>Track and tune rate cards for workflow execution.</p>
      </div>

      <div className='flex flex-col gap-2 sm:flex-row'>
        <input value={inputOrgId} onChange={(e) => setInputOrgId(e.target.value)} className='w-full rounded-lg border border-[color:var(--border)] bg-transparent px-3 py-2 text-sm' placeholder='Organization ID' />
        <input value={nodeType} onChange={(e) => setNodeType(e.target.value)} className='w-full rounded-lg border border-[color:var(--border)] bg-transparent px-3 py-2 text-sm' placeholder='Node type' />
        <input value={rate} onChange={(e) => setRate(e.target.value)} className='w-full rounded-lg border border-[color:var(--border)] bg-transparent px-3 py-2 text-sm' placeholder='Rate (microcents)' />
        <Button size='sm' onClick={() => void addRate()} disabled={createRate.isPending || !effectiveOrgId}>{createRate.isPending ? 'Saving...' : 'Save rate'}</Button>
      </div>

      <div className='space-y-2'>
        <h3 className='text-sm font-semibold text-[color:var(--text-primary)]'>Rate Cards</h3>
        <ul className='space-y-1 text-sm text-[color:var(--text-secondary)]'>
          {rates.map((item) => <li key={item.id}>{item.node_type_id}: {item.rate_microcents ?? 0} microcents</li>)}
          {rates.length === 0 && <li>No rates yet.</li>}
        </ul>
      </div>

      <div className='space-y-2'>
        <h3 className='text-sm font-semibold text-[color:var(--text-primary)]'>Cost Summaries</h3>
        <ul className='space-y-1 text-sm text-[color:var(--text-secondary)]'>
          {summaries.map((item) => <li key={item.workflow_id}>{item.workflow_id}: {item.total_cost_microcents} microcents</li>)}
          {summaries.length === 0 && <li>No summaries yet.</li>}
        </ul>
      </div>
    </div>
  )
}

import { useMemo, useState } from 'react'
import FeatureComingSoon from '../components/ui/FeatureComingSoon'
import Spinner from '../components/ui/Spinner'
import { useFeatureFlag } from '../hooks/useFeatureFlags'
import { useEarningsBreakdown, useMyEarnings, useMyPayouts, useReceivedTips, useRequestPayout } from '../hooks/useEarnings'
import { useUiStore } from '../stores/uiStore'

export default function EarningsPage() {
  const toast = useUiStore((s) => s.toast)
  const { enabled, isLoading: flagLoading } = useFeatureFlag('earnings_dashboard')
  const [periodStart, setPeriodStart] = useState('')
  const earnings = useMyEarnings(enabled)
  const payouts = useMyPayouts(enabled)
  const breakdown = useEarningsBreakdown(periodStart, enabled && !!periodStart)
  const tips = useReceivedTips(enabled)
  const requestPayout = useRequestPayout()

  const totalEarned = useMemo(() => {
    const data = earnings.data as { totals?: { earned_cents?: number } } | undefined
    const cents = Number(data?.totals?.earned_cents ?? 0)
    return `$${(cents / 100).toFixed(2)}`
  }, [earnings.data])

  if (flagLoading) return <div className='flex justify-center py-12'><Spinner /></div>
  if (!enabled) {
    return <FeatureComingSoon name='Earnings dashboard' description='Track creator revenue, payouts, and monetization performance.' />
  }

  const payoutItems = ((payouts.data as { items?: Array<{ id: string; amount_cents?: number; status?: string }> } | undefined)?.items ?? [])

  return (
    <div className='space-y-6'>
      <div>
        <h1 className='text-2xl font-bold text-[color:var(--text-primary)]'>Earnings</h1>
        <p className='mt-1 text-sm text-[color:var(--text-secondary)]'>Monitor your revenue, tips, and payout requests.</p>
      </div>

      <div className='grid gap-4 md:grid-cols-3'>
        <div className='rounded-xl border border-[color:var(--border)] bg-[color:var(--surface-1)] p-4'>
          <p className='text-xs uppercase tracking-[0.14em] text-[color:var(--text-muted)]'>Total earned</p>
          <p className='mt-2 text-2xl font-semibold text-[color:var(--text-primary)]'>{totalEarned}</p>
        </div>
        <div className='rounded-xl border border-[color:var(--border)] bg-[color:var(--surface-1)] p-4'>
          <p className='text-xs uppercase tracking-[0.14em] text-[color:var(--text-muted)]'>Payouts</p>
          <p className='mt-2 text-2xl font-semibold text-[color:var(--text-primary)]'>{payoutItems.length}</p>
        </div>
        <div className='rounded-xl border border-[color:var(--border)] bg-[color:var(--surface-1)] p-4'>
          <p className='text-xs uppercase tracking-[0.14em] text-[color:var(--text-muted)]'>Received tips</p>
          <p className='mt-2 text-2xl font-semibold text-[color:var(--text-primary)]'>
            {(((tips.data as { items?: unknown[] } | undefined)?.items) ?? []).length}
          </p>
        </div>
      </div>

      <section className='rounded-xl border border-[color:var(--border)] bg-[color:var(--surface-1)] p-4'>
        <div className='flex flex-wrap items-center gap-2'>
          <input
            type='month'
            value={periodStart}
            onChange={(event) => setPeriodStart(event.target.value ? `${event.target.value}-01` : '')}
            className='h-10 rounded-lg border border-[color:var(--border-strong)] bg-[color:var(--surface-0)] px-3 text-sm text-[color:var(--text-primary)]'
          />
          <button
            type='button'
            onClick={() => void requestPayout.mutateAsync({ amount_cents: 5000 }).then(() => toast('Payout request submitted', 'success')).catch(() => toast('Could not request payout', 'error'))}
            className='rounded-full bg-[color:var(--accent)] px-4 py-2 text-sm font-semibold text-white'
          >
            Request payout
          </button>
        </div>
        {periodStart && (
          <p className='mt-3 text-xs text-[color:var(--text-muted)]'>
            Breakdown status: {String((breakdown.data as { status?: string } | undefined)?.status ?? (breakdown.isLoading ? 'loading' : 'ready'))}
          </p>
        )}
      </section>
    </div>
  )
}

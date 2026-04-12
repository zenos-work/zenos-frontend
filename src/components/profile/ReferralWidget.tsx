import Button from '../ui/Button'
import SurfaceCard from '../ui/SurfaceCard'
import Spinner from '../ui/Spinner'
import { useGenerateCode, useReferralCode, useReferralStats } from '../../hooks/useReferrals'
import { useUiStore } from '../../stores/uiStore'

type Props = {
  enabled?: boolean
}

export default function ReferralWidget({ enabled = true }: Props) {
  const toast = useUiStore((s) => s.toast)
  const { data: codeData, isLoading: codeLoading } = useReferralCode(enabled)
  const { data: statsData, isLoading: statsLoading } = useReferralStats(enabled)
  const generate = useGenerateCode()

  const code = codeData?.code || statsData?.code || ''

  const generateCode = async () => {
    try {
      await generate.mutateAsync()
      toast('Referral code generated', 'success')
    } catch {
      toast('Could not generate referral code', 'error')
    }
  }

  if (!enabled) return null
  if (codeLoading || statsLoading) return <Spinner />

  const clicks = statsData?.total_clicks ?? 0
  const signups = statsData?.total_signups ?? statsData?.total_conversions ?? 0

  return (
    <SurfaceCard className='space-y-3'>
      <h3 className='text-base font-semibold text-[color:var(--text-primary)]'>Referrals</h3>
      {code ? (
        <>
          <p className='text-sm text-[color:var(--text-secondary)]'>Referral code: <span className='font-semibold text-[color:var(--text-primary)]'>{code}</span></p>
          <p className='text-xs text-[color:var(--text-secondary)]'>Clicks: {clicks} • Signups: {signups}</p>
        </>
      ) : (
        <p className='text-sm text-[color:var(--text-secondary)]'>No referral code yet.</p>
      )}
      <Button size='sm' onClick={() => void generateCode()} disabled={generate.isPending}>{generate.isPending ? 'Generating...' : 'Generate referral code'}</Button>
    </SurfaceCard>
  )
}

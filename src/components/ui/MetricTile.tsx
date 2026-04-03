import type { ReactNode } from 'react'

type MetricTone = 'default' | 'positive' | 'warning' | 'accent'

function valueToneClass(tone: MetricTone): string {
  if (tone === 'positive') return 'text-[color:#2f6b46] dark:text-[#9bd3aa]'
  if (tone === 'warning') return 'text-[color:#8a5b18] dark:text-[#e7bd7a]'
  if (tone === 'accent') return 'text-[color:var(--accent)]'
  return 'text-[color:var(--text-primary)]'
}

export default function MetricTile({
  label,
  value,
  detail,
  icon,
  tone = 'default',
  className = '',
  valueClassName = '',
  detailClassName = '',
}: {
  label: string
  value: ReactNode
  detail?: string
  icon?: ReactNode
  tone?: MetricTone
  className?: string
  valueClassName?: string
  detailClassName?: string
}) {
  return (
    <div className={[
      'rounded-xl border border-[color:var(--border)] bg-[color:var(--surface-1)] p-4 shadow-sm',
      className,
    ].join(' ')}>
      <div className='flex items-center justify-between gap-2'>
        <p className='text-xs uppercase tracking-[0.12em] text-[color:var(--text-secondary)]'>{label}</p>
        {icon}
      </div>
      <p className={['mt-2 text-2xl font-bold', valueToneClass(tone), valueClassName].join(' ')}>{value}</p>
      {detail && <p className={['mt-1 text-xs text-[color:var(--text-muted)]', detailClassName].join(' ')}>{detail}</p>}
    </div>
  )
}

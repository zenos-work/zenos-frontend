import type { ReactNode } from 'react'

type HeaderSize = 'sm' | 'md'

export default function SectionHeader({
  title,
  description,
  icon,
  action,
  size = 'sm',
  className = '',
}: {
  title: string
  description?: string
  icon?: ReactNode
  action?: ReactNode
  size?: HeaderSize
  className?: string
}) {
  const titleClass = size === 'md'
    ? 'text-base font-semibold text-[color:var(--text-primary)]'
    : 'text-sm font-semibold text-[color:var(--text-primary)]'

  return (
    <div className={['flex items-start justify-between gap-3', className].join(' ')}>
      <div>
        <div className='flex items-center gap-2'>
          {icon}
          <h2 className={titleClass}>{title}</h2>
        </div>
        {description && (
          <p className='mt-1 text-xs text-[color:var(--text-secondary)]'>{description}</p>
        )}
      </div>
      {action}
    </div>
  )
}

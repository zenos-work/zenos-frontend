import type { ReactNode } from 'react'

type SurfaceCardTone = 'default' | 'subtle'
type SurfaceCardPadding = 'sm' | 'md' | 'lg'

function paddingClass(padding: SurfaceCardPadding): string {
  if (padding === 'sm') return 'p-3'
  if (padding === 'lg') return 'p-6'
  return 'p-4'
}

function toneClass(tone: SurfaceCardTone): string {
  if (tone === 'subtle') return 'bg-[color:var(--surface-0)]'
  return 'bg-[color:var(--surface-1)]'
}

export default function SurfaceCard({
  children,
  className = '',
  tone = 'default',
  padding = 'md',
}: {
  children: ReactNode
  className?: string
  tone?: SurfaceCardTone
  padding?: SurfaceCardPadding
}) {
  return (
    <section
      className={[
        'rounded-2xl border border-[color:var(--border)] shadow-sm',
        toneClass(tone),
        paddingClass(padding),
        className,
      ].join(' ')}
    >
      {children}
    </section>
  )
}

import { Link } from 'react-router-dom'

interface SeriesBannerProps {
  seriesId: string
  seriesName: string
  part: number
  total: number
  description?: string
  coverImageUrl?: string
}

export default function SeriesBanner({
  seriesId,
  seriesName,
  part,
  total,
}: SeriesBannerProps) {
  return (
    <div className='flex items-center gap-3 rounded-lg border border-[color:var(--accent)]/20 bg-[color:var(--accent)]/5 px-4 py-3'>
      <div className='flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-[color:var(--accent)] text-xs font-bold text-[color:var(--surface-0)]'>
        {part}/{total}
      </div>
      <div className='flex-1'>
        <p className='text-xs font-semibold uppercase tracking-wider text-[color:var(--accent)]'>Series</p>
        <Link
          to={`/series/${seriesId}`}
          className='text-sm font-medium text-[color:var(--text-primary)] hover:text-[color:var(--accent)] transition-colors'
        >
          {seriesName}
        </Link>
      </div>
      <div className='flex gap-1'>
        {Array.from({ length: total }).map((_, i) => (
          <div
            key={i}
            className={`h-1.5 w-6 rounded-full ${
              i + 1 <= part ? 'bg-[color:var(--accent)]' : 'bg-[color:var(--accent)]/20'
            }`}
          />
        ))}
      </div>
    </div>
  )
}

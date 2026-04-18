import { Link } from 'react-router-dom'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import type { ArticleSeriesPart } from '../../hooks/useSeries'

interface SeriesBannerProps {
  seriesId: string
  seriesName: string
  part: number
  total: number
  description?: string
  coverImageUrl?: string
  nextSlug?: string
  prevSlug?: string
  parts?: ArticleSeriesPart[]
}

export default function SeriesBanner({
  seriesId,
  seriesName,
  part,
  total,
  nextSlug,
  prevSlug,
  parts = [],
}: SeriesBannerProps) {
  return (
    <div className='flex flex-col gap-3 rounded-xl border border-[color:var(--accent)]/20 bg-[color:var(--accent)]/5 px-4 py-3 sm:flex-row sm:items-center'>
      <div className='flex items-center gap-3 flex-1'>
        <div className='flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-[color:var(--accent)] text-xs font-bold text-[color:var(--surface-0)]'>
          {part}/{total}
        </div>
        <div className='flex-1'>
          <p className='text-[10px] font-semibold uppercase tracking-wider text-[color:var(--accent)]'>Series</p>
          <Link
            to={`/series/${seriesId}`}
            className='text-sm font-medium text-[color:var(--text-primary)] hover:text-[color:var(--accent)] transition-colors line-clamp-1'
          >
            {seriesName}
          </Link>
        </div>
      </div>

      <div className='flex items-center justify-between gap-4 sm:justify-end'>
        <div className='flex gap-1'>
          {Array.from({ length: Math.max(total, parts.length) }).map((_, i) => {
            const partNum = i + 1
            const matchingPart = parts.find(p => p.part === partNum)
            const isCurrent = partNum === part

            if (matchingPart) {
              if (isCurrent) {
                return (
                  <div
                    key={i}
                    className="h-1.5 w-6 rounded-full bg-[color:var(--accent)] ring-1 ring-[color:var(--accent)] ring-offset-2 ring-offset-[color:var(--surface-1)]"
                    title={`You are here: Part ${partNum}`}
                  />
                )
              }
              return (
                <Link
                  key={i}
                  to={`/article/${matchingPart.slug}`}
                  className={`h-1.5 w-6 rounded-full transition-all hover:bg-[color:var(--accent)]/60 ${
                    partNum < part ? 'bg-[color:var(--accent)]' : 'bg-[color:var(--accent)]/20'
                  }`}
                  title={`Go to Part ${partNum}: ${matchingPart.slug}`}
                />
              )
            }

            return (
              <div
                key={i}
                className="h-1.5 w-6 rounded-full bg-[color:var(--accent)]/10"
                title={`Part ${partNum} (Not available)`}
              />
            )
          })}
        </div>

        <div className='flex items-center gap-2'>
          {prevSlug ? (
            <Link
              to={`/article/${prevSlug}`}
              className='flex h-8 w-8 items-center justify-center rounded-full bg-[color:var(--surface-0)] text-[color:var(--text-secondary)] shadow-sm hover:text-[color:var(--accent)] transition-colors'
              title='Previous Part'
            >
              <ChevronLeft size={16} />
            </Link>
          ) : (
             <div className='h-8 w-8' />
          )}
          {nextSlug ? (
            <Link
              to={`/article/${nextSlug}`}
              className='flex h-8 w-8 items-center justify-center rounded-full bg-[color:var(--surface-0)] text-[color:var(--text-secondary)] shadow-sm hover:text-[color:var(--accent)] transition-colors'
              title='Next Part'
            >
              <ChevronRight size={16} />
            </Link>
          ) : (
             <div className='h-8 w-8' />
          )}
        </div>
      </div>
    </div>
  )
}

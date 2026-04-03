import { useMemo, useEffect, useState } from 'react'
import { Clock, Eye } from 'lucide-react'

interface TocHeading {
  id: string
  text: string
  level: number
}

interface EnhancedTableOfContentsProps {
  toc: TocHeading[]
  content?: string
  isVisible: boolean
}

/**
 * Calculate estimated reading time based on word count
 * Assumes ~200 words per minute average reading speed
 */
function estimateReadingTime(content: string): number {
  const textOnly = content.replace(/<[^>]*>/g, '').trim()
  const wordCount = textOnly.split(/\s+/).length
  const minutes = Math.ceil(wordCount / 200)
  return Math.max(1, minutes)
}

export function EnhancedTableOfContents({
  toc,
  content = '',
  isVisible,
}: EnhancedTableOfContentsProps) {
  const [readingProgress, setReadingProgress] = useState(0)

  const estimatedTime = useMemo(() => {
    return estimateReadingTime(content)
  }, [content])

  useEffect(() => {
    const handleScroll = () => {
      const windowHeight = window.innerHeight
      const documentHeight = document.documentElement.scrollHeight - windowHeight
      const scrolled = window.scrollY

      if (documentHeight > 0) {
        const percentage = (scrolled / documentHeight) * 100
        setReadingProgress(Math.min(percentage, 100))
      }
    }

    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  if (!isVisible) return null

  return (
    <aside className='max-h-[calc(100vh-8rem)] overflow-y-auto rounded-2xl border border-[color:var(--border)] bg-[color:var(--surface-0)]/95 p-4 shadow-sm backdrop-blur-sm'>
      {/* Header */}
      <div className='mb-4 space-y-3 border-b border-[color:var(--border)] pb-4'>
        <h3 className='text-[11px] font-semibold uppercase tracking-[0.18em] text-[color:var(--text-primary)]'>
          On this page
        </h3>

        {/* Reading metrics */}
        <div className='space-y-2'>
          {/* Estimated reading time */}
          <div className='flex items-center gap-2 text-xs text-[color:var(--text-secondary)]'>
            <Clock size={14} className='text-[color:var(--accent)]' />
            <span>{estimatedTime} min read</span>
          </div>

          {/* Progress indicator */}
          <div className='space-y-1.5'>
            <div className='flex items-center justify-between text-xs'>
              <span className='flex items-center gap-1 text-[color:var(--text-secondary)]'>
                <Eye size={13} className='text-[color:var(--accent)]' />
                Progress
              </span>
              <span className='font-medium text-[color:var(--text-primary)]'>
                {Math.round(readingProgress)}%
              </span>
            </div>
            <div className='h-1.5 rounded-full bg-[color:var(--surface-0)] overflow-hidden'>
              <div
                className='h-full bg-gradient-to-r from-[color:var(--accent)] to-[color:var(--accent-strong)] transition-all duration-300'
                style={{ width: `${readingProgress}%` }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Table of Contents */}
      <nav className='space-y-1.5'>
        {toc.map((item) => (
          <a
            key={item.id}
            href={`#${item.id}`}
            className='block rounded-md px-2 py-1.5 text-sm text-[color:var(--text-secondary)] transition-colors duration-200 hover:bg-[color:var(--surface-2)] hover:text-[color:var(--accent)] line-clamp-2 break-words'
            style={{
              paddingLeft: `${Math.max(0, item.level - 1) * 12}px`,
              marginLeft: Math.max(0, item.level - 1) * 2,
            }}
            title={item.text}
          >
            {item.text}
          </a>
        ))}
      </nav>
    </aside>
  )
}

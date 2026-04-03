import { useMemo } from 'react'
import { Link } from 'react-router-dom'
import { BookOpen, Clock3, Eye, RotateCcw, Sparkles, Trash2, TrendingUp } from 'lucide-react'
import { useBookmarks } from '../hooks/useSocial'
import {
  useClearReadingHistory,
  useReadingHistory,
  useRemoveReadingHistoryItem,
} from '../hooks/useReadingHistory'
import { resolveAssetUrl } from '../lib/assets'
import type { ReadingHistoryItem } from '../lib/readingHistory'

function formatWhen(value: string): string {
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return 'Recently'
  return date.toLocaleString(undefined, {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  })
}

function HistoryRow({
  item,
  onDelete,
}: {
  item: ReadingHistoryItem
  onDelete: (id: string) => void
}) {
  const cover = resolveAssetUrl(item.cover_image_url)

  return (
    <article className='group flex gap-4 rounded-2xl border border-[color:var(--border)] bg-[color:var(--surface-1)] p-4'>
      <Link to={`/article/${item.slug}`} className='h-20 w-28 flex-shrink-0 overflow-hidden rounded-lg bg-[color:var(--surface-2)]'>
        {cover ? (
          <img src={cover} alt={item.title} className='h-full w-full object-cover transition-transform duration-300 group-hover:scale-105' />
        ) : (
          <div className='grid h-full place-items-center text-xs text-[color:var(--text-muted)]'>No cover</div>
        )}
      </Link>

      <div className='min-w-0 flex-1'>
        <div className='flex items-start justify-between gap-3'>
          <div className='min-w-0'>
            <Link to={`/article/${item.slug}`} className='line-clamp-2 text-base font-semibold text-[color:var(--text-primary)] hover:text-[color:var(--accent)]'>
              {item.title}
            </Link>
            <p className='mt-1 line-clamp-1 text-sm text-[color:var(--text-secondary)]'>
              {item.author_name || 'Zenos writer'} • {item.read_time_minutes} min read
            </p>
          </div>

          <button
            type='button'
            onClick={() => onDelete(item.id)}
            aria-label='Remove from history'
            className='rounded-full p-1.5 text-[color:var(--text-muted)] transition hover:bg-[color:var(--surface-2)] hover:text-[#ef4444]'
          >
            <Trash2 size={14} />
          </button>
        </div>

        <div className='mt-3 flex items-center gap-3'>
          <div className='h-1.5 flex-1 overflow-hidden rounded-full bg-[color:var(--surface-3)]'>
            <div
              className='h-full rounded-full bg-[color:var(--accent)]'
              style={{ width: `${Math.max(2, item.progress)}%` }}
            />
          </div>
          <span className='text-xs text-[color:var(--text-muted)]'>{item.progress}%</span>
        </div>

        <p className='mt-1.5 text-xs text-[color:var(--text-muted)]'>Last read {formatWhen(item.last_read_at)}</p>
      </div>
    </article>
  )
}

export default function ReadingHistoryPage() {
  const { data: serverHistory } = useReadingHistory(1, 100, true)
  const removeServerItem = useRemoveReadingHistoryItem()
  const clearServerHistory = useClearReadingHistory()
  const { data: bookmarks } = useBookmarks(1, 8)

  const history = useMemo(() => serverHistory?.items ?? [], [serverHistory?.items])

  const inProgress = useMemo(() => history.filter((item) => item.progress < 100), [history])
  const completed = useMemo(() => history.filter((item) => item.progress >= 100), [history])

  const recommendations = useMemo(() => {
    const existingIds = new Set(history.map((item) => item.id))
    return (bookmarks?.items ?? [])
      .filter((item) => !existingIds.has(item.id))
      .slice(0, 4)
  }, [bookmarks?.items, history])

  const totalMinutes = useMemo(
    () => history.reduce((sum, item) => sum + Math.round((item.read_time_minutes * item.progress) / 100), 0),
    [history],
  )

  const removeItem = (id: string) => {
    removeServerItem.mutate(id)
  }

  const clearAll = () => {
    clearServerHistory.mutate()
  }

  return (
    <div className='space-y-6'>
      <header className='flex flex-wrap items-center justify-between gap-3'>
        <div>
          <h1 className='text-2xl font-bold text-[color:var(--text-primary)]'>Reading History</h1>
          <p className='mt-1 text-sm text-[color:var(--text-secondary)]'>Track your recent reads and jump back in quickly.</p>
        </div>

        {history.length > 0 && (
          <button
            type='button'
            onClick={clearAll}
            className='rounded-full border border-[color:var(--border-strong)] px-4 py-2 text-xs font-semibold uppercase tracking-wide text-[color:var(--text-secondary)] hover:bg-[color:var(--surface-2)]'
          >
            Clear history
          </button>
        )}
      </header>

      <section className='grid grid-cols-2 gap-3 md:grid-cols-4'>
        {[
          { icon: BookOpen, label: 'Articles read', value: completed.length.toString() },
          { icon: RotateCcw, label: 'In progress', value: inProgress.length.toString() },
          { icon: Clock3, label: 'Minutes read', value: totalMinutes.toString() },
          { icon: Eye, label: 'Completion', value: history.length ? `${Math.round((completed.length / history.length) * 100)}%` : '0%' },
        ].map((stat) => (
          <div key={stat.label} className='rounded-2xl border border-[color:var(--border)] bg-[color:var(--surface-1)] p-4'>
            <stat.icon size={16} className='text-[color:var(--text-muted)]' />
            <p className='mt-2 text-xl font-bold text-[color:var(--text-primary)]'>{stat.value}</p>
            <p className='text-xs text-[color:var(--text-secondary)]'>{stat.label}</p>
          </div>
        ))}
      </section>

      <section className='space-y-3'>
        <div className='flex items-center gap-2 text-sm font-semibold text-[color:var(--text-primary)]'>
          <Clock3 size={14} /> Continue Reading
        </div>
        {inProgress.length === 0 ? (
          <div className='rounded-2xl border border-[color:var(--border)] bg-[color:var(--surface-1)] px-6 py-10 text-center text-sm text-[color:var(--text-secondary)]'>
            No in-progress stories yet.
          </div>
        ) : (
          <div className='space-y-3'>
            {inProgress.map((item) => <HistoryRow key={item.id} item={item} onDelete={removeItem} />)}
          </div>
        )}
      </section>

      <section className='space-y-3'>
        <div className='flex items-center gap-2 text-sm font-semibold text-[color:var(--text-primary)]'>
          <TrendingUp size={14} /> Recent History
        </div>
        {history.length === 0 ? (
          <div className='rounded-2xl border border-[color:var(--border)] bg-[color:var(--surface-1)] px-6 py-10 text-center'>
            <BookOpen className='mx-auto text-[color:var(--text-muted)]' size={24} />
            <p className='mt-3 text-sm text-[color:var(--text-secondary)]'>Read an article and it will show up here automatically.</p>
          </div>
        ) : (
          <div className='space-y-3'>
            {history.map((item) => <HistoryRow key={item.id} item={item} onDelete={removeItem} />)}
          </div>
        )}
      </section>

      <section className='space-y-3'>
        <div className='flex items-center gap-2 text-sm font-semibold text-[color:var(--text-primary)]'>
          <Sparkles size={14} /> Recommended from your bookmarks
        </div>

        {recommendations.length === 0 ? (
          <div className='rounded-2xl border border-[color:var(--border)] bg-[color:var(--surface-1)] px-6 py-6 text-sm text-[color:var(--text-secondary)]'>
            Save a few stories to get personalized recommendations.
          </div>
        ) : (
          <div className='grid gap-4 sm:grid-cols-2'>
            {recommendations.map((item) => (
              <Link
                key={item.id}
                to={`/article/${item.slug}`}
                className='rounded-2xl border border-[color:var(--border)] bg-[color:var(--surface-1)] p-4 transition hover:border-[color:var(--border-strong)]'
              >
                <p className='line-clamp-2 text-base font-semibold text-[color:var(--text-primary)]'>{item.title}</p>
                <p className='mt-1 text-sm text-[color:var(--text-secondary)]'>{item.author_name || 'Zenos writer'} • {item.read_time_minutes} min read</p>
              </Link>
            ))}
          </div>
        )}
      </section>
    </div>
  )
}

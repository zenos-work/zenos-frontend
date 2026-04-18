import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { useMyArticles, useDeleteArticle, useDuplicateArticle } from '../hooks/useArticles'
import { useFeatureFlag } from '../hooks/useFeatureFlags'
import { useUiStore } from '../stores/uiStore'
import ArticleCard from '../components/article/ArticleCard'
import Spinner     from '../components/ui/Spinner'
import Button      from '../components/ui/Button'
import { PenSquare, Trash2, BookOpen, Search, SlidersHorizontal, Copy } from 'lucide-react'
import type { ArticleStatus } from '../types'

const STATUS_TABS: { id: ArticleStatus | 'ALL'; label: string }[] = [
  { id: 'ALL',       label: 'All'       },
  { id: 'DRAFT',     label: 'Drafts'    },
  { id: 'SUBMITTED', label: 'In Review' },
  { id: 'APPROVED',  label: 'Approved'  },
  { id: 'PUBLISHED', label: 'Published' },
  { id: 'REJECTED',  label: 'Rejected'  },
  { id: 'ARCHIVED',  label: 'Archived'  },
]

type SortMode = 'updated' | 'created' | 'title' | 'status' | 'views'

export default function LibraryPage() {
  const [filter, setFilter] = useState<ArticleStatus | 'ALL'>('ALL')
  const [q, setQ] = useState('')
  const [sort, setSort] = useState<SortMode>('updated')
  const { enabled: duplicateEnabled } = useFeatureFlag('article_duplicate')
  const { data, isLoading } = useMyArticles()
  const deleteMutation = useDeleteArticle()
  const duplicateMutation = useDuplicateArticle()
  const toast = useUiStore(s => s.toast)

  const articles = useMemo(() => data?.items ?? [], [data?.items])
  const filtered = useMemo(() => {
    const byStatus = filter === 'ALL'
      ? articles
      : articles.filter(a => a.status === filter)

    const query = q.trim().toLowerCase()
    const bySearch = !query
      ? byStatus
      : byStatus.filter((a) => `${a.title} ${a.subtitle ?? ''}`.toLowerCase().includes(query))

    const ts = (iso?: string) => (iso ? new Date(iso).getTime() : 0)
    return [...bySearch].sort((a, b) => {
      if (sort === 'title') return a.title.localeCompare(b.title)
      if (sort === 'status') return a.status.localeCompare(b.status)
      if (sort === 'views') return b.views_count - a.views_count
      if (sort === 'created') return ts(b.created_at) - ts(a.created_at)
      return ts(b.updated_at ?? b.created_at) - ts(a.updated_at ?? a.created_at)
    })
  }, [articles, filter, q, sort])

  const statusCount = (status: ArticleStatus) => articles.filter((a) => a.status === status).length

  const handleDelete = async (id: string, title: string) => {
    if (!confirm(`Delete "${title}"?`)) return
    try {
      await deleteMutation.mutateAsync(id)
      toast('Article deleted', 'success')
    } catch {
      toast('Delete failed', 'error')
    }
  }

  const handleDuplicate = async (id: string) => {
    try {
      await duplicateMutation.mutateAsync(id)
      toast('Article duplicated', 'success')
    } catch {
      toast('Duplicate failed', 'error')
    }
  }

  return (
    <div className='space-y-6'>
      <div className='flex items-center justify-between'>
        <div className='flex items-center gap-3'>
          <BookOpen size={20} className='text-blue-400' />
          <h1 className='text-xl font-bold text-white'>My Library</h1>
        </div>
        <Link to='/write'>
          <Button size='sm'><PenSquare size={14} /> New article</Button>
        </Link>
      </div>

      <div className='grid grid-cols-2 md:grid-cols-4 gap-3'>
        <div className='rounded-xl border border-gray-800 bg-gray-900 p-3'>
          <p className='text-xs text-gray-500'>Total</p>
          <p className='text-xl font-bold text-white'>{articles.length}</p>
        </div>
        <div className='rounded-xl border border-gray-800 bg-gray-900 p-3'>
          <p className='text-xs text-gray-500'>In review</p>
          <p className='text-xl font-bold text-amber-300'>{statusCount('SUBMITTED')}</p>
        </div>
        <div className='rounded-xl border border-gray-800 bg-gray-900 p-3'>
          <p className='text-xs text-gray-500'>Published</p>
          <p className='text-xl font-bold text-emerald-300'>{statusCount('PUBLISHED')}</p>
        </div>
        <div className='rounded-xl border border-gray-800 bg-gray-900 p-3'>
          <p className='text-xs text-gray-500'>Rejected</p>
          <p className='text-xl font-bold text-rose-300'>{statusCount('REJECTED')}</p>
        </div>
      </div>

      <div className='grid grid-cols-1 md:grid-cols-3 gap-3'>
        <label className='md:col-span-2 flex items-center gap-2 rounded-xl border border-gray-800 bg-gray-900 px-3 py-2'>
          <Search size={15} className='text-gray-500' />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder='Search by title or subtitle'
            className='w-full bg-transparent text-sm text-gray-200 placeholder:text-gray-600 focus:outline-none'
          />
        </label>

        <label className='flex items-center gap-2 rounded-xl border border-gray-800 bg-gray-900 px-3 py-2'>
          <SlidersHorizontal size={15} className='text-gray-500' />
          <select
            value={sort}
            onChange={(e) => setSort(e.target.value as SortMode)}
            className='w-full bg-transparent text-sm text-gray-200 focus:outline-none'
          >
            <option value='updated'>Recently updated</option>
            <option value='created'>Recently created</option>
            <option value='views'>Most viewed</option>
            <option value='title'>Title A-Z</option>
            <option value='status'>Status</option>
          </select>
        </label>
      </div>

      {/* Filter tabs */}
      <div className='flex gap-1 border-b border-gray-800'>
        {STATUS_TABS.map(t => (
          <button
            key={t.id}
            onClick={() => setFilter(t.id)}
            className={[
              'px-4 py-2.5 text-sm font-medium transition-colors border-b-2 -mb-px',
              filter === t.id
                ? 'text-white border-blue-500'
                : 'text-gray-400 border-transparent hover:text-white',
            ].join(' ')}
          >
            {t.label}
            <span className='ml-1.5 text-xs text-gray-600'>
              {filter === t.id || t.id === 'ALL'
                ? (t.id === 'ALL' ? articles.length : filtered.length)
                : articles.filter(a => a.status === t.id).length
              }
            </span>
          </button>
        ))}
      </div>

      {isLoading ? (
        <div className='flex justify-center py-12'><Spinner /></div>
      ) : !filtered.length ? (
        <div className='text-center py-16 text-gray-500'>
          <p>No articles in this view.</p>
          <button
            onClick={() => {
              setQ('')
              setFilter('ALL')
              setSort('updated')
            }}
            className='mt-3 text-sm text-blue-400 hover:text-blue-300 transition-colors'
          >
            Reset filters
          </button>
        </div>
      ) : (
        <div className='space-y-3'>
          {filtered.map(a => (
            <div key={a.id} className='group relative'>
              <ArticleCard article={a} showStatus compact />
              <div className='absolute top-3 right-3 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity'>
                {a.status !== 'PUBLISHED' && (
                  <Link to={`/write/${a.id}`}>
                    <Button size='sm' variant='secondary'>
                      <PenSquare size={13} />
                    </Button>
                  </Link>
                )}
                {duplicateEnabled && (
                  <Button
                    size='sm' variant='secondary'
                    onClick={() => void handleDuplicate(a.id)}
                  >
                    <Copy size={13} />
                  </Button>
                )}
                <Button
                  size='sm' variant='danger'
                  onClick={() => handleDelete(a.id, a.title)}
                >
                  <Trash2 size={13} />
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

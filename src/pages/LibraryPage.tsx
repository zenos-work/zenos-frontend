import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useMyArticles, useDeleteArticle } from '../hooks/useArticles'
import { useUiStore } from '../stores/uiStore'
import ArticleCard from '../components/article/ArticleCard'
import Spinner     from '../components/ui/Spinner'
import Button      from '../components/ui/Button'
import { PenSquare, Trash2, BookOpen } from 'lucide-react'
import type { ArticleStatus } from '../types'

const STATUS_TABS: { id: ArticleStatus | 'ALL'; label: string }[] = [
  { id: 'ALL',       label: 'All'       },
  { id: 'DRAFT',     label: 'Drafts'    },
  { id: 'SUBMITTED', label: 'In Review' },
  { id: 'PUBLISHED', label: 'Published' },
  { id: 'REJECTED',  label: 'Rejected'  },
]

export default function LibraryPage() {
  const [filter, setFilter] = useState<ArticleStatus | 'ALL'>('ALL')
  const { data, isLoading } = useMyArticles()
  const deleteMutation = useDeleteArticle()
  const toast = useUiStore(s => s.toast)

  const articles = data?.items ?? []
  const filtered = filter === 'ALL'
    ? articles
    : articles.filter(a => a.status === filter)

  const handleDelete = async (id: string, title: string) => {
    if (!confirm(`Delete "${title}"?`)) return
    try {
      await deleteMutation.mutateAsync(id)
      toast('Article deleted', 'success')
    } catch {
      toast('Delete failed', 'error')
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
        <div className='text-center py-16 text-gray-500'>No articles in this category.</div>
      ) : (
        <div className='space-y-3'>
          {filtered.map(a => (
            <div key={a.id} className='group relative'>
              <ArticleCard article={a} showStatus />
              <div className='absolute top-3 right-3 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity'>
                {a.status !== 'PUBLISHED' && (
                  <Link to={`/write/${a.id}`}>
                    <Button size='sm' variant='secondary'>
                      <PenSquare size={13} />
                    </Button>
                  </Link>
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

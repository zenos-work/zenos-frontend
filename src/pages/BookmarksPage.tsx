import { useMemo, useState } from 'react'
import { useBookmarks } from '../hooks/useSocial'
import ArticleCard from '../components/article/ArticleCard'
import Spinner     from '../components/ui/Spinner'
import { Bookmark, Search, SlidersHorizontal } from 'lucide-react'

const PAGE_SIZE = 20

type SortMode = 'newest' | 'oldest' | 'title' | 'likes' | 'views'

export default function BookmarksPage() {
  const [page, setPage] = useState(1)
  const [q, setQ] = useState('')
  const [sort, setSort] = useState<SortMode>('newest')
  const { data, isLoading } = useBookmarks(page, PAGE_SIZE)

  const bookmarks = useMemo(() => data?.items ?? [], [data?.items])

  const filtered = useMemo(() => {
    const query = q.trim().toLowerCase()
    const matchesQuery = (title: string, subtitle?: string) => {
      if (!query) return true
      const hay = `${title} ${subtitle ?? ''}`.toLowerCase()
      return hay.includes(query)
    }

    const list = bookmarks.filter(a => matchesQuery(a.title, a.subtitle))
    const ts = (iso?: string) => (iso ? new Date(iso).getTime() : 0)

    return [...list].sort((a, b) => {
      if (sort === 'title') return a.title.localeCompare(b.title)
      if (sort === 'likes') return b.likes_count - a.likes_count
      if (sort === 'views') return b.views_count - a.views_count
      if (sort === 'oldest') return ts(a.published_at ?? a.created_at) - ts(b.published_at ?? b.created_at)
      return ts(b.published_at ?? b.created_at) - ts(a.published_at ?? a.created_at)
    })
  }, [bookmarks, q, sort])

  const hasPrev = page > 1
  const hasNext = !!data?.has_more

  return (
    <div className='space-y-6'>
      <div className='flex items-center justify-between gap-3'>
        <div className='flex items-center gap-3'>
          <Bookmark size={20} className='text-blue-400' />
          <h1 className='text-xl font-bold text-white'>Saved Articles</h1>
        </div>
        <p className='text-sm text-gray-500'>
          {data?.total ?? 0} saved
        </p>
      </div>

      <div className='grid grid-cols-1 md:grid-cols-3 gap-3'>
        <label className='md:col-span-2 flex items-center gap-2 rounded-xl border border-gray-800 bg-gray-900 px-3 py-2'>
          <Search size={15} className='text-gray-500' />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder='Search within saved articles'
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
            <option value='newest'>Newest first</option>
            <option value='oldest'>Oldest first</option>
            <option value='likes'>Most liked</option>
            <option value='views'>Most viewed</option>
            <option value='title'>Title A-Z</option>
          </select>
        </label>
      </div>

      {isLoading ? (
        <div className='flex justify-center py-12'><Spinner /></div>
      ) : !bookmarks.length ? (
        <div className='text-center py-16 text-gray-500'>
          <Bookmark size={40} className='mx-auto mb-4 opacity-20' />
          <p>No saved articles yet.</p>
          <p className='text-sm mt-1'>Click the bookmark icon on any article to save it here.</p>
        </div>
      ) : !filtered.length ? (
        <div className='text-center py-16 text-gray-500'>
          <p>No bookmarks match your filters.</p>
          <button
            onClick={() => {
              setQ('')
              setSort('newest')
            }}
            className='mt-3 text-sm text-blue-400 hover:text-blue-300 transition-colors'
          >
            Reset filters
          </button>
        </div>
      ) : (
        <>
          <div className='space-y-3'>
            {filtered.map(a => <ArticleCard key={a.id} article={a} />)}
          </div>

          <div className='flex items-center justify-between pt-3'>
            <p className='text-xs text-gray-600'>
              Page {data?.page ?? page} of {Math.max(1, data?.pages ?? 1)}
            </p>
            <div className='flex gap-2'>
              <button
                disabled={!hasPrev}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                className='px-3 py-1.5 rounded-lg text-sm border border-gray-700 text-gray-300 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-gray-800 transition-colors'
              >
                Previous
              </button>
              <button
                disabled={!hasNext}
                onClick={() => setPage((p) => p + 1)}
                className='px-3 py-1.5 rounded-lg text-sm border border-gray-700 text-gray-300 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-gray-800 transition-colors'
              >
                Next
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  )
}

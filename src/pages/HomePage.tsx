import { useEffect, useMemo, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { useFeed, useFeatured } from '../hooks/useFeed'
import { useAuth } from '../hooks/useAuth'
import ArticleCard from '../components/article/ArticleCard'
import ArticleHero from '../components/article/ArticleHero'
import Spinner     from '../components/ui/Spinner'

const TABS = [
  { id: 'home',      label: 'For You' },
  { id: 'following', label: 'Following' },
  { id: 'trending',  label: 'Trending' },
] as const

export default function HomePage() {
  const [tab, setTab] = useState<'home' | 'following' | 'trending'>('home')
  const { user } = useAuth()
  const loadMoreRef = useRef<HTMLDivElement | null>(null)

  const { data: featuredData } = useFeatured()
  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading,
    isError,
    error,
  } = useFeed(tab, tab !== 'following' || !!user)

  const articles = useMemo(() => {
    const merged = data?.pages.flatMap(p => Array.isArray(p?.articles) ? p.articles : []) ?? []
    const unique = new Map<string, (typeof merged)[number]>()
    for (const article of merged) {
      if (!article?.id) continue
      unique.set(article.id, article)
    }
    return [...unique.values()]
  }, [data])

  const feedLabel = data?.pages[0]?.feed
  const showFeatured = tab === 'home' && featuredData && featuredData.length > 0

  useEffect(() => {
    if (!loadMoreRef.current || !hasNextPage || isFetchingNextPage) return

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting) {
          fetchNextPage()
        }
      },
      { rootMargin: '240px 0px' },
    )

    observer.observe(loadMoreRef.current)
    return () => observer.disconnect()
  }, [fetchNextPage, hasNextPage, isFetchingNextPage, articles.length, tab])

  return (
    <div className='space-y-10'>

      {/* Featured carousel */}
      {showFeatured && (
        <section>
          <h2 className='text-xs font-semibold text-gray-500 uppercase tracking-widest mb-4'>
            Featured
          </h2>
          <div className='grid grid-cols-1 sm:grid-cols-2 gap-4'>
            {featuredData.slice(0, 2).map(a => (
              <ArticleHero key={a.id} article={a} />
            ))}
          </div>
        </section>
      )}

      {/* Feed tabs */}
      <div>
        <div className='flex items-center gap-1 border-b border-gray-800 mb-6'>
          {TABS.map(t => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={[
                'px-4 py-2.5 text-sm font-medium transition-colors border-b-2 -mb-px',
                tab === t.id
                  ? 'text-white border-blue-500'
                  : 'text-gray-400 border-transparent hover:text-white',
              ].join(' ')}
            >
              {t.label}
            </button>
          ))}
          {feedLabel === 'personalised' && (
            <span className='ml-auto text-xs text-blue-500/70 pr-1'>✦ Personalised</span>
          )}
        </div>

        {tab === 'following' && !user ? (
          <div className='text-center py-14 rounded-2xl border border-gray-800 bg-gray-900/40'>
            <p className='text-gray-300 mb-3'>Sign in to view articles from authors you follow.</p>
            <Link
              to='/login'
              className='inline-flex items-center rounded-full px-4 py-2 text-sm bg-blue-600 hover:bg-blue-500 text-white transition-colors'
            >
              Go to login
            </Link>
          </div>
        ) : isLoading ? (
          <div className='flex justify-center py-12'><Spinner /></div>
        ) : isError ? (
          <div className='text-center py-16 text-red-400'>
            Failed to load feed{error instanceof Error ? `: ${error.message}` : '.'}
          </div>
        ) : articles.length === 0 ? (
          <div className='text-center py-16 text-gray-500'>
            {tab === 'following'
              ? 'Follow some authors to see their articles here.'
              : tab === 'trending'
                ? 'No trending articles yet.'
              : 'No articles yet.'
            }
          </div>
        ) : (
          <div className='space-y-3'>
            {articles.map(a => <ArticleCard key={a.id} article={a} />)}
          </div>
        )}

        {hasNextPage && (
          <div className='flex justify-center pt-8' ref={loadMoreRef}>
            <button
              onClick={() => fetchNextPage()}
              disabled={isFetchingNextPage}
              className='px-6 py-2.5 bg-gray-800 hover:bg-gray-700 rounded-full text-sm text-gray-300 disabled:opacity-50 transition-colors'
            >
              {isFetchingNextPage ? 'Loading...' : 'Load more'}
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

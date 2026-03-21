import { useEffect, useMemo, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { useFeed, useFeatured } from '../hooks/useFeed'
import { useAuth } from '../hooks/useAuth'
import { resolveAssetUrl } from '../lib/assets'
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

  const guestTrending = useFeed('trending', !user)

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

  const guestTrendingArticles = useMemo(() => {
    const merged = guestTrending.data?.pages.flatMap(p => Array.isArray(p?.articles) ? p.articles : []) ?? []
    const unique = new Map<string, (typeof merged)[number]>()
    for (const article of merged) {
      if (!article?.id) continue
      unique.set(article.id, article)
    }
    return [...unique.values()].slice(0, 3)
  }, [guestTrending.data])

  const guestFallbackCards = [
    {
      id: 'zenos-write',
      title: 'Write with confidence',
      subtitle: 'Craft thoughtful stories with a clean editor and rich embeds.',
    },
    {
      id: 'zenos-review',
      title: 'Review with clarity',
      subtitle: 'Collaborate through approval workflows built for editorial teams.',
    },
    {
      id: 'zenos-publish',
      title: 'Publish and automate',
      subtitle: 'Ship content fast with governance, analytics, and automation.',
    },
  ]

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

  if (!user) {
    const cards = guestTrendingArticles.length > 0 ? guestTrendingArticles : guestFallbackCards

    return (
      <div className='space-y-8'>
        <section className='rounded-2xl border border-[color:var(--border)] bg-[color:var(--surface-1)] p-6'>
          <p className='text-xs uppercase tracking-[0.2em] text-[color:var(--text-muted)]'>Welcome to Zenos</p>
          <h1 className='mt-2 text-3xl font-bold text-[color:var(--text-primary)]'>Trending stories to explore</h1>
          <p className='mt-2 max-w-2xl text-sm text-[color:var(--text-secondary)]'>
            Discover the latest content. Sign in to unlock your personalised feed, bookmarks, and writing workspace.
          </p>
        </section>

        {guestTrending.isLoading ? (
          <div className='flex justify-center py-12'><Spinner /></div>
        ) : (
          <section>
            <div className='mb-3 flex items-center justify-between'>
              <h2 className='text-sm font-semibold uppercase tracking-wider text-[color:var(--text-muted)]'>Trending now</h2>
            </div>

            <div className='-mx-2 flex gap-4 overflow-x-auto px-2 pb-2 snap-x snap-mandatory'>
              {cards.map((card) => {
                const article = 'slug' in card ? card : null
                const coverUrl = article ? resolveAssetUrl(article.cover_image_url) : null

                return (
                  <article
                    key={card.id}
                    className='min-w-[280px] md:min-w-[340px] snap-start overflow-hidden rounded-2xl border border-[color:var(--border)] bg-[color:var(--surface-0)] shadow-sm'
                  >
                    {article ? (
                      <Link to={`/article/${article.slug}`} className='block'>
                        <div className='h-44 w-full overflow-hidden bg-[color:var(--surface-2)]'>
                          {coverUrl ? (
                            <img src={coverUrl} alt={article.title} className='h-full w-full object-cover' loading='lazy' />
                          ) : (
                            <div className='grid h-full w-full place-items-center bg-gradient-to-br from-[#2a3b4a] via-[#4d657a] to-[#6f8ea8] text-white'>
                              <span className='text-lg font-semibold tracking-wider'>ZENOS</span>
                            </div>
                          )}
                        </div>
                        <div className='space-y-2 p-4'>
                          <h3 className='line-clamp-2 text-lg font-semibold text-[color:var(--text-primary)]'>{article.title}</h3>
                          <p className='line-clamp-2 text-sm text-[color:var(--text-secondary)]'>{article.subtitle || 'No subtitle'}</p>
                        </div>
                      </Link>
                    ) : (
                      <div>
                        <div className='grid h-44 w-full place-items-center bg-gradient-to-br from-[#243447] via-[#35506b] to-[#4e7294] text-white'>
                          <span className='text-lg font-semibold tracking-wider'>ZENOS</span>
                        </div>
                        <div className='space-y-2 p-4'>
                          <h3 className='line-clamp-2 text-lg font-semibold text-[color:var(--text-primary)]'>{card.title}</h3>
                          <p className='line-clamp-2 text-sm text-[color:var(--text-secondary)]'>{card.subtitle}</p>
                        </div>
                      </div>
                    )}
                  </article>
                )
              })}
            </div>

            {!guestTrendingArticles.length && (
              <p className='mt-3 text-xs text-[color:var(--text-muted)]'>
                No published content yet. Zenos helps teams write, review, publish, and automate.
              </p>
            )}
          </section>
        )}
      </div>
    )
  }

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

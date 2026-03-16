import { useState } from 'react'
import { useFeed, useFeatured } from '../hooks/useFeed'
import ArticleCard from '../components/article/ArticleCard'
import ArticleHero from '../components/article/ArticleHero'
import Spinner     from '../components/ui/Spinner'

const TABS = [
  { id: 'home',      label: 'For You' },
  { id: 'following', label: 'Following' },
] as const

export default function HomePage() {
  const [tab, setTab] = useState<'home' | 'following'>('home')

  const { data: featuredData } = useFeatured()
  const {
    data, fetchNextPage, hasNextPage,
    isFetchingNextPage, isLoading,
  } = useFeed(tab)

  const articles = data?.pages.flatMap(p => p.articles) ?? []
  const feedLabel = data?.pages[0]?.feed

  return (
    <div className='space-y-10'>

      {/* Featured carousel */}
      {featuredData && featuredData.length > 0 && (
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

        {isLoading ? (
          <div className='flex justify-center py-12'><Spinner /></div>
        ) : articles.length === 0 ? (
          <div className='text-center py-16 text-gray-500'>
            {tab === 'following'
              ? 'Follow some authors to see their articles here.'
              : 'No articles yet.'
            }
          </div>
        ) : (
          <div className='space-y-3'>
            {articles.map(a => <ArticleCard key={a.id} article={a} />)}
          </div>
        )}

        {hasNextPage && (
          <div className='flex justify-center pt-8'>
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

import { useEffect, useMemo, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { ChevronLeft, ChevronRight, Moon, Sun } from 'lucide-react'
import { useFeed, useFeatured } from '../hooks/useFeed'
import { useAuth } from '../hooks/useAuth'
import { useUiStore } from '../stores/uiStore'
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
  const [guestIndex, setGuestIndex] = useState(0)
  const { user } = useAuth()
  const { theme, toggleTheme } = useUiStore()
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

  useEffect(() => {
    if (user) return
    const cardCount = guestTrendingArticles.length > 0 ? guestTrendingArticles.length : guestFallbackCards.length
    if (cardCount <= 1) return

    const timer = window.setInterval(() => {
      setGuestIndex((current) => (current + 1) % cardCount)
    }, 5000)

    return () => window.clearInterval(timer)
  }, [user, guestTrendingArticles.length])

  if (!user) {
    const cards = guestTrendingArticles.length > 0 ? guestTrendingArticles : guestFallbackCards
    const currentCard = cards[guestIndex % cards.length]
    const currentArticle = 'slug' in currentCard ? currentCard : null
    const currentCoverUrl = currentArticle ? resolveAssetUrl(currentArticle.cover_image_url) : null
    const expandedCards = cards.slice(0, 6)

    const goPrev = () => setGuestIndex((current) => (current - 1 + cards.length) % cards.length)
    const goNext = () => setGuestIndex((current) => (current + 1) % cards.length)

    return (
      <div className='space-y-8'>
        <header className='sticky top-0 z-20 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-[color:var(--border)] bg-[color:var(--topbar-bg)]/95 px-4 py-3 shadow-sm backdrop-blur-md md:px-6'>
          <div className='flex items-end gap-1.5 text-[color:var(--text-primary)] leading-none'>
            <span className="font-['Syne',system-ui,sans-serif] text-[2.05rem] font-extrabold tracking-[-0.065em]">Zenos</span>
            <span className='mb-[3px] text-[1.05rem] font-semibold tracking-[-0.03em] text-[color:var(--accent)]'>.work</span>
          </div>
          <nav className='flex flex-wrap items-center gap-2 text-xs font-semibold uppercase tracking-[0.14em] text-[color:var(--text-secondary)] md:gap-3'>
            <button
              type='button'
              onClick={toggleTheme}
              className='grid h-8 w-8 place-items-center rounded-full border border-[color:var(--border-strong)] text-[color:var(--text-primary)] hover:bg-[color:var(--surface-2)]'
              aria-label={`Switch to ${theme === 'light' ? 'dark' : 'light'} theme`}
              title={`Switch to ${theme === 'light' ? 'dark' : 'light'} theme`}
            >
              {theme === 'light' ? <Moon size={14} /> : <Sun size={14} />}
            </button>
            <a href='#our-story' className='rounded-full px-3 py-1.5 hover:bg-[color:var(--surface-2)] hover:text-[color:var(--text-primary)]'>Our Story</a>
            <a href='#why-different' className='rounded-full px-3 py-1.5 hover:bg-[color:var(--surface-2)] hover:text-[color:var(--text-primary)]'>Why Different</a>
            <a href='#features' className='rounded-full px-3 py-1.5 hover:bg-[color:var(--surface-2)] hover:text-[color:var(--text-primary)]'>All Features</a>
            <a href='#hear-your-story' className='rounded-full px-3 py-1.5 hover:bg-[color:var(--surface-2)] hover:text-[color:var(--text-primary)]'>Let&apos;s Hear Your Story</a>
            <Link to='/membership' className='rounded-full border border-[color:var(--accent)] bg-[color:var(--accent-dim)] px-3 py-1.5 text-[color:var(--text-primary)]'>Membership</Link>
            <Link to='/login' className='rounded-full border border-[color:var(--border-strong)] px-3 py-1.5 text-[color:var(--text-primary)]'>Sign in</Link>
          </nav>
        </header>

        {guestTrending.isLoading ? (
          <div className='flex justify-center py-12'><Spinner /></div>
        ) : (
          <section className='space-y-8'>
            <div className='mb-2 flex items-center justify-between'>
              <div>
                <h1 className='mt-2 text-3xl font-semibold tracking-tight text-[color:var(--text-primary)] md:text-4xl'>
                  Stories worth opening first
                </h1>
              </div>
              {cards.length > 1 && (
                <div className='flex items-center gap-2'>
                  <button
                    type='button'
                    onClick={goPrev}
                    className='grid h-9 w-9 place-items-center rounded-full border border-[color:var(--border)] bg-[color:var(--surface-0)] text-[color:var(--text-primary)] hover:bg-[color:var(--surface-2)]'
                    aria-label='Previous slide'
                  >
                    <ChevronLeft size={16} />
                  </button>
                  <button
                    type='button'
                    onClick={goNext}
                    className='grid h-9 w-9 place-items-center rounded-full border border-[color:var(--border)] bg-[color:var(--surface-0)] text-[color:var(--text-primary)] hover:bg-[color:var(--surface-2)]'
                    aria-label='Next slide'
                  >
                    <ChevronRight size={16} />
                  </button>
                </div>
              )}
            </div>

            <div className='grid gap-6'>
              <article className='relative overflow-hidden rounded-[2rem] border border-[color:var(--border)] bg-[color:var(--surface-0)] shadow-sm'>
                {currentArticle ? (
                  <Link to={`/article/${currentArticle.slug}`} className='block'>
                    <div className='relative h-[360px] md:h-[520px] w-full overflow-hidden bg-[color:var(--surface-2)]'>
                      {currentCoverUrl ? (
                        <img src={currentCoverUrl} alt={currentArticle.title} className='h-full w-full object-cover' loading='lazy' />
                      ) : (
                        <div className='grid h-full w-full place-items-center bg-gradient-to-br from-[#1d2d3f] via-[#35506b] to-[#6b8ba7] text-white'>
                          <span className='text-2xl font-semibold tracking-[0.3em]'>ZENOS</span>
                        </div>
                      )}
                      <div className='absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-transparent' />
                      <div className='absolute inset-x-0 bottom-0 p-6 md:p-8'>
                        <p className='mb-3 text-xs font-semibold uppercase tracking-[0.22em] text-white/70'>Spotlight</p>
                        <h2 className='max-w-3xl text-3xl font-semibold leading-tight text-white md:text-5xl'>
                          {currentArticle.title}
                        </h2>
                        <p className='mt-3 max-w-2xl text-sm leading-6 text-white/85 md:text-base md:leading-7'>
                          {currentArticle.subtitle || 'Explore the latest story from Zenos.'}
                        </p>
                      </div>
                    </div>
                  </Link>
                ) : (
                  <div className='relative h-[360px] md:h-[520px] overflow-hidden bg-gradient-to-br from-[#1d2d3f] via-[#35506b] to-[#6b8ba7]'>
                    <div className='absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(255,255,255,0.18),transparent_38%)]' />
                    <div className='absolute inset-x-0 bottom-0 p-6 md:p-8'>
                      <p className='mb-3 text-xs font-semibold uppercase tracking-[0.22em] text-white/70'>Spotlight</p>
                      <h2 className='max-w-3xl text-3xl font-semibold leading-tight text-white md:text-5xl'>{currentCard.title}</h2>
                      <p className='mt-3 max-w-2xl text-sm leading-6 text-white/85 md:text-base md:leading-7'>{currentCard.subtitle}</p>
                    </div>
                  </div>
                )}
              </article>

              <section className='grid gap-4 md:grid-cols-2 xl:grid-cols-3'>
                {expandedCards.map((card, index) => {
                  const cardArticle = 'slug' in card ? card : null
                  const cardCoverUrl = cardArticle ? resolveAssetUrl(cardArticle.cover_image_url) : null
                  const body = (
                    <div className='flex h-full flex-col justify-end rounded-[1.4rem] border border-[color:var(--border)] bg-[color:var(--surface-1)] p-4 transition-transform hover:-translate-y-0.5'>
                      <div className='mb-4 overflow-hidden rounded-[1rem] bg-[color:var(--surface-2)]'>
                        {cardCoverUrl ? (
                          <img src={cardCoverUrl} alt={cardArticle?.title || card.title} className='h-40 w-full object-cover' loading='lazy' />
                        ) : (
                          <div className='grid h-40 w-full place-items-center bg-gradient-to-br from-[#2b3f53] to-[#5d7896] text-sm font-semibold uppercase tracking-[0.2em] text-white/80'>
                            Zenos
                          </div>
                        )}
                      </div>
                      <h3 className='mt-2 text-lg font-semibold leading-tight text-[color:var(--text-primary)]'>
                        {cardArticle?.title || card.title}
                      </h3>
                      <p className='mt-2 text-sm leading-6 text-[color:var(--text-secondary)]'>
                        {cardArticle?.subtitle || card.subtitle}
                      </p>
                    </div>
                  )

                  return cardArticle ? (
                    <Link key={card.id} to={`/article/${cardArticle.slug}`} className='block'>
                      {body}
                    </Link>
                  ) : (
                    <button
                      key={card.id}
                      type='button'
                      onClick={() => setGuestIndex(cards.findIndex((item) => item.id === card.id))}
                      className='text-left'
                    >
                      {body}
                    </button>
                  )
                })}
              </section>
            </div>

            <section id='our-story' className='grid gap-4 rounded-[1.8rem] border border-[color:var(--border)] bg-[color:var(--surface-1)] p-6 lg:grid-cols-2'>
              <div>
                <p className='text-xs font-semibold uppercase tracking-[0.2em] text-[color:var(--text-muted)]'>Our Story</p>
                <h2 className='mt-2 text-3xl font-semibold text-[color:var(--text-primary)]'>Built for serious writing teams</h2>
                <p className='mt-3 text-sm leading-7 text-[color:var(--text-secondary)]'>
                  Zenos started with one question: why do creators still juggle scattered tools for drafting, approvals, and publishing? We built one space where writing quality and editorial velocity can coexist.
                </p>
              </div>
              <div className='rounded-2xl border border-[color:var(--border-strong)] bg-[color:var(--surface-0)] p-5'>
                <p className='text-sm font-semibold text-[color:var(--text-primary)]'>From draft to governed publish</p>
                <p className='mt-2 text-sm leading-7 text-[color:var(--text-secondary)]'>
                  Writers draft freely, approvers review confidently, and teams publish with policy-aware workflows.
                </p>
              </div>
            </section>

            <section id='why-different' className='grid gap-4 lg:grid-cols-3'>
              {[
                ['Clarity over clutter', 'An editor-first experience with strong typography and clean reading rhythm.'],
                ['Governance without friction', 'Approval flows that stay out of your way until they are needed.'],
                ['Built for teams', 'Roles, notifications, and analytics aligned with real editorial operations.'],
              ].map(([title, desc]) => (
                <article key={title} className='rounded-2xl border border-[color:var(--border)] bg-[color:var(--surface-0)] p-5'>
                  <h3 className='text-lg font-semibold text-[color:var(--text-primary)]'>{title}</h3>
                  <p className='mt-2 text-sm leading-7 text-[color:var(--text-secondary)]'>{desc}</p>
                </article>
              ))}
            </section>

            <section id='features' className='rounded-[1.8rem] border border-[color:var(--border)] bg-[color:var(--surface-1)] p-6'>
              <p className='text-xs font-semibold uppercase tracking-[0.2em] text-[color:var(--text-muted)]'>All Features</p>
              <div className='mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-4'>
                {['Rich editor', 'Inline media', 'Approvals', 'Role-based access', 'Library and bookmarks', 'Notifications', 'Publishing workflows', 'Insightful stats'].map((feature) => (
                  <div key={feature} className='rounded-xl border border-[color:var(--border)] bg-[color:var(--surface-0)] px-4 py-3 text-sm font-medium text-[color:var(--text-primary)]'>
                    {feature}
                  </div>
                ))}
              </div>
            </section>

            <section
              id='hear-your-story'
              className='relative overflow-hidden rounded-[1.8rem] border border-[color:var(--border-strong)] p-6'
              style={{ background: 'linear-gradient(130deg, var(--surface-3) 0%, var(--surface-2) 54%, var(--surface-1) 100%)' }}
            >
              <div className='absolute -right-20 -top-20 h-52 w-52 rounded-full bg-[color:var(--accent-dim)]/55 blur-2xl' />
              <div className='absolute -bottom-24 left-16 h-56 w-56 rounded-full bg-[color:var(--surface-0)]/35 blur-3xl' />
              <p className='relative text-xs font-semibold uppercase tracking-[0.22em] text-[color:var(--text-muted)]'>Let&apos;s Hear Your Story</p>
              <h2 className='relative mt-2 text-3xl font-semibold text-[color:var(--text-primary)]'>Tell us what you are building and writing next.</h2>
              <p className='relative mt-3 max-w-3xl text-sm leading-7 text-[color:var(--text-secondary)]'>
                Share your publishing goals, team setup, and content vision. We are listening and shaping Zenos with creator feedback.
              </p>
              <div className='relative mt-5 flex flex-wrap gap-3'>
                <Link
                  to='/membership'
                  className='rounded-full border border-[color:var(--accent)] bg-[color:var(--accent)] px-5 py-2 text-sm font-semibold text-white shadow-[0_8px_24px_rgba(5,20,34,0.18)] hover:opacity-95'
                >
                  Explore Membership
                </Link>
                <Link
                  to='/login'
                  className='rounded-full border border-[color:var(--border-strong)] bg-[color:var(--surface-0)] px-5 py-2 text-sm font-semibold text-[color:var(--text-primary)] hover:bg-[color:var(--surface-2)]'
                >
                  Start Writing
                </Link>
              </div>
            </section>

            {cards.length > 1 && (
              <div className='flex items-center justify-center gap-2'>
                {cards.map((card, index) => (
                  <button
                    key={card.id}
                    type='button'
                    onClick={() => setGuestIndex(index)}
                    aria-label={`Go to slide ${index + 1}`}
                    className={[
                      'h-2.5 rounded-full transition-all',
                      index === guestIndex ? 'w-8 bg-[color:var(--accent)]' : 'w-2.5 bg-[color:var(--border-strong)] hover:bg-[color:var(--text-muted)]',
                    ].join(' ')}
                  />
                ))}
              </div>
            )}

            {!guestTrendingArticles.length && (
              <p className='mt-2 text-xs text-[color:var(--text-muted)]'>Fresh stories will appear here as soon as they are published.</p>
            )}

            <footer className='grid gap-4 rounded-2xl border border-[color:var(--border)] bg-[color:var(--surface-0)] p-5 md:grid-cols-2 xl:grid-cols-4'>
              <div>
                <p className='text-xs font-semibold uppercase tracking-[0.2em] text-[color:var(--text-muted)]'>Platform</p>
                <div className='mt-3 flex flex-col gap-2 text-sm'>
                  <Link to='/info/status' className='text-[color:var(--text-secondary)] hover:text-[color:var(--text-primary)]'>Status</Link>
                  <Link to='/info/about' className='text-[color:var(--text-secondary)] hover:text-[color:var(--text-primary)]'>About</Link>
                  <Link to='/membership' className='text-[color:var(--text-secondary)] hover:text-[color:var(--text-primary)]'>Membership</Link>
                </div>
              </div>
              <div>
                <p className='text-xs font-semibold uppercase tracking-[0.2em] text-[color:var(--text-muted)]'>Legal</p>
                <div className='mt-3 flex flex-col gap-2 text-sm'>
                  <Link to='/info/privacy' className='text-[color:var(--text-secondary)] hover:text-[color:var(--text-primary)]'>Privacy</Link>
                  <Link to='/info/rules' className='text-[color:var(--text-secondary)] hover:text-[color:var(--text-primary)]'>Rules</Link>
                  <Link to='/info/terms' className='text-[color:var(--text-secondary)] hover:text-[color:var(--text-primary)]'>Terms</Link>
                </div>
              </div>
              <div>
                <p className='text-xs font-semibold uppercase tracking-[0.2em] text-[color:var(--text-muted)]'>Accessibility</p>
                <div className='mt-3 flex flex-col gap-2 text-sm'>
                  <Link to='/info/text-to-speech' className='text-[color:var(--text-secondary)] hover:text-[color:var(--text-primary)]'>Text to speech</Link>
                  <Link to='/info/help' className='text-[color:var(--text-secondary)] hover:text-[color:var(--text-primary)]'>Help</Link>
                </div>
              </div>
              <div>
                <p className='text-xs font-semibold uppercase tracking-[0.2em] text-[color:var(--text-muted)]'>Join</p>
                <p className='mt-3 text-sm leading-6 text-[color:var(--text-secondary)]'>Create an account to publish stories and collaborate with your team.</p>
                <Link to='/login' className='mt-4 inline-flex rounded-full border border-[color:var(--border-strong)] px-4 py-2 text-sm font-semibold text-[color:var(--text-primary)] hover:bg-[color:var(--surface-2)]'>Sign in</Link>
              </div>
            </footer>
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

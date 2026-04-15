import { type FormEvent, useEffect, useMemo, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  ArrowRight,
  BarChart3,
  BookOpen,
  ChevronRight,
  Globe,
  Moon,
  PenSquare,
  Shield,
  Star,
  Sun,
  TrendingUp,
  Users,
  Zap,
} from 'lucide-react'
import { useFeed, useFeatured } from '../hooks/useFeed'
import { useAuth } from '../hooks/useAuth'
import { useUiStore } from '../stores/uiStore'
import { resolveAssetUrl } from '../lib/assets'
import ArticleCard from '../components/article/ArticleCard'
import ArticleHero from '../components/article/ArticleHero'
import { DiscoverySidebar } from '../components/reading/DiscoverySidebar'
import Spinner     from '../components/ui/Spinner'

const TABS = [
  { id: 'home',      label: 'For You' },
  { id: 'following', label: 'Following' },
  { id: 'trending',  label: 'Trending' },
] as const

type GuestFeatureCard = {
  id: string
  title: string
  subtitle: string
  image_url: string
  slug?: string
}

export default function HomePage() {
  const [tab, setTab] = useState<'home' | 'following' | 'trending'>('home')
  const { user } = useAuth()
  const { resolvedTheme, setTheme } = useUiStore()
  const loadMoreRef = useRef<HTMLDivElement | null>(null)
  const [newsletterEmail, setNewsletterEmail] = useState('')
  const [newsletterStatus, setNewsletterStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle')
  const [newsletterMessage, setNewsletterMessage] = useState('')

  const publicationsJobsBaseUrl = (import.meta.env.VITE_PUBLICATIONS_JOBS_URL || '').trim().replace(/\/+$/, '')

  const guestHomeFeed = useFeed('home', !user)

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

  const guestHomeArticles = useMemo(() => {
    const merged = guestHomeFeed.data?.pages.flatMap(p => Array.isArray(p?.articles) ? p.articles : []) ?? []
    const unique = new Map<string, (typeof merged)[number]>()
    for (const article of merged) {
      if (!article?.id) continue
      unique.set(article.id, article)
    }
    return [...unique.values()]
  }, [guestHomeFeed.data])

  const guestFeatureCards = useMemo<GuestFeatureCard[]>(() => {
    return guestHomeArticles.slice(0, 6).map((article) => ({
      id: `featured-${article.id}`,
      title: article.title,
      subtitle: article.subtitle || 'No subtitle available.',
      image_url: resolveAssetUrl(article.cover_image_url) || '',
      slug: article.slug,
    }))
  }, [guestHomeArticles])

  const topWriters = useMemo(() => {
    const byAuthor = new Map<string, { name: string; stories: number; totalViews: number }>()
    guestHomeArticles.forEach((article) => {
      const name = article.author_name || 'Zenos Writer'
      const current = byAuthor.get(name) ?? { name, stories: 0, totalViews: 0 }
      current.stories += 1
      current.totalViews += article.views_count
      byAuthor.set(name, current)
    })
    return [...byAuthor.values()]
      .sort((left, right) => right.totalViews - left.totalViews)
      .slice(0, 4)
  }, [guestHomeArticles])

  const guestTestimonials = useMemo(() => {
    const candidates = guestHomeArticles
      .filter((article) => article.subtitle && article.subtitle.trim().length > 0)
      .slice(0, 3)
    return candidates.map((article) => ({
      quote: article.subtitle as string,
      author: article.author_name || 'Zenos Writer',
      role: `${article.read_time_minutes} min read`,
    }))
  }, [guestHomeArticles])

  const heroStats = useMemo(() => {
    const publishedStories = guestHomeArticles.length
    const monthlyReads = guestHomeArticles.reduce((sum, article) => sum + article.views_count, 0)
    const avgReadTime = guestHomeArticles.length
      ? (guestHomeArticles.reduce((sum, article) => sum + article.read_time_minutes, 0) / guestHomeArticles.length).toFixed(1)
      : '0.0'

    return {
      activeReaders: Math.max(0, Math.round(monthlyReads / 3)).toLocaleString(),
      publishedStories: publishedStories.toLocaleString(),
      monthlyReads: monthlyReads.toLocaleString(),
      avgReadTime,
    }
  }, [guestHomeArticles])

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

  const handleNewsletterSubscribe = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()

    const normalizedEmail = newsletterEmail.trim().toLowerCase()
    if (!normalizedEmail) {
      setNewsletterStatus('error')
      setNewsletterMessage('Enter your email to subscribe.')
      return
    }

    if (!publicationsJobsBaseUrl) {
      setNewsletterStatus('error')
      setNewsletterMessage('Newsletter service is not configured yet.')
      return
    }

    setNewsletterStatus('loading')
    setNewsletterMessage('')

    try {
      const subscribeUrl = `${publicationsJobsBaseUrl}/newsletter/subscribe?email=${encodeURIComponent(normalizedEmail)}&source=frontend-home`
      const response = await fetch(subscribeUrl, {
        method: 'GET',
        headers: {
          Accept: 'application/json',
        },
      })

      let payload: { ok?: boolean; error?: string } = {}
      try {
        payload = await response.json()
      } catch {
        payload = {}
      }

      if (!response.ok || payload.ok === false) {
        throw new Error(payload.error || 'Subscription failed')
      }

      setNewsletterStatus('success')
      setNewsletterMessage('Subscribed successfully. Check your inbox for weekly updates.')
      setNewsletterEmail('')
    } catch (error) {
      setNewsletterStatus('error')
      setNewsletterMessage(error instanceof Error ? error.message : 'Unable to subscribe right now.')
    }
  }

  if (!user) {
    const cards = guestFeatureCards

    return (
      <div className='w-full space-y-12'>
        <header className='sticky top-0 z-20 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-[color:var(--border)] bg-[color:var(--topbar-bg)]/95 px-4 py-3 shadow-sm backdrop-blur-md md:px-6'>
          <Link to='/' className='flex items-end gap-1.5 text-[color:var(--text-primary)] leading-none' aria-label='Home'>
            <span className="font-['Syne',system-ui,sans-serif] text-[2.05rem] font-extrabold tracking-[-0.065em]">Zenos</span>
            <span className='mb-[3px] text-[1.05rem] font-semibold tracking-[-0.03em] text-[color:var(--accent)]'>.work</span>
          </Link>
          <nav className='flex flex-wrap items-center gap-2 text-xs font-semibold uppercase tracking-[0.14em] text-[color:var(--text-secondary)] md:gap-3'>
            <button
              type='button'
              onClick={() => setTheme(resolvedTheme === 'light' ? 'dark' : 'light')}
              className='grid h-8 w-8 place-items-center rounded-full border border-[color:var(--border-strong)] text-[color:var(--text-primary)] hover:bg-[color:var(--surface-2)]'
              aria-label='Toggle theme'
              title='Toggle theme'
            >
              {resolvedTheme === 'dark' ? <Moon size={14} /> : <Sun size={14} />}
            </button>
            <Link to='/info/features' className='rounded-full px-3 py-1.5 hover:bg-[color:var(--surface-2)] hover:text-[color:var(--text-primary)]'>Features</Link>
            <Link to='/info/about' className='rounded-full px-3 py-1.5 hover:bg-[color:var(--surface-2)] hover:text-[color:var(--text-primary)]'>Writers</Link>
            <Link to='/membership' className='rounded-full border border-[color:var(--accent)] bg-[color:var(--accent-dim)] px-3 py-1.5 text-[color:var(--text-primary)]'>Pricing</Link>
            <Link to='/login' className='rounded-full border border-[color:var(--border-strong)] px-3 py-1.5 text-[color:var(--text-primary)]'>Sign in</Link>
          </nav>
        </header>

        <section className='relative overflow-hidden rounded-[2rem] border border-[color:var(--border)] bg-[color:var(--surface-0)] px-5 py-11 md:px-8 md:py-15'>
          <div className='absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(166,124,60,0.16),transparent_56%)]' />
          <div className='relative mx-auto max-w-4xl text-center'>
            <p className='inline-flex items-center rounded-full border border-[color:var(--border)] bg-[color:var(--surface-1)] px-4 py-1 text-xs font-semibold uppercase tracking-[0.14em] text-[color:var(--text-secondary)]'>
              {topWriters.length} writers in live feed
            </p>
            <h1 className='mt-6 text-5xl font-bold leading-[1.04] tracking-tight text-[color:var(--text-primary)] md:text-7xl'>
              Where good ideas
              <span className='block text-[color:var(--accent)]'>find you.</span>
            </h1>
            <p className='mx-auto mt-5 max-w-2xl text-base leading-7 text-[color:var(--text-secondary)] md:text-lg'>
              Read with depth, publish with editorial confidence, and grow with analytics that show what your audience values.
            </p>
            <div className='mt-8 flex flex-wrap items-center justify-center gap-3'>
              <Link to='/login' className='inline-flex items-center rounded-full bg-[color:var(--surface-ink)] px-6 py-2.5 text-sm font-semibold text-[color:var(--surface-ink-foreground)]'>
                Start reading free <ArrowRight size={14} className='ml-2' />
              </Link>
              <Link to='/explore' className='rounded-full border border-[color:var(--border-strong)] px-6 py-2.5 text-sm font-semibold text-[color:var(--text-primary)] hover:bg-[color:var(--surface-2)]'>
                Explore topics
              </Link>
            </div>
            <div className='mt-10 grid grid-cols-2 gap-4 text-left sm:grid-cols-4'>
              {[
                { value: heroStats.activeReaders, label: 'Active readers' },
                { value: heroStats.publishedStories, label: 'Published stories' },
                { value: heroStats.monthlyReads, label: 'Monthly reads' },
                { value: heroStats.avgReadTime, label: 'Avg read time' },
              ].map((item) => (
                <div key={item.label} className='rounded-xl border border-[color:var(--border)] bg-[color:var(--surface-1)] px-3 py-3'>
                  <p className='text-2xl font-bold text-[color:var(--text-primary)]'>{item.value}</p>
                  <p className='mt-1 text-xs text-[color:var(--text-secondary)]'>{item.label}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <div className='mx-auto w-full max-w-6xl space-y-12 px-1 md:px-2'>
          <section className='space-y-5 border-y border-[color:var(--border)] py-12'>
            <div className='text-center'>
              <div>
                <p className='text-xs font-semibold uppercase tracking-[0.18em] text-[color:var(--accent)]'>Trending now</p>
                <h2 className='mt-1 text-2xl font-semibold text-[color:var(--text-primary)] md:text-3xl'>Stories worth your time</h2>
              </div>
            </div>

            {guestHomeFeed.isLoading ? (
              <div className='flex justify-center py-12'><Spinner /></div>
            ) : (
              <div className='grid gap-5 md:grid-cols-3'>
                {cards.slice(0, 3).map((card) => (
                  <Link key={card.id} to={card.slug ? `/article/${card.slug}` : '/search'} className='group block overflow-hidden rounded-2xl border border-[color:var(--border)] bg-[color:var(--surface-0)]'>
                    <div className='h-44 overflow-hidden bg-[color:var(--surface-2)]'>
                      {card.image_url ? (
                        <img src={card.image_url} alt={card.title} className='h-full w-full object-cover transition-transform duration-500 group-hover:scale-105' loading='lazy' />
                      ) : (
                        <div className='grid h-full w-full place-items-center text-sm text-[color:var(--text-secondary)]'>No cover image</div>
                      )}
                    </div>
                    <div className='space-y-2 p-4'>
                      <h3 className='line-clamp-2 text-lg font-semibold text-[color:var(--text-primary)]'>{card.title}</h3>
                      <p className='line-clamp-2 text-sm text-[color:var(--text-secondary)]'>{card.subtitle}</p>
                    </div>
                  </Link>
                ))}
              </div>
            )}

            {!cards.length && (
              <div className='rounded-xl border border-[color:var(--border)] bg-[color:var(--surface-0)] p-6 text-center text-sm text-[color:var(--text-secondary)]'>
                No live stories available yet.
              </div>
            )}

            <div className='text-center'>
              <Link to='/explore' className='inline-flex items-center rounded-full border border-[color:var(--border-strong)] px-5 py-2 text-sm font-medium text-[color:var(--text-primary)] hover:bg-[color:var(--surface-2)]'>
                View all stories <ChevronRight size={14} className='ml-1' />
              </Link>
            </div>
          </section>

          <section className='space-y-8'>
            <div className='text-center'>
              <p className='text-xs font-semibold uppercase tracking-[0.18em] text-[color:var(--accent)]'>Why Zenos</p>
              <h2 className='mt-1 text-2xl font-semibold text-[color:var(--text-primary)] md:text-3xl'>More than just a blog</h2>
            </div>

            <div className='grid gap-4 md:grid-cols-2 lg:grid-cols-3'>
            {[
              {
                icon: BookOpen,
                title: 'Focused reading',
                text: 'Customizable typography, layout width, and navigation that make long-form reading effortless.',
              },
              {
                icon: Zap,
                title: 'Smart reactions',
                text: 'Go beyond likes with richer engagement signals that help writers understand what resonated.',
              },
              {
                icon: BarChart3,
                title: 'Writer analytics',
                text: 'Track views, read ratios, engagement, and momentum with dashboard charts that reveal growth patterns.',
              },
              {
                icon: Shield,
                title: 'Editorial workflow',
                text: 'Publish with review, moderation, and governance controls designed for quality and consistency.',
              },
              {
                icon: Globe,
                title: 'Series and chapters',
                text: 'Organize connected stories into series with clear reader navigation between parts.',
              },
              {
                icon: TrendingUp,
                title: 'Reading insights',
                text: 'Measure content performance from topic traction to conversion-ready engagement trends.',
              },
            ].map((feature) => (
              <div key={feature.title} className='rounded-xl border border-[color:var(--border)] bg-[color:var(--surface-0)] p-4'>
                <div className='mb-3 inline-flex h-9 w-9 items-center justify-center rounded-lg bg-[color:var(--accent-dim)]'>
                  <feature.icon size={16} className='text-[color:var(--accent)]' />
                </div>
                <h3 className='text-base font-semibold text-[color:var(--text-primary)]'>{feature.title}</h3>
                <p className='mt-2 text-sm leading-6 text-[color:var(--text-secondary)]'>{feature.text}</p>
              </div>
            ))}
            </div>
          </section>

          <section className='rounded-2xl border border-[color:var(--border)] bg-[color:var(--surface-1)] p-7'>
            <div className='grid items-start gap-8 lg:grid-cols-2'>
              <div>
                <p className='text-xs font-semibold uppercase tracking-[0.2em] text-[color:var(--accent)]'>For writers</p>
                <h2 className='mt-2 text-3xl font-semibold text-[color:var(--text-primary)]'>Turn your expertise into income</h2>
                <p className='mt-3 max-w-3xl text-sm leading-7 text-[color:var(--text-secondary)]'>
                  Build your audience, publish premium stories, and use platform insights to grow what resonates.
                </p>
                <div className='mt-5 space-y-2 text-sm text-[color:var(--text-secondary)]'>
                  <p>Earn from paid reads with transparent analytics.</p>
                  <p>Priority review for professional creators.</p>
                  <p>Audience growth insights and retention signals.</p>
                </div>
                <div className='mt-5 flex flex-wrap gap-3'>
                  <Link to='/membership' className='rounded-full border border-[color:var(--accent)] bg-[color:var(--accent)] px-5 py-2 text-sm font-semibold text-white'>
                    View membership plans
                  </Link>
                  <Link to='/login' className='inline-flex items-center rounded-full border border-[color:var(--border-strong)] bg-[color:var(--surface-0)] px-5 py-2 text-sm font-semibold text-[color:var(--text-primary)] hover:bg-[color:var(--surface-2)]'>
                    Start writing <PenSquare size={14} className='ml-2' />
                  </Link>
                </div>
              </div>
              <div className='grid gap-3 sm:grid-cols-2'>
                {topWriters.map((writer) => (
                  <div key={writer.name} className='rounded-xl border border-[color:var(--border)] bg-[color:var(--surface-0)] p-4'>
                    <div className='flex h-8 w-8 items-center justify-center rounded-full bg-[color:var(--accent-dim)] text-xs font-bold text-[color:var(--accent)]'>
                      {writer.name.charAt(0).toUpperCase()}
                    </div>
                    <p className='mt-3 text-sm font-semibold text-[color:var(--text-primary)]'>{writer.name}</p>
                    <p className='mt-1 text-xs text-[color:var(--text-secondary)]'>{writer.stories} stories · {writer.totalViews.toLocaleString()} views</p>
                  </div>
                ))}
                {!topWriters.length && (
                  <div className='rounded-xl border border-[color:var(--border)] bg-[color:var(--surface-0)] p-4 text-sm text-[color:var(--text-secondary)]'>
                    No live author data available yet.
                  </div>
                )}
              </div>
            </div>
          </section>

          <section className='space-y-6'>
            <div className='text-center'>
              <p className='text-xs font-semibold uppercase tracking-[0.18em] text-[color:var(--accent)]'>Loved by writers</p>
              <h2 className='mt-1 text-2xl font-semibold text-[color:var(--text-primary)] md:text-3xl'>What our community says</h2>
            </div>
            <div className='grid gap-4 md:grid-cols-3'>
              {guestTestimonials.map((item) => (
                <div key={`${item.author}-${item.role}`} className='rounded-xl border border-[color:var(--border)] bg-[color:var(--surface-0)] p-4'>
                  <div className='flex items-center gap-1'>
                    {Array.from({ length: 5 }).map((_, index) => (
                      <Star key={`${item.author}-${index}`} size={13} className='fill-[color:var(--accent)] text-[color:var(--accent)]' />
                    ))}
                  </div>
                  <p className='mt-3 text-sm italic leading-6 text-[color:var(--text-primary)]'>"{item.quote}"</p>
                  <p className='mt-3 text-sm font-semibold text-[color:var(--text-primary)]'>{item.author}</p>
                  <p className='text-xs text-[color:var(--text-secondary)]'>{item.role}</p>
                </div>
              ))}
              {!guestTestimonials.length && (
                <div className='rounded-xl border border-[color:var(--border)] bg-[color:var(--surface-0)] p-4 text-sm text-[color:var(--text-secondary)]'>
                  No live review snippets available yet.
                </div>
              )}
            </div>
          </section>

          <section className='rounded-2xl border border-[color:var(--border)] bg-[color:var(--surface-0)] p-7'>
            <div className='mx-auto max-w-2xl text-center'>
              <p className='text-xs font-semibold uppercase tracking-[0.18em] text-[color:var(--accent)]'>Newsletter</p>
              <h2 className='mt-2 text-2xl font-semibold text-[color:var(--text-primary)]'>Get weekly editorial picks</h2>
              <p className='mt-2 text-sm text-[color:var(--text-secondary)]'>One email per week with our top stories and insights.</p>
              <form className='mt-5 flex flex-col gap-3 sm:flex-row' onSubmit={handleNewsletterSubscribe}>
                <input
                  type='email'
                  required
                  inputMode='email'
                  placeholder='you@company.com'
                  value={newsletterEmail}
                  onChange={(event) => setNewsletterEmail(event.target.value)}
                  className='h-11 flex-1 rounded-full border border-[color:var(--border)] bg-[color:var(--surface-1)] px-4 text-sm text-[color:var(--text-primary)] outline-none focus:border-[color:var(--accent)]'
                  aria-label='Email address for newsletter subscription'
                />
                <button
                  type='submit'
                  disabled={newsletterStatus === 'loading'}
                  className='h-11 rounded-full border border-[color:var(--accent)] bg-[color:var(--accent)] px-6 text-sm font-semibold text-white disabled:opacity-60'
                >
                  {newsletterStatus === 'loading' ? 'Subscribing...' : 'Subscribe'}
                </button>
              </form>
              {newsletterMessage && (
                <p className={`mt-3 text-sm ${newsletterStatus === 'success' ? 'text-[color:var(--accent)]' : 'text-red-500'}`}>
                  {newsletterMessage}
                </p>
              )}
            </div>
          </section>

          <section className='rounded-2xl border border-[color:var(--border)] p-8 text-center' style={{ background: 'linear-gradient(120deg, var(--surface-3) 0%, var(--surface-2) 54%, var(--surface-1) 100%)' }}>
            <h2 className='text-3xl font-semibold text-[color:var(--text-primary)]'>Ready to dive deeper?</h2>
            <p className='mx-auto mt-3 max-w-2xl text-sm leading-7 text-[color:var(--text-secondary)]'>
              Join membership to unlock premium stories, support quality writing, and access advanced writer tools.
            </p>
            <div className='mt-6 flex flex-wrap items-center justify-center gap-3'>
              <Link to='/membership' className='rounded-full border border-[color:var(--accent)] bg-[color:var(--accent)] px-6 py-2.5 text-sm font-semibold text-white'>
                View membership plans
              </Link>
              <Link to='/login' className='inline-flex items-center rounded-full border border-[color:var(--border-strong)] bg-[color:var(--surface-0)] px-6 py-2.5 text-sm font-semibold text-[color:var(--text-primary)] hover:bg-[color:var(--surface-2)]'>
                Join now <Users size={14} className='ml-2' />
              </Link>
            </div>
          </section>
        </div>
      </div>
    )
  }

  const featuredIds = new Set(featuredData?.map((article) => article.id) ?? [])
  const visibleArticles = tab === 'home'
    ? articles.filter((article) => !featuredIds.has(article.id))
    : articles

  return (
    <div className='space-y-8'>
      <section className='overflow-hidden rounded-[2rem] border border-[color:var(--border)] surface-warm'>
        <div className='mx-auto flex max-w-[1200px] flex-col items-start gap-4 px-6 py-14 md:py-18'>
          <h1 className='font-display text-5xl font-bold tracking-tight text-[color:var(--text-primary)] md:text-7xl'>
            Stay curious.
          </h1>
          <p className='max-w-2xl font-body text-lg leading-relaxed text-[color:var(--text-secondary)]'>
            Discover stories, product thinking, and expert insight from teams publishing through Zenos.
          </p>
          <div className='flex flex-wrap items-center gap-3'>
            <Link to='/explore' className='rounded-full bg-[color:var(--surface-ink)] px-6 py-2.5 text-sm font-semibold text-[color:var(--surface-ink-foreground)] transition-opacity hover:opacity-90'>
              Start reading
            </Link>
            <Link to='/write' className='rounded-full border border-[color:var(--border-strong)] px-6 py-2.5 text-sm font-semibold text-[color:var(--text-primary)] hover:bg-[color:var(--surface-5)]'>
              Write a story
            </Link>
          </div>
        </div>
      </section>

      <div className='border-b divider'>
        <div className='flex items-center gap-2 overflow-x-auto pb-3' role='tablist' aria-label='Feed tabs'>
          {TABS.map((item) => (
            <button
              key={item.id}
              onClick={() => setTab(item.id)}
              role='tab'
              aria-selected={tab === item.id}
              className={[
                'whitespace-nowrap rounded-full px-4 py-1.5 text-xs font-semibold transition-colors',
                tab === item.id
                  ? 'bg-[color:var(--surface-ink)] text-[color:var(--surface-ink-foreground)]'
                  : 'text-[color:var(--text-muted)] hover:bg-[color:var(--surface-1)] hover:text-[color:var(--text-primary)]',
              ].join(' ')}
            >
              {item.label}
            </button>
          ))}
          {feedLabel === 'personalised' && (
            <span className='ml-auto whitespace-nowrap rounded-full bg-[color:var(--accent-dim)] px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.14em] text-[color:var(--accent)]'>
              Personalised
            </span>
          )}
        </div>
      </div>

      <main className='grid gap-12 lg:grid-cols-[minmax(0,1fr)_320px]'>
        <div className='space-y-8'>
          {showFeatured && tab === 'home' && featuredData.length > 0 && (
            <section className='space-y-8'>
              {featuredData.slice(0, 1).map((article) => (
                <ArticleCard key={article.id} article={article} featured />
              ))}
              {featuredData.slice(1, 2).map((article) => (
                <ArticleHero key={article.id} article={article} />
              ))}
            </section>
          )}

          {tab === 'following' && !user ? (
            <div className='rounded-[1.5rem] border border-[color:var(--border)] bg-[color:var(--surface-5)] px-6 py-12 text-center shadow-[var(--shadow)]'>
              <p className='mb-3 text-[color:var(--text-secondary)]'>Sign in to view articles from authors you follow.</p>
              <Link
                to='/login'
                className='inline-flex items-center rounded-full bg-[color:var(--surface-ink)] px-5 py-2 text-sm font-semibold text-[color:var(--surface-ink-foreground)]'
              >
                Go to login
              </Link>
            </div>
          ) : isLoading ? (
            <div className='flex justify-center py-12'><Spinner /></div>
          ) : isError ? (
            <div className='rounded-[1.5rem] border border-red-500/30 bg-red-500/5 px-6 py-10 text-center text-red-500'>
              Failed to load feed{error instanceof Error ? `: ${error.message}` : '.'}
            </div>
          ) : visibleArticles.length === 0 ? (
            <div className='rounded-[1.5rem] border border-[color:var(--border)] bg-[color:var(--surface-5)] px-6 py-12 text-center text-[color:var(--text-muted)]'>
              {tab === 'following'
                ? 'Follow some authors to see their articles here.'
                : tab === 'trending'
                  ? 'No trending articles yet.'
                  : 'No articles yet.'
              }
            </div>
          ) : (
            <section className='space-y-8'>
              {visibleArticles.map((article) => <ArticleCard key={article.id} article={article} />)}
            </section>
          )}

          {hasNextPage && (
            <div className='flex justify-center pt-2' ref={loadMoreRef}>
              <button
                onClick={() => fetchNextPage()}
                disabled={isFetchingNextPage}
                className='rounded-full border border-[color:var(--border)] px-6 py-2.5 text-sm font-medium text-[color:var(--text-secondary)] transition-colors hover:bg-[color:var(--surface-1)] hover:text-[color:var(--text-primary)] disabled:opacity-50'
              >
                {isFetchingNextPage ? 'Loading...' : 'Load more'}
              </button>
            </div>
          )}
        </div>

        <div className='hidden lg:block'>
          <DiscoverySidebar />
        </div>
      </main>
    </div>
  )
}

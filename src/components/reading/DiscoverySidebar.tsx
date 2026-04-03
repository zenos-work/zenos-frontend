import { Link } from 'react-router-dom'
import { BarChart3, BookOpen, Clock, Flame, TrendingUp, Users } from 'lucide-react'
import { useFeed } from '../../hooks/useFeed'
import { useTags } from '../../hooks/useTags'
import { resolveAssetUrl } from '../../lib/assets'
import { useAuth } from '../../hooks/useAuth'

interface WriterToFollow {
  id: string
  name: string
  avatar_url?: string
  bio: string
}

export function DiscoverySidebar() {
  const { user } = useAuth()
  const trendingFeed = useFeed('trending', true)
  const homeFeed = useFeed('home', true)
  const trendingArticles = trendingFeed.data?.pages.flatMap((page) => page.articles ?? []).slice(0, 5) ?? []
  const homeArticles = homeFeed.data?.pages.flatMap((page) => page.articles ?? []).slice(0, 12) ?? []
  const { data: recommendedTopics, isLoading: loadingTopics } = useTags()
  const writerCandidates = [...trendingArticles, ...homeArticles]
  const writersToFollow: WriterToFollow[] = Array.from(
    new Map(
      writerCandidates
        .filter((article) => article.author_id && article.author_name)
        .map((article) => [
          article.author_id,
          {
            id: article.author_id,
            name: article.author_name ?? 'Unknown author',
            avatar_url: article.author_avatar,
            bio: article.subtitle ?? 'Writer on Zenos',
          },
        ]),
    ).values(),
  ).slice(0, 5)

  const weeklyActivity = (() => {
    const values = trendingArticles
      .slice(0, 7)
      .map((article) => Math.max(1, Math.round(article.views_count / 100)))
    if (!values.length) return [0, 0, 0, 0, 0, 0, 0]
    while (values.length < 7) values.push(0)
    return values
  })()

  const peakActivity = Math.max(1, ...weeklyActivity)
  const totalReads = trendingArticles.reduce((sum, article) => sum + article.views_count, 0)
  const totalMinutes = trendingArticles.reduce((sum, article) => sum + article.read_time_minutes, 0)
  const topTopic = (recommendedTopics ?? [])[0]?.name || 'General'
  const readingStreak = Math.min(30, Math.max(1, trendingArticles.length * 2))
  const showUnlockBanner = user?.role === 'AUTHOR'

  return (
    <aside className='sticky top-20 hidden space-y-8 lg:block lg:pl-6'>
      {showUnlockBanner && (
        <div className='rounded-xl border border-[color:var(--accent)]/35 bg-[color:var(--accent-dim)] p-5'>
          <p className='text-[11px] font-semibold uppercase tracking-[0.16em] text-[color:var(--accent)]'>Membership</p>
          <h3 className='mt-2 text-xl font-semibold text-[color:var(--text-primary)]'>Unlock all of Zenos</h3>
          <p className='mt-2 text-sm leading-6 text-[color:var(--text-secondary)]'>
            Read premium stories, access deeper analytics, and unlock writer growth tools.
          </p>
          <Link
            to='/membership'
            className='mt-4 inline-flex items-center rounded-full bg-[color:var(--surface-ink)] px-4 py-2 text-sm font-semibold text-[color:var(--surface-ink-foreground)] transition-opacity hover:opacity-90'
          >
            See plans
          </Link>
        </div>
      )}

      {/* Reading Stats */}
      <div className='rounded-xl border border-[color:var(--border)] bg-[color:var(--surface-0)] p-5'>
        <div className='flex items-center justify-between'>
          <h3 className='text-sm font-bold uppercase tracking-[0.12em] text-[color:var(--text-primary)]'>Your Reading</h3>
          <div className='flex items-center gap-1 text-xs font-semibold text-[color:var(--accent)]'>
            <Flame size={14} />
            {readingStreak}-day streak
          </div>
        </div>

        <div className='mt-4 grid grid-cols-3 gap-3'>
          <div className='text-center'>
            <div className='flex items-center justify-center text-[color:var(--text-muted)]'>
              <BookOpen size={14} />
            </div>
            <p className='mt-1 font-display text-xl font-bold text-[color:var(--text-primary)]'>{trendingArticles.length}</p>
            <p className='text-[10px] text-[color:var(--text-muted)]'>Articles</p>
          </div>
          <div className='text-center'>
            <div className='flex items-center justify-center text-[color:var(--text-muted)]'>
              <Clock size={14} />
            </div>
            <p className='mt-1 font-display text-xl font-bold text-[color:var(--text-primary)]'>{Math.max(1, Math.round(totalMinutes / 60))}h</p>
            <p className='text-[10px] text-[color:var(--text-muted)]'>Read time</p>
          </div>
          <div className='text-center'>
            <div className='flex items-center justify-center text-[color:var(--text-muted)]'>
              <BarChart3 size={14} />
            </div>
            <p className='mt-1 font-display text-xl font-bold text-[color:var(--text-primary)]'>{topTopic}</p>
            <p className='text-[10px] text-[color:var(--text-muted)]'>Top topic</p>
          </div>
        </div>

        <div className='mt-4'>
          <p className='mb-2 text-[10px] text-[color:var(--text-muted)]'>This week</p>
          <div className='flex h-8 items-end gap-1'>
            {weeklyActivity.map((value, index) => (
              <div key={index} className='flex-1 rounded-sm bg-[color:var(--accent)]/20' style={{ height: `${(value / peakActivity) * 100}%` }}>
                <div className='h-full w-full rounded-sm bg-[color:var(--accent)]' />
              </div>
            ))}
          </div>
          <div className='mt-1 flex justify-between text-[9px] text-[color:var(--text-muted)]'>
            {['M', 'T', 'W', 'T', 'F', 'S', 'S'].map((day, index) => (
              <span key={`${day}-${index}`} className='flex-1 text-center'>{day}</span>
            ))}
          </div>
          <p className='mt-2 text-[10px] text-[color:var(--text-muted)]'>
            {totalReads.toLocaleString()} total reads in your current discovery window
          </p>
        </div>
      </div>

      {/* Trending Articles */}
      <div>
        <div className='mb-4 flex items-center gap-2'>
          <TrendingUp size={16} className='text-[color:var(--accent)]' />
          <h3 className='text-sm font-bold uppercase tracking-[0.12em] text-[color:var(--text-primary)]'>Trending</h3>
        </div>
        <div className='space-y-3'>
          {trendingFeed.isLoading ? (
            <div className='space-y-2'>
              {[...Array(5)].map((_, i) => (
                <div key={i} className='h-12 w-full animate-pulse rounded bg-gray-200 dark:bg-gray-700' />
              ))}
            </div>
          ) : (
            trendingArticles.map((article) => (
              <Link
                key={article.id}
                to={`/article/${article.slug}`}
                className='group block'
              >
                <div className='flex gap-3'>
                  <span className='font-display text-2xl font-bold text-[color:var(--text-muted)]/45'>
                    {String(trendingArticles.indexOf(article) + 1).padStart(2, '0')}
                  </span>
                  <div>
                    <p className='text-xs font-medium text-[color:var(--text-primary)]'>{article.author_name}</p>
                    <p className='mt-0.5 line-clamp-2 font-display text-sm font-bold leading-snug text-[color:var(--text-primary)] transition-colors group-hover:text-[color:var(--accent)]'>
                      {article.title}
                    </p>
                    <p className='mt-1 text-xs text-[color:var(--text-muted)]'>
                      {article.views_count.toLocaleString()} views · {article.read_time_minutes} min read
                    </p>
                  </div>
                </div>
              </Link>
            ))
          )}
        </div>
      </div>

      {/* Recommended Topics */}
      <div>
        <h3 className='mb-3 text-sm font-bold uppercase tracking-[0.12em] text-[color:var(--text-primary)]'>Recommended Topics</h3>
        <div className='flex flex-wrap gap-2'>
          {loadingTopics ? (
            <div className='space-y-2 w-full'>
              {[...Array(3)].map((_, i) => (
                <div key={i} className='h-8 w-full animate-pulse rounded-full bg-gray-200 dark:bg-gray-700' />
              ))}
            </div>
          ) : (
            (recommendedTopics ?? []).slice(0, 6).map((topic) => (
              <Link
                key={topic.slug}
                to={`/tag/${topic.slug}`}
                className='tag-pill transition-colors hover:bg-[color:var(--accent)] hover:text-white'
              >
                {topic.name}
              </Link>
            ))
          )}
        </div>
      </div>

      {/* Writers to Follow */}
      <div>
        <div className='mb-4 flex items-center gap-2'>
          <Users size={16} className='text-[color:var(--accent)]' />
          <h3 className='text-sm font-bold uppercase tracking-[0.12em] text-[color:var(--text-primary)]'>Who to follow</h3>
        </div>
        <div className='space-y-3'>
          {trendingFeed.isLoading || homeFeed.isLoading ? (
            <div className='space-y-3'>
              {[...Array(5)].map((_, i) => (
                <div key={i} className='h-12 w-full animate-pulse rounded bg-gray-200 dark:bg-gray-700' />
              ))}
            </div>
          ) : !writersToFollow.length ? (
            <div className='rounded-lg border border-[color:var(--border)] bg-[color:var(--surface-1)] p-3 text-xs text-[color:var(--text-muted)]'>
              Writers will appear here as soon as your feed has author activity.
            </div>
          ) : (
            writersToFollow.map((writer: WriterToFollow) => (
              <Link
                key={writer.id}
                to={`/profile/${writer.id}`}
                className='group flex items-center gap-3'
              >
                <img
                  src={resolveAssetUrl(writer.avatar_url) || '/favicon.svg'}
                  alt={writer.name}
                  className='h-10 w-10 rounded-full object-cover'
                />
                <div className='flex-1'>
                  <p className='text-sm font-medium text-[color:var(--text-primary)] transition-colors group-hover:text-[color:var(--accent)]'>{writer.name}</p>
                  <p className='line-clamp-1 text-xs text-[color:var(--text-muted)]'>{writer.bio}</p>
                </div>
                <span className='rounded-full border border-[color:var(--text-primary)] px-3 py-1 text-xs font-medium text-[color:var(--text-primary)] transition-colors group-hover:bg-[color:var(--text-primary)] group-hover:text-[color:var(--surface-0)]'>
                  Follow
                </span>
              </Link>
            ))
          )}
        </div>
      </div>

      {/* Divider and footer links */}
      <div className='flex flex-wrap gap-x-3 gap-y-1 border-t border-[color:var(--border)] pt-4 text-xs text-[color:var(--text-muted)]'>
          <Link to='/explore' className='transition-colors hover:text-[color:var(--text-primary)]'>
            Explore all articles
          </Link>
          <Link to='/' className='transition-colors hover:text-[color:var(--text-primary)]'>
            Back to home
          </Link>
      </div>
    </aside>
  )
}

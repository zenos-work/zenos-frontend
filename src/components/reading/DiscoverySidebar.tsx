import { Link } from 'react-router-dom'
import { TrendingUp, Users } from 'lucide-react'
import { useFeed } from '../../hooks/useFeed'
import { useTags } from '../../hooks/useTags'
import { resolveAssetUrl } from '../../lib/assets'

interface WriterToFollow {
  id: string
  name: string
  avatar_url?: string
  bio: string
}

export function DiscoverySidebar() {
  const trendingFeed = useFeed('trending', true)
  const trendingArticles = trendingFeed.data?.pages.flatMap((page) => page.articles ?? []).slice(0, 5) ?? []
  const { data: recommendedTopics, isLoading: loadingTopics } = useTags()
  const writersToFollow: WriterToFollow[] = Array.from(
    new Map(
      trendingArticles
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

  return (
    <aside className='sticky top-20 hidden space-y-8 lg:block'>
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
          {trendingFeed.isLoading ? (
            <div className='space-y-3'>
              {[...Array(5)].map((_, i) => (
                <div key={i} className='h-12 w-full animate-pulse rounded bg-gray-200 dark:bg-gray-700' />
              ))}
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

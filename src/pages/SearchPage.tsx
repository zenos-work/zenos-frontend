import { useMemo } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import {
  useSearchAll,
  useSearchArticles,
  useSearchTags,
  useSearchAuthors,
  type SearchType,
} from '../hooks/useSearch'
import ArticleCard from '../components/article/ArticleCard'
import Spinner     from '../components/ui/Spinner'
import Avatar      from '../components/ui/Avatar'
import TagChip     from '../components/ui/TagChip'
import { Search, Users, Tags, FileText } from 'lucide-react'
import type { Tag, User, ArticleList } from '../types'

type SearchIcon = React.ComponentType<{ size?: number; className?: string }>

const SEARCH_TABS: { id: SearchType; label: string; icon: SearchIcon }[] = [
  { id: 'all', label: 'All', icon: Search },
  { id: 'articles', label: 'Articles', icon: FileText },
  { id: 'tags', label: 'Tags', icon: Tags },
  { id: 'authors', label: 'Authors', icon: Users },
]

export default function SearchPage() {
  const [params, setParams] = useSearchParams()
  const q = params.get('q') ?? ''
  const type = (params.get('type') as SearchType) || 'all'
  const page = Math.max(1, Number(params.get('page') || '1'))
  const status = (params.get('status') as 'PUBLISHED' | 'APPROVED' | 'SUBMITTED' | null) ?? 'PUBLISHED'
  const outcomeTag = params.get('outcome_tag') ?? ''
  const verifiedOnly = params.get('verified_only') === 'true'

  const searchFilters = {
    status,
    outcome_tag: outcomeTag || undefined,
    verified_only: verifiedOnly,
  }

  const searchAll = useSearchAll(q, searchFilters, type === 'all')
  const searchArticles = useSearchArticles(q, page, searchFilters, type === 'articles')
  const searchTags = useSearchTags(q, page, type === 'tags')
  const searchAuthors = useSearchAuthors(q, page, type === 'authors')

  const allResult = searchAll.data
  const articleResult = searchArticles.data
  const tagResult = searchTags.data
  const authorResult = searchAuthors.data
  const isLoading = searchAll.isLoading || searchArticles.isLoading || searchTags.isLoading || searchAuthors.isLoading

  const hasQuery = q.trim().length >= 2

  const totalForHeader = useMemo(() => {
    if (!hasQuery) return 0
    if (type === 'all') {
      return (
        (allResult?.articles?.total ?? 0)
        + (allResult?.tags?.total ?? 0)
        + (allResult?.authors?.total ?? 0)
      )
    }
    if (type === 'articles') return articleResult?.total ?? 0
    if (type === 'tags') return tagResult?.total ?? 0
    return authorResult?.total ?? 0
  }, [hasQuery, type, allResult, articleResult, tagResult, authorResult])

  const updateParams = (next: Partial<{ type: SearchType; page: number; status: 'PUBLISHED' | 'APPROVED' | 'SUBMITTED'; outcome_tag: string; verified_only: boolean }>) => {
    const updated = new URLSearchParams(params)
    if (next.type) updated.set('type', next.type)
    if (next.page) updated.set('page', String(next.page))
    if (next.status) updated.set('status', next.status)
    if (next.outcome_tag !== undefined) {
      if (next.outcome_tag) updated.set('outcome_tag', next.outcome_tag)
      else updated.delete('outcome_tag')
    }
    if (next.verified_only !== undefined) updated.set('verified_only', String(next.verified_only))
    setParams(updated)
  }

  return (
    <div className='space-y-6'>
      <div className='flex items-center gap-3'>
        <Search size={20} className='text-blue-400' />
        <h1 className='text-xl font-bold text-white'>
          {q ? `Results for "${q}"` : 'Search'}
        </h1>
        {!isLoading && q && (
          <span className='text-sm text-gray-500'>{totalForHeader} found</span>
        )}
      </div>

      {/* Type tabs */}
      <div className='flex gap-1 border-b border-gray-800 overflow-x-auto'>
        {SEARCH_TABS.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            onClick={() => updateParams({ type: id, page: 1 })}
            className={[
              'px-4 py-2.5 text-sm font-medium transition-colors border-b-2 -mb-px inline-flex items-center gap-1.5',
              type === id
                ? 'text-white border-blue-500'
                : 'text-gray-400 border-transparent hover:text-white',
            ].join(' ')}
          >
            <Icon size={14} />
            {label}
          </button>
        ))}
      </div>

      {(type === 'articles' || type === 'all') && (
        <div className='rounded-xl border border-[color:var(--border)] bg-[color:var(--surface-1)] p-3'>
          <div className='flex flex-wrap items-center gap-2'>
            <select
              value={status}
              onChange={(e) => updateParams({ status: e.target.value as 'PUBLISHED' | 'APPROVED' | 'SUBMITTED', page: 1 })}
              className='rounded-lg border border-[color:var(--border)] bg-[color:var(--surface-0)] px-3 py-1.5 text-sm text-[color:var(--text-primary)]'
            >
              <option value='PUBLISHED'>Published</option>
              <option value='APPROVED'>Approved</option>
              <option value='SUBMITTED'>Submitted</option>
            </select>
            <input
              value={outcomeTag}
              onChange={(e) => updateParams({ outcome_tag: e.target.value, page: 1 })}
              placeholder='Outcome tag slug (e.g. got-hired)'
              className='rounded-lg border border-[color:var(--border)] bg-[color:var(--surface-0)] px-3 py-1.5 text-sm text-[color:var(--text-primary)]'
            />
            <label className='inline-flex items-center gap-2 text-sm text-[color:var(--text-secondary)]'>
              <input
                type='checkbox'
                checked={verifiedOnly}
                onChange={(e) => updateParams({ verified_only: e.target.checked, page: 1 })}
              />
              Verified only
            </label>
          </div>
        </div>
      )}

      {!q.trim() ? (
        <p className='text-gray-500'>Enter a search term in the top bar.</p>
      ) : q.trim().length < 2 ? (
        <p className='text-gray-500'>Type at least 2 characters.</p>
      ) : isLoading ? (
        <div className='flex justify-center py-12'><Spinner /></div>
      ) : type === 'all' && !allResult ? (
        <div className='text-center py-16 text-gray-500'>
          <p>No results found for "{q}"</p>
        </div>
      ) : (
        <>
          {type === 'all' ? (
            <div className='space-y-8'>
              <section className='space-y-3'>
                <div className='flex items-center justify-between'>
                  <h2 className='text-sm font-semibold text-gray-300'>Articles</h2>
                  <button className='text-xs text-blue-400 hover:text-blue-300' onClick={() => updateParams({ type: 'articles', page: 1 })}>
                    View all
                  </button>
                </div>
                {(allResult?.articles?.items?.length ?? 0) === 0 ? (
                  <p className='text-sm text-gray-500'>No articles.</p>
                ) : (
                  <div className='space-y-3'>
                    {(allResult?.articles?.items ?? []).map((a: ArticleList) => (
                      <ArticleCard key={a.id} article={a} />
                    ))}
                  </div>
                )}
              </section>

              <section className='space-y-3'>
                <div className='flex items-center justify-between'>
                  <h2 className='text-sm font-semibold text-gray-300'>Tags</h2>
                  <button className='text-xs text-blue-400 hover:text-blue-300' onClick={() => updateParams({ type: 'tags', page: 1 })}>
                    View all
                  </button>
                </div>
                {(allResult?.tags?.items?.length ?? 0) === 0 ? (
                  <p className='text-sm text-gray-500'>No tags.</p>
                ) : (
                  <div className='flex flex-wrap gap-2'>
                    {(allResult?.tags?.items ?? []).map((t: Tag) => (
                      <TagChip key={t.id} tag={t} size='md' />
                    ))}
                  </div>
                )}
              </section>

              <section className='space-y-3'>
                <div className='flex items-center justify-between'>
                  <h2 className='text-sm font-semibold text-gray-300'>Authors</h2>
                  <button className='text-xs text-blue-400 hover:text-blue-300' onClick={() => updateParams({ type: 'authors', page: 1 })}>
                    View all
                  </button>
                </div>
                {(allResult?.authors?.items?.length ?? 0) === 0 ? (
                  <p className='text-sm text-gray-500'>No authors.</p>
                ) : (
                  <div className='grid grid-cols-1 sm:grid-cols-2 gap-3'>
                    {(allResult?.authors?.items ?? []).map((u: User) => (
                      <Link key={u.id} to={`/profile/${u.id}`} className='flex items-center gap-3 p-3 rounded-xl bg-gray-900 border border-gray-800 hover:border-gray-700 transition-colors'>
                        <Avatar name={u.name} src={u.avatar_url} size='md' />
                        <div className='min-w-0'>
                          <p className='text-sm font-medium text-white truncate'>{u.name}</p>
                          <p className='text-xs text-gray-500'>{u.role}</p>
                        </div>
                      </Link>
                    ))}
                  </div>
                )}
              </section>
            </div>
          ) : type === 'articles' ? (
            <div className='space-y-3'>
              {(articleResult?.items ?? []).length === 0 ? (
                <div className='text-center py-16 text-gray-500'>
                  <p>No articles found for "{q}"</p>
                </div>
              ) : (
                (articleResult?.items ?? []).map((a: ArticleList) => <ArticleCard key={a.id} article={a} />)
              )}
            </div>
          ) : type === 'tags' ? (
            <div className='space-y-3'>
              {(tagResult?.items ?? []).length === 0 ? (
                <div className='text-center py-16 text-gray-500'>
                  <p>No tags found for "{q}"</p>
                </div>
              ) : (
                <div className='flex flex-wrap gap-2'>
                  {(tagResult?.items ?? []).map((t: Tag) => (
                    <TagChip key={t.id} tag={t} size='md' />
                  ))}
                </div>
              )}
            </div>
          ) : (
            <div className='space-y-3'>
              {(authorResult?.items ?? []).length === 0 ? (
                <div className='text-center py-16 text-gray-500'>
                  <p>No authors found for "{q}"</p>
                </div>
              ) : (
                <div className='grid grid-cols-1 sm:grid-cols-2 gap-3'>
                  {(authorResult?.items ?? []).map((u: User) => (
                    <Link key={u.id} to={`/profile/${u.id}`} className='flex items-center gap-3 p-3 rounded-xl bg-gray-900 border border-gray-800 hover:border-gray-700 transition-colors'>
                      <Avatar name={u.name} src={u.avatar_url} size='md' />
                      <div className='min-w-0'>
                        <p className='text-sm font-medium text-white truncate'>{u.name}</p>
                        <p className='text-xs text-gray-500'>{u.role}</p>
                      </div>
                    </Link>
                  ))}
                </div>
              )}
            </div>
          )}

          {type !== 'all' && (
            <div className='flex items-center justify-between pt-2'>
              <p className='text-xs text-gray-600'>
                Page {type === 'articles'
                  ? (articleResult?.page ?? page)
                  : type === 'tags'
                    ? (tagResult?.page ?? page)
                    : (authorResult?.page ?? page)}
              </p>
              <div className='flex gap-2'>
                <button
                  disabled={(type === 'articles'
                    ? (articleResult?.page ?? page)
                    : type === 'tags'
                      ? (tagResult?.page ?? page)
                      : (authorResult?.page ?? page)) <= 1}
                  onClick={() => {
                    const current = type === 'articles'
                      ? (articleResult?.page ?? page)
                      : type === 'tags'
                        ? (tagResult?.page ?? page)
                        : (authorResult?.page ?? page)
                    updateParams({ page: Math.max(1, current - 1) })
                  }}
                  className='px-3 py-1.5 rounded-lg text-sm border border-gray-700 text-gray-300 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-gray-800 transition-colors'
                >
                  Previous
                </button>
                <button
                  disabled={!(type === 'articles'
                    ? articleResult?.has_more
                    : type === 'tags'
                      ? tagResult?.has_more
                      : authorResult?.has_more)}
                  onClick={() => {
                    const current = type === 'articles'
                      ? (articleResult?.page ?? page)
                      : type === 'tags'
                        ? (tagResult?.page ?? page)
                        : (authorResult?.page ?? page)
                    updateParams({ page: current + 1 })
                  }}
                  className='px-3 py-1.5 rounded-lg text-sm border border-gray-700 text-gray-300 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-gray-800 transition-colors'
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  )
}

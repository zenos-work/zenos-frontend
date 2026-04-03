import { useParams, Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { BookOpen, ArrowRight } from 'lucide-react'
import api from '../lib/api'
import Spinner from '../components/ui/Spinner'
import ArticleCard from '../components/article/ArticleCard'
import { resolveAssetUrl } from '../lib/assets'
import type { ArticleList } from '../types'
import type { Series } from '../hooks/useSeries'

interface SeriesWithArticles {
  series: Series
  articles: ArticleList[]
}

function useSeriesWithArticles(seriesId: string) {
  return useQuery({
    queryKey: ['series', seriesId, 'articles'],
    queryFn: async (): Promise<SeriesWithArticles | null> => {
      const res = await api.get<SeriesWithArticles>(`/api/series/${seriesId}/articles`)
      return res.data ?? null
    },
    enabled: !!seriesId,
    retry: 1,
  })
}

export default function SeriesPage() {
  const { id } = useParams<{ id: string }>()
  const { data, isLoading, isError } = useSeriesWithArticles(id ?? '')

  if (isLoading) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center">
        <Spinner size="lg" />
      </div>
    )
  }

  if (isError || !data) {
    return (
      <div className="flex min-h-[40vh] flex-col items-center justify-center gap-4 text-center">
        <p className="text-[color:var(--text-muted)]">Series not found.</p>
        <Link
          to="/explore"
          className="rounded-lg border border-[color:var(--border)] px-4 py-2 text-sm text-[color:var(--text-secondary)] hover:bg-[color:var(--surface-2)] transition-colors"
        >
          Explore articles
        </Link>
      </div>
    )
  }

  const { series, articles } = data

  return (
    <div className="mx-auto max-w-3xl space-y-8 py-4">
      {/* Series header */}
      <div className="rounded-xl border border-[color:var(--accent)]/20 bg-[color:var(--accent)]/5 p-6">
        {series.cover_image_url && (
          <img
            src={resolveAssetUrl(series.cover_image_url)}
            alt={series.name}
            className="mb-5 h-40 w-full rounded-lg object-cover"
            loading="lazy"
          />
        )}
        <div className="flex items-start gap-3">
          <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-[color:var(--accent)] text-[color:var(--surface-0)]">
            <BookOpen size={18} />
          </div>
          <div>
            <p className="mb-1 text-xs font-semibold uppercase tracking-wider text-[color:var(--accent)]">
              Series · {articles.length} {articles.length === 1 ? 'part' : 'parts'}
            </p>
            <h1 className="text-2xl font-bold text-[color:var(--text-primary)]">{series.name}</h1>
            {series.description && (
              <p className="mt-2 text-sm text-[color:var(--text-secondary)]">{series.description}</p>
            )}
          </div>
        </div>
      </div>

      {/* Progress bar strip */}
      {articles.length > 0 && (
        <div className="flex gap-1">
          {articles.map((_, i) => (
            <div
              key={i}
              className="h-1 flex-1 rounded-full bg-[color:var(--accent)]/30"
            />
          ))}
        </div>
      )}

      {/* Article list */}
      <div className="space-y-3">
        <h2 className="text-sm font-semibold uppercase tracking-wider text-[color:var(--text-muted)]">
          All parts
        </h2>
        {articles.length === 0 ? (
          <p className="py-8 text-center text-sm text-[color:var(--text-muted)]">
            No articles in this series yet.
          </p>
        ) : (
          articles.map((article, index) => (
            <div key={article.id} className="relative">
              <div className="absolute -left-1 top-4 flex h-5 w-5 items-center justify-center rounded-full bg-[color:var(--accent)] text-[10px] font-bold text-[color:var(--surface-0)]">
                {index + 1}
              </div>
              <div className="pl-7">
                <ArticleCard article={article} />
              </div>
            </div>
          ))
        )}
      </div>

      {/* Navigation footer */}
      <div className="flex items-center justify-between border-t border-[color:var(--border)] pt-4">
        <Link
          to="/explore"
          className="text-sm text-[color:var(--text-muted)] hover:text-[color:var(--text-primary)] transition-colors"
        >
          ← Back to explore
        </Link>
        {articles.length > 0 && (
          <Link
            to={`/article/${articles[0].slug}`}
            className="flex items-center gap-1.5 rounded-lg bg-[color:var(--accent)] px-4 py-2 text-sm font-semibold text-[color:var(--surface-0)] hover:opacity-90 transition-opacity"
          >
            Start reading <ArrowRight size={14} />
          </Link>
        )}
      </div>
    </div>
  )
}

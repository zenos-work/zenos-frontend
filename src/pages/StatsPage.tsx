import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { useMyArticles } from '../hooks/useArticles'
import {
  BarChart2,
  Eye,
  Heart,
  MessageCircle,
  Share2,
  FileText,
  Clock3,
  AlertCircle,
  CheckCircle2,
  PenSquare,
  ArrowUpRight,
  ArrowDownRight,
  Layers3,
  Tags,
  CalendarRange,
} from 'lucide-react'
import Spinner from '../components/ui/Spinner'
import Button from '../components/ui/Button'
import Badge from '../components/ui/Badge'

type DashboardTab = 'overview' | 'stories' | 'audience'
type DashboardRange = '30d' | '90d' | 'all'

type TrendPoint = {
  label: string
  published: number
  engagement: number
  views: number
}

function getArticleTimestamp(article: {
  published_at?: string
  updated_at?: string
  created_at: string
}): number {
  const candidate = article.published_at || article.updated_at || article.created_at
  const parsed = Date.parse(candidate)
  return Number.isNaN(parsed) ? 0 : parsed
}

function formatCompactNumber(value: number): string {
  return new Intl.NumberFormat('en-US', { notation: 'compact', maximumFractionDigits: 1 }).format(value)
}

function formatMonthLabel(timestamp: number): string {
  return new Date(timestamp).toLocaleDateString('en-US', { month: 'short', year: '2-digit' })
}

function engagementScore(article: {
  views_count: number
  likes_count: number
  shares_count?: number
  comments_count: number
  dislikes_count?: number
}): number {
  return Math.round(
    (article.views_count * 0.15)
    + (article.likes_count * 3)
    + ((article.shares_count ?? 0) * 5)
    + (article.comments_count * 4)
    - ((article.dislikes_count ?? 0) * 4),
  )
}

function percentageDelta(current: number, previous: number): number | null {
  if (previous <= 0) return current > 0 ? 100 : null
  return ((current - previous) / previous) * 100
}

function formatDelta(delta: number | null): { label: string; positive: boolean } {
  if (delta === null) return { label: 'No baseline', positive: true }
  const rounded = Math.abs(delta) >= 10 ? Math.round(delta) : Math.round(delta * 10) / 10
  return {
    label: `${delta >= 0 ? '+' : ''}${rounded}% vs prior period`,
    positive: delta >= 0,
  }
}

export default function StatsPage() {
  const [tab, setTab] = useState<DashboardTab>('overview')
  const [range, setRange] = useState<DashboardRange>('90d')
  const { data, isLoading } = useMyArticles()
  const articles = useMemo(() => data?.items ?? [], [data?.items])

  const draft = articles.filter(a => a.status === 'DRAFT')
  const submitted = articles.filter(a => a.status === 'SUBMITTED')
  const approved = articles.filter(a => a.status === 'APPROVED')
  const rejected = articles.filter(a => a.status === 'REJECTED')

  const rangeDays = range === '30d' ? 30 : range === '90d' ? 90 : null

  const published = useMemo(() => articles.filter(a => a.status === 'PUBLISHED'), [articles])
  const referenceTimestamp = useMemo(() => {
    if (!published.length) return 0
    return Math.max(...published.map((article) => getArticleTimestamp(article)))
  }, [published])
  const filteredPublished = useMemo(() => {
    if (!rangeDays) return published
    if (!referenceTimestamp) return []
    const cutoff = referenceTimestamp - (rangeDays * 24 * 60 * 60 * 1000)
    return published.filter((article) => getArticleTimestamp(article) >= cutoff)
  }, [published, rangeDays, referenceTimestamp])

  const previousPublished = useMemo(() => {
    if (!rangeDays) return []
    if (!referenceTimestamp) return []
    const currentCutoff = referenceTimestamp - (rangeDays * 24 * 60 * 60 * 1000)
    const previousCutoff = referenceTimestamp - (rangeDays * 2 * 24 * 60 * 60 * 1000)
    return published.filter((article) => {
      const ts = getArticleTimestamp(article)
      return ts >= previousCutoff && ts < currentCutoff
    })
  }, [published, rangeDays, referenceTimestamp])

  const totalViews = filteredPublished.reduce((sum, article) => sum + article.views_count, 0)
  const totalLikes = filteredPublished.reduce((sum, article) => sum + article.likes_count, 0)
  const totalComments = filteredPublished.reduce((sum, article) => sum + article.comments_count, 0)
  const totalShares = filteredPublished.reduce((sum, article) => sum + (article.shares_count ?? 0), 0)
  const totalEngagement = filteredPublished.reduce((sum, article) => sum + engagementScore(article), 0)
  const avgReadTime = filteredPublished.length
    ? Math.round(filteredPublished.reduce((sum, article) => sum + article.read_time_minutes, 0) / filteredPublished.length)
    : 0

  const previousViews = previousPublished.reduce((sum, article) => sum + article.views_count, 0)
  const previousEngagement = previousPublished.reduce((sum, article) => sum + engagementScore(article), 0)
  const previousPublishedCount = previousPublished.length

  const stats = [
    {
      icon: FileText,
      label: 'Published stories',
      value: filteredPublished.length.toLocaleString(),
      color: 'text-[color:#3f8dc3] dark:text-[#8acbf4]',
      delta: formatDelta(percentageDelta(filteredPublished.length, previousPublishedCount)),
    },
    {
      icon: Eye,
      label: 'Views',
      value: totalViews.toLocaleString(),
      color: 'text-[color:#2f6b46] dark:text-[#9bd3aa]',
      delta: formatDelta(percentageDelta(totalViews, previousViews)),
    },
    {
      icon: Share2,
      label: 'Engagement score',
      value: totalEngagement.toLocaleString(),
      color: 'text-[color:#0a66c2] dark:text-[#8ec4ff]',
      delta: formatDelta(percentageDelta(totalEngagement, previousEngagement)),
    },
    {
      icon: Clock3,
      label: 'Avg read time',
      value: `${avgReadTime} min`,
      color: 'text-[color:#147d86] dark:text-[#8adbe2]',
      delta: { label: `${filteredPublished.length ? Math.round(totalViews / filteredPublished.length) : 0} avg views/story`, positive: true },
    },
  ]

  const workflow = [
    {
      label: 'Draft',
      value: draft.length,
      style: 'border-[color:var(--border-strong)] bg-[color:var(--surface-0)] text-[color:var(--text-primary)]',
    },
    {
      label: 'Submitted',
      value: submitted.length,
      style: 'border-[color:rgba(166,124,60,0.32)] bg-[color:rgba(166,124,60,0.14)] text-[color:#8a5b18] dark:text-[#e7bd7a]',
    },
    {
      label: 'Approved',
      value: approved.length,
      style: 'border-[color:rgba(20,125,134,0.35)] bg-[color:rgba(20,125,134,0.14)] text-[color:#147d86] dark:text-[#8adbe2]',
    },
    {
      label: 'Rejected',
      value: rejected.length,
      style: 'border-[color:rgba(180,35,24,0.35)] bg-[color:rgba(180,35,24,0.12)] text-[color:#b42318] dark:text-[#ff9f94]',
    },
    {
      label: 'Published',
      value: published.length,
      style: 'border-[color:rgba(47,107,70,0.35)] bg-[color:rgba(47,107,70,0.13)] text-[color:#2f6b46] dark:text-[#9bd3aa]',
    },
  ]

  const needsAttention = [...rejected, ...draft].slice(0, 5)

  const trendPoints = useMemo<TrendPoint[]>(() => {
    const buckets = new Map<string, TrendPoint>()
    filteredPublished.forEach((article) => {
      const timestamp = getArticleTimestamp(article)
      const label = formatMonthLabel(timestamp)
      const current = buckets.get(label) ?? { label, published: 0, engagement: 0, views: 0 }
      current.published += 1
      current.engagement += engagementScore(article)
      current.views += article.views_count
      buckets.set(label, current)
    })
    return [...buckets.values()].sort((a, b) => Date.parse(`01 ${a.label}`) - Date.parse(`01 ${b.label}`)).slice(-6)
  }, [filteredPublished])

  const topStories = useMemo(() => {
    return [...filteredPublished]
      .sort((left, right) => engagementScore(right) - engagementScore(left))
      .slice(0, 8)
  }, [filteredPublished])

  const contentTypeMix = useMemo(() => {
    const map = new Map<string, { label: string; count: number; engagement: number }>()
    filteredPublished.forEach((article) => {
      const key = article.content_type || 'article'
      const current = map.get(key) ?? { label: key, count: 0, engagement: 0 }
      current.count += 1
      current.engagement += engagementScore(article)
      map.set(key, current)
    })
    return [...map.values()].sort((a, b) => b.engagement - a.engagement)
  }, [filteredPublished])

  const topTopics = useMemo(() => {
    const map = new Map<string, { label: string; count: number; views: number; engagement: number }>()
    filteredPublished.forEach((article) => {
      article.tags.forEach((tag) => {
        const key = tag.category_slug || tag.slug || tag.name
        const label = tag.category_slug || tag.name
        const current = map.get(key) ?? { label, count: 0, views: 0, engagement: 0 }
        current.count += 1
        current.views += article.views_count
        current.engagement += engagementScore(article)
        map.set(key, current)
      })
    })
    return [...map.values()].sort((a, b) => b.engagement - a.engagement).slice(0, 6)
  }, [filteredPublished])

  const publishMomentum = useMemo(() => {
    const buckets = trendPoints.length ? trendPoints : [{ label: 'Now', published: 0, engagement: 0, views: 0 }]
    return buckets.map((bucket) => ({
      ...bucket,
      density: bucket.published > 0 ? Math.round(bucket.engagement / bucket.published) : 0,
    }))
  }, [trendPoints])

  if (isLoading) return <div className='flex justify-center py-12'><Spinner /></div>

  return (
    <div className='space-y-8'>
      <div className='flex flex-wrap items-start justify-between gap-4'>
        <div className='space-y-2'>
          <div className='flex items-center gap-3'>
            <BarChart2 size={20} className='text-[color:var(--accent)]' />
            <h1 className='text-xl font-bold text-[color:var(--text-primary)]'>Author Dashboard</h1>
            <Badge variant='info'>Post-login only</Badge>
          </div>
          <p className='text-sm text-[color:var(--text-secondary)]'>Track publishing momentum, story performance, and what topics are earning the most reader attention.</p>
        </div>
        <div className='flex items-center gap-2 rounded-xl border border-[color:var(--border)] bg-[color:var(--surface-1)] p-1'>
          {([
            { id: '30d', label: '30 days' },
            { id: '90d', label: '90 days' },
            { id: 'all', label: 'All time' },
          ] as const).map((option) => (
            <button
              key={option.id}
              type='button'
              onClick={() => setRange(option.id)}
              className={[
                'rounded-lg px-3 py-2 text-sm transition-colors',
                range === option.id
                  ? 'bg-[color:var(--accent)] text-white'
                  : 'text-[color:var(--text-secondary)] hover:bg-[color:var(--surface-2)] hover:text-[color:var(--text-primary)]',
              ].join(' ')}
            >
              {option.label}
            </button>
          ))}
        </div>
      </div>

      <div className='grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4'>
        {stats.map(({ icon: Icon, label, value, color, delta }) => (
          <div key={label} className='rounded-xl border border-[color:var(--border)] bg-[color:var(--surface-1)] p-4 shadow-sm'>
            <div className='flex items-center justify-between gap-3'>
              <Icon size={18} className={color} />
              <span className={`inline-flex items-center gap-1 text-xs font-medium ${delta.positive ? 'text-[color:#2f6b46] dark:text-[#9bd3aa]' : 'text-[color:#b42318] dark:text-[#ff9f94]'}`}>
                {delta.positive ? <ArrowUpRight size={12} /> : <ArrowDownRight size={12} />}
                {delta.label}
              </span>
            </div>
            <p className='mt-3 text-3xl font-bold text-[color:var(--text-primary)]'>{value}</p>
            <p className='mt-1 text-xs uppercase tracking-[0.12em] text-[color:var(--text-muted)]'>{label}</p>
          </div>
        ))}
      </div>

      <div className='flex flex-wrap gap-2 border-b border-[color:var(--border)]'>
        {([
          { id: 'overview', label: 'Overview' },
          { id: 'stories', label: 'Stories' },
          { id: 'audience', label: 'Audience & format' },
        ] as const).map((item) => (
          <button
            key={item.id}
            type='button'
            onClick={() => setTab(item.id)}
            className={[
              'border-b-2 px-4 py-2.5 text-sm font-medium transition-colors -mb-px',
              tab === item.id
                ? 'border-[color:var(--accent)] text-[color:var(--text-primary)]'
                : 'border-transparent text-[color:var(--text-secondary)] hover:text-[color:var(--text-primary)]',
            ].join(' ')}
          >
            {item.label}
          </button>
        ))}
      </div>

      {tab === 'overview' && (
        <div className='space-y-6'>
          <div className='grid gap-6 xl:grid-cols-[minmax(0,1.45fr)_minmax(300px,1fr)]'>
            <section className='rounded-2xl border border-[color:var(--border)] bg-[color:var(--surface-1)] p-5 shadow-sm'>
              <div className='flex items-center justify-between gap-3'>
                <div>
                  <h2 className='text-sm font-semibold text-[color:var(--text-primary)]'>Publishing momentum</h2>
                  <p className='mt-1 text-xs text-[color:var(--text-secondary)]'>Recent publishing rhythm and engagement totals by month.</p>
                </div>
                <CalendarRange size={16} className='text-[color:var(--accent)]' />
              </div>
              {trendPoints.length === 0 ? (
                <p className='mt-6 text-sm text-[color:var(--text-secondary)]'>No published stories in the selected period yet.</p>
              ) : (
                <div className='mt-6 space-y-4'>
                  <SimpleTrendChart points={trendPoints} />
                  <div className='grid grid-cols-1 gap-3 sm:grid-cols-3'>
                    {publishMomentum.map((point) => (
                      <div key={point.label} className='rounded-xl border border-[color:var(--border)] bg-[color:var(--surface-0)] px-3 py-3'>
                        <p className='text-xs uppercase tracking-[0.12em] text-[color:var(--text-muted)]'>{point.label}</p>
                        <p className='mt-2 text-lg font-semibold text-[color:var(--text-primary)]'>{point.published} published</p>
                        <p className='text-xs text-[color:var(--text-secondary)]'>Density {formatCompactNumber(point.density)} engagement/story</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </section>

            <section className='space-y-4 rounded-2xl border border-[color:var(--border)] bg-[color:var(--surface-1)] p-5 shadow-sm'>
              <div className='flex items-center justify-between'>
                <div className='flex items-center gap-2'>
                  <CheckCircle2 size={16} className='text-[color:var(--accent)]' />
                  <h2 className='text-sm font-semibold text-[color:var(--text-primary)]'>Workflow health</h2>
                </div>
                <Link to='/library' className='text-xs font-medium text-[color:var(--accent)] hover:underline'>Open library</Link>
              </div>
              <div className='grid grid-cols-2 gap-3'>
                {workflow.map(item => (
                  <div key={item.label} className={`rounded-xl border px-3 py-3 ${item.style}`}>
                    <p className='text-xl font-bold'>{item.value}</p>
                    <p className='mt-1 text-xs opacity-90'>{item.label}</p>
                  </div>
                ))}
              </div>
              <div className='border-t border-[color:var(--border)] pt-4'>
                <div className='mb-3 flex items-center gap-2'>
                  <AlertCircle size={16} className='text-[color:var(--accent)]' />
                  <h3 className='text-sm font-semibold text-[color:var(--text-primary)]'>Needs attention</h3>
                </div>
                {!needsAttention.length ? (
                  <p className='text-sm text-[color:var(--text-secondary)]'>No pending draft or rejected article right now.</p>
                ) : (
                  <div className='space-y-2'>
                    {needsAttention.map(a => (
                      <div key={a.id} className='flex items-center gap-3 rounded-lg border border-[color:var(--border)] bg-[color:var(--surface-0)] px-3 py-2.5'>
                        <p className='flex-1 truncate text-sm text-[color:var(--text-primary)]'>{a.title}</p>
                        <span className='rounded-full border border-[color:var(--border-strong)] px-2 py-0.5 text-xs text-[color:var(--text-secondary)]'>
                          {a.status}
                        </span>
                        <Link to={`/write/${a.id}`} className='inline-flex items-center gap-1 text-xs font-medium text-[color:var(--accent)] hover:underline'>
                          <PenSquare size={12} /> Edit
                        </Link>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </section>
          </div>

          <div className='grid gap-4 md:grid-cols-4'>
            <MiniMetricCard icon={Heart} label='Likes' value={totalLikes.toLocaleString()} color='text-[color:#b42318] dark:text-[#ff9f94]' />
            <MiniMetricCard icon={Share2} label='Shares' value={totalShares.toLocaleString()} color='text-[color:#0a66c2] dark:text-[#8ec4ff]' />
            <MiniMetricCard icon={MessageCircle} label='Comments' value={totalComments.toLocaleString()} color='text-[color:#8a5b18] dark:text-[#e7bd7a]' />
            <MiniMetricCard icon={Layers3} label='Formats used' value={contentTypeMix.length.toLocaleString()} color='text-[color:#4f74d9] dark:text-[#9ab2ff]' />
          </div>
        </div>
      )}

      {tab === 'stories' && (
        <div className='space-y-6'>
          <section className='rounded-2xl border border-[color:var(--border)] bg-[color:var(--surface-1)] p-5 shadow-sm'>
            <div className='flex items-center justify-between gap-3'>
              <div>
                <h2 className='text-sm font-semibold text-[color:var(--text-primary)]'>Top performing stories</h2>
                <p className='mt-1 text-xs text-[color:var(--text-secondary)]'>Ranked by weighted engagement using views, likes, shares, comments, and dislikes.</p>
              </div>
              <Button size='sm' variant='secondary' onClick={() => setTab('audience')}>See audience insights</Button>
            </div>

            {topStories.length === 0 ? (
              <p className='mt-6 text-sm text-[color:var(--text-secondary)]'>No published stories in the selected period.</p>
            ) : (
              <div className='mt-4 space-y-2'>
                {topStories.map((article, index) => (
                  <div key={article.id} className='grid grid-cols-1 gap-3 rounded-xl border border-[color:var(--border)] bg-[color:var(--surface-0)] p-4 md:grid-cols-[44px_minmax(0,1fr)_100px_84px_84px_84px] md:items-center'>
                    <div className='text-2xl font-bold text-[color:var(--text-muted)]'>0{index + 1}</div>
                    <div className='min-w-0'>
                      <p className='truncate text-sm font-semibold text-[color:var(--text-primary)]'>{article.title}</p>
                      <div className='mt-1 flex flex-wrap gap-2 text-xs text-[color:var(--text-secondary)]'>
                        <span>{article.published_at ? new Date(article.published_at).toLocaleDateString('en-US') : 'Unpublished'}</span>
                        <span>•</span>
                        <span>{article.read_time_minutes} min read</span>
                        <span>•</span>
                        <span>{article.content_type}</span>
                      </div>
                    </div>
                    <MetricPill icon={Eye} value={article.views_count} />
                    <MetricPill icon={Heart} value={article.likes_count} />
                    <MetricPill icon={Share2} value={article.shares_count ?? 0} />
                    <div className='text-right'>
                      <p className='text-xs text-[color:var(--text-secondary)]'>Score</p>
                      <p className='text-sm font-semibold text-[color:var(--accent)]'>{engagementScore(article)}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>
        </div>
      )}

      {tab === 'audience' && (
        <div className='grid gap-6 xl:grid-cols-2'>
          <section className='rounded-2xl border border-[color:var(--border)] bg-[color:var(--surface-1)] p-5 shadow-sm'>
            <div className='flex items-center gap-2'>
              <Layers3 size={16} className='text-[color:var(--accent)]' />
              <h2 className='text-sm font-semibold text-[color:var(--text-primary)]'>Content type mix</h2>
            </div>
            {contentTypeMix.length === 0 ? (
              <p className='mt-6 text-sm text-[color:var(--text-secondary)]'>No content type data in the selected period.</p>
            ) : (
              <div className='mt-5 space-y-3'>
                {contentTypeMix.map((entry) => (
                  <DistributionRow
                    key={entry.label}
                    label={entry.label}
                    primaryValue={`${entry.count} stories`}
                    secondaryValue={`${entry.engagement} engagement`}
                    percent={entry.count / Math.max(1, filteredPublished.length)}
                  />
                ))}
              </div>
            )}
          </section>

          <section className='rounded-2xl border border-[color:var(--border)] bg-[color:var(--surface-1)] p-5 shadow-sm'>
            <div className='flex items-center gap-2'>
              <Tags size={16} className='text-[color:var(--accent)]' />
              <h2 className='text-sm font-semibold text-[color:var(--text-primary)]'>Top topics & categories</h2>
            </div>
            {topTopics.length === 0 ? (
              <p className='mt-6 text-sm text-[color:var(--text-secondary)]'>No topic data available yet.</p>
            ) : (
              <div className='mt-5 space-y-3'>
                {topTopics.map((entry) => (
                  <DistributionRow
                    key={entry.label}
                    label={entry.label}
                    primaryValue={`${entry.views.toLocaleString()} views`}
                    secondaryValue={`${entry.engagement} engagement`}
                    percent={entry.engagement / Math.max(1, topTopics[0]?.engagement ?? 1)}
                  />
                ))}
              </div>
            )}
          </section>
        </div>
      )}
    </div>
  )
}

function MiniMetricCard({
  icon: Icon,
  label,
  value,
  color,
}: {
  icon: typeof Eye
  label: string
  value: string
  color: string
}) {
  return (
    <div className='rounded-xl border border-[color:var(--border)] bg-[color:var(--surface-1)] p-4 shadow-sm'>
      <Icon size={16} className={color} />
      <p className='mt-2 text-xl font-semibold text-[color:var(--text-primary)]'>{value}</p>
      <p className='text-xs text-[color:var(--text-secondary)]'>{label}</p>
    </div>
  )
}

function SimpleTrendChart({ points }: { points: TrendPoint[] }) {
  const maxPublished = Math.max(1, ...points.map((point) => point.published))
  const maxEngagement = Math.max(1, ...points.map((point) => point.engagement))

  return (
    <div className='grid grid-cols-1 gap-4 md:grid-cols-2'>
      <div className='rounded-xl border border-[color:var(--border)] bg-[color:var(--surface-0)] p-4'>
        <p className='text-xs uppercase tracking-[0.12em] text-[color:var(--text-muted)]'>Published stories</p>
        <div className='mt-4 space-y-3'>
          {points.map((point) => (
            <BarMetric key={`published-${point.label}`} label={point.label} value={point.published} percent={point.published / maxPublished} />
          ))}
        </div>
      </div>
      <div className='rounded-xl border border-[color:var(--border)] bg-[color:var(--surface-0)] p-4'>
        <p className='text-xs uppercase tracking-[0.12em] text-[color:var(--text-muted)]'>Engagement score</p>
        <div className='mt-4 space-y-3'>
          {points.map((point) => (
            <BarMetric key={`engagement-${point.label}`} label={point.label} value={point.engagement} percent={point.engagement / maxEngagement} accent='from-[#0a66c2] via-[#2d8cff] to-[#7bc0ff]' />
          ))}
        </div>
      </div>
    </div>
  )
}

function BarMetric({
  label,
  value,
  percent,
  accent = 'from-orange-500 via-amber-400 to-yellow-300',
}: {
  label: string
  value: number
  percent: number
  accent?: string
}) {
  return (
    <div className='space-y-1.5'>
      <div className='flex items-center justify-between gap-3 text-xs'>
        <span className='truncate text-[color:var(--text-secondary)]'>{label}</span>
        <span className='font-medium text-[color:var(--text-primary)]'>{formatCompactNumber(value)}</span>
      </div>
      <div className='h-2 overflow-hidden rounded-full bg-[color:var(--surface-3)]'>
        <div className={`h-full rounded-full bg-gradient-to-r ${accent}`} style={{ width: `${Math.max(8, percent * 100)}%` }} />
      </div>
    </div>
  )
}

function DistributionRow({
  label,
  primaryValue,
  secondaryValue,
  percent,
}: {
  label: string
  primaryValue: string
  secondaryValue: string
  percent: number
}) {
  return (
    <div className='space-y-1.5'>
      <div className='flex items-center justify-between gap-3 text-sm'>
        <span className='truncate font-medium text-[color:var(--text-primary)]'>{label}</span>
        <span className='text-xs text-[color:var(--text-secondary)]'>{primaryValue}</span>
      </div>
      <div className='h-2 overflow-hidden rounded-full bg-[color:var(--surface-3)]'>
        <div className='h-full rounded-full bg-gradient-to-r from-[#3f8dc3] via-[#5da9dc] to-[#8acbf4]' style={{ width: `${Math.max(8, Math.min(100, percent * 100))}%` }} />
      </div>
      <p className='text-xs text-[color:var(--text-secondary)]'>{secondaryValue}</p>
    </div>
  )
}

function MetricPill({
  icon: Icon,
  value,
}: {
  icon: typeof Eye
  value: number
}) {
  return (
    <span className='inline-flex items-center justify-end gap-1 text-xs text-[color:var(--text-secondary)]'>
      <Icon size={11} /> {value.toLocaleString()}
    </span>
  )
}

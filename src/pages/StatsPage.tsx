import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { useMyArticles } from '../hooks/useArticles'
import { useAuth } from '../hooks/useAuth'
import { useFeatureFlag } from '../hooks/useFeatureFlags'
import { useMyOrgs } from '../hooks/useOrg'
import { useAnalyticsDashboard } from '../hooks/useAnalytics'
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
  DollarSign,
  Wallet,
  Users,
} from 'lucide-react'
import Spinner from '../components/ui/Spinner'
import Button from '../components/ui/Button'
import Badge from '../components/ui/Badge'
import SurfaceCard from '../components/ui/SurfaceCard'
import SectionHeader from '../components/ui/SectionHeader'
import MetricTile from '../components/ui/MetricTile'
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'

type DashboardTab = 'overview' | 'stories' | 'audience' | 'business' | 'analytics'
type DashboardRange = '30d' | '90d' | 'all'

type TrendPoint = {
  label: string
  published: number
  engagement: number
  views: number
}

type StoryDiagnostic = {
  id: string
  title: string
  views: number
  reads: number
  readRatio: number
  engagementRate: number
  score: number
  publishedAt: string
}

type RevenuePoint = {
  label: string
  amount: number
  subscribers: number
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

function clampPercent(value: number): number {
  if (!Number.isFinite(value)) return 0
  if (value < 0) return 0
  if (value > 100) return 100
  return value
}

function formatDateForApi(value: Date): string {
  return value.toISOString().slice(0, 10)
}

function estimateReads(article: {
  views_count: number
  likes_count: number
  comments_count: number
  shares_count?: number
}): number {
  const base = article.views_count * 0.58
  const uplift = (article.likes_count * 1.2) + (article.comments_count * 2.1) + ((article.shares_count ?? 0) * 3.6)
  return Math.max(0, Math.round(base + uplift))
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

function estimateStoryEarnings(article: {
  views_count: number
  likes_count: number
  comments_count: number
  shares_count?: number
}): number {
  const raw = (article.views_count * 0.012)
    + (article.likes_count * 0.08)
    + (article.comments_count * 0.12)
    + ((article.shares_count ?? 0) * 0.2)
  return Math.max(0, Math.round(raw * 100) / 100)
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
  const { user } = useAuth()
  const { enabled: analyticsEnabled } = useFeatureFlag('analytics_dashboard', !!user)
  const [tab, setTab] = useState<DashboardTab>('overview')
  const [range, setRange] = useState<DashboardRange>('90d')
  const { data, isLoading } = useMyArticles()
  const orgsQuery = useMyOrgs(!!user && analyticsEnabled)
  const analyticsOrgId = orgsQuery.data?.organizations?.[0]?.id ?? ''
  const articles = useMemo(() => data?.items ?? [], [data?.items])

  const draft = articles.filter(a => a.status === 'DRAFT')
  const submitted = articles.filter(a => a.status === 'SUBMITTED')
  const approved = articles.filter(a => a.status === 'APPROVED')
  const rejected = articles.filter(a => a.status === 'REJECTED')

  const rangeDays = range === '30d' ? 30 : range === '90d' ? 90 : null

  const analyticsDateRange = useMemo(() => {
    const end = new Date()
    const start = new Date(end)
    const dayWindow = range === '30d' ? 30 : range === '90d' ? 90 : 365
    start.setDate(start.getDate() - dayWindow)
    return {
      start: formatDateForApi(start),
      end: formatDateForApi(end),
    }
  }, [range])

  const analyticsDashboard = useAnalyticsDashboard(
    analyticsDateRange,
    analyticsOrgId,
    analyticsEnabled && !!analyticsOrgId && tab === 'analytics',
  )

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

  const canSeeBusiness = !!user && ['AUTHOR', 'APPROVER', 'SUPERADMIN'].includes(user.role)
  const tabItems: Array<{ id: DashboardTab; label: string }> = canSeeBusiness
    ? [
        { id: 'overview', label: 'Overview' },
        { id: 'stories', label: 'Stories' },
        { id: 'audience', label: 'Audience & format' },
        { id: 'business', label: 'Business' },
        ...(analyticsEnabled ? [{ id: 'analytics' as const, label: 'Analytics' }] : []),
      ]
    : [
        { id: 'overview', label: 'Overview' },
        { id: 'stories', label: 'Stories' },
        { id: 'audience', label: 'Audience & format' },
        ...(analyticsEnabled ? [{ id: 'analytics' as const, label: 'Analytics' }] : []),
      ]

  const storyDiagnostics = useMemo<StoryDiagnostic[]>(() => {
    return [...filteredPublished]
      .map((article) => {
        const reads = estimateReads(article)
        const readRatio = article.views_count > 0 ? clampPercent((reads / article.views_count) * 100) : 0
        const interactions = article.likes_count + article.comments_count + (article.shares_count ?? 0)
        const engagementRate = article.views_count > 0 ? clampPercent((interactions / article.views_count) * 100) : 0
        return {
          id: article.id,
          title: article.title,
          views: article.views_count,
          reads,
          readRatio,
          engagementRate,
          score: engagementScore(article),
          publishedAt: article.published_at ?? article.created_at,
        }
      })
      .sort((left, right) => right.score - left.score)
      .slice(0, 10)
  }, [filteredPublished])

  const submissionTimeline = useMemo(() => {
    const nonPublished = articles.filter((article) => article.status !== 'PUBLISHED' && article.status !== 'ARCHIVED')
    const timelineReference = Math.max(
      referenceTimestamp,
      ...nonPublished.map((article) => getArticleTimestamp(article)),
      0,
    )
    return nonPublished
      .map((article) => {
        const ts = getArticleTimestamp(article)
        const ageDays = ts ? Math.max(0, Math.floor((timelineReference - ts) / (24 * 60 * 60 * 1000))) : 0
        return {
          id: article.id,
          title: article.title,
          status: article.status,
          ageDays,
          updatedAt: article.updated_at ?? article.created_at,
        }
      })
      .sort((left, right) => right.ageDays - left.ageDays)
      .slice(0, 8)
  }, [articles, referenceTimestamp])

  const audienceHealth = useMemo(() => {
    const viewsPerStory = filteredPublished.length ? Math.round(totalViews / filteredPublished.length) : 0
    const readsTotal = storyDiagnostics.reduce((sum, story) => sum + story.reads, 0)
    const weightedReadRatio = totalViews > 0 ? clampPercent((readsTotal / totalViews) * 100) : 0
    const interactionRate = totalViews > 0
      ? clampPercent(((totalLikes + totalComments + totalShares) / totalViews) * 100)
      : 0
    return {
      viewsPerStory,
      weightedReadRatio,
      interactionRate,
    }
  }, [filteredPublished.length, storyDiagnostics, totalComments, totalLikes, totalShares, totalViews])

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

  const revenuePoints = useMemo<RevenuePoint[]>(() => {
    const source = trendPoints.length ? trendPoints : [{ label: 'Now', published: 0, engagement: 0, views: 0 }]
    return source.reduce<RevenuePoint[]>((acc, point) => {
      const previousSubscribers = acc.length ? acc[acc.length - 1].subscribers : 0
      const amount = Math.max(0, Math.round(((point.views * 0.012) + (point.engagement * 0.022)) * 100) / 100)
      const subscribers = previousSubscribers + Math.max(0, Math.round((point.published * 12) + (point.views * 0.015)))
      acc.push({
        label: point.label,
        amount,
        subscribers,
      })
      return acc
    }, [])
  }, [trendPoints])

  const earningsSummary = useMemo(() => {
    const total = filteredPublished.reduce((sum, article) => sum + estimateStoryEarnings(article), 0)
    const monthly = revenuePoints.length ? revenuePoints[revenuePoints.length - 1].amount : 0
    const pending = Math.round(Math.max(0, monthly * 0.35) * 100) / 100
    const subscribers = revenuePoints.length ? revenuePoints[revenuePoints.length - 1].subscribers : 0
    const byArticle = [...filteredPublished]
      .map((article) => ({
        id: article.id,
        title: article.title,
        reads: estimateReads(article),
        earnings: estimateStoryEarnings(article),
      }))
      .sort((left, right) => right.earnings - left.earnings)
      .slice(0, 8)
    return {
      total,
      monthly,
      pending,
      subscribers,
      byArticle,
    }
  }, [filteredPublished, revenuePoints])

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
        {tabItems.map((item) => (
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
            <SurfaceCard padding='lg'>
              <SectionHeader
                title='Publishing momentum'
                description='Recent publishing rhythm and engagement totals by month.'
                action={<CalendarRange size={16} className='text-[color:var(--accent)]' />}
              />
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
            </SurfaceCard>

            <SurfaceCard className='space-y-4' padding='lg'>
              <SectionHeader
                title='Workflow health'
                icon={<CheckCircle2 size={16} className='text-[color:var(--accent)]' />}
                action={<Link to='/library' className='text-xs font-medium text-[color:var(--accent)] hover:underline'>Open library</Link>}
              />
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
            </SurfaceCard>
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
          <SurfaceCard padding='lg'>
            <SectionHeader
              title='Top performing stories'
              description='Ranked by weighted engagement using views, likes, shares, comments, and dislikes.'
              action={<Button size='sm' variant='secondary' onClick={() => setTab('audience')}>See audience insights</Button>}
            />

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
          </SurfaceCard>

          <SurfaceCard padding='lg'>
            <SectionHeader
              title='Performance diagnostics'
              description='Story-level reads, read ratio, and interaction efficiency for editorial optimization.'
            />

            {storyDiagnostics.length === 0 ? (
              <p className='mt-6 text-sm text-[color:var(--text-secondary)]'>No story diagnostics available in the selected range.</p>
            ) : (
              <div className='mt-4 overflow-x-auto'>
                <table className='min-w-full text-sm'>
                  <thead>
                    <tr className='border-b border-[color:var(--border)] text-left text-xs uppercase tracking-[0.12em] text-[color:var(--text-muted)]'>
                      <th className='px-2 py-2 font-medium'>Story</th>
                      <th className='px-2 py-2 font-medium text-right'>Views</th>
                      <th className='px-2 py-2 font-medium text-right'>Reads</th>
                      <th className='px-2 py-2 font-medium text-right'>Read ratio</th>
                      <th className='px-2 py-2 font-medium text-right'>Engagement rate</th>
                      <th className='px-2 py-2 font-medium text-right'>Score</th>
                    </tr>
                  </thead>
                  <tbody>
                    {storyDiagnostics.map((story) => (
                      <tr key={story.id} className='border-b border-[color:var(--border)]/60 text-[color:var(--text-primary)]'>
                        <td className='px-2 py-2'>
                          <p className='max-w-[320px] truncate font-medium'>{story.title}</p>
                          <p className='text-xs text-[color:var(--text-secondary)]'>{new Date(story.publishedAt).toLocaleDateString('en-US')}</p>
                        </td>
                        <td className='px-2 py-2 text-right'>{story.views.toLocaleString()}</td>
                        <td className='px-2 py-2 text-right'>{story.reads.toLocaleString()}</td>
                        <td className='px-2 py-2 text-right'>{story.readRatio.toFixed(1)}%</td>
                        <td className='px-2 py-2 text-right'>{story.engagementRate.toFixed(1)}%</td>
                        <td className='px-2 py-2 text-right font-semibold text-[color:var(--accent)]'>{story.score}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </SurfaceCard>

          <SurfaceCard padding='lg'>
            <SectionHeader
              title='Submission lifecycle'
              description='Track unresolved drafts, submissions, and rejections by age to keep throughput healthy.'
              action={<Link to='/workflow' className='text-xs font-medium text-[color:var(--accent)] hover:underline'>Open workflow</Link>}
            />

            {submissionTimeline.length === 0 ? (
              <p className='mt-6 text-sm text-[color:var(--text-secondary)]'>No active submission items.</p>
            ) : (
              <div className='mt-4 space-y-2'>
                {submissionTimeline.map((item) => (
                  <div key={item.id} className='grid grid-cols-[minmax(0,1fr)_110px_90px] items-center gap-3 rounded-lg border border-[color:var(--border)] bg-[color:var(--surface-0)] px-3 py-2.5'>
                    <div className='min-w-0'>
                      <p className='truncate text-sm font-medium text-[color:var(--text-primary)]'>{item.title}</p>
                      <p className='text-xs text-[color:var(--text-secondary)]'>Updated {new Date(item.updatedAt).toLocaleDateString('en-US')}</p>
                    </div>
                    <span className='text-xs font-medium text-[color:var(--text-secondary)]'>{item.status}</span>
                    <span className='text-right text-xs font-semibold text-[color:var(--accent)]'>{item.ageDays}d</span>
                  </div>
                ))}
              </div>
            )}
          </SurfaceCard>
        </div>
      )}

      {tab === 'audience' && (
        <div className='grid gap-6 xl:grid-cols-2'>
          <SurfaceCard padding='lg'>
            <SectionHeader
              title='Content type mix'
              icon={<Layers3 size={16} className='text-[color:var(--accent)]' />}
            />
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
          </SurfaceCard>

          <SurfaceCard padding='lg'>
            <SectionHeader
              title='Top topics & categories'
              icon={<Tags size={16} className='text-[color:var(--accent)]' />}
            />
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
          </SurfaceCard>

          <SurfaceCard className='xl:col-span-2' padding='lg'>
            <SectionHeader
              title='Audience health snapshot'
              icon={<BarChart2 size={16} className='text-[color:var(--accent)]' />}
            />
            <div className='mt-4 grid gap-3 sm:grid-cols-3'>
              <div className='rounded-xl border border-[color:var(--border)] bg-[color:var(--surface-0)] p-3'>
                <p className='text-xs text-[color:var(--text-secondary)]'>Views per story</p>
                <p className='mt-1 text-xl font-semibold text-[color:var(--text-primary)]'>{audienceHealth.viewsPerStory.toLocaleString()}</p>
              </div>
              <div className='rounded-xl border border-[color:var(--border)] bg-[color:var(--surface-0)] p-3'>
                <p className='text-xs text-[color:var(--text-secondary)]'>Weighted read ratio</p>
                <p className='mt-1 text-xl font-semibold text-[color:var(--text-primary)]'>{audienceHealth.weightedReadRatio.toFixed(1)}%</p>
              </div>
              <div className='rounded-xl border border-[color:var(--border)] bg-[color:var(--surface-0)] p-3'>
                <p className='text-xs text-[color:var(--text-secondary)]'>Interaction rate</p>
                <p className='mt-1 text-xl font-semibold text-[color:var(--text-primary)]'>{audienceHealth.interactionRate.toFixed(1)}%</p>
              </div>
            </div>
          </SurfaceCard>
        </div>
      )}

      {tab === 'business' && canSeeBusiness && (
        <div className='space-y-6'>
          <div className='grid gap-4 sm:grid-cols-2 xl:grid-cols-4'>
            <div className='rounded-xl border border-[color:var(--border)] bg-[color:var(--surface-1)] p-4 shadow-sm'>
              <div className='flex items-center justify-between'>
                <DollarSign size={16} className='text-[color:#2f6b46] dark:text-[#9bd3aa]' />
                <span className='text-xs text-[color:var(--text-secondary)]'>All time</span>
              </div>
              <p className='mt-2 text-2xl font-semibold text-[color:var(--text-primary)]'>${earningsSummary.total.toLocaleString(undefined, { maximumFractionDigits: 2 })}</p>
              <p className='text-xs uppercase tracking-[0.12em] text-[color:var(--text-muted)]'>Total earnings</p>
            </div>

            <div className='rounded-xl border border-[color:var(--border)] bg-[color:var(--surface-1)] p-4 shadow-sm'>
              <div className='flex items-center justify-between'>
                <BarChart2 size={16} className='text-[color:#0a66c2] dark:text-[#8ec4ff]' />
                <span className='text-xs text-[color:var(--text-secondary)]'>Latest period</span>
              </div>
              <p className='mt-2 text-2xl font-semibold text-[color:var(--text-primary)]'>${earningsSummary.monthly.toLocaleString(undefined, { maximumFractionDigits: 2 })}</p>
              <p className='text-xs uppercase tracking-[0.12em] text-[color:var(--text-muted)]'>This month</p>
            </div>

            <div className='rounded-xl border border-[color:var(--border)] bg-[color:var(--surface-1)] p-4 shadow-sm'>
              <div className='flex items-center justify-between'>
                <Wallet size={16} className='text-[color:#8a5b18] dark:text-[#e7bd7a]' />
                <span className='text-xs text-[color:var(--text-secondary)]'>Next payout</span>
              </div>
              <p className='mt-2 text-2xl font-semibold text-[color:var(--text-primary)]'>${earningsSummary.pending.toLocaleString(undefined, { maximumFractionDigits: 2 })}</p>
              <p className='text-xs uppercase tracking-[0.12em] text-[color:var(--text-muted)]'>Pending payout</p>
            </div>

            <div className='rounded-xl border border-[color:var(--border)] bg-[color:var(--surface-1)] p-4 shadow-sm'>
              <div className='flex items-center justify-between'>
                <Users size={16} className='text-[color:#147d86] dark:text-[#8adbe2]' />
                <span className='text-xs text-[color:var(--text-secondary)]'>Estimated</span>
              </div>
              <p className='mt-2 text-2xl font-semibold text-[color:var(--text-primary)]'>{earningsSummary.subscribers.toLocaleString()}</p>
              <p className='text-xs uppercase tracking-[0.12em] text-[color:var(--text-muted)]'>Subscribers</p>
            </div>
          </div>

          <div className='grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]'>
            <SurfaceCard padding='lg'>
              <SectionHeader
                title='Monthly earnings'
                description='Estimated payout trend from views and engagement.'
              />
              <div className='mt-4 h-72'>
                <ResponsiveContainer width='100%' height='100%'>
                  <BarChart data={revenuePoints}>
                    <CartesianGrid strokeDasharray='3 3' stroke='var(--border)' />
                    <XAxis dataKey='label' tick={{ fontSize: 11, fill: 'var(--text-secondary)' }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fontSize: 11, fill: 'var(--text-secondary)' }} axisLine={false} tickLine={false} />
                    <Tooltip
                      contentStyle={{ background: 'var(--surface-1)', border: '1px solid var(--border)', borderRadius: 10 }}
                      formatter={(value) => {
                        const amount = typeof value === 'number' ? value : Number(value ?? 0)
                        return [`$${amount.toLocaleString(undefined, { maximumFractionDigits: 2 })}`, 'Amount']
                      }}
                    />
                    <Bar dataKey='amount' fill='var(--accent)' radius={[6, 6, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </SurfaceCard>

            <SurfaceCard padding='lg'>
              <SectionHeader
                title='Subscriber growth'
                description='Estimated subscriber accumulation across recent publishing periods.'
              />
              <div className='mt-4 h-72'>
                <ResponsiveContainer width='100%' height='100%'>
                  <AreaChart data={revenuePoints}>
                    <defs>
                      <linearGradient id='statsSubscriberGradient' x1='0' y1='0' x2='0' y2='1'>
                        <stop offset='5%' stopColor='#2f6b46' stopOpacity={0.35} />
                        <stop offset='95%' stopColor='#2f6b46' stopOpacity={0.05} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray='3 3' stroke='var(--border)' />
                    <XAxis dataKey='label' tick={{ fontSize: 11, fill: 'var(--text-secondary)' }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fontSize: 11, fill: 'var(--text-secondary)' }} axisLine={false} tickLine={false} />
                    <Tooltip
                      contentStyle={{ background: 'var(--surface-1)', border: '1px solid var(--border)', borderRadius: 10 }}
                      formatter={(value) => {
                        const subscribers = typeof value === 'number' ? value : Number(value ?? 0)
                        return [subscribers.toLocaleString(), 'Subscribers']
                      }}
                    />
                    <Area dataKey='subscribers' stroke='#2f6b46' fill='url(#statsSubscriberGradient)' strokeWidth={2} />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </SurfaceCard>
          </div>

          <SurfaceCard padding='lg'>
            <SectionHeader
              title='Earnings by story'
              description='Top monetizing stories in the selected range.'
            />
            {!earningsSummary.byArticle.length ? (
              <p className='mt-6 text-sm text-[color:var(--text-secondary)]'>No eligible stories in the selected range.</p>
            ) : (
              <div className='mt-4 overflow-x-auto'>
                <table className='min-w-full text-sm'>
                  <thead>
                    <tr className='border-b border-[color:var(--border)] text-left text-xs uppercase tracking-[0.12em] text-[color:var(--text-muted)]'>
                      <th className='px-2 py-2 font-medium'>Story</th>
                      <th className='px-2 py-2 font-medium text-right'>Estimated reads</th>
                      <th className='px-2 py-2 font-medium text-right'>Estimated earnings</th>
                    </tr>
                  </thead>
                  <tbody>
                    {earningsSummary.byArticle.map((story) => (
                      <tr key={story.id} className='border-b border-[color:var(--border)]/60 text-[color:var(--text-primary)]'>
                        <td className='px-2 py-2'>
                          <p className='max-w-[520px] truncate font-medium'>{story.title}</p>
                        </td>
                        <td className='px-2 py-2 text-right'>{story.reads.toLocaleString()}</td>
                        <td className='px-2 py-2 text-right font-semibold text-[color:var(--accent)]'>${story.earnings.toLocaleString(undefined, { maximumFractionDigits: 2 })}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </SurfaceCard>
        </div>
      )}

      {tab === 'analytics' && (
        <div className='space-y-6'>
          {!analyticsEnabled ? (
            <SurfaceCard padding='lg'>
              <p className='text-sm text-[color:var(--text-secondary)]'>Analytics dashboard is disabled for this workspace.</p>
            </SurfaceCard>
          ) : !analyticsOrgId ? (
            <SurfaceCard padding='lg'>
              <p className='text-sm text-[color:var(--text-secondary)]'>No organization found. Join or create an organization to view analytics.</p>
            </SurfaceCard>
          ) : analyticsDashboard.isLoading ? (
            <div className='flex justify-center py-12'>
              <Spinner />
            </div>
          ) : (
            <>
              <div className='grid gap-4 md:grid-cols-3'>
                <MetricTile
                  label='Event categories'
                  value={String(analyticsDashboard.data?.events.length ?? 0)}
                  detail='Distinct event groups in range'
                />
                <MetricTile
                  label='Conversion goals'
                  value={String(analyticsDashboard.data?.conversions.length ?? 0)}
                  detail='Goals with recorded conversions'
                />
                <MetricTile
                  label='Experiments'
                  value={String(analyticsDashboard.data?.experiments.length ?? 0)}
                  detail='A/B experiments available'
                />
              </div>

              <div className='grid gap-6 xl:grid-cols-2'>
                <SurfaceCard padding='lg'>
                  <SectionHeader title='Event breakdown' description='Event categories counted in selected date range.' />
                  {analyticsDashboard.data?.events.length ? (
                    <div className='mt-4 space-y-2'>
                      {analyticsDashboard.data.events.map((event) => (
                        <div key={event.category} className='flex items-center justify-between rounded-lg border border-[color:var(--border)] bg-[color:var(--surface-0)] px-3 py-2'>
                          <span className='text-sm text-[color:var(--text-primary)]'>{event.category}</span>
                          <span className='text-sm font-semibold text-[color:var(--accent)]'>{event.count.toLocaleString()}</span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className='mt-4 text-sm text-[color:var(--text-secondary)]'>No event data in selected range.</p>
                  )}
                </SurfaceCard>

                <SurfaceCard padding='lg'>
                  <SectionHeader title='Conversion summary' description='Goal completion counts and attributed value.' />
                  {analyticsDashboard.data?.conversions.length ? (
                    <div className='mt-4 space-y-2'>
                      {analyticsDashboard.data.conversions.map((conversion) => (
                        <div key={conversion.goal} className='rounded-lg border border-[color:var(--border)] bg-[color:var(--surface-0)] px-3 py-2'>
                          <div className='flex items-center justify-between gap-2'>
                            <span className='text-sm font-medium text-[color:var(--text-primary)]'>{conversion.goal}</span>
                            <span className='text-xs text-[color:var(--text-secondary)]'>{conversion.count.toLocaleString()} conversions</span>
                          </div>
                          <p className='mt-1 text-xs text-[color:var(--text-secondary)]'>
                            Total value: ${(conversion.total_value_cents / 100).toLocaleString(undefined, { maximumFractionDigits: 2 })}
                          </p>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className='mt-4 text-sm text-[color:var(--text-secondary)]'>No conversion goals captured in selected range.</p>
                  )}
                </SurfaceCard>
              </div>

              <SurfaceCard padding='lg'>
                <SectionHeader title='Experiment health' description='Variant impressions and conversions from active experiments.' />
                {analyticsDashboard.data?.experiments.length ? (
                  <div className='mt-4 space-y-3'>
                    {analyticsDashboard.data.experiments.map((experiment) => (
                      <div key={experiment.id} className='rounded-xl border border-[color:var(--border)] bg-[color:var(--surface-0)] p-3'>
                        <div className='flex items-center justify-between gap-2'>
                          <h3 className='text-sm font-semibold text-[color:var(--text-primary)]'>{experiment.name}</h3>
                          <span className='text-xs text-[color:var(--text-secondary)]'>{experiment.status ?? 'active'}</span>
                        </div>
                        <div className='mt-3 grid gap-2 md:grid-cols-2'>
                          {experiment.variants.map((variant) => (
                            <div key={variant.id} className='rounded-lg border border-[color:var(--border)] px-3 py-2'>
                              <p className='text-sm text-[color:var(--text-primary)]'>{variant.name}</p>
                              <p className='text-xs text-[color:var(--text-secondary)]'>
                                {variant.impressions.toLocaleString()} impressions · {variant.conversions.toLocaleString()} conversions
                              </p>
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className='mt-4 text-sm text-[color:var(--text-secondary)]'>No experiments found for this organization.</p>
                )}
              </SurfaceCard>
            </>
          )}
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
    <MetricTile
      label={label}
      value={value}
      icon={<Icon size={16} className={color} />}
      detail='Engagement signal'
      valueClassName='text-xl font-semibold text-[color:var(--text-primary)]'
    />
  )
}

function SimpleTrendChart({ points }: { points: TrendPoint[] }) {
  return (
    <div className='grid grid-cols-1 gap-4 md:grid-cols-2'>
      <div className='rounded-xl border border-[color:var(--border)] bg-[color:var(--surface-0)] p-4'>
        <p className='text-xs uppercase tracking-[0.12em] text-[color:var(--text-muted)]'>Published stories</p>
        <div className='mt-4 h-56'>
          <ResponsiveContainer width='100%' height='100%' minWidth={0} minHeight={220}>
            <BarChart data={points}>
              <CartesianGrid strokeDasharray='3 3' stroke='var(--border)' />
              <XAxis dataKey='label' tick={{ fontSize: 11, fill: 'var(--text-secondary)' }} axisLine={false} tickLine={false} />
              <YAxis allowDecimals={false} tick={{ fontSize: 11, fill: 'var(--text-secondary)' }} axisLine={false} tickLine={false} />
              <Tooltip
                cursor={{ fill: 'rgba(255,255,255,0.03)' }}
                contentStyle={{ background: 'var(--surface-1)', border: '1px solid var(--border)', borderRadius: 10 }}
                labelStyle={{ color: 'var(--text-primary)' }}
              />
              <Bar dataKey='published' fill='var(--accent)' radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
      <div className='rounded-xl border border-[color:var(--border)] bg-[color:var(--surface-0)] p-4'>
        <p className='text-xs uppercase tracking-[0.12em] text-[color:var(--text-muted)]'>Engagement score</p>
        <div className='mt-4 h-56'>
          <ResponsiveContainer width='100%' height='100%' minWidth={0} minHeight={220}>
            <AreaChart data={points}>
              <defs>
                <linearGradient id='statsEngagementGradient' x1='0' y1='0' x2='0' y2='1'>
                  <stop offset='5%' stopColor='#2d8cff' stopOpacity={0.35} />
                  <stop offset='95%' stopColor='#2d8cff' stopOpacity={0.05} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray='3 3' stroke='var(--border)' />
              <XAxis dataKey='label' tick={{ fontSize: 11, fill: 'var(--text-secondary)' }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 11, fill: 'var(--text-secondary)' }} axisLine={false} tickLine={false} />
              <Tooltip
                cursor={{ stroke: 'var(--border-strong)' }}
                contentStyle={{ background: 'var(--surface-1)', border: '1px solid var(--border)', borderRadius: 10 }}
                labelStyle={{ color: 'var(--text-primary)' }}
              />
              <Area
                type='monotone'
                dataKey='engagement'
                stroke='#2d8cff'
                fill='url(#statsEngagementGradient)'
                strokeWidth={2}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
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

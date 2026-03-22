import { Link } from 'react-router-dom'
import { useMyArticles } from '../hooks/useArticles'
import {
  BarChart2,
  Eye,
  Heart,
  MessageCircle,
  FileText,
  Clock3,
  AlertCircle,
  CheckCircle2,
  PenSquare,
} from 'lucide-react'
import Spinner from '../components/ui/Spinner'

export default function StatsPage() {
  const { data, isLoading } = useMyArticles()
  const articles = data?.items ?? []

  const published = articles.filter(a => a.status === 'PUBLISHED')
  const draft = articles.filter(a => a.status === 'DRAFT')
  const submitted = articles.filter(a => a.status === 'SUBMITTED')
  const approved = articles.filter(a => a.status === 'APPROVED')
  const rejected = articles.filter(a => a.status === 'REJECTED')
  const totalViews = published.reduce((s, a) => s + a.views_count, 0)
  const totalLikes = published.reduce((s, a) => s + a.likes_count, 0)
  const totalComments = published.reduce((s, a) => s + a.comments_count, 0)
  const avgReadTime = published.length
    ? Math.round(published.reduce((s, a) => s + a.read_time_minutes, 0) / published.length)
    : 0

  const stats = [
    { icon: FileText,      label: 'Total articles', value: articles.length,                     color: 'text-[color:#4f74d9] dark:text-[#9ab2ff]' },
    { icon: FileText,      label: 'Published',      value: published.length,                    color: 'text-[color:#3f8dc3] dark:text-[#8acbf4]' },
    { icon: Eye,           label: 'Total views',    value: totalViews.toLocaleString(),         color: 'text-[color:#2f6b46] dark:text-[#9bd3aa]' },
    { icon: Heart,         label: 'Total likes',    value: totalLikes.toLocaleString(),         color: 'text-[color:#b42318] dark:text-[#ff9f94]' },
    { icon: MessageCircle, label: 'Comments',       value: totalComments.toLocaleString(),      color: 'text-[color:#8a5b18] dark:text-[#e7bd7a]' },
    { icon: Clock3,        label: 'Avg read time',  value: `${avgReadTime} min`,                color: 'text-[color:#147d86] dark:text-[#8adbe2]' },
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

  if (isLoading) return <div className='flex justify-center py-12'><Spinner /></div>

  return (
    <div className='space-y-8'>
      <div className='flex items-center gap-3'>
        <BarChart2 size={20} className='text-[color:var(--accent)]' />
        <h1 className='text-xl font-bold text-[color:var(--text-primary)]'>Author Dashboard</h1>
      </div>

      {/* Summary cards */}
      <div className='grid grid-cols-2 xl:grid-cols-6 gap-4'>
        {stats.map(({ icon: Icon, label, value, color }) => (
          <div key={label} className='rounded-xl border border-[color:var(--border)] bg-[color:var(--surface-1)] p-4 shadow-sm'>
            <Icon size={18} className={`${color} mb-2`} />
            <p className='text-2xl font-bold text-[color:var(--text-primary)]'>{value}</p>
            <p className='mt-1 text-xs text-[color:var(--text-muted)]'>{label}</p>
          </div>
        ))}
      </div>

      {/* Submission pipeline */}
      <div className='space-y-4 rounded-2xl border border-[color:var(--border)] bg-[color:var(--surface-1)] p-5 shadow-sm'>
        <div className='flex items-center gap-2'>
          <CheckCircle2 size={16} className='text-[color:var(--accent)]' />
          <h2 className='text-sm font-semibold text-[color:var(--text-primary)]'>Submission status tracking</h2>
        </div>
        <div className='grid grid-cols-2 md:grid-cols-5 gap-3'>
          {workflow.map(item => (
            <div key={item.label} className={`rounded-xl border px-3 py-3 ${item.style}`}>
              <p className='text-xl font-bold'>{item.value}</p>
              <p className='mt-1 text-xs opacity-90'>{item.label}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Needs attention */}
      <div className='rounded-2xl border border-[color:var(--border)] bg-[color:var(--surface-1)] p-5 shadow-sm'>
        <div className='flex items-center justify-between mb-4'>
          <div className='flex items-center gap-2'>
            <AlertCircle size={16} className='text-[color:var(--accent)]' />
            <h2 className='text-sm font-semibold text-[color:var(--text-primary)]'>Needs attention</h2>
          </div>
          <Link to='/library' className='text-xs font-medium text-[color:var(--accent)] hover:underline'>Open library</Link>
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

      {/* Per-article breakdown */}
      {published.length > 0 && (
        <div>
          <h2 className='mb-4 text-sm font-semibold text-[color:var(--text-secondary)]'>Top performing published articles</h2>
          <div className='space-y-2'>
            {published
              .sort((a, b) => b.views_count - a.views_count)
              .slice(0, 10)
              .map(a => (
                <div key={a.id} className='flex items-center gap-4 rounded-lg border border-[color:var(--border)] bg-[color:var(--surface-1)] p-3'>
                  <p className='flex-1 truncate text-sm text-[color:var(--text-primary)]'>{a.title}</p>
                  <span className='flex items-center gap-1 text-xs text-[color:var(--text-muted)]'>
                    <Eye size={11} /> {a.views_count}
                  </span>
                  <span className='flex items-center gap-1 text-xs text-[color:var(--text-muted)]'>
                    <Heart size={11} /> {a.likes_count}
                  </span>
                  <span className='flex items-center gap-1 text-xs text-[color:var(--text-muted)]'>
                    <MessageCircle size={11} /> {a.comments_count}
                  </span>
                </div>
              ))
            }
          </div>
        </div>
      )}
    </div>
  )
}

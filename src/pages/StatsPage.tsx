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
    { icon: FileText,      label: 'Total articles', value: articles.length,                  color: 'text-indigo-400' },
    { icon: FileText,      label: 'Published',   value: published.length,             color: 'text-blue-400' },
    { icon: Eye,           label: 'Total views',  value: totalViews.toLocaleString(),  color: 'text-green-400' },
    { icon: Heart,         label: 'Total likes',  value: totalLikes.toLocaleString(),  color: 'text-red-400' },
    { icon: MessageCircle, label: 'Comments',     value: totalComments.toLocaleString(),color: 'text-yellow-400' },
    { icon: Clock3,        label: 'Avg read time', value: `${avgReadTime} min`,            color: 'text-cyan-400' },
  ]

  const workflow = [
    { label: 'Draft', value: draft.length, style: 'text-gray-300 bg-gray-900 border-gray-700' },
    { label: 'Submitted', value: submitted.length, style: 'text-amber-300 bg-amber-900/30 border-amber-700/40' },
    { label: 'Approved', value: approved.length, style: 'text-sky-300 bg-sky-900/30 border-sky-700/40' },
    { label: 'Rejected', value: rejected.length, style: 'text-rose-300 bg-rose-900/30 border-rose-700/40' },
    { label: 'Published', value: published.length, style: 'text-emerald-300 bg-emerald-900/30 border-emerald-700/40' },
  ]

  const needsAttention = [...rejected, ...draft].slice(0, 5)

  if (isLoading) return <div className='flex justify-center py-12'><Spinner /></div>

  return (
    <div className='space-y-8'>
      <div className='flex items-center gap-3'>
        <BarChart2 size={20} className='text-blue-400' />
        <h1 className='text-xl font-bold text-white'>Author Dashboard</h1>
      </div>

      {/* Summary cards */}
      <div className='grid grid-cols-2 xl:grid-cols-6 gap-4'>
        {stats.map(({ icon: Icon, label, value, color }) => (
          <div key={label} className='p-4 rounded-xl bg-gray-900 border border-gray-800'>
            <Icon size={18} className={`${color} mb-2`} />
            <p className='text-2xl font-bold text-white'>{value}</p>
            <p className='text-xs text-gray-500 mt-1'>{label}</p>
          </div>
        ))}
      </div>

      {/* Submission pipeline */}
      <div className='rounded-2xl border border-gray-800 bg-gray-900/50 p-5 space-y-4'>
        <div className='flex items-center gap-2'>
          <CheckCircle2 size={16} className='text-blue-400' />
          <h2 className='text-sm font-semibold text-gray-200'>Submission status tracking</h2>
        </div>
        <div className='grid grid-cols-2 md:grid-cols-5 gap-3'>
          {workflow.map(item => (
            <div key={item.label} className={`rounded-xl border px-3 py-3 ${item.style}`}>
              <p className='text-xl font-bold'>{item.value}</p>
              <p className='text-xs opacity-80 mt-1'>{item.label}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Needs attention */}
      <div className='rounded-2xl border border-gray-800 bg-gray-900/40 p-5'>
        <div className='flex items-center justify-between mb-4'>
          <div className='flex items-center gap-2'>
            <AlertCircle size={16} className='text-amber-400' />
            <h2 className='text-sm font-semibold text-gray-200'>Needs attention</h2>
          </div>
          <Link to='/library' className='text-xs text-blue-400 hover:text-blue-300'>Open library</Link>
        </div>

        {!needsAttention.length ? (
          <p className='text-sm text-gray-500'>No pending draft or rejected article right now.</p>
        ) : (
          <div className='space-y-2'>
            {needsAttention.map(a => (
              <div key={a.id} className='flex items-center gap-3 rounded-lg border border-gray-800 bg-gray-950/50 px-3 py-2.5'>
                <p className='flex-1 text-sm text-gray-200 truncate'>{a.title}</p>
                <span className='text-xs rounded-full border border-gray-700 px-2 py-0.5 text-gray-300'>
                  {a.status}
                </span>
                <Link to={`/write/${a.id}`} className='text-xs text-blue-400 hover:text-blue-300 inline-flex items-center gap-1'>
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
          <h2 className='text-sm font-semibold text-gray-400 mb-4'>Top performing published articles</h2>
          <div className='space-y-2'>
            {published
              .sort((a, b) => b.views_count - a.views_count)
              .slice(0, 10)
              .map(a => (
                <div key={a.id} className='flex items-center gap-4 p-3 rounded-lg bg-gray-900 border border-gray-800'>
                  <p className='flex-1 text-sm text-white truncate'>{a.title}</p>
                  <span className='flex items-center gap-1 text-xs text-gray-500'>
                    <Eye size={11} /> {a.views_count}
                  </span>
                  <span className='flex items-center gap-1 text-xs text-gray-500'>
                    <Heart size={11} /> {a.likes_count}
                  </span>
                  <span className='flex items-center gap-1 text-xs text-gray-500'>
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

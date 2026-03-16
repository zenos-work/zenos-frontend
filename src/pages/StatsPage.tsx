import { useMyArticles } from '../hooks/useArticles'
import { BarChart2, Eye, Heart, MessageCircle, FileText } from 'lucide-react'
import Spinner from '../components/ui/Spinner'

export default function StatsPage() {
  const { data, isLoading } = useMyArticles()
  const articles = data?.items ?? []

  const published = articles.filter(a => a.status === 'PUBLISHED')
  const totalViews = published.reduce((s, a) => s + a.views_count, 0)
  const totalLikes = published.reduce((s, a) => s + a.likes_count, 0)
  const totalComments = published.reduce((s, a) => s + a.comments_count, 0)

  const stats = [
    { icon: FileText,      label: 'Published',   value: published.length,             color: 'text-blue-400' },
    { icon: Eye,           label: 'Total views',  value: totalViews.toLocaleString(),  color: 'text-green-400' },
    { icon: Heart,         label: 'Total likes',  value: totalLikes.toLocaleString(),  color: 'text-red-400' },
    { icon: MessageCircle, label: 'Comments',     value: totalComments.toLocaleString(),color: 'text-yellow-400' },
  ]

  if (isLoading) return <div className='flex justify-center py-12'><Spinner /></div>

  return (
    <div className='space-y-8'>
      <div className='flex items-center gap-3'>
        <BarChart2 size={20} className='text-blue-400' />
        <h1 className='text-xl font-bold text-white'>Stats</h1>
      </div>

      {/* Summary cards */}
      <div className='grid grid-cols-2 sm:grid-cols-4 gap-4'>
        {stats.map(({ icon: Icon, label, value, color }) => (
          <div key={label} className='p-4 rounded-xl bg-gray-900 border border-gray-800'>
            <Icon size={18} className={`${color} mb-2`} />
            <p className='text-2xl font-bold text-white'>{value}</p>
            <p className='text-xs text-gray-500 mt-1'>{label}</p>
          </div>
        ))}
      </div>

      {/* Per-article breakdown */}
      {published.length > 0 && (
        <div>
          <h2 className='text-sm font-semibold text-gray-400 mb-4'>Per article</h2>
          <div className='space-y-2'>
            {published
              .sort((a, b) => b.views_count - a.views_count)
              .map(a => (
                <div key={a.id} className='flex items-center gap-4 p-3 rounded-lg bg-gray-900 border border-gray-800'>
                  <p className='flex-1 text-sm text-white truncate'>{a.title}</p>
                  <span className='flex items-center gap-1 text-xs text-gray-500'>
                    <Eye size={11} /> {a.views_count}
                  </span>
                  <span className='flex items-center gap-1 text-xs text-gray-500'>
                    <Heart size={11} /> {a.likes_count}
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

import { useParams } from 'react-router-dom'
import { useArticles } from '../hooks/useArticles'
import ArticleCard from '../components/article/ArticleCard'
import Spinner     from '../components/ui/Spinner'
import { Hash } from 'lucide-react'

export default function TagPage() {
  const { slug } = useParams()
  const { data, isLoading } = useArticles({ tag: slug })
  const articles = data?.items ?? []

  return (
    <div className='space-y-6'>
      <div className='flex items-center gap-3'>
        <Hash size={20} className='text-blue-400' />
        <h1 className='text-xl font-bold text-white'>{slug}</h1>
        {!isLoading && (
          <span className='text-sm text-gray-500'>{articles.length} articles</span>
        )}
      </div>

      {isLoading ? (
        <div className='flex justify-center py-12'><Spinner /></div>
      ) : !articles.length ? (
        <div className='text-center py-16 text-gray-500'>
          No published articles with this tag yet.
        </div>
      ) : (
        <div className='space-y-3'>
          {articles.map(a => <ArticleCard key={a.id} article={a} />)}
        </div>
      )}
    </div>
  )
}

import { useSearchParams } from 'react-router-dom'
import { useArticles } from '../hooks/useArticles'
import ArticleCard from '../components/article/ArticleCard'
import Spinner     from '../components/ui/Spinner'
import { Search } from 'lucide-react'

export default function SearchPage() {
  const [params] = useSearchParams()
  const q = params.get('q') ?? ''

  const { data, isLoading } = useArticles({ search: q })
  const articles = data?.items ?? []

  return (
    <div className='space-y-6'>
      <div className='flex items-center gap-3'>
        <Search size={20} className='text-blue-400' />
        <h1 className='text-xl font-bold text-white'>
          {q ? `Results for "${q}"` : 'Search'}
        </h1>
        {!isLoading && q && (
          <span className='text-sm text-gray-500'>{articles.length} found</span>
        )}
      </div>

      {!q ? (
        <p className='text-gray-500'>Enter a search term in the top bar.</p>
      ) : isLoading ? (
        <div className='flex justify-center py-12'><Spinner /></div>
      ) : !articles.length ? (
        <div className='text-center py-16 text-gray-500'>
          <p>No articles found for "{q}"</p>
        </div>
      ) : (
        <div className='space-y-3'>
          {articles.map(a => <ArticleCard key={a.id} article={a} />)}
        </div>
      )}
    </div>
  )
}

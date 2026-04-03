import { useRelatedArticles } from '../../hooks/useArticles'
import ArticleCard from './ArticleCard'
import Spinner from '../ui/Spinner'

interface RelatedArticlesProps {
  articleId: string
  limit?: number
}

export default function RelatedArticles({ articleId, limit = 5 }: RelatedArticlesProps) {
  const { data, isLoading, error } = useRelatedArticles(articleId, limit)
  const related = Array.isArray(data?.related) ? data.related : []

  if (isLoading) {
    return (
      <div className='space-y-4'>
        <h3 className='text-lg font-bold'>Related Articles</h3>
        <Spinner />
      </div>
    )
  }

  if (error || related.length === 0) {
    return null
  }

  return (
    <div className='space-y-4'>
      <h3 className='text-lg font-bold'>Related Articles</h3>
      <div className='grid grid-cols-1 gap-4 sm:grid-cols-2'>
        {related.map((article) => (
          <ArticleCard key={article.id} article={article} />
        ))}
      </div>
    </div>
  )
}

import { useBookmarks } from '../hooks/useSocial'
import ArticleCard from '../components/article/ArticleCard'
import Spinner     from '../components/ui/Spinner'
import { Bookmark } from 'lucide-react'

export default function BookmarksPage() {
  const { data: bookmarks, isLoading } = useBookmarks()

  return (
    <div className='space-y-6'>
      <div className='flex items-center gap-3'>
        <Bookmark size={20} className='text-blue-400' />
        <h1 className='text-xl font-bold text-white'>Saved Articles</h1>
      </div>

      {isLoading ? (
        <div className='flex justify-center py-12'><Spinner /></div>
      ) : !bookmarks?.length ? (
        <div className='text-center py-16 text-gray-500'>
          <Bookmark size={40} className='mx-auto mb-4 opacity-20' />
          <p>No saved articles yet.</p>
          <p className='text-sm mt-1'>Click the bookmark icon on any article to save it here.</p>
        </div>
      ) : (
        <div className='space-y-3'>
          {bookmarks.map(a => <ArticleCard key={a.id} article={a} />)}
        </div>
      )}
    </div>
  )
}

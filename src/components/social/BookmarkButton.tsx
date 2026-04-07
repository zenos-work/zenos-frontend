import { useState } from 'react'
import { Bookmark } from 'lucide-react'
import { useBookmark } from '../../hooks/useSocial'
import { useAuth } from '../../hooks/useAuth'
import { useNavigate } from 'react-router-dom'

export default function BookmarkButton({ articleId }: { articleId: string }) {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [saved, setSaved] = useState(false)
  const mutation = useBookmark(articleId)

  const handle = async () => {
    if (!user) { navigate('/login'); return }
    await mutation.mutateAsync(!saved)
    setSaved(s => !s)
  }

  return (
    <button
      onClick={handle}
      data-testid='bookmark-button'
      aria-label={saved ? 'Remove bookmark' : 'Save bookmark'}
      aria-pressed={saved}
      className={[
        'flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm',
        'border transition-all duration-150',
        saved
          ? 'bg-blue-900/30 border-blue-500/40 text-blue-400'
          : 'bg-gray-800 border-gray-700 text-gray-400 hover:border-blue-500/40 hover:text-blue-400',
      ].join(' ')}
    >
      <Bookmark size={14} className={saved ? 'fill-current' : ''} />
      {saved ? 'Saved' : 'Save'}
    </button>
  )
}

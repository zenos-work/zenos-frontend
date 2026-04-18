import { useState } from 'react'
import { UserPlus } from 'lucide-react'
import { useSearchAuthors } from '../../hooks/useSearch'
import { useAddCoauthor } from '../../hooks/useArticles'
import { useUiStore } from '../../stores/uiStore'

type Props = {
  articleId: string
}

export default function CoauthorPicker({ articleId }: Props) {
  const toast = useUiStore((s) => s.toast)
  const [query, setQuery] = useState('')
  const authors = useSearchAuthors(query, 1, query.trim().length >= 2)
  const addCoauthor = useAddCoauthor(articleId)

  const handleAdd = async (userId: string, name: string) => {
    try {
      await addCoauthor.mutateAsync({ userId })
      toast(`Coauthor added: ${name}`, 'success')
      setQuery('')
    } catch {
      toast('Could not add coauthor', 'error')
    }
  }

  return (
    <div className='rounded-xl border border-[color:var(--border)] bg-[color:var(--surface-1)] p-4'>
      <div className='mb-3 flex items-center gap-2'>
        <UserPlus size={15} className='text-[color:var(--accent)]' />
        <p className='text-xs uppercase tracking-wider text-[color:var(--text-muted)]'>Coauthors</p>
      </div>
      <input
        value={query}
        onChange={(event) => setQuery(event.target.value)}
        placeholder='Search authors by name or email'
        className='h-10 w-full rounded-lg border border-[color:var(--border)] bg-[color:var(--surface-0)] px-3 text-sm text-[color:var(--text-primary)]'
      />
      <div className='mt-3 space-y-2'>
        {query.trim().length < 2 ? (
          <p className='text-xs text-[color:var(--text-muted)]'>Type at least 2 characters to search for collaborators.</p>
        ) : authors.isLoading ? (
          <p className='text-xs text-[color:var(--text-muted)]'>Searching authors...</p>
        ) : !(authors.data?.items?.length ?? 0) ? (
          <p className='text-xs text-[color:var(--text-muted)]'>No matching authors found.</p>
        ) : (
          authors.data?.items.map((author) => (
            <div key={author.id} className='flex items-center justify-between gap-3 rounded-lg border border-[color:var(--border)] bg-[color:var(--surface-0)] px-3 py-2'>
              <div className='min-w-0'>
                <p className='truncate text-sm text-[color:var(--text-primary)]'>{author.name}</p>
                {author.email && <p className='truncate text-xs text-[color:var(--text-muted)]'>{author.email}</p>}
              </div>
              <button
                type='button'
                onClick={() => void handleAdd(author.id, author.name)}
                disabled={addCoauthor.isPending}
                className='rounded-lg border border-[color:var(--accent)] px-3 py-1.5 text-xs font-semibold text-[color:var(--text-primary)] hover:bg-[color:var(--accent-dim)] disabled:opacity-50'
              >
                Add
              </button>
            </div>
          ))
        )}
      </div>
    </div>
  )
}

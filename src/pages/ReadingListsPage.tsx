import { useState } from 'react'
import { BookMarked, ListPlus, Trash2 } from 'lucide-react'
import Spinner from '../components/ui/Spinner'
import Button from '../components/ui/Button'
import SurfaceCard from '../components/ui/SurfaceCard'
import FeatureComingSoon from '../components/ui/FeatureComingSoon'
import { useFeatureFlag } from '../hooks/useFeatureFlags'
import {
  useCreateReadingList,
  useDeleteReadingList,
  useReadingList,
  useReadingLists,
} from '../hooks/useReadingLists'
import { useUiStore } from '../stores/uiStore'

export default function ReadingListsPage() {
  const { enabled, isLoading: flagLoading } = useFeatureFlag('reading_lists')
  const toast = useUiStore((s) => s.toast)
  const { data, isLoading } = useReadingLists(enabled)
  const createMutation = useCreateReadingList()
  const deleteMutation = useDeleteReadingList()
  const [newListName, setNewListName] = useState('')
  const [selectedListId, setSelectedListId] = useState<string | null>(null)
  const selectedList = useReadingList(selectedListId ?? '', !!selectedListId && enabled)

  if (flagLoading) {
    return <div className='flex justify-center py-12'><Spinner /></div>
  }

  if (!enabled) {
    return <FeatureComingSoon name='Reading Lists' description='Create saved collections and curate stories for later reading.' />
  }

  const readingLists = data?.reading_lists ?? []

  const handleCreate = async () => {
    const name = newListName.trim()
    if (!name) {
      toast('Reading list name is required', 'warning')
      return
    }
    try {
      const result = await createMutation.mutateAsync({ name })
      setNewListName('')
      setSelectedListId(result.id)
      toast('Reading list created', 'success')
    } catch {
      toast('Could not create reading list', 'error')
    }
  }

  const handleDelete = async (listId: string, name: string) => {
    if (!confirm(`Delete reading list "${name}"?`)) return
    try {
      await deleteMutation.mutateAsync(listId)
      if (selectedListId === listId) setSelectedListId(null)
      toast('Reading list deleted', 'success')
    } catch {
      toast('Could not delete reading list', 'error')
    }
  }

  return (
    <div className='space-y-6'>
      <div className='flex items-center justify-between gap-3'>
        <div className='flex items-center gap-3'>
          <BookMarked size={20} className='text-[color:var(--accent)]' />
          <div>
            <h1 className='text-xl font-bold text-[color:var(--text-primary)]'>Reading Lists</h1>
            <p className='text-sm text-[color:var(--text-secondary)]'>Curate saved collections and organize articles beyond bookmarks.</p>
          </div>
        </div>
      </div>

      <SurfaceCard>
        <div className='flex flex-col gap-3 md:flex-row md:items-center'>
          <input
            value={newListName}
            onChange={(event) => setNewListName(event.target.value)}
            placeholder='Create a new reading list'
            className='h-11 flex-1 rounded-lg border border-[color:var(--border)] bg-[color:var(--surface-0)] px-3 text-sm text-[color:var(--text-primary)]'
          />
          <Button onClick={() => void handleCreate()} loading={createMutation.isPending}>
            <ListPlus size={15} />
            Create list
          </Button>
        </div>
      </SurfaceCard>

      {isLoading ? (
        <div className='flex justify-center py-12'><Spinner /></div>
      ) : !readingLists.length ? (
        <SurfaceCard>
          <p className='text-sm text-[color:var(--text-secondary)]'>No reading lists yet. Create one above, then start saving articles into it.</p>
        </SurfaceCard>
      ) : (
        <div className='grid gap-4 lg:grid-cols-[320px_minmax(0,1fr)]'>
          <div className='space-y-3'>
            {readingLists.map((list) => (
              <SurfaceCard key={list.id}>
                <div
                  role='button'
                  tabIndex={0}
                  onClick={() => setSelectedListId(list.id)}
                  onKeyDown={(event) => {
                    if (event.key === 'Enter' || event.key === ' ') {
                      event.preventDefault()
                      setSelectedListId(list.id)
                    }
                  }}
                  className='w-full cursor-pointer text-left'
                >
                  <div className='flex items-start justify-between gap-3'>
                    <div>
                      <p className='font-semibold text-[color:var(--text-primary)]'>{list.name}</p>
                      <p className='mt-1 text-xs text-[color:var(--text-muted)]'>
                        {list.article_count} article{list.article_count === 1 ? '' : 's'}
                        {list.is_default ? ' • default' : ''}
                      </p>
                    </div>
                    {!list.is_default && (
                      <button
                        type='button'
                        aria-label={`Delete ${list.name}`}
                        onClick={(event) => {
                          event.stopPropagation()
                          void handleDelete(list.id, list.name)
                        }}
                        className='rounded-lg border border-[color:var(--border)] p-2 text-[color:var(--text-secondary)] hover:bg-[color:var(--surface-2)]'
                      >
                        <Trash2 size={14} />
                      </button>
                    )}
                  </div>
                </div>
              </SurfaceCard>
            ))}
          </div>

          <SurfaceCard>
            {!selectedListId ? (
              <p className='text-sm text-[color:var(--text-secondary)]'>Select a reading list to view its saved items.</p>
            ) : selectedList.isLoading ? (
              <div className='flex justify-center py-10'><Spinner /></div>
            ) : !selectedList.data ? (
              <p className='text-sm text-[color:var(--text-secondary)]'>Could not load this reading list.</p>
            ) : (
              <div className='space-y-4'>
                <div>
                  <h2 className='text-lg font-semibold text-[color:var(--text-primary)]'>{selectedList.data.name}</h2>
                  {selectedList.data.description && (
                    <p className='mt-1 text-sm text-[color:var(--text-secondary)]'>{selectedList.data.description}</p>
                  )}
                </div>

                {!selectedList.data.items.length ? (
                  <p className='text-sm text-[color:var(--text-secondary)]'>No saved items in this list yet.</p>
                ) : (
                  <div className='space-y-3'>
                    {selectedList.data.items.map((item) => (
                      <div key={item.id} className='rounded-lg border border-[color:var(--border)] bg-[color:var(--surface-0)] p-3'>
                        <p className='text-sm font-medium text-[color:var(--text-primary)]'>Article ID: {item.article_id}</p>
                        <p className='mt-1 text-xs text-[color:var(--text-muted)]'>Added {new Date(item.added_at).toLocaleString()}</p>
                        {item.note && <p className='mt-2 text-sm text-[color:var(--text-secondary)]'>{item.note}</p>}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </SurfaceCard>
        </div>
      )}
    </div>
  )
}

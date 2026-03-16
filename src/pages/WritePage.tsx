import { useEffect, useCallback } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useEditorStore }  from '../stores/editorStore'
import { useUiStore }      from '../stores/uiStore'
import { useArticle, useCreateArticle, useUpdateArticle, useSubmitArticle } from '../hooks/useArticles'
import Editor        from '../components/editor/Editor'
import EditorToolbar from '../components/editor/EditorToolbar'
import PreviewPane   from '../components/editor/PreviewPane'
import TagChip       from '../components/ui/TagChip'

export default function WritePage() {
  const { id }    = useParams()
  const navigate  = useNavigate()
  const store     = useEditorStore()
  const toast     = useUiStore(s => s.toast)

  // Load existing article when editing
  const { data: existing } = useArticle(id ?? '')
  useEffect(() => {
    if (!existing) return
    store.setArticleId(existing.id)
    store.setTitle(existing.title)
    store.setSubtitle(existing.subtitle ?? '')
    store.setContent(existing.content)
    store.setCoverImage(existing.cover_image_url ?? '')
    store.setSelectedTags(existing.tags)
  }, [existing?.id])

  // Cleanup on unmount
  useEffect(() => () => store.reset(), [])

  const createMutation = useCreateArticle()
  const updateMutation = useUpdateArticle(id ?? '')
  const submitMutation = useSubmitArticle(id ?? store.articleId ?? '')

  const handleSave = useCallback(async () => {
    if (!store.title.trim()) { toast('Title is required', 'error'); return }
    store.setIsSaving(true)
    try {
      const payload = {
        title:           store.title,
        subtitle:        store.subtitle || undefined,
        content:         store.content,
        cover_image_url: store.coverImageUrl || undefined,
        tag_ids:         store.selectedTags.map(t => t.id),
      }
      if (id) {
        await updateMutation.mutateAsync(payload)
      } else {
        const article = await createMutation.mutateAsync(payload)
        store.setArticleId(article.id)
        navigate(`/write/${article.id}`, { replace: true })
      }
      toast('Draft saved', 'success')
    } catch {
      toast('Save failed — please try again', 'error')
    } finally {
      store.setIsSaving(false)
    }
  }, [store.title, store.content, store.subtitle, store.coverImageUrl, store.selectedTags, id])

  const handleSubmit = async () => {
    await handleSave()
    try {
      await submitMutation.mutateAsync()
      toast('Submitted for review!', 'success')
      navigate('/library')
    } catch {
      toast('Submit failed', 'error')
    }
  }

  return (
    <div className='flex flex-col min-h-[calc(100vh-3.5rem)]'>
      <EditorToolbar
        onSave={handleSave}
        onSubmit={handleSubmit}
        onTogglePreview={store.togglePreview}
        isSaving={store.isSaving}
        isDirty={store.isDirty}
        previewMode={store.previewMode}
      />

      <div className={[
        'flex flex-1 gap-6 pt-6',
        store.previewMode ? '' : 'flex-col',
      ].join(' ')}>

        {/* Editor side */}
        <div className={store.previewMode ? 'w-1/2' : 'w-full'}>
          {/* Cover image URL input */}
          <input
            value={store.coverImageUrl}
            onChange={e => store.setCoverImage(e.target.value)}
            placeholder='Cover image URL (optional)'
            className='w-full mb-4 bg-transparent border-b border-gray-800 pb-2 text-sm text-gray-400 placeholder-gray-700 outline-none focus:border-gray-600 transition-colors'
          />

          {/* Title */}
          <input
            value={store.title}
            onChange={e => store.setTitle(e.target.value)}
            placeholder='Article title...'
            className='w-full mb-3 bg-transparent text-3xl font-bold text-white placeholder-gray-700 outline-none'
          />

          {/* Subtitle */}
          <input
            value={store.subtitle}
            onChange={e => store.setSubtitle(e.target.value)}
            placeholder='Add a subtitle (optional)'
            className='w-full mb-6 bg-transparent text-lg text-gray-400 placeholder-gray-700 outline-none'
          />

          {/* Rich text editor */}
          <Editor content={store.content} onChange={store.setContent} />

          {/* Tags */}
          {store.selectedTags.length > 0 && (
            <div className='flex flex-wrap gap-2 mt-4'>
              {store.selectedTags.map(t => (
                <span key={t.id} onClick={() => store.toggleTag(t)} className='cursor-pointer'>
                  <TagChip tag={t} />
                </span>
              ))}
            </div>
          )}
        </div>

        {/* Preview side */}
        {store.previewMode && (
          <div className='w-1/2 border-l border-gray-800 pl-6 overflow-y-auto'>
            <PreviewPane title={store.title} content={store.content} />
          </div>
        )}
      </div>
    </div>
  )
}

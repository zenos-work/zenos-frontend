import { useEffect, useCallback, useMemo, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useMutation } from '@tanstack/react-query'
import api from '../lib/api'
import { useEditorStore }  from '../stores/editorStore'
import { useUiStore }      from '../stores/uiStore'
import { useArticle, useCreateArticle, useUpdateArticle, useSubmitArticle } from '../hooks/useArticles'
import { useTags }         from '../hooks/useTags'
import Editor        from '../components/editor/Editor'
import EditorToolbar from '../components/editor/EditorToolbar'
import PreviewPane   from '../components/editor/PreviewPane'
import { resolveAssetUrl } from '../lib/assets'

const AUTO_SAVE_MS = 20000

function getApiErrorMessage(err: unknown): string | null {
  if (!err || typeof err !== 'object') return null

  type ApiErrorShape = {
    response?: {
      data?: {
        error?: {
          message?: string
        }
      }
    }
    message?: string
  }

  const maybeError = err as ApiErrorShape
  return maybeError.response?.data?.error?.message ?? maybeError.message ?? null
}

function getWordCount(content: string): number {
  if (!content) return 0
  try {
    const parsed = JSON.parse(content)
    const text = JSON.stringify(parsed)
      .replace(/"type":"[^"]+"/g, ' ')
      .replace(/"attrs":\{[^}]*\}/g, ' ')
      .replace(/"marks":\[[^\]]*\]/g, ' ')
      .replace(/[{}[\]",:]/g, ' ')
      .replace(/\s+/g, ' ')
      .trim()
    return text ? text.split(' ').length : 0
  } catch {
    return content.trim().split(/\s+/).filter(Boolean).length
  }
}

export default function WritePage() {
  const { id }    = useParams()
  const navigate  = useNavigate()
  const store     = useEditorStore()
  const hydrateEditor = useEditorStore(s => s.hydrate)
  const resetEditor = useEditorStore(s => s.reset)
  const toast     = useUiStore(s => s.toast)
  const [tagQuery, setTagQuery] = useState('')

  const { data: allTags } = useTags()

  // Load existing article when editing
  const { data: existing } = useArticle(id ?? '')
  useEffect(() => {
    if (!existing) return
    hydrateEditor({
      articleId: existing.id,
      title: existing.title,
      subtitle: existing.subtitle ?? '',
      content: existing.content,
      coverImageUrl: existing.cover_image_url ?? '',
      selectedTags: existing.tags,
    })
  }, [existing, hydrateEditor])

  // Cleanup on unmount
  useEffect(() => () => resetEditor(), [resetEditor])

  const createMutation = useCreateArticle()
  const updateMutation = useUpdateArticle(id ?? '')
  const submitMutation = useSubmitArticle(id ?? store.articleId ?? '')
  const uploadMutation = useMutation({
    mutationFn: async (file: File) => {
      const res = await api.post<{ url: string; key: string }>(
        '/api/media/upload',
        file,
        { headers: { 'Content-Type': file.type } },
      )
      return res.data
    },
  })

  const contentWordCount = useMemo(() => getWordCount(store.content), [store.content])
  const readTime = Math.max(1, Math.ceil(contentWordCount / 200))

  const availableTags = useMemo(() => {
    const selected = new Set(store.selectedTags.map(t => t.id))
    const q = tagQuery.trim().toLowerCase()
    return (allTags ?? [])
      .filter(t => !selected.has(t.id))
      .filter(t => !q || t.name.toLowerCase().includes(q) || t.slug.toLowerCase().includes(q))
      .slice(0, 20)
  }, [allTags, store.selectedTags, tagQuery])

  const handleSave = useCallback(async () => {
    if (!store.title.trim()) {
      toast('Title is required', 'error')
      return
    }

    const normalizedContent = store.content.trim()
    if (!normalizedContent) {
      toast('Content is required', 'error')
      return
    }

    if (normalizedContent.length < 50) {
      toast('Content must be at least 50 characters long', 'error')
      return
    }

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
      store.markSaved()
      toast('Draft saved', 'success')
    } catch (err) {
      toast(getApiErrorMessage(err) ?? 'Save failed — please try again', 'error')
    } finally {
      store.setIsSaving(false)
    }
  }, [store, id, toast, updateMutation, createMutation, navigate])

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 's') {
        e.preventDefault()
        void handleSave()
      }
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [handleSave])

  useEffect(() => {
    if (!store.isDirty || !store.title.trim()) return
    if (!id && !store.articleId) return
    const timer = window.setTimeout(() => {
      void handleSave()
    }, AUTO_SAVE_MS)
    return () => window.clearTimeout(timer)
  }, [store.isDirty, store.title, store.content, store.subtitle, store.coverImageUrl, store.selectedTags, id, store.articleId, handleSave])

  const uploadImageFile = async (file: File): Promise<string> => {
    if (!file.type.startsWith('image/')) {
      throw new Error('Please choose an image file')
    }
    const result = await uploadMutation.mutateAsync(file)
    return result.url
  }

  const handleCoverFileUpload = async (file: File | undefined) => {
    if (!file) return
    try {
      const url = await uploadImageFile(file)
      store.setCoverImage(url)
      toast('Cover uploaded', 'success')
    } catch (err) {
      toast(getApiErrorMessage(err) ?? 'Cover upload failed', 'error')
    }
  }

  const handleInlineImageUpload = async (file: File) => {
    try {
      const url = await uploadImageFile(file)
      toast('Image inserted', 'success')
      return url
    } catch (err) {
      toast(getApiErrorMessage(err) ?? 'Inline image upload failed', 'error')
      throw err
    }
  }

  const handleSubmit = async () => {
    if (contentWordCount < 80) {
      toast('Add more content before submitting (minimum ~80 words)', 'warning')
      return
    }
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
          <div className='mb-4 flex items-center gap-3'>
            <label className='text-xs text-gray-500'>or upload cover:</label>
            <input
              type='file'
              accept='image/*'
              onChange={e => void handleCoverFileUpload(e.target.files?.[0])}
              className='block text-xs text-gray-400 file:mr-3 file:rounded-md file:border-0 file:bg-gray-800 file:px-3 file:py-1.5 file:text-xs file:font-medium file:text-gray-200 hover:file:bg-gray-700'
            />
          </div>

          {store.coverImageUrl && (
            <img
              src={resolveAssetUrl(store.coverImageUrl)}
              alt='Cover preview'
              className='mb-6 w-full h-64 object-cover rounded-xl border border-gray-800'
              loading='lazy'
            />
          )}

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
          <Editor
            content={store.content}
            onChange={store.setContent}
            onInlineImageUpload={handleInlineImageUpload}
          />

          {/* Tags */}
          <div className='mt-6 rounded-xl border border-gray-800 p-4 bg-gray-900/30'>
            <div className='flex items-center justify-between gap-3 mb-3'>
              <p className='text-xs uppercase tracking-wider text-gray-500'>Tags</p>
              <span className='text-xs text-gray-500'>{store.selectedTags.length} selected</span>
            </div>

            <input
              value={tagQuery}
              onChange={e => setTagQuery(e.target.value)}
              placeholder='Search tags...'
              className='w-full mb-3 rounded-lg bg-gray-900 border border-gray-700 px-3 py-2 text-sm text-gray-200 placeholder-gray-600 outline-none focus:border-gray-500'
            />

            {store.selectedTags.length > 0 && (
              <div className='flex flex-wrap gap-2 mb-3'>
                {store.selectedTags.map(t => (
                  <button
                    key={t.id}
                    onClick={() => store.toggleTag(t)}
                    className='rounded-full px-3 py-1 text-xs bg-blue-900/40 border border-blue-700 text-blue-200 hover:bg-blue-800/50 transition-colors'
                    title='Click to remove'
                  >
                    #{t.name}
                  </button>
                ))}
              </div>
            )}

            <div className='flex flex-wrap gap-2'>
              {availableTags.map(t => (
                <button
                  key={t.id}
                  onClick={() => store.toggleTag(t)}
                  className='rounded-full px-3 py-1 text-xs bg-gray-800 border border-gray-700 text-gray-300 hover:bg-gray-700 transition-colors'
                >
                  + {t.name}
                </button>
              ))}
              {!availableTags.length && (
                <p className='text-xs text-gray-500'>No matching tags found.</p>
              )}
            </div>
          </div>

          <div className='mt-4 flex flex-wrap items-center gap-3 text-xs text-gray-500'>
            <span>{contentWordCount} words</span>
            <span>~{readTime} min read</span>
            {store.isDirty && <span className='text-amber-400'>Unsaved edits</span>}
            {!store.isDirty && <span className='text-emerald-400'>All changes saved</span>}
          </div>

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

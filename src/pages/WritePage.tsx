import { useEffect, useCallback, useMemo, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useMutation } from '@tanstack/react-query'
import { Upload } from 'lucide-react'
import api from '../lib/api'
import { useEditorStore }  from '../stores/editorStore'
import { useUiStore }      from '../stores/uiStore'
import { useArticle, useCreateArticle, useUpdateArticle, useSubmitArticle } from '../hooks/useArticles'
import { useTags }         from '../hooks/useTags'
import { useAuth }         from '../hooks/useAuth'
import Editor        from '../components/editor/Editor'
import EditorToolbar from '../components/editor/EditorToolbar'
import PreviewPane   from '../components/editor/PreviewPane'
import { resolveAssetUrl } from '../lib/assets'

const AUTO_SAVE_MS = 20000

function omitEmptyFields<T extends Record<string, unknown>>(payload: T): Partial<T> {
  return Object.fromEntries(
    Object.entries(payload).filter(([, value]) => value !== undefined && value !== ''),
  ) as Partial<T>
}

type ArticleDraftPayload = {
  title: string
  content: string
  subtitle?: string
  cover_image_url?: string
  tag_ids?: string[]
}

type Approver = {
  id: string
  name: string
  role: 'SUPERADMIN' | 'APPROVER' | 'AUTHOR' | 'READER'
  avatar_url?: string
}

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

function normalizeTagName(raw: string): string {
  return raw.trim().replace(/^#+\s*/, '')
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
  const { user }  = useAuth()
  const store     = useEditorStore()
  const hydrateEditor = useEditorStore(s => s.hydrate)
  const resetEditor = useEditorStore(s => s.reset)
  const toast     = useUiStore(s => s.toast)
  const [tagQuery, setTagQuery] = useState('')
  const [localTags, setLocalTags] = useState<Array<{ id: string; name: string; slug: string; article_count: number }>>([])
  const [newTagName, setNewTagName] = useState('')
  const [creatingTag, setCreatingTag] = useState(false)
  const [approvers, setApprovers] = useState<Approver[]>([])
  const [approversLoading, setApproversLoading] = useState(false)
  const [approversError, setApproversError] = useState<string | null>(null)
  const [recipientMode, setRecipientMode] = useState<'group' | 'individual'>('group')
  const [selectedApproverIds, setSelectedApproverIds] = useState<string[]>([])
  const [approvalMessage, setApprovalMessage] = useState('')
  const [sendingApprovalMessage, setSendingApprovalMessage] = useState(false)
  const [uploadTarget, setUploadTarget] = useState<'inline-image' | 'cover-image' | null>(null)
  const [uploadProgressPct, setUploadProgressPct] = useState<number | null>(null)

  const {
    data: allTags,
    isLoading: tagsLoading,
    isError: tagsError,
  } = useTags()

  useEffect(() => {
    setLocalTags(allTags ?? [])
  }, [allTags])

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
  const updateMutation = useUpdateArticle(id ?? store.articleId ?? '')
  const submitMutation = useSubmitArticle()
  const uploadMutation = useMutation({
    mutationFn: async ({ file, onProgress }: { file: File; onProgress?: (pct: number) => void }) => {
      const res = await api.post<{ url: string; key: string }>(
        '/api/media/upload',
        file,
        {
          headers: { 'Content-Type': file.type },
          onUploadProgress: (event) => {
            if (!event.total) return
            const pct = Math.min(100, Math.max(1, Math.round((event.loaded * 100) / event.total)))
            onProgress?.(pct)
          },
        },
      )
      return res.data
    },
  })

  const contentWordCount = useMemo(() => getWordCount(store.content), [store.content])
  const readTime = Math.max(1, Math.ceil(contentWordCount / 200))

  const availableTags = useMemo(() => {
    const selected = new Set(store.selectedTags.map(t => t.id))
    const q = tagQuery.trim().toLowerCase()
    return (localTags ?? [])
      .filter(t => !selected.has(t.id))
      .filter(t => !q || t.name.toLowerCase().includes(q) || t.slug.toLowerCase().includes(q))
      .slice(0, 20)
  }, [localTags, store.selectedTags, tagQuery])

  const canManageTags = user?.role === 'AUTHOR' || user?.role === 'APPROVER' || user?.role === 'SUPERADMIN'
  const showApprovalPanel = !!existing && (existing.status === 'SUBMITTED' || existing.status === 'APPROVED')

  useEffect(() => {
    if (!showApprovalPanel || !canManageTags) return
    let cancelled = false

    const loadApprovers = async () => {
      setApproversLoading(true)
      setApproversError(null)
      try {
        const res = await api.get<{ approvers: Approver[] }>('/api/users/approvers')
        if (cancelled) return
        setApprovers(res.data.approvers ?? [])
      } catch {
        if (cancelled) return
        setApproversError('Could not load approvers right now.')
      } finally {
        if (!cancelled) setApproversLoading(false)
      }
    }

    void loadApprovers()
    return () => {
      cancelled = true
    }
  }, [showApprovalPanel, canManageTags])

  const handleCreateTag = async () => {
    const name = normalizeTagName(newTagName)
    if (!name) {
      toast('Tag name is required', 'warning')
      return
    }
    setCreatingTag(true)
    try {
      const res = await api.post<{ tag: { id: string; name: string; slug: string; article_count: number } }>(
        '/api/tags',
        { name },
      )
      const created = res.data.tag
      setLocalTags((prev) => {
        if (prev.some((t) => t.id === created.id || t.slug === created.slug)) return prev
        return [...prev, created]
      })
      store.toggleTag(created)
      setNewTagName('')
      toast(`Tag created: ${created.name}`, 'success')
    } catch (err) {
      toast(getApiErrorMessage(err) ?? 'Could not create tag', 'error')
    } finally {
      setCreatingTag(false)
    }
  }

  const toggleApprover = (approverId: string) => {
    setSelectedApproverIds((prev) =>
      prev.includes(approverId) ? prev.filter((id) => id !== approverId) : [...prev, approverId],
    )
  }

  const sendApprovalMessage = async () => {
    const message = approvalMessage.trim()
    if (!message) {
      toast('Write a message before sending', 'warning')
      return
    }

    const articleId = existing?.id ?? id ?? store.articleId
    if (!articleId) {
      toast('Save the draft first before messaging approvers', 'warning')
      return
    }

    if (recipientMode === 'individual' && selectedApproverIds.length === 0) {
      toast('Select at least one approver', 'warning')
      return
    }

    setSendingApprovalMessage(true)
    try {
      await api.post('/api/users/approvers/message', {
        article_id: articleId,
        mode: recipientMode,
        recipient_ids: selectedApproverIds,
        message,
      })
      setApprovalMessage('')
      toast('Message sent to approvers', 'success')
    } catch (err) {
      toast(getApiErrorMessage(err) ?? 'Could not send message to approvers', 'error')
    } finally {
      setSendingApprovalMessage(false)
    }
  }

  const handleSave = useCallback(async (): Promise<string | undefined> => {
    if (!store.title.trim()) {
      toast('Title is required', 'error')
      return undefined
    }

    const normalizedContent = store.content.trim()
    if (!normalizedContent) {
      toast('Content is required', 'error')
      return undefined
    }

    if (normalizedContent.length < 50) {
      toast('Content must be at least 50 characters long', 'error')
      return undefined
    }

    store.setIsSaving(true)
    try {
      const payload: ArticleDraftPayload = {
        title:           store.title,
        content:         store.content,
        tag_ids:         store.selectedTags.map(t => t.id),
      }
      const optionalFields = omitEmptyFields({
        subtitle: store.subtitle || undefined,
        cover_image_url: store.coverImageUrl || undefined,
      })
      Object.assign(payload, optionalFields)
      const targetArticleId = id ?? store.articleId

      if (targetArticleId) {
        await updateMutation.mutateAsync(payload)
        store.markSaved()
        toast('Draft saved', 'success')
        return targetArticleId
      } else {
        const article = await createMutation.mutateAsync(payload)
        store.setArticleId(article.id)
        navigate(`/write/${article.id}`, { replace: true })
        store.markSaved()
        toast('Draft saved', 'success')
        return article.id
      }
    } catch (err) {
      toast(getApiErrorMessage(err) ?? 'Save failed — please try again', 'error')
      return undefined
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

  const uploadImageFile = async (file: File, onProgress?: (pct: number) => void): Promise<string> => {
    if (!file.type.startsWith('image/')) {
      throw new Error('Please choose an image file')
    }
    const result = await uploadMutation.mutateAsync({ file, onProgress })
    return result.url
  }

  const inlineUploadInProgress = uploadMutation.isPending && uploadTarget === 'inline-image'
  const coverUploadInProgress = uploadMutation.isPending && uploadTarget === 'cover-image'
  const inlineUploadStatusText = inlineUploadInProgress
    ? `Uploading image${uploadProgressPct ? `... ${uploadProgressPct}%` : '...'}`
    : undefined

  const handleInlineImageUpload = async (file: File) => {
    setUploadTarget('inline-image')
    setUploadProgressPct(0)
    try {
      const url = await uploadImageFile(file, (pct) => setUploadProgressPct(pct))
      toast('Image inserted', 'success')
      return url
    } catch (err) {
      toast(getApiErrorMessage(err) ?? 'Inline image upload failed', 'error')
      throw err
    } finally {
      setUploadTarget(null)
      setUploadProgressPct(null)
    }
  }

  const handleCoverUpload = async (file: File | undefined) => {
    if (!file) return
    setUploadTarget('cover-image')
    setUploadProgressPct(0)
    try {
      const url = await uploadImageFile(file, (pct) => setUploadProgressPct(pct))
      store.setCoverImage(url)
      toast('Cover image uploaded', 'success')
    } catch (err) {
      toast(getApiErrorMessage(err) ?? 'Cover image upload failed', 'error')
    } finally {
      setUploadTarget(null)
      setUploadProgressPct(null)
    }
  }

  const handleSubmit = async () => {
    if (contentWordCount < 80) {
      toast('Add more content before submitting (minimum ~80 words)', 'warning')
      return
    }
    const articleId = await handleSave()
    if (!articleId) {
      return
    }
    try {
      await submitMutation.mutateAsync(articleId)
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
          <div className='mb-4 rounded-xl border border-[color:var(--border)] bg-[color:var(--surface-1)] p-3'>
            <div className='flex flex-wrap items-center justify-between gap-3'>
              <p className='text-xs uppercase tracking-wider text-[color:var(--text-muted)]'>Cover Image</p>
              <label className='inline-flex cursor-pointer items-center gap-2 rounded-lg border border-[color:var(--border-strong)] bg-[color:var(--surface-0)] px-3 py-1.5 text-xs text-[color:var(--text-primary)] hover:bg-[color:var(--surface-2)]'>
                <Upload size={13} />
                {coverUploadInProgress
                  ? `Uploading${uploadProgressPct ? ` ${uploadProgressPct}%` : '...'}`
                  : 'Upload image'}
                <input
                  type='file'
                  accept='image/*'
                  className='hidden'
                  onChange={e => void handleCoverUpload(e.target.files?.[0])}
                />
              </label>
            </div>
            {coverUploadInProgress && (
              <p className='mt-2 text-xs text-[color:var(--text-muted)]'>Cover upload in progress. Please wait...</p>
            )}
            <input
              value={store.coverImageUrl}
              onChange={e => store.setCoverImage(e.target.value)}
              placeholder='Or paste cover image URL (optional)'
              className='mt-3 w-full bg-transparent border-b border-[color:var(--border-strong)] pb-2 text-sm text-[color:var(--text-secondary)] placeholder-[color:var(--text-muted)] outline-none focus:border-[color:var(--accent)] transition-colors'
            />
          </div>

          {store.coverImageUrl && (
            <img
              src={resolveAssetUrl(store.coverImageUrl)}
              alt='Cover preview'
              className='mb-6 w-full h-64 object-cover rounded-xl border border-[color:var(--border-strong)]'
              loading='lazy'
            />
          )}

          {/* Title */}
          <input
            value={store.title}
            onChange={e => store.setTitle(e.target.value)}
            placeholder='Article title...'
            className='w-full mb-3 bg-transparent text-3xl font-bold text-[color:var(--text-primary)] placeholder-[color:var(--text-muted)] outline-none'
          />

          {/* Subtitle */}
          <input
            value={store.subtitle}
            onChange={e => store.setSubtitle(e.target.value)}
            placeholder='Add a subtitle (optional)'
            className='w-full mb-6 bg-transparent text-lg text-[color:var(--text-secondary)] placeholder-[color:var(--text-muted)] outline-none'
          />

          {/* Rich text editor */}
          <Editor
            content={store.content}
            onChange={store.setContent}
            onInlineImageUpload={handleInlineImageUpload}
            isInlineUploadInProgress={inlineUploadInProgress}
            inlineUploadStatusText={inlineUploadStatusText}
          />

          {/* Tags */}
          <div className='mt-6 rounded-xl border border-[color:var(--border-strong)] p-4 bg-[color:var(--surface-1)]/70'>
            <div className='flex items-center justify-between gap-3 mb-3'>
              <p className='text-xs uppercase tracking-wider text-[color:var(--text-muted)]'>Tags</p>
              <span className='text-xs text-[color:var(--text-muted)]'>{store.selectedTags.length} selected</span>
            </div>

            <input
              value={tagQuery}
              onChange={e => setTagQuery(e.target.value)}
              placeholder='Search tags...'
              className='w-full mb-3 rounded-lg bg-[color:var(--surface-0)] border border-[color:var(--border)] px-3 py-2 text-sm text-[color:var(--text-primary)] placeholder-[color:var(--text-muted)] outline-none focus:border-[color:var(--accent)]'
            />

            {canManageTags && (
              <div className='mb-3 flex flex-col gap-2 sm:flex-row sm:items-center'>
                <input
                  value={newTagName}
                  onChange={(e) => setNewTagName(e.target.value)}
                  placeholder='Create a new tag (e.g. fintech or #fintech)'
                  className='w-full rounded-lg bg-[color:var(--surface-0)] border border-[color:var(--border)] px-3 py-2 text-sm text-[color:var(--text-primary)] placeholder-[color:var(--text-muted)] outline-none focus:border-[color:var(--accent)]'
                />
                <button
                  onClick={() => void handleCreateTag()}
                  disabled={creatingTag || !newTagName.trim()}
                  className='rounded-lg border border-[color:var(--accent)] px-3 py-2 text-xs font-semibold text-[color:var(--text-primary)] hover:bg-[color:var(--accent-dim)] disabled:cursor-not-allowed disabled:opacity-50'
                >
                  {creatingTag ? 'Creating...' : 'Add Tag'}
                </button>
              </div>
            )}

            {store.selectedTags.length > 0 && (
              <div className='flex flex-wrap gap-2 mb-3'>
                {store.selectedTags.map(t => (
                  <button
                    key={t.id}
                    onClick={() => store.toggleTag(t)}
                    className='rounded-full px-3 py-1 text-xs bg-[color:var(--accent-dim)] border border-[color:var(--accent)] text-[color:var(--text-primary)] hover:opacity-90 transition-colors'
                    title='Click to remove'
                  >
                    #{t.name}
                  </button>
                ))}
              </div>
            )}

            <div className='flex flex-wrap gap-2'>
              {tagsLoading && (
                <p className='text-xs text-[color:var(--text-muted)]'>Loading tags...</p>
              )}
              {tagsError && (
                <p className='text-xs text-rose-700'>Could not load tags. Please refresh or check API connectivity.</p>
              )}
              {availableTags.map(t => (
                <button
                  key={t.id}
                  onClick={() => store.toggleTag(t)}
                  className='rounded-full px-3 py-1 text-xs bg-[color:var(--surface-2)] border border-[color:var(--border)] text-[color:var(--text-secondary)] hover:bg-[color:var(--surface-3)] transition-colors'
                >
                  + {t.name}
                </button>
              ))}
              {!availableTags.length && (
                <p className='text-xs text-[color:var(--text-muted)]'>
                  {(localTags?.length ?? 0) === 0 ? 'No tags available yet. Create one above.' : 'No matching tags found.'}
                </p>
              )}
            </div>
          </div>

          {showApprovalPanel && (
            <div className='mt-6 rounded-xl border border-[color:var(--border-strong)] p-4 bg-[color:var(--surface-1)]/70 space-y-4'>
              <div>
                <p className='text-xs uppercase tracking-wider text-[color:var(--text-muted)]'>Approval status</p>
                <p className='text-sm text-[color:var(--text-primary)] mt-1'>
                  {existing?.status === 'SUBMITTED'
                    ? 'Pending with Approver Group (APPROVER + SUPERADMIN)'
                    : 'Approved. Pending with Publishing Group (SUPERADMIN)'}
                </p>
              </div>

              <div>
                <p className='text-xs uppercase tracking-wider text-[color:var(--text-muted)] mb-2'>Approvers</p>
                {approversLoading && <p className='text-xs text-[color:var(--text-muted)]'>Loading approvers...</p>}
                {approversError && <p className='text-xs text-rose-700'>{approversError}</p>}
                {!approversLoading && !approversError && (
                  <div className='flex flex-wrap gap-2'>
                    {approvers.map((approver) => (
                      <label
                        key={approver.id}
                        className='inline-flex items-center gap-2 rounded-full border border-[color:var(--border)] bg-[color:var(--surface-0)] px-3 py-1 text-xs text-[color:var(--text-secondary)]'
                      >
                        <input
                          type='checkbox'
                          checked={selectedApproverIds.includes(approver.id)}
                          onChange={() => toggleApprover(approver.id)}
                          disabled={recipientMode !== 'individual'}
                        />
                        <span>{approver.name}</span>
                        <span className='text-[color:var(--text-muted)]'>({approver.role})</span>
                      </label>
                    ))}
                  </div>
                )}
              </div>

              <div className='space-y-2'>
                <p className='text-xs uppercase tracking-wider text-[color:var(--text-muted)]'>Chat with approvers</p>
                <div className='flex flex-wrap items-center gap-3 text-xs'>
                  <label className='inline-flex items-center gap-2 text-[color:var(--text-secondary)]'>
                    <input
                      type='radio'
                      name='recipientMode'
                      checked={recipientMode === 'group'}
                      onChange={() => setRecipientMode('group')}
                    />
                    Group
                  </label>
                  <label className='inline-flex items-center gap-2 text-[color:var(--text-secondary)]'>
                    <input
                      type='radio'
                      name='recipientMode'
                      checked={recipientMode === 'individual'}
                      onChange={() => setRecipientMode('individual')}
                    />
                    Individual
                  </label>
                </div>
                <textarea
                  value={approvalMessage}
                  onChange={(e) => setApprovalMessage(e.target.value)}
                  rows={3}
                  placeholder='Write a message to approvers...'
                  className='w-full rounded-lg bg-[color:var(--surface-0)] border border-[color:var(--border)] px-3 py-2 text-sm text-[color:var(--text-primary)] placeholder-[color:var(--text-muted)] outline-none focus:border-[color:var(--accent)]'
                />
                <button
                  onClick={() => void sendApprovalMessage()}
                  disabled={sendingApprovalMessage}
                  className='rounded-lg border border-[color:var(--accent)] px-3 py-2 text-xs font-semibold text-[color:var(--text-primary)] hover:bg-[color:var(--accent-dim)] disabled:cursor-not-allowed disabled:opacity-50'
                >
                  {sendingApprovalMessage ? 'Sending...' : 'Send message'}
                </button>
              </div>
            </div>
          )}

          <div className='mt-4 flex flex-wrap items-center gap-3 text-xs text-[color:var(--text-muted)]'>
            <span>{contentWordCount} words</span>
            <span>~{readTime} min read</span>
            {store.isDirty && <span className='text-amber-700'>Unsaved edits</span>}
            {!store.isDirty && <span className='text-emerald-700'>All changes saved</span>}
          </div>

        </div>

        {/* Preview side */}
        {store.previewMode && (
          <div className='w-1/2 border-l border-[color:var(--border)] pl-6 overflow-y-auto'>
            <PreviewPane title={store.title} content={store.content} />
          </div>
        )}
      </div>
    </div>
  )
}
